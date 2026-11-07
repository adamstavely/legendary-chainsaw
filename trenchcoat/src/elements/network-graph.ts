import { html, nothing, svg } from "lit";
import { property, state } from "lit/decorators.js";
import { hasField, numGetter, strGetter } from "./internal/chart/accessor";
import { txt } from "./internal/chart/axis";
import { canvasUnderlay, paintCanvas } from "./internal/chart/canvas";
import { AXIS_FONT, categoricalInk, defaultChartLabels, emphasisInk, TcChartElement, type ChartFrame, type ChartLabels, type ChartModel } from "./internal/chart/element";
import { forceLayout, type ForceNode } from "./internal/chart/force";
import { resolveHighlight } from "./internal/chart/highlight";
import { plural } from "./internal/chart/i18n";
import type { Mark } from "./internal/chart/motion";
import { labelBox, overlaps, textWidth, type Box } from "./internal/chart/text";
import type { Accessor, ChartEvent, Row, TooltipData } from "./internal/chart/types";

/*
 * <tc-network-graph> – any nodes and the links between them, laid out by force: linked nodes pull together, the rest
 * push apart, so clusters and bridges show for themselves. Not from ztd-charts. Unlike Relationship Graph (one person
 * in the middle, rings round them) and Agent Graph (agents and their tools, live), nothing here sits in a fixed place:
 * the layout comes from the links alone, and the same graph always draws the same picture.
 *   · nodes from `nodes` and links from `links`, or links from the rows in `data` (source, target, value) with the
 *     nodes they name – which is how a tc-chart spec draws one
 *   · `group` gives each group its own chart ink and a legend in the header; without groups the most-linked node takes
 *     the accent and the rest stay quiet (`highlight` picks others). A node's size is its `size`, or how many links it
 *     has; a link's width its `value`
 *   · the most-linked nodes are named beside their circles where the names fit (`max-labels`); every node is named in
 *     the tooltip and the table
 *   · pointing at a node, or moving to it with the arrows (most-linked first), lights it and its neighbours and quiets
 *     the rest; Enter or a click fires tc-mark-click. With `drag-nodes`, a node dragged somewhere stays there and the
 *     rest settle round it; double-click it to let it go
 *   · nodes grow in when the graph comes on screen; when the graph changes they glide from where they were. Above
 *     `canvas-threshold` nodes the links are painted on a canvas under the SVG
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-network-graph heading="Co-authors" .data=${[{ source: "Ines Ko", target: "Ravi Mehta", value: 3 }]}></tc-network-graph>
 */

/** Linked circles: Lucide's "waypoints" (ISC, lucide.dev) */
const networkIcon = svg`<circle cx="12" cy="4.5" r="2.5"></circle><path d="m10.2 6.3-3.9 3.9"></path><circle cx="4.5" cy="12" r="2.5"></circle><path d="M7 12h10"></path><circle cx="19.5" cy="12" r="2.5"></circle><path d="m13.8 17.7 3.9-3.9"></path><circle cx="12" cy="19.5" r="2.5"></circle>`;

/** A node: `label` defaults to the id; `group` picks its ink; `size` its area (else its number of links) */
export type NetworkNode = { id: string; label?: string; group?: string; size?: number };
/** A link between two node ids; `value` makes it thicker, shorter and stronger */
export type NetworkLink = { source: string; target: string; value?: number };

/** The words a network graph adds to the shared ones */
export type NetworkGraphLabels = {
  /** The value column and the tooltip's count: "Links" */
  links: string;
  group: string;
  /** The tooltip's list of neighbours */
  linkedTo: string;
  /** "{count} more" after the first neighbours */
  more: string;
  /** Read after a node dragged into place */
  pinned: string;
};
export const defaultNetworkGraphLabels: NetworkGraphLabels = {
  links: "Links",
  group: "Group",
  linkedTo: "Linked to",
  more: "and {count} more",
  pinned: "pinned",
};

type Node = {
  i: number;
  id: string;
  label: string;
  group: string | null;
  /** The group's place in the legend; -1 without groups */
  gi: number;
  size: number;
  degree: number;
  nbrs: number[];
  r: number;
  x: number;
  y: number;
  hi: boolean;
  pinned: boolean;
  datum: unknown;
};
type Edge = { s: number; t: number; value: number; w: number };
/** A name beside its node: where it sits relative to the node's centre */
type Label = { i: number; dx: number; dy: number; anchor: "start" | "middle" | "end" };

/** Neighbours named in the tooltip and the table before "and n more" */
const NBR_LIST = 6;
const fill = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));

/**
 * Any nodes and links, laid out by force – clusters and bridges showing for themselves – with groups in their own inks,
 * the most-linked named, a node's neighbourhood lit on hover or focus, nodes that can be dragged into place, and a
 * table view.
 * @tag tc-network-graph
 * @fires tc-view-change - The Table button was pressed ({ view }: ChartViewChange); cancelable – prevented, `view` stays as it was
 * @fires tc-mark-hover - The pointer or keyboard moved to a node, or off them ({ event }: ChartMarkHover)
 * @fires tc-mark-click - A node was clicked, or picked with Enter or Space ({ event }: ChartMarkClick)
 */
export class TcNetworkGraph<T = Row> extends TcChartElement<Node, T> {
  static override ui = "nwg";

  /** The nodes; when empty, the nodes the links name */
  @property({ attribute: false }) accessor nodes: NetworkNode[] = [];
  /** The links; when empty, links are read from the rows in `data` */
  @property({ attribute: false }) accessor links: NetworkLink[] = [];
  /** For links read from `data`: the field naming one end; by default "source", or "from" */
  @property({ attribute: false }) accessor source: Accessor<T, string> | undefined = undefined;
  /** For links read from `data`: the field naming the other end; by default "target", or "to" */
  @property({ attribute: false }) accessor target: Accessor<T, string> | undefined = undefined;
  /** For links read from `data`: the link's strength field; by default "value", else 1 */
  @property({ attribute: false }) accessor value: Accessor<T, number> | undefined = undefined;
  /** How many nodes are named beside their circles at most – fewer when the chart is narrow */
  @property({ type: Number, attribute: "max-labels" }) accessor maxLabels = 12;
  /** Lets the pointer drag a node; it stays where it's dropped until double-clicked */
  @property({ type: Boolean, attribute: "drag-nodes" }) accessor dragNodes = false;
  /** Above this many nodes the links are painted on a canvas */
  @property({ type: Number, attribute: "canvas-threshold" }) accessor canvasThreshold = 1500;
  /** The network graph's own words, merged over defaultNetworkGraphLabels */
  @property({ attribute: false }) accessor networkLabels: Partial<NetworkGraphLabels> = {};

  /** @internal Nodes dragged into place, by id, as shares of the width and height */
  @state() accessor pins: ReadonlyMap<string, readonly [number, number]> = new Map();
  /** @internal The node being dragged and where the pointer is */
  @state() accessor dragging: { i: number; x: number; y: number; moved: boolean } | null = null;

  protected override readonly kind = "Network graph";
  protected override readonly icon = networkIcon;
  protected override defaultDuration = 900;
  protected override modelKeys = ["nodes", "links", "source", "target", "value", "maxLabels", "canvasThreshold", "networkLabels", "pins"];

  private list: Node[] = [];
  private edges: Edge[] = [];
  private names: Label[] = [];
  private groups: string[] = [];
  private canvas = false;
  private grid = { cells: new Map<string, number[]>(), cell: 24, reach: 1 };
  /** The last layout, as shares of the width and height, to start the next one from */
  private previous = new Map<string, readonly [number, number]>();
  /** A drag just ended: the click that follows it isn't a click */
  private justDragged = false;

  private get netWords(): NetworkGraphLabels {
    return { ...defaultNetworkGraphLabels, ...this.networkLabels };
  }
  /** A node's value is its number of links, so the shared "Value" reads "Links" unless the page renames it */
  protected override get words(): ChartLabels {
    return { ...defaultChartLabels, value: this.netWords.links, ...this.labels };
  }

  protected override defaultHeight(w: number) {
    return Math.max(260, Math.min(440, w * 0.72));
  }

  protected override tableHeader() {
    return "Node";
  }
  protected override seriesHeader() {
    return this.netWords.group;
  }

  /** The links, from `links` or from the rows, with both ends named */
  private readLinks(): { source: string; target: string; value: number }[] {
    if (this.links.length) return this.links.map((l) => ({ source: String(l.source), target: String(l.target), value: Number.isFinite(l.value) ? Math.max(0, l.value!) : 1 }));
    const has = (k: string) => this.data.some((d) => !!d && typeof d === "object" && hasField(d as object, k));
    const gs = strGetter(this.source ?? (has("source") ? "source" : "from"), "source");
    const gt = strGetter(this.target ?? (has("target") ? "target" : "to"), "target");
    const gv = this.value !== undefined || has("value") ? numGetter(this.value, "value") : null;
    return this.data.map((d, i) => {
      const v = gv ? gv(d, i) : 1;
      return { source: gs(d, i), target: gt(d, i), value: Number.isFinite(v) ? Math.max(0, v) : 1 };
    });
  }

  protected override buildModel(f: ChartFrame): ChartModel<Node, T> {
    const { width: W, height: H } = f;
    const nw = this.netWords;
    const raw = this.readLinks().filter((l) => l.source && l.target);

    // The nodes: those given, then any a link names that isn't among them
    const byId = new Map<string, { id: string; label: string; group: string | null; size: number; datum: unknown; order: number }>();
    this.nodes.forEach((n) => {
      const id = String(n.id);
      if (!id || byId.has(id)) return;
      byId.set(id, { id, label: n.label ?? id, group: n.group ?? null, size: Number.isFinite(n.size) ? Math.max(0, n.size!) : NaN, datum: n, order: byId.size });
    });
    for (const l of raw)
      for (const id of [l.source, l.target]) if (!byId.has(id)) byId.set(id, { id, label: id, group: null, size: NaN, datum: null, order: byId.size });

    // One link per pair, their values added; a node linked to itself has no line
    const pairs = new Map<string, { a: string; b: string; value: number }>();
    for (const l of raw) {
      if (l.source === l.target) continue;
      const [a, b] = l.source < l.target ? [l.source, l.target] : [l.target, l.source];
      const k = `${a}\u0001${b}`;
      const p = pairs.get(k);
      if (p) p.value += l.value;
      else pairs.set(k, { a, b, value: l.value });
    }
    const nbrIds = new Map<string, string[]>([...byId.keys()].map((id) => [id, []]));
    for (const p of pairs.values()) {
      nbrIds.get(p.a)!.push(p.b);
      nbrIds.get(p.b)!.push(p.a);
    }

    // Most-linked first, then by name: the keyboard's order and the table's
    const base = [...byId.values()].sort((a, b) => nbrIds.get(b.id)!.length - nbrIds.get(a.id)!.length || a.label.localeCompare(b.label) || a.order - b.order);
    const index = new Map(base.map((d, i) => [d.id, i]));
    const groups: string[] = [];
    [...byId.values()].forEach((d) => d.group !== null && !groups.includes(d.group) && groups.push(d.group));
    this.groups = groups;

    const n = base.length;
    const sized = base.some((d) => Number.isFinite(d.size));
    const big = n > 300;
    const rMin = big ? 2.2 : 4;
    const rMax = big ? Math.max(4, Math.min(7, W / 120)) : Math.max(8, Math.min(16, W / 40));
    const metric = base.map((d) => (sized ? (Number.isFinite(d.size) ? d.size : 0) : nbrIds.get(d.id)!.length));
    const mMax = Math.max(1e-9, ...metric);
    const radius = (v: number) => rMin + (rMax - rMin) * Math.sqrt(Math.max(0, v) / mMax);

    const hi = groups.length
      ? new Set<number>()
      : resolveHighlight(this.highlight as never, base.map((d) => d.datum ?? { id: d.id, label: d.label }) as never[], base.map((d) => d.label), base.map((d) => nbrIds.get(d.id)!.length), "max");

    const vMax = Math.max(1e-9, ...[...pairs.values()].map((p) => p.value));
    const vMin = Math.min(...[...pairs.values()].map((p) => p.value));
    const varied = pairs.size > 1 && vMax > vMin;
    const edges: Edge[] = [...pairs.values()].map((p) => ({ s: index.get(p.a)!, t: index.get(p.b)!, value: p.value, w: varied ? 0.8 + 2.6 * Math.sqrt(p.value / vMax) : big ? 0.6 : 1.2 }));
    this.edges = edges;

    // The layout, started from the last one and holding pinned nodes where they were dropped
    const forceNodes: ForceNode[] = base.map((d, i) => {
      const pin = this.pins.get(d.id);
      return { id: d.id, r: radius(metric[i]), ...(pin ? { fx: pin[0] * W, fy: pin[1] * H } : {}) };
    });
    const pos = forceLayout(
      forceNodes,
      edges.map((e) => ({ source: e.s, target: e.t, value: e.value })),
      { width: W, height: H, previous: this.previous, margin: 8 },
    );
    this.previous = new Map(base.map((d, i) => [d.id, [pos.x[i] / W, pos.y[i] / H] as const]));

    const list: Node[] = base.map((d, i) => ({
      i,
      id: d.id,
      label: d.label,
      group: d.group,
      gi: d.group === null ? -1 : groups.indexOf(d.group),
      size: d.size,
      degree: nbrIds.get(d.id)!.length,
      nbrs: nbrIds.get(d.id)!.map((id) => index.get(id)!).sort((a, b) => a - b),
      r: forceNodes[i].r,
      x: pos.x[i],
      y: pos.y[i],
      hi: hi.has(i),
      pinned: this.pins.has(d.id),
      datum: d.datum,
    }));
    this.list = list;
    this.canvas = n > this.canvasThreshold;

    // A grid for finding the node under the pointer quickly
    const cell = 24;
    const cells = new Map<string, number[]>();
    list.forEach((d) => {
      const k = `${Math.floor(d.x / cell)},${Math.floor(d.y / cell)}`;
      const arr = cells.get(k);
      if (arr) arr.push(d.i);
      else cells.set(k, [d.i]);
    });
    this.grid = { cells, cell, reach: Math.ceil((rMax + 8) / cell) };

    // Names beside the circles, most-linked (or largest) first, where they clear every circle, name and edge of the plot
    const names: Label[] = [];
    const limit = this.hideLabels ? 0 : Math.min(this.maxLabels, Math.max(3, Math.floor(W / 45)));
    if (limit > 0) {
      const order = sized ? [...list].sort((a, b) => (Number.isFinite(b.size) ? b.size : 0) - (Number.isFinite(a.size) ? a.size : 0) || a.i - b.i) : list;
      const taken: Box[] = [];
      const near = (b: Box) => {
        const out: number[] = [];
        const reach = this.grid.reach + Math.ceil(b.w / cell);
        const gx = Math.floor((b.x + b.w / 2) / cell);
        const gy = Math.floor((b.y + b.h / 2) / cell);
        for (let ox = -reach; ox <= reach; ox++) for (let oy = -this.grid.reach; oy <= this.grid.reach; oy++) out.push(...(cells.get(`${gx + ox},${gy + oy}`) ?? []));
        return out;
      };
      for (const d of order) {
        if (names.length >= limit) break;
        const tries: Omit<Label, "i">[] = [
          { dx: d.r + 5, dy: 0, anchor: "start" },
          { dx: -d.r - 5, dy: 0, anchor: "end" },
          { dx: 0, dy: -d.r - 9, anchor: "middle" },
          { dx: 0, dy: d.r + 10, anchor: "middle" },
        ];
        for (const t of tries) {
          const b = labelBox(d.label, d.x + t.dx, d.y + t.dy, AXIS_FONT, t.anchor, 600);
          const pad = { x: b.x - 3, y: b.y - 1, w: b.w + 6, h: b.h + 2 };
          if (pad.x < 1 || pad.x + pad.w > W - 1 || pad.y < 1 || pad.y + pad.h > H - 1) continue;
          if (taken.some((q) => overlaps(q, pad, 1))) continue;
          if (near(pad).some((k) => k !== d.i && overlaps(pad, { x: list[k].x - list[k].r, y: list[k].y - list[k].r, w: list[k].r * 2, h: list[k].r * 2 }))) continue;
          taken.push(pad);
          names.push({ i: d.i, ...t });
          break;
        }
      }
    }
    this.names = names;

    const D = this.duration ?? this.defaultDuration;
    const step = n > 1 ? Math.min(22, (D * 0.5) / n) : 0;
    const marks: Mark<Node>[] = list.map((d) => ({ key: `n:${d.id}`, to: [d.x, d.y, d.r], from: [d.x, d.y, 0], enter: [d.x, d.y, 0], delay: d.i * step, data: d }));

    const events: ChartEvent<T>[] = list.map((d) => ({
      datum: (d.datum ?? null) as T | null,
      index: d.i,
      key: d.id,
      label: d.label,
      value: d.degree,
      ...(d.group !== null ? { series: d.group } : {}),
      formatted: `${plural(d.degree, "link")}${d.degree ? `: ${this.neighbourList(d)}` : ""}${d.pinned ? `, ${nw.pinned}` : ""}`,
    }));
    const top = list[0];
    const summary = n
      ? `${plural(n, "node")} and ${plural(edges.length, "link")}${groups.length ? ` in ${plural(groups.length, "group")} (${groups.join(", ")})` : ""}. Most linked: ${top.label}, ${plural(top.degree, "link")}.`
      : "";
    return { marks, events, summary };
  }

  /** The first neighbours' names, then how many more */
  private neighbourList(d: Node) {
    const names = d.nbrs.slice(0, NBR_LIST).map((k) => this.list[k].label);
    const more = d.nbrs.length - NBR_LIST;
    return `${names.join(", ")}${more > 0 ? ` ${fill(this.netWords.more, { count: more })}` : ""}`;
  }

  /** Where node i is drawn now: under the pointer while dragged, else where its motion has it */
  private at(i: number): [number, number, number] {
    const d = this.list[i];
    const dr = this.dragging;
    const v = this.motion.get(`n:${d.id}`);
    const r = v?.[2] ?? d.r;
    if (dr && dr.i === i && dr.moved) return [dr.x, dr.y, r];
    return [v?.[0] ?? d.x, v?.[1] ?? d.y, r];
  }

  /** The node under (px, py), else the nearest within 8px of its edge */
  private nearest(px: number, py: number) {
    const { cells, cell, reach } = this.grid;
    const gx = Math.floor(px / cell);
    const gy = Math.floor(py / cell);
    let best = -1;
    let bd = Infinity;
    for (let ox = -reach; ox <= reach; ox++)
      for (let oy = -reach; oy <= reach; oy++)
        for (const k of cells.get(`${gx + ox},${gy + oy}`) ?? []) {
          const [x, y, r] = this.at(k);
          const dist = Math.hypot(x - px, y - py) - r;
          if (dist < bd) {
            bd = dist;
            best = k;
          }
        }
    return best >= 0 && bd <= 8 ? best : null;
  }

  protected override plotMove(x: number, y: number, e: PointerEvent) {
    const dr = this.dragging;
    if (dr) {
      const { width: W, height: H } = this.frame;
      const r = this.list[dr.i]?.r ?? 4;
      const nx = Math.max(r + 2, Math.min(W - r - 2, x));
      const ny = Math.max(r + 2, Math.min(H - r - 2, y));
      this.dragging = { ...dr, x: nx, y: ny, moved: dr.moved || Math.hypot(nx - dr.x, ny - dr.y) > 2 };
      return;
    }
    const k = this.nearest(x, y);
    if (k !== this.active) this.setActive(k, e.pointerType === "touch" ? "touch" : "pointer");
  }

  protected override plotDown(x: number, y: number, e: PointerEvent) {
    if (!this.dragNodes || e.button > 0) return false;
    const k = this.nearest(x, y);
    if (k === null) return false;
    const [nx, ny] = this.at(k);
    this.dragging = { i: k, x: nx, y: ny, moved: false };
    this.setActive(k, e.pointerType === "touch" ? "touch" : "pointer");
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {
      // A synthetic pointer can't be captured; the drag still follows moves over the plot
    }
    return true;
  }

  protected override plotUp() {
    const dr = this.dragging;
    if (!dr) return;
    this.dragging = null;
    const d = this.list[dr.i];
    if (!dr.moved || !d) return;
    const { width: W, height: H } = this.frame;
    // Dropped: held there, and the next layout starts from where it now is
    this.previous.set(d.id, [dr.x / W, dr.y / H]);
    this.pins = new Map(this.pins).set(d.id, [dr.x / W, dr.y / H]);
    this.justDragged = true;
    setTimeout(() => (this.justDragged = false), 0);
  }

  /** Lets a pinned node go: the layout settles it again */
  unpin(id?: string) {
    if (id === undefined) {
      if (this.pins.size) this.pins = new Map();
      return;
    }
    if (!this.pins.has(id)) return;
    const next = new Map(this.pins);
    next.delete(id);
    this.pins = next;
  }

  protected override headerLegend() {
    if (!this.groups.length) return nothing;
    return html`<ul class="tc-chart__legend" aria-label=${this.netWords.group}>
      ${this.groups.map((g, k) => html`<li class="tc-chart__key"><span class="tc-chart__swatch ui-nwg__key" aria-hidden="true" style=${`background: ${categoricalInk(k)}`}></span>${g}</li>`)}
    </ul>`;
  }

  private ink(d: Node) {
    return d.gi >= 0 ? categoricalInk(d.gi) : emphasisInk(d.hi);
  }

  protected override tip(i: number): TooltipData | null {
    const d = this.list[i];
    if (!d) return null;
    const nw = this.netWords;
    const [x, y, r] = this.at(i);
    return {
      x,
      y: y - r,
      title: d.label,
      rows: [
        ...(d.group !== null ? [{ label: nw.group, value: d.group, color: this.ink(d) }] : []),
        { label: nw.links, value: String(d.degree), ...(d.group === null ? { color: this.ink(d) } : {}) },
        ...(d.degree ? [{ label: nw.linkedTo, value: this.neighbourList(d), strong: false }] : []),
      ],
    };
  }

  protected override underlay() {
    return this.canvas ? canvasUnderlay() : nothing;
  }

  protected override paintUnderlay(plot: HTMLElement, f: ChartFrame) {
    if (!this.canvas) return;
    // Hover only re-renders; the links move with the nodes, so they're painted on every render
    const edges = this.edges;
    const pts = this.list.map((d) => this.at(d.i));
    const fade = this.motion.fade((this.duration ?? this.defaultDuration) * 0.4, 400);
    paintCanvas(plot, f.width, f.height, (ctx, color) => {
      ctx.strokeStyle = color("var(--tc-plot-line-rest)");
      ctx.globalAlpha = 0.35 * fade;
      ctx.lineCap = "round";
      for (const e of edges) {
        ctx.lineWidth = e.w;
        ctx.beginPath();
        ctx.moveTo(pts[e.s][0], pts[e.s][1]);
        ctx.lineTo(pts[e.t][0], pts[e.t][1]);
        ctx.stroke();
      }
    });
  }

  protected override draw(f: ChartFrame) {
    const { width: W, height: H } = f;
    const m = this.motion;
    const D = this.duration ?? this.defaultDuration;
    const list = this.list;
    const act = this.active !== null ? list[this.active] : null;
    const near = act ? new Set([act.i, ...act.nbrs]) : null;
    const kb = this.via === "keyboard";
    const linkFade = m.fade(D * 0.4, 400);
    const nameFade = m.fade(D * 0.7, 300);
    const pos = list.map((d) => this.at(d.i));

    // Links: all of them in SVG below the threshold, else only the active node's (the rest are on the canvas)
    const edges = this.canvas ? (act ? this.edges.filter((e) => e.s === act.i || e.t === act.i) : []) : this.edges;
    const lines = edges.map((e) => {
      const hot = !!act && (e.s === act.i || e.t === act.i);
      const [x1, y1] = pos[e.s];
      const [x2, y2] = pos[e.t];
      return svg`<line class="ui-nwg__link" ?data-hot=${hot} ?data-quiet=${!!act && !hot} x1=${x1} y1=${y1} x2=${x2} y2=${y2} stroke-width=${e.w}
        style=${hot ? `stroke: ${this.ink(act!)}` : nothing} opacity=${linkFade}></line>`;
    });

    const circles = m.items.map((it) => {
      const d = it.data;
      const [x, y, r] = it.exiting ? it.v : pos[d.i];
      const quiet = !it.exiting && near !== null && !near.has(d.i);
      const focus = !it.exiting && kb && act?.i === d.i;
      return svg`<g class="tc-chart__mark" @click=${it.exiting ? nothing : () => !this.justDragged && this.clickMark(d.i)}
          @dblclick=${it.exiting || !d.pinned ? nothing : () => this.unpin(d.id)}>
        <circle class="ui-nwg__back" cx=${x} cy=${y} r=${Math.max(0, r)} opacity=${it.exiting ? 0.3 : nothing}></circle>
        <circle class="ui-nwg__node" ?data-quiet=${quiet} ?data-active=${act?.i === d.i} ?data-pinned=${d.pinned} ?data-drag=${this.dragNodes} cx=${x} cy=${y} r=${Math.max(0, r)}
          style=${`fill: ${this.ink(d)}`} opacity=${it.exiting ? 0.3 : nothing}></circle>
        ${focus ? svg`<circle class="tc-chart__focus" cx=${x} cy=${y} r=${r + 3}></circle>` : nothing}
      </g>`;
    });

    // Names on chips of the card's colour, so a line passing behind never runs through the words
    const shown = new Set(this.names.map((l) => l.i));
    const names = this.names.map((l) => {
      const d = list[l.i];
      const [x, y] = pos[l.i];
      const lit = act ? near!.has(d.i) : d.hi;
      const quiet = !!act && !near!.has(d.i);
      return this.chip(d.label, x + l.dx, y + l.dy, l.anchor, quiet ? "tick" : "value", lit, nameFade);
    });
    // The active node is always named: beside it, inside the plot
    let actName: unknown = nothing;
    if (act && !shown.has(act.i)) {
      const [x, y, r] = pos[act.i];
      const w = textWidth(act.label, AXIS_FONT, 600);
      const right = x + r + 6 + w < W - 2;
      const yy = Math.max(10, Math.min(H - 10, y));
      actName = this.chip(act.label, right ? x + r + 5 : x - r - 5, yy, right ? "start" : "end", "value", true, 1);
    }

    return svg`<rect class="tc-chart__hit" x="0" y="0" width=${W} height=${H}></rect>
      <g>${lines}</g>
      <g>${circles}</g>
      <g pointer-events="none">${names}${actName}</g>`;
  }

  private chip(text: string, x: number, y: number, anchor: "start" | "middle" | "end", cls: "tick" | "value", strong: boolean, opacity: number) {
    const w = textWidth(text, AXIS_FONT, strong ? 700 : 500);
    const x0 = anchor === "start" ? x : anchor === "middle" ? x - w / 2 : x - w;
    return svg`<g opacity=${opacity >= 1 ? nothing : opacity}><rect class="ui-nwg__chip" x=${x0 - 3} y=${y - 8} width=${w + 6} height="16" rx="5"></rect>${txt(x, y, text, { anchor, cls, strong })}</g>`;
  }

  static override css = /* css */ `
[data-ui="nwg"] {
  --tc-nwg-link: var(--tc-plot-line-rest);
}
/* Nodes are parted by a ring of the card's colour, on a backing of it so a translucent ink (Clean) hides the links
   under it; a quiet one fades back while another's neighbourhood is lit */
.ui-nwg__back { fill: var(--tc-plot-bg); }
.ui-nwg__node { stroke: var(--tc-plot-bg); stroke-width: 1.2; }
.ui-nwg__node[data-quiet] { opacity: 0.28; }
.ui-nwg__node[data-active] { stroke: var(--tc-plot-focus); stroke-width: 2; }
.ui-nwg__node[data-pinned] { stroke: var(--tc-text-primary); stroke-width: 1.6; stroke-dasharray: 2 2; }
.ui-nwg__link { stroke: var(--tc-nwg-link); stroke-linecap: round; stroke-opacity: 0.55; pointer-events: none; }
.ui-nwg__link[data-hot] { stroke-opacity: 0.95; }
.ui-nwg__link[data-quiet] { stroke-opacity: 0.12; }
.ui-nwg__chip { fill: var(--tc-plot-bg); opacity: 0.9; }
.ui-nwg__key { border-radius: 50%; }
.ui-nwg__node[data-drag] { cursor: grab; }
@media (forced-colors: active) {
  .ui-nwg__node { forced-color-adjust: none; }
}
`;
}

if (!customElements.get("tc-network-graph")) customElements.define("tc-network-graph", TcNetworkGraph);

declare global {
  interface HTMLElementTagNameMap {
    "tc-network-graph": TcNetworkGraph;
  }
}
