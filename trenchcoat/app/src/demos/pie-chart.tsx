import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's grants office: this year's funding by source (“Show last year” glides the slices), and the
   same as emphasis – only the largest source painted. */

const YEARS = [
  [
    { label: "Federal grants", value: 48 },
    { label: "Foundations", value: 21 },
    { label: "Industry", value: 14 },
    { label: "Endowment", value: 11 },
    { label: "Other", value: 6 },
  ],
  [
    { label: "Federal grants", value: 52 },
    { label: "Foundations", value: 17 },
    { label: "Industry", value: 9 },
    { label: "Endowment", value: 14 },
    { label: "Other", value: 8 },
  ],
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { PieChart } = ui;
  const [y, setY] = useState(0);
  return (
    <div style={{ width: "100%", maxWidth: 980, display: "grid", gap: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
        <PieChart title="Funding by source" description={y === 0 ? "2026, $ millions" : "2025, $ millions"} format="number" data={YEARS[y]} />
        <PieChart title="Largest source" description="The rest kept quiet" colorMode="emphasis" labelMode="label" data={YEARS[y]} />
      </div>
      <div style={{ ...caption, textAlign: "center" }}>
        <button type="button" style={textButton} onClick={() => setY(1 - y)}>
          Show {y === 0 ? "2025" : "2026"}
        </button>
      </div>
    </div>
  );
}
