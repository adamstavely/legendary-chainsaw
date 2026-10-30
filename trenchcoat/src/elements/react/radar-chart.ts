import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcRadarChart, type RadarView, type RadarViewChange } from "../radar-chart";
import { h, useControlled } from "./internal";

export type { RadarGrid, RadarSeries, RadarView, RadarViewChange } from "../radar-chart";

const RawRadarChart = createComponent({
  tagName: "tc-radar-chart",
  elementClass: TcRadarChart,
  react: React,
  events: {
    onTcViewChange: "tc-view-change" as EventName<CustomEvent<RadarViewChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawRadarChart>;
type Owned = "heading" | "view" | "onTcViewChange" | "children";
export type RadarChartProps = Omit<RawProps, Owned> & {
  /** The heading, and the drawing's name */
  title?: string;
  /** The chart or the table – controlled when given */
  view?: RadarView;
  /** The view on mount when `view` isn't controlled */
  defaultView?: RadarView;
  /** The Table button was pressed */
  onViewChange?: (view: RadarView) => void;
};

export function RadarChart({ title, view, defaultView = "chart", onViewChange, ...props }: RadarChartProps) {
  const v = useControlled<RadarView>(view, defaultView, onViewChange);
  return h(RawRadarChart, {
    ...props,
    heading: title ?? "Radar chart",
    view: v.value,
    onTcViewChange: (e: CustomEvent<RadarViewChange>) => v.handler(e.detail.view, e),
  });
}
