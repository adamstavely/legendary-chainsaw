import { html, nothing, svg, type PropertyValues } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
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
 *   · `figures` adds columns of the page's own after Work, e.g. papers last month and this; each row's `figures` fills them
 *   · a row with no `priority` shows its `badge`, a short code, in a neutral badge; `grouped` puts such rows last
 *   · columns fold away as the element narrows, so the name keeps at least 140px: the momentum line first, then the
 *     work count, then the figures and the open pill, then the momentum's change and the coverage bar
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
  /** Its tier, from 1 (the top) to 4; named by `tiers`. A row without one shows its `badge` instead */
  priority?: number;
  /** A short code shown in the badge when there's no priority, e.g. "CEC" */
  badge?: string;
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
  /** Values for the list's `figures` columns, by column id; a missing one leaves its cell empty */
  figures?: Record<string, number | string>;
};
/** A built-in column `hide` can leave out */
/** What `hide` can leave out: the built-in columns, and "health" – the health word under each name */
export type PriorityColumn = "momentum" | "coverage" | "open" | "work" | "health";
const COLUMNS: readonly PriorityColumn[] = ["momentum", "coverage", "open", "work", "health"];

/** One more column after Work, filled from each row's `figures` */
export type PriorityFigureColumn = {
  id: string;
  /** The column's heading, and what screen readers say after a value, e.g. "This mo." */
  label: string;
  /** A short unit after each value, as the work count has: "3·pp" */
  unit?: string;
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
  /** Built-in columns to leave out of the header and the rows – space-separated as an attribute, e.g.
   *  `hide="coverage open work"`; the name and the other columns take the room. "health" leaves the health word out
   *  from under each name (screen readers still hear it); with no owner either, the name stands alone */
  @property({ converter: { fromAttribute: (v: string | null) => (v ?? "").split(/\s+/).filter((c): c is PriorityColumn => (COLUMNS as readonly string[]).includes(c)) } })
  accessor hide: PriorityColumn[] = [];
  /** More columns after Work, in order, filled from each row's `figures` */
  @property({ attribute: false }) accessor figures: PriorityFigureColumn[] = [];
  /** Puts the rows under a header per priority; rows without one come last, under no header */
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
  /** The momentum column's heading, also read before each row's change: "Trend" */
  @property({ attribute: "momentum-label" }) accessor momentumLabel = "Momentum";
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
    return this.grouped ? [...list].sort((a, b) => (a.priority ?? Infinity) - (b.priority ?? Infinity)) : list;
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

  private renderLead(item: PriorityItem) {
    if (item.priority !== undefined) return html`${this.renderBadge(item.priority)}<span class="ui-prl__sr">Priority ${item.priority}, ${this.tier(item.priority)}. </span>`;
    if (item.badge) return html`<span class="ui-prl__badge ui-prl__badge--code" aria-hidden="true">${item.badge}</span><span class="ui-prl__sr">${item.badge}. </span>`;
    return nothing;
  }

  private renderFigure(col: PriorityFigureColumn, item: PriorityItem) {
    const v = item.figures?.[col.id];
    const shown = v === undefined || v === "" ? undefined : typeof v === "number" ? new Intl.NumberFormat(this.locale).format(v) : v;
    return html`<span class="ui-prl__cell ui-prl__fig" data-fig=${col.id}>
      ${shown === undefined ? nothing : html`<span class="ui-prl__sr">. ${shown} ${col.label}</span><span aria-hidden="true">${shown}${col.unit ? `·${col.unit}` : ""}</span>`}
    </span>`;
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
        <span class="ui-prl__cell ui-prl__cell--badge">${this.renderLead(item)}</span>
        <span class="ui-prl__cell ui-prl__who">
          <span class="ui-prl__name">${item.name}</span>
          ${item.owner || item.team || this.shows("health")
            ? html`<span class="ui-prl__meta">
                ${item.owner || item.team ? html`<span class="ui-prl__owner">${[item.owner, item.team].filter(Boolean).join(" · ")}</span>` : nothing}
                ${this.shows("health")
                  ? html`<span class="ui-prl__health" data-health=${item.health}><span class="ui-prl__sr">. </span>${this.health(item.health)}</span>`
                  : html`<span class="ui-prl__sr">. ${this.health(item.health)}</span>`}
              </span>`
            : html`<span class="ui-prl__sr">. ${this.health(item.health)}</span>`}
        </span>
        ${this.shows("momentum") ? html`<span class="ui-prl__cell ui-prl__momentum" data-dir=${dir}>
          ${item.trend && item.trend.length > 1 ? html`<svg class="ui-prl__spark" viewBox="0 0 64 20" aria-hidden="true">${spark(item.trend)}</svg>` : nothing}
          ${change === undefined
            ? nothing
            : html`<span class="ui-prl__change"><span class="ui-prl__sr">. ${this.momentumLabel} ${sayChange}</span><span aria-hidden="true">${dir === "up" ? "▲" : dir === "down" ? "▼" : "–"}&#8202;${this.pct(Math.abs(change))}</span></span>`}
        </span>` : nothing}
        ${this.shows("coverage") ? html`<span class="ui-prl__cell ui-prl__coverage">
          ${cov === undefined
            ? nothing
            : html`<span class="ui-prl__cov-head"><span class="ui-prl__cov-label" aria-hidden="true">Coverage</span><span class="ui-prl__sr">. Coverage </span><span class="ui-prl__cov-num" ?data-low=${cov < this.coverageWarn}>${this.pct(cov)}</span></span>
                <span class="ui-prl__bar" aria-hidden="true"><span class="ui-prl__bar-fill" ?data-low=${cov < this.coverageWarn} style=${`inline-size: ${(cov * 100).toFixed(1)}%`}></span></span>`}
        </span>` : nothing}
        ${this.shows("open") ? html`<span class="ui-prl__cell ui-prl__open-cell">
          ${item.open === undefined ? nothing : html`<span class="ui-prl__open" ?data-none=${item.open === 0}><span class="ui-prl__sr">. </span>${this.openText(item.open)}</span>`}
        </span>` : nothing}
        ${this.shows("work") ? html`<span class="ui-prl__cell ui-prl__work">
          ${item.work === undefined ? nothing : html`<span class="ui-prl__sr">. ${item.work} ${this.workLabel}</span><span aria-hidden="true">${item.work}·${this.workUnit}</span>`}
        </span>` : nothing}
        ${this.figures.map((col) => this.renderFigure(col, item))}
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

  /** Whether a built-in column shows – not left out by `hide` */
  private shows(column: PriorityColumn) {
    return !this.hide?.includes(column);
  }

  protected override render() {
    const id = this.uid;
    const rows = this.rows;
    const stop = rows.some((r) => r.id === this.activeId) ? this.activeId : (rows[0]?.id ?? "");
    const tiers = [...new Set(rows.flatMap((r) => (r.priority === undefined ? [] : [r.priority])))];
    const untiered = rows.filter((r) => r.priority === undefined);
    const figs = this.figures.length;
    const hidden = COLUMNS.filter((c) => !this.shows(c)).join(" ");
    return html`
      ${cardHead({
        icon: flagIcon,
        title: this.heading,
        subtitle: this.description,
        id: `${id}-title`,
        aside: !this.noFilters && this.items.length ? this.renderFilters() : nothing,
        keepAside: true,
      })}
      <div class="ui-prl__frame" data-hide=${ifDefined(hidden || undefined)} ?data-figs=${figs > 0}>
      <div class="ui-prl__card" data-hide=${ifDefined(hidden || undefined)} ?data-figs=${figs > 0} ?data-codes=${this.items.some((i) => i.priority === undefined && i.badge)} style=${`--tc-prl-n: ${figs}`}>
        ${rows.length
          ? html`<div class="ui-prl__columns" aria-hidden="true">
                <span class="ui-prl__col ui-prl__col--name">${this.nameLabel}</span>
                ${this.shows("momentum") ? html`<span class="ui-prl__col ui-prl__col--momentum">${this.momentumLabel}</span>` : nothing}
                ${this.shows("coverage") ? html`<span class="ui-prl__col ui-prl__col--coverage">Coverage</span>` : nothing}
                ${this.shows("open") ? html`<span class="ui-prl__col ui-prl__col--open">Open</span>` : nothing}
                ${this.shows("work") ? html`<span class="ui-prl__col ui-prl__col--work">Work</span>` : nothing}
                ${this.figures.map((c) => html`<span class="ui-prl__col ui-prl__col--fig" data-fig=${c.id}>${c.label}</span>`)}
              </div>
              ${this.grouped
                ? html`${tiers.map((n) => {
                    const list = rows.filter((r) => r.priority === n);
                    return html`<section class="ui-prl__group" aria-label=${`${this.tier(n)}, ${list.length}`}>${this.renderGroupHead(n, list)}${this.renderList(list, stop)}</section>`;
                  })}${untiered.length ? html`<div class="ui-prl__group ui-prl__group--none">${this.renderList(untiered, stop)}</div>` : nothing}`
                : this.renderList(rows, stop, this.heading)}`
          : html`<p class="ui-prl__empty">${this.empty}</p>`}
      </div>
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
  /* The frame reaches past the edge with columns hidden (see .ui-prl__frame); nothing shows there */
  overflow-x: clip;
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
/* The row's columns after the badge, shared by the column headings – the momentum, work, figures and coverage fold
   away as it narrows. The badge's column widens for codes; the page's figures add a column each */
[data-ui="prl"] { --tc-prl-cols: minmax(0, 1fr) 108px 120px 72px 40px; }
.ui-prl__card { --tc-prl-lead: 28px; --tc-prl-fig-w: 56px; --tc-prl-c-momentum: 108px; --tc-prl-c-coverage: 120px; --tc-prl-c-open: 72px; --tc-prl-c-work: 40px; }
.ui-prl__card[data-codes] { --tc-prl-lead: 40px; }
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
.ui-prl__columns { display: grid; grid-template-columns: var(--tc-prl-lead) var(--tc-prl-cols); align-items: end; gap: var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-2); border-bottom: var(--tc-hairline) solid var(--tc-divider); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-line-height-tight); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
:where([data-look="clean"], [data-look="clean"] *).ui-prl__columns { padding-top: var(--tc-space-1); }
.ui-prl__col { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-prl__col--name { grid-column: 1 / 3; }
.ui-prl__col--open, .ui-prl__col--work, .ui-prl__col--fig { text-align: right; }
.ui-prl__card[data-figs] :is(.ui-prl__row, .ui-prl__columns) { grid-template-columns: var(--tc-prl-lead) var(--tc-prl-cols) repeat(var(--tc-prl-n), var(--tc-prl-fig-w)); }
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
.ui-prl__row { display: grid; grid-template-columns: var(--tc-prl-lead) var(--tc-prl-cols); align-items: center; gap: var(--tc-space-3); width: 100%; min-height: 56px; padding: var(--tc-space-2) var(--tc-space-2-5) !important; border-radius: var(--tc-radius-md); text-align: left; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-prl__row:hover { background: var(--tc-fill-subtle); }
[data-ui="prl"] .ui-prl__row:focus-visible { outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
.ui-prl__cell { min-width: 0; }
/* The priority badge: the top tier in ink, the rest outlined */
.ui-prl__badge { display: inline-grid; place-items: center; width: 22px; height: 22px; border-radius: var(--tc-radius-sm); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-strong); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-none); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
.ui-prl__badge[data-priority="1"] { background: var(--tc-surface-inverse); box-shadow: none; color: var(--tc-text-on-inverse); }
.ui-prl__badge--code { width: auto; min-width: 22px; max-width: 100%; padding: 0 var(--tc-space-1); overflow: hidden; background: var(--tc-fill-default); box-shadow: none; font-size: var(--tc-font-size-2xs); letter-spacing: 0; text-overflow: clip; white-space: nowrap; }
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
.ui-prl__work, .ui-prl__fig { justify-self: end; font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-prl__empty { padding: var(--tc-space-6) var(--tc-space-4) !important; color: var(--tc-text-muted); text-align: center; }
/* The name keeps at least 140px from 300px up: each step folds columns away before it gets narrower */
@container (max-width: 760px) {
  /* With figures (two, say), more goes sooner to make room for them: the line, the work count and the open pill */
  .ui-prl__card[data-figs] { --tc-prl-cols: minmax(0, 1fr) 64px 96px; --tc-prl-c-momentum: 64px; --tc-prl-c-coverage: 96px; --tc-prl-c-open: ; --tc-prl-c-work: ; }
  [data-figs] :is(.ui-prl__spark, .ui-prl__work, .ui-prl__col--work, .ui-prl__open-cell, .ui-prl__col--open) { display: none; }
}
@container (max-width: 680px) {
  .ui-prl__card { --tc-prl-cols: minmax(0, 1fr) 68px 104px 64px 36px; --tc-prl-c-momentum: 68px; --tc-prl-c-coverage: 104px; --tc-prl-c-open: 64px; --tc-prl-c-work: 36px; }
  [data-ui="prl"] .ui-prl__spark { display: none; }
}
@container (max-width: 560px) {
  .ui-prl__card { --tc-prl-cols: minmax(0, 1fr) 64px 88px 60px; --tc-prl-c-momentum: 64px; --tc-prl-c-coverage: 88px; --tc-prl-c-open: 60px; --tc-prl-c-work: ; }
  .ui-prl__card[data-figs] { --tc-prl-cols: minmax(0, 1fr) 64px 88px; --tc-prl-c-open: ; }
  .ui-prl__work, .ui-prl__col--work { display: none; }
}
@container (max-width: 540px) {
  .ui-prl__card[data-figs] :is(.ui-prl__row, .ui-prl__columns) { grid-template-columns: var(--tc-prl-lead) var(--tc-prl-cols); }
  .ui-prl__fig, .ui-prl__col--fig { display: none; }
}
@container (max-width: 480px) {
  .ui-prl__card, .ui-prl__card[data-figs] { --tc-prl-cols: minmax(0, 1fr) 64px 88px; --tc-prl-c-momentum: 64px; --tc-prl-c-coverage: 88px; --tc-prl-c-open: ; --tc-prl-c-work: ; }
  .ui-prl__open-cell, .ui-prl__col--open { display: none; }
}
@container (max-width: 400px) {
  .ui-prl__card, .ui-prl__card[data-figs] { --tc-prl-lead: 24px; --tc-prl-cols: minmax(0, 1fr) 60px; --tc-prl-c-momentum: ; --tc-prl-c-coverage: 60px; --tc-prl-c-open: ; --tc-prl-c-work: ; }
  .ui-prl__card[data-codes] { --tc-prl-lead: 36px; }
  .ui-prl__momentum, .ui-prl__col--momentum { display: none; }
  .ui-prl__bar, .ui-prl__cov-label { display: none; }
  .ui-prl__row, .ui-prl__columns { gap: var(--tc-space-2); }
}
/* The folding steps above measure the frame, not the element. With columns hidden, the frame is as wide as the element
   plus the room those columns would take (and the card inside it as wide as the element), so what's left folds only
   when it runs out of room itself – a list showing its name, momentum and two figures keeps them in 450px. A hidden
   column counts the width it has where the figures fold (the 560px step), so the name never gets less room than it
   would with every column shown */
.ui-prl__frame {
  --tc-prl-freed: calc(var(--tc-prl-f-momentum, 0px) + var(--tc-prl-f-coverage, 0px) + var(--tc-prl-f-open, 0px) + var(--tc-prl-f-work, 0px));
  container-type: inline-size;
  width: calc(100% + var(--tc-prl-freed));
  margin-inline-end: calc(-1 * var(--tc-prl-freed));
}
.ui-prl__frame > .ui-prl__card { width: calc(100% - var(--tc-prl-freed)); }
/* Each column's width at that step and the gap before it; the work count is already gone there, and so is the open pill
   with figures */
.ui-prl__frame[data-hide~="momentum"] { --tc-prl-f-momentum: calc(64px + var(--tc-space-3)); }
.ui-prl__frame[data-hide~="coverage"] { --tc-prl-f-coverage: calc(88px + var(--tc-space-3)); }
.ui-prl__frame[data-hide~="open"]:not([data-figs]) { --tc-prl-f-open: calc(60px + var(--tc-space-3)); }
/* hide: the columns left out lose their tracks too, at every width, so the name and the rest take the room. Each
   column's width follows the folding steps above (--tc-prl-c-*, empty when folded away); after them, so they win */
.ui-prl__card[data-hide] { --tc-prl-cols: minmax(0, 1fr) var(--tc-prl-c-momentum) var(--tc-prl-c-coverage) var(--tc-prl-c-open) var(--tc-prl-c-work); }
.ui-prl__card[data-hide~="momentum"] { --tc-prl-c-momentum: ; }
.ui-prl__card[data-hide~="coverage"] { --tc-prl-c-coverage: ; }
.ui-prl__card[data-hide~="open"] { --tc-prl-c-open: ; }
.ui-prl__card[data-hide~="work"] { --tc-prl-c-work: ; }
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
