import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcStepInspector, type InspectorStep, type StepChange, type StepTest } from "../step-inspector";
import { h, useControlled } from "./internal";

export type { InspectorStep, StepChange, StepInput, StepInputSource, StepRun, UpstreamOutput, UpstreamStep } from "../step-inspector";
export { resolveRef, stepInputMissing } from "../step-inspector";

const RawStepInspector = createComponent({
  tagName: "tc-step-inspector",
  elementClass: TcStepInspector,
  react: React,
  events: {
    onTcStepChange: "tc-step-change" as EventName<CustomEvent<StepChange>>,
    onTcTest: "tc-test" as EventName<CustomEvent<StepTest>>,
  },
});
type RawProps = React.ComponentProps<typeof RawStepInspector>;
type Owned = "heading" | "step" | "onTcStepChange" | "onTcTest" | "children";
export type StepInspectorProps = Omit<RawProps, Owned> & {
  /** The heading when no step is selected */
  title?: string;
  /** The step being edited – controlled when given (null for none) */
  step?: InspectorStep | null;
  /** The step on mount when `step` isn't controlled */
  defaultStep?: InspectorStep | null;
  /** The title or an input changed; `input` is the changed input's id */
  onStepChange?: (step: InspectorStep, detail: StepChange) => void;
  /** "Test with sample" was pressed – run the step and set `lastRun` */
  onTest?: (step: InspectorStep) => void;
};

export function StepInspector({ title, step, defaultStep = null, onStepChange, onTest, ...props }: StepInspectorProps) {
  const detail = React.useRef<StepChange | null>(null);
  const s = useControlled<InspectorStep | null>(step, defaultStep, onStepChange ? (next) => next && onStepChange(next, detail.current!) : undefined);
  return h(RawStepInspector, {
    ...props,
    heading: title ?? "Step",
    step: s.value,
    onTcStepChange: (e: CustomEvent<StepChange>) => {
      detail.current = e.detail;
      s.handler(e.detail.step, e);
    },
    onTcTest: (e: CustomEvent<StepTest>) => onTest?.(e.detail.step),
  });
}
