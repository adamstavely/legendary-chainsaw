import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcPriorityList, type PriorityFilter, type PriorityFilterChange, type PriorityItem, type PriorityOpen } from "../priority-list";
import { h, useControlled } from "./internal";

export type { PriorityFilter, PriorityHealth, PriorityItem } from "../priority-list";
export { defaultPriorityHealthLabels, defaultPriorityTiers } from "../priority-list";

const RawPriorityList = createComponent({
  tagName: "tc-priority-list",
  elementClass: TcPriorityList,
  react: React,
  events: {
    onTcOpen: "tc-open" as EventName<CustomEvent<PriorityOpen>>,
    onTcFilterChange: "tc-filter-change" as EventName<CustomEvent<PriorityFilterChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawPriorityList>;
type Owned = "heading" | "filter" | "onTcOpen" | "onTcFilterChange" | "children";
export type PriorityListProps = Omit<RawProps, Owned> & {
  /** The heading, and the list's name */
  title?: string;
  /** The health shown – controlled when given */
  filter?: PriorityFilter;
  /** The health shown on mount when `filter` isn't controlled */
  defaultFilter?: PriorityFilter;
  /** A health filter was chosen or cleared */
  onFilterChange?: (filter: PriorityFilter) => void;
  /** A row was opened with Enter or a click */
  onOpen?: (id: string, item: PriorityItem) => void;
};

export function PriorityList({ title, filter, defaultFilter = "all", onFilterChange, onOpen, ...props }: PriorityListProps) {
  const f = useControlled<PriorityFilter>(filter, defaultFilter, onFilterChange);
  return h(RawPriorityList, {
    ...props,
    heading: title ?? "Priorities",
    filter: f.value,
    onTcFilterChange: (e: CustomEvent<PriorityFilterChange>) => f.handler(e.detail.filter, e),
    onTcOpen: (e: CustomEvent<PriorityOpen>) => onOpen?.(e.detail.id, e.detail.item),
  });
}
