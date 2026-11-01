import { useState } from "react";
import type * as UI from "../../../../src/elements/react";
import { textButton } from "../../demo-kit";

const row: React.CSSProperties = { padding: "10px 12px", marginBottom: 6, borderRadius: 10, background: "var(--tc-surface-raised)", boxShadow: "var(--tc-card-shadow)", fontSize: 13, color: "var(--tc-text-primary)" };

export default function Demo({ ui }: { ui: typeof UI }) {
  const { StaggeredReveal } = ui;
  const [round, setRound] = useState(1);
  return (
    <div style={{ width: "100%", maxWidth: 360, display: "grid", gap: 8, justifyItems: "stretch", textAlign: "center" }}>
      <StaggeredReveal playKey={round} style={{ textAlign: "left" }}>
        {["Trial 12 results", "Sampling plan", "Field notes", "Audit summary"].map((r) => (
          <div key={r} style={row}>{r}</div>
        ))}
      </StaggeredReveal>
      <div><button type="button" style={textButton} onClick={() => setRound(round + 1)}>Play again</button></div>
    </div>
  );
}
