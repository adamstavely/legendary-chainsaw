import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ConsoleEntry } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* The staging site of a research institute's grant portal, as its console saw the page load. */

const T = Date.UTC(2026, 10, 3, 9, 14, 2, 118);
const ENTRIES: ConsoleEntry[] = [
  { id: "1", level: "info", message: "Grant portal 4.12.0 (staging)", source: "app.js:12", time: T },
  { id: "2", level: "debug", message: "Router: /grants/applications → ApplicationsPage", source: "router.js:88", time: T + 46 },
  { id: "3", level: "warn", message: "[Deprecation] 'unload' event listeners are deprecated and will be removed. Use 'pagehide' instead.", source: "session.js:31", time: T + 212 },
  { id: "4", level: "log", message: "Loaded 24 applications for round 2026-B", source: "applications.js:57", time: T + 640 },
  {
    id: "5",
    level: "error",
    message: "GET https://staging.halden.example/static/img/halden-logo.svg 404 (Not Found)",
    source: "header.js:19",
    time: T + 702,
  },
  {
    id: "6",
    level: "error",
    message: "Uncaught TypeError: Cannot read properties of undefined (reading 'deadline')",
    source: "reviewer-panel.js:142",
    time: T + 915,
    stack: ["at ReviewerPanel.render (reviewer-panel.js:142:31)", "at renderPanel (panels.js:66:12)", "at Array.forEach (<anonymous>)", "at ApplicationsPage.mount (applications.js:91:9)"],
  },
  { id: "7", level: "log", message: "Autosave: draft saved", source: "autosave.js:23", time: T + 30_400, count: 4 },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ConsolePanel } = ui;
  const [entries, setEntries] = useState(ENTRIES);
  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 8 }}>
      <ConsolePanel description="staging.halden.example/grants" entries={entries} defaultExpanded={["6"]} onTcClear={() => setEntries([])} />
      <div style={{ ...caption, textAlign: "center" }}>
        Toggle levels, filter the text, or fold the stack open and shut.{" "}
        <button type="button" style={textButton} onClick={() => setEntries(entries.length ? [] : ENTRIES)}>
          {entries.length ? "Clear" : "Reload the page"}
        </button>
      </div>
    </div>
  );
}
