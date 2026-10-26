"use client";

/*
 * Agent Inbox – every background task your agents are working on, as a calm board, in a single self-contained file.
 * On a soft gray tray, tasks sit in three columns – Needs you, Running, Done – as white cards: a status glyph and the title,
 * two lines on what the agent is doing, and a quiet footer with the state ("Waiting for you", "Running · 2m 14s")
 * and how many tools and sources it used.
 *   · click a card and it unfolds in place: the last steps as a tiny timeline, and what you can do now –
 *     Approve / Reject when it waits, Retry when it failed, Open when it runs or is done
 *   · a card that changes state shows it in place first, then glides over to its new column
 *   · Board / List switches the layout; narrow containers always get the list
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: agent-inbox.tsx is Standard,
 * agent-inbox-clean.tsx is Clean). Clean drops the gray tray: the columns themselves are soft gray, the bar sits
 * above them without a background, and the bar has no action button (`action` is Standard only).
 */
// Generated from src/components/agent-inbox.tsx by scripts/build-lib.mjs – edit the source, not this file.

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ComponentPropsWithoutRef, type KeyboardEvent, type Ref, type RefObject } from "react";

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-ai";

export type AgentTaskStatus = "running" | "waiting" | "done" | "failed";

export type AgentTaskStep = {
  label: string;
  /** Ready-to-show time, e.g. "2m ago" or "14:02" */
  time?: string;
};

export type AgentTask = {
  id: string;
  title: string;
  /** One or two sentences on what the task is about or where it stands */
  description?: string;
  /** Name of the agent or model, e.g. "Opus 5.5" */
  agent: string;
  status: AgentTaskStatus;
  /** When the task started – the clock ticks from here while it runs or waits */
  startedAt?: number | Date;
  /** How long it took in ms – shown for done and failed tasks */
  elapsed?: number;
  /** Tool calls so far – shown with a small wrench */
  tools?: number;
  /** Sources or files read – shown with a small magnifier */
  sources?: number;
  /** What the agent did so far, oldest first – the last four are shown when the card is open */
  steps?: AgentTaskStep[];
};

export type AgentInboxView = "board" | "list";

/** A decision's handler. It may return a promise: the card's buttons wait while it runs, and if it rejects the card
 *  stays as it was and says so, so you can try again */
export type AgentTaskHandler = (task: AgentTask) => void | Promise<unknown>;

type AgentInboxOwnProps = {
  /** Visual style. Defaults to the file's look: Standard in agent-inbox.tsx, Clean in agent-inbox-clean.tsx */
  look?: Look;
  /** The tasks – always the source of truth. After Approve, Reject or Retry the card shows the result right away;
   *  as soon as you pass that task with a new status (or steps, start or elapsed time), your version wins */
  tasks: AgentTask[];
  onApprove?: AgentTaskHandler;
  onReject?: AgentTaskHandler;
  onRetry?: AgentTaskHandler;
  /** Shows an Open button on running and done tasks */
  onOpen?: (task: AgentTask) => void;
  /** Heading on the left of the bar */
  title?: string;
  /** A button in the bar, e.g. { label: "New task", onClick } – Standard look only; the Clean bar has no button */
  action?: { label: string; onClick: () => void };
  /** The layout. Controlled when defined; otherwise the component keeps it, starting from `defaultView` */
  view?: AgentInboxView;
  defaultView?: AgentInboxView;
  onViewChange?: (view: AgentInboxView) => void;
  /** The id of the unfolded card. Controlled when defined (null = none); otherwise the component keeps it */
  expanded?: string | null;
  defaultExpanded?: string | null;
  onExpandedChange?: (id: string | null) => void;
  className?: string;
  ref?: Ref<HTMLDivElement>;
};

export type AgentInboxProps = Omit<ComponentPropsWithoutRef<"div">, keyof AgentInboxOwnProps> & AgentInboxOwnProps;

/* ---------- Helpers ---------- */

type Lane = "needs" | "running" | "done";
const LANES: { id: Lane; label: string }[] = [
  { id: "needs", label: "Needs you" },
  { id: "running", label: "Running" },
  { id: "done", label: "Done" },
];
const laneOf = (s: AgentTaskStatus): Lane => (s === "waiting" || s === "failed" ? "needs" : s === "running" ? "running" : "done");
const STATE: Record<AgentTaskStatus, string> = { waiting: "Waiting for you", running: "Running", done: "Done", failed: "Failed" };
const live = (s: AgentTaskStatus) => s === "running" || s === "waiting";
const ms = (d: number | Date) => (typeof d === "number" ? d : d.getTime());
const pad = (n: number) => String(n).padStart(2, "0");
const clock = (time: number) => {
  const s = Math.max(0, Math.floor(time / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${pad(s % 60)}s`;
  return `${Math.floor(m / 60)}h ${pad(m % 60)}m`;
};
const EASE = "cubic-bezier(0.32, 0.72, 0.24, 1)";
/** What a decision is made against: when the task you pass no longer matches it, your version wins */
const versionOf = (t: AgentTask) => `${t.status}|${t.startedAt !== undefined ? ms(t.startedAt) : ""}|${t.elapsed ?? ""}|${t.steps?.length ?? 0}`;
type Override = { version: string; status: AgentTaskStatus; startedAt?: number; steps?: AgentTaskStep[] };

/* ---------- Icons ---------- */

const line = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round" } as const;
/** The agent's mark – a small four-point spark, colored by state */
const Spark = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
    <path d="M7 1.2c.4 2.9 1.9 4.4 4.8 4.8-2.9.4-4.4 1.9-4.8 4.8C6.6 7.9 5.1 6.4 2.2 6 5.1 5.6 6.6 4.1 7 1.2Z" fill="currentColor" />
    <circle cx="11.6" cy="11.4" r="1.1" fill="currentColor" opacity="0.55" />
  </svg>
);
const StateIcon = ({ status }: { status: AgentTaskStatus }) => (
  <span className="ui-ai__state-icon" data-status={status} aria-hidden="true">
    {status === "running" && (
      <svg width="12" height="12" viewBox="0 0 12 12">
        <circle cx="6" cy="6" r="4.6" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.6" />
        <path d="M6 1.4a4.6 4.6 0 0 1 4.6 4.6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    )}
    {status === "waiting" && (
      <svg width="12" height="12" viewBox="0 0 12 12">
        <path d="M6 1.6 11 10.2H1L6 1.6Z" fill="currentColor" />
      </svg>
    )}
    {status === "done" && (
      <svg width="12" height="12" viewBox="0 0 12 12">
        <circle cx="6" cy="6" r="3.4" fill="currentColor" />
      </svg>
    )}
    {status === "failed" && (
      <svg width="12" height="12" viewBox="0 0 12 12">
        <circle cx="6" cy="6" r="4.8" fill="currentColor" />
        <path d="M6 3.6v2.8M6 8.3v.1" stroke="var(--tc-surface-raised, var(--_tc-surface-raised))" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )}
  </span>
);
const WrenchIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    <path d="M7.6 1.6a2.6 2.6 0 0 0-2.4 3.5L1.7 8.6a1.1 1.1 0 0 0 1.6 1.6l3.5-3.5a2.6 2.6 0 0 0 3.5-2.4l-1.5 1.1-1.5-.4-.4-1.5 1.1-1.5c-.1 0-.3-.4-.4-.4Z" {...line} strokeWidth={1.2} />
  </svg>
);
const SearchIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    <circle cx="5.2" cy="5.2" r="3.3" {...line} strokeWidth={1.2} />
    <path d="m7.7 7.7 2.6 2.6" {...line} strokeWidth={1.2} />
  </svg>
);
const BoardIcon = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true">
    <rect x="1.8" y="2.2" width="3.2" height="9.6" rx="1" {...line} strokeWidth={1.2} />
    <rect x="8.9" y="2.2" width="3.2" height="6.4" rx="1" {...line} strokeWidth={1.2} />
  </svg>
);
const ListIcon = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true">
    <path d="M2.2 3.6h9.6M2.2 7h9.6M2.2 10.4h9.6" {...line} strokeWidth={1.2} />
  </svg>
);

const PlusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    <path d="M6 2.2v7.6M2.2 6h7.6" {...line} strokeWidth={1.5} />
  </svg>
);

/* ---------- Hooks ---------- */

/** Wall time – read in effects, timers and handlers only, never during render */
const wall = () => Date.now();

/**
 * Elapsed times. Render shows them as of `now` (0 on the server and the first render, read once before the first
 * paint); after every commit and once a second while a task runs or waits, the time labels are rewritten in place –
 * no render. The second ticks stop while the inbox is off-screen or the tab hidden.
 */
function useElapsed(list: AgentTask[], rootRef: { current: HTMLElement | null }) {
  const [now, setNow] = useState(0);
  useLayoutEffect(() => setNow(wall()), []);
  // When each task without a start time was first seen – recorded after the commit, so render stays pure
  const seen = useRef<Record<string, number>>({});
  const ids = list.map((t) => t.id).join("|");
  useLayoutEffect(() => {
    const at = wall();
    for (const t of list) seen.current[t.id] ??= at;
  }, [ids]); // eslint-disable-line react-hooks/exhaustive-deps -- only new ids need a time
  const timeOf = (t: AgentTask, at: number) => {
    if (!live(t.status)) return t.elapsed ?? 0;
    const base = t.startedAt !== undefined ? ms(t.startedAt) : (seen.current[t.id] ?? at) - (t.elapsed ?? 0);
    return at - base;
  };
  const labels = useRef(new Map<string, HTMLElement>());
  const paint = () => {
    if (!now) return;
    const at = wall();
    for (const t of list) {
      const el = labels.current.get(t.id);
      if (!el || !live(t.status)) continue;
      const text = clock(timeOf(t, at));
      if (el.textContent !== text) el.textContent = text;
    }
  };
  const latest = useRef(paint);
  useLayoutEffect(() => {
    latest.current = paint;
    paint();
  });
  const anyLive = list.some((t) => live(t.status));
  useEffect(() => {
    if (!anyLive) return;
    let id = 0;
    let visible = true;
    const sync = () => {
      const on = visible && !document.hidden;
      if (on && !id) {
        latest.current();
        id = window.setInterval(() => latest.current(), 1000);
      } else if (!on && id) {
        window.clearInterval(id);
        id = 0;
      }
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      sync();
    });
    if (rootRef.current) io.observe(rootRef.current);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      window.clearInterval(id);
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [anyLive, rootRef]);
  const register = (id: string, el: HTMLElement | null) => {
    if (el) labels.current.set(id, el);
    else labels.current.delete(id);
  };
  return { time: (t: AgentTask) => timeOf(t, now), register };
}

/**
 * FLIP: remember where every card sat in the inbox after each change, and glide from there after the next move.
 * Places are kept relative to the inbox, so scrolling in between doesn't count as a move. Measured only when the
 * cards change (`key`), not on every render.
 */
function useCardFlip(rootRef: { current: HTMLElement | null }, cards: { current: Map<string, HTMLElement> }, moveKey: string, opened: string | null, list: AgentTask[]) {
  const before = useRef(new Map<string, { left: number; top: number }>());
  const lastKey = useRef(moveKey);
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const origin = root.getBoundingClientRect();
    const where = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return { left: r.left - origin.left, top: r.top - origin.top };
    };
    // Where each card rests now – measured before any glide starts, so a moving card counts where it ends up
    const next = new Map<string, { left: number; top: number }>();
    for (const [id, el] of cards.current) next.set(id, where(el));
    if (lastKey.current !== moveKey && !reducedMotion()) {
      for (const [id, el] of cards.current) {
        const from = before.current.get(id);
        if (!from) {
          el.animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 380, easing: EASE });
          continue;
        }
        const to = next.get(id)!;
        const dx = from.left - to.left;
        const dy = from.top - to.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
        el.animate([{ transform: `translate(${dx}px, ${dy}px)`, zIndex: 2 }, { transform: "none", zIndex: 2 }], { duration: 560, easing: EASE });
      }
    }
    lastKey.current = moveKey;
    before.current = next;
  }, [moveKey, opened, list, rootRef, cards]);
}

/** Decisions: the card shows its result until the task you pass changes, and waits while a promise runs */
function useInboxDecisions(tasks: AgentTask[]) {
  const [local, setLocal] = useState<Record<string, Override>>({});
  const list = useMemo(
    () =>
      tasks.map((t) => {
        const o = local[t.id];
        return o && o.version === versionOf(t) ? { ...t, status: o.status, startedAt: o.startedAt ?? t.startedAt, steps: o.steps ?? t.steps } : t;
      }),
    [tasks, local],
  );
  // Decisions on their way, and the ones that failed
  const [busy, setBusy] = useState<Record<string, "pending" | "error">>({});
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  // Every decision is reported; the card shows its result until the task you pass changes. A handler that returns a
  // promise holds the card (buttons wait) until it settles, and a rejection leaves the card as it was, with a note
  const decide = (task: AgentTask, next: AgentTaskStatus, note: string, handler?: AgentTaskHandler) => {
    if (busy[task.id] === "pending") return;
    const original = tasks.find((t) => t.id === task.id) ?? task;
    const apply = () =>
      setLocal((l) => ({
        ...l,
        [task.id]: { version: versionOf(original), status: next, startedAt: wall(), steps: [...(task.steps ?? []), { label: note, time: "now" }] },
      }));
    const done = handler?.(task);
    if (done && typeof (done as Promise<unknown>).then === "function") {
      setBusy((b) => ({ ...b, [task.id]: "pending" }));
      (done as Promise<unknown>).then(
        () => {
          if (!alive.current) return;
          setBusy(({ [task.id]: _settled, ...others }) => others);
          apply();
        },
        () => alive.current && setBusy((b) => ({ ...b, [task.id]: "error" })),
      );
      return;
    }
    setBusy(({ [task.id]: _settled, ...others }) => others);
    apply();
  };
  return { list, busy, decide };
}

/* ---------- One card ---------- */

type CardProps = {
  task: AgentTask;
  open: boolean;
  foldId: string;
  state?: "pending" | "error";
  time: number;
  registerCard: (id: string, el: HTMLElement | null) => void;
  registerTime: (id: string, el: HTMLElement | null) => void;
  onToggle: (id: string) => void;
  onDecide: (task: AgentTask, next: AgentTaskStatus, note: string, handler?: AgentTaskHandler) => void;
  onApprove?: AgentTaskHandler;
  onReject?: AgentTaskHandler;
  onRetry?: AgentTaskHandler;
  onOpen?: (task: AgentTask) => void;
};

function InboxCard({ task: t, open, foldId, state, time, registerCard, registerTime, onToggle, onDecide, onApprove, onReject, onRetry, onOpen }: CardProps) {
  const steps = (t.steps ?? []).slice(-4);
  // The word goes first when a card is slim – the glyph already says it – so the time always fits
  const word = t.status === "done" ? "Done in " : t.status === "failed" ? STATE.failed : `${STATE[t.status]} · `;
  return (
    <li data-id={t.id} className="ui-ai__card" data-status={t.status} data-open={open ? "" : undefined} ref={(el) => registerCard(t.id, el)}>
      {/* data-focus-key: when the card remounts in its new column, focus finds it again (2.4.3) */}
      <button type="button" className="ui-ai__card-main" data-focus-key={t.id} aria-expanded={open} aria-controls={foldId} onClick={() => onToggle(t.id)}>
        <span className="ui-ai__title-row">
          <span className="ui-ai__spark">
            <Spark />
          </span>
          <span className="ui-ai__title">{t.title}</span>
        </span>
        {t.description && <span className="ui-ai__desc">{t.description}</span>}
        <span className="ui-ai__foot">
          <span className="ui-ai__state" data-status={t.status}>
            <StateIcon status={t.status} />
            <span>
              <span className="ui-ai__state-word">{word}</span>
              <span className="ui-ai__time" ref={(el) => registerTime(t.id, el)}>
                {t.status === "failed" ? "" : clock(time)}
              </span>
            </span>
          </span>
          <span className="ui-ai__meta">
            {t.sources !== undefined && (
              <span title="Sources read">
                <SearchIcon />
                {t.sources}
                <span className="ui-ai__sr"> sources read</span>
              </span>
            )}
            {t.tools !== undefined && (
              <span title="Tool calls">
                <WrenchIcon />
                {t.tools}
                <span className="ui-ai__sr"> tool calls</span>
              </span>
            )}
          </span>
        </span>
      </button>

      <div id={foldId} className="ui-ai__fold" data-open={open ? "" : undefined} inert={!open}>
        <div className="ui-ai__clip">
          <div className="ui-ai__more">
            <div className="ui-ai__agent">{t.agent}</div>
            {steps.length > 0 && (
              <ol className="ui-ai__steps">
                {steps.map((s, i) => (
                  <li key={i} data-last={i === steps.length - 1 ? "" : undefined}>
                    <span>{s.label}</span>
                    {s.time && <time>{s.time}</time>}
                  </li>
                ))}
              </ol>
            )}
            <div className="ui-ai__actions" aria-busy={state === "pending" || undefined}>
              {state === "error" && (t.status === "waiting" || t.status === "failed") && (
                <span className="ui-ai__error" role="alert">
                  Didn't go through – try again
                </span>
              )}
              {t.status === "waiting" && (
                <>
                  <button type="button" className="ui-ai__btn" aria-disabled={state === "pending" || undefined} onClick={() => onDecide(t, "failed", "You rejected the request", onReject)}>
                    Reject
                  </button>
                  <button type="button" className="ui-ai__btn ui-ai__btn--primary" aria-disabled={state === "pending" || undefined} onClick={() => onDecide(t, "running", "You approved – continuing", onApprove)}>
                    Approve
                  </button>
                </>
              )}
              {t.status === "failed" && (
                <button type="button" className="ui-ai__btn ui-ai__btn--primary" aria-disabled={state === "pending" || undefined} onClick={() => onDecide(t, "running", "Retrying", onRetry)}>
                  Retry
                </button>
              )}
              {(t.status === "running" || t.status === "done") && onOpen && (
                <button type="button" className="ui-ai__btn" onClick={() => onOpen(t)}>
                  Open
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

export function AgentInbox({
  look,
  tasks,
  onApprove,
  onReject,
  onRetry,
  onOpen,
  title = "Agent inbox",
  action,
  view,
  defaultView = "board",
  onViewChange,
  expanded,
  defaultExpanded = null,
  onExpandedChange,
  className,
  ref,
  ...rest
}: AgentInboxProps) {
  const uid = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const setRoot = useRootRef(rootRef, ref);
  const [layout, setView] = useControllable(view, defaultView, onViewChange, "view");
  const [opened, setOpened] = useControllable<string | null>(expanded, defaultExpanded, onExpandedChange, "expanded");
  const { list, busy, decide: decideRaw } = useInboxDecisions(tasks);
  /** A decision swaps the card's buttons and later moves it to another column: focus goes to the card first */
  const decide: typeof decideRaw = (task, next, note, handler) => {
    const card = rootRef.current?.querySelector(`[data-id="${CSS.escape(task.id)}"]`);
    rescueFocus(card?.querySelector(".ui-ai__fold"), [() => card?.querySelector(".ui-ai__card-main")]);
    decideRaw(task, next, note, handler);
  };
  // Safety net: a focused card that remounts elsewhere is found by its data-focus-key; else the layout switch
  useFocusRescue(rootRef, { fallback: () => rootRef.current?.querySelector('.ui-ai__view[tabindex="0"]') });
  const elapsed = useElapsed(list, rootRef);

  /* ---------- A changed card shows its new state in place, then moves to its new column ---------- */

  const [placed, setPlaced] = useState<Record<string, Lane>>(() => Object.fromEntries(list.map((t) => [t.id, laneOf(t.status)])));
  const laneKey = list.map((t) => `${t.id}:${laneOf(t.status)}`).join("|");
  useEffect(() => {
    const pending = list.some((t) => placed[t.id] !== laneOf(t.status));
    if (!pending) return;
    const timer = window.setTimeout(() => setPlaced(Object.fromEntries(list.map((t) => [t.id, laneOf(t.status)]))), reducedMotion() ? 0 : 900);
    return () => window.clearTimeout(timer);
  }, [laneKey]); // eslint-disable-line react-hooks/exhaustive-deps -- the lanes are all that matters
  const laneFor = (t: AgentTask) => placed[t.id] ?? laneOf(t.status);

  const cards = useRef(new Map<string, HTMLElement>());
  // Cards move when they change lanes or the layout changes; they shift when one opens or the tasks change
  useCardFlip(rootRef, cards, JSON.stringify(placed) + layout, opened, list);
  const registerCard = (id: string, el: HTMLElement | null) => {
    if (el) cards.current.set(id, el);
    else cards.current.delete(id);
  };

  const toggle = (id: string) => setOpened((o) => (o === id ? null : id));
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    rest.onKeyDown?.(e);
    if (e.key === "Escape" && opened) {
      e.stopPropagation();
      rootRef.current?.querySelector<HTMLElement>(`[data-id="${CSS.escape(opened)}"] .ui-ai__card-main`)?.focus({ preventScroll: true });
      setOpened(null);
    }
  };

  const counts = Object.fromEntries(LANES.map((l) => [l.id, list.filter((t) => laneFor(t) === l.id).length])) as Record<Lane, number>;
  const summary = `${list.filter((t) => t.status === "waiting" || t.status === "failed").length} need you, ${list.filter((t) => t.status === "running").length} running`;

  const resolvedLook = look ?? DEFAULT_LOOK;
  // Board / List – in the bar, next to the action button in Standard
  // A radiogroup with its keyboard pattern: one tab stop, arrows (and Home / End) move and pick
  const onViewsKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const order = ["board", "list"] as const;
    const at = order.indexOf(layout);
    const to =
      e.key === "ArrowRight" || e.key === "ArrowDown" ? (at + 1) % 2 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (at + 1) % 2 : e.key === "Home" ? 0 : e.key === "End" ? 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    setView(order[to]);
    e.currentTarget.querySelectorAll<HTMLElement>(".ui-ai__view")[to]?.focus();
  };
  const views = (
    <div className="ui-ai__views" role="radiogroup" aria-label="Layout" onKeyDown={onViewsKey}>
      {(["board", "list"] as const).map((v) => (
        <button key={v} type="button" role="radio" aria-checked={layout === v} tabIndex={layout === v ? 0 : -1} className="ui-ai__view" onClick={() => setView(v)}>
          {v === "board" ? <BoardIcon /> : <ListIcon />}
          {v === "board" ? "Board" : "List"}
        </button>
      ))}
    </div>
  );

  return (
    <div {...rest} ref={setRoot} className={[ROOT_CLASS, className].filter(Boolean).join(" ")} data-look={resolvedLook} data-view={layout} onKeyDown={onKeyDown}>
      <style href="ui-agent-inbox" precedence="default">
        {css}
      </style>

      <div className="ui-ai__bar">
        <span className="ui-ai__heading">
          <span className="ui-ai__crumb">Agents</span>
          <span className="ui-ai__slash" aria-hidden="true">
            /
          </span>
          <span>{title}</span>
        </span>
        {resolvedLook === "standard" ? (
          <div className="ui-ai__tools">
            {action && (
              <button type="button" className="ui-ai__action" onClick={action.onClick}>
                <PlusIcon />
                {action.label}
              </button>
            )}
            {views}
          </div>
        ) : (
          views
        )}
      </div>

      <div className="ui-ai__lanes">
        {LANES.map((lane) => (
          <section key={lane.id} className="ui-ai__lane" aria-label={lane.label}>
            <header className="ui-ai__lane-head">
              <span className="ui-ai__lane-spark" aria-hidden="true">
                <Spark />
              </span>
              <span className="ui-ai__lane-name">{lane.label}</span>
              <span className="ui-ai__count">{counts[lane.id]}</span>
            </header>
            <ul className="ui-ai__cards">
              {list
                .filter((t) => laneFor(t) === lane.id)
                .map((t) => (
                  <InboxCard
                    key={t.id}
                    task={t}
                    open={opened === t.id}
                    // DOM ids come from useId and the task's place, never from the task's own id
                    foldId={`${uid}-${list.indexOf(t)}`}
                    state={busy[t.id]}
                    time={elapsed.time(t)}
                    registerCard={registerCard}
                    registerTime={elapsed.register}
                    onToggle={toggle}
                    onDecide={decide}
                    onApprove={onApprove}
                    onReject={onReject}
                    onRetry={onRetry}
                    onOpen={onOpen}
                  />
                ))}
              {counts[lane.id] === 0 && <li className="ui-ai__empty">Nothing here</li>}
            </ul>
          </section>
        ))}
      </div>

      <span className="ui-ai__sr" aria-live="polite">
        {summary}
      </span>
    </div>
  );
}

/* ---------- Shared helpers (inlined from src/internal) ---------- */

const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

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

/* ---------- Styles ---------- */

const css = /* css */ `
/* Fallbacks so this file works without tokens.css – tokens.css, when loaded, takes precedence */
.ui-ai:where([data-look="standard"]),
.ui-ai__portal:where([data-look="standard"]) {
  --_tc-accent-subtle: light-dark(rgba(47, 107, 255, 0.08), rgba(79, 130, 255, 0.16));
  --_tc-accent-text: light-dark(#2456d6, #8ab4ff);
  --_tc-action-ghost-bg-hover: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-action-primary-bg: light-dark(#171717, #ededed);
  --_tc-action-primary-bg-active: light-dark(#0a0a0a, #c8c8cc);
  --_tc-action-primary-bg-hover: light-dark(#262626, #ffffff);
  --_tc-action-primary-fg: light-dark(#ffffff, #111113);
  --_tc-action-primary-shadow: 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-bg: light-dark(#ffffff, #232326);
  --_tc-action-secondary-fg: light-dark(#171717, #ededed);
  --_tc-action-secondary-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-shadow-hover: 0 0 0 1px light-dark(#dedede, #3a3a40), 0 6px 16px -8px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-border-default: light-dark(#ececec, #2a2a2e);
  --_tc-caption-color: light-dark(#646464, #9a9aa1);
  --_tc-caption-font-size: 12px;
  --_tc-caption-font-weight: 500;
  --_tc-caption-line-height: 16px;
  --_tc-caption-tracking: 0;
  --_tc-caption-transform: none;
  --_tc-card-radius: 16px;
  --_tc-card-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-card-shadow-hover: 0 0 0 1px light-dark(#dedede, #3a3a40), 0 6px 16px -8px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-md: 32px;
  --_tc-control-px-md: 12px;
  --_tc-control-radius-md: 10px;
  --_tc-divider: light-dark(#ececec, #2a2a2e);
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-reveal-slow: 900ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-ease-move: cubic-bezier(0.22, 1, 0.36, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-focus-outline: 2px solid light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring-offset: 2px;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-semibold: 600;
  --_tc-font-weight-strong: 600;
  --_tc-hairline: 1px;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-snug: 18px;
  --_tc-pill-font-size: 11px;
  --_tc-pill-font-weight: 500;
  --_tc-pill-h: 20px;
  --_tc-pill-radius: 999px;
  --_tc-radius-full: 999px;
  --_tc-seg-pad: 2px;
  --_tc-seg-thumb-bg: light-dark(#ffffff, #34343a);
  --_tc-seg-thumb-shadow: 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-seg-track-bg: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-seg-track-radius: 10px;
  --_tc-shadow-raised: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-space-0-5: 2px;
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-2: 8px;
  --_tc-space-2-5: 10px;
  --_tc-space-3: 12px;
  --_tc-space-3-5: 14px;
  --_tc-space-4: 16px;
  --_tc-space-4-5: 18px;
  --_tc-space-5: 20px;
  --_tc-status-danger-bg: light-dark(#fdecea, #3b1714);
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-danger-solid: light-dark(#e5484d, #ff6369);
  --_tc-status-info-solid: light-dark(#2f68ff, #6b95ff);
  --_tc-status-success-bg: light-dark(#e6f6ec, #12301f);
  --_tc-status-success-fg: light-dark(#18794e, #3dd68c);
  --_tc-status-success-solid: light-dark(#1f8a4c, #3ec27a);
  --_tc-status-warning-bg: light-dark(#fff3e0, #3a2410);
  --_tc-status-warning-fg: light-dark(#a35200, #ffa057);
  --_tc-status-warning-solid: light-dark(#c2710c, #f5a524);
  --_tc-surface-raised: light-dark(#ffffff, #19191b);
  --_tc-surface-sunken: light-dark(#f0f0f0, #111113);
  --_tc-text-disabled: light-dark(#a3a3a3, #5c5c63);
  --_tc-text-muted: light-dark(#646464, #9a9aa1);
  --_tc-text-primary: light-dark(#171717, #ededed);
  --_tc-text-secondary: light-dark(#404040, #c8c8cc);
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(16px + 4px);
}
.ui-ai:where([data-look="clean"]),
.ui-ai__portal:where([data-look="clean"]) {
  --_tc-accent-subtle: light-dark(rgba(0, 96, 226, 0.06), rgba(77, 141, 255, 0.14));
  --_tc-accent-text: light-dark(#0058cf, #70b8ff);
  --_tc-action-ghost-bg-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-action-primary-bg: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.92));
  --_tc-action-primary-bg-active: light-dark(rgba(0, 0, 0, 0.94), rgba(255, 255, 255, 0.74));
  --_tc-action-primary-bg-hover: light-dark(rgba(0, 0, 0, 0.8), rgba(255, 255, 255, 0.82));
  --_tc-action-primary-fg: light-dark(#fcfcfc, #161618);
  --_tc-action-primary-shadow: none;
  --_tc-action-secondary-bg: light-dark(#ffffff, #252527);
  --_tc-action-secondary-fg: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-action-secondary-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-shadow-hover: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 3px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-border-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-caption-color: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52));
  --_tc-caption-font-size: 10px;
  --_tc-caption-font-weight: 500;
  --_tc-caption-line-height: 16px;
  --_tc-caption-tracking: 0.05em;
  --_tc-caption-transform: uppercase;
  --_tc-card-radius: 10px;
  --_tc-card-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-card-shadow-hover: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 3px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-md: 28px;
  --_tc-control-px-md: 10px;
  --_tc-control-radius-md: 6px;
  --_tc-divider: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-reveal-slow: 900ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-ease-move: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-focus-outline: 2px solid light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring-offset: 1px;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-semibold: 600;
  --_tc-font-weight-strong: 500;
  --_tc-hairline: 0.5px;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-snug: 18px;
  --_tc-pill-font-size: 11px;
  --_tc-pill-font-weight: 500;
  --_tc-pill-h: 18px;
  --_tc-pill-radius: 5px;
  --_tc-radius-full: 999px;
  --_tc-seg-pad: 2px;
  --_tc-seg-thumb-bg: light-dark(#ffffff, #34343a);
  --_tc-seg-thumb-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-seg-track-bg: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-seg-track-radius: 8px;
  --_tc-shadow-raised: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-space-0-5: 2px;
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-2: 8px;
  --_tc-space-2-5: 10px;
  --_tc-space-3: 12px;
  --_tc-space-3-5: 14px;
  --_tc-space-4: 16px;
  --_tc-space-4-5: 18px;
  --_tc-space-5: 20px;
  --_tc-status-danger-bg: light-dark(rgba(245, 43, 0, 0.094), rgba(255, 53, 35, 0.17));
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-danger-solid: light-dark(#e5484d, #ff6369);
  --_tc-status-info-solid: light-dark(#0060e2, #5b9aff);
  --_tc-status-success-bg: light-dark(rgba(0, 164, 51, 0.1), rgba(0, 240, 74, 0.12));
  --_tc-status-success-fg: light-dark(#18794e, #3dd68c);
  --_tc-status-success-solid: light-dark(#1f8a4c, #3ec27a);
  --_tc-status-warning-bg: light-dark(rgba(255, 156, 0, 0.16), rgba(251, 106, 0, 0.15));
  --_tc-status-warning-fg: light-dark(#a35200, #ffa057);
  --_tc-status-warning-solid: light-dark(#c2710c, #f5a524);
  --_tc-surface-raised: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-sunken: light-dark(#f7f7f7, #161618);
  --_tc-text-disabled: light-dark(rgba(0, 0, 0, 0.27), rgba(255, 255, 255, 0.3));
  --_tc-text-muted: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52));
  --_tc-text-primary: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-text-secondary: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(10px + 4px);
}
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

/* Colors and motion as variables – override them on .ui-ai */
:where([data-look="standard"], [data-look="standard"] *).ui-ai {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  /* The tray recipe */
  padding: var(--tc-tray-inset, var(--_tc-tray-inset));
  border-radius: var(--tc-tray-radius, var(--_tc-tray-radius));
  background: var(--tc-surface-sunken, var(--_tc-surface-sunken));
  container-type: inline-size;
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  letter-spacing: -0.006em;
  color: var(--tc-text-muted, var(--_tc-text-muted));
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *).ui-ai {
  /* The quiet lane behind the cards, also the view switch track */
  --tc-agent-inbox-lane-bg: light-dark(#f4f4f5, #161618);
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  container-type: inline-size;
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
.ui-ai *, .ui-ai *::before, .ui-ai *::after { box-sizing: border-box; }
:where(.ui-ai) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.ui-ai button:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
.ui-ai ul, .ui-ai ol { margin: 0; padding: 0; list-style: none; }
.ui-ai svg { display: block; flex: none; }
.ui-ai__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* ----- Bar on the tray: where you are, an optional action and the layout ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-ai__bar { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3, var(--_tc-space-3)); padding: var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-3-5, var(--_tc-space-3-5)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__heading { display: flex; align-items: center; gap: var(--tc-space-2, var(--_tc-space-2)); min-width: 0; font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg)); font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold)); color: var(--tc-text-primary, var(--_tc-text-primary)); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__crumb { color: var(--tc-text-muted, var(--_tc-text-muted)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__slash { color: var(--tc-text-disabled, var(--_tc-text-disabled)); font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__tools { display: flex; flex: none; align-items: center; gap: var(--tc-space-2, var(--_tc-space-2)); }
/* The bar's action: a ghost button */
:where([data-look="standard"], [data-look="standard"] *).ui-ai__action { display: inline-flex; align-items: center; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); height: var(--tc-control-h-md, var(--_tc-control-h-md)); padding: 0 var(--tc-control-px-md, var(--_tc-control-px-md)) 0 calc(var(--tc-control-px-md, var(--_tc-control-px-md)) - 2px); border-radius: var(--tc-control-radius-md, var(--_tc-control-radius-md)); font-size: var(--tc-control-font-size, var(--_tc-control-font-size)); font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight)); color: var(--tc-text-primary, var(--_tc-text-primary)); transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__action:hover { background: var(--tc-action-ghost-bg-hover, var(--_tc-action-ghost-bg-hover)); }
/* Board / List: the segmented pattern – a track, the chosen layout on the raised thumb */
.ui-ai__views { display: flex; flex: none; gap: var(--tc-space-0-5, var(--_tc-space-0-5)); padding: var(--tc-seg-pad, var(--_tc-seg-pad)); border-radius: var(--tc-seg-track-radius, var(--_tc-seg-track-radius)); background: var(--tc-seg-track-bg, var(--_tc-seg-track-bg)); }
.ui-ai__view[aria-checked="true"] { background: var(--tc-seg-thumb-bg, var(--_tc-seg-thumb-bg)); color: var(--tc-text-primary, var(--_tc-text-primary)); box-shadow: var(--tc-seg-thumb-shadow, var(--_tc-seg-thumb-shadow)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__view[aria-checked="true"] { font-weight: var(--tc-font-weight-strong, var(--_tc-font-weight-strong)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__view { display: inline-flex; align-items: center; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); height: 28px; padding: 0 var(--tc-space-3, var(--_tc-space-3)); border-radius: calc(var(--tc-seg-track-radius, var(--_tc-seg-track-radius)) - var(--tc-seg-pad, var(--_tc-seg-pad))); font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-muted, var(--_tc-text-muted)); transition: background-color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
/* ----- Bar: where you are, and the layout ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-ai__bar { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3, var(--_tc-space-3)); margin-bottom: var(--tc-space-3, var(--_tc-space-3)); padding: 0 var(--tc-space-0-5, var(--_tc-space-0-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__heading { display: flex; align-items: center; gap: var(--tc-space-2-5, var(--_tc-space-2-5)); min-width: 0; font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-primary, var(--_tc-text-primary)); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__crumb { color: var(--tc-text-muted, var(--_tc-text-muted)); font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__slash { color: var(--tc-text-disabled, var(--_tc-text-disabled)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__view { display: inline-flex; align-items: center; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); height: 26px; padding: 0 var(--tc-space-2-5, var(--_tc-space-2-5)); border-radius: calc(var(--tc-seg-track-radius, var(--_tc-seg-track-radius)) - var(--tc-seg-pad, var(--_tc-seg-pad))); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-muted, var(--_tc-text-muted)); transition: background-color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-ai__view:hover { color: var(--tc-text-primary, var(--_tc-text-primary)); }
/* ----- Columns: headings on the tray, white cards below ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-ai__lanes { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--tc-space-1, var(--_tc-space-1)); align-items: start; }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__lane { min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__lane-head { display: flex; align-items: center; gap: var(--tc-space-2, var(--_tc-space-2)); height: 32px; padding: 0 var(--tc-space-2-5, var(--_tc-space-2-5)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__lane-spark { display: grid; color: var(--tc-status-info-solid, var(--_tc-status-info-solid)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__lane[aria-label="Needs you"] .ui-ai__lane-spark { color: var(--tc-status-warning-solid, var(--_tc-status-warning-solid)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__lane[aria-label="Done"] .ui-ai__lane-spark { color: var(--tc-status-success-solid, var(--_tc-status-success-solid)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__lane-name { overflow: hidden; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold)); color: var(--tc-text-primary, var(--_tc-text-primary)); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__count { display: grid; place-items: center; min-width: var(--tc-pill-h, var(--_tc-pill-h)); height: var(--tc-pill-h, var(--_tc-pill-h)); padding: 0 var(--tc-space-1-5, var(--_tc-space-1-5)); border-radius: var(--tc-pill-radius, var(--_tc-pill-radius)); background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)); font-size: var(--tc-pill-font-size, var(--_tc-pill-font-size)); font-weight: var(--tc-pill-font-weight, var(--_tc-pill-font-weight)); color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__cards { display: grid; gap: var(--tc-space-1, var(--_tc-space-1)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__empty { padding: var(--tc-space-4-5, var(--_tc-space-4-5)) 0 var(--tc-space-5, var(--_tc-space-5)); border-radius: var(--tc-card-radius, var(--_tc-card-radius)); box-shadow: inset 0 0 0 var(--tc-hairline, var(--_tc-hairline)) var(--tc-border-default, var(--_tc-border-default)); font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); text-align: center; color: var(--tc-text-muted, var(--_tc-text-muted)); }
/* ----- A card ----- */
/* A card: the card pattern, its hover from the tokens (dark included) */
.ui-ai__card { position: relative; border-radius: var(--tc-card-radius, var(--_tc-card-radius)); background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow)); transition: box-shadow var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-ai__card:hover,
.ui-ai__card[data-open] { box-shadow: var(--tc-card-shadow-hover, var(--_tc-card-shadow-hover)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__card-main { display: grid; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); width: 100%; padding: var(--tc-space-3-5, var(--_tc-space-3-5)) var(--tc-space-3-5, var(--_tc-space-3-5)) var(--tc-space-3, var(--_tc-space-3)); border-radius: var(--tc-card-radius, var(--_tc-card-radius)); container: ai-card / inline-size; }
/* ----- Columns ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-ai__lanes { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--tc-space-2, var(--_tc-space-2)); align-items: start; }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__lane { min-width: 0; padding: var(--tc-tray-inset, var(--_tc-tray-inset)); border-radius: var(--tc-tray-radius, var(--_tc-tray-radius)); background: var(--tc-agent-inbox-lane-bg); }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__lane-head { display: grid; grid-template-columns: 20px 1fr 20px; align-items: center; height: 34px; padding: 0 var(--tc-space-2, var(--_tc-space-2)) 0 var(--tc-space-2-5, var(--_tc-space-2-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__lane-spark { color: var(--tc-status-info-solid, var(--_tc-status-info-solid)); opacity: 0.7; }
/* The lane name is a group label: the Clean caption spec */
:where([data-look="clean"], [data-look="clean"] *).ui-ai__lane-name { overflow: hidden; font-size: var(--tc-caption-font-size, var(--_tc-caption-font-size)); font-weight: var(--tc-caption-font-weight, var(--_tc-caption-font-weight)); line-height: var(--tc-caption-line-height, var(--_tc-caption-line-height)); letter-spacing: var(--tc-caption-tracking, var(--_tc-caption-tracking)); text-align: center; text-transform: var(--tc-caption-transform, var(--_tc-caption-transform)); color: var(--tc-caption-color, var(--_tc-caption-color)); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__count { display: grid; place-items: center; min-width: 20px; height: var(--tc-pill-h, var(--_tc-pill-h)); padding: 0 var(--tc-space-1, var(--_tc-space-1)); border-radius: var(--tc-pill-radius, var(--_tc-pill-radius)); background: var(--tc-fill-default, var(--_tc-fill-default)); font-size: var(--tc-pill-font-size, var(--_tc-pill-font-size)); font-weight: var(--tc-pill-font-weight, var(--_tc-pill-font-weight)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__cards { display: grid; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__empty { padding: var(--tc-space-4-5, var(--_tc-space-4-5)) 0 var(--tc-space-5, var(--_tc-space-5)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); text-align: center; color: var(--tc-text-muted, var(--_tc-text-muted)); }
/* ----- A card ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-ai__card-main { display: grid; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); width: 100%; padding: var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-3-5, var(--_tc-space-3-5)) var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-3, var(--_tc-space-3)); border-radius: var(--tc-card-radius, var(--_tc-card-radius)); container: aic-card / inline-size; }
.ui-ai__title-row { display: flex; align-items: center; gap: var(--tc-space-2-5, var(--_tc-space-2-5)); min-width: 0; }
.ui-ai__spark { display: grid; flex: none; place-items: center; width: 16px; color: var(--tc-status-info-solid, var(--_tc-status-info-solid)); transition: color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-ai__card[data-status="waiting"] .ui-ai__spark { color: var(--tc-status-warning-solid, var(--_tc-status-warning-solid)); }
.ui-ai__card[data-status="failed"] .ui-ai__spark { color: var(--tc-status-danger-solid, var(--_tc-status-danger-solid)); }
.ui-ai__card[data-status="done"] .ui-ai__spark { color: var(--tc-status-success-solid, var(--_tc-status-success-solid)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__title { min-width: 0; overflow: hidden; font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg)); font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); color: var(--tc-text-primary, var(--_tc-text-primary)); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__desc { display: -webkit-box; padding-left: 26px; overflow: hidden; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); line-height: 19px; color: var(--tc-text-muted, var(--_tc-text-muted)); -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__foot { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-2-5, var(--_tc-space-2-5)); min-width: 0; margin-top: var(--tc-space-1-5, var(--_tc-space-1-5)); padding-left: 26px; }
/* The state: a pill on a soft tone, with its glyph */
:where([data-look="standard"], [data-look="standard"] *).ui-ai__state { display: inline-flex; align-items: center; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); min-width: 0; height: 24px; padding: 0 var(--tc-space-2-5, var(--_tc-space-2-5)) 0 var(--tc-space-2, var(--_tc-space-2)); border-radius: var(--tc-radius-full, var(--_tc-radius-full)); background: var(--tc-accent-subtle, var(--_tc-accent-subtle)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-accent-text, var(--_tc-accent-text)); white-space: nowrap; font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__state[data-status="waiting"] { background: var(--tc-status-warning-bg, var(--_tc-status-warning-bg)); color: var(--tc-status-warning-fg, var(--_tc-status-warning-fg)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__state[data-status="done"] { background: var(--tc-status-success-bg, var(--_tc-status-success-bg)); color: var(--tc-status-success-fg, var(--_tc-status-success-fg)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__state[data-status="failed"] { background: var(--tc-status-danger-bg, var(--_tc-status-danger-bg)); color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__title { min-width: 0; overflow: hidden; font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); color: var(--tc-text-primary, var(--_tc-text-primary)); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__desc { display: -webkit-box; padding-left: 26px; overflow: hidden; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); line-height: 19px; color: var(--tc-text-secondary, var(--_tc-text-secondary)); -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__foot { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-2-5, var(--_tc-space-2-5)); min-width: 0; margin-top: var(--tc-space-1, var(--_tc-space-1)); padding-left: 26px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__state { display: inline-flex; align-items: center; gap: var(--tc-space-2, var(--_tc-space-2)); min-width: 0; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-ai__state > span:last-child { overflow: hidden; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__state-icon { display: grid; flex: none; place-items: center; width: 12px; height: 12px; color: currentColor; animation: ui-ai-pop var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__state-icon { display: grid; flex: none; place-items: center; width: 12px; height: 12px; color: var(--tc-status-info-solid, var(--_tc-status-info-solid)); animation: ui-ai-pop var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
/* The spinner turns a few times and rests – an endless loop would move for more than 5 s (2.2.2) */
.ui-ai__state-icon[data-status="running"] svg { animation: ui-ai-spin var(--tc-duration-reveal-slow, var(--_tc-duration-reveal-slow)) linear 5; }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__meta { display: inline-flex; flex: none; align-items: center; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__state-icon[data-status="waiting"] { color: var(--tc-status-warning-solid, var(--_tc-status-warning-solid)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__state-icon[data-status="done"] { color: var(--tc-status-success-solid, var(--_tc-status-success-solid)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__state-icon[data-status="failed"] { color: var(--tc-status-danger-solid, var(--_tc-status-danger-solid)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__meta { display: inline-flex; flex: none; align-items: center; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; }
.ui-ai__meta > span { display: inline-flex; align-items: center; gap: var(--tc-space-1, var(--_tc-space-1)); padding: 0 var(--tc-space-2, var(--_tc-space-2)); }
.ui-ai__meta > span + span { border-left: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider)); }
.ui-ai__meta > span:last-child { padding-right: 0; }
/* Open: steps and decisions unfold under the card's text */
:where([data-look="standard"], [data-look="standard"] *).ui-ai__fold { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)), opacity var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-ai__fold[data-open] { grid-template-rows: 1fr; opacity: 1; transition: grid-template-rows var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)), opacity var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)) var(--tc-duration-instant, var(--_tc-duration-instant)); }
/* Open: steps and decisions unfold under the card's text */
:where([data-look="clean"], [data-look="clean"] *).ui-ai__fold { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)), opacity var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-ai__clip { min-height: 0; overflow: hidden; }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__more { margin: 0 var(--tc-space-3-5, var(--_tc-space-3-5)); padding: var(--tc-space-3, var(--_tc-space-3)) 0 var(--tc-space-3-5, var(--_tc-space-3-5)); border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__agent { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__steps { position: relative; display: grid; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); margin-top: var(--tc-space-2, var(--_tc-space-2)) !important; padding-left: var(--tc-space-3-5, var(--_tc-space-3-5)) !important; }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__steps li { position: relative; display: flex; justify-content: space-between; gap: var(--tc-space-2-5, var(--_tc-space-2-5)); font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__steps li::before { content: ""; position: absolute; top: 6px; left: -14px; width: 6px; height: 6px; border-radius: 50%; background: var(--tc-text-disabled, var(--_tc-text-disabled)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__steps li:not(:last-child)::after { content: ""; position: absolute; top: 15px; bottom: -9px; left: -11.5px; width: 1px; background: var(--tc-border-default, var(--_tc-border-default)); }
/* Starts at the card's left edge, like the spark – the full width for reading */
:where([data-look="clean"], [data-look="clean"] *).ui-ai__more { margin: 0 var(--tc-space-3-5, var(--_tc-space-3-5)) 0 var(--tc-space-3, var(--_tc-space-3)); padding: var(--tc-space-2-5, var(--_tc-space-2-5)) 0 var(--tc-space-3, var(--_tc-space-3)); border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__agent { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__steps { position: relative; display: grid; gap: var(--tc-space-1, var(--_tc-space-1)); margin-top: var(--tc-space-1-5, var(--_tc-space-1-5)) !important; padding-left: var(--tc-space-3, var(--_tc-space-3)) !important; }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__steps li { position: relative; display: flex; justify-content: space-between; gap: var(--tc-space-2-5, var(--_tc-space-2-5)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__steps li::before { content: ""; position: absolute; top: 7px; left: -12px; width: 4px; height: 4px; border-radius: 50%; background: var(--tc-text-disabled, var(--_tc-text-disabled)); }
/* Short line segments between the dots, with a little air on both ends */
:where([data-look="clean"], [data-look="clean"] *).ui-ai__steps li:not(:last-child)::after { content: ""; position: absolute; top: 15px; bottom: -8px; left: -10.5px; width: 1px; background: var(--tc-border-default, var(--_tc-border-default)); }
.ui-ai__steps li[data-last]::before { background: var(--tc-text-primary, var(--_tc-text-primary)); }
.ui-ai__steps li > span { min-width: 0; }
.ui-ai__steps time { flex: none; color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__actions { display: flex; justify-content: flex-end; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); margin-top: var(--tc-space-3, var(--_tc-space-3)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__actions { display: flex; justify-content: flex-end; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); margin-top: var(--tc-space-2-5, var(--_tc-space-2-5)); }
.ui-ai__actions:empty { display: none; }
.ui-ai__actions[aria-busy] .ui-ai__btn, .ui-ai__btn[aria-disabled="true"] { opacity: 0.6; cursor: progress; }
.ui-ai__error { align-self: center; margin-right: auto; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
/* Reject / Open and Approve / Retry: secondary and primary actions, exactly like Button (both looks) */
.ui-ai__btn { display: inline-flex; align-items: center; height: var(--tc-control-h-md, var(--_tc-control-h-md)); padding: 0 var(--tc-control-px-md, var(--_tc-control-px-md)); border-radius: var(--tc-control-radius-md, var(--_tc-control-radius-md)); background: var(--tc-action-secondary-bg, var(--_tc-action-secondary-bg)); box-shadow: var(--tc-action-secondary-shadow, var(--_tc-action-secondary-shadow)); font-size: var(--tc-control-font-size, var(--_tc-control-font-size)); font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight)); color: var(--tc-action-secondary-fg, var(--_tc-action-secondary-fg)); transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-ai__btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover, var(--_tc-action-secondary-shadow-hover)); }
.ui-ai__btn--primary { background: var(--tc-action-primary-bg, var(--_tc-action-primary-bg)); box-shadow: var(--tc-action-primary-shadow, var(--_tc-action-primary-shadow)); color: var(--tc-action-primary-fg, var(--_tc-action-primary-fg)); }
.ui-ai__btn--primary:hover { background: var(--tc-action-primary-bg-hover, var(--_tc-action-primary-bg-hover)); box-shadow: var(--tc-action-primary-shadow, var(--_tc-action-primary-shadow)); }
.ui-ai__btn--primary:active { background: var(--tc-action-primary-bg-active, var(--_tc-action-primary-bg-active)); }
/* ----- List layout: the columns stack, one after another ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-ai[data-view="list"] .ui-ai__lanes { grid-template-columns: minmax(0, 1fr); gap: var(--tc-space-2, var(--_tc-space-2)); }
/* ----- List layout: the columns stack, one after another ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-ai[data-view="list"] .ui-ai__lanes { grid-template-columns: minmax(0, 1fr); }
:where([data-look="clean"], [data-look="clean"] *).ui-ai[data-view="list"] .ui-ai__lane-head { grid-template-columns: 20px auto 1fr; gap: var(--tc-space-1, var(--_tc-space-1)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ai[data-view="list"] .ui-ai__lane-name { text-align: left; }
:where([data-look="clean"], [data-look="clean"] *).ui-ai[data-view="list"] .ui-ai__count { justify-self: start; }
.ui-ai__lanes { animation: ui-ai-in var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)) both; }
@keyframes ui-ai-spin { to { transform: rotate(360deg); } }
@keyframes ui-ai-pop { from { opacity: 0; transform: scale(0.6); } }
@keyframes ui-ai-in { from { opacity: 0.4; } }
/* Narrow containers: always the list, without the switch */
/* Narrow containers: the columns stack in both layouts. The switch stays visible (1.4.10) – it was display:none here */
@container (max-width: 620px) {
:where([data-look="standard"], [data-look="standard"] *).ui-ai .ui-ai__lanes { grid-template-columns: minmax(0, 1fr); gap: var(--tc-space-2, var(--_tc-space-2)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ai .ui-ai__lanes { grid-template-columns: minmax(0, 1fr); }
:where([data-look="clean"], [data-look="clean"] *).ui-ai .ui-ai__lane-head { grid-template-columns: 20px auto 1fr; gap: var(--tc-space-1, var(--_tc-space-1)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ai .ui-ai__lane-name { text-align: left; }
:where([data-look="clean"], [data-look="clean"] *).ui-ai .ui-ai__count { justify-self: start; }
}
/* Slim cards (three columns in a narrow board): the text starts under the spark, so the footer keeps its words */
@container ai-card (max-width: 300px) {
:where([data-look="standard"], [data-look="standard"] *).ui-ai__desc,
:where([data-look="standard"], [data-look="standard"] *).ui-ai__foot { padding-left: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__state:not([data-status="failed"]) .ui-ai__state-word { display: none; }
}
/* Narrow containers: always the list, without the switch */
/* Slim cards (three columns in a narrow board): the text starts under the spark, so the footer keeps its words */
@container aic-card (max-width: 300px) {
:where([data-look="clean"], [data-look="clean"] *).ui-ai__desc,
:where([data-look="clean"], [data-look="clean"] *).ui-ai__foot { padding-left: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__state:is([data-status="running"], [data-status="done"]) .ui-ai__state-word { display: none; }
}
@container (max-width: 360px) {
  .ui-ai__desc, .ui-ai__foot { padding-left: 0; }
  .ui-ai__title { white-space: normal; }
}
@media (pointer: coarse) {
:where([data-look="standard"], [data-look="standard"] *).ui-ai__view { height: 34px; }
:where([data-look="standard"], [data-look="standard"] *).ui-ai__btn { height: 40px; padding: 0 var(--tc-space-4-5, var(--_tc-space-4-5)); }
}
@media (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-ai__view { height: 32px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ai__btn { height: 36px; padding: 0 var(--tc-space-4, var(--_tc-space-4)); }
}
@media (prefers-reduced-motion: reduce) {
  .ui-ai *, .ui-ai *::before, .ui-ai *::after { animation: none !important; transition: none !important; }
}
`;
