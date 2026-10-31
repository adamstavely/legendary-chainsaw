import { useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { AgentFaceGesture, AgentFaceState } from "../../../src/elements/react";
import type { TcAgentFace } from "../../../src/elements/agent-face";
import { caption, textButton } from "../demo-kit";

const STATES: AgentFaceState[] = ["idle", "listening", "thinking", "speaking", "happy", "confused", "sleeping", "error", "surprised"];
const GESTURES: AgentFaceGesture[] = ["wave", "nod", "hop", "spin"];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AgentFace } = ui;
  const [state, setState] = useState<AgentFaceState>("thinking");
  const big = useRef<TcAgentFace>(null);
  return (
    <div style={{ display: "grid", justifyItems: "center", gap: 24, width: "100%", padding: "32px 0 8px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 64 }}>
        <AgentFace ref={big} state={state} size={120} seed={4} />
        <AgentFace state={state} size={64} seed={4} />
        <AgentFace state={state} size={26} seed={4} />
        <AgentFace state={state} size={16} seed={4} />
      </div>
      <div style={{ ...caption, textAlign: "center" }}>
        {STATES.map((s) => (
          <button key={s} type="button" aria-pressed={s === state} style={{ ...textButton, margin: "0 6px", fontWeight: s === state ? 600 : undefined }} onClick={() => setState(s)}>
            {s}
          </button>
        ))}
        <br />
        {GESTURES.map((g) => (
          <button key={g} type="button" style={{ ...textButton, margin: "0 6px" }} onClick={() => big.current?.playGesture(g)}>
            {g}
          </button>
        ))}
      </div>
    </div>
  );
}
