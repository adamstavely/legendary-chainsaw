import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* The header of an audit analyst's chat: rename the title in place, toggle the Sources and Report panels, and the menu
   holds Export, Archive and Delete. Narrow, Share and the toggles fold into the menu. */

const TOGGLES = [
  { id: "sources", label: "Sources", icon: ["M12 7v14", "M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"] },
  { id: "report", label: "Report draft" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ThreadHeader } = ui;
  const [title, setTitle] = useState("Q3 reconciliation");
  const [narrow, setNarrow] = useState(false);
  const [last, setLast] = useState("");
  return (
    <div style={{ width: "100%", maxWidth: narrow ? 360 : 640, display: "grid", gap: 8 }}>
      <ThreadHeader
        title={title}
        onTitleChange={setTitle}
        model="Analyst model"
        project="Annual audit 2026"
        toggles={TOGGLES}
        defaultPanels={["sources"]}
        onTcShare={() => setLast("Share")}
        onTcAction={(e) => setLast(e.detail.action)}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {last ? `Last action: ${last} · ` : "Click the title to rename it · "}
        <button type="button" style={textButton} onClick={() => setNarrow(!narrow)}>
          {narrow ? "Wide" : "Narrow"}
        </button>
      </div>
    </div>
  );
}
