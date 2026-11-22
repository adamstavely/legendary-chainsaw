import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import "./collapse";

/*
 * <tc-audit-trail> – who did what, and when, for the record. Events are grouped by day, newest first, each with who, what
 * and on what, and an outcome in words as well as colour. Search covers all of that; the outcome filter narrows it. A row
 * with `detail` or `changes` opens to show them – changes as a small Field / Before / After table, added and removed
 * values said in words. Person, Type and Date filters narrow it further (`actor`, `action`, `range`, each the page's to
 * own), Clear filters undoes them all, and the count says how many of how many show. Export gives the page the events
 * showing as CSV – with a changes column when any have changes – and any cell a spreadsheet would read as a formula made
 * safe. It only shows the record: it can't change it, and it isn't what keeps it tamper-proof. Date ranges are measured
 * from `now`, or the clock when it isn't given.
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-audit-trail .events=${[{ id: "e1", at: 1793000000000, actor: "Noor Haddad", action: "shared", target: "Trial 12.pdf" }]}></tc-audit-trail>
 */

export type AuditOutcome = "success" | "denied" | "failed";
export type AuditEvent = {
  id: string;
  /** When it happened, epoch ms */
  at: number;
  /** Who did it */
  actor: string;
  /** What they did, as a past-tense verb: "shared" */
  action: string;
  /** What they did it to */
  target?: string;
  /** By default "success" */
  outcome?: AuditOutcome;
  /** More about it: shown when the row opens */
  detail?: string;
  /** What it changed, field by field: shown when the row opens. A field whose value didn't change isn't listed */
  changes?: AuditChange[];
};
/** One field an event changed. No `before`: it was added. No `after`: it was removed */
export type AuditChange = { field: string; before?: string; after?: string };
export type AuditRange = "today" | "7d" | "30d" | "all";
export type AuditActorChange = { actor: string };
export type AuditActionChange = { action: string };
export type AuditRangeChange = { range: AuditRange };
export type AuditOutcomeChange = { outcome: AuditOutcomeFilter };
export type AuditOutcomeFilter = AuditOutcome | "all";
export type AuditQueryChange = { query: string };
export type AuditExport = { events: AuditEvent[]; csv: string };

/** The block's words, every one renameable through `labels` */
export type AuditTrailLabels = {
  search: string;
  searchPlaceholder: string;
  outcome: string;
  all: string;
  success: string;
  denied: string;
  failed: string;
  more: string;
  less: string;
  empty: string;
  noMatch: string;
  export: string;
  /** {n} */
  count: string;
  countOne: string;
  /** {n} of {total} */
  countOf: string;
  person: string;
  anyone: string;
  type: string;
  anyAction: string;
  date: string;
  today: string;
  last7: string;
  last30: string;
  anyTime: string;
  clear: string;
  changes: string;
  field: string;
  before: string;
  after: string;
  added: string;
  removed: string;
  none: string;
};
export const defaultAuditTrailLabels: AuditTrailLabels = {
  search: "Search the record",
  searchPlaceholder: "Person, action or item",
  outcome: "Outcome",
  all: "All outcomes",
  success: "Succeeded",
  denied: "Denied",
  failed: "Failed",
  more: "Details",
  less: "Hide details",
  empty: "Nothing has been recorded yet.",
  noMatch: "No events match.",
  export: "Export CSV",
  count: "{n} events",
  countOne: "1 event",
  countOf: "{n} of {total} events",
  person: "Person",
  anyone: "Anyone",
  type: "Type",
  anyAction: "Any action",
  date: "Date",
  today: "Today",
  last7: "Last 7 days",
  last30: "Last 30 days",
  anyTime: "Any time",
  clear: "Clear filters",
  changes: "Changes",
  field: "Field",
  before: "Before",
  after: "After",
  added: "added",
  removed: "removed",
  none: "none",
};

const DAY = 86_400_000;

/** The fields an event really changed: a field with the same value before and after is left out */
export function auditChanges(e: AuditEvent): AuditChange[] {
  return (e.changes ?? []).filter((c) => (c.before ?? "") !== (c.after ?? ""));
}

/** "Risk score: 40 → 72; Owner: (none) → Ade Okafor" */
function changesText(e: AuditEvent) {
  return auditChanges(e)
    .map((c) => `${c.field}: ${c.before ?? "(none)"} → ${c.after ?? "(none)"}`)
    .join("; ");
}

const ICON = svg`<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4M9 13h6M9 17h6"></path>`;
let instances = 0;

/** One CSV cell. A leading = + - @ (or tab, return) is a formula to a spreadsheet, so it's kept as text */
export function auditCsvCell(value: string) {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** The events as CSV, with times in ISO 8601; a changes column ("field: before → after; …") when any event has changes */
export function auditCsv(events: AuditEvent[]) {
  const withChanges = events.some((e) => auditChanges(e).length);
  const rows = events.map((e) =>
    [new Date(e.at).toISOString(), e.actor, e.action, e.target ?? "", e.outcome ?? "success", e.detail ?? "", ...(withChanges ? [changesText(e)] : [])].map(auditCsvCell).join(","),
  );
  return [`time,actor,action,target,outcome,detail${withChanges ? ",changes" : ""}`, ...rows].join("\r\n");
}

/**
 * Who did what and when, for the record – with what changed, before and after – with search, filters by outcome, person, type and date, and export.
 * @tag tc-audit-trail
 * @fires tc-query-change - The search changed ({ query }: AuditQueryChange)
 * @fires tc-actor-change - The Person filter changed ({ actor }: AuditActorChange; "" is anyone); cancelable – prevented, `actor` stays as it was
 * @fires tc-action-change - The Type filter changed ({ action }: AuditActionChange; "" is any action); cancelable – prevented, `action` stays as it was
 * @fires tc-range-change - The Date filter changed ({ range }: AuditRangeChange); cancelable – prevented, `range` stays as it was
 * @fires tc-outcome-change - The outcome filter changed ({ outcome }: AuditOutcomeChange); cancelable – prevented, `outcome` stays as it was
 * @fires tc-export - Export was pressed ({ events, csv }: AuditExport); cancelable – without a listener preventing it, the file downloads
 */
export class TcAuditTrail extends TcElement {
  static override ui = "aud";

  /** The heading */
  @property() accessor heading = "Audit trail";
  /** A line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** What happened, in any order: they show newest first */
  @property({ attribute: false }) accessor events: AuditEvent[] = [];
  /** The search */
  @property() accessor query = "";
  /** Which outcomes show. Changed by the filter unless a tc-outcome-change listener calls preventDefault() */
  @property() accessor outcome: AuditOutcomeFilter = "all";
  /** Only this person's events; "" for anyone. Changed by the Person filter unless a tc-actor-change listener calls preventDefault() */
  @property() accessor actor = "";
  /** Only this action; "" for any. Changed by the Type filter unless a tc-action-change listener calls preventDefault() */
  @property() accessor action = "";
  /** Only events from "today", the last "7d" or "30d", or "all". Changed by the Date filter unless a tc-range-change listener calls preventDefault() */
  @property() accessor range: AuditRange = "all";
  /** The time ranges are measured from, epoch ms; unset, the clock's when the range is picked */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** Offer Export */
  @property({ attribute: "exportable", converter: { fromAttribute: (v: string | null) => v !== "false" } }) accessor exportable = true;
  /** The locale for dates and times */
  @property() accessor locale: string | undefined = undefined;
  /** The time zone for dates and times; by default the browser's */
  @property({ attribute: "time-zone" }) accessor timeZone: string | undefined = undefined;
  /** Rename any of the words */
  @property({ attribute: false }) accessor labels: Partial<AuditTrailLabels> = {};

  @state() private accessor opened = new Set<string>();
  @state() private accessor clock = 0;
  private readonly uid = `tc-aud-${++instances}`;

  private get words(): AuditTrailLabels {
    return { ...defaultAuditTrailLabels, ...this.labels };
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // The one clock read: when a range is in use and the page gives no `now`
    if (this.range !== "all" && this.now === undefined && (changed.has("range") || !this.clock)) this.clock = Date.now();
  }

  /** Whether an event falls in the picked date range */
  private inRange(at: number) {
    if (this.range === "all") return true;
    const now = this.now ?? this.clock;
    if (this.range === "today") return this.dayOf(at) === this.dayOf(now) && at <= now + DAY;
    return at >= now - (this.range === "7d" ? 7 : 30) * DAY && at <= now + DAY;
  }

  private get shown() {
    const q = this.query.trim().toLowerCase();
    return this.events
      .filter((e) => this.outcome === "all" || (e.outcome ?? "success") === this.outcome)
      .filter((e) => !this.actor || e.actor === this.actor)
      .filter((e) => !this.action || e.action === this.action)
      .filter((e) => this.inRange(e.at))
      .filter((e) => !q || [e.actor, e.action, e.target, e.detail, ...auditChanges(e).flatMap((c) => [c.field, c.before, c.after])].some((v) => v?.toLowerCase().includes(q)))
      .sort((a, b) => b.at - a.at);
  }

  /** Whether a filter beyond the search is set */
  private get filtered() {
    return this.outcome !== "all" || !!this.actor || !!this.action || this.range !== "all";
  }

  private setActor(actor: string) {
    if (actor === this.actor) return;
    // Prevented, it re-renders so the select snaps back to the kept value
    if (this.emit<AuditActorChange>("tc-actor-change", { actor }, { cancelable: true })) this.actor = actor;
    else this.requestUpdate();
  }
  private setAction(action: string) {
    if (action === this.action) return;
    // Prevented, it re-renders so the select snaps back to the kept value
    if (this.emit<AuditActionChange>("tc-action-change", { action }, { cancelable: true })) this.action = action;
    else this.requestUpdate();
  }
  private setRange(range: AuditRange) {
    if (range === this.range) return;
    // Prevented, it re-renders so the select snaps back to the kept value
    if (this.emit<AuditRangeChange>("tc-range-change", { range }, { cancelable: true })) this.range = range;
    else this.requestUpdate();
  }
  private setOutcome(outcome: AuditOutcomeFilter) {
    if (outcome === this.outcome) return;
    // Prevented, it re-renders so the select snaps back to the kept value
    if (this.emit<AuditOutcomeChange>("tc-outcome-change", { outcome }, { cancelable: true })) this.outcome = outcome;
    else this.requestUpdate();
  }
  private clearFilters() {
    this.setActor("");
    this.setAction("");
    this.setRange("all");
    this.setOutcome("all");
  }

  private dayOf(at: number) {
    return new Intl.DateTimeFormat(this.locale, { dateStyle: "long", timeZone: this.timeZone }).format(at);
  }
  private timeOf(at: number) {
    return new Intl.DateTimeFormat(this.locale, { timeStyle: "short", timeZone: this.timeZone }).format(at);
  }

  private toggle(id: string) {
    const next = new Set(this.opened);
    if (!next.delete(id)) next.add(id);
    this.opened = next;
  }

  private exportCsv() {
    const events = this.shown;
    const csv = auditCsv(events);
    if (!this.emit<AuditExport>("tc-export", { events, csv }, { cancelable: true })) return;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit-trail.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  private renderEvent(e: AuditEvent) {
    const w = this.words;
    const outcome = e.outcome ?? "success";
    const open = this.opened.has(e.id);
    const panel = `${this.uid}-${e.id}`;
    const changes = auditChanges(e);
    const opens = !!e.detail || changes.length > 0;
    const cell = (v: string | undefined) => (v === undefined || v === "" ? html`<span class="ui-aud__none" aria-hidden="true">–</span><span class="tc-sr-only">${w.none}</span>` : v);
    return html`<li class="ui-aud__event" data-outcome=${outcome}>
      <time class="ui-aud__time" datetime=${new Date(e.at).toISOString()}>${this.timeOf(e.at)}</time>
      <div class="ui-aud__body">
        <p class="ui-aud__line"><b>${e.actor}</b> ${e.action}${e.target ? html` <span class="ui-aud__target">${e.target}</span>` : nothing}</p>
        ${opens
          ? html`<tc-collapse id=${panel} ?open=${open}
              ><div>
                ${e.detail ? html`<p class="ui-aud__detail">${e.detail}</p>` : nothing}
                ${changes.length
                  ? html`<table class="ui-aud__changes">
                      <caption class="tc-sr-only">${w.changes}</caption>
                      <thead>
                        <tr><th scope="col">${w.field}</th><th scope="col">${w.before}</th><th scope="col">${w.after}</th></tr>
                      </thead>
                      <tbody>
                        ${changes.map((c) => {
                          const kind = c.before === undefined || c.before === "" ? "added" : c.after === undefined || c.after === "" ? "removed" : "changed";
                          return html`<tr data-kind=${kind}>
                            <th scope="row">${c.field}${kind !== "changed" ? html` <span class="ui-aud__kind">${w[kind]}</span>` : nothing}</th>
                            <td class="ui-aud__before">${cell(c.before)}</td>
                            <td class="ui-aud__after">${cell(c.after)}</td>
                          </tr>`;
                        })}
                      </tbody>
                    </table>`
                  : nothing}
              </div></tc-collapse
            >`
          : nothing}
      </div>
      <span class="ui-aud__outcome" data-outcome=${outcome}>${w[outcome]}</span>
      ${opens
        ? html`<button type="button" class="ui-aud__more" aria-expanded=${open ? "true" : "false"} aria-controls=${panel} @click=${() => this.toggle(e.id)}>${open ? w.less : w.more}<span class="tc-sr-only">, ${e.actor} ${e.action}</span></button>`
        : nothing}
    </li>`;
  }

  protected override render() {
    const w = this.words;
    const shown = this.shown;
    const days = new Map<string, AuditEvent[]>();
    for (const e of shown) {
      const day = this.dayOf(e.at);
      days.set(day, [...(days.get(day) ?? []), e]);
    }
    const count = shown.length === 1 ? w.countOne : w.count.replace("{n}", String(shown.length));
    const narrowed = this.filtered || !!this.query.trim();
    const countLine = narrowed ? w.countOf.replace("{n}", String(shown.length)).replace("{total}", String(this.events.length)) : count;
    const actors = [...new Set([...this.events.map((e) => e.actor), ...(this.actor ? [this.actor] : [])])].sort((a, b) => a.localeCompare(b, this.locale));
    const actions = [...new Set([...this.events.map((e) => e.action), ...(this.action ? [this.action] : [])])].sort((a, b) => a.localeCompare(b, this.locale));
    const ranges: [AuditRange, string][] = [
      ["all", w.anyTime],
      ["today", w.today],
      ["7d", w.last7],
      ["30d", w.last30],
    ];
    return html`${cardHead({ icon: ICON, title: this.heading, subtitle: this.description, id: `${this.uid}-title`, aside: html`<span class="ui-aud__count">${countLine}</span>` })}
      <div class="ui-aud__card">
        <div class="ui-aud__bar">
          <label class="tc-sr-only" for=${`${this.uid}-search`}>${w.search}</label>
          <span class="ui-aud__search-wrap">
            <input
              id=${`${this.uid}-search`}
              class="ui-aud__search"
              type="search"
              placeholder=${w.searchPlaceholder}
              .value=${live(this.query)}
              @input=${(e: Event) => {
                this.query = (e.target as HTMLInputElement).value;
                this.emit<AuditQueryChange>("tc-query-change", { query: this.query });
              }}
            />
          </span>
          <span class="ui-aud__filters">
            <select class="ui-aud__filter ui-aud__outcome-filter" aria-label=${w.outcome} @change=${(e: Event) => this.setOutcome((e.target as HTMLSelectElement).value as AuditOutcomeFilter)}>
              ${(["all", "success", "denied", "failed"] as const).map((o) => html`<option value=${o} .selected=${live(o === this.outcome)}>${w[o]}</option>`)}
            </select>
            <select class="ui-aud__filter ui-aud__actor" aria-label=${w.person} @change=${(e: Event) => this.setActor((e.target as HTMLSelectElement).value)}>
              <option value="" .selected=${live(!this.actor)}>${w.anyone}</option>
              ${actors.map((a) => html`<option value=${a} .selected=${live(a === this.actor)}>${a}</option>`)}
            </select>
            <select class="ui-aud__filter ui-aud__action" aria-label=${w.type} @change=${(e: Event) => this.setAction((e.target as HTMLSelectElement).value)}>
              <option value="" .selected=${live(!this.action)}>${w.anyAction}</option>
              ${actions.map((a) => html`<option value=${a} .selected=${live(a === this.action)}>${a}</option>`)}
            </select>
            <select class="ui-aud__filter ui-aud__range" aria-label=${w.date} @change=${(e: Event) => this.setRange((e.target as HTMLSelectElement).value as AuditRange)}>
              ${ranges.map(([r, label]) => html`<option value=${r} .selected=${live(r === this.range)}>${label}</option>`)}
            </select>

            ${this.filtered ? html`<button type="button" class="ui-aud__clear" @click=${this.clearFilters}>${w.clear}</button>` : nothing}
          </span>
          ${this.exportable ? html`<button type="button" class="tc-btn-sm ui-aud__export" ?disabled=${!shown.length} @click=${this.exportCsv}>${w.export}</button>` : nothing}
        </div>
        ${shown.length
          ? [...days].map(
              ([day, events]) => html`<section class="ui-aud__day" aria-label=${day}>
                <h4 class="ui-aud__date">${day}</h4>
                <ul class="ui-aud__list">${events.map((e) => this.renderEvent(e))}</ul>
              </section>`,
            )
          : html`<p class="ui-aud__empty">${this.events.length ? w.noMatch : w.empty}</p>`}
      </div>
      <span class="tc-sr-only" role="status">${narrowed ? count : ""}</span>`;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="aud"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="aud"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
[data-ui="aud"] *, [data-ui="aud"] *::before, [data-ui="aud"] *::after { box-sizing: border-box; }
[data-ui="aud"] :where(p) { margin: 0; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="aud"] .ui-aud__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-aud__count { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-aud__bar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-4); }
.ui-aud__search-wrap { display: flex; flex: 1 1 12em; align-items: center; height: var(--tc-control-h-sm); padding: 0 var(--tc-field-px); border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); }
.ui-aud__search-wrap:focus-within { box-shadow: var(--tc-field-shadow-focus); }
.ui-aud__search { flex: 1; width: 100%; min-width: 0; padding: 0; border: 0; outline: 0; background: none; color: var(--tc-text-primary); font: inherit; font-size: var(--tc-font-size-xs); }
.ui-aud__search::placeholder { color: var(--tc-text-muted); }
.ui-aud__filter { height: var(--tc-control-h-sm); padding: 0 var(--tc-space-1); border: 0; border-radius: var(--tc-control-radius-sm); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); color: var(--tc-text-primary); font: inherit; font-size: var(--tc-font-size-xs); }
.ui-aud__filters { display: contents; }
.ui-aud__clear { height: var(--tc-control-h-sm); padding: 0 var(--tc-space-1); border: 0; background: none; color: var(--tc-text-secondary); font: inherit; font-size: var(--tc-font-size-xs); text-decoration: underline; white-space: nowrap; cursor: pointer; }
.ui-aud__clear:hover { color: var(--tc-text-primary); }
.ui-aud__filter:focus-visible, .ui-aud__more:focus-visible, .ui-aud__clear:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-aud__day { box-shadow: inset 0 var(--tc-hairline) var(--tc-border-subtle); }
.ui-aud__date { margin: 0; padding: var(--tc-space-2) var(--tc-space-4) 0; color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-aud__list { display: grid; margin: 0; padding: var(--tc-space-1) 0 var(--tc-space-2); list-style: none; }
.ui-aud__event { display: grid; grid-template-columns: 5em minmax(0, 1fr) auto auto; align-items: baseline; gap: var(--tc-space-1) var(--tc-space-3); padding: var(--tc-space-1-5) var(--tc-space-4); }
.ui-aud__time { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-aud__body { min-width: 0; }
.ui-aud__line { overflow-wrap: anywhere; }
.ui-aud__line b { font-weight: var(--tc-font-weight-medium); }
.ui-aud__target { color: var(--tc-text-secondary); }
.ui-aud__detail { padding-top: var(--tc-space-1); color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); overflow-wrap: anywhere; }
.ui-aud__changes { width: 100%; margin-top: var(--tc-space-2); border-collapse: collapse; font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; }
.ui-aud__changes :is(th, td) { padding: var(--tc-space-1) var(--tc-space-2) var(--tc-space-1) 0; box-shadow: inset 0 calc(var(--tc-hairline) * -1) var(--tc-border-subtle); text-align: left; vertical-align: top; overflow-wrap: anywhere; }
.ui-aud__changes thead th { color: var(--tc-text-secondary); font-weight: var(--tc-font-weight-medium); }
.ui-aud__changes tbody th { font-weight: var(--tc-font-weight-medium); }
.ui-aud__before { color: var(--tc-text-secondary); text-decoration: line-through; text-decoration-color: var(--tc-border-strong); }
.ui-aud__changes tr[data-kind="added"] .ui-aud__before, .ui-aud__changes tr[data-kind="removed"] .ui-aud__after { text-decoration: none; }
.ui-aud__none { color: var(--tc-text-muted); }
.ui-aud__kind { margin-left: var(--tc-space-1); padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-xs); background: var(--tc-surface-tray); color: var(--tc-text-secondary); font-weight: var(--tc-font-weight-regular); }
.ui-aud__outcome { font-size: var(--tc-font-size-xs); color: var(--tc-text-secondary); white-space: nowrap; }
.ui-aud__outcome[data-outcome="denied"] { color: var(--tc-status-warning-fg); font-weight: var(--tc-font-weight-medium); }
.ui-aud__outcome[data-outcome="failed"] { color: var(--tc-status-danger-fg); font-weight: var(--tc-font-weight-medium); }
.ui-aud__more { padding: 0; border: 0; background: none; color: var(--tc-text-secondary); font: inherit; font-size: var(--tc-font-size-xs); text-decoration: underline; white-space: nowrap; cursor: pointer; }
.ui-aud__more:hover { color: var(--tc-text-primary); }
.ui-aud__empty { padding: var(--tc-space-6) var(--tc-space-4); box-shadow: inset 0 var(--tc-hairline) var(--tc-border-subtle); color: var(--tc-text-secondary); text-align: center; }
@container (max-width: 520px) {
  .ui-aud__search-wrap { flex-basis: 100%; }
  .ui-aud__filter { flex: 1 1 8em; min-width: 0; }
  .ui-aud__event { grid-template-columns: minmax(0, 1fr) auto; }
  .ui-aud__body { grid-column: 1 / -1; grid-row: 2; }
  .ui-aud__more { grid-column: 1 / -1; justify-self: start; }
}
`;
}

if (!customElements.get("tc-audit-trail")) customElements.define("tc-audit-trail", TcAuditTrail);

declare global {
  interface HTMLElementTagNameMap {
    "tc-audit-trail": TcAuditTrail;
  }
}
