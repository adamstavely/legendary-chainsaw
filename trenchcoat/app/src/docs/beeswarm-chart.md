---
pattern: none
status: new
related: bubble-chart, bar-chart, line-chart, heatmap
---

## Overview

A distribution drawn point by point. Every value is a dot along one axis, pushed up or down just enough that none
overlap, so clusters, gaps and outliers show where a histogram or a box would hide them. With `group` each group gets
its own row with its median marked by a dashed line; the group with the highest median takes the accent and the rest
stay quiet, and `highlight` picks others. Without groups the dots share one row and the highest one takes the accent.

The dots grow in from their row's middle, left to right, when the chart scrolls into view and glide when the data
changes. Past `canvas-threshold` points (2,000 by default) they're painted on a canvas under the drawing, which keeps
the axis, the medians and the active dot. Ported from ztd-charts (MIT).

## When to use

- Showing how values spread – turnaround times, measurements, scores – with every value still visible.
- Comparing a few groups' distributions and medians side by side.

## When not to use

- A value per category – use [Bar Chart](#/bar-chart).
- Two values per point, or three with a size – use [Bubble Chart](#/bubble-chart).
- Change over time – use [Line Chart](#/line-chart).

## Anatomy

1. **Header** `.tc-head` – the icon, heading and description, and the Table button
2. **Dot** `.ui-bsw__dot` – one per value; the emphasised group's in the accent
3. **Median** `.ui-bsw__median` – each group's median, a dashed line with its value above
4. **Axis** `.tc-chart__grid` – the value grid lines and their values; the group names at the left
5. **Canvas** `.tc-chart__canvas` – the dots, painted, past the threshold
6. **Tooltip** `.tc-chart__tip` – the dot's name, group and value

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both, for a chart inside another component. Inks come from the chart tokens through overridable
component tokens on the element: `--tc-plot-accent` and `--tc-plot-rest` for emphasis, `--tc-plot-grid` for grid lines,
`--tc-bsw-median` for the median lines. The canvas reads the same tokens, so it follows the look and the theme. Values
are written in the text inks beside the dots, never on them. `still` (or the system's reduced-motion setting) draws
everything at once.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the plot – one tab stop |
| Arrow keys | Move to the next or previous dot, in data order; the tooltip shows it and it's read with its value |
| Home / End | The first or last dot |
| Enter / Space | Picks the dot (fires `tc-mark-click`) |
| Escape | Lets go of the dot; pressed again, it's the page's |

## Screen readers

- The plot is a group named by the heading, described in words: how many points and groups, and each group's median.
- A table of the values is always there for screen readers (the first 60, and how many more); the Table button shows
  it to everyone.
- Moving with the arrows announces the dot with its group, value and position ("S1 Genomics: 4.2 h, 1 of 144").
- The drawing itself is hidden; nothing is said by colour alone.

## Content

- Keep group names short – they share the left edge with the plot.
- Give each point a `label` so the tooltip and table name it; without one it's numbered.
- Give `unit` (" h", " ms") rather than baking it into the values.

## Do

- Use a handful of groups – about five rows read well.
- Let the median carry the comparison; the dots show the spread behind it.

## Don't

- Use it for a few values – a bar or a list says it more plainly.
- Lower `canvas-threshold` to force a canvas on small data; SVG dots are crisper and animate one by one.

## Example

```html
<tc-beeswarm-chart heading="Assay turnaround" description="This month, by lab" unit=" h"></tc-beeswarm-chart>

<script type="module">
  import "trenchcoat/beeswarm-chart";
  import "trenchcoat/tokens.css";
  const chart = document.querySelector("tc-beeswarm-chart");
  chart.value = "hours";
  chart.group = "lab";
  chart.data = [
    { lab: "Genomics", hours: 4.2 },
    { lab: "Genomics", hours: 5.1 },
    { lab: "Imaging", hours: 8.1 },
    { lab: "Imaging", hours: 7.4 },
  ];
</script>
```

```tsx
import { BeeswarmChart } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const data = [
  { lab: "Genomics", hours: 4.2 },
  { lab: "Genomics", hours: 5.1 },
  { lab: "Imaging", hours: 8.1 },
  { lab: "Imaging", hours: 7.4 },
];

export function Turnaround() {
  return <BeeswarmChart title="Assay turnaround" description="This month, by lab" data={data} value="hours" group="lab" unit=" h" onMarkClick={(e) => console.log(e.label)} />;
}
```
