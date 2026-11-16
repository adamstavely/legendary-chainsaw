---
pattern: radio
status: new
related: agent-tree, decision-inbox, agent-recap, mission-timeline, agent-lanes
---

## Overview

The home of an agent product: every agent at a glance. On top, “Since you looked” – a small chart of the period
stacked by done, failed and needs you, with the totals in a line of words. In the middle, who runs under whom, in the
library's Agent Tree. On the side, what needs you, in the library's Decision Inbox. One filter at the top – All,
Running, Waiting, Failed – applies to all three: the tree keeps the agents with that status and the agents above
them, and the events and decisions keep the ones whose `agentId` it kept. Narrow, it stacks with what needs you first.

## When to use

- The landing page of a product where agents run under an orchestrator.
- Catching up after time away: what finished, what failed and what waits on you, in one place.
- Answering the decisions agents are waiting on beside the tree they come from.

## When not to use

- When each agent was busy over time matters more than who started whom – use `mission-timeline`.
- One run's tree on its own, without the period or the decisions – use `agent-tree`.
- Only the decisions – use `decision-inbox`.
- Only what happened while you were away – use `agent-recap`.

## Anatomy

1. **Intro** `[data-ui="mctl"] > header` – the heading and the status filter
2. **Since you looked** `[data-ui="mctl"] > section` – the title, the line in words, the chart and its legend
3. **Chart** `[data-ui="mctl"] > section > svg` – the period in bins, stacked by done, failed and needs you
4. **Agents** `tc-agent-tree` – who runs under whom, filtered
5. **Needs you** `[data-ui="mctl"] > div > aside` – the Decision Inbox, filtered

## Looks

The block is a page section, not a card. “Since you looked” sits on the gray tray in Standard and on a white card in
Clean; the tree and the inbox carry the look the rest of the way. Clean sets the heading in a lighter weight.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the filter, the tree's buttons and the decisions' answers |
| ← / → | In the filter, picks the previous or next status |
| Enter / Space | Picks a status, folds a branch, opens “needs you” or “failed” in the tree, or gives an answer |
| Escape | In the tree's window: closes it and returns focus to the button that opened it |

The tree and the inbox keep their own keys.

## Screen readers

The heading is the block's heading. The filter is a radio group named “Show agents”, each status with its count of
agents. “Since you looked” is a region named by its title; the chart is an image named “What happened, over time”
followed by the line in words, and the legend is hidden. What needs you is a complementary region named “Needs you”.
The tree and the inbox announce their own changes.

## Content

- Name agents by their role in the work (“Scheduler”, “Translator”), and put the model in `model`.
- Set `agentId` on each event and decision, so the filter keeps it with its agent. Without one, it shows only under
  All.
- Give each event a short `label` – “Glossary file couldn't be read” – for the moments worth a marker.
- Set `since` to the last time the person looked, and `now` to the end of the period. The block reads no clock of
  its own.
- Rename the words with `labels`, e.g. `{ sinceTitle: "Overnight" }`.

## Do

- Keep the filter controlled when the page shows it elsewhere: listen for `tc-filter-change` (`onFilterChange` in
  React).
- Return a promise from `decide` (`onDecide`) and `resolver` (`onResolve`) so answers wait and a failure is shown.
- Set `selectable` (`onSelectAgent` in React) when a card opens the agent's log, and listen for `tc-select`.

## Don't

- Don't leave out `agentId` on decisions – a filter for Waiting would hide them all.
- Don't send everything that happened as events; send what the person would want to know.
- Don't put it in a card – it's a page section.

## Example

```html
<tc-mission-control id="mission"></tc-mission-control>

<script type="module">
  import "@adamstavely/trenchcoat/mission-control";
  import "@adamstavely/trenchcoat/tokens.css";

  const T = Date.UTC(2026, 10, 14, 6, 0);
  const MIN = 60_000;
  const mission = document.querySelector("#mission");
  mission.since = T - 60 * MIN;
  mission.now = T;
  mission.root = {
    id: "lead",
    name: "Notice lead",
    task: "Prepare the winter service-change notice",
    status: "running",
    children: [
      { id: "planner", name: "Planner", task: "List the stops that change", status: "done", cost: 0.31 },
      { id: "scheduler", name: "Scheduler", task: "Draft the new timetables", status: "waiting", ask: "Publish route 31's earlier last run?" },
      { id: "translator", name: "Translator", task: "Translate the notice", status: "failed", error: "The glossary file couldn't be read" },
    ],
  };
  mission.events = [
    { at: T - 50 * MIN, kind: "done", agentId: "planner", label: "Stop list ready" },
    { at: T - 30 * MIN, kind: "needs-you", agentId: "scheduler" },
    { at: T - 10 * MIN, kind: "failed", agentId: "translator", label: "Glossary file couldn't be read" },
  ];
  mission.decisions = [
    { id: "d1", agentId: "scheduler", title: "Publish route 31's earlier last run?", detail: "23:40 becomes 23:10", primary: "Publish", secondary: "Ask the depot" },
  ];
  mission.addEventListener("tc-filter-change", (e) => console.log(e.detail.filter));
  mission.addEventListener("tc-decide", (e) => console.log(e.detail));
</script>
```

```tsx
import { useState } from "react";
import { MissionControl, type MissionAgent, type MissionDecision, type MissionEvent, type MissionFilter } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const T = Date.UTC(2026, 10, 14, 6, 0);
const MIN = 60_000;

const root: MissionAgent = {
  id: "lead",
  name: "Notice lead",
  task: "Prepare the winter service-change notice",
  status: "running",
  children: [
    { id: "scheduler", name: "Scheduler", task: "Draft the new timetables", status: "waiting", ask: "Publish route 31's earlier last run?" },
    { id: "translator", name: "Translator", task: "Translate the notice", status: "failed", error: "The glossary file couldn't be read" },
  ],
};
const events: MissionEvent[] = [{ at: T - 10 * MIN, kind: "failed", agentId: "translator", label: "Glossary file couldn't be read" }];
const decisions: MissionDecision[] = [
  { id: "d1", agentId: "scheduler", title: "Publish route 31's earlier last run?", primary: "Publish", secondary: "Ask the depot" },
];

export function Home() {
  const [filter, setFilter] = useState<MissionFilter>("all");
  return (
    <MissionControl
      root={root}
      events={events}
      decisions={decisions}
      since={T - 60 * MIN}
      now={T}
      filter={filter}
      onFilterChange={setFilter}
      onSelectAgent={(agent) => console.log(agent.id)}
      onDecide={(decision, answer) => console.log(decision.id, answer)}
    />
  );
}
```
