import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcRouteMap, type RouteItem, type RouteOpen, type RouteSelectedChange, type RouteStatus, type RouteStatusesChange } from "../route-map";
import { h, useControlled } from "./internal";

export type { RouteItem, RouteMapLabels, RouteOpen, RouteSelectedChange, RouteStatus, RouteStatusesChange } from "../route-map";
export { defaultRouteMapLabels } from "../route-map";

const RawRouteMap = createComponent({
  tagName: "tc-route-map",
  elementClass: TcRouteMap,
  react: React,
  events: {
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<RouteSelectedChange>>,
    onTcStatusesChange: "tc-statuses-change" as EventName<CustomEvent<RouteStatusesChange>>,
    onTcOpen: "tc-open" as EventName<CustomEvent<RouteOpen>>,
  },
});
type RawProps = React.ComponentProps<typeof RawRouteMap>;
export type RouteMapProps = Omit<RawProps, "heading" | "selected" | "statuses" | "onTcSelectedChange" | "onTcStatusesChange" | "children"> & {
  /** The heading; "" leaves the header out */
  title?: string;
  /** The chosen route's id – controlled when given */
  selected?: string | null;
  /** The chosen route at first, when `selected` isn't controlled */
  defaultSelected?: string | null;
  /** A route was pressed */
  onSelectedChange?: (selected: string | null, route: RouteItem | null) => void;
  /** The statuses shown – controlled when given; empty shows every route */
  statuses?: RouteStatus[];
  /** The statuses shown at first, when `statuses` isn't controlled */
  defaultStatuses?: RouteStatus[];
  /** A status chip was toggled */
  onStatusesChange?: (statuses: RouteStatus[]) => void;
};

export function RouteMap({ title = "Routes", selected, defaultSelected = null, onSelectedChange, statuses, defaultStatuses = [], onStatusesChange, ...props }: RouteMapProps) {
  const last = React.useRef<RouteItem | null>(null);
  const s = useControlled<string | null>(selected, defaultSelected, onSelectedChange ? (next) => onSelectedChange(next, last.current) : undefined);
  const f = useControlled<RouteStatus[]>(statuses, defaultStatuses, onStatusesChange);
  return h(RawRouteMap, {
    ...props,
    heading: title,
    selected: s.value,
    statuses: f.value,
    onTcSelectedChange: (ev: CustomEvent<RouteSelectedChange>) => {
      last.current = ev.detail.route;
      s.handler(ev.detail.selected, ev);
    },
    onTcStatusesChange: (ev: CustomEvent<RouteStatusesChange>) => f.handler(ev.detail.statuses, ev),
  });
}
