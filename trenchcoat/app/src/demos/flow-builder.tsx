import { useEffect, useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { FlowStep, FlowStepStatus } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A fictional newsroom's flow for readers' correction requests: a model sorts each request, factual errors get a
   drafted correction and the standards editor's sign-off, everything else a standard reply. Shown part way through a
   test run, with the draft being written. */

const FLOW: FlowStep[] = [
  { id: "classify", kind: "llm", title: "Sort the request", detail: "Factual error, typo, opinion or other" },
  {
    id: "factual",
    kind: "condition",
    title: "Is it a factual error?",
    branches: [
      {
        id: "factual-yes",
        label: "Factual error",
        steps: [
          { id: "draft", kind: "llm", title: "Draft a correction", detail: "From the article and the reader's source" },
          { id: "signoff", kind: "approval", title: "Standards editor signs off" },
        ],
      },
      { id: "factual-no", label: "Anything else", steps: [{ id: "reply", kind: "output", title: "Send the standard reply" }] },
    ],
  },
  { id: "log", kind: "output", title: "Log it in the corrections sheet" },
];
const PARTWAY: Record<string, FlowStepStatus> = { classify: "done", factual: "done", draft: "running" };
/** The path a test run takes: a factual error, so the Anything else path is skipped */
const PATH = ["classify", "factual", "draft", "signoff", "log"];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { FlowBuilder } = ui;
  const [flow, setFlow] = useState(FLOW);
  const [statuses, setStatuses] = useState<Record<string, FlowStepStatus>>(PARTWAY);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const run = (f: FlowStep[]) => {
    clearTimeout(timer.current);
    const ids = new Set<string>();
    const walk = (steps: FlowStep[]) => steps.forEach((s) => (ids.add(s.id), s.branches?.forEach((b) => walk(b.steps))));
    walk(f);
    const path = PATH.filter((id) => ids.has(id));
    const tick = (i: number) => {
      const next: Record<string, FlowStepStatus> = { reply: "skipped" };
      path.forEach((id, j) => {
        if (j < i) next[id] = "done";
        else if (j === i) next[id] = "running";
      });
      setStatuses(next);
      if (i < path.length) timer.current = setTimeout(() => tick(i + 1), 900);
    };
    tick(0);
  };

  return (
    <div style={{ width: "100%", maxWidth: 760, display: "grid", gap: 8 }}>
      <FlowBuilder
        title="Correction requests"
        description="What happens when a reader reports a mistake"
        trigger={{ title: "Correction form submitted", detail: "corrections@ form on every article" }}
        flow={flow}
        onFlowChange={setFlow}
        statuses={statuses}
        onTestRun={run}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        Press a + to add a step, click a step to rename it, ⌘Z to undo.{" "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            clearTimeout(timer.current);
            setFlow(FLOW);
            setStatuses({});
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
