---
pattern: list
status: new
related: agent-tree, agent-inbox, agent-lanes, agent-monitor, fan-out-grid
---

## Overview

Several top-level agents side by side, each with the sub-agents it started. Every agent is a card that sums up its
branch in words – “2/4 running”, “1 failed”, “All 3 done”, “1 needs you” – with its status, what the whole branch cost
and how long it has run. The header sums up the fleet: agents and sub-agents, how many are running, how many need you,
and the total cost. Click a card and its tree opens beside the cards, which line up in a column; the card that was
open folds back. A branch where someone waits for you has an Answer button that opens straight to it.

## When to use

- Several independent agents running at once – a team's leads, or one agent per project – where you want the state
  of each at a glance and the detail of one at a time.
- Finding the branch that needs you or failed, without opening every run.

## When not to use

- One run with one orchestrator – use `agent-tree` on its own.
- Background tasks to triage by state, not by who started what – use `agent-inbox`.
- When each agent was busy over time – use `agent-lanes`.
- One agent at work, step by step – use `agent-monitor`.
- Many identical workers on one job – use `fan-out-grid`.

## Anatomy

1. **Header** `.tc-head` – the shared card header, with the fleet's sums `.ui-flt__sum` on the right
2. **Cards** `.ui-flt__cards` – one card `.ui-flt__card` per top-level agent
3. **Status** `.ui-flt__status` – the agent's own state: Queued, Running, Needs you, Done, Failed or Stopped
4. **Task** `.ui-flt__task` – what the agent was asked, in up to two lines
5. **Branch** `.ui-flt__branch` – its sub-agents in words, the most pressing first
6. **Answer** `.ui-flt__answer` – on a branch where someone waits for you
7. **Cost and time** `.ui-flt__cost` – the whole branch's cost, and how long the agent has run
8. **Tree** `.ui-flt__panel` – the open agent's `tc-agent-tree`, with a Close button `.ui-flt__close`

## Looks

Standard sets the header and the cards on a gray tray, each card white; the open tree sits on its own white card.
Clean is one white card with the agents as small raised cards inside it, and the tree drawn straight on the card. In
both, a container at least 640 px wide opens the tree to the right of a column of cards; a narrower one opens it under
its card.

Component tokens: `--tc-agent-fleet-card-min` – a card's smallest width in the grid (220 px);
`--tc-agent-fleet-column` – the column of cards beside an open tree (260 px Standard, 250 px Clean).

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the cards (one stop), each Answer button, then into the open tree |
| ↑ / ↓ / ← / → | Moves between the cards |
| Home / End | Moves to the first or last card |
| Enter / Space | Opens or closes the card's tree |
| Escape | Closes the open tree and returns focus to its card |

## Screen readers

The cards are a list named by the heading. Each card's button reads the agent's name, status and branch – “Report
lead, Running, 1 needs you, 4 sub-agents” – with `aria-expanded`, and controls the tree while it's open. The tree is a
region named “Report lead and its sub-agents”; `tc-agent-tree` describes the rest. Answer reads “Answer for Report
lead”. A polite status says what needs attention: “1 agent needs you, 1 failed”.

## Content

- Name agents by their role (“Report lead”, “Data lead”), and put the model in `model`.
- Write `task` as the instruction the agent was given.
- Give sub-agents `ask` and `error` – the open tree shows them in its “needs you” and “failed” windows.

## Do

- Set `started` and `ended` so the cards show how long each agent ran; pass `now` to drive the clock yourself.
- Pass `resolver` (`onResolve` in React) so answers from the open tree reach your back end.

## Don't

- Don't nest one fleet's agents inside another agent – a fleet is the top level.
- Don't use it for a single run; the extra column only adds a click.

## Example

```html
<tc-agent-fleet id="fleet" heading="Report season"></tc-agent-fleet>

<script type="module">
  import "@adamstavely/trenchcoat/agent-fleet";
  import "@adamstavely/trenchcoat/tokens.css";

  const fleet = document.querySelector("#fleet");
  fleet.agents = [
    { id: "report", name: "Report lead", model: "Opus 5.5", task: "Prepare the annual report", status: "running", cost: 0.42,
      children: [{ id: "chk", name: "Data checker", task: "Check year ranges", status: "waiting", ask: "Include 2016–2022?" }] },
    { id: "archive", name: "Archive curator", task: "File last season's sheets", status: "done", cost: 0.34 },
  ];
  fleet.resolver = (agent, action) => console.log(agent.id, action);
  fleet.addEventListener("tc-open-change", (e) => console.log(e.detail.open));
</script>
```

```tsx
import { AgentFleet, type FleetAgent } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const agents: FleetAgent[] = [
  {
    id: "report",
    name: "Report lead",
    model: "Opus 5.5",
    task: "Prepare the annual report",
    status: "running",
    cost: 0.42,
    children: [{ id: "chk", name: "Data checker", task: "Check year ranges", status: "waiting", ask: "Include 2016–2022?" }],
  },
  { id: "archive", name: "Archive curator", task: "File last season's sheets", status: "done", cost: 0.34 },
];

export function Season() {
  return <AgentFleet title="Report season" agents={agents} onResolve={(agent, action) => console.log(agent.id, action)} />;
}
```
