import type { APIRoute } from 'astro'

const getRobotsTxt = (sitemapURL: URL) => `
User-agent: *
Disallow: /404.html
Disallow: /test4.html
Disallow: https://stats.xingpingcn.top/share/XoDdV8TeKUUp8E8f/xingpingcn
Disallow: /check.html
Allow: /

Sitemap: ${sitemapURL.href}
`

export const GET: APIRoute = ({ site }) => {
  const sitemapURL = new URL('sitemap.xml', site)
  return new Response(getRobotsTxt(sitemapURL))
}
