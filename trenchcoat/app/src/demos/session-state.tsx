import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { SessionChip, SessionHealth } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A long design session building a UI kit. "Two hours later" fills the context, adds a loop and an assumption, and
   the session starts to drift; pressing a tile or the files chip says what it would open. */

const EARLY = {
  health: "healthy" as SessionHealth,
  loops: ["prototype", "naming", "integration"],
  artifacts: ["demo", "TSX starter"],
  pressure: 0.68,
  chips: [
    { id: "intent", label: "Intent stable", tone: "violet" },
    { id: "approvals", label: "No approval blocked", tone: "neutral" },
    { id: "files", label: "2 files in context", tone: "teal", action: true },
    { id: "assumptions", label: "1 inferred assumption", tone: "warning", action: true },
  ] as SessionChip[],
};
const LATE = {
  health: "drifting" as SessionHealth,
  loops: ["prototype", "naming", "integration", "dark mode"],
  artifacts: ["demo"],
  pressure: 0.91,
  chips: [
    { id: "intent", label: "Intent shifted twice", tone: "warning" },
    { id: "approvals", label: "1 approval waiting", tone: "danger", action: true },
    { id: "files", label: "6 files in context", tone: "teal", action: true },
    { id: "assumptions", label: "3 inferred assumptions", tone: "warning", action: true },
  ] as SessionChip[],
};

export default function Demo({ ui }: { ui: typeof UI }) {
  const { SessionState } = ui;
  const [late, setLate] = useState(false);
  const [note, setNote] = useState("");
  const s = late ? LATE : EARLY;
  return (
    <div style={{ width: "100%", maxWidth: 760, display: "grid", gap: 8 }}>
      <SessionState
        title="Session state"
        description="Where this session stands: building the component kit."
        health={s.health}
        goal="Expand the kit's LLM-native components"
        loops={s.loops}
        artifacts={s.artifacts}
        pressure={s.pressure}
        chips={s.chips}
        actionable
        onAction={(id, kind) => setNote(`Would open the ${kind} “${id}”.`)}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {note || "Press a tile or a chip with an outline. "}{" "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setLate(!late);
            setNote("");
          }}
        >
          {late ? "Back to the start" : "Two hours later"}
        </button>
      </div>
    </div>
  );
}
