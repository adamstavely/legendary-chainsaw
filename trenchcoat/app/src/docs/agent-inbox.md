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

Give it `since` – when you left – and a third layout joins the switch: **Recap**, “While you were away”. It shows
only what changed since then: the period in words (“Since 6:40 PM · 13h 30m”), a small chart of it with a peak per
task, and the tasks grouped into Needs you, Failed and Done. Recap cards carry their buttons on the card – Approve,
Reject, Retry, and Undo on done tasks marked `undoable` – so the morning's decisions take one click each.

## When to use

- An overview of several long-running agent tasks, where people mostly check in and occasionally decide.
- Tasks that stop to ask for approval and should be handled without leaving the list.
- A home or sidebar view that answers “what needs me, and what's still going?”.
- A morning or return-from-break summary of what agents did unattended (`view="recap"` with `since`).

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
6. **Recap** `.ui-ai__recap` – “While you were away”, the period and its counts, the chart `.ui-ai__chart` with a peak
   `.ui-ai__peak` per task and a legend, then Needs you, Failed and Done with the buttons on each card

## Looks

Both set white cards in quiet gray columns. Standard shows each card's state as a tinted pill (“Waiting for you ·
4m 12s”) and can put an action button (“New task”) in the header. Clean has no header button, writes the column names in
small capitals and the state as plain text beside its glyph. The recap's chart sits on a white card in Standard and in a
quiet gray panel in Clean. In both, List stacks the columns one after another, and
a container narrower than 620px stacks them whichever layout is picked.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the bar, then each card, and into an unfolded card's buttons |
| Enter / Space | On a card, unfolds or folds it; on a button, presses it |
| Escape | Folds the open card and puts focus back on it |
| ← / → / ↑ / ↓ | In Board / List, switches the layout |
| Home / End | In Board / List, picks the first or last layout |
| ← / → / Home / End | On the recap's chart, moves from peak to peak (one tab stop); focus lights the task's card |
| Enter / Space | On a chart peak, moves focus to its card |

## Screen readers

Each column is a section named “Needs you”, “Running” or “Done”. Each card is a button with `aria-expanded`, and its
details are `inert` while folded. Counts are read in words – “6 sources read”, “4 tool calls”. The layout switch is a
`radiogroup` named “Layout”. A polite live region keeps a running summary: “2 need you, 3 running”. While a decision
is on its way the buttons are `aria-busy` and `aria-disabled`; if it fails, an alert says “Didn't go through – try
again”. After Approve, Reject or Retry, focus moves to the card and stays on it when it moves to another column.

In the recap the chart is a group named in words – “Timeline from 6:40 PM to 8:10 AM: 2 need you, 1 failed, 3 done” –
and each peak is a button named by its task, outcome and time: “Approve travel for the field survey – needs you,
2:16 AM”. The outcome is told by the glyph's shape and the legend's words, never by colour alone. Undo is named with
its task (“Undo Tagged new datasets”); after it, the card says “Undone” and focus goes to the card.

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
- For the recap, pass `finishedAt` on each task – when it finished, failed or stopped to ask – so it lands at the right
  place on the chart, and `undoable` only where `onUndo` can really take it back.
- Listen for `tc-undo` and call `preventDefault()` to ask “Are you sure?” first; `onUndo` then isn't called.

## Don't

- Don't put every agent event in `steps` – the card shows the last four; keep them meaningful.
- Don't use it for tasks that finish in seconds; they'll jump columns before anyone reads them.
- Don't hide failed tasks – they sit in Needs you so someone can retry.
- Don't use the recap for a short absence with one or two tasks – the board says it as well.

## Example

```html
<tc-agent-inbox id="inbox" heading="Agent tasks" openable></tc-agent-inbox>

<script type="module">
  import "@adamstavely/trenchcoat/agent-inbox";
  import "@adamstavely/trenchcoat/tokens.css";

  const inbox = document.querySelector("#inbox");
  inbox.tasks = [
    { id: "refund", title: "Refund duplicate charge for Acme Corp", agent: "Opus 5.5", status: "waiting", startedAt: Date.now() - 240000 },
    { id: "migrate", title: "Migrate billing tests to Vitest", agent: "Opus 5.5", status: "running", startedAt: Date.now() - 60000, tools: 12 },
  ];
  inbox.onApprove = (task) => fetch(`/api/tasks/${task.id}/approve`, { method: "POST" });
  inbox.addEventListener("tc-open", (e) => console.log(e.detail.id));

  // The morning recap: what changed since 6:40 PM yesterday
  const recap = document.createElement("tc-agent-inbox");
  recap.view = "recap";
  recap.since = Date.parse("2026-11-05T18:40:00");
  recap.tasks = [
    { id: "tags", title: "Tagged new datasets", agent: "Haiku 5", status: "done", finishedAt: Date.parse("2026-11-05T22:30:00"), undoable: true },
  ];
  recap.onUndo = (task) => fetch(`/api/tasks/${task.id}/undo`, { method: "POST" });
  document.body.append(recap);
</script>
```

```tsx
import { AgentInbox, type AgentTask } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const tasks: AgentTask[] = [
  { id: "refund", title: "Refund duplicate charge for Acme Corp", agent: "Opus 5.5", status: "waiting", startedAt: Date.now() - 240000 },
  { id: "migrate", title: "Migrate billing tests to Vitest", agent: "Opus 5.5", status: "running", startedAt: Date.now() - 60000, tools: 12 },
];

export function Tasks({ approve }: { approve: (id: string) => Promise<void> }) {
  return <AgentInbox title="Agent tasks" tasks={tasks} onApprove={(task) => approve(task.id)} onOpen={(task) => console.log(task.id)} />;
}
```
