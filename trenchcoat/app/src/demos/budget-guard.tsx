import { useEffect, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { BudgetLimit } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research agent spends live: past 80% of the spend cap the card warns with the pace and offers to raise the cap;
   at the cap the run stops. Raise it from the warning or the stop and the run carries on. */

const START: BudgetLimit[] = [
  { id: "spend", label: "Spend", kind: "currency", used: 3.62, cap: 5, rate: 0.42 },
  { id: "tokens", label: "Tokens", kind: "tokens", used: 181_400, cap: 300_000 },
  { id: "tools", label: "Tool calls", kind: "number", unit: "calls", used: 23, cap: 60 },
];

/** One beat of work: a model call or two, and sometimes a search */
const work = (limits: BudgetLimit[], beat: number) =>
  limits.map((l) =>
    l.id === "spend" ? { ...l, used: Math.min(l.cap, +(l.used + 0.19).toFixed(2)) } : l.id === "tokens" ? { ...l, used: l.used + 7_300 } : beat % 2 ? { ...l, used: l.used + 1 } : l,
  );

export default function Demo({ ui }: { ui: typeof UI }) {
  const { BudgetGuard } = ui;
  const [limits, setLimits] = useState(START);
  const [status, setStatus] = useState<"running" | "done">("running");
  const [halted, setHalted] = useState(false);
  const [beat, setBeat] = useState(0);
  const [log, setLog] = useState("");

  // The run works while it's running and not halted at a cap – nothing ticks otherwise
  useEffect(() => {
    if (status !== "running" || halted) return;
    const t = setTimeout(() => {
      setLimits((l) => work(l, beat));
      setBeat((b) => b + 1);
    }, 700);
    return () => clearTimeout(t);
  }, [status, halted, beat]);

  const replay = () => {
    setLimits(START);
    setStatus("running");
    setHalted(false);
    setBeat(0);
    setLog("");
  };

  return (
    <div style={{ width: "100%", maxWidth: 440, display: "grid", gap: 10 }}>
      <BudgetGuard
        title="Run budget"
        task="Research agent · competitor pricing report"
        status={halted ? "paused" : status}
        limits={limits}
        onLimitsChange={setLimits}
        onRaise={(id, cap, previous) => {
          setHalted(false);
          setLog(`Raised the ${id} cap from ${previous} to ${cap}.`);
        }}
        onCapReach={(id) => {
          setHalted(true);
          setLog(`Halted: the ${id} cap was reached.`);
        }}
        onStop={() => {
          setStatus("done");
          setLog("Run stopped by you.");
        }}
      />
      <p style={{ ...caption, margin: 0, textAlign: "center" }}>
        {log || "Spend climbs every beat – watch the warning, then the stop"}{" "}
        <button type="button" style={textButton} onClick={replay}>
          Replay
        </button>
      </p>
    </div>
  );
}
