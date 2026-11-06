---
pattern: none
status: new
related: beeswarm-chart, bar-chart, line-chart, heatmap
---

## Overview

Points placed by two values, x and y, with a third drawn as the circle's area. The largest bubble takes the accent and
the rest stay quiet, so the eye lands on what matters; `highlight` picks others. The emphasised and then the largest
are named beside their circles where the names fit, up to `max-labels`. Without `size` it's a scatter plot: even dots,
none emphasised unless `highlight` says so.

Circles grow in from left to right when the chart scrolls into view and glide when the data changes. Past
`canvas-threshold` points (1,500 by default) they're painted on a canvas under the drawing, which keeps the axes and
the active point. Ported from ztd-charts (MIT).

## When to use

- Showing how two measures relate across a set of items – staff and papers, cost and speed.
- Adding a third measure as size, when its rough order is enough.
- Thousands of points as a scatter plot.

## When not to use

- One value per category – use [Bar Chart](#/bar-chart).
- One measure's spread – use [Beeswarm Chart](#/beeswarm-chart).
- Change over time – use [Line Chart](#/line-chart).

## Anatomy

1. **Header** `.tc-head` – the icon, heading and description, and the Table button
2. **Circle** `.ui-bbl__dot` – one per point; the emphasised one in the accent
3. **Name** `.tc-chart__value` – a point's name beside its circle
4. **Axis** `.tc-chart__grid` – the y grid lines and their values, the x values below, and the axes' names
5. **Canvas** `.tc-chart__canvas` – the circles, painted, past the threshold
6. **Tooltip** `.tc-chart__tip` – the point's name, x, y and size

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both, for a chart inside another component. Inks come from the chart tokens through overridable
component tokens on the element: `--tc-plot-accent` and `--tc-plot-rest` for emphasis, `--tc-plot-grid` for grid
lines, and `--tc-plot-bg` for the line parting overlapping circles. The canvas reads the same tokens, so it follows the
look and the theme. Names are written in the text inks beside the circles, never on them. `still` (or the system's
reduced-motion setting) draws everything at once.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the plot – one tab stop |
| Arrow keys | Move to the next or previous point, in data order; the tooltip shows it and it's read with its values |
| Home / End | The first or last point |
| Enter / Space | Picks the point (fires `tc-mark-click`) |
| Escape | Lets go of the point; pressed again, it's the page's |

## Screen readers

- The plot is a group named by the heading, described in words: how many points and the range of x and y.
- A table of the points is always there for screen readers (the first 60, and how many more); the Table button shows
  it to everyone.
- Moving with the arrows announces the point with its values and position ("Genomics: x 24, y 41, size 3.2, 1 of 8").
- The drawing itself is hidden; nothing is said by colour alone.

## Content

- Name the axes with `x-label` and `y-label`, and say what size means in the description.
- Give each point a `label` so it can be named; without one it's numbered.
- Use `x-format` and `format` for the two axes' numbers.

## Do

- Size by a value people compare roughly – funding, headcount – not one they need exactly.
- Keep `max-labels` low; the tooltip and table have every name.

## Don't

- Size by a value that can be negative – a circle can't be smaller than nothing.
- Start the axes at zero unless zero matters (`zero`); the points' spread is the story.

## Example

```html
<tc-bubble-chart heading="Labs by size and output" x-label="Staff" y-label="Papers"></tc-bubble-chart>

<script type="module">
  import "trenchcoat/bubble-chart";
  import "trenchcoat/tokens.css";
  const chart = document.querySelector("tc-bubble-chart");
  chart.x = "staff";
  chart.y = "papers";
  chart.size = "grants";
  chart.data = [
    { label: "Genomics", staff: 24, papers: 41, grants: 3.2 },
    { label: "Imaging", staff: 12, papers: 18, grants: 1.4 },
    { label: "Neuro", staff: 20, papers: 33, grants: 4.5 },
  ];
</script>
```

```tsx
import { BubbleChart } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const data = [
  { label: "Genomics", staff: 24, papers: 41, grants: 3.2 },
  { label: "Imaging", staff: 12, papers: 18, grants: 1.4 },
  { label: "Neuro", staff: 20, papers: 33, grants: 4.5 },
];

export function Labs() {
  return <BubbleChart title="Labs by size and output" data={data} x="staff" y="papers" size="grants" xLabel="Staff" yLabel="Papers" onMarkClick={(e) => console.log(e.label)} />;
}
```
