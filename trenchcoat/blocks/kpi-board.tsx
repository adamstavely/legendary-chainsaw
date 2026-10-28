"use client";

import type { ComponentPropsWithoutRef, ReactNode, Ref } from "react";
import { KpiBoard as KpiBoardElement } from "trenchcoat/react";

/*
 * KPI Board – the top of a dashboard: one date range for everything, three small trend cards, one large overview chart
 * that compares this period with the last, and a focus card for one product or plan. Hover any chart for the day under
 * the pointer; switch the range and every number rolls while the lines draw in again.
 * Built on the Trenchcoat element <tc-kpi-board> through `trenchcoat/react` (install `trenchcoat` and import its
 * tokens.css); this file keeps the block's React API: `range` / `defaultRange` / `onRangeChange`, the same for
 * `segment`, a React `icon`, `className`, DOM props and a `ref` on the root.
 */

export type KpiStat = {
  id: string;
  label: string;
  /** "money" runs the value through formatMoney, "count" shows a whole number */
  kind?: "money" | "count";
  /** One label per point, e.g. "17 Aug" */
  labels: string[];
  values: number[];
  /** Total of the period before – shown as the change on the right */
  previous?: number;
  /** Set when a smaller number is the good news, e.g. refunds */
  lowerIsBetter?: boolean;
};

export type KpiBoardData = {
  /** The small cards in the first row – three fit best */
  stats: KpiStat[];
  overview: {
    title: string;
    labels: string[];
    current: number[];
    previous: number[];
    /** The same two lines per segment id – picked with the filter inside this card, which changes nothing else */
    segments?: Record<string, { current: number[]; previous: number[] }>;
  };
  focus: {
    title: string;
    note?: string;
    /** What is counted, e.g. "Product sales rate" */
    metric: string;
    /** Word after the number, e.g. "items" */
    unit?: string;
    labels: string[];
    values: number[];
    /** Total of the period before */
    previous: number;
  };
};

type OwnProps = {
  /** One data set per range id */
  data: Record<string, KpiBoardData>;
  ranges: { id: string; label: string }[];
  /** Controlled range id */
  range?: string;
  defaultRange?: string;
  onRangeChange?: (id: string) => void;
  /** A filter inside the overview card, e.g. All items / Pro / Team – it only switches the overview's lines (see overview.segments) */
  segments?: { id: string; label: string }[];
  segment?: string;
  defaultSegment?: string;
  onSegmentChange?: (id: string) => void;
  /** Words after every change, e.g. "vs. last month" */
  compareLabel?: string;
  /** Names of the two lines in the overview tooltip */
  currentLabel?: string;
  previousLabel?: string;
  formatMoney?: (value: number) => string;
  /** Icon in the focus card */
  icon?: ReactNode;
  /** Heading on the left of the bar above the cards */
  title?: string;
  /** The small button at the top right of the focus card, e.g. Set up */
  setup?: { label: string; onClick: () => void };
  /** The button at the bottom of the focus card */
  action?: { label: string; onClick: () => void };
  className?: string;
  /** The root element, <tc-kpi-board> */
  ref?: Ref<HTMLDivElement>;
};

export type KpiBoardProps = Omit<ComponentPropsWithoutRef<"div">, keyof OwnProps> & OwnProps;

export function KpiBoard({ className, ref, ...props }: KpiBoardProps) {
  return <KpiBoardElement {...(props as Record<string, unknown>)} ref={ref as Ref<never>} className={["ui-kb", className].filter(Boolean).join(" ")} />;
}
