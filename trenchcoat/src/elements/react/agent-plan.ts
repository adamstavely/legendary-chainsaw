import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcAgentPlan, type AgentPlanStep as PlanStep } from "../agent-plan";
import { h } from "./internal";

// The React module calls these PlanStep and PlanStepStatus; PlanStep is taken in this barrel by Plan vs Actual's
// wrapper, so they go by the element's names here
export type { AgentPlanStep, AgentPlanStepStatus } from "../agent-plan";

const RawAgentPlan = createComponent({
  tagName: "tc-agent-plan",
  elementClass: TcAgentPlan,
  react: React,
  events: {
    onTcStepsChange: "tc-steps-change" as EventName<CustomEvent<{ steps: PlanStep[] }>>,
    onTcCancel: "tc-cancel" as EventName<CustomEvent<null>>,
  },
});
type RawAgentPlanProps = React.ComponentProps<typeof RawAgentPlan>;
type Wrapped = "steps" | "heading" | "estimate" | "cancellable" | "retryable" | "rerunnable" | "runner" | "retrier" | "onChange" | "onTcStepsChange" | "onTcCancel";
export type AgentPlanProps = Omit<RawAgentPlanProps, Wrapped> & {
  /** The steps. Controlled when defined – pair with onChange; otherwise the component keeps them, starting from
   *  `defaultSteps`. Edits are reported to onChange either way */
  steps?: PlanStep[];
  /** Initial steps when uncontrolled */
  defaultSteps?: PlanStep[];
  /** Every edit during review: rename, remove, reorder, add */
  onChange?: (steps: PlanStep[]) => void;
  /** "Run plan" pressed – gets the steps in their final order. May return a promise: the button waits while it
   *  runs, and if it rejects the plan stays in review and says so */
  onRun?: (steps: PlanStep[]) => void | Promise<unknown>;
  /** Shows a "Cancel" button next to "Run plan" */
  onCancel?: () => void;
  /** Shows "Retry from here" on failed steps. May return a promise: the button waits, and says so if it rejects */
  onRetry?: (stepId: string) => void | Promise<unknown>;
  /** The goal of the plan, shown as the heading */
  title?: string;
  /** Estimated run time shown in review, e.g. "~2 min" */
  estimate?: string;
};

const NONE: PlanStep[] = [];

export function AgentPlan({ steps, defaultSteps = NONE, onChange, onRun, onCancel, onRetry, title, estimate, ...props }: AgentPlanProps) {
  // Uncontrolled: the element keeps the steps; the wrapper passes back the last ones it reported
  const last = React.useRef(defaultSteps);
  return h(RawAgentPlan, {
    ...props,
    steps: steps ?? last.current,
    heading: title ?? "",
    estimate: estimate ?? "",
    cancellable: !!onCancel,
    retryable: !!onRetry,
    rerunnable: !!onRun,
    runner: onRun,
    retrier: onRetry,
    onTcStepsChange: (e: CustomEvent<{ steps: PlanStep[] }>) => {
      if (steps !== undefined) e.preventDefault();
      else last.current = e.detail.steps;
      onChange?.(e.detail.steps);
    },
    onTcCancel: onCancel ? () => onCancel() : undefined,
  });
}
