import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcKpiBoard, type KpiRangeChange, type KpiSegmentChange } from "../kpi-board";
import { h, isNode, useControlled, useStaged } from "./internal";

export type { KpiBoardData, KpiButton, KpiOption, KpiRangeChange, KpiSegmentChange, KpiStat } from "../kpi-board";
export { kpiMoney } from "../kpi-board";

const RawKpiBoard = createComponent({
  tagName: "tc-kpi-board",
  elementClass: TcKpiBoard,
  react: React,
  events: {
    onTcRangeChange: "tc-range-change" as EventName<CustomEvent<KpiRangeChange>>,
    onTcSegmentChange: "tc-segment-change" as EventName<CustomEvent<KpiSegmentChange>>,
    onTcSetup: "tc-setup" as EventName<CustomEvent<null>>,
    onTcAction: "tc-action" as EventName<CustomEvent<null>>,
  },
});
type RawProps = React.ComponentProps<typeof RawKpiBoard>;
type Owned = "heading" | "range" | "segment" | "icon" | "onTcRangeChange" | "onTcSegmentChange" | "children";
export type KpiBoardProps = Omit<RawProps, Owned> & {
  /** Heading on the left of the bar above the cards */
  title?: string;
  /** The range shown (controlled) */
  range?: string;
  /** The range at first, when `range` isn't set – the first by default */
  defaultRange?: string;
  /** Called with the picked range id */
  onRangeChange?: (id: string) => void;
  /** The overview's segment (controlled) */
  segment?: string;
  /** The segment at first, when `segment` isn't set – the first by default */
  defaultSegment?: string;
  /** Called with the picked segment id */
  onSegmentChange?: (id: string) => void;
  /** Icon in the focus card – a React node */
  icon?: React.ReactNode;
};

export function KpiBoard({ title, range, defaultRange, onRangeChange, segment, defaultSegment, onSegmentChange, icon, ...props }: KpiBoardProps) {
  const { stage, els } = useStaged(isNode(icon) ? [["icon", icon]] : []);
  const r = useControlled<string | undefined>(range, defaultRange, onRangeChange as ((id: string | undefined) => void) | undefined);
  const s = useControlled<string | undefined>(segment, defaultSegment, onSegmentChange as ((id: string | undefined) => void) | undefined);
  return h(
    React.Fragment,
    null,
    h(RawKpiBoard, {
      ...props,
      heading: title ?? "",
      range: r.value,
      segment: s.value,
      icon: isNode(icon) ? els.icon : undefined,
      onTcRangeChange: (e: CustomEvent<KpiRangeChange>) => r.handler(e.detail.range, e),
      onTcSegmentChange: (e: CustomEvent<KpiSegmentChange>) => s.handler(e.detail.segment, e),
    }),
    stage,
  );
}
