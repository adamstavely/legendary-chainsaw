import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's safety audits: each lab's score at the spring audit and the autumn one (“Show target” swaps
   the autumn scores for the year's targets, gliding the dots). */

const LABS = ["Genomics", "Imaging", "Proteomics", "Field ecology", "Neuro", "Climate", "Materials"];
const SPRING = [62, 74, 58, 81, 69, 77, 55];
const AUTUMN = [81, 79, 71, 78, 84, 80, 63];
const TARGET = [85, 85, 80, 85, 85, 85, 75];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { DumbbellChart } = ui;
  const [target, setTarget] = useState(false);
  const data = LABS.map((label, i) => ({ label, start: SPRING[i], end: (target ? TARGET : AUTUMN)[i] }));
  return (
    <div style={{ width: "100%", maxWidth: 720, display: "grid", gap: 8 }}>
      <DumbbellChart
        title="Safety audit score"
        description={target ? "Spring score against the year's target" : "Spring and autumn audits, by lab"}
        data={data}
        startLabel="Spring"
        endLabel={target ? "Target" : "Autumn"}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        Point at a row, or Tab in and use the arrows.{" "}
        <button type="button" style={textButton} onClick={() => setTarget(!target)}>
          Show {target ? "autumn scores" : "target"}
        </button>
      </div>
    </div>
  );
}
