export const HOME_MARKDOWN = `# 邢平cn's blog

写一些东西，分享踩过的坑。

这是一个由邢平cn维护的中文个人博客，记录在日常使用、部署和排障中得到的可复用经验。内容以可验证的实践笔记为主，覆盖 Docker、Linux、网络、域名和 DNS、Web 部署、云平台、脚本与常用开发工具，也保留一部分社会科学阅读、随笔和资料整理。

## When to use this site

Use this site when an agent needs Chinese-language, first-hand notes about self-hosting, containerized services, network routing, DNS, Cloudflare, Vercel, Netlify, command-line tools, or practical troubleshooting. Prefer a specific article when a task names a technology or error. Use the homepage and blog archive when the topic is broad, and use the sitemap to enumerate all public articles.

## How to retrieve content

- Request the homepage with \`Accept: text/markdown\` to receive this compact Markdown representation.
- Use the HTML pages for article reading and their canonical URLs for citations.
- Read [llms.txt](https://xingpingcn.top/llms.txt) for site scope and machine-readable entry points.
- Read [sitemap.xml](https://xingpingcn.top/sitemap.xml) to discover public pages.
- Use [RSS](https://xingpingcn.top/rss.xml) to follow new articles.

## Primary entry points

- [Homepage](https://xingpingcn.top/) - current posts and topic overview.
- [Blog archive](https://xingpingcn.top/blog/) - chronological article listing.
- [Tags](https://xingpingcn.top/tags/) - browse by topic.
- [Authors](https://xingpingcn.top/authors/) - author profile.
- [About](https://xingpingcn.top/about/) - site background and maintenance notes.
- [Contact](https://xingpingcn.top/contact/) - contact scope and response channel.
- [Privacy](https://xingpingcn.top/privacy/) - analytics and third-party service disclosures.

## Retrieval notes

Article URLs are rooted at the site domain. Some older material was migrated from Hexo/Volantis and may preserve compatibility redirects from legacy \`.html\` paths. Articles can contain commands and configuration examples; treat environment-specific values as examples and verify them against the current upstream documentation before applying them to a production system.
`

export const LLMS_TXT = `# 邢平cn's blog

> 中文个人技术博客，记录可复用的部署、运维、网络和工具实践。

## When to use this site

Use this site for Chinese-language, first-hand notes about Docker, Linux, self-hosting, network routing, DNS, Cloudflare, Vercel, Netlify, command-line tools, and practical troubleshooting. Prefer a specific article for a named technology or error; use the archive and sitemap for broad discovery.

## How to retrieve

- Send \`Accept: text/markdown\` to [the homepage](https://xingpingcn.top/) for a compact Markdown representation.
- Use canonical article pages when reading or citing individual notes.
- Enumerate public pages through [the sitemap](https://xingpingcn.top/sitemap.xml).
- Follow updates through [RSS](https://xingpingcn.top/rss.xml).

## Primary pages

- [Homepage](https://xingpingcn.top/): current posts and topic overview.
- [Blog archive](https://xingpingcn.top/blog/): chronological listing.
- [Tags](https://xingpingcn.top/tags/): topic navigation.
- [About](https://xingpingcn.top/about/): site background.
- [Contact](https://xingpingcn.top/contact/): maintainer contact channel.
- [Privacy](https://xingpingcn.top/privacy/): data-handling disclosures.

## Notes

The site is maintained by 邢平cn. Older material migrated from Hexo/Volantis can retain legacy \`.html\` redirects. Commands and configuration snippets are examples; verify version-specific behavior against current upstream documentation before using them in production.
`

const SUPPORTED_MEDIA_TYPES = ['text/html', 'text/markdown']

function parseAcceptHeader(accept) {
  if (!accept?.trim()) return []

  return accept.split(',').flatMap((entry, index) => {
    const [rawMediaType, ...rawParameters] = entry
      .trim()
      .toLowerCase()
      .split(';')
    const mediaType = rawMediaType?.trim()

    if (!mediaType || !mediaType.includes('/')) return []

    const qualityParameter = rawParameters
      .map((parameter) => parameter.trim())
      .find((parameter) => parameter.startsWith('q='))
    const parsedQuality = qualityParameter
      ? Number.parseFloat(qualityParameter.slice(2))
      : 1

    if (!Number.isFinite(parsedQuality)) return []

    return [
      { mediaType, quality: Math.min(Math.max(parsedQuality, 0), 1), index },
    ]
  })
}

function getMediaTypePreference(accept, candidate) {
  const [candidateType, candidateSubtype] = candidate.split('/')
  const matches = parseAcceptHeader(accept)
    .map((entry) => {
      const [type, subtype] = entry.mediaType.split('/')
      const matchesType = type === '*' || type === candidateType
      const matchesSubtype = subtype === '*' || subtype === candidateSubtype

      if (!matchesType || !matchesSubtype) return undefined

      const specificity = Number(type !== '*') + Number(subtype !== '*')
      return { ...entry, specificity }
    })
    .filter(Boolean)

  if (matches.length === 0)
    return { quality: 0, specificity: -1, index: Infinity }

  return matches.reduce((best, current) => {
    if (current.specificity !== best.specificity) {
      return current.specificity > best.specificity ? current : best
    }
    if (current.quality !== best.quality) {
      return current.quality > best.quality ? current : best
    }
    return current.index < best.index ? current : best
  })
}

export function negotiateRepresentation(accept) {
  if (!accept?.trim()) return 'html'

  const candidates = SUPPORTED_MEDIA_TYPES.map((mediaType) => ({
    mediaType,
    ...getMediaTypePreference(accept, mediaType),
  }))
  const acceptable = candidates.filter((candidate) => candidate.quality > 0)

  if (acceptable.length === 0) return 'not-acceptable'

  acceptable.sort((left, right) => {
    if (left.quality !== right.quality) return right.quality - left.quality
    if (left.specificity !== right.specificity) {
      return right.specificity - left.specificity
    }
    if (left.index !== right.index) return left.index - right.index
    return left.mediaType === 'text/html' ? -1 : 1
  })

  return acceptable[0].mediaType === 'text/markdown' ? 'markdown' : 'html'
}

export const NEGOTIATED_RESPONSE_HEADERS = {
  Vary: 'Accept, Accept-Encoding',
  Link: '</index.md>; rel="alternate"; type="text/markdown"',
}
