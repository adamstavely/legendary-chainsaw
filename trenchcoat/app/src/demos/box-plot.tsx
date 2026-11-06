import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's core facilities: how many days each lab's assays took to turn round this quarter and last
   (“Show last quarter” glides the boxes to the other quarter), as boxes and as violins. */

const LABS = ["Genomics", "Imaging", "Proteomics", "Metabolomics", "Flow cytometry"];
// Centre and spread of each lab's turnaround, per quarter
const SHAPE = [
  [
    [4.2, 1.1],
    [6.8, 2.0],
    [3.1, 0.8],
    [5.4, 1.6],
    [2.6, 0.7],
  ],
  [
    [5.0, 1.4],
    [5.9, 1.5],
    [3.6, 1.0],
    [6.3, 2.2],
    [2.9, 0.9],
  ],
];

/** A deterministic sequence in [0, 1) */
function seq(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function quarter(q: number) {
  const rnd = seq(17 + q);
  return LABS.flatMap((group, g) => {
    const [mu, sd] = SHAPE[q][g];
    return Array.from({ length: 28 }, (_, k) => {
      // Roughly normal (the sum of three), with the odd slow assay
      const z = (rnd() + rnd() + rnd() - 1.5) * 2;
      const slow = k % 13 === 5 ? sd * 3 : 0;
      return { group, value: Math.round(Math.max(0.5, mu + z * sd + slow) * 10) / 10 };
    });
  });
}
const QUARTERS = [quarter(0), quarter(1)];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { BoxPlot } = ui;
  const [q, setQ] = useState(0);
  const when = q === 0 ? "This quarter" : "Last quarter";
  return (
    <div style={{ width: "100%", maxWidth: 980, display: "grid", gap: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
        <BoxPlot title="Assay turnaround" description={`${when}, days by lab`} unit=" d" data={QUARTERS[q]} />
        <BoxPlot title="Assay turnaround" description={`${when}, as violins`} unit=" d" variant="both" data={QUARTERS[q]} />
      </div>
      <div style={{ ...caption, textAlign: "center" }}>
        Point at a lab, or Tab in and use the arrows.{" "}
        <button type="button" style={textButton} onClick={() => setQ(1 - q)}>
          Show {q === 0 ? "last quarter" : "this quarter"}
        </button>
      </div>
    </div>
  );
}
