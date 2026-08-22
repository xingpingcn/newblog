import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

const root = new URL('../', import.meta.url)
const homePage = await readFile(new URL('dist/index.html', root), 'utf8')

assert.match(
  homePage,
  /<link rel="stylesheet" href="\/_astro\/[^"]+\.css">/,
  'home page should serve project CSS as a cacheable stylesheet instead of duplicating it in every HTML document',
)

assert.doesNotMatch(
  homePage,
  /<style>\/\*! tailwindcss v4\.3\.3/,
  'home page should not inline the complete Tailwind stylesheet into the document',
)
