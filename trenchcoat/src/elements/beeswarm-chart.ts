import { nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { gridX, txt } from "./internal/chart/axis";
import { canvasUnderlay, paintCanvas } from "./internal/chart/canvas";
import { AXIS_FONT, emphasisInk, TcChartElement, type ChartFrame, type ChartModel } from "./internal/chart/element";
import { numGetter, strGetter, uniq } from "./internal/chart/accessor";
import { quantileSorted } from "./internal/chart/geometry";
import { resolveHighlight } from "./internal/chart/highlight";
import { plural } from "./internal/chart/i18n";
import { lazyArray } from "./internal/chart/lazy";
import { extent, fitDomain, scaleLinear } from "./internal/chart/scale";
import { beeswarm } from "./internal/chart/stats";
import { textWidth, truncate } from "./internal/chart/text";
import type { Accessor, ChartEvent, Row, TooltipData } from "./internal/chart/types";

/*
 * <tc-beeswarm-chart> – a distribution drawn point by point: every value a dot along one axis, pushed up or down just
 * enough that none overlap, in one row or a row per group. Ported from ztd-charts' BeeswarmChart (MIT, © 2026
 * Junhan2). With groups the one with the highest median takes the accent (`highlight` picks others) and each row
 * marks its median with a dashed line; without groups the highest point does. Dots grow in from the row's middle,
 * left to right, when the chart comes on screen. Above `canvas-threshold` points (2000) the dots are painted on a
 * canvas under the SVG, which keeps the axes, medians and the active dot.
 *   · one tab stop: arrows move dot to dot in data order, each read with its group and value
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-beeswarm-chart heading="Assay times" .data=${[{ value: 12, group: "Lab A" }, { value: 18, group: "Lab B" }]}></tc-beeswarm-chart>
 */

/** Dots in a swarm: Lucide's "chart-scatter" (ISC, lucide.dev) */
const beeIcon = svg`<circle cx="7.5" cy="7.5" r=".5" fill="currentColor"></circle><circle cx="18.5" cy="5.5" r=".5" fill="currentColor"></circle><circle cx="11.5" cy="11.5" r=".5" fill="currentColor"></circle><circle cx="7.5" cy="16.5" r=".5" fill="currentColor"></circle><circle cx="17.5" cy="14.5" r=".5" fill="currentColor"></circle><path d="M3 3v16a2 2 0 0 0 2 2h16"></path>`;

type Bee = { i: number; g: number; x: number; y: number; value: number; label: string; hi: boolean };
/** A dot, or null for the canvas's single progress mark */
type BeeMark = Bee | null;
type BeeRow<T> = { d: T; v: number; g: string; label: string };

/**
 * A distribution point by point – every value a dot, in one row or a row per group with its median – that switches to
 * a canvas for thousands of points.
 * @tag tc-beeswarm-chart
 * @fires tc-view-change - The Table button was pressed ({ view }: ChartViewChange); cancelable – prevented, `view` stays as it was
 * @fires tc-mark-hover - The pointer or keyboard moved to a dot, or off them ({ event }: ChartMarkHover)
 * @fires tc-mark-click - A dot was clicked, or picked with Enter or Space ({ event }: ChartMarkClick)
 */
export class TcBeeswarmChart<T = Row> extends TcChartElement<BeeMark, T> {
  static override ui = "bsw";

  /** The value field; by default "value" */
  @property({ attribute: false }) accessor value: Accessor<T, number> | undefined = undefined;
  /** The group field – a row per group; without it, one row */
  @property({ attribute: false }) accessor group: Accessor<T, string> | undefined = undefined;
  /** The dot's name field, for the tooltip and table; by default "label", else "#n" */
  @property({ attribute: false }) accessor label: Accessor<T, string> | undefined = undefined;
  /** The dots' radius in px; by default sized to how many there are */
  @property({ type: Number }) accessor radius: number | undefined = undefined;
  /** Leaves off each group's median line */
  @property({ type: Boolean, attribute: "hide-median" }) accessor hideMedian = false;
  /** Above this many points the dots are painted on a canvas */
  @property({ type: Number, attribute: "canvas-threshold" }) accessor canvasThreshold = 2000;

  protected override readonly kind = "Beeswarm";
  protected override readonly icon = beeIcon;
  protected override defaultDuration = 900;
  protected override modelKeys = ["value", "group", "label", "radius", "hideMedian", "canvasThreshold"];

  private bees: Bee[] = [];
  private geo = {
    groups: [""] as string[],
    medians: [] as number[],
    hiGroup: new Set<number>() as ReadonlySet<number>,
    x: scaleLinear([0, 1], [0, 1]),
    ticks: [] as number[],
    labelW: 0,
    top: 6,
    bottom: 20,
    band: 0,
    r: 3,
    canvas: false,
  };
  private painted = "";

  /** The groups with at least one value, in first-seen order */
  private groupNames(): string[] {
    if (!this.group) return [""];
    const gg = strGetter(this.group, "group");
    const gv = numGetter(this.value, "value");
    return uniq(this.data.flatMap((d, i) => (Number.isFinite(gv(d, i)) ? [gg(d, i)] : [])));
  }

  protected override defaultHeight() {
    return Math.max(160, Math.min(380, this.groupNames().length * 78 + 30));
  }

  protected override tableHeader() {
    return "Point";
  }
  protected override seriesHeader() {
    return "Group";
  }

  private nth(i: number) {
    return `#${i}`;
  }

  protected override buildModel(f: ChartFrame): ChartModel<BeeMark, T> {
    const { width: W, height: H } = f;
    const grouped = !!this.group;
    const gv = numGetter(this.value, "value");
    const gg = this.group ? strGetter(this.group, "group") : () => "";
    const gl = strGetter(this.label, "label");
    const base: BeeRow<T>[] = this.data.map((d, i) => ({ d, v: gv(d, i), g: gg(d, i), label: gl(d, i) })).filter((r) => Number.isFinite(r.v));
    const groups = this.groupNames();
    const n = base.length;
    const canvas = n > this.canvasThreshold;
    const at = new Map(groups.map((g, gi) => [g, gi]));
    const byGroup: number[][] = groups.map(() => []);
    base.forEach((b, k) => byGroup[at.get(b.g) ?? 0].push(k));

    const [mn, mx] = extent(base.length ? base.map((r) => r.v) : [0, 1]);
    const dom = fitDomain(mn, mx, 4, { zero: false, pad: 0.04 });
    const labelW = grouped ? Math.min(W * 0.26, Math.max(...groups.map((g) => textWidth(g, AXIS_FONT, 700)), 20) + 10) : 0;
    const top = 6;
    const bottom = 20;
    const x = scaleLinear(dom, [labelW + 10, W - 10]);
    const band = (H - top - bottom) / Math.max(1, groups.length);
    const perGroup = n / Math.max(1, groups.length);
    const r = this.radius ?? Math.max(1.4, Math.min(5.5, Math.sqrt(((W - labelW) * band * 0.5) / Math.max(1, perGroup)) / 2.4));
    const medians = byGroup.map((ks) => quantileSorted(Float64Array.from(ks, (k) => base[k].v).sort(), 0.5));
    const hiGroup = grouped ? resolveHighlight(this.highlight as never, groups as never[], groups, medians, "max") : new Set<number>();
    const hiPoint = grouped ? new Set<number>() : resolveHighlight(this.highlight, base.map((b) => b.d), base.map((b) => b.label), base.map((b) => b.v), "max");

    // Before the plot is measured nothing is drawn: the dots wait on their row's middle rather than being laid out twice
    const pending = this.measured === null;
    const strip = grouped && !this.hideMedian ? 7 : 0;
    const bees: Bee[] = new Array(n);
    byGroup.forEach((ks, gi) => {
      const xs = ks.map((k) => x(base[k].v));
      const ys = pending ? xs.map(() => 0) : beeswarm(xs, r, { maxSpread: Math.max(r, (band - strip) / 2 - r - 1) });
      ks.forEach((k, j) => {
        const b = base[k];
        bees[k] = { i: k, g: gi, x: xs[j], y: top + band * gi + strip + (band - strip) / 2 + ys[j], value: b.v, label: b.label, hi: grouped ? hiGroup.has(gi) : hiPoint.has(k) };
      });
    });
    this.bees = bees;
    const ticks = x.ticks(Math.max(2, Math.round(W / 110)));
    this.geo = { groups, medians, hiGroup, x, ticks, labelW, top, bottom, band, r, canvas };
    this.painted = "";

    const D = this.duration ?? this.defaultDuration;
    const marks = canvas
      ? [{ key: "__p", to: [1], from: [0], data: null }]
      : bees.map((b) => ({ key: `b${b.i}`, to: [b.x, b.y, r], from: [b.x, top + band * b.g + band / 2, 0], enter: [b.x, b.y, 0], delay: ((b.x - labelW) / Math.max(1, W - labelW)) * D * 0.6, data: b as BeeMark }));
    const fv = f.fv;
    const events: ChartEvent<T>[] = lazyArray(n, (k) => {
      const b = bees[k];
      return { datum: base[k].d, index: k, key: `${k}`, label: b.label || `${groups[b.g] ? `${groups[b.g]} ` : ""}${this.nth(k + 1)}`, series: groups[b.g] || undefined, value: b.value, formatted: fv(b.value) };
    });
    const meds = grouped ? groups.map((g, gi) => `${g} median ${fv(medians[gi])}`).join(", ") : "";
    const summary = `${plural(n, "point")}${meds ? `, ${plural(groups.length, "group")} (${meds})` : ""}`;
    return { marks, events, summary };
  }

  /** The dot nearest (px, py), if the pointer is within 8px of its edge */
  private nearest(px: number, py: number) {
    const bees = this.bees;
    let best = -1;
    let bd = Infinity;
    for (let k = 0; k < bees.length; k++) {
      const b = bees[k];
      const d = (b.x - px) ** 2 + (b.y - py) ** 2;
      if (d < bd) {
        bd = d;
        best = k;
      }
    }
    return best >= 0 && Math.sqrt(bd) <= this.geo.r + 8 ? best : null;
  }

  protected override plotMove(x: number, y: number, e: PointerEvent) {
    const k = this.nearest(x, y);
    if (k !== this.active) this.setActive(k, e.pointerType === "touch" ? "touch" : "pointer");
  }

  protected override tip(i: number, f: ChartFrame): TooltipData | null {
    const b = this.bees[i];
    if (!b) return null;
    const g = this.geo.groups[b.g];
    return { x: b.x, y: b.y - this.geo.r, title: b.label || this.nth(b.i + 1), rows: [...(g ? [{ label: "Group", value: g }] : []), { label: this.words.value, value: f.fv(b.value), color: emphasisInk(b.hi) }] };
  }

  protected override underlay() {
    return this.geo.canvas ? canvasUnderlay() : nothing;
  }

  protected override paintUnderlay(plot: HTMLElement, f: ChartFrame) {
    if (!this.geo.canvas) return;
    const t = this.motion.get("__p")?.[0] ?? 1;
    const { width: W, height: H } = f;
    // Hover and focus re-render the element: the canvas is painted again only when the dots or the entrance moved
    const sig = `${t}|${W}x${H}`;
    const cv = plot.querySelector(".tc-chart__canvas");
    if (this.painted === sig && cv?.getAttribute("data-painted") === sig) return;
    const { r, labelW } = this.geo;
    const bees = this.bees;
    paintCanvas(plot, W, H, (ctx, color) => {
      const rest = color("var(--tc-plot-rest)");
      const accent = color("var(--tc-plot-accent)");
      for (const b of bees) {
        const k = Math.max(0, Math.min(1, (t * 1.5 - ((b.x - labelW) / Math.max(1, W - labelW)) * 0.5) * 2));
        if (k <= 0) continue;
        ctx.fillStyle = b.hi ? accent : rest;
        ctx.globalAlpha = b.hi ? 0.95 : 0.7;
        ctx.beginPath();
        ctx.arc(b.x, b.y, r * k, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    });
    this.painted = sig;
    cv?.setAttribute("data-painted", sig);
  }

  protected override draw(f: ChartFrame) {
    const { width: W, height: H } = f;
    const { groups, medians, hiGroup, x, ticks, labelW, top, bottom, band, r, canvas } = this.geo;
    const grouped = !!this.group;
    const m = this.motion;
    const D = this.duration ?? this.defaultDuration;
    const active = this.active !== null ? this.bees[this.active] : undefined;
    const medFade = m.fade(D * 0.7, 300);
    return svg`
      <rect class="tc-chart__hit" x="0" y="0" width=${W} height=${H} @click=${() => this.active !== null && this.clickMark(this.active)}></rect>
      ${gridX({ ticks, x, y0: top, y1: H - bottom, fmt: f.fmt, locale: f.locale })}
      ${grouped
        ? groups.map(
            (g, gi) => svg`
              ${gi > 0 ? svg`<line class="tc-chart__grid ui-bsw__divider" x1=${labelW} x2=${W} y1=${top + band * gi} y2=${top + band * gi}></line>` : nothing}
              ${txt(labelW, top + band * gi + band / 2, truncate(g, labelW - 4, AXIS_FONT, 700), { anchor: "end", strong: hiGroup.has(gi) })}`,
          )
        : nothing}
      ${canvas
        ? active
          ? svg`<circle class="tc-chart__focus" cx=${active.x} cy=${active.y} r=${r + 2}></circle>`
          : nothing
        : m.items.map((it) => {
            const b = it.data;
            if (!b) return nothing;
            const [cx, cy, rr] = it.v;
            const h = this.hover(b.i);
            return svg`<circle class="ui-bsw__dot" ?data-active=${this.active === b.i} cx=${cx} cy=${cy} r=${Math.max(0, rr)}
              style=${`fill: ${emphasisInk(b.hi)}`} fill-opacity=${b.hi ? 0.95 : 0.72} opacity=${it.exiting ? 0.4 : 1}
              @pointerenter=${h.enter} @click=${h.click}></circle>`;
          })}
      ${grouped && !this.hideMedian
        ? groups.map((_g, gi) => {
            const mx0 = x(medians[gi]);
            const y0 = top + band * gi + 2;
            const text = `Median ${f.fmt(medians[gi])}${this.unit}`;
            const tw = textWidth(text, AXIS_FONT, 700) + 10;
            return svg`<g class="ui-bsw__median" opacity=${medFade}>
              <line class="ui-bsw__median-line" x1=${mx0} x2=${mx0} y1=${y0 + 10} y2=${y0 + band - 6}></line>
              <rect class="ui-bsw__median-bg" x=${mx0 - tw / 2} y=${y0 - 4} width=${tw} height="15" rx="5"></rect>
              ${txt(mx0, y0 + 4, text, { anchor: "middle", cls: "value", strong: true })}
            </g>`;
          })
        : nothing}`;
  }

  static override css = /* css */ `
[data-ui="bsw"] { --tc-bsw-median: var(--tc-text-primary); }
.ui-bsw__dot { cursor: default; }
.ui-bsw__dot[data-active] { stroke: var(--tc-plot-focus); stroke-width: 1.6; }
.ui-bsw__divider { stroke-dasharray: 2 3; }
.ui-bsw__median { pointer-events: none; }
.ui-bsw__median-line { stroke: var(--tc-bsw-median); stroke-width: 1.6; stroke-dasharray: 3 2; }
.ui-bsw__median-bg { fill: var(--tc-plot-bg); fill-opacity: 0.92; }
@media (forced-colors: active) {
  .ui-bsw__dot { forced-color-adjust: none; }
  .ui-bsw__median-line { stroke: CanvasText; }
}
`;
}

if (!customElements.get("tc-beeswarm-chart")) customElements.define("tc-beeswarm-chart", TcBeeswarmChart);

declare global {
  interface HTMLElementTagNameMap {
    "tc-beeswarm-chart": TcBeeswarmChart;
  }
}
