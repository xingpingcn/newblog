import { defineMdastPlugin } from 'satteri'
import temml from 'temml'

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export const temmlMath = defineMdastPlugin({
  name: 'temml-math',
  inlineMath(node, ctx) {
    try {
      const value = temml.renderToString(node.value, { throwOnError: false })
      return { type: 'html', value }
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
      return { type: 'html', value: `<math-display>${value}</math-display>` }
    } catch (error) {
      ctx.report({
        message: `temml-math: failed on \`${node.value}\`: ${errorMessage(error)}`,
        node,
        severity: 'warning',
      })
    }
  },
})
