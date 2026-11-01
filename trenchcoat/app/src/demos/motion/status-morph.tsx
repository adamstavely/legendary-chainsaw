import { useState } from "react";
import type * as UI from "../../../../src/elements/react";
import { textButton } from "../../demo-kit";

const STEPS = ["pending", "checking", "done", "warning", "failed"] as const;

export default function Demo({ ui }: { ui: typeof UI }) {
  const { StatusMorph } = ui;
  const [i, setI] = useState(1);
  return (
    <div style={{ display: "grid", gap: 8, justifyItems: "center", fontSize: 14 }}>
      <StatusMorph status={STEPS[i]} />
      <button type="button" style={textButton} onClick={() => setI((i + 1) % STEPS.length)}>Next state</button>
    </div>
  );
}
