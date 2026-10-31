import type * as UI from "../../../src/elements/react";
import type { AgentHandoffLink, AgentHandoffStep } from "../../../src/elements/react";

/* A research institute's literature review passes through three made-up agents, and a caveat goes missing on the way. */

const STEPS: AgentHandoffStep[] = [
  { id: "scout", agent: "Scout", role: "Finds the papers", status: "done", summary: "Found 48 papers on sleep and memory." },
  { id: "reader", agent: "Reader", role: "Pulls out the results", status: "done", summary: "Extracted results from 41 of them." },
  { id: "writer", agent: "Writer", role: "Drafts the summary", status: "running", summary: "Drafting the review for the steering group." },
];
const HANDOFFS: AgentHandoffLink[] = [
  { from: "scout", to: "reader", carried: ["The 48 papers", "The search terms", "The date range"], lost: [] },
  { from: "reader", to: "writer", carried: ["Results from 41 papers", "The brief"], lost: ["7 papers Reader couldn't open", "The note that two studies share a sample"] },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AgentHandoff } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 560 }}>
      <AgentHandoff description="Sleep and memory literature review" steps={STEPS} handoffs={HANDOFFS} defaultSelected="reader>writer" />
    </div>
  );
}
