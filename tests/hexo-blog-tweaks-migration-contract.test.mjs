import { access, readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

const root = new URL('../', import.meta.url)

const parentSlug = 'hexo-blog-tweaks'
const movedPosts = [
  {
    oldSlug: 'hexo折腾',
    newSlug: 'hexo折腾',
    order: 1,
  },
  {
    oldSlug: '为hexo博客添加自适应图片占位图',
    newSlug: '为hexo博客添加自适应图片占位图',
    order: 2,
  },
  {
    oldSlug: '使用freecdn-js提高hexo博客的cdn稳定性',
    newSlug: '使用freecdn-js提高hexo博客的cdn稳定性',
    order: 3,
  },
  {
    oldSlug: '为volantis添加cdn加速',
    newSlug: '为volantis添加cdn加速',
    order: 4,
  },
  {
    oldSlug: 'npm图床(不需要本地部署)',
    newSlug: 'npm图床不需要本地部署',
    order: 5,
    extraOldSlugs: ['npm图床不需要本地部署'],
  },
]

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

assert.equal(
  await exists(`src/content/blog/${parentSlug}/index.mdx`),
  true,
  'Hexo tweak collection should have a parent index post',
)

for (const { oldSlug, newSlug, order } of movedPosts) {
  assert.equal(
    await exists(`src/content/blog/${parentSlug}/${newSlug}.mdx`),
    true,
    `${newSlug} should move under the Hexo tweak collection as an Erudite-style subpost`,
  )

  assert.equal(
    await exists(`src/content/blog/${oldSlug}/index.mdx`),
    false,
    `${oldSlug} should no longer exist as a top-level post`,
  )

  const subpost = await readProjectFile(
    `src/content/blog/${parentSlug}/${newSlug}.mdx`,
  )
  assert.match(
    subpost,
    new RegExp(`order:\\s*${order}`),
    `${newSlug} should keep a stable subpost order`,
  )
}

const netlify = await readProjectFile('netlify.toml')
const vercel = await readProjectFile('vercel.json')
const parentIndex = await readProjectFile(
  `src/content/blog/${parentSlug}/index.mdx`,
)
const npmImageHostPost = await readProjectFile(
  `src/content/blog/${parentSlug}/npm图床不需要本地部署.mdx`,
)
const pythonBashPost = await readProjectFile(
  'src/content/blog/在python中运行bash(windows)/index.mdx',
)
const hexoTweakPost = await readProjectFile(
  `src/content/blog/${parentSlug}/hexo折腾.mdx`,
)
const traefikPost = await readProjectFile(
  'src/content/blog/traefik-with-waf-mtls-autocertrenew/index.mdx',
)

assert.match(
  parentIndex,
  /title:\s*['"]Hexo 博客折腾['"]/,
  'parent index should use a clear Chinese title while keeping an English slug',
)

assert.match(
  parentIndex,
  /description:\s*['"]整理旧 Hexo\/Volantis 博客折腾相关记录/,
  'parent index should explain the grouped topic for listings and SEO',
)

assert.match(
  parentIndex,
  /<Callout\s+variant="warning"\s+title="兼容性提醒">/,
  'parent index should warn that old Hexo/Volantis notes may not match the current theme',
)

assert.match(
  parentIndex,
  /路由、组件、图片处理、代码高亮和构建流程/,
  'parent index should explain why some old theme instructions are incompatible now',
)

for (const { source, title, language, description } of [
  {
    source: npmImageHostPost,
    title: 'package.json',
    language: 'json',
    description: 'npm image host package manifest',
  },
  {
    source: npmImageHostPost,
    title: 'npm-publish.yml',
    language: 'yaml',
    description: 'npm image host GitHub Actions workflow',
  },
  {
    source: pythonBashPost,
    title: 'example-1',
    language: 'python',
    description: 'Python subprocess example',
  },
  {
    source: pythonBashPost,
    title: 'output',
    language: 'python',
    description: 'Python subprocess output',
  },
  {
    source: hexoTweakPost,
    title: 'blog/node_modules/hexo-theme-volantis/layout/_widget/blogger.ejs',
    language: 'html',
    description: 'Hexo theme widget path',
  },
  {
    source: traefikPost,
    title: '配置结构',
    language: 'text',
    description: 'Traefik configuration tree',
  },
]) {
  assert.match(
    source,
    new RegExp(
      `\`\`\`${language}\\s+title="${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`,
    ),
    `${description} code block should preserve the legacy Hexo codeblock title`,
  )
}

for (const warningDetail of [
  'Hexo',
  'Volantis 模板文件',
  'Astro 内容集合',
  'MDX 组件',
  'Vite',
  'hexo-theme-volantis',
  '标签插件',
  '懒加载脚本',
  'CDN',
]) {
  assert.match(
    parentIndex,
    new RegExp(warningDetail),
    `parent compatibility warning should mention ${warningDetail}`,
  )
}

for (const { oldSlug, newSlug, extraOldSlugs = [] } of movedPosts) {
  const oldSlugs = [oldSlug, ...extraOldSlugs]
  const escapedNewSlug = newSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  for (const redirectSlug of oldSlugs) {
    const escapedRedirectSlug = redirectSlug.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&',
    )
    assert.match(
      netlify,
      new RegExp(
        `from = "/${escapedRedirectSlug}"[\\s\\S]*?to = "/${parentSlug}/${escapedNewSlug}"[\\s\\S]*?status = 301`,
      ),
      `${redirectSlug} should have a Netlify 301 redirect to the nested route`,
    )

    assert.match(
      netlify,
      new RegExp(
        `from = "/${escapedRedirectSlug}\\.html"[\\s\\S]*?to = "/${parentSlug}/${escapedNewSlug}"[\\s\\S]*?status = 301`,
      ),
      `${redirectSlug}.html should have a Netlify 301 redirect to the nested route`,
    )

    const vercelConfig = JSON.parse(vercel)
    assert(
      vercelConfig.redirects.some(
        (redirect) =>
          redirect.source === `/${redirectSlug}` &&
          redirect.destination === `/${parentSlug}/${newSlug}` &&
          redirect.permanent === true,
      ),
      `${redirectSlug} should have a Vercel permanent redirect to the nested route`,
    )

    assert(
      vercelConfig.redirects.some(
        (redirect) =>
          redirect.source === `/${redirectSlug}.html` &&
          redirect.destination === `/${parentSlug}/${newSlug}` &&
          redirect.permanent === true,
      ),
      `${redirectSlug}.html should have a Vercel permanent redirect to the nested route`,
    )
  }
}
