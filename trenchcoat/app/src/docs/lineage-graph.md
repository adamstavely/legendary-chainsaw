---
pattern: grid
status: new
related: agent-graph, provenance-summary, claim-answer, trace-waterfall
---

## Overview

Where an output came from, laid out cause to effect: the run, its turns, the queries and tools they called, the
source chunks that came back, the claims made from them and the artifacts that carry those claims. Point at or focus
any step and its whole lineage lights up – everything it came from and everything it feeds. A weak link, where the
context was truncated and a source may not have reached the model in full, is dashed and named. Click a step for its
record; switch to the event chain to read the same steps in the order they happened.

## When to use

- Answering “where did this sentence in the report come from?” for a finished AI output.
- Auditing which sources actually reached the model, and which only partly did.
- Following a claim forward to every document that carries it, before you correct it.

## When not to use

- Watching agents and tools call each other live – use `agent-graph`.
- Timing a run's steps and finding the slow one – use `trace-waterfall`.
- Showing how much of a document is sourced, synthesised or original – use `provenance-summary`.
- Marking up an answer claim by claim for the reader – use `claim-answer`.

## Anatomy

1. **Header** `.tc-head` – a branching icon, the heading, and at its right how many steps and weak links and the view
2. **View** `.ui-lng__tabs` – Graph or Event chain
3. **Column** `.ui-lng__head` – a column's heading and how many steps it holds
4. **Step** `.ui-lng__node` – one node: its column's mark, what it is and a quieter detail
5. **Legend** `.ui-lng__legend` – a link, a weak link and the lit lineage
6. **Record** `.ui-lng__record` – the open step: its fields and passage, what it came from and what it feeds

## Looks

Standard sets the graph in a white card on a gray tray, with the header on the tray; nodes are raised cards with
semibold titles. Clean drops the tray: the header is the first row of one white card, column headings follow the caption style,
and links and icons are drawn thinner. Both colour each column's mark the same way and dash weak links.

## Keyboard

In the graph, the steps are one tab stop.

| Key | What it does |
|---|---|
| Tab | Moves to the view tabs, then into the graph or chain – to the step the keyboard was last on, else the open one, else the first – then into the record |
| ← / → (tabs) | Switches between Graph and Event chain |
| ↓ / ↑ | Moves to the next or previous step in the column (in the chain: the next or previous event) |
| → / ← | Graph: moves along a link to the step it feeds or came from – the linked one nearest in height; without a link, the nearest step in the next or previous column |
| Home / End | The first or last step in the column (in the chain: the first or last event) |
| Ctrl + Home / End | Graph: the first step of the first column, or the last of the last |
| Enter / Space | Opens the step's record, or closes it if it's open |
| Escape | Closes the record; from inside the record, focus returns to its step |

## Screen readers

The component is a region named by its heading. The view is a tablist, “View”, with “Graph” and “Event chain”
controlling one tabpanel. The graph is a grid named by the heading: its first row holds a column header per column
(“Source chunks”), each step is a gridcell whose name reads its label, column and detail, then what it came from and
feeds – “Missed the SLA, Claims, Sourced · 0.86. From SLA report, Incident log (weak link: 4 of 11 rows fit). Feeds
Risk memo.” – and the open step is `aria-selected`. The event chain is a listbox of the same steps, each option adding
“at 2.1s”. The record is a section named by its step's label, with lists headed “Came from” and “Feeds”; a weak link
in them reads “, weak link: 4 of 11 rows fit”. The close button is “Close record”.

## Content

- Label steps by what they are, short enough for a node: “search: renewal clauses”, “Master agreement §7.2”.
- Put the locator or the outcome in `detail` – the file and page, “6 results”, “Sourced · 0.86”.
- Give a weak link a `note` that says how much got through (“4 of 11 rows fit the context”); without one it reads `weakLabel`, “Truncated context”.
- Name columns in your product's words through `columns` – the defaults are Run, Turns, Queries & tools, Source chunks, Claims and Artifacts.

## Do

- Give every step an `at` so the event chain reads in order and shows when it happened.
- Colour claims by where they came from with a node's own `tone` (green sourced, violet model knowledge, amber inferred).
- Put the passage a chunk returned, or the claim as written, in `text` – the record is where people check it.

## Don't

- Don't mark a link weak unless something was actually cut – dashes are a warning, not decoration.
- Don't use it for a live, changing run; it reads best once the run's lineage is recorded.
- Don't cram a whole paragraph into `label`; the node shows one line.

## Example

```html
<tc-lineage-graph id="lineage" heading="Vendor risk memo"></tc-lineage-graph>

<script type="module">
  import "trenchcoat/lineage-graph";
  import "trenchcoat/tokens.css";

  const graph = document.querySelector("#lineage");
  graph.nodes = [
    { id: "run", column: "run", label: "Vendor risk review", at: 0 },
    { id: "q1", column: "query", label: "sql: incidents by vendor", at: 4000 },
    { id: "c1", column: "chunk", label: "Incident log", detail: "rows 1–4 of 11", at: 4100 },
    { id: "k1", column: "claim", label: "Outages are getting longer", at: 9600, tone: "amber" },
  ];
  graph.edges = [
    { from: "run", to: "q1" },
    { from: "q1", to: "c1" },
    { from: "c1", to: "k1", weak: true, note: "4 of 11 rows fit the context" },
  ];
  graph.addEventListener("tc-selected-change", (e) => console.log(e.detail.node?.label));
</script>
```

```tsx
import { useState } from "react";
import { LineageGraph, type LineageEdge, type LineageNode } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const nodes: LineageNode[] = [
  { id: "run", column: "run", label: "Vendor risk review", at: 0 },
  { id: "c1", column: "chunk", label: "Incident log", detail: "rows 1–4 of 11", at: 4100 },
  { id: "k1", column: "claim", label: "Outages are getting longer", at: 9600, tone: "amber" },
];
const edges: LineageEdge[] = [
  { from: "run", to: "c1" },
  { from: "c1", to: "k1", weak: true, note: "4 of 11 rows fit the context" },
];

export function MemoLineage() {
  const [open, setOpen] = useState<string | null>("k1");
  return <LineageGraph title="Vendor risk memo" nodes={nodes} edges={edges} selected={open} onSelectedChange={setOpen} />;
}
```
