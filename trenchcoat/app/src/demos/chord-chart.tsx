import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's shared instruments: hours each lab booked on another lab's instruments this quarter. “Show
   next quarter” glides the arcs and ribbons to the next quarter's bookings, when Neuro starts using the microscopes. */

const LABS = ["Genomics", "Imaging", "Proteomics", "Neuro", "Climate"];
// [from][to]: hours booked by the row's lab on the column's instruments
const QUARTERS = [
  [
    [0, 40, 62, 12, 8],
    [28, 0, 18, 22, 4],
    [55, 14, 0, 9, 0],
    [10, 30, 6, 0, 3],
    [6, 2, 0, 4, 0],
  ],
  [
    [0, 36, 58, 14, 10],
    [24, 0, 20, 18, 6],
    [50, 16, 0, 11, 0],
    [12, 74, 8, 0, 5],
    [8, 4, 2, 6, 0],
  ],
];

const bookings = (q: number) => LABS.flatMap((source, i) => LABS.map((target, j) => ({ source, target, value: QUARTERS[q][i][j] }))).filter((r) => r.value > 0);

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ChordChart } = ui;
  const [q, setQ] = useState(0);
  return (
    <div style={{ width: "100%", maxWidth: 620, display: "grid", gap: 8 }}>
      <ChordChart title="Shared instrument time" description={q === 0 ? "Hours booked across labs, this quarter" : "Hours booked across labs, next quarter"} data={bookings(q)} unit=" h" />
      <div style={{ ...caption, textAlign: "center" }}>
        Point at a lab or a ribbon, or Tab in and use the arrows.{" "}
        <button type="button" style={textButton} onClick={() => setQ(1 - q)}>
          Show {q === 0 ? "next quarter" : "this quarter"}
        </button>
      </div>
    </div>
  );
}
