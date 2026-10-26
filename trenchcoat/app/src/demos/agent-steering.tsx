import { useEffect, useRef, useState } from "react";
import type * as UI from "@components/agent-steering";
import type { SteerNote, SteerStep } from "@components/agent-steering";

/* The run advances a step every ~6s. Notes you queue (↵) are taken in when the next step starts and glide into
   the plan; ⌘↵ or "Now" applies one to the active step right away. One note is queued already so the glide shows
   on its own. The run loops a few seconds after it's done. */

const TITLES = [
  "Read the users table schema",
  "Write the migration for email_verified_at",
  "Backfill 1.2M rows in batches of 10k",
  "Update the User model and serializers",
  "Run the test suite",
];
const STEP_MS = 6000;

const fresh = (): { steps: SteerStep[]; queue: SteerNote[]; started: number } => {
  const t = Date.now();
  return {
    started: t - 41_000,
    steps: TITLES.map((title, i) =>
      i === 0 ? { id: `s${i}`, title, status: "done", duration: 38_000 } : i === 1 ? { id: `s${i}`, title, status: "active", startedAt: t - 3000 } : { id: `s${i}`, title, status: "pending" },
    ),
    queue: [{ id: "n0", text: "Keep the old column until Friday – the iOS app still reads it" }],
  };
};

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AgentSteering } = ui;
  const [run, setRun] = useState(fresh);
  const [status, setStatus] = useState<"running" | "paused" | "done">("running");
  const seq = useRef(1);

  // Advance: finish the active step, start the next one, and hand it the queued notes
  useEffect(() => {
    if (status === "paused") return;
    if (status === "done") {
      const t = setTimeout(() => {
        setRun(fresh());
        setStatus("running");
      }, 6000);
      return () => clearTimeout(t);
    }
    const id = setInterval(() => {
      setRun((r) => {
        const i = r.steps.findIndex((s) => s.status === "active");
        if (i < 0) return r;
        const t = Date.now();
        const steps = r.steps.map((s, j): SteerStep => {
          if (j === i) return { ...s, status: "done", duration: t - Number(s.startedAt ?? t) };
          if (j === i + 1) return { ...s, status: "active", startedAt: t, notes: [...(s.notes ?? []), ...r.queue.map((n) => ({ ...n, picked: "next" as const }))] };
          return s;
        });
        if (i + 1 >= steps.length) setStatus("done");
        return { ...r, steps, queue: i + 1 < steps.length ? [] : r.queue };
      });
    }, STEP_MS);
    return () => clearInterval(id);
  }, [status]);

  const toActive = (note: SteerNote) =>
    setRun((r) => ({ ...r, steps: r.steps.map((s) => (s.status === "active" ? { ...s, notes: [...(s.notes ?? []), note] } : s)) }));

  return (
    <div style={{ width: "100%", maxWidth: 560 }}>
      <AgentSteering
        title="Add email verification to users"
        agent="Opus 5.5"
        startedAt={run.started}
        steps={run.steps}
        queue={run.queue}
        status={status}
        onQueue={(text) => setRun((r) => ({ ...r, queue: [...r.queue, { id: `n${seq.current++}`, text }] }))}
        onInterrupt={(text, queuedId) => {
          if (queuedId) {
            setRun((r) => ({ ...r, queue: r.queue.filter((n) => n.id !== queuedId) }));
            toActive({ id: queuedId, text, picked: "now" });
          } else toActive({ id: `n${seq.current++}`, text, picked: "now" });
        }}
        onRemove={(id) => setRun((r) => ({ ...r, queue: r.queue.filter((n) => n.id !== id) }))}
        onPause={() => setStatus("paused")}
        onResume={() => setStatus("running")}
        placeholder="Steer the agent…"
      />
    </div>
  );
}
