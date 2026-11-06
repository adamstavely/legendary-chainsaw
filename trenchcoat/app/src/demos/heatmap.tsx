import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { HeatmapCell } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* How busy a core facility's shared instruments were last week, by weekday and hour: share of each hour booked. A
   cell starts selected; the legend's ends say "Quieter" and "Busier". "Show change from the week before" switches to a
   diverging scale of the difference. Below it, a detector's 48 channels over 8 hours in 5-minute bins – 4,608 cells,
   above the canvas threshold, so they're painted on a canvas and keep the keyboard, tooltip and selection. */

/** A small deterministic noise, so the demo looks the same every time */
const noise = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 12 }, (_, i) => `${String(i + 8).padStart(2, "0")}:00`);
const bookings = (week: number) =>
  DAYS.map((_, d) =>
    HOURS.map((_, h) => {
      // Saturday afternoon's booking system was down: no data
      if (week === 0 && d === 5 && (h === 6 || h === 7)) return null;
      const weekend = d >= 5 ? 0.25 : 1;
      const lunch = h === 4 ? 0.55 : 1;
      const shape = Math.sin(((h + 1) / 13) * Math.PI);
      return Math.round(Math.min(100, (18 + 78 * shape * weekend * lunch + (noise(week * 97 + d * 13 + h) - 0.5) * 24) * (d === 2 ? 1.08 : 1)));
    }),
  );
const LAST = bookings(0);
const BEFORE = bookings(1);
/** 48 channels × 96 five-minute bins from 09:00: a slow drift, a busy band of channels and a burst around 13:00 */
const CHANNELS = Array.from({ length: 48 }, (_, i) => `Ch ${String(i + 1).padStart(2, "0")}`);
const BINS = Array.from({ length: 96 }, (_, i) => `${String(9 + Math.floor(i / 12)).padStart(2, "0")}:${String((i % 12) * 5).padStart(2, "0")}`);
const COUNTS = CHANNELS.map((_, c) =>
  BINS.map((_, t) => {
    const band = Math.exp(-(((c - 20) / 7) ** 2));
    const burst = Math.exp(-(((t - 48) / 5) ** 2));
    return Math.round(40 + 25 * Math.sin(t / 15) + 120 * band + 260 * band * burst + noise(c * 131 + t) * 40);
  }),
);
const CHANGE = LAST.map((row, d) => row.map((v, h) => (v === null || BEFORE[d][h] === null ? null : v - (BEFORE[d][h] as number))));

export default function Demo({ ui }: { ui: typeof UI }) {
  const { Heatmap } = ui;
  const [change, setChange] = useState(false);
  const [selected, setSelected] = useState<HeatmapCell | null>({ row: 2, column: 6 });
  const values = change ? CHANGE : LAST;
  const v = selected ? values[selected.row][selected.column] : undefined;
  return (
    <div style={{ width: "100%", maxWidth: 760, display: "grid", gap: 8 }}>
      <Heatmap
        title="Instrument use"
        description={change ? "Change in hours booked from the week before, in points." : "Share of each hour booked, shared instruments, last week."}
        rows={DAYS}
        columns={HOURS}
        values={values}
        unit={change ? "pts" : "%"}
        scale={change ? "diverging" : "sequential"}
        min={change ? -40 : 0}
        max={change ? 40 : 100}
        rowHeader="Day"
        legendLabels={change ? ["Fewer", "More"] : ["Quieter", "Busier"]}
        crosshair
        selected={selected}
        onSelectedChange={setSelected}
      />
      <Heatmap
        title="Detector activity"
        description="Counts per channel in 5-minute bins, 09:00–17:00."
        rows={CHANNELS}
        columns={BINS}
        values={COUNTS}
        unit="counts"
        rowHeader="Channel"
        legendLabels={["Low", "High"]}
        defaultSelected={{ row: 20, column: 48 }}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {selected ? `Selected ${DAYS[selected.row]} ${HOURS[selected.column]}: ${v === null ? "no data" : `${v}${change ? " points" : "%"}`}. ` : "Point at a cell, or move with the arrow keys and press Enter. "}
        <button type="button" style={textButton} onClick={() => setChange(!change)}>
          {change ? "Show use" : "Show change from the week before"}
        </button>
      </div>
    </div>
  );
}
