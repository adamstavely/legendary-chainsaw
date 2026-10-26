# affectUI — code-quality review

**Date:** 2026-10-24 · **Scope:** all 129 files in `affectui-components` (64 components × standard/clean + plan-vs-actual) · accessibility is covered separately in [WCAG-2.2-AA-audit.md](WCAG-2.2-AA-audit.md)

**Verdict:** carefully written, well-commented, type-clean code that is **demo-grade rather than library-grade**. Component-level craft is above typical UI-kit standard; the problems are in how the components plug into a real app — props ignored after mount, async failures swallowed, "fake success" defaults, whole-tree re-renders on clocks — plus a copy-paste architecture that doubles every fix.

## Method

- **Tooling over all 129 files:** `tsc --strict` with `noUnusedLocals/Parameters`, `noImplicitReturns`; ESLint with `typescript-eslint` recommended + `react-hooks` + complexity/size rules; duplication and size metrics; grep checks for timers, SSR access, suppressions.
- **Manual review** of every component's logic (CSS skipped), standard file in full and clean variant diffed with class prefixes normalised.
- The two most surprising findings (context-map render loop, CSS prefix collisions) were re-verified by hand.

## Measurements

| Metric | Result |
|---|---|
| TypeScript strict + unused + implicit-returns | **2 errors** in 129 files (trace-waterfall:348, harmless) — very clean |
| `any` / `@ts-ignore` | none in logic |
| `eslint-disable react-hooks/exhaustive-deps` | **88** suppressions — most deliberate and safe; the dangerous dep bugs are ones ESLint *doesn't* flag (see H2, H3) |
| ESLint complexity > 25 | 98 functions · functions > 300 lines: 56 |
| Size | 98,970 lines; median file 727; largest chat-composer (1,854), review-center (1,675, one ~930-line function) |
| CSS share per file | ~30% (inline `<style>` template string) |
| Standard ↔ clean similarity | median 66% of lines identical — they are forks, not themes |
| Helpers copy-pasted across components | `useSmoothHeight` (~6), `reduced()` (13), `took`/`dollars` (7), `useRolling`/`useTween` (4+), `Swap` (5), `glide`, `Highlight`, `ago`, `Avatar`, ~8 hand-rolled outside-click effects, brand SVGs |
| Tests | **none** |
| XSS | none — no `dangerouslySetInnerHTML`/`innerHTML`; markdown/citations/diffs built as React nodes ✅ |
| SSR | module-level `window` access is guarded ✅; but `Date.now()`/`new Date()`/`navigator` during render cause hydration mismatches in several components |

## High-severity issues

| # | Component | Issue |
|---|---|---|
| H1 | **context-map** | **Permanent 60fps re-render loop.** The rAF effect has no deps and `step` calls `setFrame` unconditionally → render → effect → frame → render… even when idle. Each frame also does an O(n²) target build and squarified layout. (`context-map.tsx:269-294`, same in clean) — *verified* |
| H2 | **billing-schedule** | **Infinite render loop** with the natural usage `onChange={s => setS(s)}`: `useEffect(() => onChange?.(…), [..., onChange])` re-fires on every new callback identity. Also fires on mount. (`:83-85`) — *verified during demo build* |
| H3 | **thinking-state** | `steps` array in the timeline effect's deps — a parent passing an inline array that re-renders (e.g. while streaming) restarts the sequence from zero; it may never finish. (`:89`) |
| H4 | **CSS prefix collisions** | `ui-al` is used by both **agent-lanes** and **agent-ledger**; `ui-cm` by both **command-menu** and **context-map** (and the `-c` clean forms). Shared sub-classes (`__bar`, `__title`, `__icon`, `__label`…) with different rules — on the same page each restyles the other. — *verified* |
| H5 | **decision-tree** | "Other…" path: `Promise.resolve(onChoose()).then()` with no catch — a rejection leaves `picked` set forever, nothing can be chosen again. (`:232-239`, both variants) |
| H6 | **writing-assistant** | On mic denial/network error it falls back to `simulate()`, which types a canned sentence and **auto-sends it** as if the user wrote it (`:199`, `:161`). `send` has no catch — a rejected `respond` leaves `busy` true forever. |
| H7 | **email-draft**, **comments-panel** | "Undo" after Send / after "Edit applied" only resets local UI — `onSend`/`onRunEdit` already fired and there's no `onUndo`, so the UI says undone while the action stands. |
| H8 | **chat-composer** | Mic never uses speech recognition — types a hard-coded sentence; "Connect apps" / "Request approval" flip to "granted" on a timer regardless of what happened; fully uncontrolled, no `className`. |
| H9 | **dropzone** | Without `onUpload` it silently simulates uploads and reports "uploaded"; `onUpload` gets no `AbortSignal`, so removing a row doesn't cancel. |
| H10 | **Props copied into state, never synced** | comment-thread, comments-panel, **data-table** (`rows`, despite `onRowsChange`), notification-stack (`notices`), memory-panel, email-draft, progress-tracker, setup-guide, tips-panel, reaction-bar, integration-picker/settings, decision-inbox — later prop updates (server data, realtime) are ignored. |
| H11 | **agent-queue** | rAF loop `setTick` ~30×/s whenever anything is queued; each re-render re-sorts, rebuilds placement and computes 96 depth samples × all jobs (grows with history). A controlled `openId` for an unplaced job fires `onOpenChange(null)` 30×/s. |
| H12 | **agent-tree** | follow loop re-measures and `setLinks(newArray)` every frame with no equality check → whole tree re-renders per frame, plus two no-deps layout effects reading offsets. |

## Medium-severity themes

1. **Render frequency isn't controlled.** Clocks/animation drive whole-component re-renders: agent-lanes 4Hz forever (never pauses off-screen), agent-plan / agent-steering / tool-call-card / trace-waterfall 10Hz while running (tool-call-card re-parses and re-highlights JSON each tick), `useRolling`/`useTween` setState every frame (memory-panel, model-picker, prompt-library, compact-breakdown, context-window, usage-meter), ai-answer per-frame typing (O(n²) over long answers). Only agent-graph writes the DOM directly from its loop — that pattern should be the norm.
2. **Impure render.** `getBoundingClientRect`/`offsetTop` in render (agent-inbox every 1s tick), ref mutation during render, `performance.now()`/`Date.now()` in render (agent-queue, plan-vs-actual, usage-meter, date-range-picker, command-menu, agent-steering). Works today; fragile under StrictMode, concurrent rendering and SSR.
3. **Layout thrash.** agent-cursors `measure()` after every render (Range rects, computed style walk, interleaved style writes); decision-tree creates a new ResizeObserver every render; Button's no-deps layout effect reads layout on every render of every button.
4. **Inconsistent controlled/uncontrolled contract.** Decided by `value !== undefined` (model-picker, segmented-control, experiment-card), by whether `onChange` is passed (memory-panel, project-card — passing a callback for analytics freezes the UI), controlled-only (agent-cursors `tab`, agent-plan `status`), or uncontrolled-only (billing-schedule, breakdown-chart, decision-inbox). Callback naming drifts: `onChange`, `onSelect`, `onRowsChange`, `onToggle`, `onReact`, `onTasksChange`. `now` is epoch ms in most agent components but job-relative in fan-out-grid and plan-vs-actual.
5. **Async without error/cancel paths.** No catch (comment-thread, integration-settings, writing-assistant), errors swallowed (context-window marks compacted on failure), no unmount guards (stepper-form, approval-card), no abort (dropzone). Promise support varies (approval-card/decision-tree/context-window accept promises; review-center ignores them).
6. **"Fake success" defaults.** Clipboard "Copied" shown even when the write fails (ai-answer, cited-answer, message-actions, prompt-library); fake speech (message-actions), fake API key (integration-settings), fake replies (writing-assistant), fake edit success (comments-panel). Demo data as defaults (email-draft, billing-schedule).
7. **No form or IME integration** in any input: no `name`/hidden input/ref forwarding/rest props (combobox, otp-input, segmented-control, date-range-picker, dropzone); Enter handlers never check `isComposing` (combobox, command-menu, integration-picker), otp-input overwrites mid-composition.
8. **Global side-effects per instance.** window Cmd/Ctrl+K (command-menu) and Cmd/Ctrl+/ (integration-picker) with unconditional `preventDefault`, no opt-out; toaster's module-level store (fine pattern, but toasts never expire without a mounted `<Toaster>`, no reset API for tests).
9. **Hard-coded / user-derived ids** instead of `useId`: billing-schedule `ui-bs-duration`, command-menu `ui-cm-spark` gradient, filter-menu/notification-stack/setup-guide ids from user data — collide with two instances.
10. **Edge-case correctness.** kpi-chart NaN with empty series and negative values drawn outside the plot; date-range-picker doesn't normalise to midnight (start day not highlighted when passed `new Date()`), Feb 29 → Mar 1 in "previous year"; billing-schedule charges a yearly product in full for a 1-month phase and overflows Jan 31 + 1 month; breakdown-chart numeric dimensions sum to 0 (strict compare vs `String()`); email-draft builds an unescaped regex from contact names; agent-ledger redo restores dependents but not dependencies; plan-vs-actual has no cycle guard (stack overflow on cyclic deps); agent-cursors shares one reply draft across all comment pins; otp-input error timers wipe the code during a later verification; toaster re-show with the same id within 420ms is immediately dismissed.
11. **Clean drift.** Variants are forks: decision-tree-clean has a different API (follow-ups, icons, ~230 differing logic lines); combobox-clean and filter-menu-clean collapse chips to "+N" (hidden items can't be removed); approval-card default `actions` differs; thinking-state timing differs. Most bugs exist in both, so every fix is needed twice.

## Strengths

- Strict-clean TypeScript, rich JSDoc on every prop, thorough header comments.
- Timers, observers and rAF loops are cleaned up far more often than not; ref-latest patterns avoid stale closures (inline-diff, data-table selection).
- Reduced motion respected everywhere, including JS animations; first-paint animation suppression is deliberate.
- No XSS surface; module-level browser access is SSR-guarded.
- `useId` used correctly almost everywhere.

## Recommendations

1. **Fix the High list** — especially H1 (context-map loop), H2 (billing-schedule loop), H4 (CSS prefix collisions), H5/H6 (stuck/auto-send), H7 (undo that lies).
2. **Extract a shared internal package** (`useControllable`, `useClock` that pauses off-screen, `useRolling` writing CSS vars instead of state, `useSmoothHeight`, FLIP/ghost helpers, outside-click, `reduced()`, formatters) so standard and clean import the same logic. Better still: **make clean a theme** (CSS variables on the same component) rather than a fork — that halves the code and ends drift.
3. **One API contract:** `value`/`defaultValue`/`onValueChange` decided by `value !== undefined`; async callbacks may return promises, with error states and `AbortSignal`; forward `ref` and rest props; `name` + form participation for inputs; `isComposing` guards.
4. **Remove fake-success defaults** or put them behind an explicit `demo` prop.
5. **Add tests**: unit tests for the pure helpers (date math, layout, diff, ledger chains), React Testing Library + axe for behaviour/a11y, and a StrictMode render test per component (would have caught H1/H2/H3).
