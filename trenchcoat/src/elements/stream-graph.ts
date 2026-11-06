import { svg } from "lit";
import { property } from "lit/decorators.js";
import { fitTickLabels, thinLabels, txt } from "./internal/chart/axis";
import { AXIS_FONT, emphasisInk, TcChartElement, type ChartFrame, type ChartModel } from "./internal/chart/element";
import { makeTickFormatter } from "./internal/chart/format";
import { areaPath, nearestIndex, type Curve } from "./internal/chart/geometry";
import { resolveHighlight } from "./internal/chart/highlight";
import { extent, scaleLinear, timeTicks } from "./internal/chart/scale";
import { bucketSeries, prepSeries, type SeriesModel, type XType } from "./internal/chart/series";
import { insideOut, stack } from "./internal/chart/stack";
import { dodgeVertical, textWidth, truncate } from "./internal/chart/text";
import type { Accessor, Row, TooltipData } from "./internal/chart/types";

/*
 * <tc-stream-graph> – how several series flow and swell over time, stacked round a moving centre line rather than a
 * floor. Ported from ztd-charts' StreamGraph (MIT, © 2026 Junhan2). The series with the largest total takes the accent
 * (`highlight` picks others) and the rest are shades of the quiet ink; layers are reordered inside-out so early peaks
 * sit in the middle, and each is named beside its right end. Long series are averaged into buckets about two pixels
 * apart. Layers swell out of the centre line when the chart comes on screen and glide when the data changes.
 *   · one tab stop: arrows move along x, each step read with every series' value there
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-stream-graph heading="Compute hours" .data=${rows} x="week" y="hours" series="lab"></tc-stream-graph>
 */

/** A streamgraph: Lucide's "waves" (ISC, lucide.dev) */
const streamIcon = svg`<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path>`;

export type StreamOffset = "wiggle" | "silhouette";

type Layer = { s: number; name: string; top: number[]; bot: number[]; ink: string; shade: number; hi: boolean };

/**
 * Several series flowing over time as a streamgraph – one emphasised against shades of the quiet ink – with names
 * beside the layers' ends, every series read at the nearest x, and a table view.
 * @tag tc-stream-graph
 * @fires tc-view-change - The Table button was pressed ({ view }: ChartViewChange); cancelable – prevented, `view` stays as it was
 * @fires tc-mark-hover - The pointer or keyboard moved to an x, or off the chart ({ event }: ChartMarkHover)
 * @fires tc-mark-click - An x was clicked, or picked with Enter or Space ({ event }: ChartMarkClick)
 */
export class TcStreamGraph<T = Row> extends TcChartElement<Layer, T> {
  static override ui = "stm";

  /** The x field – dates ("2026-03"), numbers or categories; by default "x" */
  @property({ attribute: false }) accessor x: Accessor<T, unknown> | undefined = undefined;
  /** The value field; a list of fields draws each as a series (a wide table); by default "y" */
  @property({ attribute: false }) accessor y: Accessor<T, number> | string[] | undefined = undefined;
  /** The series field, for a long table with one row per x and series */
  @property({ attribute: false }) accessor series: Accessor<T, string> | undefined = undefined;
  /** What x is, when guessing from the values isn't right: "date", "number" or "band" */
  @property({ attribute: "x-type" }) accessor xType: XType | undefined = undefined;
  /** How layers bend between points: "smooth", "linear" or "step" */
  @property() accessor curve: Curve = "smooth";
  /** "wiggle" keeps the layers from swaying; "silhouette" centres them on a straight line */
  @property() accessor offset: StreamOffset = "wiggle";
  /** Reorders the layers inside-out (early peaks in the middle); `reorder="false"` keeps the data's order */
  @property({ converter: { fromAttribute: (v: string | null) => v !== "false" } }) accessor reorder = true;

  protected override readonly kind = "Streamgraph";
  protected override readonly icon = streamIcon;
  protected override defaultDuration = 1100;
  protected override stagger = 60;
  protected override modelKeys = ["x", "y", "series", "xType", "curve", "offset", "reorder"];

  private sm: SeriesModel<T> = { type: "band", keys: [], xnum: [], labels: [], series: [], values: [], rows: [] };
  private layers: Layer[] = [];
  private g = { top: 8, bottom: 22, x0: 4, x1: 0, endW: 0, xs: (_k: number) => 0, centers: [] as number[] };

  protected override defaultHeight(w: number) {
    return Math.max(200, Math.min(290, w * 0.48));
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

  protected override buildModel(f: ChartFrame): ChartModel<Layer, T> {
    const { width: W, height: H } = f;
    const model0 = prepSeries(this.data, this.x, this.y as never, this.series, { xType: this.xType, locale: f.locale });
    // More points than half the width are averaged into buckets (every layer keeps the same x)
    const model = bucketSeries(model0, Math.max(40, Math.round(W / 2)));
    this.sm = model;
    const nS = model.series.length;
    const order = this.reorder ? insideOut(model.values) : model.series.map((_, i) => i);
    const st = stack(
      order.map((s) => model.values[s]),
      this.offset,
    );
    const totals = model.values.map((r) => r.reduce((a, v) => a + (Number.isFinite(v) ? v : 0), 0));
    const hi = resolveHighlight(this.highlight as never, model.series as never[], model.series, totals, "max");

    const labels = !this.hideLabels && nS > 0;
    const endW = labels ? Math.min(W * 0.28, Math.max(...model.series.map((s) => textWidth(s, AXIS_FONT, 700)), 20) + 14) : 0;
    const top = 8;
    const bottom = 22;
    // Room for the first x label, centred under the left edge
    const x0 = Math.max(4, Math.ceil(textWidth(model.labels[0] ?? "", AXIS_FONT) / 2) + 2);
    const x1 = W - Math.max(4, endW);
    const all: number[] = [];
    st.y0.forEach((r) => r.forEach((v) => all.push(v)));
    st.y1.forEach((r) => r.forEach((v) => all.push(v)));
    const [lo, hiV] = extent(all.length ? all : [0, 1]);
    const y = scaleLinear([lo, hiV === lo ? lo + 1 : hiV], [H - bottom, top]);
    const xs = this.xScaleFor(model, x0, x1);
    const mid = y((lo + hiV) / 2);
    this.g = { top, bottom, x0, x1, endW, xs, centers: model.keys.map((_, k) => xs(k)) };

    // The quiet layers in shades of the rest ink, darkest first, so neighbours stay apart
    const rest = order.filter((s) => !hi.has(s));
    this.layers = order.map((s, li) => {
      const j = rest.indexOf(s);
      return {
        s,
        name: model.series[s],
        top: st.y1[li].map((v) => y(v)),
        bot: st.y0[li].map((v) => y(v)),
        ink: emphasisInk(hi.has(s)),
        shade: hi.has(s) || rest.length < 2 ? 1 : 1 - (0.55 * j) / (rest.length - 1),
        hi: hi.has(s),
      };
    });
    const marks = this.layers.map((L, k) => ({
      key: `l:${L.name}`,
      to: [...L.top, ...L.bot],
      from: [...L.top.map(() => mid), ...L.bot.map(() => mid)],
      delay: k * this.stagger,
      parts: [L.top.length, L.bot.length],
      data: L,
    }));

    const events = model.keys.map((key, k) => ({
      datum: null,
      index: k,
      key,
      label: model.labels[k],
      value: model.values.reduce((a, r) => a + (Number.isFinite(r[k]) ? r[k] : 0), 0),
      // A series with no value there isn't read as 0
      formatted: model.series
        .map((s, si) => (Number.isFinite(model.values[si][k]) ? `${s} ${f.fv(model.values[si][k])}` : null))
        .filter(Boolean)
        .join(", "),
    }));
    const summary = `${nS} series (${model.series.join(", ")}), from ${model.labels[0] ?? ""} to ${model.labels[model.labels.length - 1] ?? ""}, ${model.keys.length} points`;
    return { marks, events, summary };
  }

  protected override plotMove(x: number, _y: number, e: PointerEvent) {
    const k = nearestIndex(this.g.centers, x);
    if (k >= 0) this.setActive(k, e.pointerType === "touch" ? "touch" : "pointer");
  }

  protected override tip(k: number, f: ChartFrame): TooltipData | null {
    const model = this.sm;
    if (model.keys[k] === undefined) return null;
    const rows = this.layers
      .map((L) => ({ L, v: model.values[L.s][k] }))
      .filter((r) => Number.isFinite(r.v))
      .sort((a, b) => b.v - a.v)
      .slice(0, 8)
      .map((r) => ({ label: r.L.name, value: f.fv(r.v), color: r.L.ink, strong: r.L.hi }));
    return { x: this.g.xs(k), y: Math.max(this.g.top, Math.min(...this.layers.map((L) => L.top[k]))), title: model.labels[k], rows };
  }

  protected override tableHeader() {
    return "x";
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
      const [a, b] = extent(model.xnum);
      const sx = scaleLinear([a, b], [x0, x1]);
      const xf = a >= 1000 && b <= 9999 ? String : makeTickFormatter(undefined, f.locale, Math.max(-a, b));
      ticks = sx.ticks(Math.max(2, Math.floor((x1 - x0) / 70))).map((v) => ({ x: sx(v), label: xf(v) }));
    } else ticks = thinLabels(centers, model.labels).map((k) => ({ x: xs(k), label: model.labels[k] }));
    return svg`<g>${fitTickLabels(ticks, -2, f.width + 2).map((t) => txt(t.x, f.height - bottom + 13, t.label, { anchor: "middle" }))}</g>`;
  }

  protected override draw(f: ChartFrame) {
    const { height: H } = f;
    const { top, bottom, x0, x1, endW, xs } = this.g;
    const m = this.motion;
    const k = this.active;
    const layers = m.items.map((it) => {
      const L = it.data;
      const n = L.top.length;
      const t = it.v.slice(0, n);
      const b = it.v.slice(n, 2 * n);
      const topPts = t.map((v, i) => [xs(i), v] as [number, number]);
      const botPts = b.map((v, i) => [xs(i), v] as [number, number]);
      return svg`<path class="ui-stm__layer" ?data-hi=${L.hi} d=${areaPath(topPts, botPts, this.curve)}
        style=${`fill: ${L.ink}; fill-opacity: ${L.shade.toFixed(2)}`} opacity=${it.exiting ? 0.4 : 1}></path>`;
    });
    // Each layer named beside its right end, at its middle there; nudged apart so none overlap
    let names: unknown = null;
    if (!this.hideLabels && endW > 0 && this.layers.length) {
      const fade = m.fade((this.duration ?? this.defaultDuration) * 0.7, 300);
      const ys = dodgeVertical(
        this.layers.map((L) => (L.top[L.top.length - 1] + L.bot[L.bot.length - 1]) / 2),
        14,
        top + 4,
        H - bottom - 2,
      );
      names = this.layers.map((L, i) => txt(x1 + 8, ys[i], truncate(L.name, endW - 10, AXIS_FONT, L.hi ? 700 : 500), { cls: "value", strong: L.hi, opacity: fade }));
    }
    return svg`
      <rect class="tc-chart__hit" x=${x0} y=${top} width=${Math.max(0, x1 - x0)} height=${Math.max(0, H - bottom - top)}></rect>
      ${layers}
      ${k !== null && this.sm.keys[k] !== undefined ? svg`<line class="ui-stm__cursor" x1=${xs(k)} x2=${xs(k)} y1=${top} y2=${H - bottom}></line>` : null}
      ${names}
      ${this.xAxis(f)}`;
  }

  static override css = /* css */ `
/* Layers are parted by a line of the card's colour */
.ui-stm__layer { stroke: var(--tc-plot-bg); stroke-width: 1; stroke-linejoin: round; }
.ui-stm__cursor { stroke: var(--tc-plot-focus); stroke-width: 1; opacity: 0.55; pointer-events: none; }
@media (forced-colors: active) {
  .ui-stm__layer { forced-color-adjust: none; }
  .ui-stm__cursor { stroke: Highlight; opacity: 1; }
}
`;
}

if (!customElements.get("tc-stream-graph")) customElements.define("tc-stream-graph", TcStreamGraph);

declare global {
  interface HTMLElementTagNameMap {
    "tc-stream-graph": TcStreamGraph;
  }
}
