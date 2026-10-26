import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcFilterMenu, type FilterGroup, type FilterOpenChange, type FilterValue, type FilterValueChange } from "../filter-menu";
import { h } from "./internal";

/**
 * useControlled, except an uncontrolled value is mirrored here: @lit/react sets every prop on every render, so passing
 * the starting value back would undo the element's own change whenever the parent re-renders
 */
function useOwned<T>(value: T | undefined, defaultValue: T, onChange: ((next: T) => void) | undefined) {
  const own = React.useRef(defaultValue);
  const controlled = value !== undefined;
  const handler = (next: T, event: Event) => {
    if (controlled) event.preventDefault();
    else own.current = next;
    onChange?.(next);
  };
  return { value: controlled ? value : own.current, handler, controlled };
}

export type { FilterGroup, FilterOption, FilterValue } from "../filter-menu";

const NONE: FilterValue = {};

const RawFilterMenu = createComponent({
  tagName: "tc-filter-menu",
  elementClass: TcFilterMenu,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<FilterValueChange>>,
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<FilterOpenChange>>,
  },
});
type RawFilterMenuProps = React.ComponentProps<typeof RawFilterMenu>;
export type FilterMenuProps = Omit<RawFilterMenuProps, "heading" | "groups" | "value" | "defaultValue" | "open" | "onTcValueChange" | "onTcOpenChange" | "onChange"> & {
  /** The filter groups, in order – each a collapsible list of options that become chips when picked */
  groups: FilterGroup[];
  /** The picked options. Controlled when defined; otherwise the menu keeps its own, starting at `defaultValue` */
  value?: FilterValue;
  /** Starting value when uncontrolled */
  defaultValue?: FilterValue;
  /** Called with the new value whenever an option is picked or removed, or all are cleared */
  onChange?: (value: FilterValue) => void;
  /** Ids of the open groups. Controlled when defined; otherwise starts at `defaultOpen` */
  open?: string[];
  /** Groups that start open – by default the first one */
  defaultOpen?: string[];
  /** Called with the ids of the open groups whenever a group opens or folds */
  onOpenChange?: (open: string[]) => void;
  /** The heading, next to Clear all – "Filters" by default */
  title?: string;
};
export function FilterMenu({ title = "Filters", value, defaultValue = NONE, onChange, open, defaultOpen, onOpenChange, groups, ...props }: FilterMenuProps) {
  const v = useOwned(value, defaultValue, onChange);
  const o = useOwned(open, defaultOpen ?? groups.slice(0, 1).map((g) => g.id), onOpenChange);
  return h(RawFilterMenu, {
    ...props,
    groups,
    heading: title,
    // (React's own `value` attribute type is merged into the element's props – the element's is FilterValue)
    value: v.value as RawFilterMenuProps["value"],
    open: o.value,
    onTcValueChange: (e: CustomEvent<FilterValueChange>) => v.handler(e.detail.value, e),
    onTcOpenChange: (e: CustomEvent<FilterOpenChange>) => o.handler(e.detail.open, e),
  });
}
