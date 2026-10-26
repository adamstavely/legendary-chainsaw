"use client";

/*
 * Fan-out Grid – one agent hands a big job to many workers, and every task is a cell on a grid, in a single
 * self-contained file. Like a contribution graph, but live: hundreds of cells fill in as the workers get through them.
 * A soft gray tray with what runs and how far it is, a white card with the grid, the counts on the tray below.
 *   · cells are tinted by state: queued a faint gray, running blue with a sweeping shine, retrying amber,
 *     done green (with a small pop when it lands), failed red
 *   · done, cost and the time left are counted on top; the counts under the card double as a filter – pick a
 *     state and every other cell steps back
 *   · point at a cell (or move with the arrow keys) for a small window: the task, its worker, how long it took,
 *     what it cost, how often it was tried, and its result or error – click or Enter keeps it open
 *   · failed tasks can be sent again with "Retry failed"
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: fan-out-grid.tsx is Standard,
 * fan-out-grid-clean.tsx is Clean). Clean drops the tray: a bar on top, one white panel with the grid, and the
 * counts per state – still a filter, with Retry – as a quiet line inside the panel, under the grid.
 */
// Generated from src/components/fan-out-grid.tsx by scripts/build-lib.mjs – edit the source, not this file.

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ComponentPropsWithoutRef, type KeyboardEvent, type ReactNode, type Ref, type RefObject } from "react";

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-fog";

export type FanoutStatus = "queued" | "running" | "retrying" | "done" | "failed";

export type FanoutTask = {
  id: string;
  /** What this task is about, in a few words – e.g. "northwind.io" */
  label: string;
  status: FanoutStatus;
  /** Who works on it, e.g. "Researcher 3" */
  worker?: string;
  /** When it started and ended – epoch ms, on the same clock as `now` (or ms from the start of the job with `elapsed`) */
  start?: number;
  end?: number;
  cost?: number;
  /** How often it was tried – 2 and more show as retries */
  attempts?: number;
  /** What came out, one line – shown in the window of a finished task */
  result?: string;
  /** What went wrong – shown in the window of a failed or retrying task */
  error?: string;
};

type FanoutGridOwnProps = {
  /** Visual style. Defaults to the file's look: Standard in fan-out-grid.tsx, Clean in fan-out-grid-clean.tsx */
  look?: Look;
  tasks: FanoutTask[];
  /** What the whole job does – e.g. "Enrich 240 leads" */
  job?: string;
  /** How many workers run at once – used for the time left (defaults to the tasks running now) */
  workers?: number;
  /** The clock, in epoch ms – without it (and without `elapsed`) the grid reads the clock after mount and ticks while
   *  tasks run */
  now?: number;
  /** When the job started, in epoch ms – for the time so far. Defaults to the earliest task start */
  startedAt?: number;
  /**
   * The clock as ms from the start of the job – the meaning `now` had before; task start/end are then job-relative
   * too. Takes precedence over `now`
   */
  elapsed?: number;
  /**
   * "Retry failed" sends the ids of the failed tasks here – without it, the button doesn't show. Return a promise to
   * hold the button while it runs; a rejection says so and the button stays to try again
   */
  onRetry?: (ids: string[]) => void | Promise<unknown>;
  /** The id of the task whose window is kept open. Controlled when defined (null: none) */
  selected?: string | null;
  /** The task kept open on mount when `selected` isn't controlled */
  defaultSelected?: string | null;
  /** Called with the id of the task kept open (null when let go), controlled or not */
  onSelectedChange?: (id: string | null) => void;
  /** A task was picked (click or Enter) – null when it's let go */
  onSelect?: (task: FanoutTask | null) => void;
  /** The state every other cell steps back from. Controlled when defined (null: no filter) */
  filter?: FanoutStatus | null;
  /** The filter on mount when `filter` isn't controlled */
  defaultFilter?: FanoutStatus | null;
  /** Called with the new filter, controlled or not */
  onFilterChange?: (filter: FanoutStatus | null) => void;
  /** Formats every cost – defaults to dollars, e.g. "$0.014" */
  formatCost?: (amount: number) => string;
  title?: string;
  /** A small mark before the title, e.g. the agent's logo */
  icon?: ReactNode;
  className?: string;
  /** The root element */
  ref?: Ref<HTMLDivElement>;
};

export type FanoutGridProps = Omit<ComponentPropsWithoutRef<"div">, keyof FanoutGridOwnProps> & FanoutGridOwnProps;

/* ---------- Helpers ---------- */

const ORDER: FanoutStatus[] = ["done", "running", "retrying", "failed", "queued"];
/** The states the line under the grid counts – queued is simply what's left */
const SHOWN: FanoutStatus[] = ["done", "running", "retrying", "failed"];
const LABEL: Record<FanoutStatus, string> = { queued: "Queued", running: "Running", retrying: "Retrying", done: "Done", failed: "Failed" };
const SEC = 1000;
const dollars = (n: number) => (n === 0 ? "$0" : n < 0.01 ? `$${n.toFixed(3)}` : n < 100 ? `$${n.toFixed(2)}` : `$${Math.round(n).toLocaleString("en-US")}`);
const took = (ms: number) => {
  if (ms < SEC) return `${Math.max(0, Math.round(ms))}ms`;
  if (ms < 10 * SEC) return `${(ms / SEC).toFixed(1)}s`;
  const s = Math.round(ms / SEC);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
};

/* ---------- Icons ---------- */

/* A small fan-out mark for the title (drawn for affectUI) */
const FanMark = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="3" cy="8" r="1.9" fill="currentColor" />
    <rect x="10.2" y="1.6" width="3.6" height="3.6" rx="1" fill="currentColor" opacity="0.9" />
    <rect x="10.2" y="6.2" width="3.6" height="3.6" rx="1" fill="currentColor" opacity="0.6" />
    <rect x="10.2" y="10.8" width="3.6" height="3.6" rx="1" fill="currentColor" opacity="0.3" />
    <path d="M4.9 8H7c.6 0 .9-.3 1-.9l.4-2.4c.1-.6.4-.9 1-.9h.6M4.9 8h5.1M4.9 8H7c.6 0 .9.3 1 .9l.4 2.4c.1.6.4.9 1 .9h.6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
  </svg>
);
/* rotate-cw: Lucide (ISC, lucide.dev) */
const Retry = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
  </svg>
);

export function FanoutGrid({
  look,
  tasks,
  job,
  workers,
  now: nowProp,
  startedAt,
  elapsed: elapsedProp,
  onRetry,
  selected,
  defaultSelected = null,
  onSelectedChange,
  onSelect,
  filter: filterProp,
  defaultFilter = null,
  onFilterChange,
  formatCost = dollars,
  title = "Fan-out",
  icon,
  className,
  ref,
  ...rest
}: FanoutGridProps) {
  const resolvedLook = look ?? DEFAULT_LOOK;
  const rootRef = useRef<HTMLDivElement>(null);
  const rootRefs = useRootRef(rootRef, ref);
  const onScreen = useOnScreen(rootRef);
  const panelRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const cellEls = useRef<(HTMLSpanElement | null)[]>([]);
  const uid = useId();
  const tipId = `${uid}-tip`;
  const cellId = (i: number) => `${uid}-c${i}`;
  // Retry goes away once nothing has failed – focus moves to the grid instead of <body> (WCAG 2.4.3)
  useFocusRescue(rootRef, { fallback: () => gridRef.current });

  const [hover, setHoverNow] = useState<number | null>(null);
  // The window can be hovered (WCAG 1.4.13): leaving the grid for it doesn't close it – a short grace covers the gap
  const leaveTimer = useRef<number | undefined>(undefined);
  const setHover = (i: number | null) => {
    window.clearTimeout(leaveTimer.current);
    setHoverNow(i);
  };
  const leaveSoon = () => {
    window.clearTimeout(leaveTimer.current);
    leaveTimer.current = window.setTimeout(() => setHoverNow(null), 150);
  };
  useEffect(() => () => window.clearTimeout(leaveTimer.current), []);
  // Escape closes a window opened by pointing, wherever focus is, without moving focus (WCAG 1.4.13)
  useEffect(() => {
    if (hover === null) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setHoverNow(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [hover]);
  const [pinned, setPinned] = useControllable(selected, defaultSelected, onSelectedChange ?? (onSelect ? () => {} : undefined), "selected");
  const [active, setActive] = useState<number | null>(null);
  const [filter, setFilter] = useControllable(filterProp, defaultFilter, onFilterChange, "filter");
  const [retrying, setRetrying] = useState(false);
  const [retryFailed, setRetryFailed] = useState(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  /* ---------- The numbers ---------- */

  const count = Object.fromEntries(ORDER.map((s) => [s, 0])) as Record<FanoutStatus, number>;
  for (const t of tasks) count[t.status]++;
  const total = tasks.length;
  const settled = count.done + count.failed;
  const cost = tasks.reduce((sum, t) => sum + (t.cost ?? 0), 0);
  const finished = total > 0 && settled === total;
  const durations = tasks.filter((t) => t.status === "done" && t.start !== undefined && t.end !== undefined).map((t) => t.end! - t.start!);
  const avg = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
  const busy = count.running + count.retrying;
  const left = total - settled;
  const lanes = Math.max(1, workers ?? busy);
  const eta = durations.length >= 3 && left > 0 ? (avg * left) / lanes : null;

  /* ---------- The clock: `elapsed` (job-relative), else `now` (epoch ms), else our own, read after mount ---------- */

  const own = nowProp === undefined && elapsedProp === undefined;
  const [tick, setTick] = useState<number | null>(null);
  // Ticks while tasks run and someone can see it – off screen or in a hidden tab the clock waits, and reads again on return
  const ticking = own && !finished && busy > 0 && onScreen;
  useEffect(() => {
    if (!own) return;
    const read = () => setTick(Date.now());
    read();
    if (!ticking) return;
    const id = window.setInterval(read, SEC);
    return () => window.clearInterval(id);
  }, [own, ticking]);
  const starts = tasks.flatMap((t) => (t.start === undefined ? [] : [t.start]));
  // Where the job's time counts from: 0 for job-relative times, else when it started
  const origin = elapsedProp !== undefined ? 0 : (startedAt ?? (starts.length ? Math.min(...starts) : null));
  const now = elapsedProp ?? nowProp ?? tick;
  const elapsed = finished ? Math.max(0, Math.max(0, ...tasks.map((t) => t.end ?? 0)) - (origin ?? 0)) : now !== null && origin !== null ? Math.max(0, now - origin) : 0;

  /* ---------- The window over a cell ---------- */

  const pinnedIndex = pinned ? tasks.findIndex((t) => t.id === pinned) : -1;
  const shown = pinnedIndex >= 0 ? pinnedIndex : (hover ?? active);
  const task = shown !== null && shown >= 0 ? tasks[shown] : undefined;
  const pick = (i: number | null) => {
    const t = i === null ? undefined : tasks[i];
    const next = t && t.id !== pinned ? t.id : null;
    setPinned(next);
    onSelect?.(next ? t! : null);
  };
  const retry = async () => {
    if (!onRetry || retrying) return;
    setRetryFailed(false);
    let result: void | Promise<unknown>;
    try {
      result = onRetry(tasks.filter((t) => t.status === "failed").map((t) => t.id));
    } catch {
      setRetryFailed(true);
      return;
    }
    if (!result || typeof (result as Promise<unknown>).then !== "function") return;
    setRetrying(true);
    try {
      await result;
    } catch {
      if (alive.current) setRetryFailed(true);
    }
    if (alive.current) setRetrying(false);
  };
  // The window sits over its cell: placed when it opens, and again when it or the panel changes size (reads, then writes)
  const shownId = task?.id;
  useLayoutEffect(() => {
    const tip = tipRef.current;
    const panel = panelRef.current;
    const cell = shown !== null ? cellEls.current[shown] : null;
    if (!tip || !panel || !cell) return;
    const place = () => {
      const p = panel.getBoundingClientRect();
      const scale = panel.offsetWidth ? p.width / panel.offsetWidth : 1;
      const c = cell.getBoundingClientRect();
      const cx = (c.left + c.width / 2 - p.left) / scale;
      const top = (c.top - p.top) / scale;
      const bottom = (c.bottom - p.top) / scale;
      const w = tip.offsetWidth;
      const h = tip.offsetHeight;
      // Above the cell; below it only when there's no room above
      const below = top - h - 10 < 4;
      const x = Math.max(8, Math.min(cx - w / 2, panel.offsetWidth - w - 8));
      tip.style.left = `${x}px`;
      tip.style.top = `${below ? bottom + 10 : top - h - 10}px`;
      tip.style.setProperty("--x", `${cx - x}px`);
      tip.dataset.side = below ? "below" : "above";
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(tip);
    ro.observe(panel);
    return () => ro.disconnect();
  }, [shown, shownId]);

  /* ---------- Keyboard: arrows walk the grid, Enter keeps the window, Escape lets go ---------- */

  const columns = () => {
    const first = cellEls.current[0];
    const grid = gridRef.current;
    if (!first || !grid) return 1;
    const top = first.offsetTop;
    let n = 0;
    for (const el of cellEls.current) {
      if (!el || el.offsetTop !== top) break;
      n++;
    }
    return Math.max(1, n);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!total) return;
    const cols = columns();
    const at = active ?? 0;
    const moves: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols, Home: -at, End: total - 1 - at };
    if (e.key in moves) {
      e.preventDefault();
      setPinned(null);
      setActive(Math.max(0, Math.min(total - 1, (active === null ? 0 : at + moves[e.key]))));
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      if (e.nativeEvent.isComposing) return;
      e.preventDefault();
      pick(at);
    } else if (e.key === "Escape") {
      setHover(null);
      setPinned(null);
      setActive(null);
      onSelect?.(null);
    }
  };

  /* ---------- What a screen reader hears: the run in steps of ten percent, then the result (WCAG 4.1.3) ---------- */

  const step = total ? Math.floor((settled / total) * 10) : 0;
  const said = finished
    ? `Finished: ${count.done} done, ${count.failed} failed, ${formatCost(cost)}.`
    : `${step * 10}% of ${total} tasks done.`;

  // The states – each one a filter – and, while some failed, Retry: on the tray under the card (Standard), or as a
  // quiet line inside the panel, under the grid (Clean)
  const foot = (
    <div className="ui-fog__foot">
      <div className="ui-fog__legend" role="group" aria-label="Show only">
        {SHOWN.map((st) => (
          <button
            key={st}
            type="button"
            className="ui-fog__key"
            data-status={st}
            aria-pressed={filter === st}
            data-off={filter && filter !== st ? "" : undefined}
            data-zero={count[st] === 0 && st !== "done" ? "" : undefined}
            onClick={() => setFilter((f) => (f === st ? null : st))}
          >
            <span className="ui-fog__swatch" aria-hidden="true" />
            <span className="ui-fog__n">{count[st]}</span> {LABEL[st].toLowerCase()}
          </button>
        ))}
      </div>
      {onRetry && count.failed > 0 && (
        <button
          type="button"
          className="ui-fog__retry"
          aria-disabled={retrying || undefined}
          aria-busy={retrying || undefined}
          data-error={retryFailed ? "" : undefined}
          onClick={() => void retry()}
        >
          <Retry />
          {retrying ? "Retrying…" : retryFailed ? "Couldn't retry – try again" : "Retry failed"}
        </button>
      )}
      {retryFailed && (
        <span className="ui-fog__sr" role="alert">
          Couldn't retry the failed tasks.
        </span>
      )}
    </div>
  );

  return (
    <div
      {...rest}
      ref={rootRefs}
      className={[ROOT_CLASS, className].filter(Boolean).join(" ")}
      data-look={resolvedLook}
      data-offscreen={onScreen ? undefined : ""}
    >
      <style href="ui-fan-out-grid" precedence="default">
        {css}
      </style>

      <header className="ui-fog__bar">
        <span className="ui-fog__mark">{icon ?? <FanMark />}</span>
        <span className="ui-fog__title">{title}</span>
        {job && (
          <span className="ui-fog__job" title={job}>
            {job}
          </span>
        )}
        <span className="ui-fog__sum">
          <span>
            <b>{count.done}</b> / {total}
          </span>
          <span>
            <b>{formatCost(cost)}</b>
          </span>
          <span className="ui-fog__time" data-done={finished ? "" : undefined}>
            {finished ? `Finished in ${took(elapsed)}` : eta !== null ? `~${took(eta)} left` : `${took(elapsed)} so far`}
          </span>
        </span>
      </header>

      <div ref={panelRef} className="ui-fog__panel">
        <div
          ref={gridRef}
          className="ui-fog__grid"
          role="listbox"
          aria-label={`${total} tasks – arrow keys move, Enter keeps the details`}
          aria-activedescendant={active !== null && active < total ? cellId(active) : undefined}
          aria-describedby={task ? tipId : undefined}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onMouseLeave={leaveSoon}
          onFocus={(e) => {
            // Focus moves in on the kept task, else the first one, so the details show on focus as on hover
            if (e.target === e.currentTarget && active === null && total) setActive(pinnedIndex >= 0 ? pinnedIndex : 0);
          }}
          onBlur={() => setActive(null)}
        >
          {tasks.map((t, i) => (
            <span
              key={t.id}
              ref={(el) => {
                cellEls.current[i] = el;
              }}
              id={cellId(i)}
              role="option"
              aria-label={`${t.label}, ${LABEL[t.status].toLowerCase()}`}
              aria-selected={pinned === t.id ? true : undefined}
              className="ui-fog__cell"
              data-status={t.status}
              data-dim={filter && filter !== t.status ? "" : undefined}
              data-on={shown === i ? "" : undefined}
              data-pinned={pinned === t.id ? "" : undefined}
              style={{ "--i": i, "--d": i % 13 } as CSSProperties}
              onMouseEnter={() => setHover(i)}
              onClick={() => pick(i)}
            />
          ))}
        </div>

        {resolvedLook === "clean" && foot}

        {task && (
          <div
            ref={tipRef}
            id={tipId}
            role="tooltip"
            className="ui-fog__tip"
            data-status={task.status}
            key={task.id}
            onMouseEnter={() => window.clearTimeout(leaveTimer.current)}
            onMouseLeave={() => setHover(null)}
          >
            <span className="ui-fog__tip-head">
              <span className="ui-fog__tip-label" title={task.label}>
                {task.label}
              </span>
              <span className="ui-fog__pill" data-status={task.status}>
                {LABEL[task.status]}
              </span>
            </span>
            <span className="ui-fog__tip-meta">
              {[
                task.worker,
                task.start !== undefined ? took((task.end ?? Math.max(now ?? task.start, task.start)) - task.start) : undefined,
                task.cost ? formatCost(task.cost) : undefined,
                (task.attempts ?? 1) > 1 ? `${task.attempts} attempts` : undefined,
              ]
                .filter(Boolean)
                .join(" · ") || "Waiting for a worker"}
            </span>
            {task.error && (task.status === "failed" || task.status === "retrying") && <span className="ui-fog__tip-error">{task.error}</span>}
            {task.result && task.status === "done" && <span className="ui-fog__tip-result">{task.result}</span>}
          </div>
        )}
      </div>

      {resolvedLook === "standard" && foot}

      <div className="ui-fog__sr" aria-live="polite" aria-atomic="true" data-step={step}>
        {said}
      </div>
    </div>
  );
}

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

/** Connected, not inside something inert or hidden, not disabled */
const focusable = (el: Element | null | undefined): boolean =>
  !!el && el.isConnected && el instanceof HTMLElement && !el.closest("[inert],[hidden]") && !(el as HTMLButtonElement).disabled;

/**
 * Moves focus to the first usable target, but only if focus is inside `from` now (call it before removing, disabling
 * or inerting `from`). Targets may be elements, selectors (looked up inside `within`, default document) or functions.
 */
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
.ui-fog:where([data-look="standard"]),
.ui-fog__portal:where([data-look="standard"]) {
  --_tc-accent-text: light-dark(#2456d6, #8ab4ff);
  --_tc-action-secondary-bg: light-dark(#ffffff, #232326);
  --_tc-action-secondary-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-shadow-hover: 0 0 0 1px light-dark(#dedede, #3a3a40), 0 6px 16px -8px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
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
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-shimmer: 1600ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-duration-slowest: 560ms;
  --_tc-ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --_tc-ease-move: cubic-bezier(0.22, 1, 0.36, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring: light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring-offset: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-sm-plus: 12.5px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-semibold: 600;
  --_tc-font-weight-strong: 600;
  --_tc-hairline: 1px;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-snug: 18px;
  --_tc-line-height-tight: 16px;
  --_tc-menu-bg: light-dark(#ffffff, #232326);
  --_tc-menu-radius: 12px;
  --_tc-menu-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 16px 36px -12px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-pill-font-size: 11px;
  --_tc-pill-font-weight: 500;
  --_tc-pill-h: 20px;
  --_tc-pill-px: 8px;
  --_tc-pill-radius: 999px;
  --_tc-radius-2xs: 2px;
  --_tc-radius-full: 999px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xs: 4px;
  --_tc-shadow-raised: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-shimmer: light-dark(rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.28));
  --_tc-status-danger-bg: light-dark(#fdecea, #3b1714);
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-danger-solid: light-dark(#e5484d, #ff6369);
  --_tc-status-info-bg: light-dark(#eaf1ff, #16243f);
  --_tc-status-info-fg: light-dark(#2456d6, #8ab4ff);
  --_tc-status-info-solid: light-dark(#2f68ff, #6b95ff);
  --_tc-status-success-bg: light-dark(#e6f6ec, #12301f);
  --_tc-status-success-fg: light-dark(#18794e, #3dd68c);
  --_tc-status-success-solid: light-dark(#1f8a4c, #3ec27a);
  --_tc-status-warning-bg: light-dark(#fff3e0, #3a2410);
  --_tc-status-warning-fg: light-dark(#a35200, #ffa057);
  --_tc-status-warning-solid: light-dark(#c2710c, #f5a524);
  --_tc-surface-on-tray: light-dark(#ffffff, #232326);
  --_tc-surface-raised: light-dark(#ffffff, #19191b);
  --_tc-surface-tray: light-dark(#f0f0f0, #19191b);
  --_tc-text-muted: light-dark(#646464, #9a9aa1);
  --_tc-text-primary: light-dark(#171717, #ededed);
  --_tc-text-secondary: light-dark(#404040, #c8c8cc);
  --_tc-text-strong: light-dark(#171717, #f5f5f5);
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(16px + 4px);
}
.ui-fog:where([data-look="clean"]),
.ui-fog__portal:where([data-look="clean"]) {
  --_tc-accent-text: light-dark(#0058cf, #70b8ff);
  --_tc-action-secondary-bg: light-dark(#ffffff, #252527);
  --_tc-action-secondary-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-shadow-hover: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 3px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
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
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-shimmer: 1600ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-duration-slowest: 560ms;
  --_tc-ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --_tc-ease-move: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring: light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring-offset: 1px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-sm-plus: 12.5px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-semibold: 600;
  --_tc-font-weight-strong: 500;
  --_tc-hairline: 0.5px;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-snug: 18px;
  --_tc-line-height-tight: 16px;
  --_tc-menu-bg: light-dark(#ffffff, #252527);
  --_tc-menu-radius: 10px;
  --_tc-menu-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 12px 28px -10px light-dark(rgba(0, 0, 0, 0.16), rgba(0, 0, 0, 0.6)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-pill-font-size: 11px;
  --_tc-pill-font-weight: 500;
  --_tc-pill-h: 18px;
  --_tc-pill-px: 6px;
  --_tc-pill-radius: 5px;
  --_tc-radius-2xs: 2px;
  --_tc-radius-full: 999px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xs: 4px;
  --_tc-shadow-raised: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-shimmer: light-dark(rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.3));
  --_tc-status-danger-bg: light-dark(rgba(245, 43, 0, 0.094), rgba(255, 53, 35, 0.17));
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-danger-solid: light-dark(#e5484d, #ff6369);
  --_tc-status-info-bg: light-dark(rgba(0, 143, 245, 0.1), rgba(0, 119, 255, 0.23));
  --_tc-status-info-fg: light-dark(#0058cf, #70b8ff);
  --_tc-status-info-solid: light-dark(#0060e2, #5b9aff);
  --_tc-status-success-bg: light-dark(rgba(0, 164, 51, 0.1), rgba(0, 240, 74, 0.12));
  --_tc-status-success-fg: light-dark(#18794e, #3dd68c);
  --_tc-status-success-solid: light-dark(#1f8a4c, #3ec27a);
  --_tc-status-warning-bg: light-dark(rgba(255, 156, 0, 0.16), rgba(251, 106, 0, 0.15));
  --_tc-status-warning-fg: light-dark(#a35200, #ffa057);
  --_tc-status-warning-solid: light-dark(#c2710c, #f5a524);
  --_tc-surface-on-tray: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-raised: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-tray: light-dark(#f7f7f7, #161618);
  --_tc-text-muted: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52));
  --_tc-text-primary: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-text-secondary: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-text-strong: light-dark(#000000, #ffffff);
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(10px + 4px);
}
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

/* Colors, sizes and motion as variables – override them on .ui-fog */
.ui-fog {
  --tc-fan-out-grid-cell: 12px;
  --tc-fan-out-grid-gap: 4px;
  position: relative;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  container: ui-fog / inline-size;
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Standard: a tray with the bar and the counts, the card with the grid on it */
:where([data-look="standard"], [data-look="standard"] *).ui-fog {
  padding: var(--tc-tray-inset, var(--_tc-tray-inset));
  border-radius: var(--tc-tray-radius, var(--_tc-tray-radius));
  background: var(--tc-surface-tray, var(--_tc-surface-tray));
  font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg));
  letter-spacing: -0.006em;
  color: var(--tc-text-muted, var(--_tc-text-muted));
}
:where([data-look="clean"], [data-look="clean"] *).ui-fog { font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
.ui-fog *, .ui-fog *::before, .ui-fog *::after { box-sizing: border-box; }
:where(.ui-fog) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; letter-spacing: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.ui-fog button:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
.ui-fog svg { display: block; flex: none; }
.ui-fog__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-fog__n { font-variant-numeric: tabular-nums; }
/* ----- The bar: what runs, and how far it is ----- */
.ui-fog__bar { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-fog__bar { padding: 8px 12px 12px; }
:where([data-look="clean"], [data-look="clean"] *).ui-fog__bar { margin-bottom: 16px; }
.ui-fog__mark { display: grid; flex: none; place-items: center; width: 16px; color: var(--tc-accent-text, var(--_tc-accent-text)); }
.ui-fog__mark > svg { width: 16px; height: 16px; }
.ui-fog__title { flex: none; font-weight: var(--tc-font-weight-strong, var(--_tc-font-weight-strong)); color: var(--tc-text-strong, var(--_tc-text-strong)); }
.ui-fog__job { min-width: 0; overflow: hidden; color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-fog__job { font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); }
.ui-fog__sum { display: flex; flex-wrap: wrap; align-items: center; gap: 2px 14px; margin-left: auto; color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-fog__sum { font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug)); }
:where([data-look="clean"], [data-look="clean"] *).ui-fog__sum { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); }
.ui-fog__sum b { font-weight: var(--tc-font-weight-strong, var(--_tc-font-weight-strong)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
.ui-fog__time[data-done] { color: var(--tc-status-success-fg, var(--_tc-status-success-fg)); }
:where([data-look="standard"], [data-look="standard"] *).ui-fog__time[data-done] { font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); }
/* ----- The card with the grid ----- */
.ui-fog__panel { position: relative; display: grid; border-radius: var(--tc-card-radius, var(--_tc-card-radius)); box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow)); }
:where([data-look="standard"], [data-look="standard"] *).ui-fog__panel { padding: 18px; background: var(--tc-surface-on-tray, var(--_tc-surface-on-tray)); }
:where([data-look="clean"], [data-look="clean"] *).ui-fog__panel { gap: 14px; padding: 16px 16px 14px; background: var(--tc-surface-raised, var(--_tc-surface-raised)); }
/* ----- A swatch and a count per state – each one a filter – and Retry: on the tray (Standard), in the panel (Clean) ----- */
.ui-fog__foot { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 12px; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-fog__foot { padding: 8px 6px 4px 8px; }
.ui-fog__legend { display: flex; flex-wrap: wrap; gap: 0 2px; }
:where([data-look="clean"], [data-look="clean"] *).ui-fog__legend { margin: -3px -6px; }
.ui-fog__key { display: inline-flex; align-items: center; height: var(--tc-control-h-sm, var(--_tc-control-h-sm)); color: var(--tc-text-muted, var(--_tc-text-muted)); transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-fog__key { gap: 7px; padding: 0 9px; border-radius: var(--tc-radius-full, var(--_tc-radius-full)); font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug)); }
:where([data-look="clean"], [data-look="clean"] *).ui-fog__key { gap: 6px; padding: 0 6px; border-radius: var(--tc-control-radius-sm, var(--_tc-control-radius-sm)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); }
:where([data-look="standard"], [data-look="standard"] *).ui-fog__key:hover { background: var(--tc-fill-default, var(--_tc-fill-default)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-fog__key:hover { background: var(--tc-fill-default, var(--_tc-fill-default)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
/* The picked state: a lifted chip with a ≥3:1 edge, not a fill alone (WCAG 1.4.11) */
.ui-fog__key[aria-pressed="true"] { color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-fog__key[aria-pressed="true"] { background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: inset 0 0 0 var(--tc-hairline, var(--_tc-hairline)) var(--tc-border-selected, var(--_tc-border-selected)), var(--tc-shadow-raised, var(--_tc-shadow-raised)); }
:where([data-look="clean"], [data-look="clean"] *).ui-fog__key[aria-pressed="true"] { background: var(--tc-fill-default, var(--_tc-fill-default)); box-shadow: inset 0 0 0 1px var(--tc-border-selected, var(--_tc-border-selected)); }
/* States that don't occur yet stay out of the line – on narrow containers they hold their place */
.ui-fog__key[data-zero] { display: none; }
/* Stepped back while another state is picked: the swatch fades, the text stays readable (WCAG 1.4.3) */
.ui-fog__key:is([data-off], [data-zero]) .ui-fog__swatch { opacity: 0.4; }
.ui-fog__key[data-off] .ui-fog__n { color: inherit; }
.ui-fog__key .ui-fog__n { color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-fog__key .ui-fog__n { font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold)); }
.ui-fog__swatch { position: relative; overflow: hidden; border-radius: var(--tc-radius-2xs, var(--_tc-radius-2xs)); background: var(--tc-fan-out-grid-status-fill); box-shadow: inset 0 0 0 1px var(--tc-fan-out-grid-status-edge); }
:where([data-look="standard"], [data-look="standard"] *).ui-fog__swatch { width: 9px; height: 9px; }
:where([data-look="clean"], [data-look="clean"] *).ui-fog__swatch { width: 8px; height: 8px; }
/* Retry looks like Button: secondary in Standard, ghost in Clean – in the danger colour */
.ui-fog__retry { display: inline-flex; align-items: center; margin-left: auto; font-size: var(--tc-control-font-size, var(--_tc-control-font-size)); font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight)); color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); animation: ui-fog-in var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-fog__retry { gap: 6px; height: var(--tc-control-h-md, var(--_tc-control-h-md)); padding: 0 var(--tc-control-px-md, var(--_tc-control-px-md)) 0 10px; border-radius: var(--tc-control-radius-md, var(--_tc-control-radius-md)); background: var(--tc-action-secondary-bg, var(--_tc-action-secondary-bg)); box-shadow: var(--tc-action-secondary-shadow, var(--_tc-action-secondary-shadow)); transition: box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-fog__retry:hover { box-shadow: var(--tc-action-secondary-shadow-hover, var(--_tc-action-secondary-shadow-hover)); }
:where([data-look="clean"], [data-look="clean"] *).ui-fog__retry { gap: 5px; height: var(--tc-control-h-sm, var(--_tc-control-h-sm)); margin: -3px -6px -3px auto; padding: 0 6px; border-radius: var(--tc-control-radius-sm, var(--_tc-control-radius-sm)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-fog__retry:hover { background: var(--tc-status-danger-bg, var(--_tc-status-danger-bg)); }
:where([data-look="clean"], [data-look="clean"] *).ui-fog__retry > svg { width: 13px; height: 13px; }
/*
 * Every state's colours in one place. State never rests on hue alone (WCAG 1.4.1 / 1.4.11): done is a solid cell,
 * running, retrying and failed are outlined in their solid colour (≥ 3:1) – retrying with a dot, failed with a cross –
 * and queued is a faint empty cell
 */
.ui-fog [data-status="queued"] { --tc-fan-out-grid-status-bg: var(--tc-fill-default, var(--_tc-fill-default)); --tc-fan-out-grid-status-fill: var(--tc-fill-default, var(--_tc-fill-default)); --tc-fan-out-grid-status-edge: var(--tc-border-default, var(--_tc-border-default)); --tc-fan-out-grid-status-ink: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-fog [data-status="queued"] { --tc-fan-out-grid-status-bg: var(--tc-fill-subtle, var(--_tc-fill-subtle)); --tc-fan-out-grid-status-fill: var(--tc-fill-subtle, var(--_tc-fill-subtle)); }
.ui-fog [data-status="running"] { --tc-fan-out-grid-status-bg: var(--tc-status-info-bg, var(--_tc-status-info-bg)); --tc-fan-out-grid-status-fill: var(--tc-status-info-bg, var(--_tc-status-info-bg)); --tc-fan-out-grid-status-edge: var(--tc-status-info-solid, var(--_tc-status-info-solid)); --tc-fan-out-grid-status-ink: var(--tc-status-info-fg, var(--_tc-status-info-fg)); }
.ui-fog [data-status="retrying"] { --tc-fan-out-grid-status-bg: var(--tc-status-warning-bg, var(--_tc-status-warning-bg)); --tc-fan-out-grid-status-fill: var(--tc-status-warning-bg, var(--_tc-status-warning-bg)); --tc-fan-out-grid-status-edge: var(--tc-status-warning-solid, var(--_tc-status-warning-solid)); --tc-fan-out-grid-status-ink: var(--tc-status-warning-fg, var(--_tc-status-warning-fg)); }
.ui-fog [data-status="done"] { --tc-fan-out-grid-status-bg: var(--tc-status-success-bg, var(--_tc-status-success-bg)); --tc-fan-out-grid-status-fill: var(--tc-status-success-solid, var(--_tc-status-success-solid)); --tc-fan-out-grid-status-edge: var(--tc-status-success-solid, var(--_tc-status-success-solid)); --tc-fan-out-grid-status-ink: var(--tc-status-success-fg, var(--_tc-status-success-fg)); }
.ui-fog [data-status="failed"] { --tc-fan-out-grid-status-bg: var(--tc-status-danger-bg, var(--_tc-status-danger-bg)); --tc-fan-out-grid-status-fill: var(--tc-status-danger-bg, var(--_tc-status-danger-bg)); --tc-fan-out-grid-status-edge: var(--tc-status-danger-solid, var(--_tc-status-danger-solid)); --tc-fan-out-grid-status-ink: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
/* The marks: a dot for retrying, a cross for failed – on cells and their swatches */
:is(.ui-fog__cell, .ui-fog__swatch):is([data-status="retrying"], [data-status="failed"])::after { content: ""; position: absolute; inset: 0; pointer-events: none; }
:is(.ui-fog__cell, .ui-fog__swatch)[data-status="retrying"]::after { background: radial-gradient(circle, var(--tc-fan-out-grid-status-edge) 0 22%, transparent 26%); }
:is(.ui-fog__cell, .ui-fog__swatch)[data-status="failed"]::after {
  background:
    linear-gradient(45deg, transparent calc(50% - 0.75px), var(--tc-fan-out-grid-status-edge) calc(50% - 0.75px) calc(50% + 0.75px), transparent calc(50% + 0.75px)),
    linear-gradient(-45deg, transparent calc(50% - 0.75px), var(--tc-fan-out-grid-status-edge) calc(50% - 0.75px) calc(50% + 0.75px), transparent calc(50% + 0.75px));
  inset: 22%;
}
/* ----- The grid: one cell per task ----- */
.ui-fog__grid { display: grid; grid-template-columns: repeat(auto-fill, var(--tc-fan-out-grid-cell)); gap: var(--tc-fan-out-grid-gap); justify-content: space-between; padding: 2px; margin: -2px; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); }
.ui-fog__grid:focus { outline: none; }
.ui-fog__grid:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
.ui-fog__cell { position: relative; width: var(--tc-fan-out-grid-cell); height: var(--tc-fan-out-grid-cell); background: var(--tc-fan-out-grid-status-fill); box-shadow: inset 0 0 0 1px var(--tc-fan-out-grid-status-edge); overflow: hidden; cursor: pointer; transition: background-color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-move, var(--_tc-ease-move)); animation: ui-fog-cell-in var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) calc(var(--i, 0) * 0.01 * var(--tc-duration-base, var(--_tc-duration-base))) backwards; }
:where([data-look="standard"], [data-look="standard"] *).ui-fog__cell { border-radius: var(--tc-radius-xs, var(--_tc-radius-xs)); }
:where([data-look="clean"], [data-look="clean"] *).ui-fog__cell { border-radius: var(--tc-radius-2xs, var(--_tc-radius-2xs)); }
/*
 * Running: a shine sweeps across, each cell a little out of step with the next. It moves with transform (composited),
 * runs three times and stops (WCAG 2.2.2), and pauses off-screen
 */
.ui-fog__cell[data-status="running"]::before { content: ""; position: absolute; inset: 0; background: linear-gradient(110deg, transparent 25%, var(--tc-shimmer, var(--_tc-shimmer)) 50%, transparent 75%); opacity: 0.8; transform: translateX(-100%); animation: ui-fog-cell-sweep var(--tc-duration-shimmer, var(--_tc-duration-shimmer)) linear calc(var(--d, 0) * -0.06 * var(--tc-duration-shimmer, var(--_tc-duration-shimmer))) 3; }
.ui-fog__cell[data-status="retrying"] { animation: ui-fog-breathe calc(2 * var(--tc-duration-slowest, var(--_tc-duration-slowest))) var(--tc-ease-in-out, var(--_tc-ease-in-out)) 4 alternate; }
.ui-fog__cell:is([data-status="done"], [data-status="failed"]) { animation: ui-fog-pop var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)); }
.ui-fog[data-offscreen] .ui-fog__cell, .ui-fog[data-offscreen] .ui-fog__cell::before { animation-play-state: paused; }
.ui-fog__cell:hover, .ui-fog__cell[data-on] { transform: scale(1.3); z-index: 1; }
:where([data-look="standard"], [data-look="standard"] *).ui-fog__cell:is(:hover, [data-on]) { box-shadow: inset 0 0 0 1.5px var(--tc-fan-out-grid-status-ink); }
:where([data-look="clean"], [data-look="clean"] *).ui-fog__cell:is(:hover, [data-on]) { box-shadow: inset 0 0 0 1px var(--tc-fan-out-grid-status-ink); }
:where([data-look="standard"], [data-look="standard"] *).ui-fog__cell[data-pinned] { box-shadow: inset 0 0 0 1.5px var(--tc-fan-out-grid-status-ink), 0 0 0 2px var(--tc-focus-ring, var(--_tc-focus-ring)); }
:where([data-look="clean"], [data-look="clean"] *).ui-fog__cell[data-pinned] { box-shadow: inset 0 0 0 1px var(--tc-fan-out-grid-status-ink), 0 0 0 2px var(--tc-focus-ring, var(--_tc-focus-ring)); }
:where([data-look="standard"], [data-look="standard"] *).ui-fog__cell[data-dim] { opacity: 0.2; }
:where([data-look="clean"], [data-look="clean"] *).ui-fog__cell[data-dim] { opacity: 0.18; }
/* ----- The window over a cell: can be hovered, closes with Escape ----- */
.ui-fog__tip { position: absolute; top: 0; left: 0; z-index: 5; display: grid; gap: 3px; width: max-content; border-radius: var(--tc-menu-radius, var(--_tc-menu-radius)); background: var(--tc-menu-bg, var(--_tc-menu-bg)); box-shadow: var(--tc-menu-shadow, var(--_tc-menu-shadow)); transform-origin: var(--x, 50%) bottom; animation: ui-fog-tip var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-fog__tip { max-width: min(290px, calc(100% - 16px)); padding: 10px 14px 11px; }
:where([data-look="clean"], [data-look="clean"] *).ui-fog__tip { max-width: min(280px, calc(100% - 16px)); padding: 9px 12px 10px; }
.ui-fog__tip[data-side="below"] { transform-origin: var(--x, 50%) top; }
.ui-fog__tip-head { display: flex; align-items: center; gap: 8px; min-width: 0; }
.ui-fog__tip-label { min-width: 0; overflow: hidden; font-weight: var(--tc-font-weight-strong, var(--_tc-font-weight-strong)); color: var(--tc-text-primary, var(--_tc-text-primary)); white-space: nowrap; text-overflow: ellipsis; }
.ui-fog__pill { flex: none; height: var(--tc-pill-h, var(--_tc-pill-h)); margin-left: auto; padding: 0 var(--tc-pill-px, var(--_tc-pill-px)); border-radius: var(--tc-pill-radius, var(--_tc-pill-radius)); background: var(--tc-fan-out-grid-status-bg); font-size: var(--tc-pill-font-size, var(--_tc-pill-font-size)); font-weight: var(--tc-pill-font-weight, var(--_tc-pill-font-weight)); line-height: var(--tc-pill-h, var(--_tc-pill-h)); color: var(--tc-fan-out-grid-status-ink); }
.ui-fog__tip-meta { color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-fog__tip-meta { font-size: var(--tc-font-size-sm-plus, var(--_tc-font-size-sm-plus)); line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug)); }
:where([data-look="clean"], [data-look="clean"] *).ui-fog__tip-meta { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); }
:where([data-look="standard"], [data-look="standard"] *) :is(.ui-fog__tip-result, .ui-fog__tip-error) { font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); }
:where([data-look="clean"], [data-look="clean"] *) :is(.ui-fog__tip-result, .ui-fog__tip-error) { font-size: var(--tc-font-size-sm-plus, var(--_tc-font-size-sm-plus)); line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug)); }
:where([data-look="standard"], [data-look="standard"] *).ui-fog__tip-result { color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-fog__tip-result { color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
.ui-fog__tip-error { color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
/* ----- Narrow: smaller cells, the numbers on a line of their own ----- */
@container ui-fog (max-width: 520px) {
  /* Set on the card – a container query can't style the container itself */
  .ui-fog__panel { --tc-fan-out-grid-cell: 10px; --tc-fan-out-grid-gap: 3px; }
  :where([data-look="standard"], [data-look="standard"] *).ui-fog__panel { padding: 14px; }
  :where([data-look="clean"], [data-look="clean"] *).ui-fog__panel { padding: 12px; }
  .ui-fog__sum { flex-basis: 100%; justify-content: space-between; margin-left: 0; }
  /* The counts in a fixed two-by-two grid, Retry beside it – nothing moves when a state shows up or Retry appears */
  .ui-fog__foot { flex-wrap: nowrap; align-items: center; }
  .ui-fog__legend { display: grid; grid-template-columns: repeat(2, max-content); }
  .ui-fog__key[data-zero] { display: inline-flex; }
  .ui-fog__retry { flex: none; margin-left: auto; }
}
/* Too narrow for the counts and Retry side by side: Retry goes on a line of its own instead of sticking out */
@container ui-fog (max-width: 360px) {
  .ui-fog__foot { flex-wrap: wrap; }
  .ui-fog__retry { margin-left: 0; }
}
@keyframes ui-fog-cell-in { from { opacity: 0; transform: scale(0.6); } }
@keyframes ui-fog-pop { 0% { transform: scale(0.7); } 55% { transform: scale(1.18); } 100% { transform: scale(1); } }
@keyframes ui-fog-cell-sweep { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
@keyframes ui-fog-breathe { from { opacity: 0.55; } to { opacity: 1; } }
@keyframes ui-fog-tip { from { opacity: 0; transform: translateY(3px) scale(0.97); } }
@keyframes ui-fog-in { from { opacity: 0; transform: translateY(2px); } }
@media (prefers-reduced-motion: reduce) {
  .ui-fog *, .ui-fog *::before, .ui-fog *::after { animation: none !important; transition: none !important; }
}
`;
