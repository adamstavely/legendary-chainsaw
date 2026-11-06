import { nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { txt } from "./internal/chart/axis";
import { AXIS_FONT, emphasisInk, TcChartElement, type ChartFrame, type ChartModel } from "./internal/chart/element";
import { roundRectPath } from "./internal/chart/geometry";
import { buildTree, leaves, sortTree, squarify, type Rect, type TreeNode } from "./internal/chart/hierarchy";
import { resolveHighlight } from "./internal/chart/highlight";
import { textWidth, truncate } from "./internal/chart/text";
import type { Accessor, Row, TooltipData } from "./internal/chart/types";

/*
 * <tc-treemap> – parts of a whole, and of its groups, as tiles whose areas are their values. Ported from ztd-charts'
 * Treemap (MIT, © 2026 Junhan2). Rows become a tree – a flat table with `group`, path columns with `path`, or nested
 * objects with a children field – laid out squarified, largest first. The largest leaf takes the accent and the rest
 * stay quiet (`highlight` picks others); groups get a header with their share above their tiles. Tiles big enough
 * carry their name and share on a small chip of the card's colour, so the words stay legible whatever the tile's ink.
 * Tiles grow out of their centres one after another when the chart comes on screen and glide when the data changes.
 *   · one tab stop: arrows move tile to tile, each read with its group, value and share
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-treemap heading="Compute hours" .data=${[{ group: "Genomics", label: "Assembly", value: 420 }, …]}></tc-treemap>
 */

/** A treemap: Lucide's layout-dashboard (ISC, lucide.dev) */
const treemapIcon = svg`<rect width="7" height="9" x="3" y="3" rx="1"></rect><rect width="7" height="5" x="14" y="3" rx="1"></rect><rect width="7" height="9" x="14" y="12" rx="1"></rect><rect width="7" height="5" x="3" y="16" rx="1"></rect>`;

/** What a tile's chip says: its name and share, the name, the share, or nothing */
export type TreemapLabelMode = "both" | "name" | "value" | "none";

type Cell<T> = { i: number; node: TreeNode<T>; rect: Rect; hi: boolean; pct: number; ink: string };
type Group<T> = { node: TreeNode<T>; rect: Rect; pct: number; head: boolean };

/** The gap between tiles, and the group header's height, in plot px */
const GAP = 3;
const HEAD = 16;
/** The chip: inset from the tile's corner, its padding, and one line's height */
const CHIP_IN = 4;
const CHIP_PAD = 5;
const LINE = 14;

/**
 * Parts of a whole as tiles sized by value – nested in their groups, the largest emphasised, names and shares on
 * chips in the tiles big enough to hold them – with a table view.
 * @tag tc-treemap
 * @fires tc-view-change - The Table button was pressed ({ view }: ChartViewChange); cancelable – prevented, `view` stays as it was
 * @fires tc-mark-hover - The pointer or keyboard moved to a tile, or off them ({ event }: ChartMarkHover)
 * @fires tc-mark-click - A tile was clicked, or picked with Enter or Space ({ event }: ChartMarkClick)
 */
export class TcTreemap<T = Row> extends TcChartElement<Cell<T>, T> {
  static override ui = "tmp";

  /** The tile-name field; by default "label" */
  @property({ attribute: false }) accessor label: Accessor<T, string> | undefined = undefined;
  /** The value field; by default "value" */
  @property({ attribute: false }) accessor value: Accessor<T, number> | undefined = undefined;
  /** The parent-group field of a flat table; tiles are nested in their groups, each with a header */
  @property({ attribute: false }) accessor group: Accessor<T, string> | undefined = undefined;
  /** Several levels: path fields from the top, e.g. ["division", "lab"] */
  @property({ attribute: false }) accessor path: string[] | undefined = undefined;
  /** The children field of nested rows; by default "children" */
  @property({ attribute: "children-field" }) accessor childrenField: string | undefined = undefined;
  /** What the chips in the tiles say: "both" (name and share), "name", "value" (the share) or "none" */
  @property({ attribute: "label-mode" }) accessor labelMode: TreemapLabelMode = "both";
  /** Orders tiles from the largest (the default); set false – or sort="false" – to keep the data's order */
  @property({ converter: { fromAttribute: (v: string | null) => v !== "false" } }) accessor sort = true;

  protected override readonly kind = "Treemap";
  protected override readonly icon = treemapIcon;
  protected override defaultDuration = 700;
  protected override stagger = 45;
  protected override modelKeys = ["label", "value", "group", "path", "childrenField", "labelMode", "sort"];

  private cells: Cell<T>[] = [];
  private groups: Group<T>[] = [];

  protected override defaultHeight(w: number) {
    return Math.max(180, Math.min(280, w * 0.58));
  }

  protected override buildModel(f: ChartFrame): ChartModel<Cell<T>, T> {
    const { width: W, height: H } = f;
    const tree = buildTree(this.data, { label: this.label, value: this.value, group: this.group, path: this.path, children: this.childrenField });
    if (this.sort) sortTree(tree);
    const total = tree.value || 1;
    const grouped = tree.children.some((ch) => ch.children.length > 0);
    const lv = leaves(tree);
    const hiSet = resolveHighlight(this.highlight, lv.map((l) => l.datum as T), lv.map((l) => l.label), lv.map((l) => l.value), "max");
    const hiNodes = new Set([...hiSet].map((k) => lv[k]));
    const cells: Cell<T>[] = [];
    const groups: Group<T>[] = [];
    const index = new Map(lv.map((l, k) => [l, k]));
    const place = (node: TreeNode<T>, box: Rect) => {
      const kids = node.children;
      const rects = squarify(kids.map((k) => k.value), box);
      kids.forEach((k, j) => {
        const r = rects[j];
        if (k.children.length) {
          // A header above the group's tiles when it's tall and wide enough to hold one
          const head = grouped && r.h > HEAD + 18 && r.w > 40;
          groups.push({ node: k, rect: r, pct: (k.value / total) * 100, head });
          place(k, { x: r.x, y: r.y + (head ? HEAD : 0), w: r.w, h: r.h - (head ? HEAD : 0) });
        } else {
          const hi = hiNodes.has(k);
          cells.push({ i: index.get(k) ?? 0, node: k, rect: r, hi, pct: (k.value / total) * 100, ink: emphasisInk(hi) });
        }
      });
    };
    // Each tile gives up GAP on its right and bottom, so the box is GAP bigger than the plot
    place(tree, { x: 0, y: 0, w: W + GAP, h: H + GAP });
    cells.sort((a, b) => a.i - b.i);
    this.cells = cells;
    this.groups = groups;

    const marks = cells.map((cl, k) => {
      const r = cl.rect;
      const w = Math.max(0, r.w - GAP);
      const h = Math.max(0, r.h - GAP);
      return {
        key: `t:${cl.node.id}`,
        to: [r.x, r.y, w, h, 1],
        from: [r.x + w * 0.04, r.y + h * 0.04, w * 0.92, h * 0.92, 0],
        enter: [r.x + w / 2, r.y + h / 2, 0, 0, 0],
        delay: k * this.stagger,
        data: cl,
      };
    });
    const events = cells.map((cl) => ({
      datum: cl.node.datum,
      index: cl.i,
      key: cl.node.id,
      label: cl.node.label,
      series: cl.node.parent && cl.node.parent.depth > 0 ? cl.node.parent.label : undefined,
      value: cl.node.value,
      formatted: `${f.fv(cl.node.value)} · ${f.pct(cl.pct)}`,
    }));
    const top = [...cells].sort((a, b) => b.node.value - a.node.value).slice(0, 3);
    const summary = `${cells.length} ${cells.length === 1 ? "item" : "items"}, total ${f.fv(tree.value)}. Largest: ${top.map((cl) => `${cl.node.label} ${f.pct(cl.pct)}`).join(", ")}`;
    return { marks, events, summary };
  }

  protected override tip(i: number, f: ChartFrame): TooltipData | null {
    const cl = this.cells[i];
    if (!cl) return null;
    const parent = cl.node.parent && cl.node.parent.depth > 0 ? cl.node.parent.label : null;
    return {
      x: cl.rect.x + (cl.rect.w - GAP) / 2,
      y: cl.rect.y + 4,
      title: parent ? `${parent} › ${cl.node.label}` : cl.node.label,
      rows: [
        { label: this.words.value, value: f.fv(cl.node.value), color: cl.ink },
        { label: "Share", value: f.pct(cl.pct) },
      ],
    };
  }

  protected override tableHeader() {
    return "Item";
  }
  protected override seriesHeader() {
    return "Group";
  }

  /** The chip in a tile: its lines (name strong, share quiet) on the card's colour, or nothing when it won't fit */
  private chip(cl: Cell<T>, x: number, y: number, w: number, h: number, f: ChartFrame, opacity: number) {
    const mode = this.labelMode;
    if (mode === "none" || this.hideLabels) return nothing;
    const room = w - CHIP_IN * 2 - CHIP_PAD * 2;
    if (room < 16 || h < LINE + 4 + CHIP_IN * 2) return nothing;
    const share = f.pct(cl.pct);
    const lines: { text: string; strong: boolean }[] = [];
    if (mode === "value") {
      if (textWidth(share, AXIS_FONT, 500) <= room) lines.push({ text: share, strong: true });
    } else {
      const name = truncate(cl.node.label, room, AXIS_FONT, 700);
      if (name) lines.push({ text: name, strong: true });
      // The share under the name when there's height for a second line
      if (name && mode === "both" && h >= LINE * 2 + 4 + CHIP_IN * 2 + 2 && textWidth(share, AXIS_FONT, 500) <= room) lines.push({ text: share, strong: false });
    }
    if (!lines.length) return nothing;
    const tw = Math.max(...lines.map((l) => textWidth(l.text, AXIS_FONT, l.strong ? 700 : 500)));
    const cx = x + CHIP_IN;
    const cy = y + CHIP_IN;
    return svg`<g opacity=${opacity}>
      <rect class="ui-tmp__chip" x=${cx} y=${cy} width=${Math.ceil(tw + CHIP_PAD * 2)} height=${lines.length * LINE + 4} rx="3"></rect>
      ${lines.map((l, k) => txt(cx + CHIP_PAD, cy + 2 + LINE / 2 + k * LINE, l.text, { cls: "value", strong: l.strong }))}
    </g>`;
  }

  protected override draw(f: ChartFrame) {
    const m = this.motion;
    const stg = this.stagger;
    const index = new Map(this.cells.map((cl, k) => [cl.node.id, k]));
    const heads = this.groups.map((g, k) => {
      if (!g.head) return nothing;
      return txt(g.rect.x + 1, g.rect.y + HEAD / 2 - 1, truncate(`${g.node.label} ${f.pct(g.pct)}`, g.rect.w - GAP - 2, AXIS_FONT, 500), { opacity: m.fade(k * stg * 2, 300) });
    });
    const tiles = m.items.map((it) => {
      const cl = it.data;
      const [x, y, w, h, o] = it.v;
      const i = index.get(cl.node.id) ?? cl.i;
      const r = Math.max(0, Math.min(4, w / 4, h / 4));
      const focus = this.active === i && this.via === "keyboard" && w > 4 && h > 4;
      const hv = this.hover(i);
      return svg`<g class="tc-chart__mark" opacity=${it.exiting ? Math.max(0, o) * 0.6 : this.dim(i)} @pointerenter=${hv.enter} @click=${hv.click}>
        <path class="ui-tmp__tile" d=${roundRectPath(x, y, Math.max(0, w), Math.max(0, h), r)} style=${`fill: ${cl.ink}`} opacity=${Math.max(0, Math.min(1, o))}></path>
        ${focus ? svg`<path class="tc-chart__focus" d=${roundRectPath(x + 1, y + 1, w - 2, h - 2, Math.min(4, r))}></path>` : nothing}
        ${it.exiting ? nothing : this.chip(cl, x, y, w, h, f, Math.max(0, Math.min(1, o)) * m.fade(cl.i * stg + 200, 260))}
      </g>`;
    });
    return svg`<g>${heads}</g><g>${tiles}</g>`;
  }

  static override css = /* css */ `
/* The chip a tile's name sits on: the card's own colour, so the words read the same on every ink */
.ui-tmp__chip { fill: var(--tc-plot-bg); pointer-events: none; }
@media (forced-colors: active) {
  .ui-tmp__tile { forced-color-adjust: none; }
  .ui-tmp__chip { fill: Canvas; }
}
`;
}

if (!customElements.get("tc-treemap")) customElements.define("tc-treemap", TcTreemap);

declare global {
  interface HTMLElementTagNameMap {
    "tc-treemap": TcTreemap;
  }
}
