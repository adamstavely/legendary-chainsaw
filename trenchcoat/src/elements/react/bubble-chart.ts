import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcBubbleChart, type BubbleGroupsChange } from "../bubble-chart";
import type { ChartMarkClick, ChartMarkHover, ChartView, ChartViewChange } from "../internal/chart/element";
import type { ChartEvent } from "../internal/chart/types";
import { h, useControlled } from "./internal";

export type { ChartLabels, ChartMarkClick, ChartMarkHover, ChartView, ChartViewChange } from "../internal/chart/element";
export type { ChartEvent } from "../internal/chart/types";
export type { BubbleGroupsChange, BubbleStat, BubbleTrend } from "../bubble-chart";

const RawBubbleChart = createComponent({
  tagName: "tc-bubble-chart",
  elementClass: TcBubbleChart,
  react: React,
  events: {
    onTcViewChange: "tc-view-change" as EventName<CustomEvent<ChartViewChange>>,
    onTcMarkHover: "tc-mark-hover" as EventName<CustomEvent<ChartMarkHover>>,
    onTcMarkClick: "tc-mark-click" as EventName<CustomEvent<ChartMarkClick>>,
    onTcGroupsChange: "tc-groups-change" as EventName<CustomEvent<BubbleGroupsChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawBubbleChart>;
type Owned = "heading" | "view" | "groups" | "onTcViewChange" | "onTcMarkHover" | "onTcMarkClick" | "onTcGroupsChange" | "children";
export type BubbleChartProps = Omit<RawProps, Owned> & {
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
  /** The groups shown – controlled when given; by default all of them */
  groups?: string[];
  /** The groups shown on mount when `groups` isn't controlled; by default all of them */
  defaultGroups?: string[];
  /** A legend button hid or showed a group */
  onGroupsChange?: (groups: string[]) => void;
};

export function BubbleChart({ title, view, defaultView = "chart", onViewChange, onMarkHover, onMarkClick, groups, defaultGroups, onGroupsChange, ...props }: BubbleChartProps) {
  const v = useControlled<ChartView>(view, defaultView, onViewChange);
  const g = useControlled<string[] | undefined>(groups, defaultGroups, onGroupsChange ? (next) => onGroupsChange(next ?? []) : undefined);
  return h(RawBubbleChart, {
    ...props,
    heading: title ?? "",
    view: v.value,
    groups: g.value,
    onTcViewChange: (e: CustomEvent<ChartViewChange>) => v.handler(e.detail.view, e),
    onTcGroupsChange: (e: CustomEvent<BubbleGroupsChange>) => g.handler(e.detail.groups, e),
    onTcMarkHover: onMarkHover ? (e: CustomEvent<ChartMarkHover>) => onMarkHover(e.detail.event) : undefined,
    onTcMarkClick: onMarkClick ? (e: CustomEvent<ChartMarkClick>) => onMarkClick(e.detail.event) : undefined,
  });
}
