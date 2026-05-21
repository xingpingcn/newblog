import { readFile } from 'node:fs/promises'
import { strict as assert } from 'node:assert'

const root = new URL('../', import.meta.url)
const header = await readFile(new URL('src/components/header.astro', root), 'utf8')
const consts = await readFile(new URL('src/consts.ts', root), 'utf8')
const css = await readFile(new URL('src/styles/global.css', root), 'utf8')
const layout = await readFile(new URL('src/layouts/layout.astro', root), 'utf8')
const subpostsHeader = await readFile(
  new URL('src/components/subposts-header.astro', root),
  'utf8',
)
const tocHeader = await readFile(
  new URL('src/components/toc-header.astro', root),
  'utf8',
)

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
  header.includes('animateHeaderState') &&
    header.includes('animateRect') &&
    header.includes('getBoundingClientRect') &&
    header.includes('.site-header-shell'),
  'header shrink should use one-shot FLIP measurement for the wide-to-compact transition',
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
const headerInnerBlock =
  headerCss.match(/\.site-header-inner\s*\{[\s\S]*?\n\}/)?.[0] ?? ''
const headerMotionBlock =
  headerCss.match(/\.site-header-motion\s*\{[\s\S]*?\n\}/)?.[0] ?? ''
const headerBrandBlock =
  headerCss.match(/\.site-header-brand\s*\{[\s\S]*?\n\}/)?.[0] ?? ''
const headerShellBlock =
  headerCss.match(/\.site-header-shell\s*\{[\s\S]*?\n\}/)?.[0] ?? ''
const headerInnerNotTopBlock =
  headerCss.match(
    /\.site-header-motion\.not-top\s+\.site-header-inner\s*\{[\s\S]*?\n\}/,
  )?.[0] ?? ''
const headerShellNotTopBlock =
  headerCss.match(
    /\.site-header-motion\.not-top\s+\.site-header-shell\s*\{[\s\S]*?\n\}/,
  )?.[0] ?? ''
const mobileTocBlock =
  headerCss.match(/\.mobile-toc-header\s*\{[\s\S]*?\n\}/)?.[0] ?? ''
const compactMobileHeaderBlock =
  headerCss.match(
    /\.site-page-header\.not-top:not\(\[data-header-hidden\]\)\s*\{[\s\S]*?\n  \}/,
  )?.[0] ?? ''
const compactMobileHeaderInnerBlock =
  headerCss.match(
    /\.site-page-header\.not-top:not\(\[data-header-hidden\]\)\s+\.site-header-inner\s*\{[\s\S]*?\n  \}/,
  )?.[0] ?? ''
const compactMobileHeaderShellBlock =
  headerCss.match(
    /\.site-page-header\.not-top:not\(\[data-header-hidden\]\)::before\s*\{[\s\S]*?\n  \}/,
  )?.[0] ?? ''
const compactMobileHeaderBackdropBlock =
  headerCss.match(
    /\.site-page-header\.not-top:not\(\[data-header-hidden\]\)\s+\.site-header-shell\s*\{[\s\S]*?\n  \}/,
  )?.[0] ?? ''
const compactMobileTocBlock =
  headerCss.match(
    /\.site-page-header\.not-top:not\(\[data-header-hidden\]\)\s+\.mobile-toc-header\s*\{[\s\S]*?\n  \}/,
  )?.[0] ?? ''
const compactMobileSubpostsBlock =
  headerCss.match(
    /\.site-page-header\.not-top:not\(\[data-header-hidden\]\)\s+\.mobile-subposts-header\s*\{[\s\S]*?\n  \}/,
  )?.[0] ?? ''
const hiddenStackShellBlock =
  headerCss.match(
    /\.site-page-header\[data-header-hidden\]:has\(\.mobile-subposts-header\):has\(\s*\.mobile-toc-header\s*\)::before\s*\{[\s\S]*?\n  \}/,
  )?.[0] ?? ''
const hiddenStackRowsBlock =
  headerCss.match(
    /\.site-page-header\[data-header-hidden\]:has\(\.mobile-subposts-header\):has\(\s*\.mobile-toc-header\s*\)\s+:is\(\.mobile-subposts-header,\s*\.mobile-toc-header\)\s*\{[\s\S]*?\n  \}/,
  )?.[0] ?? ''
const mobileArticleNavSeparatorBlock =
  headerCss.match(
    /\.site-page-header:has\(:is\(\.mobile-subposts-header,\s*\.mobile-toc-header\)\)\s+\.site-header-motion\s*\{[\s\S]*?\n  \}/,
  )?.[0] ?? ''
const mobileDetailsAnimationBlock =
  headerCss.match(
    /\.mobile-stack-details::details-content\s*\{[\s\S]*?\n\}/,
  )?.[0] ?? ''
const mobileDetailsOpenAnimationBlock =
  headerCss.match(
    /\.mobile-stack-details\[open\]::details-content\s*\{[\s\S]*?\n\}/,
  )?.[0] ?? ''

assert(
  !/transition:[\s\S]*?padding 300ms ease[\s\S]*?margin-inline 300ms ease[\s\S]*?transform 300ms ease/.test(
    headerMotionBlock,
  ) && /transition:\s*transform 300ms ease/.test(headerMotionBlock),
  'outer header motion should only transition transform; FLIP handles width and spacing changes',
)

assert(
  !/transition:[\s\S]*?(?:padding|max-width)/.test(headerInnerBlock),
  'inner header should not transition padding or max-width; wide home shrink must not do per-frame layout animation',
)

assert(
  /transition:\s*border-radius 300ms ease/.test(headerInnerBlock) &&
    /transition:[\s\S]*?border-color 150ms ease[\s\S]*?background-color 150ms ease[\s\S]*?box-shadow 150ms ease/.test(
      headerShellBlock,
    ) &&
    header.includes('animation.cancel()'),
  'inner header should transition only border radius; FLIP shell owns capsule paint and cleans up animations',
)

assert(
  /border:\s*1px solid transparent/.test(headerShellBlock) &&
    /border-color:\s*var\(--border\)/.test(headerShellNotTopBlock) &&
    !/border-color:\s*var\(--border\)/.test(headerInnerNotTopBlock),
  'FLIP shell should own the animated border so text and controls are not scaled',
)

assert(
  !/transition:[\s\S]*?(?:border-color|box-shadow)/.test(
    headerInnerBlock,
  ),
  'inner header should not transition paint that belongs to the FLIP shell',
)

assert(
  !/transition:\s*margin-inline-start/.test(headerBrandBlock) &&
    !/transition:\s*all/.test(headerBrandBlock) &&
    /transition:[\s\S]*?color 150ms ease[\s\S]*?background-color 150ms ease[\s\S]*?border-color 150ms ease[\s\S]*?box-shadow 150ms ease/.test(
      headerBrandBlock,
    ) &&
    header.includes('const brand =') &&
    header.includes('const actions =') &&
    header.includes('scaleX: true'),
  'FLIP should move brand/actions without scaling text or transitioning layout spacing',
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
  Boolean(compactMobileTocBlock),
  'mobile article TOC should keep an explicit compact-header style block',
)

assert(
  /isolation:\s*isolate/.test(compactMobileHeaderBlock) &&
    /background-color:\s*transparent/.test(compactMobileHeaderBlock) &&
    /-webkit-backdrop-filter:\s*none/.test(compactMobileHeaderBlock) &&
    /backdrop-filter:\s*none/.test(compactMobileHeaderBlock) &&
    /box-shadow:\s*none/.test(compactMobileHeaderBlock) &&
    /top:\s*0\.5rem/.test(compactMobileHeaderShellBlock) &&
    /border-radius:\s*inherit/.test(compactMobileHeaderShellBlock) &&
    /background-color:\s*color-mix\(in oklab,\s*var\(--background\)\s*76%,\s*transparent\)/.test(
      compactMobileHeaderShellBlock,
    ) &&
    /-webkit-backdrop-filter:\s*blur\(16px\)\s*saturate\(1\.35\)/.test(
      compactMobileHeaderShellBlock,
    ) &&
    /backdrop-filter:\s*blur\(16px\)\s*saturate\(1\.35\)/.test(
      compactMobileHeaderShellBlock,
    ) &&
    /box-shadow:[\s\S]*0 10px 24px/.test(compactMobileHeaderShellBlock) &&
    /pointer-events:\s*none/.test(compactMobileHeaderShellBlock) &&
    !/border:\s*1px solid var\(--border\)/.test(
      compactMobileHeaderShellBlock,
    ) &&
    !/0 0 0 1px/.test(compactMobileHeaderShellBlock),
  'compact mobile article header should use one rounded blurred shell without the old thin outer frame',
)

assert(
  !/-webkit-backdrop-filter:\s*blur\(16px\)\s*saturate\(1\.35\)/.test(
      compactMobileHeaderBlock,
    ) &&
    !/backdrop-filter:\s*blur\(16px\)\s*saturate\(1\.35\)/.test(
      compactMobileHeaderBlock,
    ),
  'compact mobile article header should not blur from the layout element itself',
)

assert(
  /background-color:\s*transparent/.test(compactMobileHeaderInnerBlock) &&
    /border-color:\s*transparent/.test(compactMobileHeaderInnerBlock) &&
    /border-radius:\s*0/.test(compactMobileHeaderInnerBlock) &&
    /box-shadow:\s*none/.test(compactMobileHeaderInnerBlock) &&
    /border-color:\s*transparent/.test(compactMobileHeaderBackdropBlock) &&
    /background-color:\s*transparent/.test(compactMobileHeaderBackdropBlock) &&
    /-webkit-backdrop-filter:\s*none/.test(compactMobileHeaderBackdropBlock) &&
    /backdrop-filter:\s*none/.test(compactMobileHeaderBackdropBlock) &&
    /box-shadow:\s*none/.test(compactMobileHeaderBackdropBlock),
  'compact mobile article nav should not draw a separate rounded capsule inside the shared shell',
)

assert(
  /background-color:\s*transparent/.test(compactMobileTocBlock) &&
    /-webkit-backdrop-filter:\s*none/.test(compactMobileTocBlock) &&
    /backdrop-filter:\s*none/.test(compactMobileTocBlock) &&
    /border-radius:\s*0/.test(compactMobileTocBlock),
  'compact mobile article TOC should remain a flat transparent row inside the shared shell',
)

assert(
  Boolean(compactMobileSubpostsBlock) &&
    /background-color:\s*transparent/.test(compactMobileSubpostsBlock) &&
    /-webkit-backdrop-filter:\s*none/.test(compactMobileSubpostsBlock) &&
    /backdrop-filter:\s*none/.test(compactMobileSubpostsBlock) &&
    /border-radius:\s*0/.test(compactMobileSubpostsBlock),
  'compact mobile subpost controls should remain a flat transparent row inside the shared shell',
)

assert(
  /border-radius:\s*1rem/.test(hiddenStackShellBlock) &&
    /background-color:\s*color-mix\(in oklab,\s*var\(--background\)\s*76%,\s*transparent\)/.test(
      hiddenStackShellBlock,
    ) &&
    /-webkit-backdrop-filter:\s*blur\(16px\)\s*saturate\(1\.35\)/.test(
      hiddenStackShellBlock,
    ) &&
    /backdrop-filter:\s*blur\(16px\)\s*saturate\(1\.35\)/.test(
      hiddenStackShellBlock,
    ) &&
    /box-shadow:[\s\S]*0 10px 24px/.test(hiddenStackShellBlock) &&
    !/border:\s*1px solid var\(--border\)/.test(hiddenStackShellBlock) &&
    /background-color:\s*transparent/.test(hiddenStackRowsBlock) &&
    /-webkit-backdrop-filter:\s*none/.test(hiddenStackRowsBlock) &&
    /backdrop-filter:\s*none/.test(hiddenStackRowsBlock) &&
    /border-radius:\s*0/.test(hiddenStackRowsBlock),
  'hidden mobile subpost and TOC controls should share one rounded shell instead of splitting into two bars',
)

assert(
  /\.site-page-header\[data-header-hidden\]\s*\{[\s\S]*?width:\s*100%[\s\S]*?max-width:\s*100%[\s\S]*?margin-inline:\s*0[\s\S]*?border-radius:\s*0/.test(
    headerCss,
  ),
  'mobile article TOC should keep the original hidden-header layout reset',
)

assert(
  /\.site-page-header\[data-header-hidden\]\s+:is\([^)]*\.mobile-toc-header[^)]*\.mobile-subposts-header[^)]*\)\s*\{[\s\S]*?transform:\s*translateY\(calc\(-1 \* var\(--site-header-motion-height, 4rem\)\)\)/.test(
    headerCss,
  ) ||
    /\.site-page-header\[data-header-hidden\]\s+:is\([^)]*\.mobile-subposts-header[^)]*\.mobile-toc-header[^)]*\)\s*\{[\s\S]*?transform:\s*translateY\(calc\(-1 \* var\(--site-header-motion-height, 4rem\)\)\)/.test(
      headerCss,
    ),
  'mobile article TOC and subpost controls should share the hidden-header transform',
)

assert(
  !headerCss.includes('--site-header-toc-hide-offset') &&
    !mobileTocBlock.includes('position: relative') &&
    !mobileTocBlock.includes('z-index'),
  'header performance fix should not add new mobile TOC positioning or variables',
)

assert.match(
  layout,
  /<header class="site-page-header sticky top-0 z-50">\s*<Header[\s\S]*?<slot name="subposts-navigation" \/>[\s\S]*?<slot name="table-of-contents" \/>/,
  'mobile article header should avoid divide-y borders while keeping subposts above the article TOC',
)

assert(
  !layout.includes('divide-y'),
  'mobile article header should not use Tailwind divide-y borders between subpost and TOC rows',
)

assert(
  /border-bottom:\s*1px solid var\(--border\)/.test(
    mobileArticleNavSeparatorBlock,
  ),
  'mobile article header should keep the separator between the main nav row and the article navigation rows',
)

assert(
  !/border-bottom:\s*1px/.test(compactMobileSubpostsBlock) &&
    !/border-top:\s*1px/.test(compactMobileTocBlock) &&
    !/border-top:\s*1px/.test(hiddenStackRowsBlock) &&
    !/border-bottom:\s*1px/.test(hiddenStackRowsBlock),
  'mobile subpost and TOC rows should not get their own separator line between each other',
)

assert(
  /interpolate-size:\s*allow-keywords/.test(mobileDetailsAnimationBlock) &&
    /overflow:\s*hidden/.test(mobileDetailsAnimationBlock) &&
    /block-size:\s*0/.test(mobileDetailsAnimationBlock) &&
    /transition:[\s\S]*block-size 220ms ease[\s\S]*content-visibility 220ms ease allow-discrete/.test(
      mobileDetailsAnimationBlock,
    ) &&
    /block-size:\s*auto/.test(mobileDetailsOpenAnimationBlock),
  'mobile subpost and TOC details panels should animate open and closed instead of snapping',
)

assert.match(
  tocHeader,
  /scrollContainer\.scrollTo\(\s*\{[\s\S]*?top:\s*targetScroll[\s\S]*?behavior:\s*window\.matchMedia\('\(prefers-reduced-motion: reduce\)'\)\.matches\s*\?\s*'auto'\s*:\s*'smooth'[\s\S]*?\}\s*\)/,
  'mobile TOC should smoothly move the active item inside the opened TOC list',
)

assert(
  !tocHeader.includes('scrollContainer.scrollTop = targetScroll'),
  'mobile TOC should not jump the opened list text with direct scrollTop assignment',
)

assert.match(
  tocHeader,
  /<details class="group mobile-stack-details">/,
  'mobile TOC details should use the shared animated details class',
)

assert.match(
  subpostsHeader,
  /<details class="group mobile-stack-details">/,
  'mobile subposts details should use the shared animated details class',
)

assert.match(
  tocHeader,
  /state\.detailsElement\.open\s*=\s*false[\s\S]*?state\.detailsElement\.removeAttribute\('open'\)/,
  'mobile TOC item clicks should close animated details panels through removeAttribute',
)

assert.match(
  subpostsHeader,
  /state\.detailsElement\.open\s*=\s*false[\s\S]*?state\.detailsElement\.removeAttribute\('open'\)/,
  'mobile subpost item clicks should close animated details panels through removeAttribute',
)

assert.match(
  tocHeader,
  /state\.detailsElement\.addEventListener\(\s*'toggle'[\s\S]*?TOCHeaderScrollMask\.update[\s\S]*?\{\s*passive:\s*true\s*\}/,
  'mobile TOC toggle handler should remain passive while refreshing scroll masks after the animation starts',
)

assert.match(
  subpostsHeader,
  /state\.detailsElement\.addEventListener\(\s*'toggle'[\s\S]*?SubpostsHeaderScrollMask\.update[\s\S]*?\{\s*passive:\s*true\s*\}/,
  'mobile subposts toggle handler should remain passive while refreshing scroll masks after the animation starts',
)

assert.match(
  layout,
  /<slot name="subposts-navigation" \/>[\s\S]*?<slot name="table-of-contents" \/>/,
  'mobile subposts navigation should render above the article TOC when both exist',
)

assert.match(
  subpostsHeader,
  /<div[\s\S]*?id="mobile-subposts-container"[\s\S]*?class="mobile-subposts-header w-full lg:hidden"[\s\S]*?>/,
  'mobile subposts navigation should expose a stable class for shared sticky-header styling',
)
