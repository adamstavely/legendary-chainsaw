import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ActiveDaysDay } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's audit team and its daily reviews, against a goal of 40 a day, over three months: busy
   weekdays, light weekends, a quiet week in late August and two days in September the tracker lost. */

const TODAY = new Date(2026, 9, 27, 12).getTime();
const GOAL = 40;

/** A small deterministic noise, so the demo looks the same every time */
const noise = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const DAYS: ActiveDaysDay[] = Array.from({ length: 88 }, (_, i) => {
  const at = new Date(2026, 7, 1 + i, 12);
  const weekend = at.getDay() === 0 || at.getDay() === 6;
  const quiet = at.getMonth() === 7 && at.getDate() >= 24 && at.getDate() <= 28;
  const lost = at.getMonth() === 8 && (at.getDate() === 9 || at.getDate() === 10);
  const n = noise(i + 7);
  const value = lost ? null : Math.round((weekend ? 8 + 14 * n : quiet ? 12 + 16 * n : 30 + 22 * n) * (0.9 + i / 600));
  return { date: iso(at), value };
});

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ActiveDays } = ui;
  const [monday, setMonday] = useState(true);
  const [date, setDate] = useState<string | null>(null);
  const [value, setValue] = useState<number | null | undefined>(undefined);
  return (
    <div style={{ width: "100%", maxWidth: 420, display: "grid", gap: 8 }}>
      <ActiveDays
        title="Daily reviews"
        description="Records reviewed by the audit team, goal 40 a day."
        unit="reviews"
        goal={GOAL}
        days={DAYS}
        now={TODAY}
        weekStart={monday ? 1 : 0}
        date={date}
        onDateChange={(d, v) => {
          setDate(d);
          setValue(v);
        }}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {date === null ? "Point at a day, or move with the arrow keys and Page Up / Down and press Enter. " : `Selected ${date}: ${value === null ? "no data" : `${value} reviews`}. `}
        <button type="button" style={textButton} onClick={() => setMonday(!monday)}>
          {monday ? "Start weeks on Sunday" : "Start weeks on Monday"}
        </button>
      </div>
    </div>
  );
}
