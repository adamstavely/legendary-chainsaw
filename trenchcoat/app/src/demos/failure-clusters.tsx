import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { FailureCluster } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's Policy Q&A agent in production: last week's failing chats grouped by topic. Open a cluster
   for its quotes and actions, filter by the criterion it fails, or switch to bubbles. */

const CLUSTERS: FailureCluster[] = [
  {
    id: "abroad",
    label: "Expense limits abroad",
    summary: "Asked about meal and hotel limits on overseas trips, the agent quotes the domestic limits and doesn't cite the travel policy's foreign rates table.",
    count: 142,
    trend: { direction: "up", change: 18 },
    criteria: ["Correctness", "Cites policy"],
    examples: [
      { id: "e1", quote: "What's the hotel limit for the Lisbon conference? — The limit is 180 a night." },
      { id: "e2", quote: "Can I claim dinner in Geneva? — Yes, up to 45, as for any trip." },
    ],
  },
  {
    id: "leave",
    label: "Carrying over annual leave",
    summary: "The agent says leave can't be carried over, missing the five-day exception for staff on field placements.",
    count: 96,
    trend: { direction: "flat" },
    criteria: ["Correctness"],
    examples: [{ id: "e3", quote: "Can I carry leave into next year? — No, unused leave is lost on 31 December." }],
  },
  {
    id: "procurement",
    label: "Purchase approval thresholds",
    summary: "Answers give the right threshold but no source, so people ask again or check with finance.",
    count: 61,
    trend: { direction: "down", change: 9 },
    criteria: ["Cites policy", "Helpfulness"],
    examples: [{ id: "e4", quote: "Who approves a 12,000 laptop order? — A department head." }],
  },
  {
    id: "tone",
    label: "Short replies to complaints",
    summary: "When someone is frustrated about a reimbursement delay, replies are curt and skip the escalation route.",
    count: 38,
    trend: { direction: "up", change: 6 },
    criteria: ["Tone", "Helpfulness"],
    examples: [{ id: "e5", quote: "My claim is three weeks late. — Claims take up to 30 days." }],
  },
  {
    id: "data",
    label: "Research data retention",
    summary: "Already raised with the records team; the policy page is being rewritten.",
    count: 22,
    trend: { direction: "down", change: 30 },
    criteria: ["Correctness"],
  },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { FailureClusters } = ui;
  const [said, setSaid] = useState("");
  const [known, setKnown] = useState<string[]>(["data"]);
  return (
    <div style={{ width: "100%", maxWidth: 640, display: "grid", gap: 8 }}>
      <FailureClusters
        title="Failure clusters"
        description="Policy Q&A · last 7 days"
        clusters={CLUSTERS}
        known={known}
        onKnownChange={setKnown}
        defaultOpen="abroad"
        onClusterOpen={(_, c) => setSaid(`Opening the ${c.count} chats in “${c.label}”`)}
        onAddToDataset={(_, c) => void setSaid(`Added “${c.label}” to the eval dataset`)}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {said || "Open a cluster for its quotes, or filter by the criterion it fails."}{" "}
        <button type="button" style={textButton} onClick={() => setKnown([])}>
          Mark all as new
        </button>
      </div>
    </div>
  );
}
