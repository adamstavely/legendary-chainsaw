import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcStatusTracker, type StatusTrackerSelectedChange, type StatusTrackerStep } from "../status-tracker";
import { h, useControlled } from "./internal";

export type { StatusTone, StatusTrackerItem, StatusTrackerStatus, StatusTrackerStep } from "../status-tracker";
export { defaultTrackerStatuses } from "../status-tracker";

const RawStatusTracker = createComponent({
  tagName: "tc-status-tracker",
  elementClass: TcStatusTracker,
  react: React,
  events: {
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<StatusTrackerSelectedChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawStatusTracker>;
type Owned = "heading" | "selected" | "onTcSelectedChange" | "children";
export type StatusTrackerProps = Omit<RawProps, Owned> & {
  /** The heading, and the list's name */
  title?: string;
  /** The step whose record is open – controlled when given (null for none) */
  selected?: string | null;
  /** The step open on mount when `selected` isn't controlled */
  defaultSelected?: string | null;
  /** A step's record opened or closed; `step` is the opened step */
  onSelectedChange?: (selected: string | null, step?: StatusTrackerStep) => void;
};

export function StatusTracker({ title, selected, defaultSelected = null, onSelectedChange, ...props }: StatusTrackerProps) {
  const step = React.useRef<StatusTrackerStep | undefined>(undefined);
  const report = React.useCallback((next: string | null) => onSelectedChange?.(next, step.current), [onSelectedChange]);
  const s = useControlled<string | null>(selected, defaultSelected, onSelectedChange ? report : undefined);
  return h(RawStatusTracker, {
    ...props,
    heading: title ?? "Status",
    selected: s.value,
    onTcSelectedChange: (e: CustomEvent<StatusTrackerSelectedChange>) => {
      step.current = e.detail.step;
      s.handler(e.detail.selected, e);
    },
  });
}
