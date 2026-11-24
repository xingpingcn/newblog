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

const lightTheme = globalCss.match(/:root\s*\{([^}]*)\}/)?.[1] ?? ''
const darkTheme =
  globalCss.match(/\[data-theme='dark'\]\s*\{([^}]*)\}/)?.[1] ?? ''
const progressStyle =
  globalCss.match(/\.site-navigation-progress\s*\{([^}]*)\}/)?.[1] ?? ''
const trackStyle =
  globalCss.match(/\.site-navigation-progress-track\s*\{([^}]*)\}/)?.[1] ?? ''

assert.match(
  lightTheme,
  /--navigation-progress-color:\s*oklch\(0\.488\s+0\.243\s+264\.376\);/,
  'light navigation progress should use its own deep blue instead of the site accent',
)

assert.match(
  lightTheme,
  /--navigation-progress-highlight:\s*oklch\(0\.546\s+0\.245\s+262\.881\);/,
  'the light progress gradient should end in a visible blue rather than pale green',
)

assert.doesNotMatch(
  lightTheme,
  /--navigation-progress-(?:color|highlight):[^;]*(?:color-mix|--background|--accent)/,
  'light progress colors should not be diluted with the white background or site accent',
)

assert.match(
  lightTheme,
  /--accent:\s*oklch\(0\.52\s+0\.11\s+165\);/,
  'the light site accent should remain green outside navigation progress',
)

assert.match(
  darkTheme,
  /--accent:\s*oklch\(0\.7\s+0\.1\s+165\);/,
  'the dark site accent should retain its existing green',
)

assert.match(
  darkTheme,
  /--navigation-progress-color:\s*var\(--accent\);/,
  'dark navigation progress should retain the site accent instead of the light blue',
)

assert.match(
  darkTheme,
  /--navigation-progress-highlight:\s*color-mix\(\s*in oklab,\s*var\(--accent\)\s+55%,\s*var\(--background\)\s*\);/,
  'dark navigation progress should preserve its original gradient end color',
)

assert.match(
  trackStyle,
  /background:\s*linear-gradient\(\s*90deg,\s*var\(--navigation-progress-color\),\s*var\(--navigation-progress-highlight\)\s*\);/,
  'the progress track should use both theme-specific colors without extra background mixing',
)

assert.match(
  trackStyle,
  /box-shadow:\s*0 0 16px\s+color-mix\(\s*in oklab,\s*var\(--navigation-progress-color\)\s+32%,\s*transparent\s*\);/,
  'the progress glow should follow its theme-specific color with the existing strength',
)

assert.match(
  progressStyle,
  /height:\s*2px;/,
  'the progress color change should preserve the existing thin bar height',
)

assert.match(
  progressStyle,
  /pointer-events:\s*none;/,
  'navigation progress should never intercept link clicks or touch gestures',
)

assert.match(
  globalCss,
  /\.site-navigation-progress\[data-state='loading'\]\s+\.site-navigation-progress-track\s*\{[^}]*animation:\s*site-navigation-progress-loading 1\.2s ease-out forwards;/,
  'the progress color change should retain its existing loading animation',
)

assert.match(
  globalCss,
  /\.site-navigation-progress\[data-state='complete'\]\s+\.site-navigation-progress-track\s*\{[^}]*transform:\s*scaleX\(1\);[^}]*transition:\s*transform 140ms ease-out;/,
  'the progress color change should retain its existing completion animation',
)

assert.match(
  globalCss,
  /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.site-navigation-progress\[data-state='loading'\]\s+\.site-navigation-progress-track\s*\{[^}]*animation-duration:\s*1ms;/,
  'navigation progress should continue respecting reduced motion preferences',
)
