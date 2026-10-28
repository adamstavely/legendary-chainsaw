import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcActivityClock, type ActivityHourRef, type ActivitySelectedChange } from "../activity-clock";
import { h, useControlled } from "./internal";

export type { ActivityDay, ActivityHourRef } from "../activity-clock";

const RawActivityClock = createComponent({
  tagName: "tc-activity-clock",
  elementClass: TcActivityClock,
  react: React,
  events: {
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<ActivitySelectedChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawActivityClock>;
type Owned = "heading" | "selected" | "onTcSelectedChange" | "children";
export type ActivityClockProps = Omit<RawProps, Owned> & {
  /** The heading, and the grid's name */
  title?: string;
  /** The selected hour – controlled when given (null for none) */
  selected?: ActivityHourRef | null;
  /** The hour selected on mount when `selected` isn't controlled */
  defaultSelected?: ActivityHourRef | null;
  /** An hour was selected or cleared; `value` is its value (null when it has no data) */
  onSelectedChange?: (selected: ActivityHourRef | null, value?: number | null) => void;
};

export function ActivityClock({ title, selected, defaultSelected = null, onSelectedChange, ...props }: ActivityClockProps) {
  const value = React.useRef<number | null | undefined>(undefined);
  const report = React.useCallback((next: ActivityHourRef | null) => onSelectedChange?.(next, value.current), [onSelectedChange]);
  const s = useControlled<ActivityHourRef | null>(selected, defaultSelected, onSelectedChange ? report : undefined);
  return h(RawActivityClock, {
    ...props,
    heading: title ?? "Activity",
    selected: s.value,
    onTcSelectedChange: (e: CustomEvent<ActivitySelectedChange>) => {
      value.current = e.detail.value;
      s.handler(e.detail.selected, e);
    },
  });
}
