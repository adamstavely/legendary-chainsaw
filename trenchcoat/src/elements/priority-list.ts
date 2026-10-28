import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-priority-list> – a portfolio's topics or projects by priority. Each row has a priority badge (1 is the top tier,
 * named by `tiers`), the name with its owner and team, the momentum as a small line with its change, the coverage as a
 * bar with its share, a pill of what's open ("5 gaps") and how much work is in flight ("3·wk"). Each row carries its
 * health – at risk, watch or on track – in words beside the owner; the chips above the list count each and filter by
 * one. With `grouped`, rows fall under a header per priority: "1 Top priority · 2 · 1 at risk".
 *   · the rows are one tab stop: ↑ / ↓ move between them, Home / End to the ends; Enter or a click fires tc-open
 *   · columns fold away as the element narrows: the momentum line first, then the work count, then the coverage bar
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-priority-list .items=${[{ id: "t1", name: "Neuromorphic Computing", priority: 1, health: "at-risk", coverage: 0.42 }]}></tc-priority-list>
 */

/** A flag: Lucide (ISC, lucide.dev) */
const flagIcon = svg`<path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528"></path>`;

export type PriorityHealth = "at-risk" | "watch" | "on-track";
export type PriorityItem = {
  id: string;
  /** The topic's or project's name */
  name: string;
  /** Who leads it */
  owner?: string;
  /** The team or group it belongs to */
  team?: string;
  /** Its tier, from 1 (the top) to 4; named by `tiers` */
  priority: number;
  health: PriorityHealth;
  /** Recent values for the momentum line, oldest first */
  trend?: number[];
  /** The change over the period as a fraction: -0.14 is ▼ 14% */
  change?: number;
  /** The share covered, from 0 to 1 */
  coverage?: number;
  /** How many are open (gaps, issues, questions) */
  open?: number;
  /** How many pieces of work are in flight */
  work?: number;
};
export type PriorityFilter = PriorityHealth | "all";

/** Details of the events */
export type PriorityOpen = { id: string; item: PriorityItem };
export type PriorityFilterChange = { filter: PriorityFilter };

export const PRIORITY_HEALTHS: PriorityHealth[] = ["at-risk", "watch", "on-track"];
/** The tiers' names used when the page gives none */
export const defaultPriorityTiers: Record<number, string> = { 1: "Top priority", 2: "High", 3: "Medium", 4: "Watching" };
/** The healths' names used when the page gives none */
export const defaultPriorityHealthLabels: Record<PriorityHealth, string> = { "at-risk": "At risk", watch: "Watch", "on-track": "On track" };
let uidCount = 0;

/** The momentum line: the series scaled into a 64 × 20 box */
function spark(values: number[]) {
  const w = 64;
  const hgt = 20;
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;
  const pts = values.map((v, i) => [values.length === 1 ? w / 2 : (i / (values.length - 1)) * (w - 4) + 2, hgt - 3 - ((v - min) / span) * (hgt - 6)]);
  const last = pts[pts.length - 1];
  return svg`<polyline points=${pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ")}></polyline><circle cx=${last[0].toFixed(1)} cy=${last[1].toFixed(1)} r="2.25"></circle>`;
}

/**
 * Topics or projects by priority – a priority badge, name, owner and team, momentum, coverage, what's open and the
 * work in flight – with health filters and optional groups per priority.
 * @tag tc-priority-list
 * @fires tc-open - A row was opened with Enter or a click ({ id, item }: PriorityOpen)
 * @fires tc-filter-change - A health filter was chosen or cleared ({ filter }: PriorityFilterChange); cancelable – prevented, `filter` stays as it was
 */
export class TcPriorityList extends TcElement {
  static override ui = "prl";

  /** The heading, and the list's name */
  @property() accessor heading = "Priorities";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The topics or projects, in the order to show them (within a group when grouped) */
  @property({ attribute: false }) accessor items: PriorityItem[] = [];
  /** Puts the rows under a header per priority */
  @property({ type: Boolean }) accessor grouped = false;
  /** The health shown. Changed by the user unless a tc-filter-change listener calls preventDefault() */
  @property() accessor filter: PriorityFilter = "all";
  /** Shows the health filter chips with their counts */
  @property({ type: Boolean, attribute: "no-filters" }) accessor noFilters = false;
  /** The tiers' names by number, merged over the defaults (Top priority, High, Medium, Watching) */
  @property({ attribute: false }) accessor tiers: Record<number, string> = {};
  /** The healths' names, merged over the defaults (At risk, Watch, On track) */
  @property({ attribute: false }) accessor healthLabels: Partial<Record<PriorityHealth, string>> = {};
  /** The first column's heading */
  @property({ attribute: "name-label" }) accessor nameLabel = "Topic";
  /** What's open, after its count: "5 gaps" */
  @property({ attribute: "open-unit" }) accessor openUnit = "gaps";
  /** What's open when there's one: "1 gap"; `open-unit` when unset */
  @property({ attribute: "open-unit-one" }) accessor openUnitOne: string | undefined = undefined;
  /** The short unit after the work count: "3·wk" */
  @property({ attribute: "work-unit" }) accessor workUnit = "wk";
  /** The work count in words, for screen readers: "3 work items" */
  @property({ attribute: "work-label" }) accessor workLabel = "work items";
  /** Coverage under this share, from 0 to 1, is drawn in the danger colour */
  @property({ type: Number, attribute: "coverage-warn" }) accessor coverageWarn = 0.45;
  /** The language for numbers, e.g. "de"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;
  /** Shown when nothing matches */
  @property() accessor empty = "Nothing to show.";

  @state() private accessor activeId = "";

  private uid = `tc-prl-${++uidCount}`;

  /* ---------- The model ---------- */

  private tier(n: number) {
    return this.tiers[n] ?? defaultPriorityTiers[n] ?? `Priority ${n}`;
  }
  private health(h: PriorityHealth) {
    return this.healthLabels[h] ?? defaultPriorityHealthLabels[h];
  }
  private pct(n: number) {
    return new Intl.NumberFormat(this.locale, { style: "percent", maximumFractionDigits: 0 }).format(n);
  }
  private openText(n: number) {
    return `${n} ${n === 1 ? (this.openUnitOne ?? this.openUnit) : this.openUnit}`;
  }
  /** The rows shown, in display order */
  private get rows() {
    const list = this.items.filter((i) => this.filter === "all" || i.health === this.filter);
    return this.grouped ? [...list].sort((a, b) => a.priority - b.priority) : list;
  }
  private setFilter(next: PriorityFilter) {
    if (next === this.filter) return;
    if (!this.emit<PriorityFilterChange>("tc-filter-change", { filter: next }, { cancelable: true })) return;
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

  /* ---------- Updates ---------- */

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // A filter whose health has no rows left goes back to All
    if (changed.has("items") && this.filter !== "all" && !this.items.some((i) => i.health === this.filter)) this.filter = "all";
  }

  /* ---------- Rendering ---------- */

  private renderBadge(n: number) {
    return html`<span class="ui-prl__badge" data-priority=${n} title=${this.tier(n)} aria-hidden="true">${n}</span>`;
  }

  private renderRow(item: PriorityItem, stop: string) {
    const change = item.change;
    const dir = change === undefined || Math.abs(change) < 0.005 ? "flat" : change > 0 ? "up" : "down";
    const cov = item.coverage === undefined ? undefined : Math.max(0, Math.min(1, item.coverage));
    const sayChange = change === undefined ? "" : dir === "flat" ? "steady" : `${dir} ${this.pct(Math.abs(change))}`;
    return html`<li class="ui-prl__item">
      <button
        type="button"
        class="ui-prl__row"
        data-row=${item.id}
        data-health=${item.health}
        tabindex=${item.id === stop ? 0 : -1}
        @focus=${() => (this.activeId = item.id)}
        @click=${() => {
          this.activeId = item.id;
          this.emit<PriorityOpen>("tc-open", { id: item.id, item });
        }}
      >
        <span class="ui-prl__cell ui-prl__cell--badge">${this.renderBadge(item.priority)}<span class="ui-prl__sr">Priority ${item.priority}, ${this.tier(item.priority)}. </span></span>
        <span class="ui-prl__cell ui-prl__who">
          <span class="ui-prl__name">${item.name}</span>
          <span class="ui-prl__meta">
            ${item.owner || item.team ? html`<span class="ui-prl__owner">${[item.owner, item.team].filter(Boolean).join(" · ")}</span>` : nothing}
            <span class="ui-prl__health" data-health=${item.health}><span class="ui-prl__sr">. </span>${this.health(item.health)}</span>
          </span>
        </span>
        <span class="ui-prl__cell ui-prl__momentum" data-dir=${dir}>
          ${item.trend && item.trend.length > 1 ? html`<svg class="ui-prl__spark" viewBox="0 0 64 20" aria-hidden="true">${spark(item.trend)}</svg>` : nothing}
          ${change === undefined
            ? nothing
            : html`<span class="ui-prl__change"><span class="ui-prl__sr">. Momentum ${sayChange}</span><span aria-hidden="true">${dir === "up" ? "▲" : dir === "down" ? "▼" : "–"}&#8202;${this.pct(Math.abs(change))}</span></span>`}
        </span>
        <span class="ui-prl__cell ui-prl__coverage">
          ${cov === undefined
            ? nothing
            : html`<span class="ui-prl__cov-head"><span class="ui-prl__cov-label" aria-hidden="true">Coverage</span><span class="ui-prl__sr">. Coverage </span><span class="ui-prl__cov-num" ?data-low=${cov < this.coverageWarn}>${this.pct(cov)}</span></span>
                <span class="ui-prl__bar" aria-hidden="true"><span class="ui-prl__bar-fill" ?data-low=${cov < this.coverageWarn} style=${`inline-size: ${(cov * 100).toFixed(1)}%`}></span></span>`}
        </span>
        <span class="ui-prl__cell ui-prl__open-cell">
          ${item.open === undefined ? nothing : html`<span class="ui-prl__open" ?data-none=${item.open === 0}><span class="ui-prl__sr">. </span>${this.openText(item.open)}</span>`}
        </span>
        <span class="ui-prl__cell ui-prl__work">
          ${item.work === undefined ? nothing : html`<span class="ui-prl__sr">. ${item.work} ${this.workLabel}</span><span aria-hidden="true">${item.work}·${this.workUnit}</span>`}
        </span>
      </button>
    </li>`;
  }

  private renderGroupHead(n: number, list: PriorityItem[]) {
    const risk = list.filter((i) => i.health === "at-risk").length;
    return html`<div class="ui-prl__group-head">
      ${this.renderBadge(n)}
      <span class="ui-prl__group-name">${this.tier(n)}</span>
      <span class="ui-prl__group-count">${list.length}</span>
      ${risk ? html`<span class="ui-prl__group-risk">${risk} ${this.health("at-risk").toLowerCase()}</span>` : nothing}
    </div>`;
  }

  private renderFilters() {
    const counts = Object.fromEntries(PRIORITY_HEALTHS.map((h) => [h, this.items.filter((i) => i.health === h).length])) as Record<PriorityHealth, number>;
    return html`<div class="ui-prl__filters" role="group" aria-label="Filter by health">
      ${PRIORITY_HEALTHS.map(
        (h) => html`<button
          type="button"
          class="ui-prl__filter"
          data-filter=${h}
          aria-pressed=${this.filter === h ? "true" : "false"}
          ?disabled=${!counts[h] && this.filter !== h}
          @click=${() => this.setFilter(this.filter === h ? "all" : h)}
        >
          <span class="ui-prl__dot" data-health=${h} aria-hidden="true"></span><span class="ui-prl__filter-count">${counts[h]}</span> ${this.health(h).toLowerCase()}
        </button>`,
      )}
    </div>`;
  }

  private renderList(list: PriorityItem[], stop: string, label?: string) {
    return html`<ul class="ui-prl__list" aria-label=${label ?? nothing} @keydown=${this.onKey}>
      ${repeat(list, (r) => r.id, (r) => this.renderRow(r, stop))}
    </ul>`;
  }

  protected override render() {
    const id = this.uid;
    const rows = this.rows;
    const stop = rows.some((r) => r.id === this.activeId) ? this.activeId : (rows[0]?.id ?? "");
    const tiers = [...new Set(rows.map((r) => r.priority))];
    return html`
      ${cardHead({
        icon: flagIcon,
        title: this.heading,
        subtitle: this.description,
        id: `${id}-title`,
        aside: !this.noFilters && this.items.length ? this.renderFilters() : nothing,
        keepAside: true,
      })}
      <div class="ui-prl__card">
        ${rows.length
          ? html`<div class="ui-prl__columns" aria-hidden="true">
                <span class="ui-prl__col ui-prl__col--name">${this.nameLabel}</span>
                <span class="ui-prl__col ui-prl__col--momentum">Momentum</span>
                <span class="ui-prl__col ui-prl__col--coverage">Coverage</span>
                <span class="ui-prl__col ui-prl__col--open">Open</span>
                <span class="ui-prl__col ui-prl__col--work">Work</span>
              </div>
              ${this.grouped
                ? tiers.map((n) => {
                    const list = rows.filter((r) => r.priority === n);
                    return html`<section class="ui-prl__group" aria-label=${`${this.tier(n)}, ${list.length}`}>${this.renderGroupHead(n, list)}${this.renderList(list, stop)}</section>`;
                  })
                : this.renderList(rows, stop, this.heading)}`
          : html`<p class="ui-prl__empty">${this.empty}</p>`}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="prl"] {
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="prl"] {
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
/* The row's columns, shared by the column headings – the momentum, work and coverage fold away as it narrows */
[data-ui="prl"] { --tc-prl-cols: 28px minmax(0, 1fr) 108px 120px 72px 40px; }
[data-ui="prl"] *, [data-ui="prl"] *::before, [data-ui="prl"] *::after { box-sizing: border-box; }
[data-ui="prl"] p { margin: 0; }
[data-ui="prl"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="prl"] svg { display: block; flex: none; }
:where([data-ui="prl"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="prl"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-prl__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-prl__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* ----- The health filters, in the header ----- */
.ui-prl__filters { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); }
.ui-prl__filter { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2-5) !important; border-radius: var(--tc-radius-full); background: var(--tc-surface-control) !important; box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-prl__filter:hover:not(:disabled) { background: var(--tc-fill-subtle) !important; }
.ui-prl__filter:disabled { cursor: default; opacity: 0.55; }
.ui-prl__filter[aria-pressed="true"] { background: var(--tc-fill-selected) !important; box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-selected); color: var(--tc-text-primary); }
.ui-prl__filter-count { font-variant-numeric: tabular-nums; color: var(--tc-text-primary); }
.ui-prl__dot { width: 7px; height: 7px; border-radius: 50%; background: var(--tc-icon-muted); }
.ui-prl__dot[data-health="at-risk"] { background: var(--tc-status-danger-fg); }
.ui-prl__dot[data-health="watch"] { background: var(--tc-status-warning-fg); }
.ui-prl__dot[data-health="on-track"] { background: var(--tc-status-success-fg); }
/* ----- The column headings ----- */
.ui-prl__columns { display: grid; grid-template-columns: var(--tc-prl-cols); align-items: end; gap: var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-2); border-bottom: var(--tc-hairline) solid var(--tc-divider); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-line-height-tight); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
:where([data-look="clean"], [data-look="clean"] *).ui-prl__columns { padding-top: var(--tc-space-1); }
.ui-prl__col--name { grid-column: 1 / 3; }
.ui-prl__col--open, .ui-prl__col--work { text-align: right; }
/* ----- A group's header ----- */
.ui-prl__group + .ui-prl__group { border-top: var(--tc-hairline) solid var(--tc-border-default); }
.ui-prl__group-head { display: flex; align-items: center; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-1); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-prl__group-name { font-weight: var(--tc-font-weight-strong); color: var(--tc-text-primary); }
.ui-prl__group-count { font-variant-numeric: tabular-nums; }
.ui-prl__group-count::before, .ui-prl__group-risk::before { content: "·"; margin-right: var(--tc-space-2); color: var(--tc-text-muted); }
.ui-prl__group-risk { color: var(--tc-status-danger-fg); }
/* ----- The rows ----- */
.ui-prl__list { padding: var(--tc-space-1) var(--tc-space-1-5) !important; }
.ui-prl__item + .ui-prl__item { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-prl__row { display: grid; grid-template-columns: var(--tc-prl-cols); align-items: center; gap: var(--tc-space-3); width: 100%; min-height: 56px; padding: var(--tc-space-2) var(--tc-space-2-5) !important; border-radius: var(--tc-radius-md); text-align: left; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-prl__row:hover { background: var(--tc-fill-subtle); }
[data-ui="prl"] .ui-prl__row:focus-visible { outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
.ui-prl__cell { min-width: 0; }
/* The priority badge: the top tier in ink, the rest outlined */
.ui-prl__badge { display: inline-grid; place-items: center; width: 22px; height: 22px; border-radius: var(--tc-radius-sm); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-strong); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-none); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
.ui-prl__badge[data-priority="1"] { background: var(--tc-surface-inverse); box-shadow: none; color: var(--tc-text-on-inverse); }
.ui-prl__badge[data-priority="2"] { box-shadow: inset 0 0 0 1.5px var(--tc-text-secondary); color: var(--tc-text-primary); }
.ui-prl__who { display: grid; gap: var(--tc-space-0-5); }
.ui-prl__name { overflow: hidden; font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); text-overflow: ellipsis; white-space: nowrap; }
.ui-prl__meta { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-prl__owner { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-prl__health { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1); white-space: nowrap; }
.ui-prl__health::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.ui-prl__health[data-health="at-risk"] { color: var(--tc-status-danger-fg); }
.ui-prl__health[data-health="watch"] { color: var(--tc-status-warning-fg); }
.ui-prl__health[data-health="on-track"] { color: var(--tc-status-success-fg); }
/* Momentum: the line and the change, green up, red down, with an arrow */
.ui-prl__momentum { display: flex; align-items: center; gap: var(--tc-space-1-5); color: var(--tc-text-muted); }
.ui-prl__momentum[data-dir="up"] { color: var(--tc-status-success-fg); }
.ui-prl__momentum[data-dir="down"] { color: var(--tc-status-danger-fg); }
.ui-prl__spark { width: 52px; height: 20px; overflow: visible; }
.ui-prl__spark polyline { fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linejoin: round; stroke-linecap: round; vector-effect: non-scaling-stroke; }
.ui-prl__spark circle { fill: currentColor; }
.ui-prl__change { font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); white-space: nowrap; font-variant-numeric: tabular-nums; }
/* Coverage: its share over a slim bar, in the danger colour when it's low */
.ui-prl__coverage { display: grid; gap: var(--tc-space-1); }
.ui-prl__cov-head { display: flex; align-items: baseline; justify-content: space-between; gap: var(--tc-space-2); font-size: var(--tc-font-size-2xs); line-height: var(--tc-line-height-tight); }
.ui-prl__cov-label { letter-spacing: var(--tc-caption-tracking); text-transform: uppercase; color: var(--tc-text-muted); }
.ui-prl__cov-num { font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-prl__cov-num[data-low] { color: var(--tc-status-danger-fg); }
.ui-prl__bar { display: block; height: 4px; overflow: hidden; border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); }
.ui-prl__bar-fill { display: block; height: 100%; border-radius: inherit; background: var(--tc-meter-fill); transition: inline-size var(--tc-duration-moderate) var(--tc-ease-move); }
.ui-prl__bar-fill[data-low] { background: var(--tc-status-danger-fg); }
/* What's open: a quiet pill, tinted when there's anything */
.ui-prl__open-cell { justify-self: end; }
.ui-prl__open { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-status-danger-bg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-status-danger-fg); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-prl__open[data-none] { background: var(--tc-fill-default); color: var(--tc-text-muted); }
.ui-prl__work { justify-self: end; font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-prl__empty { padding: var(--tc-space-6) var(--tc-space-4) !important; color: var(--tc-text-muted); text-align: center; }
@container (max-width: 680px) {
  [data-ui="prl"] { --tc-prl-cols: 28px minmax(0, 1fr) 56px 104px 64px 36px; }
  [data-ui="prl"] .ui-prl__spark { display: none; }
}
@container (max-width: 520px) {
  [data-ui="prl"] { --tc-prl-cols: 28px minmax(0, 1fr) 52px 88px 60px; }
  .ui-prl__work, .ui-prl__col--work { display: none; }
}
@container (max-width: 400px) {
  [data-ui="prl"] { --tc-prl-cols: 24px minmax(0, 1fr) 48px 60px; }
  .ui-prl__bar, .ui-prl__cov-label { display: none; }
  .ui-prl__open-cell, .ui-prl__col--open { display: none; }
  .ui-prl__row, .ui-prl__columns { gap: var(--tc-space-2); }
}
@media (forced-colors: active) {
  .ui-prl__bar-fill, .ui-prl__dot, .ui-prl__health::before { background: CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="prl"] *, [data-ui="prl"] *::before, [data-ui="prl"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-priority-list")) customElements.define("tc-priority-list", TcPriorityList);

declare global {
  interface HTMLElementTagNameMap {
    "tc-priority-list": TcPriorityList;
  }
}
