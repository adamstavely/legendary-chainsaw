import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's compute cluster: GPU hours by lab this month (“Show last month” glides the parts), and the
   storage tiers as a thin bar with each tier in its own ink. */

const LABS = ["Genomics", "Imaging", "Climate", "Neuro", "Materials"];
const MONTHS = [
  [4200, 2650, 1800, 1240, 610],
  [3100, 2980, 2400, 900, 720],
];
const STORAGE = [
  { label: "Hot", value: 180 },
  { label: "Warm", value: 420 },
  { label: "Archive", value: 1350 },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { SegmentedBar } = ui;
  const [m, setM] = useState(0);
  const data = LABS.map((label, i) => ({ label, value: MONTHS[m][i] }));
  return (
    <div style={{ width: "100%", maxWidth: 980, display: "grid", gap: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 12 }}>
        <SegmentedBar title="GPU hours by lab" description={m === 0 ? "This month" : "Last month"} data={data} unit=" h" />
        <SegmentedBar title="Storage" description="Terabytes by tier" data={STORAGE} unit=" TB" variant="thin" sort={false} colorMode="categorical" />
      </div>
      <div style={{ ...caption, textAlign: "center" }}>
        Point at a part, or Tab in and use the arrows.{" "}
        <button type="button" style={textButton} onClick={() => setM(1 - m)}>
          Show {m === 0 ? "last month" : "this month"}
        </button>
      </div>
    </div>
  );
}
