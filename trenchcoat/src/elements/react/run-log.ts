import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcRunLog, type RunLogExpandedChange, type RunLogFilter, type RunLogFilterChange, type RunLogOpen, type RunLogQueryChange, type RunLogRange, type RunLogRangeChange, type RunLogRun, type RunLogShowNew } from "../run-log";
import { h, useControlled } from "./internal";

export type { RunLogExpandedChange, RunLogFilter, RunLogFilterChange, RunLogLabels, RunLogOpen, RunLogQueryChange, RunLogRange, RunLogRangeChange, RunLogRun, RunLogShowNew, RunLogStatus } from "../run-log";
export { defaultRunLogLabels, filterRuns, runLogRanges, runLogStatuses } from "../run-log";

const RawRunLog = createComponent({
  tagName: "tc-run-log",
  elementClass: TcRunLog,
  react: React,
  events: {
    onTcFilterChange: "tc-filter-change" as EventName<CustomEvent<RunLogFilterChange>>,
    onTcQueryChange: "tc-query-change" as EventName<CustomEvent<RunLogQueryChange>>,
    onTcRangeChange: "tc-range-change" as EventName<CustomEvent<RunLogRangeChange>>,
    onTcExpandedChange: "tc-expanded-change" as EventName<CustomEvent<RunLogExpandedChange>>,
    onTcRunOpen: "tc-run-open" as EventName<CustomEvent<RunLogOpen>>,
    onTcShowNew: "tc-show-new" as EventName<CustomEvent<RunLogShowNew>>,
  },
});
type RawProps = React.ComponentProps<typeof RawRunLog>;
type Owned = "heading" | "filter" | "query" | "range" | "expanded" | "onTcFilterChange" | "onTcQueryChange" | "onTcRangeChange" | "onTcExpandedChange" | "onTcRunOpen" | "onTcShowNew" | "children";
export type RunLogProps = Omit<RawProps, Owned> & {
  /** The heading; "" leaves the header out */
  title?: string;
  /** The status, agent and trigger chips that are on – controlled when given */
  filter?: RunLogFilter;
  /** The chips on at first, when `filter` isn't controlled */
  defaultFilter?: RunLogFilter;
  /** A chip was toggled or the filters cleared */
  onFilterChange?: (filter: RunLogFilter) => void;
  /** The search text – controlled when given */
  query?: string;
  /** The search at first, when `query` isn't controlled */
  defaultQuery?: string;
  /** The search changed */
  onQueryChange?: (query: string) => void;
  /** How far back runs show – controlled when given */
  range?: RunLogRange;
  /** The range at first, when `range` isn't controlled */
  defaultRange?: RunLogRange;
  /** The range changed */
  onRangeChange?: (range: RunLogRange) => void;
  /** The failed runs whose error is open – controlled when given */
  expanded?: string[];
  /** The errors open at first, when `expanded` isn't controlled */
  defaultExpanded?: string[];
  /** A failed run's error was shown or hidden */
  onExpandedChange?: (expanded: string[]) => void;
  /** A run was opened */
  onRunOpen?: (id: string, run: RunLogRun) => void;
  /** Show new let the waiting runs in */
  onShowNew?: (ids: string[]) => void;
};

const NO_FILTER: RunLogFilter = { status: [], agents: [], triggers: [] };
const NONE: string[] = [];

export function RunLog({ title = "Runs", filter, defaultFilter = NO_FILTER, onFilterChange, query, defaultQuery = "", onQueryChange, range, defaultRange = "all", onRangeChange, expanded, defaultExpanded = NONE, onExpandedChange, onRunOpen, onShowNew, ...props }: RunLogProps) {
  const f = useControlled<RunLogFilter>(filter, defaultFilter, onFilterChange);
  const q = useControlled<string>(query, defaultQuery, onQueryChange);
  const r = useControlled<RunLogRange>(range, defaultRange, onRangeChange);
  const x = useControlled<string[]>(expanded, defaultExpanded, onExpandedChange);
  return h(RawRunLog, {
    ...props,
    heading: title,
    filter: f.value,
    query: q.value,
    range: r.value,
    expanded: x.value,
    onTcFilterChange: (e: CustomEvent<RunLogFilterChange>) => f.handler(e.detail.filter, e),
    onTcQueryChange: (e: CustomEvent<RunLogQueryChange>) => q.handler(e.detail.query, e),
    onTcRangeChange: (e: CustomEvent<RunLogRangeChange>) => r.handler(e.detail.range, e),
    onTcExpandedChange: (e: CustomEvent<RunLogExpandedChange>) => x.handler(e.detail.expanded, e),
    onTcRunOpen: (e: CustomEvent<RunLogOpen>) => onRunOpen?.(e.detail.id, e.detail.run),
    onTcShowNew: (e: CustomEvent<RunLogShowNew>) => onShowNew?.(e.detail.ids),
  });
}
