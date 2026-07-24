import { defineMdastPlugin } from 'satteri'
import temml from 'temml'

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function nodeSource(
  source: string,
  position:
    | {
        start: { line: number; column: number }
        end: { line: number; column: number }
      }
    | undefined,
): string {
  if (!position || position.start.line !== position.end.line) return ''
  const line = source.split(/\r?\n/)[position.start.line - 1]
  if (line === undefined) return ''
  return Array.from(line)
    .slice(position.start.column - 1, position.end.column - 1)
    .join('')
}

function hasExactDoubleDollarDelimiters(source: string): boolean {
  return (
    source.startsWith('$$') &&
    source[2] !== '$' &&
    source.endsWith('$$') &&
    source.at(-3) !== '$'
  )
}

export const temmlMath = defineMdastPlugin({
  name: 'temml-math',
  inlineMath(node, ctx) {
    try {
      // Satteri parses same-line `$$...$$` as inlineMath; preserve its display intent.
      const source = nodeSource(ctx.source, node.position)
      const displayMode = hasExactDoubleDollarDelimiters(source)
      const value = temml.renderToString(node.value, {
        displayMode,
        throwOnError: false,
      })
      ctx.replaceNode(node, {
        type: 'html',
        value: displayMode ? `<math-display>${value}</math-display>` : value,
      })
    } catch (error) {
      ctx.report({
        message: `temml-math: failed on \`${node.value}\`: ${errorMessage(error)}`,
        node,
        severity: 'warning',
      })
    }
  },
  math(node, ctx) {
    try {
      const value = temml.renderToString(node.value, {
        displayMode: true,
        throwOnError: false,
      })
      ctx.replaceNode(node, {
        type: 'html',
        value: `<math-display>${value}</math-display>`,
      })
    } catch (error) {
      ctx.report({
        message: `temml-math: failed on \`${node.value}\`: ${errorMessage(error)}`,
        node,
        severity: 'warning',
      })
    }
  },
})
