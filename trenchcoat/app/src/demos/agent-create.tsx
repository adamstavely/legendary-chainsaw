import { useEffect, useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { AgentDraft } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A fictional research institute sets up an expense checker. The "model" here is a timer that streams a fixed draft
   in, section by section, so the demo is the same on every visit and needs no network. */

const DRAFT: AgentDraft = {
  name: "Expense checker",
  instructions:
    "Read each new expense claim. Check it against the travel and expenses policy: limits per night, per meal and per trip, receipts over the threshold, and pre-approval for international travel. Approve claims that pass. For claims that don't, list each problem with the policy clause and send the claim back to the claimant.",
  tools: [
    { id: "claims", label: "Expense claims", description: "Read new claims and their receipts", enabled: true },
    { id: "policy", label: "Policy library", description: "Search the travel and expenses policy", enabled: true },
    { id: "email", label: "Email", description: "Send the claim back with the problems listed", enabled: false },
  ],
  model: "model-s",
  triggers: [{ id: "t1", label: "A new expense claim is submitted" }],
  questions: [
    { id: "q1", question: "Who should approve claims over the limit – the line manager or finance?" },
    { id: "q2", question: "Should it check claims older than 90 days?" },
  ],
};
const MODELS = [
  { id: "model-s", label: "Model S – fast" },
  { id: "model-m", label: "Model M – balanced" },
  { id: "model-l", label: "Model L – thorough" },
];
const STAGES: ((d: AgentDraft) => AgentDraft)[] = [
  () => ({ ...DRAFT, instructions: "", tools: [], triggers: [], questions: [] }),
  (d) => ({ ...d, instructions: DRAFT.instructions }),
  (d) => ({ ...d, tools: DRAFT.tools, triggers: DRAFT.triggers }),
  (d) => ({ ...d, questions: DRAFT.questions }),
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AgentCreate } = ui;
  const [draft, setDraft] = useState<AgentDraft | null>(DRAFT);
  const [streaming, setStreaming] = useState(false);
  const [created, setCreated] = useState<string | null>(null);
  const timer = useRef(0);
  useEffect(() => () => window.clearInterval(timer.current), []);
  const stream = () => {
    window.clearInterval(timer.current);
    let i = 0;
    setStreaming(true);
    setDraft(STAGES[0]!(DRAFT));
    timer.current = window.setInterval(() => {
      i++;
      if (i < STAGES.length) setDraft((d) => STAGES[i]!(d ?? DRAFT));
      else {
        window.clearInterval(timer.current);
        setStreaming(false);
      }
    }, 450);
  };
  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 8 }}>
      <AgentCreate
        title="New agent"
        description="Research institute workspace"
        defaultPrompt="Check expense claims against the travel policy and send back the ones that break it."
        examples={["Match supplier invoices to purchase orders", "Answer staff questions from the policy library", "Check vendors' certifications every morning"]}
        models={MODELS}
        draft={draft}
        onDraftChange={setDraft}
        streaming={streaming}
        onGenerate={() => {
          stream();
          return false;
        }}
        onCreate={(d) => setCreated(d.name)}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {created ? `Created “${created}”. ` : "Edit the draft, answer the questions, then create it. "}
        <button type="button" style={textButton} onClick={stream}>
          Stream the draft again
        </button>
      </div>
    </div>
  );
}
