import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's grant money, in millions: from funders to labs to what the labs spend it on. “Show next
   year” glides the bands to the next year's budget, where the foundation money moves from Imaging to Climate. */

const LABS = ["Genomics", "Imaging", "Climate"] as const;
const FUNDERS = ["Federal grants", "Foundation", "Industry"] as const;
const SPEND = ["Staff", "Instruments", "Compute"] as const;
// [funder][lab] and [lab][spend], one table per year
const YEARS = [
  {
    fund: [
      [6.4, 3.1, 2.2],
      [1.2, 2.6, 0.8],
      [2.1, 0.9, 0.4],
    ],
    spend: [
      [5.2, 2.4, 2.1],
      [3.0, 3.1, 0.5],
      [1.8, 0.4, 1.2],
    ],
  },
  {
    fund: [
      [6.8, 2.9, 2.6],
      [1.0, 0.9, 2.9],
      [2.3, 1.1, 0.5],
    ],
    spend: [
      [5.4, 2.6, 2.1],
      [2.4, 2.1, 0.4],
      [2.9, 0.7, 2.4],
    ],
  },
];

const flows = (y: number) => [
  ...FUNDERS.flatMap((source, i) => LABS.map((target, j) => ({ source, target, value: YEARS[y].fund[i][j] }))),
  ...LABS.flatMap((source, i) => SPEND.map((target, j) => ({ source, target, value: YEARS[y].spend[i][j] }))),
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { SankeyChart } = ui;
  const [y, setY] = useState(0);
  return (
    <div style={{ width: "100%", maxWidth: 760, display: "grid", gap: 8 }}>
      <SankeyChart title="Grant funding" description={y === 0 ? "This year, in millions" : "Next year's budget, in millions"} data={flows(y)} format={{ maximumFractionDigits: 1 }} unit="M" />
      <div style={{ ...caption, textAlign: "center" }}>
        Point at a node or a band, or Tab in and use the arrows.{" "}
        <button type="button" style={textButton} onClick={() => setY(1 - y)}>
          Show {y === 0 ? "next year" : "this year"}
        </button>
      </div>
    </div>
  );
}
