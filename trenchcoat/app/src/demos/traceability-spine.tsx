import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { SpineNode, SpineStage } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A fictional research institute's neuromorphic computing topic: the questions it set out to answer, the gaps in the
   way, the work against them, the papers that came out and who cited them. Pick a card to trace its path. */

const STAGES: SpineStage[] = [
  { id: "question", label: "Questions", noun: ["question", "questions"] },
  { id: "gap", label: "Gaps", noun: ["gap", "gaps"] },
  { id: "work", label: "Work in flight", noun: ["work item", "work items"] },
  { id: "paper", label: "Papers", noun: ["paper", "papers"] },
  { id: "cited", label: "Cited by", noun: ["citing work", "citing works"], more: 80 },
];

const NODES: SpineNode[] = [
  { id: "q1", stage: "question", title: "Can spiking architectures match transformer accuracy at under 1% of the energy?", status: "Open", links: ["g1", "g4"] },
  { id: "q2", stage: "question", title: "Which memristor materials hold state past 10⁹ cycles?", status: "Partial", tone: "warning", links: ["g3"] },
  { id: "q3", stage: "question", title: "How do we train on-chip without a backprop pass?", status: "Open", links: ["g2"] },
  { id: "q4", stage: "question", title: "Is there a compiler path from PyTorch to neuromorphic substrates?", status: "Answered", tone: "success", links: ["g5"] },
  { id: "g1", stage: "gap", title: "No benchmark suite for energy-normalised accuracy on spiking nets.", status: "High", tone: "warning", links: ["w1"] },
  { id: "g2", stage: "gap", title: "A local, stable on-chip learning rule is unproven at scale.", status: "Critical", tone: "danger", links: ["w2"] },
  { id: "g3", stage: "gap", title: "Memristor endurance data above 10⁸ cycles is missing.", status: "High", tone: "warning", flag: "Uncovered" },
  { id: "g4", stage: "gap", title: "No theory links sparsity to generalisation in spiking nets.", status: "Medium", flag: "Uncovered" },
  { id: "g5", stage: "gap", title: "The toolchain lacks quantisation-aware mapping.", status: "Medium", links: ["w3", "w4"] },
  { id: "w1", stage: "work", title: "NeuroBench-E harness", status: "Active", tone: "info", progress: 0.6, people: ["Jonah Tran", "Elena Castellanos"], links: ["p1"] },
  { id: "w2", stage: "work", title: "Local plasticity learning rule", status: "Blocked", tone: "danger", progress: 0.35, people: ["Elena Castellanos"] },
  { id: "w3", stage: "work", title: "PyTorch → substrate compiler", status: "In review", tone: "warning", progress: 0.9, people: ["Marcus Okonkwo"], links: ["p2"] },
  { id: "w4", stage: "work", title: "Quantisation-aware mapping", status: "Active", tone: "info", progress: 0.5, people: ["Jonah Tran"] },
  { id: "p1", stage: "paper", title: "Sparse spiking networks approach dense accuracy at 40× lower energy", kind: "Paper", status: "Nature Mach. Intell.", meta: "↓ 18k · 73 cites", links: ["c1", "c2", "c3"] },
  { id: "p2", stage: "paper", title: "A retargetable compiler bridge from PyTorch to neuromorphic substrates", status: "MLSys", meta: "↓ 9.1k · 12 cites", links: ["c4", "c5"] },
  { id: "c1", stage: "cited", title: "Energy-aware neuromorphic inference at the edge", meta: "IEEE TNNLS · 2026 · Northfield Lab · government" },
  { id: "c2", stage: "cited", title: "A survey of spiking neural network benchmarks", meta: "ACM Computing Surveys · 2026 · academic" },
  { id: "c3", stage: "cited", title: "Production SNN deployment whitepaper", meta: "Industry report · 2026 · industry" },
  { id: "c4", stage: "cited", title: "Cross-substrate ML compilation", meta: "ASPLOS · 2026 · academic" },
  { id: "c5", stage: "cited", title: "Production neuromorphic toolchains", meta: "arXiv · 2026 · industry" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { TraceabilitySpine } = ui;
  const [selected, setSelected] = useState<string | null>("w1");
  const [path, setPath] = useState<string[]>([]);
  const [more, setMore] = useState(false);
  return (
    <div style={{ width: "100%", maxWidth: 1080, display: "grid", gap: 8 }}>
      <TraceabilitySpine
        title="Neuromorphic computing"
        description="From open questions to the work and papers that resolve them, and who cites the results."
        stages={STAGES}
        nodes={NODES}
        selected={selected}
        onSelectedChange={(s, p) => {
          setSelected(s);
          setPath(p);
        }}
        onMore={() => setMore(true)}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {more ? "The page would list all 85 citing works here. " : selected ? `Tracing ${path.length || "the"} cards. ` : "Pick a card to trace its path, or move with the arrow keys and press Enter. "}
        <button type="button" style={textButton} onClick={() => (setSelected(null), setMore(false))}>
          Clear
        </button>
      </div>
    </div>
  );
}
