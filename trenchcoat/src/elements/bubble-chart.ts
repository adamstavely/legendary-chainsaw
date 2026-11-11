import { html, nothing, svg } from "lit";
import { property, state } from "lit/decorators.js";
import { gridY, txt, yAxisWidth } from "./internal/chart/axis";
import { canvasUnderlay, paintCanvas } from "./internal/chart/canvas";
import { AXIS_FONT, categoricalInk, emphasisInk, TcChartElement, type ChartFrame, type ChartModel } from "./internal/chart/element";
import { numGetter, strGetter } from "./internal/chart/accessor";
import { makeTickFormatter, type FormatSpec, type ValueFormatter } from "./internal/chart/format";
import { areaPath, linePath } from "./internal/chart/geometry";
import { resolveHighlight } from "./internal/chart/highlight";
import { plural } from "./internal/chart/i18n";
import { lazyArray } from "./internal/chart/lazy";
import { extent, fitDomain, scaleLinear, scaleSqrt } from "./internal/chart/scale";
import { linearFit, loess } from "./internal/chart/stats";
import { labelBox, overlaps, textWidth, type Box } from "./internal/chart/text";
import type { Accessor, ChartEvent, Row, TooltipData } from "./internal/chart/types";

/*
 * <tc-bubble-chart> – points by two values, x and y, and a third as the circle's area; without `size` it's a scatter
 * plot. Ported from ztd-charts' BubbleChart (MIT, © 2026 Junhan2). The largest bubble takes the accent and the rest
 * stay quiet (`highlight` picks others; a scatter plot emphasises none by default); the emphasised and then the
 * largest are named beside their circles where the names fit, up to `max-labels`. Circles grow in from left to right
 * when the chart comes on screen and glide when the data changes. Above `canvas-threshold` points (1500) they're
 * painted on a canvas under the SVG, which keeps the axes and the active point. `trend` fits a line through them –
 * least squares ("linear", with its r² beside it and, with `trend-band`, its 95% confidence band) or LOESS ("smooth").
 * With `group`, points of a group share a categorical ink and the header holds a legend: pointing at or focusing a
 * group mutes the others, and pressing it hides or shows the group (`groups`; the axes stay put). `stats` adds a row of
 * stat tiles under the chart.
 *   · one tab stop: arrows move point to point in data order, each read with x, y and size
 *   · the legend is a toolbar of toggle buttons with one tab stop: arrows move, Enter or Space shows or hides
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-bubble-chart heading="Grants" .data=${[{ x: 3, y: 12, size: 40, label: "Genomics" }]}></tc-bubble-chart>
 */

/** Circles of different sizes: Lucide's "chart-scatter" (ISC, lucide.dev), with sized dots */
const bubbleIcon = svg`<circle cx="8.5" cy="14.5" r="2.5"></circle><circle cx="16" cy="8" r="3"></circle><circle cx="17.5" cy="16.5" r="1"></circle><path d="M3 3v16a2 2 0 0 0 2 2h16"></path>`;

type Dot = { i: number; x: number; y: number; r: number; vx: number; vy: number; vs: number; label: string; hi: boolean; g: number };
/** A circle, or null for the canvas's single progress mark */
type DotMark = Dot | null;
type Label = { d: Dot; x: number; y: number; anchor: "start" | "end" | "middle" };
/** A trend line's samples across x, in px, with its band and its label */
type Trend = { xs: number[]; ys: number[]; lo: number[] | null; up: number[] | null; label: { text: string; x: number; y: number } | null };

export type BubbleTrend = "none" | "linear" | "smooth";
/** A stat tile under the chart: its name, its value (a number is written in the chart's format) and its change in % */
export type BubbleStat = { label: string; value: string | number; change?: number };
/** The groups shown after a legend button was pressed */
export type BubbleGroupsChange = { groups: string[] };

/** Samples along a trend line */
const TS = 48;

/** Drawing order: the emphasised on top, then the smaller. Above 0, a is drawn over b */
const drawOrder = (a: Dot, b: Dot) => Number(a.hi) - Number(b.hi) || b.r - a.r;

/**
 * Points by x and y, sized by a third value – a bubble chart, or a scatter plot without `size` – with the largest
 * emphasised and named, that switches to a canvas for thousands of points.
 * @tag tc-bubble-chart
 * @fires tc-view-change - The Table button was pressed ({ view }: ChartViewChange); cancelable – prevented, `view` stays as it was
 * @fires tc-mark-hover - The pointer or keyboard moved to a point, or off them ({ event }: ChartMarkHover)
 * @fires tc-mark-click - A point was clicked, or picked with Enter or Space ({ event }: ChartMarkClick)
 * @fires tc-groups-change - A legend button hid or showed a group ({ groups }: BubbleGroupsChange); cancelable – prevented, `groups` stays as it was
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
  /** A line fitted through the points: "linear" (least squares, its r² beside it) or "smooth" (LOESS); none by default */
  @property() accessor trend: BubbleTrend = "none";
  /** Shades the 95% confidence band round a linear trend */
  @property({ type: Boolean, attribute: "trend-band" }) accessor trendBand = false;
  /** The group field: points of a group share an ink, and the header's legend can isolate, hide and show each group */
  @property({ attribute: false }) accessor group: Accessor<T, string> | undefined = undefined;
  /** The groups shown; by default all of them. Changed by the legend unless a tc-groups-change listener calls preventDefault() */
  @property({ attribute: false }) accessor groups: string[] | undefined = undefined;
  /** Stat tiles under the chart: { label, value, change? } */
  @property({ attribute: false }) accessor stats: BubbleStat[] = [];

  /** @internal The group the legend is pointing at or focused on: the others are muted */
  @state() accessor isolated: string | null = null;
  /** @internal The legend button that holds the tab stop */
  @state() accessor legendFocus = 0;

  protected override get kind() {
    return this.size !== undefined ? "Bubble chart" : "Scatter plot";
  }
  protected override readonly icon = bubbleIcon;
  protected override defaultDuration = 800;
  protected override modelKeys = ["x", "y", "size", "label", "sizeRange", "xLabel", "yLabel", "zero", "maxLabels", "canvasThreshold", "xFormat", "trend", "trendBand", "group", "groups"];

  private dots: Dot[] = [];
  /** Every group in the data, in order of first appearance */
  private groupList: string[] = [];
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
    trend: null as Trend | null,
  };
  private painted = "";

  protected override defaultHeight(w: number) {
    return Math.max(220, Math.min(320, w * 0.6));
  }

  protected override tableHeader() {
    return "Point";
  }

  protected override seriesHeader() {
    return "Group";
  }

  /** A point's ink: its group's, muted while the legend isolates another group; else the emphasis ink */
  private ink(d: Dot) {
    if (d.g < 0) return emphasisInk(d.hi);
    return this.isolated !== null && this.groupList[d.g] !== this.isolated ? "var(--tc-bbl-muted)" : categoricalInk(d.g);
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
    const gg = this.group !== undefined ? strGetter(this.group, "group") : null;
    const all = this.data
      .map((d, i) => ({ d, x: gx(d, i), y: gy(d, i), s: gs ? Math.max(0, gs(d, i) || 0) : 1, label: gl(d, i), group: gg ? gg(d, i) : "" }))
      .filter((r) => Number.isFinite(r.x) && Number.isFinite(r.y));
    const groupList = gg ? [...new Set(all.map((r) => r.group))] : [];
    this.groupList = groupList;
    if (this.legendFocus >= groupList.length) this.legendFocus = 0;
    // A hidden group's points leave, but the axes are fitted to every point, so the others stay where they were
    const shown = this.groups ? new Set(this.groups) : null;
    const raw = shown ? all.filter((r) => shown.has(r.group)) : all;
    const n = raw.length;
    const canvas = n > this.canvasThreshold;
    const [xmn, xmx] = extent(n ? raw.map((r) => r.x) : [0, 1]);
    const [ymn, ymx] = extent(n ? raw.map((r) => r.y) : [0, 1]);
    const fx = extent(all.length ? all.map((r) => r.x) : [0, 1]);
    const fy = extent(all.length ? all.map((r) => r.y) : [0, 1]);
    const [smn, smx] = extent(all.length ? all.map((r) => r.s) : [0, 1]);
    const yDom = fitDomain(fy[0], fy[1], Math.max(2, Math.round(H / 70)), { zero: this.zero, pad: 0.08 });
    const xDom = fitDomain(fx[0], fx[1], Math.max(2, Math.round(W / 110)), { zero: this.zero, pad: 0.06 });
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
    // Grouped, the inks tell the groups apart: nothing is emphasised unless `highlight` says so
    const hi = resolveHighlight(this.highlight, raw.map((r) => r.d), raw.map((r) => r.label), raw.map((r) => (hasSize ? r.s : r.y)), hasSize && !gg ? "max" : "none");
    const dots: Dot[] = raw.map((r, k) => ({ i: k, x: xs(r.x), y: ys(r.y), r: rs(r.s), vx: r.x, vy: r.y, vs: r.s, label: r.label, hi: hi.has(k), g: gg ? groupList.indexOf(r.group) : -1 }));
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

    // The trend, sampled across the points' own x range, never past it
    let trend: Trend | null = null;
    let trendWords = "";
    if (this.trend !== "none" && n >= 3 && xmx > xmn) {
      const vx = raw.map((r) => r.x);
      const vy = raw.map((r) => r.y);
      const at = Array.from({ length: TS }, (_, k) => xmn + ((xmx - xmn) * k) / (TS - 1));
      const fit = this.trend === "linear" ? linearFit(vx, vy) : null;
      const line = fit ? at.map((x) => fit.at(x)) : this.trend === "smooth" ? loess(vx, vy, at) : [];
      if (line.length && line.every(Number.isFinite)) {
        // Kept inside the plot: a steep line or a wide band is cut at its edges
        const clampY = (v: number) => Math.max(top, Math.min(H - bottom, ys(v)));
        const band = fit && this.trendBand;
        trend = {
          xs: at.map((x) => xs(x)),
          ys: line.map(clampY),
          lo: band ? at.map((x, k) => clampY(line[k] - fit.half(x))) : null,
          up: band ? at.map((x, k) => clampY(line[k] + fit.half(x))) : null,
          label: null,
        };
        const r2 = fit ? fit.r2.toLocaleString(f.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "";
        trendWords = fit ? ` Linear trend, r² ${r2}.` : " Smooth trend.";
        if (fit && !this.hideLabels) {
          // r² beside the line's right end, above it or below, where it overlaps no circle or name
          const text = `r² ${r2}`;
          const ex = trend.xs[TS - 1];
          const ey = trend.ys[TS - 1];
          const taken: Box[] = [
            ...dots.map((d) => ({ x: d.x - d.r, y: d.y - d.r, w: d.r * 2, h: d.r * 2 })),
            ...labels.map((l) => labelBox(l.d.label, l.x, l.y, AXIS_FONT, l.anchor, l.d.hi ? 700 : 500)),
          ];
          for (const ty of [ey - 9, ey + 13]) {
            const b = labelBox(text, ex, ty, AXIS_FONT, "end", 600);
            if (b.x < left || b.y < top - 8 || b.y + b.h > H - bottom) continue;
            if (n <= 400 && taken.some((q) => overlaps(q, b, 1))) continue;
            trend.label = { text, x: ex, y: ty };
            break;
          }
        }
      }
    }
    this.geo = { left, top, bottom, rMax, xs, ys, xTicks, yTicks, xFmt, yFmt, labels, canvas, trend };
    this.painted = "";

    const D = this.duration ?? this.defaultDuration;
    const xr = W || 1;
    const marks: ChartModel<DotMark, T>["marks"] = canvas
      ? [{ key: "__p", to: [1], from: [0], data: null }]
      : [...dots].sort(drawOrder).map((d) => ({ key: `b${d.i}:${d.label}`, to: [d.x, d.y, d.r], from: [d.x, d.y, 0], enter: [d.x, d.y, 0], delay: (d.x / xr) * D * 0.55, data: d as DotMark }));
    // The trend glides with the data; it comes in after the points
    if (trend) {
      const to = [...trend.ys, ...(trend.lo ?? []), ...(trend.up ?? [])];
      const mid = [...trend.ys, ...trend.ys, ...trend.ys].slice(0, to.length);
      marks.push({ key: "__t", to, from: mid, enter: mid, delay: D * 0.45, data: null });
    }
    const { fv, fmt } = f;
    const events: ChartEvent<T>[] = lazyArray(n, (k) => {
      const d = dots[k];
      const series = gg ? raw[k].group : undefined;
      return { datum: raw[k].d, index: k, key: `${k}`, label: d.label || this.nth(k + 1), series, value: hasSize ? d.vs : d.vy, formatted: `x ${xFmt(d.vx)}, y ${fv(d.vy)}${hasSize ? `, size ${fmt(d.vs)}` : ""}` };
    });
    const groupWords = gg ? ` ${plural(groupList.length, "group")}${shown ? `, ${shown.size < groupList.length ? `showing ${groupList.filter((g) => shown.has(g)).join(", ")}` : "all shown"}` : ""}.` : "";
    const summary = `${plural(n, "point")}.${groupWords} x from ${xFmt(xmn)} to ${xFmt(xmx)}, y from ${yFmt(ymn)} to ${yFmt(ymx)}.${trendWords}`;
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
        ...(d.g >= 0 ? [{ label: "Group", value: this.groupList[d.g], color: categoricalInk(d.g) }] : []),
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
    const sig = `${t}|${W}x${H}|${this.isolated ?? ""}`;
    const cv = plot.querySelector(".tc-chart__canvas");
    if (this.painted === sig && cv?.getAttribute("data-painted") === sig) return;
    const dots = this.dots;
    paintCanvas(plot, W, H, (ctx, color) => {
      const xr = W || 1;
      if (this.groupList.length) {
        // Grouped: each point in its group's ink, muted ones first so the isolated group sits on top
        const inks = new Map<string, string>();
        const order = [...dots].sort((a, b) => Number(this.ink(a) !== "var(--tc-bbl-muted)") - Number(this.ink(b) !== "var(--tc-bbl-muted)"));
        ctx.globalAlpha = 0.75;
        for (const d of order) {
          const k = Math.max(0, Math.min(1, (t * 1.4 - (d.x / xr) * 0.4) * 2.5));
          if (k <= 0) continue;
          const ink = this.ink(d);
          if (!inks.has(ink)) inks.set(ink, color(ink));
          ctx.fillStyle = inks.get(ink)!;
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r * k, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        return;
      }
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
    const { left, bottom, xs, ys, xTicks, yTicks, xFmt, yFmt, labels, canvas, trend } = this.geo;
    const hasSize = this.size !== undefined;
    const m = this.motion;
    const D = this.duration ?? this.defaultDuration;
    const active = this.active !== null ? this.dots[this.active] : undefined;
    const fade = m.fade(D * 0.6, 300);
    // The trend's samples as they glide: the line, then the band's low and high edges
    let trendLine: unknown = nothing;
    let trendBand: unknown = nothing;
    if (trend) {
      const v = m.get("__t") ?? [...trend.ys, ...(trend.lo ?? []), ...(trend.up ?? [])];
      const pt = (off: number) => trend.xs.map((x, k) => [x, v[off + k] ?? trend.ys[k]] as [number, number]);
      const tf = m.fade(D * 0.9, 300);
      trendLine = svg`<path class="ui-bbl__trend" d=${linePath(pt(0), this.trend === "smooth" ? "smooth" : "linear")} opacity=${tf}></path>`;
      if (trend.lo && trend.up) trendBand = svg`<path class="ui-bbl__band" d=${areaPath(pt(TS * 2), pt(TS), "smooth")} opacity=${tf}></path>`;
    }
    return svg`
      <rect class="tc-chart__hit" x="0" y="0" width=${W} height=${H} @click=${() => this.active !== null && this.clickMark(this.active)}></rect>
      ${this.yLabel ? txt(left, 6, this.yLabel) : nothing}
      ${gridY({ ticks: yTicks, y: ys, x0: left, x1: W, fmt: yFmt, locale: f.locale })}
      <g>${xTicks.map((t) => txt(xs(t), H - bottom + 13, xFmt(t), { anchor: "middle" }))}</g>
      ${this.xLabel ? txt(W - 2, H - bottom - 8, this.xLabel, { anchor: "end" }) : nothing}
      ${trendBand}
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
              style=${`fill: ${this.ink(d)}`} fill-opacity=${d.hi ? 0.92 : hasSize ? 0.85 : 0.7}
              opacity=${it.exiting ? 0.3 : this.active === null || isA ? 1 : 0.55}
              @pointerenter=${h.enter} @click=${h.click}></circle>`;
          })}
      ${trendLine}
      ${labels.map((l) => txt(l.x, l.y, l.d.label, { anchor: l.anchor, cls: "value", strong: l.d.hi, opacity: fade }))}
      ${trend?.label ? this.trendLabel(trend.label, m.fade(D * 0.9, 300)) : nothing}`;
  }

  /* ---------- The legend: one toggle button per group ---------- */

  protected override headerLegend() {
    const list = this.groupList;
    if (!list.length) return nothing;
    const shown = this.groups ? new Set(this.groups) : null;
    return html`<div class="tc-chart__legend ui-bbl__legend" role="toolbar" aria-label="Groups" @keydown=${this.legendKey}>
      ${list.map((g, i) => {
        const on = !shown || shown.has(g);
        return html`<button type="button" class="tc-chart__key ui-bbl__key" data-group=${g} aria-pressed=${on ? "true" : "false"} tabindex=${i === this.legendFocus ? 0 : -1}
          ?data-isolated=${this.isolated === g}
          @click=${() => this.toggleGroup(g)}
          @pointerenter=${() => this.isolate(on ? g : null)} @pointerleave=${() => this.isolate(null)}
          @focus=${() => {
            this.legendFocus = i;
            this.isolate(on ? g : null);
          }}
          @blur=${() => this.isolate(null)}>
          <span class="tc-chart__swatch ui-bbl__swatch" aria-hidden="true" style=${`--tc-bbl-key: ${categoricalInk(i)}`}></span>${g}
        </button>`;
      })}
    </div>`;
  }

  private isolate(g: string | null) {
    if (this.isolated !== g) this.isolated = g;
  }

  private legendKey = (e: KeyboardEvent) => {
    const n = this.groupList.length;
    const cur = this.legendFocus;
    const next = e.key === "ArrowRight" || e.key === "ArrowDown" ? (cur + 1) % n : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (cur - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : null;
    if (next === null) return;
    e.preventDefault();
    this.legendFocus = next;
    void this.updateComplete.then(() => this.querySelectorAll<HTMLButtonElement>(".ui-bbl__key")[next]?.focus());
  };

  /** Hides or shows a group; the last group shown stays */
  private toggleGroup(g: string) {
    const list = this.groupList;
    const cur = (this.groups ?? list).filter((x) => list.includes(x));
    const on = cur.includes(g);
    if (on && cur.length <= 1) return;
    const groups = on ? cur.filter((x) => x !== g) : list.filter((x) => x === g || cur.includes(x));
    if (!this.emit<BubbleGroupsChange>("tc-groups-change", { groups }, { cancelable: true })) return;
    this.groups = groups;
    if (on) this.isolate(null);
  }

  /** A change in %, signed: the sign carries the direction as well as the tone */
  private change(v: number) {
    const abs = Math.abs(v).toLocaleString(this.locale, { maximumFractionDigits: 1 });
    return `${v > 0 ? "+" : v < 0 ? "−" : ""}${abs}%`;
  }

  protected override render() {
    const chart = super.render();
    if (!this.stats.length) return chart;
    return html`${chart}
      <dl class="ui-bbl__stats">
        ${this.stats.map(
          (s) => html`<div class="ui-bbl__stat">
            <dt class="ui-bbl__stat-label">${s.label}</dt>
            <dd class="ui-bbl__stat-value">
              ${typeof s.value === "number" ? this.frame.fmt(s.value) : s.value}${s.change !== undefined && Number.isFinite(s.change)
                ? html` <span class="ui-bbl__stat-change" data-dir=${s.change > 0 ? "up" : s.change < 0 ? "down" : "flat"}>${this.change(s.change)}</span>`
                : nothing}
            </dd>
          </div>`,
        )}
      </dl>`;
  }

  /** r² on a chip of the card's colour: on a canvas, past the threshold, it may sit over painted points */
  private trendLabel(l: { text: string; x: number; y: number }, opacity: number) {
    const w = textWidth(l.text, AXIS_FONT, 600);
    return svg`<g pointer-events="none" opacity=${opacity}><rect class="ui-bbl__trend-back" x=${l.x - w - 5} y=${l.y - 8} width=${w + 8} height="16" rx="5"></rect>${txt(l.x - 1, l.y, l.text, { anchor: "end", cls: "value" })}</g>`;
  }

  static override css = /* css */ `
[data-ui="bbl"] {
  --tc-bbl-trend: var(--tc-text-primary);
  /* Points of the groups the legend isn't isolating */
  --tc-bbl-muted: var(--tc-border-default);
  --tc-bbl-stat-min: 120px;
}
/* Circles are parted by a line of the card's colour; the active one is ringed */
.ui-bbl__dot { stroke: var(--tc-plot-bg); stroke-width: 0.6; }
.ui-bbl__dot[data-sized] { stroke-width: 1.2; }
.ui-bbl__dot[data-active] { stroke: var(--tc-plot-focus); stroke-width: 2; }
/* The trend: a dashed line over the points, its band a faint wash under them */
.ui-bbl__trend { fill: none; stroke: var(--tc-bbl-trend); stroke-width: 1.8; stroke-dasharray: 6 4; stroke-linecap: round; pointer-events: none; }
.ui-bbl__band { fill: var(--tc-bbl-trend); fill-opacity: 0.08; stroke: none; pointer-events: none; }
.ui-bbl__trend-back { fill: var(--tc-plot-bg); opacity: 0.94; }
/* The legend: a toggle button per group – a hidden group's swatch is an outline and its name struck through */
.ui-bbl__key { margin: 0; padding: var(--tc-space-0-5) var(--tc-space-1); border: 0; border-radius: var(--tc-radius-sm); background: none; color: inherit; font: inherit; cursor: pointer; }
.ui-bbl__key:hover, .ui-bbl__key[data-isolated] { background: var(--tc-surface-sunken); color: var(--tc-text-primary); }
.ui-bbl__key:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-bbl__swatch { background: var(--tc-bbl-key); box-shadow: inset 0 0 0 1.5px var(--tc-bbl-key); }
.ui-bbl__key[aria-pressed="false"] { color: var(--tc-text-muted); text-decoration: line-through; }
.ui-bbl__key[aria-pressed="false"] .ui-bbl__swatch { background: none; }
/* Stat tiles under the chart: white tiles on the Standard tray, wells inside the Clean card */
.ui-bbl__stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(var(--tc-bbl-stat-min), 1fr)); gap: var(--tc-space-2); margin: var(--tc-space-2) 0 0; padding: 0; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="bbl"]:not([bare]) .ui-bbl__stats { margin: 0; padding: 0 var(--tc-space-4) var(--tc-space-4); }
.ui-bbl__stat { min-width: 0; padding: var(--tc-space-2) var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-surface-sunken); }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="bbl"] .ui-bbl__stat { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-bbl__stat-label { overflow: hidden; font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); text-overflow: ellipsis; white-space: nowrap; }
.ui-bbl__stat-value { margin: var(--tc-space-0-5) 0 0; font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-tight); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-bbl__stat-change { font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
.ui-bbl__stat-change[data-dir="up"] { color: var(--tc-status-success-fg); }
.ui-bbl__stat-change[data-dir="down"] { color: var(--tc-status-danger-fg); }
@media (forced-colors: active) {
  .ui-bbl__dot { forced-color-adjust: none; }
  .ui-bbl__swatch { forced-color-adjust: none; }
}
`;
}

if (!customElements.get("tc-bubble-chart")) customElements.define("tc-bubble-chart", TcBubbleChart);

declare global {
  interface HTMLElementTagNameMap {
    "tc-bubble-chart": TcBubbleChart;
  }
}
