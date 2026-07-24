# Astro 7 Dependency Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade every direct dependency to its latest compatible stable release, migrate the site to Astro 7 and Satteri without losing rendered article capabilities, and replace `bun.lock` with npm's `package-lock.json`.

**Architecture:** Astro 7 remains responsible for routing, content collections, MDX rendering, and static generation. Satteri replaces the unified remark/rehype pipeline; focused project-local plugins provide Expressive Code rendering, Temml math, heading anchors, and external-link hardening while existing MDX components remain unchanged.

**Tech Stack:** Astro 7, Satteri, MDX, React 19, Tailwind CSS 4, Expressive Code, Temml, npm lockfiles, Node test runner, Pagefind.

## Global Constraints

- npm is the only package manager; do not install or invoke Bun.
- Delete `bun.lock` and commit npm-generated `package-lock.json`.
- Upgrade all direct dependencies to the latest stable versions available at implementation time.
- Keep existing `.mdx` articles and the `Callout`, `Figure`, and `ImageGrid` component API.
- Preserve code titles, line numbers, collapsible sections, inline highlighting, math, heading anchors, and safe external-link attributes.
- Do not merge upstream astro-erudite v2 layout, routing, navigation, typography, or content.
- Do not push unless explicitly requested.

---

## File Structure

- `package.json`: latest direct versions and removal of obsolete unified packages.
- `package-lock.json`: npm's reproducible dependency graph; replaces `bun.lock`.
- `astro.config.ts`: Astro 7 integration wiring and Satteri processor configuration.
- `src/lib/expressive-code/*.ts`: shared block and inline code rendering.
- `src/lib/external-links.ts`: Satteri external-link hardening.
- `src/lib/heading-anchors.ts`: stable heading IDs and anchors.
- `src/lib/math.ts`: Temml-backed Satteri math rendering.
- `src/styles/typography.css`: Satteri code and MathML styles.
- `src/pages/[...id].astro`: remove obsolete KaTeX loading.
- `tests/markdown-rendering-contract.test.mjs`: generated-output contract.

### Task 1: Add The Astro 7 Rendering Contract

**Files:**
- Create: `tests/markdown-rendering-contract.test.mjs`
- Test: `tests/markdown-rendering-contract.test.mjs`

**Interfaces:**
- Consumes: generated HTML under `dist/`.
- Produces: assertions for code frames, heading anchors, external links, MathML, and absence of KaTeX CSS.

- [ ] **Step 1: Write the generated-output contract**

```js
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = new URL('../', import.meta.url)
const codePage = await readFile(
  new URL('dist/docker-learning-notes/index.html', root),
  'utf8',
)

assert.match(codePage, /class="expressive-code"/)
assert.match(codePage, /class="frame has-title/)
assert.match(codePage, /data-heading-anchor/)
assert.match(codePage, /target="_blank"/)
assert.match(codePage, /rel="nofollow noreferrer noopener"/)
assert.doesNotMatch(codePage, /katex\.min\.css/)
```

- [ ] **Step 2: Run the contract against the current build**

Run: `node --test tests/markdown-rendering-contract.test.mjs`

Expected: FAIL because the Satteri modules do not exist and the current build lacks the complete rendering contract.

- [ ] **Step 3: Commit the failing contract**

```bash
git add tests/markdown-rendering-contract.test.mjs
git diff --cached --check
git commit -m "test(markdown): define astro 7 rendering contract"
```

### Task 2: Install Latest Dependencies With npm

**Files:**
- Modify: `package.json`
- Create: `package-lock.json`
- Delete: `bun.lock`

**Interfaces:**
- Consumes: npm stable dist-tags and Volta-pinned Node/npm.
- Produces: a valid Astro 7 dependency tree and npm lockfile.

- [ ] **Step 1: Record the package-manager baseline**

```bash
node --version
npm --version
test -f bun.lock
test ! -f package-lock.json
```

Expected: Node `v24.15.0`, npm `11.11.0`, a Bun lockfile, and no npm lockfile.

- [ ] **Step 2: Install all latest direct runtime dependencies**

```bash
npm install --save-exact \
  @astrojs/check@latest @astrojs/mdx@latest @astrojs/react@latest \
  @astrojs/rss@latest @astrojs/sitemap@latest \
  @astrojs/markdown-satteri@latest \
  @expressive-code/plugin-collapsible-sections@latest \
  @expressive-code/plugin-line-numbers@latest \
  @iconify-json/lucide@latest @tailwindcss/vite@latest \
  @types/react@latest @types/react-dom@latest astro@latest astro-icon@latest \
  class-variance-authority@latest clsx@latest github-slugger@latest \
  hast-util-select@latest hast-util-to-html@latest hastscript@latest \
  lucide-react@latest photoswipe@latest radix-ui@latest react@latest \
  react-dom@latest satteri-expressive-code@latest sharp@latest \
  tailwind-merge@latest tailwindcss@latest temml@latest typescript@latest
```

- [ ] **Step 3: Install all latest direct development dependencies**

```bash
npm install --save-dev --save-exact \
  pagefind@latest prettier@latest prettier-plugin-astro@latest \
  prettier-plugin-astro-organize-imports@latest \
  prettier-plugin-tailwindcss@latest
```

- [ ] **Step 4: Remove obsolete unified packages**

```bash
npm uninstall @astrojs/markdown-remark @shikijs/rehype \
  rehype-expressive-code rehype-external-links rehype-katex \
  remark-emoji remark-math
```

- [ ] **Step 5: Delete `bun.lock` with `apply_patch` and verify npm state**

```bash
test ! -e bun.lock
test -f package-lock.json
npm ls --depth=0
```

Expected: no Bun lockfile, a populated npm lockfile, and no invalid direct dependency.

- [ ] **Step 6: Capture the expected configuration failure**

Run: `npx astro check`

Expected: FAIL because `astro.config.ts` still imports removed packages.

### Task 3: Implement Satteri Rendering Modules

**Files:**
- Create: `src/lib/expressive-code/config.ts`
- Create: `src/lib/expressive-code/index.ts`
- Create: `src/lib/expressive-code/inline.ts`
- Create: `src/lib/external-links.ts`
- Create: `src/lib/heading-anchors.ts`
- Create: `src/lib/math.ts`

**Interfaces:**
- Consumes: Satteri plugin APIs and `satteri-expressive-code`.
- Produces: `blockExpressiveCode`, `inlineExpressiveCode`, `externalLinks`, `headingAnchors()`, and `temmlMath`.

- [ ] **Step 1: Add shared Expressive Code configuration**

Create `config.ts` with `github-light` and `github-dark` themes, plugin instances for collapsible sections and line numbers, `wrap: true`, default line numbers, shell/text language exceptions, and the existing CSS variable style overrides. Export `ecRenderer = createRenderer(ecOptions)`.

- [ ] **Step 2: Add block and inline adapters**

```ts
export const blockExpressiveCode = expressiveCode({
  customCreateRenderer: () => ecRenderer,
})
```

In `inline.ts` parse `code{:language}` and `code{:.scope}` annotations, render language tokens with `ExpressiveCodeBlock`, serialize with `toHtml`, and report rendering failures as Satteri warnings without deleting source text.

- [ ] **Step 3: Add external-link and heading-anchor plugins**

```ts
ctx.setProperty(node, 'target', '_blank')
ctx.setProperty(node, 'rel', 'nofollow noreferrer noopener')
```

Use `GithubSlugger` for missing heading IDs. Preserve existing IDs and append an anchor containing `dataHeadingAnchor`, `href`, `ariaLabel`, and `tabIndex: -1`.

- [ ] **Step 4: Add Temml math rendering**

Render inline math with `temml.renderToString(value, { throwOnError: false })`. Render display math with `displayMode: true` inside `<math-display>`. Report exceptions as warnings.

- [ ] **Step 5: Add source contracts for the math processor**

Extend `tests/markdown-rendering-contract.test.mjs` to read `astro.config.ts` and `src/lib/math.ts`, then assert:

```js
assert.match(astroConfig, /features:\s*\{\s*math:\s*true\s*\}/)
assert.match(astroConfig, /mdastPlugins:\s*\[[^\]]*temmlMath/)
assert.match(mathPlugin, /inlineMath\(node,\s*ctx\)/)
assert.match(mathPlugin, /math\(node,\s*ctx\)/)
assert.match(mathPlugin, /displayMode:\s*true/)
```

The content corpus currently has no genuine TeX expressions; do not add a public article fixture solely for this test.

- [ ] **Step 6: Type-check the isolated modules**

Run: `npx tsc --noEmit --allowJs false`

Expected: the new modules type-check; old config import errors remain until Task 4.

### Task 4: Wire Astro 7 And Restore Rendering

**Files:**
- Modify: `astro.config.ts`
- Modify: `src/styles/typography.css`
- Modify: `src/pages/[...id].astro`
- Modify: `tests/markdown-rendering-contract.test.mjs` only for equivalent stable markup.

**Interfaces:**
- Consumes: Task 3 plugin exports.
- Produces: a successful Astro 7 build satisfying the rendering contract.

- [ ] **Step 1: Replace the old Markdown configuration**

Remove remark/rehype imports. Create one Satteri processor and share it with top-level Markdown and `mdx({ processor })`:

```ts
satteri({
  features: { math: true },
  mdastPlugins: [inlineExpressiveCode, temmlMath],
  hastPlugins: [externalLinks, blockExpressiveCode, headingAnchors()],
})
```

- [ ] **Step 2: Remove KaTeX runtime loading**

Delete `ensureKatexStyles` and its page-load/after-swap listeners from `src/pages/[...id].astro`.

- [ ] **Step 3: Adapt typography**

Replace `.shiki` inline hooks with `[data-ec]`. Replace `.katex-display` hooks with `math-display` and native MathML styling. Preserve Expressive Code margins and overflow.

- [ ] **Step 4: Run Astro diagnostics**

Run: `npx astro check`

Expected: 0 errors and no obsolete configuration warning.

- [ ] **Step 5: Build and run the focused contract**

```bash
npm run build
node --test tests/markdown-rendering-contract.test.mjs
```

Expected: both commands exit 0. Change test selectors only when output demonstrates equivalent behavior.

- [ ] **Step 6: Commit the working migration**

```bash
git add package.json package-lock.json bun.lock astro.config.ts \
  src/lib/expressive-code src/lib/external-links.ts \
  src/lib/heading-anchors.ts src/lib/math.ts \
  src/styles/typography.css 'src/pages/[...id].astro' \
  tests/markdown-rendering-contract.test.mjs
git diff --cached --check
git commit -m "chore: upgrade dependencies to astro 7"
```

### Task 5: Verify The Full Migration

**Files:**
- Modify: only files required by evidence-backed verification failures.
- Test: `tests/*.test.mjs`

**Interfaces:**
- Consumes: complete Astro 7 migration.
- Produces: clean, reproducible npm project with no unexplained direct dependency drift.

- [ ] **Step 1: Run all contracts**

Run: `node --test tests/*.test.mjs`

Expected: all tests pass with zero failures.

- [ ] **Step 2: Run the production build**

Run: `npm run build`

Expected: metadata sync, Astro check/build, Pagefind, and redirects all exit 0.

- [ ] **Step 3: Verify generated features**

```bash
test -f dist/pagefind/pagefind.js
test -f dist/docker-learning-notes.html
rg -n 'class="expressive-code"|data-heading-anchor' \
  dist/docker-learning-notes/index.html
rg -n 'features:.*math|temmlMath|displayMode:\s*true' \
  astro.config.ts src/lib/math.ts
```

Expected: Pagefind and redirects exist; representative HTML contains the code, heading, and link markers, while configuration and plugin source retain both inline and display math support. The current content corpus contains no real math expressions, so verification must not add a public fixture page.

- [ ] **Step 4: Verify dependency and lockfile state**

```bash
npm ls
npm outdated --json
test -f package-lock.json
test ! -e bun.lock
```

Expected: valid dependency tree, no outdated direct package entries, npm lockfile present, Bun lockfile absent.

- [ ] **Step 5: Verify repository hygiene**

```bash
git diff --check
git status --short --branch
git log -3 --oneline
```

Expected: no whitespace errors, no generated `dist/` files staged, and only intentional migration changes.

- [ ] **Step 6: Commit verification-driven fixes only when needed**

```bash
git add <only-the-verified-fix-files>
git diff --cached --check
git commit -m "fix: restore astro 7 build compatibility"
```

Do not create an empty fix commit.
