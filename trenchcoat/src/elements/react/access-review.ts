import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcAccessReview, type AccessReviewDecisions, type AccessReviewDecisionsChange, type AccessReviewFilter, type AccessReviewSubmit } from "../access-review";
import { h, useControlled } from "./internal";

export type { AccessReviewChoice, AccessReviewDecision, AccessReviewDecisions, AccessReviewDecisionsChange, AccessReviewFilter, AccessReviewItem, AccessReviewLabels, AccessReviewStatus, AccessReviewSubmit } from "../access-review";
export { defaultAccessReviewLabels } from "../access-review";

const RawAccessReview = createComponent({
  tagName: "tc-access-review",
  elementClass: TcAccessReview,
  react: React,
  events: {
    onTcDecisionsChange: "tc-decisions-change" as EventName<CustomEvent<AccessReviewDecisionsChange>>,
    onTcFilterChange: "tc-filter-change" as EventName<CustomEvent<{ filter: AccessReviewFilter }>>,
    onTcReviewSubmit: "tc-review-submit" as EventName<CustomEvent<AccessReviewSubmit>>,
  },
});
type RawProps = React.ComponentProps<typeof RawAccessReview>;
type Owned = "heading" | "decisions" | "onTcDecisionsChange" | "children";
export type AccessReviewProps = Omit<RawProps, Owned> & {
  /** The heading; by default "Access review" */
  title?: string;
  /** The decisions so far – controlled when given */
  decisions?: AccessReviewDecisions;
  /** The decisions on mount when `decisions` isn't controlled */
  defaultDecisions?: AccessReviewDecisions;
  /** A decision changed */
  onDecisionsChange?: (decisions: AccessReviewDecisions) => void;
};

const NONE: AccessReviewDecisions = {};

export function AccessReview({ title, decisions, defaultDecisions = NONE, onDecisionsChange, ...props }: AccessReviewProps) {
  const d = useControlled<AccessReviewDecisions>(decisions, defaultDecisions, onDecisionsChange);
  return h(RawAccessReview, { ...props, heading: title ?? "Access review", decisions: d.value, onTcDecisionsChange: (e: CustomEvent<AccessReviewDecisionsChange>) => d.handler(e.detail.decisions, e) });
}
