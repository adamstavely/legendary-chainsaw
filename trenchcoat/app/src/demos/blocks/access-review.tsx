import { useState } from "react";
import type * as UI from "../../../../src/elements/react";
import type { AccessReviewItem } from "../../../../src/elements/react";
import { caption } from "../../demo-kit";

/* A research institute's quarterly review of who can reach restricted trial data. */

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 9, 31);
const ITEMS: AccessReviewItem[] = [
  { id: "a", name: "Noor Haddad", resource: "Trial 12 results", level: "Can edit", status: "authorized", lastUsed: NOW - 2 * DAY },
  { id: "b", name: "Inês Costa", resource: "Trial 12 results", level: "Can view", status: "unauthorized", reason: "The Restricted data agreement ended in August.", lastUsed: NOW - 70 * DAY },
  { id: "c", name: "Biostatistics", kind: "group", resource: "Trial 12 raw data", level: "Can view", status: "authorized", lastUsed: NOW - 9 * DAY },
  { id: "d", name: "Sam Okafor", resource: "Trial 9 results", level: "Can comment", status: "unverified", reason: "The entitlement service didn't answer." },
  { id: "e", name: "Tomás Rivera", resource: "Trial 9 results", level: "Can view", status: "authorized", lastUsed: NOW - 30 * DAY },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AccessReview } = ui;
  const [note, setNote] = useState("");
  return (
    <div style={{ width: "100%", maxWidth: 720, display: "grid", gap: 8 }}>
      <AccessReview title="Q4 access review" description="Restricted trial data, due November 14" items={ITEMS} locale="en-GB" onTcReviewSubmit={(e) => setNote(`Keeping ${e.detail.keep.length}, removing ${e.detail.remove.length}.`)} />
      <div style={{ ...caption, textAlign: "center" }}>{note || "Keep someone flagged to see it ask why, or settle the routine ones with Keep all authorized."}</div>
    </div>
  );
}
