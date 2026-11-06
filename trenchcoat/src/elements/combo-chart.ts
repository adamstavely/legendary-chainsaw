import { html, nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { axisXBand, gridY, tickLabels, txt, yAxisWidth } from "./internal/chart/axis";
import { categoricalInk, emphasisInk, TcChartElement, type ChartFrame, type ChartModel } from "./internal/chart/element";
import { makeFormatter, makeTickFormatter, type FormatSpec, type ValueFormatter } from "./internal/chart/format";
import { linePath, nearestIndex, roundRectPath, type Curve } from "./internal/chart/geometry";
import { extent, fitDomain, scaleBand, scaleLinear } from "./internal/chart/scale";
import { prepSeries, type SeriesModel } from "./internal/chart/series";
import { stack } from "./internal/chart/stack";
import type { Accessor, Row, TooltipData } from "./internal/chart/types";

/*
 * <tc-combo-chart> – bars and lines over one shared x: volumes as bars (grouped side by side, or stacked) and rates or
 * averages as lines with a dot at each category, on the same axis or – when their ranges are far apart – a second one
 * at the right. With one bar series and one line the bars stay quiet and the line takes the accent; more series take
 * the chart inks in order, bars first. The legend draws bars as squares and lines as strokes, and names the axis a
 * line is read against. Bars grow from the baseline when the chart comes on screen, then the lines draw in; both glide
 * when the data changes.
 *   · one tab stop: arrows move along x, each step read with every series' value there
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-combo-chart heading="Samples and turnaround" .data=${rows} .bars=${["samples"]} .lines=${["hours"]}></tc-combo-chart>
 */

/** Bars with a line over them, drawn in the Lucide style (24 × 24, 2px strokes) */
const comboIcon = svg`<path d="M3 3v16a2 2 0 0 0 2 2h16"></path><path d="M8 17v-4"></path><path d="M13 17v-6"></path><path d="M18 17v-8"></path><path d="m6 9 5-3 4 2 5-4"></path>`;

export type ComboLineAxis = "left" | "right";

/** The words a combo chart adds to the shared ones */
export type ComboChartLabels = {
  /** After a line's name in the legend, when it's read against the right axis */
  rightAxis: string;
  /** After a series' name in the legend, when there are two axes and it's read against the left one */
  leftAxis: string;
};
export const defaultComboChartLabels: ComboChartLabels = { rightAxis: "(right axis)", leftAxis: "(left axis)" };

type BarSeg = { kind: "bar"; key: string; k: number; s: number; value: number; v0: number; v1: number; ink: string };
type LineDraw = { kind: "line"; key: string; s: number; xs: number[]; ink: string; hi: boolean };
type ComboMark = BarSeg | LineDraw;

/**
 * Bars and lines over one shared x – grouped or stacked bars, lines with dots – with an optional second axis at the
 * right for the lines, a legend that tells bars from lines without colour, and a table view.
 * @tag tc-combo-chart
 * @fires tc-view-change - The Table button was pressed ({ view }: ChartViewChange); cancelable – prevented, `view` stays as it was
 * @fires tc-mark-hover - The pointer or keyboard moved to an x, or off them ({ event }: ChartMarkHover)
 * @fires tc-mark-click - An x was clicked, or picked with Enter or Space ({ event }: ChartMarkClick)
 */
export class TcComboChart<T = Row> extends TcChartElement<ComboMark, T> {
  static override ui = "cmb";

  /** The x field – categories or dates, each drawn as a band; by default "x" */
  @property({ attribute: false }) accessor x: Accessor<T, unknown> | undefined = undefined;
  /** The fields drawn as bars, in order */
  @property({ attribute: false }) accessor bars: string[] = [];
  /** The fields drawn as lines, in order */
  @property({ attribute: false }) accessor lines: string[] = [];
  /** Display names for the fields; a field without one is shown as it is */
  @property({ attribute: false }) accessor seriesLabels: Record<string, string> = {};
  /** Stacks several bar series instead of setting them side by side */
  @property({ type: Boolean }) accessor stacked = false;
  /** The axis the lines are read against; by default the right one when their range is far from the bars' */
  @property({ attribute: "line-axis" }) accessor lineAxis: ComboLineAxis | undefined = undefined;
  /** How the lines' values are written, as `format`; by default `format` when they share the left axis */
  @property({ attribute: false }) accessor lineFormat: FormatSpec | undefined = undefined;
  /** The unit after each line value: "h", "%"; by default `unit` when they share the left axis */
  @property({ attribute: "line-unit" }) accessor lineUnit: string | undefined = undefined;
  /** How lines bend between points: "smooth", "linear" or "step" */
  @property() accessor curve: Curve = "linear";
  /** The left axis' title, above it: "Samples" */
  @property({ attribute: "y-label" }) accessor yLabel: string | undefined = undefined;
  /** The right axis' title, above it: "Hours" */
  @property({ attribute: "y2-label" }) accessor y2Label: string | undefined = undefined;
  /** The combo chart's own words, merged over defaultComboChartLabels */
  @property({ attribute: false }) accessor comboLabels: Partial<ComboChartLabels> = {};

  protected override readonly kind = "Combo chart";
  protected override readonly icon = comboIcon;
  protected override defaultDuration = 800;
  protected override stagger = 50;
  protected override modelKeys = ["x", "bars", "lines", "seriesLabels", "stacked", "lineAxis", "lineFormat", "lineUnit", "curve", "yLabel", "y2Label", "comboLabels"];

  private sm: SeriesModel<T> = { type: "band", keys: [], xnum: [], labels: [], series: [], values: [], rows: [] };
  private nb = 0;
  private inks: string[] = [];
  private right = false;
  private lfv: ValueFormatter = String;
  private geo = {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    x0: 0,
    x1: 0,
    r: 0,
    ticks: [] as number[],
    tickFmt: String as ValueFormatter,
    ticks2: [] as number[],
    tickFmt2: String as ValueFormatter,
    band: scaleBand([], [0, 1]),
    inner: null as ReturnType<typeof scaleBand> | null,
    y: scaleLinear([0, 1], [0, 1]),
    y2: scaleLinear([0, 1], [0, 1]),
    centers: [] as number[],
  };

  private get comboWords(): ComboChartLabels {
    return { ...defaultComboChartLabels, ...this.comboLabels };
  }

  /** A field's display name */
  private nameOf(field: string) {
    return this.seriesLabels[field] ?? field;
  }

  protected override defaultHeight(w: number) {
    return Math.max(200, Math.min(300, w * 0.52));
  }

  protected override tableHeader() {
    return "Category";
  }

  /** Series s's value at k, written for its axis */
  private valueText(s: number, v: number, f: ChartFrame) {
    return s < this.nb ? f.fv(v) : this.lfv(v);
  }

  protected override buildModel(f: ChartFrame): ChartModel<ComboMark, T> {
    const { width: W, height: H } = f;
    const bars = this.bars.filter((b, i, a) => a.indexOf(b) === i);
    const lines = this.lines.filter((l, i, a) => a.indexOf(l) === i && !bars.includes(l));
    const fields = [...bars, ...lines];
    const model = fields.length ? prepSeries(this.data, this.x, fields, undefined, { locale: f.locale }) : { ...this.sm, keys: [], labels: [], values: [], rows: [] };
    this.sm = model;
    const nb = bars.length;
    const nl = lines.length;
    this.nb = nb;
    const nS = nb + nl;
    // One bar series against one line: the line is the point; otherwise every series its own ink, bars first
    const pair = nb === 1 && nl === 1;
    this.inks = fields.map((_, s) => (nS === 1 ? emphasisInk(true) : pair ? emphasisInk(s === 1) : categoricalInk(s)));

    const barVals = model.values.slice(0, nb);
    const lineVals = model.values.slice(nb);
    const stacked = this.stacked && nb > 1;
    const st = stacked ? stack(barVals, "zero") : null;
    const barAll = st ? st.y1.flat().concat(st.y0.flat()) : barVals.flat().filter(Number.isFinite);
    const lineAll = lineVals.flat().filter(Number.isFinite);
    const [bMin, bMax] = extent(barAll.length ? barAll : [0, 1]);
    const [lMin, lMax] = extent(lineAll.length ? lineAll : [0, 1]);
    // Far-apart ranges (more than 3×) read better against their own axis
    const bSpan = Math.max(Math.abs(bMin), Math.abs(bMax));
    const lSpan = Math.max(Math.abs(lMin), Math.abs(lMax));
    const apart = bSpan > 0 && lSpan > 0 && (bSpan / lSpan > 3 || lSpan / bSpan > 3);
    const right = nl > 0 && nb > 0 && (this.lineAxis ? this.lineAxis === "right" : apart);
    this.right = right;
    const count = Math.max(2, Math.round(H / 70));
    const leftVals = right || !nl ? (nb ? [bMin, bMax] : [lMin, lMax]) : nb ? [bMin, bMax, lMin, lMax] : [lMin, lMax];
    const [d0, d1] = extent(leftVals);
    const dom = fitDomain(d0, d1, count, { zero: nb > 0 });
    const dom2 = right ? fitDomain(lMin, lMax, count) : dom;
    const fmt = makeFormatter(this.format, f.locale);
    const lfmt = this.lineFormat !== undefined || right ? makeFormatter(this.lineFormat ?? this.format, f.locale) : fmt;
    const lunit = this.lineUnit ?? (right ? "" : this.unit);
    this.lfv = this.lineFormat === undefined && this.lineUnit === undefined && !right ? f.fv : (v) => `${lfmt(v)}${lunit}`;

    const tickFmt = makeTickFormatter(this.format, f.locale, Math.max(Math.abs(dom[0]), Math.abs(dom[1])));
    const tickFmt2 = right ? makeTickFormatter(this.lineFormat ?? this.format, f.locale, Math.max(Math.abs(dom2[0]), Math.abs(dom2[1]))) : tickFmt;
    const ticks = scaleLinear(dom, [0, 1]).ticks(count);
    const ticks2 = right ? scaleLinear(dom2, [0, 1]).ticks(count) : [];
    const left = yAxisWidth(ticks, tickFmt, f.locale);
    const rightW = right ? yAxisWidth(ticks2, tickFmt2, f.locale) : 4;
    const top = this.yLabel || this.y2Label ? 22 : 10;
    const bottom = 22;
    const x0 = left + 4;
    const x1 = W - rightW;
    const band = scaleBand(model.keys, [x0, x1], nb > 1 && !stacked ? 0.24 : 0.32, 0.12);
    const inner = nb > 1 && !stacked ? scaleBand(bars, [0, band.bandwidth], 0.12, 0) : null;
    const y = scaleLinear(dom, [H - bottom, top]);
    const y2 = right ? scaleLinear(dom2, [H - bottom, top]) : y;
    const centers = model.keys.map((key) => band(key) + band.bandwidth / 2);
    const r = Math.min(4, (inner ? inner.bandwidth : band.bandwidth) / 4);
    this.geo = { left, right: rightW, top, bottom, x0, x1, r, ticks, tickFmt, ticks2, tickFmt2, band, inner, y, y2, centers };

    const base = y(Math.max(dom[0], Math.min(0, dom[1])));
    const marks: ChartModel<ComboMark, T>["marks"] = [];
    model.keys.forEach((key, k) => {
      for (let s = 0; s < nb; s++) {
        const v = barVals[s][k];
        if (!Number.isFinite(v)) continue;
        const seg: BarSeg = { kind: "bar", key: `b:${key}|${bars[s]}`, k, s, value: v, v0: st ? st.y0[s][k] : 0, v1: st ? st.y1[s][k] : v, ink: this.inks[s] };
        const pos = band(key) + (inner ? inner(bars[s]) : 0);
        const th = inner ? inner.bandwidth : band.bandwidth;
        const a = y(seg.v0);
        const b = y(seg.v1);
        marks.push({ key: seg.key, to: [pos, th, a, b], from: [pos, th, stacked ? a : base, stacked ? a : base], enter: [pos, th, a, a], delay: k * this.stagger + s * (stacked ? 70 : 30), data: seg });
      }
    });
    // Lines draw in once the bars are mostly up
    const lineDelay = nb ? Math.min(700, model.keys.length * this.stagger) + 150 : 0;
    lines.forEach((field, j) => {
      const s = nb + j;
      const idx = model.keys.map((_, k) => k).filter((k) => Number.isFinite(lineVals[j][k]));
      const pts = idx.map((k) => y2(lineVals[j][k]));
      const d: LineDraw = { kind: "line", key: `l:${field}`, s, xs: idx.map((k) => centers[k]), ink: this.inks[s], hi: pair || nS === 1 };
      marks.push({ key: d.key, to: [1, ...pts], from: [0, ...pts], enter: [0, ...pts], delay: lineDelay + j * 120, parts: [1, pts.length], data: d });
    });

    const names = fields.map((fl) => this.nameOf(fl));
    const events = model.keys.map((key, k) => {
      const first = model.values.findIndex((row) => Number.isFinite(row[k]));
      return {
        datum: (model.rows[Math.max(0, first)]?.[k] as T) ?? null,
        index: k,
        key,
        label: model.labels[k],
        value: first >= 0 ? model.values[first][k] : null,
        formatted: fields
          .map((_, s) => (Number.isFinite(model.values[s][k]) ? `${names[s]} ${this.valueText(s, model.values[s][k], f)}` : null))
          .filter(Boolean)
          .join(", "),
      };
    });
    const w = this.comboWords;
    const firstL = model.labels[0] ?? "";
    const lastL = model.labels[model.labels.length - 1] ?? "";
    const parts = [nb ? `bars: ${names.slice(0, nb).join(", ")}${stacked ? " (stacked)" : ""}` : "", nl ? `lines: ${names.slice(nb).join(", ")}${right ? ` ${w.rightAxis}` : ""}` : ""].filter(Boolean);
    const summary = `${model.keys.length} points from ${firstL} to ${lastL}; ${parts.join("; ")}`;
    return { marks, events, summary };
  }

  protected override plotMove(x: number, _y: number, e: PointerEvent) {
    const k = nearestIndex(this.geo.centers, x);
    if (k >= 0) this.setActive(k, e.pointerType === "touch" ? "touch" : "pointer");
  }

  protected override tip(k: number, f: ChartFrame): TooltipData | null {
    const model = this.sm;
    if (model.keys[k] === undefined) return null;
    const { centers, y, y2, top } = this.geo;
    const nb = this.nb;
    const stacked = this.stacked && nb > 1;
    const rows = model.series
      .map((field, s) => ({ field, s, v: model.values[s][k] }))
      .filter((r) => Number.isFinite(r.v))
      .map((r) => ({ label: this.nameOf(r.field), value: this.valueText(r.s, r.v, f), color: this.inks[r.s] }));
    let barTop = stacked ? model.values.slice(0, nb).reduce((a, row) => a + (Number.isFinite(row[k]) && row[k] > 0 ? row[k] : 0), 0) : -Infinity;
    if (!stacked) for (let s = 0; s < nb; s++) if (Number.isFinite(model.values[s][k])) barTop = Math.max(barTop, model.values[s][k]);
    let yy = Number.isFinite(barTop) ? y(barTop) : f.height;
    for (let s = nb; s < model.series.length; s++) if (Number.isFinite(model.values[s][k])) yy = Math.min(yy, y2(model.values[s][k]));
    return { x: centers[k], y: Math.max(top, yy), title: model.labels[k], rows };
  }

  protected override headerLegend() {
    const model = this.sm;
    if (model.series.length < 2) return nothing;
    const w = this.comboWords;
    const nb = this.nb;
    return html`<ul class="tc-chart__legend" aria-label="Series">
      ${model.series.map((field, s) => {
        const line = s >= nb;
        const axis = this.right ? (line ? ` ${w.rightAxis}` : ` ${w.leftAxis}`) : "";
        return html`<li class="tc-chart__key">
          <span class=${line ? "ui-cmb__stroke" : "tc-chart__swatch"} aria-hidden="true" style=${`background: ${this.inks[s]}`}></span>${this.nameOf(field)}${axis
            ? html`<span class="ui-cmb__axis">${axis}</span>`
            : nothing}
        </li>`;
      })}
    </ul>`;
  }

  protected override draw(f: ChartFrame) {
    const { width: W, height: H } = f;
    const { left, top, bottom, x1, r, ticks, tickFmt, ticks2, tickFmt2, band, y2, centers } = this.geo;
    const model = this.sm;
    const nb = this.nb;
    const stacked = this.stacked && nb > 1;
    const m = this.motion;
    const k = this.active;
    const items = m.items;
    const barItems = items.filter((it) => it.data.kind === "bar");
    const lineItems = items.filter((it) => it.data.kind === "line");
    const plotH = Math.max(0, H - bottom - top);

    const barsSvg = barItems.map((it) => {
      const sg = it.data as BarSeg;
      const [pos, th, a, b] = it.v;
      const neg = sg.v1 < sg.v0 || sg.value < 0;
      const topOfStack = !stacked || sg.s === nb - 1;
      const corners = topOfStack ? (neg ? { bl: r, br: r } : { tl: r, tr: r }) : {};
      return svg`<path class="ui-cmb__bar" d=${roundRectPath(pos, Math.min(a, b), th, Math.abs(b - a), corners)} style=${`fill: ${sg.ink}`}
        ?data-stacked=${stacked} opacity=${it.exiting ? 0.4 : this.dim(sg.k)}></path>`;
    });

    const linesSvg = lineItems.map((it) => {
      const d = it.data as LineDraw;
      const n = d.xs.length;
      const drawn = it.v[0];
      const ys = it.v.slice(1, 1 + n);
      const pts = d.xs.map((xx, i) => [xx, ys[i] ?? ys[ys.length - 1] ?? 0] as [number, number]);
      const dash = drawn < 0.999;
      return svg`<g opacity=${it.exiting ? 0.4 : 1} style=${`--tc-cmb-ink: ${d.ink}`}>
        <path class="ui-cmb__line" ?data-hi=${d.hi} d=${linePath(pts, this.curve)}
          pathLength=${dash ? 1 : nothing} stroke-dasharray=${dash ? "1 1" : nothing} stroke-dashoffset=${dash ? 1 - drawn : nothing}></path>
        ${pts.map(([xx, yy], i) => {
          const at = n > 1 ? i / (n - 1) : 1;
          const o = Math.min(1, Math.max(0, (drawn - at) * 8 + (drawn >= 0.999 ? 1 : 0)));
          return svg`<circle class="ui-cmb__dot" ?data-hi=${d.hi} cx=${xx} cy=${yy} r=${d.hi ? 3.2 : 2.6} opacity=${o}></circle>`;
        })}
      </g>`;
    });

    const hits = model.keys.map((key, i) => {
      const h = this.hover(i);
      return svg`<rect class="tc-chart__hit" x=${band(key) - (band.step - band.bandwidth) / 2} y=${top} width=${band.step} height=${plotH} @pointerenter=${h.enter} @click=${h.click}></rect>`;
    });

    let cursor: unknown = nothing;
    if (k !== null && model.keys[k] !== undefined) {
      const focus = this.via === "keyboard";
      const key = model.keys[k];
      cursor = svg`<g pointer-events="none">
        ${focus ? svg`<path class="tc-chart__focus" d=${roundRectPath(band(key) - 3, top - 3, band.bandwidth + 6, plotH + 6, 4)}></path>` : nothing}
        ${model.series.slice(nb).map((_, j) => {
          const v = model.values[nb + j][k];
          if (!Number.isFinite(v)) return nothing;
          return svg`<circle class="ui-cmb__point" cx=${centers[k]} cy=${y2(v)} r="4.2" style=${`fill: ${this.inks[nb + j]}`}></circle>`;
        })}
      </g>`;
    }

    return svg`
      ${this.yLabel ? txt(left, 6, this.yLabel) : nothing}
      ${this.right && this.y2Label ? txt(W, 6, this.y2Label, { anchor: "end" }) : nothing}
      ${gridY({ ticks, y: this.geo.y, x0: left, x1: this.right ? x1 : W, fmt: tickFmt, locale: f.locale })}
      ${this.right
        ? svg`<g>${tickLabels(ticks2, tickFmt2, f.locale).map((label, i) => txt(x1 + 6, Math.round(y2(ticks2[i])) + 0.5, label))}</g>`
        : nothing}
      ${hits}
      <g pointer-events="none">${barsSvg}${linesSvg}</g>
      ${cursor}
      ${axisXBand({ labels: model.labels, centers, y: H - bottom + 13 })}`;
  }

  static override css = /* css */ `
[data-ui="cmb"] {
  --tc-cmb-line-width: 2;
  --tc-cmb-line-width-hi: 2.6;
}
/* Stacked segments are parted by a line of the card's colour */
.ui-cmb__bar[data-stacked] { stroke: var(--tc-plot-bg); stroke-width: 1; }
.ui-cmb__line { fill: none; stroke: var(--tc-cmb-ink); stroke-width: var(--tc-cmb-line-width); stroke-linejoin: round; stroke-linecap: round; }
.ui-cmb__line[data-hi] { stroke-width: var(--tc-cmb-line-width-hi); }
.ui-cmb__dot { fill: var(--tc-plot-bg); stroke: var(--tc-cmb-ink); stroke-width: 1.6; }
.ui-cmb__dot[data-hi] { fill: var(--tc-cmb-ink); stroke: var(--tc-plot-bg); stroke-width: 1.4; }
.ui-cmb__point { stroke: var(--tc-plot-bg); stroke-width: 2; }
/* In the legend a line is a short stroke, a bar the shared square */
.ui-cmb__stroke { width: var(--tc-space-3-5); height: 2.5px; border-radius: var(--tc-radius-full); }
.ui-cmb__axis { margin-inline-start: var(--tc-space-1); color: var(--tc-text-muted); }
@media (forced-colors: active) {
  .ui-cmb__bar, .ui-cmb__line, .ui-cmb__dot, .ui-cmb__stroke { forced-color-adjust: none; }
}
`;
}

if (!customElements.get("tc-combo-chart")) customElements.define("tc-combo-chart", TcComboChart);

declare global {
  interface HTMLElementTagNameMap {
    "tc-combo-chart": TcComboChart;
  }
}
