import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { FallbackAttempt } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* One request from a research institute's assistant, finding a model that answers. */

const ANSWERED: FallbackAttempt[] = [
  { id: "a", model: "Model A", provider: "Primary", state: "failed", reason: "Timed out after 8 seconds", latencyMs: 8000 },
  { id: "b", model: "Model B", provider: "Primary", state: "skipped", reason: "Not allowed for restricted data" },
  { id: "c", model: "Model C", provider: "Backup", state: "answered", latencyMs: 1240 },
];
const TRYING: FallbackAttempt[] = [ANSWERED[0]!, ANSWERED[1]!, { id: "c", model: "Model C", provider: "Backup", state: "trying" }];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { FallbackChain } = ui;
  const [done, setDone] = useState(true);
  return (
    <div style={{ width: "100%", maxWidth: 720, display: "grid", gap: 8 }}>
      <FallbackChain request="Summarise the trial report" attempts={done ? ANSWERED : TRYING} defaultSelected="a" locale="en-GB" />
      <div style={{ ...caption, textAlign: "center" }}>
        <button type="button" style={textButton} onClick={() => setDone(!done)}>
          {done ? "Show it trying" : "Show the answer"}
        </button>
      </div>
    </div>
  );
}
