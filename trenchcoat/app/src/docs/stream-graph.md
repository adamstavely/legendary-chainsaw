---
pattern: none
status: new
related: area-chart, line-chart, radial-bar-chart, bar-chart
---

## Overview

Several series flowing over time, stacked round a moving centre line instead of a floor, so the eye follows how each
one swells and fades rather than the total's height. The series with the largest total takes the accent and the rest
are shades of the quiet ink; `highlight` picks a different one. Layers are reordered inside-out – series that peak
early sit in the middle – unless `reorder="false"` keeps the data's order, and `offset="silhouette"` centres them on a
straight line instead of the default `"wiggle"`.

Each layer is named beside its right end. The pointer reads the nearest x across every series. Long series are
averaged into buckets about two pixels apart. Layers swell out of the centre line when the chart scrolls into view
and glide to new values when the data changes. Ported from ztd-charts (MIT).

## When to use

- A handful of series whose rise and fall over time matters more than exact values – usage by team, topics by week.
- Showing when each series peaked and how the mix shifted.

## When not to use

- Reading exact values or totals – use [Area Chart](#/area-chart), stacked on a floor, or [Line Chart](#/line-chart).
- One or two series – use [Line Chart](#/line-chart).
- Comparing categories at one moment – use [Bar Chart](#/bar-chart).

## Anatomy

1. **Header** `.tc-head` – the icon, heading and description, and the Table button
2. **Layer** `.ui-stm__layer` – one per series; the emphasised one in the accent
3. **Name** `.tc-chart__value` – each series' name beside its layer's right end
4. **Cursor** `.ui-stm__cursor` – the line at the x under the pointer or keyboard
5. **Tooltip** `.tc-chart__tip` – the x and every series' value there, largest first

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both, for a chart inside another component. Inks come from the chart tokens through overridable
component tokens on the element: `--tc-plot-accent` for the emphasised layer and `--tc-plot-rest` in shades for the
rest, parted by lines of `--tc-plot-bg`. Names are written in the text inks beside the layers rather than on them, so
they stay legible whatever the inks are. `still` (or the system's reduced-motion setting) draws everything at once.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the plot – one tab stop |
| Arrow keys | Move to the next or previous x; the tooltip shows it and it's read with every series' value |
| Home / End | The first or last x |
| Enter / Space | Picks the x (fires `tc-mark-click`) |
| Escape | Lets go of the x; pressed again, it's the page's |

## Screen readers

- The plot is a group named by the heading, with the chart described in words (its series, its range and points).
- A table of every x with each series' value is always there for screen readers; the Table button shows it to everyone.
- Moving with the arrows announces the x with every series' value and its position ("W3: Genomics 168 h, …, 3 of 13").
- The drawing itself is hidden; nothing is said by colour alone.

## Content

- Keep series names short – they sit in a column at the right.
- Three to eight series read best; more turn into thin slivers.
- Give `unit` (" h", " GB") rather than baking it into the values.

## Do

- Emphasise the series the reader came for with `highlight`.
- Pair it with a table or a line chart where exact values matter.

## Don't

- Use it for values that can be negative – streams stack only what's above zero.
- Expect readers to compare layer heights precisely; the baseline moves.

## Example

```html
<tc-stream-graph heading="GPU hours" description="Each week, by lab" unit=" h"></tc-stream-graph>

<script type="module">
  import "trenchcoat/stream-graph";
  import "trenchcoat/tokens.css";
  const el = document.querySelector("tc-stream-graph");
  el.x = "week";
  el.y = "hours";
  el.series = "lab";
  el.data = [
    { week: "W1", lab: "Genomics", hours: 120 },
    { week: "W1", lab: "Imaging", hours: 60 },
    { week: "W2", lab: "Genomics", hours: 150 },
    { week: "W2", lab: "Imaging", hours: 75 },
  ];
</script>
```

```tsx
import { StreamGraph } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const data = [
  { week: "W1", lab: "Genomics", hours: 120 },
  { week: "W1", lab: "Imaging", hours: 60 },
  { week: "W2", lab: "Genomics", hours: 150 },
  { week: "W2", lab: "Imaging", hours: 75 },
];

export function GpuHours() {
  return <StreamGraph title="GPU hours" description="Each week, by lab" unit=" h" data={data} x="week" y="hours" series="lab" onMarkClick={(e) => console.log(e.label)} />;
}
```
