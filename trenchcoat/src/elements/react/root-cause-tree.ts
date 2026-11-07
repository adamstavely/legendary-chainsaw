import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcRootCauseTree, type RootCauseFailure, type RootCauseHypothesis, type RootCauseSelectedChange } from "../root-cause-tree";
import { h, useControlled } from "./internal";

export type { RootCauseFailure, RootCauseGate, RootCauseHypothesis, RootCauseStatus } from "../root-cause-tree";
export { defaultRootCauseLabels } from "../root-cause-tree";

const RawRootCauseTree = createComponent({
  tagName: "tc-root-cause-tree",
  elementClass: TcRootCauseTree,
  react: React,
  events: { onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<RootCauseSelectedChange>> },
});
type RawProps = React.ComponentProps<typeof RawRootCauseTree>;
type Owned = "heading" | "selected" | "onTcSelectedChange" | "children";
export type RootCauseTreeProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** The node whose evidence is open – controlled when given (null for none) */
  selected?: string | null;
  /** The node open on mount when `selected` isn't controlled */
  defaultSelected?: string | null;
  /** A node was opened or closed, with the hypothesis (or the failure) it belongs to */
  onSelectedChange?: (selected: string | null, node: RootCauseHypothesis | RootCauseFailure | null) => void;
};

export function RootCauseTree({ title, selected, defaultSelected = null, onSelectedChange, ...props }: RootCauseTreeProps) {
  const node = React.useRef<RootCauseHypothesis | RootCauseFailure | null>(null);
  const report = React.useCallback((next: string | null) => onSelectedChange?.(next, node.current), [onSelectedChange]);
  const s = useControlled<string | null>(selected, defaultSelected, onSelectedChange ? report : undefined);
  return h(RawRootCauseTree, {
    ...props,
    heading: title ?? "Root cause",
    selected: s.value,
    onTcSelectedChange: (e: CustomEvent<RootCauseSelectedChange>) => {
      node.current = e.detail.node;
      s.handler(e.detail.selected, e);
    },
  });
}
