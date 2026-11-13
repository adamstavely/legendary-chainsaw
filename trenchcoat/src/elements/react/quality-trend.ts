import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcQualityTrend,
  type QualityChange,
  type QualityRange,
  type QualityTrendChangeOpen,
  type QualityTrendRangeChange,
  type QualityTrendShownChange,
  type QualityTrendView,
  type QualityTrendViewChange,
} from "../quality-trend";
import { h, useControlled } from "./internal";

export { qualityBand, qualityShift } from "../quality-trend";
export type {
  QualityChange,
  QualityChangeKind,
  QualityCriterion,
  QualityDay,
  QualityRange,
  QualityScore,
  QualityShift,
  QualityTrendChangeOpen,
  QualityTrendView,
} from "../quality-trend";

const RawQualityTrend = createComponent({
  tagName: "tc-quality-trend",
  elementClass: TcQualityTrend,
  react: React,
  events: {
    onTcRangeChange: "tc-range-change" as EventName<CustomEvent<QualityTrendRangeChange>>,
    onTcShownChange: "tc-shown-change" as EventName<CustomEvent<QualityTrendShownChange>>,
    onTcViewChange: "tc-view-change" as EventName<CustomEvent<QualityTrendViewChange>>,
    onTcChangeOpen: "tc-change-open" as EventName<CustomEvent<QualityTrendChangeOpen>>,
  },
});
type RawQualityTrendProps = React.ComponentProps<typeof RawQualityTrend>;

export type QualityTrendProps = Omit<
  RawQualityTrendProps,
  "heading" | "range" | "shown" | "view" | "onTcRangeChange" | "onTcShownChange" | "onTcViewChange" | "onTcChangeOpen" | "children"
> & {
  /** The heading */
  title?: string;
  /** How many days show – "7d", "30d" or "90d". Controlled when defined */
  range?: QualityRange;
  /** The range at first when `range` isn't controlled */
  defaultRange?: QualityRange;
  /** Called with the range the user picked, controlled or not */
  onRangeChange?: (range: QualityRange) => void;
  /** The ids of the criteria drawn (null: all). Controlled when defined */
  shown?: string[] | null;
  /** The criteria drawn at first when `shown` isn't controlled */
  defaultShown?: string[] | null;
  /** Called with the criteria drawn after one is toggled, controlled or not */
  onShownChange?: (shown: string[] | null) => void;
  /** "chart" or "table". Controlled when defined */
  view?: QualityTrendView;
  /** The view at first when `view` isn't controlled */
  defaultView?: QualityTrendView;
  /** Called when Table is pressed, controlled or not */
  onViewChange?: (view: QualityTrendView) => void;
  /** Called when a change pin is clicked or picked with Enter */
  onChangeOpen?: (change: QualityChange) => void;
};

export function QualityTrend({
  title = "Quality on live chats",
  range,
  defaultRange = "30d",
  onRangeChange,
  shown,
  defaultShown = null,
  onShownChange,
  view,
  defaultView = "chart",
  onViewChange,
  onChangeOpen,
  ...props
}: QualityTrendProps) {
  const r = useControlled<QualityRange>(range, defaultRange, onRangeChange);
  const s = useControlled<string[] | null>(shown, defaultShown, onShownChange);
  const v = useControlled<QualityTrendView>(view, defaultView, onViewChange);
  return h(RawQualityTrend, {
    ...props,
    heading: title,
    range: r.value,
    shown: s.value,
    view: v.value,
    onTcRangeChange: (e: CustomEvent<QualityTrendRangeChange>) => r.handler(e.detail.range, e),
    onTcShownChange: (e: CustomEvent<QualityTrendShownChange>) => s.handler(e.detail.shown, e),
    onTcViewChange: (e: CustomEvent<QualityTrendViewChange>) => v.handler(e.detail.view, e),
    onTcChangeOpen: onChangeOpen ? (e: CustomEvent<QualityTrendChangeOpen>) => onChangeOpen(e.detail.change) : undefined,
  });
}
