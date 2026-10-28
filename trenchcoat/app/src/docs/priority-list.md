---
pattern: list
status: new
related: gap-exposure, coverage-ring, data-table, kpi-chart
---

## Overview

A portfolio's topics or projects by priority, each on one dense row. A badge carries its tier – 1 is the top, in ink;
the others are outlined – beside the name, the owner and team, and its health in words: at risk, watch or on track. The
momentum is a small line over the last few periods with its change, green and ▲ when it's rising, red and ▼ when it's
falling. Coverage is a slim bar with its share, red when it's low. A pill says what's open ("5 gaps") and a mono count
says how much work is in flight ("3·wk"). Chips in the header count each health and filter by one; with `grouped`, rows
fall under a header per priority that counts what's at risk.

## When to use

- A directorate's or a programme's portfolio, ranked so the most important and most at-risk items stand out.
- A dashboard panel that leads into each topic's or project's page.
- Comparing items by momentum and coverage at once, without opening each one.

## When not to use

- The gaps or risks themselves – use `gap-exposure`.
- One share across the whole portfolio – use `coverage-ring`.
- Many columns people sort, filter and edit – use `data-table`.
- One number and its trend in detail – use `kpi-chart`.

## Anatomy

1. **Filters** `.ui-prl__filters` – each health with its count; pressing one shows only that health, again shows all
2. **Columns** `.ui-prl__columns` – the headings over the rows
3. **Group header** `.ui-prl__group-head` – with `grouped`: the tier, how many it holds and how many are at risk
4. **Row** `.ui-prl__row` – one topic or project; opens on Enter or a click
5. **Priority** `.ui-prl__badge` – the tier's number: ink for the top tier, outlined for the rest
6. **Health** `.ui-prl__health` – at risk, watch or on track, in words with a dot
7. **Momentum** `.ui-prl__momentum` – the line and the change, with an arrow and a colour
8. **Coverage** `.ui-prl__coverage` – the share covered over a slim bar
9. **Open** `.ui-prl__open` – what's open, as a pill
10. **Work** `.ui-prl__work` – how much work is in flight

## Looks

Standard is a white card on a gray tray, with the header and the filters on the tray above it. Clean is one white
card with the header as its first row. The rows are the same in both. As the element narrows, the momentum line folds
to just its change, then the work count goes, then the coverage bar and the open pill.

## Keyboard

The filters come first in the tab order, then the rows as one tab stop.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the previous or next row, across groups |
| Home / End | Moves to the first or last row |
| Enter / Space | Opens the row: fires `tc-open`; on a filter, presses or releases it |
| Tab | Moves between the filters, then into and out of the rows |

## Screen readers

Each row is a button that reads the whole row: “Priority 1, Top priority. Neuromorphic Computing Marcus Okonkwo ·
Cognitive Systems. At risk. Momentum down 8%. Coverage 42%. 4 gaps. 4 work items”. The line, arrows and bar are
hidden; their meaning is in the words. The filters are a group labelled “Filter by health”, each a toggle button
that's pressed while its health is shown. With `grouped`, each group is a region named by its tier and count.

## Content

- Name items as people know them: “Neuromorphic Computing”, not a code.
- Give `change` as a fraction of the period's start: -0.14 for a 14% fall.
- Set `open-unit` and `open-unit-one` to what's open: “gaps” and “gap”, “risks” and “risk”.
- Rename the tiers with `tiers` to match your own scale, keeping 1 as the top.

## Do

- Order items by what matters most to your readers: risk first, or the tier, then health.
- Use `grouped` when there are more than about eight items and the tiers mean something to the reader.
- Set `coverage-warn` to the share your team treats as too low.

## Don't

- Don't put actions in the rows; open the item and act there.
- Don't use momentum for something that isn't a trend over time.
- Don't show health by colour alone elsewhere on the page – match the words.

## Example

```html
<tc-priority-list id="topics" heading="Priorities" grouped></tc-priority-list>

<script type="module">
  import "trenchcoat/priority-list";
  import "trenchcoat/tokens.css";

  const topics = document.querySelector("#topics");
  topics.items = [
    { id: "neuro", name: "Neuromorphic Computing", owner: "Marcus Okonkwo", team: "Cognitive Systems", priority: 1, health: "at-risk", trend: [7, 6.9, 6.6, 6.3], change: -0.08, coverage: 0.42, open: 4, work: 4 },
    { id: "carbon", name: "Carbon-Negative Materials", owner: "Sofia Almeida", priority: 1, health: "on-track", trend: [6, 6.5, 7, 6.7], change: 0.12, coverage: 0.71, open: 2, work: 5 },
  ];
  topics.addEventListener("tc-open", (e) => console.log(e.detail.id));
</script>
```

```tsx
import { useState } from "react";
import { PriorityList, type PriorityFilter, type PriorityItem } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const items: PriorityItem[] = [
  { id: "neuro", name: "Neuromorphic Computing", owner: "Marcus Okonkwo", team: "Cognitive Systems", priority: 1, health: "at-risk", trend: [7, 6.9, 6.6, 6.3], change: -0.08, coverage: 0.42, open: 4, work: 4 },
  { id: "carbon", name: "Carbon-Negative Materials", owner: "Sofia Almeida", priority: 1, health: "on-track", trend: [6, 6.5, 7, 6.7], change: 0.12, coverage: 0.71, open: 2, work: 5 },
];

export function Topics() {
  const [filter, setFilter] = useState<PriorityFilter>("all");
  return <PriorityList title="Priorities" items={items} grouped filter={filter} onFilterChange={setFilter} onOpen={(id) => console.log(id)} />;
}
```
