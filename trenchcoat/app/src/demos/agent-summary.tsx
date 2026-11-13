import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { AgentSummaryDay, AgentSummaryFailure } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* A fictional research institute's invoice matcher: two weeks of runs, fixed so the card is the same on every visit. */

const DAY = 86_400_000;
const END = Date.UTC(2026, 10, 12, 12);
const RUNS = [6, 7, 7, 5, 0, 0, 8, 7, 6, 7, 8, 0, 0, 9];
const FAILS = [0, 0, 1, 0, 0, 0, 0, 1, 0, 3, 4, 0, 0, 5];
const DAYS: AgentSummaryDay[] = RUNS.map((runs, i) => ({ date: END - (13 - i) * DAY, succeeded: runs - FAILS[i]!, failed: FAILS[i]! }));
const FAILURES: AgentSummaryFailure[] = [
  { id: "f1", at: END - 2 * 3_600_000, step: "Fetch purchase orders", error: "The purchase-order export timed out after 30 s." },
  { id: "f2", at: END - 26 * 3_600_000, step: "Fetch purchase orders", error: "The purchase-order export timed out after 30 s." },
  { id: "f3", at: END - 3 * DAY, step: "Match lines", error: "Invoice INV-2207 has a currency the ledger doesn't use (CHF)." },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AgentSummary } = ui;
  const [last, setLast] = useState<string | null>(null);
  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 8 }}>
      <AgentSummary
        name="Invoice matcher"
        description="Matches supplier invoices to purchase orders"
        status="failing"
        model="Model M"
        owner="Finance operations"
        liveVersion="v12"
        draftVersion="v13"
        tools={["Ledger search", "Purchase orders", "Email the buyer"]}
        days={DAYS}
        medianDuration={41_000}
        cost={12.8}
        failures={FAILURES}
        locale="en-GB"
        onAction={(action) => setLast(action)}
      />
      <div style={{ ...caption, textAlign: "center" }}>{last ? `Pressed ${last}.` : "Switch the chart to a table, or pause the agent."}</div>
    </div>
  );
}
