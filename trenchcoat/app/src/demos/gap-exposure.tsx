import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ExposureGap } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* The open gaps across a research institute's portfolio: what's missing, which topic it blocks, whether any work is
   assigned and what's been put in so far. "Assign work" covers the climate dataset gap, so it leaves the exposure panel. */

const GAPS: ExposureGap[] = [
  { id: "g1", text: "On-chip learning rule that is local & stable is unproven at scale.", severity: "critical", item: "Neuromorphic Computing", priority: 1, work: 1, owner: "Elena Castellanos", budget: 900_000, fte: 1.2 },
  { id: "g2", text: "Memristor endurance data above 10⁸ cycles is missing.", severity: "high", item: "Neuromorphic Computing", priority: 1, work: 0, owner: "Jonah Tran" },
  { id: "g3", text: "Long-term durability of CO₂-cured concrete unverified.", severity: "high", item: "Carbon-Negative Materials", priority: 1, work: 0, owner: "Rafael Brandt" },
  { id: "g4", text: "No benchmark suite for energy-normalized accuracy on spiking nets.", severity: "high", item: "Neuromorphic Computing", priority: 1, work: 1, owner: "Marcus Okonkwo", budget: 600_000, fte: 1.5 },
  { id: "g5", text: "Reaction kinetics unknown for seawater-buffered routes.", severity: "high", item: "Carbon-Negative Materials", priority: 1, work: 1, owner: "Sofia Almeida", budget: 1_300_000, fte: 1.1 },
  { id: "g6", text: "No theory linking sparsity to generalization in SNNs.", severity: "medium", item: "Neuromorphic Computing", priority: 1, work: 0, owner: "Elena Castellanos" },
  { id: "g7", text: "No coupled flood–grid failure dataset exists.", severity: "critical", item: "Climate Resilience Modeling", priority: 2, work: 0, owner: "Arjun Mehta" },
  { id: "g8", text: "Cascading-failure model is uncalibrated.", severity: "critical", item: "Climate Resilience Modeling", priority: 2, work: 1, owner: "Arjun Mehta", budget: 700_000, fte: 0.8 },
  { id: "g9", text: "Downscaling pipeline misses the 6h latency target by 4×.", severity: "high", item: "Climate Resilience Modeling", priority: 2, work: 1, owner: "Arjun Mehta", budget: 600_000, fte: 0.5 },
  { id: "g10", text: "No field data for sensor drift past 18 months.", severity: "low", item: "Edge AI for Sensing", priority: 4, work: 2, owner: "Naomi Yusuf", budget: 150_000, fte: 0.3 },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { GapExposure } = ui;
  const [gaps, setGaps] = useState(GAPS);
  const [opened, setOpened] = useState("");
  const assigned = gaps.find((g) => g.id === "g7")?.work === 1;
  return (
    <div style={{ width: "100%", maxWidth: 820, display: "grid", gap: 8 }}>
      <GapExposure title="Gaps & coverage" description="Every open gap across the portfolio." gaps={gaps} onOpen={(_, gap) => setOpened(gap.text)} />
      <div style={{ ...caption, textAlign: "center" }}>
        {opened ? `Opened “${opened}” ` : "Switch the grouping, show only uncovered gaps, or open one. "}
        <button type="button" style={textButton} onClick={() => setGaps(assigned ? GAPS : gaps.map((g) => (g.id === "g7" ? { ...g, work: 1, budget: 250_000, fte: 0.4 } : g)))}>
          {assigned ? "Reset" : "Assign work to the flood–grid gap"}
        </button>
      </div>
    </div>
  );
}
