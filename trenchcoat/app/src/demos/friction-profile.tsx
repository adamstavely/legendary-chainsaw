import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { FrictionModeChange, FrictionSafeguard } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research assistant's safeguards for one working session. A filing is due this afternoon, so the person previews
   Deadline: getting started gets quicker (one intent question, the verification queue waits) while getting anything
   out gets stricter (unverified claims block export). Nothing changes until Apply, and Deadline asks why and until
   when. Once it's applied, "The deadline passed" puts the session back to Standard. */

const SAFEGUARDS: FrictionSafeguard[] = [
  {
    id: "intent",
    label: "Intent check",
    description: "Two questions before the first answer: what you need, and what would change your mind",
    modes: {
      elevated: { state: "tightened", change: "Adds a third question: who will rely on the answer" },
      deadline: { state: "shortened", change: "One question – what you need – so you can start straight away" },
    },
  },
  { id: "badges", label: "Source labels", description: "Every claim shows whether it was sourced, inferred or from model knowledge" },
  {
    id: "queue",
    label: "Verification queue",
    description: "Claims you haven't checked wait in a queue beside the answer",
    modes: {
      elevated: { state: "tightened", change: "Every high-confidence claim must be checked before you continue" },
      deadline: { state: "deferred", change: "Unchecked claims are listed for after the deadline instead of interrupting" },
    },
  },
  {
    id: "export",
    label: "Export review",
    description: "A summary of unchecked claims before anything leaves the session",
    modes: {
      elevated: { state: "tightened", change: "A second person signs off before export" },
      deadline: { state: "tightened", change: "Unverified high-confidence claims block export; a supervisor can release them" },
    },
  },
  {
    id: "reflect",
    label: "Reflection prompts",
    description: "An occasional question on what you'd expect the answer to be",
    modes: { deadline: { state: "off", change: "Paused until the deadline ends" } },
  },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { FrictionProfile } = ui;
  const [mode, setMode] = useState("standard");
  const [reason, setReason] = useState("");
  const [until, setUntil] = useState("");
  const [log, setLog] = useState("");

  const onModeChange = (c: FrictionModeChange) => {
    setMode(c.mode);
    setReason(c.reason);
    setUntil(c.until);
    const eased = c.changes.filter((x) => ["off", "deferred", "shortened"].includes(x.to)).length;
    setLog(`${c.mode[0].toUpperCase()}${c.mode.slice(1)} applied – ${eased} eased, ${c.changes.length - eased} tighter. Logged with the session.`);
  };

  const reset = () => {
    setMode("standard");
    setReason("");
    setUntil("");
    setLog("The deadline passed – back to Standard.");
  };

  return (
    <div style={{ width: "100%", maxWidth: 520, display: "grid", gap: 10 }}>
      <FrictionProfile title="Session safeguards" scope="Hendry v. Calloway · research session" mode={mode} reason={reason} until={until} safeguards={SAFEGUARDS} onModeChange={onModeChange} />
      <p style={{ ...caption, margin: 0, textAlign: "center" }}>
        {log || "A filing is due at 5 pm – pick Deadline to preview what changes before applying it"}{" "}
        {mode !== "standard" && (
          <button type="button" style={textButton} onClick={reset}>
            The deadline passed
          </button>
        )}
      </p>
    </div>
  );
}
