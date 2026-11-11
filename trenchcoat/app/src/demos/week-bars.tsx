import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's document-review team: documents reviewed each day against a daily goal of 400, over three
   weeks (“Show the week before” glides the bars to it). Today is Thursday of the latest week. */

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const week = (label: string, values: number[]) => ({ label, days: DAYS.map((d, i) => ({ label: d, value: values[i] })) });
const WEEKS = [
  week("Mar 3–9", [362, 418, 405, 377, 441, 120, 64]),
  week("Mar 10–16", [428, 395, 452, 410, 386, 140, 90]),
  week("Mar 17–23", [446, 472, 381, 412, 0, 0, 0]),
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { WeekBars } = ui;
  const [w, setW] = useState(2);
  return (
    <div style={{ width: "100%", maxWidth: 520, display: "grid", gap: 8 }}>
      <WeekBars title="Documents reviewed" description="Each day, against the daily goal" weeks={WEEKS} week={w} onWeekChange={setW} goal={400} today={3} />
      <div style={{ ...caption, textAlign: "center" }}>
        Point at a day, or Tab in and use the arrows.{" "}
        <button type="button" style={textButton} onClick={() => setW(w > 0 ? w - 1 : 2)}>
          {w > 0 ? "Show the week before" : "Back to this week"}
        </button>
      </div>
    </div>
  );
}
