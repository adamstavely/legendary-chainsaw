---
pattern: tree
status: stable
related: agent-tree, tool-call-card, budget-guard, run-compare
---

## Overview

Where the time and the money of an agent run go. On the left the run is a tree of spans – the agent, its LLM calls,
tool calls and sub-agents – and on the right each span is a bar on a timeline that starts when it started and is as
long as it took. Totals sit above: duration, cost, tokens, the number of LLM and tool calls, and errors. While the run
goes on, running bars grow, a “now” line moves across and the axis rescales when the run outgrows it. The slowest
finished call is marked, branches fold into their parent as small marks, and any span opens a small window with its
model, tokens, cost, input, output and error.

## When to use

- Debugging why a run was slow, expensive or failed – which call took the time, which tool errored.
- Watching a live run's steps arrive, with what they cost so far.
- Developer and operator views of agent runs, where timing and overlap matter.

## When not to use

- Who started whom, with status and cost per agent but without a timeline – use `agent-tree`.
- One tool call's arguments and result, inline in a conversation – use `tool-call-card`.
- Setting or watching a spending limit for the run – use `budget-guard`.
- Comparing two runs side by side – use `run-compare`.

## Anatomy

1. **Header** `.ui-tw__bar-head` – the heading, the task and the run's status (Live, Done, Failed)
2. **Totals** `.ui-tw__stats` – duration, cost, tokens, LLM calls, tool calls and errors
3. **Axis** `.ui-tw__layer` – the time ticks and, while the run goes on, the “now” line
4. **Span** `.ui-tw__row` – one span: its name, detail, duration and cost on the left, its bar on the right
5. **Bar** `.ui-tw__bar` – when the span ran, tinted by kind; red when it failed
6. **Slowest** `.ui-tw__slow` – the mark on the slowest finished LLM or tool call

## Looks

Standard sets the header on the gray tray above a white card, and tints every bar by kind – agents, LLM calls and
tool calls each in their own colour. Clean puts everything in one card, draws agent and sub-agent bars in neutral
gray so the LLM and tool calls stand out, and uses slightly larger axis and duration labels. Both fold, rescale and
open details the same way.

## Keyboard

One span is in the tab order at a time; the arrow keys move between spans.

| Key | What it does |
|---|---|
| ↓ / ↑ | Moves to the next or previous span |
| Home / End | Moves to the first or last span |
| → | Unfolds a folded span; on an unfolded one, moves to its first child |
| ← | Folds an unfolded span; on a folded one or a leaf, moves to its parent |
| Enter / Space | Opens or closes the span's details and moves focus into them |
| Escape | Closes the details; from inside them, focus goes back to the span |

Moving to another span closes the open details, so they never cover the rows being read.

## Screen readers

The spans are a `tree` named by the heading (“Trace”), each a `treeitem` with its level, position, `aria-expanded`
when it has children, and `aria-selected` while its details are open. A span reads its name, detail, kind and status,
then its duration and cost (“Plan the research claude-opus, LLM call, Done, 2.3s · $0.058”); a folded span adds how
many spans it hides (“+5 folded”), and the slowest call says “Slowest”. The run's status in the header is a polite
live region, so “Done” or “Failed” is read when the run ends. The details are a `dialog` named “Plan the research
details”, with the stats as a description list and a “Close details” button.

## Content

- Name spans by what they do – “Plan the research”, “search_web” – and put the model, the query or the target in
  `detail`.
- Give LLM calls their `model`, `tokensIn`, `tokensOut` and `cost`; an agent's cost and tokens are added up from its
  children.
- Keep `input` and `output` to a short preview; the details window is small.
- Say what went wrong in `error`, in the words of the system that failed (“403 Forbidden – blocked by bot
  protection”).

## Do

- Give the run's goal as the root span's `input` – the header shows it as the task.
- Pass `startedAt` for a live run and let the element keep its own clock; pass `elapsed` to drive the clock yourself.
- Fold long sub-agent branches by default (`collapsed`) so the top level reads first.

## Don't

- Don't use it for a single call – a timeline of one bar says nothing a duration doesn't.
- Don't format costs in a currency the run isn't billed in; set `formatCost` instead.
- Don't leave `end` on a span that's still running – it stops the bar from growing.

## Example

```html
<tc-trace-waterfall id="trace" heading="Trace"></tc-trace-waterfall>

<script type="module">
  import "trenchcoat/trace-waterfall";
  import "trenchcoat/tokens.css";

  const trace = document.querySelector("#trace");
  trace.root = {
    id: "run", name: "Research agent", kind: "agent", status: "done", start: 0, end: 4100,
    input: "Compare CRM vendors for a 20-person team",
    children: [
      { id: "plan", name: "Plan the research", kind: "llm", status: "done", start: 100, end: 2400,
        model: "claude-opus", tokensIn: 1840, tokensOut: 412, cost: 0.058 },
      { id: "search", name: "search_web", kind: "tool", status: "done", start: 2500, end: 4100,
        detail: "CRM pricing 2026" },
    ],
  };
  trace.addEventListener("tc-open-change", (e) => console.log(e.detail.openId));
</script>
```

```tsx
import { TraceWaterfall, type TraceSpan } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const run: TraceSpan = {
  id: "run",
  name: "Research agent",
  kind: "agent",
  status: "running",
  start: 0,
  input: "Compare CRM vendors for a 20-person team",
  children: [
    { id: "plan", name: "Plan the research", kind: "llm", status: "done", start: 100, end: 2400, cost: 0.058 },
    { id: "search", name: "search_web", kind: "tool", status: "running", start: 2500 },
  ],
};

export function Trace({ startedAt }: { startedAt: number }) {
  return <TraceWaterfall root={run} startedAt={startedAt} onOpenChange={(id) => console.log(id)} />;
}
```
