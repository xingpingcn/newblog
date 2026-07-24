import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const root = new URL('../', import.meta.url)

test('applies Umami scrollbar geometry to every WebKit scrollbar', async () => {
  const css = await readFile(new URL('src/styles/global.css', root), 'utf8')

  assert.match(css, /(^|\n)::[-]webkit-scrollbar\s*\{[\s\S]*?width:\s*15px/)
  assert.match(css, /(^|\n)::[-]webkit-scrollbar-track\s*\{[\s\S]*?border:\s*7px solid transparent/)
  assert.match(css, /(^|\n)::[-]webkit-scrollbar-thumb\s*\{[\s\S]*?border:\s*7px solid transparent/)
  assert.match(css, /(^|\n)::[-]webkit-scrollbar-thumb:hover\s*\{[\s\S]*?border:\s*4px solid transparent/)
  assert.match(css, /background-color:\s*var\(--border\)/)
  assert.match(css, /background-color:\s*var\(--muted-foreground\)/)
  assert.match(css, /border-radius:\s*9999px/)
  assert.match(css, /background-clip:\s*padding-box/)
  assert.doesNotMatch(css, /html::[-]webkit-scrollbar/)
  assert.doesNotMatch(css, /scrollbar-(?:width|color)\s*:/)
})
