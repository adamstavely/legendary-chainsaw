import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcCorrectionPropagation, type CorrectionAction, type CorrectionCandidate, type CorrectionState, type CorrectionStatesChange } from "../correction-propagation";
import { h, useControlled } from "./internal";

export type { CorrectionCandidate, CorrectionCandidateKind, CorrectionState } from "../correction-propagation";

const RawCorrectionPropagation = createComponent({
  tagName: "tc-correction-propagation",
  elementClass: TcCorrectionPropagation,
  react: React,
  events: {
    onTcStatesChange: "tc-states-change" as EventName<CustomEvent<CorrectionStatesChange>>,
    onTcReview: "tc-review" as EventName<CustomEvent<CorrectionAction>>,
    onTcSupersede: "tc-supersede" as EventName<CustomEvent<CorrectionAction>>,
    onTcDismiss: "tc-dismiss" as EventName<CustomEvent<CorrectionAction>>,
  },
});
type RawProps = React.ComponentProps<typeof RawCorrectionPropagation>;
type Wrapped = "heading" | "states" | "onTcStatesChange" | "onTcReview" | "onTcSupersede" | "onTcDismiss";
export type CorrectionPropagationProps = Omit<RawProps, Wrapped> & {
  /** The heading, and the component's name */
  title?: string;
  /** Each item's state by id. Controlled when defined; otherwise the component keeps it, starting at `defaultStates` */
  states?: Record<string, CorrectionState>;
  /** The states when uncontrolled */
  defaultStates?: Record<string, CorrectionState>;
  /** Called with the whole new map, the item that changed and its new state */
  onStatesChange?: (states: Record<string, CorrectionState>, id: string, state: CorrectionState) => void;
  /** Review was pressed – open the item for a person to check */
  onReview?: (id: string, candidate: CorrectionCandidate) => void;
  /** Mark superseded was pressed */
  onSupersede?: (id: string, candidate: CorrectionCandidate) => void;
  /** Dismiss was pressed – the item doesn't rely on the claim */
  onDismiss?: (id: string, candidate: CorrectionCandidate) => void;
};

const NONE: Record<string, CorrectionState> = {};

export function CorrectionPropagation({ title, states, defaultStates = NONE, onStatesChange, onReview, onSupersede, onDismiss, ...props }: CorrectionPropagationProps) {
  const last = React.useRef<{ id: string; state: CorrectionState }>({ id: "", state: "pending" });
  const report = React.useCallback((next: Record<string, CorrectionState>) => onStatesChange?.(next, last.current.id, last.current.state), [onStatesChange]);
  const value = useControlled<Record<string, CorrectionState>>(states, defaultStates, report);
  return h(RawCorrectionPropagation, {
    ...props,
    heading: title ?? "Correction reach",
    states: value.value,
    onTcStatesChange: (e: CustomEvent<CorrectionStatesChange>) => {
      last.current = { id: e.detail.id, state: e.detail.state };
      value.handler(e.detail.states, e);
    },
    onTcReview: (e: CustomEvent<CorrectionAction>) => onReview?.(e.detail.id, e.detail.candidate),
    onTcSupersede: (e: CustomEvent<CorrectionAction>) => onSupersede?.(e.detail.id, e.detail.candidate),
    onTcDismiss: (e: CustomEvent<CorrectionAction>) => onDismiss?.(e.detail.id, e.detail.candidate),
  });
}
