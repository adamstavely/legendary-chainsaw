import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's compliance office: each audit's readiness score against its target, over poor, fair and good
   bands (“Show next quarter” glides the bars to the plan), and instrument uptime on one shared scale with the status
   tints. */

const QUARTERS = [
  [
    { label: "Biosafety", value: 72, target: 85, poor: 50, fair: 75 },
    { label: "Data retention", value: 91, target: 90, poor: 60, fair: 80 },
    { label: "Instrument calibration", value: 48, target: 80, poor: 50, fair: 70 },
    { label: "Sample custody", value: 83, target: 95, poor: 70, fair: 88 },
  ],
  [
    { label: "Biosafety", value: 86, target: 85, poor: 50, fair: 75 },
    { label: "Data retention", value: 88, target: 90, poor: 60, fair: 80 },
    { label: "Instrument calibration", value: 71, target: 80, poor: 50, fair: 70 },
    { label: "Sample custody", value: 90, target: 95, poor: 70, fair: 88 },
  ],
];
const UPTIME = [
  { label: "Sequencer", value: 97, target: 98, poor: 90, fair: 95 },
  { label: "Cryo-EM", value: 89, target: 95, poor: 90, fair: 95 },
  { label: "Mass spec", value: 99, target: 97, poor: 90, fair: 95 },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { BulletChart } = ui;
  const [q, setQ] = useState(0);
  return (
    <div style={{ width: "100%", maxWidth: 980, display: "grid", gap: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 12 }}>
        <BulletChart title="Audit readiness" description={q === 0 ? "This quarter, score out of 100" : "Next quarter, planned"} data={QUARTERS[q]} ranges={["poor", "fair"]} />
        <BulletChart title="Instrument uptime" description="This month, %" data={UPTIME} ranges={["poor", "fair"]} unit="%" independent={false} rangeTone="status" />
      </div>
      <div style={{ ...caption, textAlign: "center" }}>
        Point at a row, or Tab in and use the arrows.{" "}
        <button type="button" style={textButton} onClick={() => setQ(1 - q)}>
          Show {q === 0 ? "next quarter" : "this quarter"}
        </button>
      </div>
    </div>
  );
}
