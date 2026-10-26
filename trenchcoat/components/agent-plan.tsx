"use client";

/*
 * Agent Plan – an AI agent proposes a step-by-step plan, the user adjusts it, then watches it run.
 * In review (status "draft") steps can be renamed inline, removed, reordered by dragging the grip
 * or with Alt+↑/↓, and new ones added at the end. Once running, each step shows a spinner and a
 * live timer, done steps draw a check and show their duration, failed ones offer "Retry from here",
 * and a thin line on the left fills as the plan moves along. All in a single self-contained file.
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: agent-plan.tsx is Standard,
 * agent-plan-clean.tsx is Clean). Clean has no tray – one white card with hairline shadows; the actions and the
 * run's status sit in the card's last row, quiet gray type with a shimmer while running, a blue progress line and
 * blue checks.
 */
// Generated from src/components/agent-plan.tsx by scripts/build-lib.mjs – edit the source, not this file.

import { useCallback, useEffect, useId, useLayoutEffect, useReducer, useRef, useState, type ComponentPropsWithoutRef, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type Ref, type RefObject } from "react";

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-pl";

export type PlanStepStatus = "pending" | "active" | "done" | "failed" | "skipped";

export type PlanStep = {
  id: string;
  title: string;
  /** A second, quieter line under the title */
  detail?: string;
  /** Tool the agent will call, shown as a small mono chip, e.g. "search_web" */
  tool?: string;
  status?: PlanStepStatus;
  /** How long the step took, in ms – shown next to done steps (measured live if left out) */
  duration?: number;
  /** Shown under a failed step */
  error?: string;
};

type AgentPlanOwnProps = {
  /** Visual style. Defaults to the file's look: Standard in agent-plan.tsx, Clean in agent-plan-clean.tsx */
  look?: Look;
  /** The steps. Controlled when defined – pair with onChange; otherwise the component keeps them, starting from
   *  `defaultSteps`. Edits are reported to onChange either way */
  steps?: PlanStep[];
  /** Initial steps when uncontrolled */
  defaultSteps?: PlanStep[];
  /** "draft" = review and edit, "running" = executing, "done" = finished. Always controlled: the plan never moves
   *  itself from one phase to the next – your agent does, so the phase is yours to pass (default "draft") */
  status?: "draft" | "running" | "done";
  /** Every edit during review: rename, remove, reorder, add */
  onChange?: (steps: PlanStep[]) => void;
  /** "Run plan" pressed – gets the steps in their final order. May return a promise: the button waits while it
   *  runs, and if it rejects the plan stays in review and says so */
  onRun?: (steps: PlanStep[]) => void | Promise<unknown>;
  /** Shows a "Cancel" button next to "Run plan" */
  onCancel?: () => void;
  /** Shows "Retry from here" on failed steps. May return a promise: the button waits, and says so if it rejects */
  onRetry?: (stepId: string) => void | Promise<unknown>;
  /** The goal of the plan, shown as the heading */
  title?: string;
  /** Estimated run time shown in review, e.g. "~2 min" */
  estimate?: string;
  className?: string;
  ref?: Ref<HTMLDivElement>;
};

export type AgentPlanProps = Omit<ComponentPropsWithoutRef<"div">, keyof AgentPlanOwnProps> & AgentPlanOwnProps;

let uid = 0;
const makeId = () => `step-${Date.now().toString(36)}-${(uid++).toString(36)}`;
const RAYS = Array.from({ length: 8 }, (_, i) => i);

const move = <T,>(list: T[], from: number, to: number) => {
  const next = list.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

/** The current translateY of an element, including one mid-transition */
const translateOf = (el: HTMLElement) => {
  const t = getComputedStyle(el).transform;
  if (!t || t === "none") return 0;
  try {
    return new DOMMatrixReadOnly(t).m42;
  } catch {
    return 0;
  }
};

/** 0.8s, 12s, 1m 05s */
const fmt = (ms: number) => {
  const s = Math.max(0, ms) / 1000;
  if (s < 10) return `${s.toFixed(1)}s`;
  if (s < 60) return `${Math.round(s)}s`;
  const r = Math.round(s);
  return `${Math.floor(r / 60)}m ${String(r % 60).padStart(2, "0")}s`;
};
/** 14s, 1m 05s – for totals */
const fmtWhole = (ms: number) => {
  const r = Math.max(1, Math.round(ms / 1000));
  return r < 60 ? `${r}s` : `${Math.floor(r / 60)}m ${String(r % 60).padStart(2, "0")}s`;
};

const STATUS_TEXT: Record<PlanStepStatus, string> = {
  pending: "Pending",
  active: "In progress",
  done: "Done",
  failed: "Failed",
  skipped: "Skipped",
};

type Drag = {
  id: string;
  pointer: number;
  ids: string[];
  from: number;
  to: number;
  startY: number;
  scale: number;
  dy: number;
  tops: number[];
  heights: number[];
};

type Work = { kind: "run" | "retry"; id?: string; state: "pending" | "error" } | null;
type Rows = { current: Map<string, HTMLLIElement> };
type Editing = { id: string; value: string } | null;

/* ---------- Live clock: text written straight into the DOM ---------- */

/**
 * Calls `tick` every `ms` while `el` is on screen and the page is visible – and right away when it starts or comes
 * back. Started from a layout effect, it ticks once more at the end of the commit (a microtask, still before paint),
 * when the effects of the parents have run too. Returns the stop function.
 */
function tickWhileVisible(el: Element, tick: () => void, ms: number) {
  let onScreen = true;
  let stopped = false;
  let id = 0;
  const sync = () => {
    const run = !stopped && onScreen && document.visibilityState !== "hidden";
    if (run && !id) {
      tick();
      id = window.setInterval(tick, ms);
    } else if (!run && id) {
      window.clearInterval(id);
      id = 0;
    }
  };
  const io =
    typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver(([entry]) => {
          onScreen = entry.isIntersecting;
          sync();
        });
  io?.observe(el);
  document.addEventListener("visibilitychange", sync);
  sync();
  queueMicrotask(() => !stopped && id && tick());
  return () => {
    stopped = true;
    io?.disconnect();
    document.removeEventListener("visibilitychange", sync);
    window.clearInterval(id);
  };
}

/** A running time, e.g. "4.2s": the clock is read in the ticker, never while rendering, and React never re-renders for it */
function LiveTime({ since, format, className }: { since: () => number | undefined; format: (ms: number) => string; className: string }) {
  const el = useRef<HTMLSpanElement>(null);
  const read = useRef({ since, format });
  useLayoutEffect(() => {
    read.current = { since, format };
  });
  useLayoutEffect(() => {
    const node = el.current;
    if (!node) return;
    return tickWhileVisible(
      node,
      () => {
        const start = read.current.since();
        const text = read.current.format(start !== undefined ? Math.max(0, Date.now() - start) : 0);
        if (node.textContent !== text) node.textContent = text;
      },
      100,
    );
  }, []);
  return <span ref={el} className={className} aria-hidden="true" />;
}

/* ---------- Hooks ---------- */

/** setTimeout that no timer outlives the component */
function useLater() {
  const timers = useRef(new Set<number>());
  useEffect(() => {
    const bag = timers.current;
    return () => bag.forEach((t) => window.clearTimeout(t));
  }, []);
  return (fn: () => void, ms: number) => {
    const t = window.setTimeout(() => {
      timers.current.delete(t);
      fn();
    }, ms);
    timers.current.add(t);
  };
}

/** Run and Retry may return a promise: the button waits, a rejection is shown until the next try */
function useWork() {
  const [work, setWork] = useState<Work>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const perform = (kind: "run" | "retry", id: string | undefined, done: void | Promise<unknown> | undefined) => {
    if (!done || typeof (done as Promise<unknown>).then !== "function") {
      setWork(null);
      return;
    }
    setWork({ kind, id, state: "pending" });
    (done as Promise<unknown>).then(
      () => alive.current && setWork(null),
      () => alive.current && setWork({ kind, id, state: "error" }),
    );
  };
  return { work, perform };
}

/**
 * FLIP: rows glide from where they were to where they are when the order changes. Where they are is kept current
 * by a ResizeObserver on the rows (a row only moves when one above it changes size, or the order changes), so
 * ordinary renders read no layout.
 */
function useRowFlip(orderKey: string, rows: Rows) {
  const tops = useRef(new Map<string, number>());
  const prevKey = useRef(orderKey);
  const measure = useCallback(() => {
    const next = new Map<string, number>();
    rows.current.forEach((el, id) => next.set(id, el.offsetTop));
    tops.current = next;
  }, [rows]);

  useLayoutEffect(() => {
    const changed = prevKey.current !== orderKey;
    prevKey.current = orderKey;
    if (!changed) return measure();
    const old = tops.current;
    measure();
    const motion = !reducedMotion();
    // All reads above; now the writes, with a single reflow to apply every start position
    let moved: HTMLLIElement | null = null;
    rows.current.forEach((el, id) => {
      const from = old.get(id);
      const top = tops.current.get(id);
      if (motion && from !== undefined && top !== undefined && from !== top) {
        el.style.transition = "none";
        el.style.transform = `translateY(${from - top}px)`;
        moved = el;
      }
    });
    if (moved) (moved as HTMLLIElement).getBoundingClientRect();
    rows.current.forEach((el) => {
      el.style.transition = "";
      el.style.transform = "";
    });
  }, [orderKey, measure, rows]);

  useEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    rows.current.forEach((el) => ro.observe(el));
    return () => ro.disconnect();
  }, [orderKey, measure, rows]);

  return { tops, measure };
}

/**
 * When the run started and when each step did, so the live timers and the durations need no extra props. The clock
 * is only read in effects; a step's measured duration re-renders once, when it's known.
 */
function useRunTiming(status: "draft" | "running" | "done", latest: { current: PlanStep[] }) {
  const [total, setTotal] = useState<number | null>(null);
  const [, durationsKnown] = useReducer((n: number) => n + 1, 0);
  const runStart = useRef<number | null>(null);
  const starts = useRef(new Map<string, number>());
  const measured = useRef(new Map<string, number>());

  const prevStatus = useRef(status);
  useLayoutEffect(() => {
    const was = prevStatus.current;
    prevStatus.current = status;
    if (status === "running" && (runStart.current === null || was === "done")) runStart.current = Date.now();
    if (status === "draft") {
      runStart.current = null;
      setTotal(null);
    }
    if (status === "done") {
      const sum = latest.current.reduce((acc, s) => acc + (s.duration ?? measured.current.get(s.id) ?? 0), 0);
      setTotal(runStart.current !== null ? Date.now() - runStart.current : sum);
    }
  }, [status, latest]);

  const statusKey = latest.current.map((s) => `${s.id}:${s.status ?? "pending"}`).join("\n");
  useLayoutEffect(() => {
    let finished = false;
    latest.current.forEach((s) => {
      const st = s.status ?? "pending";
      if (st === "active") {
        if (!starts.current.has(s.id)) starts.current.set(s.id, Date.now());
      } else if (starts.current.has(s.id)) {
        if (st === "done") {
          measured.current.set(s.id, Date.now() - starts.current.get(s.id)!);
          finished = true;
        }
        starts.current.delete(s.id);
      }
      if (st === "pending") measured.current.delete(s.id);
    });
    if (finished) durationsKnown();
  }, [statusKey, latest]);

  return { total, runStart, starts, measured };
}

/** Drag the grip to reorder: the dragged row follows the pointer and the others make room, all in the DOM */
function useGripDrag({
  draft,
  blocked,
  latest,
  rows,
  tops,
  measure,
  commit,
  announce,
}: {
  draft: boolean;
  /** An edit or a removal is under way */
  blocked: () => boolean;
  latest: { current: PlanStep[] };
  rows: Rows;
  tops: { current: Map<string, number> };
  measure: () => void;
  commit: (steps: PlanStep[]) => void;
  announce: (text: string) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const drag = useRef<Drag | null>(null);

  const onGripDown = (e: ReactPointerEvent<HTMLSpanElement>, id: string) => {
    if (!draft || e.button !== 0 || blocked()) return;
    const ids = latest.current.map((s) => s.id);
    const els = ids.map((x) => rows.current.get(x));
    if (els.some((x) => !x)) return;
    const list = els as HTMLLIElement[];
    const from = ids.indexOf(id);
    const el = list[from];
    // Pointer moves are in screen pixels; offsets are in layout pixels (they differ inside CSS zoom)
    const scale = el.offsetHeight ? el.getBoundingClientRect().height / el.offsetHeight : 1;
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* capture is a nicety */
    }
    drag.current = {
      id,
      pointer: e.pointerId,
      ids,
      from,
      to: from,
      startY: e.clientY,
      scale: scale || 1,
      dy: 0,
      tops: list.map((x) => x.offsetTop),
      heights: list.map((x) => x.offsetHeight),
    };
    setDragId(id);
  };

  const onGripMove = (e: ReactPointerEvent<HTMLSpanElement>) => {
    const d = drag.current;
    if (!d || d.pointer !== e.pointerId) return;
    const last = d.ids.length - 1;
    const min = d.tops[0] - d.tops[d.from];
    const max = d.tops[last] + d.heights[last] - (d.tops[d.from] + d.heights[d.from]);
    d.dy = Math.min(max, Math.max(min, (e.clientY - d.startY) / d.scale));
    rows.current.get(d.id)?.style.setProperty("transform", `translateY(${d.dy}px)`);

    const center = d.tops[d.from] + d.dy + d.heights[d.from] / 2;
    let to = 0;
    d.ids.forEach((_, i) => {
      if (i !== d.from && d.tops[i] + d.heights[i] / 2 < center) to++;
    });
    if (to === d.to) return;
    d.to = to;
    // The others make room for the dragged row
    const h = d.heights[d.from];
    d.ids.forEach((id, i) => {
      if (i === d.from) return;
      const shift = d.from < to && i > d.from && i <= to ? -h : to < d.from && i >= to && i < d.from ? h : 0;
      const el = rows.current.get(id);
      if (el) el.style.transform = shift ? `translateY(${shift}px)` : "";
    });
  };

  const onGripUp = (e: ReactPointerEvent<HTMLSpanElement>) => {
    const d = drag.current;
    if (!d || d.pointer !== e.pointerId) return;
    drag.current = null;
    setDragId(null);
    if (d.to === d.from) {
      // Glides back into its slot
      const el = rows.current.get(d.id);
      if (el) el.style.transform = "";
      return;
    }
    // Start the FLIP from where everything is on screen right now
    rows.current.forEach((el, id) => {
      tops.current.set(id, el.offsetTop + translateOf(el));
      el.style.transition = "none";
      el.style.transform = "";
    });
    const list = latest.current;
    const moved = list.find((s) => s.id === d.id);
    commit(move(list, d.from, d.to));
    // If the order didn't change after all (a controlled parent said no), hand the transitions back – and note
    // where the rows really are
    requestAnimationFrame(() => {
      rows.current.forEach((el) => (el.style.transition = ""));
      measure();
    });
    if (moved) announce(`Moved “${moved.title}” to position ${d.to + 1} of ${list.length}`);
  };

  return { dragId, onGripDown, onGripMove, onGripUp };
}

/* ---------- Component ---------- */

export function AgentPlan({
  look,
  steps: controlled,
  defaultSteps = [],
  status = "draft",
  onChange,
  onRun,
  onCancel,
  onRetry,
  title,
  estimate,
  className,
  ref,
  ...rest
}: AgentPlanProps) {
  const [steps, commit] = useControllable(controlled, defaultSteps, onChange, "steps");
  const draft = status === "draft";
  const latest = useRef(steps);
  latest.current = steps;

  const [editing, setEditing] = useState<Editing>(null);
  const editingRef = useRef(editing);
  editingRef.current = editing;
  const [adding, setAdding] = useState("");
  const [removing, setRemoving] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const { work, perform } = useWork();
  const later = useLater();

  const rootRef = useRef<HTMLDivElement | null>(null);
  const setRoot = useRootRef(rootRef, ref);
  // Run / Run again / Cancel swap the footer: focus moves to the run's status line instead of <body> (WCAG 2.4.3)
  useFocusRescue(rootRef, {
    fallback: () => rootRef.current?.querySelector<HTMLElement>(".ui-pl__foot .ui-pl__status, .ui-pl__foot button:not(:disabled)"),
  });
  const addInput = useRef<HTMLInputElement>(null);
  const rows = useRef(new Map<string, HTMLLIElement>());
  const refocus = useRef<string | null>(null);
  const born = useRef(new Set<string>());
  const seen = useRef(new Map<string, PlanStepStatus>());
  const hintId = useId();

  // A trailing no-break space makes repeated messages count as new for screen readers
  const announce = (text: string) => setMessage((m) => (m === text ? `${text} ` : text));

  const { tops, measure } = useRowFlip(steps.map((s) => s.id).join("\n"), rows);
  // After a move or an edit, focus goes back to the row
  useLayoutEffect(() => {
    if (!refocus.current) return;
    const el = rows.current.get(refocus.current);
    refocus.current = null;
    if (el && document.activeElement !== el) el.focus();
  });

  const { total, runStart, starts, measured } = useRunTiming(status, latest);

  // Announce step results and the end of the run
  useEffect(() => {
    const said: string[] = [];
    steps.forEach((s, i) => {
      const st = s.status ?? "pending";
      const was = seen.current.get(s.id);
      if (!draft && was !== undefined && was !== st) {
        if (st === "done") said.push(`Step ${i + 1} done: ${s.title}`);
        if (st === "failed") said.push(`Step ${i + 1} failed: ${s.title}${s.error ? `. ${s.error}` : ""}`);
        if (st === "skipped") said.push(`Step ${i + 1} skipped`);
      }
      seen.current.set(s.id, st);
    });
    if (said.length) announce(said.join(". "));
  });

  useEffect(() => {
    if (status === "running") announce("Running plan");
    if (status === "done" && total !== null) announce(`Plan done in ${fmtWhole(total)}`);
  }, [status, total]);

  // Leaving review cancels any half-finished edit or drag
  useEffect(() => {
    if (draft) return;
    setEditing(null);
    setAdding("");
  }, [draft]);

  const { dragId, onGripDown, onGripMove, onGripUp } = useGripDrag({
    draft,
    blocked: () => Boolean(editingRef.current || removing.length),
    latest,
    rows,
    tops,
    measure,
    commit,
    announce,
  });

  /* ---------- Edits ---------- */

  const focusRow = (id: string | undefined) => {
    if (id) rows.current.get(id)?.focus();
    else addInput.current?.focus();
  };

  const moveBy = (id: string, delta: number) => {
    const list = latest.current;
    const from = list.findIndex((s) => s.id === id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= list.length) return;
    refocus.current = id;
    commit(move(list, from, to));
    announce(`Moved “${list[from].title}” to position ${to + 1} of ${list.length}`);
  };

  const remove = (id: string) => {
    if (!draft || removing.includes(id)) return;
    const list = latest.current;
    const i = list.findIndex((s) => s.id === id);
    if (i < 0) return;
    const el = rows.current.get(id);
    const near = list[i + 1] ?? list[i - 1];
    rescueFocus(el, [near && rows.current.get(near.id), addInput.current]);
    announce(`Removed “${list[i].title}”`);
    if (!el || reducedMotion()) {
      commit(list.filter((s) => s.id !== id));
      return;
    }
    // Collapse the row first, then drop it – the rows below close the gap with it
    el.style.height = `${el.offsetHeight}px`;
    el.getBoundingClientRect();
    setRemoving((r) => [...r, id]);
    later(() => {
      el.style.height = "";
      setRemoving((r) => r.filter((x) => x !== id));
      commit(latest.current.filter((s) => s.id !== id));
    }, 260);
  };

  const startEdit = (id: string) => {
    if (!draft) return;
    const s = latest.current.find((x) => x.id === id);
    if (s) setEditing({ id, value: s.title });
  };

  const finishEdit = (save: boolean, keyboard = false) => {
    const e = editingRef.current;
    if (!e) return;
    editingRef.current = null;
    setEditing(null);
    // Back to the row after Enter or Escape; a click elsewhere keeps its own focus
    if (keyboard) refocus.current = e.id;
    const value = e.value.trim();
    const s = latest.current.find((x) => x.id === e.id);
    if (save && s && value && value !== s.title) {
      commit(latest.current.map((x) => (x.id === e.id ? { ...x, title: value } : x)));
      announce(`Renamed to “${value}”`);
    }
  };

  const add = () => {
    const value = adding.trim();
    if (!value) return;
    const id = makeId();
    born.current.add(id);
    commit([...latest.current, { id, title: value }]);
    setAdding("");
    announce(`Added “${value}” as step ${latest.current.length + 1}`);
  };

  const onRowKey = (e: ReactKeyboardEvent<HTMLLIElement>, id: string) => {
    if (!draft || e.target !== e.currentTarget) return;
    const list = latest.current;
    const i = list.findIndex((s) => s.id === id);
    if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      e.preventDefault();
      moveBy(id, e.key === "ArrowUp" ? -1 : 1);
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = list[i + (e.key === "ArrowUp" ? -1 : 1)];
      if (next) focusRow(next.id);
      else if (e.key === "ArrowDown") addInput.current?.focus();
    } else if (e.key === "Enter" || e.key === "F2") {
      e.preventDefault();
      startEdit(id);
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      remove(id);
    }
  };

  /* ---------- Render ---------- */

  const n = steps.length;
  const resolvedLook = look ?? DEFAULT_LOOK;
  const runPending = work?.kind === "run" && work.state === "pending";
  // Actions in review, the run's status after: on the tray below the card (Standard) or the card's last row (Clean)
  const foot = (
    <PlanFoot
      clean={resolvedLook === "clean"}
      status={status}
      steps={steps}
      total={total}
      runStart={runStart}
      runError={work?.kind === "run" && work.state === "error"}
      runPending={runPending}
      onCancel={onCancel}
      onRun={onRun && (() => perform("run", undefined, onRun(latest.current)))}
    />
  );

  return (
    <div
      {...rest}
      ref={setRoot}
      className={[ROOT_CLASS, className].filter(Boolean).join(" ")}
      data-look={resolvedLook}
      data-status={status}
      data-dragging={dragId ? "" : undefined}
    >
      {/* React 19 hoists this into <head> once, no matter how many plans render */}
      <style href="ui-agent-plan" precedence="default">
        {css}
      </style>

      <div className="ui-pl__card">
        <PlanHead count={n} estimate={draft ? estimate : undefined} title={title} />

        <p id={hintId} className="ui-pl__sr">
          Press Enter to rename, Alt plus arrow keys to move, Delete to remove.
        </p>

        <ol className="ui-pl__list" aria-label={title ? `Plan: ${title}` : "Plan"}>
          {steps.map((s, i) => (
            <StepRow
              key={s.id}
              step={s}
              index={i}
              count={n}
              draft={draft}
              editing={draft && editing?.id === s.id ? editing : null}
              setEditing={setEditing}
              startEdit={startEdit}
              finishEdit={finishEdit}
              rows={rows}
              born={born}
              hintId={hintId}
              dragging={dragId === s.id}
              removing={removing.includes(s.id)}
              ran={s.duration ?? measured.current.get(s.id)}
              since={() => starts.current.get(s.id)}
              work={work}
              onKey={onRowKey}
              onGripDown={onGripDown}
              onGripMove={onGripMove}
              onGripUp={onGripUp}
              onRemove={remove}
              onMove={moveBy}
              onRetry={onRetry && (() => perform("retry", s.id, onRetry(s.id)))}
            />
          ))}
        </ol>

        {/* Add step folds away once the plan runs */}
        <AddStep
          draft={draft}
          input={addInput}
          value={adding}
          onValue={setAdding}
          onAdd={add}
          onUp={() => {
            const last = latest.current[latest.current.length - 1];
            if (!last) return false;
            focusRow(last.id);
            return true;
          }}
        />
        {resolvedLook === "clean" && foot}
      </div>

      {resolvedLook === "standard" && foot}

      <p className="ui-pl__sr" role="status" aria-live="polite">
        {message}
      </p>
    </div>
  );
}

/* ---------- Parts ---------- */

function PlanHead({ count: n, estimate, title }: { count: number; estimate?: string; title?: string }) {
  return (
    <div className="ui-pl__head">
      <div className="ui-pl__meta">
        <span className="ui-pl__state">
          <span className="ui-pl__state-icon" aria-hidden="true">
            <svg viewBox="0 0 16 16">
              <path d="M6.5 4.5h7M6.5 8h7M6.5 11.5h7" />
              <circle cx="3.25" cy="4.5" r=".6" />
              <circle cx="3.25" cy="8" r=".6" />
              <circle cx="3.25" cy="11.5" r=".6" />
            </svg>
          </span>
          <span className="ui-pl__state-label">
            Plan · {n} {n === 1 ? "step" : "steps"}
          </span>
        </span>
        {estimate ? (
          <span className="ui-pl__estimate">
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <circle cx="8" cy="8" r="6" />
              <path d="M8 5v3.2l2 1.3" />
            </svg>
            <span>
              <span className="ui-pl__sr">Estimated time </span>
              {estimate}
            </span>
          </span>
        ) : null}
      </div>
      {title && <h3 className="ui-pl__title">{title}</h3>}
    </div>
  );
}

function StepRow({
  step: s,
  index: i,
  count: n,
  draft,
  editing,
  setEditing,
  startEdit,
  finishEdit,
  rows,
  born,
  hintId,
  dragging,
  removing,
  ran,
  since,
  work,
  onKey,
  onGripDown,
  onGripMove,
  onGripUp,
  onRemove,
  onMove,
  onRetry,
}: {
  step: PlanStep;
  index: number;
  count: number;
  draft: boolean;
  /** This row's edit, if it's being renamed */
  editing: Editing;
  setEditing: (editing: Editing) => void;
  startEdit: (id: string) => void;
  finishEdit: (save: boolean, keyboard?: boolean) => void;
  rows: Rows;
  born: { current: Set<string> };
  hintId: string;
  dragging: boolean;
  removing: boolean;
  /** How long it took, once done */
  ran: number | undefined;
  /** When it started, while active */
  since: () => number | undefined;
  work: Work;
  onKey: (e: ReactKeyboardEvent<HTMLLIElement>, id: string) => void;
  onGripDown: (e: ReactPointerEvent<HTMLSpanElement>, id: string) => void;
  onGripMove: (e: ReactPointerEvent<HTMLSpanElement>) => void;
  onGripUp: (e: ReactPointerEvent<HTMLSpanElement>) => void;
  onRemove: (id: string) => void;
  /** Move up or down by one – the single-pointer alternative to dragging the grip (WCAG 2.5.7) */
  onMove: (id: string, delta: number) => void;
  onRetry?: () => void;
}) {
  const st: PlanStepStatus = s.status ?? "pending";
  return (
    <li
      ref={(el) => {
        if (el) rows.current.set(s.id, el);
        return () => {
          rows.current.delete(s.id);
        };
      }}
      className="ui-pl__step"
      data-step={draft ? undefined : st}
      data-dragging={dragging ? "" : undefined}
      data-removing={removing ? "" : undefined}
      data-enter={born.current.has(s.id) ? "" : undefined}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget) born.current.delete(s.id);
      }}
      tabIndex={draft && !editing ? 0 : undefined}
      aria-describedby={draft ? hintId : undefined}
      aria-current={st === "active" && !draft ? "step" : undefined}
      onKeyDown={(e) => onKey(e, s.id)}
    >
      {draft && (
        <span
          className="ui-pl__grip"
          aria-hidden="true"
          title="Drag to reorder"
          onPointerDown={(e) => onGripDown(e, s.id)}
          onPointerMove={onGripMove}
          onPointerUp={onGripUp}
          onPointerCancel={onGripUp}
        >
          <svg viewBox="0 0 16 16">
            <circle cx="6" cy="4" r="1.1" />
            <circle cx="10" cy="4" r="1.1" />
            <circle cx="6" cy="8" r="1.1" />
            <circle cx="10" cy="8" r="1.1" />
            <circle cx="6" cy="12" r="1.1" />
            <circle cx="10" cy="12" r="1.1" />
          </svg>
        </span>
      )}

      <span className="ui-pl__marker" aria-hidden="true">
        {draft || st === "pending" ? (
          <span className="ui-pl__num">{i + 1}</span>
        ) : st === "active" ? (
          <Spinner />
        ) : st === "done" ? (
          <svg viewBox="0 0 16 16" className="ui-pl__mark">
            <path d="M4.2 8.4 6.8 11l5-5.6" pathLength={1} className="ui-pl__draw" />
          </svg>
        ) : st === "failed" ? (
          <svg viewBox="0 0 16 16" className="ui-pl__mark">
            <path d="M8 4.2v4.4M8 11.6h.01" />
          </svg>
        ) : (
          <svg viewBox="0 0 16 16" className="ui-pl__mark">
            <path d="M5 8h6" />
          </svg>
        )}
      </span>

      <div className="ui-pl__main">
        {editing ? (
          <input
            className="ui-pl__edit"
            value={editing.value}
            aria-label={`Rename step ${i + 1}`}
            autoFocus
            onFocus={(e) => e.currentTarget.select()}
            onChange={(e) => setEditing({ id: s.id, value: e.target.value })}
            onBlur={() => finishEdit(true)}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing) return;
              if (e.key === "Enter") {
                e.preventDefault();
                finishEdit(true, true);
              } else if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                finishEdit(false, true);
              }
            }}
          />
        ) : (
          <span className="ui-pl__name" onDoubleClick={() => startEdit(s.id)}>
            {s.title}
          </span>
        )}
        {(s.detail || s.tool) && (
          <span className="ui-pl__sub">
            {s.detail && <span className="ui-pl__detail">{s.detail}</span>}
            {s.tool && <code className="ui-pl__tool">{s.tool}</code>}
          </span>
        )}
        {!draft && <span className="ui-pl__sr">, {STATUS_TEXT[st]}</span>}
        {!draft && st === "failed" && (
          <span className="ui-pl__fail">
            <span className="ui-pl__error">
              {work?.kind === "retry" && work.id === s.id && work.state === "error" ? "Couldn't retry – try again" : s.error ?? "This step failed"}
            </span>
            {onRetry && (
              <button
                type="button"
                className="ui-pl__retry"
                disabled={work?.kind === "retry" && work.state === "pending"}
                aria-busy={(work?.kind === "retry" && work.id === s.id && work.state === "pending") || undefined}
                onClick={onRetry}
              >
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M13 8a5 5 0 1 1-1.6-3.7" />
                  <path d="M13 3v2.6h-2.6" />
                </svg>
                Retry from here
              </button>
            )}
          </span>
        )}
      </div>

      <span className="ui-pl__aside">
        {draft ? (
          <>
          <span className="ui-pl__moves">
          {i > 0 && (
            <button type="button" className="ui-pl__remove ui-pl__move" aria-label={`Move step ${i + 1} up: ${s.title}`} onClick={() => onMove(s.id, -1)}>
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M8 12V4M4.5 7.5 8 4l3.5 3.5" />
              </svg>
            </button>
          )}
          {i < n - 1 && (
            <button type="button" className="ui-pl__remove ui-pl__move" aria-label={`Move step ${i + 1} down: ${s.title}`} onClick={() => onMove(s.id, 1)}>
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M8 4v8M4.5 8.5 8 12l3.5-3.5" />
              </svg>
            </button>
          )}
          </span>
          <button type="button" className="ui-pl__remove" aria-label={`Remove step ${i + 1}: ${s.title}`} onClick={() => onRemove(s.id)}>
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
            </svg>
          </button>
          </>
        ) : st === "active" ? (
          <LiveTime className="ui-pl__time" since={since} format={fmt} />
        ) : st === "done" && ran !== undefined ? (
          <span className="ui-pl__time ui-pl__time--done">
            <span className="ui-pl__sr">took </span>
            {fmt(ran)}
          </span>
        ) : st === "skipped" ? (
          <span className="ui-pl__time" aria-hidden="true">
            Skipped
          </span>
        ) : null}
      </span>

      {i < n - 1 && <span className="ui-pl__rail" aria-hidden="true" />}
    </li>
  );
}

function AddStep({
  draft,
  input,
  value,
  onValue,
  onAdd,
  onUp,
}: {
  draft: boolean;
  input: { current: HTMLInputElement | null };
  value: string;
  onValue: (value: string) => void;
  onAdd: () => void;
  /** ↑ in the empty field: back to the last row – false when there is none */
  onUp: () => boolean;
}) {
  return (
    <div className="ui-pl__tail" inert={!draft}>
      <div className="ui-pl__tail-inner">
        <label className="ui-pl__add">
          <span className="ui-pl__add-icon" aria-hidden="true">
            <svg viewBox="0 0 16 16">
              <path d="M8 4.5v7M4.5 8h7" />
            </svg>
          </span>
          <input
            ref={input}
            value={value}
            placeholder="Add step"
            aria-label="Add a step at the end"
            enterKeyHint="done"
            onChange={(e) => onValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing) return;
              if (e.key === "Enter") {
                e.preventDefault();
                onAdd();
              } else if (e.key === "Escape") {
                onValue("");
              } else if (e.key === "ArrowUp" && !value) {
                if (onUp()) e.preventDefault();
              }
            }}
          />
        </label>
      </div>
    </div>
  );
}

function PlanFoot({
  clean,
  status,
  steps,
  total,
  runStart,
  runError,
  runPending,
  onCancel,
  onRun,
}: {
  clean: boolean;
  status: "draft" | "running" | "done";
  steps: PlanStep[];
  total: number | null;
  runStart: { current: number | null };
  runError: boolean;
  runPending: boolean;
  onCancel?: () => void;
  onRun?: () => void;
}) {
  const n = steps.length;
  const statusOf = (s: PlanStep): PlanStepStatus => s.status ?? "pending";
  const activeAt = steps.findIndex((s) => statusOf(s) === "active");
  const failedAt = steps.findIndex((s) => statusOf(s) === "failed");
  const finished = steps.filter((s) => statusOf(s) === "done" || statusOf(s) === "skipped").length;

  let phase: "draft" | "running" | "failed" | "done" = "draft";
  let label = "";
  if (status === "done") {
    phase = "done";
    label = `Done in ${fmtWhole(total ?? 0)}`;
  } else if (status === "running") {
    if (failedAt >= 0 && activeAt < 0) {
      phase = "failed";
      label = `Stopped · step ${failedAt + 1} failed`;
    } else {
      phase = "running";
      label = `Running · ${activeAt >= 0 ? activeAt + 1 : Math.min(finished + 1, n)} of ${n}`;
    }
  }

  return (
    <div className="ui-pl__foot" key={phase} data-phase={phase}>
      {phase === "draft" ? (
        <>
          {runError ? (
            <span className="ui-pl__hint ui-pl__hint--error" role="alert">
              Couldn't start the run – try again
            </span>
          ) : (
            <span className="ui-pl__hint" aria-hidden="true">
              Drag to reorder · double-click to rename
            </span>
          )}
          <span className="ui-pl__actions">
            {onCancel && (
              <button type="button" className={`ui-pl__btn ${clean ? "ui-pl__btn--secondary" : "ui-pl__btn--quiet"}`} onClick={onCancel}>
                Cancel
              </button>
            )}
            <button
              type="button"
              className="ui-pl__btn ui-pl__btn--primary ui-pl__run"
              disabled={!n || runPending}
              aria-busy={runPending || undefined}
              onClick={onRun}
            >
              Run plan
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M5.5 3.8v8.4L12 8z" />
              </svg>
            </button>
          </span>
        </>
      ) : (
        <>
          <span className="ui-pl__status" tabIndex={-1}>
            <span className="ui-pl__status-icon" aria-hidden="true">
              {phase === "running" ? (
                <Spinner />
              ) : phase === "done" ? (
                <svg viewBox="0 0 16 16" className={clean ? "ui-pl__badge" : undefined}>
                  <circle cx="8" cy="8" r={clean ? 7 : 6.5} />
                  <path d={clean ? "M5.2 8.2 7.1 10l3.7-4" : "M5.4 8.2 7.2 10l3.4-3.8"} pathLength={1} className="ui-pl__draw" />
                </svg>
              ) : (
                <svg viewBox="0 0 16 16" className={clean ? "ui-pl__badge" : undefined}>
                  <circle cx="8" cy="8" r={clean ? 7 : 6.5} />
                  <path d={clean ? "M8 4.8v3.8M8 11.2h.01" : "M8 4.9v3.6M8 11h.01"} />
                </svg>
              )}
            </span>
            {/* Clean: a darker band sweeps over the label while running */}
            <span
              className={clean && phase === "running" ? "ui-pl__status-label ui-pl__shimmer" : "ui-pl__status-label"}
            >
              {label}
              {clean && phase === "running" && (
                <span key={label} className="ui-pl__shine" aria-hidden="true">
                  <span>{label}</span>
                </span>
              )}
            </span>
          </span>
          {phase === "running" ? (
            <LiveTime className="ui-pl__elapsed" since={() => runStart.current ?? undefined} format={fmtWhole} />
          ) : phase === "done" && onRun ? (
            <span className="ui-pl__actions">
              <button
                type="button"
                className={`ui-pl__btn ${clean ? "ui-pl__btn--secondary" : "ui-pl__btn--quiet"} ui-pl__again`}
                disabled={runPending}
                aria-busy={runPending || undefined}
                onClick={onRun}
              >
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M13 8a5 5 0 1 1-1.6-3.7" />
                  <path d="M13 3v2.6h-2.6" />
                </svg>
                Run again
              </button>
            </span>
          ) : null}
        </>
      )}
    </div>
  );
}

/** Eight rays that fade one after another – the spinner turns without rotating */
function Spinner() {
  return (
    <svg className="ui-pl__spinner" viewBox="0 0 16 16">
      {RAYS.map((i) => (
        <line
          key={i}
          x1="8"
          y1="1.75"
          x2="8"
          y2="4.75"
          transform={`rotate(${i * 45} 8 8)`}
          style={{ animationDelay: `${(i - 8) * 100}ms` }}
        />
      ))}
    </svg>
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

/* ---------- Styles ---------- */

const css = /* css */ `
/* Fallbacks so this file works without tokens.css – tokens.css, when loaded, takes precedence */
.ui-pl:where([data-look="standard"]),
.ui-pl__portal:where([data-look="standard"]) {
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
  --_tc-border-default: light-dark(#ececec, #2a2a2e);
  --_tc-card-radius: 16px;
  --_tc-card-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-md: 32px;
  --_tc-control-px-md: 12px;
  --_tc-control-radius-md: 10px;
  --_tc-control-radius-sm: 8px;
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-reveal: 700ms;
  --_tc-duration-shimmer: 1600ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-duration-slowest: 560ms;
  --_tc-ease-move: cubic-bezier(0.22, 1, 0.36, 1);
  --_tc-ease-standard: ease;
  --_tc-field-shadow-focus: inset 0 0 0 1px light-dark(#2f68ff, #6b95ff), 0 0 0 3px color-mix(in srgb, light-dark(#2f68ff, #6b95ff) 24%, transparent);
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-fill-hover: light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring: light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring-offset: 2px;
  --_tc-focus-ring-width: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-xs: 11px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-semibold: 600;
  --_tc-icon-muted: light-dark(#858585, #7c7c82);
  --_tc-line-height-loose: 24px;
  --_tc-line-height-none: 1;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-relaxed: 22px;
  --_tc-line-height-snug: 18px;
  --_tc-line-height-tight: 16px;
  --_tc-radius-3xl: 20px;
  --_tc-radius-badge: 999px;
  --_tc-radius-full: 999px;
  --_tc-radius-lg: 10px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xs: 4px;
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
  --_tc-space-4-5: 18px;
  --_tc-status-danger-bg: light-dark(#fdecea, #3b1714);
  --_tc-status-danger-border: color-mix(in srgb, light-dark(#e5484d, #ff6369) 40%, transparent);
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-surface-raised: light-dark(#ffffff, #19191b);
  --_tc-surface-sunken: light-dark(#f0f0f0, #111113);
  --_tc-text-disabled: light-dark(#a3a3a3, #5c5c63);
  --_tc-text-muted: light-dark(#646464, #9a9aa1);
  --_tc-text-on-accent: #ffffff;
  --_tc-text-primary: light-dark(#171717, #ededed);
  --_tc-text-secondary: light-dark(#404040, #c8c8cc);
  --_tc-text-strong: light-dark(#171717, #f5f5f5);
}
.ui-pl:where([data-look="clean"]),
.ui-pl__portal:where([data-look="clean"]) {
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
  --_tc-border-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-card-radius: 10px;
  --_tc-card-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-md: 28px;
  --_tc-control-px-md: 10px;
  --_tc-control-radius-md: 6px;
  --_tc-control-radius-sm: 6px;
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-reveal: 700ms;
  --_tc-duration-shimmer: 1600ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-duration-slowest: 560ms;
  --_tc-ease-move: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-standard: ease;
  --_tc-field-shadow-focus: inset 0 0 0 1px light-dark(#0060e2, #5b9aff), 0 0 0 3px color-mix(in srgb, light-dark(#0060e2, #5b9aff) 24%, transparent);
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-fill-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring: light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring-offset: 1px;
  --_tc-focus-ring-width: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-xs: 11px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-semibold: 600;
  --_tc-icon-muted: light-dark(rgba(0, 0, 0, 0.45), rgba(255, 255, 255, 0.46));
  --_tc-line-height-loose: 24px;
  --_tc-line-height-none: 1;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-relaxed: 22px;
  --_tc-line-height-snug: 18px;
  --_tc-line-height-tight: 16px;
  --_tc-radius-3xl: 20px;
  --_tc-radius-badge: 5px;
  --_tc-radius-full: 999px;
  --_tc-radius-lg: 10px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xs: 4px;
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
  --_tc-space-4-5: 18px;
  --_tc-status-danger-bg: light-dark(rgba(245, 43, 0, 0.094), rgba(255, 53, 35, 0.17));
  --_tc-status-danger-border: color-mix(in srgb, light-dark(#e5484d, #ff6369) 40%, transparent);
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-surface-raised: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-sunken: light-dark(#f7f7f7, #161618);
  --_tc-text-disabled: light-dark(rgba(0, 0, 0, 0.27), rgba(255, 255, 255, 0.3));
  --_tc-text-muted: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52));
  --_tc-text-on-accent: #ffffff;
  --_tc-text-primary: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-text-secondary: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-text-strong: light-dark(#000000, #ffffff);
}
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

/* Colors and motion as variables – override them on .ui-pl */
:where([data-look="standard"], [data-look="standard"] *).ui-pl {
  /* Lifted rows and fields: white on the gray tray, a step lighter in dark */
  --tc-agent-plan-raise-bg: light-dark(#ffffff, #1f1f22);
  /* The rail that links the steps */
  --tc-agent-plan-rail: light-dark(#c4c4c8, #4a4a50);
  --tc-agent-plan-lift: 0 1px 2px light-dark(rgba(0, 0, 0, 0.06), rgba(0, 0, 0, 0.4)), 0 12px 28px -10px light-dark(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.7));
  --tc-agent-plan-inset: 30px;

  container-type: inline-size;
  position: relative;
  box-sizing: border-box;
  display: grid;
  width: 100%;
  max-width: 460px;
  padding: var(--tc-space-1, var(--_tc-space-1));
  border-radius: var(--tc-radius-3xl, var(--_tc-radius-3xl));
  background: var(--tc-surface-sunken, var(--_tc-surface-sunken));
  color: var(--tc-text-muted, var(--_tc-text-muted));
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  letter-spacing: -0.006em;
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* The white card holds the goal and the steps */
:where([data-look="standard"], [data-look="standard"] *).ui-pl__card {
  position: relative;
  border-radius: var(--tc-card-radius, var(--_tc-card-radius));
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow));
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl:not([data-status="draft"]) {
  --tc-agent-plan-inset: 14px;
}
/* Colors and motion as variables – override them on .ui-pl */
:where([data-look="clean"], [data-look="clean"] *).ui-pl {
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  --tc-agent-plan-rail: light-dark(rgba(0, 0, 0, 0.08), rgba(255, 255, 255, 0.1));
  --tc-agent-plan-shine: light-dark(rgba(255, 255, 255, 0.82), #ffffff);
  --tc-agent-plan-accent: light-dark(rgba(0, 96, 226, 0.765), #4d8dff);
  --tc-agent-plan-edit-glow: light-dark(rgba(0, 96, 226, 0.1), rgba(77, 141, 255, 0.14));
  --tc-agent-plan-inset: 30px;

  container-type: inline-size;
  position: relative;
  box-sizing: border-box;
  display: grid;
  width: 100%;
  max-width: 440px;
  color: var(--tc-text-primary, var(--_tc-text-primary));
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* One white card – the edge is a shadow, not a border */
:where([data-look="clean"], [data-look="clean"] *).ui-pl__card {
  position: relative;
  border-radius: var(--tc-radius-lg, var(--_tc-radius-lg));
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised));
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl:not([data-status="draft"]) {
  --tc-agent-plan-inset: 10px;
}
.ui-pl[data-dragging] {
  cursor: grabbing;
  user-select: none;
  -webkit-user-select: none;
}
.ui-pl *,
.ui-pl *::before,
.ui-pl *::after {
  box-sizing: border-box;
}
.ui-pl svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}
:where(.ui-pl) button {
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  letter-spacing: inherit;
  color: inherit;
  cursor: pointer;
}
.ui-pl__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
/* Header: a quiet status line, then the goal */
:where([data-look="standard"], [data-look="standard"] *).ui-pl__head {
  display: grid;
  gap: var(--tc-space-1, var(--_tc-space-1));
  padding: var(--tc-space-4, var(--_tc-space-4)) var(--tc-space-4-5, var(--_tc-space-4-5)) var(--tc-space-2, var(--_tc-space-2));
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__meta {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2-5, var(--_tc-space-2-5));
  min-height: 18px;
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug));
  color: var(--tc-text-muted, var(--_tc-text-muted));
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__state {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-2, var(--_tc-space-2));
  min-width: 0;
}
/* Header: a quiet meta line, then the goal */
:where([data-look="clean"], [data-look="clean"] *).ui-pl__head {
  display: grid;
  gap: var(--tc-space-1, var(--_tc-space-1));
  padding: var(--tc-space-4, var(--_tc-space-4)) var(--tc-space-4, var(--_tc-space-4)) var(--tc-space-2-5, var(--_tc-space-2-5));
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__meta {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2-5, var(--_tc-space-2-5));
  min-height: 16px;
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight));
  color: var(--tc-text-muted, var(--_tc-text-muted));
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__state {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5, var(--_tc-space-1-5));
  min-width: 0;
}
.ui-pl__state-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__state-icon,
:where([data-look="standard"], [data-look="standard"] *).ui-pl__status-icon {
  flex: none;
  width: 13px;
  height: 13px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__state-icon {
  flex: none;
  width: 16px;
  height: 16px;
  color: var(--tc-icon-muted, var(--_tc-icon-muted));
  fill: none;
  stroke: currentColor;
  stroke-width: 1.1;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.ui-pl__state-icon circle[r=".6"] {
  fill: currentColor;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__estimate {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1, var(--_tc-space-1));
  margin-left: auto;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__estimate svg {
  width: 13px;
  height: 13px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__title {
  margin: 0;
  color: var(--tc-text-primary, var(--_tc-text-primary));
  font-size: 15px;
  font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold));
  line-height: var(--tc-line-height-relaxed, var(--_tc-line-height-relaxed));
  letter-spacing: -0.012em;
  text-wrap: balance;
}
/* Steps */
:where([data-look="standard"], [data-look="standard"] *).ui-pl__list {
  position: relative;
  margin: 0;
  padding: var(--tc-space-0-5, var(--_tc-space-0-5)) var(--tc-space-1-5, var(--_tc-space-1-5)) var(--tc-space-1-5, var(--_tc-space-1-5));
  list-style: none;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__step {
  position: relative;
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr) auto;
  column-gap: var(--tc-space-3, var(--_tc-space-3));
  align-items: start;
  padding: 10px 10px 10px var(--tc-agent-plan-inset);
  border-radius: var(--tc-radius-lg, var(--_tc-radius-lg));
  outline: none;
  transition:
    transform var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)),
    padding var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)),
    height var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)),
    opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)),
    background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)),
    box-shadow var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl[data-status="draft"] .ui-pl__step:hover {
  background: var(--tc-fill-hover, var(--_tc-fill-hover));
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__estimate {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5, var(--_tc-space-1-5));
  margin-left: auto;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__estimate svg {
  width: 16px;
  height: 16px;
  color: var(--tc-icon-muted, var(--_tc-icon-muted));
  fill: none;
  stroke: currentColor;
  stroke-width: 1.1;
  stroke-linecap: round;
  stroke-linejoin: round;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__title {
  margin: 0;
  color: var(--tc-text-strong, var(--_tc-text-strong));
  font-size: 15px;
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  line-height: var(--tc-line-height-loose, var(--_tc-line-height-loose));
  text-wrap: balance;
}
/* Steps */
:where([data-look="clean"], [data-look="clean"] *).ui-pl__list {
  position: relative;
  margin: 0;
  padding: 0 var(--tc-space-1-5, var(--_tc-space-1-5)) var(--tc-space-1-5, var(--_tc-space-1-5));
  list-style: none;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__step {
  position: relative;
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr) auto;
  column-gap: var(--tc-space-2-5, var(--_tc-space-2-5));
  align-items: start;
  padding: 8px 10px 8px var(--tc-agent-plan-inset);
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  outline: none;
  transition:
    transform var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)),
    padding var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)),
    height var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)),
    opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)),
    background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)),
    box-shadow var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl[data-status="draft"] .ui-pl__step:hover {
  background: var(--tc-fill-subtle, var(--_tc-fill-subtle));
}
.ui-pl__step:focus-visible {
  outline: var(--tc-focus-outline, var(--_tc-focus-outline));
  outline-offset: 0;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__step[data-dragging] {
  z-index: 2;
  background: var(--tc-agent-plan-raise-bg) !important;
  box-shadow: inset 0 0 0 1px var(--tc-border-default, var(--_tc-border-default)), var(--tc-agent-plan-lift);
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__step[data-dragging] {
  z-index: 2;
  background: var(--tc-surface-raised, var(--_tc-surface-raised)) !important;
  box-shadow: var(--tc-shadow-overlay, var(--_tc-shadow-overlay));
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
.ui-pl__step[data-removing] {
  height: 0 !important;
  padding-top: 0;
  padding-bottom: 0;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
}
.ui-pl__step[data-enter] {
  animation: ui-pl-enter var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
/* Grip: in the left gutter, shows on hover and focus */
:where([data-look="standard"], [data-look="standard"] *).ui-pl__grip {
  position: absolute;
  top: 10px;
  left: 6px;
  display: grid;
  place-items: center;
  width: 18px;
  height: 22px;
  margin-top: -1px;
  border-radius: var(--tc-radius-xs, var(--_tc-radius-xs));
  color: var(--tc-icon-muted, var(--_tc-icon-muted));
  fill: currentColor;
  cursor: grab;
  touch-action: none;
  opacity: 0;
  transition: opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__grip svg {
  width: 14px;
  height: 14px;
}
/* Grip: in the left gutter, shows on hover and focus */
:where([data-look="clean"], [data-look="clean"] *).ui-pl__grip {
  position: absolute;
  top: 8px;
  left: 6px;
  display: grid;
  place-items: center;
  width: 18px;
  height: 20px;
  border-radius: var(--tc-radius-xs, var(--_tc-radius-xs));
  color: var(--tc-icon-muted, var(--_tc-icon-muted));
  fill: currentColor;
  cursor: grab;
  touch-action: none;
  opacity: 0;
  transition: opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__grip svg {
  width: 16px;
  height: 16px;
}
.ui-pl__step:hover .ui-pl__grip,
.ui-pl__step:focus-visible .ui-pl__grip,
.ui-pl__step[data-dragging] .ui-pl__grip {
  opacity: 1;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__grip:hover,
:where([data-look="standard"], [data-look="standard"] *).ui-pl__step[data-dragging] .ui-pl__grip {
  color: var(--tc-text-muted, var(--_tc-text-muted));
  background: var(--tc-fill-hover, var(--_tc-fill-hover));
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__grip:hover,
:where([data-look="clean"], [data-look="clean"] *).ui-pl__step[data-dragging] .ui-pl__grip {
  color: var(--tc-icon-muted, var(--_tc-icon-muted));
  background: var(--tc-fill-default, var(--_tc-fill-default));
}
.ui-pl__step[data-dragging] .ui-pl__grip {
  cursor: grabbing;
}
/* Marker: a quiet ring with the number → spinner → check */
:where([data-look="standard"], [data-look="standard"] *).ui-pl__marker {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  justify-self: center;
  width: 20px;
  height: 20px;
  border-radius: var(--tc-radius-full, var(--_tc-radius-full));
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  box-shadow: inset 0 0 0 1px var(--tc-border-default, var(--_tc-border-default));
  color: var(--tc-text-muted, var(--_tc-text-muted));
  font-size: var(--tc-font-size-xs, var(--_tc-font-size-xs));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  line-height: var(--tc-line-height-none, var(--_tc-line-height-none));
  font-variant-numeric: tabular-nums;
  transition: background-color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
/* Marker: a number in a hairline ring → spinner → a blue check */
:where([data-look="clean"], [data-look="clean"] *).ui-pl__marker {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised));
  color: var(--tc-text-muted, var(--_tc-text-muted));
  font-size: var(--tc-font-size-xs, var(--_tc-font-size-xs));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  line-height: var(--tc-line-height-none, var(--_tc-line-height-none));
  font-variant-numeric: tabular-nums;
  transition: background-color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
.ui-pl__marker > * {
  grid-area: 1 / 1;
  animation: ui-pl-pop var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
.ui-pl__num {
  animation: none !important;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__marker .ui-pl__spinner {
  width: 13px;
  height: 13px;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__mark {
  width: 11px !important;
  height: 11px !important;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__step[data-step="active"] .ui-pl__marker {
  box-shadow: none;
  color: var(--tc-text-primary, var(--_tc-text-primary));
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__step[data-step="done"] .ui-pl__marker {
  background: var(--tc-fill-default, var(--_tc-fill-default));
  box-shadow: none;
  color: var(--tc-text-primary, var(--_tc-text-primary));
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__step[data-step="failed"] .ui-pl__marker {
  background: var(--tc-status-danger-bg, var(--_tc-status-danger-bg));
  box-shadow: inset 0 0 0 1px var(--tc-status-danger-border, var(--_tc-status-danger-border));
  color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg));
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__marker .ui-pl__spinner {
  width: 14px;
  height: 14px;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__mark {
  width: 12px !important;
  height: 12px !important;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__step[data-step="active"] .ui-pl__marker {
  box-shadow: none;
  color: var(--tc-agent-plan-accent);
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__step[data-step="done"] .ui-pl__marker {
  background: var(--tc-agent-plan-accent);
  box-shadow: none;
  color: var(--tc-text-on-accent, var(--_tc-text-on-accent));
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__step[data-step="failed"] .ui-pl__marker {
  background: var(--tc-status-danger-bg, var(--_tc-status-danger-bg));
  box-shadow: none;
  color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg));
}
.ui-pl__step[data-step="skipped"] .ui-pl__marker {
  box-shadow: none;
  outline: 1px dashed var(--tc-text-disabled, var(--_tc-text-disabled));
  outline-offset: -1px;
}
/* The check draws itself */
.ui-pl__draw {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: ui-pl-draw var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) var(--tc-duration-instant, var(--_tc-duration-instant)) forwards;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__spinner line {
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  opacity: 0.18;
  animation: ui-pl-ray var(--tc-duration-reveal, var(--_tc-duration-reveal)) linear infinite;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__spinner line {
  stroke: currentColor;
  stroke-width: 1.4;
  stroke-linecap: round;
  opacity: 0.18;
  animation: ui-pl-ray var(--tc-duration-reveal, var(--_tc-duration-reveal)) linear infinite;
}
/* Text */
.ui-pl__main {
  display: grid;
  gap: var(--tc-space-0-5, var(--_tc-space-0-5));
  min-width: 0;
}
.ui-pl__name {
  color: var(--tc-text-primary, var(--_tc-text-primary));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  overflow-wrap: anywhere;
  transition: color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
.ui-pl[data-status="draft"] .ui-pl__name {
  cursor: text;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__step[data-step="pending"] .ui-pl__name {
  color: var(--tc-text-muted, var(--_tc-text-muted));
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__step[data-step="pending"] .ui-pl__name {
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
}
.ui-pl__step[data-step="skipped"] .ui-pl__name {
  color: var(--tc-text-muted, var(--_tc-text-muted));
  text-decoration: line-through;
  text-decoration-color: var(--tc-text-disabled, var(--_tc-text-disabled));
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__sub {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-2, var(--_tc-space-2));
  min-width: 0;
  color: var(--tc-text-muted, var(--_tc-text-muted));
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug));
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__sub {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-2, var(--_tc-space-2));
  min-width: 0;
  color: var(--tc-text-muted, var(--_tc-text-muted));
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight));
}
.ui-pl__detail {
  min-width: 0;
  overflow-wrap: anywhere;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__tool {
  padding: 1px var(--tc-space-1-5, var(--_tc-space-1-5));
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  background: var(--tc-fill-default, var(--_tc-fill-default));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  font-family: ui-monospace, "SF Mono", Menlo, monospace;
  font-size: var(--tc-font-size-xs, var(--_tc-font-size-xs));
  line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight));
  letter-spacing: 0;
  white-space: nowrap;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__edit {
  width: calc(100% + 14px);
  height: 26px;
  margin: -3px -7px;
  padding: 0 var(--tc-space-1-5, var(--_tc-space-1-5));
  border: 0;
  border-radius: var(--tc-radius-md, var(--_tc-radius-md));
  background: var(--tc-agent-plan-raise-bg);
  box-shadow: var(--tc-field-shadow-focus, var(--_tc-field-shadow-focus));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  font: inherit;
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  letter-spacing: inherit;
  outline: none;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__tool {
  padding: 0 var(--tc-space-1, var(--_tc-space-1));
  border-radius: var(--tc-radius-badge, var(--_tc-radius-badge));
  background: var(--tc-fill-default, var(--_tc-fill-default));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  font-family: ui-monospace, "SF Mono", Menlo, monospace;
  font-size: var(--tc-font-size-xs, var(--_tc-font-size-xs));
  line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight));
  letter-spacing: 0;
  white-space: nowrap;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__edit {
  width: calc(100% + 14px);
  height: 28px;
  margin: -4px -7px;
  padding: 0 var(--tc-space-1-5, var(--_tc-space-1-5));
  border: 0;
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  box-shadow: 0 0 0 0.5px var(--tc-focus-ring, var(--_tc-focus-ring)), 0 0 0 3px var(--tc-agent-plan-edit-glow);
  color: var(--tc-text-primary, var(--_tc-text-primary));
  font: inherit;
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  letter-spacing: inherit;
  outline: none;
}
/* Failed: an error line and a way back in */
.ui-pl__fail {
  display: grid;
  justify-items: start;
  gap: var(--tc-space-2, var(--_tc-space-2));
  margin-top: var(--tc-space-1, var(--_tc-space-1));
  animation: ui-pl-fade var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__error {
  color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg));
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug));
  overflow-wrap: anywhere;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__retry {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5, var(--_tc-space-1-5));
  height: 28px;
  padding: 0 var(--tc-space-2-5, var(--_tc-space-2-5)) 0 var(--tc-space-2, var(--_tc-space-2));
  border-radius: var(--tc-radius-md, var(--_tc-radius-md));
  background: var(--tc-agent-plan-raise-bg);
  box-shadow: inset 0 0 0 1px var(--tc-border-default, var(--_tc-border-default)), var(--tc-shadow-control, var(--_tc-shadow-control));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__retry svg {
  width: 13px;
  height: 13px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__retry:hover {
  background: var(--tc-fill-hover, var(--_tc-fill-hover));
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__retry:active {
  transform: scale(0.97);
}
/* Right column: remove, live timer, duration */
:where([data-look="standard"], [data-look="standard"] *).ui-pl__aside {
  display: flex;
  align-items: center;
  min-height: 20px;
  color: var(--tc-text-muted, var(--_tc-text-muted));
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__error {
  color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg));
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight));
  overflow-wrap: anywhere;
}
/* Secondary: white with the card's hairline shadow */
/* Actions look exactly like Button: control geometry, flat ink primary, secondary and ghost */
.ui-pl__btn {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5, var(--_tc-space-1-5));
  height: var(--tc-control-h-md, var(--_tc-control-h-md));
  padding: 0 var(--tc-control-px-md, var(--_tc-control-px-md));
  border-radius: var(--tc-control-radius-md, var(--_tc-control-radius-md));
  font-size: var(--tc-control-font-size, var(--_tc-control-font-size));
  font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight));
  white-space: nowrap;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-move, var(--_tc-ease-move));
}
.ui-pl__btn--primary {
  padding-right: calc(var(--tc-control-px-md, var(--_tc-control-px-md)) - 2px);
  background: var(--tc-action-primary-bg, var(--_tc-action-primary-bg));
  box-shadow: var(--tc-action-primary-shadow, var(--_tc-action-primary-shadow));
  color: var(--tc-action-primary-fg, var(--_tc-action-primary-fg));
}
.ui-pl__btn--primary:hover:not(:disabled) { background: var(--tc-action-primary-bg-hover, var(--_tc-action-primary-bg-hover)); }
.ui-pl__btn--primary:active:not(:disabled) { background: var(--tc-action-primary-bg-active, var(--_tc-action-primary-bg-active)); }
.ui-pl__btn--quiet { color: var(--tc-action-ghost-fg, var(--_tc-action-ghost-fg)); }
.ui-pl__btn--quiet:hover { background: var(--tc-action-ghost-bg-hover, var(--_tc-action-ghost-bg-hover)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-pl__retry,
:where([data-look="clean"], [data-look="clean"] *).ui-pl__btn--secondary {
  background: var(--tc-action-secondary-bg, var(--_tc-action-secondary-bg));
  box-shadow: var(--tc-action-secondary-shadow, var(--_tc-action-secondary-shadow));
  color: var(--tc-action-secondary-fg, var(--_tc-action-secondary-fg));
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__retry,
:where([data-look="clean"], [data-look="clean"] *).ui-pl__again {
  padding: 0 var(--tc-space-2-5, var(--_tc-space-2-5)) 0 var(--tc-space-2, var(--_tc-space-2));
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__retry svg,
:where([data-look="clean"], [data-look="clean"] *).ui-pl__btn--secondary svg {
  width: 16px;
  height: 16px;
  color: var(--tc-icon-muted, var(--_tc-icon-muted));
  fill: none;
  stroke: currentColor;
  stroke-width: 1.1;
  stroke-linecap: round;
  stroke-linejoin: round;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__retry:hover,
:where([data-look="clean"], [data-look="clean"] *).ui-pl__btn--secondary:hover {
  box-shadow: var(--tc-action-secondary-shadow-hover, var(--_tc-action-secondary-shadow-hover));
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__retry:active,
:where([data-look="clean"], [data-look="clean"] *).ui-pl__btn:active {
  transform: scale(0.97);
}
/* Right column: remove, live timer, duration */
:where([data-look="clean"], [data-look="clean"] *).ui-pl__aside {
  display: flex;
  align-items: center;
  min-height: 20px;
  color: var(--tc-text-muted, var(--_tc-text-muted));
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.ui-pl__time {
  animation: ui-pl-fade var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)) both;
}
.ui-pl__step[data-step="active"] .ui-pl__time {
  color: var(--tc-text-primary, var(--_tc-text-primary));
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__remove {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  margin: -2px -4px 0 0;
  border-radius: var(--tc-control-radius-sm, var(--_tc-control-radius-sm));
  color: var(--tc-icon-muted, var(--_tc-icon-muted));
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  opacity: 0;
  transition: opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__remove svg {
  width: 14px;
  height: 14px;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__remove {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  margin: -4px -6px -4px 0;
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  color: var(--tc-icon-muted, var(--_tc-icon-muted));
  fill: none;
  stroke: currentColor;
  stroke-width: 1.1;
  stroke-linecap: round;
  opacity: 0;
  transition: opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__remove svg {
  width: 16px;
  height: 16px;
}
.ui-pl__step:hover .ui-pl__remove,
.ui-pl__step:focus-visible .ui-pl__remove,
.ui-pl__remove:focus-visible {
  opacity: 1;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__remove:hover {
  color: var(--tc-text-primary, var(--_tc-text-primary));
  background: var(--tc-fill-hover, var(--_tc-fill-hover));
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__remove:hover {
  color: var(--tc-text-primary, var(--_tc-text-primary));
  background: var(--tc-fill-subtle, var(--_tc-fill-subtle));
}
.ui-pl__remove:focus-visible,
.ui-pl__retry:focus-visible,
.ui-pl__btn:focus-visible {
  outline: var(--tc-focus-outline, var(--_tc-focus-outline));
  outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset));
}
/* Progress line: a segment under each marker that fills when the step finishes */
:where([data-look="standard"], [data-look="standard"] *).ui-pl__rail {
  position: absolute;
  top: 35px;
  bottom: -5px;
  left: calc(var(--tc-agent-plan-inset) + 10.5px);
  width: 1px;
  overflow: hidden;
  background: var(--tc-border-default, var(--_tc-border-default));
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
/* Progress line: a segment under each marker that fills blue when the step finishes */
:where([data-look="clean"], [data-look="clean"] *).ui-pl__rail {
  position: absolute;
  top: 31px;
  bottom: -5px;
  left: calc(var(--tc-agent-plan-inset) + 9.5px);
  width: 1px;
  overflow: hidden;
  background: var(--tc-agent-plan-rail);
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
.ui-pl:not([data-status="draft"]) .ui-pl__rail {
  opacity: 1;
  transition-delay: var(--tc-duration-moderate, var(--_tc-duration-moderate));
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__rail::after {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--tc-agent-plan-rail);
  transform: scaleY(0);
  transform-origin: top;
  transition: transform var(--tc-duration-slowest, var(--_tc-duration-slowest)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__rail::after {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--tc-agent-plan-accent);
  transform: scaleY(0);
  transform-origin: top;
  transition: transform var(--tc-duration-slowest, var(--_tc-duration-slowest)) var(--tc-ease-move, var(--_tc-ease-move));
}
.ui-pl__step[data-step="done"] .ui-pl__rail::after,
.ui-pl__step[data-step="skipped"] .ui-pl__rail::after {
  transform: scaleY(1);
}
/* Add step folds away once running */
.ui-pl__tail {
  display: grid;
  grid-template-rows: 1fr;
  transition: grid-template-rows var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)), opacity var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
.ui-pl:not([data-status="draft"]) .ui-pl__tail {
  grid-template-rows: 0fr;
  opacity: 0;
}
.ui-pl__tail-inner {
  min-height: 0;
  overflow: hidden;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__add {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  column-gap: var(--tc-space-3, var(--_tc-space-3));
  align-items: center;
  margin: 0 var(--tc-space-1-5, var(--_tc-space-1-5)) var(--tc-space-2, var(--_tc-space-2));
  padding: 7px 10px 7px var(--tc-agent-plan-inset);
  border-radius: var(--tc-radius-lg, var(--_tc-radius-lg));
  cursor: text;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__add:hover,
:where([data-look="standard"], [data-look="standard"] *).ui-pl__add:focus-within {
  background: var(--tc-fill-hover, var(--_tc-fill-hover));
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__add-icon {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: var(--tc-radius-full, var(--_tc-radius-full));
  outline: 1px dashed var(--tc-text-disabled, var(--_tc-text-disabled));
  outline-offset: -1px;
  color: var(--tc-text-muted, var(--_tc-text-muted));
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__add-icon svg {
  width: 12px;
  height: 12px;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__add input {
  width: 100%;
  min-width: 0;
  height: 22px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--tc-text-primary, var(--_tc-text-primary));
  font: inherit;
  letter-spacing: inherit;
  outline: none;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__add {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr);
  column-gap: var(--tc-space-2-5, var(--_tc-space-2-5));
  align-items: center;
  margin: -4px var(--tc-space-1-5, var(--_tc-space-1-5)) var(--tc-space-2, var(--_tc-space-2));
  padding: 6px 10px 6px var(--tc-agent-plan-inset);
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  cursor: text;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__add:hover,
:where([data-look="clean"], [data-look="clean"] *).ui-pl__add:focus-within {
  background: var(--tc-fill-subtle, var(--_tc-fill-subtle));
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__add-icon {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  color: var(--tc-icon-muted, var(--_tc-icon-muted));
  fill: none;
  stroke: currentColor;
  stroke-width: 1.1;
  stroke-linecap: round;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__add-icon svg {
  width: 16px;
  height: 16px;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__add input {
  width: 100%;
  min-width: 0;
  height: 20px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--tc-text-primary, var(--_tc-text-primary));
  font: inherit;
  letter-spacing: inherit;
  outline: none;
}
.ui-pl__add:focus-within {
  outline: var(--tc-focus-outline, var(--_tc-focus-outline));
  outline-offset: calc(-1 * var(--tc-focus-ring-width, var(--_tc-focus-ring-width)));
}
.ui-pl__status:focus-visible {
  outline: var(--tc-focus-outline, var(--_tc-focus-outline));
  outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset));
}
.ui-pl__status:focus:not(:focus-visible) {
  outline: none;
}
/* Move up / down: shown with remove on hover or focus, laid over the row's end so they take no room */
.ui-pl__aside {
  position: relative;
}
.ui-pl__moves {
  position: absolute;
  top: 0;
  right: 100%;
  display: flex;
  gap: var(--tc-space-0-5, var(--_tc-space-0-5));
  padding: 0 var(--tc-space-0-5, var(--_tc-space-0-5)) 0 var(--tc-space-1, var(--_tc-space-1));
  border-radius: var(--tc-control-radius-sm, var(--_tc-control-radius-sm));
  pointer-events: none;
}
.ui-pl__move {
  margin-right: 0;
}
.ui-pl__step:hover .ui-pl__moves,
.ui-pl__moves:focus-within {
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  pointer-events: auto;
}
.ui-pl__moves:focus-within .ui-pl__move,
.ui-pl__step:focus-within .ui-pl__remove {
  opacity: 1;
}
@media (hover: none) {
  .ui-pl__moves {
    position: static;
    pointer-events: auto;
  }
}
.ui-pl__add input::placeholder {
  color: var(--tc-text-muted, var(--_tc-text-muted));
  opacity: 1;
}
/* The tray below the card */
:where([data-look="standard"], [data-look="standard"] *).ui-pl__foot {
  display: flex;
  align-items: center;
  gap: var(--tc-space-3, var(--_tc-space-3));
  min-height: 46px;
  padding: 0 var(--tc-space-1-5, var(--_tc-space-1-5)) 0 var(--tc-space-3, var(--_tc-space-3));
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  color: var(--tc-text-muted, var(--_tc-text-muted));
  animation: ui-pl-fade var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__hint {
  min-width: 0;
  overflow: hidden;
  color: var(--tc-text-muted, var(--_tc-text-muted));
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* The card's last row: hint and actions, then the run's status */
:where([data-look="clean"], [data-look="clean"] *).ui-pl__foot {
  display: flex;
  align-items: center;
  gap: var(--tc-space-3, var(--_tc-space-3));
  min-height: 48px;
  padding: 0 var(--tc-space-2-5, var(--_tc-space-2-5)) 0 var(--tc-space-4, var(--_tc-space-4));
  border-top: 0.5px solid var(--tc-border-default, var(--_tc-border-default));
  color: var(--tc-text-muted, var(--_tc-text-muted));
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight));
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__foot > * {
  animation: ui-pl-fade var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__hint {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ui-pl__hint.ui-pl__hint--error {
  display: block;
  color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg));
}
.ui-pl__actions {
  display: flex;
  flex: none;
  gap: var(--tc-space-2, var(--_tc-space-2));
  margin-left: auto;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__btn:active {
  transform: scale(0.97);
}
/* Primary: the dark chip */
.ui-pl__btn--primary:disabled {
  opacity: 0.4;
  cursor: default;
  transform: none;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__btn--primary svg {
  width: 12px;
  height: 12px;
  fill: currentColor;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__btn--quiet svg {
  width: 13px;
  height: 13px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
/* Status on the tray while running and after */
:where([data-look="standard"], [data-look="standard"] *).ui-pl__status {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-2, var(--_tc-space-2));
  min-width: 0;
  color: var(--tc-text-primary, var(--_tc-text-primary));
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__btn--primary svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
}
/* Status in the last row while running and after */
:where([data-look="clean"], [data-look="clean"] *).ui-pl__status {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-2, var(--_tc-space-2));
  min-width: 0;
  color: var(--tc-text-primary, var(--_tc-text-primary));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__status-icon {
  flex: none;
  width: 16px;
  height: 16px;
  color: var(--tc-agent-plan-accent);
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__status-icon .ui-pl__spinner {
  width: 14px;
  height: 14px;
  margin: 1px;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__badge circle {
  fill: currentColor;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__badge path {
  fill: none;
  stroke: var(--tc-text-on-accent, var(--_tc-text-on-accent));
  stroke-width: 1.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__foot[data-phase="failed"] .ui-pl__status-icon {
  color: var(--tc-status-danger-bg, var(--_tc-status-danger-bg));
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__foot[data-phase="failed"] .ui-pl__badge path {
  stroke: var(--tc-status-danger-fg, var(--_tc-status-danger-fg));
  stroke-width: 1.6;
}
.ui-pl__foot[data-phase="failed"] .ui-pl__status {
  color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg));
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__status-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__elapsed {
  margin-left: auto;
  padding-right: var(--tc-space-1-5, var(--_tc-space-1-5));
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__status-label {
  position: relative;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__foot[data-phase="done"] .ui-pl__status-label {
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
}
/* Running: gray text with a light band sweeping through */
:where([data-look="clean"], [data-look="clean"] *).ui-pl__shimmer {
  position: relative;
  color: var(--tc-text-muted, var(--_tc-text-muted));
}
.ui-pl__shine {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  -webkit-mask-image: linear-gradient(90deg, transparent, black 50%, transparent);
  mask-image: linear-gradient(90deg, transparent, black 50%, transparent);
  animation: ui-pl-sweep var(--tc-duration-shimmer, var(--_tc-duration-shimmer)) linear 3 both;
}
.ui-pl__shine > span {
  display: block;
  white-space: nowrap;
  color: var(--tc-agent-plan-shine);
  animation: ui-pl-sweep-text var(--tc-duration-shimmer, var(--_tc-duration-shimmer)) linear 3 both;
}
@keyframes ui-pl-sweep {
  from { transform: translateX(-100%); }
  to { transform: translateX(100%); }
}
@keyframes ui-pl-sweep-text {
  from { transform: translateX(100%); }
  to { transform: translateX(-100%); }
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__elapsed {
  margin-left: auto;
  padding-right: var(--tc-space-1-5, var(--_tc-space-1-5));
  color: var(--tc-text-muted, var(--_tc-text-muted));
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
/* Touch screens have no hover: keep the grip and remove button visible */
@media (hover: none) {
  .ui-pl__grip,
  .ui-pl__remove {
    opacity: 1;
  }
}
@media (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-pl__foot { min-height: 56px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pl__btn,
:where([data-look="clean"], [data-look="clean"] *).ui-pl__retry { height: 36px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pl__remove { width: 36px; height: 36px; margin: -8px -10px -8px 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-pl__grip::after { content: ""; position: absolute; inset: -8px -6px; }
}
/* Narrow: drop the hint, tighten the gutters */
@container (max-width: 400px) {
  .ui-pl__hint {
    display: none;
  }
}
@container (max-width: 340px) {
:where([data-look="standard"], [data-look="standard"] *).ui-pl__head {
    padding: var(--tc-space-3-5, var(--_tc-space-3-5)) var(--tc-space-3-5, var(--_tc-space-3-5)) var(--tc-space-2, var(--_tc-space-2));
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__list {
    padding-inline: var(--tc-space-1, var(--_tc-space-1));
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__step,
:where([data-look="standard"], [data-look="standard"] *).ui-pl__add {
    column-gap: var(--tc-space-2-5, var(--_tc-space-2-5));
    padding-right: var(--tc-space-2, var(--_tc-space-2));
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__add {
    margin-inline: var(--tc-space-1, var(--_tc-space-1));
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__foot {
    padding-left: var(--tc-space-2-5, var(--_tc-space-2-5));
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__btn {
    padding: 0 var(--tc-space-3, var(--_tc-space-3));
}
}
@container (max-width: 340px) {
:where([data-look="clean"], [data-look="clean"] *).ui-pl__head {
    padding: var(--tc-space-3-5, var(--_tc-space-3-5)) var(--tc-space-3-5, var(--_tc-space-3-5)) var(--tc-space-2-5, var(--_tc-space-2-5));
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__list {
    padding-inline: var(--tc-space-1, var(--_tc-space-1));
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__step,
:where([data-look="clean"], [data-look="clean"] *).ui-pl__add {
    column-gap: var(--tc-space-2, var(--_tc-space-2));
    padding-right: var(--tc-space-2, var(--_tc-space-2));
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__add {
    margin-inline: var(--tc-space-1, var(--_tc-space-1));
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__foot {
    padding-left: var(--tc-space-3-5, var(--_tc-space-3-5));
}
}
@keyframes ui-pl-fade {
  from { opacity: 0; transform: translateY(3px); }
  to { opacity: 1; transform: none; }
}
@keyframes ui-pl-enter {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: none; }
}
@keyframes ui-pl-pop {
  from { opacity: 0; transform: scale(0.5); }
  to { opacity: 1; transform: none; }
}
@keyframes ui-pl-draw {
  to { stroke-dashoffset: 0; }
}
@keyframes ui-pl-ray {
  0% { opacity: 1; }
  100% { opacity: 0.18; }
}
@media (prefers-reduced-motion: reduce) {
:where([data-look="standard"], [data-look="standard"] *).ui-pl *,
:where([data-look="standard"], [data-look="standard"] *).ui-pl *::before,
:where([data-look="standard"], [data-look="standard"] *).ui-pl *::after {
    animation-duration: 1ms !important;
    animation-delay: 0ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
    transition-delay: 0ms !important;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pl__spinner line { opacity: 0.6; }
:where([data-look="standard"], [data-look="standard"] *).ui-pl__draw { stroke-dashoffset: 0; }
}
@media (prefers-reduced-motion: reduce) {
:where([data-look="clean"], [data-look="clean"] *).ui-pl *,
:where([data-look="clean"], [data-look="clean"] *).ui-pl *::before,
:where([data-look="clean"], [data-look="clean"] *).ui-pl *::after {
    animation-duration: 1ms !important;
    animation-delay: 0ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
    transition-delay: 0ms !important;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pl__spinner line { opacity: 0.6; }
:where([data-look="clean"], [data-look="clean"] *).ui-pl__draw { stroke-dashoffset: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-pl__shimmer::after { display: none; }
}
`;
