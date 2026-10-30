import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcYearList, type YearListSelectedChange } from "../year-list";
import { h, useControlled } from "./internal";

export type { YearListOrientation, YearListSelectedChange } from "../year-list";

const RawYearList = createComponent({
  tagName: "tc-year-list",
  elementClass: TcYearList,
  react: React,
  events: {
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<YearListSelectedChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawYearList>;
type Owned = "selected" | "onTcSelectedChange" | "children";
export type YearListProps = Omit<RawProps, Owned> & {
  /** The chosen year – controlled when given (null for none) */
  selected?: number | null;
  /** The year chosen on mount when `selected` isn't controlled */
  defaultSelected?: number | null;
  /** A year was chosen */
  onSelectedChange?: (selected: number | null) => void;
};

export function YearList({ selected, defaultSelected = null, onSelectedChange, ...props }: YearListProps) {
  const s = useControlled<number | null>(selected, defaultSelected, onSelectedChange);
  return h(RawYearList, {
    ...props,
    selected: s.value,
    onTcSelectedChange: (e: CustomEvent<YearListSelectedChange>) => s.handler(e.detail.selected, e),
  });
}
