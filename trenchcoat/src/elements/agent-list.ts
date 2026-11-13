import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController } from "./internal/controllers";

/*
 * <tc-agent-list> – every agent in a workspace, with the ones that are failing lifted into a "Needs attention" group at
 * the top, each saying why in words. Below them the rest, searched, filtered by status and sorted by name, last run,
 * failures or cost. A row opens the agent (tc-agent-open).
 *   · the rows are one tab stop across both groups: ↑ ↓ move, Home / End go to the ends, Enter or Space opens
 *   · status is a mark and a word; the failure rate and the cost are numbers with their words for screen readers
 *   · "when" is relative to `now` when it's given, else a short date – the element keeps no clock of its own
 *   · narrow, each row stacks its figures under the name
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-agent-list .agents=${agents} sort="failures"></tc-agent-list>
 */

export type AgentListStatus = "live" | "draft" | "paused" | "failing";
export type AgentListSort = "name" | "lastRun" | "failures" | "cost";
export type AgentListRunStatus = "succeeded" | "failed" | "running";
export type AgentListItem = {
  id: string;
  name: string;
  description?: string;
  owner?: string;
  status: AgentListStatus;
  model?: string;
  /** The last run: when (epoch ms) and how it went */
  lastRun?: { at: number; status: AgentListRunStatus };
  /** Runs in the last 7 days */
  runs7d?: number;
  /** The share of those runs that failed, 0–1 */
  failureRate?: number;
  /** What the last 7 days cost */
  cost7d?: number;
  /** Why it needs attention, in words; by default worked out from the failures */
  attention?: string;
};
export type AgentListSortChange = { sort: AgentListSort };
export type AgentListFilterChange = { filter: AgentListStatus[] };
export type AgentListQueryChange = { query: string };
export type AgentListOpen = { id: string; agent: AgentListItem };

/** The element's words, every one renameable through `labels` */
export type AgentListLabels = Record<AgentListStatus, string> & {
  search: string;
  filter: string;
  sortBy: string;
  sortName: string;
  sortLastRun: string;
  sortFailures: string;
  sortCost: string;
  attention: string;
  others: string;
  all: string;
  empty: string;
  noMatch: string;
  clear: string;
  neverRun: string;
  lastRun: string;
  runs: string;
  failures: string;
  cost: string;
  succeeded: string;
  failed: string;
  running: string;
  shown: string;
  keys: string;
  whyFailures: string;
  whyLastRun: string;
  whyBoth: string;
  whyFailing: string;
};
export const defaultAgentListLabels: AgentListLabels = {
  live: "Live",
  draft: "Draft",
  paused: "Paused",
  failing: "Failing",
  search: "Search agents",
  filter: "Status",
  sortBy: "Sort by",
  sortName: "Name",
  sortLastRun: "Last run",
  sortFailures: "Failures",
  sortCost: "Cost",
  attention: "Needs attention",
  others: "All agents",
  all: "All",
  empty: "No agents yet.",
  noMatch: "No agents match.",
  clear: "Clear filters",
  neverRun: "Never run",
  lastRun: "Last run",
  runs: "runs this week",
  failures: "failed",
  cost: "this week",
  succeeded: "succeeded",
  failed: "failed",
  running: "running",
  shown: "{n} of {total} agents",
  keys: "Up and down arrows move between agents; Enter opens one.",
  whyFailures: "{failed} of {runs} runs failed this week.",
  whyLastRun: "The last run failed {when}.",
  whyBoth: "{failed} of {runs} runs failed this week, and the last one failed {when}.",
  whyFailing: "It's failing.",
};

/* bot: Lucide (ISC, lucide.dev) */
const ICON = svg`<path d="M12 8V4H8"></path><rect width="16" height="12" x="4" y="8" rx="2"></rect><path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path>`;
const STATUSES: AgentListStatus[] = ["live", "draft", "paused", "failing"];
const SORTS: AgentListSort[] = ["name", "lastRun", "failures", "cost"];
let instances = 0;

/** Whether an agent goes in Needs attention: it's failing, or the page said why */
export function needsAttention(a: AgentListItem) {
  return a.status === "failing" || !!a.attention;
}

/** The agents in the order a sort puts them: name A–Z, the rest highest first; ties by name */
export function sortAgents(agents: AgentListItem[], sort: AgentListSort) {
  const byName = (a: AgentListItem, b: AgentListItem) => a.name.localeCompare(b.name);
  const key = (a: AgentListItem) => (sort === "lastRun" ? (a.lastRun?.at ?? -Infinity) : sort === "failures" ? (a.failureRate ?? 0) : sort === "cost" ? (a.cost7d ?? 0) : 0);
  return [...agents].sort((a, b) => (sort === "name" ? byName(a, b) : key(b) - key(a) || byName(a, b)));
}

/**
 * Every agent in a workspace, with the failing ones lifted first; search, status filter and sort.
 * @tag tc-agent-list
 * @fires tc-agent-open - A row was opened ({ id, agent }: AgentListOpen)
 * @fires tc-sort-change - The sort changed ({ sort }: AgentListSortChange); cancelable – prevented, `sort` stays as it was
 * @fires tc-filter-change - The status filter changed ({ filter }: AgentListFilterChange); cancelable – prevented, `filter` stays as it was
 * @fires tc-query-change - The search changed ({ query }: AgentListQueryChange); cancelable – prevented, `query` stays as it was
 */
export class TcAgentList extends TcElement {
  static override ui = "agl";

  /** The heading */
  @property() accessor heading = "Agents";
  /** A line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The agents */
  @property({ attribute: false }) accessor agents: AgentListItem[] = [];
  /** The order: "name", "lastRun", "failures" or "cost". Changed by the user unless a tc-sort-change listener calls preventDefault() */
  @property() accessor sort: AgentListSort = "name";
  /** The statuses shown; empty shows every one. Changed by the user unless a tc-filter-change listener calls preventDefault() */
  @property({ attribute: false }) accessor filter: AgentListStatus[] = [];
  /** The search text. Changed by the user unless a tc-query-change listener calls preventDefault() */
  @property() accessor query = "";
  /** "Now", epoch ms – last runs read as "2 h ago" when it's given, else as a date */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** The cost's currency, an ISO 4217 code */
  @property() accessor currency = "USD";
  /** The locale for dates, numbers and money */
  @property() accessor locale: string | undefined = undefined;
  /** Rename any of the words */
  @property({ attribute: false }) accessor labels: Partial<AgentListLabels> = {};

  @state() private accessor active: string | null = null;
  private readonly uid = `tc-agl-${++instances}`;

  constructor() {
    super();
    new FocusRescueController(this, () => this.querySelector<HTMLElement>(".ui-agl__row"));
  }

  private get words(): AgentListLabels {
    return { ...defaultAgentListLabels, ...this.labels };
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (!SORTS.includes(this.sort)) this.sort = "name";
  }

  /** The agents the search and filter let through, in order: Needs attention first, then the rest */
  get visible(): { attention: AgentListItem[]; others: AgentListItem[] } {
    const q = this.query.trim().toLowerCase();
    const shown = this.agents.filter(
      (a) =>
        (!this.filter.length || this.filter.includes(a.status)) &&
        (!q || [a.name, a.description, a.owner, a.model].some((t) => t?.toLowerCase().includes(q))),
    );
    const sorted = sortAgents(shown, this.sort);
    return { attention: sorted.filter(needsAttention), others: sorted.filter((a) => !needsAttention(a)) };
  }

  private money(n: number) {
    try {
      return new Intl.NumberFormat(this.locale, { style: "currency", currency: this.currency, maximumFractionDigits: n < 100 ? 2 : 0 }).format(n);
    } catch {
      return `${n.toFixed(2)} ${this.currency}`;
    }
  }

  private percent(n: number) {
    return new Intl.NumberFormat(this.locale, { style: "percent", maximumFractionDigits: 0 }).format(n);
  }

  private when(at: number) {
    if (this.now !== undefined) {
      const s = Math.round((at - this.now) / 1000);
      const abs = Math.abs(s);
      const [value, unit]: [number, Intl.RelativeTimeFormatUnit] =
        abs < 60 ? [s, "second"] : abs < 3600 ? [Math.round(s / 60), "minute"] : abs < 86400 ? [Math.round(s / 3600), "hour"] : [Math.round(s / 86400), "day"];
      return new Intl.RelativeTimeFormat(this.locale, { numeric: "auto", style: "short" }).format(value, unit);
    }
    return new Intl.DateTimeFormat(this.locale, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(at);
  }

  /** Why an agent needs attention, in words */
  private why(a: AgentListItem) {
    if (a.attention) return a.attention;
    const w = this.words;
    const counts = a.failureRate !== undefined && a.runs7d ? { failed: String(Math.round(a.failureRate * a.runs7d)), runs: String(a.runs7d) } : null;
    const last = a.lastRun?.status === "failed" ? this.when(a.lastRun.at) : null;
    const fill = (t: string) => t.replace("{failed}", counts?.failed ?? "").replace("{runs}", counts?.runs ?? "").replace("{when}", last ?? "");
    return fill(counts && last ? w.whyBoth : counts ? w.whyFailures : last ? w.whyLastRun : w.whyFailing);
  }

  private setSort(sort: AgentListSort) {
    if (sort === this.sort) return;
    if (this.emit<AgentListSortChange>("tc-sort-change", { sort }, { cancelable: true })) this.sort = sort;
    else this.requestUpdate();
  }

  private toggleStatus(s: AgentListStatus | null) {
    const filter = s === null ? [] : this.filter.includes(s) ? this.filter.filter((x) => x !== s) : STATUSES.filter((x) => x === s || this.filter.includes(x));
    if (this.emit<AgentListFilterChange>("tc-filter-change", { filter }, { cancelable: true })) this.filter = filter;
  }

  private setQuery(query: string, input?: HTMLInputElement) {
    if (this.emit<AgentListQueryChange>("tc-query-change", { query }, { cancelable: true })) this.query = query;
    else if (input) input.value = this.query;
  }

  private clearAll() {
    if (this.query) this.setQuery("");
    if (this.filter.length) this.toggleStatus(null);
    this.updateComplete.then(() => this.querySelector<HTMLInputElement>(".ui-agl__search")?.focus());
  }

  private open(a: AgentListItem) {
    this.active = a.id;
    this.emit<AgentListOpen>("tc-agent-open", { id: a.id, agent: a });
  }

  private onRowKey(e: KeyboardEvent, order: AgentListItem[]) {
    const row = (e.target as HTMLElement).closest<HTMLElement>(".ui-agl__row");
    if (!row) return;
    const at = order.findIndex((a) => a.id === row.dataset.agent);
    let next = -1;
    if (e.key === "ArrowDown") next = Math.min(order.length - 1, at + 1);
    else if (e.key === "ArrowUp") next = Math.max(0, at - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = order.length - 1;
    if (next < 0) return;
    e.preventDefault();
    const id = order[next]!.id;
    this.active = id;
    this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-agl__row[data-agent="${CSS.escape(id)}"]`)?.focus());
  }

  private renderRow(a: AgentListItem, stop: string | null, lifted: boolean) {
    const w = this.words;
    const run = a.lastRun;
    const runWord = run ? (run.status === "failed" ? w.failed : run.status === "running" ? w.running : w.succeeded) : "";
    return html`<li class="ui-agl__item">
      <button type="button" class="ui-agl__row" data-agent=${a.id} data-status=${a.status} tabindex=${stop === a.id ? 0 : -1} aria-describedby=${`${this.uid}-keys`} @click=${() => this.open(a)}>
        <span class="ui-agl__main">
          <span class="ui-agl__name">${a.name}</span>
          ${a.description ? html`<span class="ui-agl__desc">${a.description}</span>` : nothing}
          ${lifted ? html`<span class="ui-agl__why">${this.why(a)}</span>` : nothing}
        </span>
        <span class="ui-agl__status" data-status=${a.status}><span class="ui-agl__mark" aria-hidden="true"></span>${w[a.status]}</span>
        <span class="ui-agl__meta">
          ${a.model ? html`<span class="ui-agl__model">${a.model}</span>` : nothing}
          ${a.owner ? html`<span class="ui-agl__owner">${a.owner}</span>` : nothing}
        </span>
        <span class="ui-agl__run" data-run=${run?.status ?? "none"}>${run ? html`<span class="tc-sr-only">${w.lastRun}: </span>${runWord} · ${this.when(run.at)}` : w.neverRun}</span>
        <span class="ui-agl__figures">
          ${a.runs7d !== undefined ? html`<span class="ui-agl__runs">${a.runs7d} <span class="ui-agl__unit">${w.runs}</span></span>` : nothing}
          ${a.failureRate !== undefined ? html`<span class="ui-agl__failures" data-high=${a.failureRate >= 0.1 ? "true" : "false"}>${this.percent(a.failureRate)} <span class="ui-agl__unit">${w.failures}</span></span>` : nothing}
          ${a.cost7d !== undefined ? html`<span class="ui-agl__cost">${this.money(a.cost7d)} <span class="ui-agl__unit">${w.cost}</span></span>` : nothing}
        </span>
      </button>
    </li>`;
  }

  protected override render() {
    const w = this.words;
    const { attention, others } = this.visible;
    const order = [...attention, ...others];
    const stop = order.some((a) => a.id === this.active) ? this.active : (order[0]?.id ?? null);
    const filtered = !!this.query.trim() || this.filter.length > 0;
    const sortLabel: Record<AgentListSort, string> = { name: w.sortName, lastRun: w.sortLastRun, failures: w.sortFailures, cost: w.sortCost };
    const shown = w.shown.replace("{n}", String(order.length)).replace("{total}", String(this.agents.length));
    return html`${cardHead({ icon: ICON, title: this.heading, subtitle: this.description, id: `${this.uid}-title`, aside: html`<span class="ui-agl__count">${shown}</span>` })}
      <div class="ui-agl__card">
        <div class="ui-agl__tools">
          <input
            class="ui-agl__search"
            type="search"
            aria-label=${w.search}
            placeholder=${w.search}
            .value=${this.query}
            @input=${(e: InputEvent) => this.setQuery((e.target as HTMLInputElement).value, e.target as HTMLInputElement)}
          />
          <div class="ui-agl__chips" role="group" aria-label=${w.filter}>
            <button type="button" class="ui-agl__chip" data-status="all" aria-pressed=${this.filter.length ? "false" : "true"} @click=${() => this.toggleStatus(null)}>${w.all}</button>
            ${STATUSES.map(
              (s) => html`<button type="button" class="ui-agl__chip" data-status=${s} aria-pressed=${this.filter.includes(s) ? "true" : "false"} @click=${() => this.toggleStatus(s)}>${w[s]}</button>`,
            )}
          </div>
          <label class="ui-agl__sort">
            <span class="ui-agl__sort-label">${w.sortBy}</span>
            <select class="ui-agl__select" .value=${live(this.sort)} @change=${(e: Event) => this.setSort((e.target as HTMLSelectElement).value as AgentListSort)}>
              ${SORTS.map((s) => html`<option value=${s} ?selected=${s === this.sort}>${sortLabel[s]}</option>`)}
            </select>
          </label>
        </div>
        <span class="tc-sr-only" id=${`${this.uid}-keys`}>${w.keys}</span>
        <span class="tc-sr-only" role="status">${filtered ? shown : ""}</span>
        ${!this.agents.length
          ? html`<p class="ui-agl__none">${w.empty}</p>`
          : !order.length
            ? html`<div class="ui-agl__none"><p>${w.noMatch}</p><button type="button" class="tc-btn-sm ui-agl__clear" @click=${this.clearAll}>${w.clear}</button></div>`
            : html`<div class="ui-agl__groups" @keydown=${(e: KeyboardEvent) => this.onRowKey(e, order)}>
                ${attention.length
                  ? html`<section class="ui-agl__group" data-group="attention" aria-labelledby=${`${this.uid}-attention`}>
                      <h4 class="ui-agl__group-title" id=${`${this.uid}-attention`}>${w.attention} <span class="ui-agl__group-count">${attention.length}</span></h4>
                      <ul class="ui-agl__list">${attention.map((a) => this.renderRow(a, stop, true))}</ul>
                    </section>`
                  : nothing}
                ${others.length
                  ? html`<section class="ui-agl__group" data-group="others" aria-labelledby=${`${this.uid}-others`}>
                      <h4 class="ui-agl__group-title" id=${`${this.uid}-others`}>${w.others} <span class="ui-agl__group-count">${others.length}</span></h4>
                      <ul class="ui-agl__list">${others.map((a) => this.renderRow(a, stop, false))}</ul>
                    </section>`
                  : nothing}
              </div>`}
      </div>`;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="agl"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="agl"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
/* The status mark's size – override it on the element */
[data-ui="agl"] { --tc-agl-mark: var(--tc-space-2); }
[data-ui="agl"] *, [data-ui="agl"] *::before, [data-ui="agl"] *::after { box-sizing: border-box; }
[data-ui="agl"] :where(p, h4, ul) { margin: 0; }
[data-ui="agl"] :where(ul) { padding: 0; list-style: none; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="agl"] .ui-agl__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-agl__card { display: grid; gap: var(--tc-space-3); padding: var(--tc-space-4); }
.ui-agl__count { color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); white-space: nowrap; }
.ui-agl__tools { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2) var(--tc-space-3); }
.ui-agl__search { flex: 1 1 12em; min-width: 0; height: var(--tc-field-h-sm); margin: 0; padding: 0 var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); outline: none; background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font: inherit; color: var(--tc-text-primary); }
.ui-agl__search::placeholder { color: var(--tc-text-placeholder); }
.ui-agl__search:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-agl__search:focus { box-shadow: var(--tc-field-shadow-focus); }
.ui-agl__chips { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); }
.ui-agl__chip { height: var(--tc-control-h-sm); margin: 0; padding: 0 var(--tc-space-2-5); border: 0; border-radius: var(--tc-control-radius-sm); background: var(--tc-fill-default); font: inherit; font-size: var(--tc-font-size-xs); color: var(--tc-text-secondary); white-space: nowrap; cursor: pointer; }
.ui-agl__chip:hover { background: var(--tc-fill-strong); }
.ui-agl__chip[aria-pressed="true"] { background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow), inset 0 0 0 1px var(--tc-border-selected); color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
.ui-agl__chip:focus-visible, .ui-agl__row:focus-visible, .ui-agl__select:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-agl__sort { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); }
.ui-agl__select { height: var(--tc-control-h-sm); margin: 0; padding: 0 var(--tc-space-2); border: 0; border-radius: var(--tc-control-radius-sm); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font: inherit; color: var(--tc-text-primary); }
.ui-agl__groups { display: grid; gap: var(--tc-space-4); }
.ui-agl__group { display: grid; gap: var(--tc-space-1); }
.ui-agl__group-title { display: flex; align-items: baseline; gap: var(--tc-space-1-5); color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-agl__group[data-group="attention"] .ui-agl__group-title { color: var(--tc-status-danger-fg); }
.ui-agl__group-count { color: var(--tc-text-muted); font-weight: var(--tc-font-weight-regular); }
.ui-agl__list { display: grid; gap: var(--tc-space-0-5); }
.ui-agl__row {
  display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 9em) minmax(0, 10em) auto; align-items: center; gap: var(--tc-space-1) var(--tc-space-3);
  width: 100%; min-height: var(--tc-control-h-md); margin: 0; padding: var(--tc-space-2) var(--tc-space-2-5); border: 0; border-radius: var(--tc-control-radius-md);
  background: none; color: var(--tc-text-primary); font: inherit; text-align: left; cursor: pointer;
}
.ui-agl__row:hover { background: var(--tc-fill-hover); }
.ui-agl__group[data-group="attention"] .ui-agl__row { background: var(--tc-status-danger-bg); }
.ui-agl__group[data-group="attention"] .ui-agl__row:hover { background: var(--tc-fill-hover); }
.ui-agl__main { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-agl__name { font-weight: var(--tc-font-weight-medium); overflow-wrap: anywhere; }
.ui-agl__desc { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); overflow-wrap: anywhere; }
.ui-agl__why { color: var(--tc-status-danger-fg); font-size: var(--tc-font-size-xs); overflow-wrap: anywhere; }
.ui-agl__status { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-xs); white-space: nowrap; color: var(--tc-text-secondary); }
.ui-agl__mark { width: var(--tc-agl-mark); height: var(--tc-agl-mark); border-radius: var(--tc-radius-full); background: var(--tc-text-muted); }
.ui-agl__status[data-status="live"] .ui-agl__mark { background: var(--tc-status-success-solid); }
.ui-agl__status[data-status="failing"] { color: var(--tc-status-danger-fg); font-weight: var(--tc-font-weight-medium); }
.ui-agl__status[data-status="failing"] .ui-agl__mark { background: var(--tc-status-danger-solid); }
.ui-agl__status[data-status="paused"] .ui-agl__mark { background: var(--tc-status-warning-solid); }
.ui-agl__status[data-status="draft"] .ui-agl__mark { background: transparent; box-shadow: inset 0 0 0 1px var(--tc-text-muted); }
.ui-agl__meta { display: grid; gap: var(--tc-space-0-5); min-width: 0; color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); }
.ui-agl__model, .ui-agl__owner { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-agl__run { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); }
.ui-agl__run[data-run="failed"] { color: var(--tc-status-danger-fg); }
.ui-agl__figures { display: grid; justify-items: end; gap: var(--tc-space-0-5); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-agl__unit { color: var(--tc-text-muted); }
.ui-agl__failures[data-high="true"] { color: var(--tc-status-danger-fg); font-weight: var(--tc-font-weight-medium); }
.ui-agl__none { display: grid; justify-items: start; gap: var(--tc-space-2); padding: var(--tc-space-4) 0; color: var(--tc-text-secondary); }
@container (max-width: 640px) {
  .ui-agl__row { grid-template-columns: minmax(0, 1fr) auto; }
  .ui-agl__meta, .ui-agl__run, .ui-agl__figures { grid-column: 1 / -1; }
  .ui-agl__meta { display: flex; flex-wrap: wrap; gap: var(--tc-space-0-5) var(--tc-space-3); }
  .ui-agl__figures { display: flex; flex-wrap: wrap; justify-items: start; gap: var(--tc-space-0-5) var(--tc-space-3); }
}
@media (forced-colors: active) {
  .ui-agl__mark { background: CanvasText; forced-color-adjust: none; }
  .ui-agl__chip[aria-pressed="true"] { outline: 2px solid Highlight; }
}
`;
}

if (!customElements.get("tc-agent-list")) customElements.define("tc-agent-list", TcAgentList);

declare global {
  interface HTMLElementTagNameMap {
    "tc-agent-list": TcAgentList;
  }
}
