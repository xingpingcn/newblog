import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

const root = new URL('../', import.meta.url)

const header = await readFile(new URL('src/components/header.astro', root), 'utf8')
const consts = await readFile(new URL('src/consts.ts', root), 'utf8')
const css = await readFile(new URL('src/styles/global.css', root), 'utf8')

assert.match(
  consts,
  /href:\s*['"]\/tags['"][\s\S]*?label:\s*['"]标签['"]/,
  'tags should be registered as a navigation link',
)

assert.match(
  header,
  /标签:\s*['"]lucide:tags['"]/,
  'tags should have a matching icon in the header menu',
)

assert.match(
  header,
  /secondaryNavLabels\s*=\s*new Set\(\[[^\]]*['"]标签['"][^\]]*\]\)/,
  'tags should render in the secondary header menu',
)

const menuPanelBlock =
  css.match(/\.site-header-menu-panel\s*\{[\s\S]*?\n\}/)?.[0] ?? ''
const menuPanelBackdropBlock =
  css.match(/\.site-header-menu-panel::before\s*\{[\s\S]*?\n\}/)?.[0] ?? ''

assert.match(
  menuPanelBlock,
  /isolation:\s*isolate/,
  'secondary menu panel should isolate its glass backdrop layer',
)

assert.match(
  menuPanelBackdropBlock,
  /background-color:\s*color-mix\(in oklab,\s*var\(--background\)\s+\d+%,\s*transparent\)/,
  'secondary menu panel backdrop should keep a translucent background for glass blur',
)

assert.match(
  menuPanelBackdropBlock,
  /-webkit-backdrop-filter:\s*blur\(24px\)\s*saturate\(1\.45\)/,
  'secondary menu panel backdrop should keep WebKit gaussian blur',
)

assert.match(
  menuPanelBackdropBlock,
  /backdrop-filter:\s*blur\(24px\)\s*saturate\(1\.45\)/,
  'secondary menu panel backdrop should keep standard gaussian blur',
)
