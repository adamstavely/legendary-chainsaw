---
pattern: disclosure
status: new
related: agent-recap, digest, agent-inbox, decision-card
---

## Overview

The "while you were away" card at the top of a chat thread, right where the person left off. One line says how long
they were gone and since when; then three short groups – Needs you, each with its action; Failed, each with Retry;
and Done, folded to a count that opens. When nothing happened it's a single quiet line, and Mark all seen folds it to
"You're all caught up". It stays a few rows tall, so the thread isn't pushed far down.

Its neighbours do more. Agent Recap is the full overnight picture for a home page – a chart of the period and a board
acted on in place; Agent Inbox has a recap view inside the inbox; Digest summarises a pile of information for reading.
Away Summary is the small catch-up for one thread.

## When to use

- A chat thread where agents kept working after the person left, and they come back to it.
- Some of what happened needs the person: a decision, a failed step to retry.
- The catch-up should fit above the conversation, not replace it.

## When not to use

- A home page that recaps every agent's night, with a chart – use `agent-recap`.
- Everything your agents are working on, as a board – use `agent-inbox`.
- A summary of documents or messages to read – use `digest`.

## Anatomy

1. **Header** – the shared card header: a clock, "While you were away", how long and since when, and Mark all seen
2. **Group** `.ui-aws__group` – Needs you, Failed or Done, with its label and count `.ui-aws__label`
3. **Item** `.ui-aws__item` – a mark for its status, what happened, a quiet line with the detail, agent and time, and its action
4. **Done** `.ui-aws__toggle` – the done items folded to a count, opening into the list
5. **Line** `.ui-aws__line` – nothing new, or caught up after Mark all seen

## Looks

Standard puts the header on the gray tray and the groups on a white card below it. Clean is one white card with the
header as its first row and flatter buttons. In both, the status marks pair a colour with a shape: an exclamation for
Needs you, a cross for Failed and a check for Done.

## Keyboard

| Key | What it does |
|---|---|
| Tab / Shift Tab | Moves between Mark all seen, each item's action and the Done toggle |
| Enter / Space | Acts on the focused button; on the Done toggle, opens or closes the list |

## Screen readers

The card is a `section` named by its heading. Each group is a `section` named by its label and count ("Needs you 2"),
holding a list. An item's button includes what it acts on: "Retry: Tax ID check". The Done toggle is a button with
`aria-expanded` that controls its list. After Mark all seen, a status region says "You're all caught up" and focus
moves to the line that replaced the card.

## Content

- Write each item as what happened, in a few words: "Tax ID check for 3 suppliers", not "Task 4182".
- Put why or what came of it in `detail`: "The registry timed out".
- Name the action for what it does when Review is too vague: `action: "Decide"`.
- Keep Needs you and Failed short – three or four items each. More belongs in `agent-recap` or `agent-inbox`.

## Do

- Show it only when the person was away long enough to miss something.
- Move an item between groups as it's handled – a retried check moves to Done.
- Let Mark all seen clear the card for good in that thread.

## Don't

- Don't list every done item open – the count is the point.
- Don't repeat the thread's own messages; summarise what happened outside it.
- Don't use it as a notification centre for the whole app.

## Example

```html
<tc-away-summary id="away"></tc-away-summary>

<script type="module">
  import "@adamstavely/trenchcoat/away-summary";
  import "@adamstavely/trenchcoat/tokens.css";

  const away = document.querySelector("#away");
  away.since = Date.now() - 3 * 3600_000;
  away.items = [
    { id: "n1", status: "needs-you", title: "Two vendor files for Northwind Paper", action: "Decide" },
    { id: "f1", status: "failed", title: "Tax ID check for 3 suppliers", detail: "The registry timed out" },
    { id: "d1", status: "done", title: "Classified 412 scanned contracts", href: "/contracts" },
  ];
  away.addEventListener("tc-item-action", (e) => agents.act(e.detail.id, e.detail.action));
</script>
```

```tsx
import { AwaySummary, type AwayItem } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function ThreadCatchUp({ leftAt, items, act }: { leftAt: number; items: AwayItem[]; act: (id: string, action: string) => void }) {
  return <AwaySummary since={leftAt} items={items} onItemAction={(action, item) => act(item.id, action)} />;
}
```
