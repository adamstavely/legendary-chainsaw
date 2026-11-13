import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcBudgetAlerts, type BudgetAlert, type BudgetAlertsChange } from "../budget-alerts";
import { h, useControlled } from "./internal";

export type { BudgetAlert, BudgetAlertChannel, BudgetAlertsChange } from "../budget-alerts";

const RawBudgetAlerts = createComponent({
  tagName: "tc-budget-alerts",
  elementClass: TcBudgetAlerts,
  react: React,
  events: {
    onTcAlertsChange: "tc-alerts-change" as EventName<CustomEvent<BudgetAlertsChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawBudgetAlerts>;
type Owned = "heading" | "alerts" | "onTcAlertsChange" | "children";
export type BudgetAlertsProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** The alerts – controlled when given */
  alerts?: BudgetAlert[];
  /** The alerts on mount when `alerts` isn't controlled */
  defaultAlerts?: BudgetAlert[];
  /** An alert was moved, added or removed, or its channel or recipients changed */
  onAlertsChange?: (alerts: BudgetAlert[], change: BudgetAlertsChange["change"], id: string) => void;
};

const NONE: BudgetAlert[] = [];

export function BudgetAlerts({ title, alerts, defaultAlerts = NONE, onAlertsChange, ...props }: BudgetAlertsProps) {
  const last = React.useRef<BudgetAlertsChange | null>(null);
  const a = useControlled<BudgetAlert[]>(alerts, defaultAlerts, onAlertsChange ? (next) => onAlertsChange(next, last.current!.change, last.current!.id) : undefined);
  return h(RawBudgetAlerts, {
    ...props,
    heading: title ?? "Budget alerts",
    alerts: a.value,
    onTcAlertsChange: (e: CustomEvent<BudgetAlertsChange>) => {
      last.current = e.detail;
      a.handler(e.detail.alerts, e);
    },
  });
}
