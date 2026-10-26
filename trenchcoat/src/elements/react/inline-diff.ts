import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcInlineDiff, type InlineDiffDecisions, type InlineDiffDecisionsChange, type InlineDiffHandle, type InlineDiffText } from "../inline-diff";
import { h, useControlled } from "./internal";

export { diffWords } from "../inline-diff";
export type { DiffSegment, InlineDiffDecisions, InlineDiffHandle, InlineDiffVerdict } from "../inline-diff";

const NO_DECISIONS: InlineDiffDecisions = {};

const RawInlineDiff = createComponent({
  tagName: "tc-inline-diff",
  elementClass: TcInlineDiff,
  react: React,
  events: {
    onTcDecisionsChange: "tc-decisions-change" as EventName<CustomEvent<InlineDiffDecisionsChange>>,
    onTcTextChange: "tc-text-change" as EventName<CustomEvent<InlineDiffText>>,
    onTcDone: "tc-done" as EventName<CustomEvent<InlineDiffText>>,
  },
});
type RawInlineDiffProps = React.ComponentProps<typeof RawInlineDiff>;
export type InlineDiffProps = Omit<RawInlineDiffProps, "decisions" | "onTcDecisionsChange" | "onTcTextChange" | "onTcDone" | "onChange" | "ref"> & {
  /** Called on every decision (and undo) with the text so far – pending changes keep the original words */
  onChange?: (text: string) => void;
  /** Called once no change is pending, with the final text */
  onDone?: (text: string) => void;
  /** The verdicts so far (controlled). New text resets them: an uncontrolled diff starts over, a controlled one
   *  reports `{}` through onDecisionsChange */
  decisions?: InlineDiffDecisions;
  /** The verdicts to start with when uncontrolled */
  defaultDecisions?: InlineDiffDecisions;
  /** Every decision, undo and reset, with all verdicts so far */
  onDecisionsChange?: (decisions: InlineDiffDecisions) => void;
  /** The imperative handle (the element implements it) */
  ref?: React.Ref<InlineDiffHandle>;
};
export function InlineDiff({ onChange, onDone, decisions, defaultDecisions = NO_DECISIONS, onDecisionsChange, ref, ...props }: InlineDiffProps) {
  const d = useControlled(decisions, defaultDecisions, onDecisionsChange);
  return h(RawInlineDiff, {
    ...props,
    ref: ref as React.Ref<TcInlineDiff>,
    decisions: d.value,
    onTcDecisionsChange: (e: CustomEvent<InlineDiffDecisionsChange>) => d.handler(e.detail.decisions, e),
    onTcTextChange: (e: CustomEvent<InlineDiffText>) => onChange?.(e.detail.text),
    onTcDone: (e: CustomEvent<InlineDiffText>) => onDone?.(e.detail.text),
  });
}
