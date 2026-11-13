import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ImpactCriterion, ImpactSegment } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* The research institute's "Policy Q&A" agent: prompt v13 against v14, a week of live chats on each. v14 reads
   better but cites the handbook less and gets more answers wrong – worst in travel questions. */

const CRITERIA: ImpactCriterion[] = [
  { id: "correct", label: "Correctness", before: { mean: 4.42, n: 1240, sd: 0.9 }, after: { mean: 3.81, n: 1184, sd: 1.1 } },
  { id: "cites", label: "Cites policy", before: { passes: 1066, n: 1240 }, after: { passes: 829, n: 1184 } },
  { id: "helpful", label: "Helpfulness", before: { mean: 4.18, n: 1240, sd: 0.9 }, after: { mean: 4.21, n: 1184, sd: 0.9 } },
  { id: "tone", label: "Tone", before: { mean: 4.31, n: 1240, sd: 0.8 }, after: { mean: 4.52, n: 1184, sd: 0.7 } },
];

const SEGMENTS: ImpactSegment[] = [
  {
    id: "travel",
    label: "Travel & expenses",
    criteria: [
      { id: "correct", label: "Correctness", before: { mean: 4.38, n: 512, sd: 0.9 }, after: { mean: 3.42, n: 498, sd: 1.2 } },
      { id: "cites", label: "Cites policy", before: { passes: 440, n: 512 }, after: { passes: 301, n: 498 } },
      { id: "helpful", label: "Helpfulness", before: { mean: 4.1, n: 512, sd: 0.9 }, after: { mean: 4.02, n: 498, sd: 1 } },
      { id: "tone", label: "Tone", before: { mean: 4.3, n: 512, sd: 0.8 }, after: { mean: 4.49, n: 498, sd: 0.7 } },
    ],
    cost: { before: 0.0121, after: 0.0098 },
  },
  {
    id: "leave",
    label: "Leave",
    criteria: [
      { id: "correct", label: "Correctness", before: { mean: 4.45, n: 338, sd: 0.9 }, after: { mean: 4.31, n: 322, sd: 1 } },
      { id: "cites", label: "Cites policy", before: { passes: 291, n: 338 }, after: { passes: 262, n: 322 } },
      { id: "helpful", label: "Helpfulness", before: { mean: 4.22, n: 338, sd: 0.9 }, after: { mean: 4.3, n: 322, sd: 0.9 } },
      { id: "tone", label: "Tone", before: { mean: 4.32, n: 338, sd: 0.8 }, after: { mean: 4.55, n: 322, sd: 0.7 } },
    ],
  },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ChangeImpact } = ui;
  const [segment, setSegment] = useState<string | null>(null);
  const [note, setNote] = useState("");
  return (
    <div style={{ width: "100%", maxWidth: 780, display: "grid", gap: 10 }}>
      <ChangeImpact
        title="Policy Q&A · did v14 help?"
        change={{ label: "Prompt v13 → v14", before: "v13", after: "v14", kind: "prompt" }}
        criteria={CRITERIA}
        cost={{ before: 0.0118, after: 0.0096 }}
        latency={{ before: 2140, after: 1820 }}
        segments={SEGMENTS}
        segment={segment}
        onSegmentChange={setSegment}
        currency="GBP"
        locale="en-GB"
        onExamplesOpen={(criterion, side) => setNote(`Examples: ${criterion}, ${side === "before" ? "v13" : "v14"}. `)}
      />
      <div style={{ ...caption, textAlign: "center", minHeight: 18 }}>
        {note || "“Likely” means at least 1.96 standard errors apart. "}
        <button type="button" style={textButton} onClick={() => setSegment(segment === "travel" ? null : "travel")}>
          {segment === "travel" ? "Show all traffic" : "Show travel questions"}
        </button>
      </div>
    </div>
  );
}
