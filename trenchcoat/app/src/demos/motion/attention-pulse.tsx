import { useState } from "react";
import type * as UI from "../../../../src/elements/react";
import { textButton } from "../../demo-kit";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AttentionPulse } = ui;
  const [round, setRound] = useState(1);
  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "center", fontSize: 13 }}>
      <AttentionPulse pulseKey={round}>
        <p style={{ margin: 0, padding: "8px 12px", borderRadius: 10, background: "var(--tc-status-warning-bg)", color: "var(--tc-status-warning-fg)" }}>1 person with access is no longer authorized.</p>
      </AttentionPulse>
      <button type="button" style={textButton} onClick={() => setRound(round + 1)}>Pulse once</button>
    </div>
  );
}
