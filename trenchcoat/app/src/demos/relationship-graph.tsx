import type * as UI from "../../../src/elements/react";
import type { RelationEdge, RelationNode } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* A fictional research consortium: who works where, who writes with whom, who funds what. Click anyone to put them in
   the middle, try two steps out, or hide a kind from the legend. All of it is made up. */

const NODES: RelationNode[] = [
  { id: "ines", label: "Ines Okafor", kind: "person", subtitle: "Principal investigator" },
  { id: "tomas", label: "Tomás Reyes", kind: "person", subtitle: "Data engineer" },
  { id: "mira", label: "Mira Lindqvist", kind: "person", subtitle: "Field scientist" },
  { id: "kofi", label: "Kofi Mensah", kind: "person", subtitle: "Research software engineer" },
  { id: "ana", label: "Ana Lima", kind: "person", subtitle: "Field scientist" },
  { id: "jun", label: "Jun Watanabe", kind: "person", subtitle: "Statistician" },
  { id: "northfield", label: "Northfield University", kind: "organisation", subtitle: "Lead institution" },
  { id: "harbour", label: "Harbour Lane Institute", kind: "organisation", subtitle: "Partner institute" },
  { id: "tidewater", label: "Tidewater Foundation", kind: "funder", subtitle: "Funds the consortium" },
  { id: "reeflab", label: "Reef Sensing Lab", kind: "lab", subtitle: "Shared instruments" },
];
const EDGES: RelationEdge[] = [
  { from: "northfield", to: "ines", label: "employs", weight: 5, since: "2014" },
  { from: "northfield", to: "tomas", label: "employs", weight: 4, since: "2021" },
  { from: "harbour", to: "mira", label: "employs", weight: 4, since: "2018" },
  { from: "harbour", to: "kofi", label: "employs", weight: 3, since: "2022" },
  { from: "northfield", to: "jun", label: "employs", weight: 3, since: "2019" },
  { from: "ines", to: "mira", label: "co-author", weight: 4, since: "2019" },
  { from: "ines", to: "ana", label: "co-author", weight: 3, since: "2023" },
  { from: "ines", to: "jun", label: "co-author", weight: 2, since: "2020" },
  { from: "tomas", to: "kofi", label: "co-author", weight: 2, since: "2024" },
  { from: "tidewater", to: "northfield", label: "funds", weight: 5, since: "2022" },
  { from: "tidewater", to: "harbour", label: "funds", weight: 3, since: "2023" },
  { from: "ines", to: "reeflab", label: "leads", weight: 4 },
  { from: "ana", to: "reeflab", label: "uses", weight: 2 },
  { from: "mira", to: "reeflab", label: "uses", weight: 3 },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { RelationshipGraph } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 860, display: "grid", gap: 10 }}>
      <RelationshipGraph title="Reef resilience consortium" description="People, institutions and funding" nodes={NODES} edges={EDGES} kindLabels={{ funder: "Funder", lab: "Lab" }} />
      <div style={{ ...caption, textAlign: "center" }}>Click anyone to put them in the middle, or try two steps out.</div>
    </div>
  );
}
