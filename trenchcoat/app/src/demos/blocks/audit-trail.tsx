import type * as UI from "../../../../src/elements/react";
import type { AuditEvent } from "../../../../src/elements/react";

/* The record behind a research institute's restricted data. */

const at = (day: number, hour: number, minute: number) => Date.UTC(2026, 9, day, hour, minute);
const EVENTS: AuditEvent[] = [
  { id: "1", at: at(31, 14, 22), actor: "Noor Haddad", action: "shared", target: "Trial 12 results with Biostatistics", detail: "Can view. 9 of 12 members can see it; 3 haven't completed data training." },
  { id: "2", at: at(31, 14, 21), actor: "Noor Haddad", action: "tried to share", target: "Trial 12 results with Inês Costa", outcome: "denied", detail: "Not authorized: needs the Restricted data agreement." },
  { id: "3", at: at(31, 9, 5), actor: "Tomás Rivera", action: "flagged", target: "Vendor contract 2041 as Legal hold" },
  { id: "4", at: at(30, 17, 40), actor: "Export service", action: "couldn't export", target: "Q3 reconciliation", outcome: "failed", detail: "The storage bucket refused the write. It'll try again at 18:00." },
  { id: "5", at: at(30, 11, 12), actor: "Sam Okafor", action: "opened", target: "Trial 9 results" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AuditTrail } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 760 }}>
      <AuditTrail description="Restricted trial data" events={EVENTS} locale="en-GB" timeZone="UTC" />
    </div>
  );
}
