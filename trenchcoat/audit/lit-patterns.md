# Lit patterns – what the pilot settled

2026-10-26 · Remediation step 2.3. Button, Combobox and Data Table were ported to Lit 3 (`src/elements/`) and checked
against the acceptance checks in [lit-port-plan.md](lit-port-plan.md). This is the pattern every other component
follows in step 2.6. Code: `src/elements/internal/` (base element, controllers, styles, look), the three elements,
`src/elements/react.ts`; tests: `tests/elements/`; apps: `examples/`.

## The patterns

### Light DOM, the host is the root (L4)

Every element extends `TcElement` (`src/elements/internal/base.ts`): it renders into itself
(`createRenderRoot() { return this; }`), so ARIA id links reach the page and the React components' CSS applies as
is. The host is the component's root – it carries `data-ui="<name>"` and `data-look`. The CSS is keyed on
`[data-ui="<name>"]`, not on a class: a framework that rewrites `class` can't remove it. Porting a component's CSS
is one substitution (`.ui-cbx` → `[data-ui="cbx"]`, root only); nothing else changes.

A zero-specificity default makes every element `display: block` (custom elements are inline; the React roots were
`div` and `section`). Without it the first data-table screenshots were broken.

```ts
export class TcCombobox extends TcElement {
  static override ui = "cbx";                 // [data-ui="cbx"]
  static override css = /* css */ `[data-ui="cbx"] { … }`;
}
```

### Content (L5, refined)

L5 said child elements are *moved* into place. That breaks frameworks: React and Vue remove a child from the parent
they inserted it into, and `host.removeChild(node)` throws once the element has moved the node. So:

- **Children stay where the framework put them.** The element renders its own parts alongside and places
  everything with CSS (`order`, grid areas). Button's icons: `<svg slot="icon">` before the label,
  `slot="icon-right"` after it – a `slot` attribute in light DOM is just a marker the CSS reads.
- **Text is a property, never text children.** React and Vue set `textContent` on an element whose only child is
  text, which erases what the element rendered. Button takes `label`; the React wrapper turns
  `<Button>Save</Button>` into `label="Save"`, so React code doesn't change.
- **Icons inside an element's own structure are data**: an `Element` that's cloned wherever it shows (combobox
  options, data-table column headers and logos). `textColumnIcon()` and friends make them.
- **Cells and other app-drawn content go through a function property**: `renderCell(row, column)` returns a `Node`
  or a string.

### Native controls inside

Where the React component's root was a native control, the element keeps one inside: `<tc-button>` holds a native
`<button>`, so keyboard activation, `disabled` and form submission (`type="submit"`, `name`, `value`) are the
browser's own – it's a real descendant of the form. ARIA attributes set on the host move to the inner control
(`AriaForwardController`), since `aria-label` isn't allowed on a generic host. The host shows focus with
`:has(> .ui-button__hit:focus-visible)`.

### Styles and looks (L6)

`adoptStyles` adds each element type's CSS to `document.adoptedStyleSheets` once (a `<style>` where constructed
sheets aren't supported). `look` is a reflected attribute; unset, it comes from the nearest
`<tc-look-provider look="clean">` (`@lit/context`), else "standard". Theme and forced-colours rules live in
`tokens.css`, which apps load once.

### Values and events (L7)

A value property plus a cancelable `tc-*-change` event: the element applies the change unless a listener calls
`preventDefault()`. That is controlled use: the app prevents, stores the value, passes it back.

```ts
combobox.addEventListener("tc-value-change", (e) => {
  e.preventDefault();          // the app owns the value
  state.who = e.detail.value;  // … and sets combobox.value = state.who on render
});
```

Combobox fires `tc-value-change` ({ value, options }) and `tc-open-change`; Data Table `tc-rows-change`,
`tc-selection-change` and `tc-sort-change`.

### Forms (L8)

`static formAssociated = true` and `ElementInternals`: Combobox sets its form value (one entry per picked value under
`name`), its validity (`required` → `valueMissing`, anchored to the input), restores its first value on reset and
follows a disabled fieldset. A page `<label for="id">` names the input: the element reads `internals.labels` and
points the input's `aria-labelledby` at them; clicking the label focuses the input.

### React (L9)

`trenchcoat/react` (`src/elements/react.ts`) wraps each element with `@lit/react` and keeps the React components'
API: string children as the label, `icon` props as slotted children, `value` / `defaultValue` / `onChange` (and
`open`, `rows`, `selection`, `sort`) with controlled use through `preventDefault()`, `title` on Data Table (the element
calls it `heading`, because `title` is the tooltip attribute).

### No SSR in v1 (L10)

Next.js loads the React wrappers in a client component with `dynamic(…, { ssr: false })` and a sized placeholder;
Nuxt wraps the page in `<ClientOnly>` with a fallback. Both build and run without hydration errors.

### Windowing (L11)

`RowWindowController` (the port of data-table's `useRowWindow`) renders the rows near the viewport above 60 rows and
follows any scroll. Combobox keeps its own list-scroll windowing (its list scrolls inside a popover, not the page);
filter-menu will use the controller (step 2.6).

### Tests (L12)

`tests/elements/*.test.ts` in Vitest browser mode (Playwright: Chromium, Firefox, WebKit), with axe in each file.
Fixtures render with `lit`'s `render` and wait for `updateComplete` (`tests/elements/helpers.ts`).

### Toolchain (L1–L3, L13)

Lit 3.3.3, TypeScript standard decorators (`accessor`), lowered by esbuild (`target: "es2022"` in both Vite configs –
no browser ships decorators yet). ts-lit-plugin in `tsconfig.json`; `npm run check:lit` (lit-analyzer, strict, no
warnings) in CI; `eslint-plugin-lit` and `eslint-plugin-wc`. Tags are `tc-*`. Two analyzer limits found:
`nothing` in attribute bindings reads as a type error (use `ifDefined`), and a binding inside `<colgroup>` reads as
an unclosed tag (Data Table sets column widths on the header cells instead).

### Package

`npm run build:package`: ES modules per element (`dist/`), declarations (`dist/types/`), `custom-elements.json`.
Elements register themselves when their module loads, so element modules are side effects in `package.json` – apps
tree-shake by importing one element's entry (`trenchcoat/button`), not by named imports from the index.

## Acceptance checks

| # | Check | Result |
|---|---|---|
| 1 | Light DOM ARIA: axe and the keyboard contract in 3 browsers; VoiceOver; page `<label for>` | **Pass, except VoiceOver.** 96 browser tests (Chromium, Firefox, WebKit) cover `aria-controls`, `aria-activedescendant`, the grid's active cell, `<label for>` naming, and axe in both looks. **VoiceOver was not run**: computer use gives browsers read-only access, so Claude can't drive Safari with VoiceOver (decision L16 assumed it could). See "Not done" |
| 2 | Content: icons and custom cells from React, Vue, Angular, Svelte and HTML | **Pass**, with the refinement above (children stay in place, text as a property) |
| 3 | Forms: submit, reset, `required`, `FormData`, 3 browsers | **Pass** |
| 4 | Screenshots match React, both looks and themes | **Pass: 12 of 12 cases pixel-identical (0.00 %)** – `node scripts/compare-lit.mjs` |
| 5 | Every example app, typed props and events | **Pass: all 7** (`npm run examples`); the React example type-checks the wrappers (it caught a duplicate `onChange` type). Vue type-checks its template against `trenchcoat/vue` (vue-tsc; a seeded wrong prop type is rejected); `trenchcoat/svelte` is generated the same way but not yet checked with svelte-check; Angular uses `CUSTOM_ELEMENTS_SCHEMA`, which is untyped |
| 6 | Next.js and Nuxt: no hydration errors or layout shift | **Pass** (client-only, sized placeholders) |
| 7 | Performance within 20 % of React | **Pass** – `node scripts/measure-lit.mjs`, Chromium, median of 5: data-table 10k mount 16.8 ms (React 31.7), scroll worst frame 18.1 ms (18.3); combobox 5k open 16.7 ms (16.1, +4 %); button 0.2 ms per instance (0.2) |
| 8 | Size against React | Recorded: Lit runtime 9.3 KB gz once; tc-button 6.0 KB gz (React file 4.8), tc-combobox 13.3 (12.9), tc-data-table 14.6 (15.6). All three with the runtime: 37.0 KB gz |
| 9 | Controlled values from React and Vue | **Pass** in every example (React, Next, Vue, Nuxt, Angular and Svelte prevent and pass the value back; HTML is uncontrolled) |
| 10 | Tests in Vitest browser mode, 3 browsers; axe | **Pass**. One paste test skips in Firefox, which ignores `clipboardData` on synthetic events |
| 11 | ts-lit-plugin / lit-analyzer catch a wrong binding, a misspelled tag, a wrong event type, a missing import | **Pass** (seeded file: all four reported) |
| 12 | Porting effort | The CSS carried over unchanged apart from the root selector; the markup kept its structure; the logic was restructured from hooks into properties, state and controllers. Combobox and Data Table each took one working session including their tests; the tests are the larger share. That puts the remaining 61 components at roughly the plan's 5–7 weeks |

## What the other 61 ports added (step 2.6)

Ported by 12 agents in parallel from [port-brief.md](port-brief.md), one file set per component; the shared lists
(`src/elements/index.ts`, `react.ts`, package entries and exports) are generated from the folder
(`scripts/gen-elements.mjs`, checked in CI). Parity: `node scripts/compare-lit.mjs <slug>` diffs each gallery demo on
React and on the wrappers. What they found:

- **Uncontrolled wrapper values were reset on every parent render.** `@lit/react` sets every prop on every render,
  so passing the starting value back undid the user's change. `useControlled` now keeps the element's own value in
  React state (`tests/elements/react-wrappers.test.ts`, which fails on the old helper). Several ports carry a local
  copy of the same fix (`useOwned` / `useValue`); they can move to the shared helper.
- **Callbacks whose presence showed a control** (`onClose`, `onRemove`, `onOpen`…) become a boolean plus an event
  (`closable` + `tc-close`); the wrapper sets the boolean when the callback is given. **Callbacks that return
  something** (a promise, a render) stay function properties under their React names.
- **Member names that shadow `Element`/`LitElement`** break the element or its decorator types: `remove`, `before`,
  `animate`, `hidden`, `dir`, `renderOptions`. Renamed in each port (`removeStep`, `animated`, `hiddenSegments`…).
- **Form controls:** `name` must reflect (FormData reads the attribute), and `formDisabledCallback` runs while
  `disabled` is reflected inside an update, where Lit drops a property change – set it in a microtask.
- **HotkeyController** no longer binds again when an update lands after the host left the page (a leaked window
  listener).
- **Event names are shared, detail types aren't**: `tc-value-change` and `tc-open-change` carry different details
  on different elements, so no element declares them in `HTMLElementEventMap`; each module exports its detail types.
- **Element ids in cloned SVG** (gradients) get a fresh suffix per clone, or copies point at each other's defs.
- **axe on animated content**: finish entry animations before axe runs, or it measures text mid fade-in.
- **Light-DOM groups**: ToolCallGroup can't wrap the cards a framework renders into it, so outside React it takes
  its list as a `slot="list"` child (the wrapper draws it).

Step 2.7 (illustrations and motion) added three things to the base and the tooling:

- **An end marker in every element.** Lit's range otherwise runs to the end of the host, and a template that
  changes shape (nothing → something) clears children a framework appended after the first render. TcElement
  renders before a `<!--tc-end-->` comment; later children go after it.
- **`static looks = false`** for single-look pieces: no `data-look` on the host, so a Clean look provider doesn't
  restyle the caller's content (the React illustrations and motion pieces had no look).
- **Parity on separate pages** with a seeded `Math.random`: both versions' stylesheets on one page restyled each
  other (decision-inbox 0.38 %, ghosted-chat 1.43 %, both 0 % isolated), and random demos now draw the same data.
- `node scripts/dead-css.mjs` (in CI) fails on rules for classes nothing renders – element, wrapper or
  runtime-built (`ui-x--${n}`) – and `--fix` removes them.

Part 3 (17 new components, built by 9 agents from [new-component-brief.md](new-component-brief.md)) added:

- **Nested elements share event names.** artifact-panel stops its inner code-block's `tc-view-change` at the
  block, so the panel's own listeners only hear the panel. An element that contains another of the same family
  stops the inner one's events or renames them.
- **Windowing inside a scrolling container** (chat-history, sandbox-log): keep the two spacers as fixed elements and
  set `overflow-anchor: none` – WebKit reset the scroll to the top when a spacer was replaced, and Chromium's scroll
  anchoring chased the spacers. Page-scrolled windows (data-table, filter-menu) don't have the problem.
- **A `now` property, read once on connect**, for anything relative to today (chat-history's date groups,
  trigger-builder's next runs) – never at render. It is the one clock read the ratchet allows a new file.
- **A textarea can't be a combobox** (ARIA in HTML): mention-picker leaves its role alone and adds
  `aria-autocomplete`, `aria-controls` and `aria-activedescendant`.
- **The gallery-wide axe scan catches what fixture tests don't**: demo states (a muted hint with a highlighted match,
  a long code block, a tile without alt text) failed in the scan after passing the elements' own axe tests.
- Shared helpers several new elements carry their own copy of, to move into `internal/` next: a roving-tabindex
  toolbar controller (voice-mode, answer-arena, code-block, live-view, context-tray), `initials()`, `copyText()`,
  a token-to-milliseconds reader, a caret-geometry helper, and the fold-away-on-removal ghost.

Known issues carried over from the React components (step 2.8): decision-tree's folded "N options" text fails
contrast in the narrow layout, and its follow-up option buttons fail `label-content-name-mismatch`.

## Not done

- **VoiceOver.** Needs a person (or a session with full control of Safari). The automated checks cover what
  VoiceOver reads – roles, names, `aria-activedescendant` targets, live regions – but not what it announces.
- **Typed Angular templates** – `CUSTOM_ELEMENTS_SCHEMA` accepts any binding; Svelte's generated types aren't
  checked yet.
- **Angular 22** needs Node 24.15+; the example uses Angular 21 on this machine's Node 24.4.
