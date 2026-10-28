import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcActivityCalendar, type ActivityCalendarSelectedChange } from "../activity-calendar";
import { h, useControlled } from "./internal";

export type { ActivityCalendarDay } from "../activity-calendar";

const RawActivityCalendar = createComponent({
  tagName: "tc-activity-calendar",
  elementClass: TcActivityCalendar,
  react: React,
  events: {
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<ActivityCalendarSelectedChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawActivityCalendar>;
type Owned = "heading" | "selected" | "onTcSelectedChange" | "children";
export type ActivityCalendarProps = Omit<RawProps, Owned> & {
  /** The heading, and the grid's name */
  title?: string;
  /** The selected day as epoch ms of its local midnight – controlled when given (null for none) */
  selected?: number | null;
  /** The day selected on mount when `selected` isn't controlled */
  defaultSelected?: number | null;
  /** A day was selected or cleared; `value` is its value (null when it has no data) */
  onSelectedChange?: (selected: number | null, value?: number | null) => void;
};

export function ActivityCalendar({ title, selected, defaultSelected = null, onSelectedChange, ...props }: ActivityCalendarProps) {
  const value = React.useRef<number | null | undefined>(undefined);
  const report = React.useCallback((next: number | null) => onSelectedChange?.(next, value.current), [onSelectedChange]);
  const s = useControlled<number | null>(selected, defaultSelected, onSelectedChange ? report : undefined);
  return h(RawActivityCalendar, {
    ...props,
    heading: title ?? "Activity",
    selected: s.value,
    onTcSelectedChange: (e: CustomEvent<ActivityCalendarSelectedChange>) => {
      value.current = e.detail.value;
      s.handler(e.detail.selected, e);
    },
  });
}
