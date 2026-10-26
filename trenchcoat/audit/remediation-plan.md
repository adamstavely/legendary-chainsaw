# Combined remediation plan – design review + bundle and performance

2026-10-25 · Covers what is still open from [design-review/README.md](design-review/README.md) and
[bundle-and-performance-audit.md](bundle-and-performance-audit.md), checked against the code at `5244f1b`.
Planning only – nothing here has been started. Every decision is made (see "Decisions"); nothing is open
before or during the work.

**Direction.** Trenchcoat is built as a package (not published to npm) for apps in React and other frameworks, so
the components, illustrations and motion move to **Lit 3 web components** ([lit-port-plan.md](lit-port-plan.md)).
`src/` becomes the only source; the generated `components/` folder and its `-clean` copies go away, and the look is
chosen with the `look` property. How real apps receive the package is
decided after this plan is done (the build and the `examples/` apps install the packed tarball locally); nothing in
the plan depends on it.

**Order.** The work splits in three:

- **Part 1 – work that carries over to Lit unchanged** (CSS, tokens, data and plain TypeScript), done first on the
  current React source, so the port starts from the finished design.
- **Part 2 – the shift to Lit**, which also absorbs everything whose form changes with Lit (the package build,
  the gallery look switch, the CI checks, the demos, the measurements and the verification), so none of it is
  done twice.
- **Part 3 – new components**, 17 of them for agents and AI chat, built directly as Lit elements once Part 2's
  foundations exist, so none is written twice.

**Not in this plan: blocks and screens.** They get their own phase after Parts 1 and 2 are done, planned then. Until
that phase they're left as they are – React, in `blocks/` and `screens/`, on the React components – and every step
here keeps them building and passing CI. What waits for that phase is listed under "Later: blocks and screens".

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

"Part" says where each item is done: 1 = carry-over work, 2 = the shift to Lit, later = the blocks and screens
phase. Item 16 is split: forced
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
| 13 | glass-folder has no `open` prop; app-shell and assistant-home copy its hover styles | Design follow-up | 2 screens | XS | 2 (the prop); later (the screens using it) |
| 14 | States no demo shows (stepper-form review/success, ai-workspace projects, client-context empty/create, decision-tree sub-questions) | Design follow-up | CSS nobody has looked at; can't tell dead from live | M | 2 (stepper-form, decision-tree); later (the two blocks) |
| 15 | Design judgement calls | Design + WCAG | breakdown-chart palette (1.6–2.5:1), fan-out-grid and agent-queue 12 px targets, date-range band (< 3:1), context-map colour-only tiles | S | 1 |
| 16 | Not tested | Both | Screen readers (VoiceOver, NVDA); forced colours (0 `forced-colors` rules); Safari and Firefox; throttled CPU / INP; webpack and Next.js builds | M | 1 + 2 |

## Plan

Each step is one commit (or a few), with `npm run ci` green before the next starts. Each part is one pull request
into `main`: Part 1 on `trenchcoat-remediation-plan` (which already carries the trenchcoat files), Part 2 on a
branch from `main` after Part 1 is merged.

### Step 0 – Working copy

- Work in `~/Documents/GitHub/legendary-chainsaw` (access granted 2026-10-25). `main` there already has
  `trenchcoat/` (pull request #2 merged the planning branch) and, beside it, `icon-composer/`.
- **Never touch `icon-composer/`.** It's a separate project in the same repo: no edits, moves, deletes, formatting,
  lint fixes or commits under it. Every command, search-and-replace, formatter, linter and `git add` is scoped to
  `trenchcoat/` (no `git add -A` at the repo root); when `main` is merged into a working branch, `icon-composer/`
  changes come along as they are.
- Bring `trenchcoat-remediation-plan` up to date with `main` (it has two plan commits `main` doesn't), and do Part 1
  on it.
- Retire the separate `trenchcoat/.git` in `~/Lockin/legendary-chainsaw`: save its history as a bundle
  (`git bundle create trenchcoat-history.bundle --all`, kept outside the repo), then stop using that copy. From here
  on commits go straight to legendary-chainsaw instead of being copied over.
- `npm ci` and `npm run ci` in `trenchcoat/` to confirm the clone is green before Part 1.

## Part 1 – Work that carries over to Lit unchanged

Done on the current React source of the components, illustrations and motion – not blocks or screens. Changes go
into `src/`, `illustrations/` and `motion/` and are rebuilt into `components/` with `npm run build:lib`, exactly as
today; the CI checks are unchanged (their counts for blocks and screens stay where they are). Everything here is
CSS, tokens, data or plain TypeScript, so it moves to Lit as is.

### 1.0 Delete frost-cloud and glow-cloud

The two cloud illustrations are dropped rather than reworked or ported. Delete `illustrations/frost-cloud.tsx` and
`illustrations/glow-cloud.tsx`, their gallery demos (`app/src/demos/illustrations/`), their contract specs and
regression tests, their entries in `tests/regressions/illustrations-i1-theme.test.tsx`, `tests/render-budgets.json`
and `illustrations/README.md`, and lower the ratchet baseline if it counted them. Nothing else imports them.
CHANGELOG: removed. Done first, so no later step spends time on them; the audits keep their historical mentions.

### 1.1 Type scale (decision B: round down)

Fold 11.5 → 11, 12.5 → 12 and 13.5 → 13 px in both looks. Blocks and screens still use `--tc-font-size-xs-plus`,
`-sm-plus` and `-md-plus` (116 uses), so those tokens stay in tokens.css, marked deprecated, until the later phase
removes them; check-tokens fails on any new use outside blocks and screens. Check the WCAG audit's minimum text sizes and the contrast check still pass at the
smaller sizes, and let the visual snapshots show the diff before committing.

### 1.2 Spacing

Adopt `--tc-space-*` for padding, gap and margin (2,338 literal declarations, 13 token uses today). Do it
mechanically like the duration pass: snap literals within ±1 px to the 4 px ladder (2 px half-step allowed), leave
the rest literal and count them in the ratchet. Run per library (components, illustrations, motion), screenshot
before/after at 1280 / 768 / 375, review
diffs over a threshold by hand.

### 1.3 Remaining literals

Line-height onto the type tokens (most are paired with a font size), radius onto `--tc-radius-*` and the pattern
radii, the 50 blurred shadows onto `shadow-raised` / `shadow-overlay`. Lower the ratchet baseline after each.

### 1.4 Decision C (as recommended)

- breakdown-chart: a segment palette at ≥ 3:1 against the background in both themes, with pattern fills or
  separators so neighbouring segments don't rely on colour alone;
- fan-out-grid cells and agent-queue backlog squares: 24 px hit areas (padding or a pseudo-element; the visible
  square stays 12 px); *done as (2026-10-26, user's choice): squares 24 px apart, since overlapping 24 px areas
  wouldn't meet 2.5.8 – agent-queue's squares get a 24 px pseudo-element, fan-out-grid's grid picks the cell within
  12 px of a click in the gap;*
- date-range-picker: an in-range band at ≥ 3:1 against the calendar background in both looks and themes;
- context-map: no change.

Re-run `npm run check:contrast` and the axe scan after each.

### 1.5 Shimmers on `transform`

The 8 remaining `background-position` sweeps (agent-tree, comment-thread, context-window, context-map, dropzone,
thinking-state, tool-call-card, writing-assistant) → the `transform: translateX` pseudo-element used in
fan-out-grid. Add a ratchet count for `background-position` in keyframes so it stays at 0.

*Done differently (2026-10-25):* all 8 shine across text (`background-clip: text`), which a moving pseudo-element
can't reproduce without changing how they look. Each is one label, runs 3 cycles and pauses off-screen, so the cost
the perf audit measured (hundreds of per-item box sweeps, now on `transform`) doesn't apply. context-window's sweep
was the one that ran forever; it now runs 3 cycles. The ratchet counts `background-position` animations (17 today: the 8
components in both looks, plus motion's gradient-text), so no new ones are added.

### 1.6 inline-diff: Myers diff

Replace the capped LCS table with Myers O(ND), so long texts stay word-by-word and the diff is cheaper at 1,000
words. It's a plain function (`diffWords`), so it moves to Lit unchanged; its regression tests cover the output.

### 1.7 Illustration size

region-dach: one module per region (loaded on demand) plus simplified neighbour outlines (−60–80 %). project-flow:
the 4 base64 PNG avatars and the logo → inline SVG or separate files (~−35 KB gz).

*Done as (2026-10-26):* region-dach's paths simplified rather than split into modules – splitting would break the
single-file illustration, and simplification alone takes the file from 167 to 82 KB (path data 130 → 45 KB);
project-flow's avatars re-encoded as WebP (58.5 → 12.3 KB of base64), which keeps it one file; 137 → 90 KB.

### 1.8 Forced colours

Test `forced-colors: active` (Windows High Contrast, or Chromium's emulation) on the pattern components first –
Button, fields, menus, switches, segmented control, focus rings – then the rest; add `forced-colors` rules where
borders, state or focus disappear. These rules are CSS and move to Lit unchanged; the Lit components are re-checked
in 2.8.

*Done as (2026-10-26):* one shared rule block instead of per-component rules, checked with Chromium's
forced-colours emulation on all 64 components: buttons, fields, switches and comboboxes get a system-colour edge,
popups and tablists an outline, selected / pressed / checked / current items Highlight (opting out of the text
backplate), switch knobs ButtonText. Still not tested on real Windows High Contrast themes.

## Part 2 – The shift to Lit

The toolchain (Lit 3, TypeScript with standard decorators, ts-lit-plugin in the editor, lit-analyzer in CI), the
pilot components and the questions they settle are in [lit-port-plan.md](lit-port-plan.md). Everything whose form
changes with Lit is done here.

### 2.1 React baseline measurements

Move the perf bench from the session scratchpad into `scripts/perf/` (it will otherwise be lost) and record the
React numbers the port is compared against: per-component size, data-table at 10,000 rows, combobox at 5,000
options, fan-out-grid and trace-waterfall CPU at 1,000 / 5,000 items, off-screen animation count, mount time per
instance. React render budgets without demo timers are dropped (Lit has its own update cycle – see 2.7).

### 2.2 One source, no `components/`

- Move the one component that exists only in `components/` – `components/plan-vs-actual-clean.tsx`, hand-written
  and Clean only – to `src/components/plan-vs-actual.tsx`.
- Point `@components/*` (vite.config.ts `LIBS`, tsconfig.json `paths`; 65 demo and 66 test files) and the
  `@/components/ui/*` resolver (26 block, screen and illustration files) at `src/components/`, so blocks and screens
  keep importing the React components from there.
- Gallery: `app/src/registry.ts` reads `src/components/`; the components README moves to `src/components/README.md`
  with one entry per component.
- Tests run each spec against the one source in both looks instead of loading `<slug>.tsx` and `<slug>-clean.tsx`.
- Delete `components/`, `scripts/build-lib.mjs`, `check:lib` and its CI step. No app uses Trenchcoat yet, so
  breaking changes need no deprecation period; CHANGELOG records them, and the package starts at 0.1.0.

Done first, so the React components in `src/components/` and the Lit elements in `src/elements/` sit side by side
while the port runs, with one copy of each.

### 2.3 Toolchain and pilot components

The first steps of [lit-port-plan.md](lit-port-plan.md): set up Lit 3, TypeScript standard decorators,
ts-lit-plugin, lit-analyzer, the Lit ESLint rules, the manifest analyzer and Vitest browser mode in `npm run ci`;
then port Button, Combobox and Data Table for real into `src/elements/`, with the `examples/` apps for React and
Next.js, Vue and Nuxt, Angular, Svelte and plain HTML. The pilot proves the decided patterns (light DOM, slot-marked
child content, `tc-value-change`, form association, one adopted stylesheet per element, `@lit/react` wrappers, no
SSR in v1, the row-window controller) against the acceptance checks in that plan, and records them – with code
samples and the measured time per component – in `audit/lit-patterns.md`. About 7 days.

### 2.4 Foundations

- The remaining `src/internal` helpers as reactive controllers (root ref, hotkeys, on-screen, focus rescue, smooth
  height, the row window; the value-property controller comes from the pilot).
- An app-wide default look with `@lit/context` (in place of the planned React provider).
- The CI checks (ratchet, tokens, prefixes, contrast) read CSS from Lit's `` css`…` `` templates as well as the
  React `/* css */` strings, so they hold during the port and after it.
- **The package build:** Vite library mode, one module per element, type declarations, `custom-elements.json`, the
  generated `@lit/react` wrappers as a `react` entry, `tokens.css` as the one stylesheet apps import. package.json
  keeps `"private": true` (so it can't be published by accident), `"license": "UNLICENSED"` (proprietary),
  `"version": "0.1.0"`, `exports` for the elements (components, illustrations and motion), the React wrappers and
  `tokens.css`, `"sideEffects": ["*.css"]`, a `files` list; Lit is a dependency and React a peer dependency of the
  `react` entry only. CI runs `npm pack`, keeps the tarball as a build artifact, and builds the gallery and the
  `examples/` apps against it, so a broken export fails in CI.

### 2.5 Gallery look switch

Rework the existing Standard / Clean / Both switch (`app/src/App.tsx`), which picks files today, to set the `look`
property on the demo's element; Both renders the same element twice. It's remembered per viewer, applies only to
entries with both looks, and a deep link can carry `?look=clean`. The overview lists each component once.

### 2.6 Port the components

The other 61 components, simplest first, then menus and fields, then the large agent views, following the pilot's
patterns. With each component: its tests rewritten for the new harness, its demo moved to the element, the axe
scan, a screenshot diff against the React version, and then the React component deleted – except the 14 that
blocks and screens import (agent-plan, approval-card, button, chat-composer, data-table, filter-menu, inline-diff,
kpi-chart, segmented-control, setup-guide, thinking-loader, thinking-state, tool-call-card, usage-meter). Those
React versions stay, frozen (no new features; fixes only if a block or screen breaks), with their existing tests,
until the later phase moves blocks and screens off them. Folded into the port:

- **filter-menu windowing** – the row-window controller from the pilot, above ~300 options.

*Done differently (2026-10-26):* ported by 12 agents in parallel from `audit/port-brief.md`, after change-summary
was done by hand as the worked example; the shared lists (index, React wrappers, package entries) are generated
from the folder so ports never edit a shared file. combobox stays in React too (the pilot's comparison pages use
it), so 15 React components remain. filter-menu windows groups over 60 options, like data-table. The ports found
a bug in the pilot's wrapper helper (uncontrolled values reset on every parent render), fixed for all.

### 2.7 Illustrations and motion; demos; measurements

- Port the 22 illustrations and the 8 motion pieces to Lit elements, with the **glass-folder `open` property**
  (illustrations) added as part of its port. glass-folder's React version stays frozen, like the 14 components in
  2.6, because three screens import it.
- **Demo paths for the unseen states** (stepper-form review/success, decision-tree sub-questions), then a runtime
  "selector never matched" pass across the component, illustration and motion demos and delete what stays
  unmatched.
- Re-run the perf bench against the Lit package and compare with the 2.1 baseline; add a Lit update-count budget
  per component (static props, no demo timers) in place of the React render budgets.

*Done differently (2026-10-26):* the dead-CSS pass is static, not runtime – a rule is dead when nothing (element,
wrapper or a runtime-built class) can render its class; a state a demo doesn't reach still counts as live
(`scripts/dead-css.mjs`, in CI). Update budgets count idle updates of every element mounted without props
(`tests/elements/update-budgets.test.ts`). Results: `audit/perf-lit.md`.

### 2.8 Verification

- Axe in light and dark, both looks, every element, in Chromium, Firefox and WebKit.
- Forced colours re-checked on the elements (the 1.8 rules apply unchanged in light DOM).
- VoiceOver (Safari), run by Claude, on the components with live regions and custom keyboard patterns – toaster,
  combobox, command-menu, data-table, date-range-picker, agent-tree, review-center. NVDA isn't tested (a known gap; the WCAG
  audit's status line is updated to say so).
- The perf bench in Firefox and WebKit and with 4× CPU throttling; INP for combobox open, command-menu typing,
  data-table sort.
- The `examples/` apps (React and Next.js, Vue and Nuxt, Angular, Svelte, plain HTML) on every element:
  tree-shaking, `tokens.css`, client-only loading in Next.js and Nuxt, types and events, with webpack and Vite
  builds.

*Done differently (2026-10-26):* VoiceOver wasn't run – the session can read browser windows but not operate them –
so it needs a person; the WCAG audit says so. Forced colours are checked by a script over every control
(`scripts/forced-colors.mjs`) rather than by eye. Results: `audit/verification-part2.md`.

## Part 3 – New components

Built directly as Lit elements, after Part 2 – they use its toolchain, controllers, patterns (decisions L1–L16 in
[lit-port-plan.md](lit-port-plan.md)), test harness and package build. Each one gets what every ported component
has: both looks, light / dark / system, the pattern tokens and scales, keyboard support and ARIA from the WAI-ARIA
patterns, forced-colours support, `prefers-reduced-motion`, the value-property and event conventions, contract
tests, a gallery demo, the axe scan, an entry in `custom-elements.json` and a React wrapper. Part 3 is one pull
request, like the other parts.

### 3.1 Agents

| Component | What it is | Builds on |
|---|---|---|
| `tc-run-checkpoints` | A timeline of an agent run with restore points – "go back to step 4 and try again" – showing what each point captured and what restoring discards | agent-plan's step list, trace-waterfall's timeline |
| `tc-budget-guard` | Spend and token limits for a live run: progress against the cap, a warning as it nears it, a hard stop at it, and raising the cap from the warning | usage-meter covers plan usage, not live runs |
| `tc-handoff` | The agent hands control to a person mid-task with the context it has (what it did, why it stopped, what it needs), and takes it back when they're done | approval-card, permission-request |
| `tc-live-view` | A stream of the agent's screen (browser or computer use) with its clicks and typing drawn on top, a step caption, and Pause / Take over | agent-cursors' pointer and typing overlays |
| `tc-sandbox-log` | Command output from an agent's sandbox: one collapsible block per step with the command, exit code and duration, streaming text, ANSI colours mapped to tokens, copy and search; windowed for long logs | tool-call-card, the row-window controller |
| `tc-artifact-panel` | The files, code and documents a run produced: a list, a preview per type (text, code, image, table), versions with a diff between them, download | inline-diff, the streaming code block (3.2) |
| `tc-run-compare` | Two runs, or two prompt versions, side by side – outputs, steps, cost and time – with the differences highlighted | inline-diff; screens/evals does this as a screen |
| `tc-tool-permissions` | A matrix of which agent may use which tools and scopes (allow / ask / deny per cell), with presets and a summary of what changed | permission-request covers asking at run time, not setup |
| `tc-trigger-builder` | "Run when X happens, or every Monday at 9": event or schedule, conditions, a plain-language summary and the next run times | date-range-picker, combobox, filter-menu |

### 3.2 AI & chat

| Component | What it is | Builds on |
|---|---|---|
| `tc-context-tray` | Chips for the files, @-mentions and sources in context, each with its token weight; remove, pin, and a total against the window | context-window shows totals, not individual attachments |
| `tc-mention-picker` | The slash-command and @-mention picker inside the composer: grouped results, keyboard navigation, inserts a chip | command-menu, combobox; used by chat-composer |
| `tc-conversation-branches` | Edit a past message and switch between the forks: "2 / 3" switcher on the edited message, the branch's messages below | message-actions |
| `tc-chat-history` | The conversation list: search, pinning, folders, rename and delete with undo, grouped by date; windowed | filter-menu, the row-window controller |
| `tc-voice-mode` | The voice conversation controller: live transcript, speaking / listening state, interrupt, mute, end; captions for every turn | writing-assistant's dictation; voice-orb is only the visual |
| `tc-answer-arena` | Two models' answers to the same prompt side by side, streamed together, with "A is better / B is better / tie" and a reason | ai-answer, model-picker |
| `tc-code-block` | A streaming code block: syntax colours from tokens, Copy, Apply, and a diff against the current file before applying | inline-diff |
| `tc-image-grid` | Generated images: a grid of variations, upscale, regenerate one tile, compare, download; alt text for each | dropzone's preview |

### 3.3 Order

Agents first, in the order of the tables, starting with the ones that build on ported pieces; within 3.2,
`tc-mention-picker` and `tc-context-tray` first, since chat-composer uses them. `tc-code-block` comes before
`tc-artifact-panel`, which uses it. Each component is one commit with its tests, demo and CHANGELOG entry.

## Decisions (2026-10-25)

| | Question | Decision |
|---|---|---|
| A | How do the looks ship? | **Revised: one npm package, one module per component carrying both looks, chosen with the `look` property.** `src/` is the only source; `components/` and the `-clean` copies are deleted; the gallery gets a look switch. (Was: single-look files – that suited copy-paste files, not a package.) |
| D | What is the component layer? | **Lit 3 web components**, in TypeScript with standard decorators, ts-lit-plugin in the editor and lit-analyzer in CI. Committed – no spike; three pilot components (step 2.3) prove the patterns. Stencil was compared and dropped. The element patterns (light DOM, content, values, forms, React wrappers, no SSR in v1, windowing, tests, `tc-` tags) are decisions L1–L16 in [lit-port-plan.md](lit-port-plan.md). |
| E | In what order? | **Carry-over work first (Part 1), then the shift to Lit (Part 2)**, which absorbs everything whose form changes with Lit. |
| F | What moves to Lit? | **In this plan:** the 64 components, the 22 illustrations and the 8 motion pieces. frost-cloud and glow-cloud are deleted, not ported (step 1.0). **Blocks and screens** are out of this plan and get their own phase afterwards. The gallery stays React. |
| G | Distribution | **Not published to npm.** The package is built and packed (`"private": true`); how apps receive it is decided after the plan is done. |
| H | License and version | **Proprietary** (`"license": "UNLICENSED"`), starting at **0.1.0**. No app uses Trenchcoat yet, so breaking changes need no deprecation period. |
| I | Working copy and PRs | **`~/Documents/GitHub/legendary-chainsaw`**, with trenchcoat's separate `.git` retired (step 0). **One pull request per part.** `icon-composer/` in the same repo is never touched. |
| J | Frameworks | React 19 and Next.js, Vue 3 and Nuxt, Angular, Svelte 5 and plain HTML, each with an `examples/` app |
| K | Screen readers | **VoiceOver only, run by Claude.** NVDA isn't tested – a known gap. |
| L | New components | **17 new components** (9 for agents, 8 for AI & chat), built as Lit elements in Part 3, after Part 2 (2026-10-26). |
| B | Which way do the half-step font sizes fold? | **Round down:** 11.5 → 11, 12.5 → 12, 13.5 → 13 px, in both looks |
| C | The judgement calls in item 15 | **As recommended:** fix breakdown-chart's palette, the fan-out-grid and agent-queue targets and the date-range band; keep context-map's tiles as they are (name and kind are in the hover/focus card) |

## Order and rough size

| Step | Depends on | Effort |
|---|---|---|
| 0 Working copy | – | 0.5 day |
| **Part 1** | 0 | |
| 1.0 Delete the clouds | – | 0.5 hour |
| 1.1 Type scale | – | 0.5 day |
| 1.2 Spacing | 1.1 (same files, same screenshots) | 2 days |
| 1.3 Remaining literals | 1.1 | 1 day |
| 1.4 Decision C | – | 1 day |
| 1.5 Shimmers | – | 0.5 day |
| 1.6 Myers diff | – | 1 day |
| 1.7 Illustration size | – | 0.5 day |
| 1.8 Forced colours | 1.4 | 1 day |
| **Part 2** | Part 1 merged | |
| 2.1 Baseline | – | 0.5 day |
| 2.2 One source | – | 1 day |
| 2.3 Toolchain and pilot | 2.2 | 7 days |
| 2.4 Foundations | 2.3 | 3–4 days |
| 2.5 Look switch | 2.4 | 0.5 day |
| 2.6 Port components | 2.4 | 5–7 weeks, with tests |
| 2.7 Illustrations and motion; demos; measurements | 2.6 | 1 week |
| 2.8 Verification | 2.6, 2.7 | 3–5 days, partly manual |
| **Part 3** | Part 2 merged | |
| 3.1 Agents (9) | 2.4 | 3–4 weeks |
| 3.2 AI & chat (8) | 2.4 | 3–4 weeks |

Part 1 is about 7 days; 1.4–1.7 touch different files from 1.1–1.3 and can run alongside them. 2.1 can run during
Part 1 (it only measures). Part 2 is about 6–9 weeks for one developer; the pilot's measured time per component
refines it. Part 3 is about 6–8 weeks (17 components at 1.5–3 days each, with tests and demos); 3.1 and 3.2 touch
different files and can run in parallel.

## Later: blocks and screens

Planned when Parts 1, 2 and 3 are done. Recorded here so nothing is lost:

- Part 1's CSS work on blocks and screens: the type scale (then removing the three deprecated `-plus` font tokens),
  spacing and the remaining literals.
- Whether each block and screen becomes a Lit element or stays a React reference on the wrappers (the earlier
  recommendation: port logo-marquee, testimonial-wall, kpi-board and pricing-plans; keep the screens and the 7
  app-like blocks as React references).
- App Shell's primitives (Tabs, Popover, Dropdown / MenuList / MenuButton, SearchField, EmptyState, FileCard,
  SectionHead, the toast, ViewToggle, IconButton / SortButton / FilterButton) promoted to components or moved onto
  existing ones.
- app-shell and assistant-home using glass-folder's `open` property instead of copying its hover classes.
- Demo paths for ai-workspace's projects view and client-context's empty and create states.
- Moving blocks and screens off the 14 frozen React components and glass-folder, then deleting those React
  versions and the `@/components/ui/*` resolver.
- `lucide-react` in the screens.
