import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcLegalHoldManager, type LegalHold, type LegalHoldSelectedChange, type LegalHoldsChange } from "../legal-hold-manager";
import { h, useControlled } from "./internal";

export type { LegalHold, LegalHoldChangeKind, LegalHoldItem, LegalHoldManagerLabels, LegalHoldSelectedChange, LegalHoldStatus, LegalHoldsChange } from "../legal-hold-manager";
export { defaultLegalHoldManagerLabels } from "../legal-hold-manager";

const RawLegalHoldManager = createComponent({
  tagName: "tc-legal-hold-manager",
  elementClass: TcLegalHoldManager,
  react: React,
  events: {
    onTcHoldsChange: "tc-holds-change" as EventName<CustomEvent<LegalHoldsChange>>,
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<LegalHoldSelectedChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawLegalHoldManager>;
type Owned = "heading" | "holds" | "selected" | "onTcHoldsChange" | "onTcSelectedChange" | "children";
export type LegalHoldManagerProps = Omit<RawProps, Owned> & {
  /** The heading; by default "Legal holds" */
  title?: string;
  /** The holds – controlled when given */
  holds?: LegalHold[];
  /** The holds on mount when `holds` isn't controlled */
  defaultHolds?: LegalHold[];
  /** An item was added or a hold released */
  onHoldsChange?: (holds: LegalHold[], detail: LegalHoldsChange) => void;
  /** The open hold – controlled when given */
  selected?: string | null;
  /** The open hold on mount when `selected` isn't controlled */
  defaultSelected?: string | null;
  /** A hold was opened or closed */
  onSelectedChange?: (selected: string | null) => void;
};

const NONE: LegalHold[] = [];

export function LegalHoldManager({ title, holds, defaultHolds = NONE, onHoldsChange, selected, defaultSelected = null, onSelectedChange, ...props }: LegalHoldManagerProps) {
  const v = useControlled<LegalHold[]>(holds, defaultHolds, undefined);
  const s = useControlled<string | null>(selected, defaultSelected, onSelectedChange);
  return h(RawLegalHoldManager, {
    ...props,
    heading: title ?? "Legal holds",
    holds: v.value,
    selected: s.value,
    onTcHoldsChange: (e: CustomEvent<LegalHoldsChange>) => {
      v.handler(e.detail.holds, e);
      onHoldsChange?.(e.detail.holds, e.detail);
    },
    onTcSelectedChange: (e: CustomEvent<LegalHoldSelectedChange>) => s.handler(e.detail.selected, e),
  });
}
