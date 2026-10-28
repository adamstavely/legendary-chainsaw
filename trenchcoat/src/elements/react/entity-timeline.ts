import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcEntityTimeline, type TimelineEvent, type TimelineFilterChange, type TimelineSelectedChange } from "../entity-timeline";
import { h, useControlled } from "./internal";

export type { TimelineCategory, TimelineEvent, TimelineFilterChange, TimelineLink, TimelineSelectedChange, TimelineSource, TimelineTone } from "../entity-timeline";

const RawEntityTimeline = createComponent({
  tagName: "tc-entity-timeline",
  elementClass: TcEntityTimeline,
  react: React,
  events: {
    onTcFilterChange: "tc-filter-change" as EventName<CustomEvent<TimelineFilterChange>>,
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<TimelineSelectedChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawEntityTimeline>;
type Owned = "heading" | "filter" | "selected" | "onTcFilterChange" | "onTcSelectedChange" | "children";
export type EntityTimelineProps = Omit<RawProps, Owned> & {
  /** The heading, and the list's name */
  title?: string;
  /** The category shown, or "all" – controlled when given */
  filter?: string;
  /** The category shown on mount when `filter` isn't controlled */
  defaultFilter?: string;
  /** A category chip was picked */
  onFilterChange?: (filter: string) => void;
  /** The event whose detail is open – controlled when given (null for none) */
  selected?: string | null;
  /** The event open on mount when `selected` isn't controlled */
  defaultSelected?: string | null;
  /** An event's detail opened or closed; `event` is the opened event */
  onSelectedChange?: (selected: string | null, event?: TimelineEvent) => void;
};

export function EntityTimeline({ title, filter, defaultFilter = "all", onFilterChange, selected, defaultSelected = null, onSelectedChange, ...props }: EntityTimelineProps) {
  const f = useControlled<string>(filter, defaultFilter, onFilterChange);
  const picked = React.useRef<TimelineEvent | undefined>(undefined);
  const report = React.useCallback((next: string | null) => onSelectedChange?.(next, picked.current), [onSelectedChange]);
  const s = useControlled<string | null>(selected, defaultSelected, onSelectedChange ? report : undefined);
  return h(RawEntityTimeline, {
    ...props,
    heading: title ?? "Timeline",
    filter: f.value,
    selected: s.value,
    onTcFilterChange: (e: CustomEvent<TimelineFilterChange>) => f.handler(e.detail.filter, e),
    onTcSelectedChange: (e: CustomEvent<TimelineSelectedChange>) => {
      picked.current = e.detail.event;
      s.handler(e.detail.selected, e);
    },
  });
}
