# Lit port plan – Lit 3, TypeScript and ts-lit-plugin

2026-10-25 · Planning only; every decision is made (see "Decisions" below). Trenchcoat will be used by apps in other
frameworks as well as React, so all of it – components, blocks, screens, illustrations and motion – moves to web
components built with **[Lit 3](https://lit.dev/)** in **TypeScript**, with
**[ts-lit-plugin](https://github.com/runem/lit-analyzer)** type-checking the templates. The port starts with three
**pilot components** built for real in `src/`; they prove the decided patterns in practice and measure what the
rest of the port costs.

This plan is Part 2 of [remediation-plan.md](remediation-plan.md). Related:
[WCAG-2.2-AA-audit.md](WCAG-2.2-AA-audit.md), [bundle-and-performance-audit.md](bundle-and-performance-audit.md).

## What's being ported

The React code is large and React-specific, so the port is a rewrite:

| | Size |
|---|---|
| Component source (`src/components/`) | 71,000 lines, 64 components |
| Blocks, screens, illustrations, motion | 36,000 lines, 58 files |
| Shared helpers (`src/internal/`) | 300 lines: value props, root ref, hotkeys, on-screen, focus rescue, smooth height |
| React APIs in use | `useState` / `useEffect` / `useRef` in ~62 components, `useId` in 51, the value-prop helper in 54, React 19 `<style href precedence>` in all 64, 182 props typed `ReactNode` |
| Tests | 185 contract and regression files; 127 use React Testing Library |
| Gallery demos | 123, all React |

What carries over unchanged: `tokens/tokens.css`, the `light-dark()` theming and theme selectors, the pattern
tokens, the `ui-*` class prefixes, the CSS finished in Part 1 of the remediation plan, the audits and decisions, and
the real-browser tools (`scripts/a11y.mjs`, `scripts/visual.mjs`), which test the rendered page.

## Decisions

| | Topic | Decision |
|---|---|---|
| L1 | Library and language | `lit` 3.x (the latest 3 minor when the port starts, pinned exactly), TypeScript 5.8 `strict` |
| L2 | Decorators | Standard (TC39) decorators, not `experimentalDecorators`: `@property() accessor look: Look = "standard"`, `"useDefineForClassFields": true` |
| L3 | Template checking | ts-lit-plugin in the editor (`tsconfig.json` `"plugins": [{ "name": "ts-lit-plugin", "strict": true }]`; VS Code uses the workspace TypeScript) and the lit-analyzer CLI in `npm run ci` (TypeScript plugins don't run in `tsc`) |
| L4 | DOM | **Light DOM** for every element (`createRenderRoot() { return this; }`). ARIA id links (`<label for>`, `aria-labelledby`, `aria-controls`, `aria-activedescendant`) keep working across the page, and the existing CSS – prefixed `ui-*` and scoped by `data-look` – applies as is. No `<slot>` and no style isolation; the prefixes do the isolating. |
| L5 | Content | Named child elements, marked with a `slot` attribute (`<svg slot="icon">`, `<div slot="empty">`), which the element moves into place on connect and on change; text through properties and attributes; data-table cells through a `renderCell` property that returns a DOM `Node` or a string. Works the same from every framework and plain HTML. |
| L6 | Styles and looks | One constructed stylesheet per element type, added to `document.adoptedStyleSheets` once on first connect; `look` is a reflected attribute (`look="clean"`); an app-wide default through `@lit/context`. |
| L7 | Values | A `value` property plus a cancelable `tc-value-change` event carrying the proposed value; the element applies it unless the listener calls `preventDefault()`, which is how controlled use works. Other events are `tc-` prefixed too. |
| L8 | Forms | `static formAssociated = true` with `ElementInternals` for value, validity (`required`, `invalid`) and reset |
| L9 | React | Generated `@lit/react` wrappers in a `react` entry (`onValueChange`, typed props); every other framework uses the elements directly |
| L10 | Server rendering | **Not in v1.** Elements render on the client; pages reserve their size with a placeholder so nothing shifts. The Next.js and Nuxt examples load the elements client-only. |
| L11 | Windowing | data-table's `useRowWindow` ported as a reactive controller (it keeps its `aria-rowindex` and keyboard behaviour); combobox, trace-waterfall and filter-menu use the same controller |
| L12 | Tests | Vitest browser mode with the Playwright provider, in Chromium, Firefox and WebKit – the repo keeps Vitest; `scripts/a11y.mjs` scans every element |
| L13 | Tag names | `tc-` prefix: `<tc-button>`, `<tc-combobox>`, `<tc-data-table>` |
| L14 | Scope | Everything moves to Lit: components, blocks, screens, illustrations and motion. Screens switch from `lucide-react` to `lucide` (the framework-free package). The gallery stays a React app, using the elements through the wrappers. |
| L15 | Frameworks | `examples/` apps for React 19 (Vite) and Next.js, Vue 3 (Vite) and Nuxt, Angular (`CUSTOM_ELEMENTS_SCHEMA`), Svelte 5, and plain HTML |
| L16 | Screen readers | VoiceOver, run by Claude on this Mac, at the end of the pilot and in the final verification. NVDA isn't tested – a known gap. |

## Toolchain

| Part | Choice |
|---|---|
| Lit | `lit` 3.x; `@lit/context` (default look); `@lit/react` (wrappers); `@lit/task` where async state is needed |
| TypeScript | 5.8, standard decorators, ts-lit-plugin |
| CI checks | lit-analyzer `--strict`; `eslint-plugin-lit` and `eslint-plugin-wc` on top of typescript-eslint (`react-hooks` rules go when the React code is gone) |
| Element metadata | `@custom-elements-manifest/analyzer` → `custom-elements.json`, which drives framework types, editor completion and the wrappers |
| Build | Vite library mode, one module per element (remediation step 2.4) |
| Tests | Vitest browser mode + Playwright (Chromium, Firefox, WebKit) |
| Icons in screens | `lucide` |

## Where the code lives during the port

- Lit elements go in `src/elements/<slug>.ts` (blocks, screens, illustrations and motion in matching folders),
  beside the React code, until each React file is deleted. The gallery and tests switch per component as it's
  ported, so `npm run ci` stays green the whole way.
- `examples/{react,next,vue,nuxt,angular,svelte,html}` are small apps that install the packed tarball (`npm pack`)
  and render the ported elements. They start with the pilot and stay in the repo as integration checks, run in CI.

## The pilot components

| Component | Lines | What it proves |
|---|---|---|
| Button | 457 | The baseline: properties, sizes, loading state, the icon as a `slot="icon"` child, both looks. The minimum cost per component, the size floor, and the template for simple elements. |
| Combobox | 1,410 | The accessibility patterns in light DOM: `<label for>`, `aria-controls` and `aria-activedescendant` to a listbox, chips, windowing above 300 matches, a popover, and form association. |
| Data Table | 1,805 | The runtime patterns: the row-window controller above 60 rows, `aria-rowcount` / `aria-rowindex`, grid keyboard navigation, cell selection, undo history, sort, `renderCell`, and exported column icons. |

## Acceptance checks for the pilot

Each decided pattern must pass its check on the pilot elements before the rest of the port starts. A failure is
fixed within the decided pattern, not by reopening the decision.

| # | Pattern | Check |
|---|---|---|
| 1 | Light DOM, ARIA (L4) | Combobox and data-table pass axe and the keyboard contract in Chromium, Firefox and WebKit; VoiceOver announces the active option and cell; a page-level `<label for>` names the combobox |
| 2 | Content (L5) | Button's icon and data-table's custom cells work from React (wrapper), Vue, Angular, Svelte and plain HTML; a code sample for each goes in `audit/lit-patterns.md` |
| 3 | Forms (L8) | A combobox inside a `<form>` submits, resets, reports `required` through the browser's validation and works with `FormData`, in all three browsers |
| 4 | Styles and looks (L6) | Both looks, light / dark / system, match the React screenshots (`scripts/visual.mjs`, pixel diff under the existing threshold); one stylesheet per element type in `document.adoptedStyleSheets`, however many instances |
| 5 | Frameworks and React (L9, L15) | The pilot elements work with typed properties and events in every `examples/` app |
| 6 | No SSR (L10) | Next.js and Nuxt pages with the pilot elements load without hydration errors or layout shift |
| 7 | Performance (L11) | data-table at 10,000 rows mounts and scrolls within 20 % of the React baseline (remediation step 2.1); combobox opens 5,000 options within 20 %; Button mount per instance no slower than React |
| 8 | Size | Lit runtime once plus each element, for 1 and 3 elements, recorded against the React baseline |
| 9 | Values (L7) | Controlled use works from the React wrapper (`value` + `onValueChange`) and Vue (`v-model`) without the element and the app fighting over the value |
| 10 | Tests (L12) | The contract specs for the three components run in Vitest browser mode in three browsers, and `scripts/a11y.mjs` scans them; the time per spec is recorded |
| 11 | Typed templates (L3) | ts-lit-plugin and lit-analyzer report a seeded wrong property binding, misspelled element name, wrong event type and missing import |
| 12 | Porting effort | Hours per component and how much of the React source was reused, recorded for the estimate |

## Steps

1. **Toolchain** (day 1). Lit 3, standard decorators, ts-lit-plugin, lit-analyzer, the Lit ESLint rules, the
   manifest analyzer and Vitest browser mode, wired into `npm run ci`. Check 11 with seeded errors.
2. **Button** (days 1–2). The element, the value controller, the stylesheet helper and the `slot` child pattern.
3. **Combobox** (days 2–3). Light DOM ARIA, form association, windowing. Checks 1, 3 and 9.
4. **Data Table** (days 4–5). The row-window controller, `renderCell`, keyboard grid. Checks 1, 2 and 7.
5. **Examples** (day 6). The seven `examples/` apps with the packed tarball. Checks 2, 5 and 6.
6. **VoiceOver and the record** (day 7). VoiceOver on combobox and data-table; write `audit/lit-patterns.md` with
   code samples for each pattern and the measured time per component and per test file.

The pilot elements stay – they're the first three components of the port, not prototypes.

## After the pilot

The pilot is remediation step 2.3; it comes after 2.1 (the React baseline) and 2.2 (one source, no `components/`).
The rest of the port follows steps 2.4–2.8: the foundations (the remaining helpers as controllers, `@lit/context`,
the CI checks on Lit's CSS, the package build), the gallery look switch, the other 61 components (simplest first,
then menus and fields, then the large agent views, each with its tests, demo, axe scan and screenshot diff), blocks,
screens, illustrations and motion, and the full verification.

Expected size: 7–11 weeks for one developer, most of it in the component port and the tests; the pilot's measured
time per component refines it.
