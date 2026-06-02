import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

const root = new URL('../', import.meta.url)
const typography = await readFile(new URL('src/styles/typography.css', root), 'utf8')

assert.match(
  typography,
  /--prose-paragraph-gap:\s*3\.5rem;/,
  'article prose should define a two-line paragraph gap based on the 1.75rem article line height',
)

assert.match(
  typography,
  /:where\(p\):not\(:where\(\.not-prose, \.not-prose \*\)\)\s*\{[\s\S]*?@apply\s+text-foreground\/80\s+my-0;/,
  'article prose paragraphs should not keep the old symmetric margin that collapses to less than two lines',
)

assert.match(
  typography,
  /:where\(p\s*\+\s*p\):not\(:where\(\.not-prose, \.not-prose \*\)\)\s*\{[\s\S]*?@apply\s+mt-\[var\(--prose-paragraph-gap\)\];/,
  'consecutive article prose paragraphs should be separated by exactly two blank text lines',
)
