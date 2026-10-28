import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcSearchHistory,
  type SearchHistoryEntry,
  type SearchHistoryRemove,
  type SearchHistorySavedChange,
  type SearchHistorySelect,
  type SearchHistoryTab,
  type SearchHistoryTabChange,
} from "../search-history";
import { h, useControlled } from "./internal";

export type { SearchHistoryEntry, SearchHistoryTab } from "../search-history";

const RawSearchHistory = createComponent({
  tagName: "tc-search-history",
  elementClass: TcSearchHistory,
  react: React,
  events: {
    onTcSelect: "tc-select" as EventName<CustomEvent<SearchHistorySelect>>,
    onTcSavedChange: "tc-saved-change" as EventName<CustomEvent<SearchHistorySavedChange>>,
    onTcRemove: "tc-remove" as EventName<CustomEvent<SearchHistoryRemove>>,
    onTcRestore: "tc-restore" as EventName<CustomEvent<SearchHistoryRemove>>,
    onTcTabChange: "tc-tab-change" as EventName<CustomEvent<SearchHistoryTabChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawSearchHistory>;
type Owned = "heading" | "searches" | "tab" | "onTcSelect" | "onTcSavedChange" | "onTcRemove" | "onTcRestore" | "onTcTabChange" | "children";
export type SearchHistoryProps = Omit<RawProps, Owned> & {
  /** The heading, and the list's name */
  title?: string;
  /** The searches – controlled when given: saving, removing and Undo report the next list through onSearchesChange */
  searches?: SearchHistoryEntry[];
  /** The searches on mount when `searches` isn't controlled */
  defaultSearches?: SearchHistoryEntry[];
  /** A search was saved, unsaved, removed or put back; `next` is the list as it will be */
  onSearchesChange?: (next: SearchHistoryEntry[]) => void;
  /** The tab shown – controlled when given */
  tab?: SearchHistoryTab;
  /** The tab on mount when `tab` isn't controlled */
  defaultTab?: SearchHistoryTab;
  /** The tab changed */
  onTabChange?: (tab: SearchHistoryTab) => void;
  /** A search was picked to run again */
  onRunAgain?: (search: SearchHistoryEntry) => void;
};

const NONE: SearchHistoryEntry[] = [];

export function SearchHistory({ title, searches, defaultSearches = NONE, onSearchesChange, tab, defaultTab = "recent", onTabChange, onRunAgain, ...props }: SearchHistoryProps) {
  const list = useControlled<SearchHistoryEntry[]>(searches, defaultSearches, onSearchesChange);
  const t = useControlled<SearchHistoryTab>(tab, defaultTab, onTabChange);
  return h(RawSearchHistory, {
    ...props,
    heading: title ?? "Search history",
    searches: list.value,
    tab: t.value,
    onTcSavedChange: (e: CustomEvent<SearchHistorySavedChange>) => list.handler(e.detail.searches, e),
    onTcRemove: (e: CustomEvent<SearchHistoryRemove>) => list.handler(e.detail.searches, e),
    onTcRestore: (e: CustomEvent<SearchHistoryRemove>) => list.handler(e.detail.searches, e),
    onTcTabChange: (e: CustomEvent<SearchHistoryTabChange>) => t.handler(e.detail.tab, e),
    onTcSelect: (e: CustomEvent<SearchHistorySelect>) => onRunAgain?.(e.detail.search),
  });
}
