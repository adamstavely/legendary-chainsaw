# Style drift across components

2026-10-26. I measured the computed styles of every component's Standard example in the light theme: 117
components, with the 14 AI configuration components left out while they're rebuilt. The measuring script is
`scratchpad/drift/measure.mjs` and its output is `out.json`. The tray and card are consistent: 82 components share
the same 20 px tray, 4 px inset and 16 px card. Everything inside the card drifts.

## What drifts

| Part | Variants | Example |
|---|---|---|
| Card title | **29** size/weight/tracking/colour combinations, 12–21 px, weight 400–600 | agent-graph 14/600, artifact-panel 13/600, gate-config 15/600, comment-thread 15/500, review-center 16/600, autonomy-dial 12/500 grey |
| Buttons | 43 height/radius/size/weight combinations; the two standard sizes (32/10/13/500 and 28/8/13/500) cover only about half | many are 13–16 px at weight 400, hand-rolled instead of using `--tc-control-*` / `--tc-action-*` |
| Framed fields | 36/10 and 28/8 both in use, with no rule for which | |
| Font family | 82 font stacks written out instead of `--tc-font-sans` / `--tc-font-mono`; 6 components render in system-ui, not Inter | agent-ledger, agent-tree, delegate-board, ai-answer, thinking-state, progress-tracker |
| Font size | 52 literal px sizes, many off the scale: 6.5, 7, 7.5, 8.5, 9.5, 10.5, 12.5, 14.5, 16.5, 18, 22 | dropzone, agent-graph, cited-answer, ai-answer |
| Letter-spacing | 180 literal values (-0.006em, -0.01em, -0.011em, -0.02em, 0.5px …) beside the `--tc-tracking-*` scale | |
| Tray | Some card-like components skip the Standard tray | tool-call-card, kpi-chart, progress-tracker, setup-guide, plan-vs-actual |

The root cause is that a few patterns had no token. A card's title had none: captions and eyebrows did, so every
component chose its own title style. The ratchet didn't count literal typography, so nothing stopped the drift.

## Done

- **Card title tokens**, valued per look:
  - `--tc-title-font-size / -font-weight / -line-height / -tracking / -color`:
    - Standard is 14 / strong (600) / 20 / -0.006em;
    - Clean is 15 / strong (500) / 24 / snug.
  - `--tc-subtitle-font-size / -line-height / -color` for the quiet line under a title.
- **Three new ratchet counters**, with today's counts as the baseline: literal font-family, literal font-size
  (px/rem) and literal letter-spacing.

## The standard for the sweep

1. **Card title:** a component's own title uses `--tc-title-*`, and the line under it `--tc-subtitle-*`. Section
   labels inside a card use `--tc-caption-*`, kickers `--tc-eyebrow-*`. A title that is deliberately display-sized
   (a hero number, a big empty state) keeps its own size, with a comment saying why.
2. **Type:**
   - Font families come only from `--tc-font-sans` / `--tc-font-mono`.
   - Font sizes come from the `--tc-font-size-*` scale. An off-scale size is snapped to the nearest step. If it
     really is part of an illustration (a tiny label inside a diagram), it becomes a component token with a comment.
   - Tracking uses `--tc-tracking-*` or a pattern token.
3. **Buttons:**
   - Every button is one of the control sizes (`--tc-control-h-sm/md/lg`, with the matching radius, padding, font
     size and weight) and one of the action recipes (`--tc-action-primary/secondary/ghost/danger-*`).
   - Rows and tiles that are buttons for semantics (a list row, a card you can pick) aren't "buttons" here, but
     their text follows the type scale.
4. **Framed fields:** use `--tc-field-*`. Use `--tc-field-h` in forms (36 px Standard, 32 px Clean); `--tc-field-h-sm` (the small control height) only
   inside a dense toolbar or table row. Borderless inputs inside a composer are fine.
5. **Tray:** in Standard, a component that is a card sits on the tray. Floating surfaces (toasts, menus, popovers)
   and inline controls don't.

## The card header (decided 2026-10-26)

A second measurement found the card headers themselves drifting:
- some titles on the white card, others on the gray tray;
- some with no icon, some with a plain 16 px icon, some with a boxed 28 px icon;
- some black, some gray, and a few accent-blue.

The decision: **in Standard the header sits on the gray tray, above the white card, and every card title has a boxed
28 px icon.**
- **Use `cardHead()` from `src/elements/internal/card-head.ts`.** It renders the boxed icon, a real heading (h3 by
  default), the subtitle and an `aside` slot on the right for a pill, a count or an action. Its CSS is adopted once
  for every element; the `--tc-head-*` tokens size and pad it per look. Don't restyle `.tc-head*` in a component,
  and don't wrap it in another header row.
- **Standard:** the tray holds the header (`cardHead`), then the white card with the content, then (when there is
  one) a footer of actions on the tray. The tray is `--tc-surface-tray` with `--tc-tray-inset` padding and
  `--tc-tray-radius`, as now.
- **Clean:** there is no tray. The header is the card's first row, followed by a hairline divider only where the
  content needs one.
- **Title text:** always `--tc-title-*`, which is the ink colour, never accent or gray. Dynamic state (a status, a
  count) goes in `aside` as a pill, not in the title's colour.
- **The icon:** a 24×24 stroke icon that says what the component is about (a shield for a policy, a plug for a
  connection, a branching arrow for routing). Each component has a fixed default. It's decorative, so give it no
  label.
- **Not cards, so no header:** banners and notices (guardrail-notice, disagreement-banner), toasts and menus,
  inline pieces (badges, chips, fields, buttons), composers, and items inside a list (a task card in a board). A
  component that is a sentence (handoff, permission-request) can keep its sentence as the body, with a short header
  above it.
