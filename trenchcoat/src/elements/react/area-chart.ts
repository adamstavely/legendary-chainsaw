import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcAreaChart } from "../area-chart";
import type { ChartMarkClick, ChartMarkHover, ChartView, ChartViewChange } from "../internal/chart/element";
import type { ChartEvent } from "../internal/chart/types";
import type { XRange } from "../internal/chart/brush";
import type { ChartBrushChange } from "../internal/chart/xy";
import { h, useControlled } from "./internal";

export type { AreaStack } from "../area-chart";

const RawAreaChart = createComponent({
  tagName: "tc-area-chart",
  elementClass: TcAreaChart,
  react: React,
  events: {
    onTcViewChange: "tc-view-change" as EventName<CustomEvent<ChartViewChange>>,
    onTcMarkHover: "tc-mark-hover" as EventName<CustomEvent<ChartMarkHover>>,
    onTcMarkClick: "tc-mark-click" as EventName<CustomEvent<ChartMarkClick>>,
    onTcBrush: "tc-brush" as EventName<CustomEvent<ChartBrushChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawAreaChart>;
type Owned = "heading" | "view" | "onTcViewChange" | "onTcMarkHover" | "onTcMarkClick" | "onTcBrush" | "children";
export type AreaChartProps = Omit<RawProps, Owned> & {
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
  /** A range of x was picked (with `brush`), or cleared (null) */
  onBrush?: (range: XRange | null) => void;
};

export function AreaChart({ title, view, defaultView = "chart", onViewChange, onMarkHover, onMarkClick, onBrush, ...props }: AreaChartProps) {
  const v = useControlled<ChartView>(view, defaultView, onViewChange);
  return h(RawAreaChart, {
    ...props,
    heading: title ?? "",
    view: v.value,
    onTcViewChange: (e: CustomEvent<ChartViewChange>) => v.handler(e.detail.view, e),
    onTcMarkHover: onMarkHover ? (e: CustomEvent<ChartMarkHover>) => onMarkHover(e.detail.event) : undefined,
    onTcMarkClick: onMarkClick ? (e: CustomEvent<ChartMarkClick>) => onMarkClick(e.detail.event) : undefined,
    onTcBrush: onBrush ? (e: CustomEvent<ChartBrushChange>) => onBrush(e.detail.range) : undefined,
  });
}
