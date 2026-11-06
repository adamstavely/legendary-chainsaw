import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcComboChart } from "../combo-chart";
import type { ChartMarkClick, ChartMarkHover, ChartView, ChartViewChange } from "../internal/chart/element";
import type { ChartEvent } from "../internal/chart/types";
import { h, useControlled } from "./internal";

export type { ComboChartLabels, ComboLineAxis } from "../combo-chart";
export type { ChartLabels, ChartMarkClick, ChartMarkHover, ChartView, ChartViewChange } from "../internal/chart/element";
export type { ChartEvent } from "../internal/chart/types";

const RawComboChart = createComponent({
  tagName: "tc-combo-chart",
  elementClass: TcComboChart,
  react: React,
  events: {
    onTcViewChange: "tc-view-change" as EventName<CustomEvent<ChartViewChange>>,
    onTcMarkHover: "tc-mark-hover" as EventName<CustomEvent<ChartMarkHover>>,
    onTcMarkClick: "tc-mark-click" as EventName<CustomEvent<ChartMarkClick>>,
  },
});
type RawProps = React.ComponentProps<typeof RawComboChart>;
type Owned = "heading" | "view" | "onTcViewChange" | "onTcMarkHover" | "onTcMarkClick" | "children";
export type ComboChartProps = Omit<RawProps, Owned> & {
  /** The heading, and the chart's name */
  title?: string;
  /** The chart or the table – controlled when given */
  view?: ChartView;
  /** The view on mount when `view` isn't controlled */
  defaultView?: ChartView;
  /** The Table button was pressed */
  onViewChange?: (view: ChartView) => void;
  /** The pointer or keyboard moved to an x (null: off them) */
  onMarkHover?: (event: ChartEvent | null) => void;
  /** An x was clicked, or picked with Enter or Space */
  onMarkClick?: (event: ChartEvent) => void;
};

export function ComboChart({ title, view, defaultView = "chart", onViewChange, onMarkHover, onMarkClick, ...props }: ComboChartProps) {
  const v = useControlled<ChartView>(view, defaultView, onViewChange);
  return h(RawComboChart, {
    ...props,
    heading: title ?? "",
    view: v.value,
    onTcViewChange: (e: CustomEvent<ChartViewChange>) => v.handler(e.detail.view, e),
    onTcMarkHover: onMarkHover ? (e: CustomEvent<ChartMarkHover>) => onMarkHover(e.detail.event) : undefined,
    onTcMarkClick: onMarkClick ? (e: CustomEvent<ChartMarkClick>) => onMarkClick(e.detail.event) : undefined,
  });
}
