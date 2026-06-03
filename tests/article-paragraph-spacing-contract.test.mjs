import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

const root = new URL('../', import.meta.url)
const typography = await readFile(new URL('src/styles/typography.css', root), 'utf8')

assert.match(
  typography,
  /:where\(p\):not\(:where\(\.not-prose, \.not-prose \*\)\)\s*\{[\s\S]*?@apply\s+text-foreground\/80\s+my-5;/,
  'article prose paragraphs should keep the normal paragraph rhythm without first-line indentation',
)

assert.doesNotMatch(
  typography,
  /--prose-paragraph-gap|:where\(p\s*\+\s*p\):not\(:where\(\.not-prose, \.not-prose \*\)\)/,
  'article prose should not force a special two-line gap between consecutive paragraphs',
)

assert.doesNotMatch(
  typography,
  /indent-\[2em\]|text-indent/,
  'article prose, about page prose, and callout body text should not render with a two-character first-line indent',
)
