---
pattern: none
status: new
related: line-chart, bar-chart, breakdown-chart, usage-meter
---

## Overview

Totals and their make-up over time, as filled areas. Several series stack (`stack="stacked"`, the default for
several), stack to 100% (`"percent"`) or overlap (`"none"`), each in its own chart ink with its name at its end;
`color-mode="highlight"` paints one and leaves the rest quiet. Stacked layers are thinned by averaging, so they stay
aligned however long the series are.

The pointer reads the nearest x across every layer. Areas rise from the floor when the chart scrolls into view and
glide when the data changes. Ported from ztd-charts (MIT).

Overlapping areas (`stack="none"`) take a band round each edge with `lower` and `upper`, as Line Chart does; stacked
layers have none, since a range on one layer would move every layer above it.

With `brush="select"`, dragging across the plot (or Shift+arrows and Enter) picks a range and shows its change
with its highest and lowest points, firing `tc-brush`; `brush="zoom"` narrows the chart to the range, with a Show
all button to undo it.

## When to use

- How a total grows and what it's made of, over time.
- How the mix of a whole shifts over time (`stack="percent"`).

## When not to use

- Comparing separate trends that don't add up – use [Line Chart](#/line-chart).
- A single period's breakdown – use [Bar Chart](#/bar-chart) with `layout="stacked"`.

## Anatomy

1. **Header** `.tc-head` – the icon, heading, description and the Table button
2. **Area** `.tc-xy__area` – one per series, stacked or overlapping
3. **Edge** `.tc-xy__edge` – each area's top line
4. **Cursor** `.tc-xy__cursor` – the line at the pointed-at x
5. **Tooltip** `.tc-chart__tip` – the x and every layer's value (and share, at 100%)

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
| Arrow keys | Move to the next or previous point; the tooltip shows it and it's read with its value |
| Home / End | The first or last point |
| Enter / Space | Picks the point (fires `tc-mark-click`) |
| Shift + ← / → | With `brush`, widens a range from the point; Enter settles it (or zooms into it) |
| Escape | Clears a picked range, then a zoom, then lets go of the point; pressed again, it's the page's |

## Screen readers

- The plot is a group named by the heading, with the chart described in words (the series, the range of x and the number of points).
- A table of every value is always there for screen readers; the Table button shows it to everyone.
- Moving with the arrows announces the point with its value and position ("Imaging: 96, 2 of 6").
- The drawing itself is hidden; nothing is said by colour alone.

## Content

- Order the fields in `y` from the base up – the first is drawn at the bottom.
- Use `unit` for the measure (" TB").

## Do

- Use percent stacking when the shares matter more than the totals.
- Keep to a few layers; thin ones at the top are hard to read.

## Don't

- Stack series that don't add up to a meaningful total.
- Overlap more than two or three areas with `stack="none"`.

## Example

```html
<tc-area-chart heading="Storage by tier" unit=" TB"></tc-area-chart>

<script type="module">
  import "trenchcoat/area-chart";
  import "trenchcoat/tokens.css";
  const chart = document.querySelector("tc-area-chart");
  chart.x = "month";
  chart.y = ["hot", "warm", "archive"];
  chart.data = [
    { month: "2026-01", hot: 120, warm: 340, archive: 610 },
    { month: "2026-02", hot: 134, warm: 352, archive: 630 },
  ];
</script>
```

```tsx
import { AreaChart } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const rows = [
  { month: "2026-01", hot: 120, warm: 340, archive: 610 },
  { month: "2026-02", hot: 134, warm: 352, archive: 630 },
];

export function Storage() {
  return <AreaChart title="Storage by tier" unit=" TB" data={rows} x="month" y={["hot", "warm", "archive"]} />;
}
```
