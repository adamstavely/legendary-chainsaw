"use client";

/*
 * Agent Lanes – where every agent is right now, as a live timeline, in a single self-contained file.
 * A soft gray tray with the summary on top and a white card below: a lane per agent (avatar, name, model on the
 * left), its tasks as blocks along the time it took, and a "now" line on the right edge. The window slides with the clock, so the picture is always the last half hour.
 *   · done tasks are quiet gray blocks, the running one grows into "now" and shimmers; tool logos lead the title
 *   · a task that waits for a person pulses amber and ends in "Needs you" – click it to Approve or Reject in place
 *   · a failed task is red; a hand-off draws a thin curve from the end of one task to the next agent's task
 *   · click any other block for a small dark tooltip with what got done; blocks slide out of the window and fade
 * The tasks are yours: pass them with start and end times (no end while running) – the component draws and moves them.
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: agent-lanes.tsx is Standard,
 * agent-lanes-clean.tsx is Clean). Clean is one white card with the summary bar inside it, above a hairline,
 * instead of the bar sitting on a soft gray tray above the card.
 */
// Generated from src/components/agent-lanes.tsx by scripts/build-lib.mjs – edit the source, not this file.

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ComponentPropsWithoutRef, type KeyboardEvent, type ReactNode, type Ref, type RefObject } from "react";

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-al";

export type LaneAgent = {
  id: string;
  name: string;
  /** Model or role, shown under the name, e.g. "Opus 5.5" */
  model?: string;
  /** A small mark – defaults to the initials on a soft tile */
  avatar?: ReactNode;
};

export type LaneTaskStatus = "done" | "running" | "waiting" | "failed";

export type LaneTask = {
  id: string;
  agentId: string;
  title: string;
  status: LaneTaskStatus;
  start: number | Date;
  /** Leave it out while the task runs or waits – it then reaches "now" */
  end?: number | Date;
  /** Id of the task another agent picked up from this one – drawn as a hand-off curve */
  handoffTo?: string;
  /** What exactly needs a decision, shown above Approve / Reject */
  ask?: string;
  /** What got done so far, a few words each – shown in a small tooltip when the block is clicked */
  summary?: string[];
  /** Small logos of the tools it works in, shown before the title – up to three */
  tools?: ReactNode[];
};

/** A decision's handler. It may return a promise: the decision waits while it runs, and if it rejects the block stays
 *  as it was and the decision says so, so you can try again */
export type LaneTaskHandler = (task: LaneTask) => void | Promise<unknown>;

type AgentLanesOwnProps = {
  /** Visual style. Defaults to the file's look: Standard in agent-lanes.tsx, Clean in agent-lanes-clean.tsx */
  look?: Look;
  agents: LaneAgent[];
  /** The tasks – always the source of truth. After Approve or Reject the block shows the result right away; as soon
   *  as you pass that task with a new status, start or end, your version wins */
  tasks: LaneTask[];
  /** How much time the lanes show, in ms (default 30 minutes) */
  span?: number;
  /** A clock you control, in epoch ms – e.g. a faster one for a demo. Without it the lanes follow real time */
  now?: number;
  /** How fast the clock runs, in clock ms per real ms: on from `now` when you pass it (default 0 – it stays where you
   *  put it), from real time otherwise (default 1). E.g. `now={start} rate={20}` for a demo 20× faster than real
   *  time, without passing a new `now` every frame */
  rate?: number;
  onApprove?: LaneTaskHandler;
  onReject?: LaneTaskHandler;
  /** Shows "Open" in a block's tooltip */
  onOpen?: (task: LaneTask) => void;
  /** Whether the timeline is held still (controlled). The lanes also hold still while the pointer or focus is on them,
   *  so nothing moves under the pointer; a Pause button in the summary bar sets this (WCAG 2.2.2) */
  paused?: boolean;
  defaultPaused?: boolean;
  onPausedChange?: (paused: boolean) => void;
  /** The id of the block whose decision or tooltip is open. Controlled when defined (null = none); otherwise the
   *  component keeps it, starting from `defaultExpanded` */
  expanded?: string | null;
  defaultExpanded?: string | null;
  onExpandedChange?: (id: string | null) => void;
  title?: string;
  className?: string;
  ref?: Ref<HTMLDivElement>;
};

export type AgentLanesProps = Omit<ComponentPropsWithoutRef<"div">, keyof AgentLanesOwnProps> & AgentLanesOwnProps;

/* ---------- Helpers ---------- */

const ms = (d: number | Date) => (typeof d === "number" ? d : d.getTime());
const MIN = 60_000;
const mins = (t: number) => {
  const m = Math.max(0, Math.round(t / MIN));
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
};
const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
const STATE: Record<LaneTaskStatus, string> = { done: "Done", running: "Running", waiting: "Needs you", failed: "Failed" };
const ROW = 48;
/** What a decision is made against: when the task you pass no longer matches it, your version wins */
const versionOf = (t: LaneTask) => `${t.status}|${ms(t.start)}|${t.end !== undefined ? ms(t.end) : ""}`;

/* ---------- Icons ---------- */

const Spark = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
    <path d="M7 1.2c.4 2.9 1.9 4.4 4.8 4.8-2.9.4-4.4 1.9-4.8 4.8C6.6 7.9 5.1 6.4 2.2 6 5.1 5.6 6.6 4.1 7 1.2Z" fill="currentColor" />
    <circle cx="11.6" cy="11.4" r="1.1" fill="currentColor" opacity="0.55" />
  </svg>
);
const FailIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
    <path d="M2.5 2.5l5 5M7.5 2.5l-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
const PauseIcon = ({ paused }: { paused: boolean }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    {paused ? <path d="M3.5 2.2v7.6L9.8 6 3.5 2.2Z" fill="currentColor" /> : <path d="M3.5 2.5v7M8.5 2.5v7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />}
  </svg>
);
const HandIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    <path d="M6 1.8 10.8 10H1.2L6 1.8Z" fill="currentColor" />
  </svg>
);

/* ---------- The clock ---------- */

/** Wall time – read only in effects, timers and handlers, never during render */
const wall = () => Date.now();

/**
 * The lanes' clock: yours (`now`, run on at `rate`) or real time. Render sees `now`, a reading taken at the last
 * discrete change; in between, `read()` gives the exact time to whatever paints pixels directly.
 */
function useLaneClock(nowProp: number | undefined, rate: number | undefined) {
  const speed = Math.max(0, rate ?? (nowProp === undefined ? 1 : 0));
  // `at` clock ms at wall ms `wall`, moving at `speed`
  const anchor = useRef({ at: nowProp ?? 0, wall: 0, speed });
  const read = useCallback(() => {
    const a = anchor.current;
    return a.at + (wall() - a.wall) * a.speed;
  }, []);
  // The reading render uses while the clock runs (0 on the server and the first render: hydration-safe)
  const [reading, setReading] = useState<{ for: number | undefined; at: number }>({ for: nowProp, at: nowProp ?? 0 });
  const lastProp = useRef<number | undefined>(undefined);
  useLayoutEffect(() => {
    const w = wall();
    // A new `now` restarts the clock from it; a new rate carries on from where the clock is
    const at = nowProp !== lastProp.current || anchor.current.wall === 0 ? (nowProp ?? w) : read();
    lastProp.current = nowProp;
    anchor.current = { at, wall: w, speed };
    if (nowProp === undefined) setReading((r) => (r.at > 0 ? r : { for: undefined, at }));
  }, [nowProp, speed, read]);
  const take = useCallback(() => setReading({ for: lastProp.current, at: read() }), [read]);
  // A `now` you just passed is the time, until the clock has been read since
  const now = nowProp !== undefined && (speed === 0 || reading.for !== nowProp) ? nowProp : reading.at;
  return { now, ready: nowProp !== undefined || reading.at > 0, speed, read, take };
}

/**
 * While the clock runs and the lanes are on screen: `paint` moves the pixels every frame (no render), and `take`
 * renders again at `nextAt` – the next moment a label changes or a block leaves the window.
 */
function useLaneMotion(rootRef: { current: HTMLElement | null }, clock: ReturnType<typeof useLaneClock>, paint: (now: number) => void, nextAt: number, held: boolean) {
  const latest = useRef(paint);
  useLayoutEffect(() => {
    latest.current = paint;
  });
  const [onScreen, setOnScreen] = useState(true);
  const { read, take } = clock;
  // Held (paused, hovered or focused): the picture stays where it is; letting go catches up with the clock
  const speed = held ? 0 : clock.speed;
  const wasHeld = useRef(held);
  useEffect(() => {
    if (wasHeld.current && !held && clock.speed > 0) take();
    wasHeld.current = held;
  }, [held, clock.speed, take]);
  useEffect(() => {
    if (speed === 0) return;
    let visible = true;
    let raf = 0;
    let last = 0;
    // Real time moves a 30-minute window by a pixel every few seconds: a quarter second is plenty; faster clocks every frame
    const gap = Math.min(250, 250 / speed);
    const frame = () => {
      raf = 0;
      if (!visible || document.hidden) return;
      const w = wall();
      if (w - last >= gap) {
        last = w;
        latest.current(read());
      }
      raf = requestAnimationFrame(frame);
    };
    const wake = () => {
      const show = visible && !document.hidden;
      setOnScreen(show);
      if (show && !raf) raf = requestAnimationFrame(frame);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      wake();
    });
    if (rootRef.current) io.observe(rootRef.current);
    document.addEventListener("visibilitychange", wake);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", wake);
    };
  }, [speed, read, rootRef]);
  // Back on screen: catch up on whatever changed meanwhile
  const wasOn = useRef(true);
  useEffect(() => {
    if (onScreen && !wasOn.current && speed > 0) take();
    wasOn.current = onScreen;
  }, [onScreen, speed, take]);
  useEffect(() => {
    if (speed === 0 || !onScreen || !Number.isFinite(nextAt)) return;
    const t = window.setTimeout(take, Math.max(0, (nextAt - read()) / speed) + 1);
    return () => window.clearTimeout(t);
  }, [nextAt, speed, onScreen, read, take]);
  return onScreen;
}

/* ---------- Pieces ---------- */

const curvePath = (x1: number, y1: number, x2: number, y2: number) => {
  const bend = Math.max(24, Math.abs(x2 - x1) / 2);
  return `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`;
};
/** Where a moment sits in the window, 0–100, as CSS: `left` is its place on the fixed timeline (see `at`), and
 *  --t is how far that timeline has slid – "now" is always 100 */
const xCss = (left: number | "now") => (left === "now" ? "100" : `min(100, ${left} - var(--t, 0))`);

type BarProps = { title: string; running: number; needs: number; span: number; canPause: boolean; paused: boolean; onPause: () => void };

function LanesBar({ title, running, needs, span, canPause, paused, onPause }: BarProps) {
  return (
    <header className="ui-al__bar">
      <span className="ui-al__spark">
        <Spark />
      </span>
      <span className="ui-al__title">{title}</span>
      <span className="ui-al__summary">
        <span data-kind="running">{running} running</span>
        {needs > 0 && <span data-kind="needs">{needs} need you</span>}
      </span>
      <span className="ui-al__window">Last {mins(span)}</span>
      {canPause && (
        // One button for both states, so focus stays on it (2.2.2)
        <button type="button" className="ui-al__pause" aria-pressed={paused} aria-label="Pause timeline" title={paused ? "Resume timeline" : "Pause timeline"} onClick={onPause}>
          <PauseIcon paused={paused} />
        </button>
      )}
    </header>
  );
}

function AgentColumn({ agents, list, lastState }: { agents: LaneAgent[]; list: LaneTask[]; lastState: Record<string, string> }) {
  return (
    <ul className="ui-al__agents">
      {agents.map((a) => {
        const busy = list.find((t) => t.agentId === a.id && (t.status === "running" || t.status === "waiting"));
        return (
          <li key={a.id} className="ui-al__agent" title={a.name}>
            <span className="ui-al__avatar" data-logo={a.avatar ? "" : undefined}>
              {a.avatar ?? initials(a.name)}
            </span>
            <span className="ui-al__who" data-state={busy?.status ?? "idle"}>
              <span className="ui-al__name-line">
                <span className="ui-al__name">{a.name}</span>
                {/* Idle or Needs you as a small tag that fades in and out */}
                <span className="ui-al__state" data-show={busy?.status === "running" ? undefined : ""} aria-hidden={busy?.status === "running"}>
                  <span>{busy?.status === "waiting" ? "Needs you" : busy ? (lastState[a.id] ?? "Idle") : "Idle"}</span>
                </span>
              </span>
              <span className="ui-al__model">{a.model && <span className="ui-al__model-name">{a.model}</span>}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

type BlockProps = {
  agent: LaneAgent;
  task: LaneTask;
  now: number;
  span: number;
  left: number;
  open: boolean;
  popId?: string;
  onToggle: (id: string | null) => void;
};

function TaskBlock({ agent, task: t, now, span, left, open, popId, onToggle }: BlockProps) {
  const live = t.end === undefined;
  const end = live ? now : ms(t.end!);
  const took = mins(end - ms(t.start));
  // A block that reaches "now" grows with the sliding timeline: its right edge is drawn from --t, not from a render
  const width = live ? `calc((var(--t, 0) + ${100 - left}) * 1%)` : `${((end - ms(t.start)) / span) * 100}%`;
  return (
    <li className="ui-al__slot" data-status={t.status} style={{ left: `${left}%`, width }}>
      <button
        type="button"
        data-task={t.id}
        className="ui-al__block"
        data-status={t.status}
        data-open={open ? "" : undefined}
        data-focus-key={t.id}
        aria-expanded={open}
        aria-controls={open ? popId : undefined}
        title={t.title}
        aria-label={`${agent.name}: ${t.title} – ${STATE[t.status]}${t.status === "done" ? `, took ${took}` : `, ${took}`}`}
        onClick={() => onToggle(open ? null : t.id)}
      >
        {t.tools && t.tools.length > 0 && (
          <span className="ui-al__tools" aria-hidden="true">
            {t.tools.slice(0, 3).map((tool, k) => (
              <span key={k} className="ui-al__tool">
                {tool}
              </span>
            ))}
          </span>
        )}
        {/* Failed is also a mark, not only red (1.4.1); running has its edge, waiting its flag */}
        {t.status === "failed" && (
          <span className="ui-al__mark" aria-hidden="true">
            <FailIcon />
          </span>
        )}
        <span className="ui-al__label">{t.title}</span>
      </button>
      {t.status === "waiting" && (
        <span className="ui-al__flag" aria-hidden="true">
          <HandIcon />
          Needs you
        </span>
      )}
    </li>
  );
}

type PopProps = {
  task: LaneTask;
  agent?: LaneAgent;
  lane: number;
  up: boolean;
  id?: string;
  now: number;
  at: (t: number) => number;
  busy: { id: string; state: "pending" | "error" } | null;
  onDecide: (t: LaneTask, ok: boolean) => void;
  onOpen?: (task: LaneTask) => void;
};

/** The open block's decision (waiting) or a small dark tooltip under (or over) the visible part of the block */
function TaskPopover({ task, agent, lane, up, id, now, at, busy, onDecide, onOpen }: PopProps) {
  const end = task.end === undefined ? now : ms(task.end);
  const endX = xCss(task.end === undefined ? "now" : at(end));
  const top = up ? lane * ROW + 6 : (lane + 1) * ROW - 6;
  if (task.status === "waiting") {
    const pending = busy?.id === task.id && busy.state === "pending";
    return (
      <div className="ui-al__pop ui-al__ask" id={id} role="dialog" aria-label={`Decide: ${task.title}`} data-up={up ? "" : undefined} style={{ top, right: `calc((100 - ${endX}) * 1%)` }}>
        <span className="ui-al__ask-title">{task.title}</span>
        {task.ask && <span className="ui-al__ask-text">{task.ask}</span>}
        {busy?.id === task.id && busy.state === "error" && (
          <span className="ui-al__error" role="alert">
            Didn't go through – try again
          </span>
        )}
        <span className="ui-al__ask-actions" aria-busy={pending ? true : undefined}>
          <button type="button" className="ui-al__btn" disabled={pending} onClick={() => onDecide(task, false)}>
            Reject
          </button>
          <button type="button" className="ui-al__btn ui-al__btn--primary" autoFocus disabled={pending} onClick={() => onDecide(task, true)}>
            Approve
          </button>
        </span>
      </div>
    );
  }
  const mid = `calc((max(0, ${xCss(at(ms(task.start)))}) + ${endX}) * 0.5%)`;
  return (
    // Not a role=tooltip: it can hold the Open button. The block's aria-expanded / aria-controls point here
    <div className="ui-al__pop ui-al__tip" id={id} role="group" aria-label={`${task.title} – details`} data-up={up ? "" : undefined} style={{ top, left: `clamp(14%, ${mid}, 86%)` }}>
      <span className="ui-al__tip-head">
        {agent?.name} · {STATE[task.status]} · {mins(end - ms(task.start))}
      </span>
      {task.summary?.length ? (
        <ul className="ui-al__tip-list">
          {task.summary.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : (
        <span className="ui-al__tip-title">{task.title}</span>
      )}
      {onOpen && (
        <button type="button" className="ui-al__tip-open" onClick={() => onOpen(task)}>
          Open
        </button>
      )}
    </div>
  );
}

/** Decisions: shown at once, reported to your handler, and waited for when it returns a promise */
function useDecisions(tasks: LaneTask[], read: () => number, close: (id: string) => void, onApprove?: LaneTaskHandler, onReject?: LaneTaskHandler) {
  const [local, setLocal] = useState<Record<string, { version: string; status: LaneTaskStatus; end?: number }>>({});
  // A decision on its way, or one that failed
  const [busy, setBusy] = useState<{ id: string; state: "pending" | "error" } | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  // A decision shows its result until the task you pass changes
  const list = useMemo(
    () =>
      tasks.map((t) => {
        const o = local[t.id];
        return o && o.version === versionOf(t) ? { ...t, status: o.status, end: o.end ?? t.end } : t;
      }),
    [tasks, local],
  );
  // Every decision is reported. A handler that returns a promise keeps the decision open (its buttons wait) until it
  // settles; a rejection leaves the block as it was, with a note
  const decide = (t: LaneTask, ok: boolean) => {
    if (busy?.state === "pending") return;
    const original = tasks.find((x) => x.id === t.id) ?? t;
    const apply = (at: number) => {
      close(t.id);
      setLocal((l) => ({ ...l, [t.id]: ok ? { version: versionOf(original), status: "running" } : { version: versionOf(original), status: "failed", end: at } }));
    };
    const handler = ok ? onApprove : onReject;
    const done = handler?.(t);
    if (done && typeof (done as Promise<unknown>).then === "function") {
      setBusy({ id: t.id, state: "pending" });
      (done as Promise<unknown>).then(
        () => {
          if (!alive.current) return;
          setBusy(null);
          apply(read());
        },
        () => alive.current && setBusy({ id: t.id, state: "error" }),
      );
      return;
    }
    setBusy(null);
    apply(read());
  };
  return { list, busy, decide };
}

export function AgentLanes({
  look,
  agents,
  tasks,
  span = 30 * MIN,
  now: nowProp,
  rate,
  onApprove,
  onReject,
  onOpen,
  paused: pausedProp,
  defaultPaused = false,
  onPausedChange,
  expanded,
  defaultExpanded = null,
  onExpandedChange,
  title = "Agents",
  className,
  ref,
  ...rest
}: AgentLanesProps) {
  const uid = useId();
  const clock = useLaneClock(nowProp, rate);
  const { now, ready } = clock;
  /** The block whose decision or tooltip is open */
  const [opened, setOpened] = useControllable<string | null>(expanded, defaultExpanded, onExpandedChange, "expanded");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const setRoot = useRootRef(rootRef, ref);
  /** Closes the decision: focus goes back to its block first, never to <body> (2.4.3) */
  const closeDecision = (id: string) => {
    const root = rootRef.current;
    rescueFocus(root?.querySelector(".ui-al__pop"), [() => root?.querySelector(`[data-task="${CSS.escape(id)}"]`)]);
    setOpened(null);
  };
  const { list, busy, decide } = useDecisions(tasks, clock.read, closeDecision, onApprove, onReject);
  const [paused, setPaused] = useControllable(pausedProp, defaultPaused, onPausedChange, "paused");
  // Held while the pointer is over the lanes or focus is inside them, so blocks and buttons never move under you
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const held = paused || hovered || focused;
  // A block that leaves while focused (or a decision that closes) hands focus to a stable place
  useFocusRescue(rootRef, {
    fallback: () => rootRef.current?.querySelector(".ui-al__block") ?? rootRef.current?.querySelector(".ui-al__pause"),
  });
  const trackRef = useRef<HTMLDivElement | null>(null);
  const from = now - span;

  /*
   * Blocks and curves sit on a fixed timeline that starts at the first render; the whole layer slides left as one
   * piece (a transform driven by --t, so it moves in sub-pixels, every frame, without a render).
   */
  const [fixedOrigin, setOrigin] = useState(nowProp);
  useLayoutEffect(() => {
    if (fixedOrigin === undefined && ready) setOrigin(now);
  }, [fixedOrigin, ready, now]);
  const origin = fixedOrigin ?? now;
  const at = (t: number) => ((t - origin) / span) * 100 + 100;
  const shiftAt = (t: number) => ((t - origin) / span) * 100;
  // Nothing is placed until the clock is known – the server and the first render draw empty lanes
  const visible = ready ? list.filter((t) => (t.end === undefined ? now : ms(t.end)) > from) : [];

  // Ticks every 5 minutes (every 10 past an hour's window), labelled relative to now
  const ticks = useMemo(() => {
    const step = span > 60 * MIN ? 15 * MIN : span > 20 * MIN ? 5 * MIN : MIN;
    const out: number[] = [];
    for (let t = span - step; t > 0; t -= step) out.push(t);
    return { step, ago: out };
  }, [span]);

  // Hand-offs: from the end of one block to the start of the next agent's block. One that leaves a running block
  // starts at "now", so the frame loop redraws it
  const row = (agentId: string) => agents.findIndex((a) => a.id === agentId);
  const curves = visible.flatMap((t) => {
    const next = t.handoffTo ? list.find((n) => n.id === t.handoffTo) : undefined;
    if (!next) return [];
    const x1 = at(t.end === undefined ? now : ms(t.end)) * 10;
    const x2 = at(ms(next.start)) * 10;
    const y1 = row(t.agentId) * ROW + ROW / 2;
    const y2 = row(next.agentId) * ROW + ROW / 2;
    if (y1 < 0 || y2 < 0) return [];
    return [{ id: `${t.id}>${next.id}`, d: curvePath(x1, y1, x2, y2), live: next.status === "running", fromNow: t.end === undefined, y1, x2, y2 }];
  });

  // Pixels between renders: slide the timeline, stretch the curves that start at "now"
  const paint = (clockNow: number) => {
    const track = trackRef.current;
    if (!track || !ready) return;
    const shift = shiftAt(clockNow);
    track.style.setProperty("--t", String(shift));
    for (const c of curves) {
      if (!c.fromNow) continue;
      track.querySelector(`path[data-curve="${CSS.escape(c.id)}"]`)?.setAttribute("d", curvePath((shift + 100) * 10, c.y1, c.x2, c.y2));
    }
  };
  // The next moment render has something new to say: a duration label rounds to the next minute, or a block leaves
  let nextAt = Infinity;
  for (const t of visible) {
    if (t.end !== undefined) nextAt = Math.min(nextAt, ms(t.end) + span);
    else nextAt = Math.min(nextAt, ms(t.start) + (Math.max(0, Math.floor((now - ms(t.start)) / MIN + 0.5)) + 0.5) * MIN);
  }
  const onScreen = useLaneMotion(rootRef, clock, paint, nextAt, held);

  // A click anywhere else closes the tooltip or decision
  useEffect(() => {
    if (!opened) return;
    const away = (e: PointerEvent) => {
      if (!(e.target as HTMLElement).closest?.(`[data-task="${CSS.escape(opened)}"], .ui-al__pop`)) setOpened(null);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [opened]); // eslint-disable-line react-hooks/exhaustive-deps -- setOpened is stable
  const openTask = visible.find((t) => t.id === opened);
  // DOM ids come from useId and the block's place, never from the task's own id
  const popId = openTask ? `${uid}-${visible.indexOf(openTask)}` : undefined;
  // The tag keeps its last word while it fades out – remembered after each commit, read during render
  const lastState = useRef<Record<string, string>>({});
  useLayoutEffect(() => {
    for (const a of agents) {
      const b = list.find((t) => t.agentId === a.id && (t.status === "running" || t.status === "waiting"));
      if (b?.status === "waiting") lastState.current[a.id] = "Needs you";
      else if (!b) lastState.current[a.id] = "Idle";
    }
  });

  const needs = list.filter((t) => t.status === "waiting").length;
  const running = list.filter((t) => t.status === "running").length;

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    rest.onKeyDown?.(e);
    if (e.key === "Escape" && opened) {
      e.stopPropagation();
      rootRef.current?.querySelector<HTMLElement>(`[data-task="${CSS.escape(opened)}"]`)?.focus();
      setOpened(null);
    }
  };

  const resolvedLook = look ?? DEFAULT_LOOK;
  // The summary bar: on the tray above the card (Standard) or inside the card, on top (Clean)
  const bar = <LanesBar title={title} running={running} needs={needs} span={span} canPause={clock.speed > 0} paused={paused} onPause={() => setPaused(!paused)} />;
  const openLane = openTask ? row(openTask.agentId) : -1;

  return (
    <div
      {...rest}
      ref={setRoot}
      className={[ROOT_CLASS, className].filter(Boolean).join(" ")}
      data-look={resolvedLook}
      // Loops stop with the timeline: paused, hovered, focused or off screen
      data-still={held || !onScreen || clock.speed === 0 ? "" : undefined}
      onKeyDown={onKeyDown}
    >
      <style href="ui-agent-lanes" precedence="default">
        {css}
      </style>

      {resolvedLook === "standard" && bar}

      <div className="ui-al__card">
        {resolvedLook === "clean" && bar}

        <div
          className="ui-al__body"
          style={{ ["--rows" as string]: agents.length }}
          onFocus={() => setFocused(true)}
          onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node | null) && setFocused(false)}
        >
          {/* Who */}
          <AgentColumn agents={agents} list={list} lastState={lastState.current} />

          {/* When */}
          <div
            ref={trackRef}
            className="ui-al__track"
            style={{ ["--t" as string]: shiftAt(now) }}
            onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
            onPointerLeave={() => setHovered(false)}
          >
            <div className="ui-al__grid" aria-hidden="true">
              {ticks.ago.map((ago) => (
                <span key={ago} className="ui-al__tick" style={{ left: `${100 - (ago / span) * 100}%` }}>
                  <span>−{mins(ago)}</span>
                </span>
              ))}
            </div>

            {/* Blocks and curves: clipped at the left edge, where they fade as they slide out */}
            <div className="ui-al__clip">
              <div className="ui-al__layer">
                <svg className="ui-al__curves" viewBox={`0 0 1000 ${agents.length * ROW}`} preserveAspectRatio="none" aria-hidden="true">
                  {curves.map((c) => (
                    <path key={c.id} d={c.d} data-curve={c.fromNow ? c.id : undefined} data-live={c.live ? "" : undefined} vectorEffect="non-scaling-stroke" />
                  ))}
                </svg>

                {agents.map((a, i) => (
                  <ul key={a.id} className="ui-al__lane" style={{ top: i * ROW }} aria-label={`${a.name}'s tasks`}>
                    {visible
                      .filter((t) => t.agentId === a.id)
                      .map((t) => (
                        <TaskBlock key={t.id} agent={a} task={t} now={now} span={span} left={at(ms(t.start))} open={opened === t.id} popId={popId} onToggle={setOpened} />
                      ))}
                  </ul>
                ))}
              </div>
            </div>

            {/* The open block's decision or tooltip – outside the clip, so it is never cut */}
            {openTask && (
              <TaskPopover
                task={openTask}
                agent={agents[openLane]}
                lane={openLane}
                up={openLane >= agents.length / 2}
                id={popId}
                now={now}
                at={at}
                busy={busy}
                onDecide={decide}
                onOpen={onOpen}
              />
            )}

            <span className="ui-al__now" aria-hidden="true">
              <span>now</span>
            </span>
          </div>
        </div>
      </div>

      <span className="ui-al__sr" aria-live="polite">
        {needs > 0 ? `${needs} task${needs === 1 ? "" : "s"} need you` : `${running} running`}
      </span>
    </div>
  );
}

const css = /* css */ `
/* Fallbacks so this file works without tokens.css – tokens.css, when loaded, takes precedence */
.ui-al:where([data-look="standard"]),
.ui-al__portal:where([data-look="standard"]) {
  --_tc-accent: #2f68ff;
  --_tc-accent-text: light-dark(#2456d6, #8ab4ff);
  --_tc-action-ghost-bg-hover: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-action-ghost-fg: light-dark(#404040, #c8c8cc);
  --_tc-action-primary-bg: light-dark(#171717, #ededed);
  --_tc-action-primary-bg-active: light-dark(#0a0a0a, #c8c8cc);
  --_tc-action-primary-bg-hover: light-dark(#262626, #ffffff);
  --_tc-action-primary-fg: light-dark(#ffffff, #111113);
  --_tc-action-primary-shadow: 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-bg: light-dark(#ffffff, #232326);
  --_tc-action-secondary-fg: light-dark(#171717, #ededed);
  --_tc-action-secondary-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-shadow-hover: 0 0 0 1px light-dark(#dedede, #3a3a40), 0 6px 16px -8px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-avatar-font-size: 9px;
  --_tc-avatar-font-weight: 600;
  --_tc-avatar-md: 24px;
  --_tc-avatar-radius-agent: 6px;
  --_tc-border-default: light-dark(#ececec, #2a2a2e);
  --_tc-border-selected: light-dark(#2f68ff, #6b95ff);
  --_tc-card-radius: 16px;
  --_tc-card-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-md: 32px;
  --_tc-control-h-sm: 28px;
  --_tc-control-px-md: 12px;
  --_tc-control-radius-md: 10px;
  --_tc-control-radius-sm: 8px;
  --_tc-divider: light-dark(#ececec, #2a2a2e);
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-reveal-slow: 900ms;
  --_tc-duration-shimmer: 1600ms;
  --_tc-duration-slow: 320ms;
  --_tc-ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-fill-selected: light-dark(rgba(47, 107, 255, 0.08), rgba(91, 154, 255, 0.14));
  --_tc-focus-outline: 2px solid light-dark(#2f68ff, #6b95ff);
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-2xs: 10px;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-xs: 11px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-semibold: 600;
  --_tc-hairline: 1px;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-snug: 18px;
  --_tc-line-height-tight: 16px;
  --_tc-menu-bg: light-dark(#ffffff, #232326);
  --_tc-menu-radius: 12px;
  --_tc-menu-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 16px 36px -12px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-pill-font-size: 11px;
  --_tc-pill-font-size-lg: 12px;
  --_tc-pill-font-weight: 500;
  --_tc-pill-h-lg: 22px;
  --_tc-pill-px-lg: 10px;
  --_tc-pill-radius: 999px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xs: 4px;
  --_tc-shadow-overlay: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 16px 36px -12px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-shadow-raised: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-shimmer: light-dark(rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.28));
  --_tc-status-danger-bg: light-dark(#fdecea, #3b1714);
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-warning-bg: light-dark(#fff3e0, #3a2410);
  --_tc-status-warning-fg: light-dark(#a35200, #ffa057);
  --_tc-surface-raised: light-dark(#ffffff, #19191b);
  --_tc-surface-sunken: light-dark(#f0f0f0, #111113);
  --_tc-text-muted: light-dark(#646464, #9a9aa1);
  --_tc-text-primary: light-dark(#171717, #ededed);
  --_tc-text-secondary: light-dark(#404040, #c8c8cc);
  --_tc-text-strong: light-dark(#171717, #f5f5f5);
  --_tc-tooltip-bg: light-dark(#171717, #ededed);
  --_tc-tooltip-fg: light-dark(#ffffff, #111113);
  --_tc-tooltip-font-size: 12px;
  --_tc-tooltip-px: 8px;
  --_tc-tooltip-py: 4px;
  --_tc-tooltip-radius: 6px;
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(16px + 4px);
}
.ui-al:where([data-look="clean"]),
.ui-al__portal:where([data-look="clean"]) {
  --_tc-accent: light-dark(#0060e2, #1a6cf0);
  --_tc-accent-text: light-dark(#0058cf, #70b8ff);
  --_tc-action-ghost-bg-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-action-ghost-fg: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-action-primary-bg: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.92));
  --_tc-action-primary-bg-active: light-dark(rgba(0, 0, 0, 0.94), rgba(255, 255, 255, 0.74));
  --_tc-action-primary-bg-hover: light-dark(rgba(0, 0, 0, 0.8), rgba(255, 255, 255, 0.82));
  --_tc-action-primary-fg: light-dark(#fcfcfc, #161618);
  --_tc-action-primary-shadow: none;
  --_tc-action-secondary-bg: light-dark(#ffffff, #252527);
  --_tc-action-secondary-fg: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-action-secondary-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-shadow-hover: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 3px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-avatar-font-size: 9px;
  --_tc-avatar-font-weight: 500;
  --_tc-avatar-md: 24px;
  --_tc-avatar-radius-agent: 6px;
  --_tc-border-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-border-selected: light-dark(#0060e2, #5b9aff);
  --_tc-card-radius: 10px;
  --_tc-card-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-md: 28px;
  --_tc-control-h-sm: 24px;
  --_tc-control-px-md: 10px;
  --_tc-control-radius-md: 6px;
  --_tc-control-radius-sm: 6px;
  --_tc-divider: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-reveal-slow: 900ms;
  --_tc-duration-shimmer: 1600ms;
  --_tc-duration-slow: 320ms;
  --_tc-ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-fill-selected: light-dark(rgba(0, 96, 226, 0.06), rgba(77, 141, 255, 0.14));
  --_tc-focus-outline: 2px solid light-dark(#0060e2, #5b9aff);
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-2xs: 10px;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-xs: 11px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-semibold: 600;
  --_tc-hairline: 0.5px;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-snug: 18px;
  --_tc-line-height-tight: 16px;
  --_tc-menu-bg: light-dark(#ffffff, #252527);
  --_tc-menu-radius: 10px;
  --_tc-menu-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 12px 28px -10px light-dark(rgba(0, 0, 0, 0.16), rgba(0, 0, 0, 0.6)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-pill-font-size: 11px;
  --_tc-pill-font-size-lg: 12px;
  --_tc-pill-font-weight: 500;
  --_tc-pill-h-lg: 20px;
  --_tc-pill-px-lg: 8px;
  --_tc-pill-radius: 5px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xs: 4px;
  --_tc-shadow-overlay: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 12px 28px -10px light-dark(rgba(0, 0, 0, 0.16), rgba(0, 0, 0, 0.6)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-shadow-raised: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-shimmer: light-dark(rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.3));
  --_tc-status-danger-bg: light-dark(rgba(245, 43, 0, 0.094), rgba(255, 53, 35, 0.17));
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-warning-bg: light-dark(rgba(255, 156, 0, 0.16), rgba(251, 106, 0, 0.15));
  --_tc-status-warning-fg: light-dark(#a35200, #ffa057);
  --_tc-surface-raised: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-sunken: light-dark(#f7f7f7, #161618);
  --_tc-text-muted: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52));
  --_tc-text-primary: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-text-secondary: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-text-strong: light-dark(#000000, #ffffff);
  --_tc-tooltip-bg: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.92));
  --_tc-tooltip-fg: light-dark(#fcfcfc, #161618);
  --_tc-tooltip-font-size: 12px;
  --_tc-tooltip-px: 8px;
  --_tc-tooltip-py: 4px;
  --_tc-tooltip-radius: 6px;
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(10px + 4px);
}
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

/* Colors and motion as variables – override them on .ui-al */
:where([data-look="standard"], [data-look="standard"] *).ui-al {
  /* The running block: a blue tint, its text and its leading edge */
  --tc-agent-lanes-run-bg: light-dark(rgba(47, 107, 255, 0.1), #0077ff3a);
  --tc-agent-lanes-run-fg: light-dark(#2f6bff, #70b8ff);
  --tc-agent-lanes-run-edge: light-dark(rgba(47, 107, 255, 0.55), rgba(112, 184, 255, 0.6));
  /* The curves that link a hand-off to the lane it starts */
  --tc-agent-lanes-rail: light-dark(#c4c4c8, rgba(255, 255, 255, 0.2));
  --tc-agent-lanes-row: ${ROW}px;
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 760px;
  /* The tray recipe: the summary on the tray, the lanes on the card */
  padding: var(--tc-tray-inset, var(--_tc-tray-inset));
  border-radius: var(--tc-tray-radius, var(--_tc-tray-radius));
  background: var(--tc-surface-sunken, var(--_tc-surface-sunken));
  container-type: inline-size;
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  letter-spacing: -0.006em;
  color: var(--tc-text-muted, var(--_tc-text-muted));
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on .ui-al */
:where([data-look="clean"], [data-look="clean"] *).ui-al {
  /* The running block: a blue tint, its text and its leading edge (after the Radix scales) */
  --tc-agent-lanes-run-bg: light-dark(#008ff519, #0077ff3a);
  --tc-agent-lanes-run-fg: light-dark(#006dcbf2, #70b8ff);
  --tc-agent-lanes-run-edge: light-dark(rgba(0, 96, 226, 0.5), rgba(112, 184, 255, 0.6));
  /* The curves that link a hand-off to the lane it starts */
  --tc-agent-lanes-rail: light-dark(rgba(0, 0, 0, 0.15), rgba(255, 255, 255, 0.2));
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  --tc-agent-lanes-row: ${ROW}px;
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 760px;
  container-type: inline-size;
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
.ui-al *, .ui-al *::before, .ui-al *::after { box-sizing: border-box; }
:where(.ui-al) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.ui-al button:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: 1px; }
.ui-al ul { margin: 0; padding: 0; list-style: none; }
.ui-al svg { display: block; flex: none; }
.ui-al__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* The white card holds the lanes */
.ui-al__card { border-radius: var(--tc-card-radius, var(--_tc-card-radius)); background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow)); }
/* ----- Bar ----- */
/* ----- On the tray: what is going on ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-al__bar { display: flex; align-items: center; gap: 10px; min-width: 0; padding: 10px 10px 12px 14px; }
/* One white card – the edge is a shadow, not a border */
/* ----- Bar ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-al__bar { display: flex; align-items: center; gap: 10px; min-width: 0; padding: 14px 16px; border-bottom: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider)); }
.ui-al__spark { display: grid; flex: none; place-items: center; width: 16px; color: var(--tc-accent, var(--_tc-accent)); }
:where([data-look="standard"], [data-look="standard"] *).ui-al__title { font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold)); color: var(--tc-text-strong, var(--_tc-text-strong)); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-al__title { font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-strong, var(--_tc-text-strong)); white-space: nowrap; }
.ui-al__summary { display: flex; flex: 1; gap: 12px; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; }
.ui-al__summary span { display: inline-flex; align-items: center; gap: 6px; }
.ui-al__summary span::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--tc-agent-lanes-run-fg); }
.ui-al__summary [data-kind="needs"] { color: var(--tc-status-warning-fg, var(--_tc-status-warning-fg)); }
.ui-al__summary [data-kind="needs"]::before { background: var(--tc-status-warning-fg, var(--_tc-status-warning-fg)); animation: ui-al-pulse var(--tc-duration-shimmer, var(--_tc-duration-shimmer)) var(--tc-ease-in-out, var(--_tc-ease-in-out)) infinite; }
:where([data-look="standard"], [data-look="standard"] *).ui-al__window { display: inline-flex; flex: none; align-items: center; height: var(--tc-pill-h-lg, var(--_tc-pill-h-lg)); padding: 0 var(--tc-pill-px-lg, var(--_tc-pill-px-lg)); border-radius: var(--tc-pill-radius, var(--_tc-pill-radius)); background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)); font-size: var(--tc-pill-font-size-lg, var(--_tc-pill-font-size-lg)); font-weight: var(--tc-pill-font-weight, var(--_tc-pill-font-weight)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-al__window { display: inline-flex; flex: none; align-items: center; height: var(--tc-pill-h-lg, var(--_tc-pill-h-lg)); padding: 0 var(--tc-pill-px-lg, var(--_tc-pill-px-lg)); border-radius: var(--tc-pill-radius, var(--_tc-pill-radius)); background: var(--tc-fill-default, var(--_tc-fill-default)); font-size: var(--tc-pill-font-size-lg, var(--_tc-pill-font-size-lg)); font-weight: var(--tc-pill-font-weight, var(--_tc-pill-font-weight)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
/* Pause: a square ghost icon button at the end of the bar */
.ui-al__pause { display: grid; flex: none; place-items: center; width: var(--tc-control-h-sm, var(--_tc-control-h-sm)); height: var(--tc-control-h-sm, var(--_tc-control-h-sm)); margin: -2px 0; border-radius: var(--tc-control-radius-sm, var(--_tc-control-radius-sm)); color: var(--tc-action-ghost-fg, var(--_tc-action-ghost-fg)); transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-al__pause:hover { background: var(--tc-action-ghost-bg-hover, var(--_tc-action-ghost-bg-hover)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
.ui-al__pause[aria-pressed="true"] { background: var(--tc-fill-selected, var(--_tc-fill-selected)); box-shadow: inset 0 0 0 1px var(--tc-border-selected, var(--_tc-border-selected)); color: var(--tc-accent-text, var(--_tc-accent-text)); }
/* ----- Lanes ----- */
.ui-al__body { display: grid; grid-template-columns: 168px minmax(0, 1fr); padding: 26px 16px 12px 0; }
.ui-al__agents { display: grid; grid-auto-rows: var(--tc-agent-lanes-row); }
.ui-al__agent { display: flex; align-items: center; gap: 10px; min-width: 0; padding: 0 12px 0 16px; }
:where([data-look="standard"], [data-look="standard"] *).ui-al__avatar { color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-al__avatar { color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
/* Agents are rounded squares (people would be circles) – the avatar pattern */
.ui-al__avatar { display: grid; flex: none; place-items: center; width: var(--tc-avatar-md, var(--_tc-avatar-md)); height: var(--tc-avatar-md, var(--_tc-avatar-md)); overflow: hidden; border-radius: var(--tc-avatar-radius-agent, var(--_tc-avatar-radius-agent)); background: var(--tc-fill-default, var(--_tc-fill-default)); font-size: var(--tc-avatar-font-size, var(--_tc-avatar-font-size)); font-weight: var(--tc-avatar-font-weight, var(--_tc-avatar-font-weight)); letter-spacing: 0.3px; }
/* A logo sits on a small white tile */
.ui-al__avatar[data-logo] { background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)); }
.ui-al__avatar > svg { width: 14px; height: 14px; }
.ui-al__who { display: grid; min-width: 0; }
.ui-al__name { overflow: hidden; font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-primary, var(--_tc-text-primary)); white-space: nowrap; text-overflow: ellipsis; }
.ui-al__name-line { display: flex; align-items: center; min-width: 0; }
.ui-al__model { display: flex; align-items: center; min-width: 0; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; }
.ui-al__model-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
/* The state tag: collapses to nothing while the agent works, fades in when it is free or waits */
.ui-al__state { display: inline-grid; flex: none; grid-template-columns: 0fr; margin-left: 0; opacity: 0; transition: grid-template-columns var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)), margin-left var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)), opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-al__state[data-show] { grid-template-columns: 1fr; margin-left: 6px; opacity: 1; transition: grid-template-columns var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)), margin-left var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)), opacity var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)) var(--tc-duration-instant, var(--_tc-duration-instant)); }
:where([data-look="standard"], [data-look="standard"] *).ui-al__state > span { color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-al__state > span { color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
.ui-al__state > span { min-width: 0; overflow: hidden; padding: 0 5px; border-radius: var(--tc-pill-radius, var(--_tc-pill-radius)); background: var(--tc-fill-default, var(--_tc-fill-default)); font-size: var(--tc-pill-font-size, var(--_tc-pill-font-size)); font-weight: var(--tc-pill-font-weight, var(--_tc-pill-font-weight)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); white-space: nowrap; }
.ui-al__who[data-state="waiting"] .ui-al__state > span { background: var(--tc-status-warning-bg, var(--_tc-status-warning-bg)); color: var(--tc-status-warning-fg, var(--_tc-status-warning-fg)); }
.ui-al__track { position: relative; height: calc(var(--rows) * var(--tc-agent-lanes-row)); }
/* Quiet lane separators and time ticks */
.ui-al__track::before { content: ""; position: absolute; inset: 0; background: repeating-linear-gradient(to bottom, transparent 0, transparent calc(var(--tc-agent-lanes-row) - 0.5px), var(--tc-border-default, var(--_tc-border-default)) calc(var(--tc-agent-lanes-row) - 0.5px), var(--tc-border-default, var(--_tc-border-default)) var(--tc-agent-lanes-row)); pointer-events: none; }
.ui-al__grid { position: absolute; inset: 0; pointer-events: none; }
.ui-al__tick { position: absolute; top: 0; bottom: 0; width: 0; border-left: 0.5px dashed var(--tc-border-default, var(--_tc-border-default)); }
.ui-al__tick > span { position: absolute; bottom: 100%; left: 0; margin-bottom: 6px; font-size: var(--tc-font-size-xs, var(--_tc-font-size-xs)); line-height: 14px; color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; transform: translateX(-50%); font-variant-numeric: tabular-nums; }
.ui-al__clip { position: absolute; inset: 0; overflow: hidden; -webkit-mask-image: linear-gradient(to right, transparent 0, #000 40px); mask-image: linear-gradient(to right, transparent 0, #000 40px); }
.ui-al__layer { position: absolute; inset: 0; transform: translateX(calc(var(--t, 0) * -1%)); will-change: transform; }
.ui-al__curves { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
.ui-al__curves path { fill: none; stroke: var(--tc-agent-lanes-rail); stroke-width: 1; stroke-dasharray: 3 3; }
.ui-al__curves path[data-live] { stroke: var(--tc-agent-lanes-run-edge); animation: ui-al-flow var(--tc-duration-reveal-slow, var(--_tc-duration-reveal-slow)) linear infinite; }
.ui-al__lane { position: absolute; left: 0; right: 0; height: var(--tc-agent-lanes-row); }
/* At least 24px wide, so even a short task is a usable target (2.5.8) */
.ui-al__slot { position: absolute; top: 10px; bottom: 10px; min-width: 24px; }
/* Running and waiting blocks grow out of "now" from nothing, so they never poke past it */
.ui-al__slot:is([data-status="running"], [data-status="waiting"]), .ui-al__slot:is([data-status="running"], [data-status="waiting"]) .ui-al__block { min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-al__block { display: flex; align-items: center; width: 100%; height: 100%; min-width: 24px; padding: 0 10px; overflow: hidden; border-radius: var(--tc-radius-md, var(--_tc-radius-md)); background: var(--tc-fill-default, var(--_tc-fill-default)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; transition: background-color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-al__block { display: flex; align-items: center; width: 100%; height: 100%; min-width: 24px; padding: 0 8px; overflow: hidden; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); background: var(--tc-fill-default, var(--_tc-fill-default)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); white-space: nowrap; transition: background-color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-al__label { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.ui-al__mark { display: grid; flex: none; place-items: center; margin-right: 4px; }
/* Tools: the plain logos side by side, before the title */
.ui-al__tools { display: flex; flex: none; gap: 4px; margin-right: 6px; }
.ui-al__tool { display: grid; place-items: center; width: 12px; height: 12px; }
.ui-al__tool > svg { width: 12px; height: 12px; }
.ui-al__block:hover { background: var(--tc-fill-default, var(--_tc-fill-default)); }
.ui-al__block[data-status="running"] { position: relative; background: var(--tc-agent-lanes-run-bg); color: var(--tc-agent-lanes-run-fg); box-shadow: inset -2px 0 0 var(--tc-agent-lanes-run-edge); }
/* The running sheen: a band that moves on transform, a few passes and then rests (2.2.2); it pauses with the timeline */
.ui-al__block[data-status="running"]::after { content: ""; position: absolute; inset: 0 auto 0 0; width: 50%; background: linear-gradient(90deg, transparent 0%, var(--tc-shimmer, var(--_tc-shimmer)) 50%, transparent 100%); opacity: 0.7; transform: translateX(-100%); animation: ui-al-shimmer var(--tc-duration-shimmer, var(--_tc-duration-shimmer)) var(--tc-ease-in-out, var(--_tc-ease-in-out)) 3; }
.ui-al__block[data-status="waiting"] { background: var(--tc-status-warning-bg, var(--_tc-status-warning-bg)); color: var(--tc-status-warning-fg, var(--_tc-status-warning-fg)); }
.ui-al__block[data-status="failed"] { background: var(--tc-status-danger-bg, var(--_tc-status-danger-bg)); color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
.ui-al__block[data-open] { filter: brightness(0.97); }
/* Needs you: a small flag inside the block's end, where it meets "now" */
.ui-al__flag { position: absolute; top: 50%; right: 4px; display: inline-flex; align-items: center; gap: 4px; padding: 0 6px; border-radius: var(--tc-radius-xs, var(--_tc-radius-xs)); background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)); font-size: var(--tc-font-size-xs, var(--_tc-font-size-xs)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug)); color: var(--tc-status-warning-fg, var(--_tc-status-warning-fg)); white-space: nowrap; transform: translateY(-50%); pointer-events: none; animation: ui-al-pulse var(--tc-duration-shimmer, var(--_tc-duration-shimmer)) var(--tc-ease-in-out, var(--_tc-ease-in-out)) infinite; }
.ui-al__slot:has(.ui-al__block[data-status="waiting"]) { z-index: 2; }
.ui-al__pop { position: absolute; z-index: 5; animation: ui-al-in var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)) both; }
.ui-al__pop[data-up] { transform: translateY(-100%); animation-name: ui-al-in-up; }
/* Decide in place */
:where([data-look="standard"], [data-look="standard"] *).ui-al__ask { display: grid; gap: 2px; width: 290px; padding: 14px; border-radius: var(--tc-menu-radius, var(--_tc-menu-radius)); background: var(--tc-menu-bg, var(--_tc-menu-bg)); box-shadow: var(--tc-menu-shadow, var(--_tc-menu-shadow)); }
/* Decide in place */
:where([data-look="clean"], [data-look="clean"] *).ui-al__ask { display: grid; gap: 2px; width: 280px; padding: 12px; border-radius: var(--tc-menu-radius, var(--_tc-menu-radius)); background: var(--tc-menu-bg, var(--_tc-menu-bg)); box-shadow: var(--tc-menu-shadow, var(--_tc-menu-shadow)); }
/* What got done: the tooltip pattern – ink in light, light in dark, from the tokens */
.ui-al__tip { --tc-agent-lanes-tip-soft: color-mix(in srgb, var(--tc-tooltip-fg, var(--_tc-tooltip-fg)) 68%, transparent); display: grid; gap: 4px; width: max-content; max-width: 230px; padding: calc(var(--tc-tooltip-py, var(--_tc-tooltip-py)) * 2) calc(var(--tc-tooltip-px, var(--_tc-tooltip-px)) + 2px); border-radius: var(--tc-tooltip-radius, var(--_tc-tooltip-radius)); background: var(--tc-tooltip-bg, var(--_tc-tooltip-bg)); box-shadow: var(--tc-shadow-overlay, var(--_tc-shadow-overlay)); font-size: var(--tc-tooltip-font-size, var(--_tc-tooltip-font-size)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-tooltip-fg, var(--_tc-tooltip-fg)); translate: -50% 0; }
.ui-al__tip-head { font-size: var(--tc-font-size-xs, var(--_tc-font-size-xs)); color: var(--tc-agent-lanes-tip-soft); white-space: nowrap; }
.ui-al__tip-title { color: var(--tc-tooltip-fg, var(--_tc-tooltip-fg)); }
.ui-al__tip-list { display: grid; gap: 2px; }
.ui-al__tip-list li { position: relative; padding-left: 10px; }
:where([data-look="standard"], [data-look="standard"] *).ui-al__tip-list li::before { content: ""; position: absolute; top: 7px; left: 1px; width: 3px; height: 3px; border-radius: 50%; background: var(--tc-agent-lanes-tip-soft); }
.ui-al__tip-open { justify-self: start; min-height: 24px; margin-top: 2px; font-size: var(--tc-tooltip-font-size, var(--_tc-tooltip-font-size)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-tooltip-fg, var(--_tc-tooltip-fg)); text-decoration: underline; text-decoration-color: var(--tc-agent-lanes-tip-soft); text-underline-offset: 2px; }
.ui-al__ask-title { font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-strong, var(--_tc-text-strong)); }
:where([data-look="standard"], [data-look="standard"] *).ui-al__ask-text { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-al__ask-text { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
.ui-al__ask-actions { display: flex; justify-content: flex-end; gap: 6px; margin-top: 8px; }
.ui-al__ask-actions[aria-busy] .ui-al__btn { opacity: 0.6; cursor: progress; }
.ui-al__error { display: block; margin-top: 6px; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
:where([data-look="standard"], [data-look="standard"] *)/* Reject / Approve: secondary and primary actions, exactly like Button */
.ui-al__btn { display: inline-flex; align-items: center; height: var(--tc-control-h-md, var(--_tc-control-h-md)); padding: 0 var(--tc-control-px-md, var(--_tc-control-px-md)); border-radius: var(--tc-control-radius-md, var(--_tc-control-radius-md)); background: var(--tc-action-secondary-bg, var(--_tc-action-secondary-bg)); box-shadow: var(--tc-action-secondary-shadow, var(--_tc-action-secondary-shadow)); font-size: var(--tc-control-font-size, var(--_tc-control-font-size)); font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight)); color: var(--tc-action-secondary-fg, var(--_tc-action-secondary-fg)); transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-al__btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover, var(--_tc-action-secondary-shadow-hover)); }
.ui-al__btn--primary { background: var(--tc-action-primary-bg, var(--_tc-action-primary-bg)); box-shadow: var(--tc-action-primary-shadow, var(--_tc-action-primary-shadow)); color: var(--tc-action-primary-fg, var(--_tc-action-primary-fg)); }
.ui-al__btn--primary:hover { background: var(--tc-action-primary-bg-hover, var(--_tc-action-primary-bg-hover)); box-shadow: var(--tc-action-primary-shadow, var(--_tc-action-primary-shadow)); }
.ui-al__btn--primary:active { background: var(--tc-action-primary-bg-active, var(--_tc-action-primary-bg-active)); }
/* Now: a small label over the right edge, where running work meets the clock */
.ui-al__now { position: absolute; top: -6px; right: 0; width: 0; pointer-events: none; }
.ui-al__now > span { position: absolute; bottom: 100%; right: 0; padding: 0 5px; border-radius: var(--tc-radius-xs, var(--_tc-radius-xs)); background: var(--tc-agent-lanes-run-bg); font-size: var(--tc-font-size-2xs, var(--_tc-font-size-2xs)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: 14px; color: var(--tc-agent-lanes-run-fg); }
@keyframes ui-al-pulse { 50% { opacity: 0.55; } }
@keyframes ui-al-shimmer { from { transform: translateX(-100%); } to { transform: translateX(200%); } }
/* Held still (paused, hovered, focused, off screen): every loop rests too */
.ui-al[data-still] *, .ui-al[data-still] *::before, .ui-al[data-still] *::after { animation-play-state: paused !important; }
@keyframes ui-al-flow { to { stroke-dashoffset: -6; } }
@keyframes ui-al-in { from { opacity: 0; transform: translateY(-3px); } }
@keyframes ui-al-in-up { from { opacity: 0; transform: translateY(calc(-100% + 3px)); } to { transform: translateY(-100%); } }
/* Narrow containers: the names column shrinks to the avatars */
@container (max-width: 520px) {
  .ui-al__body { grid-template-columns: 48px minmax(0, 1fr); }
  /* The names stay for screen readers (and as the row's title); the initials show who it is */
  .ui-al__who { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  .ui-al__summary [data-kind="running"] { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-al *, .ui-al *::before, .ui-al *::after { animation: none !important; transition: none !important; }
}
`;

/* ---------- Shared helpers (inlined from src/internal) ---------- */

// Written as the literal `process.env.NODE_ENV` so bundlers replace it and production builds skip the warning;
// without a bundler `process` doesn't exist and the warning stays off
declare const process: { env: { NODE_ENV?: string } };
const DEV = (() => {
  try {
    return process.env.NODE_ENV !== "production";
  } catch {
    return false;
  }
})();

/**
 * State that a parent may control. `value` defined → controlled: the component shows `value` and only asks for
 * changes through `onChange`. `value` undefined → uncontrolled: the component keeps its own state, starting at
 * `defaultValue`, and still reports changes. Whether `onChange` is passed never decides which – passing a callback
 * for analytics must not freeze the component.
 */
function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (next: T) => void, name?: string) {
  const controlled = value !== undefined;
  // Like React's <input value> without onChange: a controlled value nobody can change is almost always a
  // starting value passed to the wrong prop, so say so once (in development)
  const warned = useRef(false);
  if (controlled && !onChange && !warned.current && DEV) {
    warned.current = true;
    console.warn(
      `Trenchcoat: ${name ? `\`${name}\`` : "a value prop"} is set without its change handler, so it can't change. ` +
        "Pass the handler to control it, or use the default… prop for a starting value.",
    );
  }
  const [own, setOwn] = useState(defaultValue);
  const current = controlled ? value : own;
  // Read through refs so the setter is stable and never acts on a stale value
  const latest = useRef(current);
  latest.current = current;
  const report = useRef(onChange);
  report.current = onChange;
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved = typeof next === "function" ? (next as (prev: T) => T)(latest.current) : next;
      if (Object.is(resolved, latest.current)) return;
      if (!controlled) setOwn(resolved);
      latest.current = resolved;
      report.current?.(resolved);
    },
    [controlled],
  );
  return [current, set] as const;
}

/** Connected, not inside something inert or hidden, not disabled */
const focusable = (el: Element | null | undefined): boolean =>
  !!el && el.isConnected && el instanceof HTMLElement && !el.closest("[inert],[hidden]") && !(el as HTMLButtonElement).disabled;

/**
 * Moves focus to the first usable target, but only if focus is inside `from` now (call it before removing, disabling
 * or inerting `from`). Targets may be elements, selectors (looked up inside `within`, default document) or functions.
 */
function rescueFocus(
  from: Element | null | undefined,
  targets: Array<Element | string | null | undefined | (() => Element | null | undefined)>,
  within: ParentNode = document,
) {
  const active = document.activeElement;
  if (!from || !active || !from.contains(active)) return false;
  for (const t of targets) {
    const el = typeof t === "function" ? t() : typeof t === "string" ? within.querySelector(t) : t;
    if (el !== active && focusable(el)) {
      (el as HTMLElement).focus({ preventScroll: true });
      return true;
    }
  }
  return false;
}

type Options = {
  /** Where focus goes when the control it was on is gone – gets that control's `data-focus-key` (if it had one) */
  fallback?: (key: string | null) => Element | null | undefined;
};

/**
 * Safety net for a component's root: when the focused element inside it is removed, disabled or made inert and
 * focus fell to <body>, focus moves (before paint) to
 *   1. an element with the same `data-focus-key` (the control was re-mounted, e.g. a card moved to another list),
 *   2. `fallback(key)`, e.g. the next row or the trigger,
 *   3. the root itself (made focusable with tabindex=-1 if it isn't).
 * Prefer moving focus explicitly with rescueFocus where the right target is known; this catches the rest.
 */
function useFocusRescue(root: RefObject<HTMLElement | null>, options: Options = {}) {
  const latest = useRef(options);
  latest.current = options;
  useEffect(() => {
    const el = root.current;
    if (!el || typeof MutationObserver !== "function") return;
    let last: HTMLElement | null = null;
    const onFocusIn = (e: FocusEvent) => {
      last = e.target instanceof HTMLElement ? e.target : null;
    };
    const check = () => {
      const prev = last;
      if (!prev || !el.isConnected) return;
      const gone = !focusable(prev);
      const active = document.activeElement;
      const lost = !active || active === document.body || active === prev;
      if (!lost || !gone) return;
      const key = prev.getAttribute("data-focus-key");
      const same = key ? [...el.querySelectorAll(`[data-focus-key="${CSS.escape(key)}"]`)].find((c) => c !== prev && focusable(c)) : null;
      const target = [same, latest.current.fallback?.(key)].find(focusable) as HTMLElement | undefined;
      last = null;
      if (target) target.focus({ preventScroll: true });
      else {
        if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
        el.focus({ preventScroll: true });
      }
    };
    const observer = new MutationObserver(check);
    observer.observe(el, { subtree: true, childList: true, attributes: true, attributeFilter: ["disabled", "inert", "hidden"] });
    el.addEventListener("focusin", onFocusIn);
    return () => {
      observer.disconnect();
      el.removeEventListener("focusin", onFocusIn);
    };
  }, [root]);
}

/** A ref callback that fills `own` and the caller's ref (object or callback, incl. React 19 cleanups) */
function useRootRef<T>(own: { current: T | null }, ref: Ref<T> | undefined) {
  return useCallback(
    (el: T | null) => {
      own.current = el;
      const cleanup = typeof ref === "function" ? ref(el) : (ref && (ref.current = el), undefined);
      return () => {
        own.current = null;
        if (typeof cleanup === "function") cleanup();
        else if (typeof ref === "function") ref(null);
        else if (ref) ref.current = null;
      };
    },
    [own, ref],
  );
}
