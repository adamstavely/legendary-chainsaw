---
pattern: none
status: stable
related: approval-card, decision-inbox, agent-inbox, permission-request
---

## Overview

A focused workspace for approving what your agents want to do, one item at a time. The queue on the left is sorted by
risk, then by how long each item has waited; the item you're on shows who proposes it and why, the proposal itself –
fields, a reply, a contract clause, a code diff or a plan – and marks the spans the agent isn't sure about, with its
note and source. Approve, Edit, Reject (with a quick reason) and Skip each have a single key, so a reviewer can work
through dozens of items without the mouse. A decision closes its row with a check or a cross, the next item rises in,
and the last decision can be undone.

## When to use

- A person reviews many agent proposals in a row: refunds, outgoing emails, contract edits, code changes, plans.
- Items carry different risk, and the riskiest or oldest should be handled first.
- Reviewers need to see where the agent is unsure before they approve.

## When not to use

- A single approval inside a chat or a run – use `approval-card`.
- An inbox of decisions with more context per item and no single-key flow – use `decision-inbox`.
- Messages and updates from agents rather than proposals to approve – use `agent-inbox`.
- Asking for access to a tool or scope at run time – use `permission-request`.

## Anatomy

1. **Header** `.tc-head` – the icon, the heading, progress (“12 of 20 reviewed”), the oldest wait and the Undo chip
2. **Filters** `.ui-rvc__filters` – All, High risk and Unsure, with counts
3. **Queue** `.ui-rvc__list` – the waiting items, current one marked
4. **Proposal** `.ui-rvc__proposal` – the fields, text, diff or plan to decide on
5. **Unsure span** `.ui-rvc__flag` – a part the agent isn't sure about; its note shows on hover or focus
6. **Actions** `.ui-rvc__actions` – Approve, Edit, Reject and Skip, each with its key

## Looks

Standard is a white card on a soft gray tray, with the header and progress on the tray above it. Clean is one quiet
white card with hairline dividers. Both mark unsure spans with an amber highlight, turn a
waiting time amber as it nears `sla` and red past it, and put the queue above the item when the element is narrower than about 650 px.

## Keyboard

| Key | What it does |
|---|---|
| A | Approves the current item |
| E | Edits the proposal in place |
| ⌘ / Ctrl + Enter | While editing: approves with the edits |
| R | Asks why it's rejected; then 1–4 picks a reason and rejects |
| S | Skips the item – it stays in the queue, marked “skipped” |
| J / ↓ | Moves to the next item in the queue |
| K / ↑ | Moves to the previous item |
| F | Shows the note of the next unsure span, in turn |
| Z / U / ⌘Z / Ctrl Z | Undoes the last decision |
| Escape | Cancels editing or rejecting; otherwise closes an open note |
| Tab | Moves through the filters, the current queue row, the proposal and the buttons |

The single keys work while focus is anywhere inside and isn't in a text field; `shortcuts="false"` turns them off,
and Escape and the ⌘ / Ctrl combinations keep working. Every button carries its key in `aria-keyshortcuts`.

## Screen readers

The queue is a list named “Queue”; each row is a button that reads the title, how long it has waited (and whether
it's near or past the limit), the type, the risk and the confidence, with `aria-current` on the item you're on. The
filters are toggle buttons in a group named “Filter the queue”. The proposal is a section named after its type
(“Proposal: Refund”). Each unsure span is focusable and described as “The agent is unsure about this part – press F
or focus it for the agent's note”, and by the note itself while it's open. The reject reasons are a group named
“Why reject it?”. A polite live region confirms each step: “Approved: Refund order #4821 for Maya Chen. 12 of 20
reviewed.”, “Skipped: …”, “Undone – … is back in the queue.”, and “Couldn't approve …: <error>. It is back in the
queue.” when saving fails.

## Content

- Write each `title` as the action, with its object: “Refund order #4821 for Maya Chen”, “Reply to Jun Park”.
- Keep `reasoning` to one or two sentences the reviewer can check against the proposal.
- Flag only what the agent is genuinely unsure about, with a `note` that says why and a `source` to check.
- Keep `reasons` short and few – they're picked with 1–4: “Wrong info”, “Tone”, “Not allowed”, “Other”.

## Do

- Return a promise from `onDecide` – the decision shows as saving, and a failure puts the item back with the error.
- Set `sla` to how long items may wait in your process, so overdue ones stand out.
- Pass `reviewed` and `total` so the progress counts the whole session, not only what's on screen.

## Don't

- Don't drop a decided item from `items` before `onDecide` settles – Undo and retry need it.
- Don't use it for low-stakes items that could run without review; approving by habit defeats the purpose.
- Don't turn off the shortcuts for keyboard users without a reason – they make long queues manageable.

## Example

```html
<tc-review-center id="review" reviewed="11"></tc-review-center>

<script type="module">
  import "trenchcoat/review-center";
  import "trenchcoat/tokens.css";

  const review = document.querySelector("#review");
  review.items = [
    {
      id: "refund-4821",
      title: "Refund order #4821 for Maya Chen",
      agent: "Support agent",
      type: "Refund",
      risk: "medium",
      confidence: 0.64,
      createdAt: Date.now() - 12 * 60_000,
      reasoning: "The parcel was lost in transit; policy allows a full refund.",
      fields: [{ label: "Amount", value: [{ text: "€148.00", note: "Includes shipping – policy may exclude it" }] }],
    },
  ];
  review.onDecide = (item, result) => fetch(`/api/review/${item.id}`, { method: "POST", body: JSON.stringify(result) });
  review.addEventListener("tc-undo", (e) => console.log("Undone", e.detail.item.id));
</script>
```

```tsx
import { ReviewCenter, type ReviewItem, type ReviewResult } from "trenchcoat/react";
import "trenchcoat/tokens.css";

async function decide(item: ReviewItem, result: ReviewResult) {
  const res = await fetch(`/api/review/${item.id}`, { method: "POST", body: JSON.stringify(result) });
  if (!res.ok) throw new Error("The server didn't save it");
}

export function Approvals({ items }: { items: ReviewItem[] }) {
  return <ReviewCenter items={items} reviewed={11} sla={45 * 60_000} onDecide={decide} />;
}
```
