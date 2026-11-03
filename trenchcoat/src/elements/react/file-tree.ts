import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcFileTree, type FileTreeAction, type FileTreeExpandedChange, type FileTreeLoad, type FileTreeNode, type FileTreeOpen, type FileTreeQueryChange, type FileTreeSearch, type FileTreeSelectedChange } from "../file-tree";
import { h, useControlled } from "./internal";

export type { FileTreeAction, FileTreeActionItem, FileTreeExpandedChange, FileTreeLabels, FileTreeLoad, FileTreeNode, FileTreeOpen, FileTreeQueryChange, FileTreeSearch, FileTreeSelectedChange, FileTreeStatus } from "../file-tree";
export { defaultFileTreeLabels, fileTreeFromPaths } from "../file-tree";

const RawFileTree = createComponent({
  tagName: "tc-file-tree",
  elementClass: TcFileTree,
  react: React,
  events: {
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<FileTreeSelectedChange>>,
    onTcExpandedChange: "tc-expanded-change" as EventName<CustomEvent<FileTreeExpandedChange>>,
    onTcQueryChange: "tc-query-change" as EventName<CustomEvent<FileTreeQueryChange>>,
    onTcOpen: "tc-open" as EventName<CustomEvent<FileTreeOpen>>,
    onTcLoad: "tc-load" as EventName<CustomEvent<FileTreeLoad>>,
    onTcSearch: "tc-search" as EventName<CustomEvent<FileTreeSearch>>,
    onTcAction: "tc-action" as EventName<CustomEvent<FileTreeAction>>,
  },
});
type RawProps = React.ComponentProps<typeof RawFileTree>;
type Owned = "heading" | "selected" | "expanded" | "query" | "onTcSelectedChange" | "onTcExpandedChange" | "onTcQueryChange" | "children";
export type FileTreeProps = Omit<RawProps, Owned> & {
  /** The heading; "" leaves the header out */
  title?: string;
  /** The chosen file's path – controlled when given */
  selected?: string | null;
  /** The chosen file at first, when `selected` isn't controlled */
  defaultSelected?: string | null;
  /** Another file was chosen */
  onSelectedChange?: (selected: string | null, node?: FileTreeNode) => void;
  /** The open folders' paths – controlled when given */
  expanded?: string[];
  /** The folders open at first, when `expanded` isn't controlled */
  defaultExpanded?: string[];
  /** A folder opened or closed */
  onExpandedChange?: (expanded: string[]) => void;
  /** The filter's text – controlled when given */
  query?: string;
  /** The filter's text at first, when `query` isn't controlled */
  defaultQuery?: string;
  /** The filter's text changed */
  onQueryChange?: (query: string) => void;
};

export function FileTree({ title = "Files", selected, defaultSelected = null, onSelectedChange, expanded, defaultExpanded = [], onExpandedChange, query, defaultQuery = "", onQueryChange, ...props }: FileTreeProps) {
  const s = useControlled<string | null>(selected, defaultSelected, onSelectedChange);
  const e = useControlled<string[]>(expanded, defaultExpanded, onExpandedChange);
  const q = useControlled<string>(query, defaultQuery, onQueryChange);
  return h(RawFileTree, {
    ...props,
    heading: title,
    selected: s.value,
    expanded: e.value,
    query: q.value,
    onTcSelectedChange: (ev: CustomEvent<FileTreeSelectedChange>) => s.handler(ev.detail.selected, ev),
    onTcExpandedChange: (ev: CustomEvent<FileTreeExpandedChange>) => e.handler(ev.detail.expanded, ev),
    onTcQueryChange: (ev: CustomEvent<FileTreeQueryChange>) => q.handler(ev.detail.query, ev),
  });
}
