import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = new URL('../', import.meta.url)
const codePage = await readFile(
  new URL('dist/docker-learning-notes/index.html', root),
  'utf8',
)
const astroConfig = await readFile(new URL('astro.config.ts', root), 'utf8')
const mathPlugin = await readFile(new URL('src/lib/math.ts', root), 'utf8')
const codeConfig = await readFile(
  new URL('src/lib/expressive-code/config.ts', root),
  'utf8',
)
const inlineCodePlugin = await readFile(
  new URL('src/lib/expressive-code/inline.ts', root),
  'utf8',
)

assert.match(codePage, /class="expressive-code"/)
assert.match(codePage, /class="frame has-title/)
assert.match(codePage, /data-heading-anchor/)
assert.match(codePage, /target="_blank"/)
assert.match(codePage, /rel="nofollow noreferrer noopener"/)
assert.doesNotMatch(codePage, /katex\.min\.css/)
assert.match(codePage, /class="gutter"/)
assert.match(
  astroConfig,
  /features:\s*\{\s*directive:\s*true,\s*math:\s*true\s*\}/,
)
assert.match(astroConfig, /mdastPlugins:\s*\[[^\]]*temmlMath/)
assert.match(mathPlugin, /inlineMath\(node,\s*ctx\)/)
assert.match(mathPlugin, /math\(node,\s*ctx\)/)
assert.match(mathPlugin, /displayMode:\s*true/)
assert.match(codeConfig, /pluginCollapsibleSections\(\)/)
assert.match(codeConfig, /pluginLineNumbers\(\)/)
assert.match(codeConfig, /showLineNumbers:\s*true/)
assert.match(inlineCodePlugin, /async inlineCode\(node,\s*ctx\)/)
assert.match(inlineCodePlugin, /dataEc:\s*''/)
