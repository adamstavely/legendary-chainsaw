---
pattern: button
status: new
related: grade-distribution, lineage-graph, coverage-matrix, agent-plan
---

## Overview

The chain from open questions to outcomes, one column per stage. By default the stages are Question, Gap, Work,
Paper and Cited by, but the page can name its own. Each card shows its kind, a status pill and its details: progress
and people for work, a venue and metrics for a paper, the venue, year and sector for a citing work. Lines join linked
cards. Pick a card and its whole path lights up: everything upstream it answers to, and everything downstream that
builds on it. The rest dims, so it's easy to see which question a paper resolved and which gaps nobody is working on.

## When to use

- Showing how research questions turn into gaps, work, papers and impact for a topic or a programme.
- Any staged chain where people ask "where did this come from" or "what came of this": requirements to releases,
  risks to controls to evidence.
- Making uncovered items visible – a gap with no work against it has no line to the right.

## When not to use

- Where an AI output came from, run by run – use `lineage-graph`.
- Which checks cover which parts as a grid – use `coverage-matrix`.
- A plan of steps to run in order – use `agent-plan`.
- Counts of how assessments came out – use `grade-distribution`.

## Anatomy

1. **Legend** `.ui-tsp__legend` – the stages in order, each with its colour
2. **Stage** `.ui-tsp__stage` – a column's name and how many items it has, kept in view while the page scrolls
3. **Card** `.ui-tsp__node` – an item: its kind, status pill, title, details, progress and people
4. **Pill** `.ui-tsp__pill` – the status, and a warning pill such as “Uncovered”
5. **Lines** `.ui-tsp__lines` – the links between cards, the traced path drawn darker
6. **More** `.ui-tsp__more` – “+80 more citing works” under a stage with items not shown

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the
header as its first row. The columns, cards and lines are the same in both. Each stage's colour comes from
`--tc-tsp-question`, `--tc-tsp-gap`, `--tc-tsp-work`, `--tc-tsp-paper` and `--tc-tsp-cited`, and the column width from
`--tc-tsp-col`; set any of them on the element.

## Keyboard

The cards are one tab stop; inside the board the arrows move between them.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the previous or next card in the column |
| ← / → | Moves to the nearest card, by height, in the previous or next column |
| Home / End | Moves to the first or last card in the column |
| Enter / Space | Traces the card's path, or clears it if it's the traced card |
| Escape | Clears the trace |
| Tab | Leaves the board; “+N more” buttons come after it |

## Screen readers

The board is a group named by the heading. Each stage is a section headed with its name and count. Each card is a
toggle button – pressed while it's the traced card – that reads its kind, status, title, details and people, and is
described by “Enter traces this card's path; arrow keys move between cards”. Tracing is confirmed in a polite status
message, “Traced 1 question, 1 gap, 1 work item, 1 paper and 3 citing works”, and clearing with “Trace cleared”. The
lines and the stage colours are hidden; the path is in the message.

## Content

- Write questions as questions and gaps as what's missing: “Memristor endurance data above 10⁸ cycles is missing.”
- Keep statuses to one or two words: “Open”, “Partial”, “Blocked”, “In review”.
- Use `flag` for the one thing that needs attention, such as “Uncovered” for a gap with no work.
- Give each stage a `noun` so the announcement reads naturally: `["work item", "work items"]`.

## Do

- Link every card to the cards it leads to, so a trace reaches all the way through.
- Show the most recent citing works and count the rest with `more`.
- Keep to five or six stages so the columns fit without much sideways scrolling.

## Don't

- Don't use tone for anything but status – the stage colours already say which column a card is in.
- Don't put long paragraphs in a card; link to the item's own page instead.
- Don't trace on load unless the page was opened for that item.

## Example

```html
<tc-traceability-spine id="spine" heading="Neuromorphic computing"></tc-traceability-spine>

<script type="module">
  import "trenchcoat/traceability-spine";
  import "trenchcoat/tokens.css";

  const spine = document.querySelector("#spine");
  spine.nodes = [
    { id: "q1", stage: "question", title: "Can spiking nets match dense accuracy at 1% of the energy?", status: "Open", links: ["g1"] },
    { id: "g1", stage: "gap", title: "No energy-normalised benchmark suite.", status: "High", tone: "warning", links: ["w1"] },
    { id: "w1", stage: "work", title: "Benchmark harness", status: "Active", tone: "info", progress: 0.6, links: ["p1"] },
    { id: "p1", stage: "paper", title: "Sparse spiking networks at 40× lower energy", meta: "↓ 18k · 73 cites" },
  ];
  spine.addEventListener("tc-selected-change", (e) => console.log(e.detail.selected, e.detail.path));
</script>
```

```tsx
import { useState } from "react";
import { TraceabilitySpine, type SpineNode } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const nodes: SpineNode[] = [
  { id: "q1", stage: "question", title: "Can spiking nets match dense accuracy at 1% of the energy?", status: "Open", links: ["g1"] },
  { id: "g1", stage: "gap", title: "No energy-normalised benchmark suite.", status: "High", tone: "warning", links: ["w1"] },
  { id: "w1", stage: "work", title: "Benchmark harness", status: "Active", tone: "info", progress: 0.6 },
];

export function Topic() {
  const [selected, setSelected] = useState<string | null>(null);
  return <TraceabilitySpine title="Neuromorphic computing" nodes={nodes} selected={selected} onSelectedChange={setSelected} />;
}
```
