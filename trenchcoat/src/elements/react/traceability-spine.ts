import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcTraceabilitySpine, type SpineAction, type SpineSelectedChange } from "../traceability-spine";
import { h, useControlled } from "./internal";

export type { SpineNode, SpineStage, SpineTone } from "../traceability-spine";
export { defaultSpineStages } from "../traceability-spine";

const RawTraceabilitySpine = createComponent({
  tagName: "tc-traceability-spine",
  elementClass: TcTraceabilitySpine,
  react: React,
  events: {
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<SpineSelectedChange>>,
    onTcAction: "tc-action" as EventName<CustomEvent<SpineAction>>,
  },
});
type RawProps = React.ComponentProps<typeof RawTraceabilitySpine>;
type Owned = "heading" | "selected" | "onTcSelectedChange" | "onTcAction" | "children";
export type TraceabilitySpineProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** The card whose path is traced – controlled when given (null for none) */
  selected?: string | null;
  /** The card traced on mount when `selected` isn't controlled */
  defaultSelected?: string | null;
  /** A card's path was traced or cleared; `path` is every id on it */
  onSelectedChange?: (selected: string | null, path: string[]) => void;
  /** "+N more" was pressed under a stage */
  onMore?: (stage: string) => void;
};

export function TraceabilitySpine({ title, selected, defaultSelected = null, onSelectedChange, onMore, ...props }: TraceabilitySpineProps) {
  const path = React.useRef<string[]>([]);
  const report = React.useCallback((next: string | null) => onSelectedChange?.(next, path.current), [onSelectedChange]);
  const s = useControlled<string | null>(selected, defaultSelected, onSelectedChange ? report : undefined);
  return h(RawTraceabilitySpine, {
    ...props,
    heading: title ?? "Traceability",
    selected: s.value,
    onTcSelectedChange: (e: CustomEvent<SpineSelectedChange>) => {
      path.current = e.detail.path;
      s.handler(e.detail.selected, e);
    },
    onTcAction: (e: CustomEvent<SpineAction>) => onMore?.(e.detail.stage),
  });
}
