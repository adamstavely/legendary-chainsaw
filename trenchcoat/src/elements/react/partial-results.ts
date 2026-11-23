import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcPartialResults, type PartialResultsCollapsedChange, type PartialResultsContinue, type PartialResultsExport, type PartialResultsRetry } from "../partial-results";
import { h, useControlled } from "./internal";

export type { PartialResultItem, PartialResultStatus, PartialResultsCollapsedChange, PartialResultsContinue, PartialResultsExport, PartialResultsLabels, PartialResultsRetry, PartialResultsVariant } from "../partial-results";
export { defaultPartialResultsLabels } from "../partial-results";

const RawPartialResults = createComponent({
  tagName: "tc-partial-results",
  elementClass: TcPartialResults,
  react: React,
  events: {
    onTcCollapsedChange: "tc-collapsed-change" as EventName<CustomEvent<PartialResultsCollapsedChange>>,
    onTcRetry: "tc-retry" as EventName<CustomEvent<PartialResultsRetry>>,
    onTcContinue: "tc-continue" as EventName<CustomEvent<PartialResultsContinue>>,
    onTcExport: "tc-export" as EventName<CustomEvent<PartialResultsExport>>,
  },
});
type RawProps = React.ComponentProps<typeof RawPartialResults>;
type Owned = "heading" | "collapsed" | "onTcCollapsedChange" | "children";
export type PartialResultsProps = Omit<RawProps, Owned> & {
  /** The heading; by default "Partial results" */
  title?: string;
  /** The reasons whose groups are closed – controlled when given */
  collapsed?: string[];
  /** The closed groups on mount when `collapsed` isn't controlled */
  defaultCollapsed?: string[];
  /** A group was opened or closed */
  onCollapsedChange?: (collapsed: string[]) => void;
};

const NONE: string[] = [];

export function PartialResults({ title, collapsed, defaultCollapsed = NONE, onCollapsedChange, ...props }: PartialResultsProps) {
  const s = useControlled<string[]>(collapsed, defaultCollapsed, onCollapsedChange);
  return h(RawPartialResults, {
    ...props,
    heading: title ?? "Partial results",
    collapsed: s.value,
    onTcCollapsedChange: (e: CustomEvent<PartialResultsCollapsedChange>) => s.handler(e.detail.collapsed, e),
  });
}
