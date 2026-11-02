import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* A research institute's sample-tracking project, as sections of a side panel. */

export default function Demo({ ui }: { ui: typeof UI }) {
  const { PanelCard, MeterRow } = ui;
  const [note, setNote] = useState("Press a row to open or shut it.");
  return (
    <div style={{ width: "100%", maxWidth: 360, display: "grid", gap: 8 }}>
      <PanelCard title="Freezers" defaultExpanded>
        <ul style={{ margin: 0, paddingInlineStart: 16 }}>
          <li>North wing, rack 4</li>
          <li>Cold room B, shelf 2</li>
        </ul>
      </PanelCard>
      <PanelCard title="Storage" mode="link" onTcOpen={() => setNote("Opened: Storage")}>
        <MeterRow slot="aside" label="Storage used" value={0.17} compact bare />
      </PanelCard>
      <PanelCard title="Instruments" value="3 to recalibrate" mode="link" onTcOpen={() => setNote("Opened: Instruments")} />
      <PanelCard title="Reports" value="51" mode="link" onTcOpen={() => setNote("Opened: Reports")} />
      <div style={{ ...caption, textAlign: "center" }} role="status">{note}</div>
    </div>
  );
}
