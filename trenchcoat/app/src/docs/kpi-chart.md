---
pattern: none
status: react-twin
related: breakdown-chart, usage-meter, experiment-card, compact-breakdown
---

## Overview

A metric card: a title, the headline value with its change against the previous period, and a line chart of how it
got there. With several lines it compares parts of the metric – subscriptions against services, say – and a
tooltip follows the pointer with each line's value on that day. People read the number first and the trend second,
and can step through the points with the keyboard.

## When to use

- Dashboards and overviews where one number matters and its recent trend explains it.
- Comparing two to four related series over the same days or weeks.

## When not to use

- Breaking a total down by category rather than over time – use `breakdown-chart`, or `compact-breakdown` in a small
  space.
- Usage against a plan limit – use `usage-meter`.
- The result of an A/B test, with its confidence – use `experiment-card`.

## Anatomy

1. **Header** `.tc-head` – a chart icon and the title, what the metric is
2. **Value** `.ui-kpi__value` – the headline number, already formatted
3. **Change** `.ui-kpi__delta` – a rise in green and a drop in red, or the other way round with `lower-is-better`
4. **Plot** `.ui-kpi__plot` – the lines on three gridlines, with the axis values beside them
5. **Tooltip** `.ui-kpi__tooltip` – the point's date and each line's value, largest first
6. **Legend** `.ui-kpi__legend` – names each line by its colour and stroke pattern

## Looks

Standard puts the header on a gray tray above the white card, with roomier padding, the change as coloured text after
the value, and the footer as a muted line under the chart. Clean is one white card with the header as its first row,
hairline shadows, the change as a tinted pill, and the footer as the
card's last row under a divider.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the plot |
| → / ← | Highlights the next or previous point and opens its tooltip |
| Home / End | Highlights the first or last point |
| Escape | Closes the tooltip – also from anywhere on the page while the chart highlighted the point itself |

## Screen readers

The plot is a focusable group named after the title (“Revenue chart – use the arrow keys to read the values per
day”). As the arrow keys move, a status region reads the point: its tooltip label, then each line's value (“Tue, Mar
4: Subscriptions $4.6k, Services $2.5k, One-off $1.1k”). The axes, lines and tooltip are hidden from assistive
technology – the status region carries the same numbers. The legend is a list labelled “Lines”. Each line has its own
stroke pattern as well as its colour, so the series don't rely on colour alone.

## Content

- Title the card with the metric, not the chart: “Revenue”, “Active users”.
- Format `value` the way the product shows the number elsewhere, and pass the same formatting as `format` – it is
  used for the axis, the tooltip and the change. When the change is a percentage of a money value, give it its own
  `deltaFormat` (“+8.6%”), so it doesn't read as money (“+$9”).
- For a metric where less is better – latency, cost, error rate – set `lower-is-better`: a drop then shows green and a
  rise red. The sign still says which way it moved.
- Leave a series' `color` unset to take the look's chart palette (`--tc-chart-1` to `--tc-chart-6`, in order), or set
  any CSS colour, including a token such as `var(--tc-chart-2)` or `var(--tc-status-danger-fg)`. Colours are applied
  as styles, so custom properties resolve in both themes.
- Keep `labels` short for the axis (“Mar 4”) and put the longer form in `tooltipLabels` (“Tue, Mar 4”) – screen
  readers hear the tooltip labels.
- Use `footer` for the period and freshness: “Last 14 days · updated live”.
- The plot's name says “values per day”; it reads oddly for weekly or monthly points.

## Do

- Give every series the same number of values as there are `labels`.
- Set `default-index` to the latest point when the newest day matters most – its tooltip shows at rest.
- Keep to four lines or fewer; after that the patterns repeat.
- Prefer the chart tokens to literal colours, so the lines follow the look and the dark theme.

## Don't

- Don't pass a percentage as `delta` with a money `format` and no `deltaFormat` – the change would read as money.
- Don't colour a falling cost red by hand – set `lower-is-better`.
- Don't use it for a single number without a trend; a plain stat says it with less.
- Don't rely on the line colours alone in the text around the chart – name the series.

## Example

```html
<tc-kpi-chart id="revenue" heading="Revenue" value="$96.4k" delta="8.6" footer="Last 3 days" default-index="2"></tc-kpi-chart>
<tc-kpi-chart id="latency" heading="p95 latency" value="420ms" delta="-12" lower-is-better></tc-kpi-chart>

<script type="module">
  import "trenchcoat/kpi-chart";
  import "trenchcoat/tokens.css";

  const chart = document.querySelector("#revenue");
  chart.labels = ["Mar 2", "Mar 3", "Mar 4"];
  chart.series = [
    { label: "Subscriptions", values: [4200, 4380, 4610] }, // --tc-chart-1
    { label: "Services", color: "var(--tc-chart-2)", values: [2300, 2210, 2470] },
  ];
  chart.format = (n) => `$${(n / 1000).toFixed(1)}k`;
  chart.deltaFormat = (n) => `${n.toFixed(1)}%`;
  chart.addEventListener("tc-index-change", (e) => console.log(e.detail.index));
</script>
```

```tsx
import { KpiChart, type KpiSeries } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const series: KpiSeries[] = [
  { label: "Subscriptions", values: [4200, 4380, 4610] },
  { label: "Services", color: "var(--tc-chart-2)", values: [2300, 2210, 2470] },
];

export function Revenue() {
  return (
    <KpiChart
      title="Revenue"
      value="$96.4k"
      delta={8.6}
      deltaFormat={(n) => `${n.toFixed(1)}%`}
      labels={["Mar 2", "Mar 3", "Mar 4"]}
      series={series}
      format={(n) => `$${(n / 1000).toFixed(1)}k`}
      footer="Last 3 days"
      defaultIndex={2}
    />
  );
}

export function Latency() {
  return <KpiChart title="p95 latency" value="420ms" delta={-12} lowerIsBetter labels={["Mar 2", "Mar 3", "Mar 4"]} series={[{ label: "p95", values: [480, 450, 420] }]} format={(n) => `${n}ms`} />;
}
```
