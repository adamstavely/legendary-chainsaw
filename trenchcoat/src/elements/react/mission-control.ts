import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcMissionControl, type MissionFilter, type MissionFilterChange } from "../mission-control";
import type { TreeAgent } from "../agent-tree";
import { h, useControlled } from "./internal";

export type { MissionAgent, MissionDecision, MissionEvent, MissionFilter, MissionFilterChange, MissionLabels } from "../mission-control";
export { defaultMissionLabels, filterAgentTree } from "../mission-control";

const RawMissionControl = createComponent({
  tagName: "tc-mission-control",
  elementClass: TcMissionControl,
  react: React,
  events: {
    onTcFilterChange: "tc-filter-change" as EventName<CustomEvent<MissionFilterChange>>,
    onTcSelect: "tc-select" as EventName<CustomEvent<{ agent: TreeAgent }>>,
  },
});
type RawProps = React.ComponentProps<typeof RawMissionControl>;
type Owned = "heading" | "filter" | "resolver" | "decide" | "selectable" | "onTcFilterChange" | "onTcSelect" | "onSelect" | "children";
export type MissionControlProps = Omit<RawProps, Owned> & {
  /** The heading (default "Mission control") */
  title?: string;
  /** Which agents show: "all", "running", "waiting" or "failed". Controlled when defined */
  filter?: MissionFilter;
  /** The filter at first when uncontrolled – "all" by default */
  defaultFilter?: MissionFilter;
  /** Called with the new filter */
  onFilterChange?: (filter: MissionFilter) => void;
  /** A click on an agent card – the cards are buttons when given */
  onSelectAgent?: (agent: TreeAgent) => void;
  /** An answer from the tree's "needs you" or "failed" window; it may return a promise */
  onResolve?: TcMissionControl["resolver"];
  /** A decision on the side was answered; it may return a promise */
  onDecide?: TcMissionControl["decide"];
};

export function MissionControl({ title, filter, defaultFilter = "all", onFilterChange, onSelectAgent, onResolve, onDecide, ...props }: MissionControlProps) {
  const f = useControlled(filter, defaultFilter, onFilterChange);
  return h(RawMissionControl, {
    ...props,
    heading: title ?? "Mission control",
    filter: f.value,
    selectable: !!onSelectAgent,
    resolver: onResolve,
    decide: onDecide,
    onTcFilterChange: (e: CustomEvent<MissionFilterChange>) => f.handler(e.detail.filter, e),
    onTcSelect: (e: CustomEvent<{ agent: TreeAgent }>) => onSelectAgent?.(e.detail.agent),
  });
}
