import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcScoreSurvey, type ScoreSurveyScoreChange, type ScoreSurveySubmit } from "../score-survey";
import { h, useControlled } from "./internal";

export { defaultScoreSurveyLabels, npsBand } from "../score-survey";
export type { NpsBand, ScoreSurveyFollowUps, ScoreSurveyKind, ScoreSurveyLabels, ScoreSurveySubmit } from "../score-survey";

const RawScoreSurvey = createComponent({
  tagName: "tc-score-survey",
  elementClass: TcScoreSurvey,
  react: React,
  events: {
    onTcScoreChange: "tc-score-change" as EventName<CustomEvent<ScoreSurveyScoreChange>>,
    onTcSubmit: "tc-submit" as EventName<CustomEvent<ScoreSurveySubmit>>,
    onTcEdit: "tc-edit" as EventName<CustomEvent<null>>,
    onTcDismiss: "tc-dismiss" as EventName<CustomEvent<null>>,
  },
});
type RawProps = React.ComponentProps<typeof RawScoreSurvey>;
type Owned = "heading" | "score" | "onTcScoreChange" | "onTcSubmit" | "onTcEdit" | "onTcDismiss" | "onSubmit" | "children";

export type ScoreSurveyProps = Omit<RawProps, Owned> & {
  /** The heading – defaults to "Your feedback" */
  title?: string;
  /** The answer. Controlled when defined (null for none); otherwise the component keeps it, starting from `defaultScore` */
  score?: number | null;
  /** The answer at first when `score` isn't controlled */
  defaultScore?: number | null;
  /** Called with the new score after every pick, controlled or not */
  onScoreChange?: (score: number | null) => void;
  /** Called when Submit or Skip is pressed – the score, the comment and the kind. Return false to stay on the question */
  onSubmit?: (answer: ScoreSurveySubmit) => void | boolean;
  /** Called when "Change answer" reopens a submitted answer – set `submitted` back to false if you control it */
  onEdit?: () => void;
  /** Called when the dismiss button is pressed – remove the survey */
  onDismiss?: () => void;
};

export function ScoreSurvey({ title = "Your feedback", score, defaultScore = null, onScoreChange, onSubmit, onEdit, onDismiss, ...props }: ScoreSurveyProps) {
  const s = useControlled<number | null>(score, defaultScore, onScoreChange);
  return h(RawScoreSurvey, {
    ...props,
    heading: title,
    score: s.value,
    onTcScoreChange: (e: CustomEvent<ScoreSurveyScoreChange>) => s.handler(e.detail.score, e),
    onTcSubmit: (e: CustomEvent<ScoreSurveySubmit>) => {
      if (onSubmit?.(e.detail) === false) e.preventDefault();
    },
    onTcEdit: () => onEdit?.(),
    onTcDismiss: () => onDismiss?.(),
  });
}
