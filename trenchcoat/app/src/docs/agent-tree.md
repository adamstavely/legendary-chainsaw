---
pattern: none
status: stable
related: agent-graph, agent-lanes, trace-waterfall, fan-out-grid
---

## Overview

Who started whom in a run of agents. An orchestrator splits a job and hands parts to sub-agents, which may start
their own; the tree shows each one as a card – name, model, status, what it was asked, its tools, its cost and how
long it has taken – joined by connectors to the agent that started it. A branch's cost includes everything below
it, and any branch folds to “+3”. The header sums up the run and opens a window to answer agents that need you or
retry ones that failed, without hunting for them in the tree.

## When to use

- Multi-agent runs where it matters who delegated what – for cost, for blame when something fails, or to see what
  a branch is still waiting on.
- Watching a run live: new agents grow in, cards glide when the tree changes and running times tick.
- Answering approvals and retrying failures across a whole run from one place.

## When not to use

- Agents calling tools and each other as a network rather than a hierarchy – use `agent-graph`.
- When each agent was busy over time – use `agent-lanes`.
- Where the time and money of one run went, call by call – use `trace-waterfall`.
- Many identical workers on one job – use `fan-out-grid`.

## Anatomy

1. **Header** `.ui-agt__bar` – the shared card header: a boxed icon, the run’s name and, on the right, its summary
2. **Summary** `.ui-agt__sum` – agents, how many are running, “needs you”, “failed” and the total cost
3. **Agent** `.ui-agt__node` – one agent's card
4. **Status** `.ui-agt__status` – Queued, Running, Needs you, Done, Failed or Stopped
5. **Cost and time** `.ui-agt__cost` – the branch's cost and how long the agent took
6. **Fold** `.ui-agt__fold` – how many sub-agents an agent started; folds the branch to “+3”

## Looks

Standard sets each card's name, status and task on white, inside a gray tray that carries the cost, the time and
the fold button. Clean is one white card per agent with a hairline shadow, the cost and fold in its last row. Both
draw the same connectors and lay the first level side by side when the tree is at least 560 px wide, indenting every
level when it's narrower.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the “needs you” and “failed” buttons, the agents' names (with `selectable`) and the fold buttons |
| Enter / Space | On a fold button: folds or unfolds the branch. On a name: fires `tc-select`. On “needs you” or “failed”: opens or closes its window, with the first answer focused |
| Escape | In the window: closes it and returns focus to the button that opened it |

## Screen readers

The tree is a set of nested lists: the whole tree named by `heading`, and each agent's sub-agents a list named
“Started by Backend”. Fold buttons have `aria-expanded` and say what they hold – “3 sub-agents of Backend”, or “+5
sub-agents of Backend” when folded. “Needs you” and “failed” are buttons with `aria-haspopup="dialog"` and
`aria-expanded`; the window is a dialog named “Agents that need you” or “Agents that failed”, with Reject and
Approve, or Dismiss and Retry, for each agent. The visible summary isn't live; a polite status region says only what
needs attention – “1 agent needs you, 1 failed”, or “No agent running”. An answer whose promise rejects shows an alert,
“Didn't go through – try again”. Connectors, avatars and tool marks are hidden.

## Content

- Name agents by their role in the run (“Backend”, “Spec writer”), not by a model or an id – the model goes in
  `model`.
- Write `task` as the instruction the agent was given: “Add annual prices and proration”.
- Write `ask` as a question someone can answer with Approve or Reject: “Create 3 live prices in Stripe?”.
- Write `error` as what went wrong and why: “Couldn't fetch the brand voice guide (403)”.

## Do

- Set `started` and `ended` so the cards show how long each agent took; pass `now` to drive the clock yourself.
- Return a promise from `resolver` (`onResolve` in React) so the buttons wait and a failure is shown.
- Set `selectable` (`onSelect` in React) when a card can open the agent's log.

## Don't

- Don't flatten the run into one level – the tree is there to show who started whom.
- Don't put the result of an agent's work in `task`; keep the card to what it was asked.
- Don't use it for a single agent's plan – use `agent-plan`.

## Example

```html
<tc-agent-tree id="run" heading="Annual billing run" selectable></tc-agent-tree>

<script type="module">
  import "trenchcoat/agent-tree";
  import "trenchcoat/tokens.css";

  const tree = document.querySelector("#run");
  tree.root = {
    id: "root", name: "Orchestrator", model: "Opus 5.5", task: "Ship annual billing", status: "running", cost: 0.12,
    children: [
      { id: "api", name: "Backend", task: "Add annual prices", status: "done", cost: 0.31 },
      { id: "prices", name: "Stripe setup", task: "Create prices", status: "waiting", ask: "Create 3 live prices in Stripe?" },
    ],
  };
  tree.resolver = (agent, action) => console.log(agent.id, action);
  tree.addEventListener("tc-select", (e) => console.log(e.detail.agent.id));
</script>
```

```tsx
import { AgentTree, type TreeAgent } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const root: TreeAgent = {
  id: "root",
  name: "Orchestrator",
  model: "Opus 5.5",
  task: "Ship annual billing",
  status: "running",
  cost: 0.12,
  children: [
    { id: "api", name: "Backend", task: "Add annual prices", status: "done", cost: 0.31 },
    { id: "prices", name: "Stripe setup", task: "Create prices", status: "waiting", ask: "Create 3 live prices in Stripe?" },
  ],
};

export function Run() {
  return (
    <AgentTree
      title="Annual billing run"
      root={root}
      onResolve={(agent, action) => console.log(agent.id, action)}
    />
  );
}
```
