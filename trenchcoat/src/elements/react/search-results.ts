import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcSearchResults,
  type SearchResultsAction,
  type SearchResultsExpandedChange,
  type SearchResultsMatch,
  type SearchResultsOpen,
  type SearchResultsOptions,
  type SearchResultsOptionsChange,
  type SearchResultsReplace,
  type SearchResultsSearch,
  type SearchResultsSelectedChange,
  type SearchResultsSelection,
} from "../search-results";
import { h, useControlled } from "./internal";

export type {
  SearchResultsAction,
  SearchResultsActionItem,
  SearchResultsExpandedChange,
  SearchResultsFile,
  SearchResultsLabels,
  SearchResultsMatch,
  SearchResultsOpen,
  SearchResultsOptions,
  SearchResultsOptionsChange,
  SearchResultsReplace,
  SearchResultsSearch,
  SearchResultsSelectedChange,
  SearchResultsSelection,
  SearchResultsStatus,
} from "../search-results";
export { defaultSearchResultsLabels, searchResultsPattern } from "../search-results";

const RawSearchResults = createComponent({
  tagName: "tc-search-results",
  elementClass: TcSearchResults,
  react: React,
  events: {
    onTcSearch: "tc-search" as EventName<CustomEvent<SearchResultsSearch>>,
    onTcOptionsChange: "tc-options-change" as EventName<CustomEvent<SearchResultsOptionsChange>>,
    onTcExpandedChange: "tc-expanded-change" as EventName<CustomEvent<SearchResultsExpandedChange>>,
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<SearchResultsSelectedChange>>,
    onTcOpen: "tc-open" as EventName<CustomEvent<SearchResultsOpen>>,
    onTcReplace: "tc-replace" as EventName<CustomEvent<SearchResultsReplace>>,
    onTcAction: "tc-action" as EventName<CustomEvent<SearchResultsAction>>,
  },
});
type RawProps = React.ComponentProps<typeof RawSearchResults>;
type Owned = "heading" | "selected" | "expanded" | "options" | "onTcSelectedChange" | "onTcExpandedChange" | "onTcOptionsChange" | "children";
const NO_OPTIONS: SearchResultsOptions = { caseSensitive: false, wholeWord: false, regex: false };
export type SearchResultsProps = Omit<RawProps, Owned> & {
  /** The heading; "" leaves the header out */
  title?: string;
  /** The chosen match – controlled when given */
  selected?: SearchResultsSelection | null;
  /** The chosen match at first, when `selected` isn't controlled */
  defaultSelected?: SearchResultsSelection | null;
  /** Another match was chosen */
  onSelectedChange?: (selected: SearchResultsSelection | null, match?: SearchResultsMatch) => void;
  /** The open files' paths, null for all – controlled when given */
  expanded?: string[] | null;
  /** The open files at first, when `expanded` isn't controlled (null: all) */
  defaultExpanded?: string[] | null;
  /** A file was opened or closed */
  onExpandedChange?: (expanded: string[] | null) => void;
  /** Match case, whole word and regular expression – controlled when given */
  options?: SearchResultsOptions;
  /** The toggles at first, when `options` isn't controlled */
  defaultOptions?: SearchResultsOptions;
  /** A toggle changed */
  onOptionsChange?: (options: SearchResultsOptions) => void;
};

export function SearchResults({ title = "Search", selected, defaultSelected = null, onSelectedChange, expanded, defaultExpanded = null, onExpandedChange, options, defaultOptions = NO_OPTIONS, onOptionsChange, ...props }: SearchResultsProps) {
  const s = useControlled<SearchResultsSelection | null>(selected, defaultSelected, undefined);
  const e = useControlled<string[] | null>(expanded, defaultExpanded, onExpandedChange);
  const o = useControlled<SearchResultsOptions>(options, defaultOptions, onOptionsChange);
  return h(RawSearchResults, {
    ...props,
    heading: title,
    selected: s.value,
    expanded: e.value,
    options: o.value,
    onTcSelectedChange: (ev: CustomEvent<SearchResultsSelectedChange>) => {
      s.handler(ev.detail.selected, ev);
      onSelectedChange?.(ev.detail.selected, ev.detail.match);
    },
    onTcExpandedChange: (ev: CustomEvent<SearchResultsExpandedChange>) => e.handler(ev.detail.expanded, ev),
    onTcOptionsChange: (ev: CustomEvent<SearchResultsOptionsChange>) => o.handler(ev.detail.options, ev),
  });
}
