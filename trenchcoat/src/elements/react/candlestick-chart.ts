import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcCandlestickChart, type CandlestickBrushChange } from "../candlestick-chart";
import type { XRange } from "../internal/chart/brush";
import type { ChartMarkClick, ChartMarkHover, ChartView, ChartViewChange } from "../internal/chart/element";
import type { ChartEvent } from "../internal/chart/types";
import { h, useControlled } from "./internal";

export type { CandlestickBrushChange, CandlestickLabels } from "../candlestick-chart";
export type { ChartLabels, ChartMarkClick, ChartMarkHover, ChartView, ChartViewChange } from "../internal/chart/element";
export type { ChartEvent } from "../internal/chart/types";

const RawCandlestickChart = createComponent({
  tagName: "tc-candlestick-chart",
  elementClass: TcCandlestickChart,
  react: React,
  events: {
    onTcViewChange: "tc-view-change" as EventName<CustomEvent<ChartViewChange>>,
    onTcMarkHover: "tc-mark-hover" as EventName<CustomEvent<ChartMarkHover>>,
    onTcMarkClick: "tc-mark-click" as EventName<CustomEvent<ChartMarkClick>>,
    onTcBrush: "tc-brush" as EventName<CustomEvent<CandlestickBrushChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawCandlestickChart>;
type Owned = "heading" | "view" | "onTcViewChange" | "onTcMarkHover" | "onTcMarkClick" | "onTcBrush" | "children";
export type CandlestickChartProps = Omit<RawProps, Owned> & {
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
  /** A range of candles was picked (with `brush`), or cleared (null) */
  onBrush?: (range: XRange | null) => void;
};

export function CandlestickChart({ title, view, defaultView = "chart", onViewChange, onMarkHover, onMarkClick, onBrush, ...props }: CandlestickChartProps) {
  const v = useControlled<ChartView>(view, defaultView, onViewChange);
  return h(RawCandlestickChart, {
    ...props,
    heading: title ?? "",
    view: v.value,
    onTcViewChange: (e: CustomEvent<ChartViewChange>) => v.handler(e.detail.view, e),
    onTcMarkHover: onMarkHover ? (e: CustomEvent<ChartMarkHover>) => onMarkHover(e.detail.event) : undefined,
    onTcMarkClick: onMarkClick ? (e: CustomEvent<ChartMarkClick>) => onMarkClick(e.detail.event) : undefined,
    onTcBrush: onBrush ? (e: CustomEvent<CandlestickBrushChange>) => onBrush(e.detail.range) : undefined,
  });
}
