import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = new URL('../', import.meta.url)
const codePage = await readFile(
  new URL('dist/docker-learning-notes/index.html', root),
  'utf8',
)

assert.match(codePage, /class="expressive-code"/)
assert.match(codePage, /class="frame has-title/)
assert.match(codePage, /data-heading-anchor/)
assert.match(codePage, /target="_blank"/)
assert.match(codePage, /rel="nofollow noreferrer noopener"/)
assert.doesNotMatch(codePage, /katex\.min\.css/)
