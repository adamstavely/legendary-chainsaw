import { nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { numGetter, strGetter } from "./internal/chart/accessor";
import { txt } from "./internal/chart/axis";
import { AXIS_FONT, TcChartElement, type ChartFrame, type ChartModel } from "./internal/chart/element";
import { roundRectPath } from "./internal/chart/geometry";
import { resolveHighlight } from "./internal/chart/highlight";
import { niceDomain, scaleLinear } from "./internal/chart/scale";
import { textWidth, wrapLines } from "./internal/chart/text";
import type { Accessor, Row, TooltipData } from "./internal/chart/types";

/*
 * <tc-bullet-chart> – each measure against its target and its qualitative ranges (poor, fair, good), one row per
 * measure. Ported from ztd-charts' Bullet chart (MIT, © 2026 Junhan2). The bar is the actual value, the tick the
 * target, the shaded bands behind them the ranges, darkest the furthest. The row furthest behind its target takes the
 * accent (`highlight` picks others); each row has its own scale unless `independent` is false, which shares one with
 * its values underneath. `range-tone="status"` paints the bands from the danger to the success tint. Bars grow from the
 * left when the chart comes on screen and glide when the data changes.
 *   · one tab stop: arrows move row to row, each read with its value, target and how much of it is reached
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-bullet-chart heading="Audit readiness" .data=${[{ label: "Biosafety", value: 72, target: 85, poor: 50, ok: 75 }]}
 *     .ranges=${["poor", "ok"]}></tc-bullet-chart>
 */

/** A bullet chart: Lucide's chart-bar-big (ISC, lucide.dev) */
const bulletIcon = svg`<path d="M3 3v16a2 2 0 0 0 2 2h16"></path><rect x="7" y="13" width="9" height="4" rx="1"></rect><rect x="7" y="5" width="12" height="4" rx="1"></rect>`;

export type BulletRangeTone = "neutral" | "status";

type BulletRow<T> = { i: number; label: string; value: number; target: number; ranges: number[]; max: number; hi: boolean; datum: T };

const ROW_H = 40;
const onByDefault = { fromAttribute: (v: string | null) => v !== "false" };

/**
 * Measures against their targets and qualitative ranges, one row each, with the one furthest behind emphasised, the
 * values at the right and a table view.
 * @tag tc-bullet-chart
 * @fires tc-view-change - The Table button was pressed ({ view }: ChartViewChange); cancelable – prevented, `view` stays as it was
 * @fires tc-mark-hover - The pointer or keyboard moved to a row, or off them ({ event }: ChartMarkHover)
 * @fires tc-mark-click - A row was clicked, or picked with Enter or Space ({ event }: ChartMarkClick)
 */
export class TcBulletChart<T = Row> extends TcChartElement<BulletRow<T>, T> {
  static override ui = "blt";

  /** The measure's name field; by default "label" */
  @property({ attribute: false }) accessor label: Accessor<T, string> | undefined = undefined;
  /** The actual value field; by default "value" */
  @property({ attribute: false }) accessor value: Accessor<T, number> | undefined = undefined;
  /** The target field; by default "target" */
  @property({ attribute: false }) accessor target: Accessor<T, number> | undefined = undefined;
  /** The range bounds' fields, from the lowest: ["poor", "ok", "good"] */
  @property({ attribute: false }) accessor ranges: string[] = [];
  /** Each row on its own scale (true), or one scale for all, written underneath (independent="false") */
  @property({ converter: onByDefault }) accessor independent = true;
  /** The bands in quiet shades ("neutral"), or from the danger to the success tint ("status") */
  @property({ attribute: "range-tone" }) accessor rangeTone: BulletRangeTone = "neutral";

  protected override readonly kind = "Bullet chart";
  protected override readonly icon = bulletIcon;
  protected override defaultDuration = 800;
  protected override stagger = 110;
  protected override modelKeys = ["label", "value", "target", "ranges", "independent"];

  private rows: BulletRow<T>[] = [];
  private g = { x0: 0, x1: 0, labelW: 0, band: 0, barH: 0, rangeH: 0, axisH: 0, globalMax: 1 };

  protected override defaultHeight() {
    return Math.max(90, this.data.length * ROW_H + 8) + (this.independent ? 0 : 16);
  }

  protected override tableHeader() {
    return "Measure";
  }

  private scale(r: BulletRow<T>) {
    return scaleLinear([0, this.independent ? r.max : this.g.globalMax], [this.g.x0, this.g.x1]);
  }
  private cy(k: number) {
    return 4 + this.g.band * k + this.g.band / 2;
  }

  protected override buildModel(f: ChartFrame): ChartModel<BulletRow<T>, T> {
    const { width: W, height: H } = f;
    const gl = strGetter(this.label, "label");
    const gv = numGetter(this.value, "value");
    const gt = numGetter(this.target, "target");
    const base = this.data.map((d, i) => {
      const v = gv(d, i);
      const t = gt(d, i);
      const ranges = this.ranges.map((k) => numGetter<T>(k, k)(d, i)).filter(Number.isFinite);
      const max = niceDomain(0, Math.max(v || 0, t || 0, ...ranges), 4)[1];
      // A missing value stays NaN: drawn as nothing and written "–", never read as 0
      return { i, label: gl(d, i), value: v, target: t, ranges, max, hi: false, datum: d };
    });
    // The lowest share of its target is emphasised by default
    const ratios = base.map((r) => (Number.isFinite(r.target) && r.target ? r.value / r.target : Infinity));
    const hi = resolveHighlight(this.highlight, base.map((r) => r.datum), base.map((r) => r.label), ratios, "min");
    const rows = base.map((r) => ({ ...r, hi: hi.has(r.i) }));
    this.rows = rows;

    const fx = (v: number) => (Number.isFinite(v) ? f.fmt(v) : "–");
    const fvx = (v: number) => (Number.isFinite(v) ? f.fv(v) : "–");
    const axisH = this.independent ? 0 : 16;
    const labelW = Math.min(W * 0.34, Math.max(...rows.map((r) => textWidth(r.label, AXIS_FONT, 600)), 30) + 10);
    const valW = this.hideLabels ? 4 : Math.max(...rows.map((r) => textWidth(fx(r.value), AXIS_FONT, 700)), 20) + 12;
    const band = (H - 8 - axisH) / Math.max(1, rows.length);
    this.g = {
      x0: labelW + 6,
      x1: W - valW,
      labelW,
      band,
      barH: Math.max(6, Math.min(12, band * 0.26)),
      rangeH: Math.max(12, Math.min(26, band * 0.58)),
      axisH,
      globalMax: Math.max(...rows.map((r) => r.max), 1),
    };
    const x0 = this.g.x0;
    const marks = rows.map((r, k) => {
      const sx = this.scale(r);
      const tx = Number.isFinite(r.target) ? sx(r.target) : x0;
      return { key: `b:${r.label}`, to: [sx(r.value || 0), tx, 1], from: [x0, tx, 0], enter: [x0, x0, 0], delay: k * this.stagger, data: r };
    });
    const events = rows.map((r) => ({
      datum: r.datum,
      index: r.i,
      key: r.label,
      label: r.label,
      value: Number.isFinite(r.value) ? r.value : null,
      formatted: `${fvx(r.value)}${Number.isFinite(r.target) ? ` / target ${f.fv(r.target)}${Number.isFinite(r.value) ? ` (${f.pct((r.value / (r.target || 1)) * 100)})` : ""}` : ""}`,
    }));
    const summary = rows.map((r) => `${r.label} ${fvx(r.value)}${Number.isFinite(r.target) ? ` (target ${f.fv(r.target)})` : ""}`).join(", ");
    return { marks, events, summary };
  }

  protected override tip(i: number, f: ChartFrame): TooltipData | null {
    const r = this.rows[i];
    if (!r) return null;
    const value = Number.isFinite(r.value) ? f.fv(r.value) : "–";
    return {
      x: this.scale(r)(r.value || 0),
      y: this.cy(r.i) - this.g.rangeH / 2,
      title: r.label,
      rows: [
        { label: "Actual", value, color: r.hi ? "var(--tc-plot-accent)" : "var(--tc-blt-ink)" },
        ...(Number.isFinite(r.target) ? [{ label: "Target", value: f.fv(r.target) }, { label: "Achieved", value: f.pct((r.value / (r.target || 1)) * 100) }] : []),
      ],
    };
  }

  protected override draw(f: ChartFrame) {
    const { width: W, height: H } = f;
    const { x0, x1, labelW, band, barH, rangeH, globalMax } = this.g;
    const m = this.motion;
    const tone = this.rangeTone === "status" ? "status" : "neutral";
    return svg`
      ${m.items.map((it) => {
        // Rows go by their place now (r.i); one leaving would sit where a new one is, so it isn't drawn
        if (it.exiting) return nothing;
        const r = it.data;
        const k = r.i;
        const sx = this.scale(r);
        const cy = this.cy(k);
        const [vx, tx, o] = it.v;
        const edges = [0, ...r.ranges, r.max].filter((v, j, a) => j === 0 || v > a[j - 1]);
        const nb = edges.length - 1;
        const focus = this.active === k && this.via === "keyboard";
        const h = this.hover(k);
        return svg`<g class="tc-chart__mark" opacity=${this.dim(k)} @pointerenter=${h.enter} @click=${h.click}>
          <rect class="tc-chart__hit" x="0" y=${cy - band / 2} width=${W} height=${band}></rect>
          ${edges.slice(0, -1).map((e0, j) => {
            const e1 = edges[j + 1];
            // Three shades from the nearest band to the furthest; a lone band (no ranges) is the lightest
            const level = nb < 2 ? "none" : String(Math.round((j / (nb - 1)) * 2));
            const corners = { tl: j === 0 ? 3 : 0, bl: j === 0 ? 3 : 0, tr: j === nb - 1 ? 3 : 0, br: j === nb - 1 ? 3 : 0 };
            return svg`<path class="ui-blt__range" data-tone=${tone} data-level=${level} d=${roundRectPath(sx(e0), cy - rangeH / 2, sx(e1) - sx(e0), rangeH, corners)} opacity=${0.35 + 0.65 * o}></path>`;
          })}
          <path class="ui-blt__bar" ?data-hi=${r.hi} d=${roundRectPath(x0, cy - barH / 2, Math.max(0, vx - x0), barH, 2)}></path>
          ${Number.isFinite(r.target) ? svg`<line class="ui-blt__target" x1=${tx} x2=${tx} y1=${cy - rangeH / 2 - 2} y2=${cy + rangeH / 2 + 2} opacity=${o}></line>` : nothing}
          ${focus ? svg`<rect class="tc-chart__focus" x=${x0 - 3} y=${cy - rangeH / 2 - 4} width=${x1 - x0 + 6} height=${rangeH + 8} rx="5"></rect>` : nothing}
          ${wrapLines(r.label, labelW - 4, AXIS_FONT, band >= 34 ? 2 : 1, 700).map((line, j, lines) => txt(labelW, cy + (j - (lines.length - 1) / 2) * 13, line, { anchor: "end", strong: r.hi }))}
          ${this.hideLabels ? nothing : txt(W - 2, cy, Number.isFinite(r.value) ? f.fmt(r.value) : "–", { anchor: "end", cls: "value", strong: r.hi, opacity: m.fade(k * this.stagger + 300, 260) })}
        </g>`;
      })}
      ${this.independent
        ? nothing
        : svg`<g>${scaleLinear([0, globalMax], [x0, x1])
            .ticks(4)
            .map((t) => txt(scaleLinear([0, globalMax], [x0, x1])(t), H - 9, f.fmt(t), { anchor: "middle" }))}</g>`}`;
  }

  static override css = /* css */ `
/* The bar and target in the strongest ink; the bands in three quiet shades, or the status tints */
[data-ui="blt"] {
  --tc-blt-ink: var(--tc-text-primary);
  --tc-blt-range-1: color-mix(in oklab, var(--tc-plot-rest) 45%, transparent);
  --tc-blt-range-2: color-mix(in oklab, var(--tc-plot-rest) 75%, transparent);
  --tc-blt-range-3: var(--tc-plot-rest);
  --tc-blt-range-low: var(--tc-status-danger-bg);
  --tc-blt-range-mid: var(--tc-status-warning-bg);
  --tc-blt-range-high: var(--tc-status-success-bg);
}
.ui-blt__range, .ui-blt__range[data-level="0"] { fill: var(--tc-blt-range-1); }
.ui-blt__range[data-level="1"] { fill: var(--tc-blt-range-2); }
.ui-blt__range[data-level="2"] { fill: var(--tc-blt-range-3); }
.ui-blt__range[data-tone="status"][data-level="0"] { fill: var(--tc-blt-range-low); }
.ui-blt__range[data-tone="status"][data-level="1"] { fill: var(--tc-blt-range-mid); }
.ui-blt__range[data-tone="status"][data-level="2"] { fill: var(--tc-blt-range-high); }
.ui-blt__bar { fill: var(--tc-blt-ink); }
.ui-blt__bar[data-hi] { fill: var(--tc-plot-accent); }
.ui-blt__target { stroke: var(--tc-blt-ink); stroke-width: 2.5; stroke-linecap: round; }
@media (forced-colors: active) {
  .ui-blt__range, .ui-blt__bar, .ui-blt__target { forced-color-adjust: none; }
}
`;
}

if (!customElements.get("tc-bullet-chart")) customElements.define("tc-bullet-chart", TcBulletChart);

declare global {
  interface HTMLElementTagNameMap {
    "tc-bullet-chart": TcBulletChart;
  }
}
