import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { RunLogRun } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's agent runs over a morning: the invoice matcher on each new invoice, Policy Q&A on questions. */

const NOW = Date.UTC(2026, 10, 3, 11, 0);
const MIN = 60_000;
const people = ["R. Okafor", "M. Lindqvist", "A. Haddad", "J. Park"];
const RUNS: RunLogRun[] = [
  { id: "run_9a11", status: "running", agent: "Invoice matcher", trigger: "Webhook", startedAt: NOW - 1 * MIN, steps: 3, tokens: 9_400, cost: 0.06, user: "Accounts inbox" },
  { id: "run_9a07", status: "succeeded", agent: "Policy Q&A", trigger: "Chat", startedAt: NOW - 6 * MIN, duration: 4_200, steps: 2, tokens: 3_100, cost: 0.011, user: people[0] },
  { id: "run_9a02", status: "failed", agent: "Invoice matcher", trigger: "Webhook", startedAt: NOW - 14 * MIN, duration: 31_800, steps: 5, tokens: 41_200, cost: 0.29, user: "Accounts inbox", error: "Purchase order PO-2026-0418 not found in the ledger after 3 attempts" },
  { id: "run_99f8", status: "succeeded", agent: "Policy Q&A", trigger: "Chat", startedAt: NOW - 22 * MIN, duration: 5_100, steps: 3, tokens: 4_800, cost: 0.017, user: people[1] },
  { id: "run_99f1", status: "succeeded", agent: "Invoice matcher", trigger: "Webhook", startedAt: NOW - 38 * MIN, duration: 48_600, steps: 6, tokens: 52_900, cost: 0.33, user: "Accounts inbox" },
  { id: "run_99e4", status: "cancelled", agent: "Vendor risk monitor", trigger: "Schedule", startedAt: NOW - 61 * MIN, duration: 12_000, steps: 2, tokens: 6_000, cost: 0.04, user: people[2] },
  { id: "run_99d0", status: "failed", agent: "Vendor risk monitor", trigger: "Schedule", startedAt: NOW - 120 * MIN, duration: 2_400, steps: 1, tokens: 900, cost: 0.004, user: people[2], error: "Secret VENDOR_DB_TOKEN has expired" },
  { id: "run_99c2", status: "succeeded", agent: "Policy Q&A", trigger: "Chat", startedAt: NOW - 180 * MIN, duration: 3_900, steps: 2, tokens: 2_700, cost: 0.009, user: people[3] },
];
const ARRIVING: RunLogRun[] = [
  { id: "run_9a15", status: "running", agent: "Policy Q&A", trigger: "Chat", startedAt: NOW, steps: 1, tokens: 1_200, cost: 0.004, user: people[3] },
  { id: "run_9a14", status: "succeeded", agent: "Policy Q&A", trigger: "Chat", startedAt: NOW - 0.5 * MIN, duration: 3_300, steps: 2, tokens: 2_900, cost: 0.01, user: people[1] },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { RunLog } = ui;
  const [runs, setRuns] = useState(RUNS);
  const arrived = runs.length > RUNS.length;
  return (
    <div style={{ width: "100%", maxWidth: 820, display: "grid", gap: 8 }}>
      <RunLog description="Halden Research Institute · this morning" runs={runs} now={NOW} live defaultExpanded={["run_9a02"]} />
      <div style={{ ...caption, textAlign: "center" }}>
        Filter by status, agent or trigger, or open a failed run's error.{" "}
        <button type="button" style={textButton} onClick={() => setRuns(arrived ? RUNS : [...ARRIVING, ...RUNS])}>
          {arrived ? "Start over" : "Two runs arrive"}
        </button>
      </div>
    </div>
  );
}
