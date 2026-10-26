import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { reducedMotion } from "../internal/reduced-motion";
import { TcElement } from "./internal/base";
import { duration as took } from "./internal/format";
import { FocusRescueController, OnScreenController, RowWindowController, rescueFocus } from "./internal/controllers";

/*
 * <tc-trace-waterfall> – the Lit port of src/components/trace-waterfall.tsx: where the time and the money of an agent
 * run go. On the left the run as a tree of spans – the agent, its LLM calls, tool calls and sub-agents – and on the
 * right a timeline where every span is a bar that starts when it started and is as long as it took.
 *   · bars are tinted by kind; a running span grows live with a soft sheen, and a "now" line moves across
 *   · when the run outgrows the timeline, the axis rescales smoothly – ticks glide and fade, bars follow
 *   · fold a span and its rows close up – their bars collapse into the parent bar as small marks
 *   · click a row (or press Enter, which moves focus into it) for a small window with its details
 *   · long traces (over 200 shown rows) render only the rows near the viewport, plus the focused and the open row
 *
 *   <tc-trace-waterfall .root=${run} .startedAt=${Date.now()}></tc-trace-waterfall>
 *
 * Time: spans are in ms from the start of the run. Set `elapsed` (ms into the run) to drive the clock yourself, or
 * `startedAt` (epoch ms) and optionally `now` (epoch ms) – without `now` it keeps its own clock while spans run, and
 * writes the live bars and numbers straight into the DOM every 100 ms (an update only when the axis rescales).
 */

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
  /** A small mark element (cloned), e.g. the model maker's or the tool's logo – defaults to a swatch in the kind's color */
  icon?: Element;
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

/** Details of the events */
export type TraceCollapsedChange = { collapsed: string[] };
export type TraceOpenChange = { openId: string | null; span?: TraceSpan };

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

const INTEGER = new Intl.NumberFormat("en-US");
const dollars = (n: number) => (n === 0 ? "$0" : n < 0.01 ? `$${n.toFixed(3)}` : n < 10 ? `$${n.toFixed(2)}` : `$${INTEGER.format(Math.round(n))}`);
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
/** The only clock read in the file – called after updates, never while rendering */
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
/** The first text node of an element (Lit puts comment markers before it) */
const firstText = (el: Element) => [...el.childNodes].find((n) => n.nodeType === Node.TEXT_NODE);

/**
 * The clock, written straight into the DOM – the element updates only when the structure changes. Elements of running
 * spans opt in with attributes that carry the span's start (ms):
 *   data-run        → --d, the length of a bar, its duration tag or a folded mark
 *   data-run-took   → its first text node: the duration, then data-run-post
 *   data-run-side   → data-side of a duration tag, from the text in it
 * The "now" position goes on the time layer only (not the host), so a tick doesn't restyle every row.
 */
function writeClock(root: HTMLElement, at: number, range: number, trackW: number) {
  root.querySelector<HTMLElement>(".ui-tw__layer")?.style.setProperty("--tc-trace-waterfall-at", String(at));
  const dur = (el: Element, attr: string) => Math.max(0, at - Number(el.getAttribute(attr)));
  for (const el of root.querySelectorAll<HTMLElement>("[data-run]")) el.style.setProperty("--d", String(dur(el, "data-run")));
  for (const el of root.querySelectorAll<HTMLElement>("[data-run-took]")) {
    const text = took(dur(el, "data-run-took")) + (el.dataset.runPost ?? "");
    const node = firstText(el);
    if (node && node.nodeValue !== text) node.nodeValue = text;
  }
  for (const el of root.querySelectorAll<HTMLElement>("[data-run-side]")) {
    const label = el.querySelector("[data-run-took]")?.textContent ?? "";
    el.dataset.side = sideOf(Number(el.dataset.runSide), dur(el, "data-run-side"), needOf(label, false), range, trackW);
  }
}

type Row = { span: TraceSpan; depth: number; parentId?: string; hidden: boolean; leaving?: number; index?: number; siblings?: number };

/* ---------- Icons ---------- */

const sparkIcon = html`<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">${svg`<path d="M7 1.2c.4 2.9 1.9 4.4 4.8 4.8-2.9.4-4.4 1.9-4.8 4.8C6.6 7.9 5.1 6.4 2.2 6 5.1 5.6 6.6 4.1 7 1.2Z" fill="currentColor"></path><circle cx="11.6" cy="11.4" r="1.1" fill="currentColor" opacity="0.55"></circle>`}</svg>`;
/* chevron-down, triangle-alert and x: Lucide (ISC, lucide.dev); the loader is a plain arc */
const chevronIcon = html`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<path d="m6 9 6 6 6-6"></path>`}</svg>`;
const warningIcon = html`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4" stroke-width="2.2"></path><path d="M12 17h.01" stroke-width="2.6"></path>`}</svg>`;
const spinnerIcon = html`<svg class="ui-tw__spin" width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">${svg`<circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-opacity="0.25" stroke-width="2.5"></circle><path d="M12 3.5A8.5 8.5 0 0 1 20.5 12" stroke="currentColor" stroke-linecap="round" stroke-width="2.5"></path>`}</svg>`;
const cancelIcon = html`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`}</svg>`;
const spanIcon = (s: TraceSpan) => html`<span class="ui-tw__icon" data-logo=${ifDefined(s.icon ? "" : undefined)}>${s.icon ? s.icon.cloneNode(true) : html`<span class="ui-tw__swatch"></span>`}</span>`;

/**
 * An agent run as a tree of spans next to a timeline: durations, costs, folding and a details window per span.
 * @tag tc-trace-waterfall
 * @fires tc-collapsed-change - Spans were folded or unfolded; detail `{ collapsed: string[] }`. Cancelable: preventDefault() keeps the folds (controlled use)
 * @fires tc-open-change - A span's details opened or closed; detail `{ openId: string | null, span?: TraceSpan }`. Cancelable
 */
export class TcTraceWaterfall extends TcElement {
  static override ui = "tw";

  /** The run: its root span, with the others as children */
  @property({ attribute: false }) accessor root: TraceSpan = { id: "run", name: "Run", kind: "agent", status: "done", start: 0, end: 0 };
  /** The clock, in ms from the start of the run – e.g. a faster one for a demo */
  @property({ type: Number }) accessor elapsed: number | undefined = undefined;
  /** The clock in epoch ms, read against `startedAt` (without `startedAt`: ms from the start of the run) */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** When the run started (epoch ms) – with `now`, or the element's own clock while spans run */
  @property({ type: Number, attribute: "started-at" }) accessor startedAt: number | undefined = undefined;
  /** Ids of folded spans */
  @property({ attribute: false }) accessor collapsed: string[] = [];
  /** Id of the span whose details are open */
  @property({ attribute: "open-id" }) accessor openId: string | null = null;
  /** Marks the slowest finished LLM or tool call (default true; mark-slowest="false" turns it off) */
  @property({ attribute: "mark-slowest", converter: { fromAttribute: (v: string | null) => v !== "false" } }) accessor markSlowest = true;
  /** The shortest time the axis shows, in ms (default 10s) */
  @property({ type: Number, attribute: "min-range" }) accessor minRange = 10 * SEC;
  /** Formats every cost – defaults to dollars, e.g. "$0.042" */
  @property({ attribute: false }) accessor formatCost: (amount: number) => string = dollars;
  /** The heading, and the tree's name */
  @property() accessor heading = "Trace";

  /** @internal The own clock's last reading that caused an update (epoch ms) */
  @state() accessor tick: number | undefined = undefined;
  /** @internal The width of the timeline */
  @state() accessor trackW = 0;
  /** @internal Ticks that left the axis and fade out */
  @state() accessor fading: number[] = [];
  /** @internal Rows that left and close up */
  @state() accessor ghosts: { row: Row; index: number }[] = [];
  /** @internal The row in the tab order */
  @state() accessor active: string | undefined = undefined;
  /** @internal The details window that closes */
  @state() accessor closing: TraceSpan | null = null;

  private readonly onScreen = new OnScreenController(this);
  private readonly rowWindow = new RowWindowController(this, {
    count: () => this.m?.shownRows.length ?? 0,
    body: () => this.querySelector<HTMLElement>(".ui-tw__rows"),
    rowSelector: ".ui-tw__row",
    from: VIRTUAL_FROM,
    overscan: OVERSCAN,
    rowHeight: 32,
  });
  private timers = new Set<number>();
  private delaysKnown = new Map<string, number>();
  private prevTicks: number[] = [];
  private prevFlat: Row[] = [];
  private shownRange: number | undefined = undefined;
  private rangeFrame = 0;
  private clockTimer = 0;
  private ro?: ResizeObserver;
  private observed?: Element;
  private pendingFocus: string | null = null;
  private focusPop = false;
  private lastOpen: string | undefined = undefined;
  private closeTimer = 0;
  /** What the last update worked out */
  private m?: ReturnType<TcTraceWaterfall["model"]>;

  constructor() {
    super();
    // Focus never drops to <body>: a row that folds away or a details window that closes hands it to the active row
    new FocusRescueController(this, () => (this.m ? this.rowOf(this.m.activeId) : null) ?? this.querySelector<HTMLElement>('.ui-tw__rows [role="treeitem"][tabindex="0"]'));
  }

  override connectedCallback() {
    super.connectedCallback();
    document.addEventListener("pointerdown", this.away);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("pointerdown", this.away);
    for (const t of this.timers) clearTimeout(t);
    this.timers.clear();
    cancelAnimationFrame(this.rangeFrame);
    clearInterval(this.clockTimer);
    this.clockTimer = 0;
    clearTimeout(this.closeTimer);
    this.ro?.disconnect();
    this.ro = undefined;
    this.observed = undefined;
  }

  /** Runs `fn` after `ms`, unless the element is removed first */
  private later(fn: () => void, ms: number) {
    const t = window.setTimeout(() => {
      this.timers.delete(t);
      fn();
    }, ms);
    this.timers.add(t);
  }

  private rowOf(id: string | undefined) {
    return id ? this.querySelector<HTMLElement>(`.ui-tw__row[data-id="${CSS.escape(id)}"]:not([data-leaving])`) : null;
  }
  private get pop() {
    return this.querySelector<HTMLElement>(".ui-tw__pop");
  }

  /* ---------- Folding and the open details ---------- */

  private setFolded(next: string[]) {
    if (this.emit<TraceCollapsedChange>("tc-collapsed-change", { collapsed: next }, { cancelable: true })) this.collapsed = next;
  }
  private toggle(id: string) {
    const folded = this.collapsed;
    this.setFolded(folded.includes(id) ? folded.filter((c) => c !== id) : [...folded, id]);
  }
  private setOpen(id: string | null) {
    const span = id ? walk(this.root).find((s) => s.id === id) : undefined;
    if (this.emit<TraceOpenChange>("tc-open-change", { openId: id, span }, { cancelable: true })) this.openId = id;
  }
  /** Opening the details from the keyboard moves focus into them, so they're announced and readable */
  private toggleOpen(id: string, fromKeyboard: boolean) {
    const next = this.openId === id ? null : id;
    this.focusPop = fromKeyboard && next !== null;
    this.setOpen(next);
  }
  private away = (e: PointerEvent) => {
    if (!this.openId || !this.m?.openSpan) return;
    const t = e.target as Node;
    if (this.pop?.contains(t) || this.querySelector(".ui-tw__rows")?.contains(t)) return;
    this.setOpen(null);
  };

  /** Everything an update needs, worked out once */
  private model() {
    const root = this.root;
    const all = walk(root);
    const live = all.some((s) => s.status === "running");
    // `now` without `startedAt` keeps its old meaning: ms from the start of the run
    const nowProp = this.elapsed ?? (this.now === undefined ? undefined : this.startedAt === undefined ? this.now : this.now - this.startedAt);
    const lastEnd = Math.max(0, ...all.map((s) => s.end ?? s.start));
    const ownClock = nowProp === undefined && this.startedAt !== undefined && live;
    // The own clock starts at the run's start; the real time is written after the update
    this.tick ??= this.startedAt ?? 0;
    const now = nowProp ?? (ownClock ? Math.max(0, this.tick - this.startedAt!) : lastEnd);
    const range = rangeFor(Math.max(live ? now : 0, lastEnd), this.minRange);
    const endOf = (s: TraceSpan) => s.end ?? (s.status === "running" ? Math.max(now, s.start) : s.start);
    const durOf = (s: TraceSpan) => Math.max(0, endOf(s) - s.start);
    const openSpan = this.openId ? all.find((s) => s.id === this.openId) : undefined;

    // The axis: ticks to fit the width; ticks no longer on it fade out where they are while the range glides
    const fit = Math.min(8, Math.max(3, Math.round((this.trackW || 600) / 96)));
    const step = STEPS.find((s) => range / s <= fit) ?? range / fit;
    const ticks: number[] = [];
    for (let v = 0; v < range - 1; v += step) ticks.push(v);
    if (ticks.join(",") !== this.prevTicks.join(",")) {
      const gone = this.prevTicks.filter((v) => !ticks.includes(v));
      this.prevTicks = ticks;
      if (gone.length && !reducedMotion()) {
        this.fading = [...this.fading.filter((v) => !ticks.includes(v) && !gone.includes(v)), ...gone];
        this.later(() => (this.fading = this.fading.filter((v) => !gone.includes(v) || this.prevTicks.includes(v))), 520);
      }
    }
    const tickList = [...ticks.map((v) => ({ v, leaving: false })), ...this.fading.filter((v) => !ticks.includes(v)).map((v) => ({ v, leaving: true }))];

    // The rows: the tree, flat – folded children stay, closed to no height
    const folded = this.collapsed;
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
    const prev = this.prevFlat;
    this.prevFlat = flat;
    const gone = reducedMotion() ? [] : prev.filter((r) => !ids.has(r.span.id));
    if (gone.length) {
      const batch = gone.map((r, i) => ({ row: { ...r, leaving: Math.min(240, (gone.length - 1 - i) * 22) }, index: prev.indexOf(r) }));
      const out = new Set(batch.map((g) => g.row.span.id));
      this.ghosts = [...this.ghosts.filter((x) => !out.has(x.row.span.id)), ...batch];
      this.later(() => (this.ghosts = this.ghosts.filter((x) => !out.has(x.row.span.id))), EXIT + 300);
    }
    const rows = [...flat];
    const staying = this.ghosts.filter((g) => !ids.has(g.row.span.id)).sort((a, b) => a.index - b.index);
    // A whole new run (another root) comes in on top; the old one closes up below it
    const newRun = staying.some((g) => g.row.depth === 0);
    for (const g of staying) {
      if (newRun) rows.push(g.row);
      else rows.splice(Math.min(g.index, rows.length), 0, g.row);
    }
    // Rows that appear together slide in one after another; the first picture comes in row by row
    let newcomers = 0;
    const delays = new Map<string, number>();
    for (const r of rows) {
      if (r.leaving !== undefined) continue;
      delays.set(r.span.id, this.delaysKnown.get(r.span.id) ?? Math.min(400, (this.hasUpdated ? 0 : 60) + newcomers++ * STAGGER));
    }
    this.delaysKnown = delays;
    const shownRows = rows.filter((r) => !r.hidden && r.leaving === undefined);

    // Keyboard: a row that folded away or left hands the focus to its nearest shown parent
    const findRow = (id?: string) => rows.find((r) => r.span.id === id);
    let activeId = this.active ?? root.id;
    for (let r = findRow(activeId); r && (r.hidden || r.leaving !== undefined); r = findRow(r.parentId)) activeId = r.parentId ?? root.id;
    if (!shownRows.some((r) => r.span.id === activeId)) activeId = shownRows[0]?.span.id ?? root.id;

    // The run in numbers
    const leaves = all.filter((s) => s.kind === "llm" || s.kind === "tool");
    const finished = leaves.filter((s) => s.status !== "running" && s.end !== undefined);
    const slowest = this.markSlowest && finished.length > 1 ? finished.reduce((a, b) => (durOf(b) > durOf(a) ? b : a)) : undefined;
    const runState: TraceSpanStatus = root.status === "running" || live ? "running" : root.status === "failed" ? "failed" : "done";
    return { all, live, lastEnd, ownClock, now, range, endOf, durOf, openSpan, tickList, rows, delays, shownRows, findRow, activeId, slowest, runState };
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    this.m = this.model();
    this.toggleAttribute("data-live", this.m.runState === "running");
    this.toggleAttribute("data-offscreen", !this.onScreen.onScreen);
    // The details window: closes with a soft scale
    const openId = this.m.openSpan?.id;
    if (openId !== this.lastOpen) {
      const was = this.lastOpen ? this.m.all.find((s) => s.id === this.lastOpen) : undefined;
      this.lastOpen = openId;
      clearTimeout(this.closeTimer);
      if (was && !openId && !reducedMotion()) {
        this.closing = was;
        this.closeTimer = window.setTimeout(() => (this.closing = null), 170);
      } else if (openId) this.closing = null;
    }
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    const m = this.m!;
    // The width of the timeline, kept up by a ResizeObserver
    const layer = this.querySelector<HTMLElement>(".ui-tw__layer");
    if (layer && layer !== this.observed) {
      this.ro?.disconnect();
      this.observed = layer;
      if (typeof ResizeObserver !== "undefined") {
        this.ro = new ResizeObserver(() => (this.trackW = layer.offsetWidth));
        this.ro.observe(layer);
      }
    }
    this.glideRange(m.range);
    // The clock: the update drew the time it knew – new rows need the real one; then check the range
    const at = m.ownClock ? Math.max(0, readClock() - this.startedAt!) : m.now;
    writeClock(this, at, m.range, this.trackW);
    if (m.ownClock && rangeFor(Math.max(at, m.lastEnd), this.minRange) !== m.range) this.tick = readClock();
    // The own clock runs while spans run and the trace is on screen
    const want = m.ownClock && this.onScreen.onScreen;
    if (want && !this.clockTimer) {
      this.clockTimer = window.setInterval(() => this.step(), CLOCK_MS);
    } else if (!want && this.clockTimer) {
      clearInterval(this.clockTimer);
      this.clockTimer = 0;
    }
    // A row the keyboard moved to is focused once it renders; the details take focus when opened from the keyboard
    const pending = this.pendingFocus ? this.rowOf(this.pendingFocus) : null;
    if (pending) {
      this.pendingFocus = null;
      pending.focus();
    }
    if (this.focusPop && this.pop && this.openId) {
      this.focusPop = false;
      this.pop.focus();
    }
    this.placePop();
  }

  /** One tick of the own clock */
  private step() {
    const m = this.m;
    if (!m || !m.ownClock || this.startedAt === undefined) return;
    const at = Math.max(0, readClock() - this.startedAt);
    writeClock(this, at, m.range, this.trackW);
    if (rangeFor(Math.max(at, m.lastEnd), this.minRange) !== m.range) this.tick = readClock();
  }

  /** The range glides to its new value – written straight into a CSS variable, so bars and ticks move together every frame */
  private glideRange(range: number) {
    const set = (v: number) => {
      this.shownRange = v;
      this.style.setProperty("--tc-trace-waterfall-range", String(v));
    };
    if (this.shownRange === undefined || reducedMotion()) {
      cancelAnimationFrame(this.rangeFrame);
      set(range);
      return;
    }
    if (this.rangeTarget === range) return;
    this.rangeTarget = range;
    cancelAnimationFrame(this.rangeFrame);
    const from = this.shownRange;
    if (from === range) return;
    // The first frame's timestamp starts the glide – no clock read of our own
    let t0 = -1;
    const frame = (t: number) => {
      if (t0 < 0) t0 = t;
      const p = Math.min(1, (t - t0) / RESCALE);
      set(from + (range - from) * ease(p));
      if (p < 1) this.rangeFrame = requestAnimationFrame(frame);
    };
    this.rangeFrame = requestAnimationFrame(frame);
  }
  private rangeTarget: number | undefined = undefined;

  /** Under its row, starting where its bar starts – above the row when there is no room below. All reads, then the writes */
  private placePop() {
    const pop = this.pop;
    const body = this.querySelector<HTMLElement>(".ui-tw__body");
    const popSpan = this.m!.openSpan ?? this.closing ?? undefined;
    const row = popSpan ? this.rowOf(popSpan.id) : null;
    if (!pop || !body || !row) return;
    const rowsBox = this.querySelector<HTMLElement>(".ui-tw__rows");
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
    const first = rowsBox ? (rowsBox.getBoundingClientRect().top - b.top) / scale + 4 : 0;
    const raw = rowTop - h - 6;
    const snapped = first + Math.floor((raw - first) / rowH) * rowH;
    const up = snapped >= first ? snapped : raw;
    const top = below + h > body.offsetHeight + 24 && up > 0 ? up : below;
    const start = bar ? (bar.left - b.left) / scale : 8;
    const left = Math.max(8, Math.min(start, body.offsetWidth - w - 8));
    pop.style.left = `${left}px`;
    pop.style.top = `${top}px`;
    pop.dataset.side = top === up ? "above" : "below";
  }

  /* ---------- Keyboard: one row in the tab order, arrows move, left and right fold ---------- */

  private focusRow(r?: Row) {
    if (!r) return;
    this.active = r.span.id;
    // The details window would sit over the rows the focus moves through (2.4.11) – it closes when focus moves on
    if (this.openId && this.openId !== r.span.id) this.setOpen(null);
    const el = this.rowOf(r.span.id);
    if (el) el.focus();
    else this.pendingFocus = r.span.id;
  }

  private onKey(e: KeyboardEvent, r: Row) {
    if (e.target !== e.currentTarget) return;
    const m = this.m!;
    const shownRows = m.shownRows;
    const i = shownRows.findIndex((x) => x.span.id === r.span.id);
    const kids = (r.span.children ?? []).length > 0;
    const isFolded = this.collapsed.includes(r.span.id);
    const keys: Record<string, () => void> = {
      ArrowDown: () => this.focusRow(shownRows[i + 1]),
      ArrowUp: () => this.focusRow(shownRows[i - 1]),
      Home: () => this.focusRow(shownRows[0]),
      End: () => this.focusRow(shownRows[shownRows.length - 1]),
      ArrowRight: () => (kids && isFolded ? this.toggle(r.span.id) : kids ? this.focusRow(shownRows[i + 1]) : undefined),
      ArrowLeft: () => (kids && !isFolded ? this.toggle(r.span.id) : this.focusRow(m.findRow(r.parentId))),
      Enter: () => this.toggleOpen(r.span.id, true),
      " ": () => this.toggleOpen(r.span.id, true),
      Escape: () => {
        if (this.openId) this.setOpen(null);
      },
    };
    if (!keys[e.key]) return;
    e.preventDefault();
    keys[e.key]();
  }

  /* ---------- One row ---------- */

  private renderRow(r: Row, gap: number, shine: boolean) {
    const m = this.m!;
    const s = r.span;
    const kids = s.children ?? [];
    const leaving = r.leaving !== undefined;
    const isFolded = kids.length > 0 && this.collapsed.includes(s.id);
    const isOpen = this.openId === s.id;
    const isSlowest = m.slowest?.id === s.id;
    const tabbable = m.activeId === s.id;
    const delay = m.delays.get(s.id) ?? 0;
    const dur = Math.max(0, m.endOf(s) - s.start);
    const cost = kids.length ? costOf(s) : s.cost;
    const showCost = cost !== undefined && cost > 0 && (s.kind !== "tool" || s.cost !== undefined);
    const post = showCost ? ` · ${this.formatCost(cost!)}` : "";
    const label = `${took(dur)}${post}`;
    const side = sideOf(s.start, dur, needOf(label, isSlowest), m.range, this.trackW);
    const hiddenCount = isFolded ? walk(s).length - 1 : 0;
    // Only a folded row draws its children as marks – an open parent would otherwise carry one per descendant
    const marks = isFolded ? walk(s).slice(1).filter((c) => c.kind === "llm" || c.kind === "tool") : [];
    const vars = { "--s": String(s.start), "--d": String(dur) };
    // A running span's length and duration follow the clock between updates (see writeClock)
    const live = runs(s);
    const run = live ? String(s.start) : undefined;
    const liveAttr = s.status === "running" ? "" : undefined;
    return html`<div
      class="ui-tw__row"
      data-id=${s.id}
      role="treeitem"
      aria-level=${r.depth + 1}
      aria-expanded=${ifDefined(kids.length ? (isFolded ? "false" : "true") : undefined)}
      aria-selected=${isOpen ? "true" : "false"}
      aria-setsize=${r.siblings ?? 1}
      aria-posinset=${(r.index ?? 0) + 1}
      aria-hidden=${ifDefined(r.hidden || leaving ? "true" : undefined)}
      tabindex=${!r.hidden && !leaving && tabbable ? 0 : -1}
      data-kind=${s.kind}
      data-status=${s.status}
      data-parent=${ifDefined(kids.length ? "" : undefined)}
      data-hidden=${ifDefined(r.hidden ? "" : undefined)}
      data-folded=${ifDefined(isFolded ? "" : undefined)}
      data-leaving=${ifDefined(leaving ? "" : undefined)}
      data-open=${ifDefined(isOpen ? "" : undefined)}
      style=${styleMap({ animationDelay: `${leaving ? r.leaving : delay}ms`, marginTop: gap ? `calc(${gap} * var(--tc-trace-waterfall-row))` : undefined })}
      @click=${() => {
        if (leaving) return;
        this.active = s.id;
        this.toggleOpen(s.id, false);
      }}
      @focus=${(e: FocusEvent) => {
        if (e.target === e.currentTarget) this.active = s.id;
      }}
      @keydown=${(e: KeyboardEvent) => this.onKey(e, r)}
    >
      <div class="ui-tw__name">
        ${r.depth > 0 ? html`<span class="ui-tw__guides" style=${styleMap({ width: `calc(${r.depth} * var(--tc-trace-waterfall-indent))` })} aria-hidden="true"></span>` : nothing}
        <span
          class="ui-tw__chev"
          data-leaf=${ifDefined(kids.length ? undefined : "")}
          aria-hidden="true"
          @click=${(e: MouseEvent) => {
            if (!kids.length || leaving) return;
            e.stopPropagation();
            this.active = s.id;
            this.toggle(s.id);
          }}
        >${kids.length > 0 ? chevronIcon : nothing}</span>
        ${spanIcon(s)}
        <span class="ui-tw__label"><span class="ui-tw__title">${s.name}</span>${s.detail ? html`<span class="ui-tw__detail">${s.detail}</span>` : nothing}<span class="ui-tw__sr">, ${KIND[s.kind]}, ${STATUS[s.status]},</span></span>
        ${hiddenCount > 0 ? html`<span class="ui-tw__more">+${hiddenCount}<span class="ui-tw__sr"> folded</span></span>` : nothing}
        ${s.status === "running" && !kids.length ? html`<span class="ui-tw__state" data-status="running">${spinnerIcon}</span>` : nothing}
        ${s.status === "failed" ? html`<span class="ui-tw__state" data-status="failed">${warningIcon}</span>` : nothing}
        <span class="ui-tw__meta">${isSlowest ? html`<span class="ui-tw__slow" title="Slowest"><span class="ui-tw__slow-text">Slowest</span></span>` : nothing}<span class="ui-tw__amount" data-live=${ifDefined(liveAttr)} data-run-took=${ifDefined(run)}>${took(dur)}${showCost ? html`<span class="ui-tw__meta-cost"> · ${this.formatCost(cost!)}</span>` : nothing}</span></span>
      </div>
      <div class="ui-tw__track">
        <span class="ui-tw__bar" data-bar="" data-kind=${s.kind} data-status=${s.status} data-shine=${ifDefined(shine ? "" : undefined)} data-run=${ifDefined(run)} style=${styleMap({ ...vars, animationDelay: `${delay + 60}ms` })}></span>
        ${repeat(
          marks,
          (mk) => mk.id,
          (mk) => html`<span class="ui-tw__mark" data-kind=${mk.kind} data-status=${mk.status} data-run=${ifDefined(runs(mk) ? String(mk.start) : undefined)} style=${styleMap({ "--s": String(mk.start), "--d": String(Math.max(0, m.endOf(mk) - mk.start)) })} aria-hidden="true"></span>`,
        )}
        <span class="ui-tw__tag" data-side=${side} data-run=${ifDefined(run)} data-run-side=${ifDefined(run)} style=${styleMap(vars)}><span class="ui-tw__amount" data-live=${ifDefined(liveAttr)} data-run-took=${ifDefined(run)} data-run-post=${ifDefined(live && post ? post : undefined)}>${label}</span>${isSlowest ? html`<span class="ui-tw__slow">Slowest</span>` : nothing}</span>
      </div>
    </div>`;
  }

  /* ---------- The details ---------- */

  private renderDetails(s: TraceSpan, closing: boolean) {
    const kids = (s.children ?? []).length > 0;
    const [i, o] = tokensOf(s);
    const cost = kids ? costOf(s) : s.cost;
    const stats: [string, string][] = [
      ["Duration", took(this.m!.durOf(s))],
      ["Started", `+${took(s.start)}`],
      ...(cost !== undefined && cost > 0 ? [["Cost", this.formatCost(cost)] as [string, string]] : []),
      ...(i > 0 ? [["Tokens in", tokens(i)] as [string, string]] : []),
      ...(o > 0 ? [["Tokens out", tokens(o)] as [string, string]] : []),
      ...(kids ? [["Spans", String(walk(s).length - 1)] as [string, string]] : []),
    ];
    const close = () => {
      // Back to the span's row before the window goes (or the active row, if that one folded away)
      rescueFocus(this.pop, [this.rowOf(s.id), this.rowOf(this.m!.activeId)]);
      this.setOpen(null);
    };
    return html`<div
      class="ui-tw__pop"
      role="dialog"
      aria-label="${s.name} details"
      tabindex="-1"
      .inert=${closing}
      data-closing=${ifDefined(closing ? "" : undefined)}
      data-kind=${s.kind}
      data-status=${s.status}
      @keydown=${(e: KeyboardEvent) => {
        if (e.key !== "Escape") return;
        e.stopPropagation();
        close();
      }}
    >
      <div class="ui-tw__pop-head">
        ${spanIcon(s)}
        <span class="ui-tw__pop-who"><span class="ui-tw__pop-name">${s.name}</span><span class="ui-tw__pop-kind">${KIND[s.kind]}${s.model ? ` · ${s.model}` : s.detail ? ` · ${s.detail}` : ""}</span></span>
        <span class="ui-tw__pill" data-status=${s.status}>${STATUS[s.status]}</span>
        <button type="button" class="ui-tw__close" aria-label="Close details" @click=${close}>${cancelIcon}</button>
      </div>
      <dl class="ui-tw__pop-stats">
        ${stats.map(([k, v]) => html`<div><dt>${k}</dt><dd data-run-took=${ifDefined(k === "Duration" && runs(s) ? String(s.start) : undefined)}>${v}</dd></div>`)}
      </dl>
      ${s.error ? html`<p class="ui-tw__pop-error">${warningIcon}${s.error}</p>` : nothing}
      ${s.input ? html`<div class="ui-tw__pop-io"><span>Input</span><p>${s.input}</p></div>` : nothing}
      ${s.output ? html`<div class="ui-tw__pop-io"><span>Output</span><p>${s.output}</p></div>` : nothing}
    </div>`;
  }

  protected override render() {
    const m = this.m!;
    const root = this.root;
    const [tin, tout] = tokensOf(root);
    const errors = m.all.filter((s) => s.status === "failed").length;
    const running = m.runState === "running";
    const stats: { label: string; value: string; live?: boolean; kind?: string; run?: number }[] = [
      { label: "Duration", value: took(m.durOf(root)), live: running, run: runs(root) ? root.start : undefined },
      { label: "Cost", value: this.formatCost(costOf(root)), live: running },
      { label: "Tokens", value: tokens(tin + tout), live: running },
      { label: "LLM calls", value: String(m.all.filter((s) => s.kind === "llm").length) },
      { label: "Tool calls", value: String(m.all.filter((s) => s.kind === "tool").length) },
      { label: "Errors", value: String(errors), kind: errors ? "failed" : undefined },
    ];

    // The row window: the rows near the viewport, plus the focused and the open row
    const shownRows = m.shownRows;
    const win = this.rowWindow.compute();
    const virtual = this.rowWindow.virtual;
    let renderRows: { row: Row; gap: number }[];
    let lastShown = -1;
    if (!virtual) renderRows = m.rows.map((row) => ({ row, gap: 0 }));
    else {
      const keep = new Set<number>();
      for (let i = win.start; i < win.end; i++) keep.add(i);
      for (const id of [m.activeId, this.openId]) {
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
    const popSpan = m.openSpan ?? this.closing ?? undefined;

    return html`
      <header class="ui-tw__bar-head">
        <span class="ui-tw__spark">${sparkIcon}</span>
        <span class="ui-tw__heading">${this.heading}</span>
        <span class="ui-tw__task">${root.input ?? root.name}</span>
        <span class="ui-tw__pill" data-status=${m.runState} aria-live="polite">${running ? html`<span class="ui-tw__pulse" aria-hidden="true"></span>` : nothing}${running ? "Live" : STATUS[m.runState]}</span>
      </header>

      <div class="ui-tw__card">
        <dl class="ui-tw__stats">
          ${stats.map(
            (s) => html`<div class="ui-tw__stat" data-kind=${ifDefined(s.kind)}>
              <dt>${s.label}</dt>
              <dd><span class="ui-tw__amount" data-live=${ifDefined(s.live ? "" : undefined)} data-run-took=${ifDefined(s.run === undefined ? undefined : String(s.run))}>${s.value}</span></dd>
            </div>`,
          )}
        </dl>

        <div class="ui-tw__body">
          <div class="ui-tw__layer" aria-hidden="true" style=${styleMap({ "--tc-trace-waterfall-at": String(m.now) })}>
            ${repeat(
              m.tickList,
              (t) => t.v,
              ({ v, leaving }) => html`<span class="ui-tw__tick" data-zero=${ifDefined(v === 0 ? "" : undefined)} data-leaving=${ifDefined(leaving ? "" : undefined)} style=${styleMap({ "--v": String(v) })}><span>${tickLabel(v)}</span></span>`,
            )}
            ${running ? html`<span class="ui-tw__now"></span>` : nothing}
          </div>
          <div class="ui-tw__axis" aria-hidden="true"><span>Span</span></div>
          <div
            class="ui-tw__rows"
            role="tree"
            aria-label=${this.heading}
            data-virtual=${ifDefined(virtual ? "" : undefined)}
            style=${styleMap({ paddingBottom: virtual ? `calc(${shownRows.length - lastShown - 1} * var(--tc-trace-waterfall-row))` : undefined })}
          >
            ${repeat(
              renderRows,
              ({ row }) => (row.leaving !== undefined ? `${row.span.id}~out` : row.span.id),
              ({ row, gap }) => this.renderRow(row, gap, shining.has(row.span.id)),
            )}
          </div>
          ${popSpan ? this.renderDetails(popSpan, !m.openSpan) : nothing}
        </div>
      </div>
    `;
  }

  static override css = /* css */ `
/* Colors, sizes and motion as variables – override them on [data-ui="tw"] */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="tw"] {
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
/* Colors, sizes and motion as variables – override them on [data-ui="tw"] */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="tw"] {
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
[data-ui="tw"] *, [data-ui="tw"] *::before, [data-ui="tw"] *::after { box-sizing: border-box; }
:where([data-ui="tw"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="tw"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="tw"] :is(p, dl, dd) { margin: 0; }
[data-ui="tw"] svg { display: block; flex: none; }
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="tw"] :is(.ui-tw__stat dt, .ui-tw__axis, .ui-tw__pop-stats dt, .ui-tw__pop-io > span) { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
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
/* Forced colours drop box-shadow: an outline instead */
@media (forced-colors: active) { .ui-tw__row:focus-visible { outline: 2px solid Highlight; outline-offset: -2px; } }
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
[data-ui="tw"] [data-kind="llm"] .ui-tw__swatch, .ui-tw__pop[data-kind="llm"] .ui-tw__swatch { border-radius: 50%; }
[data-ui="tw"] [data-kind="tool"] .ui-tw__swatch, .ui-tw__pop[data-kind="tool"] .ui-tw__swatch { width: 7px; height: 7px; border-radius: var(--tc-radius-2xs); transform: rotate(45deg); }
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
:where([data-look="standard"], [data-look="standard"] *)[data-ui="tw"] [data-kind] { --tc-trace-waterfall-span-bg: var(--tc-trace-waterfall-agent-bg); --tc-trace-waterfall-span-edge: var(--tc-trace-waterfall-agent-edge); --tc-trace-waterfall-span-ink: var(--tc-trace-waterfall-agent-ink); --tc-trace-waterfall-span-mark: var(--tc-trace-waterfall-agent-mark); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="tw"] [data-kind] { --tc-trace-waterfall-span-bg: var(--tc-fill-default); --tc-trace-waterfall-span-edge: var(--tc-border-strong); --tc-trace-waterfall-span-ink: var(--tc-text-secondary); --tc-trace-waterfall-span-mark: var(--tc-trace-waterfall-agent-mark); }
[data-ui="tw"] [data-kind="llm"] { --tc-trace-waterfall-span-bg: var(--tc-trace-waterfall-llm-bg); --tc-trace-waterfall-span-edge: var(--tc-trace-waterfall-llm-edge); --tc-trace-waterfall-span-ink: var(--tc-trace-waterfall-llm-ink); --tc-trace-waterfall-span-mark: var(--tc-trace-waterfall-llm-mark); }
[data-ui="tw"] [data-kind="tool"] { --tc-trace-waterfall-span-bg: var(--tc-trace-waterfall-tool-bg); --tc-trace-waterfall-span-edge: var(--tc-trace-waterfall-tool-edge); --tc-trace-waterfall-span-ink: var(--tc-trace-waterfall-tool-ink); --tc-trace-waterfall-span-mark: var(--tc-trace-waterfall-tool-mark); }
[data-ui="tw"] [data-kind][data-status="failed"] { --tc-trace-waterfall-span-bg: var(--tc-status-danger-bg); --tc-trace-waterfall-span-edge: var(--tc-status-danger-border); --tc-trace-waterfall-span-ink: var(--tc-status-danger-fg); --tc-trace-waterfall-span-mark: var(--tc-status-danger-solid); }
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
[data-ui="tw"][data-offscreen] *, [data-ui="tw"][data-offscreen] *::before, [data-ui="tw"][data-offscreen] *::after { animation-play-state: paused; }
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
  [data-ui="tw"] *, [data-ui="tw"] *::before, [data-ui="tw"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-trace-waterfall")) customElements.define("tc-trace-waterfall", TcTraceWaterfall);

declare global {
  interface HTMLElementTagNameMap {
    "tc-trace-waterfall": TcTraceWaterfall;
  }
}
