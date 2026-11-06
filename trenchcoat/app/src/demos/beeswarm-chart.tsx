import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's sample-prep labs: every assay's turnaround in hours, a row per lab with its median (“Show
   last month” glides the dots to the other month, where Imaging's backlog clears), and a month of compute jobs' queue
   waits – 3,000 of them, past the threshold, so they're painted on a canvas. */

const LABS = ["Genomics", "Imaging", "Proteomics", "Neuro"];
/** Each lab's centre and spread, this month and last */
const MONTHS = [
  [
    [6, 2.2],
    [11, 3.5],
    [4.5, 1.6],
    [7.5, 2.8],
  ],
  [
    [6.5, 2],
    [7, 2.4],
    [5, 1.8],
    [8, 3],
  ],
];

/** A deterministic stream of numbers in [0, 1) */
function stream(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function assays(month: number) {
  const rnd = stream(29);
  return LABS.flatMap((lab, li) =>
    Array.from({ length: 36 }, (_, i) => {
      const [mid, spread] = MONTHS[month][li];
      const v = mid + (rnd() + rnd() + rnd() - 1.5) * spread;
      return { lab, hours: Math.round(Math.max(0.5, v) * 10) / 10, label: `${lab.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(3, "0")}` };
    }),
  );
}

const rnd = stream(101);
const JOBS = Array.from({ length: 3000 }, (_, i) => ({ wait: Math.round(Math.exp(1.2 + (rnd() + rnd() + rnd() - 1.5) * 1.4) * 10) / 10, label: `Job ${i + 1}` }));

export default function Demo({ ui }: { ui: typeof UI }) {
  const { BeeswarmChart } = ui;
  const [m, setM] = useState(0);
  return (
    <div style={{ width: "100%", maxWidth: 980, display: "grid", gap: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
        <BeeswarmChart title="Assay turnaround" description={m === 0 ? "This month, by lab" : "Last month, by lab"} data={assays(m)} value="hours" group="lab" unit=" h" />
        <BeeswarmChart title="Compute queue waits" description="3,000 jobs this month" data={JOBS} value="wait" unit=" min" />
      </div>
      <div style={{ ...caption, textAlign: "center" }}>
        Point at a dot, or Tab in and use the arrows.{" "}
        <button type="button" style={textButton} onClick={() => setM(1 - m)}>
          Show {m === 0 ? "last month" : "this month"}
        </button>
      </div>
    </div>
  );
}
