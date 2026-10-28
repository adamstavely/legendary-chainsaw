import { useEffect, useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { DigestItem, DigestStatus } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A week of project updates for a launch, digested. "Digest again" shows the shimmer while it re-summarises; tick
   off what you've done. */

const MATTERS: DigestItem[] = [
  { text: "The deadline moved up one day, to Thursday.", source: { label: "Kickoff notes" } },
  { text: "Cost dropped by $3,000 after the vendor quote.", source: { label: "Budget v4" } },
  "The vendor migration was removed from scope.",
];
const ACTIONS: DigestItem[] = [
  { id: "deck", text: "Send the revised deck by Thursday." },
  { id: "budget", text: "Confirm the new budget number with finance." },
];
const CHANGES: DigestItem[] = ["1 new deadline", "1 corrected number", "1 removed scope item"];
const IGNORE: DigestItem[] = ["Repeated background section", "Unchanged staffing notes"];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { Digest } = ui;
  const [status, setStatus] = useState<DigestStatus>("done");
  const [done, setDone] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <div style={{ width: "100%", maxWidth: 760, display: "grid", gap: 8 }}>
      <Digest
        title="One-minute digest"
        description="A week of launch updates, around what you need – not the order they came in."
        status={status}
        matters={MATTERS}
        actions={ACTIONS}
        changes={CHANGES}
        ignore={IGNORE}
        done={done}
        onDoneChange={setDone}
        onCiteOpen={(_, __, source) => setNote(`Would open “${source.label}”.`)}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {note || `${done.length} of ${ACTIONS.length} done. `}{" "}
        <button
          type="button"
          style={textButton}
          disabled={status === "summarising"}
          onClick={() => {
            setStatus("summarising");
            setNote("");
            timer.current = window.setTimeout(() => setStatus("done"), 1600);
          }}
        >
          Digest again
        </button>
      </div>
    </div>
  );
}
