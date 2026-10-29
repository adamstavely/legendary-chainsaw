import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcFacetSidebar, type FacetCollapsedChange, type FacetValueChange, type FacetValues } from "../facet-sidebar";
import { h, useControlled } from "./internal";

export type { Facet, FacetOption, FacetValue, FacetValues } from "../facet-sidebar";

const RawFacetSidebar = createComponent({
  tagName: "tc-facet-sidebar",
  elementClass: TcFacetSidebar,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<FacetValueChange>>,
    onTcCollapsedChange: "tc-collapsed-change" as EventName<CustomEvent<FacetCollapsedChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawFacetSidebar>;
type Owned = "heading" | "value" | "defaultValue" | "collapsed" | "onTcValueChange" | "onTcCollapsedChange" | "children";
export type FacetSidebarProps = Omit<RawProps, Owned> & {
  /** The heading, and the filters' name */
  title?: string;
  /** The filters in use – controlled when given */
  value?: FacetValues;
  /** The filters on mount when `value` isn't controlled */
  defaultValue?: FacetValues;
  /** A filter changed; `facet` is the facet's id ("" for Clear all) */
  onValueChange?: (value: FacetValues, facet: string) => void;
  /** Folded facets – controlled when given */
  collapsed?: string[];
  /** Folded facets on mount when `collapsed` isn't controlled */
  defaultCollapsed?: string[];
  /** A facet was folded or opened */
  onCollapsedChange?: (collapsed: string[]) => void;
};

const NO_VALUE: FacetValues = {};
const NONE: string[] = [];

export function FacetSidebar({ title, value, defaultValue = NO_VALUE, onValueChange, collapsed, defaultCollapsed = NONE, onCollapsedChange, ...props }: FacetSidebarProps) {
  const v = useControlled<FacetValues>(value, defaultValue, undefined);
  const c = useControlled<string[]>(collapsed, defaultCollapsed, onCollapsedChange);
  return h(RawFacetSidebar, {
    ...props,
    heading: title ?? "Filters",
    value: v.value,
    collapsed: c.value,
    onTcValueChange: (e: CustomEvent<FacetValueChange>) => {
      onValueChange?.(e.detail.value, e.detail.facet);
      v.handler(e.detail.value, e);
    },
    onTcCollapsedChange: (e: CustomEvent<FacetCollapsedChange>) => c.handler(e.detail.collapsed, e),
  });
}
