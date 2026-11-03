import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcProblemList,
  type ProblemExpandedChange,
  type ProblemFilter,
  type ProblemFilterChange,
  type ProblemFix,
  type ProblemItem,
  type ProblemListAction,
  type ProblemOpen,
  type ProblemQueryChange,
  type ProblemSelectedChange,
} from "../problem-list";
import { h, useControlled } from "./internal";

export type {
  ProblemExpandedChange,
  ProblemFilter,
  ProblemFilterChange,
  ProblemFix,
  ProblemItem,
  ProblemListAction,
  ProblemListActionItem,
  ProblemListLabels,
  ProblemListStatus,
  ProblemOpen,
  ProblemQueryChange,
  ProblemSelectedChange,
  ProblemSeverity,
} from "../problem-list";
export { defaultProblemListLabels, problemKey } from "../problem-list";

const RawProblemList = createComponent({
  tagName: "tc-problem-list",
  elementClass: TcProblemList,
  react: React,
  events: {
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<ProblemSelectedChange>>,
    onTcFilterChange: "tc-filter-change" as EventName<CustomEvent<ProblemFilterChange>>,
    onTcQueryChange: "tc-query-change" as EventName<CustomEvent<ProblemQueryChange>>,
    onTcExpandedChange: "tc-expanded-change" as EventName<CustomEvent<ProblemExpandedChange>>,
    onTcOpen: "tc-open" as EventName<CustomEvent<ProblemOpen>>,
    onTcFix: "tc-fix" as EventName<CustomEvent<ProblemFix>>,
    onTcAction: "tc-action" as EventName<CustomEvent<ProblemListAction>>,
  },
});
type RawProps = React.ComponentProps<typeof RawProblemList>;
type Owned = "heading" | "selected" | "filter" | "query" | "expanded" | "onTcSelectedChange" | "onTcFilterChange" | "onTcQueryChange" | "onTcExpandedChange" | "children";
export type ProblemListProps = Omit<RawProps, Owned> & {
  /** The heading; "" leaves the header out */
  title?: string;
  /** The chosen problem's key – controlled when given */
  selected?: string | null;
  /** The chosen problem at first, when `selected` isn't controlled */
  defaultSelected?: string | null;
  /** Another problem was chosen */
  onSelectedChange?: (selected: string | null, problem?: ProblemItem) => void;
  /** Which severities show – controlled when given */
  filter?: ProblemFilter;
  /** The severity filter at first, when `filter` isn't controlled */
  defaultFilter?: ProblemFilter;
  /** The severity filter changed */
  onFilterChange?: (filter: ProblemFilter) => void;
  /** The text filter – controlled when given */
  query?: string;
  /** The text filter at first, when `query` isn't controlled */
  defaultQuery?: string;
  /** The text filter changed */
  onQueryChange?: (query: string) => void;
  /** The open files' paths, null for all – controlled when given */
  expanded?: string[] | null;
  /** The open files at first, when `expanded` isn't controlled (null: all) */
  defaultExpanded?: string[] | null;
  /** A file was opened or closed */
  onExpandedChange?: (expanded: string[] | null) => void;
};

export function ProblemList({ title = "Problems", selected, defaultSelected = null, onSelectedChange, filter, defaultFilter = "all", onFilterChange, query, defaultQuery = "", onQueryChange, expanded, defaultExpanded = null, onExpandedChange, ...props }: ProblemListProps) {
  const s = useControlled<string | null>(selected, defaultSelected, undefined);
  const f = useControlled<ProblemFilter>(filter, defaultFilter, onFilterChange);
  const q = useControlled<string>(query, defaultQuery, onQueryChange);
  const e = useControlled<string[] | null>(expanded, defaultExpanded, onExpandedChange);
  return h(RawProblemList, {
    ...props,
    heading: title,
    selected: s.value,
    filter: f.value,
    query: q.value,
    expanded: e.value,
    onTcSelectedChange: (ev: CustomEvent<ProblemSelectedChange>) => {
      s.handler(ev.detail.selected, ev);
      onSelectedChange?.(ev.detail.selected, ev.detail.problem);
    },
    onTcFilterChange: (ev: CustomEvent<ProblemFilterChange>) => f.handler(ev.detail.filter, ev),
    onTcQueryChange: (ev: CustomEvent<ProblemQueryChange>) => q.handler(ev.detail.query, ev),
    onTcExpandedChange: (ev: CustomEvent<ProblemExpandedChange>) => e.handler(ev.detail.expanded, ev),
  });
}
