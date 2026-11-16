import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcRunInspector, type RunInspectorSelectedChange } from "../run-inspector";
import type { TraceSpan } from "../trace-waterfall";
import { h, useControlled } from "./internal";

export type { InspectorSpan, RunInspectorLabels, RunInspectorSelectedChange } from "../run-inspector";
export { defaultRunInspectorLabels, runNumbers } from "../run-inspector";

const RawRunInspector = createComponent({
  tagName: "tc-run-inspector",
  elementClass: TcRunInspector,
  react: React,
  events: {
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<RunInspectorSelectedChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawRunInspector>;
type Owned = "heading" | "selected" | "onTcSelectedChange" | "children";
export type RunInspectorProps = Omit<RawProps, Owned> & {
  /** The heading (default "Run inspector") */
  title?: string;
  /** Id of the open call, or null. Controlled when defined */
  selected?: string | null;
  /** The open call at first when uncontrolled */
  defaultSelected?: string | null;
  /** Called with the call that opened (or null when it closed) */
  onSelectedChange?: (selected: string | null, span: TraceSpan | null) => void;
};

export function RunInspector({ title, selected, defaultSelected = null, onSelectedChange, ...props }: RunInspectorProps) {
  const span = React.useRef<TraceSpan | null>(null);
  const s = useControlled(selected, defaultSelected, onSelectedChange ? (next) => onSelectedChange(next, span.current) : undefined);
  return h(RawRunInspector, {
    ...props,
    heading: title ?? "Run inspector",
    selected: s.value,
    onTcSelectedChange: (e: CustomEvent<RunInspectorSelectedChange>) => {
      span.current = e.detail.span;
      s.handler(e.detail.selected, e);
    },
  });
}
