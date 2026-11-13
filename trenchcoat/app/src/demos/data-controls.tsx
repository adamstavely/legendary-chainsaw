import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { DataControlsField, DataControlsValue, DataExportStatus } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* One analyst's own data in a fictional research institute's AI workspace. The dates are fixed, so the thumbnail is
   the same every time; a switch flipped here is stamped with the demo's own "today". */

const TODAY = new Date(2026, 10, 12, 10, 30).getTime();
const CHANGED: Partial<Record<DataControlsField, number>> = {
  training: new Date(2026, 8, 3).getTime(),
  history: new Date(2026, 5, 18).getTime(),
};

export default function Demo({ ui }: { ui: typeof UI }) {
  const { DataControls } = ui;
  const [value, setValue] = useState<DataControlsValue>({ training: false, history: true, memory: true });
  const [changed, setChanged] = useState(CHANGED);
  const [exportStatus, setExportStatus] = useState<DataExportStatus>("idle");
  const [chats, setChats] = useState(342);
  return (
    <div style={{ width: "100%", maxWidth: 520, display: "grid", gap: 8 }}>
      <DataControls
        title="Your data"
        description="Halvorsen Research Institute · Priya Shah"
        value={value}
        onValueChange={(next, field) => {
          setValue(next);
          setChanged((c) => ({ ...c, [field]: TODAY }));
        }}
        changed={changed}
        chatCount={chats}
        memoryHref="#memory"
        exportStatus={exportStatus}
        exportHref="#export.zip"
        onExport={() => setExportStatus("requested")}
        onDeleteChats={() => setChats(0)}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {exportStatus === "requested" ? "The export was requested. " : "Flip a switch, or ask for an export. "}
        <button type="button" style={textButton} onClick={() => setExportStatus(exportStatus === "requested" ? "ready" : "idle")}>
          {exportStatus === "requested" ? "Finish the export" : "Reset"}
        </button>
      </div>
    </div>
  );
}
