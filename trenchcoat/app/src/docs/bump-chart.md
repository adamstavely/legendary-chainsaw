---
pattern: none
status: new
related: slope-chart, line-chart, dumbbell-chart, bar-chart
---

## Overview

How a set of items' ranks change from one step to the next – a year, a quarter, a round – as one line per item,
first place at the top. Give each row a `rank` (1 is first), or a `value` and the chart ranks the items itself, the
largest first. The item that climbed furthest takes the accent and the rest stay quiet, so the story of the chart is
the line the eye lands on; `highlight` picks a different one, or several.

Each item's name sits at the left by its first rank and at the right with its last ("#1 Imaging"). The lines draw in
from the left when the chart scrolls into view and glide to their new places when the data changes. Ported from
ztd-charts (MIT).

## When to use

- Showing who overtook whom across a handful of steps – league tables, rankings, standings.
- When the order matters more than the gaps between the values.

## When not to use

- Only two steps, before and after – use [Slope Chart](#/slope-chart).
- When the values themselves matter, not just their order – use [Line Chart](#/line-chart).
- One step's ranking – use [Bar Chart](#/bar-chart) with `sort`.

## Anatomy

1. **Header** `.tc-head` – the icon, heading and description, and the Table button
2. **Line** `.ui-bmp__line` – one item's rank at each step; the emphasised one thicker, in the accent
3. **Dot** `.ui-bmp__dot` – the item at one step
4. **Column** `.ui-bmp__cursor` – the band behind the step under the pointer or keyboard
5. **Names** `.tc-chart__tick` – each item's name by its first and last rank, and the steps under the plot
6. **Tooltip** `.tc-chart__tip` – the step and the ranking there

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both, for a chart inside another component. Inks come from the chart tokens through overridable
component tokens on the element: `--tc-plot-accent` for the emphasised line, `--tc-plot-line-rest` for the others and
`--tc-plot-grid` for the column band. Names are written in the text inks beside the lines. `still` (or the system's
reduced-motion setting) draws everything at once.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the plot – one tab stop |
| Arrow keys | Move to the next or previous step; the tooltip shows its ranking and it's read out |
| Home / End | The first or last step |
| Enter / Space | Picks the step (fires `tc-mark-click`) |
| Escape | Lets go of the step; pressed again, it's the page's |

## Screen readers

- The plot is a group named by the heading, described in words (how many items, from which step to which).
- A table of every step's ranking is always there for screen readers; the Table button shows it to everyone.
- Moving with the arrows announces the step with its ranking ("2025: #1 Proteomics, #2 Imaging …, 5 of 6").
- The drawing itself is hidden; nothing is said by colour alone.

## Content

- Keep it to about eight items; more lines tangle.
- Keep item names short – they're written beside the plot on both sides.
- Give ranks without gaps (1, 2, 3 …); a tie can share a rank.

## Do

- Let the line with the story carry the accent – by default the biggest climber.
- Order the steps in time, oldest at the left.

## Don't

- Use it for values whose size matters; the gaps between ranks are all drawn the same.
- Emphasise several lines at once unless they're being compared.

## Example

```html
<tc-bump-chart heading="Grant ranking" description="By funding won"></tc-bump-chart>

<script type="module">
  import "trenchcoat/bump-chart";
  import "trenchcoat/tokens.css";
  document.querySelector("tc-bump-chart").data = [
    { x: "2025", series: "Genomics", rank: 1 },
    { x: "2025", series: "Imaging", rank: 2 },
    { x: "2026", series: "Genomics", rank: 2 },
    { x: "2026", series: "Imaging", rank: 1 },
  ];
</script>
```

```tsx
import { BumpChart } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const data = [
  { x: "2025", series: "Genomics", rank: 1 },
  { x: "2025", series: "Imaging", rank: 2 },
  { x: "2026", series: "Genomics", rank: 2 },
  { x: "2026", series: "Imaging", rank: 1 },
];

export function GrantRanking() {
  return <BumpChart title="Grant ranking" description="By funding won" data={data} onMarkClick={(e) => console.log(e.label)} />;
}
```
