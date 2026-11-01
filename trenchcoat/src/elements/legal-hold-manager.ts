import { html, nothing, svg } from "lit";
import { property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { formatDate } from "./internal/util";

/*
 * <tc-legal-hold-manager> – which items are on legal hold, who placed each hold, why and until when. Active holds come
 * first, and a hold past its `until` date is marked Review overdue when the page gives `now`. A row opens its detail,
 * with the items held, a way to add one, and Release, which needs a written reason and says how many items it frees.
 * This records decisions: the page's server is what actually stops anything being changed or deleted.
 * ↑ ↓ Home End move between holds, Enter or Space opens one.
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-legal-hold-manager .holds=${holds} .now=${now}></tc-legal-hold-manager>
 */

export type LegalHoldItem = { id: string; name: string; kind?: string };
export type LegalHoldStatus = "active" | "released";
export type LegalHold = {
  id: string;
  name: string;
  custodian?: string;
  placedBy: string;
  /** When it was placed, epoch ms */
  placedAt: number;
  /** When it's due for review, epoch ms */
  until?: number;
  reason: string;
  status: LegalHoldStatus;
  items: LegalHoldItem[];
  /** Why it was released */
  releaseReason?: string;
};
export type LegalHoldChangeKind = "add-item" | "release";
export type LegalHoldsChange = { holds: LegalHold[]; change: LegalHoldChangeKind; hold: LegalHold; item?: LegalHoldItem; reason?: string };
export type LegalHoldSelectedChange = { selected: string | null; hold: LegalHold | null };

/** The manager's words, every one renameable through `labels` */
export type LegalHoldManagerLabels = {
  active: string;
  released: string;
  overdue: string;
  /** {n} */
  items: string;
  itemsOne: string;
  /** {n} active */
  count: string;
  custodian: string;
  placedBy: string;
  placedOn: string;
  reviewBy: string;
  reason: string;
  releaseReason: string;
  heldItems: string;
  noItems: string;
  addLabel: string;
  addPlaceholder: string;
  add: string;
  release: string;
  /** {n} items */
  confirm: string;
  confirmOne: string;
  releaseWhy: string;
  releasePlaceholder: string;
  needsReason: string;
  confirmRelease: string;
  keep: string;
  empty: string;
  /** Announced; {hold}, {item} */
  added: string;
  releasedNote: string;
};
export const defaultLegalHoldManagerLabels: LegalHoldManagerLabels = {
  active: "On hold",
  released: "Released",
  overdue: "Review overdue",
  items: "{n} items",
  itemsOne: "1 item",
  count: "{n} on hold",
  custodian: "Custodian",
  placedBy: "Placed by",
  placedOn: "Placed on",
  reviewBy: "Review by",
  reason: "Reason",
  releaseReason: "Why it was released",
  heldItems: "Items held",
  noItems: "Nothing held yet.",
  addLabel: "Add an item",
  addPlaceholder: "File or folder name",
  add: "Add",
  release: "Release hold",
  confirm: "Releasing this frees {n} items to be changed or deleted.",
  confirmOne: "Releasing this frees 1 item to be changed or deleted.",
  releaseWhy: "Why release it?",
  releasePlaceholder: "This goes in the record",
  needsReason: "Add a reason for releasing it.",
  confirmRelease: "Release",
  keep: "Keep on hold",
  empty: "No legal holds.",
  added: "Added {item} to {hold}",
  releasedNote: "Released {hold}",
};

const ICON = svg`<rect width="18" height="11" x="3" y="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>`;
let instances = 0;

/**
 * Which items are on legal hold, with adding items and releasing a hold for a written reason.
 * @tag tc-legal-hold-manager
 * @fires tc-holds-change - An item was added or a hold released ({ holds, change, hold, item, reason }: LegalHoldsChange); cancelable – prevented, `holds` stays as it was
 * @fires tc-selected-change - A hold was opened or closed ({ selected, hold }: LegalHoldSelectedChange); cancelable – prevented, `selected` stays as it was
 */
export class TcLegalHoldManager extends TcElement {
  static override ui = "lhm";

  /** The heading */
  @property() accessor heading = "Legal holds";
  /** A line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The holds. Changed by the user unless a tc-holds-change listener calls preventDefault() */
  @property({ attribute: false }) accessor holds: LegalHold[] = [];
  /** The id of the open hold. Changed by the user unless a tc-selected-change listener calls preventDefault() */
  @property() accessor selected: string | null = null;
  /** The current time, epoch ms; without it nothing's marked overdue */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** Show the holds without letting them change */
  @property({ type: Boolean, reflect: true }) accessor readonly = false;
  /** The locale for dates */
  @property() accessor locale: string | undefined = undefined;
  /** Rename any of the words */
  @property({ attribute: false }) accessor labels: Partial<LegalHoldManagerLabels> = {};

  @state() private accessor active = "";
  @state() private accessor releasing: string | null = null;
  @state() private accessor releaseNote = "";
  @state() private accessor tried = false;
  @state() private accessor newItem = "";
  @state() private accessor announce = "";
  private readonly uid = `tc-lhm-${++instances}`;
  private nextItem = 1;

  private get words(): LegalHoldManagerLabels {
    return { ...defaultLegalHoldManagerLabels, ...this.labels };
  }
  private overdue(h: LegalHold) {
    return h.status === "active" && h.until !== undefined && this.now !== undefined && h.until < this.now;
  }
  private get ordered() {
    const rank = (h: LegalHold) => (h.status === "released" ? 2 : this.overdue(h) ? 0 : 1);
    return [...this.holds].sort((a, b) => rank(a) - rank(b));
  }
  private count(n: number) {
    return n === 1 ? this.words.itemsOne : this.words.items.replace("{n}", String(n));
  }

  private open(hold: LegalHold) {
    const selected = this.selected === hold.id ? null : hold.id;
    this.active = hold.id;
    if (!this.emit<LegalHoldSelectedChange>("tc-selected-change", { selected, hold: selected ? hold : null }, { cancelable: true })) return;
    this.selected = selected;
    this.releasing = null;
    this.newItem = "";
  }

  private onListKey(e: KeyboardEvent) {
    if (!(e.target as HTMLElement).classList.contains("ui-lhm__row-button")) return;
    const ids = this.ordered.map((h) => h.id);
    const at = ids.indexOf((e.target as HTMLElement).dataset.hold ?? "");
    let next = -1;
    if (e.key === "ArrowDown") next = Math.min(ids.length - 1, at + 1);
    else if (e.key === "ArrowUp") next = Math.max(0, at - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = ids.length - 1;
    if (next < 0) return;
    e.preventDefault();
    this.active = ids[next]!;
    this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-lhm__row-button[data-hold="${CSS.escape(ids[next]!)}"]`)?.focus());
  }

  private commit(holds: LegalHold[], detail: Omit<LegalHoldsChange, "holds">) {
    if (!this.emit<LegalHoldsChange>("tc-holds-change", { holds, ...detail }, { cancelable: true })) return false;
    this.holds = holds;
    return true;
  }

  private addItem(hold: LegalHold) {
    const name = this.newItem.trim();
    if (!name) return;
    let id: string;
    do id = `item-${this.nextItem++}`;
    while (hold.items.some((i) => i.id === id));
    const item = { id, name };
    const next = { ...hold, items: [...hold.items, item] };
    if (this.commit(this.holds.map((h) => (h.id === hold.id ? next : h)), { change: "add-item", hold: next, item })) {
      this.newItem = "";
      this.announce = this.words.added.replace("{item}", name).replace("{hold}", hold.name);
    }
  }

  private startRelease(hold: LegalHold) {
    this.releasing = hold.id;
    this.releaseNote = "";
    this.tried = false;
    this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-lhm__note")?.focus());
  }

  private cancelRelease() {
    this.releasing = null;
    this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-lhm__release")?.focus());
  }

  private confirmRelease(hold: LegalHold) {
    const reason = this.releaseNote.trim();
    if (!reason) {
      this.tried = true;
      this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-lhm__note")?.focus());
      return;
    }
    const next: LegalHold = { ...hold, status: "released", releaseReason: reason };
    if (!this.commit(this.holds.map((h) => (h.id === hold.id ? next : h)), { change: "release", hold: next, reason })) return;
    this.releasing = null;
    this.announce = this.words.releasedNote.replace("{hold}", hold.name);
    this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-lhm__row-button[data-hold="${CSS.escape(hold.id)}"]`)?.focus());
  }

  private fact(term: string, value: string) {
    return html`<div class="ui-lhm__fact"><dt>${term}</dt><dd>${value}</dd></div>`;
  }

  private renderRelease(hold: LegalHold) {
    const w = this.words;
    const n = hold.items.length;
    const noteId = `${this.uid}-note`;
    const missing = this.tried && !this.releaseNote.trim();
    return html`<div class="ui-lhm__confirm" role="group" aria-label=${`${w.release}, ${hold.name}`}>
      <p class="ui-lhm__warning">${n === 1 ? w.confirmOne : w.confirm.replace("{n}", String(n))}</p>
      <label class="ui-lhm__label" for=${noteId}>${w.releaseWhy}</label>
      <textarea
        id=${noteId}
        class="ui-lhm__note"
        rows="2"
        placeholder=${w.releasePlaceholder}
        aria-required="true"
        aria-invalid=${missing ? "true" : "false"}
        aria-describedby=${missing ? `${noteId}-error` : nothing}
        .value=${live(this.releaseNote)}
        @input=${(e: Event) => (this.releaseNote = (e.target as HTMLTextAreaElement).value)}
      ></textarea>
      ${missing ? html`<p class="ui-lhm__error" id=${`${noteId}-error`}>${w.needsReason}</p>` : nothing}
      <div class="ui-lhm__actions">
        <button type="button" class="tc-btn-sm ui-lhm__keep" @click=${this.cancelRelease}>${w.keep}</button>
        <button type="button" class="tc-btn-sm ui-lhm__confirm-release" @click=${() => this.confirmRelease(hold)}>${w.confirmRelease}</button>
      </div>
    </div>`;
  }

  private renderDetail(hold: LegalHold) {
    const w = this.words;
    const editable = !this.readonly && hold.status === "active";
    const addId = `${this.uid}-add`;
    return html`<div class="ui-lhm__detail" id=${`${this.uid}-${hold.id}`}>
      <dl class="ui-lhm__facts">
        ${hold.custodian ? this.fact(w.custodian, hold.custodian) : nothing} ${this.fact(w.placedBy, hold.placedBy)} ${this.fact(w.placedOn, formatDate(hold.placedAt, this.locale, { dateStyle: "medium" }))}
        ${hold.until !== undefined ? this.fact(w.reviewBy, formatDate(hold.until, this.locale, { dateStyle: "medium" })) : nothing} ${this.fact(w.reason, hold.reason)}
        ${hold.releaseReason ? this.fact(w.releaseReason, hold.releaseReason) : nothing}
      </dl>
      <h4 class="ui-lhm__items-title">${w.heldItems}</h4>
      ${hold.items.length
        ? html`<ul class="ui-lhm__items">${repeat(hold.items, (i) => i.id, (i) => html`<li class="ui-lhm__item"><span class="ui-lhm__item-name">${i.name}</span>${i.kind ? html`<span class="ui-lhm__item-kind">${i.kind}</span>` : nothing}</li>`)}</ul>`
        : html`<p class="ui-lhm__none">${w.noItems}</p>`}
      ${editable
        ? html`<form
              class="ui-lhm__add"
              @submit=${(e: Event) => {
                e.preventDefault();
                this.addItem(hold);
              }}
            >
              <label class="ui-lhm__label" for=${addId}>${w.addLabel}</label>
              <div class="ui-lhm__add-row">
                <span class="ui-lhm__field"><input id=${addId} class="ui-lhm__input" placeholder=${w.addPlaceholder} .value=${live(this.newItem)} @input=${(e: Event) => (this.newItem = (e.target as HTMLInputElement).value)} /></span>
                <button type="submit" class="tc-btn-sm ui-lhm__add-button" ?disabled=${!this.newItem.trim()}>${w.add}</button>
              </div>
            </form>
            ${this.releasing === hold.id
              ? this.renderRelease(hold)
              : html`<div class="ui-lhm__actions"><button type="button" class="tc-btn-sm ui-lhm__release" @click=${() => this.startRelease(hold)}>${w.release}<span class="tc-sr-only">, ${hold.name}</span></button></div>`}`
        : nothing}
    </div>`;
  }

  private renderRow(hold: LegalHold, stop: string) {
    const w = this.words;
    const open = this.selected === hold.id;
    return html`<li class="ui-lhm__row" data-status=${hold.status}>
      <button type="button" class="ui-lhm__row-button" data-hold=${hold.id} tabindex=${hold.id === stop ? 0 : -1} aria-expanded=${open ? "true" : "false"} aria-controls=${open ? `${this.uid}-${hold.id}` : nothing} @click=${() => this.open(hold)}>
        <span class="ui-lhm__who">
          <span class="ui-lhm__name">${hold.name}</span>
          <span class="ui-lhm__meta">${this.count(hold.items.length)}${hold.custodian ? ` · ${hold.custodian}` : ""}</span>
        </span>
        ${this.overdue(hold) ? html`<span class="ui-lhm__overdue">${w.overdue}</span>` : nothing}
        <span class="ui-lhm__status" data-status=${hold.status}>${hold.status === "active" ? w.active : w.released}</span>
      </button>
      ${open ? this.renderDetail(hold) : nothing}
    </li>`;
  }

  protected override render() {
    const w = this.words;
    const rows = this.ordered;
    const stop = rows.some((h) => h.id === this.active) ? this.active : rows.some((h) => h.id === this.selected) ? this.selected! : (rows[0]?.id ?? "");
    const activeCount = this.holds.filter((h) => h.status === "active").length;
    return html`${cardHead({ icon: ICON, title: this.heading, subtitle: this.description, id: `${this.uid}-title`, aside: html`<span class="ui-lhm__count">${w.count.replace("{n}", String(activeCount))}</span>` })}
      <div class="ui-lhm__card">
        ${rows.length ? html`<ul class="ui-lhm__list" aria-labelledby=${`${this.uid}-title`} @keydown=${this.onListKey}>${repeat(rows, (h) => h.id, (h) => this.renderRow(h, stop))}</ul>` : html`<p class="ui-lhm__empty">${w.empty}</p>`}
      </div>
      <span class="tc-sr-only" role="status">${this.announce}</span>`;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="lhm"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="lhm"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
[data-ui="lhm"] *, [data-ui="lhm"] *::before, [data-ui="lhm"] *::after { box-sizing: border-box; }
[data-ui="lhm"] :where(p, dl, dd, h4) { margin: 0; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="lhm"] .ui-lhm__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-lhm__count { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); white-space: nowrap; }
.ui-lhm__list, .ui-lhm__items { display: grid; margin: 0; padding: 0; list-style: none; }
.ui-lhm__row + .ui-lhm__row { box-shadow: inset 0 var(--tc-hairline) var(--tc-border-subtle); }
.ui-lhm__row-button { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-3); width: 100%; min-height: var(--tc-control-h-md); padding: var(--tc-space-3) var(--tc-space-4); border: 0; background: none; color: inherit; font: inherit; text-align: left; cursor: pointer; }
.ui-lhm__row-button:hover { background: var(--tc-fill-hover); }
.ui-lhm__row-button[aria-expanded="true"] { background: var(--tc-fill-selected); }
.ui-lhm__row-button:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
.ui-lhm__who { display: grid; flex: 1 1 12em; gap: var(--tc-space-0-5); min-width: 0; }
.ui-lhm__name { font-weight: var(--tc-font-weight-medium); overflow-wrap: anywhere; }
.ui-lhm__meta { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); overflow-wrap: anywhere; }
.ui-lhm__overdue { color: var(--tc-status-warning-fg); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-lhm__status { padding: var(--tc-space-0-5) var(--tc-space-2); border-radius: var(--tc-radius-full); background: var(--tc-fill-hover); color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-lhm__status[data-status="active"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-lhm__detail { display: grid; gap: var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-4); }
.ui-lhm__facts { display: grid; gap: var(--tc-space-1); }
.ui-lhm__fact { display: grid; grid-template-columns: minmax(6em, 1fr) 3fr; gap: var(--tc-space-2); }
.ui-lhm__fact dt { color: var(--tc-text-secondary); }
.ui-lhm__fact dd { min-width: 0; overflow-wrap: anywhere; }
.ui-lhm__items-title, .ui-lhm__label { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-lhm__item { display: flex; justify-content: space-between; gap: var(--tc-space-2); padding: var(--tc-space-1) 0; }
.ui-lhm__item-name { min-width: 0; overflow-wrap: anywhere; }
.ui-lhm__item-kind, .ui-lhm__none { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); }
.ui-lhm__add, .ui-lhm__confirm { display: grid; gap: var(--tc-space-1); }
.ui-lhm__add-row { display: flex; gap: var(--tc-space-2); }
.ui-lhm__field { display: flex; flex: 1; align-items: center; min-width: 0; height: var(--tc-field-h); padding: 0 var(--tc-field-px); border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); }
.ui-lhm__field:focus-within { box-shadow: var(--tc-field-shadow-focus); }
.ui-lhm__input { flex: 1; width: 100%; min-width: 0; padding: 0; border: 0; outline: 0; background: none; color: var(--tc-text-primary); font: inherit; font-size: var(--tc-field-font-size); }
.ui-lhm__input::placeholder, .ui-lhm__note::placeholder { color: var(--tc-text-muted); }
.ui-lhm__confirm { padding: var(--tc-space-3); border-radius: var(--tc-control-radius-md); background: var(--tc-fill-hover); }
.ui-lhm__warning { color: var(--tc-status-warning-fg); font-weight: var(--tc-font-weight-medium); }
.ui-lhm__note { width: 100%; padding: var(--tc-space-1-5) var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); color: var(--tc-text-primary); font: inherit; resize: vertical; }
.ui-lhm__note:focus { outline: 0; box-shadow: var(--tc-field-shadow-focus); }
.ui-lhm__note[aria-invalid="true"] { box-shadow: var(--tc-field-shadow-invalid); }
.ui-lhm__error { color: var(--tc-status-danger-fg); font-size: var(--tc-font-size-xs); }
.ui-lhm__actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--tc-space-2); margin-top: var(--tc-space-1); }
.ui-lhm__empty { padding: var(--tc-space-6) var(--tc-space-4); color: var(--tc-text-secondary); text-align: center; }
@media (forced-colors: active) {
  .ui-lhm__row-button[aria-expanded="true"] { outline: 2px solid Highlight; outline-offset: -2px; }
}
`;
}

if (!customElements.get("tc-legal-hold-manager")) customElements.define("tc-legal-hold-manager", TcLegalHoldManager);

declare global {
  interface HTMLElementTagNameMap {
    "tc-legal-hold-manager": TcLegalHoldManager;
  }
}
