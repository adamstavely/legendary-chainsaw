import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's budget: each lab's spend split into staff, instruments and compute – the column's width is
   the lab's share of the institute, the blocks its mix (“Show next year” glides to the planned budget, where Climate
   grows and buys compute). */

const LABS = ["Genomics", "Imaging", "Climate", "Neuro", "Field ecology"];
const KINDS = ["Staff", "Instruments", "Compute"];
const YEARS = [
  [
    [820, 540, 310],
    [460, 610, 90],
    [380, 120, 260],
    [520, 300, 140],
    [240, 90, 30],
  ],
  [
    [840, 420, 360],
    [470, 380, 110],
    [520, 160, 640],
    [540, 280, 170],
    [250, 110, 40],
  ],
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { MarimekkoChart } = ui;
  const [y, setY] = useState(0);
  const data = LABS.flatMap((x, i) => KINDS.map((series, j) => ({ x, series, value: YEARS[y][i][j] })));
  return (
    <div style={{ width: "100%", maxWidth: 720, display: "grid", gap: 8 }}>
      <MarimekkoChart title="Spend by lab" description={y === 0 ? "This year, k€" : "Next year's plan, k€"} data={data} />
      <div style={{ ...caption, textAlign: "center" }}>
        Point at a block, or Tab in and use the arrows.{" "}
        <button type="button" style={textButton} onClick={() => setY(1 - y)}>
          Show {y === 0 ? "next year" : "this year"}
        </button>
      </div>
    </div>
  );
}
