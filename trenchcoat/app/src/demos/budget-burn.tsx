import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { BurnItem } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* FY26 topic budgets at a fictional research institute, 45% of the way through the year. */

const ITEMS: BurnItem[] = [
  { id: "cnm", priority: "1", label: "Carbon-Negative Materials", owner: "Sofia Almeida", budget: 4_200_000, spent: 2_600_000, committed: 1_100_000, people: 1.1, team: ["Sofia Almeida", "Rafael Brandt"] },
  { id: "nc", priority: "1", label: "Neuromorphic Computing", owner: "Marcus Okonkwo", budget: 3_800_000, spent: 1_900_000, committed: 1_400_000, people: 2, team: ["Marcus Okonkwo", "Jonah Tran", "Elena Castellanos"] },
  { id: "asc", priority: "2", label: "Autonomous Swarm Coordination", owner: "Daniel Whitfield", budget: 2_900_000, spent: 1_700_000, committed: 800_000, people: 1.2, team: ["Daniel Whitfield", "Naomi Yusuf"] },
  { id: "qs", priority: "2", label: "Quantum Sensing", owner: "Priya Raman", budget: 2_400_000, spent: 1_300_000, committed: 600_000, people: 0.5, team: ["Priya Raman"] },
  { id: "crm", priority: "2", label: "Climate Resilience Modeling", owner: "Arjun Mehta", budget: 2_200_000, spent: 1_500_000, committed: 400_000, people: 0.7, team: ["Arjun Mehta"] },
  { id: "gse", priority: "3", label: "Grid-Scale Energy Storage", owner: "Sofia Almeida", budget: 2_700_000, spent: 600_000, committed: 900_000, people: 0.8, team: ["Sofia Almeida", "Rafael Brandt"] },
  { id: "ppc", priority: "4", label: "Privacy-Preserving Computation", owner: "Priya Raman", budget: 800_000, spent: 300_000, committed: 100_000, people: 0.4, team: ["Priya Raman"] },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { BudgetBurn } = ui;
  const [opened, setOpened] = useState<string | null>(null);
  return (
    <div style={{ width: "100%", maxWidth: 820, display: "grid", gap: 8 }}>
      <BudgetBurn description="FY26 topic budgets – the line on each bar is where spend should be by now." items={ITEMS} period={0.45} onOpen={(_, item) => setOpened(item.label)} />
      <div style={{ ...caption, textAlign: "center" }}>{opened ? `Opened ${opened}.` : "Open a topic, or sort by burn to see who's spending fastest."}</div>
    </div>
  );
}
