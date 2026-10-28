import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcAiSummary, type AiSummaryCiteOpen, type AiSummaryFeedback, type AiSummaryFeedbackValue, type AiSummaryLength, type AiSummaryLengthChange, type AiSummaryRetry } from "../ai-summary";
import { h, useControlled } from "./internal";

export type { AiSummaryCiteOpen, AiSummaryFeedbackValue, AiSummaryLength, AiSummaryPoint, AiSummarySource, AiSummarySourceKind, AiSummaryStatus } from "../ai-summary";
export { aiSummaryAgo } from "../ai-summary";

const RawAiSummary = createComponent({
  tagName: "tc-ai-summary",
  elementClass: TcAiSummary,
  react: React,
  events: {
    onTcSummarise: "tc-summarise" as EventName<CustomEvent<null>>,
    onTcRetry: "tc-retry" as EventName<CustomEvent<AiSummaryRetry>>,
    onTcLengthChange: "tc-length-change" as EventName<CustomEvent<AiSummaryLengthChange>>,
    onTcCiteOpen: "tc-cite-open" as EventName<CustomEvent<AiSummaryCiteOpen>>,
    onTcFeedback: "tc-feedback" as EventName<CustomEvent<AiSummaryFeedback>>,
    onTcCopy: "tc-copy" as EventName<CustomEvent<{ text: string }>>,
  },
});
type RawProps = React.ComponentProps<typeof RawAiSummary>;
type Owned = "heading" | "length" | "feedback" | "onCopy" | "children" | "onTcSummarise" | "onTcRetry" | "onTcLengthChange" | "onTcCiteOpen" | "onTcFeedback" | "onTcCopy";
export type AiSummaryProps = Omit<RawProps, Owned> & {
  /** The heading ("Summary" by default) */
  title?: string;
  /** Short or detailed – controlled when given */
  length?: AiSummaryLength;
  /** The length on mount when `length` isn't controlled */
  defaultLength?: AiSummaryLength;
  /** Short or Detailed was picked – summarise again */
  onLengthChange?: (length: AiSummaryLength) => void;
  /** Whether it helped – controlled when given ("up", "down" or null) */
  feedback?: AiSummaryFeedbackValue;
  /** The feedback on mount when `feedback` isn't controlled */
  defaultFeedback?: AiSummaryFeedbackValue;
  /** Helpful or not helpful was pressed, or taken back (null) */
  onFeedbackChange?: (value: AiSummaryFeedbackValue) => void;
  /** Summarise was pressed – start summarising */
  onSummarise?: () => void;
  /** Regenerate, Retry after an error, or Update when the sources have moved on */
  onRetry?: (reason: AiSummaryRetry["reason"]) => void;
  /** A citation chip was used; return false to keep a link to the source from opening */
  onCiteOpen?: (cite: AiSummaryCiteOpen) => boolean | void;
  /** Called with the copied text once the summary is on the clipboard */
  onCopy?: (text: string) => void;
};

export function AiSummary({ title, length, defaultLength = "short", onLengthChange, feedback, defaultFeedback = null, onFeedbackChange, onSummarise, onRetry, onCiteOpen, onCopy, ...props }: AiSummaryProps) {
  const l = useControlled<AiSummaryLength>(length, defaultLength, onLengthChange);
  const f = useControlled<AiSummaryFeedbackValue>(feedback, defaultFeedback, onFeedbackChange);
  return h(RawAiSummary, {
    ...props,
    heading: title ?? "Summary",
    length: l.value,
    feedback: f.value,
    onTcLengthChange: (e: CustomEvent<AiSummaryLengthChange>) => l.handler(e.detail.length, e),
    onTcFeedback: (e: CustomEvent<AiSummaryFeedback>) => f.handler(e.detail.value, e),
    onTcSummarise: () => onSummarise?.(),
    onTcRetry: (e: CustomEvent<AiSummaryRetry>) => onRetry?.(e.detail.reason),
    onTcCiteOpen: (e: CustomEvent<AiSummaryCiteOpen>) => {
      if (onCiteOpen?.(e.detail) === false) e.preventDefault();
    },
    onTcCopy: (e: CustomEvent<{ text: string }>) => onCopy?.(e.detail.text),
  });
}
