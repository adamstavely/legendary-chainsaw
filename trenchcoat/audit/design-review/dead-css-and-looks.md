# Dead CSS, and Standard vs Clean

Design review, part "dead-css-and-looks" · 2026-10-25 · read-only review: no library file was changed.
Scripts, raw data and captures are in the session scratch folder `design/deadcss/` (`static.mjs`, `dynamic.mjs`, `buckets.mjs`, `looks.mjs`, `signals.mjs`; data in `static.json`, `dyn.json`, `buckets.json`, `looks.json`, `signals.json`).

## Verdict

**Dead CSS: there is little *certainly* dead CSS; most of the "unused" CSS is CSS for features the gallery demos never show.**
Of 11,502 rules (≈2.2 MB of CSS source in 121 files), the static pass found 12 rules (2.2 KB) that can never match anything, plus 3 dead keyframes, 3 dead selector parts and one malformed rule. The dynamic pass ran every gallery entry in both looks. It played 30 s of each demo's script, hovered, focused and clicked every control, typed into every field, and repeated in dark mode and at 390 px. It never matched another 945 rules (139 KB, about 6% of all CSS). Almost all of those can still be reached through props or state the demos don't use, such as content blocks, error and empty states, later form steps, or a non-default `theme` or `size`. They are dead *for the demos*, not for the API. The real waste left over from the Standard/Clean merge is duplication more than dead rules: **200 look-scoped rule pairs are byte-identical in both looks (21 KB)** and could be a single unscoped rule.

**Standard vs Clean: Clean is a coherent, consistently applied design language, more consistent than Standard.**
Clean has clear, measurable rules that hold in nearly every component:
- buttons are 28 px tall in 37 of 37 button rules
- no font weight above 500 (0 exceptions)
- 0.5 px hairlines and `--tc-shadow-raised`/`--tc-shadow-overlay` instead of 1 px rings
- radii one step smaller
- the accent colour marks *state* (checks, toggles, progress, spinners, carets) and inverse black marks the primary *action*
- 10 px uppercase eyebrows

The accidental drift sits in a few places:
- **agent-inbox, approval-card and agent-cursors** have Clean CSS that is Standard with small tweaks (1 px rings, raw hex, off-spec buttons and cards).
- **Motion** is split: 14 components move Clean to `--tc-ease-emphasized`, and 7 do the opposite.
- **date-range-picker** inverts Clean's accent rule.
- Badges, tooltips and pressed toggles each have two or three competing Clean specs.

---

## Method

**Static pass.** For each file, the script finds every CSS template (`/* css */` literal) and parses it with postcss.
- Interpolations are kept as `0`.
- Classes and `data-*`/`aria-*` attributes from every selector part are checked against what the file's JSX can emit. That covers every string and template literal in the code; `${ROOT_CLASS}__x` and `` `ui-x--${kind}` `` resolve to exact names or prefix patterns.
- The emitted set also includes JSX attribute names, `dataset.*`, `setAttribute`, and the inlined `src/internal` hooks (for example `use-smooth-height` sets `data-smooth`).
- A blocks or screens file also counts the files it imports through `@/components/ui/*`.
- Ancestor hooks set by the consumer (`.dark`, `[data-theme]`, `[data-tc-theme]`, `[data-look]`) are treated as alive.
- "Certain dead" means every selector part references something nothing emits.

**Dynamic pass.** Playwright ran against a private Vite server on port 5534, with a fake clock and seeded `Math.random`.
- Each gallery entry renders both looks on one page.
- After mount, the script played 30 s of simulated time, sampling every 200 ms.
- It toggled `.dark`. Then, per stage, it hovered, focused and clicked up to 45 controls, typed `ab@c` into text fields, pressed ArrowDown and Escape, and sampled every 100 ms while menus and popovers were open.
- It then repeated this at 390 × 844 for 15 controls per stage.
- At each sample, every selector part of every stylesheet on the page was tested with `document.querySelector`. Dynamic pseudo-classes (`:hover`, `:focus*`, `:active`) and pseudo-elements were stripped, so a `:hover` rule counts as alive when its element exists.
- Results were aggregated over all entries, so a component rule used only inside a block or screen still counts as alive.
- Coverage: 120 of 121 files. **`toaster` was not covered**: its gallery page did not mount within 15 s under the fake clock.

**Unseen rules are sorted into buckets:**
- **(A)** consumer theme hooks
- **(B)** gated by `@container`, size media, `hover: none`/`pointer: coarse` or print. These can't be reached at 1280/390 px with a mouse, so they are *not dead*.
- **(C)** a look-scoped rule never matched, while the same base selector *did* match in the other look. These are candidates for merge leftovers.
- **(D)** everything else: props or state the demos don't reach.

| | Rules | Bytes |
|---|---:|---:|
| All CSS (121 files) | 11,502 | ≈2,220,000 |
| Certain dead (static) | 12 | 2,152 |
| Dead keyframes | 3 | 188 |
| Unseen, props/state-only (D) | 945 | 138,908 |
| Unseen, look-asymmetric (C) | 20 | 3,645 |
| Unseen but gated/hooks, not dead (A + B) | 142 | 12,191 |
| Byte-identical Standard/Clean pairs (duplication) | 200 pairs | 21,106 |

Of the D bucket, 626 rules (95 KB) are in components: 204 Clean-scoped (38 KB), 172 Standard-scoped (35 KB), the rest shared.

---

## Part 1 – Dead CSS

### High

None. No dead rule makes anything look wrong.

### Medium

**M1. 200 byte-identical look-scoped rule pairs (21.1 KB) are left over from the merge.**
When the two look files were merged, every rule that differed anywhere was split into a `[data-look="standard"]` copy and a `[data-look="clean"]` copy. In 200 cases both copies ended up with identical declarations. These are not dead, but they are pure duplication, and any later edit to one copy re-introduces drift.

| Component | Pairs | Bytes |
|---|---:|---:|
| chat-composer | 20 | 2,829 |
| review-center | 19 | 2,049 |
| trace-waterfall | 15 | 1,677 |
| combobox | 10 | 922 |
| context-window | 9 | 852 |
| experiment-card | 9 | 816 |
| date-range-picker | 8 | 789 |
| stepper-form | 7 | 775 |
| decision-tree | 8 | 757 |
| usage-meter | 7 | 733 |

Fix: collapse each identical pair into one unscoped rule. `scripts/merge-css.mjs` can do this mechanically: compare the declaration lists after stripping the `:where([data-look=…])` prefix.

**M2. Rich-content CSS that no demo exercises (bucket D, 139 KB): likely reachable by props, so verify before deleting.**
The largest blocks:
- **stepper-form**: 96 rules, 16.9 KB, 36% of its CSS. Tags input, choice cards, the review step, the success screen, the spinner and the submit error. The demo's validation stops the exerciser on step 1, so this is a coverage gap rather than evidence the CSS is dead. Add a demo path that reaches review and success.
- **project-flow**: 78 rules, 11 KB. The whole `.ui-pf[data-theme="dark"]` scene is reachable only with `theme="dark"`. The gallery's dark toggle doesn't switch it, because the illustration ignores `.dark` and `light-dark()`. That inconsistency is worth a look by the themes part of this review.
- **agent-cursors**: 55 rules, 7.8 KB. Tabs, table cards, tone pills, list blocks, floating figures and the reply error state; none are in the demo document.
- **decision-tree**: 47 rules, 5.9 KB. Sub-questions (`__sub*`, `__sopt*`), the empty state, failed and typing states.
- **agent-tree**: 35 rules, 5.6 KB.
- **context-map**: 30 rules, 5.7 KB.
- **client-context**: 31 rules, 5.3 KB. Create field, file chips, remove, the empty state.
- **ai-workspace**: 32 rules, 4.1 KB. The whole "projects" view: `__projects`, `__grid`, `__project-*`, `__rename`, the dialog.
- **otp-input**: 23 rules. **combobox**: 22. **onboarding**: 22. **trace-waterfall**: 21. **delegate-board**: 17. **agent-chat**: 17 (ad assets, activity list, empty brief). **kpi-board**: 16 (tooltip and tags: hover-driven SVG not reached by control hovering).

Fix: for each block, either add the state to the gallery demo, so the visual regression covers it, or delete it if the prop or state no longer exists. Per-file lists with line numbers are in `buckets.json` (key `D`).

**M3. Malformed rule at the end of `tool-call-card` CSS.**
The template ends with a dangling selector `:where(.dark, [data-theme="dark"]) .ui-tc,` followed by no block (src/components/tool-call-card.tsx, end of the `css` template). The rule just before it lists the same selector twice. Browsers drop the dangling selector, but the merge script left it there, and any CSS added after it would be swallowed. Fix: delete the tail and dedupe the selector list.

### Low – certain dead (safe to delete)

| File:line | Selector | Why | Bytes |
|---|---|---|---:|
| src/components/stepper-form.tsx:1565, 1567, 1569, 1580, 1581 | `.ui-sf__btn-secondary` (+`:hover`), both looks | The JSX renders only `__btn-ghost` and `__btn-primary`. This is a merge leftover in **both** looks. | 429 (3 rules entirely + 2 parts) |
| src/components/agent-cursors.tsx:1492–1493, 1721–1723 | `.ui-agc__note-mark` (+`svg`), base and Clean | The note header no longer renders a mark (`__note-head`/`__note-text` only). These are dead *parts* of rules shared with `__face-mark`. | ~180 |
| src/components/agent-tree.tsx:1008–1009 | `.ui-agt__sum-wait`, `.ui-agt__sum-fail` | Replaced by `.ui-agt__sum-btn[data-kind="waiting|failed"]` | 113 |
| src/components/approval-card.tsx:1171, 1184, 1197 | `.ui-ap__btn[data-pressed]` (3 parts) | Nothing sets `data-pressed` on approval-card's buttons. It was probably meant as press feedback for the ⌘↵/Esc hotkeys. Either set it in the hotkey handler or drop it. | ~60 |
| screens/evals.tsx:572–575 | `.ui-ev__input`, `__field`, `__field p`, `__foot` | Not rendered | 524 |
| screens/app-shell.tsx:2077 | `.ui-as-center` | Only referenced in a doc comment (line 1075) | 91 |
| illustrations/project-flow.tsx:164, 465 | `.ui-pf[data-theme] .pf-dots` | `pf-dots` is not in either scene's markup | 995 |
| src/components/agent-queue.tsx:1937, 1941 | `@keyframes ui-agq-pop`, `ui-agq-flow` | Never referenced | 143 |
| src/components/context-map.tsx:1136 | `@keyframes ui-cxm-in` | Never referenced | 45 |

**L1. Declarations overridden by a later rule with the same selector.** agent-cursors.tsx has 21 declarations (625 B) overridden by its "Clean: hairlines as shadows" block (line 1695 onwards). For example, `.ui-agc__tab` is defined at 1408 and redefined at 1706, and `.ui-agc__table-card` at 1419, 1709 and 1714. chat-composer has 1. Fix: fold the override block into the first Clean rule.

**L2. Look-asymmetric unseen rules (bucket C, 20 rules, 3.6 KB).**
These rules matched in one look but never in the other. I checked several of them in the JSX: data-table `__tool`, `__input` and `__logo--empty`; experiment-card `__action` and `__row`; tool-call-card `__copy[data-copied]`. That markup is look-agnostic, so these are exerciser-coverage artefacts (a different click order in the second stage), **not** merge leftovers. Nothing to fix. They are listed in `buckets.json` (key `C`) in case someone wants to confirm.

**L3. Hugeicons → Lucide.** I found no leftovers. No selector references Hugeicons-specific markup, and every icon rule in screens matched with the Lucide icons. The `/* Hugeicons Free (MIT…) */` comments in 12 components refer to inline SVG paths that are still in use.

### Per-file dead bytes (certain + unseen props/state + look-asymmetric; ≥400 B)

"Gated/hooks" is not dead and is not counted in the last column.

| File | Rules | CSS bytes | Certain dead | Unseen, props/state-only | Unseen, look-asymmetric | Gated/hooks (not dead) | Dead bytes |
|---|---:|---:|---:|---:|---:|---:|---:|
| src/components/stepper-form.tsx | 255 | 47388 | 3 / 429 B | 96 / 16901 B | – | 27 / 3036 B | 17330 B (36.6%) |
| illustrations/project-flow.tsx | 163 | 25723 | 2 / 995 B | 79 / 11003 B | – | – | 11998 B (46.6%) |
| src/components/agent-cursors.tsx | 301 | 49405 | – | 55 / 7754 B | 1 / 358 B | 15 / 1300 B | 8112 B (16.4%) |
| src/components/decision-tree.tsx | 188 | 36656 | – | 47 / 5928 B | – | 7 / 415 B | 5928 B (16.2%) |
| src/components/agent-tree.tsx | 130 | 25406 | 2 / 113 B | 35 / 5555 B | – | – | 5668 B (22.3%) |
| src/components/context-map.tsx | 157 | 35354 | – | 30 / 5664 B | – | – | 5664 B (16.0%) + keyframes 45 B |
| blocks/client-context.tsx | 183 | 29026 | – | 31 / 5299 B | – | 1 / 53 B | 5299 B (18.3%) |
| src/components/data-table.tsx | 154 | 30374 | – | 18 / 3196 B | 6 / 1066 B | 1 / 82 B | 4262 B (14.0%) |
| blocks/ai-workspace.tsx | 153 | 23766 | – | 32 / 4131 B | – | 12 / 1471 B | 4131 B (17.4%) |
| src/components/otp-input.tsx | 86 | 19864 | – | 23 / 3504 B | – | – | 3504 B (17.6%) |
| src/components/combobox.tsx | 128 | 24770 | – | 22 / 3400 B | – | 1 / 108 B | 3400 B (13.7%) |
| screens/onboarding.tsx | 153 | 25526 | – | 22 / 3196 B | – | 4 / 256 B | 3196 B (12.5%) |
| src/components/trace-waterfall.tsx | 204 | 43851 | – | 21 / 3152 B | – | – | 3152 B (7.2%) |
| src/components/delegate-board.tsx | 101 | 19208 | – | 17 / 3115 B | – | – | 3115 B (16.2%) |
| src/components/experiment-card.tsx | 133 | 26321 | – | 10 / 1952 B | 6 / 1038 B | 1 / 82 B | 2990 B (11.4%) |
| src/components/review-center.tsx | 334 | 68108 | – | 20 / 2858 B | – | – | 2858 B (4.2%) |
| src/components/chat-composer.tsx | 235 | 57640 | – | 13 / 2757 B | – | – | 2757 B (4.8%) |
| blocks/kpi-board.tsx | 101 | 15221 | – | 16 / 2681 B | – | 2 / 148 B | 2681 B (17.6%) |
| screens/agent-chat.tsx | 118 | 17950 | – | 17 / 2570 B | – | 1 / 53 B | 2570 B (14.3%) |
| screens/app-shell.tsx | 289 | 49833 | 1 / 91 B | 21 / 2403 B | – | 2 / 121 B | 2494 B (5.0%) |
| src/components/agent-queue.tsx | 261 | 56498 | – | 14 / 2119 B | 2 / 360 B | – | 2479 B (4.4%) + keyframes 143 B |
| src/components/agent-plan.tsx | 181 | 38096 | – | 11 / 2166 B | – | – | 2166 B (5.7%) |
| src/components/cited-answer.tsx | 153 | 29670 | – | 12 / 1931 B | – | – | 1931 B (6.5%) |
| src/components/permission-request.tsx | 129 | 24795 | – | 12 / 1754 B | – | 2 / 304 B | 1754 B (7.1%) |
| src/components/email-draft.tsx | 160 | 34631 | – | 10 / 1721 B | – | – | 1721 B (5.0%) |
| screens/agent-run.tsx | 63 | 9809 | – | 8 / 1649 B | – | 1 / 53 B | 1649 B (16.8%) |
| screens/assistant-home.tsx | 71 | 11089 | – | 10 / 1554 B | – | 1 / 53 B | 1554 B (14.0%) |
| src/components/billing-schedule.tsx | 167 | 30992 | – | 8 / 1495 B | – | – | 1495 B (4.8%) |
| src/components/message-actions.tsx | 137 | 25490 | – | 10 / 1430 B | – | – | 1430 B (5.6%) |
| blocks/logo-marquee.tsx | 31 | 5552 | – | 11 / 1289 B | – | 2 / 88 B | 1289 B (23.2%) |
| src/components/agent-graph.tsx | 204 | 41849 | – | 9 / 1158 B | – | – | 1158 B (2.8%) |
| src/components/project-card.tsx | 143 | 27038 | – | 6 / 1153 B | – | – | 1153 B (4.3%) |
| src/components/segmented-control.tsx | 83 | 19067 | – | 8 / 919 B | 1 / 230 B | 1 / 125 B | 1149 B (6.0%) |
| src/components/ai-answer.tsx | 160 | 33448 | – | 10 / 1072 B | – | – | 1072 B (3.2%) |
| src/components/smart-recommendation.tsx | 105 | 21808 | – | 6 / 1027 B | – | – | 1027 B (4.7%) |
| src/components/comment-thread.tsx | 106 | 23023 | – | 7 / 1000 B | – | – | 1000 B (4.3%) |
| src/components/agent-inbox.tsx | 141 | 26104 | – | 8 / 890 B | – | – | 890 B (3.4%) |
| blocks/metrics-dashboard.tsx | 111 | 17441 | – | 5 / 790 B | – | 1 / 53 B | 790 B (4.5%) |
| illustrations/voice-orb.tsx | 16 | 2366 | – | 9 / 779 B | – | 1 / 53 B | 779 B (32.9%) |
| illustrations/glow-cloud.tsx | 10 | 2835 | – | 1 / 776 B | – | 1 / 53 B | 776 B (27.4%) |
| src/components/breakdown-chart.tsx | 152 | 30265 | – | 4 / 748 B | – | – | 748 B (2.5%) |
| src/components/integration-settings.tsx | 156 | 32277 | – | 6 / 685 B | – | – | 685 B (2.1%) |
| blocks/invoice-credit.tsx | 100 | 14335 | – | 6 / 681 B | – | 1 / 53 B | 681 B (4.8%) |
| src/components/date-range-picker.tsx | 173 | 34362 | – | 7 / 639 B | – | – | 639 B (1.9%) |
| src/components/button.tsx | 50 | 12193 | – | 5 / 634 B | – | – | 634 B (5.2%) |
| src/components/writing-assistant.tsx | 119 | 28853 | – | 4 / 606 B | – | – | 606 B (2.1%) |
| screens/settings-billing.tsx | 123 | 16220 | – | 7 / 556 B | – | 1 / 53 B | 556 B (3.4%) |
| src/components/thinking-state.tsx | 92 | 21289 | – | 3 / 545 B | – | – | 545 B (2.6%) |
| src/components/prompt-library.tsx | 154 | 29264 | – | 5 / 532 B | – | – | 532 B (1.8%) |
| src/components/model-picker.tsx | 140 | 27355 | – | 5 / 527 B | – | – | 527 B (1.9%) |
| screens/evals.tsx | 99 | 13912 | 4 / 524 B | – | – | 1 / 53 B | 524 B (3.8%) |
| src/components/comments-panel.tsx | 126 | 27692 | – | 5 / 520 B | – | – | 520 B (1.9%) |
| src/components/fan-out-grid.tsx | 94 | 20878 | – | 2 / 333 B | 1 / 175 B | – | 508 B (2.4%) |
| src/components/approval-card.tsx | 96 | 17493 | – | 3 / 370 B | 1 / 132 B | – | 502 B (2.9%) |
| src/components/usage-meter.tsx | 163 | 32387 | – | 5 / 477 B | – | – | 477 B (1.5%) |
| src/components/agent-ledger.tsx | 96 | 19973 | – | 3 / 297 B | 1 / 170 B | – | 467 B (2.3%) |
| src/components/context-window.tsx | 149 | 27030 | – | 3 / 454 B | – | – | 454 B (1.7%) |
| blocks/task-board.tsx | 120 | 17053 | – | 4 / 450 B | – | 12 / 1431 B | 450 B (2.6%) |

The other 38 files have less than 400 B each (6.3 KB together). Seven components show nothing unseen at all: autonomy-dial, change-summary, inline-diff, notification-stack, parallel-attempts, profile-menu and progress-tracker. Toaster was not covered.

**Note on byte sizes.** Bytes are measured on the source CSS in `src/`. The published `components/*.tsx` files are a little larger, because every `var(--tc-x)` gains a fallback, and the deltas scale the same way.

---

## Part 2 – Standard vs Clean

For every component, the two look-scoped rule sets were diffed by base selector: 7,532 declaration differences, plus rules that exist in one look only. Statistics are in `looks.json`/`signals.json`, and the screenshots compared are `.visual/p4-final/<entry>__<file>__light.png`.

### What "Clean" is (derived from the majority)

| Trait | Clean rule | Evidence (count across 64 components) | Standard |
|---|---|---|---|
| Weight | Never above 500 | 0 Clean rules with weight ≥ 600; 600→500 in 106 rules / 40 components | 500–600 |
| Type size | One step smaller | sm-plus→sm (91 / 37c), md→sm (51 / 28c), lg→md (45 / 31c) | sm-plus/md/lg |
| Tracking | No negative tracking | -0.006em/-0.01em dropped (35 rules / 31c) | slight negative |
| Eyebrows | Uppercase, 10 px (`--tc-font-size-2xs`), 500, 0.5 px, `text-muted` | 27 rules in 18 components, identical spec | none (only 2 uppercase rules) |
| Emphasis | By colour, not weight | muted→secondary (121 / 46c), primary→strong (78 / 35c), muted→icon-muted for icons (47 / 29c) | weight |
| Edges | 0.5 px hairlines, elevation via `--tc-shadow-raised`/`-overlay` | 1px→0.5px (53 box-shadow + 34 border-top + 13 border-bottom); `shadow-raised` added in 41 rules / 32c | 1 px ring + small shadow |
| Buttons | 28 px, `--tc-radius-sm`, `--tc-font-size-md`, 500, `0 10px` | 37 of 37 Clean button rules are 28 px; 36 of 37 use radius-sm | 26/28/30/32/34/36/38/40/42 px; radius-lg/9px/md/full |
| Cards | `--tc-radius-lg` + `--tc-shadow-raised`, no tray around them | 23 of 30 card rules; Clean drops the wrapping card or tray in cited-answer, comments-panel, comment-thread, email-draft, filter-menu, combobox, change-summary, experiment-card | radius-2xl on a gray tray |
| Overlays | `--tc-radius-lg` + `--tc-shadow-overlay` | 21 of 29 radius, 23 of 28 shadow | radius-xl/14px |
| Radius | One step smaller | md→sm (80 / 37c), 2xl→lg (29 / 24c), xl→lg (17 / 14c) | |
| Hover | `fill-subtle` background + text/icon to `text-primary` | fill-hover→fill-subtle (42 / 23c); Clean adds hover fills on rows and options (setup-guide, autonomy-dial, billing-schedule, usage-meter, model-picker…) | colour change only |
| Colour roles | Accent = **state** (checks, switches, progress fills, spinners, carets, selected marks); inverse black = primary **action** | text-primary→accent in ~35 state rules; primary action background = `surface-inverse` in 17 of 18 components | black state indicators; primary actions via 5 different fills (gradients, text-primary, inverse, component tokens) |
| Icons | Strokes 1.1–1.3 at 16 px | JSX `strokeWidth={clean ? 1.1–1.3 : 1.4–1.6}` in 13 components | 1.4–1.6 |
| Focus | `outline-offset: 1px` | 38 rules / 28c | 2 px / token |
| Overflow | Chip rows collapse to "+N" | combobox, filter-menu, cited-answer (Clean-only `fit` logic) | wraps |

All of these recur across most components and read as one deliberate design choice. They are **deliberate**.
Where Clean has a rule, it is followed more uniformly than the equivalent in Standard. Clean buttons have one height, while Standard buttons have 9 heights and 5 primary-fill recipes. That is input for the Standard-side reviews, not drift in Clean.

### High

**H1. agent-inbox, approval-card and agent-cursors: the Clean CSS is Standard CSS with small tweaks, so it breaks the Clean language in several places at once.**
- **agent-inbox** (src/components/agent-inbox.tsx):
  - The Clean card (687) uses `0 0 0 1px border-default` plus a raw `rgba(16,16,24,.04)` shadow instead of `--tc-shadow-raised`.
  - Card hover (688, 813) uses raw `#dcdce1`/`#3a3a40`.
  - The Clean button (751) is the only Clean button out of 37 with `--tc-radius-md`, `--tc-font-size-sm-plus`, `0 12px` and a 1 px ring.
  - The view toggle (676) uses raw rgba rings.
  - The lane eyebrow (682) is 11 px with 0.08em tracking instead of the 10 px/0.5 px spec.
  - Compare `.visual/p4-final/agent-inbox__agent-inbox-clean__light.png`: the Clean cards have visibly heavier outlines than the Clean cards in agent-queue or review-center.
- **approval-card** (877, 981, 1100, 1104): 1 px `border-default` rings and `border-top`s in Clean. The Standard risk badge has a dot and the Clean one doesn't (`approval-card__*__light.png`), which is fine if it is intended, but no other Clean status badge drops its dot.
- **agent-cursors**:
  - The Clean sheet uses `--tc-radius-3xl` and later `--tc-radius-xl` (two conflicting rules).
  - The popover uses a raw 14 px radius with a 1 px ring (1638).
  - The table card and shade use 1 px rings (1419, 1700), even though the block is headed "Clean: hairlines as shadows" (1695).
  - The Clean tab uses a raw `light-dark(rgba(0,0,0,.05)…)` instead of `--tc-fill-default` (1408).

Fix: apply the Clean spec. Cards: `border-radius: var(--tc-radius-lg); box-shadow: var(--tc-shadow-raised)`, hover `--tc-shadow-raised-hover`. Buttons: the 28 px/radius-sm/font-size-md/`0 10px` recipe from `button.tsx`'s Clean rules. Dividers: `0.5px solid var(--tc-border-default)`. Eyebrow: 2xs/500/0.5px/uppercase/text-muted.

**H2. date-range-picker inverts Clean's accent rule.**
In Clean, the selected range endpoints are inverse black, and the *compare* range is the tinted, blue-ish one (1052–1097: `[data-start] button { background: surface-inverse }`, `[data-range]::before { fill-default }`). In Standard, the endpoints are accent blue and the compare range is gray. Everywhere else, Clean uses the accent for the selected state: filter-menu checkboxes, progress-tracker checks, model-picker segments and toggles, memory-panel switch, project-card ticks.
See `.visual/p4-final/date-range-picker__date-range-picker-clean__light.png` against `…__date-range-picker__light.png`. In Clean, the "vs. previous period" range reads as the primary selection.
Fix: in Clean, use `--tc-accent` and `--tc-text-on-accent` for `[data-start]`/`[data-end]`, `--tc-accent-subtle` for the in-range fill, and `--tc-fill-default` for the compare range, which is Standard's mapping.

### Medium

**M4. Motion: two opposite conventions.**
- In 14 components, Standard uses `--tc-ease-out` and Clean uses `--tc-ease-emphasized`: agent-cursors, agent-graph, agent-inbox, agent-ledger, agent-queue, agent-tree, autonomy-dial, context-map, decision-tree, fan-out-grid, parallel-attempts, permission-request, review-center, trace-waterfall.
- In 7 components it is the reverse: cited-answer, context-window, experiment-card, memory-panel, message-actions, project-card, prompt-library.
- In 43 components both looks share an easing.

Durations are mostly the same or shorter in Clean: 30 components shorter, 32 equal. Two are slower: fan-out-grid (median 160 → 200 ms) and project-card (200 → 220 ms). This is accidental; it follows which source library each component came from, not a look decision.
Fix: decide once. Either easing is fine, but one rule should hold, for example Clean = `--tc-ease-emphasized` for movement plus `--tc-duration-fast`/`-base`. Then fix the 7 reversed components, or the 14, whichever loses.

**M5. Badge, count and tag radius: three Clean specs, one of them off the scale.**
- 23 Clean badge/tag/count rules use a literal `5px`, which is not on `--tc-radius-*` (xs = 4, sm = 6). Examples: agent-cursors, agent-graph, billing-schedule, comments-panel, context-window, data-table, delegate-board, email-draft, experiment-card, integration-settings, memory-panel, notification-stack, profile-menu, prompt-library, segmented-control, smart-recommendation, stepper-form, trace-waterfall.
- 10 rules use `--tc-radius-xs`: agent-queue `__badge`, autonomy-dial/delegate-board/permission-request `__count`, fan-out-grid `__pill`, trace-waterfall `__tag`.
- agent-inbox `__count` uses `--tc-radius-sm`.
- Counts alone come in three radii.

`radius-full → 5px` appears 19 times and `radius-full → radius-sm` 15 times in the diff. It is a small visual difference, but it is the main source of raw-px radii in Clean: 142 raw-px radius declarations, the most in context-map (9), model-picker (8), review-center (8) and agent-queue (7).
Fix: add a Clean badge radius token (see the token proposals below) and use it for every badge, count and tag. Interactive chips stay on `--tc-radius-sm`, which they already do consistently in 19 components.

**M6. Pressed and toggled state: neutral in one component, accent in another.**
- Clean `message-actions` pressed chips (1041) and buttons (940) use `fill-default` + `text-primary`.
- Clean `reaction-bar` pressed (284) uses `accent-subtle` + `accent-text` + `border-selected`.
- Clean `cited-answer` lit markers (946) went accent→`fill-strong`.
- Clean `tips-panel` "done" (426) uses `status-success-fg`, where every other Clean done or complete mark uses the accent: stepper-form, progress-tracker, project-card.

Fix: write the rule down (accent marks a *chosen* state) and apply it to message-actions and cited-answer, or decide that pressed toggles are neutral and change reaction-bar instead. tips-panel done → `--tc-accent-text`.

**M7. Tooltips have no Clean spec.**
- Radius: `--tc-radius-md` in agent-lanes, delegate-board, tips-panel and usage-meter; `--tc-radius-sm` in message-actions, model-picker and thinking-state.
- Shadow: raw `0 8px 24px -8px rgba(…)` in agent-lanes and delegate-board, an inset 0.5 px ring in tips-panel, and `--tc-shadow-overlay` elsewhere.
- context-map's Clean menu uses `--tc-shadow-raised` instead of `-overlay`.

Fix: tooltip = `--tc-radius-sm` (small dark or overlay surface) with `--tc-shadow-overlay`.

**M8. Clean focus outline bypasses the width token.**
In 48 components, Clean writes `outline: 2px solid var(--tc-focus-ring)`, while Standard mostly uses `var(--tc-focus-ring-width)`. Offsets in Clean are a uniform 1 px, except kpi-chart (4 px) and progress-tracker (0). Contrast and visibility are covered by the WCAG audit (S1, S10); this finding is only about token use.
Fix: use `var(--tc-focus-ring-width)`, and add a per-look `--tc-focus-ring-offset` (Clean 1 px) instead of literals.

### Low

**L4. Off-pattern 1 px rings in otherwise hairline Clean components.** These are judgement calls. Radio and check rings in stepper-form (1470/1472), progress-tracker (461/487) and setup-guide (665/666), and the kpi-chart guide (494), are 1 px. That may be intentional for legibility of small controls. comment-thread `__details li::before` (745) is a tree connector. Leave them if intentional, but if Clean keeps 1 px for controls under 16 px, document the exception.

**L5. Caret colour.** In Clean, carets use `--tc-accent` in 5 components (command-menu, comment-thread, integration-picker, memory-panel, prompt-library) and `--tc-accent-text` in 5 (comments-panel, data-table, email-draft, writing-assistant, chat-composer uses accent). Pick `--tc-accent`.

**L6. Icon stroke outlier.** In reaction-bar, the Clean icon stroke is `1.65`, heavier than Standard's `1.6` (reaction-bar.tsx), against Clean's 1.1–1.3. Clean CSS also sets strokes of 1.5–2.4 on small glyphs in tool-call-card, writing-assistant, combobox, toaster and stepper-form. These are mostly checkmarks at 10–12 px, so this is a judgement call.

**L7. Raw dark-mode hover hexes in Clean.** agent-inbox 816 (`#d6d6da`), agent-queue 1943, autonomy-dial 551, context-window 1091 (`#232326`), permission-request 1043, and memory-panel 1442 / chat-composer 2665 (`light-dark(#fafafa, #232326)`). The themes and tokens reviews will catch these too. The Clean fix is `--tc-fill-default`/`--tc-surface-inverse-hover`.

**L8. Features present in one look only, all deliberate and documented in the component headers.**
- segmented-control "buttons" variant (Clean)
- date-range-picker sliding pill (Standard)
- agent-plan shimmer status label (Clean)
- chat-composer's separate Clean and Standard layouts (48/47 look-only rules)
- memory-panel and command-menu footers moved
- Clean "+N" chip collapse

I found no undocumented one-look feature, apart from the approval-card risk dot (H1) and the hover gaps below.

**L9. Hover parity.** Clean adds hover fills that Standard lacks, which is consistent and deliberate. Standard has hover rules that Clean lacks in a few places:
- cited-answer icon nudge (1000/1039): Clean has its own version on `__icon`, which is fine.
- memory-panel `__icon--forget` (1366): Clean has it on 1373, which is fine.
- dark-mode-only hover overrides in decision-inbox (554/561), permission-request (1040/1041) and review-center (2266), which Clean doesn't need because its tokens handle dark.

No missing hover state in Clean that would leave a control without hover feedback.

---

## Proposed token and scale changes

1. **`--tc-radius-badge`**: Clean `5px` (or snap to `--tc-radius-xs` 4 px), Standard `--tc-radius-full`. Replaces 23 literal `5px` and 10 `radius-xs` badge, count and tag radii (M5).
2. **`--tc-focus-ring-offset` per look**: Clean `1px`, Standard `2px` (today it is 2 px in both and every Clean rule overrides it with a literal). Plus use the existing `--tc-focus-ring-width` everywhere (M8).
3. **`--tc-control-h`** (Standard 32 px or 30 px, Clean 28 px) and `--tc-control-radius` (Clean `--tc-radius-sm`). Clean already obeys this in 37/37 rules; Standard would converge onto it.
4. **`--tc-ease-move` per look**, set once, instead of per-component choices between `ease-out` and `ease-emphasized` (M4).
5. **`--tc-hairline`**: Clean `0.5px`, Standard `1px`. Use it for dividers (`border-top`/`border-bottom`) so agent-inbox and approval-card can't fall back to 1 px.
6. **An eyebrow text style** (`--tc-eyebrow-*` or a shared rule): 2xs / 500 / 0.5 px / uppercase / text-muted, already identical in 18 Clean components.

## Prioritised fix list

1. **date-range-picker Clean colours** (H2): swap the endpoint and compare colours to the accent mapping.
2. **agent-inbox, approval-card, agent-cursors Clean CSS** (H1): replace 1 px rings and raw hex with `--tc-shadow-raised`/`-overlay`, the Clean button recipe and the eyebrow spec.
3. **Decide the motion convention and apply it** (M4): 7 or 14 components.
4. **Collapse the 200 identical look-scoped pairs** (M1, −21 KB), and fold agent-cursors' Clean override block into its first rules (L1).
5. **Fix the tool-call-card CSS tail** (M3).
6. **Delete the certain-dead rules and keyframes** (Low table, ≈2.3 KB). Wire or drop approval-card `[data-pressed]`.
7. **Badge radius token** (M5), **tooltip spec** (M7), **pressed-state rule** (M6), **focus tokens** (M8).
8. **Demo coverage**: stepper-form review and success steps, project-flow `theme="dark"`, ai-workspace projects view, agent-cursors rich blocks, decision-tree sub-questions and empty state, client-context empty and create, otp-input states. Then delete whatever is still unseen. Get the toaster page mounting under the fake clock so it can be checked.
9. Low polish: caret colour (L5), reaction-bar stroke (L6), Clean dark-hover hexes (L7).
