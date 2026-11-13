import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcAgentList, type AgentListFilterChange, type AgentListItem, type AgentListOpen, type AgentListQueryChange, type AgentListSort, type AgentListSortChange, type AgentListStatus } from "../agent-list";
import { h, useControlled } from "./internal";

export type { AgentListFilterChange, AgentListItem, AgentListLabels, AgentListOpen, AgentListQueryChange, AgentListRunStatus, AgentListSort, AgentListSortChange, AgentListStatus } from "../agent-list";
export { defaultAgentListLabels, needsAttention, sortAgents } from "../agent-list";

const RawAgentList = createComponent({
  tagName: "tc-agent-list",
  elementClass: TcAgentList,
  react: React,
  events: {
    onTcAgentOpen: "tc-agent-open" as EventName<CustomEvent<AgentListOpen>>,
    onTcSortChange: "tc-sort-change" as EventName<CustomEvent<AgentListSortChange>>,
    onTcFilterChange: "tc-filter-change" as EventName<CustomEvent<AgentListFilterChange>>,
    onTcQueryChange: "tc-query-change" as EventName<CustomEvent<AgentListQueryChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawAgentList>;
type Owned = "heading" | "sort" | "filter" | "query" | "onTcSortChange" | "onTcFilterChange" | "onTcQueryChange" | "onTcAgentOpen" | "children";
export type AgentListProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** The order – controlled when given */
  sort?: AgentListSort;
  /** The order on mount when `sort` isn't controlled */
  defaultSort?: AgentListSort;
  /** The order changed */
  onSortChange?: (sort: AgentListSort) => void;
  /** The statuses shown – controlled when given */
  filter?: AgentListStatus[];
  /** The statuses shown on mount when `filter` isn't controlled */
  defaultFilter?: AgentListStatus[];
  /** The status filter changed */
  onFilterChange?: (filter: AgentListStatus[]) => void;
  /** The search text – controlled when given */
  query?: string;
  /** The search text on mount when `query` isn't controlled */
  defaultQuery?: string;
  /** The search changed */
  onQueryChange?: (query: string) => void;
  /** A row was opened */
  onAgentOpen?: (id: string, agent: AgentListItem) => void;
};

const NO_FILTER: AgentListStatus[] = [];

export function AgentList({ title, sort, defaultSort = "name", onSortChange, filter, defaultFilter = NO_FILTER, onFilterChange, query, defaultQuery = "", onQueryChange, onAgentOpen, ...props }: AgentListProps) {
  const s = useControlled<AgentListSort>(sort, defaultSort, onSortChange);
  const f = useControlled<AgentListStatus[]>(filter, defaultFilter, onFilterChange);
  const q = useControlled<string>(query, defaultQuery, onQueryChange);
  return h(RawAgentList, {
    ...props,
    heading: title ?? "Agents",
    sort: s.value,
    filter: f.value,
    query: q.value,
    onTcSortChange: (e: CustomEvent<AgentListSortChange>) => s.handler(e.detail.sort, e),
    onTcFilterChange: (e: CustomEvent<AgentListFilterChange>) => f.handler(e.detail.filter, e),
    onTcQueryChange: (e: CustomEvent<AgentListQueryChange>) => q.handler(e.detail.query, e),
    onTcAgentOpen: (e: CustomEvent<AgentListOpen>) => onAgentOpen?.(e.detail.id, e.detail.agent),
  });
}
