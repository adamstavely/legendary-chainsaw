import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcResultsList, type ResultsMore, type ResultsOpen, type ResultsSelectedChange, type ResultsSort, type ResultsSortChange, type ResultsSuggestion, type SearchResult } from "../results-list";
import { h, useControlled } from "./internal";

export type { ResultsGroup, ResultsMore, ResultsSort, SearchResult } from "../results-list";

const RawResultsList = createComponent({
  tagName: "tc-results-list",
  elementClass: TcResultsList,
  react: React,
  events: {
    onTcOpen: "tc-open" as EventName<CustomEvent<ResultsOpen>>,
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<ResultsSelectedChange>>,
    onTcSortChange: "tc-sort-change" as EventName<CustomEvent<ResultsSortChange>>,
    onTcSuggestion: "tc-suggestion" as EventName<CustomEvent<ResultsSuggestion>>,
    onTcMore: "tc-more" as EventName<CustomEvent<ResultsMore>>,
  },
});
type RawProps = React.ComponentProps<typeof RawResultsList>;
type Owned = "heading" | "sort" | "selected" | "onTcOpen" | "onTcSelectedChange" | "onTcSortChange" | "onTcSuggestion" | "onTcMore" | "children";
export type ResultsListProps = Omit<RawProps, Owned> & {
  /** The heading, and the list's name */
  title?: string;
  /** The order – controlled when given */
  sort?: ResultsSort;
  /** The order on mount when `sort` isn't controlled */
  defaultSort?: ResultsSort;
  /** The order changed */
  onSortChange?: (sort: ResultsSort) => void;
  /** The result in focus – controlled when given */
  selected?: string | null;
  /** The result in focus on mount when `selected` isn't controlled */
  defaultSelected?: string | null;
  /** The result in focus changed */
  onSelectedChange?: (selected: string | null, result?: SearchResult) => void;
  /** A result was opened; `event.preventDefault()` stops a link from following */
  onOpenResult?: (result: SearchResult, event: CustomEvent<ResultsOpen>) => void;
  /** "Did you mean" was pressed */
  onSuggestion?: (suggestion: string) => void;
  /** Show more was pressed; `event.preventDefault()` when you add the next results yourself */
  onMore?: (detail: ResultsMore, event: CustomEvent<ResultsMore>) => void;
};

export function ResultsList({ title, sort, defaultSort = "relevance", onSortChange, selected, defaultSelected = null, onSelectedChange, onOpenResult, onSuggestion, onMore, ...props }: ResultsListProps) {
  const s = useControlled<ResultsSort>(sort, defaultSort, onSortChange);
  const sel = useControlled<string | null>(selected, defaultSelected, undefined);
  return h(RawResultsList, {
    ...props,
    heading: title ?? "Results",
    sort: s.value,
    selected: sel.value,
    onTcSortChange: (e: CustomEvent<ResultsSortChange>) => s.handler(e.detail.sort, e),
    onTcSelectedChange: (e: CustomEvent<ResultsSelectedChange>) => {
      onSelectedChange?.(e.detail.selected, e.detail.result);
      sel.handler(e.detail.selected, e);
    },
    onTcOpen: (e: CustomEvent<ResultsOpen>) => onOpenResult?.(e.detail.result, e),
    onTcSuggestion: (e: CustomEvent<ResultsSuggestion>) => onSuggestion?.(e.detail.suggestion),
    onTcMore: (e: CustomEvent<ResultsMore>) => onMore?.(e.detail, e),
  });
}
