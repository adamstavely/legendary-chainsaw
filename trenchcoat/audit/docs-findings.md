# What documenting every component found

2026-10-26 · Remediation Part 4.3. Writing a page for every component meant reading each one's key handling, live
regions and properties against its README line, its comments and its demo. This is what didn't match. Each page
describes the component as it actually behaves; the items below are for fixing.

## Fixed in Part 4

| Component | What was wrong |
|---|---|
| data-table | In Clean, tags were plain text: a look selector left in front of a comment made the pill rule a descendant selector (also in the frozen React version) |
| agent-lanes | The same mistake took Clean's Reject / Approve button styles; the live region said "1 task need you" |
| smart-recommendation | The card's signal bars never coloured – the rule matched direct children, the bars are one level deeper |
| toaster | The live region ran title and description together ("Invoice sentINV-2041") |
| dropzone | `autoplay` did nothing through the React wrapper: it was only read on connect, and React sets properties afterwards |
| sandbox-log, agent-tree (React) | `onCopy` / `onSelect` kept React's DOM handler type alongside the component's, so a normal callback didn't type-check |

## To fix – behaviour

| Component | What's wrong |
|---|---|
| agent-steering | ⌘/Ctrl+Enter always takes the interrupt path: without `onInterrupt` the note is cleared and announced as sent, but nothing receives it – the text is lost |
| setup-guide | When `tc-done-change` is prevented on a group's last task, the group still folds away and `tc-open-group-change` still fires |
| tips-panel | "N of M done" is announced even when `tc-done-change` is cancelled |
| comments-panel | On the All tab an empty feed says "No edits to run."; the Questions filter also lists resolved questions while its empty text says "No open questions." |
| comment-thread | The status announcement joins text and status with ". ", so a sentence ending in a full stop reads "plan.. Edited 3 cells" |
| agent-graph | With a card open, opening another node's card doesn't move focus to Close |
| agent-tree | The comment says running and waiting agents' times tick; only running ones do |
| email-draft | "⌘ Enter to send" shows all the time; the shortcut only works in the edit field |
| voice-orb | The idle label says "Tap to speak" even when the orb isn't `pressable` |
| integration-settings | The default `siteHint` is written for a shop; "Show key" reveals the whole key at any time; without `onGenerateKey` it invents a demo key |
| kpi-chart | The plot's name says "values per day" whatever the labels are; the demo formats a percentage `delta` as money ("+$9") |
| profile-menu | The default item says "Logout" (the noun); the demo uses "Log out" |

## To fix – accessibility

| Component | What's wrong |
|---|---|
| review-center | The host has no role and its heading is a `<span>`: the workspace is neither a landmark nor a heading |
| date-range-picker | The panel is non-modal and doesn't keep focus inside it |
| compact-breakdown | Highlighting a part is pointer-only (the list still gives every value to everyone) |
| thinking-state | New steps aren't announced, only the finish |
| side-folder | Opens on pointer hover only – no focus trigger, no reduced-motion rule of its own |
| region-dach, integration-flow | Always `role="img"` with a default name, though illustrations are "decorative unless given a `label`" |
| layer-stack | Tabs without tab panels; the comment says focus picks an entry, but focus only pauses the stack |

## To fix – README lines and demos that promise something else

| Component | The README or demo says | The component does |
|---|---|---|
| agent-inbox | "filter tabs with rolling counts", "one calm list" | a three-column board (Needs you / Running / Done) with a Board / List switch and static counts; in Standard the heading overlaps "+ New task" |
| mention-picker | "the pick lands as a chip" | a chip in a contenteditable field, a text token in a textarea or input (as in the demo) |
| comment-thread | "answers @mentions" | sends every reply to `onReply`; finding mentions is the app's |
| logo-cluster | "Your mark on a white disc" | the mark and the seven logos are fixed – no property changes them |
| integration-grid | "fading out toward the edges" | only the tile fill and shadow fade; the logos stay full colour |
| integration-flow | "once round the integrations" | at least five rounds |
| ai-answer (demo) | a list under an intro line | shows "- Stays longer…" as text: a list needs a blank line before it |
| filter-menu (demo) | – | types come from the React twin (`@components/filter-menu`), not `trenchcoat/react` |
| tool-call-card, otp-input (comments) | Standard has a tray; Clean cells use hairline shadows | no tray in either look; Clean uses the field shadow (the hairline was ~1.2:1) |

## The page template

Raised by the writers and handled in Part 4:
- inline code and tag names in API descriptions;
- a Theme section for single-look pieces;
- anatomy pins that skip hidden parts and use whichever look draws the part;
- the toolbar no longer closes a demo's popup;
- local prop types and module functions in the generated data;
- code that wraps;
- a page for the look provider.

Not handled:
- **Parts that only exist in some states** can't be pinned. Their pages describe them below the numbered list, for
  example a diff view's fold button, an error message, or a menu that has to be open.
- **Anatomy items are one line each.**
- **Defaults that are expressions** (`25 * MB`, `30 * 60_000`) show no type or default in the API table – the
  manifest analyzer leaves them empty.
