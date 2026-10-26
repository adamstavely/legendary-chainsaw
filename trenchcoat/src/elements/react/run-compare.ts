import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcRunCompare, type RunComparePick, type RunCompareView, type RunCompareViewChange } from "../run-compare";
import { h, useControlled } from "./internal";

export { alignRunSteps } from "../run-compare";
export type { RunComparePick, RunCompareRun, RunCompareStep, RunCompareStepRow, RunCompareStepStatus, RunCompareView } from "../run-compare";

const RawRunCompare = createComponent({
  tagName: "tc-run-compare",
  elementClass: TcRunCompare,
  react: React,
  events: {
    onTcViewChange: "tc-view-change" as EventName<CustomEvent<RunCompareViewChange>>,
    onTcPick: "tc-pick" as EventName<CustomEvent<RunComparePick>>,
  },
});
type RawRunCompareProps = React.ComponentProps<typeof RawRunCompare>;

export type RunCompareProps = Omit<RawRunCompareProps, "heading" | "view" | "canPick" | "onTcViewChange" | "onTcPick"> & {
  /** The heading – e.g. the task both runs did */
  title?: string;
  /** The open tab. Controlled when defined; otherwise the component keeps it, starting from `defaultView` */
  view?: RunCompareView;
  defaultView?: RunCompareView;
  onViewChange?: (view: RunCompareView) => void;
  /** Shows "Use this" on each finished run */
  onPick?: (pick: RunComparePick) => void;
};

export function RunCompare({ title = "Compare runs", view, defaultView = "output", onViewChange, onPick, ...props }: RunCompareProps) {
  const v = useControlled<RunCompareView>(view, defaultView, onViewChange);
  return h(RawRunCompare, {
    ...props,
    heading: title,
    view: v.value,
    canPick: !!onPick,
    onTcViewChange: (e: CustomEvent<RunCompareViewChange>) => v.handler(e.detail.view, e),
    onTcPick: (e: CustomEvent<RunComparePick>) => onPick?.(e.detail),
  });
}
