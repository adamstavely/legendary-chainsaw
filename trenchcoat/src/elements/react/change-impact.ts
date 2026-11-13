import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcChangeImpact, type ChangeImpactExamplesOpen, type ChangeImpactSegmentChange } from "../change-impact";
import { h, useControlled } from "./internal";

export { changeImpact } from "../change-impact";
export type {
  ChangeImpactExamplesOpen,
  ImpactChange,
  ImpactCriterion,
  ImpactMetric,
  ImpactResult,
  ImpactSegment,
  ImpactValue,
  ImpactVerdict,
} from "../change-impact";

const RawChangeImpact = createComponent({
  tagName: "tc-change-impact",
  elementClass: TcChangeImpact,
  react: React,
  events: {
    onTcSegmentChange: "tc-segment-change" as EventName<CustomEvent<ChangeImpactSegmentChange>>,
    onTcExamplesOpen: "tc-examples-open" as EventName<CustomEvent<ChangeImpactExamplesOpen>>,
  },
});
type RawChangeImpactProps = React.ComponentProps<typeof RawChangeImpact>;

export type ChangeImpactProps = Omit<RawChangeImpactProps, "heading" | "segment" | "onTcSegmentChange" | "onTcExamplesOpen" | "children"> & {
  /** The heading */
  title?: string;
  /** The segment shown, or null for all traffic. Controlled when defined */
  segment?: string | null;
  /** The segment at first when `segment` isn't controlled */
  defaultSegment?: string | null;
  /** Called with the segment the user picked, controlled or not */
  onSegmentChange?: (segment: string | null) => void;
  /** Called when a row's before or after examples are asked for */
  onExamplesOpen?: (criterion: string, side: "before" | "after") => void;
};

export function ChangeImpact({ title = "Change impact", segment, defaultSegment = null, onSegmentChange, onExamplesOpen, ...props }: ChangeImpactProps) {
  const s = useControlled<string | null>(segment, defaultSegment, onSegmentChange);
  return h(RawChangeImpact, {
    ...props,
    heading: title,
    segment: s.value,
    onTcSegmentChange: (e: CustomEvent<ChangeImpactSegmentChange>) => s.handler(e.detail.segment, e),
    onTcExamplesOpen: onExamplesOpen ? (e: CustomEvent<ChangeImpactExamplesOpen>) => onExamplesOpen(e.detail.criterion, e.detail.side) : undefined,
  });
}
