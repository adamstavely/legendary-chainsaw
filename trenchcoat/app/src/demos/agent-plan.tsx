import { useEffect, useRef, useState } from "react";
import type * as UI from "@components/agent-plan";
import type { PlanStep } from "@components/agent-plan";
import { buttonSm } from "../demo-kit";

/* Review the plan (rename, drag, remove, add), press Run plan and watch it execute. The fourth step fails on the
   first run – "Retry from here" picks it up again. A Replay link brings the draft back once it's done. */

const DRAFT: PlanStep[] = [
  { id: "s1", title: "Find last quarter's churned accounts", detail: "Accounts that cancelled between Jul 1 and Sep 30", tool: "query_warehouse" },
  { id: "s2", title: "Pull their support history", detail: "Tickets and chat transcripts from the last 90 days", tool: "search_zendesk" },
  { id: "s3", title: "Group cancellation reasons", detail: "Cluster free-text reasons into themes", tool: "run_python" },
  { id: "s4", title: "Compare with competitor pricing", detail: "Pricing pages of the top 3 alternatives", tool: "search_web" },
  { id: "s5", title: "Write a one-page summary", detail: "Themes, numbers and three recommendations", tool: "write_doc" },
];

const TIMES = [1600, 2200, 1900, 2400, 2000];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AgentPlan } = ui;
  const [steps, setSteps] = useState<PlanStep[]>(DRAFT);
  const [status, setStatus] = useState<"draft" | "running" | "done">("draft");
  const [cursor, setCursor] = useState<number | null>(null); // index of the active step
  const failedOnce = useRef(false);

  // Runs the active step; when its time is up it's done (or fails once) and the next one starts
  useEffect(() => {
    if (status !== "running" || cursor === null) return;
    if (cursor >= steps.length) {
      setStatus("done");
      return;
    }
    setSteps((ss) => ss.map((s, i) => (i === cursor ? { ...s, status: "active", error: undefined } : s)));
    const t = setTimeout(() => {
      const fail = cursor === 3 && !failedOnce.current;
      if (fail) {
        failedOnce.current = true;
        setSteps((ss) => ss.map((s, i) => (i === cursor ? { ...s, status: "failed", error: "search_web timed out after 30s (429 from upstream)" } : s)));
        setCursor(null);
        return;
      }
      setSteps((ss) => ss.map((s, i) => (i === cursor ? { ...s, status: "done" } : s)));
      setCursor(cursor + 1);
    }, TIMES[cursor % TIMES.length]);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, cursor]);

  const reset = () => {
    failedOnce.current = false;
    setCursor(null);
    setStatus("draft");
    setSteps(DRAFT);
  };

  return (
    <div style={{ width: "100%", maxWidth: 520, display: "grid", gap: 10 }}>
      <AgentPlan
        title="Find out why customers churned last quarter"
        estimate="~2 min"
        steps={steps}
        status={status}
        onChange={setSteps}
        onRun={(final) => {
          setSteps(final.map((s) => ({ ...s, status: "pending" })));
          setStatus("running");
          setCursor(0);
        }}
        onCancel={reset}
        onRetry={(id) => {
          const i = steps.findIndex((s) => s.id === id);
          if (i < 0) return;
          setSteps((ss) => ss.map((s, j) => (j >= i ? { ...s, status: "pending", error: undefined } : s)));
          setStatus("running");
          setCursor(i);
        }}
      />
      {status !== "draft" && (
        <button
          type="button"
          onClick={reset}
          style={{ ...buttonSm, justifySelf: "center" }}
        >
          Replay from the draft
        </button>
      )}
    </div>
  );
}
