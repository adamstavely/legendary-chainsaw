import { nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { axisXBand, gridY, yAxisWidth } from "./internal/chart/axis";
import { emphasisInk, TcChartElement, type ChartFrame, type ChartModel } from "./internal/chart/element";
import { makeTickFormatter } from "./internal/chart/format";
import { roundRectPath } from "./internal/chart/geometry";
import { resolveHighlight } from "./internal/chart/highlight";
import { numGetter, strGetter, uniq } from "./internal/chart/accessor";
import { extent, fitDomain, scaleBand, scaleLinear } from "./internal/chart/scale";
import { boxStats, kde, type BoxStats } from "./internal/chart/stats";
import type { Accessor, Row, TooltipData } from "./internal/chart/types";

/*
 * <tc-box-plot> – how values spread within each group: the quartiles as a box, the median across it, whiskers to
 * 1.5 IQR and the outliers beyond as rings; or the same as violins (a density curve mirrored round the middle), or
 * both. Ported from ztd-charts' BoxPlot (MIT, © 2026 Junhan2). The group with the highest median takes the accent and
 * the rest stay quiet (`highlight` picks others, by group name). Boxes open out from their medians when the chart
 * comes on screen and glide when the data changes.
 *   · one tab stop: arrows move group to group, each read with its median and quartiles
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-box-plot heading="Assay turnaround" .data=${[{ group: "Genomics", value: 3.2 }, …]}></tc-box-plot>
 */

/** A box plot: two boxes with whiskers and medians, drawn in the Lucide style (24 × 24, 2px strokes) */
const boxIcon = svg`<path d="M3 3v16a2 2 0 0 0 2 2h16"></path><path d="M9 5v4"></path><path d="M9 15v2"></path><rect width="4" height="6" x="7" y="9" rx="1"></rect><path d="M17 3v4"></path><path d="M17 13v2"></path><rect width="4" height="6" x="15" y="7" rx="1"></rect><path d="M7 12h4"></path><path d="M15 10h4"></path>`;

export type BoxPlotVariant = "box" | "violin" | "both";

/** The words a box plot adds to the shared ones */
export type BoxPlotLabels = {
  max: string;
  q3: string;
  median: string;
  q1: string;
  min: string;
  n: string;
  /** "{count} outlier" after the sample size, for one */
  outlier: string;
  /** "{count} outliers" after the sample size, for more */
  outliers: string;
  /** "median {median}, IQR {q1} to {q3}" – a group as read and in the table */
  summary: string;
};
export const defaultBoxPlotLabels: BoxPlotLabels = {
  max: "Max (whisker)",
  q3: "Q3",
  median: "Median",
  q1: "Q1",
  min: "Min (whisker)",
  n: "Sample size",
  outlier: "{count} outlier",
  outliers: "{count} outliers",
  summary: "median {median}, IQR {q1} to {q3}",
};

type Box = { g: number; name: string; st: BoxStats; dens: number[]; hi: boolean };

/** Density samples down a violin */
const VS = 48;
const fill = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));

/**
 * How values spread within each group, as boxes with whiskers and outliers or as violins, the group with the highest
 * median emphasised, with a table view.
 * @tag tc-box-plot
 * @fires tc-view-change - The Table button was pressed ({ view }: ChartViewChange); cancelable – prevented, `view` stays as it was
 * @fires tc-mark-hover - The pointer or keyboard moved to a group, or off them ({ event }: ChartMarkHover)
 * @fires tc-mark-click - A group was clicked, or picked with Enter or Space ({ event }: ChartMarkClick)
 */
export class TcBoxPlot<T = Row> extends TcChartElement<Box, T> {
  static override ui = "bxp";

  /** The group field; by default "group" */
  @property({ attribute: false }) accessor group: Accessor<T, string> | undefined = undefined;
  /** The value field; by default "value" */
  @property({ attribute: false }) accessor value: Accessor<T, number> | undefined = undefined;
  /** Boxes ("box"), density curves ("violin"), or a slim box inside each violin ("both") */
  @property() accessor variant: BoxPlotVariant = "box";
  /** Leaves out the rings for values beyond the whiskers */
  @property({ type: Boolean, attribute: "hide-outliers" }) accessor hideOutliers = false;
  /** Starts the value axis at zero */
  @property({ type: Boolean }) accessor zero = false;
  /** The box plot's own words, merged over defaultBoxPlotLabels */
  @property({ attribute: false }) accessor boxLabels: Partial<BoxPlotLabels> = {};

  protected override get kind() {
    return this.variant === "box" ? "Box plot" : "Violin plot";
  }
  protected override readonly icon = boxIcon;
  protected override defaultDuration = 850;
  protected override stagger = 90;
  protected override modelKeys = ["group", "value", "variant", "hideOutliers", "zero", "boxLabels"];

  private boxes: Box[] = [];
  private geo = {
    ys: [] as number[],
    peak: 1,
    left: 0,
    top: 10,
    bottom: 22,
    bw: 0,
    ticks: [] as number[],
    tickFmt: ((v: number) => String(v)) as (v: number) => string,
    band: scaleBand([], [0, 1]),
    y: scaleLinear([0, 1], [0, 1]),
  };

  private get boxWords(): BoxPlotLabels {
    return { ...defaultBoxPlotLabels, ...this.boxLabels };
  }

  protected override defaultHeight(w: number) {
    return Math.max(200, Math.min(300, w * 0.55));
  }

  protected override tableHeader() {
    return "Group";
  }

  protected override buildModel(f: ChartFrame): ChartModel<Box, T> {
    const { width: W, height: H } = f;
    const variant = this.variant;
    const gg = strGetter(this.group, "group");
    const gv = numGetter(this.value, "value");
    const allNames = uniq(this.data.map((d, i) => gg(d, i)));
    const by = new Map<string, number[]>(allNames.map((n) => [n, []]));
    this.data.forEach((d, i) => {
      const v = gv(d, i);
      if (Number.isFinite(v)) by.get(gg(d, i))!.push(v);
    });
    // A group with no values has no quartiles: left out
    const names = allNames.filter((n) => by.get(n)!.length > 0);
    const stats = names.map((n) => boxStats(by.get(n)!));
    const all = [...by.values()].flat();
    const [mn, mx] = extent(all.length ? all : [0, 1]);
    const dom = fitDomain(mn, mx, 4, { zero: this.zero, pad: 0.06 });
    const ys = Array.from({ length: VS }, (_, k) => dom[0] + ((dom[1] - dom[0]) * k) / (VS - 1));
    const dens = variant === "box" ? names.map(() => [] as number[]) : names.map((n) => kde(by.get(n)!, ys));
    // A test gets the group's name, not a row
    const hi = resolveHighlight(this.highlight as never, names as never[], names, stats.map((s) => s.median), "max");
    const boxes: Box[] = names.map((name, g) => ({ g, name, st: stats[g], dens: dens[g], hi: hi.has(g) }));
    this.boxes = boxes;
    const peak = Math.max(1e-9, ...dens.flat());

    const tickFmt = makeTickFormatter(this.format, f.locale, Math.max(Math.abs(dom[0]), Math.abs(dom[1])));
    const top = 10;
    const bottom = 22;
    const ticks = scaleLinear(dom, [0, 1]).ticks(Math.max(2, Math.round(H / 70)));
    const left = yAxisWidth(ticks, tickFmt, f.locale);
    const y = scaleLinear(dom, [H - bottom, top]);
    const band = scaleBand(names, [left + 4, W - 4], 0.35, 0.15);
    const bw = Math.min(band.bandwidth, 64);
    this.geo = { ys, peak, left, top, bottom, bw, ticks, tickFmt, band, y };

    const marks = boxes.map((b, k) => {
      const med = y(b.st.median);
      return { key: `b:${b.name}`, to: [y(b.st.q1), y(b.st.q3), y(b.st.lo), y(b.st.hi), med, 1], from: [med, med, med, med, med, 0], enter: [med, med, med, med, med, 0], delay: k * this.stagger, data: b };
    });
    const w = this.boxWords;
    const events = boxes.map((b) => ({
      datum: null,
      index: b.g,
      key: b.name,
      label: b.name,
      value: b.st.median,
      formatted: fill(w.summary, { median: f.fv(b.st.median), q1: f.fv(b.st.q1), q3: f.fv(b.st.q3) }),
    }));
    const summary = boxes.map((b) => `${b.name} median ${f.fv(b.st.median)}`).join(", ");
    return { marks, events, summary };
  }

  protected override tip(i: number, f: ChartFrame): TooltipData | null {
    const b = this.boxes[i];
    if (!b) return null;
    const { band, y } = this.geo;
    const w = this.boxWords;
    const out = b.st.outliers.length;
    return {
      x: band(b.name) + band.bandwidth / 2,
      y: y(b.st.hi),
      title: b.name,
      rows: [
        { label: w.max, value: f.fv(b.st.hi), strong: false },
        { label: w.q3, value: f.fv(b.st.q3), strong: false },
        { label: w.median, value: f.fv(b.st.median), color: emphasisInk(b.hi) },
        { label: w.q1, value: f.fv(b.st.q1), strong: false },
        { label: w.min, value: f.fv(b.st.lo), strong: false },
        { label: w.n, value: `${b.st.n}${out ? ` · ${fill(out === 1 ? w.outlier : w.outliers, { count: out })}` : ""}`, strong: false },
      ],
    };
  }

  protected override draw(f: ChartFrame) {
    const { width: W, height: H } = f;
    const { ys, peak, left, top, bottom, bw, ticks, tickFmt, band, y } = this.geo;
    const variant = this.variant;
    const m = this.motion;
    return svg`
      ${gridY({ ticks, y, x0: left, x1: W, fmt: tickFmt, locale: f.locale })}
      ${m.items.map((it) => {
        const b = it.data;
        const [q1, q3, lo, hi, med, o] = it.v;
        const cx = band(b.name) + band.bandwidth / 2;
        const ink = emphasisInk(b.hi);
        const half = variant === "box" ? bw / 2 : bw * 0.18;
        let violin: unknown = nothing;
        if (variant !== "box") {
          const wmax = Math.min(band.bandwidth / 2, 40);
          const pts = ys.map((v, k) => [cx + (b.dens[k] / peak) * wmax * o, y(v)] as const);
          const back = [...pts].reverse().map(([px, py]) => [cx - (px - cx), py] as const);
          const d = `M${[...pts, ...back].map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join("L")}Z`;
          violin = svg`<path class="ui-bxp__violin" d=${d} style=${`fill: ${ink}`} ?data-hi=${b.hi}></path>`;
        }
        const focus = this.active === b.g && this.via === "keyboard";
        const boxD = roundRectPath(cx - half, Math.min(q1, q3), half * 2, Math.abs(q1 - q3), Math.min(4, half / 2));
        const h = this.hover(b.g);
        return svg`<g class="tc-chart__mark" opacity=${it.exiting ? 0.4 : this.dim(b.g)} @pointerenter=${h.enter} @click=${h.click}>
          <rect class="tc-chart__hit" x=${cx - band.step / 2} y=${top} width=${band.step} height=${Math.max(0, H - top - bottom)}></rect>
          ${violin}
          <line class="ui-bxp__whisker" ?data-hi=${b.hi && variant === "box"} x1=${cx} x2=${cx} y1=${hi} y2=${q3}></line>
          <line class="ui-bxp__whisker" ?data-hi=${b.hi && variant === "box"} x1=${cx} x2=${cx} y1=${q1} y2=${lo}></line>
          ${variant === "box"
            ? svg`<line class="ui-bxp__whisker" x1=${cx - bw * 0.22} x2=${cx + bw * 0.22} y1=${hi} y2=${hi}></line>
                <line class="ui-bxp__whisker" x1=${cx - bw * 0.22} x2=${cx + bw * 0.22} y1=${lo} y2=${lo}></line>`
            : nothing}
          <path class="ui-bxp__box" d=${boxD} style=${variant === "box" ? `fill: ${ink}` : nothing} ?data-inner=${variant !== "box"} ?data-hi=${b.hi}></path>
          <line class="ui-bxp__median" x1=${cx - half} x2=${cx + half} y1=${med} y2=${med} ?data-hi=${b.hi} ?data-inner=${variant !== "box"}></line>
          ${focus ? svg`<path class="tc-chart__focus" d=${roundRectPath(cx - half - 3, Math.min(q1, q3, hi) - 3, half * 2 + 6, Math.abs(Math.max(q1, q3, lo) - Math.min(q1, q3, hi)) + 6, 4)}></path>` : nothing}
          ${this.hideOutliers ? nothing : b.st.outliers.map((v) => svg`<circle class="ui-bxp__outlier" ?data-hi=${b.hi} cx=${cx} cy=${y(v)} r="2.6" opacity=${o}></circle>`)}
        </g>`;
      })}
      ${axisXBand({ labels: this.boxes.map((b) => b.name), centers: this.boxes.map((b) => band(b.name) + band.bandwidth / 2), y: H - bottom + 13, strong: new Set(this.boxes.filter((b) => b.hi).map((b) => b.g)) })}`;
  }

  static override css = /* css */ `
[data-ui="bxp"] {
  --tc-bxp-median: var(--tc-text-primary);
  --tc-bxp-median-on-accent: var(--tc-plot-bg);
  --tc-bxp-inner: var(--tc-text-primary);
}
.ui-bxp__whisker { stroke: var(--tc-plot-line-rest); stroke-width: 1.4; }
.ui-bxp__whisker[data-hi] { stroke: var(--tc-plot-accent); }
.ui-bxp__violin { fill-opacity: 0.9; stroke: var(--tc-plot-line-rest); stroke-width: 1; }
.ui-bxp__violin[data-hi] { fill-opacity: 0.85; stroke: var(--tc-plot-accent); }
/* Inside a violin the box is slim and dark, its median a line of the card's colour */
.ui-bxp__box[data-inner] { fill: var(--tc-bxp-inner); fill-opacity: 0.9; }
.ui-bxp__box[data-inner][data-hi] { fill: var(--tc-bxp-median-on-accent); }
.ui-bxp__median { stroke: var(--tc-bxp-median); stroke-width: 2.2; }
.ui-bxp__median[data-hi] { stroke: var(--tc-bxp-median-on-accent); }
.ui-bxp__median[data-inner] { stroke: var(--tc-plot-bg); }
.ui-bxp__median[data-inner][data-hi] { stroke: var(--tc-plot-accent); }
.ui-bxp__outlier { fill: none; stroke: var(--tc-plot-line-rest); stroke-width: 1.3; }
.ui-bxp__outlier[data-hi] { stroke: var(--tc-plot-accent); }
@media (forced-colors: active) {
  .ui-bxp__box, .ui-bxp__violin { forced-color-adjust: none; }
}
`;
}

if (!customElements.get("tc-box-plot")) customElements.define("tc-box-plot", TcBoxPlot);

declare global {
  interface HTMLElementTagNameMap {
    "tc-box-plot": TcBoxPlot;
  }
}
