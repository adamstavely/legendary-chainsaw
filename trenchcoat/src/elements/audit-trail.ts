import { html, nothing, svg } from "lit";
import { property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import "./collapse";

/*
 * <tc-audit-trail> – who did what, and when, for the record. Events are grouped by day, newest first, each with who, what
 * and on what, and an outcome in words as well as colour. Search covers all of that; the outcome filter narrows it. A row
 * with `detail` opens to show it. Export gives the page the events showing as CSV, with any cell a spreadsheet would read
 * as a formula made safe. It only shows the record: it can't change it, and it isn't what keeps it tamper-proof.
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
};
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
};

const ICON = svg`<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4M9 13h6M9 17h6"></path>`;
let instances = 0;

/** One CSV cell. A leading = + - @ (or tab, return) is a formula to a spreadsheet, so it's kept as text */
export function auditCsvCell(value: string) {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** The events as CSV, with times in ISO 8601 */
export function auditCsv(events: AuditEvent[]) {
  const rows = events.map((e) => [new Date(e.at).toISOString(), e.actor, e.action, e.target ?? "", e.outcome ?? "success", e.detail ?? ""].map(auditCsvCell).join(","));
  return ["time,actor,action,target,outcome,detail", ...rows].join("\r\n");
}

/**
 * Who did what and when, for the record, with search, a filter by outcome and export.
 * @tag tc-audit-trail
 * @fires tc-query-change - The search changed ({ query }: AuditQueryChange)
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
  /** Which outcomes show */
  @property() accessor outcome: AuditOutcomeFilter = "all";
  /** Offer Export */
  @property({ attribute: "exportable", converter: { fromAttribute: (v: string | null) => v !== "false" } }) accessor exportable = true;
  /** The locale for dates and times */
  @property() accessor locale: string | undefined = undefined;
  /** The time zone for dates and times; by default the browser's */
  @property({ attribute: "time-zone" }) accessor timeZone: string | undefined = undefined;
  /** Rename any of the words */
  @property({ attribute: false }) accessor labels: Partial<AuditTrailLabels> = {};

  @state() private accessor opened = new Set<string>();
  private readonly uid = `tc-aud-${++instances}`;

  private get words(): AuditTrailLabels {
    return { ...defaultAuditTrailLabels, ...this.labels };
  }

  private get shown() {
    const q = this.query.trim().toLowerCase();
    return this.events
      .filter((e) => this.outcome === "all" || (e.outcome ?? "success") === this.outcome)
      .filter((e) => !q || [e.actor, e.action, e.target, e.detail].some((v) => v?.toLowerCase().includes(q)))
      .sort((a, b) => b.at - a.at);
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
    return html`<li class="ui-aud__event" data-outcome=${outcome}>
      <time class="ui-aud__time" datetime=${new Date(e.at).toISOString()}>${this.timeOf(e.at)}</time>
      <div class="ui-aud__body">
        <p class="ui-aud__line"><b>${e.actor}</b> ${e.action}${e.target ? html` <span class="ui-aud__target">${e.target}</span>` : nothing}</p>
        ${e.detail
          ? html`<tc-collapse id=${panel} ?open=${open}><div><p class="ui-aud__detail">${e.detail}</p></div></tc-collapse>`
          : nothing}
      </div>
      <span class="ui-aud__outcome" data-outcome=${outcome}>${w[outcome]}</span>
      ${e.detail
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
    return html`${cardHead({ icon: ICON, title: this.heading, subtitle: this.description, id: `${this.uid}-title`, aside: html`<span class="ui-aud__count">${count}</span>` })}
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
          <select class="ui-aud__filter" aria-label=${w.outcome} @change=${(e: Event) => (this.outcome = (e.target as HTMLSelectElement).value as AuditOutcomeFilter)}>
            ${(["all", "success", "denied", "failed"] as const).map((o) => html`<option value=${o} .selected=${live(o === this.outcome)}>${w[o]}</option>`)}
          </select>
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
      <span class="tc-sr-only" role="status">${this.query || this.outcome !== "all" ? count : ""}</span>`;
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
.ui-aud__filter:focus-visible, .ui-aud__more:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
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
.ui-aud__outcome { font-size: var(--tc-font-size-xs); color: var(--tc-text-secondary); white-space: nowrap; }
.ui-aud__outcome[data-outcome="denied"] { color: var(--tc-status-warning-fg); font-weight: var(--tc-font-weight-medium); }
.ui-aud__outcome[data-outcome="failed"] { color: var(--tc-status-danger-fg); font-weight: var(--tc-font-weight-medium); }
.ui-aud__more { padding: 0; border: 0; background: none; color: var(--tc-text-secondary); font: inherit; font-size: var(--tc-font-size-xs); text-decoration: underline; white-space: nowrap; cursor: pointer; }
.ui-aud__more:hover { color: var(--tc-text-primary); }
.ui-aud__empty { padding: var(--tc-space-6) var(--tc-space-4); box-shadow: inset 0 var(--tc-hairline) var(--tc-border-subtle); color: var(--tc-text-secondary); text-align: center; }
@container (max-width: 520px) {
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
