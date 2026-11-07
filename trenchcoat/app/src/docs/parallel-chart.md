---
pattern: none
status: new
related: line-chart, bar-chart, calendar-heatmap, heatmap, data-table
---

## Overview

Parallel coordinates: several numeric measures stood up side by side as vertical axes, and each row drawn as a line
crossing every axis at its value – to compare rows across all the measures at once and see which move together. Each
axis is scaled to its own range, written at its ends, and `invert` turns an axis where less is better upside down, so
"good" is up everywhere. One row takes the accent and is named at the right – the first by default; `highlight` picks
others – while the rest stay quiet. A row missing a value has its line broken at that axis rather than drawn to a
false minimum.

The pointer picks the nearest line. Lines draw across from left to right when the chart scrolls into view and glide
to new values when the data changes. Above `canvas-threshold` rows (1,500 by default) the lines are painted on a canvas
under the drawing, fainter the more there are, so the density shows. Ported from ztd-charts (MIT).

## When to use

- Comparing a handful to thousands of items across three to about eight measures: instruments, grants, samples.
- Finding the items that do well on every measure, and trade-offs between measures (where lines cross).
- Following one item's profile against the field.

## When not to use

- One measure across categories – use [Bar Chart](#/bar-chart).
- Change over time – use [Line Chart](#/line-chart).
- Two categories against each other, a value per pair – use [Heatmap](#/heatmap).
- Exact values people will sort and filter – use [Data Table](#/data-table).

## Anatomy

1. **Header** `.tc-head` – the icon, heading and description and the Table button
2. **Axis** `.ui-pcc__axis` – one per measure, with its name above and its range at the ends (`.tc-chart__tick`)
3. **Line** `.ui-pcc__line` – one per row; the emphasised one in the accent, the active one in the strong ink
4. **Name** `.tc-chart__value` – the emphasised or active row's name, right of the last axis
5. **Tooltip** `.tc-chart__tip` – the row's name and every measure's value
6. **Canvas** `.tc-chart__canvas` – where the lines are painted above `canvas-threshold`

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both, for a chart inside another component. The emphasised line is `--tc-pcc-hi` (by default
`--tc-plot-accent`), the rest `--tc-pcc-rest` (by default `--tc-plot-line-rest`) and the active one `--tc-pcc-active`
(by default `--tc-plot-focus`); axes take `--tc-plot-zero`. Set any of them on the element; the canvas reads the same
tokens. `still` (or the system's reduced-motion setting) draws everything at once.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the plot – one tab stop |
| Arrow keys | The next or previous row; the tooltip shows it and it's read with every measure |
| Home / End | The first or last row |
| Enter / Space | Picks the row (fires `tc-mark-click`) |
| Escape | Lets go of the row; pressed again, it's the page's |

## Screen readers

- The plot is a group named by the heading, described in words (how many rows and the axes' names).
- A table of every row with all its measures is always there for screen readers; the Table button shows it to
  everyone.
- Moving with the arrows announces the row with every measure and its position ("Cryo-EM: uptime 97, cost 41,
  queue 6, 1 of 5").
- The drawing itself is hidden; nothing is said by colour alone.

## Content

- Name the rows with a `label` field (or the `label` accessor); unnamed rows are read as "#1", "#2".
- Give axes readable names with `dimensionLabels` and units with `formats` – one per field.
- Pick `dimensions` to set the order: neighbours are what the eye compares.

## Do

- Use `invert` so the better end of every axis is at the top.
- Emphasise one or two rows; the shape of the rest is the context.

## Don't

- Stand up more than about eight axes – the spaces between them get too narrow to read.
- Use it for measures that aren't numbers; categories belong in another chart.

## Example

```html
<tc-parallel-chart heading="Shared instruments" description="This quarter"></tc-parallel-chart>

<script type="module">
  import "@adamstavely/trenchcoat/parallel-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  const chart = document.querySelector("tc-parallel-chart");
  chart.invert = ["queue"];
  chart.data = [
    { label: "Cryo-EM", uptime: 97, cost: 410, queue: 6 },
    { label: "Mass spec", uptime: 88, cost: 180, queue: 14 },
    { label: "Confocal", uptime: 79, cost: 120, queue: 3 },
  ];
</script>
```

```tsx
import { ParallelChart } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const data = [
  { label: "Cryo-EM", uptime: 97, cost: 410, queue: 6 },
  { label: "Mass spec", uptime: 88, cost: 180, queue: 14 },
  { label: "Confocal", uptime: 79, cost: 120, queue: 3 },
];

export function Instruments() {
  return <ParallelChart title="Shared instruments" description="This quarter" data={data} invert={["queue"]} dimensionLabels={{ cost: "Cost / hour" }} onMarkClick={(e) => console.log(e.label)} />;
}
```
