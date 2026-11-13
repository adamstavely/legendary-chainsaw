import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { JudgeCriterion } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* The judge for the institute's Policy Q&A agent: three criteria – one pass/fail with a worked example, one scale,
   one label – weighted 3 : 2 : 1. Try shows the prompt it would send; nothing leaves the page. */

const START: JudgeCriterion[] = [
  {
    id: "correct",
    name: "Correct",
    question: "Does the answer state the policy correctly, with the right figures and section?",
    type: "pass-fail",
    weight: 3,
    examples: [{ output: "The hotel cap in Geneva is CHF 180 a night.", verdict: "FAIL", why: "the Geneva cap is CHF 240 (table B)" }],
  },
  { id: "helpful", name: "Helpful", question: "How well does it answer what the person actually asked?", type: "scale", scale: { min: 1, max: 5, anchors: { 1: "Not at all", 5: "Fully" } }, weight: 2 },
  { id: "tone", name: "Tone", question: "How does it sound to a colleague reading it?", type: "label", labels: ["plain", "too formal", "too casual"], weight: 1 },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { EvalCriteriaEditor } = ui;
  const [criteria, setCriteria] = useState(START);
  const [tried, setTried] = useState<number | null>(null);
  return (
    <div style={{ width: "100%", maxWidth: 640, display: "grid", gap: 10 }}>
      <EvalCriteriaEditor criteria={criteria} onCriteriaChange={setCriteria} onTry={(c) => setTried(c.length)} />
      <div style={{ ...caption, textAlign: "center", minHeight: 18 }}>
        {tried ? `Would run the judge with ${tried} criteria on 20 sample answers. ` : "Change a weight to see the shares move, or open Judge prompt. "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setCriteria(START);
            setTried(null);
          }}
        >
          Start over
        </button>
      </div>
    </div>
  );
}
