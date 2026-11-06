import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's compute cluster: median job queue time by month for three partitions, the GPU partition
   emphasised against a target line (“Show 2025” glides the lines to the year before). */

const MONTHS = ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"];
const YEARS: Record<string, number[]>[] = [
  { GPU: [42, 48, 61, 55, 70, 64, 52, 47, 39, 35], CPU: [12, 14, 13, 16, 18, 15, 14, 12, 11, 12], "High memory": [25, 22, 28, 31, 27, 24, 26, 29, 23, 21] },
  { GPU: [30, 33, 38, 45, 52, 58, 61, 57, 50, 44], CPU: [15, 16, 14, 13, 15, 17, 16, 14, 13, 14], "High memory": [20, 23, 21, 25, 29, 33, 30, 27, 26, 24] },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { LineChart } = ui;
  const [i, setI] = useState(0);
  const year = YEARS[i];
  const data = MONTHS.flatMap((m, k) => Object.entries(year).map(([series, v]) => ({ x: i === 0 ? m : m.replace("2026", "2025"), y: v[k], series })));
  return (
    <div style={{ width: "100%", maxWidth: 760, display: "grid", gap: 8 }}>
      <LineChart title="Median queue time" description="Minutes from submit to start" unit=" min" data={data} series="series" highlight="GPU" referenceLines={[{ y: 45, label: "Target 45 min" }]} />
      <div style={{ ...caption, textAlign: "center" }}>
        Move along the lines to read every partition.{" "}
        <button type="button" style={textButton} onClick={() => setI(1 - i)}>
          Show {i === 0 ? "2025" : "2026"}
        </button>
      </div>
    </div>
  );
}
