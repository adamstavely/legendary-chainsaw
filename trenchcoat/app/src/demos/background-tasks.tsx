import { useEffect, useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { BackgroundTask, BackgroundTasksChange } from "../../../src/elements/react";
import { caption, surface, textButton } from "../demo-kit";

/* A workspace header with the background-tasks indicator, and the same tasks shown inline below it. An export, an
   upload and an agent run are going; a reindex waits its turn. The upload drops its connection and fails; a moment
   later it's retried (or press Retry yourself) and finishes. The export finishes with a file to open. Everything
   stops once the last task is done. */

const TICK = 700;

const START: BackgroundTask[] = [
  { id: "export", label: "Export Q3 revenue", kind: "export", status: "running", detail: "CSV · 48,210 rows", progress: 0.12, elapsed: 4200, remaining: 31000 },
  { id: "upload", label: "Upload brand-assets.zip", kind: "upload", status: "running", detail: "212 MB to Shared drive", progress: 0.34, elapsed: 9800, remaining: 19000 },
  { id: "agent", label: "Summarise support tickets", kind: "agent", status: "running", detail: "1,240 tickets from October", elapsed: 2100 },
  { id: "reindex", label: "Reindex help center", kind: "index", status: "queued", detail: "3,400 articles" },
  { id: "invoices", label: "Download September invoices", kind: "download", status: "done", detail: "86 PDFs", elapsed: 42000, result: { label: "invoices-september.zip" } },
];

/** How far each task moves per tick, while running */
const RATE: Record<string, number> = { export: 0.09, upload: 0.07, reindex: 0.12 };
/** The agent run doesn't know its progress: it's done after this many ticks */
const AGENT_TICKS = 15;

function step(tasks: BackgroundTask[], tick: number): BackgroundTask[] {
  let next = tasks.map((t): BackgroundTask => {
    if (t.status !== "running") return t;
    const elapsed = (t.elapsed ?? 0) + TICK;
    if (t.id === "agent") return tick >= AGENT_TICKS ? { ...t, status: "done", elapsed, result: { label: "ticket-summary.md" } } : { ...t, elapsed };
    const rate = RATE[t.id] ?? 0.1;
    const progress = Math.min(1, (t.progress ?? 0) + rate);
    // The first upload loses its connection at 62%
    if (t.id === "upload" && !t.detail?.includes("resumed") && progress >= 0.62) return { ...t, status: "failed", progress: undefined, remaining: undefined, elapsed, error: "Connection lost at 62%" };
    if (progress >= 1) return { ...t, status: "done", progress: undefined, remaining: undefined, elapsed, result: t.id === "export" ? { label: "q3-revenue.csv" } : undefined };
    return { ...t, progress, elapsed, remaining: Math.round(((1 - progress) / rate) * TICK) };
  });
  // A queued task starts once fewer than three are running
  const running = next.filter((t) => t.status === "running").length;
  const waiting = next.find((t) => t.status === "queued");
  if (waiting && running < 3) next = next.map((t) => (t === waiting ? { ...t, status: "running", progress: t.id === "upload" ? 0.62 : 0, elapsed: 0, detail: t.id === "upload" ? "212 MB to Shared drive · resumed" : t.detail } : t));
  return next;
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { BackgroundTasks } = ui;
  const [tasks, setTasks] = useState<BackgroundTask[]>(START);
  const [tick, setTick] = useState(0);
  const [retried, setRetried] = useState(false);
  const failedAt = useRef<number | null>(null);
  const [last, setLast] = useState("");
  const busy = tasks.some((t) => t.status === "running" || t.status === "queued");
  const failed = tasks.find((t) => t.status === "failed");
  // The clock runs only while something is running or queued, or a failure waits for its retry
  const ticking = busy || (!!failed && !retried);

  useEffect(() => {
    if (!ticking) return;
    const t = setInterval(() => setTick((n) => n + 1), TICK);
    return () => clearInterval(t);
  }, [ticking]);
  useEffect(() => {
    if (tick) setTasks((ts) => step(ts, tick));
  }, [tick]);

  // The failed upload is retried a few seconds later, unless you retry it first
  useEffect(() => {
    if (!failed) {
      failedAt.current = null;
      return;
    }
    if (failedAt.current === null) failedAt.current = tick;
    else if (!retried && tick - failedAt.current >= 5) {
      setRetried(true);
      setTasks((ts) => ts.map((x) => (x.id === failed.id ? { ...x, status: "queued", error: undefined, elapsed: undefined } : x)));
      setLast(`Retried ${failed.label}`);
    }
  }, [failed, tick, retried]);

  const onTasksChange = (next: BackgroundTask[], change: BackgroundTasksChange) => {
    setTasks(next);
    if (change.action === "retry") setRetried(true);
    setLast(change.action === "clear" ? "Cleared finished tasks" : `${change.action === "cancel" ? "Cancelled" : "Retried"} ${change.task?.label}`);
  };
  const onOpen = (t: BackgroundTask) => {
    setLast(`Opened ${t.result?.label ?? t.label}`);
    return false;
  };

  const replay = () => {
    setTasks(START);
    setTick(0);
    setRetried(false);
    failedAt.current = null;
    setLast("");
  };

  return (
    <div style={{ width: "100%", maxWidth: 720, display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 16, justifyItems: "center" }}>
      <header style={{ ...surface, width: "100%", boxSizing: "border-box", display: "flex", alignItems: "center", gap: 16, height: 52, padding: "0 8px 0 16px", borderRadius: 12 }}>
        <strong style={{ fontSize: 14 }}>Northwind</strong>
        <nav style={{ ...caption, display: "flex", gap: 14, minWidth: 0, overflow: "hidden", fontSize: 13, whiteSpace: "nowrap" }} aria-label="Workspace">
          <span>Reports</span>
          <span>Files</span>
          <span>Automations</span>
        </nav>
        <span style={{ flex: 1, minWidth: 0 }} />
        <span aria-hidden="true" style={{ display: "grid", flexShrink: 0, placeItems: "center", width: 28, height: 28, borderRadius: "50%", background: "var(--tc-accent-subtle, light-dark(#e8efff, #1e2a44))", color: "var(--tc-accent-text, light-dark(#2456d6, #8ab4ff))", fontSize: 11, fontWeight: 600 }}>
          JP
        </span>
        <BackgroundTasks
          tasks={tasks}
          onTasksChange={onTasksChange}
          onOpen={onOpen}
        />
      </header>
      <BackgroundTasks
        layout="panel"
        tasks={tasks}
        onTasksChange={onTasksChange}
        onOpen={onOpen}
      />
      <p style={{ ...caption, margin: 0, textAlign: "center" }}>
        {last || (busy ? "Tasks progress on their own – open the indicator in the header" : "All done")}{" "}
        <button type="button" style={textButton} onClick={replay}>
          Replay
        </button>
      </p>
    </div>
  );
}
