import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcRiskRegister,
  type Risk,
  type RiskCell,
  type RiskCellChange,
  type RiskRisksChange,
  type RiskSelectedChange,
  type RiskSortChange,
  type RiskSortDir,
  type RiskSortKey,
} from "../risk-register";
import { h, useControlled } from "./internal";

export type {
  Risk,
  RiskBand,
  RiskCell,
  RiskLabels,
  RiskLevel,
  RiskSortDir,
  RiskSortKey,
  RiskStatus,
  RiskTrend,
} from "../risk-register";
export { defaultRiskLabels, riskBand, riskScore } from "../risk-register";

const RawRiskRegister = createComponent({
  tagName: "tc-risk-register",
  elementClass: TcRiskRegister,
  react: React,
  events: {
    onTcSelectedChange: "tc-selected-change" as EventName<
      CustomEvent<RiskSelectedChange>
    >,
    onTcCellChange: "tc-cell-change" as EventName<CustomEvent<RiskCellChange>>,
    onTcSortChange: "tc-sort-change" as EventName<CustomEvent<RiskSortChange>>,
    onTcRisksChange: "tc-risks-change" as EventName<
      CustomEvent<RiskRisksChange>
    >,
  },
});
type RawProps = React.ComponentProps<typeof RawRiskRegister>;
type Owned =
  | "heading"
  | "risks"
  | "selected"
  | "cell"
  | "sort"
  | "sortDir"
  | "onTcSelectedChange"
  | "onTcCellChange"
  | "onTcSortChange"
  | "onTcRisksChange"
  | "children";
export type RiskRegisterProps = Omit<RawProps, Owned> & {
  /** The heading, and the grid's name */
  title?: string;
  /** The risks – controlled when given: rescoring reports the next list through onRisksChange */
  risks?: Risk[];
  /** The risks on mount when `risks` isn't controlled */
  defaultRisks?: Risk[];
  /** A risk was rescored; `next` is the list as it will be */
  onRisksChange?: (next: Risk[], change: RiskRisksChange["change"]) => void;
  /** The risk whose detail is open – controlled when given */
  selected?: string | null;
  /** The risk open on mount when `selected` isn't controlled */
  defaultSelected?: string | null;
  /** A risk was opened or closed */
  onSelectedChange?: (selected: string | null, risk?: Risk) => void;
  /** The grid cell the register is filtered to – controlled when given */
  cell?: RiskCell | null;
  /** The filter on mount when `cell` isn't controlled */
  defaultCell?: RiskCell | null;
  /** The filter changed */
  onCellChange?: (cell: RiskCell | null) => void;
  /** The register's order – controlled when given */
  sort?: RiskSortKey;
  /** Which way – controlled with `sort` */
  sortDir?: RiskSortDir;
  /** The order changed */
  onSortChange?: (sort: RiskSortKey, sortDir: RiskSortDir) => void;
};

const NONE: Risk[] = [];

export function RiskRegister({
  title,
  risks,
  defaultRisks = NONE,
  onRisksChange,
  selected,
  defaultSelected = null,
  onSelectedChange,
  cell,
  defaultCell = null,
  onCellChange,
  sort,
  sortDir,
  onSortChange,
  ...props
}: RiskRegisterProps) {
  const list = useControlled<Risk[]>(risks, defaultRisks, undefined);
  const sel = useControlled<string | null>(
    selected,
    defaultSelected,
    undefined,
  );
  const c = useControlled<RiskCell | null>(cell, defaultCell, onCellChange);
  const [ownSort, setOwnSort] = React.useState<{
    sort: RiskSortKey;
    sortDir: RiskSortDir;
  }>({ sort: "score", sortDir: "desc" });
  const sortControlled = sort !== undefined;
  return h(RawRiskRegister, {
    ...props,
    heading: title ?? "Risk register",
    risks: list.value,
    selected: sel.value,
    cell: c.value,
    sort: sortControlled ? sort : ownSort.sort,
    sortDir: sortControlled ? (sortDir ?? "desc") : ownSort.sortDir,
    onTcRisksChange: (e: CustomEvent<RiskRisksChange>) => {
      onRisksChange?.(e.detail.risks, e.detail.change);
      list.handler(e.detail.risks, e);
    },
    onTcSelectedChange: (e: CustomEvent<RiskSelectedChange>) => {
      onSelectedChange?.(e.detail.selected, e.detail.risk);
      sel.handler(e.detail.selected, e);
    },
    onTcCellChange: (e: CustomEvent<RiskCellChange>) =>
      c.handler(e.detail.cell, e),
    onTcSortChange: (e: CustomEvent<RiskSortChange>) => {
      if (sortControlled) e.preventDefault();
      else setOwnSort({ sort: e.detail.sort, sortDir: e.detail.sortDir });
      onSortChange?.(e.detail.sort, e.detail.sortDir);
    },
  });
}
