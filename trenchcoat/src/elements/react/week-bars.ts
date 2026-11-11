import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcWeekBars, type WeekBarsView, type WeekBarsViewChange, type WeekBarsWeekChange } from "../week-bars";
import { h, useControlled } from "./internal";

export type { WeekBarsDay, WeekBarsLabels, WeekBarsView, WeekBarsViewChange, WeekBarsWeek, WeekBarsWeekChange } from "../week-bars";
export { defaultWeekBarsLabels } from "../week-bars";

const RawWeekBars = createComponent({
  tagName: "tc-week-bars",
  elementClass: TcWeekBars,
  react: React,
  events: {
    onTcWeekChange: "tc-week-change" as EventName<CustomEvent<WeekBarsWeekChange>>,
    onTcViewChange: "tc-view-change" as EventName<CustomEvent<WeekBarsViewChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawWeekBars>;
type Owned = "heading" | "week" | "view" | "onTcWeekChange" | "onTcViewChange" | "children";
export type WeekBarsProps = Omit<RawProps, Owned> & {
  /** The heading, and the plot's name */
  title?: string;
  /** The shown week's index – controlled when given */
  week?: number;
  /** The week on mount when `week` isn't controlled – by default the last */
  defaultWeek?: number;
  /** The switcher or PageUp/PageDown moved to another week */
  onWeekChange?: (week: number) => void;
  /** The bars or the table – controlled when given */
  view?: WeekBarsView;
  /** The view on mount when `view` isn't controlled */
  defaultView?: WeekBarsView;
  /** The Table button was pressed */
  onViewChange?: (view: WeekBarsView) => void;
};

export function WeekBars({ title, week, defaultWeek, onWeekChange, view, defaultView = "chart", onViewChange, ...props }: WeekBarsProps) {
  const w = useControlled<number | undefined>(week, defaultWeek, onWeekChange as ((next: number | undefined) => void) | undefined);
  const v = useControlled<WeekBarsView>(view, defaultView, onViewChange);
  return h(RawWeekBars, {
    ...props,
    heading: title ?? "Daily totals",
    week: w.value,
    view: v.value,
    onTcWeekChange: (e: CustomEvent<WeekBarsWeekChange>) => w.handler(e.detail.week, e),
    onTcViewChange: (e: CustomEvent<WeekBarsViewChange>) => v.handler(e.detail.view, e),
  });
}
