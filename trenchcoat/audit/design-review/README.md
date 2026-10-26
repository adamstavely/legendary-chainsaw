# Design review – summary and fix plan

**Status (2026-10-25): fix plan done** (Pass A and Pass B, all five libraries). See CHANGELOG.md for what changed;
follow-ups are listed at the end.

2026-10-25 · Four read-only reviews of the styling across all five libraries, after code-quality Phases 0–5 (which
deliberately changed nothing visible). Details, measurements and evidence:

| Part | Report | Question |
|---|---|---|
| Scales | [scales.md](scales.md) | Do spacing, type, radii, shadows, z-index and motion follow a scale? |
| Patterns | [patterns.md](patterns.md) | Do inputs, menus, chips, buttons and cards look the same everywhere? |
| Themes and widths | [themes-and-widths.md](themes-and-widths.md) | Does each look hold up in dark mode and at 768 / 375 / 320 px? |
| Dead CSS and looks | [dead-css-and-looks.md](dead-css-and-looks.md) | What CSS never matches, and do Standard and Clean differ on purpose? |

Related: [../WCAG-2.2-AA-audit.md](../WCAG-2.2-AA-audit.md), [../bundle-and-performance-audit.md](../bundle-and-performance-audit.md). What is still open from this review and the performance audit: [../remediation-plan.md](../remediation-plan.md).

## Verdict

**The token migration made the libraries pass the token check, not follow a system.** Values were swapped for tokens
where a dictionary value already matched; everything else stayed literal. So:

- **Clean is a design system in practice.** 28 px controls, weight ≤ 500, 0.5 px hairlines, shared raised/overlay
  shadows, 10 px card radius, accent for state and ink for the primary action – held in nearly every component.
  Drift is local (agent-inbox, approval-card, agent-cursors, date-range-picker) plus a split motion convention.
- **Standard has a reference for each pattern but most instances drift from it.** Buttons come in 7–9 heights and two
  primary styles (gradient vs. flat ink), menus in 7 shadow recipes and 5 row heights, trays in 4 radius/inset recipes,
  status pills in two shapes.
- **Blocks and screens are parallel UI kits.** Blocks rebuild buttons, menus, fields and segmented controls instead of
  importing them (845 hand-rolled buttons across the libraries); screens/app-shell has its own scale (32 px / radius
  9 / 13–13.5 px) and restyles library components from outside – class overrides and `zoom` – so a component looks
  different inside a screen than in its own demo.
- **Dark mode only fully works with a `.dark` class.** Switched through `color-scheme` (what tokens.css documents as
  `data-tc-theme`), 37 files keep light colours, some unreadably; nothing follows the OS setting; the gallery has no
  theme switch.
- **Scales:** durations are 3,149 literals over 77 values; no spacing token is used anywhere; 15 px is the de-facto
  title size with no token; z-index has no layers (popovers at 10–50, a toast at 9999).
- **Narrow widths are mostly fine** (131 of 187 stages clean at every width). The exceptions are real: Standard
  chat-composer's text shrinks to ~9–11 px, the workspace app shells scroll sideways, two controls disappear below
  375 px.
- **Dead CSS is small** (12 certainly-dead rules, 2.2 KB). The merge's real leftover is 200 byte-identical look-scoped
  rule pairs (21 KB) that can each be one rule.

## Cross-cutting themes

1. **Missing pattern tokens.** Every review converged on the same small set: control height/radius, field, menu, pill,
   kbd, switch, segmented track, card, tray inset, hairline, eyebrow, badge radius, focus offset per look, z-layers,
   a duration ladder and a per-look move easing. Clean already obeys most of them, so for Clean they're mostly
   naming; Standard converges onto them.
2. **Theme switching.** One selector list everywhere (`.dark, [data-theme="dark"], [data-tc-theme="dark"]` plus
   `[data-tc-theme="system"]`), and colours expressed with `light-dark()` instead of `.dark`-scoped overrides. This
   fixes the 37 files, OS dark mode and a gallery toggle in one move.
3. **Composition over restyling.** Blocks and screens should consume components (and their tokens) rather than
   re-implement or override them; theme-level differences (the shell's denser scale) become token overrides on the
   shell root, not class overrides.
4. **Overlap with the other audits.** Contrast, focus rings and target size (WCAG), the hairline/selected-state
   contrast in Clean (WCAG S10), and the endless shimmer animations (performance: `background-position` shimmers are
   the biggest CPU cost) are touched by the same CSS – fix them in the same pass.

## Fix plan

**Pass A – correctness, no design decisions needed** (runs with the WCAG fixes):

1. Theme switching (theme 2): selectors in build-lib and tokens.css, `.dark` overrides → `light-dark()`
   (task-board, ai-workspace, decision-inbox first, then the illustrations), project-flow and voice-orb dark
   handling, a Light/Dark/System toggle in the gallery, a check-tokens rule against new `.dark` colour rules.
2. Narrow-width bugs: clamp chat-composer's `--u` scaling (also fixes ai-workspace), clip the workspace shells,
   email-draft `@media` → `@container`, smart-recommendation actions wrap, restore billing-schedule's selects and
   inline-diff's prev/next, ellipsis + title on clipped labels.
3. Clean drift: date-range-picker accent mapping; agent-inbox, approval-card and agent-cursors Clean CSS onto the
   Clean recipes.
4. Dead CSS: delete the certain-dead rules and keyframes, fix tool-call-card's malformed tail, collapse the 200
   identical look-scoped pairs.
5. Mechanical token adoption with no visible change: duration ladder and `--tc-ease-standard` (snap within ±12 %),
   z-index layers, the 63 hand-built `shadow-raised` copies (also fixes their dark shadow), 15 px title token,
   focus-ring width/offset tokens, then lint rules so literals don't come back.
6. Shimmers on `transform` instead of `background-position`, paused off-screen (performance finding 1).

**Pass B – pattern unification, needs design decisions** (see below):

7. Pattern tokens (control, field, menu, pill, kbd, switch, segmented, card, tray inset, hairline, eyebrow, badge
   radius) defined per look; Button and the components' menus/fields/pills consume them.
8. Standard: hand-rolled buttons → `<Button>`, menus onto the menu tokens, pills onto the pill tokens, tray geometry
   onto one recipe.
9. Screens: remove cross-file overrides and `zoom`; the shell drops its own scale and uses the pattern tokens (decision 2).
10. Blocks: import Button, SegmentedControl, fields, menus and switches from the library.
11. Motion convention per look; tooltip spec; pressed-state rule; badge radius.

## Decisions (2026-10-25)

1. **Standard primary button: flat ink.** Button and the gradient components (decision-inbox, tips-panel,
   email-draft, client-context) move to the solid ink fill used by approval-card, agent-plan, review-center,
   stepper-form and date-range-picker.
2. **Screens: drop the shell's own scale.** Screens use the components' scale; the app shell's primitives move onto
   the shared pattern tokens, and every cross-file override and `zoom` goes.
3. **Blocks: use library parts.** Blocks import Button, SegmentedControl, fields, menus and switches.
4. **Clean motion: emphasized easing** for movement; the 7 components that use plain ease-out switch.

## Follow-ups (not done)

- glass-folder needs an `open` prop (or `data-open`) so app-shell and assistant-home can stop mirroring its hover
  classes.
- Demo coverage: states no demo shows (stepper-form review/success, ai-workspace projects view, client-context empty
  and create, decision-tree sub-questions) – add demo paths, then delete any CSS still unseen.
- Judgement calls left for design: breakdown-chart's segment palette (1.6–2.5:1 against white; the table carries the
  values), fan-out-grid's 12 px cells and agent-queue's 12 px backlog squares (target size; keyboard alternatives
  exist), date-range-picker's in-range band (< 3:1; endpoints and text identify the range), context-map's small tiles
  identified by colour (name and kind are in the focus/hover card).
- The screenshot harness freezes animations at their start or end (`animations: "disabled"`), so finite loops show
  their end state; capture mid-animation frames where that matters.
