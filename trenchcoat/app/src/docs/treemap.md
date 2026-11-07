---
pattern: none
status: new
related: sunburst-chart, donut-chart, pie-chart, bar-chart
---

## Overview

Parts of a whole as tiles whose areas are their values, laid out squarified, largest first. Rows become a tree: a
flat table with `group`, path columns with `path`, or nested rows with a children field. Grouped tiles sit together
under a header with the group's name and share. The largest tile takes the accent and the rest stay quiet, so the
eye lands on what matters; `highlight` picks a different one, or several.

Tiles big enough carry their name and share on a small chip of the card's colour, so the words stay legible whatever
the tile's ink; smaller tiles leave them to the tooltip and the table. The tiles grow out of their centres one after
another when the chart scrolls into view and glide to their new sizes when the data changes. Ported from ztd-charts
(MIT).

## When to use

- Showing which few parts make up most of a total, across a dozen to a hundred items.
- A two-level breakdown – divisions and their labs – where the groups' sizes matter as much as the items'.

## When not to use

- A handful of shares where angles read fine – use [Donut Chart](#/donut-chart) or [Pie Chart](#/pie-chart).
- Comparing items precisely, or values that can be negative – use [Bar Chart](#/bar-chart).
- Three or more levels where the path matters – use [Sunburst Chart](#/sunburst-chart).

## Anatomy

1. **Header** `.tc-head` – the icon, heading and description, and the Table button
2. **Tile** `.ui-tmp__tile` – one per item, its area its value; the emphasised one in the accent
3. **Chip** `.ui-tmp__chip` – the item's name and share, on the card's colour, in tiles big enough to hold it
4. **Group header** `.tc-chart__tick` – a group's name and share above its tiles
5. **Tooltip** `.tc-chart__tip` – the group and item, the value and its share of the total

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both, for a chart inside another component. Inks come from the chart tokens through overridable
component tokens on the element: `--tc-plot-accent` for the emphasised tile and `--tc-plot-rest` for the others. The
chips are `--tc-plot-bg`, the card's own colour, so the names on them are text on the card – never text on a tile's
ink. `still` (or the system's reduced-motion setting) draws everything at once.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the plot – one tab stop |
| Arrow keys | Move to the next or previous tile; the tooltip shows it and it's read with its group, value and share |
| Home / End | The first or last tile |
| Enter / Space | Picks the tile (fires `tc-mark-click`) |
| Escape | Lets go of the tile; pressed again, it's the page's |

## Screen readers

- The plot is a group named by the heading, described in words: the number of items, the total and the largest three
  with their shares.
- A table of every item with its group, value and share is always there for screen readers; the Table button shows it
  to everyone.
- Moving with the arrows announces the tile with its group, value and share ("Genomics Life sciences: 1,840 h · 21%,
  1 of 8").
- The drawing itself is hidden; nothing is said by colour alone.

## Content

- Keep item names short – a chip shows what fits, cut with an ellipsis.
- Give `unit` (" h", " k$") rather than baking it into the values.
- Leave `sort` on unless the data's order means something; squarified tiles read best largest first.

## Do

- Let one tile carry the accent – the point of the chart.
- Use `group` for two levels; the group headers make the breakdown readable at a glance.

## Don't

- Use it for values that can be negative or zero – they have no area.
- Expect small tiles to be named; their names are in the tooltip and the table.

## Example

```html
<tc-treemap heading="GPU hours" description="This quarter, by division and lab" unit=" h"></tc-treemap>

<script type="module">
  import "@adamstavely/trenchcoat/treemap";
  import "@adamstavely/trenchcoat/tokens.css";
  const chart = document.querySelector("tc-treemap");
  chart.group = "group";
  chart.data = [
    { group: "Life sciences", label: "Genomics", value: 1840 },
    { group: "Life sciences", label: "Proteomics", value: 920 },
    { group: "Physical sciences", label: "Climate models", value: 1420 },
  ];
</script>
```

```tsx
import { Treemap } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const data = [
  { group: "Life sciences", label: "Genomics", value: 1840 },
  { group: "Life sciences", label: "Proteomics", value: 920 },
  { group: "Physical sciences", label: "Climate models", value: 1420 },
];

export function GpuHours() {
  return <Treemap title="GPU hours" description="This quarter, by division and lab" unit=" h" group="group" data={data} onMarkClick={(e) => console.log(e.label)} />;
}
```
