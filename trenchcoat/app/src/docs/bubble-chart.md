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

`trend="linear"` fits a least-squares line across the points' x range, dashed over them, with its r² beside its end
on a chip of the card's colour, and `trend-band` shades the 95% confidence band of the fit. `trend="smooth"` draws a
LOESS curve instead, for a relationship that bends. The summary says which trend is drawn and its r².

`group` names a field that sorts the points into groups – teams, sites, cohorts. Each group takes the next categorical
ink, nothing is emphasised unless `highlight` says so, and the header holds a legend with a toggle button per group.
Pointing at a button, or focusing it, isolates its group: the other groups' points turn a quiet gray. Pressing it hides
or shows the group, firing a cancelable `tc-groups-change` with the groups now shown; set `groups` to own that state.
The axes are fitted to every point, so the others stay put while a group is hidden, and the last group shown can't be
hidden. `stats` adds a row of tiles under the chart – `{ label, value, change? }`, a number written in the chart's
format and a change in % with its sign.

## When to use

- Showing how two measures relate across a set of items – staff and papers, cost and speed.
- Adding a third measure as size, when its rough order is enough.
- Thousands of points as a scatter plot.
- Comparing a few groups' spread on the same two measures – a scatter by group – with headline numbers beside it.

## When not to use

- One value per category – use [Bar Chart](#/bar-chart).
- One measure's spread – use [Beeswarm Chart](#/beeswarm-chart).
- Change over time – use [Line Chart](#/line-chart).

## Anatomy

1. **Header** `.tc-head` – the icon, heading and description, and the Table button
2. **Circle** `.ui-bbl__dot` – one per point; the emphasised one in the accent
3. **Name** `.tc-chart__value` – a point's name beside its circle
4. **Axis** `.tc-chart__grid` – the y grid lines and their values, the x values below, and the axes' names
5. **Trend** `.ui-bbl__trend` – the fitted line, with its r² and, with `trend-band`, its band `.ui-bbl__band`
6. **Canvas** `.tc-chart__canvas` – the circles, painted, past the threshold
7. **Tooltip** `.tc-chart__tip` – the point's name, its group, x, y and size
8. **Legend** `.ui-bbl__legend` – with `group`, a toggle button `.ui-bbl__key` per group, its swatch `.ui-bbl__swatch`
9. **Stat tile** `.ui-bbl__stat` – with `stats`, a name `.ui-bbl__stat-label` and value `.ui-bbl__stat-value`, and its
   change `.ui-bbl__stat-change`

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both, for a chart inside another component. Inks come from the chart tokens through overridable
component tokens on the element: `--tc-plot-accent` and `--tc-plot-rest` for emphasis, `--tc-plot-grid` for grid
lines, `--tc-plot-bg` for the line parting overlapping circles, and `--tc-bbl-trend` for the trend line and its band. The canvas reads the same tokens, so it follows the
look and the theme. Groups take `--tc-plot-ink-1` to `--tc-plot-ink-6`; the points the legend isn't isolating take
`--tc-bbl-muted`. A hidden group's swatch turns to an outline and its name is struck through, so it doesn't rest on
colour. Stat tiles are white tiles on the Standard tray and wells in the Clean card, at least `--tc-bbl-stat-min` wide,
wrapping on narrow cards. Names are written in the text inks beside the circles, never on them. `still` (or the system's
reduced-motion setting) draws everything at once.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the plot – one tab stop |
| Arrow keys | Move to the next or previous point, in data order; the tooltip shows it and it's read with its values |
| Home / End | The first or last point |
| Enter / Space | Picks the point (fires `tc-mark-click`) |
| Escape | Lets go of the point; pressed again, it's the page's |

The legend, with `group`, is a toolbar with one tab stop of its own:

| Key | Does |
| --- | --- |
| Tab | Reaches the legend's last focused button, which isolates its group |
| Arrow keys / Home / End | Move between the groups' buttons |
| Enter / Space | Hides or shows the group (fires `tc-groups-change`) |

## Screen readers

- The plot is a group named by the heading, described in words: how many points and the range of x and y.
- A table of the points is always there for screen readers (the first 60, and how many more); the Table button shows
  it to everyone.
- Moving with the arrows announces the point with its values and position ("Genomics: x 24, y 41, size 3.2, 1 of 8").
- With `group`, the description says how many groups there are and which are shown; the table has a Group column; the
  legend is a toolbar named "Groups" of toggle buttons, each pressed while its group is shown.
- Stat tiles are a description list: each name a term, its value the definition.
- The drawing itself is hidden; nothing is said by colour alone.

## Content

- Name the axes with `x-label` and `y-label`, and say what size means in the description.
- Give each point a `label` so it can be named; without one it's numbered.
- Use `x-format` and `format` for the two axes' numbers.
- Draw a trend only where a straight (or smooth) relationship is the point; say in the description what it shows.
- Keep groups to six or fewer – the inks repeat after six – and name them in a word or two.
- Give stat tiles short names and the numbers the chart's reader would ask for next: totals, averages, the change.

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
  import "@adamstavely/trenchcoat/bubble-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  const chart = document.querySelector("tc-bubble-chart");
  chart.x = "staff";
  chart.y = "papers";
  chart.size = "grants";
  chart.data = [
    { label: "Genomics", staff: 24, papers: 41, grants: 3.2 },
    { label: "Imaging", staff: 12, papers: 18, grants: 1.4 },
    { label: "Neuro", staff: 20, papers: 33, grants: 4.5 },
  ];

  // A scatter by group, with stat tiles under it
  const byTeam = document.querySelector("#by-team");
  byTeam.x = "hours";
  byTeam.y = "findings";
  byTeam.group = "team";
  byTeam.stats = [{ label: "Reviews", value: 48 }, { label: "Findings", value: 212, change: 8.5 }];
  byTeam.data = [
    { label: "Review 1", team: "Fraud", hours: 12, findings: 9 },
    { label: "Review 2", team: "Audit", hours: 20, findings: 6 },
    { label: "Review 3", team: "Fraud", hours: 7, findings: 4 },
  ];
  byTeam.addEventListener("tc-groups-change", (e) => console.log(e.detail.groups));
</script>
<tc-bubble-chart id="by-team" heading="Review hours and findings" x-label="Hours" y-label="Findings"></tc-bubble-chart>
```

```tsx
import { useState } from "react";
import { BubbleChart } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const data = [
  { label: "Genomics", staff: 24, papers: 41, grants: 3.2 },
  { label: "Imaging", staff: 12, papers: 18, grants: 1.4 },
  { label: "Neuro", staff: 20, papers: 33, grants: 4.5 },
];

const reviews = [
  { label: "Review 1", team: "Fraud", hours: 12, findings: 9 },
  { label: "Review 2", team: "Audit", hours: 20, findings: 6 },
  { label: "Review 3", team: "Fraud", hours: 7, findings: 4 },
];

export function ReviewsByTeam() {
  const [groups, setGroups] = useState<string[] | undefined>(undefined);
  return (
    <BubbleChart
      title="Review hours and findings"
      data={reviews}
      x="hours"
      y="findings"
      group="team"
      groups={groups}
      onGroupsChange={setGroups}
      stats={[{ label: "Reviews", value: 48 }, { label: "Findings", value: 212, change: 8.5 }]}
    />
  );
}

export function Labs() {
  return <BubbleChart title="Labs by size and output" data={data} x="staff" y="papers" size="grants" xLabel="Staff" yLabel="Papers" onMarkClick={(e) => console.log(e.label)} />;
}
```
