import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcGapExposure, type ExposureGap, type GapFilterChange, type GapGroupBy, type GapGroupChange, type GapOpen } from "../gap-exposure";
import { h, useControlled } from "./internal";

export type { ExposureGap, GapGroupBy, GapSeverity } from "../gap-exposure";
export { defaultGapSeverityLabels, defaultGapTiers } from "../gap-exposure";

const RawGapExposure = createComponent({
  tagName: "tc-gap-exposure",
  elementClass: TcGapExposure,
  react: React,
  events: {
    onTcOpen: "tc-open" as EventName<CustomEvent<GapOpen>>,
    onTcGroupChange: "tc-group-change" as EventName<CustomEvent<GapGroupChange>>,
    onTcFilterChange: "tc-filter-change" as EventName<CustomEvent<GapFilterChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawGapExposure>;
type Owned = "heading" | "groupBy" | "uncoveredOnly" | "onTcOpen" | "onTcGroupChange" | "onTcFilterChange" | "children";
export type GapExposureProps = Omit<RawProps, Owned> & {
  /** The heading, and the list's name */
  title?: string;
  /** Groups by the item's priority or by severity – controlled when given */
  groupBy?: GapGroupBy;
  /** The grouping on mount when `groupBy` isn't controlled */
  defaultGroupBy?: GapGroupBy;
  /** Grouping was changed */
  onGroupByChange?: (groupBy: GapGroupBy) => void;
  /** Shows only uncovered gaps – controlled when given */
  uncoveredOnly?: boolean;
  /** The filter on mount when `uncoveredOnly` isn't controlled */
  defaultUncoveredOnly?: boolean;
  /** "Uncovered only" was turned on or off */
  onUncoveredOnlyChange?: (uncoveredOnly: boolean) => void;
  /** A gap was opened with Enter or a click */
  onOpen?: (id: string, gap: ExposureGap) => void;
};

export function GapExposure({ title, groupBy, defaultGroupBy = "priority", onGroupByChange, uncoveredOnly, defaultUncoveredOnly = false, onUncoveredOnlyChange, onOpen, ...props }: GapExposureProps) {
  const g = useControlled<GapGroupBy>(groupBy, defaultGroupBy, onGroupByChange);
  const u = useControlled<boolean>(uncoveredOnly, defaultUncoveredOnly, onUncoveredOnlyChange);
  return h(RawGapExposure, {
    ...props,
    heading: title ?? "Gaps & coverage",
    groupBy: g.value,
    uncoveredOnly: u.value,
    onTcGroupChange: (e: CustomEvent<GapGroupChange>) => g.handler(e.detail.groupBy, e),
    onTcFilterChange: (e: CustomEvent<GapFilterChange>) => u.handler(e.detail.uncoveredOnly, e),
    onTcOpen: (e: CustomEvent<GapOpen>) => onOpen?.(e.detail.id, e.detail.gap),
  });
}
