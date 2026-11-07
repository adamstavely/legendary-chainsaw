---
pattern: none
status: new
related: treemap, donut-chart, pie-chart, bar-chart
---

## Overview

A hierarchy as rings: the top level innermost, each ring split among its parent's share. Rows become a tree as in
[Treemap](#/treemap) – a flat table with `group`, path columns with `path`, or nested rows with a children field. The
largest leaf takes the accent and the arcs leading to it from the centre a darker quiet ink, so its path through the
hierarchy reads at a glance; `highlight` picks a different leaf, or several.

The outer ring's names and shares sit outside the circle, nudged apart so none overlap. Inner arcs with room carry
their name on a small chip of the card's colour, so the words stay legible whatever the arc's ink. The rings sweep
round from twelve o'clock one after another when the chart scrolls into view and glide to their new shares when the
data changes. Ported from ztd-charts (MIT).

## When to use

- Showing how a total divides through two or three levels – divisions, labs, kinds of cost.
- When the path from the top level to a leaf matters as much as the leaf's size.

## When not to use

- One level of a few shares – use [Donut Chart](#/donut-chart) or [Pie Chart](#/pie-chart).
- Many leaves to compare by size – use [Treemap](#/treemap); areas are easier to compare than outer arcs.
- Precise comparisons – use [Bar Chart](#/bar-chart).

## Anatomy

1. **Header** `.tc-head` – the icon, heading and description, and the Table button
2. **Arc** `.ui-sbr__arc` – one per node, its angle its share of its parent; the emphasised leaf in the accent
3. **Outer label** `.tc-chart__value` – an outer leaf's name and share, outside the circle
4. **Chip** `.ui-sbr__chip` – an inner arc's name, on the card's colour, where the arc has room
5. **Tooltip** `.tc-chart__tip` – the parent and item, the value and its share of the total

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both, for a chart inside another component. Inks come from the chart tokens through overridable
component tokens on the element: `--tc-plot-accent` for the emphasised leaf, `--tc-plot-rest` for the other leaves,
`--tc-sbr-path` for the arcs leading to the emphasised leaf and `--tc-sbr-branch` for the other inner arcs. The chips
are `--tc-plot-bg`, the card's own colour, so names are never text on an arc's ink. `hole` sets the centre's size.
`still` (or the system's reduced-motion setting) draws everything at once.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the plot – one tab stop |
| Arrow keys | Move to the next or previous arc – each parent, then its children; the tooltip shows it and it's read with its parent, value and share |
| Home / End | The first or last arc |
| Enter / Space | Picks the arc (fires `tc-mark-click`) |
| Escape | Lets go of the arc; pressed again, it's the page's |

## Screen readers

- The plot is a group named by the heading, described in words: the number of levels, the total and the innermost
  ring's shares.
- A table of every arc with its parent, value and share is always there for screen readers; the Table button shows it
  to everyone.
- Moving with the arrows announces the arc with its parent, value and share ("Genomics Life sciences: 730 · 33%,
  2 of 15").
- The drawing itself is hidden; nothing is said by colour alone.

## Content

- Keep to two or three levels; outer arcs get thin fast.
- Keep names short – outer labels need room beside the circle, and chips show what fits.
- Give `unit` rather than baking it into the values.

## Do

- Let one leaf and its path carry the emphasis – the point of the chart.
- Use `sort` when the data's order means nothing, so the large arcs come first.

## Don't

- Use it for a flat list – a donut or bars read better.
- Expect thin arcs to be named; their names are in the tooltip and the table.

## Example

```html
<tc-sunburst-chart heading="Grant spend" description="This year, k$ – division, lab, cost"></tc-sunburst-chart>

<script type="module">
  import "@adamstavely/trenchcoat/sunburst-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  const chart = document.querySelector("tc-sunburst-chart");
  chart.path = ["division", "lab"];
  chart.data = [
    { division: "Life sciences", lab: "Genomics", label: "Reagents", value: 420 },
    { division: "Life sciences", lab: "Proteomics", label: "Instruments", value: 280 },
    { division: "Physical sciences", lab: "Climate", label: "Compute", value: 360 },
  ];
</script>
```

```tsx
import { SunburstChart } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const data = [
  { division: "Life sciences", lab: "Genomics", label: "Reagents", value: 420 },
  { division: "Life sciences", lab: "Proteomics", label: "Instruments", value: 280 },
  { division: "Physical sciences", lab: "Climate", label: "Compute", value: 360 },
];

export function GrantSpend() {
  return <SunburstChart title="Grant spend" description="This year, k$ – division, lab, cost" path={["division", "lab"]} data={data} onMarkClick={(e) => console.log(e.label)} />;
}
```
