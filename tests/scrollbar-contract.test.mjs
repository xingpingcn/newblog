import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const root = new URL('../', import.meta.url)

test('applies Umami scrollbar geometry to every WebKit scrollbar', async () => {
  const css = await readFile(new URL('src/styles/global.css', root), 'utf8')

  assert.match(css, /(^|\n)::[-]webkit-scrollbar\s*\{[\s\S]*?width:\s*15px/)
  assert.match(
    css,
    /(^|\n)::[-]webkit-scrollbar-track\s*\{[\s\S]*?border:\s*7px solid transparent/,
  )
  assert.match(
    css,
    /(^|\n)::[-]webkit-scrollbar-thumb\s*\{[\s\S]*?border:\s*7px solid transparent/,
  )
  assert.match(
    css,
    /(^|\n)::[-]webkit-scrollbar-thumb:hover\s*\{[\s\S]*?border:\s*4px solid transparent/,
  )
  assert.match(css, /background-color:\s*var\(--border\)/)
  assert.match(css, /background-color:\s*var\(--muted-foreground\)/)
  assert.match(css, /border-radius:\s*9999px/)
  assert.match(css, /background-clip:\s*padding-box/)
  assert.doesNotMatch(css, /html::[-]webkit-scrollbar/)
  assert.doesNotMatch(css, /scrollbar-(?:width|color)\s*:/)
})

test('overrides Expressive Code scrollbar chrome with Umami geometry', async () => {
  const css = await readFile(new URL('src/styles/typography.css', root), 'utf8')

  assert.match(
    css,
    /\.prose\s+\.expressive-code\s+pre::[-]webkit-scrollbar\s*\{[\s\S]*?height:\s*15px/,
  )
  assert.match(
    css,
    /\.prose\s+\.expressive-code\s+pre::[-]webkit-scrollbar-track\s*\{[\s\S]*?border:\s*7px solid transparent/,
  )
  assert.match(
    css,
    /\.prose\s+\.expressive-code\s+pre::[-]webkit-scrollbar-thumb\s*\{[\s\S]*?border:\s*7px solid transparent/,
  )
  assert.match(
    css,
    /\.prose\s+\.expressive-code\s+pre::[-]webkit-scrollbar-thumb:hover\s*\{[\s\S]*?border:\s*4px solid transparent/,
  )
})

test('keeps overflowing Radix scroll areas visible without requiring hover', async () => {
  const scrollArea = await readFile(
    new URL('src/components/ui/scroll-area.tsx', root),
    'utf8',
  )
  const tocSidebar = await readFile(
    new URL('src/components/toc-sidebar.astro', root),
    'utf8',
  )

  assert.match(scrollArea, /type\s*=\s*['"]auto['"]/)
  assert.match(scrollArea, /type=\{type\}/)
  assert.doesNotMatch(tocSidebar, /type=['"]hover['"]/)
})

test('applies Umami geometry to vertical and horizontal Radix scrollbars', async () => {
  const scrollArea = await readFile(
    new URL('src/components/ui/scroll-area.tsx', root),
    'utf8',
  )
  const trackClassMatch = scrollArea.match(
    /ScrollAreaScrollbar[\s\S]*?className=\{cn\(\s*'([^']+)'/,
  )
  const thumbClassMatch = scrollArea.match(
    /ScrollAreaThumb[\s\S]*?className=\{cn\(\s*'([^']+)'/,
  )
  const orientationClassMatches = [
    ...scrollArea.matchAll(
      /orientation === '(vertical|horizontal)'\s*&&\s*'([^']+)'/g,
    ),
  ]

  assert.ok(trackClassMatch, 'Radix scrollbar track classes must be present')
  assert.ok(thumbClassMatch, 'Radix scrollbar thumb classes must be present')

  const trackClasses = new Set(trackClassMatch[1].split(/\s+/))
  const thumbClasses = new Set(thumbClassMatch[1].split(/\s+/))
  const [trackVertical, trackHorizontal, thumbVertical, thumbHorizontal] =
    orientationClassMatches.map((match) => new Set(match[2].split(/\s+/)))

  assert.equal(orientationClassMatches.length, 4)
  for (const className of ['relative', 'before:absolute', 'before:bg-border']) {
    assert.ok(trackClasses.has(className), `track must include ${className}`)
  }
  for (const className of [
    'relative',
    'after:absolute',
    'after:rounded-full',
    'after:bg-muted-foreground',
  ]) {
    assert.ok(thumbClasses.has(className), `thumb must include ${className}`)
  }
  for (const className of ['w-[15px]', 'before:w-px']) {
    assert.ok(
      trackVertical.has(className),
      `vertical track must include ${className}`,
    )
  }
  for (const className of ['h-[15px]', 'before:h-px']) {
    assert.ok(
      trackHorizontal.has(className),
      `horizontal track must include ${className}`,
    )
  }
  for (const className of ['after:w-px', 'hover:after:w-[7px]']) {
    assert.ok(
      thumbVertical.has(className),
      `vertical thumb must include ${className}`,
    )
  }
  for (const className of ['after:h-px', 'hover:after:h-[7px]']) {
    assert.ok(
      thumbHorizontal.has(className),
      `horizontal thumb must include ${className}`,
    )
  }
  assert.doesNotMatch(scrollArea, /\b[wh]-2\.5\b|\bp-px\b/)
})
