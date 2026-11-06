import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's shared compute cluster: GPU hours by lab this quarter, as 100 cells (“Show last quarter”
   moves the cells to the other quarter and the large share glides). */

const LABS = ["Genomics", "Climate", "Imaging", "Neuro"];
const QUARTERS = [
  [4120, 2680, 1890, 1310],
  [2950, 3320, 2140, 1590],
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { WaffleChart } = ui;
  const [q, setQ] = useState(0);
  const data = LABS.map((label, i) => ({ label, value: QUARTERS[q][i] }));
  return (
    <div style={{ width: "100%", maxWidth: 620, display: "grid", gap: 8 }}>
      <WaffleChart title="GPU hours" description={q === 0 ? "This quarter, by lab" : "Last quarter, by lab"} unit=" h" data={data} />
      <div style={{ ...caption, textAlign: "center" }}>
        Point at a cell, or Tab in and use the arrows.{" "}
        <button type="button" style={textButton} onClick={() => setQ(1 - q)}>
          Show {q === 0 ? "last quarter" : "this quarter"}
        </button>
      </div>
    </div>
  );
}
