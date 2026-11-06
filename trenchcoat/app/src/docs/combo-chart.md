---
pattern: none
status: new
related: bar-chart, line-chart, kpi-chart, pareto-chart
---

## Overview

Bars and lines over one shared x. `bars` names the fields drawn as bars, side by side or, with `stacked`, on top of
each other, and `lines` the fields drawn as lines with a dot at each category. It's for a volume next to a rate:
samples processed against turnaround, runs against success rate, spend against budget.

When the lines' range is far from the bars' (more than three times larger or smaller), they get their own axis at the
right. `line-axis` fixes either side. With one bar series and one line the bars stay quiet and the line takes the
accent; more series take the chart inks in order, bars first. The legend draws bars as squares and lines as strokes,
and names the axis each is read against, so colour is never the only cue. Bars grow from the baseline when the chart
scrolls into view, then the lines draw in; both glide to new values when the data changes.

## When to use

- A count or amount and a rate or average that explains it, over the same months or categories.
- Two measures with different units, where a second axis keeps both readable.

## When not to use

- Several series of the same kind – use [Bar Chart](#/bar-chart) or [Line Chart](#/line-chart).
- Bars sorted from the largest with a running share – use [Pareto Chart](#/pareto-chart).
- One headline metric with its trend – use [KPI Chart](#/kpi-chart).

## Anatomy

1. **Header** `.tc-head` – the icon, heading and description, the legend and the Table button
2. **Bar** `.ui-cmb__bar` – one per category and bar series
3. **Line** `.ui-cmb__line` – one per line series, with a dot `.ui-cmb__dot` at each category
4. **Axes** `.tc-chart__grid` – the left axis's grid lines and values; the right axis's values when there are two; the categories under the bars
5. **Legend** `.ui-cmb__stroke` – a short stroke for a line, the shared square for a bar, and `.ui-cmb__axis` naming its axis
6. **Tooltip** `.tc-chart__tip` – the category and every series' value there

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both, for a chart inside another component. Inks come from the chart tokens: `--tc-plot-accent` and
`--tc-plot-rest` for a bar–line pair, `--tc-plot-ink-1` … `-6` for more series, `--tc-plot-grid` for grid lines.
`--tc-cmb-line-width` and `--tc-cmb-line-width-hi` set the lines' weight. Values are written in the text inks, never on
a bar. `still` (or the system's reduced-motion setting) draws everything at once.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the plot – one tab stop |
| Arrow keys | Move to the next or previous category; the tooltip shows it and every series is read |
| Home / End | The first or last category |
| Enter / Space | Picks the category (fires `tc-mark-click`) |
| Escape | Lets go; pressed again, it's the page's |

## Screen readers

- The plot is a group named by the heading, described in words: the span of x, which series are bars and which are lines, and the axis the lines use.
- A table of every category with each series' value is always there for screen readers; the Table button shows it to everyone.
- Moving with the arrows reads the category with every series ("Mar: Genomics 210, Proteomics 118, Median turnaround 47 h, 3 of 12").
- The drawing itself is hidden; nothing is said by colour alone.

## Content

- Give each field a display name in `seriesLabels`.
- Put units in `unit` for the bars and `line-unit` for the lines rather than in the values.
- Title both axes with `y-label` and `y2-label` when there are two.

## Do

- Pair one volume with one rate – the clearest combo.
- Let the second axis appear only when the ranges are far apart; a shared axis is easier to read.

## Don't

- Put more than two or three series on one combo chart.
- Use a second axis to make two unrelated measures look related.

## Example

```html
<tc-combo-chart heading="Samples and turnaround" line-unit=" h" y-label="Samples" y2-label="Hours"></tc-combo-chart>

<script type="module">
  import "trenchcoat/combo-chart";
  import "trenchcoat/tokens.css";
  const chart = document.querySelector("tc-combo-chart");
  chart.x = "month";
  chart.bars = ["samples"];
  chart.lines = ["hours"];
  chart.seriesLabels = { samples: "Samples", hours: "Median turnaround" };
  chart.data = [
    { month: "2026-01", samples: 278, hours: 41 },
    { month: "2026-02", samples: 300, hours: 44 },
    { month: "2026-03", samples: 328, hours: 47 },
  ];
</script>
```

```tsx
import { ComboChart } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const data = [
  { month: "2026-01", samples: 278, hours: 41 },
  { month: "2026-02", samples: 300, hours: 44 },
  { month: "2026-03", samples: 328, hours: 47 },
];

export function Turnaround() {
  return (
    <ComboChart
      title="Samples and turnaround"
      data={data}
      x="month"
      bars={["samples"]}
      lines={["hours"]}
      seriesLabels={{ samples: "Samples", hours: "Median turnaround" }}
      lineUnit=" h"
      onMarkClick={(e) => console.log(e.label)}
    />
  );
}
```
