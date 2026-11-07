---
pattern: none
status: new
related: bubble-chart, heatmap, histogram, calendar-heatmap
---

## Overview

Many points by x and y, gathered into hexagons and shaded by how many fell in each – where the points crowd, for
scatters too dense to read point by point. `aggregate="sum"` or `"mean"` shades by the sum or mean of a `value`
instead, so the shape shows where the points are and the shade what they're like there. Empty hexagons aren't drawn;
the densest is ringed; a ramp in the header names the shades' ends.

The hexagons are `radius` px from centre to corner (12 by default), smaller on narrow widths, and larger if there
would be more than 3,000 of them. Binning is one pass over the points, so 50,000 are fine. Hexagons grow in from left
to right when the chart scrolls into view and change shade smoothly when the data changes.

## When to use

- Thousands of points where a scatter plot would be a solid blot: readings, events, measurements.
- Where points crowd, and what they're like there – with `aggregate`.

## When not to use

- A few hundred points or fewer, where each one matters – use [Bubble Chart](#/bubble-chart) as a scatter plot.
- Two categories rather than two numbers – use [Heatmap](#/heatmap).
- One measure's spread – use [Histogram](#/histogram).

## Anatomy

1. **Header** `.tc-head` – the icon, heading and description, the shade legend and the Table button
2. **Hexagon** `.ui-hxb__hex` – one per hexagon with points, shaded from the track to the ink
3. **Densest** `.ui-hxb__peak` – the ring round the hexagon with the most points
4. **Legend** `.ui-hxb__legend` – what the shade shows, its lowest and highest value, and the ramp between
5. **Axis** `.tc-chart__grid` – the y grid lines and their values, the x values below, and the axes' names
6. **Tooltip** `.tc-chart__tip` – the hexagon's x and y range, its count and aggregate

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both. Shades mix `--tc-hxb-ink` (the accent) into `--tc-hxb-track` (the grid ink), from 18% for the
lowest value to full ink for the highest; hexagons are parted by a hairline of `--tc-plot-bg` and the densest is ringed
in `--tc-hxb-peak`. No text sits on a hexagon. `still` (or the system's reduced-motion setting) draws everything at
once.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the plot – one tab stop |
| Arrow keys | Move to the next or previous hexagon in reading order – by row from the top, then left to right |
| Home / End | The first or last hexagon |
| Enter / Space | Picks the hexagon (fires `tc-mark-click`) |
| Escape | Lets go of the hexagon; pressed again, it's the page's |

## Screen readers

- The plot is a group named by the heading, described in words: how many points and hexagons, and where the densest
  is.
- A table of the hexagons (the first 60, and how many more) is always there for screen readers, in the same reading
  order as the keyboard; the Table button shows it to everyone.
- Moving with the arrows announces the hexagon ("x 20.5–21.4, y 0.1–0.2: 184, 12 of 210").
- The drawing itself is hidden; nothing is said by colour alone.

## Content

- Name the axes with `x-label` and `y-label`, and say in the description what the shade shows.
- Use `x-format`, `format` and `value-format` for the x axis, the y axis and the aggregate.
- Rename the legend's and summary's words through `hexbinLabels`.

## Do

- Pick a radius that shows the pattern: smaller for detail, larger for a calmer picture.
- Switch to `aggregate="mean"` to ask what the points are like where they crowd.

## Don't

- Use it for a handful of points – a scatter plot shows them better.
- Read the shade as exact; point at a hexagon, or open the table, for the number.

## Example

```html
<tc-hexbin-chart heading="Calibration readings" x-label="Room temperature (°C)" y-label="Drift"></tc-hexbin-chart>

<script type="module">
  import "trenchcoat/hexbin-chart";
  import "trenchcoat/tokens.css";
  const chart = document.querySelector("tc-hexbin-chart");
  chart.x = "temperature";
  chart.y = "drift";
  chart.data = [
    { temperature: 21.2, drift: 0.12 },
    { temperature: 20.8, drift: 0.05 },
    { temperature: 25.9, drift: 0.61 },
  ];
</script>
```

```tsx
import { HexbinChart } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Readings({ readings }: { readings: { temperature: number; drift: number; size: number }[] }) {
  return <HexbinChart title="Calibration readings" data={readings} x="temperature" y="drift" value="size" aggregate="mean" xLabel="Room temperature (°C)" yLabel="Drift" onMarkClick={(e) => console.log(e.label)} />;
}
```
