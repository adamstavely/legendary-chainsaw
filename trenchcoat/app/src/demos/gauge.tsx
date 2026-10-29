import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { GaugeBand } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A biobank's storage at a glance: an ultra-low freezer's temperature, how full the racks are, and the alarm level a
   technician can drag. "Next reading" warms the freezer a little each time, through its bands. */

const FREEZER: GaugeBand[] = [
  { to: -75, tone: "success", label: "In range" },
  { to: -68, tone: "warning", label: "Warming" },
  { to: -60, tone: "danger", label: "Too warm" },
];
const STORAGE: GaugeBand[] = [
  { to: 70, tone: "success", label: "Room to spare" },
  { to: 90, tone: "warning", label: "Filling up" },
  { to: 100, tone: "danger", label: "Nearly full" },
];
const READINGS = [-80.4, -78.9, -76.2, -73.5, -70.1, -66.8, -80.1];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { Gauge } = ui;
  const [i, setI] = useState(0);
  const [alarm, setAlarm] = useState(-70);
  return (
    <div style={{ width: "100%", maxWidth: 760, display: "grid", gap: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        <Gauge label="Freezer B-3" description="Ultra-low, −80 °C set point" unit="°C" min={-90} max={-60} value={READINGS[i]} previous={i ? READINGS[i - 1] : undefined} previousLabel="the last reading" good="down" bands={FREEZER} target={alarm} targetLabel="Alarm at" />
        <Gauge label="Rack space used" description="All cryo racks" variant="semicircle" unit="%" value={78} previous={74} previousLabel="last month" good="down" bands={STORAGE} target={85} />
        <Gauge label="Alarm level" description="Drag or use the arrow keys" variant="bar" unit="°C" min={-90} max={-60} step={0.5} editable value={alarm} onValueChange={setAlarm} bands={FREEZER} />
      </div>
      <div style={{ ...caption, textAlign: "center" }}>
        Reading {i + 1} of {READINGS.length}; the alarm is at {alarm} °C.{" "}
        <button type="button" style={textButton} onClick={() => setI((i + 1) % READINGS.length)}>
          Next reading
        </button>
      </div>
    </div>
  );
}
