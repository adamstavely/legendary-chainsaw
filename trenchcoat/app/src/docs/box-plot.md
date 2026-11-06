---
pattern: none
status: new
related: ridgeline-chart, bar-chart, candlestick-chart, heatmap
---

## Overview

How values spread within each group. Each group's middle half is a box from the first to the third quartile, with
its median across it; whiskers reach the furthest values within 1.5 times the box's height, and anything beyond is a
small ring. The group with the highest median takes the accent and the rest stay quiet; `highlight` picks a different
one, or several, by group name. `variant="violin"` draws each group's density as a curve mirrored round its middle,
and `"both"` puts a slim box inside each violin.

The boxes open out from their medians when the chart scrolls into view and glide when the data changes. Ported from
ztd-charts (MIT).

## When to use

- Comparing the spread, not just the average, of a measure across a handful of groups: turnaround by lab, run time by
  instrument.
- Spotting groups with long tails or unusual values.

## When not to use

- Many groups, or when the shape matters more than the quartiles – use [Ridgeline Chart](#/ridgeline-chart).
- One number per category – use [Bar Chart](#/bar-chart).
- A value per period that opens and closes – use [Candlestick Chart](#/candlestick-chart).

## Anatomy

1. **Header** `.tc-head` – the icon, heading and description, and the Table button
2. **Box** `.ui-bxp__box` – the first to third quartile; the emphasised group's in the accent
3. **Median** `.ui-bxp__median` – the line across the box
4. **Whisker** `.ui-bxp__whisker` – out to the furthest values within 1.5 IQR
5. **Outlier** `.ui-bxp__outlier` – a ring for each value beyond the whiskers
6. **Violin** `.ui-bxp__violin` – the density curve, with `variant="violin"` or `"both"`
7. **Axis** `.tc-chart__grid` – the grid lines and their values; the group names under the boxes
8. **Tooltip** `.tc-chart__tip` – the whiskers, quartiles, median and sample size

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both, for a chart inside another component. Boxes take `--tc-plot-accent` and `--tc-plot-rest`;
whiskers and outliers `--tc-plot-line-rest`. The median's ink is a component token, `--tc-bxp-median`
(`--tc-bxp-median-on-accent` across the accent box). No text sits on a box; values are in the tooltip and the table.
`still` (or the system's reduced-motion setting) draws everything at once.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the plot – one tab stop |
| Arrow keys | Move to the next or previous group; the tooltip shows it and it's read with its median and quartiles |
| Home / End | The first or last group |
| Enter / Space | Picks the group (fires `tc-mark-click`) |
| Escape | Lets go of the group; pressed again, it's the page's |

## Screen readers

- The plot is a group named by the heading, described in words (each group and its median).
- A table of every group's median and quartiles is always there for screen readers; the Table button shows it to
  everyone.
- Moving with the arrows announces the group ("Imaging: median 8, IQR 7.5 to 9.5, 2 of 3").
- The drawing itself is hidden; nothing is said by colour alone.

## Content

- Give each group at least five or so values; fewer and the quartiles mean little.
- Give `unit` (" d", " ms") rather than baking it into the values.
- Rename the tooltip's words through `boxLabels`, and the shared ones through `labels`.

## Do

- Let one group carry the accent – the one the reader should compare against.
- Use `variant="both"` when groups have two humps a box would hide.

## Don't

- Use it for a handful of values per group – show the values themselves.
- Start the axis at zero when it hides the spread; `zero` is off by default for that reason.

## Example

```html
<tc-box-plot heading="Assay turnaround" description="This quarter, days by lab" unit=" d"></tc-box-plot>

<script type="module">
  import "trenchcoat/box-plot";
  import "trenchcoat/tokens.css";
  document.querySelector("tc-box-plot").data = [
    { group: "Genomics", value: 4.1 },
    { group: "Genomics", value: 3.6 },
    { group: "Imaging", value: 6.9 },
    { group: "Imaging", value: 7.4 },
  ];
</script>
```

```tsx
import { BoxPlot } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const data = [
  { group: "Genomics", value: 4.1 },
  { group: "Genomics", value: 3.6 },
  { group: "Imaging", value: 6.9 },
  { group: "Imaging", value: 7.4 },
];

export function Turnaround() {
  return <BoxPlot title="Assay turnaround" description="This quarter, days by lab" unit=" d" data={data} onMarkClick={(e) => console.log(e.label)} />;
}
```
