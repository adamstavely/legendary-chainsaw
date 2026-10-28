import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcPlaceList, type PlaceRecord, type PlaceSelectedChange } from "../place-list";
import { h, useControlled } from "./internal";

export type { PlaceIcon, PlaceRecord, PlaceSelectedChange, PlaceTone } from "../place-list";
export { defaultPlaceStatuses, defaultPlaceTypes } from "../place-list";

const RawPlaceList = createComponent({
  tagName: "tc-place-list",
  elementClass: TcPlaceList,
  react: React,
  events: {
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<PlaceSelectedChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawPlaceList>;
type Owned = "heading" | "selected" | "onTcSelectedChange" | "children";
export type PlaceListProps = Omit<RawProps, Owned> & {
  /** The heading, and the list's name */
  title?: string;
  /** The picked place – controlled when given (null for none) */
  selected?: string | null;
  /** The place picked on mount when `selected` isn't controlled */
  defaultSelected?: string | null;
  /** A place was picked or cleared; `place` is the picked one */
  onSelectedChange?: (selected: string | null, place?: PlaceRecord) => void;
};

export function PlaceList({ title, selected, defaultSelected = null, onSelectedChange, ...props }: PlaceListProps) {
  const picked = React.useRef<PlaceRecord | undefined>(undefined);
  const report = React.useCallback((next: string | null) => onSelectedChange?.(next, picked.current), [onSelectedChange]);
  const s = useControlled<string | null>(selected, defaultSelected, onSelectedChange ? report : undefined);
  return h(RawPlaceList, {
    ...props,
    heading: title ?? "Places",
    selected: s.value,
    onTcSelectedChange: (e: CustomEvent<PlaceSelectedChange>) => {
      picked.current = e.detail.place;
      s.handler(e.detail.selected, e);
    },
  });
}
