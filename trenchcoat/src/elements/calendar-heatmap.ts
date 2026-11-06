import { html, nothing, svg, type SVGTemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { keyed } from "lit/directives/keyed.js";
import { reducedMotion } from "../internal/reduced-motion";
import { getter, numGetter } from "./internal/chart/accessor";
import { txt } from "./internal/chart/axis";
import { canvasUnderlay, paintCanvas } from "./internal/chart/canvas";
import { AXIS_FONT, TcChartElement, type ChartFrame, type ChartModel } from "./internal/chart/element";
import { formatDate, toDate } from "./internal/chart/format";
import { resolveHighlight } from "./internal/chart/highlight";
import { plural } from "./internal/chart/i18n";
import { lazyArray } from "./internal/chart/lazy";
import { extent, robustMax } from "./internal/chart/scale";
import { textWidth } from "./internal/chart/text";
import type { Accessor, Row, TooltipData } from "./internal/chart/types";

/*
 * <tc-calendar-heatmap> – an amount per day on a grid of weeks: each column a week, each row a weekday, each day shaded
 * by its value. Ported from ztd-charts' CalendarHeatmap (MIT, © 2026 Junhan2). One range is drawn from the first day
 * to the last; data over several years is drawn a year per row, each from January to December. The shading is the
 * accent mixed into the card's colour, light for little and full for the most (the 95th percentile, so one outlier
 * doesn't wash out the rest); a day with nothing is the quiet empty ink, and the busiest day is outlined (`highlight`
 * picks others). Weeks fade in from left to right when the chart comes on screen; data changes cross-fade the shades.
 * Above `canvas-threshold` days (4,000 by default – about eleven years) the days are painted on a canvas under the SVG.
 *   · one tab stop: ↑ ↓ move a day, ← → a week; each day is read with its value
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-calendar-heatmap heading="Samples logged" .data=${[{ date: "2026-03-02", value: 14 }]}></tc-calendar-heatmap>
 */

/** A calendar with days: Lucide's "calendar-days" (ISC, lucide.dev) */
const calendarIcon = svg`<path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path><path d="M8 14h.01"></path><path d="M12 14h.01"></path><path d="M16 14h.01"></path><path d="M8 18h.01"></path><path d="M12 18h.01"></path><path d="M16 18h.01"></path>`;

/** One day on the grid */
export type CalendarDay<T = Row> = {
  /** Its index, in date order */
  i: number;
  /** Local midnight, epoch ms */
  t: number;
  /** The column, from the first week of its row */
  week: number;
  /** The row, 0 for the first day of the week */
  wd: number;
  /** The year's row (0 for one range) */
  year: number;
  /** The day's total; 0 when it has no row, NaN when its rows have no value */
  value: number;
  /** The last row for the day, or null */
  datum: T | null;
};

const DAY = 86400000;
/** The lightest shade, as the share of the accent mixed into the card */
const MIN_MIX = 0.18;
/** The legend's steps */
const LEGEND_STEPS = 5;

const isoDay = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
/** The shade for a level 0–1: the accent mixed into the card's colour */
const shade = (level: number) => `color-mix(in srgb, var(--tc-clh-ink) ${Math.round((MIN_MIX + (1 - MIN_MIX) * Math.max(0, Math.min(1, level))) * 100)}%, var(--tc-plot-bg))`;
const EMPTY = "var(--tc-clh-empty)";

type Prep<T> = { byDay: Map<number, { v: number; d: T }>; keys: number[]; years: number[] };
type Geo = {
  x0: number;
  leftW: number;
  topH: number;
  blockH: number;
  cell: number;
  step: number;
  gap: number;
  weeks: number;
  nYears: number;
  multi: boolean;
  canvas: boolean;
  lo: number;
  top: number;
  span: number;
  wdNames: string[];
  months: { x: number; y: number; label: string }[];
  dayIndex: Int32Array;
};

/**
 * An amount per day on a grid of weeks – each day shaded by its value, the busiest outlined, a year per row over
 * several years, a canvas for very long ranges, and a table view.
 * @tag tc-calendar-heatmap
 * @fires tc-view-change - The Table button was pressed ({ view }: ChartViewChange); cancelable – prevented, `view` stays as it was
 * @fires tc-mark-hover - The pointer or keyboard moved to a day, or off them ({ event }: ChartMarkHover)
 * @fires tc-mark-click - A day was clicked, or picked with Enter or Space ({ event }: ChartMarkClick)
 */
export class TcCalendarHeatmap<T = Row> extends TcChartElement<null, T> {
  static override ui = "clh";

  /** The date field: epoch ms, an ISO date or a Date; by default "date". Rows on the same day are added up */
  @property({ attribute: false }) accessor date: Accessor<T, unknown> | undefined = undefined;
  /** The value field; by default "value" */
  @property({ attribute: false }) accessor value: Accessor<T, number> | undefined = undefined;
  /** The first day of the week: 0 Sunday, 1 Monday */
  @property({ type: Number, attribute: "week-start" }) accessor weekStart: 0 | 1 = 0;
  /** The space between days, in px */
  @property({ type: Number }) accessor gap = 2.5;
  /** Above this many days the grid is painted on a canvas instead of drawn in SVG */
  @property({ type: Number, attribute: "canvas-threshold" }) accessor canvasThreshold = 4000;

  protected override readonly kind = "Calendar heatmap";
  protected override readonly icon = calendarIcon;
  protected override defaultDuration = 700;
  protected override modelKeys = ["date", "value", "weekStart", "gap", "canvasThreshold"];

  private days: CalendarDay<T>[] = [];
  private hiSet: ReadonlySet<number> = new Set();
  private geo: Geo | null = null;
  private version = 0;
  private prepKey: unknown[] = [];
  private prepped: Prep<T> = { byDay: new Map(), keys: [], years: [] };
  private cellsKey = "";
  private cellsTpl: SVGTemplateResult | typeof nothing = nothing;
  private bitmap: HTMLCanvasElement | null = null;
  private bitmapKey = "";

  override connectedCallback() {
    super.connectedCallback();
    // ← and → move a week, before the shared keyboard moves a day
    this.addEventListener("keydown", this.onWeekKey, true);
  }
  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("keydown", this.onWeekKey, true);
  }

  /** The days with data, added up per day, and the years they cover */
  private prep(): Prep<T> {
    const key = [this.data, this.date, this.value];
    if (key.every((k, i) => k === this.prepKey[i])) return this.prepped;
    const gd = getter(this.date, "date");
    const gv = numGetter(this.value, "value");
    const byDay = new Map<number, { v: number; d: T }>();
    this.data.forEach((d, i) => {
      const dt = toDate(gd(d, i));
      if (!dt) return;
      const k = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime();
      // A missing value stays missing unless the day also has a real one
      const v = gv(d, i);
      const pv = byDay.get(k)?.v ?? NaN;
      byDay.set(k, { v: Number.isFinite(v) ? (Number.isFinite(pv) ? pv : 0) + v : pv, d });
    });
    const keys = [...byDay.keys()].sort((a, b) => a - b);
    const years = [...new Set(keys.map((k) => new Date(k).getFullYear()))].sort((a, b) => a - b);
    this.prepKey = key;
    this.prepped = { byDay, keys, years };
    return this.prepped;
  }

  protected override defaultHeight(w: number) {
    const n = this.prep().years.length;
    return n > 1 ? n * Math.max(70, Math.min(110, w / 8)) + 18 : Math.max(120, Math.min(190, w / 4.6 + 24));
  }

  protected override tableHeader() {
    return "Day";
  }

  protected override buildModel(f: ChartFrame): ChartModel<null, T> {
    const { width: W, height: H } = f;
    const { byDay, keys, years } = this.prep();
    const nYears = Math.max(1, years.length);
    const multi = nYears > 1;
    const ws = this.weekStart === 1 ? 1 : 0;
    const wdFmt = new Intl.DateTimeFormat(f.locale, { weekday: "short" });
    // 2024-01-07 was a Sunday
    const wdNames = Array.from({ length: 7 }, (_, d) => wdFmt.format(new Date(2024, 0, 7 + d)));
    const leftW = Math.max(22, Math.ceil(Math.max(...[1, 3, 5].map((r) => textWidth(wdNames[(r + ws) % 7], AXIS_FONT)))) + 10);
    const topH = 18;
    const gap = Math.max(0, this.gap);

    const days: CalendarDay<T>[] = [];
    if (keys.length) {
      const ranges = multi ? years.map((y) => [new Date(y, 0, 1), new Date(y, 11, 31)] as const) : [[new Date(keys[0]), new Date(keys[keys.length - 1])] as const];
      ranges.forEach(([a, b], yi) => {
        const start = new Date(a);
        start.setDate(start.getDate() - ((start.getDay() - ws + 7) % 7));
        // A day at a time by the calendar: adding 24 hours would skip or repeat a day where clocks change
        const end = b.getTime();
        for (const d = new Date(a.getFullYear(), a.getMonth(), a.getDate()); d.getTime() <= end; d.setDate(d.getDate() + 1)) {
          const t = d.getTime();
          const hit = byDay.get(t);
          days.push({ i: days.length, t, week: Math.floor((t - start.getTime() + 3600000) / (7 * DAY)), wd: (d.getDay() - ws + 7) % 7, year: yi, value: hit ? hit.v : 0, datum: hit?.d ?? null });
        }
      });
    }
    this.days = days;
    let weeks = 1;
    for (const d of days) if (d.week + 1 > weeks) weeks = d.week + 1;
    const vals = days.map((d) => d.value);
    const [mn, mx] = extent(vals);
    const top = robustMax(vals.filter((v) => v > 0));
    const lo = Math.min(0, mn);
    const span = Math.max(1e-9, top - lo) || 1;
    const blockH = (H - (multi ? 4 : 0)) / nYears;
    const cell = Math.max(2, Math.min((W - leftW - 2) / weeks - gap, (blockH - topH - 4) / 7 - gap));
    const step = cell + gap;
    const x0 = leftW + Math.max(0, (W - leftW - weeks * step) / 2);
    this.hiSet = resolveHighlight(
      this.highlight as never,
      days.map((d) => d.datum) as never[],
      lazyArray(days.length, (k) => isoDay(days[k].t)),
      vals,
      "max",
    );
    // (year, week, weekday) → the day's index, -1 for none
    const dayIndex = new Int32Array(nYears * weeks * 7).fill(-1);
    for (const d of days) dayIndex[(d.year * weeks + d.week) * 7 + d.wd] = d.i;
    // A month's name over the week holding its 1st, unless within 26px of the last one kept
    const months: Geo["months"] = [];
    let last = "";
    for (const d of days) {
      const dt = new Date(d.t);
      const k = `${d.year}-${dt.getMonth()}`;
      if (k !== last && dt.getDate() <= 7) {
        const x = x0 + d.week * step;
        const y = d.year * blockH + 8;
        const prev = months[months.length - 1];
        if (!prev || prev.y !== y || x - prev.x >= 26) months.push({ x, y, label: formatDate(dt, { month: "short", locale: f.locale }) });
        last = k;
      }
    }
    const canvas = days.length > this.canvasThreshold;
    this.geo = { x0, leftW, topH, blockH, cell, step, gap, weeks, nYears, multi, canvas, lo, top, span, wdNames, months, dayIndex };
    this.version++;

    const D = this.duration ?? this.defaultDuration;
    // One clock for the whole grid: the SVG fades weeks in with CSS from its start, the canvas reads its progress
    const marks = [{ key: "__clock", to: [1], from: [0], delay: canvas ? 0 : D * 0.9, data: null }];
    const dayFmt = new Intl.DateTimeFormat(f.locale, { month: "long", day: "numeric", weekday: "short", ...(multi ? { year: "numeric" as const } : {}) });
    const events = lazyArray(days.length, (k) => {
      const d = days[k];
      const known = Number.isFinite(d.value);
      return { datum: d.datum as T, index: d.i, key: String(d.t), label: dayFmt.format(d.t), value: known ? d.value : null, formatted: known ? f.fv(d.value) : "–" };
    });
    const summary = days.length ? `${plural(days.length, "day")}, max ${f.fv(mx)}` : "";
    return { marks, events, summary };
  }

  /** A day's shade */
  private fill(d: CalendarDay<T>) {
    const g = this.geo!;
    return d.value ? shade((d.value - g.lo) / g.span) : EMPTY;
  }
  private pos(d: CalendarDay<T>) {
    const g = this.geo!;
    return { x: g.x0 + d.week * g.step, y: d.year * g.blockH + g.topH + d.wd * g.step };
  }

  protected override tip(i: number, f: ChartFrame): TooltipData | null {
    const d = this.days[i];
    if (!d || !this.geo) return null;
    const q = this.pos(d);
    const ev = this.model.events[i];
    return { x: q.x + this.geo.cell / 2, y: q.y, title: ev.label, rows: [{ label: this.words.value, value: Number.isFinite(d.value) ? f.fv(d.value) : "–", color: this.fill(d) }] };
  }

  protected override plotMove(px: number, py: number, e: PointerEvent) {
    const g = this.geo;
    if (!g) return;
    const w = Math.floor((px - g.x0) / g.step);
    const yi = Math.floor(py / g.blockH);
    const wd = Math.floor((py - yi * g.blockH - g.topH) / g.step);
    const hit = yi >= 0 && yi < g.nYears && w >= 0 && w < g.weeks && wd >= 0 && wd < 7 ? g.dayIndex[(yi * g.weeks + w) * 7 + wd] : -1;
    this.setActive(hit >= 0 ? hit : null, e.pointerType === "touch" ? "touch" : "pointer");
  }

  private onWeekKey = (e: KeyboardEvent) => {
    const target = e.target as Element | null;
    if (!target?.classList?.contains("tc-chart__plot") || this.active === null) return;
    const d = e.key === "ArrowRight" ? 7 : e.key === "ArrowLeft" ? -7 : 0;
    // Past either end there's no week to go to: the shared keyboard moves a day instead, wrapping round
    if (!d || !this.days[this.active + d]) return;
    e.preventDefault();
    e.stopPropagation();
    this.setActive(this.active + d, "keyboard");
  };

  private onClick = () => {
    if (this.active !== null) this.clickMark(this.active);
  };

  protected override headerLegend() {
    const g = this.geo;
    if (!g || !this.days.length) return nothing;
    const fmt = this.frame.fmt;
    const steps = Array.from({ length: LEGEND_STEPS }, (_, k) => shade(k / (LEGEND_STEPS - 1)));
    return html`<div class="ui-clh__legend" role="img" aria-label=${`Shading from ${fmt(g.lo)} to ${fmt(g.top)} or more`}>
      <span aria-hidden="true">${fmt(g.lo)}</span>
      <span class="ui-clh__ramp" aria-hidden="true"><span class="tc-chart__swatch" style=${`background: ${EMPTY}`}></span>${steps.map((s) => html`<span class="tc-chart__swatch" style=${`background: ${s}`}></span>`)}</span>
      <span aria-hidden="true">${fmt(g.top)}</span>
    </div>`;
  }

  /** The days as SVG, a group per week so the entrance can fade them in column by column */
  private cells(enter: boolean, wait: boolean) {
    const key = `${this.version}|${enter}|${wait}`;
    if (key === this.cellsKey) return this.cellsTpl;
    const g = this.geo!;
    const D = this.duration ?? this.defaultDuration;
    const byWeek = new Map<string, CalendarDay<T>[]>();
    for (const d of this.days) {
      const k = `${d.year}:${d.week}`;
      const list = byWeek.get(k);
      if (list) list.push(d);
      else byWeek.set(k, [d]);
    }
    const r = Math.min(2.5, g.cell / 3);
    this.cellsTpl = svg`<g ?data-wait=${wait}>${[...byWeek.values()].map((list) => {
      const delay = Math.round((list[0].week / Math.max(1, g.weeks - 1)) * D * 0.9);
      return svg`<g class="ui-clh__week" ?data-enter=${enter} style=${enter ? `--tc-clh-delay: ${delay}ms` : ""}>${list.map((d) => {
        const q = this.pos(d);
        return svg`<rect class="ui-clh__day" ?data-hi=${this.hiSet.has(d.i)} x=${q.x} y=${q.y} width=${g.cell} height=${g.cell} rx=${r} style=${`fill: ${this.fill(d)}`}></rect>`;
      })}</g>`;
    })}</g>`;
    this.cellsKey = key;
    return this.cellsTpl;
  }

  protected override draw(f: ChartFrame) {
    const g = this.geo;
    if (!g) return svg``;
    const { width: W, height: H } = f;
    const enabled = !this.still && !reducedMotion();
    const m = this.motion;
    const ws = this.weekStart === 1 ? 1 : 0;
    const years = this.prep().years;
    const active = this.active !== null ? this.days[this.active] : undefined;
    const q = active ? this.pos(active) : null;
    return svg`<g @click=${this.onClick}>
      <rect class="tc-chart__hit" x="0" y="0" width=${W} height=${H}></rect>
      ${g.months.map((mm) => txt(mm.x, mm.y, mm.label))}
      ${Array.from({ length: g.nYears }, (_, yi) => [1, 3, 5].map((r) => txt(g.x0 - 6, yi * g.blockH + g.topH + r * g.step + g.cell / 2, g.wdNames[(r + ws) % 7], { anchor: "end" })))}
      ${g.multi ? years.map((y, yi) => txt(2, yi * g.blockH + 8, String(y), { strong: true })) : nothing}
      ${g.canvas ? nothing : keyed(m.generation, this.cells(enabled && (m.waiting || m.animating), m.waiting))}
      ${q ? svg`<rect class="tc-chart__focus ui-clh__ring" x=${q.x - 1} y=${q.y - 1} width=${g.cell + 2} height=${g.cell + 2} rx=${Math.min(3, g.cell / 3)}></rect>` : nothing}
    </g>`;
  }

  protected override underlay(_f: ChartFrame) {
    return this.geo?.canvas ? canvasUnderlay() : nothing;
  }

  /** The canvas: the whole grid painted once to a bitmap, then shown week by week during the entrance */
  protected override paintUnderlay(plot: HTMLElement, f: ChartFrame) {
    const g = this.geo;
    if (!g?.canvas) return;
    const { width: W, height: H } = f;
    const t = Math.max(0, Math.min(1, this.motion.get("__clock")?.[0] ?? 1));
    paintCanvas(plot, W, H, (ctx, color) => {
      const pw = ctx.canvas.width;
      const ph = ctx.canvas.height;
      const k = pw / Math.max(1, W);
      const key = `${this.version}|${pw}x${ph}|${color("var(--tc-clh-ink)")}|${color("var(--tc-plot-bg)")}|${color(EMPTY)}|${color("var(--tc-clh-mark)")}`;
      if (!this.bitmap || this.bitmapKey !== key) {
        const bm = this.bitmap ?? document.createElement("canvas");
        bm.width = pw;
        bm.height = ph;
        const b = bm.getContext("2d");
        if (!b) return;
        b.setTransform(k, 0, 0, k, 0, 0);
        b.clearRect(0, 0, W, H);
        const rad = Math.min(2.5, g.cell / 3);
        const rounded = g.cell >= 5 && typeof b.roundRect === "function";
        const shapes = (list: CalendarDay<T>[]) => {
          b.beginPath();
          for (const d of list) {
            const q = this.pos(d);
            if (rounded) b.roundRect(q.x, q.y, g.cell, g.cell, rad);
            else b.rect(q.x, q.y, g.cell, g.cell);
          }
        };
        // Days don't overlap: one fill per shade
        const byFill = new Map<string, CalendarDay<T>[]>();
        for (const d of this.days) {
          const s = this.fill(d);
          const list = byFill.get(s);
          if (list) list.push(d);
          else byFill.set(s, [d]);
        }
        for (const [s, list] of byFill) {
          b.fillStyle = color(s);
          shapes(list);
          b.fill();
        }
        const marked = this.days.filter((d) => this.hiSet.has(d.i));
        if (marked.length) {
          b.strokeStyle = color("var(--tc-clh-mark)");
          b.lineWidth = 1.2;
          shapes(marked);
          b.stroke();
        }
        this.bitmap = bm;
        this.bitmapKey = key;
      }
      if (t >= 1) {
        ctx.drawImage(this.bitmap, 0, 0, pw, ph, 0, 0, W, H);
        return;
      }
      // Left to right a week at a time, as the SVG fades in; column edges on device pixels so neighbours aren't touched
      const lastW = Math.max(1, g.weeks - 1);
      const edge = (w: number) => Math.round(Math.min(pw, Math.max(0, (g.x0 + w * g.step - g.gap / 2) * k)));
      for (let w = 0; w < g.weeks; w++) {
        const o = Math.max(0, Math.min(1, (t - (w / lastW) * 0.75) / 0.25));
        const a = w === 0 ? 0 : edge(w);
        const b = w === g.weeks - 1 ? pw : edge(w + 1);
        if (o <= 0 || b <= a) continue;
        ctx.globalAlpha = o;
        ctx.drawImage(this.bitmap, a, 0, b - a, ph, a / k, 0, (b - a) / k, H);
      }
      ctx.globalAlpha = 1;
    });
  }

  static override css = /* css */ `
[data-ui="clh"] {
  --tc-clh-ink: var(--tc-plot-accent);
  --tc-clh-empty: var(--tc-plot-grid);
  --tc-clh-mark: var(--tc-plot-focus);
}
.ui-clh__day { transition: fill var(--tc-duration-slow) var(--tc-ease-standard); }
.ui-clh__day[data-hi] { stroke: var(--tc-clh-mark); stroke-width: 1.2; }
.ui-clh__ring { pointer-events: none; }
/* Before the chart is on screen the weeks wait unseen, then fade in from left to right */
[data-wait] > .ui-clh__week { opacity: 0; }
.ui-clh__week[data-enter] { animation: ui-clh-in var(--tc-duration-slow) var(--tc-ease-out) both; animation-delay: var(--tc-clh-delay); }
@keyframes ui-clh-in { from { opacity: 0; } to { opacity: 1; } }
/* The legend: the lowest value, the empty shade and the ramp, the top of the scale */
.ui-clh__legend { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-clh__ramp { display: inline-flex; gap: var(--tc-space-0-5); }
@media (forced-colors: active) {
  .ui-clh__day, .ui-clh__ramp .tc-chart__swatch { forced-color-adjust: none; }
}
`;
}

if (!customElements.get("tc-calendar-heatmap")) customElements.define("tc-calendar-heatmap", TcCalendarHeatmap);

declare global {
  interface HTMLElementTagNameMap {
    "tc-calendar-heatmap": TcCalendarHeatmap;
  }
}
