import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { RhythmKind, RhythmRow, RhythmSegment } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* When a support agent's work happens across a typical day, from their own time tracker: weekdays and the weekend as
   two rows, with the now marker at 14:20. Choosing a block names it below. */

const KINDS: RhythmKind[] = [
  { id: "home", label: "Home" },
  { id: "work", label: "Work" },
  { id: "transit", label: "Transit" },
  { id: "focus", label: "Focus" },
  { id: "gym", label: "Gym" },
];
const h = (hh: number, mm = 0) => hh * 60 + mm;

const ROWS: RhythmRow[] = [
  {
    id: "weekdays",
    label: "Weekdays",
    segments: [
      { start: h(19, 30), end: h(7, 30), kind: "home", place: "Home" },
      { start: h(7, 30), end: h(8, 15), kind: "transit", place: "Tram 4" },
      { start: h(8, 15), end: h(12), kind: "work", place: "Harbour office" },
      { start: h(12), end: h(13), kind: "focus", place: "Library café" },
      { start: h(13), end: h(17, 30), kind: "work", place: "Harbour office" },
      { start: h(17, 30), end: h(18, 15), kind: "transit", place: "Tram 4" },
      { start: h(18, 15), end: h(19, 30), kind: "gym", place: "Riverside gym" },
    ],
  },
  {
    id: "weekend",
    label: "Weekend",
    segments: [
      { start: h(22), end: h(9, 30), kind: "home", place: "Home" },
      { start: h(10), end: h(12), kind: "gym", place: "Riverside gym" },
      { start: h(13), end: h(16), kind: "focus", place: "Library café" },
      { start: h(16), end: h(22), kind: "home", place: "Home" },
    ],
  },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { DayRhythm, rhythmTime } = ui;
  const [chosen, setChosen] = useState<RhythmSegment | null>(null);
  return (
    <div style={{ width: "100%", maxWidth: 720, display: "grid", gap: 8 }}>
      <DayRhythm title="Daily rhythm" description="Typical day, last 30 days · from your time tracker" kinds={KINDS} rows={ROWS} now={h(14, 20)} onSelect={(_, s) => setChosen(s)} />
      <div style={{ ...caption, textAlign: "center" }}>
        {chosen ? `Chosen: ${chosen.place} from ${rhythmTime(chosen.start)} to ${rhythmTime(chosen.end)}.` : "Point at a block, or move with the arrow keys and press Enter to choose it."}
      </div>
    </div>
  );
}
