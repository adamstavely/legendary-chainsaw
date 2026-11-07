---
pattern: none
status: new
related: bar-chart, waterfall-chart, breakdown-chart, donut-chart
---

## Overview

Which few items make most of a whole. Bars run from the largest down, the running share is drawn as a line over them,
and a dashed threshold marks 80% (`threshold` sets another). The bars it takes to reach the threshold take the accent
and the rest stay quiet; `highlight` picks others. The running share where the emphasised bars end is written beside
the line.

The bars grow in one after another when the chart scrolls into view, then the line draws itself across them; when the
data changes the bars re-sort and glide. `keep-order` keeps the rows' order, and `rank-labels` writes ranks ("#1",
"#2" …) under the bars instead of names. Ported from ztd-charts (MIT).

## When to use

- Finding the few causes behind most of the problems: audit findings, failed runs, downtime.
- Deciding where effort pays most, by showing how quickly the running share climbs.

## When not to use

- Comparing categories with no whole to share – use [Bar Chart](#/bar-chart).
- Explaining how a total moved from a start to an end – use [Waterfall Chart](#/waterfall-chart).
- A share of a whole with a handful of parts – use [Donut Chart](#/donut-chart).

## Anatomy

1. **Header** `.tc-head` – the icon, heading and description, and the Table button
2. **Bar** `.ui-prt__bar` – one per item, largest first; the ones up to the threshold in the accent
3. **Cumulative line** `.ui-prt__line` – the running share, with a dot `.ui-prt__dot` on each bar
4. **Threshold** `.ui-prt__threshold` – the dashed line at `threshold`, labelled at the right
5. **Value** `.tc-chart__value` – the running share where the emphasised bars end
6. **Tooltip** `.tc-chart__tip` – the item's value, its share and the running share

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both, for a chart inside another component. Bars take `--tc-plot-accent` and `--tc-plot-rest`, the
line and its dots `--tc-plot-line-rest`, and the threshold `--tc-plot-zero` – override any on the element. Values are
written in the text inks beside the line, never on a bar. `still` (or the system's reduced-motion setting) draws
everything at once.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the plot – one tab stop |
| Arrow keys | Move to the next or previous bar; the tooltip shows it and it's read with its share |
| Home / End | The first or last bar |
| Enter / Space | Picks the bar (fires `tc-mark-click`) |
| Escape | Lets go of the bar; pressed again, it's the page's |

## Screen readers

- The plot is a group named by the heading, described in words ("7 items; the top 2 add up to 70%.").
- A table of every item is always there for screen readers; the Table button shows it to everyone.
- Moving with the arrows announces the bar with its value, share and running share ("Labelling: 46 · share 41% ·
  cumulative 41%, 1 of 7").
- The emphasis is in the words too: the description says how many items reach the threshold.

## Content

- Name items by cause, short enough to sit under a bar; long names read better with `rank-labels`.
- Give `unit` (" h", " findings") rather than baking it into the values.
- Rename the words through `paretoLabels` – "Share", "Cumulative", the rank and the description.

## Do

- Keep the default sort: the chart's point is the largest first.
- Set `threshold` to the share your team actually acts on.

## Don't

- Use it with negative values – they count as zero.
- Draw more than about fifteen items; group the long tail into "Other".

## Example

```html
<tc-pareto-chart heading="Audit findings" description="This quarter, by cause"></tc-pareto-chart>

<script type="module">
  import "@adamstavely/trenchcoat/pareto-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  document.querySelector("tc-pareto-chart").data = [
    { label: "Labelling", value: 46 },
    { label: "Storage temperature", value: 31 },
    { label: "Calibration", value: 9 },
  ];
</script>
```

```tsx
import { ParetoChart } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const data = [
  { label: "Labelling", value: 46 },
  { label: "Storage temperature", value: 31 },
  { label: "Calibration", value: 9 },
];

export function Findings() {
  return <ParetoChart title="Audit findings" description="This quarter, by cause" data={data} onMarkClick={(e) => console.log(e.label)} />;
}
```
