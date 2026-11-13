import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcSpendBreakdown,
  type SpendDimension,
  type SpendDimensionChange,
  type SpendPeriodChange,
  type SpendSliceSelect,
  type SpendView,
  type SpendViewChange,
} from "../spend-breakdown";
import { h, useControlled } from "./internal";

export type { SpendDimension, SpendEntry, SpendPeriod, SpendSlice, SpendView } from "../spend-breakdown";

const RawSpendBreakdown = createComponent({
  tagName: "tc-spend-breakdown",
  elementClass: TcSpendBreakdown,
  react: React,
  events: {
    onTcDimensionChange: "tc-dimension-change" as EventName<CustomEvent<SpendDimensionChange>>,
    onTcPeriodChange: "tc-period-change" as EventName<CustomEvent<SpendPeriodChange>>,
    onTcViewChange: "tc-view-change" as EventName<CustomEvent<SpendViewChange>>,
    onTcSliceSelect: "tc-slice-select" as EventName<CustomEvent<SpendSliceSelect>>,
  },
});
type RawProps = React.ComponentProps<typeof RawSpendBreakdown>;
type Owned = "heading" | "dimension" | "period" | "view" | "selected" | "onTcDimensionChange" | "onTcPeriodChange" | "onTcViewChange" | "onTcSliceSelect" | "children";
export type SpendBreakdownProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** What to split by – controlled when given */
  dimension?: SpendDimension;
  /** The dimension on mount when `dimension` isn't controlled */
  defaultDimension?: SpendDimension;
  /** The dimension was switched */
  onDimensionChange?: (dimension: SpendDimension) => void;
  /** The period's id – controlled when given */
  period?: string;
  /** The period on mount when `period` isn't controlled */
  defaultPeriod?: string;
  /** Another period was picked: pass that period's entries */
  onPeriodChange?: (period: string) => void;
  /** Ranked, daily or table – controlled when given */
  view?: SpendView;
  /** The view on mount when `view` isn't controlled */
  defaultView?: SpendView;
  /** The view was switched */
  onViewChange?: (view: SpendView) => void;
  /** The picked slice's id, or null for all – controlled when given */
  selected?: string | null;
  /** The picked slice on mount when `selected` isn't controlled */
  defaultSelected?: string | null;
  /** A slice was picked, or the pick cleared (null) */
  onSliceSelect?: (selected: string | null, dimension: SpendDimension) => void;
};

export function SpendBreakdown({
  title,
  dimension,
  defaultDimension = "model",
  onDimensionChange,
  period,
  defaultPeriod = "month",
  onPeriodChange,
  view,
  defaultView = "ranked",
  onViewChange,
  selected,
  defaultSelected = null,
  onSliceSelect,
  ...props
}: SpendBreakdownProps) {
  const d = useControlled<SpendDimension>(dimension, defaultDimension, onDimensionChange);
  const p = useControlled<string>(period, defaultPeriod, onPeriodChange);
  const v = useControlled<SpendView>(view, defaultView, onViewChange);
  const s = useControlled<string | null>(selected, defaultSelected, onSliceSelect ? (next) => onSliceSelect(next, d.value) : undefined);
  return h(RawSpendBreakdown, {
    ...props,
    heading: title ?? "AI spend",
    dimension: d.value,
    period: p.value,
    view: v.value,
    selected: s.value,
    onTcDimensionChange: (e: CustomEvent<SpendDimensionChange>) => {
      d.handler(e.detail.dimension, e);
      // Switching the dimension clears the pick
      if (!e.defaultPrevented && !s.controlled) s.handler(null, new Event("x"));
    },
    onTcPeriodChange: (e: CustomEvent<SpendPeriodChange>) => p.handler(e.detail.period, e),
    onTcViewChange: (e: CustomEvent<SpendViewChange>) => v.handler(e.detail.view, e),
    onTcSliceSelect: (e: CustomEvent<SpendSliceSelect>) => s.handler(e.detail.selected, e),
  });
}
