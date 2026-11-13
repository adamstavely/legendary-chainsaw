import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { AnomalyCause, AnomalyEvidence, CostDay } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* A spend spike at a fictional research institute: a parser change made the invoice matcher retry every invoice. */

/** A small deterministic noise, so the demo looks the same every time */
const noise = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};
const DAY = 86_400_000;
const START = Date.UTC(2026, 10, 1);
const DAYS: CostDay[] = Array.from({ length: 14 }, (_, i) => {
  const expected = 400 + Math.round(Math.sin(i / 2) * 20);
  const spend = i === 13 ? 1640 : Math.round(expected * (0.88 + noise(i + 3) * 0.24));
  return { date: START + i * DAY, spend, expected, low: Math.round(expected * 0.85), high: Math.round(expected * 1.15) };
});

const CAUSES: AnomalyCause[] = [
  { id: "invoice", kind: "agent", name: "Invoice matcher", share: 0.78, note: "Retried every invoice up to 6 times after Thursday's parser change" },
  { id: "large-1", kind: "model", name: "large-1", share: 0.15, note: "Long contexts on the retries" },
  { id: "ledger", kind: "key", name: "ledger-sync key", share: 0.07 },
];

const EVIDENCE: AnomalyEvidence[] = [
  { id: "r1", label: "Run 8f2c · Invoice matcher", detail: "large-1 · 412k tokens · 6 retries", cost: 38, at: START + 13 * DAY + 9.5 * 3_600_000 },
  { id: "r2", label: "Run 77b1 · Invoice matcher", detail: "large-1 · 389k tokens · 6 retries", cost: 35, at: START + 13 * DAY + 10.2 * 3_600_000 },
  { id: "r3", label: "Run 0c9e · Invoice matcher", detail: "large-1 · 301k tokens · 5 retries", cost: 27, at: START + 13 * DAY + 11 * 3_600_000 },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { CostAnomaly } = ui;
  const [note, setNote] = useState<string | null>(null);
  return (
    <div style={{ width: "100%", maxWidth: 680, display: "grid", gap: 8 }}>
      <CostAnomaly
        description="Research institute workspace"
        days={DAYS}
        causes={CAUSES}
        evidence={EVIDENCE}
        locale="en-US"
        onSetLimit={(t) => setNote(`Set a limit on ${t?.name ?? "the workspace"}.`)}
        onInvestigate={() => setNote("Opened the spike's runs.")}
        onEvidenceOpen={(_, ev) => setNote(`Opened ${ev.label}.`)}
        onStatusChange={(s) => setNote(s === "expected" ? "Marked as expected." : "Back to open.")}
      />
      <div style={{ ...caption, textAlign: "center" }}>{note ?? "Show the chart as a table, open a run, or mark the spike as expected."}</div>
    </div>
  );
}
