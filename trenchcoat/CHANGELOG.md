# Changelog

## Unreleased – remediation Part 2 (the shift to Lit)

See `audit/remediation-plan.md`, Part 2, and `audit/lit-port-plan.md`.

### Added

- Lit 3 web components: `tc-button`, `tc-combobox` and `tc-data-table` (the pilot), `tc-look-provider` for an
  app-wide default look, the shared controllers (row window, focus rescue, smooth height, off-screen, on-screen,
  ARIA forwarding, hotkeys, rolling numbers). Pixel-identical to the React components in both looks and themes.
- The package build (`npm run build:package`): ES modules per element, TypeScript declarations,
  `custom-elements.json`, React wrappers (`trenchcoat/react`, same API as the React components) and typed bindings
  for Vue (`trenchcoat/vue`) and Svelte (`trenchcoat/svelte`). Still private, 0.1.0, UNLICENSED.
- `examples/`: React, Next.js, Vue, Nuxt, Angular, Svelte and plain-HTML apps that install the packed package;
  `npm run examples` checks all seven.
- Every other component as an element (step 2.6): 61 more, 64 in all, each with its React wrapper under the same
  name and props in `trenchcoat/react`, browser tests in Chromium, Firefox and WebKit, and its gallery demo diffed
  against React in both looks and themes (all under 1 %; the remaining differences are demos that use
  `Math.random()` or a running clock). Import one element with `trenchcoat/<slug>`.
- The 22 illustrations and 8 motion pieces as elements (step 2.7), 105 tags in all; shimmer-loader is two
  (`tc-skeleton`, `tc-shimmer-text`). Same React names and props through `trenchcoat/react`; parity with the React
  versions at 0.00 % except voice-orb's canvas particles (timing) and tilt-card, which drops 3 px of line space
  under its inline-block root.
- glass-folder has an `open` property: the look its hover gives, on demand.
- filter-menu renders only the rows near the viewport in groups over 60 options (tested with 5,000).
- otp-input, dropzone and stepper-form's tags and choices are form controls (ElementInternals): they submit under
  `name`, honour `required`, reset and a disabled fieldset, and are named by a page `<label for>`.

### Breaking

- `components/` is gone: no more generated single-file components and no `-clean` copies. Each component is
  `src/components/<slug>.tsx` with both looks – set `look="clean"` for Clean. Components no longer carry token
  fallbacks or inlined helpers: load `tokens/tokens.css` (it also holds the theme and forced-colours rules they used
  to inline). `npm run build:lib` and `check:lib` are removed. plan-vs-actual (Clean only) is now
  `src/components/plan-vs-actual.tsx`. No app uses Trenchcoat yet, so there is no deprecation period.
- The React components are retired except the ones blocks and screens still import (agent-plan, approval-card,
  button, chat-composer, combobox, data-table, filter-menu, inline-diff, kpi-chart, segmented-control, setup-guide,
  thinking-loader, thinking-state, tool-call-card, usage-meter). Use `trenchcoat/react`: same names and props.
- The React illustrations and motion pieces are retired except glass-folder (three screens import it).
- model-wheel's `defaultModels` is `modelWheelDefaults` (chat-composer's wrapper exports `defaultModels`).
- Renamed types, so the package index can export every element's types: decision-inbox `Decision` →
  `InboxDecision`, plan-vs-actual `PlanStep` → `PlanVsActualStep`, agent-plan `PlanStep` / `PlanStepStatus` →
  `AgentPlanStep` / `AgentPlanStepStatus`. decision-tree keeps `Decision` on the wrapper.
- `ref` on a wrapper is the custom element. Where the React component had an imperative handle (review-center,
  inline-diff, decision-tree), the element has the same methods.
- A few callbacks get the native event instead of React's synthetic one: model-picker `onKeyDown`, toaster
  `ToastAction.onClick` (`preventDefault()` still works). Model-picker, toaster and review-center handle Escape or
  their shortcuts on the element first; a page's `onKeyDown` on the component sees them after (or not, for Escape
  while a menu or toast is open).
- React nodes passed as content (icons, avatars, approval-card previews, toast text, MessageText children) are
  rendered once in a hidden box and cloned into the element: they look the same, but event handlers inside them
  don't run. Plain strings are unaffected. stepper-form steps are the exception: they render through a portal and
  stay live React.

### Behaviour changes

- thinking-state no longer reports `onOpenChange(true)` on mount when `open` is held false; date-range-picker
  doesn't flash its "Last 30 days" stand-in before reading today; memory-panel with `undoFor={Infinity}` keeps a
  failure message instead of clearing it at once; dropzone keeps focus on a row while another row folds away (the
  React version lost it in real browsers).

## Unreleased – remediation Part 1 (design work that carries over to Lit)

See `audit/remediation-plan.md`, Part 1.

### Visible changes

- Type scale (decision B): text at 11.5, 12.5 and 13.5 px is now 11, 12 and 13 px in every component and
  illustration, and fields (`--tc-field-font-size`) are 13 px. `--tc-font-size-xs-plus`, `-sm-plus` and `-md-plus`
  are deprecated – only blocks and screens still use them – and check-tokens rejects new uses elsewhere.
- Spacing on the scale: padding, margin and gap in every component, illustration and motion piece use
  `--tc-space-*` (3,389 values that were already on the scale, 322 that were 1 px off it and moved by 1 px). What
  stays literal – 1 px, fractions, negatives and values 2 px or more off the scale – is counted by the ratchet's
  new "literal spacing" rule (448 in these libraries; blocks and screens are untouched).
- Line heights and radii on the scale (`scripts/apply-scales.mjs`): 12 values already on it and 56 that were 1 px off
  now use `--tc-line-height-*` / `--tc-radius-*` (in Clean-only rules, 5 px radii use Clean's
  `--tc-radius-badge`); memory-panel's cards use `--tc-shadow-raised`. Ratchet totals: line-height 151 → 109,
  radius 176 → 101, blurred shadow 50 → 46. Unitless line heights, illustration art shadows and values 2 px or more
  off the scale stay literal.

- Decision C: breakdown-chart's default palettes (and the gallery demo's colours) are at least 3:1 against the
  surface in both themes, with a 2 px gap between segments; date-range-picker's picked range is a 3:1 band
  (`--tc-date-range-picker-band`) with the day numbers still at 4.5:1 or more.
- fan-out-grid cells and agent-queue backlog squares stay 12 px but sit 24 px apart, and each takes clicks across
  24 px (WCAG 2.5.8) – the grids show fewer items per row.

- Smaller illustrations: region-dach's US, China, India, Brazil and Japan outlines are simplified
  (Ramer–Douglas–Peucker; the faded neighbours much more than the land), 167 → 82 KB of source, with a few islets
  under 2.5 units dropped from the neighbours; project-flow's four avatars are WebP instead of PNG, 137 → 90 KB.

- Forced colours (Windows High Contrast): every component carries one shared block (`scripts/tokens.mjs`
  `FORCED_RULES`, also in tokens.css section 3b) that gives buttons, fields, switches and comboboxes a system-colour
  edge (forced colours drop the box-shadows they used), outlines listboxes, menus, dialogs and tablists, shows
  selected / pressed / checked / current items in Highlight, draws switch knobs, and greys disabled controls. Only
  active under `@media (forced-colors: active)`; the normal looks don't change.

### Behaviour changes

- context-window: Clean's "Compacting…" shine runs 3 times and rests, like every other shimmer (it ran endlessly).
- inline-diff: `diffWords` uses Myers' O(ND) diff instead of a capped LCS table. Long texts stay word by word (a
  3,000-word text with 150 edits gives 150 changes, where anything over ~1,500 words used to become one
  replacement), and the work grows with the edits, not the length squared. Its third argument is now a work budget
  (tokens × edits); past it the middle is still one replacement.

### Removed

- illustrations/frost-cloud and illustrations/glow-cloud, with their demos and tests.

## Unreleased – accessibility and design pass, blocks, screens, illustrations, motion

All 187 published files now pass axe (WCAG 2.0–2.2 A/AA) in light and dark in a real browser, and every library
follows the same pattern tokens and scales as the components. Dark mode works the same through `.dark`,
`data-tc-theme` or the OS setting everywhere (dark-only colour rules: 247 → 0). Endless animations settle on their
own and pause off-screen.

### Visible changes

- Blocks use the library's Button and SegmentedControl, and the pattern tokens for fields, menus, switches, pills,
  cards and trays (decision 3).
- Screens use the components' own scale (decision 2): the App Shell's tabs, search fields, menus, toolbar buttons and
  cards are on the pattern tokens, and no screen restyles a component from outside or shrinks it with `zoom`, so
  components look the same in a screen as in their own demo. The workspace shells no longer scroll sideways.
- Illustrations follow the page theme (project-flow picks its dark scene from the colour scheme; voice-orb redraws
  on theme change).

### Behaviour changes

- illustrations/project-flow: without `theme` it follows the page theme (it used to default to light).
- App Shell Popover, Dropdown and MenuButton move focus into the menu on open and back to the trigger on close;
  the toast's status region is always mounted.
- motion: gradient-floor, gradient-text and grid-background settle after `playFor` (default 5 s, `Infinity` to
  loop); ShimmerText's default `duration` is 1.6 s; gradient-text's default light colour is darker (#ec4899).

### Added (all optional)

- kpi-chart `fill`, inline-diff `fill`, usage-meter `layout="wide"` – what screens used to force by overriding
  internals.
- Pause controls: blocks/logo-marquee and testimonial-wall `paused` / `defaultPaused` / `onPausedChange` /
  `pauseButton`.
- illustrations/layer-stack `rounds`, model-wheel `turns`; motion `playFor`; number-ticker accepts `aria-live`.
- App Shell Tabs `label`, `fullWidth`, `className`; Popover `role` and `label`.

## Unreleased – accessibility and design pass, components

Every component (both looks) now has 0 axe violations (WCAG 2.0–2.2 A/AA) in light and dark in a real browser,
and the audit's critical keyboard blockers are fixed (data-table and command-menu Tab traps, agent-cursors'
suggestion popover, context-map tiles). Components use the pattern tokens from `tokens/tokens.css` (controls,
fields, menus, pills, cards, trays, kbd, switches, segmented controls) and the duration, easing, type, radius and
z-index scales; dark mode works the same through `.dark`, `data-tc-theme` or the OS setting. See
`audit/design-review/README.md` for the decisions behind the visible changes.

### Visible changes

- Standard primary actions are flat ink everywhere (Button and every component's own primary).
- Button sizes come from the control tokens: Standard sm/md/lg 32/40/48 → 28/32/40 px (Clean unchanged).
- Fields show a ≥3:1 edge and a focus ring; focus rings everywhere use the focus tokens.
- Pills, kbd chips, switches, trays (inset 6 → 4 px in Standard) and cards follow one recipe per look.
- Endless shimmers, sweeps and glows run a few cycles and stop (and pause off-screen); state is never shown by
  colour alone (marks, edges, underlines, dash patterns).

### Behaviour changes

- toaster: toasts with an action don't auto-dismiss (`actionDuration`, default Infinity).
- segmented-control selects on pointer release, not press.
- writing-assistant: dictation fills the field and no longer sends by itself.
- data-table renders only the rows in view above 60 rows (was 200); combobox windows options above 300 matches;
  command-menu shows at most `maxRows` (default 200) results.
- Roles that promised a keyboard pattern they didn't implement were replaced: agent-tree (nested lists instead of
  tree), profile-menu (buttons instead of menu), comments-panel filters and experiment-card winners (`aria-pressed`
  buttons), setup-guide tasks (`role="checkbox"`), date-range-picker presets (toggle buttons).
- usage-meter: the `--tc-usage-meter-track`, `-fill` and `-action-bg-hover` custom properties are gone; it uses the
  meter and action tokens.

### Added (all optional)

- Pause controls: agent-graph `paused` / `defaultPaused` / `onPausedChange`, agent-lanes and progress-tracker
  Pause/Play buttons.
- Timing: approval-card `allowStopTimer` / `stopTimerLabel`, review-center `undoTimeout` and `shortcuts={false}`,
  memory-panel's Undo pauses on hover and focus.
- combobox `invalid`, otp-input `labelledBy`, stepper-form tags `autoComplete`, decision-tree Previous/Next buttons,
  inline-diff "Undo last decision", agent-plan Move up/down buttons, delegate-board click-to-assign.

## Unreleased – blocks, screens, illustrations, motion (code-quality Phase 5)

The single-look libraries now follow the same contract as components (`CONTRIBUTING.md`): `className`, DOM props
and `ref` on the root (screens pass them to the App Shell root), controllable state as `x` / `defaultX` /
`onXChange`, promise-aware async callbacks, timers and listeners cleaned up on unmount, and animations that pause
off-screen and in hidden tabs. Each file has a contract spec. React commits per 5 s across all demos: 1,009 → 898
(kpi-board 49 → 1, illustrations agent-team 43 → 1, screens agent-run 30 → 22). "affectUI" is now Trenchcoat
throughout.

### Breaking: values you pass now stay in control

| File | Prop now controlled | Starting value | Change handler |
|---|---|---|---|
| blocks/task-board | `tasks` | `defaultTasks` | `onTasksChange` (`onChange` deprecated) |
| blocks/ai-workspace | `conversations`, `projects` | `defaultConversations`, `defaultProjects` | `onConversationsChange`, `onProjectsChange` |
| illustrations/region-dach, world-map | `region`, `continent` (now warn without a handler unless `showSwitcher={false}`) | `defaultRegion`, `defaultContinent` | `onRegionChange`, `onContinentChange` |

### Behaviour changes

- blocks/app-directory: `onToggle` runs when the user clicks (not after the simulated delay) and may return a
  promise; a rejection leaves the app unchanged and shows an error.
- Decorative illustrations are `aria-hidden` unless given `label` (then `role="img"` with that name).
- illustrations/cover-flow: a controlled `index` only changes through `onIndexChange`; gestures no longer report
  every cover passing by.
- illustrations/voice-orb: the root forwards DOM props and `ref`; a caller's `onClick` runs first, and
  `preventDefault()` in it skips `onPress`.
- motion/tilt-card: a caller's pointer handlers run alongside the card's instead of being replaced.

### Deprecated (kept for one release)

- blocks/task-board `onChange` → `onTasksChange`
- illustrations/layer-stack `onChange` → `onIndexChange`

### Added

- Controllable props: screens/app-shell `collapsed`, `panelOpen`; screens crm/settings-billing `tab`, evals
  `version`, files `view`, integrations `connected`, onboarding `step`, analytics `period`; blocks agent-gallery
  `index`, pricing-plans `billing`, client-context `client`, invoice-credit `view`, metrics-dashboard `range`/`metric`,
  app-directory `connected`, kpi-board `range`/`segment`; illustrations layer-stack `index`.
- Promise-aware callbacks: screens onboarding `onComplete`, agent-run `onApprove`, assistant-home `onSend`; blocks
  invoice-credit `onIssue`, metrics-dashboard `onExport`, ai-workspace `respond`.
- blocks/metrics-dashboard `now` (epoch ms).

## Unreleased – performance (code-quality Phase 4)

Animated components no longer re-render React to move pixels: clocks, countdowns, progress bars, rolling numbers
and typing reveals write to the DOM (text nodes, CSS custom properties) and React renders only when structure or a
discrete label changes. Live clocks pause off-screen and in hidden tabs. Across the gallery's demos, React commits
in 5 simulated seconds went from 2,311 to 1,009 (e.g. context-window 84 → 3, compact-breakdown 82 → 5,
agent-steering 52 → 2, agent-lanes 51 → 5, trace-waterfall 51 → 8, tool-call-card 60 → 9). No-deps layout effects
that measured on every render are keyed or ResizeObserver-driven, and functions over ~300 lines are split into
named parts.

### Behaviour changes

- data-table renders only the rows in view above 200 rows (spacer rows keep the scroll height; `aria-rowcount` and
  `aria-rowindex` are set on every row).
- dropzone reports progress through `onChange` at most once a second (status changes are still reported at once).
- toaster: when several toasters share the hotkey, the newest one with a toast takes it; Ctrl/⌘ + the key no longer
  triggers it.

### Added

- agent-lanes `rate`: how fast its clock runs, in clock ms per real ms (0 with `now`, 1 without – as before).

## Unreleased – one API contract (code-quality Phase 3)

Every component built from `src/components/` now follows the contract in [CONTRIBUTING.md](CONTRIBUTING.md):
controlled/uncontrolled state through one rule, `className`/rest props/`ref` on the root, promise-aware async
callbacks, hydration-safe rendering, form fields on inputs, opt-out shortcuts and `useId` ids.

### Breaking: values you pass now stay in control

A value prop that is defined now **controls** the component. Before, several components copied it into state once and
ignored later changes, or decided control by whether a callback was passed. If you passed one of these as a starting
value, move it to the `default…` prop (or pass the change handler too). In development, a controlled value without
its change handler logs a warning naming the prop.

| Component | Prop now controlled | Starting value | Change handler |
|---|---|---|---|
| data-table | `rows` | `defaultRows` | `onRowsChange` |
| billing-schedule | `phase` | `defaultPhase` | `onPhaseChange` |
| project-card | `tasks`, `status` | `defaultTasks`, `defaultStatus` | `onTasksChange`, `onStatusChange` |
| memory-panel | `memories` | `defaultMemories` | `onChange` |

The same rule now applies to the props that used to be copied once (comment-thread, comments-panel,
notification-stack, email-draft, progress-tracker, setup-guide, tips-panel, reaction-bar, integration-picker,
integration-settings, decision-inbox, review-center) and to the local decision maps in agent-inbox, agent-lanes and
delegate-board: a decision you make is kept until the task you pass changes, then your data wins.

### Breaking: `now` is epoch ms everywhere

fan-out-grid and plan-vs-actual read `now` as epoch ms and tick on their own clock when it isn't passed. The old
meaning (ms from the start of the job, with job-relative task times) is `elapsed`. trace-waterfall without
`startedAt` still reads `now` the old way, deprecated in favour of `elapsed`.

### Deprecated (kept for one release)

- stepper-form `initialValues` → `defaultValues`; `initialStep` → `defaultStep`
- setup-guide `onChange` → `onDoneChange` (same arguments)
- cited-answer `defaultOpen` → `defaultPreview`
- trace-waterfall `now` without `startedAt` → `elapsed`

### Added

- `className`, DOM props and `ref` on every component root (components with an imperative handle – decision-tree,
  review-center, inline-diff – keep it).
- New controllable state (`x` / `defaultX` / `onXChange`) where a parent may want it, e.g. agent-cursors `tab` and
  `following`, agent-graph `selected`, agent-inbox `view` and `expanded`, agent-lanes `expanded`, agent-ledger
  `onUndoneChange`, agent-queue `paused` and `openId`, agent-steering `draft`, agent-tree `collapsed`.
- Async callbacks (send, run, approve, upload, retry, compact …) may return a promise: the component shows pending,
  and a rejection shows an error you can retry from. Long operations (chat-composer, command-menu, context-window,
  dropzone, integration-picker/-settings, message-actions, otp-input, stepper-form, writing-assistant) receive an
  `AbortSignal`.
- Inputs (combobox, otp-input, segmented-control, date-range-picker, dropzone, filter-menu, stepper-form …) take
  `name` (hidden input for native forms), `disabled` and `required`; Enter ignores IME composition.
- `hotkey` on command-menu, integration-picker and toaster: `false` turns the shortcut off, a string changes it; one
  listener per shortcut however many instances.
