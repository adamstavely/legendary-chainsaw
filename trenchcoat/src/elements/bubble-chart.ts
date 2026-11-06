import { nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { gridY, txt, yAxisWidth } from "./internal/chart/axis";
import { canvasUnderlay, paintCanvas } from "./internal/chart/canvas";
import { AXIS_FONT, emphasisInk, TcChartElement, type ChartFrame, type ChartModel } from "./internal/chart/element";
import { numGetter, strGetter } from "./internal/chart/accessor";
import { makeTickFormatter, type FormatSpec, type ValueFormatter } from "./internal/chart/format";
import { resolveHighlight } from "./internal/chart/highlight";
import { plural } from "./internal/chart/i18n";
import { lazyArray } from "./internal/chart/lazy";
import { extent, fitDomain, scaleLinear, scaleSqrt } from "./internal/chart/scale";
import { labelBox, overlaps, type Box } from "./internal/chart/text";
import type { Accessor, ChartEvent, Row, TooltipData } from "./internal/chart/types";

/*
 * <tc-bubble-chart> – points by two values, x and y, and a third as the circle's area; without `size` it's a scatter
 * plot. Ported from ztd-charts' BubbleChart (MIT, © 2026 Junhan2). The largest bubble takes the accent and the rest
 * stay quiet (`highlight` picks others; a scatter plot emphasises none by default); the emphasised and then the
 * largest are named beside their circles where the names fit, up to `max-labels`. Circles grow in from left to right
 * when the chart comes on screen and glide when the data changes. Above `canvas-threshold` points (1500) they're
 * painted on a canvas under the SVG, which keeps the axes and the active point.
 *   · one tab stop: arrows move point to point in data order, each read with x, y and size
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-bubble-chart heading="Grants" .data=${[{ x: 3, y: 12, size: 40, label: "Genomics" }]}></tc-bubble-chart>
 */

/** Circles of different sizes: Lucide's "chart-scatter" (ISC, lucide.dev), with sized dots */
const bubbleIcon = svg`<circle cx="8.5" cy="14.5" r="2.5"></circle><circle cx="16" cy="8" r="3"></circle><circle cx="17.5" cy="16.5" r="1"></circle><path d="M3 3v16a2 2 0 0 0 2 2h16"></path>`;

type Dot = { i: number; x: number; y: number; r: number; vx: number; vy: number; vs: number; label: string; hi: boolean };
/** A circle, or null for the canvas's single progress mark */
type DotMark = Dot | null;
type Label = { d: Dot; x: number; y: number; anchor: "start" | "end" | "middle" };

/** Drawing order: the emphasised on top, then the smaller. Above 0, a is drawn over b */
const drawOrder = (a: Dot, b: Dot) => Number(a.hi) - Number(b.hi) || b.r - a.r;

/**
 * Points by x and y, sized by a third value – a bubble chart, or a scatter plot without `size` – with the largest
 * emphasised and named, that switches to a canvas for thousands of points.
 * @tag tc-bubble-chart
 * @fires tc-view-change - The Table button was pressed ({ view }: ChartViewChange); cancelable – prevented, `view` stays as it was
 * @fires tc-mark-hover - The pointer or keyboard moved to a point, or off them ({ event }: ChartMarkHover)
 * @fires tc-mark-click - A point was clicked, or picked with Enter or Space ({ event }: ChartMarkClick)
 */
export class TcBubbleChart<T = Row> extends TcChartElement<DotMark, T> {
  static override ui = "bbl";

  /** The x field; by default "x" */
  @property({ attribute: false }) accessor x: Accessor<T, number> | undefined = undefined;
  /** The y field; by default "y" */
  @property({ attribute: false }) accessor y: Accessor<T, number> | undefined = undefined;
  /** The size field, drawn as the circle's area; without it the chart is a scatter plot */
  @property({ attribute: false }) accessor size: Accessor<T, number> | undefined = undefined;
  /** The point's name field, for its label, the tooltip and the table; by default "label", else "#n" */
  @property({ attribute: false }) accessor label: Accessor<T, string> | undefined = undefined;
  /** The circles' smallest and largest radius in px; by default [4, about a 22nd of the width] */
  @property({ attribute: false }) accessor sizeRange: [number, number] | undefined = undefined;
  /** The x axis's name, at its right end */
  @property({ attribute: "x-label" }) accessor xLabel = "";
  /** The y axis's name, above it */
  @property({ attribute: "y-label" }) accessor yLabel = "";
  /** Starts both axes at zero */
  @property({ type: Boolean }) accessor zero = false;
  /** How many points are named beside their circles at most */
  @property({ type: Number, attribute: "max-labels" }) accessor maxLabels = 6;
  /** Above this many points the circles are painted on a canvas */
  @property({ type: Number, attribute: "canvas-threshold" }) accessor canvasThreshold = 1500;
  /** How x values are written; `format` writes y */
  @property({ attribute: false }) accessor xFormat: FormatSpec | undefined = undefined;

  protected override get kind() {
    return this.size !== undefined ? "Bubble chart" : "Scatter plot";
  }
  protected override readonly icon = bubbleIcon;
  protected override defaultDuration = 800;
  protected override modelKeys = ["x", "y", "size", "label", "sizeRange", "xLabel", "yLabel", "zero", "maxLabels", "canvasThreshold", "xFormat"];

  private dots: Dot[] = [];
  private grid = { cells: new Map<string, number[]>(), cell: 24 };
  private geo = {
    left: 0,
    top: 10,
    bottom: 24,
    rMax: 0,
    xs: scaleLinear([0, 1], [0, 1]),
    ys: scaleLinear([0, 1], [0, 1]),
    xTicks: [] as number[],
    yTicks: [] as number[],
    xFmt: String as ValueFormatter,
    yFmt: String as ValueFormatter,
    labels: [] as Label[],
    canvas: false,
  };
  private painted = "";

  protected override defaultHeight(w: number) {
    return Math.max(220, Math.min(320, w * 0.6));
  }

  protected override tableHeader() {
    return "Point";
  }

  private nth(i: number) {
    return `#${i}`;
  }

  protected override buildModel(f: ChartFrame): ChartModel<DotMark, T> {
    const { width: W, height: H } = f;
    const hasSize = this.size !== undefined;
    const gx = numGetter(this.x, "x");
    const gy = numGetter(this.y, "y");
    const gs = hasSize ? numGetter(this.size, "size") : null;
    const gl = strGetter(this.label, "label");
    const raw = this.data
      .map((d, i) => ({ d, x: gx(d, i), y: gy(d, i), s: gs ? Math.max(0, gs(d, i) || 0) : 1, label: gl(d, i) }))
      .filter((r) => Number.isFinite(r.x) && Number.isFinite(r.y));
    const n = raw.length;
    const canvas = n > this.canvasThreshold;
    const [xmn, xmx] = extent(n ? raw.map((r) => r.x) : [0, 1]);
    const [ymn, ymx] = extent(n ? raw.map((r) => r.y) : [0, 1]);
    const [smn, smx] = extent(n ? raw.map((r) => r.s) : [0, 1]);
    const yDom = fitDomain(ymn, ymx, Math.max(2, Math.round(H / 70)), { zero: this.zero, pad: 0.08 });
    const xDom = fitDomain(xmn, xmx, Math.max(2, Math.round(W / 110)), { zero: this.zero, pad: 0.06 });
    const yFmt = makeTickFormatter(this.format, f.locale, Math.max(Math.abs(yDom[0]), Math.abs(yDom[1])));
    const xFmt = makeTickFormatter(this.xFormat, f.locale, Math.max(Math.abs(xDom[0]), Math.abs(xDom[1])));
    const yTicks = scaleLinear(yDom, [0, 1]).ticks(Math.max(2, Math.round(H / 70)));
    const left = yAxisWidth(yTicks, yFmt, f.locale);
    const top = this.yLabel ? 20 : 10;
    const bottom = 24;
    const [rMin, rMax] = this.sizeRange ?? (hasSize ? [4, Math.max(10, Math.min(28, W / 22))] : [n > 2000 ? 1.6 : n > 300 ? 2.6 : 4, 0]);
    const pad = hasSize ? rMax * 0.6 : 4;
    const xs = scaleLinear(xDom, [left + 6 + pad, W - 8 - pad]);
    const ys = scaleLinear(yDom, [H - bottom - pad, top + pad]);
    const rs = hasSize ? scaleSqrt([Math.min(0, smn), smx || 1], [rMin, rMax]) : () => rMin;
    const hi = resolveHighlight(this.highlight, raw.map((r) => r.d), raw.map((r) => r.label), raw.map((r) => (hasSize ? r.s : r.y)), hasSize ? "max" : "none");
    const dots: Dot[] = raw.map((r, k) => ({ i: k, x: xs(r.x), y: ys(r.y), r: rs(r.s), vx: r.x, vy: r.y, vs: r.s, label: r.label, hi: hi.has(k) }));
    this.dots = dots;

    // A grid of 24px cells for finding the point under the pointer quickly
    const cell = 24;
    const cells = new Map<string, number[]>();
    dots.forEach((d, k) => {
      const key = `${Math.floor(d.x / cell)},${Math.floor(d.y / cell)}`;
      const arr = cells.get(key);
      if (arr) arr.push(k);
      else cells.set(key, [k]);
    });
    this.grid = { cells, cell };

    // Names beside the circles: the emphasised first, then the largest; one that would overlap a circle or another name is skipped
    const labels: Label[] = [];
    if (!this.hideLabels && n <= 400) {
      const cands = [...dots].sort((a, b) => Number(b.hi) - Number(a.hi) || b.r - a.r).filter((d) => d.label);
      const placed: Box[] = dots.map((d) => ({ x: d.x - d.r * 0.7, y: d.y - d.r * 0.7, w: d.r * 1.4, h: d.r * 1.4 }));
      for (const d of cands) {
        if (labels.length >= this.maxLabels) break;
        const tries: Omit<Label, "d">[] = [
          { x: d.x + d.r + 5, y: d.y, anchor: "start" },
          { x: d.x - d.r - 5, y: d.y, anchor: "end" },
          { x: d.x, y: d.y - d.r - 9, anchor: "middle" },
          { x: d.x, y: d.y + d.r + 10, anchor: "middle" },
        ];
        for (const t of tries) {
          const b = labelBox(d.label, t.x, t.y, AXIS_FONT, t.anchor, d.hi ? 700 : 500);
          if (b.x < left || b.x + b.w > W - 2 || b.y < 0 || b.y + b.h > H - bottom) continue;
          if (placed.some((q) => overlaps(q, b, 1))) continue;
          placed.push(b);
          labels.push({ d, ...t });
          break;
        }
      }
    }
    const xTicks = xs.ticks(Math.max(2, Math.round(W / 110)));
    this.geo = { left, top, bottom, rMax, xs, ys, xTicks, yTicks, xFmt, yFmt, labels, canvas };
    this.painted = "";

    const D = this.duration ?? this.defaultDuration;
    const xr = W || 1;
    const marks = canvas
      ? [{ key: "__p", to: [1], from: [0], data: null }]
      : [...dots].sort(drawOrder).map((d) => ({ key: `b${d.i}:${d.label}`, to: [d.x, d.y, d.r], from: [d.x, d.y, 0], enter: [d.x, d.y, 0], delay: (d.x / xr) * D * 0.55, data: d as DotMark }));
    const { fv, fmt } = f;
    const events: ChartEvent<T>[] = lazyArray(n, (k) => {
      const d = dots[k];
      return { datum: raw[k].d, index: k, key: `${k}`, label: d.label || this.nth(k + 1), value: hasSize ? d.vs : d.vy, formatted: `x ${xFmt(d.vx)}, y ${fv(d.vy)}${hasSize ? `, size ${fmt(d.vs)}` : ""}` };
    });
    const summary = `${plural(n, "point")}. x from ${xFmt(xmn)} to ${xFmt(xmx)}, y from ${yFmt(ymn)} to ${yFmt(ymx)}.`;
    return { marks, events, summary };
  }

  /** The point under (px, py) – the top one where circles overlap – else the nearest within 10px of its edge */
  private nearest(px: number, py: number) {
    const { cells, cell } = this.grid;
    const dots = this.dots;
    const cx0 = Math.floor(px / cell);
    const cy0 = Math.floor(py / cell);
    let best = -1;
    let bd = Infinity;
    let hit = -1;
    const reach = this.size !== undefined ? Math.ceil(this.geo.rMax / cell) + 1 : 1;
    for (let dx = -reach; dx <= reach; dx++)
      for (let dy = -reach; dy <= reach; dy++) {
        const arr = cells.get(`${cx0 + dx},${cy0 + dy}`);
        if (!arr) continue;
        for (const k of arr) {
          const d = dots[k];
          const dist = Math.hypot(d.x - px, d.y - py) - d.r;
          if (dist <= 0 && (hit < 0 || drawOrder(d, dots[hit]) > 0)) hit = k;
          if (dist < bd) {
            bd = dist;
            best = k;
          }
        }
      }
    if (hit >= 0) return hit;
    return bd <= 10 ? best : null;
  }

  protected override plotMove(x: number, y: number, e: PointerEvent) {
    const k = this.nearest(x, y);
    if (k !== this.active) this.setActive(k, e.pointerType === "touch" ? "touch" : "pointer");
  }

  protected override tip(i: number, f: ChartFrame): TooltipData | null {
    const d = this.dots[i];
    if (!d) return null;
    return {
      x: d.x,
      y: d.y - d.r,
      title: d.label || this.nth(d.i + 1),
      rows: [
        { label: this.xLabel || "x", value: this.geo.xFmt(d.vx) },
        { label: this.yLabel || "y", value: f.fv(d.vy) },
        ...(this.size !== undefined ? [{ label: "Size", value: f.fmt(d.vs), color: emphasisInk(d.hi) }] : []),
      ],
    };
  }

  protected override underlay() {
    return this.geo.canvas ? canvasUnderlay() : nothing;
  }

  protected override paintUnderlay(plot: HTMLElement, f: ChartFrame) {
    if (!this.geo.canvas) return;
    const t = this.motion.get("__p")?.[0] ?? 1;
    const { width: W, height: H } = f;
    // Hover and focus re-render the element: the canvas is painted again only when the points or the entrance moved
    const sig = `${t}|${W}x${H}`;
    const cv = plot.querySelector(".tc-chart__canvas");
    if (this.painted === sig && cv?.getAttribute("data-painted") === sig) return;
    const dots = this.dots;
    paintCanvas(plot, W, H, (ctx, color) => {
      const xr = W || 1;
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = color("var(--tc-plot-rest)");
      for (const d of dots) {
        if (d.hi) continue;
        const k = Math.max(0, Math.min(1, (t * 1.4 - (d.x / xr) * 0.4) * 2.5));
        if (k <= 0) continue;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r * k, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = color("var(--tc-plot-accent)");
      for (const d of dots) {
        if (!d.hi) continue;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r * Math.max(0, Math.min(1, t * 1.2)), 0, Math.PI * 2);
        ctx.fill();
      }
    });
    this.painted = sig;
    cv?.setAttribute("data-painted", sig);
  }

  protected override draw(f: ChartFrame) {
    const { width: W, height: H } = f;
    const { left, bottom, xs, ys, xTicks, yTicks, xFmt, yFmt, labels, canvas } = this.geo;
    const hasSize = this.size !== undefined;
    const m = this.motion;
    const D = this.duration ?? this.defaultDuration;
    const active = this.active !== null ? this.dots[this.active] : undefined;
    const fade = m.fade(D * 0.6, 300);
    return svg`
      <rect class="tc-chart__hit" x="0" y="0" width=${W} height=${H} @click=${() => this.active !== null && this.clickMark(this.active)}></rect>
      ${this.yLabel ? txt(left, 6, this.yLabel) : nothing}
      ${gridY({ ticks: yTicks, y: ys, x0: left, x1: W, fmt: yFmt, locale: f.locale })}
      <g>${xTicks.map((t) => txt(xs(t), H - bottom + 13, xFmt(t), { anchor: "middle" }))}</g>
      ${this.xLabel ? txt(W - 2, H - bottom - 8, this.xLabel, { anchor: "end" }) : nothing}
      ${canvas
        ? active
          ? svg`<circle class="tc-chart__focus" cx=${active.x} cy=${active.y} r=${active.r + 2}></circle>`
          : nothing
        : m.items.map((it) => {
            const d = it.data;
            if (!d) return nothing;
            const [cx, cy, r] = it.v;
            const isA = this.active === d.i;
            const h = this.hover(d.i);
            return svg`<circle class="tc-chart__mark ui-bbl__dot" ?data-active=${isA} ?data-sized=${hasSize} cx=${cx} cy=${cy} r=${Math.max(0, r)}
              style=${`fill: ${emphasisInk(d.hi)}`} fill-opacity=${d.hi ? 0.92 : hasSize ? 0.85 : 0.7}
              opacity=${it.exiting ? 0.3 : this.active === null || isA ? 1 : 0.55}
              @pointerenter=${h.enter} @click=${h.click}></circle>`;
          })}
      ${labels.map((l) => txt(l.x, l.y, l.d.label, { anchor: l.anchor, cls: "value", strong: l.d.hi, opacity: fade }))}`;
  }

  static override css = /* css */ `
/* Circles are parted by a line of the card's colour; the active one is ringed */
.ui-bbl__dot { stroke: var(--tc-plot-bg); stroke-width: 0.6; }
.ui-bbl__dot[data-sized] { stroke-width: 1.2; }
.ui-bbl__dot[data-active] { stroke: var(--tc-plot-focus); stroke-width: 2; }
@media (forced-colors: active) {
  .ui-bbl__dot { forced-color-adjust: none; }
}
`;
}

if (!customElements.get("tc-bubble-chart")) customElements.define("tc-bubble-chart", TcBubbleChart);

declare global {
  interface HTMLElementTagNameMap {
    "tc-bubble-chart": TcBubbleChart;
  }
}
