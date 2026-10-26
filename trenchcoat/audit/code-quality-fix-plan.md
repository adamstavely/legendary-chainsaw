# Code-quality fix plan

Fixes for the findings in [code-quality-review.md](code-quality-review.md) (IDs H1–H12 and themes 1–11 refer to that report). Accessibility fixes from [WCAG-2.2-AA-audit.md](WCAG-2.2-AA-audit.md) touch the same files, so the plan sequences them together where it saves a second pass.

## The core problem to solve first

Most issues are duplicated four ways:
- across the Standard and Clean forks (66% identical lines);
- across components, through ~15 copy-pasted helpers;
- inside each 700–1,800-line file;
- with no tests to catch regressions.

Fixing bugs file-by-file in the current shape means ~2× the work, and the copies drift apart again. But "one self-contained file you copy in" is the product's selling point, so we can't just introduce shared imports.

**Recommendation: author in a modular source tree, publish single files.**

- **Source:** `src/<component>/` with:
  - the component;
  - its CSS;
  - two theme token sets (`standard.css`, `clean.css`);
  - imports from `src/internal/` (shared hooks, formatters, icons).
- **Build:** bundles each component into exactly today's output. That's `<slug>.tsx` and `<slug>-clean.tsx`: self-contained, React-only, CSS injected, with the internals inlined.
  - Users see no change.
  - Every fix lands once.
  - Standard and Clean can't drift.
- **Clean becomes a theme**, not a fork: same logic and markup, different token values and a few CSS rules. Where clean genuinely differs, it becomes a prop with a per-theme default:
  - decision-tree follow-ups;
  - combobox and filter-menu "+N" folding;
  - approval-card default `actions`.

**How "look" is selected:**
- A `look` prop (`"standard" | "clean"`) renders `data-look` on the component's root.
- Without the prop, the look is inherited from an ancestor attribute, e.g. `<html data-tc-look="clean">`. This works the same way dark mode already does (`[data-theme="dark"]`).
- The CSS keys off it: `:where([data-tc-look="clean"]) .ui-button, .ui-button[data-look="clean"] { … }`.
- It's pure CSS, so it works across separately copied files with no shared React context. There's no hydration flash, and one page can still mix looks.
- Markup that only *moves* between looks is handled in CSS (grid areas/order), not JSX branches. That's most of the measured 26% logic-line difference: tray vs in-card labels, toolbars. Genuine behaviour differences become their own props.
- Cost: each file carries both CSS sets, roughly +30% file size. If that matters, the build can also emit single-look files.

This is the biggest investment (Phase 2) but makes every later phase cheaper. Phases 0–1 deliberately come first: they stop the bleeding in the current files, so nothing waits on the refactor.

---

## Phase 0 – Safety net (2–3 days)

The folder isn't under version control and has no tests, so nothing can be changed safely yet.

1. **Put the libraries under git.** Use one repo with `components/`, `blocks/`, `screens/`, `illustrations/` and `motion/`, plus the Trenchcoat app. Commit the current files untouched as the baseline.
2. **Test tooling:** Vitest + React Testing Library + `vitest-axe`, with jsdom. Add Playwright later for the layout-dependent pieces.
3. **Smoke test per component (both variants), generated from the gallery demos.** For each one:
   - render under `<StrictMode>`;
   - advance fake timers 10s;
   - assert no errors, no unhandled rejections, and a bounded render count;
   - unmount and assert no timers or rAF are left pending.

   This alone would have caught H1, H2 and H3.
4. **Lint gate:** typescript-eslint + react-hooks. Add a custom rule or grep check that bans:
   - new `eslint-disable react-hooks/exhaustive-deps` without a comment;
   - `Date.now()`/`new Date()`/`navigator` at render time;
   - hard-coded `id="…"`.
5. **CSS prefix registry check:** a script that fails if two components share a root class. This catches H4 permanently.
6. **CI** running typecheck, lint, tests and the prefix check on every push.

**Exit:** the baseline is committed and CI is green with the known failures marked `todo`.

**Status (2026-10-24): done.** Repo at `~/Lockin/trenchcoat`. 178 smoke cases pass; 10 known smoke failures (context-map, agent-tree, usage-meter and ai-answer re-render on most frames; progress-tracker calls `onChange` during render; glow-keyboard leaks timers) and 10 bug reproductions (H2, H3, H5, two Tab traps × both styles) run as `test.fails`.

## Phase 1 – Critical bug fixes in place (1–1.5 weeks)

Fix each issue directly in both the Standard and Clean files, each with a regression test first. These are small, contained edits.

| Fix | What changes |
|---|---|
| **H1 context-map loop** | Give the rAF effect real dependencies (target signature); only call `setFrame` while `moving`; stop the loop when settled. Test: idle component renders ≤ 2 times in 1s. |
| **H2 billing-schedule loop** | Keep `onChange` in a ref; fire from the change handlers, not from an effect; don't fire on mount. Test: `onChange={s => setS(s)}` renders a bounded number of times. |
| **H3 thinking-state restart** | Key the timeline effect on a stable signature (`steps.map(s => s.id ?? s.label).join()`), not array identity; appending a step continues instead of restarting. |
| **H4 CSS prefix collisions** | Phase 0's prefix check found **10** collisions, not 2. Rename one side of each: agent-ledger → `ui-alg`, context-map → `ui-cxm` (and their clean forms), plus `ui-ad` (autonomy-dial / blocks/app-directory), `ui-gc` (ghosted-chat / glow-cloud), `ui-ob` (outreach-branches / screens/onboarding), `ui-sf` (stepper-form / side-folder), `ui-tc` (tool-call-card / tilt-card), `ui-tw` (trace-waterfall / testimonial-wall). Each fix removes an entry from `KNOWN` in `scripts/check-prefixes.mjs`. |
| **H5 decision-tree stuck state** | `.catch` → clear `picked`, show an inline error; same for every promise-taking callback (approval-card, context-window). |
| **H6 writing-assistant** | Remove the auto-sent canned fallback; on mic error show an error and do nothing else. Add `try/catch/finally` around `respond`; clear `busy` on failure; cancel pending replies on reset/unmount. |
| **H7 Undo that lies** | Add `onUndo` (email-draft, comments-panel); the Undo button only appears when it's provided. Otherwise show a plain confirmation. |
| **H8 / H9 / fake success** | Put simulations behind an explicit `demo` prop (chat-composer dictation and approvals, dropzone uploads, message-actions speech, integration-settings key, writing-assistant replies, comments-panel edits). Without handlers, controls are hidden or disabled, never faked. Clipboard "Copied" only after the write resolves. The gallery demos pass `demo`. |
| **H11 agent-queue / H12 agent-tree** | Equality-check before `setLinks`/`setTick`; drive the per-frame visuals by writing to the DOM/CSS variables (agent-graph already does this); throttle state updates to what changes visibly. |
| **Data-table + command-menu Tab traps** (a11y Critical, same files) | Let Tab leave the grid/menu. Done here because the files are open anyway. |
| **Edge-case bugs** (theme 10) | kpi-chart empty/negative data; date-range-picker midnight normalisation and Feb 29; billing-schedule yearly proration and month overflow; breakdown-chart numeric dimension compare; email-draft regex escaping; agent-ledger redo dependencies; plan-vs-actual cycle guard; agent-cursors per-pin reply draft; otp-input timer race; toaster re-show within 420ms. Each gets a unit test. |

**Exit:** every High item and the theme 10 list is fixed, with a test in both variants. Ship this as a release, since users benefit before the refactor.

## Phase 2 – Single source, two themes (3–4 weeks)

1. **Build pipeline.** A script (esbuild or Rollup + a small plugin) that:
   - bundles `src/<component>/index.tsx` and `src/internal/*` into one file;
   - inlines the CSS string;
   - emits `<slug>.tsx` (standard tokens) and `<slug>-clean.tsx` (clean tokens);
   - keeps `"use client"`, the header comment and readable formatting (output stays TSX source, not minified).
   - **Golden test:** the generated files typecheck standalone with React as the only import.
2. **Extract `src/internal/`.** One tested module each for:
   - `useControllable(value, defaultValue, onChange)`, the single controlled/uncontrolled rule (`value !== undefined`);
   - `useClock(interval, { pauseWhenHidden })`, using IntersectionObserver + `document.hidden` (fixes theme 1's always-on intervals);
   - `useRolling` / `useTween`, rewritten to write a CSS variable or text node instead of setState per frame;
   - `useSmoothHeight`, FLIP/`glide`, ghost (exit) list;
   - `useOutsideClick`, `useEscape`, `reducedMotion()`;
   - formatters (`took`, `dollars`, `ago`, number/date with a `locale` prop instead of hard-coded en-US);
   - `useRestoreFocus` / `moveFocusBeforeRemove` (also fixes a11y S4 in ~40 components);
   - shared brand-logo SVGs.
3. **Migrate components one at a time**, smallest first to prove the pipeline: button → change-summary → segmented-control → … → review-center. For each:
   - move it into `src/`;
   - merge the Clean fork into theme tokens and CSS overrides;
   - turn real behaviour differences into props;
   - swap the copied helpers for `internal/`;
   - regenerate both files;
   - diff the rendered output in the Trenchcoat gallery (Playwright screenshot per variant) to confirm there's no visual change.
4. **Fold in the a11y token fixes while migrating.** The focus ring, muted/faint text, and Clean's hairline and selected-state contrast are now single token edits per theme.

**Exit:** all 65 components are built from one source each.

**Status (2026-10-24): done.** 64 components are built from `src/components/` (plan-vs-actual stays Clean-only, hand-written). Token migration first: every library file moved onto the `--tc-` dictionary (`tokens/tokens.css`), reviewed screenshot by screenshot in both looks and themes. Then the forks were merged with `scripts/merge-css.mjs` (exact-parity CSS merge, scaffold) and hand-merged JSX/logic; both published files match their pre-merge forks pixel for pixel except for animation timing (326 of 374 screenshots identical, the rest timing-only in live demos), and several groups also compared DOM output under scripted interaction. Shared helpers: reduced-motion, ease, use-smooth-height, use-rolling, use-controllable (for Phase 3). The copied-helper count is 0 and the Standard/Clean logic diff is 0.

## Phase 3 – One API contract (2 weeks, overlaps Phase 2's tail)

Write `CONTRIBUTING.md` with the contract, then apply it component by component. Each item cites the theme it fixes.

1. **Controlled/uncontrolled (themes 4, H10):** every stateful prop gets `x`/`defaultX`/`onXChange` via `useControllable`. Props copied into state now sync. Callbacks never decide control.
2. **Async (theme 5):**
   - callbacks may return a promise;
   - components show pending, error and retry states;
   - long operations receive an `AbortSignal` (dropzone uploads, compaction, generate key);
   - state is never set after unmount.
3. **Render purity (theme 2):**
   - no layout reads, ref writes or clock reads during render;
   - time comes from `useClock` (SSR-safe: renders a stable value, then ticks on the client).
4. **DOM integration (theme 7):**
   - forward `ref`;
   - spread rest props onto the root;
   - inputs take `name`, `disabled`, `required` and render a hidden input for native forms;
   - Enter handlers check `isComposing`.
5. **Global effects (theme 8):** keyboard shortcuts are opt-in props (`hotkey={false}` to disable), registered through one shared listener rather than per instance.
6. **IDs (theme 9):** `useId` everywhere; ids are never built from user data.
7. **Naming and units:**
   - `now` is always epoch ms with an internal clock fallback (fan-out-grid, plan-vs-actual);
   - callbacks use consistent verbs, with old names kept as deprecated aliases for one release.

**Exit:** a typed contract test (generated per component) asserts ref forwarding, rest props, className passthrough and controlled sync.

**Status (2026-10-24): done.** All 64 built components follow the contract in `CONTRIBUTING.md`; each has a spec in `tests/contract/`, and a coverage test fails if one is missing. Breaking changes and deprecated aliases are in `CHANGELOG.md`. `useControllable` warns in development when a value is controlled without its handler. Clock/environment reads in render went down across the agent components; fan-out-grid's one new read is its intended internal clock (in an effect). Screenshots against Phase 2: 357 of 374 identical; the rest are live demos caught at a different moment. Left for Phase 4: one shared hotkey registry and root-ref merge helper in `src/internal` (each component has its own copy now), and the few callbacks still synchronous (agent-queue `onPromote`/`onCancel`, agent-cursors `onAccept`/`onReject`/`onResolveComment`, agent-steering `onPause`/`onResume`).

## Phase 4 – Performance and size (1–2 weeks)

1. **Render budgets** measured in the smoke tests, e.g. ≤ 5 renders/s while animating and 0 while idle off-screen.
2. **Fix the remaining hot spots:**
   - tool-call-card: memoise JSON parse/highlight;
   - data-table: memoised rows, with virtualisation above ~200 rows;
   - agent-graph: index calls by node instead of filtering the full history;
   - agent-ledger: precompute chains once;
   - inline-diff: cap and debounce the LCS diff while streaming;
   - decision-tree / agent-cursors / Button: no-deps layout effects become ResizeObserver-driven.
3. **Split the giant functions:** review-center, chat-composer, agent-cursors, agent-graph, agent-queue, agent-plan and stepper-form become sub-components in `src/`. The build still emits one file.

**Status (2026-10-24): done.** Demo commits in 5 simulated seconds: 2,311 → 1,009 (render budgets updated); clocks, tweens and progress write to the DOM and pause off-screen. All listed hot spots are fixed (memoised JSON highlight, data-table memo rows + windowing above 200, agent-graph call index, agent-ledger chain cache, capped/throttled inline-diff, keyed or ResizeObserver-driven layout effects). The giant functions are split; three files sit slightly above 300 lines (combobox 334, memory-panel 332, writing-assistant 323). `useOnScreen` is shared through `src/internal`; still duplicated with different shapes: the DOM-writing rolling numbers (`useRollingText` in context-window, experiment-card, memory-panel, prompt-library; model-picker's `RollingNumber`; compact-breakdown's tween) and the live-text tickers (agent-plan, agent-steering, agent-tree, tool-call-card, thinking-state, trace-waterfall, approval-card) – unifying them is follow-up work, and `useRolling` can go once they're merged. Ratchet: unexplained eslint-disables 57 → 39, clock reads 180 → 170. Screenshots: 352 of 374 identical to Phase 3; the rest are live demos at another moment (trace-waterfall's demo now runs at 1×).

## Phase 5 – Blocks, Screens, Illustrations, Motion (1–2 weeks)

They haven't been reviewed yet. Run the same tooling pass and manual review on the 58 files. Then move them onto the same `src/` + build model; they already import components through `@/components/ui/*`. Pin the Hugeicons dependency and note it in each Screen's header.

**Status (2026-10-25): done.** All 58 files reviewed and fixed against the review's themes and the component contract; each has a contract spec (coverage enforced) and the bugs found have regression tests. They stay hand-written single-look files (the `src/` build exists to merge Standard/Clean forks, which these don't have); shared helpers are copied inline. Icons are Lucide (pinned 1.55.0, listed in each screen's header). Demo commits 1,009 → 898; screenshots unchanged against Phase 4 apart from live-demo timing. Breaking changes and deprecations are in `CHANGELOG.md`.

---

## Timeline (one developer)

| Phase | Effort | Can ship |
|---|---|---|
| 0 Safety net | 2–3 days | – |
| 1 Critical fixes | 1–1.5 weeks | ✅ patch release |
| 2 Single source + themes | 3–4 weeks | ✅ (output files unchanged for users) |
| 3 API contract | ~2 weeks (overlaps 2) | ✅ minor release with deprecations |
| 4 Performance + size | 1–2 weeks | ✅ |
| 5 Other libraries | 1–2 weeks | ✅ |

**Total ≈ 9–12 weeks.** Two developers can parallelise Phase 2 migrations after the first three components prove the pipeline.

## Decisions needed before starting

1. **Keep "copy a single file" distribution?** This plan assumes yes; the build step preserves it. If an npm package is acceptable instead, Phase 2 is simpler: no inlining build, just shared imports.
2. **Clean as a theme of the same component** (recommended) vs keeping two forks. The fork option keeps Phase 2 short but every future fix stays 2×.
3. **Behaviour changes to defaults** (Phase 1, fake success → `demo` prop) are breaking for anyone relying on the simulations. Ship them as a major version, or keep them on by default for one release with a console warning.
4. **Where the repo lives** (GitHub org, name `trenchcoat`?) and whether the Trenchcoat gallery doubles as the visual-regression harness.
