import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { FocusRescueController } from "./internal/controllers";
import { duration } from "./internal/format";
import { layoutColumns, type PlacedEdge, type PlacedNode } from "./internal/layered-graph";

/*
 * <tc-lineage-graph> – where an output came from. The run, its turns, the queries and tools they called, the source
 * chunks that came back, the claims made from them and the artifacts that carry those claims, laid out as columns
 * (left to right, cause to effect) with layoutColumns(). The column set is data: an app can drop, rename or add
 * columns.
 *   · point at or focus a node and its whole lineage lights up – everything it came from and everything it feeds
 *   · a weak link (the context was truncated, so the source may not have reached the model in full) is dashed
 *   · click a node, or press Enter on it, and its record opens below the graph: what it is, its fields, what it
 *     came from and what it feeds – each a link to that node
 *   · two views: the graph, and the event chain – the same nodes as a list in the order they happened
 *
 *   <tc-lineage-graph .nodes=${nodes} .edges=${[{ from: "q1", to: "c3", weak: true }]}></tc-lineage-graph>
 *
 * The graph is an ARIA grid: one row of column headers, then a row per layout row; arrow keys move up and down a
 * column, and left and right along the links. The event chain is a listbox. `selected` (the open record) and `view`
 * are values with cancelable `tc-selected-change` and `tc-view-change` events.
 */

export type LineageTone = "neutral" | "blue" | "teal" | "green" | "violet" | "amber" | "pink" | "rose";
export type LineageView = "graph" | "chain";

export type LineageColumn = {
  id: string;
  /** The column's heading, e.g. "Source chunks" */
  label: string;
  /** The colour of its nodes' marks */
  tone?: LineageTone;
};

/** A line of a node's record, e.g. { label: "Score", value: "0.82" } */
export type LineageField = { label: string; value: string };

export type LineageNode = {
  id: string;
  /** The id of the column it sits in */
  column: string;
  /** What it is, in a few words – e.g. "search: renewal terms 2024" */
  label: string;
  /** One quieter line under the label – e.g. "policy-handbook.pdf · p. 14" */
  detail?: string;
  /** When it happened, in ms from the start of the run – orders the event chain and shows there */
  at?: number;
  /** A passage shown in the record – the chunk's text, the claim as written */
  text?: string;
  /** Key–value lines shown in the record */
  fields?: LineageField[];
  /** Overrides the column's tone for this node – e.g. a claim coloured by where it came from */
  tone?: LineageTone;
};

export type LineageEdge = {
  /** Where it came from … */
  from: string;
  /** … and what it fed */
  to: string;
  /** A weak link – the context was truncated, so the source may not have reached the model in full. Drawn dashed */
  weak?: boolean;
  /** Why it's weak, e.g. "3 of 8 chunks fit the context" – shown in the record */
  note?: string;
};

/** Details of the events */
export type LineageSelectedChange = { selected: string | null; node?: LineageNode };
export type LineageViewChange = { view: LineageView };

/** The columns of an AI output's lineage, cause to effect */
export const LINEAGE_COLUMNS: LineageColumn[] = [
  { id: "run", label: "Run", tone: "neutral" },
  { id: "turn", label: "Turns", tone: "blue" },
  { id: "query", label: "Queries & tools", tone: "amber" },
  { id: "chunk", label: "Source chunks", tone: "teal" },
  { id: "claim", label: "Claims", tone: "violet" },
  { id: "artifact", label: "Artifacts", tone: "rose" },
];

const VIEWS: Record<LineageView, string> = { graph: "Graph", chain: "Event chain" };

/** Node and column geometry, in px – narrower nodes and gaps in a narrow container */
const NODE_H = 50;
const ROW_GAP = 12;
const HEAD_H = 30;
const WIDE = { node: 156, gap: 44 };
const COMPACT = { node: 128, gap: 30 };
/** Below this width the graph uses the compact geometry */
const COMPACT_BELOW = 600;

/** Everything a node came from (nearest first) or feeds, following the links */
function walk(start: string, next: Map<string, string[]>) {
  const out = new Set<string>();
  const queue = [start];
  while (queue.length)
    for (const id of next.get(queue.shift()!) ?? []) {
      if (out.has(id)) continue;
      out.add(id);
      queue.push(id);
    }
  return out;
}

const names = (list: string[]) => (list.length <= 3 ? list.join(", ") : `${list.slice(0, 3).join(", ")} and ${list.length - 3} more`);

/* ---------- Icons ---------- */

/** Three columns of nodes, linked – the title mark (drawn for Trenchcoat) */
const lineageMark = html`<svg class="ui-lng__mark-svg" viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M4 8h1.5c1.6 0 1.6-3.5 3.2-3.5H10M5.5 8c1.6 0 1.6 3.5 3.2 3.5H10" fill="none"></path><circle cx="3" cy="8" r="1.8"></circle><circle cx="12" cy="4.5" r="1.8"></circle><circle cx="12" cy="11.5" r="1.8"></circle>`}</svg>`;
/* x, arrow-left, arrow-right: Lucide (ISC, lucide.dev) */
const closeIcon = html`<svg class="ui-lng__glyph" viewBox="0 0 24 24" aria-hidden="true">${svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`}</svg>`;
const fromIcon = html`<svg class="ui-lng__glyph" viewBox="0 0 24 24" aria-hidden="true">${svg`<path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path>`}</svg>`;
const toIcon = html`<svg class="ui-lng__glyph" viewBox="0 0 24 24" aria-hidden="true">${svg`<path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path>`}</svg>`;

let instances = 0;

/**
 * Where an output came from: run, turns, queries and tools, source chunks, claims and artifacts in columns, every
 * node's record a click away.
 * @tag tc-lineage-graph
 * @fires tc-selected-change - A node's record was opened or closed ({ selected, node }: LineageSelectedChange; selected is null when closed); cancelable
 * @fires tc-view-change - The Graph or Event chain tab was picked ({ view }: LineageViewChange); cancelable
 */
export class TcLineageGraph extends TcElement {
  static override ui = "lng";

  /** The heading in the bar, and the graph's name */
  @property() accessor heading = "Lineage";
  /** The columns, cause to effect – a node sits in the column its `column` names; columns without nodes don't show */
  @property({ attribute: false }) accessor columns: LineageColumn[] = LINEAGE_COLUMNS;
  /** Everything in the lineage: the run, turns, queries and tools, source chunks, claims, artifacts */
  @property({ attribute: false }) accessor nodes: LineageNode[] = [];
  /** The links, from what came first to what it fed */
  @property({ attribute: false }) accessor edges: LineageEdge[] = [];
  /** The node whose record is open (null = none). Changed by the user unless a tc-selected-change listener calls
   *  preventDefault() */
  @property() accessor selected: string | null = null;
  /** "graph" or "chain" (the event chain). Changed by the user unless a tc-view-change listener calls
   *  preventDefault() */
  @property({ reflect: true }) accessor view: LineageView = "graph";
  /** What a weak link means – in the legend, and in a node's links when the link has no note of its own */
  @property({ attribute: "weak-label" }) accessor weakLabel = "Truncated context";
  /** Shown when there are no nodes */
  @property({ attribute: "empty-text" }) accessor emptyText = "No lineage recorded yet";

  /** @internal The node the keyboard is on */
  @state() accessor cursor: string | null = null;
  /** @internal The node under the pointer */
  @state() accessor hover: string | null = null;
  /** @internal Focus is inside the graph or the chain */
  @state() accessor focused = false;
  /** @internal The container is narrow: smaller nodes and gaps */
  @state() accessor compact = false;

  private readonly uid = `tc-lng${++instances}`;
  private layout: { nodes: Map<string, PlacedNode>; edges: PlacedEdge[]; width: number; height: number; columns: { col: LineageColumn; x: number; count: number }[] } = {
    nodes: new Map(),
    edges: [],
    width: 0,
    height: 0,
    columns: [],
  };
  private into = new Map<string, string[]>();
  private outOf = new Map<string, string[]>();
  private byId = new Map<string, LineageNode>();
  private focusNode: string | null = null;
  private ro?: ResizeObserver;

  constructor() {
    super();
    // A record or node that goes away hands focus to the node the keyboard was on, else the first one
    new FocusRescueController(this, () => this.querySelector<HTMLElement>('[data-lng-node][tabindex="0"]') ?? this.querySelector<HTMLElement>(".ui-lng__tab[aria-selected='true']"));
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
    if (typeof ResizeObserver === "undefined") return;
    this.ro = new ResizeObserver(([entry]) => {
      const compact = entry.contentRect.width > 0 && entry.contentRect.width < COMPACT_BELOW;
      if (compact !== this.compact) this.compact = compact;
    });
    this.ro.observe(this);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.ro?.disconnect();
    this.ro = undefined;
  }

  /* ---------- Derived state ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (changed.has("nodes") || changed.has("edges") || changed.has("columns") || changed.has("compact")) this.relayout();
    if (this.selected !== null && !this.byId.has(this.selected)) this.selected = null;
    if (this.cursor !== null && !this.byId.has(this.cursor)) this.cursor = null;
    if (this.hover !== null && !this.byId.has(this.hover)) this.hover = null;
  }

  private relayout() {
    const colIndex = new Map(this.columns.map((c, i) => [c.id, i]));
    const nodes = this.nodes.filter((n) => colIndex.has(n.column));
    this.byId = new Map(nodes.map((n) => [n.id, n]));
    const edges = this.edges.filter((e) => this.byId.has(e.from) && this.byId.has(e.to) && e.from !== e.to);
    this.into = new Map();
    this.outOf = new Map();
    for (const e of edges) {
      this.into.set(e.to, [...(this.into.get(e.to) ?? []), e.from]);
      this.outOf.set(e.from, [...(this.outOf.get(e.from) ?? []), e.to]);
    }
    const placed = layoutColumns(
      nodes.map((n) => ({ id: n.id, column: colIndex.get(n.column)! })),
      edges,
      { nodeWidth: this.geometry.node, nodeHeight: NODE_H, columnGap: this.geometry.gap, rowGap: ROW_GAP },
    );
    const at = new Map(placed.nodes.map((p) => [p.id, p]));
    const columns = [...new Set(placed.nodes.map((p) => p.column))]
      .sort((a, b) => a - b)
      .map((c) => {
        const inCol = placed.nodes.filter((p) => p.column === c);
        return { col: this.columns[c], x: inCol[0].x, count: inCol.length };
      });
    this.layout = { nodes: at, edges: placed.edges, width: placed.width, height: placed.height, columns };
  }

  /** @internal */
  private get geometry() {
    return this.compact ? COMPACT : WIDE;
  }

  /** @internal A node's column, as placed */
  private columnOf(id: string) {
    return this.layout.nodes.get(id)?.column ?? -1;
  }

  /** @internal The nodes in a column, top to bottom */
  private inColumn(column: number) {
    return [...this.layout.nodes.values()].filter((p) => p.column === column).sort((a, b) => a.row - b.row);
  }

  /** @internal The nodes in the order they happened: by time, then column, then row */
  private get chain() {
    return [...this.byId.values()].sort((a, b) => {
      const pa = this.layout.nodes.get(a.id)!;
      const pb = this.layout.nodes.get(b.id)!;
      return (a.at ?? Infinity) - (b.at ?? Infinity) || pa.column - pb.column || pa.row - pb.row;
    });
  }

  /** @internal The tone of a node: its own, else its column's */
  private toneOf(n: LineageNode): LineageTone {
    return n.tone ?? this.columns.find((c) => c.id === n.column)?.tone ?? "neutral";
  }

  /** @internal */
  private columnLabel(n: LineageNode) {
    return this.columns.find((c) => c.id === n.column)?.label ?? n.column;
  }

  /** @internal The link between two nodes */
  private edge(from: string, to: string) {
    return this.edges.find((e) => e.from === from && e.to === to);
  }

  /** @internal What lights up: the node pointed at, else the one the keyboard is on, else the open one */
  private get active() {
    return this.hover ?? (this.focused ? this.cursor : null) ?? this.selected;
  }

  /* ---------- Actions ---------- */

  private select(id: string | null) {
    if (id === this.selected) return;
    const node = id === null ? undefined : this.byId.get(id);
    if (id !== null && !node) return;
    if (!this.emit<LineageSelectedChange>("tc-selected-change", { selected: id, node }, { cancelable: true })) return;
    this.selected = id;
  }

  private pickView(view: LineageView, focus = false) {
    if (view !== this.view && this.emit<LineageViewChange>("tc-view-change", { view }, { cancelable: true })) this.view = view;
    if (focus) this.updateComplete.then(() => this.querySelector<HTMLElement>(`#${this.uid}-tab-${this.view}`)?.focus());
  }

  private moveTo(id: string | undefined) {
    if (!id) return;
    this.cursor = id;
    this.focusNode = id;
  }

  /** The node in the next or previous column along the links – the linked one nearest in height, else the nearest */
  private across(id: string, dir: 1 | -1) {
    const here = this.layout.nodes.get(id)!;
    const linked = (dir > 0 ? this.outOf : this.into).get(id) ?? [];
    const placedCols = [...new Set([...this.layout.nodes.values()].map((p) => p.column))].sort((a, b) => a - b);
    const nearest = (list: PlacedNode[]) => list.sort((a, b) => Math.abs(a.y - here.y) - Math.abs(b.y - here.y))[0]?.id;
    const linkedPlaced = linked.map((l) => this.layout.nodes.get(l)!).filter((p) => (dir > 0 ? p.column > here.column : p.column < here.column));
    if (linkedPlaced.length) {
      const closest = dir > 0 ? Math.min(...linkedPlaced.map((p) => p.column)) : Math.max(...linkedPlaced.map((p) => p.column));
      return nearest(linkedPlaced.filter((p) => p.column === closest));
    }
    const ci = placedCols.indexOf(here.column) + dir;
    return ci >= 0 && ci < placedCols.length ? nearest(this.inColumn(placedCols[ci])) : undefined;
  }

  /* ---------- Keyboard ---------- */

  private onGridKey = (e: KeyboardEvent) => {
    const cell = (e.target as Element).closest<HTMLElement>("[data-lng-node]");
    if (!cell || e.altKey || e.metaKey) return;
    const id = cell.dataset.id!;
    const here = this.layout.nodes.get(id);
    if (!here) return;
    const col = this.inColumn(here.column);
    const at = col.findIndex((p) => p.id === id);
    const placedCols = [...new Set([...this.layout.nodes.values()].map((p) => p.column))].sort((a, b) => a - b);
    let to: string | undefined;
    if (e.key === "ArrowDown") to = col[at + 1]?.id;
    else if (e.key === "ArrowUp") to = col[at - 1]?.id;
    else if (e.key === "ArrowRight") to = this.across(id, 1);
    else if (e.key === "ArrowLeft") to = this.across(id, -1);
    else if (e.key === "Home") to = e.ctrlKey ? this.inColumn(placedCols[0])[0]?.id : col[0]?.id;
    else if (e.key === "End") to = e.ctrlKey ? this.inColumn(placedCols[placedCols.length - 1]).at(-1)?.id : col.at(-1)?.id;
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.select(this.selected === id ? null : id);
      return;
    } else if (e.key === "Escape" && this.selected !== null) {
      e.preventDefault();
      this.select(null);
      return;
    } else return;
    e.preventDefault();
    this.moveTo(to ?? id);
  };

  private onChainKey = (e: KeyboardEvent) => {
    const row = (e.target as Element).closest<HTMLElement>("[data-lng-node]");
    if (!row || e.altKey || e.ctrlKey || e.metaKey) return;
    const list = this.chain;
    const i = list.findIndex((n) => n.id === row.dataset.id);
    let to: LineageNode | undefined;
    if (e.key === "ArrowDown") to = list[i + 1];
    else if (e.key === "ArrowUp") to = list[i - 1];
    else if (e.key === "Home") to = list[0];
    else if (e.key === "End") to = list.at(-1);
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.select(this.selected === list[i].id ? null : list[i].id);
      return;
    } else if (e.key === "Escape" && this.selected !== null) {
      e.preventDefault();
      this.select(null);
      return;
    } else return;
    e.preventDefault();
    this.moveTo(to?.id ?? list[i].id);
  };

  private onTabKey = (e: KeyboardEvent) => {
    const views: LineageView[] = ["graph", "chain"];
    const at = views.indexOf(this.view);
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") next = (at + 1) % 2;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = 1;
    if (next < 0) return;
    e.preventDefault();
    this.pickView(views[next], true);
  };

  private onRecordKey = (e: KeyboardEvent) => {
    if (e.key !== "Escape" || this.selected === null) return;
    e.preventDefault();
    const id = this.selected;
    this.select(null);
    if (this.selected === null) this.moveTo(id);
  };

  /** A link in the record: go to that node – its record opens and the keyboard lands on it */
  private follow(id: string) {
    this.select(id);
    this.moveTo(id);
  }

  /* ---------- Update ---------- */

  protected override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (!this.hasAttribute("aria-label") && !this.hasAttribute("aria-labelledby")) this.setAttribute("aria-labelledby", `${this.uid}-title`);
    if (this.focusNode) {
      const el = this.querySelector<HTMLElement>(`[data-lng-node][data-id="${CSS.escape(this.focusNode)}"]`);
      this.focusNode = null;
      if (el) {
        el.focus();
        el.scrollIntoView?.({ block: "nearest", inline: "nearest" });
      }
    }
    // A record opened from outside (or from a link): the graph scrolls sideways to its node
    if ((changed.has("selected") || changed.has("view")) && this.selected) this.reveal(this.selected);
  }

  /** Scrolls the graph sideways, not the page, until a node is in view */
  private reveal(id: string) {
    const sc = this.querySelector<HTMLElement>(".ui-lng__scroll");
    const el = sc?.querySelector<HTMLElement>(`[data-lng-node][data-id="${CSS.escape(id)}"]`);
    if (!sc || !el) return;
    const box = sc.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    if (r.left >= box.left && r.right <= box.right) return;
    sc.scrollLeft += r.left - box.left - (box.width - r.width) / 2;
  }

  /* ---------- Render ---------- */

  /** What screen readers hear for a node: what it is, where it sits, what it came from and feeds */
  private spoken(n: LineageNode) {
    const from = (this.into.get(n.id) ?? []).map((f) => `${this.byId.get(f)!.label}${this.edge(f, n.id)?.weak ? ` (weak link: ${this.edge(f, n.id)?.note ?? this.weakLabel})` : ""}`);
    const feeds = (this.outOf.get(n.id) ?? []).map((t) => this.byId.get(t)!.label);
    return `${this.columnLabel(n)}${n.detail ? `, ${n.detail}` : ""}.${from.length ? ` From ${names(from)}.` : ""}${feeds.length ? ` Feeds ${names(feeds)}.` : ""}`;
  }

  private renderGraph(tabbable: string | undefined, lit: { up: Set<string>; down: Set<string>; id: string } | null) {
    const L = this.layout;
    const rows = Math.max(0, ...[...L.nodes.values()].map((p) => p.row + 1));
    const nodes = [...L.nodes.values()];
    const inLineage = (id: string) => !lit || id === lit.id || lit.up.has(id) || lit.down.has(id);
    const edgeLit = (e: PlacedEdge) => !!lit && (((e.from === lit.id || lit.up.has(e.from)) && (e.to === lit.id || lit.up.has(e.to))) || ((e.from === lit.id || lit.down.has(e.from)) && (e.to === lit.id || lit.down.has(e.to))));
    return html`<div class="ui-lng__scroll">
      <div
        class="ui-lng__canvas"
        role="grid"
        aria-labelledby=${`${this.uid}-title`}
        aria-rowcount=${rows + 1}
        aria-colcount=${L.columns.length}
        style=${styleMap({ width: `${L.width}px`, height: `${L.height + HEAD_H}px` })}
        @keydown=${this.onGridKey}
      >
        <div class="ui-lng__heads" role="row" aria-rowindex="1">
          ${L.columns.map(
            ({ col, x, count }, i) => html`<div class="ui-lng__head" role="columnheader" aria-colindex=${i + 1} style=${styleMap({ left: `${x}px`, width: `${this.geometry.node}px` })}>
              <span class="ui-lng__head-label">${col.label}</span><span class="ui-lng__head-count" aria-hidden="true">${count}</span>
            </div>`,
          )}
        </div>
        <svg class="ui-lng__edges" width=${L.width} height=${L.height} style=${styleMap({ top: `${HEAD_H}px` })} aria-hidden="true">
          ${repeat(
            L.edges,
            (e) => `${e.from}>${e.to}`,
            (e) => svg`<path class="ui-lng__edge" d=${e.path} ?data-weak=${e.weak} ?data-lit=${edgeLit(e)} ?data-dim=${!!lit && !edgeLit(e)}></path>`,
          )}
        </svg>
        ${Array.from({ length: rows }, (_, r) => {
          const cells = nodes.filter((p) => p.row === r).sort((a, b) => a.column - b.column);
          return html`<div class="ui-lng__row" role="row" aria-rowindex=${r + 2}>
            ${repeat(
              cells,
              (p) => p.id,
              (p) => {
                const n = this.byId.get(p.id)!;
                const ci = L.columns.findIndex((c) => c.col.id === n.column);
                const open = this.selected === n.id;
                return html`<div
                  class="ui-lng__node"
                  role="gridcell"
                  data-lng-node=""
                  data-id=${n.id}
                  data-tone=${this.toneOf(n)}
                  aria-colindex=${ci + 1}
                  aria-selected=${open ? "true" : "false"}
                  tabindex=${n.id === tabbable ? "0" : "-1"}
                  title=${n.detail ? `${n.label}\n${n.detail}` : n.label}
                  ?data-dim=${!inLineage(n.id)}
                  ?data-lit=${!!lit && lit.id === n.id}
                  style=${styleMap({ left: `${p.x}px`, top: `${p.y + HEAD_H}px`, width: `${p.width}px`, height: `${p.height}px` })}
                  @click=${() => {
                    this.cursor = n.id;
                    this.select(open ? null : n.id);
                  }}
                  @focus=${() => (this.cursor = n.id)}
                  @pointerenter=${(e: PointerEvent) => e.pointerType === "mouse" && (this.hover = n.id)}
                  @pointerleave=${() => this.hover === n.id && (this.hover = null)}
                >
                  <span class="ui-lng__dot" aria-hidden="true"></span>
                  <span class="ui-lng__label">${n.label}</span>
                  ${n.detail ? html`<span class="ui-lng__detail" aria-hidden="true">${n.detail}</span>` : nothing}
                  <span class="ui-lng__sr">, ${this.spoken(n)}</span>
                </div>`;
              },
            )}
          </div>`;
        })}
      </div>
    </div>`;
  }

  private renderChain(tabbable: string | undefined, lit: { up: Set<string>; down: Set<string>; id: string } | null) {
    const list = this.chain;
    return html`<ol class="ui-lng__chain" role="listbox" aria-labelledby=${`${this.uid}-title`} @keydown=${this.onChainKey}>
      ${repeat(
        list,
        (n) => n.id,
        (n, i) => {
          const from = this.into.get(n.id) ?? [];
          const weak = from.filter((f) => this.edge(f, n.id)?.weak);
          const open = this.selected === n.id;
          return html`<li
            class="ui-lng__event"
            role="option"
            data-lng-node=""
            data-id=${n.id}
            data-tone=${this.toneOf(n)}
            aria-selected=${open ? "true" : "false"}
            tabindex=${n.id === tabbable ? "0" : "-1"}
            ?data-lit=${!!lit && (n.id === lit.id || lit.up.has(n.id) || lit.down.has(n.id))}
            @click=${() => {
              this.cursor = n.id;
              this.select(open ? null : n.id);
            }}
            @focus=${() => (this.cursor = n.id)}
            @pointerenter=${(e: PointerEvent) => e.pointerType === "mouse" && (this.hover = n.id)}
            @pointerleave=${() => this.hover === n.id && (this.hover = null)}
          >
            <span class="ui-lng__time" aria-hidden="true">${n.at === undefined ? "" : n.at ? `+${duration(n.at)}` : "0s"}</span>
            <span class="ui-lng__marker" aria-hidden="true"><span class="ui-lng__dot"></span>${i < list.length - 1 ? html`<span class="ui-lng__rail"></span>` : nothing}</span>
            <span class="ui-lng__event-main">
              <span class="ui-lng__kind" aria-hidden="true">${this.columnLabel(n)}</span>
              <span class="ui-lng__label">${n.label}</span>
              ${n.detail ? html`<span class="ui-lng__detail" aria-hidden="true">${n.detail}</span>` : nothing}
              ${from.length
                ? html`<span class="ui-lng__from" aria-hidden="true">${fromIcon}${names(from.map((f) => this.byId.get(f)!.label))}${weak.length
                    ? html`<span class="ui-lng__weak">${this.weakLabel}</span>`
                    : nothing}</span>`
                : nothing}
              <span class="ui-lng__sr">, ${n.at !== undefined ? `at ${n.at ? duration(n.at) : "the start"}, ` : ""}${this.spoken(n)}</span>
            </span>
          </li>`;
        },
      )}
    </ol>`;
  }

  private renderLinks(n: LineageNode, dir: "from" | "to") {
    const ids = (dir === "from" ? this.into : this.outOf).get(n.id) ?? [];
    if (!ids.length) return nothing;
    const titleId = `${this.uid}-${dir}`;
    return html`<div class="ui-lng__links">
      <h5 class="ui-lng__caption" id=${titleId}>${dir === "from" ? "Came from" : "Feeds"}</h5>
      <ul aria-labelledby=${titleId}>
        ${repeat(
          ids,
          (id) => id,
          (id) => {
            const other = this.byId.get(id)!;
            const e = dir === "from" ? this.edge(id, n.id) : this.edge(n.id, id);
            return html`<li>
              <button type="button" class="ui-lng__link" data-tone=${this.toneOf(other)} ?data-weak=${!!e?.weak} @click=${() => this.follow(id)}>
                ${dir === "from" ? fromIcon : toIcon}
                <span class="ui-lng__link-text"><span class="ui-lng__link-label">${other.label}</span><span class="ui-lng__link-kind">${this.columnLabel(other)}</span></span>
                ${e?.weak ? html`<span class="ui-lng__weak"><span class="ui-lng__sr">, weak link: </span>${e.note ?? this.weakLabel}</span>` : nothing}
              </button>
            </li>`;
          },
        )}
      </ul>
    </div>`;
  }

  private renderRecord() {
    const n = this.selected === null ? undefined : this.byId.get(this.selected);
    if (!n) return nothing;
    const titleId = `${this.uid}-record`;
    return html`<section class="ui-lng__record" aria-labelledby=${titleId} @keydown=${this.onRecordKey}>
      <div class="ui-lng__record-head">
        <span class="ui-lng__pill" data-tone=${this.columns.find((c) => c.id === n.column)?.tone ?? "neutral"}>${this.columnLabel(n)}</span>
        ${n.at !== undefined ? html`<span class="ui-lng__record-at">${n.at ? `+${duration(n.at)}` : "Start of the run"}</span>` : nothing}
        <button type="button" class="ui-lng__close" aria-label="Close record" @click=${() => {
          const id = n.id;
          this.select(null);
          if (this.selected === null) this.moveTo(id);
        }}>${closeIcon}</button>
      </div>
      <h4 class="ui-lng__record-title" id=${titleId}>${n.label}</h4>
      ${n.detail ? html`<p class="ui-lng__record-detail">${n.detail}</p>` : nothing}
      ${n.text ? html`<blockquote class="ui-lng__quote">${n.text}</blockquote>` : nothing}
      ${n.fields?.length
        ? html`<dl class="ui-lng__fields">
            ${n.fields.map((f) => html`<div class="ui-lng__field"><dt>${f.label}</dt><dd>${f.value}</dd></div>`)}
          </dl>`
        : nothing}
      <div class="ui-lng__record-links">${this.renderLinks(n, "from")}${this.renderLinks(n, "to")}</div>
    </section>`;
  }

  protected override render() {
    const count = this.byId.size;
    const weak = this.layout.edges.filter((e) => e.weak).length;
    const view = this.view === "chain" ? "chain" : "graph";
    const activeId = this.active;
    const lit = activeId && this.byId.has(activeId) ? { id: activeId, up: walk(activeId, this.into), down: walk(activeId, this.outOf) } : null;
    // One node takes Tab: the one the keyboard was on, else the open one, else the first in the view
    const first = view === "chain" ? this.chain[0]?.id : [...this.layout.nodes.values()].sort((a, b) => a.column - b.column || a.row - b.row)[0]?.id;
    const tabbable = this.cursor ?? this.selected ?? first;
    const titleId = `${this.uid}-title`;
    return html`
      <div class="ui-lng__bar">
        <span class="ui-lng__mark">${lineageMark}</span>
        <span class="ui-lng__title" id=${titleId}>${this.heading}</span>
        <span class="ui-lng__sum">
          <span><b>${count}</b> ${count === 1 ? "step" : "steps"}</span>
          ${weak ? html`<span class="ui-lng__sum-weak"><b>${weak}</b> weak ${weak === 1 ? "link" : "links"}</span>` : nothing}
        </span>
        ${count
          ? html`<div class="ui-lng__tabs" role="tablist" aria-label="View" @keydown=${this.onTabKey}>
              ${(["graph", "chain"] as const).map(
                (v) => html`<button
                  type="button"
                  role="tab"
                  class="ui-lng__tab"
                  id=${`${this.uid}-tab-${v}`}
                  aria-selected=${v === view ? "true" : "false"}
                  aria-controls=${`${this.uid}-panel`}
                  tabindex=${v === view ? 0 : -1}
                  @click=${() => this.pickView(v)}
                >${VIEWS[v]}</button>`,
              )}
            </div>`
          : nothing}
      </div>
      <div class="ui-lng__card">
        ${count
          ? html`<div
                class="ui-lng__panel"
                role="tabpanel"
                id=${`${this.uid}-panel`}
                aria-labelledby=${`${this.uid}-tab-${view}`}
                @focusin=${() => (this.focused = true)}
                @focusout=${(e: FocusEvent) => {
                  if (!(e.currentTarget as Element).contains(e.relatedTarget as Node | null)) this.focused = false;
                }}
              >
                ${view === "graph" ? this.renderGraph(tabbable, lit) : this.renderChain(tabbable, lit)}
              </div>
              ${view === "graph"
                ? html`<div class="ui-lng__legend" aria-hidden="true">
                    <span><svg viewBox="0 0 22 8">${svg`<path d="M1 4H21" class="ui-lng__legend-line"></path>`}</svg>Link</span>
                    <span><svg viewBox="0 0 22 8">${svg`<path d="M1 4H21" class="ui-lng__legend-line" data-weak=""></path>`}</svg>${this.weakLabel}</span>
                    <span><svg viewBox="0 0 22 8">${svg`<path d="M1 4H21" class="ui-lng__legend-line" data-lit=""></path>`}</svg>Lineage of the focused step</span>
                  </div>`
                : nothing}
              ${this.renderRecord()}`
          : html`<p class="ui-lng__empty">${this.emptyText}</p>`}
      </div>
    `;
  }

  static override css = /* css */ `
/* Colours and sizes as variables – override them on [data-ui="lng"] */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="lng"] {
  /* Three layers: the gray tray, the white panel on it and the nodes on the panel */
  --tc-lineage-graph-tray-bg: var(--tc-surface-tray);
  --tc-lineage-graph-panel-bg: var(--tc-surface-on-tray);
  --tc-lineage-graph-node-bg: var(--tc-surface-raised);
  --tc-lineage-graph-edge: var(--tc-border-strong);
  --tc-lineage-graph-edge-lit: var(--tc-accent-text);
  position: relative;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-lineage-graph-tray-bg);
  container: ui-lng / inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-lg);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  letter-spacing: -0.006em;
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="lng"] {
  --tc-lineage-graph-panel-bg: var(--tc-surface-raised);
  --tc-lineage-graph-node-bg: var(--tc-surface-raised);
  --tc-lineage-graph-edge: var(--tc-border-strong);
  --tc-lineage-graph-edge-lit: var(--tc-accent-text);
  position: relative;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  container: ui-lng / inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="lng"] *, [data-ui="lng"] *::before, [data-ui="lng"] *::after { box-sizing: border-box; }
:where([data-ui="lng"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; letter-spacing: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-ui="lng"]) :is(h4, h5, p, ol, ul, dl, dd, blockquote) { margin: 0; padding: 0; }
:where([data-ui="lng"]) :is(ol, ul) { list-style: none; }
[data-ui="lng"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="lng"] svg { display: block; flex: none; overflow: visible; }
.ui-lng__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-lng__glyph { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="standard"], [data-look="standard"] *).ui-lng__glyph { stroke-width: 1.8; }
:where([data-look="clean"], [data-look="clean"] *).ui-lng__glyph { stroke-width: 1.4; }
/* Tones: the mark of a node and the pill of its column */
[data-ui="lng"] [data-tone] { --tc-lineage-graph-tone: var(--tc-text-muted); --tc-lineage-graph-tone-fg: var(--tc-text-secondary); --tc-lineage-graph-tone-bg: var(--tc-fill-default); }
[data-ui="lng"] [data-tone="blue"] { --tc-lineage-graph-tone: var(--tc-status-info-solid); --tc-lineage-graph-tone-fg: var(--tc-status-info-fg); --tc-lineage-graph-tone-bg: var(--tc-status-info-bg); }
[data-ui="lng"] [data-tone="green"] { --tc-lineage-graph-tone: var(--tc-status-success-solid); --tc-lineage-graph-tone-fg: var(--tc-status-success-fg); --tc-lineage-graph-tone-bg: var(--tc-status-success-bg); }
[data-ui="lng"] [data-tone="teal"] { --tc-lineage-graph-tone: var(--tc-tone-teal-solid); --tc-lineage-graph-tone-fg: var(--tc-tone-teal-fg); --tc-lineage-graph-tone-bg: var(--tc-tone-teal-bg); }
[data-ui="lng"] [data-tone="violet"] { --tc-lineage-graph-tone: var(--tc-tone-violet-solid); --tc-lineage-graph-tone-fg: var(--tc-tone-violet-fg); --tc-lineage-graph-tone-bg: var(--tc-tone-violet-bg); }
[data-ui="lng"] [data-tone="amber"] { --tc-lineage-graph-tone: var(--tc-tone-amber-solid); --tc-lineage-graph-tone-fg: var(--tc-tone-amber-fg); --tc-lineage-graph-tone-bg: var(--tc-tone-amber-bg); }
[data-ui="lng"] [data-tone="pink"] { --tc-lineage-graph-tone: var(--tc-tone-pink-solid); --tc-lineage-graph-tone-fg: var(--tc-tone-pink-fg); --tc-lineage-graph-tone-bg: var(--tc-tone-pink-bg); }
[data-ui="lng"] [data-tone="rose"] { --tc-lineage-graph-tone: var(--tc-tone-rose-solid); --tc-lineage-graph-tone-fg: var(--tc-tone-rose-fg); --tc-lineage-graph-tone-bg: var(--tc-tone-rose-bg); }
/* ----- The bar: the heading, how many steps and weak links, the view ----- */
.ui-lng__bar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-2); min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-lng__bar { padding: var(--tc-space-1-5) var(--tc-space-1-5) var(--tc-space-2) var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-lng__bar { margin-bottom: var(--tc-space-3); }
.ui-lng__mark { display: grid; flex: none; place-items: center; width: 16px; color: var(--tc-accent-text); }
.ui-lng__mark-svg { width: 16px; height: 16px; fill: currentColor; stroke: currentColor; stroke-width: 1.3; stroke-linecap: round; }
.ui-lng__title { flex: none; color: var(--tc-text-strong); }
:where([data-look="standard"], [data-look="standard"] *).ui-lng__title { font-weight: var(--tc-font-weight-semibold); }
:where([data-look="clean"], [data-look="clean"] *).ui-lng__title { font-weight: var(--tc-font-weight-medium); }
.ui-lng__sum { display: flex; align-items: center; gap: var(--tc-space-3); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-lng__sum { font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-snug); }
:where([data-look="clean"], [data-look="clean"] *).ui-lng__sum { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
.ui-lng__sum b { color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-lng__sum b { font-weight: var(--tc-font-weight-semibold); }
:where([data-look="clean"], [data-look="clean"] *).ui-lng__sum b { font-weight: var(--tc-font-weight-medium); }
.ui-lng__sum-weak, .ui-lng__sum-weak b { color: var(--tc-status-warning-fg); }
/* The view: run-compare's tabs */
.ui-lng__tabs { display: flex; flex: none; margin-left: auto; padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
.ui-lng__tab { display: inline-flex; align-items: center; height: calc(var(--tc-control-h-md) - 2 * var(--tc-seg-pad)); padding: 0 var(--tc-space-2-5); border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-text-secondary); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-lng__tab { padding: 0 var(--tc-space-2); }
[data-ui="lng"] .ui-lng__tab:hover { color: var(--tc-text-primary); }
[data-ui="lng"] .ui-lng__tab[aria-selected="true"] { background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow); color: var(--tc-text-primary); }
/* ----- The white card ----- */
.ui-lng__card { position: relative; overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-lineage-graph-panel-bg); box-shadow: var(--tc-card-shadow); }
.ui-lng__empty { padding: var(--tc-space-8) var(--tc-space-4); color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); text-align: center; }
/* ----- The graph: columns of nodes, curved links behind them; it scrolls sideways when it's wider than the card ----- */
.ui-lng__scroll { overflow-x: auto; overscroll-behavior-x: contain; scrollbar-width: thin; }
:where([data-look="standard"], [data-look="standard"] *).ui-lng__scroll { padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-lng__scroll { padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-3-5); }
.ui-lng__canvas { position: relative; flex: none; }
.ui-lng__heads, .ui-lng__row { display: block; height: 0; }
.ui-lng__head { position: absolute; top: 0; display: flex; align-items: baseline; gap: var(--tc-space-1-5); min-width: 0; padding: 0 var(--tc-space-0-5); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); white-space: nowrap; }
.ui-lng__head-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.ui-lng__head-count { color: var(--tc-text-disabled); font-variant-numeric: tabular-nums; }
.ui-lng__edges { position: absolute; left: 0; pointer-events: none; }
.ui-lng__edge { fill: none; stroke: var(--tc-lineage-graph-edge); stroke-width: 1.25; transition: stroke var(--tc-duration-base) var(--tc-ease-standard), opacity var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-lng__edge { stroke-width: 1; }
.ui-lng__edge[data-weak] { stroke-dasharray: 4 3; }
.ui-lng__edge[data-lit] { stroke: var(--tc-lineage-graph-edge-lit); stroke-width: 1.75; }
.ui-lng__edge[data-dim] { opacity: 0.35; }
/* A node: a small card with its column's mark, the label and a quieter detail */
.ui-lng__node {
  position: absolute;
  display: grid;
  grid-template-columns: 8px minmax(0, 1fr);
  grid-template-rows: auto auto;
  align-content: center;
  column-gap: var(--tc-space-2);
  padding: 0 var(--tc-space-2-5);
  background: var(--tc-lineage-graph-node-bg);
  box-shadow: var(--tc-shadow-raised);
  outline: none;
  cursor: pointer;
  transition: opacity var(--tc-duration-base) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-lng__node { border-radius: var(--tc-radius-lg); }
:where([data-look="clean"], [data-look="clean"] *).ui-lng__node { border-radius: var(--tc-radius-md); }
.ui-lng__node:hover { box-shadow: var(--tc-shadow-raised-hover); }
.ui-lng__node[data-dim] { opacity: 0.42; }
.ui-lng__node[data-lit] { box-shadow: var(--tc-shadow-raised-hover); }
.ui-lng__node[aria-selected="true"] { background: var(--tc-fill-selected); box-shadow: inset 0 0 0 1.5px var(--tc-border-selected); }
.ui-lng__node:focus-visible { box-shadow: 0 0 0 var(--tc-focus-ring-width) var(--tc-focus-ring); }
@media (forced-colors: active) {
  .ui-lng__node { border: 1px solid CanvasText; }
  .ui-lng__node[aria-selected="true"] { border: 2px solid Highlight; }
  .ui-lng__node:focus-visible, .ui-lng__event:focus-visible { outline: 2px solid Highlight; outline-offset: 2px; }
  .ui-lng__edge { stroke: CanvasText; }
  .ui-lng__edge[data-lit] { stroke: Highlight; }
}
.ui-lng__dot { grid-row: 1 / -1; align-self: center; width: 8px; height: 8px; border-radius: 50%; background: var(--tc-lineage-graph-tone); }
.ui-lng__node .ui-lng__label { overflow: hidden; color: var(--tc-text-primary); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-snug); text-overflow: ellipsis; white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-lng__label { font-weight: var(--tc-font-weight-medium); }
:where([data-look="clean"], [data-look="clean"] *).ui-lng__label { font-weight: var(--tc-font-weight-medium); }
.ui-lng__node .ui-lng__detail { overflow: hidden; color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); text-overflow: ellipsis; white-space: nowrap; }
/* What the lines mean */
.ui-lng__legend { display: flex; flex-wrap: wrap; gap: var(--tc-space-1) var(--tc-space-4); padding: 0 var(--tc-space-4) var(--tc-space-3); color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
.ui-lng__legend span { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); }
.ui-lng__legend svg { width: 22px; height: 8px; }
.ui-lng__legend-line { fill: none; stroke: var(--tc-lineage-graph-edge); stroke-width: 1.5; }
.ui-lng__legend-line[data-weak] { stroke-dasharray: 4 3; }
.ui-lng__legend-line[data-lit] { stroke: var(--tc-lineage-graph-edge-lit); stroke-width: 2; }
/* ----- The event chain: the same nodes in the order they happened ----- */
.ui-lng__chain { display: grid; padding: var(--tc-space-1-5); }
.ui-lng__event {
  position: relative;
  display: grid;
  grid-template-columns: 44px 10px minmax(0, 1fr);
  align-items: start;
  column-gap: var(--tc-space-3);
  padding: var(--tc-space-2) var(--tc-space-2-5);
  outline: none;
  cursor: pointer;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-base) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-lng__event { border-radius: var(--tc-radius-lg); }
:where([data-look="clean"], [data-look="clean"] *).ui-lng__event { border-radius: var(--tc-radius-sm); }
.ui-lng__event:hover { background: var(--tc-fill-subtle); }
/* In the lineage of the focused step: its mark gets a ring – the text keeps its contrast */
.ui-lng__event[data-lit] .ui-lng__dot { box-shadow: 0 0 0 2px var(--tc-lineage-graph-panel-bg), 0 0 0 3.5px var(--tc-lineage-graph-tone); }
.ui-lng__event[aria-selected="true"] :is(.ui-lng__time, .ui-lng__from, .ui-lng__detail) { color: var(--tc-text-secondary); }
.ui-lng__event[aria-selected="true"], .ui-lng__event[aria-selected="true"]:hover { background: var(--tc-fill-selected); box-shadow: inset var(--tc-focus-ring-width) 0 0 var(--tc-border-selected); }
.ui-lng__event:focus-visible { box-shadow: inset 0 0 0 var(--tc-focus-ring-width) var(--tc-focus-ring); }
.ui-lng__time { padding-top: var(--tc-space-0-5); color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); font-variant-numeric: tabular-nums; text-align: right; white-space: nowrap; }
.ui-lng__marker { position: relative; display: grid; justify-items: center; align-self: stretch; padding-top: var(--tc-space-1-5); }
.ui-lng__marker .ui-lng__dot { position: relative; z-index: 1; box-shadow: 0 0 0 3px var(--tc-lineage-graph-panel-bg); }
.ui-lng__rail { position: absolute; top: var(--tc-space-4); bottom: calc(-1 * var(--tc-space-3)); left: calc(50% - 0.5px); width: 1px; background: var(--tc-border-default); }
.ui-lng__event-main { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-lng__kind { color: var(--tc-lineage-graph-tone-fg); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); }
.ui-lng__event .ui-lng__label { color: var(--tc-text-primary); overflow-wrap: anywhere; }
.ui-lng__event .ui-lng__detail { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); overflow-wrap: anywhere; }
.ui-lng__from { display: block; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); overflow-wrap: anywhere; }
.ui-lng__from .ui-lng__glyph { display: inline-block; width: 12px; height: 12px; margin-right: var(--tc-space-1); vertical-align: -1px; color: var(--tc-icon-muted); }
.ui-lng__from .ui-lng__weak { margin-left: var(--tc-space-1-5); vertical-align: 1px; }
/* A weak link: an amber tag wherever it's named */
.ui-lng__weak { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; }
/* ----- The record: what the node is, its fields, what it came from and feeds ----- */
.ui-lng__record { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-3-5) var(--tc-space-4) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); animation: ui-lng-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-lng__record-head { display: flex; align-items: center; gap: var(--tc-space-2); min-height: var(--tc-control-h-sm); }
.ui-lng__pill { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-lineage-graph-tone-bg); color: var(--tc-lineage-graph-tone-fg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; }
.ui-lng__record-at { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; }
.ui-lng__close { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); margin-left: auto; border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-lng__close:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-lng__record-title { color: var(--tc-text-strong); font-size: var(--tc-font-size-lg-plus); line-height: var(--tc-line-height-relaxed); overflow-wrap: anywhere; }
:where([data-look="standard"], [data-look="standard"] *).ui-lng__record-title { font-weight: var(--tc-font-weight-semibold); }
:where([data-look="clean"], [data-look="clean"] *).ui-lng__record-title { font-weight: var(--tc-font-weight-medium); }
.ui-lng__record-detail { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-lng__quote { padding: var(--tc-space-2) var(--tc-space-3); border-left: 2px solid var(--tc-lineage-graph-tone, var(--tc-border-strong)); border-radius: var(--tc-radius-xs); background: var(--tc-surface-well); color: var(--tc-text-secondary); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); overflow-wrap: anywhere; }
.ui-lng__fields { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: var(--tc-space-2) var(--tc-space-4); }
.ui-lng__field { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-lng__field dt { color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); }
.ui-lng__field dd { overflow: hidden; color: var(--tc-text-primary); font-size: var(--tc-font-size-md); font-variant-numeric: tabular-nums; text-overflow: ellipsis; white-space: nowrap; }
.ui-lng__record-links { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--tc-space-4); margin-top: var(--tc-space-1); }
.ui-lng__links { display: grid; align-content: start; gap: var(--tc-space-1); min-width: 0; }
.ui-lng__caption { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-lng__links ul { display: grid; gap: var(--tc-space-0-5); }
.ui-lng__link { display: flex; align-items: center; gap: var(--tc-space-2); width: 100%; min-height: var(--tc-control-h-md); padding: var(--tc-space-1) var(--tc-space-2); border-radius: var(--tc-control-radius-sm); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-lng__link:hover { background: var(--tc-fill-subtle); }
.ui-lng__link > .ui-lng__glyph { width: 12px; height: 12px; color: var(--tc-lineage-graph-tone); }
.ui-lng__link-text { display: grid; flex: 1; min-width: 0; }
.ui-lng__link-label { overflow: hidden; color: var(--tc-text-primary); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-snug); text-overflow: ellipsis; white-space: nowrap; }
.ui-lng__link-kind { color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); }
@keyframes ui-lng-in { from { opacity: 0; transform: translateY(3px); } }
/* Touch screens: bigger targets */
@media (pointer: coarse) {
  .ui-lng__tab { height: var(--tc-control-h-md); }
}
/* Narrow: the view takes its own line, the record's links stack */
@container ui-lng (max-width: 480px) {
  .ui-lng__tabs { flex: 1 1 100%; margin-left: 0; }
  .ui-lng__tab { flex: 1; justify-content: center; }
  .ui-lng__record-links { grid-template-columns: minmax(0, 1fr); gap: var(--tc-space-3); }
  .ui-lng__event { grid-template-columns: 36px 10px minmax(0, 1fr); column-gap: var(--tc-space-2-5); padding-inline: var(--tc-space-1-5); }
  .ui-lng__record { padding-inline: var(--tc-space-3-5); }
  .ui-lng__scroll { padding-inline: var(--tc-space-3); }
  .ui-lng__legend { padding-inline: var(--tc-space-3); }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="lng"] *, [data-ui="lng"] *::before, [data-ui="lng"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-lineage-graph")) customElements.define("tc-lineage-graph", TcLineageGraph);

declare global {
  interface HTMLElementTagNameMap {
    "tc-lineage-graph": TcLineageGraph;
  }
}
