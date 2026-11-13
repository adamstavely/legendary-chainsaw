import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { ModalController } from "./internal/modal";
import { safeUrl } from "./internal/safe-url";
import { formatDate } from "./internal/util";

/*
 * <tc-data-controls> – a person's own data in an AI product: whether their chats help improve the model, whether chat
 * history is saved, whether the assistant keeps memories, a copy of everything they've stored, and deleting their
 * chats or their account. Each switch says what it means in words, and when it was last changed.
 *   · the switches are buttons with role="switch"; each change fires a cancelable tc-value-change with the whole value
 *     and the field that changed – prevented, the switch stays as it was
 *   · Save chat history off says new chats are deleted after 30 days; Memory links to where memories are managed
 *   · Export my data fires a cancelable tc-export, then says a link will be emailed, with the request's status from
 *     `exportStatus`
 *   · Delete all chats opens a modal dialog that names how many chats go and that it can't be undone; Delete chats
 *     fires a cancelable tc-delete-chats. Delete account is a link, or tc-delete-account without `deleteAccountHref`
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-data-controls .value=${{ training: false, history: true, memory: true }} chat-count="342"
 *     memory-href="/settings/memory"></tc-data-controls>
 */

export type DataControlsField = "training" | "history" | "memory";
export type DataControlsValue = Record<DataControlsField, boolean>;
export type DataExportStatus = "idle" | "requested" | "ready" | "failed";

/** Details of the events */
export type DataControlsValueChange = { value: DataControlsValue; field: DataControlsField };
export type DataControlsDeleteChats = { count: number };

/** The words the card uses; the page can rename any of them */
export type DataControlsLabels = {
  training: string;
  trainingOn: string;
  trainingOff: string;
  history: string;
  historyOn: string;
  historyOff: string;
  memory: string;
  memoryOn: string;
  memoryOff: string;
  manageMemory: string;
  changed: string;
  never: string;
  exportTitle: string;
  exportBody: string;
  exportButton: string;
  exportRequested: string;
  exportReady: string;
  exportDownload: string;
  exportFailed: string;
  deleteTitle: string;
  deleteBody: string;
  deleteButton: string;
  deleteConfirmTitle: string;
  deleteConfirmBody: string;
  deleteConfirm: string;
  cancel: string;
  deleted: string;
  deleteAccount: string;
};
export const defaultDataControlsLabels: DataControlsLabels = {
  training: "Improve the model with my chats",
  trainingOn: "Your chats may be used to train future models. Chats you delete aren't used.",
  trainingOff: "Your chats aren't used to train models.",
  history: "Save chat history",
  historyOn: "Chats are kept so you can come back to them.",
  historyOff: "New chats aren't saved to your history and are deleted after 30 days.",
  memory: "Memory",
  memoryOn: "The assistant remembers useful details from your chats.",
  memoryOff: "The assistant doesn't remember anything between chats.",
  manageMemory: "Manage memory",
  changed: "Changed",
  never: "Never changed",
  exportTitle: "Export your data",
  exportBody: "A copy of your chats, files and settings.",
  exportButton: "Export my data",
  exportRequested: "We'll email a link when it's ready.",
  exportReady: "Your export is ready.",
  exportDownload: "Download",
  exportFailed: "The export didn't work. Try again.",
  deleteTitle: "Delete all chats",
  deleteBody: "Removes every chat from your history.",
  deleteButton: "Delete all chats",
  deleteConfirmTitle: "Delete all {count} chats?",
  deleteConfirmBody: "Every chat in your history is deleted for good. This can't be undone.",
  deleteConfirm: "Delete chats",
  cancel: "Cancel",
  deleted: "All chats deleted.",
  deleteAccount: "Delete account",
};

const FIELDS: DataControlsField[] = ["training", "history", "memory"];

/* Shield, sparkles (training), history, brain (memory), download, trash and info: Lucide (ISC, lucide.dev) */
const shield = svg`<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>`;
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const ICON: Record<DataControlsField, () => ReturnType<typeof lucide>> = {
  training: () =>
    lucide(16, svg`<path d="M9.94 14.06 4 20M14 4l1.5 3.5L19 9l-3.5 1.5L14 14l-1.5-3.5L9 9l3.5-1.5z"></path><path d="M5 3v4M3 5h4"></path>`),
  history: () => lucide(16, svg`<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M12 7v5l4 2"></path>`),
  memory: () =>
    lucide(
      16,
      svg`<path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"></path><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"></path><path d="M12 5v13"></path>`,
    ),
};
const downloadIcon = () => lucide(14, svg`<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="m7 10 5 5 5-5"></path><path d="M12 15V3"></path>`);
const trashIcon = () => lucide(14, svg`<path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>`);
const infoIcon = () => lucide(14, svg`<circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path>`);

let uidCount = 0;

/**
 * A person's own data – switches for training, chat history and memory with what each means, Export my data, Delete
 * all chats behind a confirmation, and Delete account.
 * @tag tc-data-controls
 * @fires tc-value-change - A switch was flipped ({ value, field }: DataControlsValueChange); cancelable – prevented, the switch stays as it was
 * @fires tc-export - Export my data was pressed (detail: {}); cancelable – prevented, the status doesn't change
 * @fires tc-delete-chats - Delete chats was confirmed ({ count }: DataControlsDeleteChats); cancelable – prevented, the dialog stays open
 * @fires tc-delete-account - Delete account was pressed, when there's no `deleteAccountHref` (detail: {})
 */
export class TcDataControls extends TcElement {
  static override ui = "dcl";

  /** The heading */
  @property() accessor heading = "Data controls";
  /** One line under the heading */
  @property() accessor description = "";
  /** The switches. Changed by the user unless a tc-value-change listener calls preventDefault() */
  @property({ attribute: false }) accessor value: DataControlsValue = { training: false, history: true, memory: true };
  /** When each switch was last changed, epoch ms – the page records the change and passes it back */
  @property({ attribute: false }) accessor changed: Partial<Record<DataControlsField, number>> = {};
  /** How many chats Delete all chats removes */
  @property({ type: Number, attribute: "chat-count" }) accessor chatCount = 0;
  /** Where memories are managed; leave it unset and Manage memory isn't shown */
  @property({ attribute: "memory-href" }) accessor memoryHref = "";
  /** Where deleting the account starts; unset, Delete account fires tc-delete-account */
  @property({ attribute: "delete-account-href" }) accessor deleteAccountHref = "";
  /** Where the export stands: idle, requested (a link will be emailed), ready or failed. Set to requested by Export my data unless prevented */
  @property({ attribute: "export-status", reflect: true }) accessor exportStatus: DataExportStatus = "idle";
  /** The finished export's link, shown when `exportStatus` is ready */
  @property({ attribute: "export-href" }) accessor exportHref = "";
  /** Hides Delete account */
  @property({ type: Boolean, attribute: "hide-delete-account" }) accessor hideDeleteAccount = false;
  /** The language for dates, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;
  /** The card's words, merged over defaultDataControlsLabels */
  @property({ attribute: false }) accessor labels: Partial<DataControlsLabels> = {};

  /** The Delete all chats confirmation is open */
  @state() private accessor confirming = false;
  /** The polite status message */
  @state() private accessor announce = "";

  private uid = `tc-dcl-${++uidCount}`;
  private readonly modal = new ModalController(this, {
    dialog: () => this.querySelector<HTMLDialogElement>(".ui-dcl__dialog"),
    focus: () => this.querySelector<HTMLElement>(".ui-dcl__cancel"),
    lockScroll: true,
  });

  private get words(): DataControlsLabels {
    return { ...defaultDataControlsLabels, ...this.labels };
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    this.modal.sync(this.confirming);
  }

  private flip(field: DataControlsField) {
    const value = { ...this.value, [field]: !this.value[field] };
    if (!this.emit<DataControlsValueChange>("tc-value-change", { value, field }, { cancelable: true })) return;
    this.value = value;
    const w = this.words;
    this.announce = `${w[field]} ${value[field] ? "on" : "off"}`;
  }

  private requestExport() {
    if (!this.emit("tc-export", {}, { cancelable: true })) return;
    this.exportStatus = "requested";
    this.announce = this.words.exportRequested;
  }

  private closeDialog() {
    this.confirming = false;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-dcl__delete")?.focus());
  }
  private onDialogClose = () => {
    if (this.modal.ownClose()) return;
    this.confirming = false;
  };
  private confirmDelete() {
    const count = this.chatCount;
    if (!this.emit<DataControlsDeleteChats>("tc-delete-chats", { count }, { cancelable: true })) return;
    this.chatCount = 0;
    this.announce = this.words.deleted;
    this.closeDialog();
  }

  private renderSwitch(field: DataControlsField) {
    const w = this.words;
    const on = !!this.value[field];
    const id = `${this.uid}-${field}`;
    const at = this.changed[field];
    const manage = field === "memory" ? safeUrl(this.memoryHref) : undefined;
    return html`<li class="ui-dcl__row" data-field=${field}>
      <span class="ui-dcl__icon">${ICON[field]()}</span>
      <div class="ui-dcl__text">
        <span class="ui-dcl__label" id=${`${id}-label`}>${w[field]}</span>
        <span class="ui-dcl__means" id=${`${id}-means`}>${on ? w[`${field}On`] : w[`${field}Off`]}</span>
        ${field === "history" && !on ? html`<span class="ui-dcl__note">${infoIcon()}<span>${w.historyOff}</span></span>` : nothing}
        <span class="ui-dcl__when">${at ? html`${w.changed} <time datetime=${new Date(at).toISOString()}>${formatDate(at, this.locale, { day: "numeric", month: "short", year: "numeric" })}</time>` : w.never}</span>
        ${manage ? html`<a class="ui-dcl__link" href=${manage}>${w.manageMemory}</a>` : nothing}
      </div>
      <button
        type="button"
        role="switch"
        class="ui-dcl__switch"
        aria-checked=${on ? "true" : "false"}
        aria-labelledby=${`${id}-label`}
        aria-describedby=${`${id}-means`}
        @click=${() => this.flip(field)}
      >
        <span class="ui-dcl__track" aria-hidden="true"><span class="ui-dcl__knob"></span></span>
      </button>
    </li>`;
  }

  private renderExport() {
    const w = this.words;
    const s = this.exportStatus;
    const href = safeUrl(this.exportHref);
    return html`<div class="ui-dcl__action">
      <div class="ui-dcl__text">
        <span class="ui-dcl__label">${w.exportTitle}</span>
        <span class="ui-dcl__means">${w.exportBody}</span>
        ${s === "requested"
          ? html`<span class="ui-dcl__status" data-tone="info">${infoIcon()}<span>${w.exportRequested}</span></span>`
          : s === "ready"
            ? html`<span class="ui-dcl__status" data-tone="success">${downloadIcon()}<span>${w.exportReady}</span>${href ? html`<a class="ui-dcl__link" href=${href} download>${w.exportDownload}</a>` : nothing}</span>`
            : s === "failed"
              ? html`<span class="ui-dcl__status" data-tone="danger">${infoIcon()}<span>${w.exportFailed}</span></span>`
              : nothing}
      </div>
      <button type="button" class="tc-btn-sm ui-dcl__export" aria-disabled=${s === "requested" ? "true" : "false"} @click=${() => s !== "requested" && this.requestExport()}>
        ${downloadIcon()}${w.exportButton}
      </button>
    </div>`;
  }

  private renderDelete() {
    const w = this.words;
    const href = safeUrl(this.deleteAccountHref);
    return html`<div class="ui-dcl__action">
        <div class="ui-dcl__text">
          <span class="ui-dcl__label">${w.deleteTitle}</span>
          <span class="ui-dcl__means">${w.deleteBody}</span>
        </div>
        <button type="button" class="tc-btn-sm ui-dcl__delete" ?disabled=${this.chatCount <= 0} @click=${() => (this.confirming = true)}>${trashIcon()}${w.deleteButton}</button>
      </div>
      ${this.hideDeleteAccount
        ? nothing
        : html`<div class="ui-dcl__account">
            ${href
              ? html`<a class="ui-dcl__danger-link" href=${href}>${w.deleteAccount}</a>`
              : html`<button type="button" class="ui-dcl__danger-link" @click=${() => this.emit("tc-delete-account", {})}>${w.deleteAccount}</button>`}
          </div>`}`;
  }

  private renderDialog() {
    const w = this.words;
    const titleId = `${this.uid}-confirm`;
    return html`<dialog
      class="ui-dcl__dialog"
      aria-labelledby=${titleId}
      aria-describedby=${`${titleId}-body`}
      @keydown=${(e: KeyboardEvent) => e.key === "Escape" && e.stopPropagation()}
      @cancel=${(e: Event) => {
        e.preventDefault();
        this.closeDialog();
      }}
      @close=${this.onDialogClose}
    >
      <div class="ui-dcl__dialog-panel">
        <h2 class="ui-dcl__dialog-title" id=${titleId}>${w.deleteConfirmTitle.replace("{count}", this.chatCount.toLocaleString(this.locale))}</h2>
        <p class="ui-dcl__dialog-body" id=${`${titleId}-body`}>${w.deleteConfirmBody}</p>
        <div class="ui-dcl__dialog-actions">
          <button type="button" class="tc-btn-sm ui-dcl__cancel" @click=${() => this.closeDialog()}>${w.cancel}</button>
          <button type="button" class="tc-btn-sm ui-dcl__confirm" @click=${() => this.confirmDelete()}>${trashIcon()}${w.deleteConfirm}</button>
        </div>
      </div>
    </dialog>`;
  }

  protected override render() {
    const id = this.uid;
    return html`
      <span class="tc-sr-only" role="status">${this.announce}</span>
      ${cardHead({ icon: shield, title: this.heading, subtitle: this.description || undefined, id: `${id}-title` })}
      <div class="ui-dcl__card">
        <ul class="ui-dcl__list" aria-labelledby=${`${id}-title`}>
          ${FIELDS.map((f) => this.renderSwitch(f))}
        </ul>
        ${this.renderExport()} ${this.renderDelete()}
      </div>
      ${this.confirming || this.modal.showing ? this.renderDialog() : nothing}
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="dcl"] {
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="dcl"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
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
[data-ui="dcl"] { --tc-dcl-dialog-w: 400px; }
[data-ui="dcl"] *, [data-ui="dcl"] *::before, [data-ui="dcl"] *::after { box-sizing: border-box; }
[data-ui="dcl"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="dcl"] p, [data-ui="dcl"] h2 { margin: 0; }
[data-ui="dcl"] svg { display: block; flex: none; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="dcl"] svg[stroke-width] { stroke-width: 1.6; }
:where([data-look="standard"], [data-look="standard"] *).ui-dcl__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-dcl__card { display: grid; padding: var(--tc-space-1) var(--tc-space-4); }
.ui-dcl__row, .ui-dcl__action { display: flex; align-items: flex-start; gap: var(--tc-space-3); padding: var(--tc-space-3) 0; border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-dcl__icon { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-radius-md); background: var(--tc-fill-subtle); color: var(--tc-text-secondary); flex: none; }
.ui-dcl__text { display: grid; gap: var(--tc-space-0-5); flex: 1; min-width: 0; }
.ui-dcl__label { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-dcl__means { font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-dcl__when { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-dcl__note, .ui-dcl__status { display: flex; align-items: center; flex-wrap: wrap; gap: var(--tc-space-1-5); margin-top: var(--tc-space-1); padding: var(--tc-space-1-5) var(--tc-space-2-5); border-radius: var(--tc-radius-md); font-size: var(--tc-font-size-sm); background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-dcl__status[data-tone="info"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-dcl__status[data-tone="success"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-dcl__status[data-tone="danger"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-dcl__link { justify-self: start; font-size: var(--tc-font-size-sm); color: var(--tc-accent-text); text-decoration: underline; text-underline-offset: 2px; }
.ui-dcl__link:focus-visible, .ui-dcl__danger-link:focus-visible, .ui-dcl__switch:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); border-radius: var(--tc-radius-sm); }
/* The switch */
.ui-dcl__switch { display: grid; place-items: center; flex: none; min-height: var(--tc-control-h-sm); margin: 0; padding: 0 var(--tc-space-1); border: 0; background: none; cursor: pointer; }
.ui-dcl__track { position: relative; width: var(--tc-switch-w); height: var(--tc-switch-h); border-radius: var(--tc-switch-radius); background: var(--tc-switch-off); transition: background-color var(--tc-duration-moderate) var(--tc-ease-standard); }
.ui-dcl__knob { position: absolute; top: calc((var(--tc-switch-h) - var(--tc-switch-knob)) / 2); left: calc((var(--tc-switch-h) - var(--tc-switch-knob)) / 2); width: var(--tc-switch-knob); height: var(--tc-switch-knob); border-radius: var(--tc-radius-full); background: var(--tc-switch-knob-bg); box-shadow: var(--tc-shadow-control); transition: transform var(--tc-duration-moderate) var(--tc-ease-move); }
.ui-dcl__switch[aria-checked="true"] .ui-dcl__track { background: var(--tc-switch-on); }
.ui-dcl__switch[aria-checked="true"] .ui-dcl__knob { transform: translateX(calc(var(--tc-switch-w) - var(--tc-switch-h))); }
.ui-dcl__action .tc-btn-sm { gap: var(--tc-space-1-5); }
.ui-dcl__export[aria-disabled="true"] { opacity: 0.4; cursor: not-allowed; }
.ui-dcl__delete:not(:disabled) { color: var(--tc-status-danger-fg); }
.ui-dcl__account { padding: var(--tc-space-3) 0; }
.ui-dcl__danger-link { margin: 0; padding: 0; border: 0; background: none; font: inherit; font-size: var(--tc-font-size-sm); color: var(--tc-status-danger-fg); text-decoration: underline; text-underline-offset: 2px; cursor: pointer; }
/* The confirmation */
.ui-dcl__dialog { width: min(var(--tc-dcl-dialog-w), calc(100vw - var(--tc-space-8))); padding: 0; border: 0; border-radius: var(--tc-card-radius); background: var(--tc-surface-overlay); box-shadow: var(--tc-shadow-overlay); color: var(--tc-text-primary); font-family: var(--tc-font-sans); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); text-align: left; }
.ui-dcl__dialog:not([open]) { display: none; }
.ui-dcl__dialog::backdrop { background: var(--tc-scrim); }
.ui-dcl__dialog-panel { display: grid; gap: var(--tc-space-3); padding: var(--tc-space-5); }
.ui-dcl__dialog-title { font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-medium); }
.ui-dcl__dialog-body { color: var(--tc-text-secondary); }
.ui-dcl__dialog-actions { display: flex; justify-content: flex-end; gap: var(--tc-space-2); }
.ui-dcl__confirm.tc-btn-sm { gap: var(--tc-space-1-5); background: var(--tc-action-danger-bg); color: var(--tc-action-danger-fg); box-shadow: none; }
.ui-dcl__confirm.tc-btn-sm:hover { background: var(--tc-action-danger-bg-hover); }
@container (max-width: 380px) {
  .ui-dcl__action { flex-wrap: wrap; }
  .ui-dcl__icon { display: none; }
}
@media (forced-colors: active) {
  .ui-dcl__track { border: 1px solid CanvasText; }
  .ui-dcl__switch[aria-checked="true"] .ui-dcl__track { background: Highlight; }
  .ui-dcl__note, .ui-dcl__status { border: 1px solid CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="dcl"] *, [data-ui="dcl"] *::before, [data-ui="dcl"] *::after { transition: none !important; animation: none !important; }
}
`;
}

if (!customElements.get("tc-data-controls")) customElements.define("tc-data-controls", TcDataControls);

declare global {
  interface HTMLElementTagNameMap {
    "tc-data-controls": TcDataControls;
  }
}
