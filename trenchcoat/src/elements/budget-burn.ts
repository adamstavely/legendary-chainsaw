import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { initials } from "./internal/util";

/*
 * <tc-budget-burn> – how fast each budget is being spent: a row per item (a topic, a project) with spent against
 * budget ("$1.9M / $3.8M"), the burn as a share and a bar, the people on it and their initials, and an optional priority
 * badge. With `period` – how far through the year or project we are, 0 to 1 – a marker on each bar shows where spend
 * should be by now, and the row says "Ahead of pace", "On pace" or "Behind pace" in words. The header totals what's
 * allocated, spent and committed; a segmented control sorts by burn or by budget.
 *   · the rows are one tab stop: ↑ / ↓ / Home / End move between them, Enter or a click opens one (tc-open)
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-budget-burn period="0.45" .items=${[{ id: "nc", label: "Neuromorphic Computing", budget: 3.8e6, spent: 1.9e6 }]}></tc-budget-burn>
 */

/** A flame: Lucide (ISC, lucide.dev) */
const flameIcon = svg`<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>`;

export type BurnItem = {
  id: string;
  /** What's being funded, e.g. "Neuromorphic Computing" */
  label: string;
  /** Who leads it, shown under the name */
  owner?: string;
  /** The budget, in `currency` */
  budget: number;
  /** Spent so far, in `currency` */
  spent: number;
  /** Under contract but not yet spent, in `currency`; adds to the header's committed total */
  committed?: number;
  /** The people on it, in `people-unit` */
  people?: number;
  /** The team's names; each shows as initials */
  team?: string[];
  /** A short priority mark, e.g. "1" or "P1" */
  priority?: string;
};
export type BurnSort = "burn" | "budget";
export type BurnPace = "ahead" | "on" | "behind";

/** Details of the events */
export type BurnSortChange = { sort: BurnSort };
export type BurnOpen = { id: string; item: BurnItem };

let uidCount = 0;

/**
 * Budget burn: each item's spend against its budget, with a pace marker and words for ahead, on or behind pace, its
 * people and team, totals in the header and a sort by burn or budget.
 * @tag tc-budget-burn
 * @fires tc-sort-change - The sort was changed ({ sort }: BurnSortChange); cancelable – prevented, `sort` stays as it was
 * @fires tc-open - A row was opened ({ id, item }: BurnOpen)
 */
export class TcBudgetBurn extends TcElement {
  static override ui = "bburn";

  /** The heading, and the list's name */
  @property() accessor heading = "Budget burn";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The items */
  @property({ attribute: false }) accessor items: BurnItem[] = [];
  /** How far through the period we are, from 0 to 1; unset hides the pace marker and words */
  @property({ type: Number }) accessor period: number | undefined = undefined;
  /** How far, as a share of the budget, spend may sit from the pace before it's ahead or behind */
  @property({ type: Number }) accessor tolerance = 0.1;
  /** "budget" puts the biggest budgets first, "burn" the highest burn. Changed by the user unless a tc-sort-change listener calls preventDefault() */
  @property() accessor sort: BurnSort = "budget";
  /** The budget's currency, an ISO 4217 code */
  @property() accessor currency = "USD";
  /** The unit people are counted in: "FTE", "people" */
  @property({ attribute: "people-unit" }) accessor peopleUnit = "FTE";
  /** The language for numbers, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  /** The row holding the tab stop */
  @state() private accessor active: string | null = null;
  @state() private accessor announce = "";

  private uid = `tc-bburn-${++uidCount}`;

  /* ---------- The model ---------- */

  private burnOf(it: BurnItem) {
    return it.budget > 0 ? Math.max(0, it.spent) / it.budget : 0;
  }
  private paceOf(it: BurnItem): BurnPace | null {
    if (this.period === undefined) return null;
    const gap = this.burnOf(it) - Math.max(0, Math.min(1, this.period));
    const tol = Math.max(0, this.tolerance);
    return gap > tol ? "ahead" : gap < -tol ? "behind" : "on";
  }
  private get rows() {
    const key = this.sort === "burn" ? (it: BurnItem) => this.burnOf(it) : (it: BurnItem) => it.budget;
    return [...this.items].sort((a, b) => key(b) - key(a));
  }
  private money(v: number) {
    try {
      return new Intl.NumberFormat(this.locale, { style: "currency", currency: this.currency, notation: "compact", maximumFractionDigits: 1 }).format(v);
    } catch {
      return new Intl.NumberFormat(this.locale, { notation: "compact", maximumFractionDigits: 1 }).format(v);
    }
  }
  private pct(v: number) {
    return new Intl.NumberFormat(this.locale, { style: "percent", maximumFractionDigits: 0 }).format(v);
  }
  private num(v: number) {
    return new Intl.NumberFormat(this.locale, { maximumFractionDigits: 1 }).format(v);
  }
  private paceWords(p: BurnPace) {
    return p === "ahead" ? "Ahead of pace" : p === "behind" ? "Behind pace" : "On pace";
  }

  private setSort(next: BurnSort) {
    if (next === this.sort) return;
    if (!this.emit<BurnSortChange>("tc-sort-change", { sort: next }, { cancelable: true })) return;
    this.sort = next;
    this.announce = next === "burn" ? "Sorted by burn" : "Sorted by budget";
  }

  private open(it: BurnItem) {
    this.emit<BurnOpen>("tc-open", { id: it.id, item: it });
  }

  /* ---------- Keyboard ---------- */

  private get stop() {
    const ids = this.rows.map((it) => it.id);
    return this.active && ids.includes(this.active) ? this.active : (ids[0] ?? null);
  }

  private onKey = (e: KeyboardEvent) => {
    const row = (e.target as Element).closest<HTMLElement>("[data-id]");
    if (!row || e.isComposing || e.altKey || e.ctrlKey || e.metaKey) return;
    const ids = this.rows.map((it) => it.id);
    const at = ids.indexOf(row.dataset.id!);
    const last = ids.length - 1;
    const to = e.key === "ArrowDown" ? Math.min(last, at + 1) : e.key === "ArrowUp" ? Math.max(0, at - 1) : e.key === "Home" ? 0 : e.key === "End" ? last : -1;
    if (to < 0) return;
    e.preventDefault();
    this.active = ids[to];
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-id="${CSS.escape(ids[to])}"]`)?.focus());
  };

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (this.active !== null && !this.items.some((it) => it.id === this.active)) this.active = null;
  }

  /* ---------- Rendering ---------- */

  private renderRow(it: BurnItem) {
    const burn = this.burnOf(it);
    const pace = this.paceOf(it);
    const period = this.period === undefined ? undefined : Math.max(0, Math.min(1, this.period));
    const sr = [
      `${it.label}${it.owner ? `, ${it.owner}` : ""}`,
      `${this.money(it.spent)} of ${this.money(it.budget)} spent, ${this.pct(burn)}`,
      pace ? this.paceWords(pace) : "",
      it.people !== undefined ? `${this.num(it.people)} ${this.peopleUnit}` : "",
      it.priority ? `priority ${it.priority}` : "",
    ]
      .filter(Boolean)
      .join("; ");
    return html`<li class="ui-bburn__item">
      <button
        type="button"
        class="ui-bburn__row"
        data-id=${it.id}
        tabindex=${this.stop === it.id ? 0 : -1}
        ?data-over=${burn > 1}
        @focus=${() => {
          if (this.active !== it.id) this.active = it.id;
        }}
        @click=${() => {
          this.active = it.id;
          this.open(it);
        }}
      >
        <span class="ui-bburn__what" aria-hidden="true">
          ${it.priority ? html`<span class="ui-bburn__priority">${it.priority}</span>` : nothing}
          <span class="ui-bburn__names"><span class="ui-bburn__label">${it.label}</span>${it.owner ? html`<span class="ui-bburn__owner">${it.owner}</span>` : nothing}</span>
        </span>
        <span class="ui-bburn__money" aria-hidden="true"><span class="ui-bburn__spent">${this.money(it.spent)}</span><span class="ui-bburn__budget"> / ${this.money(it.budget)}</span></span>
        <span class="ui-bburn__burn" aria-hidden="true">
          <span class="ui-bburn__burn-top"
            ><span class="ui-bburn__pct">${this.pct(burn)}</span>${pace ? html`<span class="ui-bburn__pace" data-pace=${pace}><span class="ui-bburn__pace-mark">${pace === "ahead" ? "▲" : pace === "behind" ? "▼" : "●"}</span>${this.paceWords(pace)}</span>` : nothing}</span
          >
          <span class="ui-bburn__track"
            ><span class="ui-bburn__fill" data-pace=${pace ?? "none"} style=${`inline-size: ${Math.min(1, burn) * 100}%`}></span>${period === undefined
              ? nothing
              : html`<span class="ui-bburn__marker" style=${`inset-inline-start: ${period * 100}%`}></span>`}</span
          >
        </span>
        <span class="ui-bburn__people" aria-hidden="true">
          ${it.people !== undefined ? html`<span class="ui-bburn__fte">${this.num(it.people)} ${this.peopleUnit}</span>` : nothing}
          ${it.team?.length
            ? html`<span class="ui-bburn__team">${it.team.slice(0, 3).map((n) => html`<span class="ui-bburn__avatar" title=${n}>${initials(n)}</span>`)}${it.team.length > 3
                ? html`<span class="ui-bburn__avatar ui-bburn__avatar--more">+${it.team.length - 3}</span>`
                : nothing}</span>`
            : nothing}
        </span>
        <span class="ui-bburn__sr">${sr}</span>
      </button>
    </li>`;
  }

  protected override render() {
    const id = this.uid;
    const allocated = this.items.reduce((n, it) => n + Math.max(0, it.budget || 0), 0);
    const spent = this.items.reduce((n, it) => n + Math.max(0, it.spent || 0), 0);
    const hasCommitted = this.items.some((it) => it.committed !== undefined);
    const committed = this.items.reduce((n, it) => n + Math.max(0, it.committed || 0), 0);
    return html`
      <span class="ui-bburn__sr" role="status">${this.announce}</span>
      ${cardHead({
        icon: flameIcon,
        title: this.heading,
        subtitle: this.description,
        id: `${id}-title`,
        aside: this.items.length
          ? html`<span class="ui-bburn__sort" role="group" aria-label="Sort by">
              ${(["budget", "burn"] as const).map(
                (s) => html`<button type="button" class="ui-bburn__sort-btn" aria-pressed=${this.sort === s ? "true" : "false"} @click=${() => this.setSort(s)}>${s === "budget" ? "Budget" : "Burn"}</button>`,
              )}
            </span>`
          : nothing,
      })}
      <div class="ui-bburn__card">
        ${this.items.length
          ? html`<dl class="ui-bburn__totals">
                <div><dt>Allocated</dt><dd>${this.money(allocated)}</dd></div>
                <div><dt>Spent</dt><dd>${this.money(spent)}<span class="ui-bburn__of"> · ${this.pct(allocated > 0 ? spent / allocated : 0)}</span></dd></div>
                ${hasCommitted ? html`<div><dt>Committed</dt><dd>${this.money(committed)}</dd></div>` : nothing}
                ${this.period === undefined ? nothing : html`<div><dt>Through the period</dt><dd>${this.pct(Math.max(0, Math.min(1, this.period)))}</dd></div>`}
              </dl>
              <ul class="ui-bburn__list" aria-labelledby=${`${id}-title`} @keydown=${this.onKey}>
                ${repeat(this.rows, (it) => it.id, (it) => this.renderRow(it))}
              </ul>`
          : html`<p class="ui-bburn__empty">No budgets to show yet.</p>`}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="bburn"] {
  position: relative;
  display: block;
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="bburn"] {
  position: relative;
  display: block;
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
[data-ui="bburn"] *, [data-ui="bburn"] *::before, [data-ui="bburn"] *::after { box-sizing: border-box; }
:where([data-ui="bburn"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="bburn"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="bburn"] ul, [data-ui="bburn"] dl, [data-ui="bburn"] dd { margin: 0; padding: 0; list-style: none; }
[data-ui="bburn"] p { margin: 0; }
.ui-bburn__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-bburn__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* ----- The sort: a small segmented control ----- */
.ui-bburn__sort { display: inline-flex; flex: none; padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
.ui-bburn__sort-btn { height: calc(var(--tc-control-h-sm) - var(--tc-seg-pad) * 2); padding: 0 var(--tc-space-2-5) !important; border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-none); color: var(--tc-text-secondary); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-bburn__sort-btn[aria-pressed="true"] { background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-bburn__sort-btn[aria-pressed="true"] { font-weight: var(--tc-font-weight-strong); }
/* ----- Totals ----- */
.ui-bburn__totals { display: flex; flex-wrap: wrap; gap: var(--tc-space-2) var(--tc-space-6); padding: var(--tc-space-3) var(--tc-space-4) !important; border-bottom: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="clean"], [data-look="clean"] *).ui-bburn__totals { padding-top: var(--tc-space-1) !important; }
.ui-bburn__totals dt { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-bburn__totals dd { font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-bburn__of { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); }
/* ----- Rows: what, money, burn, people ----- */
.ui-bburn__list { padding: var(--tc-space-1-5) !important; }
.ui-bburn__item + .ui-bburn__item { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-bburn__row { display: grid !important; grid-template-columns: minmax(0, 1.6fr) minmax(96px, 0.8fr) minmax(0, 1.4fr) minmax(88px, 0.7fr); align-items: center; gap: var(--tc-space-4); width: 100%; padding: var(--tc-space-2-5) !important; border-radius: var(--tc-radius-md); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-bburn__row:hover { background: var(--tc-fill-subtle); }
[data-ui="bburn"] .ui-bburn__row:focus-visible { outline-offset: calc(var(--tc-focus-ring-width) * -1); }
.ui-bburn__what { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; }
.ui-bburn__priority { display: inline-grid; flex: none; place-items: center; min-width: 22px; height: 22px; padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-sm); background: var(--tc-surface-inverse); color: var(--tc-text-on-inverse); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-none); font-variant-numeric: tabular-nums; }
.ui-bburn__names { display: grid; min-width: 0; }
.ui-bburn__label { overflow: hidden; color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); text-overflow: ellipsis; white-space: nowrap; }
.ui-bburn__owner { overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); text-overflow: ellipsis; white-space: nowrap; }
.ui-bburn__money { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-bburn__spent { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
.ui-bburn__budget { color: var(--tc-text-muted); }
.ui-bburn__burn { display: grid; gap: var(--tc-space-1); min-width: 0; }
.ui-bburn__burn-top { display: flex; flex-wrap: wrap; align-items: center; gap: 0 var(--tc-space-2); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-bburn__pct { color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-bburn__pace { display: inline-flex; align-items: center; gap: var(--tc-space-1); font-size: var(--tc-font-size-xs); color: var(--tc-text-secondary); white-space: nowrap; }
.ui-bburn__pace-mark { font-size: var(--tc-font-size-2xs); }
.ui-bburn__pace[data-pace="ahead"] { color: var(--tc-status-warning-fg); }
.ui-bburn__pace[data-pace="behind"] { color: var(--tc-status-info-fg); }
.ui-bburn__track { position: relative; display: block; height: 6px; border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); }
.ui-bburn__fill { display: block; height: 100%; border-radius: inherit; background: var(--tc-meter-fill); transition: inline-size var(--tc-duration-moderate) var(--tc-ease-move); }
.ui-bburn__fill[data-pace="ahead"] { background: var(--tc-status-warning-solid); }
.ui-bburn__marker { position: absolute; top: -3px; bottom: -3px; width: 2px; translate: -50% 0; border-radius: var(--tc-radius-2xs); background: var(--tc-text-primary); }
.ui-bburn__people { display: flex; align-items: center; justify-content: flex-end; gap: var(--tc-space-2); min-width: 0; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-bburn__team { display: inline-flex; }
.ui-bburn__avatar { display: grid; place-items: center; width: 24px; height: 24px; margin-inline-start: calc(-1 * var(--tc-space-1-5)); border-radius: var(--tc-radius-full); background: var(--tc-surface-sunken); box-shadow: 0 0 0 2px var(--tc-surface-raised); color: var(--tc-text-secondary); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-avatar-font-weight); line-height: var(--tc-line-height-none); }
.ui-bburn__avatar:first-child { margin-inline-start: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-bburn__avatar { box-shadow: 0 0 0 2px var(--tc-surface-on-tray); }
.ui-bburn__empty { padding: var(--tc-space-6) var(--tc-space-4) !important; color: var(--tc-text-muted); text-align: center; }
/* Narrow: two lines a row – what and money, then burn and people */
@container (max-width: 560px) {
  .ui-bburn__row { grid-template-columns: minmax(0, 1fr) auto; gap: var(--tc-space-2) var(--tc-space-3); }
  .ui-bburn__money { text-align: right; }
}
@media (forced-colors: active) {
  .ui-bburn__fill, .ui-bburn__marker { background: CanvasText !important; }
  .ui-bburn__sort-btn[aria-pressed="true"] { outline: 2px solid Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="bburn"] *, [data-ui="bburn"] *::before, [data-ui="bburn"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-budget-burn")) customElements.define("tc-budget-burn", TcBudgetBurn);

declare global {
  interface HTMLElementTagNameMap {
    "tc-budget-burn": TcBudgetBurn;
  }
}
