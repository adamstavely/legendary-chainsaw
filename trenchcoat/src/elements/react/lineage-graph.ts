import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcLineageGraph, type LineageNode, type LineageSelectedChange, type LineageView, type LineageViewChange } from "../lineage-graph";
import { h, useControlled } from "./internal";

export type { LineageColumn, LineageEdge, LineageField, LineageNode, LineageTone, LineageView } from "../lineage-graph";

const RawLineageGraph = createComponent({
  tagName: "tc-lineage-graph",
  elementClass: TcLineageGraph,
  react: React,
  events: {
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<LineageSelectedChange>>,
    onTcViewChange: "tc-view-change" as EventName<CustomEvent<LineageViewChange>>,
  },
});
type RawLineageGraphProps = React.ComponentProps<typeof RawLineageGraph>;
type Wrapped = "heading" | "selected" | "view" | "onTcSelectedChange" | "onTcViewChange";
export type LineageGraphProps = Omit<RawLineageGraphProps, Wrapped> & {
  /** The heading in the bar, and the graph's name */
  title?: string;
  /** The id of the node whose record is open. Controlled when defined (null = none); otherwise the component keeps
   *  it, starting at `defaultSelected` */
  selected?: string | null;
  /** The open record when uncontrolled */
  defaultSelected?: string | null;
  /** Called with the node whose record opened, or null when it closed */
  onSelectedChange?: (id: string | null, node?: LineageNode) => void;
  /** "graph" or "chain" (the event chain). Controlled when defined; otherwise the component keeps it */
  view?: LineageView;
  /** The first view when uncontrolled */
  defaultView?: LineageView;
  /** Called when the Graph or Event chain tab is picked */
  onViewChange?: (view: LineageView) => void;
};

export function LineageGraph({ title, selected, defaultSelected = null, onSelectedChange, view, defaultView = "graph", onViewChange, ...props }: LineageGraphProps) {
  const latest = React.useRef<LineageNode | undefined>(undefined);
  const report = React.useCallback((id: string | null) => onSelectedChange?.(id, latest.current), [onSelectedChange]);
  const pick = useControlled<string | null>(selected, defaultSelected, report);
  const shown = useControlled<LineageView>(view, defaultView, onViewChange);
  return h(RawLineageGraph, {
    ...props,
    heading: title ?? "Lineage",
    selected: pick.value,
    view: shown.value,
    onTcSelectedChange: (e: CustomEvent<LineageSelectedChange>) => {
      latest.current = e.detail.node;
      pick.handler(e.detail.selected, e);
    },
    onTcViewChange: (e: CustomEvent<LineageViewChange>) => shown.handler(e.detail.view, e),
  });
}
