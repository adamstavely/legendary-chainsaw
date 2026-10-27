---
pattern: disclosure
status: stable
related: agent-queue, decision-inbox, approval-card, delegate-board
---

## Overview

Every background task your agents are working on, in one calm place. Tasks sit in three columns – Needs you,
Running, Done – as cards with a status glyph, the title, a line or two on where it stands, a live clock and how many
tools and sources it used. Click a card and it unfolds in place to show the agent, its last steps and what you can do
now: Approve or Reject when it waits, Retry when it failed, Open when it runs or is done. A card that changes state
shows it where it is first, then glides to its new column, so people can follow what moved.

## When to use

- An overview of several long-running agent tasks, where people mostly check in and occasionally decide.
- Tasks that stop to ask for approval and should be handled without leaving the list.
- A home or sidebar view that answers “what needs me, and what's still going?”.

## When not to use

- A queue people work through one item at a time, in order – use `agent-queue`.
- Decisions only, each with its options and context – use `decision-inbox`.
- One action waiting for approval, inside a chat or a run – use `approval-card`.
- Assigning and handing work between people and agents – use `delegate-board`.

## Anatomy

1. **Header** – the shared card header: a boxed icon, the heading (Agents / title), and on the right the action button (Standard) and the Board / List switch
2. **Board / List** `.ui-ai__views` – the layout
3. **Column** `.ui-ai__lane` – Needs you, Running or Done, with its count
4. **Card** `.ui-ai__card-main` – the task's title, description, state, clock and counts; click to unfold
5. **Details** `.ui-ai__fold` – the agent, the last four steps and the card's buttons

## Looks

Both set white cards in quiet gray columns. Standard shows each card's state as a tinted pill (“Waiting for you ·
4m 12s”) and can put an action button (“New task”) in the header. Clean has no header button, writes the column names in
small capitals and the state as plain text beside its glyph. In both, List stacks the columns one after another, and
a container narrower than 620px stacks them whichever layout is picked.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the bar, then each card, and into an unfolded card's buttons |
| Enter / Space | On a card, unfolds or folds it; on a button, presses it |
| Escape | Folds the open card and puts focus back on it |
| ← / → / ↑ / ↓ | In Board / List, switches the layout |
| Home / End | In Board / List, picks Board or List |

## Screen readers

Each column is a section named “Needs you”, “Running” or “Done”. Each card is a button with `aria-expanded`, and its
details are `inert` while folded. Counts are read in words – “6 sources read”, “4 tool calls”. The layout switch is a
`radiogroup` named “Layout”. A polite live region keeps a running summary: “2 need you, 3 running”. While a decision
is on its way the buttons are `aria-busy` and `aria-disabled`; if it fails, an alert says “Didn't go through – try
again”. After Approve, Reject or Retry, focus moves to the card and stays on it when it moves to another column.

## Content

- Title tasks as the outcome: “Refund duplicate charge for Acme Corp”, not the ticket number alone.
- Use `description` for where the task stands or what it is waiting for – one or two sentences.
- Write steps in the past tense, short: “Matched duplicate charge”.
- Name the agent or model in `agent`, so people know who did the work.

## Do

- Return a promise from `onApprove`, `onReject` and `onRetry` – the buttons wait, and a failure leaves the card as it
  was with a message.
- Keep passing the latest tasks: once a task you pass has a new status or new steps, your version wins.
- Pass `startedAt` so the clock shows real time, even across reloads.

## Don't

- Don't put every agent event in `steps` – the card shows the last four; keep them meaningful.
- Don't use it for tasks that finish in seconds; they'll jump columns before anyone reads them.
- Don't hide failed tasks – they sit in Needs you so someone can retry.

## Example

```html
<tc-agent-inbox id="inbox" heading="Agent tasks" openable></tc-agent-inbox>

<script type="module">
  import "trenchcoat/agent-inbox";
  import "trenchcoat/tokens.css";

  const inbox = document.querySelector("#inbox");
  inbox.tasks = [
    { id: "refund", title: "Refund duplicate charge for Acme Corp", agent: "Opus 5.5", status: "waiting", startedAt: Date.now() - 240000 },
    { id: "migrate", title: "Migrate billing tests to Vitest", agent: "Opus 5.5", status: "running", startedAt: Date.now() - 60000, tools: 12 },
  ];
  inbox.onApprove = (task) => fetch(`/api/tasks/${task.id}/approve`, { method: "POST" });
  inbox.addEventListener("tc-open", (e) => console.log(e.detail.id));
</script>
```

```tsx
import { AgentInbox, type AgentTask } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const tasks: AgentTask[] = [
  { id: "refund", title: "Refund duplicate charge for Acme Corp", agent: "Opus 5.5", status: "waiting", startedAt: Date.now() - 240000 },
  { id: "migrate", title: "Migrate billing tests to Vitest", agent: "Opus 5.5", status: "running", startedAt: Date.now() - 60000, tools: 12 },
];

export function Tasks({ approve }: { approve: (id: string) => Promise<void> }) {
  return <AgentInbox title="Agent tasks" tasks={tasks} onApprove={(task) => approve(task.id)} onOpen={(task) => console.log(task.id)} />;
}
```
