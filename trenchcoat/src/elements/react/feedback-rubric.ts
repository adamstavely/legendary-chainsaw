import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcFeedbackRubric, type FeedbackRating, type FeedbackRubricSubmit, type FeedbackRubricValueChange } from "../feedback-rubric";
import { h, useControlled } from "./internal";

export { FEEDBACK_CRITERIA, FEEDBACK_FAILURES, FEEDBACK_LEVELS } from "../feedback-rubric";
export type { FeedbackFailureType, FeedbackRating, FeedbackRubricSubmit, RubricCriterion, RubricLevel } from "../feedback-rubric";

const RawFeedbackRubric = createComponent({
  tagName: "tc-feedback-rubric",
  elementClass: TcFeedbackRubric,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<FeedbackRubricValueChange>>,
    onTcSubmit: "tc-submit" as EventName<CustomEvent<FeedbackRubricSubmit>>,
    onTcEdit: "tc-edit" as EventName<CustomEvent<null>>,
  },
});
type RawFeedbackRubricProps = React.ComponentProps<typeof RawFeedbackRubric>;

export type FeedbackRubricProps = Omit<RawFeedbackRubricProps, "heading" | "value" | "defaultValue" | "onTcValueChange" | "onTcSubmit" | "onTcEdit" | "onChange" | "onSubmit"> & {
  /** The heading – defaults to "Rate this answer" */
  title?: string;
  /** The rating. Controlled when defined; otherwise the component keeps it, starting from `defaultValue` */
  value?: FeedbackRating;
  /** The rating at first when `value` isn't controlled */
  defaultValue?: FeedbackRating;
  /** Called with the new rating after every score, failure type or correction edit, controlled or not */
  onChange?: (value: FeedbackRating) => void;
  /** Called when Send is pressed with every required criterion scored – the rating, the answer and `meta`. Return
   *  false to keep the rubric editable */
  onSubmit?: (rating: FeedbackRubricSubmit) => void | boolean;
  /** Called when "Edit rating" unlocks a sent rating – set `sent` back to false if you control it */
  onEdit?: () => void;
};

const EMPTY: FeedbackRating = { scores: {}, failures: [], correction: null };

export function FeedbackRubric({ title = "Rate this answer", value, defaultValue = EMPTY, onChange, onSubmit, onEdit, ...props }: FeedbackRubricProps) {
  const v = useControlled<FeedbackRating>(value, defaultValue, onChange);
  return h(RawFeedbackRubric, {
    ...props,
    heading: title,
    value: v.value,
    onTcValueChange: (e: CustomEvent<FeedbackRubricValueChange>) => v.handler(e.detail.value, e),
    onTcSubmit: (e: CustomEvent<FeedbackRubricSubmit>) => {
      if (onSubmit?.(e.detail) === false) e.preventDefault();
    },
    onTcEdit: () => onEdit?.(),
  });
}
