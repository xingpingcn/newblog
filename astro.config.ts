import { defineConfig } from 'astro/config'

import { satteri } from '@astrojs/markdown-satteri'
import mdx from '@astrojs/mdx'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import icon from 'astro-icon'

import tailwindcss from '@tailwindcss/vite'
import {
  blockExpressiveCode,
  inlineExpressiveCode,
} from './src/lib/expressive-code'
import { externalLinks } from './src/lib/external-links'
import { headingAnchors } from './src/lib/heading-anchors'
import { temmlMath } from './src/lib/math'

const processor = satteri({
  features: { math: true },
  mdastPlugins: [inlineExpressiveCode, temmlMath],
  hastPlugins: [externalLinks, blockExpressiveCode, headingAnchors()],
})

export default defineConfig({
  site: 'https://xingpingcn.top',
  build: {
    inlineStylesheets: 'always',
  },
  integrations: [
    mdx({ processor }),
    react(),
    sitemap({
      filter: (page) =>
        !page.endsWith('.html/') && !page.endsWith('/sitemap.xml'),
    }),
    icon(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  server: {
    port: 1234,
    host: true,
  },
  devToolbar: {
    enabled: false,
  },
  markdown: {
    syntaxHighlight: false,
    processor,
  },
})
