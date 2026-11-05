import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-route-map> – an app's pages, as an indented list that follows the paths: each route with its path in mono (with
 * `:params` picked out), a status mark and word, how long it took to load and when it was last visited. Pressing a
 * route chooses it and fires tc-open, so the page can show it in a preview. Status chips with counts filter the list;
 * the routes above a match stay, quieter, so the shape holds.
 *   · the rows are one tab stop: ↑ / ↓ move, Home / End go to the ends, Enter or Space opens
 *   · "last visited" counts against `now`, or the element's own clock when `now` isn't given
 *   · narrow, the last-visited column hides
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-route-map .routes=${[{ id: "home", path: "/", status: "ok" }]}></tc-route-map>
 */

export type RouteStatus = "ok" | "slow" | "error" | "unvisited";
export type RouteItem = {
  id: string;
  /** Such as "/grants/:id"; a child's path includes its parent's */
  path: string;
  /** A name for people, such as "Grant details" */
  name?: string;
  status: RouteStatus;
  /** When it was last visited, as an ISO date or epoch ms */
  lastVisited?: string | number;
  /** How long it took to load, in ms */
  loadMs?: number;
  children?: RouteItem[];
};
export type RouteSelectedChange = { selected: string | null; route: RouteItem | null };
export type RouteStatusesChange = { statuses: RouteStatus[] };
export type RouteOpen = { id: string; route: RouteItem };
export type RouteMapLabels = Record<RouteStatus, string> & { filter: string; empty: string; noMatches: string; never: string; opening: string; keys: string };
export const defaultRouteMapLabels: RouteMapLabels = {
  ok: "OK",
  slow: "Slow",
  error: "Error",
  unvisited: "Not visited",
  filter: "Filter by status",
  empty: "No routes",
  noMatches: "No routes with this status",
  never: "Never",
  opening: "Opening",
  keys: "Up and down arrows move, Enter opens",
};

const STATUSES: RouteStatus[] = ["ok", "slow", "error", "unvisited"];
/** A status from data it doesn't know (a typo, a newer server) counts as not visited, not as a broken count */
const statusOf = (route: RouteItem): RouteStatus => (STATUSES.includes(route.status) ? route.status : "unvisited");

/* Icons: Lucide (ISC, lucide.dev) – route, circle-check, clock, circle-x, circle-dashed */
const headIcon = svg`<circle cx="6" cy="19" r="3"></circle><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"></path><circle cx="18" cy="5" r="3"></circle>`;
const MARK: Record<RouteStatus, TemplateResult> = {
  ok: svg`<circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path>`,
  slow: svg`<circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path>`,
  error: svg`<circle cx="12" cy="12" r="10"></circle><path d="m15 9-6 6"></path><path d="m9 9 6 6"></path>`,
  unvisited: svg`<path d="M10.1 2.18a9.93 9.93 0 0 1 3.8 0"></path><path d="M17.6 3.71a9.95 9.95 0 0 1 2.69 2.7"></path><path d="M21.82 10.1a9.93 9.93 0 0 1 0 3.8"></path><path d="M20.29 17.6a9.95 9.95 0 0 1-2.7 2.69"></path><path d="M13.9 21.82a9.94 9.94 0 0 1-3.8 0"></path><path d="M6.4 20.29a9.95 9.95 0 0 1-2.69-2.7"></path><path d="M2.18 13.9a9.93 9.93 0 0 1 0-3.8"></path><path d="M3.71 6.4a9.95 9.95 0 0 1 2.7-2.69"></path>`,
};

type Row = { route: RouteItem; level: number; parentPath: string; context: boolean };

const visitedAt = (r: RouteItem) => (r.lastVisited === undefined ? undefined : typeof r.lastVisited === "number" ? r.lastVisited : Date.parse(r.lastVisited));

let nextId = 0;

/**
 * An app's routes as an indented list, with status, load time and last visit, filterable by status; pressing one opens it.
 * @tag tc-route-map
 * @fires tc-selected-change - A route was pressed ({ selected, route }: RouteSelectedChange); cancelable – prevented, `selected` stays as it was
 * @fires tc-statuses-change - A status chip was toggled ({ statuses }: RouteStatusesChange); cancelable – prevented, `statuses` stays as it was
 * @fires tc-open - A route was clicked, or Enter or Space pressed on it ({ id, route }: RouteOpen); cancelable – prevented, nothing is announced
 */
export class TcRouteMap extends TcElement {
  static override ui = "rmap";

  /** The heading; empty leaves the header out */
  @property() accessor heading = "Routes";
  /** Small text under the heading – the site or environment */
  @property() accessor description = "";
  /** The routes; children are indented under their parent */
  @property({ attribute: false }) accessor routes: RouteItem[] = [];
  /** The chosen route's id, or null */
  @property() accessor selected: string | null = null;
  /** The statuses shown; empty shows every route */
  @property({ attribute: false }) accessor statuses: RouteStatus[] = [];
  /** The time "last visited" counts to, in epoch ms; unset, the element keeps its own clock */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** Height in px at which the list scrolls; 0 for no limit */
  @property({ type: Number, attribute: "max-height" }) accessor maxHeight = 0;
  /** Renames the words it uses */
  @property({ attribute: false }) accessor labels: Partial<RouteMapLabels> = {};
  /** The language for numbers and times, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  @state() private accessor active: string | null = null;
  @state() private accessor clock = 0;
  @state() private accessor announcement = "";

  private rows: Row[] = [];
  private counts: Record<RouteStatus, number> = { ok: 0, slow: 0, error: 0, unvisited: 0 };
  private timer: ReturnType<typeof setInterval> | undefined;
  private uid = `tc-route-map-${++nextId}`;

  private get words() {
    return { ...defaultRouteMapLabels, ...this.labels };
  }
  private get time() {
    return this.now ?? this.clock;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.tick();
  }
  override disconnectedCallback() {
    super.disconnectedCallback();
    this.stopClock();
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const counts: Record<RouteStatus, number> = { ok: 0, slow: 0, error: 0, unvisited: 0 };
    const shown = new Set(this.statuses);
    const rows: Row[] = [];
    // A route shows when it matches, or – quieter – when something under it does
    const walk = (routes: RouteItem[], level: number, parentPath: string): boolean => {
      let any = false;
      for (const route of routes) {
        const status = statusOf(route);
        counts[status]++;
        const at = rows.length;
        const match = !shown.size || shown.has(status);
        const below = route.children ? walk(route.children, level + 1, route.path) : false;
        if (match || below) {
          rows.splice(at, 0, { route, level, parentPath, context: !match });
          any = true;
        }
      }
      return any;
    };
    walk(this.routes, 0, "");
    this.rows = rows;
    this.counts = counts;
    if (!rows.some((r) => r.route.id === this.active)) this.active = rows.find((r) => r.route.id === this.selected && !r.context)?.route.id ?? rows.find((r) => !r.context)?.route.id ?? rows[0]?.route.id ?? null;
    if (changed.has("now") || changed.has("routes")) this.tick();
  }

  /** Runs the clock only when it's needed: no `now`, and something with a last visit */
  private tick() {
    const any = (rs: RouteItem[]): boolean => rs.some((r) => r.lastVisited !== undefined || (r.children ? any(r.children) : false));
    if (!(this.isConnected && this.now === undefined && any(this.routes))) return this.stopClock();
    if (this.timer) return;
    const read = () => {
      // The element's own clock, when the page gives no `now`
      this.clock = Date.now();
    };
    read();
    this.timer = setInterval(read, 30_000);
  }
  private stopClock() {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  private ago(at: number) {
    const s = Math.round((at - this.time) / 1000);
    const rtf = new Intl.RelativeTimeFormat(this.locale, { numeric: "auto", style: "short" });
    // The unit is picked from the rounded value, so 59 min 50 s reads "1 hr. ago", not "60 min. ago"
    const min = Math.round(s / 60);
    const hr = Math.round(s / 3600);
    if (Math.abs(s) < 60) return rtf.format(s, "second");
    if (Math.abs(min) < 60) return rtf.format(min, "minute");
    if (Math.abs(hr) < 24) return rtf.format(hr, "hour");
    return rtf.format(Math.round(s / 86400), "day");
  }

  private load(ms: number) {
    const f = (v: number, d: number) => new Intl.NumberFormat(this.locale, { maximumFractionDigits: d }).format(v);
    return ms >= 1000 ? `${f(ms / 1000, 1)} s` : `${f(ms, 0)} ms`;
  }

  private press(row: Row) {
    const { route } = row;
    this.active = route.id;
    if (route.id !== this.selected && this.emit<RouteSelectedChange>("tc-selected-change", { selected: route.id, route }, { cancelable: true })) this.selected = route.id;
    if (this.emit<RouteOpen>("tc-open", { id: route.id, route }, { cancelable: true })) this.announcement = `${this.words.opening} ${route.path}`;
  }

  private toggleStatus(status: RouteStatus) {
    const statuses = this.statuses.includes(status) ? this.statuses.filter((s) => s !== status) : STATUSES.filter((s) => s === status || this.statuses.includes(s));
    if (this.emit<RouteStatusesChange>("tc-statuses-change", { statuses }, { cancelable: true })) this.statuses = statuses;
  }

  private async focusRow(id: string) {
    this.active = id;
    await this.updateComplete;
    this.querySelector<HTMLElement>(`.ui-rmap__row[data-id="${CSS.escape(id)}"]`)?.focus();
  }

  private onKey = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const rows = this.rows;
    const i = rows.findIndex((r) => r.route.id === this.active);
    let to: number | undefined;
    switch (e.key) {
      case "ArrowDown":
        to = Math.min(rows.length - 1, i + 1);
        break;
      case "ArrowUp":
        to = Math.max(0, i - 1);
        break;
      case "Home":
        to = 0;
        break;
      case "End":
        to = rows.length - 1;
        break;
      default:
        return;
    }
    e.preventDefault();
    if (rows[to]) void this.focusRow(rows[to].route.id);
  };

  /** The path with its parent's part quieter and each `:param` picked out */
  private path(row: Row) {
    const { path } = row.route;
    const own = row.parentPath && path.startsWith(row.parentPath) && path !== row.parentPath ? path.slice(row.parentPath.length) : path;
    const lead = path.slice(0, path.length - own.length);
    const parts = own.split(/(:[A-Za-z_][\w]*|\*)/);
    return html`${lead ? html`<span class="ui-rmap__lead">${lead}</span>` : nothing}${parts.map((p) => (p.startsWith(":") || p === "*" ? html`<span class="ui-rmap__param">${p}</span>` : p))}`;
  }

  private row(r: Row) {
    const w = this.words;
    const { route } = r;
    const at = visitedAt(route);
    return html`<li class="ui-rmap__item">
      <button
        type="button"
        class="ui-rmap__row"
        data-id=${route.id}
        data-status=${statusOf(route)}
        ?data-context=${r.context}
        aria-current=${route.id === this.selected ? "true" : "false"}
        tabindex=${route.id === this.active ? 0 : -1}
        style=${styleMap({ "--tc-rmap-level": String(r.level) })}
        @click=${() => this.press(r)}
      >
        <span class="ui-rmap__where">
          <span class="ui-rmap__path">${this.path(r)}</span>${route.name ? html`<span class="ui-rmap__name">${route.name}</span>` : nothing}
        </span>
        <span class="ui-rmap__status"><svg class="ui-rmap__mark" viewBox="0 0 24 24" aria-hidden="true">${MARK[statusOf(route)]}</svg>${w[statusOf(route)]}</span>
        <span class="ui-rmap__load">${route.loadMs !== undefined ? this.load(route.loadMs) : html`<span aria-hidden="true">–</span>`}</span>
        <span class="ui-rmap__visited">${at !== undefined && Number.isFinite(at) ? this.ago(at) : html`<span aria-hidden="true">–</span> <span class="ui-rmap__sr">${w.never}</span>`}</span>
      </button>
    </li>`;
  }

  protected override render() {
    const w = this.words;
    const total = STATUSES.reduce((n, s) => n + this.counts[s], 0);
    const chips = total
      ? html`<div class="ui-rmap__chips" role="group" aria-label=${w.filter}>
          ${STATUSES.filter((s) => this.counts[s] || this.statuses.includes(s)).map(
            (s) => html`<button type="button" class="ui-rmap__chip" data-status=${s} aria-pressed=${this.statuses.includes(s) ? "true" : "false"} @click=${() => this.toggleStatus(s)}>
              <svg class="ui-rmap__mark" viewBox="0 0 24 24" aria-hidden="true">${MARK[s]}</svg>${w[s]} <span class="ui-rmap__n">${this.counts[s]}</span>
            </button>`,
          )}
        </div>`
      : nothing;
    const list = this.rows.length
      ? html`<div class="ui-rmap__scroll" style=${styleMap({ maxHeight: this.maxHeight ? `${this.maxHeight}px` : undefined })}>
          <ul class="ui-rmap__list" aria-label=${this.heading || "Routes"} aria-describedby="${this.uid}-keys" @keydown=${this.onKey}>${this.rows.map((r) => this.row(r))}</ul>
        </div>`
      : html`<p class="ui-rmap__empty">${total ? w.noMatches : w.empty}</p>`;
    return html`${this.heading ? cardHead({ icon: headIcon, title: this.heading, subtitle: this.description }) : nothing}
      <div class="ui-rmap__card">${chips}${list}</div>
      <span class="ui-rmap__sr" id="${this.uid}-keys">${w.keys}</span>
      <span class="ui-rmap__sr" role="status">${this.announcement}</span>`;
  }

  static override css = /* css */ `
[data-ui="rmap"] {
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
  --tc-rmap-indent: var(--tc-space-4);
}
[data-ui="rmap"] *, [data-ui="rmap"] *::before, [data-ui="rmap"] *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="rmap"] { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="rmap"] .ui-rmap__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="rmap"] { border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
.ui-rmap__card { overflow: hidden; }
.ui-rmap__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
:where([data-ui="rmap"]) button { margin: 0; padding: 0; border: 0; background: none; color: inherit; font: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="rmap"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(-1 * var(--tc-focus-ring-width)); }

.ui-rmap__chips { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-1); }
.ui-rmap__chip { display: inline-flex; align-items: center; gap: var(--tc-space-1); min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2); border-radius: var(--tc-pill-radius); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); }
.ui-rmap__chip:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-rmap__chip[aria-pressed="true"] { background: var(--tc-fill-selected); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-selected); color: var(--tc-text-primary); }
.ui-rmap__n { color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-rmap__chip[aria-pressed="true"] .ui-rmap__n { color: var(--tc-text-secondary); }

.ui-rmap__scroll { overflow: auto; overscroll-behavior: contain; padding: var(--tc-space-1); }
.ui-rmap__list { display: grid; margin: 0; padding: 0; list-style: none; }
.ui-rmap__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 7.5rem 4.5rem 6.5rem;
  align-items: center;
  gap: var(--tc-space-3);
  width: 100%;
  min-height: var(--tc-control-h-md);
  padding: var(--tc-space-1) var(--tc-space-2) var(--tc-space-1) calc(var(--tc-space-2) + var(--tc-rmap-level) * var(--tc-rmap-indent));
  border-radius: var(--tc-radius-sm);
}
.ui-rmap__row:hover { background: var(--tc-fill-subtle); }
.ui-rmap__row[aria-current="true"] { background: var(--tc-fill-selected); }
.ui-rmap__where { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0 var(--tc-space-2); min-width: 0; }
.ui-rmap__path { min-width: 0; overflow: hidden; color: var(--tc-text-primary); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); text-overflow: ellipsis; white-space: nowrap; }
.ui-rmap__lead { color: var(--tc-text-muted); }
/* On the chosen row's tint the quiet text steps up a shade, to keep its contrast */
.ui-rmap__row[aria-current="true"] :is(.ui-rmap__lead, .ui-rmap__name) { color: var(--tc-text-secondary); }
.ui-rmap__param { color: var(--tc-syntax-keyword); }
.ui-rmap__name { min-width: 0; overflow: hidden; color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); text-overflow: ellipsis; white-space: nowrap; }
.ui-rmap__row[data-context] .ui-rmap__path, .ui-rmap__row[data-context] .ui-rmap__status { color: var(--tc-text-muted); }
.ui-rmap__status { display: inline-flex; align-items: center; gap: var(--tc-space-1); color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); white-space: nowrap; }
.ui-rmap__mark { flex: none; width: var(--tc-space-3-5); height: var(--tc-space-3-5); fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
[data-status="ok"] > .ui-rmap__mark, .ui-rmap__row[data-status="ok"]:not([data-context]) .ui-rmap__status { color: var(--tc-status-success-fg); }
[data-status="slow"] > .ui-rmap__mark, .ui-rmap__row[data-status="slow"]:not([data-context]) .ui-rmap__status { color: var(--tc-status-warning-fg); }
[data-status="error"] > .ui-rmap__mark, .ui-rmap__row[data-status="error"]:not([data-context]) .ui-rmap__status { color: var(--tc-status-danger-fg); }
.ui-rmap__row[data-status="error"]:not([data-context]) .ui-rmap__status { font-weight: var(--tc-font-weight-medium); }
.ui-rmap__load, .ui-rmap__visited { color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; text-align: right; white-space: nowrap; }
.ui-rmap__empty { margin: 0; padding: var(--tc-space-6) var(--tc-space-3); color: var(--tc-text-muted); text-align: center; }
@container (max-width: 30rem) {
  .ui-rmap__row { grid-template-columns: minmax(0, 1fr) auto auto; gap: var(--tc-space-2); }
  .ui-rmap__visited { display: none; }
  .ui-rmap__name { display: none; }
}
@media (forced-colors: active) {
  .ui-rmap__row[aria-current="true"], .ui-rmap__chip[aria-pressed="true"] { outline: var(--tc-hairline) solid Highlight; }
}
`;
}

if (!customElements.get("tc-route-map")) customElements.define("tc-route-map", TcRouteMap);
declare global {
  interface HTMLElementTagNameMap {
    "tc-route-map": TcRouteMap;
  }
}
