---
pattern: list
status: new
related: agent-tree, agent-fleet, subagent-list, agent-steering, collaboration-stream
---

## Overview

A lead agent and its sub-agents as one live tree of cards, where every agent stays on screen – working or resting.
Each card says who the agent is and its job, what it does right now (or that it's resting), how full its context
window is in words and a bar, the tools it works with, and the last thing it was handed and by whom.

When one agent hands work to another, a light runs along the connector between them and the card it reaches lights
up for a moment; the handoff is announced too. Choosing a card opens its detail under the tree – task, model, usage
and every tool – with a note to steer it and Pause or Resume. Pass several projects and a row of tabs switches
between their crews.

## Using it in an app

- **Pass each project's crew** as `projects`: the lead with its sub-agents nested in `children`, and the run's
  `handoffs` oldest first. Add a handoff to the list as it happens – only new ones run a light.
- **Keep the cards current**: `status`, `doing` and `context` as the agents report them. A resting agent can leave
  `doing` out.
- **Do the work behind the buttons**: `tc-steer` carries the note, `tc-pause` and `tc-resume` the agent. Prevent
  `tc-steer` to keep the note in the field (when sending it failed, say).
- **Own the open card or the tab** with `opened` and `project` and their change events, if the page needs to.

## When to use

- A multi-agent run where every agent should stay in view – who works right now, who rests, who hands what to whom.
- A dashboard or side panel that shows, per agent, what it's doing, how full its context is and what it was handed.
- Watching several projects' crews from one place and stepping in where an agent needs you.

## When not to use

- Agents that come and go, with cost and time per card and folding branches – use `agent-tree`.
- Several independent orchestrators side by side – use `agent-fleet`.
- What the agents actually say to each other – use `collaboration-stream`.
- A short list of a session's helpers in a narrow panel – use `subagent-list`.

## Anatomy

1. **Header** `.ui-crew__count` – the heading with how many agents are working
2. **Project tabs** `.ui-crew__tabs` – one `.ui-crew__tab` per project, when there are several
3. **Tree** `.ui-crew__tree` – the lead `.ui-crew__lead` over its sub-agents `.ui-crew__level`, helpers hanging in `.ui-crew__below`
4. **Connectors** `.ui-crew__link` – rounded lines from each agent to its sub-agents; `.ui-crew__light` runs along one on a handoff
5. **Card** `.ui-crew__node` – one agent; `data-status` says what it's doing, `data-lit` while a handoff reaches it
6. **Name** `.ui-crew__open` – the button that opens the detail, with `.ui-crew__role` under it
7. **Status** `.ui-crew__status` – a mark and a word: Working, Resting, Needs you, Paused, Failed, Done
8. **Doing** `.ui-crew__doing` – what it does right now, or Resting
9. **Context** `.ui-crew__context` – "62% of context" and a bar, amber from 75%, red from 90%
10. **Tools** `.ui-crew__tool` – up to three chips and "+N"
11. **Last handed** `.ui-crew__handed` – the newest work handed to it, and from whom
12. **Detail** `.ui-crew__detail` – task, model, usage and tools, the steering field `.ui-crew__input`, Pause or Resume

## Looks

Standard puts the header on the gray tray above a white card holding the tree; Clean is one white card with the
header as its first row. Wide, the lead sits over its sub-agents side by side and the tree scrolls sideways if it
doesn't fit; under 440 px every level becomes an indented list. `--tc-crew-card-w`, `--tc-crew-indent` and
`--tc-crew-link` size the cards and colour the connectors.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Into the crew, onto the open agent (or the lead), then the detail |
| ↑ / ↓ / ← / → | The previous or next agent, in reading order |
| Home / End | The lead, or the last agent |
| Enter / Space | Opens or closes the agent's detail |
| Escape | In the detail: closes it, back to the card |
| ← / → on the tabs | The previous or next project |

## Screen readers

Each agent's name is a button named by its name and status ("Budget, Needs you"), with `aria-expanded` and
`aria-controls` pointing at the detail. The sub-agents are a list named after the lead; tools are a list named
"Researcher: Tools". The context bar is a meter named "Researcher: 81% of context". Connectors and the light are
decorative. A polite status region announces every handoff ("Lead handed Budget: Opening hours, 2026"). The project
switcher is a tablist.

## Content

- Names are short and roles say the job: "Researcher – Finds the evidence".
- `doing` is a short present-tense line: "Reading the 2025 census tables". For an agent that needs you, say what for.
- A handoff's `what` names the work, not the act: "Census figures to recheck".
- Reword everything with `labels`, including `context` ("{percent}% of context") and `handoff`.

## Do

- Keep resting agents on screen – that they're idle is part of the picture.
- Add handoffs as they happen, so the light shows the work moving.

## Don't

- Don't use it for dozens of agents – group them, or use `agent-tree` with folding.
- Don't colour cards by status yourself; the mark and the word already say it.

## Example

```html
<tc-agent-crew id="crew" heading="Grant crew"></tc-agent-crew>

<script type="module">
  import "@adamstavely/trenchcoat/agent-crew";
  import "@adamstavely/trenchcoat/tokens.css";

  const crew = document.querySelector("#crew");
  crew.projects = [
    {
      id: "grant",
      name: "Library grant",
      lead: {
        id: "lead", name: "Lead", role: "Plans and assembles", status: "working", doing: "Merging the needs statement", context: 0.48, tools: ["Docs"],
        children: [
          { id: "research", name: "Researcher", role: "Finds the evidence", status: "working", doing: "Reading the census tables", context: 0.81, tools: ["Web search", "Sheets"] },
          { id: "budget", name: "Budget", role: "Costs the project", status: "waiting", doing: "Needs the opening hours", context: 0.34, tools: ["Sheets"] },
          { id: "editor", name: "Editor", role: "Writes it up", status: "resting", context: 0.07, tools: ["Docs"] },
        ],
      },
      handoffs: [{ id: "h1", from: "lead", to: "research", what: "Questions about local need" }],
    },
  ];
  crew.addEventListener("tc-steer", (e) => console.log(e.detail.agent.name, e.detail.note));
</script>
```

```tsx
import { AgentCrew, type CrewProject } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Crew({ projects, steer }: { projects: CrewProject[]; steer: (agentId: string, note: string) => void }) {
  return <AgentCrew title="Crew" projects={projects} onSteer={(agent, note) => steer(agent.id, note)} />;
}
```
