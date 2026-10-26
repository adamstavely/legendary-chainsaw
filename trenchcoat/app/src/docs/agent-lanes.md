---
pattern: none
status: stable
related: agent-graph, trace-waterfall, agent-plan, approval-card
---

## Overview

A live timeline of a team of agents: one lane per agent, its tasks as blocks along the time they took, and a “now”
line on the right that the window slides towards. It answers “what is every agent doing right now, and who needs
me?” – the running task grows into now and shimmers, a task waiting for a person pulses amber with a “Needs you”
flag, and a click on it opens Approve and Reject in place. Hand-offs between agents are drawn as thin curves, and
any other block opens a short summary of what got done.

## When to use

- Supervising several agents that work in parallel and hand work to each other.
- Approving the steps that need a person without leaving the overview.
- Seeing how long tasks take and where a run is stuck, over the last half hour or so.

## When not to use

- Who calls which tool, as a network – use `agent-graph`.
- The spans of a single run, measured to the millisecond – use `trace-waterfall`.
- One agent's plan, step by step – use `agent-plan`.
- One decision that needs full context and a written reason – use `approval-card`.

## Anatomy

1. **Bar** `.ui-al__bar` – the title, how many tasks run and need you, the window (“Last 30m”) and Pause
2. **Agent** `.ui-al__agent` – the lane's avatar, name, model and current state
3. **Block** `.ui-al__block` – one task across the time it took; opens its details or decision
4. **Time scale** `.ui-al__grid` – minutes ago, along the top and down the lanes
5. **Hand-offs** `.ui-al__curves` – curves from the end of one task to the next agent's task
6. **Now** `.ui-al__now > span` – the right edge of the window
7. **Pause** `.ui-al__pause` – holds the timeline still

## Looks

Standard puts the summary bar on the gray tray above a white card with the lanes. Clean is one white card with the
bar inside it, on top. Both slide the same timeline, use the same colours for running, waiting and failed tasks,
and open the same decision and details.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to Pause, then through the blocks lane by lane; in an open decision, to Reject and Approve |
| Enter / Space | On a block: opens or closes its decision (waiting tasks) or its details; a decision puts focus on Approve |
| Escape | Closes the open decision or details and returns focus to its block |

The timeline holds still while the pointer or focus is on it, so a block never slides away mid-action. A pointer
press outside closes the decision or details.

## Screen readers

Each lane is a list named “Coder's tasks”; each block is a button named with the agent, the task, its state and its
time – “Coder: Implement theme tokens – Done, took 15m” – with `aria-expanded`. A decision is a `dialog` named
“Decide: Ship v3.8”; if the handler fails, an alert says “Didn't go through – try again”. Details are a group named
“Implement theme tokens – details”. A polite live region keeps the count current: “3 running”, or “2 tasks need you”
once anything waits. Pause is a toggle button, “Pause timeline”, with `aria-pressed`, shown only while the clock
moves.

## Content

- Name agents by their job (“Planner”, “Reviewer”) and put the model in `model`.
- Title tasks as short actions: “Implement theme tokens”, “Ship v3.8” – they are cut to the block's width.
- Write `ask` as the exact question: “Deploy v3.8 to production and post the release notes in #releases?”.
- Keep `summary` to two or three short lines of what got done: “Added 48 tokens”.

## Do

- Leave `end` out while a task runs or waits, so its block reaches now.
- Pass the task back with its new status after Approve or Reject – your version replaces the one the lanes show.
- Return a promise from `onApprove` and `onReject` when the decision goes to a server, so a failure is shown.
- Set `span` to the stretch of time that matters – long runs need a wider window.

## Don't

- Don't use more than about six lanes – people can't follow more at once.
- Don't rely on the amber colour alone in your own surrounding UI; the flag and the count already say “Needs you”.
- Don't put a task in `tasks` for an agent that isn't in `agents` – it has no lane to sit in.

## Example

```html
<tc-agent-lanes id="lanes" heading="Release crew"></tc-agent-lanes>

<script type="module">
  import "trenchcoat/agent-lanes";
  import "trenchcoat/tokens.css";

  const lanes = document.querySelector("#lanes");
  const now = Date.now();
  lanes.agents = [
    { id: "code", name: "Coder", model: "Sonnet 5" },
    { id: "ops", name: "Release", model: "Haiku 5" },
  ];
  lanes.tasks = [
    {
      id: "c1",
      agentId: "code",
      title: "Implement theme tokens",
      status: "done",
      start: now - 20 * 60000,
      end: now - 8 * 60000,
      handoffTo: "o1",
    },
    {
      id: "o1",
      agentId: "ops",
      title: "Ship v3.8",
      status: "waiting",
      start: now - 6 * 60000,
      ask: "Deploy v3.8 to production?",
    },
  ];
  lanes.onApprove = (task) => fetch(`/api/tasks/${task.id}/approve`, { method: "POST" });
  lanes.addEventListener("tc-expanded-change", (e) => console.log(e.detail.expanded));
</script>
```

```tsx
import { AgentLanes, type LaneAgent, type LaneTask } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const agents: LaneAgent[] = [
  { id: "code", name: "Coder", model: "Sonnet 5" },
  { id: "ops", name: "Release", model: "Haiku 5" },
];

export function ReleaseCrew({ tasks, approve }: { tasks: LaneTask[]; approve: (id: string) => Promise<void> }) {
  return <AgentLanes title="Release crew" agents={agents} tasks={tasks} onApprove={(task) => approve(task.id)} />;
}
```
