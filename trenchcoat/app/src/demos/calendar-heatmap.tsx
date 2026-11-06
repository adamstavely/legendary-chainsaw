import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's sample-intake desk: samples logged each day from January to June – busy midweek, quiet at
   weekends, a closure week at Easter. “Show last year” re-shades the grid with the year before. */

/** A seeded pseudo-random number in [0, 1), so the thumbnail is the same every time */
const noise = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

function intake(year: number) {
  const rows: { date: string; samples: number }[] = [];
  for (let d = new Date(year, 0, 1); d.getFullYear() === year && d.getMonth() < 6; d.setDate(d.getDate() + 1)) {
    const wd = d.getDay();
    const iso = `${year}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const closed = d.getMonth() === 3 && d.getDate() >= (year === 2026 ? 3 : 14) && d.getDate() < (year === 2026 ? 10 : 21);
    const weekend = wd === 0 || wd === 6;
    const base = weekend ? 2 : 10 + 6 * Math.sin((wd / 6) * Math.PI) + (d.getMonth() / 5) * (year === 2026 ? 8 : 3);
    rows.push({ date: iso, samples: closed ? 0 : Math.max(0, Math.round(base * (0.55 + noise(d.getTime() / 864e5) * 0.9))) });
  }
  return rows;
}
const YEARS = { 2026: intake(2026), 2025: intake(2025) };

export default function Demo({ ui }: { ui: typeof UI }) {
  const { CalendarHeatmap } = ui;
  const [year, setYear] = useState<2025 | 2026>(2026);
  return (
    <div style={{ width: "100%", maxWidth: 980, display: "grid", gap: 8 }}>
      <CalendarHeatmap title="Samples logged" description={`January to June ${year}, by day`} data={YEARS[year]} value="samples" unit=" samples" weekStart={1} />
      <div style={{ ...caption, textAlign: "center" }}>
        Point at a day, or Tab in and use the arrows – ← → move a week.{" "}
        <button type="button" style={textButton} onClick={() => setYear(year === 2026 ? 2025 : 2026)}>
          Show {year === 2026 ? "last year" : "this year"}
        </button>
      </div>
    </div>
  );
}
