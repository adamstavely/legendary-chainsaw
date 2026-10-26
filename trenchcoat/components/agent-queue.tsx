"use client";

/*
 * Agent Queue – the work waiting for your agents, and how fast it moves, in a single self-contained file.
 * Jobs flow from left to right: they wait in the queue, a free worker pulls the front one, runs it, and it lands in
 * Done – or in Failed, or back in the queue for another try. A white card on a soft gray tray, the queue in numbers on top.
 *   · the next jobs wait as small cards with their name and how long they've waited; the rest of the backlog is a heap
 *     of tinted squares that grows and shrinks – new jobs drop in at the back, a high-priority job glides past the others
 *   · every worker slot shows its running job as a growing bar: tinted by kind, a sheen sweeping along, a glowing front
 *   · a finished job flies into Done with a tick; a failed one flashes red and goes to Failed or slides back for a retry
 *   · when the provider rate-limits, the workers pause in amber with a countdown, and you watch the queue build up and drain
 *   · a live chart of the queue depth over the last minutes, with the backpressure line and the rate-limited stretches
 *   · hover a job for a small card – click it (or press Enter) to pin it, with Move to front and Cancel
 *   · Pause/Resume and a – N + stepper for the number of workers, when you pass the handlers
 * Narrow containers stack the flow: queue on top, workers below, Done and Failed under them. The styles are injected
 * below, so no extra files are needed. All motion is CSS transitions plus one requestAnimationFrame loop for the numbers
 * (it sleeps while nothing moves and while the queue is off-screen).
 *
 * Two looks, picked with the `look` prop (the default comes from the file: agent-queue.tsx is Standard,
 * agent-queue-clean.tsx is Clean). Clean is one quiet white card with 0.5px hairlines and Inter 400/500 instead of
 * the white card on a soft gray tray; the flow, the chart and the motion are the same.
 */
// Generated from src/components/agent-queue.tsx by scripts/build-lib.mjs – edit the source, not this file.

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ComponentPropsWithoutRef, type KeyboardEvent, type ReactNode, type Ref, type RefObject } from "react";

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-agq";

export type QueueJobKind = "llm" | "tool" | "agent" | "human";
export type QueueJobStatus = "queued" | "running" | "done" | "failed";
export type QueueJobPriority = "high" | "normal" | "low";

export type QueueJob = {
  id: string;
  name: string;
  kind: QueueJobKind;
  status: QueueJobStatus;
  /** High jumps ahead of the others, low waits behind them (default "normal") */
  priority?: QueueJobPriority;
  /** When it (last) entered the queue – ms, on the same clock as `now` */
  enqueuedAt: number;
  /** When a worker picked it up – clear it when the job goes back into the queue */
  startedAt?: number;
  /** When it finished or failed */
  endedAt?: number;
  /** The id of the worker that runs it */
  worker?: string;
  /** 0–1 while it runs – leave it out and it's estimated from `estimate` */
  progress?: number;
  /** How long it's expected to run, in ms */
  estimate?: number;
  /** 1 for the first try, 2 for the first retry … */
  attempt?: number;
  maxAttempts?: number;
  /** A few muted words – the source, the target, the model */
  detail?: string;
  /** A small mark, e.g. the tool's logo – defaults to a glyph for the kind */
  icon?: ReactNode;
  /** What went wrong – shown in its card */
  error?: string;
};

export type QueueWorker = {
  id: string;
  name: string;
  /** One muted line under the name, e.g. the model or "Worker 2" */
  detail?: string;
  /** A small mark, e.g. the model maker's logo – defaults to the initials */
  icon?: ReactNode;
};

export type QueueRateLimit = {
  from: number;
  until: number;
  /** e.g. "Token limit · 2M/min" – shown with the countdown */
  label?: string;
};

type AgentQueueOwnProps = {
  /** Visual style. Defaults to the file's look: Standard in agent-queue.tsx, Clean in agent-queue-clean.tsx */
  look?: Look;
  /** Waiting and running jobs, plus finished ones for as long as the chart should count them */
  jobs: QueueJob[];
  /** The worker slots – their number is the concurrency */
  workers: QueueWorker[];
  /** The clock in epoch ms – without it, the component keeps its own while there is work */
  now?: number;
  /** Stretches when the provider rate-limits – while one is active the workers show as paused */
  rateLimits?: QueueRateLimit[];
  /** The queue is paused – no new jobs start. Controlled when defined; otherwise the component keeps it, starting
   *  from `defaultPaused` */
  paused?: boolean;
  defaultPaused?: boolean;
  /** Shows a Pause/Resume button, and hears every change */
  onPausedChange?: (paused: boolean) => void;
  /** Shows a – N + stepper for the number of workers */
  onConcurrencyChange?: (workers: number) => void;
  minConcurrency?: number;
  maxConcurrency?: number;
  /** A depth that means trouble – drawn as a dashed line on the chart; above it Waiting turns amber */
  backpressure?: number;
  /** How far back the chart looks, in ms (default 2 minutes) */
  window?: number;
  /** Counts since the start, when `jobs` only holds the recent ones */
  totals?: { done?: number; failed?: number };
  /** The id of the job whose card is pinned. Controlled when defined (null = none); otherwise the component keeps it,
   *  starting from `defaultOpenId` */
  openId?: string | null;
  defaultOpenId?: string | null;
  onOpenChange?: (id: string | null, job?: QueueJob) => void;
  /** Shows "Move to front" in a waiting job's card */
  onPromote?: (job: QueueJob) => void;
  /** Shows "Cancel" in a waiting or running job's card */
  onCancel?: (job: QueueJob) => void;
  title?: string;
  /** The queue's name, muted next to the title */
  name?: string;
  className?: string;
  ref?: Ref<HTMLDivElement>;
};

export type AgentQueueProps = Omit<ComponentPropsWithoutRef<"div">, keyof AgentQueueOwnProps> & AgentQueueOwnProps;

/* ---------- Helpers ---------- */

const KIND: Record<QueueJobKind, string> = { llm: "LLM call", tool: "Tool call", agent: "Sub-agent", human: "Human review" };
const STATUS: Record<QueueJobStatus, string> = { queued: "Waiting", running: "Running", done: "Done", failed: "Failed" };
const RANK: Record<QueueJobPriority, number> = { high: 0, normal: 1, low: 2 };
/** Motion: how long a job takes to move (--tc-duration-slowest, 560ms, in the CSS), to land in a bin, and how long a fresh high-priority job waits before it jumps */
const LAND = 1100;
const FLASH = 1500;
const JUMP = 520;
/** A finished job shows its result in its slot for a moment before it flies – a failure a little longer */
const HOLD_DONE = 200;
const HOLD_FAIL = 520;
const MINUTE = 60_000;
/** Our own clock re-renders 10 times a second while a time shows tenths, else 4 – the chart glides every frame regardless */
const CLOCK_FINE = 100;
const CLOCK = 250;
/** Heights the chart's scale snaps to */
const SCALES = [4, 6, 8, 10, 12, 16, 20, 24, 30, 40, 50, 60, 80, 100, 120, 160, 200, 300, 400, 500, 600, 800, 1000, 1500, 2000];

const took = (ms: number) => {
  const v = Math.max(0, ms);
  if (v < 10_000) return `${(v / 1000).toFixed(1)}s`;
  const s = Math.round(v / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
};
const int = (n: number) => Math.round(n).toLocaleString("en-US");
const pct = (list: number[], p: number) => {
  if (!list.length) return 0;
  const s = [...list].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(p * s.length))];
};
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
const r2 = (n: number) => Math.round(n * 100) / 100;

/** A smooth line through the points that never overshoots (monotone cubic) – x in px, y in queue depth */
const smooth = (p: [number, number][]) => {
  const n = p.length;
  if (n < 2) return "";
  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = p[i + 1][0] - p[i][0] || 1e-6;
    m[i] = (p[i + 1][1] - p[i][1]) / dx[i];
  }
  const t: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]);
  t[n - 1] = m[n - 2];
  let d = `M${r2(p[0][0])},${r2(p[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += `C${r2(p[i][0] + h)},${r2(p[i][1] + t[i] * h)} ${r2(p[i + 1][0] - h)},${r2(p[i + 1][1] - t[i + 1] * h)} ${r2(p[i + 1][0])},${r2(p[i + 1][1])}`;
  }
  return d;
};

/* ---------- The flow's layout: every job, slot and bin is a box, computed from the width ---------- */

type Box = { x: number; y: number; w: number; h: number };
type Layout = {
  narrow: boolean;
  height: number;
  pad: number;
  heads: { queue: Box; workers: Box };
  chips: Box[];
  /** The backlog: a well with a grid of squares, spread so the padding is even on all sides */
  well: Box;
  grid: { x: number; y: number; cols: number; rows: number; step: number };
  slots: Box[];
  /** Where the running job sits inside a slot, relative to the slot */
  rail: { x: number; y: number; w: number; h: number };
  done: Box;
  failed: Box;
};
const SQ = 12;
const STEP = 16;
const CHIP = 28;
const SLOT = 40;
const GAP = 6;
const WELL = 10;
/** Room on the chart's left for the scale */
const GUTTER = 26;
const gridIn = (well: Box, rows: number) => {
  const cols = Math.max(2, Math.floor((well.w - 2 * WELL + STEP - SQ) / STEP));
  const h = rows * STEP - (STEP - SQ);
  return { x: well.x + WELL, y: well.y + (well.h - h) / 2, cols, rows, step: (well.w - 2 * WELL - SQ) / (cols - 1) };
};

const layoutFor = (W: number, n: number): Layout => {
  const narrow = W < 600;
  const count = Math.max(1, n);
  const slotsH = count * SLOT + (count - 1) * GAP;
  if (!narrow) {
    const pad = 16;
    const top = 14;
    const y0 = top + 16 + 10;
    const qw = clamp(Math.round(W * 0.26), 188, 236);
    const bw = 92;
    const g = 24;
    const content = Math.max(slotsH, 4 * SLOT + 3 * GAP);
    const qx = pad;
    const wx = pad + qw + g;
    const ww = W - 2 * pad - qw - bw - 2 * g;
    const bx = W - pad - bw;
    const chips = [0, 1, 2].map((i) => ({ x: qx, y: y0 + i * (CHIP + 4), w: qw, h: CHIP }));
    const gy = y0 + 3 * (CHIP + 4) + 2;
    const rows = Math.max(1, Math.floor((y0 + content - gy - 2 * WELL + STEP - SQ) / STEP));
    const well = { x: qx, y: gy, w: qw, h: y0 + content - gy };
    const iw = clamp(Math.round(ww * 0.4), 112, 164);
    const half = (content - 8) / 2;
    return {
      narrow,
      height: y0 + content + 18,
      pad,
      heads: { queue: { x: qx, y: top, w: qw, h: 16 }, workers: { x: wx, y: top, w: ww, h: 16 } },
      chips,
      well,
      grid: gridIn(well, rows),
      slots: Array.from({ length: n }, (_, i) => ({ x: wx, y: y0 + i * (SLOT + GAP), w: ww, h: SLOT })),
      rail: { x: iw, y: 6, w: ww - iw - 6, h: CHIP },
      done: { x: bx, y: y0, w: bw, h: half },
      failed: { x: bx, y: y0 + half + 8, w: bw, h: half },
    };
  }
  const pad = 12;
  const fw = W - 2 * pad;
  let y = 12;
  const queueHead = { x: pad, y, w: fw, h: 16 };
  y += 16 + 8;
  const chips = [0, 1].map((i) => ({ x: pad, y: y + i * (CHIP + 4), w: fw, h: CHIP }));
  const gy = y + 2 * (CHIP + 4) + 2;
  const well = { x: pad, y: gy, w: fw, h: 2 * STEP - (STEP - SQ) + 2 * WELL };
  y = gy + well.h;
  y += 18;
  const workersHead = { x: pad, y, w: fw, h: 16 };
  y += 16 + 8;
  const sy = y;
  y += slotsH;
  y += 12;
  // Phones: only the worker's mark – the rail gets the room
  const iw = 40;
  const half = (fw - 8) / 2;
  return {
    narrow,
    height: y + 40 + 12,
    pad,
    heads: { queue: queueHead, workers: workersHead },
    chips,
    well,
    grid: gridIn(well, 2),
    slots: Array.from({ length: n }, (_, i) => ({ x: pad, y: sy + i * (SLOT + GAP), w: fw, h: SLOT })),
    rail: { x: iw, y: 6, w: fw - iw - 6, h: CHIP },
    done: { x: pad, y, w: half, h: 40 },
    failed: { x: pad + half + 8, y, w: half, h: 40 },
  };
};

/* ---------- Icons ---------- */

/* Lucide (ISC, lucide.dev): gallery-vertical-end (the queue), pause, play, plus, minus, check, x, triangle-alert, rotate-cw, arrow-up and the kind glyphs sparkles, wrench, bot, user */
const S = (p: { children: ReactNode; size?: number; w?: number }) => (
  <svg width={p.size ?? 14} height={p.size ?? 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.w ?? 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {p.children}
  </svg>
);
const QueueGlyph = () => (
  <S size={16}>
    <path d="M7 2h10" />
    <path d="M5 6h14" />
    <rect width="18" height="12" x="3" y="10" rx="2" />
  </S>
);
const Pause = () => (
  <S>
    <rect x="14" y="3" width="5" height="18" rx="1" />
    <rect x="5" y="3" width="5" height="18" rx="1" />
  </S>
);
const Play = () => (
  <S>
    <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />
  </S>
);
const Plus = () => (
  <S>
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </S>
);
const Minus = () => (
  <S>
    <path d="M5 12h14" />
  </S>
);
const Tick = () => (
  <S size={12} w={2.4}>
    <path d="M20 6 9 17l-5-5" />
  </S>
);
const Cross = ({ size = 12, w = 2.4 }: { size?: number; w?: number }) => (
  <S size={size} w={w}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </S>
);
const Alert = () => (
  <S size={12} w={2}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
    <path d="M12 9v4" strokeWidth="2.2" />
    <path d="M12 17h.01" strokeWidth="2.6" />
  </S>
);
const Retry = () => (
  <S size={10} w={2.6}>
    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
  </S>
);
const Up = () => (
  <S size={10} w={2.8}>
    <path d="m5 12 7-7 7 7" />
    <path d="M12 19V5" />
  </S>
);
const KindGlyph = ({ kind }: { kind: QueueJobKind }) =>
  kind === "llm" ? (
    <S size={12} w={2}>
      <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
      <path d="M20 2v4" />
      <path d="M22 4h-4" />
      <circle cx="4" cy="20" r="2" />
    </S>
  ) : kind === "tool" ? (
    <S size={12} w={2}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z" />
    </S>
  ) : kind === "agent" ? (
    <S size={12} w={2}>
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </S>
  ) : (
    <S size={12} w={2}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </S>
  );

type Shape = "chip" | "square" | "bar" | "gone";
type Placed = { job: QueueJob; shape: Shape; box: Box; index?: number; flash: boolean; p?: number };
type Num = { el: HTMLElement | null; shown: number; target: number; fmt: (n: number) => string };

/* ---------- Memory: what each job was last time – so we can see it finish, fail, retry or arrive ---------- */

type Seen = { status: QueueJobStatus; attempt: number; first: number; fresh: boolean; worker?: string };
type Memory = {
  seen: Map<string, Seen>;
  gone: Map<string, number>;
  flash: Map<string, number>;
  limited: boolean;
  over: boolean;
  msg: string;
};
/** The real-time clock for motion – read only in effects, timers and the frame loop, never during render */
const realTime = () => performance.now();
const EMPTY_MEMORY: Memory = { seen: new Map(), gone: new Map(), flash: new Map(), limited: false, over: false, msg: "" };

/**
 * The memory after seeing `jobs` at time `at` – a pure function: it never changes `m`, and returns `m` itself when
 * nothing changed. Render calls it with the last clock reading (so whatever just happened is "now" and holds); the
 * commit calls it again with the real time and keeps the result.
 */
function remember(
  m: Memory,
  at: number,
  input: { jobs: QueueJob[]; mounted: boolean; limited: boolean; limitLeft: number; waiting: number; backpressure?: number },
): Memory {
  let seen = m.seen;
  let gone = m.gone;
  let flash = m.flash;
  let msg = m.msg;
  const own = { seen: false, gone: false, flash: false };
  const write = <K, V>(key: "seen" | "gone" | "flash", map: Map<K, V>) => {
    if (own[key]) return map;
    own[key] = true;
    return new Map(map);
  };
  for (const j of input.jobs) {
    const attempt = j.attempt ?? 1;
    const prev = seen.get(j.id);
    if (!prev) {
      seen = write("seen", seen);
      seen.set(j.id, { status: j.status, attempt, first: at, fresh: input.mounted, worker: j.worker });
      continue;
    }
    const worker = j.status === "running" && j.worker ? j.worker : prev.worker;
    if (prev.status === j.status && prev.attempt === attempt && worker === prev.worker) continue;
    seen = write("seen", seen);
    seen.set(j.id, { ...prev, status: j.status, attempt, worker });
    if (prev.status === j.status && prev.attempt === attempt) continue;
    const wasLive = prev.status === "running" || prev.status === "queued";
    if ((j.status === "done" || j.status === "failed") && wasLive) {
      gone = write("gone", gone);
      gone.set(j.id, at);
    }
    if (j.status === "failed" && wasLive) msg = `${j.name} failed${j.error ? `: ${j.error}` : ""}`;
    if (j.status === "queued" && prev.status === "running") {
      flash = write("flash", flash);
      flash.set(j.id, at);
      if (attempt > prev.attempt) msg = `${j.name} failed – retrying, attempt ${attempt}${j.maxAttempts ? ` of ${j.maxAttempts}` : ""}`;
    }
  }
  let limited = m.limited;
  if (input.limited !== limited) {
    if (input.mounted) msg = input.limited ? `Rate limited – workers paused for ${input.limitLeft} seconds` : "Rate limit lifted – workers resumed";
    limited = input.limited;
  }
  let over = m.over;
  const nowOver = input.backpressure !== undefined && input.waiting > input.backpressure;
  if (nowOver !== over) {
    if (nowOver && input.mounted) msg = `${input.waiting} jobs waiting – above the backpressure line of ${input.backpressure}`;
    over = nowOver;
  }
  for (const [id, t] of gone) if (at - t > LAND) (gone = write("gone", gone)).delete(id);
  for (const [id, t] of flash) if (at - t > FLASH) (flash = write("flash", flash)).delete(id);
  if (seen.size > input.jobs.length + 64) {
    const ids = new Set(input.jobs.map((j) => j.id));
    seen = write("seen", seen);
    for (const id of [...seen.keys()]) if (!ids.has(id)) seen.delete(id);
  }
  if (!own.seen && !own.gone && !own.flash && limited === m.limited && over === m.over && msg === m.msg) return m;
  return { seen, gone, flash, limited, over, msg };
}

/* ---------- What a job says at a given moment – rendered at `now`, and repainted in between by the frame loop ---------- */

const progressOf = (j: QueueJob, now: number) =>
  j.status === "done" || j.status === "failed" ? 1 : j.status !== "running" ? 0 : clamp(j.progress ?? (j.startedAt !== undefined && j.estimate ? (now - j.startedAt) / j.estimate : 0.5), 0.015, 1);
const metaOf = (j: QueueJob, now: number, limited: boolean) =>
  j.status === "queued" ? took(now - j.enqueuedAt) : j.status === "running" ? (limited ? "Paused" : took(now - (j.startedAt ?? now))) : j.status === "done" ? "Done" : "Failed";
const describeJob = (p: Placed, now: number, limited: boolean, waiting: number) => {
  const j = p.job;
  // The name starts with the text the job shows (name, attempt, time), so speech input can say what it sees (2.5.3)
  const shown = [j.name, (j.attempt ?? 1) > 1 ? String(j.attempt) : "", metaOf(j, now, limited)].filter(Boolean).join(" ");
  const bits = [shown, KIND[j.kind]];
  if (j.status === "queued") bits.push(`waiting ${took(now - j.enqueuedAt)}`, `position ${(p.index ?? 0) + 1} of ${waiting}`);
  if (j.status === "running") bits.push(limited ? "paused by the rate limit" : `running ${took(now - (j.startedAt ?? now))}, ${Math.round(progressOf(j, now) * 100)}%`);
  if (j.priority === "high") bits.push("high priority");
  if (j.priority === "low") bits.push("low priority");
  if ((j.attempt ?? 1) > 1) bits.push(`attempt ${j.attempt}${j.maxAttempts ? ` of ${j.maxAttempts}` : ""}`);
  return bits.join(", ");
};
const cardRows = (p: Placed, now: number, waiting: number, workers: QueueWorker[]): [string, string][] => {
  const j = p.job;
  const attempt = j.attempt ?? 1;
  const worker = j.worker ? workers.find((w) => w.id === j.worker) : undefined;
  return [
    j.status === "queued" ? ["Waiting", took(now - j.enqueuedAt)] : ["Waited", took((j.startedAt ?? now) - j.enqueuedAt)],
    ...(j.status === "running" ? [["Running", took(now - (j.startedAt ?? now))] as [string, string]] : []),
    ...(j.status === "queued" ? [["Position", `${(p.index ?? 0) + 1} of ${waiting}`] as [string, string]] : []),
    ...(j.status === "running" && worker ? [["Worker", worker.name] as [string, string]] : []),
    ["Priority", j.priority === "high" ? "High" : j.priority === "low" ? "Low" : "Normal"],
    ["Attempt", `${attempt}${j.maxAttempts ? ` of ${j.maxAttempts}` : ""}`],
  ];
};
/** p95 of how long jobs waited: the ones that started in the last minute, and the ones still waiting */
const waitP95 = (jobs: QueueJob[], queued: QueueJob[], now: number) =>
  pct(
    [...jobs.filter((j) => j.startedAt !== undefined && j.status !== "queued" && j.startedAt > now - MINUTE).map((j) => j.startedAt! - j.enqueuedAt), ...queued.map((j) => now - j.enqueuedAt)],
    0.95,
  );
/** Times under 10s show tenths, so they need the finer clock */
const needsTenths = (queued: QueueJob[], running: QueueJob[], now: number) =>
  queued.some((j) => now - j.enqueuedAt < 10_000) || running.some((j) => now - (j.startedAt ?? now) < 10_000);

/* ---------- Where every job is: waiting in order, running in its slot, landing in a bin ---------- */

function placeJobs(jobs: QueueJob[], queued: QueueJob[], running: QueueJob[], workers: QueueWorker[], L: Layout, memory: Memory, real: number) {
  const rankOf = (j: QueueJob) => {
    const r = RANK[j.priority ?? "normal"];
    const s = memory.seen.get(j.id);
    // A fresh high-priority job lands at the back first, then glides past the others
    return r === 0 && s?.fresh && real - s.first < JUMP ? 1 : r;
  };
  const order = [...queued].sort((a, b) => rankOf(a) - rankOf(b) || a.enqueuedAt - b.enqueuedAt || (a.id < b.id ? -1 : 1));
  const K = L.chips.length;
  const capFull = L.grid.cols * L.grid.rows;
  const overflow = order.length > K + capFull;
  const cap = overflow ? capFull - 3 : capFull;
  const hiddenCount = Math.max(0, order.length - K - cap);
  const slotOf = new Map(workers.map((w, i) => [w.id, i]));

  const placed: Placed[] = [];
  const barIn = (slot: Box): Box => ({ x: slot.x + L.rail.x, y: slot.y + L.rail.y, w: L.rail.w, h: L.rail.h });
  // A job that just failed or finished stays in its slot for a beat – red or green – before it moves on
  const heldSlot = (j: QueueJob, since: number | undefined, hold: number) => {
    if (since === undefined || real - since >= hold) return undefined;
    const w = memory.seen.get(j.id)?.worker ?? j.worker;
    const s = w !== undefined ? slotOf.get(w) : undefined;
    return s === undefined ? undefined : L.slots[s];
  };
  let queuedIndex = 0;
  order.forEach((j) => {
    const flash = memory.flash.has(j.id);
    const held = heldSlot(j, memory.flash.get(j.id), HOLD_FAIL);
    if (held) {
      placed.push({ job: j, shape: "bar", box: barIn(held), flash: true, p: 1 });
      return;
    }
    const i = queuedIndex++;
    if (i < K) placed.push({ job: j, shape: "chip", box: L.chips[i], index: i, flash });
    else if (i < K + cap) {
      const g = i - K;
      placed.push({ job: j, shape: "square", box: { x: L.grid.x + (g % L.grid.cols) * L.grid.step, y: L.grid.y + Math.floor(g / L.grid.cols) * STEP, w: SQ, h: SQ }, index: i, flash });
    }
  });
  for (const j of running) {
    const s = j.worker !== undefined ? slotOf.get(j.worker) : undefined;
    if (s === undefined) continue;
    placed.push({ job: j, shape: "bar", box: barIn(L.slots[s]), flash: false });
  }
  for (const j of jobs) {
    if (!memory.gone.has(j.id) || (j.status !== "done" && j.status !== "failed")) continue;
    const held = heldSlot(j, memory.gone.get(j.id), j.status === "done" ? HOLD_DONE : HOLD_FAIL);
    if (held) {
      placed.push({ job: j, shape: "bar", box: barIn(held), flash: false, p: 1 });
      continue;
    }
    const bin = j.status === "done" ? L.done : L.failed;
    placed.push({ job: j, shape: "gone", box: { x: bin.x + 17, y: bin.y + (L.narrow ? 15 : 17), w: 10, h: 10 }, flash: false });
  }
  // Stable DOM order, so moving jobs keep their element (and their focus)
  placed.sort((a, b) => (a.job.id < b.job.id ? -1 : 1));
  return { order, placed, K, cap, capFull, overflow, hiddenCount, slotOf };
}

/* ---------- The chart: queue depth over the window, sampled at fixed times so the line glides ---------- */

function chartModel(jobs: QueueJob[], waitingNow: number, rateLimits: QueueRateLimit[], span: number, plotW: number, backpressure: number | undefined) {
  const stepT = span / 96;
  const spans = jobs.map((j) => [j.enqueuedAt, j.status === "queued" ? Infinity : (j.startedAt ?? j.endedAt ?? Infinity)] as const);
  const depthAt = (t: number) => {
    let d = 0;
    for (const [a, b] of spans) if (a <= t && t < b) d++;
    return d;
  };
  // The chart at any moment – rendered at `now`, and redrawn in between by the frame loop while our own clock runs
  return (now: number) => {
    const t0 = now - span;
    const samples: [number, number][] = [[t0, depthAt(t0)]];
    for (let t = Math.ceil(t0 / stepT) * stepT; t < now - stepT * 0.25; t += stepT) samples.push([t, depthAt(t)]);
    samples.push([now, waitingNow]);
    const xOf = (t: number) => ((t - t0) / span) * plotW;
    const pts = samples.map(([t, d]) => [xOf(t), d] as [number, number]);
    const line = smooth(pts);
    const area = line ? `${line}L${r2(plotW)},0L0,0Z` : "";
    const peak = Math.max(0, ...samples.map((s) => s[1]));
    const avg = samples.reduce((s, p) => s + p[1], 0) / samples.length;
    const want = Math.max(peak * 1.15, (backpressure ?? 0) * 1.2, 4);
    const ymax = SCALES.find((v) => v >= want) ?? Math.ceil(want / 500) * 500;
    const bands = rateLimits.filter((l) => l.until > t0 && l.from < now).map((l) => ({ l, x1: xOf(Math.max(l.from, t0)), x2: xOf(Math.min(l.until, now)) }));
    return { line, area, peak, avg, ymax, bands };
  };
}
type Chart = ReturnType<ReturnType<typeof chartModel>>;

/** The next clock reading that changes what render draws: a rate limit's edge, or a finished job leaving the throughput minute */
function nextChangeAt(rateLimits: QueueRateLimit[], jobs: QueueJob[], now: number) {
  let next = Infinity;
  for (const l of rateLimits) for (const t of [l.from, l.until]) if (t > now) next = Math.min(next, t);
  for (const j of jobs) {
    if (j.status !== "done" || j.endedAt === undefined) continue;
    const t = j.endedAt > now ? j.endedAt : j.endedAt + MINUTE;
    if (t > now) next = Math.min(next, t);
  }
  return next;
}

type TextScene = {
  live2: Placed[];
  jobEls: Map<string, HTMLButtonElement>;
  limited: boolean;
  waiting: number;
  card?: Placed;
  popEl: HTMLElement | null;
  rootEl: HTMLElement | null;
  activeLimit?: QueueRateLimit;
  workers: QueueWorker[];
  nums: Map<string, Num>;
  jobs: QueueJob[];
  queued: QueueJob[];
};

/** Between renders: every time, progress bar, the open card's rows, the countdown and the p95 move on in place */
function paintJobText(clock: number, { live2, jobEls, limited, waiting, card, popEl, rootEl, activeLimit, workers, nums, jobs, queued }: TextScene) {
  for (const p of live2) {
    const el = jobEls.get(p.job.id);
    if (!el) continue;
    el.setAttribute("aria-label", describeJob(p, clock, limited, waiting));
    if (p.p === undefined && p.job.status === "running") el.style.setProperty("--p", String(progressOf(p.job, clock)));
    const meta = el.querySelector(".ui-agq__job-meta");
    const text = metaOf(p.job, clock, limited);
    if (meta && meta.textContent !== text) meta.textContent = text;
  }
  if (card && popEl) {
    const rows = cardRows(card, clock, waiting, workers);
    popEl.querySelectorAll(".ui-agq__pop-stats dd").forEach((dd, i) => {
      if (rows[i] && dd.textContent !== rows[i][1]) dd.textContent = rows[i][1];
    });
  }
  const countdown = rootEl?.querySelector("[data-countdown]");
  if (countdown && activeLimit) countdown.textContent = `${Math.max(0, Math.ceil((activeLimit.until - clock) / 1000))}s`;
  const p95Num = nums.get("p95");
  if (p95Num && !Number.isNaN(p95Num.shown)) p95Num.target = waitP95(jobs, queued, clock);
}

/* ---------- Hooks ---------- */

/** The card's width, kept by a ResizeObserver */
function useWidth(cardRef: { current: HTMLElement | null }) {
  const [W, setW] = useState(0);
  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    setW(el.clientWidth);
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, [cardRef]);
  return W || 812;
}

type MemoryInput = Parameters<typeof remember>[2];

/**
 * What each job was last time – kept after each commit, never written during render – plus the real-time reading
 * landings, flashes and jumps are drawn from, and the announcement of the last thing that happened
 */
function useJobMemory(input: Omit<MemoryInput, "mounted">, queued: QueueJob[]) {
  // The real-time clock for landings, flashes and jumps: a reading taken after commits and by the timers below
  const [real, setReal] = useState(0);
  const mem = useRef<Memory>(EMPTY_MEMORY);
  const mounted = useRef(false);
  const full = { ...input, mounted: mounted.current };
  // What render shows: the last memory plus whatever just changed, as of the last clock reading
  const memory = remember(mem.current, real, full);
  useLayoutEffect(() => {
    mem.current = remember(mem.current, realTime(), full);
    mounted.current = true;
  });

  // Landings, red flashes and priority jumps run on real time. Each one is due at a known moment: render again
  // right then (with a fresh reading), not on a poll
  const pending = memory.gone.size > 0 || memory.flash.size > 0 || queued.some((j) => j.priority === "high" && real - (memory.seen.get(j.id)?.first ?? 0) < JUMP);
  useEffect(() => {
    if (!pending) return;
    const m = mem.current;
    const due: number[] = [];
    // A landed job is invisible in its bin: it leaves the DOM with the next render, it doesn't need one of its own
    for (const t of m.gone.values()) due.push(t + HOLD_DONE, t + HOLD_FAIL);
    for (const t of m.flash.values()) due.push(t + HOLD_FAIL, t + FLASH);
    for (const j of queued) if (j.priority === "high") due.push((m.seen.get(j.id)?.first ?? 0) + JUMP);
    const at = realTime();
    // The next moment after the reading this render used – right away if it has already passed
    const next = Math.min(...due.filter((t) => t >= real));
    if (!Number.isFinite(next)) return;
    const t = window.setTimeout(() => setReal(realTime()), Math.max(0, next - at) + 1);
    return () => window.clearTimeout(t);
  });
  // The last thing that happened, for the live region – part of the memory, so it needs no render of its own
  return { memory, real, setReal, announce: memory.msg };
}

/**
 * Numbers that tick: render only collects the targets; they are handed to the frame loop after the commit, once the
 * clock is known (a number first shows its value right away, and eases from there on)
 */
function useTickingNumbers(clockReady: boolean) {
  const nums = useRef(new Map<string, Num>());
  const targets: [string, number, (n: number) => string][] = [];
  const num = (key: string, value: number, fmt: (n: number) => string) => {
    targets.push([key, value, fmt]);
    return (
      <span
        className="ui-agq__num"
        ref={(el) => {
          const rec = nums.current.get(key);
          if (rec) rec.el = el;
          else nums.current.set(key, { el, shown: NaN, target: NaN, fmt });
        }}
      />
    );
  };
  useLayoutEffect(() => {
    if (!clockReady) return;
    for (const [key, value, fmt] of targets) {
      const rec = nums.current.get(key);
      if (!rec) continue;
      if (Number.isNaN(rec.shown)) rec.shown = value;
      rec.target = value;
      rec.fmt = fmt;
      if (rec.el && !rec.el.textContent) rec.el.textContent = fmt(rec.shown);
    }
  });
  return { nums, num };
}

type LoopState = {
  needClock: boolean;
  ymax: number;
  /** The next clock reading that changes what render draws (a rate limit edge, a job leaving the throughput minute) */
  nextAt: number;
  fine: (clock: number) => boolean;
  /** Repaints what only moved – the chart every frame, the times when `text` – and says false when the chart needs a
   *  render (its scale or bands changed) */
  paint: (clock: number, text: boolean) => boolean;
};

/**
 * One frame loop for all motion: it eases the numbers and the chart's scale, and – while our own clock runs –
 * repaints times, progress and the chart in place, rendering only when something discrete is due. It sleeps while
 * nothing moves and while the queue is off-screen or the tab hidden.
 */
function useFrameLoop(rootRef: { current: HTMLElement | null }, nums: { current: Map<string, Num> }, state: LoopState, setTick: (t: number) => void, setReal: (t: number) => void) {
  const live = useRef(state);
  live.current = state;
  const wake = useRef<() => void>(() => {});
  useEffect(() => {
    let raf = 0;
    let visible = true;
    let last = realTime();
    let lastClock = 0;
    // A render asked for and not yet done: don't ask again every frame
    let asked: LoopState | null = null;
    let shownMax = live.current.ymax;
    rootRef.current?.style.setProperty("--tc-agent-queue-ymax", String(shownMax));
    const frame = (t: number) => {
      raf = 0;
      const dt = Math.min(64, t - last);
      last = t;
      const instant = reducedMotion();
      const k = 1 - Math.exp(-dt / 110);
      let busy = false;
      const L = live.current;
      if (L.needClock) {
        busy = true;
        const clock = Date.now();
        const render = () => {
          if (asked === L) return;
          asked = L;
          setTick(clock);
          setReal(t);
        };
        const text = clock - lastClock >= (L.fine(clock) ? CLOCK_FINE : CLOCK);
        if (text) lastClock = clock;
        if (clock >= L.nextAt || !L.paint(clock, text)) render();
      }
      for (const n of nums.current.values()) {
        if (n.shown === n.target) continue;
        const d = n.target - n.shown;
        n.shown = instant || Math.abs(d) < 0.02 * Math.max(1, Math.abs(n.target)) * 0.05 + 0.004 ? n.target : n.shown + d * k;
        if (n.el) n.el.textContent = n.fmt(n.shown);
        busy = true;
      }
      const goal = L.ymax;
      if (shownMax !== goal) {
        const d = goal - shownMax;
        shownMax = instant || Math.abs(d) < 0.01 ? goal : shownMax + d * (1 - Math.exp(-dt / 160));
        rootRef.current?.style.setProperty("--tc-agent-queue-ymax", String(shownMax));
        busy = true;
      }
      if (busy && visible && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (raf || !visible || document.hidden) return;
      last = realTime();
      raf = requestAnimationFrame(frame);
    };
    wake.current = start;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
    });
    if (rootRef.current) io.observe(rootRef.current);
    document.addEventListener("visibilitychange", start);
    start();
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", start);
    };
  }, [rootRef, nums, setTick, setReal]);
  useEffect(() => wake.current());
  useLayoutEffect(() => {
    rootRef.current?.style.setProperty("--tc-agent-queue-ymax", String(live.current.ymax));
  }, [rootRef]);
}

/* ---------- Pieces ---------- */

/** A box of the flow's layout, placed */
const boxStyle = (b: Box): CSSProperties => ({ translate: `${b.x}px ${b.y}px`, width: b.w, height: b.h });

type JobProps = {
  p: Placed;
  now: number;
  limited: boolean;
  waiting: number;
  enterDelay: number;
  open: boolean;
  tabbable: boolean;
  register: (id: string, el: HTMLButtonElement | null) => void;
  onHover: (id: string | null) => void;
  onActive: (id: string) => void;
  onToggle: (id: string) => void;
  onKey: (e: KeyboardEvent<HTMLButtonElement>, j: QueueJob) => void;
};

function JobButton({ p, now, limited, waiting, enterDelay, open, tabbable, register, onHover, onActive, onToggle, onKey }: JobProps) {
  const j = p.job;
  const gone = p.shape === "gone";
  const attempt = j.attempt ?? 1;
  const halted = j.status === "running" && limited;
  return (
    <button
      ref={(el) => register(j.id, el)}
      type="button"
      className="ui-agq__job"
      data-shape={p.shape}
      data-kind={j.kind}
      data-status={j.status}
      data-flash={p.flash ? "" : undefined}
      data-halted={halted ? "" : undefined}
      data-priority={j.priority && j.priority !== "normal" ? j.priority : undefined}
      data-open={open ? "" : undefined}
      tabIndex={!gone && tabbable ? 0 : -1}
      aria-hidden={gone || undefined}
      aria-label={describeJob(p, now, limited, waiting)}
      aria-haspopup="dialog"
      aria-expanded={open}
      style={{ translate: `${p.box.x}px ${p.box.y}px`, width: p.box.w, height: p.box.h, "--p": p.p ?? progressOf(j, now), animationDelay: `${enterDelay}ms` } as CSSProperties}
      onPointerEnter={() => !gone && onHover(j.id)}
      onPointerLeave={() => onHover(null)}
      // Focus opens the same peek as hovering (1.4.13); leaving closes it
      onFocus={() => {
        onActive(j.id);
        if (!gone) onHover(j.id);
      }}
      onBlur={() => onHover(null)}
      onClick={() => {
        if (gone) return;
        onActive(j.id);
        onToggle(j.id);
      }}
      onKeyDown={(e) => onKey(e, j)}
    >
      <span className="ui-agq__fill" aria-hidden="true" />
      <span className="ui-agq__job-in" aria-hidden="true">
        <span className="ui-agq__job-icon" data-logo={j.icon ? "" : undefined}>
          {j.icon ?? <KindGlyph kind={j.kind} />}
        </span>
        <span className="ui-agq__job-name">{j.name}</span>{" "}
        {/* The spaces keep the visible text "name attempt time", matching the start of the accessible name */}
        {j.priority === "high" && (
          <span className="ui-agq__badge" data-kind="high" title="High priority">
            <Up />
          </span>
        )}
        {attempt > 1 && (
          <span className="ui-agq__badge" data-kind="retry" title={`Attempt ${attempt}`}>
            <Retry />
            {attempt}
          </span>
        )}{" "}
        <span className="ui-agq__job-meta">{metaOf(j, now, limited)}</span>
      </span>
    </button>
  );
}

type CardProps = {
  p: Placed;
  now: number;
  pinned: boolean;
  limited: boolean;
  waiting: number;
  workers: QueueWorker[];
  x: number;
  y: number;
  w: number;
  popRef: Ref<HTMLDivElement>;
  onClose: (refocus: boolean) => void;
  /** The pointer is on the peek: it stays while hovered */
  onHold: (held: boolean) => void;
  onPromote?: (job: QueueJob) => void;
  onCancel?: (job: QueueJob) => void;
};

/** A job's card: on hover a peek, on click pinned with actions */
function JobCard({ p, now, pinned, limited, waiting, workers, x, y, w, popRef, onClose, onHold, onPromote, onCancel }: CardProps) {
  const j = p.job;
  const halted = j.status === "running" && limited;
  const pill = halted ? "Paused" : STATUS[j.status];
  return (
    <div
      ref={popRef}
      className="ui-agq__pop"
      role={pinned ? "dialog" : "tooltip"}
      aria-label={`${j.name} details`}
      data-pinned={pinned ? "" : undefined}
      data-kind={j.kind}
      data-status={halted ? "halted" : j.status}
      style={{ translate: `${x}px ${y}px`, width: w }}
      onPointerEnter={() => onHold(true)}
      onPointerLeave={() => onHold(false)}
      onKeyDown={(e) => {
        if (e.key !== "Escape") return;
        e.stopPropagation();
        onClose(true);
      }}
    >
      <div className="ui-agq__pop-head">
        <span className="ui-agq__pop-icon" data-logo={j.icon ? "" : undefined}>
          {j.icon ?? <KindGlyph kind={j.kind} />}
        </span>
        <span className="ui-agq__pop-who">
          <span className="ui-agq__pop-name">{j.name}</span>
          <span className="ui-agq__pop-kind">
            {KIND[j.kind]}
            {j.detail ? ` · ${j.detail}` : ""}
          </span>
        </span>
        <span className="ui-agq__pill" data-status={halted ? "halted" : j.status}>
          {pill}
        </span>
        {pinned && (
          <button type="button" className="ui-agq__close" aria-label="Close details" onClick={() => onClose(true)}>
            <Cross size={14} w={1.8} />
          </button>
        )}
      </div>
      <dl className="ui-agq__pop-stats">
        {cardRows(p, now, waiting, workers).map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      {j.error && (
        <p className="ui-agq__pop-error">
          <Alert />
          {j.error}
        </p>
      )}
      {pinned && (onPromote || onCancel) && (j.status === "queued" || j.status === "running") && (
        <div className="ui-agq__pop-actions">
          {onPromote && j.status === "queued" && (p.index ?? 0) > 0 && (
            <button type="button" className="ui-agq__btn" onClick={() => onPromote(j)}>
              <Up />
              Move to front
            </button>
          )}
          {onCancel && (
            <button
              type="button"
              className="ui-agq__btn"
              data-kind="danger"
              onClick={() => {
                // Focus goes back to the job first; if the job then leaves, the rescue moves it on (2.4.3)
                onClose(true);
                onCancel(j);
              }}
            >
              <Cross size={10} />
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}

type HeaderProps = {
  title: string;
  name?: string;
  state: "limited" | "paused" | "live" | "idle";
  left: number;
  paused: boolean;
  onTogglePause?: () => void;
  workers: number;
  minConcurrency: number;
  maxConcurrency: number;
  onConcurrencyChange?: (workers: number) => void;
};

function QueueHeader({ title, name, state, left, paused, onTogglePause, workers, minConcurrency, maxConcurrency, onConcurrencyChange }: HeaderProps) {
  const pillText = state === "paused" ? "Paused" : state === "live" ? "Live" : "Idle";
  const canLess = workers > minConcurrency;
  const canMore = workers < maxConcurrency;
  return (
    <header className="ui-agq__head">
      <span className="ui-agq__mark">
        <QueueGlyph />
      </span>
      <span className="ui-agq__title">{title}</span>
      {name && <span className="ui-agq__name">{name}</span>}
      {/* Not a live region: the countdown ticks every second; the start and end of a limit are announced once below */}
      <span className="ui-agq__pill" data-status={state}>
        {(state === "live" || state === "limited") && <span className="ui-agq__pulse" aria-hidden="true" />}
        {state === "limited" ? (
          <>
            Rate limited · <span className="ui-agq__num" data-countdown="">{`${left}s`}</span>
          </>
        ) : (
          pillText
        )}
      </span>
      <span className="ui-agq__tools">
        {onTogglePause && (
          <button type="button" className="ui-agq__btn" aria-pressed={paused} aria-label={paused ? "Resume the queue" : "Pause the queue"} onClick={onTogglePause}>
            {paused ? <Play /> : <Pause />}
            <span className="ui-agq__btn-text">{paused ? "Resume" : "Pause"}</span>
          </button>
        )}
        {onConcurrencyChange && (
          <span className="ui-agq__stepper" role="group" aria-label="Workers">
            <button type="button" aria-label="One worker less" disabled={!canLess} onClick={() => canLess && onConcurrencyChange(workers - 1)}>
              <Minus />
            </button>
            <output className="ui-agq__stepper-value" aria-live="polite" aria-label={`${workers} workers`}>
              {workers}
            </output>
            <button type="button" aria-label="One worker more" disabled={!canMore} onClick={() => canMore && onConcurrencyChange(workers + 1)}>
              <Plus />
            </button>
          </span>
        )}
      </span>
    </header>
  );
}

type ChartProps = {
  chart: Chart;
  summary: string;
  spanLabel: string;
  plotW: number;
  plotH: number;
  backpressure?: number;
  waiting: number;
  gradId: string;
  svgRef: Ref<SVGSVGElement>;
};

function QueueChart({ chart, summary, spanLabel, plotW, plotH, backpressure, waiting, gradId, svgRef }: ChartProps) {
  const { line, area, ymax, bands } = chart;
  return (
    <div className="ui-agq__chart">
      <div className="ui-agq__chart-head">
        <span className="ui-agq__chart-title">Queue depth</span>
      </div>
      <div className="ui-agq__plot" role="img" aria-label={summary} style={{ height: plotH }}>
        {[0, ymax].map((v) => (
          <span key={v} className="ui-agq__grid" data-zero={v === 0 ? "" : undefined} style={{ "--v": v } as CSSProperties} aria-hidden="true">
            {(backpressure === undefined || Math.abs(v - backpressure) > ymax * 0.1) && <span>{int(v)}</span>}
          </span>
        ))}
        <svg ref={svgRef} className="ui-agq__svg" width={plotW} height={plotH} viewBox={`0 0 ${plotW} ${plotH}`} aria-hidden="true">
          <defs>
            <linearGradient id={gradId} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" className="ui-agq__stop" data-at="top" />
              <stop offset="1" className="ui-agq__stop" data-at="bottom" />
            </linearGradient>
          </defs>
          {bands.map(({ l, x1, x2 }) => (
            <g key={l.from} className="ui-agq__band">
              <rect x={x1} y={0} width={Math.max(1, x2 - x1)} height={plotH} />
            </g>
          ))}
          <g className="ui-agq__scaled" style={{ "--h": plotH } as CSSProperties}>
            <path className="ui-agq__area" d={area} fill={`url(#${gradId})`} />
            <path className="ui-agq__line" d={line} />
            {backpressure !== undefined && <line className="ui-agq__bp" x1={0} x2={plotW} y1={backpressure} y2={backpressure} />}
          </g>
        </svg>
        {backpressure !== undefined && (
          <span className="ui-agq__bp-label" style={{ "--v": backpressure } as CSSProperties} aria-hidden="true">
            {backpressure}
          </span>
        )}
        <span className="ui-agq__dot" style={{ "--v": waiting } as CSSProperties} aria-hidden="true" />
      </div>
      <div className="ui-agq__axis" aria-hidden="true">
        <span>{spanLabel} ago</span>
        <span>now</span>
      </div>
    </div>
  );
}

/** Which job's card shows: the pinned one (`openId`), else the hovered one – and the card's height, to flip it above */
function useJobCard(
  placed: Placed[],
  jobs: QueueJob[],
  openId: string | null | undefined,
  defaultOpenId: string | null,
  onOpenChange: ((id: string | null, job?: QueueJob) => void) | undefined,
  popRef: { current: HTMLDivElement | null },
  jobEls: { current: Map<string, HTMLButtonElement> },
) {
  const [wantOpen, setOpen] = useControllable<string | null>(
    openId,
    defaultOpenId,
    onOpenChange && ((id) => onOpenChange(id, id ? jobs.find((j) => j.id === id) : undefined)),
    "openId",
  );
  const [hover, setHover] = useState<string | null>(null);
  const live2 = placed.filter((p) => p.shape !== "gone");
  const openPlaced = wantOpen ? live2.find((p) => p.job.id === wantOpen) : undefined;
  const hoverPlaced = !openPlaced && hover ? live2.find((p) => p.job.id === hover) : undefined;
  const cardOf = openPlaced ?? hoverPlaced;
  // A pinned job that finished or left closes its card – once: a parent that keeps `openId` isn't asked again every render
  const openGone = !!wantOpen && !openPlaced;
  useEffect(() => {
    if (openGone) setOpen(null);
  }, [openGone, wantOpen]); // eslint-disable-line react-hooks/exhaustive-deps -- setOpen is a fresh closure each render; it only matters when the card's job goes
  useEffect(() => {
    if (!openPlaced) return;
    const away = (e: PointerEvent) => {
      const t = e.target as Node;
      if (popRef.current?.contains(t) || [...jobEls.current.values()].some((el) => el.contains(t))) return;
      setOpen(null);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  });

  // The card's height, to flip it above its job near the bottom: measured when a card opens, then on resize only
  const [popH, setPopH] = useState(120);
  const cardId = cardOf?.job.id;
  useLayoutEffect(() => {
    const el = popRef.current;
    if (!el) return;
    const measure = () => {
      const h = el.offsetHeight;
      if (h) setPopH((was) => (Math.abs(h - was) > 1 ? h : was));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [cardId, popRef]);
  return { wantOpen, setOpen, setHover, live2, openPlaced, cardOf, popH };
}

/** One job in the tab order; arrows walk through the busy slots, then the queue */
function useJobKeys(
  runningAll: QueueJob[],
  waiting: QueueJob[],
  slotOf: Map<string, number>,
  jobEls: { current: Map<string, HTMLButtonElement> },
  wantOpen: string | null,
  setOpen: (id: string | null) => void,
) {
  const walkOrder = [
    ...runningAll.filter((j) => j.worker !== undefined && slotOf.has(j.worker)).sort((a, b) => slotOf.get(a.worker!)! - slotOf.get(b.worker!)!),
    ...waiting,
  ];
  const [active, setActive] = useState<string | null>(null);
  const activeId = active && walkOrder.some((j) => j.id === active) ? active : walkOrder[0]?.id;
  const focusJob = (j?: QueueJob) => {
    if (!j) return;
    setActive(j.id);
    jobEls.current.get(j.id)?.focus();
  };
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, j: QueueJob) => {
    const i = walkOrder.findIndex((x) => x.id === j.id);
    const keys: Record<string, () => void> = {
      ArrowDown: () => focusJob(walkOrder[i + 1]),
      ArrowRight: () => focusJob(walkOrder[i + 1]),
      ArrowUp: () => focusJob(walkOrder[i - 1]),
      ArrowLeft: () => focusJob(walkOrder[i - 1]),
      Home: () => focusJob(walkOrder[0]),
      End: () => focusJob(walkOrder[walkOrder.length - 1]),
      Escape: () => wantOpen && setOpen(null),
    };
    if (!keys[e.key]) return;
    e.preventDefault();
    keys[e.key]();
  };
  return { activeId, setActive, onKey };
}

function WorkerSlots({ workers, L, running, limited, paused }: { workers: QueueWorker[]; L: Layout; running: QueueJob[]; limited: boolean; paused: boolean }) {
  return workers.map((w, i) => {
    const busy = running.some((j) => j.worker === w.id);
    return (
      <div key={w.id} className="ui-agq__slot" data-busy={busy ? "" : undefined} data-limited={limited ? "" : undefined} style={boxStyle(L.slots[i])}>
        <span className="ui-agq__who" style={{ width: L.rail.x - 16 }}>
          <span className="ui-agq__logo" data-logo={w.icon ? "" : undefined}>
            {w.icon ?? initials(w.name)}
          </span>
          <span className="ui-agq__who-text">
            <span className="ui-agq__who-name">{w.name}</span>
          </span>
        </span>
        <span className="ui-agq__rail" style={{ left: L.rail.x, top: L.rail.y, width: L.rail.w, height: L.rail.h }}>
          {!busy && <span>{limited || paused ? "Paused" : "Idle"}</span>}
        </span>
      </div>
    );
  });
}

function Bins({ L, done, failed, doneCount, failedCount }: { L: Layout; done: ReactNode; failed: ReactNode; doneCount: number; failedCount: number }) {
  return (["done", "failed"] as const).map((k) => (
    <div key={k} className="ui-agq__bin" data-kind={k} style={boxStyle(k === "done" ? L.done : L.failed)}>
      <span className="ui-agq__bin-icon">{k === "done" ? <Tick /> : <Cross />}</span>
      <span className="ui-agq__bin-label">{k === "done" ? "Done" : "Failed"}</span>
      <span className="ui-agq__bin-count">{k === "done" ? done : failed}</span>
      <span key={k === "done" ? doneCount : failedCount} className="ui-agq__bin-hit" aria-hidden="true" />
    </div>
  ));
}

export function AgentQueue({
  look,
  jobs,
  workers,
  now: nowProp,
  rateLimits = [],
  paused: pausedProp,
  defaultPaused = false,
  onPausedChange,
  onConcurrencyChange,
  minConcurrency = 1,
  maxConcurrency = 8,
  backpressure,
  window: span = 2 * MINUTE,
  totals,
  openId,
  defaultOpenId = null,
  onOpenChange,
  onPromote,
  onCancel,
  title = "Queue",
  name,
  className,
  ref,
  ...rest
}: AgentQueueProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const setRoot = useRootRef(rootRef, ref);
  const [paused, setPaused] = useControllable(pausedProp, defaultPaused, onPausedChange, "paused");
  const cardRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const jobEls = useRef(new Map<string, HTMLButtonElement>());
  const gradId = "ui-agq-" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const width = useWidth(cardRef);

  /* ---------- The clock: yours, or our own while there is work ---------- */

  // 0 on the server and the first render (hydration-safe); read before the first paint, then by the frame loop when
  // something discrete is due – times, progress and the chart move in between without a render
  const [tick, setTick] = useState(0);
  useLayoutEffect(() => {
    if (nowProp === undefined) setTick(Date.now());
  }, [nowProp]);
  const now = nowProp ?? tick;
  const clockReady = nowProp !== undefined || tick > 0;
  const activeLimit = rateLimits.find((l) => l.from <= now && now < l.until);
  const limited = !!activeLimit;
  const queuedAll = jobs.filter((j) => j.status === "queued");
  const runningAll = jobs.filter((j) => j.status === "running");
  const needClock = nowProp === undefined && (queuedAll.length > 0 || runningAll.length > 0 || limited);

  const { memory, real, setReal, announce } = useJobMemory(
    { jobs, limited, limitLeft: activeLimit ? Math.ceil((activeLimit.until - now) / 1000) : 0, waiting: queuedAll.length, backpressure },
    queuedAll,
  );

  const L = layoutFor(width, workers.length);
  const { order, placed, K, cap, capFull, overflow, hiddenCount, slotOf } = placeJobs(jobs, queuedAll, runningAll, workers, L, memory, real);

  /* ---------- The queue in numbers ---------- */

  const doneCount = totals?.done ?? jobs.filter((j) => j.status === "done").length;
  const failedCount = totals?.failed ?? jobs.filter((j) => j.status === "failed").length;
  const perMinute = jobs.filter((j) => j.status === "done" && j.endedAt !== undefined && j.endedAt > now - MINUTE && j.endedAt <= now).length;
  const p95 = waitP95(jobs, queuedAll, now);
  const over = backpressure !== undefined && queuedAll.length > backpressure;
  const state = limited ? "limited" : paused ? "paused" : queuedAll.length || runningAll.length ? "live" : "idle";

  const plotW = Math.max(40, width - 2 * L.pad - GUTTER);
  const plotH = L.narrow ? 88 : 112;
  const chartAt = chartModel(jobs, queuedAll.length, rateLimits, span, plotW, backpressure);
  const chart = chartAt(now);
  const { peak, avg, ymax, bands } = chart;
  const minutes = span / MINUTE;
  const spanLabel = minutes >= 2 ? `${+minutes.toFixed(1)} min` : `${Math.round(span / 1000)}s`;
  const summary = `Queue depth over the last ${spanLabel}: ${queuedAll.length} waiting now, peak ${peak}, average ${avg.toFixed(1)}${backpressure !== undefined ? `, backpressure line at ${backpressure}` : ""}${bands.length ? `, rate limited ${bands.length === 1 ? "once" : `${bands.length} times`}` : ""}${failedCount ? `, ${failedCount} failed in all` : ""}.`;

  const { nums, num } = useTickingNumbers(clockReady);

  /* ---------- Hover card and pinned card ---------- */

  const { wantOpen, setOpen, setHover, live2, openPlaced, cardOf, popH } = useJobCard(placed, jobs, openId, defaultOpenId, onOpenChange, popRef, jobEls);
  // The peek stays while the pointer moves from the job onto it, and closes with Esc wherever focus is (1.4.13)
  const peekTimer = useRef(0);
  const peekHeld = useRef(false);
  const hoverJob = (jobId: string, id: string | null) => {
    window.clearTimeout(peekTimer.current);
    if (id) return setHover(id);
    peekTimer.current = window.setTimeout(() => !peekHeld.current && setHover((h) => (h === jobId ? null : h)), 120);
  };
  const holdPeek = (held: boolean) => {
    peekHeld.current = held;
    window.clearTimeout(peekTimer.current);
    if (!held) peekTimer.current = window.setTimeout(() => setHover(null), 120);
  };
  useEffect(() => () => window.clearTimeout(peekTimer.current), []);
  const peeking = !!cardOf && !openPlaced;
  useEffect(() => {
    if (!peeking) return;
    const onKey = (e: globalThis.KeyboardEvent) => e.key === "Escape" && setHover(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [peeking, setHover]);
  // A job that leaves (cancelled, finished, moved off the grid) while focused hands focus to the job in the tab order
  useFocusRescue(rootRef, {
    fallback: () => rootRef.current?.querySelector('.ui-agq__job[tabindex="0"]') ?? rootRef.current?.querySelector(".ui-agq__btn"),
  });

  /* ---------- Between renders: times, progress, the card and the chart repaint in place ---------- */

  // Between renders, the chart scrolls on: drawn in place, unless its scale or its rate-limit bands changed – that takes a render
  const paintChart = (clock: number) => {
    const c = chartAt(clock);
    const svg = svgRef.current;
    if (!svg || c.ymax !== ymax || c.bands.length !== bands.length || c.bands.some((b, i) => b.l !== bands[i].l)) return false;
    svg.querySelector(".ui-agq__line")?.setAttribute("d", c.line);
    svg.querySelector(".ui-agq__area")?.setAttribute("d", c.area);
    svg.querySelectorAll(".ui-agq__band rect").forEach((r, i) => {
      r.setAttribute("x", String(c.bands[i].x1));
      r.setAttribute("width", String(Math.max(1, c.bands[i].x2 - c.bands[i].x1)));
    });
    return true;
  };
  const paintText = (clock: number) =>
    paintJobText(clock, { live2, jobEls: jobEls.current, limited, waiting: order.length, card: cardOf, popEl: popRef.current, rootEl: rootRef.current, activeLimit, workers, nums: nums.current, jobs, queued: queuedAll });
  useFrameLoop(
    rootRef,
    nums,
    {
      needClock,
      ymax,
      nextAt: nextChangeAt(rateLimits, jobs, now),
      fine: (clock) => needsTenths(queuedAll, runningAll, clock),
      paint: (clock, text) => {
        if (text) paintText(clock);
        return paintChart(clock);
      },
    },
    setTick,
    setReal,
  );

  /* ---------- Keyboard: one job in the tab order, arrows walk through the slots and the queue ---------- */

  const { activeId, setActive, onKey } = useJobKeys(runningAll, order.slice(0, K + cap), slotOf, jobEls, wantOpen, setOpen);
  const register = (id: string, el: HTMLButtonElement | null) => {
    if (el) jobEls.current.set(id, el);
    else jobEls.current.delete(id);
  };
  const enterDelay = (p: Placed) => {
    const s = memory.seen.get(p.job.id);
    return s && !s.fresh ? Math.min(420, (p.index ?? 0) * 22) : 0;
  };
  const card = (p: Placed) => {
    const w = Math.min(L.narrow ? width - 2 * L.pad : 280, width - 16);
    const below = p.box.y + p.box.h + 6;
    const y = below + popH > L.height + 120 && p.box.y - popH - 6 > 0 ? p.box.y - popH - 6 : below;
    const x = clamp(p.box.x, 8, width - w - 8);
    return (
      <JobCard
        key={p.job.id}
        p={p}
        now={now}
        pinned={!!openPlaced}
        limited={limited}
        waiting={order.length}
        workers={workers}
        x={x}
        y={y}
        w={w}
        popRef={popRef}
        onClose={(refocus) => {
          // Back to the job before the card goes
          if (refocus) rescueFocus(popRef.current, [jobEls.current.get(p.job.id)]);
          setOpen(null);
        }}
        onHold={holdPeek}
        onPromote={onPromote}
        onCancel={onCancel}
      />
    );
  };

  /* ---------- The whole thing ---------- */

  const busyCount = runningAll.filter((j) => j.worker !== undefined && slotOf.has(j.worker)).length;
  const stats: { label: string; value: ReactNode; kind?: string }[] = [
    { label: "Waiting", value: num("waiting", queuedAll.length, int), kind: over ? "warn" : undefined },
    {
      label: "Running",
      value: (
        <>
          {num("running", busyCount, int)}
          <span className="ui-agq__of">/{workers.length}</span>
        </>
      ),
    },
    {
      label: "Throughput",
      value: (
        <>
          {num("rate", perMinute, int)}
          <span className="ui-agq__of">/min</span>
        </>
      ),
    },
    { label: "Wait p95", value: num("p95", p95, took) },
  ];
  const left = activeLimit ? Math.max(0, Math.ceil((activeLimit.until - now) / 1000)) : 0;

  return (
    <div {...rest} ref={setRoot} className={[ROOT_CLASS, className].filter(Boolean).join(" ")} data-look={look ?? DEFAULT_LOOK} data-state={state}>
      <style href="ui-agent-queue" precedence="default">
        {css}
      </style>

      <QueueHeader
        title={title}
        name={name}
        state={state}
        left={left}
        paused={paused}
        onTogglePause={onPausedChange && (() => setPaused(!paused))}
        workers={workers.length}
        minConcurrency={minConcurrency}
        maxConcurrency={maxConcurrency}
        onConcurrencyChange={onConcurrencyChange}
      />

      <div ref={cardRef} className="ui-agq__card">
        <dl className="ui-agq__stats">
          {stats.map((s) => (
            <div key={s.label} className="ui-agq__stat" data-kind={s.kind}>
              <dt>{s.label}</dt>
              <dd>{s.value}</dd>
            </div>
          ))}
        </dl>

        {/* The flow: queue → workers → done / failed */}
        <div className="ui-agq__flow" style={{ height: L.height }} data-narrow={L.narrow ? "" : undefined}>
          <span className="ui-agq__col-head" style={boxStyle(L.heads.queue)}>
            <span>Queue</span>
            <b>{num("depth", queuedAll.length, int)}</b>
            {hiddenCount > 0 && L.narrow && <span className="ui-agq__col-more">+{hiddenCount} more</span>}
          </span>
          <span className="ui-agq__col-head" style={boxStyle(L.heads.workers)}>
            <span>Workers</span>
            <b>
              {busyCount}/{workers.length}
            </b>
          </span>

          {/* The well the backlog sits in – only while there is a backlog */}
          <span className="ui-agq__well" aria-hidden="true" data-empty={order.length <= K ? "" : undefined} style={boxStyle(L.well)} />
          {order.length === 0 && (
            <span className="ui-agq__empty" style={boxStyle({ x: L.chips[0].x, y: L.chips[0].y, w: L.chips[0].w, h: L.well.y + L.well.h - L.chips[0].y })}>
              Nothing waiting
            </span>
          )}
          {overflow && (
            <span
              className="ui-agq__more"
              aria-hidden="true"
              style={boxStyle({ x: L.grid.x + ((capFull - 3) % L.grid.cols) * L.grid.step, y: L.grid.y + Math.floor((capFull - 3) / L.grid.cols) * STEP, w: 2 * L.grid.step + SQ, h: SQ })}
            >
              +{hiddenCount}
            </span>
          )}

          <WorkerSlots workers={workers} L={L} running={runningAll} limited={limited} paused={paused} />
          <Bins L={L} done={num("bin-done", doneCount, int)} failed={num("bin-failed", failedCount, int)} doneCount={doneCount} failedCount={failedCount} />

          <div className="ui-agq__jobs" role="group" aria-label={`Jobs: ${busyCount} running, ${order.length} waiting`}>
            {placed.map((p) => (
              <JobButton
                key={p.job.id}
                p={p}
                now={now}
                limited={limited}
                waiting={order.length}
                enterDelay={enterDelay(p)}
                open={wantOpen === p.job.id}
                tabbable={activeId === p.job.id}
                register={register}
                onHover={(id) => hoverJob(p.job.id, id)}
                onActive={setActive}
                onToggle={(id) => setOpen(wantOpen === id ? null : id)}
                onKey={onKey}
              />
            ))}
          </div>
          {cardOf && card(cardOf)}
        </div>

        {/* The chart: how deep the queue has been */}
        <QueueChart chart={chart} summary={summary} spanLabel={spanLabel} plotW={plotW} plotH={plotH} backpressure={backpressure} waiting={queuedAll.length} gradId={gradId} svgRef={svgRef} />
      </div>

      <div className="ui-agq__sr" aria-live="polite">
        {announce}
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

const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

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
.ui-agq:where([data-look="standard"]),
.ui-agq__portal:where([data-look="standard"]) {
  --_tc-accent-subtle: light-dark(rgba(47, 107, 255, 0.08), rgba(79, 130, 255, 0.16));
  --_tc-accent-text: light-dark(#2456d6, #8ab4ff);
  --_tc-action-secondary-bg: light-dark(#ffffff, #232326);
  --_tc-action-secondary-fg: light-dark(#171717, #ededed);
  --_tc-action-secondary-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-shadow-hover: 0 0 0 1px light-dark(#dedede, #3a3a40), 0 6px 16px -8px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-avatar-md: 24px;
  --_tc-avatar-radius-agent: 6px;
  --_tc-border-default: light-dark(#ececec, #2a2a2e);
  --_tc-border-strong: light-dark(#dedede, #3a3a40);
  --_tc-border-subtle: light-dark(#f0f0f0, rgba(255, 255, 255, 0.06));
  --_tc-card-radius: 16px;
  --_tc-card-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-md: 32px;
  --_tc-control-h-sm: 28px;
  --_tc-control-px-md: 12px;
  --_tc-control-px-sm: 10px;
  --_tc-control-radius-md: 10px;
  --_tc-control-radius-sm: 8px;
  --_tc-divider: light-dark(#ececec, #2a2a2e);
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-quick: 120ms;
  --_tc-duration-reveal: 700ms;
  --_tc-duration-reveal-slow: 900ms;
  --_tc-duration-shimmer: 1600ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-duration-slowest: 560ms;
  --_tc-ease-decelerate: cubic-bezier(0, 0, 0.58, 1);
  --_tc-ease-emphasized: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --_tc-ease-move: cubic-bezier(0.22, 1, 0.36, 1);
  --_tc-ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-fill-strong: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.12));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring-offset: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-2xl: 20px;
  --_tc-font-size-2xs: 10px;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-lg-plus: 15px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-md-plus: 13.5px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-sm-plus: 12.5px;
  --_tc-font-size-xl: 16px;
  --_tc-font-size-xs: 11px;
  --_tc-font-size-xs-plus: 11.5px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-semibold: 600;
  --_tc-hairline: 1px;
  --_tc-icon-muted: light-dark(#858585, #7c7c82);
  --_tc-line-height-display-sm: 28px;
  --_tc-line-height-loose: 24px;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-relaxed: 22px;
  --_tc-line-height-snug: 18px;
  --_tc-line-height-tight: 16px;
  --_tc-menu-bg: light-dark(#ffffff, #232326);
  --_tc-menu-radius: 12px;
  --_tc-menu-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 16px 36px -12px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-pill-font-size: 11px;
  --_tc-pill-font-size-lg: 12px;
  --_tc-pill-font-weight: 500;
  --_tc-pill-h: 20px;
  --_tc-pill-h-lg: 22px;
  --_tc-pill-px: 8px;
  --_tc-pill-px-lg: 10px;
  --_tc-pill-radius: 999px;
  --_tc-radius-2xs: 2px;
  --_tc-radius-badge: 999px;
  --_tc-radius-lg: 10px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xl: 12px;
  --_tc-radius-xs: 4px;
  --_tc-shadow-control: 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-shadow-raised: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-status-danger-bg: light-dark(#fdecea, #3b1714);
  --_tc-status-danger-border: color-mix(in srgb, light-dark(#e5484d, #ff6369) 40%, transparent);
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-info-bg: light-dark(#eaf1ff, #16243f);
  --_tc-status-success-bg: light-dark(#e6f6ec, #12301f);
  --_tc-status-success-border: color-mix(in srgb, light-dark(#1f8a4c, #3ec27a) 40%, transparent);
  --_tc-status-success-fg: light-dark(#18794e, #3dd68c);
  --_tc-status-warning-bg: light-dark(#fff3e0, #3a2410);
  --_tc-status-warning-border: color-mix(in srgb, light-dark(#c2710c, #f5a524) 40%, transparent);
  --_tc-status-warning-fg: light-dark(#a35200, #ffa057);
  --_tc-status-warning-solid: light-dark(#c2710c, #f5a524);
  --_tc-surface-on-tray: light-dark(#ffffff, #232326);
  --_tc-surface-raised: light-dark(#ffffff, #19191b);
  --_tc-surface-sunken: light-dark(#f0f0f0, #111113);
  --_tc-surface-tray: light-dark(#f0f0f0, #19191b);
  --_tc-text-disabled: light-dark(#a3a3a3, #5c5c63);
  --_tc-text-muted: light-dark(#646464, #9a9aa1);
  --_tc-text-primary: light-dark(#171717, #ededed);
  --_tc-text-secondary: light-dark(#404040, #c8c8cc);
  --_tc-text-strong: light-dark(#171717, #f5f5f5);
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(16px + 4px);
}
.ui-agq:where([data-look="clean"]),
.ui-agq__portal:where([data-look="clean"]) {
  --_tc-accent-subtle: light-dark(rgba(0, 96, 226, 0.06), rgba(77, 141, 255, 0.14));
  --_tc-accent-text: light-dark(#0058cf, #70b8ff);
  --_tc-action-secondary-bg: light-dark(#ffffff, #252527);
  --_tc-action-secondary-fg: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-action-secondary-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-shadow-hover: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 3px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-avatar-md: 24px;
  --_tc-avatar-radius-agent: 6px;
  --_tc-border-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-border-strong: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14));
  --_tc-border-subtle: light-dark(rgba(0, 0, 0, 0.045), rgba(255, 255, 255, 0.05));
  --_tc-card-radius: 10px;
  --_tc-card-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-md: 28px;
  --_tc-control-h-sm: 24px;
  --_tc-control-px-md: 10px;
  --_tc-control-px-sm: 8px;
  --_tc-control-radius-md: 6px;
  --_tc-control-radius-sm: 6px;
  --_tc-divider: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-quick: 120ms;
  --_tc-duration-reveal: 700ms;
  --_tc-duration-reveal-slow: 900ms;
  --_tc-duration-shimmer: 1600ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-duration-slowest: 560ms;
  --_tc-ease-decelerate: cubic-bezier(0, 0, 0.58, 1);
  --_tc-ease-emphasized: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --_tc-ease-move: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-fill-strong: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring-offset: 1px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-2xl: 20px;
  --_tc-font-size-2xs: 10px;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-lg-plus: 15px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-md-plus: 13.5px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-sm-plus: 12.5px;
  --_tc-font-size-xl: 16px;
  --_tc-font-size-xs: 11px;
  --_tc-font-size-xs-plus: 11.5px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-semibold: 600;
  --_tc-hairline: 0.5px;
  --_tc-icon-muted: light-dark(rgba(0, 0, 0, 0.45), rgba(255, 255, 255, 0.46));
  --_tc-line-height-display-sm: 28px;
  --_tc-line-height-loose: 24px;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-relaxed: 22px;
  --_tc-line-height-snug: 18px;
  --_tc-line-height-tight: 16px;
  --_tc-menu-bg: light-dark(#ffffff, #252527);
  --_tc-menu-radius: 10px;
  --_tc-menu-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 12px 28px -10px light-dark(rgba(0, 0, 0, 0.16), rgba(0, 0, 0, 0.6)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-pill-font-size: 11px;
  --_tc-pill-font-size-lg: 12px;
  --_tc-pill-font-weight: 500;
  --_tc-pill-h: 18px;
  --_tc-pill-h-lg: 20px;
  --_tc-pill-px: 6px;
  --_tc-pill-px-lg: 8px;
  --_tc-pill-radius: 5px;
  --_tc-radius-2xs: 2px;
  --_tc-radius-badge: 5px;
  --_tc-radius-lg: 10px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xl: 12px;
  --_tc-radius-xs: 4px;
  --_tc-shadow-control: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-shadow-raised: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-status-danger-bg: light-dark(rgba(245, 43, 0, 0.094), rgba(255, 53, 35, 0.17));
  --_tc-status-danger-border: color-mix(in srgb, light-dark(#e5484d, #ff6369) 40%, transparent);
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-info-bg: light-dark(rgba(0, 143, 245, 0.1), rgba(0, 119, 255, 0.23));
  --_tc-status-success-bg: light-dark(rgba(0, 164, 51, 0.1), rgba(0, 240, 74, 0.12));
  --_tc-status-success-border: color-mix(in srgb, light-dark(#1f8a4c, #3ec27a) 40%, transparent);
  --_tc-status-success-fg: light-dark(#18794e, #3dd68c);
  --_tc-status-warning-bg: light-dark(rgba(255, 156, 0, 0.16), rgba(251, 106, 0, 0.15));
  --_tc-status-warning-border: color-mix(in srgb, light-dark(#c2710c, #f5a524) 40%, transparent);
  --_tc-status-warning-fg: light-dark(#a35200, #ffa057);
  --_tc-status-warning-solid: light-dark(#c2710c, #f5a524);
  --_tc-surface-on-tray: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-raised: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-sunken: light-dark(#f7f7f7, #161618);
  --_tc-surface-tray: light-dark(#f7f7f7, #161618);
  --_tc-text-disabled: light-dark(rgba(0, 0, 0, 0.27), rgba(255, 255, 255, 0.3));
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

/* The chart's scale glides, so it's registered as a number */
@property --tc-agent-queue-ymax { syntax: "<number>"; inherits: true; initial-value: 10; }
/* Colors, sizes and motion as variables – override them on .ui-agq */
:where([data-look="standard"], [data-look="standard"] *).ui-agq {
  /* Jobs by kind: a tint, its edge, the ink on it and a stronger tint for the backlog squares */
  --tc-agent-queue-agent-bg: light-dark(#eef0f3, #2c2f35);
  --tc-agent-queue-agent-edge: light-dark(#d3d8e0, #41464f);
  --tc-agent-queue-agent-ink: light-dark(#4b5363, #b8c0cc);
  --tc-agent-queue-agent-sq: light-dark(#d9dde4, #3a3e46);
  --tc-agent-queue-llm-bg: light-dark(#efecff, #2a2545);
  --tc-agent-queue-llm-edge: light-dark(#cbc2fb, #4c3fa0);
  --tc-agent-queue-llm-ink: light-dark(#5a45d4, #b6a9ff);
  --tc-agent-queue-llm-sq: light-dark(#d4ccfb, #3b3270);
  --tc-agent-queue-tool-bg: light-dark(#e4f5f1, #16302b);
  --tc-agent-queue-tool-edge: light-dark(#a9ddd1, #285f54);
  --tc-agent-queue-tool-ink: light-dark(#0e7a67, #62d5bb);
  --tc-agent-queue-tool-sq: light-dark(#bfe6dc, #1f4a41);
  --tc-agent-queue-human-bg: light-dark(#eaf1ff, #16243f);
  --tc-agent-queue-human-edge: light-dark(#bcd0fb, #2c4a85);
  --tc-agent-queue-human-ink: light-dark(#2456d6, #8ab4ff);
  --tc-agent-queue-human-sq: light-dark(#cddcfd, #223a66);
  /* The gray tray with white cards on it (lighter cards in dark) and the quiet well inside a card */
  --tc-agent-queue-tray-bg: var(--tc-surface-tray, var(--_tc-surface-tray));
  --tc-agent-queue-card-bg: var(--tc-surface-on-tray, var(--_tc-surface-on-tray));
  --tc-agent-queue-well-bg: light-dark(#fafafa, #1f1f22);
  /* Queue depth: a violet line over a fading fill */
  --tc-agent-queue-depth: light-dark(#5a45d4, #a395ff);
  --tc-agent-queue-depth-fill: light-dark(rgba(90, 69, 212, 0.16), rgba(141, 124, 240, 0.26));
  --tc-agent-queue-depth-fade: light-dark(rgba(90, 69, 212, 0), rgba(141, 124, 240, 0));
  --tc-agent-queue-rail-stripe: light-dark(rgba(0, 0, 0, 0.018), rgba(255, 255, 255, 0.02));
  position: relative;
  box-sizing: border-box;
  width: 100%;
  /* The tray recipe */
  padding: var(--tc-tray-inset, var(--_tc-tray-inset));
  border-radius: var(--tc-tray-radius, var(--_tc-tray-radius));
  background: var(--tc-agent-queue-tray-bg);
  container: ui-agq / inline-size;
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  letter-spacing: -0.006em;
  color: var(--tc-text-muted, var(--_tc-text-muted));
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Colors, sizes and motion as variables – override them on .ui-agq */
:where([data-look="clean"], [data-look="clean"] *).ui-agq {
  /* Jobs by kind: a tint, its edge, the ink on it and a stronger tint for the backlog squares */
  --tc-agent-queue-llm-bg: light-dark(rgba(91, 91, 214, 0.1), rgba(130, 130, 255, 0.16));
  --tc-agent-queue-llm-edge: light-dark(rgba(91, 91, 214, 0.3), rgba(130, 130, 255, 0.38));
  --tc-agent-queue-llm-ink: light-dark(#4a4ac2, #b1a9ff);
  --tc-agent-queue-llm-sq: light-dark(rgba(91, 91, 214, 0.22), rgba(130, 130, 255, 0.34));
  --tc-agent-queue-tool-bg: light-dark(rgba(0, 123, 172, 0.085), rgba(0, 170, 220, 0.13));
  --tc-agent-queue-tool-edge: light-dark(rgba(0, 123, 172, 0.28), rgba(0, 170, 220, 0.34));
  --tc-agent-queue-tool-ink: light-dark(#006a94, #4ccce6);
  --tc-agent-queue-tool-sq: light-dark(rgba(0, 123, 172, 0.2), rgba(0, 170, 220, 0.3));
  --tc-agent-queue-human-bg: light-dark(rgba(0, 96, 226, 0.08), rgba(60, 140, 255, 0.14));
  --tc-agent-queue-human-edge: light-dark(rgba(0, 96, 226, 0.26), rgba(60, 140, 255, 0.36));
  --tc-agent-queue-human-ink: light-dark(#0055c8, #70b8ff);
  --tc-agent-queue-human-sq: light-dark(rgba(0, 96, 226, 0.18), rgba(60, 140, 255, 0.3));
  /* Queue depth: an indigo line over a fading fill */
  --tc-agent-queue-depth: light-dark(rgba(91, 91, 214, 0.9), rgba(150, 150, 255, 0.95));
  --tc-agent-queue-depth-fill: light-dark(rgba(91, 91, 214, 0.14), rgba(130, 130, 255, 0.22));
  --tc-agent-queue-depth-fade: light-dark(rgba(91, 91, 214, 0), rgba(130, 130, 255, 0));
  --tc-agent-queue-rail-stripe: light-dark(rgba(0, 0, 0, 0.022), rgba(255, 255, 255, 0.025));
  position: relative;
  box-sizing: border-box;
  width: 100%;
  /* One card: the card pattern */
  border-radius: var(--tc-card-radius, var(--_tc-card-radius));
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow));
  container: ui-agq / inline-size;
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
.ui-agq *, .ui-agq *::before, .ui-agq *::after { box-sizing: border-box; }
:where(.ui-agq) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.ui-agq button:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
.ui-agq :is(p, dl, dd) { margin: 0; }
.ui-agq svg { display: block; flex: none; }
.ui-agq__num { font-variant-numeric: tabular-nums; }
/* ----- On the tray: the queue's name, its state and the controls ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-agq__head { display: flex; align-items: center; gap: 8px; min-width: 0; min-height: 44px; padding: 4px 4px 8px 12px; }
/* ----- The bar: the queue's name, its state and the controls ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-agq__head { display: flex; align-items: center; gap: 8px; min-width: 0; min-height: 52px; padding: 12px 12px 12px 16px; border-bottom: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider)); }
.ui-agq__mark { display: grid; flex: none; place-items: center; width: 16px; color: var(--tc-accent-text, var(--_tc-accent-text)); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__title { flex: none; font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold)); color: var(--tc-text-strong, var(--_tc-text-strong)); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__name { min-width: 0; overflow: hidden; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; text-overflow: ellipsis; }
/* Status pills: the pill pattern (large in the header, small on a job's card) */
:where([data-look="standard"], [data-look="standard"] *).ui-agq__pill { display: inline-flex; flex: none; align-items: center; gap: 6px; height: var(--tc-pill-h-lg, var(--_tc-pill-h-lg)); padding: 0 var(--tc-pill-px-lg, var(--_tc-pill-px-lg)); border-radius: var(--tc-pill-radius, var(--_tc-pill-radius)); background: var(--tc-fill-default, var(--_tc-fill-default)); font-size: var(--tc-pill-font-size-lg, var(--_tc-pill-font-size-lg)); font-weight: var(--tc-pill-font-weight, var(--_tc-pill-font-weight)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__head .ui-agq__pill { background: var(--tc-agent-queue-card-bg); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__pill[data-status="live"] { color: var(--tc-accent-text, var(--_tc-accent-text)); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__pill[data-status="limited"] { color: var(--tc-status-warning-fg, var(--_tc-status-warning-fg)); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__head .ui-agq__pill[data-status="limited"] { background: var(--tc-status-warning-bg, var(--_tc-status-warning-bg)); box-shadow: inset 0 0 0 1px var(--tc-status-warning-border, var(--_tc-status-warning-border)); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__pill[data-status="running"] { color: var(--tc-accent-text, var(--_tc-accent-text)); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__pill[data-status="done"] { color: var(--tc-status-success-fg, var(--_tc-status-success-fg)); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__pill[data-status="failed"] { color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__pop .ui-agq__pill[data-status="running"] { background: var(--tc-status-info-bg, var(--_tc-status-info-bg)); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__title { flex: none; font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-strong, var(--_tc-text-strong)); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__name { min-width: 0; overflow: hidden; color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__pill { display: inline-flex; flex: none; align-items: center; gap: 5px; height: var(--tc-pill-h-lg, var(--_tc-pill-h-lg)); padding: 0 var(--tc-pill-px-lg, var(--_tc-pill-px-lg)); border-radius: var(--tc-pill-radius, var(--_tc-pill-radius)); background: var(--tc-fill-default, var(--_tc-fill-default)); font-size: var(--tc-pill-font-size-lg, var(--_tc-pill-font-size-lg)); font-weight: var(--tc-pill-font-weight, var(--_tc-pill-font-weight)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__pill > svg { width: 11px; height: 11px; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__pill:is([data-status="live"], [data-status="running"]) { background: var(--tc-accent-subtle, var(--_tc-accent-subtle)); color: var(--tc-accent-text, var(--_tc-accent-text)); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__pill[data-status="limited"] { background: var(--tc-status-warning-bg, var(--_tc-status-warning-bg)); color: var(--tc-status-warning-fg, var(--_tc-status-warning-fg)); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__pill[data-status="done"] { background: var(--tc-status-success-bg, var(--_tc-status-success-bg)); color: var(--tc-status-success-fg, var(--_tc-status-success-fg)); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__pill[data-status="failed"] { background: var(--tc-status-danger-bg, var(--_tc-status-danger-bg)); color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
/* Decorative loops pulse a few times and rest (2.2.2) – the state is in the words */
.ui-agq__pulse { width: 6px; height: 6px; border-radius: 50%; background: currentColor; animation: ui-agq-pulse var(--tc-duration-shimmer, var(--_tc-duration-shimmer)) var(--tc-ease-in-out, var(--_tc-ease-in-out)) 3; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__tools { display: flex; flex: none; align-items: center; gap: 6px; margin-left: auto; }
/* Pause / Move to front / Cancel: secondary buttons, the control geometry */
:where([data-look="standard"], [data-look="standard"] *).ui-agq__btn { display: inline-flex; align-items: center; gap: 6px; height: var(--tc-control-h-sm, var(--_tc-control-h-sm)); padding: 0 var(--tc-control-px-sm, var(--_tc-control-px-sm)) 0 calc(var(--tc-control-px-sm, var(--_tc-control-px-sm)) - 2px); border-radius: var(--tc-control-radius-sm, var(--_tc-control-radius-sm)); background: var(--tc-action-secondary-bg, var(--_tc-action-secondary-bg)); box-shadow: var(--tc-action-secondary-shadow, var(--_tc-action-secondary-shadow)); font-size: var(--tc-control-font-size, var(--_tc-control-font-size)); font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight)); color: var(--tc-action-secondary-fg, var(--_tc-action-secondary-fg)); white-space: nowrap; transition: box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-agq__btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover, var(--_tc-action-secondary-shadow-hover)); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__tools { display: flex; flex: none; align-items: center; gap: 8px; margin-left: auto; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__btn { display: inline-flex; align-items: center; gap: 6px; height: var(--tc-control-h-md, var(--_tc-control-h-md)); padding: 0 var(--tc-control-px-md, var(--_tc-control-px-md)) 0 6px; border-radius: var(--tc-control-radius-md, var(--_tc-control-radius-md)); background: var(--tc-action-secondary-bg, var(--_tc-action-secondary-bg)); box-shadow: var(--tc-action-secondary-shadow, var(--_tc-action-secondary-shadow)); font-size: var(--tc-control-font-size, var(--_tc-control-font-size)); font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight)); color: var(--tc-action-secondary-fg, var(--_tc-action-secondary-fg)); white-space: nowrap; transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__btn > svg { width: 16px; height: 16px; color: var(--tc-icon-muted, var(--_tc-icon-muted)); }
.ui-agq__btn[aria-pressed="true"] { color: var(--tc-accent-text, var(--_tc-accent-text)); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__btn[data-kind="danger"] { color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__stepper { display: inline-flex; align-items: center; height: var(--tc-control-h-sm, var(--_tc-control-h-sm)); padding: 0 2px 0 10px; border-radius: var(--tc-control-radius-sm, var(--_tc-control-radius-sm)); background: var(--tc-action-secondary-bg, var(--_tc-action-secondary-bg)); box-shadow: var(--tc-action-secondary-shadow, var(--_tc-action-secondary-shadow)); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__stepper button { display: grid; place-items: center; width: 24px; height: 24px; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); color: var(--tc-text-muted, var(--_tc-text-muted)); transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__btn[aria-pressed="true"] > svg { color: var(--tc-accent-text, var(--_tc-accent-text)); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__btn[data-kind="danger"],
:where([data-look="clean"], [data-look="clean"] *).ui-agq__btn[data-kind="danger"] > svg { color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__stepper { display: inline-flex; align-items: center; height: var(--tc-control-h-md, var(--_tc-control-h-md)); padding: 0 2px 0 10px; border-radius: var(--tc-control-radius-md, var(--_tc-control-radius-md)); background: var(--tc-action-secondary-bg, var(--_tc-action-secondary-bg)); box-shadow: var(--tc-action-secondary-shadow, var(--_tc-action-secondary-shadow)); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__stepper button { display: grid; place-items: center; width: 24px; height: 24px; border-radius: var(--tc-radius-xs, var(--_tc-radius-xs)); color: var(--tc-icon-muted, var(--_tc-icon-muted)); transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-agq__stepper button:hover:not(:disabled) { background: var(--tc-fill-default, var(--_tc-fill-default)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
.ui-agq__stepper button:disabled { opacity: 0.35; cursor: default; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__stepper-value { min-width: 18px; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold)); color: var(--tc-text-primary, var(--_tc-text-primary)); text-align: center; font-variant-numeric: tabular-nums; }
/* ----- The white card: the queue in numbers, the flow and the chart ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-agq__card { position: relative; border-radius: var(--tc-card-radius, var(--_tc-card-radius)); background: var(--tc-agent-queue-card-bg); box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow)); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); padding: 14px 0; border-bottom: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider)); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__stepper-value { min-width: 18px; font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-strong, var(--_tc-text-strong)); text-align: center; font-variant-numeric: tabular-nums; }
/* ----- The queue in numbers, the flow and the chart – all on the one card ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-agq__card { position: relative; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); padding: 12px 0; border-bottom: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider)); }
.ui-agq__stat { display: grid; gap: 2px; min-width: 0; padding: 0 16px; }
.ui-agq__stat:first-child { padding-left: 22px; }
.ui-agq__stat:last-child { padding-right: 10px; }
.ui-agq__stat + .ui-agq__stat { border-left: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider)); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__stat dt { overflow: hidden; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__stat dd { overflow: hidden; font-size: var(--tc-font-size-xl, var(--_tc-font-size-xl)); font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold)); line-height: var(--tc-line-height-relaxed, var(--_tc-line-height-relaxed)); letter-spacing: -0.01em; color: var(--tc-text-primary, var(--_tc-text-primary)); white-space: nowrap; font-variant-numeric: tabular-nums; transition: color var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__of { margin-left: 1px; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__stat dt { overflow: hidden; font-size: var(--tc-font-size-2xs, var(--_tc-font-size-2xs)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); letter-spacing: 0.5px; text-transform: uppercase; color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__stat dd { overflow: hidden; font-size: var(--tc-font-size-lg-plus, var(--_tc-font-size-lg-plus)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-loose, var(--_tc-line-height-loose)); color: var(--tc-text-primary, var(--_tc-text-primary)); white-space: nowrap; font-variant-numeric: tabular-nums; transition: color var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__of { margin-left: 1px; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
.ui-agq__stat[data-kind="warn"] dd { color: var(--tc-status-warning-fg, var(--_tc-status-warning-fg)); }
.ui-agq__stat[data-kind="failed"] dd { color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
/* ----- The flow: everything in it is placed by its box and glides to the next one ----- */
.ui-agq__flow { position: relative; border-bottom: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider)); transition: height var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)); }
/* ----- The flow: everything in it is placed by its box and glides to the next one ----- */
.ui-agq__flow > *, .ui-agq__jobs > * { position: absolute; top: 0; left: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__col-head { display: flex; align-items: center; gap: 6px; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__col-head > b { font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold)); color: var(--tc-text-primary, var(--_tc-text-primary)); font-variant-numeric: tabular-nums; }
/* The rate limit, with its countdown – a line under it runs out until the workers resume */
:where([data-look="standard"], [data-look="standard"] *).ui-agq__col-head > .ui-agq__col-more { margin-left: auto; font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular)); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__well { border-radius: var(--tc-radius-md, var(--_tc-radius-md)); background: var(--tc-agent-queue-well-bg); box-shadow: inset 0 0 0 1px var(--tc-border-subtle, var(--_tc-border-subtle)); }
.ui-agq__empty { display: grid; place-items: center; color: var(--tc-text-disabled, var(--_tc-text-disabled)); animation: ui-agq-calm var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__well { transition: opacity var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__col-head { display: flex; align-items: center; gap: 6px; font-size: var(--tc-font-size-2xs, var(--_tc-font-size-2xs)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); letter-spacing: 0.5px; text-transform: uppercase; color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__col-head > b { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); letter-spacing: 0; color: var(--tc-text-primary, var(--_tc-text-primary)); font-variant-numeric: tabular-nums; }
/* The rate limit, with its countdown – a line under it runs out until the workers resume */
:where([data-look="clean"], [data-look="clean"] *).ui-agq__col-head > .ui-agq__col-more { margin-left: auto; letter-spacing: 0.3px; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__well { border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); box-shadow: inset 0 0 0 0.5px var(--tc-border-default, var(--_tc-border-default)); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__well { transition: opacity var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)); }
.ui-agq__well[data-empty] { opacity: 0; }
@keyframes ui-agq-calm { from { opacity: 0; } }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__more { display: grid; place-items: center; border-radius: var(--tc-radius-2xs, var(--_tc-radius-2xs)); background: var(--tc-fill-default, var(--_tc-fill-default)); font-size: var(--tc-font-size-2xs, var(--_tc-font-size-2xs)); font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold)); line-height: 12px; color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; }
/* Worker slots: who it is on the left, the rail its job runs on to the right */
:where([data-look="standard"], [data-look="standard"] *).ui-agq__slot { border-radius: var(--tc-radius-xl, var(--_tc-radius-xl)); background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); transition: translate var(--tc-duration-slowest, var(--_tc-duration-slowest)) var(--tc-ease-out, var(--_tc-ease-out)), width var(--tc-duration-slowest, var(--_tc-duration-slowest)) var(--tc-ease-move, var(--_tc-ease-move)), background-color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)); animation: ui-agq-slot var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__more { display: grid; place-items: center; border-radius: var(--tc-radius-2xs, var(--_tc-radius-2xs)); background: var(--tc-fill-default, var(--_tc-fill-default)); font-size: var(--tc-font-size-2xs, var(--_tc-font-size-2xs)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: 12px; color: var(--tc-text-secondary, var(--_tc-text-secondary)); font-variant-numeric: tabular-nums; }
/* Worker slots: who it is on the left, the rail its job runs on to the right */
:where([data-look="clean"], [data-look="clean"] *).ui-agq__slot { border-radius: var(--tc-radius-md, var(--_tc-radius-md)); background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); box-shadow: inset 0 0 0 0.5px var(--tc-border-default, var(--_tc-border-default)); transition: translate var(--tc-duration-slowest, var(--_tc-duration-slowest)) var(--tc-ease-emphasized, var(--_tc-ease-emphasized)), width var(--tc-duration-slowest, var(--_tc-duration-slowest)) var(--tc-ease-move, var(--_tc-ease-move)), background-color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)); animation: ui-agq-slot var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
.ui-agq__who { position: absolute; top: 0; bottom: 0; left: 8px; display: flex; align-items: center; gap: 8px; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__logo { display: grid; flex: none; place-items: center; width: var(--tc-avatar-md, var(--_tc-avatar-md)); height: var(--tc-avatar-md, var(--_tc-avatar-md)); border-radius: var(--tc-avatar-radius-agent, var(--_tc-avatar-radius-agent)); background: var(--tc-agent-queue-card-bg); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)); font-size: var(--tc-font-size-2xs, var(--_tc-font-size-2xs)); font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__logo { display: grid; flex: none; place-items: center; width: var(--tc-avatar-md, var(--_tc-avatar-md)); height: var(--tc-avatar-md, var(--_tc-avatar-md)); border-radius: var(--tc-avatar-radius-agent, var(--_tc-avatar-radius-agent)); background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)); font-size: var(--tc-font-size-2xs, var(--_tc-font-size-2xs)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
.ui-agq__logo > svg { width: 14px; height: 14px; }
.ui-agq__who-text { display: grid; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__who-name { overflow: hidden; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-primary, var(--_tc-text-primary)); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__rail { position: absolute; display: flex; align-items: center; padding-left: 10px; border-radius: var(--tc-radius-md, var(--_tc-radius-md)); box-shadow: inset 0 0 0 1px var(--tc-border-default, var(--_tc-border-default)); background-color: light-dark(transparent, var(--tc-surface-sunken, var(--_tc-surface-sunken))); background-image: repeating-linear-gradient(-45deg, transparent 0 6px, var(--tc-agent-queue-rail-stripe) 6px 7px); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
/* Done and Failed: a tick or a cross, a count, and a soft ring when a job lands */
:where([data-look="standard"], [data-look="standard"] *).ui-agq__bin { z-index: 1; padding: 12px; border-radius: var(--tc-radius-xl, var(--_tc-radius-xl)); background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__bin-icon { position: absolute; top: 12px; left: 12px; display: grid; place-items: center; width: 20px; height: 20px; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__bin[data-kind="done"] .ui-agq__bin-icon { background: var(--tc-status-success-bg, var(--_tc-status-success-bg)); box-shadow: inset 0 0 0 1px var(--tc-status-success-border, var(--_tc-status-success-border)); color: var(--tc-status-success-fg, var(--_tc-status-success-fg)); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__bin[data-kind="failed"] .ui-agq__bin-icon { background: var(--tc-status-danger-bg, var(--_tc-status-danger-bg)); box-shadow: inset 0 0 0 1px var(--tc-status-danger-border, var(--_tc-status-danger-border)); color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__bin-label { position: absolute; top: 14px; left: 40px; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__bin-count { position: absolute; left: 12px; bottom: 10px; font-size: var(--tc-font-size-2xl, var(--_tc-font-size-2xl)); font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold)); line-height: 26px; letter-spacing: -0.02em; color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__who-name { overflow: hidden; font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-strong, var(--_tc-text-strong)); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__rail { position: absolute; display: flex; align-items: center; padding-left: 10px; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); box-shadow: inset 0 0 0 var(--tc-hairline, var(--_tc-hairline)) var(--tc-border-default, var(--_tc-border-default)); background-color: light-dark(transparent, var(--tc-surface-sunken, var(--_tc-surface-sunken))); background-image: repeating-linear-gradient(-45deg, transparent 0 6px, var(--tc-agent-queue-rail-stripe) 6px 6.5px); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
/* Done and Failed: a tick or a cross, a count, and a soft ring when a job lands */
:where([data-look="clean"], [data-look="clean"] *).ui-agq__bin { z-index: 1; padding: 12px; border-radius: var(--tc-radius-md, var(--_tc-radius-md)); background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); box-shadow: inset 0 0 0 0.5px var(--tc-border-default, var(--_tc-border-default)); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__bin-icon { position: absolute; top: 12px; left: 12px; display: grid; place-items: center; width: 20px; height: 20px; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__bin[data-kind="done"] .ui-agq__bin-icon { background: var(--tc-status-success-bg, var(--_tc-status-success-bg)); color: var(--tc-status-success-fg, var(--_tc-status-success-fg)); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__bin[data-kind="failed"] .ui-agq__bin-icon { background: var(--tc-status-danger-bg, var(--_tc-status-danger-bg)); color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__bin-label { position: absolute; top: 14px; left: 40px; font-size: var(--tc-font-size-2xs, var(--_tc-font-size-2xs)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); letter-spacing: 0.5px; text-transform: uppercase; color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__bin-count { position: absolute; left: 12px; bottom: 10px; font-size: var(--tc-font-size-2xl, var(--_tc-font-size-2xl)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-display-sm, var(--_tc-line-height-display-sm)); letter-spacing: -0.2px; color: var(--tc-text-strong, var(--_tc-text-strong)); }
.ui-agq__bin[data-kind="failed"] .ui-agq__bin-count { color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
.ui-agq__bin-hit { position: absolute; top: 12px; left: 12px; width: 20px; height: 20px; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); opacity: 0; pointer-events: none; animation: ui-agq-hit var(--tc-duration-reveal, var(--_tc-duration-reveal)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate)) var(--tc-duration-slower, var(--_tc-duration-slower)); }
.ui-agq__bin[data-kind="done"] .ui-agq__bin-hit { box-shadow: 0 0 0 1px var(--tc-status-success-fg, var(--_tc-status-success-fg)); }
.ui-agq__bin[data-kind="failed"] .ui-agq__bin-hit { box-shadow: 0 0 0 1px var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
.ui-agq__flow[data-narrow] .ui-agq__who-text { display: none; }
/* Phones: Done and Failed side by side – the mark, the count, the word */
.ui-agq__flow[data-narrow] .ui-agq__bin { display: flex; align-items: center; gap: 6px; padding: 0 10px; }
.ui-agq__flow[data-narrow] :is(.ui-agq__bin-icon, .ui-agq__bin-label, .ui-agq__bin-count) { position: static; }
.ui-agq__flow[data-narrow] .ui-agq__bin-icon { flex: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__flow[data-narrow] .ui-agq__bin-count { order: 1; font-size: var(--tc-font-size-xl, var(--_tc-font-size-xl)); line-height: var(--tc-line-height-relaxed, var(--_tc-line-height-relaxed)); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__flow[data-narrow] .ui-agq__bin-count { order: 1; font-size: var(--tc-font-size-lg-plus, var(--_tc-font-size-lg-plus)); line-height: var(--tc-line-height-loose, var(--_tc-line-height-loose)); }
.ui-agq__flow[data-narrow] .ui-agq__bin-label { order: 2; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ui-agq__flow[data-narrow] .ui-agq__bin-hit { top: 10px; }
/* ----- One job: a card while it waits up front, a square in the backlog, a bar while it runs ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-agq [data-kind] { --k-bg: var(--tc-agent-queue-agent-bg); --k-edge: var(--tc-agent-queue-agent-edge); --k-ink: var(--tc-agent-queue-agent-ink); --k-sq: var(--tc-agent-queue-agent-sq); }
/* ----- One job: a card while it waits up front, a square in the backlog, a bar while it runs ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-agq [data-kind] { --k-bg: var(--tc-fill-default, var(--_tc-fill-default)); --k-edge: var(--tc-border-strong, var(--_tc-border-strong)); --k-ink: var(--tc-text-secondary, var(--_tc-text-secondary)); --k-sq: var(--tc-fill-strong, var(--_tc-fill-strong)); }
.ui-agq [data-kind="llm"] { --k-bg: var(--tc-agent-queue-llm-bg); --k-edge: var(--tc-agent-queue-llm-edge); --k-ink: var(--tc-agent-queue-llm-ink); --k-sq: var(--tc-agent-queue-llm-sq); }
.ui-agq [data-kind="tool"] { --k-bg: var(--tc-agent-queue-tool-bg); --k-edge: var(--tc-agent-queue-tool-edge); --k-ink: var(--tc-agent-queue-tool-ink); --k-sq: var(--tc-agent-queue-tool-sq); }
.ui-agq [data-kind="human"] { --k-bg: var(--tc-agent-queue-human-bg); --k-edge: var(--tc-agent-queue-human-edge); --k-ink: var(--tc-agent-queue-human-ink); --k-sq: var(--tc-agent-queue-human-sq); }
.ui-agq .ui-agq__job:is([data-status="failed"], [data-flash]) { --k-bg: var(--tc-status-danger-bg, var(--_tc-status-danger-bg)); --k-edge: var(--tc-status-danger-border, var(--_tc-status-danger-border)); --k-ink: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); --k-sq: var(--tc-status-danger-border, var(--_tc-status-danger-border)); }
.ui-agq .ui-agq__job[data-status="done"] { --k-bg: var(--tc-status-success-bg, var(--_tc-status-success-bg)); --k-edge: var(--tc-status-success-border, var(--_tc-status-success-border)); --k-ink: var(--tc-status-success-fg, var(--_tc-status-success-fg)); --k-sq: var(--tc-status-success-border, var(--_tc-status-success-border)); }
.ui-agq__jobs { position: absolute; inset: 0; pointer-events: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__job {
  z-index: 1;
  display: block;
  overflow: hidden;
  border-radius: var(--tc-radius-md, var(--_tc-radius-md));
  background: var(--tc-agent-queue-card-bg);
  box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised));
  pointer-events: auto;
  transition: translate var(--tc-duration-slowest, var(--_tc-duration-slowest)) var(--tc-ease-out, var(--_tc-ease-out)), width var(--tc-duration-slowest, var(--_tc-duration-slowest)) var(--tc-ease-out, var(--_tc-ease-out)), height var(--tc-duration-slowest, var(--_tc-duration-slowest)) var(--tc-ease-out, var(--_tc-ease-out)), border-radius var(--tc-duration-slowest, var(--_tc-duration-slowest)) var(--tc-ease-out, var(--_tc-ease-out)), background-color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)), opacity var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard));
  animation: ui-agq-drop var(--tc-duration-slowest, var(--_tc-duration-slowest)) var(--tc-ease-move, var(--_tc-ease-move)) backwards;
}
.ui-agq__job:hover,
.ui-agq__job[data-open] { z-index: 2; box-shadow: 0 0 0 1px var(--k-edge), var(--tc-shadow-control, var(--_tc-shadow-control)); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__job {
  z-index: 1;
  display: block;
  overflow: hidden;
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised));
  pointer-events: auto;
  transition: translate var(--tc-duration-slowest, var(--_tc-duration-slowest)) var(--tc-ease-emphasized, var(--_tc-ease-emphasized)), width var(--tc-duration-slowest, var(--_tc-duration-slowest)) var(--tc-ease-emphasized, var(--_tc-ease-emphasized)), height var(--tc-duration-slowest, var(--_tc-duration-slowest)) var(--tc-ease-emphasized, var(--_tc-ease-emphasized)), border-radius var(--tc-duration-slowest, var(--_tc-duration-slowest)) var(--tc-ease-emphasized, var(--_tc-ease-emphasized)), background-color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)), opacity var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard));
  animation: ui-agq-drop var(--tc-duration-slowest, var(--_tc-duration-slowest)) var(--tc-ease-move, var(--_tc-ease-move)) backwards;
}
.ui-agq__job:focus-visible { z-index: 2; outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: 1px; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__job[data-flash] { background: var(--k-bg); box-shadow: 0 0 0 1px var(--k-edge); animation: ui-agq-drop var(--tc-duration-slowest, var(--_tc-duration-slowest)) var(--tc-ease-move, var(--_tc-ease-move)) backwards, ui-agq-shake var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__job[data-shape="square"] { border-radius: var(--tc-radius-2xs, var(--_tc-radius-2xs)); background: var(--k-sq); box-shadow: inset 0 0 0 1px var(--k-edge); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__job[data-flash] { background: var(--k-bg); box-shadow: 0 0 0 0.5px var(--k-edge); animation: ui-agq-drop var(--tc-duration-slowest, var(--_tc-duration-slowest)) var(--tc-ease-move, var(--_tc-ease-move)) backwards, ui-agq-shake var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__job[data-shape="square"] { border-radius: var(--tc-radius-2xs, var(--_tc-radius-2xs)); background: var(--k-sq); box-shadow: inset 0 0 0 var(--tc-hairline, var(--_tc-hairline)) var(--k-edge); }
.ui-agq__job[data-shape="square"][data-priority="high"] { box-shadow: inset 0 0 0 1.5px var(--tc-status-warning-solid, var(--_tc-status-warning-solid)); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__job[data-shape="square"]:hover { box-shadow: inset 0 0 0 1.5px var(--k-ink); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__job[data-shape="square"]:hover { box-shadow: inset 0 0 0 1px var(--k-ink); }
.ui-agq__job[data-shape="bar"] { box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)); }
/* Landing in a bin: it shrinks on its way and fades as it arrives */
.ui-agq__job[data-shape="gone"] { z-index: 0; border-radius: var(--tc-radius-2xs, var(--_tc-radius-2xs)); background: var(--k-sq); box-shadow: none; opacity: 0; pointer-events: none; transition: translate var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)), width var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)), height var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)), border-radius var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-standard, var(--_tc-ease-standard)), background-color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)) var(--tc-duration-base, var(--_tc-duration-base)); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__job-in { position: absolute; inset: 0; display: flex; align-items: center; gap: 6px; padding: 0 9px 0 6px; white-space: nowrap; opacity: 1; transition: opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)) var(--tc-duration-fast, var(--_tc-duration-fast)); }
/* Landing in a bin: it shrinks on its way and fades as it arrives */
:where([data-look="clean"], [data-look="clean"] *).ui-agq__job-in { position: absolute; inset: 0; display: flex; align-items: center; gap: 6px; padding: 0 8px 0 6px; white-space: nowrap; opacity: 1; transition: opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)) var(--tc-duration-fast, var(--_tc-duration-fast)); }
.ui-agq__job:is([data-shape="square"], [data-shape="gone"]) .ui-agq__job-in { opacity: 0; transition: opacity var(--tc-duration-quick, var(--_tc-duration-quick)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__job-icon { display: grid; flex: none; place-items: center; width: 18px; height: 18px; border-radius: var(--tc-radius-xs, var(--_tc-radius-xs)); background: var(--k-bg); color: var(--k-ink); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__job-icon[data-logo] { background: var(--tc-agent-queue-card-bg); box-shadow: 0 0 0 1px var(--tc-border-default, var(--_tc-border-default)); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__job-icon { display: grid; flex: none; place-items: center; width: 18px; height: 18px; border-radius: var(--tc-radius-xs, var(--_tc-radius-xs)); background: var(--k-bg); color: var(--k-ink); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__job-icon[data-logo] { background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)); }
.ui-agq__job-icon > svg { width: 11px; height: 11px; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__job-name { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm-plus, var(--_tc-font-size-sm-plus)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-primary, var(--_tc-text-primary)); text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__badge { display: inline-flex; flex: none; align-items: center; gap: 2px; height: 16px; padding: 0 4px; border-radius: var(--tc-radius-badge, var(--_tc-radius-badge)); font-size: var(--tc-font-size-2xs, var(--_tc-font-size-2xs)); font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__job-name { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-primary, var(--_tc-text-primary)); text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__badge { display: inline-flex; flex: none; align-items: center; gap: 2px; height: 16px; padding: 0 4px; border-radius: var(--tc-radius-badge, var(--_tc-radius-badge)); font-size: var(--tc-font-size-2xs, var(--_tc-font-size-2xs)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); font-variant-numeric: tabular-nums; }
.ui-agq__badge[data-kind="high"] { width: 16px; padding: 0; justify-content: center; background: var(--tc-status-warning-bg, var(--_tc-status-warning-bg)); color: var(--tc-status-warning-fg, var(--_tc-status-warning-fg)); }
.ui-agq__badge[data-kind="retry"] { background: var(--tc-status-danger-bg, var(--_tc-status-danger-bg)); color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__job-meta { flex: none; font-size: var(--tc-font-size-xs-plus, var(--_tc-font-size-xs-plus)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__job-meta { flex: none; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; }
.ui-agq__job[data-status="running"] .ui-agq__job-meta { color: var(--k-ink); }
.ui-agq__job[data-flash] :is(.ui-agq__job-name, .ui-agq__job-meta) { color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
/* The bar: a tint that grows with the progress, a sheen sweeping along and a glowing front edge */
:where([data-look="standard"], [data-look="standard"] *).ui-agq__fill { position: absolute; inset: 0; border-radius: inherit; background: var(--k-bg); box-shadow: inset 0 0 0 1px var(--k-edge); clip-path: inset(0 calc((1 - var(--p)) * 100%) 0 0 round 8px); opacity: 0; transition: clip-path var(--tc-duration-moderate, var(--_tc-duration-moderate)) linear, opacity var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)), background-color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__job[data-shape="bar"] .ui-agq__fill { opacity: 1; animation: ui-agq-grow var(--tc-duration-slowest, var(--_tc-duration-slowest)) var(--tc-ease-move, var(--_tc-ease-move)) backwards; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__job[data-shape="bar"] .ui-agq__fill::before { --tc-agent-queue-sheen: var(--tc-agent-queue-card-bg); }
.ui-agq__job[data-shape="bar"] .ui-agq__fill::after { transition: opacity var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)); content: ""; position: absolute; top: 0; bottom: 0; left: calc(var(--p) * 100% - 28px); width: 28px; background: linear-gradient(90deg, transparent, var(--k-edge)); animation: ui-agq-glow var(--tc-duration-reveal-slow, var(--_tc-duration-reveal-slow)) var(--tc-ease-in-out, var(--_tc-ease-in-out)) 6 alternate; }
/* The bar: a tint that grows with the progress, a sheen sweeping along and a glowing front edge */
:where([data-look="clean"], [data-look="clean"] *).ui-agq__fill { position: absolute; inset: 0; border-radius: inherit; background: var(--k-bg); box-shadow: inset 0 0 0 0.5px var(--k-edge); clip-path: inset(0 calc((1 - var(--p)) * 100%) 0 0 round 6px); opacity: 0; transition: clip-path var(--tc-duration-moderate, var(--_tc-duration-moderate)) linear, opacity var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)), background-color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__job[data-shape="bar"] .ui-agq__fill { opacity: 1; animation: ui-agq-grow-clean var(--tc-duration-slowest, var(--_tc-duration-slowest)) var(--tc-ease-move, var(--_tc-ease-move)) backwards; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__job[data-shape="bar"] .ui-agq__fill::before { --tc-agent-queue-sheen: var(--tc-surface-raised, var(--_tc-surface-raised)); }
/* The sheen: a 60px band moved on transform (composited), a few passes and then it rests (2.2.2) */
.ui-agq__job[data-shape="bar"] .ui-agq__fill::before { transition: opacity var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)); content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, var(--tc-agent-queue-sheen), transparent) 0 0 / 60px 100% no-repeat; opacity: 0.7; transform: translateX(-60px); animation: ui-agq-sweep var(--tc-duration-shimmer, var(--_tc-duration-shimmer)) linear 3; }
.ui-agq__job[data-shape="gone"] .ui-agq__fill { opacity: 0; }
/* ----- The card on a job ----- */
/* The card on a job: the popover surface; it can be hovered (1.4.13) */
.ui-agq__pop { z-index: 5; display: grid; gap: 10px; padding: 12px; border-radius: var(--tc-menu-radius, var(--_tc-menu-radius)); background: var(--tc-menu-bg, var(--_tc-menu-bg)); box-shadow: var(--tc-menu-shadow, var(--_tc-menu-shadow)); transition: translate var(--tc-duration-slowest, var(--_tc-duration-slowest)) var(--tc-ease-move, var(--_tc-ease-move)); animation: ui-agq-open var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
/* ----- The card on a job ----- */
.ui-agq__pop-head { display: flex; align-items: center; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__pop-icon { display: grid; flex: none; place-items: center; width: 28px; height: 28px; margin-right: 10px; border-radius: var(--tc-radius-md, var(--_tc-radius-md)); background: var(--k-bg); box-shadow: inset 0 0 0 1px var(--k-edge); color: var(--k-ink); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__pop-icon[data-logo] { background: var(--tc-agent-queue-card-bg); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__pop-icon { display: grid; flex: none; place-items: center; width: 28px; height: 28px; margin-right: 10px; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); background: var(--k-bg); color: var(--k-ink); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__pop-icon[data-logo] { background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)); }
.ui-agq__pop-icon > svg { width: 15px; height: 15px; }
.ui-agq__pop-who { display: grid; flex: 1; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__pop-name { overflow: hidden; font-size: var(--tc-font-size-md-plus, var(--_tc-font-size-md-plus)); font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold)); line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug)); color: var(--tc-text-strong, var(--_tc-text-strong)); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__pop-name { overflow: hidden; font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug)); color: var(--tc-text-strong, var(--_tc-text-strong)); white-space: nowrap; text-overflow: ellipsis; }
.ui-agq__pop-kind { overflow: hidden; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; text-overflow: ellipsis; }
.ui-agq__pop-head .ui-agq__pill { height: var(--tc-pill-h, var(--_tc-pill-h)); margin-left: 8px; padding: 0 var(--tc-pill-px, var(--_tc-pill-px)); font-size: var(--tc-pill-font-size, var(--_tc-pill-font-size)); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__close { display: grid; flex: none; place-items: center; width: 28px; height: 28px; margin: -2px -4px 0 4px; border-radius: var(--tc-radius-md, var(--_tc-radius-md)); color: var(--tc-text-muted, var(--_tc-text-muted)); transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__close { display: grid; flex: none; place-items: center; width: 28px; height: 28px; margin: -2px -4px 0 4px; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); color: var(--tc-text-muted, var(--_tc-text-muted)); transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-agq__close:hover { background: var(--tc-fill-default, var(--_tc-fill-default)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__pop-stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 12px; padding: 10px 12px; border-radius: var(--tc-radius-lg, var(--_tc-radius-lg)); background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__pop-stats dt { font-size: var(--tc-font-size-xs, var(--_tc-font-size-xs)); line-height: 14px; color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__pop-stats dd { overflow: hidden; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold)); line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug)); color: var(--tc-text-primary, var(--_tc-text-primary)); white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__pop-error { display: flex; gap: 8px; padding: 8px 10px; border-radius: var(--tc-radius-lg, var(--_tc-radius-lg)); background: var(--tc-status-danger-bg, var(--_tc-status-danger-bg)); font-size: var(--tc-font-size-sm-plus, var(--_tc-font-size-sm-plus)); line-height: 17px; color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__pop-error > svg { margin-top: 2.5px; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__pop-actions { display: flex; gap: 6px; }
/* ----- The chart ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-agq__chart { padding: 14px 16px 12px; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__chart-head { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__chart-title { font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__pop-stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 12px; padding: 8px 10px; border-radius: var(--tc-radius-md, var(--_tc-radius-md)); background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); box-shadow: inset 0 0 0 var(--tc-hairline, var(--_tc-hairline)) var(--tc-border-default, var(--_tc-border-default)); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__pop-stats dt { font-size: var(--tc-font-size-2xs, var(--_tc-font-size-2xs)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); letter-spacing: 0.5px; text-transform: uppercase; color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__pop-stats dd { overflow: hidden; font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); color: var(--tc-text-primary, var(--_tc-text-primary)); white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__pop-error { display: flex; gap: 8px; padding: 8px 10px; border-radius: var(--tc-radius-md, var(--_tc-radius-md)); background: var(--tc-status-danger-bg, var(--_tc-status-danger-bg)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__pop-error > svg { margin-top: 2px; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__pop-actions { display: flex; gap: 8px; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__pop-actions .ui-agq__btn > svg { width: 12px; height: 12px; }
/* ----- The chart ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-agq__chart { padding: 12px 16px 12px; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__chart-head { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__chart-title { font-size: var(--tc-font-size-2xs, var(--_tc-font-size-2xs)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); letter-spacing: 0.5px; text-transform: uppercase; color: var(--tc-text-muted, var(--_tc-text-muted)); }
.ui-agq__plot { position: relative; margin-left: ${GUTTER}px; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__grid { position: absolute; left: -6px; right: 0; bottom: calc(var(--v) / var(--tc-agent-queue-ymax) * 100%); height: 1px; background: var(--tc-border-subtle, var(--_tc-border-subtle)); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__grid[data-zero] { background: var(--tc-border-default, var(--_tc-border-default)); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__grid > span { position: absolute; right: calc(100% + 8px); top: -7px; font-size: var(--tc-font-size-xs, var(--_tc-font-size-xs)); line-height: 14px; color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__grid { position: absolute; left: -6px; right: 0; bottom: calc(var(--v) / var(--tc-agent-queue-ymax) * 100%); height: 0.5px; background: var(--tc-border-default, var(--_tc-border-default)); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__grid[data-zero] { background: var(--tc-border-strong, var(--_tc-border-strong)); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__grid > span { position: absolute; right: calc(100% + 8px); top: -8px; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; }
.ui-agq__svg { position: absolute; inset: 0; overflow: hidden; }
/* Drawn in queue-depth units and scaled by the gliding --tc-agent-queue-ymax, so a rescale never jumps */
.ui-agq__scaled { transform: translateY(calc(var(--h) * 1px)) scaleY(calc(-1 * var(--h) / var(--tc-agent-queue-ymax))); }
.ui-agq__stop[data-at="top"] { stop-color: var(--tc-agent-queue-depth-fade); }
.ui-agq__stop[data-at="bottom"] { stop-color: var(--tc-agent-queue-depth-fill); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__line { fill: none; stroke: var(--tc-agent-queue-depth); stroke-width: 1.5; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__bp { stroke: var(--tc-text-disabled, var(--_tc-text-disabled)); stroke-width: 1; stroke-dasharray: 4 4; vector-effect: non-scaling-stroke; opacity: 0.8; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__line { fill: none; stroke: var(--tc-agent-queue-depth); stroke-width: 1.25; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__bp { stroke: var(--tc-text-disabled, var(--_tc-text-disabled)); stroke-width: 1; stroke-dasharray: 3 3; vector-effect: non-scaling-stroke; }
.ui-agq__band rect { fill: var(--tc-status-warning-solid, var(--_tc-status-warning-solid)); opacity: 0.07; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__bp-label { position: absolute; right: calc(100% + 8px); bottom: calc(var(--v) / var(--tc-agent-queue-ymax) * 100% - 7px); font-size: var(--tc-font-size-xs, var(--_tc-font-size-xs)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: 14px; color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__dot { position: absolute; right: -3.5px; bottom: calc(var(--v) / var(--tc-agent-queue-ymax) * 100% - 3.5px); width: 7px; height: 7px; border-radius: 50%; background: var(--tc-agent-queue-depth); box-shadow: 0 0 0 3px var(--tc-agent-queue-card-bg); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__bp-label { position: absolute; right: calc(100% + 8px); bottom: calc(var(--v) / var(--tc-agent-queue-ymax) * 100% - 8px); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__dot { position: absolute; right: -3px; bottom: calc(var(--v) / var(--tc-agent-queue-ymax) * 100% - 3px); width: 6px; height: 6px; border-radius: 50%; background: var(--tc-agent-queue-depth); box-shadow: 0 0 0 3px var(--tc-surface-raised, var(--_tc-surface-raised)); }
.ui-agq[data-state="live"] .ui-agq__dot::after, .ui-agq[data-state="limited"] .ui-agq__dot::after { content: ""; position: absolute; inset: 0; border-radius: 50%; background: var(--tc-agent-queue-depth); animation: ui-agq-ping var(--tc-duration-shimmer, var(--_tc-duration-shimmer)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate)) 3; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__axis { display: flex; justify-content: space-between; margin: 6px 0 0 ${GUTTER}px; font-size: var(--tc-font-size-xs, var(--_tc-font-size-xs)); line-height: 14px; color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__axis { display: flex; justify-content: space-between; margin: 6px 0 0 ${GUTTER}px; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; }
.ui-agq__sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
/* ----- Narrow ----- */
@container ui-agq (max-width: 560px) {
:where([data-look="standard"], [data-look="standard"] *).ui-agq__head { flex-wrap: wrap; row-gap: 6px; padding: 4px 4px 8px 10px; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__name { display: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__stats { grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: 12px; padding: 12px 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__stat { padding: 0 12px; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__stat:nth-child(odd) { padding-left: 16px; border-left: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__stat dd { font-size: var(--tc-font-size-lg-plus, var(--_tc-font-size-lg-plus)); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__stat:nth-child(3) { border-left: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__chart { padding: 12px 12px 10px; }
}
@container ui-agq (max-width: 440px) {
  /* The controls get a row of their own: Pause on the left, the workers on the right */
:where([data-look="standard"], [data-look="standard"] *).ui-agq__tools { flex-basis: 100%; justify-content: space-between; margin-left: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__head { padding-right: 8px; }
}
/* ----- Narrow ----- */
@container ui-agq (max-width: 560px) {
:where([data-look="clean"], [data-look="clean"] *).ui-agq__head { flex-wrap: wrap; row-gap: 10px; padding: 10px 12px; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__name { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__stats { grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: 10px; padding: 10px 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__stat { padding: 0 12px; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__stat:nth-child(odd) { padding-left: 16px; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__stat:nth-child(3) { border-left: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__chart { padding: 12px 12px 10px; }
}
@container ui-agq (max-width: 440px) {
  /* The controls get a row of their own: Pause on the left, the workers on the right */
:where([data-look="clean"], [data-look="clean"] *).ui-agq__tools { flex-basis: 100%; justify-content: space-between; margin-left: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__stat dt { letter-spacing: 0.2px; }
}
/* Paused by a rate limit: the bar keeps its colors, dims a little and stops – no sheen, no glow */
.ui-agq__job[data-halted] .ui-agq__fill { opacity: 0.55; }
.ui-agq__job[data-halted] .ui-agq__fill::before, .ui-agq__job[data-halted] .ui-agq__fill::after { opacity: 0; animation-play-state: paused; }
.ui-agq__job[data-halted] .ui-agq__job-meta { color: var(--tc-text-muted, var(--_tc-text-muted)); }
@keyframes ui-agq-drop { from { opacity: 0; transform: translateY(-10px) scale(0.6); } }
@keyframes ui-agq-slot { from { opacity: 0; transform: translateX(-8px); } }
@keyframes ui-agq-grow { from { clip-path: inset(0 100% 0 0 round 8px); } }
@keyframes ui-agq-grow-clean { from { clip-path: inset(0 100% 0 0 round 6px); } }
@keyframes ui-agq-sweep { to { transform: translateX(100%); } }
@keyframes ui-agq-glow { from { opacity: 0.45; } to { opacity: 1; } }
@keyframes ui-agq-pulse { 50% { opacity: 0.35; } }
@keyframes ui-agq-open { from { opacity: 0; transform: translateY(-4px) scale(0.97); } }
@keyframes ui-agq-hit { 0% { opacity: 0.45; transform: scale(1); } 100% { opacity: 0; transform: scale(1.45); } }
@keyframes ui-agq-ping { 0% { opacity: 0.5; transform: scale(1); } 100% { opacity: 0; transform: scale(2.8); } }
@keyframes ui-agq-shake { 20% { transform: translateX(-3px); } 40% { transform: translateX(3px); } 60% { transform: translateX(-2px); } 80% { transform: translateX(1px); } }
@media (prefers-reduced-motion: reduce) {
  .ui-agq *, .ui-agq *::before, .ui-agq *::after { animation: none !important; transition: none !important; }
}
`;
