import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcEvidenceList, type EvidenceCopy, type EvidenceSelectedChange, type Exhibit } from "../evidence-list";
import { h, useControlled } from "./internal";

export type { CustodyEvent, Exhibit, ExhibitMark, ExhibitSource, ExhibitStatusDef, ExhibitTone, ExhibitType } from "../evidence-list";
export { defaultExhibitStatuses } from "../evidence-list";

const RawEvidenceList = createComponent({
  tagName: "tc-evidence-list",
  elementClass: TcEvidenceList,
  react: React,
  events: {
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<EvidenceSelectedChange>>,
    onTcCopy: "tc-copy" as EventName<CustomEvent<EvidenceCopy>>,
  },
});
type RawProps = React.ComponentProps<typeof RawEvidenceList>;
type Owned = "heading" | "selected" | "onTcSelectedChange" | "onTcCopy" | "onCopy" | "children";
export type EvidenceListProps = Omit<RawProps, Owned> & {
  /** The heading, and the list's name */
  title?: string;
  /** The open exhibit's id – controlled when given (null for none) */
  selected?: string | null;
  /** The exhibit open on mount when `selected` isn't controlled */
  defaultSelected?: string | null;
  /** An exhibit was opened or closed; `exhibit` is the opened one */
  onSelectedChange?: (selected: string | null, exhibit?: Exhibit) => void;
  /** A hash's Copy was pressed; return false to copy it yourself instead */
  onCopyHash?: (exhibit: string, hash: string) => boolean | void;
};

export function EvidenceList({ title, selected, defaultSelected = null, onSelectedChange, onCopyHash, ...props }: EvidenceListProps) {
  const exhibit = React.useRef<Exhibit | undefined>(undefined);
  const report = React.useCallback((next: string | null) => onSelectedChange?.(next, exhibit.current), [onSelectedChange]);
  const s = useControlled<string | null>(selected, defaultSelected, onSelectedChange ? report : undefined);
  return h(RawEvidenceList, {
    ...props,
    heading: title ?? "Linked evidence",
    selected: s.value,
    onTcSelectedChange: (e: CustomEvent<EvidenceSelectedChange>) => {
      exhibit.current = e.detail.exhibit;
      s.handler(e.detail.selected, e);
    },
    onTcCopy: (e: CustomEvent<EvidenceCopy>) => {
      if (onCopyHash?.(e.detail.exhibit, e.detail.hash) === false) e.preventDefault();
    },
  });
}
