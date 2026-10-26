# Design review – themes and widths

How each look holds up in dark mode and at narrow widths. This is a review only: nothing in the libraries was changed.

`<scratch>` = `/private/tmp/claude-501/-Users-adamstavely-Lockin-resolve/79595907-1212-49ec-9fe0-d84778023bc8/scratchpad/design/themes`
(scripts: `capture.mjs`, `scheme.mjs`, `analyze.mjs`, `hardcoded.mjs`, `cq.mjs`; screenshots `out/shots/`, `out/scheme/`; crops and contact sheets `crops/`, `sheets/`).
Contrast ratios are out of scope; see `audit/WCAG-2.2-AA-audit.md`.

## Verdict

- **Dark mode works only when it is switched with a `.dark` class or `[data-theme="dark"]`.** Most colours resolve through `light-dark()` and follow `color-scheme`, but **37 files** also carry hard-coded `:where(.dark, [data-theme="dark"]) …` overrides. Those overrides do not apply when dark comes from `color-scheme`: tokens.css's own `data-tc-theme="dark"` / `"system"`, or a consumer's `:root { color-scheme: light dark }`. With `color-scheme`, task-board, decision-inbox, ai-workspace and 11 illustrations render half-light (21–61% of pixels differ). Also, nothing reacts to the OS preference unless the consumer opts in, and the gallery has **no theme toggle** at all.
- **In `.dark` mode the components themselves look good.** Surfaces, borders and text adapt in both looks. The real visual failures are in a few illustrations (project-flow, voice-orb) and one elevation case (agent-queue). There is also drift: about 12 dark greys in use that are not on the scale, and per-component surface tokens that skip the semantic surfaces.
- **Narrow widths mostly hold up.** I checked 187 stages at 768/375/320 px. **131 are clean at every width** and the rest are mostly ellipsis truncation. Six stages have High issues: chat-composer (Standard) shrinks its type and targets with width; email-draft (Standard) and smart-recommendation (Clean) overflow at 320; the two workspace app shells park closed panels off-canvas, which adds 46–384 px of horizontal scroll. The looks also handle narrow widths differently: 14 components have container queries only in Clean, and 4 use viewport `@media` in one look and `@container` in the other.

## Method

- **Dark (desktop):** I re-inspected every `.visual/p4-final/*__dark.png` against its light pair (contact sheets in `<scratch>/sheets/`). I counted bright pixels per dark screenshot (`bright.mjs`) and ran a computed-style crawl of every element in light and dark at 1280 px (`capture.mjs` → `analyze.mjs`). The crawl flags opaque surfaces with luminance > 0.45 in dark, text whose ratio to its effective background is < 1.6, unchanged borders that drop below 1.12:1, opaque surfaces whose separation from their parent goes from ≥ 1.1 in light to < 1.1 in dark, and SVG fills that stay light. Every flag was triaged against screenshots: inverted primary buttons and `background-clip:text` were false positives. I also grepped colour literals that bypass `var()`/`light-dark()` (`hardcoded.mjs`).
- **Theme switch:** `scheme.mjs` captures every stage at 768 px four ways and pixel-diffs each against the `.dark` reference:
  - (a) `.dark` class (reference)
  - (b) `color-scheme: dark`, which is what `data-tc-theme="dark"` does
  - (c) `color-scheme: light dark` with the OS set to dark, which is what `data-tc-theme="system"` does
  - (d) OS dark only, with nothing set
- **Widths:** `capture.mjs` copies the visual.mjs setup (fake clock, seeded `Math.random`, reduced motion, 2.5 s settle) and adds a viewport option. It hides the gallery chrome and makes the stage follow the viewport: a 16 px gutter, no max-height, and both looks stacked. Every entry is shot at 768 and 375 px, and components also at 320 px, in light and dark: **952 screenshots**. For each stage it records:
  - `scrollWidth > clientWidth` on the stage
  - every element that crosses the stage edge, or a clipping ancestor (classified as *scrolls* / *clipped* / *stage*)
  - text clipped with or without an ellipsis, and whether a `title`/`aria-label` gives the full text
  - text-on-text overlap
  - visible interactive controls compared with the 1280 px reference, by accessible name
- Container/media queries per look were extracted with `cq.mjs`.
- Caveat: other agents were editing `blocks/` while this ran. Nine entries crashed their page on the first pass and were re-captured one by one.

## Findings – High

### H1. Dark set through `color-scheme` (`data-tc-theme`, "system", the OS) leaves `.dark`-only overrides unapplied
- **Evidence:** 37 files contain `:where(.dark, [data-theme="dark"]) <selector> { … }` rules with literal colours. The biggest are `blocks/ai-workspace.tsx` (36), `blocks/task-board.tsx` (27), `illustrations/integration-flow.tsx` (18), `illustrations/empty-calendar.tsx` (10), `agent-inbox` (9), `permission-request`, `agent-lanes` (7) and `decision-inbox` (4).
- **Measured** (% of pixels differing from the `.dark` render, `<scratch>/out/scheme/report-*.json`):

  | Entry | % differing |
  |---|---|
  | integration-flow | 60.6 |
  | tab-overload | 53.7 |
  | integration-grid | 36.2 |
  | region-dach | 30.3 |
  | empty-calendar | 26.6 |
  | task-board | 21.7 |
  | world-map | 21.1 |
  | lead-sourcing | 18.3 |
  | glass-folder | 16.8 |
  | glow-keyboard | 12.3 |
  | outreach-branches | 9.2 |
  | ai-workspace | 6.9 |
  | enrichment-orbit | 3.9 |
  | decision-inbox | 2.6 |
  | change-summary | 1.3 |
  | agent-lanes | 1.2 |

  "system" (c) gives identical numbers.
- **Visible result:**
  - task-board: a white header bar and white-ringed cards on a dark board (`<scratch>/crops/blocks~task-board__task-board__dark-class-vs-color-scheme.png`).
  - decision-inbox Standard: the secondary buttons "Hold / Ask for more / Edit first" turn **white with white labels**, so their text disappears (`<scratch>/crops/decision-inbox__decision-inbox__dark-class-vs-color-scheme.png`).
  - Illustrations stay in their light art: `crops/illustrations~integration-flow…`, `crops/illustrations~tab-overload…`.
- **Why it matters:** tokens.css documents `data-tc-theme="dark"` and `"system"` as the way to switch (tokens.css:15–17, :333–335). Each component's own rule only matches `.dark, [data-theme="dark"]` (e.g. `components/button.tsx:253`). A consumer who follows the token docs gets broken screens.
- **Fix:** convert each `.dark`-scoped override into a `light-dark()` value on the light rule, or on a component token (`--tc-task-board-search-bg: light-dark(#f5f5f5, #2a2a2d)`). The decision-inbox reference is already on the page: `email-draft`'s `--tc-email-draft-primary-*: light-dark(…)` (src/components/email-draft.tsx:581). Until that is done, add `[data-tc-theme="dark"]` to every `:where(.dark, [data-theme="dark"])` selector. Add a CI check in `check-tokens.mjs` that fails on new `.dark`-descendant colour rules.

### H2. Standard chat-composer shrinks type and targets with its width
- **Cause:** `--u: min(calc(100cqw / var(--tc-chat-composer-span, 1900)), 0.27px)` (src/components/chat-composer.tsx:1706) scales every size from the container width.
- **Measured** with `<scratch>/fs.mjs`:

  | Where | Width | Input text | Send button |
  |---|---|---|---|
  | chat-composer | 768 | 19.8 px | 30 px |
  | chat-composer | 375 | 13.2 px | 20 px |
  | chat-composer | 320 | 11.1 px | 17 px |
  | ai-workspace | 375 | 11.3 px | 17 px |
  | ai-workspace | 320 | 9.2 px | 14 px |

  Clean stays at 13 px / 28 px at every width (`<scratch>/crops/sheet-f.png`, `<scratch>/out/shots/blocks~ai-workspace__ai-workspace__light__w375.png`).
- Text under 16 px in an input also makes iOS zoom on focus.
- **Fix:** clamp the scale (`--u: clamp(0.2px, …, 0.27px)`) and give text and buttons `max()` floors: font ≥ `var(--tc-font-size-md)`, send button ≥ 28 px. Better still, switch to the Clean approach: fixed sizes plus `@container (max-width: 400px)`.

### H3. The workspace app shells add horizontal scroll at phone/tablet widths
- **app-shell-workspace-flat:** the stage scrolls **+343 px at 375** and **+384 px at 768**. The closed workspace `aside.ui-as-panel` sits at x = 399–718, and the sidebar header sits at x = −44 (probe output). The panels are moved off-canvas but nothing clips them.
- **app-shell-workspace:** +46 px at 375 and 768; the runs table's "Started" column is cut at the edge (`<scratch>/crops/sheet-e.png`).
- **Fix:** add `overflow: clip` on `.ui-as` (the shell root), or hide closed panels with `visibility:hidden` plus a transform. The other screens collapse the sidebar to a toggle correctly and are the reference.

### H4. Email-draft (Standard) and smart-recommendation (Clean) overflow at 320 px
- **email-draft Standard @320:** the root is 320 px wide in a 288 px content box (+16 px past the stage). The amount and "Send email" are cut (`<scratch>/crops/sheet-b.png`). The Standard look narrows through `@media (max-width: 480px)` (email-draft.tsx:1246), which follows the viewport rather than the card. The Clean look uses `@container (max-width: 440/380px)` and fits.
  - **Fix:** port the Clean container queries to Standard and drop the media query.
- **smart-recommendation Clean @320:** "Accept incremental sync" runs 5 px past the card edge, because `.ui-sr__actions` is `display:flex` with no wrap (smart-recommendation.tsx:595).
  - **Fix:** add `flex-wrap: wrap`, and let the primary button take `flex: 1 1 auto` below 340 px.

### H5. Illustrations that don't adapt to dark
- **project-flow:** 26 opaque surfaces keep their light colours (`#ffffff` cards, `#fdf7e8` pills) and the backdrop becomes a grey vignette. In dark it reads as a broken light image (`.visual/p4-final/illustrations~project-flow__project-flow__dark.png`).
  - **Fix:** move the 41 literal colours in `illustrations/project-flow.tsx` to `light-dark()`, using `--tc-surface-raised` and `--tc-border-default`. The reference is `illustrations/layer-stack.tsx`.
- **voice-orb:** the canvas reads its ink colour once at mount and then only every 30 frames. With reduced motion the loop does not run (voice-orb.tsx:199–206, :317–322), so after a live theme switch the orb stays near-black on the dark page (`<scratch>/crops/voice-orb__light-vs-dark.png`).
  - **Fix:** call `readColors()` from a `MutationObserver` on `class`/`data-theme` on `<html>` plus `matchMedia('(prefers-color-scheme: dark)').onchange`, then redraw the still frame.

## Findings – Medium

### M1. No working path to OS dark mode, and the gallery can't show dark at all
- **OS dark:** with OS dark and nothing set, component renders differ from `.dark` by a **median 47.8%**, so nothing follows `prefers-color-scheme`. No file in the libraries contains `prefers-color-scheme`.
  - tokens.css offers `data-tc-theme="system"`, but per H1 it misses the `.dark`-only rules.
  - A single copied file without tokens.css only knows `.dark` / `[data-theme]`.
- **Gallery:** it has no theme toggle (`app/src/App.tsx` has none, and `app/src/styles.css` hard-codes `--stage:#fafaf9`). Dark only exists inside `scripts/visual.mjs`, which adds `.dark` plus an inline `#0e0e10` background.
- **Fix:**
  - Add a Light / Dark / System segmented control next to Standard/Clean in the topbar. It should set `data-tc-theme` on each `.stage`, so the gallery exercises the documented mechanism.
  - Document `:root { color-scheme: light dark }` as the single-file opt-in.
  - Add `[data-tc-theme="dark"]` (dark) and `[data-tc-theme="system"]` (`light dark`) to the per-file theme rule that the build inlines.

### M2. Dark surface greys drift off the scale
- **Measured:** opaque dark backgrounds ≥ 1500 px² in the 1280 px crawl.

  | Look | On-scale | Off-scale |
  |---|---|---|
  | Standard | `#19191b` (149 elements), `#111113` (54), `#232326` (27) | `#2a2a2d` ×13, `#222225` ×11, `#1f1f22` ×10, `#1d1d20` ×10, `#2a2a2e`, `#29292d`, `#2c2c30`, `#1a1a1c` |
  | Clean | `#1c1c1e` (199), `#252527` | `#212123`, `#161618`, plus the **Standard** `#19191b`/`#232326` |
  | Blocks/screens/illustrations | — | add `#1d1d20`, `#2f2f33`, `#2e2e33`, `#313135`, `#1c1c1f` |

- **In source:**
  - `#2a2a2e` (= `--tc-zinc-800`, which is the dark **border** colour) is used **162 times in 34 files**, often as a card surface (`--tc-agent-graph-card-bg`, `--tc-agent-ledger-card-bg: light-dark(#fff, #2a2a2e)`). A card painted in the border colour cannot show its border.
  - Other literals: `#2a2a2d` 32× / 14 files, `#313135` 12×, `#1f1f22` 9×, `#222225` 6×.
  - 35 component files define their own `--tc-<comp>-…-bg: light-dark(#hex, #hex)` instead of pointing at `--tc-surface-*`.
- **Examples:** `memory-panel`, `message-actions`, `model-picker` and `prompt-library` use `#222225` for inputs, while `writing-assistant`, `decision-inbox`, `tips-panel` and `smart-recommendation` use `#2a2a2d` for the same role.
- **Fix:** map component surfaces to four dark steps per look:
  - Standard: `--tc-surface-sunken` `#111113`, `-raised` `#19191b`, `-overlay` `#232326`, `--tc-fill-default` for wells and inputs
  - Clean: `#161618` / `#1c1c1e` / `#252527`
  - Add an explicit `--tc-surface-control` (dark `#232326` Standard / `#252527` Clean) for inputs and secondary buttons, replacing `#222225`/`#2a2a2d`/`#2a2a2e`/`#1f1f22`.
  - Reserve `#2a2a2e` for borders.

### M3. Elevation lost in dark
- **agent-queue:** the worker job track is `#232326` on a `#232326` lane, separation 1.0. In light it is a white slot on grey, so in dark only the progress fill shows (`.visual/p4-final/agent-queue__agent-queue__{light,dark}.png`).
- **Sunken wells are 1.05:1 against their card in dark** (light ≥ 1.1):
  - billing-schedule `.ui-bs__fields` (#111113 on #19191b)
  - delegate-board `.ui-db__pile`
  - settings-billing `section.ui-um`
  - evals `.ui-df`
- **Fix:**
  - Give the track `--tc-fill-default` over the lane, or a `--tc-border-subtle` inset ring.
  - For wells, add `box-shadow: inset 0 0 0 1px var(--tc-border-subtle)` in dark, or keep wells at `--tc-surface-sunken` and lift the parent to `--tc-surface-raised` (the light rows already do this).

### M4. The looks handle narrow widths differently
- **Breakpoints in one look only** (`cq.mjs`):
  - 14 components have container breakpoints only in Clean: breakdown-chart, chat-composer, comment-thread, comments-panel, decision-inbox, filter-menu, integration-settings, kpi-chart, notification-stack, progress-tracker, setup-guide, thinking-state, tool-call-card, writing-assistant.
  - 6 use different thresholds per look: cited-answer, compact-breakdown, memory-panel (340 vs 360), otp-input (360/340), permission-request (360/340), smart-recommendation.
- **Viewport media queries where the other look uses containers:** billing-schedule (Std @media 520 / Clean @container 500), email-draft (H4), inline-diff (Std @media 400 / Clean @container 360), data-table (Clean @media 480), agent-cursors (@media 520), toaster (@media 600). Media queries follow the viewport, so these components don't adapt inside a narrow sidebar on a wide screen.
- **Fix:** one set of `@container` breakpoints per component, shared by both looks: the same thresholds, with only the visual treatment scoped per look. Replace the component-level `@media (max-width)` rules with `@container`.

### M5. Functionality removed at narrow widths
- **billing-schedule ≤375:** the three "repeats" `<select>`s are replaced by static text, so the billing cadence can't be edited (`<scratch>/crops/sheet-a.png`).
- **inline-diff ≤375:** the "Previous/Next suggestion" buttons are hidden and only "Accept all / Reject all" remain.
- **agent-lanes:** lane labels are hard-clipped with no ellipsis at every width ("Triag", "Fix date p", "Nightly b"), and the label lives inside a button with no `title` (`crops/sheet-b.png`).
- **agent-cursors (both looks):** the decorative `.ui-agc__shade` is 423 px wide in a 343 px stage. It overflows by 16–24 px at every width and makes the stage scroll horizontally, and the comment popover covers the body text at 375.
- **Fix:**
  - billing-schedule: keep the selects and wrap them under the amount.
  - inline-diff: keep prev/next as 24 px icon buttons.
  - agent-lanes: add `text-overflow: ellipsis` and a `title`.
  - agent-cursors: add `overflow: clip` on `.ui-agc__stage`.

### M6. Single-file components only see `.dark`/`[data-theme]`, while tokens.css also uses `[data-tc-theme]`
The two theme vocabularies disagree. tokens.css:333–335 handles `.dark, [data-theme], [data-tc-theme]`, but every published file's built-in rule (e.g. `components/button.tsx:253–254`) handles only `.dark, [data-theme]`. A copied component without tokens.css therefore ignores `data-tc-theme="dark"`.
**Fix:** have `build-lib.mjs` emit the same three selectors as tokens.css.

## Findings – Low

- **Inverted primary buttons** (a light pill on dark) are intentional, but the fill drifts: Standard `#ededed`; Clean `#ececec`, `#e7e7e7` (agent-inbox-clean), `#eeeeee` (agent-steering-clean), `#f4f4f5` (agent-cursors-clean pin). Use `--tc-surface-inverse` (`#ededed` Standard / Clean equivalent) everywhere.
- **agent-cursors:** the embedded "chart" figure stays light lavender in dark, in both looks.
- **integration-picker:** some logo tiles are hard-coded `tile: "#ffffff"` (src/components/integration-picker.tsx:157, :208, :231). Keeping the white is acceptable for brand marks, but give the tile `--tc-border-default` so it doesn't glare.
- **Switch knobs** are hard-coded `#fff` (integration-picker:1109/1131, integration-settings:699). This is fine on an accent track, but it means the off-state knob on a dark `--tc-fill-strong` track is pure white. Judgement call: consider `#e4e4e7` in dark.
- **Gallery demo content is not themed:** 61 files in `app/src/demos/` use colour literals. Examples:
  - toaster trigger buttons and reaction-bar post text render dark-on-dark
  - otp-input / date-range-picker headings use `#171717` / `#262626`
  - the app-shell* status pills `#ecfdf3`/`#eff4ff`/`#fff7ed` stay pastel (`<scratch>/crops/app-shell__dark__status-pills.png`)
  - motion demo frames use a `rgba(0,0,0,.08)` border that vanishes in dark

  This is demo-only, but it makes every dark screenshot look worse than the library. Fix: use `var(--tc-text-primary)` etc. in demos.
- **side-folder** has no dark styles at all (identical in every mode). The art is acceptable, but its white paper sheets are the brightest element on any dark page.
- **Truncation:** 43 stage/width cells have ellipsis text with no `title`/`aria-label` for the full value (most are row titles in review-center, tool-call-card, agent-steering, model-picker, autonomy-dial and delegate-board). delegate-board @320 crushes agent names to "Su…". context-map @320 hard-clips file names. Fix: add a `title` on truncated labels; delegate-board can move the price pill below the name under `@container (max-width: 340px)`.
- **agent-inbox ≤375** hides the Board/List switch (list is forced). That is defensible, but say so in the docs.
- **Correct collapse patterns** (no action): combobox-clean, cited-answer-clean and filter-menu-clean fold chips into "+N", and date-range-picker shows one month at narrow widths.

## What is fine

- **Dark mode:**
  - In `.dark` mode, all 64 components in both looks adapt: no stage keeps a large light surface.
  - Bright-pixel share in the dark screenshots is ≤ 7% outside illustrations and art.
  - Text never drops below 1.6:1 except in the demo content listed above.
  - Shadows use `--tc-shadow-color` (rgba(0,0,0,.4–.6) in dark) together with a border ring, so cards stay distinguishable. The exceptions are M3.
- **Widths:**
  - data-table, evals and crm put wide tables in `overflow-x:auto` wrappers, which is correct.
  - The screens collapse the sidebar to a toggle at ≤768, so the "hidden" Resize/Search controls are reachable via the toggle.
  - Container queries are the dominant pattern, used by 56 of 64 components.

## Proposed token / scale changes

| Change | Why |
|---|---|
| Add `--tc-surface-control` – Standard `light-dark(#ffffff, #232326)`, Clean `light-dark(#ffffff, #252527)` | Replaces `#222225`, `#2a2a2d`, `#2a2a2e`, `#1f1f22` for inputs and secondary buttons (M2) |
| State that `--tc-zinc-800` (#2a2a2e) is border-only; component `*-card-bg` tokens point at `--tc-surface-raised` / `-overlay` | A card painted in the border colour loses its border (M2) |
| Use `--tc-surface-inverse` for every inverted primary pill; add a Clean value | Ends the `#ececec`/`#e7e7e7`/`#eeeeee`/`#f4f4f5` drift (Low) |
| A dark "well" treatment: `--tc-surface-sunken` + `inset 0 0 0 1px var(--tc-border-subtle)` (new `--tc-shadow-sunken`) | Restores separation for sunken areas (M3) |
| Theme selectors: tokens.css and every built file use one list – `.dark, [data-theme="dark"], [data-tc-theme="dark"]`, plus `[data-tc-theme="system"] { color-scheme: light dark }` | M1, M6 |
| Shared container breakpoints, e.g. `--tc-bp-narrow: 360px`, `--tc-bp-compact: 480px` (as documented constants: custom properties can't be used inside `@container`) | M4 |
| Floor on scaled type: no component text below `--tc-font-size-xs` (11px); controls ≥ 24 px | H2 |

## Prioritised fix list

1. **H1** – Convert the `.dark`-scoped overrides to `light-dark()`. Start with task-board, ai-workspace and decision-inbox, then the 11 illustrations. Add `[data-tc-theme="dark"]` to the selectors as a stopgap, and add a check-tokens rule against new `.dark` colour rules.
2. **H2** – Clamp chat-composer's `--u` scaling, which also fixes ai-workspace.
3. **H3** – Add `overflow: clip` on the workspace app-shell root.
4. **H4** – email-draft Standard: replace the `@media` rule with the Clean `@container` rules. smart-recommendation: add `flex-wrap` on the actions.
5. **H5** – project-flow colours → tokens; voice-orb re-reads its colours on theme change.
6. **M1/M6** – Add a gallery Light/Dark/System toggle that drives `data-tc-theme`, and align the theme selectors in `build-lib.mjs`.
7. **M2** – Add `--tc-surface-control` and remap the off-scale greys.
8. **M3** – Separation for the agent-queue track and the sunken wells.
9. **M4** – Align container breakpoints across looks and remove component `@media` width queries.
10. **M5** – Restore the billing-schedule selects and inline-diff prev/next; ellipsis on agent-lanes; clip agent-cursors' shade.
11. **Low** – Inverse-pill token, demo colours via tokens, `title` on truncated labels.

## Appendix – per-entry results

**Columns:**
- **768 / 375 / 320:** light-theme measurement at that viewport. The dark captures at the same widths gave the same layout results.
- **Dark (.dark):** visual check of the dark render switched with `.dark`.
- **Dark via color-scheme:** % of pixels that differ when dark comes from `color-scheme` (`data-tc-theme`/system) instead of `.dark`.
- **Shots:** screenshot path pattern.

**Severity markers:** **H**/**M**/L as above. "ellipsis×n" = n labels truncated with no title (Low). "inner h-scroll" = a deliberate `overflow-x:auto` region (OK). "–" = not captured (the 320 px pass covered components only).

| Entry | File | 768 | 375 | 320 | Dark (.dark) | Dark via color-scheme | Shots |
|---|---|---|---|---|---|---|---|
| agent-cursors | agent-cursors | **M** demo doc 16–24px wider than stage; comment popover covers body text | **M** demo doc 16–24px wider than stage; comment popover covers body text | **M** demo doc 16–24px wider than stage; comment popover covers body text | L figure image stays light lavender | same | `<scratch>/out/shots/agent-cursors__agent-cursors__{light,dark}__w{768,375,320}.png` |
| agent-cursors | agent-cursors-clean | **M** demo doc 16–24px wider than stage; comment popover covers body text | **M** demo doc 16–24px wider than stage; comment popover covers body text | **M** demo doc 16–24px wider than stage; comment popover covers body text | L figure image stays light lavender | same | `<scratch>/out/shots/agent-cursors__agent-cursors-clean__{light,dark}__w{768,375,320}.png` |
| agent-graph | agent-graph | OK | OK | OK | OK | same | `<scratch>/out/shots/agent-graph__agent-graph__{light,dark}__w{768,375,320}.png` |
| agent-graph | agent-graph-clean | OK | OK | OK | OK | same | `<scratch>/out/shots/agent-graph__agent-graph-clean__{light,dark}__w{768,375,320}.png` |
| agent-inbox | agent-inbox | ellipsis×3 | **L** Board/List switch hidden (list forced) | **L** Board/List switch hidden | OK | same | `<scratch>/out/shots/agent-inbox__agent-inbox__{light,dark}__w{768,375,320}.png` |
| agent-inbox | agent-inbox-clean | ellipsis×3 | **L** Board/List switch hidden (list forced) | **L** Board/List switch hidden | OK | same | `<scratch>/out/shots/agent-inbox__agent-inbox-clean__{light,dark}__w{768,375,320}.png` |
| agent-lanes | agent-lanes | **M** lane labels hard-clipped, no ellipsis (all widths) | **M** lane labels hard-clipped, no ellipsis (all widths) | **M** lane labels hard-clipped, no ellipsis (all widths) | OK | **M** 1.18% | `<scratch>/out/shots/agent-lanes__agent-lanes__{light,dark}__w{768,375,320}.png` |
| agent-lanes | agent-lanes-clean | **M** lane labels hard-clipped, no ellipsis (all widths) | **M** lane labels hard-clipped, no ellipsis (all widths) | **M** lane labels hard-clipped, no ellipsis (all widths) | OK | **M** 1.23% | `<scratch>/out/shots/agent-lanes__agent-lanes-clean__{light,dark}__w{768,375,320}.png` |
| agent-ledger | agent-ledger | OK | ellipsis×3 | ellipsis×5 | OK | same | `<scratch>/out/shots/agent-ledger__agent-ledger__{light,dark}__w{768,375,320}.png` |
| agent-ledger | agent-ledger-clean | OK | OK | ellipsis×4 | OK | same | `<scratch>/out/shots/agent-ledger__agent-ledger-clean__{light,dark}__w{768,375,320}.png` |
| agent-plan | agent-plan | OK | OK | OK | OK | same | `<scratch>/out/shots/agent-plan__agent-plan__{light,dark}__w{768,375,320}.png` |
| agent-plan | agent-plan-clean | OK | OK | OK | OK | same | `<scratch>/out/shots/agent-plan__agent-plan-clean__{light,dark}__w{768,375,320}.png` |
| agent-queue | agent-queue | OK | OK | OK | **M** worker track = lane colour (#232326 on #232326) | 0.41% (noise/minor) | `<scratch>/out/shots/agent-queue__agent-queue__{light,dark}__w{768,375,320}.png` |
| agent-queue | agent-queue-clean | OK | OK | OK | **M** worker track = lane colour (#232326 on #232326) | 0.22% (noise/minor) | `<scratch>/out/shots/agent-queue__agent-queue-clean__{light,dark}__w{768,375,320}.png` |
| agent-steering | agent-steering | OK | OK | ellipsis×1 | OK | same | `<scratch>/out/shots/agent-steering__agent-steering__{light,dark}__w{768,375,320}.png` |
| agent-steering | agent-steering-clean | OK | OK | OK | OK | same | `<scratch>/out/shots/agent-steering__agent-steering-clean__{light,dark}__w{768,375,320}.png` |
| agent-tree | agent-tree | OK | OK | OK | OK | same | `<scratch>/out/shots/agent-tree__agent-tree__{light,dark}__w{768,375,320}.png` |
| agent-tree | agent-tree-clean | OK | OK | OK | OK | same | `<scratch>/out/shots/agent-tree__agent-tree-clean__{light,dark}__w{768,375,320}.png` |
| ai-answer | ai-answer | OK | inner h-scroll | inner h-scroll | OK | same | `<scratch>/out/shots/ai-answer__ai-answer__{light,dark}__w{768,375,320}.png` |
| ai-answer | ai-answer-clean | OK | inner h-scroll | inner h-scroll | OK | same | `<scratch>/out/shots/ai-answer__ai-answer-clean__{light,dark}__w{768,375,320}.png` |
| approval-card | approval-card | ellipsis×1 | ellipsis×2 | ellipsis×3 | OK | same | `<scratch>/out/shots/approval-card__approval-card__{light,dark}__w{768,375,320}.png` |
| approval-card | approval-card-clean | ellipsis×1 | ellipsis×2 | ellipsis×2 | OK | same | `<scratch>/out/shots/approval-card__approval-card-clean__{light,dark}__w{768,375,320}.png` |
| autonomy-dial | autonomy-dial | OK | OK | **L** action label truncated by risk badge | OK | same | `<scratch>/out/shots/autonomy-dial__autonomy-dial__{light,dark}__w{768,375,320}.png` |
| autonomy-dial | autonomy-dial-clean | OK | OK | **L** action label truncated by risk badge | OK | same | `<scratch>/out/shots/autonomy-dial__autonomy-dial-clean__{light,dark}__w{768,375,320}.png` |
| billing-schedule | billing-schedule | OK | **M** “repeats” selects removed (cadence not editable) | **M** “repeats” selects removed | OK | same | `<scratch>/out/shots/billing-schedule__billing-schedule__{light,dark}__w{768,375,320}.png` |
| billing-schedule | billing-schedule-clean | OK | **M** “repeats” selects removed (cadence not editable) | **M** “repeats” selects removed | OK | same | `<scratch>/out/shots/billing-schedule__billing-schedule-clean__{light,dark}__w{768,375,320}.png` |
| blocks/agent-gallery | agent-gallery | OK | OK | – | L side preview cards stay light (decorative) | same | `<scratch>/out/shots/blocks~agent-gallery__agent-gallery__{light,dark}__w{768,375,320}.png` |
| blocks/ai-workspace | ai-workspace | **M** composer scaled (input 16.9px) | **H** composer scaled: input 11.3px, send 17px | – | OK | **H** 6.91% differs | `<scratch>/out/shots/blocks~ai-workspace__ai-workspace__{light,dark}__w{768,375,320}.png` |
| blocks/app-directory | app-directory | inner h-scroll | inner h-scroll | – | OK | same | `<scratch>/out/shots/blocks~app-directory__app-directory__{light,dark}__w{768,375,320}.png` |
| blocks/client-context | client-context | OK | ellipsis×1 | – | OK | same | `<scratch>/out/shots/blocks~client-context__client-context__{light,dark}__w{768,375,320}.png` |
| blocks/invoice-credit | invoice-credit | OK | OK | – | OK | same | `<scratch>/out/shots/blocks~invoice-credit__invoice-credit__{light,dark}__w{768,375,320}.png` |
| blocks/kpi-board | kpi-board | OK | OK | – | OK | same | `<scratch>/out/shots/blocks~kpi-board__kpi-board__{light,dark}__w{768,375,320}.png` |
| blocks/logo-marquee | logo-marquee | OK | OK | – | OK | same | `<scratch>/out/shots/blocks~logo-marquee__logo-marquee__{light,dark}__w{768,375,320}.png` |
| blocks/metrics-dashboard | metrics-dashboard | OK | OK | – | OK | same | `<scratch>/out/shots/blocks~metrics-dashboard__metrics-dashboard__{light,dark}__w{768,375,320}.png` |
| blocks/pricing-plans | pricing-plans | OK | OK | – | OK | same | `<scratch>/out/shots/blocks~pricing-plans__pricing-plans__{light,dark}__w{768,375,320}.png` |
| blocks/task-board | task-board | inner h-scroll | inner h-scroll | – | OK | **H** 21.65% differs | `<scratch>/out/shots/blocks~task-board__task-board__{light,dark}__w{768,375,320}.png` |
| blocks/testimonial-wall | testimonial-wall | OK | OK | – | OK | same | `<scratch>/out/shots/blocks~testimonial-wall__testimonial-wall__{light,dark}__w{768,375,320}.png` |
| breakdown-chart | breakdown-chart | OK | ellipsis×1, inner h-scroll | ellipsis×3, inner h-scroll | OK | same | `<scratch>/out/shots/breakdown-chart__breakdown-chart__{light,dark}__w{768,375,320}.png` |
| breakdown-chart | breakdown-chart-clean | OK | ellipsis×1, inner h-scroll | ellipsis×1, inner h-scroll | OK | same | `<scratch>/out/shots/breakdown-chart__breakdown-chart-clean__{light,dark}__w{768,375,320}.png` |
| button | button | OK | OK | OK | OK | same | `<scratch>/out/shots/button__button__{light,dark}__w{768,375,320}.png` |
| button | button-clean | OK | OK | OK | OK | same | `<scratch>/out/shots/button__button-clean__{light,dark}__w{768,375,320}.png` |
| change-summary | change-summary | OK | OK | OK | OK | **M** 1.29% | `<scratch>/out/shots/change-summary__change-summary__{light,dark}__w{768,375,320}.png` |
| change-summary | change-summary-clean | OK | OK | OK | OK | same | `<scratch>/out/shots/change-summary__change-summary-clean__{light,dark}__w{768,375,320}.png` |
| chat-composer | chat-composer | OK | **H** Std scales with width: input 13.2px, send 20px | **H** Std: input 11.1px, send 17px | OK | same | `<scratch>/out/shots/chat-composer__chat-composer__{light,dark}__w{768,375,320}.png` |
| chat-composer | chat-composer-clean | OK | OK | OK | OK | same | `<scratch>/out/shots/chat-composer__chat-composer-clean__{light,dark}__w{768,375,320}.png` |
| cited-answer | cited-answer | OK | OK | ellipsis×1 | OK | same | `<scratch>/out/shots/cited-answer__cited-answer__{light,dark}__w{768,375,320}.png` |
| cited-answer | cited-answer-clean | OK | OK | ellipsis×1 | OK | same | `<scratch>/out/shots/cited-answer__cited-answer-clean__{light,dark}__w{768,375,320}.png` |
| combobox | combobox | OK | OK | OK | OK | same | `<scratch>/out/shots/combobox__combobox__{light,dark}__w{768,375,320}.png` |
| combobox | combobox-clean | OK | OK | OK | OK | same | `<scratch>/out/shots/combobox__combobox-clean__{light,dark}__w{768,375,320}.png` |
| command-menu | command-menu | OK | OK | OK | OK | same | `<scratch>/out/shots/command-menu__command-menu__{light,dark}__w{768,375,320}.png` |
| command-menu | command-menu-clean | OK | OK | OK | OK | same | `<scratch>/out/shots/command-menu__command-menu-clean__{light,dark}__w{768,375,320}.png` |
| comment-thread | comment-thread | OK | OK | OK | OK | same | `<scratch>/out/shots/comment-thread__comment-thread__{light,dark}__w{768,375,320}.png` |
| comment-thread | comment-thread-clean | OK | OK | OK | OK | same | `<scratch>/out/shots/comment-thread__comment-thread-clean__{light,dark}__w{768,375,320}.png` |
| comments-panel | comments-panel | OK | OK | OK | OK | same | `<scratch>/out/shots/comments-panel__comments-panel__{light,dark}__w{768,375,320}.png` |
| comments-panel | comments-panel-clean | OK | OK | OK | OK | same | `<scratch>/out/shots/comments-panel__comments-panel-clean__{light,dark}__w{768,375,320}.png` |
| compact-breakdown | compact-breakdown | OK | OK | OK | OK | same | `<scratch>/out/shots/compact-breakdown__compact-breakdown__{light,dark}__w{768,375,320}.png` |
| compact-breakdown | compact-breakdown-clean | OK | OK | OK | OK | same | `<scratch>/out/shots/compact-breakdown__compact-breakdown-clean__{light,dark}__w{768,375,320}.png` |
| context-map | context-map | OK | L hard-clip 2 | **L** file names/token counts hard-clipped | OK | 0.31% (noise/minor) | `<scratch>/out/shots/context-map__context-map__{light,dark}__w{768,375,320}.png` |
| context-map | context-map-clean | OK | L hard-clip 2 | **L** file names/token counts hard-clipped | OK | 0.18% (noise/minor) | `<scratch>/out/shots/context-map__context-map-clean__{light,dark}__w{768,375,320}.png` |
| context-window | context-window | OK | OK | OK | OK | same | `<scratch>/out/shots/context-window__context-window__{light,dark}__w{768,375,320}.png` |
| context-window | context-window-clean | OK | OK | OK | OK | same | `<scratch>/out/shots/context-window__context-window-clean__{light,dark}__w{768,375,320}.png` |
| data-table | data-table | ellipsis×3, inner h-scroll | ellipsis×3, inner h-scroll | ellipsis×3, inner h-scroll | OK | same | `<scratch>/out/shots/data-table__data-table__{light,dark}__w{768,375,320}.png` |
| data-table | data-table-clean | ellipsis×1, inner h-scroll | ellipsis×1, inner h-scroll | ellipsis×1, inner h-scroll | OK | same | `<scratch>/out/shots/data-table__data-table-clean__{light,dark}__w{768,375,320}.png` |
| date-range-picker | date-range-picker | OK | inner h-scroll | inner h-scroll | L demo “Applied” text #262626 (demo) | same | `<scratch>/out/shots/date-range-picker__date-range-picker__{light,dark}__w{768,375,320}.png` |
| date-range-picker | date-range-picker-clean | OK | ellipsis×1, inner h-scroll | ellipsis×1, inner h-scroll | L demo “Applied” text #262626 (demo) | same | `<scratch>/out/shots/date-range-picker__date-range-picker-clean__{light,dark}__w{768,375,320}.png` |
| decision-inbox | decision-inbox | OK | OK | OK | OK | **H** 2.63% – secondary buttons turn white with white labels | `<scratch>/out/shots/decision-inbox__decision-inbox__{light,dark}__w{768,375,320}.png` |
| decision-inbox | decision-inbox-clean | OK | OK | OK | OK | same | `<scratch>/out/shots/decision-inbox__decision-inbox-clean__{light,dark}__w{768,375,320}.png` |
| decision-tree | decision-tree | OK | OK | OK | OK | same | `<scratch>/out/shots/decision-tree__decision-tree__{light,dark}__w{768,375,320}.png` |
| decision-tree | decision-tree-clean | OK | OK | OK | OK | same | `<scratch>/out/shots/decision-tree__decision-tree-clean__{light,dark}__w{768,375,320}.png` |
| delegate-board | delegate-board | ellipsis×2 | ellipsis×4 | **L** agent name crushed to 2 chars (“Su…”) | OK | same | `<scratch>/out/shots/delegate-board__delegate-board__{light,dark}__w{768,375,320}.png` |
| delegate-board | delegate-board-clean | ellipsis×1 | ellipsis×1 | **L** agent name crushed to 2 chars (“Su…”) | OK | same | `<scratch>/out/shots/delegate-board__delegate-board-clean__{light,dark}__w{768,375,320}.png` |
| dropzone | dropzone | OK | OK | OK | OK | same | `<scratch>/out/shots/dropzone__dropzone__{light,dark}__w{768,375,320}.png` |
| dropzone | dropzone-clean | OK | OK | OK | OK | same | `<scratch>/out/shots/dropzone__dropzone-clean__{light,dark}__w{768,375,320}.png` |
| email-draft | email-draft | OK | OK | **H** card 16px wider than stage; amount + Send cut (std uses @media, Clean @container is OK) | OK | same | `<scratch>/out/shots/email-draft__email-draft__{light,dark}__w{768,375,320}.png` |
| email-draft | email-draft-clean | OK | OK | ellipsis×1 | OK | same | `<scratch>/out/shots/email-draft__email-draft-clean__{light,dark}__w{768,375,320}.png` |
| experiment-card | experiment-card | OK | OK | OK | OK | same | `<scratch>/out/shots/experiment-card__experiment-card__{light,dark}__w{768,375,320}.png` |
| experiment-card | experiment-card-clean | OK | OK | OK | OK | same | `<scratch>/out/shots/experiment-card__experiment-card-clean__{light,dark}__w{768,375,320}.png` |
| fan-out-grid | fan-out-grid | OK | OK | OK | OK | 0.11% (noise/minor) | `<scratch>/out/shots/fan-out-grid__fan-out-grid__{light,dark}__w{768,375,320}.png` |
| fan-out-grid | fan-out-grid-clean | OK | OK | OK | OK | 0.19% (noise/minor) | `<scratch>/out/shots/fan-out-grid__fan-out-grid-clean__{light,dark}__w{768,375,320}.png` |
| filter-menu | filter-menu | OK | OK | OK | OK | same | `<scratch>/out/shots/filter-menu__filter-menu__{light,dark}__w{768,375,320}.png` |
| filter-menu | filter-menu-clean | OK | OK | OK | OK | same | `<scratch>/out/shots/filter-menu__filter-menu-clean__{light,dark}__w{768,375,320}.png` |
| illustrations/agent-team | agent-team | OK | OK | – | OK | 0.43% (noise/minor) | `<scratch>/out/shots/illustrations~agent-team__agent-team__{light,dark}__w{768,375,320}.png` |
| illustrations/cover-flow | cover-flow | OK | OK | – | OK | same | `<scratch>/out/shots/illustrations~cover-flow__cover-flow__{light,dark}__w{768,375,320}.png` |
| illustrations/empty-calendar | empty-calendar | OK | OK | – | OK | **H** 26.58% differs | `<scratch>/out/shots/illustrations~empty-calendar__empty-calendar__{light,dark}__w{768,375,320}.png` |
| illustrations/enrichment-orbit | enrichment-orbit | OK | OK | – | OK | **M** 3.93% | `<scratch>/out/shots/illustrations~enrichment-orbit__enrichment-orbit__{light,dark}__w{768,375,320}.png` |
| illustrations/frost-cloud | frost-cloud | OK | OK | – | OK (brand art, theme-neutral by design) | same | `<scratch>/out/shots/illustrations~frost-cloud__frost-cloud__{light,dark}__w{768,375,320}.png` |
| illustrations/ghosted-chat | ghosted-chat | OK | OK | – | OK | same | `<scratch>/out/shots/illustrations~ghosted-chat__ghosted-chat__{light,dark}__w{768,375,320}.png` |
| illustrations/glass-folder | glass-folder | OK | OK | – | OK | **H** 16.75% differs | `<scratch>/out/shots/illustrations~glass-folder__glass-folder__{light,dark}__w{768,375,320}.png` |
| illustrations/glow-cloud | glow-cloud | OK | OK | – | OK (brand art, theme-neutral by design) | same | `<scratch>/out/shots/illustrations~glow-cloud__glow-cloud__{light,dark}__w{768,375,320}.png` |
| illustrations/glow-keyboard | glow-keyboard | OK | OK | – | OK | **H** 12.29% differs | `<scratch>/out/shots/illustrations~glow-keyboard__glow-keyboard__{light,dark}__w{768,375,320}.png` |
| illustrations/integration-beam | integration-beam | OK | OK | – | OK | same | `<scratch>/out/shots/illustrations~integration-beam__integration-beam__{light,dark}__w{768,375,320}.png` |
| illustrations/integration-flow | integration-flow | OK | OK | – | OK | **H** 60.63% differs | `<scratch>/out/shots/illustrations~integration-flow__integration-flow__{light,dark}__w{768,375,320}.png` |
| illustrations/integration-grid | integration-grid | OK | OK | – | OK | **H** 36.16% differs | `<scratch>/out/shots/illustrations~integration-grid__integration-grid__{light,dark}__w{768,375,320}.png` |
| illustrations/layer-stack | layer-stack | OK | OK | – | OK | same | `<scratch>/out/shots/illustrations~layer-stack__layer-stack__{light,dark}__w{768,375,320}.png` |
| illustrations/lead-sourcing | lead-sourcing | OK | OK | – | OK | **H** 18.28% differs | `<scratch>/out/shots/illustrations~lead-sourcing__lead-sourcing__{light,dark}__w{768,375,320}.png` |
| illustrations/logo-cluster | logo-cluster | OK | OK | – | OK | same | `<scratch>/out/shots/illustrations~logo-cluster__logo-cluster__{light,dark}__w{768,375,320}.png` |
| illustrations/model-wheel | model-wheel | OK | OK | – | OK | same | `<scratch>/out/shots/illustrations~model-wheel__model-wheel__{light,dark}__w{768,375,320}.png` |
| illustrations/outreach-branches | outreach-branches | OK | OK | – | OK | **H** 9.15% differs | `<scratch>/out/shots/illustrations~outreach-branches__outreach-branches__{light,dark}__w{768,375,320}.png` |
| illustrations/project-flow | project-flow | OK | OK | – | **H** not adapted: white cards on grey vignette | same | `<scratch>/out/shots/illustrations~project-flow__project-flow__{light,dark}__w{768,375,320}.png` |
| illustrations/region-dach | region-dach | OK | OK | – | OK | **H** 30.26% differs | `<scratch>/out/shots/illustrations~region-dach__region-dach__{light,dark}__w{768,375,320}.png` |
| illustrations/side-folder | side-folder | OK | OK | – | L no dark styles (folder art, acceptable) | same | `<scratch>/out/shots/illustrations~side-folder__side-folder__{light,dark}__w{768,375,320}.png` |
| illustrations/tab-overload | tab-overload | OK | OK | – | OK | **H** 53.66% differs | `<scratch>/out/shots/illustrations~tab-overload__tab-overload__{light,dark}__w{768,375,320}.png` |
| illustrations/team-invite | team-invite | OK | OK | – | OK | same | `<scratch>/out/shots/illustrations~team-invite__team-invite__{light,dark}__w{768,375,320}.png` |
| illustrations/voice-orb | voice-orb | OK | OK | – | **H** orb ink frozen at mount – invisible after theme switch (reduced motion) | same | `<scratch>/out/shots/illustrations~voice-orb__voice-orb__{light,dark}__w{768,375,320}.png` |
| illustrations/world-map | world-map | OK | OK | – | OK | **H** 21.1% differs | `<scratch>/out/shots/illustrations~world-map__world-map__{light,dark}__w{768,375,320}.png` |
| inline-diff | inline-diff | OK | **M** prev/next suggestion buttons hidden | **M** prev/next suggestion buttons hidden | OK | same | `<scratch>/out/shots/inline-diff__inline-diff__{light,dark}__w{768,375,320}.png` |
| inline-diff | inline-diff-clean | OK | **M** prev/next suggestion buttons hidden | **M** prev/next suggestion buttons hidden | OK | same | `<scratch>/out/shots/inline-diff__inline-diff-clean__{light,dark}__w{768,375,320}.png` |
| integration-picker | integration-picker | OK | OK | OK | L white logo tiles (brand) | same | `<scratch>/out/shots/integration-picker__integration-picker__{light,dark}__w{768,375,320}.png` |
| integration-picker | integration-picker-clean | OK | OK | OK | L white logo tiles (brand) | same | `<scratch>/out/shots/integration-picker__integration-picker-clean__{light,dark}__w{768,375,320}.png` |
| integration-settings | integration-settings | OK | OK | OK | OK | same | `<scratch>/out/shots/integration-settings__integration-settings__{light,dark}__w{768,375,320}.png` |
| integration-settings | integration-settings-clean | OK | OK | OK | OK | same | `<scratch>/out/shots/integration-settings__integration-settings-clean__{light,dark}__w{768,375,320}.png` |
| kpi-chart | kpi-chart | OK | OK | OK | OK | same | `<scratch>/out/shots/kpi-chart__kpi-chart__{light,dark}__w{768,375,320}.png` |
| kpi-chart | kpi-chart-clean | OK | OK | OK | OK | same | `<scratch>/out/shots/kpi-chart__kpi-chart-clean__{light,dark}__w{768,375,320}.png` |
| memory-panel | memory-panel | inner h-scroll | inner h-scroll | inner h-scroll | OK | same | `<scratch>/out/shots/memory-panel__memory-panel__{light,dark}__w{768,375,320}.png` |
| memory-panel | memory-panel-clean | inner h-scroll | inner h-scroll | inner h-scroll | OK | same | `<scratch>/out/shots/memory-panel__memory-panel-clean__{light,dark}__w{768,375,320}.png` |
| message-actions | message-actions | OK | OK | OK | OK | same | `<scratch>/out/shots/message-actions__message-actions__{light,dark}__w{768,375,320}.png` |
| message-actions | message-actions-clean | OK | OK | OK | OK | same | `<scratch>/out/shots/message-actions__message-actions-clean__{light,dark}__w{768,375,320}.png` |
| model-picker | model-picker | OK | OK | OK | OK | same | `<scratch>/out/shots/model-picker__model-picker__{light,dark}__w{768,375,320}.png` |
| model-picker | model-picker-clean | OK | OK | OK | OK | same | `<scratch>/out/shots/model-picker__model-picker-clean__{light,dark}__w{768,375,320}.png` |
| motion/blur-crossfade | blur-crossfade | OK | OK | – | L demo frame/bar hard-coded light | same | `<scratch>/out/shots/motion~blur-crossfade__blur-crossfade__{light,dark}__w{768,375,320}.png` |
| motion/gradient-floor | gradient-floor | OK | OK | – | L demo frame border rgba(0,0,0,.08) vanishes | same | `<scratch>/out/shots/motion~gradient-floor__gradient-floor__{light,dark}__w{768,375,320}.png` |
| motion/gradient-text | gradient-text | OK | OK | – | OK | same | `<scratch>/out/shots/motion~gradient-text__gradient-text__{light,dark}__w{768,375,320}.png` |
| motion/grid-background | grid-background | OK | OK | – | L demo frame border vanishes | same | `<scratch>/out/shots/motion~grid-background__grid-background__{light,dark}__w{768,375,320}.png` |
| motion/number-ticker | number-ticker | OK | OK | – | OK | same | `<scratch>/out/shots/motion~number-ticker__number-ticker__{light,dark}__w{768,375,320}.png` |
| motion/shimmer-loader | shimmer-loader | OK | OK | – | L demo frame border vanishes | same | `<scratch>/out/shots/motion~shimmer-loader__shimmer-loader__{light,dark}__w{768,375,320}.png` |
| motion/text-reveal | text-reveal | OK | OK | – | OK | same | `<scratch>/out/shots/motion~text-reveal__text-reveal__{light,dark}__w{768,375,320}.png` |
| motion/tilt-card | tilt-card | OK | OK | – | OK | same | `<scratch>/out/shots/motion~tilt-card__tilt-card__{light,dark}__w{768,375,320}.png` |
| notification-stack | notification-stack | OK | OK | OK | OK | same | `<scratch>/out/shots/notification-stack__notification-stack__{light,dark}__w{768,375,320}.png` |
| notification-stack | notification-stack-clean | OK | OK | OK | OK | same | `<scratch>/out/shots/notification-stack__notification-stack-clean__{light,dark}__w{768,375,320}.png` |
| otp-input | otp-input | OK | OK | OK | L demo heading #171717 (demo) | same | `<scratch>/out/shots/otp-input__otp-input__{light,dark}__w{768,375,320}.png` |
| otp-input | otp-input-clean | OK | OK | OK | L demo heading #171717 (demo) | same | `<scratch>/out/shots/otp-input__otp-input-clean__{light,dark}__w{768,375,320}.png` |
| parallel-attempts | parallel-attempts | ellipsis×4 | OK | ellipsis×1 | OK | same | `<scratch>/out/shots/parallel-attempts__parallel-attempts__{light,dark}__w{768,375,320}.png` |
| parallel-attempts | parallel-attempts-clean | ellipsis×4 | OK | OK | OK | same | `<scratch>/out/shots/parallel-attempts__parallel-attempts-clean__{light,dark}__w{768,375,320}.png` |
| permission-request | permission-request | OK | OK | OK | OK | same | `<scratch>/out/shots/permission-request__permission-request__{light,dark}__w{768,375,320}.png` |
| permission-request | permission-request-clean | OK | OK | OK | OK | same | `<scratch>/out/shots/permission-request__permission-request-clean__{light,dark}__w{768,375,320}.png` |
| plan-vs-actual | plan-vs-actual-clean | OK | OK | OK | OK | 0.14% (noise/minor) | `<scratch>/out/shots/plan-vs-actual__plan-vs-actual-clean__{light,dark}__w{768,375,320}.png` |
| profile-menu | profile-menu | OK | OK | OK | OK | same | `<scratch>/out/shots/profile-menu__profile-menu__{light,dark}__w{768,375,320}.png` |
| profile-menu | profile-menu-clean | OK | OK | OK | OK | same | `<scratch>/out/shots/profile-menu__profile-menu-clean__{light,dark}__w{768,375,320}.png` |
| progress-tracker | progress-tracker | OK | OK | OK | OK | same | `<scratch>/out/shots/progress-tracker__progress-tracker__{light,dark}__w{768,375,320}.png` |
| progress-tracker | progress-tracker-clean | OK | OK | OK | OK | same | `<scratch>/out/shots/progress-tracker__progress-tracker-clean__{light,dark}__w{768,375,320}.png` |
| project-card | project-card | OK | OK | OK | OK | same | `<scratch>/out/shots/project-card__project-card__{light,dark}__w{768,375,320}.png` |
| project-card | project-card-clean | OK | OK | OK | OK | same | `<scratch>/out/shots/project-card__project-card-clean__{light,dark}__w{768,375,320}.png` |
| prompt-library | prompt-library | OK | OK | OK | OK | same | `<scratch>/out/shots/prompt-library__prompt-library__{light,dark}__w{768,375,320}.png` |
| prompt-library | prompt-library-clean | OK | OK | OK | OK | same | `<scratch>/out/shots/prompt-library__prompt-library-clean__{light,dark}__w{768,375,320}.png` |
| reaction-bar | reaction-bar | OK | OK | **L** demo article fixed 400px (demo only) | L demo post text dark-on-dark (demo) | same | `<scratch>/out/shots/reaction-bar__reaction-bar__{light,dark}__w{768,375,320}.png` |
| reaction-bar | reaction-bar-clean | OK | OK | **L** demo article fixed 400px (demo only) | L demo post text dark-on-dark (demo) | same | `<scratch>/out/shots/reaction-bar__reaction-bar-clean__{light,dark}__w{768,375,320}.png` |
| review-center | review-center | OK | OK | OK | OK | same | `<scratch>/out/shots/review-center__review-center__{light,dark}__w{768,375,320}.png` |
| review-center | review-center-clean | OK | OK | OK | OK | same | `<scratch>/out/shots/review-center__review-center-clean__{light,dark}__w{768,375,320}.png` |
| screens/agent-chat | agent-chat | OK | OK | – | OK | same | `<scratch>/out/shots/screens~agent-chat__agent-chat__{light,dark}__w{768,375,320}.png` |
| screens/agent-run | agent-run | OK | ellipsis×1 | – | OK | same | `<scratch>/out/shots/screens~agent-run__agent-run__{light,dark}__w{768,375,320}.png` |
| screens/analytics | analytics | OK | OK | – | OK | same | `<scratch>/out/shots/screens~analytics__analytics__{light,dark}__w{768,375,320}.png` |
| screens/app-shell | app-shell | OK | inner h-scroll | – | L demo status pills stay pastel (demo) | same | `<scratch>/out/shots/screens~app-shell__app-shell__{light,dark}__w{768,375,320}.png` |
| screens/app-shell-flat | app-shell-flat | OK | OK | – | L demo status pills stay pastel (demo) | same | `<scratch>/out/shots/screens~app-shell-flat__app-shell-flat__{light,dark}__w{768,375,320}.png` |
| screens/app-shell-workspace | app-shell-workspace | **H** stage scrolls +46px; runs table cut at right edge | **H** stage scrolls +46px; runs table cut at right edge | – | L demo status pills stay pastel (demo) | same | `<scratch>/out/shots/screens~app-shell-workspace__app-shell-workspace__{light,dark}__w{768,375,320}.png` |
| screens/app-shell-workspace-flat | app-shell-workspace-flat | **H** workspace panel parked off-canvas: +343px (375) / +384px (768) horizontal scroll | **H** workspace panel parked off-canvas: +343px (375) / +384px (768) horizontal scroll | – | L demo status pills stay pastel (demo) | same | `<scratch>/out/shots/screens~app-shell-workspace-flat__app-shell-workspace-flat__{light,dark}__w{768,375,320}.png` |
| screens/assistant-home | assistant-home | OK | OK | – | OK | same | `<scratch>/out/shots/screens~assistant-home__assistant-home__{light,dark}__w{768,375,320}.png` |
| screens/crm | crm | ellipsis×8, inner h-scroll | ellipsis×8, inner h-scroll | – | OK | same | `<scratch>/out/shots/screens~crm__crm__{light,dark}__w{768,375,320}.png` |
| screens/evals | evals | ellipsis×71, inner h-scroll | ellipsis×72, inner h-scroll | – | OK | same | `<scratch>/out/shots/screens~evals__evals__{light,dark}__w{768,375,320}.png` |
| screens/files | files | ellipsis×1 | ellipsis×4 | – | OK | 0.39% (noise/minor) | `<scratch>/out/shots/screens~files__files__{light,dark}__w{768,375,320}.png` |
| screens/folder | folder | OK | OK | – | OK | 0.15% (noise/minor) | `<scratch>/out/shots/screens~folder__folder__{light,dark}__w{768,375,320}.png` |
| screens/integrations | integrations | OK | ellipsis×15 | – | OK | same | `<scratch>/out/shots/screens~integrations__integrations__{light,dark}__w{768,375,320}.png` |
| screens/onboarding | onboarding | OK | OK | – | OK | same | `<scratch>/out/shots/screens~onboarding__onboarding__{light,dark}__w{768,375,320}.png` |
| screens/settings-billing | settings-billing | OK | inner h-scroll | – | OK | same | `<scratch>/out/shots/screens~settings-billing__settings-billing__{light,dark}__w{768,375,320}.png` |
| segmented-control | segmented-control | OK | OK | inner h-scroll | OK | same | `<scratch>/out/shots/segmented-control__segmented-control__{light,dark}__w{768,375,320}.png` |
| segmented-control | segmented-control-clean | OK | OK | inner h-scroll | OK | same | `<scratch>/out/shots/segmented-control__segmented-control-clean__{light,dark}__w{768,375,320}.png` |
| setup-guide | setup-guide | OK | OK | OK | OK | same | `<scratch>/out/shots/setup-guide__setup-guide__{light,dark}__w{768,375,320}.png` |
| setup-guide | setup-guide-clean | OK | OK | OK | OK | same | `<scratch>/out/shots/setup-guide__setup-guide-clean__{light,dark}__w{768,375,320}.png` |
| smart-recommendation | smart-recommendation | OK | OK | OK | OK | same | `<scratch>/out/shots/smart-recommendation__smart-recommendation__{light,dark}__w{768,375,320}.png` |
| smart-recommendation | smart-recommendation-clean | OK | OK | **H** primary action overflows card by 5px (actions don’t wrap) | OK | same | `<scratch>/out/shots/smart-recommendation__smart-recommendation-clean__{light,dark}__w{768,375,320}.png` |
| stepper-form | stepper-form | OK | OK | OK | OK | same | `<scratch>/out/shots/stepper-form__stepper-form__{light,dark}__w{768,375,320}.png` |
| stepper-form | stepper-form-clean | OK | OK | OK | OK | same | `<scratch>/out/shots/stepper-form__stepper-form-clean__{light,dark}__w{768,375,320}.png` |
| thinking-loader | thinking-loader | OK | OK | OK | OK | 0.49% (noise/minor) | `<scratch>/out/shots/thinking-loader__thinking-loader__{light,dark}__w{768,375,320}.png` |
| thinking-loader | thinking-loader-clean | OK | OK | OK | OK | 0.4% (noise/minor) | `<scratch>/out/shots/thinking-loader__thinking-loader-clean__{light,dark}__w{768,375,320}.png` |
| thinking-state | thinking-state | OK | OK | OK | OK | same | `<scratch>/out/shots/thinking-state__thinking-state__{light,dark}__w{768,375,320}.png` |
| thinking-state | thinking-state-clean | OK | OK | OK | OK | same | `<scratch>/out/shots/thinking-state__thinking-state-clean__{light,dark}__w{768,375,320}.png` |
| tips-panel | tips-panel | OK | OK | OK | OK | same | `<scratch>/out/shots/tips-panel__tips-panel__{light,dark}__w{768,375,320}.png` |
| tips-panel | tips-panel-clean | OK | OK | OK | OK | same | `<scratch>/out/shots/tips-panel__tips-panel-clean__{light,dark}__w{768,375,320}.png` |
| toaster | toaster | OK | OK | OK | L demo trigger buttons dark-on-dark (demo) | same | `<scratch>/out/shots/toaster__toaster__{light,dark}__w{768,375,320}.png` |
| toaster | toaster-clean | OK | OK | OK | L demo trigger buttons dark-on-dark (demo) | same | `<scratch>/out/shots/toaster__toaster-clean__{light,dark}__w{768,375,320}.png` |
| tool-call-card | tool-call-card | OK | OK | OK | OK | same | `<scratch>/out/shots/tool-call-card__tool-call-card__{light,dark}__w{768,375,320}.png` |
| tool-call-card | tool-call-card-clean | OK | OK | OK | OK | same | `<scratch>/out/shots/tool-call-card__tool-call-card-clean__{light,dark}__w{768,375,320}.png` |
| trace-waterfall | trace-waterfall | OK | OK | OK | OK | 0.42% (noise/minor) | `<scratch>/out/shots/trace-waterfall__trace-waterfall__{light,dark}__w{768,375,320}.png` |
| trace-waterfall | trace-waterfall-clean | OK | OK | OK | OK | 0.51% (noise/minor) | `<scratch>/out/shots/trace-waterfall__trace-waterfall-clean__{light,dark}__w{768,375,320}.png` |
| usage-meter | usage-meter | OK | OK | OK | OK | same | `<scratch>/out/shots/usage-meter__usage-meter__{light,dark}__w{768,375,320}.png` |
| usage-meter | usage-meter-clean | OK | OK | OK | OK | same | `<scratch>/out/shots/usage-meter__usage-meter-clean__{light,dark}__w{768,375,320}.png` |
| writing-assistant | writing-assistant | OK | OK | OK | OK | same | `<scratch>/out/shots/writing-assistant__writing-assistant__{light,dark}__w{768,375,320}.png` |
| writing-assistant | writing-assistant-clean | OK | OK | OK | OK | same | `<scratch>/out/shots/writing-assistant__writing-assistant-clean__{light,dark}__w{768,375,320}.png` |