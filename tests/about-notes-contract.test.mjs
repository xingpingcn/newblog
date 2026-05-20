import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

const root = new URL('../', import.meta.url)

async function readProjectFile(path) {
  return await readFile(new URL(path, root), 'utf8')
}

const aboutPage = await readProjectFile('src/pages/about.astro')

assert.match(aboutPage, /<h2>记事<\/h2>/, 'about page should include notes')

assert.match(
  aboutPage,
  /import GiscusComments from '@\/components\/giscus-comments\.astro'/,
  'about page should import the shared comments component',
)

assert.match(
  aboutPage,
  /<GiscusComments\s+\/>/,
  'about page should render the shared comments section',
)

assert.doesNotMatch(
  aboutPage,
  /toc-header|toc-sidebar|TOCHeader|TOCSidebar/,
  'about page should not add an article table of contents',
)

assert.match(
  aboutPage,
  /2026-05-19/,
  'about notes should include the Astro migration timeline date',
)

assert.match(
  aboutPage,
  /完成旧 Hexo\/Volantis 博客内容迁移/,
  'about notes should include the migration timeline entry',
)

assert.match(
  aboutPage,
  /2023-11-15/,
  'about notes should migrate the Umami statistics timeline date',
)

assert.match(
  aboutPage,
  /stats\.xingpingcn\.top\/share\/XoDdV8TeKUUp8E8f\/xingpingcn/,
  'about notes should preserve the public Umami statistics link',
)

assert.match(
  aboutPage,
  /本站建于 2023-04/,
  'about notes should preserve the original site creation note',
)
