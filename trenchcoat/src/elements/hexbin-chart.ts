import { html, nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { gridY, txt, yAxisWidth } from "./internal/chart/axis";
import { defaultChartLabels, TcChartElement, type ChartFrame, type ChartLabels, type ChartModel } from "./internal/chart/element";
import { numGetter } from "./internal/chart/accessor";
import { formatNumber, makeTickFormatter, type FormatSpec, type ValueFormatter } from "./internal/chart/format";
import { hexbin, hexIndex, hexKey, hexPath, type HexCell } from "./internal/chart/hexbin";
import { extent, fitDomain, scaleLinear, type LinearScale } from "./internal/chart/scale";
import type { Accessor, Row, TooltipData } from "./internal/chart/types";

/*
 * <tc-hexbin-chart> – many points by x and y, gathered into hexagons and shaded by how many fell in each: where the
 * points crowd, for scatters too dense to read point by point. `aggregate` shades by the sum or mean of a `value`
 * instead of the count. Empty hexagons aren't drawn; the densest is ringed; a ramp in the header says what the shades
 * mean. The hexagons are about `radius` px across and get smaller on narrow widths, and larger if there would be more
 * than 3,000 of them. Binning is one pass over the points, so 50,000 are fine. Hexagons grow in from left to right when
 * the chart comes on screen and glide (in shade) when the data changes.
 *   · one tab stop: arrows move hexagon to hexagon in reading order – by row, then column – each read with its x and
 *     y range, count and aggregate
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-hexbin-chart heading="Readings" x-label="Temperature" y-label="Drift" .data=${[{ x: 21.4, y: 0.3 }, …]}></tc-hexbin-chart>
 */

/** Hexagons in a honeycomb, in the Lucide style (24 × 24, 2px strokes) */
const hexIcon = svg`<path d="M7 3.5 10.5 5.5v4L7 11.5 3.5 9.5v-4Z"></path><path d="M14.5 3.5 18 5.5v4l-3.5 2-3.5-2v-4Z"></path><path d="M10.8 12.5 14.3 14.5v4l-3.5 2-3.5-2v-4Z"></path>`;

/** What a hexagon's shade shows: how many points, or the sum or mean of their `value` */
export type HexbinAggregate = "count" | "sum" | "mean";

/** The words a hexbin chart adds to the shared ones */
export type HexbinLabels = {
  count: string;
  sum: string;
  mean: string;
  /** "{n} points in {cells} hexagons" – the summary's start */
  summary: string;
  /** "densest at x {x}, y {y} ({count})" – the summary's end */
  densest: string;
};
export const defaultHexbinLabels: HexbinLabels = {
  count: "Count",
  sum: "Sum",
  mean: "Mean",
  summary: "{n} points in {cells} hexagons",
  densest: "densest at x {x}, y {y} ({count})",
};

type Hex = HexCell & { k: number; cx: number; cy: number; metric: number; mix: number; peak: boolean; xr: string; yr: string };

/** At most this many hexagons; past it they grow */
const MAX_HEXES = 3000;
const fill = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));

/**
 * Many points by x and y gathered into hexagons shaded by count – or the sum or mean of a value – with a ramp legend,
 * the densest ringed, and a table view.
 * @tag tc-hexbin-chart
 * @fires tc-view-change - The Table button was pressed ({ view }: ChartViewChange); cancelable – prevented, `view` stays as it was
 * @fires tc-mark-hover - The pointer or keyboard moved to a hexagon, or off them ({ event }: ChartMarkHover)
 * @fires tc-mark-click - A hexagon was clicked, or picked with Enter or Space ({ event }: ChartMarkClick)
 */
export class TcHexbinChart<T = Row> extends TcChartElement<Hex, T> {
  static override ui = "hxb";

  /** The x field; by default "x" */
  @property({ attribute: false }) accessor x: Accessor<T, number> | undefined = undefined;
  /** The y field; by default "y" */
  @property({ attribute: false }) accessor y: Accessor<T, number> | undefined = undefined;
  /** The value field summed or averaged with `aggregate`; by default "value" */
  @property({ attribute: false }) accessor value: Accessor<T, number> | undefined = undefined;
  /** What the shade shows: "count" of points, or the "sum" or "mean" of `value` */
  @property() accessor aggregate: HexbinAggregate = "count";
  /** The hexagons' radius in px (centre to corner); smaller on narrow widths */
  @property({ type: Number }) accessor radius = 12;
  /** The x axis's name, at its right end */
  @property({ attribute: "x-label" }) accessor xLabel = "";
  /** The y axis's name, above it */
  @property({ attribute: "y-label" }) accessor yLabel = "";
  /** How x values are written; `format` writes y */
  @property({ attribute: false }) accessor xFormat: FormatSpec | undefined = undefined;
  /** How the aggregate is written; by default as numbers */
  @property({ attribute: false }) accessor valueFormat: FormatSpec | undefined = undefined;
  /** The hexbin chart's own words, merged over defaultHexbinLabels */
  @property({ attribute: false }) accessor hexbinLabels: Partial<HexbinLabels> = {};

  protected override readonly kind = "Hexbin chart";
  protected override readonly icon = hexIcon;
  protected override defaultDuration = 700;
  protected override modelKeys = ["x", "y", "value", "aggregate", "radius", "xLabel", "yLabel", "xFormat", "valueFormat", "hexbinLabels"];

  private hexes: Hex[] = [];
  private byKey = new Map<number, number>();
  private legend = { lo: "", hi: "", name: "" };
  private geo = {
    left: 0,
    top: 10,
    bottom: 24,
    x0: 0,
    r: 10,
    xs: scaleLinear([0, 1], [0, 1]) as LinearScale,
    ys: scaleLinear([0, 1], [0, 1]) as LinearScale,
    xTicks: [] as number[],
    yTicks: [] as number[],
    xFmt: String as ValueFormatter,
    yFmt: String as ValueFormatter,
  };

  private get hexWords(): HexbinLabels {
    return { ...defaultHexbinLabels, ...this.hexbinLabels };
  }

  /** A hexagon's value is its count (or aggregate), so the shared "Value" says which */
  protected override get words(): ChartLabels {
    return { ...defaultChartLabels, value: this.hexWords[this.aggregate] ?? this.hexWords.count, ...this.labels };
  }

  protected override defaultHeight(w: number) {
    return Math.max(220, Math.min(340, w * 0.6));
  }

  protected override tableHeader() {
    return "Hexagon";
  }

  private agg(v: number, f: ChartFrame) {
    return makeTickFormatter(this.valueFormat, f.locale, Math.abs(v))(v);
  }

  protected override buildModel(f: ChartFrame): ChartModel<Hex, T> {
    const { width: W, height: H } = f;
    const hw = this.hexWords;
    const gx = numGetter(this.x, "x");
    const gy = numGetter(this.y, "y");
    const mode = this.aggregate;
    const gv = mode === "count" ? null : numGetter(this.value, "value");
    // One pass into typed arrays
    const N = this.data.length;
    const vx = new Float64Array(N);
    const vy = new Float64Array(N);
    const vv = gv ? new Float64Array(N) : undefined;
    let n = 0;
    let xmn = Infinity;
    let xmx = -Infinity;
    let ymn = Infinity;
    let ymx = -Infinity;
    for (let i = 0; i < N; i++) {
      const d = this.data[i];
      const a = gx(d, i);
      const b = gy(d, i);
      if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
      vx[n] = a;
      vy[n] = b;
      if (vv && gv) vv[n] = gv(d, i);
      if (a < xmn) xmn = a;
      if (a > xmx) xmx = a;
      if (b < ymn) ymn = b;
      if (b > ymx) ymx = b;
      n++;
    }
    if (!n) [xmn, xmx, ymn, ymx] = [0, 1, 0, 1];
    const yDom = fitDomain(ymn, ymx, Math.max(2, Math.round(H / 70)), { pad: 0.04 });
    const xDom = fitDomain(xmn, xmx, Math.max(2, Math.round(W / 110)), { pad: 0.03 });
    const yFmt = makeTickFormatter(this.format, f.locale, Math.max(Math.abs(yDom[0]), Math.abs(yDom[1])));
    const xFmt = makeTickFormatter(this.xFormat, f.locale, Math.max(Math.abs(xDom[0]), Math.abs(xDom[1])));
    const yTicks = scaleLinear(yDom, [0, 1]).ticks(Math.max(2, Math.round(H / 70)));
    const left = yAxisWidth(yTicks, yFmt, f.locale);
    const top = this.yLabel ? 20 : 10;
    // The x axis's name goes on its own row under the ticks: inside the plot it would sit on the hexagons
    const bottom = this.xLabel ? 40 : 24;
    const x0 = left + 6;
    const xs = scaleLinear(xDom, [x0, W - 8]);
    const ys = scaleLinear(yDom, [H - bottom, top]);

    // Points to plot px, the grid's origin at the plot's top-left corner
    const px = new Float64Array(n);
    const py = new Float64Array(n);
    for (let p = 0; p < n; p++) {
      px[p] = xs(vx[p]) - x0;
      py[p] = ys(vy[p]) - top;
    }
    let r = Math.max(4, Math.min(this.radius > 0 ? this.radius : 12, 40, Math.max(5, (W - x0) / 36)));
    let cells = hexbin(px, py, r, vv?.subarray(0, n));
    for (let t = 0; t < 6 && cells.length > MAX_HEXES; t++) {
      r *= 1.35;
      cells = hexbin(px, py, r, vv?.subarray(0, n));
    }
    const metricOf = (c: HexCell) => (mode === "sum" ? c.sum : mode === "mean" ? (c.valued ? c.sum / c.valued : NaN) : c.count);
    const metrics = cells.map(metricOf);
    const fin = metrics.filter(Number.isFinite);
    const [lo, hi] = fin.length ? extent(fin) : [0, 1];
    let peakK = -1;
    cells.forEach((c, k) => {
      if (peakK < 0 || c.count > cells[peakK].count) peakK = k;
    });
    const dx = r * Math.sqrt(3);
    const range = (a: number, b: number, fmt: ValueFormatter) => `${fmt(Math.min(a, b))}–${fmt(Math.max(a, b))}`;
    const hexes: Hex[] = cells.map((c, k) => {
      const cx = c.x + x0;
      const cy = c.y + top;
      const m = metrics[k];
      const mix = Number.isFinite(m) ? 18 + (hi > lo ? ((m - lo) / (hi - lo)) * 82 : 82) : 0;
      return {
        ...c,
        k,
        cx,
        cy,
        metric: m,
        mix: Math.round(mix),
        peak: k === peakK,
        xr: range(xs.invert(cx - dx / 2), xs.invert(cx + dx / 2), xFmt),
        yr: range(ys.invert(cy + r), ys.invert(cy - r), (v) => yFmt(v)),
      };
    });
    this.hexes = hexes;
    this.byKey = new Map(hexes.map((h, k) => [hexKey(h.i, h.j), k]));
    this.geo = { left, top, bottom, x0, r, xs, ys, xTicks: xs.ticks(Math.max(2, Math.round(W / 110))), yTicks, xFmt, yFmt };
    const name = hw[mode] ?? hw.count;
    this.legend = { lo: mode === "count" ? formatNumber(lo, { locale: f.locale, maximumFractionDigits: 0 }) : this.agg(lo, f), hi: mode === "count" ? formatNumber(hi, { locale: f.locale, maximumFractionDigits: 0 }) : this.agg(hi, f), name };

    const D = this.duration ?? this.defaultDuration;
    const xr = W || 1;
    const marks = hexes.map((h) => ({ key: `h:${h.i},${h.j}`, to: [h.mix, 1], from: [h.mix, 0], enter: [h.mix, 0], delay: (h.cx / xr) * D * 0.5, data: h }));
    const count = (v: number) => formatNumber(v, { locale: f.locale, maximumFractionDigits: 0 });
    const events = hexes.map((h) => ({
      datum: null,
      index: h.k,
      key: `${h.i},${h.j}`,
      label: `x ${h.xr}, y ${h.yr}`,
      value: Number.isFinite(h.metric) ? h.metric : null,
      formatted: mode === "count" ? count(h.count) : `${name.toLowerCase()} ${Number.isFinite(h.metric) ? this.agg(h.metric, f) : "–"}, ${count(h.count)} ${hw.count.toLowerCase()}`,
    }));
    const pk = hexes[peakK];
    const parts = [fill(hw.summary, { n: count(n), cells: count(hexes.length) })];
    if (pk) parts.push(fill(hw.densest, { x: pk.xr, y: pk.yr, count: count(pk.count) }));
    return { marks, events, summary: parts.join("; ") };
  }

  protected override plotMove(x: number, y: number, e: PointerEvent) {
    const { x0, top, r } = this.geo;
    const [i, j] = hexIndex(x - x0, y - top, r);
    const k = this.byKey.get(hexKey(i, j)) ?? null;
    if (k !== this.active) this.setActive(k, e.pointerType === "touch" ? "touch" : "pointer");
  }

  protected override tip(i: number, f: ChartFrame): TooltipData | null {
    const h = this.hexes[i];
    if (!h) return null;
    const hw = this.hexWords;
    const count = formatNumber(h.count, { locale: f.locale, maximumFractionDigits: 0 });
    return {
      x: h.cx,
      y: h.cy - this.geo.r,
      title: `${this.xLabel || "x"} ${h.xr}`,
      rows: [
        { label: this.yLabel || "y", value: h.yr },
        { label: hw.count, value: count, color: this.inkOf(h.mix) },
        ...(this.aggregate !== "count" ? [{ label: hw[this.aggregate], value: Number.isFinite(h.metric) ? this.agg(h.metric, f) : "–", strong: true }] : []),
      ],
    };
  }

  private inkOf(mix: number) {
    return `color-mix(in oklab, var(--tc-hxb-ink) ${Math.round(mix)}%, var(--tc-hxb-track))`;
  }

  protected override headerLegend() {
    if (!this.hexes.length) return nothing;
    const l = this.legend;
    return html`<span class="ui-hxb__legend">
      <span class="ui-hxb__name">${l.name}</span> <span class="ui-hxb__end">${l.lo}</span> <span class="ui-hxb__ramp" aria-hidden="true"></span>
      <span class="ui-hxb__end">${l.hi}</span>
    </span>`;
  }

  protected override draw(f: ChartFrame) {
    const { width: W, height: H } = f;
    const { left, top, bottom, r, xs, ys, xTicks, yTicks, xFmt, yFmt } = this.geo;
    const m = this.motion;
    const active = this.active !== null ? this.hexes[this.active] : undefined;
    const peak = this.hexes.find((h) => h.peak);
    return svg`
      ${this.yLabel ? txt(left, 6, this.yLabel) : nothing}
      ${gridY({ ticks: yTicks, y: ys, x0: left, x1: W, fmt: yFmt, locale: f.locale })}
      <g>${xTicks.map((t) => txt(xs(t), H - bottom + 13, xFmt(t), { anchor: "middle" }))}</g>
      ${this.xLabel ? txt(W - 2, H - bottom + 30, this.xLabel, { anchor: "end" }) : nothing}
      <rect class="tc-chart__hit" x=${left} y=${top - r} width=${Math.max(0, W - left)} height=${Math.max(0, H - bottom - top + r * 2)}
        @click=${() => this.active !== null && this.clickMark(this.active)}></rect>
      <g class="ui-hxb__cells">${m.items.map((it) => {
        const h = it.data;
        const [mix, s] = it.v;
        if (s <= 0.01) return nothing;
        return svg`<path class="ui-hxb__hex" d=${hexPath(r * 0.96 * Math.min(1, s), h.cx, h.cy)} style=${`fill: ${this.inkOf(mix)}`}
          opacity=${it.exiting ? 0.3 : active && active !== h ? 0.55 : 1}></path>`;
      })}</g>
      ${peak ? svg`<path class="ui-hxb__peak" d=${hexPath(r + 1.5, peak.cx, peak.cy)} opacity=${m.fade((this.duration ?? this.defaultDuration) * 0.7, 300)}></path>` : nothing}
      ${active ? svg`<path class="tc-chart__focus" d=${hexPath(r + 3, active.cx, active.cy)}></path>` : nothing}`;
  }

  static override css = /* css */ `
[data-ui="hxb"] {
  --tc-hxb-ink: var(--tc-plot-accent);
  --tc-hxb-track: var(--tc-plot-grid);
  --tc-hxb-peak: var(--tc-text-primary);
}
/* Hexagons parted by a hairline of the card's colour; the densest ringed */
.ui-hxb__hex { stroke: var(--tc-plot-bg); stroke-width: 0.8; pointer-events: none; }
.ui-hxb__peak { fill: none; stroke: var(--tc-hxb-peak); stroke-width: 1.6; pointer-events: none; }
.ui-hxb__legend { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-hxb__name { margin-inline-end: var(--tc-space-1); }
.ui-hxb__ramp { display: inline-block; width: 72px; height: 10px; border-radius: var(--tc-radius-2xs); background: linear-gradient(to right, color-mix(in oklab, var(--tc-hxb-ink) 18%, var(--tc-hxb-track)), var(--tc-hxb-ink)); }
@media (forced-colors: active) {
  .ui-hxb__hex, .ui-hxb__ramp { forced-color-adjust: none; }
  .ui-hxb__peak { stroke: CanvasText; }
}
`;
}

if (!customElements.get("tc-hexbin-chart")) customElements.define("tc-hexbin-chart", TcHexbinChart);

declare global {
  interface HTMLElementTagNameMap {
    "tc-hexbin-chart": TcHexbinChart;
  }
}
