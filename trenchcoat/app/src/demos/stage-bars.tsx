import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's document-review team: cases at each step of the review pipeline, over two periods (“Show the
   last 30 days” re-grows the pills for the longer period). Icons: Lucide (ISC, lucide.dev). */

const ICONS = {
  flag: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7",
  list: "M3 6h18M7 12h10M10 18h4",
  search: "M21 21l-4.3-4.3M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z",
  up: "M12 19V5M5 12l7-7 7 7",
  send: "M22 2 11 13M22 2l-7 20-4-9-9-4z",
  check: "M20 6 9 17l-5-5",
};
const STEPS = [
  ["Flagged", ICONS.flag],
  ["Triaged", ICONS.list],
  ["Investigated", ICONS.search],
  ["Escalated", ICONS.up],
  ["Referred", ICONS.send],
  ["Closed", ICONS.check],
] as const;
const stages = (values: number[]) => STEPS.map(([label, icon], i) => ({ label, icon, value: values[i] }));
const RANGES = [
  { id: "7d", label: "7 days", delta: 2.4, stages: stages([1180, 790, 460, 250, 120, 40]) },
  { id: "30d", label: "30 days", delta: -3.1, stages: stages([4920, 3410, 2120, 1180, 560, 210]) },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { StageBars } = ui;
  const [range, setRange] = useState("7d");
  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 8 }}>
      <StageBars title="Case pipeline" description="Cases at each review step" ranges={RANGES} range={range} onRangeChange={setRange} defaultStage={2} />
      <div style={{ ...caption, textAlign: "center" }}>
        Point at a stage, or Tab in and use the arrows.{" "}
        <button type="button" style={textButton} onClick={() => setRange(range === "7d" ? "30d" : "7d")}>
          Show the last {range === "7d" ? "30" : "7"} days
        </button>
      </div>
    </div>
  );
}
