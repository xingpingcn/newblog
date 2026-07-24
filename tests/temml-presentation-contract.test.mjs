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

function renderMath(markdown) {
  return markdownToHtml(markdown, {
    features: { math: true },
    mdastPlugins: [temmlMath],
  }).html
}

test('keeps ordinary single-dollar math inline', () => {
  const html = renderMath('Inline $x^2$ after')

  assert.match(html, /<math/)
  assert.doesNotMatch(html, /<math-display>/)
})

test('renders same-line double-dollar math as display', () => {
  const html = renderMath('Before $$\\frac{a}{b}$$ after')

  assert.match(html, /<math-display>/)
  assert.match(html, /<mfrac>/)
})

test('renders canonical multiline math as display', () => {
  const html = renderMath('$$\n\\frac{a}{b}\n$$')

  assert.match(html, /<math-display>/)
  assert.match(html, /<mfrac>/)
})

test('detects same-line display math after an astral character', () => {
  const html = renderMath('😀 $$x$$ after')

  assert.match(html, /<math-display>/)
})

test('does not promote an ambiguous triple-dollar run to display', () => {
  const html = renderMath('Before $$$x$$$ after')

  assert.match(html, /<math/)
  assert.doesNotMatch(html, /<math-display>/)
})
