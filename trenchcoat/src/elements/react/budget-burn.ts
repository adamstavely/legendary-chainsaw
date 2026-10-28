import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcBudgetBurn, type BurnItem, type BurnOpen, type BurnSort, type BurnSortChange } from "../budget-burn";
import { h, useControlled } from "./internal";

export type { BurnItem, BurnPace, BurnSort } from "../budget-burn";

const RawBudgetBurn = createComponent({
  tagName: "tc-budget-burn",
  elementClass: TcBudgetBurn,
  react: React,
  events: {
    onTcSortChange: "tc-sort-change" as EventName<CustomEvent<BurnSortChange>>,
    onTcOpen: "tc-open" as EventName<CustomEvent<BurnOpen>>,
  },
});
type RawProps = React.ComponentProps<typeof RawBudgetBurn>;
type Owned = "heading" | "sort" | "onTcSortChange" | "onTcOpen" | "children";
export type BudgetBurnProps = Omit<RawProps, Owned> & {
  /** The heading, and the list's name */
  title?: string;
  /** The sort – controlled when given */
  sort?: BurnSort;
  /** The sort on mount when `sort` isn't controlled */
  defaultSort?: BurnSort;
  /** The sort was changed */
  onSortChange?: (sort: BurnSort) => void;
  /** A row was opened */
  onOpen?: (id: string, item: BurnItem) => void;
};

export function BudgetBurn({ title, sort, defaultSort = "budget", onSortChange, onOpen, ...props }: BudgetBurnProps) {
  const s = useControlled<BurnSort>(sort, defaultSort, onSortChange);
  return h(RawBudgetBurn, {
    ...props,
    heading: title ?? "Budget burn",
    sort: s.value,
    onTcSortChange: (e: CustomEvent<BurnSortChange>) => s.handler(e.detail.sort, e),
    onTcOpen: (e: CustomEvent<BurnOpen>) => onOpen?.(e.detail.id, e.detail.item),
  });
}
