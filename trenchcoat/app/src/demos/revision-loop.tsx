import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { RevisionLoopOutcome, RevisionLoopRound } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A made-up agent revises an audit report until a rubric judge scores it 8 out of 10, five rounds at most. */

const BAR = { label: "Rubric score ≥ 8/10", target: 8, unit: "/10", max: 10 };
const ROUNDS: RevisionLoopRound[] = [
  { n: 1, status: "done", score: 5.2, changed: "First draft from the case notes", critique: ["Findings aren't tied to evidence", "No summary up front", "Two figures disagree with the ledger", "Recommendations are vague"] },
  { n: 2, status: "done", score: 6.6, changed: "Linked each finding to its evidence and added a summary", critique: ["Two figures disagree with the ledger", "Recommendations are vague", "Section 4 repeats section 2"] },
  { n: 3, status: "done", score: 7.4, changed: "Corrected the figures against the ledger", critique: ["Recommendations are vague", "Section 4 repeats section 2"] },
  { n: 4, status: "running" },
];
const NEXT: RevisionLoopRound[] = [
  { n: 4, status: "done", score: 7.8, changed: "Merged sections 2 and 4", critique: ["Recommendations are vague"] },
  { n: 5, status: "done", score: 7.9, changed: "Made each recommendation name an owner", critique: ["Two recommendations still have no date"] },
  { n: 6, status: "done", score: 8.4, changed: "Gave every recommendation a date", critique: [] },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { RevisionLoop } = ui;
  const [rounds, setRounds] = useState(ROUNDS);
  const [outcome, setOutcome] = useState<RevisionLoopOutcome>("running");
  const [cap, setCap] = useState(5);
  const step = () => {
    const done = rounds.filter((r) => r.status === "done").length;
    const next = NEXT[done - 3];
    if (!next) return;
    const kept = rounds.filter((r) => r.status === "done");
    const met = (next.score ?? 0) >= BAR.target;
    const atCap = next.n >= cap;
    setRounds(met || atCap ? [...kept, next] : [...kept, next, { n: next.n + 1, status: "running" }]);
    if (met) setOutcome("met");
    else if (atCap) setOutcome("capped");
  };
  return (
    <div style={{ width: "100%", maxWidth: 720, display: "grid", gap: 8 }}>
      <RevisionLoop
        description="Q3 audit report, revised against the review rubric"
        bar={BAR}
        cap={cap}
        rounds={rounds}
        outcome={outcome}
        defaultExpanded={3}
        onTcStop={() => setOutcome("stopped")}
        onTcExtend={(e) => {
          setCap(e.detail.cap);
          setOutcome("running");
          setRounds([...rounds, { n: e.detail.cap, status: "running" }]);
        }}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        <button
          type="button"
          style={textButton}
          onClick={() => {
            if (outcome !== "running") {
              setRounds(ROUNDS);
              setOutcome("running");
              setCap(5);
            } else step();
          }}
        >
          {outcome === "running" ? "Finish the round" : "Start again"}
        </button>
      </div>
    </div>
  );
}
