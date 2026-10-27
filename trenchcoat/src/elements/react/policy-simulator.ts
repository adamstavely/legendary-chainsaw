import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcPolicySimulator, type PolicySimInput, type PolicySimInputChange, type PolicySimResult, type PolicySimResultEvent, type PolicySimRun } from "../policy-simulator";
import { h, useControlled } from "./internal";

export type {
  PolicyDecision,
  PolicyMatchedRule,
  PolicyRuleClass,
  PolicySimExample,
  PolicySimInput,
  PolicySimResult,
  PolicyTraceOutcome,
  PolicyTraceStep,
} from "../policy-simulator";
export { defaultPolicyDecisionLabels, defaultPolicyRuleClasses } from "../policy-simulator";

const RawPolicySimulator = createComponent({
  tagName: "tc-policy-simulator",
  elementClass: TcPolicySimulator,
  react: React,
  events: {
    onTcInputChange: "tc-input-change" as EventName<CustomEvent<PolicySimInputChange>>,
    onTcSimulate: "tc-simulate" as EventName<CustomEvent<PolicySimRun>>,
    onTcResult: "tc-result" as EventName<CustomEvent<PolicySimResultEvent>>,
  },
});
type RawProps = React.ComponentProps<typeof RawPolicySimulator>;
type Owned = "heading" | "action" | "ruleClass" | "context" | "result" | "evaluate" | "onTcInputChange" | "onTcSimulate" | "onTcResult" | "onChange" | "defaultValue" | "children";
export type PolicySimulatorProps = Omit<RawProps, Owned> & {
  /** The heading, and the form's name */
  title?: string;
  /** The action, rule class and context – controlled when given */
  value?: Partial<PolicySimInput>;
  /** The inputs on mount when `value` isn't controlled */
  defaultValue?: Partial<PolicySimInput>;
  /** A field changed or an example filled the form */
  onChange?: (input: PolicySimInput, field: PolicySimInputChange["field"]) => void;
  /** Runs the dry run: return the result, or a promise of it */
  evaluate?: (input: PolicySimInput) => PolicySimResult | Promise<PolicySimResult>;
  /** The result shown – controlled when given; otherwise the last result `evaluate` returned */
  result?: PolicySimResult;
  /** Simulate was pressed. Return false to skip `evaluate` and set `result` yourself */
  onSimulate?: (input: PolicySimInput) => boolean | void;
  /** `evaluate` returned a result */
  onResult?: (result: PolicySimResult, input: PolicySimInput) => void;
};
const EMPTY: Partial<PolicySimInput> = {};

export function PolicySimulator({ title, value, defaultValue = EMPTY, onChange, evaluate, result, onSimulate, onResult, ...props }: PolicySimulatorProps) {
  const field = React.useRef<PolicySimInputChange["field"]>("action");
  const report = React.useCallback((next: Partial<PolicySimInput>) => onChange?.(next as PolicySimInput, field.current), [onChange]);
  const v = useControlled(value, defaultValue, onChange ? report : undefined);
  // The element keeps the result it got; kept here too, so a parent re-render doesn't clear it
  const [own, setOwn] = React.useState<PolicySimResult | undefined>(undefined);
  const shown = result ?? own;
  return h(RawPolicySimulator, {
    ...props,
    heading: title ?? "Policy simulator",
    action: v.value.action ?? "",
    ruleClass: v.value.ruleClass ?? "",
    context: v.value.context ?? "",
    ...(evaluate ? { evaluate } : {}),
    ...(shown ? { result: shown } : {}),
    onTcInputChange: (e: CustomEvent<PolicySimInputChange>) => {
      field.current = e.detail.field;
      v.handler(e.detail.input, e);
    },
    onTcSimulate: (e: CustomEvent<PolicySimRun>) => {
      if (onSimulate?.(e.detail.input) === false) e.preventDefault();
    },
    onTcResult: (e: CustomEvent<PolicySimResultEvent>) => {
      if (result === undefined) setOwn(e.detail.result);
      onResult?.(e.detail.result, e.detail.input);
    },
  });
}
