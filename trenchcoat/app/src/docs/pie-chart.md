---
pattern: none
status: new
related: donut-chart, bar-chart, coverage-ring, citation-sections
---

## Overview

A few shares of a whole as slices. Each slice takes the next chart ink; `color-mode="emphasis"` paints only the
largest (or `highlight`) and leaves the rest quiet. Shares are written beside the slices, outside the circle, nudged so
none overlap – `label-mode` writes values or names instead, or nothing.

The slices sweep round from twelve o'clock (`start-angle` turns them) when the chart scrolls into view; the pointed-at
slice lifts out. Ported from ztd-charts (MIT).

## When to use

- Two to five shares of one whole.
- Showing that one part dominates.

## When not to use

- Many categories, or comparing close values – use [Bar Chart](#/bar-chart).
- A total in the middle with a legend – use [Donut Chart](#/donut-chart).
- One share at a glance – use [Coverage Ring](#/coverage-ring).

## Anatomy

1. **Header** `.tc-head` – the icon, heading, description and the Table button
2. **Slice** `.tc-pie__slice` – one per item, parted by the card's colour
3. **Label** `.tc-chart__value` – each slice's share beside it
4. **Tooltip** `.tc-chart__tip` – the item's value and share

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

- Keep to five slices or fewer; group the rest as "Other".
- Give values in their own unit; shares are worked out for you.

## Do

- Sort with `sort` when the items have no natural order.
- Use emphasis to make one share the point.

## Don't

- Use it to compare similar shares – angles are hard to judge.
- Show negative values; they're drawn as zero.

## Example

```html
<tc-pie-chart heading="Funding by source"></tc-pie-chart>

<script type="module">
  import "@adamstavely/trenchcoat/pie-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  document.querySelector("tc-pie-chart").data = [
    { label: "Federal grants", value: 48 },
    { label: "Foundations", value: 21 },
    { label: "Industry", value: 14 },
  ];
</script>
```

```tsx
import { PieChart } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const data = [
  { label: "Federal grants", value: 48 },
  { label: "Foundations", value: 21 },
  { label: "Industry", value: 14 },
];

export function Funding() {
  return <PieChart title="Funding by source" data={data} />;
}
```
