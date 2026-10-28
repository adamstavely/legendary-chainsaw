import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { SlaRow, SlaSplit } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* A fictional legal operations team's service levels: how many requests were met, at risk or breached, per type,
   for the period picked. The numbers change with the period. */

type Period = { split: SlaSplit; rows: SlaRow[]; trend: number[] };
const DATA: Record<string, Period> = {
  "7d": {
    split: { met: 61, atRisk: 3, breached: 1 },
    rows: [
      { id: "review", label: "Review", met: 24, atRisk: 1, breached: 0 },
      { id: "approval", label: "Approval", met: 18, atRisk: 1, breached: 1 },
      { id: "clearance", label: "Clearance", met: 12, atRisk: 1, breached: 0 },
      { id: "language", label: "Language", met: 7, atRisk: 0, breached: 0 },
    ],
    trend: [0.92, 0.94],
  },
  "30d": {
    split: { met: 233, atRisk: 10, breached: 5 },
    rows: [
      { id: "review", label: "Review", met: 92, atRisk: 3, breached: 1 },
      { id: "approval", label: "Approval", met: 70, atRisk: 4, breached: 3 },
      { id: "clearance", label: "Clearance", met: 44, atRisk: 2, breached: 1 },
      { id: "language", label: "Language", met: 27, atRisk: 1, breached: 0 },
    ],
    trend: [0.89, 0.91, 0.93, 0.94],
  },
  "90d": {
    split: { met: 660, atRisk: 41, breached: 22 },
    rows: [
      { id: "review", label: "Review", met: 261, atRisk: 12, breached: 6 },
      { id: "approval", label: "Approval", met: 199, atRisk: 16, breached: 11 },
      { id: "clearance", label: "Clearance", met: 127, atRisk: 9, breached: 4 },
      { id: "language", label: "Language", met: 73, atRisk: 4, breached: 1 },
    ],
    trend: [0.86, 0.87, 0.88, 0.88, 0.9, 0.91, 0.91, 0.92, 0.93, 0.92, 0.94, 0.94],
  },
};

export default function Demo({ ui }: { ui: typeof UI }) {
  const { SlaStatus } = ui;
  const [period, setPeriod] = useState("30d");
  const d = DATA[period];
  return (
    <div style={{ width: "100%", maxWidth: 640, display: "grid", gap: 8 }}>
      <SlaStatus title="SLA performance" description="On-time delivery by request type." split={d.split} rows={d.rows} trend={d.trend} period={period} onPeriodChange={setPeriod} />
      <div style={{ ...caption, textAlign: "center" }}>Pick a period, or point at a segment to read it.</div>
    </div>
  );
}
