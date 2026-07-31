export const SEARCH_PAGE_SIZE = 20
export const SEARCH_DIALOG_RESULT_LIMIT = 10

export interface PagefindResultData {
  url: string
  excerpt: string
  plain_excerpt?: string
  meta: Record<string, string | undefined>
}

export interface PagefindSearchResult {
  data: () => Promise<PagefindResultData>
}

interface PagefindModule {
  init: () => Promise<void>
  search: (
    term: string,
    options?: { sort?: Record<string, 'asc' | 'desc'> },
  ) => Promise<{ results: PagefindSearchResult[] }>
}

let pagefindPromise: Promise<PagefindModule> | undefined
let pagefindInitPromise: Promise<void> | undefined

async function loadPagefind() {
  const pagefindPath = '/pagefind/pagefind.js'
  pagefindPromise ??= import(/* @vite-ignore */ pagefindPath)
  return await pagefindPromise
}

export async function prepareSearchPagefind() {
  const pagefind = await loadPagefind()
  pagefindInitPromise ??= pagefind.init().catch((error) => {
    pagefindInitPromise = undefined
    throw error
  })
  await pagefindInitPromise
  return pagefind
}

export async function searchPagefind(query: string) {
  const pagefind = await prepareSearchPagefind()
  const response = await pagefind.search(query)

  return {
    results: response.results,
    total: response.results.length,
  }
}

export async function loadResultData(
  results: PagefindSearchResult[],
  start: number,
  end: number,
) {
  return await Promise.all(
    results.slice(start, end).map((result) => result.data()),
  )
}

export function searchPageHref(query: string, page = 1) {
  const params = new URLSearchParams()
  const normalizedQuery = query.trim()

  if (normalizedQuery) params.set('q', normalizedQuery)
  if (page > 1) params.set('page', String(page))

  const queryString = params.toString()
  return queryString ? `/search/?${queryString}` : '/search/'
}

export function getSearchPageCount(totalResults: number) {
  return Math.max(1, Math.ceil(totalResults / SEARCH_PAGE_SIZE))
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function renderHighlightedText(
  element: HTMLElement,
  text: string,
  query: string,
) {
  const terms = [...new Set(query.trim().split(/\s+/).filter(Boolean))].sort(
    (left, right) => right.length - left.length,
  )

  if (terms.length === 0) {
    element.textContent = text
    return
  }

  const pattern = new RegExp(terms.map(escapeRegExp).join('|'), 'giu')
  const fragment = document.createDocumentFragment()
  let cursor = 0

  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0
    fragment.append(document.createTextNode(text.slice(cursor, start)))

    const mark = document.createElement('mark')
    mark.className = 'search-result-highlight'
    mark.textContent = match[0]
    fragment.append(mark)
    cursor = start + match[0].length
  }

  fragment.append(document.createTextNode(text.slice(cursor)))
  element.replaceChildren(fragment)
}

export function renderSearchResult(
  result: PagefindResultData,
  template: HTMLTemplateElement,
  query: string,
) {
  const item = template.content.firstElementChild?.cloneNode(
    true,
  ) as HTMLLIElement | null

  if (!item) throw new Error('Search result template is empty.')

  const titleLink = item.querySelector<HTMLAnchorElement>(
    '[data-search-result-title-link]',
  )
  const title = item.querySelector<HTMLElement>('[data-search-result-title]')
  const meta = item.querySelector<HTMLElement>('[data-search-result-meta]')
  const excerpt = item.querySelector<HTMLElement>(
    '[data-search-result-excerpt]',
  )
  const detailLink = item.querySelector<HTMLAnchorElement>(
    '[data-search-result-detail-link]',
  )

  if (!titleLink || !title || !meta || !excerpt || !detailLink) {
    throw new Error('Search result template is missing required elements.')
  }

  renderHighlightedText(title, result.meta.title || '未命名文章', query)
  titleLink.href = result.url
  detailLink.href = result.url

  const metaText = result.meta.date?.trim() ?? ''
  meta.textContent = metaText
  meta.hidden = metaText.length === 0
  excerpt.innerHTML = result.excerpt
  excerpt.querySelectorAll('mark').forEach((mark) => {
    mark.classList.add('search-result-highlight')
  })

  return item
}

export function renderSearchPagination(
  container: HTMLElement,
  template: HTMLTemplateElement,
  totalResults: number,
  currentPage: number,
  onPageChange: (page: number) => void,
) {
  container.replaceChildren()
  const pageCount = getSearchPageCount(totalResults)

  if (pageCount <= 1) {
    container.hidden = true
    return pageCount
  }

  const navigation = template.content.firstElementChild?.cloneNode(
    true,
  ) as HTMLElement | null
  if (!navigation) throw new Error('Search pagination template is empty.')

  const previous = navigation.querySelector<HTMLButtonElement>(
    '[data-search-page-prev]',
  )
  const next = navigation.querySelector<HTMLButtonElement>(
    '[data-search-page-next]',
  )
  const numbers = navigation.querySelector<HTMLElement>(
    '[data-search-page-numbers]',
  )

  if (!previous || !next || !numbers) {
    throw new Error('Search pagination template is missing required elements.')
  }

  previous.disabled = currentPage <= 1
  next.disabled = currentPage >= pageCount
  previous.addEventListener('click', () => onPageChange(currentPage - 1))
  next.addEventListener('click', () => onPageChange(currentPage + 1))

  for (let page = 1; page <= pageCount; page += 1) {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'search-page-number'
    button.textContent = String(page)
    button.setAttribute('aria-label', `第 ${page} 页`)
    button.title = `第 ${page} 页`
    if (page === currentPage) button.setAttribute('aria-current', 'page')
    button.addEventListener('click', () => onPageChange(page))
    numbers.append(button)
  }

  container.hidden = false
  container.append(navigation)
  return pageCount
}
