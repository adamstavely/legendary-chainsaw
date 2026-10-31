import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcAuditTrail, type AuditExport, type AuditQueryChange } from "../audit-trail";
import { h } from "./internal";

export type { AuditEvent, AuditExport, AuditOutcome, AuditOutcomeFilter, AuditQueryChange, AuditTrailLabels } from "../audit-trail";
export { auditCsv, auditCsvCell, defaultAuditTrailLabels } from "../audit-trail";

const RawAuditTrail = createComponent({
  tagName: "tc-audit-trail",
  elementClass: TcAuditTrail,
  react: React,
  events: {
    onTcQueryChange: "tc-query-change" as EventName<CustomEvent<AuditQueryChange>>,
    onTcExport: "tc-export" as EventName<CustomEvent<AuditExport>>,
  },
});
type RawProps = React.ComponentProps<typeof RawAuditTrail>;
export type AuditTrailProps = Omit<RawProps, "heading" | "children"> & {
  /** The heading; by default "Audit trail" */
  title?: string;
};

export function AuditTrail({ title, ...props }: AuditTrailProps) {
  return h(RawAuditTrail, { ...props, heading: title ?? "Audit trail" });
}
