import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { live } from "lit/directives/live.js";
import { ref } from "lit/directives/ref.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { FocusRescueController, rescueFocus } from "./internal/controllers";

/*
 * <tc-agent-queue> – the Lit port of src/components/agent-queue.tsx: the work waiting for your agents, and how fast it
 * moves. Jobs flow from left to right: they wait in the queue, a free worker pulls the front one, runs it, and it
 * lands in Done – or in Failed, or back in the queue for another try.
 *   · the next jobs wait as small cards; the rest of the backlog is a heap of tinted squares (12px, 24px apart, each
 *     taking clicks across a 24px box through a ::before hit area – WCAG 2.5.8)
 *   · every worker slot shows its running job as a growing bar; a finished job flies into Done, a failed one flashes
 *   · when the provider rate-limits, the workers pause in amber with a countdown
 *   · a live chart of the queue depth over the last minutes, with the backpressure line and the rate-limited stretches
 *   · hover a job for a small card – click it (or press Enter) to pin it, with Move to front and Cancel
 *   · Pause/Resume and a – N + stepper for the number of workers, when `pausable` / `stepper` are set
 * All motion is CSS transitions plus one requestAnimationFrame loop for the numbers (it sleeps while nothing moves
 * and while the queue is off-screen). Clean is one quiet white card with hairlines instead of the card on a tray.
 *
 *   <tc-agent-queue .jobs=${jobs} .workers=${workers} pausable></tc-agent-queue>
 */

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
  /** A small mark, e.g. the tool's logo (cloned) – defaults to a glyph for the kind */
  icon?: Element;
  /** What went wrong – shown in its card */
  error?: string;
};

export type QueueWorker = {
  id: string;
  name: string;
  /** One muted line under the name, e.g. the model or "Worker 2" */
  detail?: string;
  /** A small mark (cloned) – defaults to the initials */
  icon?: Element;
};

export type QueueRateLimit = {
  from: number;
  until: number;
  /** e.g. "Token limit · 2M/min" – shown with the countdown */
  label?: string;
};

/* ---------- Helpers ---------- */

const KIND: Record<QueueJobKind, string> = { llm: "LLM call", tool: "Tool call", agent: "Sub-agent", human: "Human review" };
const STATUS: Record<QueueJobStatus, string> = { queued: "Waiting", running: "Running", done: "Done", failed: "Failed" };
const RANK: Record<QueueJobPriority, number> = { high: 0, normal: 1, low: 2 };
/** Motion: how long a job takes to land in a bin, how long a flash lasts, how long a fresh high-priority job waits before it jumps */
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
const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

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
let uidCount = 0;

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
  well: Box;
  grid: { x: number; y: number; cols: number; rows: number; step: number };
  slots: Box[];
  rail: { x: number; y: number; w: number; h: number };
  done: Box;
  failed: Box;
};
/** Backlog squares: 12px, 24px apart, each taking clicks across a 24px box (WCAG 2.5.8) */
const SQ = 12;
const STEP = 24;
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
/** A box of the flow's layout, placed */
const boxStyle = (b: Box) => styleMap({ translate: `${b.x}px ${b.y}px`, width: `${b.w}px`, height: `${b.h}px` });

/* ---------- Icons ---------- */

/* Lucide (ISC, lucide.dev): gallery-vertical-end (the queue), pause, play, plus, minus, check, x, triangle-alert, rotate-cw, arrow-up and the kind glyphs sparkles, wrench, bot, user */
const S = (body: ReturnType<typeof svg>, size = 14, w = 1.8) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width=${w} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const queueGlyph = () => S(svg`<path d="M7 2h10"></path><path d="M5 6h14"></path><rect width="18" height="12" x="3" y="10" rx="2"></rect>`, 16);
const pauseIcon = () => S(svg`<rect x="14" y="3" width="5" height="18" rx="1"></rect><rect x="5" y="3" width="5" height="18" rx="1"></rect>`);
const playIcon = () => S(svg`<path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"></path>`);
const plusIcon = () => S(svg`<path d="M5 12h14"></path><path d="M12 5v14"></path>`);
const minusIcon = () => S(svg`<path d="M5 12h14"></path>`);
const tickIcon = () => S(svg`<path d="M20 6 9 17l-5-5"></path>`, 12, 2.4);
const crossIcon = (size = 12, w = 2.4) => S(svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`, size, w);
const alertIcon = () =>
  S(svg`<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4" stroke-width="2.2"></path><path d="M12 17h.01" stroke-width="2.6"></path>`, 12, 2);
const retryIcon = () => S(svg`<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path>`, 10, 2.6);
const upIcon = () => S(svg`<path d="m5 12 7-7 7 7"></path><path d="M12 19V5"></path>`, 10, 2.8);
const kindGlyph = (kind: QueueJobKind) =>
  kind === "llm"
    ? S(
        svg`<path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"></path><path d="M20 2v4"></path><path d="M22 4h-4"></path><circle cx="4" cy="20" r="2"></circle>`,
        12,
        2,
      )
    : kind === "tool"
      ? S(
          svg`<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"></path>`,
          12,
          2,
        )
      : kind === "agent"
        ? S(svg`<path d="M12 8V4H8"></path><rect width="16" height="12" x="4" y="8" rx="2"></rect><path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path>`, 12, 2)
        : S(svg`<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>`, 12, 2);

type Shape = "chip" | "square" | "bar" | "gone";
type Placed = { job: QueueJob; shape: Shape; box: Box; index?: number; flash: boolean; p?: number };
type Num = { el: HTMLElement | null; shown: number; target: number; fmt: (n: number) => string };

/* ---------- Memory: what each job was last time – so we can see it finish, fail, retry or arrive ---------- */

type Seen = { status: QueueJobStatus; attempt: number; first: number; fresh: boolean; worker?: string };
type Memory = { seen: Map<string, Seen>; gone: Map<string, number>; flash: Map<string, number>; limited: boolean; over: boolean; msg: string };
/** The real-time clock for motion – read only in timers, after updates and in the frame loop, never while rendering */
const realTime = () => performance.now();
/** The wall clock for our own `now` – read on connect and by the frame loop, never while rendering */
const wallClock = () => Date.now();
const EMPTY_MEMORY: Memory = { seen: new Map(), gone: new Map(), flash: new Map(), limited: false, over: false, msg: "" };
type MemoryInput = { jobs: QueueJob[]; mounted: boolean; limited: boolean; limitLeft: number; waiting: number; backpressure?: number };

/**
 * The memory after seeing `jobs` at time `at` – a pure function: it never changes `m`, and returns `m` itself when
 * nothing changed. Rendering calls it with the last clock reading; after the update it runs again with the real time
 * and the result is kept.
 */
function remember(m: Memory, at: number, input: MemoryInput): Memory {
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
  pct([...jobs.filter((j) => j.startedAt !== undefined && j.status !== "queued" && j.startedAt > now - MINUTE).map((j) => j.startedAt! - j.enqueuedAt), ...queued.map((j) => now - j.enqueuedAt)], 0.95);
/** Times under 10s show tenths, so they need the finer clock */
const needsTenths = (queued: QueueJob[], running: QueueJob[], now: number) => queued.some((j) => now - j.enqueuedAt < 10_000) || running.some((j) => now - (j.startedAt ?? now) < 10_000);

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

/** The next clock reading that changes what rendering draws: a rate limit's edge, or a finished job leaving the throughput minute */
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

type LoopState = {
  needClock: boolean;
  ymax: number;
  nextAt: number;
  fine: (clock: number) => boolean;
  /** Repaints what only moved – the chart every frame, the times when `text` – and says false when the chart needs a render */
  paint: (clock: number, text: boolean) => boolean;
};

/**
 * The work waiting for your agents, and how fast it moves: the queue, the workers, Done and Failed, and a depth chart.
 * @tag tc-agent-queue
 * @fires tc-paused-change - Pause or Resume was pressed ({ paused: boolean }); cancelable
 * @fires tc-concurrency-change - The worker stepper asked for more or fewer workers ({ workers: number })
 * @fires tc-open-change - A job's card was pinned or closed ({ id: string | null, job?: QueueJob }); cancelable
 * @fires tc-promote - Move to front was pressed in a waiting job's card ({ job: QueueJob })
 * @fires tc-cancel - Cancel was pressed in a job's card ({ job: QueueJob })
 */
export class TcAgentQueue extends TcElement {
  static override ui = "agq";

  /** Waiting and running jobs, plus finished ones for as long as the chart should count them */
  @property({ attribute: false }) accessor jobs: QueueJob[] = [];
  /** The worker slots – their number is the concurrency */
  @property({ attribute: false }) accessor workers: QueueWorker[] = [];
  /** The clock in epoch ms – unset, the element keeps its own while there is work */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** Stretches when the provider rate-limits – while one is active the workers show as paused */
  @property({ attribute: false }) accessor rateLimits: QueueRateLimit[] = [];
  /** The queue is paused – no new jobs start */
  @property({ type: Boolean, reflect: true }) accessor paused = false;
  /** Shows a Pause/Resume button */
  @property({ type: Boolean }) accessor pausable = false;
  /** Shows a – N + stepper for the number of workers */
  @property({ type: Boolean }) accessor stepper = false;
  @property({ type: Number, attribute: "min-concurrency" }) accessor minConcurrency = 1;
  @property({ type: Number, attribute: "max-concurrency" }) accessor maxConcurrency = 8;
  /** A depth that means trouble – drawn as a dashed line on the chart; above it Waiting turns amber */
  @property({ type: Number }) accessor backpressure: number | undefined = undefined;
  /** How far back the chart looks, in ms */
  @property({ type: Number }) accessor range = 2 * MINUTE;
  /** Counts since the start, when `jobs` only holds the recent ones */
  @property({ attribute: false }) accessor totals: { done?: number; failed?: number } | undefined = undefined;
  /** The id of the job whose card is pinned, or null */
  @property({ attribute: false }) accessor openId: string | null = null;
  /** Shows "Move to front" in a waiting job's card */
  @property({ type: Boolean }) accessor promotable = false;
  /** Shows "Cancel" in a waiting or running job's card */
  @property({ type: Boolean }) accessor cancellable = false;
  @property() accessor heading = "Queue";
  /** The queue's name, muted next to the heading */
  @property() accessor name: string | undefined = undefined;

  @state() private accessor width = 0;
  @state() private accessor tick = 0;
  @state() private accessor real = 0;
  @state() private accessor hover: string | null = null;
  @state() private accessor popH = 120;
  @state() private accessor active: string | null = null;

  private gradId = `ui-agq-${++uidCount}`;
  private mem: Memory = EMPTY_MEMORY;
  private mounted = false;
  private memInput: Omit<MemoryInput, "mounted"> | null = null;
  private nums = new Map<string, Num>();
  private numTargets: [string, number, (n: number) => string][] = [];
  private numRefs = new Map<string, (el?: Element) => void>();
  private jobEls = new Map<string, HTMLButtonElement>();
  private jobRefs = new Map<string, (el?: Element) => void>();
  private loop: LoopState | null = null;
  private scene: { placed: Placed[]; chartAt: (now: number) => ReturnType<ReturnType<typeof chartModel>>; chart: ReturnType<ReturnType<typeof chartModel>>; card?: Placed; queued: QueueJob[]; waiting: number; limited: boolean; activeLimit?: QueueRateLimit; memory: Memory } | null = null;
  private raf = 0;
  private visible = true;
  private lastFrame = 0;
  private lastClock = 0;
  private asked: LoopState | null = null;
  private shownMax = NaN;
  private io?: IntersectionObserver;
  private ro?: ResizeObserver;
  private popRo?: ResizeObserver;
  private popFor: string | undefined = undefined;
  private dueTimer = 0;
  private peekTimer = 0;
  private peekHeld = false;
  private openKey = "";
  private escOn = false;
  private awayOn = false;

  constructor() {
    super();
    // A job that leaves (cancelled, finished, moved off the grid) while focused hands focus to the job in the tab order
    new FocusRescueController(this, () => this.querySelector('.ui-agq__job[tabindex="0"]') ?? this.querySelector(".ui-agq__btn"));
  }

  override connectedCallback() {
    super.connectedCallback();
    // Our own clock: read before the first render, then by the frame loop when something discrete is due
    if (this.now === undefined && !this.tick) this.tick = wallClock();
    document.addEventListener("visibilitychange", this.start);
    if (this.hasUpdated) this.observe();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.io?.disconnect();
    this.ro?.disconnect();
    this.popRo?.disconnect();
    this.io = this.ro = this.popRo = undefined;
    this.popFor = undefined;
    document.removeEventListener("visibilitychange", this.start);
    window.clearTimeout(this.dueTimer);
    window.clearTimeout(this.peekTimer);
    this.setEsc(false);
    this.setAway(false);
  }

  private observe() {
    if (typeof IntersectionObserver === "function" && !this.io) {
      this.io = new IntersectionObserver(([e]) => {
        this.visible = e.isIntersecting;
        if (this.visible) this.start();
      });
      this.io.observe(this);
    }
    const card = this.querySelector<HTMLElement>(".ui-agq__card");
    if (card && typeof ResizeObserver === "function" && !this.ro) {
      // Its first callback, before the first paint, gives the width
      this.ro = new ResizeObserver(() => (this.width = card.clientWidth));
      this.ro.observe(card);
    }
  }

  /* ---------- Values the page owns ---------- */

  private setPaused(next: boolean) {
    if (next === this.paused) return;
    if (this.emit("tc-paused-change", { paused: next }, { cancelable: true })) this.paused = next;
  }
  private setOpen(id: string | null) {
    if (id === this.openId) return;
    const job = id ? this.jobs.find((j) => j.id === id) : undefined;
    if (this.emit("tc-open-change", { id, job }, { cancelable: true })) this.openId = id;
  }

  /* ---------- The frame loop: numbers ease, and with our own clock times, progress and the chart move in place ---------- */

  private start = () => {
    if (this.raf || !this.visible || document.hidden || !this.isConnected) return;
    this.lastFrame = realTime();
    this.raf = requestAnimationFrame(this.frame);
  };

  private frame = (t: number) => {
    this.raf = 0;
    const L = this.loop;
    if (!L) return;
    const dt = Math.min(64, t - this.lastFrame);
    this.lastFrame = t;
    const instant = reducedMotion();
    const k = 1 - Math.exp(-dt / 110);
    let busy = false;
    if (L.needClock) {
      busy = true;
      const clock = wallClock();
      const render = () => {
        if (this.asked === L) return;
        this.asked = L;
        this.tick = clock;
        this.real = t;
      };
      const text = clock - this.lastClock >= (L.fine(clock) ? CLOCK_FINE : CLOCK);
      if (text) this.lastClock = clock;
      if (clock >= L.nextAt || !L.paint(clock, text)) render();
    }
    for (const n of this.nums.values()) {
      if (n.shown === n.target) continue;
      const d = n.target - n.shown;
      n.shown = instant || Math.abs(d) < 0.02 * Math.max(1, Math.abs(n.target)) * 0.05 + 0.004 ? n.target : n.shown + d * k;
      if (n.el) n.el.textContent = n.fmt(n.shown);
      busy = true;
    }
    const goal = L.ymax;
    if (this.shownMax !== goal) {
      const d = goal - this.shownMax;
      this.shownMax = instant || Math.abs(d) < 0.01 ? goal : this.shownMax + d * (1 - Math.exp(-dt / 160));
      this.style.setProperty("--tc-agent-queue-ymax", String(this.shownMax));
      busy = true;
    }
    if (busy && this.visible && !document.hidden) this.raf = requestAnimationFrame(this.frame);
  };

  /** Between renders the chart scrolls on: drawn in place, unless its scale or its rate-limit bands changed */
  private paintChart(clock: number) {
    const s = this.scene;
    const svgEl = this.querySelector(".ui-agq__svg");
    if (!s || !svgEl) return false;
    const c = s.chartAt(clock);
    const { ymax, bands } = s.chart;
    if (c.ymax !== ymax || c.bands.length !== bands.length || c.bands.some((b, i) => b.l !== bands[i].l)) return false;
    svgEl.querySelector(".ui-agq__line")?.setAttribute("d", c.line);
    svgEl.querySelector(".ui-agq__area")?.setAttribute("d", c.area);
    svgEl.querySelectorAll(".ui-agq__band rect").forEach((r, i) => {
      r.setAttribute("x", String(c.bands[i].x1));
      r.setAttribute("width", String(Math.max(1, c.bands[i].x2 - c.bands[i].x1)));
    });
    return true;
  }

  /** Between renders: every time, progress bar, the open card's rows, the countdown and the p95 move on in place */
  private paintText(clock: number) {
    const s = this.scene;
    if (!s) return;
    for (const p of s.placed) {
      if (p.shape === "gone") continue;
      const el = this.jobEls.get(p.job.id);
      if (!el) continue;
      el.setAttribute("aria-label", describeJob(p, clock, s.limited, s.waiting));
      if (p.p === undefined && p.job.status === "running") el.style.setProperty("--p", String(progressOf(p.job, clock)));
      const meta = el.querySelector(".ui-agq__job-meta");
      const text = metaOf(p.job, clock, s.limited);
      if (meta && meta.textContent !== text) meta.textContent = text;
    }
    const pop = this.querySelector(".ui-agq__pop");
    if (s.card && pop) {
      const rows = cardRows(s.card, clock, s.waiting, this.workers);
      pop.querySelectorAll(".ui-agq__pop-stats dd").forEach((dd, i) => {
        if (rows[i] && dd.textContent !== rows[i][1]) dd.textContent = rows[i][1];
      });
    }
    const countdown = this.querySelector("[data-countdown]");
    if (countdown && s.activeLimit) countdown.textContent = `${Math.max(0, Math.ceil((s.activeLimit.until - clock) / 1000))}s`;
    const p95Num = this.nums.get("p95");
    if (p95Num && !Number.isNaN(p95Num.shown)) p95Num.target = waitP95(this.jobs, s.queued, clock);
  }

  /* ---------- Hover peek and pinned card ---------- */

  private hoverJob(jobId: string, id: string | null) {
    window.clearTimeout(this.peekTimer);
    if (id) {
      this.hover = id;
      return;
    }
    this.peekTimer = window.setTimeout(() => {
      if (!this.peekHeld && this.hover === jobId) this.hover = null;
    }, 120);
  }
  private holdPeek(held: boolean) {
    this.peekHeld = held;
    window.clearTimeout(this.peekTimer);
    if (!held) this.peekTimer = window.setTimeout(() => (this.hover = null), 120);
  }
  private onEsc = (e: KeyboardEvent) => {
    if (e.key === "Escape") this.hover = null;
  };
  private setEsc(on: boolean) {
    if (on === this.escOn) return;
    this.escOn = on;
    if (on) window.addEventListener("keydown", this.onEsc);
    else window.removeEventListener("keydown", this.onEsc);
  }
  private away = (e: PointerEvent) => {
    const t = e.target as Node;
    if (this.querySelector(".ui-agq__pop")?.contains(t) || [...this.jobEls.values()].some((el) => el.contains(t))) return;
    this.setOpen(null);
  };
  private setAway(on: boolean) {
    if (on === this.awayOn) return;
    this.awayOn = on;
    if (on) document.addEventListener("pointerdown", this.away);
    else document.removeEventListener("pointerdown", this.away);
  }

  /* ---------- Updates ---------- */

  private num(key: string, value: number, fmt: (n: number) => string) {
    this.numTargets.push([key, value, fmt]);
    let cb = this.numRefs.get(key);
    if (!cb) {
      cb = (el?: Element) => {
        const rec = this.nums.get(key);
        const e = (el as HTMLElement | undefined) ?? null;
        if (rec) rec.el = e;
        else this.nums.set(key, { el: e, shown: NaN, target: NaN, fmt });
      };
      this.numRefs.set(key, cb);
    }
    return html`<span class="ui-agq__num" ${ref(cb)}></span>`;
  }
  private jobRef(id: string) {
    let cb = this.jobRefs.get(id);
    if (!cb) {
      cb = (el?: Element) => {
        if (el) this.jobEls.set(id, el as HTMLButtonElement);
        else this.jobEls.delete(id);
      };
      this.jobRefs.set(id, cb);
    }
    return cb;
  }

  protected override firstUpdated() {
    this.observe();
    this.style.setProperty("--tc-agent-queue-ymax", String(this.loop?.ymax ?? 4));
    this.shownMax = this.loop?.ymax ?? 4;
  }

  protected override updated(changed: PropertyValues) {
    // The memory is kept after each update, with the real time
    if (this.memInput) this.mem = remember(this.mem, realTime(), { ...this.memInput, mounted: this.mounted });
    this.mounted = true;
    // Ticking numbers: a number first shows its value right away, and eases from there on
    const clockReady = this.now !== undefined || this.tick > 0;
    if (clockReady)
      for (const [key, value, fmt] of this.numTargets) {
        const rec = this.nums.get(key);
        if (!rec) continue;
        if (Number.isNaN(rec.shown)) rec.shown = value;
        rec.target = value;
        rec.fmt = fmt;
        if (rec.el && !rec.el.textContent) rec.el.textContent = fmt(rec.shown);
      }
    if (changed.has("now") && changed.get("now") !== undefined && this.now === undefined) queueMicrotask(() => (this.tick = wallClock()));
    this.scheduleDue();
    this.followCard();
    this.start();
  }

  /** Landings, red flashes and priority jumps run on real time: render again right when the next one is due */
  private scheduleDue() {
    window.clearTimeout(this.dueTimer);
    this.dueTimer = 0;
    const s = this.scene;
    if (!s) return;
    const memory = s.memory;
    const real = this.real;
    const pending = memory.gone.size > 0 || memory.flash.size > 0 || s.queued.some((j) => j.priority === "high" && real - (memory.seen.get(j.id)?.first ?? 0) < JUMP);
    if (!pending) return;
    const m = this.mem;
    const due: number[] = [];
    for (const t of m.gone.values()) due.push(t + HOLD_DONE, t + HOLD_FAIL);
    for (const t of m.flash.values()) due.push(t + HOLD_FAIL, t + FLASH);
    for (const j of s.queued) if (j.priority === "high") due.push((m.seen.get(j.id)?.first ?? 0) + JUMP);
    const at = realTime();
    const next = Math.min(...due.filter((t) => t >= real));
    if (!Number.isFinite(next)) return;
    this.dueTimer = window.setTimeout(() => (this.real = realTime()), Math.max(0, next - at) + 1);
  }

  /** The card's height, to flip it above its job near the bottom: measured when a card opens, then on resize only */
  private followCard() {
    const card = this.scene?.card;
    const id = card?.job.id;
    const pinned = !!this.scene && !!card && this.openId === id;
    this.setEsc(!!card && !pinned);
    this.setAway(pinned);
    // A pinned job that finished or left closes its card – once: a page that keeps `openId` isn't asked again
    const openGone = !!this.openId && !pinned;
    const key = `${openGone}|${this.openId}`;
    if (key !== this.openKey) {
      this.openKey = key;
      if (openGone) queueMicrotask(() => this.setOpen(null));
    }
    if (id === this.popFor) return;
    this.popFor = id;
    this.popRo?.disconnect();
    this.popRo = undefined;
    const el = this.querySelector<HTMLElement>(".ui-agq__pop");
    if (!el) return;
    const measure = () => {
      const h = el.offsetHeight;
      if (h && Math.abs(h - this.popH) > 1) this.popH = h;
    };
    measure();
    if (typeof ResizeObserver === "function") {
      this.popRo = new ResizeObserver(measure);
      this.popRo.observe(el);
    }
  }

  /* ---------- Rendering ---------- */

  private renderJob(p: Placed, now: number, limited: boolean, waiting: number, enterDelay: number, open: boolean, tabbable: boolean, onKey: (e: KeyboardEvent, j: QueueJob) => void) {
    const j = p.job;
    const gone = p.shape === "gone";
    const attempt = j.attempt ?? 1;
    const halted = j.status === "running" && limited;
    return html`<button
      ${ref(this.jobRef(j.id))}
      type="button"
      class="ui-agq__job"
      data-shape=${p.shape}
      data-kind=${j.kind}
      data-status=${j.status}
      ?data-flash=${p.flash}
      ?data-halted=${halted}
      data-priority=${ifDefined(j.priority && j.priority !== "normal" ? j.priority : undefined)}
      ?data-open=${open}
      tabindex=${!gone && tabbable ? 0 : -1}
      aria-hidden=${ifDefined(gone ? "true" : undefined)}
      aria-label=${live(describeJob(p, now, limited, waiting))}
      aria-haspopup="dialog"
      aria-expanded=${open ? "true" : "false"}
      style=${styleMap({ translate: `${p.box.x}px ${p.box.y}px`, width: `${p.box.w}px`, height: `${p.box.h}px`, "--p": String(p.p ?? progressOf(j, now)), animationDelay: `${enterDelay}ms` })}
      @pointerenter=${() => !gone && this.hoverJob(j.id, j.id)}
      @pointerleave=${() => this.hoverJob(j.id, null)}
      @focus=${() => {
        // Focus opens the same peek as hovering (1.4.13); leaving closes it
        this.active = j.id;
        if (!gone) this.hoverJob(j.id, j.id);
      }}
      @blur=${() => this.hoverJob(j.id, null)}
      @click=${() => {
        if (gone) return;
        this.active = j.id;
        this.setOpen(this.openId === j.id ? null : j.id);
      }}
      @keydown=${(e: KeyboardEvent) => onKey(e, j)}
    >
      <span class="ui-agq__fill" aria-hidden="true"></span>
      <span class="ui-agq__job-in" aria-hidden="true"
        ><span class="ui-agq__job-icon" ?data-logo=${!!j.icon}>${j.icon ? j.icon.cloneNode(true) : kindGlyph(j.kind)}</span
        ><span class="ui-agq__job-name">${j.name}</span> ${j.priority === "high"
          ? html`<span class="ui-agq__badge" data-kind="high" title="High priority">${upIcon()}</span>`
          : nothing}${attempt > 1 ? html`<span class="ui-agq__badge" data-kind="retry" title=${`Attempt ${attempt}`}>${retryIcon()}${attempt}</span>` : nothing}
        <span class="ui-agq__job-meta" .textContent=${live(metaOf(j, now, limited))}></span
      ></span>
    </button>`;
  }

  private renderCard(p: Placed, now: number, pinned: boolean, limited: boolean, waiting: number, x: number, y: number, w: number) {
    const j = p.job;
    const halted = j.status === "running" && limited;
    const pill = halted ? "Paused" : STATUS[j.status];
    const onClose = () => {
      // Back to the job before the card goes
      rescueFocus(this.querySelector(".ui-agq__pop"), [this.jobEls.get(j.id)]);
      this.setOpen(null);
    };
    return html`<div
      class="ui-agq__pop"
      role=${pinned ? "dialog" : "tooltip"}
      aria-label=${`${j.name} details`}
      ?data-pinned=${pinned}
      data-kind=${j.kind}
      data-status=${halted ? "halted" : j.status}
      style=${styleMap({ translate: `${x}px ${y}px`, width: `${w}px` })}
      @pointerenter=${() => this.holdPeek(true)}
      @pointerleave=${() => this.holdPeek(false)}
      @keydown=${(e: KeyboardEvent) => {
        if (e.key !== "Escape") return;
        e.stopPropagation();
        onClose();
      }}
    >
      <div class="ui-agq__pop-head">
        <span class="ui-agq__pop-icon" ?data-logo=${!!j.icon}>${j.icon ? j.icon.cloneNode(true) : kindGlyph(j.kind)}</span>
        <span class="ui-agq__pop-who">
          <span class="ui-agq__pop-name">${j.name}</span>
          <span class="ui-agq__pop-kind">${KIND[j.kind]}${j.detail ? ` · ${j.detail}` : ""}</span>
        </span>
        <span class="ui-agq__pill" data-status=${halted ? "halted" : j.status}>${pill}</span>
        ${pinned ? html`<button type="button" class="ui-agq__close" aria-label="Close details" @click=${onClose}>${crossIcon(14, 1.8)}</button>` : nothing}
      </div>
      <dl class="ui-agq__pop-stats">
        ${cardRows(p, now, waiting, this.workers).map(([k, v]) => html`<div><dt>${k}</dt><dd .textContent=${live(v)}></dd></div>`)}
      </dl>
      ${j.error ? html`<p class="ui-agq__pop-error">${alertIcon()}${j.error}</p>` : nothing}
      ${pinned && (this.promotable || this.cancellable) && (j.status === "queued" || j.status === "running")
        ? html`<div class="ui-agq__pop-actions">
            ${this.promotable && j.status === "queued" && (p.index ?? 0) > 0
              ? html`<button type="button" class="ui-agq__btn" @click=${() => this.emit("tc-promote", { job: j })}>${upIcon()}Move to front</button>`
              : nothing}
            ${this.cancellable
              ? html`<button
                  type="button"
                  class="ui-agq__btn"
                  data-kind="danger"
                  @click=${() => {
                    // Focus goes back to the job first; if the job then leaves, the rescue moves it on (2.4.3)
                    onClose();
                    this.emit("tc-cancel", { job: j });
                  }}
                >
                  ${crossIcon(10)}Cancel
                </button>`
              : nothing}
          </div>`
        : nothing}
    </div>`;
  }

  private renderHeader(state: "limited" | "paused" | "live" | "idle", left: number) {
    const pillText = state === "paused" ? "Paused" : state === "live" ? "Live" : "Idle";
    const workers = this.workers.length;
    const canLess = workers > this.minConcurrency;
    const canMore = workers < this.maxConcurrency;
    const paused = this.paused;
    return html`<header class="ui-agq__head">
      <span class="ui-agq__mark">${queueGlyph()}</span>
      <span class="ui-agq__title">${this.heading}</span>
      ${this.name ? html`<span class="ui-agq__name">${this.name}</span>` : nothing}
      <span class="ui-agq__pill" data-status=${state}
        >${state === "live" || state === "limited" ? html`<span class="ui-agq__pulse" aria-hidden="true"></span>` : nothing}${state === "limited"
          ? html`Rate limited · <span class="ui-agq__num" data-countdown="" .textContent=${live(`${left}s`)}></span>`
          : pillText}</span
      >
      <span class="ui-agq__tools">
        ${this.pausable
          ? html`<button type="button" class="ui-agq__btn" aria-pressed=${paused ? "true" : "false"} aria-label=${paused ? "Resume the queue" : "Pause the queue"} @click=${() => this.setPaused(!paused)}>
              ${paused ? playIcon() : pauseIcon()}<span class="ui-agq__btn-text">${paused ? "Resume" : "Pause"}</span>
            </button>`
          : nothing}
        ${this.stepper
          ? html`<span class="ui-agq__stepper" role="group" aria-label="Workers">
              <button type="button" aria-label="One worker less" ?disabled=${!canLess} @click=${() => canLess && this.emit("tc-concurrency-change", { workers: workers - 1 })}>${minusIcon()}</button>
              <output class="ui-agq__stepper-value" aria-live="polite" aria-label=${`${workers} workers`}>${workers}</output>
              <button type="button" aria-label="One worker more" ?disabled=${!canMore} @click=${() => canMore && this.emit("tc-concurrency-change", { workers: workers + 1 })}>${plusIcon()}</button>
            </span>`
          : nothing}
      </span>
    </header>`;
  }

  private renderChart(chart: ReturnType<ReturnType<typeof chartModel>>, summary: string, spanLabel: string, plotW: number, plotH: number, waiting: number) {
    const { line, area, ymax, bands } = chart;
    const bp = this.backpressure;
    const gradId = this.gradId;
    return html`<div class="ui-agq__chart">
      <div class="ui-agq__chart-head"><span class="ui-agq__chart-title">Queue depth</span></div>
      <div class="ui-agq__plot" role="img" aria-label=${summary} style=${styleMap({ height: `${plotH}px` })}>
        ${repeat(
          [0, ymax],
          (v) => v,
          (v) =>
            html`<span class="ui-agq__grid" ?data-zero=${v === 0} style=${styleMap({ "--v": String(v) })} aria-hidden="true"
              >${bp === undefined || Math.abs(v - bp) > ymax * 0.1 ? html`<span>${int(v)}</span>` : nothing}</span
            >`,
        )}
        <svg class="ui-agq__svg" width=${plotW} height=${plotH} viewBox=${`0 0 ${plotW} ${plotH}`} aria-hidden="true">
          ${svg`<defs><linearGradient id=${gradId} x1="0" y1="1" x2="0" y2="0"><stop offset="0" class="ui-agq__stop" data-at="top"></stop><stop offset="1" class="ui-agq__stop" data-at="bottom"></stop></linearGradient></defs>`}
          ${repeat(
            bands,
            (b) => b.l.from,
            ({ x1, x2 }) => svg`<g class="ui-agq__band"><rect x=${live(String(x1))} y="0" width=${live(String(Math.max(1, x2 - x1)))} height=${plotH}></rect></g>`,
          )}
          ${svg`<g class="ui-agq__scaled" style=${styleMap({ "--h": String(plotH) })}>
            <path class="ui-agq__area" d=${live(area)} fill=${`url(#${gradId})`}></path>
            <path class="ui-agq__line" d=${live(line)}></path>
            ${bp !== undefined ? svg`<line class="ui-agq__bp" x1="0" x2=${plotW} y1=${bp} y2=${bp}></line>` : nothing}
          </g>`}
        </svg>
        ${bp !== undefined ? html`<span class="ui-agq__bp-label" style=${styleMap({ "--v": String(bp) })} aria-hidden="true">${bp}</span>` : nothing}
        <span class="ui-agq__dot" style=${styleMap({ "--v": String(waiting) })} aria-hidden="true"></span>
      </div>
      <div class="ui-agq__axis" aria-hidden="true"><span>${spanLabel} ago</span><span>now</span></div>
    </div>`;
  }

  protected override render() {
    this.numTargets = [];
    const jobs = this.jobs;
    const workers = this.workers;
    const rateLimits = this.rateLimits;
    const backpressure = this.backpressure;
    const span = this.range;
    const width = this.width || 812;

    /* The clock: the page's, or our own while there is work */
    const now = this.now ?? this.tick;
    const activeLimit = rateLimits.find((l) => l.from <= now && now < l.until);
    const limited = !!activeLimit;
    const queuedAll = jobs.filter((j) => j.status === "queued");
    const runningAll = jobs.filter((j) => j.status === "running");
    const needClock = this.now === undefined && (queuedAll.length > 0 || runningAll.length > 0 || limited);

    // What rendering shows: the last memory plus whatever just changed, as of the last clock reading
    this.memInput = { jobs, limited, limitLeft: activeLimit ? Math.ceil((activeLimit.until - now) / 1000) : 0, waiting: queuedAll.length, backpressure };
    const memory = remember(this.mem, this.real, { ...this.memInput, mounted: this.mounted });

    const L = layoutFor(width, workers.length);
    const { order, placed, K, cap, capFull, overflow, hiddenCount, slotOf } = placeJobs(jobs, queuedAll, runningAll, workers, L, memory, this.real);

    /* The queue in numbers */
    const doneCount = this.totals?.done ?? jobs.filter((j) => j.status === "done").length;
    const failedCount = this.totals?.failed ?? jobs.filter((j) => j.status === "failed").length;
    const perMinute = jobs.filter((j) => j.status === "done" && j.endedAt !== undefined && j.endedAt > now - MINUTE && j.endedAt <= now).length;
    const p95 = waitP95(jobs, queuedAll, now);
    const over = backpressure !== undefined && queuedAll.length > backpressure;
    const state = limited ? "limited" : this.paused ? "paused" : queuedAll.length || runningAll.length ? "live" : "idle";
    this.dataset.state = state;

    const plotW = Math.max(40, width - 2 * L.pad - GUTTER);
    const plotH = L.narrow ? 88 : 112;
    const chartAt = chartModel(jobs, queuedAll.length, rateLimits, span, plotW, backpressure);
    const chart = chartAt(now);
    const { peak, avg, ymax, bands } = chart;
    const minutes = span / MINUTE;
    const spanLabel = minutes >= 2 ? `${+minutes.toFixed(1)} min` : `${Math.round(span / 1000)}s`;
    const summary = `Queue depth over the last ${spanLabel}: ${queuedAll.length} waiting now, peak ${peak}, average ${avg.toFixed(1)}${backpressure !== undefined ? `, backpressure line at ${backpressure}` : ""}${bands.length ? `, rate limited ${bands.length === 1 ? "once" : `${bands.length} times`}` : ""}${failedCount ? `, ${failedCount} failed in all` : ""}.`;

    /* Hover card and pinned card */
    const live2 = placed.filter((p) => p.shape !== "gone");
    const wantOpen = this.openId;
    const openPlaced = wantOpen ? live2.find((p) => p.job.id === wantOpen) : undefined;
    const hoverPlaced = !openPlaced && this.hover ? live2.find((p) => p.job.id === this.hover) : undefined;
    const cardOf = openPlaced ?? hoverPlaced;

    /* Keyboard: one job in the tab order, arrows walk through the busy slots, then the queue */
    const waitingShown = order.slice(0, K + cap);
    const walkOrder = [...runningAll.filter((j) => j.worker !== undefined && slotOf.has(j.worker)).sort((a, b) => slotOf.get(a.worker!)! - slotOf.get(b.worker!)!), ...waitingShown];
    const activeId = this.active && walkOrder.some((j) => j.id === this.active) ? this.active : walkOrder[0]?.id;
    const focusJob = (j?: QueueJob) => {
      if (!j) return;
      this.active = j.id;
      this.jobEls.get(j.id)?.focus();
    };
    const onKey = (e: KeyboardEvent, j: QueueJob) => {
      const i = walkOrder.findIndex((x) => x.id === j.id);
      const keys: Record<string, () => void> = {
        ArrowDown: () => focusJob(walkOrder[i + 1]),
        ArrowRight: () => focusJob(walkOrder[i + 1]),
        ArrowUp: () => focusJob(walkOrder[i - 1]),
        ArrowLeft: () => focusJob(walkOrder[i - 1]),
        Home: () => focusJob(walkOrder[0]),
        End: () => focusJob(walkOrder[walkOrder.length - 1]),
        Escape: () => wantOpen && this.setOpen(null),
      };
      if (!keys[e.key]) return;
      e.preventDefault();
      keys[e.key]();
    };
    const enterDelay = (p: Placed) => {
      const s = memory.seen.get(p.job.id);
      return s && !s.fresh ? Math.min(420, (p.index ?? 0) * 22) : 0;
    };

    // For the frame loop and the updates after this render
    this.scene = { placed, chartAt, chart, card: cardOf, queued: queuedAll, waiting: order.length, limited, activeLimit, memory };
    this.loop = {
      needClock,
      ymax,
      nextAt: nextChangeAt(rateLimits, jobs, now),
      fine: (clock) => needsTenths(queuedAll, runningAll, clock),
      paint: (clock, text) => {
        if (text) this.paintText(clock);
        return this.paintChart(clock);
      },
    };

    const busyCount = runningAll.filter((j) => j.worker !== undefined && slotOf.has(j.worker)).length;
    const stats: { label: string; value: TemplateResult; kind?: string }[] = [
      { label: "Waiting", value: this.num("waiting", queuedAll.length, int), kind: over ? "warn" : undefined },
      { label: "Running", value: html`${this.num("running", busyCount, int)}<span class="ui-agq__of">/${workers.length}</span>` },
      { label: "Throughput", value: html`${this.num("rate", perMinute, int)}<span class="ui-agq__of">/min</span>` },
      { label: "Wait p95", value: this.num("p95", p95, took) },
    ];
    const left = activeLimit ? Math.max(0, Math.ceil((activeLimit.until - now) / 1000)) : 0;

    let card: TemplateResult | typeof nothing = nothing;
    if (cardOf) {
      const p = cardOf;
      const w = Math.min(L.narrow ? width - 2 * L.pad : 280, width - 16);
      const below = p.box.y + p.box.h + 6;
      const y = below + this.popH > L.height + 120 && p.box.y - this.popH - 6 > 0 ? p.box.y - this.popH - 6 : below;
      const x = clamp(p.box.x, 8, width - w - 8);
      card = keyed(p.job.id, this.renderCard(p, now, !!openPlaced, limited, order.length, x, y, w)) as unknown as TemplateResult;
    }

    return html`
      ${this.renderHeader(state, left)}
      <div class="ui-agq__card">
        <dl class="ui-agq__stats">
          ${stats.map((s) => html`<div class="ui-agq__stat" data-kind=${ifDefined(s.kind)}><dt>${s.label}</dt><dd>${s.value}</dd></div>`)}
        </dl>
        <div class="ui-agq__flow" style=${styleMap({ height: `${L.height}px` })} ?data-narrow=${L.narrow}>
          <span class="ui-agq__col-head" style=${boxStyle(L.heads.queue)}
            ><span>Queue</span><b>${this.num("depth", queuedAll.length, int)}</b>${hiddenCount > 0 && L.narrow ? html`<span class="ui-agq__col-more">+${hiddenCount} more</span>` : nothing}</span
          >
          <span class="ui-agq__col-head" style=${boxStyle(L.heads.workers)}><span>Workers</span><b>${busyCount}/${workers.length}</b></span>
          <span class="ui-agq__well" aria-hidden="true" ?data-empty=${order.length <= K} style=${boxStyle(L.well)}></span>
          ${order.length === 0
            ? html`<span class="ui-agq__empty" style=${boxStyle({ x: L.chips[0].x, y: L.chips[0].y, w: L.chips[0].w, h: L.well.y + L.well.h - L.chips[0].y })}>Nothing waiting</span>`
            : nothing}
          ${overflow
            ? html`<span
                class="ui-agq__more"
                aria-hidden="true"
                style=${boxStyle({ x: L.grid.x + ((capFull - 3) % L.grid.cols) * L.grid.step, y: L.grid.y + Math.floor((capFull - 3) / L.grid.cols) * STEP, w: 2 * L.grid.step + SQ, h: SQ })}
                >+${hiddenCount}</span
              >`
            : nothing}
          ${repeat(
            workers,
            (w) => w.id,
            (w, i) => {
              const busy = runningAll.some((j) => j.worker === w.id);
              return html`<div class="ui-agq__slot" ?data-busy=${busy} ?data-limited=${limited} style=${boxStyle(L.slots[i])}>
                <span class="ui-agq__who" style=${styleMap({ width: `${L.rail.x - 16}px` })}>
                  <span class="ui-agq__logo" ?data-logo=${!!w.icon}>${w.icon ? w.icon.cloneNode(true) : initials(w.name)}</span>
                  <span class="ui-agq__who-text"><span class="ui-agq__who-name">${w.name}</span></span>
                </span>
                <span class="ui-agq__rail" style=${styleMap({ left: `${L.rail.x}px`, top: `${L.rail.y}px`, width: `${L.rail.w}px`, height: `${L.rail.h}px` })}
                  >${!busy ? html`<span>${limited || this.paused ? "Paused" : "Idle"}</span>` : nothing}</span
                >
              </div>`;
            },
          )}
          ${(["done", "failed"] as const).map(
            (k) => html`<div class="ui-agq__bin" data-kind=${k} style=${boxStyle(k === "done" ? L.done : L.failed)}>
              <span class="ui-agq__bin-icon">${k === "done" ? tickIcon() : crossIcon()}</span>
              <span class="ui-agq__bin-label">${k === "done" ? "Done" : "Failed"}</span>
              <span class="ui-agq__bin-count">${k === "done" ? this.num("bin-done", doneCount, int) : this.num("bin-failed", failedCount, int)}</span>
              ${keyed(k === "done" ? doneCount : failedCount, html`<span class="ui-agq__bin-hit" aria-hidden="true"></span>`)}
            </div>`,
          )}
          <div class="ui-agq__jobs" role="group" aria-label=${`Jobs: ${busyCount} running, ${order.length} waiting`}>
            ${repeat(
              placed,
              (p) => p.job.id,
              (p) => this.renderJob(p, now, limited, order.length, enterDelay(p), wantOpen === p.job.id, activeId === p.job.id, onKey),
            )}
          </div>
          ${card}
        </div>
        ${this.renderChart(chart, summary, spanLabel, plotW, plotH, queuedAll.length)}
      </div>
      <div class="ui-agq__sr" aria-live="polite">${memory.msg}</div>
    `;
  }

  static override css = /* css */ `
/* The chart's scale glides, so it's registered as a number */
@property --tc-agent-queue-ymax { syntax: "<number>"; inherits: true; initial-value: 10; }
/* Colors, sizes and motion as variables – override them on [data-ui="agq"] */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="agq"] {
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
  --tc-agent-queue-tray-bg: var(--tc-surface-tray);
  --tc-agent-queue-card-bg: var(--tc-surface-on-tray);
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
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-agent-queue-tray-bg);
  container: ui-agq / inline-size;
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: var(--tc-font-size-lg);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  letter-spacing: -0.006em;
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Colors, sizes and motion as variables – override them on [data-ui="agq"] */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="agq"] {
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
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  container: ui-agq / inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="agq"] *, [data-ui="agq"] *::before, [data-ui="agq"] *::after { box-sizing: border-box; }
:where([data-ui="agq"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="agq"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="agq"] :is(p, dl, dd) { margin: 0; }
[data-ui="agq"] svg { display: block; flex: none; }
.ui-agq__num { font-variant-numeric: tabular-nums; }
/* ----- On the tray: the queue's name, its state and the controls ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-agq__head { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; min-height: 44px; padding: var(--tc-space-1) var(--tc-space-1) var(--tc-space-2) var(--tc-space-3); }
/* ----- The bar: the queue's name, its state and the controls ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-agq__head { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; min-height: 52px; padding: var(--tc-space-3) var(--tc-space-3) var(--tc-space-3) var(--tc-space-4); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-agq__mark { display: grid; flex: none; place-items: center; width: 16px; color: var(--tc-accent-text); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__title { flex: none; font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-strong); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__name { min-width: 0; overflow: hidden; font-size: var(--tc-font-size-md); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
/* Status pills: the pill pattern (large in the header, small on a job's card) */
:where([data-look="standard"], [data-look="standard"] *).ui-agq__pill { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-pill-h-lg); padding: 0 var(--tc-pill-px-lg); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size-lg); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__head .ui-agq__pill { background: var(--tc-agent-queue-card-bg); box-shadow: var(--tc-shadow-raised); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__pill[data-status="live"] { color: var(--tc-accent-text); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__pill[data-status="limited"] { color: var(--tc-status-warning-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__head .ui-agq__pill[data-status="limited"] { background: var(--tc-status-warning-bg); box-shadow: inset 0 0 0 1px var(--tc-status-warning-border); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__pill[data-status="running"] { color: var(--tc-accent-text); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__pill[data-status="done"] { color: var(--tc-status-success-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__pill[data-status="failed"] { color: var(--tc-status-danger-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__pop .ui-agq__pill[data-status="running"] { background: var(--tc-status-info-bg); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__title { flex: none; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-strong); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__name { min-width: 0; overflow: hidden; color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__pill { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h-lg); padding: 0 var(--tc-pill-px-lg); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size-lg); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__pill > svg { width: 11px; height: 11px; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__pill:is([data-status="live"], [data-status="running"]) { background: var(--tc-accent-subtle); color: var(--tc-accent-text); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__pill[data-status="limited"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__pill[data-status="done"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__pill[data-status="failed"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
/* Decorative loops pulse a few times and rest (2.2.2) – the state is in the words */
.ui-agq__pulse { width: 6px; height: 6px; border-radius: 50%; background: currentColor; animation: ui-agq-pulse var(--tc-duration-shimmer) var(--tc-ease-in-out) 3; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__tools { display: flex; flex: none; align-items: center; gap: var(--tc-space-1-5); margin-left: auto; }
/* Pause / Move to front / Cancel: secondary buttons, the control geometry */
:where([data-look="standard"], [data-look="standard"] *).ui-agq__btn { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm) 0 calc(var(--tc-control-px-sm) - 2px); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); white-space: nowrap; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-agq__btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__tools { display: flex; flex: none; align-items: center; gap: var(--tc-space-2); margin-left: auto; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__btn { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md) 0 6px; border-radius: var(--tc-control-radius-md); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__btn > svg { width: 16px; height: 16px; color: var(--tc-icon-muted); }
.ui-agq__btn[aria-pressed="true"] { color: var(--tc-accent-text); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__btn[data-kind="danger"] { color: var(--tc-status-danger-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__stepper { display: inline-flex; align-items: center; height: var(--tc-control-h-sm); padding: 0 var(--tc-space-0-5) 0 var(--tc-space-2-5); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__stepper button { display: grid; place-items: center; width: 24px; height: 24px; border-radius: var(--tc-radius-sm); color: var(--tc-text-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__btn[aria-pressed="true"] > svg { color: var(--tc-accent-text); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__btn[data-kind="danger"],
:where([data-look="clean"], [data-look="clean"] *).ui-agq__btn[data-kind="danger"] > svg { color: var(--tc-status-danger-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__stepper { display: inline-flex; align-items: center; height: var(--tc-control-h-md); padding: 0 var(--tc-space-0-5) 0 var(--tc-space-2-5); border-radius: var(--tc-control-radius-md); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__stepper button { display: grid; place-items: center; width: 24px; height: 24px; border-radius: var(--tc-radius-xs); color: var(--tc-icon-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-agq__stepper button:hover:not(:disabled) { background: var(--tc-fill-default); color: var(--tc-text-primary); }
.ui-agq__stepper button:disabled { opacity: 0.35; cursor: default; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__stepper-value { min-width: 18px; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-primary); text-align: center; font-variant-numeric: tabular-nums; }
/* ----- The white card: the queue in numbers, the flow and the chart ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-agq__card { position: relative; border-radius: var(--tc-card-radius); background: var(--tc-agent-queue-card-bg); box-shadow: var(--tc-card-shadow); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); padding: var(--tc-space-3-5) 0; border-bottom: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__stepper-value { min-width: 18px; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-strong); text-align: center; font-variant-numeric: tabular-nums; }
/* ----- The queue in numbers, the flow and the chart – all on the one card ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-agq__card { position: relative; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); padding: var(--tc-space-3) 0; border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-agq__stat { display: grid; gap: var(--tc-space-0-5); min-width: 0; padding: 0 var(--tc-space-4); }
.ui-agq__stat:first-child { padding-left: 22px; }
.ui-agq__stat:last-child { padding-right: var(--tc-space-2-5); }
.ui-agq__stat + .ui-agq__stat { border-left: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__stat dt { overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__stat dd { overflow: hidden; font-size: var(--tc-font-size-xl); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-relaxed); letter-spacing: -0.01em; color: var(--tc-text-primary); white-space: nowrap; font-variant-numeric: tabular-nums; transition: color var(--tc-duration-moderate) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__of { margin-left: 1px; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__stat dt { overflow: hidden; font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); letter-spacing: 0.5px; text-transform: uppercase; color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__stat dd { overflow: hidden; font-size: var(--tc-font-size-lg-plus); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-loose); color: var(--tc-text-primary); white-space: nowrap; font-variant-numeric: tabular-nums; transition: color var(--tc-duration-moderate) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__of { margin-left: 1px; font-size: var(--tc-font-size-md); color: var(--tc-text-muted); }
.ui-agq__stat[data-kind="warn"] dd { color: var(--tc-status-warning-fg); }
.ui-agq__stat[data-kind="failed"] dd { color: var(--tc-status-danger-fg); }
/* ----- The flow: everything in it is placed by its box and glides to the next one ----- */
.ui-agq__flow { position: relative; border-bottom: var(--tc-hairline) solid var(--tc-divider); transition: height var(--tc-duration-slow) var(--tc-ease-move); }
/* ----- The flow: everything in it is placed by its box and glides to the next one ----- */
.ui-agq__flow > *, .ui-agq__jobs > * { position: absolute; top: 0; left: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__col-head { display: flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__col-head > b { font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
/* The rate limit, with its countdown – a line under it runs out until the workers resume */
:where([data-look="standard"], [data-look="standard"] *).ui-agq__col-head > .ui-agq__col-more { margin-left: auto; font-weight: var(--tc-font-weight-regular); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__well { border-radius: var(--tc-radius-md); background: var(--tc-agent-queue-well-bg); box-shadow: inset 0 0 0 1px var(--tc-border-subtle); }
.ui-agq__empty { display: grid; place-items: center; color: var(--tc-text-disabled); animation: ui-agq-calm var(--tc-duration-slow) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__well { transition: opacity var(--tc-duration-slow) var(--tc-ease-move); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__col-head { display: flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); letter-spacing: 0.5px; text-transform: uppercase; color: var(--tc-text-muted); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__col-head > b { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); letter-spacing: 0; color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
/* The rate limit, with its countdown – a line under it runs out until the workers resume */
:where([data-look="clean"], [data-look="clean"] *).ui-agq__col-head > .ui-agq__col-more { margin-left: auto; letter-spacing: 0.3px; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__well { border-radius: var(--tc-radius-sm); background: var(--tc-fill-subtle); box-shadow: inset 0 0 0 0.5px var(--tc-border-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__well { transition: opacity var(--tc-duration-slow) var(--tc-ease-move); }
.ui-agq__well[data-empty] { opacity: 0; }
@keyframes ui-agq-calm { from { opacity: 0; } }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__more { display: grid; place-items: center; border-radius: var(--tc-radius-2xs); background: var(--tc-fill-default); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-semibold); line-height: 12px; color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
/* Worker slots: who it is on the left, the rail its job runs on to the right */
:where([data-look="standard"], [data-look="standard"] *).ui-agq__slot { border-radius: var(--tc-radius-xl); background: var(--tc-fill-subtle); transition: translate var(--tc-duration-slowest) var(--tc-ease-out), width var(--tc-duration-slowest) var(--tc-ease-move), background-color var(--tc-duration-slow) var(--tc-ease-standard); animation: ui-agq-slot var(--tc-duration-slower) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__more { display: grid; place-items: center; border-radius: var(--tc-radius-2xs); background: var(--tc-fill-default); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); line-height: 12px; color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
/* Worker slots: who it is on the left, the rail its job runs on to the right */
:where([data-look="clean"], [data-look="clean"] *).ui-agq__slot { border-radius: var(--tc-radius-md); background: var(--tc-fill-subtle); box-shadow: inset 0 0 0 0.5px var(--tc-border-default); transition: translate var(--tc-duration-slowest) var(--tc-ease-emphasized), width var(--tc-duration-slowest) var(--tc-ease-move), background-color var(--tc-duration-slow) var(--tc-ease-standard), box-shadow var(--tc-duration-slow) var(--tc-ease-standard); animation: ui-agq-slot var(--tc-duration-slower) var(--tc-ease-move) both; }
.ui-agq__who { position: absolute; top: 0; bottom: 0; left: 8px; display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__logo { display: grid; flex: none; place-items: center; width: var(--tc-avatar-md); height: var(--tc-avatar-md); border-radius: var(--tc-avatar-radius-agent); background: var(--tc-agent-queue-card-bg); box-shadow: var(--tc-shadow-raised); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__logo { display: grid; flex: none; place-items: center; width: var(--tc-avatar-md); height: var(--tc-avatar-md); border-radius: var(--tc-avatar-radius-agent); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
.ui-agq__logo > svg { width: 14px; height: 14px; }
.ui-agq__who-text { display: grid; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__who-name { overflow: hidden; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__rail { position: absolute; display: flex; align-items: center; padding-left: var(--tc-space-2-5); border-radius: var(--tc-radius-md); box-shadow: inset 0 0 0 1px var(--tc-border-default); background-color: light-dark(transparent, var(--tc-surface-sunken)); background-image: repeating-linear-gradient(-45deg, transparent 0 6px, var(--tc-agent-queue-rail-stripe) 6px 7px); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
/* Done and Failed: a tick or a cross, a count, and a soft ring when a job lands */
:where([data-look="standard"], [data-look="standard"] *).ui-agq__bin { z-index: 1; padding: var(--tc-space-3); border-radius: var(--tc-radius-xl); background: var(--tc-fill-subtle); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__bin-icon { position: absolute; top: 12px; left: 12px; display: grid; place-items: center; width: 20px; height: 20px; border-radius: var(--tc-radius-sm); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__bin[data-kind="done"] .ui-agq__bin-icon { background: var(--tc-status-success-bg); box-shadow: inset 0 0 0 1px var(--tc-status-success-border); color: var(--tc-status-success-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__bin[data-kind="failed"] .ui-agq__bin-icon { background: var(--tc-status-danger-bg); box-shadow: inset 0 0 0 1px var(--tc-status-danger-border); color: var(--tc-status-danger-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__bin-label { position: absolute; top: 14px; left: 40px; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__bin-count { position: absolute; left: 12px; bottom: 10px; font-size: var(--tc-font-size-2xl); font-weight: var(--tc-font-weight-semibold); line-height: 26px; letter-spacing: -0.02em; color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__who-name { overflow: hidden; font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-strong); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__rail { position: absolute; display: flex; align-items: center; padding-left: var(--tc-space-2-5); border-radius: var(--tc-radius-sm); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); background-color: light-dark(transparent, var(--tc-surface-sunken)); background-image: repeating-linear-gradient(-45deg, transparent 0 6px, var(--tc-agent-queue-rail-stripe) 6px 6.5px); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
/* Done and Failed: a tick or a cross, a count, and a soft ring when a job lands */
:where([data-look="clean"], [data-look="clean"] *).ui-agq__bin { z-index: 1; padding: var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-fill-subtle); box-shadow: inset 0 0 0 0.5px var(--tc-border-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__bin-icon { position: absolute; top: 12px; left: 12px; display: grid; place-items: center; width: 20px; height: 20px; border-radius: var(--tc-radius-sm); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__bin[data-kind="done"] .ui-agq__bin-icon { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__bin[data-kind="failed"] .ui-agq__bin-icon { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__bin-label { position: absolute; top: 14px; left: 40px; font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); letter-spacing: 0.5px; text-transform: uppercase; color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__bin-count { position: absolute; left: 12px; bottom: 10px; font-size: var(--tc-font-size-2xl); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-display-sm); letter-spacing: -0.2px; color: var(--tc-text-strong); }
.ui-agq__bin[data-kind="failed"] .ui-agq__bin-count { color: var(--tc-status-danger-fg); }
.ui-agq__bin-hit { position: absolute; top: 12px; left: 12px; width: 20px; height: 20px; border-radius: var(--tc-radius-sm); opacity: 0; pointer-events: none; animation: ui-agq-hit var(--tc-duration-reveal) var(--tc-ease-decelerate) var(--tc-duration-slower); }
.ui-agq__bin[data-kind="done"] .ui-agq__bin-hit { box-shadow: 0 0 0 1px var(--tc-status-success-fg); }
.ui-agq__bin[data-kind="failed"] .ui-agq__bin-hit { box-shadow: 0 0 0 1px var(--tc-status-danger-fg); }
.ui-agq__flow[data-narrow] .ui-agq__who-text { display: none; }
/* Phones: Done and Failed side by side – the mark, the count, the word */
.ui-agq__flow[data-narrow] .ui-agq__bin { display: flex; align-items: center; gap: var(--tc-space-1-5); padding: 0 var(--tc-space-2-5); }
.ui-agq__flow[data-narrow] :is(.ui-agq__bin-icon, .ui-agq__bin-label, .ui-agq__bin-count) { position: static; }
.ui-agq__flow[data-narrow] .ui-agq__bin-icon { flex: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__flow[data-narrow] .ui-agq__bin-count { order: 1; font-size: var(--tc-font-size-xl); line-height: var(--tc-line-height-relaxed); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__flow[data-narrow] .ui-agq__bin-count { order: 1; font-size: var(--tc-font-size-lg-plus); line-height: var(--tc-line-height-loose); }
.ui-agq__flow[data-narrow] .ui-agq__bin-label { order: 2; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ui-agq__flow[data-narrow] .ui-agq__bin-hit { top: 10px; }
/* ----- One job: a card while it waits up front, a square in the backlog, a bar while it runs ----- */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="agq"] [data-kind] { --k-bg: var(--tc-agent-queue-agent-bg); --k-edge: var(--tc-agent-queue-agent-edge); --k-ink: var(--tc-agent-queue-agent-ink); --k-sq: var(--tc-agent-queue-agent-sq); }
/* ----- One job: a card while it waits up front, a square in the backlog, a bar while it runs ----- */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="agq"] [data-kind] { --k-bg: var(--tc-fill-default); --k-edge: var(--tc-border-strong); --k-ink: var(--tc-text-secondary); --k-sq: var(--tc-fill-strong); }
[data-ui="agq"] [data-kind="llm"] { --k-bg: var(--tc-agent-queue-llm-bg); --k-edge: var(--tc-agent-queue-llm-edge); --k-ink: var(--tc-agent-queue-llm-ink); --k-sq: var(--tc-agent-queue-llm-sq); }
[data-ui="agq"] [data-kind="tool"] { --k-bg: var(--tc-agent-queue-tool-bg); --k-edge: var(--tc-agent-queue-tool-edge); --k-ink: var(--tc-agent-queue-tool-ink); --k-sq: var(--tc-agent-queue-tool-sq); }
[data-ui="agq"] [data-kind="human"] { --k-bg: var(--tc-agent-queue-human-bg); --k-edge: var(--tc-agent-queue-human-edge); --k-ink: var(--tc-agent-queue-human-ink); --k-sq: var(--tc-agent-queue-human-sq); }
[data-ui="agq"] .ui-agq__job:is([data-status="failed"], [data-flash]) { --k-bg: var(--tc-status-danger-bg); --k-edge: var(--tc-status-danger-border); --k-ink: var(--tc-status-danger-fg); --k-sq: var(--tc-status-danger-border); }
[data-ui="agq"] .ui-agq__job[data-status="done"] { --k-bg: var(--tc-status-success-bg); --k-edge: var(--tc-status-success-border); --k-ink: var(--tc-status-success-fg); --k-sq: var(--tc-status-success-border); }
.ui-agq__jobs { position: absolute; inset: 0; pointer-events: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__job {
  z-index: 1;
  display: block;
  overflow: hidden;
  border-radius: var(--tc-radius-md);
  background: var(--tc-agent-queue-card-bg);
  box-shadow: var(--tc-shadow-raised);
  pointer-events: auto;
  transition: translate var(--tc-duration-slowest) var(--tc-ease-out), width var(--tc-duration-slowest) var(--tc-ease-out), height var(--tc-duration-slowest) var(--tc-ease-out), border-radius var(--tc-duration-slowest) var(--tc-ease-out), background-color var(--tc-duration-slow) var(--tc-ease-standard), box-shadow var(--tc-duration-slow) var(--tc-ease-standard), opacity var(--tc-duration-moderate) var(--tc-ease-standard);
  animation: ui-agq-drop var(--tc-duration-slowest) var(--tc-ease-move) backwards;
}
.ui-agq__job:hover,
.ui-agq__job[data-open] { z-index: 2; box-shadow: 0 0 0 1px var(--k-edge), var(--tc-shadow-control); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__job {
  z-index: 1;
  display: block;
  overflow: hidden;
  border-radius: var(--tc-radius-sm);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-shadow-raised);
  pointer-events: auto;
  transition: translate var(--tc-duration-slowest) var(--tc-ease-emphasized), width var(--tc-duration-slowest) var(--tc-ease-emphasized), height var(--tc-duration-slowest) var(--tc-ease-emphasized), border-radius var(--tc-duration-slowest) var(--tc-ease-emphasized), background-color var(--tc-duration-slow) var(--tc-ease-standard), box-shadow var(--tc-duration-slow) var(--tc-ease-standard), opacity var(--tc-duration-moderate) var(--tc-ease-standard);
  animation: ui-agq-drop var(--tc-duration-slowest) var(--tc-ease-move) backwards;
}
.ui-agq__job:focus-visible { z-index: 2; outline: var(--tc-focus-outline); outline-offset: 1px; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__job[data-flash] { background: var(--k-bg); box-shadow: 0 0 0 1px var(--k-edge); animation: ui-agq-drop var(--tc-duration-slowest) var(--tc-ease-move) backwards, ui-agq-shake var(--tc-duration-slower) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__job[data-shape="square"] { border-radius: var(--tc-radius-2xs); background: var(--k-sq); box-shadow: inset 0 0 0 1px var(--k-edge); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__job[data-flash] { background: var(--k-bg); box-shadow: 0 0 0 0.5px var(--k-edge); animation: ui-agq-drop var(--tc-duration-slowest) var(--tc-ease-move) backwards, ui-agq-shake var(--tc-duration-slower) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__job[data-shape="square"] { border-radius: var(--tc-radius-2xs); background: var(--k-sq); box-shadow: inset 0 0 0 var(--tc-hairline) var(--k-edge); }
.ui-agq__job[data-shape="square"]::before { content: ""; position: absolute; inset: -6px; }
.ui-agq__job[data-shape="square"][data-priority="high"] { box-shadow: inset 0 0 0 1.5px var(--tc-status-warning-solid); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__job[data-shape="square"]:hover { box-shadow: inset 0 0 0 1.5px var(--k-ink); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__job[data-shape="square"]:hover { box-shadow: inset 0 0 0 1px var(--k-ink); }
.ui-agq__job[data-shape="bar"] { box-shadow: var(--tc-shadow-raised); }
/* Landing in a bin: it shrinks on its way and fades as it arrives */
.ui-agq__job[data-shape="gone"] { z-index: 0; border-radius: var(--tc-radius-2xs); background: var(--k-sq); box-shadow: none; opacity: 0; pointer-events: none; transition: translate var(--tc-duration-slower) var(--tc-ease-move), width var(--tc-duration-slower) var(--tc-ease-move), height var(--tc-duration-slower) var(--tc-ease-move), border-radius var(--tc-duration-slower) var(--tc-ease-standard), background-color var(--tc-duration-base) var(--tc-ease-standard), opacity var(--tc-duration-base) var(--tc-ease-standard) var(--tc-duration-base); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__job-in { position: absolute; inset: 0; display: flex; align-items: center; gap: var(--tc-space-1-5); padding: 0 var(--tc-space-2) 0 var(--tc-space-1-5); white-space: nowrap; opacity: 1; transition: opacity var(--tc-duration-base) var(--tc-ease-standard) var(--tc-duration-fast); }
/* Landing in a bin: it shrinks on its way and fades as it arrives */
:where([data-look="clean"], [data-look="clean"] *).ui-agq__job-in { position: absolute; inset: 0; display: flex; align-items: center; gap: var(--tc-space-1-5); padding: 0 var(--tc-space-2) 0 var(--tc-space-1-5); white-space: nowrap; opacity: 1; transition: opacity var(--tc-duration-base) var(--tc-ease-standard) var(--tc-duration-fast); }
.ui-agq__job:is([data-shape="square"], [data-shape="gone"]) .ui-agq__job-in { opacity: 0; transition: opacity var(--tc-duration-quick) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__job-icon { display: grid; flex: none; place-items: center; width: 18px; height: 18px; border-radius: var(--tc-radius-xs); background: var(--k-bg); color: var(--k-ink); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__job-icon[data-logo] { background: var(--tc-agent-queue-card-bg); box-shadow: 0 0 0 1px var(--tc-border-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__job-icon { display: grid; flex: none; place-items: center; width: 18px; height: 18px; border-radius: var(--tc-radius-xs); background: var(--k-bg); color: var(--k-ink); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__job-icon[data-logo] { background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
.ui-agq__job-icon > svg { width: 11px; height: 11px; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__job-name { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-primary); text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__badge { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-0-5); height: 16px; padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-badge); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-tight); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__job-name { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-primary); text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__badge { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-0-5); height: 16px; padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-badge); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); font-variant-numeric: tabular-nums; }
.ui-agq__badge[data-kind="high"] { width: 16px; padding: 0; justify-content: center; background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-agq__badge[data-kind="retry"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__job-meta { flex: none; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__job-meta { flex: none; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-agq__job[data-status="running"] .ui-agq__job-meta { color: var(--k-ink); }
.ui-agq__job[data-flash] :is(.ui-agq__job-name, .ui-agq__job-meta) { color: var(--tc-status-danger-fg); }
/* The bar: a tint that grows with the progress, a sheen sweeping along and a glowing front edge */
:where([data-look="standard"], [data-look="standard"] *).ui-agq__fill { position: absolute; inset: 0; border-radius: inherit; background: var(--k-bg); box-shadow: inset 0 0 0 1px var(--k-edge); clip-path: inset(0 calc((1 - var(--p)) * 100%) 0 0 round 8px); opacity: 0; transition: clip-path var(--tc-duration-moderate) linear, opacity var(--tc-duration-slow) var(--tc-ease-move), background-color var(--tc-duration-slow) var(--tc-ease-standard), box-shadow var(--tc-duration-slow) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__job[data-shape="bar"] .ui-agq__fill { opacity: 1; animation: ui-agq-grow var(--tc-duration-slowest) var(--tc-ease-move) backwards; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__job[data-shape="bar"] .ui-agq__fill::before { --tc-agent-queue-sheen: var(--tc-agent-queue-card-bg); }
.ui-agq__job[data-shape="bar"] .ui-agq__fill::after { transition: opacity var(--tc-duration-slow) var(--tc-ease-move); content: ""; position: absolute; top: 0; bottom: 0; left: calc(var(--p) * 100% - 28px); width: 28px; background: linear-gradient(90deg, transparent, var(--k-edge)); animation: ui-agq-glow var(--tc-duration-reveal-slow) var(--tc-ease-in-out) 6 alternate; }
/* The bar: a tint that grows with the progress, a sheen sweeping along and a glowing front edge */
:where([data-look="clean"], [data-look="clean"] *).ui-agq__fill { position: absolute; inset: 0; border-radius: inherit; background: var(--k-bg); box-shadow: inset 0 0 0 0.5px var(--k-edge); clip-path: inset(0 calc((1 - var(--p)) * 100%) 0 0 round 6px); opacity: 0; transition: clip-path var(--tc-duration-moderate) linear, opacity var(--tc-duration-slow) var(--tc-ease-move), background-color var(--tc-duration-slow) var(--tc-ease-standard), box-shadow var(--tc-duration-slow) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__job[data-shape="bar"] .ui-agq__fill { opacity: 1; animation: ui-agq-grow-clean var(--tc-duration-slowest) var(--tc-ease-move) backwards; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__job[data-shape="bar"] .ui-agq__fill::before { --tc-agent-queue-sheen: var(--tc-surface-raised); }
/* The sheen: a 60px band moved on transform (composited), a few passes and then it rests (2.2.2) */
.ui-agq__job[data-shape="bar"] .ui-agq__fill::before { transition: opacity var(--tc-duration-slow) var(--tc-ease-move); content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, var(--tc-agent-queue-sheen), transparent) 0 0 / 60px 100% no-repeat; opacity: 0.7; transform: translateX(-60px); animation: ui-agq-sweep var(--tc-duration-shimmer) linear 3; }
.ui-agq__job[data-shape="gone"] .ui-agq__fill { opacity: 0; }
/* ----- The card on a job ----- */
/* The card on a job: the popover surface; it can be hovered (1.4.13) */
.ui-agq__pop { z-index: 5; display: grid; gap: var(--tc-space-2-5); padding: var(--tc-space-3); border-radius: var(--tc-menu-radius); background: var(--tc-menu-bg); box-shadow: var(--tc-menu-shadow); transition: translate var(--tc-duration-slowest) var(--tc-ease-move); animation: ui-agq-open var(--tc-duration-base) var(--tc-ease-move) both; }
/* ----- The card on a job ----- */
.ui-agq__pop-head { display: flex; align-items: center; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__pop-icon { display: grid; flex: none; place-items: center; width: 28px; height: 28px; margin-right: var(--tc-space-2-5); border-radius: var(--tc-radius-md); background: var(--k-bg); box-shadow: inset 0 0 0 1px var(--k-edge); color: var(--k-ink); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__pop-icon[data-logo] { background: var(--tc-agent-queue-card-bg); box-shadow: var(--tc-shadow-raised); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__pop-icon { display: grid; flex: none; place-items: center; width: 28px; height: 28px; margin-right: var(--tc-space-2-5); border-radius: var(--tc-radius-sm); background: var(--k-bg); color: var(--k-ink); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__pop-icon[data-logo] { background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
.ui-agq__pop-icon > svg { width: 15px; height: 15px; }
.ui-agq__pop-who { display: grid; flex: 1; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__pop-name { overflow: hidden; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-snug); color: var(--tc-text-strong); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__pop-name { overflow: hidden; font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); color: var(--tc-text-strong); white-space: nowrap; text-overflow: ellipsis; }
.ui-agq__pop-kind { overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
.ui-agq__pop-head .ui-agq__pill { height: var(--tc-pill-h); margin-left: var(--tc-space-2); padding: 0 var(--tc-pill-px); font-size: var(--tc-pill-font-size); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__close { display: grid; flex: none; place-items: center; width: 28px; height: 28px; margin: -2px -4px 0 var(--tc-space-1); border-radius: var(--tc-radius-md); color: var(--tc-text-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__close { display: grid; flex: none; place-items: center; width: 28px; height: 28px; margin: -2px -4px 0 var(--tc-space-1); border-radius: var(--tc-radius-sm); color: var(--tc-text-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-agq__close:hover { background: var(--tc-fill-default); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__pop-stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--tc-space-2) var(--tc-space-3); padding: var(--tc-space-2-5) var(--tc-space-3); border-radius: var(--tc-radius-lg); background: var(--tc-fill-subtle); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__pop-stats dt { font-size: var(--tc-font-size-xs); line-height: 14px; color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__pop-stats dd { overflow: hidden; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__pop-error { display: flex; gap: var(--tc-space-2); padding: var(--tc-space-2) var(--tc-space-2-5); border-radius: var(--tc-radius-lg); background: var(--tc-status-danger-bg); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-status-danger-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__pop-error > svg { margin-top: 2.5px; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__pop-actions { display: flex; gap: var(--tc-space-1-5); }
/* ----- The chart ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-agq__chart { padding: var(--tc-space-3-5) var(--tc-space-4) var(--tc-space-3); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__chart-head { display: flex; align-items: center; gap: var(--tc-space-2); margin-bottom: var(--tc-space-2-5); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__chart-title { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__pop-stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--tc-space-2) var(--tc-space-3); padding: var(--tc-space-2) var(--tc-space-2-5); border-radius: var(--tc-radius-md); background: var(--tc-fill-subtle); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__pop-stats dt { font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); letter-spacing: 0.5px; text-transform: uppercase; color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__pop-stats dd { overflow: hidden; font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__pop-error { display: flex; gap: var(--tc-space-2); padding: var(--tc-space-2) var(--tc-space-2-5); border-radius: var(--tc-radius-md); background: var(--tc-status-danger-bg); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-status-danger-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__pop-error > svg { margin-top: var(--tc-space-0-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__pop-actions { display: flex; gap: var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__pop-actions .ui-agq__btn > svg { width: 12px; height: 12px; }
/* ----- The chart ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-agq__chart { padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__chart-head { display: flex; align-items: center; gap: var(--tc-space-2); margin-bottom: var(--tc-space-2-5); line-height: var(--tc-line-height-tight); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__chart-title { font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); letter-spacing: 0.5px; text-transform: uppercase; color: var(--tc-text-muted); }
.ui-agq__plot { position: relative; margin-left: ${GUTTER}px; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__grid { position: absolute; left: -6px; right: 0; bottom: calc(var(--v) / var(--tc-agent-queue-ymax) * 100%); height: 1px; background: var(--tc-border-subtle); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__grid[data-zero] { background: var(--tc-border-default); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__grid > span { position: absolute; right: calc(100% + 8px); top: -7px; font-size: var(--tc-font-size-xs); line-height: 14px; color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__grid { position: absolute; left: -6px; right: 0; bottom: calc(var(--v) / var(--tc-agent-queue-ymax) * 100%); height: 0.5px; background: var(--tc-border-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__grid[data-zero] { background: var(--tc-border-strong); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__grid > span { position: absolute; right: calc(100% + 8px); top: -8px; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-agq__svg { position: absolute; inset: 0; overflow: hidden; }
/* Drawn in queue-depth units and scaled by the gliding --tc-agent-queue-ymax, so a rescale never jumps */
.ui-agq__scaled { transform: translateY(calc(var(--h) * 1px)) scaleY(calc(-1 * var(--h) / var(--tc-agent-queue-ymax))); }
.ui-agq__stop[data-at="top"] { stop-color: var(--tc-agent-queue-depth-fade); }
.ui-agq__stop[data-at="bottom"] { stop-color: var(--tc-agent-queue-depth-fill); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__line { fill: none; stroke: var(--tc-agent-queue-depth); stroke-width: 1.5; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__bp { stroke: var(--tc-text-disabled); stroke-width: 1; stroke-dasharray: 4 4; vector-effect: non-scaling-stroke; opacity: 0.8; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__line { fill: none; stroke: var(--tc-agent-queue-depth); stroke-width: 1.25; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__bp { stroke: var(--tc-text-disabled); stroke-width: 1; stroke-dasharray: 3 3; vector-effect: non-scaling-stroke; }
.ui-agq__band rect { fill: var(--tc-status-warning-solid); opacity: 0.07; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__bp-label { position: absolute; right: calc(100% + 8px); bottom: calc(var(--v) / var(--tc-agent-queue-ymax) * 100% - 7px); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); line-height: 14px; color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__dot { position: absolute; right: -3.5px; bottom: calc(var(--v) / var(--tc-agent-queue-ymax) * 100% - 3.5px); width: 7px; height: 7px; border-radius: 50%; background: var(--tc-agent-queue-depth); box-shadow: 0 0 0 3px var(--tc-agent-queue-card-bg); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__bp-label { position: absolute; right: calc(100% + 8px); bottom: calc(var(--v) / var(--tc-agent-queue-ymax) * 100% - 8px); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__dot { position: absolute; right: -3px; bottom: calc(var(--v) / var(--tc-agent-queue-ymax) * 100% - 3px); width: 6px; height: 6px; border-radius: 50%; background: var(--tc-agent-queue-depth); box-shadow: 0 0 0 3px var(--tc-surface-raised); }
[data-ui="agq"][data-state="live"] .ui-agq__dot::after, [data-ui="agq"][data-state="limited"] .ui-agq__dot::after { content: ""; position: absolute; inset: 0; border-radius: 50%; background: var(--tc-agent-queue-depth); animation: ui-agq-ping var(--tc-duration-shimmer) var(--tc-ease-decelerate) 3; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__axis { display: flex; justify-content: space-between; margin: var(--tc-space-1-5) 0 0 ${GUTTER}px; font-size: var(--tc-font-size-xs); line-height: 14px; color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__axis { display: flex; justify-content: space-between; margin: var(--tc-space-1-5) 0 0 ${GUTTER}px; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-agq__sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
/* ----- Narrow ----- */
@container ui-agq (max-width: 560px) {
:where([data-look="standard"], [data-look="standard"] *).ui-agq__head { flex-wrap: wrap; row-gap: var(--tc-space-1-5); padding: var(--tc-space-1) var(--tc-space-1) var(--tc-space-2) var(--tc-space-2-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__name { display: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__stats { grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: var(--tc-space-3); padding: var(--tc-space-3) 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__stat { padding: 0 var(--tc-space-3); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__stat:nth-child(odd) { padding-left: var(--tc-space-4); border-left: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__stat dd { font-size: var(--tc-font-size-lg-plus); }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__stat:nth-child(3) { border-left: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__chart { padding: var(--tc-space-3) var(--tc-space-3) var(--tc-space-2-5); }
}
@container ui-agq (max-width: 440px) {
  /* The controls get a row of their own: Pause on the left, the workers on the right */
:where([data-look="standard"], [data-look="standard"] *).ui-agq__tools { flex-basis: 100%; justify-content: space-between; margin-left: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-agq__head { padding-right: var(--tc-space-2); }
}
/* ----- Narrow ----- */
@container ui-agq (max-width: 560px) {
:where([data-look="clean"], [data-look="clean"] *).ui-agq__head { flex-wrap: wrap; row-gap: var(--tc-space-2-5); padding: var(--tc-space-2-5) var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__name { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__stats { grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: var(--tc-space-2-5); padding: var(--tc-space-2-5) 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__stat { padding: 0 var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__stat:nth-child(odd) { padding-left: var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__stat:nth-child(3) { border-left: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__chart { padding: var(--tc-space-3) var(--tc-space-3) var(--tc-space-2-5); }
}
@container ui-agq (max-width: 440px) {
  /* The controls get a row of their own: Pause on the left, the workers on the right */
:where([data-look="clean"], [data-look="clean"] *).ui-agq__tools { flex-basis: 100%; justify-content: space-between; margin-left: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-agq__stat dt { letter-spacing: 0.2px; }
}
/* Paused by a rate limit: the bar keeps its colors, dims a little and stops – no sheen, no glow */
.ui-agq__job[data-halted] .ui-agq__fill { opacity: 0.55; }
.ui-agq__job[data-halted] .ui-agq__fill::before, .ui-agq__job[data-halted] .ui-agq__fill::after { opacity: 0; animation-play-state: paused; }
.ui-agq__job[data-halted] .ui-agq__job-meta { color: var(--tc-text-muted); }
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
  [data-ui="agq"] *, [data-ui="agq"] *::before, [data-ui="agq"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-agent-queue")) customElements.define("tc-agent-queue", TcAgentQueue);

declare global {
  interface HTMLElementTagNameMap {
    "tc-agent-queue": TcAgentQueue;
  }
}
