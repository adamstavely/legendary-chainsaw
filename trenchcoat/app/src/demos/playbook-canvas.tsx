import { useEffect, useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { Playbook, PlaybookDryRun, PlaybookStep, PlaybookVersion } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/** A support team's refund agent, version by version */
const GATE = { triggers: ["low-confidence", "irreversible"], reviewer: "lead", view: "evidence", actions: ["approve", "edit", "send-back", "reject"], reason: "Refunds can't be pulled back once they reach the card – a person checks the amount against the order." };

const V7: PlaybookStep[] = [
  { id: "arrives", phase: "trigger", type: "event", title: "A refund request arrives", notes: "From the help centre form or an email to refunds@" },
  { id: "read", phase: "intake", type: "tool", title: "Read the request and the order", onFail: "retry" },
  { id: "paid", phase: "intake", type: "tool", title: "Check the order is paid and under 60 days old" },
  { id: "policy", phase: "context", type: "retrieve", title: "Look up the refund policy", notes: "Policy pages only – not old macros" },
  { id: "tickets", phase: "context", type: "retrieve", title: "Pull the customer's last five tickets", onFail: "skip" },
  { id: "decide", phase: "analysis", type: "agent", title: "Decide: full, partial or no refund", notes: "Quote the policy line the decision rests on." },
  { id: "draft", phase: "analysis", type: "agent", title: "Draft the reply to the customer" },
  { id: "gate", phase: "review", type: "review", title: "Team lead signs off", notes: "Check the amount and the tone of the reply", gate: GATE },
  { id: "refund", phase: "review", type: "tool", title: "Issue the refund in Stripe" },
  { id: "send", phase: "review", type: "tool", title: "Send the reply" },
];
const STEPS: Record<string, PlaybookStep[]> = {
  v7: V7,
  v6: V7.filter((s) => s.id !== "policy"),
  v5: V7.filter((s) => !["policy", "tickets", "draft"].includes(s.id)),
};
const VERSIONS: PlaybookVersion[] = [
  { id: "v7", label: "v7", note: "Look up the refund policy before deciding", meta: "Oct 24 · Maya Chen" },
  { id: "v6", label: "v6", note: "Retry the order lookup once", meta: "Oct 12 · Sam Ortiz" },
  { id: "v5", label: "v5", note: "First review gate before refunds go out", meta: "Sep 30 · Maya Chen" },
];

const PHASES = ["trigger", "intake", "context", "analysis", "review"];

/** What the server would say: everything runs up to the first gate, which pauses; the tickets lookup finds nothing */
function dryRunOf(p: Playbook, phases: string[]): PlaybookDryRun {
  const ordered = phases.flatMap((ph) => p.steps.filter((s) => s.phase === ph));
  let paused = false;
  return {
    steps: ordered.flatMap((s): PlaybookDryRun["steps"] => {
      if (paused) return [];
      if (s.type === "review") {
        paused = true;
        return [{ id: s.id, outcome: "pause", note: "Refund of $412 is over $250" }];
      }
      if (s.id === "tickets") return [{ id: s.id, outcome: "skip", note: "New customer – no tickets" }];
      return [{ id: s.id, outcome: "run" }];
    }),
  };
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { PlaybookCanvas } = ui;
  const [current, setCurrent] = useState("v7");
  const [value, setValue] = useState<Playbook>({ steps: V7 });
  const [selected, setSelected] = useState<string | null>("gate");
  const [dryRun, setDryRun] = useState<PlaybookDryRun | null>(null);
  const [log, setLog] = useState("Press Dry run to see where the run would pause.");
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return (
    <div style={{ width: "100%", maxWidth: 1080, display: "grid", gap: 12 }}>
      <PlaybookCanvas
        title="Refund requests"
        value={value}
        onChange={(v) => {
          setValue(v);
          setLog("Edited – save it as v8 when you're done.");
        }}
        selected={selected}
        onSelectedChange={setSelected}
        versions={VERSIONS}
        currentVersion={current}
        dryRun={dryRun}
        onDryRun={(p) => {
          window.clearTimeout(timer.current);
          setLog("Asking the server for a dry run…");
          // The app's answer: a server check takes a moment
          timer.current = window.setTimeout(() => {
            setDryRun(dryRunOf(p, PHASES));
            setLog("Dry run done – nothing was sent and no money moved.");
          }, 700);
        }}
        onDryRunClear={() => setDryRun(null)}
        onVersionOpen={(id) => {
          setCurrent(id);
          setValue({ steps: STEPS[id] });
          setSelected(null);
          setDryRun(null);
          setLog(`Opened ${id}.`);
        }}
      />
      <p style={{ ...caption, margin: 0 }}>{log}</p>
    </div>
  );
}
