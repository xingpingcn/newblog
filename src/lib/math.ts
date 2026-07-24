import { defineMdastPlugin } from 'satteri'
import temml from 'temml'

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export const temmlMath = defineMdastPlugin({
  name: 'temml-math',
  inlineMath(node, ctx) {
    try {
      // Satteri parses same-line `$$...$$` as inlineMath; preserve its display intent.
      const source = ctx.source.slice(
        node.position?.start.offset,
        node.position?.end.offset,
      )
      const displayMode = source.startsWith('$$') && source.endsWith('$$')
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
