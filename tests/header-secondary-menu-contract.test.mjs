import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

const root = new URL('../', import.meta.url)

const header = await readFile(new URL('src/components/header.astro', root), 'utf8')
const consts = await readFile(new URL('src/consts.ts', root), 'utf8')

assert.match(
  consts,
  /href:\s*['"]\/tags['"][\s\S]*?label:\s*['"]标签['"]/,
  'tags should be registered as a navigation link',
)

assert.match(
  header,
  /标签:\s*['"]lucide:tags['"]/,
  'tags should have a matching icon in the header menu',
)

assert.match(
  header,
  /secondaryNavLabels\s*=\s*new Set\(\[[^\]]*['"]标签['"][^\]]*\]\)/,
  'tags should render in the secondary header menu',
)
