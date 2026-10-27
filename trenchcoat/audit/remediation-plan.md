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
branch from `main` after Part 1 is merged, and so on – Part 3 (17 new components), Part 4 (a design-system page for
every component) and Part 5 (27 more components, including Trust & calibration) each on a branch from `main` after
the part before is merged.

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

*Done differently (2026-10-26):* built by 9 agents in parallel from `audit/new-component-brief.md` (pairs, with
code-block before artifact-panel in one agent), each one screenshotted in both looks and themes and at 320 px
against the components it builds on; committed one per component in the order above. chat-composer embeds
mention-picker and context-tray as opt-ins (`mentions`, `context`), so its default rendering – and its parity with
the React version blocks and screens still use – is unchanged. Verified like Part 2: axe on every gallery entry
in three engines and the forced-colours script (112 entries, 1,031 controls). Not done: VoiceOver (as in 2.8), and
the tokens the agents asked for (a syntax palette, `--tc-surface-well`, a solid accent, a popover z-index) – listed
in the PR.

## Part 4 – A design-system page for every component

Each gallery page (`#/<slug>`) today is the live demo, a name and one line. Part 4 turns it into a design-system
page – what the component is, when to use it and when not to, how it's built, its API, how to use it in each
framework, its accessibility – for all 122 elements (64 + 17 components, 30 illustrations and motion pieces, and the
sub-elements some components need). It comes before Part 5, so the 27 new components ship with pages from the
start. The gallery stays React (decision F).

**Most of a page is generated, so it can't drift from the code.** The API comes from `custom-elements.json` (built
from the elements' JSDoc), the React props from the wrappers' TypeScript types, the tokens from the element CSS,
and the examples are checked by the type checker and the example apps. Only the guidance – when to use, do and
don't, content, keyboard notes – is written by hand, in one file per component next to its demo.

### 4.1 Complete the manifest, and keep it complete

- Describe the 100 public properties that have no JSDoc description yet; mark internal members `@internal`.
- Document each element's component tokens (`--tc-<slug>-*`) with `@cssprop`, its `@slot`s and its public
  methods, so the manifest lists them (it lists no CSS properties today).
- Generate the React wrapper props: a small script reads `src/elements/react/*.ts` with the TypeScript compiler
  API and writes `dist/types/react-props.json` (name, type, default, description, controlled pairs such as
  `value` / `defaultValue` / `onChange`).
- **`npm run check:docs`** in CI: fails on a public property, attribute, event, slot or token without a description,
  on a component without a guidance file (4.3) or a demo, and on a guidance file that names a property the
  element doesn't have.

### 4.2 The page

One route per entry, in this order:

| Section | What it shows | Source |
|---|---|---|
| Header | Name, category, the one-line description, tag (`<tc-…>`), import line (`trenchcoat/<slug>`), React name, size (min + gzip), status (stable / new / frozen React twin) | registry, manifest, `scripts/perf` sizes |
| Live example | The demo with the look switch (Standard / Clean / both), theme (light / dark / system), width presets (320 / 480 / full) and Replay | today's demo |
| Overview | What it is and the problem it solves; **when to use**; **when not to use**, with the component to use instead | guidance file |
| Anatomy | The demo's parts labelled – an overlay of numbered callouts drawn from `data-anatomy` markers and the guidance file's list | guidance file + demo |
| Looks | Standard and Clean side by side, with what differs | both stages |
| Usage | Code for HTML, React, Vue, Angular and Svelte, in tabs with copy: the import, the element with its common properties, a controlled-value example where it has one, and handling its events | generated from the manifest; one hand-written example per component, type-checked |
| API | Properties and attributes (name, attribute, type, default, description, reflects), events (name, detail type, cancelable, when), slots, methods, CSS custom properties and the design tokens it reads | manifest |
| React | The wrapper's props, controlled and uncontrolled pairs, callbacks | `react-props.json` |
| Accessibility | The WAI-ARIA pattern, the keyboard table (key → action), focus behaviour, screen-reader announcements, forced colours, reduced motion | guidance file; pattern links |
| Content | Writing guidance: labels, empty and error text, tone | guidance file |
| Do / Don't | Two to four paired examples – live, small renders where they help | guidance file |
| Related | Components it builds on, uses, or is often used with | guidance file + the plan's "Builds on" |
| Changelog | Its entries in `CHANGELOG.md` | changelog, by tag |

A right-hand "On this page" index, deep links to every section (`#/<slug>/api`), and search that indexes page text.
Illustrations and motion get the same page with the sections that apply (no anatomy or keyboard where there's
nothing to operate).

### 4.3 Guidance files

`app/src/docs/<slug>.md` – Markdown with a small front matter (`pattern`, `related`, `anatomy`, `status`) and the
headings the page expects: Overview, When to use, When not to use, Keyboard, Screen readers, Content, Do, Don't.
Written for all 122 elements by parallel agents from a brief, each one checked against its element (the keyboard
table against the element's key handling and tests; "when not to use" pointing at a real alternative), with the
house voice of the README. The element header comments already hold much of this.

### 4.4 Foundations pages

Beside the component pages: Getting started (install, `tokens.css`, the look provider, frameworks), Looks, Themes,
Tokens (every token with its value in both looks and themes, contrast where it applies), Accessibility (what every
component guarantees, what isn't tested – VoiceOver), Patterns (values and events, forms, React wrappers, no SSR),
and the changelog.

### 4.5 Verification

`check:docs` green; every page renders in the smoke test; axe on the docs pages in three engines; the usage
examples type-checked (React, Vue) and run in the HTML example; a screenshot of every page in both themes reviewed
for layout.

*Done differently (2026-10-26):*
- **How it was built:** the page, the generator and the check were built first, with combobox as the reference
  page. Ten agents then wrote the other 112 guidance files from `audit/docs-brief.md`. 113 pages in all, including
  one for the look provider.
- **What documenting found:** reading every component against its README, comments and demo found six bugs, all
  fixed, and a list of mismatches to fix later, in `audit/docs-findings.md`.
- **Checks:** axe on every docs page in three engines; every page rendered in a test; the React examples
  type-checked by `check:docs`.
- **Not done:** a person reviewing the screenshots of every page. Pages were reviewed by the agents that wrote them,
  plus a spot check.

## Part 5 – More AI components, and trust & calibration

27 new components and one enhancement, built the way Part 3 was: Lit elements on Part 2's toolchain and patterns,
each with both looks, light / dark / system, the pattern tokens and scales, the WAI-ARIA keyboard pattern that fits,
forced colours, `prefers-reduced-motion`, cancelable `tc-*-change` events, browser tests in three engines, a gallery
demo, its docs page (Part 4: documented properties, events and tokens, plus its guidance file), the axe scan, a
`custom-elements.json` entry and a React wrapper. Built by parallel agents from
[new-component-brief.md](new-component-brief.md), one commit per component; one pull request for the part.

Sources: the gaps listed after Part 3 (quality, retrieval, safety, structured output, conversation), and the THEMIS
platform (`refactored-palm-tree/themis`: the ATHENA analysis interface, the THEMIS console screens and the service
specs). The THEMIS components form their own gallery category, **Trust & calibration** (5.6). They are built
domain-neutral (decision M): THEMIS's legal and intelligence vocabulary becomes defaults and labels, not
assumptions.

### 5.0 Foundations first

What Part 3 left for later, and what Part 5 needs from the start:

- **Shared helpers** into `src/elements/internal/`, replacing the copies in Part 3's elements: a roving-tabindex
  `ToolbarController` (voice-mode, answer-arena, code-block, live-view, context-tray), `copyText()`, `initials()`, a
  caret-geometry helper (mention-picker), the fold-away-on-removal ghost (context-window, combobox, context-tray), a
  token-to-milliseconds reader, and `internal/format.ts` for durations and money (parallel-attempts, run-compare).
- **Tokens** in `tokens.css` (both looks, light and dark, contrast-checked): a syntax palette `--tc-syntax-*`
  (code-block now, tool-call-card and structured-output next), `--tc-surface-well`, `--tc-accent-solid`,
  `--tc-z-popover`, a teal tone (ANSI cyan), the **source-type colours** `--tc-source-grounded / -model /
  -inferred` (5.6), and the **validity bands** `--tc-validity-high / -good / -aging / -stale` (5.6).
- **A layered-graph layout helper** (columns, edge routing, weak links dashed) for lineage-graph, shared with
  playbook-canvas.
- **Gallery:** a "Trust & calibration" category in `app/src/registry.ts`, and the README lines for all 27, added
  before the agents start (as in Part 3).

### 5.1 Quality & evaluation

| Component | What it is | Builds on |
|---|---|---|
| `tc-eval-scorecard` | A set of test cases run against prompt or model versions: pass / fail per case, the score trend across versions, filters by tag, and a failing case opened side by side with its expected answer | run-compare, data-table, kpi-chart |
| `tc-feedback-rubric` | Structured rating of an answer: rubric criteria with scales, the failure type (hallucination, missing context, wrong tone…), a correction editor for the ideal answer, and what gets sent – training and eval data, not a thumb | message-actions, segmented-control |

### 5.2 Retrieval & documents

| Component | What it is | Builds on |
|---|---|---|
| `tc-retrieval-inspector` | The chunks retrieved for an answer: score, source document and position, freshness (`tc-validity-badge`), which chunks the answer actually used, and misses the app reports; per-query, for debugging retrieval | cited-answer, trace-waterfall |
| `tc-extraction-review` | Fields extracted from a PDF or image, each linked to a highlighted box on the page, with a confidence per field and accept / correct / reject; keyboard moves field by field and the page follows | dropzone's preview, image-grid's compare, data-table |

### 5.3 Safety

| Component | What it is | Builds on |
|---|---|---|
| `tc-guardrail-notice` | Content blocked, redacted or rewritten by a policy: which policy, why, what changed (with personal data masked), and "Request review" – inline in a thread or as a banner | approval-card, permission-request |

### 5.4 Structured & generated output

| Component | What it is | Builds on |
|---|---|---|
| `tc-structured-output` | Streaming JSON as a collapsible, typed tree, validated against a JSON Schema as it arrives: missing and invalid fields flagged, copy as JSON or as code | code-block (syntax tokens), agent-tree's tree keyboard |
| `tc-generated-ui` | Renders a model's UI spec – tables, charts, metric tiles, forms, callouts – as the library's own elements, validating the spec and falling back to text for anything unknown; actions come back as events | data-table, kpi-chart, change-summary, stepper-form |

### 5.5 Conversation

| Component | What it is | Builds on |
|---|---|---|
| `tc-clarifying-questions` | The agent asks before it starts: two or three structured questions (choices, short text, "you decide"), answered in place and sent as one reply | stepper-form's choices, segmented-control |
| `tc-prompt-starters` | The empty-state suggestions and the follow-ups after an answer, personalised from context, as a keyboard-friendly list that fills or sends | chat-composer, mention-picker |
| `tc-model-settings` | The model's settings outside the model picker: analysis posture (persona), knowledge source (training only, retrieval, documents only), sampling with presets (Precise / Balanced / Exploratory) and the active instruction | model-picker, segmented-control; ATHENA's configuration panel |

### 5.6 Trust & calibration

From THEMIS. Components that keep people's reliance on AI matched to how well it actually performs, make every
output traceable to its evidence, and put policy and human review where they can be seen and tested. Built
domain-neutral (decision M).

**Calibrated reliance**

| Component | What it is | Builds on |
|---|---|---|
| `tc-claim-answer` | An answer marked up claim by claim: each claim's source type – grounded in a retrieved source, model knowledge, or inferred – its confidence and optional uncertainty kind (the world hasn't decided / we lack evidence / beyond the model), and a counter-position for every substantive answer; claims can be sent to the verification queue | cited-answer, ai-answer; ATHENA's message bubble, CVS/VERITAS, UCS/TYCHE |
| `tc-verification-queue` | The claims collected across a session, each marked verified externally, can't verify, incorrect or dismissed, with its source passage; an export stays blocked until the claims are reviewed | review-center, decision-inbox; ATHENA's queue and export gate |
| `tc-reflection-gate` | Prompts that make a person think before relying on an answer, in four modes: **intent** (the task, the decision it supports, the cost of being wrong), **prior** (what you believe and what would change your mind), **reformulate** (restate the answer in your own words and compare), **checkpoint** (name one claim you'll verify) | stepper-form's fields; ATHENA's gates |
| `tc-reliance-gauge` | Whether trust in the AI matches its performance: a reliance–accuracy dial with its trend, signals against spot-check and mandatory thresholds, overtrust and undertrust episodes, and the recommended review level | usage-meter, kpi-chart; THEMIS trust calibration (TCS/MIMIR) |
| `tc-disagreement-banner` | Today's answer contradicts an earlier answer on the same question: the two side by side with the difference highlighted, and dismiss or open the earlier session | run-compare's diff, inline-diff |
| `tc-synthesis-notes` | The person's own conclusions, assumptions and things still to verify, written apart from the model's output and exported with provenance | writing-assistant, memory-panel |

**Provenance & evidence**

| Component | What it is | Builds on |
|---|---|---|
| `tc-lineage-graph` | Where an output came from, as columns – run, turn, queries and tools, source chunks, claims, artifacts – with a node's record on click and weak links (a truncated context) dashed; a graph or an event-chain view | agent-graph, the layered-graph helper (5.0); THEMIS lineage (MOIRAI) |
| `tc-validity-badge` | Evidence freshness as a band (high, good, aging, stale) that decays over time, plus contested and superseded states – a badge, and a margin strip for a document's paragraphs | the validity tokens (5.0); THEMIS temporal validity (TVS/KAIROS) |
| `tc-provenance-summary` | What a document is made of: the share from sources, AI synthesis and original writing, per section and in total, with links into the lineage | breakdown-chart, compact-breakdown |
| `tc-correction-propagation` | A correction's reach: the other artifacts and released packages that cite the corrected claim, each with Review or Mark superseded – nothing rewritten automatically | agent-ledger, approval-card; THEMIS feedback (FGTS/ALETHEIA) |
| `tc-attestation-check` | Verify a signed evidence package by hash or file, locally: signature, chain integrity, what it covers, and a clear valid / invalid result | dropzone; THEMIS attestation verifier |
| `tc-run-manifest` | A run's reproducibility record: model, settings, instruction hash, corpus, intent and the verification summary, with export | context-window; ATHENA's session manifest |

**Governance & oversight**

| Component | What it is | Builds on |
|---|---|---|
| `tc-policy-simulator` | Dry-run an action against the policy set: the decision (allow, require approval, deny, hard stop), the rule that matched, the reason and a step-by-step rule trace; nothing executes | tool-permissions, trace-waterfall; THEMIS policy (PGS/NOMOS) |
| `tc-gate-config` | When a person decides: trigger conditions as switches, who reviews, what the reviewer sees, which actions they may take (approve, edit and approve, send back, escalate, reject), and why the gate is there | permission-request, segmented-control |
| `tc-coverage-matrix` | A heatmap of checks × components marking covered, partial and gap, with totals and a cell's detail – adversarial test coverage, controls, policies | tool-permissions' grid |
| `tc-kill-switch` | System posture and the emergency stop: the current state, active stops, a confirmed Stop that names what it halts, and resume | approval-card; THEMIS incidents |
| `tc-playbook-canvas` | An agent workflow by phase – trigger, intake, context, analysis, review – as steps you add, reorder and configure, with a gate step (`tc-gate-config`), versions and a dry run; the largest piece, built last (decision N) | run-checkpoints, delegate-board, the layered-graph helper |

**Enhancement:** approval-card gains THEMIS's decision detail – "Why you're seeing this", "If you approve / If
you deny", editable arguments and evidence chips – as optional properties. Its React version stays as blocks and
screens use it; the element and the wrapper change.

### 5.7 Order

1. **5.0 Foundations** – helpers, tokens, the graph helper, the gallery category and README lines.
2. **Calibrated reliance** – `tc-claim-answer` first (the queue, the banner and the gauge build on its claim model),
   then `tc-verification-queue`, `tc-reflection-gate`, `tc-disagreement-banner`, `tc-reliance-gauge`,
   `tc-synthesis-notes`.
3. **Provenance & evidence** – `tc-validity-badge` first (claim-answer and retrieval-inspector use it), then
   `tc-lineage-graph`, `tc-provenance-summary`, `tc-correction-propagation`, `tc-run-manifest`,
   `tc-attestation-check`.
4. **5.1–5.5**, alongside 2 and 3 – they touch different files. `tc-structured-output` before `tc-generated-ui`.
5. **Governance & oversight** – `tc-policy-simulator`, `tc-gate-config`, `tc-coverage-matrix`, `tc-kill-switch`, the
   approval-card enhancement, then `tc-playbook-canvas`.

### 5.8 Verification

As in 2.8 and Part 3, plus each component's docs page (Part 4): axe on every gallery entry in Chromium, Firefox and
WebKit; the forced-colours script; update budgets; every element in the examples' all-elements page; tree-shaking.
Windowed lists tested at 10,000 rows (verification-queue, retrieval-inspector, eval-scorecard). VoiceOver remains
for a person, with claim-answer, verification-queue, lineage-graph and playbook-canvas added to the list.

## Part 6 – Text selection, and the rest of THEMIS

Asked for on 2026-10-26, to start once the card-header sweep (`audit/style-drift.md`) has landed. Sources:
- **6.2–6.4:** a second pass over THEMIS – the ATHENA Intervention Catalog, `athena_drawer.html`,
  `trust-cell-reference.html`, the 60 console screenshots, the ConOps and the ADRs. 6.2 lists every candidate it
  found, ranked by value.
- **6.1:** the user's own requests.

Every new component follows the briefs Part 5 used: `new-component-brief.md`, `docs-brief.md`, `part5-brief.md` and
`style-drift.md`, including the card header. All are domain-neutral (decision M), and all are documented as they
are built. Their gallery categories:
- 6.1 goes in "AI & chat", except the text annotator and ISBN details, which go in "Inputs & controls", and stories and
  background tasks, which go in "Feedback & onboarding";
- 6.2 goes in "Trust & calibration".

### 6.0 Foundations

- **`internal/selection.ts`.** A controller that follows a text selection inside a host, by pointer and by
  keyboard (Shift + arrows, or a caret mode for read-only text). It reports the selected text, its offsets in the
  host's text and its rectangle. The three selection components below share it. The offsets survive a re-render
  because they are stored as text positions, not DOM ranges.
- **`internal/popover.ts`.** A floating toolbar or card anchored to a rectangle or an element. It flips at the
  viewport edges, uses `--tc-z-popover`, closes on Escape and returns focus. The selection toolbar, the
  translation card and the ISBN hover card use it.
- **Highlight colours:** `--tc-highlight-*` tokens (yellow, green, blue, pink, purple), each a fill plus an ink,
  valued per look and theme and checked by `check:contrast`. conversation-annotation's label colours move onto
  them.

### 6.1 Text selection

| Component | What it is | Builds on |
|---|---|---|
| `tc-text-annotator` | Select text in any document with the pointer or keyboard, then highlight it in a colour, add a comment, or copy it. Highlights are marks in the text; comments sit in a margin rail beside their highlight (below it when narrow). An annotation can be edited, resolved or removed, and the list can be filtered by colour or author. The value is `{ id, start, end, color, comment?, author?, at? }[]`. | 6.0, comment-thread, conversation-annotation's marks |
| `tc-response-selection` | In a model's answer, select a passage and act on it: Reply (quotes the passage into the composer), Ask why, or Request an edit (shorter, simpler, more formal, or your own words). The edit comes back as an inline diff the person accepts or rejects. Several quoted passages can go into one message. The app sends the request and returns the new text; the component never calls a model. | 6.0, ai-answer, inline-diff, chat-composer |
| `tc-selection-translate` | Select text and choose Translate: a card shows the translation for the chosen target language (remembered), the detected source language, Copy, Replace in place (when the text is editable) and Show original. The app translates through a cancelable event with an AbortSignal; the component shows loading, error and retry. | 6.0, the popover |
| `tc-isbn-details` | Finds ISBN-10 and ISBN-13 numbers in its text, with or without hyphens, and validates their check digits so lookalikes aren't marked. Each valid one becomes a focusable mark. Hovering or focusing it opens a card with the cover, title, authors, publisher, year, pages and the ISBN in both forms. The app supplies the details through an event or a resolver function; the component makes no network call and caches by ISBN. Invalid or unknown numbers show "No details for this ISBN". Also exports `parseIsbn()` / `isValidIsbn()`. | the popover |
| `tc-stories` | A row of story avatars like Instagram's. A gradient ring means there's something new; a quiet gray ring means it's been seen; there's an optional "add" tile. Activating one opens a modal viewer:<br>– segmented progress bars across the top;<br>– auto-advance, paused while held or focused;<br>– tap or click left / right, or ← →, to step through; Escape closes;<br>– swipe down to close on touch;<br>– it moves on to the next person's stories at the end.<br>Items can be an image, a video or a text card. Seen state is a property the app owns (cancelable `tc-seen-change`). The gradient is a token (`--tc-story-ring`), and reduced motion stops the auto-advance animation. | dialog's focus handling, the popover's layer |
| `tc-background-tasks` | Work that keeps running while the person does something else, such as an export, an upload, an agent run or a reindex. It has two parts:<br>– **an indicator** for the app's header: an icon with a count and a ring showing overall progress, which turns to a check or an alert when tasks finish or fail;<br>– **a panel** that opens from it, listing running, queued, done and failed tasks.<br>Each task shows its label, progress (or "working…" when the app doesn't know the progress), the time left as the app reports it, and its actions: cancel, retry, or open the result. Also: Clear finished, and finished tasks announced politely ("Export ready"). The app owns the tasks; the actions are cancelable events. Large lists are windowed. Unlike agent-queue, it isn't a throughput view of agent workers: it's the person's own jobs, at a glance. | the popover, progress-tracker's bars, notification-stack's announcements |

### 6.2 Trust & calibration – new components

Ranked by how many AI products outside THEMIS would use each one.

| Component | What it is | THEMIS source | Value |
|---|---|---|---|
| `tc-agreement-tracker` | How often the AI agreed with the person's framing versus pushed back, in this session. It turns amber after two or more agreements in a row and points to the counter-argument. | Catalog #12; trust-cell "Agreement rate" | High |
| `tc-confidence-brief` | A plain-language summary of an answer for people who weren't in the session:<br>– what we conclude;<br>– the kind of uncertainty;<br>– what would change it;<br>– the key assumptions;<br>– signs to watch;<br>– the track record on similar questions;<br>– a link to the provenance record. | v13 Consumer Package; UCS three-sentence translation | High |
| `tc-capability-notice` | A request falls where the AI is only partly proven (amber) or not proven (red). It can cap the confidence shown, show that someone was notified, and fold out a distance-from-usual score. | trust-cell Competence Axis | High |
| `tc-transcript-review` | Recorded audio or video with a transcript that follows playback. It shows timestamps, speakers, speech-recognition and translation confidence, and low-confidence segments marked, with "Send segment to verification". | screenshot 50; Catalog #10 | High |
| `tc-version-history` | The version timeline of an agent, prompt or workflow. Each version shows draft / active / deprecated, its author and time, and its changes listed by behaviour (+ added, − removed, ~ changed). | screenshot 42 | High |
| `tc-session-context-bar` | A strip that stays on screen with the session's declared terms – intent, knowledge mode, scope, review, posture, release limit, deadline and budget – with "+N more". | screenshots 10/11; Catalog #1, #2, #26 | Medium |
| `tc-reasoning-flags` | An inline marker on an answer for detected weak reasoning: circular reasoning, a hedge followed by a confident conclusion, self-contradiction, or more certainty than the evidence supports. It opens to explain. | trust-cell reasoning patterns | Medium |
| `tc-evidence-coverage` | For each source category: current, stale (with its age) or no coverage, with "Request coverage". It shows what an answer couldn't see. | athena_drawer collection status; ConOps §7 | Medium |
| `tc-review-conflict` | Two reviewers gave opposing verdicts. Both are shown, with who gave them, and a third person resolves the conflict with a reason or overrides it. A blind mode tells the reviewers only that a conflict exists. | Catalog #27, #28 | Medium |
| `tc-handoff-brief` | Work passing from one person to another: a summary, unresolved items and commitments made, each acknowledged by the receiver. The handoff is blocked if the receiver lacks access. | Catalog #27 | Medium |
| `tc-engagement-quality` | Whether reviews are genuine: an index built from reused boilerplate, time spent on the source before a verdict, batch dismissals and repeated commitments. It is presented as quality, not as a violation. | Catalog #25 | Medium |
| `tc-knowledge-promotion` | Promote a verified fact into shared team knowledge against a checklist (sign-off, no open dispute, a second reviewer, a confidence threshold). Disputed facts stay visible side by side. | trust-cell Memory | Low |
| `tc-friction-profile` | A mode switch (standard, elevated, deadline) that previews how each safeguard changes: shortened, deferred or tightened. | Catalog #26 | Low |

### 6.3 Enhancements to existing components

| Component | Enhancement | Source |
|---|---|---|
| claim-answer | Media source types (transcript, video, audio, image, OCR with its %) and memory source types (earlier session, team knowledge, agent finding), each with a confidence ceiling; a question-type tag (factual, analytical, predictive, opinion) | Catalog #7, #10; trust-cell Memory |
| verification-queue | Verdicts per source type, e.g. "Misrepresents source", "OCR misread" | Catalog #14 |
| reliance-gauge | A per-domain calibration table (well calibrated / over-confident / under-confident) and an agent ranking | IMG_9298; screenshot 21 |
| permission-request | Emergency scope: a required justification, an urgency window, a countdown banner and a review due afterwards | trust-cell Break-Glass |
| validity-badge | A "source changed since you used it" state | ConOps §6.2 |
| configuration-release-control | Gate suites (pass / fail / conditional), linked open findings, and waivers that expire | screenshot 58 |
| reflection-gate | A short single-field version for deadline mode | Catalog #26 |
| chat-history | Load an earlier session's structured summary as context, showing exactly what is active | trust-cell Memory |
| chat-composer | A toolbar row under the input, each part optional:<br>– a **model** switcher (model-picker's menu);<br>– **settings** (model-settings in a popover);<br>– the **prompt library** (prompt-library in a popover; picking one fills the input);<br>– a **page context** chip that connects or disconnects what's on the page, showing what's attached and that the model can see it;<br>– a one-line **disclaimer** under the input (`disclaimer`, e.g. "AI can make mistakes. Check important info."). | The user, 2026-10-26 |

### 6.4 Blocks

React blocks in `blocks/`, built on the Lit components through `trenchcoat/react` (decision O).

| Block | Composed of | Source |
|---|---|---|
| AI side pane | A chat drawer docked beside the page, with a thread about what's on it. It has a header (title, new chat, history, close), the conversation (ai-answer and claim-answer), and the extended chat-composer: model, settings, prompts, page context connected or disconnected, and the disclaimer. It resizes, collapses to a rail, opens with a shortcut, and works as an overlay sheet on narrow screens. Reflection-gate is available for high-stakes answers. | The user, 2026-10-26; athena_drawer.html |
| Red-team finding | Severity, failed invariants, scenario, evidence and a response timeline (agent-ledger) | screenshots 27/56 |
| Publish readiness | dialog and progress-tracker: what must pass before something is released | screenshot 44 |
| Uncertainty mix | breakdown-chart of where an answer's uncertainty comes from | IMG_9298 |
| Evidence gallery | image-grid with attestation state and linked-claim counts | screenshot 49 |
| Oversight home | kpi-chart and data-table: a role's home dashboard and service posture | screenshots 02–07, 30 |

### 6.5 Docs: every framework, browser support, size and performance

The pages lean on React:
- the Usage tabs default to React;
- there's a React section but none for any other framework;
- the header shows only the React import.

They also say nothing about which browsers work, and give sizes without the cost that matters. Every page gains
the following, as generated data, so it stays true. The parts that touch the docs files run alongside 6.0: they
change `app/src/docs/`, `scripts/gen-docs.mjs` and the foundations, not components.

- **Frameworks, equal footing:**
  - The header shows how to install and import in each framework. The Usage tabs remember the reader's choice and
    have no React default.
  - The React section becomes **Frameworks**, with a tab for each of React / Next.js, Vue / Nuxt, Angular,
    Svelte and HTML. Each tab shows:
    - how to pass data properties;
    - how to listen to the component's events, by their real names;
    - the controlled pattern, by calling `preventDefault()`, and two-way binding (`v-model`, `[(…)]`, `bind:`) for
      form components;
    - slots and children;
    - SSR notes for Next.js and Nuxt;
    - TypeScript typing.
  - The snippets are generated from the manifest, as now (`usage.ts`), and each framework's snippet is
    type-checked or compiled in its `examples/` app so they can't rot.
  - A new **Frameworks** foundations page covers setup once per framework: CUSTOM_ELEMENTS_SCHEMA, Vue's
    `isCustomElement`, Svelte's typing, and Next's `"use client"`.
- **Browser support:**
  - Each page gets a **Browser support** table: Chrome / Edge, Firefox and Safari (macOS and iOS), with the minimum
    version that renders and works fully.
  - It's computed by a script that scans each component's CSS and code for the platform features it uses:
    `light-dark()`, container queries, `:has()`, `ElementInternals` form association, `adoptedStyleSheets` (with
    its fallback), `field-sizing`, `@starting-style`, `inert`, `<dialog>`, and so on. Each feature's floor comes
    from a checked-in table of feature to version, from MDN's browser-compat-data.
  - Features with a fallback (field-sizing grows a textarea and falls back to a fixed height) are listed as
    **progressive**, with what changes without them.
  - The three engines the tests run in (Chromium, Firefox, WebKit) are named as tested.
  - A **Browser support** foundations page gives the library-wide floor and the reasoning.
- **Size and performance:** a **Performance** section with:
  - **Bundle:** min and gzip for the component alone; the shared code it pulls in (Lit, `internal/*` and other
    components it renders, such as code-block inside tool-configuration); and the total cost of adding it to a
    page that already has Lit.
  - **Rendering:** first render and a typical update, measured in Chromium against `tests/render-budgets.json` and
    shown with the budget, plus how it scales. Windowed lists say how many rows were tested (10,000), and others say
    where they stop being practical.
  - **Runtime notes:** timers and animation loops (stopped when idle or hidden, and under reduced motion),
    observers, and whether it reads the clock.
  - The numbers come from a measured, checked-in data file regenerated by `npm run measure:perf`. Pages show when
    they were measured.
  - A **Performance** foundations page explains the measurements and the budgets.
- **Checks:** `check:docs` fails when a page's browser, framework or performance data is missing or stale. The
  browser feature table has a test that each listed feature is actually detected in at least one component.

### 6.6 Order

1. **6.0 Foundations,** then all of 6.1. The four selection components, stories and background tasks are
   the user's own requests.
2. **6.2, from the top of the table down.** transcript-review and version-history are the large ones.
3. **6.3.** Each enhancement is an optional property, so nothing breaks. chat-composer's toolbar goes first:
   the AI side pane needs it.
4. **6.4,** last, because the blocks compose finished components.

6.5 runs alongside steps 1–3: it changes the docs tooling and foundations, not components. New components pick up
its sections when their pages are generated.

### 6.7 Verification

As in 5.8:
- axe in three engines, forced colours, and docs pages through `check-docs`;
- the selection components tested by keyboard alone, and with screen-reader announcements for the toolbar and
  card;
- `parseIsbn` unit-tested against valid and invalid ISBN-10 and ISBN-13 numbers, including an X check digit.

## Part 7 – Terms dialog, skills in the chat composer, app picker, notifications, the top-right nav and the stories brief

Asked for on 2026-10-27, while Part 6 was in review. Built on branch `trenchcoat-part7`, its own PR, stacked on Part 6.
The brief is [part6-brief.md](part6-brief.md); the rules are the same.

- **7.1 `tc-terms-dialog`** – a modal for agreeing to terms. It covers:
  - first acceptance and re-acceptance of changed terms, with a short "what changed" summary;
  - sections you can jump to;
  - required consents;
  - Accept unlocked by reading to the end or by the consents;
  - Decline;
  - print or download.

  The app owns the text and the record: a cancelable `tc-accept` carries the version and the consents.
- **7.2 Skills in `tc-chat-composer`** – a `skills` property. Typing `/` at the start of the message opens a typeahead
  for finding skills:
  - name, description and source, grouped;
  - matching on name, description and keywords;
  - recently used skills first.

  Picking one puts a skill chip in the message, with its argument hint. The picked skill rides on `tc-send`. It uses
  `tc-mention-picker` underneath, improved where the picker falls short, rather than a second popup.
- **7.3 `tc-app-picker`** – the app launcher: a grid button that opens a popover of apps (icon and name). It has:
  - search;
  - pinned and recent apps;
  - an optional "all apps" link;
  - the current app marked;
  - grid arrow-key navigation.

  A pick fires a cancelable `tc-app-select`; links stay real links.
- **7.4 `tc-notifications`** – the notification center: a bell button with an unread badge that opens a panel. The panel
  has:
  - tabs or filters (All / Unread, optional categories), with items grouped by day;
  - per-item read state, actions and links;
  - mark all as read;
  - a settings link;
  - empty, loading and error states;
  - loading more.

  New arrivals are announced politely. The app owns the data; every change is a cancelable event. It's distinct
  from `tc-notification-stack`, which shows transient notices.
- **7.5 Block: top-right nav** – notifications | app picker | user avatar. The avatar opens `tc-profile-menu` in a
  popover. It shows how the three fit together in an app header, in both looks and at 320 px.
- **7.6 `tc-stories`, the viewer redesigned** (asked for on 2026-10-27): it opens a "what changed" brief, not a story
  player. A light modal with a bento of update tiles (metric, status, note, list, image, link) for a person or an
  account. Entries are stepped through with Previous and Next, with no timers.
- **7.7 A standalone gallery:** `standalone/trenchcoat-gallery.html`, the gallery as one HTML file that opens from disk.
  It isn't an npm script, by choice; it is rebuilt by hand when wanted.


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
| M | THEMIS vocabulary | **Domain-neutral.** Source types default to Sourced / Model knowledge / Inferred (THEMIS's GRND / PARAM / SYNTH as an option), the reliance index and thresholds are properties, and legal or intelligence terms are demo data only (2026-10-26) |
| N | Playbook canvas scope | **A component, built last** in Part 5 – an editor of phases and steps, not a free-form canvas; if it outgrows a component it moves to the blocks phase (2026-10-26) |
| O | New blocks | **React blocks on the Lit components** through `trenchcoat/react`, not on the frozen React versions (2026-10-26) |
| P | Card header | **On the tray in Standard, with a boxed 28 px icon on every card title**, through `internal/card-head.ts` (2026-10-26) |
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
| **Part 4** | Part 3 merged | |
| 4.0 Foundations (helpers, tokens, graph helper, gallery) | – | 3–4 days |
| 4.1–4.5 Quality, retrieval, safety, structured output, conversation (10) | 4.0 | 3–4 weeks |
| 4.6 Trust & calibration (17) | 4.0 | 5–7 weeks |
| Approval-card enhancement | 4.6 governance | 1 day |
| 4.8 Verification | 4.1–4.6 | 3–4 days |

Part 1 is about 7 days; 1.4–1.7 touch different files from 1.1–1.3 and can run alongside them. 2.1 can run during
Part 1 (it only measures). Part 2 is about 6–9 weeks for one developer; the pilot's measured time per component
refines it. Part 3 is about 6–8 weeks (17 components at 1.5–3 days each, with tests and demos); 3.1 and 3.2 touch
different files and can run in parallel. Part 4 is about 4–5 weeks for one developer, most of it the guidance files.
Part 5 is about 8–11 weeks of component work for one developer (27 components; lineage-graph, generated-ui,
extraction-review and playbook-canvas are the large ones at 4–6 days); run as Part 3 was, with parallel agents, the
elapsed time is a fraction of that.

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
