import { svg } from "lit";
import { property } from "lit/decorators.js";
import { gridX, txt } from "./internal/chart/axis";
import { AXIS_FONT, emphasisInk, TcChartElement, type ChartFrame, type ChartModel } from "./internal/chart/element";
import { makeTickFormatter } from "./internal/chart/format";
import { nearestIndex, quantileSorted } from "./internal/chart/geometry";
import { resolveHighlight } from "./internal/chart/highlight";
import { numGetter, strGetter, uniq } from "./internal/chart/accessor";
import { extent, fitDomain, scaleLinear } from "./internal/chart/scale";
import { kde } from "./internal/chart/stats";
import { textWidth, truncate } from "./internal/chart/text";
import type { Accessor, Row, TooltipData } from "./internal/chart/types";

/*
 * <tc-ridgeline-chart> – how values spread in each of several groups, as density curves stacked one above the other
 * and overlapping like a mountain range. Ported from ztd-charts' RidgelineChart (MIT, © 2026 Junhan2). The group with
 * the highest median takes the accent and the rest stay quiet (`highlight` picks others, by group name); each ridge
 * carries a tick at its median. Ridges rise from their baselines when the chart comes on screen and reshape when the
 * data changes.
 *   · one tab stop: arrows move ridge to ridge, each read with its median and sample size
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-ridgeline-chart heading="Sample temperatures" .data=${[{ group: "Freezer A", value: -79.6 }, …]}></tc-ridgeline-chart>
 */

/** A ridgeline: Lucide's chart-spline (ISC, lucide.dev) */
const ridgeIcon = svg`<path d="M3 3v16a2 2 0 0 0 2 2h16"></path><path d="M7 16c.5-2 1.5-7 4-7 2 0 2 3 4 3 2.5 0 4.5-5 5-7"></path>`;

export type RidgelineSort = "none" | "median";

/** The words a ridgeline adds to the shared ones */
export type RidgelineLabels = {
  median: string;
  n: string;
  /** "median {median} ({n} values)" – a ridge as read and in the table */
  summary: string;
};
export const defaultRidgelineLabels: RidgelineLabels = {
  median: "Median",
  n: "Sample size",
  summary: "median {median} ({n} values)",
};

type Ridge = { g: number; name: string; dens: number[]; median: number; n: number; hi: boolean };

/** Density samples along x */
const SAMPLES = 72;
const fill = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));

/**
 * How values spread in several groups, as overlapping density ridges with a tick at each median, the highest median
 * emphasised, with a table view.
 * @tag tc-ridgeline-chart
 * @fires tc-view-change - The Table button was pressed ({ view }: ChartViewChange); cancelable – prevented, `view` stays as it was
 * @fires tc-mark-hover - The pointer or keyboard moved to a ridge, or off them ({ event }: ChartMarkHover)
 * @fires tc-mark-click - A ridge was clicked, or picked with Enter or Space ({ event }: ChartMarkClick)
 */
export class TcRidgelineChart<T = Row> extends TcChartElement<Ridge, T> {
  static override ui = "rdl";

  /** The group field; by default "group" */
  @property({ attribute: false }) accessor group: Accessor<T, string> | undefined = undefined;
  /** The value field; by default "value" */
  @property({ attribute: false }) accessor value: Accessor<T, number> | undefined = undefined;
  /** How far each ridge may rise over the ones above it, in rows; 1 just touches */
  @property({ type: Number }) accessor overlap = 1.5;
  /** The density's smoothing width, in value units; by default worked out from each group */
  @property({ type: Number }) accessor bandwidth: number | undefined = undefined;
  /** Groups in data order ("none") or from the lowest median ("median") */
  @property() accessor sort: RidgelineSort = "none";
  /** The ridgeline's own words, merged over defaultRidgelineLabels */
  @property({ attribute: false }) accessor ridgeLabels: Partial<RidgelineLabels> = {};

  protected override readonly kind = "Ridgeline chart";
  protected override readonly icon = ridgeIcon;
  protected override defaultDuration = 900;
  protected override stagger = 90;
  protected override modelKeys = ["group", "value", "overlap", "bandwidth", "sort", "ridgeLabels"];

  private ridges: Ridge[] = [];
  private geo = {
    xsv: [] as number[],
    peak: 1,
    labelW: 0,
    top: 8,
    bottom: 20,
    step: 1,
    amp: 1,
    ticks: [] as number[],
    tickFmt: ((v: number) => String(v)) as (v: number) => string,
    x: scaleLinear([0, 1], [0, 1]),
  };

  private get ridgeWords(): RidgelineLabels {
    return { ...defaultRidgelineLabels, ...this.ridgeLabels };
  }

  protected override defaultHeight() {
    const gg = strGetter(this.group, "group");
    const groups = new Set(this.data.map((d, i) => gg(d, i))).size;
    return Math.max(180, Math.min(380, groups * 36 + 60));
  }

  protected override tableHeader() {
    return "Group";
  }

  private baseY(k: number) {
    const { top, amp, step } = this.geo;
    return top + amp + step * k;
  }

  protected override buildModel(f: ChartFrame): ChartModel<Ridge, T> {
    const { width: W, height: H } = f;
    const gg = strGetter(this.group, "group");
    const gv = numGetter(this.value, "value");
    const by = new Map<string, number[]>();
    this.data.forEach((d, i) => {
      const v = gv(d, i);
      if (!Number.isFinite(v)) return;
      const g = gg(d, i);
      const arr = by.get(g);
      if (arr) arr.push(v);
      else by.set(g, [v]);
    });
    let names = uniq(this.data.map((d, i) => gg(d, i))).filter((g) => by.has(g));
    const all = [...by.values()].flat();
    const [mn, mx] = extent(all.length ? all : [0, 1]);
    const dom = fitDomain(mn, mx, 4, { zero: false, pad: 0.06 });
    const xsv = Array.from({ length: SAMPLES }, (_, k) => dom[0] + ((dom[1] - dom[0]) * k) / (SAMPLES - 1));
    const medians = new Map(names.map((g) => [g, quantileSorted([...by.get(g)!].sort((a, b) => a - b), 0.5)]));
    if (this.sort === "median") names = [...names].sort((a, b) => medians.get(a)! - medians.get(b)!);
    const ridges: Ridge[] = names.map((g, k) => ({ g: k, name: g, dens: kde(by.get(g)!, xsv, this.bandwidth), median: medians.get(g)!, n: by.get(g)!.length, hi: false }));
    // A test gets the group's name, not a row
    const hi = resolveHighlight(this.highlight as never, names as never[], names, ridges.map((r) => r.median), "max");
    ridges.forEach((r) => (r.hi = hi.has(r.g)));
    this.ridges = ridges;
    const peak = Math.max(...ridges.flatMap((r) => r.dens), 1e-9);

    const labelW = Math.min(W * 0.26, Math.max(...ridges.map((r) => textWidth(r.name, AXIS_FONT, 700)), 20) + 10);
    const top = 8;
    const bottom = 20;
    const nG = Math.max(1, ridges.length);
    // One group with no overlap would divide by zero: a tiny overlap gives it the whole height
    const overlap = Math.max(1e-6, Number.isFinite(this.overlap) ? this.overlap : 1.5);
    const step = (H - top - bottom) / (nG - 1 + overlap);
    const amp = step * overlap;
    const x = scaleLinear(dom, [labelW + 8, W - 8]);
    const ticks = x.ticks(Math.max(2, Math.round(W / 110)));
    const tickFmt = makeTickFormatter(this.format, f.locale, Math.max(Math.abs(dom[0]), Math.abs(dom[1])));
    this.geo = { xsv, peak, labelW, top, bottom, step, amp, ticks, tickFmt, x };

    const marks = ridges.map((r, k) => ({ key: `r:${r.name}`, to: r.dens.map((d) => (d / peak) * amp), from: r.dens.map(() => 0), enter: r.dens.map(() => 0), delay: k * this.stagger, data: r }));
    const w = this.ridgeWords;
    const events = ridges.map((r) => ({ datum: null, index: r.g, key: r.name, label: r.name, value: r.median, formatted: fill(w.summary, { median: f.fv(r.median), n: r.n }) }));
    const summary = `${ridges.length} groups: ${ridges.map((r) => `${r.name} median ${f.fv(r.median)}`).join(", ")}`;
    return { marks, events, summary };
  }

  /** The ridges overlap, so a lower ridge's peak crosses the baselines above: the lowest ridge under the pointer wins */
  protected override plotMove(px: number, py: number, e: PointerEvent) {
    const { xsv, peak, amp, top, step, x } = this.geo;
    const rs = this.ridges;
    if (!rs.length) return;
    const j = nearestIndex(xsv, x.invert(px));
    let k = -1;
    for (let g = rs.length - 1; g >= 0; g--) {
      const b = this.baseY(g);
      const h = ((rs[g].dens[j] ?? 0) / peak) * amp;
      if (py <= b + 1 && py >= b - h - 1) {
        k = g;
        break;
      }
    }
    // Outside every ridge: the one whose baseline is just below the pointer
    if (k < 0) k = Math.max(0, Math.min(rs.length - 1, Math.ceil((py - top - amp) / step)));
    this.setActive(k, e.pointerType === "touch" ? "touch" : "pointer");
  }

  protected override tip(i: number, f: ChartFrame): TooltipData | null {
    const r = this.ridges[i];
    if (!r) return null;
    const w = this.ridgeWords;
    return {
      x: this.geo.x(r.median),
      y: this.baseY(r.g) - this.geo.amp * 0.6,
      title: r.name,
      rows: [
        { label: w.median, value: f.fv(r.median), color: emphasisInk(r.hi) },
        { label: w.n, value: String(r.n), strong: false },
      ],
    };
  }

  protected override draw(f: ChartFrame) {
    const { width: W, height: H } = f;
    const { xsv, labelW, top, bottom, ticks, tickFmt, x } = this.geo;
    const m = this.motion;
    const D = this.duration ?? this.defaultDuration;
    const x0 = x(xsv[0]).toFixed(2);
    const xn = x(xsv[xsv.length - 1]).toFixed(2);
    return svg`
      ${gridX({ ticks, x, y0: top, y1: H - bottom, fmt: tickFmt, locale: f.locale })}
      <rect class="tc-chart__hit" x="0" y=${top} width=${W} height=${Math.max(0, H - top - bottom)} @click=${() => this.active !== null && this.clickMark(this.active)}></rect>
      ${m.items.map((it) => {
        const r = it.data;
        const b = this.baseY(r.g);
        const pts = it.v.map((h, k) => `${x(xsv[k]).toFixed(2)},${(b - h).toFixed(2)}`);
        const area = `M${x0},${b.toFixed(2)}L${pts.join("L")}L${xn},${b.toFixed(2)}Z`;
        const line = `M${pts.join("L")}`;
        const isA = this.active === r.g;
        return svg`<g class="tc-chart__mark" opacity=${it.exiting ? 0.4 : this.dim(r.g)} @click=${() => this.clickMark(r.g)}>
          <path class="ui-rdl__ridge" d=${area} style=${`fill: ${emphasisInk(r.hi)}`} ?data-hi=${r.hi}></path>
          <path class="ui-rdl__line" d=${line} ?data-hi=${r.hi} ?data-active=${isA}></path>
          ${isA && this.via === "keyboard" ? svg`<path class="tc-chart__focus" d=${line}></path>` : null}
          <line class="tc-chart__grid" x1=${labelW + 8} x2=${W - 8} y1=${b} y2=${b}></line>
        </g>`;
      })}
      <g pointer-events="none">${this.ridges.map(
        (r) => svg`${txt(labelW, this.baseY(r.g) - 6, truncate(r.name, labelW - 4, AXIS_FONT, 700), { anchor: "end", strong: r.hi })}
          <line class="ui-rdl__median" ?data-hi=${r.hi} x1=${x(r.median)} x2=${x(r.median)} y1=${this.baseY(r.g) - 5} y2=${this.baseY(r.g)} opacity=${m.fade(r.g * this.stagger + D * 0.6, 260)}></line>`,
      )}</g>`;
  }

  static override css = /* css */ `
[data-ui="rdl"] {
  --tc-rdl-median: var(--tc-text-primary);
  --tc-rdl-median-on-accent: var(--tc-plot-bg);
}
.ui-rdl__ridge { fill-opacity: 0.92; }
.ui-rdl__ridge[data-hi] { fill-opacity: 0.88; }
.ui-rdl__line { fill: none; stroke: var(--tc-plot-line-rest); stroke-width: 1.2; stroke-linejoin: round; }
.ui-rdl__line[data-active] { stroke: var(--tc-plot-focus); stroke-width: 1.8; }
.ui-rdl__line[data-hi] { stroke: var(--tc-plot-accent); stroke-width: 1.8; }
.ui-rdl__median { stroke: var(--tc-rdl-median); stroke-width: 1.6; }
.ui-rdl__median[data-hi] { stroke: var(--tc-rdl-median-on-accent); }
@media (forced-colors: active) {
  .ui-rdl__ridge { forced-color-adjust: none; }
}
`;
}

if (!customElements.get("tc-ridgeline-chart")) customElements.define("tc-ridgeline-chart", TcRidgelineChart);

declare global {
  interface HTMLElementTagNameMap {
    "tc-ridgeline-chart": TcRidgelineChart;
  }
}
