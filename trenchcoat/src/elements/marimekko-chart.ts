import { html, nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { numGetter, strGetter, uniq } from "./internal/chart/accessor";
import { gridY, txt, yAxisWidth } from "./internal/chart/axis";
import { AXIS_FONT, TcChartElement, type ChartFrame, type ChartModel } from "./internal/chart/element";
import { roundRectPath, sum } from "./internal/chart/geometry";
import { resolveHighlight } from "./internal/chart/highlight";
import { scaleLinear } from "./internal/chart/scale";
import { truncate } from "./internal/chart/text";
import type { Accessor, Row, TooltipData } from "./internal/chart/types";

/*
 * <tc-marimekko-chart> – two shares at once: each column's width is its share of the whole, and the series stacked in
 * it fill it to 100%, so every block's area is its share of everything. Ported from ztd-charts' MarimekkoChart (MIT,
 * © 2026 Junhan2). The first series (or the one `highlight` names) takes the accent and the others the chart inks
 * after it, named in the legend; under each column its name and its share of the whole. The blocks rise column after
 * column when the chart comes on screen and glide – widths and heights – when the data changes.
 *   · one tab stop: arrows move block to block, column by column, each read with its share in the column and value
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-marimekko-chart heading="Spend by lab" .data=${[{ x: "Genomics", series: "Staff", value: 420 }, …]}></tc-marimekko-chart>
 */

/** Columns of stacked blocks: Lucide (ISC, lucide.dev) */
const marimekkoIcon = svg`<rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M12 3v18"></path><path d="M3 14h9"></path><path d="M12 9h9"></path>`;

type Seg<T> = { key: string; col: number; s: number; x: string; series: string; value: number; share: number; colShare: number; x0: number; x1: number; y0: number; y1: number; ink: string; hi: boolean; datum: T | null };

/** As waffle: the emphasised series the accent, a lone other the quiet ink, several others the inks after the accent's */
function seriesInks(n: number, hi: ReadonlySet<number>): string[] {
  if (!hi.size) return Array.from({ length: n }, (_, i) => `var(--tc-plot-ink-${(i % 6) + 1})`);
  const rest = n - [...hi].filter((i) => i < n).length;
  let j = 0;
  return Array.from({ length: n }, (_, i) => (hi.has(i) ? "var(--tc-plot-accent)" : rest === 1 ? "var(--tc-plot-rest)" : `var(--tc-plot-ink-${(j++ % 5) + 2})`));
}

/**
 * Columns as wide as their share of the whole, each stacked to 100% by series – two shares in one picture – with one
 * series emphasised, a legend and a table view.
 * @tag tc-marimekko-chart
 * @fires tc-view-change - The Table button was pressed ({ view }: ChartViewChange); cancelable – prevented, `view` stays as it was
 * @fires tc-mark-hover - The pointer or keyboard moved to a block, or off them ({ event }: ChartMarkHover)
 * @fires tc-mark-click - A block was clicked, or picked with Enter or Space ({ event }: ChartMarkClick)
 */
export class TcMarimekkoChart<T = Row> extends TcChartElement<Seg<T>, T> {
  static override ui = "mmk";

  /** The column field; by default "x" */
  @property({ attribute: false }) accessor x: Accessor<T, string> | undefined = undefined;
  /** The series field, stacked in each column; by default "series" */
  @property({ attribute: false }) accessor series: Accessor<T, string> | undefined = undefined;
  /** The value field; rows with the same column and series add up; by default "value" */
  @property({ attribute: false }) accessor value: Accessor<T, number> | undefined = undefined;

  protected override readonly kind = "Marimekko chart";
  protected override readonly icon = marimekkoIcon;
  protected override defaultDuration = 700;
  protected override stagger = 120;
  protected override modelKeys = ["x", "series", "value"];

  private segs: Seg<T>[] = [];
  private seriesNames: string[] = [];
  private inks: string[] = [];
  private cols: { name: string; mid: number; w: number; share: number }[] = [];
  private geo = { left: 0, top: 6, bottom: 34, y: scaleLinear([0, 100], [1, 0]) };

  protected override defaultHeight(w: number) {
    return Math.max(200, Math.min(270, w * 0.58));
  }

  protected override buildModel(f: ChartFrame): ChartModel<Seg<T>, T> {
    const { width: W, height: H } = f;
    const gx = strGetter(this.x, "x");
    const gs = strGetter(this.series, "series");
    const gv = numGetter(this.value, "value");
    const rows = this.data.map((d, i) => ({ d, x: gx(d, i), s: gs(d, i), v: Math.max(0, gv(d, i) || 0) }));
    const cols = uniq(rows.map((r) => r.x));
    const series = uniq(rows.map((r) => r.s));
    const val = new Map<string, { v: number; d: T }>();
    for (const r of rows) {
      const k = `${r.x}\u0000${r.s}`;
      val.set(k, { v: (val.get(k)?.v ?? 0) + r.v, d: r.d });
    }
    const colTot = cols.map((c) => sum(series.map((s) => val.get(`${c}\u0000${s}`)?.v ?? 0)));
    const total = sum(colTot) || 1;
    // `highlight` names series (or their indexes); a test gets each series' name
    const hi = resolveHighlight(this.highlight as never, series as never[], series, series.map(() => 0), "first");
    this.seriesNames = series;
    this.inks = seriesInks(series.length, hi);

    const left = yAxisWidth([0, 50, 100], (v) => f.pct(v), f.locale);
    const top = 6;
    const bottom = 34;
    const gap = 3;
    const plotW = W - left - 4;
    const y = scaleLinear([0, 100], [H - bottom, top]);
    this.geo = { left, top, bottom, y };

    const segs: Seg<T>[] = [];
    this.cols = [];
    let acc = 0;
    const usable = plotW - gap * Math.max(0, cols.length - 1);
    cols.forEach((c, ci) => {
      const w = (colTot[ci] / total) * usable;
      const x0 = left + 4 + acc;
      acc += w + gap;
      const colShare = (colTot[ci] / total) * 100;
      this.cols.push({ name: c, mid: x0 + w / 2, w, share: colShare });
      let ys = 0;
      series.forEach((s, si) => {
        const hit = val.get(`${c}\u0000${s}`);
        const v = hit?.v ?? 0;
        const share = colTot[ci] ? (v / colTot[ci]) * 100 : 0;
        segs.push({ key: `${c}|${s}`, col: ci, s: si, x: c, series: s, value: v, share, colShare, x0, x1: x0 + w, y0: ys, y1: ys + share, ink: this.inks[si], hi: hi.has(si), datum: hit?.d ?? null });
        ys += share;
      });
    });
    this.segs = segs;

    const marks = segs.map((sg) => ({
      key: sg.key,
      to: [sg.x0, sg.x1, y(sg.y0), y(sg.y1)],
      from: [sg.x0, sg.x1, y(0), y(0)],
      enter: [sg.x0, sg.x1, y(sg.y0), y(sg.y0)],
      delay: sg.col * this.stagger + sg.s * 40,
      data: sg,
    }));
    const events = segs.map((sg, k) => ({ datum: sg.datum, index: k, key: sg.key, label: sg.x, series: sg.series, value: sg.value, formatted: `${f.pct(sg.share)} · ${f.fv(sg.value)}` }));
    const summary = `Columns: ${cols.map((c, ci) => `${c} ${f.pct((colTot[ci] / total) * 100)}`).join(", ")}. Series: ${series.join(", ")}`;
    return { marks, events, summary };
  }

  protected override tip(i: number, f: ChartFrame): TooltipData | null {
    const sg = this.segs[i];
    if (!sg) return null;
    return {
      x: (sg.x0 + sg.x1) / 2,
      y: this.geo.y(sg.y1),
      title: `${sg.x} · ${sg.series}`,
      rows: [
        { label: "Share in column", value: f.pct(sg.share), color: sg.ink },
        { label: this.words.value, value: f.fv(sg.value) },
        { label: "Column share", value: f.pct(sg.colShare) },
      ],
    };
  }

  protected override headerLegend() {
    if (this.seriesNames.length < 2) return nothing;
    return html`<ul class="tc-chart__legend" aria-label="Series">
      ${this.seriesNames.map((s, si) => html`<li class="tc-chart__key"><span class="tc-chart__swatch" aria-hidden="true" style=${`background: ${this.inks[si]}`}></span>${s}</li>`)}
    </ul>`;
  }

  protected override tableHeader() {
    return "Column";
  }

  protected override draw(f: ChartFrame) {
    const { width: W, height: H } = f;
    const { left, bottom, y } = this.geo;
    const nS = this.seriesNames.length;
    const index = new Map(this.segs.map((sg, k) => [sg.key, k]));
    const r = 3;
    const m = this.motion;
    return svg`
      ${gridY({ ticks: [0, 50, 100], y, x0: left, x1: W, fmt: (v) => f.pct(v), locale: f.locale })}
      ${m.items.map((it) => {
        const sg = it.data;
        const [x0, x1, ya, yb] = it.v;
        const k = index.get(sg.key) ?? -1;
        const w = Math.max(0, x1 - x0);
        const h = Math.max(0, ya - yb);
        const isTop = sg.s === nS - 1;
        const isBottom = sg.s === 0;
        const corners = { tl: isTop ? r : 0, tr: isTop ? r : 0, bl: isBottom ? r : 0, br: isBottom ? r : 0 };
        const hv = this.hover(Math.max(0, k));
        return svg`<g class="tc-chart__mark" opacity=${it.exiting || k < 0 ? 0.5 : this.dim(k)} @pointerenter=${k >= 0 ? hv.enter : nothing} @click=${k >= 0 ? hv.click : nothing}>
          <path class="ui-mmk__block" ?data-parted=${h > 2} d=${roundRectPath(x0, yb, w, h, corners)} style=${`fill: ${sg.ink}`}></path>
          ${this.active === k && this.via === "keyboard" ? svg`<path class="tc-chart__focus" d=${roundRectPath(x0 - 2, yb - 2, w + 4, h + 4, 4)}></path>` : nothing}
        </g>`;
      })}
      <g>${this.cols.map((c) => svg`
        ${txt(c.mid, H - bottom + 12, truncate(c.name, c.w + 4, AXIS_FONT, 700), { anchor: "middle", strong: true })}
        ${txt(c.mid, H - bottom + 26, f.pct(c.share), { anchor: "middle" })}`)}</g>`;
  }

  static override css = /* css */ `
/* Blocks are parted by a line of the card's colour */
.ui-mmk__block[data-parted] { stroke: var(--tc-plot-bg); stroke-width: 1.5; }
@media (forced-colors: active) {
  .ui-mmk__block { forced-color-adjust: none; }
}
`;
}

if (!customElements.get("tc-marimekko-chart")) customElements.define("tc-marimekko-chart", TcMarimekkoChart);

declare global {
  interface HTMLElementTagNameMap {
    "tc-marimekko-chart": TcMarimekkoChart;
  }
}
