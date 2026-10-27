import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcConfidenceBrief, type ConfidenceCopy, type ConfidenceProvenanceOpen } from "../confidence-brief";
import { h } from "./internal";

export type { ConfidenceCopy, ConfidenceLevel, ConfidenceProvenanceOpen, ConfidenceRecord, ConfidenceUncertaintyKind } from "../confidence-brief";

const RawConfidenceBrief = createComponent({
  tagName: "tc-confidence-brief",
  elementClass: TcConfidenceBrief,
  react: React,
  events: {
    onTcProvenanceOpen: "tc-provenance-open" as EventName<CustomEvent<ConfidenceProvenanceOpen>>,
    onTcCopy: "tc-copy" as EventName<CustomEvent<ConfidenceCopy>>,
  },
});
type RawConfidenceBriefProps = React.ComponentProps<typeof RawConfidenceBrief>;

export type ConfidenceBriefOwnProps = {
  /** The heading – what the brief is about, often the question as it was asked */
  title?: string;
  /** The provenance reference was pressed – open the record with this id */
  onOpenProvenance?: (id: string) => void;
  /** "Copy as text" was pressed, with the brief as plain text; call event.preventDefault() to copy or export it yourself */
  onCopy?: (text: string, event: Event) => void;
};
export type ConfidenceBriefProps = Omit<RawConfidenceBriefProps, keyof ConfidenceBriefOwnProps | "heading" | "onTcProvenanceOpen" | "onTcCopy"> & ConfidenceBriefOwnProps;

export function ConfidenceBrief({ title, onOpenProvenance, onCopy, ...props }: ConfidenceBriefProps) {
  return h(RawConfidenceBrief, {
    ...props,
    heading: title ?? "Confidence brief",
    onTcProvenanceOpen: (e: CustomEvent<ConfidenceProvenanceOpen>) => onOpenProvenance?.(e.detail.id),
    onTcCopy: (e: CustomEvent<ConfidenceCopy>) => onCopy?.(e.detail.text, e),
  });
}
