# Combined remediation plan – design review + bundle and performance

2026-10-25 · Covers what is still open from [design-review/README.md](design-review/README.md) and
[bundle-and-performance-audit.md](bundle-and-performance-audit.md), checked against the code at `5244f1b`.
Planning only – nothing here has been started.

**Direction.** Trenchcoat ships as an npm package that apps install and import, and apps in other frameworks will
use it too, so the components move to **Lit 3 web components** ([lit-spike-plan.md](lit-spike-plan.md)). `src/`
becomes the only source; the generated `components/` folder and its `-clean` copies go away, and the look is
chosen with the `look` property.

**Order.** The work splits in two:

- **Part 1 – work that carries over to Lit unchanged** (CSS, tokens, data and plain TypeScript), done first on the
  current React source, so the port starts from the finished design.
- **Part 2 – the shift to Lit**, which also absorbs everything whose form changes with Lit (the package build,
  the gallery look switch, the CI checks, the demos, the measurements and the verification), so none of it is
  done twice.

## Already done

These were fixed in the code-quality phases and the accessibility/design passes (see CHANGELOG.md):

| Finding | Source | State now |
|---|---|---|
| Gallery entry chunk 7.98 MB (icon packs) | Perf #3 | Icons page and Hugeicons removed; entry chunk ~630 KB |
| Infinite shimmers run off-screen, scale with item count | Perf #1 | fan-out-grid and trace-waterfall sweep on `transform`; endless animations stop after a few cycles and pause off-screen |
| trace-waterfall not windowed | Perf #2 | Rows windowed like data-table |
| combobox / command-menu render every option | Perf #6 | combobox windows above 300 matches; command-menu caps at `maxRows` (200) |
| data-table cliff at 200 rows | Perf #7 | `VIRTUAL_FROM` = 60 |
| rAF loops ignore visibility | Perf #8, #12 | ai-answer idles when caught up; approval-card uses a timeout; context-map, agent-tree and tool-call-card stop off-screen |
| Dev warning fires in production | Perf #9 | Literal `process.env.NODE_ENV`, stripped by bundlers |
| kpi-board / agent-team budgets | Perf #15 | Re-recorded (1 each) |
| Dark mode only works with `.dark` | Design | `light-dark()` everywhere; `.dark`, `data-tc-theme` and the OS setting all work; dark-only colour rules 247 → 0 |
| Pattern drift (buttons, menus, fields, pills, trays) | Design | Pattern tokens per look; Button sizes from control tokens; Standard primary is flat ink |
| Blocks and screens as parallel UI kits | Design | Blocks import library parts; screens dropped their own scale, overrides and `zoom` |
| Literal durations, easings, z-index, weights | Design | 5,836 → 171, 3,227 → 51, 56 → 2, 2,020 → 9; CI ratchet stops them coming back |
| Narrow-width bugs | Design | chat-composer scaling clamped, workspace shells clipped, controls restored below 375 px |
| Dead CSS and identical look pairs | Design | Certain-dead rules deleted, identical pairs collapsed |

## What is still open

"Part" says where each item is done: 1 = carry-over work, 2 = the shift to Lit. Item 16 is split: forced
colours is CSS (Part 1); screen readers, browsers, CPU throttling and framework builds are tested on the Lit
components (Part 2).

| # | Item | Source | Size of the problem | Effort | Part |
|---|---|---|---|---|---|
| 1 | No post-fix measurements; the bench scripts live in the session scratchpad and will be lost | Both | Claimed gains (fan-out-grid 37 % → ?, trace-waterfall 100 % → ?) are unverified | S | 2 |
| 2 | filter-menu renders every option | Perf #6 | 5,000 options: 95 ms mount + 37 ms layout | S | 2 |
| 3 | 8 components still sweep with `background-position` (finite now, but not composited) | Perf #1, #16 | agent-tree, comment-thread, context-window, context-map, dropzone, thinking-state, tool-call-card, writing-assistant | S | 1 |
| 4 | inline-diff caps at 4 M cells and silently becomes one replacement | Perf #13 | Texts over ~1,500 words | M | 1 |
| 5 | Render budgets mix demo timers with component behaviour | Perf #15 | Component regressions can hide behind demo traffic | S | 2 |
| 6 | Not packaged: package.json is `private`, with no `exports`, build or type declarations; `components/` holds a generated copy-paste build with a `-clean` twin per component (4 lines different) | Perf #4 | Two published files per component, each with both looks | M | 2 |
| 7 | Token fallback blocks and inlined helpers in every published file | Perf #5 | 16 % min / 10 % gz per file, plus a copy of `src/internal` in each | Goes away with item 6 | 2 |
| 8 | CSS strings not minified | Perf #14 | 11 % min / 9.5 % gz | Left to the app's bundler; no build change | 2 |
| 9 | Heavy inline data in illustrations | Perf #10 | region-dach 167 KB source, 6 regions shipped for 1 shown; project-flow 4 base64 PNGs | S | 1 |
| 10 | Spacing isn't on a scale | Design (scales) | 2,338 literal padding/gap/margin declarations; `--tc-space-*` used 13 times | L | 1 |
| 11 | Type scale has half-steps (11.5, 12.5, 13.5 px) | Design (scales) | Three extra sizes that exist because old literals were matched, not designed | S | 1 |
| 12 | Remaining literals under the ratchet | Design (scales) | line-height 151, radius 176, blurred shadow 50, duration 171, easing 51 | M | 1 |
| 13 | glass-folder has no `open` prop; app-shell and assistant-home copy its hover styles | Design follow-up | 2 screens | XS | 2 |
| 14 | States no demo shows (stepper-form review/success, ai-workspace projects, client-context empty/create, decision-tree sub-questions) | Design follow-up | CSS nobody has looked at; can't tell dead from live | M | 2 |
| 15 | Design judgement calls | Design + WCAG | breakdown-chart palette (1.6–2.5:1), fan-out-grid and agent-queue 12 px targets, date-range band (< 3:1), context-map colour-only tiles | S | 1 |
| 16 | Not tested | Both | Screen readers (VoiceOver, NVDA); forced colours (0 `forced-colors` rules); Safari and Firefox; throttled CPU / INP; webpack and Next.js builds | M | 1 + 2 |

## Plan

Each step is one commit (or a few), with `npm run ci` green before the next starts.

## Part 1 – Work that carries over to Lit unchanged

Done on the current React source. Changes go into `src/` (and the hand-written libraries) and are rebuilt into
`components/` with `npm run build:lib`, exactly as today; the CI checks are unchanged. Everything here is CSS,
tokens, data or plain TypeScript, so it moves to Lit as is.

### 1.1 Type scale (decision B: round down)

Fold 11.5 → 11, 12.5 → 12 and 13.5 → 13 px in both looks, then remove `--tc-font-size-xs-plus`, `-sm-plus` and
`-md-plus` from tokens.css. Check the WCAG audit's minimum text sizes and the contrast check still pass at the
smaller sizes, and let the visual snapshots show the diff before committing.

### 1.2 Spacing

Adopt `--tc-space-*` for padding, gap and margin (2,338 literal declarations, 13 token uses today). Do it
mechanically like the duration pass: snap literals within ±1 px to the 4 px ladder (2 px half-step allowed), leave
the rest literal and count them in the ratchet. Run per library, screenshot before/after at 1280 / 768 / 375, review
diffs over a threshold by hand.

### 1.3 Remaining literals

Line-height onto the type tokens (most are paired with a font size), radius onto `--tc-radius-*` and the pattern
radii, the 50 blurred shadows onto `shadow-raised` / `shadow-overlay`. Lower the ratchet baseline after each.

### 1.4 Decision C (as recommended)

- breakdown-chart: a segment palette at ≥ 3:1 against the background in both themes, with pattern fills or
  separators so neighbouring segments don't rely on colour alone;
- fan-out-grid cells and agent-queue backlog squares: 24 px hit areas (padding or a pseudo-element; the visible
  square stays 12 px);
- date-range-picker: an in-range band at ≥ 3:1 against the calendar background in both looks and themes;
- context-map: no change.

Re-run `npm run check:contrast` and the axe scan after each.

### 1.5 Shimmers on `transform`

The 8 remaining `background-position` sweeps (agent-tree, comment-thread, context-window, context-map, dropzone,
thinking-state, tool-call-card, writing-assistant) → the `transform: translateX` pseudo-element used in
fan-out-grid. Add a ratchet count for `background-position` in keyframes so it stays at 0.

### 1.6 inline-diff: Myers diff

Replace the capped LCS table with Myers O(ND), so long texts stay word-by-word and the diff is cheaper at 1,000
words. It's a plain function (`diffWords`), so it moves to Lit unchanged; its regression tests cover the output.

### 1.7 Illustration size

region-dach: one module per region (loaded on demand) plus simplified neighbour outlines (−60–80 %). project-flow:
the 4 base64 PNG avatars and the logo → inline SVG or separate files (~−35 KB gz).

### 1.8 Forced colours

Test `forced-colors: active` (Windows High Contrast, or Chromium's emulation) on the pattern components first –
Button, fields, menus, switches, segmented control, focus rings – then the rest; add `forced-colors` rules where
borders, state or focus disappear. These rules are CSS and move to Lit unchanged; the Lit components are re-checked
in 2.8.

## Part 2 – The shift to Lit

Details of the toolchain (Lit 3, TypeScript with standard decorators, ts-lit-plugin in the editor, lit-analyzer in
CI) and of the spike are in [lit-spike-plan.md](lit-spike-plan.md). Everything whose form changes with Lit is done
here.

### 2.1 React baseline measurements

Move the perf bench from the session scratchpad into `scripts/perf/` (it will otherwise be lost) and record the
React numbers the spike and the port are compared against: per-component size, data-table at 10,000 rows, combobox
at 5,000 options, fan-out-grid and trace-waterfall CPU at 1,000 / 5,000 items, off-screen animation count, mount
time per instance. This replaces the earlier draft's re-measurement step; React render budgets without demo timers are
dropped (Lit has its own update cycle – see 2.7).

### 2.2 The spike

Port Button, Combobox and Data Table and answer the 12 questions in the spike plan (shadow or light DOM, content
projection, forms, styles and looks, framework use, server rendering, performance, size, value properties,
testing, typed templates, porting effort). 5 days. Its results set the decisions the rest of Part 2 follows.

### 2.3 One source, no `components/`

- Move the one component that exists only in `components/` – `components/plan-vs-actual-clean.tsx`, hand-written
  and Clean only – to `src/components/plan-vs-actual.tsx`.
- Point `@components/*` (vite.config.ts `LIBS`, tsconfig.json `paths`; 65 demo and 66 test files) and the
  `@/components/ui/*` resolver (26 block, screen and illustration files) at `src/components/`.
- Gallery: `app/src/registry.ts` reads `src/components/`; the components README moves to `src/components/README.md`
  with one entry per component.
- Tests run each spec against the one source in both looks instead of loading `<slug>.tsx` and `<slug>-clean.tsx`.
- Delete `components/`, `scripts/build-lib.mjs`, `check:lib` and its CI step. CHANGELOG: breaking – the `-clean`
  files are gone.

Done at the start of the port, so React and Lit components can sit side by side in `src/` while the port runs.

### 2.4 Foundations

- The toolchain from the spike: Lit 3, TypeScript standard decorators, ts-lit-plugin, lit-analyzer and the Lit
  ESLint rules in `npm run ci`, `@custom-elements-manifest/analyzer`.
- The `src/internal` helpers as reactive controllers (value properties, root ref, hotkeys, on-screen, focus rescue,
  smooth height, the row window).
- An app-wide default look with `@lit/context` (in place of the planned React provider).
- The CI checks (ratchet, tokens, prefixes, contrast) read CSS from Lit's `` css`…` `` templates as well as the
  React `/* css */` strings, so they hold during the port and after it.
- **The package build:** Vite library mode, one module per element, type declarations, `custom-elements.json`, the
  React integration chosen in the spike (native elements or `@lit/react`), `tokens.css` as the one stylesheet apps
  import. package.json: drop `private`, `exports` for the components, blocks, screens, illustrations, motion and
  `tokens.css`, `"sideEffects": ["*.css"]`, a `files` list. A CI step builds the gallery against the package so a
  broken export fails before publishing.

### 2.5 Gallery look switch

Rework the existing Standard / Clean / Both switch (`app/src/App.tsx`), which picks files today, to set the `look`
property on the demo's element; Both renders the same element twice. It's remembered per viewer, applies only to
entries with both looks, and a deep link can carry `?look=clean`. The overview lists each component once.

### 2.6 Port the components

The 64 components, simplest first, then menus and fields, then the large agent views. With each component: its
tests rewritten for the new harness, its demo moved to the element, the axe scan, and a screenshot diff against the
React version. Folded into the port:

- **filter-menu windowing** – written in Lit with the windowing approach the spike picked (`@lit-labs/virtualizer`
  or the row-window controller), above ~300 options.
- **glass-folder `open` property** (illustrations) – app-shell and assistant-home use it instead of copying its
  hover classes.

### 2.7 Blocks, screens, illustrations and motion; demos; measurements

- Decide (from the spike) whether blocks and screens become web components or stay React on top of the elements;
  port illustrations and motion either way, or keep them React if they stay app-level only.
- **Demo paths for the unseen states** (stepper-form review/success, ai-workspace projects, client-context
  empty/create, decision-tree sub-questions), then a runtime "selector never matched" pass across all demos and
  delete what stays unmatched.
- Re-run the perf bench against the Lit package and compare with the 2.1 baseline; add a Lit update-count budget
  per component (static props, no demo timers) in place of the React render budgets.

### 2.8 Verification

- Axe in light and dark, both looks, every element, in Chromium, Firefox and WebKit.
- Forced colours re-checked on the elements (the 1.8 rules, now inside shadow roots if the spike chose them).
- Screen readers: VoiceOver (Safari) and NVDA (Firefox) on the components with live regions and custom keyboard
  patterns – toaster, combobox, command-menu, data-table, date-range-picker, agent-tree, review-center.
- The perf bench in Firefox and WebKit and with 4× CPU throttling; INP for combobox open, command-menu typing,
  data-table sort.
- `npm pack` into sample apps – React 19, Vue 3, Angular, Svelte 5, plain HTML, Next.js and Nuxt (webpack and Vite
  builds): tree-shaking, `tokens.css`, server rendering, types and events.

## Decisions (2026-10-25)

| | Question | Decision |
|---|---|---|
| A | How do the looks ship? | **Revised: one npm package, one module per component carrying both looks, chosen with the `look` property.** `src/` is the only source; `components/` and the `-clean` copies are deleted; the gallery gets a look switch. (Was: single-look files – that suited copy-paste files, not a package.) |
| D | What is the component layer? | **Lit 3 web components**, in TypeScript with standard decorators, ts-lit-plugin in the editor and lit-analyzer in CI, subject to the spike (Part 2.2). Stencil was compared and dropped. |
| E | In what order? | **Carry-over work first (Part 1), then the shift to Lit (Part 2)**, which absorbs everything whose form changes with Lit. |
| B | Which way do the half-step font sizes fold? | **Round down:** 11.5 → 11, 12.5 → 12, 13.5 → 13 px, in both looks |
| C | The judgement calls in item 15 | **As recommended:** fix breakdown-chart's palette, the fan-out-grid and agent-queue targets and the date-range band; keep context-map's tiles as they are (name and kind are in the hover/focus card) |

## Order and rough size

| Step | Depends on | Effort |
|---|---|---|
| **Part 1** | | |
| 1.1 Type scale | – | 0.5 day |
| 1.2 Spacing | 1.1 (same files, same screenshots) | 2 days |
| 1.3 Remaining literals | 1.1 | 1 day |
| 1.4 Decision C | – | 1 day |
| 1.5 Shimmers | – | 0.5 day |
| 1.6 Myers diff | – | 1 day |
| 1.7 Illustration size | – | 0.5 day |
| 1.8 Forced colours | 1.4 | 1 day |
| **Part 2** | Part 1 | |
| 2.1 Baseline | – | 0.5 day |
| 2.2 Spike | 2.1 | 5 days |
| 2.3 One source | 2.2 (go) | 1 day |
| 2.4 Foundations | 2.2, 2.3 | 3–4 days |
| 2.5 Look switch | 2.4 | 0.5 day |
| 2.6 Port components | 2.4 | 5–7 weeks, with tests |
| 2.7 Blocks, demos, measurements | 2.6 | 1–2 weeks |
| 2.8 Verification | 2.6, 2.7 | 3–5 days, partly manual |

Part 1 is about 7–8 days; 1.4–1.7 touch different files from 1.1–1.3 and can run alongside them. 2.1 can run during
Part 1 (it only measures). Part 2 is the 6–10 weeks estimated in the spike plan, refined by the spike. If the spike
is a no-go, Part 2 becomes the React package plan instead (2.3 and 2.5 as written, a React package build in place of
2.4, and 2.6 dropped).
