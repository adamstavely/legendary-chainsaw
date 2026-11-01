import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcApprovalChain, type ApprovalStep, type ApprovalStepsChange } from "../approval-chain";
import { h, useControlled } from "./internal";

export type { ApprovalChainLabels, ApprovalChange, ApprovalStep, ApprovalStepStatus, ApprovalStepsChange } from "../approval-chain";
export { defaultApprovalChainLabels } from "../approval-chain";

const RawApprovalChain = createComponent({
  tagName: "tc-approval-chain",
  elementClass: TcApprovalChain,
  react: React,
  events: { onTcStepsChange: "tc-steps-change" as EventName<CustomEvent<ApprovalStepsChange>> },
});
type RawProps = React.ComponentProps<typeof RawApprovalChain>;
type Owned = "heading" | "steps" | "onTcStepsChange" | "children";
export type ApprovalChainProps = Omit<RawProps, Owned> & {
  /** The heading; by default "Approvals" */
  title?: string;
  /** The sign-offs, in order – controlled when given */
  steps?: ApprovalStep[];
  /** The sign-offs on mount when `steps` isn't controlled */
  defaultSteps?: ApprovalStep[];
  /** Someone approved, declined or delegated */
  onStepsChange?: (steps: ApprovalStep[], detail: ApprovalStepsChange) => void;
};

const NONE: ApprovalStep[] = [];

export function ApprovalChain({ title, steps, defaultSteps = NONE, onStepsChange, ...props }: ApprovalChainProps) {
  const s = useControlled<ApprovalStep[]>(steps, defaultSteps, undefined);
  return h(RawApprovalChain, {
    ...props,
    heading: title ?? "Approvals",
    steps: s.value,
    onTcStepsChange: (e: CustomEvent<ApprovalStepsChange>) => {
      s.handler(e.detail.steps, e);
      onStepsChange?.(e.detail.steps, e.detail);
    },
  });
}
