# Astro 7 Dependency Upgrade Design

## Goal

Upgrade the project from Astro 6 to the latest stable Astro 7 release and
upgrade all direct dependencies to their latest stable releases in one
maintenance change. Replace the obsolete Bun lockfile with npm's native
lockfile and simplify the Markdown implementation without removing existing
rendered capabilities.

## Scope

The migration includes:

- upgrading every direct dependency and development dependency to its latest
  stable release;
- migrating Astro and its official integrations to their Astro 7-compatible
  releases;
- replacing the remark/rehype Markdown pipeline with Astro 7's Satteri
  processor;
- retaining the current MDX authoring format and custom Astro components;
- replacing `bun.lock` with an npm-generated `package-lock.json`;
- adapting project code, styles, and tests where required by dependency API or
  output changes.

The migration does not merge the upstream astro-erudite v2 branch or adopt its
page layout, routing, navigation, typography, or content structure.

## Package Manager And Lockfile

npm remains the only package manager used for installation, scripts, builds,
and dependency maintenance.

- Delete `bun.lock`.
- Generate and commit `package-lock.json` with the repository's Volta-pinned
  npm version.
- Do not install Bun or invoke Bun through `npx`.
- Keep `package.json` and `package-lock.json` synchronized throughout the
  migration.

## Dependency Policy

All direct dependencies are upgraded to the latest stable versions available
at implementation time. This includes Astro, official Astro integrations,
React, Tailwind CSS, TypeScript, Radix UI, Sharp, Pagefind, Prettier, and their
project-declared plugins.

Packages made obsolete by the Satteri migration are removed rather than
upgraded. Expected removals include:

- `@astrojs/markdown-remark`;
- `remark-math` and `remark-emoji`;
- `rehype-external-links`, `rehype-katex`, and `rehype-expressive-code`;
- `@shikijs/rehype`;
- any Expressive Code plugin package no longer needed by the selected Satteri
  integration.

Transitive dependencies are controlled by `package-lock.json`; they are not
added to `package.json` unless project code imports them directly.

## Markdown And MDX Architecture

Astro 7's Satteri processor becomes the content pipeline. The implementation
may reuse narrowly scoped Satteri adapters from upstream astro-erudite when
they match this project's behavior, but it must not copy the upstream v2
application architecture.

The existing `.mdx` files remain valid without bulk conversion to `.md` or
rewriting every article. The `@astrojs/mdx` integration remains because
articles import and render these custom Astro components:

- `Callout`;
- `Figure`;
- `ImageGrid`.

The Satteri configuration must preserve these observable capabilities:

- fenced code syntax highlighting;
- code block titles, line numbers, collapsible sections, and existing fence
  metadata used by migrated articles;
- inline code highlighting annotations used by content;
- stable heading IDs and visible heading anchor links;
- safe external links with `target="_blank"` and
  `rel="nofollow noreferrer noopener"`;
- inline and display math rendering;
- the rendered structure and class hooks required by the existing typography
  styles and table-of-contents code.

Emoji shortcode expansion is optional because it is not a required project
contract. Plain Unicode emoji and text content must remain unchanged.

## Math Rendering

The remark/rehype KaTeX pipeline is replaced with a Satteri-native math
renderer. Temml is preferred because upstream already demonstrates a small
Satteri plugin and it emits native MathML without a client-side stylesheet
request.

The migration must:

- preserve both inline and display math syntax;
- add the required MathML styling to the project's existing typography layer;
- remove the dynamic KaTeX stylesheet loader from the article page;
- remove KaTeX-specific CSS only after equivalent math rendering is verified.

## Code Rendering

Use the current Satteri-compatible Expressive Code integration rather than the
remark/rehype integration. Its configuration should reproduce the current
light/dark themes and code-frame behavior while retaining existing CSS hooks
where practical.

If the new renderer produces intentionally different markup, adapt the
project's typography styles and add a focused contract test instead of keeping
an obsolete dependency solely for historical class names.

## Astro 7 Compatibility

The migration must account for Astro 7's documented changes:

- Vite 8 is the underlying bundler;
- the Rust compiler is stricter about invalid HTML;
- Satteri is the default Markdown/MDX processor;
- HTML whitespace compression defaults to JSX semantics;
- stable advanced routing and queued rendering behavior may expose existing
  assumptions.

The existing Tailwind Vite plugin remains framework-managed through Astro's
`vite.plugins` configuration. Vite is not added as a direct dependency unless
an imported API requires it.

Node 24 already satisfies Astro's runtime requirement and remains pinned by
Volta unless the latest direct dependencies require a newer stable Node LTS.

## Implementation And Failure Isolation

Although the result is one full dependency upgrade, implementation proceeds in
diagnostic stages:

1. establish the current test and build baseline;
2. switch to `package-lock.json` and install latest direct dependencies;
3. make Astro 7 and official integrations type-check;
4. replace the Markdown pipeline and restore content rendering capabilities;
5. repair compatibility issues from React, Tailwind, TypeScript, Radix UI,
   Sharp, Prettier, and other upgraded packages;
6. run the complete verification suite and inspect representative output.

Each stage is allowed to be temporarily failing locally, but the final working
tree must not retain compatibility shims, unused packages, or partially
migrated configuration.

## Verification

The completed migration must satisfy all of the following:

- `node --test tests/*.test.mjs` passes;
- `npm run build` passes, including image metadata sync, `astro check`, Astro
  static generation, Pagefind indexing, and legacy redirect generation;
- `npm outdated` reports no outdated direct dependencies, except a package
  intentionally held back with a documented compatibility reason;
- `npm ls` reports a valid dependency tree without peer dependency errors;
- `git diff --check` passes;
- representative generated articles demonstrate MDX components, titled and
  collapsible code blocks, heading anchors, external-link attributes, and math
  output;
- the generated search index and legacy `.html` redirects still exist;
- the working tree contains `package-lock.json` and no `bun.lock`.

If a latest stable dependency cannot coexist with Astro 7 or another required
latest stable package, the implementation must document the exact peer or
runtime constraint and use the newest compatible stable version rather than
forcing an invalid dependency tree.

## Delivery

The implementation is a repository maintenance change. It should be committed
separately from this design document after all validation passes. No push is
performed unless explicitly requested.
