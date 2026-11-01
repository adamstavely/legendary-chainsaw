import type * as UI from "../../../src/elements/react";
import type { ApprovalStep } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* A research institute signing off a data release. The demo's person is the one the chain is waiting on. */

const NOW = Date.UTC(2026, 9, 31);
const DAY = 86_400_000;
const STEPS: ApprovalStep[] = [
  { id: "a", name: "Tomás Rivera", role: "Principal investigator", status: "approved", decidedAt: NOW - 3 * DAY, note: "Checked against the protocol." },
  { id: "b", name: "Noor Haddad", role: "Data steward", status: "current", dueAt: NOW - DAY },
  { id: "c", name: "Maya Lindqvist", role: "Ethics board", status: "waiting", dueAt: NOW + 5 * DAY },
  { id: "d", name: "Kofi Mensah", role: "Director", status: "waiting" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ApprovalChain } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 520, display: "grid", gap: 8 }}>
      <ApprovalChain title="Data release sign-off" description="Trial 12 results" defaultSteps={STEPS} actor="Noor Haddad" delegates={["Inês Costa", "Sam Okafor"]} now={NOW} locale="en-GB" />
      <div style={{ ...caption, textAlign: "center" }}>Approve moves it on; Decline asks why, and the rest show as not reached.</div>
    </div>
  );
}
