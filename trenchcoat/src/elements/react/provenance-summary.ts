import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcProvenanceSummary, type ProvenanceKind, type ProvenanceLineageOpen } from "../provenance-summary";
import { h } from "./internal";

export type { ProvenanceKind, ProvenanceLineageOpen, ProvenanceSection } from "../provenance-summary";

const RawProvenanceSummary = createComponent({
  tagName: "tc-provenance-summary",
  elementClass: TcProvenanceSummary,
  react: React,
  events: {
    onTcLineageOpen: "tc-lineage-open" as EventName<CustomEvent<ProvenanceLineageOpen>>,
  },
});
type RawProvenanceSummaryProps = React.ComponentProps<typeof RawProvenanceSummary>;
type Wrapped = "heading" | "onTcLineageOpen";
export type ProvenanceSummaryProps = Omit<RawProvenanceSummaryProps, Wrapped> & {
  /** The heading, and the region's name */
  title?: string;
  /** A segment was pressed: the section's id (null for the whole document), the kind, its amount and share */
  onOpenLineage?: (section: string | null, kind: ProvenanceKind, detail: ProvenanceLineageOpen) => void;
};

export function ProvenanceSummary({ title, onOpenLineage, ...props }: ProvenanceSummaryProps) {
  return h(RawProvenanceSummary, {
    ...props,
    heading: title ?? "Provenance",
    onTcLineageOpen: (e: CustomEvent<ProvenanceLineageOpen>) => onOpenLineage?.(e.detail.section, e.detail.kind, e.detail),
  });
}
