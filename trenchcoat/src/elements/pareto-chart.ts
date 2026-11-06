import { nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { axisXBand, gridY, txt, yAxisWidth } from "./internal/chart/axis";
import { emphasisInk, TcChartElement, type ChartFrame, type ChartModel } from "./internal/chart/element";
import { linePath, roundRectPath, sum } from "./internal/chart/geometry";
import { resolveHighlight } from "./internal/chart/highlight";
import { numGetter, strGetter } from "./internal/chart/accessor";
import { scaleBand, scaleLinear } from "./internal/chart/scale";
import type { Mark } from "./internal/chart/motion";
import type { Accessor, Row, TooltipData } from "./internal/chart/types";

/*
 * <tc-pareto-chart> – which few items make most of a whole: bars from the largest down, with the running share as a
 * line over them and a dashed threshold (80% by default). Ported from ztd-charts' ParetoChart (MIT, © 2026 Junhan2).
 * The bars it takes to reach the threshold take the accent and the rest stay quiet (`highlight` picks others); the
 * cumulative share where they end is written beside the line. Bars grow in one after another, then the line draws
 * itself across them; a data change glides.
 *   · one tab stop: arrows move bar to bar, each read with its value, share and running share
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-pareto-chart heading="Audit findings" .data=${[{ label: "Labelling", value: 42 }, { label: "Storage", value: 17 }]}></tc-pareto-chart>
 */

/** A Pareto chart: Lucide's chart-column-big with a rising line (ISC, lucide.dev) */
const paretoIcon = svg`<path d="M3 3v16a2 2 0 0 0 2 2h16"></path><path d="M7 17v-6"></path><path d="M12 17v-4"></path><path d="M17 17v-2"></path><path d="m7 7 5-2 5-1"></path>`;

/** The words a Pareto chart shows and says – rename them through `paretoLabels` */
export type ParetoLabels = {
  share: string;
  cumulative: string;
  /** A bar's rank under `rank-labels`: "#{rank}" */
  rank: string;
  /** The description read with the chart: "{count} items; the top {top} add up to {cumulative}." */
  summary: string;
};
export const defaultParetoLabels: ParetoLabels = {
  share: "Share",
  cumulative: "Cumulative",
  rank: "#{rank}",
  summary: "{count} items; the top {top} add up to {cumulative}.",
};

type ParetoBar = { k: number; label: string; value: number; share: number; cum: number; hi: boolean; datum: unknown };

const fill = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));
const TICKS = [0, 50, 100];
const tickFmt = (v: number) => String(v);

/**
 * Items from the largest down with their running share as a line and a threshold, the few that reach it emphasised,
 * and a table view.
 * @tag tc-pareto-chart
 * @fires tc-view-change - The Table button was pressed ({ view }: ChartViewChange); cancelable – prevented, `view` stays as it was
 * @fires tc-mark-hover - The pointer or keyboard moved to a bar, or off them ({ event }: ChartMarkHover)
 * @fires tc-mark-click - A bar was clicked, or picked with Enter or Space ({ event }: ChartMarkClick)
 */
export class TcParetoChart<T = Row> extends TcChartElement<ParetoBar | null, T> {
  static override ui = "prt";

  /** The item's name field; by default "label" */
  @property({ attribute: false }) accessor label: Accessor<T, string> | undefined = undefined;
  /** The item's value field (negative values count as 0); by default "value" */
  @property({ attribute: false }) accessor value: Accessor<T, number> | undefined = undefined;
  /** The cumulative share, in %, the dashed line marks and the default emphasis reaches */
  @property({ type: Number }) accessor threshold = 80;
  /** Keeps the rows' order instead of sorting from the largest */
  @property({ type: Boolean, attribute: "keep-order" }) accessor keepOrder = false;
  /** Writes ranks ("#1", "#2" …) under the bars instead of the names */
  @property({ type: Boolean, attribute: "rank-labels" }) accessor rankLabels = false;
  /** The words it shows and says, merged over defaultParetoLabels */
  @property({ attribute: false }) accessor paretoLabels: Partial<ParetoLabels> = {};

  protected override readonly kind = "Pareto chart";
  protected override readonly icon = paretoIcon;
  protected override defaultDuration = 650;
  protected override stagger = 55;
  protected override modelKeys = ["label", "value", "threshold", "keepOrder", "rankLabels", "paretoLabels", "duration"];

  private bars: ParetoBar[] = [];
  private geo = {
    top: 12,
    bottom: 22,
    right: 30,
    left: 0,
    r: 0,
    band: scaleBand([], [0, 1]),
    y: scaleLinear([0, 100], [0, 1]),
    names: [] as string[],
  };

  protected override defaultHeight(w: number) {
    return Math.max(190, Math.min(260, w * 0.55));
  }

  private get paretoWords(): ParetoLabels {
    return { ...defaultParetoLabels, ...this.paretoLabels };
  }

  protected override buildModel(f: ChartFrame): ChartModel<ParetoBar | null, T> {
    const { width: W, height: H } = f;
    const gl = strGetter(this.label, "label");
    const gv = numGetter(this.value, "value");
    const th = this.threshold;
    let rows = this.data.map((d, i) => ({ d, label: gl(d, i), value: Math.max(0, gv(d, i) || 0) }));
    if (!this.keepOrder) rows = [...rows].sort((a, b) => b.value - a.value);
    const total = sum(rows.map((r) => r.value)) || 1;
    let acc = 0;
    const bars: ParetoBar[] = rows.map((r, k) => {
      acc += r.value;
      return { k, label: r.label, value: r.value, share: (r.value / total) * 100, cum: (acc / total) * 100, hi: false, datum: r.d };
    });
    if (this.highlight !== undefined) {
      resolveHighlight(this.highlight, bars.map((b) => b.datum as T), bars.map((b) => b.label), bars.map((b) => b.value)).forEach((k) => (bars[k].hi = true));
    } else {
      // The bars it takes to reach the threshold (at least one)
      for (const b of bars) {
        b.hi = true;
        if (b.cum >= th - 0.5) break;
        const next = bars[b.k + 1];
        if (next && next.cum > th + 0.5) break;
      }
    }
    this.bars = bars;

    const w = this.paretoWords;
    const left = yAxisWidth(TICKS, tickFmt);
    const top = 12;
    const bottom = 22;
    const right = 30;
    const y = scaleLinear([0, 100], [H - bottom, top]);
    const names = bars.map((b, k) => (this.rankLabels ? fill(w.rank, { rank: k + 1 }) : b.label));
    // Bands by position: two items with the same name each get their own
    const band = scaleBand(
      bars.map((b) => `${b.k}`),
      [left + 4, W - right],
      0.28,
      0.1,
    );
    this.geo = { top, bottom, right, left, r: Math.min(4, band.bandwidth / 4), band, y, names };

    const D = this.duration ?? this.defaultDuration;
    const lineDelay = bars.length * this.stagger * 0.6 + D * 0.35;
    const marks: Mark<ParetoBar | null>[] = bars.map((b) => ({ key: `b:${b.label}`, to: [y(b.share), y(b.cum)], from: [y(0), y(0)], enter: [y(0), y(0)], delay: b.k * this.stagger, data: b }));
    marks.push({ key: "__draw", to: [1], from: [0], delay: lineDelay, data: null });
    const events = bars.map((b) => ({
      datum: b.datum as T,
      index: b.k,
      key: b.label,
      label: b.label,
      value: b.value,
      formatted: `${f.fv(b.value)} · ${w.share.toLowerCase()} ${f.pct(b.share)} · ${w.cumulative.toLowerCase()} ${f.pct(b.cum)}`,
    }));
    const lastHi = [...bars].reverse().find((b) => b.hi);
    const summary = fill(w.summary, { count: bars.length, top: bars.filter((b) => b.hi).length, cumulative: lastHi ? f.pct(lastHi.cum) : "–" });
    return { marks, events, summary };
  }

  protected override tip(i: number, f: ChartFrame): TooltipData | null {
    const b = this.bars[i];
    if (!b) return null;
    const { band, y } = this.geo;
    const w = this.paretoWords;
    return {
      x: band(`${b.k}`) + band.bandwidth / 2,
      y: Math.min(y(b.share), y(b.cum)),
      title: `${this.rankLabels ? `${fill(w.rank, { rank: b.k + 1 })} · ` : ""}${b.label}`,
      rows: [
        { label: this.words.value, value: f.fv(b.value), color: emphasisInk(b.hi) },
        { label: w.share, value: f.pct(b.share) },
        { label: w.cumulative, value: f.pct(b.cum) },
      ],
    };
  }

  protected override draw(f: ChartFrame) {
    const { width: W, height: H } = f;
    const { top, bottom, right, left, r, band, y, names } = this.geo;
    const bars = this.bars;
    const bw = band.bandwidth;
    const cx = (k: number) => band(`${k}`) + bw / 2;
    const m = this.motion;
    const draw = m.get("__draw")?.[0] ?? 1;
    const th = this.threshold;
    const thY = Math.round(y(th)) + 0.5;
    // The line's points sit at the bars' current places (b.k): the marks keep their first-seen order
    const pts: [number, number][] = [];
    const drawnBars = m.items.map((it) => {
      const b = it.data;
      if (!b || it.exiting) return nothing;
      const k = b.k;
      pts[k] = [cx(k), it.v[1]];
      const yy = it.v[0];
      const h = Math.max(0, y(0) - yy);
      const bx = band(`${k}`);
      const focus = this.active === k && this.via === "keyboard";
      const hv = this.hover(k);
      return svg`<g class="tc-chart__mark" opacity=${this.dim(k)} @pointerenter=${hv.enter} @click=${hv.click}>
        <rect class="tc-chart__hit" x=${bx - (band.step - bw) / 2} y=${top} width=${band.step} height=${Math.max(0, H - bottom - top)}></rect>
        <path class="ui-prt__bar" d=${roundRectPath(bx, yy, bw, h, { tl: r, tr: r })} style=${`fill: ${emphasisInk(b.hi)}`}></path>
        ${focus ? svg`<path class="tc-chart__focus" d=${roundRectPath(bx - 2, yy - 2, bw + 4, h + 4, 4)}></path>` : nothing}
      </g>`;
    });
    const line = pts.filter(Boolean);
    const lastHi = [...bars].reverse().find((b) => b.hi);
    const dash = draw < 0.999;
    const n = line.length;
    const endAt = lastHi ? pts[lastHi.k] : undefined;
    return svg`
      ${gridY({ ticks: TICKS, y, x0: left, x1: W - right, fmt: tickFmt })}
      <line class="ui-prt__threshold" x1=${left} x2=${W - right} y1=${thY} y2=${thY}></line>
      ${txt(W - right + 4, thY, `${th}%`)}
      ${drawnBars}
      ${n > 1
        ? svg`<path class="ui-prt__line" d=${linePath(line, "linear")} pathLength=${dash ? 1 : nothing} stroke-dasharray=${dash ? "1 1" : nothing} stroke-dashoffset=${dash ? 1 - draw : nothing}></path>`
        : nothing}
      ${pts.map((pt, k) => {
        if (!pt || !bars[k]) return nothing;
        const appear = Math.min(1, Math.max(0, (draw - k / Math.max(1, n - 1)) * 6 + (draw >= 0.999 ? 1 : 0)));
        const end = lastHi?.k === k;
        return svg`<circle class="ui-prt__dot" ?data-end=${end} cx=${pt[0]} cy=${pt[1]} r=${end ? 3.6 : 2.4} opacity=${appear}></circle>`;
      })}
      ${lastHi && endAt && !this.hideLabels
        ? txt(Math.max(endAt[0] + 8, band(`${lastHi.k}`) + bw + 4), endAt[1] + 12, f.pct(lastHi.cum), { cls: "value", strong: true, opacity: Math.max(0, (draw - 0.6) / 0.4) })
        : nothing}
      ${axisXBand({ labels: names, centers: bars.map((b) => cx(b.k)), y: H - bottom + 13 })}`;
  }

  static override css = /* css */ `
/* The running share: a line of the plot's line ink, drawn over the bars */
.ui-prt__line { fill: none; stroke: var(--tc-plot-line-rest); stroke-width: 1.6; stroke-linejoin: round; pointer-events: none; }
.ui-prt__dot { fill: var(--tc-plot-line-rest); stroke: var(--tc-plot-bg); stroke-width: 1; pointer-events: none; }
.ui-prt__threshold { stroke: var(--tc-plot-zero); stroke-width: 1; stroke-dasharray: 3 3; }
@media (forced-colors: active) {
  .ui-prt__bar { forced-color-adjust: none; }
  .ui-prt__line { stroke: CanvasText; }
  .ui-prt__dot { fill: CanvasText; }
}
`;
}

if (!customElements.get("tc-pareto-chart")) customElements.define("tc-pareto-chart", TcParetoChart);

declare global {
  interface HTMLElementTagNameMap {
    "tc-pareto-chart": TcParetoChart;
  }
}
