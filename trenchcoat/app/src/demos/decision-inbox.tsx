import { useState } from "react";
import type * as UI from "@components/decision-inbox";
import type { Decision } from "@components/decision-inbox";
import { buttonSm } from "../demo-kit";

const DECISIONS: Decision[] = [
  {
    id: "d1",
    title: "Merge the pricing page redesign?",
    detail: "All checks passed · 2 approvals · touches checkout copy",
    primary: "Merge",
    secondary: "Hold",
  },
  {
    id: "d2",
    title: "Refund order #48213 ($129.00)?",
    detail: "Customer reports the item arrived damaged – photos attached",
    primary: "Refund",
    secondary: "Ask for more",
  },
  {
    id: "d3",
    title: "Send the Q3 investor update now?",
    detail: "Drafted by the comms agent from last week's metrics",
    primary: "Send",
    secondary: "Edit first",
  },
  {
    id: "d4",
    title: "Rotate the staging database password",
    detail: "Scheduled rotation – 3 services will restart",
    primary: "Rotate",
    secondary: "Next week",
    collapsed: true,
  },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { DecisionInbox } = ui;
  const [round, setRound] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  return (
    <div style={{ width: "100%", maxWidth: 440, display: "grid", gap: 10 }}>
      <DecisionInbox
        key={round}
        decisions={DECISIONS}
        onDecide={(d, answer) => setLog((l) => [`${answer === "primary" ? d.primary : d.secondary} – ${d.title}`, ...l].slice(0, 3))}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12, fontSize: 12, color: "var(--tc-text-muted, light-dark(#646464, #9a9aa1))" }}>
        <div style={{ display: "grid", gap: 2 }}>
          {log.length === 0 ? <span>Answer a decision to see it fold away.</span> : log.map((l, i) => <span key={i}>✓ {l}</span>)}
        </div>
        <button
          type="button"
          onClick={() => { setRound((r) => r + 1); setLog([]); }}
          style={buttonSm}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
