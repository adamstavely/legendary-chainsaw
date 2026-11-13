import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcRunEstimate, type RunEstimateResult, type RunEstimateCapChange, type RunEstimateSampleChange, type RunEstimateStart } from "../run-estimate";
import { h, useControlled } from "./internal";

export type { RunEstimateResult, RunEstimateBudgetState, RunEstimateColumn, RunEstimateInput, RunEstimateModel, RunEstimateStart } from "../run-estimate";
export { estimateRun, runTime } from "../run-estimate";

const RawRunEstimate = createComponent({
  tagName: "tc-run-estimate",
  elementClass: TcRunEstimate,
  react: React,
  events: {
    onTcSampleChange: "tc-sample-change" as EventName<CustomEvent<RunEstimateSampleChange>>,
    onTcCapChange: "tc-cap-change" as EventName<CustomEvent<RunEstimateCapChange>>,
    onTcStart: "tc-start" as EventName<CustomEvent<RunEstimateStart>>,
  },
});
type RawRunEstimateProps = React.ComponentProps<typeof RawRunEstimate>;
type Wrapped = "heading" | "sample" | "cap" | "onTcSampleChange" | "onTcCapChange" | "onTcStart" | "children";
export type RunEstimateProps = Omit<RawRunEstimateProps, Wrapped> & {
  /** The heading, and the region's name */
  title?: string;
  /** Run on a sample of rows first – controlled when given */
  sample?: boolean;
  /** Initial sample choice when uncontrolled */
  defaultSample?: boolean;
  /** Called with the next `sample` */
  onSampleChange?: (sample: boolean) => void;
  /** The spend cap, or null for none – controlled when given */
  cap?: number | null;
  /** Initial cap when uncontrolled */
  defaultCap?: number | null;
  /** Called with the next `cap` */
  onCapChange?: (cap: number | null) => void;
  /** Start was pressed, with what was chosen and the estimate of what runs. Return false to stop the announcement */
  onStart?: (start: RunEstimateStart, estimate: RunEstimateResult) => void | boolean;
};

export function RunEstimate({ title, sample, defaultSample = false, onSampleChange, cap, defaultCap = null, onCapChange, onStart, ...props }: RunEstimateProps) {
  const s = useControlled<boolean>(sample, defaultSample, onSampleChange);
  const c = useControlled<number | null>(cap, defaultCap, onCapChange);
  return h(RawRunEstimate, {
    ...props,
    heading: title ?? "Run estimate",
    sample: s.value,
    cap: c.value,
    onTcSampleChange: (e: CustomEvent<RunEstimateSampleChange>) => s.handler(e.detail.sample, e),
    onTcCapChange: (e: CustomEvent<RunEstimateCapChange>) => c.handler(e.detail.cap, e),
    onTcStart: (e: CustomEvent<RunEstimateStart>) => {
      if (onStart?.(e.detail, e.detail.estimate) === false) e.preventDefault();
    },
  });
}
