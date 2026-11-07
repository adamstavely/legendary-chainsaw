---
pattern: none
status: new
related: pie-chart, radial-bar-chart, bar-chart, radar-chart
---

## Overview

A polar area chart – a Nightingale rose. Each item is a wedge, every wedge the same angle, reaching out as far as its
value. The area grows with the value, not the radius (the radius goes with the value's square root), so a wedge with
twice the value covers twice the area and the eye isn't misled. The largest wedge takes the accent and the rest stay
quiet; `highlight` picks others.

With `series`, each wedge is split into rings, one per series in its own chart ink, stacked out from the centre, with
a legend in the header; the outer edge is the wedge's total. Rings at round values sit under the wedges, their numbers
on chips of the card's colour along the line where the first wedge starts. `start-angle` turns the rose, and
`inner-radius` leaves a hole in the middle. Wedges grow out from the centre when the chart scrolls into view and glide
when the data changes.

## When to use

- A value for each step of a cycle – months, weekdays, hours, compass directions – where the cycle itself matters.
- Seeing which parts of the cycle are busy at a glance, and how a few series make up each part.

## When not to use

- Comparing values precisely – use [Bar Chart](#/bar-chart); lengths are easier to compare than areas.
- Shares of one whole – use [Pie Chart](#/pie-chart).
- Progress towards targets – use [Radial Bar Chart](#/radial-bar-chart).
- Several measures of one item – use [Radar Chart](#/radar-chart).

## Anatomy

1. **Header** `.tc-head` – the icon, heading and description, the legend (with `series`) and the Table button
2. **Wedge** `.ui-rse__wedge` – one per item, or one ring per series within it; the largest in the accent
3. **Ring** `.ui-rse__grid` – circles at round values under the wedges
4. **Ring value** `.ui-rse__ticks` – each ring's value on a chip where the first wedge starts
5. **Name** `.tc-chart__value` – each wedge's name outside the rim; thinned when the wedges are narrow
6. **Tooltip** `.tc-chart__tip` – the wedge's value, or each series' part and the total

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both. A single series takes `--tc-plot-accent` and `--tc-plot-rest`; series take the chart inks
`--tc-plot-ink-1` to `-6`. Wedges are parted by a line of `--tc-plot-bg`, the rings drawn in `--tc-plot-grid`. No text
sits on a wedge: names are outside the rim and ring values on chips. `still` (or the system's reduced-motion setting)
draws everything at once.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the plot – one tab stop |
| Arrow keys | Move to the next or previous wedge, clockwise; the tooltip shows it and it's read with its value |
| Home / End | The first or last wedge |
| Enter / Space | Picks the wedge (fires `tc-mark-click`) |
| Escape | Lets go of the wedge; pressed again, it's the page's |

## Screen readers

- The plot is a group named by the heading, described in words: how many wedges, the series, and the largest.
- A table of every wedge's value (each series' part and the total, with `series`) is always there for screen readers;
  the Table button shows it to everyone.
- Moving with the arrows announces the wedge ("Jan: 22, 1 of 12").
- The drawing itself is hidden; nothing is said by colour alone.

## Content

- Order the rows the way the cycle runs; the wedges go clockwise from `start-angle` in that order.
- Keep names short – "Jan", "Mon", "NE" – so they fit round the rim.
- Rename the tooltip's and summary's words through `roseLabels`, and the shared ones through `labels`.

## Do

- Use it when the cycle is the point – a seasonal rhythm reads at once.
- Keep to three or four series when stacking; more rings get hard to tell apart.

## Don't

- Use it for items with no order – the circle implies one.
- Read exact values off it; give the table or the tooltip for that.

## Example

```html
<tc-rose-chart heading="Grant applications" description="By month, this year"></tc-rose-chart>

<script type="module">
  import "@adamstavely/trenchcoat/rose-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  document.querySelector("tc-rose-chart").data = [
    { label: "Jan", value: 35 },
    { label: "Feb", value: 42 },
    { label: "Mar", value: 54 },
    { label: "Apr", value: 33 },
  ];
</script>
```

```tsx
import { RoseChart } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const data = [
  { label: "Jan", series: "Council", value: 22 },
  { label: "Jan", series: "Industry", value: 4 },
  { label: "Feb", series: "Council", value: 26 },
  { label: "Feb", series: "Industry", value: 5 },
];

export function Applications() {
  return <RoseChart title="Applications by funder" data={data} series="series" innerRadius={0.18} onMarkClick={(e) => console.log(e.label)} />;
}
```
