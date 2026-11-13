import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcAiAnswer, type AnswerContinue, type AnswerFeedback, type AnswerRetry, type AnswerSource as AnswerSourceData } from "../ai-answer";
import { h, isNode, useControlled, useStaged } from "./internal";

export type { AnswerContinue, AnswerFeedback, AnswerInterruptReason, AnswerInterruption, AnswerRetry, AnswerUnavailable } from "../ai-answer";
/** A source: the icon may be a React node */
export type AnswerSource = Omit<AnswerSourceData, "icon"> & {
  /** A favicon or logo, ideally square */
  icon?: React.ReactNode;
};

const RawAIAnswer = createComponent({
  tagName: "tc-ai-answer",
  elementClass: TcAiAnswer,
  react: React,
  events: {
    onTcFeedbackChange: "tc-feedback-change" as EventName<CustomEvent<{ feedback: AnswerFeedback | null }>>,
    onTcFeedback: "tc-feedback" as EventName<CustomEvent<{ value: "up" | "down"; reason?: string }>>,
    onTcFollowUp: "tc-follow-up" as EventName<CustomEvent<{ question: string }>>,
    onTcStop: "tc-stop" as EventName<CustomEvent<null>>,
    onTcCopy: "tc-copy" as EventName<CustomEvent<{ text: string }>>,
    onTcContinue: "tc-continue" as EventName<CustomEvent<AnswerContinue>>,
    onTcRetry: "tc-retry" as EventName<CustomEvent<AnswerRetry>>,
  },
});
type RawAIAnswerProps = React.ComponentProps<typeof RawAIAnswer>;
export type AIAnswerProps = Omit<
  RawAIAnswerProps,
  "sources" | "feedback" | "animated" | "onCopy" | "onTcFeedbackChange" | "onTcFeedback" | "onTcFollowUp" | "onTcStop" | "onTcCopy" | "onTcContinue" | "onTcRetry"
> & {
  /** The sources the answer cites, numbered from 1 in the order given – [1] in the answer is the first */
  sources: AnswerSource[];
  /** Stream the text in; false shows it at once */
  animate?: boolean;
  /** The answer text – may grow while `streaming` is true */
  answer: string;
  /** Called with the follow-up question that was picked */
  onFollowUp?: (question: string) => void;
  /** Stop was pressed while the answer was being written */
  onStop?: () => void;
  /** A thumb up, or a thumbs down once its reason is picked */
  onFeedback?: (value: "up" | "down", reason?: string) => void;
  /** The verdict shown – controlled when defined (null: none) */
  feedback?: AnswerFeedback | null;
  /** The verdict on mount when `feedback` isn't controlled */
  defaultFeedback?: AnswerFeedback | null;
  /** Every change of the verdict, including clearing it and a new answer starting over */
  onFeedbackChange?: (feedback: AnswerFeedback | null) => void;
  /** Called with the copied text once the answer is on the clipboard */
  onCopy?: (text: string) => void;
  /** Continue on an interrupted answer – carry on streaming and clear `interrupted` */
  onContinue?: (reason: AnswerContinue["reason"]) => void;
  /** Retry an interrupted answer, or Try now / Use <fallback> while unavailable – clear the state and ask again */
  onRetry?: (retry: AnswerRetry) => void;
};

/** AI Answer – an assistant's answer with its sources, citation chips, actions, feedback and follow-ups; `interrupted` and `unavailable` are the page's to set and clear */
export function AIAnswer({ sources, animate = true, feedback, defaultFeedback = null, onFeedbackChange, onFeedback, onFollowUp, onStop, onCopy, onContinue, onRetry, ...props }: AIAnswerProps) {
  const { stage, els } = useStaged(sources.map((s, i) => [String(i), s.icon] as [string, React.ReactNode]).filter(([, icon]) => isNode(icon)));
  const data = React.useMemo(() => sources.map((s, i) => (isNode(s.icon) ? { ...s, icon: els[String(i)] } : s)) as AnswerSourceData[], [sources, els]);
  const f = useControlled(feedback, defaultFeedback, onFeedbackChange);
  return h(React.Fragment, null, stage, h(RawAIAnswer, {
    ...props,
    sources: data,
    animated: animate,
    feedback: f.value,
    onTcFeedbackChange: (e: CustomEvent<{ feedback: AnswerFeedback | null }>) => f.handler(e.detail.feedback, e),
    onTcFeedback: (e: CustomEvent<{ value: "up" | "down"; reason?: string }>) => onFeedback?.(e.detail.value, e.detail.reason),
    onTcFollowUp: (e: CustomEvent<{ question: string }>) => onFollowUp?.(e.detail.question),
    onTcStop: () => onStop?.(),
    onTcCopy: (e: CustomEvent<{ text: string }>) => onCopy?.(e.detail.text),
    // The page owns `interrupted` and `unavailable` when it passes them: it clears them, not the element
    onTcContinue: (e: CustomEvent<AnswerContinue>) => {
      if (props.interrupted !== undefined) e.preventDefault();
      onContinue?.(e.detail.reason);
    },
    onTcRetry: (e: CustomEvent<AnswerRetry>) => {
      if ((e.detail.from === "interrupted" ? props.interrupted : props.unavailable) !== undefined) e.preventDefault();
      onRetry?.(e.detail);
    },
  }));
}
