import { html, nothing, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { OnScreenController } from "./internal/controllers";

/*
 * <tc-bulk-action-bar> – what can be done to everything selected. It appears when `count` is above zero, says how many,
 * and offers the page's actions, Select all and Clear. A danger action with `confirm` asks first, naming how many. After
 * an action, Undo stays for `undo-seconds`, also once the page has cleared the selection; the timer holds off screen.
 * It's one toolbar with one tab stop: arrow keys, Home and End move, and Escape backs out of a question.
 * It sits where it's put, or at the bottom of the scrolling area with `sticky`.
 *
 *   <tc-bulk-action-bar count="3" total="40" .actions=${[{ id: "flag", label: "Flag" }]}></tc-bulk-action-bar>
 */

export type BulkAction = {
  id: string;
  label: string;
  /** Draws it as destructive */
  danger?: boolean;
  /** Ask before acting. The question names how many */
  confirm?: boolean;
  /** Offer Undo afterwards; by default yes */
  undoable?: boolean;
};
export type BulkActionDetail = { action: BulkAction; count: number };
export type BulkUndoDetail = { action: BulkAction };

/** The bar's words, every one renameable through `labels` */
export type BulkActionBarLabels = {
  name: string;
  /** {n} */
  selected: string;
  /** {n} of {total} */
  selectedOf: string;
  selectAll: string;
  clear: string;
  /** {action} and {n} */
  confirm: string;
  confirmYes: string;
  cancel: string;
  /** {action} and {n} */
  done: string;
  undo: string;
  /** {n} seconds left */
  undoLeft: string;
  undone: string;
};
export const defaultBulkActionBarLabels: BulkActionBarLabels = {
  name: "Actions for what's selected",
  selected: "{n} selected",
  selectedOf: "{n} of {total} selected",
  selectAll: "Select all",
  clear: "Clear",
  confirm: "{action} {n} selected?",
  confirmYes: "Yes, {action}",
  cancel: "Cancel",
  done: "{action}: {n} done.",
  undo: "Undo",
  undoLeft: "{n}s",
  undone: "Undone: {action}.",
};

/**
 * What can be done to everything selected: actions, Select all, Clear and Undo.
 * @tag tc-bulk-action-bar
 * @fires tc-action - An action was chosen and confirmed ({ action, count }: BulkActionDetail); cancelable – prevented, no Undo is offered
 * @fires tc-select-all - Select all was pressed (detail: null)
 * @fires tc-clear - Clear was pressed (detail: null)
 * @fires tc-undo - Undo was pressed ({ action }: BulkUndoDetail); cancelable – prevented, Undo stays on offer
 */
export class TcBulkActionBar extends TcElement {
  static override ui = "bab";

  /** How many are selected. At zero the bar isn't shown, unless Undo is on offer */
  @property({ type: Number }) accessor count = 0;
  /** How many there are in all; offers Select all while count is below it */
  @property({ type: Number }) accessor total: number | undefined = undefined;
  /** What can be done to them */
  @property({ attribute: false }) accessor actions: BulkAction[] = [];
  /** How long Undo stays, in seconds */
  @property({ type: Number, attribute: "undo-seconds" }) accessor undoSeconds = 8;
  /** Stay at the bottom of the scrolling area */
  @property({ type: Boolean, reflect: true }) accessor sticky = false;
  /** Rename any of the words */
  @property({ attribute: false }) accessor labels: Partial<BulkActionBarLabels> = {};

  @state() private accessor confirming: BulkAction | null = null;
  @state() private accessor undoing: { action: BulkAction; count: number; left: number } | null = null;
  @state() private accessor active = "";
  @state() private accessor announce = "";
  private readonly screen = new OnScreenController(this);
  private timer = 0;

  private get words(): BulkActionBarLabels {
    return { ...defaultBulkActionBarLabels, ...this.labels };
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.stopTimer();
  }

  override connectedCallback() {
    super.connectedCallback();
    if (this.undoing) this.startTimer();
  }

  private stopTimer() {
    window.clearInterval(this.timer);
    this.timer = 0;
  }

  private startTimer() {
    this.stopTimer();
    this.timer = window.setInterval(() => this.tick(), 1000);
  }

  private tick() {
    // Off screen or in a hidden tab, the time doesn't run out unseen
    if (!this.undoing || !this.screen.onScreen) return;
    const left = this.undoing.left - 1;
    if (left <= 0) {
      this.stopTimer();
      this.undoing = null;
    } else this.undoing = { ...this.undoing, left };
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("count")) {
      const before = changed.get("count") as number | undefined;
      if (this.count !== before) {
        const w = this.words;
        this.announce = this.count > 0 ? this.countText(w) : "";
      }
      if (this.count === 0) this.confirming = null;
    }
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    this.toggleAttribute("data-empty", this.count <= 0 && !this.undoing);
  }

  private countText(w: BulkActionBarLabels) {
    const n = String(this.count);
    return this.total !== undefined ? w.selectedOf.replace("{n}", n).replace("{total}", String(this.total)) : w.selected.replace("{n}", n);
  }

  private choose(action: BulkAction) {
    if (action.confirm) {
      this.confirming = action;
      this.focusAfter(".ui-bab__cancel");
      return;
    }
    this.run(action);
  }

  private run(action: BulkAction) {
    const count = this.count;
    this.confirming = null;
    const allowed = this.emit<BulkActionDetail>("tc-action", { action, count }, { cancelable: true });
    if (!allowed) {
      this.focusAfter(`[data-item="${CSS.escape(action.id)}"]`);
      return;
    }
    const w = this.words;
    this.announce = w.done.replace("{action}", action.label).replace("{n}", String(count));
    if (action.undoable === false || this.undoSeconds <= 0) {
      this.undoing = null;
      this.stopTimer();
      this.focusAfter(`[data-item="${CSS.escape(action.id)}"]`);
      return;
    }
    this.undoing = { action, count, left: this.undoSeconds };
    this.startTimer();
    this.focusAfter(".ui-bab__undo");
  }

  private undo() {
    if (!this.undoing) return;
    const { action } = this.undoing;
    if (!this.emit<BulkUndoDetail>("tc-undo", { action }, { cancelable: true })) return;
    this.stopTimer();
    this.undoing = null;
    this.announce = this.words.undone.replace("{action}", action.label);
    this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-bab__item")?.focus());
  }

  private focusAfter(selector: string) {
    this.updateComplete.then(() => this.querySelector<HTMLElement>(selector)?.focus());
  }

  private cancelConfirm() {
    const id = this.confirming?.id;
    this.confirming = null;
    if (id) this.focusAfter(`[data-item="${CSS.escape(id)}"]`);
  }

  private onKey(e: KeyboardEvent) {
    if (e.key === "Escape" && this.confirming) {
      e.preventDefault();
      this.cancelConfirm();
      return;
    }
    const items = [...this.querySelectorAll<HTMLElement>(".ui-bab__item:not(:disabled)")];
    const at = items.indexOf(document.activeElement as HTMLElement);
    if (at < 0) return;
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (at + 1) % items.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (at - 1 + items.length) % items.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    if (next < 0) return;
    e.preventDefault();
    items[next]!.focus();
  }

  private item(id: string, label: string, onClick: () => void, cls = "", danger = false) {
    return html`<button type="button" class="ui-bab__item ${cls}" data-item=${id} ?data-danger=${danger} tabindex=${this.tabStop === id ? 0 : -1} @focus=${() => (this.active = id)} @click=${onClick}>${label}</button>`;
  }

  /** One button takes Tab: the last one focused while it's still on show, or else the first */
  private get tabStop() {
    const ids = this.confirming
      ? ["__cancel", "__yes"]
      : this.undoing
        ? ["__undo"]
        : [...this.actions.map((a) => a.id), ...(this.total !== undefined && this.count < this.total ? ["__all"] : []), "__clear"];
    return ids.includes(this.active) ? this.active : ids[0];
  }

  private renderUndo() {
    const w = this.words;
    const u = this.undoing!;
    return html`<span class="ui-bab__done">${w.done.replace("{action}", u.action.label).replace("{n}", String(u.count))}</span>
      ${this.item("__undo", w.undo, () => this.undo(), "ui-bab__undo")}
      <span class="ui-bab__left" aria-hidden="true">${w.undoLeft.replace("{n}", String(u.left))}</span>`;
  }

  private renderConfirm() {
    const w = this.words;
    const a = this.confirming!;
    return html`<span class="ui-bab__question">${w.confirm.replace("{action}", a.label).replace("{n}", String(this.count))}</span>
      <div class="ui-bab__group">
        ${this.item("__cancel", w.cancel, () => this.cancelConfirm(), "ui-bab__cancel")}
        ${this.item("__yes", w.confirmYes.replace("{action}", a.label), () => this.run(a), "ui-bab__yes", !!a.danger)}
      </div>`;
  }

  private renderMain() {
    const w = this.words;
    const canAll = this.total !== undefined && this.count < this.total;
    return html`<span class="ui-bab__count">${this.countText(w)}</span>
      <div class="ui-bab__group">
        ${this.actions.map((a) => this.item(a.id, a.label, () => this.choose(a), "ui-bab__action", !!a.danger))}
      </div>
      <div class="ui-bab__group ui-bab__quiet">
        ${canAll ? this.item("__all", w.selectAll, () => this.emit("tc-select-all", null), "ui-bab__all") : nothing}
        ${this.item("__clear", w.clear, () => this.emit("tc-clear", null), "ui-bab__clear")}
      </div>`;
  }

  protected override render() {
    const w = this.words;
    const show = this.count > 0 || !!this.undoing;
    return html`${show
        ? html`<div class="ui-bab__bar" role="toolbar" aria-label=${w.name} @keydown=${this.onKey}>
            ${this.confirming ? this.renderConfirm() : this.undoing ? this.renderUndo() : this.renderMain()}
          </div>`
        : nothing}
      <span class="tc-sr-only" role="status">${this.announce}</span>`;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="bab"],
:where([data-look="clean"], [data-look="clean"] *)[data-ui="bab"] {
  display: block; box-sizing: border-box; width: 100%; container-type: inline-size;
  font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
[data-ui="bab"] *, [data-ui="bab"] *::before, [data-ui="bab"] *::after { box-sizing: border-box; }
[data-ui="bab"][sticky] { position: sticky; bottom: var(--tc-space-2); z-index: 1; }
.ui-bab__bar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2) var(--tc-space-3); padding: var(--tc-space-2) var(--tc-space-3); border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="bab"] .ui-bab__bar { background: var(--tc-surface-on-tray); }
.ui-bab__count, .ui-bab__question, .ui-bab__done { font-weight: var(--tc-font-weight-medium); font-variant-numeric: tabular-nums; }
.ui-bab__group { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1); }
.ui-bab__quiet { margin-inline-start: auto; }
.ui-bab__item { height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border: 0; border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); font: inherit; font-weight: var(--tc-control-font-weight); cursor: pointer; }
.ui-bab__item:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-bab__item:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-bab__item[data-danger] { color: var(--tc-status-danger-fg); }
.ui-bab__quiet .ui-bab__item { background: none; box-shadow: none; color: var(--tc-text-secondary); }
.ui-bab__quiet .ui-bab__item:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-bab__left { color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
@media (forced-colors: active) {
  .ui-bab__bar { border: 1px solid CanvasText; }
}
`;
}

if (!customElements.get("tc-bulk-action-bar")) customElements.define("tc-bulk-action-bar", TcBulkActionBar);

declare global {
  interface HTMLElementTagNameMap {
    "tc-bulk-action-bar": TcBulkActionBar;
  }
}
