# Lit spike plan – Lit 3, TypeScript and ts-lit-plugin

2026-10-25 · Not started. Trenchcoat will be used by apps in other frameworks as well as React, so the component
layer moves to web components built with **[Lit 3](https://lit.dev/)** in **TypeScript**, with
**[ts-lit-plugin](https://github.com/runem/lit-analyzer)** type-checking the templates. (Stencil was compared and
dropped.) This spike ports three components to settle how – shadow DOM, content, forms, frameworks, server
rendering – before the full port starts, and to measure what the full port costs. It ends in a set of decisions and
an estimate, not in shipped code.

Related: [remediation-plan.md](remediation-plan.md) (the npm package is Phase 3 there),
[WCAG-2.2-AA-audit.md](WCAG-2.2-AA-audit.md), [bundle-and-performance-audit.md](bundle-and-performance-audit.md).

## What's at stake

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
properties cross shadow boundaries), the pattern tokens, the `ui-*` class prefixes, the audits and decisions, and
the real-browser tools (`scripts/a11y.mjs`, `scripts/visual.mjs`), which test the rendered page.

## Toolchain

| Part | Choice | Notes |
|---|---|---|
| Library | `lit` 3.x (the latest 3 minor when the spike starts, pinned exactly) | One shared runtime (~6 KB gz expected) |
| Language | TypeScript 5.8 (the repo's version), `strict` | |
| Decorators | **Standard decorators** (TC39), not `experimentalDecorators` | Lit 3 supports both. Standard decorators need the `accessor` keyword: `@property() accessor look: Look = "standard"`. Set `"useDefineForClassFields": true` (the ES2022 default). |
| Template checking in the editor | **ts-lit-plugin** as a TypeScript language-service plugin | `tsconfig.json`: `"plugins": [{ "name": "ts-lit-plugin", "strict": true }]`. Checks element names, attribute and property bindings, event bindings and binding types inside `html\`…\``; VS Code needs "Use Workspace Version" of TypeScript for the plugin to load (or the lit-plugin extension). |
| Template checking in CI | **lit-analyzer** CLI (the same rules as ts-lit-plugin) | TypeScript plugins only run in editors, not in `tsc`, so `npm run ci` adds `lit-analyzer --strict src/**/*.ts`. |
| Linting | `eslint-plugin-lit` and `eslint-plugin-wc` on top of the existing typescript-eslint setup | `react-hooks` rules go once the React code is gone |
| Element metadata | `@custom-elements-manifest/analyzer` | Generates `custom-elements.json`, which drives framework types, editor completion and the React wrappers |
| Build | Vite library mode, one module per element | Replaces the React package build planned in remediation Phase 3 |
| React integration | Native custom elements in React 19 or `@lit/react` wrappers – decided by question 5 | |
| Helpers | Lit reactive controllers; `@lit/context` for an app-wide default look; `@lit/task` where async state is needed | |
| Windowing | `@lit-labs/virtualizer` vs a port of data-table's `useRowWindow` – decided by question 7 | |
| Server rendering | `@lit-labs/ssr` (experimental) – question 6 | |

## The components

| Component | Lines | Why it's in the spike |
|---|---|---|
| Button | 457 | The baseline: props, sizes, loading state, icon content, both looks. Shows the minimum cost per component and the bundle-size floor. |
| Combobox | 1,410 | The hard accessibility case: a `<label for>`, `aria-controls` and `aria-activedescendant` from the input to a listbox, chips, option windowing above 300 matches, a popover, and native form participation (`name`, hidden inputs, `required`). |
| Data Table | 1,805 | The hard runtime case: row windowing above 60 rows (`useRowWindow`), `aria-rowcount` / `aria-rowindex`, grid keyboard navigation with `aria-activedescendant`, cell selection, undo history, sort, and exported column icons. |

## Questions the spike must answer

Each has a pass bar. A miss on 1 or 2 without a workaround of known cost stops the port; the fallbacks are under
"If the spike fails".

| # | Question | Pass bar |
|---|---|---|
| 1 | **Shadow DOM or light DOM?** In shadow DOM, ARIA id references (`aria-labelledby`, `aria-controls`, `aria-activedescendant`, `<label for>`) don't cross the shadow boundary, and the cross-root ARIA proposal isn't shipped everywhere yet. Light DOM (`createRenderRoot() { return this; }`) keeps them working and fits the existing CSS (already prefixed `ui-*` and scoped by `data-look`), but loses `<slot>` and style isolation. | Combobox and data-table pass axe and the keyboard contract in Chromium, Firefox and WebKit, and VoiceOver and NVDA announce the active option / cell, with a page-level label pointing at the component |
| 2 | **Content projection.** 182 props take `ReactNode` (icons, empty states, cell content). In shadow DOM they become slots; in light DOM they need another mechanism (child elements the component moves, or render functions returning `TemplateResult`). | One approach that works from React, Vue and plain HTML for Button's icon and data-table's custom cells, documented with a code sample for each |
| 3 | **Forms.** Combobox submits values and supports `required` and `invalid`: `static formAssociated = true` and `ElementInternals`. | A combobox inside a `<form>` submits, resets, reports `required` through the browser's validation, and works with `FormData`, in all three browsers |
| 4 | **Styles and looks.** Today each component adds its CSS once per page through React 19. In Lit: `static styles` (shadow DOM) or one `adoptedStyleSheets` entry on the document (light DOM). `look` becomes a reflected attribute. | Both looks, light / dark / system, match the current screenshots (`scripts/visual.mjs`, pixel diff under the existing threshold); CSS is added once per page, not per instance |
| 5 | **Framework use.** | The three components work, with typed props and events (from `custom-elements.json`), in React 19, Vue 3, Angular, Svelte 5 and plain HTML. For React: native custom elements or `@lit/react` – pick one and say why |
| 6 | **Server rendering.** Next.js (App Router) renders the React components on the server today. | Pages using the three components render on the server in Next.js and Nuxt with `@lit-labs/ssr` without a hydration error or layout shift; if not, the fallback (client-only rendering with a placeholder) and what it costs |
| 7 | **Performance.** | data-table at 10,000 rows mounts and scrolls within 20 % of the React numbers in the perf audit (4.5 ms mount, 5.2 ms max scroll task); combobox opens 5,000 options within 20 % (windowed). Button mount per instance no slower than React. Compare `@lit-labs/virtualizer` with a ported `useRowWindow` |
| 8 | **Size.** | Lit runtime once plus each component, for 1 and 3 components, compared with the React package build of the same set |
| 9 | **Value props.** `value` + `onValueChange` stay in control (Phase 3 contract), while custom elements usually own their state and fire events. | A documented pattern that keeps controlled use working from React and Vue (`v-model`) without the element and the app fighting over the value |
| 10 | **Testing.** | The existing contract specs for the three components are rewritten for the new harness (Playwright component tests or `@web/test-runner`), and `scripts/a11y.mjs` scans them; the time per spec sets the estimate for the other 182 files |
| 11 | **Typed templates.** | ts-lit-plugin in the editor and lit-analyzer in CI catch a wrong property binding, a misspelled element name, a wrong event type and a missing import in the three components (seed one of each and confirm it's reported); no false positives left unexplained |
| 12 | **Porting effort.** | Hours per component, and how much of the React source (markup, CSS, logic) was reused unchanged |

## Setup

- **Where:** `spike/lit/`, with its own package.json (`lit`, `typescript`, `ts-lit-plugin`, `lit-analyzer`,
  `@custom-elements-manifest/analyzer`, `@lit/react`, `@lit/context`, `@lit-labs/ssr`, `@lit-labs/virtualizer`,
  `eslint-plugin-lit`, `eslint-plugin-wc`, Vite) and its own tsconfig with the plugin and standard decorators.
  Nothing in `src/`, `components/`, the tests or CI changes. The folder becomes the start of the real port or is
  deleted.
- **Shared:** it imports `tokens/tokens.css` and reuses the components' CSS text, so differences come from Lit, not
  from restyling.
- **Helpers:** the four `src/internal` helpers the three components need (value props, root ref, hotkeys,
  on-screen) are ported as reactive controllers. These set the pattern for the other helpers.
- **Sample apps:** `spike/apps/{react,vue,angular,svelte,html,next,nuxt}` – each renders the three components with
  the same data, a form around the combobox, and a 10,000-row table.

## Steps (timebox: 5 working days)

1. **Day 1 – Toolchain and Button.** Set up TypeScript with standard decorators, ts-lit-plugin, lit-analyzer,
   ESLint and the manifest analyzer. Port Button in shadow and light DOM; compare screenshots, size and how the icon
   is passed. Port the value-prop controller. Seed the question 11 errors and check they're reported in the editor
   and in CI.
2. **Day 2 – Combobox.** Port in light DOM first (expected to pass question 1), then try shadow DOM with the label
   and listbox inside the same root and with `ElementInternals` ARIA. Add form association. Run axe and the
   keyboard contract in three browsers.
3. **Day 3 – Data Table.** Port with row windowing, once with `@lit-labs/virtualizer` and once with a ported
   `useRowWindow`. Measure against the perf audit's numbers. Pick the custom-cell mechanism (question 2).
4. **Day 4 – Frameworks and SSR.** Run the sample apps; try `@lit-labs/ssr` in Next.js and Nuxt; check types and
   events in each framework.
5. **Day 5 – Screen readers, measurements, write-up.** VoiceOver (Safari) and NVDA (Firefox) on combobox and
   data-table. Fill in the results and estimate the full port.

## Output

`audit/lit-spike-results.md`, with:

- the answer and evidence for each of the 12 questions (screenshots, axe output, timings, sizes);
- the decisions for the full port: DOM mode, content-projection mechanism, React integration, SSR approach,
  windowing, test harness;
- an estimate for the full port per library, from the measured time per component and per test file.

## The full port, after the spike

Rough order, to be refined by the results:

1. Port the remaining `src/internal` helpers as controllers; set up the package build for custom elements, the
   React integration, `custom-elements.json` and type definitions; add lit-analyzer and the Lit ESLint rules to
   `npm run ci`.
2. Port the 64 components, simplest first, then menus and fields, then the large agent views; rewrite each
   component's tests as it moves and run the axe scan.
3. Blocks and screens: decide whether they become web components too or stay React on top of the components
   (they're app-level layouts, so React-only may be acceptable).
4. Move the gallery onto the new components (it can stay a React app).
5. Repeat the accessibility checks in full, including the screen-reader and forced-colours testing from the
   remediation plan.

Expected size, before the spike: 6–10 weeks for one developer, most of it in step 2 and the tests.

## If the spike fails

If question 1 or 2 has no workable answer: keep React and build the npm package as planned. For other frameworks,
the fallbacks in order of cost: publish `tokens.css` and the CSS recipes on their own so other frameworks can style
native elements to match; or wrap selected React components as custom elements (React inside a custom element) for
the few that are needed.

## Effect on the remediation plan

- Remediation Phase 3, steps 1, 2 and 4 (repoint everything at `src/`, the gallery look switch, delete
  `components/`) are needed either way and don't depend on the spike.
- Step 3 (the package build) becomes the Lit package build described above, once the spike has settled its open
  questions.
- Phases 2, 4 and 5 (runtime fixes, scales, design follow-ups) are CSS and logic that would be ported anyway; doing
  them first means the port starts from the finished design. The type-scale and spacing passes (Phase 4) change the
  CSS the spike reuses, so either run the spike first or re-take its screenshots after Phase 4.
