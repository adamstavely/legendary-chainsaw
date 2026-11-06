import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's ultra-low freezers: each day's first, warmest, coldest and last temperature reading, with
   door openings as volume and a five-day average (“Show Freezer C” glides the candles to the other freezer). */

/** A deterministic sequence in [0, 1) */
function seq(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function freezer(seed: number, setpoint: number, drift: number) {
  const rnd = seq(seed);
  let t = setpoint;
  return Array.from({ length: 30 }, (_, k) => {
    const open = t;
    // A defrost cycle every ten days warms it for a day
    const pull = (setpoint - t) * 0.35 + (k % 10 === 7 ? 1.4 : 0) + (rnd() - 0.5) * drift;
    const close = Math.round((open + pull) * 10) / 10;
    const door = Math.round(2 + rnd() * 6 + (k % 7 < 5 ? 4 : 0));
    const high = Math.round((Math.max(open, close) + rnd() * 0.25 * door * 0.2 + 0.1) * 10) / 10;
    const low = Math.round((Math.min(open, close) - rnd() * 0.4 - 0.1) * 10) / 10;
    t = close;
    return { date: `2026-10-${String(k + 1).padStart(2, "0")}`, open, high, low, close, door };
  });
}
const FREEZERS = [
  { name: "Freezer B", data: freezer(7, -80, 1.2) },
  { name: "Freezer C", data: freezer(23, -79, 1.8) },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { CandlestickChart } = ui;
  const [i, setI] = useState(0);
  const f = FREEZERS[i];
  return (
    <div style={{ width: "100%", maxWidth: 760, display: "grid", gap: 8 }}>
      <CandlestickChart title={f.name} description="October, daily temperature in °C" unit=" °C" data={f.data} volume="door" ma={[5]} />
      <div style={{ ...caption, textAlign: "center" }}>
        Hollow candles warmed over the day, solid ones cooled.{" "}
        <button type="button" style={textButton} onClick={() => setI(1 - i)}>
          Show {i === 0 ? "Freezer C" : "Freezer B"}
        </button>
      </div>
    </div>
  );
}
