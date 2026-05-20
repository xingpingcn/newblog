import { readFile } from 'node:fs/promises'
import { strict as assert } from 'node:assert'

const root = new URL('../', import.meta.url)
const header = await readFile(new URL('src/components/header.astro', root), 'utf8')
const consts = await readFile(new URL('src/consts.ts', root), 'utf8')
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

assert(
  header.includes('motionHeight') &&
    header.includes('Math.abs(height - motionHeight) < 0.5'),
  'header height observer should avoid rewriting CSS variables for unchanged heights',
)

assert(
  !header.includes('animateHeaderState') && !header.includes('animateRect'),
  'header shrink should use the oxue-style class + CSS transition pattern, not a FLIP animation',
)

assert(
  updateBlock.includes('scrollDelta') &&
    updateBlock.includes('currentScrollY < 350') &&
    updateBlock.includes('Math.abs(scrollDelta) > 8') &&
    header.includes("this.classList.toggle('not-top', isNotTop)") &&
    header.includes('this.dataset.show') &&
    header.includes('data-header-hidden'),
  'header scroll state should keep the original thresholded hide/show behavior',
)

const headerCssStart = css.indexOf('.site-header-motion')
const headerCssEnd = css.indexOf('@layer components')
assert(headerCssStart >= 0, 'global.css should contain site header styles')
assert(headerCssEnd > headerCssStart, 'site header styles should appear before component layer')

const headerCss = css.slice(headerCssStart, headerCssEnd)
const mobileTocBlock =
  headerCss.match(/\.mobile-toc-header\s*\{[\s\S]*?\n\}/)?.[0] ?? ''

assert(
  /\.site-header-motion\s*\{[\s\S]*?transition:[\s\S]*?padding 300ms ease[\s\S]*?margin-inline 300ms ease[\s\S]*?transform 300ms ease/.test(
    headerCss,
  ),
  'outer header motion should transition padding, margin-inline, and transform like oxue',
)

assert(
  /\.site-header-inner\s*\{[\s\S]*?transition:[\s\S]*?padding 300ms ease[\s\S]*?border-color 150ms ease[\s\S]*?background-color 150ms ease[\s\S]*?box-shadow 150ms ease/.test(
    headerCss,
  ),
  'inner header should transition compact padding and capsule chrome like oxue',
)

assert(
  /\.site-header-brand\s*\{[\s\S]*?transition:\s*margin-inline-start 300ms ease/.test(
    headerCss,
  ),
  'brand should slide inward through margin-inline-start like oxue',
)

assert(
  !/\.site-header-motion\.not-top\s+\.site-header-actions\s*\{[\s\S]*?gap:/.test(
    headerCss,
  ) &&
    !/\.site-header-motion\.not-top\s+\.site-header-nav\s*\{[\s\S]*?gap:/.test(
      headerCss,
    ) &&
    !/\.site-header-actions,\s*\n\s*\.site-header-nav\s*\{[\s\S]*?transition:\s*gap/.test(
      headerCss,
    ),
  'header button spacing should stay stable while scrolling',
)

assert(
  /class="site-header-actions flex items-center gap-2 sm:gap-3"/.test(
    header,
  ) &&
    /class="site-header-nav flex items-center gap-2 text-sm sm:gap-3"/.test(
      header,
    ) &&
    /\.site-header-actions\s*\{[\s\S]*?gap:\s*0\.25rem/.test(headerCss) &&
    /\.site-header-nav\s*\{[\s\S]*?gap:\s*0\.1875rem/.test(headerCss),
  'header button spacing should use a compact baseline on desktop and mobile',
)

assert(
  !/\.site-header-motion\.not-top\s+\.site-header-nav-link\s*\{[\s\S]*?(?:padding|width|min-width|max-width):/.test(
    headerCss,
  ) &&
    ['首页', '友链', '开往'].every(
      (label) =>
        new RegExp(`label:\\s*['"]${label}['"]`).test(consts) &&
        new RegExp(`${label}:\\s*['"]lucide:`).test(header),
    ),
  'primary nav link widths for 首页/友链/开往 should stay stable while scrolling',
)

assert(
  /\.site-page-header\[data-header-hidden\]\s+\.site-header-motion\s*\{[\s\S]*?transform:\s*translateY/.test(
    headerCss,
  ),
  'header hide/show should remain a transform transition',
)

assert(
  /\.site-page-header\.not-top:not\(\[data-header-hidden\]\)\s+\.mobile-toc-header\s*\{[\s\S]*?border-radius:\s*0 0 1rem 1rem/.test(
    headerCss,
  ),
  'mobile article TOC should keep its original compact-header animation boundary',
)

assert(
  /\.site-page-header\[data-header-hidden\]\s*\{[\s\S]*?width:\s*100%[\s\S]*?max-width:\s*100%[\s\S]*?margin-inline:\s*0[\s\S]*?border-radius:\s*0/.test(
    headerCss,
  ),
  'mobile article TOC should keep the original hidden-header layout reset',
)

assert(
  /\.site-page-header\[data-header-hidden\]\s+\.mobile-toc-header\s*\{[\s\S]*?transform:\s*translateY\(calc\(-1 \* var\(--site-header-motion-height, 4rem\)\)\)/.test(
    headerCss,
  ),
  'mobile article TOC should keep its original hidden transform',
)

assert(
  !headerCss.includes('--site-header-toc-hide-offset') &&
    !mobileTocBlock.includes('position: relative') &&
    !mobileTocBlock.includes('z-index'),
  'header performance fix should not add new mobile TOC positioning or variables',
)
