import { html, nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { axisXBand, gridY, txt, yAxisWidth } from "./internal/chart/axis";
import { TcChartElement, type ChartFrame, type ChartModel } from "./internal/chart/element";
import { makeTickFormatter } from "./internal/chart/format";
import { roundRectPath } from "./internal/chart/geometry";
import { resolveHighlight } from "./internal/chart/highlight";
import { getter, numGetter, strGetter } from "./internal/chart/accessor";
import { fitDomain, scaleBand, scaleLinear } from "./internal/chart/scale";
import type { Accessor, Row, TooltipData } from "./internal/chart/types";

/*
 * <tc-waterfall-chart> – how a starting figure becomes an ending one: each row a step up or down from where the last
 * left off, totals standing on the baseline. Ported from ztd-charts' WaterfallChart (MIT, © 2026 Junhan2). Increases
 * take the success ink and decreases the danger ink, named in the legend; `highlight` gives steps the accent. Dashed
 * connectors carry each level to the next step, and each step's change is written above it (below, for a fall). The bars drop in one after another when the chart comes on screen and glide when the
 * data changes.
 *   · one tab stop: arrows move step to step, each read with its change
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-waterfall-chart heading="Grant budget" .data=${[{ label: "Awarded", value: 480 }, { label: "Equipment", value: -120 }]}></tc-waterfall-chart>
 */

/** A waterfall: Lucide's chart-column-decreasing (ISC, lucide.dev) */
const waterfallIcon = svg`<path d="M13 17V9"></path><path d="M18 17v-3"></path><path d="M3 3v16a2 2 0 0 0 2 2h16"></path><path d="M8 17V5"></path>`;

/** The words a waterfall shows – rename them through `waterfallLabels` */
export type WaterfallLabels = { increase: string; decrease: string; total: string; cumulative: string };
export const defaultWaterfallLabels: WaterfallLabels = { increase: "Increase", decrease: "Decrease", total: "Total", cumulative: "Cumulative" };

type StepKind = "total" | "up" | "down";
type Step = { k: number; label: string; value: number; start: number; end: number; kind: StepKind; hi: boolean; datum: unknown };

/** The ink of each kind of step – the component tokens set in the CSS */
const ink = (s: Step) => (s.hi ? "var(--tc-plot-accent)" : `var(--tc-wfl-${s.kind})`);

const endTotalConverter = {
  fromAttribute: (v: string | null) => (v === null ? false : v === "" ? true : v),
  toAttribute: (v: string | boolean) => (v === false ? null : v === true ? "" : v),
};

/**
 * Steps from a starting figure to an ending one – increases and decreases bridged by connectors, totals on the
 * baseline – with the steps `highlight` picks emphasised and a table view.
 * @tag tc-waterfall-chart
 * @fires tc-view-change - The Table button was pressed ({ view }: ChartViewChange); cancelable – prevented, `view` stays as it was
 * @fires tc-mark-hover - The pointer or keyboard moved to a step, or off them ({ event }: ChartMarkHover)
 * @fires tc-mark-click - A step was clicked, or picked with Enter or Space ({ event }: ChartMarkClick)
 */
export class TcWaterfallChart<T = Row> extends TcChartElement<Step, T> {
  static override ui = "wfl";

  /** The step's name field; by default "label" */
  @property({ attribute: false }) accessor label: Accessor<T, string> | undefined = undefined;
  /** The step's change field (a total's level); by default "value" */
  @property({ attribute: false }) accessor value: Accessor<T, number> | undefined = undefined;
  /** The step's type field: "total" makes it a total bar, at its value or, with none, the running level; by default "type" */
  @property({ attribute: false }) accessor type: Accessor<T, string> | undefined = undefined;
  /** The first row is a change like the rest, not the starting total */
  @property({ type: Boolean, attribute: "delta-start" }) accessor deltaStart = false;
  /** Adds a total bar at the end: true names it "Total", a string names it */
  @property({ attribute: "end-total", converter: endTotalConverter }) accessor endTotal: string | boolean = false;
  /** Leaves out the dashed lines carrying each level to the next step */
  @property({ type: Boolean, attribute: "hide-connectors" }) accessor hideConnectors = false;
  /** The words it shows, merged over defaultWaterfallLabels */
  @property({ attribute: false }) accessor waterfallLabels: Partial<WaterfallLabels> = {};

  protected override readonly kind = "Waterfall chart";
  protected override readonly icon = waterfallIcon;
  protected override defaultDuration = 650;
  protected override stagger = 130;
  protected override modelKeys = ["label", "value", "type", "deltaStart", "endTotal", "waterfallLabels"];

  private steps: Step[] = [];
  private geo = {
    top: 20,
    bottom: 22,
    left: 0,
    r: 0,
    ticks: [] as number[],
    tickFmt: ((v: number) => String(v)) as (v: number) => string,
    band: scaleBand([], [0, 1]),
    y: scaleLinear([0, 1], [0, 1]),
  };

  protected override defaultHeight(w: number) {
    return Math.max(190, Math.min(260, w * 0.55));
  }

  private get stepWords(): WaterfallLabels {
    return { ...defaultWaterfallLabels, ...this.waterfallLabels };
  }

  private signed(v: number, f: ChartFrame) {
    return v > 0 ? `+${f.fmt(v)}` : v < 0 ? `−${f.fmt(-v)}` : f.fmt(0);
  }

  /** A step's change as written: a total's level, or the signed change with the unit */
  private stepText(s: Step, f: ChartFrame) {
    return s.kind === "total" ? f.fv(s.value) : `${this.signed(s.value, f)}${this.unit}`;
  }

  protected override buildModel(f: ChartFrame): ChartModel<Step, T> {
    const { width: W, height: H } = f;
    const gl = strGetter(this.label, "label");
    const gv = numGetter(this.value, "value");
    const gt = getter(this.type, "type");
    const words = this.stepWords;
    const steps: Step[] = [];
    let run = 0;
    this.data.forEach((d, i) => {
      const raw = gv(d, i);
      const t = String(gt(d, i) ?? "").toLowerCase();
      const total = t === "total" || (i === 0 && !this.deltaStart && t !== "delta");
      if (total) {
        const v = Number.isFinite(raw) ? raw : run;
        steps.push({ k: steps.length, label: gl(d, i), value: v, start: 0, end: v, kind: "total", hi: false, datum: d });
        run = v;
      } else {
        const v = Number.isFinite(raw) ? raw : 0;
        steps.push({ k: steps.length, label: gl(d, i), value: v, start: run, end: run + v, kind: v >= 0 ? "up" : "down", hi: false, datum: d });
        run += v;
      }
    });
    if (this.endTotal !== false && steps.length) {
      steps.push({ k: steps.length, label: typeof this.endTotal === "string" ? this.endTotal : words.total, value: run, start: 0, end: run, kind: "total", hi: false, datum: null });
    }
    // Nothing by default: the status inks already carry the meaning (ztd emphasised the largest increase). Totals are
    // never picked by "max"
    const hi = resolveHighlight(
      this.highlight,
      steps.map((s) => s.datum as T),
      steps.map((s) => s.label),
      steps.map((s) => (s.kind === "total" ? -Infinity : s.value)),
      "none",
    );
    hi.forEach((k) => {
      if (steps[k]) steps[k].hi = true;
    });
    this.steps = steps;

    const lo = Math.min(0, ...steps.map((s) => Math.min(s.start, s.end)));
    const hiV = Math.max(0, ...steps.map((s) => Math.max(s.start, s.end)));
    const dom = fitDomain(lo, hiV, 3);
    const tickFmt = makeTickFormatter(this.format, f.locale, Math.max(Math.abs(dom[0]), Math.abs(dom[1])));
    const ticks = scaleLinear(dom, [0, 1]).ticks(3);
    const left = yAxisWidth(ticks, tickFmt, f.locale);
    const top = 20;
    const bottom = 22;
    const y = scaleLinear(dom, [H - bottom, top]);
    // Bands by position: two steps with the same name each get their own
    const band = scaleBand(
      steps.map((s) => `${s.k}`),
      [left + 4, W - 2],
      0.34,
      0.12,
    );
    this.geo = { top, bottom, left, r: Math.min(4, band.bandwidth / 4), ticks, tickFmt, band, y };

    const marks = steps.map((s) => {
      const y0 = y(s.start);
      const y1 = y(s.end);
      return { key: `w:${s.label}`, to: [y0, y1, 1], from: [y0, y0, 0], enter: [y0, y0, 0], delay: s.k * this.stagger, data: s };
    });
    const events = steps.map((s) => ({ datum: (s.datum as T) ?? null, index: s.k, key: s.label, label: s.label, value: s.value, formatted: this.stepText(s, f) }));
    const summary = steps.map((s) => `${s.label} ${s.kind === "total" ? f.fv(s.value) : this.signed(s.value, f)}`).join(", ");
    return { marks, events, summary };
  }

  protected override tableHeader() {
    return "Step";
  }

  protected override tip(i: number, f: ChartFrame): TooltipData | null {
    const s = this.steps[i];
    if (!s) return null;
    const { band, y } = this.geo;
    const w = this.stepWords;
    const rows =
      s.kind === "total"
        ? [{ label: w.total, value: f.fv(s.value), color: ink(s) }]
        : [
            { label: s.kind === "up" ? w.increase : w.decrease, value: this.stepText(s, f), color: ink(s) },
            { label: w.cumulative, value: f.fv(s.end) },
          ];
    return { x: band(`${s.k}`) + band.bandwidth / 2, y: Math.min(y(s.start), y(s.end)), title: s.label, rows };
  }

  protected override headerLegend() {
    const w = this.stepWords;
    const kinds = new Set(this.steps.map((s) => s.kind));
    const keys: [StepKind, string][] = [
      ["up", w.increase],
      ["down", w.decrease],
      ["total", w.total],
    ];
    const shown = keys.filter(([k]) => kinds.has(k));
    if (shown.length < 2) return nothing;
    return html`<ul class="tc-chart__legend" aria-label="Key">
      ${shown.map(([k, name]) => html`<li class="tc-chart__key"><span class="tc-chart__swatch ui-wfl__swatch" data-kind=${k} aria-hidden="true"></span>${name}</li>`)}
    </ul>`;
  }

  protected override draw(f: ChartFrame) {
    const { width: W, height: H } = f;
    const { top, bottom, left, r, ticks, tickFmt, band, y } = this.geo;
    const steps = this.steps;
    const bw = band.bandwidth;
    const m = this.motion;
    const st = this.stagger;
    return svg`
      ${gridY({ ticks, y, x0: left, x1: W, fmt: tickFmt, locale: f.locale })}
      ${m.items.map((it) => {
        // A leaving step keeps its old band and would sit on the new one there: it isn't drawn
        if (it.exiting) return nothing;
        const s = it.data;
        const k = s.k;
        const [ya, yb, o] = it.v;
        const top0 = Math.min(ya, yb);
        const h = Math.abs(yb - ya);
        const bx = band(`${k}`);
        const next = steps[k + 1];
        const level = Math.round(y(s.end)) + 0.5;
        const rise = s.kind === "total" || s.value >= 0;
        const lo = m.fade(k * st + 260, 240);
        const hitX = Math.max(0, bx - (band.step - bw) / 2);
        const focus = this.active === k && this.via === "keyboard";
        const hv = this.hover(k);
        return svg`<g class="tc-chart__mark" opacity=${this.dim(k)} @pointerenter=${hv.enter} @click=${hv.click}>
          <rect class="tc-chart__hit" x=${hitX} y=${top} width=${Math.max(0, Math.min(W, hitX + band.step) - hitX)} height=${Math.max(0, H - bottom - top)}></rect>
          ${!this.hideConnectors && next ? svg`<line class="ui-wfl__link" x1=${bx + bw} x2=${band(`${k + 1}`)} y1=${level} y2=${level} opacity=${lo * 0.9}></line>` : nothing}
          <path class="ui-wfl__bar" data-kind=${s.kind} ?data-hi=${s.hi} d=${roundRectPath(bx, top0, bw, Math.max(h, o > 0 ? 1 : 0), rise ? { tl: r, tr: r } : { bl: r, br: r })} opacity=${Math.max(0.001, o)}></path>
          ${focus ? svg`<path class="tc-chart__focus" d=${roundRectPath(bx - 2, top0 - 2, bw + 4, h + 4, 4)}></path>` : nothing}
          ${this.hideLabels
            ? nothing
            : txt(bx + bw / 2, rise ? top0 - 9 : top0 + h + 10, s.kind === "total" ? f.fmt(s.value) : this.signed(s.value, f), { cls: "value", anchor: "middle", strong: s.kind === "total" || s.hi, opacity: lo })}
        </g>`;
      })}
      ${axisXBand({
        labels: steps.map((s) => s.label),
        centers: steps.map((s) => band(`${s.k}`) + bw / 2),
        y: H - bottom + 13,
        strong: new Set(steps.flatMap((s) => (s.kind === "total" ? [s.k] : []))),
      })}`;
  }

  static override css = /* css */ `
/* Increases and decreases mean good and bad here: the status inks; totals the quiet chart ink */
[data-ui="wfl"] { --tc-wfl-up: var(--tc-status-success-solid); --tc-wfl-down: var(--tc-status-danger-solid); --tc-wfl-total: var(--tc-plot-rest); }
.ui-wfl__bar, .ui-wfl__swatch { fill: var(--tc-wfl-up); background: var(--tc-wfl-up); }
.ui-wfl__bar[data-kind="down"], .ui-wfl__swatch[data-kind="down"] { fill: var(--tc-wfl-down); background: var(--tc-wfl-down); }
.ui-wfl__bar[data-kind="total"], .ui-wfl__swatch[data-kind="total"] { fill: var(--tc-wfl-total); background: var(--tc-wfl-total); }
.ui-wfl__bar[data-hi] { fill: var(--tc-plot-accent); }
.ui-wfl__link { stroke: var(--tc-plot-zero); stroke-width: 1; stroke-dasharray: 2 3; }
@media (forced-colors: active) {
  .ui-wfl__bar, .ui-wfl__swatch { forced-color-adjust: none; }
}
`;
}

if (!customElements.get("tc-waterfall-chart")) customElements.define("tc-waterfall-chart", TcWaterfallChart);

declare global {
  interface HTMLElementTagNameMap {
    "tc-waterfall-chart": TcWaterfallChart;
  }
}
