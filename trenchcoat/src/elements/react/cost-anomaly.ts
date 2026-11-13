import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcCostAnomaly, type AnomalyCause, type AnomalyEvidence, type AnomalyEvidenceOpen, type AnomalyStatus, type AnomalyStatusChange, type AnomalyTarget } from "../cost-anomaly";
import { h, useControlled } from "./internal";

export type { AnomalyCause, AnomalyCauseKind, AnomalyEvidence, AnomalyEvidenceOpen, AnomalyStatus, AnomalyStatusChange, AnomalyTarget, CostDay } from "../cost-anomaly";

const RawCostAnomaly = createComponent({
  tagName: "tc-cost-anomaly",
  elementClass: TcCostAnomaly,
  react: React,
  events: {
    onTcStatusChange: "tc-status-change" as EventName<CustomEvent<AnomalyStatusChange>>,
    onTcSetLimit: "tc-set-limit" as EventName<CustomEvent<AnomalyTarget>>,
    onTcInvestigate: "tc-investigate" as EventName<CustomEvent<AnomalyTarget>>,
    onTcEvidenceOpen: "tc-evidence-open" as EventName<CustomEvent<AnomalyEvidenceOpen>>,
  },
});
type RawProps = React.ComponentProps<typeof RawCostAnomaly>;
type Owned = "heading" | "status" | "onTcStatusChange" | "onTcSetLimit" | "onTcInvestigate" | "onTcEvidenceOpen" | "children";
export type CostAnomalyProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** "open" or "expected" – controlled when given */
  status?: AnomalyStatus;
  /** The status on mount, when `status` isn't controlled */
  defaultStatus?: AnomalyStatus;
  /** Marked as expected, or back to open */
  onStatusChange?: (status: AnomalyStatus) => void;
  /** Set a limit was pressed, for the likely cause */
  onSetLimit?: (target: AnomalyCause | null) => void;
  /** Investigate was pressed, for the likely cause */
  onInvestigate?: (target: AnomalyCause | null) => void;
  /** An evidence row was opened */
  onEvidenceOpen?: (id: string, evidence: AnomalyEvidence) => void;
};

export function CostAnomaly({ title, status, defaultStatus = "open", onStatusChange, onSetLimit, onInvestigate, onEvidenceOpen, ...props }: CostAnomalyProps) {
  const s = useControlled<AnomalyStatus>(status, defaultStatus, onStatusChange);
  return h(RawCostAnomaly, {
    ...props,
    heading: title ?? "Cost spike",
    status: s.value,
    onTcStatusChange: (e: CustomEvent<AnomalyStatusChange>) => s.handler(e.detail.status, e),
    onTcSetLimit: (e: CustomEvent<AnomalyTarget>) => onSetLimit?.(e.detail.target),
    onTcInvestigate: (e: CustomEvent<AnomalyTarget>) => onInvestigate?.(e.detail.target),
    onTcEvidenceOpen: (e: CustomEvent<AnomalyEvidenceOpen>) => onEvidenceOpen?.(e.detail.id, e.detail.evidence),
  });
}
