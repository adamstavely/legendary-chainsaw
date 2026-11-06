import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcRidgelineChart } from "../ridgeline-chart";
import type { ChartMarkClick, ChartMarkHover, ChartView, ChartViewChange } from "../internal/chart/element";
import type { ChartEvent } from "../internal/chart/types";
import { h, useControlled } from "./internal";

export type { RidgelineSort, RidgelineLabels } from "../ridgeline-chart";
export type { ChartLabels, ChartMarkClick, ChartMarkHover, ChartView, ChartViewChange } from "../internal/chart/element";
export type { ChartEvent } from "../internal/chart/types";

const RawRidgelineChart = createComponent({
  tagName: "tc-ridgeline-chart",
  elementClass: TcRidgelineChart,
  react: React,
  events: {
    onTcViewChange: "tc-view-change" as EventName<CustomEvent<ChartViewChange>>,
    onTcMarkHover: "tc-mark-hover" as EventName<CustomEvent<ChartMarkHover>>,
    onTcMarkClick: "tc-mark-click" as EventName<CustomEvent<ChartMarkClick>>,
  },
});
type RawProps = React.ComponentProps<typeof RawRidgelineChart>;
type Owned = "heading" | "view" | "onTcViewChange" | "onTcMarkHover" | "onTcMarkClick" | "children";
export type RidgelineChartProps = Omit<RawProps, Owned> & {
  /** The heading, and the chart's name */
  title?: string;
  /** The chart or the table – controlled when given */
  view?: ChartView;
  /** The view on mount when `view` isn't controlled */
  defaultView?: ChartView;
  /** The Table button was pressed */
  onViewChange?: (view: ChartView) => void;
  /** The pointer or keyboard moved to a mark (null: off them) */
  onMarkHover?: (event: ChartEvent | null) => void;
  /** A mark was clicked, or picked with Enter or Space */
  onMarkClick?: (event: ChartEvent) => void;
};

export function RidgelineChart({ title, view, defaultView = "chart", onViewChange, onMarkHover, onMarkClick, ...props }: RidgelineChartProps) {
  const v = useControlled<ChartView>(view, defaultView, onViewChange);
  return h(RawRidgelineChart, {
    ...props,
    heading: title ?? "",
    view: v.value,
    onTcViewChange: (e: CustomEvent<ChartViewChange>) => v.handler(e.detail.view, e),
    onTcMarkHover: onMarkHover ? (e: CustomEvent<ChartMarkHover>) => onMarkHover(e.detail.event) : undefined,
    onTcMarkClick: onMarkClick ? (e: CustomEvent<ChartMarkClick>) => onMarkClick(e.detail.event) : undefined,
  });
}
