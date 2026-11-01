import { useState } from "react";
import type * as UI from "../../../../src/elements/react";
import { textButton } from "../../demo-kit";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ProgressBar } = ui;
  const [done, setDone] = useState(false);
  return (
    <div style={{ width: "100%", maxWidth: 360, display: "grid", gap: 16, justifyItems: "center", fontSize: 13 }}>
      <ProgressBar label="Importing the sample archive" value={0.62} />
      <ProgressBar key={String(done)} label="Loading results" done={done} />
      <button type="button" style={textButton} onClick={() => setDone(!done)}>{done ? "Start again" : "Finish"}</button>
    </div>
  );
}
