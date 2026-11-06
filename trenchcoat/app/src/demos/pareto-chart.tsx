import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's quality audits: findings by cause, largest first, with the running share – the few causes
   behind 80% of the findings take the accent (“Show last quarter” glides to the other quarter's counts) – next to
   instrument downtime by cause, written as ranks. */

const CAUSES = ["Labelling", "Storage temperature", "Chain of custody", "Calibration", "Training records", "Waste disposal", "Access logs"];
const QUARTERS = [
  [46, 31, 12, 9, 6, 4, 2],
  [22, 38, 9, 17, 5, 7, 3],
];
const DOWNTIME = [
  { cause: "Detector faults", hours: 62 },
  { cause: "Cooling", hours: 34 },
  { cause: "Software updates", hours: 18 },
  { cause: "Vacuum leaks", hours: 11 },
  { cause: "Power", hours: 6 },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  // Until the barrel lists it: the wrapper's own module
  const { ParetoChart } = ui;
  const [q, setQ] = useState(0);
  const data = CAUSES.map((label, i) => ({ label, value: QUARTERS[q][i] }));
  return (
    <div style={{ width: "100%", maxWidth: 980, display: "grid", gap: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
        <ParetoChart title="Audit findings" description={q === 0 ? "This quarter, by cause" : "Last quarter, by cause"} data={data} />
        <ParetoChart title="Instrument downtime" description="Hours this year, by cause" data={DOWNTIME} label="cause" value="hours" unit=" h" rankLabels />
      </div>
      <div style={{ ...caption, textAlign: "center" }}>
        Point at a bar, or Tab in and use the arrows.{" "}
        <button type="button" style={textButton} onClick={() => setQ(1 - q)}>
          Show {q === 0 ? "last quarter" : "this quarter"}
        </button>
      </div>
    </div>
  );
}
