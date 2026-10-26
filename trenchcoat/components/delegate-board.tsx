"use client";

/*
 * Delegate Board – hand work to your agents by dragging it onto them, in a single self-contained file.
 * A soft gray tray with the bar on top and a white card below: new tasks on the left ("Unassigned"), the agents on the right – their mark, name and model, a
 * "Free" or "Busy until 14:32" tag and their queue as small chips, the running task first.
 *   · drag a task onto an agent: it lifts and follows the pointer, the agent under it lights up and previews what
 *     changes ("+12m · until 14:44"); on drop the card glides into that agent's queue
 *   · drag a queued chip to another agent to hand it over, or back to the left to unassign it
 *   · the Auto switch: on, every new task goes to the least busy agent on its own, one after another;
 *     off, you drag them yourself
 * Without dragging: click a task (or press Enter) to pick it up, then click an agent – or choose with ↑ ↓ and press
 * Enter; a queued chip can go back to "Unassigned" the same way, or with Delete. 1–9 sends it to that agent at once.
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: delegate-board.tsx is Standard,
 * delegate-board-clean.tsx is Clean). Clean is one white card: the bar with the title and the Auto switch is the
 * card's first row instead of sitting on a gray tray above it.
 */
// Generated from src/components/delegate-board.tsx by scripts/build-lib.mjs – edit the source, not this file.

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ComponentPropsWithoutRef, type KeyboardEvent, type MouseEvent, type PointerEvent as ReactPointerEvent, type ReactNode, type Ref, type RefObject } from "react";

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-db";

export type DelegateAgent = {
  id: string;
  name: string;
  /** Model or role, shown under the name */
  model?: string;
  /** A small mark, e.g. the model maker's logo – defaults to the initials */
  avatar?: ReactNode;
  /** Minutes left on the task it is running now (the first task in its queue), for the "Busy until" time */
  current?: number;
  /** What a minute of its work costs (e.g. 0.05 for $0.05) – shows the price per task when you hand one over */
  rate?: number;
};

export type DelegateTask = {
  id: string;
  title: string;
  /** Rough minutes it takes */
  estimate: number;
  /** Small logos of the tools it works in – up to three */
  tools?: ReactNode[];
  /** Who it is with – leave it out for unassigned. In each queue, the first task is the running one */
  agentId?: string | null;
};

export type DelegateMode = "auto" | "manual";

type DelegateBoardOwnProps = {
  /** Visual style. Defaults to the file's look: Standard in delegate-board.tsx, Clean in delegate-board-clean.tsx */
  look?: Look;
  agents: DelegateAgent[];
  tasks: DelegateTask[];
  /**
   * A drop, a keyboard pick or Auto. The board moves the task at once and keeps it there until `tasks` gives that task
   * another agent – so `tasks` stays the source of truth, whether you handle the move or only listen to it
   */
  onAssign?: (taskId: string, agentId: string | null) => void;
  /** The clock for the "Busy until" times, in epoch ms – without it the board reads the clock after mount */
  now?: number;
  /** Auto hands every unassigned task to the least busy agent on its own; Manual waits for a drag. Controlled when defined */
  mode?: DelegateMode;
  /** The mode on mount when `mode` isn't controlled */
  defaultMode?: DelegateMode;
  /** Called with the new mode, controlled or not */
  onModeChange?: (mode: DelegateMode) => void;
  /** A suggested hand-off, e.g. from your router: the agent lights up and previews the new time, the task is marked */
  suggestion?: { taskId: string; agentId: string } | null;
  /** Formats a cost from rate × minutes – defaults to dollars, e.g. "$0.60" */
  formatCost?: (amount: number) => string;
  title?: string;
  className?: string;
  /** The root element */
  ref?: Ref<HTMLDivElement>;
};

export type DelegateBoardProps = Omit<ComponentPropsWithoutRef<"div">, keyof DelegateBoardOwnProps> & DelegateBoardOwnProps;

/* ---------- Helpers ---------- */

const MIN = 60_000;
const dollars = (n: number) => `$${n < 10 ? n.toFixed(2) : Math.round(n).toLocaleString("en-US")}`;
const EASE = "cubic-bezier(0.32, 0.72, 0.24, 1)";
const hhmm = (t: number) => {
  const d = new Date(t);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/* ---------- Icons ---------- */

const Spark = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
    <path d="M7 1.2c.4 2.9 1.9 4.4 4.8 4.8-2.9.4-4.4 1.9-4.8 4.8C6.6 7.9 5.1 6.4 2.2 6 5.1 5.6 6.6 4.1 7 1.2Z" fill="currentColor" />
    <circle cx="11.6" cy="11.4" r="1.1" fill="currentColor" opacity="0.55" />
  </svg>
);
const GripIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    {[3, 6, 9].map((y) => [4.3, 7.7].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="0.95" fill="currentColor" />))}
  </svg>
);
const Spinner = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className="ui-db__spin">
    <circle cx="6" cy="6" r="4.6" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.6" />
    <path d="M6 1.4a4.6 4.6 0 0 1 4.6 4.6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

/** Pointer and card in screen pixels while dragging; left/top place the lifted card in the board's own pixels */
type Drag = { id: string; x: number; y: number; dx: number; dy: number; w: number; z: number; left: number; top: number; from: "pile" | "queue" };
/** Where a card sat, relative to the board, in screen pixels */
type Box = { left: number; top: number; width: number; height: number };
/** A move made here: the task's agent, and the agent `tasks` gave it then – the move holds while that's unchanged */
type Move = { to: string | null; base: string | null };

/** How much the board is scaled on screen (CSS zoom or transforms on a parent) – screen pixels per CSS pixel */
const scaleOf = (el: HTMLElement | null) => (el && el.offsetWidth ? el.getBoundingClientRect().width / el.offsetWidth : 1);

/** Placed in the board's own pixels, from a pointer position and where on the card it was grabbed */
const placeIn = (root: HTMLElement | null, x: number, y: number, dx: number, dy: number) => {
  const z = scaleOf(root);
  const origin = root?.getBoundingClientRect();
  return { z, left: (x - dx - (origin?.left ?? 0)) / z, top: (y - dy - (origin?.top ?? 0)) / z };
};
const relative = (r: DOMRect, origin: DOMRect): Box => ({ left: r.left - origin.left, top: r.top - origin.top, width: r.width, height: r.height });

/** Where every tracked card sits, relative to the board */
const measureCards = (root: HTMLElement | null, tracked: Map<string, HTMLElement>) => {
  if (!root) return null;
  const origin = root.getBoundingClientRect();
  return new Map([...tracked].map(([id, el]) => [id, relative(el.getBoundingClientRect(), origin)]));
};

/** A stable ref callback per id, filling one map */
function useRefMap() {
  const [m] = useState(() => ({ els: new Map<string, HTMLElement>(), fns: new Map<string, (el: HTMLElement | null) => void>() }));
  const refFor = (id: string) => {
    let fn = m.fns.get(id);
    if (!fn) {
      fn = (el) => {
        if (el) m.els.set(id, el);
        else m.els.delete(id);
      };
      m.fns.set(id, fn);
    }
    return fn;
  };
  return [m.els, refFor] as const;
}

/* ---------- Motion: every card glides from where it was; a dropped card from where it was let go ---------- */

/**
 * Layout is read in handlers and layout effects only, never during render: a move made here measures right before it
 * happens (`snapshot`); one from the parent glides from where the cards were after the last move.
 */
function useCardGlide(rootRef: { current: HTMLElement | null }, shape: string) {
  const [tracked, track] = useRefMap();
  const dropped = useRef<{ id: string; rect: Box } | null>(null);
  const lastShape = useRef(shape);
  const before = useRef<Map<string, Box> | null>(null);
  const snapshot = () => {
    before.current = measureCards(rootRef.current, tracked);
  };
  useLayoutEffect(() => {
    if (lastShape.current === shape) {
      if (!before.current) before.current = measureCards(rootRef.current, tracked);
      return;
    }
    lastShape.current = shape;
    const drop = dropped.current;
    dropped.current = null;
    const from0 = before.current;
    const now0 = measureCards(rootRef.current, tracked);
    before.current = now0;
    if (reducedMotion() || !now0) return;
    const z = scaleOf(rootRef.current);
    for (const [id, el] of tracked) {
      const from = drop?.id === id ? drop.rect : from0?.get(id);
      const to = now0.get(id);
      if (!from || !to) continue;
      const dx = (from.left - to.left) / z;
      const dy = (from.top - to.top) / z;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
      // A card that turned into a chip (or back) glides from where it was and fades in – no stretched text
      const resized = Math.abs(from.width - to.width) > 8 || Math.abs(from.height - to.height) > 4;
      el.animate(
        [
          { transform: `translate(${dx}px, ${dy}px)`, opacity: resized ? 0.4 : 1, zIndex: 3 },
          { transform: "none", opacity: 1, zIndex: 3 },
        ],
        { duration: 480, easing: EASE },
      );
    }
  }, [shape, rootRef, tracked]);
  return { track, snapshot, dropped };
}

/* ---------- Dragging: React hears when a drag starts, ends or changes target – the lifted card moves on its own ---------- */

function useTaskDrag(rootRef: { current: HTMLElement | null }, onDrop: (id: string, target: string, ghost: DOMRect | null) => void, onLift: () => void) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const start = useRef<{ id: string; x: number; y: number; el: HTMLElement; from: Drag["from"] } | null>(null);
  // A drag ends in a click on the card it started on – that click isn't a pick
  const dragged = useRef(false);
  const targetAt = (x: number, y: number) => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const agent = el?.closest<HTMLElement>("[data-agent]");
    if (agent && rootRef.current?.contains(agent)) return agent.dataset.agent ?? null;
    const pileEl = el?.closest<HTMLElement>("[data-pile]");
    if (pileEl && rootRef.current?.contains(pileEl)) return "pile";
    return null;
  };
  const onDown = (e: ReactPointerEvent<HTMLElement>, id: string, from: Drag["from"]) => {
    if (e.button !== 0) return;
    dragged.current = false;
    start.current = { id, x: e.clientX, y: e.clientY, el: e.currentTarget, from };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: ReactPointerEvent<HTMLElement>) => {
    const s = start.current;
    if (!s) return;
    // The lifted card is placed inside the board in its own pixels, so it stays under the pointer even when the
    // board is scaled – measured here, in the handler
    if (!drag) {
      if (Math.hypot(e.clientX - s.x, e.clientY - s.y) < 4) return;
      const r = s.el.getBoundingClientRect();
      const dx = s.x - r.left;
      const dy = s.y - r.top;
      setDrag({ id: s.id, x: e.clientX, y: e.clientY, dx, dy, w: Math.max(r.width, 200), from: s.from, ...placeIn(rootRef.current, e.clientX, e.clientY, dx, dy) });
      onLift();
    } else if (ghostRef.current) {
      // Following the pointer only moves pixels: written straight to the lifted card
      const p = placeIn(rootRef.current, e.clientX, e.clientY, drag.dx, drag.dy);
      ghostRef.current.style.left = `${p.left.toFixed(1)}px`;
      ghostRef.current.style.top = `${p.top.toFixed(1)}px`;
    }
    setOver(targetAt(e.clientX, e.clientY));
  };
  const onUp = (e: ReactPointerEvent<HTMLElement>) => {
    const s = start.current;
    start.current = null;
    if (!s || !drag) return;
    dragged.current = true;
    const target = targetAt(e.clientX, e.clientY);
    const ghost = target ? ghostRef.current?.getBoundingClientRect() ?? null : null;
    setDrag(null);
    setOver(null);
    if (target) onDrop(drag.id, target, ghost);
  };
  const onCancel = () => {
    start.current = null;
    setDrag(null);
    setOver(null);
  };
  /** True once, right after a drag ended – the click that follows is ignored */
  const wasDrag = () => {
    const d = dragged.current;
    dragged.current = false;
    return d;
  };
  return { drag, over, ghostRef, onDown, onMove, onUp, onCancel, wasDrag };
}

/* ---------- Pieces ---------- */

const Tools = ({ t }: { t: DelegateTask }) =>
  t.tools?.length ? (
    <span className="ui-db__tools" aria-hidden="true">
      {t.tools.slice(0, 3).map((tool, k) => (
        <span key={k} className="ui-db__tool">
          {tool}
        </span>
      ))}
    </span>
  ) : null;

type DragHandlers = Pick<ReturnType<typeof useTaskDrag>, "onDown" | "onMove" | "onUp" | "onCancel">;

/** One agent: who it is, how busy (or what a task on its way would add), and its queue as chips */
function AgentRow({
  uid,
  a,
  i,
  q,
  now,
  until,
  preview,
  price,
  moving,
  isTarget,
  dragId,
  pickedId,
  expanded,
  tipOff,
  formatCost,
  track,
  handlers,
  onTaskKey,
  onTaskClick,
  onChoose,
  onHoverChoose,
  onExpand,
  onTipHover,
  onTipOff,
}: {
  uid: string;
  a: DelegateAgent;
  i: number;
  q: DelegateTask[];
  now: number | null;
  until: number | null;
  preview: number | null;
  price: number | null;
  moving?: DelegateTask;
  isTarget: boolean;
  dragId?: string;
  /** A task is picked up (by click or keyboard): a click on this row hands it over */
  pickedId: string | null;
  expanded: boolean;
  tipOff: boolean;
  formatCost: (n: number) => string;
  track: (id: string) => (el: HTMLElement | null) => void;
  handlers: DragHandlers;
  onTaskKey: (e: KeyboardEvent, id: string) => void;
  onTaskClick: (e: MouseEvent, id: string) => void;
  onChoose: (agentId: string) => void;
  onHoverChoose: () => void;
  onExpand: (open: boolean) => void;
  onTipHover: (on: boolean) => void;
  onTipOff: (off: boolean) => void;
}) {
  const shown = expanded ? q : q.slice(0, 3);
  const choosable = pickedId !== null && !q.some((t) => t.id === pickedId);
  return (
    <li
      className="ui-db__agent"
      data-agent={a.id}
      data-target={isTarget ? "" : undefined}
      data-choosable={choosable ? "" : undefined}
      // The pointer half of "pick up, then choose": the keyboard half is ↑ ↓ and Enter on the picked task
      onClick={choosable ? () => onChoose(a.id) : undefined}
      onPointerEnter={choosable ? onHoverChoose : undefined}
    >
      <span className="ui-db__avatar" data-logo={a.avatar ? "" : undefined}>
        {a.avatar ?? initials(a.name)}
      </span>
      <span className="ui-db__who">
        <span className="ui-db__name-line">
          <span className="ui-db__name" title={a.name}>
            {a.name}
          </span>
          <span className="ui-db__key" aria-hidden="true">
            {i + 1}
          </span>
        </span>
        <span className="ui-db__model">
          {a.model}
          {a.rate != null && <span className="ui-db__rate">{formatCost(a.rate)}/min</span>}
        </span>
      </span>
      <span className="ui-db__load">
        {price != null && (
          <span key="price" className="ui-db__price">
            +{formatCost(price)}
          </span>
        )}
        {preview ? (
          <span key="preview" className="ui-db__tag" data-kind="preview">
            +{moving?.estimate}m{now !== null && <> until {hhmm(preview)}</>}
          </span>
        ) : until ? (
          <span key={until} className="ui-db__tag" data-kind="busy">
            {now !== null ? `Busy until ${hhmm(until)}` : "Busy"}
          </span>
        ) : (
          <span key="free" className="ui-db__tag" data-kind="free">
            Free
          </span>
        )}
      </span>
      <ul className="ui-db__queue" aria-label={`${a.name}'s queue`}>
        {shown.map((t, k) => (
          <li key={t.id} ref={track(t.id)} className="ui-db__chip-slot">
            <button
              type="button"
              className="ui-db__chip"
              data-chip-id={t.id}
              data-focus-key={t.id}
              data-running={k === 0 ? "" : undefined}
              data-dragging={dragId === t.id ? "" : undefined}
              data-picked={pickedId === t.id ? "" : undefined}
              title={`${t.title} · ~${t.estimate} min`}
              aria-describedby={`${uid}-how`}
              onPointerDown={(e) => handlers.onDown(e, t.id, "queue")}
              onPointerMove={handlers.onMove}
              onPointerUp={handlers.onUp}
              onPointerCancel={handlers.onCancel}
              onKeyDown={(e) => onTaskKey(e, t.id)}
              onClick={(e) => onTaskClick(e, t.id)}
            >
              {k === 0 ? <Spinner /> : <Tools t={t} />}
              {k === 0 && <span className="ui-db__sr">Running: </span>}
              <span className="ui-db__chip-title">{t.title}</span>
            </button>
          </li>
        ))}
        {/* What does not fit: a "+2" chip – its tasks in a small tooltip on hover or focus, all of them on click */}
        {q.length > 3 && (
          <li
            className="ui-db__more"
            data-tip-off={tipOff || expanded ? "" : undefined}
            onPointerEnter={() => onTipHover(true)}
            onPointerLeave={() => {
              onTipHover(false);
              onTipOff(false);
            }}
          >
            <button
              type="button"
              className="ui-db__chip ui-db__chip--more"
              data-focus-key={`more-${a.id}`}
              aria-label={expanded ? "Show fewer tasks" : `+${q.length - 3} more tasks`}
              aria-expanded={expanded}
              aria-describedby={expanded ? undefined : `${uid}-more-${i}`}
              onClick={(e) => {
                e.stopPropagation();
                onExpand(!expanded);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape" && !tipOff && !expanded) {
                  e.stopPropagation();
                  onTipOff(true);
                }
              }}
              onBlur={() => onTipOff(false)}
            >
              {expanded ? "Fewer" : `+${q.length - 3}`}
            </button>
            {!expanded && (
              <span className="ui-db__tip" id={`${uid}-more-${i}`} role="tooltip">
                <ul className="ui-db__tip-list">
                  {q.slice(3).map((t) => (
                    <li key={t.id}>
                      <Tools t={t} />
                      <span>{t.title}</span>
                      <span className="ui-db__tip-min">~{t.estimate} min</span>
                    </li>
                  ))}
                </ul>
              </span>
            )}
          </li>
        )}
      </ul>
    </li>
  );
}

/* ---------- The component ---------- */

export function DelegateBoard({
  look,
  agents,
  tasks,
  onAssign,
  now: nowProp,
  mode,
  defaultMode = "manual",
  onModeChange,
  suggestion,
  formatCost = dollars,
  title = "Delegate",
  className,
  ref,
  ...rest
}: DelegateBoardProps) {
  const resolvedLook = look ?? DEFAULT_LOOK;
  const uid = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const setRoot = useRootRef(rootRef, ref);
  const [local, setLocal] = useState<Record<string, Move>>({});
  const [picked, setPicked] = useState<string | null>(null);
  const [pickAt, setPickAt] = useState(0);
  const [announce, setAnnounce] = useState("");
  // Queues showing every task, not just the first three
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  // The "+N" tooltip: which agent's is under the pointer, and which one Esc closed
  const [tipHover, setTipHover] = useState<string | null>(null);
  const [tipOff, setTipOff] = useState<string | null>(null);
  // Focus to move after the next render (a chip revealed by "+N")
  const [focusKey, setFocusKey] = useState<string | null>(null);
  // The clock is read after mount (null until then), so a server render and the first client render agree
  const [tick, setTick] = useState<number | null>(null);
  useEffect(() => {
    if (nowProp !== undefined) return;
    const read = () => setTick(Date.now());
    read();
    const id = window.setInterval(read, 30_000);
    return () => window.clearInterval(id);
  }, [nowProp]);
  const now = nowProp ?? tick;
  const [currentMode, setMode] = useControllable(mode, defaultMode, onModeChange, "mode");

  // Moves made here show at once; a task joins the end of its new queue
  const order = useRef<string[]>([]);
  const list = tasks.map((t) => {
    const move = local[t.id];
    return move && move.base === (t.agentId ?? null) ? { ...t, agentId: move.to } : t;
  });
  const sorted = [...list].sort((a, b) => {
    const ia = order.current.indexOf(a.id);
    const ib = order.current.indexOf(b.id);
    return (ia < 0 ? -1 : ia) - (ib < 0 ? -1 : ib);
  });
  const pile = sorted.filter((t) => !t.agentId);
  // Every queue grouped once per render, not filtered again for each question about an agent
  const queues = new Map<string, DelegateTask[]>();
  for (const t of sorted) if (t.agentId) queues.set(t.agentId, [...(queues.get(t.agentId) ?? []), t]);
  const queueOf = (agentId: string) => queues.get(agentId) ?? [];
  const agentById = (id: string) => agents.find((a) => a.id === id);

  /** When an agent is done with everything in its queue – optionally with one more task */
  const busyUntil = (a: DelegateAgent, extra?: DelegateTask) => {
    const q = queueOf(a.id).filter((t) => t.id !== extra?.id);
    if (!q.length && !extra) return null;
    const first = q.length ? (a.current ?? q[0].estimate) : 0;
    const later = q.slice(1).reduce((sum, t) => sum + t.estimate, 0);
    return (now ?? 0) + (first + later + (extra?.estimate ?? 0)) * MIN;
  };

  /** What an agent's remaining queue costs – or one task on it */
  const workLeft = (a: DelegateAgent) => {
    const q = queueOf(a.id);
    return q.length ? (a.current ?? q[0].estimate) + q.slice(1).reduce((sum, t) => sum + t.estimate, 0) : 0;
  };
  const costOf = (a: DelegateAgent, minutes: number) => (a.rate != null ? a.rate * minutes : null);
  const queued = agents.reduce<number | null>((sum, a) => {
    const c = costOf(a, workLeft(a));
    return c == null ? sum : (sum ?? 0) + c;
  }, null);

  const shape = JSON.stringify(sorted.map((t) => [t.id, t.agentId ?? null]));
  const { track, snapshot, dropped } = useCardGlide(rootRef, shape);

  const assign = (taskId: string, agentId: string | null) => {
    const task = list.find((t) => t.id === taskId);
    if (!task || (task.agentId ?? null) === agentId) return;
    snapshot();
    order.current = [...order.current.filter((id) => id !== taskId), taskId];
    const who = agentId ? agentById(agentId)?.name : null;
    setAnnounce(who ? `${task.title} → ${who}` : `${task.title} is unassigned again`);
    const base = tasks.find((t) => t.id === taskId)?.agentId ?? null;
    setLocal((l) => ({ ...l, [taskId]: { to: agentId, base } }));
    onAssign?.(taskId, agentId);
  };

  const { drag, over, ghostRef, ...handlers } = useTaskDrag(
    rootRef,
    (id, target, ghost) => {
      if (ghost && rootRef.current) dropped.current = { id, rect: relative(ghost, rootRef.current.getBoundingClientRect()) };
      assign(id, target === "pile" ? null : target);
    },
    () => setPicked(null),
  );

  /** The agent that is free soonest */
  const leastBusy = () => [...agents].sort((a, b) => (busyUntil(a) ?? now ?? 0) - (busyUntil(b) ?? now ?? 0))[0];

  // Auto: the next unassigned task goes to the least busy agent, one about every second
  const nextId = pile[0]?.id;
  useEffect(() => {
    if (currentMode !== "auto" || !nextId || drag) return;
    const id = window.setTimeout(() => {
      const who = leastBusy();
      if (who) assign(nextId, who.id);
    }, reducedMotion() ? 0 : 900);
    return () => window.clearTimeout(id);
  }, [currentMode, nextId, drag]); // eslint-disable-line react-hooks/exhaustive-deps -- one hand-off per next task; the rest is read fresh

  /* ---------- Pick up, choose, drop – by keyboard or by clicks ---------- */

  const pickedTask = picked ? list.find((t) => t.id === picked) : undefined;
  // The choices while a task is picked: every agent, then "Unassigned" for a task that has one
  const choices: Array<string | null> = [...agents.map((a) => a.id), ...(pickedTask?.agentId ? [null] : [])];
  const choice = picked ? choices[Math.min(pickAt, choices.length - 1)] : undefined;
  const describe = (to: string | null | undefined, task?: DelegateTask) => {
    if (to === null) return "Unassigned";
    const a = to ? agentById(to) : undefined;
    if (!a || !task) return "";
    if (task.agentId === a.id) return `${a.name}, already there`;
    const until = busyUntil(a, task);
    return `${a.name}: +${task.estimate} min${now !== null && until ? `, until ${hhmm(until)}` : ""}`;
  };
  const pick = (id: string) => {
    setPicked(id);
    setPickAt(0);
    const t = list.find((x) => x.id === id);
    setAnnounce(`Picked up ${t?.title}. Choose an agent with the arrow keys and press Enter, or click an agent. ${describe(agents[0]?.id, t)}`);
  };
  const drop = (to: string | null) => {
    if (!picked) return;
    if (pickedTask && (pickedTask.agentId ?? null) === to) setAnnounce(`${pickedTask.title} stays with ${describe(to, pickedTask).split(",")[0]}`);
    else {
      assign(picked, to);
      setFocusKey(picked);
    }
    setPicked(null);
  };
  const cancel = () => {
    setPicked(null);
    setAnnounce("Put back");
  };

  // Esc closes the "+N" tooltip under the pointer, wherever focus is (1.4.13)
  useEffect(() => {
    if (!tipHover) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setTipOff(tipHover);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tipHover]);

  // Focus follows a task moved from the keyboard (or a chip "+N" revealed) – after the render that shows it, and only
  // while focus is still on the board or fell to <body> with the old card
  useLayoutEffect(() => {
    if (!focusKey) return;
    setFocusKey(null);
    const active = document.activeElement;
    if (active && active !== document.body && !rootRef.current?.contains(active)) return;
    rootRef.current?.querySelector<HTMLElement>(`[data-focus-key="${CSS.escape(focusKey)}"]`)?.focus();
  }, [focusKey]);

  // Focus never falls to <body>: a moved task keeps it (same data-focus-key in its new place); a task now hidden
  // behind "+N" hands it to that chip; otherwise the first task left
  useFocusRescue(rootRef, {
    fallback: (key) => {
      const root = rootRef.current;
      const t = key ? list.find((x) => x.id === key) : undefined;
      if (root && t?.agentId) return root.querySelector(`[data-focus-key="${CSS.escape(`more-${t.agentId}`)}"]`);
      return root?.querySelector(".ui-db__task, .ui-db__chip");
    },
  });

  const onTaskKey = (e: KeyboardEvent, id: string) => {
    if (e.nativeEvent.isComposing) return;
    const n = Number(e.key);
    if (e.key.length === 1 && n >= 1 && n <= agents.length) {
      e.preventDefault();
      assign(id, agents[n - 1].id);
      setFocusKey(id);
      setPicked(null);
      return;
    }
    if (picked === id) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const next = (Math.min(pickAt, choices.length - 1) + (e.key === "ArrowDown" ? 1 : -1) + choices.length) % choices.length;
        setPickAt(next);
        setAnnounce(describe(choices[next], pickedTask));
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        drop(choice ?? null);
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        cancel();
      }
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pick(id);
    } else if ((e.key === "Delete" || e.key === "Backspace") && list.find((t) => t.id === id)?.agentId) {
      e.preventDefault();
      assign(id, null);
      setFocusKey(id);
    }
  };
  /** A click: a pointer picks up or puts back; a click without a pointer (assistive tech) acts like Enter */
  const onTaskClick = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    if (handlers.wasDrag()) return;
    if (picked !== id) pick(id);
    else if (e.detail === 0) drop(choice ?? null);
    else cancel();
  };
  const target = drag ? over : picked ? (choice === null ? "pile" : choice) : (suggestion?.agentId ?? null);
  const moving = list.find((t) => t.id === (drag?.id ?? picked ?? suggestion?.taskId));

  const card = (t: DelegateTask) => (
    <li key={t.id} ref={track(t.id)} className="ui-db__task-slot">
      <button
        type="button"
        className="ui-db__task"
        data-task-id={t.id}
        data-focus-key={t.id}
        data-dragging={drag?.id === t.id ? "" : undefined}
        data-picked={picked === t.id || suggestion?.taskId === t.id ? "" : undefined}
        aria-describedby={`${uid}-how`}
        onPointerDown={(e) => handlers.onDown(e, t.id, "pile")}
        onPointerMove={handlers.onMove}
        onPointerUp={handlers.onUp}
        onPointerCancel={handlers.onCancel}
        onKeyDown={(e) => onTaskKey(e, t.id)}
        onClick={(e) => onTaskClick(e, t.id)}
      >
        <span className="ui-db__grip">
          <GripIcon />
        </span>
        <span className="ui-db__task-main">
          <span className="ui-db__task-title" title={t.title}>
            {t.title}
          </span>
          <span className="ui-db__task-meta">
            <Tools t={t} />~{t.estimate} min
          </span>
        </span>
      </button>
    </li>
  );

  // The bar: on the tray above the card (Standard), or the card's first row (Clean)
  const bar = (
    <header className="ui-db__bar">
      <span className="ui-db__spark">
        <Spark />
      </span>
      <span className="ui-db__title">{title}</span>
      <span className="ui-db__hint">{picked ? "Click an agent to hand it over" : currentMode === "auto" ? "New tasks go to whoever is free first" : "Drag a task onto an agent"}</span>
      {/* Auto as a switch: the word stays strong while it is on, and fades with the switch when it is off */}
      <button type="button" role="switch" aria-checked={currentMode === "auto"} className="ui-db__auto" onClick={() => setMode(currentMode === "auto" ? "manual" : "auto")}>
        <span className="ui-db__auto-label">Auto</span>
        <span className="ui-db__switch" aria-hidden="true">
          <span />
        </span>
      </button>
    </header>
  );

  return (
    <div {...rest} ref={setRoot} className={[ROOT_CLASS, className].filter(Boolean).join(" ")} data-look={resolvedLook} data-dragging={drag ? "" : undefined}>
      <style href="ui-delegate-board" precedence="default">
        {css}
      </style>

      {resolvedLook === "standard" && bar}

      <div className="ui-db__card">
        {resolvedLook === "clean" && bar}

        <div className="ui-db__body">
          {/* ----- New work ----- */}
          <section
            className="ui-db__pile"
            data-pile=""
            data-over={(over === "pile" && drag?.from === "queue") || target === "pile" ? "" : undefined}
            data-choosable={pickedTask?.agentId ? "" : undefined}
            aria-labelledby={`${uid}-pile`}
            // A picked queued task goes back here on a click
            onClick={pickedTask?.agentId ? () => drop(null) : undefined}
            onPointerEnter={pickedTask?.agentId ? () => setPickAt(choices.length - 1) : undefined}
          >
            <h4 className="ui-db__head" id={`${uid}-pile`}>
              Unassigned <span className="ui-db__count">{pile.length}</span>
            </h4>
            <ul className="ui-db__tasks">
              {pile.map(card)}
              {pile.length === 0 && <li className="ui-db__empty">Everything is handed out</li>}
            </ul>
          </section>

          {/* ----- Who does it ----- */}
          <section className="ui-db__agents" aria-labelledby={`${uid}-agents`}>
            <h4 className="ui-db__head" id={`${uid}-agents`}>
              Agents
              {queued != null && queued > 0 && (
                <span className="ui-db__spend" key={Math.round(queued * 100)}>
                  {formatCost(queued)} in queues
                </span>
              )}
            </h4>
            <ul className="ui-db__roster">
              {agents.map((a, i) => {
                const isTarget = target === a.id;
                const preview = isTarget && moving && moving.agentId !== a.id ? busyUntil(a, moving) : null;
                return (
                  <AgentRow
                    key={a.id}
                    uid={uid}
                    a={a}
                    i={i}
                    q={queueOf(a.id)}
                    now={now}
                    until={busyUntil(a)}
                    preview={preview}
                    price={preview && moving ? costOf(a, moving.estimate) : null}
                    moving={moving}
                    isTarget={isTarget}
                    dragId={drag?.id}
                    pickedId={picked}
                    expanded={!!expanded[a.id]}
                    tipOff={tipOff === a.id}
                    formatCost={formatCost}
                    track={track}
                    handlers={handlers}
                    onTaskKey={onTaskKey}
                    onTaskClick={onTaskClick}
                    onChoose={(id) => drop(id)}
                    onHoverChoose={() => setPickAt(i)}
                    onExpand={(open) => {
                      // Folding the queue back: focus on a chip that goes away moves to the "+N" chip first
                      if (!open) rescueFocus(rootRef.current?.querySelector(`[data-agent="${CSS.escape(a.id)}"] .ui-db__queue`), [() => rootRef.current?.querySelector(`[data-focus-key="${CSS.escape(`more-${a.id}`)}"]`)]);
                      setExpanded((x) => ({ ...x, [a.id]: open }));
                      const first = queueOf(a.id)[3];
                      if (open && first) setFocusKey(first.id);
                    }}
                    onTipHover={(on) => setTipHover(on ? a.id : null)}
                    onTipOff={(off) => setTipOff(off ? a.id : null)}
                  />
                );
              })}
            </ul>
          </section>
        </div>
      </div>

      {/* The lifted card under the pointer – placed when it was lifted, then moved by the pointer handler */}
      {drag && moving && (
        <div ref={ghostRef} className="ui-db__ghost" style={{ left: `${drag.left.toFixed(1)}px`, top: `${drag.top.toFixed(1)}px`, width: drag.w / drag.z }} aria-hidden="true">
          <span className="ui-db__grip">
            <GripIcon />
          </span>
          <span className="ui-db__task-main">
            <span className="ui-db__task-title">{moving.title}</span>
            <span className="ui-db__task-meta">
              <Tools t={moving} />~{moving.estimate} min
            </span>
          </span>
        </div>
      )}

      <span className="ui-db__sr" id={`${uid}-how`}>
        Drag onto an agent, or click it and then click an agent. With the keyboard: Enter picks it up, the arrow keys choose,
        Enter hands it over, Escape puts it back. Number keys hand it over at once; Delete unassigns a queued task.
      </span>
      <span className="ui-db__sr" role="status">
        {announce}
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
.ui-db:where([data-look="standard"]),
.ui-db__portal:where([data-look="standard"]) {
  --_tc-accent-subtle: light-dark(rgba(47, 107, 255, 0.08), rgba(79, 130, 255, 0.16));
  --_tc-accent-text: light-dark(#2456d6, #8ab4ff);
  --_tc-avatar-radius-agent: 6px;
  --_tc-border-default: light-dark(#ececec, #2a2a2e);
  --_tc-border-selected: light-dark(#2f68ff, #6b95ff);
  --_tc-card-radius: 16px;
  --_tc-card-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-card-shadow-hover: 0 0 0 1px light-dark(#dedede, #3a3a40), 0 6px 16px -8px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-control-radius-sm: 8px;
  --_tc-divider: light-dark(#ececec, #2a2a2e);
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-reveal-slow: 900ms;
  --_tc-ease-emphasized: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring-offset: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-2xs: 10px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-xs: 11px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-strong: 600;
  --_tc-hairline: 1px;
  --_tc-kbd-bg: light-dark(#ffffff, #19191b);
  --_tc-kbd-fg: light-dark(#404040, #c8c8cc);
  --_tc-kbd-font-size: 10.5px;
  --_tc-kbd-font-weight: 500;
  --_tc-kbd-h: 18px;
  --_tc-kbd-px: 4px;
  --_tc-kbd-radius: 5px;
  --_tc-kbd-shadow: inset 0 0 0 1px light-dark(#dedede, #3a3a40), 0 1px 0 light-dark(#ececec, #2a2a2e);
  --_tc-line-height-none: 1;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-tight: 16px;
  --_tc-pill-font-size: 11px;
  --_tc-pill-font-weight: 500;
  --_tc-pill-h: 20px;
  --_tc-pill-px: 8px;
  --_tc-pill-radius: 999px;
  --_tc-radius-badge: 999px;
  --_tc-radius-full: 999px;
  --_tc-radius-lg: 10px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xl: 12px;
  --_tc-shadow-control: 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-shadow-overlay: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 16px 36px -12px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-shadow-raised: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-space-0-5: 2px;
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-2: 8px;
  --_tc-space-2-5: 10px;
  --_tc-space-3: 12px;
  --_tc-space-3-5: 14px;
  --_tc-space-4: 16px;
  --_tc-status-success-bg: light-dark(#e6f6ec, #12301f);
  --_tc-status-success-fg: light-dark(#18794e, #3dd68c);
  --_tc-surface-raised: light-dark(#ffffff, #19191b);
  --_tc-surface-sunken: light-dark(#f0f0f0, #111113);
  --_tc-surface-tray: light-dark(#f0f0f0, #19191b);
  --_tc-switch-h: 20px;
  --_tc-switch-knob: 16px;
  --_tc-switch-knob-bg: #ffffff;
  --_tc-switch-off: light-dark(#858585, #7c7c82);
  --_tc-switch-on: #2f68ff;
  --_tc-switch-radius: 999px;
  --_tc-switch-w: 32px;
  --_tc-text-disabled: light-dark(#a3a3a3, #5c5c63);
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
  --_tc-z-drag: 90;
  --_tc-z-dropdown: 30;
}
.ui-db:where([data-look="clean"]),
.ui-db__portal:where([data-look="clean"]) {
  --_tc-accent-subtle: light-dark(rgba(0, 96, 226, 0.06), rgba(77, 141, 255, 0.14));
  --_tc-accent-text: light-dark(#0058cf, #70b8ff);
  --_tc-avatar-radius-agent: 6px;
  --_tc-border-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-border-selected: light-dark(#0060e2, #5b9aff);
  --_tc-card-radius: 10px;
  --_tc-card-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-card-shadow-hover: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 3px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-radius-sm: 6px;
  --_tc-divider: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-reveal-slow: 900ms;
  --_tc-ease-emphasized: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring-offset: 1px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-2xs: 10px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-xs: 11px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-strong: 500;
  --_tc-hairline: 0.5px;
  --_tc-kbd-bg: light-dark(#ffffff, #1c1c1e);
  --_tc-kbd-fg: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-kbd-font-size: 10px;
  --_tc-kbd-font-weight: 500;
  --_tc-kbd-h: 16px;
  --_tc-kbd-px: 4px;
  --_tc-kbd-radius: 4px;
  --_tc-kbd-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-line-height-none: 1;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-tight: 16px;
  --_tc-pill-font-size: 11px;
  --_tc-pill-font-weight: 500;
  --_tc-pill-h: 18px;
  --_tc-pill-px: 6px;
  --_tc-pill-radius: 5px;
  --_tc-radius-badge: 5px;
  --_tc-radius-full: 999px;
  --_tc-radius-lg: 10px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xl: 12px;
  --_tc-shadow-control: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-shadow-overlay: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 12px 28px -10px light-dark(rgba(0, 0, 0, 0.16), rgba(0, 0, 0, 0.6)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-shadow-raised: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-space-0-5: 2px;
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-2: 8px;
  --_tc-space-2-5: 10px;
  --_tc-space-3: 12px;
  --_tc-space-3-5: 14px;
  --_tc-space-4: 16px;
  --_tc-status-success-bg: light-dark(rgba(0, 164, 51, 0.1), rgba(0, 240, 74, 0.12));
  --_tc-status-success-fg: light-dark(#18794e, #3dd68c);
  --_tc-surface-raised: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-sunken: light-dark(#f7f7f7, #161618);
  --_tc-surface-tray: light-dark(#f7f7f7, #161618);
  --_tc-switch-h: 16px;
  --_tc-switch-knob: 12px;
  --_tc-switch-knob-bg: #ffffff;
  --_tc-switch-off: light-dark(rgba(0, 0, 0, 0.48), rgba(255, 255, 255, 0.4));
  --_tc-switch-on: light-dark(#0060e2, #1a6cf0);
  --_tc-switch-radius: 5px;
  --_tc-switch-w: 28px;
  --_tc-text-disabled: light-dark(rgba(0, 0, 0, 0.27), rgba(255, 255, 255, 0.3));
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
  --_tc-z-drag: 90;
  --_tc-z-dropdown: 30;
}
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

/* Colors and motion as variables – override them on .ui-db */
:where([data-look="standard"], [data-look="standard"] *).ui-db {
  --tc-delegate-board-target-bg: light-dark(rgba(47, 107, 255, 0.045), rgba(91, 154, 255, 0.08));
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 720px;
  padding: var(--tc-tray-inset, var(--_tc-tray-inset));
  border-radius: var(--tc-tray-radius, var(--_tc-tray-radius));
  background: var(--tc-surface-tray, var(--_tc-surface-tray));
  container-type: inline-size;
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  letter-spacing: -0.006em;
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-text-muted, var(--_tc-text-muted));
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on .ui-db */
:where([data-look="clean"], [data-look="clean"] *).ui-db {
  --tc-delegate-board-target-bg: light-dark(rgba(0, 120, 245, 0.045), rgba(91, 154, 255, 0.08));
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 720px;
  container-type: inline-size;
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
.ui-db[data-dragging] { cursor: grabbing; user-select: none; -webkit-user-select: none; }
.ui-db *, .ui-db *::before, .ui-db *::after { box-sizing: border-box; }
:where(.ui-db) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.ui-db button:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
.ui-db ul { margin: 0; padding: 0; list-style: none; }
.ui-db h4 { margin: 0; }
.ui-db svg { display: block; flex: none; }
.ui-db__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* The white card holds the pile and the agents */
.ui-db__card { border-radius: var(--tc-card-radius, var(--_tc-card-radius)); background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow)); }
/* ----- On the tray ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-db__bar { display: flex; align-items: center; gap: var(--tc-space-2-5, var(--_tc-space-2-5)); min-width: 0; padding: var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-1-5, var(--_tc-space-1-5)) var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-3-5, var(--_tc-space-3-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-db__bar { display: flex; align-items: center; gap: var(--tc-space-2-5, var(--_tc-space-2-5)); min-width: 0; padding: var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-4, var(--_tc-space-4)); border-bottom: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider)); }
.ui-db__spark { display: grid; flex: none; place-items: center; width: 16px; color: var(--tc-accent-text, var(--_tc-accent-text)); }
.ui-db__title { font-weight: var(--tc-font-weight-strong, var(--_tc-font-weight-strong)); color: var(--tc-text-strong, var(--_tc-text-strong)); white-space: nowrap; }
.ui-db__hint { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; text-overflow: ellipsis; }
/* Auto: a label and a switch – on, the word is strong and the track filled; off, the word is muted */
.ui-db__auto { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-2, var(--_tc-space-2)); min-height: 28px; padding: 0 var(--tc-space-0-5, var(--_tc-space-0-5)) 0 var(--tc-space-1-5, var(--_tc-space-1-5)); border-radius: var(--tc-control-radius-sm, var(--_tc-control-radius-sm)); }
:where([data-look="standard"], [data-look="standard"] *).ui-db__auto-label { font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-strong, var(--_tc-text-strong)); transition: color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-db__auto-label { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-strong, var(--_tc-text-strong)); transition: color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-db__auto[aria-checked="false"] .ui-db__auto-label { color: var(--tc-text-muted, var(--_tc-text-muted)); }
.ui-db__switch { position: relative; flex: none; width: var(--tc-switch-w, var(--_tc-switch-w)); height: var(--tc-switch-h, var(--_tc-switch-h)); border-radius: var(--tc-switch-radius, var(--_tc-switch-radius)); background: var(--tc-switch-off, var(--_tc-switch-off)); transition: background-color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-db__switch > span { position: absolute; top: calc((var(--tc-switch-h, var(--_tc-switch-h)) - var(--tc-switch-knob, var(--_tc-switch-knob))) / 2); left: calc((var(--tc-switch-h, var(--_tc-switch-h)) - var(--tc-switch-knob, var(--_tc-switch-knob))) / 2); width: var(--tc-switch-knob, var(--_tc-switch-knob)); height: var(--tc-switch-knob, var(--_tc-switch-knob)); border-radius: calc(var(--tc-switch-radius, var(--_tc-switch-radius)) - (var(--tc-switch-h, var(--_tc-switch-h)) - var(--tc-switch-knob, var(--_tc-switch-knob))) / 2); background: var(--tc-switch-knob-bg, var(--_tc-switch-knob-bg)); box-shadow: var(--tc-shadow-control, var(--_tc-shadow-control)); transition: transform var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-emphasized, var(--_tc-ease-emphasized)); }
.ui-db__auto[aria-checked="true"] .ui-db__switch { background: var(--tc-switch-on, var(--_tc-switch-on)); }
.ui-db__auto[aria-checked="true"] .ui-db__switch > span { transform: translateX(calc(var(--tc-switch-w, var(--_tc-switch-w)) - var(--tc-switch-h, var(--_tc-switch-h)))); }
.ui-db__body { display: grid; grid-template-columns: 236px minmax(0, 1fr); }
.ui-db__head { display: flex; align-items: center; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); margin: 0 var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-2, var(--_tc-space-2)) !important; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
.ui-db__count { display: grid; place-items: center; min-width: 16px; height: 16px; padding: 0 var(--tc-space-1, var(--_tc-space-1)); border-radius: var(--tc-radius-badge, var(--_tc-radius-badge)); background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)); font-size: var(--tc-font-size-2xs, var(--_tc-font-size-2xs)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-db__count { color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
/* ----- The pile ----- */
/* New work sits in a soft gray area, like the columns of Agent Inbox */
:where([data-look="standard"], [data-look="standard"] *).ui-db__pile { margin: var(--tc-space-3, var(--_tc-space-3)) 0 var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-3, var(--_tc-space-3)); padding: var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-1-5, var(--_tc-space-1-5)) var(--tc-space-1-5, var(--_tc-space-1-5)); border-radius: var(--tc-radius-xl, var(--_tc-radius-xl)); background: var(--tc-surface-sunken, var(--_tc-surface-sunken)); transition: background-color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-db__pile { margin: var(--tc-space-3, var(--_tc-space-3)) 0 var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-3, var(--_tc-space-3)); padding: var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-1-5, var(--_tc-space-1-5)) var(--tc-space-1-5, var(--_tc-space-1-5)); border-radius: var(--tc-radius-lg, var(--_tc-radius-lg)); background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); transition: background-color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-db__pile .ui-db__head { margin-left: var(--tc-space-1-5, var(--_tc-space-1-5)) !important; }
.ui-db__pile[data-over] { box-shadow: inset 0 0 0 1px var(--tc-border-selected, var(--_tc-border-selected)); }
.ui-db__pile[data-choosable], .ui-db__agent[data-choosable] { cursor: pointer; }
.ui-db__tasks { display: grid; gap: var(--tc-space-1, var(--_tc-space-1)); }
:where([data-look="standard"], [data-look="standard"] *).ui-db__task,
:where([data-look="standard"], [data-look="standard"] *).ui-db__ghost { display: flex; align-items: flex-start; gap: var(--tc-space-2, var(--_tc-space-2)); width: 100%; padding: var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-2, var(--_tc-space-2)); border-radius: var(--tc-radius-xl, var(--_tc-radius-xl)); background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow)); cursor: grab; touch-action: none; transition: opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-db__task,
:where([data-look="clean"], [data-look="clean"] *).ui-db__ghost { display: flex; align-items: flex-start; gap: var(--tc-space-2, var(--_tc-space-2)); width: 100%; padding: var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-1-5, var(--_tc-space-1-5)); border-radius: var(--tc-radius-md, var(--_tc-radius-md)); background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow)); cursor: grab; touch-action: none; transition: opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-db__task:hover { box-shadow: var(--tc-card-shadow-hover, var(--_tc-card-shadow-hover)); }
.ui-db__task[data-dragging], .ui-db__chip[data-dragging] { opacity: 0.35; }
/* Picked up (click or Enter): a 1px selected edge, not only a tint */
.ui-db__task[data-picked], .ui-db__chip[data-picked] { background: var(--tc-delegate-board-target-bg); box-shadow: inset 0 0 0 1px var(--tc-border-selected, var(--_tc-border-selected)), var(--tc-shadow-raised, var(--_tc-shadow-raised)); }
.ui-db__grip { display: grid; flex: none; place-items: center; width: 12px; height: 20px; color: var(--tc-text-disabled, var(--_tc-text-disabled)); }
.ui-db__task-main { display: grid; gap: var(--tc-space-0-5, var(--_tc-space-0-5)); min-width: 0; }
.ui-db__task-title { overflow: hidden; font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-primary, var(--_tc-text-primary)); white-space: nowrap; text-overflow: ellipsis; }
.ui-db__task-meta { display: flex; align-items: center; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; }
.ui-db__tools { display: flex; gap: var(--tc-space-1, var(--_tc-space-1)); }
.ui-db__tool, .ui-db__tool > svg { display: grid; width: 12px; height: 12px; }
/* Empty: just a quiet line on the gray area */
.ui-db__empty { display: grid; place-items: center; min-height: 52px; padding: var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-2-5, var(--_tc-space-2-5)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); text-align: center; }
/* The lifted card: tilted a touch, a deeper shadow, under the pointer */
.ui-db__ghost { position: absolute; z-index: var(--tc-z-drag, var(--_tc-z-drag)); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)); cursor: grabbing; pointer-events: none; transform: rotate(1.5deg) scale(1.02); }
/* ----- The agents ----- */
.ui-db__agents { padding: var(--tc-space-3-5, var(--_tc-space-3-5)) var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-3, var(--_tc-space-3)); }
.ui-db__roster { display: grid; gap: var(--tc-space-1, var(--_tc-space-1)); }
:where([data-look="standard"], [data-look="standard"] *).ui-db__agent { display: grid; grid-template-columns: 30px minmax(0, 1fr) auto; grid-template-areas: "avatar who load" "avatar queue queue"; column-gap: var(--tc-space-3, var(--_tc-space-3)); row-gap: var(--tc-space-2, var(--_tc-space-2)); padding: var(--tc-space-2-5, var(--_tc-space-2-5)); border-radius: var(--tc-radius-xl, var(--_tc-radius-xl)); transition: background-color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-db__agent { display: grid; grid-template-columns: 28px minmax(0, 1fr) auto; grid-template-areas: "avatar who load" "avatar queue queue"; column-gap: var(--tc-space-2-5, var(--_tc-space-2-5)); row-gap: var(--tc-space-1-5, var(--_tc-space-1-5)); padding: var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-2, var(--_tc-space-2)); border-radius: var(--tc-radius-md, var(--_tc-radius-md)); transition: background-color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-db[data-dragging] .ui-db__agent { box-shadow: inset 0 0 0 var(--tc-hairline, var(--_tc-hairline)) var(--tc-border-default, var(--_tc-border-default)); }
/* The agent under a dragged or picked task: a light blue wash and the selected edge */
.ui-db .ui-db__agent[data-target] { background: var(--tc-delegate-board-target-bg); box-shadow: inset 0 0 0 1px var(--tc-border-selected, var(--_tc-border-selected)); }
/* Agents are rounded squares in both looks (people are circles) */
:where([data-look="standard"], [data-look="standard"] *).ui-db__avatar { grid-area: avatar; display: grid; place-items: center; width: 30px; height: 30px; border-radius: var(--tc-avatar-radius-agent, var(--_tc-avatar-radius-agent)); background: var(--tc-fill-default, var(--_tc-fill-default)); font-size: var(--tc-font-size-2xs, var(--_tc-font-size-2xs)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-db__avatar { grid-area: avatar; display: grid; place-items: center; width: 28px; height: 28px; border-radius: var(--tc-avatar-radius-agent, var(--_tc-avatar-radius-agent)); background: var(--tc-fill-default, var(--_tc-fill-default)); font-size: var(--tc-font-size-2xs, var(--_tc-font-size-2xs)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
.ui-db__avatar[data-logo] { background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)); }
.ui-db__avatar > svg { width: 15px; height: 15px; }
.ui-db__who { grid-area: who; display: grid; min-width: 0; }
.ui-db__name-line { display: flex; align-items: center; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); min-width: 0; }
.ui-db__name { overflow: hidden; font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-primary, var(--_tc-text-primary)); white-space: nowrap; text-overflow: ellipsis; }
.ui-db__key { display: none; place-items: center; flex: none; min-width: var(--tc-kbd-h, var(--_tc-kbd-h)); height: var(--tc-kbd-h, var(--_tc-kbd-h)); padding: 0 var(--tc-kbd-px, var(--_tc-kbd-px)); border-radius: var(--tc-kbd-radius, var(--_tc-kbd-radius)); background: var(--tc-kbd-bg, var(--_tc-kbd-bg)); box-shadow: var(--tc-kbd-shadow, var(--_tc-kbd-shadow)); font-size: var(--tc-kbd-font-size, var(--_tc-kbd-font-size)); font-weight: var(--tc-kbd-font-weight, var(--_tc-kbd-font-weight)); line-height: var(--tc-line-height-none, var(--_tc-line-height-none)); color: var(--tc-kbd-fg, var(--_tc-kbd-fg)); }
.ui-db:focus-within .ui-db__key { display: grid; }
.ui-db__model { overflow: hidden; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; text-overflow: ellipsis; }
.ui-db__load { grid-area: load; align-self: start; display: flex; align-items: center; gap: var(--tc-space-2, var(--_tc-space-2)); }
.ui-db__spend { margin-left: auto; font-variant-numeric: tabular-nums; animation: ui-db-in var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-emphasized, var(--_tc-ease-emphasized)) both; }
/* The price per minute sits after the model in a lighter grey, the hand-off price as quiet text next to the tag – no extra pills */
.ui-db__rate { margin-left: var(--tc-space-1-5, var(--_tc-space-1-5)); color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; }
.ui-db__price { font-size: var(--tc-font-size-xs, var(--_tc-font-size-xs)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-accent-text, var(--_tc-accent-text)); white-space: nowrap; font-variant-numeric: tabular-nums; animation: ui-db-in var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-emphasized, var(--_tc-ease-emphasized)) both; }
/* Free / Busy / the preview: status pills */
.ui-db__tag { display: inline-flex; align-items: center; height: var(--tc-pill-h, var(--_tc-pill-h)); padding: 0 var(--tc-pill-px, var(--_tc-pill-px)); border-radius: var(--tc-pill-radius, var(--_tc-pill-radius)); font-size: var(--tc-pill-font-size, var(--_tc-pill-font-size)); font-weight: var(--tc-pill-font-weight, var(--_tc-pill-font-weight)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); white-space: nowrap; font-variant-numeric: tabular-nums; animation: ui-db-in var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-emphasized, var(--_tc-ease-emphasized)) both; }
.ui-db__tag[data-kind="free"] { background: var(--tc-status-success-bg, var(--_tc-status-success-bg)); color: var(--tc-status-success-fg, var(--_tc-status-success-fg)); }
:where([data-look="standard"], [data-look="standard"] *).ui-db__tag[data-kind="busy"] { background: var(--tc-fill-default, var(--_tc-fill-default)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-db__tag[data-kind="busy"] { background: var(--tc-fill-default, var(--_tc-fill-default)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
.ui-db__tag[data-kind="preview"] { background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)); color: var(--tc-accent-text, var(--_tc-accent-text)); }
.ui-db__queue { grid-area: queue; display: flex; flex-wrap: wrap; gap: var(--tc-space-1, var(--_tc-space-1)); min-width: 0; }
.ui-db__queue:empty { display: none; }
.ui-db__chip-slot { min-width: 0; max-width: 100%; }
:where([data-look="standard"], [data-look="standard"] *).ui-db__chip { display: flex; align-items: center; gap: var(--tc-space-1, var(--_tc-space-1)); max-width: 100%; height: 26px; padding: 0 var(--tc-space-2-5, var(--_tc-space-2-5)) 0 var(--tc-space-2, var(--_tc-space-2)); border-radius: var(--tc-radius-full, var(--_tc-radius-full)); background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); cursor: grab; touch-action: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-db__chip { display: flex; align-items: center; gap: var(--tc-space-1, var(--_tc-space-1)); max-width: 100%; height: 24px; padding: 0 var(--tc-space-2, var(--_tc-space-2)) 0 var(--tc-space-1-5, var(--_tc-space-1-5)); border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); cursor: grab; touch-action: none; }
/* The running task: accent tint, accent text, medium weight – and the spinner, which is the non-colour cue */
.ui-db__chip[data-running] { background: var(--tc-accent-subtle, var(--_tc-accent-subtle)); box-shadow: none; color: var(--tc-accent-text, var(--_tc-accent-text)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); }
.ui-db__chip-title { min-width: 0; max-width: 150px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ui-db__more { position: relative; }
:where([data-look="standard"], [data-look="standard"] *).ui-db__chip--more { padding: 0 var(--tc-space-2, var(--_tc-space-2)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-muted, var(--_tc-text-muted)); cursor: pointer; }
:where([data-look="clean"], [data-look="clean"] *).ui-db__chip--more { padding: 0 var(--tc-space-2, var(--_tc-space-2)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); cursor: pointer; }
/* The tooltip: the tooltip spec – ink with its own text colour, light in dark mode. Hoverable: a bridge covers the gap */
.ui-db__tip { position: absolute; bottom: calc(100% + 6px); left: 50%; z-index: var(--tc-z-dropdown, var(--_tc-z-dropdown)); display: grid; width: max-content; max-width: min(320px, 80vw); padding: var(--tc-tooltip-py, var(--_tc-tooltip-py)) var(--tc-tooltip-px, var(--_tc-tooltip-px)); border-radius: var(--tc-tooltip-radius, var(--_tc-tooltip-radius)); background: var(--tc-tooltip-bg, var(--_tc-tooltip-bg)); box-shadow: var(--tc-shadow-overlay, var(--_tc-shadow-overlay)); font-size: var(--tc-tooltip-font-size, var(--_tc-tooltip-font-size)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-tooltip-fg, var(--_tc-tooltip-fg)); text-align: left; opacity: 0; visibility: hidden; transform: translate(-50%, 3px); transition: opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), visibility 0s linear var(--tc-duration-fast, var(--_tc-duration-fast)); }
.ui-db__tip::after { content: ""; position: absolute; top: 100%; right: 0; left: 0; height: 8px; }
.ui-db__more:hover .ui-db__tip, .ui-db__more:focus-within .ui-db__tip { opacity: 1; visibility: visible; transform: translate(-50%, 0); transition: opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), visibility 0s; }
.ui-db__more[data-tip-off] .ui-db__tip { opacity: 0; visibility: hidden; }
.ui-db__tip-list { display: grid; gap: var(--tc-space-0-5, var(--_tc-space-0-5)); }
.ui-db__tip-list li { display: flex; align-items: center; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); padding: var(--tc-space-0-5, var(--_tc-space-0-5)) 0; }
/* The tooltip inverts the theme. Black marks (Notion, GitHub …) turn white on the dark tooltip – logos drawn in
   currentColor or the ink tokens follow */
.ui-db__tip { --tc-text-strong: var(--tc-tooltip-fg, var(--_tc-tooltip-fg)); --tc-text-primary: var(--tc-tooltip-fg, var(--_tc-tooltip-fg)); }
.ui-db__tip-min { margin-left: auto; padding-left: var(--tc-space-1-5, var(--_tc-space-1-5)); color: color-mix(in srgb, var(--tc-tooltip-fg, var(--_tc-tooltip-fg)) 72%, transparent); white-space: nowrap; }
/* The running spinner turns a few times, then rests as an arc (2.2.2) */
.ui-db__spin { animation: ui-db-spin var(--tc-duration-reveal-slow, var(--_tc-duration-reveal-slow)) linear 6; }
@keyframes ui-db-spin { to { transform: rotate(360deg); } }
@keyframes ui-db-in { from { opacity: 0; transform: translateY(2px); } }
/* Narrow containers: the pile above the agents */
@container (max-width: 560px) {
  .ui-db__body { grid-template-columns: minmax(0, 1fr); }
  .ui-db__pile { margin: var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-3, var(--_tc-space-3)) 0; }
  .ui-db__hint { display: none; }
}
/* Very narrow: the tag moves under the name, so the name keeps its width */
@container (max-width: 340px) {
  .ui-db .ui-db__agent { grid-template-columns: auto minmax(0, 1fr); grid-template-areas: "avatar who" "avatar load" "avatar queue"; }
}
@media (pointer: coarse) {
  .ui-db__auto { min-height: 34px; }
  .ui-db__chip { height: 30px; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-db *, .ui-db *::before, .ui-db *::after { animation: none !important; transition: none !important; }
  .ui-db__ghost { transform: none; }
}
`;
