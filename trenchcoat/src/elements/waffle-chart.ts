import { html, nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { keyed } from "lit/directives/keyed.js";
import { reducedMotion } from "../internal/reduced-motion";
import { numGetter, strGetter } from "./internal/chart/accessor";
import { txt } from "./internal/chart/axis";
import { AXIS_FONT, TcChartElement, type ChartFrame, type ChartModel } from "./internal/chart/element";
import { sum } from "./internal/chart/geometry";
import { resolveHighlight } from "./internal/chart/highlight";
import { textWidth, truncate } from "./internal/chart/text";
import type { Accessor, Row, TooltipData } from "./internal/chart/types";

/*
 * <tc-waffle-chart> – shares of a whole as a grid of cells (100 by default, ten to a row), each category filling its
 * share of them in reading order. Ported from ztd-charts' WaffleChart (MIT, © 2026 Junhan2). The first category (or
 * the one `highlight` picks) takes the accent and its share is written large beside the grid with its name and the
 * rest's values under it; the other categories take the chart inks in order and the cells left over stay quiet. The
 * cells pop in one after another when the chart comes on screen and the figure counts up; when the data changes the
 * cells change ink and the figure glides.
 *   · one tab stop: arrows move category to category, each read with its value and share
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-waffle-chart heading="Compute by lab" .data=${[{ label: "Genomics", value: 42 }, …]}></tc-waffle-chart>
 */

/** A grid of squares: Lucide (ISC, lucide.dev) */
const waffleIcon = svg`<rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect>`;

/**
 * Hands out `cells` cells by the largest remainder, so the counts add up to exactly `cells` – or, with a `total` above
 * the values' sum, to their share of it
 */
export function allocateCells(values: readonly number[], cells: number, total?: number): number[] {
  // A total below the sum would hand out more cells than there are
  const t = Math.max(total ?? 0, sum(values));
  if (!(t > 0)) return values.map(() => 0);
  const exact = values.map((v) => (Math.max(0, v) / t) * cells);
  const out = exact.map((x) => Math.floor(x));
  const target = total === undefined ? cells : Math.min(cells, Math.round((sum(values) / t) * cells));
  let left = target - sum(out);
  const order = exact.map((x, i) => ({ r: x - Math.floor(x), i })).sort((a, b) => b.r - a.r);
  for (let k = 0; left > 0 && k < order.length; k++, left--) out[order[k].i]++;
  return out;
}

/**
 * The inks of categories where some are emphasised: those the accent, a lone other the quiet ink, several others the
 * chart inks after the accent's in order. Nothing emphasised: the chart inks in order
 */
function emphasisCategorical(n: number, hi: ReadonlySet<number>): string[] {
  if (!hi.size) return Array.from({ length: n }, (_, i) => `var(--tc-plot-ink-${(i % 6) + 1})`);
  const rest = n - [...hi].filter((i) => i < n).length;
  let j = 0;
  return Array.from({ length: n }, (_, i) => (hi.has(i) ? "var(--tc-plot-accent)" : rest === 1 ? "var(--tc-plot-rest)" : `var(--tc-plot-ink-${(j++ % 5) + 2})`));
}

type WaffleRow<T> = { d: T; label: string; value: number };

/**
 * Shares of a whole as a grid of cells, one category emphasised with its share written large beside it, the rest in
 * the chart inks, with a table view.
 * @tag tc-waffle-chart
 * @fires tc-view-change - The Table button was pressed ({ view }: ChartViewChange); cancelable – prevented, `view` stays as it was
 * @fires tc-mark-hover - The pointer or keyboard moved to a category, or off them ({ event }: ChartMarkHover)
 * @fires tc-mark-click - A category's cell was clicked, or the category picked with Enter or Space ({ event }: ChartMarkClick)
 */
export class TcWaffleChart<T = Row> extends TcChartElement<null, T> {
  static override ui = "wff";

  /** The category field; by default "label" */
  @property({ attribute: false }) accessor label: Accessor<T, string> | undefined = undefined;
  /** The value field; by default "value" */
  @property({ attribute: false }) accessor value: Accessor<T, number> | undefined = undefined;
  /** How many cells the grid has */
  @property({ type: Number }) accessor cells = 100;
  /** How many cells to a row */
  @property({ type: Number }) accessor columns = 10;
  /** The whole the values are shares of; by default their sum. Above it, the cells left over stay empty */
  @property({ type: Number }) accessor total: number | undefined = undefined;
  /** Leaves out the large share beside the grid */
  @property({ type: Boolean, attribute: "hide-summary" }) accessor hideSummary = false;
  /** The words under the large share; by default the emphasised category's name */
  @property({ attribute: "summary-label" }) accessor summaryLabel: string | undefined = undefined;
  /** The line under those; by default the other categories with their values */
  @property({ attribute: "summary-note" }) accessor summaryNote: string | undefined = undefined;

  protected override readonly kind = "Waffle chart";
  protected override readonly icon = waffleIcon;
  protected override defaultDuration = 1000;
  protected override modelKeys = ["label", "value", "cells", "columns", "total", "hideSummary", "summaryLabel", "summaryNote"];

  private rows: WaffleRow<T>[] = [];
  private counts: number[] = [];
  private inks: string[] = [];
  private owner: number[] = [];
  private hiIdx = -1;
  private sumTotal = 0;
  private geo = { n: 100, cols: 10, cell: 0, gap: 0, gx: 0, gy: 0, sx: 0, sw: 0, big: 28, summary: false, pct: 0, note: "" };

  protected override defaultHeight(w: number) {
    return Math.max(160, Math.min(230, w * 0.5));
  }

  private share(v: number) {
    return this.sumTotal > 0 ? (v / this.sumTotal) * 100 : 0;
  }

  protected override buildModel(f: ChartFrame): ChartModel<null, T> {
    const { width: W, height: H } = f;
    const n = Math.max(1, Math.round(this.cells || 100));
    const cols = Math.max(1, Math.round(this.columns || 10));
    const rowsN = Math.ceil(n / cols);
    const gl = strGetter(this.label, "label");
    const gv = numGetter(this.value, "value");
    const rows = this.data.map((d, i) => ({ d, label: gl(d, i), value: Math.max(0, gv(d, i) || 0) }));
    const hi = resolveHighlight(this.highlight, rows.map((r) => r.d), rows.map((r) => r.label), rows.map((r) => r.value), "first");
    const counts = allocateCells(rows.map((r) => r.value), n, this.total);
    this.rows = rows;
    this.counts = counts;
    this.sumTotal = this.total ?? sum(rows.map((r) => r.value));
    this.inks = emphasisCategorical(rows.length, hi);
    this.owner = counts.flatMap((c, k) => Array.from({ length: c }, () => k));
    // With highlight "none" nothing is featured, so the large share (which reads as the emphasised one's) is left out
    this.hiIdx = [...hi][0] ?? -1;
    const hiRow = rows[this.hiIdx];
    const pct = hiRow ? this.share(hiRow.value) : 0;

    const summary = !this.hideSummary && W >= 260 && !!hiRow;
    const gap = W < 360 ? 2.5 : 3.5;
    const gridMaxW = summary ? W * 0.58 : W;
    const cell = Math.max(3, Math.min((gridMaxW - (cols - 1) * gap) / cols, (H - (rowsN - 1) * gap) / rowsN));
    const gridW = cols * cell + (cols - 1) * gap;
    const gridH = rowsN * cell + (rowsN - 1) * gap;
    const gy = (H - gridH) / 2;
    // The grid and the summary are centred as one, so a wide card isn't left half empty
    const note = this.summaryNote ?? rows.filter((_, k) => !hi.has(k)).map((r) => `${r.label} ${f.fv(r.value)}`).join(" · ");
    const gapS = Math.max(14, (W - gridW) * 0.12);
    const room = W - gridW - gapS;
    const big = room * 0.32 < 28 || H * 0.24 < 28 ? 24 : 28;
    const sumW = summary ? Math.min(room, Math.max(textWidth(f.pct(pct), big, 800), textWidth(this.summaryLabel ?? hiRow.label, 12, 700), note ? textWidth(note, AXIS_FONT) : 0)) : 0;
    const gx = summary ? Math.max(0, (W - (gridW + gapS + sumW)) / 2) : (W - gridW) / 2;
    const sx = gx + gridW + gapS;
    this.geo = { n, cols, cell, gap, gx, gy, sx, sw: W - sx, big, summary, pct, note };

    // The cells pop in with CSS; only the large share counts up through the motion
    const marks = [{ key: "__share", to: [pct], from: [0], delay: 100, data: null }];
    const events = rows.map((r, k) => ({
      datum: r.d,
      index: k,
      key: r.label,
      label: r.label,
      value: r.value,
      formatted: `${f.fv(r.value)} · ${f.pct(this.share(r.value))}`,
    }));
    const summaryText = `Out of ${n} cells: ${rows.map((r, k) => `${r.label} ${counts[k]}`).join(", ")}`;
    return { marks, events, summary: summaryText };
  }

  private cellXY(idx: number) {
    const { cols, cell, gap, gx, gy } = this.geo;
    return { x: gx + (idx % cols) * (cell + gap), y: gy + Math.floor(idx / cols) * (cell + gap) };
  }

  protected override tip(i: number, f: ChartFrame): TooltipData | null {
    const r = this.rows[i];
    if (!r) return null;
    const first = Math.max(0, this.owner.indexOf(i));
    const { x, y } = this.cellXY(first);
    return {
      x: x + this.geo.cell / 2,
      y,
      title: r.label,
      rows: [
        { label: this.words.value, value: f.fv(r.value), color: this.inks[i] },
        { label: "Share", value: f.pct(this.share(r.value)) },
        { label: "Cells", value: String(this.counts[i]) },
      ],
    };
  }

  private onCell = (e: PointerEvent) => {
    const k = Number((e.target as Element).getAttribute("data-k"));
    if (k >= 0) this.setActive(k, e.pointerType === "touch" ? "touch" : "pointer");
  };
  private onCellClick = (e: Event) => {
    const k = Number((e.target as Element).getAttribute("data-k"));
    if (k >= 0) this.clickMark(k);
  };

  protected override draw(f: ChartFrame) {
    const { height: H } = f;
    const { n, cell, sx, sw, big, summary, pct, note } = this.geo;
    const m = this.motion;
    const enter = !this.still && !reducedMotion();
    const rx = Math.min(cell * 0.22, 4);
    const focusK = this.via === "keyboard" ? this.active : null;
    const cells = svg`<g class="ui-wff__cells" ?data-enter=${enter} ?data-waiting=${enter && m.waiting} @pointerover=${this.onCell} @click=${this.onCellClick}>
      ${Array.from({ length: n }, (_, idx) => {
        const k = this.owner[idx] ?? -1;
        const { x, y } = this.cellXY(idx);
        return svg`<rect class="ui-wff__cell" data-k=${k} ?data-empty=${k < 0} ?data-focus=${k >= 0 && focusK === k}
          x=${x} y=${y} width=${cell} height=${cell} rx=${rx}
          opacity=${k >= 0 ? this.dim(k) : 1} style=${`--i: ${idx}${k >= 0 ? `; fill: ${this.inks[k]}` : ""}`}></rect>`;
      })}
    </g>`;
    const hiRow = this.rows[this.hiIdx];
    const shown = m.get("__share")?.[0] ?? pct;
    return svg`
      ${keyed(m.generation, cells)}
      ${summary && hiRow
        ? svg`<g opacity=${m.fade(250, 300)}>
            <text class="ui-wff__figure" ?data-small=${big < 28} x=${sx} y=${H / 2 - big * 0.32} dy="0.35em">${f.pct(shown)}</text>
            <text class="ui-wff__name" x=${sx} y=${H / 2 + big * 0.42} dy="0.35em">${truncate(this.summaryLabel ?? hiRow.label, sw - 2, 12, 700)}</text>
            ${note ? txt(sx, H / 2 + big * 0.42 + 17, truncate(note, sw - 2, AXIS_FONT)) : nothing}
          </g>`
        : nothing}`;
  }

  protected override headerLegend() {
    if (this.rows.length < 2) return nothing;
    return html`<ul class="tc-chart__legend" aria-label="Categories">
      ${this.rows.map((r, k) => html`<li class="tc-chart__key"><span class="tc-chart__swatch" aria-hidden="true" style=${`background: ${this.inks[k]}`}></span>${r.label}</li>`)}
    </ul>`;
  }

  static override css = /* css */ `
[data-ui="wff"] {
  --tc-wff-empty: var(--tc-plot-grid);
  --tc-wff-stagger: 7ms;
}
.ui-wff__cell { fill: var(--tc-wff-empty); transform-box: fill-box; transform-origin: center; transition: fill var(--tc-duration-slower) var(--tc-ease-standard), opacity var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-wff__cell[data-focus] { stroke: var(--tc-plot-focus); stroke-width: 1.5; }
.ui-wff__cells[data-waiting] .ui-wff__cell { opacity: 0; }
.ui-wff__cells[data-enter] .ui-wff__cell { animation: ui-wff-pop var(--tc-duration-slowest) var(--tc-ease-out) calc(var(--i) * var(--tc-wff-stagger)) backwards; }
@keyframes ui-wff-pop { from { opacity: 0; transform: scale(0.45); } to { opacity: 1; transform: none; } }
.ui-wff__figure { font-size: var(--tc-font-size-4xl); font-weight: var(--tc-font-weight-strong); fill: var(--tc-text-primary); font-variant-numeric: tabular-nums; letter-spacing: var(--tc-tracking-tight); pointer-events: none; }
.ui-wff__figure[data-small] { font-size: var(--tc-font-size-3xl); }
.ui-wff__name { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-strong); fill: var(--tc-text-primary); pointer-events: none; }
@media (forced-colors: active) {
  .ui-wff__cell { forced-color-adjust: none; }
  .ui-wff__figure, .ui-wff__name { fill: CanvasText; }
}
`;
}

if (!customElements.get("tc-waffle-chart")) customElements.define("tc-waffle-chart", TcWaffleChart);

declare global {
  interface HTMLElementTagNameMap {
    "tc-waffle-chart": TcWaffleChart;
  }
}
