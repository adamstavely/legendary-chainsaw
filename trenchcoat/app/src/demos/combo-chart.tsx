import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's sequencing core over a year: samples processed by two labs as bars (side by side, or
   stacked with “Stack the labs”) against the median turnaround in hours as a line on its own axis at the right. */

const MONTHS = ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11", "2026-12"];
const GENOMICS = [182, 196, 210, 188, 224, 241, 205, 176, 232, 258, 247, 199];
const PROTEOMICS = [96, 104, 118, 122, 109, 131, 127, 98, 140, 152, 149, 121];
const HOURS = [41, 44, 47, 43, 52, 58, 49, 38, 55, 63, 60, 46];

const DATA = MONTHS.map((month, i) => ({ month, genomics: GENOMICS[i], proteomics: PROTEOMICS[i], hours: HOURS[i] }));

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ComboChart } = ui;
  const [stacked, setStacked] = useState(false);
  return (
    <div style={{ width: "100%", maxWidth: 980, display: "grid", gap: 8 }}>
      <ComboChart
        title="Samples and turnaround"
        description="Samples processed by lab each month, against the median turnaround"
        data={DATA}
        x="month"
        bars={["genomics", "proteomics"]}
        lines={["hours"]}
        seriesLabels={{ genomics: "Genomics", proteomics: "Proteomics", hours: "Median turnaround" }}
        stacked={stacked}
        lineUnit=" h"
        yLabel="Samples"
        y2Label="Hours"
      />
      <div style={{ ...caption, textAlign: "center" }}>
        Point at a month, or Tab in and use the arrows.{" "}
        <button type="button" style={textButton} onClick={() => setStacked(!stacked)}>
          {stacked ? "Set the labs side by side" : "Stack the labs"}
        </button>
      </div>
    </div>
  );
}
