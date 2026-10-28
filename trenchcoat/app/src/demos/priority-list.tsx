import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { PriorityFilter, PriorityItem } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's portfolio of topics, by priority: momentum over the last eight weeks, how much of each
   topic's open gaps have work against them, and the work in flight. "Group by priority" puts them under tier headers. */

const ITEMS: PriorityItem[] = [
  { id: "climate", name: "Climate Resilience Modeling", owner: "Arjun Mehta", team: "Climate Systems", priority: 2, health: "at-risk", trend: [9, 8.6, 8.8, 8.1, 7.6, 7.9, 7.2, 6.8], change: -0.14, coverage: 0.33, open: 5, work: 3 },
  { id: "neuro", name: "Neuromorphic Computing", owner: "Marcus Okonkwo", team: "Cognitive Systems", priority: 1, health: "at-risk", trend: [7, 7.2, 6.9, 6.6, 6.8, 6.4, 6.5, 6.3], change: -0.08, coverage: 0.42, open: 4, work: 4 },
  { id: "wildfire", name: "Wildfire Prediction Systems", owner: "Arjun Mehta", team: "Climate Systems", priority: 4, health: "watch", trend: [4, 4.1, 3.9, 4, 4.2, 4.1, 4, 4.05], change: 0.01, coverage: 0.5, open: 2, work: 2 },
  { id: "synbio", name: "Synthetic Biology Safety", owner: "Lena Kirchner", team: "Synthetic Biology", priority: 2, health: "watch", trend: [5, 5.2, 4.9, 5, 4.8, 4.9, 4.7, 4.85], change: -0.03, coverage: 0.55, open: 3, work: 3 },
  { id: "edge", name: "Edge AI for Sensing", owner: "Daniel Whitfield", team: "Autonomy", priority: 4, health: "on-track", trend: [3, 3.1, 3.05, 3.2, 3.1, 3.15, 3.2, 3.06], change: 0.02, coverage: 0.58, open: 2, work: 2 },
  { id: "storage", name: "Grid-Scale Energy Storage", owner: "Sofia Almeida", team: "Energy & Materials", priority: 3, health: "on-track", trend: [5, 5.1, 5.3, 5.2, 5.4, 5.5, 5.4, 5.15], change: 0.03, coverage: 0.62, open: 2, work: 3 },
  { id: "carbon", name: "Carbon-Negative Materials", owner: "Sofia Almeida", team: "Energy & Materials", priority: 1, health: "on-track", trend: [6, 6.2, 6.5, 6.4, 6.8, 7.1, 7, 6.72], change: 0.12, coverage: 0.71, open: 2, work: 5 },
  { id: "quantum", name: "Quantum Sensing", owner: "Priya Raman", team: "Quantum & Sensing", priority: 2, health: "on-track", trend: [4, 4.1, 4.3, 4.2, 4.4, 4.3, 4.5, 4.36], change: 0.09, coverage: 0.78, open: 1, work: 3 },
  { id: "privacy", name: "Privacy-Preserving Computation", owner: "Priya Raman", team: "Quantum & Sensing", priority: 4, health: "on-track", trend: [2, 2.1, 2.05, 2.2, 2.1, 2.2, 2.15, 2.14], change: 0.07, coverage: 0.85, open: 0, work: 2 },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { PriorityList } = ui;
  const [grouped, setGrouped] = useState(false);
  const [filter, setFilter] = useState<PriorityFilter>("all");
  const [opened, setOpened] = useState("");
  return (
    <div style={{ width: "100%", maxWidth: 780, display: "grid", gap: 8 }}>
      <PriorityList title="Priorities" description="Every tracked topic, this quarter." items={ITEMS} grouped={grouped} filter={filter} onFilterChange={setFilter} onOpen={(_, item) => setOpened(item.name)} />
      <div style={{ ...caption, textAlign: "center" }}>
        {opened ? `Opened ${opened}. ` : "Pick a health chip to filter, or open a topic. "}
        <button type="button" style={textButton} onClick={() => setGrouped(!grouped)}>
          {grouped ? "Show as one list" : "Group by priority"}
        </button>
      </div>
    </div>
  );
}
