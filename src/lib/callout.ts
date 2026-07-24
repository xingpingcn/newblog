import { icons } from '@iconify-json/lucide'
import type { ElementContent } from 'hast'
import type {} from 'mdast-util-to-hast'
import { toHtml } from 'hast-util-to-html'
import { h } from 'hastscript'
import { defineMdastPlugin } from 'satteri'
import {
  CALLOUT_CONFIG,
  calloutVariants,
  isCalloutVariant,
} from './callout-config.ts'

const raw = (value: string): ElementContent =>
  ({ type: 'raw', value }) as unknown as ElementContent

const renderIcon = (name: keyof typeof icons.icons, className: string) => {
  const icon = icons.icons[name]
  if (!icon) throw new Error(`Unknown Lucide icon: ${name}`)
  const width = icon.width ?? icons.width ?? 24
  const height = icon.height ?? icons.height ?? 24
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${className}" aria-hidden="true">${icon.body}</svg>`
}

const capitalize = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1)

export const calloutDirective = defineMdastPlugin({
  name: 'callout-directive',
  containerDirective(node, ctx) {
    if (!isCalloutVariant(node.name)) return

    const first = node.children[0]
    const isLabel =
      first?.type === 'paragraph' &&
      (first.data as { directiveLabel?: boolean })?.directiveLabel === true
    const label = isLabel ? ctx.textContent(first) : null
    if (isLabel) ctx.removeNode(first)

    const config = CALLOUT_CONFIG[node.name]
    const title: ElementContent[] = [
      { type: 'text', value: capitalize(node.name) },
    ]
    if (label) title.push(h('span', ` (${label})`))

    const summary = toHtml(
      h('summary', { className: 'flex cursor-pointer items-center font-medium' }, [
        raw(
          renderIcon(
            config.icon,
            `mr-2 size-4 shrink-0 ${config.textColor}`,
          ),
        ),
        h('span', { className: `mr-2 font-medium ${config.textColor}` }, title),
        raw(
          renderIcon(
            'chevron-down',
            `ml-auto size-4 shrink-0 transition-transform duration-200 ${config.textColor}`,
          ),
        ),
      ]),
      { allowDangerousHtml: true },
    )

    const closed = !!node.attributes && 'closed' in node.attributes
    ctx.prependChild(node, { type: 'html', value: summary })
    ctx.setProperty(node, 'data', {
      hName: 'details',
      hProperties: {
        className: calloutVariants({ variant: node.name }),
        dataCallout: node.name,
        open: !closed,
      },
    })
  },
})
