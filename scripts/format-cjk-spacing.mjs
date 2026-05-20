#!/usr/bin/env node

import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DEFAULT_TARGETS = ['src/content/blog', 'src/content/authors']
const TARGET_EXTENSIONS = new Set(['.md', '.mdx'])
const CJK = '\\p{Script=Han}\\p{Script=Hiragana}\\p{Script=Katakana}'
const LATIN_OR_NUMBER = 'A-Za-z0-9'
const PUNCTUATION_THAT_CLOSES_CJK_TEXT = '、，。！？；：）】》」』”’'
const BRAND_PLACEHOLDERS = new Map([['邢平cn', 'XINGPINGCNBRANDTOKEN']])
const FRONTMATTER_TEXT_KEYS = new Set(['title', 'description', 'excerpt', 'summary', 'bio', 'name'])

export function formatCjkSpacingText(text) {
  const { frontmatter, body } = splitFrontmatter(text)
  const formattedFrontmatter = frontmatter ? formatFrontmatter(frontmatter) : ''
  const formattedBody = formatBody(body)

  return `${formattedFrontmatter}${formattedBody}`
}

function formatBody(text) {
  return text
    .split(/(```[\s\S]*?```|~~~[\s\S]*?~~~)/g)
    .map((part) => {
      if (part.startsWith('```') || part.startsWith('~~~')) {
        return part
      }

      return formatInlineSegments(part)
    })
    .join('')
}

function splitFrontmatter(text) {
  if (!text.startsWith('---\n')) {
    return { frontmatter: '', body: text }
  }

  const closingIndex = text.indexOf('\n---', 4)

  if (closingIndex === -1) {
    return { frontmatter: '', body: text }
  }

  const endIndex = closingIndex + '\n---'.length
  const newlineAfterFrontmatter = text[endIndex] === '\n' ? endIndex + 1 : endIndex

  return {
    frontmatter: text.slice(0, newlineAfterFrontmatter),
    body: text.slice(newlineAfterFrontmatter),
  }
}

function formatFrontmatter(frontmatter) {
  return frontmatter.replace(/^([A-Za-z][\w-]*):\s*(.*)$/gm, (line, key, value) => {
    if (!FRONTMATTER_TEXT_KEYS.has(key)) {
      return line
    }

    return `${key}: ${formatInlineSegments(value)}`
  })
}

function formatInlineSegments(text) {
  const parts = text.split(/(`[^`\n]*`)/g)
  let result = ''

  for (const [index, part] of parts.entries()) {
    if (!part) {
      continue
    }

    const isInlineCode = index % 2 === 1 && part.startsWith('`')

    if (isInlineCode) {
      if (shouldSeparateInlineCodeFromPreviousText(result)) {
        result += ' '
      }

      result += part
      continue
    }

    const formatted = formatPlainText(part)

    if (shouldSeparateTextFromPreviousInlineCode(result, formatted)) {
      result += ' '
    }

    result += formatted
  }

  return result
}

function shouldSeparateInlineCodeFromPreviousText(text) {
  return new RegExp(`[${CJK}${LATIN_OR_NUMBER}]$`, 'u').test(text)
}

function shouldSeparateTextFromPreviousInlineCode(previousText, nextText) {
  return previousText.endsWith('`') && new RegExp(`^[${CJK}${LATIN_OR_NUMBER}]`, 'u').test(nextText)
}

function formatPlainText(text) {
  const placeholders = []
  let protectedText = protectBrands(text)

  protectedText = protectPattern(protectedText, placeholders, /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g)
  protectedText = protectPattern(protectedText, placeholders, /https?:\/\/[^\s'")>]+/g)
  protectedText = protectPattern(protectedText, placeholders, /\b[\w.-]+\/[\w./@%+-]+\b/g)
  protectedText = protectPattern(protectedText, placeholders, /\]\(([^)]*)\)/g, (match) => {
    const target = match.slice(2, -1)
    return `](${protectValue(placeholders, target)})`
  })
  protectedText = protectPattern(protectedText, placeholders, /\b(?:class|className)=["'][^"']*["']/g)
  protectedText = protectPattern(protectedText, placeholders, /\b[A-Za-z]{1,3}[0-9]+(?:\.[A-Za-z0-9]+)?\b/g)
  protectedText = protectPattern(protectedText, placeholders, /(!?\[[^\]]*?\]\()([^)]+?)(\))/g, (match) => {
    const linkMatch = match.match(/^(!?\[[^\]]*?\]\()([^)]+?)(\))$/)

    if (!linkMatch) {
      return match
    }

    const [, prefix, target, suffix] = linkMatch
    return `${formatPlainText(prefix)}${protectValue(placeholders, target)}${suffix}`
  })

  protectedText = protectedText
    .replace(new RegExp(`([${CJK}])([${LATIN_OR_NUMBER}])`, 'gu'), '$1 $2')
    .replace(new RegExp(`([${LATIN_OR_NUMBER}])([${CJK}])`, 'gu'), '$1 $2')
    .replace(new RegExp(`([${CJK}])\\s+([${PUNCTUATION_THAT_CLOSES_CJK_TEXT}])`, 'gu'), '$1$2')

  for (let index = placeholders.length - 1; index >= 0; index -= 1) {
    protectedText = protectedText.replaceAll(`__CJK_SPACING_PROTECTED_${index}__`, placeholders[index])
  }

  return restoreBrands(protectedText)
}

function protectPattern(text, placeholders, pattern, transform = (match) => match) {
  return text.replace(pattern, (match) => protectValue(placeholders, transform(match)))
}

function protectValue(placeholders, value) {
  const key = `__CJK_SPACING_PROTECTED_${placeholders.length}__`
  placeholders.push(value)
  return key
}

function protectBrands(text) {
  let result = text

  for (const [brand, placeholder] of BRAND_PLACEHOLDERS) {
    result = result.replaceAll(brand, placeholder)
  }

  return result
}

function restoreBrands(text) {
  let result = text

  for (const [brand, placeholder] of BRAND_PLACEHOLDERS) {
    result = result.replaceAll(placeholder, brand)
  }

  return result
}

async function collectTargetFiles(targets) {
  const files = []

  for (const target of targets) {
    const absoluteTarget = path.resolve(process.cwd(), target)
    await collectTargetFilesFromPath(absoluteTarget, files)
  }

  return files.sort()
}

async function collectTargetFilesFromPath(target, files) {
  let targetStat

  try {
    targetStat = await stat(target)
  } catch (error) {
    if (error.code === 'ENOENT') {
      return
    }

    throw error
  }

  if (targetStat.isFile()) {
    if (TARGET_EXTENSIONS.has(path.extname(target))) {
      files.push(target)
    }

    return
  }

  if (!targetStat.isDirectory()) {
    return
  }

  const entries = await readdir(target, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') {
      continue
    }

    await collectTargetFilesFromPath(path.join(target, entry.name), files)
  }
}

async function formatFile(file) {
  const original = await readFile(file, 'utf8')
  const formatted = formatCjkSpacingText(original)

  if (formatted === original) {
    return false
  }

  await writeFile(file, formatted)
  return true
}

async function main() {
  const targets = process.argv.slice(2)
  const files = await collectTargetFiles(targets.length > 0 ? targets : DEFAULT_TARGETS)
  const changedFiles = []

  for (const file of files) {
    if (await formatFile(file)) {
      changedFiles.push(path.relative(process.cwd(), file))
    }
  }

  if (changedFiles.length > 0) {
    console.log(`Formatted ${changedFiles.length} file(s):`)
    for (const file of changedFiles) {
      console.log(`- ${file}`)
    }
  } else {
    console.log('CJK spacing already formatted.')
  }
}

const currentFile = fileURLToPath(import.meta.url)

if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
  await main()
}
