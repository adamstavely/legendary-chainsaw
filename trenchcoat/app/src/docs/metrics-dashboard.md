---
pattern: tabs
status: new
related: kpi-chart, compact-breakdown, data-table, breakdown-chart, segmented-control
---

## Overview

A compact sales overview in one block. A bar on top names the shop and the period, with Week / Month / Quarter and
Export. Under it, four KPI cards – revenue, orders, average order and refund rate – each with its change against the
previous period; picking one charts it. The chart is a dotted line or bars, with the previous period on request, and
a tooltip that follows the pointer or the arrow keys. Top products and sales channels close it. Figures count to their
new values and the chart redraws when the period or metric changes.

## When to use

- The top of an analytics or commerce page, where people move between a handful of metrics over the same period.
- A demo or starting point for a dashboard: the layout, keyboard model and motion are done; swap in your own figures.

## When not to use

- One metric on its own card – use `kpi-chart`.
- A few figures with their shares, without a chart – use `compact-breakdown`.
- Rows of figures to sort and filter – use `data-table`.
- Parts of a whole – use `breakdown-chart`.

## Anatomy

1. **Bar** `.ui-md__bar` – the title, the shop and period, the period switch and Export
2. **KPI card** `.ui-md__kpi` – a metric's name, value and change; a tab for the chart
3. **Change** `.ui-md__delta` – the change against the previous period, green when it moves the good way
4. **Chart** `.ui-md__chart` – the legend, the line / bars switch, the comparison switch and the plot
5. **Plot** `.ui-md__plot` – the line or bars, the axis and dates; focus it to read points
6. **Tooltip** `.ui-md__tip` – the highlighted point's date and value, and the previous period's
7. **List** `.ui-md__list` – top products or channels, each row with a bar for its share

## Looks

Standard puts the bar and the KPI cards on a gray tray, with the chart and lists on a white card below. Clean is one
white card: the bar is its first row and the KPIs are a row of tabs split by hairlines, the chosen one with an accent
line at its foot. `--tc-md-plot-h` sets the plot's height, `--tc-md-area` the fill under the line and `--tc-md-prev`
the previous period's colour.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves between the period switch, Export, the chosen KPI, the chart tools and the plot |
| ← / → on a KPI | Moves to the previous or next KPI and charts it |
| Home / End on a KPI | Moves to the first or last KPI |
| ← / → on the plot | Moves the highlighted point |
| Home / End on the plot | Highlights the first or last point |
| Escape on the plot | Hides the tooltip; focus stays on the plot |
| Space | Toggles the comparison switch |

## Screen readers

The KPI cards are a tablist named "Metric", and the chart is their tabpanel. Each card reads its name, value and
change in words: "Revenue $293,528 8.7% up versus the previous period". The plot is an image whose name gives the
metric, the period and its first and last values; points picked with the arrow keys are announced in a polite status
message ("Oct 27: Revenue $9,880"), points under the pointer are not. The comparison is a switch named "Compare to
previous period". Export says "Exported" or "Export failed" in a status message.

## Content

- Keep `heading` short – "Sales", "Store" – and put the shop or workspace in `site`.
- The figures are sample data generated for the last 180 days up to `now`; pass `now` for the same figures on every
  load, e.g. in tests and screenshots.
- `onExport` receives the period and metric; return a promise to show "Exporting…" until it settles.

## Do

- Control `range` and `metric` when they belong in the URL, so a shared link opens the same view.
- Let the chart switch to bars for short periods and counts; keep the line for trends.

## Don't

- Don't add more than four KPIs – the row is built for four, two by two on a phone.
- Don't colour-code changes yourself – the pill's tone, arrow and words already say whether it's good.

## Example

```html
<tc-metrics-dashboard id="sales" heading="Sales" site="Northwind Store"></tc-metrics-dashboard>

<script type="module">
  import "trenchcoat/metrics-dashboard";
  import "trenchcoat/tokens.css";

  const sales = document.querySelector("#sales");
  sales.onExport = (range, metric) => fetch(`/export?range=${range}&metric=${metric}`);
  sales.addEventListener("tc-metric-change", (e) => console.log(e.detail.metric));
</script>
```

```tsx
import { useState } from "react";
import { MetricsDashboard, type MetricKey } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Sales() {
  const [metric, setMetric] = useState<MetricKey>("revenue");
  return <MetricsDashboard title="Sales" site="Northwind Store" metric={metric} onMetricChange={setMetric} />;
}
```
