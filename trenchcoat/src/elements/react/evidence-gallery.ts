import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcEvidenceGallery, type EvidenceAltChange, type EvidenceFilter, type EvidenceFilterChange, type EvidenceItem } from "../evidence-gallery";
import { h, useControlled } from "./internal";

export type { Attestation, EvidenceAltChange, EvidenceFilter, EvidenceFilterChange, EvidenceItem } from "../evidence-gallery";
export { defaultAttestationLabels } from "../evidence-gallery";

const RawEvidenceGallery = createComponent({
  tagName: "tc-evidence-gallery",
  elementClass: TcEvidenceGallery,
  react: React,
  events: {
    onTcFilterChange: "tc-filter-change" as EventName<CustomEvent<EvidenceFilterChange>>,
    onTcAltChange: "tc-alt-change" as EventName<CustomEvent<EvidenceAltChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawEvidenceGallery>;
type Owned = "heading" | "filter" | "onTcFilterChange" | "onTcAltChange" | "children";
export type EvidenceGalleryProps = Omit<RawProps, Owned> & {
  /** The grid's heading – "Evidence" by default */
  title?: string;
  /** Which items show (controlled) */
  filter?: EvidenceFilter;
  /** The filter at first when uncontrolled – "all" by default */
  defaultFilter?: EvidenceFilter;
  /** Called when another filter is picked */
  onFilterChange?: (filter: EvidenceFilter) => void;
  /** An alt text was edited in the grid: the item with its new alt text */
  onAltChange?: (item: EvidenceItem, alt: string) => void;
};

export function EvidenceGallery({ title, filter, defaultFilter = "all", onFilterChange, onAltChange, ...props }: EvidenceGalleryProps) {
  const f = useControlled(filter, defaultFilter, onFilterChange);
  return h(RawEvidenceGallery, {
    ...props,
    heading: title ?? "Evidence",
    filter: f.value,
    onTcFilterChange: (e: CustomEvent<EvidenceFilterChange>) => f.handler(e.detail.filter, e),
    onTcAltChange: (e: CustomEvent<EvidenceAltChange>) => onAltChange?.(e.detail.item, e.detail.alt),
  });
}
