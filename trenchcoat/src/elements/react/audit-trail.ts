import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcAuditTrail,
  type AuditActionChange,
  type AuditActorChange,
  type AuditExport,
  type AuditOutcomeChange,
  type AuditOutcomeFilter,
  type AuditQueryChange,
  type AuditRange,
  type AuditRangeChange,
} from "../audit-trail";
import { h, useControlled } from "./internal";

export type {
  AuditActionChange,
  AuditActorChange,
  AuditChange,
  AuditEvent,
  AuditExport,
  AuditOutcome,
  AuditOutcomeChange,
  AuditOutcomeFilter,
  AuditQueryChange,
  AuditRange,
  AuditRangeChange,
  AuditTrailLabels,
} from "../audit-trail";
export { auditChanges, auditCsv, auditCsvCell, defaultAuditTrailLabels } from "../audit-trail";

const RawAuditTrail = createComponent({
  tagName: "tc-audit-trail",
  elementClass: TcAuditTrail,
  react: React,
  events: {
    onTcQueryChange: "tc-query-change" as EventName<CustomEvent<AuditQueryChange>>,
    onTcExport: "tc-export" as EventName<CustomEvent<AuditExport>>,
    onTcActorChange: "tc-actor-change" as EventName<CustomEvent<AuditActorChange>>,
    onTcActionChange: "tc-action-change" as EventName<CustomEvent<AuditActionChange>>,
    onTcRangeChange: "tc-range-change" as EventName<CustomEvent<AuditRangeChange>>,
    onTcOutcomeChange: "tc-outcome-change" as EventName<CustomEvent<AuditOutcomeChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawAuditTrail>;
type Owned = "heading" | "actor" | "action" | "range" | "outcome" | "onTcActorChange" | "onTcActionChange" | "onTcRangeChange" | "onTcOutcomeChange" | "children";
export type AuditTrailProps = Omit<RawProps, Owned> & {
  /** The heading; by default "Audit trail" */
  title?: string;
  /** Only this person's events ("" for anyone) – controlled when given */
  actor?: string;
  /** The Person filter on mount when `actor` isn't controlled */
  defaultActor?: string;
  /** The Person filter changed */
  onActorChange?: (actor: string) => void;
  /** Only this action ("" for any) – controlled when given */
  action?: string;
  /** The Type filter on mount when `action` isn't controlled */
  defaultAction?: string;
  /** The Type filter changed */
  onActionChange?: (action: string) => void;
  /** The date range – controlled when given */
  range?: AuditRange;
  /** The Date filter on mount when `range` isn't controlled */
  defaultRange?: AuditRange;
  /** The Date filter changed */
  onRangeChange?: (range: AuditRange) => void;
  /** Which outcomes show – controlled when given */
  outcome?: AuditOutcomeFilter;
  /** The outcome filter on mount when `outcome` isn't controlled */
  defaultOutcome?: AuditOutcomeFilter;
  /** The outcome filter changed */
  onOutcomeChange?: (outcome: AuditOutcomeFilter) => void;
};

export function AuditTrail({
  title,
  actor,
  defaultActor = "",
  onActorChange,
  action,
  defaultAction = "",
  onActionChange,
  range,
  defaultRange = "all",
  onRangeChange,
  outcome,
  defaultOutcome = "all",
  onOutcomeChange,
  ...props
}: AuditTrailProps) {
  const a = useControlled<string>(actor, defaultActor, onActorChange);
  const t = useControlled<string>(action, defaultAction, onActionChange);
  const r = useControlled<AuditRange>(range, defaultRange, onRangeChange);
  const o = useControlled<AuditOutcomeFilter>(outcome, defaultOutcome, onOutcomeChange);
  return h(RawAuditTrail, {
    ...props,
    heading: title ?? "Audit trail",
    actor: a.value,
    action: t.value,
    range: r.value,
    outcome: o.value,
    onTcActorChange: (e: CustomEvent<AuditActorChange>) => a.handler(e.detail.actor, e),
    onTcActionChange: (e: CustomEvent<AuditActionChange>) => t.handler(e.detail.action, e),
    onTcRangeChange: (e: CustomEvent<AuditRangeChange>) => r.handler(e.detail.range, e),
    onTcOutcomeChange: (e: CustomEvent<AuditOutcomeChange>) => o.handler(e.detail.outcome, e),
  });
}
