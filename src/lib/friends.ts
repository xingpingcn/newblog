import { SITE } from '@/consts'

export type FriendLabel = {
  name: string
  color?: string
}

export type FriendSite = {
  title: string
  url: string
  avatar?: string
  screenshot?: string
  description?: string
  issue_number?: number
  labels?: FriendLabel[]
}

type FriendsResponse = {
  version?: string
  content?: FriendSite[]
}

function isValidUrl(url: string | undefined): url is string {
  if (!url) return false

  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function normalizeCdnUrl(url: string | undefined) {
  if (!url) return ''

  return url
    .replace('https://cdn.jsdelivr.net/gh/', 'https://cdn.jsdmirror.com/gh/')
    .replace('https://jsd.cdn.zzko.cn/gh/', 'https://cdn.jsdmirror.com/gh/')
    .replace('https://jsd.cdn.zzko.us/gh/', 'https://cdn.jsdmirror.com/gh/')
    .replace(
      'https://jsd.onmicrosoft.cn/npm/',
      'https://cdn.jsdmirror.com/npm/',
    )
}

function hasActiveLabel(site: FriendSite) {
  return site.labels?.some(
    (label) => label.name.trim().toLowerCase() === 'active',
  )
}

function normalizeFriendSite(site: FriendSite): FriendSite | null {
  if (!site.title || !isValidUrl(site.url) || !hasActiveLabel(site)) return null

  return {
    title: site.title.trim(),
    url: site.url,
    avatar: normalizeCdnUrl(site.avatar),
    screenshot: normalizeCdnUrl(site.screenshot),
    description: site.description?.trim(),
    issue_number: site.issue_number,
    labels: Array.isArray(site.labels)
      ? site.labels.filter((label) => Boolean(label.name))
      : [],
  }
}

export async function getFriendSites() {
  try {
    const response = await fetch(SITE.friends.api)
    if (!response.ok) return []

    const data = (await response.json()) as FriendsResponse
    if (!Array.isArray(data.content)) return []

    return data.content
      .map(normalizeFriendSite)
      .filter((site): site is FriendSite => Boolean(site))
  } catch {
    return []
  }
}
