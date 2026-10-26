import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcDecisionInbox, type InboxDecision, type DecisionAnswer, type DecisionAnswersChange } from "../decision-inbox";
import { h, useControlled } from "./internal";

export type { InboxDecision, DecisionAnswer } from "../decision-inbox";

const NO_ANSWERS: Record<string, DecisionAnswer> = {};

const RawDecisionInbox = createComponent({
  tagName: "tc-decision-inbox",
  elementClass: TcDecisionInbox,
  react: React,
  events: {
    onTcAnswersChange: "tc-answers-change" as EventName<CustomEvent<DecisionAnswersChange>>,
    onTcDecide: "tc-decide" as EventName<CustomEvent<{ decision: InboxDecision; answer: DecisionAnswer }>>,
  },
});
type RawDecisionInboxProps = React.ComponentProps<typeof RawDecisionInbox>;
export type DecisionInboxProps = Omit<RawDecisionInboxProps, "answers" | "decide" | "onTcAnswersChange" | "onTcDecide"> & {
  /** The answers given so far, by decision id. Controlled when defined – pair it with `onAnswersChange` */
  answers?: Record<string, DecisionAnswer>;
  /** Answers already given on mount when `answers` isn't controlled – those rows start folded away */
  defaultAnswers?: Record<string, DecisionAnswer>;
  /** Called with every answer, controlled or not */
  onAnswersChange?: (answers: Record<string, DecisionAnswer>) => void;
  /**
   * Called with the decision and the chosen answer. Return a promise to hold the row until it settles: it answers on
   * success, and on a rejection says so and offers both buttons again
   */
  onDecide?: (decision: InboxDecision, answer: DecisionAnswer) => void | Promise<unknown>;
};
export function DecisionInbox({ answers, defaultAnswers = NO_ANSWERS, onAnswersChange, onDecide, ...props }: DecisionInboxProps) {
  const a = useControlled(answers, defaultAnswers, onAnswersChange);
  return h(RawDecisionInbox, {
    ...props,
    answers: a.value,
    decide: onDecide,
    onTcAnswersChange: (e: CustomEvent<DecisionAnswersChange>) => a.handler(e.detail.answers, e),
  });
}
