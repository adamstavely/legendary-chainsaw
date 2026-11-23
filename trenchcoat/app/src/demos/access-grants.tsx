import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { AccessGrant } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* What a fictional fraud-review team's assistant may reach, at Halvorsen Research Institute. The clock is fixed, so the
   thumbnail is the same every time; Renew here pushes a grant out by 90 days. */

const NOW = new Date(2026, 10, 12, 10, 30).getTime();
const DAY = 24 * 60 * 60 * 1000;

const GRANTS: AccessGrant[] = [
  {
    id: "cases-read",
    source: "Case files",
    scope: "Read cases in Team North",
    level: "read",
    grantedBy: "Priya Shah",
    grantedAt: NOW - 62 * DAY,
    lastUsedAt: NOW - 2 * 60 * 60 * 1000,
    changed: { since: NOW - 3 * DAY, what: "Now also reads attachments on those cases, including scanned statements." },
  },
  { id: "cases-notes", source: "Case files", scope: "Add notes to cases assigned to you", level: "write", grantedBy: "Priya Shah", grantedAt: NOW - 62 * DAY, lastUsedAt: NOW - DAY },
  { id: "ledger", source: "Payments ledger", scope: "Read transactions from the last 24 months", level: "read", grantedBy: "Marcus Lee", grantedAt: NOW - 85 * DAY, expiresAt: NOW + 3 * DAY, lastUsedAt: NOW - 5 * DAY },
  { id: "mail", source: "Team mailbox", scope: "Send requests for documents to account holders", level: "act", grantedBy: "Priya Shah", grantedAt: NOW - 20 * DAY, expiresAt: NOW + 40 * DAY },
  { id: "archive", source: "Records archive", scope: "Search closed cases from 2019–2023", level: "read", grantedBy: "Ana Ruiz", grantedAt: NOW - 120 * DAY, expiresAt: NOW - 4 * DAY, lastUsedAt: NOW - 30 * DAY },
  { id: "sheets", source: "Shared drive", scope: "Edit the weekly review tracker", level: "write", grantedBy: "Marcus Lee", grantedAt: NOW - 14 * DAY, expiresAt: NOW + 6 * DAY },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AccessGrants } = ui;
  const [grants, setGrants] = useState(GRANTS);
  return (
    <div style={{ width: "100%", maxWidth: 620, display: "grid", gap: 8 }}>
      <AccessGrants
        title="What the review assistant can reach"
        description="Fraud review · Team North"
        grants={grants}
        now={NOW}
        onRevoke={(g) => setGrants((list) => list.filter((x) => x.id !== g.id))}
        onRenew={(g) => setGrants((list) => list.map((x) => (x.id === g.id ? { ...x, expiresAt: NOW + 90 * DAY } : x)))}
        onDriftReview={(g, accepted) =>
          setGrants((list) => (accepted ? list.map((x) => (x.id === g.id ? { ...x, changed: undefined } : x)) : list.filter((x) => x.id !== g.id)))
        }
      />
      <div style={{ ...caption, textAlign: "center" }}>
        Review the changed grant, renew one that's running out, or revoke one.{" "}
        <button type="button" style={textButton} onClick={() => setGrants(GRANTS)}>
          Reset
        </button>
      </div>
    </div>
  );
}
