import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's grant milestones: how far each lab is through this year's deliverables, as a share of its
   target (“Show last year” glides the rings to the year before), and the same on a full circle; and activity rings:
   a reviewer's daily goals for reviews, interviews and hours logged, each against its own target – interviews are past
   theirs, so that ring wraps round in a darker lap. */

const LABS = ["Genomics", "Imaging", "Proteomics", "Field ecology", "Neuro"];
const YEARS = [
  [82, 64, 91, 47, 73],
  [70, 88, 59, 62, 54],
];

const GOALS = [
  [
    { label: "Reviews", value: 6, target: 8 },
    { label: "Interviews", value: 4, target: 3 },
    { label: "Hours logged", value: 5.5, target: 7 },
  ],
  [
    { label: "Reviews", value: 8, target: 8 },
    { label: "Interviews", value: 2, target: 3 },
    { label: "Hours logged", value: 7.5, target: 7 },
  ],
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { RadialBarChart } = ui;
  const [y, setY] = useState(0);
  const data = LABS.map((label, i) => ({ label, value: YEARS[y][i] }));
  return (
    <div style={{ width: "100%", maxWidth: 900, display: "grid", gap: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
        <RadialBarChart title="Grant milestones" description={y === 0 ? "Deliverables met this year, of target" : "Deliverables met last year, of target"} data={data} />
        <RadialBarChart title="Audit readiness" description="Checks passed, of target" data={data.slice(0, 3)} sweep={360} />
      </div>
      <div style={{ maxWidth: 440, width: "100%", justifySelf: "center" }}>
        <RadialBarChart title="Activity rings" description={y === 0 ? "Today's goals" : "Yesterday's goals"} variant="rings" data={GOALS[y]} target="target" />
      </div>
      <div style={{ ...caption, textAlign: "center" }}>
        Point at a ring or a goal's tile, or Tab in and use the arrows.{" "}
        <button type="button" style={textButton} onClick={() => setY(1 - y)}>
          Show {y === 0 ? "last year" : "this year"}
        </button>
      </div>
    </div>
  );
}
