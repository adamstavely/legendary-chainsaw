# Combined remediation plan – design review + bundle and performance

2026-10-25 · Covers what is still open from [design-review/README.md](design-review/README.md) and
[bundle-and-performance-audit.md](bundle-and-performance-audit.md), checked against the code at `5244f1b`.

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

| # | Item | Source | Size of the problem | Effort |
|---|---|---|---|---|
| 1 | No post-fix measurements; the bench scripts live in the session scratchpad and will be lost | Both | Claimed gains (fan-out-grid 37 % → ?, trace-waterfall 100 % → ?) are unverified | S |
| 2 | filter-menu renders every option | Perf #6 | 5,000 options: 95 ms mount + 37 ms layout | S |
| 3 | 8 components still sweep with `background-position` (finite now, but not composited) | Perf #1, #16 | agent-tree, comment-thread, context-window, context-map, dropzone, thinking-state, tool-call-card, writing-assistant | S |
| 4 | inline-diff caps at 4 M cells and silently becomes one replacement | Perf #13 | Texts over ~1,500 words | M |
| 5 | Render budgets mix demo timers with component behaviour | Perf #15 | Component regressions can hide behind demo traffic | S |
| 6 | Every file ships both looks; `-clean.tsx` differs from the Standard file in 4 lines | Perf #4 | 35 % of each file's minified bytes (−1.0 MB / −116 KB gz across 64 components) | S + breaking note |
| 7 | Token fallback blocks in every file | Perf #5 | 16 % min / 10 % gz per file | S |
| 8 | CSS strings not minified | Perf #14 | 11 % min / 9.5 % gz | S |
| 9 | Heavy inline data in illustrations | Perf #10 | region-dach 167 KB source, 6 regions shipped for 1 shown; project-flow 4 base64 PNGs | S |
| 10 | Spacing isn't on a scale | Design (scales) | 2,338 literal padding/gap/margin declarations; `--tc-space-*` used 13 times | L |
| 11 | Type scale has half-steps (11.5, 12.5, 13.5 px) | Design (scales) | Three extra sizes that exist because old literals were matched, not designed | S |
| 12 | Remaining literals under the ratchet | Design (scales) | line-height 151, radius 176, blurred shadow 50, duration 171, easing 51 | M |
| 13 | glass-folder has no `open` prop; app-shell and assistant-home copy its hover styles | Design follow-up | 2 screens | XS |
| 14 | States no demo shows (stepper-form review/success, ai-workspace projects, client-context empty/create, decision-tree sub-questions) | Design follow-up | CSS nobody has looked at; can't tell dead from live | M |
| 15 | Design judgement calls | Design + WCAG | breakdown-chart palette (1.6–2.5:1), fan-out-grid and agent-queue 12 px targets, date-range band (< 3:1), context-map colour-only tiles | S |
| 16 | Not tested | Both | Screen readers (VoiceOver, NVDA); forced colours (0 `forced-colors` rules); Safari and Firefox; throttled CPU / INP; webpack and Next.js builds | M |

## Plan

Each phase is one commit (or a few), with `npm run ci` green before the next starts.

### Phase 1 – Make the measurements permanent (S)

1. Move the perf bench from the scratchpad into `scripts/perf/` (bundle sizes, steady state, large data, animations,
   leaks) with an `npm run perf` entry. Not in `ci` – it's slow and machine-dependent.
2. Re-run it and add an "after" column to the perf audit: per-file sizes, gallery chunk, fan-out-grid and
   trace-waterfall CPU at 1,000 / 5,000 items, off-screen animation count, large-data timings.
3. Add a static-props run to render budgets (no demo timers), so the budget reflects the component (item 5).

This comes first because every later phase claims a gain, and right now nothing can check it.

### Phase 2 – Runtime leftovers (S–M)

1. filter-menu: window options above ~300, sharing the row-window helper with data-table, combobox and
   trace-waterfall (move it to `src/internal` if it isn't shared yet).
2. The 8 remaining `background-position` sweeps → the `transform: translateX` pseudo-element used in fan-out-grid.
   Then add a ratchet count for `background-position` in keyframes so it stays at 0.
3. inline-diff: replace the capped LCS table with Myers O(ND), or at minimum show "Too long to compare word by word"
   when the cap is hit. Myers is preferred; it also takes the diff out of render cost at 1,000 words.

### Phase 3 – Bundle size (decision A: yes)

1. **Single-look files** (decision A): `button.tsx` carries only Standard CSS, `button-clean.tsx` only Clean.
   build-lib already scopes every rule by `data-look`, so this is a filter at build time. The `look` prop is then
   documented as "the file's look", or removed. −35 % per file. Breaking: note it in CHANGELOG, and update the
   gallery and contract tests that render a file in the other look.
2. **Opt-in lean output**: a second build target (`dist/lean/`) without fallback blocks (consumer loads
   `tokens.css`, 3.6 KB gz) and with minified CSS. Keeps the readable copy-paste files as the default. −27 % gz on top.
3. **Illustrations**: region-dach one module per region (loaded on demand) plus simplified neighbour outlines
   (−60–80 %); project-flow's PNG avatars and logo → inline SVG or separate files (~−35 KB gz).

### Phase 4 – Finish the scales (decision B: round down)

1. **Type scale** (decision B): fold 11.5 → 11, 12.5 → 12 and 13.5 → 13 px in both looks, then remove
   `--tc-font-size-xs-plus`, `-sm-plus` and `-md-plus` from tokens.css. Check the WCAG audit's minimum text sizes
   and the contrast check still pass at the smaller sizes, and let the visual snapshots show the diff before
   committing.
2. **Spacing**: adopt `--tc-space-*` for padding, gap and margin. Do it mechanically like the duration pass: snap
   literals within ±1 px to the 4 px ladder (2 px half-step allowed), leave the rest literal and count them in the
   ratchet. Run per library, screenshot before/after at 1280 / 768 / 375, review diffs over a threshold by hand.
3. **Remaining literals**: line-height onto the type tokens (most are paired with a font size), radius onto
   `--tc-radius-*` and the pattern radii, the 50 blurred shadows onto `shadow-raised` / `shadow-overlay`. Lower the
   ratchet baseline after each.

### Phase 5 – Design follow-ups (decision C: as recommended)

1. glass-folder `open` prop; app-shell and assistant-home use it instead of copying hover classes.
2. Demo paths for the unseen states (item 14), then a runtime "selector never matched" pass across them and
   delete what stays unmatched.
3. Apply decision C:
   - breakdown-chart: a segment palette at ≥ 3:1 against the background in both themes, with pattern fills or
     separators so neighbouring segments don't rely on colour alone;
   - fan-out-grid cells and agent-queue backlog squares: 24 px hit areas (padding or a pseudo-element; the
     visible square stays 12 px);
   - date-range-picker: an in-range band at ≥ 3:1 against the calendar background in both looks and themes;
   - context-map: no change.

   Re-run `npm run check:contrast` and the axe scan after each.

### Phase 6 – Verification nobody has done yet (M)

1. Forced colours: test Windows High Contrast / `forced-colors: active` on the pattern components first (Button,
   fields, menus, switches, segmented control, focus rings); add `forced-colors` rules where borders or state
   disappear.
2. Screen readers: VoiceOver (Safari) and NVDA (Firefox) on the components with live regions and custom keyboard
   patterns – toaster, combobox, command-menu, data-table, date-range-picker, agent-tree, review-center.
3. Run the perf bench in Firefox and WebKit through Playwright, and with 4× CPU throttling; record INP for the
   heavy interactions (combobox open, command-menu typing, data-table sort).
4. Build a sample app with webpack and Next.js to confirm tree-shaking and the production warning strip.

## Decisions (2026-10-25)

| | Question | Decision |
|---|---|---|
| A | Ship single-look files (breaking: `look="clean"` on a Standard file stops working)? | **Yes.** Each file carries only its own look's CSS; CHANGELOG gets a breaking-change note |
| B | Which way do the half-step font sizes fold? | **Round down:** 11.5 → 11, 12.5 → 12, 13.5 → 13 px, in both looks |
| C | The judgement calls in item 15 | **As recommended:** fix breakdown-chart's palette, the fan-out-grid and agent-queue targets and the date-range band; keep context-map's tiles as they are (name and kind are in the hover/focus card) |

## Order and rough size

| Phase | Depends on | Effort |
|---|---|---|
| 1 Measurements | – | 0.5 day |
| 2 Runtime | 1 (to confirm gains) | 1 day |
| 3 Bundle | 1 | 1 day |
| 4 Scales | – | 2–3 days (spacing is most of it) |
| 5 Follow-ups | – | 1 day |
| 6 Verification | 2–5 | 1–2 days, partly manual |

Phases 2 and 3 can run in parallel; so can 4 and 5 (different files except the screens).
