---
pattern: none
status: stable
related: compact-breakdown, kpi-chart, data-table
---

## Overview

A stacked bar chart that people can re-cut themselves. Three pickers choose what to measure (a count, or the sum of
a field), how to slice the bars and how to segment them; hovering or focusing a bar shows its breakdown, and the
legend hides and shows segments. A table under the chart holds the same numbers, so they can be read exactly and
by screen readers. It answers “where is the work, and what is it made of” without building a chart for every
question.

## When to use

- Workload, spend or usage broken down by two fields at once – status by priority, team by type.
- Dashboards where people explore the same records from several angles.
- Any chart whose exact numbers matter as much as its shape.

## When not to use

- One breakdown in a small space, without pickers – use `compact-breakdown`.
- A metric over time – use `kpi-chart`.
- Many columns of record-level detail to sort and filter – use `data-table`.

## Anatomy

1. **Header** – the shared card header: a boxed chart icon, the title, and the grand total `.ui-bc__total` with its unit
2. **Pickers** `.ui-bc__controls` – Measure, Slice and Segment
3. **Bar** `.ui-bc__col` – one slice value, stacked by segment; hover or focus shows its breakdown
4. **Breakdown** `.ui-bc__tooltip` – the bar's total and each segment's share, largest first
5. **Table** `.ui-bc__table` – the same numbers, one row per bar and one column per segment
6. **Legend** `.ui-bc__foot` – a chip per segment value to hide or show it, and Show all

## Looks

Standard sets the pickers, chart and table on a white card in the gray tray, with the legend on the tray below.
Clean has no tray: one white card with the title and total on top, quiet white pickers, hairline gridlines and the
legend as the card's last row. Each look has its own segment palette, every colour at least 3:1 against the
surface in both themes.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the pickers, the bars, the legend chips and Show all; the table too when it scrolls sideways |
| ↓ / ↑ (on a picker) | Opens its list on the picked option; Enter and Space open it too |
| ↓ / ↑, Home / End (in a list) | Moves through the options |
| Enter / Space (in a list) | Picks the option and closes the list |
| Escape | Closes a picker's list, back on its button; on a bar, closes the breakdown without moving focus |
| Enter / Space (on a legend chip) | Hides or shows that segment |

## Screen readers

The chart is a region named by its title. Each picker is a button that opens a listbox, named by its label and
value (“Segment Priority”), with the picked option `aria-selected`. Each bar is a button named with its total
(“In progress: 14 tasks”) and, while its breakdown is open, described by it. The legend is a group named
“Priority – click to show or hide”, its chips toggle buttons whose `aria-pressed` says whether the segment is shown.
The table has row and column headers, and when it is wider than the card it becomes a scrollable region named
“Sprint 24 workload table”.

## Content

- Title the chart with what the records are and their scope: “Sprint 24 workload”, not “Chart”.
- Give each measure a plural `unit` people would say – “tasks”, “points”, “hours” – it follows every total.
- List dimension `values` in their natural order (Backlog → Done, Urgent → Low), not alphabetically.
- Keep values short; long ones are cut under the bars and shown in full on hover and in the table.

## Do

- Give segment values `colors` that mean something (red for Urgent) and keep each at 3:1 against the surface.
- Add `icons` for status-like values – the chart shows them under the bars and in the table.
- Offer a count and at least one summed measure, so people can switch between “how many” and “how much”.

## Don't

- Don't segment by a dimension with more than about seven values – the colours stop being distinguishable.
- Don't slice by time; use `kpi-chart` for trends.
- Don't hide the table to save room – it is the accessible form of the chart.

## Example

```html
<tc-breakdown-chart id="work" heading="Sprint 24 workload"></tc-breakdown-chart>

<script type="module">
  import "trenchcoat/breakdown-chart";
  import "trenchcoat/tokens.css";

  const chart = document.querySelector("#work");
  chart.dimensions = [
    { key: "status", label: "Status", values: ["Todo", "In progress", "Done"] },
    { key: "priority", label: "Priority", values: ["High", "Low"], colors: { High: "#db2777", Low: "#2f6bff" } },
  ];
  chart.measures = [
    { key: "count", label: "Count", unit: "tasks" },
    { key: "points", label: "Points", unit: "points", field: "points" },
  ];
  chart.records = [
    { status: "Todo", priority: "High", points: 3 },
    { status: "In progress", priority: "Low", points: 5 },
    { status: "Done", priority: "High", points: 2 },
  ];
  chart.addEventListener("tc-segment-change", (e) => console.log(e.detail.segment));
</script>
```

```tsx
import { BreakdownChart, type BreakdownRecord, type Dimension, type Measure } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const dimensions: Dimension[] = [
  { key: "status", label: "Status", values: ["Todo", "In progress", "Done"] },
  { key: "priority", label: "Priority", values: ["High", "Low"] },
];
const measures: Measure[] = [{ key: "count", label: "Count", unit: "tasks" }];

export function Workload({ records }: { records: BreakdownRecord[] }) {
  return <BreakdownChart title="Sprint 24 workload" records={records} dimensions={dimensions} measures={measures} defaultSegment="priority" />;
}
```
