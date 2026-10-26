import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcFanOutGrid, type FanoutFilterChange, type FanoutSelect, type FanoutSelectedChange, type FanoutStatus, type FanoutTask } from "../fan-out-grid";
import { h, isNode, useControlled, useStaged } from "./internal";

export type { FanoutStatus, FanoutTask } from "../fan-out-grid";

const RawFanoutGrid = createComponent({
  tagName: "tc-fan-out-grid",
  elementClass: TcFanOutGrid,
  react: React,
  events: {
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<FanoutSelectedChange>>,
    onTcFilterChange: "tc-filter-change" as EventName<CustomEvent<FanoutFilterChange>>,
    onTcSelect: "tc-select" as EventName<CustomEvent<FanoutSelect>>,
  },
});
type RawFanoutGridProps = React.ComponentProps<typeof RawFanoutGrid>;
export type FanoutGridProps = Omit<RawFanoutGridProps, "heading" | "icon" | "selected" | "filter" | "onTcSelectedChange" | "onTcFilterChange" | "onTcSelect" | "onSelect" | "job"> & {
  tasks: FanoutTask[];
  /** What the whole job does – e.g. "Enrich 240 leads" */
  job?: string;
  /** The id of the task whose window is kept open. Controlled when defined (null: none) */
  selected?: string | null;
  /** The task kept open on mount when `selected` isn't controlled */
  defaultSelected?: string | null;
  /** Called with the id of the task kept open (null when let go), controlled or not */
  onSelectedChange?: (id: string | null) => void;
  /** A task was picked (click or Enter) – null when it's let go */
  onSelect?: (task: FanoutTask | null) => void;
  /** The state every other cell steps back from. Controlled when defined (null: no filter) */
  filter?: FanoutStatus | null;
  /** The filter on mount when `filter` isn't controlled */
  defaultFilter?: FanoutStatus | null;
  /** Called with the new filter, controlled or not */
  onFilterChange?: (filter: FanoutStatus | null) => void;
  title?: string;
  /** A small mark before the title, e.g. the agent's logo */
  icon?: React.ReactNode;
};
export function FanoutGrid({ title = "Fan-out", icon, job, selected, defaultSelected = null, onSelectedChange, onSelect, filter, defaultFilter = null, onFilterChange, ...props }: FanoutGridProps) {
  const { stage, els } = useStaged(isNode(icon) ? [["icon", icon]] : []);
  const s = useControlled(selected, defaultSelected, onSelectedChange);
  const f = useControlled(filter, defaultFilter, onFilterChange);
  return h(React.Fragment, null, stage, h(RawFanoutGrid, {
    ...props,
    job: job ?? "",
    heading: title,
    icon: isNode(icon) ? els.icon : (icon as Element | undefined),
    selected: s.value,
    filter: f.value,
    onTcSelectedChange: (e: CustomEvent<FanoutSelectedChange>) => s.handler(e.detail.selected, e),
    onTcFilterChange: (e: CustomEvent<FanoutFilterChange>) => f.handler(e.detail.filter, e),
    onTcSelect: (e: CustomEvent<FanoutSelect>) => onSelect?.(e.detail.task),
  }));
}
