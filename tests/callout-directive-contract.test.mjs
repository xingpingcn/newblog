import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { markdownToHtml } from 'satteri'

const root = new URL('../', import.meta.url)

test('renders every configured Markdown Callout through Satteri', async () => {
  const { CALLOUT_CONFIG, CALLOUT_VARIANTS } = await import(
    '../src/lib/callout-config.ts'
  )
  const { calloutDirective } = await import('../src/lib/callout.ts')

  assert.equal(CALLOUT_VARIANTS.length, 25)
  assert.deepEqual(
    {
      icon: CALLOUT_CONFIG.caution.icon,
      style: CALLOUT_CONFIG.caution.style,
      textColor: CALLOUT_CONFIG.caution.textColor,
    },
    {
      icon: CALLOUT_CONFIG.danger.icon,
      style: CALLOUT_CONFIG.danger.style,
      textColor: CALLOUT_CONFIG.danger.textColor,
    },
  )

  for (const variant of CALLOUT_VARIANTS) {
    const { html } = markdownToHtml(
      `:::${variant}[Contract title]{closed}\nBody with **Markdown**.\n:::`,
      {
        features: { directive: true },
        mdastPlugins: [calloutDirective],
      },
    )

    assert.match(html, new RegExp(`data-callout="${variant}"`))
    assert.match(html, /<details/)
    assert.doesNotMatch(html, /<details[^>]* open/)
    assert.match(html, /Contract title/)
    assert.match(html, /<strong>Markdown<\/strong>/)
    assert.match(html, /<svg[^>]*aria-hidden="true"/)
  }

  const { html: openHtml } = markdownToHtml(
    ':::note[Open title]\nVisible body.\n:::',
    {
      features: { directive: true },
      mdastPlugins: [calloutDirective],
    },
  )
  assert.match(openHtml, /<details[^>]* open/)
})

test('keeps old component authoring and makes directives the default snippet', async () => {
  const [component, config, layout, snippets] = await Promise.all([
    readFile(new URL('src/components/callout.astro', root), 'utf8'),
    readFile(new URL('astro.config.ts', root), 'utf8'),
    readFile(new URL('src/layouts/layout.astro', root), 'utf8'),
    readFile(new URL('.vscode/mdx.code-snippets', root), 'utf8'),
  ])

  assert.match(component, /callout-config/)
  assert.match(component, /data-callout=\{variant\}/)
  assert.match(config, /features:\s*\{\s*directive:\s*true,\s*math:\s*true\s*\}/)
  assert.match(config, /mdastPlugins:\s*\[[^\]]*calloutDirective/)
  assert.match(layout, /typography-callout\.css/)
  assert.match(snippets, /"prefix":\s*"callout"[\s\S]*?:::\$\{1\|/)
  assert.match(snippets, /"prefix":\s*"callout-component"/)
  assert.match(snippets, /"prefix":\s*"callout-component-folded"/)
})

test('escapes unsafe directive labels as text', async () => {
  const { calloutDirective } = await import('../src/lib/callout.ts')
  const label = '<script>alert(1)</script><img src=x onerror=alert(1)> &'
  const { html } = markdownToHtml(`:::note[${label}]\nBody.\n:::`, {
    features: { directive: true },
    mdastPlugins: [calloutDirective],
  })

  assert.match(html, /(?:&lt;|&#x3c;)script(?:&gt;|>)/i)
  assert.match(html, /(?:&lt;|&#x3c;)img src=x onerror=alert\(1\)(?:&gt;|>)/i)
  assert.match(html, /(?:&amp;|&#x26;)/i)
  assert.doesNotMatch(html, /<script\b/i)
  assert.doesNotMatch(html, /<img\b/i)
})
