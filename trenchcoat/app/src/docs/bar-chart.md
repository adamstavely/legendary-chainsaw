---
pattern: none
status: new
related: line-chart, area-chart, breakdown-chart, kpi-chart
---

## Overview

Values by category as bars. One series draws one bar per category, the highest taking the accent and the rest
kept quiet, so the eye lands on what matters; `highlight` picks a different one, or several. Several series sit side
by side (`layout="grouped"`), on top of each other (`"stacked"`) or stacked to 100% (`"percent"`), each in its own
chart ink and named in the legend. `orientation="horizontal"` lays the bars down for long category names. `yDomain` fixes
the value axis's range, so several charts side by side share one scale (Small Multiples sets it for you).

Values sit at the bars' ends, thinned when they'd overlap. The bars grow from the baseline when the chart scrolls into
view and glide to new values when the data changes. Ported from ztd-charts (MIT).

## When to use

- Comparing a value across a handful to a few dozen categories.
- Showing what a total is made of (`stacked`) or how the mix differs (`percent`).

## When not to use

- Change over time with many points – use [Line Chart](#/line-chart).
- A stacked bar people slice by measure and segment – use [Breakdown Chart](#/breakdown-chart).
- One headline metric with its trend – use [KPI Chart](#/kpi-chart).

## Anatomy

1. **Header** `.tc-head` – the icon, heading and description, the legend and the Table button
2. **Bar** `.ui-brc__bar` – one per category and series; the emphasised one in the accent
3. **Value** `.tc-chart__value` – the value at the bar's end
4. **Axis** `.tc-chart__grid` – the grid lines and their values; the category names under the bars
5. **Tooltip** `.tc-chart__tip` – the category and every series' value there

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both, for a chart inside another component. Inks come from the chart tokens through overridable
component tokens on the element: `--tc-plot-accent` and `--tc-plot-rest` for emphasis, `--tc-plot-ink-1` … `-6` for
categories, `--tc-plot-grid` for grid lines. Values are written in the text inks, beside marks rather than on them, so
they stay legible whatever the inks are. `still` (or the system's reduced-motion setting) draws everything at once.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the plot – one tab stop |
| Arrow keys | Move to the next or previous bar; the tooltip shows it and it's read with its value |
| Home / End | The first or last bar |
| Enter / Space | Picks the bar (fires `tc-mark-click`) |
| Escape | Lets go of the bar; pressed again, it's the page's |

## Screen readers

- The plot is a group named by the heading, with the chart described in words (each category and its value).
- A table of every value is always there for screen readers; the Table button shows it to everyone.
- Moving with the arrows announces the bar with its value and position ("Imaging: 96, 2 of 6").
- The drawing itself is hidden; nothing is said by colour alone.

## Content

- Keep category names short; long ones read better with `orientation="horizontal"`.
- Give `unit` (" ms", "%") rather than baking it into the values.
- Sort with `sort` when the order of categories carries no meaning.

## Do

- Let one bar carry the accent – the point of the chart.
- Use `layout="percent"` when the mix matters more than the totals.

## Don't

- Stack more than about six series; the inks repeat after six.
- Start a bar chart's axis anywhere but zero – it's set for you.

## Example

```html
<tc-bar-chart heading="Samples processed" description="This week, by lab"></tc-bar-chart>

<script type="module">
  import "@adamstavely/trenchcoat/bar-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  document.querySelector("tc-bar-chart").data = [
    { x: "Genomics", y: 182 },
    { x: "Imaging", y: 96 },
    { x: "Proteomics", y: 124 },
  ];
</script>
```

```tsx
import { BarChart } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const data = [
  { x: "Genomics", y: 182 },
  { x: "Imaging", y: 96 },
  { x: "Proteomics", y: 124 },
];

export function Samples() {
  return <BarChart title="Samples processed" description="This week, by lab" data={data} onMarkClick={(e) => console.log(e.label)} />;
}
```
