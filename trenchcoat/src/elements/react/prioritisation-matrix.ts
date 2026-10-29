import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcPrioritisationMatrix, type PrioritisationItem, type PrioritisationItemsChange } from "../prioritisation-matrix";
import { h, useControlled } from "./internal";

export type { PrioritisationItem, PrioritisationLabels, PrioritisationQuadrant } from "../prioritisation-matrix";

const RawPrioritisationMatrix = createComponent({
  tagName: "tc-prioritisation-matrix",
  elementClass: TcPrioritisationMatrix,
  react: React,
  events: { onTcItemsChange: "tc-items-change" as EventName<CustomEvent<PrioritisationItemsChange>> },
});
type RawProps = React.ComponentProps<typeof RawPrioritisationMatrix>;
type Owned = "heading" | "items" | "onTcItemsChange" | "children";
export type PrioritisationMatrixProps = Omit<RawProps, Owned> & {
  /** The heading, and the plot's name */
  title?: string;
  /** The items – controlled when given: every move reports the next list through onItemsChange */
  items?: PrioritisationItem[];
  /** The items on mount when `items` isn't controlled */
  defaultItems?: PrioritisationItem[];
  /** An item was moved; `next` is the list as it will be */
  onItemsChange?: (next: PrioritisationItem[], change: PrioritisationItemsChange["change"]) => void;
};

const NONE: PrioritisationItem[] = [];

export function PrioritisationMatrix({ title, items, defaultItems = NONE, onItemsChange, ...props }: PrioritisationMatrixProps) {
  const list = useControlled<PrioritisationItem[]>(items, defaultItems, undefined);
  return h(RawPrioritisationMatrix, {
    ...props,
    heading: title ?? "Prioritisation",
    items: list.value,
    onTcItemsChange: (e: CustomEvent<PrioritisationItemsChange>) => {
      onItemsChange?.(e.detail.items, e.detail.change);
      list.handler(e.detail.items, e);
    },
  });
}
