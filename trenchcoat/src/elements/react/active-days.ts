import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcActiveDays, type ActiveDaysDateChange } from "../active-days";
import { h, useControlled } from "./internal";

export type { ActiveDaysDay } from "../active-days";

const RawActiveDays = createComponent({
  tagName: "tc-active-days",
  elementClass: TcActiveDays,
  react: React,
  events: {
    onTcDateChange: "tc-date-change" as EventName<CustomEvent<ActiveDaysDateChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawActiveDays>;
type Owned = "heading" | "date" | "onTcDateChange" | "children";
export type ActiveDaysProps = Omit<RawProps, Owned> & {
  /** The heading, and the grid's name */
  title?: string;
  /** The selected day, "YYYY-MM-DD" – controlled when given (null for none) */
  date?: string | null;
  /** The day selected on mount when `date` isn't controlled */
  defaultDate?: string | null;
  /** A day was selected or cleared; `value` is its value (null when it has no data) */
  onDateChange?: (date: string | null, value?: number | null) => void;
};

export function ActiveDays({ title, date, defaultDate = null, onDateChange, ...props }: ActiveDaysProps) {
  const value = React.useRef<number | null | undefined>(undefined);
  const report = React.useCallback((next: string | null) => onDateChange?.(next, value.current), [onDateChange]);
  const s = useControlled<string | null>(date, defaultDate, onDateChange ? report : undefined);
  return h(RawActiveDays, {
    ...props,
    heading: title ?? "Active days",
    date: s.value,
    onTcDateChange: (e: CustomEvent<ActiveDaysDateChange>) => {
      value.current = e.detail.value;
      s.handler(e.detail.date, e);
    },
  });
}
