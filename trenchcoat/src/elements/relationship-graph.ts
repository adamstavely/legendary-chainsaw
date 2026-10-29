import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { initials } from "./internal/util";

/*
 * <tc-relationship-graph> – who is connected to whom, around one person or organisation: the one in focus in the
 * middle, their direct connections on a ring around them and, at depth 2, the connections' connections on an outer
 * ring. People are circles, organisations rounded squares; a line is a relationship ("employs", "co-author",
 * "funds"), thicker the stronger it is. The layout is fixed by the data – each ring sorted by kind then name, the
 * outer ring kept beside whoever it hangs off – so the same data always draws the same picture.
 *   · click a node, or press Enter on it in the list, to put it in the middle (`ego`, tc-ego-change); the nodes glide to
 *     their new places (not with reduced motion). Click a line to select the relationship
 *   · the panel beside the drawing names what's selected and lists its connections by relationship, with counts
 *   · the drawing is for the eye; the list of nodes is the way in for keyboards and screen readers – one tab stop,
 *     ↑ / ↓ / Home / End move through the rings in order (the drawing rings the one you're on), Enter centres it,
 *     Space selects it
 *   · depth (1 or 2) and the kinds shown (the legend's toggles) are properties with cancelable change events
 *   · it fits the width it's given (measured on the drawing's box, not the drawing)
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-relationship-graph .nodes=${[{ id: "a", label: "Dr. Ines Ko", kind: "person" }, { id: "u", label: "Northfield University", kind: "organisation" }]}
 *     .edges=${[{ from: "u", to: "a", label: "employs", weight: 4 }]}></tc-relationship-graph>
 */

export type RelationNode = { id: string; label: string; kind: "person" | "organisation" | string; subtitle?: string; avatar?: string };
export type RelationEdge = { id?: string; from: string; to: string; label?: string; weight?: number; since?: string };

/** Details of the events */
export type RelationEgoChange = { ego: string; node: RelationNode };
export type RelationDepthChange = { depth: 1 | 2 };
export type RelationKindsChange = { kinds: string[] };
/** `selected` is a node id, or an edge id prefixed "edge:" */
export type RelationSelectedChange = { selected: string | null; node: RelationNode | null; edge: RelationEdge | null };

let uidCount = 0;

/* waypoints: Lucide (ISC, lucide.dev) */
const graphIcon = svg`<circle cx="12" cy="4.5" r="2.5"></circle><path d="m10.2 6.3-3.9 3.9"></path><circle cx="4.5" cy="12" r="2.5"></circle><path d="M7 12h10"></path><circle cx="19.5" cy="12" r="2.5"></circle><path d="m13.8 17.7 3.9-3.9"></path><circle cx="12" cy="19.5" r="2.5"></circle>`;

const TONES = ["violet", "teal", "amber", "pink", "rose"];
/** An edge's id: its own, or one made from its ends and words */
export const relationEdgeId = (e: RelationEdge) => e.id ?? `${e.from}->${e.to}${e.label ? `:${e.label}` : ""}`;

type Placed = { node: RelationNode; ring: 0 | 1 | 2; x: number; y: number; angle: number };

/**
 * Connections between people and organisations around one of them – direct and second-hand rings, relationships drawn
 * by strength, re-centring on click, and a panel and keyboard list of the connections.
 * @tag tc-relationship-graph
 * @fires tc-ego-change - A node was put in the middle ({ ego, node }: RelationEgoChange); cancelable – prevented, `ego` stays as it was
 * @fires tc-depth-change - Depth 1 or 2 was chosen ({ depth }: RelationDepthChange); cancelable – prevented, `depth` stays as it was
 * @fires tc-kinds-change - A kind was shown or hidden from the legend ({ kinds }: RelationKindsChange); cancelable – prevented, `kinds` stays as it was
 * @fires tc-selected-change - A node or a relationship was selected, or nothing ({ selected, node, edge }: RelationSelectedChange); cancelable – prevented, `selected` stays as it was
 */
export class TcRelationshipGraph extends TcElement {
  static override ui = "rgr";

  /** The heading, and the graph's name */
  @property() accessor heading = "Relationships";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** People, organisations and anything else, each with a kind */
  @property({ attribute: false }) accessor nodes: RelationNode[] = [];
  /** The relationships between them */
  @property({ attribute: false }) accessor edges: RelationEdge[] = [];
  /** The node in the middle (the ego); by default the first person. Changed by the user unless tc-ego-change is prevented */
  @property() accessor ego: string | null = null;
  /** How far out to draw: 1 (direct connections) or 2 (theirs too). Changed by the user unless tc-depth-change is prevented */
  @property({ type: Number }) accessor depth: 1 | 2 = 1;
  /** The kinds shown; empty for all. Changed from the legend unless tc-kinds-change is prevented */
  @property({ attribute: false }) accessor kinds: string[] = [];
  /** What's selected: a node id, "edge:<edge id>", or null. Changed by the user unless tc-selected-change is prevented */
  @property() accessor selected: string | null = null;
  /** Names for the kinds in the legend: { organisation: "Organisation" } */
  @property({ attribute: false }) accessor kindLabels: Record<string, string> = {};

  @state() private accessor width = 560;
  @state() private accessor active = 0;
  @state() private accessor hovered: string | null = null;
  @state() private accessor announce = "";

  private uid = `tc-rgr-${++uidCount}`;
  private observer: ResizeObserver | undefined;
  private observed: HTMLElement | null = null;
  private frame = 0;

  override connectedCallback() {
    super.connectedCallback();
    this.observer = new ResizeObserver(() => {
      if (this.frame) return;
      this.frame = requestAnimationFrame(() => {
        this.frame = 0;
        const w = this.querySelector<HTMLElement>(".ui-rgr__stage")?.clientWidth ?? 0;
        if (w > 0 && Math.abs(w - this.width) > 0.5) this.width = w;
      });
    });
  }
  override disconnectedCallback() {
    super.disconnectedCallback();
    this.observer?.disconnect();
    this.observed = null;
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
  }
  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    const stage = this.querySelector<HTMLElement>(".ui-rgr__stage");
    if (stage && this.observer && stage !== this.observed) {
      if (this.observed) this.observer.unobserve(this.observed);
      this.observer.observe(stage);
      this.observed = stage;
    }
  }
  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("ego") || changed.has("nodes") || changed.has("depth") || changed.has("kinds")) this.active = 0;
    const n = this.layout.placed.length;
    if (this.active > n - 1) this.active = Math.max(0, n - 1);
  }

  /* ---------- The model ---------- */

  private get allKinds() {
    const out: string[] = [];
    for (const n of this.nodes) if (!out.includes(n.kind)) out.push(n.kind);
    // People first, then organisations, then the rest as they come
    return out.sort((a, b) => rank(a) - rank(b));
  }
  private kindLabel(k: string) {
    return this.kindLabels[k] ?? (k === "person" ? "Person" : k === "organisation" ? "Organisation" : k.charAt(0).toUpperCase() + k.slice(1));
  }
  private tone(k: string) {
    return TONES[Math.max(0, this.allKinds.indexOf(k)) % TONES.length];
  }
  private shownKind(k: string) {
    return !this.kinds.length || this.kinds.includes(k);
  }
  private nodeOf(id: string | null) {
    return id ? this.nodes.find((n) => n.id === id) : undefined;
  }
  /** The node in the middle: `ego`, or the first person, or the first node */
  get centre(): RelationNode | undefined {
    return this.nodeOf(this.ego) ?? this.nodes.find((n) => n.kind === "person") ?? this.nodes[0];
  }
  private neighbours(id: string) {
    const out = new Set<string>();
    for (const e of this.edges) {
      if (e.from === id) out.add(e.to);
      else if (e.to === id) out.add(e.from);
    }
    return out;
  }

  /** The rings and every placed node's position, worked out from the data alone */
  private get layout() {
    const centre = this.centre;
    const w = Math.max(240, this.width);
    const h = Math.round(Math.min(Math.max(w * 0.72, 300), 520));
    const cx = w / 2;
    const cy = h / 2;
    const placed: Placed[] = [];
    if (!centre) return { placed, w, h, cx, cy, r1: 0, r2: 0 };
    const byKindName = (a: RelationNode, b: RelationNode) => rank(a.kind) - rank(b.kind) || a.kind.localeCompare(b.kind) || a.label.localeCompare(b.label);
    const ring1 = [...this.neighbours(centre.id)]
      .map((id) => this.nodeOf(id))
      .filter((n): n is RelationNode => !!n && this.shownKind(n.kind))
      .sort(byKindName);
    const room = Math.min(w, h) / 2 - 34;
    const r1 = this.depth === 2 ? room * 0.48 : room * 0.78;
    const r2 = room * 0.95;
    placed.push({ node: centre, ring: 0, x: cx, y: cy, angle: 0 });
    ring1.forEach((n, i) => {
      const a = -Math.PI / 2 + (i / ring1.length) * Math.PI * 2;
      placed.push({ node: n, ring: 1, x: cx + r1 * Math.cos(a), y: cy + r1 * Math.sin(a), angle: a });
    });
    if (this.depth === 2) {
      const seen = new Set([centre.id, ...ring1.map((n) => n.id)]);
      // Each outer node hangs off the first inner node it knows, so it sits on that side
      const outer: { node: RelationNode; parent: number }[] = [];
      ring1.forEach((p, pi) => {
        const kids = [...this.neighbours(p.id)]
          .filter((id) => !seen.has(id))
          .map((id) => this.nodeOf(id))
          .filter((n): n is RelationNode => !!n && this.shownKind(n.kind))
          .sort(byKindName);
        for (const k of kids) {
          seen.add(k.id);
          outer.push({ node: k, parent: pi });
        }
      });
      outer.forEach((o, i) => {
        const a = -Math.PI / 2 + ((i + 0.5) / outer.length) * Math.PI * 2;
        placed.push({ node: o.node, ring: 2, x: cx + r2 * Math.cos(a), y: cy + r2 * Math.sin(a), angle: a });
      });
    }
    return { placed, w, h, cx, cy, r1, r2 };
  }

  /** The relationships drawn: between nodes that are both placed */
  private visibleEdges(placed: Placed[]) {
    const ids = new Set(placed.map((p) => p.node.id));
    return this.edges.filter((e) => ids.has(e.from) && ids.has(e.to));
  }

  /* ---------- Actions ---------- */

  private recentre(n: RelationNode) {
    if (n.id === this.centre?.id) return;
    if (!this.emit<RelationEgoChange>("tc-ego-change", { ego: n.id, node: n }, { cancelable: true })) return;
    this.ego = n.id;
    const count = this.neighbours(n.id).size;
    this.announce = `${n.label} in the middle, ${count} ${count === 1 ? "connection" : "connections"}`;
  }
  private select(value: string | null) {
    if (value === this.selected) return;
    const node = value && !value.startsWith("edge:") ? (this.nodeOf(value) ?? null) : null;
    const edge = value?.startsWith("edge:") ? (this.edges.find((e) => `edge:${relationEdgeId(e)}` === value) ?? null) : null;
    if (!this.emit<RelationSelectedChange>("tc-selected-change", { selected: value, node, edge }, { cancelable: true })) return;
    this.selected = value;
  }
  private setDepth(depth: 1 | 2) {
    if (depth === this.depth) return;
    if (!this.emit<RelationDepthChange>("tc-depth-change", { depth }, { cancelable: true })) return;
    this.depth = depth;
  }
  private toggleKind(k: string) {
    const all = this.allKinds;
    const shown = this.kinds.length ? this.kinds : all;
    let next = shown.includes(k) ? shown.filter((x) => x !== k) : [...shown, k];
    if (!next.length) return;
    if (next.length === all.length) next = [];
    if (!this.emit<RelationKindsChange>("tc-kinds-change", { kinds: next }, { cancelable: true })) return;
    this.kinds = next;
  }

  private onListKey = (e: KeyboardEvent) => {
    const placed = this.layout.placed;
    if (!placed.length) return;
    const go = (i: number) => {
      e.preventDefault();
      this.active = Math.max(0, Math.min(placed.length - 1, i));
      void this.updateComplete.then(() => this.querySelector(`#${this.uid}-n-${this.active}`)?.scrollIntoView({ block: "nearest" }));
    };
    if (e.key === "ArrowDown") go(this.active + 1);
    else if (e.key === "ArrowUp") go(this.active - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(placed.length - 1);
    else if (e.key === "Enter") {
      e.preventDefault();
      this.recentre(placed[this.active].node);
    } else if (e.key === " ") {
      e.preventDefault();
      const id = placed[this.active].node.id;
      this.select(this.selected === id ? null : id);
    }
  };

  /* ---------- Rendering ---------- */

  private shape(p: Placed, size: number) {
    const n = p.node;
    const isOrg = n.kind !== "person";
    const half = size / 2;
    return isOrg
      ? svg`<rect class="ui-rgr__shape" x=${-half} y=${-half} width=${size} height=${size} rx=${size * 0.28}></rect>`
      : svg`<circle class="ui-rgr__shape" r=${half}></circle>`;
  }

  private renderDrawing() {
    const { placed, w, h, cx, cy, r1, r2 } = this.layout;
    const pos = new Map(placed.map((p) => [p.node.id, p]));
    const edges = this.visibleEdges(placed);
    const activeId = placed[this.active]?.node.id;
    const lit = this.hovered ?? this.selected;
    const litEdges = new Set(
      lit && !lit.startsWith("edge:") ? edges.filter((e) => e.from === lit || e.to === lit).map((e) => relationEdgeId(e)) : lit ? [lit.slice(5)] : [],
    );
    return svg`<svg class="ui-rgr__svg" width=${w} height=${h} viewBox=${`0 0 ${w} ${h}`} aria-hidden="true">
      <circle class="ui-rgr__guide" cx=${cx} cy=${cy} r=${r1}></circle>
      ${this.depth === 2 ? svg`<circle class="ui-rgr__guide" cx=${cx} cy=${cy} r=${r2}></circle>` : nothing}
      <g class="ui-rgr__edges">
        ${edges.map((e) => {
          const a = pos.get(e.from)!;
          const b = pos.get(e.to)!;
          const id = relationEdgeId(e);
          const weight = Math.max(1, Math.min(5, Math.round(e.weight ?? 2)));
          return svg`<g class="ui-rgr__edge" data-weight=${weight} ?data-lit=${litEdges.has(id)} ?data-selected=${this.selected === `edge:${id}`}
              @click=${() => this.select(this.selected === `edge:${id}` ? null : `edge:${id}`)}>
            <line class="ui-rgr__hit" x1=${a.x} y1=${a.y} x2=${b.x} y2=${b.y}></line>
            <line class="ui-rgr__line" x1=${a.x} y1=${a.y} x2=${b.x} y2=${b.y}></line>
            ${litEdges.has(id) && e.label ? svg`<text class="ui-rgr__edge-label" x=${(a.x + b.x) / 2} y=${(a.y + b.y) / 2 - 4} text-anchor="middle">${e.label}</text>` : nothing}
          </g>`;
        })}
      </g>
      ${placed.map((p, i) => {
        const size = p.ring === 0 ? 52 : p.ring === 1 ? 38 : 30;
        const showLabel = p.ring < 2 || p.node.id === lit || p.node.id === activeId || p.node.id === this.hovered;
        const below = p.ring === 0 ? 1 : Math.sin(p.angle) >= -0.2;
        return svg`<g class="ui-rgr__node" data-id=${p.node.id} data-ring=${p.ring} data-tone=${this.tone(p.node.kind)}
            ?data-active=${i === this.active && this.listFocused} ?data-selected=${this.selected === p.node.id} ?data-lit=${p.node.id === lit}
            style=${`transform: translate(${p.x}px, ${p.y}px)`}
            @pointerenter=${() => (this.hovered = p.node.id)} @pointerleave=${() => (this.hovered = null)}
            @click=${() => {
              this.select(p.node.id);
              this.recentre(p.node);
            }}>
          ${this.shape(p, size)}
          ${i === this.active && this.listFocused ? svg`<circle class="ui-rgr__ring" r=${size / 2 + 6}></circle>` : nothing}
          <text class="ui-rgr__initials" text-anchor="middle" dominant-baseline="central">${initials(p.node.label)}</text>
          ${showLabel ? svg`<text class="ui-rgr__label" text-anchor="middle" y=${below ? size / 2 + 15 : -size / 2 - 8}>${p.node.label}</text>` : nothing}
        </g>`;
      })}
    </svg>`;
  }

  @state() private accessor listFocused = false;

  private renderPanel() {
    const sel = this.selected;
    const edge = sel?.startsWith("edge:") ? this.edges.find((e) => `edge:${relationEdgeId(e)}` === sel) : undefined;
    if (edge) {
      const a = this.nodeOf(edge.from);
      const b = this.nodeOf(edge.to);
      return html`<div class="ui-rgr__panel">
        <p class="ui-rgr__panel-kind">Relationship</p>
        <p class="ui-rgr__panel-name">${a?.label ?? edge.from} <span class="ui-rgr__verb">${edge.label ?? "connected to"}</span> ${b?.label ?? edge.to}</p>
        <dl class="ui-rgr__facts">
          ${edge.since ? html`<div><dt>Since</dt><dd>${edge.since}</dd></div>` : nothing}
          <div><dt>Strength</dt><dd>${Math.max(1, Math.min(5, Math.round(edge.weight ?? 2)))} of 5</dd></div>
        </dl>
      </div>`;
    }
    const node = this.nodeOf(sel) ?? this.centre;
    if (!node) return nothing;
    const groups = new Map<string, { other: RelationNode; edge: RelationEdge }[]>();
    for (const e of this.edges) {
      const otherId = e.from === node.id ? e.to : e.to === node.id ? e.from : null;
      const other = this.nodeOf(otherId);
      if (!other) continue;
      const k = e.label ?? "connected";
      groups.set(k, [...(groups.get(k) ?? []), { other, edge: e }]);
    }
    const total = [...groups.values()].reduce((n, g) => n + g.length, 0);
    return html`<div class="ui-rgr__panel">
      <p class="ui-rgr__panel-kind" data-tone=${this.tone(node.kind)}>${this.kindLabel(node.kind)}</p>
      <p class="ui-rgr__panel-name">${node.label}</p>
      ${node.subtitle ? html`<p class="ui-rgr__panel-sub">${node.subtitle}</p>` : nothing}
      <p class="ui-rgr__panel-count">${total} ${total === 1 ? "connection" : "connections"}</p>
      ${[...groups.entries()].map(
        ([label, list]) => html`<section class="ui-rgr__group">
          <h4 class="ui-rgr__group-name">${label.charAt(0).toUpperCase() + label.slice(1)} <span class="ui-rgr__group-count">${list.length}</span></h4>
          <ul class="ui-rgr__links">
            ${list.map(
              ({ other }) => html`<li>
                <button type="button" class="ui-rgr__link" @click=${() => this.recentre(other)}>
                  <span class="ui-rgr__swatch" data-tone=${this.tone(other.kind)} data-shape=${other.kind === "person" ? "round" : "square"} aria-hidden="true"></span>${other.label}<span class="tc-sr-only">, put in the middle</span>
                </button>
              </li>`,
            )}
          </ul>
        </section>`,
      )}
    </div>`;
  }

  protected override render() {
    const id = this.uid;
    const { placed } = this.layout;
    const kinds = this.allKinds;
    const empty = !this.nodes.length;
    const activeNode = placed[this.active];
    return html`
      <span class="tc-sr-only" role="status">${this.announce}</span>
      ${cardHead({
        icon: graphIcon,
        title: this.heading,
        subtitle: this.description,
        id: `${id}-title`,
        aside: empty
          ? nothing
          : html`<div class="ui-rgr__depth" role="radiogroup" aria-label="Depth">
              ${([1, 2] as const).map(
                (d) => html`<button
                  type="button"
                  role="radio"
                  class="ui-rgr__depth-opt"
                  aria-checked=${this.depth === d ? "true" : "false"}
                  tabindex=${this.depth === d ? 0 : -1}
                  @click=${() => this.setDepth(d)}
                  @keydown=${(e: KeyboardEvent) => {
                    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
                    e.preventDefault();
                    this.setDepth(this.depth === 1 ? 2 : 1);
                    void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-rgr__depth-opt[aria-checked='true']")?.focus());
                  }}
                >${d === 1 ? "Direct" : "2 steps"}</button>`,
              )}
            </div>`,
      })}
      <div class="ui-rgr__card">
        ${empty
          ? html`<p class="ui-rgr__empty">No connections to show.</p>`
          : html`<div class="ui-rgr__legend" role="group" aria-label="Kinds shown">
                ${kinds.map(
                  (k) => html`<button type="button" class="ui-rgr__kind" aria-pressed=${this.shownKind(k) ? "true" : "false"} @click=${() => this.toggleKind(k)}>
                    <span class="ui-rgr__swatch" data-tone=${this.tone(k)} data-shape=${k === "person" ? "round" : "square"} aria-hidden="true"></span>${this.kindLabel(k)}
                  </button>`,
                )}
              </div>
              <div class="ui-rgr__body">
                <div class="ui-rgr__stage">${this.renderDrawing()}</div>
                <div class="ui-rgr__side">
                  ${this.renderPanel()}
                  <div class="ui-rgr__nodes">
                    <p class="ui-rgr__nodes-label" id=${`${id}-list`}>All shown · ${placed.length}</p>
                    <ul
                      class="ui-rgr__list"
                      role="listbox"
                      tabindex="0"
                      aria-labelledby=${`${id}-list`}
                      aria-describedby=${`${id}-keys`}
                      aria-activedescendant=${ifDefined(activeNode ? `${id}-n-${this.active}` : undefined)}
                      @keydown=${this.onListKey}
                      @focus=${() => (this.listFocused = true)}
                      @blur=${() => (this.listFocused = false)}
                    >
                      ${placed.map((p, i) => {
                        const count = this.neighbours(p.node.id).size;
                        return html`<li
                          class="ui-rgr__option"
                          role="option"
                          id=${`${id}-n-${i}`}
                          aria-selected=${this.selected === p.node.id ? "true" : "false"}
                          ?data-active=${i === this.active}
                          @click=${() => {
                            this.active = i;
                            this.select(p.node.id);
                          }}
                          @dblclick=${() => this.recentre(p.node)}
                        >
                          <span class="ui-rgr__swatch" data-tone=${this.tone(p.node.kind)} data-shape=${p.node.kind === "person" ? "round" : "square"} aria-hidden="true"></span>
                          <span class="ui-rgr__option-name">${p.node.label}</span>
                          <span class="ui-rgr__option-meta">${p.ring === 0 ? "In the middle" : p.ring === 1 ? "Direct" : "2 steps"} · ${this.kindLabel(p.node.kind)} · ${count} ${count === 1 ? "connection" : "connections"}</span>
                        </li>`;
                      })}
                    </ul>
                    <p class="tc-sr-only" id=${`${id}-keys`}>Up and down arrows move through the nodes, Enter puts one in the middle, Space selects it</p>
                  </div>
                </div>
              </div>`}
      </div>
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="clean"], [data-look="standard"] *, [data-look="clean"] *)[data-ui="rgr"] {
  --tc-rgr-side-w: 260px;
  position: relative;
  box-sizing: border-box;
  display: block;
  width: 100%;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Standard: a gray tray holding a white card. Clean: one white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="rgr"] { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
:where([data-look="standard"], [data-look="standard"] *).ui-rgr__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="rgr"] { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-rgr__card { border-top: var(--tc-hairline) solid var(--tc-divider); }
[data-ui="rgr"] *, [data-ui="rgr"] *::before, [data-ui="rgr"] *::after { box-sizing: border-box; }
:where([data-ui="rgr"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="rgr"] :is(button, [tabindex]):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-ui="rgr"]) :is(h4, p, ul, dl, dd) { margin: 0; padding: 0; }
[data-ui="rgr"] ul { list-style: none; }
/* Kind colours: a tone per kind, shared by the drawing, the legend and the lists */
[data-ui="rgr"] [data-tone="violet"] { --tone-bg: var(--tc-tone-violet-bg); --tone-fg: var(--tc-tone-violet-fg); --tone-solid: var(--tc-tone-violet-solid); }
[data-ui="rgr"] [data-tone="teal"] { --tone-bg: var(--tc-tone-teal-bg); --tone-fg: var(--tc-tone-teal-fg); --tone-solid: var(--tc-tone-teal-solid); }
[data-ui="rgr"] [data-tone="amber"] { --tone-bg: var(--tc-tone-amber-bg); --tone-fg: var(--tc-tone-amber-fg); --tone-solid: var(--tc-tone-amber-solid); }
[data-ui="rgr"] [data-tone="pink"] { --tone-bg: var(--tc-tone-pink-bg); --tone-fg: var(--tc-tone-pink-fg); --tone-solid: var(--tc-tone-pink-solid); }
[data-ui="rgr"] [data-tone="rose"] { --tone-bg: var(--tc-tone-rose-bg); --tone-fg: var(--tc-tone-rose-fg); --tone-solid: var(--tc-tone-rose-solid); }
/* ----- Depth and the legend ----- */
.ui-rgr__depth { display: inline-flex; padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
.ui-rgr__depth-opt { display: inline-flex; align-items: center; height: calc(var(--tc-control-h-sm) - 2 * var(--tc-seg-pad)); padding: 0 var(--tc-space-2-5); border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-rgr__depth-opt[aria-checked="true"] { background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow); color: var(--tc-text-primary); }
.ui-rgr__legend { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); padding: var(--tc-space-3) var(--tc-space-4) 0; }
.ui-rgr__kind { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2-5); border-radius: var(--tc-radius-full); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); }
.ui-rgr__kind[aria-pressed="false"] { color: var(--tc-text-muted); text-decoration: line-through; }
.ui-rgr__kind[aria-pressed="false"] .ui-rgr__swatch { background: transparent; box-shadow: inset 0 0 0 1.5px var(--tone-solid); }
.ui-rgr__swatch { display: inline-block; flex: none; width: var(--tc-space-2-5); height: var(--tc-space-2-5); border-radius: var(--tc-radius-xs); background: var(--tone-solid); }
.ui-rgr__swatch[data-shape="round"] { border-radius: var(--tc-radius-full); }
/* ----- The drawing and the side ----- */
.ui-rgr__body { display: grid; grid-template-columns: minmax(0, 1fr) var(--tc-rgr-side-w); }
.ui-rgr__stage { min-width: 0; padding: var(--tc-space-2); }
.ui-rgr__svg { display: block; max-width: 100%; height: auto; overflow: visible; }
.ui-rgr__guide { fill: none; stroke: var(--tc-divider); stroke-dasharray: 2 4; }
.ui-rgr__edge { cursor: pointer; }
.ui-rgr__hit { stroke: transparent; stroke-width: 12; }
.ui-rgr__line { stroke: var(--tc-border-strong); stroke-linecap: round; transition: stroke var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-fast) var(--tc-ease-standard); animation: ui-rgr-fade var(--tc-duration-slow) var(--tc-ease-standard) both; }
.ui-rgr__edge[data-weight="1"] .ui-rgr__line { stroke-width: 1; }
.ui-rgr__edge[data-weight="2"] .ui-rgr__line { stroke-width: 1.75; }
.ui-rgr__edge[data-weight="3"] .ui-rgr__line { stroke-width: 2.5; }
.ui-rgr__edge[data-weight="4"] .ui-rgr__line { stroke-width: 3.25; }
.ui-rgr__edge[data-weight="5"] .ui-rgr__line { stroke-width: 4; }
.ui-rgr__edge:is([data-lit], [data-selected]) .ui-rgr__line { stroke: var(--tc-text-primary); }
.ui-rgr__edge-label { fill: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); paint-order: stroke; stroke: var(--tc-surface-raised); stroke-width: 4; stroke-linejoin: round; }
.ui-rgr__node { cursor: pointer; transition: transform var(--tc-duration-slow) var(--tc-ease-move); }
.ui-rgr__shape { fill: var(--tone-bg); stroke: var(--tone-solid); stroke-width: 1.5; transition: stroke-width var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-rgr__node[data-ring="0"] .ui-rgr__shape { stroke-width: 2.5; }
.ui-rgr__node:is([data-lit], [data-selected]) .ui-rgr__shape { stroke-width: 3; }
.ui-rgr__ring { fill: none; stroke: var(--tc-focus-ring); stroke-width: 2; }
.ui-rgr__initials { fill: var(--tone-fg); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); pointer-events: none; }
.ui-rgr__node[data-ring="0"] .ui-rgr__initials { font-size: var(--tc-font-size-md); }
.ui-rgr__label { fill: var(--tc-text-primary); font-size: var(--tc-font-size-xs); paint-order: stroke; stroke: var(--tc-surface-raised); stroke-width: 4; stroke-linejoin: round; pointer-events: none; }
:where([data-look="standard"], [data-look="standard"] *) .ui-rgr__label, :where([data-look="standard"], [data-look="standard"] *) .ui-rgr__edge-label { stroke: var(--tc-surface-on-tray); }
.ui-rgr__node[data-ring="0"] .ui-rgr__label { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); }
.ui-rgr__side { display: grid; align-content: start; gap: var(--tc-space-3); min-width: 0; padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-4); border-left: var(--tc-hairline) solid var(--tc-divider); }
.ui-rgr__panel { display: grid; gap: var(--tc-space-1); }
.ui-rgr__panel-kind { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-rgr__panel-name { font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); }
.ui-rgr__verb { font-weight: var(--tc-font-weight-regular); color: var(--tc-text-secondary); }
.ui-rgr__panel-sub, .ui-rgr__panel-count { font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-rgr__facts { display: grid; gap: var(--tc-space-1); margin-top: var(--tc-space-1) !important; font-size: var(--tc-font-size-sm); }
.ui-rgr__facts div { display: flex; justify-content: space-between; gap: var(--tc-space-2); }
.ui-rgr__facts dt { color: var(--tc-text-muted); }
.ui-rgr__facts dd { color: var(--tc-text-primary); }
.ui-rgr__group { display: grid; gap: var(--tc-space-0-5); margin-top: var(--tc-space-2); }
.ui-rgr__group-name { display: flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
.ui-rgr__group-count { display: inline-grid; place-items: center; min-width: var(--tc-space-5); height: var(--tc-pill-h); padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-full); background: var(--tc-fill-default); font-variant-numeric: tabular-nums; }
.ui-rgr__link { display: inline-flex; align-items: center; gap: var(--tc-space-2); min-height: var(--tc-control-h-sm); font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); text-align: left; }
.ui-rgr__link:hover { text-decoration: underline; text-underline-offset: var(--tc-space-0-5); }
.ui-rgr__nodes { display: grid; gap: var(--tc-space-1); padding-top: var(--tc-space-3); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-rgr__nodes-label { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-rgr__list { display: grid; max-height: 220px; overflow-y: auto; padding: var(--tc-space-0-5); border-radius: var(--tc-radius-lg); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); scrollbar-width: thin; }
.ui-rgr__option { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; column-gap: var(--tc-space-2); padding: var(--tc-space-1-5) var(--tc-space-2); border-radius: var(--tc-menu-item-radius); cursor: pointer; }
.ui-rgr__option:hover { background: var(--tc-menu-item-hover); }
.ui-rgr__option[aria-selected="true"] { background: var(--tc-fill-selected); }
.ui-rgr__option[aria-selected="true"] .ui-rgr__option-meta { color: var(--tc-text-secondary); }
.ui-rgr__list:focus-visible .ui-rgr__option[data-active] { outline: var(--tc-focus-outline); outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
.ui-rgr__option-name { overflow: hidden; font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); text-overflow: ellipsis; white-space: nowrap; }
.ui-rgr__option-meta { grid-column: 2; font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-rgr__empty { padding: var(--tc-space-6) var(--tc-space-4); color: var(--tc-text-muted); text-align: center; }
@keyframes ui-rgr-fade { from { opacity: 0; } }
@container (max-width: 620px) {
  .ui-rgr__body { grid-template-columns: minmax(0, 1fr); }
  .ui-rgr__side { border-top: var(--tc-hairline) solid var(--tc-divider); border-left: 0; }
}
@media (forced-colors: active) {
  .ui-rgr__shape { stroke: CanvasText; }
  .ui-rgr__line { stroke: CanvasText; }
  .ui-rgr__option[aria-selected="true"], .ui-rgr__depth-opt[aria-checked="true"] { outline: 2px solid Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="rgr"] *, [data-ui="rgr"] *::before, [data-ui="rgr"] *::after { animation: none !important; transition: none !important; }
}
`;
}

/** People first, organisations next, the rest after */
const rank = (k: string) => (k === "person" ? 0 : k === "organisation" ? 1 : 2);

if (!customElements.get("tc-relationship-graph")) customElements.define("tc-relationship-graph", TcRelationshipGraph);

declare global {
  interface HTMLElementTagNameMap {
    "tc-relationship-graph": TcRelationshipGraph;
  }
}
