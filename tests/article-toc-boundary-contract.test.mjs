import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

const root = new URL('../', import.meta.url)

async function readProjectFile(path) {
  return await readFile(new URL(path, root), 'utf8')
}

const postPage = await readProjectFile('src/pages/[...id].astro')
const mobileToc = await readProjectFile('src/components/toc-header.astro')
const sidebarToc = await readProjectFile('src/components/toc-sidebar.astro')

assert.match(
  postPage,
  /<article\s+class="prose[^"]*"\s+data-pagefind-body\s+data-article-content/,
  'article page should mark the prose body as the TOC content boundary',
)

for (const [name, source] of [
  ['mobile article TOC', mobileToc],
  ['desktop article TOC', sidebarToc],
]) {
  assert.match(
    source,
    /document\.querySelector<HTMLElement>\(\s*['"]\[data-article-content\]['"],?\s*\)/,
    `${name} should resolve the article content container before collecting headings`,
  )

  assert.match(
    source,
    /contentContainer\.querySelectorAll<HTMLElement>\(\s*['"]h2,\s*h3,\s*h4,\s*h5,\s*h6['"],?\s*\)/,
    `${name} should collect headings only from the article content container`,
  )

  assert.match(
    source,
    /const contentEnd =\s*contentContainer\.offsetTop\s*\+\s*contentContainer\.offsetHeight/,
    `${name} should end the last heading region at the article content bottom`,
  )

  assert.doesNotMatch(
    source,
    /end:\s*nextHeading\s*\?\s*nextHeading\.offsetTop\s*:\s*document\.body\.scrollHeight/,
    `${name} should not let the final heading region extend into comments or footer content`,
  )
}

assert.match(
  mobileToc,
  /const scrollableDistance\s*=\s*Math\.max\(\s*contentEnd\s*-\s*window\.innerHeight,\s*0,?\s*\)/,
  'mobile article TOC progress should be based on article content height, not the full page with comments',
)

assert.match(
  mobileToc,
  /const COMMENTS_SECTION_TEXT = ['"]评论区['"]/,
  'mobile article TOC should label the current section as 评论区 when the comments section is active',
)

assert.match(
  mobileToc,
  /static isCommentsSectionActive\(\)/,
  'mobile article TOC should detect whether the comments section is currently active',
)

assert.match(
  mobileToc,
  /this\.isCommentsSectionActive\(\)[\s\S]*?COMMENTS_SECTION_TEXT/,
  'mobile article TOC should show 评论区 instead of Overview after the article content ends',
)

assert.match(
  mobileToc,
  /if\s*\(\s*this\.isCommentsSectionActive\(\)\s*\)\s*\{[\s\S]*?this\.updateCurrentSectionText\(\[\]\)[\s\S]*?return[\s\S]*?\}/,
  'mobile article TOC should let the comments section override any still-visible final article headings',
)

assert.match(
  mobileToc,
  /state\.currentSectionText\.textContent\s*=\s*COMMENTS_SECTION_TEXT[\s\S]*?return/,
  'mobile article TOC should stop before heading text can overwrite the 评论区 label',
)

assert.doesNotMatch(
  mobileToc,
  /data-heading-id=\{['"]comments['"]\}|href=\{?['"]#comments['"]\}?/,
  'comments should not be added as a normal mobile TOC list item',
)
