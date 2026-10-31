import { useState } from "react";
import type * as UI from "../../../../src/elements/react";
import { textButton } from "../../demo-kit";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { SuccessCheck } = ui;
  const [round, setRound] = useState(1);
  return (
    <div style={{ display: "grid", gap: 8, justifyItems: "center", fontSize: 14, color: "var(--tc-text-primary)" }}>
      <span><SuccessCheck playKey={round} /> Shared with 3 people</span>
      <button type="button" style={textButton} onClick={() => setRound(round + 1)}>Draw again</button>
    </div>
  );
}
