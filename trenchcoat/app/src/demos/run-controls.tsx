import { useEffect, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { RunControlsState } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* The composer of a fictional assistant drafting a grant application for a community library. It starts mid-answer
   with one ask queued; the answer's length grows while it streams, so Stop and Resume carry the real count.
   "Drop the connection" shows what happens when the stream breaks. */

export default function Demo({ ui }: { ui: typeof UI }) {
  const { RunControls } = ui;
  const [state, setState] = useState<RunControlsState>("streaming");
  const [queue, setQueue] = useState<string[]>(["Then shorten the budget notes"]);
  const [partial, setPartial] = useState(1240);
  const [log, setLog] = useState("");

  useEffect(() => {
    if (state !== "streaming") return;
    const t = setInterval(() => setPartial((n) => n + 37), 400);
    return () => clearInterval(t);
  }, [state]);

  return (
    <div style={{ width: "100%", maxWidth: 620, display: "grid", gap: 10 }}>
      <RunControls
        state={state}
        onStateChange={setState}
        queue={queue}
        onQueueChange={setQueue}
        partial={partial}
        context={0.62}
        onSend={(text) => {
          setLog(`Sent “${text}”`);
          setPartial(0);
        }}
        onSteer={(note) => setLog(`Steering: “${note}”`)}
        onStop={(n) => setLog(`Stopped at ${n.toLocaleString("en-US")} characters`)}
        onResume={(from) => setLog(`Resuming from character ${from.toLocaleString("en-US")}`)}
        onRetry={() => {
          setLog("Retrying from the start");
          setPartial(0);
        }}
        onDismiss={() => setLog("Dismissed")}
      />
      <p style={{ ...caption, margin: 0, textAlign: "center" }}>
        {log || "Type while it answers to steer it, or queue what's next"}{" "}
        {state === "streaming" ? (
          <button type="button" style={textButton} onClick={() => setState("disconnected")}>
            Drop the connection
          </button>
        ) : (
          <button
            type="button"
            style={textButton}
            onClick={() => {
              setState("streaming");
              setLog("");
            }}
          >
            Start answering
          </button>
        )}
      </p>
    </div>
  );
}
