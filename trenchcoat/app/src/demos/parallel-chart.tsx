import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's shared instruments compared on four measures at once: uptime, cost per hour, the queue in
   days and the share of bookings by outside groups. The queue runs upside down – less is better – so a good
   instrument stays high all the way across. “Show last quarter” glides the lines to the quarter before. */

const NAMES = ["Cryo-EM", "Mass spec", "Sequencer", "Confocal", "NMR", "Flow cytometer", "X-ray diffractometer", "Light-sheet", "Mass cytometer", "Super-resolution"];
// [uptime %, cost per hour, queue days, outside %] per instrument, one table per quarter
const QUARTERS = [
  [[97, 410, 6, 22], [88, 180, 14, 35], [92, 260, 9, 18], [79, 120, 3, 41], [84, 330, 11, 12], [91, 95, 2, 48], [86, 220, 7, 9], [94, 150, 5, 27], [81, 280, 12, 15], [89, 200, 8, 31]],
  [[93, 400, 9, 19], [91, 175, 10, 38], [87, 255, 12, 21], [83, 125, 4, 36], [90, 320, 7, 15], [88, 100, 3, 44], [82, 230, 9, 11], [95, 145, 4, 30], [85, 270, 10, 13], [80, 210, 13, 28]],
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ParallelChart } = ui;
  const [q, setQ] = useState(0);
  const data = NAMES.map((label, i) => {
    const [uptime, cost, queue, outside] = QUARTERS[q][i];
    return { label, uptime, cost, queue, outside };
  });
  return (
    <div style={{ width: "100%", maxWidth: 980, display: "grid", gap: 8 }}>
      <ParallelChart
        title="Shared instruments"
        description={q === 0 ? "This quarter" : "Last quarter"}
        data={data}
        dimensionLabels={{ uptime: "Uptime", cost: "Cost / hour", queue: "Queue (days)", outside: "Outside use" }}
        formats={{ uptime: { maximumFractionDigits: 0, suffix: "%" }, cost: { style: "currency", currency: "USD", maximumFractionDigits: 0 }, outside: { maximumFractionDigits: 0, suffix: "%" } }}
        invert={["queue"]}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        Point at a line, or Tab in and use the arrows.{" "}
        <button type="button" style={textButton} onClick={() => setQ(1 - q)}>
          Show {q === 0 ? "last quarter" : "this quarter"}
        </button>
      </div>
    </div>
  );
}
