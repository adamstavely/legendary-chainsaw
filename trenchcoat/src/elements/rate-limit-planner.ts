import { html, nothing, svg } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-rate-limit-planner> – plan when agent runs happen so they stay under one API rate limit (tokens per minute). On
 * top, the day's load as a stepped area with the limit as a line; whatever goes over it is hatched in the danger
 * colour. Below, a row per run – its name, agent, times and tokens a minute – with a bar on the same time axis that
 * you drag, or focus and move with the arrow keys; the chart follows as it moves. The header says the peak and how far
 * over in words, and Spread out proposes start times that lower the peak (the page may refuse them).
 *   · the bars are one tab stop: ↑ / ↓ move between runs, ← / → move a run by `step` minutes (15), Shift by an hour,
 *     Home / End to the start or end of the day
 *   · a `fixed` run (a briefing that must go out at 06:00) is drawn but neither dragged nor spread
 *   · narrow, the time axis keeps its width and scrolls sideways, with the names held at the left
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-rate-limit-planner limit="400000" .day=${midnight} .runs=${[{ id: "r1", name: "Wire summaries", start, minutes: 90, tokensPerMinute: 180000 }]}></tc-rate-limit-planner>
 */

export type PlannedRun = {
  id: string;
  name: string;
  /** The agent that runs it */
  agent?: string;
  /** When it starts, as epoch ms */
  start: number;
  /** How long it runs, in minutes */
  minutes: number;
  /** Its load on the limit while it runs */
  tokensPerMinute: number;
  /** Must run when it does: drawn, but not dragged or spread */
  fixed?: boolean;
};

/** Details of the events */
export type RateLimitRunsChange = { runs: PlannedRun[]; change: "move" | "spread"; id: string | null };

const MIN = 60_000;

/** The total load in each `step`-minute slot from `from` for `minutes` */
export function rateLoad(runs: readonly PlannedRun[], from: number, minutes: number, step = 15): number[] {
  const slots = Math.max(1, Math.ceil(minutes / step));
  const out = new Array<number>(slots).fill(0);
  for (const r of runs) {
    const a = (r.start - from) / MIN;
    const b = a + r.minutes;
    for (let i = Math.max(0, Math.floor(a / step)); i < slots && i * step < b; i++) {
      if ((i + 1) * step > a) out[i] += r.tokensPerMinute;
    }
  }
  return out;
}

/**
 * Start times that lower the day's peak: fixed runs stay; the others, biggest first, each go where the load they'd add
 * to is lowest, nearest their own start on a tie. Runs come back in the order given
 */
export function spreadRuns(runs: readonly PlannedRun[], { day, hours = 24, step = 15 }: { day: number; hours?: number; step?: number }): PlannedRun[] {
  const span = hours * 60;
  const slots = Math.ceil(span / step);
  const load = new Array<number>(slots).fill(0);
  const add = (start: number, r: PlannedRun) => {
    const a = (start - day) / MIN;
    for (let i = Math.max(0, Math.floor(a / step)); i < slots && i * step < a + r.minutes; i++) if ((i + 1) * step > a) load[i] += r.tokensPerMinute;
  };
  for (const r of runs) if (r.fixed) add(r.start, r);
  const placed = new Map<string, number>();
  const order = runs.filter((r) => !r.fixed).sort((a, b) => b.tokensPerMinute * b.minutes - a.tokensPerMinute * a.minutes);
  for (const r of order) {
    const len = Math.ceil(r.minutes / step);
    let best = r.start;
    let bestPeak = Infinity;
    for (let s = 0; s + len <= slots; s++) {
      let peak = 0;
      for (let i = s; i < s + len; i++) peak = Math.max(peak, load[i]);
      const start = day + s * step * MIN;
      if (peak < bestPeak || (peak === bestPeak && Math.abs(start - r.start) < Math.abs(best - r.start))) {
        bestPeak = peak;
        best = start;
      }
    }
    placed.set(r.id, best);
    add(best, r);
  }
  return runs.map((r) => (placed.has(r.id) && placed.get(r.id) !== r.start ? { ...r, start: placed.get(r.id)! } : r));
}

/* Lucide (ISC, lucide.dev) */
const gaugeIcon = svg`<path d="m12 14 4-4"></path><path d="M3.34 19a10 10 0 1 1 17.32 0"></path>`;
const lockIcon = html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`;

let uidCount = 0;

/**
 * Plan agent runs under one API rate limit – the day's load against the limit, overflow hatched, a draggable bar per
 * run and Spread out to lower the peak.
 * @tag tc-rate-limit-planner
 * @fires tc-runs-change - A run was moved, or Spread out proposed new start times ({ runs, change, id }: RateLimitRunsChange); cancelable – prevented, `runs` stays as it was
 */
export class TcRateLimitPlanner extends TcElement {
  static override ui = "rlp";

  /** The heading */
  @property() accessor heading = "Rate limit plan";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The runs. Changed by dragging, the keys and Spread out unless a tc-runs-change listener calls preventDefault() */
  @property({ attribute: false }) accessor runs: PlannedRun[] = [];
  /** The limit, in tokens per minute */
  @property({ type: Number }) accessor limit = 0;
  /** Where the time axis starts, as epoch ms; by default the UTC midnight before the first run */
  @property({ type: Number }) accessor day: number | undefined = undefined;
  /** How many hours the axis covers */
  @property({ type: Number }) accessor hours = 24;
  /** The minutes a run moves by, and the chart's resolution */
  @property({ type: Number }) accessor step = 15;
  /** The language for numbers and times, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;
  /** The time zone times are shown in, e.g. "Europe/London"; by default the browser's */
  @property({ attribute: "time-zone" }) accessor timeZone: string | undefined = undefined;

  /** The run holding the tab stop */
  @state() private accessor active: string | null = null;
  /** The run being dragged, with where the drag began */
  @state() private accessor drag: { id: string; x: number; start: number; width: number } | null = null;
  /** A polite message for screen readers */
  @state() private accessor announce = "";

  private uid = `tc-rlp-${++uidCount}`;

  /* ---------- Scale and words ---------- */

  private get from() {
    if (this.day !== undefined) return this.day;
    const first = Math.min(...this.runs.map((r) => r.start));
    return Number.isFinite(first) ? Math.floor(first / 86_400_000) * 86_400_000 : 0;
  }
  private get span() {
    return Math.max(1, this.hours) * 60;
  }
  private get load() {
    return rateLoad(this.runs, this.from, this.span, this.step);
  }
  private tokens(v: number) {
    return new Intl.NumberFormat(this.locale, { notation: "compact", maximumFractionDigits: 1 }).format(v);
  }
  private time(t: number) {
    return new Intl.DateTimeFormat(this.locale, { hour: "2-digit", minute: "2-digit", timeZone: this.timeZone }).format(t);
  }
  private duration(minutes: number) {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return h && m ? `${h} h ${m} min` : h ? `${h} h` : `${m} min`;
  }
  private pct(v: number) {
    return new Intl.NumberFormat(this.locale, { style: "percent", maximumFractionDigits: 0 }).format(v);
  }
  /** The peak, when it is, and the stretches over the limit */
  get summary() {
    const load = this.load;
    const peak = Math.max(0, ...load);
    const at = this.from + load.indexOf(peak) * this.step * MIN;
    const over: { from: number; to: number }[] = [];
    load.forEach((v, i) => {
      if (this.limit <= 0 || v <= this.limit) return;
      const s = this.from + i * this.step * MIN;
      const last = over[over.length - 1];
      if (last && last.to === s) last.to = s + this.step * MIN;
      else over.push({ from: s, to: s + this.step * MIN });
    });
    return { peak, at, over };
  }
  /** "Peak 520K a minute at 01:15 – 30% over the limit" or "Peak 310K a minute at 04:00 – 78% of the limit" */
  peakWords() {
    const { peak, at } = this.summary;
    if (!peak) return "Nothing planned";
    const base = `Peak ${this.tokens(peak)} a minute at ${this.time(at)}`;
    if (this.limit <= 0) return base;
    return peak > this.limit ? `${base} – ${this.pct(peak / this.limit - 1)} over the limit` : `${base} – ${this.pct(peak / this.limit)} of the limit`;
  }
  /** "Over the limit for 1 h 15 min: 01:00–02:15" or "Under the limit all day" */
  overWords() {
    const { over } = this.summary;
    if (this.limit <= 0) return "";
    if (!over.length) return "Under the limit all day";
    const total = over.reduce((n, o) => n + (o.to - o.from) / MIN, 0);
    return `Over the limit for ${this.duration(total)}: ${over.map((o) => `${this.time(o.from)}–${this.time(o.to)}`).join(", ")}`;
  }
  private overlapsOver(r: PlannedRun) {
    return this.summary.over.some((o) => r.start < o.to && r.start + r.minutes * MIN > o.from);
  }
  valueText(r: PlannedRun) {
    return `Starts ${this.time(r.start)}, ends ${this.time(r.start + r.minutes * MIN)}${this.overlapsOver(r) ? ", while over the limit" : ""}`;
  }

  /* ---------- Changes ---------- */

  private commit(runs: PlannedRun[], change: RateLimitRunsChange["change"], id: string | null, words = "") {
    if (!this.emit<RateLimitRunsChange>("tc-runs-change", { runs, change, id }, { cancelable: true })) return false;
    this.runs = runs;
    if (words) this.announce = words;
    return true;
  }
  /** Moves a run to start at `start`, snapped to `step` and kept inside the day */
  moveTo(id: string, start: number, announce = false) {
    const r = this.runs.find((x) => x.id === id);
    if (!r || r.fixed) return;
    const stepMs = this.step * MIN;
    const latest = this.from + (this.span - r.minutes) * MIN;
    const next = Math.min(latest, Math.max(this.from, this.from + Math.round((start - this.from) / stepMs) * stepMs));
    if (next === r.start) return;
    const runs = this.runs.map((x) => (x.id === id ? { ...x, start: next } : x));
    const moved = { ...r, start: next };
    this.commit(runs, "move", id);
    if (announce) this.announce = `${r.name}: ${this.valueText(moved)}. ${this.peakWords()}`;
  }
  /** Proposes start times that lower the peak, and applies them unless the page prevents it */
  spread() {
    const before = this.summary.peak;
    const runs = spreadRuns(this.runs, { day: this.from, hours: this.hours, step: this.step });
    const after = Math.max(0, ...rateLoad(runs, this.from, this.span, this.step));
    if (runs.every((r, i) => r === this.runs[i]) || after >= before) {
      this.announce = "Spreading out wouldn't lower the peak";
      return;
    }
    this.commit(runs, "spread", null, `Spread out: peak from ${this.tokens(before)} to ${this.tokens(after)} a minute`);
  }

  /* ---------- Pointer and keys ---------- */

  private onDown(e: PointerEvent, r: PlannedRun) {
    if (e.button !== 0 || r.fixed) return;
    e.preventDefault();
    const bar = e.currentTarget as HTMLElement;
    bar.focus();
    this.active = r.id;
    const track = bar.parentElement!.getBoundingClientRect();
    this.drag = { id: r.id, x: e.clientX, start: r.start, width: track.width };
    try {
      bar.setPointerCapture(e.pointerId);
    } catch {
      /* not capturable */
    }
  }
  private onMove(e: PointerEvent, r: PlannedRun) {
    const d = this.drag;
    if (!d || d.id !== r.id || d.width <= 0) return;
    this.moveTo(r.id, d.start + ((e.clientX - d.x) / d.width) * this.span * MIN);
  }
  private onUp(e: PointerEvent, r: PlannedRun) {
    if (this.drag?.id !== r.id) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    this.drag = null;
    const now = this.runs.find((x) => x.id === r.id);
    if (now) this.announce = `${now.name}: ${this.valueText(now)}. ${this.peakWords()}`;
  }
  private onKey(e: KeyboardEvent, r: PlannedRun) {
    const movable = this.runs.filter((x) => !x.fixed);
    const i = movable.findIndex((x) => x.id === r.id);
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = movable[Math.min(movable.length - 1, Math.max(0, i + (e.key === "ArrowUp" ? -1 : 1)))];
      if (next) {
        this.active = next.id;
        void this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-rlp__bar[data-id="${CSS.escape(next.id)}"]`)?.focus());
      }
      return;
    }
    const by = e.shiftKey ? 60 : this.step;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      this.moveTo(r.id, r.start + (e.key === "ArrowRight" ? by : -by) * MIN, true);
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      this.moveTo(r.id, e.key === "Home" ? this.from : this.from + this.span * MIN, true);
    }
  }

  /* ---------- Rendering ---------- */

  private x(t: number) {
    return `${((t - this.from) / MIN / this.span) * 100}%`;
  }

  private renderChart() {
    const load = this.load;
    const n = load.length;
    const top = Math.max(this.limit, ...load) * 1.15 || 1;
    const H = 100;
    const y = (v: number) => H - (v / top) * H;
    let area = `M0 ${H}`;
    let line = "";
    load.forEach((v, i) => {
      area += ` L${i} ${y(v).toFixed(2)} L${i + 1} ${y(v).toFixed(2)}`;
      line += `${i ? " L" : "M"}${i} ${y(v).toFixed(2)} L${i + 1} ${y(v).toFixed(2)}`;
    });
    area += ` L${n} ${H} Z`;
    const yl = this.limit > 0 ? y(this.limit) : null;
    const every = this.hours <= 12 ? 2 : this.hours <= 24 ? 3 : 6;
    const ticks = Array.from({ length: Math.floor(this.hours / every) + 1 }, (_, i) => this.from + i * every * 60 * MIN);
    const clip = `${this.uid}-over`;
    const hatch = `${this.uid}-hatch`;
    return html`<div class="ui-rlp__chart-row">
      <div class="ui-rlp__axis-label" aria-hidden="true">
        <span class="ui-rlp__peak-num">${this.tokens(this.summary.peak)}</span><span>peak a minute</span>
      </div>
      <div class="ui-rlp__chart" role="img" aria-label=${`${this.peakWords()}. ${this.overWords()}`}>
        <svg class="ui-rlp__svg" viewBox=${`0 0 ${n} ${H}`} preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <pattern id=${hatch} width="1.2" height="6" patternUnits="userSpaceOnUse" patternTransform="skewX(-30)">
              <rect class="ui-rlp__hatch-bg" width="1.2" height="6"></rect>
              <rect class="ui-rlp__hatch-line" width="0.45" height="6"></rect>
            </pattern>
            ${yl !== null ? svg`<clipPath id=${clip}><rect x="0" y="0" width=${n} height=${yl}></rect></clipPath>` : nothing}
          </defs>
          <path class="ui-rlp__area" d=${area}></path>
          ${yl !== null ? svg`<path class="ui-rlp__over" d=${area} clip-path=${`url(#${clip})`} fill=${`url(#${hatch})`}></path>` : nothing}
          <path class="ui-rlp__line" d=${line} vector-effect="non-scaling-stroke"></path>
          ${yl !== null ? svg`<line class="ui-rlp__limit" x1="0" x2=${n} y1=${yl} y2=${yl} vector-effect="non-scaling-stroke"></line>` : nothing}
        </svg>
        ${yl !== null
          ? html`<span class="ui-rlp__limit-label" style=${`top: ${yl}%`} aria-hidden="true">Limit ${this.tokens(this.limit)}/min</span>`
          : nothing}
        <div class="ui-rlp__ticks" aria-hidden="true">
          ${ticks.map((t, i) => html`<span class="ui-rlp__tick" data-edge=${i === 0 ? "start" : i === ticks.length - 1 ? "end" : "mid"} style=${`left: ${this.x(t)}`}>${this.time(t)}</span>`)}
        </div>
      </div>
    </div>`;
  }

  private renderRun(r: PlannedRun, tab: string | null) {
    const over = this.overlapsOver(r);
    const end = r.start + r.minutes * MIN;
    const latest = this.span - r.minutes;
    return html`<li class="ui-rlp__row" data-id=${r.id}>
      <div class="ui-rlp__name">
        <span class="ui-rlp__run">${r.name}</span>
        <span class="ui-rlp__meta"
          >${r.agent ? html`${r.agent} · ` : nothing}${this.time(r.start)}–${this.time(end)} · ${this.tokens(r.tokensPerMinute)}/min${r.fixed ? " · Fixed" : nothing}</span
        >
      </div>
      <div class="ui-rlp__track">
        ${r.fixed
          ? html`<span class="ui-rlp__bar" data-id=${r.id} data-fixed ?data-over=${over} style=${`left: ${this.x(r.start)}; width: ${this.x(this.from + r.minutes * MIN)}`}
              >${lockIcon}<span class="tc-sr-only">${r.name}, fixed: ${this.valueText(r)}</span></span
            >`
          : html`<span
              class="ui-rlp__bar"
              data-id=${r.id}
              role="slider"
              tabindex=${tab === r.id ? 0 : -1}
              aria-label=${`${r.name} start`}
              aria-valuemin="0"
              aria-valuemax=${Math.max(0, latest)}
              aria-valuenow=${Math.round((r.start - this.from) / MIN)}
              aria-valuetext=${this.valueText(r)}
              aria-describedby=${`${this.uid}-keys`}
              ?data-over=${over}
              ?data-dragging=${this.drag?.id === r.id}
              style=${`left: ${this.x(r.start)}; width: ${this.x(this.from + r.minutes * MIN)}`}
              @focus=${() => (this.active = r.id)}
              @pointerdown=${(e: PointerEvent) => this.onDown(e, r)}
              @pointermove=${(e: PointerEvent) => this.onMove(e, r)}
              @pointerup=${(e: PointerEvent) => this.onUp(e, r)}
              @pointercancel=${(e: PointerEvent) => this.onUp(e, r)}
              @keydown=${(e: KeyboardEvent) => this.onKey(e, r)}
            ></span>`}
      </div>
    </li>`;
  }

  protected override render() {
    const { peak } = this.summary;
    const isOver = this.limit > 0 && peak > this.limit;
    const movable = this.runs.filter((r) => !r.fixed);
    const tab = movable.some((r) => r.id === this.active) ? this.active : (movable[0]?.id ?? null);
    return html`
      <span class="tc-sr-only" role="status">${this.announce}</span>
      <span class="tc-sr-only" id=${`${this.uid}-keys`}
        >Left and right arrows move the run by ${this.step} minutes, Shift with an arrow by an hour, Home and End to the ends of the day. Up and down arrows go to the other runs.</span
      >
      ${cardHead({
        icon: gaugeIcon,
        title: this.heading,
        subtitle: this.description,
        id: `${this.uid}-title`,
        aside: html`<span class="ui-rlp__aside">
          <span class="ui-rlp__pill" data-tone=${isOver ? "danger" : "success"}>${isOver ? "Over the limit" : "Under the limit"}</span>
          <button type="button" class="tc-btn-sm ui-rlp__spread" ?disabled=${!movable.length} @click=${() => this.spread()}>Spread out</button>
        </span>`,
      })}
      <div class="ui-rlp__card">
        <div class="ui-rlp__words">
          <span class="ui-rlp__peak" ?data-over=${isOver}>${this.peakWords()}</span>
          ${this.overWords() ? html`<span class="ui-rlp__over-words">${this.overWords()}</span>` : nothing}
        </div>
        <div class="ui-rlp__scroll">
          <div class="ui-rlp__grid">
            ${this.renderChart()}
            ${this.runs.length
              ? html`<ul class="ui-rlp__rows" aria-labelledby=${`${this.uid}-title`}>${repeat(this.runs, (r) => r.id, (r) => this.renderRun(r, tab))}</ul>`
              : html`<p class="ui-rlp__empty">No runs planned.</p>`}
          </div>
        </div>
        <ul class="ui-rlp__legend" aria-hidden="true">
          <li><span class="ui-rlp__swatch" data-k="load"></span>Load</li>
          <li><span class="ui-rlp__swatch" data-k="limit"></span>Limit</li>
          <li><span class="ui-rlp__swatch" data-k="over"></span>Over the limit</li>
          <li><span class="ui-rlp__swatch" data-k="run"></span>Run – drag, or use the arrow keys</li>
        </ul>
      </div>
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="rlp"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary); text-align: left; -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="rlp"] {
  position: relative; display: block; box-sizing: border-box; width: 100%; overflow: hidden;
  border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary); text-align: left; -webkit-font-smoothing: antialiased;
}
/* The name column, the chart's height, a bar's height and the axis's narrowest width – override on the element */
[data-ui="rlp"] { --tc-rlp-names: 196px; --tc-rlp-chart-h: 140px; --tc-rlp-bar-h: 18px; --tc-rlp-min: 640px; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="rlp"] { --tc-rlp-bg: var(--tc-surface-on-tray); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="rlp"] { --tc-rlp-bg: var(--tc-surface-raised); }
[data-ui="rlp"] *, [data-ui="rlp"] *::before, [data-ui="rlp"] *::after { box-sizing: border-box; }
[data-ui="rlp"] ul, [data-ui="rlp"] p { margin: 0; padding: 0; list-style: none; }
[data-ui="rlp"] svg { display: block; }
:where([data-look="standard"], [data-look="standard"] *).ui-rlp__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-rlp__aside { display: inline-flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: var(--tc-space-2); }
.ui-rlp__pill { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); white-space: nowrap; }
.ui-rlp__pill[data-tone="danger"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-rlp__pill[data-tone="success"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-rlp__words { display: grid; gap: var(--tc-space-0-5); padding: var(--tc-space-4) var(--tc-space-5) var(--tc-space-2); }
.ui-rlp__peak { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-rlp__peak[data-over] { color: var(--tc-status-danger-fg); }
.ui-rlp__over-words { font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
.ui-rlp__scroll { overflow-x: auto; padding-bottom: var(--tc-space-2); }
.ui-rlp__grid { min-width: var(--tc-rlp-min); padding: var(--tc-space-2) var(--tc-space-5) 0 0; }
.ui-rlp__chart-row, .ui-rlp__row { display: grid; grid-template-columns: var(--tc-rlp-names) minmax(0, 1fr); align-items: center; }
.ui-rlp__axis-label, .ui-rlp__name { position: sticky; left: 0; z-index: 1; align-self: stretch; padding: 0 var(--tc-space-3) 0 var(--tc-space-5); background: var(--tc-rlp-bg); }
.ui-rlp__axis-label { display: grid; align-content: start; font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-rlp__peak-num { font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-strong); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-rlp__chart { position: relative; height: var(--tc-rlp-chart-h); margin-bottom: var(--tc-space-6); }
.ui-rlp__svg { width: 100%; height: 100%; overflow: visible; }
.ui-rlp__area { fill: var(--tc-accent-subtle); }
.ui-rlp__line { fill: none; stroke: var(--tc-accent); stroke-width: 1.5px; }
.ui-rlp__over { stroke: none; }
.ui-rlp__hatch-bg { fill: var(--tc-status-danger-bg); }
.ui-rlp__hatch-line { fill: var(--tc-status-danger-solid); }
.ui-rlp__limit { stroke: var(--tc-status-danger-solid); stroke-width: 1.5px; stroke-dasharray: 5 4; }
.ui-rlp__limit-label { position: absolute; right: 0; translate: 0 calc(-100% - var(--tc-space-0-5)); padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-sm); background: var(--tc-rlp-bg); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-status-danger-fg); white-space: nowrap; }
.ui-rlp__ticks { position: absolute; inset: 100% 0 auto 0; height: var(--tc-space-5); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-rlp__tick { position: absolute; top: var(--tc-space-1); translate: -50% 0; font-size: var(--tc-font-size-2xs); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-rlp__tick[data-edge="start"] { translate: 0 0; }
.ui-rlp__tick[data-edge="end"] { translate: -100% 0; }
.ui-rlp__rows { display: grid; }
.ui-rlp__row { min-height: var(--tc-control-h-md); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-rlp__name { display: grid; align-content: center; min-width: 0; padding-block: var(--tc-space-1-5); }
.ui-rlp__run { overflow: hidden; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); text-overflow: ellipsis; white-space: nowrap; }
.ui-rlp__meta { overflow: hidden; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); text-overflow: ellipsis; white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-rlp__track { position: relative; align-self: stretch; min-height: var(--tc-control-h-md); background-image: linear-gradient(to right, var(--tc-divider) var(--tc-hairline), transparent var(--tc-hairline)); background-size: calc(100% / 8) 100%; }
.ui-rlp__bar { position: absolute; top: 50%; display: grid; place-items: center; height: var(--tc-rlp-bar-h); min-width: var(--tc-space-2); translate: 0 -50%; border-radius: var(--tc-radius-sm); background: var(--tc-accent-solid); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-accent); color: var(--tc-text-on-accent); cursor: grab; touch-action: none; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-rlp__bar[data-over] { background: repeating-linear-gradient(135deg, var(--tc-status-danger-solid) 0 4px, var(--tc-accent-solid) 4px 8px); }
.ui-rlp__bar[data-dragging] { cursor: grabbing; box-shadow: var(--tc-shadow-raised-hover); }
.ui-rlp__bar[data-fixed] { background: var(--tc-fill-strong); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-strong); color: var(--tc-text-secondary); cursor: default; }
.ui-rlp__bar[data-fixed] svg { width: 12px; height: 12px; }
.ui-rlp__bar:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-rlp__empty { padding: var(--tc-space-6) var(--tc-space-4) !important; color: var(--tc-text-muted); text-align: center; }
.ui-rlp__legend { display: flex; flex-wrap: wrap; gap: var(--tc-space-1) var(--tc-space-4); padding: var(--tc-space-3) var(--tc-space-5) !important; border-top: var(--tc-hairline) solid var(--tc-divider); font-size: var(--tc-font-size-xs); color: var(--tc-text-secondary); }
.ui-rlp__legend li { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); }
.ui-rlp__swatch { width: var(--tc-space-3); height: var(--tc-space-2); border-radius: var(--tc-radius-2xs); }
.ui-rlp__swatch[data-k="load"] { background: var(--tc-accent-subtle); box-shadow: inset 0 calc(var(--tc-hairline) * 2) 0 var(--tc-accent); }
.ui-rlp__swatch[data-k="limit"] { height: 2px; background: var(--tc-status-danger-solid); }
.ui-rlp__swatch[data-k="over"] { background: repeating-linear-gradient(135deg, var(--tc-status-danger-solid) 0 2px, var(--tc-status-danger-bg) 2px 4px); }
.ui-rlp__swatch[data-k="run"] { background: var(--tc-accent-solid); }
@container (max-width: 520px) {
  [data-ui="rlp"] { --tc-rlp-names: 148px; }
  .ui-rlp__axis-label, .ui-rlp__name { padding-left: var(--tc-space-3); }
  .ui-rlp__words { padding-inline: var(--tc-space-3); }
}
@media (forced-colors: active) {
  .ui-rlp__bar { background: Highlight !important; forced-color-adjust: none; }
  .ui-rlp__bar[data-fixed] { background: GrayText !important; }
  .ui-rlp__line { stroke: CanvasText; }
  .ui-rlp__limit, .ui-rlp__hatch-line { stroke: Highlight; fill: Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="rlp"] *, [data-ui="rlp"] *::before, [data-ui="rlp"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-rate-limit-planner")) customElements.define("tc-rate-limit-planner", TcRateLimitPlanner);

declare global {
  interface HTMLElementTagNameMap {
    "tc-rate-limit-planner": TcRateLimitPlanner;
  }
}
