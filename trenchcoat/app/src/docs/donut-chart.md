---
pattern: none
status: new
related: pie-chart, coverage-ring, citation-sections, bar-chart
---

## Overview

Shares of a whole round a hole that holds the total, with a legend of every slice and its share. Each slice
takes the next chart ink; `color-mode="emphasis"` paints one and leaves the rest quiet. The legend sits beside the
donut when there's room and under it when narrow (`legend` fixes it); the middle shows the total, the highlighted
slice's value or a number of the page's (`center-value`), with `center-label` under it.

The slices sweep round and the total counts up when the chart scrolls into view; the pointed-at slice lifts out.
Ported from ztd-charts (MIT).

## When to use

- A breakdown where the total matters as much as the parts.
- A compact share chart with its legend, for a dashboard tile.

## When not to use

- Many categories, or comparing close values – use [Bar Chart](#/bar-chart).
- One share against the rest – use [Coverage Ring](#/coverage-ring).

## Anatomy

1. **Header** `.tc-head` – the icon, heading, description and the Table button
2. **Slice** `.tc-pie__slice` – one per item, round the hole
3. **Total** `.tc-pie__total` – the number in the middle, with its label under it
4. **Legend** `.tc-pie__swatch` – each item's ink, name and share
5. **Tooltip** `.tc-chart__tip` – the item's value and share

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
| Arrow keys | Move to the next or previous slice; the tooltip shows it and it's read with its value |
| Home / End | The first or last slice |
| Enter / Space | Picks the slice (fires `tc-mark-click`) |
| Escape | Lets go of the slice; pressed again, it's the page's |

## Screen readers

- The plot is a group named by the heading, with the chart described in words (the number of items, the total and the largest shares).
- A table of every value is always there for screen readers; the Table button shows it to everyone.
- Moving with the arrows announces the slice with its value and position ("Imaging: 96, 2 of 6").
- The drawing itself is hidden; nothing is said by colour alone.

## Content

- Write `center-label` as what's counted ("Findings"), not a sentence.
- Keep item names short; the legend truncates long ones.

## Do

- Use the middle for the one number people look for.
- Group small items as "Other".

## Don't

- Put a second chart's worth of detail in the legend.
- Use it when the total means nothing.

## Example

```html
<tc-donut-chart heading="Open findings" center-label="Findings"></tc-donut-chart>

<script type="module">
  import "trenchcoat/donut-chart";
  import "trenchcoat/tokens.css";
  document.querySelector("tc-donut-chart").data = [
    { label: "Critical", value: 3 },
    { label: "High", value: 9 },
    { label: "Medium", value: 17 },
  ];
</script>
```

```tsx
import { DonutChart } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const data = [
  { label: "Critical", value: 3 },
  { label: "High", value: 9 },
  { label: "Medium", value: 17 },
];

export function Findings() {
  return <DonutChart title="Open findings" centerLabel="Findings" data={data} />;
}
```
