import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const root = new URL('../', import.meta.url)
const cdnRoot =
  'https://cdn.jsdmirror.com/gh/xingpingcn/picx-images-hosting@master/optimized/newblog'

async function readDistPage(path) {
  return await readFile(new URL(`dist/${path}`, root), 'utf8')
}

function findImage(html, alt) {
  return html.match(new RegExp(`<img\\b(?=[^>]*alt="${alt}")[^>]*>`))?.[0] ?? ''
}

test('serves home cover variants directly from jsdmirror', async () => {
  const homePage = await readDistPage('index.html')
  const firstCover = findImage(
    homePage,
    '提升部署在 cloudflare、vercel 或 netlify 的网站在中国国内的访问速度和稳定性',
  )

  assert.match(firstCover, new RegExp(`${cdnRoot}/home/67xbdgmn0b-1200\\.webp`))
  for (const width of [480, 768, 1200]) {
    assert.match(
      firstCover,
      new RegExp(`${cdnRoot}/home/67xbdgmn0b-${width}\\.webp ${width}w`),
    )
  }
  assert.match(
    firstCover,
    /sizes="\(min-width: 640px\) 16rem, calc\(100vw - 2rem\)"/,
  )
  assert.doesNotMatch(firstCover, /\/_astro\//)
})

test('shares the published About avatar for the header logo on every page', async () => {
  const aboutPage = await readDistPage('about/index.html')
  const avatar = findImage(aboutPage, 'Avatar of 邢平cn')
  const avatarSrc = avatar.match(/\bsrc="([^"]+)"/)?.[1]

  assert.ok(avatarSrc, 'the About profile must have an image source')
  assert.match(avatarSrc, new RegExp(`^${cdnRoot}/avatar/`))

  for (const path of [
    'index.html',
    'about/index.html',
    'enhanced-faas-in-cn/index.html',
  ]) {
    const logo = findImage(await readDistPage(path), 'Logo')
    const logoSrc = logo.match(/\bsrc="([^"]+)"/)?.[1]

    assert.equal(logoSrc, avatarSrc, `${path} should reuse the About image`)
    assert.match(logo, /width="32"/)
    assert.match(logo, /height="32"/)
    assert.match(logo, /loading="eager"/)
    assert.doesNotMatch(
      logo,
      /\b(?:srcset|sizes)=|optimized\/newblog\/logo|\/_astro\//,
    )
  }
})

test('serves article covers and the author avatar directly from jsdmirror', async () => {
  const articlePage = await readDistPage('enhanced-faas-in-cn/index.html')
  const cover = findImage(
    articlePage,
    '提升部署在 cloudflare、vercel 或 netlify 的网站在中国国内的访问速度和稳定性',
  )

  assert.match(cover, new RegExp(`${cdnRoot}/home/67xbdgmn0b-1200\\.webp`))
  assert.match(
    cover,
    /sizes="\(min-width: 1056px\) 64rem, calc\(100vw - 2rem\)"/,
  )
  assert.match(cover, /fetchpriority="high"/)
  assert.match(
    articlePage,
    new RegExp(`${cdnRoot}/avatar/74vk4cdjex40-256\\.webp`),
  )
})
