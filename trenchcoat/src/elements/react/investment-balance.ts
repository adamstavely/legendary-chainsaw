import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcInvestmentBalance, type InvestmentSelectedChange, type InvestmentTier } from "../investment-balance";
import { h, useControlled } from "./internal";

export type { InvestmentBalanceMark, InvestmentMeasure, InvestmentTier } from "../investment-balance";

const RawInvestmentBalance = createComponent({
  tagName: "tc-investment-balance",
  elementClass: TcInvestmentBalance,
  react: React,
  events: {
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<InvestmentSelectedChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawInvestmentBalance>;
type Owned = "heading" | "selected" | "onTcSelectedChange" | "children";
export type InvestmentBalanceProps = Omit<RawProps, Owned> & {
  /** The heading, and the list's name */
  title?: string;
  /** The selected tier's id – controlled when given (null for none) */
  selected?: string | null;
  /** The tier selected on mount when `selected` isn't controlled */
  defaultSelected?: string | null;
  /** A tier was selected or cleared; `tier` is the selected tier */
  onSelectedChange?: (selected: string | null, tier?: InvestmentTier) => void;
};

export function InvestmentBalance({ title, selected, defaultSelected = null, onSelectedChange, ...props }: InvestmentBalanceProps) {
  const tier = React.useRef<InvestmentTier | undefined>(undefined);
  const report = React.useCallback((next: string | null) => onSelectedChange?.(next, tier.current), [onSelectedChange]);
  const s = useControlled<string | null>(selected, defaultSelected, onSelectedChange ? report : undefined);
  return h(RawInvestmentBalance, {
    ...props,
    heading: title ?? "Investment vs priority",
    selected: s.value,
    onTcSelectedChange: (e: CustomEvent<InvestmentSelectedChange>) => {
      tier.current = e.detail.tier;
      s.handler(e.detail.selected, e);
    },
  });
}
