import assert from 'node:assert/strict'

import { formatCjkSpacingText } from '../scripts/format-cjk-spacing.mjs'

const input = `---
title: 在 GIT中忽略文件操作[转]
description: 邢平cn的 Github项目
coverImage: 'https://cdn.example.com/Git-Logo-2Color.11u6182b8cr4.webp'
mail: 'zzy4on9@outlook.com'
---

在 GIT中忽略文件操作[转]，支持 Node24和 Astro6，也支持 s3、ec2、hy2、NS1.com、v2ray和 100g。

邢平cn不应该拆开，Github项目应该补空格。

链接 [Astro文档](https://docs.astro.build/zh-cn/getting-started/) 和图片 ![Github图标](https://example.com/github.png) 的目标不能动。

相对链接 [freecdn-js教程](/使用freecdn-js提高hexo博客的cdn稳定性) 的目标也不能动。

嵌套链接 [ [使用freecdn-js提高hexo博客的cdn稳定性]](/使用freecdn-js提高hexo博客的cdn稳定性) 的目标不能动。

内联代码 \`const x = "中文HTML";\` 不应该改内容，但中文\`code\`English两边要补空格。

\`\`\`js
const text = "中文HTML不要改";
\`\`\`

<Badge label="Github项目" />

<div className="max-w-6xl text-sm">Github项目</div>
`

const expected = `---
title: 在 GIT 中忽略文件操作[转]
description: 邢平cn 的 Github 项目
coverImage: 'https://cdn.example.com/Git-Logo-2Color.11u6182b8cr4.webp'
mail: 'zzy4on9@outlook.com'
---

在 GIT 中忽略文件操作[转]，支持 Node24 和 Astro6，也支持 s3、ec2、hy2、NS1.com、v2ray 和 100g。

邢平cn 不应该拆开，Github 项目应该补空格。

链接 [Astro 文档](https://docs.astro.build/zh-cn/getting-started/) 和图片 ![Github 图标](https://example.com/github.png) 的目标不能动。

相对链接 [freecdn-js 教程](/使用freecdn-js提高hexo博客的cdn稳定性) 的目标也不能动。

嵌套链接 [ [使用 freecdn-js 提高 hexo 博客的 cdn 稳定性]](/使用freecdn-js提高hexo博客的cdn稳定性) 的目标不能动。

内联代码 \`const x = "中文HTML";\` 不应该改内容，但中文 \`code\` English 两边要补空格。

\`\`\`js
const text = "中文HTML不要改";
\`\`\`

<Badge label="Github 项目" />

<div className="max-w-6xl text-sm">Github 项目</div>
`

assert.equal(formatCjkSpacingText(input), expected)
