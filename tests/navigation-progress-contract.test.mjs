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
