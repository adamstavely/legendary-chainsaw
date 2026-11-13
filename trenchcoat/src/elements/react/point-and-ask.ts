import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcPointAndAsk, type PointAsk, type PointMark, type PointMarksChange, type PointQuestionChange } from "../point-and-ask";
import { h, useControlled } from "./internal";

export type { PointAndAskLabels, PointAsk, PointMark, PointMarksChange, PointQuestionChange } from "../point-and-ask";
export { defaultPointAndAskLabels } from "../point-and-ask";

const RawPointAndAsk = createComponent({
  tagName: "tc-point-and-ask",
  elementClass: TcPointAndAsk,
  react: React,
  events: {
    onTcMarksChange: "tc-marks-change" as EventName<CustomEvent<PointMarksChange>>,
    onTcQuestionChange: "tc-question-change" as EventName<CustomEvent<PointQuestionChange>>,
    onTcAsk: "tc-ask" as EventName<CustomEvent<PointAsk>>,
  },
});
type RawProps = React.ComponentProps<typeof RawPointAndAsk>;

export type PointAndAskOwnProps = {
  /** The title above the image */
  title?: string;
  /** The marks. Controlled when defined; otherwise the element keeps its own, starting at `defaultMarks` */
  marks?: PointMark[];
  /** Starting marks when uncontrolled */
  defaultMarks?: PointMark[];
  /** A mark was added, moved, resized, removed or given a question */
  onMarksChange?: (marks: PointMark[], reason: PointMarksChange["reason"]) => void;
  /** The question over all the marks. Controlled when defined */
  question?: string;
  /** Starting question when uncontrolled */
  defaultQuestion?: string;
  /** The overall question was edited */
  onQuestionChange?: (question: string) => void;
  /** Ask: every mark with its question. The element turns busy unless you call event.preventDefault() – pass `busy` to own it */
  onAsk?: (ask: PointAsk, event: Event) => void;
};
export type PointAndAskProps = Omit<RawProps, keyof PointAndAskOwnProps | "heading" | "onTcMarksChange" | "onTcQuestionChange" | "onTcAsk" | "children"> & PointAndAskOwnProps;

/** Pin or box parts of an image and ask about them – answers come back under each mark */
export function PointAndAsk({ title = "Ask about the image", marks, defaultMarks = [], onMarksChange, question, defaultQuestion = "", onQuestionChange, onAsk, ...props }: PointAndAskProps) {
  const reason = React.useRef<PointMarksChange["reason"]>("add");
  const m = useControlled(marks, defaultMarks, onMarksChange ? (next: PointMark[]) => onMarksChange(next, reason.current) : undefined);
  const q = useControlled(question, defaultQuestion, onQuestionChange);
  return h(RawPointAndAsk, {
    ...props,
    heading: title,
    marks: m.value,
    question: q.value,
    onTcMarksChange: (e: CustomEvent<PointMarksChange>) => {
      reason.current = e.detail.reason;
      m.handler(e.detail.marks, e);
    },
    onTcQuestionChange: (e: CustomEvent<PointQuestionChange>) => q.handler(e.detail.question, e),
    onTcAsk: (e: CustomEvent<PointAsk>) => onAsk?.(e.detail, e),
  });
}
