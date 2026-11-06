import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's sequencing core: how many hours each of 300 assays took to turn round this month, binned –
   with a density curve and the mean and median, and as a running total. “Use 2-hour bins” fixes the bin width. */

/** A deterministic sequence in [0, 1) */
function seq(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Most assays take a day or so; a slower batch waits for a second run
const rnd = seq(29);
const HOURS = Array.from({ length: 300 }, (_, k) => {
  const z = (rnd() + rnd() + rnd() + rnd() - 2) * 1.7;
  const slow = k % 7 === 3;
  const v = slow ? 38 + z * 5 : 22 + z * 4;
  return { value: Math.round(Math.max(4, v) * 10) / 10 };
});

export default function Demo({ ui }: { ui: typeof UI }) {
  const { Histogram } = ui;
  const [fixed, setFixed] = useState(false);
  return (
    <div style={{ width: "100%", maxWidth: 980, display: "grid", gap: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
        <Histogram title="Assay turnaround" description="300 assays this month, hours" unit=" h" data={HOURS} density markers="both" binWidth={fixed ? 2 : undefined} />
        <Histogram title="Assays finished within" description="Running total, hours" unit=" h" data={HOURS} cumulative binWidth={fixed ? 2 : undefined} />
      </div>
      <div style={{ ...caption, textAlign: "center" }}>
        Point at a bin, or Tab in and use the arrows.{" "}
        <button type="button" style={textButton} onClick={() => setFixed(!fixed)}>
          {fixed ? "Pick bins automatically" : "Use 2-hour bins"}
        </button>
      </div>
    </div>
  );
}
