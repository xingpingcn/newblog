export type Site = {
  title: string
  description: string
  href: string
  author: string
  locale: string
  featuredPostCount: number
  postsPerPage: number
  verification: {
    baidu: string
    google: string[]
    bing: string
  }
  analytics: {
    umami: {
      src: string
      websiteId: string
    }
  }
  comments: {
    title: string
    giscus: {
      repo: string
      repoId: string
      category: string
      categoryId: string
      mapping: string
      strict: string
      reactionsEnabled: string
      emitMetadata: string
      inputPosition: string
      lang: string
      theme: {
        light: string
        dark: string
      }
    }
  }
  friends: {
    api: string
    repo: string
    applyUrl: string
  }
}

export type FigureImage = {
  src: string
  alt?: string
  caption?: string
  width?: number
  height?: number
}

export type SocialLink = {
  href: string
  label: string
  external?: boolean
}

export type IconMap = {
  [key: string]: string
}
