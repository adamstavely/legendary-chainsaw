import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { FineTuneAgentChange, FineTuneSection, FineTuneValues } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* A research institute's report builder: an assistant tunes the "Findings summary" card, and the person takes over. */

const SECTIONS: FineTuneSection[] = [
  {
    label: "Layout",
    fields: [
      { id: "w", label: "W", name: "Width", kind: "number", unit: "px", min: 120, max: 640 },
      { id: "h", label: "H", name: "Height", kind: "number", unit: "px", min: 80, max: 480 },
      { id: "radius", label: "R", name: "Radius", kind: "number", unit: "px", min: 0, max: 32 },
      { id: "opacity", label: "O", name: "Opacity", kind: "percent" },
    ],
  },
  {
    label: "Type",
    fields: [
      {
        id: "type",
        label: "Aa",
        name: "Text style",
        kind: "select",
        options: [
          { value: "Heading", label: "Heading" },
          { value: "Body", label: "Body" },
          { value: "Caption", label: "Caption" },
        ],
      },
      {
        id: "fill",
        label: "Fill",
        kind: "color",
        options: [
          { value: "light-dark(#ffffff, #232326)", label: "Surface" },
          { value: "light-dark(#eef4ff, #1d2a44)", label: "Blue tint" },
          { value: "light-dark(#eefaf2, #1b3326)", label: "Green tint" },
          { value: "light-dark(#fff6e8, #3a2c16)", label: "Amber tint" },
        ],
      },
    ],
  },
];
const START: FineTuneValues = { w: 320, h: 180, radius: 8, opacity: 100, type: "Body", fill: "light-dark(#ffffff, #232326)" };
const TUNE: FineTuneAgentChange[] = [
  { field: "w", to: 360 },
  { field: "radius", to: 14 },
  { field: "type", to: "Heading" },
  { field: "fill", to: "light-dark(#eef4ff, #1d2a44)" },
];
const MORE: FineTuneAgentChange[] = [
  { field: "h", to: 200 },
  { field: "opacity", to: 94 },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { FineTuneCard } = ui;
  const [values, setValues] = useState<FineTuneValues>(START);
  const [changes, setChanges] = useState<FineTuneAgentChange[]>(TUNE);
  const [adjusting, setAdjusting] = useState(false);
  const [said, setSaid] = useState("The assistant tuned four fields. Drag a label or type a value to take over, or press Adjust again.");
  return (
    <div style={{ width: "100%", maxWidth: 380, display: "grid", gap: 8 }}>
      <FineTuneCard
        title="Findings summary"
        description="Card on the audit report's first page"
        sections={SECTIONS}
        values={values}
        agentChanges={changes}
        adjusting={adjusting}
        onValuesChange={(next, change) => {
          setValues(next);
          setSaid(change.source === "person" ? `You changed ${change.field}` : change.source === "agent" ? `The assistant changed ${change.field ?? "several fields"}` : "Back to before the assistant");
        }}
        onAdjustRequest={() => {
          setAdjusting(true);
          window.setTimeout(() => {
            setAdjusting(false);
            setChanges([...MORE]);
          }, 900);
        }}
      />
      <div style={{ ...caption, textAlign: "center" }}>{said}</div>
    </div>
  );
}
