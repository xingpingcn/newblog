# Markdown Callouts, Temml Styling, And Scrollbar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Markdown-native Callout directives and VS Code completion, complete Temml MathML styling with a local math font, and apply Umami's page-scrollbar treatment while preserving every existing blog feature.

**Architecture:** A shared Callout registry supplies variant names, Tailwind classes, and Lucide icon names to both the existing Astro component and a new Satteri mdast directive plugin. Temml remains the existing build-time renderer while a dedicated stylesheet and vendored font complete presentation. The scrollbar is a root-only CSS enhancement; ClientRouter and all existing navigation behavior remain unchanged.

**Tech Stack:** Astro 7, Satteri, MDX, Astro Icon, Iconify Lucide JSON, Tailwind CSS 4, Temml, Node test runner, VS Code project snippets, Playwright/browser verification.

## Global Constraints

- Keep `<ClientRouter />`, View Transitions, navigation progress, theme synchronization, and every `astro:*` lifecycle consumer.
- Keep `.mdx`, `@astrojs/mdx`, the existing `<Callout>` API, all current articles, routes, pagination, About page, subpost navigation, and TOC components.
- Keep `.site-header-menu-panel` blur and its contract test.
- Do not add the upstream continuous series reader, unified series TOC, persistent article action bar, sidebar redesign, or `prefetchAll`.
- Do not change internal scrollbars for code blocks, search results, TOC panels, or subpost panels.
- Stop and request the user's decision before deleting or materially changing any existing feature.
- Do not commit generated `dist/` output or local browser screenshots.
- Do not push unless explicitly requested.

---

## File Structure

- `src/lib/callout-config.ts`: single source of truth for Callout variants, classes, icons, labels, and type guards.
- `src/lib/callout.ts`: Satteri container-directive plugin and build-time Lucide SVG serialization.
- `src/components/callout.astro`: existing component adapted to consume the shared registry without changing its public API.
- `src/styles/typography-callout.css`: structural rules for directive-generated Callouts inside `.prose`.
- `astro.config.ts`: enables Satteri directives and registers `calloutDirective` for Markdown and MDX.
- `.vscode/mdx.code-snippets`: makes `:::` Callouts the default completion while retaining component snippets.
- `src/styles/typography-math.css`: full upstream Temml stylesheet adapted from `prose-content` to `.prose`.
- `src/assets/fonts/STIXTwoMath-Regular.woff2`: vendored upstream math font.
- `src/layouts/layout.astro`: imports Callout and math styles after the existing typography layer.
- `src/styles/global.css`: root-only Umami scrollbar adaptation.
- `tests/callout-directive-contract.test.mjs`: real Satteri render and authoring-contract coverage.
- `tests/temml-presentation-contract.test.mjs`: math CSS, font, and rendered MathML coverage.
- `tests/scrollbar-contract.test.mjs`: root scrollbar and feature-preservation coverage.

### Task 1: Add Markdown Callouts And VS Code Completion

**Files:**
- Create: `tests/callout-directive-contract.test.mjs`
- Create: `src/lib/callout-config.ts`
- Create: `src/lib/callout.ts`
- Create: `src/styles/typography-callout.css`
- Modify: `src/components/callout.astro`
- Modify: `astro.config.ts`
- Modify: `src/layouts/layout.astro`
- Modify: `.vscode/mdx.code-snippets`

**Interfaces:**
- Consumes: Satteri `containerDirective`, `@iconify-json/lucide`, the existing Astro component props, and project snippets.
- Produces: `CALLOUT_CONFIG`, `CALLOUT_VARIANTS`, `CalloutVariant`, `isCalloutVariant()`, `calloutVariants()`, and `calloutDirective`.

- [ ] **Step 1: Write the failing Callout contract**

Create `tests/callout-directive-contract.test.mjs` with real Satteri rendering and source assertions:

```js
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { markdownToHtml } from 'satteri'

const root = new URL('../', import.meta.url)

test('renders every configured Markdown Callout through Satteri', async () => {
  const { CALLOUT_CONFIG, CALLOUT_VARIANTS } = await import(
    '../src/lib/callout-config.ts'
  )
  const { calloutDirective } = await import('../src/lib/callout.ts')

  assert.equal(CALLOUT_VARIANTS.length, 25)
  assert.deepEqual(
    {
      icon: CALLOUT_CONFIG.caution.icon,
      style: CALLOUT_CONFIG.caution.style,
      textColor: CALLOUT_CONFIG.caution.textColor,
    },
    {
      icon: CALLOUT_CONFIG.danger.icon,
      style: CALLOUT_CONFIG.danger.style,
      textColor: CALLOUT_CONFIG.danger.textColor,
    },
  )

  for (const variant of CALLOUT_VARIANTS) {
    const { html } = markdownToHtml(
      `:::${variant}[Contract title]{closed}\nBody with **Markdown**.\n:::`,
      {
        features: { directive: true },
        mdastPlugins: [calloutDirective],
      },
    )

    assert.match(html, new RegExp(`data-callout="${variant}"`))
    assert.match(html, /<details/)
    assert.doesNotMatch(html, /<details[^>]* open/)
    assert.match(html, /Contract title/)
    assert.match(html, /<strong>Markdown<\/strong>/)
    assert.match(html, /<svg[^>]*aria-hidden="true"/)
  }

  const { html: openHtml } = markdownToHtml(
    ':::note[Open title]\nVisible body.\n:::',
    {
      features: { directive: true },
      mdastPlugins: [calloutDirective],
    },
  )
  assert.match(openHtml, /<details[^>]* open/)
})

test('keeps old component authoring and makes directives the default snippet', async () => {
  const [component, config, layout, snippets] = await Promise.all([
    readFile(new URL('src/components/callout.astro', root), 'utf8'),
    readFile(new URL('astro.config.ts', root), 'utf8'),
    readFile(new URL('src/layouts/layout.astro', root), 'utf8'),
    readFile(new URL('.vscode/mdx.code-snippets', root), 'utf8'),
  ])

  assert.match(component, /callout-config/)
  assert.match(component, /data-callout=\{variant\}/)
  assert.match(config, /features:\s*\{\s*directive:\s*true,\s*math:\s*true\s*\}/)
  assert.match(config, /mdastPlugins:\s*\[[^\]]*calloutDirective/)
  assert.match(layout, /typography-callout\.css/)
  assert.match(snippets, /"prefix":\s*"callout"[\s\S]*?:::\$\{1\|/)
  assert.match(snippets, /"prefix":\s*"callout-component"/)
  assert.match(snippets, /"prefix":\s*"callout-component-folded"/)
})
```

- [ ] **Step 2: Run the contract and verify RED**

Run: `node --test tests/callout-directive-contract.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/lib/callout-config.ts` or `src/lib/callout.ts`.

- [ ] **Step 3: Add the shared Callout registry**

Move the existing component's variant configuration into
`src/lib/callout-config.ts`. Retain all 24 current entries and add `caution`
with the same `style`, `textColor`, and `icon` as `danger`. Export:

```ts
import { cva } from 'class-variance-authority'

export const CALLOUT_CONFIG = {
  note: {
    style: 'border-blue-500 dark:bg-blue-950/5',
    textColor: 'text-blue-700 dark:text-blue-300',
    icon: 'info',
  },
  tip: {
    style: 'border-green-500 dark:bg-green-950/5',
    textColor: 'text-green-700 dark:text-green-300',
    icon: 'lightbulb',
  },
  warning: {
    style: 'border-amber-500 dark:bg-amber-950/5',
    textColor: 'text-amber-700 dark:text-amber-300',
    icon: 'triangle-alert',
  },
  danger: {
    style: 'border-red-500 dark:bg-red-950/5',
    textColor: 'text-red-700 dark:text-red-300',
    icon: 'shield-alert',
  },
  caution: {
    style: 'border-red-500 dark:bg-red-950/5',
    textColor: 'text-red-700 dark:text-red-300',
    icon: 'shield-alert',
  },
  important: {
    style: 'border-purple-500 dark:bg-purple-950/5',
    textColor: 'text-purple-700 dark:text-purple-300',
    icon: 'message-square-warning',
  },
  definition: {
    style: 'border-purple-500 dark:bg-purple-950/5',
    textColor: 'text-purple-700 dark:text-purple-300',
    icon: 'book-open',
  },
  theorem: {
    style: 'border-teal-500 dark:bg-teal-950/5',
    textColor: 'text-teal-700 dark:text-teal-300',
    icon: 'circle-check-big',
  },
  lemma: {
    style: 'border-sky-400 dark:bg-sky-950/5',
    textColor: 'text-sky-700 dark:text-sky-300',
    icon: 'puzzle',
  },
  proof: {
    style: 'border-gray-500 dark:bg-gray-950/5',
    textColor: 'text-gray-700 dark:text-gray-300',
    icon: 'square-check-big',
  },
  corollary: {
    style: 'border-cyan-500 dark:bg-cyan-950/5',
    textColor: 'text-cyan-700 dark:text-cyan-300',
    icon: 'git-branch',
  },
  proposition: {
    style: 'border-slate-500 dark:bg-slate-950/5',
    textColor: 'text-slate-700 dark:text-slate-300',
    icon: 'file-text',
  },
  axiom: {
    style: 'border-violet-600 dark:bg-violet-950/5',
    textColor: 'text-violet-700 dark:text-violet-300',
    icon: 'anchor',
  },
  conjecture: {
    style: 'border-pink-500 dark:bg-pink-950/5',
    textColor: 'text-pink-700 dark:text-pink-300',
    icon: 'circle-question-mark',
  },
  notation: {
    style: 'border-slate-400 dark:bg-slate-950/5',
    textColor: 'text-slate-700 dark:text-slate-300',
    icon: 'pen-tool',
  },
  remark: {
    style: 'border-gray-400 dark:bg-gray-950/5',
    textColor: 'text-gray-700 dark:text-gray-300',
    icon: 'message-circle',
  },
  intuition: {
    style: 'border-yellow-500 dark:bg-yellow-950/5',
    textColor: 'text-yellow-700 dark:text-yellow-300',
    icon: 'lightbulb',
  },
  recall: {
    style: 'border-blue-300 dark:bg-blue-950/5',
    textColor: 'text-blue-600 dark:text-blue-300',
    icon: 'rotate-ccw',
  },
  explanation: {
    style: 'border-lime-500 dark:bg-lime-950/5',
    textColor: 'text-lime-700 dark:text-lime-300',
    icon: 'circle-question-mark',
  },
  example: {
    style: 'border-emerald-500 dark:bg-emerald-950/5',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    icon: 'code',
  },
  exercise: {
    style: 'border-indigo-500 dark:bg-indigo-950/5',
    textColor: 'text-indigo-700 dark:text-indigo-300',
    icon: 'dumbbell',
  },
  problem: {
    style: 'border-orange-600 dark:bg-orange-950/5',
    textColor: 'text-orange-700 dark:text-orange-300',
    icon: 'circle-alert',
  },
  answer: {
    style: 'border-teal-500 dark:bg-teal-950/5',
    textColor: 'text-teal-700 dark:text-teal-300',
    icon: 'check',
  },
  solution: {
    style: 'border-emerald-600 dark:bg-emerald-950/5',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    icon: 'circle-check',
  },
  summary: {
    style: 'border-sky-500 dark:bg-sky-950/5',
    textColor: 'text-sky-700 dark:text-sky-300',
    icon: 'list',
  },
} as const

export type CalloutVariant = keyof typeof CALLOUT_CONFIG

export const CALLOUT_VARIANTS = Object.keys(
  CALLOUT_CONFIG,
) as CalloutVariant[]

export const isCalloutVariant = (value: string): value is CalloutVariant =>
  Object.hasOwn(CALLOUT_CONFIG, value)

export const calloutVariants = cva(
  'relative px-4 py-3 my-6 border-l-4 text-sm',
  {
    variants: {
      variant: Object.fromEntries(
        Object.entries(CALLOUT_CONFIG).map(([key, value]) => [key, value.style]),
      ),
    },
    defaultVariants: { variant: 'note' },
  },
)
```

- [ ] **Step 4: Preserve the existing Astro component through the registry**

Update `src/components/callout.astro` to import `CALLOUT_CONFIG`,
`CalloutVariant`, and `calloutVariants`; remove only its duplicated local
configuration. Keep `title`, `class`, and `defaultOpen` behavior. Add the stable
hook and use the shared icon name:

```astro
<details
  data-callout={variant}
  class={cn(
    calloutVariants({ variant }),
    rest.class,
    '[&[open]>summary_svg:last-child]:rotate-180 [&[open]>summary]:mb-3',
  )}
  {...rest}
  open={defaultOpen}
>
```

Render icons as `name={`lucide:${CALLOUT_CONFIG[variant].icon}`}` and retain
the current summary/body markup and public props.

- [ ] **Step 5: Implement the Satteri directive plugin**

Create `src/lib/callout.ts`. Import `icons` from
`@iconify-json/lucide`, serialize icons from their canonical `body`, `width`,
and `height`, escape directive labels through HAST serialization, and transform
only recognized container directives:

```ts
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
} from './callout-config'

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
        className: `${calloutVariants({ variant: node.name })} [&[open]>summary_svg:last-child]:rotate-180 [&[open]>summary]:mb-3`,
        dataCallout: node.name,
        open: !closed,
      },
    })
  },
})
```

- [ ] **Step 6: Wire directives and structural CSS**

Update `astro.config.ts`:

```ts
import { calloutDirective } from './src/lib/callout'

const processor = satteri({
  features: { directive: true, math: true },
  mdastPlugins: [calloutDirective, inlineExpressiveCode, temmlMath],
  hastPlugins: [externalLinks, blockExpressiveCode, headingAnchors()],
})
```

Create `src/styles/typography-callout.css` with `.prose [data-callout]`
structural selectors for hidden native markers, flex summary layout, icon sizes,
title opacity, chevron rotation, open spacing, and last-child margin. Do not
style generic `<details>` elements. Import it after `typography.css` in
`src/layouts/layout.astro`.

- [ ] **Step 7: Update project snippets**

In `.vscode/mdx.code-snippets`:

```jsonc
"Markdown Callout": {
  "scope": "mdx,markdown",
  "prefix": "callout",
  "body": [
    ":::${1|note,tip,warning,danger,caution,important,definition,theorem,lemma,proof,corollary,proposition,axiom,conjecture,notation,remark,intuition,recall,explanation,example,exercise,problem,answer,solution,summary|}[${2:标题}]",
    "${3:内容}",
    ":::"
  ],
  "description": "Insert a Markdown Callout directive"
}
```

Make `callout-folded` use the same choice list plus `{closed}`. Rename the old
component prefixes to `callout-component` and `callout-component-folded`
without deleting either body. Leave unrelated snippets unchanged.

- [ ] **Step 8: Verify GREEN and commit**

```bash
node --test tests/callout-directive-contract.test.mjs
npx astro check
git diff --check
git add .vscode/mdx.code-snippets astro.config.ts \
  src/components/callout.astro src/layouts/layout.astro \
  src/lib/callout-config.ts src/lib/callout.ts \
  src/styles/typography-callout.css \
  tests/callout-directive-contract.test.mjs
git diff --cached --check
git commit -m "feat(markdown): add callout directives"
```

Expected: the focused contract passes and Astro reports zero errors.

### Task 2: Complete Temml CSS And Math Font

**Files:**
- Create: `tests/temml-presentation-contract.test.mjs`
- Create: `src/styles/typography-math.css`
- Create: `src/assets/fonts/STIXTwoMath-Regular.woff2`
- Modify: `src/layouts/layout.astro`

**Interfaces:**
- Consumes: existing `temmlMath`, upstream `typography-math.css`, and upstream STIX Two Math font.
- Produces: complete `.prose`-scoped Temml presentation with a local font.

- [ ] **Step 1: Write the failing Temml presentation contract**

Create `tests/temml-presentation-contract.test.mjs`:

```js
import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import test from 'node:test'
import { markdownToHtml } from 'satteri'
import { temmlMath } from '../src/lib/math.ts'

const root = new URL('../', import.meta.url)

test('ships complete Temml CSS and the STIX math font', async () => {
  const [css, layout, font] = await Promise.all([
    readFile(new URL('src/styles/typography-math.css', root), 'utf8'),
    readFile(new URL('src/layouts/layout.astro', root), 'utf8'),
    stat(new URL('src/assets/fonts/STIXTwoMath-Regular.woff2', root)),
  ])

  assert.match(layout, /typography-math\.css/)
  assert.match(css, /@font-face[\s\S]*STIX Two Math[\s\S]*font-display:\s*swap/)
  assert.match(css, /\.prose/)
  assert.match(css, /mfrac\s*>/)
  assert.match(css, /msqrt/)
  assert.match(css, /\.tml-eqn/)
  assert.match(css, /\.longdiv-arc/)
  assert.match(css, /\.phasor-angle/)
  assert.match(css, /@supports\s+\(-moz-appearance:\s*none\)/)
  assert.match(css, /@supports\s+\(-webkit-backdrop-filter:\s*blur\(1px\)\)/)
  assert.ok(font.size > 250_000)
})

test('renders inline and display MathML through Temml', () => {
  const { html } = markdownToHtml(
    'Inline $x^2$ and display:\n\n$$\\frac{a}{b}$$',
    { features: { math: true }, mdastPlugins: [temmlMath] },
  )

  assert.match(html, /<math/)
  assert.match(html, /<math-display>/)
  assert.match(html, /<mfrac>/)
})
```

- [ ] **Step 2: Run the contract and verify RED**

Run: `node --test tests/temml-presentation-contract.test.mjs`

Expected: FAIL with `ENOENT` for `typography-math.css` or the STIX font.

- [ ] **Step 3: Vendor the exact upstream font**

Confirm the destination does not exist, then restore only the requested binary
asset from `upstream/main`:

```bash
test ! -e src/assets/fonts/STIXTwoMath-Regular.woff2
git restore --source=upstream/main -- \
  src/assets/fonts/STIXTwoMath-Regular.woff2
```

Verify its upstream identity:

```bash
git show upstream/main:src/assets/fonts/STIXTwoMath-Regular.woff2 | sha256sum
sha256sum src/assets/fonts/STIXTwoMath-Regular.woff2
```

Expected: both hashes match.

- [ ] **Step 4: Add the complete adapted Temml stylesheet**

Create `src/styles/typography-math.css` from the exact current
`upstream/main:src/styles/typography-math.css`, with these deliberate changes:

1. Add the local `@font-face` block at the top:

```css
@font-face {
  font-family: 'STIX Two Math';
  src: url('../assets/fonts/STIXTwoMath-Regular.woff2') format('woff2');
  font-style: normal;
  font-weight: 400;
  font-display: swap;
}
```

2. Replace the outer `prose-content` selector with `.prose`.
3. Set the math font stack to `'STIX Two Math', 'Cambria Math', math, serif`.
4. Preserve every upstream Temml rule and browser workaround; do not prune
   selectors based on the current content corpus.

Import `@/styles/typography-math.css` in `src/layouts/layout.astro` after the
existing typography and Callout imports. Keep the basic MathML rules already in
`typography.css`; the dedicated stylesheet may refine them without deleting
the existing fallback contract.

- [ ] **Step 5: Verify GREEN and commit**

```bash
node --test tests/temml-presentation-contract.test.mjs
npx astro check
git diff --check
git add src/assets/fonts/STIXTwoMath-Regular.woff2 \
  src/styles/typography-math.css src/layouts/layout.astro \
  tests/temml-presentation-contract.test.mjs
git diff --cached --check
git commit -m "feat(markdown): complete temml presentation"
```

Expected: both focused tests pass and Astro reports zero errors.

### Task 3: Add The Umami-Style Root Scrollbar

**Files:**
- Create: `tests/scrollbar-contract.test.mjs`
- Modify: `src/styles/global.css`

**Interfaces:**
- Consumes: the site's `--border` and `--muted-foreground` theme tokens.
- Produces: root-page scrollbar parity with Umami without changing internal scroll containers.

- [ ] **Step 1: Write the failing scrollbar contract**

Create `tests/scrollbar-contract.test.mjs`:

```js
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const root = new URL('../', import.meta.url)

test('applies the Umami scrollbar only to the root page', async () => {
  const css = await readFile(new URL('src/styles/global.css', root), 'utf8')

  assert.match(css, /html::[-]webkit-scrollbar\s*\{[\s\S]*?width:\s*15px/)
  assert.match(css, /html::[-]webkit-scrollbar-track[\s\S]*?border:\s*7px solid transparent/)
  assert.match(css, /html::[-]webkit-scrollbar-thumb[\s\S]*?border:\s*7px solid transparent/)
  assert.match(css, /html::[-]webkit-scrollbar-thumb:hover[\s\S]*?border:\s*4px solid transparent/)
  assert.match(css, /background-color:\s*var\(--border\)/)
  assert.match(css, /background-color:\s*var\(--muted-foreground\)/)
  assert.match(css, /scrollbar-color:\s*var\(--muted-foreground\)\s+var\(--border\)/)
  assert.doesNotMatch(css, /(^|\n)::[-]webkit-scrollbar\s*\{/)
})
```

- [ ] **Step 2: Run the contract and verify RED**

Run: `node --test tests/scrollbar-contract.test.mjs`

Expected: FAIL because root scrollbar selectors do not exist.

- [ ] **Step 3: Add the root-only CSS**

Add to the base/global portion of `src/styles/global.css`:

```css
html {
  scrollbar-width: thin;
  scrollbar-color: var(--muted-foreground) var(--border);
}

html::-webkit-scrollbar {
  width: 15px;
  background: transparent;
}

html::-webkit-scrollbar-track {
  border: 7px solid transparent;
  background-color: var(--border);
  background-clip: padding-box;
}

html::-webkit-scrollbar-thumb {
  border: 7px solid transparent;
  border-radius: 9999px;
  background-color: var(--muted-foreground);
  background-clip: padding-box;
}

html::-webkit-scrollbar-thumb:hover {
  border: 4px solid transparent;
  background-clip: padding-box;
}
```

Do not add unscoped `::-webkit-scrollbar` selectors.

- [ ] **Step 4: Verify GREEN and commit**

```bash
node --test tests/scrollbar-contract.test.mjs
node --test tests/header-secondary-menu-contract.test.mjs \
  tests/navigation-progress-contract.test.mjs \
  tests/theme-color-contract.test.mjs
git diff --check
git add src/styles/global.css tests/scrollbar-contract.test.mjs
git diff --cached --check
git commit -m "feat(theme): add umami-style scrollbar"
```

Expected: scrollbar and preserved-shell contracts pass.

### Task 4: Full Build And Browser Verification

**Files:**
- Modify: only files required by evidence-backed failures.
- Test: `tests/*.test.mjs`

**Interfaces:**
- Consumes: all three completed feature commits.
- Produces: verified production output and a locally running preview for user inspection.

- [ ] **Step 1: Run the complete automated suite**

```bash
node --test tests/*.test.mjs
npm run build
npm ls
git diff --check
```

Expected: every command exits 0, all contract tests pass, Astro generates the
site, Pagefind indexes it, redirects are generated, and the dependency tree is
valid.

- [ ] **Step 2: Inspect generated artifacts**

```bash
rg -n 'data-callout|STIX Two Math|longdiv-arc|html::-webkit-scrollbar' \
  dist src/styles src/lib
find dist -type f \( -name '*STIXTwoMath*.woff2' -o -name '*.woff2' \)
test -f dist/pagefind/pagefind.js
test -f dist/docker-learning-notes.html
```

Expected: Callout source/output contracts, math CSS/font output, scrollbar CSS,
Pagefind, and legacy redirect output are present. Do not add `dist/` to Git.

- [ ] **Step 3: Start the local site**

Run `npm run dev` in a persistent session. Use the configured port `1234`; if
occupied, run `npm run astro -- dev --host 0.0.0.0 --port 1235`.

Expected: Astro reports a local URL and remains running for browser checks and
user inspection.

- [ ] **Step 4: Verify desktop and mobile behavior in a real browser**

At desktop and mobile viewports, verify:

- root scrollbar is narrow, rounded, theme-aware, and thickens on hover in a
  Chromium desktop viewport;
- code-block and TOC internal scrollbars are unchanged;
- light/dark theme switching keeps the scrollbar and browser `theme-color`
  synchronized;
- ClientRouter navigation and browser back/forward retain the top progress bar
  and scroll behavior;
- secondary-menu blur remains visible;
- old `<Callout>` rendering remains unchanged;
- inject one directive-rendered open/closed Callout and representative Temml
  output into a `.prose` container for visual inspection without committing a
  public fixture page.

Capture screenshots only as temporary verification artifacts outside the
repository or under an ignored temporary path.

- [ ] **Step 5: Re-run final verification after any browser-driven fix**

```bash
node --test tests/*.test.mjs
npm run build
git diff --check
git status --short --branch
```

Expected: zero failures, no generated artifacts staged, and only intentional
source/test changes or no remaining uncommitted changes.
