import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcElementInspector, type InspectorExpandedChange, type InspectorHighlight, type InspectorNode, type InspectorSelectedChange } from "../element-inspector";
import { h, useControlled } from "./internal";

export type { InspectorBox, InspectorDetails, InspectorEdges, InspectorExpandedChange, InspectorHighlight, InspectorLabels, InspectorNode, InspectorSelectedChange, InspectorStyle } from "../element-inspector";
export { defaultInspectorLabels } from "../element-inspector";

const RawElementInspector = createComponent({
  tagName: "tc-element-inspector",
  elementClass: TcElementInspector,
  react: React,
  events: {
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<InspectorSelectedChange>>,
    onTcExpandedChange: "tc-expanded-change" as EventName<CustomEvent<InspectorExpandedChange>>,
    onTcHighlight: "tc-highlight" as EventName<CustomEvent<InspectorHighlight>>,
  },
});
type RawProps = React.ComponentProps<typeof RawElementInspector>;
export type ElementInspectorProps = Omit<RawProps, "heading" | "selected" | "expanded" | "onTcSelectedChange" | "onTcExpandedChange" | "children"> & {
  /** The heading; "" leaves the header out */
  title?: string;
  /** The chosen element's id – controlled when given */
  selected?: string | null;
  /** The chosen element at first, when `selected` isn't controlled */
  defaultSelected?: string | null;
  /** Another element was chosen */
  onSelectedChange?: (selected: string | null, node: InspectorNode | null) => void;
  /** The open elements' ids – controlled when given */
  expanded?: string[];
  /** The elements open at first, when `expanded` isn't controlled */
  defaultExpanded?: string[];
  /** An element was opened or closed */
  onExpandedChange?: (expanded: string[]) => void;
};

export function ElementInspector({ title = "Elements", selected, defaultSelected = null, onSelectedChange, expanded, defaultExpanded = [], onExpandedChange, ...props }: ElementInspectorProps) {
  const last = React.useRef<InspectorNode | null>(null);
  const s = useControlled<string | null>(selected, defaultSelected, onSelectedChange ? (next) => onSelectedChange(next, last.current) : undefined);
  const e = useControlled<string[]>(expanded, defaultExpanded, onExpandedChange);
  return h(RawElementInspector, {
    ...props,
    heading: title,
    selected: s.value,
    expanded: e.value,
    onTcSelectedChange: (ev: CustomEvent<InspectorSelectedChange>) => {
      last.current = ev.detail.node;
      s.handler(ev.detail.selected, ev);
    },
    onTcExpandedChange: (ev: CustomEvent<InspectorExpandedChange>) => e.handler(ev.detail.expanded, ev),
  });
}
