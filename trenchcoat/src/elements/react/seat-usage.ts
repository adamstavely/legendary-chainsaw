import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcSeatUsage, type IdleMember, type SeatReclaim, type SeatSelectedChange } from "../seat-usage";
import { h, useControlled } from "./internal";

export type { IdleMember, SeatGroup, SeatReclaim, SeatSelectedChange, SeatTotals } from "../seat-usage";

const EMPTY: string[] = [];

const RawSeatUsage = createComponent({
  tagName: "tc-seat-usage",
  elementClass: TcSeatUsage,
  react: React,
  events: {
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<SeatSelectedChange>>,
    onTcReclaim: "tc-reclaim" as EventName<CustomEvent<SeatReclaim>>,
  },
});
type RawProps = React.ComponentProps<typeof RawSeatUsage>;
type Owned = "heading" | "selected" | "onTcSelectedChange" | "onTcReclaim" | "children";
export type SeatUsageProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** Ticked idle members' ids – controlled when given */
  selected?: string[];
  /** Ticked idle members' ids on mount, when `selected` isn't controlled */
  defaultSelected?: string[];
  /** Idle members were ticked or unticked */
  onSelectedChange?: (selected: string[]) => void;
  /** Reclaiming was confirmed; return false to keep the confirmation open */
  onReclaim?: (ids: string[], members: IdleMember[]) => boolean | void;
};

export function SeatUsage({ title, selected, defaultSelected = EMPTY, onSelectedChange, onReclaim, ...props }: SeatUsageProps) {
  const s = useControlled<string[]>(selected, defaultSelected, onSelectedChange);
  return h(RawSeatUsage, {
    ...props,
    heading: title ?? "Seats",
    selected: s.value,
    onTcSelectedChange: (e: CustomEvent<SeatSelectedChange>) => s.handler(e.detail.selected, e),
    onTcReclaim: (e: CustomEvent<SeatReclaim>) => {
      if (onReclaim?.(e.detail.ids, e.detail.members) === false) e.preventDefault();
    },
  });
}
