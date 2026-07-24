import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import test from 'node:test'
import { markdownToHtml } from 'satteri'
import { temmlMath } from '../src/lib/math.ts'

const root = new URL('../', import.meta.url)

test('ships complete Temml CSS and the STIX math font', async () => {
  const [css, layout, font] = await Promise.all([
    readFile(new URL('src/styles/typography-math.css', root), 'utf8'),
    readFile(new URL('src/layouts/layout.astro', root), 'utf8'),
    stat(new URL('src/assets/fonts/STIXTwoMath-Regular.woff2', root)),
  ])

  assert.match(layout, /typography-math\.css/)
  assert.match(css, /@font-face[\s\S]*STIX Two Math[\s\S]*font-display:\s*swap/)
  assert.match(css, /\.prose/)
  assert.match(css, /mfrac\s*>/)
  assert.match(css, /msqrt/)
  assert.match(css, /\.tml-eqn/)
  assert.match(css, /\.longdiv-arc/)
  assert.match(css, /\.phasor-angle/)
  assert.match(css, /@supports\s+\(-moz-appearance:\s*none\)/)
  assert.match(css, /@supports\s+\(-webkit-backdrop-filter:\s*blur\(1px\)\)/)
  assert.ok(font.size > 250_000)
})

test('renders inline and display MathML through Temml', () => {
  const { html } = markdownToHtml(
    'Inline $x^2$ and display:\n\n$$\\frac{a}{b}$$',
    { features: { math: true }, mdastPlugins: [temmlMath] },
  )

  assert.match(html, /<math/)
  assert.match(html, /<math-display>/)
  assert.match(html, /<mfrac>/)
})
