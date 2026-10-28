import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcMultiCalendar,
  type MultiCalendarDateChange,
  type MultiCalendarEventCreate,
  type MultiCalendarEventDelete,
  type MultiCalendarEventUpdate,
  type MultiCalendarView,
  type MultiCalendarViewChange,
  type MultiCalendarVisibleChange,
} from "../multi-calendar";
import { h, useControlled } from "./internal";

export type {
  CalendarEvent,
  CalendarOwner,
  CalendarSource,
  MultiCalendarEventCreate,
  MultiCalendarEventDelete,
  MultiCalendarEventUpdate,
  MultiCalendarHours,
  MultiCalendarLabels,
  MultiCalendarView,
} from "../multi-calendar";
export { defaultMultiCalendarLabels } from "../multi-calendar";

const RawMultiCalendar = createComponent({
  tagName: "tc-multi-calendar",
  elementClass: TcMultiCalendar,
  react: React,
  events: {
    onTcEventCreate: "tc-event-create" as EventName<CustomEvent<MultiCalendarEventCreate>>,
    onTcEventUpdate: "tc-event-update" as EventName<CustomEvent<MultiCalendarEventUpdate>>,
    onTcEventDelete: "tc-event-delete" as EventName<CustomEvent<MultiCalendarEventDelete>>,
    onTcViewChange: "tc-view-change" as EventName<CustomEvent<MultiCalendarViewChange>>,
    onTcDateChange: "tc-date-change" as EventName<CustomEvent<MultiCalendarDateChange>>,
    onTcVisibleChange: "tc-visible-change" as EventName<CustomEvent<MultiCalendarVisibleChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawMultiCalendar>;
type Owned =
  | "heading"
  | "view"
  | "date"
  | "visible"
  | "onTcEventCreate"
  | "onTcEventUpdate"
  | "onTcEventDelete"
  | "onTcViewChange"
  | "onTcDateChange"
  | "onTcVisibleChange"
  | "children";
export type MultiCalendarProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** The view – controlled when given */
  view?: MultiCalendarView;
  /** The view on mount when `view` isn't controlled */
  defaultView?: MultiCalendarView;
  /** The view was switched */
  onViewChange?: (view: MultiCalendarView) => void;
  /** The day in focus, epoch ms – controlled when given */
  date?: number;
  /** The day in focus on mount when `date` isn't controlled; by default today */
  defaultDate?: number;
  /** The day in focus moved (its midnight, epoch ms) */
  onDateChange?: (date: number) => void;
  /** The ids of the calendars shown – controlled when given */
  visible?: string[];
  /** The calendars shown on mount when `visible` isn't controlled; by default each calendar's own `visible` */
  defaultVisible?: string[];
  /** Calendars were shown or hidden */
  onVisibleChange?: (visible: string[]) => void;
  /** An event was created. Return false (or call preventDefault on the event) to keep it out – then add it yourself
   *  when the account confirms. With `events` controlled, update them here */
  onEventCreate?: (detail: MultiCalendarEventCreate, event: CustomEvent<MultiCalendarEventCreate>) => void | boolean;
  /** An event was edited, moved or resized; return false to keep it as it was */
  onEventUpdate?: (detail: MultiCalendarEventUpdate, event: CustomEvent<MultiCalendarEventUpdate>) => void | boolean;
  /** An event was deleted; return false to keep it */
  onEventDelete?: (detail: MultiCalendarEventDelete, event: CustomEvent<MultiCalendarEventDelete>) => void | boolean;
};

export function MultiCalendar({
  title,
  view,
  defaultView = "week",
  onViewChange,
  date,
  defaultDate,
  onDateChange,
  visible,
  defaultVisible,
  onVisibleChange,
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  ...props
}: MultiCalendarProps) {
  const v = useControlled<MultiCalendarView>(view, defaultView, onViewChange);
  const d = useControlled<number | undefined>(date, defaultDate, onDateChange as ((next: number | undefined) => void) | undefined);
  const s = useControlled<string[] | undefined>(visible, defaultVisible, onVisibleChange as ((next: string[] | undefined) => void) | undefined);
  const relay =
    <T,>(fn: ((detail: T, event: CustomEvent<T>) => void | boolean) | undefined) =>
    (e: CustomEvent<T>) => {
      if (fn?.(e.detail, e) === false) e.preventDefault();
    };
  return h(RawMultiCalendar, {
    ...props,
    heading: title ?? "Calendars",
    view: v.value,
    date: d.value,
    visible: s.value,
    onTcViewChange: (e: CustomEvent<MultiCalendarViewChange>) => v.handler(e.detail.view, e),
    onTcDateChange: (e: CustomEvent<MultiCalendarDateChange>) => d.handler(e.detail.date, e),
    onTcVisibleChange: (e: CustomEvent<MultiCalendarVisibleChange>) => s.handler(e.detail.visible, e),
    onTcEventCreate: relay(onEventCreate),
    onTcEventUpdate: relay(onEventUpdate),
    onTcEventDelete: relay(onEventDelete),
  });
}
