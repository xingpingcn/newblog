# newblog

这是 `xingpingcn.top` 的 Astro 博客源码，由旧的私有 Hexo 源仓库迁移而来。

本仓库是公开仓库。`src/content/blog/` 下生成的 MDX 文章才是预期放在这里的迁移结果。

## 本地开发

安装依赖：

```sh
npm install
```

启动开发服务器：

```sh
npm run dev
```

本地服务地址配置为 `http://localhost:1234/`。

推送内容或模板改动前，运行完整验证：

```sh
npm run build
```

格式化项目：

```sh
npm run prettier
```

## 项目结构

- `src/content/blog/`：博客文章和 subpost。
- `src/content/authors/`：作者资料。
- `src/components/figure.astro`：带图片说明的单图组件，支持懒加载、骨架占位和 PhotoSwipe。
- `src/components/image-grid.astro`：多图网格组件，支持图片说明、懒加载、骨架占位和 PhotoSwipe。
- `src/pages/friends.astro`：友链页，读取公开友链数据并展示申请说明。
- `src/consts.ts`：站点元信息、导航链接、社交链接和搜索引擎验证 ID。
- `scripts/migrate-hexo-blog.mjs`：只在本地使用的旧私有 Hexo 源迁移脚本。

## 写一篇文章

在 `src/content/blog/` 下新建目录，并在目录里放一个 `index.mdx`：

```text
src/content/blog/my-post-slug/
  index.mdx
```

文章 URL 会生成在站点根路径：

```text
/my-post-slug
```

使用下面这种 frontmatter：

```mdx
---
title: '文章标题'
description: '用于首页摘要和 SEO 的简短描述'
date: 2026-05-19
tags: ['python']
authors: ['xingpingcn']
coverImage: 'https://cdn.jsdmirror.com/gh/xingpingcn/picx-images-hosting@master/path/to/image.webp'
---

import Figure from '@/components/figure.astro'
import ImageGrid from '@/components/image-grid.astro'

正文内容从这里开始。
```

支持的文章 frontmatter：

- `title`：必填。
- `description`：必填，显示在文章卡片和 meta description 中。
- `date`：必填，会被解析为日期。
- `tags`：可选字符串数组。只添加确实要展示在 `/tags` 的真实标签，不要为了 SEO 关键词乱加标签。
- `authors`：可选字符串数组。当前作者使用 `['xingpingcn']`。
- `coverImage`：可选远程图片 URL 或 `/public` 下的本地路径，用于文章卡片、文章头图和社交分享图。
- `image`：可选本地图片，通过 Astro content collections 导入。
- `keywords`：可选 SEO 关键词数组。
- `pinned`：可选布尔值。设为 `true` 时，文章会置顶到普通文章前面。
- `draft`：可选布尔值。设为 `true` 时，文章不会出现在生成页面中。
- `canonicalURL`：可选 canonical URL，用于转载内容。
- `license`：可选文章协议配置。默认展示旧博客迁移来的 `CC BY-NC-SA 4.0`；转载内容可以设为 `type: 'original'`，不展示协议块可以设为 `false`。

文章协议示例：

```mdx
license:
  type: 'cc-by-nc-sa-4.0'
```

转载文章示例：

```mdx
canonicalURL: 'https://example.com/original-post'
license:
  type: 'original'
  sourceTitle: '原文标题'
  sourceUrl: 'https://example.com/original-post'
```

首页和 `/blog` 列表会排除 subpost，并按下面规则排序：

1. 置顶文章在前；
2. `date` 越新的文章越靠前。

## 添加 Subpost / 系列合集

Subpost 沿用上游 astro-erudite 的约定：如果一篇博客条目的 ID 里包含 `/`，它就会被当作 subpost。不需要额外写父子关系字段。

它适合把一组强相关内容做成“系列合集”：

- 父文章是合集入口，负责写总览、背景、目录说明和整体结论；
- 子文章是系列里的每一节，适合拆分很长的教程、笔记、章节或连续记录；
- 站点会根据文件路径自动把子文章挂到父文章下，不需要额外配置 `series`、`parent` 之类字段。

使用下面这种结构：

```text
src/content/blog/parent-post/
  index.mdx
  first-subpost.mdx
  second-subpost.mdx
```

会生成下面这些 URL：

```text
/parent-post
/parent-post/first-subpost
/parent-post/second-subpost
```

建议把父目录命名成这个系列的固定 slug，例如 `docker-learning-notes`；子文章文件名命名成每一节的 slug，例如 `install.mdx`、`network.mdx`、`compose.mdx`。`index.mdx` 永远是父文章本身，不要拿来当第一节。

父文章示例：

```mdx
---
title: 'Docker 学习笔记'
description: 'Docker 基础、网络、Compose 和常见运维问题的系列笔记'
date: 2026-05-19
authors: ['xingpingcn']
tags: ['docker']
---

这里写这个系列为什么要整理、每一节大概讲什么，以及读者应该按什么顺序看。
```

Subpost 示例：

```mdx
---
title: 'Docker 网络基础'
description: '整理 Docker bridge、host、container 网络模式的基本用法'
date: 2026-05-19
order: 1
authors: ['xingpingcn']
tags: ['docker']
---

# Docker 网络基础

子文章正文。
```

Subpost 注意事项：

- 目前只建议使用一层嵌套，避免写成 `parent/child/grandchild.mdx`。
- Subpost 不会出现在首页、`/blog`、作者页和标签页。
- 父文章页面会显示 subpost 数量和导航。
- Subpost 页面会显示父文章链接、兄弟 subpost 的上一篇/下一篇、移动端 subpost 导航和桌面端 subpost 侧栏。
- Subpost 按 `date` 升序排列；如果日期相同，则按 `order` 升序排列。
- 如果希望手动控制系列顺序，建议让同一系列的 subpost 使用相同 `date`，再用 `order: 1`、`order: 2`、`order: 3` 排序。
- 父文章的 `date` 决定合集入口在首页和 `/blog` 里的位置；子文章的 `date/order` 只影响同一合集内的顺序。
- Subpost 页面会加 `noindex`，避免搜索引擎单独索引过薄的系列片段。

## 图片

普通 Markdown 图片仍然可用：

```md
![图片说明](https://cdn.jsdmirror.com/gh/xingpingcn/picx-images-hosting@master/path/to/image.webp)
```

从 Hexo 迁移过来的图片块，或者任何需要图片说明和大图预览的图片，优先使用 `Figure` 或 `ImageGrid`。

### 带说明的单图

单张图片使用 `Figure`：

```mdx
import Figure from '@/components/figure.astro'

<Figure
  src="https://cdn.jsdmirror.com/gh/xingpingcn/picx-images-hosting@master/path/to/image.webp"
  caption="测速截图"
/>
```

Props：

- `src`：必填图片 URL。
- `caption`：可选可见图片说明，同时会作为图片 `alt` 和 PhotoSwipe 的说明文字。

图片尺寸由 `npm run sync:image-metadata` 自动同步到 `data/image-metadata.sqlite`，并生成 `src/generated/image-metadata.ts` 供组件使用。`npm run dev` 和 `npm run build` 会自动先同步一次；通常不需要在 MDX 里手写 `width` / `height`。

### 多图网格

相册或对比截图使用 `ImageGrid`：

```mdx
import ImageGrid from '@/components/image-grid.astro'

<ImageGrid
  images={[
    {
      src: 'https://cdn.jsdmirror.com/gh/xingpingcn/picx-images-hosting@master/path/to/a.webp',
      caption: '官方解析',
    },
    {
      src: 'https://cdn.jsdmirror.com/gh/xingpingcn/picx-images-hosting@master/path/to/b.webp',
      caption: '优化解析',
    },
  ]}
/>
```

网格行为：

- 1 张图：1 列；
- 2 张图：中等屏幕起为 2 列；
- 3 张及以上：中等屏幕起为 2 列，超大屏幕起为 3 列。

`Figure` 和 `ImageGrid` 都会使用：

- 内容图片的 `loading="lazy"`；
- 用于减少图片加载布局抖动的骨架占位；
- 文章内容中点击图片时打开的 PhotoSwipe 大图预览。

`ImageGrid` 会自动从同一组图片的 metadata 里找出按同宽展示时最高的图片比例，作为整组统一骨架高度；其他图片会在这个统一区域里填充显示。

除非有明确理由保留其他域名，图片 CDN 默认使用 `https://cdn.jsdmirror.com/gh/xingpingcn/picx-images-hosting@master/...`。

## 标签和作者

标签页由顶层文章里的 `tags` 生成：

```mdx
tags: ['volantis', 'python']
```

当前迁移策略比较保守：标签应该来自旧博客里真实存在的标签，或者来自明确的新分类调整。不要因为文章里偶然提到某个主题就添加无关标签。

作者 ID 指向 `src/content/authors/` 下的文件：

```text
src/content/authors/xingpingcn.md
```

普通文章使用 `authors: ['xingpingcn']`。作者卡片、头像、邮箱、GitHub 和网站都在作者文件里维护。

## 友链系统

友链页在 `/friends`，配置集中在 `src/consts.ts` 的 `SITE.friends`：

```ts
friends: {
  api: 'https://raw.githubusercontent.com/xingpingcn/friends/output/v2/data.json',
  repo: 'xingpingcn/friends',
  applyUrl: 'https://github.com/xingpingcn/friends/issues',
}
```

页面会在构建时读取公开的 `xingpingcn/friends` 输出数据。JSON 里每个站点建议包含：

```json
{
  "title": "站点名",
  "url": "https://example.com",
  "avatar": "https://example.com/avatar.png",
  "screenshot": "https://example.com/screenshot.webp",
  "description": "站点简介",
  "labels": [{ "name": "active", "color": "58EC80" }]
}
```

只有带 `active` 标签的站点会显示在友链页。

`avatar` 和 `screenshot` 都支持懒加载、骨架占位和失败占位。常见 jsDelivr URL 会自动规范化为 `cdn.jsdmirror.com`。

## 从旧私有博客迁移

迁移脚本会从本地路径读取旧的私有博客源，并生成 Astro MDX 文章：

```sh
node scripts/migrate-hexo-blog.mjs /tmp/newblog-migration/blog-source
```

脚本会把旧 Hexo 图片 / gallery 标签转换成 `Figure` 和 `ImageGrid`，把已知 CDN URL 规范化为 `cdn.jsdmirror.com`，并把旧的占位邮箱替换成 `zzy4on9@outlook.com`。
