import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

const root = new URL('../', import.meta.url)

async function readProjectFile(path) {
  return await readFile(new URL(path, root), 'utf8')
}

const consts = await readProjectFile('src/consts.ts')
const types = await readProjectFile('src/types.ts')
const contentConfig = await readProjectFile('src/content.config.ts')
const postPage = await readProjectFile('src/pages/[...id].astro')
const commentsComponent = await readProjectFile(
  'src/components/giscus-comments.astro',
)

assert.match(
  types,
  /comments:\s*\{[\s\S]*?giscus:/,
  'site type should expose the comments configuration',
)

assert.match(
  consts,
  /comments:\s*\{[\s\S]*?repo:\s*['"]xingpingcn\/website\.comments['"]/,
  'comments config should preserve the old Volantis giscus repository',
)

assert.match(
  consts,
  /repoId:\s*['"]R_kgDOJYoQOQ['"]/,
  'comments config should preserve the old giscus repo id',
)

assert.match(
  consts,
  /categoryId:\s*['"]DIC_kwDOJYoQOc4CV4bw['"]/,
  'comments config should preserve the old giscus category id',
)

assert.match(
  consts,
  /inputPosition:\s*['"]top['"]/,
  'comments config should place the giscus input box above the thread',
)

assert.match(
  contentConfig,
  /comments:\s*z\s*\.\s*literal\(\s*false\s*\)\s*\.optional\(\)/,
  'blog content schema should support the old comments: false opt-out',
)

assert.match(
  postPage,
  /import GiscusComments from '@\/components\/giscus-comments\.astro'/,
  'article page should import the giscus comments component',
)

assert.match(
  postPage,
  /post\.data\.comments !== false[\s\S]*?<GiscusComments\s+\/>/,
  'article page should render comments by default and allow comments: false',
)

assert.match(
  commentsComponent,
  /id="comments"/,
  'comments component should preserve the old #comments anchor',
)

assert.match(
  commentsComponent,
  /https:\/\/giscus\.app\/client\.js/,
  'comments component should load the official giscus client on the browser',
)

assert.match(
  commentsComponent,
  /data-repo=\{giscus\.repo\}/,
  'comments component should expose the configured repository to its client loader',
)

assert.match(
  commentsComponent,
  /script\.setAttribute\(\s*['"]data-repo['"],\s*this\.dataset\.repo/,
  'comments component should pass the configured repository to giscus',
)

assert.match(
  commentsComponent,
  /script\.setAttribute\(\s*['"]data-mapping['"],\s*this\.dataset\.mapping/,
  'comments component should use the configured giscus mapping',
)

assert.match(
  commentsComponent,
  /data-astro-rerun/,
  'comments loader should rerun after Astro client-side page swaps',
)

assert.match(
  commentsComponent,
  /postMessage\(\s*\{\s*giscus:/,
  'comments component should update the giscus iframe when the site theme changes',
)

assert.match(
  commentsComponent,
  /function getResolvedSiteTheme\(\)[\s\S]*?localStorage\.getItem\(['"]theme['"]\)[\s\S]*?matchMedia\(['"]\(prefers-color-scheme: dark\)['"]\)/,
  'comments component should resolve the initial giscus theme from stored or system dark mode when html data-theme is not ready',
)

assert.match(
  commentsComponent,
  /iframe\.addEventListener\(\s*['"]load['"],[\s\S]*?iframe\.dataset\.giscusReady\s*=\s*['"]true['"][\s\S]*?this\.updateTheme\(\)[\s\S]*?\{\s*once:\s*true\s*\}/,
  'comments component should resend the active theme after the giscus iframe finishes loading',
)

assert.match(
  commentsComponent,
  /iframe\.dataset\.giscusReady\s*!==\s*['"]true['"][\s\S]*?return/,
  'comments component should avoid sending theme messages before the giscus iframe is ready',
)
