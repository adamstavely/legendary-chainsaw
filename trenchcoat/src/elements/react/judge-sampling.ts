import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcJudgeSampling, type JudgeSamplingChange, type JudgeSamplingValue } from "../judge-sampling";
import { h, useControlled } from "./internal";

export type { JudgeEstimate, JudgeIncludeRule, JudgeModel, JudgeSamplingValue, JudgeSegment } from "../judge-sampling";
export { JUDGE_RATES, judgeEstimate, judgeRateStop } from "../judge-sampling";

const RawJudgeSampling = createComponent({
  tagName: "tc-judge-sampling",
  elementClass: TcJudgeSampling,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<JudgeSamplingChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawJudgeSampling>;
type Owned = "heading" | "value" | "defaultValue" | "onTcValueChange" | "children";
const EMPTY: JudgeSamplingValue = { rates: {}, include: {}, model: "" };
export type JudgeSamplingProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** The settings – controlled when given */
  value?: JudgeSamplingValue;
  /** The settings on mount when `value` isn't controlled */
  defaultValue?: JudgeSamplingValue;
  /** A rate, rule, model or the budget changed – with the whole value and the field, e.g. "rates.web" */
  onValueChange?: (value: JudgeSamplingValue, field: string) => void;
};

export function JudgeSampling({ title, value, defaultValue = EMPTY, onValueChange, ...props }: JudgeSamplingProps) {
  const v = useControlled<JudgeSamplingValue>(value, defaultValue, undefined);
  return h(RawJudgeSampling, {
    ...props,
    heading: title ?? "Judge sampling",
    value: v.value,
    onTcValueChange: (e: CustomEvent<JudgeSamplingChange>) => {
      v.handler(e.detail.value, e);
      onValueChange?.(e.detail.value, e.detail.field);
    },
  });
}
