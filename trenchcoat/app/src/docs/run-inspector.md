---
pattern: disclosure
status: new
related: trace-waterfall, agent-tree, tool-call-card, agent-recap
---

## Overview

One multi-agent run on one screen. On top, the run's numbers: its status in a mark and a word, how long it took, what
it cost, the tokens, the calls and the errors. Below, who started whom as a tree of agent cards, each with its own
calls – LLM and tool calls – as rows with a small bar on the agent's own time span. A click on a call opens it right
under its row in the library's Tool Call Card, its error first when it failed. Each card shows its first `call-limit`
calls and “Show N more”. The data is a Trace Waterfall span tree: agents and sub-agents are cards, their `llm` and
`tool` children are calls.

## When to use

- Looking into one run after it finished, or while it runs: what each agent did and which call went wrong.
- Debugging a failed run, starting from the error count and the red card.
- Showing a run's cost and tokens next to the calls that spent them.

## When not to use

- Where the time of a run went, on one shared axis – use `trace-waterfall`.
- Who started whom, without the calls – use `agent-tree`.
- A single call on its own – use `tool-call-card`.
- What happened across many runs while you were away – use `agent-recap`.

## Anatomy

1. **Numbers** `.ui-rins__top` – the header and the run's status, duration, cost, tokens, calls and errors
2. **Agent** `.ui-rins__card` – an agent or sub-agent: its name, its role and model, its status, its own cost and time
3. **Call** `.ui-rins__call` – an LLM or tool call: its kind, name, a bar on the agent's time span and how long it took
4. **Detail** `.ui-rins__detail` – the open call, in a Tool Call Card
5. **More** `.ui-rins__more` – “Show N more” or “Show fewer”

## Looks

Standard sets the numbers on a gray tray, each one on a white tile, and the agent cards white on the page. Clean puts
the numbers on one white card with sunken tiles. A failed agent's card has a red hairline in both. Sub-agents step in
under a line; narrow, they step in less and each call's bar moves under its name.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to each card's calls – one stop per card – and to its “Show N more” |
| ↑ / ↓ | Moves to the previous or next call of the card |
| Home / End | Moves to the card's first or last call |
| Enter / Space | Opens or closes the focused call |
| Escape | Closes the open call and returns focus to its row |

## Screen readers

The block is a region named by its heading. The numbers are a description list named “Run numbers”. The agents are
nested lists, the whole tree named “Agents in this run”; each agent is an article named by its name, and its calls a
list named “Calls: Translator”. Each call is a button with `aria-expanded` and `aria-controls` that reads its kind,
name, detail and time, and its status in a word when it's running or failed. Bars and marks are hidden; every status
is a word, never only a colour.

## Content

- Name agents by their role in the run (“Planner”, “Translator”), and put the model in `model`.
- Write an agent's `detail` as what it was asked: “Translate the notice into Spanish and Vietnamese”.
- Give a call's `detail` a few words – the file, the query, the target: “route-names-glossary.csv”.
- Write `error` as what went wrong and why: “Permission denied: the file is in a folder the agent can't read”.
- Give `start` and `end` in ms from the start of the run. For a live run, leave out `end` on what still runs and pass
  `elapsed`.
- Rename the words with `labels`, e.g. `{ more: "{count} more calls" }`.

## Do

- Open the failed call at first with `selected`, so the reader starts at the error.
- Listen for `tc-selected-change` (`onSelectedChange` in React) to show the call elsewhere or keep it in the URL.
- Set `formatCost` when costs aren't in dollars.

## Don't

- Don't put sub-agents' calls under the lead – each call belongs to the agent that made it.
- Don't raise `call-limit` to show every call of a long run; “Show N more” is there for that.

## Example

```html
<tc-run-inspector id="run" call-limit="4"></tc-run-inspector>

<script type="module">
  import "@adamstavely/trenchcoat/run-inspector";
  import "@adamstavely/trenchcoat/tokens.css";

  const S = 1000;
  const run = document.querySelector("#run");
  run.root = {
    id: "run",
    name: "Winter service-change notice",
    kind: "agent",
    status: "failed",
    model: "Opus 5.5",
    start: 0,
    end: 140 * S,
    children: [
      { id: "l1", name: "Plan the notice", kind: "llm", status: "done", start: 0, end: 9 * S, tokensIn: 4200, tokensOut: 910, cost: 0.11 },
      {
        id: "translator",
        name: "Translator",
        kind: "subagent",
        status: "failed",
        detail: "Translate the notice into Spanish",
        start: 84 * S,
        end: 140 * S,
        children: [
          { id: "t1", name: "read_file", kind: "tool", status: "failed", detail: "route-names-glossary.csv", start: 86 * S, end: 88 * S, error: "Permission denied" },
          { id: "t2", name: "Translate to Spanish", kind: "llm", status: "done", start: 89 * S, end: 120 * S, tokensIn: 5200, tokensOut: 5600, cost: 0.09 },
        ],
      },
    ],
  };
  run.selected = "t1";
  run.addEventListener("tc-selected-change", (e) => console.log(e.detail.selected));
</script>
```

```tsx
import { useState } from "react";
import { RunInspector, type InspectorSpan } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const S = 1000;
const run: InspectorSpan = {
  id: "run",
  name: "Winter service-change notice",
  kind: "agent",
  status: "done",
  start: 0,
  end: 70 * S,
  children: [
    {
      id: "planner",
      name: "Planner",
      kind: "subagent",
      status: "done",
      detail: "List every stop that changes",
      start: 10 * S,
      end: 70 * S,
      children: [
        { id: "p1", name: "timetable_lookup", kind: "tool", status: "done", detail: "routes 4, 12, 31", start: 12 * S, end: 30 * S, output: "212 stops, 41 changed" },
        { id: "p2", name: "Summarise changes", kind: "llm", status: "done", start: 31 * S, end: 52 * S, tokensIn: 9800, tokensOut: 1400, cost: 0.06 },
      ],
    },
  ],
};

export function Run() {
  const [selected, setSelected] = useState<string | null>(null);
  return <RunInspector root={run} selected={selected} onSelectedChange={(id) => setSelected(id)} />;
}
```
