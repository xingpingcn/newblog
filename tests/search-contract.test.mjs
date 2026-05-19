import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

const root = new URL('../', import.meta.url)

async function readProjectFile(path) {
  return await readFile(new URL(path, root), 'utf8')
}

const packageJson = JSON.parse(await readProjectFile('package.json'))
const postPage = await readProjectFile('src/pages/[...id].astro')
const header = await readProjectFile('src/components/header.astro')
const searchPage = await readProjectFile('src/pages/search.astro')

assert.match(
  packageJson.scripts.build,
  /pagefind\s+--site\s+dist\s+--glob\s+["']\*\*\/index\.html["']/,
  'build script should generate a Pagefind index from dist',
)

assert.match(
  postPage,
  /data-pagefind-body/,
  'article page should mark the content Pagefind is allowed to index',
)

assert.match(
  postPage,
  /data-pagefind-meta="title"/,
  'article page should expose the title as Pagefind metadata',
)

assert.match(
  postPage,
  /data-pagefind-filter="tag"/,
  'article page should expose tags as Pagefind filters',
)

assert.match(
  header,
  /href="\/search"/,
  'header should expose a search entry point',
)

assert.match(
  searchPage,
  /\/pagefind\/pagefind\.js/,
  'search page should load the generated Pagefind client',
)

assert.match(
  searchPage,
  /pagefind\.search/,
  'search page should execute searches through Pagefind',
)
