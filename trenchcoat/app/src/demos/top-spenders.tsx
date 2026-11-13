import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { Spender } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* A fictional research institute's AI spend in October: teams, people, agents and API keys. */

/** A small deterministic noise, so the demo looks the same every time */
const noise = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};
const daily = (seed: number, level: number, rise = 0) => Array.from({ length: 30 }, (_, i) => Math.round(level * (0.6 + noise(seed + i) * 0.8) * (1 + (rise * i) / 30)));

const SPENDERS: Spender[] = [
  { id: "t-audit", name: "Audit", kind: "team", spend: 4210, change: 0.42, topModel: "large-1", daily: daily(1, 140, 0.8) },
  { id: "t-research", name: "Research", kind: "team", spend: 3080, change: -0.06, topModel: "large-1", daily: daily(2, 102) },
  { id: "t-ops", name: "Operations", kind: "team", spend: 1490, change: 0.03, topModel: "small-2", daily: daily(3, 50) },
  { id: "a-policy", name: "Policy Q&A", kind: "agent", spend: 2310, change: 0.18, topModel: "small-2", daily: daily(4, 77, 0.3) },
  { id: "a-invoice", name: "Invoice matcher", kind: "agent", spend: 1960, change: 0.71, topModel: "large-1", daily: daily(5, 65, 1.2) },
  { id: "a-report", name: "Report drafting", kind: "agent", spend: 1420, change: -0.12, topModel: "large-1", daily: daily(6, 47) },
  { id: "m-okafor", name: "Sam Okafor", kind: "member", spend: 640, change: 0.25, topModel: "large-1", daily: daily(7, 21) },
  { id: "m-lindqvist", name: "Ines Lindqvist", kind: "member", spend: 410, change: -0.3, topModel: "small-2", daily: daily(8, 14) },
  { id: "m-haddad", name: "Omar Haddad", kind: "member", spend: 280, change: 0, topModel: "small-2", daily: daily(9, 9) },
  ...Array.from({ length: 12 }, (_, i): Spender => ({ id: `m-${i}`, name: `Analyst ${i + 1}`, kind: "member", spend: 40 + Math.round(noise(20 + i) * 140), topModel: "small-2" })),
  { id: "k-ledger", name: "ledger-sync key", kind: "key", spend: 910, change: 1.4, topModel: "large-1", daily: daily(10, 30, 2) },
  { id: "k-intranet", name: "intranet-search key", kind: "key", spend: 360, change: -0.04, topModel: "small-2", daily: daily(11, 12) },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { TopSpenders } = ui;
  const [opened, setOpened] = useState<string | null>(null);
  return (
    <div style={{ width: "100%", maxWidth: 760, display: "grid", gap: 8 }}>
      <TopSpenders description="October · against September" spenders={SPENDERS} limit={6} onSpenderOpen={(_, s) => setOpened(s.name)} />
      <div style={{ ...caption, textAlign: "center" }}>{opened ? `Opened ${opened}.` : "Filter by kind, or open a spender to see where their spend went."}</div>
    </div>
  );
}
