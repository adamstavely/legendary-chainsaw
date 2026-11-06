import { nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { strGetter, toNumber } from "./internal/chart/accessor";
import { txt } from "./internal/chart/axis";
import { canvasUnderlay, paintCanvas } from "./internal/chart/canvas";
import { AXIS_FONT, TcChartElement, type ChartFrame, type ChartModel } from "./internal/chart/element";
import { makeFormatter, type FormatSpec, type ValueFormatter } from "./internal/chart/format";
import { resolveHighlight } from "./internal/chart/highlight";
import { plural } from "./internal/chart/i18n";
import { lazyArray } from "./internal/chart/lazy";
import type { Mark } from "./internal/chart/motion";
import { extent, fitDomain, scaleLinear, type LinearScale } from "./internal/chart/scale";
import { textWidth, truncate } from "./internal/chart/text";
import type { Accessor, Row, TooltipData } from "./internal/chart/types";

/*
 * <tc-parallel-chart> – parallel coordinates: several numeric measures stood up as vertical axes side by side, each row
 * a line crossing them at its values, to compare rows across all the measures at once. Ported from ztd-charts'
 * ParallelCoordinates (MIT, © 2026 Junhan2). Each axis is scaled to its own range (written at its ends), and `invert`
 * turns an axis where less is better upside down. One row takes the accent and is named at the right – the first by
 * default (`highlight` picks others) – while the rest stay quiet; a row missing a value breaks its line at that axis.
 * The pointer picks the nearest line. Lines draw across from left to right when the chart comes on screen and glide when
 * the data changes. Above `canvas-threshold` rows (1,500 by default) the lines are painted on a canvas under the SVG,
 * revealed left to right.
 *   · one tab stop: arrows move row to row, each read with every measure
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-parallel-chart heading="Instruments" .data=${[{ label: "Cryo-EM", uptime: 97, cost: 41, queue: 6 }]}></tc-parallel-chart>
 */

/** Three axes crossed by a line – drawn for this chart in Lucide's style (ISC, lucide.dev) */
const parallelIcon = svg`<path d="M4 3v18"></path><path d="M12 3v18"></path><path d="M20 3v18"></path><path d="m4 15 8-8 8 6"></path>`;

/** One row's line */
type PLine<T> = { i: number; label: string; vals: number[]; ys: number[]; hi: boolean; datum: T };

/** Traces a line through the axes, lifting the pen where a value is missing (NaN) – shared by the SVG path and the canvas */
function traceGapped(ys: readonly number[], xAt: (j: number) => number, move: (x: number, y: number) => void, line: (x: number, y: number) => void) {
  let pen = false;
  ys.forEach((yy, j) => {
    if (!Number.isFinite(yy)) {
      pen = false;
      return;
    }
    (pen ? line : move)(xAt(j), yy);
    pen = true;
  });
}

/** Axis and row names are drawn at the axis size */
const NAME_FONT = AXIS_FONT;

/**
 * Parallel coordinates: rows as lines across a vertical axis per measure – each axis on its own scale, one row
 * emphasised and named, gaps for missing values, a canvas for many rows, and a table view.
 * @tag tc-parallel-chart
 * @fires tc-view-change - The Table button was pressed ({ view }: ChartViewChange); cancelable – prevented, `view` stays as it was
 * @fires tc-mark-hover - The pointer or keyboard moved to a line, or off them ({ event }: ChartMarkHover)
 * @fires tc-mark-click - A line was clicked, or picked with Enter or Space ({ event }: ChartMarkClick)
 */
export class TcParallelChart<T = Row> extends TcChartElement<PLine<T> | null, T> {
  static override ui = "pcc";

  /** The numeric fields to stand up as axes, in order; by default every field that's a number in the first 20 rows */
  @property({ attribute: false }) accessor dimensions: string[] | undefined = undefined;
  /** Names for the axes by field: { uptime: "Uptime (%)" } */
  @property({ attribute: false }) accessor dimensionLabels: Record<string, string> | undefined = undefined;
  /** How each axis's values are written, by field; the others use `format` */
  @property({ attribute: false }) accessor formats: Record<string, FormatSpec> | undefined = undefined;
  /** Fields where less is better: their axes run upside down */
  @property({ attribute: false }) accessor invert: string[] | undefined = undefined;
  /** The row-name field; by default "label" */
  @property({ attribute: false }) accessor label: Accessor<T, string> | undefined = undefined;
  /** Above this many rows the lines are painted on a canvas instead of drawn in SVG */
  @property({ type: Number, attribute: "canvas-threshold" }) accessor canvasThreshold = 1500;

  protected override readonly kind = "Parallel coordinates";
  protected override readonly icon = parallelIcon;
  protected override defaultDuration = 1000;
  protected override modelKeys = ["dimensions", "dimensionLabels", "formats", "invert", "label", "canvasThreshold"];

  private lines: PLine<T>[] = [];
  private geo = {
    dims: [] as string[],
    names: [] as string[],
    fmts: [] as ValueFormatter[],
    doms: [] as [number, number][],
    scales: [] as LinearScale[],
    x0: 0,
    x1: 0,
    top: 30,
    bottom: 18,
    gapX: 128,
    labelR: 24,
    stagger: false,
    canvas: false,
  };

  protected override defaultHeight(w: number) {
    return Math.max(220, Math.min(320, w * 0.55));
  }

  protected override tableHeader() {
    return "Row";
  }

  private axX = (j: number) => {
    const { dims, x0, x1 } = this.geo;
    return dims.length > 1 ? x0 + (j * (x1 - x0)) / (dims.length - 1) : (x0 + x1) / 2;
  };

  private rowName(l: PLine<T>) {
    return l.label || `#${l.i + 1}`;
  }

  protected override buildModel(f: ChartFrame): ChartModel<PLine<T> | null, T> {
    const { width: W, height: H } = f;
    const data = this.data;
    let dims = this.dimensions?.length ? this.dimensions : [];
    if (!dims.length && data.length) {
      const first = data[0] as Record<string, unknown>;
      dims = Object.keys(first).filter((k) => data.slice(0, 20).every((d) => Number.isFinite(toNumber((d as Record<string, unknown>)[k]))));
    }
    const gl = strGetter(this.label, "label");
    const rows = data.map((d, i) => ({ d, i, label: gl(d, i), vals: dims.map((k) => toNumber((d as Record<string, unknown>)[k])) }));
    const doms = dims.map((_, j) => fitDomain(...extent(rows.map((r) => r.vals[j])), 4, { zero: false, pad: 0.02 }));
    const fmts = dims.map((k) => (this.formats?.[k] !== undefined ? makeFormatter(this.formats[k], f.locale) : f.fmt));
    const hi = resolveHighlight(this.highlight, rows.map((r) => r.d), rows.map((r) => r.label), rows.map((r) => r.vals[0] ?? 0), "first");
    const names = dims.map((k) => this.dimensionLabels?.[k] ?? k);
    const showLabels = !this.hideLabels && rows.length <= 60;
    const labelR = showLabels ? Math.min(W * 0.18, Math.max(...rows.filter((r) => hi.has(r.i)).map((r) => textWidth(r.label || `#${r.i + 1}`, NAME_FONT, 700)), 0) + 14) : 0;
    const bottom = 18;
    const nameW = names.map((n) => textWidth(n, NAME_FONT, 700));
    const x0 = Math.max(24, Math.min(W * 0.15, (nameW[0] ?? 0) / 2 + 4));
    const x1 = W - Math.max(24, labelR, Math.min(W * 0.15, (nameW[nameW.length - 1] ?? 0) / 2 + 4));
    const gapX = dims.length > 1 ? (x1 - x0) / (dims.length - 1) : 128;
    // Names longer than the space between axes go on two staggered lines, giving each two spaces' width
    const stagger = dims.length > 2 && nameW.some((w) => w > gapX - 8);
    const top = stagger ? 44 : 30;
    const scales = doms.map((dm, j) => scaleLinear(dm, this.invert?.includes(dims[j]) ? [top, H - bottom] : [H - bottom, top]));
    const canvas = rows.length > this.canvasThreshold;
    this.geo = { dims, names, fmts, doms, scales, x0, x1, top, bottom, gapX, labelR, stagger, canvas };
    const lines: PLine<T>[] = rows.map((r) => ({ i: r.i, label: r.label, vals: r.vals, ys: r.vals.map((v, j) => (Number.isFinite(v) ? scales[j](v) : NaN)), hi: hi.has(r.i), datum: r.d }));
    this.lines = lines;

    const D = this.duration ?? this.defaultDuration;
    const mid = (top + H - bottom) / 2;
    let marks: Mark<PLine<T> | null>[];
    if (canvas) marks = [{ key: "__p", to: [1], from: [0], data: null }];
    else {
      // The emphasised lines on top; a missing value moves as the middle and isn't drawn
      const order = [...lines].sort((a, b) => Number(a.hi) - Number(b.hi));
      marks = order.map((l, k) => {
        const ys = l.ys.map((y) => (Number.isFinite(y) ? y : mid));
        return { key: `p:${l.i}`, to: [1, ...ys], from: [0, ...ys], enter: [0, ...ys], parts: [1, ys.length], delay: l.hi ? D * 0.35 : (k / Math.max(1, order.length)) * D * 0.3, data: l };
      });
    }
    const events = lazyArray(lines.length, (k) => {
      const l = lines[k];
      return { datum: l.datum, index: l.i, key: `${l.i}`, label: this.rowName(l), value: Number.isFinite(l.vals[0]) ? l.vals[0] : null, formatted: dims.map((_, j) => `${names[j]} ${Number.isFinite(l.vals[j]) ? fmts[j](l.vals[j]) : "–"}`).join(", ") };
    });
    const summary = rows.length ? `${plural(rows.length, "row")}, ${plural(dims.length, "axis", "axes")} (${names.join(", ")})` : "";
    return { marks, events, summary };
  }

  /** The line nearest the pointer between the two axes it's between, within 10px */
  private nearest(px: number, py: number): number | null {
    const n = this.geo.dims.length;
    if (n < 2) return null;
    let j = 0;
    while (j < n - 2 && px > this.axX(j + 1)) j++;
    const t = Math.max(0, Math.min(1, (px - this.axX(j)) / (this.axX(j + 1) - this.axX(j) || 1)));
    let best = -1;
    let bd = Infinity;
    for (const l of this.lines) {
      const a = l.ys[j];
      const b = l.ys[j + 1];
      if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
      const d = Math.abs(a + (b - a) * t - py);
      if (d < bd) {
        bd = d;
        best = l.i;
      }
    }
    return bd < 10 ? best : null;
  }

  protected override plotMove(px: number, py: number, e: PointerEvent) {
    this.setActive(this.nearest(px, py), e.pointerType === "touch" ? "touch" : "pointer");
  }

  private onClick = () => {
    if (this.active !== null) this.clickMark(this.active);
  };

  protected override tip(i: number, f: ChartFrame): TooltipData | null {
    const l = this.lines[i];
    if (!l) return null;
    const { dims, names, fmts } = this.geo;
    const ys = l.ys.filter(Number.isFinite);
    return {
      x: this.axX(Math.floor((dims.length - 1) / 2)),
      y: ys.length ? Math.min(...ys) : f.height / 2,
      title: this.rowName(l),
      rows: dims.map((_, j) => ({ label: names[j], value: Number.isFinite(l.vals[j]) ? fmts[j](l.vals[j]) : "–" })),
    };
  }

  private path(ys: readonly number[]) {
    let d = "";
    traceGapped(
      ys,
      this.axX,
      (x, y) => (d += `M${x.toFixed(1)},${y.toFixed(1)}`),
      (x, y) => (d += `L${x.toFixed(1)},${y.toFixed(1)}`),
    );
    return d;
  }

  protected override draw(f: ChartFrame) {
    const { width: W, height: H } = f;
    const { dims, names, fmts, doms, x0, x1, top, bottom, gapX, labelR, stagger, canvas } = this.geo;
    const m = this.motion;
    const D = this.duration ?? this.defaultDuration;
    const active = this.active;
    const showLabels = !this.hideLabels && this.lines.length <= 60;
    const lo = m.fade(D * 0.8, 300);
    return svg`<g @click=${this.onClick}>
      <rect class="tc-chart__hit" x=${x0} y=${top} width=${Math.max(0, x1 - x0)} height=${Math.max(0, H - top - bottom)}></rect>
      ${dims.map((k, j) => {
        const xx = this.axX(j);
        const [dlo, dhi] = doms[j];
        const inv = !!this.invert?.includes(k);
        // Staggered, a name's neighbours on its line are two spaces away; the end axes' names stay inside the chart
        const room = stagger ? Math.min(2 * gapX, 2 * Math.min(xx, W - xx)) - 8 : gapX - 8;
        return svg`<line class="ui-pcc__axis" x1=${xx} x2=${xx} y1=${top} y2=${H - bottom}></line>
          ${txt(xx, stagger && j % 2 ? 24 : 9, truncate(names[j], room, NAME_FONT, 700), { anchor: "middle", strong: true })}
          ${txt(xx + 4, top - 9, fmts[j](inv ? dlo : dhi))}
          ${txt(xx + 4, H - bottom + 9, fmts[j](inv ? dhi : dlo))}`;
      })}
      ${canvas
        ? nothing
        : m.items.map((it) => {
            const l = it.data;
            if (!l) return nothing;
            const t = it.v[0];
            const ys = it.v.slice(1).map((y, j) => (Number.isFinite(l.ys[j]) ? y : NaN));
            const isA = active === l.i;
            const dash = t < 0.999;
            return svg`<path class="ui-pcc__line" ?data-hi=${l.hi} ?data-active=${isA} ?data-dim=${active !== null && !isA && !l.hi} d=${this.path(ys)}
              opacity=${it.exiting ? 0.4 : nothing} pathLength=${dash ? 1 : nothing} stroke-dasharray=${dash ? "1 1" : nothing} stroke-dashoffset=${dash ? 1 - Math.max(0, Math.min(1, t)) : nothing}></path>`;
          })}
      ${canvas && active !== null && this.lines[active] ? svg`<path class="ui-pcc__line" data-active d=${this.path(this.lines[active].ys)}></path>` : nothing}
      ${showLabels && labelR
        ? this.lines
            .filter((l) => l.hi || active === l.i)
            .map((l) => {
              const y = [...l.ys].reverse().find(Number.isFinite);
              return y === undefined ? nothing : txt(x1 + 8, y, truncate(this.rowName(l), labelR - 10, NAME_FONT, 700), { cls: "value", strong: true, opacity: l.hi ? lo : 1 });
            })
        : nothing}
    </g>`;
  }

  protected override underlay(_f: ChartFrame) {
    return this.geo.canvas ? canvasUnderlay() : nothing;
  }

  /** The canvas: every quiet line in one faint stroke, the emphasised ones over them, revealed left to right */
  protected override paintUnderlay(plot: HTMLElement, f: ChartFrame) {
    if (!this.geo.canvas) return;
    const { width: W, height: H } = f;
    const { x0, x1 } = this.geo;
    const prog = Math.max(0, Math.min(1, this.motion.get("__p")?.[0] ?? 1));
    const lines = this.lines;
    paintCanvas(plot, W, H, (ctx, color) => {
      if (prog <= 0) return;
      ctx.save();
      if (prog < 1) {
        ctx.beginPath();
        ctx.rect(0, 0, x0 + (x1 - x0 + 2) * prog, H);
        ctx.clip();
      }
      ctx.lineWidth = 1;
      ctx.strokeStyle = color("var(--tc-pcc-rest)");
      // Fainter the more lines there are, so the density shows
      ctx.globalAlpha = Math.max(0.04, Math.min(0.35, 60 / Math.max(1, lines.length)));
      ctx.beginPath();
      for (const l of lines) {
        if (l.hi) continue;
        traceGapped(l.ys, this.axX, (x, y) => ctx.moveTo(x, y), (x, y) => ctx.lineTo(x, y));
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = color("var(--tc-pcc-hi)");
      for (const l of lines) {
        if (!l.hi) continue;
        ctx.beginPath();
        traceGapped(l.ys, this.axX, (x, y) => ctx.moveTo(x, y), (x, y) => ctx.lineTo(x, y));
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  static override css = /* css */ `
[data-ui="pcc"] {
  --tc-pcc-hi: var(--tc-plot-accent);
  --tc-pcc-rest: var(--tc-plot-line-rest);
  --tc-pcc-active: var(--tc-plot-focus);
}
.ui-pcc__axis { stroke: var(--tc-plot-zero); stroke-width: 1; shape-rendering: crispEdges; }
.ui-pcc__line { fill: none; stroke: var(--tc-pcc-rest); stroke-opacity: 0.55; stroke-width: 1.3; stroke-linejoin: round; pointer-events: none; transition: stroke-opacity var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-pcc__line[data-dim] { stroke-opacity: 0.25; }
.ui-pcc__line[data-active] { stroke: var(--tc-pcc-active); stroke-opacity: 1; stroke-width: 2; }
.ui-pcc__line[data-hi] { stroke: var(--tc-pcc-hi); stroke-opacity: 1; stroke-width: 2.6; }
@media (forced-colors: active) {
  .ui-pcc__axis { stroke: GrayText; }
  .ui-pcc__line { stroke: CanvasText; }
  .ui-pcc__line[data-hi], .ui-pcc__line[data-active] { stroke: Highlight; }
}
`;
}

if (!customElements.get("tc-parallel-chart")) customElements.define("tc-parallel-chart", TcParallelChart);

declare global {
  interface HTMLElementTagNameMap {
    "tc-parallel-chart": TcParallelChart;
  }
}
