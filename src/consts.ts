import type { IconMap, SocialLink, Site } from '@/types'

export const SITE: Site = {
  title: "邢平cn's blog",
  description: '写一些东西，分享踩过的坑',
  href: 'https://xingpingcn.top',
  author: '邢平cn',
  locale: 'zh-CN',
  featuredPostCount: 10,
  postsPerPage: 10,
  verification: {
    baidu: 'codeva-YAzFP8xLyl',
    google: [
      'V0xP7Y4QzB_ScafHX7-S2BfeCRV_-XVl3bfGqoAVMhE',
      'XHVY0PDZyZ7ACGyjyV1zXsTCbyx1oiHwPXqNqohewN8',
      'UV9-s7hs9WGL1KUfcQMeZFo83Gm-lyC-TQeToEK9p5U',
    ],
    bing: '951569F61C2A3839DF6ED4C9489F159A',
  },
  analytics: {
    umami: {
      src: 'https://stats.xingpingcn.top/script.js',
      websiteId: '10ffb03e-dc4f-4298-92cc-c99b01b0fa63',
    },
  },
  friends: {
    api: 'https://raw.githubusercontent.com/xingpingcn/friends/output/v2/data.json',
    repo: 'xingpingcn/friends',
    applyUrl: 'https://github.com/xingpingcn/friends/issues',
  },
}

export const NAV_LINKS: SocialLink[] = [
  {
    href: '/',
    label: '首页',
  },
  {
    href: '/authors',
    label: '作者',
  },
  {
    href: '/tags',
    label: '标签',
  },
  {
    href: '/friends',
    label: '友链',
  },
  {
    href: 'https://www.travellings.cn/go.html',
    label: '开往',
    external: true,
  },
  {
    href: '/about',
    label: '关于',
  },
]

export const SOCIAL_LINKS: SocialLink[] = [
  {
    href: 'https://github.com/xingpingcn',
    label: 'GitHub',
  },
  {
    href: 'mailto:zzy4on9@outlook.com',
    label: 'Email',
  },
  {
    href: '/rss.xml',
    label: 'RSS',
  },
]

export const ICON_MAP: IconMap = {
  Website: 'lucide:globe',
  GitHub: 'lucide:github',
  LinkedIn: 'lucide:linkedin',
  Twitter: 'lucide:twitter',
  Email: 'lucide:mail',
  RSS: 'lucide:rss',
}
