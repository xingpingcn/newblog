import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

const root = new URL('../', import.meta.url)

async function readProjectFile(path) {
  return await readFile(new URL(path, root), 'utf8')
}

const postPage = await readProjectFile('src/pages/[...id].astro')
const contentConfig = await readProjectFile('src/content.config.ts')
const migrationScript = await readProjectFile('scripts/migrate-hexo-blog.mjs')

assert.match(
  postPage,
  /import ArticleLicense from '@\/components\/article-license\.astro'/,
  'article page should import the migrated article license component',
)

assert.match(
  postPage,
  /<ArticleLicense\s+post=\{post\}/,
  'article page should render the license block for every post',
)

assert.match(
  contentConfig,
  /license:\s*z\s*\.\s*object/,
  'blog content schema should accept migrated article license metadata',
)

assert.match(
  migrationScript,
  /type:\s*'original'/,
  'Hexo migration should mark reposted articles as original-license content',
)
