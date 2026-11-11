import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcDecisionCard, type DecisionCardMade, type DecisionCardPositionChange, type DecisionCardUndo, type DecisionCardValueChange } from "../decision-card";
import { h, useControlled } from "./internal";

export type { DecisionCardKind, DecisionCardLabels, DecisionCardMade, DecisionCardOption, DecisionCardPositionChange, DecisionCardUndo, DecisionCardValueChange } from "../decision-card";
export { DECISION_CARD_OTHER, defaultDecisionCardLabels, waitedFor } from "../decision-card";

const RawDecisionCard = createComponent({
  tagName: "tc-decision-card",
  elementClass: TcDecisionCard,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<DecisionCardValueChange>>,
    onTcDecision: "tc-decision" as EventName<CustomEvent<DecisionCardMade>>,
    onTcDefer: "tc-defer" as EventName<CustomEvent<Record<string, never>>>,
    onTcUndo: "tc-undo" as EventName<CustomEvent<DecisionCardUndo>>,
    onTcPositionChange: "tc-position-change" as EventName<CustomEvent<DecisionCardPositionChange>>,
  },
});
type RawDecisionCardProps = React.ComponentProps<typeof RawDecisionCard>;

export type DecisionCardOwnProps = {
  /** The picked option's id ("other" for Something else). Controlled when defined – pass back what onValueChange reports */
  value?: string | null;
  /** The starting pick when uncontrolled */
  defaultValue?: string | null;
  /** An option was picked */
  onValueChange?: (value: string | null) => void;
  /** Which of the waiting decisions shows, from 0. Controlled when defined */
  position?: number;
  /** The starting position when uncontrolled */
  defaultPosition?: number;
  /** Previous or next in the queue */
  onPositionChange?: (position: number) => void;
  /** Whether it shows its receipt. Controlled when defined – set it after onDecision */
  sent?: boolean;
  /** Whether it starts sent when uncontrolled */
  defaultSent?: boolean;
  /** Send, Approve or Decline. Call event.preventDefault() to keep the card open */
  onDecision?: (decision: DecisionCardMade, event: Event) => void;
  /** Later or Escape */
  onDefer?: () => void;
  /** Undo on the receipt. Call event.preventDefault() to keep the receipt */
  onUndo?: (decision: DecisionCardMade, event: Event) => void;
};
export type DecisionCardProps = Omit<RawDecisionCardProps, keyof DecisionCardOwnProps | "onTcValueChange" | "onTcDecision" | "onTcDefer" | "onTcUndo" | "onTcPositionChange"> &
  DecisionCardOwnProps;

export function DecisionCard({ value, defaultValue = null, onValueChange, position, defaultPosition = 0, onPositionChange, sent, defaultSent = false, onDecision, onDefer, onUndo, ...props }: DecisionCardProps) {
  const v = useControlled(value, defaultValue, onValueChange);
  const p = useControlled(position, defaultPosition, onPositionChange);
  const s = useControlled(sent, defaultSent, undefined);
  return h(RawDecisionCard, {
    ...props,
    value: v.value,
    position: p.value,
    sent: s.value,
    onTcValueChange: (e: CustomEvent<DecisionCardValueChange>) => v.handler(e.detail.value, e),
    onTcPositionChange: (e: CustomEvent<DecisionCardPositionChange>) => p.handler(e.detail.position, e),
    onTcDecision: (e: CustomEvent<DecisionCardMade>) => {
      onDecision?.(e.detail, e);
      if (e.defaultPrevented) return;
      s.handler(true, e);
    },
    onTcUndo: (e: CustomEvent<DecisionCardUndo>) => {
      onUndo?.(e.detail.decision, e);
      if (e.defaultPrevented) return;
      s.handler(false, e);
    },
    onTcDefer: () => onDefer?.(),
  });
}
