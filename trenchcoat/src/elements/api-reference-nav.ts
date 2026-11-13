import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { safeUrl } from "./internal/safe-url";

/*
 * <tc-api-reference-nav> – the side navigation of an API reference: endpoints grouped by resource (Records, Search,
 * Exports…), each a link with its method as a badge in a colour and a word (GET, POST…) and its short name – or its
 * path, with the Paths switch. A field filters by name, path or method; groups with no match drop out, the rest open.
 * The current endpoint is aria-current="page" and scrolled into view; deprecated ones are struck through and say so.
 * It's a tree with one tab stop: ↑/↓ move, → opens a group or steps into it, ← closes it or steps out to it,
 * Home/End go to the ends, typing a letter jumps to the next item that starts with it, and Enter follows a link.
 * Every plain click (or Enter) fires a cancelable tc-navigate ({ id, href, endpoint, current }), so a router can take
 * it; unless it's prevented the endpoint becomes `current`. ⌘/Ctrl- and middle-clicks open a new tab as links do.
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-api-reference-nav heading="Records API" current="records-list" .groups=${[{ id: "records", label: "Records",
 *     endpoints: [{ id: "records-list", name: "List records", method: "GET", path: "/v1/records", href: "#records-list" }] }]}>
 *   </tc-api-reference-nav>
 */

/** An HTTP method; anything else is shown as given, in a neutral badge */
export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS" | (string & {});
export type ApiEndpoint = {
  /** Your key: `current` names it, tc-navigate hands it back */
  id: string;
  /** Its short name, "List records" */
  name: string;
  method: ApiMethod;
  /** "/v1/records/{id}" – shown with the Paths switch, and matched by the filter */
  path: string;
  /** Its page; without one the row is a button that only fires tc-navigate */
  href?: string;
  /** Struck through and labelled Deprecated; still reachable */
  deprecated?: boolean;
};
export type ApiNavGroup = {
  id: string;
  /** The resource, "Records" */
  label: string;
  endpoints: ApiEndpoint[];
};
export type ApiNavNavigate = { id: string; href?: string; endpoint: ApiEndpoint; current: string };
export type ApiNavQueryChange = { query: string };
export type ApiNavShowPathsChange = { showPaths: boolean };
export type ApiNavCollapsedChange = { collapsed: string[]; id: string; open: boolean };

export type ApiNavLabels = {
  filter: string;
  filterPlaceholder: string;
  showPaths: string;
  deprecated: string;
  noMatch: string;
  /** "{n} endpoints" */
  count: string;
  /** "{n} of {total} endpoints" while filtering */
  matches: string;
};
export const defaultApiNavLabels: ApiNavLabels = {
  filter: "Filter endpoints",
  filterPlaceholder: "Filter endpoints",
  showPaths: "Paths",
  deprecated: "Deprecated",
  noMatch: "No endpoints match",
  count: "{n} endpoints",
  matches: "{n} of {total} endpoints",
};

/** The tone a method's badge takes: reads in blue, creates in green, changes in amber, deletes in red */
export function apiMethodTone(method: string): "read" | "create" | "change" | "delete" | "other" {
  const m = method.toUpperCase();
  if (m === "GET" || m === "HEAD") return "read";
  if (m === "POST") return "create";
  if (m === "PUT" || m === "PATCH") return "change";
  if (m === "DELETE") return "delete";
  return "other";
}

/** Whether an endpoint matches a filter: every word must be in its name, path or method */
export function apiEndpointMatches(endpoint: ApiEndpoint, query: string) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const hay = `${endpoint.name} ${endpoint.path} ${endpoint.method}`.toLowerCase();
  return words.every((w) => hay.includes(w));
}

/* book-open, chevron-right, search: Lucide (ISC, lucide.dev) */
const ICON = svg`<path d="M12 7v14"></path><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"></path>`;
const chevron = () => html`<svg class="ui-arn__chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg>`;
const searchIcon = () => html`<svg class="ui-arn__search-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>`;

const groupKey = (id: string) => `g:${id}`;
const endpointKey = (id: string) => `e:${id}`;

let instances = 0;

/**
 * An API reference's side navigation: endpoints grouped by resource, with method badges, a filter and the current page.
 * @tag tc-api-reference-nav
 * @fires tc-navigate - An endpoint was chosen ({ id, href, endpoint, current }: ApiNavNavigate); cancelable – prevented, a link isn't followed and `current` stays
 * @fires tc-query-change - The filter changed ({ query }: ApiNavQueryChange); cancelable – prevented, `query` stays
 * @fires tc-show-paths-change - The Paths switch was pressed ({ showPaths }: ApiNavShowPathsChange); cancelable – prevented, `showPaths` stays
 * @fires tc-collapsed-change - A group was opened or closed ({ collapsed, id, open }: ApiNavCollapsedChange); cancelable – prevented, `collapsed` stays
 */
export class TcApiReferenceNav extends TcElement {
  static override ui = "arn";

  /** The header's title */
  @property() accessor heading = "API reference";
  /** A quiet line under the title: the version, the base URL */
  @property() accessor description = "";
  /** The resources and their endpoints, in order */
  @property({ attribute: false }) accessor groups: ApiNavGroup[] = [];
  /** The current endpoint's id – aria-current="page". Set by a click unless a tc-navigate listener calls preventDefault() */
  @property() accessor current: string | null = null;
  /** The filter's text. Changed by typing unless a tc-query-change listener calls preventDefault() */
  @property() accessor query = "";
  /** Show each endpoint's path instead of its name. Changed by the Paths switch unless a tc-show-paths-change listener calls preventDefault() */
  @property({ type: Boolean, attribute: "show-paths", reflect: true }) accessor showPaths = false;
  /** The ids of closed groups. Changed by opening and closing unless a tc-collapsed-change listener calls preventDefault() */
  @property({ attribute: false }) accessor collapsed: string[] = [];
  /** Hide the filter field (for a short reference) */
  @property({ type: Boolean, attribute: "hide-filter" }) accessor hideFilter = false;
  /** The words, merged over defaultApiNavLabels */
  @property({ attribute: false }) accessor labels: Partial<ApiNavLabels> = {};

  /** @internal The item holding the tab stop: "g:<group id>" or "e:<endpoint id>" */
  @state() accessor active = "";
  /** @internal The status line's words */
  @state() accessor announce = "";

  private readonly uid = `tc-arn${++instances}`;
  private typed = "";
  private typedTimer?: ReturnType<typeof setTimeout>;
  private scrollToCurrent = true;

  private get words(): ApiNavLabels {
    return { ...defaultApiNavLabels, ...this.labels };
  }

  private get filtering() {
    return this.query.trim() !== "";
  }

  /** The groups as shown: filtered, with groups that have no match left out */
  private get shown() {
    return this.groups
      .map((g) => ({ group: g, endpoints: g.endpoints.filter((e) => apiEndpointMatches(e, this.query)) }))
      .filter((g) => !this.filtering || g.endpoints.length > 0);
  }

  private isOpen(id: string) {
    // While filtering every group with a match is open, so a match is never hidden in a closed one
    return this.filtering || !this.collapsed.includes(id);
  }

  /** Every item a key can reach, top to bottom: groups, and the endpoints of open ones */
  private visibleKeys() {
    const keys: string[] = [];
    for (const { group, endpoints } of this.shown) {
      keys.push(groupKey(group.id));
      if (this.isOpen(group.id)) for (const e of endpoints) keys.push(endpointKey(e.id));
    }
    return keys;
  }

  private endpoint(id: string) {
    for (const g of this.groups) {
      const e = g.endpoints.find((x) => x.id === id);
      if (e) return { group: g, endpoint: e };
    }
    return null;
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    // A current endpoint in a closed group would be hidden: its group shows open (the page's `collapsed` isn't changed)
    if (changed.has("current") && this.current) this.scrollToCurrent = true;
    const keys = this.visibleKeys();
    if (!keys.includes(this.active)) {
      const cur = this.current ? endpointKey(this.current) : "";
      this.active = keys.includes(cur) ? cur : (keys[0] ?? "");
    }
  }

  protected override updated() {
    if (!this.scrollToCurrent || !this.current) return;
    this.scrollToCurrent = false;
    const tree = this.querySelector<HTMLElement>(".ui-arn__tree");
    const row = this.querySelector<HTMLElement>(".ui-arn__endpoint[aria-current]");
    if (!tree || !row) return;
    // Scroll the tree only – never the page – so the current endpoint is in view
    const top = row.offsetTop - tree.offsetTop;
    if (top < tree.scrollTop) tree.scrollTop = top;
    else if (top + row.offsetHeight > tree.scrollTop + tree.clientHeight) tree.scrollTop = top + row.offsetHeight - tree.clientHeight;
  }

  private focusKey(key: string) {
    this.active = key;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-key="${CSS.escape(key)}"]`)?.focus());
  }

  private setQuery(query: string) {
    if (!this.emit<ApiNavQueryChange>("tc-query-change", { query }, { cancelable: true })) {
      // Prevented: the field shows the property's value again
      const input = this.querySelector<HTMLInputElement>(".ui-arn__filter-input");
      if (input) input.value = this.query;
      return;
    }
    this.query = query;
    const w = this.words;
    const total = this.groups.reduce((n, g) => n + g.endpoints.length, 0);
    const n = this.shown.reduce((s, g) => s + g.endpoints.length, 0);
    this.announce = !query.trim() ? "" : n ? w.matches.replace("{n}", String(n)).replace("{total}", String(total)) : w.noMatch;
  }

  private toggleGroup(id: string, open = !this.isOpen(id)) {
    if (this.filtering || open === this.isOpen(id)) return;
    const collapsed = open ? this.collapsed.filter((c) => c !== id) : [...this.collapsed, id];
    if (!this.emit<ApiNavCollapsedChange>("tc-collapsed-change", { collapsed, id, open }, { cancelable: true })) return;
    this.collapsed = collapsed;
  }

  private togglePaths() {
    const showPaths = !this.showPaths;
    if (!this.emit<ApiNavShowPathsChange>("tc-show-paths-change", { showPaths }, { cancelable: true })) return;
    this.showPaths = showPaths;
  }

  private choose(e: MouseEvent | null, endpoint: ApiEndpoint) {
    // A new tab or window is the browser's business: no event, the link opens as usual
    if (e && (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0)) return;
    const href = endpoint.href ? safeUrl(endpoint.href) : undefined;
    this.active = endpointKey(endpoint.id);
    if (!this.emit<ApiNavNavigate>("tc-navigate", { id: endpoint.id, href, endpoint, current: endpoint.id }, { cancelable: true })) {
      e?.preventDefault();
      return;
    }
    this.current = endpoint.id;
  }

  private onTreeKey = (e: KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const keys = this.visibleKeys();
    const at = keys.indexOf(this.active);
    if (at < 0) return;
    const key = this.active;
    const isGroup = key.startsWith("g:");
    const id = key.slice(2);
    let next: string | undefined;
    switch (e.key) {
      case "ArrowDown":
        next = keys[Math.min(at + 1, keys.length - 1)];
        break;
      case "ArrowUp":
        next = keys[Math.max(at - 1, 0)];
        break;
      case "Home":
        next = keys[0];
        break;
      case "End":
        next = keys[keys.length - 1];
        break;
      case "ArrowRight":
        if (!isGroup) return e.preventDefault();
        if (!this.isOpen(id)) this.toggleGroup(id, true);
        else next = keys[at + 1]?.startsWith("e:") ? keys[at + 1] : undefined;
        break;
      case "ArrowLeft":
        if (isGroup) this.toggleGroup(id, false);
        else next = groupKey(this.endpoint(id)?.group.id ?? "");
        break;
      case "Enter":
      case " ":
        if (isGroup) {
          this.toggleGroup(id);
          break;
        }
        // Enter on a link follows it natively (its click handler fires tc-navigate); a button row needs the click
        if (e.key === " " || !this.endpoint(id)?.endpoint.href) {
          e.preventDefault();
          (e.target as HTMLElement).click();
        }
        return;
      default:
        if (e.key.length === 1 && /\S/.test(e.key)) {
          next = this.typeAhead(e.key, keys, at);
          if (!next) return;
        } else return;
    }
    e.preventDefault();
    if (next) this.focusKey(next);
  };

  /** The next item, after the focused one, whose words start with what's been typed in the last half second */
  private typeAhead(char: string, keys: string[], at: number) {
    clearTimeout(this.typedTimer);
    this.typed += char.toLowerCase();
    this.typedTimer = setTimeout(() => (this.typed = ""), 500);
    const label = (key: string) => {
      if (key.startsWith("g:")) return this.groups.find((g) => g.id === key.slice(2))?.label ?? "";
      const e = this.endpoint(key.slice(2))?.endpoint;
      return (this.showPaths ? e?.path : e?.name) ?? "";
    };
    // A single letter, or the same letter repeated, moves on through the items that start with it; more letters
    // narrow the match from the focused item on
    const same = [...this.typed].every((c) => c === this.typed[0]);
    const want = same ? this.typed[0] : this.typed;
    const start = same ? at + 1 : at;
    for (let i = 0; i < keys.length; i++) {
      const key = keys[(start + i) % keys.length];
      if (label(key).toLowerCase().replace(/^\//, "").startsWith(want.replace(/^\//, ""))) return key;
    }
    return undefined;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.typedTimer);
  }

  private renderEndpoint(endpoint: ApiEndpoint, level: number, pos: number, size: number): TemplateResult {
    const w = this.words;
    const key = endpointKey(endpoint.id);
    const isCurrent = endpoint.id === this.current;
    const href = endpoint.href ? safeUrl(endpoint.href) : undefined;
    const body = html`<span class="ui-arn__method" data-tone=${apiMethodTone(endpoint.method)}>${endpoint.method.toUpperCase()}</span>
      <span class="ui-arn__name" data-path=${this.showPaths ? "" : nothing}>${this.showPaths ? endpoint.path : endpoint.name}</span>
      ${endpoint.deprecated ? html`<span class="ui-arn__deprecated">${w.deprecated}</span>` : nothing}`;
    const common = {
      cls: `ui-arn__endpoint${isCurrent ? " ui-arn__endpoint--current" : ""}`,
      tabindex: this.active === key ? 0 : -1,
      current: isCurrent ? ("page" as const) : undefined,
    };
    // The other of name and path, for a tooltip and screen readers
    const other = this.showPaths ? endpoint.name : endpoint.path;
    return href
      ? html`<a class=${common.cls} role="treeitem" href=${href} data-key=${key} tabindex=${common.tabindex} aria-level=${level} aria-posinset=${pos} aria-setsize=${size}
          aria-current=${ifDefined(common.current)} aria-describedby=${`${this.uid}-${endpoint.id}-o`} title=${other}
          @click=${(e: MouseEvent) => this.choose(e, endpoint)} @focus=${() => (this.active = key)}>${body}</a>`
      : html`<div class=${common.cls} role="treeitem" data-key=${key} tabindex=${common.tabindex} aria-level=${level} aria-posinset=${pos} aria-setsize=${size}
          aria-current=${ifDefined(common.current)} aria-describedby=${`${this.uid}-${endpoint.id}-o`} title=${other}
          @click=${() => this.choose(null, endpoint)} @focus=${() => (this.active = key)}>${body}</div>`;
  }

  protected override render() {
    const w = this.words;
    const titleId = `${this.uid}-title`;
    const shown = this.shown;
    const total = this.groups.reduce((n, g) => n + g.endpoints.length, 0);
    const matched = shown.reduce((n, g) => n + g.endpoints.length, 0);
    const count = this.filtering ? w.matches.replace("{n}", String(matched)).replace("{total}", String(total)) : w.count.replace("{n}", String(total));
    return html`${cardHead({
        icon: ICON,
        title: this.heading,
        subtitle: this.description || undefined,
        id: titleId,
        aside: html`<button type="button" class="ui-arn__paths" aria-pressed=${this.showPaths ? "true" : "false"} @click=${() => this.togglePaths()}>
          <span class="ui-arn__switch" aria-hidden="true"></span>${w.showPaths}
        </button>`,
      })}
      <nav class="ui-arn__card" aria-labelledby=${titleId}>
        ${this.hideFilter
          ? nothing
          : html`<div class="ui-arn__filter">
              ${searchIcon()}
              <label class="tc-sr-only" for=${`${this.uid}-q`}>${w.filter}</label>
              <input class="ui-arn__filter-input" id=${`${this.uid}-q`} type="search" autocomplete="off" spellcheck="false" placeholder=${w.filterPlaceholder}
                .value=${this.query} aria-describedby=${`${this.uid}-count`}
                @input=${(e: Event) => this.setQuery((e.target as HTMLInputElement).value)}
                @keydown=${(e: KeyboardEvent) => {
                  if (e.key === "Escape" && this.query) {
                    e.preventDefault();
                    this.setQuery("");
                  } else if (e.key === "ArrowDown" && this.active) {
                    e.preventDefault();
                    this.focusKey(this.active);
                  }
                }} />
            </div>`}
        <p class="ui-arn__count" id=${`${this.uid}-count`}>${count}</p>
        ${shown.length
          ? html`<div class="ui-arn__tree" role="tree" aria-labelledby=${titleId} @keydown=${this.onTreeKey}>
              ${shown.map(({ group, endpoints }, gi) => {
                const key = groupKey(group.id);
                const open = this.isOpen(group.id);
                // Flat, as tree-select and file-tree are: each row a treeitem with its level, the groups' rows expandable
                return html`<div class="ui-arn__group" role="treeitem" data-key=${key} tabindex=${this.active === key ? "0" : "-1"} aria-level="1" aria-posinset=${gi + 1}
                    aria-setsize=${shown.length} aria-expanded=${open ? "true" : "false"} @focus=${() => (this.active = key)} @click=${() => {
                      this.active = key;
                      this.toggleGroup(group.id);
                    }}>
                    ${chevron()}<span class="ui-arn__group-label">${group.label}</span>
                    <span class="ui-arn__group-count">${endpoints.length}<span class="tc-sr-only"> ${endpoints.length === 1 ? "endpoint" : "endpoints"}</span></span>
                  </div>
                  ${open ? endpoints.map((ep, i) => this.renderEndpoint(ep, 2, i + 1, endpoints.length)) : nothing}`;
              })}
            </div>
            <div hidden>${shown.flatMap(({ endpoints }) => endpoints.map((ep) => html`<span id=${`${this.uid}-${ep.id}-o`}>${this.showPaths ? ep.name : ep.path}</span>`))}</div>`
          : html`<p class="ui-arn__empty">${this.filtering ? w.noMatch : w.count.replace("{n}", "0")}</p>`}
      </nav>
      <span class="tc-sr-only" role="status">${this.announce}</span>`;
  }

  static override css = /* css */ `
[data-ui="arn"] {
  /* The tree's tallest before it scrolls, the method badge's width and the chevron's size */
  --tc-arn-max-h: 520px;
  --tc-arn-method-w: 52px;
  --tc-arn-icon: 14px;
  position: relative; display: block; box-sizing: border-box; width: 100%;
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="arn"] { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="arn"] .ui-arn__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="arn"] { border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
[data-ui="arn"] *, [data-ui="arn"] *::before, [data-ui="arn"] *::after { box-sizing: border-box; }
[data-ui="arn"] :where(p, ul) { margin: 0; }
:where([data-ui="arn"]) button { margin: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }

.ui-arn__paths { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-md); color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-arn__paths:hover { color: var(--tc-text-primary); }
.ui-arn__paths:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-arn__switch { position: relative; flex: none; width: var(--tc-space-6); height: var(--tc-space-3-5, var(--tc-space-4)); border-radius: var(--tc-radius-full); background: var(--tc-fill-strong, var(--tc-border-default)); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-arn__switch::after { content: ""; position: absolute; top: var(--tc-hairline); left: var(--tc-hairline); width: calc(var(--tc-space-3-5, var(--tc-space-4)) - 2 * var(--tc-hairline)); aspect-ratio: 1; border-radius: var(--tc-radius-full); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-control); transition: transform var(--tc-duration-fast) var(--tc-ease-move); }
.ui-arn__paths[aria-pressed="true"] .ui-arn__switch { background: var(--tc-accent-solid); }
.ui-arn__paths[aria-pressed="true"] .ui-arn__switch::after { transform: translateX(calc(var(--tc-space-6) - var(--tc-space-3-5, var(--tc-space-4)))); }

.ui-arn__card { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-2); }
.ui-arn__filter { position: relative; display: flex; align-items: center; }
.ui-arn__search-icon { position: absolute; left: var(--tc-space-2-5); width: var(--tc-arn-icon); height: var(--tc-arn-icon); fill: none; stroke: var(--tc-icon-muted); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; pointer-events: none; }
.ui-arn__filter-input { width: 100%; height: var(--tc-control-h-md); padding: 0 var(--tc-space-2) 0 var(--tc-space-8); border: 0; border-radius: var(--tc-control-radius-md); background: var(--tc-fill-default); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-subtle); color: var(--tc-text-primary); font: inherit; }
.ui-arn__filter-input::placeholder { color: var(--tc-text-muted); }
.ui-arn__filter-input:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-arn__count { padding: 0 var(--tc-space-1); color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; }

.ui-arn__tree { display: grid; gap: var(--tc-space-0-5); max-height: var(--tc-arn-max-h); padding: var(--tc-space-0-5); overflow-y: auto; overscroll-behavior: contain; }
.ui-arn__group { display: flex; align-items: center; gap: var(--tc-space-1-5); min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-md); color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-semibold); cursor: pointer; user-select: none; }
.ui-arn__group:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-arn__group:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
.ui-arn__group:not(:first-child) { margin-top: var(--tc-space-1); }
.ui-arn__chevron { flex: none; width: var(--tc-arn-icon); height: var(--tc-arn-icon); fill: none; stroke: var(--tc-icon-muted); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; transition: transform var(--tc-duration-fast) var(--tc-ease-move); }
.ui-arn__group[aria-expanded="true"] .ui-arn__chevron { transform: rotate(90deg); }
.ui-arn__group-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-arn__group-count { flex: none; color: var(--tc-text-muted); font-weight: var(--tc-font-weight-regular, var(--tc-font-weight-medium)); font-variant-numeric: tabular-nums; }

.ui-arn__endpoint { display: flex; align-items: center; gap: var(--tc-space-2); min-height: var(--tc-control-h-sm); margin-left: var(--tc-space-2); padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-md); color: var(--tc-text-secondary); text-decoration: none; cursor: pointer; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-arn__endpoint:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-arn__endpoint:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
.ui-arn__endpoint--current, .ui-arn__endpoint--current:hover { background: var(--tc-fill-selected, var(--tc-fill-default)); color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
:where([data-look="clean"], [data-look="clean"] *) .ui-arn__endpoint--current { color: var(--tc-accent-text); }
.ui-arn__method { flex: none; width: var(--tc-arn-method-w); padding: var(--tc-space-0-5) 0; border-radius: var(--tc-radius-sm); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-2xs, var(--tc-font-size-xs)); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-none); text-align: center; letter-spacing: var(--tc-caption-tracking); }
.ui-arn__method[data-tone="read"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-arn__method[data-tone="create"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-arn__method[data-tone="change"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-arn__method[data-tone="delete"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-arn__method[data-tone="other"] { background: var(--tc-fill-default); color: var(--tc-text-secondary); }
.ui-arn__name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-arn__name[data-path] { font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); }
.ui-arn__endpoint:has(.ui-arn__deprecated) .ui-arn__name { text-decoration: line-through; color: var(--tc-text-muted); }
.ui-arn__deprecated { flex: none; color: var(--tc-status-warning-fg); font-size: var(--tc-font-size-xs); }
.ui-arn__empty { padding: var(--tc-space-4) var(--tc-space-2); color: var(--tc-text-muted); text-align: center; }

/* Narrow: a narrower method badge */
@container (max-width: 240px) {
  [data-ui="arn"] { --tc-arn-method-w: 44px; }
}
@media (forced-colors: active) {
  .ui-arn__method { border: 1px solid CanvasText; }
  .ui-arn__endpoint--current { outline: 2px solid CanvasText; }
  .ui-arn__paths[aria-pressed="true"] .ui-arn__switch { background: Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="arn"], [data-ui="arn"] * { transition: none !important; }
}
`;
}

if (!customElements.get("tc-api-reference-nav")) customElements.define("tc-api-reference-nav", TcApiReferenceNav);

declare global {
  interface HTMLElementTagNameMap {
    "tc-api-reference-nav": TcApiReferenceNav;
  }
}
