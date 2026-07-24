# Umami Global Scrollbar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every WebKit scrollbar in the blog use Umami's default one-pixel thumb and seven-pixel hover thumb treatment.

**Architecture:** `src/styles/global.css` owns the globally scoped pseudo-element rules, matching Umami's current `global.css` selector shape and geometry. The focused Node contract protects the selector scope and measurements; the browser check confirms generated CSS is loaded by an actual page.

**Tech Stack:** Astro 7, CSS WebKit scrollbar pseudo-elements, Node test runner, Chromium.

## Global Constraints

- Use Umami's unscoped `::-webkit-scrollbar` selectors for the root page and internal scrolling elements.
- Keep the 15px gutter, 7px default transparent borders, 4px hover transparent border, rounded thumb, `background-clip: padding-box`, and existing theme tokens.
- Remove the root-only Firefox override and the `body` inheritance reset; Umami has neither rule.
- Do not change component markup, JavaScript, ClientRouter, navigation progress, theme tokens, or generated `dist/` output.
- Do not push unless explicitly requested.

---

## File Structure

- `src/styles/global.css`: the single global source of scrollbar pseudo-element styling.
- `tests/scrollbar-contract.test.mjs`: static regression contract for Umami selector scope and geometry.

### Task 1: Apply and Protect the Global Umami Scrollbar

**Files:**
- Modify: `tests/scrollbar-contract.test.mjs`
- Modify: `src/styles/global.css`

**Interfaces:**
- Consumes: `--border` and `--muted-foreground` CSS custom properties.
- Produces: unscoped WebKit pseudo-element rules inherited by every native scrollbar in Chromium and Safari.

- [ ] **Step 1: Write the failing global-scope contract**

Replace `tests/scrollbar-contract.test.mjs` with:

```js
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const root = new URL('../', import.meta.url)

test('applies Umami scrollbar geometry to every WebKit scrollbar', async () => {
  const css = await readFile(new URL('src/styles/global.css', root), 'utf8')

  assert.match(css, /(^|\\n)::[-]webkit-scrollbar\\s*\\{[\\s\\S]*?width:\\s*15px/)
  assert.match(css, /(^|\\n)::[-]webkit-scrollbar-track\\s*\\{[\\s\\S]*?border:\\s*7px solid transparent/)
  assert.match(css, /(^|\\n)::[-]webkit-scrollbar-thumb\\s*\\{[\\s\\S]*?border:\\s*7px solid transparent/)
  assert.match(css, /(^|\\n)::[-]webkit-scrollbar-thumb:hover\\s*\\{[\\s\\S]*?border:\\s*4px solid transparent/)
  assert.match(css, /background-color:\\s*var\\(--border\\)/)
  assert.match(css, /background-color:\\s*var\\(--muted-foreground\\)/)
  assert.match(css, /border-radius:\\s*9999px/)
  assert.match(css, /background-clip:\\s*padding-box/)
  assert.doesNotMatch(css, /html::[-]webkit-scrollbar/)
  assert.doesNotMatch(css, /scrollbar-(?:width|color)\\s*:/)
})
```

- [ ] **Step 2: Run the contract and verify RED**

Run: `node --test tests/scrollbar-contract.test.mjs`

Expected: FAIL because the current selectors start with `html` and root-only Firefox rules remain.

- [ ] **Step 3: Replace root-only rules with Umami's global selectors**

Replace the existing `html`, `body`, and `html::-webkit-*` scrollbar block in `src/styles/global.css` with:

```css
::-webkit-scrollbar {
  width: 15px;
  background: transparent;
}

::-webkit-scrollbar-track {
  border: 7px solid transparent;
  background-color: var(--border);
  background-clip: padding-box;
}

::-webkit-scrollbar-thumb {
  border: 7px solid transparent;
  border-radius: 9999px;
  background-color: var(--muted-foreground);
  background-clip: padding-box;
}

::-webkit-scrollbar-thumb:hover {
  border: 4px solid transparent;
  background-clip: padding-box;
}
```

- [ ] **Step 4: Verify contracts and the production build**

Run:

```bash
node --test tests/scrollbar-contract.test.mjs
npm run build
node --test tests/header-secondary-menu-contract.test.mjs \\
  tests/navigation-progress-contract.test.mjs \\
  tests/theme-color-contract.test.mjs
git diff --check
```

Expected: all commands exit `0`; the production build emits the global selectors and the unrelated shell contracts remain green.

- [ ] **Step 5: Verify in Chromium and commit**

Run `npm run dev -- --host 127.0.0.1 --port 4321`, open a long article and a code block with horizontal overflow in Chromium, then verify that both thumbs are one pixel at rest and seven pixels while hovered. Stop the dev server when finished.

Commit only the changed source and contract:

```bash
git add src/styles/global.css tests/scrollbar-contract.test.mjs
git commit -m "fix(theme): apply umami scrollbar globally"
```

Expected: the commit contains no `dist/` files, screenshots, or unrelated `.vscode` changes.
