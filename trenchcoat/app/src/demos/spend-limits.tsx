import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { SpendLimit, SpendLimitTarget } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* Caps at a fictional research institute, partway through November. */

const LIMITS: SpendLimit[] = [
  { id: "t-audit", kind: "team", name: "Audit", limit: 2000, spent: 1640, period: "month", action: "warn" },
  { id: "t-research", kind: "team", name: "Research", limit: 3500, spent: 3720, period: "month", action: "notify" },
  { id: "m-jonah", kind: "member", name: "Jonah Tran", limit: 300, spent: 96, period: "month", action: "block" },
  { id: "k-ingest", kind: "key", name: "invoice-ingest (prod)", limit: 40, spent: 31.5, period: "day", action: "block" },
];

const TARGETS: SpendLimitTarget[] = [
  { kind: "member", id: "m-priya", name: "Priya Raman" },
  { kind: "member", id: "m-sofia", name: "Sofia Almeida" },
  { kind: "member", id: "m-jonah", name: "Jonah Tran" },
  { kind: "team", id: "t-operations", name: "Operations" },
  { kind: "key", id: "k-reports", name: "report-drafts (staging)" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { SpendLimits } = ui;
  const [limits, setLimits] = useState(LIMITS);
  const [log, setLog] = useState("");
  return (
    <div style={{ width: "100%", maxWidth: 760, display: "grid", gap: 8 }}>
      <SpendLimits
        description="Northfield Research Institute · caps reset on the 1st"
        limits={limits}
        onLimitsChange={(next, change, id) => {
          setLimits(next);
          setLog(`${change}: ${next.find((l) => l.id === id)?.name ?? id}`);
        }}
        defaultWorkspaceDefault={{ limit: 150, period: "month", action: "warn" }}
        targets={TARGETS}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {log || "Edit a cap, change what happens at the limit, or add one."}{" "}
        <button type="button" style={textButton} onClick={() => setLimits(LIMITS)}>
          Reset
        </button>
      </div>
    </div>
  );
}
