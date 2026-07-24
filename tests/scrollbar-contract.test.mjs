import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const root = new URL('../', import.meta.url)

test('applies the Umami scrollbar only to the root page', async () => {
  const css = await readFile(new URL('src/styles/global.css', root), 'utf8')

  assert.match(css, /html::[-]webkit-scrollbar\s*\{[\s\S]*?width:\s*15px/)
  assert.match(css, /html::[-]webkit-scrollbar-track[\s\S]*?border:\s*7px solid transparent/)
  assert.match(css, /html::[-]webkit-scrollbar-thumb[\s\S]*?border:\s*7px solid transparent/)
  assert.match(css, /html::[-]webkit-scrollbar-thumb:hover[\s\S]*?border:\s*4px solid transparent/)
  assert.match(css, /background-color:\s*var\(--border\)/)
  assert.match(css, /background-color:\s*var\(--muted-foreground\)/)
  assert.match(css, /scrollbar-color:\s*var\(--muted-foreground\)\s+var\(--border\)/)
  assert.doesNotMatch(css, /(^|\n)::[-]webkit-scrollbar\s*\{/)
})
