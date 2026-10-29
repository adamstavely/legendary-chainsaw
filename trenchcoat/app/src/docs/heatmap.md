---
pattern: grid
status: new
related: activity-calendar, activity-clock, coverage-matrix, data-table
---

## Overview

A matrix of rows by columns, each cell shaded by its value – instrument use by weekday and hour, error rates by
service and region, scores by team and quarter. The scale is sequential, from light to dark, or diverging, with two
colours either side of a midpoint for a change or a difference. It bins the values into a few shades (5 by default) or
shades them continuously. A legend says what the shades mean, the footer names the highest and lowest cells, and a
cell with no data is hatched. Pointing at or focusing a cell shows “Row · Column: value”, and Enter or a click selects
it. The Table button swaps the chart for the same numbers as a plain table.

## When to use

- Patterns across two dimensions: busy hours in the week, hot spots by region and service.
- Comparing many cells at once, where the shape matters more than any one number.
- A change or difference against a baseline – with the diverging scale.

## When not to use

- A year of activity by day – use `activity-calendar`.
- When in the day something happens, as a ring – use `activity-clock`.
- Which checks cover which parts, with a status per cell – use `coverage-matrix`.
- Exact values people will sort, filter and compare row by row – use `data-table`.

## Anatomy

1. **Table** `.ui-heat__toggle` – swaps the chart for the table, in the header
2. **Row label** `.ui-heat__rowhead` – down the side, staying put while the grid scrolls
3. **Column label** `.ui-heat__colhead` – along the top
4. **Cell** `.ui-heat__cell` – a square shaded by its value; hatched when there's no data
5. **Value** `.ui-heat__num` – the value in the cell, with `show-values`
6. **Tooltip** `.ui-heat__tip` – “Row · Column: value” for the cell under the pointer or focus
7. **Summary** `.ui-heat__summary` – the highest and lowest cells
8. **Legend** `.ui-heat__legend` – the scale's ends and its shades, and no data when some cells have none
9. **Data table** `.ui-heat__table` – the table view

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the header
as its first row. The cells mix `--tc-heat-ink` (by default `--tc-chart-1`) into `--tc-heat-track`; a diverging scale
uses `--tc-heat-ink-low` (`--tc-chart-3`) below the midpoint. `--tc-heat-cell-w`, `--tc-heat-cell-h`,
`--tc-heat-label` and `--tc-heat-gap` size the cells, the row labels and the gaps. All can be set on the element.

## Keyboard

The chart is one tab stop, on the selected cell or else the first; inside it the arrows move between cells.

| Key | What it does |
|---|---|
| ↑ / ↓ / ← / → | Moves one cell |
| Home / End | Moves to the first or last cell in the row |
| Page Up / Page Down | Moves to the first or last cell in the column |
| ⌘/Ctrl+Home / ⌘/Ctrl+End | Moves to the first or last cell |
| Enter / Space | Selects the cell, or clears it if it's selected |
| Escape | Clears the selection, or hides the tooltip |
| Tab | Leaves the chart |

A cell moved to off the edge of the scrolling area scrolls into view.

## Screen readers

The chart is a `grid` named by the heading and described by “Arrow keys move between cells; Enter selects the cell”
and the summary, “Highest Wed · 14:00 100%. Lowest Mon · 08:00 0%.” Rows are labelled by row headers and columns by
column headers; each cell reads “Wed · 14:00: 96%”, or “No data”, and the selected cell is `aria-selected`. Selecting
is confirmed politely, “Selected Wed · 14:00: 96%”. The Table button is a toggle (`aria-pressed`), and the table view
is a plain data table captioned by the heading.

## Content

- Keep row and column labels short – “Mon”, “08:00”, “eu-west” – they sit beside small cells.
- Set `unit` or `format` so the tooltip, legend and summary read as values.
- Use null for a cell you have no data for: it's hatched and read as “No data”, not as zero.
- For a change, use `scale="diverging"` with `midpoint` at no change (usually 0), and `min` / `max` equal either side.

## Do

- Set `min` and `max` when several heatmaps on a page should share one scale.
- Keep the default five steps unless the exact shade matters – bins are easier to read than a gradient.
- Pair a selected cell with what's behind it: the bookings, the errors, the runs.

## Don't

- Don't use a diverging scale for values that only go one way – it suggests a meaning the data doesn't have.
- Don't use more than about 30 columns – past that, the cells are too small to point at.
- Don't rely on shade alone to compare two close cells – the tooltip and the table give the numbers.

## Example

```html
<tc-heatmap id="use" heading="Instrument use" unit="%" row-header="Day" crosshair></tc-heatmap>

<script type="module">
  import "trenchcoat/heatmap";
  import "trenchcoat/tokens.css";

  const map = document.querySelector("#use");
  map.rows = ["Mon", "Tue", "Wed"];
  map.columns = ["08:00", "10:00", "12:00", "14:00"];
  map.values = [
    [12, 48, 40, 66],
    [20, 71, null, 80],
    [35, 88, 92, 96],
  ];
  map.addEventListener("tc-selected-change", (e) => console.log(e.detail.selected, e.detail.value));
</script>
```

```tsx
import { useState } from "react";
import { Heatmap, type HeatmapCell } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function InstrumentUse({ values }: { values: (number | null)[][] }) {
  const [selected, setSelected] = useState<HeatmapCell | null>(null);
  return (
    <Heatmap
      title="Instrument use"
      unit="%"
      rows={["Mon", "Tue", "Wed"]}
      columns={["08:00", "10:00", "12:00", "14:00"]}
      values={values}
      crosshair
      selected={selected}
      onSelectedChange={setSelected}
    />
  );
}
```
