import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { AgentHandoffLink, AgentHandoffQueue, AgentHandoffStep, AgentHandoffView } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's literature reviews pass through three made-up agents, and a caveat goes missing on the way. */

const STEPS: AgentHandoffStep[] = [
  { id: "scout", agent: "Scout", role: "Finds the papers", status: "done", model: "Model A", cost: 1.2, summary: "Found 48 papers on sleep and memory." },
  { id: "reader", agent: "Reader", role: "Pulls out the results", status: "done", model: "Model B", cost: 0.64, summary: "Extracted results from 41 of them." },
  { id: "writer", agent: "Writer", role: "Drafts the summary", status: "running", model: "Model C", cost: 0.31, activity: "Drafting the review for the steering group." },
];
const HANDOFFS: AgentHandoffLink[] = [
  { from: "scout", to: "reader", carried: ["The 48 papers", "The search terms", "The date range"], lost: [] },
  { from: "reader", to: "writer", carried: ["Results from 41 papers", "The brief"], lost: ["7 papers Reader couldn't open", "The note that two studies share a sample"] },
];
const QUEUES: AgentHandoffQueue[] = [
  { from: "scout", to: "reader", items: [{ id: "q1", title: "Diet and cognition", detail: "22 papers", status: "Being read" }] },
  {
    from: "reader",
    to: "writer",
    items: [
      { id: "q2", title: "Sleep and memory", detail: "41 papers", warning: "2 caveats unchecked" },
      { id: "q3", title: "Exercise in later life", detail: "16 papers" },
    ],
  },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AgentHandoff } = ui;
  const [view, setView] = useState<AgentHandoffView>("pipeline");
  return (
    <div style={{ width: "100%", maxWidth: view === "pipeline" ? 860 : 560, display: "grid", gap: 8 }}>
      <AgentHandoff description="Literature reviews" view={view} steps={STEPS} handoffs={HANDOFFS} queues={QUEUES} locale="en-US" defaultSelected="reader>writer" />
      <div style={{ ...caption, textAlign: "center" }}>
        <button type="button" style={textButton} onClick={() => setView(view === "pipeline" ? "chain" : "pipeline")}>
          Show as a {view === "pipeline" ? "chain" : "pipeline"}
        </button>
      </div>
    </div>
  );
}
