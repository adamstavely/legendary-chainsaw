import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's compute cluster: GPU hours this quarter by division and lab (“Show next quarter” moves the
   hours and the tiles glide to their new sizes). */

const LABS = [
  { division: "Life sciences", lab: "Genomics", q: [1840, 1520] },
  { division: "Life sciences", lab: "Proteomics", q: [920, 1180] },
  { division: "Life sciences", lab: "Neuro imaging", q: [760, 840] },
  { division: "Physical sciences", lab: "Climate models", q: [1420, 1690] },
  { division: "Physical sciences", lab: "Materials", q: [610, 540] },
  { division: "Physical sciences", lab: "Optics", q: [280, 330] },
  { division: "Shared services", lab: "Data platform", q: [480, 520] },
  { division: "Shared services", lab: "Training", q: [190, 260] },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { Treemap } = ui;
  const [q, setQ] = useState(0);
  const data = LABS.map((l) => ({ group: l.division, label: l.lab, value: l.q[q] }));
  return (
    <div style={{ width: "100%", maxWidth: 720, display: "grid", gap: 8 }}>
      <Treemap title="GPU hours" description={q === 0 ? "This quarter, by division and lab" : "Next quarter (planned)"} unit=" h" data={data} group="group" />
      <div style={{ ...caption, textAlign: "center" }}>
        Point at a tile, or Tab in and use the arrows.{" "}
        <button type="button" style={textButton} onClick={() => setQ(1 - q)}>
          Show {q === 0 ? "next quarter" : "this quarter"}
        </button>
      </div>
    </div>
  );
}
