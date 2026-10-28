import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcMetricsDashboard,
  type MetricKey,
  type MetricsChart,
  type MetricsChartChange,
  type MetricsCompareChange,
  type MetricsMetricChange,
  type MetricsRangeChange,
  type RangeKey,
} from "../metrics-dashboard";
import { h, useControlled } from "./internal";

export type { MetricKey, MetricsChart, MetricsExport, RangeKey } from "../metrics-dashboard";

const RawMetricsDashboard = createComponent({
  tagName: "tc-metrics-dashboard",
  elementClass: TcMetricsDashboard,
  react: React,
  events: {
    onTcRangeChange: "tc-range-change" as EventName<CustomEvent<MetricsRangeChange>>,
    onTcMetricChange: "tc-metric-change" as EventName<CustomEvent<MetricsMetricChange>>,
    onTcChartChange: "tc-chart-change" as EventName<CustomEvent<MetricsChartChange>>,
    onTcCompareChange: "tc-compare-change" as EventName<CustomEvent<MetricsCompareChange>>,
  },
});
type RawMetricsDashboardProps = React.ComponentProps<typeof RawMetricsDashboard>;
export type MetricsDashboardProps = Omit<
  RawMetricsDashboardProps,
  "heading" | "range" | "metric" | "chart" | "compare" | "onTcRangeChange" | "onTcMetricChange" | "onTcChartChange" | "onTcCompareChange" | "title"
> & {
  /** Title in the bar on top */
  title?: string;
  /** The period (controlled) – pass `onRangeChange` with it */
  range?: RangeKey;
  /** Range to start on */
  defaultRange?: RangeKey;
  /** A period was picked */
  onRangeChange?: (range: RangeKey) => void;
  /** The charted metric (controlled) – pass `onMetricChange` with it */
  metric?: MetricKey;
  /** Metric to start on */
  defaultMetric?: MetricKey;
  /** A metric was picked */
  onMetricChange?: (metric: MetricKey) => void;
  /** Line or bars (controlled) */
  chart?: MetricsChart;
  /** The chart type at first (uncontrolled) */
  defaultChart?: MetricsChart;
  /** The chart type was switched */
  onChartChange?: (chart: MetricsChart) => void;
  /** The previous-period comparison (controlled) */
  compare?: boolean;
  /** Comparing with the previous period at first (uncontrolled) */
  defaultCompare?: boolean;
  /** Comparison was turned on or off */
  onCompareChange?: (compare: boolean) => void;
};

export function MetricsDashboard({
  title,
  range,
  defaultRange = "30d",
  onRangeChange,
  metric,
  defaultMetric = "revenue",
  onMetricChange,
  chart,
  defaultChart = "line",
  onChartChange,
  compare,
  defaultCompare = false,
  onCompareChange,
  ...props
}: MetricsDashboardProps) {
  const r = useControlled(range, defaultRange, onRangeChange);
  const m = useControlled(metric, defaultMetric, onMetricChange);
  const c = useControlled(chart, defaultChart, onChartChange);
  const cmp = useControlled(compare, defaultCompare, onCompareChange);
  return h(RawMetricsDashboard, {
    ...props,
    heading: title ?? "Sales",
    range: r.value,
    metric: m.value,
    chart: c.value,
    compare: cmp.value,
    onTcRangeChange: (e: CustomEvent<MetricsRangeChange>) => r.handler(e.detail.range, e),
    onTcMetricChange: (e: CustomEvent<MetricsMetricChange>) => m.handler(e.detail.metric, e),
    onTcChartChange: (e: CustomEvent<MetricsChartChange>) => c.handler(e.detail.chart, e),
    onTcCompareChange: (e: CustomEvent<MetricsCompareChange>) => cmp.handler(e.detail.compare, e),
  });
}
