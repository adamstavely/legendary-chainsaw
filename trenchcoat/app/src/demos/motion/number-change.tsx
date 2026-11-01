import { useState } from "react";
import type * as UI from "../../../../src/elements/react";
import { textButton } from "../../demo-kit";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { NumberChange } = ui;
  const [n, setN] = useState(128);
  return (
    <div style={{ display: "grid", gap: 8, justifyItems: "center", fontSize: 24, color: "var(--tc-text-primary)" }}>
      <NumberChange value={n} />
      <div style={{ display: "flex", gap: 12, fontSize: 13 }}>
        <button type="button" style={textButton} onClick={() => setN(n + 7)}>Samples in</button>
        <button type="button" style={textButton} onClick={() => setN(n - 5)}>Samples out</button>
      </div>
    </div>
  );
}
