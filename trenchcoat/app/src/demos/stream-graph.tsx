import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's compute cluster: GPU hours used each week by five labs over a quarter, the lab with the most
   hours emphasised (“Show next quarter” glides the layers to the quarter after). */

const LABS = ["Genomics", "Imaging", "Climate", "Neuro", "Materials"];
const WEEKS = 13;
/* A deterministic wave per lab and quarter: base, swing, phase */
const SHAPES = [
  [[120, 50, 0], [60, 40, 2], [40, 30, 4], [80, 30, 1], [30, 20, 3]],
  [[90, 30, 3], [110, 50, 1], [55, 35, 0], [70, 40, 5], [45, 25, 2]],
];

const rows = (q: number) =>
  Array.from({ length: WEEKS }, (_, w) =>
    LABS.map((lab, i) => {
      const [base, swing, phase] = SHAPES[q][i];
      return { week: `W${w + 1}`, lab, hours: Math.round(base + swing * Math.sin((w + phase) / 2.2)) };
    }),
  ).flat();

export default function Demo({ ui }: { ui: typeof UI }) {
  const { StreamGraph } = ui;
  const [q, setQ] = useState(0);
  return (
    <div style={{ width: "100%", maxWidth: 760, display: "grid", gap: 8 }}>
      <StreamGraph title="GPU hours" description={q === 0 ? "Each week, by lab – first quarter" : "Each week, by lab – second quarter"} unit=" h" data={rows(q)} x="week" y="hours" series="lab" />
      <div style={{ ...caption, textAlign: "center" }}>
        Move along the streams to read every lab, or Tab in and use the arrows.{" "}
        <button type="button" style={textButton} onClick={() => setQ(1 - q)}>
          Show {q === 0 ? "next quarter" : "first quarter"}
        </button>
      </div>
    </div>
  );
}
