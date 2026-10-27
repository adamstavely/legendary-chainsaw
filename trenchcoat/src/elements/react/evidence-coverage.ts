import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcEvidenceCoverage, type EvidenceCoverageOpenChange, type CoverageRequestDetail, type CoverageSource } from "../evidence-coverage";
import { h, useControlled } from "./internal";

export type { CoverageRequest, CoverageRequestDetail, CoverageRequestResolver, CoverageSource, EvidenceCoverageStatus } from "../evidence-coverage";

const RawEvidenceCoverage = createComponent({
  tagName: "tc-evidence-coverage",
  elementClass: TcEvidenceCoverage,
  react: React,
  events: {
    onTcCoverageRequest: "tc-coverage-request" as EventName<CustomEvent<CoverageRequestDetail>>,
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<EvidenceCoverageOpenChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawEvidenceCoverage>;
type Owned = "heading" | "open" | "onTcCoverageRequest" | "onTcOpenChange" | "children";
export type EvidenceCoverageProps = Omit<RawProps, Owned> & {
  /** The heading, and the region's name */
  title?: string;
  /** Called when Request coverage (or Retry) is pressed; call `event.preventDefault()` to track the request yourself through each source's `request` */
  onRequestCoverage?: (source: CoverageSource, event: CustomEvent<CoverageRequestDetail>) => void;
  /** Inline: whether the rows are folded out – controlled when given */
  open?: boolean;
  /** Inline: whether the rows start folded out, when `open` isn't set */
  defaultOpen?: boolean;
  /** Inline: called when the disclosure opens or closes */
  onOpenChange?: (open: boolean) => void;
};

export function EvidenceCoverage({ title, onRequestCoverage, open, defaultOpen = false, onOpenChange, ...props }: EvidenceCoverageProps) {
  const o = useControlled(open, defaultOpen, onOpenChange);
  return h(RawEvidenceCoverage, {
    ...props,
    heading: title ?? "Evidence coverage",
    open: o.value,
    onTcCoverageRequest: (e: CustomEvent<CoverageRequestDetail>) => onRequestCoverage?.(e.detail.source, e),
    onTcOpenChange: (e: CustomEvent<EvidenceCoverageOpenChange>) => o.handler(e.detail.open, e),
  });
}
