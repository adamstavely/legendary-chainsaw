"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from "react";
import { reducedMotion } from "../internal/reduced-motion";
import { useControllable } from "../internal/use-controllable";
import { rescueFocus, useFocusRescue } from "../internal/use-focus-rescue";
import { useOnScreen } from "../internal/use-on-screen";
import { useRootRef } from "../internal/use-root-ref";

/*
 * Trace Waterfall – where the time and the money of an agent run go, in a single self-contained file.
 * Like the performance panel of an APM tool, but for agents: on the left the run as a tree of spans – the agent,
 * its LLM calls, tool calls and sub-agents – and on the right a timeline where every span is a bar that starts
 * when it started and is as long as it took. A white card on a soft gray tray, the whole run in numbers on top.
 *   · bars are tinted by kind: agents a quiet slate, LLM calls violet, tool calls teal, errors red
 *   · a running span grows live with a soft sheen (a few passes, then it rests), and a "now" line moves across
 *   · when the run outgrows the timeline, the axis rescales smoothly – ticks glide and fade, bars follow
 *   · every row shows how long it took and, where it costs something, what it cost; the slowest call is marked
 *   · fold a span and its rows close up – their bars collapse into the parent bar as small marks
 *   · click a row (or press Enter, which moves focus into it) for a small window with its input, output, tokens,
 *     cost and error
 *   · long traces (over 200 shown rows) render only the rows near the viewport, plus the focused and the open row
 * Time: spans are in ms from the start of the run. Pass `elapsed` (ms into the run) to drive the clock yourself, or
 * `startedAt` (epoch ms) and optionally `now` (epoch ms) – without `now` it keeps its own clock while spans run.
 * `collapsed` and `openId` are controlled when defined, otherwise uncontrolled from their defaults; changes are
 * always reported. Other DOM props and `ref` go to the root.
 * Narrow containers stack the name above its bar. The styles are injected below, so no extra files are needed.
 * Two looks, picked with the `look` prop (Standard by default). Clean is one quiet white card with hairlines instead of the gray tray, agents
 * in a quiet gray and LLM calls in indigo, with smaller radii and type.
 */

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-tw";

export type TraceSpanKind = "agent" | "subagent" | "llm" | "tool";
export type TraceSpanStatus = "running" | "done" | "failed";

export type TraceSpan = {
  id: string;
  name: string;
  kind: TraceSpanKind;
  status: TraceSpanStatus;
  /** When it started, in ms from the start of the run */
  start: number;
  /** When it ended, in ms from the start of the run – leave it out while it runs */
  end?: number;
  /** A few muted words after the name – the model, the query, the target */
  detail?: string;
  /** A small mark, e.g. the model maker's or the tool's logo – defaults to a swatch in the kind's color */
  icon?: ReactNode;
  /** The model of an LLM call or an agent – shown in the details */
  model?: string;
  tokensIn?: number;
  tokensOut?: number;
  /** Its own cost – an agent's children are added on top */
  cost?: number;
  /** What went in and what came out – a short preview, shown in the details */
  input?: string;
  output?: string;
  /** What went wrong – shown in the details of a failed span */
  error?: string;
  children?: TraceSpan[];
};

type TraceWaterfallOwnProps = {
  /** Visual style: "standard" (the default) or "clean" */
  look?: Look;
  root: TraceSpan;
  /** The clock, in ms from the start of the run – e.g. a faster one for a demo */
  elapsed?: number;
  /**
   * The clock in epoch ms, read against `startedAt` – without it, the component keeps its own clock while it runs.
   * @deprecated without `startedAt`, `now` is still read as ms from the start of the run, as before – use `elapsed`
   */
  now?: number;
  /** When the run started (epoch ms) – with `now`, or the component's own clock while spans run */
  startedAt?: number;
  /** Controlled ids of folded spans */
  collapsed?: string[];
  defaultCollapsed?: string[];
  onCollapsedChange?: (collapsed: string[]) => void;
  /** Controlled id of the span whose details are open */
  openId?: string | null;
  defaultOpenId?: string | null;
  onOpenChange?: (id: string | null, span?: TraceSpan) => void;
  /** Marks the slowest finished LLM or tool call (default true) */
  markSlowest?: boolean;
  /** The shortest time the axis shows, in ms (default 10s) */
  minRange?: number;
  /** Formats every cost – defaults to dollars, e.g. "$0.042" */
  formatCost?: (amount: number) => string;
  title?: string;
  className?: string;
  ref?: Ref<HTMLDivElement>;
};

export type TraceWaterfallProps = Omit<ComponentPropsWithoutRef<"div">, keyof TraceWaterfallOwnProps> & TraceWaterfallOwnProps;

/* ---------- Helpers ---------- */

const KIND: Record<TraceSpanKind, string> = { agent: "Agent run", subagent: "Sub-agent", llm: "LLM call", tool: "Tool call" };
const STATUS: Record<TraceSpanStatus, string> = { running: "Running", done: "Done", failed: "Failed" };
const SEC = 1000;
/** Ranges the axis snaps to, and the steps between its ticks */
const RANGES = [5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 300, 450, 600, 900, 1200, 1800, 2700, 3600, 5400, 7200].map((s) => s * SEC);
const STEPS = [1, 2, 3, 5, 10, 15, 20, 30, 60, 120, 300, 600, 900, 1800, 3600].map((s) => s * SEC);
/** Motion: the axis rescale, rows that leave, and the beat between rows that come or go together */
const RESCALE = 720;
/** Matches --tc-duration-moderate, the row close-up in the CSS */
const EXIT = 260;
const STAGGER = 36;
/** How often the own clock moves the live bars and numbers – they show tenths of a second */
const CLOCK_MS = 100;
/** Above this many shown rows, only the rows near the viewport are rendered */
const VIRTUAL_FROM = 200;
const OVERSCAN = 12;
/** At most this many running bars carry the sheen */
const SHINE_MAX = 20;

// One formatter for the file – toLocaleString would build a new Intl.NumberFormat on every call
const INTEGER = new Intl.NumberFormat("en-US");
const dollars = (n: number) => (n === 0 ? "$0" : n < 0.01 ? `$${n.toFixed(3)}` : n < 10 ? `$${n.toFixed(2)}` : `$${INTEGER.format(Math.round(n))}`);
const took = (ms: number) => {
  if (ms < SEC) return `${Math.max(0, Math.round(ms))}ms`;
  if (ms < 10 * SEC) return `${(ms / SEC).toFixed(1)}s`;
  const s = Math.round(ms / SEC);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
};
const tickLabel = (v: number) => {
  const s = Math.round(v / SEC);
  if (s < 60) return `${s}s`;
  return s % 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s / 60}m`;
};
const tokens = (n: number) => (n < 1000 ? String(Math.round(n)) : n < 100_000 ? `${(n / 1000).toFixed(1)}k` : `${Math.round(n / 1000)}k`);
const walk = (s: TraceSpan): TraceSpan[] => [s, ...(s.children ?? []).flatMap(walk)];
const costOf = (s: TraceSpan): number => (s.cost ?? 0) + (s.children ?? []).reduce((sum, c) => sum + costOf(c), 0);
const tokensOf = (s: TraceSpan): [number, number] =>
  (s.children ?? []).reduce<[number, number]>(
    (sum, c) => {
      const [i, o] = tokensOf(c);
      return [sum[0] + i, sum[1] + o];
    },
    [s.tokensIn ?? 0, s.tokensOut ?? 0],
  );
const ease = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
/** The only clock read in the file – called from effects, never while rendering */
const readClock = () => Date.now();
/** A span whose end follows the clock */
const runs = (s: TraceSpan) => s.end === undefined && s.status === "running";
/** The axis range for a run whose latest moment is `latest`: a round number with some room after it */
const rangeFor = (latest: number, minRange: number) => {
  const want = Math.max(minRange, latest * 1.2);
  return RANGES.find((r) => r >= want) ?? Math.ceil(want / 3_600_000) * 3_600_000;
};
/** Room a duration tag needs, in px */
const needOf = (label: string, slowest: boolean) => label.length * 6.4 + (slowest ? 58 : 0) + 8;
/** Where a duration goes: after the bar, inside its end, or before it – whichever fits the track */
const sideOf = (start: number, dur: number, need: number, range: number, trackW: number) => {
  const px = (v: number) => (v / range) * trackW;
  return !trackW || px(start + dur) + 6 + need <= trackW ? "after" : px(dur) >= need + 10 ? "inside" : px(start) >= need + 6 ? "before" : "inside";
};

/**
 * The clock, written straight into the DOM – React renders only when the structure changes. Elements of running
 * spans opt in with attributes that carry the span's start (ms):
 *   data-run        → --d, the length of a bar, its duration tag or a folded mark
 *   data-run-took   → its first text node: the duration, then data-run-post
 *   data-run-side   → data-side of a duration tag, from the text in it
 * The "now" position goes on the time layer only (not the root), so a tick doesn't restyle every row.
 */
function writeClock(root: HTMLElement, at: number, range: number, trackW: number) {
  root.querySelector<HTMLElement>(".ui-tw__layer")?.style.setProperty("--tc-trace-waterfall-at", String(at));
  const dur = (el: Element, attr: string) => Math.max(0, at - Number(el.getAttribute(attr)));
  for (const el of root.querySelectorAll<HTMLElement>("[data-run]")) el.style.setProperty("--d", String(dur(el, "data-run")));
  for (const el of root.querySelectorAll<HTMLElement>("[data-run-took]")) {
    const text = took(dur(el, "data-run-took")) + (el.dataset.runPost ?? "");
    const node = el.firstChild;
    if (node?.nodeType === 3 && node.nodeValue !== text) node.nodeValue = text;
  }
  for (const el of root.querySelectorAll<HTMLElement>("[data-run-side]")) {
    const label = el.querySelector("[data-run-took]")?.textContent ?? "";
    el.dataset.side = sideOf(Number(el.dataset.runSide), dur(el, "data-run-side"), needOf(label, false), range, trackW);
  }
}

type Row = { span: TraceSpan; depth: number; parentId?: string; hidden: boolean; leaving?: number; index?: number; siblings?: number };
type Later = (fn: () => void, ms: number) => void;

/* ---------- Icons ---------- */

const Spark = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
    <path d="M7 1.2c.4 2.9 1.9 4.4 4.8 4.8-2.9.4-4.4 1.9-4.8 4.8C6.6 7.9 5.1 6.4 2.2 6 5.1 5.6 6.6 4.1 7 1.2Z" fill="currentColor" />
    <circle cx="11.6" cy="11.4" r="1.1" fill="currentColor" opacity="0.55" />
  </svg>
);
/* chevron-down, triangle-alert and x: Lucide (ISC, lucide.dev); the loader is a plain arc */
const Chevron = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m6 9 6 6 6-6" />
  </svg>
);
const Warning = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
    <path d="M12 9v4" strokeWidth="2.2" />
    <path d="M12 17h.01" strokeWidth="2.6" />
  </svg>
);
const Spinner = () => (
  <svg className="ui-tw__spin" width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
    <path d="M12 3.5A8.5 8.5 0 0 1 20.5 12" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" />
  </svg>
);
const Cancel = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

/* ---------- Hooks ---------- */

/** Timers that end with the component – no state is set after unmount */
function useLater(): Later {
  const timers = useRef(new Set<number>());
  useEffect(() => {
    const set = timers.current;
    return () => set.forEach((t) => window.clearTimeout(t));
  }, []);
  return (fn, ms) => {
    const t = window.setTimeout(() => {
      timers.current.delete(t);
      fn();
    }, ms);
    timers.current.add(t);
  };
}

/**
 * The clock and the axis range. With `now`/`elapsed` the caller re-renders; the own clock (`startedAt` while spans
 * run) writes the live bars and numbers into the DOM every 100ms and re-renders only when the axis has to rescale.
 * It pauses while the component is off-screen or the tab is hidden.
 */
function useTraceClock(
  rootRef: { current: HTMLDivElement | null },
  { nowProp, startedAt, live, lastEnd, minRange, trackW }: { nowProp?: number; startedAt?: number; live: boolean; lastEnd: number; minRange: number; trackW: number },
) {
  // The own clock starts at the run's start (stable on the server and while hydrating); the real time is written
  // before the first paint
  const [tick, setTick] = useState(() => startedAt ?? 0);
  const ownClock = nowProp === undefined && startedAt !== undefined && live;
  const now = nowProp ?? (ownClock ? Math.max(0, tick - startedAt!) : lastEnd);
  // Between renders the own clock only moves within the same range – a new range is a new render
  const range = rangeFor(Math.max(live ? now : 0, lastEnd), minRange);

  const latest = useRef({ range, trackW, lastEnd, minRange, startedAt: startedAt ?? 0, ownClock });
  // Writes the clock after every render (React rendered the time it knew – new rows need the real one), then
  // checks the range
  // eslint-disable-next-line react-hooks/exhaustive-deps -- after every render; it sets state only when the range moved on
  useLayoutEffect(() => {
    latest.current = { range, trackW, lastEnd, minRange, startedAt: startedAt ?? 0, ownClock };
    const el = rootRef.current;
    if (!el) return;
    const at = ownClock ? Math.max(0, readClock() - startedAt!) : now;
    writeClock(el, at, range, trackW);
    if (ownClock && rangeFor(Math.max(at, lastEnd), minRange) !== range) setTick(readClock());
  });
  useEffect(() => {
    const el = rootRef.current;
    if (!ownClock || !el) return;
    let timer = 0;
    let onScreen = true;
    const step = () => {
      const s = latest.current;
      const at = Math.max(0, readClock() - s.startedAt);
      writeClock(el, at, s.range, s.trackW);
      if (rangeFor(Math.max(at, s.lastEnd), s.minRange) !== s.range) setTick(readClock());
    };
    const run = () => {
      const want = onScreen && document.visibilityState !== "hidden";
      if (want && !timer) {
        step();
        timer = window.setInterval(step, CLOCK_MS);
      } else if (!want && timer) {
        window.clearInterval(timer);
        timer = 0;
      }
    };
    const io =
      typeof IntersectionObserver === "undefined"
        ? undefined
        : new IntersectionObserver((entries) => {
            onScreen = entries[entries.length - 1].isIntersecting;
            run();
          });
    io?.observe(el);
    document.addEventListener("visibilitychange", run);
    run();
    return () => {
      io?.disconnect();
      document.removeEventListener("visibilitychange", run);
      window.clearInterval(timer);
    };
  }, [ownClock, rootRef]);
  return { now, range };
}

/** The width of the timeline, kept up by a ResizeObserver */
function useTrackWidth(layerRef: { current: HTMLDivElement | null }) {
  const [trackW, setTrackW] = useState(0);
  useLayoutEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    const ro = new ResizeObserver(() => setTrackW(layer.offsetWidth));
    ro.observe(layer);
    return () => ro.disconnect();
  }, [layerRef]);
  return trackW;
}

/**
 * The rows to render: all of them up to VIRTUAL_FROM shown rows; beyond that the ones near the viewport (the page
 * scrolls the trace, so the window follows any scroll, read once a frame). Like data-table's row window.
 */
function useRowWindow(count: number, rowsRef: { current: HTMLDivElement | null }) {
  const virtual = count > VIRTUAL_FROM;
  const [win, setWin] = useState({ start: 0, end: 3 * OVERSCAN, rowH: 32 });
  useLayoutEffect(() => {
    if (!virtual) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const box = rowsRef.current;
      if (!box) return;
      // Reads first, then one state update
      const row = box.querySelector<HTMLElement>(".ui-tw__row");
      const top = box.getBoundingClientRect().top;
      const h = row?.offsetHeight || 32;
      const first = Math.max(0, Math.floor(-top / h));
      const last = Math.max(0, Math.ceil((window.innerHeight - top) / h));
      const start = Math.max(0, Math.floor(first / OVERSCAN) * OVERSCAN - OVERSCAN);
      const end = Math.ceil(last / OVERSCAN) * OVERSCAN + OVERSCAN;
      setWin((w) => (w.start === start && w.end === end && w.rowH === h ? w : { start, end, rowH: h }));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", schedule, { capture: true, passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule, { capture: true });
      window.removeEventListener("resize", schedule);
    };
  }, [virtual, rowsRef]);
  return { virtual, start: virtual ? Math.min(win.start, count) : 0, end: virtual ? Math.min(win.end, count) : count, rowH: win.rowH };
}

/** The axis: ticks to fit the width, old ticks fading where they are, the range gliding to its new value */
function useAxis(rootRef: { current: HTMLDivElement | null }, range: number, trackW: number, later: Later) {
  const fit = Math.min(8, Math.max(3, Math.round((trackW || 600) / 96)));
  const step = STEPS.find((s) => range / s <= fit) ?? range / fit;
  const ticks: number[] = [];
  for (let v = 0; v < range - 1; v += step) ticks.push(v);

  // Ticks that are no longer on the axis fade out where they are while the range glides
  const prevTicks = useRef<number[]>([]);
  const [fading, setFading] = useState<number[]>([]);
  const tickKey = ticks.join(",");
  useLayoutEffect(() => {
    const gone = prevTicks.current.filter((v) => !ticks.includes(v));
    prevTicks.current = ticks;
    if (!gone.length || reducedMotion()) return;
    setFading((f) => [...f.filter((v) => !ticks.includes(v) && !gone.includes(v)), ...gone]);
    later(() => setFading((f) => f.filter((v) => !gone.includes(v) || prevTicks.current.includes(v))), 520);
  }, [tickKey]); // eslint-disable-line react-hooks/exhaustive-deps -- ticks are compared by value, through tickKey

  // The range glides to its new value – written straight into a CSS variable, so bars and ticks move together every frame
  const shownRange = useRef(range);
  const rangeRaf = useRef(0);
  const firstRange = useRef(true);
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const set = (v: number) => {
      shownRange.current = v;
      el.style.setProperty("--tc-trace-waterfall-range", String(v));
    };
    cancelAnimationFrame(rangeRaf.current);
    if (firstRange.current || reducedMotion()) {
      firstRange.current = false;
      set(range);
      return;
    }
    const from = shownRange.current;
    if (from === range) return;
    const t0 = performance.now();
    const frame = () => {
      const p = Math.min(1, (performance.now() - t0) / RESCALE);
      set(from + (range - from) * ease(p));
      if (p < 1) rangeRaf.current = requestAnimationFrame(frame);
    };
    rangeRaf.current = requestAnimationFrame(frame);
  }, [range, rootRef]);
  useEffect(() => () => cancelAnimationFrame(rangeRaf.current), []);

  const tickList = [...ticks.map((v) => ({ v, leaving: false })), ...fading.filter((v) => !ticks.includes(v)).map((v) => ({ v, leaving: true }))];
  return tickList;
}

/** The rows: the tree, flat – folded children stay, closed to no height; rows that leave stay a moment to close up */
function useRows(root: TraceSpan, folded: string[], later: Later) {
  const flat: Row[] = [];
  const visit = (s: TraceSpan, depth: number, parentId: string | undefined, hidden: boolean, index: number, siblings: number) => {
    flat.push({ span: s, depth, parentId, hidden, index, siblings });
    const shut = hidden || folded.includes(s.id);
    const kids = s.children ?? [];
    kids.forEach((c, i) => visit(c, depth + 1, s.id, shut, i, kids.length));
  };
  visit(root, 0, undefined, false, 0, 1);
  const ids = new Set(flat.map((r) => r.span.id));

  // Rows that leave (a new run, removed data) close up a beat after each other, bottom first
  const [ghosts, setGhosts] = useState<{ row: Row; index: number }[]>([]);
  const prevFlat = useRef<Row[]>([]);
  useLayoutEffect(() => {
    const prev = prevFlat.current;
    prevFlat.current = flat;
    if (reducedMotion()) return;
    const gone = prev.filter((r) => !ids.has(r.span.id));
    if (!gone.length) return;
    const batch = gone.map((r, i) => ({ row: { ...r, leaving: Math.min(240, (gone.length - 1 - i) * 22) }, index: prev.indexOf(r) }));
    const out = new Set(batch.map((g) => g.row.span.id));
    setGhosts((g) => [...g.filter((x) => !out.has(x.row.span.id)), ...batch]);
    later(() => setGhosts((g) => g.filter((x) => !out.has(x.row.span.id))), EXIT + 300);
  });
  const rows = [...flat];
  const staying = ghosts.filter((g) => !ids.has(g.row.span.id)).sort((a, b) => a.index - b.index);
  // A whole new run (another root) comes in on top; the old one closes up below it
  const newRun = staying.some((g) => g.row.depth === 0);
  for (const g of staying) {
    if (newRun) rows.push(g.row);
    else rows.splice(Math.min(g.index, rows.length), 0, g.row);
  }

  // Rows that appear together slide in one after another; the first picture comes in row by row
  // Each row's delay is fixed when it first shows – kept in state, never written while rendering
  const [delaysKnown, setDelaysKnown] = useState<Map<string, number>>(() => new Map());
  const mounted = useRef(false);
  let enterDelay = delaysKnown;
  {
    let newcomers = 0;
    const next = new Map<string, number>();
    for (const r of rows) {
      if (r.leaving !== undefined) continue;
      const known = delaysKnown.get(r.span.id);
      next.set(r.span.id, known ?? Math.min(400, (mounted.current ? 0 : 60) + newcomers++ * STAGGER));
    }
    if (newcomers || next.size !== delaysKnown.size) {
      enterDelay = next;
      setDelaysKnown(next);
    }
  }
  useLayoutEffect(() => {
    mounted.current = true;
  });
  return { rows, enterDelay };
}

/* ---------- One row ---------- */

type TraceRowProps = {
  row: Row;
  isFolded: boolean;
  isOpen: boolean;
  isSlowest: boolean;
  tabbable: boolean;
  shine: boolean;
  /** Rows skipped above this one by the row window, as a margin */
  gap: number;
  delay: number;
  range: number;
  trackW: number;
  endOf: (s: TraceSpan) => number;
  formatCost: (amount: number) => string;
  rowEls: { current: Map<string, HTMLDivElement> };
  onPick: () => void;
  onFold: () => void;
  onFocusRow: () => void;
  onKey: (e: KeyboardEvent<HTMLDivElement>) => void;
};

function TraceRow({ row: r, isFolded, isOpen, isSlowest, tabbable, shine, gap, delay, range, trackW, endOf, formatCost, rowEls, onPick, onFold, onFocusRow, onKey }: TraceRowProps) {
  const s = r.span;
  const kids = s.children ?? [];
  const leaving = r.leaving !== undefined;
  const dur = Math.max(0, endOf(s) - s.start);
  const cost = kids.length ? costOf(s) : s.cost;
  const showCost = cost !== undefined && cost > 0 && (s.kind !== "tool" || s.cost !== undefined);
  const post = showCost ? ` · ${formatCost(cost!)}` : "";
  const label = `${took(dur)}${post}`;
  const side = sideOf(s.start, dur, needOf(label, isSlowest), range, trackW);
  const hiddenCount = isFolded ? walk(s).length - 1 : 0;
  // Only a folded row draws its children as marks – an open parent would otherwise carry one per descendant
  const marks = isFolded ? walk(s).slice(1).filter((c) => c.kind === "llm" || c.kind === "tool") : [];
  const vars = { "--s": s.start, "--d": dur } as CSSProperties;
  // A running span's length and duration follow the clock between renders (see writeClock)
  const live = runs(s);
  const run = live ? s.start : undefined;
  // Position among its siblings – the row window may leave the others out of the DOM
  const siblings = r.siblings ?? 1;
  return (
    <div
      ref={
        leaving
          ? undefined
          : (el) => {
              if (el) rowEls.current.set(s.id, el);
              else rowEls.current.delete(s.id);
            }
      }
      className="ui-tw__row"
      role="treeitem"
      aria-level={r.depth + 1}
      aria-expanded={kids.length ? !isFolded : undefined}
      aria-selected={isOpen}
      aria-setsize={siblings}
      aria-posinset={(r.index ?? 0) + 1}
      aria-hidden={r.hidden || leaving || undefined}
      tabIndex={!r.hidden && !leaving && tabbable ? 0 : -1}
      data-kind={s.kind}
      data-status={s.status}
      data-parent={kids.length ? "" : undefined}
      data-hidden={r.hidden ? "" : undefined}
      data-folded={isFolded ? "" : undefined}
      data-leaving={leaving ? "" : undefined}
      data-open={isOpen ? "" : undefined}
      style={{ animationDelay: `${leaving ? r.leaving : delay}ms`, marginTop: gap ? `calc(${gap} * var(--tc-trace-waterfall-row))` : undefined }}
      onClick={() => {
        if (!leaving) onPick();
      }}
      onFocus={(e) => e.target === e.currentTarget && onFocusRow()}
      onKeyDown={onKey}
    >
      <div className="ui-tw__name">
        {r.depth > 0 && <span className="ui-tw__guides" style={{ width: `calc(${r.depth} * var(--tc-trace-waterfall-indent))` }} aria-hidden="true" />}
        <span
          className="ui-tw__chev"
          data-leaf={kids.length ? undefined : ""}
          aria-hidden="true"
          onClick={(e) => {
            if (!kids.length || leaving) return;
            e.stopPropagation();
            onFold();
          }}
        >
          {kids.length > 0 && <Chevron />}
        </span>
        <span className="ui-tw__icon" data-logo={s.icon ? "" : undefined}>
          {s.icon ?? <span className="ui-tw__swatch" />}
        </span>
        <span className="ui-tw__label">
          <span className="ui-tw__title">{s.name}</span>
          {s.detail && <span className="ui-tw__detail">{s.detail}</span>}
          {/* What the color and the swatch shape say, for screen readers */}
          <span className="ui-tw__sr">
            , {KIND[s.kind]}, {STATUS[s.status]},
          </span>
        </span>
        {hiddenCount > 0 && (
          <span className="ui-tw__more">
            +{hiddenCount}
            <span className="ui-tw__sr"> folded</span>
          </span>
        )}
        {s.status === "running" && !kids.length && (
          <span className="ui-tw__state" data-status="running">
            <Spinner />
          </span>
        )}
        {s.status === "failed" && (
          <span className="ui-tw__state" data-status="failed">
            <Warning />
          </span>
        )}
        {/* Narrow: the duration sits at the end of the name line */}
        <span className="ui-tw__meta">
          {isSlowest && (
            <span className="ui-tw__slow" title="Slowest">
              <span className="ui-tw__slow-text">Slowest</span>
            </span>
          )}
          <span className="ui-tw__amount" data-live={s.status === "running" ? "" : undefined} data-run-took={run}>
            {took(dur)}
            {/* The cost steps aside on the narrowest screens – it stays in the details and the totals */}
            {showCost && <span className="ui-tw__meta-cost"> · {formatCost(cost!)}</span>}
          </span>
        </span>
      </div>
      <div className="ui-tw__track">
        <span className="ui-tw__bar" data-bar="" data-kind={s.kind} data-status={s.status} data-shine={shine ? "" : undefined} data-run={run} style={{ ...vars, animationDelay: `${delay + 60}ms` }} />
        {marks.map((m) => (
          <span
            key={m.id}
            className="ui-tw__mark"
            data-kind={m.kind}
            data-status={m.status}
            data-run={runs(m) ? m.start : undefined}
            style={{ "--s": m.start, "--d": Math.max(0, endOf(m) - m.start) } as CSSProperties}
            aria-hidden="true"
          />
        ))}
        <span className="ui-tw__tag" data-side={side} data-run={run} data-run-side={run} style={vars}>
          <span className="ui-tw__amount" data-live={s.status === "running" ? "" : undefined} data-run-took={run} data-run-post={live && post ? post : undefined}>
            {label}
          </span>
          {isSlowest && <span className="ui-tw__slow">Slowest</span>}
        </span>
      </div>
    </div>
  );
}

/* ---------- The details ---------- */

type SpanDetailsProps = {
  span: TraceSpan;
  closing: boolean;
  dur: number;
  formatCost: (amount: number) => string;
  popRef: { current: HTMLDivElement | null };
  onClose: (refocus: boolean) => void;
};

function SpanDetails({ span: s, closing, dur, formatCost, popRef, onClose }: SpanDetailsProps) {
  const kids = (s.children ?? []).length > 0;
  const [i, o] = tokensOf(s);
  const cost = kids ? costOf(s) : s.cost;
  const stats: [string, string][] = [
    ["Duration", took(dur)],
    ["Started", `+${took(s.start)}`],
    ...(cost !== undefined && cost > 0 ? [["Cost", formatCost(cost)] as [string, string]] : []),
    ...(i > 0 ? [["Tokens in", tokens(i)] as [string, string]] : []),
    ...(o > 0 ? [["Tokens out", tokens(o)] as [string, string]] : []),
    ...(kids ? [["Spans", String(walk(s).length - 1)] as [string, string]] : []),
  ];
  return (
    <div
      ref={popRef}
      className="ui-tw__pop"
      role="dialog"
      aria-label={`${s.name} details`}
      tabIndex={-1}
      inert={closing || undefined}
      data-closing={closing ? "" : undefined}
      data-kind={s.kind}
      data-status={s.status}
      onKeyDown={(e) => {
        if (e.key !== "Escape") return;
        e.stopPropagation();
        onClose(true);
      }}
    >
      <div className="ui-tw__pop-head">
        <span className="ui-tw__icon" data-logo={s.icon ? "" : undefined}>
          {s.icon ?? <span className="ui-tw__swatch" />}
        </span>
        <span className="ui-tw__pop-who">
          <span className="ui-tw__pop-name">{s.name}</span>
          <span className="ui-tw__pop-kind">
            {KIND[s.kind]}
            {s.model ? ` · ${s.model}` : s.detail ? ` · ${s.detail}` : ""}
          </span>
        </span>
        <span className="ui-tw__pill" data-status={s.status}>
          {STATUS[s.status]}
        </span>
        <button type="button" className="ui-tw__close" aria-label="Close details" onClick={() => onClose(true)}>
          <Cancel />
        </button>
      </div>
      <dl className="ui-tw__pop-stats">
        {stats.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd data-run-took={k === "Duration" && runs(s) ? s.start : undefined}>{v}</dd>
          </div>
        ))}
      </dl>
      {s.error && (
        <p className="ui-tw__pop-error">
          <Warning />
          {s.error}
        </p>
      )}
      {s.input && (
        <div className="ui-tw__pop-io">
          <span>Input</span>
          <p>{s.input}</p>
        </div>
      )}
      {s.output && (
        <div className="ui-tw__pop-io">
          <span>Output</span>
          <p>{s.output}</p>
        </div>
      )}
    </div>
  );
}

/* ---------- The waterfall ---------- */

export function TraceWaterfall({
  look,
  root,
  elapsed,
  now: nowEpoch,
  startedAt,
  collapsed,
  defaultCollapsed = [],
  onCollapsedChange,
  openId,
  defaultOpenId = null,
  onOpenChange,
  markSlowest = true,
  minRange = 10 * SEC,
  formatCost = dollars,
  title = "Trace",
  className,
  ref,
  style,
  ...rest
}: TraceWaterfallProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const setRoot = useRootRef(rootRef, ref);
  const bodyRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const rowsRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const rowEls = useRef(new Map<string, HTMLDivElement>());
  const later = useLater();

  /* ---------- Folding and the open details, controlled or not ---------- */

  const [folded, setFolded] = useControllable<string[]>(collapsed, defaultCollapsed, onCollapsedChange, "collapsed");
  const toggle = (id: string) => setFolded(folded.includes(id) ? folded.filter((c) => c !== id) : [...folded, id]);
  const all = walk(root);
  const [wantOpen, setOpen] = useControllable<string | null>(
    openId,
    defaultOpenId,
    onOpenChange && ((id) => onOpenChange(id, id ? all.find((s) => s.id === id) : undefined)),
    "openId",
  );
  const openSpan = wantOpen ? all.find((s) => s.id === wantOpen) : undefined;

  /* ---------- The clock and the axis ---------- */

  const live = all.some((s) => s.status === "running");
  // `now` without `startedAt` keeps its old meaning: ms from the start of the run
  const nowProp = elapsed ?? (nowEpoch === undefined ? undefined : startedAt === undefined ? nowEpoch : nowEpoch - startedAt);
  const lastEnd = Math.max(0, ...all.map((s) => s.end ?? s.start));
  const trackW = useTrackWidth(layerRef);
  const { now, range } = useTraceClock(rootRef, { nowProp, startedAt, live, lastEnd, minRange, trackW });
  const tickList = useAxis(rootRef, range, trackW, later);
  const endOf = (s: TraceSpan) => s.end ?? (s.status === "running" ? Math.max(now, s.start) : s.start);
  const durOf = (s: TraceSpan) => Math.max(0, endOf(s) - s.start);

  /* ---------- The rows ---------- */

  const { rows, enterDelay } = useRows(root, folded, later);
  const shownRows = rows.filter((r) => !r.hidden && r.leaving === undefined);
  const rowWindow = useRowWindow(shownRows.length, rowsRef);
  const onScreen = useOnScreen(rootRef);

  /* ---------- Keyboard: one row in the tab order, arrows move, left and right fold ---------- */

  const [active, setActive] = useState(root.id);
  const findRow = (id?: string) => rows.find((r) => r.span.id === id);
  let activeId = active;
  // A row that folded away or left hands the focus to its nearest shown parent
  for (let r = findRow(activeId); r && (r.hidden || r.leaving !== undefined); r = findRow(r.parentId)) activeId = r.parentId ?? root.id;
  if (!shownRows.some((r) => r.span.id === activeId)) activeId = shownRows[0]?.span.id ?? root.id;
  // A row the keyboard moves to may not be rendered yet (row window) – it is focused right after it renders
  const pendingFocus = useRef<string | null>(null);
  const focusRow = (r?: Row) => {
    if (!r) return;
    setActive(r.span.id);
    // The details window would sit over the rows the focus moves through (2.4.11) – it closes when focus moves on
    if (wantOpen && wantOpen !== r.span.id) setOpen(null);
    const el = rowEls.current.get(r.span.id);
    if (el) el.focus();
    else pendingFocus.current = r.span.id;
  };
  // Opening the details from the keyboard moves focus into them, so they're announced and readable
  const focusPop = useRef(false);
  const toggleOpen = (id: string, fromKeyboard: boolean) => {
    const next = wantOpen === id ? null : id;
    focusPop.current = fromKeyboard && next !== null;
    setOpen(next);
  };
  useLayoutEffect(() => {
    const id = pendingFocus.current;
    const el = id ? rowEls.current.get(id) : undefined;
    if (el) {
      pendingFocus.current = null;
      el.focus();
    }
    if (focusPop.current && popRef.current && wantOpen) {
      focusPop.current = false;
      popRef.current.focus();
    }
  });
  // Focus never drops to <body>: a row that folds away or a details window that closes hands it to the active row
  useFocusRescue(rootRef, { fallback: () => rowEls.current.get(activeId) ?? rowsRef.current?.querySelector<HTMLElement>('[role="treeitem"][tabindex="0"]') });
  const onKey = (e: KeyboardEvent<HTMLDivElement>, r: Row) => {
    if (e.target !== e.currentTarget) return;
    const i = shownRows.findIndex((x) => x.span.id === r.span.id);
    const kids = (r.span.children ?? []).length > 0;
    const isFolded = folded.includes(r.span.id);
    const keys: Record<string, () => void> = {
      ArrowDown: () => focusRow(shownRows[i + 1]),
      ArrowUp: () => focusRow(shownRows[i - 1]),
      Home: () => focusRow(shownRows[0]),
      End: () => focusRow(shownRows[shownRows.length - 1]),
      ArrowRight: () => (kids && isFolded ? toggle(r.span.id) : kids ? focusRow(shownRows[i + 1]) : undefined),
      ArrowLeft: () => (kids && !isFolded ? toggle(r.span.id) : focusRow(findRow(r.parentId))),
      Enter: () => toggleOpen(r.span.id, true),
      " ": () => toggleOpen(r.span.id, true),
      Escape: () => wantOpen && setOpen(null),
    };
    if (!keys[e.key]) return;
    e.preventDefault();
    keys[e.key]();
  };

  /* ---------- The details window: opens with a soft scale, closes the same way ---------- */

  const [closing, setClosing] = useState<TraceSpan | null>(null);
  const lastOpen = useRef<TraceSpan | undefined>(undefined);
  useLayoutEffect(() => {
    const was = lastOpen.current;
    lastOpen.current = openSpan;
    if (was && !openSpan && !reducedMotion()) {
      setClosing(was);
      const t = window.setTimeout(() => setClosing(null), 170);
      return () => window.clearTimeout(t);
    }
    if (openSpan) setClosing(null);
  }, [openSpan?.id]); // eslint-disable-line react-hooks/exhaustive-deps -- runs when another span opens or it closes
  const popSpan = openSpan ?? closing ?? undefined;

  useEffect(() => {
    if (!openSpan) return;
    const away = (e: PointerEvent) => {
      const t = e.target as Node;
      if (popRef.current?.contains(t) || rowsRef.current?.contains(t)) return;
      setOpen(null);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  });

  // Under its row, starting where its bar starts – above the row when there is no room below. All reads, then the writes
  useLayoutEffect(() => {
    const pop = popRef.current;
    const body = bodyRef.current;
    const row = popSpan ? rowEls.current.get(popSpan.id) : undefined;
    if (!pop || !body || !row) return;
    const b = body.getBoundingClientRect();
    const scale = body.offsetWidth ? b.width / body.offsetWidth : 1;
    const r = row.getBoundingClientRect();
    const bar = row.querySelector<HTMLElement>("[data-bar]")?.getBoundingClientRect();
    const w = pop.offsetWidth;
    const h = pop.offsetHeight;
    const rowTop = (r.top - b.top) / scale;
    const rowBottom = (r.bottom - b.top) / scale;
    const below = rowBottom + 6;
    // Above: its top edge snaps to a row boundary, so it never cuts through a row
    const rowH = row.offsetHeight || 1;
    const first = rowsRef.current ? (rowsRef.current.getBoundingClientRect().top - b.top) / scale + 4 : 0;
    const raw = rowTop - h - 6;
    const snapped = first + Math.floor((raw - first) / rowH) * rowH;
    const up = snapped >= first ? snapped : raw;
    const top = below + h > body.offsetHeight + 24 && up > 0 ? up : below;
    const start = bar ? (bar.left - b.left) / scale : 8;
    const left = Math.max(8, Math.min(start, body.offsetWidth - w - 8));
    pop.style.left = `${left}px`;
    pop.style.top = `${top}px`;
    pop.dataset.side = top === up ? "above" : "below";
  });

  /* ---------- The run in numbers ---------- */

  const leaves = all.filter((s) => s.kind === "llm" || s.kind === "tool");
  const [tin, tout] = tokensOf(root);
  const errors = all.filter((s) => s.status === "failed").length;
  const finished = leaves.filter((s) => s.status !== "running" && s.end !== undefined);
  const slowest = markSlowest && finished.length > 1 ? finished.reduce((a, b) => (durOf(b) > durOf(a) ? b : a)) : undefined;
  const state: TraceSpanStatus = root.status === "running" || live ? "running" : root.status === "failed" ? "failed" : "done";

  const stats: { label: string; value: string; live?: boolean; kind?: string; run?: number }[] = [
    { label: "Duration", value: took(durOf(root)), live: state === "running", run: runs(root) ? root.start : undefined },
    { label: "Cost", value: formatCost(costOf(root)), live: state === "running" },
    { label: "Tokens", value: tokens(tin + tout), live: state === "running" },
    { label: "LLM calls", value: String(all.filter((s) => s.kind === "llm").length) },
    { label: "Tool calls", value: String(all.filter((s) => s.kind === "tool").length) },
    { label: "Errors", value: String(errors), kind: errors ? "failed" : undefined },
  ];

  /* ---------- The row window: the rows near the viewport, plus the focused and the open row ---------- */

  let renderRows: { row: Row; gap: number }[];
  let lastShown = -1;
  if (!rowWindow.virtual) renderRows = rows.map((row) => ({ row, gap: 0 }));
  else {
    const keep = new Set<number>();
    for (let i = rowWindow.start; i < rowWindow.end; i++) keep.add(i);
    for (const id of [activeId, wantOpen]) {
      const i = shownRows.findIndex((x) => x.span.id === id);
      if (i >= 0) keep.add(i);
    }
    renderRows = [];
    for (const i of [...keep].sort((a, b) => a - b)) {
      renderRows.push({ row: shownRows[i], gap: i - lastShown - 1 });
      lastShown = i;
    }
  }
  // The sheen on the first few running bars only – it is decoration, and each one costs paint
  const shining = new Set<string>();
  for (const { row } of renderRows) {
    if (shining.size >= SHINE_MAX) break;
    if (row.span.status === "running" && !row.hidden && row.leaving === undefined) shining.add(row.span.id);
  }

  return (
    <div
      {...rest}
      ref={setRoot}
      className={[ROOT_CLASS, className].filter(Boolean).join(" ")}
      data-look={look ?? DEFAULT_LOOK}
      data-live={state === "running" ? "" : undefined}
      data-offscreen={onScreen ? undefined : ""}
      style={style}
    >
      <style href="ui-trace-waterfall" precedence="default">
        {css}
      </style>

      <header className="ui-tw__bar-head">
        <span className="ui-tw__spark">
          <Spark />
        </span>
        <span className="ui-tw__heading">{title}</span>
        <span className="ui-tw__task">{root.input ?? root.name}</span>
        <span className="ui-tw__pill" data-status={state} aria-live="polite">
          {state === "running" && <span className="ui-tw__pulse" aria-hidden="true" />}
          {state === "running" ? "Live" : STATUS[state]}
        </span>
      </header>

      <div className="ui-tw__card">
        <dl className="ui-tw__stats">
          {stats.map((s) => (
            <div key={s.label} className="ui-tw__stat" data-kind={s.kind}>
              <dt>{s.label}</dt>
              <dd>
                <span className="ui-tw__amount" data-live={s.live ? "" : undefined} data-run-took={s.run}>
                  {s.value}
                </span>
              </dd>
            </div>
          ))}
        </dl>

        <div ref={bodyRef} className="ui-tw__body">
          {/* Ticks, grid lines and the "now" line – positioned against the gliding range */}
          <div ref={layerRef} className="ui-tw__layer" aria-hidden="true" style={{ "--tc-trace-waterfall-at": now } as CSSProperties}>
            {tickList.map(({ v, leaving }) => (
              <span key={v} className="ui-tw__tick" data-zero={v === 0 ? "" : undefined} data-leaving={leaving ? "" : undefined} style={{ "--v": v } as CSSProperties}>
                <span>{tickLabel(v)}</span>
              </span>
            ))}
            {state === "running" && <span className="ui-tw__now" />}
          </div>
          <div className="ui-tw__axis" aria-hidden="true">
            <span>Span</span>
          </div>
          <div
            ref={rowsRef}
            className="ui-tw__rows"
            role="tree"
            aria-label={title}
            data-virtual={rowWindow.virtual ? "" : undefined}
            style={rowWindow.virtual ? { paddingBottom: `calc(${shownRows.length - lastShown - 1} * var(--tc-trace-waterfall-row))` } : undefined}
          >
            {renderRows.map(({ row: r, gap }) => {
              const s = r.span;
              return (
                <TraceRow
                  key={r.leaving !== undefined ? `${s.id}~out` : s.id}
                  row={r}
                  isFolded={(s.children ?? []).length > 0 && folded.includes(s.id)}
                  isOpen={wantOpen === s.id}
                  isSlowest={slowest?.id === s.id}
                  tabbable={activeId === s.id}
                  shine={shining.has(s.id)}
                  gap={gap}
                  delay={enterDelay.get(s.id) ?? 0}
                  range={range}
                  trackW={trackW}
                  endOf={endOf}
                  formatCost={formatCost}
                  rowEls={rowEls}
                  onPick={() => {
                    setActive(s.id);
                    toggleOpen(s.id, false);
                  }}
                  onFold={() => {
                    setActive(s.id);
                    toggle(s.id);
                  }}
                  onFocusRow={() => setActive(s.id)}
                  onKey={(e) => onKey(e, r)}
                />
              );
            })}
          </div>
          {popSpan && (
            <SpanDetails
              span={popSpan}
              closing={!openSpan}
              dur={durOf(popSpan)}
              formatCost={formatCost}
              popRef={popRef}
              onClose={(refocus) => {
                // Back to the span's row before the window goes (or the active row, if that one folded away)
                if (refocus) rescueFocus(popRef.current, [rowEls.current.get(popSpan.id), rowEls.current.get(activeId)]);
                setOpen(null);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Styles ---------- */

const css = /* css */ `
/* Colors, sizes and motion as variables – override them on .ui-tw */
:where([data-look="standard"], [data-look="standard"] *).ui-tw {
  /* Tree guides and the now line */
  --tc-trace-waterfall-guide: light-dark(#e6e6e6, #34343a);
  --tc-trace-waterfall-now: light-dark(rgba(47, 107, 255, 0.55), rgba(91, 154, 255, 0.6));
  --tc-trace-waterfall-tick-zero: var(--tc-border-default);
  /* Bars by kind: a tint, its edge, the ink on it and the small mark a folded parent shows */
  --tc-trace-waterfall-agent-bg: light-dark(#eef0f3, #2c2f35);
  --tc-trace-waterfall-agent-edge: light-dark(#d3d8e0, #41464f);
  --tc-trace-waterfall-agent-ink: light-dark(#4b5363, #b8c0cc);
  --tc-trace-waterfall-agent-mark: light-dark(#9aa3b2, #7a8291);
  --tc-trace-waterfall-llm-bg: light-dark(#efecff, #2a2545);
  --tc-trace-waterfall-llm-edge: light-dark(#cbc2fb, #4c3fa0);
  --tc-trace-waterfall-llm-ink: light-dark(#5a45d4, #b6a9ff);
  --tc-trace-waterfall-llm-mark: #8d7cf0;
  --tc-trace-waterfall-tool-bg: light-dark(#e4f5f1, #16302b);
  --tc-trace-waterfall-tool-edge: light-dark(#a9ddd1, #285f54);
  --tc-trace-waterfall-tool-ink: light-dark(#0e7a67, #62d5bb);
  --tc-trace-waterfall-tool-mark: #3db39a;
  --tc-trace-waterfall-row: 32px;
  --tc-trace-waterfall-bar: 16px;
  --tc-trace-waterfall-bar-radius: var(--tc-radius-sm);
  --tc-trace-waterfall-axis: 30px;
  --tc-trace-waterfall-name: 236px;
  --tc-trace-waterfall-pad: 10px;
  --tc-trace-waterfall-gap: 14px;
  --tc-trace-waterfall-end: 16px;
  --tc-trace-waterfall-indent: 14px;
  --tc-trace-waterfall-range: 10000;
  position: relative;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-sunken);
  container: ui-tw / inline-size;
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: var(--tc-font-size-lg);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  letter-spacing: -0.006em;
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Colors, sizes and motion as variables – override them on .ui-tw */
:where([data-look="clean"], [data-look="clean"] *).ui-tw {
  /* Tree guides and the now line */
  --tc-trace-waterfall-guide: light-dark(rgba(0, 0, 0, 0.08), rgba(255, 255, 255, 0.1));
  --tc-trace-waterfall-now: light-dark(rgba(0, 96, 226, 0.45), rgba(91, 154, 255, 0.55));
  --tc-trace-waterfall-tick-zero: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.12));
  /* Bars by kind: a tint, its edge, the ink on it and the small mark a folded parent shows */
  --tc-trace-waterfall-agent-mark: light-dark(rgba(0, 0, 0, 0.3), rgba(255, 255, 255, 0.4));
  --tc-trace-waterfall-llm-bg: light-dark(rgba(91, 91, 214, 0.1), rgba(130, 130, 255, 0.16));
  --tc-trace-waterfall-llm-edge: light-dark(rgba(91, 91, 214, 0.3), rgba(130, 130, 255, 0.38));
  --tc-trace-waterfall-llm-ink: light-dark(#4a4ac2, #b1a9ff);
  --tc-trace-waterfall-llm-mark: light-dark(rgba(91, 91, 214, 0.72), rgba(140, 140, 255, 0.8));
  --tc-trace-waterfall-tool-bg: light-dark(rgba(0, 123, 172, 0.085), rgba(0, 170, 220, 0.13));
  --tc-trace-waterfall-tool-edge: light-dark(rgba(0, 123, 172, 0.28), rgba(0, 170, 220, 0.34));
  --tc-trace-waterfall-tool-ink: light-dark(#006a94, #4ccce6);
  --tc-trace-waterfall-tool-mark: light-dark(rgba(0, 123, 172, 0.62), rgba(40, 180, 225, 0.75));
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  --tc-trace-waterfall-row: 30px;
  --tc-trace-waterfall-bar: 14px;
  --tc-trace-waterfall-bar-radius: var(--tc-radius-xs);
  --tc-trace-waterfall-axis: 30px;
  --tc-trace-waterfall-name: 232px;
  --tc-trace-waterfall-pad: 10px;
  --tc-trace-waterfall-gap: 14px;
  --tc-trace-waterfall-end: 16px;
  --tc-trace-waterfall-indent: 14px;
  --tc-trace-waterfall-range: 10000;
  position: relative;
  box-sizing: border-box;
  width: 100%;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  container: ui-tw / inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
.ui-tw *, .ui-tw *::before, .ui-tw *::after { box-sizing: border-box; }
:where(.ui-tw) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.ui-tw button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-tw :is(p, dl, dd) { margin: 0; }
.ui-tw svg { display: block; flex: none; }
.ui-tw__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* ----- On the tray (Clean: on the card): what ran, and whether it still runs ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-tw__bar-head { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-3) var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-tw__bar-head { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; padding: var(--tc-space-3) var(--tc-space-3-5) var(--tc-space-3) var(--tc-space-4); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-tw__spark { display: grid; flex: none; place-items: center; width: 16px; color: var(--tc-accent-text); }
.ui-tw__heading { flex: none; font-weight: var(--tc-font-weight-strong); color: var(--tc-text-strong); }
.ui-tw__task { flex: 1; min-width: 0; overflow: hidden; color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-tw__task { font-size: var(--tc-font-size-md); }
/* Status pills: the live/done pill in the header is the large pill, the one in the details the regular one */
.ui-tw__pill { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-pill-h-lg); padding: 0 var(--tc-pill-px-lg); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size-lg); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-tw__pill { color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-tw__pill { color: var(--tc-text-secondary); }
:where([data-look="standard"], [data-look="standard"] *).ui-tw__bar-head .ui-tw__pill { background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
.ui-tw__pill[data-status="running"] { color: var(--tc-accent-text); }
.ui-tw__pill[data-status="done"] { color: var(--tc-status-success-fg); }
.ui-tw__pill[data-status="failed"] { color: var(--tc-status-danger-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-tw__pop .ui-tw__pill[data-status="running"],
:where([data-look="clean"], [data-look="clean"] *).ui-tw__pill[data-status="running"] { background: var(--tc-accent-subtle); }
:where([data-look="standard"], [data-look="standard"] *).ui-tw__pop .ui-tw__pill[data-status="done"],
:where([data-look="clean"], [data-look="clean"] *).ui-tw__pill[data-status="done"] { background: var(--tc-status-success-bg); }
:where([data-look="standard"], [data-look="standard"] *).ui-tw__pop .ui-tw__pill[data-status="failed"],
:where([data-look="clean"], [data-look="clean"] *).ui-tw__pill[data-status="failed"] { background: var(--tc-status-danger-bg); }
/* The live dot breathes a few times, then rests – the pill still says "Live" */
.ui-tw__pulse { width: 6px; height: 6px; border-radius: 50%; background: currentColor; animation: ui-tw-pulse var(--tc-duration-shimmer) var(--tc-ease-in-out) 3; }
/* ----- The white card: the run in numbers, then the waterfall ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-tw__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
.ui-tw__stats { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); padding: var(--tc-space-3-5) 0; border-bottom: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="clean"], [data-look="clean"] *).ui-tw__stats { padding: var(--tc-space-3) 0; }
.ui-tw__stat { display: grid; gap: var(--tc-space-0-5); min-width: 0; padding: 0 var(--tc-space-4); }
/* The first value a little further from the edge, the last one a little closer – so the row looks even */
.ui-tw__stat:first-child { padding-left: 22px; }
.ui-tw__stat:last-child { padding-right: var(--tc-space-2-5); }
.ui-tw__stat + .ui-tw__stat { border-left: var(--tc-hairline) solid var(--tc-divider); }
.ui-tw__stat dt { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-tw__stat dt { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-tw__stat dd { overflow: hidden; font-size: var(--tc-font-size-xl); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-relaxed); letter-spacing: var(--tc-tracking-snug); color: var(--tc-text-primary); white-space: nowrap; font-variant-numeric: tabular-nums; }
/* Clean captions: the shared uppercase caption style */
:where([data-look="clean"], [data-look="clean"] *).ui-tw :is(.ui-tw__stat dt, .ui-tw__axis, .ui-tw__pop-stats dt, .ui-tw__pop-io > span) { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
:where([data-look="clean"], [data-look="clean"] *).ui-tw__stat dd { overflow: hidden; font-size: var(--tc-font-size-lg-plus); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-loose); color: var(--tc-text-primary); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-tw__stat[data-kind="failed"] dd { color: var(--tc-status-danger-fg); }
.ui-tw__body { position: relative; padding-bottom: var(--tc-space-4-5); }
/* The axis and its grid lines run behind the rows; the range glides, so everything is placed in calc() */
.ui-tw__layer { position: absolute; top: 0; bottom: 0; left: calc(var(--tc-trace-waterfall-pad) + var(--tc-trace-waterfall-name) + var(--tc-trace-waterfall-gap)); right: var(--tc-trace-waterfall-end); overflow: hidden; pointer-events: none; }
.ui-tw__tick { position: absolute; top: 0; bottom: 0; left: calc(var(--v) * 100% / var(--tc-trace-waterfall-range)); width: var(--tc-hairline); background: var(--tc-border-subtle); animation: ui-tw-fade var(--tc-duration-slower) var(--tc-ease-standard) both; transition: opacity var(--tc-duration-slower) var(--tc-ease-standard); }
.ui-tw__tick[data-zero] { background: var(--tc-trace-waterfall-tick-zero); }
.ui-tw__tick[data-leaving] { opacity: 0; }
.ui-tw__tick > span { position: absolute; left: var(--tc-space-1-5); color: var(--tc-text-muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-tw__tick > span { top: 7px; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); }
:where([data-look="clean"], [data-look="clean"] *).ui-tw__tick > span { top: 7px; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
.ui-tw__now { position: absolute; top: 0; bottom: 0; left: calc(var(--tc-trace-waterfall-at) * 100% / var(--tc-trace-waterfall-range)); width: 1px; background: var(--tc-trace-waterfall-now); }
:where([data-look="standard"], [data-look="standard"] *).ui-tw__now::before { content: ""; position: absolute; top: calc(var(--tc-trace-waterfall-axis) - 3px); left: -2.5px; width: 6px; height: 6px; border-radius: 50%; background: var(--tc-accent-text); box-shadow: 0 0 0 3px var(--tc-surface-raised); }
:where([data-look="clean"], [data-look="clean"] *).ui-tw__now::before { content: ""; position: absolute; top: calc(var(--tc-trace-waterfall-axis) - 2.5px); left: -2px; width: 5px; height: 5px; border-radius: 50%; background: var(--tc-accent-text); box-shadow: 0 0 0 3px var(--tc-surface-raised); }
.ui-tw__axis { display: flex; align-items: center; height: var(--tc-trace-waterfall-axis); padding-left: calc(var(--tc-trace-waterfall-pad) + var(--tc-space-1-5)); border-bottom: var(--tc-hairline) solid var(--tc-divider); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-tw__axis { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); }
.ui-tw__rows { position: relative; padding-top: var(--tc-space-1); }
/* ----- One row: its name on the left, its bar on the right ----- */
.ui-tw__row {
  display: grid;
  grid-template-columns: var(--tc-trace-waterfall-name) minmax(0, 1fr);
  column-gap: var(--tc-trace-waterfall-gap);
  height: var(--tc-trace-waterfall-row);
  padding: 0 var(--tc-trace-waterfall-end) 0 var(--tc-trace-waterfall-pad);
  overflow: hidden;
  /* The focus ring is drawn inside the row (below) – rows sit edge to edge */
  outline: none;
  cursor: pointer;
  transition: height var(--tc-duration-slow) var(--tc-ease-move), opacity var(--tc-duration-moderate) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard);
  animation: ui-tw-row var(--tc-duration-slower) var(--tc-ease-move) backwards;
}
.ui-tw__row:hover { background: var(--tc-fill-hover); }
/* Open: the fill plus a bar on the left edge, so it doesn't rest on color alone */
.ui-tw__row[data-open] { background: var(--tc-fill-selected); box-shadow: inset var(--tc-focus-ring-width) 0 0 var(--tc-border-selected); }
.ui-tw__row:focus-visible { box-shadow: inset 0 0 0 var(--tc-focus-ring-width) var(--tc-focus-ring); }
/* Folded away or leaving: the row closes to no height */
.ui-tw__row:is([data-hidden], [data-leaving]) { height: 0; opacity: 0; pointer-events: none; }
.ui-tw__row[data-leaving] { animation: ui-tw-leave var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-tw__row[data-leaving][data-hidden] { animation: none; }
.ui-tw__row[data-leaving] :is(.ui-tw__bar, .ui-tw__tag, .ui-tw__more, .ui-tw__slow) { animation: none; }
/* Long traces render a window of rows: rows coming into it while scrolling don't slide in */
.ui-tw__rows[data-virtual] :is(.ui-tw__row, .ui-tw__bar, .ui-tw__more, .ui-tw__slow) { animation: none; }
.ui-tw__name { display: flex; align-items: center; min-width: 0; height: var(--tc-trace-waterfall-row); }
/* One faint line per level, under the chevron of each parent */
:where([data-look="standard"], [data-look="standard"] *).ui-tw__guides { flex: none; align-self: stretch; background: repeating-linear-gradient(90deg, transparent 0 7.5px, var(--tc-trace-waterfall-guide) 7.5px 8.5px, transparent 8.5px var(--tc-trace-waterfall-indent)); }
:where([data-look="clean"], [data-look="clean"] *).ui-tw__guides { flex: none; align-self: stretch; background: repeating-linear-gradient(90deg, transparent 0 7.75px, var(--tc-trace-waterfall-guide) 7.75px 8.25px, transparent 8.25px var(--tc-trace-waterfall-indent)); }
.ui-tw__chev { display: grid; flex: none; place-items: center; width: 16px; height: 20px; margin-right: var(--tc-space-1); border-radius: var(--tc-radius-xs); color: var(--tc-text-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-tw__chev:not([data-leaf]):hover { background: var(--tc-fill-default); color: var(--tc-text-primary); }
.ui-tw__chev > svg { transition: transform var(--tc-duration-moderate) var(--tc-ease-move); }
.ui-tw__row[data-folded] .ui-tw__chev > svg { transform: rotate(-90deg); }
.ui-tw__icon { display: grid; flex: none; place-items: center; width: 20px; height: 20px; margin-right: var(--tc-space-2); border-radius: var(--tc-avatar-radius-agent); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
.ui-tw__icon > svg { width: 12px; height: 12px; }
/* The swatch says the kind by shape too: agents a square, LLM calls a circle, tool calls a diamond */
.ui-tw__swatch { width: 8px; height: 8px; border-radius: var(--tc-radius-2xs); background: var(--tc-trace-waterfall-span-mark); }
.ui-tw [data-kind="llm"] .ui-tw__swatch, .ui-tw__pop[data-kind="llm"] .ui-tw__swatch { border-radius: 50%; }
.ui-tw [data-kind="tool"] .ui-tw__swatch, .ui-tw__pop[data-kind="tool"] .ui-tw__swatch { width: 7px; height: 7px; border-radius: var(--tc-radius-2xs); transform: rotate(45deg); }
.ui-tw__label { display: flex; align-items: baseline; gap: var(--tc-space-1-5); flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; }
.ui-tw__title { flex: none; max-width: 100%; overflow: hidden; color: var(--tc-text-primary); text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-tw__title { font-size: var(--tc-font-size-md); }
.ui-tw__row[data-parent] .ui-tw__title { font-weight: var(--tc-font-weight-medium); }
:where([data-look="clean"], [data-look="clean"] *).ui-tw__row[data-parent] .ui-tw__title { color: var(--tc-text-strong); }
.ui-tw__detail { min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); text-overflow: ellipsis; }
/* How many spans a folded row holds – a count badge */
.ui-tw__more { display: inline-flex; flex: none; align-items: center; height: var(--tc-pill-h); margin-left: var(--tc-space-1-5); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; animation: ui-tw-pop var(--tc-duration-base) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-tw__more { color: var(--tc-text-muted); }
.ui-tw__state { display: grid; flex: none; place-items: center; width: 16px; margin-left: var(--tc-space-1); }
.ui-tw__state[data-status="running"] { color: var(--tc-accent-text); }
.ui-tw__state[data-status="failed"] { color: var(--tc-status-danger-fg); }
.ui-tw__spin { animation: ui-tw-spin var(--tc-duration-reveal-slow) linear infinite; }
.ui-tw__meta { display: none; }
/* ----- The bar ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-tw [data-kind] { --tc-trace-waterfall-span-bg: var(--tc-trace-waterfall-agent-bg); --tc-trace-waterfall-span-edge: var(--tc-trace-waterfall-agent-edge); --tc-trace-waterfall-span-ink: var(--tc-trace-waterfall-agent-ink); --tc-trace-waterfall-span-mark: var(--tc-trace-waterfall-agent-mark); }
:where([data-look="clean"], [data-look="clean"] *).ui-tw [data-kind] { --tc-trace-waterfall-span-bg: var(--tc-fill-default); --tc-trace-waterfall-span-edge: var(--tc-border-strong); --tc-trace-waterfall-span-ink: var(--tc-text-secondary); --tc-trace-waterfall-span-mark: var(--tc-trace-waterfall-agent-mark); }
.ui-tw [data-kind="llm"] { --tc-trace-waterfall-span-bg: var(--tc-trace-waterfall-llm-bg); --tc-trace-waterfall-span-edge: var(--tc-trace-waterfall-llm-edge); --tc-trace-waterfall-span-ink: var(--tc-trace-waterfall-llm-ink); --tc-trace-waterfall-span-mark: var(--tc-trace-waterfall-llm-mark); }
.ui-tw [data-kind="tool"] { --tc-trace-waterfall-span-bg: var(--tc-trace-waterfall-tool-bg); --tc-trace-waterfall-span-edge: var(--tc-trace-waterfall-tool-edge); --tc-trace-waterfall-span-ink: var(--tc-trace-waterfall-tool-ink); --tc-trace-waterfall-span-mark: var(--tc-trace-waterfall-tool-mark); }
.ui-tw [data-kind][data-status="failed"] { --tc-trace-waterfall-span-bg: var(--tc-status-danger-bg); --tc-trace-waterfall-span-edge: var(--tc-status-danger-border); --tc-trace-waterfall-span-ink: var(--tc-status-danger-fg); --tc-trace-waterfall-span-mark: var(--tc-status-danger-solid); }
.ui-tw__track { position: relative; min-width: 0; height: var(--tc-trace-waterfall-row); overflow: hidden; }
.ui-tw__bar {
  position: absolute;
  top: calc(50% - var(--tc-trace-waterfall-bar) / 2);
  left: calc(var(--s) * 100% / var(--tc-trace-waterfall-range));
  width: max(3px, calc(var(--d) * 100% / var(--tc-trace-waterfall-range)));
  height: var(--tc-trace-waterfall-bar);
  overflow: hidden;
  border-radius: var(--tc-trace-waterfall-bar-radius);
  background: var(--tc-trace-waterfall-span-bg);
  box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-trace-waterfall-span-edge);
  transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-moderate) var(--tc-ease-standard), opacity var(--tc-duration-moderate) var(--tc-ease-standard);
  animation: ui-tw-grow var(--tc-duration-slowest) var(--tc-ease-move) backwards;
}
.ui-tw__row:is(:hover, [data-open]) .ui-tw__bar { box-shadow: inset 0 0 0 1px var(--tc-trace-waterfall-span-mark); }
/* Folded: the parent bar steps back, its children show on it as small marks */
.ui-tw__row[data-folded] .ui-tw__bar { opacity: 0.75; }
.ui-tw__mark { position: absolute; left: calc(var(--s) * 100% / var(--tc-trace-waterfall-range)); width: max(2px, calc(var(--d) * 100% / var(--tc-trace-waterfall-range))); border-radius: var(--tc-radius-2xs); background: var(--tc-trace-waterfall-span-mark); pointer-events: none; animation: ui-tw-mark var(--tc-duration-base) var(--tc-ease-move) var(--tc-duration-fast) backwards; }
:where([data-look="standard"], [data-look="standard"] *).ui-tw__mark { top: calc(50% - 3px); height: 6px; }
:where([data-look="clean"], [data-look="clean"] *).ui-tw__mark { top: calc(50% - 2.5px); height: 5px; }
:where([data-look="standard"], [data-look="standard"] *).ui-tw__mark { opacity: 0.85; }
:where([data-look="clean"], [data-look="clean"] *).ui-tw__mark { opacity: 0.9; }
/* Still running: the leading edge is lit; on the first few running bars a sheen passes a few times, then rests.
   The sheen moves with transform (composited) and pauses off-screen */
.ui-tw__bar[data-status="running"]::after { content: ""; position: absolute; top: 0; right: 0; bottom: 0; width: min(28px, 100%); background: linear-gradient(90deg, transparent, var(--tc-trace-waterfall-span-edge)); }
.ui-tw__bar[data-shine]::after { animation: ui-tw-glow var(--tc-duration-reveal-slow) var(--tc-ease-in-out) 6 alternate; }
.ui-tw__bar[data-shine]::before { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, transparent 25%, var(--tc-shimmer) 50%, transparent 75%); opacity: 0.7; transform: translateX(-100%); animation: ui-tw-sweep var(--tc-duration-shimmer) linear 3; }
.ui-tw[data-offscreen] *, .ui-tw[data-offscreen] *::before, .ui-tw[data-offscreen] *::after { animation-play-state: paused; }
/* How long it took, after the bar – or inside its end, or before it, when there is no room */
/* It sits on the card's color, so grid lines and the "now" line pass behind it */
.ui-tw__tag { position: absolute; top: 50%; display: flex; align-items: center; gap: var(--tc-space-1-5); min-height: 18px; padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-xs); background: var(--tc-surface-raised); line-height: var(--tc-line-height-tight); white-space: nowrap; font-variant-numeric: tabular-nums; pointer-events: none; transform: translateY(-50%); }
:where([data-look="standard"], [data-look="standard"] *).ui-tw__tag { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-tw__tag { font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-tw__tag[data-side="after"] { left: calc((var(--s) + var(--d)) * 100% / var(--tc-trace-waterfall-range) + var(--tc-space-0-5)); }
.ui-tw__tag[data-side="inside"] { right: calc(100% - (var(--s) + var(--d)) * 100% / var(--tc-trace-waterfall-range) + var(--tc-space-0-5)); flex-direction: row-reverse; background: none; color: var(--tc-trace-waterfall-span-ink); }
.ui-tw__tag[data-side="before"] { right: calc(100% - var(--s) * 100% / var(--tc-trace-waterfall-range) + var(--tc-space-0-5)); flex-direction: row-reverse; }
.ui-tw__row[data-open] .ui-tw__tag { background: none; }
.ui-tw__row[data-status="failed"] .ui-tw__tag { color: var(--tc-status-danger-fg); }
/* The slowest call: a warning status pill */
.ui-tw__slow { display: inline-flex; flex: none; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-status-warning-bg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-status-warning-fg); animation: ui-tw-pop var(--tc-duration-moderate) var(--tc-ease-move) both; }
/* ----- The details window ----- */
.ui-tw__pop { position: absolute; top: 0; left: 0; z-index: 5; display: grid; gap: var(--tc-space-2-5); padding: var(--tc-space-3); background: var(--tc-surface-overlay); box-shadow: var(--tc-shadow-overlay); cursor: auto; transform-origin: 24px top; animation: ui-tw-open var(--tc-duration-base) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-tw__pop { width: min(330px, calc(100% - 16px)); border-radius: var(--tc-radius-2xl); }
:where([data-look="clean"], [data-look="clean"] *).ui-tw__pop { width: min(320px, calc(100% - 16px)); border-radius: var(--tc-radius-lg); }
.ui-tw__pop:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-tw__pop[data-side="above"] { transform-origin: 24px bottom; }
.ui-tw__pop[data-closing] { animation: ui-tw-close var(--tc-duration-fast) var(--tc-ease-standard) forwards; pointer-events: none; }
.ui-tw__pop-head { display: flex; align-items: center; gap: 0; min-width: 0; }
.ui-tw__pop-head .ui-tw__icon { width: 28px; height: 28px; margin-right: var(--tc-space-2-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-tw__pop-head .ui-tw__icon { border-radius: var(--tc-radius-md); }
:where([data-look="clean"], [data-look="clean"] *).ui-tw__pop-head .ui-tw__icon { border-radius: var(--tc-radius-sm); }
.ui-tw__pop-head .ui-tw__icon > svg { width: 15px; height: 15px; }
.ui-tw__pop-head .ui-tw__swatch { width: 10px; height: 10px; }
.ui-tw__pop-who { display: grid; flex: 1; min-width: 0; }
.ui-tw__pop-name { overflow: hidden; font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-snug); color: var(--tc-text-strong); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-tw__pop-name { font-size: var(--tc-font-size-md); }
.ui-tw__pop-kind { overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
.ui-tw__pop-head .ui-tw__pill { height: var(--tc-pill-h); margin-left: var(--tc-space-2); padding: 0 var(--tc-pill-px); font-size: var(--tc-pill-font-size); }
.ui-tw__close { display: grid; flex: none; place-items: center; width: 28px; height: 28px; margin: -2px -4px 0 var(--tc-space-1); color: var(--tc-text-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-tw__close { border-radius: var(--tc-radius-md); }
:where([data-look="clean"], [data-look="clean"] *).ui-tw__close { border-radius: var(--tc-radius-sm); }
.ui-tw__close:hover { background: var(--tc-fill-default); color: var(--tc-text-primary); }
.ui-tw__pop-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--tc-space-2); background: var(--tc-fill-subtle); }
:where([data-look="standard"], [data-look="standard"] *).ui-tw__pop-stats { padding: var(--tc-space-2-5) var(--tc-space-3); border-radius: var(--tc-radius-lg); }
:where([data-look="standard"], [data-look="standard"] *).ui-tw__pop-stats dt { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-tw__pop-stats dd { font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-tw__pop-stats { padding: var(--tc-space-2) var(--tc-space-2-5); border-radius: var(--tc-radius-md); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-tw__pop-stats dd { font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-tw__pop-error { display: flex; gap: var(--tc-space-2); padding: var(--tc-space-2) var(--tc-space-2-5); background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-tw__pop-error { border-radius: var(--tc-radius-lg); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
:where([data-look="clean"], [data-look="clean"] *).ui-tw__pop-error { border-radius: var(--tc-radius-md); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
.ui-tw__pop-error > svg { margin-top: 2.5px; }
:where([data-look="clean"], [data-look="clean"] *).ui-tw__pop-error > svg { margin-top: var(--tc-space-0-5); }
.ui-tw__pop-io { display: grid; gap: var(--tc-space-0-5); }
.ui-tw__pop-io > p { display: -webkit-box; overflow: hidden; -webkit-line-clamp: 3; -webkit-box-orient: vertical; }
:where([data-look="standard"], [data-look="standard"] *).ui-tw__pop-io > span { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-tw__pop-io > p { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-tw__pop-io > p { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); }
/* ----- Narrow: the name on its own line, its bar under it across the whole width ----- */
@container ui-tw (max-width: 560px) {
  :where([data-look="standard"], [data-look="standard"] *).ui-tw__bar-head { padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-2-5) var(--tc-space-2-5); }
  :where([data-look="clean"], [data-look="clean"] *).ui-tw__bar-head { padding: var(--tc-space-2-5) var(--tc-space-3); }
  .ui-tw__stats { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  :where([data-look="standard"], [data-look="standard"] *).ui-tw__stats { row-gap: var(--tc-space-3); padding: var(--tc-space-3) 0; }
  :where([data-look="clean"], [data-look="clean"] *).ui-tw__stats { row-gap: var(--tc-space-2-5); padding: var(--tc-space-2-5) 0; }
  .ui-tw__stat { padding: 0 var(--tc-space-3); }
  .ui-tw__stat:is(:first-child, :nth-child(4)) { padding-left: var(--tc-space-4); }
  .ui-tw__stat:is(:nth-child(3), :last-child) { padding-right: var(--tc-space-2); }
  .ui-tw__stat:nth-child(4) { border-left: 0; }
  :where([data-look="standard"], [data-look="standard"] *).ui-tw__stat dd { font-size: var(--tc-font-size-lg-plus); }
  /* A container query can't restyle its own container – the sizes change on the card (Clean: the body) */
  :where([data-look="standard"], [data-look="standard"] *).ui-tw__card { --tc-trace-waterfall-row: 48px; --tc-trace-waterfall-bar: 10px; --tc-trace-waterfall-end: 12px; --tc-trace-waterfall-bar-radius: var(--tc-radius-xs); }
  :where([data-look="clean"], [data-look="clean"] *).ui-tw__body { --tc-trace-waterfall-row: 46px; --tc-trace-waterfall-bar: 10px; --tc-trace-waterfall-end: 12px; }
  .ui-tw__layer { left: var(--tc-trace-waterfall-pad); right: var(--tc-trace-waterfall-end); }
  /* The grid lines would cross the names – here they only mark the axis, and "now" is a dot on it */
  .ui-tw__tick { bottom: auto; height: var(--tc-trace-waterfall-axis); }
  :where([data-look="standard"], [data-look="standard"] *).ui-tw__tick[data-zero] { background: var(--tc-border-subtle); }
  .ui-tw__now { bottom: auto; height: var(--tc-trace-waterfall-axis); }
  .ui-tw__axis > span { display: none; }
  :where([data-look="standard"], [data-look="standard"] *).ui-tw__row { grid-template-columns: minmax(0, 1fr); grid-template-rows: 30px 12px; column-gap: 0; }
  :where([data-look="standard"], [data-look="standard"] *).ui-tw__name { height: 30px; }
  :where([data-look="clean"], [data-look="clean"] *).ui-tw__row { grid-template-columns: minmax(0, 1fr); grid-template-rows: 28px 12px; column-gap: 0; }
  :where([data-look="clean"], [data-look="clean"] *).ui-tw__name { height: 28px; }
  .ui-tw__track { height: 12px; }
  .ui-tw__mark { top: calc(50% - 2px); height: 4px; }
  .ui-tw__tag { display: none; }
  .ui-tw__meta { display: flex; flex: none; align-items: center; gap: var(--tc-space-1-5); margin-left: var(--tc-space-2); line-height: var(--tc-line-height-tight); white-space: nowrap; font-variant-numeric: tabular-nums; }
  :where([data-look="standard"], [data-look="standard"] *).ui-tw__meta { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
  :where([data-look="clean"], [data-look="clean"] *).ui-tw__meta { font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
  .ui-tw__row[data-status="failed"] .ui-tw__meta { color: var(--tc-status-danger-fg); }
  .ui-tw__pop-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
/* Phones: the name gets the room – only the duration beside it, "Slowest" becomes a small dot (its name stays for
   screen readers and in the title) */
@container ui-tw (max-width: 400px) {
  :where([data-look="clean"], [data-look="clean"] *).ui-tw__stat { padding-inline: var(--tc-space-2-5); }
  :where([data-look="clean"], [data-look="clean"] *).ui-tw__stat:is(:first-child, :nth-child(4)) { padding-left: var(--tc-space-3-5); }
  :where([data-look="clean"], [data-look="clean"] *).ui-tw__stat dt { letter-spacing: 0.02em; }
  .ui-tw__meta-cost { display: none; }
  .ui-tw__meta .ui-tw__slow { width: 6px; height: 6px; padding: 0; border-radius: 50%; background: var(--tc-status-warning-fg); }
  .ui-tw__meta .ui-tw__slow-text { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
}
@container ui-tw (max-width: 360px) {
  .ui-tw__detail { display: none; }
}
@keyframes ui-tw-row { from { height: 0; opacity: 0; transform: translateY(-4px); } }
@keyframes ui-tw-leave { from { height: var(--tc-trace-waterfall-row); opacity: 1; } to { height: 0; opacity: 0; } }
@keyframes ui-tw-grow { from { clip-path: inset(0 100% 0 0 round var(--tc-trace-waterfall-bar-radius)); } to { clip-path: inset(0 0 0 0 round var(--tc-trace-waterfall-bar-radius)); } }
@keyframes ui-tw-fade { from { opacity: 0; } }
@keyframes ui-tw-mark { from { opacity: 0; transform: scaleY(0.2); } }
@keyframes ui-tw-pop { from { opacity: 0; transform: scale(0.9); } }
@keyframes ui-tw-open { from { opacity: 0; transform: translateY(-4px) scale(0.96); } }
@keyframes ui-tw-close { to { opacity: 0; transform: translateY(-3px) scale(0.97); } }
@keyframes ui-tw-sweep { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
@keyframes ui-tw-glow { from { opacity: 0.45; } to { opacity: 1; } }
@keyframes ui-tw-pulse { 50% { opacity: 0.35; } }
@keyframes ui-tw-spin { to { transform: rotate(360deg); } }
@media (pointer: coarse) {
  .ui-tw__chev { width: 24px; height: 28px; margin-left: -4px; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-tw *, .ui-tw *::before, .ui-tw *::after { animation: none !important; transition: none !important; }
}
`;
