import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

const root = new URL('../', import.meta.url)

async function readProjectFile(path) {
  return await readFile(new URL(path, root), 'utf8')
}

const packageJson = JSON.parse(await readProjectFile('package.json'))
const postPage = await readProjectFile('src/pages/[...id].astro')
const header = await readProjectFile('src/components/header.astro')
const themeToggle = await readProjectFile('src/components/theme-toggle.astro')
const layout = await readProjectFile('src/layouts/layout.astro')
const searchClient = await readProjectFile('src/lib/search-client.ts')
const searchDialog = await readProjectFile('src/components/search-dialog.astro')
const searchPage = await readProjectFile('src/pages/search.astro')
const searchResultTemplate = await readProjectFile(
  'src/components/search-result-template.astro',
)

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
  /<article[\s\S]*data-pagefind-body[\s\S]*data-pagefind-meta="title"/,
  'article title metadata should stay inside the Pagefind body scope',
)

assert.match(
  postPage,
  /data-pagefind-filter="tag"/,
  'article page should expose tags as Pagefind filters',
)

assert.match(
  header,
  /data-search-trigger/,
  'header should expose a search dialog trigger',
)

assert.match(
  header,
  /className: 'site-header-icon-button site-header-search size-8'/,
  'header search trigger should use the shared header icon-button style',
)

const globalStyles = await readProjectFile('src/styles/global.css')
assert.match(
  globalStyles,
  /\.site-header-icon-button[\s\S]*width: 2rem;[\s\S]*height: 2rem;[\s\S]*cursor: pointer;/,
  'header icon buttons should have an explicit hit area and pointer cursor',
)

assert.match(
  globalStyles,
  /\.site-header-icon-button:hover,[\s\S]*\.site-header-icon-button:focus-visible[\s\S]*background-color: var\(--muted\);[\s\S]*color: var\(--foreground\);/,
  'header icon buttons should provide consistent hover and focus feedback',
)

assert.match(
  header,
  /className: 'site-header-icon-button site-header-menu-trigger size-8'/,
  'header menu trigger should use the shared icon-button style',
)

assert.match(
  header,
  /className: 'site-header-icon-button size-8'/,
  'header source link should use the shared icon-button style',
)

assert.match(
  themeToggle,
  /className="site-header-icon-button size-8"/,
  'theme toggle should use the shared header icon-button style',
)

assert.match(
  layout,
  /<SearchDialog\s*\/>/,
  'layout should render the global search dialog',
)

assert.match(
  searchDialog,
  /<dialog[\s\S]*data-search-dialog[\s\S]*role="dialog"[\s\S]*aria-modal="true"[\s\S]*aria-labelledby=/,
  'search dialog should expose native dialog semantics',
)

assert.match(
  searchDialog,
  /data-search-dialog-all[\s\S]*查看全部搜索结果/,
  'search dialog should link to all search results',
)

assert.match(
  searchDialog,
  /SEARCH_DIALOG_RESULT_LIMIT/,
  'search dialog should cap its preview results',
)

assert.match(
  searchClient,
  /pagefindPath\s*=\s*['"]\/pagefind\/pagefind\.js['"]/,
  'search page should load the generated Pagefind client',
)

assert.match(
  searchPage,
  /searchPagefind/,
  'search page should execute searches through Pagefind',
)

assert.match(
  searchClient,
  /export async function prepareSearchPagefind/,
  'search client should expose an index warmup operation',
)

assert.match(
  searchDialog,
  /prepareSearchPagefind\(\)/,
  'opening the search dialog should warm the Pagefind index',
)

assert.match(
  searchDialog,
  /window\.setTimeout\([\s\S]*?, 120\)/,
  'dialog input search should debounce rapid typing',
)

assert.match(
  searchPage,
  /window\.setTimeout\([\s\S]*?, 120\)/,
  'search page input should debounce rapid typing',
)

assert.match(
  searchPage,
  /data-search-pagination-container/,
  'search page should render a pagination container',
)

assert.match(
  searchClient,
  /SEARCH_PAGE_SIZE\s*=\s*20/,
  'search page should use twenty results per page',
)

assert.match(
  searchClient,
  /page\s*>\s*1[\s\S]*params\.set\('page'/,
  'search URLs should preserve pagination state',
)

assert.match(
  searchResultTemplate,
  /data-search-result-detail-link[\s\S]*aria-label="查看文章详情"[\s\S]*title="查看文章详情"/,
  'search result detail control should remain accessible when icon-only',
)

assert.doesNotMatch(
  searchResultTemplate,
  /<span>查看详情<\/span>/,
  'search result detail control should not render a separate text label',
)

assert.match(
  searchClient,
  /renderHighlightedText\(title,[\s\S]*query\)/,
  'search result titles should highlight the active query',
)

assert.match(
  searchDialog,
  /renderSearchResult\(result, resultTemplate, query\)/,
  'search dialog should pass its query to result title highlighting',
)

assert.match(
  searchPage,
  /renderSearchResult\(result, resultTemplate, query\)/,
  'search page should pass its query to result title highlighting',
)

assert.match(
  searchClient,
  /mark\.className = 'search-result-highlight'/,
  'title highlights should use the shared search highlight class',
)

assert.match(
  searchClient,
  /mark\.classList\.add\('search-result-highlight'\)/,
  'Pagefind excerpt highlights should use the shared search highlight class',
)

assert.doesNotMatch(
  searchDialog,
  /window\.location\.assign\(/,
  'full search navigation should stay inside Astro client routing',
)
