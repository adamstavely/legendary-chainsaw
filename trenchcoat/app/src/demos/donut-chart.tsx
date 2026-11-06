import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's audit: open findings by severity, the total in the middle (“Close two” resolves two
   findings and the slices and total move). */

const OPEN = [
  { label: "Critical", value: 3 },
  { label: "High", value: 9 },
  { label: "Medium", value: 17 },
  { label: "Low", value: 24 },
];
const AFTER = [
  { label: "Critical", value: 1 },
  { label: "High", value: 9 },
  { label: "Medium", value: 17 },
  { label: "Low", value: 24 },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { DonutChart } = ui;
  const [closed, setClosed] = useState(false);
  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 8 }}>
      <DonutChart title="Open findings" description="Lab safety audit, by severity" centerLabel="Findings" data={closed ? AFTER : OPEN} />
      <div style={{ ...caption, textAlign: "center" }}>
        <button type="button" style={textButton} onClick={() => setClosed(!closed)}>
          {closed ? "Reopen two" : "Close two critical"}
        </button>
      </div>
    </div>
  );
}
