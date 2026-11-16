---
pattern: radio
status: new
related: agent-lanes, decision-inbox, agent-recap, mission-control, agent-tree
---

## Overview

The home of an agent product on one clock. The same frame as Mission Control – “Since you looked” on top, what needs
you on the side, one status filter for all three – but the middle is every agent on its own lane of a live timeline,
in the library's Agent Lanes. An agent's status is read from its tasks: running while any task runs, else waiting
while any waits, else failed when its latest task failed, else done. The filter keeps the lanes of the agents with
that status, and the events and decisions whose `agentId` it kept. Narrow, it stacks with what needs you first.

## When to use

- The landing page of a product where several agents work side by side and hand work to each other.
- Seeing who is busy now, who waits on whom, and where a hand-off went.
- Answering the decisions agents are waiting on beside the lanes they come from.

## When not to use

- When who started whom matters more than when – use `mission-control`.
- The lanes on their own, without the period or the decisions – use `agent-lanes`.
- Only the decisions – use `decision-inbox`.
- Only what happened while you were away – use `agent-recap`.

## Anatomy

1. **Intro** `[data-ui="mtl"] > header` – the heading and the status filter
2. **Since you looked** `[data-ui="mtl"] > section` – the title, the line in words, the chart and its legend
3. **Chart** `[data-ui="mtl"] > section > svg` – the period in bins, stacked by done, failed and needs you
4. **Agents** `tc-agent-lanes` – a lane per agent, filtered
5. **Needs you** `[data-ui="mtl"] > div > aside` – the Decision Inbox, filtered

## Looks

The block is a page section, not a card. “Since you looked” sits on the gray tray in Standard and on a white card in
Clean; the lanes and the inbox carry the look the rest of the way. Clean sets the heading in a lighter weight. Lanes
wider than the room scroll inside the block, never the page.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the filter, Pause, the task blocks lane by lane and the decisions' answers |
| ← / → | In the filter, picks the previous or next status |
| Enter / Space | Picks a status, opens a task's decision or details, or gives an answer |
| Escape | In a task's decision or details: closes it and returns focus to its block |

The lanes and the inbox keep their own keys. The timeline holds still while the pointer or focus is on it.

## Screen readers

The heading is the block's heading. The filter is a radio group named “Show agents”, each status with its count of
agents. “Since you looked” is a region named by its title; the chart is an image named “What happened, over time”
followed by the line in words, and the legend is hidden. What needs you is a complementary region named “Needs you”.
The lanes and the inbox announce their own changes.

## Content

- Name agents by their role in the work (“Scheduler”, “Translator”), and put the model in `model`.
- Keep task titles to a few words – “Draft timetables” – and write `ask` as a question for Approve or Reject.
- Set `agentId` on each event and decision, so the filter keeps it with its agent. Without one, it shows only under
  All.
- Set `since` to the last time the person looked and `now` to the moment shown; `span` sets how much time the lanes
  show, 30 minutes by default.
- Rename the words with `labels`, e.g. `{ agents: "Crew" }`.

## Do

- Keep the filter controlled when the page shows it elsewhere: listen for `tc-filter-change` (`onFilterChange` in
  React).
- Return a promise from `onApprove`, `onReject` and `decide` (`onDecide` in React) so answers wait and a failure is
  shown.
- Set `openable` (`onOpenTask` in React) when a task can open its log, and listen for `tc-open`.

## Don't

- Don't set a task's `end` while it runs or waits – it reaches `now` on its own.
- Don't leave out `agentId` on decisions – a filter for Waiting would hide them all.
- Don't put it in a card – it's a page section.

## Example

```html
<tc-mission-timeline id="mission"></tc-mission-timeline>

<script type="module">
  import "@adamstavely/trenchcoat/mission-timeline";
  import "@adamstavely/trenchcoat/tokens.css";

  const T = Date.UTC(2026, 10, 14, 6, 0);
  const MIN = 60_000;
  const mission = document.querySelector("#mission");
  mission.since = T - 30 * MIN;
  mission.now = T;
  mission.agents = [
    { id: "planner", name: "Planner", model: "Sonnet 5.5" },
    { id: "scheduler", name: "Scheduler", model: "Opus 5.5" },
  ];
  mission.tasks = [
    { id: "p1", agentId: "planner", title: "List changed stops", status: "done", start: T - 28 * MIN, end: T - 19 * MIN, handoffTo: "s1" },
    { id: "s1", agentId: "scheduler", title: "Route 31 last run", status: "waiting", start: T - 18 * MIN, ask: "Publish 23:10 instead of 23:40?" },
  ];
  mission.events = [
    { at: T - 19 * MIN, kind: "done", agentId: "planner", label: "Stop list ready" },
    { at: T - 18 * MIN, kind: "needs-you", agentId: "scheduler" },
  ];
  mission.decisions = [
    { id: "d1", agentId: "scheduler", title: "Publish route 31's earlier last run?", detail: "23:40 becomes 23:10", primary: "Publish", secondary: "Ask the depot" },
  ];
  mission.onApprove = (task) => console.log("approve", task.id);
  mission.onReject = (task) => console.log("reject", task.id);
  mission.addEventListener("tc-filter-change", (e) => console.log(e.detail.filter));
</script>
```

```tsx
import { useState } from "react";
import { MissionTimeline, type MissionDecision, type MissionFilter, type MissionLaneAgent, type MissionLaneTask } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const T = Date.UTC(2026, 10, 14, 6, 0);
const MIN = 60_000;

const agents: MissionLaneAgent[] = [
  { id: "planner", name: "Planner", model: "Sonnet 5.5" },
  { id: "scheduler", name: "Scheduler", model: "Opus 5.5" },
];
const tasks: MissionLaneTask[] = [
  { id: "p1", agentId: "planner", title: "List changed stops", status: "done", start: T - 28 * MIN, end: T - 19 * MIN, handoffTo: "s1" },
  { id: "s1", agentId: "scheduler", title: "Route 31 last run", status: "waiting", start: T - 18 * MIN, ask: "Publish 23:10 instead of 23:40?" },
];
const decisions: MissionDecision[] = [
  { id: "d1", agentId: "scheduler", title: "Publish route 31's earlier last run?", primary: "Publish", secondary: "Ask the depot" },
];

export function Home() {
  const [filter, setFilter] = useState<MissionFilter>("all");
  return (
    <MissionTimeline
      agents={agents}
      tasks={tasks}
      decisions={decisions}
      since={T - 30 * MIN}
      now={T}
      filter={filter}
      onFilterChange={setFilter}
      onOpenTask={(task) => console.log(task.id)}
      onDecide={(decision, answer) => console.log(decision.id, answer)}
    />
  );
}
```
