import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcDiffTimeline, type DiffTimelineEdit, type DiffTimelineSelectedChange, type DiffTimelineTimeChange } from "../diff-timeline";
import { h, useControlled } from "./internal";

export type { DiffTimelineEdit, DiffTimelineFile, DiffTimelineLabels, DiffTimelineSelectedChange, DiffTimelineTimeChange } from "../diff-timeline";
export { defaultDiffTimelineLabels, diffTimelineOffset, diffTimelineSeries } from "../diff-timeline";

const RawDiffTimeline = createComponent({
  tagName: "tc-diff-timeline",
  elementClass: TcDiffTimeline,
  react: React,
  events: {
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<DiffTimelineSelectedChange>>,
    onTcTimeChange: "tc-time-change" as EventName<CustomEvent<DiffTimelineTimeChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawDiffTimeline>;
type Owned = "heading" | "selected" | "time" | "onTcSelectedChange" | "onTcTimeChange" | "children";
export type DiffTimelineProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** The picked edit's id – controlled when given */
  selected?: string | null;
  /** The picked edit on mount when `selected` isn't controlled */
  defaultSelected?: string | null;
  /** An edit was picked or closed */
  onSelectedChange?: (selected: string | null, edit: DiffTimelineEdit | null, path: string | null) => void;
  /** The replay position, epoch ms, or null for everything – controlled when given */
  time?: number | null;
  /** The replay position on mount when `time` isn't controlled */
  defaultTime?: number | null;
  /** The replay position moved */
  onTimeChange?: (time: number | null) => void;
};

export function DiffTimeline({ title, selected, defaultSelected = null, onSelectedChange, time, defaultTime = null, onTimeChange, ...props }: DiffTimelineProps) {
  const s = useControlled<string | null>(selected, defaultSelected, undefined);
  const t = useControlled<number | null>(time, defaultTime, onTimeChange);
  return h(RawDiffTimeline, {
    ...props,
    heading: title ?? "Changes over time",
    selected: s.value,
    time: t.value,
    onTcSelectedChange: (e: CustomEvent<DiffTimelineSelectedChange>) => {
      s.handler(e.detail.selected, e);
      onSelectedChange?.(e.detail.selected, e.detail.edit, e.detail.path);
    },
    onTcTimeChange: (e: CustomEvent<DiffTimelineTimeChange>) => t.handler(e.detail.time, e),
  });
}
