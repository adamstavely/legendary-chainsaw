# Trenchcoat — WCAG 2.2 AA audit

**Date:** 2026-10-24 · **Scope:** all 129 files (64 components × standard/clean + plan-vs-actual clean) · **Target:** WCAG 2.2 Level A + AA

**Status (2026-10-25): fixed.** All 187 published files (components in both looks, blocks, screens, illustrations,
motion) pass axe in light and dark in a real browser, the critical keyboard blockers below are fixed, and each fix has
regression tests; `tests/a11y.test.tsx` and `scripts/a11y.mjs` keep it that way. The judgement calls left are listed
in `audit/design-review/README.md` (Follow-ups). Not yet done: testing with real screen readers and forced-colors mode.

**Verdict (as audited): no component conforms to WCAG 2.2 AA as shipped.** Every component fails at least 1.4.11/2.4.7 (focus indicator) and almost every one fails 1.4.3 (text contrast) — both come from shared token values, so they are cheap to fix centrally. Beyond those, 4 components have **critical keyboard blockers**, and the most common structural defect is **focus being lost when the focused control is removed**.

## Method

1. **Automated:** axe-core 4.10 run against every rendered file (both variants) in the overview gallery, rules tagged `wcag2a/aa`, `wcag21a/aa`, `wcag22aa`. 37 of 129 files had no axe violations — but axe covers only ~30–40% of WCAG.
2. **Manual code review** of every component for the criteria automation can't test: keyboard operation and traps, focus order/visibility/management, ARIA widget patterns, live regions, timing, motion, dragging, target size, hover content, reflow. Clean variants were diffed against standard and their CSS checked separately.
3. **Contrast** computed from the source token values (alpha blended over the real background).

Not done: testing with real screen readers (VoiceOver/NVDA/JAWS), Windows High Contrast / forced-colors mode, and dark theme beyond spot checks. Findings marked "Critical" for keyboard traps were confirmed in code.

Severity: **Critical** blocks a task for keyboard/AT users · **Serious** major barrier · **Moderate** workaround exists · **Minor** polish.

---

## 1. Systemic issues (fix once, fixes everywhere)

| # | Issue | SC | Where | Fix |
|---|---|---|---|---|
| S1 | **Focus ring too faint.** Standard `rgba(23,23,23,.22)` = **1.61:1**; clean `rgba(0,96,226,.35)` = **1.73:1**; dark themes 2.3–2.5:1. Needs ≥3:1. Clean even regresses components whose standard ring passed (breakdown-chart, data-table, filter-menu, decision-inbox: solid `#2f6bff` 4.5:1 → 1.73:1). | 2.4.7, 1.4.11 | ~all 129 files (only context-map-clean passes) | Change the `--*-focus` token to a solid ≥3:1 colour (e.g. `#2f6bff` / `#0060e2`), 2px, offset 2px. |
| S2 | **`outline:none` on text fields and listboxes** with no adequate replacement — the "no focus box while typing" rule. | 2.4.7 | comment-thread, comments-panel, email-draft, memory-panel, message-actions, writing-assistant, billing-schedule, integration-picker, integration-settings, command-menu, combobox, data-table, chat-composer, model-picker, agent-cursors, agent-plan, agent-steering, decision-tree, profile-menu | Use a `:focus-within` ring on the field wrapper meeting 3:1. |
| S3 | **Muted/faint text tokens fail 4.5:1.** `--*-muted` fails in **118 of 124** definitions (`#8f8f8f` 3.23, `#8a8a8a` 3.45, `rgba(0,0,0,.45)` 3.36; ~2.8–3.0 on the `#f0f0f0` tray). `--*-faint` fails in **all 85** (`rgba(0,0,0,.27)` 1.94, `#b8b8b8` 1.98) and is used for real text (timestamps, "Undone", placeholders, counts). axe flagged 612 elements in 92 files, mostly these. | 1.4.3 | ~all files | Muted → `#6b6b6b` (5.3:1) / `rgba(0,0,0,.6)`; restrict faint to decoration/disabled. Also: small status chips (amber `#b85c00`/`#fff3e0` 4.19, red `#e5484d` 3.9, clean green `#1a9a52` on tint 3.3). |
| S4 | **Focus lost when the focused control unmounts, disables or goes `inert`** (decide/approve swaps, remove ×, close, Undo, Pause↔Resume, menus closing on select, rows moving between lists). Focus drops to `<body>`. | 2.4.3 | ~40 components (see per-component) | Before removing, move focus to a stable target (next item, the result row, the trigger). A shared helper would fix most. review-center, approval-card, agent-plan and inline-diff already do it right — copy them. |
| S5 | **ARIA roles promise keyboard patterns that aren't implemented**: `role=radio/radiogroup`, `tab`, `menu`, `listbox/option`, `tree` without arrow keys / roving tabindex / focus move-in / Esc-return; `aria-label` on role-less `<span>`/`<p>`/`<mark>`/`<ins>`. | 4.1.2, 2.1.1 | ~25 components | Either implement the APG pattern or use plain buttons. model-picker, memory-panel, segmented-control and permission-request implement them well — reuse. |
| S6 | **Collapsed content that's only visually hidden** (`grid-template-rows:0fr; opacity:0`) stays focusable and in the a11y tree. | 2.4.7, 1.3.2, 4.1.2 | setup-guide, thinking-state, filter-menu, stepper-form (narrow) | Add `inert` (already used correctly elsewhere). |
| S7 | **Live regions mis-scoped** — too broad (whole lists with 30s timestamps, per-frame rolling numbers, word-by-word streaming every 38ms, hover captions, per-second countdowns) or missing / mounted together with their content (so never announced). | 4.1.3 | writing-assistant, ai-answer, comment-thread, comments-panel, memory-panel, fan-out-grid, cited-answer, permission-request, agent-queue, agent-tree, agent-graph, parallel-attempts, integration-picker | Persistent, narrow `role=status` regions announcing final results only. |
| S8 | **Hover tooltips/popovers** with `pointer-events:none` (not hoverable) and no Esc dismissal. | 1.4.13 | breakdown-chart, message-actions, thinking-state, inline-diff, decision-tree, review-center, fan-out-grid, delegate-board, context-map, ai-answer, kpi-chart | Make hoverable, Esc-dismissable. |
| S9 | **Endless animation without a pause control** (shimmers, sweeps, glows, auto-play, sliding timelines). All files honour `prefers-reduced-motion` ✅, but 2.2.2 needs a user control for content moving >5s. Most serious where content itself moves or auto-acts: agent-lanes (timeline slides every 250ms), progress-tracker autoPlay (ticks the user's checkboxes), thinking-loader/thinking-state `loop`. | 2.2.2 | ~20 components | Pause control, or stop after 5s; decorative loops off by default. |
| S10 | **Clean variants weaken non-text contrast systematically**: 0.5px hairlines at 6% alpha, selected/pressed states shown only by a ~1.1:1 fill, 16–18px switches and chip ×, redundant icons removed. | 1.4.11, 1.4.1, 2.5.8 | most `-clean` files | Selected states need ≥3:1 indicator or a non-colour cue; × buttons ≥24px. |

Good, consistently: `prefers-reduced-motion` honoured in all 129 files; no flashing content; no single-key global shortcuts except review-center (scoped); OTP input allows paste + `autocomplete="one-time-code"` (3.3.8 ✅); stepper-form handles 3.3.7 redundant entry; SSR-safe.

---

## 2. Critical issues

| Component | Issue | SC |
|---|---|---|
| **data-table** | **Keyboard trap**: once a cell is active, Tab/Shift+Tab are always `preventDefault`ed to move between cells (`data-table.tsx:245-248`), and Esc doesn't release — header, checkboxes, Add row and everything after the table become unreachable. Verified in code. | 2.1.2 |
| **data-table** | Focus stays on the `role=grid` container; the active cell is only `data-active` — no `aria-activedescendant`, cells have no ids, so screen readers never hear cell content. | 4.1.2 |
| **command-menu** | **Keyboard trap**: Tab/Shift+Tab are always prevented whenever >1 group is shown (default data has 4) to jump sections (`command-menu.tsx:408-414`); Esc only calls optional `onClose`. Verified in code. | 2.1.2 |
| **agent-cursors** | Suggestion Accept/Reject popover is unreachable by keyboard: it opens on focus, closes 140ms after blur, and sits at the end of the DOM, so Tab always closes it first. Reject has no other route. | 2.1.1 |
| **context-map** | Tiles are `div role=listitem` with `onClick`/`onMouseEnter` only — selecting a block and reading its details is pointer-only. | 2.1.1 |
| date-range-picker-clean | Presets `role=listbox` contains a non-option child (axe). | 1.3.1 |

---

## 3. Per-component findings

Systemic issues S1 (focus ring) and S3 (muted/faint text) apply to essentially every component and are not repeated below. "both" = standard and clean; otherwise the variant is named. Line numbers refer to the standard file.

### Agents

**agent-cursors** — Critical: popover unreachable (above). Serious: `<ins>/<del>` focus cue is only a tint change (`outline:none`, :1177); dark-pin reply input ring 1.01:1; focusable `<ins>/<del>` carry prohibited `aria-label` and no Enter/Space action. Moderate: `role=tab` without tab pattern (:690); hover-opened comment pin can't be closed with Esc from the pin. Minor: table cells clipped with ellipsis at fixed 40px; title/summary hidden at narrow widths.

**agent-graph** — Moderate: card Close unmounts without returning focus (:1062); alerts live region mounted conditionally so first "needs you" isn't announced (:1127); continuous pulses/breathing with no pause. Good: nodes are named buttons, SR list of nodes and calls, dialog autofocus.

**agent-inbox** — Serious: Approve/Reject/Retry remove the button and remount the card in another lane → focus lost. Moderate: radio view switch without arrow keys; source/tool counts only labelled via `title`; Board/List switch `display:none` ≤620px (1.4.10). Clean: lane names 3.25:1, "Nothing here" 2.06:1.

**agent-lanes** — Serious: whole timeline slides every 250ms, finished blocks disappear, buttons move under the pointer, no pause (2.2.2). Moderate: blocks as narrow as 6px (2.5.8); failed/done/running by colour only (1.4.1); `role=tooltip` containing an interactive button; Approve/Reject lose focus; agent names hidden ≤520px.

**agent-ledger** — Serious: "Undone" label `#c2c2c2` 1.78:1. Moderate: undo/redo cascades not announced. Minor: `aria-label` on a plain span. Good: Undo↔Redo keeps the same button (focus preserved).

**agent-plan** — Serious: pointer reorder is drag-only (2.5.7 — keyboard Alt+Arrow exists but no single-pointer alternative). Moderate: `key={phase}` remount loses focus on Run/Again/Cancel; add-step input focus cue is a background tint. Clean: error text `#e5484d` 3.91:1. Good: thorough keyboard model, status announcements, focus restore after edit.

**agent-queue** — Moderate: queued-job squares 12×12 on a 16px pitch (2.5.8); rate-limit pill becomes `role=status` with a per-second countdown (chatty, duplicated); Cancel loses focus; hover card doesn't open on focus. Good: roving tabindex, stable DOM order, chart `role=img` summary, real Pause control.

**agent-steering** — Moderate: Pause/Resume are separate conditional buttons (focus lost), as are chip Now/×; every queued note's button is just "Now" (2.4.6); step done/pending state not exposed (icons aria-hidden); textarea focus ring ~1.45:1.

**agent-tree** — Serious: `role=tree/treeitem` without the tree pattern — items not focusable, no arrow keys, `aria-label` overrides content, level-1 group is a sibling not a child (broken hierarchy). Moderate: clickable node is a div with nested fold `<button>`; whole summary incl. live cost is `aria-live`; dialog Esc/last-resolve lose focus.

**approval-card** — Serious: countdown auto-denies (2.2.1); pauses only on hover/DOM focus, so screen-reader browse mode keeps it running; visible countdown aria-hidden, hidden text not live, no extend option. Moderate: checkbox border 1.48:1. Minor: Esc anywhere in the card = Deny. Good: focus management on resolve/reset, `role=status` decision.

**autonomy-dial** — Serious: pin toggle moves the row between two lists → remount → focus lost every press. Moderate: lock icon invisible until hover, then 1.98:1; details `display:none` ≤340px. Good: radiogroup with roving tabindex.

**context-map** — Critical: tiles pointer-only (above). Serious: block detail and fate (kept/summarized/dropped) only in hover tooltip / aria-hidden label. Moderate: small tiles identified by colour only; agent picker `role=menu` without menu keyboard; "Compacting" status not live; Esc doesn't close hover tooltip. Clean focus ring passes (3.66:1) — the only one.

**context-window** — Serious: Compact `<button>` nested inside the expandable `<button>` (invalid, not exposed; click bubbles). Moderate: hover caption live region chatters; remove/compact lose focus.

**decision-inbox** — Serious: answering swaps both buttons for a span; opening a folded title swaps button→`<p>` → focus lost. Folded titles `#b5b5b5` 2.05:1; header alert 3.14:1. Clean: ring regresses 4.5→1.73. Minor: folded-title button lacks `aria-expanded`.

**decision-tree** — Moderate: option consequences not tied to their button (aria-label replaces them); switching decisions only via ←/→/j/k with an aria-hidden hint and no pointer controls; hover tip not dismissable; `<mark tabIndex=0>` without role; Other textarea outline removed. Clean-only Serious: follow-up flow disables the focused button without moving focus; follow-up `aria-label` hides "not reversible" consequences; focusable `<mark>` nested in buttons.

**delegate-board** — Serious: assign/reassign by pointer is drag-only, no click alternative (2.5.7); no keyboard way to unassign; tasks beyond 3 per queue only in a tooltip (unreachable); target agent change during keyboard pick not announced; keyboard assign remounts the card → focus lost. Moderate: "+N" tooltip not hoverable/dismissable; running state via spinner + tint only; chip titles truncated at 150px.

**fan-out-grid** — Serious: cells are bare spans; active cell exposed only by swapping `aria-describedby` (not announced); task state by tint only, cell edges ~1.25–1.6:1. Moderate: 12px cells with 4px gaps (2.5.8); hover window not dismissable; live text updates on every finished task; endless sweep/pulse.

**parallel-attempts** — Serious: non-picked rows dimmed to opacity .55 → text 1.87–2.27:1. Moderate: no live region at all (done/failed/"Best" pick silent); radiogroup without roving tabindex; endless sweep.

**permission-request** — Serious: Allow/Deny unmount the request, Revoke/Change unmount the result → focus lost; unselected scope text 2.77:1 (standard). Moderate: selected scope ~1.25:1 (clean 1.14); "N min left" in `role=status` re-announced every minute; `role=dialog` on an inline card with no focus handling. Good: scope radiogroup with roving tabindex.

**plan-vs-actual** (clean only) — Serious: waiting step's planned duration in faint 1.94:1; rows dim to .45 while another row is focused. Moderate: dependencies only drawn as aria-hidden links on hover; endless shine; ring 1.73:1.

**review-center** — Moderate: single-key shortcuts a/e/r/s/j/k/f/z/u active anywhere inside a large widget, not remappable (meets the focus exception technically, risky for speech input — 2.1.4); Undo chip vanishes after 6s (2.2.1); flag tooltip not dismissable; Cancel shows "Esc" (2.5.3); SLA state by colour only; fixed 60px rows clip at 200% text. Clean: waiting time 1.94:1. Good: focus preserved on decide/undo, `aria-keyshortcuts`.

**tool-call-card** — Serious: code block base colour is muted (3.31:1) — all JSON punctuation and any non-JSON result. Minor: "Copied" only an aria-label change; group + cards duplicate status; header name contains a 100ms-updating timer. Good: aria-expanded/controls, inert collapsed body.

**trace-waterfall** — Moderate: details popover can cover the focused rows while ↑/↓ move (2.4.11); Enter only flips `aria-selected`, dialog gets no focus/announcement; span kind by colour only; endless shimmer. Good: full tree pattern with roving tabindex and aria-level/expanded.

### AI & chat

**ai-answer** — Serious: status live region is mounted conditionally with `key={status}`, so "Answered in…/Copied/Stopped" usually aren't announced; citation chip 2.94:1, source number 1.87:1. Moderate: Stop replaced by actions (focus lost); chip shows source name but is named "Source: <title>" (2.5.3); tooltip links tabIndex −1; mascot eyes loop forever (standard).

**chat-composer** — Serious (standard): all sizes incl. font-size are `calc(n * --u)` with `--u: min(100cqw/1900, .27px)` — user font settings ignored and text *shrinks* when zooming at narrow widths (1.4.4). Serious: voice input makes its own toolbar inert while the mic button has focus; "Press Escape to discard" only works after tabbing back; listbox active option only a 1.09:1 fill. Moderate: Connect apps goes inert while focused; dictated words aria-hidden; placeholder 1.74:1.

**cited-answer** — Moderate: aria-live caption rewritten on every hover/focus; close() always focuses the chip even when opened from an inline marker; dimmed sentences 2.07:1. Clean: "+N" removes itself on click (focus lost).

**comment-thread** — Serious: reply input `outline:none` with no replacement. Moderate: whole list is `aria-live` and "ago" timestamps re-render every 30s → announcement spam; scroll container not focusable (clean also hides scrollbar).

**comments-panel** — Serious: sort `role=menu` has no arrow keys, no focus move-in, no Esc, no focus return; composer `outline:none`. Moderate: filters are `role=tab` without tabpanels/roving; Run edit / Undo unmount (focus lost); whole `<ul>` live; resolved items at opacity .45 (~2.3:1).

**email-draft** — Serious: recipient `role=listbox` wraps options in `<li>` (ownership broken), no arrow keys, Esc doesn't return focus. Moderate: Esc/blur unmount the textarea, Send/Undo swap the card → focus lost; textarea focus cue a 1:1-ish inset; picking a tone silently discards manual edits.

**inline-diff** — Serious: inserted words distinguished only by green colour/tint (clean: only a faint tint) — 1.4.1. Moderate: Esc on a change calls `blur()` (focus to body); hover popover not dismissable without focus; change spans don't respond to Space; no per-change undo mid-review. Good: Y/N scoped to the focused change, status messages, focus managed after decisions.

**memory-panel** — Serious: Forget makes the focused row inert (focus lost) and the only recovery, Undo, expires after 5s without pausing on hover/focus (2.2.1). Moderate: search/edit fields `outline:none`; caption live region announces per-frame rolling numbers; when memory is off the list stays operable at opacity .5 (~1.7:1); switch off-track 1.37:1. Good: radiogroups with roving tabindex, proper switch, focus returns after edit.

**message-actions** — Serious: "quiet" bar at opacity .6 → icons ~1.9:1 until hover/focus. Moderate: CSS-only tooltips (not hoverable/dismissable); version prev/next 20×30 flush against Regenerate (2.5.8 fails); feedback panel auto-closes and goes inert while Send is focused; "Other" input `outline:none`. Clean: pressed state only a .06 fill.

**model-picker** — Serious: listbox outline removed; active option only a 1.1:1 fill + 1.6:1 inset. Moderate: arrow navigation dims all other options to .5 (~1.7:1); strength bars ~1.2:1 (values only in aria-label); live region repeats name/latency/price on every arrow press. Good: activedescendant listbox, Esc returns to trigger, radiogroup, real switches.

**prompt-library** — Serious: list focus ring 1.61:1 (clean also replaced the variable token's solid border with the weak ring). Moderate: "Use prompt" is `aria-disabled` with the reason only in a non-live hover caption; placeholders ~1.9:1; selected template ~1.1:1. Good: roving listbox, Enter advances to next empty field, status announcements.

**smart-recommendation** — Serious: Alternatives `role=menu` without arrow keys or focus move-in; global Esc closes without returning focus. Moderate: choosing/Accept/Undo swaps lose focus.

**thinking-loader** — Moderate: `loop` cycles phases every 2.2s forever with no pause; label box sized once in px with fixed height + overflow hidden (clips under text spacing). Minor: status announces every phase.

**thinking-state** — Serious: collapsed sources stay focusable and in the a11y tree (opacity 0 only). Moderate: `loop` restarts every 4s; CSS-only tooltips; muted 3.45:1. Minor: whole `<ol>` live; header button name changes every second (timer).

**writing-assistant** — Serious: replies stream into `aria-live` one word every 38ms (fragmented/repeated announcements); textarea `outline:none` (clean: no focus indication at all). Moderate: infinite glow drift; suggestion chip click unmounts the welcome view (focus lost); typing indicator `aria-label` on `<p>` not exposed; fixed 340px body clips enlarged text; dictation auto-sends after 450ms, and on mic error silently sends a canned sample sentence (3.2.2 — also a functional bug).

### Data & charts

**billing-schedule** — Serious: below 520px the "Repeats" `<select>` is `display:none` (function lost, 1.4.10); phase-name input has `outline:none` and looks like plain text with no visible label; Duration/Add-product `role=listbox` without keyboard pattern ("Add product" holds actions — should be a menu). Moderate: Duration trigger's `aria-labelledby` hides its value and uses a hard-coded id (duplicates with 2 instances); Remove/Add discount lose focus; number fields silently strip/clamp input with no error (3.3.1).

**breakdown-chart** — Serious: Select listbox loses focus on choose/Esc and stays open on Tab-out. Moderate: option focus only a 1.09:1 fill; bar tooltip not dismissable/hoverable; segment palette 1.6–2.5:1 against white (table mitigates); table scroll region not keyboard-focusable (axe). Clean ring regresses from 4.5:1.

**change-summary** — Moderate: good/bad tone by colour only — "Up 6%" reads the same whether good or bad (1.4.1). Minor: rows truncated with ellipsis; clean clips long titles.

**compact-breakdown** — Serious: focus ring (S1). Minor: rows are `div tabIndex=0` with no role or action; caption fixed-height overflow hidden; clean delta pills ~3.3–3.5:1.

**data-table** — **Critical** ×2 (above). Serious: grid keydown also swallows Enter/Space from header sort buttons and row checkboxes inside it (sort/select not keyboard-operable once a cell is active); grid container `outline:none` with no replacement. Moderate: link cells can't be followed by keyboard; tag-picker focus 1.09:1. Minor: hint "Double-click a cell to edit" never mentions Enter/F2. Good: Shift+Arrow alternative to drag-select, modifier-based undo/redo.

**experiment-card** — Moderate: variant rows are `role=radio` without arrow keys, and clicking a checked radio unchecks it; better/worse lift by colour only (and sign is inverted for lower-is-better metrics); hover-only caption info. Good: aria-expanded/controls, Esc refocuses, inert body.

**kpi-chart** — Serious: plot focus ring ~1.7:1. Moderate: series identified only by line colour, legend only inside the tooltip. Minor: always-present tooltip live region reads stale values; tooltip not hoverable. Good: arrow-key reading.

**project-card** — Serious: picking a status (or Esc) makes the fold inert while it holds focus → focus lost. Moderate: member avatar buttons 20×20 overlapping by −6px (2.5.8, axe-confirmed; status button 20px tall); status options `role=radio` without arrows; unchecked checkbox ring 1.65:1 (clean 1.94).

**usage-meter** — Moderate: sparkline promises "arrow keys read each day" but the readout isn't live/inside the img; limit state by a 6px dot with `aria-label` on a role-less span (axe); meter has no accessible name (axe). Good: `role=meter` + valuetext, polite state announcements.

### Inputs & controls

**button** — Moderate: destructive variant `#ff0000` on `#ffe6e9` 3.4:1 (clean 3.5:1). Minor: loading state only sets `aria-busy` (not announced); icon-only buttons rely on consumer `aria-label`; clean `sm` exactly 24px.

**combobox** — Serious: input `outline:none`, field focus cue ~1.2–1.5:1 (standard); active option only a 1.14:1 pill — and in clean the pill fades out on mouseleave while still being the Enter target. Moderate: chip × 20px (clean 18px) inside the field target. Clean: overflow chips collapse to "+N" — hidden selections can't be seen or removed. Good: full combobox/listbox pattern, live add/remove announcements.

**command-menu** — **Critical** keyboard trap (above). Serious: search input `outline:none`; active row only a 1.14:1 pill (fades out in clean while still the Enter target). Minor: whole footer live; global Cmd/Ctrl+K bound per instance and overrides browser Ctrl+K.

**date-range-picker** — Moderate: presets `role=listbox` of tab-stop buttons with a non-option "Custom" child (axe, clean); compare `role=radio` without arrows; two-step range summary not live; on narrow screens arrow/PageUp can move focus into the `display:none` month (focus stranded); dialog doesn't move focus in on open. Clean range band 1.14:1. Good: roving day grid with full keyboard, full-date labels, Esc restores focus.

**dropzone** — Moderate: Remove/Retry/Clear lose focus. Minor: hidden `<input type=file>` has no label (axe — low impact since a labelled button drives it); "Uploaded" check is an aria-label on a span; error text 3.91:1. Good: drag has a button alternative, specific validation errors, announced.

**filter-menu** — Moderate: collapsed groups stay in the a11y tree (opacity only); roving tabindex across plain buttons with no composite role, and the tab stop can be lost after a mouse collapse; chip × and Clear all lose focus; checkbox edge 1.28:1. Clean: ring regresses from 4.5:1; chip × 18px; "+N" overflow hides chips.

**integration-picker** — Serious: search combobox `outline:none` with no replacement. Moderate: Enter toggles connection with no announcement; the whole detail section is `aria-live` and re-reads on every arrow key; switch name flips with state ("Connect X"/"Disconnect X") plus aria-checked; endless ring animation; off-track 1.4:1; fixed 350px body clips text under zoom.

**integration-settings** — Serious: time-zone trigger's `aria-labelledby` hides the selected value; zone menu Esc/select unmount with focus inside (focus to body), Tab-out leaves it open; Generate/Save/Discard remove or inert the focused control. Moderate: zone `role=listbox` of tab-stop buttons; busy Regenerate has no name; address error validated per keystroke in a non-live hint; field rings 1.3:1.

**otp-input** — Moderate: focus ring hidden while verifying even though input has focus; clean active-cell ring ~1.7:1 and cell borders effectively invisible; standard box borders 1.2:1. Minor: label only via aria-label; repeated identical error not re-announced. Good: single native input, paste + `one-time-code` autofill (3.3.8 ✅), live region for verify/error/resend.

**profile-menu** — Serious: menu items focus shown only by a 1.09:1 background (`outline:none`); "Next" setup button focus invisible (standard). Moderate: `role=menu` on a permanently visible list with every item a tab stop and no Esc. Minor: progressbar lacks valuetext ("3/5" vs percent).

**reaction-bar** — Moderate: Repost/Share pressed state by colour only (Share 1.7:1 difference). Minor: Comment/Share as `aria-pressed` toggles; "1.2K" visible vs "1234 likes" name (2.5.3).

**segmented-control** — Clean only Moderate: selected option only a 1.13:1 fill + slight text darkening; `sm` tray options 20px tall and touching (2.5.8). Minor: onChange fires on pointerdown (2.5.2). Good: radiogroup/tablist roles, roving tabindex, drag has click/key alternatives.

**stepper-form** — Serious (standard): ≤420px the step list is sr-only hidden but its buttons remain focusable (invisible focus); chip "Remove" loses focus. Moderate: `autoComplete="off"` hard-coded before `...rest` (1.3.5); chip errors in a non-live `<p>`; sticky footer can cover the focused invalid field with `preventScroll` (2.4.11); field borders 1.36:1; clean chip × 18px. Good: aria-current steps, focus to first invalid field, Review/Edit (3.3.7 ✅).

### Feedback & onboarding

**notification-stack** — Serious: dismiss × makes the card inert while focused (focus lost). Moderate: background cards aria-hidden with no "1 of 3" cue. Minor: dismissals not announced; new `notices` props ignored after mount.

**progress-tracker** — Serious: `autoPlay` ticks the user's checkboxes every 2.2s forever with no pause/stop control (2.2.2); JS ignores reduced motion; SR users hear aria-checked flip on its own. Moderate: labels nowrap/ellipsis with no way to read; clean unchecked ring 1.6:1.

**setup-guide** — Serious: Minimize hides only visually (tasks remain focusable/readable); finishing a group auto-collapses it 420ms later and inerts the focused task. Moderate: group done state only a CSS strike-through. Minor: tasks use aria-pressed for "done"; locked tasks give no reason.

**tips-panel** — Serious: tip action replaced by a "Done" span (focus lost). Moderate: each completion creates a new `role=status` "Done" with no context, plus a second announcement from the counter.

**toaster** — Serious: toasts auto-dismiss after 4s by default including toasts with an action button; pause on hover/focus and F8 help, but no way to extend/disable (2.2.1). Moderate: close/action buttons dismiss and inert the focused toast. Good: F8 hotkey configurable, live regions present from mount (polite/alert), repeated messages re-announced, swipe has alternatives.

---

## 4. Recommended fix order

1. **Tokens (≈1 day, fixes the majority of findings by count):** focus ring token → solid ≥3:1; muted text → ≥4.5:1; faint only for non-text; state-chip colours; clean hairlines/selected fills ≥3:1.
2. **Critical keyboard blockers:** data-table and command-menu Tab traps; agent-cursors popover; context-map tiles.
3. **Focus management helper** (S4) applied across ~40 components.
4. **Timing:** approval-card countdown, memory-panel/review-center Undo, toaster action toasts, progress-tracker autoPlay, agent-lanes timeline — pause/extend controls.
5. **ARIA pattern pass** (S5, S6, S7) using the components that already do it right as references.
6. **Re-test** with axe + VoiceOver/NVDA + keyboard-only, and add automated a11y tests (e.g. axe in component tests) so regressions are caught.
