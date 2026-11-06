import { nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { fitTickLabels, gridY, txt, yAxisWidth } from "./internal/chart/axis";
import { binValues } from "./internal/chart/bins";
import { AXIS_FONT, defaultChartLabels, emphasisInk, TcChartElement, type ChartFrame, type ChartLabels, type ChartModel } from "./internal/chart/element";
import { formatNumber, makeTickFormatter } from "./internal/chart/format";
import { linePath, roundRectPath } from "./internal/chart/geometry";
import { resolveHighlight } from "./internal/chart/highlight";
import { numGetter } from "./internal/chart/accessor";
import { fitDomain, scaleLinear } from "./internal/chart/scale";
import { boxStats, kde } from "./internal/chart/stats";
import { textWidth } from "./internal/chart/text";
import type { Accessor, Row, TooltipData } from "./internal/chart/types";

/*
 * <tc-histogram> – how raw numbers spread, binned into touching bars on round edges. The bin count is worked out from
 * the data (Freedman–Diaconis, kept to 5–40) unless `bins` or `bin-width` says otherwise. The tallest bin takes the
 * accent and the rest stay quiet (`highlight` picks others, by bin index or range). `cumulative` stacks the counts up
 * as a running total; `density` lays a smoothed curve over the bars; `markers` draws the mean and median as dashed
 * lines, named above the plot. Bars grow up from the baseline when the chart comes on screen and glide when the data
 * changes.
 *   · one tab stop: arrows move bin to bin, each read with its range, count and share
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-histogram heading="Assay turnaround" unit=" h" .data=${[{ value: 12.5 }, { value: 18 }, …]}></tc-histogram>
 */

/** A histogram: touching bars of different heights on an axis, in the Lucide style (24 × 24, 2px strokes) */
const histogramIcon = svg`<path d="M3 3v16a2 2 0 0 0 2 2h16"></path><path d="M7 17v-4h4"></path><path d="M11 17V7h4v10"></path><path d="M15 11h4v6"></path>`;

/** Which summary lines to draw across the bars */
export type HistogramMarkers = "none" | "mean" | "median" | "both";

/** The words a histogram adds to the shared ones */
export type HistogramLabels = {
  count: string;
  /** The running total's name, with `cumulative` */
  cumulative: string;
  mean: string;
  median: string;
  /** "{count} outside the range" – values a fixed `domain` left out, in the summary */
  outside: string;
  /** "{n} values in {bins} bins, from {from} to {to}" – the summary's start */
  summary: string;
  /** "most in {range} ({count})" – the summary's end */
  peak: string;
};
export const defaultHistogramLabels: HistogramLabels = {
  count: "Count",
  cumulative: "Running total",
  mean: "Mean",
  median: "Median",
  outside: "{count} outside the range",
  summary: "{n} values in {bins} bins, from {from} to {to}",
  peak: "most in {range} ({count})",
};

type Bin = { k: number; lo: number; hi: number; count: number; cum: number; share: number; range: string; top: boolean; ink: string };

/** Points along the density curve */
const DS = 96;
const fill = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));

/**
 * How raw numbers spread, as touching bars on round bin edges – counts or a running total, a density curve and mean
 * and median lines if wanted – with the tallest bin emphasised and a table view.
 * @tag tc-histogram
 * @fires tc-view-change - The Table button was pressed ({ view }: ChartViewChange); cancelable – prevented, `view` stays as it was
 * @fires tc-mark-hover - The pointer or keyboard moved to a bin, or off them ({ event }: ChartMarkHover)
 * @fires tc-mark-click - A bin was clicked, or picked with Enter or Space ({ event }: ChartMarkClick)
 */
export class TcHistogram<T = Row> extends TcChartElement<Bin, T> {
  static override ui = "hst";

  /** The value field; by default "value" */
  @property({ attribute: false }) accessor value: Accessor<T, number> | undefined = undefined;
  /** How many bins to aim for (the edges are rounded); by default worked out from the data */
  @property({ type: Number }) accessor bins: number | undefined = undefined;
  /** The width of each bin; wins over `bins` */
  @property({ type: Number, attribute: "bin-width" }) accessor binWidth: number | undefined = undefined;
  /** Only values in [low, high] are counted, and the axis spans exactly that; by default the values' range */
  @property({ attribute: false }) accessor domain: [number, number] | undefined = undefined;
  /** Each bar is the running total up to its bin's end */
  @property({ type: Boolean }) accessor cumulative = false;
  /** A smoothed density curve over the bars (counts only, not with `cumulative`) */
  @property({ type: Boolean }) accessor density = false;
  /** Dashed lines across the bars at the mean, the median, both or neither */
  @property() accessor markers: HistogramMarkers = "none";
  /** The histogram's own words, merged over defaultHistogramLabels */
  @property({ attribute: false }) accessor histogramLabels: Partial<HistogramLabels> = {};

  protected override readonly kind = "Histogram";
  protected override readonly icon = histogramIcon;
  protected override defaultDuration = 750;
  protected override stagger = 28;
  protected override modelKeys = ["value", "bins", "binWidth", "domain", "cumulative", "density", "markers", "histogramLabels"];

  private binsOut: Bin[] = [];
  private geo = {
    left: 0,
    top: 0,
    bottom: 22,
    base: 0,
    ticks: [] as number[],
    xticks: [] as { x: number; label: string }[],
    tickFmt: ((v: number) => String(v)) as (v: number) => string,
    x: scaleLinear([0, 1], [0, 1]),
    y: scaleLinear([0, 1], [0, 1]),
    curve: "",
    lines: [] as { kind: "mean" | "median"; v: number; x: number; label: string; anchor: "start" | "middle" | "end" }[],
  };

  /** A bin's height is its count, so the shared "Value" reads "Count" unless the page renames it */
  protected override get words(): ChartLabels {
    return { ...defaultChartLabels, value: this.histWords.count, ...this.labels };
  }

  private get histWords(): HistogramLabels {
    return { ...defaultHistogramLabels, ...this.histogramLabels };
  }

  protected override defaultHeight(w: number) {
    return Math.max(200, Math.min(300, w * 0.5));
  }

  protected override tableHeader() {
    return "Range";
  }

  protected override buildModel(f: ChartFrame): ChartModel<Bin, T> {
    const { width: W, height: H } = f;
    const hw = this.histWords;
    const gv = numGetter(this.value, "value");
    const values = this.data.map((d, i) => gv(d, i)).filter((v) => Number.isFinite(v));
    const b = values.length ? binValues(values, { bins: this.bins, binWidth: this.binWidth, domain: this.domain }) : { edges: [], counts: [], n: 0, outside: 0 };
    const { edges, counts, n } = b;
    const unit = this.unit;
    const num = (v: number) => f.fmt(v);
    const last = counts.length - 1;
    let run = 0;
    const raw = counts.map((count, k) => {
      run += count;
      const range = `[${num(edges[k])}, ${num(edges[k + 1])}${k === last ? "]" : ")"}${unit}`;
      return { k, lo: edges[k], hi: edges[k + 1], count, cum: run, share: n ? (count / n) * 100 : 0, range };
    });
    const heights = raw.map((r) => (this.cumulative ? r.cum : r.count));
    const hi = resolveHighlight(this.highlight as never, raw.map((r) => r.range) as never[], raw.map((r) => r.range), heights, this.cumulative ? "none" : "max");
    const bins: Bin[] = raw.map((r) => ({ ...r, top: hi.has(r.k), ink: emphasisInk(hi.has(r.k)) }));
    this.binsOut = bins;

    const st = values.length ? boxStats(b.outside ? values.filter((v) => !this.domain || (v >= this.domain[0] && v <= this.domain[1])) : values) : null;
    const want = this.markers;
    const marks = st && want !== "none" && Number.isFinite(st.mean) ? ((want === "both" ? ["mean", "median"] : [want]) as ("mean" | "median")[]) : [];
    const top = marks.length ? 22 : 8;
    const bottom = 22;
    const peak = Math.max(1, ...heights);
    const dom = fitDomain(0, peak, Math.max(2, Math.round(H / 70)), { zero: true, pad: 0.04 });
    const tickFmt = makeTickFormatter(undefined, f.locale, dom[1]);
    const ticks = scaleLinear(dom, [0, 1])
      .ticks(Math.max(2, Math.round(H / 70)))
      .filter((t) => Number.isInteger(t));
    const left = yAxisWidth(ticks, tickFmt, f.locale);
    const x0 = left + 4;
    const x1 = W - 6;
    const xd: [number, number] = edges.length ? [edges[0], edges[edges.length - 1]] : [0, 1];
    const x = scaleLinear(xd, [x0, x1]);
    const y = scaleLinear(dom, [H - bottom, top]);
    const base = y(0);
    const xfmt = makeTickFormatter(this.format, f.locale, Math.max(Math.abs(xd[0]), Math.abs(xd[1])));
    const xticks = fitTickLabels(
      x.ticks(Math.max(2, Math.round((x1 - x0) / 80))).map((t) => ({ x: x(t), label: xfmt(t) })),
      0,
      W,
    );

    // The density, scaled so its area matches the bars'
    let curve = "";
    if (this.density && !this.cumulative && values.length > 1 && edges.length > 1) {
      const xs = Array.from({ length: DS }, (_, k) => xd[0] + ((xd[1] - xd[0]) * k) / (DS - 1));
      const width = (xd[1] - xd[0]) / counts.length;
      const ds = kde(values, xs);
      curve = linePath(
        xs.map((v, k) => [x(v), Math.max(top, y(ds[k] * n * width))] as [number, number]),
        "smooth",
      );
    }
    // The summary lines, their names above the plot pushed apart when they'd touch
    const lines = marks.map((kind) => {
      const v = kind === "mean" ? st!.mean : st!.median;
      return { kind, v, x: x(v), label: `${kind === "mean" ? hw.mean : hw.median} ${f.fv(v)}`, anchor: "middle" as "start" | "middle" | "end" };
    });
    if (lines.length === 2) {
      const [a, c] = lines[0].x <= lines[1].x ? [lines[0], lines[1]] : [lines[1], lines[0]];
      const room = (textWidth(a.label, AXIS_FONT) + textWidth(c.label, AXIS_FONT)) / 2 + 8;
      if (c.x - a.x < room) {
        a.anchor = "end";
        c.anchor = "start";
      }
    }
    for (const l of lines) {
      const w = textWidth(l.label, AXIS_FONT) + 4;
      const lx = l.anchor === "end" ? l.x - 3 : l.anchor === "start" ? l.x + 3 : l.x;
      const from = l.anchor === "end" ? lx - w : l.anchor === "start" ? lx : lx - w / 2;
      if (from < 0) l.anchor = "start";
      else if (from + w > W) l.anchor = "end";
    }
    this.geo = { left, top, bottom, base, ticks, xticks, tickFmt, x, y, curve, lines };

    const marksOut = bins.map((bn) => {
      const h = y(this.cumulative ? bn.cum : bn.count);
      return { key: `h:${bn.k}`, to: [x(bn.lo), x(bn.hi), h], from: [x(bn.lo), x(bn.hi), base], enter: [x(bn.lo), x(bn.hi), base], delay: bn.k * this.stagger, data: bn };
    });
    const events = bins.map((bn) => ({
      datum: null,
      index: bn.k,
      key: `h:${bn.k}`,
      label: bn.range,
      value: this.cumulative ? bn.cum : bn.count,
      formatted: this.cumulative ? `${this.count(bn.cum, f)} (${f.pct(n ? (bn.cum / n) * 100 : 0)})` : `${this.count(bn.count, f)} (${f.pct(bn.share)})`,
    }));
    const best = bins.length ? bins.reduce((a, c) => (c.count > a.count ? c : a)) : null;
    const parts = [fill(hw.summary, { n: this.count(n, f), bins: bins.length, from: f.fv(xd[0]), to: f.fv(xd[1]) })];
    if (best && best.count) parts.push(fill(hw.peak, { range: best.range, count: this.count(best.count, f) }));
    if (b.outside) parts.push(fill(hw.outside, { count: this.count(b.outside, f) }));
    return { marks: marksOut, events, summary: parts.join("; ") };
  }

  private count(v: number, f: ChartFrame) {
    return formatNumber(v, { locale: f.locale, maximumFractionDigits: 0 });
  }

  protected override tip(i: number, f: ChartFrame): TooltipData | null {
    const bn = this.binsOut[i];
    if (!bn) return null;
    const { x, y } = this.geo;
    const hw = this.histWords;
    const total = this.binsOut.length ? this.binsOut[this.binsOut.length - 1].cum : 0;
    const rows = [
      { label: this.words.value, value: this.count(bn.count, f), color: bn.ink },
      { label: this.words.share, value: f.pct(bn.share), strong: false },
    ];
    if (this.cumulative) rows.push({ label: hw.cumulative, value: `${this.count(bn.cum, f)} (${f.pct(total ? (bn.cum / total) * 100 : 0)})`, color: bn.ink });
    return { x: (x(bn.lo) + x(bn.hi)) / 2, y: y(this.cumulative ? bn.cum : bn.count), title: bn.range, rows };
  }

  protected override draw(f: ChartFrame) {
    const { width: W, height: H } = f;
    const { left, top, bottom, base, ticks, xticks, tickFmt, curve, lines } = this.geo;
    const m = this.motion;
    const fadeIn = m.fade(this.binsOut.length * this.stagger + 200, 320);
    return svg`
      ${gridY({ ticks, y: this.geo.y, x0: left, x1: W, fmt: tickFmt, locale: f.locale })}
      ${m.items.map((it) => {
        const bn = it.data;
        const [a, b, h] = it.v;
        const w = Math.max(0, b - a - 1);
        const hgt = Math.max(0, base - h);
        const r = Math.min(3, w / 3, hgt);
        const focus = this.active === bn.k && this.via === "keyboard";
        const hv = this.hover(bn.k);
        return svg`<g class="tc-chart__mark" opacity=${it.exiting ? 0.4 : this.dim(bn.k)} @pointerenter=${hv.enter} @click=${hv.click}>
          <rect class="tc-chart__hit" x=${a} y=${top} width=${Math.max(0, b - a)} height=${Math.max(0, H - top - bottom)}></rect>
          <path class="ui-hst__bar" d=${roundRectPath(a + 0.5, h, w, hgt, { tl: r, tr: r })} style=${`fill: ${bn.ink}`} ?data-hi=${bn.top}></path>
          ${focus ? svg`<path class="tc-chart__focus" d=${roundRectPath(a - 1.5, h - 2, w + 4, hgt + 2, 3)}></path>` : nothing}
        </g>`;
      })}
      <line class="ui-hst__base" x1=${left} x2=${W} y1=${base + 0.5} y2=${base + 0.5}></line>
      ${curve ? svg`<path class="ui-hst__density" d=${curve} opacity=${fadeIn}></path>` : nothing}
      ${lines.map(
        (l) => svg`<g class="ui-hst__marker" data-kind=${l.kind} opacity=${fadeIn}>
          <line class="ui-hst__marker-line" x1=${l.x} x2=${l.x} y1=${top - 4} y2=${base}></line>
          ${txt(l.anchor === "end" ? l.x - 3 : l.anchor === "start" ? l.x + 3 : l.x, top - 12, l.label, { anchor: l.anchor, strong: true })}
        </g>`,
      )}
      <g>${xticks.map((t) => txt(t.x, H - bottom + 13, t.label, { anchor: "middle" }))}</g>`;
  }

  static override css = /* css */ `
[data-ui="hst"] {
  --tc-hst-density: var(--tc-text-primary);
  --tc-hst-marker: var(--tc-text-primary);
}
/* Touching bars, parted by a hairline of the card's colour */
.ui-hst__bar { stroke: var(--tc-plot-bg); stroke-width: 1; }
.ui-hst__base { stroke: var(--tc-plot-zero); stroke-width: 1; shape-rendering: crispEdges; }
.ui-hst__density { fill: none; stroke: var(--tc-hst-density); stroke-width: 1.8; stroke-linejoin: round; pointer-events: none; }
.ui-hst__marker { pointer-events: none; }
.ui-hst__marker-line { stroke: var(--tc-hst-marker); stroke-width: 1.4; stroke-dasharray: 4 3; }
@media (forced-colors: active) {
  .ui-hst__bar { forced-color-adjust: none; }
  .ui-hst__density, .ui-hst__marker-line { stroke: CanvasText; }
}
`;
}

if (!customElements.get("tc-histogram")) customElements.define("tc-histogram", TcHistogram);

declare global {
  interface HTMLElementTagNameMap {
    "tc-histogram": TcHistogram;
  }
}
