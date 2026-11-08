---
pattern: list
status: new
related: session-panel, agent-tree, agent-inbox, agent-fleet, panel-card
---

## Overview

The sub-agents a working session has started, in a narrow panel. They sit in two groups – **Active** (running, or
waiting for something) and **Done** (finished, failed or stopped) – each with its count. A row is the agent's mark,
its name, what it's doing now, and a time: a clock that ticks while it's active ("1m 26s"), and how long ago it ended
once it's done ("just now", "1h ago"). Waiting, failed and stopped agents say so in words beside what they're doing.

Each agent gets its own mark, drawn from its id – a flower, a star, rings or leaves in one of six tones – so the same
agent is easy to find again, here and wherever else the page draws it with `subagentMark()`. Choosing a row selects it,
for the page to show that agent's transcript or output.

## Using it in an app

- **Pass the session's sub-agents** as `agents`, newest first; the list sorts them into Active and Done itself.
- **Give `startedAt` and `endedAt`** and the times look after themselves: clocks tick once a second while anything is
  active, and the "ago" times refresh every half minute. Pass `now` to hold the clock still (tests, screenshots, replays).
- **Open what's chosen.** Listen for `tc-selected-change` and show that agent's transcript beside the list.
- **Inside a panel**, set `bare` and an empty `heading` – Session Panel does this for its Subagents section.

## When to use

- A side panel or tab beside a session that starts helpers: reviews, searches, test runs.
- Anywhere people need to see at a glance which helpers are still going and which have finished.

## When not to use

- Who started whom, with cost per branch – use `agent-tree`.
- Several orchestrators side by side – use `agent-fleet`.
- A person's background tasks across sessions, with Approve and Retry – use `agent-inbox`.
- One agent's steps in detail – use `agent-monitor`.

## Anatomy

1. **Header** `.ui-sba__count` – the heading with the number active
2. **Card** `.ui-sba__card` – holds the groups
3. **Group label** `.ui-sba__label` – "Active · 1", "Done · 7"
4. **Row** `.ui-sba__row` – one agent, a button; `data-status` says where it is
5. **Mark** `.ui-sba__mark` – the agent's flower, star, rings or leaves; turns slowly while it runs
6. **Name** `.ui-sba__name` – what it was asked to do
7. **Activity** `.ui-sba__activity` – what it's doing now, after `.ui-sba__tag` (Waiting, Failed, Stopped)
8. **Time** `.ui-sba__time` – the clock, or how long ago it ended
9. **Empty** `.ui-sba__empty` – "No subagents yet"

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row. `bare` drops both. Done agents' marks are quieter than active ones; the chosen row is tinted.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Into the list, onto the chosen row (or the first) |
| ↑ / ↓ | The row above or below, across both groups |
| Home / End | The first or last row |
| Enter / Space | Chooses the row |

## Screen readers

Each group is a list named by its label and count ("Active, 1"). Each row is a button named by the agent's name, its
state in words ("Running", "Waiting", "Finished", "Failed", "Stopped"), what it's doing and its time; the chosen row has
`aria-current="true"`. The marks are decorative. A polite status region announces agents that finish, fail, stop or
start waiting ("Review forms current: Finished").

## Content

- Names are short and say what was asked: "Review forms current", "Check citations in chapter 3".
- `activity` is a few lower-case words about now: "awaiting command message", "reading 14 of 40 sources". For a failed
  or stopped agent, say why.
- Give an agent a `mark` seed when the same helper runs in many sessions and should look the same in each.
- Reword everything with `labels`, including `ago` ("{time} ago") and `activeCount` ("{count} active").

## Do

- Keep agents in the list after they finish, so people can open what they did.
- Pass `endedAt` for done agents; without it, they show no time.

## Don't

- Don't colour rows by status yourself – the words and the group already say it.
- Don't re-render every second to move the clocks; the list paints them in place.

## Example

```html
<tc-subagent-list id="helpers"></tc-subagent-list>

<script type="module">
  import "@adamstavely/trenchcoat/subagent-list";
  import "@adamstavely/trenchcoat/tokens.css";

  const list = document.querySelector("#helpers");
  list.agents = [
    { id: "a11y", name: "Review a11y current", status: "waiting", activity: "awaiting command message", startedAt: Date.now() - 86_000 },
    { id: "forms", name: "Review forms current", status: "done", endedAt: Date.now() - 20_000 },
  ];
  list.addEventListener("tc-selected-change", (e) => console.log("open", e.detail.agent.name));
</script>
```

```tsx
import { SubagentList, type Subagent } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Helpers({ agents, onOpen }: { agents: Subagent[]; onOpen: (id: string) => void }) {
  return <SubagentList agents={agents} onSelectedChange={(id) => id && onOpen(id)} />;
}
```
