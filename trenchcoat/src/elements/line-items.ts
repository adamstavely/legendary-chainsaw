import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController } from "./internal/controllers";

/*
 * <tc-line-items> – rows a model reads off a document, for a person to fix, total and confirm: an invoice, a receipt,
 * an expense claim. Rows arrive as they stream (`streaming`, the grid aria-busy and a quiet "Reading…" in the header);
 * a row read with low confidence carries a "Low confidence" tag, and the cells the model wasn't sure of say "Check"
 * until someone edits them. Every cell edits in place – description, quantity, unit price and amount – with numbers
 * parsed the way the locale writes them ("1.234,50" in German). The subtotal, tax and total recompute as you type,
 * in the document's currency, and when the document states its own total (`statedTotal`) a mismatch is called out in
 * words with the difference. Rows can be added and removed; Confirm hands the rows and totals back.
 * Standard: the header on a gray tray above a white card, the totals and Confirm on the tray below. Clean: one white
 * card, the header its first row and the totals its last. Narrow, the rows become stacked cards, each cell labelled.
 *
 *   <tc-line-items heading="Expense claim" currency="EUR" tax-rate="0.19" .items=${items} .statedTotal=${1240}></tc-line-items>
 *
 * The amount is the row's own `amount` when given, else quantity × unit price; editing the quantity or unit price
 * drops a given amount so it recomputes. Every change fires a cancelable tc-items-change ({ items, item, action }) –
 * preventDefault() and pass the items back to own them. Confirm fires a cancelable tc-confirm ({ items, subtotal, tax,
 * total }).
 *
 * Keyboard (the WAI-ARIA grid pattern, one tab stop): arrows move cell by cell, Home / End to a row's first and last
 * cell, Ctrl+Home / Ctrl+End to the first and last row. Enter or F2 edits a cell – Enter saves, Escape cancels;
 * typing a character starts editing with it. Delete on a row removes it.
 */

/* Icons: Lucide (ISC, lucide.dev) – receipt, plus, x, triangle-alert, check */
const receiptIcon = svg`<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"></path><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path><path d="M12 17.5v-11"></path>`;
const icons = {
  plus: svg`<path d="M5 12h14"></path><path d="M12 5v14"></path>`,
  remove: svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`,
  warn: svg`<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path>`,
  check: svg`<path d="M20 6 9 17l-5-5"></path>`,
};
const glyph = (body: TemplateResult) =>
  html`<svg class="ui-lni__glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

/** A cell a person can edit */
export type LineItemField = "description" | "quantity" | "unitPrice" | "amount";

export type LineItem = {
  id: string;
  /** What was bought – "Conference registration" */
  description: string;
  /** How many; 1 when left out */
  quantity?: number;
  /** The price of one, in the document's currency */
  unitPrice?: number;
  /** The row's amount when the document states it; else quantity × unit price */
  amount?: number;
  /** A quiet line under the description – "Travel", "Lodging" */
  category?: string;
  /** How sure the model was of the row, 0 to 1; below the threshold the row says "Low confidence" */
  confidence?: number;
  /** The cells the model wasn't sure of; each says "Check" until someone edits it */
  uncertain?: LineItemField[];
  /** A warning about the row, in words – "No receipt attached" */
  flag?: string;
};

export type LineItemsAction = "edit" | "add" | "remove";
/** Detail of tc-items-change: the whole list with the change, the row changed and what was done */
export type LineItemsChange = { items: LineItem[]; item: LineItem; action: LineItemsAction };
/** Detail of tc-confirm */
export type LineItemsConfirm = { items: LineItem[]; subtotal: number; tax: number; total: number };
/** The totals worked out from the rows */
export type LineItemTotals = { subtotal: number; tax: number; total: number };

/** The row's amount: its own when given, else quantity × unit price */
export function lineAmount(item: LineItem): number {
  if (item.amount !== undefined && Number.isFinite(item.amount)) return item.amount;
  return (item.quantity ?? 1) * (item.unitPrice ?? 0);
}

const cents = (n: number) => Math.round(n * 100) / 100;

/** Subtotal, tax at `taxRate` (0.08 for 8 %) and total, rounded to cents */
export function lineTotals(items: readonly LineItem[], taxRate = 0): LineItemTotals {
  const subtotal = cents(items.reduce((n, i) => n + lineAmount(i), 0));
  const tax = cents(subtotal * (taxRate > 0 ? taxRate : 0));
  return { subtotal, tax, total: cents(subtotal + tax) };
}

/** A number as the locale writes it – "1.234,50" in de-DE, "1,234.50" in en-US – or NaN. Currency signs and spaces are ignored */
export function parseLocaleNumber(text: string, locale?: string): number {
  let group = ",";
  let decimal = ".";
  try {
    for (const part of new Intl.NumberFormat(locale).formatToParts(12345.6)) {
      if (part.type === "group") group = part.value;
      if (part.type === "decimal") decimal = part.value;
    }
  } catch {
    /* an unknown locale: the defaults */
  }
  const raw = text.trim();
  const negative = /^\(.*\)$/.test(raw) || /[-\u2212]\s*[\d.,]/.test(raw);
  let s = raw.replace(/[^\d.,]/g, "");
  if (!s) return NaN;
  // Group separators go (a space one is already gone), then the decimal becomes a dot
  if (group !== decimal && (group === "." || group === ",")) s = s.split(group).join("");
  if (decimal !== ".") s = s.split(decimal).join(".");
  if ((s.match(/\./g) ?? []).length > 1) return NaN;
  const n = Number(s);
  return Number.isFinite(n) ? (negative ? -n : n) : NaN;
}

const COLS: LineItemField[] = ["description", "quantity", "unitPrice", "amount"];
/** The remove button's column */
const REMOVE = 4;
const NAMES: Record<LineItemField, string> = { description: "Description", quantity: "Qty", unitPrice: "Unit price", amount: "Amount" };

let instances = 0;
let added = 0;

/**
 * Rows a model reads off a document, for a person to fix, total and confirm.
 * @tag tc-line-items
 * @fires tc-items-change - A row was edited, added or removed ({ items, item, action }: LineItemsChange); cancelable – prevented, the rows stay as they were
 * @fires tc-confirm - Confirm was pressed ({ items, subtotal, tax, total }: LineItemsConfirm); cancelable – prevented, nothing is announced
 */
export class TcLineItems extends TcElement {
  static override ui = "lni";

  /** The heading */
  @property() accessor heading = "Line items";
  /** The document the rows came from – shown under the heading */
  @property() accessor source: string | undefined = undefined;
  /** The rows */
  @property({ attribute: false }) accessor items: LineItem[] = [];
  /** Rows are still arriving: the grid is busy and Confirm waits */
  @property({ type: Boolean, reflect: true }) accessor streaming = false;
  /** The ISO 4217 currency of the amounts */
  @property() accessor currency = "USD";
  /** The locale for numbers and amounts, and for reading what's typed */
  @property() accessor locale: string | undefined = undefined;
  /** Tax as a fraction of the subtotal – 0.08 for 8 %; 0 hides the tax row */
  @property({ type: Number, attribute: "tax-rate" }) accessor taxRate = 0;
  /** The total the document itself states; a different total is called out */
  @property({ type: Number, attribute: "stated-total" }) accessor statedTotal: number | undefined = undefined;
  /** Confidence below this (0–1) marks a row "Low confidence" */
  @property({ type: Number }) accessor threshold = 0.8;
  /** The label of the button that hands the rows back */
  @property({ attribute: "confirm-label" }) accessor confirmLabel = "Confirm";

  /** @internal The cell holding the grid's tab stop */
  @state() accessor pos = { row: 0, col: 0 };
  /** @internal The cell being edited */
  @state() accessor editing: { id: string; field: LineItemField } | null = null;
  /** @internal What's typed in it */
  @state() accessor draft = "";
  /** @internal Set when the draft isn't a number */
  @state() accessor invalid = false;
  /** @internal What the status region says */
  @state() accessor said = "";

  private readonly uid = `tc-lni${++instances}`;
  private focusNext: { row: number; col: number } | "input" | null = null;
  private wasStreaming = false;

  constructor() {
    super();
    // A row that goes away: focus moves to the row now in its place, else Add row
    new FocusRescueController(this, () => this.cellAt(Math.min(this.pos.row, this.items.length - 1), 0) ?? this.querySelector<HTMLElement>(".ui-lni__add"));
  }

  private money(n: number) {
    try {
      return new Intl.NumberFormat(this.locale, { style: "currency", currency: this.currency }).format(n);
    } catch {
      return new Intl.NumberFormat(this.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
    }
  }
  private qty(n: number) {
    return new Intl.NumberFormat(this.locale, { maximumFractionDigits: 3 }).format(n);
  }
  private isLow(item: LineItem) {
    return item.confidence !== undefined && item.confidence < this.threshold;
  }
  private cellAt(row: number, col: number) {
    return row < 0 ? null : this.querySelector<HTMLElement>(`[data-row="${row}"][data-col="${col}"]`);
  }

  /* ---------- Lifecycle ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    const n = this.items.length;
    this.pos = { row: Math.max(0, Math.min(this.pos.row, n - 1)), col: Math.max(0, Math.min(this.pos.col, REMOVE)) };
    if (this.editing && !this.items.some((i) => i.id === this.editing!.id)) this.editing = null;
    if (changed.has("streaming")) {
      if (this.wasStreaming && !this.streaming) this.said = n === 1 ? "1 line item read" : `${n} line items read`;
      this.wasStreaming = this.streaming;
    }
  }

  protected override updated() {
    if (!this.focusNext) return;
    const next = this.focusNext;
    this.focusNext = null;
    if (next === "input") {
      const input = this.querySelector<HTMLInputElement>(`#${this.uid}-edit`);
      input?.focus();
      input?.select();
    } else this.cellAt(next.row, next.col)?.focus();
  }

  /* ---------- Changes ---------- */

  private change(items: LineItem[], item: LineItem, action: LineItemsAction) {
    if (this.emit<LineItemsChange>("tc-items-change", { items, item, action }, { cancelable: true })) this.items = items;
  }

  private startEdit(row: number, field: LineItemField, initial?: string) {
    const item = this.items[row];
    if (!item) return;
    this.pos = { row, col: COLS.indexOf(field) };
    this.editing = { id: item.id, field };
    this.invalid = false;
    if (initial !== undefined) this.draft = initial;
    else if (field === "description") this.draft = item.description;
    else {
      const v = field === "amount" ? lineAmount(item) : field === "quantity" ? (item.quantity ?? 1) : (item.unitPrice ?? 0);
      this.draft = new Intl.NumberFormat(this.locale, { useGrouping: false, maximumFractionDigits: 3 }).format(v);
    }
    this.focusNext = "input";
  }

  /** Saves or drops the edit; false when the draft isn't a number and the field stays open */
  private endEdit(save: boolean, refocus = true): boolean {
    const editing = this.editing;
    if (!editing) return true;
    const row = this.items.findIndex((i) => i.id === editing.id);
    const item = this.items[row];
    const col = COLS.indexOf(editing.field);
    if (save && item) {
      let next: LineItem | null = null;
      const uncertain = item.uncertain?.filter((f) => f !== editing.field);
      if (editing.field === "description") {
        const text = this.draft.trim();
        if (text && text !== item.description) next = { ...item, description: text, uncertain };
      } else {
        const n = parseLocaleNumber(this.draft, this.locale);
        if (Number.isNaN(n)) {
          if (!refocus) {
            this.editing = null;
            return true;
          }
          this.invalid = true;
          this.said = "Enter a number";
          return false;
        }
        const before = editing.field === "amount" ? lineAmount(item) : editing.field === "quantity" ? (item.quantity ?? 1) : (item.unitPrice ?? 0);
        if (n !== before) {
          next = editing.field === "amount" ? { ...item, amount: n, uncertain } : { ...item, [editing.field]: n, amount: undefined, uncertain };
          if (next.amount === undefined) delete next.amount;
        }
      }
      if (next) {
        if (next.uncertain && !next.uncertain.length) delete next.uncertain;
        this.said = `${NAMES[editing.field]} of ${next.description} changed`;
        this.change(
          this.items.map((i, j) => (j === row ? next : i)),
          next,
          "edit",
        );
      }
    }
    this.editing = null;
    this.invalid = false;
    if (refocus && row >= 0) this.focusNext = { row, col };
    return true;
  }

  private onEditKey = (e: KeyboardEvent) => {
    if (e.isComposing) return;
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      this.endEdit(true);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      this.endEdit(false);
    }
  };

  private addRow() {
    const item: LineItem = { id: `${this.uid}-new-${++added}`, description: "New item", quantity: 1, unitPrice: 0 };
    const items = [...this.items, item];
    if (!this.emit<LineItemsChange>("tc-items-change", { items, item, action: "add" }, { cancelable: true })) return;
    this.items = items;
    this.said = "Row added";
    this.startEdit(items.length - 1, "description", "");
  }

  private removeRow(row: number) {
    const item = this.items[row];
    if (!item) return;
    if (this.editing?.id === item.id) this.editing = null;
    this.change(
      this.items.filter((_, j) => j !== row),
      item,
      "remove",
    );
    if (this.items.some((i) => i.id === item.id)) return;
    this.said = `Removed ${item.description}`;
    const n = this.items.length;
    if (n) {
      this.pos = { row: Math.min(row, n - 1), col: this.pos.col };
      this.focusNext = { ...this.pos };
    } else void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-lni__add")?.focus());
  }

  private confirm() {
    if (this.streaming) {
      this.said = "Still reading line items";
      return;
    }
    if (!this.items.length) {
      this.said = "No line items to confirm";
      return;
    }
    if (this.editing && !this.endEdit(true)) return;
    const totals = lineTotals(this.items, this.taxRate);
    if (this.emit<LineItemsConfirm>("tc-confirm", { items: this.items, ...totals }, { cancelable: true }))
      this.said = `Confirmed ${this.items.length === 1 ? "1 line item" : `${this.items.length} line items`}, total ${this.money(totals.total)}`;
  }

  /* ---------- Keyboard: the grid ---------- */

  private onGridFocusIn = (e: FocusEvent) => {
    const cell = (e.target as HTMLElement).closest<HTMLElement>("[data-row][data-col]");
    if (!cell) return;
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    if (row !== this.pos.row || col !== this.pos.col) this.pos = { row, col };
  };

  private onGridKey = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target instanceof HTMLInputElement || e.defaultPrevented || e.isComposing) return;
    const cell = target.closest<HTMLElement>("[data-row][data-col]");
    if (!cell) return;
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    const last = this.items.length - 1;
    const ctrl = e.ctrlKey || e.metaKey;
    const moves: Record<string, [number, number]> = {
      ArrowUp: [row - 1, col],
      ArrowDown: [row + 1, col],
      ArrowLeft: [row, col - 1],
      ArrowRight: [row, col + 1],
      Home: ctrl ? [0, col] : [row, 0],
      End: ctrl ? [last, col] : [row, REMOVE],
    };
    const move = moves[e.key];
    if (move) {
      e.preventDefault();
      const r = Math.max(0, Math.min(last, move[0]));
      const c = Math.max(0, Math.min(REMOVE, move[1]));
      this.pos = { row: r, col: c };
      this.focusNext = { row: r, col: c };
      return;
    }
    if (e.key === "Delete" || (e.key === "Backspace" && col === REMOVE)) {
      e.preventDefault();
      this.removeRow(row);
      return;
    }
    if (col === REMOVE || e.altKey || ctrl) return;
    if (e.key === "Enter" || e.key === "F2") {
      e.preventDefault();
      this.startEdit(row, COLS[col]);
    } else if (e.key.length === 1 && e.key !== " ") {
      // Typing starts editing with the character, like a spreadsheet
      e.preventDefault();
      this.startEdit(row, COLS[col], e.key);
    }
  };

  /* ---------- Render ---------- */

  private renderCell(item: LineItem, row: number, field: LineItemField): TemplateResult {
    const col = COLS.indexOf(field);
    const on = this.pos.row === row && this.pos.col === col;
    const editing = this.editing?.id === item.id && this.editing.field === field;
    const check = item.uncertain?.includes(field);
    const value =
      field === "description" ? item.description : field === "quantity" ? this.qty(item.quantity ?? 1) : this.money(field === "amount" ? lineAmount(item) : (item.unitPrice ?? 0));
    const content = editing
      ? html`<input
            id=${`${this.uid}-edit`}
            class="ui-lni__input"
            inputmode=${field === "description" ? "text" : "decimal"}
            .value=${live(this.draft)}
            aria-label=${`${NAMES[field]}, ${item.description}`}
            aria-invalid=${this.invalid ? "true" : "false"}
            aria-describedby=${`${this.uid}-edit-help`}
            @input=${(e: Event) => {
              this.draft = (e.target as HTMLInputElement).value;
              this.invalid = false;
            }}
            @keydown=${this.onEditKey}
            @blur=${() => this.editing?.id === item.id && this.editing.field === field && this.endEdit(true, false)}
          /><span class="ui-lni__sr" id=${`${this.uid}-edit-help`}>${this.invalid ? "Enter a number. " : ""}Enter saves, Escape cancels</span>`
      : html`<span class="ui-lni__value">${value || html`<span class="ui-lni__empty">Empty</span>`}</span>${check
            ? html`<span class="ui-lni__check">${glyph(icons.warn)}Check</span>`
            : nothing}${field === "description" && item.category ? html`<span class="ui-lni__cat">${item.category}</span>` : nothing}${field ===
            "description" && this.isLow(item)
            ? html`<span class="ui-lni__low">Low confidence</span>`
            : nothing}`;
    return html`<div
      role="gridcell"
      class="ui-lni__cell"
      data-field=${field}
      data-row=${row}
      data-col=${col}
      tabindex=${on && !editing ? 0 : -1}
      ?data-check=${check}
      ?data-editing=${editing}
      ?data-invalid=${editing && this.invalid}
      aria-describedby=${ifDefined(editing ? undefined : `${this.uid}-keys`)}
      @dblclick=${() => !editing && this.startEdit(row, field)}
    ><span class="ui-lni__label" aria-hidden="true">${NAMES[field]}</span>${content}</div>`;
  }

  private renderRow(item: LineItem, row: number) {
    const on = this.pos.row === row && this.pos.col === REMOVE;
    return html`<div class="ui-lni__row" role="row" data-id=${item.id} ?data-low=${this.isLow(item)} ?data-active=${this.pos.row === row}>
      ${COLS.map((f) => this.renderCell(item, row, f))}
      <div role="gridcell" class="ui-lni__remove-cell">
        <button type="button" class="ui-lni__remove" data-row=${row} data-col=${REMOVE} tabindex=${on ? 0 : -1} aria-label=${`Remove ${item.description}`} title=${`Remove ${item.description}`} aria-keyshortcuts="Delete" @click=${() => this.removeRow(row)}>
          ${glyph(icons.remove)}
        </button>
      </div>
      ${item.flag ? html`<div class="ui-lni__flag" role="gridcell" aria-colspan="5">${glyph(icons.warn)}<span>${item.flag}</span></div>` : nothing}
    </div>`;
  }

  private renderGrid() {
    if (!this.items.length && !this.streaming) return html`<p class="ui-lni__none">No line items yet</p>`;
    return html`<div
      class="ui-lni__grid"
      role="grid"
      aria-labelledby=${`${this.uid}-title`}
      aria-rowcount=${this.items.length + 1}
      aria-busy=${this.streaming ? "true" : "false"}
      @keydown=${this.onGridKey}
      @focusin=${this.onGridFocusIn}
    >
      <div class="ui-lni__row ui-lni__headrow" role="row">
        ${COLS.map((f) => html`<div role="columnheader" class="ui-lni__colhead" data-field=${f}>${NAMES[f]}</div>`)}
        <div role="columnheader" class="ui-lni__colhead" data-field="remove"><span class="ui-lni__sr">Remove</span></div>
      </div>
      ${repeat(
        this.items,
        (i) => i.id,
        (i, row) => this.renderRow(i, row),
      )}
      ${this.streaming ? html`<div class="ui-lni__reading" aria-hidden="true"><span></span><span></span><span></span></div>` : nothing}
    </div>`;
  }

  private renderFoot() {
    const totals = lineTotals(this.items, this.taxRate);
    const stated = this.statedTotal;
    const off = stated !== undefined && Number.isFinite(stated) && !this.streaming && Math.abs(stated - totals.total) >= 0.005;
    const pct = new Intl.NumberFormat(this.locale, { style: "percent", maximumFractionDigits: 2 }).format(this.taxRate);
    const reason = this.streaming ? "Still reading line items" : !this.items.length ? "No line items to confirm" : "";
    return html`<div class="ui-lni__foot">
      <dl class="ui-lni__totals">
        ${this.taxRate > 0
          ? html`<div class="ui-lni__sum"><dt>Subtotal</dt><dd>${this.money(totals.subtotal)}</dd></div>
              <div class="ui-lni__sum"><dt>Tax ${pct}</dt><dd>${this.money(totals.tax)}</dd></div>`
          : nothing}
        <div class="ui-lni__sum ui-lni__total"><dt>Total</dt><dd>${this.money(totals.total)}</dd></div>
      </dl>
      ${stated !== undefined && Number.isFinite(stated) && !this.streaming
        ? off
          ? html`<p class="ui-lni__match" data-match="no">
              ${glyph(icons.warn)}<span>Doesn't match the document's total of ${this.money(stated)} – off by ${this.money(Math.abs(stated - totals.total))}</span>
            </p>`
          : html`<p class="ui-lni__match" data-match="yes">${glyph(icons.check)}<span>Matches the document's total</span></p>`
        : nothing}
      <div class="ui-lni__actions">
        <button type="button" class="ui-lni__add" @click=${this.addRow}>${glyph(icons.plus)}Add row</button>
        <button
          type="button"
          class="ui-lni__confirm"
          aria-disabled=${ifDefined(reason ? "true" : undefined)}
          aria-describedby=${ifDefined(reason ? `${this.uid}-wait` : off ? `${this.uid}-off` : undefined)}
          @click=${this.confirm}
        >${this.confirmLabel}</button>
        ${reason ? html`<span class="ui-lni__sr" id=${`${this.uid}-wait`}>${reason}</span>` : nothing}
        ${off && !reason ? html`<span class="ui-lni__sr" id=${`${this.uid}-off`}>The total doesn't match the document</span>` : nothing}
      </div>
    </div>`;
  }

  protected override render() {
    const clean = this.resolvedLook === "clean";
    const n = this.items.length;
    const aside = this.streaming
      ? html`<span class="ui-lni__count" data-streaming>Reading…</span>`
      : html`<span class="ui-lni__count">${n === 1 ? "1 item" : `${n} items`}</span>`;
    const head = cardHead({ icon: receiptIcon, title: this.heading, subtitle: this.source, id: `${this.uid}-title`, aside });
    const body = this.renderGrid();
    const foot = this.renderFoot();
    return html`${clean ? html`<div class="ui-lni__card">${head}${body}${foot}</div>` : html`${head}<div class="ui-lni__card">${body}</div>${foot}`}
      <span class="ui-lni__sr" id=${`${this.uid}-keys`}>Enter to edit, Delete removes the row, arrows move between cells</span>
      <span class="ui-lni__sr" role="status">${this.said}</span>`;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card; the totals and Confirm sit on the tray below it */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="lni"] {
  box-sizing: border-box;
  container-type: inline-size;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  width: 100%;
  max-width: 760px;
  min-width: 0;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one white card, the totals its last row */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="lni"] {
  box-sizing: border-box;
  container-type: inline-size;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  width: 100%;
  max-width: 740px;
  min-width: 0;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="lni"] *, [data-ui="lni"] *::before, [data-ui="lni"] *::after { box-sizing: border-box; }
:where([data-ui="lni"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="lni"] button:focus-visible, .ui-lni__cell:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-lni__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-lni__glyph { display: block; flex: none; width: 14px; height: 14px; }
:where([data-look="standard"], [data-look="standard"] *).ui-lni__card { min-width: 0; overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-lni__card { min-width: 0; overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-lni__card > .tc-head + * { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-lni__count { font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; color: var(--tc-text-muted); white-space: nowrap; }
.ui-lni__count[data-streaming] { color: var(--tc-status-info-fg); }
/* ----- The grid: columns shared by every row ----- */
.ui-lni__grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(56px, auto) minmax(96px, auto) minmax(104px, auto) auto; padding: var(--tc-space-1-5); }
.ui-lni__row { display: grid; grid-column: 1 / -1; grid-template-columns: subgrid; align-items: start; border-radius: var(--tc-radius-md); animation: ui-lni-in var(--tc-duration-base) var(--tc-ease-move) both; }
.ui-lni__row:not(.ui-lni__headrow):hover { background: var(--tc-fill-subtle); }
.ui-lni__row[data-active]:not(.ui-lni__headrow) { background: var(--tc-fill-subtle); }
.ui-lni__headrow { animation: none; border-bottom: var(--tc-hairline) solid var(--tc-divider); border-radius: 0; }
.ui-lni__colhead { padding: var(--tc-space-1-5) var(--tc-space-2); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-lni__colhead[data-field="quantity"], .ui-lni__colhead[data-field="unitPrice"], .ui-lni__colhead[data-field="amount"] { text-align: right; }
.ui-lni__cell { display: flex; flex-wrap: wrap; align-items: baseline; column-gap: var(--tc-space-1-5); row-gap: var(--tc-space-0-5); min-width: 0; min-height: var(--tc-control-h-sm); padding: var(--tc-space-1-5) var(--tc-space-2); border-radius: var(--tc-radius-md); cursor: default; }
.ui-lni__cell:not([data-field="description"]) { justify-content: flex-end; text-align: right; font-variant-numeric: tabular-nums; }
.ui-lni__value { min-width: 0; overflow-wrap: anywhere; color: var(--tc-text-primary); }
.ui-lni__cell[data-field="amount"] .ui-lni__value { font-weight: var(--tc-font-weight-medium); }
.ui-lni__empty { font-style: italic; color: var(--tc-text-muted); }
.ui-lni__cat { flex-basis: 100%; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
.ui-lni__label { display: none; }
/* What the model wasn't sure of: a word and a mark, in the warning tone */
.ui-lni__cell[data-check] { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-status-warning-fg); }
.ui-lni__check { display: inline-flex; align-items: center; gap: var(--tc-space-0-5); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-status-warning-fg); }
.ui-lni__check .ui-lni__glyph { width: 12px; height: 12px; }
.ui-lni__low { height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-status-warning-bg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-pill-h); color: var(--tc-status-warning-fg); white-space: nowrap; }
.ui-lni__flag { grid-column: 1 / -1; display: flex; align-items: center; gap: var(--tc-space-1); padding: 0 var(--tc-space-2) var(--tc-space-1-5); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-status-warning-fg); }
.ui-lni__input { width: 100%; min-width: 0; height: var(--tc-control-h-sm); margin: 0; padding: 0 var(--tc-space-2); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow-focus); font: inherit; color: var(--tc-text-primary); caret-color: var(--tc-accent); text-align: inherit; outline: none; }
.ui-lni__cell[data-editing] { padding: var(--tc-space-0-5) var(--tc-space-1); }
.ui-lni__cell[data-invalid] .ui-lni__input { box-shadow: var(--tc-field-shadow-invalid); }
.ui-lni__remove-cell { display: grid; padding: var(--tc-space-0-5); }
.ui-lni__remove { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-action-ghost-fg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-lni__remove:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-status-danger-fg); }
.ui-lni__none { margin: 0; padding: var(--tc-space-8) var(--tc-space-4); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); text-align: center; }
/* Streaming: three quiet bars where the next row will land */
.ui-lni__reading { grid-column: 1 / -1; display: grid; gap: var(--tc-space-1-5); padding: var(--tc-space-2); }
.ui-lni__reading > span { position: relative; height: var(--tc-space-2); overflow: hidden; border-radius: var(--tc-radius-xs); background: var(--tc-fill-default); }
.ui-lni__reading > span:nth-child(2) { width: 80%; }
.ui-lni__reading > span:nth-child(3) { width: 60%; }
.ui-lni__reading > span::after { content: ""; position: absolute; inset: 0; background: var(--tc-shimmer); transform: translateX(-100%); animation: ui-lni-shimmer var(--tc-duration-shimmer) linear infinite; }
/* ----- Totals and actions: on the tray (Standard), the card's last row (Clean) ----- */
.ui-lni__foot { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-2) var(--tc-space-1); }
:where([data-look="clean"], [data-look="clean"] *).ui-lni__foot { padding: var(--tc-space-3) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-lni__totals { display: grid; justify-items: end; gap: var(--tc-space-1); margin: 0; }
.ui-lni__sum { display: flex; gap: var(--tc-space-4); justify-content: flex-end; font-variant-numeric: tabular-nums; }
.ui-lni__sum dt { color: var(--tc-text-muted); }
.ui-lni__sum dd { min-width: 104px; margin: 0; text-align: right; color: var(--tc-text-primary); }
.ui-lni__total { font-size: var(--tc-font-size-lg); line-height: var(--tc-line-height-normal); }
.ui-lni__total dt, .ui-lni__total dd { color: var(--tc-text-strong); font-weight: var(--tc-font-weight-strong); }
.ui-lni__match { display: flex; align-items: center; justify-content: flex-end; gap: var(--tc-space-1); margin: 0; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-lni__match[data-match="no"] { color: var(--tc-status-warning-fg); }
.ui-lni__match[data-match="yes"] { color: var(--tc-status-success-fg); }
.ui-lni__actions { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-2); }
.ui-lni__add { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); color: var(--tc-action-ghost-fg); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-lni__add:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-lni__confirm { flex: none; height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-primary-fg); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-lni__confirm:hover { background: var(--tc-action-primary-bg-hover); }
.ui-lni__confirm[aria-disabled="true"] { background: var(--tc-fill-strong); box-shadow: none; color: var(--tc-text-muted); cursor: default; }
@keyframes ui-lni-in { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: none; } }
@keyframes ui-lni-shimmer { to { transform: translateX(100%); } }
/* Narrow: each row is a stacked card, its cells labelled */
@container (max-width: 520px) {
  .ui-lni__grid { grid-template-columns: minmax(0, 1fr); gap: var(--tc-space-1-5); }
  .ui-lni__headrow { display: none; }
  .ui-lni__row { position: relative; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr); padding: var(--tc-space-1) var(--tc-space-8) var(--tc-space-1) var(--tc-space-1); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-subtle); }
  .ui-lni__cell[data-field="description"] { grid-column: 1 / -1; }
  .ui-lni__cell:not([data-field="description"]) { flex-direction: column; align-items: flex-start; text-align: left; }
  .ui-lni__label { display: block; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
  .ui-lni__cell[data-field="description"] .ui-lni__label { display: none; }
  .ui-lni__remove-cell { position: absolute; top: var(--tc-space-1); right: var(--tc-space-1); }
  .ui-lni__sum dd { min-width: 0; }
}
@media (pointer: coarse) {
  .ui-lni__remove { width: 36px; height: 36px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="lni"] *, [data-ui="lni"] *::before, [data-ui="lni"] *::after { animation: none !important; transition: none !important; }
}
@media (forced-colors: active) {
  .ui-lni__cell[data-check] { outline: 1px dashed CanvasText; }
}
`;
}

if (!customElements.get("tc-line-items")) customElements.define("tc-line-items", TcLineItems);

declare global {
  interface HTMLElementTagNameMap {
    "tc-line-items": TcLineItems;
  }
}
