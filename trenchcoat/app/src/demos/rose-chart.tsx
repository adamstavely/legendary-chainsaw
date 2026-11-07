import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's grants office: applications received each month, one wedge per month, and the same months
   split by funder (“Show last year” glides the wedges to the year before). */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const FUNDERS = ["Research council", "Foundations", "Industry"];
const YEARS = [
  [
    [22, 9, 4],
    [26, 11, 5],
    [34, 14, 6],
    [18, 8, 7],
    [15, 6, 5],
    [12, 9, 3],
    [8, 4, 2],
    [10, 5, 3],
    [28, 12, 6],
    [31, 15, 8],
    [24, 10, 6],
    [14, 7, 4],
  ],
  [
    [18, 8, 3],
    [21, 9, 4],
    [29, 12, 5],
    [20, 7, 5],
    [13, 7, 4],
    [10, 6, 3],
    [7, 3, 2],
    [9, 4, 2],
    [23, 11, 5],
    [27, 12, 6],
    [19, 9, 5],
    [12, 6, 3],
  ],
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { RoseChart } = ui;
  const [y, setY] = useState(0);
  const year = YEARS[y];
  const totals = MONTHS.map((label, k) => ({ label, value: year[k].reduce((a, b) => a + b, 0) }));
  const split = MONTHS.flatMap((label, k) => FUNDERS.map((series, s) => ({ label, series, value: year[k][s] })));
  return (
    <div style={{ width: "100%", maxWidth: 980, display: "grid", gap: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
        <RoseChart title="Grant applications" description={y === 0 ? "By month, this year" : "By month, last year"} data={totals} />
        <RoseChart title="Applications by funder" description="Each month split by who funds it" data={split} series="series" innerRadius={0.18} />
      </div>
      <div style={{ ...caption, textAlign: "center" }}>
        Point at a wedge, or Tab in and use the arrows.{" "}
        <button type="button" style={textButton} onClick={() => setY(1 - y)}>
          Show {y === 0 ? "last year" : "this year"}
        </button>
      </div>
    </div>
  );
}
