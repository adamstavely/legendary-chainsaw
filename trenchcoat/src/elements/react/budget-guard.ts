import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcBudgetGuard, type BudgetCapReach, type BudgetGuardState, type BudgetLimit, type BudgetLimitsChange, type BudgetStop } from "../budget-guard";
import { h, useControlled } from "./internal";

export type { BudgetGuardState, BudgetGuardStatus, BudgetLimit, BudgetLimitKind } from "../budget-guard";

const RawBudgetGuard = createComponent({
  tagName: "tc-budget-guard",
  elementClass: TcBudgetGuard,
  react: React,
  events: {
    onTcLimitsChange: "tc-limits-change" as EventName<CustomEvent<BudgetLimitsChange>>,
    onTcCapReach: "tc-cap-reach" as EventName<CustomEvent<BudgetCapReach>>,
    onTcStop: "tc-stop" as EventName<CustomEvent<BudgetStop>>,
  },
});
type RawBudgetGuardProps = React.ComponentProps<typeof RawBudgetGuard>;
type Wrapped = "limits" | "heading" | "onTcLimitsChange" | "onTcCapReach" | "onTcStop";
export type BudgetGuardProps = Omit<RawBudgetGuardProps, Wrapped> & {
  /** The limits – the first one is the big meter. Controlled when defined (a live run passes its numbers in): pair
   *  with onLimitsChange or onRaise and pass the raised cap back. Otherwise the component keeps them, starting from
   *  `defaultLimits` */
  limits?: BudgetLimit[];
  /** Initial limits when uncontrolled */
  defaultLimits?: BudgetLimit[];
  /** Every raise, with all the limits after it */
  onLimitsChange?: (limits: BudgetLimit[]) => void;
  /** A cap raised from the warning or the stop: the limit's id, its new cap and the one before */
  onRaise?: (id: string, cap: number, previous: number) => void;
  /** A limit reached its cap – halt the run */
  onCapReach?: (id: string, limit: BudgetLimit) => void;
  /** "Stop run" / "End run" pressed */
  onStop?: (state: BudgetGuardState) => void;
  /** The heading, and the region's name */
  title?: string;
};

const NONE: BudgetLimit[] = [];

export function BudgetGuard({ limits, defaultLimits = NONE, onLimitsChange, onRaise, onCapReach, onStop, title, ...props }: BudgetGuardProps) {
  const own = useControlled<BudgetLimit[]>(limits, defaultLimits, onLimitsChange);
  return h(RawBudgetGuard, {
    ...props,
    heading: title ?? "Run budget",
    limits: own.value,
    onTcLimitsChange: (e: CustomEvent<BudgetLimitsChange>) => {
      own.handler(e.detail.limits, e);
      onRaise?.(e.detail.id, e.detail.cap, e.detail.previous);
    },
    onTcCapReach: (e: CustomEvent<BudgetCapReach>) => onCapReach?.(e.detail.id, e.detail.limit),
    onTcStop: (e: CustomEvent<BudgetStop>) => onStop?.(e.detail.state),
  });
}
