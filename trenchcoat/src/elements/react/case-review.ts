import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcCaseReview, type CaseDecision, type CaseDecisionChange } from "../case-review";
import { h, useControlled } from "./internal";

export type { CaseDecision, CaseDecisionChange, CaseOption, CaseRead, CaseReviewLabels, CaseSeverity } from "../case-review";
export { defaultCaseOptions, defaultCaseReviewLabels } from "../case-review";

const RawCaseReview = createComponent({
  tagName: "tc-case-review",
  elementClass: TcCaseReview,
  react: React,
  events: { onTcDecisionChange: "tc-decision-change" as EventName<CustomEvent<CaseDecisionChange>> },
});
type RawProps = React.ComponentProps<typeof RawCaseReview>;
type Owned = "heading" | "decision" | "onTcDecisionChange" | "children";
export type CaseReviewProps = Omit<RawProps, Owned> & {
  /** The case's title */
  title?: string;
  /** The decision on record – controlled when given */
  decision?: CaseDecision | null;
  /** The decision on mount when `decision` isn't controlled */
  defaultDecision?: CaseDecision | null;
  /** A decision was recorded */
  onDecisionChange?: (decision: CaseDecision | null, detail: CaseDecisionChange) => void;
};

export function CaseReview({ title, decision, defaultDecision = null, onDecisionChange, ...props }: CaseReviewProps) {
  const d = useControlled<CaseDecision | null>(decision, defaultDecision, undefined);
  return h(RawCaseReview, {
    ...props,
    heading: title ?? "Case",
    decision: d.value,
    onTcDecisionChange: (e: CustomEvent<CaseDecisionChange>) => {
      d.handler(e.detail.decision, e);
      onDecisionChange?.(e.detail.decision, e.detail);
    },
  });
}
