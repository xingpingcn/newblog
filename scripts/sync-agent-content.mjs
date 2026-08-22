import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { HOME_MARKDOWN, LLMS_TXT } from '../src/lib/agent-content.mjs'

const publicDirectory = fileURLToPath(new URL('../public/', import.meta.url))

await mkdir(publicDirectory, { recursive: true })
await Promise.all([
  writeFile(new URL('../public/index.md', import.meta.url), HOME_MARKDOWN),
  writeFile(new URL('../public/llms.txt', import.meta.url), LLMS_TXT),
])
