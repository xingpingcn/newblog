import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import {
  HOME_MARKDOWN,
  LLMS_TXT,
  NEGOTIATED_RESPONSE_HEADERS,
  negotiateRepresentation,
} from '../src/lib/agent-content.mjs'

const root = new URL('../', import.meta.url)

async function readProjectFile(path) {
  return await readFile(new URL(path, root), 'utf8')
}

function htmlToText(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:#\d+|#x[\da-f]+|[a-z]+);/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

assert.equal(negotiateRepresentation(null), 'html')
assert.equal(negotiateRepresentation('*/*'), 'html')
assert.equal(negotiateRepresentation('text/markdown'), 'markdown')
assert.equal(
  negotiateRepresentation('text/markdown,text/html;q=0.8'),
  'markdown',
)
assert.equal(negotiateRepresentation('text/markdown;q=0.8,text/html'), 'html')
assert.equal(
  negotiateRepresentation('text/*;q=0,text/markdown;q=1'),
  'markdown',
)
assert.equal(negotiateRepresentation('application/json'), 'not-acceptable')
assert.equal(
  negotiateRepresentation('text/markdown;q=0,text/html;q=0'),
  'not-acceptable',
)

assert.equal(NEGOTIATED_RESPONSE_HEADERS.Vary, 'Accept, Accept-Encoding')
assert.match(NEGOTIATED_RESPONSE_HEADERS.Link, /rel="alternate"/)
assert.match(HOME_MARKDOWN, /^# .+/)
assert(
  HOME_MARKDOWN.length > 500,
  'Markdown representation should be substantive',
)
assert.match(LLMS_TXT, /^## When to use this site$/m)
assert.match(LLMS_TXT, /How to retrieve/)
assert.match(LLMS_TXT, /sitemap\.xml/)

const [
  middleware,
  netlifyEdgeFunction,
  vercelConfig,
  netlifyConfig,
  indexPage,
] = await Promise.all([
  readProjectFile('middleware.ts'),
  readProjectFile('netlify/edge-functions/markdown.ts'),
  readProjectFile('vercel.json'),
  readProjectFile('netlify.toml'),
  readProjectFile('src/pages/index.astro'),
])

assert.match(middleware, /negotiateRepresentation/)
assert.match(middleware, /status:\s*406/)
assert.match(middleware, /matcher:\s*'\/'/)
assert.match(netlifyEdgeFunction, /context\.next\(\)/)
assert.match(netlifyEdgeFunction, /path:\s*'\/'/)
assert.match(netlifyEdgeFunction, /text\/markdown; charset=utf-8/)
assert.match(vercelConfig, /"key": "Vary"[\s\S]*"Accept, Accept-Encoding"/)
assert.match(vercelConfig, /"source": "\/index\.md"/)
assert.match(netlifyConfig, /Vary = "Accept, Accept-Encoding"/)
assert.match(indexPage, /rel="alternate"[\s\S]*type="text\/markdown"/)

const [
  homeHtml,
  homeMarkdown,
  llms,
  notFound,
  homepageSource,
  blogFirstPage,
  contactPage,
  privacyPage,
] = await Promise.all([
  readProjectFile('dist/index.html'),
  readProjectFile('dist/index.md'),
  readProjectFile('dist/llms.txt'),
  readProjectFile('dist/404.html'),
  readProjectFile('src/components/home-page.astro'),
  readProjectFile('dist/blog/index.html'),
  readProjectFile('dist/contact/index.html'),
  readProjectFile('dist/privacy/index.html'),
])

const homeText = htmlToText(homeHtml)

assert.equal(homeMarkdown, HOME_MARKDOWN)
assert.equal(llms, LLMS_TXT)
assert.match(homeHtml, /<h1[^>]*>邢平cn&#39;s blog<\/h1>/)
assert.match(homeHtml, /<h2[^>]*>关于本站<\/h2>/)
assert.match(homeHtml, /<h3[^>]*>阅读与引用<\/h3>/)
assert.match(homeHtml, /<script type="application\/ld\+json">/)
assert.match(homeHtml, /"@type":"Person"/)
assert.match(homeHtml, /"@type":"WebSite"/)
assert.match(homeHtml, /"@type":"Blog"/)
assert(
  homeText.length > 500,
  'home HTML should contain meaningful server-rendered text',
)
assert(
  homeText.length / homeHtml.length >= 0.05,
  `home text efficiency should be at least 5%, got ${(
    (homeText.length / homeHtml.length) *
    100
  ).toFixed(2)}%`,
)
assert.match(homepageSource, /Accept: text\/markdown/)
assert.match(notFound, /页面不存在/)
assert.match(notFound, /href="\/sitemap\.xml"/)
assert.match(notFound, /href="\/llms\.txt"/)
assert.match(contactPage, /<h1[^>]*>联系<\/h1>/)
assert(
  htmlToText(contactPage).length >= 500,
  'contact page should provide enough information for trust verification',
)
assert.match(privacyPage, /<h1[^>]*>隐私说明<\/h1>/)
assert(
  htmlToText(privacyPage).length >= 500,
  'privacy page should provide enough information for trust verification',
)
assert.match(
  homeHtml,
  /<link rel="next" href="https:\/\/xingpingcn\.top\/page\/2\/">/,
)
assert.match(
  blogFirstPage,
  /<link rel="next" href="https:\/\/xingpingcn\.top\/blog\/2\/">/,
)

const pagedHome = await readProjectFile('dist/page/2/index.html')
const pagedBlog = await readProjectFile('dist/blog/2/index.html')

assert.match(pagedHome, /<link rel="prev" href="https:\/\/xingpingcn\.top\/">/)
assert.match(
  pagedBlog,
  /<link rel="prev" href="https:\/\/xingpingcn\.top\/blog\/">/,
)
