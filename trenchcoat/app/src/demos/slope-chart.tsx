import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's grant applications: each lab's success rate in two years, from a wide table (“Show 2023 to
   2024” moves the lines to the earlier pair of years), and instrument uptime from a long table, one row per
   instrument and quarter. */

const LABS = [
  { label: "Genomics", y2023: 28, y2024: 31, y2025: 38 },
  { label: "Imaging", y2023: 30, y2024: 27, y2025: 22 },
  { label: "Proteomics", y2023: 14, y2024: 19, y2025: 29 },
  { label: "Neuro", y2023: 33, y2024: 35, y2025: 33 },
  { label: "Climate", y2023: 21, y2024: 24, y2025: 26 },
];
const UPTIME = [
  { label: "NovaSeq", x: "Q1", value: 91 },
  { label: "Cryo-EM", x: "Q1", value: 78 },
  { label: "Mass spec", x: "Q1", value: 86 },
  { label: "Confocal", x: "Q1", value: 95 },
  { label: "NovaSeq", x: "Q4", value: 96 },
  { label: "Cryo-EM", x: "Q4", value: 88 },
  { label: "Mass spec", x: "Q4", value: 81 },
  { label: "Confocal", x: "Q4", value: 94 },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { SlopeChart } = ui;
  const [early, setEarly] = useState(false);
  const [a, b] = early ? ["2023", "2024"] : ["2024", "2025"];
  return (
    <div style={{ width: "100%", maxWidth: 980, display: "grid", gap: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
        <SlopeChart title="Grant success rate" description="Applications funded, by lab" data={LABS} start={`y${a}`} end={`y${b}`} startLabel={a} endLabel={b} unit="%" />
        <SlopeChart title="Instrument uptime" description="First and last quarter" data={UPTIME} unit="%" />
      </div>
      <div style={{ ...caption, textAlign: "center" }}>
        Point at a line, or Tab in and use the arrows.{" "}
        <button type="button" style={textButton} onClick={() => setEarly(!early)}>
          Show {early ? "2024 to 2025" : "2023 to 2024"}
        </button>
      </div>
    </div>
  );
}
