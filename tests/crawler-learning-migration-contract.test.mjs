import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

const root = new URL('../', import.meta.url)

async function readProjectFile(path) {
  return await readFile(new URL(path, root), 'utf8')
}

const post = await readProjectFile(
  'src/content/blog/crawler-learning/index.mdx',
)

assert.match(
  post,
  /title:\s*['"]记录某一测速网站的 js 逆向的过程['"]/,
  'crawler-learning post should preserve the old reverse-engineering title',
)

assert.match(
  post,
  /description:\s*['"]记录某一测速网站的 js 逆向的过程['"]/,
  'crawler-learning post should preserve the old description',
)

assert.match(
  post,
  /keywords:\s*\['爬虫', '测速网站', 'js 逆向'\]/,
  'crawler-learning post should keep the old keywords as an Astro content array',
)

assert.match(
  post,
  /<ImageGrid\s+images=\{/,
  'crawler-learning Hexo gallery blocks should be converted to ImageGrid components',
)

assert.doesNotMatch(
  post,
  /cdn\.jsdelivr\.net\/gh\/xingpingcn\/picx-images-hosting/,
  'crawler-learning images should use the jsdmirror CDN used by migrated posts',
)

assert.match(
  post,
  /打开控制台，发现有用信息是用 `websocket` 传输的/,
  'crawler-learning body should preserve the reverse-engineering walkthrough',
)
