/*
 * What Pie Chart and Donut Chart share (ported from ztd-charts' PieBase, MIT, © 2026 Junhan2 –
 * https://github.com/Junhan2/ztd-charts): shares of a whole as slices that sweep round from twelve o'clock, the
 * pointed-at slice lifting out, labels outside the circle kept from overlapping, and – for a donut – the total in the
 * middle and a legend of every slice with its share.
 */
import { nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { numGetter, strGetter } from "./accessor";
import { txt } from "./axis";
import { categoricalInk, emphasisInk, registerChartSheet, TcChartElement, type ChartFrame, type ChartModel } from "./element";
import { arcPath, polar, sum, TAU } from "./geometry";
import { resolveHighlight } from "./highlight";
import { dodgeVertical, textWidth, truncate } from "./text";
import type { Accessor, Row, TooltipData } from "./types";

export type PieColorMode = "categorical" | "emphasis";
export type PieLabelMode = "percent" | "value" | "label" | "none";
export type DonutLegend = "auto" | "right" | "bottom" | "none";

type Slice<T> = { i: number; label: string; value: number; pct: number; a0: number; a1: number; ink: string; hi: boolean; datum: T };
type Item<T> = Slice<T> | null;

const LABEL_FONT = 12;

export abstract class PieBase<T = Row> extends TcChartElement<Item<T>, T> {
  /** The slice-name field; by default "label" */
  @property({ attribute: false }) accessor label: Accessor<T, string> | undefined = undefined;
  /** The value field; by default "value" */
  @property({ attribute: false }) accessor value: Accessor<T, number> | undefined = undefined;
  /** "categorical" gives each slice its own ink; "emphasis" paints the highlighted ones and leaves the rest quiet */
  @property({ attribute: "color-mode" }) accessor colorMode: PieColorMode = "categorical";
  /** Orders the slices from the largest */
  @property({ type: Boolean }) accessor sort = false;
  /** Where the first slice starts, in degrees clockwise from twelve o'clock */
  @property({ type: Number, attribute: "start-angle" }) accessor startAngle = 0;

  protected override defaultDuration = 1000;
  protected override modelKeys = ["label", "value", "colorMode", "sort", "startAngle", ...this.extraKeys()];
  protected extraKeys(): string[] {
    return [];
  }
  /** The hole's share of the radius: 0 for a pie */
  protected abstract inner(): number;
  /** What the slices' labels say */
  protected abstract sliceLabels(): PieLabelMode;
  /** Where the legend goes at a width */
  protected legendAt(_w: number): "right" | "bottom" | "none" {
    return "none";
  }
  /** The number in a donut's middle, or null for none */
  protected centerNumber(_slices: Slice<T>[], _total: number): number | null {
    return null;
  }
  /** The words under it */
  protected centerCaption(): string | undefined {
    return undefined;
  }

  private slices: Slice<T>[] = [];
  private g = { cx: 0, cy: 0, R: 0, r0: 0, plotH: 0, plotW: 0, legendW: 0, legendRowH: 0, start: 0, legend: "none" as "right" | "bottom" | "none" };
  private outside = new Map<number, { x: number; y: number; anchor: "start" | "end" | "middle" }>();

  private rows() {
    const gl = strGetter(this.label, "label");
    const gv = numGetter(this.value, "value");
    let rows = this.data.map((d, i) => ({ d, i, label: gl(d, i), value: Math.max(0, gv(d, i) || 0) }));
    if (this.sort) rows = [...rows].sort((a, b) => b.value - a.value);
    return rows;
  }

  protected override defaultHeight(w: number) {
    const inner = this.inner();
    if (!inner) return Math.max(180, Math.min(260, w * 0.62));
    // A legend under the donut adds its rows, so many slices don't squeeze it
    const bottomH = Math.ceil(this.data.length / 2) * 20 + 8;
    return Math.max(170, Math.min(240, w * 0.5)) + (this.legendAt(w) === "bottom" ? bottomH : 0);
  }

  private sliceText(s: Slice<T>, f: ChartFrame) {
    const mode = this.sliceLabels();
    return mode === "value" ? f.fv(s.value) : mode === "label" ? s.label : f.pct(s.pct);
  }

  protected override buildModel(f: ChartFrame): ChartModel<Item<T>, T> {
    const { width: W, height: H } = f;
    const inner = this.inner();
    const rows = this.rows();
    const total = sum(rows.map((r) => r.value));
    const hi = resolveHighlight(this.highlight, rows.map((r) => r.d), rows.map((r) => r.label), rows.map((r) => r.value), "max");
    const legend = inner ? this.legendAt(W) : "none";
    const legendH = legend === "bottom" ? Math.ceil(rows.length / 2) * 20 + 8 : 0;
    const plotH = H - legendH;
    // A legend at the side shrinks its rows to fit, so a long one isn't cut off
    const legendRowH = Math.min(26, (plotH - 8) / Math.max(1, rows.length));
    const legendW = legend === "right" ? Math.min(220, Math.max(140, W * 0.44)) : 0;
    const plotW = W - legendW;
    const pad = inner ? 4 : 22;
    const R = Math.max(10, Math.min(plotW, plotH) / 2 - pad);
    const r0 = R * inner;
    const cx = legend === "right" ? Math.max(R + pad, plotW / 2 + 6) : W / 2;
    const cy = plotH / 2;
    const start = (this.startAngle * Math.PI) / 180;
    this.g = { cx, cy, R, r0, plotH, plotW, legendW, legendRowH, start, legend };

    let acc = 0;
    // Categorical: the inks in order, so each slice keeps its ink when another is highlighted
    this.slices = rows.map((r, k) => {
      const a = total > 0 ? (r.value / total) * TAU : 0;
      const isHi = hi.has(k);
      const s: Slice<T> = { i: k, label: r.label, value: r.value, pct: total > 0 ? (r.value / total) * 100 : 0, a0: acc, a1: acc + a, ink: this.colorMode === "emphasis" ? emphasisInk(isHi) : categoricalInk(k), hi: isHi, datum: r.d };
      acc += a;
      return s;
    });

    // Labels go outside the circle, beside their slices, nudged apart so none overlap (text on a slice can't be kept legible on every ink)
    this.outside = new Map();
    if (this.sliceLabels() !== "none" && !this.hideLabels) {
      const list = this.slices
        .filter((s) => s.value > 0)
        .map((s) => {
          const mid = start + (s.a0 + s.a1) / 2;
          const [x, y] = polar(cx, cy, R + 10, mid);
          return { i: s.i, x, y, side: Math.sin(mid) >= 0 ? 1 : -1 };
        });
      for (const side of [1, -1]) {
        const group = list.filter((l) => l.side === side);
        const ys = dodgeVertical(group.map((g) => g.y), 15, 8, plotH - 8);
        group.forEach((g, k) => this.outside.set(g.i, { x: g.x, y: ys[k], anchor: Math.abs(g.x - cx) < 14 ? "middle" : side > 0 ? "start" : "end" }));
      }
    }

    const center = inner ? this.centerNumber(this.slices, total) : null;
    const marks: { key: string; to: number[]; from?: number[]; enter?: number[]; exit?: number[]; data: Item<T> }[] = this.slices.map((s) => {
      const mid = (s.a0 + s.a1) / 2;
      return { key: `s:${s.label}`, to: [s.a0, s.a1], enter: [s.a0, s.a0], exit: [mid, mid], data: s };
    });
    marks.push({ key: "__sweep", to: [TAU], from: [0], data: null });
    if (center !== null) marks.push({ key: "__center", to: [center], from: [0], data: null });

    const events = this.slices.map((s) => ({ datum: s.datum, index: s.i, key: s.label, label: s.label, value: s.value, formatted: `${f.pct(s.pct)} · ${f.fv(s.value)}` }));
    const top = [...this.slices].sort((a, b) => b.value - a.value).slice(0, 4);
    const summary = `${this.slices.length} items, total ${f.fv(total)}. ${top.map((s) => `${s.label} ${f.pct(s.pct)}`).join(", ")}`;
    return { marks, events, summary };
  }

  protected override tip(i: number, f: ChartFrame): TooltipData | null {
    const s = this.slices[i];
    if (!s) return null;
    const { cx, cy, R, start } = this.g;
    const [x, y] = polar(cx, cy, R * 0.9, start + (s.a0 + s.a1) / 2);
    return { x, y, title: s.label, rows: [{ label: this.words.value, value: f.fv(s.value), color: s.ink }, { label: this.words.share, value: f.pct(s.pct) }] };
  }

  protected override tableHeader() {
    return "Item";
  }

  protected override draw(f: ChartFrame) {
    const { width: W } = f;
    const { cx, cy, R, r0, plotH, plotW, legendW, legendRowH, start, legend } = this.g;
    const m = this.motion;
    const D = this.duration ?? this.defaultDuration;
    const sweep = m.get("__sweep")?.[0] ?? TAU;
    const slices = this.slices;
    const items = m.items.filter((it) => it.data) as { key: string; v: number[]; data: Slice<T>; exiting: boolean }[];
    const active = this.active;

    const wedges = items.map((it) => {
      const s = it.data;
      const a0 = start + Math.min(it.v[0], sweep);
      const a1 = start + Math.min(it.v[1], sweep);
      const mid = (a0 + a1) / 2;
      // The pointed-at slice lifts out along its middle
      const off = active === s.i ? 5 : 0;
      const d = arcPath(cx, cy, r0, R, a0, a1);
      if (!d) return nothing;
      const h = this.hover(s.i);
      return svg`<path class="tc-chart__mark tc-pie__slice" ?data-parted=${slices.length > 1} d=${d}
        style=${`fill: ${s.ink}; transform: translate(${(Math.sin(mid) * off).toFixed(2)}px, ${(-Math.cos(mid) * off).toFixed(2)}px)`}
        opacity=${it.exiting ? 0.6 : this.dim(s.i)} @pointerenter=${h.enter} @click=${h.click}></path>`;
    });
    const focus =
      active !== null && this.via === "keyboard" && slices[active]
        ? svg`<path class="tc-chart__focus" pointer-events="none" d=${arcPath(cx, cy, Math.max(0, r0 - 2), R + 3, start + slices[active].a0, start + slices[active].a1)}></path>`
        : nothing;

    const labels = slices.map((s) => {
      const out = this.outside.get(s.i);
      if (!out) return nothing;
      const o = m.fade(D * 0.35 + (s.a0 / TAU) * D * 0.5, 260) * this.dim(s.i);
      const room = out.anchor === "start" ? W - out.x - 4 : out.anchor === "end" ? out.x - 4 : W;
      return txt(out.x, out.y, truncate(this.sliceText(s, f), room, LABEL_FONT, 700), { cls: "value", anchor: out.anchor, strong: true, opacity: o });
    });

    const center = m.get("__center")?.[0];
    const caption = this.centerCaption();
    const middle =
      center !== undefined
        ? svg`<g opacity=${m.fade(0, 200)}>
            <text class="tc-pie__total" ?data-small=${r0 < 48} x=${cx} y=${cy - (caption ? 7 : 0)} dy="0.35em" text-anchor="middle">${f.fmt(Math.round(center))}</text>
            ${caption ? txt(cx, cy + Math.max(11, Math.min(17, r0 * 0.3)), truncate(caption, r0 * 1.6, 11), { anchor: "middle" }) : nothing}
          </g>`
        : nothing;

    const key =
      legend === "none"
        ? nothing
        : slices.map((s, k) => {
            const right = legend === "right";
            // Two columns under the donut, 20px apart, so a share never touches the next swatch
            const colW = right ? legendW - 12 : (W - 36) / 2;
            const lx = right ? plotW + 8 : 8 + (k % 2) * (colW + 20);
            const ly = right ? cy - ((slices.length - 1) * legendRowH) / 2 + k * legendRowH : plotH + 12 + Math.floor(k / 2) * 20;
            const o = m.fade(D * 0.25 + k * 90, 260) * this.dim(s.i);
            const pct = f.pct(s.pct);
            const nameMax = colW - 14 - textWidth(pct, LABEL_FONT, 700) - 10;
            return svg`<g opacity=${o} @pointerenter=${() => this.setActive(s.i)}>
              <rect class="tc-pie__swatch" x=${lx} y=${ly - 5} width="10" height="10" rx="2.5" style=${`fill: ${s.ink}`}></rect>
              ${txt(lx + 16, ly, truncate(s.label, nameMax, LABEL_FONT, s.hi ? 700 : 500), { cls: "value", strong: s.hi })}
              ${txt(lx + colW, ly, pct, { cls: "value", anchor: "end", strong: s.hi })}
            </g>`;
          });

    return svg`<g>${wedges}${focus}</g><g>${labels}</g>${middle}<g>${key}</g>`;
  }
}

const pieCss = /* css */ `
/* Slices are parted by a line of the card's colour; the pointed-at one lifts out */
.tc-pie__slice { transition: transform var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-fast) var(--tc-ease-standard); }
.tc-pie__slice[data-parted] { stroke: var(--tc-plot-bg); stroke-width: 2; stroke-linejoin: round; }
.tc-pie__total { font-size: var(--tc-font-size-3xl); font-weight: var(--tc-font-weight-strong); fill: var(--tc-text-primary); font-variant-numeric: tabular-nums; letter-spacing: var(--tc-tracking-tight); }
.tc-pie__total[data-small] { font-size: var(--tc-font-size-xl); }
.tc-pie__swatch { stroke: var(--tc-border-subtle); stroke-width: 1; }
`;

registerChartSheet("tc-pie", pieCss);
