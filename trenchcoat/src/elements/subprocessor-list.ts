import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { formatDate } from "./internal/util";

/*
 * <tc-subprocessor-list> – every vendor that touches customer data, as a vendor publishes it for its customers: each
 * one's name, what it does, the kinds of data it handles (as chips), where it processes them and under which transfer
 * mechanism, when it was added, and whether it's active, new (with the date it takes effect) or removed. Search, a
 * data-category filter and a location filter narrow the list; Export CSV saves what's shown; Subscribe to changes takes
 * an email address, checked in words before tc-subscribe fires.
 *   · a table with real column headers (and explicit table roles, so the narrow layout keeps them); under 560px wide
 *     each vendor becomes a card with its labels shown
 *   · status carries a word and a mark as well as a tint, so colour is never the only cue
 *   · query, category and location are properties the page may own, changed through cancelable events
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-subprocessor-list .subprocessors=${[{ id: "nh", name: "Northwind Hosting", purpose: "Cloud hosting",
 *     categories: ["Customer content"], location: "Ireland", transfer: "Within the EEA", status: "active" }]}>
 *   </tc-subprocessor-list>
 */

/** A building, search, download, mail: Lucide (ISC, lucide.dev) */
const buildingIcon = svg`<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"></path><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"></path><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"></path><path d="M10 6h4"></path><path d="M10 10h4"></path><path d="M10 14h4"></path><path d="M10 18h4"></path>`;
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const searchIcon = () => lucide(14, svg`<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path>`);
const downloadIcon = () => lucide(14, svg`<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="m7 10 5 5 5-5"></path><path d="M12 15V3"></path>`);
const mailIcon = () => lucide(14, svg`<rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>`);
const MARK = {
  active: () => lucide(11, svg`<path d="M20 6 9 17l-5-5"></path>`),
  new: () => lucide(11, svg`<path d="M12 5v14"></path><path d="M5 12h14"></path>`),
  removed: () => lucide(11, svg`<path d="M5 12h14"></path>`),
};

export type SubprocessorStatus = "active" | "new" | "removed";
export type Subprocessor = {
  id: string;
  /** The vendor's name */
  name: string;
  /** What it does for the service: "Cloud hosting", "Transactional email" */
  purpose: string;
  /** The kinds of customer data it handles: "Account data", "Customer content" */
  categories: string[];
  /** Where it processes the data: "Ireland", "United States" */
  location: string;
  /** How data gets there lawfully: "Standard Contractual Clauses", "Within the EEA" */
  transfer?: string;
  /** When it was added to the list, as epoch ms */
  added?: number;
  status: SubprocessorStatus;
  /** For a new vendor, when it starts processing data; for a removed one, when it stopped – epoch ms */
  effective?: number;
};

/** Details of the events */
export type SubprocessorQueryChange = { query: string };
export type SubprocessorCategoryChange = { category: string | null };
export type SubprocessorLocationChange = { location: string | null };
export type SubprocessorSubscribe = { email: string };
export type SubprocessorExport = { csv: string; rows: Subprocessor[]; filename: string };

/** The words the element uses; any can be renamed through `labels` */
export const defaultSubprocessorListLabels = {
  search: "Search subprocessors",
  category: "Data category",
  location: "Location",
  all: "All",
  name: "Subprocessor",
  purpose: "Purpose",
  categories: "Data",
  where: "Location",
  transfer: "Transfer",
  added: "Added",
  status: "Status",
  active: "Active",
  new: "New",
  removed: "Removed",
  takesEffect: "from",
  removedOn: "on",
  exportCsv: "Export CSV",
  subscribe: "Subscribe to changes",
  email: "Email address",
  subscribeButton: "Subscribe",
  subscribeHint: "We'll email you before a new subprocessor starts handling your data.",
  emptyEmail: "Enter an email address.",
  badEmail: "Enter an email address like name@example.org.",
  subscribed: "Subscribed – we'll email",
  subscribedEnd: "when this list changes.",
  none: "No subprocessors match.",
  empty: "No subprocessors listed.",
  count: "subprocessors",
  countOne: "subprocessor",
  newCount: "new",
};
export type SubprocessorListLabels = typeof defaultSubprocessorListLabels;

/** A plain email check: something@something.something, no spaces */
export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

/** One CSV cell: quoted when needed, and a leading = + - @ neutralised so a spreadsheet doesn't run it as a formula */
const cell = (v: string) => {
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};
/** The rows as CSV, with a header row, dates as YYYY-MM-DD */
export function subprocessorCsv(rows: Subprocessor[]) {
  const day = (ms: number | undefined) => (ms === undefined ? "" : new Date(ms).toISOString().slice(0, 10));
  const head = ["Name", "Purpose", "Data categories", "Location", "Transfer", "Added", "Status", "Effective"];
  const body = rows.map((r) => [r.name, r.purpose, r.categories.join("; "), r.location, r.transfer ?? "", day(r.added), r.status, day(r.effective)].map(cell).join(","));
  return [head.join(","), ...body].join("\r\n");
}

let uidCount = 0;

/**
 * Every vendor that touches customer data – purpose, data categories, location, transfer mechanism, when added and
 * whether it's active, new or removed – with search, category and location filters, Export CSV and Subscribe to
 * changes.
 * @tag tc-subprocessor-list
 * @fires tc-query-change - The search changed ({ query }: SubprocessorQueryChange); cancelable – prevented, `query` stays as it was
 * @fires tc-category-change - The data-category filter changed ({ category }: SubprocessorCategoryChange); cancelable – prevented, `category` stays as it was
 * @fires tc-location-change - The location filter changed ({ location }: SubprocessorLocationChange); cancelable – prevented, `location` stays as it was
 * @fires tc-subscribe - A valid email was submitted to Subscribe to changes ({ email }: SubprocessorSubscribe); cancelable – prevented, no confirmation is shown
 * @fires tc-export - Export CSV was pressed ({ csv, rows, filename }: SubprocessorExport); cancelable – prevented, nothing is downloaded
 */
export class TcSubprocessorList extends TcElement {
  static override ui = "sbp";

  /** The heading */
  @property() accessor heading = "Subprocessors";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The vendors, in order */
  @property({ attribute: false }) accessor subprocessors: Subprocessor[] = [];
  /** The search text. Changed by typing unless a tc-query-change listener calls preventDefault() */
  @property() accessor query = "";
  /** The data category shown, or null for all. Changed by the filter unless a tc-category-change listener calls preventDefault() */
  @property({ attribute: false }) accessor category: string | null = null;
  /** The location shown, or null for all. Changed by the filter unless a tc-location-change listener calls preventDefault() */
  @property({ attribute: false }) accessor location: string | null = null;
  /** Leaves out Subscribe to changes */
  @property({ type: Boolean, attribute: "hide-subscribe" }) accessor hideSubscribe = false;
  /** The name Export CSV saves as */
  @property() accessor filename = "subprocessors.csv";
  /** The language for dates, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;
  /** The words used, merged over defaultSubprocessorListLabels */
  @property({ attribute: false }) accessor labels: Partial<SubprocessorListLabels> = {};

  /** The email being typed into Subscribe */
  @state() private accessor email = "";
  /** What's wrong with the email, once Subscribe was pressed */
  @state() private accessor emailError = "";
  /** The address subscribed, once tc-subscribe went through */
  @state() private accessor subscribed = "";
  /** A polite announcement */
  @state() private accessor announce = "";

  private uid = `tc-sbp-${++uidCount}`;

  private get w(): SubprocessorListLabels {
    return { ...defaultSubprocessorListLabels, ...this.labels };
  }
  /** "1 subprocessor", "4 subprocessors" */
  private counted(n: number) {
    return `${n} ${n === 1 ? this.w.countOne : this.w.count}`;
  }
  private date(ms: number) {
    return formatDate(ms, this.locale, { day: "numeric", month: "short", year: "numeric" });
  }

  /** The vendors that pass the search and filters */
  get shown(): Subprocessor[] {
    const q = this.query.trim().toLowerCase();
    return this.subprocessors.filter(
      (s) =>
        (!this.category || s.categories.includes(this.category)) &&
        (!this.location || s.location === this.location) &&
        (!q || [s.name, s.purpose, s.location, s.transfer ?? "", ...s.categories].some((t) => t.toLowerCase().includes(q))),
    );
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("query") || changed.has("category") || changed.has("location")) {
      const n = this.shown.length;
      if (changed.get("query") !== undefined || changed.get("category") !== undefined || changed.get("location") !== undefined)
        this.announce = n ? this.counted(n) : this.w.none;
    }
  }

  /* ---------- Actions ---------- */

  private setQuery(query: string, field: HTMLInputElement) {
    if (!this.emit<SubprocessorQueryChange>("tc-query-change", { query }, { cancelable: true })) {
      field.value = this.query;
      return;
    }
    this.query = query;
  }
  private setCategory(value: string, field: HTMLSelectElement) {
    const category = value || null;
    if (!this.emit<SubprocessorCategoryChange>("tc-category-change", { category }, { cancelable: true })) {
      field.value = this.category ?? "";
      return;
    }
    this.category = category;
  }
  private setLocation(value: string, field: HTMLSelectElement) {
    const location = value || null;
    if (!this.emit<SubprocessorLocationChange>("tc-location-change", { location }, { cancelable: true })) {
      field.value = this.location ?? "";
      return;
    }
    this.location = location;
  }
  private submit(e: Event) {
    e.preventDefault();
    const w = this.w;
    const email = this.email.trim();
    this.emailError = !email ? w.emptyEmail : !isEmail(email) ? w.badEmail : "";
    if (this.emailError) {
      this.announce = this.emailError;
      void this.updateComplete.then(() => this.querySelector<HTMLInputElement>(".ui-sbp__email")?.focus());
      return;
    }
    if (!this.emit<SubprocessorSubscribe>("tc-subscribe", { email }, { cancelable: true })) return;
    this.subscribed = email;
    this.email = "";
    this.announce = `${w.subscribed} ${email} ${w.subscribedEnd}`;
  }
  private exportCsv() {
    const rows = this.shown;
    const csv = subprocessorCsv(rows);
    if (!this.emit<SubprocessorExport>("tc-export", { csv, rows, filename: this.filename }, { cancelable: true })) return;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = this.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ---------- Rendering ---------- */

  private statusCell(s: Subprocessor) {
    const w = this.w;
    const word = s.status === "new" ? w.new : s.status === "removed" ? w.removed : w.active;
    const when = s.effective !== undefined && s.status !== "active" ? ` ${s.status === "new" ? w.takesEffect : w.removedOn} ${this.date(s.effective)}` : "";
    return html`<span class="ui-sbp__pill" data-status=${s.status}>${MARK[s.status]()}${word}${when}</span>`;
  }

  private renderRow(s: Subprocessor) {
    const w = this.w;
    const label = (text: string) => html`<span class="ui-sbp__label" aria-hidden="true">${text}</span>`;
    return html`<tr role="row" class="ui-sbp__row" data-id=${s.id} data-status=${s.status}>
      <th scope="row" role="rowheader" class="ui-sbp__name">${s.name}</th>
      <td role="cell" class="ui-sbp__purpose">${label(w.purpose)}${s.purpose}</td>
      <td role="cell" class="ui-sbp__cats">
        ${label(w.categories)}
        <ul class="ui-sbp__chips">
          ${s.categories.map((c) => html`<li class="ui-sbp__chip">${c}</li>`)}
        </ul>
      </td>
      <td role="cell" class="ui-sbp__where">${label(w.where)}${s.location}</td>
      <td role="cell" class="ui-sbp__transfer">${label(w.transfer)}${s.transfer ?? "–"}</td>
      <td role="cell" class="ui-sbp__added">${label(w.added)}${s.added !== undefined ? this.date(s.added) : "–"}</td>
      <td role="cell" class="ui-sbp__status">${label(w.status)}${this.statusCell(s)}</td>
    </tr>`;
  }

  private renderSubscribe() {
    const w = this.w;
    const id = this.uid;
    if (this.subscribed)
      return html`<p class="ui-sbp__done">${mailIcon()}<span>${w.subscribed} <strong>${this.subscribed}</strong> ${w.subscribedEnd}</span></p>`;
    return html`<form class="ui-sbp__subscribe" novalidate @submit=${this.submit}>
      <label class="ui-sbp__sub-label" for=${`${id}-email`}>${w.subscribe}</label>
      <span class="ui-sbp__hint" id=${`${id}-hint`}>${w.subscribeHint}</span>
      <span class="ui-sbp__sub-row">
        <input
          class="ui-sbp__email"
          id=${`${id}-email`}
          type="email"
          autocomplete="email"
          placeholder="name@example.org"
          aria-label=${`${w.subscribe}, ${w.email}`}
          aria-invalid=${this.emailError ? "true" : "false"}
          aria-describedby=${this.emailError ? `${id}-error ${id}-hint` : `${id}-hint`}
          .value=${this.email}
          @input=${(e: Event) => {
            this.email = (e.target as HTMLInputElement).value;
            if (this.emailError && isEmail(this.email.trim())) this.emailError = "";
          }}
        />
        <button type="submit" class="tc-btn-sm ui-sbp__sub-btn">${mailIcon()}${w.subscribeButton}</button>
      </span>
      ${this.emailError ? html`<span class="ui-sbp__error" id=${`${id}-error`}>${this.emailError}</span>` : nothing}
    </form>`;
  }

  protected override render() {
    const w = this.w;
    const id = this.uid;
    const all = this.subprocessors;
    const shown = this.shown;
    const cats = [...new Set(all.flatMap((s) => s.categories))].sort((a, b) => a.localeCompare(b));
    const places = [...new Set(all.map((s) => s.location))].sort((a, b) => a.localeCompare(b));
    const fresh = all.filter((s) => s.status === "new").length;
    return html`
      <span class="tc-sr-only" role="status">${this.announce}</span>
      ${cardHead({
        icon: buildingIcon,
        title: this.heading,
        subtitle: this.description,
        id: `${id}-title`,
        aside: all.length
          ? html`<span class="ui-sbp__count">${this.counted(all.length)}${fresh ? html` · <span class="ui-sbp__count-new">${fresh} ${w.newCount}</span>` : nothing}</span>`
          : nothing,
      })}
      <div class="ui-sbp__card">
        <div class="ui-sbp__tools">
          <span class="ui-sbp__search">
            ${searchIcon()}
            <input
              class="ui-sbp__query"
              type="search"
              aria-label=${w.search}
              placeholder=${w.search}
              .value=${this.query}
              @input=${(e: Event) => this.setQuery((e.target as HTMLInputElement).value, e.target as HTMLInputElement)}
            />
          </span>
          <label class="ui-sbp__filter"
            ><span>${w.category}</span>
            <select class="ui-sbp__select ui-sbp__category" @change=${(e: Event) => this.setCategory((e.target as HTMLSelectElement).value, e.target as HTMLSelectElement)}>
              <option value="" ?selected=${!this.category}>${w.all}</option>
              ${cats.map((c) => html`<option value=${c} ?selected=${this.category === c}>${c}</option>`)}
            </select></label
          >
          <label class="ui-sbp__filter"
            ><span>${w.location}</span>
            <select class="ui-sbp__select ui-sbp__location" @change=${(e: Event) => this.setLocation((e.target as HTMLSelectElement).value, e.target as HTMLSelectElement)}>
              <option value="" ?selected=${!this.location}>${w.all}</option>
              ${places.map((p) => html`<option value=${p} ?selected=${this.location === p}>${p}</option>`)}
            </select></label
          >
          <button type="button" class="tc-btn-sm ui-sbp__export" ?disabled=${!shown.length} @click=${() => this.exportCsv()}>${downloadIcon()}${w.exportCsv}</button>
        </div>
        ${shown.length
          ? html`<div class="ui-sbp__scroll">
              <table role="table" class="ui-sbp__table" aria-labelledby=${`${id}-title`}>
                <thead role="rowgroup">
                  <tr role="row">
                    <th scope="col" role="columnheader">${w.name}</th>
                    <th scope="col" role="columnheader">${w.purpose}</th>
                    <th scope="col" role="columnheader">${w.categories}</th>
                    <th scope="col" role="columnheader">${w.where}</th>
                    <th scope="col" role="columnheader">${w.transfer}</th>
                    <th scope="col" role="columnheader">${w.added}</th>
                    <th scope="col" role="columnheader">${w.status}</th>
                  </tr>
                </thead>
                <tbody role="rowgroup">
                  ${repeat(shown, (s) => s.id, (s) => this.renderRow(s))}
                </tbody>
              </table>
            </div>`
          : html`<p class="ui-sbp__empty">${all.length ? w.none : w.empty}</p>`}
        ${this.hideSubscribe ? nothing : html`<div class="ui-sbp__foot">${this.renderSubscribe()}</div>`}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="sbp"] {
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="sbp"] {
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
[data-ui="sbp"] *, [data-ui="sbp"] *::before, [data-ui="sbp"] *::after { box-sizing: border-box; }
:where([data-ui="sbp"] button) { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="sbp"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="sbp"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="sbp"] p { margin: 0; }
[data-ui="sbp"] svg { display: block; flex: none; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="sbp"] svg[stroke-width] { stroke-width: 1.6; }
:where([data-look="standard"], [data-look="standard"] *).ui-sbp__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-sbp__count { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; }
.ui-sbp__count-new { color: var(--tc-status-info-fg); }
/* ----- Search, filters and Export ----- */
.ui-sbp__tools { display: flex; flex-wrap: wrap; align-items: flex-end; gap: var(--tc-space-2) var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-4); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-sbp__search { position: relative; display: flex; flex: 1 1 180px; align-items: center; min-width: 0; color: var(--tc-icon-muted); }
.ui-sbp__search svg { position: absolute; left: var(--tc-space-2); pointer-events: none; }
.ui-sbp__query, .ui-sbp__email { display: block; width: 100%; min-height: var(--tc-field-h-sm); margin: 0; padding: 0 var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); outline: none; background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font: inherit; font-size: var(--tc-field-font-size); color: var(--tc-text-primary); transition: box-shadow var(--tc-duration-quick) var(--tc-ease-standard); }
.ui-sbp__query { padding-left: var(--tc-space-7); }
.ui-sbp__query::placeholder, .ui-sbp__email::placeholder { color: var(--tc-text-placeholder); }
.ui-sbp__query:hover, .ui-sbp__email:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-sbp__query:focus, .ui-sbp__email:focus { box-shadow: var(--tc-field-shadow-focus); }
.ui-sbp__email[aria-invalid="true"] { box-shadow: var(--tc-field-shadow-invalid); }
.ui-sbp__filter { display: grid; gap: var(--tc-space-0-5); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-sbp__select { height: var(--tc-control-h-sm); padding: 0 var(--tc-space-1); border: 0; border-radius: var(--tc-control-radius-sm); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); color: var(--tc-text-primary); font: inherit; font-size: var(--tc-font-size-sm); }
.ui-sbp__select:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
/* ----- The table ----- */
.ui-sbp__scroll { overflow-x: auto; }
.ui-sbp__table { width: 100%; border-collapse: collapse; font-size: var(--tc-font-size-sm); }
.ui-sbp__table th, .ui-sbp__table td { padding: var(--tc-space-2-5) var(--tc-space-3); vertical-align: top; text-align: left; }
.ui-sbp__table thead th { font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); white-space: nowrap; }
.ui-sbp__table tbody tr { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-sbp__table th:first-child, .ui-sbp__table td:first-child { padding-left: var(--tc-space-4); }
.ui-sbp__table th:last-child, .ui-sbp__table td:last-child { padding-right: var(--tc-space-4); }
.ui-sbp__name { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-sbp__row[data-status="removed"] .ui-sbp__name { color: var(--tc-text-muted); text-decoration: line-through; }
.ui-sbp__purpose, .ui-sbp__where, .ui-sbp__transfer, .ui-sbp__added { color: var(--tc-text-secondary); }
.ui-sbp__added { white-space: nowrap; }
.ui-sbp__label { display: none; }
.ui-sbp__chips { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); }
.ui-sbp__chip { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); white-space: nowrap; }
/* The status pill: a tint, a mark and a word */
.ui-sbp__pill { display: inline-flex; align-items: center; gap: var(--tc-space-1); min-height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; }
.ui-sbp__pill[data-status="active"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-sbp__pill[data-status="new"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-sbp__pill[data-status="removed"] { background: var(--tc-fill-default); color: var(--tc-text-secondary); }
.ui-sbp__empty { padding: var(--tc-space-6) var(--tc-space-4) !important; color: var(--tc-text-muted); text-align: center; }
/* ----- Subscribe ----- */
.ui-sbp__foot { padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-sbp__subscribe { display: grid; gap: var(--tc-space-1); max-width: 520px; }
.ui-sbp__sub-label { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-sbp__hint { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-sbp__sub-row { display: flex; gap: var(--tc-space-2); margin-top: var(--tc-space-1); }
.ui-sbp__error { font-size: var(--tc-font-size-xs); color: var(--tc-status-danger-fg); }
.ui-sbp__done { display: flex; align-items: center; gap: var(--tc-space-2); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-sbp__done svg { color: var(--tc-status-success-fg); }
.ui-sbp__done strong { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
/* Narrow: each vendor a card, its labels shown */
@container (max-width: 560px) {
  .ui-sbp__table thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  .ui-sbp__table, .ui-sbp__table tbody { display: block; }
  .ui-sbp__table tbody tr { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--tc-space-1-5); padding: var(--tc-space-3) var(--tc-space-4); }
  .ui-sbp__table th, .ui-sbp__table td, .ui-sbp__table th:first-child, .ui-sbp__table td:first-child, .ui-sbp__table th:last-child, .ui-sbp__table td:last-child { display: grid; gap: var(--tc-space-0-5); padding: 0; }
  .ui-sbp__label { display: block; font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
  .ui-sbp__sub-row { flex-wrap: wrap; }
}
@media (forced-colors: active) { .ui-sbp__pill, .ui-sbp__chip { border: 1px solid CanvasText; } }
@media (prefers-reduced-motion: reduce) {
  [data-ui="sbp"] *, [data-ui="sbp"] *::before, [data-ui="sbp"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-subprocessor-list")) customElements.define("tc-subprocessor-list", TcSubprocessorList);

declare global {
  interface HTMLElementTagNameMap {
    "tc-subprocessor-list": TcSubprocessorList;
  }
}
