import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { OrgItem, OrgStat, OrgTeam } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* A centre of a fictional research institute: its lead, health, stats and two teams, each folding open onto the
   topics it owns. Opening a topic says so below. */

const STATS: OrgStat[] = [
  { id: "teams", label: "Teams", value: "2", sub: "5 researchers" },
  { id: "topics", label: "Topics", value: "4", sub: "13 in work" },
  { id: "coverage", label: "Coverage", value: "66%", sub: "gap coverage" },
  { id: "gaps", label: "Open gaps", value: "8", sub: "unresolved" },
  { id: "people", label: "People", value: "4.5 FTE", sub: "allocated" },
  { id: "budget", label: "Budget", value: "$9.2M", sub: "$5.1M spent", meter: 5.1 / 9.2 },
];

const TEAMS: OrgTeam[] = [
  {
    id: "cognitive",
    name: "Cognitive Systems",
    lead: { name: "Marcus Okonkwo", title: "Principal Investigator" },
    people: 3,
    health: { "on-track": 1, "at-risk": 1 },
    coverage: 0.61,
    gaps: 5,
    fte: 2.6,
    items: [
      { id: "neuro", label: "Neuromorphic Computing", priority: 1, tag: "Flagship", detail: "4 in work", coverage: 0.42, open: 4, momentum: -0.08, health: "at-risk" },
      { id: "adv", label: "Adversarial ML Robustness", priority: 3, tag: "Core", detail: "3 in work", coverage: 0.8, open: 1, momentum: 0.06, health: "on-track" },
    ],
  },
  {
    id: "autonomy",
    name: "Autonomy",
    lead: { name: "Daniel Whitfield", title: "Principal Investigator" },
    people: 2,
    health: { "on-track": 1, watch: 1 },
    coverage: 0.71,
    gaps: 3,
    fte: 1.9,
    items: [
      { id: "swarm", label: "Autonomous Swarm Coordination", priority: 2, tag: "Core", detail: "2 in work", coverage: 0.83, open: 1, momentum: 0.05, health: "on-track" },
      { id: "edge", label: "Edge AI for Sensing", priority: 4, detail: "2 in work", coverage: 0.58, open: 2, momentum: 0.02, health: "watch" },
    ],
  },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { OrgUnitCard } = ui;
  const [expanded, setExpanded] = useState<string[]>(["cognitive"]);
  const [note, setNote] = useState("");
  return (
    <div style={{ width: "100%", maxWidth: 760, display: "grid", gap: 8 }}>
      <OrgUnitCard
        code="CIS"
        title="Intelligent Systems"
        description="Learning, perception and autonomy – from low-power hardware to multi-agent control."
        lead={{ name: "Marcus Okonkwo", title: "Principal Investigator" }}
        leadLabel="Centre lead"
        health={{ "on-track": 2, watch: 1, "at-risk": 1 }}
        stats={STATS}
        teams={TEAMS}
        expanded={expanded}
        onExpandedChange={setExpanded}
        actions={[{ id: "brief", label: "Directorate brief" }]}
        onAction={() => setNote("Directorate brief requested.")}
        onOpen={(team: string, item: OrgItem) => setNote(`Opened ${item.label} (${TEAMS.find((t) => t.id === team)?.name}).`)}
      />
      <div style={{ ...caption, textAlign: "center" }}>{note || "Open a team, or move with the arrow keys – → opens a team, ← closes it."}</div>
    </div>
  );
}
