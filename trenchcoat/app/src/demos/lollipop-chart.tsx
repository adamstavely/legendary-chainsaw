import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's compute cluster: GPU hours by lab this month and last (“Show last month” reorders the items
   and glides the stems), and the same labs' open grants, upright. */

const LABS = ["Genomics", "Imaging", "Proteomics", "Field ecology", "Neuro", "Climate", "Materials", "Astro"];
const MONTHS = [
  [412, 236, 318, 84, 377, 291, 152, 205],
  [348, 301, 262, 97, 405, 244, 188, 173],
];
const GRANTS = [
  { label: "Genomics", value: 9 },
  { label: "Imaging", value: 5 },
  { label: "Proteomics", value: 7 },
  { label: "Neuro", value: 11 },
  { label: "Climate", value: 6 },
  { label: "Astro", value: 3 },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { LollipopChart } = ui;
  const [m, setM] = useState(0);
  const data = LABS.map((label, i) => ({ label, value: MONTHS[m][i] }));
  return (
    <div style={{ width: "100%", maxWidth: 980, display: "grid", gap: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
        <LollipopChart title="GPU hours" description={m === 0 ? "This month, by lab" : "Last month, by lab"} data={data} unit=" h" />
        <LollipopChart title="Open grants" description="By lab" data={GRANTS} orientation="vertical" sort={false} />
      </div>
      <div style={{ ...caption, textAlign: "center" }}>
        Point at an item, or Tab in and use the arrows.{" "}
        <button type="button" style={textButton} onClick={() => setM(1 - m)}>
          Show {m === 0 ? "last month" : "this month"}
        </button>
      </div>
    </div>
  );
}
