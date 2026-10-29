import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcOrgChart, type OrgChartExpandedChange, type OrgChartFilterChange, type OrgChartPerson, type OrgChartSelectedChange } from "../org-chart";
import { h, useControlled } from "./internal";

export type { OrgChartLayout, OrgChartPerson, OrgChartPersonStatus } from "../org-chart";

const RawOrgChart = createComponent({
  tagName: "tc-org-chart",
  elementClass: TcOrgChart,
  react: React,
  events: {
    onTcExpandedChange: "tc-expanded-change" as EventName<CustomEvent<OrgChartExpandedChange>>,
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<OrgChartSelectedChange>>,
    onTcFilterChange: "tc-filter-change" as EventName<CustomEvent<OrgChartFilterChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawOrgChart>;
type Owned = "heading" | "expanded" | "selected" | "filter" | "onTcExpandedChange" | "onTcSelectedChange" | "onTcFilterChange" | "children";
export type OrgChartProps = Omit<RawProps, Owned> & {
  /** The heading, and the chart's name */
  title?: string;
  /** The people whose reports are shown – controlled when given; null shows the top of each tree and one level */
  expanded?: string[] | null;
  /** `expanded` on mount when it isn't controlled */
  defaultExpanded?: string[] | null;
  /** A branch was opened or folded; `next` is the list as it will be */
  onExpandedChange?: (next: string[], change: { id: string; open: boolean }) => void;
  /** The person picked – controlled when given */
  selected?: string | null;
  /** The person picked on mount when `selected` isn't controlled */
  defaultSelected?: string | null;
  /** A person was picked */
  onSelectedChange?: (selected: string | null, person: OrgChartPerson | null) => void;
  /** The search – controlled when given */
  filter?: string;
  /** The search on mount when `filter` isn't controlled */
  defaultFilter?: string;
  /** The search changed */
  onFilterChange?: (filter: string) => void;
};

export function OrgChart({
  title,
  expanded,
  defaultExpanded = null,
  onExpandedChange,
  selected,
  defaultSelected = null,
  onSelectedChange,
  filter,
  defaultFilter = "",
  onFilterChange,
  ...props
}: OrgChartProps) {
  const ex = useControlled<string[] | null>(expanded, defaultExpanded, undefined);
  const sel = useControlled<string | null>(selected, defaultSelected, undefined);
  const f = useControlled<string>(filter, defaultFilter, onFilterChange);
  return h(RawOrgChart, {
    ...props,
    heading: title ?? "Organisation",
    expanded: ex.value,
    selected: sel.value,
    filter: f.value,
    onTcExpandedChange: (e: CustomEvent<OrgChartExpandedChange>) => {
      onExpandedChange?.(e.detail.expanded, { id: e.detail.id, open: e.detail.open });
      ex.handler(e.detail.expanded, e);
    },
    onTcSelectedChange: (e: CustomEvent<OrgChartSelectedChange>) => {
      onSelectedChange?.(e.detail.selected, e.detail.person);
      sel.handler(e.detail.selected, e);
    },
    onTcFilterChange: (e: CustomEvent<OrgChartFilterChange>) => f.handler(e.detail.filter, e),
  });
}
