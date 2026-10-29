import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcRoadmapTimeline, type RoadmapItem, type RoadmapScale, type RoadmapScaleChange, type RoadmapSelectedChange } from "../roadmap-timeline";
import { h, useControlled } from "./internal";

export type { RoadmapItem, RoadmapLane, RoadmapRange, RoadmapScale, RoadmapStatus, RoadmapStatusLabels } from "../roadmap-timeline";

const RawRoadmapTimeline = createComponent({
  tagName: "tc-roadmap-timeline",
  elementClass: TcRoadmapTimeline,
  react: React,
  events: {
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<RoadmapSelectedChange>>,
    onTcScaleChange: "tc-scale-change" as EventName<CustomEvent<RoadmapScaleChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawRoadmapTimeline>;
type Owned = "heading" | "selected" | "scale" | "onTcSelectedChange" | "onTcScaleChange" | "children";
export type RoadmapTimelineProps = Omit<RawProps, Owned> & {
  /** The heading, and the chart's name */
  title?: string;
  /** The selected piece of work's id – controlled when given */
  selected?: string | null;
  /** The selection on mount when `selected` isn't controlled */
  defaultSelected?: string | null;
  /** A piece of work was selected, or the selection cleared */
  onSelectedChange?: (selected: string | null, item: RoadmapItem | null) => void;
  /** Weeks, months or quarters – controlled when given */
  scale?: RoadmapScale;
  /** The scale on mount when `scale` isn't controlled */
  defaultScale?: RoadmapScale;
  /** The scale was switched */
  onScaleChange?: (scale: RoadmapScale) => void;
};

export function RoadmapTimeline({ title, selected, defaultSelected = null, onSelectedChange, scale, defaultScale = "month", onScaleChange, ...props }: RoadmapTimelineProps) {
  const item = React.useRef<RoadmapItem | null>(null);
  const sel = useControlled<string | null>(selected, defaultSelected, onSelectedChange ? (next) => onSelectedChange(next, item.current) : undefined);
  const sc = useControlled<RoadmapScale>(scale, defaultScale, onScaleChange);
  return h(RawRoadmapTimeline, {
    ...props,
    heading: title ?? "Roadmap",
    selected: sel.value,
    scale: sc.value,
    onTcSelectedChange: (e: CustomEvent<RoadmapSelectedChange>) => {
      item.current = e.detail.item;
      sel.handler(e.detail.selected, e);
    },
    onTcScaleChange: (e: CustomEvent<RoadmapScaleChange>) => sc.handler(e.detail.scale, e),
  });
}
