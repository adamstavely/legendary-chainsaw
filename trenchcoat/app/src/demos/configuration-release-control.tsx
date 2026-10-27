import { useEffect, useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ReleaseApproval, ReleaseChange, ReleaseEvidence, ReleaseRollback, ReleaseStage, ReleaseVersion } from "../../../src/elements/react";
import { buttonSm, caption, textButton } from "../demo-kit";

/* A support assistant's configuration on its way to production. v14 is in staging; its evaluation finishes a moment
   after the page opens, and one of two approvals is in. Approve as Sam, then Promote: production rolls out v14 in
   steps. Roll back returns production to the version before. */

const VERSIONS: ReleaseVersion[] = [
  { id: "v12", label: "v12", title: "Original refund flow" },
  { id: "v13", label: "v13", title: "Policy-grounded answers" },
  { id: "v14", label: "v14", title: "Shorter refund answers" },
];
const CHANGES: ReleaseChange[] = [
  { id: "instructions", label: "Instructions", count: 3, detail: "Refund replies capped at 120 words" },
  { id: "model", label: "Model", count: 0 },
  { id: "tools", label: "Tools", count: 1, detail: "Added order lookup" },
  { id: "retrieval", label: "Retrieval", count: 2, detail: "Policy pages re-indexed, top 8 → 5" },
];
const START_STAGES: ReleaseStage[] = [
  { id: "draft", label: "Draft", version: "v14" },
  { id: "staging", label: "Staging", version: "v14" },
  { id: "production", label: "Production", version: "v13" },
];
const RUNNING: ReleaseEvidence = { state: "running", threshold: 92, suite: "refund-policy suite" };
const DONE: ReleaseEvidence = { state: "done", passRate: 93.8, baseline: 91.2, threshold: 92, cases: 412, suite: "refund-policy suite" };
const START_APPROVALS: ReleaseApproval[] = [
  { id: "priya", name: "Priya Shah", state: "approved", detail: "Support lead" },
  { id: "sam", name: "Sam Ortiz", state: "pending", detail: "Platform on-call" },
];
const START_ROLLBACK: ReleaseRollback = { stage: "production", version: "v12" };
const STEPS = [10, 50, 100];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ConfigurationReleaseControl } = ui;
  const [stages, setStages] = useState(START_STAGES);
  const [evidence, setEvidence] = useState(RUNNING);
  const [approvals, setApprovals] = useState(START_APPROVALS);
  const [rollback, setRollback] = useState(START_ROLLBACK);
  const [note, setNote] = useState("The evaluation is still running.");
  const timers = useRef<number[]>([]);
  const later = (ms: number, fn: () => void) => void timers.current.push(window.setTimeout(fn, ms));
  const clear = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  const start = () => {
    clear();
    setStages(START_STAGES);
    setEvidence(RUNNING);
    setApprovals(START_APPROVALS);
    setRollback(START_ROLLBACK);
    setNote("The evaluation is still running.");
    later(2400, () => {
      setEvidence(DONE);
      setNote("The evaluation passed. Promote waits for a second approval.");
    });
  };
  useEffect(() => {
    start();
    return clear;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on mount
  }, []);

  const production = (patch: Partial<ReleaseStage>) => setStages((s) => s.map((x) => (x.id === "production" ? { ...x, ...patch } : x)));

  return (
    <div style={{ width: "100%", maxWidth: 720, display: "grid", gap: 8 }}>
      <ConfigurationReleaseControl
        description="Support assistant · refunds"
        stages={stages}
        versions={VERSIONS}
        candidate="v14"
        changes={CHANGES}
        evidence={evidence}
        approvals={approvals}
        requiredApprovals={2}
        rollback={rollback}
        onCompare={({ from, to }) => setNote(`Compare opens the run comparison for ${from?.label ?? "nothing"} → ${to.label}.`)}
        onPromote={({ version }) => {
          clear();
          setNote(`Promoting ${version.label}: production rolls out in steps.`);
          STEPS.forEach((percent, i) =>
            later(1200 + i * 1600, () => {
              if (percent < 100) production({ rollout: { version: version.id, percent } });
              else {
                production({ version: version.id, rollout: undefined });
                setRollback({ stage: "production", version: "v13" });
                setNote(`${version.label} serves all production traffic. Roll back returns to v13.`);
              }
            }),
          );
        }}
        onRollback={({ stage, to }) => {
          clear();
          setNote(`Rolling ${stage.label.toLowerCase()} back to ${to.label}…`);
          later(1400, () => {
            production({ version: to.id, rollout: undefined });
            setRollback({ stage: "production", version: "v12" });
            setNote(`Production is back on ${to.label}.`);
          });
        }}
      />
      <div style={{ ...caption, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <span>{note}</span>
        {approvals.some((a) => a.state === "pending") ? (
          <button
            type="button"
            style={buttonSm}
            onClick={() => {
              setApprovals((list) => list.map((a) => (a.id === "sam" ? { ...a, state: "approved", detail: "Platform on-call · just now" } : a)));
              setNote("Sam approved. Promote is ready.");
            }}
          >
            Approve as Sam
          </button>
        ) : null}
        <button type="button" style={textButton} onClick={start}>
          Reset
        </button>
      </div>
    </div>
  );
}
