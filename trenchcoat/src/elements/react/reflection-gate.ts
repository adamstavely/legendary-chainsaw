import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcReflectionGate,
  type ReflectionGatePhaseChange,
  type ReflectionGateSkip,
  type ReflectionGateSubmission,
  type ReflectionGateValue,
  type ReflectionGateValueChange,
  type ReflectionMode,
  type ReflectionPhase,
} from "../reflection-gate";
import { h, useControlled } from "./internal";

export { missingTerms } from "../reflection-gate";
export type {
  ReflectionClaim,
  ReflectionField,
  ReflectionGateLabels,
  ReflectionGateSubmission,
  ReflectionGateValue,
  ReflectionMode,
  ReflectionPhase,
} from "../reflection-gate";

const RawReflectionGate = createComponent({
  tagName: "tc-reflection-gate",
  elementClass: TcReflectionGate,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<ReflectionGateValueChange>>,
    onTcSubmit: "tc-submit" as EventName<CustomEvent<ReflectionGateSubmission>>,
    onTcSkip: "tc-skip" as EventName<CustomEvent<ReflectionGateSkip>>,
    onTcPhaseChange: "tc-phase-change" as EventName<CustomEvent<ReflectionGatePhaseChange>>,
  },
});
type RawReflectionGateProps = React.ComponentProps<typeof RawReflectionGate>;

export type ReflectionGateProps = Omit<
  RawReflectionGateProps,
  "mode" | "value" | "defaultValue" | "phase" | "heading" | "allowSkip" | "onChange" | "onSubmit" | "onTcValueChange" | "onTcSubmit" | "onTcSkip" | "onTcPhaseChange"
> & {
  /** Which prompt to show: intent, prior, reformulate or checkpoint */
  mode?: ReflectionMode;
  /** What the person wrote or picked (controlled). Leave it undefined to let the gate keep it, starting at `defaultValue` */
  value?: ReflectionGateValue;
  /** What the fields hold at first when uncontrolled */
  defaultValue?: ReflectionGateValue;
  /** Called with every edit, controlled or not */
  onChange?: (value: ReflectionGateValue) => void;
  /** Where the gate is (controlled): open, compare, done or skipped. Leave it undefined to let the gate move on its own */
  phase?: ReflectionPhase;
  /** The phase at first when uncontrolled – e.g. "done" for a reflection already on record */
  defaultPhase?: ReflectionPhase;
  /** Called whenever the gate moves on, controlled or not */
  onPhaseChange?: (phase: ReflectionPhase) => void;
  /** Called with the mode's fields once they pass their checks; return false to keep the gate open */
  onSubmit?: (submission: ReflectionGateSubmission) => boolean | void;
  /** Shows Skip and is called when it's pressed; return false to keep the gate open. Leave it out where skipping isn't allowed */
  onSkip?: (mode: ReflectionMode) => boolean | void;
  /** The heading – defaults to the mode's */
  title?: string;
};

const NO_VALUE: ReflectionGateValue = {};

export function ReflectionGate({ value, defaultValue = NO_VALUE, onChange, phase, defaultPhase = "open", onPhaseChange, onSubmit, onSkip, title = "", ...props }: ReflectionGateProps) {
  const v = useControlled(value, defaultValue, onChange);
  const p = useControlled(phase, defaultPhase, onPhaseChange);
  return h(RawReflectionGate, {
    ...props,
    heading: title,
    value: v.value,
    phase: p.value,
    allowSkip: !!onSkip,
    onTcValueChange: (e: CustomEvent<ReflectionGateValueChange>) => v.handler(e.detail.value, e),
    onTcPhaseChange: (e: CustomEvent<ReflectionGatePhaseChange>) => p.handler(e.detail.phase, e),
    onTcSubmit: (e: CustomEvent<ReflectionGateSubmission>) => {
      if (onSubmit?.(e.detail) === false) e.preventDefault();
    },
    onTcSkip: (e: CustomEvent<ReflectionGateSkip>) => {
      if (onSkip?.(e.detail.mode) === false) e.preventDefault();
    },
  });
}
