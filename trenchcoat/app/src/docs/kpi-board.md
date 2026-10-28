---
pattern: combobox
status: new
related: kpi-chart, breakdown-chart, plan-vs-actual, usage-meter
---

## Overview

The top of a dashboard in one piece. One date range sits above everything and changes every card. Three small trend
cards each show a total, its label, the change against the last period and a line of the period. A large overview
compares this period with the last, with its own segment filter. A focus card follows one product or plan: its
total, the change, a line, both periods' numbers and an action. Every chart has one look – a thin angular line, a
quiet fill and dates under the plot. Hover a small card and the day under the pointer gets a dot, its value and its
date; hover the overview for a tooltip comparing both periods that day. Switch the range and every number rolls to
its new value while the lines draw in again.

## When to use

- The first screen of a sales, revenue or product dashboard.
- A weekly or monthly review where people compare this period with the last.
- Anywhere one date range should drive a handful of headline numbers together.

## When not to use

- One metric over time on its own – use `kpi-chart`.
- How a total splits into parts – use `breakdown-chart`.
- Progress against a target or plan – use `plan-vs-actual`.
- Consumption against a limit or quota – use `usage-meter`.

## Anatomy

1. **Bar** `.ui-kb__bar` – the heading and the date range picker (`.ui-kb__pick`)
2. **Trend card** `.ui-kb__stat` – a total, its label, the change (`.ui-kb__change`) and a small plot
3. **Overview** `.ui-kb__overview` – the period's total and change, the segment picker, and both lines
4. **Tooltip** `.ui-kb__tip` – this period and the last at the day under the pointer
5. **Focus card** `.ui-kb__focus` – one product's total, change, line and legend (`.ui-kb__legend`)
6. **Buttons** `.ui-kb__setup` and `.ui-kb__action` – the focus card's optional buttons

## Looks

One look in both Standard and Clean, as the block it came from: cards straight on the page. In Clean, numbers that
would be written in the translucent chart blue use the accent text colour instead. `--tc-kpi-board-stagger` sets
the delay between cards rising in, and `--tc-kpi-board-well` the chart fill.

## Keyboard

The pickers follow the select-only combobox pattern.

| Key | What it does |
|---|---|
| Tab | Moves to the date range, the segment picker and the focus card's buttons |
| ↓ / ↑ | Opens a picker; inside it, moves between options (the active one gets a ring) |
| Home / End | Moves to the first or last option |
| Enter / Space | Picks the active option and closes the picker |
| Escape | Closes the picker, keeping focus on it |

The charts follow the pointer only; their numbers are all in the cards' text.

## Screen readers

Each card is a section named by its label: "Orders", "Gross volume", "Pro plan". The pickers are comboboxes named
"Date range" and "Segment" whose listbox marks the picked option. The charts, dots, tags and axes are hidden – the
totals and changes are text. Rolling numbers are written into the same text, so a reader that reads mid-roll hears a
number, and reads the final one afterwards.

## Content

- Pick three trend cards people check daily; label them with the plain metric: "Revenue", "Orders", "Refunds".
- Set `lowerIsBetter` on metrics where a fall is good news, so its change shows in green.
- Give `formatMoney` your currency and abbreviation rules – "$137k" reads faster than "$137,042.00" on a card.
- Keep labels on each point short and in one format: "24 Oct".

## Do

- Give every range the same three stats, in the same order, so numbers roll in place.
- Use the segment filter for a slice of the overview only – the cards stay on the whole.
- Control `range` when the page's other charts follow it too.

## Don't

- Don't put more than three trend cards in the first row – they get too narrow to read.
- Don't mix currencies across the cards.
- Don't hide the date range – every number depends on it.

## Example

```html
<tc-kpi-board id="board" heading="Overview"></tc-kpi-board>

<script type="module">
  import "trenchcoat/kpi-board";
  import "trenchcoat/tokens.css";

  const labels = ["22 Oct", "23 Oct", "24 Oct"];
  const board = document.querySelector("#board");
  board.ranges = [{ id: "7d", label: "Last 7 days" }];
  board.data = {
    "7d": {
      stats: [{ id: "orders", label: "Orders", kind: "count", labels, values: [120, 132, 128], previous: 360 }],
      overview: { title: "Gross volume", labels, current: [4200, 4500, 4400], previous: [3900, 4100, 4000] },
      focus: { title: "Pro plan", metric: "Product sales rate", unit: "items", labels, values: [38, 41, 40], previous: 110 },
    },
  };
  board.addEventListener("tc-range-change", (e) => console.log(e.detail.range));
</script>
```

```tsx
import { useState } from "react";
import { KpiBoard, type KpiBoardData } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const labels = ["22 Oct", "23 Oct", "24 Oct"];
const week: KpiBoardData = {
  stats: [{ id: "orders", label: "Orders", kind: "count", labels, values: [120, 132, 128], previous: 360 }],
  overview: { title: "Gross volume", labels, current: [4200, 4500, 4400], previous: [3900, 4100, 4000] },
  focus: { title: "Pro plan", metric: "Product sales rate", unit: "items", labels, values: [38, 41, 40], previous: 110 },
};

export function Dashboard() {
  const [range, setRange] = useState("7d");
  return (
    <KpiBoard
      title="Overview"
      data={{ "7d": week }}
      ranges={[{ id: "7d", label: "Last 7 days" }]}
      range={range}
      onRangeChange={setRange}
      action={{ label: "View product report", onClick: () => console.log("report") }}
    />
  );
}
```
