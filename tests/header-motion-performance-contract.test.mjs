import { readFile } from 'node:fs/promises'
import { strict as assert } from 'node:assert'

const root = new URL('../', import.meta.url)
const header = await readFile(new URL('src/components/header.astro', root), 'utf8')
const css = await readFile(new URL('src/styles/global.css', root), 'utf8')

const updateBlock = header.match(/const update = \(\) => \{[\s\S]*?\n      \}/)?.[0]
assert(updateBlock, 'header motion should define a scroll update function')

assert(
  !updateBlock.includes('syncMotionHeight'),
  'scroll update should not sync header height; reading layout during scroll causes jank',
)

assert(
  !header.includes('this.offsetHeight'),
  'header height sync should avoid offsetHeight reads on the scroll path',
)

assert(
  !/window\.addEventListener\(\s*['"]scroll['"]\s*,\s*update\b/.test(header),
  'scroll listener should schedule header updates through requestAnimationFrame',
)

assert(
  header.includes('requestAnimationFrame'),
  'header scroll motion should use requestAnimationFrame scheduling',
)

const headerCssStart = css.indexOf('.site-header-motion')
const headerCssEnd = css.indexOf('@layer components')
assert(headerCssStart >= 0, 'global.css should contain site header styles')
assert(headerCssEnd > headerCssStart, 'site header styles should appear before component layer')

const headerCss = css.slice(headerCssStart, headerCssEnd)
const layoutTransitionProperties =
  /\b(?:width|max-width|padding|gap|margin(?:-inline|-bottom)?)\b/
const badTransitions = [...headerCss.matchAll(/transition:\s*([\s\S]*?);/g)]
  .map((match) => match[1].replace(/\s+/g, ' ').trim())
  .filter((value) => layoutTransitionProperties.test(value))

assert.deepEqual(
  badTransitions,
  [],
  `site header transitions should avoid layout-affecting properties: ${badTransitions.join(' | ')}`,
)
