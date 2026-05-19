import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const contentRoot = path.resolve('src/content/blog')

async function listMdxFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await listMdxFiles(fullPath)))
      continue
    }
    if (entry.isFile() && entry.name.endsWith('.mdx')) {
      files.push(fullPath)
    }
  }

  return files
}

function stripComponentProps(markdown) {
  const lines = markdown.split('\n')
  let inFence = false
  let inComponent = false
  let changed = false

  const output = lines.filter((line) => {
    if (/^\s*```/.test(line)) {
      inFence = !inFence
      return true
    }

    if (inFence) return true

    if (/^<(?:Figure|ImageGrid)\b/.test(line)) {
      inComponent = true
    }

    if (!inComponent) return true

    if (
      /^\s*alt:\s*(['"])[\s\S]*\1,?\s*$/.test(line) ||
      /^\s*alt=\{?(['"])[\s\S]*\1\}?\s*$/.test(line) ||
      /^\s*width:\s*\d+,?\s*$/.test(line) ||
      /^\s*height:\s*\d+,?\s*$/.test(line) ||
      /^\s*width=\{\d+\}\s*$/.test(line) ||
      /^\s*height=\{\d+\}\s*$/.test(line)
    ) {
      changed = true
      return false
    }

    if (/^\s*\/>/.test(line)) {
      inComponent = false
    }

    return true
  })

  return {
    changed,
    markdown: output.join('\n'),
  }
}

let changedCount = 0

for (const file of await listMdxFiles(contentRoot)) {
  const original = await readFile(file, 'utf8')
  const result = stripComponentProps(original)
  if (!result.changed) continue

  await writeFile(file, result.markdown)
  changedCount += 1
}

console.log(`Stripped image dimensions from ${changedCount} MDX files.`)
