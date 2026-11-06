import { html, nothing, svg } from "lit";
import { property, state } from "lit/decorators.js";
import { fitTickLabels, gridY, tickLabels, txt, yAxisWidth } from "./internal/chart/axis";
import { brushBand, ChartBrush, changeRatio, defaultBrushWords, extremeTags, signedPercent, type BrushMode, type BrushRange, type XRange } from "./internal/chart/brush";
import { AXIS_FONT, TcChartElement, type ChartFrame, type ChartModel } from "./internal/chart/element";
import { formatDate, makeTickFormatter, toDate } from "./internal/chart/format";
import { dataSignature } from "./internal/chart/parse";
import { resolveHighlight } from "./internal/chart/highlight";
import { getter, numGetter } from "./internal/chart/accessor";
import { fitDomain, scaleLinear, timeTicks } from "./internal/chart/scale";
import { textWidth } from "./internal/chart/text";
import type { Accessor, Row, TooltipData } from "./internal/chart/types";

/*
 * <tc-candlestick-chart> – a reading's open, high, low and close for each period, as candles: the wick from low to
 * high, the body from open to close. Ported from ztd-charts' CandlestickChart (MIT, © 2026 Junhan2). Periods that
 * close higher than they opened are hollow bodies outlined in the "up" ink; those that close lower are solid bodies in
 * the "down" ink – the shape tells them apart as well as the colour. Optional moving averages of the close, a volume
 * strip under the candles, and the highlighted (by default the last) period's close drawn across the plot and tagged
 * on the right-hand axis. Too many periods for the width merge into fewer candles. Candles sweep in from left to right
 * when the chart comes on screen and glide when the data changes.
 *   · one tab stop: arrows move candle to candle, each read with its open, high, low and close
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-candlestick-chart heading="Freezer B temperature" unit=" °C" .data=${[{ date: "2026-10-01", open: -79.8, high: -78.9, low: -80.2, close: -79.4 }, …]}></tc-candlestick-chart>
 */

/** A candlestick chart: Lucide's chart-candlestick (ISC, lucide.dev) */
const candleIcon = svg`<path d="M9 5v4"></path><rect width="4" height="6" x="7" y="9" rx="1"></rect><path d="M9 15v2"></path><path d="M17 3v2"></path><rect width="4" height="8" x="15" y="5" rx="1"></rect><path d="M17 13v3"></path><path d="M3 3v16a2 2 0 0 0 2 2h16"></path>`;

/** The words a candlestick chart adds to the shared ones */
export type CandlestickLabels = {
  open: string;
  high: string;
  low: string;
  close: string;
  change: string;
  volume: string;
  up: string;
  down: string;
  /** A moving average's short name, on the plot: "MA{days}" */
  ma: string;
  /** A moving average's name in the legend: "{days}-period MA" */
  maLegend: string;
  /** "open {open}, high {high}, low {low}, close {close}" – a candle as read and in the table */
  ohlc: string;
};
export const defaultCandlestickLabels: CandlestickLabels = {
  open: "Open",
  high: "High",
  low: "Low",
  close: "Close",
  change: "Change",
  volume: "Volume",
  up: "Up",
  down: "Down",
  ma: "MA{days}",
  maLegend: "{days}-period MA",
  ohlc: "open {open}, high {high}, low {low}, close {close}",
};

type Candle<T> = {
  /** The first row's place in the sorted rows */
  i: number;
  /** How many rows it merges */
  span: number;
  key: string;
  label: string;
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  datum: T;
};

/** At most three moving averages, each with its own ink and dash */
const MA_MAX = 3;
const fill = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));

/** Details of tc-brush */
export type CandlestickBrushChange = { range: XRange | null };

/** The moving-average periods to draw: 2 or more, fewer than the candles, the first three */
function maPeriods(ma: readonly number[] | undefined, count: number): number[] {
  return (ma ?? []).filter((d) => d >= 2 && d < count).slice(0, MA_MAX);
}

/** A simple moving average; the first period − 1 are NaN */
function movingAverage(values: readonly number[], period: number): number[] {
  const out = new Array<number>(values.length).fill(NaN);
  if (period < 1) return out;
  let sum = 0;
  for (let k = 0; k < values.length; k++) {
    sum += values[k];
    if (k >= period) sum -= values[k - period];
    if (k >= period - 1) out[k] = sum / period;
  }
  return out;
}

/** Neighbouring candles merged so there are at most `max`: the first open, the last close, the extreme high and low */
function mergeCandles<T>(cs: Candle<T>[], max: number): Candle<T>[] {
  if (cs.length <= max || max < 2) return cs;
  const size = Math.ceil(cs.length / max);
  const out: Candle<T>[] = [];
  for (let a = 0; a < cs.length; a += size) {
    const g = cs.slice(a, a + size);
    const first = g[0];
    const last = g[g.length - 1];
    let h = -Infinity;
    let l = Infinity;
    let v = 0;
    let hasV = false;
    for (const q of g) {
      h = Math.max(h, q.h);
      l = Math.min(l, q.l);
      if (Number.isFinite(q.v)) {
        v += q.v;
        hasV = true;
      }
    }
    out.push({ i: first.i, span: g.reduce((s, q) => s + q.span, 0), key: first.key, label: g.length > 1 ? `${first.label} – ${last.label}` : first.label, t: first.t, o: first.o, h, l, c: last.c, v: hasV ? v : NaN, datum: last.datum });
  }
  return out;
}

/**
 * A reading's open, high, low and close per period as candles – hollow when it rose, solid when it fell – with moving
 * averages, volume, the latest close tagged on the axis, and a table view.
 * @tag tc-candlestick-chart
 * @fires tc-view-change - The Table button was pressed ({ view }: ChartViewChange); cancelable – prevented, `view` stays as it was
 * @fires tc-mark-hover - The pointer or keyboard moved to a candle, or off them ({ event }: ChartMarkHover)
 * @fires tc-mark-click - A candle was clicked, or picked with Enter or Space ({ event }: ChartMarkClick)
 * @fires tc-brush - A range of candles was picked by dragging or Shift+arrows and Enter, or cleared ({ range }: CandlestickBrushChange)
 */
export class TcCandlestickChart<T = Row> extends TcChartElement<number, T> {
  static override ui = "cdl";

  /** The period field – dates (ISO strings or epoch ms) or labels; by default "date" */
  @property({ attribute: false }) accessor x: Accessor<T, unknown> | undefined = undefined;
  /** The opening value field; by default "open" (missing: the previous close) */
  @property({ attribute: false }) accessor open: Accessor<T, number> | undefined = undefined;
  /** The high field; by default "high" */
  @property({ attribute: false }) accessor high: Accessor<T, number> | undefined = undefined;
  /** The low field; by default "low" */
  @property({ attribute: false }) accessor low: Accessor<T, number> | undefined = undefined;
  /** The closing value field; by default "close" (rows without one are left out) */
  @property({ attribute: false }) accessor close: Accessor<T, number> | undefined = undefined;
  /** A volume field, drawn as a strip of bars under the candles */
  @property({ attribute: false }) accessor volume: Accessor<T, number> | undefined = undefined;
  /** Moving averages of the close to draw, in periods, e.g. [5, 20]; up to three */
  @property({ attribute: false }) accessor ma: number[] | undefined = undefined;
  /** Merges neighbouring periods above this many candles; by default a candle per 4px of plot */
  @property({ type: Number, attribute: "max-candles" }) accessor maxCandles: number | undefined = undefined;
  /** Fixes the value axis to [min, max] */
  @property({ attribute: false }) accessor yDomain: [number, number] | undefined = undefined;
  /** The candlestick chart's own words, merged over defaultCandlestickLabels */
  @property({ attribute: false }) accessor candleLabels: Partial<CandlestickLabels> = {};
  /** Dragging across the candles (or Shift+arrows, then Enter) picks a range: "select" shows its change, high and low; "zoom" narrows the chart to it */
  @property() accessor brush: BrushMode = "none";

  /** @internal The zoomed range, in rows before merging, with the data it was picked on */
  @state() accessor zoomed: { sig: string; range: [number, number] } | null = null;
  /** @internal Bumped when the picked range changes */
  @state() accessor brushTick = 0;

  private picker = new ChartBrush({
    count: () => this.cs.length,
    indexAt: (x) => Math.max(0, Math.min(this.cs.length - 1, Math.floor((x - this.geo.x0) / this.geo.step))),
    inPlot: (x, y) => x >= this.geo.x0 && x <= this.geo.x1 && y >= this.geo.top && y <= this.geo.priceBottom,
    keep: () => this.brush !== "zoom",
    changed: () => this.brushTick++,
    commit: (r) => this.commitBrush(r),
  });
  /** Where the shown rows start in the full, unzoomed order */
  private offset = 0;

  protected override readonly kind = "Candlestick chart";
  protected override readonly icon = candleIcon;
  protected override defaultDuration = 700;
  protected override defaultFormat = "number" as const;
  protected override modelKeys = ["x", "open", "high", "low", "close", "volume", "ma", "maxCandles", "yDomain", "candleLabels", "zoomed"];



  private cs: Candle<T>[] = [];
  private dated = false;
  private mas: { d: number; v: number[] }[] = [];
  private markK = -1;
  private geo = {
    top: 10,
    bottom: 22,
    x0: 4,
    x1: 0,
    step: 1,
    bodyW: 1,
    priceBottom: 0,
    hasVolume: false,
    vmax: 0,
    volH: 0,
    sweep: 0,
    yTicks: [] as number[],
    tickFmt: ((v: number) => String(v)) as (v: number) => string,
    y: scaleLinear([0, 1], [0, 1]),
    xTicks: [] as { x: number; label: string }[],
  };

  private get candleWords(): CandlestickLabels {
    return { ...defaultCandlestickLabels, ...this.candleLabels };
  }

  protected override defaultHeight(w: number) {
    return Math.max(240, Math.min(340, w * 0.55));
  }

  protected override tableHeader() {
    return "Period";
  }

  private cx(k: number) {
    return this.geo.x0 + this.geo.step * (k + 0.5);
  }

  /** Rows as candles in time order. Rows with no close are left out; a missing open, high or low comes from its neighbours */
  private toCandles(locale: string | undefined): Candle<T>[] {
    const gx = getter(this.x, "date");
    const go = numGetter(this.open, "open");
    const gh = numGetter(this.high, "high");
    const gl = numGetter(this.low, "low");
    const gc = numGetter(this.close, "close");
    const gv = this.volume === undefined ? null : numGetter(this.volume, "volume");
    const raw = this.data.map((d, i) => {
      const xv = gx(d, i);
      // Small numbers (1, 2, 3, or a year) and four-digit strings are labels, not dates in 1970 or 1 January
      const dt = (typeof xv === "number" && Math.abs(xv) <= 1e10) || (typeof xv === "string" && /^\d{4}$/.test(xv.trim())) ? null : toDate(xv);
      return { d, xv, dt, t: dt ? dt.getTime() : i, c: gc(d, i), o: go(d, i), h: gh(d, i), l: gl(d, i), v: gv ? gv(d, i) : NaN };
    });
    const dated = raw.length > 0 && raw.every((r) => r.dt);
    this.dated = dated;
    const rows = raw.filter((r) => Number.isFinite(r.c));
    if (dated) rows.sort((a, b) => a.t - b.t);
    const out: Candle<T>[] = [];
    const keys = new Set<string>();
    let prev = NaN;
    rows.forEach((r, k) => {
      const o = Number.isFinite(r.o) ? r.o : Number.isFinite(prev) ? prev : r.c;
      const h = Math.max(o, r.c, Number.isFinite(r.h) ? r.h : -Infinity);
      const l = Math.min(o, r.c, Number.isFinite(r.l) ? r.l : Infinity);
      const label = r.dt ? formatDate(r.dt, { locale, year: "numeric", month: "short", day: "numeric" }) : String(r.xv ?? k + 1);
      // The same time twice still gets two keys
      let key = r.dt ? String(r.t) : String(r.xv);
      if (keys.has(key)) key = `${key}#${k}`;
      keys.add(key);
      out.push({ i: k, span: 1, key, label, t: dated ? r.t : k, o, h, l, c: r.c, v: r.v, datum: r.d });
      prev = r.c;
    });
    return out;
  }

  protected override buildModel(f: ChartFrame): ChartModel<number, T> {
    const { width: W, height: H } = f;
    let all = this.toCandles(f.locale);
    // A zoom holds only for the data it was picked on
    const z = this.zoomed && this.zoomed.sig === dataSignature(this.data as never) ? this.zoomed.range : null;
    this.offset = z ? z[0] : 0;
    if (z) all = all.slice(z[0], z[1] + 1).map((q, k) => ({ ...q, i: k }));
    const top = 10;
    const bottom = 22;
    const plotW0 = Math.max(40, W - 56);
    const cs = mergeCandles(all, Math.max(8, Math.round(this.maxCandles ?? plotW0 / 4)));
    this.cs = cs;
    let lo = Infinity;
    let hi = -Infinity;
    let vmax = 0;
    let anyVolume = false;
    for (const q of cs) {
      lo = Math.min(lo, q.l);
      hi = Math.max(hi, q.h);
      if (Number.isFinite(q.v)) {
        vmax = Math.max(vmax, q.v);
        anyVolume = true;
      }
    }
    if (!Number.isFinite(lo)) [lo, hi] = [0, 1];
    const hasVolume = this.volume !== undefined && anyVolume;
    const n = cs.length;
    const volH = hasVolume ? Math.max(28, (H - top - bottom) * 0.18) : 0;
    const priceBottom = H - bottom - (hasVolume ? volH + 8 : 0);
    const yCount = Math.max(2, Math.round((priceBottom - top) / 60));
    const dom: [number, number] = this.yDomain ?? fitDomain(lo, hi, yCount, { zero: false });
    // The value axis in full, unshortened numbers (unless `format` says otherwise)
    const tickFmt = makeTickFormatter(this.format, f.locale, 0);
    const yTicks = scaleLinear(dom, [0, 1]).ticks(yCount);
    // As wide as the tick labels or the close tag, whichever is wider
    const right = Math.max(yAxisWidth(yTicks, tickFmt, f.locale), textWidth(tickFmt(hi), AXIS_FONT, 700) + 14) + 4;
    const x0 = 4;
    const x1 = W - right;
    const step = n ? (x1 - x0) / n : 1;
    const bodyW = Math.max(1, Math.min(18, step * 0.64));
    const y = scaleLinear(dom, [priceBottom, top]);
    const sweep = Math.min(700, 12 * n);
    this.geo = { top, bottom, x0, x1, step, bodyW, priceBottom, hasVolume, vmax, volH, sweep, yTicks, tickFmt, y, xTicks: [] };

    const hiSet = resolveHighlight(this.highlight, cs.map((q) => q.datum), cs.map((q) => q.label), cs.map((q) => q.c), "last");
    this.markK = hiSet.size ? Math.max(...hiSet) : -1;

    // Moving averages from every close before merging; a merged candle reads its last period's value
    const closes = all.map((q) => q.c);
    this.mas = maPeriods(this.ma, closes.length).map((d) => {
      const v = movingAverage(closes, d);
      return { d, v: cs.map((q) => v[q.i + q.span - 1]) };
    });

    // Time ticks sit on the last candle at or before them
    const xTicks: { x: number; label: string }[] = [];
    if (n > 1) {
      const maxT = Math.max(2, Math.floor((x1 - x0) / 80));
      if (this.dated) {
        let kk = 0;
        for (const tk of timeTicks(cs[0].t, cs[n - 1].t, maxT, f.locale)) {
          while (kk < n - 1 && cs[kk + 1].t <= tk.t) kk++;
          xTicks.push({ x: this.cx(kk), label: tk.label });
        }
      } else {
        const every = Math.max(1, Math.ceil(n / maxT));
        for (let k = 0; k < n; k += every) xTicks.push({ x: this.cx(k), label: cs[k].label });
      }
    }
    this.geo.xTicks = fitTickLabels(xTicks, 0, x1 + 2);

    const vy = (v: number) => H - bottom - (vmax > 0 && Number.isFinite(v) ? (v / vmax) * volH : 0);
    const marks = cs.map((q, k) => {
      const mid = (y(q.o) + y(q.c)) / 2;
      const base = H - bottom;
      return { key: q.key, to: [y(q.o), y(q.c), y(q.h), y(q.l), vy(q.v)], from: [mid, mid, mid, mid, base], enter: [mid, mid, mid, mid, base], delay: n > 1 ? (k / (n - 1)) * sweep : 0, data: k };
    });
    const w = this.candleWords;
    const events = cs.map((q, k) => ({ datum: q.datum, index: k, key: q.key, label: q.label, value: q.c, formatted: fill(w.ohlc, { open: f.fv(q.o), high: f.fv(q.h), low: f.fv(q.l), close: f.fv(q.c) }) }));
    let summary = "";
    if (n) {
      const ch = changeRatio(cs[0].o, cs[n - 1].c);
      summary = `${cs[0].label} to ${cs[n - 1].label}, ${n} candles. First open ${f.fv(cs[0].o)}, last close ${f.fv(cs[n - 1].c)}${ch !== null ? ` (${signedPercent(ch, f.locale)})` : ""}; high ${f.fv(hi)}, low ${f.fv(lo)}`;
    }
    return { marks, events, summary };
  }

  protected override plotMove(px: number, _py: number, e: PointerEvent) {
    const n = this.cs.length;
    if (!n) return;
    this.picker.move(px);
    const { x0, step } = this.geo;
    this.setActive(Math.max(0, Math.min(n - 1, Math.floor((px - x0) / step))), e.pointerType === "touch" ? "touch" : "pointer");
  }

  protected override plotDown(x: number, y: number, e: PointerEvent) {
    return this.brush !== "none" && this.picker.down(x, y, e);
  }
  protected override plotUp(x: number, _y: number, e: PointerEvent) {
    if (this.brush !== "none") this.picker.up(x, e);
  }
  protected override keyFirst(e: KeyboardEvent) {
    if (this.brush === "none") return false;
    if (e.key === "Escape" && this.zoomed && !this.picker.range) {
      this.zoomed = null;
      return true;
    }
    return this.picker.key(e, this.active);
  }

  private commitBrush(r: BrushRange | null) {
    const cs = this.cs;
    // In rows before merging, in the full order
    const range: XRange | null = r
      ? { from: this.offset + cs[r.from].i, to: this.offset + cs[r.to].i + cs[r.to].span - 1, fromKey: cs[r.from].key, toKey: cs[r.to].key, fromLabel: cs[r.from].label, toLabel: cs[r.to].label }
      : null;
    this.emit<CandlestickBrushChange>("tc-brush", { range });
    if (this.brush === "zoom" && range && range.to > range.from) {
      this.zoomed = { sig: dataSignature(this.data as never), range: [range.from, range.to] };
      this.picker.clear();
    }
  }

  /** The picked range: from the first open to the last close, with its highest high and lowest low */
  private picked(f: ChartFrame) {
    const r = this.picker.range;
    const cs = this.cs;
    if (!r || r.to >= cs.length) return null;
    let maxK = r.from;
    let minK = r.from;
    for (let k = r.from; k <= r.to; k++) {
      if (cs[k].h > cs[maxK].h) maxK = k;
      if (cs[k].l < cs[minK].l) minK = k;
    }
    const ratio = changeRatio(cs[r.from].o, cs[r.to].c);
    const diff = cs[r.to].c - cs[r.from].o;
    const main = ratio !== null ? signedPercent(ratio, f.locale) : `${diff >= 0 ? "+" : ""}${f.fv(diff)}`;
    const sub = defaultBrushWords.range.replace("{from}", cs[r.from].label).replace("{to}", cs[r.to].label);
    return { r, maxK, minK, main, sub };
  }

  protected override announcement() {
    const p = this.picked(this.frame);
    if (!p || this.picker.dragging) return null;
    const w = defaultBrushWords;
    const cs = this.cs;
    return `${p.sub}: ${p.main}, ${w.high.toLowerCase()} ${this.frame.fv(cs[p.maxK].h)}, ${w.low.toLowerCase()} ${this.frame.fv(cs[p.minK].l)}.${this.picker.keyboard ? (this.brush === "zoom" ? w.zoomHint : w.pickHint) : ""}`;
  }

  protected override overlay() {
    if (!this.zoomed) return nothing;
    return html`<button type="button" class="tc-btn-sm tc-chart__reset" @click=${() => (this.zoomed = null)}>${defaultBrushWords.reset}<span class="tc-sr-only"> (reset zoom)</span></button>`;
  }

  private brushLayer(f: ChartFrame) {
    const p = this.picked(f);
    if (!p) return nothing;
    const { top, priceBottom, y } = this.geo;
    const cs = this.cs;
    const half = this.geo.step / 2;
    return svg`${brushBand({ x0: this.cx(p.r.from) - half, x1: this.cx(p.r.to) + half, top, bottom: priceBottom, width: f.width, main: p.main, sub: p.sub, dragging: this.picker.dragging })}
      ${p.maxK !== p.minK
        ? extremeTags({ width: f.width, top, bottom: priceBottom, max: { x: this.cx(p.maxK), y: y(cs[p.maxK].h), text: f.fv(cs[p.maxK].h) }, min: { x: this.cx(p.minK), y: y(cs[p.minK].l), text: f.fv(cs[p.minK].l) }, words: defaultBrushWords })
        : nothing}`;
  }

  protected override tip(k: number, f: ChartFrame): TooltipData | null {
    if (this.picker.dragging) return null;
    const q = this.cs[k];
    if (!q) return null;
    const w = this.candleWords;
    const ch = changeRatio(k > 0 ? this.cs[k - 1].c : NaN, q.c);
    const rising = q.c >= q.o;
    return {
      x: this.cx(k),
      y: this.geo.y(q.h),
      title: q.label,
      rows: [
        { label: w.open, value: f.fv(q.o), strong: false },
        { label: w.high, value: f.fv(q.h), strong: false },
        { label: w.low, value: f.fv(q.l), strong: false },
        { label: `${w.close} (${rising ? w.up : w.down})`, value: f.fv(q.c), color: rising ? "var(--tc-cdl-up)" : "var(--tc-cdl-down)" },
        ...(ch !== null ? [{ label: w.change, value: signedPercent(ch, f.locale) }] : []),
        ...(Number.isFinite(q.v) ? [{ label: w.volume, value: f.fmt(q.v), strong: false }] : []),
        ...this.mas.filter((ma) => Number.isFinite(ma.v[k])).map((ma) => ({ label: fill(w.ma, { days: ma.d }), value: f.fv(ma.v[k]), strong: false })),
      ],
    };
  }

  protected override headerLegend() {
    if (!this.cs.length) return nothing;
    const w = this.candleWords;
    return html`<ul class="tc-chart__legend" aria-label="Key">
      <li class="tc-chart__key"><span class="tc-chart__swatch ui-cdl__key" data-dir="up" aria-hidden="true"></span>${w.up}</li>
      <li class="tc-chart__key"><span class="tc-chart__swatch ui-cdl__key" data-dir="down" aria-hidden="true"></span>${w.down}</li>
      ${this.mas.map(
        (ma, mi) => html`<li class="tc-chart__key"><svg class="ui-cdl__key-line" viewBox="0 0 16 10" aria-hidden="true"><line class="ui-cdl__ma" data-ma=${mi + 1} x1="0" x2="16" y1="5" y2="5"></line></svg>${fill(w.maLegend, { days: ma.d })}</li>`,
      )}
    </ul>`;
  }

  protected override draw(f: ChartFrame) {
    const { height: H } = f;
    const { top, bottom, x0, x1, bodyW, priceBottom, hasVolume, sweep, yTicks, tickFmt, y, xTicks } = this.geo;
    const cs = this.cs;
    const m = this.motion;
    const w = this.candleWords;
    const last = this.markK >= 0 ? cs[this.markK] : null;
    const tagY = last ? Math.max(top + 8, Math.min(priceBottom - 8, y(last.c))) : null;
    const labels = tickLabels(yTicks, tickFmt, f.locale);

    // The highlighted candle's close across the plot, and tagged on the axis – outlined, the number in the text ink
    let lastTag: unknown = nothing;
    if (last && tagY !== null) {
      const dir = last.c >= last.o ? "up" : "down";
      const text = tickFmt(last.c);
      const tw = textWidth(text, AXIS_FONT, 700) + 10;
      lastTag = svg`<g class="ui-cdl__last" data-dir=${dir} pointer-events="none" opacity=${m.fade(sweep + 200, 300)}>
        <line class="ui-cdl__last-line" x1=${x0} x2=${x1} y1=${y(last.c)} y2=${y(last.c)}></line>
        <rect class="ui-cdl__tag" x=${x1 + 3} y=${tagY - 9} width=${tw} height="18" rx="5"></rect>
        ${txt(x1 + 3 + tw / 2, tagY, text, { anchor: "middle", cls: "value", strong: true })}
      </g>`;
    }

    // The moving averages' values at the active candle (or the last one), top left
    const maK = this.active !== null && cs[this.active] ? this.active : cs.length - 1;
    let maX = x0 + 2;
    const maLabels = this.mas.map((ma, mi) => {
      const text = `${fill(w.ma, { days: ma.d })} ${Number.isFinite(ma.v[maK]) ? tickFmt(ma.v[maK]) : "–"}`;
      const node = svg`<g class="ui-cdl__ma-label" data-ma=${mi + 1}>${txt(maX, top + 2, text, { cls: "value" })}</g>`;
      maX += textWidth(text, AXIS_FONT, 600) + 10;
      return node;
    });
    const maPaths = this.mas.map((ma) => {
      let d = "";
      ma.v.forEach((v, k) => {
        if (Number.isFinite(v)) d += `${d ? "L" : "M"}${this.cx(k).toFixed(1)},${y(v).toFixed(1)}`;
      });
      return d;
    });
    const maFade = m.fade(sweep, 400);

    return svg`
      ${gridY({ ticks: yTicks, y, x0, x1, fmt: tickFmt, labels: false, side: "right", locale: f.locale })}
      <g>${labels.map((label, i) => (tagY !== null && Math.abs(y(yTicks[i]) - tagY) < 14 ? nothing : txt(x1 + 6, Math.round(y(yTicks[i])) + 0.5, label)))}</g>
      <rect class="tc-chart__hit" x=${x0} y=${top} width=${Math.max(0, x1 - x0)} height=${Math.max(0, H - bottom - top)} @click=${() => this.active !== null && this.clickMark(this.active)}></rect>
      ${hasVolume ? svg`<line class="tc-chart__grid" x1=${x0} x2=${x1} y1=${H - bottom + 0.5} y2=${H - bottom + 0.5}></line>` : nothing}
      ${m.items.map((it) => {
        const k = it.data;
        const q = cs[k];
        if (!q) return nothing;
        const [yo, yc, yh, yl, yv] = it.v;
        const dir = q.c >= q.o ? "up" : "down";
        const xx = this.cx(k);
        const bodyTop = Math.min(yo, yc);
        const bodyH = Math.max(1, Math.abs(yc - yo));
        const dimmed = this.active !== null && this.active !== k ? 0.55 : 1;
        const focus = this.active === k && this.via === "keyboard";
        // A hollow body's outline is drawn inside its box, so up and down candles are the same width
        const inset = dir === "up" && bodyW >= 4 ? 0.75 : 0;
        return svg`<g class="ui-cdl__candle" data-dir=${dir} opacity=${it.exiting ? 0.3 : dimmed} @click=${() => this.clickMark(k)}>
          ${hasVolume && Number.isFinite(q.v) ? svg`<rect class="ui-cdl__volume" x=${xx - bodyW / 2} y=${yv} width=${bodyW} height=${Math.max(0, H - bottom - yv)}></rect>` : nothing}
          <line class="ui-cdl__wick" x1=${xx} x2=${xx} y1=${yh} y2=${dir === "up" && bodyW >= 4 ? bodyTop : yl}></line>
          ${dir === "up" && bodyW >= 4 ? svg`<line class="ui-cdl__wick" x1=${xx} x2=${xx} y1=${bodyTop + bodyH} y2=${yl}></line>` : nothing}
          <rect class="ui-cdl__body" ?data-hollow=${inset > 0} x=${xx - bodyW / 2 + inset} y=${bodyTop + inset} width=${Math.max(0.5, bodyW - inset * 2)} height=${Math.max(0.5, bodyH - inset * 2)} rx=${bodyW >= 6 ? 1.5 : 0}></rect>
          ${focus ? svg`<rect class="tc-chart__focus" x=${xx - bodyW / 2 - 3} y=${yh - 3} width=${bodyW + 6} height=${Math.max(0, yl - yh) + 6} rx="3"></rect>` : nothing}
        </g>`;
      })}
      <g pointer-events="none" opacity=${maFade}>${maPaths.map((d, mi) => (d ? svg`<path class="ui-cdl__ma" data-ma=${mi + 1} d=${d}></path>` : nothing))}</g>
      ${this.mas.length ? svg`<g pointer-events="none" opacity=${maFade}>${maLabels}</g>` : nothing}
      ${lastTag}
      ${this.brushLayer(f)}
      ${this.active !== null && cs[this.active] ? svg`<line class="ui-cdl__cursor" x1=${this.cx(this.active)} x2=${this.cx(this.active)} y1=${top} y2=${H - bottom}></line>` : nothing}
      <g>${xTicks.map((t) => txt(t.x, H - bottom + 13, t.label, { anchor: "middle" }))}</g>`;
  }

  static override css = /* css */ `
[data-ui="cdl"] {
  --tc-cdl-up: var(--tc-status-success-solid);
  --tc-cdl-down: var(--tc-status-danger-solid);
  --tc-cdl-ma-1: var(--tc-text-primary);
  --tc-cdl-ma-2: var(--tc-text-muted);
  --tc-cdl-ma-3: var(--tc-plot-zero);
  --tc-cdl-stroke: 1.5px;
}
.ui-cdl__candle[data-dir="up"] { --tc-cdl-ink: var(--tc-cdl-up); }
.ui-cdl__candle[data-dir="down"] { --tc-cdl-ink: var(--tc-cdl-down); }
.ui-cdl__wick { stroke: var(--tc-cdl-ink); stroke-width: 1; }
/* Rising: a hollow body (the card shows through); falling: a solid one */
.ui-cdl__body { fill: var(--tc-cdl-ink); }
.ui-cdl__body[data-hollow] { fill: var(--tc-plot-bg); stroke: var(--tc-cdl-ink); stroke-width: var(--tc-cdl-stroke); }
.ui-cdl__volume { fill: var(--tc-cdl-ink); opacity: 0.32; }
.ui-cdl__ma { fill: none; stroke-width: 1.3; stroke-linejoin: round; }
.ui-cdl__ma[data-ma="1"] { stroke: var(--tc-cdl-ma-1); }
.ui-cdl__ma[data-ma="2"] { stroke: var(--tc-cdl-ma-2); stroke-dasharray: 5 3; }
.ui-cdl__ma[data-ma="3"] { stroke: var(--tc-cdl-ma-3); stroke-dasharray: 1.5 2.5; }
.ui-cdl__ma-label[data-ma="2"] .tc-chart__value { fill: var(--tc-cdl-ma-2); }
.ui-cdl__last[data-dir="up"] { --tc-cdl-ink: var(--tc-cdl-up); }
.ui-cdl__last[data-dir="down"] { --tc-cdl-ink: var(--tc-cdl-down); }
.ui-cdl__last-line { stroke: var(--tc-cdl-ink); stroke-width: 1; stroke-dasharray: 2 3; opacity: 0.85; }
/* The close tag is outlined, not filled: the number stays in the text ink */
.ui-cdl__tag { fill: var(--tc-plot-bg); stroke: var(--tc-cdl-ink); stroke-width: var(--tc-cdl-stroke); }
.ui-cdl__cursor { stroke: var(--tc-plot-line-rest); stroke-width: 1; pointer-events: none; }
/* The legend's keys: a hollow square for up, a solid one for down, a line sample for each average */
.ui-cdl__key[data-dir="up"] { background: var(--tc-plot-bg); box-shadow: inset 0 0 0 var(--tc-cdl-stroke) var(--tc-cdl-up); }
.ui-cdl__key[data-dir="down"] { background: var(--tc-cdl-down); }
.ui-cdl__key-line { width: var(--tc-space-4); height: var(--tc-space-2-5); overflow: visible; }
@media (forced-colors: active) {
  .ui-cdl__body, .ui-cdl__wick, .ui-cdl__volume, .ui-cdl__key, .ui-cdl__tag, .ui-cdl__last-line { forced-color-adjust: none; }
}
`;
}

if (!customElements.get("tc-candlestick-chart")) customElements.define("tc-candlestick-chart", TcCandlestickChart);

declare global {
  interface HTMLElementTagNameMap {
    "tc-candlestick-chart": TcCandlestickChart;
  }
}
