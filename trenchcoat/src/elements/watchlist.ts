import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { initials } from "./internal/util";
import { ifDefined } from "lit/directives/if-defined.js";
import { safeMediaUrl } from "./internal/safe-media";

/*
 * <tc-watchlist> – the people, accounts or entities a team is keeping an eye on, most at risk first. Each row has an
 * avatar (a picture or initials), the name, a reference line (an id, an account number), a group tag (the case or
 * team it belongs to) and a risk badge – Critical, Elevated, Guarded or Low, renamable, always in words as well as
 * colour. The header counts what's shown and can carry a "View all" action; optional filter buttons narrow the list by
 * risk, each with its count.
 *   · the rows are one tab stop: ↑ / ↓ move between them, Home / End to the ends; Enter or a click fires tc-open
 *   · rows are sorted by risk, then name (`sort`); `limit` shows only the first few
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-watchlist .items=${[{ id: "acc-1", name: "Northwind Traders", ref: "ACC-4471", group: "Case 22-1187", risk: "critical" }]}></tc-watchlist>
 */

/** An eye: Lucide (ISC, lucide.dev) */
const eyeIcon = svg`<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path><circle cx="12" cy="12" r="3"></circle>`;
const chevron = html`<svg class="ui-wls__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg>`;

export type WatchRisk = "critical" | "elevated" | "guarded" | "low";
export type WatchItem = {
  id: string;
  /** The person's, account's or entity's name */
  name: string;
  /** A quiet reference under the name: an id, an account number */
  ref?: string;
  /** The case, team or list it belongs to, as a tag */
  group?: string;
  risk: WatchRisk;
  /** A picture's URL; initials of the name otherwise */
  avatar?: string;
  /** Round for a person (default), square for an account or organisation */
  shape?: "round" | "square";
};
export type WatchFilter = WatchRisk | "all";

/** Details of the events */
export type WatchOpen = { id: string; item: WatchItem };
export type WatchFilterChange = { filter: WatchFilter };
export type WatchAction = { action: "view-all" };

export const WATCH_RISKS: WatchRisk[] = ["critical", "elevated", "guarded", "low"];
/** The risks' names used when the page gives none */
export const defaultWatchRiskLabels: Record<WatchRisk, string> = { critical: "Critical", elevated: "Elevated", guarded: "Guarded", low: "Low" };
let uidCount = 0;

/**
 * A watchlist of people, accounts or entities – avatar, name, reference, group and a risk badge – most at risk first,
 * with a count, filters by risk and a View all action.
 * @tag tc-watchlist
 * @fires tc-open - A row was opened with Enter or a click ({ id, item }: WatchOpen)
 * @fires tc-filter-change - A risk filter was chosen ({ filter }: WatchFilterChange); cancelable – prevented, `filter` stays as it was
 * @fires tc-action - The View all action was used ({ action: "view-all" }: WatchAction)
 */
export class TcWatchlist extends TcElement {
  static override ui = "wls";

  /** The heading, and the list's name */
  @property() accessor heading = "Watchlist";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** What's watched */
  @property({ attribute: false }) accessor items: WatchItem[] = [];
  /** "risk": most at risk first, then by name (default) · "name": by name · "none": as given */
  @property() accessor sort: "risk" | "name" | "none" = "risk";
  /** Shows only the first this many rows; all when unset */
  @property({ type: Number }) accessor limit: number | undefined = undefined;
  /** Shows the filter buttons: All and each risk that has rows, with counts */
  @property({ type: Boolean }) accessor filters = false;
  /** The risk shown. Changed by the user unless a tc-filter-change listener calls preventDefault() */
  @property() accessor filter: WatchFilter = "all";
  /** The View all action's text in the header; empty for none */
  @property({ attribute: "view-all" }) accessor viewAll = "View all";
  /** The risks' names, merged over the defaults (Critical, Elevated, Guarded, Low) */
  @property({ attribute: false }) accessor riskLabels: Partial<Record<WatchRisk, string>> = {};
  /** Shown when there's nothing to watch */
  @property() accessor empty = "Nothing on the watchlist.";

  @state() private accessor activeId = "";

  private uid = `tc-wls-${++uidCount}`;

  /* ---------- The model ---------- */

  private label(r: WatchRisk) {
    return this.riskLabels[r] ?? defaultWatchRiskLabels[r];
  }
  private get sorted() {
    const list = [...this.items];
    const byName = (a: WatchItem, b: WatchItem) => a.name.localeCompare(b.name);
    if (this.sort === "risk") list.sort((a, b) => WATCH_RISKS.indexOf(a.risk) - WATCH_RISKS.indexOf(b.risk) || byName(a, b));
    else if (this.sort === "name") list.sort(byName);
    return list;
  }
  /** The rows shown: filtered, sorted and limited */
  private get rows() {
    const list = this.sorted.filter((i) => this.filter === "all" || i.risk === this.filter);
    return this.limit !== undefined && this.limit >= 0 ? list.slice(0, this.limit) : list;
  }

  private setFilter(next: WatchFilter) {
    if (next === this.filter) return;
    if (!this.emit<WatchFilterChange>("tc-filter-change", { filter: next }, { cancelable: true })) return;
    this.filter = next;
  }

  /* ---------- Keyboard ---------- */

  private onKey = (e: KeyboardEvent) => {
    const row = (e.target as HTMLElement).closest<HTMLElement>("[data-row]");
    if (!row || e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
    const rows = this.rows;
    const i = rows.findIndex((r) => r.id === row.dataset.row);
    const to = e.key === "ArrowDown" ? i + 1 : e.key === "ArrowUp" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? rows.length - 1 : null;
    if (to === null) return;
    e.preventDefault();
    const next = rows[Math.max(0, Math.min(rows.length - 1, to))];
    if (!next) return;
    this.activeId = next.id;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-row="${CSS.escape(next.id)}"]`)?.focus());
  };

  private open(item: WatchItem) {
    this.activeId = item.id;
    this.emit<WatchOpen>("tc-open", { id: item.id, item });
  }

  /* ---------- Updates ---------- */

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // A filter whose risk has no rows left goes back to All
    if (this.filter !== "all" && !this.items.some((i) => i.risk === this.filter) && changed.has("items")) this.filter = "all";
  }

  /* ---------- Rendering ---------- */

  private renderRow(item: WatchItem, stop: string) {
    const avatar = item.avatar
      ? html`<img class="ui-wls__pic" src=${ifDefined(safeMediaUrl(item.avatar))} alt="" />`
      : html`<span class="ui-wls__initials">${initials(item.name)}</span>`;
    return html`<li class="ui-wls__item">
      <button type="button" class="ui-wls__row" data-row=${item.id} data-risk=${item.risk} tabindex=${item.id === stop ? 0 : -1} @focus=${() => (this.activeId = item.id)} @click=${() => this.open(item)}>
        <span class="ui-wls__avatar" data-shape=${item.shape ?? "round"} aria-hidden="true">${avatar}</span>
        <span class="ui-wls__who">
          <span class="ui-wls__name">${item.name}</span>
          ${item.ref || item.group
            ? html`<span class="ui-wls__meta">${item.ref ? html`<span class="ui-wls__ref">${item.ref}</span>` : nothing}${item.group ? html`<span class="ui-wls__group">${item.group}</span>` : nothing}</span>`
            : nothing}
        </span>
        <span class="ui-wls__risk" data-risk=${item.risk}><span class="ui-wls__sr">Risk: </span>${this.label(item.risk)}</span>
        ${chevron}
      </button>
    </li>`;
  }

  private renderFilters() {
    const counts = Object.fromEntries(WATCH_RISKS.map((r) => [r, this.items.filter((i) => i.risk === r).length])) as Record<WatchRisk, number>;
    const options: WatchFilter[] = ["all", ...WATCH_RISKS.filter((r) => counts[r] > 0)];
    return html`<div class="ui-wls__filters" role="group" aria-label="Filter by risk">
      ${options.map(
        (f) => html`<button type="button" class="ui-wls__filter" data-filter=${f} aria-pressed=${this.filter === f ? "true" : "false"} @click=${() => this.setFilter(f)}>
          ${f === "all" ? "All" : this.label(f)}<span class="ui-wls__filter-count">${f === "all" ? this.items.length : counts[f]}</span>
        </button>`,
      )}
    </div>`;
  }

  protected override render() {
    const id = this.uid;
    const rows = this.rows;
    const total = this.sorted.filter((i) => this.filter === "all" || i.risk === this.filter).length;
    const stop = rows.some((r) => r.id === this.activeId) ? this.activeId : (rows[0]?.id ?? "");
    return html`
      ${cardHead({
        icon: eyeIcon,
        title: html`${this.heading}<span class="ui-wls__sr">, </span><span class="ui-wls__count">${total}</span>`,
        subtitle: this.description,
        id: `${id}-title`,
        aside: this.viewAll ? html`<button type="button" class="ui-wls__all" @click=${() => this.emit<WatchAction>("tc-action", { action: "view-all" })}>${this.viewAll}</button>` : nothing,
      })}
      <div class="ui-wls__card">
        ${this.filters && this.items.length ? this.renderFilters() : nothing}
        ${rows.length
          ? html`<ul class="ui-wls__list" aria-labelledby=${`${id}-title`} @keydown=${this.onKey}>
              ${repeat(rows, (r) => r.id, (r) => this.renderRow(r, stop))}
            </ul>`
          : html`<p class="ui-wls__empty">${this.empty}</p>`}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="wls"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="wls"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="wls"] *, [data-ui="wls"] *::before, [data-ui="wls"] *::after { box-sizing: border-box; }
[data-ui="wls"] p { margin: 0; }
[data-ui="wls"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="wls"] svg { display: block; flex: none; }
:where([data-ui="wls"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="wls"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-wls__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-wls__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* ----- The header: the count beside the title, View all at the right ----- */
.ui-wls__count { display: inline-flex; align-items: center; height: var(--tc-pill-h); margin-left: var(--tc-space-2); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; vertical-align: middle; }
.ui-wls__all { flex: none; height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2) !important; border-radius: var(--tc-control-radius-sm); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-accent-text); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-wls__all:hover { background: var(--tc-action-ghost-bg-hover); }
/* ----- The filters ----- */
.ui-wls__filters { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); padding: var(--tc-space-3) var(--tc-space-3) 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-wls__filters { padding-top: 0; }
.ui-wls__filter { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2-5) !important; border-radius: var(--tc-radius-full); background: var(--tc-fill-subtle) !important; box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-wls__filter:hover { background: var(--tc-fill-default) !important; }
.ui-wls__filter[aria-pressed="true"] { background: var(--tc-fill-selected) !important; box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-selected); color: var(--tc-text-primary); }
.ui-wls__filter-count { color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
/* ----- The rows ----- */
.ui-wls__list { padding: var(--tc-space-1-5) !important; }
:where([data-look="clean"], [data-look="clean"] *).ui-wls__list { padding-top: var(--tc-space-1) !important; }
.ui-wls__item + .ui-wls__item { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-wls__row { display: flex; align-items: center; gap: var(--tc-space-3); width: 100%; min-height: 52px; padding: var(--tc-space-2) var(--tc-space-2-5) !important; border-radius: var(--tc-radius-md); text-align: left; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-wls__row:hover { background: var(--tc-fill-subtle); }
[data-ui="wls"] .ui-wls__row:focus-visible { outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
.ui-wls__avatar { display: grid; flex: none; place-items: center; width: var(--tc-avatar-md); height: var(--tc-avatar-md); overflow: hidden; border-radius: 50%; background: var(--tc-fill-default); font-size: var(--tc-avatar-font-size); font-weight: var(--tc-avatar-font-weight); color: var(--tc-text-secondary); }
.ui-wls__avatar[data-shape="square"] { border-radius: var(--tc-avatar-radius-agent); }
.ui-wls__pic { width: 100%; height: 100%; object-fit: cover; }
.ui-wls__who { display: grid; flex: 1; min-width: 0; gap: var(--tc-space-0-5); }
.ui-wls__name { overflow: hidden; font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); text-overflow: ellipsis; white-space: nowrap; }
.ui-wls__meta { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-2); min-width: 0; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-wls__ref { font-family: var(--tc-font-mono); letter-spacing: var(--tc-tracking-normal); }
.ui-wls__group { display: inline-flex; align-items: center; padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-xs); background: var(--tc-fill-default); color: var(--tc-text-secondary); }
/* The risk: a pill in its status colours, always in words */
.ui-wls__risk { display: inline-flex; flex: none; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; }
.ui-wls__risk[data-risk="critical"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-wls__risk[data-risk="elevated"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-wls__risk[data-risk="guarded"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-wls__risk[data-risk="low"] { background: var(--tc-fill-default); color: var(--tc-text-secondary); }
.ui-wls__chev { width: 16px; height: 16px; color: var(--tc-icon-muted); }
.ui-wls__empty { padding: var(--tc-space-6) var(--tc-space-4) !important; color: var(--tc-text-muted); text-align: center; }
@container (max-width: 360px) {
  .ui-wls__chev { display: none; }
  .ui-wls__row { gap: var(--tc-space-2); }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="wls"] *, [data-ui="wls"] *::before, [data-ui="wls"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-watchlist")) customElements.define("tc-watchlist", TcWatchlist);

declare global {
  interface HTMLElementTagNameMap {
    "tc-watchlist": TcWatchlist;
  }
}
