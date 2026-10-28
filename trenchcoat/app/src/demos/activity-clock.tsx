import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ActivityDay, ActivityHourRef } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A week of agent runs for a support team: busy weekday mornings and early afternoons, a quiet weekend, and a
   Wednesday-night outage with no data. "Show next week" swaps in a week with a Friday release surge. */

const DAY = 86_400_000;
const START = Date.UTC(2026, 9, 19, 12);

/** A small deterministic noise, so the demo looks the same every time */
const noise = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};
/** How busy a weekday hour usually is, 0 to 1: a morning peak, a lunch dip, an afternoon shoulder */
const shape = (h: number) => Math.max(0, Math.exp(-((h - 10) ** 2) / 6) + 0.75 * Math.exp(-((h - 15) ** 2) / 8) + 0.12 * Math.exp(-((h - 21) ** 2) / 4));

const week = (offset: number, tweak: (d: number, h: number, v: number) => number | null): ActivityDay[] =>
  Array.from({ length: 7 }, (_, d) => {
    const scale = d === 5 ? 18 : d === 6 ? 9 : 60;
    return {
      date: START + (offset + d) * DAY,
      values: Array.from({ length: 24 }, (_, h) => tweak(d, h, Math.round(shape(h) * scale * (0.7 + 0.6 * noise(offset * 1000 + d * 24 + h))))),
    };
  });

const THIS_WEEK = week(0, (d, h, v) => (d === 2 && h >= 22 ? null : d === 3 && h < 2 ? null : v));
const NEXT_WEEK = week(7, (d, h, v) => (d === 4 && h >= 13 && h <= 18 ? v * 2 + 25 : v));

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ActivityClock } = ui;
  const [next, setNext] = useState(false);
  const [selected, setSelected] = useState<ActivityHourRef | null>(null);
  const [value, setValue] = useState<number | null | undefined>(undefined);
  const days = next ? NEXT_WEEK : THIS_WEEK;
  return (
    <div style={{ width: "100%", maxWidth: 760, display: "grid", gap: 8 }}>
      <ActivityClock
        title="Agent runs by hour"
        description="Support team, every agent run this week."
        unit="runs"
        days={days}
        selected={selected}
        onSelectedChange={(s, v) => {
          setSelected(s);
          setValue(v);
        }}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {selected
          ? `Selected ${new Date(selected.date).toLocaleDateString(undefined, { weekday: "long" })} at ${selected.hour % 12 || 12} ${selected.hour < 12 ? "AM" : "PM"}: ${value ?? "no data"}${value == null ? "" : " runs"}. `
          : "Point at an hour, or move with the arrow keys and press Enter to select it. "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setNext(!next);
            setSelected(null);
          }}
        >
          {next ? "Show this week" : "Show next week"}
        </button>
      </div>
    </div>
  );
}
