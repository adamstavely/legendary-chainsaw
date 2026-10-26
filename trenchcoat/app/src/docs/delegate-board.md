---
pattern: none
status: stable
related: agent-queue, agent-lanes, agent-team, data-table
---

## Overview

A board for handing work to agents. New tasks wait on the left under “Unassigned”; the agents sit on the right with
their model, a “Free” or “Busy until 14:32” tag and their queue as small chips, the running task first. Drag a task
onto an agent and the agent previews what it would add (“+12m until 14:44”, and the price when the agent has a
rate); drop it and the card glides into the queue. Queued chips can be dragged to another agent or back to
“Unassigned”. Everything works without a pointer too, and the Auto switch hands every new task to whoever is free
first.

## When to use

- People route work between several agents, and how busy each one is decides where a task should go.
- A router suggests an agent, and a person confirms or overrides it (`suggestion`).
- Showing what each agent has queued, with the running task first, next to the work still waiting.

## When not to use

- One agent's queue on its own, to reorder or cancel – use `agent-queue`.
- Following several agents' runs side by side as they work – use `agent-lanes`.
- An overview of the agents themselves, their roles and state – use `agent-team`.
- Assigning many items at once by column or filter – use `data-table` with an assignee column.

## Anatomy

1. **Bar** `.ui-db__bar` – the heading, a hint about what to do, and the Auto switch
2. **Unassigned** `.ui-db__pile` – the tasks waiting for an agent, with their count
3. **Task** `.ui-db__task` – one waiting task: title, tool logos and rough minutes
4. **Agent** `.ui-db__agent` – an agent's mark, name, model and rate, and the number key that picks it
5. **Load** `.ui-db__tag` – Free, Busy until, or the preview of a task on its way
6. **Queue chip** `.ui-db__chip` – a queued task; the first one, with a spinner, is running

## Looks

Standard puts the bar on the gray tray above a white card that holds the two columns. Clean is one card with the bar
as its first row. Both drag, preview and glide the same way.

## Keyboard

Tasks and queue chips are buttons; Tab moves between them, the “+N” chips and the Auto switch.

| Key | What it does |
|---|---|
| Enter / Space | On a task or chip: picks it up. While picked up: hands it to the chosen agent |
| ↓ / ↑ | While a task is picked up: chooses the next or previous agent – and “Unassigned” for a queued task – wrapping at the ends |
| Escape | Puts the picked-up task back; on a “+N” chip, hides its tooltip |
| 1 – 9 | Hands the focused task or chip to that agent at once |
| Delete / Backspace | On a queued chip: sends it back to “Unassigned” |

Focus follows a task to its new place after a hand-off.

## Screen readers

“Unassigned” and “Agents” are sections named by their headings, and each agent's queue is a list named “Research's
queue”. Every task and chip is described by the instructions (“Drag onto an agent, or click it and then click an
agent. With the keyboard: Enter picks it up, the arrow keys choose…”); the running chip starts with “Running:”. A
polite status follows each step: “Picked up Draft release notes for 3.2. Choose an agent with the arrow keys and
press Enter, or click an agent.” with the first agent's preview, then each choice (“Code Review: +12 min, until
14:44”), the hand-off (“Draft release notes for 3.2 → Code Review”), “… is unassigned again” or “Put back”. Auto is
a `switch` with `aria-checked`. A “+2” chip is named “+2 more tasks”, has `aria-expanded`, and its tooltip lists the
hidden tasks.

## Content

- Write task titles as the job, starting with a verb: “Review PR #482”, “Tag 40 new support tickets”.
- Keep estimates rough – the board shows them as “~12 min” – and update `current` as the running task goes.
- Name agents by what they do (“Research”, “Code Review”) and put the model in `model`.
- Set `rate` only when cost matters for the choice; then the board shows the price of each hand-off and what's
  queued in total.

## Do

- Keep `tasks` the source of truth: update a task's `agentId` from `tc-assign`, and the board follows.
- Pass `now` when the page already has a clock, so every “Busy until” time agrees with it.
- List agents in a stable order – the number keys follow it.

## Don't

- Don't use it for more than nine agents if people rely on the number keys.
- Don't turn Auto on for work that needs a person to choose – it hands tasks out one after another without asking.
- Don't hide estimates; the previews and “Busy until” times are built from them.

## Example

```html
<tc-delegate-board id="board"></tc-delegate-board>

<script type="module">
  import "trenchcoat/delegate-board";
  import "trenchcoat/tokens.css";

  const board = document.querySelector("#board");
  board.agents = [
    { id: "research", name: "Research", model: "Claude Opus", current: 18, rate: 0.08 },
    { id: "review", name: "Code Review", model: "Claude Sonnet", rate: 0.04 },
  ];
  board.tasks = [
    { id: "t1", title: "Summarize churn interviews", estimate: 22, agentId: "research" },
    { id: "t2", title: "Draft release notes for 3.2", estimate: 12 },
  ];
  board.addEventListener("tc-assign", (e) => {
    const { taskId, agentId } = e.detail;
    board.tasks = board.tasks.map((t) => (t.id === taskId ? { ...t, agentId } : t));
  });
</script>
```

```tsx
import { useState } from "react";
import { DelegateBoard, type DelegateAgent, type DelegateTask } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const agents: DelegateAgent[] = [
  { id: "research", name: "Research", model: "Claude Opus", current: 18, rate: 0.08 },
  { id: "review", name: "Code Review", model: "Claude Sonnet", rate: 0.04 },
];

export function Delegate() {
  const [tasks, setTasks] = useState<DelegateTask[]>([
    { id: "t1", title: "Summarize churn interviews", estimate: 22, agentId: "research" },
    { id: "t2", title: "Draft release notes for 3.2", estimate: 12 },
  ]);
  return (
    <DelegateBoard
      agents={agents}
      tasks={tasks}
      onAssign={(taskId, agentId) =>
        setTasks((list) => list.map((t) => (t.id === taskId ? { ...t, agentId } : t)))
      }
    />
  );
}
```
