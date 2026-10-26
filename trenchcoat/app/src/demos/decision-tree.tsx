import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { Decision } from "../../../src/elements/react";
import { buttonSm } from "../demo-kit";

const Mark = ({ c }: { c: string }) => (
  <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M8 1.5l1.7 4.8 4.8 1.7-4.8 1.7L8 14.5l-1.7-4.8L1.5 8l4.8-1.7z" fill={c} />
  </svg>
);

const DECISIONS: Decision[] = [
  {
    id: "dup-subs",
    question: "3 customers have two active subscriptions – how should I proceed?",
    context: "Found while reconciling October invoices in Stripe",
    agent: "Billing agent",
    model: "Claude Sonnet",
    icon: <Mark c="#d97757" />,
    risk: "high",
    options: [
      {
        label: "Cancel the newer ones",
        effects: [
          "Refunds $147 across 3 accounts",
          ["Not reversible – ", { text: "customers may lose seat history", note: "Seat assignments are stored per subscription; the newer ones hold 2 of the 3 teams' current seats.", source: "stripe.subscriptions · sub_1Nx…" }],
        ],
        pick: true,
      },
      { label: "Cancel the older ones", effects: ["Refunds $212 · keeps current seats", "Customers see a plan change email"] },
      { label: "Leave them, flag for support", effects: ["No change today", "Support ticket per customer"] },
    ],
  },
  {
    id: "migration",
    question: "The users table migration will lock writes for ~40s. Run it now?",
    context: "Traffic is at 12% of peak · next quiet window is 02:00 UTC",
    agent: "Deploy agent",
    model: "Claude Haiku",
    risk: "medium",
    options: [
      { label: "Run it now", effects: [["Writes paused ", { text: "about 40 seconds", note: "Estimated from a dry run on the staging snapshot (2.1M rows).", source: "staging · dry-run log" }]], pick: true },
      {
        label: "Wait for 02:00 UTC",
        effects: ["Release ships ~9 hours later"],
        // A follow-up question – the tree's sub-question state
        next: {
          question: "Ship the rest of the release now, or hold it all for 02:00?",
          options: [
            { label: "Ship the rest now", effects: ["Migration runs alone at 02:00", "Feature flag stays off until then"], pick: true },
            { label: "Hold everything", effects: ["One deploy at 02:00 UTC"] },
          ],
        },
      },
      { label: "Use online migration", effects: ["No lock · takes ~25 min", "Needs extra disk (6 GB)"] },
    ],
  },
  {
    id: "copy",
    question: "Two headline variants tested equally well. Which should go live?",
    agent: "Growth agent",
    risk: "low",
    options: [
      { label: "“Ship faster, together”", effects: ["CTR 4.1% · 1,980 visitors"], pick: true },
      { label: "“Your team’s new home”", effects: ["CTR 4.0% · 2,012 visitors"] },
    ],
  },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { DecisionTree } = ui;
  const [round, setRound] = useState(0);
  return (
    <div style={{ width: "100%", maxWidth: 760, display: "grid", gap: 10 }}>
      <DecisionTree
        key={round}
        decisions={DECISIONS}
        title="Waiting on you"
        onChoose={(_d, choice) => {
          if ("other" in choice) {
            return new Promise<string>((res) => setTimeout(() => res(`Got it – I'll ${choice.other.replace(/\.$/, "").toLowerCase()} and report back.`), 900));
          }
        }}
      />
      <div style={{ textAlign: "right" }}>
        <button
          type="button"
          onClick={() => setRound((r) => r + 1)}
          style={buttonSm}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
