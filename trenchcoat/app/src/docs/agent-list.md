---
pattern: list
status: new
related: agent-summary, agent-fleet, agent-inbox, agent-create
---

## Overview

Every agent in a workspace on one list, with the ones that are failing lifted into **Needs attention** at the top. Each of those says why in words. The rest follow, searched, filtered by status and sorted by name, last run, failures or cost. A row opens the agent.

## When to use

- The home of an agent builder: the place to find an agent, and to see first which ones need fixing.
- An admin's view of every agent in a workspace, with who owns each and what it costs.

## When not to use

- One agent in detail – use `agent-summary`.
- Agents at work right now – use `agent-fleet`, or `agent-inbox` for their background tasks.
- Setting up a new agent – use `agent-create`.

## Anatomy

1. **Tools** `.ui-agl__tools` – `.ui-agl__search`, the status `.ui-agl__chip`s and the `.ui-agl__select` for the sort
2. **Groups** `.ui-agl__group` – Needs attention first, then All agents, each with `.ui-agl__group-title`
3. **Row** `.ui-agl__row` – `.ui-agl__name`, `.ui-agl__desc` and `.ui-agl__why`, `.ui-agl__status` with its `.ui-agl__mark`, `.ui-agl__meta`, `.ui-agl__run` and `.ui-agl__figures`
4. **Empty** `.ui-agl__none` – no agents yet, or none matching, with Clear filters

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row. A page can set `--tc-agl-mark`, the status mark's size. Below 640px each row stacks its figures under the name.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Search, the status chips, the sort, then the rows as one stop |
| ↑ ↓ | Move between agents, across both groups |
| Home / End | Go to the first or last agent |
| Enter / Space | Open the agent |

## Screen readers

The groups are sections named by their headings, and each row is a button whose name holds the agent's name, description, why it needs attention, status, model, owner, last run and figures. A hidden description says how the arrow keys move. The status chips are toggle buttons (`aria-pressed`). After a search or filter, a polite status says how many agents are shown. Status is always a word, never only a colour.

## Content

- `attention` says why an agent needs looking at, in a sentence: what failed and how often. Without it, the list works one out from `runs7d`, `failureRate` and the last run.
- Give `now` to show last runs as "2 hr. ago"; without it they're dates, and the element keeps no clock.
- `cost7d` is a number in `currency`, an ISO 4217 code.

## Do

- Keep the attention sentence about the cause ("the purchase-order export timed out"), not only the symptom.
- Own `sort`, `filter` and `query` when the page keeps them in its URL.

## Don't

- Don't put healthy agents in Needs attention to promote them – it's for what's broken.

## Example

```html
<tc-agent-list id="agents" heading="Operations agents"></tc-agent-list>

<script type="module">
  import "@adamstavely/trenchcoat/agent-list";
  import "@adamstavely/trenchcoat/tokens.css";

  const list = document.querySelector("#agents");
  list.agents = [
    { id: "invoice", name: "Invoice matcher", status: "failing", runs7d: 48, failureRate: 0.25, cost7d: 6.4, attention: "The purchase-order export timed out on 12 runs." },
    { id: "policy", name: "Policy Q&A", status: "live", runs7d: 312, failureRate: 0.01, cost7d: 18.75 },
    { id: "grant", name: "Grant report drafter", status: "draft" },
  ];
  list.addEventListener("tc-agent-open", (e) => console.log("Open", e.detail.id));
  list.addEventListener("tc-sort-change", (e) => console.log("Sort", e.detail.sort));
</script>
```

```tsx
import { useState } from "react";
import { AgentList, type AgentListItem, type AgentListSort } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Agents({ agents, open }: { agents: AgentListItem[]; open: (id: string) => void }) {
  const [sort, setSort] = useState<AgentListSort>("failures");
  return <AgentList title="Operations agents" agents={agents} sort={sort} onSortChange={setSort} onAgentOpen={open} />;
}
```
