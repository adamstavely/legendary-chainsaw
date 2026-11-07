---
pattern: none
status: new
related: activity-calendar, heatmap, line-chart, bar-chart, parallel-chart
---

## Overview

An amount per day on a grid of weeks: each column is a week, each row a weekday, and each day is a square shaded by
its value. The range runs from the first day in the data to the last; data over several years is drawn a year per
row, January to December, with the year beside it. The shading mixes the accent into the card's colour – light for a
little, the full accent for the most – topped at the 95th percentile so one outlier doesn't wash out the rest. A day
with nothing on it takes the quiet empty ink, and the busiest day is outlined (`highlight` picks others, by ISO date
or a test). A legend in the header gives the scale from its lowest value to its top.

Weeks fade in from left to right when the chart scrolls into view, and the shades cross-fade when the data changes.
Above `canvas-threshold` days (4,000 by default, about eleven years) the days are painted on a canvas under the
drawing, so very long ranges stay smooth. Ported from ztd-charts (MIT).

## When to use

- How an amount spreads over days, weeks and seasons: samples logged, instrument hours, compute spent, audits closed.
- Spotting weekly rhythms, busy runs and closures across months or years of daily data.
- A value per day that can be large or fractional, or negative – the shading follows the value, not a count.

## When not to use

- A year of someone's activity as a contribution graph, with a total, a readout and day selection – use
  [Activity Calendar](#/activity-calendar).
- Two categories against each other – weekday by hour, service by region – rather than dates – use
  [Heatmap](#/heatmap).
- The trend of a daily value, where the exact level matters more than the pattern – use
  [Line Chart](#/line-chart).
- A handful of totals by week or month – use [Bar Chart](#/bar-chart).

## Anatomy

1. **Header** `.tc-head` – the icon, heading and description, the legend and the Table button
2. **Legend** `.ui-clh__legend` – the lowest value, the empty shade and the ramp of shades, and the top of the scale
3. **Day** `.ui-clh__day` – a square shaded by the day's value; the emphasised day outlined
4. **Labels** `.tc-chart__tick` – month names along the top, every other weekday down the side, and each year's
   number when there are several
5. **Ring** `.ui-clh__ring` – round the day under the pointer or the keyboard
6. **Tooltip** `.tc-chart__tip` – the day's date and value
7. **Canvas** `.tc-chart__canvas` – where the days are painted above `canvas-threshold`

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both (and the legend with the header), for a chart inside another component. The shades are
`--tc-clh-ink` (by default `--tc-plot-accent`) mixed into `--tc-plot-bg`; empty days take `--tc-clh-empty` (by default
`--tc-plot-grid`) and the outline `--tc-clh-mark` (by default `--tc-plot-focus`). Set any of them on the element; the
canvas reads the same tokens. No value is written on a square – they're in the tooltip and the table. `still` (or the
system's reduced-motion setting) draws everything at once.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the plot – one tab stop |
| ↑ / ↓ | The previous or next day; the tooltip shows it and it's read with its value |
| ← / → | The same weekday a week earlier or later; past either end, the previous or next day |
| Home / End | The first or last day |
| Enter / Space | Picks the day (fires `tc-mark-click`) |
| Escape | Lets go of the day; pressed again, it's the page's |

## Screen readers

- The plot is a group named by the heading, described in words (how many days, and the most on one).
- A table of every day and its value is always there for screen readers (the first 60, then how many more); the
  Table button shows it to everyone.
- Moving with the arrows announces the day with its value and position ("Mon, June 1: 3, 1 of 14").
- The legend is an image named by its range ("Shading from 0 to 15 or more"); the drawing itself is hidden.

## Content

- Give one row per day, or several – rows on the same day are added up. Dates may be ISO strings, epoch ms or Dates.
- Give `unit` (" samples", " h") rather than baking it into the values.
- Start the week on Monday with `week-start="1"` where that's the custom.

## Do

- Let the shading show the pattern and leave exact values to the tooltip and the table.
- Use it for daily data over months – the grid needs a few weeks before a rhythm shows.

## Don't

- Use it for a few days or a few totals – a bar chart reads faster.
- Lower `canvas-threshold` without need: the SVG keeps crisp outlines and fades week by week.

## Example

```html
<tc-calendar-heatmap heading="Samples logged" description="January to June, by day" unit=" samples"></tc-calendar-heatmap>

<script type="module">
  import "@adamstavely/trenchcoat/calendar-heatmap";
  import "@adamstavely/trenchcoat/tokens.css";
  document.querySelector("tc-calendar-heatmap").data = [
    { date: "2026-03-02", value: 14 },
    { date: "2026-03-03", value: 19 },
    { date: "2026-03-04", value: 11 },
  ];
</script>
```

```tsx
import { CalendarHeatmap } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const data = [
  { date: "2026-03-02", value: 14 },
  { date: "2026-03-03", value: 19 },
  { date: "2026-03-04", value: 11 },
];

export function Intake() {
  return <CalendarHeatmap title="Samples logged" description="January to June, by day" data={data} unit=" samples" weekStart={1} onMarkClick={(e) => console.log(e.label)} />;
}
```
