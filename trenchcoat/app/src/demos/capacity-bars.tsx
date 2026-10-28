import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { CapacityPerson } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* Researchers' allocations across topics at a fictional institute. "Move 0.3 FTE" shifts some of Arjun's wildfire
   work to Naomi, bringing him back within capacity. */

const START: CapacityPerson[] = [
  { id: "am", name: "Arjun Mehta", role: "Principal Investigator", capacity: 1, allocations: [{ id: "crm", label: "Climate Resilience Modeling", amount: 0.7 }, { id: "wps", label: "Wildfire Prediction Systems", amount: 0.5 }] },
  { id: "jt", name: "Jonah Tran", role: "Staff Scientist", capacity: 1, allocations: [{ id: "nc", label: "Neuromorphic Computing", amount: 0.7 }, { id: "aml", label: "Adversarial ML Robustness", amount: 0.3 }] },
  { id: "rb", name: "Rafael Brandt", role: "Staff Scientist", capacity: 1, allocations: [{ id: "cnm", label: "Carbon-Negative Materials", amount: 0.6 }, { id: "gse", label: "Grid-Scale Energy Storage", amount: 0.4 }] },
  { id: "ny", name: "Naomi Yusuf", role: "Postdoc", capacity: 1, allocations: [{ id: "asc", label: "Autonomous Swarm Coordination", amount: 0.4 }, { id: "eai", label: "Edge AI for Sensing", amount: 0.2 }] },
  { id: "sa", name: "Sofia Almeida", role: "Principal Investigator", capacity: 1, allocations: [{ id: "cnm", label: "Carbon-Negative Materials", amount: 0.5 }, { id: "gse", label: "Grid-Scale Energy Storage", amount: 0.4 }] },
  { id: "pr", name: "Priya Raman", role: "Principal Investigator", capacity: 0.8, allocations: [{ id: "qs", label: "Quantum Sensing", amount: 0.5 }] },
];
const MOVED: CapacityPerson[] = START.map((p) =>
  p.id === "am"
    ? { ...p, allocations: [{ id: "crm", label: "Climate Resilience Modeling", amount: 0.7 }, { id: "wps", label: "Wildfire Prediction Systems", amount: 0.2 }] }
    : p.id === "ny"
      ? { ...p, allocations: [...p.allocations, { id: "wps", label: "Wildfire Prediction Systems", amount: 0.3 }] }
      : p,
);

export default function Demo({ ui }: { ui: typeof UI }) {
  const { CapacityBars } = ui;
  const [moved, setMoved] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div style={{ width: "100%", maxWidth: 760, display: "grid", gap: 8 }}>
      <CapacityBars description="FY26 allocations by topic, in full-time equivalents." people={moved ? MOVED : START} selected={selected} onSelectedChange={setSelected} />
      <div style={{ ...caption, textAlign: "center" }}>
        Move along a bar with the arrow keys to read each topic.{" "}
        <button type="button" style={textButton} onClick={() => setMoved(!moved)}>
          {moved ? "Reset" : "Move 0.3 FTE of wildfire work to Naomi"}
        </button>
      </div>
    </div>
  );
}
