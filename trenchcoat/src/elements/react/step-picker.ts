import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcStepPicker, type StepPick, type StepPickerItem, type StepPickerOpenChange, type StepPickerQueryChange } from "../step-picker";
import { h, useControlled } from "./internal";

export type { StepPick, StepPickerGroup, StepPickerItem, StepPickerLayout, StepSuggestion } from "../step-picker";
export { defaultStepGroups, defaultStepItems } from "../step-picker";

const RawStepPicker = createComponent({
  tagName: "tc-step-picker",
  elementClass: TcStepPicker,
  react: React,
  events: {
    onTcPick: "tc-pick" as EventName<CustomEvent<StepPick>>,
    onTcQueryChange: "tc-query-change" as EventName<CustomEvent<StepPickerQueryChange>>,
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<StepPickerOpenChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawStepPicker>;
type Owned = "heading" | "query" | "open" | "anchor" | "onTcPick" | "onTcQueryChange" | "onTcOpenChange" | "children";
export type StepPickerProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** The search text – controlled when given */
  query?: string;
  /** The search text on mount when `query` isn't controlled */
  defaultQuery?: string;
  /** The search text changed */
  onQueryChange?: (query: string) => void;
  /** In popover layout: whether it's showing – controlled when given */
  open?: boolean;
  /** Whether it shows on mount when `open` isn't controlled */
  defaultOpen?: boolean;
  /** The popover opened or closed */
  onOpenChange?: (open: boolean) => void;
  /** In popover layout: the element it floats by – a ref's current element */
  anchor?: HTMLElement | null;
  /** A step was chosen; return false to keep a popover open */
  onPick?: (kind: string, item: StepPickerItem, tool?: string) => void | boolean;
};

export function StepPicker({ title, query, defaultQuery = "", onQueryChange, open, defaultOpen = false, onOpenChange, anchor = null, onPick, ...props }: StepPickerProps) {
  const q = useControlled<string>(query, defaultQuery, onQueryChange);
  const o = useControlled<boolean>(open, defaultOpen, onOpenChange);
  return h(RawStepPicker, {
    ...props,
    heading: title ?? "Add a step",
    query: q.value,
    open: o.value,
    anchor,
    onTcQueryChange: (e: CustomEvent<StepPickerQueryChange>) => q.handler(e.detail.query, e),
    onTcOpenChange: (e: CustomEvent<StepPickerOpenChange>) => o.handler(e.detail.open, e),
    onTcPick: (e: CustomEvent<StepPick>) => {
      if (onPick?.(e.detail.kind, e.detail.item, e.detail.tool) === false) e.preventDefault();
    },
  });
}
