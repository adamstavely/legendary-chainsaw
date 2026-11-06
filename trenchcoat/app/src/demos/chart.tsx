import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ChartSpec } from "../../../src/elements/react/chart";
import { caption, textButton } from "../demo-kit";

/* A research institute's dashboard built from JSON specs – the kind a tool or a model writes: samples by lab as bars,
   then the same rows as a donut (“Show as a donut” swaps the spec's type), and a spec with a mistake, shown as what's
   wrong instead of a chart. */

const ROWS = [
  { lab: "Genomics", samples: 182 },
  { lab: "Imaging", samples: 96 },
  { lab: "Proteomics", samples: 124 },
  { lab: "Neuro", samples: 141 },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { Chart } = ui;
  const [donut, setDonut] = useState(false);
  const spec: ChartSpec = donut
    ? { type: "donut", title: "Samples processed", description: "This week, by lab", data: ROWS, encoding: { label: "lab", value: "samples" }, options: { centerLabel: "Samples" } }
    : { type: "bar", title: "Samples processed", description: "This week, by lab", data: ROWS, encoding: { x: "lab", y: "samples" } };
  return (
    <div style={{ width: "100%", maxWidth: 980, display: "grid", gap: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12, alignItems: "start" }}>
        <Chart spec={spec} />
        <Chart spec={{ type: "line", title: "Queue time", data: ROWS, encoding: { x: "month", y: "minutes" } }} />
      </div>
      <div style={{ ...caption, textAlign: "center" }}>
        The second spec names fields the rows don't have.{" "}
        <button type="button" style={textButton} onClick={() => setDonut(!donut)}>
          {donut ? "Show as bars" : "Show as a donut"}
        </button>
      </div>
    </div>
  );
}
