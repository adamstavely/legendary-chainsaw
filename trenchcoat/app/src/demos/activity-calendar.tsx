import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ActivityCalendarDay } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A year of code reviews by one engineer, helped by an agent: busy weekdays, quiet weekends, a two-week holiday in
   August and three days in March the review tool lost. "Monday first" starts the weeks on Monday. */

const END = new Date(2026, 9, 27, 12).getTime();

/** A small deterministic noise, so the demo looks the same every time */
const noise = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

const DAYS: ActivityCalendarDay[] = Array.from({ length: 371 }, (_, i) => {
  const at = new Date(2026, 9, 27 - i, 12);
  const weekend = at.getDay() === 0 || at.getDay() === 6;
  const holiday = at.getMonth() === 7 && at.getDate() >= 10 && at.getDate() <= 23;
  const lost = at.getMonth() === 2 && at.getDate() >= 4 && at.getDate() <= 6;
  const n = noise(i);
  // A ramp-up through the year, more reviews mid-week, and the odd quiet day
  const base = (weekend ? 0.6 : 4 + 2 * Math.sin((at.getDay() / 6) * Math.PI)) * (0.6 + (365 - Math.min(i, 365)) / 600);
  const value = lost ? null : holiday ? 0 : n < 0.18 ? 0 : Math.round(base * (0.4 + 1.4 * n));
  return { date: at.getTime(), value };
});

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ActivityCalendar } = ui;
  const [monday, setMonday] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [value, setValue] = useState<number | null | undefined>(undefined);
  return (
    <div style={{ width: "100%", maxWidth: 820, display: "grid", gap: 8 }}>
      <ActivityCalendar
        title="Code reviews"
        description="Pull requests reviewed with the review agent, the past year."
        unit="reviews"
        days={DAYS}
        end={END}
        weekStart={monday ? 1 : 0}
        selected={selected}
        onSelectedChange={(s, v) => {
          setSelected(s);
          setValue(v);
        }}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {selected === null
          ? "Point at a day, or move with the arrow keys and press Enter to select it. "
          : `Selected ${new Date(selected).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}: ${value === null ? "no data" : `${value} reviews`}. `}
        <button type="button" style={textButton} onClick={() => setMonday(!monday)}>
          {monday ? "Start weeks on Sunday" : "Start weeks on Monday"}
        </button>
      </div>
    </div>
  );
}
