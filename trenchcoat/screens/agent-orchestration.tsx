"use client";

/*
 * Agent / Orchestration – one live multi-agent run as a full app view, in a single file.
 * In the middle the run as a tree of agents (who started whom, status, cost and time on every card), with the trace of
 * every agent on one time axis below it. Opening an agent shows its tasks, how full its context is and what it cost
 * in the side panel, with its answer when it waits for you. The header has the run's status, the cost so far and Stop.
 * Comes with a built-in simulation, so it runs on its own.
 * className, other DOM props and `ref` go to the App Shell's root.
 * Imports: App Shell (app-shell.tsx) from Trenchcoat screens; Agent Tree and Trace Waterfall from
 * @adamstavely/trenchcoat/react, Button from Trenchcoat components; icons from lucide-react 1.55.0.
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentPropsWithoutRef } from "react";
import {
  BookOpenIcon,
  ChartColumnBigIcon,
  CircleCheckIcon,
  CirclePlayIcon,
  CircleStopIcon,
  CoinsIcon,
  FolderIcon,
  HouseIcon,
  LibraryIcon,
  MessageCircleMoreIcon,
  NetworkIcon,
  PanelRightIcon,
  RepeatIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { AgentTree, TraceWaterfall, type AgentTreeProps, type TraceSpan, type TreeAgent } from "@adamstavely/trenchcoat/react";
import { Button } from "@/components/ui/button";
import { AppShell, Icon, type AppShellProps, type ShellGroup, type ShellNavItem } from "@/components/ui/app-shell";

/* ---------- Types ---------- */

/** An answer to an agent: approve or reject one that waits, retry or dismiss one that failed */
export type AgentTreeResolution = Parameters<NonNullable<AgentTreeProps["onResolve"]>>[1];

/** One agent of the run: when it starts and how long it works, in seconds after the run started */
export type OrchestrationAgent = {
  id: string;
  /** The agent that started it; null for the orchestrator */
  parent: string | null;
  name: string;
  /** What it was asked to do */
  task: string;
  model?: string;
  /** Seconds after the run started */
  at: number;
  /** Seconds it works */
  duration: number;
  /** Cost per second while it works, in dollars */
  rate: number;
  /** How full its context window gets, 0–1 */
  context: number;
  /** It stops to ask you this when its work is done – the run waits for the answer */
  ask?: string;
  /** It fails with this error when its work is done – Retry runs it again */
  error?: string;
};

/* ---------- Sample content – replace with your own data ---------- */

const nav: ShellNavItem[] = [
  { label: "Home", icon: HouseIcon },
  { label: "Chat", icon: MessageCircleMoreIcon },
  { label: "Runs", icon: CirclePlayIcon, count: 2 },
  { label: "Analytics", icon: ChartColumnBigIcon },
  { label: "Collections", icon: FolderIcon },
];
const groups: ShellGroup[] = [
  {
    label: "Agents",
    items: [
      { label: "Literature search", icon: SearchIcon },
      { label: "Reading lists", icon: BookOpenIcon },
      { label: "Catalogue", icon: LibraryIcon },
    ],
  },
];

export const defaultOrchestrationAgents: OrchestrationAgent[] = [
  { id: "lead", parent: null, name: "Orchestrator", model: "Model L", task: "Literature review: urban heat islands, 2015–2026", at: 0, duration: 34, rate: 0.004, context: 0.58 },
  { id: "search", parent: "lead", name: "Database search", model: "Model M", task: "Search three journal indexes for peer-reviewed studies", at: 1, duration: 9, rate: 0.006, context: 0.41 },
  { id: "screen", parent: "search", name: "Abstract screener", model: "Model S", task: "Screen 214 abstracts against the inclusion criteria", at: 4, duration: 8, rate: 0.005, context: 0.73 },
  { id: "loan", parent: "search", name: "Full-text finder", model: "Model S", task: "Find full texts for the 31 included studies", at: 6, duration: 5, rate: 0.003, context: 0.22, ask: "Request 4 articles through interlibrary loan? It takes about 3 days and costs the department €48." },
  { id: "extract", parent: "lead", name: "Data extraction", model: "Model M", task: "Pull study design, city and temperature effect from each study", at: 9, duration: 14, rate: 0.008, context: 0.64 },
  { id: "catalogue", parent: "extract", name: "Catalogue check", model: "Model S", task: "Match every study to the library catalogue record", at: 11, duration: 4, rate: 0.002, context: 0.18, error: "The catalogue didn't answer in 30 s (timeout)" },
  { id: "write", parent: "lead", name: "Review writer", model: "Model L", task: "Draft the review with a summary table and citations", at: 24, duration: 9, rate: 0.009, context: 0.47 },
];

/* ---------- Simulation ---------- */

type Answer = { action: AgentTreeResolution; at: number };
type Phase = "running" | "waiting" | "done" | "stopped";
type Status = TreeAgent["status"];

/** A fixed start, so the screen renders the same on the server and the client; the run's clock counts from it */
const T0 = Date.UTC(2026, 10, 14, 9, 30);
const TICK = 500;
/** How long an answered agent works again, in seconds */
const AFTER = 2.5;

/** Every agent's status, start and end at `s` seconds into the run, with the answers given so far */
function stateAt(agents: OrchestrationAgent[], s: number, answers: Record<string, Answer>, stoppedAt: number | null) {
  const out = new Map<string, { status: Status; started: number; ended?: number }>();
  for (const a of agents) {
    if (s < a.at) continue;
    const end = a.at + a.duration;
    const answer = answers[a.id];
    let status: Status = s < end ? "running" : "done";
    let ended: number | undefined = s < end ? undefined : end;
    if ((a.ask || a.error) && s >= end) {
      if (!answer) {
        status = a.ask ? "waiting" : "failed";
        ended = a.error ? end : undefined;
      } else if (answer.action === "approve" || answer.action === "retry") {
        status = s < answer.at + AFTER ? "running" : "done";
        ended = status === "done" ? answer.at + AFTER : undefined;
      } else {
        status = "stopped";
        ended = answer.at;
      }
    }
    if (stoppedAt !== null && (status === "running" || status === "waiting")) {
      status = "stopped";
      ended = stoppedAt;
    }
    out.set(a.id, { status, started: a.at, ended });
  }
  // A parent keeps working while any of its sub-agents does
  for (const a of [...agents].reverse()) {
    const me = out.get(a.id);
    if (!me || me.status !== "done") continue;
    const busy = agents.some((c) => c.parent === a.id && ["running", "waiting", "failed"].includes(out.get(c.id)?.status ?? ""));
    if (busy) {
      me.status = "running";
      me.ended = undefined;
    }
  }
  return out;
}

const costOf = (a: OrchestrationAgent, st: { started: number; ended?: number }, s: number) => Math.round(((st.ended ?? s) - st.started) * a.rate * 1000) / 1000;

function phaseOf(states: Map<string, { status: Status }>, stopped: boolean): Phase {
  if (stopped) return "stopped";
  const all = [...states.values()];
  if (all.some((x) => x.status === "waiting" || x.status === "failed")) return "waiting";
  if (all.length && all.every((x) => x.status === "done" || x.status === "stopped")) return "done";
  return "running";
}

const money = (n: number) => `$${n.toFixed(2)}`;
const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const STATUS_WORD: Record<Status, string> = {
  queued: "Queued",
  running: "Working",
  waiting: "Needs you",
  done: "Done",
  failed: "Failed",
  stopped: "Stopped",
};
const PILL: Record<Phase, string> = { running: "Running", waiting: "Needs you", done: "Done", stopped: "Stopped" };

/* ---------- Agent / Orchestration ---------- */

type AgentOrchestrationScreenOwnProps = Pick<AppShellProps, "onNavigate" | "workspace" | "user" | "className" | "ref"> & {
  /** Goal of the run, shown in the header */
  title?: string;
  /** The agents of the run – the first one without a parent is the orchestrator */
  agents?: OrchestrationAgent[];
  /** Play the built-in simulation on mount */
  autoRun?: boolean;
  /** Id of the agent open in the side panel. Controlled when defined – pair it with `onSelectedChange` */
  selected?: string | null;
  defaultSelected?: string | null;
  onSelectedChange?: (id: string | null) => void;
  /** An answer to an agent that waits for you or failed: approve or reject, retry or dismiss */
  onResolve?: (id: string, action: AgentTreeResolution) => void;
  onStop?: () => void;
};

export type AgentOrchestrationScreenProps = Omit<ComponentPropsWithoutRef<"div">, keyof AgentOrchestrationScreenOwnProps> & AgentOrchestrationScreenOwnProps;

function useControlled<T>(value: T | undefined, defaultValue: T, onChange?: (next: T) => void) {
  const [own, setOwn] = useState(defaultValue);
  const controlled = value !== undefined;
  const set = (next: T) => {
    if (!controlled) setOwn(next);
    onChange?.(next);
  };
  return [controlled ? value : own, set] as const;
}

export function AgentOrchestrationScreen({
  title = "Literature review: urban heat islands",
  agents = defaultOrchestrationAgents,
  autoRun = true,
  selected: selectedProp,
  defaultSelected = null,
  onSelectedChange,
  onResolve,
  onStop,
  ...shell
}: AgentOrchestrationScreenProps) {
  // Seconds into the run – a counter, so the screen never reads the clock while rendering
  const [s, setS] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [stoppedAt, setStoppedAt] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const [selected, setSelected] = useControlled(selectedProp, defaultSelected, onSelectedChange);
  const [panelOpen, setPanelOpen] = useState(true);
  const root = useRef<HTMLDivElement>(null);
  // On a narrow panel the side panel opens as a layer over the run, so it starts closed there
  useLayoutEffect(() => {
    if ((root.current?.offsetWidth ?? Infinity) <= 1000) setPanelOpen(false);
  }, []);

  const states = useMemo(() => stateAt(agents, s, answers, stoppedAt), [agents, s, answers, stoppedAt]);
  const phase = phaseOf(states, stoppedAt !== null);
  const live = phase === "running" || phase === "waiting";

  // The clock runs while something works; it rests while every agent waits on you, and stops for good when done
  const working = [...states.values()].some((x) => x.status === "running") || states.size < agents.length;
  useEffect(() => {
    if (!autoRun || !live || !working) return;
    const t = window.setInterval(() => setS((v) => v + TICK / 1000), TICK);
    return () => window.clearInterval(t);
  }, [autoRun, live, working, round]);

  const total = agents.reduce((n, a) => n + (states.has(a.id) ? costOf(a, states.get(a.id)!, s) : 0), 0);

  const tree = useMemo(() => {
    const make = (a: OrchestrationAgent): TreeAgent | null => {
      const st = states.get(a.id);
      if (!st) return null;
      const children = agents
        .filter((c) => c.parent === a.id)
        .map(make)
        .filter((c): c is TreeAgent => !!c);
      return {
        id: a.id,
        name: a.name,
        task: a.task,
        model: a.model,
        status: st.status,
        cost: costOf(a, st, s),
        ask: st.status === "waiting" ? a.ask : undefined,
        error: st.status === "failed" ? a.error : undefined,
        started: T0 + st.started * 1000,
        ended: st.ended === undefined ? undefined : T0 + st.ended * 1000,
        children,
      };
    };
    const lead = agents.find((a) => a.parent === null);
    return lead ? make(lead) : null;
  }, [agents, states, s]);

  // The trace: every agent a span on one axis, the sub-agents nested under the agent that started them
  const trace = useMemo(() => {
    const span = (a: OrchestrationAgent): TraceSpan | null => {
      const st = states.get(a.id);
      if (!st) return null;
      const done = st.ended !== undefined;
      return {
        id: a.id,
        name: a.name,
        kind: a.parent === null ? "agent" : "subagent",
        detail: a.task,
        model: a.model,
        start: st.started * 1000,
        end: done ? st.ended! * 1000 : undefined,
        status: st.status === "failed" ? "failed" : st.status === "running" || st.status === "waiting" ? "running" : "done",
        cost: done ? costOf(a, st, s) : undefined,
        error: st.status === "failed" ? a.error : undefined,
        children: agents
          .filter((c) => c.parent === a.id)
          .map(span)
          .filter((c): c is TraceSpan => !!c),
      };
    };
    const lead = agents.find((a) => a.parent === null);
    return lead ? span(lead) : null;
  }, [agents, states, s]);

  const resolve = (id: string, action: AgentTreeResolution) => {
    setAnswers((a) => ({ ...a, [id]: { action, at: s } }));
    onResolve?.(id, action);
  };
  const stop = () => {
    setStoppedAt(s);
    onStop?.();
  };
  const restart = () => {
    setS(0);
    setAnswers({});
    setStoppedAt(null);
    setRound((r) => r + 1);
  };
  const open = (id: string | null) => {
    setSelected(id);
    if (id) setPanelOpen(true);
  };

  const current = agents.find((a) => a.id === selected);
  const showPanel = panelOpen && !!current;

  return (
    <AppShell active="Runs" nav={nav} groups={groups} {...shell}>
      <style href="ui-screen-agent-orchestration" precedence="default">
        {css}
      </style>
      <div ref={root} className="ui-aorch" data-panel={showPanel || undefined}>
        <section className="ui-aorch__main">
          <header className="ui-aorch__bar">
            <span className="ui-aorch__crumbs">
              <Icon icon={NetworkIcon} size={15} />
              Runs <i>/</i> <b>{title}</b>
              <span className="ui-aorch__pill" data-phase={phase}>
                <span aria-hidden="true" />
                {PILL[phase]}
              </span>
            </span>
            <span className="ui-aorch__tools">
              <span className="ui-aorch__stat">
                <Icon icon={CoinsIcon} size={14} />
                <span>
                  {money(total)}
                  <span className="ui-aorch__sr"> spent</span>
                  {live ? " so far" : ""}
                </span>
              </span>
              <span className="ui-aorch__stat ui-aorch__clock">{clock(s)}</span>
              {live ? (
                <Button size="sm" variant="secondary" icon={<Icon icon={CircleStopIcon} size={14} />} onClick={stop}>
                  Stop run
                </Button>
              ) : (
                <Button size="sm" icon={<Icon icon={RepeatIcon} size={14} />} onClick={restart}>
                  Run again
                </Button>
              )}
              {current && (
                <button
                  type="button"
                  className="ui-as-icon-btn"
                  aria-label={panelOpen ? "Hide agent details" : "Show agent details"}
                  aria-pressed={panelOpen}
                  onClick={() => setPanelOpen((o) => !o)}
                >
                  <Icon icon={PanelRightIcon} size={16} />
                </button>
              )}
            </span>
          </header>

          <div className="ui-aorch__scroll">
            <div className="ui-aorch__column">
              {tree && (
                <AgentTree
                  key={`tree-${round}`}
                  title="Agents"
                  root={tree}
                  now={T0 + s * 1000}
                  onSelect={(a) => open(a.id)}
                  onResolve={(a, action) => resolve(a.id, action)}
                />
              )}
              {trace && <TraceWaterfall key={`trace-${round}`} title="Trace" root={trace} elapsed={s * 1000} onOpenChange={(id) => id && open(id)} />}
            </div>
          </div>
        </section>

        {showPanel && <div className="ui-aorch__scrim" aria-hidden="true" onClick={() => setPanelOpen(false)} />}
        {showPanel && current && (
          <AgentPanel
            agent={current}
            agents={agents}
            states={states}
            s={s}
            onClose={() => setPanelOpen(false)}
            onOpen={open}
            onResolve={resolve}
          />
        )}
      </div>
    </AppShell>
  );
}

/** One agent in the side panel: what it does, its tasks, how full its context is, what it cost, and its answer */
function AgentPanel({
  agent,
  agents,
  states,
  s,
  onClose,
  onOpen,
  onResolve,
}: {
  agent: OrchestrationAgent;
  agents: OrchestrationAgent[];
  states: Map<string, { status: Status; started: number; ended?: number }>;
  s: number;
  onClose: () => void;
  onOpen: (id: string) => void;
  onResolve: (id: string, action: AgentTreeResolution) => void;
}) {
  const st = states.get(agent.id);
  const status: Status = st?.status ?? "queued";
  const own = st ? costOf(agent, st, s) : 0;
  const subs = agents.filter((a) => a.parent === agent.id);
  const descendants = (id: string): OrchestrationAgent[] => agents.filter((a) => a.parent === id).flatMap((a) => [a, ...descendants(a.id)]);
  const withSubs = own + descendants(agent.id).reduce((n, a) => n + (states.has(a.id) ? costOf(a, states.get(a.id)!, s) : 0), 0);
  const ran = st ? (st.ended ?? s) - st.started : 0;
  const pct = Math.round(agent.context * (st ? Math.min(1, ran / agent.duration) : 0) * 100);

  return (
    <aside className="ui-aorch__panel" aria-label={`${agent.name} details`}>
      <header className="ui-aorch__bar">
        <span className="ui-aorch__crumbs">
          <b>{agent.name}</b>
          <span className="ui-aorch__tag" data-status={status}>
            {STATUS_WORD[status]}
          </span>
        </span>
        <button type="button" className="ui-as-icon-btn" aria-label="Close agent details" onClick={onClose}>
          <Icon icon={XIcon} size={15} />
        </button>
      </header>
      <div className="ui-aorch__panel-body">
        <section className="ui-aorch__section">
          <span className="ui-aorch__label">Task</span>
          <p className="ui-aorch__text">{agent.task}</p>
          {status === "waiting" && agent.ask && (
            <div className="ui-aorch__ask" role="group" aria-label="Waiting for your answer">
              <p>{agent.ask}</p>
              <span className="ui-aorch__actions">
                <Button size="sm" onClick={() => onResolve(agent.id, "approve")}>
                  Approve
                </Button>
                <Button size="sm" variant="secondary" onClick={() => onResolve(agent.id, "reject")}>
                  Reject
                </Button>
              </span>
            </div>
          )}
          {status === "failed" && agent.error && (
            <div className="ui-aorch__ask" data-failed="" role="group" aria-label="What went wrong">
              <p>{agent.error}</p>
              <span className="ui-aorch__actions">
                <Button size="sm" onClick={() => onResolve(agent.id, "retry")}>
                  Retry
                </Button>
                <Button size="sm" variant="secondary" onClick={() => onResolve(agent.id, "dismiss")}>
                  Dismiss
                </Button>
              </span>
            </div>
          )}
        </section>

        <section className="ui-aorch__section">
          <span className="ui-aorch__label">Tasks it handed out</span>
          {subs.length === 0 ? (
            <p className="ui-aorch__quiet">It does this one itself.</p>
          ) : (
            <ul className="ui-aorch__tasks">
              {subs.map((a) => {
                const sub = states.get(a.id)?.status ?? "queued";
                return (
                  <li key={a.id}>
                    <span className="ui-aorch__mark" data-status={sub} aria-hidden="true">
                      {sub === "done" && <Icon icon={CircleCheckIcon} size={14} />}
                    </span>
                    <button type="button" className="ui-aorch__task" onClick={() => onOpen(a.id)}>
                      {a.task}
                      <small>
                        {a.name} · {STATUS_WORD[sub]}
                      </small>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="ui-aorch__section">
          <span className="ui-aorch__label">Context</span>
          <div className="ui-aorch__meter" role="meter" aria-label="Context window used" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-valuetext={`${pct}% of its context window`} data-full={pct >= 70 || undefined}>
            <span style={{ width: `${pct}%` }} />
          </div>
          <span className="ui-aorch__note">
            {pct}% of its context window{pct >= 70 ? " – getting full" : ""}
          </span>
        </section>

        <section className="ui-aorch__section">
          <span className="ui-aorch__label">Cost and time</span>
          <dl className="ui-aorch__details">
            <div>
              <dt>Model</dt>
              <dd>{agent.model ?? "–"}</dd>
            </div>
            <div>
              <dt>Its own cost</dt>
              <dd>{money(own)}</dd>
            </div>
            <div>
              <dt>With its sub-agents</dt>
              <dd>{money(withSubs)}</dd>
            </div>
            <div>
              <dt>Time</dt>
              <dd>{st ? clock(ran) : "Not started"}</dd>
            </div>
          </dl>
        </section>
      </div>
    </aside>
  );
}

/* ---------- Styles ---------- */

const css = /* css */ `
/* Theme: the --tc- fallbacks use light-dark(), which follows color-scheme */
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where([data-tc-theme="system"]) { color-scheme: light dark; }

/* Agent orchestration: the tree and the trace in the middle, one agent's details on the right */
.ui-aorch { display: flex; height: 100%; min-height: 0; }
.ui-aorch__main { display: flex; flex: 1; flex-direction: column; min-width: 0; }

.ui-aorch__bar {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-3, 12px);
  height: 52px;
  padding: 0 var(--tc-space-3, 12px) 0 var(--tc-space-5, 20px);
  border-bottom: 1px solid var(--tc-border-subtle, light-dark(#f0f0f0, rgba(255, 255, 255, 0.06)));
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
}
.ui-aorch__crumbs { display: flex; align-items: center; gap: var(--tc-space-2, 8px); min-width: 0; font-size: var(--tc-font-size-md-plus, 13.5px); white-space: nowrap; }
.ui-aorch__crumbs i { font-style: normal; color: var(--tc-icon-muted, light-dark(#858585, #7c7c82)); }
.ui-aorch__crumbs b { overflow: hidden; font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); text-overflow: ellipsis; }
.ui-aorch__tools { display: flex; flex: none; align-items: center; gap: var(--tc-space-1-5, 6px); }
.ui-aorch__tools .ui-as-icon-btn[aria-pressed="true"] { background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07))); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-aorch__stat { display: flex; align-items: center; gap: var(--tc-space-1-5, 6px); margin-right: var(--tc-space-1-5, 6px); font-size: var(--tc-font-size-md, 13px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); font-variant-numeric: tabular-nums; }
.ui-aorch__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

/* Status pill: a soft dot that breathes a few times while the run is live, then rests */
.ui-aorch__pill {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: var(--tc-space-1-5, 6px);
  height: var(--tc-pill-h-lg, 22px);
  margin-left: var(--tc-space-1, 4px);
  padding: 0 var(--tc-pill-px-lg, 10px) 0 var(--tc-space-2, 8px);
  border-radius: var(--tc-pill-radius, 999px);
  background: var(--tc-status-info-bg, light-dark(#eaf1ff, #16243f));
  font-size: var(--tc-pill-font-size-lg, 12px);
  font-weight: var(--tc-pill-font-weight, 500);
  color: var(--tc-status-info-fg, light-dark(#2456d6, #8ab4ff));
}
.ui-aorch__pill span { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.ui-aorch__pill[data-phase="running"] span { animation: ui-aorch-breathe var(--tc-duration-shimmer, 1600ms) var(--tc-ease-in-out, cubic-bezier(0.65, 0, 0.35, 1)) 4; }
.ui-aorch__pill[data-phase="waiting"] { background: var(--tc-status-warning-bg, light-dark(#fff3e0, #3a2410)); color: var(--tc-status-warning-fg, light-dark(#a35200, #ffa057)); }
.ui-aorch__pill[data-phase="done"] { background: var(--tc-status-success-bg, light-dark(#e6f6ec, #12301f)); color: var(--tc-status-success-fg, light-dark(#18794e, #3dd68c)); }
.ui-aorch__pill[data-phase="stopped"] { background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07))); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
@keyframes ui-aorch-breathe { 50% { opacity: 0.35; } }
@media (prefers-reduced-motion: reduce) { .ui-aorch__pill span { animation: none !important; } }

.ui-aorch__scroll { flex: 1; min-height: 0; overflow-y: auto; padding: var(--tc-space-6, 24px) var(--tc-space-8, 32px) var(--tc-space-10, 40px); }
.ui-aorch__column { display: flex; flex-direction: column; gap: var(--tc-space-6, 24px); max-width: 960px; margin: 0 auto; }

/* Side panel: flat sections divided by fine lines */
.ui-aorch__panel { display: flex; flex: none; flex-direction: column; width: 360px; min-height: 0; border-left: 1px solid var(--tc-border-subtle, light-dark(#f0f0f0, rgba(255, 255, 255, 0.06))); }
.ui-aorch__panel-body { flex: 1; min-height: 0; overflow-y: auto; }
.ui-aorch__section { display: flex; flex-direction: column; padding: var(--tc-space-5, 20px); }
.ui-aorch__section + .ui-aorch__section { border-top: 1px solid var(--tc-border-subtle, light-dark(#f0f0f0, rgba(255, 255, 255, 0.06))); }
.ui-aorch__label { display: block; padding-bottom: var(--tc-space-3, 12px); font-size: var(--tc-font-size-sm-plus, 12.5px); font-weight: var(--tc-font-weight-medium, 500); line-height: var(--tc-line-height-tight, 16px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-aorch__text { margin: 0; font-size: var(--tc-font-size-md-plus, 13.5px); line-height: var(--tc-line-height-normal, 20px); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-aorch__quiet { margin: 0; font-size: var(--tc-font-size-md, 13px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-aorch__note { padding-top: var(--tc-space-2, 8px); font-size: var(--tc-font-size-sm-plus, 12.5px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }

.ui-aorch__tag {
  flex: none;
  padding: 0 var(--tc-pill-px, 8px);
  border-radius: var(--tc-pill-radius, 999px);
  background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07)));
  font-size: var(--tc-pill-font-size, 11px);
  font-weight: var(--tc-pill-font-weight, 500);
  line-height: var(--tc-pill-h, 20px);
  color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc));
}
.ui-aorch__tag[data-status="running"] { background: var(--tc-status-info-bg, light-dark(#eaf1ff, #16243f)); color: var(--tc-status-info-fg, light-dark(#2456d6, #8ab4ff)); }
.ui-aorch__tag[data-status="waiting"] { background: var(--tc-status-warning-bg, light-dark(#fff3e0, #3a2410)); color: var(--tc-status-warning-fg, light-dark(#a35200, #ffa057)); }
.ui-aorch__tag[data-status="failed"] { background: var(--tc-status-danger-bg, light-dark(#fdecea, #3b1714)); color: var(--tc-status-danger-fg, light-dark(#c2331f, #ff977d)); }
.ui-aorch__tag[data-status="done"] { background: var(--tc-status-success-bg, light-dark(#e6f6ec, #12301f)); color: var(--tc-status-success-fg, light-dark(#18794e, #3dd68c)); }

.ui-aorch__ask { display: flex; flex-direction: column; gap: var(--tc-space-3, 12px); margin-top: var(--tc-space-4, 16px); padding: var(--tc-space-3-5, 14px); border-radius: var(--tc-radius-xl, 12px); background: var(--tc-status-warning-bg, light-dark(#fff3e0, #3a2410)); }
.ui-aorch__ask[data-failed] { background: var(--tc-status-danger-bg, light-dark(#fdecea, #3b1714)); }
.ui-aorch__ask p { margin: 0; font-size: var(--tc-font-size-md, 13px); line-height: var(--tc-line-height-normal, 20px); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-aorch__actions { display: flex; gap: var(--tc-space-2, 8px); }

.ui-aorch__tasks { display: flex; flex-direction: column; gap: var(--tc-space-1, 4px); margin: 0; padding: 0; list-style: none; }
.ui-aorch__tasks li { display: flex; align-items: flex-start; gap: var(--tc-space-2-5, 10px); }
.ui-aorch__mark { display: grid; flex: none; place-items: center; width: 16px; height: 16px; margin-top: var(--tc-space-2, 8px); border-radius: 50%; box-shadow: inset 0 0 0 1.5px var(--tc-border-control, light-dark(#858585, #7c7c82)); color: var(--tc-status-success-fg, light-dark(#18794e, #3dd68c)); }
.ui-aorch__mark[data-status="done"] { box-shadow: none; }
.ui-aorch__mark[data-status="running"] { box-shadow: inset 0 0 0 1.5px var(--tc-status-info-fg, light-dark(#2456d6, #8ab4ff)); }
.ui-aorch__mark[data-status="waiting"] { box-shadow: inset 0 0 0 1.5px var(--tc-status-warning-fg, light-dark(#a35200, #ffa057)); }
.ui-aorch__mark[data-status="failed"] { box-shadow: inset 0 0 0 1.5px var(--tc-status-danger-fg, light-dark(#c2331f, #ff977d)); }
.ui-aorch__task {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  padding: var(--tc-space-1-5, 6px) var(--tc-space-2, 8px);
  border-radius: var(--tc-radius-md, 8px);
  font-size: var(--tc-font-size-md, 13px);
  line-height: var(--tc-line-height-snug, 18px);
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
  text-align: left;
}
.ui-aorch__task:hover { background: var(--tc-fill-hover, light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05))); }
.ui-aorch__task:focus-visible { outline: var(--tc-focus-outline, 2px solid light-dark(#2f68ff, #6b95ff)); outline-offset: var(--tc-focus-ring-offset, 2px); }
.ui-aorch__task small { font-size: var(--tc-font-size-sm, 12px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }

.ui-aorch__meter { height: 6px; overflow: hidden; border-radius: var(--tc-radius-full, 999px); background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07))); }
.ui-aorch__meter span { display: block; height: 100%; border-radius: inherit; background: var(--tc-status-info-fg, light-dark(#2456d6, #8ab4ff)); transition: width var(--tc-duration-base, 200ms) var(--tc-ease-standard, ease); }
.ui-aorch__meter[data-full] span { background: var(--tc-status-warning-fg, light-dark(#a35200, #ffa057)); }

.ui-aorch__details { display: grid; gap: var(--tc-space-3, 12px); margin: 0; }
.ui-aorch__details div { display: flex; align-items: center; justify-content: space-between; font-size: var(--tc-font-size-md, 13px); }
.ui-aorch__details dt { color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-aorch__details dd { margin: 0; font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); font-variant-numeric: tabular-nums; }

/* Room for the sidebar icon while the sidebar is collapsed */
.ui-aorch__main > .ui-aorch__bar { transition: padding-left var(--tc-duration-slower, 420ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)); }
.ui-as-app[data-collapsed] .ui-aorch__main > .ui-aorch__bar { padding-left: calc(var(--tc-space-12, 48px) + var(--tc-space-1, 4px)); }
.ui-aorch__scrim { display: none; }

/* Narrow panels: the side panel becomes a layer that slides in from the right */
@container ui-as-main (max-width: 1000px) {
  .ui-aorch__clock { display: none; }
  .ui-aorch__panel {
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
    animation: ui-aorch-panel-in var(--tc-duration-slower, 420ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)) both;
  }
  .ui-aorch__scrim {
    display: block;
    position: absolute;
    z-index: calc(var(--tc-z-sticky, 10) + 1);
    inset: 0;
    border-radius: inherit;
    background: var(--tc-scrim, light-dark(rgba(0, 0, 0, 0.32), rgba(0, 0, 0, 0.6)));
  }
}
@keyframes ui-aorch-panel-in { from { transform: translateX(40px); opacity: 0; } to { transform: none; opacity: 1; } }
@container ui-as (max-width: 900px) {
  .ui-aorch__main > .ui-aorch__bar { padding-left: calc(var(--tc-space-12, 48px) + var(--tc-space-1, 4px)); }
}
@container ui-as (max-width: 600px) {
  .ui-aorch__crumbs > svg, .ui-aorch__crumbs > i { display: none; }
  .ui-aorch__main .ui-aorch__stat:first-child span span { display: none; }
  .ui-aorch__scroll { padding: var(--tc-space-4, 16px); }
  .ui-aorch__panel { width: 100%; border-radius: var(--tc-app-shell-panel-radius); }
}
`;
