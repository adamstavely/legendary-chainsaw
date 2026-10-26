# Building a new component – the brief for Part 3

Part 3 adds 17 components, built directly as Lit 3 elements (remediation plan, Part 3). There is no React original:
the spec is the plan's one-line description, the README line already in `src/components/README.md`, and the
design language of the 101 elements already in `src/elements/`. Several components are built at once in this
checkout, so each touches only its own files.

## Read first

- `audit/lit-patterns.md` – the element patterns, and "What the other 61 ports added" (wrapper helpers, member names
  that shadow `Element`, form controls, events, cloned SVG ids, axe after animations, the end marker).
- `audit/port-brief.md` – the per-component recipe (sections "Per component" 1–4 and 8 apply as written; there is
  no parity step and nothing to retire).
- **The components yours builds on** (the plan's "Builds on" column, repeated in your task): read their element
  files closely and reuse their structure, CSS patterns, tokens, icons and interaction details. A new component
  should look like it was always part of the set.
- `tokens/tokens.css` – the tokens: pattern tokens per look (trays, cards, controls, menus, pills, fields), the
  spacing, type, radius, duration and easing scales, status colours, `light-dark()` colours. Use tokens for every
  value; the ratchet (`node scripts/check-ratchet.mjs`) fails a new file on any literal spacing, duration, easing,
  radius, line-height, blurred shadow or font weight, and on clock reads at render.

## What every component needs

1. **Element** `src/elements/<slug>.ts`, tag `tc-<slug>`, extending TcElement. Both looks, Standard and Clean,
   following the sibling components: Standard has the gray tray around a white card where its siblings do; Clean is
   one white card with hairline shadows, quieter text and thinner icons. Light, dark and system themes through the
   tokens (no `.dark` rules). Keyboard support and ARIA from the matching WAI-ARIA pattern (listbox, grid, tree,
   tabs, dialog, toolbar, feed, slider…). `prefers-reduced-motion` turns motion off. Forced colours work through
   tokens.css's rules (controls need real roles). Value properties with cancelable `tc-*-change` events; actions as
   events; callbacks that return something as function properties (lit-patterns.md). Long lists windowed with
   `RowWindowController` where the plan says so. Off-screen animation paused with `OffScreenController`.
   Clean-up of timers and listeners on disconnect. Text as properties; icons as cloned Elements.
2. **React wrapper** `src/elements/react/<slug>.ts` with an idiomatic React API (camelCase props, `onX` callbacks,
   `value` / `defaultValue` / `onChange` through `useControlled`, React-node icons through `useStaged`), then
   `node scripts/gen-elements.mjs`.
3. **Tests** `tests/elements/<slug>.test.ts`: the host and both looks; every property and event; controlled use
   with `preventDefault()`; the keyboard pattern; focus management (removed items, dialogs); windowing if any; the
   wrapper (a value survives a parent re-render; callbacks fire); axe in both looks and both themes, after
   animations finish. Run: `npx vitest run --project elements tests/elements/<slug>.test.ts`.
4. **Gallery demo** `app/src/demos/<slug>.tsx`, typed against `../../../src/elements/react` (see any ported demo,
   e.g. `app/src/demos/change-summary.tsx`, and `app/src/demo-kit.ts`). Realistic sample data in the product's voice;
   show the component alive – streaming, ticking, its main states reachable within a few seconds or a click –
   without timers that run forever when nothing changes. The README line and the gallery category are already in
   place; don't edit them.
5. **Look at it.** Start your own gallery server (`npx vite --port <unique port 5400–5499> --strictPort`) and
   screenshot your entry in both looks and both themes: `VISUAL_PORT=<another unique port> node scripts/visual.mjs
   capture new-<slug> <slug>` writes PNGs to `.visual/new-<slug>/`. Read the PNGs next to the sibling components'
   screenshots (capture those too) and fix what doesn't match: spacing rhythm, type sizes, icon weight, radii,
   colours, alignment, empty and narrow states (check 320 px wide too). Iterate until it looks native.
6. **Checks on your files**: `npx tsc -p tsconfig.json --noEmit` (your files), `npx eslint <your files>`,
   `npx lit-analyzer src/elements/<slug>.ts --strict`, `node scripts/check-prefixes.mjs`,
   `node scripts/check-tokens.mjs`, `node scripts/check-ratchet.mjs` (your new files must show no counts – there is
   no React baseline to inherit), `node scripts/dead-css.mjs`, and the gallery smoke test:
   `npx vitest run --project react tests/smoke.test.tsx -t "<slug>"`.

## Rules

- Touch only: `src/elements/<slug>.ts`, `src/elements/react/<slug>.ts`, `tests/elements/<slug>.test.ts`,
  `app/src/demos/<slug>.tsx`, plus the two generated files via the script. A component may use another element
  (`tc-code-block` inside `tc-artifact-panel`) by importing its module.
- Don't edit shared files (`internal/*`, `react/internal.ts`, configs, `package.json`, the registry, the README,
  tokens, other components). A helper you need goes in your element file; if it should be shared, say so in the
  report. If a token is missing, use the nearest existing one and say which token you'd add.
- No git commands. Never touch `icon-composer/` or anything outside `trenchcoat/`.
- Scratch scripts go in a folder named after your components inside the scratchpad (other agents share it).

## Report (your final message)

Per component: done or not; test count; the API in a few lines (properties, events, wrapper props); the keyboard
pattern; screenshots you checked and what you changed after looking; anything uncertain, any token or shared helper
you'd add. Short.
