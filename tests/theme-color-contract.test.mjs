import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

const root = new URL('../', import.meta.url)

async function readProjectFile(path) {
  return await readFile(new URL(path, root), 'utf8')
}

const head = await readProjectFile('src/components/head.astro')
const themeToggle = await readProjectFile('src/components/theme-toggle.astro')

assert.match(
  head,
  /<meta\s+name="theme-color"[\s\S]*?content="#121212"[\s\S]*?media="\(prefers-color-scheme: dark\)"[\s\S]*?data-site-theme-color/,
  'head should expose a dark mobile browser chrome color fallback',
)

assert.match(
  head,
  /<meta\s+name="theme-color"[\s\S]*?content="#ffffff"[\s\S]*?media="\(prefers-color-scheme: light\)"[\s\S]*?data-site-theme-color/,
  'head should expose a light mobile browser chrome color fallback',
)

assert.match(
  themeToggle,
  /const SITE_THEME_COLORS = \{[\s\S]*?dark:\s*['"]#121212['"][\s\S]*?light:\s*['"]#ffffff['"][\s\S]*?\}/,
  'theme toggle should keep the browser chrome palette beside the theme logic',
)

assert.match(
  themeToggle,
  /function updateThemeColor\(theme[^\)]*\) \{[\s\S]*?theme === ['"]dark['"][\s\S]*?querySelectorAll\(\s*['"]meta\[name="theme-color"\]\[data-site-theme-color\]['"]\s*\)[\s\S]*?setAttribute\(\s*['"]content['"],\s*themeColor\s*\)/,
  'theme toggle should update the active theme-color meta content',
)

assert.match(
  themeToggle,
  /setAttribute\('data-theme', theme\)[\s\S]*?updateThemeColor\(theme\)/,
  'initial theme detection should sync the mobile browser chrome color',
)

assert.match(
  themeToggle,
  /setAttribute\('data-theme', newTheme\)[\s\S]*?updateThemeColor\(newTheme\)/,
  'manual theme toggles should sync the mobile browser chrome color',
)

assert.match(
  themeToggle,
  /astro:after-swap[\s\S]*?setAttribute\('data-theme', storedTheme\)[\s\S]*?updateThemeColor\(storedTheme\)/,
  'Astro client-side page swaps should restore the mobile browser chrome color',
)
