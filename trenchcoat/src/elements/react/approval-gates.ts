import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcApprovalGates, type ApprovalGate, type GateDecide, type GatesChange, type GatesExpandedChange } from "../approval-gates";
import { h, useControlled } from "./internal";

export type { ApprovalGate, ApprovalGatesLabels, GateDecide, GateDecision, GateStatus, GatesChange } from "../approval-gates";
export { defaultApprovalGatesLabels } from "../approval-gates";

const RawApprovalGates = createComponent({
  tagName: "tc-approval-gates",
  elementClass: TcApprovalGates,
  react: React,
  events: {
    onTcDecide: "tc-decide" as EventName<CustomEvent<GateDecide>>,
    onTcGatesChange: "tc-gates-change" as EventName<CustomEvent<GatesChange>>,
    onTcExpandedChange: "tc-expanded-change" as EventName<CustomEvent<GatesExpandedChange>>,
  },
});
type RawApprovalGatesProps = React.ComponentProps<typeof RawApprovalGates>;
export type ApprovalGatesProps = Omit<RawApprovalGatesProps, "heading" | "gates" | "expanded" | "onTcDecide" | "onTcGatesChange" | "onTcExpandedChange" | "children"> & {
  /** The heading – "Approvals" by default */
  title?: string;
  /** The requests, in the order they should be decided. Controlled when defined; decisions come back through `onGatesChange` */
  gates?: ApprovalGate[];
  /** The requests at first, when `gates` isn't controlled */
  defaultGates?: ApprovalGate[];
  /** Called with every request after a decision went through, and the decision itself */
  onGatesChange?: (gates: ApprovalGate[], change: { gate: ApprovalGate; decision: GatesChange["decision"]; note: string }) => void;
  /** The decided row folded open, by gate id. Controlled when defined */
  expanded?: string | null;
  /** The row folded open at first, when `expanded` isn't controlled */
  defaultExpanded?: string | null;
  /** Called when a decided row is folded open (its id) or shut (null) */
  onExpandedChange?: (expanded: string | null) => void;
};

const NONE: ApprovalGate[] = [];

export function ApprovalGates({ title = "Approvals", gates, defaultGates = NONE, onGatesChange, expanded, defaultExpanded = null, onExpandedChange, ...props }: ApprovalGatesProps) {
  const change = React.useRef<GatesChange | null>(null);
  const g = useControlled(gates, defaultGates, onGatesChange ? (next) => onGatesChange(next, { gate: change.current!.gate, decision: change.current!.decision, note: change.current!.note }) : undefined);
  const x = useControlled(expanded, defaultExpanded, onExpandedChange);
  return h(RawApprovalGates, {
    ...props,
    heading: title,
    gates: g.value,
    expanded: x.value,
    onTcGatesChange: (e: CustomEvent<GatesChange>) => {
      change.current = e.detail;
      g.handler(e.detail.gates, e);
    },
    onTcExpandedChange: (e: CustomEvent<GatesExpandedChange>) => x.handler(e.detail.expanded, e),
  });
}
