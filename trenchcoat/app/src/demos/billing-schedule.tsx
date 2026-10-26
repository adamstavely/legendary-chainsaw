import { useCallback, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { CatalogItem, ScheduleLine } from "../../../src/elements/react";
import { caption } from "../demo-kit";

const catalog: CatalogItem[] = [
  { name: "Implementation fee", repeat: "once", price: 7500 },
  { name: "Analytics platform", repeat: "monthly", price: 2400 },
  { name: "Data connectors (5)", repeat: "monthly", price: 450 },
  { name: "Dedicated success manager", repeat: "quarterly", price: 3000 },
  { name: "Annual security review", repeat: "yearly", price: 5000 },
  { name: "Team training day", repeat: "once", price: 1800 },
];

const lines: ScheduleLine[] = [
  { id: "d1", kind: "product", name: "Implementation fee", repeat: "once", price: 7500, timing: "advance" },
  { id: "d2", kind: "product", name: "Analytics platform", repeat: "monthly", price: 2400, timing: "advance" },
  { id: "d3", kind: "product", name: "Data connectors (5)", repeat: "monthly", price: 450, timing: "arrears" },
  { id: "d4", kind: "discount", name: "Launch discount", percent: 10 },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { BillingSchedule } = ui;
  const [summary, setSummary] = useState<string | null>(null);
  // Stable callback: the component lists onChange in an effect's dependencies
  const onChange = useCallback(
    (s: { phase: string; start: string; duration: string; lines: ScheduleLine[] }) =>
      setSummary(`${s.phase} · starts ${s.start} · ${s.duration} · ${s.lines.length} lines`),
    [],
  );
  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 10 }}>
      <BillingSchedule
        title="Billing schedule"
        defaultPhase="Phase 1 · Ramp-up"
        currency="$"
        catalog={catalog}
        defaultLines={lines}
        defaultStart="2026-11-01"
        onChange={onChange}
      />
      {summary && <div style={{ ...caption, textAlign: "center" }}>{summary}</div>}
    </div>
  );
}
