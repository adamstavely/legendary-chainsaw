"use client";

/*
 * Agent Run – one autonomous agent run as a full app view, in a single file.
 * In the middle the plan ticks through its steps, with the tool calls of each step in an activity feed below it.
 * On the right "Needs your input": the run pauses on an approval before it sends anything, then the draft
 * it wrote as an inline diff and a few run details. Comes with a built-in simulation, so it runs on its own.
 * className, other DOM props and `ref` go to the App Shell's root.
 * Imports: App Shell (app-shell.tsx) from Trenchcoat screens; Agent Plan, Tool Call Card, Approval Card, Inline Diff,
 * Thinking Loader and Button from Trenchcoat components; icons from lucide-react 1.55.0.
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentPropsWithoutRef, type ReactNode, type RefObject } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BrainIcon,
  CalendarIcon,
  ChartColumnBigIcon,
  CirclePlayIcon,
  CircleStopIcon,
  ClockIcon,
  CoinsIcon,
  CopyIcon,
  DollarSignIcon,
  EllipsisIcon,
  FilePenIcon,
  FolderIcon,
  HouseIcon,
  ListChecksIcon,
  MailIcon,
  MessageCircleMoreIcon,
  PanelRightIcon,
  PresentationIcon,
  RepeatIcon,
  SearchIcon,
  Share2Icon,
  UsersIcon,
  WorkflowIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentPlan, type PlanStep } from "@/components/ui/agent-plan";
import { ToolCallCard, ToolCallGroup } from "@/components/ui/tool-call-card";
import { ApprovalCard, type ApprovalDetail, type ApprovalRisk, type ApprovalStatus } from "@/components/ui/approval-card";
import { InlineDiff } from "@/components/ui/inline-diff";
import { ThinkingLoader } from "@/components/ui/thinking-loader";
import { AppShell, Dropdown, Icon, type AppShellProps, type ShellGroup, type ShellNavItem } from "@/components/ui/app-shell";

/* ---------- Types ---------- */

export type RunCall = {
  /** Tool name in mono, e.g. "stripe.query" */
  name: string;
  /** Short human summary of the call */
  summary: string;
  /** Icon in the tile – picked from the tool name when left out */
  icon?: LucideIcon;
  args?: unknown;
  result?: unknown;
  /** How long the call takes in the simulation, in ms */
  duration: number;
};

export type RunApproval = {
  title: string;
  description?: string;
  risk?: ApprovalRisk;
  details?: ApprovalDetail[];
};

export type RunStep = {
  id: string;
  title: string;
  detail?: string;
  /** Tool chip on the plan step */
  tool?: string;
  /** Tool calls made during the step, in order */
  calls: RunCall[];
  /** The run pauses at the start of this step until someone approves it */
  approval?: RunApproval;
};

export type RunDraft = {
  original: string;
  suggested: string;
  label?: string;
};

/* ---------- Sample content – replace with your own data ---------- */

const nav: ShellNavItem[] = [
  { label: "Home", icon: HouseIcon },
  { label: "Chat", icon: MessageCircleMoreIcon },
  { label: "Runs", icon: CirclePlayIcon, count: 3 },
  { label: "Analytics", icon: ChartColumnBigIcon },
  { label: "Deliverables", icon: FolderIcon },
];
const groups: ShellGroup[] = [
  {
    label: "Agents",
    items: [
      { label: "Board prep", icon: PresentationIcon },
      { label: "Revenue ops", icon: DollarSignIcon },
      { label: "Inbox triage", icon: MailIcon },
      { label: "Workflows", icon: WorkflowIcon },
    ],
  },
];

export const defaultRunSteps: RunStep[] = [
  {
    id: "revenue",
    title: "Pull Q3 revenue and churn",
    detail: "From Stripe, July to September",
    tool: "stripe.query",
    calls: [
      {
        name: "stripe.query",
        summary: "Revenue by month, Q3",
        args: { metric: "revenue", from: "2026-07-01", to: "2026-09-30", group_by: "month" },
        result: { total: 4310000, months: [1380000, 1420000, 1510000], growth: 0.21 },
        duration: 700,
      },
      {
        name: "stripe.query",
        summary: "Customer churn, Q3",
        args: { metric: "churn_rate", period: "quarter" },
        result: { churn_rate: 0.018, previous: 0.021 },
        duration: 500,
      },
    ],
  },
  {
    id: "memo",
    title: "Read last quarter's board memo",
    detail: "Keeps the structure the board knows",
    tool: "search",
    calls: [
      {
        name: "search",
        summary: "Drive: “board memo Q2”",
        args: { query: "board memo Q2", source: "drive", limit: 5 },
        result: [{ title: "Board memo – Q2 2026", owner: "Maya Chen", edited: "Jul 9" }],
        duration: 900,
      },
      {
        name: "docs.read",
        summary: "Board memo – Q2 2026",
        args: { doc: "Board memo – Q2 2026" },
        result: "6 sections · 1,240 words",
        duration: 700,
      },
    ],
  },
  {
    id: "draft",
    title: "Update the memo draft",
    detail: "Revenue, churn and the Q4 outlook",
    tool: "docs.write",
    calls: [
      {
        name: "docs.write",
        summary: "Rewrote the revenue paragraph",
        args: { doc: "Board memo – Q3 2026", section: "Revenue" },
        result: { changed_words: 21 },
        duration: 1100,
      },
      {
        name: "docs.write",
        summary: "Added the churn chart",
        args: { doc: "Board memo – Q3 2026", insert: "chart", data: "churn_rate" },
        result: { ok: true },
        duration: 600,
      },
    ],
  },
  {
    id: "send",
    title: "Send the draft to Maya",
    detail: "Needs your approval first",
    tool: "gmail.send",
    approval: {
      title: "Send the draft to Maya",
      description: "Emails the Q3 board memo draft for review before Friday.",
      risk: "medium",
      details: [
        { label: "To", value: "Maya Chen (CFO)" },
        { label: "Subject", value: "Q3 board update – draft" },
        { label: "Attachment", value: "Board memo – Q3 2026" },
      ],
    },
    calls: [
      {
        name: "gmail.send",
        summary: "Sent to maya@acme.com",
        args: { to: "maya@acme.com", subject: "Q3 board update – draft", attach: "Board memo – Q3 2026" },
        result: { id: "msg_8f2c", status: "sent" },
        duration: 600,
      },
    ],
  },
  {
    id: "review",
    title: "Book a review with Maya",
    detail: "30 minutes before the board meeting",
    tool: "calendar.create",
    calls: [
      {
        name: "calendar.create",
        summary: "Thu, Oct 15 · 10:00",
        args: { title: "Q3 board memo review", with: ["maya@acme.com"], duration: 30 },
        result: { event: "evt_31a", time: "2026-10-15T10:00" },
        duration: 700,
      },
    ],
  },
];

export const defaultRunDraft: RunDraft = {
  label: "Board memo – Q3 · Revenue",
  original:
    "Revenue grew 18% in Q3 to $4.2M, mostly driven by new enterprise customers. Churn stayed flat at 2.1%, and we expect the pipeline to carry into Q4 without changes to the plan.",
  suggested:
    "Revenue grew 21% in Q3 to $4.3M, driven by six new enterprise customers. Churn fell to 1.8%, and the pipeline supports raising the Q4 target by 5%.",
};

const toolIcon = (name: string): LucideIcon =>
  name.startsWith("stripe")
    ? DollarSignIcon
    : name.startsWith("search")
      ? SearchIcon
      : name.startsWith("docs")
        ? FilePenIcon
        : name.startsWith("gmail") || name.startsWith("mail")
          ? MailIcon
          : name.startsWith("calendar")
            ? CalendarIcon
            : WorkflowIcon;

/* ---------- Simulation script ---------- */

type RunEvent = { kind: "step" | "ask" | "call" | "end" | "finish"; s: number; c?: number; delay: number };

/** Turns the steps into a timeline: start a step, ask (if needed), call each tool, finish */
function buildScript(steps: RunStep[]): RunEvent[] {
  const out: RunEvent[] = [];
  steps.forEach((st, s) => {
    out.push({ kind: "step", s, delay: s === 0 ? 150 : 300 });
    if (st.approval) out.push({ kind: "ask", s, delay: 450 });
    st.calls.forEach((call, c) => {
      out.push({ kind: "call", s, c, delay: 200 });
      out.push({ kind: "end", s, c, delay: call.duration });
    });
    out.push({ kind: "finish", s, delay: 250 });
  });
  return out;
}

const clock = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
const whole = (ms: number) => {
  const s = Math.max(1, Math.round(ms / 1000));
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
};

type Phase = "running" | "waiting" | "done" | "stopped";

/* ---------- Helpers (copied from Trenchcoat's src/internal, so this file stays self-contained) ---------- */

/** True while `ref`'s element intersects the viewport and the tab is visible. Starts true; renders only on a change */
function useOnScreen(ref: RefObject<Element | null>) {
  const [onScreen, setOnScreen] = useState(true);
  useEffect(() => {
    const el = ref.current;
    let inView = true;
    let last = true;
    // Only a real change is set: the observer's first report (visible) costs no render
    const update = () => {
      const next = inView && document.visibilityState !== "hidden";
      if (next !== last) setOnScreen((last = next));
    };
    const io =
      el && typeof IntersectionObserver === "function"
        ? new IntersectionObserver((entries) => {
            inView = entries[entries.length - 1].isIntersecting;
            update();
          })
        : null;
    if (el) io?.observe(el);
    document.addEventListener("visibilitychange", update);
    return () => {
      io?.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, [ref]);
  return onScreen;
}

/* ---------- Agent Run ---------- */

type AgentRunScreenOwnProps = Pick<AppShellProps, "onNavigate" | "workspace" | "user" | "className" | "ref"> & {
  /** Goal of the run, shown in the header and above the plan */
  title?: string;
  steps?: RunStep[];
  /** The text the agent wrote, shown as an inline diff on the right */
  draft?: RunDraft;
  /** Run name of the agent, shown in the details */
  agent?: string;
  /** Play the built-in simulation on mount */
  autoRun?: boolean;
  /** An approval was given. May return a promise: the card waits while it runs and the run goes on once it
   *  resolves; if it rejects, the card stays pending and says so, and Approve can be pressed again */
  onApprove?: (stepId: string) => void | Promise<unknown>;
  onDeny?: (stepId: string) => void;
  onStop?: () => void;
  onDone?: () => void;
};

export type AgentRunScreenProps = Omit<ComponentPropsWithoutRef<"div">, keyof AgentRunScreenOwnProps> & AgentRunScreenOwnProps;

/** The run's state, played from the script: what has started, finished and been asked, and the actions on it */
function useRun({ steps, autoRun, onApprove, onDeny, onStop, onDone }: Pick<AgentRunScreenOwnProps, "onApprove" | "onDeny" | "onStop" | "onDone"> & { steps: RunStep[]; autoRun: boolean }) {
  const script = useMemo(() => buildScript(steps), [steps]);
  const [cursor, setCursor] = useState(0);
  const [runKey, setRunKey] = useState(0);
  // Start time: noted after mount (never read while rendering), so server and client render the same
  const [startedAt, setStartedAt] = useState<number | null>(null);
  // End time: only the header clock reads it, in its effects – set where the run ends, so it costs no render
  const endedAt = useRef<number | null>(null);
  const [stopped, setStopped] = useState<"user" | "denied" | null>(null);
  const [decisions, setDecisions] = useState<Record<number, ApprovalStatus>>({});
  const [openGroups, setOpenGroups] = useState<Record<number, boolean>>({});
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useLayoutEffect(() => setStartedAt(Date.now()), []);

  /* What has happened so far, read from the applied part of the script */
  const applied = script.slice(0, cursor);
  const started = new Set(applied.filter((e) => e.kind === "step").map((e) => e.s));
  const finished = new Set(applied.filter((e) => e.kind === "finish").map((e) => e.s));
  const asked = new Set(applied.filter((e) => e.kind === "ask").map((e) => e.s));
  const callState = (s: number, c: number) =>
    applied.some((e) => e.kind === "end" && e.s === s && e.c === c)
      ? "success"
      : applied.some((e) => e.kind === "call" && e.s === s && e.c === c)
        ? "running"
        : null;
  const activeStep = steps.findIndex((_, s) => started.has(s) && !finished.has(s));
  const last = applied[applied.length - 1];
  const holding = last?.kind === "ask" && decisions[last.s] !== "approved";
  const waitingOn = holding && !stopped ? last.s : -1;
  const done = cursor >= script.length;
  const phase: Phase = done ? "done" : stopped ? "stopped" : waitingOn >= 0 ? "waiting" : "running";

  // Plays the script: one event after another, holding at an approval until it's given. `runKey` restarts it even
  // when the cursor is already where a restart puts it
  useEffect(() => {
    if (!autoRun || stopped || holding || cursor >= script.length) return;
    const t = window.setTimeout(() => {
      if (cursor + 1 >= script.length) endedAt.current = Date.now();
      setCursor(cursor + 1);
    }, script[cursor].delay);
    return () => window.clearTimeout(t);
  }, [autoRun, cursor, stopped, holding, script, runKey]);

  const finishedReport = useRef(onDone);
  finishedReport.current = onDone;
  useEffect(() => {
    if (done) finishedReport.current?.();
  }, [done]);

  const restart = () => {
    setCursor(0);
    setStopped(null);
    setDecisions({});
    setOpenGroups({});
    endedAt.current = null;
    setStartedAt(Date.now());
    setRunKey((k) => k + 1);
  };
  const stop = () => {
    setStopped("user");
    endedAt.current = Date.now();
    onStop?.();
  };
  // Picks the run up again at the start of a failed step
  const retryFrom = (id: string) => {
    const s = steps.findIndex((st) => st.id === id);
    const at = script.findIndex((e) => e.kind === "step" && e.s === s);
    if (at < 0) return;
    setDecisions((d) => {
      const next = { ...d };
      delete next[s];
      return next;
    });
    setStopped(null);
    endedAt.current = null;
    setCursor(at);
  };
  const approved = (s: number) => {
    setDecisions((d) => ({ ...d, [s]: "approved" }));
    // Approving a stopped run picks it up again
    setStopped(null);
    endedAt.current = null;
  };
  // A promise from onApprove holds the card (it shows the wait and any error); the run goes on once it resolves
  const approve = (s: number) => {
    const result = onApprove?.(steps[s].id);
    if (result && typeof (result as Promise<unknown>).then === "function") {
      return Promise.resolve(result).then(() => {
        if (alive.current) approved(s);
      });
    }
    approved(s);
  };
  const deny = (s: number) => {
    setDecisions((d) => ({ ...d, [s]: "denied" }));
    setStopped("denied");
    endedAt.current = Date.now();
    onDeny?.(steps[s].id);
  };

  return {
    runKey,
    startedAt,
    endedAt,
    stopped,
    decisions,
    openGroups,
    setOpenGroups,
    started,
    finished,
    asked,
    callState,
    activeStep,
    waitingOn,
    done,
    phase,
    restart,
    stop,
    retryFrom,
    approve,
    deny,
  };
}

type Run = ReturnType<typeof useRun>;

export function AgentRunScreen({
  title = "Prepare the Q3 board update",
  steps = defaultRunSteps,
  draft = defaultRunDraft,
  agent = "Board prep",
  autoRun = true,
  onApprove,
  onDeny,
  onStop,
  onDone,
  ...shell
}: AgentRunScreenProps) {
  const run = useRun({ steps, autoRun, onApprove, onDeny, onStop, onDone });
  const [panelOpen, setPanelOpen] = useState(true);
  // On a narrow panel the side panel opens as a layer over the run, so it starts closed there
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if ((root.current?.offsetWidth ?? Infinity) <= 1000) setPanelOpen(false);
  }, []);

  const planSteps: PlanStep[] = steps.map((st, s) => {
    const failed = run.stopped && s === run.activeStep;
    return {
      id: st.id,
      title: st.title,
      detail: st.detail,
      tool: st.tool,
      status: run.finished.has(s) ? "done" : failed ? "failed" : run.started.has(s) ? "active" : "pending",
      error: failed ? (run.stopped === "denied" ? "You denied this step" : "Stopped by you") : undefined,
    };
  });

  return (
    <AppShell active="Runs" nav={nav} groups={groups} {...shell}>
      <style href="ui-agent-run" precedence="default">
        {css}
      </style>
      <div ref={root} className="ui-ar" data-panel={panelOpen || undefined}>
        <section className="ui-ar__main">
          <RunHeader title={title} run={run} panelOpen={panelOpen} onTogglePanel={() => setPanelOpen((o) => !o)} onNavigate={shell.onNavigate} />

          <div className="ui-ar__scroll">
            <div className="ui-ar__column">
              {/* The run drives the steps; the plan only edits them in review, which a run never shows */}
              <AgentPlan key={run.runKey} style={{ maxWidth: "none" }} title={title} steps={planSteps} onChange={followRun} status={run.done ? "done" : "running"} onRetry={run.retryFrom} />
              <RunFeed steps={steps} run={run} panelOpen={panelOpen} onOpenPanel={() => setPanelOpen(true)} />
            </div>
          </div>
        </section>

        {panelOpen && <div className="ui-ar__scrim" aria-hidden="true" onClick={() => setPanelOpen(false)} />}
        {panelOpen && <RunPanel steps={steps} run={run} draft={draft} agent={agent} user={shell.user?.name ?? "Alex Morgan"} />}
      </div>
    </AppShell>
  );
}

/** The plan's onChange while it runs: nothing to apply, since the steps follow the run */
const followRun = () => {};

const PILL: Record<Phase, string> = {
  running: "Running",
  waiting: "Needs input",
  done: "Done",
  stopped: "Stopped",
};

function RunHeader({
  title,
  run,
  panelOpen,
  onTogglePanel,
  onNavigate,
}: {
  title: string;
  run: Run;
  panelOpen: boolean;
  onTogglePanel: () => void;
  onNavigate?: (label: string) => void;
}) {
  const live = run.phase === "running" || run.phase === "waiting";
  return (
    <header className="ui-ar__bar">
      <span className="ui-ar__crumbs">
        <Icon icon={CirclePlayIcon} size={15} />
        Runs <i>/</i> <b>{title}</b>
        <span className="ui-ar__pill" data-phase={run.phase}>
          <span aria-hidden="true" />
          {PILL[run.phase]}
        </span>
      </span>
      <span className="ui-ar__tools">
        <span className="ui-ar__time">
          <Icon icon={ClockIcon} size={14} />
          <RunClock phase={run.phase} startedAt={run.startedAt} endedAt={run.endedAt} />
        </span>
        {live ? (
          <Button size="sm" variant="secondary" icon={<Icon icon={CircleStopIcon} size={14} />} onClick={run.stop}>
            Stop run
          </Button>
        ) : (
          <Button size="sm" icon={<Icon icon={RepeatIcon} size={14} />} onClick={run.restart}>
            Run again
          </Button>
        )}
        <Dropdown
          align="end"
          items={[
            { label: "Copy run link", icon: CopyIcon },
            { label: "Share", icon: Share2Icon },
            { label: "View in Chat", icon: MessageCircleMoreIcon, onSelect: () => onNavigate?.("Chat") },
          ]}
          trigger={({ open, toggle }) => (
            <button type="button" className="ui-as-icon-btn" aria-label="Run options" aria-expanded={open} onClick={toggle}>
              <Icon icon={EllipsisIcon} size={15} />
            </button>
          )}
        />
        <button type="button" className="ui-as-icon-btn" aria-label={panelOpen ? "Hide side panel" : "Show side panel"} aria-pressed={panelOpen} onClick={onTogglePanel}>
          <Icon icon={PanelRightIcon} size={16} />
        </button>
      </span>
    </header>
  );
}

/**
 * "Started 9:41 AM · 0:12", then "Done in 14s". The clock is read only in effects and the seconds are written
 * straight to the text node, so the ticking costs no React render; it pauses off-screen and in hidden tabs.
 */
function RunClock({ phase, startedAt, endedAt }: { phase: Phase; startedAt: number | null; endedAt: RefObject<number | null> }) {
  const el = useRef<HTMLSpanElement>(null);
  const onScreen = useOnScreen(el);
  useLayoutEffect(() => {
    const node = el.current;
    if (!node || startedAt === null) return;
    const label = new Date(startedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    const write = () => {
      const elapsed = (endedAt.current ?? Date.now()) - startedAt;
      node.textContent = phase === "done" ? `Done in ${whole(elapsed)}` : `Started ${label} · ${clock(elapsed)}`;
    };
    write();
    if (phase === "done" || phase === "stopped" || !onScreen) return;
    const t = window.setInterval(write, 1000);
    return () => window.clearInterval(t);
  }, [phase, startedAt, endedAt, onScreen]);
  return <span ref={el} />;
}

function RunFeed({ steps, run, panelOpen, onOpenPanel }: { steps: RunStep[]; run: Run; panelOpen: boolean; onOpenPanel: () => void }) {
  const { stopped, decisions } = run;
  return (
    <div className="ui-ar__feed">
      <span className="ui-ar__label">Activity</span>
      {steps.map((st, s) => {
        if (!run.started.has(s)) return null;
        const calls = st.calls.map((call, c) => ({ call, c, state: run.callState(s, c) })).filter((x) => x.state);
        const isActive = s === run.activeStep;
        return (
          <div key={`${run.runKey}-${st.id}`} className="ui-ar__entry ui-as-rise">
            <span className="ui-ar__entry-head">
              <span className="ui-ar__num" data-done={run.finished.has(s) || undefined}>
                {s + 1}
              </span>
              {st.title}
            </span>
            {run.asked.has(s) && (
              <span className="ui-ar__note" data-state={decisions[s] ?? "pending"}>
                <Icon icon={ListChecksIcon} size={14} />
                {decisions[s] === "approved" ? "You approved this step" : decisions[s] === "denied" ? "You denied this step" : "Waiting for your approval"}
                {run.waitingOn === s && !panelOpen && (
                  <button type="button" onClick={onOpenPanel}>
                    Review
                  </button>
                )}
              </span>
            )}
            {calls.length > 0 && (
              <ToolCallGroup open={run.openGroups[s] ?? isActive} onOpenChange={(o) => run.setOpenGroups((g) => ({ ...g, [s]: o }))} runningLabel="Using tools…">
                {calls.map(({ call, c, state }) => (
                  <ToolCallCard
                    key={c}
                    name={call.name}
                    summary={call.summary}
                    icon={<Icon icon={call.icon ?? toolIcon(call.name)} size={14} />}
                    status={state === "running" && stopped ? "error" : (state as "running" | "success")}
                    error={stopped ? "Stopped before it finished" : undefined}
                    openOnError={false}
                    args={call.args}
                    result={state === "success" ? call.result : undefined}
                    duration={state === "success" ? call.duration : undefined}
                  />
                ))}
              </ToolCallGroup>
            )}
          </div>
        );
      })}
      {run.phase !== "stopped" && (
        <ThinkingLoader
          key={run.runKey}
          className="ui-ar__loader"
          size="sm"
          phases={[...steps.map((st) => st.title), "Waiting for your approval"]}
          phase={run.waitingOn >= 0 ? steps.length : Math.max(0, run.activeStep)}
          done={run.done}
          startedAt={run.startedAt ?? undefined}
          doneLabel={(seconds) => `Done in ${whole(seconds * 1000)}`}
        />
      )}
    </div>
  );
}

function RunPanel({ steps, run, draft, agent, user }: { steps: RunStep[]; run: Run; draft: RunDraft; agent: string; user: string }) {
  const askedSteps = steps
    .map((_, s) => s)
    .filter((s) => run.asked.has(s))
    .reverse();
  const toolCount = steps.reduce((n, st) => n + st.calls.length, 0);
  return (
    <aside className="ui-ar__panel" aria-label="Run details">
      <header className="ui-ar__bar">
        <span className="ui-ar__crumbs">
          <b>Needs your input</b>
          {run.waitingOn >= 0 && <span className="ui-ar__count">1</span>}
        </span>
      </header>

      <div className="ui-ar__panel-body">
        <section className="ui-ar__section ui-ar__section--stack">
          {askedSteps.length ? (
            askedSteps.map((s) => {
              const a = steps[s].approval!;
              return (
                <ApprovalCard
                  key={`${run.runKey}-${s}`}
                  className="ui-as-rise"
                  title={a.title}
                  description={a.description}
                  risk={a.risk}
                  icon={<Icon icon={MailIcon} size={15} />}
                  details={a.details}
                  status={run.decisions[s] ?? "pending"}
                  allowAlways={false}
                  label={`Step ${s + 1}${steps[s].tool ? ` · ${steps[s].tool}` : ""}`}
                  actions="card"
                  onApprove={() => run.approve(s)}
                  onDeny={() => run.deny(s)}
                />
              );
            })
          ) : (
            <Quiet icon={<Icon icon={BrainIcon} size={16} />} title="Nothing needs you yet">
              The agent asks here before it sends or books anything.
            </Quiet>
          )}
        </section>

        <section className="ui-ar__section">
          <span className="ui-ar__label">Draft</span>
          <InlineDiff key={run.runKey} label={draft.label} original={draft.original} suggested={draft.suggested} />
        </section>

        <section className="ui-ar__section">
          <span className="ui-ar__label">Details</span>
          <dl className="ui-ar__details">
            {[
              { label: "Agent", value: agent, icon: BrainIcon },
              { label: "Triggered by", value: user, icon: UsersIcon },
              { label: "Tool calls", value: String(toolCount), icon: WorkflowIcon },
              { label: "Cost", value: "$0.14", icon: CoinsIcon },
            ].map((d) => (
              <div key={d.label}>
                <dt>
                  <Icon icon={d.icon} size={14} />
                  {d.label}
                </dt>
                <dd>{d.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </aside>
  );
}

function Quiet({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="ui-ar__quiet">
      <span>{icon}</span>
      <b>{title}</b>
      <p>{children}</p>
    </div>
  );
}

/* ---------- Styles ---------- */

const css = /* css */ `
/* Theme: the --tc- fallbacks use light-dark(), which follows color-scheme */
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where([data-tc-theme="system"]) { color-scheme: light dark; }

/* Agent run: the plan and its activity in the middle, what needs you on the right – each scrolls on its own */
.ui-ar {
  /* The live dot breathes a few times, then rests (no endless loop) */
  --tc-agent-run-breathe: 1400ms;
  display: flex;
  height: 100%;
  min-height: 0;
}
.ui-ar__main { display: flex; flex: 1; flex-direction: column; min-width: 0; }

.ui-ar__bar {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 52px;
  padding: 0 12px 0 20px;
  border-bottom: 1px solid var(--tc-border-subtle, light-dark(#f0f0f0, rgba(255, 255, 255, 0.06)));
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
}
.ui-ar__crumbs { display: flex; align-items: center; gap: 8px; min-width: 0; font-size: var(--tc-font-size-md-plus, 13.5px); white-space: nowrap; }
.ui-ar__crumbs i { font-style: normal; color: var(--tc-icon-muted, light-dark(#858585, #7c7c82)); }
.ui-ar__crumbs b { overflow: hidden; font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); text-overflow: ellipsis; }
.ui-ar__tools { display: flex; flex: none; align-items: center; gap: 6px; }
.ui-ar__tools .ui-as-icon-btn[aria-pressed="true"] { background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07))); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-ar__time { display: flex; align-items: center; gap: 6px; margin-right: 6px; font-size: var(--tc-font-size-md, 13px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); font-variant-numeric: tabular-nums; }

/* Status pill: a soft dot that breathes while the run is live */
.ui-ar__pill {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 6px;
  height: var(--tc-pill-h-lg, 22px);
  margin-left: 4px;
  padding: 0 var(--tc-pill-px-lg, 10px) 0 8px;
  border-radius: var(--tc-pill-radius, 999px);
  background: var(--tc-status-info-bg, light-dark(#eaf1ff, #16243f));
  font-size: var(--tc-pill-font-size-lg, 12px);
  font-weight: var(--tc-pill-font-weight, 500);
  color: var(--tc-status-info-fg, light-dark(#2456d6, #8ab4ff));
}
.ui-ar__pill span { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.ui-ar__pill[data-phase="running"] span { animation: ui-ar-breathe var(--tc-agent-run-breathe) var(--tc-ease-in-out, cubic-bezier(0.65, 0, 0.35, 1)) 4; }
.ui-ar__pill[data-phase="waiting"] { background: var(--tc-status-warning-bg, light-dark(#fff3e0, #3a2410)); color: var(--tc-status-warning-fg, light-dark(#a35200, #ffa057)); }
.ui-ar__pill[data-phase="waiting"] span { animation: ui-ar-breathe var(--tc-agent-run-breathe) var(--tc-ease-in-out, cubic-bezier(0.65, 0, 0.35, 1)) 4; }
.ui-ar__pill[data-phase="done"] { background: var(--tc-status-success-bg, light-dark(#e6f6ec, #12301f)); color: var(--tc-status-success-fg, light-dark(#18794e, #3dd68c)); }
.ui-ar__pill[data-phase="stopped"] { background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07))); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
@keyframes ui-ar-breathe { 50% { opacity: 0.35; } }

.ui-ar__scroll { flex: 1; min-height: 0; overflow-y: auto; padding: 32px 32px 40px; }
.ui-ar__column { display: flex; flex-direction: column; gap: 28px; max-width: 680px; margin: 0 auto; }

.ui-ar__label { display: block; padding-bottom: 12px; font-size: var(--tc-font-size-sm-plus, 12.5px); font-weight: var(--tc-font-weight-medium, 500); line-height: var(--tc-line-height-tight, 16px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-ar__feed { display: flex; flex-direction: column; }
.ui-ar__feed > .ui-ar__label { padding-bottom: 14px; }
.ui-ar__entry { position: relative; display: flex; flex-direction: column; gap: 10px; padding: 0 0 20px 34px; }
/* A fine line joins the step numbers into a timeline */
.ui-ar__entry::before { content: ""; position: absolute; top: 26px; bottom: 4px; left: 11px; width: 1px; background: var(--tc-border-default, light-dark(#ececec, #2a2a2e)); }
.ui-ar__entry-head { display: flex; align-items: center; min-height: 22px; font-size: var(--tc-font-size-md-plus, 13.5px); font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-ar__num {
  position: absolute;
  top: 0;
  left: 0;
  display: grid;
  place-items: center;
  width: 23px;
  height: 23px;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px var(--tc-border-default, light-dark(#ececec, #2a2a2e));
  font-size: var(--tc-font-size-xs-plus, 11.5px);
  font-weight: var(--tc-font-weight-medium, 500);
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
  font-variant-numeric: tabular-nums;
  transition: background-color var(--tc-duration-base, 200ms) var(--tc-ease-standard, ease), color var(--tc-duration-base, 200ms) var(--tc-ease-standard, ease);
}
.ui-ar__num[data-done] { background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07))); box-shadow: none; color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-ar__note { display: flex; align-items: center; gap: 7px; font-size: var(--tc-font-size-md, 13px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-ar__note[data-state="pending"] { color: var(--tc-status-warning-fg, light-dark(#a35200, #ffa057)); }
.ui-ar__note[data-state="approved"] { color: var(--tc-status-success-fg, light-dark(#18794e, #3dd68c)); }
.ui-ar__note button { margin-left: 4px; font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); text-decoration: underline; text-underline-offset: 2px; }
.ui-ar__loader { align-self: flex-start; margin-left: 34px; }

/* Side panel: flat sections divided by fine lines */
.ui-ar__panel { display: flex; flex: none; flex-direction: column; width: 360px; min-height: 0; border-left: 1px solid var(--tc-border-subtle, light-dark(#f0f0f0, rgba(255, 255, 255, 0.06))); }
.ui-ar__panel-body { flex: 1; min-height: 0; overflow-y: auto; }
.ui-ar__section { display: flex; flex-direction: column; padding: 20px; }
.ui-ar__section + .ui-ar__section { border-top: 1px solid var(--tc-border-subtle, light-dark(#f0f0f0, rgba(255, 255, 255, 0.06))); }
.ui-ar__section--stack { gap: 12px; }
.ui-ar__count {
  display: grid;
  place-items: center;
  min-width: var(--tc-pill-h, 20px);
  height: var(--tc-pill-h, 20px);
  padding: 0 6px;
  border-radius: var(--tc-radius-badge, 999px);
  background: var(--tc-status-warning-bg, light-dark(#fff3e0, #3a2410));
  font-size: var(--tc-pill-font-size, 11px);
  font-weight: var(--tc-font-weight-semibold, 600);
  color: var(--tc-status-warning-fg, light-dark(#a35200, #ffa057));
  animation: ui-as-pop var(--tc-duration-slow, 320ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)) both;
}
.ui-ar__quiet { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 14px 12px 16px; border-radius: var(--tc-radius-xl, 12px); background: var(--tc-surface-sunken, light-dark(#f0f0f0, #111113)); box-shadow: var(--tc-shadow-sunken, inset 0 0 0 1px light-dark(#f0f0f0, rgba(255, 255, 255, 0.06))); text-align: center; }
.ui-ar__quiet > span { display: grid; place-items: center; width: 34px; height: 34px; margin-bottom: 6px; border-radius: var(--tc-radius-lg, 10px); background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07))); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-ar__quiet b { font-size: var(--tc-font-size-md-plus, 13.5px); font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-ar__quiet p { max-width: 240px; margin: 0; font-size: var(--tc-font-size-sm-plus, 12.5px); line-height: var(--tc-line-height-snug, 18px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }

.ui-ar__details { display: grid; gap: 12px; margin: 0; }
.ui-ar__details div { display: flex; align-items: center; justify-content: space-between; font-size: var(--tc-font-size-md, 13px); }
.ui-ar__details dt { display: flex; align-items: center; gap: 8px; color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-ar__details dd { margin: 0; font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); font-variant-numeric: tabular-nums; }


/* Room for the sidebar icon while the sidebar is collapsed */
.ui-ar__main > .ui-ar__bar { transition: padding-left var(--tc-duration-slower, 420ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)); }
.ui-as-app[data-collapsed] .ui-ar__main > .ui-ar__bar { padding-left: 52px; }
.ui-ar__scrim { display: none; }

/* Narrow panels: the side panel becomes a layer that slides in from the right */
@container ui-as-main (max-width: 1000px) {
  .ui-ar__time { display: none; }
  .ui-ar__panel {
    position: absolute;
    z-index: calc(var(--tc-z-sticky, 10) + 2);
    top: 0;
    right: 0;
    bottom: 0;
    width: min(360px, calc(100% - 32px));
    border-left: 0;
    border-radius: 0 var(--tc-app-shell-panel-radius) var(--tc-app-shell-panel-radius) 0;
    background: var(--tc-surface-raised, light-dark(#ffffff, #19191b));
    box-shadow: var(--tc-shadow-overlay, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 16px 36px -12px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6)));
    animation: ui-ar-panel-in var(--tc-duration-slower, 420ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)) both;
  }
  .ui-ar__scrim {
    display: block;
    position: absolute;
    z-index: calc(var(--tc-z-sticky, 10) + 1);
    inset: 0;
    border-radius: inherit;
    background: var(--tc-scrim, light-dark(rgba(0, 0, 0, 0.32), rgba(0, 0, 0, 0.6)));
    animation: ui-ar-fade var(--tc-duration-slow, 320ms) var(--tc-ease-standard, ease) both;
  }
}
@keyframes ui-ar-panel-in { from { transform: translateX(40px); opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes ui-ar-fade { from { opacity: 0; } }
@container ui-as (max-width: 900px) {
  .ui-ar__main > .ui-ar__bar { padding-left: 52px; }
}
@container ui-as (max-width: 600px) {
  .ui-ar__main .ui-ar__crumbs > svg, .ui-ar__main .ui-ar__crumbs > i { display: none; }
  .ui-ar__main .ui-ar__crumbs { font-size: 0; }
  .ui-ar__main .ui-ar__crumbs > b { font-size: var(--tc-font-size-md-plus, 13.5px); }
  .ui-ar__bar { padding-right: 8px; }
  .ui-ar__panel .ui-ar__bar { padding-left: 20px; }
  .ui-ar__scroll { padding: 20px 16px 24px; }
  .ui-ar__panel { width: 100%; border-radius: var(--tc-app-shell-panel-radius); }
  .ui-ar__section { padding: 16px; }
}
`;
