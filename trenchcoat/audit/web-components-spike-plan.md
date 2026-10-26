# Web components spike plan – Lit vs Stencil

2026-10-25 · Not started. Trenchcoat will be used by apps in other frameworks as well as React, so web components
are a candidate for the component layer. This spike ports the same three components with
[Lit](https://lit.dev/) and with [Stencil](https://stenciljs.com/). It answers three things: can web components
keep the accessibility, theming and performance work; which of the two tools suits Trenchcoat better; and what a
full port would cost. It ends in a decision, not in shipped code.

Related: [remediation-plan.md](remediation-plan.md) (the npm package is Phase 3 there),
[WCAG-2.2-AA-audit.md](WCAG-2.2-AA-audit.md), [bundle-and-performance-audit.md](bundle-and-performance-audit.md).

## What's at stake

The React code is large and React-specific, so a full port is a rewrite whichever tool wins:

| | Size |
|---|---|
| Component source (`src/components/`) | 71,000 lines, 64 components |
| Blocks, screens, illustrations, motion | 36,000 lines |
| Shared helpers (`src/internal/`) | 300 lines: value props, root ref, hotkeys, on-screen, focus rescue, smooth height |
| React APIs in use | `useState` / `useEffect` / `useRef` in ~62 components, `useId` in 51, the value-prop helper in 54, React 19 `<style href precedence>` in all 64, 182 props typed `ReactNode` |
| Tests | 185 contract and regression files; 127 use React Testing Library |
| Gallery demos | 123, all React |

What carries over unchanged with either tool: `tokens/tokens.css`, the `light-dark()` theming and theme selectors
(custom properties cross shadow boundaries), the pattern tokens, the `ui-*` class prefixes, the audits and
decisions, and the real-browser tools (`scripts/a11y.mjs`, `scripts/visual.mjs`), which test the rendered page.

## The two candidates

| | Lit | Stencil |
|---|---|---|
| What it is | A small library on top of standard custom elements | A compiler that turns TSX components into custom elements |
| Templates | `html` tagged templates – the JSX is rewritten | JSX / TSX – the components' markup carries over closely |
| State and logic | Reactive properties; shared logic as reactive controllers | `@Prop`, `@State`, `@Watch`, `@Event`, `@Method` and lifecycle methods; shared logic as plain functions or base classes |
| React hooks | Restructured into controllers and lifecycle callbacks | Restructured into lifecycle methods and watchers |
| Other frameworks | Works anywhere as custom elements; React wrappers via `@lit/react`, the rest by hand | Output targets generate React, Vue and Angular wrappers with typed props and events |
| Shadow DOM | On by default; light DOM with `createRenderRoot() { return this; }` | `shadow: true`, `scoped: true` (scoped CSS without a shadow root) or neither |
| Forms | `ElementInternals` written by hand | `formAssociated: true` plus `@AttachInternals()` |
| Server rendering | `@lit-labs/ssr` (experimental) | A hydrate build for server rendering |
| Runtime | One shared library (~6 KB gz expected) | A small runtime bundled into the output, components lazy-loaded by default (or a custom-elements build without the loader) |
| Backing | Google; larger community | Ionic; smaller community, used by several large design systems |

What neither avoids: in shadow DOM, ARIA id references (`aria-labelledby`, `aria-controls`,
`aria-activedescendant`, `<label for>`) don't cross the shadow boundary, and the cross-root ARIA proposal isn't
shipped everywhere yet. The spike tests each tool both with and without a shadow root.

## The components

| Component | Lines | Why it's in the spike |
|---|---|---|
| Button | 457 | The baseline: props, sizes, loading state, icon content, both looks. Shows the minimum cost per component and the bundle-size floor. |
| Combobox | 1,410 | The hard accessibility case: a `<label for>`, `aria-controls` and `aria-activedescendant` from the input to a listbox, chips, option windowing above 300 matches, a popover, and native form participation (`name`, hidden inputs, `required`). |
| Data Table | 1,805 | The hard runtime case: row windowing above 60 rows (`useRowWindow`), `aria-rowcount` / `aria-rowindex`, grid keyboard navigation with `aria-activedescendant`, cell selection, undo history, sort, and exported column icons. |

## Questions the spike must answer, for each tool

Each has a pass bar. A tool that misses 1 or 2 is out unless there's a workaround with a clear cost. If both tools
miss, the decision is no-go for web components.

| # | Question | Pass bar |
|---|---|---|
| 1 | **Shadow root or not?** With a shadow root, ARIA references across it break; without one, the existing CSS (already prefixed `ui-*` and scoped by `data-look`) works as is, but `<slot>` and style isolation are lost. Lit: shadow vs light DOM. Stencil: `shadow`, `scoped` or neither. | Combobox and data-table pass axe and the keyboard contract in Chromium, Firefox and WebKit, and VoiceOver and NVDA announce the active option / cell, with a page-level label pointing at the component |
| 2 | **Content projection.** 182 props take `ReactNode` (icons, empty states, cell content). With a shadow root they become slots; without one they need another mechanism (Stencil's scoped slot polyfill, child elements the component moves, or render functions). | One approach that works from React, Vue and plain HTML for Button's icon and data-table's custom cells, documented with a code sample for each |
| 3 | **Forms.** Combobox submits values and supports `required` and `invalid`. | A combobox inside a `<form>` submits, resets, reports `required` through the browser's validation, and works with `FormData`, in all three browsers |
| 4 | **Styles and looks.** Today each component adds its CSS once per page through React 19. Lit: `static styles` or one `adoptedStyleSheets` entry on the document. Stencil: `styleUrl` / `styles` per component. `look` becomes an attribute. | Both looks, light / dark / system, match the current screenshots (`scripts/visual.mjs`, pixel diff under the existing threshold); CSS is added once per page, not per instance |
| 5 | **Framework use.** | The three components work, with typed props and events, in React 19, Vue 3, Angular, Svelte 5 and plain HTML. Lit: native custom elements in React 19 vs `@lit/react` – pick one. Stencil: the generated React, Vue and Angular wrappers vs the plain elements – note what the wrappers add |
| 6 | **Server rendering.** Next.js (App Router) renders the React components on the server today. | Pages using the three components render on the server in Next.js and Nuxt without a hydration error or layout shift (Lit: `@lit-labs/ssr`; Stencil: the hydrate build); if not, the fallback (client-only rendering with a placeholder) and what it costs |
| 7 | **Performance.** | data-table at 10,000 rows mounts and scrolls within 20 % of the React numbers in the perf audit (4.5 ms mount, 5.2 ms max scroll task); combobox opens 5,000 options within 20 % (windowed). Button mount per instance no slower than React |
| 8 | **Size.** | Runtime plus each component, for 1 and 3 components, compared with the React package build of the same set and with each other |
| 9 | **Value props.** `value` + `onValueChange` stay in control (Phase 3 contract), while custom elements usually own their state and fire events. | A documented pattern that keeps controlled use working from React and Vue (`v-model`) without the element and the app fighting over the value |
| 10 | **Testing.** | The existing contract specs for the three components are rewritten for the tool's harness (Lit: Playwright component tests or `@web/test-runner`; Stencil: its built-in spec/e2e runner or Playwright), and `scripts/a11y.mjs` scans them; the time per spec sets the estimate for the other 182 files |
| 11 | **Porting effort.** | Hours per component for each tool, and how much of the React source (markup, CSS, logic) was reused unchanged – the main reason to consider Stencil is that its TSX should carry over more |
| 12 | **Developer experience.** | Build and rebuild time, type checking, editor support (custom-elements manifest for Lit; Stencil's generated `components.d.ts`), error messages, and how readable the output is when debugging in an app |

## Setup

- **Where:** `spike/lit/` and `spike/stencil/`, each with its own package.json (Lit 3 with Vite; Stencil 4).
  Nothing in `src/`, `components/`, the tests or CI changes. Both folders are deleted or one is moved once the
  decision is made.
- **Shared:** both import `tokens/tokens.css` and reuse the components' CSS text, so differences come from the tool,
  not from restyling.
- **Helpers:** the four `src/internal` helpers the three components need (value props, root ref, hotkeys,
  on-screen) are ported in each tool's idiom – Lit reactive controllers, Stencil functions or base classes. These
  set the pattern for the other helpers.
- **Sample apps:** `spike/apps/{react,vue,angular,svelte,html,next,nuxt}` – each renders both tools' components with
  the same data, a form around the combobox, and a 10,000-row table, so the tools are compared in the same apps.

## Steps (timebox: 7 working days)

1. **Day 1 – Button in both tools.** Port Button with Lit (shadow and light DOM) and with Stencil (`shadow`,
   `scoped`). Compare screenshots, size, how the icon is passed and the porting time. Port the value-prop helper in
   both.
2. **Days 2–3 – Combobox in both tools.** Port without a shadow root first (expected to pass question 1), then try
   with one, keeping the label and listbox inside the same root and using `ElementInternals` ARIA. Add form
   association. Run axe and the keyboard contract in three browsers for each.
3. **Days 4–5 – Data Table in both tools.** Port with row windowing (a Lit reactive controller with `repeat`;
   Stencil state with a keyed list). Measure against the perf audit's numbers. Pick the custom-cell mechanism for
   each (question 2).
4. **Day 6 – Frameworks and SSR.** Run the sample apps with both tools; try Lit SSR and Stencil's hydrate build in
   Next.js and Nuxt; check types and events in each framework, including Stencil's generated wrappers.
5. **Day 7 – Screen readers, measurements, write-up.** VoiceOver (Safari) and NVDA (Firefox) on combobox and
   data-table from each tool. Fill in the comparison and estimate the full port for the chosen tool.

If one tool clearly fails question 1 or 2 by day 3, drop it and spend the remaining days on the other.

## Output

`audit/web-components-spike-results.md`, with:

- the answer and evidence for each of the 12 questions, per tool (screenshots, axe output, timings, sizes);
- a side-by-side table of the two tools against the pass bars;
- for the chosen tool: the shadow-root mode, content-projection mechanism, framework integration and SSR approach;
- an estimate for the full port per library, from the measured time per component and per test file;
- a recommendation: Lit, Stencil, or stay on React.

## If it's a go

Rough order, to be refined by the results:

1. Port the remaining `src/internal` helpers; set up the package build for custom elements, the framework
   integrations (Stencil output targets or Lit wrappers) and type definitions.
2. Port the 64 components, simplest first, then menus and fields, then the large agent views; rewrite each
   component's tests as it moves and run the axe scan.
3. Blocks and screens: decide whether they become web components too or stay React on top of the components
   (they're app-level layouts, so React-only may be acceptable).
4. Move the gallery onto the new components (it can stay a React app).
5. Repeat the accessibility checks in full, including the screen-reader and forced-colours testing from the
   remediation plan.

Expected size, before the spike: 6–10 weeks for one developer with Lit, most of it in step 2 and the tests;
Stencil may be shorter if question 11 shows the TSX carrying over.

## If it's a no-go

Keep React and do the npm package as planned. For other frameworks, the fallbacks in order of cost: publish
`tokens.css` and the CSS recipes on their own so other frameworks can style native elements to match; or wrap
selected React components as custom elements (React inside a custom element) for the few that are needed.

## Effect on the remediation plan

- Remediation Phase 3, steps 1, 2 and 4 (repoint everything at `src/`, the gallery look switch, delete
  `components/`) are needed either way and don't depend on the spike.
- Step 3 (the package build) does: wait for the spike's decision, so the package is built once in its final
  shape.
- Phases 2, 4 and 5 (runtime fixes, scales, design follow-ups) are CSS and logic that would be ported anyway; doing
  them first means the port starts from the finished design. The type-scale and spacing passes (Phase 4) change the
  CSS the spike reuses, so either run the spike first or re-take its screenshots after Phase 4.
