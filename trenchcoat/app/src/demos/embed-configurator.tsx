import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { EmbedConfig } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

// A fictional research institute setting up its public help widget
const START: EmbedConfig = {
  title: "Ask the Institute",
  greeting: "Hi! I can help with visits, data requests and publications.",
  starters: ["When is the reading room open?", "How do I request a dataset?", "Where is the 2025 annual report?"],
  accent: "#0f766e",
  position: "right",
  radius: 16,
  launcherLabel: "Chat with us",
  domains: ["institute.example.org", "data.institute.example.org"],
};

export default function Demo({ ui }: { ui: typeof UI }) {
  const { EmbedConfigurator } = ui;
  const [value, setValue] = useState<EmbedConfig>(START);
  return (
    <div style={{ width: "100%", maxWidth: 980, display: "grid", gap: 12 }}>
      <EmbedConfigurator title="Help widget" description="Style the chat visitors see on the institute's sites" widgetId="inst-help" value={value} onValueChange={setValue} />
      <div style={{ ...caption, textAlign: "center" }}>
        Change the accent or the starters and watch the preview.{" "}
        <button type="button" style={textButton} onClick={() => setValue({ ...value, accent: "#f5c542" })}>
          Try a light accent
        </button>
      </div>
    </div>
  );
}
