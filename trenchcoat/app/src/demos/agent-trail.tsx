import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { AgentTrailStep } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A fictional coding agent fixes a date-parsing bug in an open-source calendar library. It has reproduced the bug and
   found the cause, and is writing the fix; opening the pull request waits for a person. The times are fixed, so the
   card's the same on every visit. */

const NOW = Date.UTC(2026, 10, 14, 10, 30);
const ago = (seconds: number) => NOW - seconds * 1000;

const WORKING: AgentTrailStep[] = [
  { id: "repro", title: "Reproduce the bug", status: "done", started: ago(410), ended: ago(352) },
  { id: "cause", title: "Find the cause", status: "done", started: ago(352), ended: ago(214) },
  {
    id: "fix",
    title: "Write the fix",
    status: "running",
    started: ago(214),
    detail: "Parsing “2026-03-29T02:30” in Europe/Berlin – the hour the clocks skip",
    substeps: [
      { id: "fix-1", title: "Handle the skipped hour in parseLocal()", status: "done", started: ago(214), ended: ago(120) },
      { id: "fix-2", title: "Add tests for both DST changes", status: "running", started: ago(120) },
      { id: "fix-3", title: "Run the whole test suite", status: "pending" },
    ],
  },
  { id: "pr", title: "Open the pull request", status: "pending" },
  { id: "notes", title: "Update the changelog", status: "pending" },
];

const WAITING: AgentTrailStep[] = WORKING.map((s) =>
  s.id === "fix"
    ? { ...s, status: "done", ended: ago(20), detail: undefined, substeps: s.substeps?.map((x) => ({ ...x, status: "done" as const, started: x.started ?? ago(60), ended: x.ended ?? ago(20) })) }
    : s.id === "pr"
      ? { ...s, status: "waiting", started: ago(20), detail: "Opens #482 against main in the public repository" }
      : s,
);

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AgentTrail } = ui;
  const [steps, setSteps] = useState(WORKING);
  const waiting = steps === WAITING;
  return (
    <div style={{ width: "100%", maxWidth: 440, display: "grid", gap: 10 }}>
      <AgentTrail title="Fix the daylight-saving parse bug" description="Issue #471 · open-source calendar library" steps={steps} now={NOW} />
      <div style={{ ...caption, textAlign: "center" }}>
        {waiting ? "The agent stops before it opens the pull request. " : "Hide steps folds the trail to its header. "}
        <button type="button" style={textButton} onClick={() => setSteps(waiting ? WORKING : WAITING)}>
          {waiting ? "Back to writing the fix" : "Skip to the approval"}
        </button>
      </div>
    </div>
  );
}
