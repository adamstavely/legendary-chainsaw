# Lit port plan – Lit 3, TypeScript and ts-lit-plugin

2026-10-25 · Planning only. Trenchcoat will be used by apps in other frameworks as well as React, so the component
layer moves to web components built with **[Lit 3](https://lit.dev/)** in **TypeScript**, with
**[ts-lit-plugin](https://github.com/runem/lit-analyzer)** type-checking the templates. This is decided (Stencil
was compared and dropped), so there is no throwaway spike. The port starts with three **pilot components** built
for real in `src/`; they settle the patterns every other component then follows – shadow or light DOM, content,
forms, framework use, server rendering – and measure what the rest of the port costs.

This plan is Part 2 of [remediation-plan.md](remediation-plan.md). Related:
[WCAG-2.2-AA-audit.md](WCAG-2.2-AA-audit.md), [bundle-and-performance-audit.md](bundle-and-performance-audit.md).

## What's being ported

The React code is large and React-specific, so the port is a rewrite:

| | Size |
|---|---|
| Component source (`src/components/`) | 71,000 lines, 64 components |
| Blocks, screens, illustrations, motion | 36,000 lines |
| Shared helpers (`src/internal/`) | 300 lines: value props, root ref, hotkeys, on-screen, focus rescue, smooth height |
| React APIs in use | `useState` / `useEffect` / `useRef` in ~62 components, `useId` in 51, the value-prop helper in 54, React 19 `<style href precedence>` in all 64, 182 props typed `ReactNode` |
| Tests | 185 contract and regression files; 127 use React Testing Library |
| Gallery demos | 123, all React |

What carries over unchanged: `tokens/tokens.css`, the `light-dark()` theming and theme selectors (custom
properties and `color-scheme` cross shadow boundaries), the pattern tokens, the `ui-*` class prefixes, the CSS
finished in Part 1 of the remediation plan, the audits and decisions, and the real-browser tools
(`scripts/a11y.mjs`, `scripts/visual.mjs`), which test the rendered page.

## Toolchain

| Part | Choice | Notes |
|---|---|---|
| Library | `lit` 3.x (the latest 3 minor when the port starts, pinned exactly) | One shared runtime (~6 KB gz expected) |
| Language | TypeScript 5.8 (the repo's version), `strict` | |
| Decorators | **Standard decorators** (TC39), not `experimentalDecorators` | Lit 3 supports both. Standard decorators need the `accessor` keyword: `@property() accessor look: Look = "standard"`. Keep `"useDefineForClassFields": true` (the ES2022 default). |
| Template checking in the editor | **ts-lit-plugin** as a TypeScript language-service plugin | `tsconfig.json`: `"plugins": [{ "name": "ts-lit-plugin", "strict": true }]`. Checks element names, attribute and property bindings, event bindings and binding types inside `html\`…\``; VS Code needs "Use Workspace Version" of TypeScript for the plugin to load (or the lit-plugin extension). |
| Template checking in CI | **lit-analyzer** CLI (the same rules as ts-lit-plugin) | TypeScript plugins only run in editors, not in `tsc`, so `npm run ci` adds `lit-analyzer --strict`. |
| Linting | `eslint-plugin-lit` and `eslint-plugin-wc` on top of the existing typescript-eslint setup | `react-hooks` rules go once the React components are gone |
| Element metadata | `@custom-elements-manifest/analyzer` | Generates `custom-elements.json`, which drives framework types, editor completion and the React wrappers |
| Build | Vite library mode, one module per element | The package build (remediation step 2.4) |
| React integration | Native custom elements in React 19 or `@lit/react` wrappers – settled by the pilot | |
| Helpers | Lit reactive controllers; `@lit/context` for an app-wide default look; `@lit/task` where async state is needed | |
| Windowing | `@lit-labs/virtualizer` or a port of data-table's `useRowWindow` – settled by the pilot | |
| Server rendering | `@lit-labs/ssr` (still a labs package) – settled by the pilot | |

## Where the code lives during the port

- Lit elements go in `src/elements/<slug>.ts`, beside the React components in `src/components/`, until each React
  component is deleted. The gallery and tests switch per component as it's ported, so `npm run ci` stays green the
  whole way.
- `examples/{react,vue,angular,svelte,html,next,nuxt}` are small apps that install the packed package and render
  the ported elements. They start with the pilot and stay in the repo as integration checks, run in CI.

## The pilot components

| Component | Lines | What it settles |
|---|---|---|
| Button | 457 | The baseline: properties, sizes, loading state, icon content, both looks. The minimum cost per component, the size floor, and the template for simple elements. |
| Combobox | 1,410 | The accessibility patterns: a `<label for>`, `aria-controls` and `aria-activedescendant` from the input to a listbox, chips, option windowing above 300 matches, a popover, and native form participation (`name`, hidden inputs, `required`). |
| Data Table | 1,805 | The runtime patterns: row windowing above 60 rows, `aria-rowcount` / `aria-rowindex`, grid keyboard navigation with `aria-activedescendant`, cell selection, undo history, sort, and exported column icons. |

## What the pilot must settle

Each has a bar the pilot components must meet. If an approach misses it, the pilot tries the next approach (the
alternatives are in the question) – the outcome is a pattern, not a go / no-go.

| # | Question | Bar |
|---|---|---|
| 1 | **Shadow DOM or light DOM?** In shadow DOM, ARIA id references (`aria-labelledby`, `aria-controls`, `aria-activedescendant`, `<label for>`) don't cross the shadow boundary, and the cross-root ARIA proposal isn't shipped everywhere yet. Light DOM (`createRenderRoot() { return this; }`) keeps them working and fits the existing CSS (already prefixed `ui-*` and scoped by `data-look`), but loses `<slot>` and style isolation. A mix is possible: shadow DOM for self-contained elements, light DOM where ARIA must reach the page. | Combobox and data-table pass axe and the keyboard contract in Chromium, Firefox and WebKit, and VoiceOver and NVDA announce the active option / cell, with a page-level label pointing at the element |
| 2 | **Content projection.** 182 props take `ReactNode` (icons, empty states, cell content). In shadow DOM they become slots; in light DOM they need another mechanism (child elements the element moves into place, or render functions returning `TemplateResult`). | One approach that works from React, Vue and plain HTML for Button's icon and data-table's custom cells, documented with a code sample for each |
| 3 | **Forms.** Combobox submits values and supports `required` and `invalid`: `static formAssociated = true` and `ElementInternals`. | A combobox inside a `<form>` submits, resets, reports `required` through the browser's validation, and works with `FormData`, in all three browsers |
| 4 | **Styles and looks.** Today each component adds its CSS once per page through React 19. In Lit: `static styles` (shadow DOM) or one `adoptedStyleSheets` entry on the document (light DOM). `look` becomes a reflected attribute. | Both looks, light / dark / system, match the React screenshots (`scripts/visual.mjs`, pixel diff under the existing threshold); CSS is added once per page, not per instance |
| 5 | **Framework use.** | The pilot elements work, with typed properties and events (from `custom-elements.json`), in every `examples/` app. For React: native custom elements or `@lit/react` – pick one and say why |
| 6 | **Server rendering.** Next.js (App Router) renders the React components on the server today. | Pages using the pilot elements render on the server in Next.js and Nuxt with `@lit-labs/ssr` without a hydration error or layout shift; if that isn't reliable, client-only rendering with a sized placeholder, documented |
| 7 | **Performance.** | data-table at 10,000 rows mounts and scrolls within 20 % of the React baseline (remediation step 2.1); combobox opens 5,000 options within 20 % (windowed); Button mount per instance no slower than React. `@lit-labs/virtualizer` compared with a ported `useRowWindow` |
| 8 | **Size.** | Lit runtime once plus each element, for 1 and 3 elements, compared with the React baseline of the same set |
| 9 | **Value properties.** `value` + `onValueChange` stay in control (the code-quality Phase 3 contract), while custom elements usually own their state and fire events. | A documented pattern that keeps controlled use working from React and Vue (`v-model`) without the element and the app fighting over the value |
| 10 | **Testing.** | The contract specs for the three components are rewritten for the new harness (Playwright component tests or `@web/test-runner`), and `scripts/a11y.mjs` scans them; the time per spec sets the estimate for the other 182 files |
| 11 | **Typed templates.** | ts-lit-plugin in the editor and lit-analyzer in CI catch a wrong property binding, a misspelled element name, a wrong event type and a missing import (seed one of each and confirm it's reported); no false positives left unexplained |
| 12 | **Porting effort.** | Hours per component, and how much of the React source (markup, CSS, logic) was reused unchanged |

## Steps

1. **Toolchain** (day 1). Lit 3, TypeScript standard decorators, ts-lit-plugin, lit-analyzer, the Lit ESLint rules
   and the manifest analyzer, wired into `npm run ci`. Check question 11 with seeded errors.
2. **Button** (day 1–2). In shadow and light DOM; compare screenshots, size and the icon mechanism. The value-property
   controller.
3. **Combobox** (days 2–3). Light DOM first, then shadow DOM with the label and listbox inside one root and
   `ElementInternals` ARIA. Form association. Axe and the keyboard contract in three browsers.
4. **Data Table** (days 4–5). Row windowing both ways; measure against the baseline; the custom-cell mechanism.
5. **Examples and server rendering** (day 6). The `examples/` apps; `@lit-labs/ssr` in Next.js and Nuxt; types and
   events in each framework.
6. **Screen readers and the record** (day 7). VoiceOver (Safari) and NVDA (Firefox) on combobox and data-table.
   Write `audit/lit-patterns.md`: the answer and evidence for each question, the chosen patterns with code samples,
   and the measured time per component and per test file, which turns into the estimate for the rest of the port.

The pilot elements stay – they're the first three components of the port, not prototypes.

## After the pilot

The pilot is remediation step 2.3; it comes after 2.1 (the React baseline) and 2.2 (one source, no
`components/`). The rest of the port follows steps 2.4–2.8: the foundations (the remaining helpers as controllers,
`@lit/context`, the CI checks on Lit's CSS, the package build), the gallery look switch, the other 61 components (simplest first, then menus and fields, then the large agent views, each with its
tests, demo, axe scan and screenshot diff), blocks, screens, illustrations and motion, and the full verification.

Expected size: 6–10 weeks for one developer, most of it in the component port and the tests; the pilot's measured
time per component refines it.
