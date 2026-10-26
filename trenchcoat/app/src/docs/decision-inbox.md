---
pattern: none
status: stable
related: approval-card, agent-inbox, permission-request, tips-panel
---

## Overview

A short list of open questions waiting on one person, each with two answers they can give in a click: “Merge” or
“Hold”, “Refund” or “Ask for more”. An answered row confirms what was chosen for about a second, then folds away,
and the heading counts down (“3 need your input”) until it says “All caught up”. It suits the small decisions
agents and teammates leave behind, where opening each one in a page of its own would cost more than the decision.
Saving can be asynchronous: return a promise from `decide` and the row waits for it, and offers both answers again
if it fails.

## When to use

- A handful of yes-or-no-style decisions from agents or automations, each answerable from its title and one line of
  context.
- A side panel or home card that collects what's blocked on the person looking at it.
- Lower-priority decisions that can start folded to one line (`collapsed`) and open when the ones above are done.

## When not to use

- One action an agent wants to take, with a preview and a risk level to weigh – use `approval-card`.
- Background agent tasks with status, steps and more than two outcomes – use `agent-inbox`.
- An agent asking for a right it doesn't have yet (once, for an hour, always) – use `permission-request`.
- Suggestions people can take or leave, with no decision owed – use `tips-panel`.

## Anatomy

1. **Count** `.ui-di__head` – how many decisions need input, or “All caught up”
2. **Decision** `.ui-di__item` – the title, its context and two answers
3. **Context** `.ui-di__detail` – one line under the title
4. **Answers** `.ui-di__actions` – the dark primary and the light secondary button
5. **Folded decision** `.ui-di__title--folded` – a muted one-line title that opens when clicked

## Looks

Standard sets the decisions in a white card inside a gray tray, with the count above them in the tray. Clean is a
single white card whose heading row carries the count, with solid glyphs for the warning and the tick. Both fold
answered rows the same way and turn the count green when everything is answered.

## Keyboard

| Key | What it does |
|---|---|
| Tab / Shift+Tab | Moves between the answer buttons and folded titles |
| Enter / Space | Gives the focused answer, or opens a folded decision |

When a row changes, focus never drops to the page: after an answer it moves to the confirmation (“✓ Merge”), then
to the next open decision's first button as the row folds away; opening a folded decision moves to its first
answer.

## Screen readers

The count is a polite live region, so each answer is followed by the new count – “2 need your input”, “1 needs your
input”, “All caught up”. A folded title is a button with `aria-expanded="false"` that controls the decision's body;
folded and answered rows are `inert`, so they're skipped. While a `decide` promise is pending, the row is
`aria-busy` and both buttons are `aria-disabled`. If it rejects, an alert says “Couldn't save that – try again.”
When nothing is left, the card says “Nothing waiting on you – new decisions show up here.”

## Content

- Write the title as the question, ending in a question mark: “Refund order #48213 ($129.00)?”.
- Put the one fact that decides it in `detail`: checks, amounts, who asked – one line.
- Label answers with verbs that say what happens: “Merge” / “Hold”, “Send” / “Edit first” – not “Yes” / “No”.
- Make `primary` the answer most people give; it's the dark button.

## Do

- Return a promise from `decide` when the answer has to be saved, so a failure doesn't fold the row away.
- Keep the list short – a few decisions at once; fold the rest with `collapsed`.
- Add new decisions to `decisions` as they arrive; answered ones keep folding away on their own.

## Don't

- Don't use it for destructive actions that need a second look – a single click answers.
- Don't put more than two answers in a decision – there's room for exactly two.
- Don't remove an answered decision from `decisions` before it has folded – it disappears without the confirmation.

## Example

```html
<tc-decision-inbox id="inbox"></tc-decision-inbox>

<script type="module">
  import "trenchcoat/decision-inbox";
  import "trenchcoat/tokens.css";

  const inbox = document.querySelector("#inbox");
  inbox.decisions = [
    { id: "d1", title: "Merge the pricing page redesign?", detail: "All checks passed · 2 approvals", primary: "Merge", secondary: "Hold" },
    { id: "d2", title: "Refund order #48213 ($129.00)?", detail: "Arrived damaged – photos attached", primary: "Refund", secondary: "Ask for more" },
  ];
  inbox.decide = (decision, answer) => fetch(`/api/decisions/${decision.id}`, { method: "POST", body: answer });
  inbox.addEventListener("tc-decide", (e) => console.log(e.detail.decision.id, e.detail.answer));
</script>
```

```tsx
import { DecisionInbox, type InboxDecision } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const decisions: InboxDecision[] = [
  { id: "d1", title: "Merge the pricing page redesign?", detail: "All checks passed · 2 approvals", primary: "Merge", secondary: "Hold" },
  { id: "d2", title: "Rotate the staging database password", primary: "Rotate", secondary: "Next week", collapsed: true },
];

export function Decisions() {
  return (
    <DecisionInbox
      decisions={decisions}
      onDecide={(decision, answer) => fetch(`/api/decisions/${decision.id}`, { method: "POST", body: answer })}
    />
  );
}
```
