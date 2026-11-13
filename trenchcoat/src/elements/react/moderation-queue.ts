import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcModerationQueue,
  type ModerationDecide,
  type ModerationDecision,
  type ModerationDecisionsChange,
  type ModerationIndexChange,
  type ModerationItem,
  type ModerationUndo,
  type ModerationVerdict,
} from "../moderation-queue";
import { h, useControlled } from "./internal";

export type {
  ModerationDecide,
  ModerationDecision,
  ModerationDecisionLabels,
  ModerationDecisionsChange,
  ModerationIndexChange,
  ModerationItem,
  ModerationTurn,
  ModerationUndo,
  ModerationVerdict,
} from "../moderation-queue";
export { defaultModerationDecisionLabels } from "../moderation-queue";

const RawModerationQueue = createComponent({
  tagName: "tc-moderation-queue",
  elementClass: TcModerationQueue,
  react: React,
  events: {
    onTcDecide: "tc-decide" as EventName<CustomEvent<ModerationDecide>>,
    onTcDecisionsChange: "tc-decisions-change" as EventName<CustomEvent<ModerationDecisionsChange>>,
    onTcIndexChange: "tc-index-change" as EventName<CustomEvent<ModerationIndexChange>>,
    onTcUndo: "tc-undo" as EventName<CustomEvent<ModerationUndo>>,
  },
});
type Owned = "heading" | "index" | "decisions" | "onTcDecide" | "onTcDecisionsChange" | "onTcIndexChange" | "onTcUndo" | "children";
export type ModerationQueueProps = Omit<React.ComponentProps<typeof RawModerationQueue>, Owned> & {
  /** The heading */
  title?: string;
  /** The item on screen – controlled when given */
  index?: number;
  /** The item on screen at mount, when `index` isn't controlled */
  defaultIndex?: number;
  /** Called with the item that opened */
  onIndexChange?: (index: number) => void;
  /** Every decision so far – controlled when given */
  decisions?: Record<string, ModerationVerdict>;
  /** The decisions on mount, when `decisions` isn't controlled */
  defaultDecisions?: Record<string, ModerationVerdict>;
  /** Called with every decision so far, after a decision or Undo */
  onDecisionsChange?: (decisions: Record<string, ModerationVerdict>) => void;
  /** A decision was made; return false to refuse it (nothing is recorded) */
  onDecide?: (id: string, decision: ModerationDecision, note: string, item: ModerationItem) => void | boolean;
  /** Undo took a decision back; return false to keep it */
  onUndo?: (id: string, decision: ModerationDecision) => void | boolean;
};
const NONE: Record<string, ModerationVerdict> = {};

export function ModerationQueue({ title, index, defaultIndex = 0, onIndexChange, decisions, defaultDecisions = NONE, onDecisionsChange, onDecide, onUndo, ...props }: ModerationQueueProps) {
  const i = useControlled(index, defaultIndex, onIndexChange);
  const d = useControlled(decisions, defaultDecisions, onDecisionsChange);
  return h(RawModerationQueue, {
    ...props,
    heading: title ?? "Moderation",
    index: i.value,
    decisions: d.value,
    onTcIndexChange: (e: CustomEvent<ModerationIndexChange>) => i.handler(e.detail.index, e),
    onTcDecisionsChange: (e: CustomEvent<ModerationDecisionsChange>) => d.handler(e.detail.decisions, e),
    onTcDecide: (e: CustomEvent<ModerationDecide>) => {
      if (onDecide?.(e.detail.id, e.detail.decision, e.detail.note, e.detail.item) === false) e.preventDefault();
    },
    onTcUndo: (e: CustomEvent<ModerationUndo>) => {
      if (onUndo?.(e.detail.id, e.detail.decision) === false) e.preventDefault();
    },
  });
}
