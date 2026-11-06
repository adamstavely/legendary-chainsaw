import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's grant budget: the award at the top, what each line of spending took or added, and what's
   left at the end (“Show year two” glides the steps to the second year), next to the compute hours a lab started the
   month with and ended it on. */

const YEARS = [
  [
    { label: "Awarded", value: 480 },
    { label: "Staff", value: -190 },
    { label: "Equipment", value: -120 },
    { label: "Compute", value: -45 },
    { label: "Supplement", value: 60 },
    { label: "Travel", value: -18 },
  ],
  [
    { label: "Carried over", value: 167 },
    { label: "Renewal", value: 320 },
    { label: "Staff", value: -205 },
    { label: "Equipment", value: -40 },
    { label: "Compute", value: -72 },
    { label: "Travel", value: -24 },
  ],
];
const HOURS = [
  { step: "Allocated", hours: 1200 },
  { step: "Genomics", hours: -430 },
  { step: "Climate", hours: -310 },
  { step: "Returned", hours: 140 },
  { step: "Neuro", hours: -260 },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  // Until the barrel lists it: the wrapper's own module
  const { WaterfallChart } = ui;
  const [y, setY] = useState(0);
  return (
    <div style={{ width: "100%", maxWidth: 980, display: "grid", gap: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
        <WaterfallChart title="Grant budget" description={y === 0 ? "Year one, in thousands" : "Year two, in thousands"} data={YEARS[y]} unit="k" endTotal="Remaining" />
        <WaterfallChart title="Compute hours" description="This month, by lab" data={HOURS} label="step" value="hours" endTotal="Left" waterfallLabels={{ increase: "Returned", decrease: "Used" }} />
      </div>
      <div style={{ ...caption, textAlign: "center" }}>
        Point at a step, or Tab in and use the arrows.{" "}
        <button type="button" style={textButton} onClick={() => setY(1 - y)}>
          Show year {y === 0 ? "two" : "one"}
        </button>
      </div>
    </div>
  );
}
