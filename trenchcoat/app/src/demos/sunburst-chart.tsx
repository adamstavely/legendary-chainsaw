import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's grants: spend this year by division, lab and kind of cost, from the centre out (“Show last
   year” moves the spend and the rings glide to their new shares). */

const SPEND = [
  { division: "Life sciences", lab: "Genomics", cost: "Reagents", y: [420, 380] },
  { division: "Life sciences", lab: "Genomics", cost: "Sequencing", y: [310, 260] },
  { division: "Life sciences", lab: "Proteomics", cost: "Instruments", y: [280, 340] },
  { division: "Life sciences", lab: "Proteomics", cost: "Reagents", y: [150, 120] },
  { division: "Physical sciences", lab: "Climate", cost: "Compute", y: [360, 300] },
  { division: "Physical sciences", lab: "Climate", cost: "Field work", y: [140, 190] },
  { division: "Physical sciences", lab: "Materials", cost: "Instruments", y: [220, 180] },
  { division: "Shared services", lab: "Core facility", cost: "Staff", y: [190, 210] },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { SunburstChart } = ui;
  const [y, setY] = useState(0);
  const data = SPEND.map((s) => ({ division: s.division, lab: s.lab, label: s.cost, value: s.y[y] }));
  return (
    <div style={{ width: "100%", maxWidth: 640, display: "grid", gap: 8 }}>
      <SunburstChart title="Grant spend" description={y === 0 ? "This year, k$ – division, lab, cost" : "Last year, k$ – division, lab, cost"} data={data} path={["division", "lab"]} />
      <div style={{ ...caption, textAlign: "center" }}>
        Point at an arc, or Tab in and use the arrows.{" "}
        <button type="button" style={textButton} onClick={() => setY(1 - y)}>
          Show {y === 0 ? "last year" : "this year"}
        </button>
      </div>
    </div>
  );
}
