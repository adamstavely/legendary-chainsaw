---
pattern: none
status: new
related: gauge, kpi-chart, bar-chart, capacity-bars
---

## Overview

Each measure against its target and its qualitative ranges, one row per measure: the bar is the actual value, the
tick the target, and the shaded bands behind them the ranges named in `ranges` – poor, fair, good – darker the
further they reach. The row furthest behind its target takes the accent and the rest stay in the strong ink, so the
one that needs attention stands out; `highlight` picks a different one, or several.

Each row has its own scale by default, so measures in different units sit together; `independent={false}` puts them
on one scale with its values underneath. `range-tone="status"` paints the bands from the danger tint to the success
tint instead of quiet shades. Bars grow from the left when the chart scrolls into view and glide when the data
changes. Ported from ztd-charts (MIT).

## When to use

- Showing several measures against their targets in little room – a scorecard, a readiness review.
- When "how good is this value" matters as much as the value – with poor, fair and good bands.

## When not to use

- One measure as a dial – use [Gauge](#/gauge).
- One headline metric with its trend – use [KPI Chart](#/kpi-chart).
- Values without targets – use [Bar Chart](#/bar-chart).

## Anatomy

1. **Header** `.tc-head` – the icon, heading and description, and the Table button
2. **Range** `.ui-blt__range` – a qualitative band behind the bar, from the lowest
3. **Bar** `.ui-blt__bar` – the actual value; the emphasised one in the accent
4. **Target** `.ui-blt__target` – the tick at the target
5. **Value** `.tc-chart__value` – the actual value at the row's end
6. **Tooltip** `.tc-chart__tip` – the actual value, the target and how much of it is reached

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both, for a chart inside another component. Inks are component tokens on the element:
`--tc-blt-ink` for the bars and targets, `--tc-plot-accent` for the emphasised bar, `--tc-blt-range-1` … `-3` for the
quiet bands and `--tc-blt-range-low`, `-mid` and `-high` for the status tints. Names and values are written in the
text inks beside the bars. `still` (or the system's reduced-motion setting) draws everything at once.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the plot – one tab stop |
| Arrow keys | Move to the next or previous row; the tooltip shows it and it's read with its value and target |
| Home / End | The first or last row |
| Enter / Space | Picks the row (fires `tc-mark-click`) |
| Escape | Lets go of the row; pressed again, it's the page's |

## Screen readers

- The plot is a group named by the heading, described in words (each measure, its value and its target).
- A table of every value is always there for screen readers; the Table button shows it to everyone.
- Moving with the arrows announces the row ("Biosafety: 72% / target 85% (85%), 1 of 4").
- The drawing itself is hidden; the bands are never the only cue – the target and the share reached are read out.

## Content

- Name the bounds' fields from the lowest: `ranges={["poor", "fair"]}` makes three bands up to the scale's end.
- Keep measure names short; long ones wrap onto two lines.
- Give `unit` (" ms", "%") rather than baking it into the values.

## Do

- Keep the bands to three; more shades are hard to tell apart.
- Use the status tone only when higher is better on every row.

## Don't

- Share one scale between measures in different units.
- Leave a missing value as 0 – leave it out, and it's written as a dash.

## Example

```html
<tc-bullet-chart heading="Audit readiness" description="Score out of 100"></tc-bullet-chart>

<script type="module">
  import "trenchcoat/bullet-chart";
  import "trenchcoat/tokens.css";
  const el = document.querySelector("tc-bullet-chart");
  el.ranges = ["poor", "fair"];
  el.data = [
    { label: "Biosafety", value: 72, target: 85, poor: 50, fair: 75 },
    { label: "Data retention", value: 91, target: 90, poor: 60, fair: 80 },
  ];
</script>
```

```tsx
import { BulletChart } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const data = [
  { label: "Biosafety", value: 72, target: 85, poor: 50, fair: 75 },
  { label: "Data retention", value: 91, target: 90, poor: 60, fair: 80 },
];

export function AuditReadiness() {
  return <BulletChart title="Audit readiness" description="Score out of 100" data={data} ranges={["poor", "fair"]} onMarkClick={(e) => console.log(e.label)} />;
}
```
