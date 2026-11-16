---
pattern: listbox
status: new
related: memory-panel, tool-access-map, context-map, agent-tree
---

## Overview

What an assistant or agent knows, and what it can reach, drawn around it. The agent sits in the middle. What it
remembers fills the left half of a ring, each memory a card with where it came from: a file, a chat or an email, by
name. The tools it can reach fill the right half, each with what it may do there and where ("Read · Exhibitions
space"). Rounded connectors join every card to the agent.

The agent says what it's doing: "Using Spreadsheet" while `using` names a tool, "Learning…" while `learning` names a
memory, "Recalling 2 memories" while `recalling` lists some, or the page's own words in `agent.activity`. A light runs
along the connectors to match: out to the tool in use, in from each memory being recalled, and in from the tool a new
memory came through (its `via`), then out to that memory. Every card a light reaches lights up.

There are six memory spots. With more memories, the last spot says "+N more" and opens the rest. Open any card for its
details: switch a memory or a tool off, forget a memory (Undo stays for a few seconds), or open the file it came from.
The agent itself is a button that offers **Add a file** and **Connect a tool**; the page does the work.

## When to use

- Showing what an assistant knows about a person and their work, and where each piece came from.
- Showing which tools an agent can reach, what it may do with them, and which one it's using right now.
- Letting people manage that in one place: switch a memory or tool off, forget a memory, add a file or connect a tool.

## When not to use

- A long, editable list of memories with categories and search – use `memory-panel`.
- What fills one run's context window – use `context-map`.
- Every tool an agent called in one run, with its calls and a replay – use `tool-access-map`.
- Who started whom in a multi-agent run – use `agent-tree`.

## Anatomy

1. **Agent** `.ui-mgr__agent` – in the middle: its mark, name and what it's doing; a button that opens the menu
2. **Menu** `.ui-mgr__menu` – Add a file and Connect a tool
3. **Memory** `.ui-mgr__memory` – what it remembers, and where from: "budget-winter.xlsx · File"
4. **More** `.ui-mgr__more` – the last memory spot when there are more than six: "+3 more"
5. **Tool** `.ui-mgr__tool` – a tool's name, and what it may do where
6. **Link** `.ui-mgr__link` – the rounded connector from the agent to a card; dashed when the card is off
7. **Pulse** `.ui-mgr__pulse` – the light running along a connector, out or in
8. **Panel** `.ui-mgr__panel` – the open card's details, switch and Forget
9. **Undo** `.ui-mgr__undo` – after forgetting a memory, for `undo-for` ms

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the header
as its first row. The ring is the same in both. The connectors' colours come from `--tc-mgr-link` and
`--tc-mgr-light`, and the light's speed from `--tc-mgr-pulse`; set any of them on the element.

The ring fills the card's width, with cards between 150 and 232 px wide. When the card is too narrow for that, the
agent sits on top with Memories and Tools as two lists under it. With reduced motion the light doesn't run: the
connectors it would use turn the accent colour instead.

## Keyboard

The cards are one tab stop; the agent and the open card's controls are their own.

| Key | What it does |
|---|---|
| ↓ / ↑ | Moves down or up the side you're on |
| → / ← | Crosses to the other side, to the card at about the same height |
| Home / End | Moves to the first memory or the last tool |
| Enter / Space | Opens the card's details, or closes them |
| Escape | Closes the details |
| Delete / Backspace | Forgets the memory in focus; Undo appears under the graph |
| Enter on the agent | Opens Add a file and Connect a tool; Escape closes them |

## Screen readers

The cards are a listbox named by the heading and described by the keys. Inside it, two groups are named "Memories" and
"Tools". Each card is an option, selected while its details are open, whose name is its words: "Winter exhibition
budget €48k budget-winter.xlsx · File", with "Off" first when it's switched off. The agent's button is named by its
name and what it's doing, plus ", add a file or connect a tool", and says whether its menu is expanded. The switches
in the details are real switches ("Use this memory", "Let Assistant use Calendar"). Opening, switching, forgetting and
bringing back are confirmed in a polite status message. The connectors and the light are hidden; the agent's words
say what it's doing.

## Content

- Write a memory as the fact itself, short: "Opening moved to 11 December", not "The user said that…".
- Give `source` as a line on how it was learned: "Agreed in Monday's standup".
- Name the artifact the way people know it: "budget-winter.xlsx", "Standup notes".
- Give a tool's `access` in two or three words ("Read", "Read & write") and its `scope` as the place: "Budget sheets".
- Keep `agent.activity` to a few words, as the agent would say it: "Checking the loans list".

## Do

- Set `via` on memories learned through a tool, so a new one lights the way it came in.
- Keep `using`, `learning` and `recalling` true to what the agent is doing right now, and clear them when it stops.
- Listen to `tc-memories-change` and `tc-tools-change` and save the switches; they're the person's choices.

## Don't

- Don't put more than about eight tools on one side; the ring grows tall.
- Don't treat a memory that's switched off as forgotten; it's kept, only not used.
- Don't use colour alone for a lit or switched-off card; the agent's words and "Off" carry it.

## Example

```html
<tc-memory-graph id="knows" heading="What the assistant knows"></tc-memory-graph>

<script type="module">
  import "@adamstavely/trenchcoat/memory-graph";
  import "@adamstavely/trenchcoat/tokens.css";

  const knows = document.querySelector("#knows");
  knows.agent = { name: "Assistant", subtitle: "Exhibitions team" };
  knows.memories = [
    { id: "m1", text: "Prefers short answers", source: "You asked for it twice", artifact: { name: "Feedback", kind: "chat" } },
    { id: "m2", text: "Winter exhibition budget €48k", artifact: { name: "budget-winter.xlsx" }, via: "sheet" },
    { id: "m3", text: "Opening moved to 11 December", artifact: { name: "Standup notes" }, via: "wiki" },
  ];
  knows.tools = [
    { id: "wiki", name: "Wiki", access: "Read", scope: "Exhibitions space" },
    { id: "sheet", name: "Spreadsheet", access: "Read & write", scope: "Budget sheets" },
  ];
  knows.using = "sheet";
  knows.addEventListener("tc-memories-change", (e) => console.log(e.detail.change, e.detail.memory.text));
  knows.addEventListener("tc-action", (e) => console.log(e.detail.id));
</script>
```

```tsx
import { useState } from "react";
import { MemoryGraph, type MemoryGraphMemory, type MemoryGraphTool } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const start: MemoryGraphMemory[] = [
  { id: "m1", text: "Prefers short answers", artifact: { name: "Feedback", kind: "chat" } },
  { id: "m2", text: "Winter exhibition budget €48k", artifact: { name: "budget-winter.xlsx" }, via: "sheet" },
];
const startTools: MemoryGraphTool[] = [{ id: "sheet", name: "Spreadsheet", access: "Read & write", scope: "Budget sheets" }];

export function Knows() {
  const [memories, setMemories] = useState(start);
  const [tools, setTools] = useState(startTools);
  return (
    <MemoryGraph
      title="What the assistant knows"
      agent={{ name: "Assistant", subtitle: "Exhibitions team" }}
      memories={memories}
      onMemoriesChange={setMemories}
      tools={tools}
      onToolsChange={setTools}
      recalling={["m2"]}
      onAction={(id) => console.log(id)}
    />
  );
}
```
