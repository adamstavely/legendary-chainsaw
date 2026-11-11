import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcStageBars, type StageBarsRangeChange, type StageBarsStage, type StageBarsStageChange, type StageBarsView, type StageBarsViewChange } from "../stage-bars";
import { h, useControlled } from "./internal";

export type { StageBarsLabels, StageBarsRange, StageBarsRangeChange, StageBarsStage, StageBarsStageChange, StageBarsView, StageBarsViewChange } from "../stage-bars";
export { defaultStageBarsLabels } from "../stage-bars";

const RawStageBars = createComponent({
  tagName: "tc-stage-bars",
  elementClass: TcStageBars,
  react: React,
  events: {
    onTcRangeChange: "tc-range-change" as EventName<CustomEvent<StageBarsRangeChange>>,
    onTcStageChange: "tc-stage-change" as EventName<CustomEvent<StageBarsStageChange>>,
    onTcViewChange: "tc-view-change" as EventName<CustomEvent<StageBarsViewChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawStageBars>;
type Owned = "heading" | "range" | "stage" | "view" | "onTcRangeChange" | "onTcStageChange" | "onTcViewChange" | "children";
export type StageBarsProps = Omit<RawProps, Owned> & {
  /** The heading, and the list's name */
  title?: string;
  /** The chosen range's id – controlled when given */
  range?: string;
  /** The range on mount when `range` isn't controlled – by default the first */
  defaultRange?: string;
  /** A period was picked */
  onRangeChange?: (range: string) => void;
  /** The picked stage's index, or null – controlled when given */
  stage?: number | null;
  /** The picked stage on mount when `stage` isn't controlled */
  defaultStage?: number | null;
  /** A stage was picked or let go */
  onStageChange?: (stage: number | null, item: StageBarsStage | null) => void;
  /** The list or the table – controlled when given */
  view?: StageBarsView;
  /** The view on mount when `view` isn't controlled */
  defaultView?: StageBarsView;
  /** The Table button was pressed */
  onViewChange?: (view: StageBarsView) => void;
};

export function StageBars({ title, range, defaultRange, onRangeChange, stage, defaultStage = null, onStageChange, view, defaultView = "chart", onViewChange, ...props }: StageBarsProps) {
  const r = useControlled<string | undefined>(range, defaultRange ?? props.ranges?.[0]?.id, onRangeChange as ((next: string | undefined) => void) | undefined);
  const item = React.useRef<StageBarsStage | null>(null);
  const s = useControlled<number | null>(stage, defaultStage, onStageChange ? (next) => onStageChange(next, item.current) : undefined);
  const v = useControlled<StageBarsView>(view, defaultView, onViewChange);
  return h(RawStageBars, {
    ...props,
    heading: title ?? "Stages",
    range: r.value,
    stage: s.value,
    view: v.value,
    onTcRangeChange: (e: CustomEvent<StageBarsRangeChange>) => r.handler(e.detail.range, e),
    onTcStageChange: (e: CustomEvent<StageBarsStageChange>) => {
      item.current = e.detail.item;
      s.handler(e.detail.stage, e);
    },
    onTcViewChange: (e: CustomEvent<StageBarsViewChange>) => v.handler(e.detail.view, e),
  });
}
