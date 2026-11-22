import type * as UI from "../../../../src/elements/react";
import type { AuditEvent } from "../../../../src/elements/react";

/* The record behind a research institute's restricted data – with what each edit changed, before and after. Ranges are
   measured from the evening of 31 October, so "Today" and "Last 7 days" have something to show. */

const at = (day: number, hour: number, minute: number) => Date.UTC(2026, 9, day, hour, minute);
const EVENTS: AuditEvent[] = [
  { id: "1", at: at(31, 14, 22), actor: "Noor Haddad", action: "shared", target: "Trial 12 results with Biostatistics", detail: "Can view. 9 of 12 members can see it; 3 haven't completed data training." },
  { id: "2", at: at(31, 14, 21), actor: "Noor Haddad", action: "tried to share", target: "Trial 12 results with Inês Costa", outcome: "denied", detail: "Not authorized: needs the Restricted data agreement." },
  {
    id: "6",
    at: at(31, 11, 48),
    actor: "Priya Raman",
    action: "updated",
    target: "Trial 12 access policy",
    changes: [
      { field: "Who can view", before: "Biostatistics", after: "Biostatistics, Data Science" },
      { field: "Expires", after: "31 January 2027" },
      { field: "Download allowed", before: "Yes", after: "No" },
    ],
  },
  { id: "3", at: at(31, 9, 5), actor: "Tomás Rivera", action: "flagged", target: "Vendor contract 2041 as Legal hold", changes: [{ field: "Hold", after: "Legal hold" }] },
  { id: "4", at: at(30, 17, 40), actor: "Export service", action: "couldn't export", target: "Q3 reconciliation", outcome: "failed", detail: "The storage bucket refused the write. It'll try again at 18:00." },
  { id: "5", at: at(30, 11, 12), actor: "Sam Okafor", action: "opened", target: "Trial 9 results" },
  { id: "7", at: at(18, 16, 2), actor: "Priya Raman", action: "updated", target: "Trial 9 access policy", changes: [{ field: "Reviewer", before: "Sam Okafor", after: "Noor Haddad" }] },
  { id: "8", at: Date.UTC(2026, 8, 22, 10, 30), actor: "Tomás Rivera", action: "flagged", target: "Vendor contract 1988 as Legal hold" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AuditTrail } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 760 }}>
      <AuditTrail description="Restricted trial data" events={EVENTS} locale="en-GB" timeZone="UTC" now={at(31, 18, 0)} />
    </div>
  );
}
