import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's sequencing core: samples processed by lab this week and last (“Show last week” glides the
   bars to the other week), and the same weeks split by instrument, stacked. */

const LABS = ["Genomics", "Imaging", "Proteomics", "Field ecology", "Neuro", "Climate"];
const WEEKS = [
  [182, 96, 124, 58, 141, 73],
  [154, 118, 97, 66, 160, 81],
];
const RUNS = [
  { day: "Mon", instrument: "NovaSeq", runs: 14 },
  { day: "Mon", instrument: "MiSeq", runs: 9 },
  { day: "Mon", instrument: "PacBio", runs: 3 },
  { day: "Tue", instrument: "NovaSeq", runs: 17 },
  { day: "Tue", instrument: "MiSeq", runs: 7 },
  { day: "Tue", instrument: "PacBio", runs: 5 },
  { day: "Wed", instrument: "NovaSeq", runs: 12 },
  { day: "Wed", instrument: "MiSeq", runs: 11 },
  { day: "Wed", instrument: "PacBio", runs: 4 },
  { day: "Thu", instrument: "NovaSeq", runs: 19 },
  { day: "Thu", instrument: "MiSeq", runs: 8 },
  { day: "Thu", instrument: "PacBio", runs: 6 },
  { day: "Fri", instrument: "NovaSeq", runs: 15 },
  { day: "Fri", instrument: "MiSeq", runs: 10 },
  { day: "Fri", instrument: "PacBio", runs: 2 },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { BarChart } = ui;
  const [w, setW] = useState(0);
  const data = LABS.map((x, i) => ({ x, y: WEEKS[w][i] }));
  return (
    <div style={{ width: "100%", maxWidth: 980, display: "grid", gap: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
        <BarChart title="Samples processed" description={w === 0 ? "This week, by lab" : "Last week, by lab"} data={data} />
        <BarChart title="Sequencing runs" description="By day and instrument" data={RUNS} x="day" y="runs" series="instrument" layout="stacked" />
      </div>
      <div style={{ ...caption, textAlign: "center" }}>
        Point at a bar, or Tab in and use the arrows.{" "}
        <button type="button" style={textButton} onClick={() => setW(1 - w)}>
          Show {w === 0 ? "last week" : "this week"}
        </button>
      </div>
    </div>
  );
}
