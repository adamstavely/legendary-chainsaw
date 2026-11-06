---
pattern: none
status: new
related: area-chart, bar-chart, kpi-chart, sparkline
---

## Overview

Values over time – or along any x – as lines. The emphasised series takes the accent and the rest stay quiet
(`highlight` picks which); `color-mode="categorical"` gives each its own ink instead. With several series their names
sit at the lines' ends, nudged apart so they never overlap. Dates, numbers and categories on x are recognised; long
series are thinned to about two points per pixel without losing their peaks.

The pointer reads the nearest x across every series; dashed `referenceLines` mark a target or a limit. Lines draw
themselves in when the chart scrolls into view and glide when the data changes. Ported from ztd-charts (MIT).

## When to use

- A trend over time, with one series to watch against others.
- Comparing a measure against a target or a limit.

## When not to use

- Few categories with no order – use [Bar Chart](#/bar-chart).
- How a total splits over time – use [Area Chart](#/area-chart).
- A trend inside a sentence or a table cell – use [Sparkline](#/sparkline).

## Anatomy

1. **Header** `.tc-head` – the icon, heading, description and the Table button
2. **Line** `.tc-xy__line` – one per series; the emphasised one thicker, in the accent
3. **Dot** `.tc-xy__dot` – the points, when there are few
4. **Reference line** `.tc-xy__ref` – a dashed target or limit with its label
5. **Cursor** `.tc-xy__cursor` – the line at the pointed-at x, with a point on every series
6. **Tooltip** `.tc-chart__tip` – the x and every series' value there

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
| Escape | Lets go of the point; pressed again, it's the page's |

## Screen readers

- The plot is a group named by the heading, with the chart described in words (the series, the range of x and the number of points).
- A table of every value is always there for screen readers; the Table button shows it to everyone.
- Moving with the arrows announces the point with its value and position ("Imaging: 96, 2 of 6").
- The drawing itself is hidden; nothing is said by colour alone.

## Content

- Pass dates as ISO strings ("2026-03") or epoch ms; they're placed in time, not evenly.
- Name series in a word or two; they're written at the lines' ends.
- Label reference lines with what they mean ("Target 45 min"), not just the number.

## Do

- Emphasise the one series the reader should follow.
- Use `y-label` for the unit when it's long ("Requests / min").

## Don't

- Draw more than five or six lines in categorical mode.
- Use it for categories with no order between them.

## Example

```html
<tc-line-chart heading="Median queue time" unit=" min"></tc-line-chart>

<script type="module">
  import "trenchcoat/line-chart";
  import "trenchcoat/tokens.css";
  document.querySelector("tc-line-chart").data = [
    { x: "2026-01", y: 42 },
    { x: "2026-02", y: 48 },
    { x: "2026-03", y: 61 },
  ];
</script>
```

```tsx
import { LineChart } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const data = [
  { x: "2026-01", y: 42 },
  { x: "2026-02", y: 48 },
  { x: "2026-03", y: 61 },
];

export function QueueTime() {
  return <LineChart title="Median queue time" unit=" min" data={data} referenceLines={[{ y: 45, label: "Target 45 min" }]} />;
}
```
