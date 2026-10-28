import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* Riverside Library's app survey results for Q3: NPS with its trend over the year and a target of +40, and the
   study-room CSAT beside it. Picking a score's bar filters the comments (here, the caption says which). "Add Q4"
   swaps in the next quarter's answers. */

const Q3 = [6, 3, 4, 5, 7, 11, 16, 38, 52, 74, 96];
const Q4 = [4, 2, 3, 4, 5, 8, 12, 33, 49, 88, 121];
const CSAT = [9, 14, 31, 92, 118];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ScoreSummary } = ui;
  const [q4, setQ4] = useState(false);
  const [score, setScore] = useState<number | null>(9);
  return (
    <div style={{ width: "100%", maxWidth: 640, display: "grid", gap: 12 }}>
      <ScoreSummary
        kind="nps"
        description={`Riverside Library app · ${q4 ? "Q4" : "Q3"}`}
        responses={q4 ? Q4 : Q3}
        trend={q4 ? [{ label: "Q1", value: 18 }, { label: "Q2", value: 24 }, { label: "Q3", value: 33 }] : [{ label: "Q1", value: 18 }, { label: "Q2", value: 24 }]}
        target={40}
        selected={score}
        onScoreSelect={setScore}
      />
      <ScoreSummary kind="csat" description="Study-room booking · Q3" responses={CSAT} previous={78} comparedTo="Q2" look="clean" />
      <div style={{ ...caption, textAlign: "center", minHeight: 18 }}>
        {score === null ? "Pick a score's bar to filter the comments. " : `Showing comments that scored ${score}. `}
        <button type="button" style={textButton} onClick={() => setQ4((v) => !v)}>
          {q4 ? "Back to Q3" : "Add Q4"}
        </button>
      </div>
    </div>
  );
}
