import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

const sourceRoot = process.argv[2] || '/tmp/newblog-migration/blog-source'
const postsDir = path.join(sourceRoot, 'source/_posts')
const outputRoot = path.resolve('src/content/blog')

const authorId = 'xingpingcn'
const siteEmail = 'zzy4on9@outlook.com'
const jsdelivrImageCdn =
  'https://cdn.jsdelivr.net/gh/xingpingcn/picx-images-hosting'
const jsdmirrorImageCdn =
  'https://cdn.jsdmirror.com/gh/xingpingcn/picx-images-hosting'

const variantAliases = new Map([
  ['done', 'tip'],
  ['success', 'tip'],
  ['info', 'note'],
  ['blue', 'note'],
  ['cyan', 'note'],
  ['yellow', 'warning'],
  ['red', 'danger'],
  ['download', 'note'],
])
const validVariants = new Set([
  'note',
  'tip',
  'warning',
  'danger',
  'important',
  'definition',
  'theorem',
  'lemma',
  'proof',
  'corollary',
  'proposition',
  'axiom',
  'conjecture',
  'notation',
  'remark',
  'intuition',
  'recall',
  'explanation',
  'example',
  'exercise',
  'problem',
  'answer',
  'solution',
  'summary',
])
const languageAliases = new Map([
  ['cron', 'text'],
  ['nodejs', 'js'],
  ['javascript', 'js'],
  ['dockerfile', 'docker'],
  ['ymal', 'yaml'],
  ['yml', 'yaml'],
  ['conf', 'properties'],
])

function slugify(filename) {
  return filename
    .replace(/\.md$/i, '')
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[\\/:*?"<>|#[\]{}]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

function splitFrontmatter(raw) {
  const text = raw.replace(/^\uFEFF/, '')
  if (!text.startsWith('---')) {
    return { data: {}, body: text }
  }

  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) {
    return { data: {}, body: text }
  }

  return {
    data: parseSimpleYaml(match[1]),
    body: text.slice(match[0].length),
  }
}

function parseSimpleYaml(yamlText) {
  const data = {}
  const lines = yamlText.replace(/\r\n/g, '\n').split('\n')

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (!line.trim() || line.trimStart().startsWith('#')) continue

    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (!match) continue

    const [, key, rawValue] = match
    if (rawValue === '') {
      const values = []
      while (index + 1 < lines.length) {
        const next = lines[index + 1]
        if (/^[A-Za-z0-9_-]+:\s*/.test(next)) break
        const item = next.match(/^\s*-\s*(.*)$/)
        if (item) values.push(cleanYamlScalar(item[1]))
        index += 1
      }
      data[key] = values.length > 0 ? values : ''
      continue
    }

    data[key] = cleanYamlScalar(rawValue)
  }

  return data
}

function cleanYamlScalar(value) {
  const trimmed = value.trim()
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1)
  }

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed
      .slice(1, -1)
      .split(',')
      .map((item) => cleanYamlScalar(item))
      .filter(Boolean)
  }

  if (trimmed === 'true') return true
  if (trimmed === 'false') return false
  return trimmed
}

function toArray(value) {
  if (Array.isArray(value)) return value.flatMap(toArray).filter(Boolean)
  if (typeof value !== 'string') return value ? [String(value)] : []
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizeDate(value) {
  if (!value) return null
  const text = String(value).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text
  const match = text.match(/^(\d{4}-\d{2}-\d{2})[ T]/)
  if (match) return match[1]
  return text
}

function inferDescription(frontmatter, body) {
  if (frontmatter.description) return String(frontmatter.description).trim()

  const paragraph = body
    .replace(/import .*? from .*?\n/g, '')
    .replace(/<[^>]+>/g, '')
    .split(/\n{2,}/)
    .map((part) => part.replace(/\s+/g, ' ').trim())
    .find(
      (part) =>
        part &&
        !part.startsWith('#') &&
        !part.startsWith('```') &&
        !part.startsWith('{%'),
    )

  return paragraph ? paragraph.slice(0, 160) : '旧博客迁移文章'
}

function escapeFrontmatterString(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "''")
    .replace(/\r?\n/g, ' ')
}

function normalizeCdnUrls(value) {
  return String(value).replaceAll(jsdelivrImageCdn, jsdmirrorImageCdn)
}

function formatArray(values) {
  return `[${values.map((value) => `'${escapeFrontmatterString(value)}'`).join(', ')}]`
}

function serializeLicense(source, slug) {
  if (source.copyright === false) {
    return ['license: false']
  }

  if (source.link) {
    return [
      'license:',
      "  type: 'original'",
      `  sourceTitle: '${escapeFrontmatterString(source.title || slug)}'`,
      `  sourceUrl: '${escapeFrontmatterString(source.link)}'`,
    ]
  }

  return [
    'license:',
    "  type: 'cc-by-nc-sa-4.0'",
  ]
}

function normalizeVariant(value) {
  const raw = String(value || 'note').toLowerCase()
  const aliased = variantAliases.get(raw) || raw
  return validVariants.has(aliased) ? aliased : 'note'
}

function parseBlockHeader(raw) {
  const cleaned = raw.trim()
  const [left = '', ...rest] = cleaned.split('::')
  const leftParts = left.trim().split(/\s+/).filter(Boolean)
  const firstToken = leftParts[0] || 'note'
  const variant = normalizeVariant(firstToken)
  const title =
    rest.join('::').trim() ||
    (validVariants.has(variant) && normalizeVariant(firstToken) === firstToken
      ? leftParts.slice(1).join(' ')
      : cleaned)
  return { variant, title }
}

function parseCodeBlockInfo(rawInfo) {
  const languageMatch = rawInfo.match(/lang:([A-Za-z0-9_-]+)/i)
  const rawLanguage = languageMatch ? languageMatch[1].toLowerCase() : ''
  const title = rawInfo
    .replace(/\s*lang:[A-Za-z0-9_-]+\s*/gi, ' ')
    .replace(/\\/g, '/')
    .replace(/\s+/g, ' ')
    .trim()
  const language =
    languageAliases.get(rawLanguage) || rawLanguage || (title ? 'text' : '')

  return { language, title }
}

function serializeCodeFenceInfo(language, title) {
  return [language, title ? `title=${JSON.stringify(title)}` : '']
    .filter(Boolean)
    .join(' ')
}

function rewriteHexoLinks(markdown, slugMap) {
  return markdown
    .replace(/\]\(\/blog\/([^)#]+)(#[^)]+)?\)/g, (_all, slug, hash = '') => {
      return `](/${slug}${hash})`
    })
    .replace(
      /\]\((\/[^)\s]+?)(?:\.html)(#[^)]+)?\)/gi,
      (all, url, hash = '') => {
        const decoded = decodeURIComponent(url.slice(1)).toLowerCase()
        const target = slugMap.get(decoded)
        if (!target) return all
        return `](/${target}${hash})`
      },
    )
}

function parseMarkdownImages(markdown) {
  const images = []
  const imagePattern = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g
  let match

  while ((match = imagePattern.exec(markdown)) !== null) {
    const alt = match[1].trim()
    const src = normalizeCdnUrls(match[2].trim())
    images.push({ src, alt, caption: alt })
  }

  return images
}

function serializeImages(images) {
  const entries = images
    .map(
      (image) => `    {
      src: ${JSON.stringify(image.src)},
      caption: ${JSON.stringify(image.caption || image.alt || '')},
    }`,
    )
    .join(',\n')

  return `[\n${entries},\n  ]`
}

function serializeFigure(image) {
  return `<Figure
  src=${JSON.stringify(image.src)}
  caption=${JSON.stringify(image.caption || image.alt || '')}
/>`
}

function normalizeEmails(markdown) {
  return markdown.replace(/admin@zhenxiao\.de|email@email\.com/g, siteEmail)
}

async function replaceAsync(text, pattern, replacer) {
  const replacements = []
  text.replace(pattern, (...args) => {
    replacements.push(Promise.resolve(replacer(...args)))
    return args[0]
  })

  const resolved = await Promise.all(replacements)
  let index = 0
  return text.replace(pattern, () => resolved[index++])
}

async function convertGalleryBlocks(markdown) {
  return await replaceAsync(
    markdown,
    /\{%\s*(gallery|swiper)\s*%\}([\s\S]*?)\{%\s*end(?:gallery|swiper)\s*%\}/g,
    async (_all, _kind, content) => {
      const images = parseMarkdownImages(content)
      if (images.length === 0) return content.trim()
      if (images.length === 1) {
        const [image] = images
        return serializeFigure(image)
      }
      return `<ImageGrid
  images={${serializeImages(images)}}
/>`
    },
  )
}

async function convertImageTags(markdown) {
  return await replaceAsync(
    markdown,
    /\{%\s*image\s+([\s\S]*?)\s*%\}/g,
    async (_all, raw) => {
      const parts = raw.split('::').map((part) => part.trim())
      const src = normalizeCdnUrls(parts.shift() || '')
      const altPart = parts.find((part) => part.startsWith('alt='))
      const alt = altPart ? altPart.slice(4).trim() : ''
      return serializeFigure({ src, alt, caption: alt })
    },
  )
}

function convertLinkTags(markdown) {
  return markdown.replace(/\{%\s*link\s+([^%]+?)\s*%\}/g, (_all, raw) => {
    const parts = raw.split('::').map((part) => part.trim())
    const label = parts[0]?.replace(/\|/g, ' / ') || parts[1] || 'link'
    const href = parts[1] || parts[0]
    return `[${label}](${href})`
  })
}

function convertGhcCards(markdown) {
  return markdown.replace(/\{%\s*ghcard\s+([^%]+?)\s*%\}/g, (_all, repo) => {
    const cleanRepo = repo.trim()
    return `[${cleanRepo}](https://github.com/${cleanRepo})`
  })
}

function convertCodeBlocks(markdown) {
  return markdown.replace(
    /\{%\s*codeblock(?:\s+([^%]*?))?\s*%\}([\s\S]*?)\{%\s*endcodeblock\s*%\}/g,
    (_all, rawInfo = '', content) => {
      const { language, title } = parseCodeBlockInfo(rawInfo)
      return `\n\`\`\`${serializeCodeFenceInfo(language, title)}\n${content.replace(/^\n|\n$/g, '')}\n\`\`\`\n`
    },
  )
}

function convertSingleLineNotes(markdown) {
  return markdown
    .replace(
      /^[ \t]*(>+)\s*\{%\s*note\s+([^%]+?)\s*%\}[ \t]*$/gm,
      (_all, marker, raw) => {
        const { title } = parseBlockHeader(raw)
        return `${marker} ${title}`
      },
    )
    .replace(/^[ \t]*\{%\s*note\s+([^%]+?)\s*%\}[ \t]*$/gm, (_all, raw) => {
      const { variant, title } = parseBlockHeader(raw)
      return `<Callout variant=${JSON.stringify(variant)}>${title}</Callout>`
    })
}

function convertBlockCalloutOpeners(markdown) {
  return markdown.replace(
    /^[ \t]*\{%\s*(noteblock|blocknote)\s+([^%]+?)\s*%\}[ \t]*$/gm,
    (_all, _kind, raw) => {
      const { variant, title } = parseBlockHeader(raw)
      return `\n<Callout variant=${JSON.stringify(variant)}${
        title ? ` title=${JSON.stringify(title)}` : ''
      }>`
    },
  )
}

function convertBlockCalloutClosers(markdown) {
  return markdown.replace(
    /^[ \t]*\{%\s*end(?:note|noteblock|blocknote)\s*%\}[ \t]*$/gm,
    '\n</Callout>',
  )
}

function convertInlineDel(markdown) {
  return markdown.replace(/\{%\s*del\s+([^%]+?)\s*%\}/g, '~~$1~~')
}

function convertInlineKbd(markdown) {
  return markdown.replace(/\{%\s*kbd\s+([^%]+?)\s*%\}/g, '<kbd>$1</kbd>')
}

function stripUnknownTags(markdown) {
  return markdown
    .replace(/\{%\s*p\s+([^%]+?)\s*%\}/g, '$1')
    .replace(/\{%\s*timeline\s+([^%]+?)\s*%\}/g, '## $1')
    .replace(/\{%\s*timenode\s+([^|%]+)\|?([^%]*?)\s*%\}/g, '### $1 $2')
    .replace(/\{%\s*end(?:timeline|timenode|sites)\s*%\}/g, '')
    .replace(/\{%\s*sites\s+([^%]+?)\s*%\}/g, '')
}

function normalizeMdxHtml(markdown) {
  return markdown
    .replace(/<br\s*>/gi, '<br />')
    .replace(
      /<details>\s*<summary>([\s\S]*?)<\/summary>/gi,
      (_all, title) =>
        `<Callout variant="warning" title=${JSON.stringify(
          title.trim(),
        )} defaultOpen={false}>`,
    )
    .replace(/<\/details>/gi, '</Callout>')
    .replace(/\sframeborder=/gi, ' frameBorder=')
    .replace(/\sallowfullscreen(?=[\s>])/gi, ' allowFullScreen')
}

function normalizeAngleLinks(markdown) {
  return markdown.replace(
    /<((?:https?:\/\/|mailto:)[^\s>]+)([^>]*)>/g,
    (_all, url, suffix) => {
      const trailingText = suffix.trim()
      return `[${url}](${url})${trailingText ? ` ${trailingText}` : ''}`
    },
  )
}

async function convertBody(markdown, slugMap) {
  let body = normalizeCdnUrls(markdown.replace(/\r\n/g, '\n'))
  body = body.replace(/<!--\s*more\s*-->/gi, '')
  body = rewriteHexoLinks(body, slugMap)
  body = await convertImageTags(body)
  body = await convertGalleryBlocks(body)
  body = convertLinkTags(body)
  body = convertGhcCards(body)
  body = convertCodeBlocks(body)
  body = convertSingleLineNotes(body)
  body = convertBlockCalloutOpeners(body)
  body = convertBlockCalloutClosers(body)
  body = convertInlineDel(body)
  body = convertInlineKbd(body)
  body = stripUnknownTags(body)
  body = normalizeAngleLinks(body)
  body = normalizeMdxHtml(body)
  body = normalizeEmails(body)
  body = body.replace(/\n{3,}/g, '\n\n')
  return body.trim() + '\n'
}

function buildFrontmatter(source, slug, convertedBody) {
  const tags = [...new Set(toArray(source.tags))]
  const keywords = [...new Set(toArray(source.keywords))]

  const date = normalizeDate(source.date) || '2023-04-01'
  const lines = [
    '---',
    `title: '${escapeFrontmatterString(source.title || slug)}'`,
    `description: '${escapeFrontmatterString(inferDescription(source, convertedBody))}'`,
    `date: ${date}`,
    ...(source.pin ? ['pinned: true'] : []),
    `tags: ${formatArray(tags)}`,
    `keywords: ${formatArray(keywords)}`,
    `authors: ${formatArray([authorId])}`,
  ]

  if (source.headimg) {
    lines.push(
      `coverImage: '${escapeFrontmatterString(normalizeCdnUrls(source.headimg))}'`,
    )
  }

  if (source.link) {
    lines.push(`canonicalURL: '${escapeFrontmatterString(source.link)}'`)
  }

  lines.push(...serializeLicense(source, slug))

  lines.push('---')
  return lines.join('\n') + '\n\n'
}

async function main() {
  const files = (await readdir(postsDir))
    .filter((file) => file.endsWith('.md'))
    .sort((a, b) => a.localeCompare(b, 'zh-CN'))

  const slugMap = new Map()
  for (const file of files) {
    const slug = slugify(file)
    slugMap.set(file.replace(/\.md$/i, '').toLowerCase(), slug)
  }

  await rm(outputRoot, { recursive: true, force: true })
  await mkdir(outputRoot, { recursive: true })

  for (const file of files) {
    const slug = slugMap.get(file.replace(/\.md$/i, '').toLowerCase())
    const raw = await readFile(path.join(postsDir, file), 'utf8')
    const { data, body } = splitFrontmatter(raw)
    const convertedBody = await convertBody(body, slugMap)
    const frontmatter = buildFrontmatter(data, slug, convertedBody)
    const imports = [
      "import Callout from '@/components/callout.astro'",
      "import Figure from '@/components/figure.astro'",
      "import ImageGrid from '@/components/image-grid.astro'",
      '',
      '',
    ].join('\n')

    const targetDir = path.join(outputRoot, slug)
    await mkdir(targetDir, { recursive: true })
    await writeFile(
      path.join(targetDir, 'index.mdx'),
      frontmatter + imports + convertedBody,
    )
  }

  console.log(
    `Migrated ${files.length} posts from ${postsDir} to ${outputRoot}`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
