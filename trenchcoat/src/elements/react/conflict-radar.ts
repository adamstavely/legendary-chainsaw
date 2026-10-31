import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcConflictRadar, type ConflictFile, type ConflictFilter, type ConflictFilterChange, type ConflictResolve, type ConflictSelectedChange } from "../conflict-radar";
import { h, useControlled } from "./internal";

export type { ConflictAgent, ConflictEdit, ConflictFile, ConflictFilter, ConflictFilterChange, ConflictRadarLabels, ConflictResolve, ConflictSelectedChange, ConflictStatus } from "../conflict-radar";
export { conflictStatus, defaultConflictRadarLabels } from "../conflict-radar";

const RawConflictRadar = createComponent({
  tagName: "tc-conflict-radar",
  elementClass: TcConflictRadar,
  react: React,
  events: {
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<ConflictSelectedChange>>,
    onTcFilterChange: "tc-filter-change" as EventName<CustomEvent<ConflictFilterChange>>,
    onTcResolve: "tc-resolve" as EventName<CustomEvent<ConflictResolve>>,
  },
});
type RawProps = React.ComponentProps<typeof RawConflictRadar>;
type Owned = "heading" | "selected" | "filter" | "onTcSelectedChange" | "onTcFilterChange" | "onTcResolve" | "children";
export type ConflictRadarProps = Omit<RawProps, Owned> & {
  /** The heading; by default "Conflict radar" */
  title?: string;
  /** The open file's path – controlled when given */
  selected?: string | null;
  /** The open file on mount when `selected` isn't controlled */
  defaultSelected?: string | null;
  /** A file was opened or closed */
  onSelectedChange?: (selected: string | null, file: ConflictFile | null) => void;
  /** "all" or "conflicts" – controlled when given */
  filter?: ConflictFilter;
  /** The filter on mount when `filter` isn't controlled */
  defaultFilter?: ConflictFilter;
  /** The filter changed */
  onFilterChange?: (filter: ConflictFilter) => void;
  /** Resolve was pressed */
  onResolve?: (file: ConflictFile) => void;
};

export function ConflictRadar({ title, selected, defaultSelected = null, onSelectedChange, filter, defaultFilter = "all", onFilterChange, onResolve, ...props }: ConflictRadarProps) {
  const s = useControlled<string | null>(selected, defaultSelected, undefined);
  const f = useControlled<ConflictFilter>(filter, defaultFilter, onFilterChange);
  return h(RawConflictRadar, {
    ...props,
    heading: title ?? "Conflict radar",
    selected: s.value,
    filter: f.value,
    onTcSelectedChange: (e: CustomEvent<ConflictSelectedChange>) => {
      s.handler(e.detail.selected, e);
      onSelectedChange?.(e.detail.selected, e.detail.file);
    },
    onTcFilterChange: (e: CustomEvent<ConflictFilterChange>) => f.handler(e.detail.filter, e),
    onTcResolve: (e: CustomEvent<ConflictResolve>) => onResolve?.(e.detail.file),
  });
}
