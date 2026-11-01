---
pattern: list
status: new
related: handoff, handoff-brief, agent-tree, fan-out-grid
---

## Overview

A task passed along a chain of agents. The agents are listed in order and, between them, each handoff says how much carried over and, in words, how much got lost. The header totals what was lost, so a dropped caveat or missing file is easy to spot. With `view="pipeline"`, the agents run across the top with a queue of waiting work between each pair.

## When to use

- Pipelines where one agent's output is the next one's input.
- Finding out why a later agent didn't know something.
- Seeing where work is piling up between agents, with the pipeline view.

## When not to use

- An agent handing work to a person – use `handoff`.
- One person handing to another – use `handoff-brief`.
- Who started whom, with costs – use `agent-tree`.

## Anatomy

1. **Total** `.ui-agh__total` – how much was lost, in the header
2. **Step** `.ui-agh__step` – an agent, with `.ui-agh__role`, `.ui-agh__summary` and `.ui-agh__status` in words
3. **Handoff** `.ui-agh__link` – how much carried over and `.ui-agh__lost`
4. **Detail** `.ui-agh__detail` – the lists of what carried over and what was lost
5. **Agent details** `.ui-agh__meta` and `.ui-agh__activity` – model and cost, and what it's doing now
6. **Pipeline** `.ui-agh__pipeline` – each `.ui-agh__stage`, with a `.ui-agh__queue` and its `.ui-agh__wire` between them
7. **Queue item** `.ui-agh__item` – a piece of waiting work, with `.ui-agh__warning` when it needs care

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row. A page can set `--tc-agh-dot`, `--tc-agh-rail` and `--tc-agh-wire`. When narrow, the pipeline stacks in order, without its lines.

## Keyboard

| Key | What it does |
|---|---|
| ↑ ↓ | Move between handoffs |
| Home / End | Go to the first or last handoff |
| Enter / Space | Open or close a handoff |
| Escape | Close the open handoff, or clear the picked item from within a queue |
| ← → | In the pipeline, move between queue headers or items |

In the pipeline, the queue headers are one tab stop and the items another. On an item, ↑ ↓ ← → move across all the queues, and Enter or Space picks it. The lines can also be clicked, and the header does the same thing by keyboard.

## Screen readers

The chain is an ordered list named by the heading. The handoffs are one tab stop, and each is a button named for who passed to whom, with `aria-expanded` and `aria-controls`. Status, losses and warnings are always in words. Queue items are buttons with `aria-pressed`. In the pipeline, the agents and queues are read in order in one list, and the lines are hidden.

## Content

Write `carried` and `lost` as things a person would recognise, such as "The note that two studies share a sample". The element only shows what you give it, so what counts as lost is for your system to work out. Queues show only in the pipeline view, between agents next to each other in `steps`, and item ids must be unique across all the queues. `icon` is an element from your page, and is decorative.

## Do

- Report what was dropped, even when it was on purpose.
- Listen for `tc-selected-change` and `tc-item-selected-change` to show more elsewhere on the page.

## Don't

- Don't use `lost` for errors. A failed agent gets `status: "failed"`.
- Don't use `warning` for something that was dropped. That belongs in `lost`.

## Example

```html
<tc-agent-handoff id="chain"></tc-agent-handoff>

<script type="module">
  import "trenchcoat/agent-handoff";
  import "trenchcoat/tokens.css";

  const chain = document.querySelector("#chain");
  chain.steps = [
    { id: "a", agent: "Scout", status: "done" },
    { id: "b", agent: "Writer", status: "running" },
  ];
  chain.handoffs = [{ from: "a", to: "b", carried: ["The papers"], lost: ["The search terms"] }];
</script>
```

```tsx
import { AgentHandoff, type AgentHandoffLink, type AgentHandoffStep } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const steps: AgentHandoffStep[] = [
  { id: "a", agent: "Scout", status: "done" },
  { id: "b", agent: "Writer", status: "running" },
];
const handoffs: AgentHandoffLink[] = [{ from: "a", to: "b", carried: ["The papers"], lost: ["The search terms"] }];

export function Chain() {
  return <AgentHandoff steps={steps} handoffs={handoffs} />;
}
```
