import { useEffect, useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's sequencing core: samples processed by lab this week, last week marked on each bar (“Show
   last week” glides the bars to the other week); the same weeks split by instrument, stacked; and this week day by day
   with today still counting, beside the median turnaround – point at a day in one and the other follows. */

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

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const PER_DAY = [118, 142, 131, 156];
const TURNAROUND = [31, 28, 34, 26, 29];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { BarChart } = ui;
  const [w, setW] = useState(0);
  const data = LABS.map((x, i) => ({ x, y: WEEKS[w][i], prev: WEEKS[1 - w][i] }));
  // Today's count climbs while the page is open, as samples come off the line
  const [today, setToday] = useState(64);
  useEffect(() => {
    const t = setInterval(() => setToday((n) => (n >= 150 ? 64 : n + 3 + Math.round(Math.random() * 4))), 1600);
    return () => clearInterval(t);
  }, []);
  const { LineChart } = ui;
  const perDay = DAYS.map((x, k) => ({ x, y: k < 4 ? PER_DAY[k] : today }));
  return (
    <div style={{ width: "100%", maxWidth: 980, display: "grid", gap: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
        <BarChart title="Samples processed" description={w === 0 ? "This week by lab, against last week" : "Last week by lab, against this week"} data={data} compare="prev" compareLabel={w === 0 ? "Last week" : "This week"} />
        <BarChart title="Sequencing runs" description="By day and instrument" data={RUNS} x="day" y="runs" series="instrument" layout="stacked" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
        <BarChart title="Samples by day" description="This week – today is still counting" data={perDay} live sync="core-week" highlight="none" />
        <LineChart title="Median turnaround" description="Hours from receipt to result" unit=" h" data={DAYS.map((x, k) => ({ x, y: TURNAROUND[k] }))} sync="core-week" xType="band" curve="linear" />
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
