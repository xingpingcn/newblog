# Markdown Callouts, Temml Styling, And Scrollbar Design

## Goal

Add Markdown-native Callout directives with repository-level VS Code
autocomplete, complete the existing Temml MathML presentation, and apply an
Umami-style global scrollbar without removing or changing existing blog
features.

## Scope

The change includes:

- Markdown `:::` Callout directives for every Callout variant already
  supported by the site;
- VS Code snippets that prefer the new Markdown syntax while retaining
  snippets for the existing Astro component;
- the complete Temml MathML stylesheet adapted to the site's `.prose`
  container;
- a vendored STIX Two Math font used only for mathematical content;
- an Umami-style replacement for browser scrollbars throughout the site.

The change does not include the upstream v2 continuous series reader, unified
series table of contents, persistent article action bar, sidebar redesign,
route changes, content migration, or removal of pagination or the About page.

## Preservation Requirements

No existing capability may be deleted as part of this work. In particular:

- keep `.mdx` collection and `@astrojs/mdx` integration;
- keep all existing `<Callout>` articles working without migration;
- keep Tailwind CSS, React, shadcn components, Astro Icon, Pagefind, existing
  routes, subpost navigation, and table-of-contents components;
- keep `<ClientRouter />`, View Transitions, `transition:persist`, navigation
  progress, theme synchronization, and the existing Astro navigation lifecycle
  listeners;
- keep the existing header, including the secondary-menu blur contract;
- do not enable upstream's global `prefetchAll` setting.

If implementation reveals that any existing capability must be deleted or
materially changed, stop and request the user's decision before proceeding.

## Shared Callout Model

Create one shared Callout configuration module used by both the existing
`<Callout>` component and the new Satteri directive plugin. It is the single
source of truth for variant names, colors, and Lucide icons.

The supported existing variants are:

`note`, `tip`, `warning`, `danger`, `important`, `definition`, `theorem`,
`lemma`, `proof`, `corollary`, `proposition`, `axiom`, `conjecture`,
`notation`, `remark`, `intuition`, `recall`, `explanation`, `example`,
`exercise`, `problem`, `answer`, `solution`, and `summary`.

The Markdown directive additionally accepts `caution` as the standard
GitHub-style spelling. It is an alias of `danger` and uses the same visual
configuration. Existing component markup and behavior must remain compatible;
the internal configuration extraction must not alter its rendered semantics.

## Markdown Directive

Enable Satteri's `directive` parser feature and add a focused mdast plugin to
the existing shared Markdown/MDX processor.

Authoring syntax:

```markdown
:::warning[Custom title]
Callout content can contain Markdown.
:::
```

Add `{closed}` to render the Callout initially collapsed:

```markdown
:::solution[Answer]{closed}
Hidden until the reader expands it.
:::
```

The plugin outputs semantic `<details>` and `<summary>` markup with:

- a stable `data-callout` variant hook;
- the configured Lucide icon;
- the variant label plus optional custom title;
- a disclosure chevron;
- `open` unless the `closed` attribute is present.

Unknown directive names must be left untouched rather than silently rendered
as a Callout. Icon generation happens at build time; it must not add client-side
JavaScript or an external icon request.

## Callout Styling

Add Callout directive CSS to the existing typography layer. It should preserve
the visual language of the current component: a colored left border, matching
title and icon color, compact spacing, hidden native summary marker, rotating
chevron, and theme-aware colors.

The directive CSS must be scoped to `.prose [data-callout]` so it does not
affect unrelated `<details>` elements. Existing `<Callout>` styles remain in
the component.

## VS Code Authoring Experience

Update the tracked project snippets in `.vscode/mdx.code-snippets` for both
`markdown` and `mdx` scopes.

- `callout` generates an open Markdown `:::` Callout.
- `callout-folded` generates a `{closed}` Markdown Callout.
- Both expose a choice list covering every supported variant, including
  `caution`.
- `callout-component` retains the existing `<Callout>` component snippet.
- `callout-component-folded` retains the existing collapsed component snippet.
- Existing unrelated snippets remain unchanged.

The current workspace settings for snippet suggestions and tab completion
remain enabled.

## Temml Math Presentation

The Satteri/Temml rendering pipeline already produces inline and display
MathML. Complete the presentation by adapting upstream's full
`typography-math.css` to the site's `.prose` content container and importing
it from the shared layout.

The stylesheet must cover Temml's generated structures, including fractions,
roots, accents, equation numbering, cancellation, long division, phasors,
spacing, display layout, and Firefox/WebKit compatibility.

Vendor upstream's `STIXTwoMath-Regular.woff2` under the repository's font
assets and register it with `font-display: swap`. Apply it only to MathML,
using `Cambria Math` and generic math/serif fallbacks. Geist remains the site
body font and Geist Mono remains the code font.

No KaTeX stylesheet or client-side math runtime is introduced.

## Umami-Style Global Scrollbar

Adapt Umami's current global scrollbar CSS to the site's theme variables.

For Chromium, Safari, and other WebKit-scrollbar implementations:

- reserve a 15-pixel scrollbar gutter;
- use transparent borders and `background-clip: padding-box` so the default
  thumb appears as a narrow line;
- use a fully rounded thumb;
- reduce the transparent border on hover so the thumb becomes thicker;
- map the track to `--border` and the thumb to `--muted-foreground`.

For Firefox, use `scrollbar-width` and `scrollbar-color` to provide the closest
native equivalent. The implementation must remain CSS-only and theme-aware.

Use Umami's unscoped WebKit scrollbar selectors so the root page and every
internal scrolling region share the same treatment, including code blocks,
Pagefind result containers, subpost panels, and table-of-contents panels.
The default visible thumb is a one-pixel line within its 15-pixel gutter;
hovering the thumb exposes a seven-pixel width.

The top navigation progress indicator remains a separate feature and is not
changed by this scrollbar work.

## Testing Strategy

Use test-driven implementation with focused contract coverage before
production changes.

The tests must verify:

- Satteri enables directives and registers the Callout plugin;
- every shared Callout variant is available to the plugin and VS Code snippets;
- `caution` resolves to the existing `danger` visual semantics;
- generated output contains open and closed Callouts with titles, icons, and
  Markdown body content;
- the existing `<Callout>` component contract remains present;
- the full Temml stylesheet is imported and contains representative complex
  `.tml-*` rules;
- the STIX Two Math font is registered and emitted by the build;
- root and internal scrollbars use Umami's narrow/default and thick/hover behavior;
- ClientRouter, navigation progress, and the secondary-menu blur contracts
  remain intact.

Use a small Markdown fixture or existing representative content for build
output assertions without converting current articles. Do not commit generated
`dist` output.

## Verification

Before delivery, run:

```sh
node --test tests/*.test.mjs
npm run build
git diff --check
```

Inspect representative generated HTML/CSS to confirm directive rendering,
MathML styling/font emission, and scrollbar output. Perform a browser check in
light and dark themes for root and internal scrollbars, open and folded Callouts, math
layout, and navigation across ClientRouter page swaps.

## Delivery

The design document is committed separately before implementation. Production
changes should be committed only after all verification succeeds. Do not push
unless the user explicitly requests it.
