import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController } from "./internal/controllers";

/*
 * <tc-partial-results> – a bulk run that partly finished, because partial results beat a failure. A headline says it in
 * words – "34 of 40 finished · 6 didn't" – over a bar split into finished, failed and skipped (read as text too). Below it the
 * unfinished items are grouped by reason, biggest first ("Couldn't open the file (4)"), each item with its own reason and a
 * Retry. At the foot: Retry failed, Continue with what finished, and Download the list.
 *   · Retry fires a cancelable `tc-retry` with the ids; unless prevented they show as retrying until the page replaces them
 *   · Continue fires `tc-continue` with the finished ids; Download fires a cancelable `tc-export` and, unless prevented,
 *     saves the unfinished items as a CSV
 *   · the groups are one tab stop: ↑ ↓ move, Home / End go to the ends, Enter or Space opens or closes one
 * `variant="notice"` is one line and a Retry, for the top of a results list. Give `items` for every item, or `done` and
 * `total` as numbers with only the unfinished ones in `items`. Standard: the header on a gray tray above a white card.
 * Clean: one white card, the header its first row. When narrow, a group's items stack under its reason.
 *
 *   <tc-partial-results total="40" done="34" .items=${unfinished}></tc-partial-results>
 */

export type PartialResultStatus = "done" | "failed" | "skipped";
export type PartialResultsVariant = "card" | "notice";
export type PartialResultItem = {
  id: string;
  /** What it is, e.g. a file or a case name */
  label: string;
  status: PartialResultStatus;
  /** Why it didn't finish, in words – items are grouped by it */
  reason?: string;
  /** More about it, such as the error */
  detail?: string;
};
export type PartialResultsCollapsedChange = { collapsed: string[] };
export type PartialResultsRetry = { ids: string[]; items: PartialResultItem[] };
export type PartialResultsContinue = { done: string[] };
export type PartialResultsExport = { items: PartialResultItem[]; csv: string };

/** The element's words, every one renameable through `labels` */
export type PartialResultsLabels = {
  /** {done} and {total} */
  finished: string;
  /** {n} */
  didnt: string;
  allDone: string;
  done: string;
  failed: string;
  skipped: string;
  /** {n} and {status}, in the bar's text */
  part: string;
  noReason: string;
  /** {reason} and {n} */
  group: string;
  retry: string;
  /** {label} */
  retryOne: string;
  /** {n} */
  retryFailed: string;
  retrying: string;
  /** {n} */
  continueWith: string;
  download: string;
  unfinished: string;
  /** Announced: {label} */
  retryingOne: string;
  /** Announced: {n} */
  retryingMany: string;
  /** The CSV's file name */
  fileName: string;
};
export const defaultPartialResultsLabels: PartialResultsLabels = {
  finished: "{done} of {total} finished",
  didnt: "{n} didn't",
  allDone: "All finished",
  done: "Finished",
  failed: "Failed",
  skipped: "Skipped",
  part: "{n} {status}",
  noReason: "No reason given",
  group: "{reason} ({n})",
  retry: "Retry",
  retryOne: "Retry {label}",
  retryFailed: "Retry failed ({n})",
  retrying: "Retrying…",
  continueWith: "Continue with {n} finished",
  download: "Download the list",
  unfinished: "What didn't finish",
  retryingOne: "Retrying {label}",
  retryingMany: "Retrying {n}",
  fileName: "unfinished.csv",
};

/* list-x: Lucide (ISC, lucide.dev) */
const ICON = svg`<path d="M11 12H3"></path><path d="M16 6H3"></path><path d="M16 18H3"></path><path d="m19 10-4 4"></path><path d="m15 10 4 4"></path>`;
/* Each status's shape, so colour is never the only cue */
const MARKS: Record<PartialResultStatus, ReturnType<typeof svg>> = {
  done: svg`<circle cx="12" cy="12" r="9"></circle><path d="m8 12 3 3 5-6"></path>`,
  failed: svg`<circle cx="12" cy="12" r="9"></circle><path d="m15 9-6 6M9 9l6 6"></path>`,
  skipped: svg`<circle cx="12" cy="12" r="9"></circle><path d="M8 12h8"></path>`,
};
let instances = 0;

const csvCell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/**
 * A bulk run that partly finished: what finished, what didn't and why, and a way to retry the rest.
 * @tag tc-partial-results
 * @fires tc-collapsed-change - A reason group was opened or closed ({ collapsed }: PartialResultsCollapsedChange); cancelable – prevented, `collapsed` stays as it was
 * @fires tc-retry - Retry was pressed, for one item or every failed one ({ ids, items }: PartialResultsRetry); cancelable – prevented, they aren't marked retrying
 * @fires tc-continue - Continue with what finished was pressed ({ done }: PartialResultsContinue)
 * @fires tc-export - Download the list was pressed ({ items, csv }: PartialResultsExport); cancelable – prevented, nothing is saved
 */
export class TcPartialResults extends TcElement {
  static override ui = "ptr";

  /** The heading */
  @property() accessor heading = "Partial results";
  /** A line under the heading – what the run was */
  @property() accessor description: string | undefined = undefined;
  /** The items: every one, or only the unfinished ones with `done` and `total` */
  @property({ attribute: false }) accessor items: PartialResultItem[] = [];
  /** How many there were in all; by default the items' count */
  @property({ type: Number }) accessor total: number | undefined = undefined;
  /** How many finished; by default the items marked done */
  @property({ type: Number }) accessor done: number | undefined = undefined;
  /** "card", the whole picture, or "notice", one line and a Retry */
  @property({ reflect: true }) accessor variant: PartialResultsVariant = "card";
  /** The reasons whose groups are closed. Changed by the user unless a tc-collapsed-change listener calls preventDefault() */
  @property({ attribute: false }) accessor collapsed: string[] = [];
  /** Ids being retried; set by Retry unless its listener calls preventDefault(), and cleared for an item when the page replaces it */
  @property({ attribute: false }) accessor retrying: string[] = [];
  /** Hide Continue, for a run with nothing to continue to */
  @property({ type: Boolean, attribute: "hide-continue" }) accessor hideContinue = false;
  /** Hide Download the list */
  @property({ type: Boolean, attribute: "hide-download" }) accessor hideDownload = false;
  /** The locale for numbers */
  @property() accessor locale: string | undefined = undefined;
  /** Rename any of the words */
  @property({ attribute: false }) accessor labels: Partial<PartialResultsLabels> = {};

  @state() private accessor active: string | null = null;
  @state() private accessor announce = "";
  private readonly uid = `tc-ptr-${++instances}`;

  constructor() {
    super();
    new FocusRescueController(this, () => this.querySelector<HTMLElement>(".ui-ptr__group-toggle") ?? this.querySelector<HTMLElement>(".ui-ptr__action"));
  }

  private get words(): PartialResultsLabels {
    return { ...defaultPartialResultsLabels, ...this.labels };
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // An item the page has replaced is no longer being retried
    const before = changed.get("items") as PartialResultItem[] | undefined;
    if (before && this.retrying.length) {
      const old = new Map(before.map((i) => [i.id, i]));
      const now = new Map(this.items.map((i) => [i.id, i]));
      const kept = this.retrying.filter((id) => now.has(id) && now.get(id) === old.get(id) && now.get(id)!.status !== "done");
      if (kept.length !== this.retrying.length) this.retrying = kept;
    }
    const keys = this.groups.map((g) => g.key);
    if (this.active !== null && !keys.includes(this.active)) this.active = null;
  }

  private number(n: number) {
    try {
      return new Intl.NumberFormat(this.locale).format(n);
    } catch {
      return new Intl.NumberFormat().format(n);
    }
  }

  /** Finished, failed and skipped, with what's not accounted for counted as skipped */
  private get counts() {
    const failed = this.items.filter((i) => i.status === "failed").length;
    const listedSkipped = this.items.filter((i) => i.status === "skipped").length;
    const done = Math.max(0, this.done ?? this.items.filter((i) => i.status === "done").length);
    const total = Math.max(this.total ?? 0, this.items.length, done + failed + listedSkipped);
    const skipped = total - done - failed;
    return { done, failed, skipped, total, didnt: total - done };
  }

  private get unfinished() {
    return this.items.filter((i) => i.status !== "done");
  }

  /** The unfinished items by reason, biggest group first */
  private get groups() {
    const map = new Map<string, PartialResultItem[]>();
    for (const i of this.unfinished) {
      const key = i.reason ?? "";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(i);
    }
    return [...map.entries()].map(([key, items]) => ({ key, items })).sort((a, b) => b.items.length - a.items.length);
  }

  private headline() {
    const w = this.words;
    const c = this.counts;
    if (c.didnt === 0) return w.allDone;
    return `${w.finished.replace("{done}", this.number(c.done)).replace("{total}", this.number(c.total))} · ${w.didnt.replace("{n}", this.number(c.didnt))}`;
  }

  private retry(items: PartialResultItem[]) {
    const ids = items.map((i) => i.id).filter((id) => !this.retrying.includes(id));
    if (!ids.length) return;
    const chosen = items.filter((i) => ids.includes(i.id));
    if (this.emit<PartialResultsRetry>("tc-retry", { ids, items: chosen }, { cancelable: true })) {
      this.retrying = [...this.retrying, ...ids];
      const w = this.words;
      this.announce = ids.length === 1 ? w.retryingOne.replace("{label}", chosen[0]!.label) : w.retryingMany.replace("{n}", String(ids.length));
    }
  }

  private retryFailed = () => this.retry(this.items.filter((i) => i.status === "failed"));

  private continueOn = () => {
    this.emit<PartialResultsContinue>("tc-continue", { done: this.items.filter((i) => i.status === "done").map((i) => i.id) });
  };

  private download = () => {
    const w = this.words;
    const items = this.unfinished;
    const csv = ["label,status,reason,detail", ...items.map((i) => [i.label, w[i.status], i.reason ?? "", i.detail ?? ""].map(csvCell).join(","))].join("\n");
    if (!this.emit<PartialResultsExport>("tc-export", { items, csv }, { cancelable: true })) return;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = w.fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  private toggle(key: string) {
    this.active = key;
    const collapsed = this.collapsed.includes(key) ? this.collapsed.filter((k) => k !== key) : [...this.collapsed, key];
    if (this.emit<PartialResultsCollapsedChange>("tc-collapsed-change", { collapsed }, { cancelable: true })) this.collapsed = collapsed;
  }

  private onKey(e: KeyboardEvent) {
    const target = (e.target as HTMLElement).closest<HTMLElement>(".ui-ptr__group-toggle");
    if (!target) return;
    const keys = this.groups.map((g) => g.key);
    const at = keys.indexOf(target.dataset.group ?? "");
    let next = -1;
    if (e.key === "ArrowDown") next = Math.min(keys.length - 1, at + 1);
    else if (e.key === "ArrowUp") next = Math.max(0, at - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = keys.length - 1;
    if (next < 0) return;
    e.preventDefault();
    const key = keys[next]!;
    this.active = key;
    this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-ptr__group-toggle[data-group="${CSS.escape(key)}"]`)?.focus());
  }

  private renderBar() {
    const w = this.words;
    const c = this.counts;
    const parts = (["done", "failed", "skipped"] as PartialResultStatus[]).map((s) => ({ s, n: c[s] })).filter((p) => p.n > 0);
    const text = parts.map((p) => w.part.replace("{n}", this.number(p.n)).replace("{status}", w[p.s].toLocaleLowerCase(this.locale))).join(", ");
    return html`<div class="ui-ptr__bar" role="img" aria-label=${text}>
        ${parts.map((p) => html`<span class="ui-ptr__seg" data-status=${p.s} style=${styleMap({ flexGrow: String(p.n) })}></span>`)}
      </div>
      <ul class="ui-ptr__legend" aria-hidden="true">
        ${parts.map((p) => html`<li class="ui-ptr__key" data-status=${p.s}><svg class="ui-ptr__mark" viewBox="0 0 24 24">${MARKS[p.s]}</svg>${w.part.replace("{n}", this.number(p.n)).replace("{status}", w[p.s].toLocaleLowerCase(this.locale))}</li>`)}
      </ul>`;
  }

  private renderItem(i: PartialResultItem) {
    const w = this.words;
    const busy = this.retrying.includes(i.id);
    return html`<li class="ui-ptr__item" data-status=${i.status} ?data-retrying=${busy}>
      <svg class="ui-ptr__mark" viewBox="0 0 24 24" aria-hidden="true">${MARKS[i.status]}</svg>
      <div class="ui-ptr__what">
        <span class="ui-ptr__label">${i.label}</span>
        <span class="ui-ptr__status">${busy ? w.retrying : w[i.status]}${i.detail ? html` · <span class="ui-ptr__detail">${i.detail}</span>` : nothing}</span>
      </div>
      <button type="button" class="tc-btn-sm ui-ptr__retry" ?disabled=${busy} @click=${() => this.retry([i])}>
        ${busy ? html`<span class="ui-ptr__spinner" aria-hidden="true"></span>` : nothing}${w.retry}<span class="tc-sr-only"> ${i.label}</span>
      </button>
    </li>`;
  }

  private renderGroups() {
    const w = this.words;
    const groups = this.groups;
    if (!groups.length) return nothing;
    const tabStop = this.active ?? groups[0]!.key;
    return html`<div class="ui-ptr__groups">
      <h4 class="ui-ptr__section" id=${`${this.uid}-groups`}>${w.unfinished}</h4>
      <ul class="ui-ptr__group-list" aria-labelledby=${`${this.uid}-groups`} @keydown=${this.onKey}>
        ${groups.map((g) => {
          const open = !this.collapsed.includes(g.key);
          const panel = `${this.uid}-g${groups.indexOf(g)}`;
          return html`<li class="ui-ptr__group">
            <button type="button" class="ui-ptr__group-toggle" data-group=${g.key} tabindex=${tabStop === g.key ? 0 : -1} aria-expanded=${open ? "true" : "false"} aria-controls=${open ? panel : nothing} @click=${() => this.toggle(g.key)}>
              <svg class="ui-ptr__chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"></path></svg>
              <span class="ui-ptr__reason">${w.group.replace("{reason}", g.key || w.noReason).replace("{n}", this.number(g.items.length))}</span>
            </button>
            ${open ? html`<ul class="ui-ptr__items" id=${panel}>${g.items.map((i) => this.renderItem(i))}</ul>` : nothing}
          </li>`;
        })}
      </ul>
    </div>`;
  }

  private renderActions() {
    const w = this.words;
    const c = this.counts;
    const failed = this.items.filter((i) => i.status === "failed" && !this.retrying.includes(i.id));
    return html`<div class="ui-ptr__actions">
      ${!this.hideDownload && this.unfinished.length ? html`<button type="button" class="tc-btn-sm ui-ptr__action" data-action="download" @click=${this.download}>${w.download}</button>` : nothing}
      ${!this.hideContinue && c.done > 0 ? html`<button type="button" class="tc-btn-sm ui-ptr__action" data-action="continue" @click=${this.continueOn}>${w.continueWith.replace("{n}", this.number(c.done))}</button>` : nothing}
      ${failed.length ? html`<button type="button" class="tc-btn-sm ui-ptr__action ui-ptr__primary" data-action="retry" @click=${this.retryFailed}>${w.retryFailed.replace("{n}", this.number(failed.length))}</button>` : nothing}
    </div>`;
  }

  protected override render() {
    const w = this.words;
    const c = this.counts;
    const status = html`<span class="tc-sr-only" role="status">${this.announce}</span>`;
    if (this.variant === "notice") {
      const failed = this.items.filter((i) => i.status === "failed" && !this.retrying.includes(i.id));
      return html`<div class="ui-ptr__notice" ?data-clear=${c.didnt === 0}>
          <svg class="ui-ptr__mark" viewBox="0 0 24 24" aria-hidden="true">${MARKS[c.didnt === 0 ? "done" : "failed"]}</svg>
          <span class="ui-ptr__headline">${this.headline()}</span>
          ${failed.length ? html`<button type="button" class="tc-btn-sm ui-ptr__action" data-action="retry" @click=${this.retryFailed}>${w.retryFailed.replace("{n}", this.number(failed.length))}</button>` : nothing}
        </div>
        ${status}`;
    }
    return html`${cardHead({ icon: ICON, title: this.heading, subtitle: this.description, id: `${this.uid}-title` })}
      <div class="ui-ptr__card">
        <div class="ui-ptr__summary">
          <p class="ui-ptr__headline">${this.headline()}</p>
          ${c.total > 0 ? this.renderBar() : nothing}
        </div>
        ${this.renderGroups()}
        ${this.renderActions()}
      </div>
      ${status}`;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="ptr"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ptr"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
/* The bar's height – override it on the element */
[data-ui="ptr"] { --tc-ptr-bar: var(--tc-space-2); }
[data-ui="ptr"][variant="notice"] { padding: 0; border-radius: 0; background: none; box-shadow: none; }
[data-ui="ptr"] *, [data-ui="ptr"] *::before, [data-ui="ptr"] *::after { box-sizing: border-box; }
[data-ui="ptr"] :where(p, h4, ul) { margin: 0; }
[data-ui="ptr"] :where(ul) { padding: 0; list-style: none; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="ptr"] .ui-ptr__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-ptr__summary { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-4); }
.ui-ptr__headline { font-weight: var(--tc-font-weight-medium); font-variant-numeric: tabular-nums; }
.ui-ptr__bar { display: flex; gap: var(--tc-hairline); height: var(--tc-ptr-bar); overflow: hidden; border-radius: var(--tc-radius-full); background: var(--tc-meter-track); }
.ui-ptr__seg { flex-basis: 0; min-width: var(--tc-space-1); }
.ui-ptr__seg[data-status="done"] { background: var(--tc-status-success-solid); }
.ui-ptr__seg[data-status="failed"] { background: var(--tc-status-danger-solid); }
.ui-ptr__seg[data-status="skipped"] { background: var(--tc-chart-neutral); }
.ui-ptr__legend { display: flex; flex-wrap: wrap; gap: var(--tc-space-1) var(--tc-space-3); color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; }
.ui-ptr__key { display: inline-flex; align-items: center; gap: var(--tc-space-1); }
.ui-ptr__key[data-status="done"] .ui-ptr__mark, .ui-ptr__item[data-status="done"] .ui-ptr__mark { color: var(--tc-status-success-fg); }
.ui-ptr__key[data-status="failed"] .ui-ptr__mark, .ui-ptr__item[data-status="failed"] .ui-ptr__mark { color: var(--tc-status-danger-fg); }
.ui-ptr__mark { flex: none; width: var(--tc-space-3); height: var(--tc-space-3); fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; color: var(--tc-text-secondary); }
.ui-ptr__groups { display: grid; gap: var(--tc-space-1); padding: var(--tc-space-3) var(--tc-space-4); box-shadow: inset 0 var(--tc-hairline) var(--tc-border-subtle); }
.ui-ptr__section { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-ptr__group-list { display: grid; gap: var(--tc-space-1); }
.ui-ptr__group { min-width: 0; }
.ui-ptr__group-toggle { display: flex; align-items: center; gap: var(--tc-space-2); width: 100%; min-height: var(--tc-control-h-sm); padding: var(--tc-space-1) var(--tc-space-2); border: 0; border-radius: var(--tc-control-radius-sm); background: none; color: var(--tc-text-primary); font: inherit; font-weight: var(--tc-font-weight-medium); text-align: left; cursor: pointer; }
.ui-ptr__group-toggle:hover { background: var(--tc-fill-hover); }
.ui-ptr__group-toggle:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-ptr__chevron { flex: none; width: var(--tc-space-3); height: var(--tc-space-3); fill: none; stroke: var(--tc-text-secondary); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; transition: transform var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-ptr__group-toggle[aria-expanded="true"] .ui-ptr__chevron { transform: rotate(90deg); }
.ui-ptr__reason { overflow-wrap: anywhere; }
.ui-ptr__items { display: grid; gap: var(--tc-space-0-5); padding-left: var(--tc-space-6); }
.ui-ptr__item { display: flex; align-items: center; gap: var(--tc-space-2); min-height: var(--tc-control-h-sm); padding: var(--tc-space-1) 0; }
.ui-ptr__what { display: grid; flex: 1; min-width: 0; }
.ui-ptr__label { overflow-wrap: anywhere; }
.ui-ptr__status { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); overflow-wrap: anywhere; }
.ui-ptr__detail { font-family: var(--tc-font-mono); }
.ui-ptr__item[data-retrying] .ui-ptr__status { color: var(--tc-status-info-fg); }
.ui-ptr__spinner { width: var(--tc-space-3); height: var(--tc-space-3); border: var(--tc-space-0-5) solid var(--tc-border-subtle); border-top-color: currentColor; border-radius: var(--tc-radius-full); animation: ui-ptr-spin var(--tc-duration-slowest) linear infinite; }
@keyframes ui-ptr-spin { to { transform: rotate(1turn); } }
.ui-ptr__actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-4); box-shadow: inset 0 var(--tc-hairline) var(--tc-border-subtle); }
.ui-ptr__actions:empty { display: none; }
.ui-ptr__primary { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-ptr__primary:hover { background: var(--tc-action-primary-bg-hover); box-shadow: var(--tc-action-primary-shadow); }
.ui-ptr__notice { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); padding: var(--tc-space-2) var(--tc-space-3); border-radius: var(--tc-card-radius); background: var(--tc-status-warning-bg); color: var(--tc-text-primary); }
.ui-ptr__notice .ui-ptr__mark { color: var(--tc-status-warning-fg); }
.ui-ptr__notice[data-clear] { background: var(--tc-status-success-bg); }
.ui-ptr__notice[data-clear] .ui-ptr__mark { color: var(--tc-status-success-fg); }
.ui-ptr__notice .ui-ptr__headline { flex: 1 1 12em; }
@container (max-width: 480px) {
  .ui-ptr__items { padding-left: 0; }
  .ui-ptr__item { flex-wrap: wrap; }
  .ui-ptr__what { flex-basis: calc(100% - var(--tc-space-5)); }
  .ui-ptr__retry { margin-left: var(--tc-space-5); }
  .ui-ptr__actions { justify-content: stretch; }
  .ui-ptr__action { flex: 1 1 auto; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-ptr__chevron { transition: none; }
  .ui-ptr__spinner { animation: none; }
}
@media (forced-colors: active) {
  .ui-ptr__seg { background: CanvasText; }
  .ui-ptr__seg[data-status="failed"] { background: Mark; }
  .ui-ptr__seg[data-status="skipped"] { background: GrayText; }
}
`;
}

if (!customElements.get("tc-partial-results")) customElements.define("tc-partial-results", TcPartialResults);

declare global {
  interface HTMLElementTagNameMap {
    "tc-partial-results": TcPartialResults;
  }
}
