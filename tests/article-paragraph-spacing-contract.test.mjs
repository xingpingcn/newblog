import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

const root = new URL('../', import.meta.url)
const typography = await readFile(new URL('src/styles/typography.css', root), 'utf8')

assert.match(
  typography,
  /:where\(p\):not\(:where\(\.not-prose, \.not-prose \*\)\)\s*\{[\s\S]*?@apply\s+text-foreground\/80\s+my-5\s+indent-\[2em\];/,
  'article prose paragraphs should keep the normal paragraph rhythm while indenting the first line by two character widths',
)

assert.doesNotMatch(
  typography,
  /--prose-paragraph-gap|:where\(p\s*\+\s*p\):not\(:where\(\.not-prose, \.not-prose \*\)\)/,
  'article prose should not force a special two-line gap between consecutive paragraphs',
)

assert.match(
  typography,
  /indent-\[2em\]/,
  'article prose paragraphs should indent the first line by two character widths',
)
