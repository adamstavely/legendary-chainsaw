---
pattern: none
status: stable
related: agent-tree, agent-lanes, trace-waterfall, tool-call-card
---

## Overview

A live map of a multi-agent run: the lead agent in the middle, the agents it hands work to around it, and the
tools, data sources and you on an outer ring. Every call sends a pulse along its link and the answer travels back,
busy links stand out, and an agent that needs you turns amber and shows up as a chip in the bar. It answers “who
is talking to what right now, and does anyone need me?” at a glance; a click on any node opens a card with what it
is doing, its latest calls and its cost.

## When to use

- Watching several agents and their tools work at the same time, where the shape of the work matters more than
  the order of steps.
- Spotting the agent that is waiting for a person, or the tool that keeps failing, in a busy run.
- A run overview next to a detailed log – the graph for orientation, the log for the details.

## When not to use

- One agent working through its steps in order – use `agent-plan` or `trace-waterfall`.
- Who delegated to whom, as a hierarchy that stays put – use `agent-tree`.
- When each agent was doing what, over time – use `agent-lanes`.
- The arguments and result of a single call – use `tool-call-card`.

## Anatomy

1. **Header** – the shared card header: a boxed icon and the heading, with chips for agents that need you or failed, the totals and Pause on its right (narrow, the chips and totals move to a row `.ui-agg__bar` under it)
2. **Totals** `.ui-agg__sum` – agents, tools, calls per minute and the total cost
3. **Pause** `.ui-agg__still` – stops and restarts all motion
4. **Lead agent** `.ui-agg__node[data-lead] .ui-agg__disc` – the agent in the middle; the other agents sit on the inner ring
5. **Tool** `.ui-agg__node[data-kind="tool"] .ui-agg__disc` – a tool or data source on the outer ring, turned towards the agents that use it
6. **Link** `.ui-agg__edge` – a pair that has called each other, or a fixed edge; pulses run along it
7. **Legend** `.ui-agg__legend` – what the pulses and lines mean

## Looks

Standard sits on the gray tray with the graph on a white panel: calls are dots with a tail – solid on the way out,
hollow on the way back – and busy links grow thicker. Clean drops the tray, keeps every link one thin gray line,
and draws calls as short coloured streaks with a soft glow; a stroke turns around each node and a shine passes over
nodes that are waiting or failed. Both use the same layout, cards and keys, and stop every loop with reduced motion
or Pause.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the chips in the bar, Pause and the nodes; focusing a node lights up its links and neighbours |
| Enter / Space | On a node or a chip: opens its card and moves focus to the card's Close button; on an open node: closes it |
| Escape | In the card: closes it and returns focus to the node or chip that opened it |

A pointer press outside the card also closes it.

## Screen readers

Each node is a button named with what it is and what it's doing – “Researcher, agent, working: Comparing
competitor plans. 3 calls in the last minute” – with `aria-haspopup="dialog"` and `aria-expanded`. The card is a
`dialog` labelled with the node's name, and its “Latest calls” list says “To” or “From” before each call. The graph
area is a group named “Pricing review: 4 agents and 5 tools”; the drawing itself is hidden, and a visually hidden
list repeats every node with its calls in the last minute and its cost. A status region announces who needs
attention – “Writer needs you. Browser failed” – as it changes. Pause is a toggle button, “Pause motion”, with
`aria-pressed`.

## Content

- Name agents by their role (“Researcher”, “Writer”) and tools by what they are (“Web search”, “Warehouse”); give
  long names a `short` for narrow containers.
- Use `detail` for the model or the kind of tool – one short line.
- Write `doing` as a present-tense phrase: “Comparing competitor plans”, “Waiting for you to approve the framing”.
- Label calls as verb and object: “search: pricing linear.app”, “run: forecast.py”.
- Set `heading` (`title` in React) to the name of the run, not “Agent graph”.

## Do

- Keep `calls` to a recent window (the demo keeps the last 60) – old calls only feed the totals.
- Set `status: "waiting"` on the agent that needs a person, and send its call `to` the user node, so the link turns
  amber too.
- Pass `now` when you already run a clock, so the calls per minute match the rest of your page.
- Use `formatCost` for any currency other than dollars.

## Don't

- Don't put more than about a dozen tools on one graph – the outer ring gets crowded; split the run instead.
- Don't use the graph as the only place a request for approval appears – pair it with `approval-card` or `handoff`.
- Don't send a call between a node and itself – it draws nothing.

## Example

```html
<tc-agent-graph id="graph"></tc-agent-graph>

<script type="module">
  import "trenchcoat/agent-graph";
  import "trenchcoat/tokens.css";

  const graph = document.querySelector("#graph");
  graph.heading = "Pricing review";
  graph.nodes = [
    { id: "lead", name: "Lead", kind: "agent", lead: true, status: "working" },
    {
      id: "research",
      name: "Researcher",
      kind: "agent",
      status: "working",
      doing: "Comparing competitor plans",
    },
    { id: "search", name: "Web search", short: "Search", kind: "tool", detail: "Search API" },
  ];
  graph.edges = [["lead", "research"]];
  graph.calls = [
    {
      id: "c1",
      from: "research",
      to: "search",
      label: "search: pricing linear.app",
      status: "pending",
      at: Date.now(),
    },
  ];
  graph.addEventListener("tc-select", (e) => console.log(e.detail.node?.name));
</script>
```

```tsx
import { AgentGraph, type GraphCall, type GraphNode } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const nodes: GraphNode[] = [
  { id: "lead", name: "Lead", kind: "agent", lead: true, status: "working" },
  {
    id: "research",
    name: "Researcher",
    kind: "agent",
    status: "working",
    doing: "Comparing competitor plans",
  },
  { id: "search", name: "Web search", short: "Search", kind: "tool", detail: "Search API" },
];

export function RunGraph({ calls }: { calls: GraphCall[] }) {
  return (
    <AgentGraph
      title="Pricing review"
      nodes={nodes}
      calls={calls}
      edges={[["lead", "research"]]}
      onSelect={(n) => console.log(n?.name)}
    />
  );
}
```
