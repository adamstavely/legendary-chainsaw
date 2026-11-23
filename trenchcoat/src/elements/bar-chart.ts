import { html, nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { axisXBand, gridX, gridY, thinLabels, txt, yAxisWidth } from "./internal/chart/axis";
import { numGetter } from "./internal/chart/accessor";
import { changeRatio, signedPercent } from "./internal/chart/brush";
import { AXIS_FONT, categoricalInk, emphasisInk, TcChartElement, type ChartFrame, type ChartModel } from "./internal/chart/element";
import { makeTickFormatter } from "./internal/chart/format";
import { roundRectPath } from "./internal/chart/geometry";
import { resolveHighlight } from "./internal/chart/highlight";
import { extent, fitDomain, scaleBand, scaleLinear } from "./internal/chart/scale";
import { prepSeries, type SeriesModel } from "./internal/chart/series";
import { stack } from "./internal/chart/stack";
import { textWidth, truncate } from "./internal/chart/text";
import type { Accessor, Row, TooltipData } from "./internal/chart/types";

/*
 * <tc-bar-chart> – values by category as bars: one series, or several grouped side by side, stacked, or stacked to
 * 100%; upright or lying down. Ported from ztd-charts' BarChart (MIT, © 2026 Junhan2). With one series the highest bar
 * takes the accent and the rest stay quiet (`highlight` picks others); several series take the chart inks in order,
 * named in a legend. Values sit at the bars' ends, thinned when they'd overlap. Bars grow in from the baseline when the
 * chart comes on screen and glide when the data changes.
 *   · `compare` (one series): last period's value – a dashed open box above the bar where it was higher, a dashed line
 *     across the bar where it was lower – and the change in the tooltip
 *   · `live`: the last bar is still filling – today's usage – so it breathes, its value reads "so far", and as the page
 *     raises it the bar grows into its new height
 *   · `sync` (on every chart): charts with the same name follow each other's pointer, matched by category
 *   · one tab stop: arrows move bar to bar, each read with its category, series and value
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-bar-chart heading="Reviews closed" .data=${[{ x: "Mon", y: 12 }, { x: "Tue", y: 18 }]}></tc-bar-chart>
 */

/** A bar chart: Lucide (ISC, lucide.dev) */
const barIcon = svg`<path d="M3 3v16a2 2 0 0 0 2 2h16"></path><path d="M18 17V9"></path><path d="M13 17V5"></path><path d="M8 17v-3"></path>`;

export type BarLayout = "grouped" | "stacked" | "percent";
export type BarOrientation = "vertical" | "horizontal";

type Seg = { key: string; k: number; s: number; cat: string; series: string; value: number; v0: number; v1: number; ink: string; hi: boolean; prev?: number; live?: boolean };

/**
 * Values by category as bars – grouped, stacked or stacked to 100%, upright or lying down – with the highest one
 * emphasised, values at the bars' ends and a table view.
 * @tag tc-bar-chart
 * @fires tc-view-change - The Table button was pressed ({ view }: ChartViewChange); cancelable – prevented, `view` stays as it was
 * @fires tc-mark-hover - The pointer or keyboard moved to a bar, or off them ({ event }: ChartMarkHover)
 * @fires tc-mark-click - A bar was clicked, or picked with Enter or Space ({ event }: ChartMarkClick)
 */
export class TcBarChart<T = Row> extends TcChartElement<Seg, T> {
  static override ui = "brc";

  /** The category field (also for lying-down bars); by default "x" */
  @property({ attribute: false }) accessor x: Accessor<T, string> | undefined = undefined;
  /** The value field; a list of fields draws each as a series (a wide table); by default "y" */
  @property({ attribute: false }) accessor y: Accessor<T, number> | string[] | undefined = undefined;
  /** The series field, for a long table with one row per category and series */
  @property({ attribute: false }) accessor series: Accessor<T, string> | undefined = undefined;
  /** Several series side by side ("grouped"), on top of each other ("stacked") or stacked to 100% ("percent") */
  @property() accessor layout: BarLayout = "grouped";
  /** Upright bars ("vertical") or lying down ("horizontal") */
  @property() accessor orientation: BarOrientation = "vertical";
  /** Orders one series' bars from the largest */
  @property({ type: Boolean }) accessor sort = false;
  /** A fixed value range, [low, high], to compare several charts on one scale; keep 0 inside it. Not for "percent" */
  @property({ attribute: false }) accessor yDomain: [number, number] | undefined = undefined;
  /** Last period's value for each category – one series – drawn dashed above or across its bar, with the change in the tooltip */
  @property({ attribute: false }) accessor compare: Accessor<T, number> | undefined = undefined;
  /** What last period is called (default "Last period") */
  @property({ attribute: "compare-label" }) accessor compareLabel = "Last period";
  /** The last category is still counting – today: its bar breathes and its value reads "so far" */
  @property({ type: Boolean }) accessor live = false;
  /** The words after a live value (default "so far") */
  @property({ attribute: "live-label" }) accessor liveLabel = "so far";

  protected override readonly kind = "Bar chart";
  protected override readonly icon = barIcon;
  protected override defaultDuration = 750;
  protected override stagger = 60;
  protected override modelKeys = ["x", "y", "series", "layout", "orientation", "sort", "yDomain", "compare", "compareLabel", "live", "liveLabel"];

  private sm: SeriesModel<T> = { type: "band", keys: [], xnum: [], labels: [], series: [], values: [], rows: [] };
  private segs: Seg[] = [];
  private hiSet: ReadonlySet<number> = new Set();
  private geo = {
    left: 0,
    top: 0,
    bottom: 0,
    x0: 0,
    x1: 0,
    catW: 0,
    r: 0,
    ticks: [] as number[],
    tickFmt: ((v: number) => String(v)) as (v: number) => string,
    band: scaleBand([], [0, 1]),
    inner: null as ReturnType<typeof scaleBand> | null,
    v: scaleLinear([0, 1], [0, 1]),
    shown: null as Set<number> | null,
    showValues: false,
  };

  protected override defaultHeight(w: number) {
    return this.orientation === "horizontal" ? Math.max(180, Math.min(320, w * 0.5)) : Math.max(200, Math.min(290, w * 0.52));
  }

  private get horizontal() {
    return this.orientation === "horizontal";
  }

  private valueText(sg: Seg, f: ChartFrame) {
    return this.layout === "percent" ? f.pct(sg.v1 - sg.v0) : f.fmt(sg.value);
  }

  protected override buildModel(f: ChartFrame): ChartModel<Seg, T> {
    const { width: W, height: H } = f;
    const horizontal = this.horizontal;
    const layout = this.layout;
    let model = prepSeries(this.data, this.x, this.y as never, this.series, { xType: "band", locale: f.locale });
    if (this.sort && model.series.length === 1) {
      const m = model;
      const idx = m.keys.map((_, k) => k).sort((a, b) => (m.values[0][b] || 0) - (m.values[0][a] || 0));
      model = { ...m, keys: idx.map((k) => m.keys[k]), labels: idx.map((k) => m.labels[k]), xnum: idx.map((_, i) => i), values: [idx.map((k) => m.values[0][k])], rows: [idx.map((k) => m.rows[0][k])] };
    }
    this.sm = model;
    const nS = model.series.length;
    const single = nS === 1;
    // One series: the highest bar by default. Several: the inks in order, unless the page picked one to emphasise
    const hi = single
      ? resolveHighlight(this.highlight, model.rows[0] as T[], model.labels, model.values[0] ?? [], "max")
      : this.highlight !== undefined
        ? resolveHighlight(this.highlight as never, model.series as never[], model.series, model.values.map((r) => r.reduce((a, v) => a + (Number.isFinite(v) ? v : 0), 0)), "first")
        : null;
    this.hiSet = hi ?? new Set();
    const segs: Seg[] = [];
    const gc = single && this.compare !== undefined ? numGetter(this.compare, "compare") : null;
    const lastK = model.keys.length - 1;
    const st = layout === "grouped" ? null : stack(model.values, layout === "percent" ? "expand" : "zero");
    model.keys.forEach((cat, k) => {
      model.series.forEach((s, si) => {
        const v = model.values[si][k];
        if (!Number.isFinite(v)) return;
        const isHi = single ? !!hi?.has(k) : !!hi?.has(si);
        const ink = single || hi ? emphasisInk(isHi) : categoricalInk(si);
        const row = model.rows[si]?.[k];
        const prev = gc && row ? gc(row, k) : NaN;
        segs.push({ key: `${cat}|${s}`, k, s: si, cat: model.labels[k], series: s, value: v, v0: st ? st.y0[si][k] : 0, v1: st ? st.y1[si][k] : v, ink, hi: isHi, prev: Number.isFinite(prev) ? prev : undefined, live: this.live && k === lastK && !this.sort });
      });
    });
    this.segs = segs;

    const vals = segs.flatMap((s) => (s.prev !== undefined ? [s.v0, s.v1, s.prev] : [s.v0, s.v1]));
    const [mn, mx] = extent(vals.length ? vals : [0, 1]);
    const dom: [number, number] = layout === "percent" ? [0, 100] : this.yDomain ?? fitDomain(mn, mx, horizontal ? Math.max(2, Math.round(W / 120)) : Math.max(2, Math.round(H / 70)));
    const tickFmt = layout === "percent" ? (v: number) => `${v}%` : makeTickFormatter(this.format, f.locale, Math.max(Math.abs(dom[0]), Math.abs(dom[1])));
    const showValues = !this.hideLabels && (single || layout !== "grouped" || nS <= 3);
    const catW = horizontal ? Math.min(W * 0.32, Math.max(...model.labels.map((l) => textWidth(l, AXIS_FONT, 600)), 24) + 10) : 0;
    const valPad = horizontal && showValues && layout !== "percent" ? Math.max(...segs.map((s) => textWidth(this.valueText(s, f), AXIS_FONT, 700)), 0) + 10 : 0;
    const ticks = scaleLinear(dom, [0, 1]).ticks(horizontal ? Math.max(2, Math.round(W / 130)) : Math.max(2, Math.round(H / 70)));
    const left = horizontal ? catW + 6 : yAxisWidth(ticks, tickFmt, f.locale);
    const top = horizontal ? 4 : showValues ? 16 : 8;
    const bottom = horizontal ? 18 : 22;
    // Upright negative values are written under the bar's end: room under the lowest one
    const negPad = !horizontal && showValues && mn < 0 && (single || layout === "grouped") ? 16 : 0;
    const x0 = horizontal ? left : left + 4;
    const x1 = horizontal ? W - Math.max(8, valPad) : W - 2;
    const band = horizontal ? scaleBand(model.keys, [top, H - bottom], 0.3, 0.12) : scaleBand(model.keys, [x0, x1], nS > 1 && layout === "grouped" ? 0.24 : 0.32, 0.12);
    const v = horizontal ? scaleLinear(dom, [x0, x1]) : scaleLinear(dom, [H - bottom - negPad, top]);
    const inner = layout === "grouped" && nS > 1 ? scaleBand(model.series, [0, band.bandwidth], 0.12, 0) : null;
    const r = Math.min(4, (inner ? inner.bandwidth : band.bandwidth) / 4);
    // One series' upright values: thinned when wider than their bars, keeping the emphasised one
    const shown =
      single && !horizontal && showValues
        ? new Set(thinLabels(segs.map((sg) => band(model.keys[sg.k]) + band.bandwidth / 2), segs.map((sg) => this.valueText(sg, f)), AXIS_FONT, 4, 500, new Set(segs.flatMap((sg, j) => (sg.hi ? [j] : [])))))
        : null;
    this.geo = { left, top, bottom, x0, x1, catW, r, ticks, tickFmt, band, inner, v, shown, showValues };

    const base = v(Math.max(dom[0], Math.min(0, dom[1])));
    const marks = segs.map((sg) => {
      const g = this.geom(sg);
      return {
        key: sg.key,
        to: [g.pos, g.th, g.a, g.b],
        from: [g.pos, g.th, layout === "grouped" ? base : g.a, layout === "grouped" ? base : g.a],
        enter: [g.pos, g.th, g.a, g.a],
        delay: sg.k * this.stagger + sg.s * (layout === "grouped" ? 30 : 70),
        data: sg,
      };
    });
    const events = segs.map((sg, i) => ({
      datum: (model.rows[sg.s]?.[sg.k] as T) ?? null,
      index: i,
      key: sg.key,
      label: sg.cat,
      series: nS > 1 ? sg.series : undefined,
      value: sg.value,
      formatted: `${f.fv(sg.value)}${sg.live ? ` ${this.liveLabel}` : ""}${layout === "percent" ? ` (${f.pct(sg.v1 - sg.v0)})` : ""}${sg.prev !== undefined ? `, ${this.compareLabel.toLowerCase()} ${f.fv(sg.prev)}${this.change(sg, f, ", ")}` : ""}`,
    }));
    const summary = single ? model.labels.map((l, k) => `${l} ${f.fv(model.values[0][k])}${this.live && k === lastK && !this.sort ? ` ${this.liveLabel}` : ""}`).join(", ") : `${model.keys.length} categories, ${nS} series: ${model.series.join(", ")}`;
    return { marks, events, summary };
  }

  /** " · +15.1%": how a bar changed since last period */
  private change(sg: Seg, f: ChartFrame, sep = " · ") {
    const r = sg.prev === undefined ? null : changeRatio(sg.prev, sg.value);
    return r === null ? "" : `${sep}${signedPercent(r, f.locale)}`;
  }

  /** Bars follow other charts by category, whichever series is pointed at */
  protected override syncPoint(i: number) {
    const sg = this.segs[i];
    return sg ? { key: this.sm.keys[sg.k] ?? sg.cat, label: sg.cat } : null;
  }

  private geom(sg: Seg) {
    const { band, inner, v } = this.geo;
    return { pos: band(this.sm.keys[sg.k]) + (inner ? inner(sg.series) : 0), th: inner ? inner.bandwidth : band.bandwidth, a: v(sg.v0), b: v(sg.v1) };
  }

  protected override tip(i: number, f: ChartFrame): TooltipData | null {
    const sg = this.segs[i];
    if (!sg) return null;
    const model = this.sm;
    const g = this.geom(sg);
    const rows =
      model.series.length > 1
        ? model.series.map((s, si) => {
            const val = model.values[si][sg.k];
            const ink = this.segs.find((o) => o.k === sg.k && o.s === si)?.ink;
            return { label: s, value: Number.isFinite(val) ? f.fv(val) : "–", color: ink, strong: si === sg.s };
          })
        : [
            { label: this.words.value, value: `${f.fv(sg.value)}${sg.live ? ` ${this.liveLabel}` : ""}${this.change(sg, f)}`, color: sg.ink },
            ...(sg.prev !== undefined ? [{ label: this.compareLabel, value: f.fv(sg.prev), color: "var(--tc-plot-line-rest)" }] : []),
          ];
    return this.horizontal ? { x: Math.max(g.a, g.b), y: g.pos, title: sg.cat, rows } : { x: g.pos + g.th / 2, y: Math.min(g.a, g.b), title: sg.cat, rows };
  }

  protected override headerLegend() {
    const model = this.sm;
    if (model.series.length < 2) return nothing;
    return html`<ul class="tc-chart__legend" aria-label="Series">
      ${model.series.map((s, si) => {
        const ink = this.segs.find((o) => o.s === si)?.ink ?? categoricalInk(si);
        return html`<li class="tc-chart__key"><span class="tc-chart__swatch" aria-hidden="true" style=${`background: ${ink}`}></span>${s}</li>`;
      })}
    </ul>`;
  }

  protected override draw(f: ChartFrame) {
    const { width: W, height: H } = f;
    const { left, top, bottom, x0, x1, catW, r, ticks, tickFmt, band, v, shown, showValues } = this.geo;
    const horizontal = this.horizontal;
    const layout = this.layout;
    const model = this.sm;
    const nS = model.series.length;
    const index = new Map(this.segs.map((sg, i) => [sg.key, i]));
    const m = this.motion;
    return svg`
      ${horizontal ? gridX({ ticks, x: v, y0: top, y1: H - bottom, fmt: tickFmt, locale: f.locale }) : gridY({ ticks, y: v, x0: left, x1: W, fmt: tickFmt, locale: f.locale })}
      ${m.items.map((it) => {
        const sg = it.data;
        const [pos, th, a, b] = it.v;
        const i = index.get(sg.key) ?? 0;
        const neg = sg.v1 < sg.v0 || sg.value < 0;
        const topOfStack = layout === "grouped" || sg.s === nS - 1;
        const corners = horizontal ? (topOfStack ? (neg ? { tl: r, bl: r } : { tr: r, br: r }) : {}) : topOfStack ? (neg ? { bl: r, br: r } : { tl: r, tr: r }) : {};
        const d = horizontal ? roundRectPath(Math.min(a, b), pos, Math.abs(b - a), th, corners) : roundRectPath(pos, Math.min(a, b), th, Math.abs(b - a), corners);
        const lo = m.fade(sg.k * this.stagger + 320, 260);
        // Last period: where it was higher, a dashed open box above the bar up to its value; where it was lower, a
        // dashed line across the bar at its value
        let ghost: unknown = nothing;
        let over: unknown = nothing;
        let reach = b;
        if (sg.prev !== undefined) {
          const pb = v(sg.prev);
          const end = b;
          const beyond = horizontal ? pb > end + 0.5 : pb < end - 0.5;
          if (beyond) {
            reach = pb;
            const d0 = horizontal
              ? `M${end},${pos} H${pb - r} Q${pb},${pos} ${pb},${pos + r} V${pos + th - r} Q${pb},${pos + th} ${pb - r},${pos + th} H${end}`
              : `M${pos},${end} V${pb + r} Q${pos},${pb} ${pos + r},${pb} H${pos + th - r} Q${pos + th},${pb} ${pos + th},${pb + r} V${end}`;
            ghost = svg`<path class="ui-brc__prev" d=${d0} opacity=${lo}></path>`;
          } else {
            over = horizontal
              ? svg`<line class="ui-brc__prev" data-inside x1=${pb} x2=${pb} y1=${pos + 1} y2=${pos + th - 1} opacity=${lo}></line>`
              : svg`<line class="ui-brc__prev" data-inside x1=${pos + 1} x2=${pos + th - 1} y1=${pb} y2=${pb} opacity=${lo}></line>`;
          }
        }
        let label: unknown = nothing;
        if (showValues && (layout === "grouped" || nS === 1)) {
          const text = this.valueText(sg, f);
          const tw = textWidth(text, AXIS_FONT, 700);
          if (horizontal) label = txt(Math.max(a, b, reach) + 6, pos + th / 2, text, { cls: "value", strong: sg.hi, opacity: lo });
          else if (nS === 1 ? !shown || shown.has(i) : th >= tw * 0.8) label = txt(pos + th / 2, neg ? Math.max(a, b) + 8 : Math.min(a, b, reach) - 8, text, { cls: "value", anchor: "middle", strong: sg.hi, opacity: lo });
        }
        const focus = this.active === i && this.via === "keyboard";
        const h = this.hover(i);
        return svg`<g class="tc-chart__mark" opacity=${it.exiting ? 0.4 : this.dim(i)} @pointerenter=${h.enter} @click=${h.click}>
          ${layout === "grouped" || nS === 1
            ? horizontal
              ? svg`<rect class="tc-chart__hit" x=${x0} y=${pos} width=${Math.max(0, x1 - x0)} height=${th}></rect>`
              : svg`<rect class="tc-chart__hit" x=${pos} y=${top} width=${th} height=${Math.max(0, H - bottom - top)}></rect>`
            : nothing}
          ${ghost}
          <path class="ui-brc__bar" d=${d} style=${`fill: ${sg.ink}`} ?data-stacked=${layout !== "grouped" && nS > 1} ?data-live=${!!sg.live}></path>
          ${over}
          ${focus ? svg`<path class="tc-chart__focus" d=${horizontal ? roundRectPath(Math.min(a, b) - 2, pos - 2, Math.abs(b - a) + 4, th + 4, 4) : roundRectPath(pos - 2, Math.min(a, b) - 2, th + 4, Math.abs(b - a) + 4, 4)}></path>` : nothing}
          ${label}
        </g>`;
      })}
      ${horizontal
        ? svg`<g>${model.keys.map((key, k) => {
            const strong = nS === 1 && this.hiSet.has(k);
            return txt(catW, band(key) + band.bandwidth / 2, truncate(model.labels[k], catW - 4, AXIS_FONT, strong ? 700 : 500), { anchor: "end", strong });
          })}</g>`
        : axisXBand({ labels: model.labels, centers: model.keys.map((key) => band(key) + band.bandwidth / 2), y: H - bottom + 13, strong: nS === 1 ? this.hiSet : undefined })}`;
  }

  static override css = /* css */ `
/* Stacked segments are parted by a line of the card's colour */
.ui-brc__bar[data-stacked] { stroke: var(--tc-plot-bg); stroke-width: 1; }
/* Last period: dashed, above the bar where it was higher, across it where it was lower */
.ui-brc__prev { fill: none; stroke: var(--tc-plot-line-rest); stroke-width: 1.4; stroke-dasharray: 3 3; }
.ui-brc__prev[data-inside] { stroke: var(--tc-plot-bg); stroke-width: 1.6; }
/* Today's bar is still filling: it breathes */
.ui-brc__bar[data-live] { animation: tc-brc-live var(--tc-duration-shimmer) var(--tc-ease-standard) infinite; }
@keyframes tc-brc-live { 50% { opacity: 0.62; } }
@media (prefers-reduced-motion: reduce) {
  .ui-brc__bar[data-live] { animation: none; opacity: 0.8; }
}
@media (forced-colors: active) {
  .ui-brc__bar { forced-color-adjust: none; }
}
`;
}

if (!customElements.get("tc-bar-chart")) customElements.define("tc-bar-chart", TcBarChart);

declare global {
  interface HTMLElementTagNameMap {
    "tc-bar-chart": TcBarChart;
  }
}
