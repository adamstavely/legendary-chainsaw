import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { FocusRescueController } from "./internal/controllers";

/*
 * <tc-extraction-review> – fields extracted from a document, checked by a person before they're used. The page image
 * (the app's, one URL per page) sits on the left with a box around every field's place on it; the fields sit on the
 * right, each with the extracted value, how confident the extraction was, and Accept / Correct / Reject. The active
 * field's box is highlighted and the page view follows it – to its page, scrolled so the box is in view. A
 * correction keeps the extracted value beside the new one ("was 1,204.00"). Clean drops the gray tray: one white card
 * whose last row holds the progress and Confirm.
 *
 *   <tc-extraction-review heading="Invoice INV-2041" .pages=${pages} .fields=${fields}></tc-extraction-review>
 *
 * Boxes are in page pixels: `{ page: 1, x, y, width, height }` against the page's `width` and `height`. Every review
 * fires a cancelable tc-fields-change ({ fields, field, action }) – preventDefault() and pass the fields back to own
 * them. Confirm fires tc-confirm ({ fields }) once every field is reviewed.
 *
 * Keyboard (the WAI-ARIA grid pattern, one row per field): ↑ ↓ move field by field, Home / End to the first and last,
 * ← → between the field and its three buttons. A accepts and R rejects (then on to the next field to review); Enter
 * or F2 corrects – Enter saves and moves on, Escape cancels.
 */

export type ExtractionFieldStatus = "pending" | "accepted" | "corrected" | "rejected";

/** Where a field sits on a page, in that page's pixels */
export type ExtractionBox = {
  /** The page, from 1 */
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

/** One page of the document: an image and its size in pixels (the space the boxes are in) */
export type ExtractionPage = {
  /** The page image's URL – a data: URL works too */
  src: string;
  width: number;
  height: number;
  /** What the page is, for people who can't see it – "Page 1 of invoice.pdf" by default */
  alt?: string;
};

export type ExtractionField = {
  id: string;
  /** The field's name, e.g. "Invoice number" */
  label: string;
  /** The value – the extracted one, or the correction once corrected */
  value: string;
  /** How sure the extraction is, 0 to 1 */
  confidence: number;
  /** Where the value was found; a field without one has nothing to highlight */
  box?: ExtractionBox;
  /** "pending" when left out */
  status?: ExtractionFieldStatus;
  /** The extracted value, kept when a person corrects it */
  original?: string;
};

export type ExtractionAction = "accept" | "correct" | "reject" | "undo";

/** Detail of tc-fields-change: the whole list with the change, the changed field and what was done */
export type ExtractionFieldsChange = { fields: ExtractionField[]; field: ExtractionField; action: ExtractionAction };
/** Detail of tc-confirm */
export type ExtractionConfirm = { fields: ExtractionField[] };

/* ---------- Helpers ---------- */

const statusOf = (f: ExtractionField): ExtractionFieldStatus => f.status ?? "pending";
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const pct = (c: number) => `${Math.round(clamp(c, 0, 1) * 100)}%`;
const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const STATUS_TEXT: Record<ExtractionFieldStatus, string> = { pending: "To review", accepted: "Accepted", corrected: "Corrected", rejected: "Rejected" };
/** The columns of a row: the field, then its three buttons */
const COLS = 4;

/* ---------- Icons: 24px line glyphs – thinner in Clean ---------- */

const glyph = (d: string, className = "") =>
  html`<svg viewBox="0 0 24 24" class=${["ui-xrev__glyph", className].filter(Boolean).join(" ")} aria-hidden="true">${svg`<path d=${d}></path>`}</svg>`;
const icons = {
  accept: "M5.5 12.5l4 4L18.5 8",
  correct: "M4.5 19.5h3.75L18.6 9.15a2.12 2.12 0 0 0-3-3L5.25 16.5v3zM14.25 7.5l2.25 2.25",
  reject: "M7 7l10 10M17 7 7 17",
  prev: "M14.5 6 8.5 12l6 6",
  next: "M9.5 6l6 6-6 6",
  doc: "M7 3.5h6.5L18 8v12.5H7zM13 3.5V8.5h5M9.5 12.5h6M9.5 16h6",
  alert: "M12 8v5M12 16.5h.01M10.3 3.9 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
};

let instances = 0;

/**
 * Fields extracted from a document, each linked to its box on the page: confidence per field, accept, correct or
 * reject, field by field from the keyboard while the page view follows.
 * @tag tc-extraction-review
 * @fires tc-fields-change - A field was accepted, corrected, rejected or set back to review. Cancelable. Detail: ExtractionFieldsChange ({ fields, field, action })
 * @fires tc-confirm - Confirm was pressed with every field reviewed. Detail: ExtractionConfirm ({ fields })
 */
export class TcExtractionReview extends TcElement {
  static override ui = "xrev";

  /** The reviewed fields – the value. Each review replaces the list (tc-fields-change) */
  @property({ attribute: false }) accessor fields: ExtractionField[] = [];
  /** The document's pages, in order: an image URL and its size in pixels per page */
  @property({ attribute: false }) accessor pages: ExtractionPage[] = [];
  /** Names the review */
  @property() accessor heading = "Review extracted fields";
  /** The document the fields came from, e.g. "invoice-2041.pdf" – shown under the heading and in page alt texts */
  @property() accessor source: string | undefined = undefined;
  /** Confidence below this (0–1) marks a field "Low" so people check it first */
  @property({ type: Number }) accessor threshold = 0.8;
  /** The label of the button that hands the reviewed fields back */
  @property({ attribute: "confirm-label" }) accessor confirmLabel = "Confirm";

  /** @internal The row and column holding the grid's tab stop */
  @state() accessor pos = { row: 0, col: 0 };
  /** @internal The page shown, from 0 */
  @state() accessor pageIndex = 0;
  /** @internal The field being corrected */
  @state() accessor editing: string | null = null;
  /** @internal The correction being typed */
  @state() accessor draft = "";
  /** @internal What the status region says */
  @state() accessor said = "";

  private readonly uid = `tc-xrev${++instances}`;
  /** Where focus goes after the next update */
  private focusNext: { row: number; col: number } | "input" | null = null;
  /** The field the page view last followed, so it scrolls only when the active field changes */
  private followed: string | null = null;
  private wasAllDone = false;

  constructor() {
    super();
    // A row that goes away (the app removed a field): focus moves to the field now in its place, else the grid's first
    new FocusRescueController(this, () => this.cellAt(clamp(this.pos.row, 0, Math.max(0, this.fields.length - 1)), 0));
  }

  private get activeField(): ExtractionField | undefined {
    return this.fields[clamp(this.pos.row, 0, this.fields.length - 1)];
  }
  private cellAt(row: number, col: number) {
    return this.querySelector<HTMLElement>(`[data-row="${row}"][data-col="${col}"]`);
  }
  private isLow(f: ExtractionField) {
    return f.confidence < this.threshold;
  }

  /* ---------- Lifecycle ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    const n = this.fields.length;
    this.pos = { row: clamp(this.pos.row, 0, Math.max(0, n - 1)), col: clamp(this.pos.col, 0, COLS - 1) };
    if (this.editing && !this.fields.some((f) => f.id === this.editing)) this.editing = null;
    // The page view follows the active field to its page
    const f = this.activeField;
    if (f?.box && f.id !== this.followed && (changed.has("pos") || changed.has("fields") || !this.hasUpdated)) {
      this.pageIndex = clamp(Math.round(f.box.page) - 1, 0, Math.max(0, this.pages.length - 1));
    }
    this.pageIndex = clamp(this.pageIndex, 0, Math.max(0, this.pages.length - 1));
    // Say once when the last field is reviewed
    const done = n > 0 && this.fields.every((x) => statusOf(x) !== "pending");
    if (done && !this.wasAllDone && this.hasUpdated) this.said = `All ${n} fields reviewed`;
    this.wasAllDone = done;
  }

  protected override updated() {
    if (this.focusNext) {
      const next = this.focusNext;
      this.focusNext = null;
      const target = next === "input" ? this.querySelector<HTMLInputElement>(`#${this.uid}-edit`) : this.cellAt(next.row, next.col);
      target?.focus();
      if (target instanceof HTMLInputElement) target.select();
    }
    this.follow();
  }

  /** Scrolls the page view so the active field's box sits in the middle of it */
  private follow() {
    const f = this.activeField;
    if (!f?.box || f.id === this.followed) return;
    const page = this.pages[f.box.page - 1];
    const view = this.querySelector<HTMLElement>(".ui-xrev__viewport");
    const sheet = view?.querySelector<HTMLElement>(".ui-xrev__sheet");
    if (!page || !view || !sheet || !page.height) return;
    this.followed = f.id;
    const h = sheet.offsetHeight;
    const centre = ((f.box.y + f.box.height / 2) / page.height) * h + sheet.offsetTop;
    const top = clamp(centre - view.clientHeight / 2, 0, Math.max(0, view.scrollHeight - view.clientHeight));
    if (typeof view.scrollTo === "function") view.scrollTo({ top, behavior: reducedMotion() || !this.contains(document.activeElement) ? "auto" : "smooth" });
    else view.scrollTop = top;
  }

  /* ---------- Reviewing ---------- */

  private change(i: number, next: ExtractionField, action: ExtractionAction) {
    const fields = this.fields.map((f, j) => (j === i ? next : f));
    if (this.emit<ExtractionFieldsChange>("tc-fields-change", { fields, field: next, action }, { cancelable: true })) this.fields = fields;
  }

  /** The next field still to review after row i, else the next row, else i */
  private nextRow(i: number) {
    const n = this.fields.length;
    for (let k = 1; k < n; k++) {
      const j = (i + k) % n;
      if (statusOf(this.fields[j]) === "pending" && j !== i) return j;
    }
    return Math.min(i + 1, n - 1);
  }

  private advance(i: number) {
    const row = this.nextRow(i);
    this.pos = { row, col: 0 };
    this.focusNext = { row, col: 0 };
  }

  /** A or R on a field: sets that status and moves on; the buttons toggle it (pressed again: back to review) */
  private mark(i: number, status: "accepted" | "rejected", viaKey = false) {
    const f = this.fields[i];
    if (!f) return;
    if (statusOf(f) === status) {
      if (viaKey) this.advance(i);
      else this.undo(i);
      return;
    }
    const action = status === "accepted" ? "accept" : "reject";
    this.said = `${f.label} ${status}`;
    this.change(i, { ...f, status }, action);
    if (viaKey) this.advance(i);
  }

  private accept(i: number, viaKey = false) {
    this.mark(i, "accepted", viaKey);
  }

  private reject(i: number, viaKey = false) {
    this.mark(i, "rejected", viaKey);
  }

  private undo(i: number) {
    const f = this.fields[i];
    if (!f) return;
    this.said = `${f.label} back to review`;
    // A correction set back keeps the corrected value; the extracted one stays in `original`
    this.change(i, { ...f, status: "pending" }, "undo");
  }

  private startEdit(i: number) {
    const f = this.fields[i];
    if (!f) return;
    this.pos = { row: i, col: 0 };
    this.editing = f.id;
    this.draft = f.value;
    this.focusNext = "input";
  }

  private endEdit(save: boolean, refocus = true) {
    const id = this.editing;
    if (!id) return;
    const i = this.fields.findIndex((f) => f.id === id);
    this.editing = null;
    if (refocus && !save) this.focusNext = { row: i, col: 0 };
    if (!save || i < 0) return;
    const f = this.fields[i];
    const text = this.draft.trim();
    if (!text || text === f.value) {
      // Nothing changed: a field still to review is accepted as it stands; a reviewed one stays as it was
      if (text && statusOf(f) === "pending") this.mark(i, "accepted", refocus);
      else if (refocus) this.focusNext = { row: i, col: 0 };
      return;
    }
    this.said = `${f.label} corrected to ${text}`;
    this.change(i, { ...f, value: text, status: "corrected", original: f.original ?? f.value }, "correct");
    if (refocus) this.advance(i);
  }

  private onEditKey(e: KeyboardEvent) {
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
  }

  private confirm() {
    const left = this.fields.filter((f) => statusOf(f) === "pending").length;
    if (left || !this.fields.length) {
      this.said = left === 1 ? "1 field still to review" : `${left} fields still to review`;
      return;
    }
    this.emit<ExtractionConfirm>("tc-confirm", { fields: this.fields });
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
    const last = this.fields.length - 1;
    const mod = e.ctrlKey || e.metaKey;
    let to: { row: number; col: number } | null = null;
    switch (e.key) {
      case "ArrowDown":
        to = { row: Math.min(last, row + 1), col };
        break;
      case "ArrowUp":
        to = { row: Math.max(0, row - 1), col };
        break;
      case "ArrowRight":
        to = { row, col: Math.min(COLS - 1, col + 1) };
        break;
      case "ArrowLeft":
        to = { row, col: Math.max(0, col - 1) };
        break;
      case "Home":
        to = mod ? { row: 0, col } : { row, col: 0 };
        if (!mod && col === 0) to = { row: 0, col: 0 };
        break;
      case "End":
        to = mod ? { row: last, col } : { row, col: COLS - 1 };
        if (!mod && col === COLS - 1) to = { row: last, col };
        break;
      case "PageDown":
        to = { row: Math.min(last, row + 5), col };
        break;
      case "PageUp":
        to = { row: Math.max(0, row - 5), col };
        break;
    }
    if (to) {
      e.preventDefault();
      this.pos = to;
      this.cellAt(to.row, to.col)?.focus();
      return;
    }
    if ((e.key === "Enter" && col === 0) || e.key === "F2") {
      e.preventDefault();
      this.startEdit(row);
      return;
    }
    if (e.altKey || mod || e.shiftKey) return;
    const k = e.key.toLowerCase();
    if (k === "a" || k === "r") {
      e.preventDefault();
      if (k === "a") this.accept(row, true);
      else this.reject(row, true);
    }
  };

  /* ---------- Page view ---------- */

  private showPage(i: number) {
    this.pageIndex = clamp(i, 0, this.pages.length - 1);
  }

  private onBoxClick(i: number) {
    this.pos = { row: i, col: 0 };
    this.focusNext = { row: i, col: 0 };
  }

  private renderPage(): TemplateResult {
    const pages = this.pages;
    const i = this.pageIndex;
    const page = pages[i];
    const active = this.activeField;
    const name = this.source ?? "the document";
    const nav = html`<div class="ui-xrev__pagebar">
      <span class="ui-xrev__pageno" id=${`${this.uid}-pageno`} aria-live="polite">${pages.length ? `Page ${i + 1} of ${pages.length}` : "No pages"}</span>
      ${pages.length > 1
        ? html`<span class="ui-xrev__pagebtns">
            <button type="button" class="ui-xrev__icon-btn" aria-label="Previous page" aria-disabled=${ifDefined(i === 0 ? "true" : undefined)} @click=${() => i > 0 && this.showPage(i - 1)}>${glyph(icons.prev)}</button
            ><button type="button" class="ui-xrev__icon-btn" aria-label="Next page" aria-disabled=${ifDefined(i >= pages.length - 1 ? "true" : undefined)} @click=${() => i < pages.length - 1 && this.showPage(i + 1)}>${glyph(icons.next)}</button>
          </span>`
        : nothing}
    </div>`;
    if (!page) return html`<div class="ui-xrev__page">${nav}<div class="ui-xrev__viewport"><div class="ui-xrev__nopage">${glyph(icons.doc)}<span>No page image</span></div></div></div>`;
    const boxes = this.fields.map((f, row) => ({ f, row })).filter(({ f }) => f.box && Math.round(f.box.page) - 1 === i);
    return html`<div class="ui-xrev__page">
      ${nav}
      <div class="ui-xrev__viewport" tabindex="0" role="region" aria-labelledby=${`${this.uid}-pageno`}>
        <div class="ui-xrev__sheet" style=${styleMap({ aspectRatio: `${page.width} / ${page.height}` })}>
          <img class="ui-xrev__img" src=${page.src} alt=${page.alt ?? `Page ${i + 1} of ${name}`} draggable="false" decoding="async" />
          ${repeat(
            boxes,
            ({ f }) => f.id,
            ({ f, row }) => {
              const b = f.box!;
              const on = f.id === active?.id;
              return html`<div
                class="ui-xrev__box"
                aria-hidden="true"
                data-status=${statusOf(f)}
                data-label=${f.label}
                ?data-low=${this.isLow(f)}
                ?data-active=${on}
                style=${styleMap({
                  left: `${(b.x / page.width) * 100}%`,
                  top: `${(b.y / page.height) * 100}%`,
                  width: `${(b.width / page.width) * 100}%`,
                  height: `${(b.height / page.height) * 100}%`,
                })}
                @click=${() => this.onBoxClick(row)}
              ></div>`;
            },
          )}
        </div>
      </div>
    </div>`;
  }

  /* ---------- Fields ---------- */

  private actionButton(row: number, col: number, f: ExtractionField, kind: "accept" | "correct" | "reject") {
    const status = statusOf(f);
    const pressed = kind === "accept" ? status === "accepted" : kind === "reject" ? status === "rejected" : undefined;
    const label = kind === "accept" ? (pressed ? `Undo accept, ${f.label}` : `Accept ${f.label}`) : kind === "reject" ? (pressed ? `Undo reject, ${f.label}` : `Reject ${f.label}`) : `Correct ${f.label}`;
    const run = kind === "accept" ? () => this.accept(row) : kind === "reject" ? () => this.reject(row) : () => this.startEdit(row);
    return html`<div role="gridcell" class="ui-xrev__act-cell">
      <button
        type="button"
        class="ui-xrev__act"
        data-kind=${kind}
        data-row=${row}
        data-col=${col}
        tabindex=${this.pos.row === row && this.pos.col === col ? 0 : -1}
        aria-label=${label}
        title=${label}
        aria-pressed=${ifDefined(pressed === undefined ? undefined : pressed ? "true" : "false")}
        aria-keyshortcuts=${kind === "accept" ? "A" : kind === "reject" ? "R" : "F2"}
        @click=${run}
      >${glyph(icons[kind])}</button>
    </div>`;
  }

  private renderField(f: ExtractionField, row: number) {
    const status = statusOf(f);
    const low = this.isLow(f);
    const on = row === this.pos.row;
    const editing = this.editing === f.id;
    const value = editing
      ? html`<input
          id=${`${this.uid}-edit`}
          class="ui-xrev__input"
          .value=${live(this.draft)}
          aria-label=${`Correct ${f.label}`}
          aria-describedby=${`${this.uid}-edit-help`}
          @input=${(e: Event) => (this.draft = (e.target as HTMLInputElement).value)}
          @keydown=${this.onEditKey}
          @blur=${() => this.editing === f.id && this.endEdit(true, false)}
        /><span class="ui-xrev__sr" id=${`${this.uid}-edit-help`}>Enter saves, Escape cancels</span>`
      : html`<span class="ui-xrev__value" ?data-empty=${!f.value}>${f.value || "Empty"}</span>`;
    return html`<div class="ui-xrev__row" role="row" data-status=${status} ?data-active=${on} ?data-low=${low && status === "pending"}>
      <div
        role="gridcell"
        class="ui-xrev__cell"
        data-row=${row}
        data-col="0"
        tabindex=${on && this.pos.col === 0 && !editing ? 0 : -1}
        aria-describedby=${`${this.uid}-keys`}
        @dblclick=${() => this.startEdit(row)}
      >
        <span class="ui-xrev__top">
          <span class="ui-xrev__label">${f.label}</span>
          <span class="ui-xrev__conf" ?data-low=${low}
            ><span class="ui-xrev__meter" aria-hidden="true"><span style=${styleMap({ transform: `scaleX(${clamp(f.confidence, 0, 1)})` })}></span></span
            >${low ? html`<span class="ui-xrev__low">Low</span>` : nothing}${pct(f.confidence)}<span class="ui-xrev__sr"> confidence</span></span
          >
        </span>
        ${value}
        ${!editing && status === "corrected" && f.original !== undefined && f.original !== f.value
          ? html`<span class="ui-xrev__was">was <del>${f.original || "empty"}</del></span>`
          : nothing}
        <span class="ui-xrev__status" data-status=${status}>${status === "pending" ? html`<span class="ui-xrev__sr">, ${STATUS_TEXT[status]}</span>` : html`${glyph(icons[status === "accepted" ? "accept" : status === "corrected" ? "correct" : "reject"])}${STATUS_TEXT[status]}`}</span>
      </div>
      ${this.actionButton(row, 1, f, "accept")} ${this.actionButton(row, 2, f, "correct")} ${this.actionButton(row, 3, f, "reject")}
    </div>`;
  }

  private renderFields(): TemplateResult {
    if (!this.fields.length) return html`<div class="ui-xrev__fields"><div class="ui-xrev__empty">No fields extracted</div></div>`;
    return html`<div class="ui-xrev__fields">
      <div class="ui-xrev__grid" role="grid" aria-labelledby=${`${this.uid}-title`} aria-rowcount=${this.fields.length} @keydown=${this.onGridKey} @focusin=${this.onGridFocusIn}>
        ${repeat(
          this.fields,
          (f) => f.id,
          (f, i) => this.renderField(f, i),
        )}
      </div>
    </div>`;
  }

  private renderFoot(): TemplateResult {
    const n = this.fields.length;
    const reviewed = this.fields.filter((f) => statusOf(f) !== "pending").length;
    const low = this.fields.filter((f) => statusOf(f) === "pending" && this.isLow(f)).length;
    const left = n - reviewed;
    return html`<div class="ui-xrev__foot">
      <span class="ui-xrev__summary">
        <span class="ui-xrev__progress" aria-hidden="true"><span style=${styleMap({ transform: `scaleX(${n ? reviewed / n : 0})` })}></span></span>
        <span>${n ? `${reviewed} of ${n} reviewed` : "Nothing to review"}</span>
        ${low ? html`<span class="ui-xrev__dot" aria-hidden="true">·</span><span class="ui-xrev__needs">${low} low confidence</span>` : nothing}
      </span>
      <button
        type="button"
        class="ui-xrev__confirm"
        aria-disabled=${ifDefined(left || !n ? "true" : undefined)}
        aria-describedby=${ifDefined(left ? `${this.uid}-left` : undefined)}
        @click=${this.confirm}
      >${this.confirmLabel}</button>
      ${left ? html`<span class="ui-xrev__sr" id=${`${this.uid}-left`}>${left === 1 ? "1 field still to review" : `${left} fields still to review`}</span>` : nothing}
    </div>`;
  }

  protected override render() {
    const clean = this.resolvedLook === "clean";
    const head = html`<div class="ui-xrev__head">
      <div class="ui-xrev__title" id=${`${this.uid}-title`}>${this.heading}</div>
      ${this.source ? html`<div class="ui-xrev__source">${glyph(icons.doc)}<span>${this.source}</span></div>` : nothing}
    </div>`;
    const body = html`<div class="ui-xrev__body">${this.renderPage()}${this.renderFields()}</div>`;
    const foot = this.renderFoot();
    return html`
      ${clean ? html`<div class="ui-xrev__card">${head}${body}${foot}</div>` : html`<div class="ui-xrev__card">${head}${body}</div>${foot}`}
      <span class="ui-xrev__sr" id=${`${this.uid}-keys`}>A accept, R reject, Enter correct, arrows move between fields</span>
      <span class="ui-xrev__sr" role="status">${this.said}</span>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card; the progress and Confirm sit on the tray below it */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="xrev"] {
  /* The page view's height, and the well behind the page */
  --tc-extraction-review-height: 440px;
  --tc-extraction-review-height-narrow: 260px;
  --tc-extraction-review-well: var(--tc-surface-well);
  box-sizing: border-box;
  container-type: inline-size;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  width: 100%;
  max-width: 880px;
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
/* Clean: one white card, the last row holds the progress */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="xrev"] {
  --tc-extraction-review-height: 420px;
  --tc-extraction-review-height-narrow: 260px;
  --tc-extraction-review-well: var(--tc-fill-subtle);
  box-sizing: border-box;
  container-type: inline-size;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  width: 100%;
  max-width: 860px;
  min-width: 0;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="xrev"] *, [data-ui="xrev"] *::before, [data-ui="xrev"] *::after { box-sizing: border-box; }
:where([data-ui="xrev"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-ui="xrev"]) svg { display: block; flex: none; }
[data-ui="xrev"] button:focus-visible, .ui-xrev__cell:focus-visible, .ui-xrev__viewport:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-xrev__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-xrev__glyph { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-xrev__glyph { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
/* The white card */
:where([data-look="standard"], [data-look="standard"] *).ui-xrev__card { min-width: 0; overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-xrev__card { min-width: 0; overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
/* ----- Heading and source ----- */
.ui-xrev__head { display: flex; align-items: baseline; flex-wrap: wrap; column-gap: var(--tc-space-3); row-gap: var(--tc-space-0-5); padding: var(--tc-space-3) var(--tc-space-4); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-xrev__title { min-width: 0; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-xrev__title { color: var(--tc-text-strong); }
.ui-xrev__source { display: inline-flex; align-items: center; gap: var(--tc-space-1); min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-xrev__source > span { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ui-xrev__source .ui-xrev__glyph { width: 14px; height: 14px; }
/* ----- The two panes: the page, the fields ----- */
.ui-xrev__body { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 340px); }
.ui-xrev__page { display: grid; grid-template-rows: auto minmax(0, 1fr); min-width: 0; border-right: var(--tc-hairline) solid var(--tc-divider); }
.ui-xrev__pagebar { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-2); min-height: 36px; padding: 0 var(--tc-space-2) 0 var(--tc-space-4); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; color: var(--tc-text-muted); }
.ui-xrev__pagebtns { display: flex; gap: var(--tc-space-0-5); }
.ui-xrev__icon-btn { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-action-ghost-fg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-xrev__icon-btn:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-xrev__icon-btn[aria-disabled="true"] { color: var(--tc-text-disabled); cursor: default; }
.ui-xrev__icon-btn[aria-disabled="true"]:hover { background: none; }
/* The page scrolls inside its well; the sheet is the page at the pane's width */
.ui-xrev__viewport { position: relative; outline-offset: calc(var(--tc-focus-ring-width) * -1) !important; height: var(--tc-extraction-review-height); overflow: auto; padding: 0 var(--tc-space-4) var(--tc-space-4); background: var(--tc-extraction-review-well); overscroll-behavior: contain; }
.ui-xrev__sheet { position: relative; width: 100%; margin-top: var(--tc-space-4); border-radius: var(--tc-radius-xs); background: var(--tc-gray-0); box-shadow: var(--tc-shadow-raised); }
.ui-xrev__img { display: block; width: 100%; height: 100%; border-radius: inherit; user-select: none; -webkit-user-drag: none; }
.ui-xrev__nopage { display: grid; justify-items: center; align-content: center; gap: var(--tc-space-2); height: 100%; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
/* Boxes: every field's place on the page, the active one highlighted with its name above it */
.ui-xrev__box { position: absolute; border-radius: var(--tc-radius-2xs); box-shadow: 0 0 0 1px var(--tc-border-strong); background: color-mix(in srgb, var(--tc-accent) 6%, transparent); cursor: pointer; transition: box-shadow var(--tc-duration-base) var(--tc-ease-standard), background-color var(--tc-duration-base) var(--tc-ease-standard); }
.ui-xrev__box:hover { box-shadow: 0 0 0 1.5px var(--tc-accent); }
.ui-xrev__box[data-low][data-status="pending"] { box-shadow: 0 0 0 1px var(--tc-status-warning-fg); background: color-mix(in srgb, var(--tc-status-warning-fg) 10%, transparent); }
.ui-xrev__box[data-status="accepted"] { box-shadow: 0 0 0 1px var(--tc-status-success-fg); background: color-mix(in srgb, var(--tc-status-success-fg) 8%, transparent); }
.ui-xrev__box[data-status="corrected"] { box-shadow: 0 0 0 1px var(--tc-status-info-fg); background: color-mix(in srgb, var(--tc-status-info-fg) 8%, transparent); }
.ui-xrev__box[data-status="rejected"] { box-shadow: 0 0 0 1px var(--tc-status-danger-fg); background: color-mix(in srgb, var(--tc-status-danger-fg) 8%, transparent); }
.ui-xrev__box[data-active][data-status] { z-index: 1; box-shadow: 0 0 0 2px var(--tc-accent), 0 0 0 5px var(--tc-accent-subtle); background: color-mix(in srgb, var(--tc-accent) 12%, transparent); animation: ui-xrev-pulse var(--tc-duration-slower) var(--tc-ease-move) both; }
.ui-xrev__box[data-active]::after { content: attr(data-label); position: absolute; left: -2px; bottom: calc(100% + 6px); max-width: 220px; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); overflow: hidden; border-radius: var(--tc-pill-radius); background: var(--tc-accent-solid); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-pill-h); color: var(--tc-text-on-accent); white-space: nowrap; text-overflow: ellipsis; pointer-events: none; }
/* ----- Fields ----- */
.ui-xrev__fields { min-width: 0; max-height: calc(var(--tc-extraction-review-height) + 36px); overflow: auto; overscroll-behavior: contain; }
.ui-xrev__grid { display: grid; padding: var(--tc-space-1-5); }
.ui-xrev__row { position: relative; display: grid; grid-template-columns: minmax(0, 1fr) repeat(3, auto); align-items: start; gap: var(--tc-space-0-5); padding: var(--tc-space-1); border-radius: var(--tc-radius-lg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-xrev__row { border-radius: var(--tc-radius-md); }
.ui-xrev__row:hover { background: var(--tc-fill-subtle); }
.ui-xrev__row[data-active] { background: var(--tc-fill-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-xrev__row[data-active] { background: var(--tc-accent-subtle); }
/* A low-confidence field still to review: a warning rule on its left */
.ui-xrev__row[data-low]::before { content: ""; position: absolute; left: 0; top: var(--tc-space-2-5); bottom: var(--tc-space-2-5); width: 2px; border-radius: var(--tc-radius-full); background: var(--tc-status-warning-fg); }
.ui-xrev__cell { display: grid; gap: var(--tc-space-0-5); min-width: 0; padding: var(--tc-space-1) var(--tc-space-2); border-radius: var(--tc-radius-md); outline: none; cursor: default; }
.ui-xrev__top { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-2); min-width: 0; }
.ui-xrev__label { overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
.ui-xrev__value { overflow: hidden; color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-xrev__value { font-weight: var(--tc-font-weight-medium); }
:where([data-look="clean"], [data-look="clean"] *).ui-xrev__value { color: var(--tc-text-strong); }
.ui-xrev__value[data-empty] { font-style: italic; color: var(--tc-text-muted); }
.ui-xrev__row[data-status="rejected"] .ui-xrev__value { color: var(--tc-text-muted); text-decoration: line-through; }
.ui-xrev__was { overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
.ui-xrev__was del { text-decoration-color: var(--tc-text-muted); }
/* Confidence: a short meter and the percentage; below the threshold, a Low tag in the warning tone */
.ui-xrev__conf { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); font-variant-numeric: tabular-nums; color: var(--tc-text-muted); }
.ui-xrev__meter { position: relative; width: 24px; height: 4px; overflow: hidden; border-radius: var(--tc-radius-full); background: var(--tc-fill-default); }
.ui-xrev__meter > span { position: absolute; inset: 0; border-radius: inherit; background: var(--tc-text-muted); transform-origin: left; }
.ui-xrev__conf[data-low] { color: var(--tc-status-warning-fg); }
.ui-xrev__conf[data-low] .ui-xrev__meter > span { background: var(--tc-status-warning-fg); }
.ui-xrev__low { height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-status-warning-bg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-pill-h); color: var(--tc-status-warning-fg); }
.ui-xrev__status { display: inline-flex; align-items: center; gap: var(--tc-space-1); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); }
.ui-xrev__status:not(:has(svg)) { display: contents; }
.ui-xrev__status .ui-xrev__glyph { width: 12px; height: 12px; stroke-width: 2.2; }
.ui-xrev__status[data-status="accepted"] { color: var(--tc-status-success-fg); }
.ui-xrev__status[data-status="corrected"] { color: var(--tc-status-info-fg); }
.ui-xrev__status[data-status="rejected"] { color: var(--tc-status-danger-fg); }
.ui-xrev__input { width: 100%; min-width: 0; height: var(--tc-control-h-sm); margin: 0; padding: 0 var(--tc-space-2); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow-focus); font: inherit; color: var(--tc-text-primary); caret-color: var(--tc-accent); outline: none; animation: ui-xrev-in var(--tc-duration-base) var(--tc-ease-move) both; }
/* Accept / Correct / Reject: ghost icon buttons; the pressed one takes its status colour */
.ui-xrev__act-cell { display: grid; padding-top: var(--tc-space-0-5); }
.ui-xrev__act { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-action-ghost-fg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-xrev__act:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-xrev__act[data-kind="accept"][aria-pressed="true"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-xrev__act[data-kind="reject"][aria-pressed="true"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-xrev__row[data-status="corrected"] .ui-xrev__act[data-kind="correct"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-xrev__empty { padding: var(--tc-space-8) var(--tc-space-4); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); text-align: center; }
/* ----- The tray below the card (Standard) / the card's last row (Clean) ----- */
.ui-xrev__foot { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3); min-height: 44px; padding: var(--tc-space-1) var(--tc-space-1) var(--tc-space-1) var(--tc-space-3); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-xrev__foot { min-height: 48px; padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-2) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); line-height: var(--tc-line-height-tight); }
.ui-xrev__summary { display: inline-flex; align-items: center; flex-wrap: wrap; column-gap: var(--tc-space-2); min-width: 0; }
.ui-xrev__summary > span { white-space: nowrap; }
.ui-xrev__progress { position: relative; flex: none; width: 48px; height: 4px; overflow: hidden; border-radius: var(--tc-radius-full); background: var(--tc-fill-strong); }
.ui-xrev__progress > span { position: absolute; inset: 0; border-radius: inherit; background: var(--tc-status-success-fg); transform-origin: left; transition: transform var(--tc-duration-moderate) var(--tc-ease-move); }
.ui-xrev__dot { color: var(--tc-text-disabled); }
.ui-xrev__needs { color: var(--tc-status-warning-fg); }
/* Confirm: Button's primary recipe; off until every field is reviewed */
.ui-xrev__confirm { flex: none; height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-primary-fg); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-xrev__confirm:hover { background: var(--tc-action-primary-bg-hover); }
.ui-xrev__confirm[aria-disabled="true"] { background: var(--tc-fill-strong); box-shadow: none; color: var(--tc-text-muted); cursor: default; }
@keyframes ui-xrev-in { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: none; } }
@keyframes ui-xrev-pulse { from { box-shadow: 0 0 0 2px var(--tc-accent), 0 0 0 12px transparent; } }
/* Narrow: the page above the fields */
@container (max-width: 620px) {
  .ui-xrev__body { grid-template-columns: minmax(0, 1fr); }
  .ui-xrev__page { border-right: 0; border-bottom: var(--tc-hairline) solid var(--tc-divider); }
  .ui-xrev__viewport { height: var(--tc-extraction-review-height-narrow); }
  .ui-xrev__fields { max-height: none; }
  .ui-xrev__viewport { padding: 0 var(--tc-space-3) var(--tc-space-3); }
  .ui-xrev__sheet { margin-top: var(--tc-space-3); }
}
@container (max-width: 380px) {
  .ui-xrev__head { padding: var(--tc-space-3); }
  .ui-xrev__meter { display: none; }
  .ui-xrev__progress { display: none; }
}
@media (pointer: coarse) {
  .ui-xrev__act, .ui-xrev__icon-btn { width: 36px; height: 36px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="xrev"] *, [data-ui="xrev"] *::before, [data-ui="xrev"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-extraction-review")) customElements.define("tc-extraction-review", TcExtractionReview);

declare global {
  interface HTMLElementTagNameMap {
    "tc-extraction-review": TcExtractionReview;
  }
}
