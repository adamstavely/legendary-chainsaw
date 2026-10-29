import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcSavedSearchAlerts, type AlertRun, type AlertsChange, type SearchAlert } from "../saved-search-alerts";
import { h, useControlled } from "./internal";

export type { AlertChange, AlertChannel, AlertFrequency, SearchAlert } from "../saved-search-alerts";

const RawSavedSearchAlerts = createComponent({
  tagName: "tc-saved-search-alerts",
  elementClass: TcSavedSearchAlerts,
  react: React,
  events: {
    onTcAlertsChange: "tc-alerts-change" as EventName<CustomEvent<AlertsChange>>,
    onTcRun: "tc-run" as EventName<CustomEvent<AlertRun>>,
    onTcOpen: "tc-open" as EventName<CustomEvent<AlertRun>>,
  },
});
type RawProps = React.ComponentProps<typeof RawSavedSearchAlerts>;
type Owned = "heading" | "alerts" | "onTcAlertsChange" | "onTcRun" | "onTcOpen" | "children";
export type SavedSearchAlertsProps = Omit<RawProps, Owned> & {
  /** The heading, and the list's name */
  title?: string;
  /** The alerts – controlled when given: every change reports the next list through onAlertsChange */
  alerts?: SearchAlert[];
  /** The alerts on mount when `alerts` isn't controlled */
  defaultAlerts?: SearchAlert[];
  /** An alert was added, changed, paused, removed or restored; `next` is the list as it will be */
  onAlertsChange?: (next: SearchAlert[], change: AlertsChange["change"]) => void;
  /** Run now was pressed */
  onRunAlert?: (alert: SearchAlert) => void;
  /** The new matches were asked for */
  onOpenMatches?: (alert: SearchAlert) => void;
};

const NONE: SearchAlert[] = [];

export function SavedSearchAlerts({ title, alerts, defaultAlerts = NONE, onAlertsChange, onRunAlert, onOpenMatches, ...props }: SavedSearchAlertsProps) {
  const list = useControlled<SearchAlert[]>(alerts, defaultAlerts, undefined);
  return h(RawSavedSearchAlerts, {
    ...props,
    heading: title ?? "Search alerts",
    alerts: list.value,
    onTcAlertsChange: (e: CustomEvent<AlertsChange>) => {
      onAlertsChange?.(e.detail.alerts, e.detail.change);
      list.handler(e.detail.alerts, e);
    },
    onTcRun: (e: CustomEvent<AlertRun>) => onRunAlert?.(e.detail.alert),
    onTcOpen: (e: CustomEvent<AlertRun>) => onOpenMatches?.(e.detail.alert),
  });
}
