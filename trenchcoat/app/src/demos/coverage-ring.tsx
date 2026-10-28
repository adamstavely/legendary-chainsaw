import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { CoverageSegment } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* How much of a research portfolio's open gaps have work against them, and the topics split from healthiest to
   needing attention. "Fund three gaps" moves the ring and the split. */

const BEFORE: CoverageSegment[] = [
  { id: "strong", label: "Well covered", count: 5, tone: "success" },
  { id: "fair", label: "Partly covered", count: 4, tone: "neutral" },
  { id: "thin", label: "Thin", count: 2, tone: "warning" },
  { id: "bare", label: "Uncovered", count: 1, tone: "danger" },
];
const AFTER: CoverageSegment[] = [
  { id: "strong", label: "Well covered", count: 7, tone: "success" },
  { id: "fair", label: "Partly covered", count: 3, tone: "neutral" },
  { id: "thin", label: "Thin", count: 2, tone: "warning" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { CoverageRing } = ui;
  const [funded, setFunded] = useState(false);
  const [picked, setPicked] = useState("");
  return (
    <div style={{ width: "100%", maxWidth: 420, display: "grid", gap: 8 }}>
      <CoverageRing
        title="Gap coverage"
        description="Share of open gaps with active work assigned."
        value={funded ? 0.68 : 0.61}
        unit="topics"
        unitOne="topic"
        segments={funded ? AFTER : BEFORE}
        onSegmentSelect={(_, s) => setPicked(s.label)}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {picked ? `Picked ${picked}. ` : "Point at the bar to read a segment. "}
        <button type="button" style={textButton} onClick={() => setFunded(!funded)}>
          {funded ? "Reset" : "Fund three gaps"}
        </button>
      </div>
    </div>
  );
}
