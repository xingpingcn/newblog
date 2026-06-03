import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

const root = new URL('../', import.meta.url)
const typography = await readFile(new URL('src/styles/typography.css', root), 'utf8')

assert.match(
  typography,
  /:where\(p\):not\(:where\(\.not-prose, \.not-prose \*\)\)\s*\{[\s\S]*?@apply\s+text-foreground\/80\s+my-5\s+indent-\[2em\];/,
  'normal article prose paragraphs should keep the normal paragraph rhythm with a two-character first-line indent',
)

assert.doesNotMatch(
  typography,
  /--prose-paragraph-gap|:where\(p\s*\+\s*p\):not\(:where\(\.not-prose, \.not-prose \*\)\)/,
  'article prose should not force a special two-line gap between consecutive paragraphs',
)

assert.match(
  typography,
  /:where\(li\s*>\s*p,\s*details\s+p,\s*p\.prose-no-indent\):not\([\s\S]*?:where\(\.not-prose, \.not-prose \*\)[\s\S]*?\)\s*\{[\s\S]*?@apply\s+indent-0;/,
  'list paragraphs, callout paragraphs, and explicitly marked prose paragraphs should opt out of the normal two-character indent',
)
