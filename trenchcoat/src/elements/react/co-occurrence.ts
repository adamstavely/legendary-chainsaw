import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcCoOccurrence, type CoEntity, type CoSelectedChange, type CoSort, type CoSortChange } from "../co-occurrence";
import { h, useControlled } from "./internal";

export type { CoEntity, CoEvent, CoSort, CoSource, CoStrength } from "../co-occurrence";
export { defaultCoStrengthLabels } from "../co-occurrence";

const RawCoOccurrence = createComponent({
  tagName: "tc-co-occurrence",
  elementClass: TcCoOccurrence,
  react: React,
  events: {
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<CoSelectedChange>>,
    onTcSortChange: "tc-sort-change" as EventName<CustomEvent<CoSortChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawCoOccurrence>;
type Owned = "heading" | "selected" | "sort" | "onTcSelectedChange" | "onTcSortChange" | "children";
export type CoOccurrenceProps = Omit<RawProps, Owned> & {
  /** The heading, and the list's name */
  title?: string;
  /** The open row's id – controlled when given (null for none) */
  selected?: string | null;
  /** The row open on mount when `selected` isn't controlled */
  defaultSelected?: string | null;
  /** A row was opened or closed; `entity` is the opened one */
  onSelectedChange?: (selected: string | null, entity?: CoEntity) => void;
  /** The order of the rows – controlled when given */
  sort?: CoSort;
  /** The order on mount when `sort` isn't controlled */
  defaultSort?: CoSort;
  /** The sort was changed */
  onSortChange?: (sort: CoSort) => void;
};

export function CoOccurrence({ title, selected, defaultSelected = null, onSelectedChange, sort, defaultSort = "score", onSortChange, ...props }: CoOccurrenceProps) {
  const entity = React.useRef<CoEntity | undefined>(undefined);
  const report = React.useCallback((next: string | null) => onSelectedChange?.(next, entity.current), [onSelectedChange]);
  const s = useControlled<string | null>(selected, defaultSelected, onSelectedChange ? report : undefined);
  const o = useControlled<CoSort>(sort, defaultSort, onSortChange);
  return h(RawCoOccurrence, {
    ...props,
    heading: title ?? "Co-occurrence",
    selected: s.value,
    sort: o.value,
    onTcSelectedChange: (e: CustomEvent<CoSelectedChange>) => {
      entity.current = e.detail.entity;
      s.handler(e.detail.selected, e);
    },
    onTcSortChange: (e: CustomEvent<CoSortChange>) => o.handler(e.detail.sort, e),
  });
}
