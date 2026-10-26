# Porting a component to Lit – the brief for step 2.6

Each React component in `src/components/<slug>.tsx` becomes a Lit 3 element in `src/elements/<slug>.ts`, with a
React wrapper that keeps the React component's API. Several ports run at once in this checkout, so every port
touches only its own files.

## Read first

- `audit/lit-patterns.md` – the settled patterns (light DOM, host is the root, text as properties, icons as data,
  cancelable `tc-*-change` events, forms, wrappers, tests).
- The worked example, a whole port: `src/elements/change-summary.ts`, `src/elements/react/change-summary.ts`,
  `tests/elements/change-summary.test.ts`, and the type imports at the top of `app/src/demos/change-summary.tsx`.
  Its React original is in git: `git show d9f8dd4^:trenchcoat/src/components/change-summary.tsx`.
- Interactive examples: `src/elements/combobox.ts` (popover, keyboard, form value, controlled value) and
  `src/elements/data-table.ts` (grid keyboard, windowing, edit events), with `src/elements/react/combobox.ts` and
  `src/elements/react/data-table.ts`.
- The shared pieces: `src/elements/internal/base.ts` (TcElement), `internal/controllers.ts` (OffScreen,
  AriaForward, RowWindow, FocusRescue + `rescueFocus`, SmoothHeight, Hotkey, OnScreen, Rolling),
  `internal/look.ts`, and `src/elements/react/internal.ts` (`h`, `useStaged`, `useControlled`, `isNode`).

## Per component

1. **Element** `src/elements/<slug>.ts`: `class Tc<Name> extends TcElement`, `static override ui = "<root class
   without ui->"`, `static override css` = the React file's CSS with only the root selector rewritten:
   `.ui-x(?![\w-])` → `[data-ui="x"]` (a regex over the whole CSS string; nothing else changes). Keep the markup and
   class names, so the CSS applies unchanged. Both looks from `this.resolvedLook`. Register with
   `if (!customElements.get("tc-<slug>")) customElements.define(…)` plus the `HTMLElementTagNameMap` entry.
   - Standard decorators with `accessor`; `@property({ attribute: false })` for arrays, objects, functions and
     Elements; `@state` for internal state. JSDoc `@tag`, `@fires <name> - <what>` (detail type in the text),
     `@slot` if any; mark internal members `@internal` (the manifest lists public members only).
   - Text is a property, never text children. Icons, logos and avatars given as React nodes become `Element`
     properties that the element clones; images given as URLs stay strings.
   - A React `title` prop (the heading) becomes `heading` on the element; the wrapper maps `title` → `heading`.
   - A value the user changes: a value property plus a cancelable `tc-<value>-change` event (`this.emit(name,
     detail, { cancelable: true })`); apply the change only if not prevented. Actions (approve, dismiss, send):
     non-cancelable `tc-<action>` events with the payload in `detail`. A callback that must return something
     (a render function, a filter, an async submit) stays a function property.
   - A React root that was `section aria-label` / `nav` / `form` …: give the host the role and name (see
     change-summary). A native control at the root: keep one inside (see button).
   - Timers, observers and listeners: start in `connectedCallback`/`firstUpdated`, clear in
     `disconnectedCallback`. Pause continuous animation off-screen with `OffScreenController`. Keyboard shortcuts
     with `HotkeyController`. Long lists (> 60 rows) with `RowWindowController`. Focus that would fall to `<body>`
     when an item is removed: `FocusRescueController`. Don't read the clock at render time.
   - lit-analyzer limits: use `ifDefined(x)` in attribute bindings, not `nothing`; no bindings inside `<colgroup>`.
     SVG children inside an `html` `<svg>` go in `svg\`…\`` templates.
   - Exported type names must not collide with other elements' exports (`src/elements/index.ts` re-exports every
     module with `export *`): give generic names the component's prefix (`ExperimentVariant`, not `Variant`).
2. **React wrapper** `src/elements/react/<slug>.ts` with `createComponent` from `@lit/react`: the same export
   names, props and callback signatures as the React component (the gallery demo and the blocks use them unchanged),
   controlled values through `useControlled`, React-node icons through `useStaged`. Re-export the types the demo and
   the React module exported (`export type { … }`), under the React module's names.
3. Run `node scripts/gen-elements.mjs` – it regenerates `src/elements/index.ts` and `src/elements/react.ts` from the
   folder. Never edit those two by hand.
4. **Tests** `tests/elements/<slug>.test.ts` (Vitest browser mode, Chromium/Firefox/WebKit; helpers in
   `tests/elements/helpers.ts`): the host and look; every check in the component's
   `tests/contract/<slug>.contract.tsx` and `tests/regressions/<slug>.test.tsx`, ported (same behaviour, as
   browser tests); the keyboard contract; events and controlled use (`preventDefault`); axe in both looks (copy the
   axe test from change-summary). Run: `npx vitest run --project elements tests/elements/<slug>.test.ts`.
5. **Parity**: `node scripts/compare-lit.mjs <slug>` renders the gallery demo on the React module and on your
   wrappers, both looks and both themes, and diffs them. Target: every case under 1 %. Look at the PNGs in
   `.visual/lit-compare/` (`<slug>-<look>-<theme>-{react,lit,diff}.png`) – check both sides rendered something. If a
   case can't reach 1 % for a reason that isn't a bug (a random or clock-driven demo), say so in your report.
6. **Gallery smoke test**: `npx vitest run --project react tests/smoke.test.tsx -t "<slug>"` (the demo on the
   wrappers in jsdom: no errors, no leftover timers, commit budget).
7. **Retire the React version** – except for these, which blocks and screens still import and which stay as they
   are: agent-plan, approval-card, chat-composer, filter-menu, inline-diff, kpi-chart, segmented-control,
   setup-guide, thinking-loader, thinking-state, tool-call-card, usage-meter. For every other component, once 4–6
   pass: delete `src/components/<slug>.tsx`, `tests/contract/<slug>.contract.tsx` and
   `tests/regressions/<slug>.test.tsx` with plain `rm` (no git commands), and point the demo's type imports
   (`@components/<slug>`) at `../../../src/elements/react`, as change-summary's demo does. Remove the slug's entries
   from `tests/a11y-known.ts` and `tests/known-issues.ts` if it has any. Leave `src/components/README.md`
   alone (the gallery reads it).
8. **Checks on your files**: `npx tsc -p tsconfig.json --noEmit` (fix errors in your files; ignore errors in files
   another port is writing right now), `npx eslint <your files>`, `npx lit-analyzer src/elements/<slug>.ts --strict`,
   `node scripts/check-prefixes.mjs`, `node scripts/check-tokens.mjs`. `node scripts/check-ratchet.mjs` may report
   your new element file (the CSS moved from the React file): fine when its counts aren't above the React file's –
   never run it with `--update`.

## Rules

- Touch only: `src/elements/<slug>.ts`, `src/elements/react/<slug>.ts`, `tests/elements/<slug>.test.ts`,
  `app/src/demos/<slug>.tsx` (type imports only, unless a demo change is unavoidable – say why), and the deletions
  in step 7. Plus the two generated files via the script.
- Don't edit shared files (`internal/*`, `react/internal.ts`, configs, `package.json`, the registry, the compare
  page, other components). If a port needs a change to a shared file, a new controller or a helper, put it inside
  your element file and say so in the report.
- No git commands (commits and staging happen after all ports). Never touch the `icon-composer/` directory or
  anything outside `trenchcoat/`.
- Ports run in this order: the smaller components first, so a problem shows early.

## Report (your final message)

Per component: done or not; parity per case; test count; API differences from the React component (there should
be none on the wrapper); shared-file changes you needed; anything left undone or uncertain. Keep it short.
