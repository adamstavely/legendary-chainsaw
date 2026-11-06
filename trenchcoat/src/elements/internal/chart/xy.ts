/*
 * What Line Chart and Area Chart share (ported from ztd-charts' XYChart, MIT, © 2026 Junhan2 –
 * https://github.com/Junhan2/ztd-charts): values over x – dates, numbers or categories – as lines or filled areas, the
 * nearest x under the pointer read across every series, names at the lines' ends, reference lines, and long series
 * thinned to about two points per pixel. Not from ztd: `lower` and `upper` shade a band round each line – an
 * uncertainty or forecast range – that glides with it.
 */
import { html, nothing, svg } from "lit";
import { property, state } from "lit/decorators.js";
import { fitTickLabels, gridY, thinLabels, txt, yAxisWidth } from "./axis";
import { brushBand, ChartBrush, changeRatio, defaultBrushWords, extremeTags, signedPercent, type BrushMode, type BrushRange, type XRange } from "./brush";
import { AXIS_FONT, categoricalInk, emphasisInk, registerChartSheet, TcChartElement, type ChartFrame, type ChartModel } from "./element";
import { numGetter } from "./accessor";
import { makeTickFormatter } from "./format";
import { areaPath, linePath, nearestIndex, type Curve } from "./geometry";
import { resolveHighlight } from "./highlight";
import { dataSignature, lttb } from "./parse";
import { extent, fitDomain, scaleLinear, timeTicks } from "./scale";
import { bucketSeries, prepSeries, type SeriesModel, type XType } from "./series";
import { stack } from "./stack";
import { dodgeVertical, textWidth, truncate } from "./text";
import type { Accessor, Row, TooltipData } from "./types";

export type XYColorMode = "highlight" | "categorical";
export type XYReferenceLine = { y: number; label?: string };

/** Details of tc-brush */
export type ChartBrushChange = { range: XRange | null };

/** A series as drawn: its points, an area's floor, and its band's x, low and high edges (px) where it has one */
type SeriesDraw = { s: number; name: string; pts: number[]; xs: number[]; base?: number[]; band?: { xs: number[]; lo: number[]; up: number[] }; ink: string; hi: boolean };

let gradCount = 0;

/** The quiet ink for lines that aren't emphasised – stronger than an area's, so a thin line still reads */
const LINE_REST = "var(--tc-plot-line-rest)";

/** Keeps x indexes a…b (both included) of a model */
function sliceModel<T>(m: SeriesModel<T>, a: number, b: number): SeriesModel<T> {
  const lo = Math.max(0, Math.min(a, b));
  const hi = Math.min(m.keys.length - 1, Math.max(a, b));
  const keys = m.keys.slice(lo, hi + 1);
  return {
    type: m.type,
    keys,
    xnum: m.type === "band" ? keys.map((_, i) => i) : m.xnum.slice(lo, hi + 1),
    labels: m.labels.slice(lo, hi + 1),
    series: m.series,
    values: m.values.map((r) => r.slice(lo, hi + 1)),
    rows: m.rows.map((r) => r.slice(lo, hi + 1)),
  };
}

/**
 * @fires tc-brush - A range of x was picked by dragging or Shift+arrows and Enter, or cleared ({ range }: ChartBrushChange)
 */
export abstract class XYChart<T = Row> extends TcChartElement<SeriesDraw, T> {
  /** The x field – dates ("2026-03"), numbers or categories; by default "x" */
  @property({ attribute: false }) accessor x: Accessor<T, unknown> | undefined = undefined;
  /** The y field; a list of fields draws each as a series (a wide table); by default "y" */
  @property({ attribute: false }) accessor y: Accessor<T, number> | string[] | undefined = undefined;
  /** The series field, for a long table with one row per x and series */
  @property({ attribute: false }) accessor series: Accessor<T, string> | undefined = undefined;
  /** How lines bend between points: "smooth", "linear", "step" or "monotone" */
  @property() accessor curve: Curve = "smooth";
  /** What x is, when guessing from the values isn't right: "date", "number" or "band" */
  @property({ attribute: "x-type" }) accessor xType: XType | undefined = undefined;
  /** A fixed y range, [low, high] */
  @property({ attribute: false }) accessor yDomain: [number, number] | undefined = undefined;
  /** Starts the y axis at zero; by default only for areas */
  @property({ type: Boolean }) accessor zero: boolean | undefined = undefined;
  /** "highlight" paints the emphasised series and leaves the rest quiet; "categorical" gives each its own ink */
  @property({ attribute: "color-mode" }) accessor colorMode: XYColorMode | undefined = undefined;
  /** Names the series at their lines' ends; by default when there are several */
  @property({ type: Boolean, attribute: "end-labels" }) accessor endLabels: boolean | undefined = undefined;
  /** Above this many points a series is thinned (LTTB); by default about two per pixel */
  @property({ type: Number, attribute: "max-points" }) accessor maxPoints: number | undefined = undefined;
  /** Dashed horizontal lines, with an optional label: a target, a limit */
  @property({ attribute: false }) accessor referenceLines: XYReferenceLine[] = [];
  /** The y axis' title, above it: a unit, "Requests / min" */
  @property({ attribute: "y-label" }) accessor yLabel: string | undefined = undefined;
  /** A band's low edge round each line – an uncertainty or forecast range – with `upper`; with a list of y fields only the emphasised series has one. Not for stacked areas */
  @property({ attribute: false }) accessor lower: Accessor<T, number> | undefined = undefined;
  /** A band's high edge, with `lower` */
  @property({ attribute: false }) accessor upper: Accessor<T, number> | undefined = undefined;
  /** Dragging across the plot (or Shift+arrows, then Enter) picks a range of x: "select" shows its change, high and low; "zoom" narrows the chart to it */
  @property() accessor brush: BrushMode = "none";

  /** @internal The zoomed range in the full x order, with the data it was picked on */
  @state() accessor zoomed: { sig: string; range: [number, number] } | null = null;
  /** @internal Bumped when the picked range changes */
  @state() accessor brushTick = 0;

  private picker = new ChartBrush({
    count: () => this.sm.keys.length,
    indexAt: (x) => nearestIndex(this.g.centers, x),
    inPlot: (x, y) => x >= this.g.x0 - 4 && x <= this.g.x1 + 4 && y >= this.g.top && y <= this.frame.height - this.g.bottom,
    keep: () => this.brush !== "zoom",
    changed: () => this.brushTick++,
    commit: (r) => this.commitBrush(r),
  });
  private full: SeriesModel<T> | null = null;

  protected override defaultDuration = 1100;
  protected override stagger = 120;
  protected override modelKeys = ["x", "y", "series", "curve", "xType", "yDomain", "zero", "colorMode", "endLabels", "maxPoints", "referenceLines", "yLabel", "lower", "upper", "zoomed", ...this.extraKeys()];

  protected abstract readonly isArea: boolean;
  /** "none" (overlapping), "stacked" or "percent" – areas only */
  protected stackMode(): "none" | "stacked" | "percent" {
    return "none";
  }
  protected extraKeys(): string[] {
    return [];
  }
  /** Whether points are marked – lines only */
  protected showDots(_count: number) {
    return false;
  }
  /** A soft fill under the emphasised line – lines only */
  protected underFill() {
    return false;
  }

  private gid = `tc-xy-${++gradCount}`;
  private sm: SeriesModel<T> = { type: "band", keys: [], xnum: [], labels: [], series: [], values: [], rows: [] };
  private st: ReturnType<typeof stack> | null = null;
  /** Each series' band, [low, high] at each x, or null where it has none */
  private bands: ([number, number] | null)[][] | null = null;
  private draws: SeriesDraw[] = [];
  private hiSet: ReadonlySet<number> = new Set();
  private g = {
    left: 0,
    top: 0,
    bottom: 0,
    x0: 0,
    x1: 0,
    endW: 0,
    base0: 0,
    yTicks: [] as number[],
    tickFmt: String as (v: number) => string,
    y: scaleLinear([0, 1], [0, 1]),
    xs: (_k: number) => 0,
    centers: [] as number[],
  };

  protected override defaultHeight(w: number) {
    return Math.max(200, Math.min(300, w * 0.5));
  }

  private xScaleFor(model: SeriesModel<T>, x0: number, x1: number) {
    const n = model.keys.length;
    if (model.type === "band") {
      const step = n > 1 ? (x1 - x0) / (n - 1) : 0;
      return (k: number) => (n > 1 ? x0 + k * step : (x0 + x1) / 2);
    }
    const [lo, hi] = extent(model.xnum);
    const s = scaleLinear([lo, hi === lo ? lo + 1 : hi], [x0, x1]);
    return (k: number) => s(model.xnum[k]);
  }

  protected override buildModel(f: ChartFrame): ChartModel<SeriesDraw, T> {
    const { width: W, height: H } = f;
    const isArea = this.isArea;
    const full = prepSeries(this.data, this.x, this.y as never, this.series, { xType: this.xType, locale: f.locale });
    this.full = full;
    // A zoom holds only for the data it was picked on
    const z = this.zoomed && this.zoomed.sig === dataSignature(this.data as never) ? this.zoomed.range : null;
    const model0 = z ? sliceModel(full, z[0], z[1]) : full;
    const nS = model0.series.length;
    const mode = this.stackMode();
    // Stacked layers must share their x, so they're thinned by averaging buckets rather than LTTB
    const model = mode !== "none" ? bucketSeries(model0, Math.max(40, Math.round(this.maxPoints ?? W / 2))) : model0;
    this.sm = model;
    const stacked = mode === "none" ? null : stack(model.values, mode === "percent" ? "expand" : "zero");
    this.st = stacked;
    const totals = model.values.map((row) => row.reduce((a, v) => a + (Number.isFinite(v) ? v : 0), 0));
    const hi = resolveHighlight(this.highlight as never, model.series as never[], model.series, totals, "first");
    this.hiSet = hi;
    // Lines emphasise by default; several areas take the inks in order
    const categorical = this.colorMode ? this.colorMode === "categorical" : isArea && nS > 1;
    // Bands, read from each series' own rows: a wide table's rows are shared, so only the emphasised series takes them
    const wide = Array.isArray(this.y);
    let bands: ([number, number] | null)[][] | null = null;
    if (mode === "none" && this.lower !== undefined && this.upper !== undefined) {
      const gl = numGetter(this.lower, "lower");
      const gu = numGetter(this.upper, "upper");
      bands = model.series.map((_, s) =>
        model.keys.map((_, k) => {
          const r = model.rows[s]?.[k];
          if (!r || (wide && !hi.has(s))) return null;
          const a = gl(r, k);
          const b = gu(r, k);
          return Number.isFinite(a) && Number.isFinite(b) ? [Math.min(a, b), Math.max(a, b)] : null;
        }),
      );
    }
    this.bands = bands;
    const inkOf = (s: number) => (categorical ? categoricalInk(s) : hi.has(s) ? emphasisInk(true) : isArea ? emphasisInk(false) : LINE_REST);

    const allY: number[] = [];
    if (stacked) stacked.y1.forEach((r) => r.forEach((v) => allY.push(v)));
    else model.values.forEach((r) => r.forEach((v) => Number.isFinite(v) && allY.push(v)));
    bands?.forEach((r) => r.forEach((b) => b && allY.push(b[0], b[1])));
    // A reference line outside the data still fits in the drawing
    this.referenceLines.forEach((r) => allY.push(r.y));
    const [mn, mx] = extent(allY.length ? allY : [0, 1]);
    const dom: [number, number] = this.yDomain ?? (mode === "percent" ? [0, 100] : fitDomain(mn, mx, Math.max(2, Math.round(H / 70)), { zero: this.zero ?? isArea }));
    const tickFmt = mode === "percent" ? (v: number) => `${v}%` : makeTickFormatter(this.format, f.locale, Math.max(Math.abs(dom[0]), Math.abs(dom[1])));
    const yTicks = scaleLinear(dom, [0, 1]).ticks(Math.max(2, Math.round(H / 70)));
    const left = yAxisWidth(yTicks, tickFmt, f.locale);
    const endLabels = this.endLabels ?? nS > 1;
    const endW = endLabels ? Math.min(W * 0.28, Math.max(...model.series.map((s) => textWidth(s, AXIS_FONT, 700)), 20) + 14) : 10;
    const top = this.yLabel ? 22 : 10;
    const bottom = 22;
    const x0 = left + 6;
    const x1 = W - endW;
    const y = scaleLinear(dom, [H - bottom, top]);
    const xs = this.xScaleFor(model, x0, x1);
    const centers = model.keys.map((_, k) => xs(k));
    const maxPts = this.maxPoints ?? Math.max(60, Math.round((x1 - x0) * 2));
    // An area's floor: zero, kept inside the axis (the top when every value is negative)
    const base0 = Math.min(dom[1], Math.max(dom[0], 0));
    this.g = { left, top, bottom, x0, x1, endW, base0, yTicks, tickFmt, y, xs, centers };

    this.draws = model.series.map((name, s) => {
      let idx: number[] = [];
      for (let k = 0; k < model.keys.length; k++) if (Number.isFinite(stacked ? stacked.y1[s][k] : model.values[s][k])) idx.push(k);
      if (idx.length > maxPts) idx = lttb(idx.map((k) => ({ x: xs(k), y: stacked ? stacked.y1[s][k] : model.values[s][k], k })), maxPts).map((q) => q.k);
      const pts = idx.map((k) => y(stacked ? stacked.y1[s][k] : model.values[s][k]));
      const base = stacked ? idx.map((k) => y(stacked.y0[s][k])) : isArea ? idx.map(() => y(base0)) : undefined;
      const bk = bands ? idx.filter((k) => bands[s][k]) : [];
      const band = bk.length > 1 ? { xs: bk.map((k) => xs(k)), lo: bk.map((k) => y(bands![s][k]![0])), up: bk.map((k) => y(bands![s][k]![1])) } : undefined;
      return { s, name, pts, xs: idx.map((k) => xs(k)), base, band, ink: inkOf(s), hi: hi.has(s) };
    });

    // The emphasised series is drawn last, on top
    const order = [...this.draws].sort((a, b) => Number(a.hi) - Number(b.hi));
    const baseLine = y(base0);
    // A band opens out from its line: it starts on the line's own y at each of its x
    const lineAt = (d: SeriesDraw) => d.band?.xs.map((bx) => d.pts[d.xs.indexOf(bx)] ?? baseLine) ?? [];
    const marks = order.map((d, k) => {
      const bl = d.band ? [...d.band.lo, ...d.band.up] : [];
      const bp = d.band ? [d.band.lo.length, d.band.up.length] : [];
      if (isArea) {
        const b = d.base ?? d.pts.map(() => baseLine);
        const bFrom = bl.map(() => baseLine);
        return { key: `s:${d.name}`, to: [1, ...d.pts, ...b, ...bl], from: [0, ...d.pts.map(() => baseLine), ...b.map(() => baseLine), ...bFrom], delay: k * this.stagger * 0.5, parts: [1, d.pts.length, b.length, ...bp], data: d };
      }
      const mid = lineAt(d);
      return { key: `s:${d.name}`, to: [1, ...d.pts, ...bl], from: [0, ...d.pts, ...mid, ...mid], enter: [0, ...d.pts, ...mid, ...mid], delay: k * this.stagger, parts: [1, d.pts.length, ...bp], data: d };
    });

    const many = nS > 1;
    const events = model.keys.map((key, k) => {
      const hs = [...hi][0] ?? 0;
      const v = model.values[hs]?.[k];
      return {
        datum: model.rows[hs]?.[k] ?? null,
        index: k,
        key,
        label: model.labels[k],
        value: Number.isFinite(v) ? v : null,
        formatted: model.series
          .map((s, si) => (Number.isFinite(model.values[si][k]) ? `${many && s ? `${s} ` : ""}${f.fv(model.values[si][k])}${this.bandText(si, k, f)}` : null))
          .filter(Boolean)
          .join(", "),
      };
    });
    const first = model.labels[0] ?? "";
    const last = model.labels[model.labels.length - 1] ?? "";
    const summary = `${many ? `${nS} series (${model.series.join(", ")}), ` : ""}from ${first} to ${last}, ${model.keys.length} points`;
    return { marks, events, summary };
  }

  protected override plotMove(x: number, _y: number, e: PointerEvent) {
    if (!this.g.centers.length) return;
    // While dragging, the pointed-at point still follows (dragging is mouse and pen only)
    this.picker.move(x);
    const k = nearestIndex(this.g.centers, x);
    if (k >= 0) this.setActive(k, e.pointerType === "touch" ? "touch" : "pointer");
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
    const model = this.sm;
    const full = this.full ?? model;
    const at = (key: string, fallback: number) => {
      const i = full.keys.indexOf(key);
      return i < 0 ? fallback : i;
    };
    const range: XRange | null = r
      ? { from: at(model.keys[r.from], r.from), to: at(model.keys[r.to], r.to), fromKey: model.keys[r.from], toKey: model.keys[r.to], fromLabel: model.labels[r.from], toLabel: model.labels[r.to] }
      : null;
    this.emit<ChartBrushChange>("tc-brush", { range });
    if (this.brush === "zoom" && range && range.to > range.from) {
      this.zoomed = { sig: dataSignature(this.data as never), range: [range.from, range.to] };
      this.picker.clear();
    }
  }

  /** The picked range's change, span, highest and lowest point, from the emphasised series */
  private picked(f: ChartFrame) {
    const r = this.picker.range;
    const model = this.sm;
    if (!r || r.to >= model.keys.length) return null;
    const hs = [...this.hiSet][0] ?? 0;
    const vals = model.values[hs] ?? [];
    let first = NaN;
    let last = NaN;
    let maxK = -1;
    let minK = -1;
    for (let k = r.from; k <= r.to; k++) {
      const v = vals[k];
      if (!Number.isFinite(v)) continue;
      if (!Number.isFinite(first)) first = v;
      last = v;
      if (maxK < 0 || v > vals[maxK]) maxK = k;
      if (minK < 0 || v < vals[minK]) minK = k;
    }
    const ratio = changeRatio(first, last);
    const main = ratio !== null ? signedPercent(ratio, f.locale) : Number.isFinite(last - first) ? `${last - first >= 0 ? "+" : ""}${f.fv(last - first)}` : "–";
    const sub = defaultBrushWords.range.replace("{from}", model.labels[r.from]).replace("{to}", model.labels[r.to]);
    return { r, hs, vals, maxK, minK, main, sub };
  }

  protected override announcement() {
    const p = this.picked(this.frame);
    if (!p || this.picker.dragging) return null;
    const w = defaultBrushWords;
    const ext = p.maxK >= 0 ? `, ${w.high.toLowerCase()} ${this.frame.fv(p.vals[p.maxK])}, ${w.low.toLowerCase()} ${this.frame.fv(p.vals[p.minK])}` : "";
    return `${p.sub}: ${p.main}${ext}.${this.picker.keyboard ? (this.brush === "zoom" ? w.zoomHint : w.pickHint) : ""}`;
  }

  protected override overlay() {
    if (!this.zoomed) return nothing;
    return html`<button type="button" class="tc-btn-sm tc-chart__reset" @click=${() => (this.zoomed = null)}>${defaultBrushWords.reset}<span class="tc-sr-only"> (reset zoom)</span></button>`;
  }

  protected override tip(k: number, f: ChartFrame): TooltipData | null {
    if (this.picker.dragging) return null;
    const model = this.sm;
    const stacked = this.st;
    const { y, xs, top } = this.g;
    if (model.keys[k] === undefined) return null;
    const percent = this.stackMode() === "percent";
    const rows = model.series
      .map((s, si) => ({ s, si, v: model.values[si][k] }))
      .filter((r) => Number.isFinite(r.v))
      .sort((a, b) => b.v - a.v)
      .slice(0, 8)
      .map((r) => ({
        label: r.s || this.words.value,
        value: percent && stacked ? `${Math.round(stacked.y1[r.si][k] - stacked.y0[r.si][k])}% · ${f.fv(r.v)}` : `${f.fv(r.v)}${this.bandText(r.si, k, f)}`,
        color: this.draws[r.si]?.ink,
        strong: this.hiSet.has(r.si),
      }));
    const yy = Math.min(...model.series.map((_, si) => (stacked ? y(stacked.y1[si][k]) : Number.isFinite(model.values[si][k]) ? y(model.values[si][k]) : f.height)));
    return { x: xs(k), y: Math.max(top, yy), title: model.labels[k], rows };
  }

  /** " (low–high)" after a value whose series has a band at x */
  private bandText(s: number, k: number, f: ChartFrame) {
    const b = this.bands?.[s]?.[k];
    return b ? ` (${f.fv(b[0])}–${f.fv(b[1])})` : "";
  }

  private xAxis(f: ChartFrame) {
    const model = this.sm;
    const { xs, x0, x1, bottom, centers } = this.g;
    let ticks: { x: number; label: string }[];
    if (model.type === "date" && model.keys.length > 1) {
      const t0 = model.xnum[0];
      const t1 = model.xnum[model.xnum.length - 1];
      const sx = scaleLinear([t0, t1], [x0, x1]);
      const tt = timeTicks(t0, t1, Math.max(2, Math.floor((x1 - x0) / 64)), f.locale);
      ticks = tt.length >= 2 && model.keys.length > tt.length ? tt.map((t) => ({ x: sx(t.t), label: t.label })) : thinLabels(centers, model.labels).map((k) => ({ x: centers[k], label: model.labels[k] }));
    } else if (model.type === "number" && model.keys.length > 12) {
      // x ticks are x's own numbers, not the value format; years (1000–9999) without separators
      const [a, b] = extent(model.xnum);
      const sx = scaleLinear([a, b], [x0, x1]);
      const xf = a >= 1000 && b <= 9999 ? String : makeTickFormatter(undefined, f.locale, Math.max(-a, b));
      ticks = sx.ticks(Math.max(2, Math.floor((x1 - x0) / 70))).map((v) => ({ x: sx(v), label: xf(v) }));
    } else ticks = thinLabels(centers, model.labels).map((k) => ({ x: xs(k), label: model.labels[k] }));
    return svg`<g>${fitTickLabels(ticks, -2, f.width + 2).map((t) => txt(t.x, f.height - bottom + 13, t.label, { anchor: "middle" }))}</g>`;
  }

  protected override draw(f: ChartFrame) {
    const { height: H } = f;
    const { left, top, bottom, x0, x1, endW, base0, yTicks, tickFmt, y, xs } = this.g;
    const model = this.sm;
    const stacked = this.st;
    const isArea = this.isArea;
    const mode = this.stackMode();
    const m = this.motion;
    const curve = this.curve;
    const showDots = this.showDots(model.keys.length);
    // The emphasised series on top, whichever it became since the marks were first seen
    const pieces = [...m.items].sort((a, b) => Number(a.data.hi) - Number(b.data.hi)).map((it) => {
      const d = it.data;
      const v = it.v;
      const n = d.xs.length;
      const drawn = v[0];
      const ys = v.slice(1, 1 + n);
      const pts = d.xs.map((xx, i) => [xx, ys[i] ?? ys[ys.length - 1] ?? 0] as [number, number]);
      // The band's edges follow the line's (and an area's floor's) values in the mark
      const bandAt = isArea ? 1 + 2 * n : 1 + n;
      const nb = d.band?.xs.length ?? 0;
      const band = d.band
        ? svg`<path class="tc-xy__band" ?data-hi=${d.hi} d=${areaPath(
            d.band.xs.map((xx, i) => [xx, v[bandAt + nb + i] ?? d.band!.up[i]] as [number, number]),
            d.band.xs.map((xx, i) => [xx, v[bandAt + i] ?? d.band!.lo[i]] as [number, number]),
            curve,
          )} style=${`fill: ${d.ink}`}></path>`
        : nothing;
      if (isArea) {
        const bs = v.slice(1 + n, 1 + 2 * n);
        const floor = d.xs.map((xx, i) => [xx, bs[i] ?? y(base0)] as [number, number]);
        return svg`<g opacity=${it.exiting ? 0.4 : 1}>
          ${band}
          <path class="tc-xy__area" ?data-stacked=${mode !== "none"} ?data-hi=${d.hi} d=${areaPath(pts, floor, curve)} style=${`fill: ${d.ink}`}></path>
          <path class="tc-xy__edge" ?data-stacked=${mode !== "none"} ?data-hi=${d.hi} d=${linePath(pts, curve)} style=${`stroke: ${d.ink}`} opacity=${Math.min(1, drawn * 1.4)}></path>
        </g>`;
      }
      const dash = drawn < 0.999;
      return svg`<g opacity=${it.exiting ? 0.4 : 1}>
        ${band}
        ${this.underFill() && d.hi ? svg`<path d=${areaPath(pts, pts.map(([xx]) => [xx, y(base0)] as [number, number]), curve)} fill=${`url(#${this.gid})`} opacity=${drawn}></path>` : nothing}
        <path class="tc-xy__line" ?data-hi=${d.hi} d=${linePath(pts, curve)} style=${`stroke: ${d.ink}`}
          pathLength=${dash ? 1 : nothing} stroke-dasharray=${dash ? "1 1" : nothing} stroke-dashoffset=${dash ? 1 - drawn : nothing}></path>
        ${showDots
          ? pts.map(([xx, yy], i) => {
              const at = n > 1 ? i / (n - 1) : 1;
              const o = Math.min(1, Math.max(0, (drawn - at) * 8 + (drawn >= 0.999 ? 1 : 0)));
              return svg`<circle class="tc-xy__dot" ?data-hi=${d.hi} cx=${xx} cy=${yy} r=${d.hi ? 3 : 2.2} style=${`--tc-xy-ink: ${d.ink}`} opacity=${o}></circle>`;
            })
          : nothing}
      </g>`;
    });

    const k = this.active;
    const cursor =
      k !== null && model.keys[k] !== undefined
        ? svg`<g pointer-events="none">
            <line class="tc-xy__cursor" x1=${xs(k)} x2=${xs(k)} y1=${top} y2=${H - bottom}></line>
            ${model.series.map((_, si) => {
              const val = stacked ? stacked.y1[si][k] : model.values[si][k];
              if (!Number.isFinite(val)) return nothing;
              return svg`<circle class="tc-xy__point" cx=${xs(k)} cy=${y(val)} r=${this.hiSet.has(si) ? 4.2 : 3.2} style=${`fill: ${this.draws[si]?.ink}`}></circle>`;
            })}
          </g>`
        : nothing;

    const endLabels = this.endLabels ?? model.series.length > 1;
    let ends: unknown = nothing;
    if (endLabels) {
      const list = this.draws
        .map((d) => {
          let li = -1;
          for (let j = model.keys.length - 1; j >= 0; j--) if (Number.isFinite(model.values[d.s][j])) { li = j; break; }
          if (li < 0) return null;
          return { d, y: stacked ? y((stacked.y0[d.s][li] + stacked.y1[d.s][li]) / 2) : y(model.values[d.s][li]) };
        })
        .filter((v): v is { d: SeriesDraw; y: number } => v !== null);
      const ys = dodgeVertical(list.map((l) => l.y), 14, top + 4, H - bottom - 2);
      const fade = m.fade((this.duration ?? this.defaultDuration) * 0.75, 300);
      ends = list.map((l, i) => txt(x1 + 8, ys[i], truncate(l.d.name, endW - 10, AXIS_FONT, l.d.hi ? 700 : 500), { cls: "value", strong: l.d.hi, opacity: fade }));
    }

    return svg`
      ${this.underFill() ? svg`<defs><linearGradient id=${this.gid} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" class="tc-xy__glow"></stop><stop offset="100%" class="tc-xy__glow" data-end></stop></linearGradient></defs>` : nothing}
      ${this.yLabel ? txt(left, 6, this.yLabel) : nothing}
      ${gridY({ ticks: yTicks, y, x0: left, x1: x1 + 4, fmt: tickFmt, locale: f.locale })}
      ${this.referenceLines.map((r) => svg`<line class="tc-xy__ref" x1=${x0} x2=${x1} y1=${y(r.y)} y2=${y(r.y)}></line>`)}
      <rect class="tc-chart__hit" x=${x0} y=${top} width=${Math.max(0, x1 - x0)} height=${Math.max(0, H - bottom - top)}></rect>
      ${pieces}
      ${cursor}
      ${this.referenceLines.map((r) => {
        if (!r.label) return nothing;
        const w = textWidth(r.label, AXIS_FONT);
        // On a backing of the card's colour, as a line may pass behind it
        return svg`<g pointer-events="none"><rect class="tc-xy__ref-back" x=${x1 - w - 8} y=${y(r.y) - 17} width=${w + 8} height="15" rx="5"></rect>${txt(x1 - 4, y(r.y) - 9.5, r.label, { anchor: "end" })}</g>`;
      })}
      ${ends}
      ${this.brushLayer(f)}
      ${this.xAxis(f)}`;
  }

  private brushLayer(f: ChartFrame) {
    const p = this.picked(f);
    if (!p) return nothing;
    const { top, bottom, centers, y } = this.g;
    const stacked = this.st;
    const yAt = (k: number) => y(stacked ? stacked.y1[p.hs][k] : p.vals[k]);
    const plotBottom = f.height - bottom;
    return svg`${brushBand({ x0: centers[p.r.from], x1: centers[p.r.to], top, bottom: plotBottom, width: f.width, main: p.main, sub: p.sub, dragging: this.picker.dragging })}
      ${p.maxK >= 0 && p.minK >= 0 && p.maxK !== p.minK
        ? extremeTags({ width: f.width, top, bottom: plotBottom, max: { x: centers[p.maxK], y: yAt(p.maxK), text: f.fv(p.vals[p.maxK]) }, min: { x: centers[p.minK], y: yAt(p.minK), text: f.fv(p.vals[p.minK]) }, words: defaultBrushWords })
        : nothing}`;
  }

}

const xyCss = /* css */ `
.tc-xy__line { fill: none; stroke-width: 1.7; stroke-linejoin: round; stroke-linecap: round; }
.tc-xy__line[data-hi] { stroke-width: 2.6; }
.tc-xy__dot { fill: var(--tc-plot-bg); stroke: var(--tc-xy-ink); stroke-width: 1.4; }
.tc-xy__dot[data-hi] { fill: var(--tc-xy-ink); stroke-width: 0; }
.tc-xy__area { opacity: 0.28; }
.tc-xy__area[data-hi] { opacity: 0.5; }
.tc-xy__area[data-stacked] { opacity: 1; }
.tc-xy__edge { fill: none; stroke-width: 1.4; stroke-linejoin: round; }
.tc-xy__edge[data-hi] { stroke-width: 2.2; }
.tc-xy__edge[data-stacked] { stroke: var(--tc-plot-bg) !important; stroke-width: 1.2; }
.tc-xy__band { fill-opacity: 0.14; stroke: none; }
.tc-xy__band[data-hi] { fill-opacity: 0.2; }
.tc-xy__cursor { stroke: var(--tc-plot-zero); stroke-width: 1; }
.tc-xy__point { stroke: var(--tc-plot-bg); stroke-width: 2; }
.tc-xy__ref { stroke: var(--tc-plot-zero); stroke-dasharray: 3 3; }
.tc-xy__ref-back { fill: var(--tc-plot-bg); opacity: 0.94; }
.tc-xy__glow { stop-color: var(--tc-plot-accent); stop-opacity: 0.28; }
.tc-xy__glow[data-end] { stop-opacity: 0; }
`;

registerChartSheet("tc-xy", xyCss);
