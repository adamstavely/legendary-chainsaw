import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcFingerprintCard, type FingerPosition, type FingerPrint, type FingerprintSelectedChange } from "../fingerprint-card";
import { h, useControlled } from "./internal";

export type { FingerPattern, FingerPosition, FingerPrint, FingerStatus } from "../fingerprint-card";
export { defaultFingerStatusLabels } from "../fingerprint-card";

const RawFingerprintCard = createComponent({
  tagName: "tc-fingerprint-card",
  elementClass: TcFingerprintCard,
  react: React,
  events: {
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<FingerprintSelectedChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawFingerprintCard>;
type Owned = "heading" | "selected" | "onTcSelectedChange" | "children";
export type FingerprintCardProps = Omit<RawProps, Owned> & {
  /** The heading, and the grid's name */
  title?: string;
  /** The finger whose detail is open – controlled when given (null for none) */
  selected?: FingerPosition | null;
  /** The finger open on mount when `selected` isn't controlled */
  defaultSelected?: FingerPosition | null;
  /** A finger's detail opened or closed; `print` is the opened finger's print */
  onSelectedChange?: (selected: FingerPosition | null, print?: FingerPrint) => void;
};

export function FingerprintCard({ title, selected, defaultSelected = null, onSelectedChange, ...props }: FingerprintCardProps) {
  const print = React.useRef<FingerPrint | undefined>(undefined);
  const report = React.useCallback((next: FingerPosition | null) => onSelectedChange?.(next, print.current), [onSelectedChange]);
  const s = useControlled<FingerPosition | null>(selected, defaultSelected, onSelectedChange ? report : undefined);
  return h(RawFingerprintCard, {
    ...props,
    heading: title ?? "Fingerprints",
    selected: s.value,
    onTcSelectedChange: (e: CustomEvent<FingerprintSelectedChange>) => {
      print.current = e.detail.print;
      s.handler(e.detail.selected, e);
    },
  });
}
