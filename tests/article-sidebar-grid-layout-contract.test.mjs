import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

const root = new URL('../', import.meta.url)

async function readProjectFile(path) {
  return await readFile(new URL(path, root), 'utf8')
}

const articleLicense = await readProjectFile('src/components/article-license.astro')
const tocSidebar = await readProjectFile('src/components/toc-sidebar.astro')
const subpostsSidebar = await readProjectFile('src/components/subposts-sidebar.astro')
const postPage = await readProjectFile('src/pages/[...id].astro')

for (const [name, source] of [
  ['desktop article TOC sidebar', tocSidebar],
  ['desktop subposts sidebar', subpostsSidebar],
]) {
  assert.match(
    source,
    /self-start/,
    `${name} should opt out of CSS grid row stretching`,
  )

  assert.doesNotMatch(
    source,
    /(?:^|[\s"'])h-\[calc\(100vh-5rem\)\](?:[\s"']|$)/,
    `${name} should not force a full viewport-height grid row`,
  )

  assert.match(
    source,
    /max-h-\[calc\(100vh-5rem\)\]/,
    `${name} should keep its viewport cap without contributing fixed row height`,
  )
}

assert.match(
  articleLicense,
  /self-start/,
  'article license card should keep its natural height inside the article grid',
)

const subpostsSidebarIndex = postPage.indexOf('<SubpostsSidebar')
const articleIndex = postPage.indexOf('<article')
const articleLicenseIndex = postPage.indexOf('<ArticleLicense')

assert(
  subpostsSidebarIndex > articleIndex && subpostsSidebarIndex < articleLicenseIndex,
  'desktop subposts sidebar should be emitted beside the article body before the license card',
)

assert(
  articleLicenseIndex > articleIndex,
  'article license should remain after the article body',
)
