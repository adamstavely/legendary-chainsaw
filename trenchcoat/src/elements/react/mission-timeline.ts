import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcMissionTimeline } from "../mission-timeline";
import type { MissionFilter, MissionFilterChange } from "../internal/mission";
import type { LanesOpen, LaneTask } from "../agent-lanes";
import { h, useControlled } from "./internal";

export type { MissionLaneAgent, MissionLaneTask } from "../mission-timeline";
export { laneAgentStatuses } from "../mission-timeline";

const RawMissionTimeline = createComponent({
  tagName: "tc-mission-timeline",
  elementClass: TcMissionTimeline,
  react: React,
  events: {
    onTcFilterChange: "tc-filter-change" as EventName<CustomEvent<MissionFilterChange>>,
    onTcOpen: "tc-open" as EventName<CustomEvent<LanesOpen>>,
  },
});
type RawProps = React.ComponentProps<typeof RawMissionTimeline>;
type Owned = "heading" | "filter" | "decide" | "openable" | "onTcFilterChange" | "onTcOpen" | "children";
export type MissionTimelineProps = Omit<RawProps, Owned> & {
  /** The heading (default "Mission timeline") */
  title?: string;
  /** Which agents show: "all", "running", "waiting" or "failed". Controlled when defined */
  filter?: MissionFilter;
  /** The filter at first when uncontrolled – "all" by default */
  defaultFilter?: MissionFilter;
  /** Called with the new filter */
  onFilterChange?: (filter: MissionFilter) => void;
  /** "Open" in a task's details – shown when given */
  onOpenTask?: (task: LaneTask) => void;
  /** A decision on the side was answered; it may return a promise */
  onDecide?: TcMissionTimeline["decide"];
};

export function MissionTimeline({ title, filter, defaultFilter = "all", onFilterChange, onOpenTask, onDecide, ...props }: MissionTimelineProps) {
  const f = useControlled(filter, defaultFilter, onFilterChange);
  return h(RawMissionTimeline, {
    ...props,
    heading: title ?? "Mission timeline",
    filter: f.value,
    openable: !!onOpenTask,
    decide: onDecide,
    onTcFilterChange: (e: CustomEvent<MissionFilterChange>) => f.handler(e.detail.filter, e),
    onTcOpen: (e: CustomEvent<LanesOpen>) => onOpenTask?.(e.detail.task),
  });
}
