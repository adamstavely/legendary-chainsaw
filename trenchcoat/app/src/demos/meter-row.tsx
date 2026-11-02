import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* How full a research institute's sample stores are. */

export default function Demo({ ui }: { ui: typeof UI }) {
  const { MeterRow } = ui;
  const [freezer, setFreezer] = useState(0.62);
  const [note, setNote] = useState("Press the top row to open it.");
  return (
    <div style={{ width: "100%", maxWidth: 360, display: "grid", gap: 8 }}>
      <MeterRow label="Sample storage" value={0.17} interactive onTcOpen={() => setNote("Opened: Sample storage")} />
      <MeterRow label="North wing freezer" value={freezer} />
      <MeterRow label="Cold room B" value={846} max={1000} valueText="846 of 1,000" />
      <MeterRow label="Backup quota" value={0.97} />
      <div style={{ ...caption, textAlign: "center" }} role="status">
        {note}{" "}
        <button type="button" style={textButton} onClick={() => setFreezer(freezer > 0.9 ? 0.62 : 0.96)}>
          {freezer > 0.9 ? "Empty the freezer" : "Fill the freezer"}
        </button>
      </div>
    </div>
  );
}
