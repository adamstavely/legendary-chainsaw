import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcLineItems, type LineItem, type LineItemsAction, type LineItemsChange, type LineItemsConfirm } from "../line-items";
import { h, useControlled } from "./internal";

export type { LineItem, LineItemField, LineItemsAction, LineItemsChange, LineItemsConfirm, LineItemTotals } from "../line-items";
export { lineAmount, lineTotals, parseLocaleNumber } from "../line-items";

const RawLineItems = createComponent({
  tagName: "tc-line-items",
  elementClass: TcLineItems,
  react: React,
  events: {
    onTcItemsChange: "tc-items-change" as EventName<CustomEvent<LineItemsChange>>,
    onTcConfirm: "tc-confirm" as EventName<CustomEvent<LineItemsConfirm>>,
  },
});
type RawLineItemsProps = React.ComponentProps<typeof RawLineItems>;

export type LineItemsOwnProps = {
  /** The heading */
  title?: string;
  /** The rows. Controlled when defined – pass back what onItemsChange reports */
  items?: LineItem[];
  /** Starting rows when uncontrolled */
  defaultItems?: LineItem[];
  /** A row was edited, added or removed: the whole list, the row and what was done */
  onItemsChange?: (items: LineItem[], item: LineItem, action: LineItemsAction) => void;
  /** Confirm was pressed: the rows and the totals. Return false to stop the confirmation being announced */
  onConfirm?: (detail: LineItemsConfirm) => void | boolean;
};
export type LineItemsProps = Omit<RawLineItemsProps, keyof LineItemsOwnProps | "heading" | "onTcItemsChange" | "onTcConfirm" | "children"> & LineItemsOwnProps;

const EMPTY: LineItem[] = [];

export function LineItems({ title = "Line items", items, defaultItems = EMPTY, onItemsChange, onConfirm, ...props }: LineItemsProps) {
  // The changed row and the action travel with the list: kept from the event for onItemsChange's extra arguments
  const last = React.useRef<{ item: LineItem; action: LineItemsAction } | null>(null);
  const report = React.useCallback((next: LineItem[]) => last.current && onItemsChange?.(next, last.current.item, last.current.action), [onItemsChange]);
  const s = useControlled(items, defaultItems, report);
  return h(RawLineItems, {
    ...props,
    heading: title,
    items: s.value,
    onTcItemsChange: (e: CustomEvent<LineItemsChange>) => {
      last.current = { item: e.detail.item, action: e.detail.action };
      s.handler(e.detail.items, e);
    },
    onTcConfirm: (e: CustomEvent<LineItemsConfirm>) => {
      if (onConfirm?.(e.detail) === false) e.preventDefault();
    },
  });
}
