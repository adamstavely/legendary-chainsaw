import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ModerationItem, ModerationVerdict } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

const ITEMS: ModerationItem[] = [
  {
    id: "r1",
    reason: "Unsafe advice",
    reportedBy: "Tom Becker",
    at: Date.UTC(2026, 10, 12, 9, 14),
    agent: "Policy Q&A",
    user: "Jordan Ellis",
    policy: { name: "Financial advice policy", excerpt: "Agents explain institute policy; they don't tell staff how to handle their own tax affairs." },
    turns: [
      { id: "t1", from: "user", author: "Jordan Ellis", text: "Can I claim my home office as a business expense on my personal tax return?" },
      { id: "t2", from: "assistant", text: "Yes – claim the full rent of your flat as a business expense; the tax office rarely checks.", reported: true },
    ],
  },
  {
    id: "r2",
    reason: "Private data",
    automated: { classifier: "Personal data detector", score: 0.91 },
    at: Date.UTC(2026, 10, 12, 10, 2),
    agent: "Policy Q&A",
    user: "Mei Tanaka",
    policy: { name: "Personal data policy" },
    turns: [
      { id: "t1", from: "user", author: "Mei Tanaka", text: "Who approved the last travel claim over 2,000?" },
      { id: "t2", from: "assistant", text: "That was approved by Ana Ruiz; her home address on file is 14 Harbour Lane.", reported: true },
    ],
  },
  {
    id: "r3",
    reason: "Off-topic",
    reportedBy: "Priya Shah",
    at: Date.UTC(2026, 10, 12, 11, 40),
    agent: "Policy Q&A",
    user: "Sam Okafor",
    turns: [
      { id: "t1", from: "user", author: "Sam Okafor", text: "What's the per-diem for a conference in Lisbon?" },
      { id: "t2", from: "assistant", text: "The per-diem for Lisbon is 95 a day, covering meals and local transport.", reported: true },
    ],
  },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ModerationQueue } = ui;
  const [decisions, setDecisions] = useState<Record<string, ModerationVerdict>>({});
  const [index, setIndex] = useState(0);
  const [note, setNote] = useState("Press K, R, U or E – Remove and Restrict ask for a note first.");
  return (
    <div style={{ width: "100%", maxWidth: 640, display: "grid", gap: 8 }}>
      <ModerationQueue
        title="Reported replies"
        description="Policy Q&A, this week"
        items={ITEMS}
        index={index}
        onIndexChange={setIndex}
        decisions={decisions}
        onDecisionsChange={setDecisions}
        onDecide={(id, decision) => setNote(`${id}: ${decision}.`)}
        locale="en-GB"
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {note}{" "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setDecisions({});
            setIndex(0);
          }}
        >
          Start over
        </button>
      </div>
    </div>
  );
}
