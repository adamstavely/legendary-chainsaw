import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { PreviewTab } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's sample tracker running on a dev server. The page inside is drawn by the demo – nothing is
   loaded – so the widths, tabs and states can be tried anywhere. */

const TABS: PreviewTab[] = [
  { id: "freezers", title: "Freezers", url: "http://localhost:5173/freezers" },
  { id: "samples", title: "Samples", url: "http://localhost:5173/samples" },
];
const FREEZERS = [
  { name: "F1 · Cold room", temp: "−80.2 °C", fill: "72%" },
  { name: "F2 · Basement", temp: "−79.8 °C", fill: "58%" },
  { name: "F4 · Annex", temp: "−74.1 °C", fill: "91%" },
];

const ink = "var(--tc-text-primary, light-dark(#171717, #ededed))";
const muted = "var(--tc-text-muted, light-dark(#646464, #9a9aa1))";
const line = "var(--tc-border-default, light-dark(#ececec, #2a2a2e))";

function MockPage({ tab }: { tab: string }) {
  return (
    <div style={{ fontFamily: "var(--tc-font-sans, system-ui)", color: ink, padding: 20, display: "grid", gap: 14, alignContent: "start" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <strong style={{ fontSize: 18 }}>{tab === "samples" ? "Samples" : "Freezers"}</strong>
        <span style={{ fontSize: 12, color: muted }}>Sample tracker · north campus</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
        {FREEZERS.map((f) => (
          <div key={f.name} style={{ border: `1px solid ${line}`, borderRadius: 10, padding: 12, display: "grid", gap: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{f.name}</span>
            <span style={{ fontSize: 22 }}>{tab === "samples" ? f.fill : f.temp}</span>
            <span style={{ fontSize: 12, color: muted }}>{tab === "samples" ? "of racks in use" : "last read 2 min ago"}</span>
          </div>
        ))}
      </div>
      <p style={{ margin: 0, fontSize: 13, color: muted }}>F4 is warmer than its −78 °C limit. A technician has been told.</p>
    </div>
  );
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { PreviewFrame } = ui;
  const [tabs, setTabs] = useState(TABS);
  const [active, setActive] = useState<string | null>("freezers");
  const [failed, setFailed] = useState(false);
  const [said, setSaid] = useState("Switch between phone, tablet and desktop, or type an address and press Enter.");
  const tab = tabs.find((t) => t.id === active) ?? tabs[0];
  return (
    <div style={{ width: "100%", maxWidth: 760, display: "grid", gap: 8 }}>
      <PreviewFrame
        description="vite on port 5173"
        tabs={tabs}
        active={active}
        onActiveChange={(id) => setActive(id)}
        defaultViewport="tablet"
        height={360}
        consoleCount={{ errors: 1, warnings: 3 }}
        canGoBack
        error={failed ? "The dev server stopped answering. Restart it from Processes, then retry." : ""}
        onTcNavigate={(e) => setSaid(`Go to ${e.detail.url}`)}
        onTcReload={() => {
          setFailed(false);
          setSaid("Reloaded");
        }}
        onTcClose={(e) => {
          e.preventDefault();
          const left = tabs.filter((t) => t.id !== e.detail.id);
          setTabs(left);
          if (active === e.detail.id) setActive(left[0]?.id ?? null);
        }}
        onTcNewTab={() => {
          const id = `page-${tabs.length + 1}`;
          setTabs([...tabs, { id, title: "Samples", url: "http://localhost:5173/samples" }]);
          setActive(id);
        }}
        onTcOpenExternal={(e) => setSaid(`Open ${e.detail.url} in a new window`)}
        onTcConsole={() => setSaid("Show the console: 1 error, 3 warnings")}
      >
        {tab ? <MockPage tab={tab.url?.endsWith("samples") ? "samples" : "freezers"} /> : null}
      </PreviewFrame>
      <div style={{ ...caption, textAlign: "center" }}>
        {said}{" "}
        <button type="button" style={textButton} onClick={() => setFailed(!failed)}>
          {failed ? "Bring it back" : "Show the error state"}
        </button>
      </div>
    </div>
  );
}
