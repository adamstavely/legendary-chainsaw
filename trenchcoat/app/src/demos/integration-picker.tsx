import { useState } from "react";
import type * as UI from "../../../src/elements/react";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { IntegrationPicker, defaultIntegrations } = ui;
  const [log, setLog] = useState("↑ ↓ to move · ↵ to connect · ⌘/ to search");

  return (
    <div style={{ width: "100%", maxWidth: 660, display: "grid", gap: 12, justifyItems: "center" }}>
      <div style={{ width: "100%" }}>
        <IntegrationPicker
          integrations={defaultIntegrations}
          appName="Trenchcoat"
          defaultSelected="linear"
          onToggle={(id, connected) => {
            const name = defaultIntegrations.find((i) => i.id === id)?.name ?? id;
            setLog(connected ? `${name} connected` : `${name} disconnected`);
          }}
          onExplore={(id) => setLog(`Exploring ${defaultIntegrations.find((i) => i.id === id)?.name ?? id}…`)}
          onBack={() => setLog("Back to the command menu")}
          onClose={() => setLog("Picker closed (Esc)")}
        />
      </div>
      <div style={{ fontSize: 12, color: "var(--tc-text-muted, light-dark(#646464, #9a9aa1))" }} aria-live="polite">
        {log}
      </div>
    </div>
  );
}
