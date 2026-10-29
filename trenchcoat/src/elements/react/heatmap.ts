import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcHeatmap, type HeatmapCell, type HeatmapSelectedChange, type HeatmapView, type HeatmapViewChange } from "../heatmap";
import { h, useControlled } from "./internal";

export type { HeatmapCell, HeatmapScale, HeatmapSelectedChange, HeatmapView, HeatmapViewChange } from "../heatmap";

const RawHeatmap = createComponent({
  tagName: "tc-heatmap",
  elementClass: TcHeatmap,
  react: React,
  events: {
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<HeatmapSelectedChange>>,
    onTcViewChange: "tc-view-change" as EventName<CustomEvent<HeatmapViewChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawHeatmap>;
type Owned = "heading" | "selected" | "view" | "onTcSelectedChange" | "onTcViewChange" | "children";
export type HeatmapProps = Omit<RawProps, Owned> & {
  /** The heading, and the grid's name */
  title?: string;
  /** The selected cell – controlled when given (null for none) */
  selected?: HeatmapCell | null;
  /** The cell selected on mount when `selected` isn't controlled */
  defaultSelected?: HeatmapCell | null;
  /** A cell was selected or cleared; `value` is its value (null when it has no data) */
  onSelectedChange?: (selected: HeatmapCell | null, value?: number | null) => void;
  /** The chart or the table – controlled when given */
  view?: HeatmapView;
  /** The view on mount when `view` isn't controlled */
  defaultView?: HeatmapView;
  /** The Table button was pressed */
  onViewChange?: (view: HeatmapView) => void;
};

export function Heatmap({ title, selected, defaultSelected = null, onSelectedChange, view, defaultView = "chart", onViewChange, ...props }: HeatmapProps) {
  const value = React.useRef<number | null | undefined>(undefined);
  const report = React.useCallback((next: HeatmapCell | null) => onSelectedChange?.(next, value.current), [onSelectedChange]);
  const s = useControlled<HeatmapCell | null>(selected, defaultSelected, onSelectedChange ? report : undefined);
  const v = useControlled<HeatmapView>(view, defaultView, onViewChange);
  return h(RawHeatmap, {
    ...props,
    heading: title ?? "Heatmap",
    selected: s.value,
    view: v.value,
    onTcSelectedChange: (e: CustomEvent<HeatmapSelectedChange>) => {
      value.current = e.detail.value;
      s.handler(e.detail.selected, e);
    },
    onTcViewChange: (e: CustomEvent<HeatmapViewChange>) => v.handler(e.detail.view, e),
  });
}
