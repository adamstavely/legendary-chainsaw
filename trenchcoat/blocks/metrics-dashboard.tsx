"use client";

import { MetricsDashboard as MetricsDashboardElement, type MetricKey, type MetricsDashboardProps as ElementProps, type RangeKey } from "trenchcoat/react";

/*
 * Metrics Dashboard – a compact sales overview: a period switch, four KPI cards that pick the charted metric, one
 * chart that switches between a dotted line and bars with an optional previous-period comparison, and top products
 * and sales channels below.
 * Built on the <tc-metrics-dashboard> element through `trenchcoat/react` (install `trenchcoat` and import its
 * tokens.css): the element holds the layout, styles, keyboard model and animation, so the same dashboard is available
 * to Angular, Vue and plain HTML. It follows the nearest <LookProvider>, or takes a `look` prop.
 * The KPI cards are tabs (arrow keys, Home / End) for the chart panel; the chart is read point by point with the
 * arrow keys, and each point is announced.
 */

export type { MetricKey, RangeKey };

export type MetricsDashboardProps = ElementProps & {
  /** Title in the bar on top */
  title?: string;
  /** Site or workspace shown under the title */
  site?: string;
  /** Last day of the sample data, as epoch ms – today by default */
  now?: number;
  /** Called when Export is pressed, with the current range and metric. Return a promise to show Exporting… until it settles */
  onExport?: (range: RangeKey, metric: MetricKey) => void | Promise<unknown>;
};

export function MetricsDashboard(props: MetricsDashboardProps) {
  return <MetricsDashboardElement {...props} />;
}
