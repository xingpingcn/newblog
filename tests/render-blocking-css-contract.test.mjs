import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

const root = new URL('../', import.meta.url)
const homePage = await readFile(new URL('dist/index.html', root), 'utf8')

assert.doesNotMatch(
  homePage,
  /<link rel="stylesheet" href="\/_astro\/layout\.[^"]+\.css">/,
  'home page should not block first render on the shared layout stylesheet request',
)

assert.match(
  homePage,
  /<style(?:\s|>)/,
  'home page should inline project CSS for the initial render path',
)
