import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const distDir = path.resolve('dist')
const articleMarker = 'data-article-content'

const redirectPaths = new Map()

async function main() {
  const files = await findIndexPages(distDir)

  for (const file of files) {
    const html = await readFile(file, 'utf8')
    if (!html.includes(articleMarker)) continue

    const routePath = routePathFromIndexPage(file)
    if (routePath === '/') continue

    const title = extractTitle(html)
    addRedirectPath(pathWithoutTrailingSlash(routePath), routePath)
    if (title) addRedirectPath(title, routePath)
  }

  for (const [legacyPath, target] of redirectPaths) {
    const outputFile = path.join(distDir, ...legacyPath.split('/'), 'index.html')
    await mkdir(path.dirname(outputFile), { recursive: true })
    await writeFile(outputFile, renderRedirectPage(target), 'utf8')
  }

  console.log(`Generated ${redirectPaths.size} legacy .html redirects`)
}

async function findIndexPages(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await findIndexPages(fullPath)))
      continue
    }

    if (entry.isFile() && entry.name === 'index.html') {
      files.push(fullPath)
    }
  }

  return files
}

function routePathFromIndexPage(file) {
  const relative = path.relative(distDir, file).split(path.sep).join('/')
  if (relative === 'index.html') return '/'

  return `/${relative.replace(/\/index\.html$/, '/')}`
}

function pathWithoutTrailingSlash(routePath) {
  return routePath.replace(/^\/|\/$/g, '')
}

function addRedirectPath(source, target) {
  const sourcePath = normalizeLegacyPath(source)
  if (!sourcePath) return

  redirectPaths.set(`${sourcePath}.html`, target)
}

function normalizeLegacyPath(source) {
  return source
    .split('/')
    .map((segment) => segment.trim())
    .filter((segment) => segment && segment !== '.' && segment !== '..')
    .join('/')
}

function extractTitle(html) {
  const match = html.match(
    /<h1\b[^>]*data-pagefind-meta=["']title["'][^>]*>([\s\S]*?)<\/h1>/i,
  )

  return match ? decodeHtml(stripTags(match[1])).trim() : ''
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, '')
}

function decodeHtml(value) {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, code) => {
    if (code[0] === '#') {
      const radix = code[1]?.toLowerCase() === 'x' ? 16 : 10
      const number = Number.parseInt(code.slice(radix === 16 ? 2 : 1), radix)
      return Number.isNaN(number) ? entity : String.fromCodePoint(number)
    }

    return (
      {
        amp: '&',
        gt: '>',
        lt: '<',
        quot: '"',
        apos: "'",
        '#39': "'",
      }[code.toLowerCase()] ?? entity
    )
  })
}

function renderRedirectPage(target) {
  const escapedTarget = escapeHtml(target)
  const scriptTarget = JSON.stringify(target)

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="robots" content="noindex" />
    <meta http-equiv="refresh" content="0;url=${escapedTarget}" />
    <link rel="canonical" href="${escapedTarget}" />
    <title>Moved</title>
    <script>
      window.location.replace(${scriptTarget})
    </script>
  </head>
  <body data-pagefind-ignore="all">
    <p>This page has moved to <a href="${escapedTarget}">${escapedTarget}</a>.</p>
  </body>
</html>
`
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

await main()
