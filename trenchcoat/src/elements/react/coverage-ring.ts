import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcCoverageRing, type CoverageSegment, type CoverageSelect } from "../coverage-ring";
import { h } from "./internal";

export type { CoverageSegment, CoverageTone } from "../coverage-ring";

const RawCoverageRing = createComponent({
  tagName: "tc-coverage-ring",
  elementClass: TcCoverageRing,
  react: React,
  events: {
    onTcSelect: "tc-select" as EventName<CustomEvent<CoverageSelect>>,
  },
});
type RawProps = React.ComponentProps<typeof RawCoverageRing>;
type Owned = "heading" | "onTcSelect" | "onSelect" | "children";
export type CoverageRingProps = Omit<RawProps, Owned> & {
  /** The title beside the ring */
  title?: string;
  /** A segment of the bar was chosen with Enter or a click (named apart from React's DOM onSelect) */
  onSegmentSelect?: (id: string, segment: CoverageSegment) => void;
};

export function CoverageRing({ title, onSegmentSelect, ...props }: CoverageRingProps) {
  return h(RawCoverageRing, {
    ...props,
    heading: title ?? "Coverage",
    onTcSelect: (e: CustomEvent<CoverageSelect>) => onSegmentSelect?.(e.detail.id, e.detail.segment),
  });
}
