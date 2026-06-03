import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

const root = new URL('../', import.meta.url)

async function readProjectFile(path, fallback = undefined) {
  try {
    return await readFile(new URL(path, root), 'utf8')
  } catch (error) {
    if (fallback !== undefined && error?.code === 'ENOENT') {
      return fallback
    }
    throw error
  }
}

const layout = await readProjectFile('src/layouts/layout.astro')
const head = await readProjectFile('src/components/head.astro')
const progress = await readProjectFile(
  'src/components/navigation-progress.astro',
  '',
)
const globalCss = await readProjectFile('src/styles/global.css')

assert.match(
  head,
  /<ClientRouter\s*\/>/,
  'Astro client-side navigation should stay enabled for progress feedback',
)

assert.match(
  head,
  /data-scroll-restore-pending/,
  'head should hide the body before first paint when browser history scroll restoration is pending',
)

assert.match(
  head,
  /performance\.getEntriesByType\('navigation'\)[\s\S]*?back_forward/,
  'head should detect browser back and forward document navigations before paint',
)

assert.match(
  head,
  /history\.state[\s\S]*?scrollY/,
  'head should read the saved history scroll position for browser back and forward restores',
)

assert.match(
  head,
  /pageshow[\s\S]*?restoreSavedScroll/,
  'head should restore saved scroll on pageshow for full-document back and forward navigation',
)

assert.match(
  head,
  /requestAnimationFrame[\s\S]*?revealScrollRestoredPage/,
  'head should reveal the page only after the saved scroll position has had a frame to apply',
)

assert.match(
  layout,
  /import NavigationProgress from '@\/components\/navigation-progress\.astro'/,
  'layout should import the global navigation progress component',
)

assert.match(
  layout,
  /<NavigationProgress\s*\/>/,
  'layout should render the global navigation progress component',
)

assert.match(
  progress,
  /astro:before-preparation/,
  'progress component should start on Astro client navigation preparation',
)

assert.match(
  progress,
  /astro:page-load/,
  'progress component should finish after Astro page load',
)

assert.match(
  progress,
  /pointerdown/,
  'progress component should provide immediate feedback for link pointer clicks',
)

assert.match(
  progress,
  /const cancel = \(\) => \{/,
  'progress component should cancel optimistic pointer feedback when no navigation starts',
)

assert.match(
  progress,
  /pointercancel/,
  'progress component should cancel touch feedback when a mobile gesture is cancelled',
)

assert.match(
  progress,
  /touchmove/,
  'progress component should cancel touch feedback when a mobile link press turns into scrolling',
)

assert.match(
  progress,
  /popstate/,
  'progress component should provide feedback for browser back and forward',
)

assert.match(
  progress,
  /astro:before-swap/,
  'navigation component should intercept Astro swaps so traverse navigations can restore scroll without a visible top flash',
)

assert.match(
  progress,
  /navigationType\s*===\s*'traverse'/,
  'navigation component should only apply the scroll restoration patch to browser back and forward traversals',
)

assert.match(
  progress,
  /const\s+patchedScrollTo\s*=\s*\(\([\s\S]*?\)\s*as\s*typeof\s+window\.scrollTo/,
  'traverse swaps should temporarily intercept Astro scrollTo calls before the DOM swap can visibly move the page to the top',
)

assert.match(
  progress,
  /window\.scrollTo\s*=\s*patchedScrollTo/,
  'traverse swaps should install the temporary scrollTo patch during Astro location updates',
)

assert.match(
  progress,
  /isAstroTopReset/,
  'traverse swaps should identify and suppress Astro internal top-reset scrolling',
)

assert.match(
  progress,
  /restoreTraverseScroll/,
  'traverse swaps should restore the saved history scroll position after Astro finishes its location update',
)

assert.match(
  progress,
  /HOME_SCROLL_SNAPSHOT_KEY/,
  'navigation component should keep a session-scoped home scroll snapshot for article-to-home link returns',
)

assert.match(
  progress,
  /sessionStorage\.setItem\(\s*HOME_SCROLL_SNAPSHOT_KEY/,
  'navigation component should save the home scroll position before leaving the home feed',
)

assert.match(
  progress,
  /document\.querySelector\(['"]\[data-article-content\]['"]\)/,
  'navigation component should only treat article pages as article-to-home return origins',
)

assert.match(
  progress,
  /sourceElement[\s\S]*?closest<HTMLAnchorElement>\(['"]a\[href\]['"]\)[\s\S]*?pathname\s*===\s*['"]\/['"]/,
  'navigation component should identify explicit home-link returns from the clicked link target',
)

assert.match(
  progress,
  /navigationType\s*===\s*'push'[\s\S]*?prepareHomeLinkScrollRestore/,
  'home-link restores should apply to explicit push navigations back to the home page',
)

assert.match(
  progress,
  /guardHomeLinkScrollRestore/,
  'home-link returns should suppress Astro top-reset scrolling and restore the saved home position after the swap',
)

assert.match(
  progress,
  /transition:persist/,
  'progress indicator should persist across Astro document swaps',
)

assert.match(
  globalCss,
  /\.site-navigation-progress/,
  'global CSS should style the navigation progress indicator',
)

assert.match(
  globalCss,
  /\.site-navigation-progress\[data-state='loading'\]/,
  'progress indicator should expose a loading state style',
)
