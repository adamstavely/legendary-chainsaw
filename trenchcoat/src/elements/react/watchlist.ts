import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcWatchlist, type WatchAction, type WatchFilter, type WatchFilterChange, type WatchItem, type WatchOpen } from "../watchlist";
import { h, useControlled } from "./internal";

export type { WatchFilter, WatchItem, WatchRisk } from "../watchlist";
export { defaultWatchRiskLabels } from "../watchlist";

const RawWatchlist = createComponent({
  tagName: "tc-watchlist",
  elementClass: TcWatchlist,
  react: React,
  events: {
    onTcOpen: "tc-open" as EventName<CustomEvent<WatchOpen>>,
    onTcFilterChange: "tc-filter-change" as EventName<CustomEvent<WatchFilterChange>>,
    onTcAction: "tc-action" as EventName<CustomEvent<WatchAction>>,
  },
});
type RawProps = React.ComponentProps<typeof RawWatchlist>;
type Owned = "heading" | "filter" | "onTcOpen" | "onTcFilterChange" | "onTcAction" | "children";
export type WatchlistProps = Omit<RawProps, Owned> & {
  /** The heading, and the list's name */
  title?: string;
  /** The risk shown – controlled when given */
  filter?: WatchFilter;
  /** The risk shown on mount when `filter` isn't controlled */
  defaultFilter?: WatchFilter;
  /** A risk filter was chosen */
  onFilterChange?: (filter: WatchFilter) => void;
  /** A row was opened with Enter or a click */
  onOpen?: (id: string, item: WatchItem) => void;
  /** The View all action was used */
  onViewAll?: () => void;
};

export function Watchlist({ title, filter, defaultFilter = "all", onFilterChange, onOpen, onViewAll, ...props }: WatchlistProps) {
  const f = useControlled<WatchFilter>(filter, defaultFilter, onFilterChange);
  return h(RawWatchlist, {
    ...props,
    heading: title ?? "Watchlist",
    filter: f.value,
    onTcFilterChange: (e: CustomEvent<WatchFilterChange>) => f.handler(e.detail.filter, e),
    onTcOpen: (e: CustomEvent<WatchOpen>) => onOpen?.(e.detail.id, e.detail.item),
    onTcAction: () => onViewAll?.(),
  });
}
