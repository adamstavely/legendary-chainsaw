import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { isMac } from "./internal/util";
import { canvasUnderlay, paintCanvas } from "./internal/chart/canvas";

/*
 * <tc-heatmap> – a matrix of rows by columns, each cell shaded by its value: utilisation by weekday and hour, error
 * rates by service and region, scores by team and quarter. The scale is sequential (light to dark) or diverging (two
 * colours either side of a `midpoint`), in a few binned steps or continuous; a legend says what the shades mean, and
 * the footer names the highest and lowest cells. A cell with no data is hatched. Pointing at or focusing a cell shows
 * “Row · Column: value”; Enter or a click selects it. `crosshair` lights up the cell's row and column as you go. The
 * Table button swaps the chart for the same numbers as a plain table. `legendLabels` puts words at the legend's ends
 * ("Fewer" … "More") in place of the numbers.
 *   · above `canvasThreshold` cells (2,500 by default) the cells are painted on a canvas that fits the width (the
 *     approach is ported from ztd-charts, MIT, © 2026 Junhan2 – https://github.com/Junhan2/ztd-charts). Over it sits
 *     the interaction layer: the grid keeps its keyboard, selection and tooltip, but only the focused cell is in the
 *     DOM (aria-rowcount / aria-colcount / aria-rowindex / aria-colindex give its place), the axis labels thin out, and
 *     `show-values` is off – the cells are too small to write in. The Table view is unchanged
 *   · the chart is a WAI-ARIA grid: arrows move a cell, Home / End to the row's ends, Page Up / Down to the column's
 *     ends, ⌘/Ctrl+Home / End to the first and last cell; Enter or Space selects, Escape clears; Tab leaves
 *   · narrow, the cells keep their size and the grid scrolls sideways under the row labels
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-heatmap heading="Instrument use" unit="%" .rows=${["Mon", …]} .columns=${["08:00", …]} .values=${[[…], …]}></tc-heatmap>
 */

/** A grid: Lucide (ISC, lucide.dev) */
const gridIcon = svg`<rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M3 9h18"></path><path d="M3 15h18"></path><path d="M9 3v18"></path><path d="M15 3v18"></path>`;

export type HeatmapCell = { row: number; column: number };
export type HeatmapScale = "sequential" | "diverging";
export type HeatmapView = "chart" | "table";

/** Details of the events */
export type HeatmapSelectedChange = {
  /** The selected cell; null when cleared */
  selected: HeatmapCell | null;
  value?: number | null;
};
export type HeatmapViewChange = { view: HeatmapView };

let uidCount = 0;

/** Canvas mode: the narrowest a cell gets (the plot scrolls sideways below that), and a cell's height range */
const CANVAS_MIN = 3;
const CANVAS_MAX_H = 16;
/** Canvas mode: the least room between two visible row labels, and between two column labels */
const ROW_LABEL_GAP = 14;
const COL_LABEL_GAP = 56;

/**
 * A matrix of rows by columns shaded by value – sequential or diverging, binned or continuous – with a legend, the
 * highest and lowest cells, a tooltip per cell, selection and a table view.
 * @tag tc-heatmap
 * @fires tc-selected-change - A cell was selected or cleared ({ selected, value }: HeatmapSelectedChange); cancelable – prevented, `selected` stays as it was
 * @fires tc-view-change - The chart / table switch was pressed ({ view }: HeatmapViewChange); cancelable – prevented, `view` stays as it was
 */
export class TcHeatmap extends TcElement {
  static override ui = "heat";

  /** The heading, and the grid's name */
  @property() accessor heading = "Heatmap";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The rows' labels, top to bottom */
  @property({ attribute: false }) accessor rows: string[] = [];
  /** The columns' labels, left to right */
  @property({ attribute: false }) accessor columns: string[] = [];
  /** The values, a row at a time: values[row][column]; null (or missing) is no data */
  @property({ attribute: false }) accessor values: (number | null)[][] = [];
  /** Light to dark ("sequential"), or two colours either side of `midpoint` ("diverging") */
  @property() accessor scale: HeatmapScale = "sequential";
  /** The value between the two colours of a diverging scale */
  @property({ type: Number }) accessor midpoint = 0;
  /** How many shades the legend bins the values into; 0 shades continuously */
  @property({ type: Number }) accessor steps = 5;
  /** The bottom of the scale; by default the lowest value */
  @property({ type: Number }) accessor min: number | undefined = undefined;
  /** The top of the scale; by default the highest value */
  @property({ type: Number }) accessor max: number | undefined = undefined;
  /** The unit after the number: "%", "runs" */
  @property() accessor unit: string | undefined = undefined;
  /** Writes a value, e.g. (v) => `${v} runs`; replaces the number and `unit` */
  @property({ attribute: false }) accessor format: ((value: number) => string) | undefined = undefined;
  /** Writes each value in its cell */
  @property({ type: Boolean, attribute: "show-values" }) accessor showValues = false;
  /** Lights up the row and column of the cell under the pointer or focus */
  @property({ type: Boolean }) accessor crosshair = false;
  /** What the rows are, for the table's corner: "Day" */
  @property({ attribute: "row-header" }) accessor rowHeader = "Row";
  /** The selected cell. Changed by the user unless a tc-selected-change listener calls preventDefault() */
  @property({ attribute: false }) accessor selected: HeatmapCell | null = null;
  /** The chart or the same numbers as a table. Changed by the Table button unless a tc-view-change listener calls preventDefault() */
  @property() accessor view: HeatmapView = "chart";
  /** The language for numbers, e.g. "de"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;
  /** Words at the two ends of the legend, low then high, e.g. ["Fewer", "More"]; by default the end values */
  @property({ attribute: false }) accessor legendLabels: [string, string] | undefined = undefined;
  /** Above this many cells (rows × columns) they're painted on a canvas; the focused cell stays in the DOM */
  @property({ type: Number, attribute: "canvas-threshold" }) accessor canvasThreshold = 2500;

  /** The focusable cell */
  @state() private accessor active: HeatmapCell | null = null;
  /** The cell under the pointer or focus */
  @state() private accessor hot: HeatmapCell | null = null;
  @state() private accessor announce = "";
  /** Canvas mode: the plot's measured width */
  @state() private accessor plotW = 0;

  private uid = `tc-heat-${++uidCount}`;
  private ro?: ResizeObserver;
  private plotEl: HTMLElement | null = null;
  /** What the canvas was last painted from, so hovering doesn't repaint it */
  private painted: { canvas: HTMLCanvasElement | null; key: string; version: number } = { canvas: null, key: "", version: 0 };
  private version = 0;

  /* ---------- The model ---------- */

  private valueAt(r: number, c: number) {
    const v = this.values[r]?.[c];
    return typeof v === "number" && Number.isFinite(v) ? v : null;
  }
  private say(v: number | null) {
    if (v === null) return "No data";
    if (this.format) return this.format(v);
    const n = new Intl.NumberFormat(this.locale, { maximumFractionDigits: 2 }).format(v);
    if (!this.unit) return n;
    return /^[%°]/.test(this.unit) ? `${n}${this.unit}` : `${n} ${this.unit}`;
  }
  private cellName(r: number, c: number) {
    return `${this.rows[r] ?? `Row ${r + 1}`} · ${this.columns[c] ?? `Column ${c + 1}`}`;
  }
  /** The scale's ends, and the highest and lowest cells */
  private get stats() {
    let lo = Infinity;
    let hi = -Infinity;
    let top: (HeatmapCell & { v: number }) | null = null;
    let bottom: (HeatmapCell & { v: number }) | null = null;
    let missing = false;
    for (let r = 0; r < this.rows.length; r++)
      for (let c = 0; c < this.columns.length; c++) {
        const v = this.valueAt(r, c);
        if (v === null) {
          missing = true;
          continue;
        }
        if (!top || v > top.v) top = { row: r, column: c, v };
        if (!bottom || v < bottom.v) bottom = { row: r, column: c, v };
        lo = Math.min(lo, v);
        hi = Math.max(hi, v);
      }
    if (this.min !== undefined && Number.isFinite(this.min)) lo = this.min;
    if (this.max !== undefined && Number.isFinite(this.max)) hi = this.max;
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
      lo = 0;
      hi = 1;
    }
    if (hi <= lo) hi = lo + 1;
    return { lo, hi, top, bottom, missing };
  }
  private get binned() {
    return Math.round(this.steps) >= 1;
  }
  /** Where a value falls on the scale, -1 … 1 for diverging and 0 … 1 for sequential */
  private position(v: number, lo: number, hi: number) {
    if (this.scale === "diverging") {
      const mid = Math.max(lo, Math.min(hi, this.midpoint));
      if (v >= mid) return hi > mid ? Math.min(1, (v - mid) / (hi - mid)) : 0;
      return mid > lo ? -Math.min(1, (mid - v) / (mid - lo)) : 0;
    }
    return Math.max(0, Math.min(1, (v - lo) / (hi - lo)));
  }
  /** A value's shade: how much ink (0–100%) and which side of a diverging scale */
  private shade(v: number, lo: number, hi: number): { mix: number; side: "high" | "low" } {
    const p = this.position(v, lo, hi);
    const n = Math.max(1, Math.round(this.steps));
    if (this.scale === "diverging") {
      if (!this.binned) return { mix: Math.round(Math.abs(p) * 88), side: p < 0 ? "low" : "high" };
      const idx = Math.min(n - 1, Math.floor(((p + 1) / 2) * n));
      const centre = (n - 1) / 2;
      const level = idx - centre;
      return { mix: centre ? Math.round((Math.abs(level) / centre) * 88) : 88, side: level < 0 ? "low" : "high" };
    }
    if (!this.binned) return { mix: Math.round(12 + p * 82), side: "high" };
    const idx = Math.min(n - 1, Math.floor(p * n));
    return { mix: n === 1 ? 88 : Math.round(12 + (idx / (n - 1)) * 82), side: "high" };
  }
  /** The legend's bins: each one's shade and the value it starts at */
  private bins(lo: number, hi: number) {
    const n = Math.max(1, Math.round(this.steps));
    const mid = Math.max(lo, Math.min(hi, this.midpoint));
    return Array.from({ length: n }, (_, i) => {
      const u = (i + 0.5) / n;
      const v = this.scale === "diverging" ? (u < 0.5 ? mid - (1 - 2 * u) * (mid - lo) : mid + (2 * u - 1) * (hi - mid)) : lo + u * (hi - lo);
      return this.shade(v, lo, hi);
    });
  }

  private setSelected(next: HeatmapCell | null) {
    const same = next && this.selected ? next.row === this.selected.row && next.column === this.selected.column : next === this.selected;
    if (same) return;
    const value = next ? this.valueAt(next.row, next.column) : undefined;
    if (!this.emit<HeatmapSelectedChange>("tc-selected-change", { selected: next, value }, { cancelable: true })) return;
    this.selected = next;
    this.announce = next ? `Selected ${this.cellName(next.row, next.column)}: ${this.say(value ?? null)}` : "Selection cleared";
  }
  private setView(view: HeatmapView) {
    if (view === this.view) return;
    if (!this.emit<HeatmapViewChange>("tc-view-change", { view }, { cancelable: true })) return;
    this.view = view;
  }

  /* ---------- Canvas mode ---------- */

  /** More cells than the threshold: painted on a canvas */
  private get canvasMode() {
    return this.rows.length * this.columns.length > Math.max(0, this.canvasThreshold);
  }
  /** Canvas mode: a cell's size in px and the plot's, from the measured width */
  private get geo() {
    const cols = Math.max(1, this.columns.length);
    const cw = this.plotW > 0 ? Math.max(CANVAS_MIN, this.plotW / cols) : CANVAS_MIN * 2;
    const ch = Math.max(CANVAS_MIN + 1, Math.min(CANVAS_MAX_H, cw));
    return { cw, ch, width: cw * cols, height: ch * this.rows.length };
  }
  /** The CSS colour of a cell's shade – the same mix the DOM cells use */
  private fillOf(s: { mix: number; side: "high" | "low" }) {
    return `color-mix(in oklab, var(${s.side === "low" ? "--tc-heat-ink-low" : "--tc-heat-ink"}) ${s.mix}%, var(--tc-heat-track))`;
  }
  private paint(plot: HTMLElement) {
    const { cw, ch, width, height } = this.geo;
    const cv = plot.querySelector<HTMLCanvasElement>(".tc-chart__canvas");
    const key = `${width}x${height}@${window.devicePixelRatio || 1}`;
    if (!cv || (cv === this.painted.canvas && key === this.painted.key && this.version === this.painted.version)) return;
    this.painted = { canvas: cv, key, version: this.version };
    const st = this.stats;
    const gap = Math.min(cw, ch) >= 6 ? 1 : 0;
    paintCanvas(plot, width, height, (ctx, color) => {
      // Cells don't overlap: one fill per shade
      const byFill = new Map<string, number[]>();
      const missing: number[] = [];
      const cols = this.columns.length;
      for (let r = 0; r < this.rows.length; r++)
        for (let c = 0; c < cols; c++) {
          const v = this.valueAt(r, c);
          if (v === null) {
            missing.push(r * cols + c);
            continue;
          }
          const f = this.fillOf(this.shade(v, st.lo, st.hi));
          const list = byFill.get(f);
          if (list) list.push(r * cols + c);
          else byFill.set(f, [r * cols + c]);
        }
      const w = Math.max(0.5, cw - gap);
      const h = Math.max(0.5, ch - gap);
      for (const [f, list] of byFill) {
        ctx.fillStyle = color(f);
        for (const i of list) ctx.fillRect((i % cols) * cw + gap / 2, Math.floor(i / cols) * ch + gap / 2, w, h);
      }
      if (missing.length) {
        // No data: an outline and one hatch line, like the DOM cells' hatching
        ctx.lineWidth = 1;
        ctx.strokeStyle = color("var(--tc-border-strong)");
        ctx.beginPath();
        for (const i of missing) {
          const x = (i % cols) * cw + gap / 2;
          const y = Math.floor(i / cols) * ch + gap / 2;
          ctx.moveTo(x, y + h);
          ctx.lineTo(x + w, y);
        }
        ctx.stroke();
        ctx.strokeStyle = color("var(--tc-border-default)");
        for (const i of missing) ctx.strokeRect((i % cols) * cw + gap / 2 + 0.5, Math.floor(i / cols) * ch + gap / 2 + 0.5, Math.max(0, w - 1), Math.max(0, h - 1));
      }
    });
  }
  /** Canvas mode: the cell under a pointer event */
  private cellAt(e: PointerEvent | MouseEvent): HeatmapCell | null {
    const box = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const { cw, ch } = this.geo;
    const column = Math.floor((e.clientX - box.left) / cw);
    const row = Math.floor((e.clientY - box.top) / ch);
    if (row < 0 || column < 0 || row >= this.rows.length || column >= this.columns.length) return null;
    return { row, column };
  }
  private onPlotMove = (e: PointerEvent) => {
    const at = this.cellAt(e);
    if (at?.row !== this.hot?.row || at?.column !== this.hot?.column) this.hot = at;
  };
  private onPlotDown = (e: PointerEvent) => {
    const at = this.cellAt(e);
    if (!at) return;
    if (e.pointerType === "mouse") e.preventDefault();
    this.focusCell(at.row, at.column);
  };
  private onPlotClick = (e: MouseEvent) => {
    const at = this.cellAt(e);
    if (!at) return;
    const isSel = this.selected?.row === at.row && this.selected.column === at.column;
    this.setSelected(isSel ? null : at);
  };

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.ro?.disconnect();
    this.ro = undefined;
    this.plotEl = null;
  }

  /* ---------- Keyboard: the grid ---------- */

  private get stop(): HeatmapCell {
    const ok = (p: HeatmapCell | null) => p && p.row < this.rows.length && p.column < this.columns.length;
    if (ok(this.active)) return this.active!;
    if (ok(this.selected)) return this.selected!;
    return { row: 0, column: 0 };
  }
  private focusCell(row: number, column: number) {
    row = Math.max(0, Math.min(this.rows.length - 1, row));
    column = Math.max(0, Math.min(this.columns.length - 1, column));
    this.active = { row, column };
    // Canvas mode moves one cell element, which keeps focus: show the tooltip for the cell it now stands for
    if (this.canvasMode) this.hot = { row, column };
    void this.updateComplete.then(() => {
      const cell = this.querySelector<HTMLElement>(`[data-cell="${row}:${column}"]`);
      cell?.focus({ preventScroll: true });
      cell?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    });
  }
  private onKey = (e: KeyboardEvent) => {
    const cell = (e.target as HTMLElement).closest<HTMLElement>("[data-cell]");
    if (!cell || e.isComposing || e.altKey) return;
    const [r, c] = cell.dataset.cell!.split(":").map(Number);
    const mod = isMac() ? e.metaKey : e.ctrlKey;
    const last = { r: this.rows.length - 1, c: this.columns.length - 1 };
    const moves: Record<string, [number, number]> = {
      ArrowUp: [r - 1, c],
      ArrowDown: [r + 1, c],
      ArrowLeft: [r, c - 1],
      ArrowRight: [r, c + 1],
      PageUp: [0, c],
      PageDown: [last.r, c],
      Home: mod ? [0, 0] : [r, 0],
      End: mod ? [last.r, last.c] : [r, last.c],
    };
    const move = moves[e.key];
    if (move) {
      e.preventDefault();
      this.focusCell(move[0], move[1]);
      return;
    }
    if (e.metaKey || e.ctrlKey) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const isSel = this.selected?.row === r && this.selected.column === c;
      this.setSelected(isSel ? null : { row: r, column: c });
    } else if (e.key === "Escape") {
      if (this.selected) {
        e.preventDefault();
        this.setSelected(null);
      } else if (this.hot) {
        e.preventDefault();
        this.hot = null;
      }
    }
  };

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const inside = (p: HeatmapCell | null) => !p || (p.row >= 0 && p.column >= 0 && p.row < this.rows.length && p.column < this.columns.length);
    if (!inside(this.active)) this.active = null;
    if (!inside(this.hot)) this.hot = null;
    if (!inside(this.selected)) this.selected = null;
    if (["rows", "columns", "values", "scale", "midpoint", "steps", "min", "max"].some((k) => changed.has(k))) this.version++;
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    const plot = this.querySelector<HTMLElement>(".ui-heat__plot");
    if (plot !== this.plotEl) {
      this.ro?.disconnect();
      this.ro = undefined;
      this.plotEl = plot;
      if (plot && typeof ResizeObserver === "function") {
        this.ro = new ResizeObserver((entries) => {
          const w = entries[entries.length - 1]?.contentRect.width ?? 0;
          if (w > 0 && Math.abs(this.plotW - w) >= 0.5) this.plotW = Math.round(w * 10) / 10;
        });
        this.ro.observe(plot);
      }
    }
    if (plot && this.plotW > 0) this.paint(plot);
  }

  /* ---------- Rendering ---------- */

  private renderGrid(st: TcHeatmap["stats"]) {
    const id = this.uid;
    const stop = this.stop;
    const hot = this.hot;
    const cols = this.columns.length;
    const rowsN = this.rows.length;
    return html`<div class="ui-heat__scroll">
      <table
        class="ui-heat__grid"
        role="grid"
        aria-labelledby=${`${id}-title`}
        aria-describedby=${`${id}-keys ${id}-summary`}
        style=${`--n: ${cols}`}
        @keydown=${this.onKey}
        @pointerleave=${() => (this.hot = null)}
      >
        <thead>
          <tr role="row">
            <td class="ui-heat__corner" role="presentation"></td>
            ${this.columns.map((name, c) => html`<th class="ui-heat__colhead" role="columnheader" scope="col" ?data-hot=${this.crosshair && hot?.column === c}><span>${name}</span></th>`)}
          </tr>
        </thead>
        <tbody>
          ${this.rows.map(
            (name, r) => html`<tr role="row">
              <th class="ui-heat__rowhead" role="rowheader" scope="row" ?data-hot=${this.crosshair && hot?.row === r}>${name}</th>
              ${this.columns.map((_, c) => {
                const v = this.valueAt(r, c);
                const s = v === null ? null : this.shade(v, st.lo, st.hi);
                const isSel = this.selected?.row === r && this.selected.column === c;
                const isHot = hot?.row === r && hot.column === c;
                const cross = this.crosshair && hot && !isHot && (hot.row === r || hot.column === c);
                return html`<td
                  class="ui-heat__cell"
                  role="gridcell"
                  data-cell=${`${r}:${c}`}
                  data-side=${s?.side ?? "none"}
                  ?data-selected=${isSel}
                  ?data-cross=${cross}
                  style=${s ? `--m: ${s.mix}%` : ""}
                  tabindex=${stop.row === r && stop.column === c ? 0 : -1}
                  aria-selected=${isSel ? "true" : "false"}
                  @focus=${() => {
                    this.active = { row: r, column: c };
                    this.hot = { row: r, column: c };
                  }}
                  @blur=${() => {
                    if (this.hot?.row === r && this.hot.column === c) this.hot = null;
                  }}
                  @pointerenter=${() => (this.hot = { row: r, column: c })}
                  @pointerdown=${(e: PointerEvent) => {
                    this.active = { row: r, column: c };
                    if (e.pointerType === "mouse") e.preventDefault();
                    (e.currentTarget as HTMLElement).focus({ preventScroll: true });
                  }}
                  @click=${() => this.setSelected(isSel ? null : { row: r, column: c })}
                >
                  <span class="tc-sr-only">${this.cellName(r, c)}: ${this.say(v)}</span>
                  ${this.showValues && v !== null ? html`<span class="ui-heat__num" aria-hidden="true">${this.say(v)}</span>` : nothing}
                  ${isHot
                    ? html`<span
                        class="ui-heat__tip"
                        aria-hidden="true"
                        data-below=${r === 0 && rowsN > 1 ? "" : nothing}
                        data-side=${c < 2 && cols > 3 ? "start" : c > cols - 3 && cols > 3 ? "end" : "mid"}
                        >${this.cellName(r, c)}: <strong>${this.say(v)}</strong></span
                      >`
                    : nothing}
                </td>`;
              })}
            </tr>`,
          )}
        </tbody>
      </table>
    </div>`;
  }

  /** Canvas mode: the cells on a canvas, the labels thinned out, and one cell element for the focus */
  private renderCanvas() {
    const id = this.uid;
    const { cw, ch, height } = this.geo;
    const cols = this.columns.length;
    const rowsN = this.rows.length;
    const stop = this.stop;
    const hot = this.hot;
    const sel = this.selected;
    const box = (p: HeatmapCell) => `left: ${p.column * cw}px; top: ${p.row * ch}px; width: ${cw}px; height: ${ch}px`;
    const rowStep = Math.max(1, Math.ceil(ROW_LABEL_GAP / ch));
    const colStep = Math.max(1, Math.ceil(COL_LABEL_GAP / cw));
    const isSel = sel?.row === stop.row && sel.column === stop.column;
    const tip = (p: HeatmapCell) =>
      html`<span
        class="ui-heat__tip"
        aria-hidden="true"
        data-below=${p.row < 2 && rowsN > 1 ? "" : nothing}
        data-side=${p.column < cols * 0.15 ? "start" : p.column >= cols * 0.85 ? "end" : "mid"}
        >${this.cellName(p.row, p.column)}: <strong>${this.say(this.valueAt(p.row, p.column))}</strong></span
      >`;
    const hotHere = hot && hot.row === stop.row && hot.column === stop.column;
    return html`<div class="ui-heat__scroll">
      <div class="ui-heat__matrix" style=${`--n: ${cols}; --tc-heat-min: ${cols * CANVAS_MIN}px`}>
        <span class="ui-heat__xlabels" aria-hidden="true">
          ${this.columns.map((name, c) =>
            c % colStep === 0 || (this.crosshair && hot?.column === c)
              ? html`<span class="ui-heat__xlabel" ?data-hot=${this.crosshair && hot?.column === c} style=${`left: ${(c + 0.5) * cw}px`}>${name}</span>`
              : nothing,
          )}
        </span>
        <span class="ui-heat__ylabels" aria-hidden="true" style=${`height: ${height}px`}>
          ${this.rows.map((name, r) =>
            r % rowStep === 0 || (this.crosshair && hot?.row === r)
              ? html`<span class="ui-heat__ylabel" ?data-hot=${this.crosshair && hot?.row === r} style=${`top: ${(r + 0.5) * ch}px`}>${name}</span>`
              : nothing,
          )}
        </span>
        <div
          class="ui-heat__plot"
          style=${`height: ${height}px`}
          @pointermove=${this.onPlotMove}
          @pointerdown=${this.onPlotDown}
          @pointerleave=${() => (this.hot = null)}
          @click=${this.onPlotClick}
        >
          ${canvasUnderlay()}
          ${this.crosshair && hot
            ? html`<span class="ui-heat__band" aria-hidden="true" style=${`left: 0; right: 0; top: ${hot.row * ch}px; height: ${ch}px`}></span
                ><span class="ui-heat__band" aria-hidden="true" style=${`top: 0; bottom: 0; left: ${hot.column * cw}px; width: ${cw}px`}></span>`
            : nothing}
          ${sel && !isSel ? html`<span class="ui-heat__mark" data-selected aria-hidden="true" style=${box(sel)}></span>` : nothing}
          ${hot && !hotHere ? html`<span class="ui-heat__mark" data-hot aria-hidden="true" style=${box(hot)}>${tip(hot)}</span>` : nothing}
          <div
            class="ui-heat__vgrid"
            role="grid"
            aria-labelledby=${`${id}-title`}
            aria-describedby=${`${id}-keys ${id}-summary`}
            aria-rowcount=${rowsN + 1}
            aria-colcount=${cols + 1}
            @keydown=${this.onKey}
          >
            <div class="tc-sr-only" role="row" aria-rowindex="1">
              <span role="columnheader" aria-colindex=${stop.column + 2}>${this.columns[stop.column]}</span>
            </div>
            <div class="ui-heat__vrow" role="row" aria-rowindex=${stop.row + 2}>
              <span class="tc-sr-only" role="rowheader" aria-colindex="1">${this.rows[stop.row]}</span>
              <span
                class="ui-heat__vcell"
                role="gridcell"
                aria-colindex=${stop.column + 2}
                data-cell=${`${stop.row}:${stop.column}`}
                ?data-selected=${isSel}
                tabindex="0"
                aria-selected=${isSel ? "true" : "false"}
                style=${box(stop)}
                @focus=${() => {
                  this.active = { ...stop };
                  this.hot = { ...stop };
                }}
                @blur=${() => {
                  if (this.hot?.row === stop.row && this.hot.column === stop.column) this.hot = null;
                }}
              >
                <span class="tc-sr-only">${this.cellName(stop.row, stop.column)}: ${this.say(this.valueAt(stop.row, stop.column))}</span>
                ${hotHere ? tip(stop) : nothing}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  }

  private renderTable() {
    return html`<div class="ui-heat__scroll">
      <table class="ui-heat__table">
        <caption class="tc-sr-only">${this.heading}</caption>
        <thead>
          <tr>
            <th scope="col">${this.rowHeader}</th>
            ${this.columns.map((name) => html`<th scope="col">${name}</th>`)}
          </tr>
        </thead>
        <tbody>
          ${this.rows.map(
            (name, r) => html`<tr>
              <th scope="row">${name}</th>
              ${this.columns.map((_, c) => {
                const v = this.valueAt(r, c);
                return html`<td ?data-none=${v === null}>${this.say(v)}</td>`;
              })}
            </tr>`,
          )}
        </tbody>
      </table>
    </div>`;
  }

  /** A legend end: its word from `legendLabels` (with the value for screen readers), or the value */
  private legendEnd(v: number, i: 0 | 1) {
    const word = this.legendLabels?.[i];
    return word
      ? html`<span class="ui-heat__end" data-word>${word}<span class="tc-sr-only"> (${this.say(v)})</span></span>`
      : html`<span class="ui-heat__end">${this.say(v)}</span>`;
  }

  private renderLegend(st: TcHeatmap["stats"]) {
    const ends =
      this.scale === "diverging"
        ? [st.lo, Math.max(st.lo, Math.min(st.hi, this.midpoint)), st.hi]
        : [st.lo, st.hi];
    return html`<span class="ui-heat__legend">
      ${st.missing ? html`<span class="ui-heat__key"><span class="ui-heat__swatch" data-side="none" aria-hidden="true"></span>No data</span>` : nothing}
      <span class="ui-heat__key">
        ${this.legendEnd(ends[0], 0)}
        ${this.binned
          ? html`<span class="ui-heat__swatches" aria-hidden="true">
              ${this.bins(st.lo, st.hi).map((b) => html`<span class="ui-heat__swatch" data-side=${b.side} style=${`--m: ${b.mix}%`}></span>`)}
            </span>`
          : html`<span class="ui-heat__ramp" data-scale=${this.scale} aria-hidden="true"></span>`}
        ${this.scale === "diverging" ? html`<span class="tc-sr-only">, ${this.say(ends[1])} in the middle,</span>` : nothing}
        ${this.legendEnd(ends[ends.length - 1], 1)}
      </span>
    </span>`;
  }

  protected override render() {
    const id = this.uid;
    const has = this.rows.length > 0 && this.columns.length > 0;
    const st = this.stats;
    const table = this.view === "table";
    const summary =
      st.top && st.bottom
        ? `Highest ${this.cellName(st.top.row, st.top.column)}, ${this.say(st.top.v)}. Lowest ${this.cellName(st.bottom.row, st.bottom.column)}, ${this.say(st.bottom.v)}.`
        : "No values yet.";
    return html`
      <span class="tc-sr-only" role="status">${this.announce}</span>
      <span class="tc-sr-only" id=${`${id}-keys`}>Arrow keys move between cells; Enter selects the cell</span>
      ${cardHead({
        icon: gridIcon,
        title: this.heading,
        subtitle: this.description,
        id: `${id}-title`,
        aside: has
          ? html`<button type="button" class="tc-btn-sm ui-heat__toggle" aria-pressed=${table ? "true" : "false"} @click=${() => this.setView(table ? "chart" : "table")}>Table</button>`
          : nothing,
      })}
      <div class="ui-heat__card">
        ${has
          ? html`${table ? this.renderTable() : this.canvasMode ? this.renderCanvas() : this.renderGrid(st)}
              <div class="ui-heat__foot">
                <p class="ui-heat__summary" id=${`${id}-summary`}>
                  ${st.top && st.bottom
                    ? html`<span><span class="ui-heat__summary-label">Highest</span> ${this.cellName(st.top.row, st.top.column)} <strong>${this.say(st.top.v)}</strong></span>
                        <span><span class="ui-heat__summary-label">Lowest</span> ${this.cellName(st.bottom.row, st.bottom.column)} <strong>${this.say(st.bottom.v)}</strong></span>`
                    : summary}
                </p>
                ${table ? nothing : this.renderLegend(st)}
              </div>`
          : html`<p class="ui-heat__empty">No data to show.</p>`}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="heat"] {
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="heat"] {
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* The inks (high, and low for a diverging scale), the empty track, a cell's size and the row labels' width – override any of them on the element */
[data-ui="heat"] { --tc-heat-ink: var(--tc-chart-1); --tc-heat-ink-low: var(--tc-chart-3); --tc-heat-track: var(--tc-fill-default); --tc-heat-cell-w: 32px; --tc-heat-cell-h: 28px; --tc-heat-label: 88px; --tc-heat-gap: 2px; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="heat"] { --tc-heat-bg: var(--tc-surface-on-tray); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="heat"] { --tc-heat-bg: var(--tc-surface-raised); }
[data-ui="heat"] *, [data-ui="heat"] *::before, [data-ui="heat"] *::after { box-sizing: border-box; }
[data-ui="heat"] p { margin: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-heat__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-heat__toggle[aria-pressed="true"] { background: var(--tc-surface-inverse); color: var(--tc-text-on-inverse); box-shadow: none; }
/* ----- The grid: cells keep their size, and narrow it scrolls under the row labels ----- */
.ui-heat__scroll { overflow-x: auto; padding: var(--tc-space-4) var(--tc-space-4) var(--tc-space-2) 0; scrollbar-width: thin; }
:where([data-look="clean"], [data-look="clean"] *).ui-heat__scroll { padding-top: var(--tc-space-2); }
.ui-heat__grid { width: 100%; min-width: calc(var(--tc-heat-label) + var(--tc-space-4) + var(--n) * (var(--tc-heat-cell-w) + var(--tc-heat-gap))); table-layout: fixed; border-collapse: separate; border-spacing: var(--tc-heat-gap); }
.ui-heat__grid th, .ui-heat__grid td { padding: 0; font-weight: inherit; }
.ui-heat__corner, .ui-heat__rowhead { position: sticky; left: 0; z-index: 1; width: calc(var(--tc-heat-label) + var(--tc-space-4)); padding-left: var(--tc-space-4) !important; padding-right: var(--tc-space-2) !important; background: var(--tc-heat-bg); box-shadow: 0 0 0 var(--tc-heat-gap) var(--tc-heat-bg); }
.ui-heat__rowhead { overflow: hidden; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); text-align: left; text-overflow: ellipsis; white-space: nowrap; }
.ui-heat__colhead { height: 18px; vertical-align: bottom; }
.ui-heat__colhead > span { display: block; overflow: hidden; font-size: var(--tc-font-size-2xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); text-align: center; text-overflow: ellipsis; white-space: nowrap; }
.ui-heat__rowhead[data-hot], .ui-heat__colhead[data-hot] > span { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
/* A cell: the track, the ink mixed in by its shade, hatched when there's no data */
.ui-heat__cell { position: relative; height: var(--tc-heat-cell-h); border-radius: var(--tc-radius-2xs); background: var(--tc-heat-track); cursor: pointer; outline: none; text-align: center; vertical-align: middle; transition: background-color var(--tc-duration-moderate) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-heat__cell[data-side="high"] { background: color-mix(in oklab, var(--tc-heat-ink) var(--m), var(--tc-heat-track)); }
.ui-heat__cell[data-side="low"] { background: color-mix(in oklab, var(--tc-heat-ink-low) var(--m), var(--tc-heat-track)); }
.ui-heat__cell[data-side="none"], .ui-heat__swatch[data-side="none"] { background: repeating-linear-gradient(135deg, var(--tc-border-strong) 0 1px, transparent 1px 5px); box-shadow: inset 0 0 0 1px var(--tc-border-default); }
.ui-heat__cell:hover, .ui-heat__cell[data-cross] { box-shadow: inset 0 0 0 1px var(--tc-border-strong); }
.ui-heat__cell[data-selected] { box-shadow: 0 0 0 2px var(--tc-text-primary); }
.ui-heat__cell:focus-visible { outline: var(--tc-focus-outline); outline-offset: 1px; }
/* A value on a small chip of the card's colour, so it reads on every shade */
.ui-heat__num { display: inline-block; padding: var(--tc-space-0-5) var(--tc-space-1); border-radius: var(--tc-radius-2xs); background: var(--tc-heat-bg); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-none); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; white-space: nowrap; }
/* The tooltip: above the cell (below it on the first row), kept inside the grid at the ends */
.ui-heat__tip {
  position: absolute;
  bottom: calc(100% + var(--tc-space-1-5));
  left: 50%;
  z-index: 2;
  padding: var(--tc-tooltip-py) var(--tc-tooltip-px);
  border-radius: var(--tc-tooltip-radius);
  background: var(--tc-tooltip-bg);
  color: var(--tc-tooltip-fg);
  font-size: var(--tc-tooltip-font-size);
  line-height: var(--tc-line-height-tight);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  pointer-events: none;
  transform: translateX(-50%);
  animation: ui-heat-tip var(--tc-duration-fast) var(--tc-ease-out);
}
.ui-heat__tip strong { font-weight: var(--tc-font-weight-strong); }
.ui-heat__tip[data-below] { top: calc(100% + var(--tc-space-1-5)); bottom: auto; }
.ui-heat__tip[data-side="start"] { left: 0; transform: none; }
.ui-heat__tip[data-side="end"] { left: auto; right: 0; transform: none; }
@keyframes ui-heat-tip { from { opacity: 0; } }
/* ----- Canvas mode: the painted cells, thinned labels, and one cell element over the canvas for the focus ----- */
.ui-heat__matrix { display: grid; grid-template-columns: calc(var(--tc-heat-label) + var(--tc-space-4)) minmax(var(--tc-heat-min), 1fr); grid-template-rows: auto auto; }
.ui-heat__xlabels { position: relative; grid-column: 2; height: 18px; overflow: visible; }
.ui-heat__xlabel { position: absolute; bottom: var(--tc-space-1); transform: translateX(-50%); font-size: var(--tc-font-size-2xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; }
.ui-heat__ylabels { position: sticky; left: 0; z-index: 1; grid-column: 1; grid-row: 2; background: var(--tc-heat-bg); }
.ui-heat__ylabel { position: absolute; left: var(--tc-space-4); right: var(--tc-space-2); overflow: hidden; transform: translateY(-50%); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); text-overflow: ellipsis; white-space: nowrap; }
.ui-heat__xlabel[data-hot], .ui-heat__ylabel[data-hot] { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
.ui-heat__plot { position: relative; grid-column: 2; grid-row: 2; cursor: pointer; }
.ui-heat__plot > .tc-chart__canvas { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; }
.ui-heat__band { position: absolute; box-shadow: inset 0 0 0 1px var(--tc-border-strong); pointer-events: none; }
.ui-heat__mark, .ui-heat__vcell { position: absolute; border-radius: var(--tc-radius-2xs); outline: none; pointer-events: none; }
.ui-heat__mark[data-hot] { box-shadow: 0 0 0 1px var(--tc-text-primary); }
.ui-heat__mark[data-selected], .ui-heat__vcell[data-selected] { box-shadow: 0 0 0 2px var(--tc-text-primary); }
.ui-heat__vcell:focus-visible { outline: var(--tc-focus-outline); outline-offset: 1px; }
/* ----- The table view ----- */
.ui-heat__table { width: 100%; padding-left: var(--tc-space-4); border-collapse: collapse; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); font-variant-numeric: tabular-nums; }
.ui-heat__table th, .ui-heat__table td { padding: var(--tc-space-1-5) var(--tc-space-2); border-bottom: 1px solid var(--tc-border-subtle); text-align: right; white-space: nowrap; }
.ui-heat__table th { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); }
.ui-heat__table th[scope="row"], .ui-heat__table thead th:first-child { text-align: left; color: var(--tc-text-secondary); }
.ui-heat__table td { color: var(--tc-text-primary); }
.ui-heat__table td[data-none] { color: var(--tc-text-muted); }
/* ----- The footer: the highest and lowest cells, and the legend ----- */
.ui-heat__foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-1-5) var(--tc-space-4); padding: var(--tc-space-2) var(--tc-space-4) var(--tc-space-3); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); }
.ui-heat__summary { display: flex; flex-wrap: wrap; gap: var(--tc-space-1) var(--tc-space-3); min-width: 0; }
.ui-heat__summary strong { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-heat__summary-label { color: var(--tc-text-muted); }
.ui-heat__legend, .ui-heat__key { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); }
.ui-heat__legend { gap: var(--tc-space-4); color: var(--tc-text-muted); }
.ui-heat__end { font-variant-numeric: tabular-nums; }
.ui-heat__swatches { display: inline-flex; gap: var(--tc-heat-gap); }
.ui-heat__swatch { display: inline-block; width: 14px; height: 10px; border-radius: var(--tc-radius-2xs); background: var(--tc-heat-track); }
.ui-heat__swatch[data-side="high"] { background: color-mix(in oklab, var(--tc-heat-ink) var(--m), var(--tc-heat-track)); }
.ui-heat__swatch[data-side="low"] { background: color-mix(in oklab, var(--tc-heat-ink-low) var(--m), var(--tc-heat-track)); }
.ui-heat__ramp { display: inline-block; width: 72px; height: 10px; border-radius: var(--tc-radius-2xs); background: linear-gradient(to right, color-mix(in oklab, var(--tc-heat-ink) 12%, var(--tc-heat-track)), var(--tc-heat-ink)); }
.ui-heat__ramp[data-scale="diverging"] { background: linear-gradient(to right, var(--tc-heat-ink-low), var(--tc-heat-track), var(--tc-heat-ink)); }
.ui-heat__empty { padding: var(--tc-space-6) var(--tc-space-4) !important; color: var(--tc-text-muted); text-align: center; }
@container (max-width: 420px) {
  [data-ui="heat"] { --tc-heat-label: 56px; }
}
@media (pointer: coarse) {
  [data-ui="heat"] { --tc-heat-cell-h: 32px; --tc-heat-cell-w: 36px; }
}
@media (forced-colors: active) {
  .ui-heat__cell { border: 1px solid CanvasText; }
  .ui-heat__cell[data-selected], .ui-heat__mark[data-selected], .ui-heat__vcell[data-selected] { box-shadow: 0 0 0 2px Highlight; }
  .ui-heat__mark[data-hot], .ui-heat__band { box-shadow: 0 0 0 1px CanvasText; }
  .ui-heat__tip { border: 1px solid CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="heat"] *, [data-ui="heat"] *::before, [data-ui="heat"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-heatmap")) customElements.define("tc-heatmap", TcHeatmap);

declare global {
  interface HTMLElementTagNameMap {
    "tc-heatmap": TcHeatmap;
  }
}
