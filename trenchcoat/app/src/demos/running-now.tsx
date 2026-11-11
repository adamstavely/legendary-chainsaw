import { useEffect, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { RunningTask } from "../../../src/elements/react";
import { caption, surface, textButton } from "../demo-kit";

/* A records audit run by a research institute's agents: vendor checks and document classification are going, a
   report draft waits for a decision, and an export finished. Every couple of seconds the running tasks move on; the
   classification finishes, then the vendor checks need the person too. Review, Stop and Open just report. */

const T0 = Date.UTC(2026, 10, 10, 9, 0, 0);
const TICK = 2000;

const START: RunningTask[] = [
  { id: "draft", title: "Draft the audit report", agent: "Report agent", status: "needs-you", progress: 0.6, started: T0 - 14 * 60_000 },
  { id: "vendors", title: "Check vendor records", agent: "Records agent", status: "running", progress: 0.42, started: T0 - 6 * 60_000 },
  { id: "classify", title: "Classify scanned contracts", agent: "Document agent", status: "running", progress: 0.7, started: T0 - 9 * 60_000 },
  { id: "dedupe", title: "Find duplicate vendors", agent: "Records agent", status: "running", started: T0 - 2 * 60_000 },
  { id: "export", title: "Export access-log sample", agent: "Records agent", status: "done", started: T0 - 31 * 60_000, ended: T0 - 24 * 60_000 },
];

function step(tasks: RunningTask[], now: number): RunningTask[] {
  return tasks.map((t): RunningTask => {
    if (t.status !== "running" || t.progress == null) return t;
    const progress = Math.min(1, t.progress + (t.id === "classify" ? 0.1 : 0.08));
    if (t.id === "vendors" && progress >= 0.75) return { ...t, status: "needs-you", progress };
    if (progress >= 1) return { ...t, status: "done", progress: undefined, ended: now };
    return { ...t, progress };
  });
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { RunningNow } = ui;
  const [tasks, setTasks] = useState(START);
  const [now, setNow] = useState(T0);
  const [last, setLast] = useState("");
  const moving = tasks.some((t) => t.status === "running" && t.progress != null);

  useEffect(() => {
    if (!moving) return;
    const id = window.setInterval(() => setNow((n) => n + TICK), TICK);
    return () => window.clearInterval(id);
  }, [moving]);
  useEffect(() => {
    if (now > T0) setTasks((ts) => step(ts, now));
  }, [now]);

  return (
    <div style={{ width: "100%", maxWidth: 640, display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 12, justifyItems: "center" }}>
      <header style={{ ...surface, width: "100%", boxSizing: "border-box", display: "flex", alignItems: "center", gap: 16, height: 52, padding: "0 12px 0 16px", borderRadius: 12 }}>
        <strong style={{ fontSize: 14 }}>Records audit</strong>
        <span style={{ flex: 1, minWidth: 0 }} />
        <RunningNow
          tasks={tasks}
          now={now}
          onTaskAction={(action, task) => {
            setLast(`${action === "review" ? "Reviewing" : action === "stop" ? "Stopped" : "Opened"} ${task.title}`);
            if (action === "stop") setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, status: "failed", ended: now } : t)));
          }}
        />
      </header>
      <p style={{ ...caption, margin: 0, textAlign: "center" }}>
        {last || "The agents move on every couple of seconds – open the pill to see who needs you."}{" "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setTasks(START);
            setNow(T0);
            setLast("");
          }}
        >
          Replay
        </button>
      </p>
    </div>
  );
}
