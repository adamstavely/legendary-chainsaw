---
pattern: none
status: new
related: gauge, pie-chart, bar-chart, stream-graph
---

## Overview

A few ratios as rings round a centre: each item's ring is filled as far round its track as its value is towards
`max` (100 by default), so progress towards a target reads at a glance. The largest takes the accent and the rest stay
quiet; `highlight` picks a different one, or several. On an open sweep (`sweep`, 270° by default) each ring is named
with its value in the empty corner where the rings start; `sweep={360}` closes the rings and writes the emphasised
value in the middle.

Values are written as percentages by default. The rings sweep round one after another when the chart scrolls into
view and glide to new values when the data changes. Ported from ztd-charts (MIT).

## When to use

- Progress of three to eight items towards the same kind of target – milestones met, budget spent, checks passed.
- A compact, eye-catching summary where a bar chart would feel heavy.

## When not to use

- One headline number against a target – use [Gauge](#/gauge).
- Shares of one whole – use [Pie Chart](#/pie-chart).
- Precise comparison between items – use [Bar Chart](#/bar-chart); outer rings look longer than inner ones.

## Anatomy

1. **Header** `.tc-head` – the icon, heading and description, and the Table button
2. **Track** `.ui-rbr__track` – the full sweep each ring could fill
3. **Ring** `.ui-rbr__bar` – the value, filled round the track; the emphasised one in the accent
4. **Name** `.tc-chart__value` – the item and its value where its ring starts (or the value in the middle)
5. **Tooltip** `.tc-chart__tip` – the item, its value and its share of the target

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both, for a chart inside another component. Inks come from the chart tokens through overridable
component tokens on the element: `--tc-plot-accent` and `--tc-plot-rest` for emphasis, and `--tc-rbr-track` (the
grid ink) for the tracks. Names are written in the text inks beside the rings rather than on them, so they stay
legible whatever the inks are. `still` (or the system's reduced-motion setting) draws everything at once.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the plot – one tab stop |
| Arrow keys | Move to the next or previous ring; the tooltip shows it and it's read with its value |
| Home / End | The first or last ring |
| Enter / Space | Picks the ring (fires `tc-mark-click`) |
| Escape | Lets go of the ring; pressed again, it's the page's |

## Screen readers

- The plot is a group named by the heading, with the chart described in words (each item and its value).
- A table of every value is always there for screen readers; the Table button shows it to everyone.
- Moving with the arrows announces the ring with its value and position ("Imaging: 64%, 2 of 5").
- The drawing itself is hidden; nothing is said by colour alone.

## Content

- Keep labels short – they share the corner left of the rings' start.
- Use the same kind of target for every ring; set `max` when it isn't 100.
- Set `format` (or `unit`) when the values aren't percentages.

## Do

- Order the items so the one that matters most is on the outside.
- Keep to about eight rings; beyond that they get too thin to name.

## Don't

- Compare rings by length – the outer ones are longer for the same value.
- Use it for values that can exceed the target by a lot; a ring stops at full.

## Example

```html
<tc-radial-bar-chart heading="Grant milestones" description="Deliverables met, of target"></tc-radial-bar-chart>

<script type="module">
  import "trenchcoat/radial-bar-chart";
  import "trenchcoat/tokens.css";
  document.querySelector("tc-radial-bar-chart").data = [
    { label: "Genomics", value: 82 },
    { label: "Imaging", value: 64 },
    { label: "Proteomics", value: 91 },
  ];
</script>
```

```tsx
import { RadialBarChart } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const data = [
  { label: "Genomics", value: 82 },
  { label: "Imaging", value: 64 },
  { label: "Proteomics", value: 91 },
];

export function Milestones() {
  return <RadialBarChart title="Grant milestones" description="Deliverables met, of target" data={data} onMarkClick={(e) => console.log(e.label)} />;
}
```
