import { access, readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

const root = new URL('../', import.meta.url)

async function exists(path) {
  try {
    await access(new URL(path, root))
    return true
  } catch (error) {
    if (error?.code === 'ENOENT') return false
    throw error
  }
}

async function readProjectFile(path) {
  return await readFile(new URL(path, root), 'utf8')
}

const redirectCases = [
  {
    from: 'about.html',
    to: '/about/',
  },
  {
    from: 'aws-lambda-access-internet-in-vpc-without-nat.html',
    to: '/aws-lambda-access-internet-in-vpc-without-nat/',
  },
  {
    from: 'enhanced-faas-in-cn.html',
    to: '/enhanced-faas-in-cn/',
  },
  {
    from: 'hexo-blog-tweaks/hexo折腾.html',
    to: '/hexo-blog-tweaks/hexo折腾/',
  },
  {
    from: '国内各个as系统.html',
    to: '/国内各个as系统/',
  },
  {
    from: 'search.html',
    to: '/search/',
  },
]

const deploymentRedirectCases = [
  {
    from: '/enhanced-FaaS-in-cn.html',
    to: '/enhanced-faas-in-cn/',
  },
  {
    from: '/免费通过NS1利用监控宝平台实现实时基于不同运营商的故障转移.html',
    to: '/免费通过ns1利用监控宝平台实现实时基于不同运营商的故障转移/',
  },
]

const feedRedirectCases = [
  {
    from: '/rss.xml',
    to: 'https://cf-blog.xingpingcn.top/rss.xml',
  },
  {
    from: '/atom.xml',
    to: 'https://cf-blog.xingpingcn.top/rss.xml',
  },
]

for (const { from, to } of redirectCases) {
  const path = `dist/${from}/index.html`

  assert.equal(
    await exists(path),
    true,
    `${from} should build a static redirect page`,
  )

  const html = await readProjectFile(path)

  assert.match(
    html,
    new RegExp(`<meta http-equiv="refresh" content="0;url=${escapeRegExp(to)}"`),
    `${from} should meta-refresh to ${to}`,
  )

  assert.match(
    html,
    new RegExp(`window\\.location\\.replace\\(${escapeRegExp(JSON.stringify(to))}\\)`),
    `${from} should script-redirect to ${to}`,
  )
}

const netlify = await readProjectFile('netlify.toml')
const vercel = JSON.parse(await readProjectFile('vercel.json'))

assert.equal(
  vercel.cleanUrls,
  true,
  'Vercel should redirect static .html paths to clean extensionless URLs',
)

assert.match(
  netlify,
  /\[build\.processing\.html\][\s\S]*?pretty_urls = true/,
  'Netlify should enable Pretty URLs for .html to clean URL handling',
)

for (const { from, to } of feedRedirectCases) {
  assert.match(
    netlify,
    new RegExp(
      `from = "${escapeRegExp(from)}"[\\s\\S]*?to = "${escapeRegExp(to)}"[\\s\\S]*?status = 301`,
    ),
    `${from} should have a Netlify 301 redirect to the canonical RSS feed`,
  )

  assert(
    vercel.redirects.some(
      (redirect) =>
        redirect.source === from &&
        redirect.destination === to &&
        redirect.permanent === true,
    ),
    `${from} should have a Vercel permanent redirect to the canonical RSS feed`,
  )
}

for (const { from, to } of deploymentRedirectCases) {
  assert.match(
    netlify,
    new RegExp(
      `from = "${escapeRegExp(from)}"[\\s\\S]*?to = "${escapeRegExp(to)}"[\\s\\S]*?status = 301`,
    ),
    `${from} should have a Netlify 301 redirect directly to ${to}`,
  )

  assert(
    vercel.redirects.some(
      (redirect) =>
        redirect.source === from &&
        redirect.destination === to &&
        redirect.permanent === true,
    ),
    `${from} should have a Vercel permanent redirect directly to ${to}`,
  )
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
