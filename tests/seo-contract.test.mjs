import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

const root = new URL('../', import.meta.url)

async function readProjectFile(path) {
  return await readFile(new URL(path, root), 'utf8')
}

const pageHead = await readProjectFile('src/components/page-head.astro')
const postHead = await readProjectFile('src/components/post-head.astro')
const robotsRoute = await readProjectFile('src/pages/robots.txt.ts')
const homeSidebar = await readProjectFile('src/components/home-sidebar.astro')
const testPost = await readProjectFile('src/content/blog/test4/index.mdx')
const homePage = await readProjectFile('dist/index.html')
const blogPage = await readProjectFile('dist/blog/index.html')
const repostPage = await readProjectFile('dist/在git中忽略文件操作-转/index.html')
const articlePage = await readProjectFile(
  'dist/traefik-with-waf-mtls-autocertrenew/index.html',
)
const sitemap = await readProjectFile('dist/sitemap-0.xml')

assert.match(
  pageHead,
  /canonical\s*=\s*Astro\.url\.href/,
  'PageHead should default canonical URLs to the current rendered page',
)

assert.match(
  blogPage,
  /<link rel="canonical" href="https:\/\/xingpingcn\.top\/blog\/">/,
  'blog listing page should canonicalize to /blog/, not the home page',
)

assert.match(
  homePage,
  /<link rel="canonical" href="https:\/\/xingpingcn\.top\/">/,
  'home page should keep a canonical URL with a trailing slash',
)

assert.match(
  postHead,
  /post\.data\.canonicalURL\s*\?\?\s*Astro\.url\.href/,
  'PostHead should use canonicalURL frontmatter when a repost has an original source',
)

assert.match(
  repostPage,
  /<link rel="canonical" href="https:\/\/www\.cnblogs\.com\/liuyuelinfighting\/p\/16206037\.html">/,
  'reposted articles should canonicalize to their original source URL',
)

assert.match(
  articlePage,
  /<meta property="og:type" content="article">/,
  'article pages should expose Open Graph article type',
)

assert.match(
  articlePage,
  /<meta property="article:published_time" content="[^"]+">/,
  'article pages should expose published time metadata',
)

assert.match(
  articlePage,
  /<script type="application\/ld\+json">[\s\S]*"@type":"BlogPosting"/,
  'article pages should include BlogPosting JSON-LD structured data',
)

assert.match(
  testPost,
  /draft:\s*true/,
  'test4 should be marked as draft so it is not indexed or listed',
)

assert.doesNotMatch(
  sitemap,
  /test4/,
  'test4 should not appear in the generated sitemap',
)

assert.doesNotMatch(
  robotsRoute,
  /Disallow:\s*https?:\/\//,
  'robots.txt rules should not disallow absolute external URLs',
)

assert.doesNotMatch(
  homePage,
  /<a\b(?=[^>]*data-slot="pagination-link")(?=[^>]*data-disabled="true")[^>]*>/,
  'disabled pagination controls should not render uncrawlable anchor elements',
)

assert.match(
  homePage,
  /<span\b(?=[^>]*role="link")(?=[^>]*aria-disabled="true")(?=[^>]*data-slot="pagination-link")(?=[^>]*data-disabled="true")[^>]*>/,
  'disabled pagination controls should keep valid link semantics without rendering anchors',
)

const firstHomeImage =
  homePage.match(/<img\b(?=[^>]*alt="提升部署在 cloudflare、vercel 或 netlify 的网站在中国国内的访问速度和稳定性")[^>]*>/)?.[0] ??
  ''

assert.match(
  firstHomeImage,
  /\sloading="eager"/,
  'the first home article image should load eagerly for mobile LCP',
)

assert.match(
  firstHomeImage,
  /\sfetchpriority="high"/,
  'the first home article image should receive high fetch priority for mobile LCP',
)

assert.doesNotMatch(
  homeSidebar,
  /<span class="text-muted-foreground ml-1">\(\{count\}\)<\/span>/,
  'home sidebar tag counts should avoid muted text on muted badges',
)
