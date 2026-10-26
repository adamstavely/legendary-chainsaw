import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcClarifyingQuestions, type ClarifyingAnswers, type ClarifyingAnswersChange } from "../clarifying-questions";
import { h, useControlled } from "./internal";

export type { ClarifyingAnswer, ClarifyingAnswers, ClarifyingKind, ClarifyingOption, ClarifyingQuestion } from "../clarifying-questions";

const RawClarifyingQuestions = createComponent({
  tagName: "tc-clarifying-questions",
  elementClass: TcClarifyingQuestions,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<ClarifyingAnswersChange>>,
    onTcSend: "tc-send" as EventName<CustomEvent<ClarifyingAnswersChange>>,
  },
});
type RawClarifyingQuestionsProps = React.ComponentProps<typeof RawClarifyingQuestions>;

export type ClarifyingQuestionsOwnProps = {
  /** Names the questions, as the agent says it */
  title?: string;
  /** The answers, by question id. Controlled when defined – pass back what onChange reports */
  value?: ClarifyingAnswers;
  /** Starting answers when uncontrolled */
  defaultValue?: ClarifyingAnswers;
  /** An answer changed: every answer so far */
  onChange?: (value: ClarifyingAnswers) => void;
  /** Whether the answers have been sent. Controlled when defined – set it after onSend */
  sent?: boolean;
  /** Whether it starts as sent when uncontrolled */
  defaultSent?: boolean;
  /** Send, Enter on the last question, or Skip: every answer in one reply. Call event.preventDefault() to keep the questions open */
  onSend?: (value: ClarifyingAnswers, event: Event) => void;
};
export type ClarifyingQuestionsProps = Omit<RawClarifyingQuestionsProps, keyof ClarifyingQuestionsOwnProps | "heading" | "onTcValueChange" | "onTcSend"> & ClarifyingQuestionsOwnProps;

const NONE: ClarifyingAnswers = {};

export function ClarifyingQuestions({ title = "A few questions before I start", value, defaultValue = NONE, onChange, sent, defaultSent = false, onSend, ...props }: ClarifyingQuestionsProps) {
  const v = useControlled(value, defaultValue, onChange);
  const s = useControlled(sent, defaultSent, undefined);
  return h(RawClarifyingQuestions, {
    ...props,
    heading: title,
    value: v.value,
    sent: s.value,
    onTcValueChange: (e: CustomEvent<ClarifyingAnswersChange>) => v.handler(e.detail.value, e),
    onTcSend: (e: CustomEvent<ClarifyingAnswersChange>) => {
      onSend?.(e.detail.value, e);
      if (e.defaultPrevented) return;
      s.handler(true, e);
    },
  });
}
