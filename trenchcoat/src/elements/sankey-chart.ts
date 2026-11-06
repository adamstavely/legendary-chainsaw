import { nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { numGetter, strGetter } from "./internal/chart/accessor";
import { txt } from "./internal/chart/axis";
import { AXIS_FONT, emphasisInk, TcChartElement, type ChartFrame, type ChartModel } from "./internal/chart/element";
import { r2, roundRectPath } from "./internal/chart/geometry";
import { resolveHighlight } from "./internal/chart/highlight";
import { plural } from "./internal/chart/i18n";
import type { Mark } from "./internal/chart/motion";
import { sankeyLayout, sankeyLinkPath, type SankeyLink, type SankeyNode } from "./internal/chart/sankey";
import { textWidth, truncate } from "./internal/chart/text";
import type { Accessor, Row, TooltipData } from "./internal/chart/types";

/*
 * <tc-sankey-chart> – how an amount flows between stages: nodes in columns by step, flows between them as bands as wide
 * as their value. Ported from ztd-charts' SankeyChart (MIT, © 2026 Junhan2). One node is emphasised – by default the
 * largest in the last column – and every flow into or out of it takes the accent while the rest stay quiet (`highlight`
 * picks others). Pointing at a node lights its flows and fades the rest; pointing at a flow lights just that one. Names
 * and values sit beside the first and last columns, and on a card-coloured backing over the flows in between. Nodes
 * open from their middles column by column, then the flows draw across from left to right; data changes glide.
 *   · one tab stop: arrows move through the nodes, then the flows, each read with its value
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-sankey-chart heading="Grant funding" .data=${[{ source: "Federal", target: "Genomics", value: 4.2 }]}></tc-sankey-chart>
 */

/** A Sankey diagram's flows: Lucide's "workflow"-like split (ISC, lucide.dev) */
const sankeyIcon = svg`<path d="M3 5h4c5 0 5 7 10 7h4"></path><path d="M3 5h4c5 0 5 14 10 14h4"></path><path d="M3 12h4"></path>`;

export type { SankeyLink, SankeyNode } from "./internal/chart/sankey";

type Item = { node?: SankeyNode; link?: SankeyLink; k?: number };

const NAME_FONT = 11.5;

/**
 * Flows between stages as bands sized by value – nodes in columns, one node and its flows emphasised, names and values
 * beside the nodes, and a table view.
 * @tag tc-sankey-chart
 * @fires tc-view-change - The Table button was pressed ({ view }: ChartViewChange); cancelable – prevented, `view` stays as it was
 * @fires tc-mark-hover - The pointer or keyboard moved to a node or flow, or off them ({ event }: ChartMarkHover)
 * @fires tc-mark-click - A node or flow was clicked, or picked with Enter or Space ({ event }: ChartMarkClick)
 */
export class TcSankeyChart<T = Row> extends TcChartElement<Item, T> {
  static override ui = "snk";

  /** The field naming where a flow starts; by default "source" */
  @property({ attribute: false }) accessor source: Accessor<T, string> | undefined = undefined;
  /** The field naming where a flow ends; by default "target" */
  @property({ attribute: false }) accessor target: Accessor<T, string> | undefined = undefined;
  /** The flow's amount field; by default "value" */
  @property({ attribute: false }) accessor value: Accessor<T, number> | undefined = undefined;
  /** How wide each node is, in px */
  @property({ type: Number, attribute: "node-width" }) accessor nodeWidth = 10;
  /** The space between nodes in a column, in px */
  @property({ type: Number, attribute: "node-padding" }) accessor nodePadding = 14;

  protected override readonly kind = "Sankey diagram";
  protected override readonly icon = sankeyIcon;
  protected override defaultDuration = 1000;
  protected override stagger = 70;
  protected override modelKeys = ["source", "target", "value", "nodeWidth", "nodePadding"];

  private nodes: SankeyNode[] = [];
  private links: SankeyLink[] = [];
  private hiNodes: ReadonlySet<number> = new Set();
  private g = { lw: 0, rw: 0, maxLayer: 0 };

  protected override defaultHeight(w: number) {
    return Math.max(220, Math.min(340, w * 0.6));
  }

  protected override tableHeader() {
    return "Node or flow";
  }

  protected override buildModel(f: ChartFrame): ChartModel<Item, T> {
    const { width: W, height: H } = f;
    const gs = strGetter(this.source, "source");
    const gt = strGetter(this.target, "target");
    const gv = numGetter(this.value, "value");
    const links0 = this.data.map((d, i) => ({ source: gs(d, i), target: gt(d, i), value: gv(d, i) || 0, d }));

    // Only the columns are read here, so the relaxation passes are skipped
    const pre = sankeyLayout([], links0, { width: 100, height: 100, iterations: 0 });
    const maxLayer = Math.max(0, ...pre.nodes.map((n) => n.layer));
    const side = (ns: SankeyNode[]) => Math.min(W * 0.22, Math.max(0, ...ns.map((n) => Math.max(textWidth(n.label, NAME_FONT, 700), textWidth(f.fmt(n.value), AXIS_FONT)))) + 10);
    const lw = side(pre.nodes.filter((n) => n.layer === 0));
    const rw = side(pre.nodes.filter((n) => n.layer === maxLayer && maxLayer > 0));
    const { nodes, links } = sankeyLayout([], links0, { width: Math.max(60, W - lw - rw), height: H - 8, x0: lw, y0: 4, nodeWidth: this.nodeWidth, nodePadding: this.nodePadding });
    this.nodes = nodes;
    this.links = links;
    this.g = { lw, rw, maxLayer };

    // By default the largest node in the last column; a test is handed each laid-out node
    if (this.highlight !== undefined) this.hiNodes = resolveHighlight(this.highlight as never, nodes as never[], nodes.map((n) => n.label), nodes.map((n) => n.value));
    else {
      const best = nodes.filter((n) => n.layer === maxLayer).sort((a, b) => b.value - a.value)[0];
      this.hiNodes = new Set(best ? [best.index] : []);
    }

    const stg = this.stagger;
    const D = this.duration ?? this.defaultDuration;
    const marks: Mark<Item>[] = [];
    for (const n of nodes) {
      const mid = (n.y0 + n.y1) / 2;
      marks.push({ key: `n:${n.id}`, to: [n.y0, n.y1], from: [mid, mid], enter: [mid, mid], delay: n.layer * stg * 2, data: { node: n } });
    }
    links.forEach((l, k) =>
      marks.push({ key: `l:${l.source.id}>${l.target.id}`, to: [1, l.y0, l.y1, l.width], from: [0, l.y0, l.y1, l.width], enter: [0, l.y0, l.y1, l.width], delay: D * 0.25 + l.source.layer * stg * 3 + (k % 6) * 25, data: { link: l, k } }),
    );

    // A flow's own row, found through a map rather than a scan
    const rowOf = new Map<string, T>();
    for (const x of links0) if (!rowOf.has(`${x.source}>${x.target}`)) rowOf.set(`${x.source}>${x.target}`, x.d);
    const events = [
      ...nodes.map((n) => ({ datum: null, index: n.index, key: n.id, label: n.label, value: n.value, formatted: f.fv(n.value) })),
      ...links.map((l, k) => ({ datum: rowOf.get(`${l.source.id}>${l.target.id}`) ?? null, index: nodes.length + k, key: `${l.source.id}>${l.target.id}`, label: `${l.source.label} → ${l.target.label}`, value: l.value, formatted: f.fv(l.value) })),
    ];
    const top = [...links].sort((a, b) => b.value - a.value).slice(0, 3);
    const summary = `${plural(nodes.length, "node")}, ${plural(links.length, "flow")}. Largest flows: ${top.map((l) => `${l.source.label} → ${l.target.label} ${f.fv(l.value)}`).join(", ")}`;
    return { marks, events, summary };
  }

  private linkHot(l: SankeyLink) {
    return this.hiNodes.has(l.source.index) || this.hiNodes.has(l.target.index);
  }

  protected override tip(i: number, f: ChartFrame): TooltipData | null {
    const nc = this.nodes.length;
    if (i < nc) {
      const n = this.nodes[i];
      if (!n) return null;
      return {
        x: (n.x0 + n.x1) / 2,
        y: n.y0,
        title: n.label,
        rows: [
          { label: "Total", value: f.fv(n.value), color: this.hiNodes.has(n.index) ? emphasisInk(true) : "var(--tc-plot-line-rest)" },
          ...(n.inLinks.length ? [{ label: "In", value: plural(n.inLinks.length, "flow") }] : []),
          ...(n.outLinks.length ? [{ label: "Out", value: plural(n.outLinks.length, "flow") }] : []),
        ],
      };
    }
    const l = this.links[i - nc];
    if (!l) return null;
    return {
      x: (l.source.x1 + l.target.x0) / 2,
      y: (l.y0 + l.y1) / 2 - l.width / 2,
      title: `${l.source.label} → ${l.target.label}`,
      rows: [
        { label: "Flow", value: f.fv(l.value), color: emphasisInk(this.linkHot(l)) },
        { label: `Share of ${l.source.label}`, value: f.pct((l.value / (l.source.value || 1)) * 100) },
      ],
    };
  }

  private linkOpacity(l: SankeyLink) {
    const act = this.active;
    const nc = this.nodes.length;
    const activeNode = act !== null && act < nc ? this.nodes[act] : null;
    const activeLink = act !== null && act >= nc ? this.links[act - nc] : null;
    if (activeNode) return l.source === activeNode || l.target === activeNode ? 0.75 : 0.12;
    if (activeLink) return l === activeLink ? 0.8 : 0.12;
    return this.linkHot(l) ? 0.55 : 0.32;
  }

  protected override draw(f: ChartFrame) {
    const { width: W } = f;
    const { lw, rw, maxLayer } = this.g;
    const m = this.motion;
    const nc = this.nodes.length;
    const stg = this.stagger;
    const D = this.duration ?? this.defaultDuration;
    const act = this.active;
    const kb = this.via === "keyboard";

    const flows = m.items.map((it) => {
      const l = it.data.link;
      if (!l) return nothing;
      const [t, y0, y1, w] = it.v;
      if (t <= 0.001) return nothing;
      const k = it.exiting ? -1 : (it.data.k ?? -1);
      const h = k >= 0 ? this.hover(nc + k) : null;
      const focus = kb && k >= 0 && act === nc + k;
      return svg`<path class="tc-chart__mark ui-snk__flow" ?data-focus=${focus} d=${sankeyLinkPath({ source: l.source, target: l.target, y0, y1, width: w }, t)}
        style=${`fill: ${emphasisInk(this.linkHot(l))}`} opacity=${(it.exiting ? 0.12 : this.linkOpacity(l)) * Math.min(1, t * 1.5)}
        @pointerenter=${h ? h.enter : nothing} @click=${h ? h.click : nothing}></path>`;
    });

    const nodes = m.items.map((it) => {
      const n = it.data.node;
      if (!n) return nothing;
      const [y0, y1] = it.v;
      const live = !it.exiting;
      const hot = this.hiNodes.has(n.index);
      const isA = live && act === n.index;
      const first = n.layer === 0;
      const last = n.layer === maxLayer && maxLayer > 0;
      const lx = first ? n.x0 - 8 : n.x1 + 8;
      const anchor = first ? "end" : "start";
      const room = first ? lw - 10 : last ? rw - 10 : Math.max(40, (this.nodes.find((q) => q.layer === n.layer + 1)?.x0 ?? W) - n.x1 - 16);
      const cy = (n.y0 + n.y1) / 2;
      const two = n.y1 - n.y0 >= 26;
      // Names in the middle columns sit over the flows, on a backing of the card's colour
      const overLinks = !first && !last;
      const name = truncate(n.label, room, NAME_FONT, 700);
      const pillW = Math.max(textWidth(name, NAME_FONT, 800), two ? textWidth(f.fmt(n.value), AXIS_FONT) : 0) + 10;
      const pillH = two ? 32 : 18;
      const h = live ? this.hover(n.index) : null;
      const label =
        this.hideLabels || !live
          ? nothing
          : svg`<g opacity=${m.fade(n.layer * stg * 2 + D * 0.35, 300)} pointer-events="none">
              ${overLinks ? svg`<rect class="ui-snk__backing" x=${r2(lx - 5)} y=${r2(cy - pillH / 2)} width=${r2(pillW)} height=${pillH} rx="6"></rect>` : nothing}
              ${txt(lx, two ? cy - 7 : cy, name, { cls: "value", anchor, strong: hot || isA })}
              ${two ? txt(lx, cy + 8, f.fmt(n.value), { anchor }) : nothing}
            </g>`;
      return svg`<g @pointerenter=${h ? h.enter : nothing} @click=${h ? h.click : nothing} opacity=${it.exiting ? 0.4 : nothing}>
        <path class="tc-chart__mark ui-snk__node" ?data-hot=${hot} d=${roundRectPath(n.x0, y0, n.x1 - n.x0, Math.max(1, y1 - y0), 2)}
          style=${`fill: ${hot ? emphasisInk(true) : "var(--tc-plot-line-rest)"}`}></path>
        ${isA && kb ? svg`<path class="tc-chart__focus" d=${roundRectPath(n.x0 - 2, y0 - 2, n.x1 - n.x0 + 4, Math.max(1, y1 - y0) + 4, 3)}></path>` : nothing}
        ${label}
      </g>`;
    });

    return svg`<g>${flows}</g><g>${nodes}</g>`;
  }

  static override css = /* css */ `
/* The keyboard's flow is outlined; names over the flows sit on a backing of the card's colour */
.ui-snk__flow[data-focus] { stroke: var(--tc-plot-focus); stroke-width: 1.5; }
.ui-snk__backing { fill: var(--tc-plot-bg); opacity: 0.94; }
@media (forced-colors: active) {
  .ui-snk__node, .ui-snk__flow { forced-color-adjust: none; }
  .ui-snk__backing { fill: Canvas; }
}
`;
}

if (!customElements.get("tc-sankey-chart")) customElements.define("tc-sankey-chart", TcSankeyChart);

declare global {
  interface HTMLElementTagNameMap {
    "tc-sankey-chart": TcSankeyChart;
  }
}
