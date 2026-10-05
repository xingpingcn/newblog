import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('reverse engineering article uses the Callout component for all three notices', async () => {
  const source = await readFile(new URL('../src/content/blog/reverse-engineering-for-beginners/index.mdx', import.meta.url), 'utf8')
  assert.equal((source.match(/import Callout from ['"]@\/components\/callout\.astro['"]/g) || []).length, 1)
  assert.equal((source.match(/<Callout variant="note">/g) || []).length, 2)
  assert.equal((source.match(/<Callout variant="warning">/g) || []).length, 1)
  assert.equal((source.match(/<\/Callout>/g) || []).length, 3)
  assert.doesNotMatch(source, /^:::(?:note|warning)\b/m)
})
