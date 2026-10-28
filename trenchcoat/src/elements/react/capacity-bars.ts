import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcCapacityBars, type CapacityPerson, type CapacitySelectedChange } from "../capacity-bars";
import { h, useControlled } from "./internal";

export type { CapacityAllocation, CapacityPerson } from "../capacity-bars";

const RawCapacityBars = createComponent({
  tagName: "tc-capacity-bars",
  elementClass: TcCapacityBars,
  react: React,
  events: {
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<CapacitySelectedChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawCapacityBars>;
type Owned = "heading" | "selected" | "onTcSelectedChange" | "children";
export type CapacityBarsProps = Omit<RawProps, Owned> & {
  /** The heading, and the grid's name */
  title?: string;
  /** The selected person's id – controlled when given (null for none) */
  selected?: string | null;
  /** The person selected on mount when `selected` isn't controlled */
  defaultSelected?: string | null;
  /** A person was selected or cleared; `person` is the selected person */
  onSelectedChange?: (selected: string | null, person?: CapacityPerson) => void;
};

export function CapacityBars({ title, selected, defaultSelected = null, onSelectedChange, ...props }: CapacityBarsProps) {
  const person = React.useRef<CapacityPerson | undefined>(undefined);
  const report = React.useCallback((next: string | null) => onSelectedChange?.(next, person.current), [onSelectedChange]);
  const s = useControlled<string | null>(selected, defaultSelected, onSelectedChange ? report : undefined);
  return h(RawCapacityBars, {
    ...props,
    heading: title ?? "People capacity",
    selected: s.value,
    onTcSelectedChange: (e: CustomEvent<CapacitySelectedChange>) => {
      person.current = e.detail.person;
      s.handler(e.detail.selected, e);
    },
  });
}
