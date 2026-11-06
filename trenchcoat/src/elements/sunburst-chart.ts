import { nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { txt } from "./internal/chart/axis";
import { AXIS_FONT, TcChartElement, type ChartFrame, type ChartModel } from "./internal/chart/element";
import { arcPath, polar, TAU } from "./internal/chart/geometry";
import { buildTree, leaves, partitionAngles, sortTree, treeHeight, type Arc, type TreeNode } from "./internal/chart/hierarchy";
import { resolveHighlight } from "./internal/chart/highlight";
import { dodgeVertical, textWidth, truncate } from "./internal/chart/text";
import type { Accessor, Row, TooltipData } from "./internal/chart/types";

/*
 * <tc-sunburst-chart> – a hierarchy as rings: the top level innermost, each ring split among its parent's share.
 * Ported from ztd-charts' SunburstChart (MIT, © 2026 Junhan2). Rows become a tree as in Treemap (`group`, `path` or
 * nested children). The largest leaf takes the accent, the arcs on its way to the centre a darker quiet ink, the rest
 * stay quiet (`highlight` picks others). The outer ring's names and shares sit outside the circle, nudged apart; the
 * inner rings' names sit on small chips of the card's colour where an arc has room, so they read on every ink. The
 * rings sweep round from twelve o'clock one after another when the chart comes on screen and glide when the data
 * changes.
 *   · one tab stop: arrows move arc to arc, inner ring first, each read with its parent, value and share
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-sunburst-chart heading="Grant spend" .data=${[{ group: "Genomics", label: "Reagents", value: 42 }, …]}></tc-sunburst-chart>
 */

/** A sunburst: two rings and their partings, drawn in Lucide's style */
const sunburstIcon = svg`<circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="4"></circle><path d="M12 2v6"></path><path d="M16 12h6"></path><path d="m15.5 15.5 4 4"></path>`;

type ArcInfo<T> = Arc<T> & { i: number; ink: string; hi: boolean; leaf: boolean; pct: number };
type Item<T> = ArcInfo<T> | null;

/** The chip an inner arc's name sits on: its height and padding, and the room kept to the arc's edges */
const CHIP_H = 16;
const CHIP_PAD = 4;
const EDGE = 3;
const OUT_FONT = AXIS_FONT;

/**
 * The widest label box of height h centred in a ring piece, with every corner `pad` inside its edges (ztd's labelRoom).
 * At the ring's left and right a level box lies across the ring's thickness, so it's far narrower than the arc's length.
 */
export function labelRoom(r0: number, r1: number, a0: number, a1: number, h: number, pad: number): number {
  const rm = (r0 + r1) / 2;
  const mid = (a0 + a1) / 2;
  const [px, py] = polar(0, 0, rm, mid);
  const half = (a1 - a0) / 2 - pad / rm;
  const fits = (w: number) => {
    // The box's nearest point to the centre stays outside the inner radius
    if (Math.hypot(Math.max(Math.abs(px) - w / 2, 0), Math.max(Math.abs(py) - h / 2, 0)) < r0 + pad) return false;
    for (const x of [px - w / 2, px + w / 2])
      for (const y of [py - h / 2, py + h / 2]) {
        if (Math.hypot(x, y) > r1 - pad) return false;
        const off = Math.atan2(x, -y) - mid;
        if (Math.abs(Math.atan2(Math.sin(off), Math.cos(off))) > half) return false;
      }
    return true;
  };
  if (half <= 0 || !fits(0)) return 0;
  let lo = 0;
  let hi = 2 * r1;
  for (let k = 0; k < 12; k++) {
    const w = (lo + hi) / 2;
    if (fits(w)) lo = w;
    else hi = w;
  }
  return lo;
}

/**
 * A hierarchy as rings – the top level innermost – with the largest leaf and its path emphasised, the outer names
 * beside the circle and the inner ones on chips, and a table view.
 * @tag tc-sunburst-chart
 * @fires tc-view-change - The Table button was pressed ({ view }: ChartViewChange); cancelable – prevented, `view` stays as it was
 * @fires tc-mark-hover - The pointer or keyboard moved to an arc, or off them ({ event }: ChartMarkHover)
 * @fires tc-mark-click - An arc was clicked, or picked with Enter or Space ({ event }: ChartMarkClick)
 */
export class TcSunburstChart<T = Row> extends TcChartElement<Item<T>, T> {
  static override ui = "sbr";

  /** The name field; by default "label" */
  @property({ attribute: false }) accessor label: Accessor<T, string> | undefined = undefined;
  /** The value field; by default "value" */
  @property({ attribute: false }) accessor value: Accessor<T, number> | undefined = undefined;
  /** The parent-group field of a flat table: the groups make the inner ring */
  @property({ attribute: false }) accessor group: Accessor<T, string> | undefined = undefined;
  /** Several levels: path fields from the centre out, e.g. ["division", "lab"] */
  @property({ attribute: false }) accessor path: string[] | undefined = undefined;
  /** The children field of nested rows; by default "children" */
  @property({ attribute: "children-field" }) accessor childrenField: string | undefined = undefined;
  /** Orders each ring's arcs from the largest; by default the data's order */
  @property({ type: Boolean }) accessor sort = false;
  /** The hole's share of the radius, 0–0.9; by default 0.3 */
  @property({ type: Number }) accessor hole = 0.3;

  protected override readonly kind = "Sunburst chart";
  protected override readonly icon = sunburstIcon;
  protected override defaultDuration = 900;
  protected override modelKeys = ["label", "value", "group", "path", "childrenField", "sort", "hole"];

  private arcs: ArcInfo<T>[] = [];
  private levels = 1;
  private g = { cx: 0, cy: 0, R: 0, hole: 0, ring: 0 };
  private outside = new Map<string, { x: number; y: number; anchor: "start" | "end" | "middle" }>();

  protected override defaultHeight(w: number) {
    return Math.max(200, Math.min(270, w * 0.62));
  }

  /** A ring's inner and outer radius (depth from 1); rings after the first are parted by 2px */
  private radii(d: number): [number, number] {
    const { hole, ring } = this.g;
    return [hole + ring * (d - 1) + (d > 1 ? 2 : 0), hole + ring * d];
  }

  private outsideText(a: ArcInfo<T>, f: ChartFrame) {
    return `${a.node.label} ${f.pct(a.pct)}`;
  }

  protected override buildModel(f: ChartFrame): ChartModel<Item<T>, T> {
    const { width: W, height: H } = f;
    const tree = buildTree(this.data, { label: this.label, value: this.value, group: this.group, path: this.path, children: this.childrenField });
    if (this.sort) sortTree(tree);
    const levels = Math.max(1, treeHeight(tree));
    this.levels = levels;
    const lv = leaves(tree);
    const hiSet = resolveHighlight(this.highlight, lv.map((l) => l.datum as T), lv.map((l) => l.label), lv.map((l) => l.value), "max");
    const hiLeaves = new Set<TreeNode<T>>([...hiSet].map((k) => lv[k]));
    // The arcs between an emphasised leaf and the centre
    const hiPath = new Set<TreeNode<T>>();
    hiLeaves.forEach((l) => {
      for (let q = l.parent; q && q.depth > 0; q = q.parent) hiPath.add(q);
    });
    const total = tree.value || 1;
    this.arcs = partitionAngles(tree).map((a, i) => {
      const leaf = !a.node.children.length;
      const hi = hiLeaves.has(a.node);
      const ink = hi ? "var(--tc-plot-accent)" : hiPath.has(a.node) ? "var(--tc-sbr-path)" : leaf ? "var(--tc-plot-rest)" : "var(--tc-sbr-branch)";
      return { ...a, i, ink, hi, leaf, pct: (a.node.value / total) * 100 };
    });

    // The outer ring's labels go outside: the radius leaves room for the widest of them on both sides
    const outer = this.hideLabels ? [] : this.arcs.filter((a) => a.depth === levels && a.leaf && a.node.value > 0);
    const labelW = Math.max(40, ...outer.map((a) => textWidth(this.outsideText(a, f), OUT_FONT, 600))) + 14;
    const R = Math.max(30, Math.min(H / 2 - 10, (W - 2 * labelW) / 2));
    const hole = R * Math.max(0, Math.min(0.9, this.hole));
    this.g = { cx: W / 2, cy: H / 2, R, hole, ring: (R - hole) / levels };
    const { cx, cy } = this.g;

    this.outside = new Map();
    const list = outer.map((a) => {
      const mid = (a.a0 + a.a1) / 2;
      const [x, y] = polar(cx, cy, R + 10, mid);
      return { a, x, y, side: Math.sin(mid) >= 0 ? 1 : -1, mid };
    });
    for (const side of [1, -1]) {
      const group = list.filter((l) => l.side === side);
      const ys = dodgeVertical(group.map((l) => l.y), 14, 7, H - 7);
      group.forEach((l, k) => {
        const nearV = Math.abs(Math.sin(l.mid)) < 0.18;
        this.outside.set(l.a.node.id, { x: l.x + (nearV ? 0 : side * 2), y: ys[k], anchor: nearV ? "middle" : side > 0 ? "start" : "end" });
      });
    }

    const D = this.duration ?? this.defaultDuration;
    const marks: { key: string; to: number[]; from?: number[]; enter?: number[]; exit?: number[]; delay?: number; data: Item<T> }[] = this.arcs.map((a) => {
      const mid = (a.a0 + a.a1) / 2;
      return { key: `a:${a.node.id}`, to: [a.a0, a.a1], enter: [a.a0, a.a0], exit: [mid, mid], data: a };
    });
    // Each ring sweeps round after the one inside it
    for (let d = 1; d <= levels; d++) marks.push({ key: `__sweep${d}`, to: [TAU], from: [0], delay: (d - 1) * D * 0.28, data: null });

    const events = this.arcs.map((a) => ({
      datum: a.node.datum,
      index: a.i,
      key: a.node.id,
      label: a.node.label,
      series: a.node.parent && a.node.parent.depth > 0 ? a.node.parent.label : undefined,
      value: a.node.value,
      formatted: `${f.fv(a.node.value)} · ${f.pct(a.pct)}`,
    }));
    const summary = `${levels} ${levels === 1 ? "level" : "levels"}, total ${f.fv(tree.value)}. Innermost ring: ${tree.children.map((ch) => `${ch.label} ${f.pct((ch.value / total) * 100)}`).join(", ")}`;
    return { marks, events, summary };
  }

  protected override tip(i: number, f: ChartFrame): TooltipData | null {
    const a = this.arcs[i];
    if (!a) return null;
    const { cx, cy } = this.g;
    const [, r1] = this.radii(a.depth);
    const [x, y] = polar(cx, cy, r1, (a.a0 + a.a1) / 2);
    const parent = a.node.parent && a.node.parent.depth > 0 ? a.node.parent.label : null;
    return {
      x,
      y,
      title: parent ? `${parent} › ${a.node.label}` : a.node.label,
      rows: [
        { label: this.words.value, value: f.fv(a.node.value), color: a.ink },
        { label: "Share", value: f.pct(a.pct) },
      ],
    };
  }

  protected override tableHeader() {
    return "Item";
  }
  protected override seriesHeader() {
    return "Parent";
  }

  protected override draw(f: ChartFrame) {
    const { width: W } = f;
    const { cx, cy } = this.g;
    const m = this.motion;
    const D = this.duration ?? this.defaultDuration;
    const levels = this.levels;
    const active = this.active;

    const paths = m.items.map((it) => {
      const a = it.data;
      if (!a) return nothing;
      const sweep = m.get(`__sweep${a.depth}`)?.[0] ?? TAU;
      const [r0, r1] = this.radii(a.depth);
      const d = arcPath(cx, cy, r0, r1, Math.min(it.v[0], sweep), Math.min(it.v[1], sweep));
      if (!d) return nothing;
      const h = this.hover(a.i);
      return svg`<path class="tc-chart__mark ui-sbr__arc" d=${d} style=${`fill: ${a.ink}`} opacity=${it.exiting ? 0.5 : this.dim(a.i)} @pointerenter=${h.enter} @click=${h.click}></path>`;
    });

    const cur = active !== null && this.via === "keyboard" ? this.arcs[active] : undefined;
    const focus = cur
      ? svg`<path class="tc-chart__focus" pointer-events="none" d=${arcPath(cx, cy, Math.max(0, this.radii(cur.depth)[0] - 1), this.radii(cur.depth)[1] + 2, cur.a0, cur.a1)}></path>`
      : nothing;

    const labels = this.hideLabels
      ? nothing
      : this.arcs.map((a) => {
          const o = m.fade((a.depth - 1) * D * 0.28 + D * 0.45 + (a.a0 / TAU) * 200, 260) * this.dim(a.i);
          const out = this.outside.get(a.node.id);
          if (out) {
            const room = out.anchor === "start" ? W - out.x - 2 : out.anchor === "end" ? out.x - 2 : W;
            return txt(out.x, out.y, truncate(this.outsideText(a, f), room, OUT_FONT, a.hi ? 700 : 500), { cls: "value", anchor: out.anchor, strong: a.hi, opacity: o });
          }
          if (a.depth === levels && a.leaf) return nothing;
          // An inner arc: its name on a chip, when the arc has room for one
          const [r0, r1] = this.radii(a.depth);
          const rm = (r0 + r1) / 2;
          if ((a.a1 - a.a0) * rm < 26 || r1 - r0 < CHIP_H + 2 * EDGE) return nothing;
          const name = truncate(a.node.label, labelRoom(r0, r1, a.a0, a.a1, CHIP_H, EDGE) - CHIP_PAD * 2, AXIS_FONT, 700);
          if (!name) return nothing;
          const w = textWidth(name, AXIS_FONT, 700) + CHIP_PAD * 2;
          const [x, y] = polar(cx, cy, rm, (a.a0 + a.a1) / 2);
          return svg`<g opacity=${o}>
            <rect class="ui-sbr__chip" x=${x - w / 2} y=${y - CHIP_H / 2} width=${w} height=${CHIP_H} rx="3"></rect>
            ${txt(x, y, name, { cls: "value", anchor: "middle", strong: true })}
          </g>`;
        });

    return svg`<g>${paths}</g>${focus}<g>${labels}</g>`;
  }

  static override css = /* css */ `
/* The quiet inks beyond the base two: the arcs leading to the emphasised leaf, and inner arcs */
[data-ui="sbr"] {
  --tc-sbr-path: var(--tc-plot-line-rest);
  --tc-sbr-branch: color-mix(in srgb, var(--tc-plot-rest) 55%, var(--tc-plot-line-rest));
}
/* Arcs are parted by a line of the card's colour */
.ui-sbr__arc { stroke: var(--tc-plot-bg); stroke-width: 1.5; stroke-linejoin: round; }
/* The chip an inner arc's name sits on: the card's own colour, so the name reads the same on every ink */
.ui-sbr__chip { fill: var(--tc-plot-bg); pointer-events: none; }
@media (forced-colors: active) {
  .ui-sbr__arc { forced-color-adjust: none; }
  .ui-sbr__chip { fill: Canvas; }
}
`;
}

if (!customElements.get("tc-sunburst-chart")) customElements.define("tc-sunburst-chart", TcSunburstChart);

declare global {
  interface HTMLElementTagNameMap {
    "tc-sunburst-chart": TcSunburstChart;
  }
}
