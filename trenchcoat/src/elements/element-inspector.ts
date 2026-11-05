import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-element-inspector> – a page's elements as a tree, written the way the markup reads (an opening tag with its id and class first),
 * beside the chosen element's box model and styles. The page passes the tree and, for the chosen element, its details;
 * nothing here reads a real page. Hovering or focusing an element fires tc-highlight, so the page can outline it in a
 * preview. One tab stop: arrows walk the tree, ← and → fold, Enter or Space chooses.
 *   · wide, the tree and the details sit side by side; narrow, the details go under the tree
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-element-inspector .nodes=${[{ id: "body", tag: "body", children: […] }]} selected="main"></tc-element-inspector>
 */

export type InspectorNode = {
  /** Unique in the tree: what `selected`, `expanded` and the events hold */
  id: string;
  /** The tag name, such as "div" */
  tag: string;
  /** Its attributes; `id` and `class` show first, in that order */
  attrs?: Record<string, string>;
  /** A short text inside it */
  text?: string;
  children?: InspectorNode[];
};
/** Top, right, bottom, left, in px */
export type InspectorEdges = [number, number, number, number];
export type InspectorBox = { width: number; height: number; margin?: InspectorEdges; border?: InspectorEdges; padding?: InspectorEdges };
export type InspectorStyle = { property: string; value: string; /** Where it comes from, such as "form.css:12" */ source?: string };
export type InspectorDetails = { box?: InspectorBox; styles?: InspectorStyle[] };
export type InspectorSelectedChange = { selected: string | null; node: InspectorNode | null };
export type InspectorExpandedChange = { expanded: string[]; id: string };
export type InspectorHighlight = { id: string | null; node: InspectorNode | null };
export type InspectorLabels = {
  tree: string;
  details: string;
  empty: string;
  noElements: string;
  noStyles: string;
  loading: string;
  boxModel: string;
  styles: string;
  margin: string;
  border: string;
  padding: string;
  content: string;
  keys: string;
};
export const defaultInspectorLabels: InspectorLabels = {
  tree: "Elements",
  details: "Details",
  empty: "Select an element",
  noElements: "No elements",
  noStyles: "No styles",
  loading: "Loading details",
  boxModel: "Box model",
  styles: "Styles",
  margin: "margin",
  border: "border",
  padding: "padding",
  content: "content",
  keys: "Arrow keys move, left and right fold, Enter chooses",
};

/* Icons: Lucide (ISC, lucide.dev) – code-xml, chevron-right */
const headIcon = svg`<path d="m18 16 4-4-4-4"></path><path d="m6 8-4 4 4 4"></path><path d="m14.5 4-5 16"></path>`;
const chevron = html`<svg class="ui-elin__chevron" viewBox="0 0 24 24" aria-hidden="true">${svg`<path d="m9 18 6-6-6-6"></path>`}</svg>`;

type Row = { node: InspectorNode; parent: string | null; level: number; size: number; pos: number; open: boolean };

/** id and class first, then the rest as given */
const attrList = (attrs: Record<string, string> = {}) => {
  const keys = Object.keys(attrs);
  const lead = ["id", "class"].filter((k) => k in attrs);
  return [...lead, ...keys.filter((k) => !lead.includes(k))].map((k) => [k, attrs[k]] as const);
};

let nextId = 0;

/**
 * A page's elements as a tree beside the chosen element's box model and styles.
 * @tag tc-element-inspector
 * @fires tc-selected-change - Another element was chosen ({ selected, node }: InspectorSelectedChange); cancelable – prevented, `selected` stays as it was
 * @fires tc-expanded-change - An element was opened or closed ({ expanded, id }: InspectorExpandedChange); cancelable – prevented, `expanded` stays as it was
 * @fires tc-highlight - The pointer or focus moved onto an element, or left the tree ({ id, node }: InspectorHighlight)
 */
export class TcElementInspector extends TcElement {
  static override ui = "elin";

  /** The heading; empty leaves the header out */
  @property() accessor heading = "Elements";
  /** Small text under the heading – the page's address */
  @property() accessor description = "";
  /** The top of the tree, usually one <html> or <body> node */
  @property({ attribute: false }) accessor nodes: InspectorNode[] = [];
  /** The chosen element's id, or null */
  @property() accessor selected: string | null = null;
  /** The ids of the open elements */
  @property({ attribute: false }) accessor expanded: string[] = [];
  /** The chosen element's box model and styles, from the page */
  @property({ attribute: false }) accessor details: InspectorDetails | null = null;
  /** Height in px at which the tree and the details scroll */
  @property({ type: Number, attribute: "max-height" }) accessor maxHeight = 420;
  /** Renames the words it uses */
  @property({ attribute: false }) accessor labels: Partial<InspectorLabels> = {};

  /** The id of the row that holds the tab stop */
  @state() private accessor active: string | null = null;

  private rows: Row[] = [];
  private byId = new Map<string, InspectorNode>();
  private lit: string | null = null;
  /** The element `details` was given for: another element chosen since then hasn't had its details yet */
  private detailsFor: string | null = null;
  private uid = `tc-element-inspector-${++nextId}`;

  private get words() {
    return { ...defaultInspectorLabels, ...this.labels };
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("details")) this.detailsFor = this.selected;
    const open = new Set(this.expanded);
    const rows: Row[] = [];
    this.byId = new Map();
    // Folded elements are indexed too, so `selected` can name one that's out of sight
    const index = (nodes: InspectorNode[]) => {
      for (const n of nodes) {
        this.byId.set(n.id, n);
        if (n.children) index(n.children);
      }
    };
    const walk = (nodes: InspectorNode[], parent: string | null, level: number) =>
      nodes.forEach((node, i) => {
        const isOpen = !!node.children?.length && open.has(node.id);
        rows.push({ node, parent, level, size: nodes.length, pos: i + 1, open: isOpen });
        if (isOpen) walk(node.children!, node.id, level + 1);
      });
    index(this.nodes);
    walk(this.nodes, null, 1);
    this.rows = rows;
    if (!rows.some((r) => r.node.id === this.active)) this.active = rows.find((r) => r.node.id === this.selected)?.node.id ?? rows[0]?.node.id ?? null;
  }

  private setExpanded(id: string, open: boolean) {
    const expanded = open ? [...this.expanded, id] : this.expanded.filter((x) => x !== id);
    if (this.emit<InspectorExpandedChange>("tc-expanded-change", { expanded, id }, { cancelable: true })) this.expanded = expanded;
  }

  private choose(row: Row) {
    this.active = row.node.id;
    if (row.node.id === this.selected) return;
    if (this.emit<InspectorSelectedChange>("tc-selected-change", { selected: row.node.id, node: row.node }, { cancelable: true })) this.selected = row.node.id;
  }

  private highlight(id: string | null) {
    if (id === this.lit) return;
    this.lit = id;
    this.emit<InspectorHighlight>("tc-highlight", { id, node: id ? (this.byId.get(id) ?? null) : null });
  }

  private async focusRow(id: string) {
    this.active = id;
    await this.updateComplete;
    this.querySelector<HTMLElement>(`.ui-elin__row[data-id="${CSS.escape(id)}"]`)?.focus();
  }

  private onKey = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const rows = this.rows;
    const i = rows.findIndex((r) => r.node.id === this.active);
    const row = rows[i];
    if (!row) return;
    const folder = !!row.node.children?.length;
    let to: string | undefined;
    switch (e.key) {
      case "ArrowDown":
        to = rows[i + 1]?.node.id;
        break;
      case "ArrowUp":
        to = rows[i - 1]?.node.id;
        break;
      case "Home":
        to = rows[0].node.id;
        break;
      case "End":
        to = rows[rows.length - 1].node.id;
        break;
      case "ArrowRight":
        if (folder && !row.open) this.setExpanded(row.node.id, true);
        else if (row.open) to = rows[i + 1]?.node.id;
        break;
      case "ArrowLeft":
        if (row.open) this.setExpanded(row.node.id, false);
        else to = row.parent ?? undefined;
        break;
      case "Enter":
      case " ":
        this.choose(row);
        break;
      default:
        return;
    }
    e.preventDefault();
    if (to) void this.focusRow(to);
  };

  private onFocusOut = (e: FocusEvent) => {
    const next = e.relatedTarget as Node | null;
    if (!next || !(e.currentTarget as HTMLElement).contains(next)) this.highlight(null);
  };

  private markup(row: Row) {
    const n = row.node;
    const kids = !!n.children?.length;
    const close = html`<span class="ui-elin__punct">&lt;/</span><span class="ui-elin__tag">${n.tag}</span><span class="ui-elin__punct">&gt;</span>`;
    return html`<span class="ui-elin__code"
      ><span class="ui-elin__punct">&lt;</span><span class="ui-elin__tag">${n.tag}</span>${attrList(n.attrs).map(
        ([k, v]) => html` <span class="ui-elin__attr">${k}</span><span class="ui-elin__punct">="</span><span class="ui-elin__value">${v}</span><span class="ui-elin__punct">"</span>`,
      )}<span class="ui-elin__punct">&gt;</span>${n.text ? html`<span class="ui-elin__text">${n.text}</span>` : nothing}${kids && !row.open ? html`<span class="ui-elin__more">…</span>` : nothing}${!kids || !row.open ? close : nothing}</span
    >`;
  }

  private row(r: Row) {
    const kids = !!r.node.children?.length;
    return html`<div
      class="ui-elin__row"
      role="treeitem"
      data-id=${r.node.id}
      aria-level=${r.level}
      aria-setsize=${r.size}
      aria-posinset=${r.pos}
      aria-expanded=${ifDefined(kids ? (r.open ? "true" : "false") : undefined)}
      aria-selected=${r.node.id === this.selected ? "true" : "false"}
      tabindex=${r.node.id === this.active ? 0 : -1}
      style=${styleMap({ "--tc-elin-level": String(r.level - 1) })}
      @click=${(e: MouseEvent) => {
        if (kids && (e.target as Element).closest(".ui-elin__twisty")) return this.setExpanded(r.node.id, !r.open);
        this.choose(r);
      }}
      @mouseenter=${() => this.highlight(r.node.id)}
      @focus=${() => this.highlight(r.node.id)}
    >
      <span class="ui-elin__twisty">${kids ? chevron : nothing}</span>${this.markup(r)}
    </div>`;
  }

  private edges(cls: string, name: string, e: InspectorEdges | undefined, inner: unknown) {
    const [t, r, b, l] = e ?? [0, 0, 0, 0];
    const v = (n: number) => (n ? String(n) : "–");
    return html`<div class="ui-elin__layer ${cls}">
      <span class="ui-elin__layer-name">${name}</span>
      <span class="ui-elin__edge" data-side="top">${v(t)}</span>
      <div class="ui-elin__mid"><span class="ui-elin__edge" data-side="left">${v(l)}</span>${inner}<span class="ui-elin__edge" data-side="right">${v(r)}</span></div>
      <span class="ui-elin__edge" data-side="bottom">${v(b)}</span>
    </div>`;
  }

  private box(box: InspectorBox) {
    const w = this.words;
    const say = (name: string, e?: InspectorEdges) => `${name} ${(e ?? [0, 0, 0, 0]).join(" ")}`;
    const content = html`<div class="ui-elin__content">${Math.round(box.width)} × ${Math.round(box.height)}</div>`;
    return html`<section class="ui-elin__section" aria-labelledby="${this.uid}-box">
      <h4 class="ui-elin__label" id="${this.uid}-box">${w.boxModel}</h4>
      <div class="ui-elin__box" aria-hidden="true">
        ${this.edges("ui-elin__margin", w.margin, box.margin, this.edges("ui-elin__border", w.border, box.border, this.edges("ui-elin__padding", w.padding, box.padding, content)))}
      </div>
      <p class="ui-elin__sr">${[`${w.content} ${Math.round(box.width)} by ${Math.round(box.height)}`, say(w.padding, box.padding), say(w.border, box.border), say(w.margin, box.margin)].join(", ")}</p>
    </section>`;
  }

  private detailsPane() {
    const w = this.words;
    const node = this.selected ? this.byId.get(this.selected) : undefined;
    if (!node) return html`<p class="ui-elin__empty">${w.empty}</p>`;
    // Until the page answers for the newly chosen element, its heading shows without the last one's box and styles
    const waiting = !!this.details && this.detailsFor !== this.selected;
    const d = this.details ?? {};
    const cls = node.attrs?.class?.trim().split(/\s+/).filter(Boolean) ?? [];
    return html`<p class="ui-elin__picked"><span class="ui-elin__tag">${node.tag}</span>${node.attrs?.id ? html`<span class="ui-elin__value">#${node.attrs.id}</span>` : nothing}${cls.map((c) => html`<span class="ui-elin__attr">.${c}</span>`)}</p>
      ${waiting
        ? html`<p class="ui-elin__none" role="status">${w.loading}</p>`
        : html`${d.box ? this.box(d.box) : nothing}
            <section class="ui-elin__section" aria-labelledby="${this.uid}-styles">
              <h4 class="ui-elin__label" id="${this.uid}-styles">${w.styles}</h4>
              ${d.styles?.length
                ? html`<dl class="ui-elin__styles">${d.styles.map(
                    (s) => html`<div class="ui-elin__style"><dt class="ui-elin__prop">${s.property}</dt><dd class="ui-elin__val">${s.value}${s.source ? html`<span class="ui-elin__source">${s.source}</span>` : nothing}</dd></div>`,
                  )}</dl>`
                : html`<p class="ui-elin__none">${w.noStyles}</p>`}
            </section>`}`;
  }

  protected override render() {
    const w = this.words;
    const limit = styleMap({ maxHeight: this.maxHeight ? `${this.maxHeight}px` : undefined });
    return html`${this.heading ? cardHead({ icon: headIcon, title: this.heading, subtitle: this.description }) : nothing}
      <div class="ui-elin__card">
        <div class="ui-elin__body">
          <div class="ui-elin__pane ui-elin__tree-pane" style=${limit}>
            ${this.rows.length
              ? html`<div class="ui-elin__tree" role="tree" aria-label=${w.tree} aria-describedby="${this.uid}-keys" @keydown=${this.onKey} @mouseleave=${() => this.highlight(null)} @focusout=${this.onFocusOut}>
                  ${this.rows.map((r) => this.row(r))}
                </div>`
              : html`<p class="ui-elin__empty">${w.noElements}</p>`}
          </div>
          <section class="ui-elin__pane ui-elin__details" style=${limit} aria-label=${w.details}>${this.detailsPane()}</section>
        </div>
      </div>
      <span class="ui-elin__sr" id="${this.uid}-keys">${w.keys}</span>`;
  }

  static override css = /* css */ `
[data-ui="elin"] {
  box-sizing: border-box;
  display: block;
  min-width: 0;
  width: 100%;
  container-type: inline-size;
  color: var(--tc-text-primary);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  -webkit-font-smoothing: antialiased;
  --tc-elin-indent: var(--tc-space-3-5);
}
[data-ui="elin"] *, [data-ui="elin"] *::before, [data-ui="elin"] *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="elin"] { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="elin"] .ui-elin__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="elin"] { border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
.ui-elin__card { overflow: hidden; }
.ui-elin__sr { position: absolute; width: 1px; height: 1px; margin: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-elin__body { display: grid; grid-template-columns: minmax(0, 1fr); }
.ui-elin__pane { min-width: 0; overflow: auto; overscroll-behavior: contain; padding: var(--tc-space-1); }
.ui-elin__details { padding: var(--tc-space-3); border-top: var(--tc-hairline) solid var(--tc-divider); }
@container (min-width: 40rem) {
  .ui-elin__body { grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); }
  .ui-elin__details { border-top: 0; border-left: var(--tc-hairline) solid var(--tc-divider); }
}

.ui-elin__row {
  display: flex;
  align-items: center;
  gap: var(--tc-space-0-5);
  min-height: var(--tc-control-h-sm);
  padding-right: var(--tc-space-2);
  padding-left: calc(var(--tc-space-1) + var(--tc-elin-level) * var(--tc-elin-indent));
  border-radius: var(--tc-radius-sm);
  cursor: pointer;
  user-select: none;
}
.ui-elin__row:hover { background: var(--tc-fill-subtle); }
.ui-elin__row[aria-selected="true"] { background: var(--tc-fill-selected); }
.ui-elin__row:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
.ui-elin__twisty { flex: none; display: grid; place-items: center; width: var(--tc-space-4); height: var(--tc-space-4); }
.ui-elin__chevron { width: var(--tc-space-3); height: var(--tc-space-3); fill: none; stroke: var(--tc-icon-muted); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; transition: transform var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-elin__row[aria-expanded="true"] .ui-elin__chevron { transform: rotate(90deg); }
.ui-elin__code { min-width: 0; overflow: hidden; color: var(--tc-syntax-punctuation); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); text-overflow: ellipsis; white-space: nowrap; }
.ui-elin__tag { color: var(--tc-syntax-tag); }
.ui-elin__attr { color: var(--tc-syntax-property); }
.ui-elin__value { color: var(--tc-syntax-string); }
.ui-elin__punct { color: var(--tc-syntax-punctuation); }
.ui-elin__text { color: var(--tc-syntax-text); }
.ui-elin__more { padding: 0 var(--tc-space-0-5); color: var(--tc-text-muted); }

.ui-elin__empty, .ui-elin__none { margin: 0; color: var(--tc-text-muted); }
.ui-elin__empty { padding: var(--tc-space-6) var(--tc-space-3); text-align: center; }
.ui-elin__picked { display: flex; flex-wrap: wrap; margin: 0 0 var(--tc-space-3); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); overflow-wrap: anywhere; }
.ui-elin__section + .ui-elin__section { margin-top: var(--tc-space-4); }
.ui-elin__label { margin: 0 0 var(--tc-space-2); color: var(--tc-text-muted); font-size: var(--tc-eyebrow-font-size); font-weight: var(--tc-eyebrow-font-weight); line-height: var(--tc-eyebrow-line-height); }

.ui-elin__box { font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); text-align: center; }
.ui-elin__layer { position: relative; display: grid; gap: var(--tc-space-0-5); padding: var(--tc-space-1) var(--tc-space-1-5); border: var(--tc-hairline) dashed var(--tc-border-strong); border-radius: var(--tc-radius-xs); color: var(--tc-text-primary); }
.ui-elin__margin { background: var(--tc-tone-amber-bg); }
.ui-elin__border { border-style: solid; background: var(--tc-status-warning-bg); }
.ui-elin__padding { background: var(--tc-tone-teal-bg); }
.ui-elin__layer-name { position: absolute; top: var(--tc-space-0-5); left: var(--tc-space-1); color: var(--tc-text-secondary); font-family: var(--tc-font-sans); font-size: var(--tc-font-size-2xs); }
.ui-elin__mid { display: flex; align-items: center; gap: var(--tc-space-1-5); }
.ui-elin__mid > .ui-elin__layer, .ui-elin__mid > .ui-elin__content { flex: 1; min-width: 0; }
.ui-elin__edge { font-variant-numeric: tabular-nums; }
.ui-elin__edge[data-side="left"], .ui-elin__edge[data-side="right"] { flex: none; min-width: var(--tc-space-4); }
.ui-elin__content { padding: var(--tc-space-1-5) var(--tc-space-1); border: var(--tc-hairline) solid var(--tc-border-strong); border-radius: var(--tc-radius-xs); background: var(--tc-status-info-bg); white-space: nowrap; }

.ui-elin__styles { display: grid; margin: 0; font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); }
.ui-elin__style { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0 var(--tc-space-1); padding: var(--tc-space-0-5) 0; }
.ui-elin__style + .ui-elin__style { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-elin__prop { color: var(--tc-syntax-property); }
.ui-elin__prop::after { content: ":"; color: var(--tc-syntax-punctuation); }
.ui-elin__val { flex: 1; display: flex; flex-wrap: wrap; justify-content: space-between; gap: 0 var(--tc-space-2); min-width: 0; margin: 0; color: var(--tc-text-primary); overflow-wrap: anywhere; }
.ui-elin__source { color: var(--tc-text-muted); font-family: var(--tc-font-sans); font-size: var(--tc-font-size-xs); }
@media (prefers-reduced-motion: reduce) {
  [data-ui="elin"] *, [data-ui="elin"] *::before, [data-ui="elin"] *::after { transition: none !important; }
}
@media (forced-colors: active) {
  .ui-elin__row[aria-selected="true"] { outline: var(--tc-hairline) solid Highlight; }
  .ui-elin__layer, .ui-elin__content { border-color: CanvasText; }
}
`;
}

if (!customElements.get("tc-element-inspector")) customElements.define("tc-element-inspector", TcElementInspector);
declare global {
  interface HTMLElementTagNameMap {
    "tc-element-inspector": TcElementInspector;
  }
}
