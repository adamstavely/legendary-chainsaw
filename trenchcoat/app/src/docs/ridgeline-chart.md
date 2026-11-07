---
pattern: none
status: new
related: box-plot, area-chart, line-chart, heatmap
---

## Overview

How values spread in each of several groups, as density curves stacked one above another. Each ridge rises from its
own baseline and may overlap the ones above it (`overlap`, 1.5 rows by default), so many groups fit in little height
and their shapes compare at a glance. A short tick marks each group's median. The group with the highest median takes
the accent and the rest stay quiet; `highlight` picks a different one, or several, by group name. `sort="median"`
orders the groups from the lowest median.

The ridges rise from their baselines when the chart scrolls into view and reshape when the data changes. Ported from
ztd-charts (MIT).

## When to use

- Comparing the shape of a distribution across many groups or periods: hold times by team, readings by month.
- Showing groups with two humps or long tails that a box would hide.

## When not to use

- A few groups where the quartiles and outliers matter – use [Box Plot](#/box-plot).
- A single value over time – use [Line Chart](#/line-chart) or [Area Chart](#/area-chart).

## Anatomy

1. **Header** `.tc-head` – the icon, heading and description, and the Table button
2. **Ridge** `.ui-rdl__ridge` – the group's density; the emphasised one in the accent
3. **Outline** `.ui-rdl__line` – the ridge's edge
4. **Median** `.ui-rdl__median` – a tick on the baseline at the group's median
5. **Name** `.tc-chart__tick` – the group's name at the left of its baseline
6. **Axis** `.tc-chart__grid` – the value grid lines and their values below
7. **Tooltip** `.tc-chart__tip` – the median and sample size

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both, for a chart inside another component. Ridges take `--tc-plot-accent` and `--tc-plot-rest`,
their outlines `--tc-plot-line-rest`; the median tick is the component token `--tc-rdl-median`
(`--tc-rdl-median-on-accent` on the accent ridge). No text sits on a ridge. `still` (or the system's reduced-motion
setting) draws everything at once.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the plot – one tab stop |
| Arrow keys | Move to the next or previous ridge; the tooltip shows it and it's read with its median and sample size |
| Home / End | The first or last ridge |
| Enter / Space | Picks the ridge (fires `tc-mark-click`) |
| Escape | Lets go of the ridge; pressed again, it's the page's |

## Screen readers

- The plot is a group named by the heading, described in words (how many groups, each with its median).
- A table of every group's median and sample size is always there for screen readers; the Table button shows it to
  everyone.
- Moving with the arrows announces the ridge ("Clinical cohort: median 1.6 h (60 values), 2 of 6").
- The drawing itself is hidden; nothing is said by colour alone.

## Content

- Keep group names short; they share the left edge with the ridges.
- Give each group a few dozen values or more; a density from five values is mostly smoothing. `bandwidth` sets the
  smoothing by hand.
- Give `unit` rather than baking it into the values.

## Do

- Sort by median when the groups have no order of their own.
- Lower `overlap` when tall peaks hide the ridges behind them.

## Don't

- Use it for two or three groups – a box plot says more.
- Read the heights across groups as counts: each ridge is a share of its own group.

## Example

```html
<tc-ridgeline-chart heading="Time to freezer" description="Hours from collection, by team" unit=" h"></tc-ridgeline-chart>

<script type="module">
  import "@adamstavely/trenchcoat/ridgeline-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  document.querySelector("tc-ridgeline-chart").data = [
    { group: "Field ecology", value: 5.2 },
    { group: "Field ecology", value: 6.1 },
    { group: "Clinical cohort", value: 1.4 },
    { group: "Clinical cohort", value: 1.9 },
  ];
</script>
```

```tsx
import { RidgelineChart } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const data = [
  { group: "Field ecology", value: 5.2 },
  { group: "Field ecology", value: 6.1 },
  { group: "Clinical cohort", value: 1.4 },
  { group: "Clinical cohort", value: 1.9 },
];

export function TimeToFreezer() {
  return <RidgelineChart title="Time to freezer" unit=" h" sort="median" data={data} onMarkClick={(e) => console.log(e.label)} />;
}
```
