---
pattern: listbox
status: new
related: agent-graph, tool-permissions, tool-call-card, agent-monitor
---

## Overview

One agent in the middle and every tool it can reach in a ring around it. Each tool says in words where it stands:
"Last call 520ms", "Failed", "Running", "Not used yet" or "No access", with a badge for how many calls it took. A line
joins the agent to every tool it has used. A call in flight sends a pulse along the line, and a failed call turns the
line red and dashed. Tools the agent may not use are dashed and quiet, with no line. Open a tool for its calls,
newest first, with their arguments and results, and replay any one of them on its own. The header counts it up:
"5/9 tools · 6 calls · 1 running".

Calls can come with each tool, or as one feed in `calls`, each naming its tool in `to` and, optionally, the agent in
`from`. That's the shape `tc-agent-graph` takes for its calls (`error` and `pending` are read as failed and running),
so one feed can drive both.

## When to use

- Showing what an agent can reach and what it actually used during a run.
- Debugging a run: which tool failed, what it was asked and what came back, with a replay.
- Reviewing an agent's reach before widening or narrowing it.

## When not to use

- Many agents and the tools they share as a live network – use `agent-graph`.
- Setting which agent may use which tool – use `tool-permissions`.
- One tool call in a transcript – use `tool-call-card`.
- One agent's steps over time – use `agent-monitor`.

## Anatomy

1. **Agent tabs** `.ui-tam__tabs` – with several `agents`, one tab each over the map
2. **Agent** `.ui-tam__agent` – the agent in the middle: name, model, status in words and its task
3. **Tool** `.ui-tam__tool` – a tool in the ring: its icon, name and state in words
4. **Badge** `.ui-tam__badge` – how many calls it took, "2×"
5. **Link** `.ui-tam__link` – from the agent to a tool it used; red and dashed after a failure
6. **Pulse** `.ui-tam__pulse` – runs along the link while a call is in flight
7. **Panel** `.ui-tam__panel` – the open tool: what it is, and its calls
8. **Call** `.ui-tam__call` – status, what was asked, time, arguments, result and Replay
9. **Replay** `.ui-tam__replay` – runs the call again; busy while `onReplay`'s promise is pending

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the header
as its first row. The ring is the same in both. The links' colours come from `--tc-tam-link`, `--tc-tam-running` and
`--tc-tam-failed`, and the pulse's speed from `--tc-tam-pulse`; set any of them on the element.

The ring scales with the card between 320 and 500 px. An open tool's calls sit beside the ring while there's room,
then drop below it; narrower than about 390 px the tools become a plain list under the agent. In a small ring, tools
with a `short` name show it, and the full name is still read.

## Keyboard

The tools are one tab stop; inside the ring the arrows move between them.

| Key | What it does |
|---|---|
| → / ↓ | Moves to the next tool clockwise, wrapping round |
| ← / ↑ | Moves to the previous tool, wrapping round |
| Home / End | Moves to the first or last tool |
| Enter / Space | Opens the tool's calls, or closes them if they're open |
| Escape | Closes the calls |
| ← / → on the agent tabs | Moves to and chooses the previous or next agent |
| Tab | Leaves the ring; the panel's Close and Replay buttons come after it |

## Screen readers

The tools are a listbox named by the heading and described by "Arrow keys move between tools; Enter opens a tool's
calls". Each tool is an option, selected while it's open, whose name is its name, its state in words and how many
calls it took: "Repository Last call 520ms, 2 calls". The agent tabs are a tab list named "Agents". Each Replay
button's name starts with its visible word and adds which call: "Replay call 2 to Repository". Opening a tool and
replaying a call are confirmed in a polite status message: "Opened Terminal", "Replayed the call to Terminal". The
links and the pulse are hidden; the words carry them.

## Content

- Name tools for what they are to the agent: "Repository", "Lab notebook", not product names.
- Give long names a `short` one for small rings: "Notebook" for "Lab notebook".
- Keep a call's `label` to what was asked, in a few words: "read schema.yaml".
- Pass `args` and `result` as strings or plain objects; objects are shown as JSON.

## Do

- List every tool the agent could reach, including the ones it has no access to, so the reach is clear.
- Keep running calls `running` until they finish, so the pulse and the word stay true.
- Return a promise from `onReplay` so the button shows the replay is in progress.

## Don't

- Don't put more than about twelve tools in one ring; split them across agents instead.
- Don't use colour alone for a tool's state; the word under its name is what people read.
- Don't replay calls that change things without asking first; prevent `tc-replay` and confirm.

## Example

```html
<tc-tool-access-map id="reach" heading="Tool access"></tc-tool-access-map>

<script type="module">
  import "@adamstavely/trenchcoat/tool-access-map";
  import "@adamstavely/trenchcoat/tokens.css";

  const reach = document.querySelector("#reach");
  reach.agent = { name: "Data steward", model: "Reasoning model", status: "running", task: "Load the November surveys" };
  reach.tools = [
    { id: "repo", name: "Repository", calls: [{ id: "r1", at: Date.UTC(2026, 10, 6, 14, 2), ms: 520, label: "read schema.yaml" }] },
    { id: "terminal", name: "Terminal", calls: [{ id: "t1", at: Date.UTC(2026, 10, 6, 14, 5), ms: 4200, status: "failed" }] },
    { id: "search", name: "Web search" },
    { id: "mail", name: "Mail", access: "none" },
  ];
  reach.onReplay = (tool, call) => fetch(`/replay/${call.id}`, { method: "POST" });
</script>
```

```tsx
import { useState } from "react";
import { ToolAccessMap, type ToolAccessTool } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const tools: ToolAccessTool[] = [
  { id: "repo", name: "Repository", calls: [{ id: "r1", at: Date.UTC(2026, 10, 6, 14, 2), ms: 520 }] },
  { id: "mail", name: "Mail", access: "none" },
];

export function Reach() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <ToolAccessMap
      title="Tool access"
      agent={{ name: "Data steward", status: "running" }}
      tools={tools}
      selected={selected}
      onSelectedChange={setSelected}
      onReplay={async (tool, call) => {
        await fetch(`/replay/${call.id}`, { method: "POST" });
      }}
    />
  );
}
```
