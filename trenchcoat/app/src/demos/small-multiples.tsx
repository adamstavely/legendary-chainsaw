import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ChartSpec } from "../../../src/elements/react/small-multiples";
import { caption, textButton } from "../demo-kit";

/* A research institute's labs: samples processed each month, a line per lab on one shared scale (“Show as bars”
   swaps the spec's type), and the instrument time booked at each site as a donut per site, each to its own scale. */

const MONTHS = ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08"];
const LABS: Record<string, number[]> = {
  Genomics: [182, 196, 210, 188, 224, 240, 231, 252],
  Imaging: [96, 102, 88, 110, 104, 98, 121, 117],
  Proteomics: [124, 131, 140, 128, 150, 162, 155, 171],
  Neuro: [141, 138, 152, 160, 149, 171, 180, 176],
  "Field ecology": [42, 51, 64, 88, 102, 96, 74, 58],
  Climate: [64, 61, 70, 73, 69, 77, 82, 80],
};
const SAMPLES = Object.entries(LABS).flatMap(([lab, v]) => MONTHS.map((month, k) => ({ lab, month, samples: v[k] })));

const BOOKINGS = [
  { site: "North campus", instrument: "Sequencers", hours: 412 },
  { site: "North campus", instrument: "Microscopes", hours: 268 },
  { site: "North campus", instrument: "Mass spec", hours: 131 },
  { site: "Harbour labs", instrument: "Sequencers", hours: 96 },
  { site: "Harbour labs", instrument: "Microscopes", hours: 154 },
  { site: "Harbour labs", instrument: "Mass spec", hours: 88 },
  { site: "Field station", instrument: "Sequencers", hours: 18 },
  { site: "Field station", instrument: "Microscopes", hours: 42 },
  { site: "Field station", instrument: "Mass spec", hours: 6 },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { SmallMultiples } = ui;
  const [bars, setBars] = useState(false);
  const spec: ChartSpec = { type: bars ? "bar" : "line", data: SAMPLES, encoding: { x: "month", y: "samples" } };
  return (
    <div style={{ width: "100%", maxWidth: 980, display: "grid", gap: 12 }}>
      <SmallMultiples title="Samples processed by lab" description="Each month this year, on one scale" spec={spec} facet="lab" sort="value" />
      <div style={{ ...caption, textAlign: "center" }}>
        Point at a month in one lab to see it in every lab.{" "}
        <button type="button" style={textButton} onClick={() => setBars(!bars)}>
          {bars ? "Show as lines" : "Show as bars"}
        </button>
      </div>
      <SmallMultiples
        title="Instrument time by site"
        description="Hours booked this quarter"
        spec={{ type: "donut", data: BOOKINGS, encoding: { label: "instrument", value: "hours" } }}
        facet="site"
        shared="none"
        minPanelWidth={200}
      />
    </div>
  );
}
