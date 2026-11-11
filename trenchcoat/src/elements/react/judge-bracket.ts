import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcJudgeBracket, type JudgeAccept, type JudgeAttempt, type JudgeMatch, type JudgeMatchChange } from "../judge-bracket";
import { h, useControlled } from "./internal";

export type { JudgeAttempt, JudgeBracketLabels, JudgeMatch, JudgeSlot, JudgeSlotState } from "../judge-bracket";

const RawJudgeBracket = createComponent({
  tagName: "tc-judge-bracket",
  elementClass: TcJudgeBracket,
  react: React,
  events: {
    onTcMatchChange: "tc-match-change" as EventName<CustomEvent<JudgeMatchChange>>,
    onTcAccept: "tc-accept" as EventName<CustomEvent<JudgeAccept>>,
  },
});
type RawProps = React.ComponentProps<typeof RawJudgeBracket>;

export type JudgeBracketOwnProps = {
  /** The heading – "Judge's bracket" by default */
  title?: string;
  /** The open match's key, "<round>-<match>" (both from 1), or null. Controlled when defined */
  match?: string | null;
  /** The open match when uncontrolled */
  defaultMatch?: string | null;
  /** A match was opened or closed, with its verdict if it has one */
  onMatchChange?: (match: string | null, item?: JudgeMatch) => void;
  /** The attempt in use. Controlled when defined */
  accepted?: string | null;
  /** The attempt in use when uncontrolled */
  defaultAccepted?: string | null;
  /** "Use this answer" was chosen on the champion */
  onAccept?: (id: string, attempt: JudgeAttempt) => void;
};
type Wrapped = keyof JudgeBracketOwnProps | "heading" | "onTcMatchChange" | "onTcAccept" | "children";
export type JudgeBracketProps = Omit<RawProps, Wrapped> & JudgeBracketOwnProps;

export function JudgeBracket({ title, match, defaultMatch = null, onMatchChange, accepted, defaultAccepted = null, onAccept, ...props }: JudgeBracketProps) {
  const last = React.useRef<JudgeMatch | undefined>(undefined);
  const report = React.useCallback((next: string | null) => onMatchChange?.(next, last.current), [onMatchChange]);
  const m = useControlled(match, defaultMatch, report);
  const a = useControlled(accepted, defaultAccepted, undefined);
  return h(RawJudgeBracket, {
    ...props,
    heading: title ?? "Judge's bracket",
    match: m.value,
    accepted: a.value,
    onTcMatchChange: (e: CustomEvent<JudgeMatchChange>) => {
      last.current = e.detail.item;
      m.handler(e.detail.match, e);
    },
    onTcAccept: (e: CustomEvent<JudgeAccept>) => {
      a.handler(e.detail.id, e);
      onAccept?.(e.detail.id, e.detail.attempt);
    },
  });
}
