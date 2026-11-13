import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcEvalCriteriaEditor, type EvalCriteriaChange, type EvalCriteriaTry, type JudgeCriterion } from "../eval-criteria-editor";
import { h, useControlled } from "./internal";

export { criteriaProblems, judgePrompt, weightShares } from "../eval-criteria-editor";
export type { EvalCriteriaProblem, EvalCriteriaTry, JudgeCriterion, JudgeCriterionType, JudgeExample } from "../eval-criteria-editor";

const RawEvalCriteriaEditor = createComponent({
  tagName: "tc-eval-criteria-editor",
  elementClass: TcEvalCriteriaEditor,
  react: React,
  events: {
    onTcCriteriaChange: "tc-criteria-change" as EventName<CustomEvent<EvalCriteriaChange>>,
    onTcTry: "tc-try" as EventName<CustomEvent<EvalCriteriaTry>>,
    onTcPromptCopy: "tc-prompt-copy" as EventName<CustomEvent<{ prompt: string }>>,
  },
});
type RawProps = React.ComponentProps<typeof RawEvalCriteriaEditor>;

export type EvalCriteriaEditorProps = Omit<RawProps, "heading" | "criteria" | "onTcCriteriaChange" | "onTcTry" | "onTcPromptCopy"> & {
  /** The heading – defaults to "Judge criteria" */
  title?: string;
  /** The criteria. Controlled when defined; otherwise kept by the component from `defaultCriteria` */
  criteria?: JudgeCriterion[];
  /** On mount, when `criteria` isn't controlled */
  defaultCriteria?: JudgeCriterion[];
  /** Called with the next `criteria` */
  onCriteriaChange?: (criteria: JudgeCriterion[]) => void;
  /** Called by "Try on sample" when nothing is wrong, with the assembled prompt */
  onTry?: (criteria: JudgeCriterion[], prompt: string) => void;
  /** Called when the judge prompt is copied. Return false to stop the copy */
  onPromptCopy?: (prompt: string) => void | boolean;
};

const NONE: JudgeCriterion[] = [];

export function EvalCriteriaEditor({ title = "Judge criteria", criteria, defaultCriteria = NONE, onCriteriaChange, onTry, onPromptCopy, ...props }: EvalCriteriaEditorProps) {
  const c = useControlled<JudgeCriterion[]>(criteria, defaultCriteria, onCriteriaChange);
  return h(RawEvalCriteriaEditor, {
    ...props,
    heading: title,
    criteria: c.value,
    onTcCriteriaChange: (e: CustomEvent<EvalCriteriaChange>) => c.handler(e.detail.criteria, e),
    onTcTry: (e: CustomEvent<EvalCriteriaTry>) => onTry?.(e.detail.criteria, e.detail.prompt),
    onTcPromptCopy: (e: CustomEvent<{ prompt: string }>) => {
      if (onPromptCopy?.(e.detail.prompt) === false) e.preventDefault();
    },
  });
}
