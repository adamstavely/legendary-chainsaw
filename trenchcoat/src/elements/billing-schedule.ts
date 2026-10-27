import { html, nothing, svg, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController, SmoothHeightController, rescueFocus } from "./internal/controllers";

/*
 * <tc-billing-schedule> – the Lit port of src/components/billing-schedule.tsx: build one phase of a billing plan.
 * Pick a start date and a duration, add products from a catalog, set how often each repeats, its price and whether
 * it's billed in advance or in arrears, then add a discount or a minimum commitment. The phase summary and the
 * totals update as you go; rows glide in and out.
 *
 * Standard puts the title and the totals on a gray tray around a white card; Clean is one white card with hairline
 * shadows, the totals as its last row.
 *
 *   <tc-billing-schedule heading="Billing schedule" .catalog=${catalog} @tc-schedule-change=${…}></tc-billing-schedule>
 *
 * Phase, start, duration and lines are values: each change fires a cancelable tc-<value>-change event, and then
 * tc-schedule-change with the whole schedule. With `name`, a hidden input carries the schedule as JSON for native form
 * submission.
 */

export type BillingRepeat = "once" | "monthly" | "quarterly" | "yearly";
export type BillingTiming = "advance" | "arrears";

export type BillingScheduleLine =
  | { id: string; kind: "product"; name: string; repeat: BillingRepeat; price: number; timing: BillingTiming }
  | { id: string; kind: "discount"; name: string; percent: number }
  | { id: string; kind: "minimum"; name: string; amount: number };

export type BillingCatalogItem = { name: string; repeat: BillingRepeat; price: number };

/** Duration ids: "milestone", "1m", "3m", "6m", "12m" */
export type BillingDuration = "milestone" | "1m" | "3m" | "6m" | "12m";

export type BillingScheduleValue = { phase: string; start: string; duration: string; lines: BillingScheduleLine[] };

const DURATIONS: { id: BillingDuration; label: string; months: number }[] = [
  { id: "milestone", label: "Milestone", months: 0 },
  { id: "1m", label: "1 month", months: 1 },
  { id: "3m", label: "3 months", months: 3 },
  { id: "6m", label: "6 months", months: 6 },
  { id: "12m", label: "12 months", months: 12 },
];

const REPEATS: { id: BillingRepeat; label: string; perYear: number }[] = [
  { id: "once", label: "Once", perYear: 0 },
  { id: "monthly", label: "Monthly", perYear: 12 },
  { id: "quarterly", label: "Quarterly", perYear: 4 },
  { id: "yearly", label: "Yearly", perYear: 1 },
];

const defaultCatalog: BillingCatalogItem[] = [
  { name: "Set-up fee", repeat: "once", price: 4999 },
  { name: "Platform licence", repeat: "monthly", price: 1200 },
  { name: "Premium support", repeat: "monthly", price: 350 },
  { name: "Extra seats (10)", repeat: "monthly", price: 240 },
  { name: "Onboarding workshop", repeat: "once", price: 1500 },
];

const defaultSeedLines: BillingScheduleLine[] = [{ id: "seed-1", kind: "product", name: "Set-up fee", repeat: "once", price: 4999, timing: "advance" }];

let lineUid = 0;
const nextId = () => `l${++lineUid}`;
let uid = 0;

// Formatters are built once
const fmtMoney = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPercent = new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const fmtDay = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** Last day of a phase that starts on `iso` and runs `months` months; the day of month is clamped, so Jan 31 + 1 month ends Feb 27, not Mar 2 */
function phaseEnd(iso: string, months: number) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  const lastDay = new Date(y, m - 1 + months + 1, 0).getDate();
  return new Date(y, m - 1 + months, Math.min(d, lastDay) - 1, 12);
}

const REPEAT = "M17 3.5 19.5 6 17 8.5M19.5 6H9a5 5 0 0 0-5 5M7 20.5 4.5 18 7 15.5M4.5 18H15a5 5 0 0 0 5-5";
const DISCOUNT = "M9 15 15 9M9.5 9.5h.01M14.5 14.5h.01M12 3l2.1 1.6 2.6-.2.9 2.5 2.3 1.2-.4 2.6L21 12.6l-1.5 2.1.4 2.6-2.3 1.2-.9 2.5-2.6-.2L12 21.4l-2.1-1.6-2.6.2-.9-2.5L4.1 16.3l.4-2.6L3 12l1.5-2.1-.4-2.6 2.3-1.2.9-2.5 2.6.2Z";
const MINIMUM = "M5 19.5h14M7 15.5h10M9 11.5h6M10 7.5h4M12 4v1";
const PENCIL = "M14.5 5.5l4 4M4.5 19.5l1-4.2L15.8 5a1.4 1.4 0 0 1 2 0l1.2 1.2a1.4 1.4 0 0 1 0 2L8.7 18.5l-4.2 1Z";
// The header icon: a receipt
const receiptIcon = svg`<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"></path><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path><path d="M12 17.5v-11"></path>`;

const icon = (d: string) => html`<svg viewBox="0 0 24 24" aria-hidden="true">${svg`<path d=${d}></path>`}</svg>`;

type Menu = null | "duration" | "product";
type Field = { draft: string | null; error: string | null };

/**
 * One phase of a billing plan: dates, products, a discount or a minimum, and the totals.
 * @tag tc-billing-schedule
 * @fires tc-phase-change - The phase name changes; detail `{ phase }`. Cancelable (controlled use)
 * @fires tc-start-change - The start date changes; detail `{ start }`. Cancelable
 * @fires tc-duration-change - The duration changes; detail `{ duration }`. Cancelable
 * @fires tc-lines-change - The lines change; detail `{ lines }`. Cancelable
 * @fires tc-schedule-change - After every change the user makes (not on connect); detail: the whole schedule
 */
export class TcBillingSchedule extends TcElement {
  static override ui = "bs";

  /** The heading */
  @property() accessor heading = "Create a billing schedule";
  /** Phase name */
  @property() accessor phase = "Build-out phase";
  /** Currency symbol shown with prices */
  @property() accessor currency = "$";
  /** Products offered under "Add product" */
  @property({ attribute: false }) accessor catalog: BillingCatalogItem[] = defaultCatalog;
  /** Schedule lines */
  @property({ attribute: false }) accessor lines: BillingScheduleLine[] = defaultSeedLines;
  /** Start date, yyyy-mm-dd */
  @property() accessor start = "2026-01-01";
  /** Phase length */
  @property() accessor duration: BillingDuration = "milestone";
  /** Form field name: a hidden input carries the schedule as JSON for native form submission */
  @property() accessor name: string | undefined = undefined;
  /** Disables every field and button */
  @property({ type: Boolean, reflect: true }) accessor disabled = false;

  /** @internal Which popup is open */
  @state() private accessor menu: Menu = null;
  /** @internal Number fields being edited, by line id: the raw text and what it couldn't take */
  @state() private accessor fields: Record<string, Field> = {};

  /** @internal */
  private baseId = `tc-bs-${++uid}`;
  /** @internal Where focus goes when a popup opens */
  private openAt: "current" | "first" | "last" = "current";
  /** @internal A line just added with a button: its field takes focus once it's there */
  private focusLine: string | null = null;
  private listening = false;

  constructor() {
    super();
    // Focus never falls to <body>: a control that goes away hands it to "Add product"
    new FocusRescueController(this, () => this.addButton);
    new SmoothHeightController(
      this,
      () => this.querySelector<HTMLElement>(".ui-bs__rows-outer"),
      () => this.querySelector<HTMLElement>(".ui-bs__rows-outer > div"),
    );
  }

  /** @internal */
  private get addButton() {
    return this.querySelector<HTMLButtonElement>('.ui-bs__actions [aria-haspopup="menu"]');
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.listen(false);
  }

  /* ---------- Changes ---------- */

  /** @internal Fires the cancelable value event and, unless prevented, applies it; then reports the whole schedule */
  private change<K extends "phase" | "start" | "duration" | "lines">(key: K, value: this[K]) {
    if (this.emit(`tc-${key}-change`, { [key]: value }, { cancelable: true })) this[key] = value;
    else this.requestUpdate();
    const schedule: BillingScheduleValue = { phase: this.phase, start: this.start, duration: this.duration, lines: this.lines, [key]: value };
    this.emit<BillingScheduleValue>("tc-schedule-change", schedule);
  }

  /** @internal */
  private updateLine(id: string, patch: Partial<BillingScheduleLine>) {
    const line = this.lines.find((l) => l.id === id);
    // A blur without an edit commits the same value – not a change
    if (!line || Object.entries(patch).every(([k, v]) => line[k as keyof BillingScheduleLine] === v)) return;
    this.change(
      "lines",
      this.lines.map((l) => (l === line ? ({ ...l, ...patch } as BillingScheduleLine) : l)),
    );
  }

  /** @internal */
  private removeLine(id: string) {
    // Focus goes to the next line's Remove, else the one before, else "Add product"
    const rows = [...this.querySelectorAll<HTMLElement>("[data-line]")];
    const at = rows.findIndex((r) => r.dataset.line === id);
    const removeOf = (row?: HTMLElement) => row?.querySelector<HTMLElement>(".ui-bs__remove");
    rescueFocus(rows[at], [removeOf(rows[at + 1]), removeOf(rows[at - 1]), this.addButton]);
    this.change(
      "lines",
      this.lines.filter((l) => l.id !== id),
    );
  }

  /** @internal */
  private addLine(line: BillingScheduleLine) {
    this.focusLine = line.id;
    this.change("lines", [...this.lines, line]);
  }

  /** @internal */
  private addProduct(c: BillingCatalogItem) {
    const lines = this.lines;
    this.change("lines", [...lines.filter((l) => l.kind === "product"), { id: nextId(), kind: "product", ...c, timing: "advance" }, ...lines.filter((l) => l.kind !== "product")]);
    this.menu = null;
  }

  /* ---------- Popups (APG listbox / menu button) ---------- */

  /** @internal */
  private onDocPointer = (e: PointerEvent) => {
    const dd = this.querySelector(`[data-dd="${this.menu}"]`);
    if (!dd?.contains(e.target as Node)) this.menu = null;
  };
  /** @internal */
  private onDocKey = (e: KeyboardEvent) => {
    if (e.key !== "Escape" || !this.menu) return;
    const dd = this.querySelector(`[data-dd="${this.menu}"]`);
    this.menu = null;
    if (dd?.contains(document.activeElement)) dd.querySelector<HTMLElement>(":scope > button")?.focus();
  };
  /** @internal */
  private listen(on: boolean) {
    if (on === this.listening) return;
    this.listening = on;
    const fn = on ? document.addEventListener.bind(document) : document.removeEventListener.bind(document);
    fn("pointerdown", this.onDocPointer as EventListener);
    fn("keydown", this.onDocKey as EventListener);
  }

  /** @internal */
  private items() {
    return [...this.querySelectorAll<HTMLElement>('.ui-bs__menu [role="option"], .ui-bs__menu [role="menuitem"]')];
  }

  /** @internal */
  private onListKey = (e: KeyboardEvent) => {
    const all = this.items();
    const i = all.indexOf(document.activeElement as HTMLElement);
    const go = (n: number) => {
      e.preventDefault();
      all[(n + all.length) % all.length]?.focus();
    };
    if (e.key === "ArrowDown") go(i + 1);
    else if (e.key === "ArrowUp") go(i - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(all.length - 1);
    else if (e.key === "Tab") this.menu = null;
  };

  protected override updated(changed: Map<PropertyKey, unknown>) {
    if (this.disabled) this.setAttribute("aria-disabled", "true");
    else this.removeAttribute("aria-disabled");
    this.listen(!!this.menu);
    // Focus moves in when a popup opens: onto the chosen option, or the first / last
    if (changed.has("menu") && this.menu) {
      const all = this.items();
      const at = this.openAt;
      (at === "first" ? all[0] : at === "last" ? all.at(-1) : (all.find((el) => el.getAttribute("aria-selected") === "true") ?? all[0]))?.focus();
    }
    const id = this.focusLine;
    if (id) {
      const input = this.querySelector<HTMLInputElement>(`[data-line="${CSS.escape(id)}"] .ui-bs__num input`);
      if (input) {
        this.focusLine = null;
        input.focus();
      }
    }
  }

  /** @internal A button with a popup: a listbox of options (Duration) or a menu of actions (Add product) */
  private dropdown(which: "duration" | "product", opts: { label: TemplateResult | string; labelledBy?: string; button?: boolean; up?: boolean; menu?: boolean }, items: TemplateResult[]) {
    const open = this.menu === which;
    const valueId = `${this.baseId}-${which}-value`;
    const close = (refocus: boolean) => {
      this.menu = null;
      if (refocus) this.querySelector<HTMLElement>(`[data-dd="${which}"] > button`)?.focus();
    };
    return html`<div class="ui-bs__dd" data-dd=${which}>
      <button
        type="button"
        class=${opts.button ? "ui-bs__btn" : "ui-bs__select"}
        aria-haspopup=${opts.menu ? "menu" : "listbox"}
        aria-expanded=${open ? "true" : "false"}
        aria-labelledby=${ifDefined(opts.labelledBy ? `${opts.labelledBy} ${valueId}` : undefined)}
        ?disabled=${this.disabled}
        @click=${() => {
          this.openAt = "current";
          this.menu = open ? null : which;
        }}
        @keydown=${(e: KeyboardEvent) => {
          if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
          e.preventDefault();
          this.openAt = e.key === "ArrowUp" ? "last" : "first";
          this.menu = which;
        }}
      ><span class="ui-bs__select-label" id=${valueId}>${opts.label}</span>${!opts.button ? icon("m7 10 5 5 5-5") : nothing}</button>
      ${open && !this.disabled
        ? html`<div
            class="ui-bs__menu"
            role=${opts.menu ? "menu" : "listbox"}
            aria-labelledby=${opts.labelledBy ?? valueId}
            ?data-up=${!!opts.up}
            @keydown=${this.onListKey}
            @click=${(e: Event) => {
              // Picking an item (its own handler runs first) returns focus to the button
              if ((e.target as HTMLElement).closest('[role="option"], [role="menuitem"]')) close(true);
            }}
          >${items}</div>`
        : nothing}
    </div>`;
  }

  /** @internal Number input that shows a formatted value and edits the raw one; what it can't take is said */
  private numberField(lineId: string, opts: { value: number; prefix?: string; suffix?: string; max?: number; label: string; onChange: (v: number) => void }) {
    const field = this.fields[lineId] ?? { draft: null, error: null };
    const set = (next: Partial<Field>) => (this.fields = { ...this.fields, [lineId]: { ...(this.fields[lineId] ?? { draft: null, error: null }), ...next } });
    const errorId = `${this.baseId}-${lineId}-error`;
    const shown = field.draft ?? (opts.suffix ? fmtPercent : fmtMoney).format(opts.value);
    return html`<span class="ui-bs__num" ?data-invalid=${!!field.error}>${opts.prefix ?? nothing}<input
        .value=${live(shown)}
        inputmode="decimal"
        aria-label=${opts.label}
        aria-invalid=${ifDefined(field.error ? "true" : undefined)}
        aria-describedby=${ifDefined(field.error ? errorId : undefined)}
        ?disabled=${this.disabled}
        size=${Math.max(2, shown.length)}
        @focus=${() => set({ draft: String(opts.value) })}
        @input=${(e: Event) => {
          const raw = (e.target as HTMLInputElement).value;
          // Thousands separators are fine; anything else is kept (so nothing vanishes) and flagged
          set({ draft: raw, error: /[^\d.,\s]/.test(raw) ? "Numbers only" : null });
        }}
        @blur=${() => {
          const draft = (this.fields[lineId] ?? field).draft;
          const parsed = parseFloat((draft ?? "").replace(/[,\s]/g, ""));
          if (draft !== null && (Number.isNaN(parsed) || /[^\d.,\s]/.test(draft))) {
            // Nothing usable: the last value stays, and the field says why
            set({ error: draft.trim() ? "Not a number – kept the previous value" : "Enter a number – kept the previous value", draft: null });
            return;
          }
          const v = Math.max(0, Math.min(opts.max ?? Infinity, parsed));
          set({ error: opts.max !== undefined && parsed > opts.max ? `Capped at ${opts.max}${opts.suffix ?? ""}` : null, draft: null });
          opts.onChange(v);
        }}
        @keydown=${(e: KeyboardEvent) => e.key === "Enter" && !e.isComposing && (e.target as HTMLInputElement).blur()}
      />${opts.suffix ?? nothing}${field.error ? html`<span class="ui-bs__num-error" id=${errorId}>${field.error}</span>` : nothing}</span
    >`;
  }

  /** @internal One line of the schedule: a product, a discount or a minimum */
  private lineRow(l: BillingScheduleLine) {
    const currency = this.currency;
    const disabled = this.disabled;
    const onUpdate = (patch: Partial<BillingScheduleLine>) => this.updateLine(l.id, patch);
    return html`<div class="ui-bs__row" role="row" data-kind=${l.kind} data-line=${l.id}>
      <span role="cell" class="ui-bs__name">${l.kind !== "product" ? html`<span class="ui-bs__tag" aria-hidden="true">${icon(l.kind === "discount" ? DISCOUNT : MINIMUM)}</span>` : nothing}<span class="ui-bs__name-text">${l.name}</span></span>
      <span role="cell"
        >${l.kind === "product"
          ? html`<label class="ui-bs__repeat"
              >${icon(REPEAT)}<select ?disabled=${disabled} aria-label=${`${l.name} repeats`} @change=${(e: Event) => onUpdate({ repeat: (e.target as HTMLSelectElement).value as BillingRepeat })}>
                ${REPEATS.map((r) => html`<option value=${r.id} .selected=${live(r.id === l.repeat)}>${r.label}</option>`)}
              </select></label
            >`
          : html`<span class="ui-bs__muted">${l.kind === "discount" ? "Whole phase" : "Per phase"}</span>`}</span
      >
      <span role="cell" class="ui-bs__price"
        ><span class="ui-bs__price-main"
          >${l.kind === "product"
            ? html`${this.numberField(l.id, { value: l.price, prefix: currency, onChange: (v) => onUpdate({ price: v }), label: `${l.name} price` })}<span class="ui-bs__muted"
                  >/ ${l.repeat === "once" ? "once" : REPEATS.find((r) => r.id === l.repeat)!.label.toLowerCase().replace("ly", "")}</span
                >`
            : nothing}${l.kind === "discount"
            ? html`${this.numberField(l.id, { value: l.percent, suffix: "%", max: 100, onChange: (v) => onUpdate({ percent: v }), label: "Discount percent" })}<span class="ui-bs__muted">off</span>`
            : nothing}${l.kind === "minimum"
            ? html`${this.numberField(l.id, { value: l.amount, prefix: currency, onChange: (v) => onUpdate({ amount: v }), label: "Minimum commitment" })}<span class="ui-bs__muted">minimum</span>`
            : nothing}<button type="button" class="ui-bs__remove" aria-label=${`Remove ${l.name}`} ?disabled=${disabled} @click=${() => this.removeLine(l.id)}>${icon("M7 7l10 10M17 7 7 17")}</button></span
        >${l.kind === "product"
          ? html`<select class="ui-bs__timing" ?disabled=${disabled} aria-label=${`${l.name} billed`} @change=${(e: Event) => onUpdate({ timing: (e.target as HTMLSelectElement).value as BillingTiming })}>
              <option value="advance" .selected=${live(l.timing === "advance")}>Billed in advance</option>
              <option value="arrears" .selected=${live(l.timing === "arrears")}>Billed in arrears</option>
            </select>`
          : nothing}</span
      >
    </div>`;
  }

  protected override render() {
    const { phase, start, duration, lines, currency, disabled } = this;
    const clean = this.resolvedLook === "clean";
    const durationId = `${this.baseId}-duration`;
    const money = (n: number) => `${currency}${fmtMoney.format(n)}`;
    const fmtDate = (iso: string) => {
      const d = new Date(`${iso}T12:00:00`);
      return isNaN(d.getTime()) ? "–" : fmtDay.format(d);
    };
    const dur = DURATIONS.find((d) => d.id === duration) ?? DURATIONS[0];
    const end = (() => {
      if (!dur.months) return "Milestone";
      const d = phaseEnd(start, dur.months);
      return d && !isNaN(d.getTime()) ? fmtDay.format(d) : "–";
    })();
    const hasDiscount = lines.some((l) => l.kind === "discount");
    const hasMinimum = lines.some((l) => l.kind === "minimum");

    // Totals: what the first invoice holds, and what the phase is worth over its length
    const products = lines.filter((l): l is Extract<BillingScheduleLine, { kind: "product" }> => l.kind === "product");
    const discount = lines.find((l): l is Extract<BillingScheduleLine, { kind: "discount" }> => l.kind === "discount");
    const minimum = lines.find((l): l is Extract<BillingScheduleLine, { kind: "minimum" }> => l.kind === "minimum");
    const off = 1 - (discount?.percent ?? 0) / 100;
    const firstInvoice = products.filter((p) => p.timing === "advance").reduce((s, p) => s + p.price, 0) * off;
    // Recurring products are worth their price per year × the share of the year the phase covers; a milestone counts
    // one billing period of each
    const phaseTotal =
      products.reduce((s, p) => {
        const per = REPEATS.find((r) => r.id === p.repeat)!.perYear;
        if (!per) return s + p.price;
        return s + (dur.months ? Math.round(((p.price * per * dur.months) / 12) * 100) / 100 : p.price);
      }, 0) * off;
    const total = Math.max(phaseTotal, minimum?.amount ?? 0);
    const minimumApplies = Boolean(minimum && total === minimum.amount && phaseTotal < minimum.amount);
    const phaseLabel = dur.months ? `Phase total (${dur.label})` : "Phase total";

    const title = cardHead({ icon: receiptIcon, title: this.heading });

    // Phase summary – the name is editable, dates follow the fields below
    const summary = html`<div class="ui-bs__summary">
      <span class="ui-bs__phase-field"
        ><input class="ui-bs__phase" .value=${live(phase)} @input=${(e: Event) => this.change("phase", (e.target as HTMLInputElement).value)} aria-label="Phase name" ?disabled=${disabled} size=${Math.max(6, phase.length)} />${icon(PENCIL)}</span
      >${clean ? html`<span class="ui-bs__dot" aria-hidden="true">·</span>` : nothing}<span class="ui-bs__date">${fmtDate(start)}</span
      ><svg viewBox="0 0 24 24" aria-hidden="true">${svg`<path d="M5 12h14m0 0-5-5m5 5-5 5"></path>`}</svg>${keyed(end, html`<span class="ui-bs__end">${end}</span>`)}
    </div>`;

    const fields = html`<div class="ui-bs__fields">
      <label class="ui-bs__field"
        ><span class="ui-bs__label">Start date</span
        ><span class="ui-bs__input"
          ><input type="date" .value=${live(start)} ?disabled=${disabled} @input=${(e: Event) => this.change("start", (e.target as HTMLInputElement).value)} />${icon(
            "M7 4v3M17 4v3M4.5 9.5h15M6 6h12a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 18 20H6a1.5 1.5 0 0 1-1.5-1.5v-11A1.5 1.5 0 0 1 6 6Z",
          )}</span
        ></label
      >
      <div class="ui-bs__field">
        <span class="ui-bs__label" id=${durationId}>Duration</span>
        ${this.dropdown(
          "duration",
          { label: dur.label, labelledBy: durationId },
          DURATIONS.map(
            (d) =>
              html`<button
                type="button"
                role="option"
                tabindex="-1"
                aria-selected=${d.id === duration ? "true" : "false"}
                @click=${() => {
                  if (d.id !== this.duration) this.change("duration", d.id);
                  this.menu = null;
                }}
              >${d.label}${d.id === duration ? icon("m6 12.5 4 4 8-9") : nothing}</button>`,
          ),
        )}
      </div>
    </div>`;

    const table = html`<div class="ui-bs__table" role="table" aria-label="Billing lines">
      <div class="ui-bs__row ui-bs__row--head" role="row"><span role="columnheader">Name</span><span role="columnheader">Repeats</span><span role="columnheader" class="ui-bs__right">Price</span></div>
      <div class="ui-bs__rows-outer">
        <div>
          ${lines.length === 0 ? html`<p class="ui-bs__empty">No products yet – add one below.</p>` : nothing}
          ${repeat(
            lines,
            (l) => l.id,
            (l) => this.lineRow(l),
          )}
        </div>
      </div>
    </div>`;

    const actions = html`<div class="ui-bs__actions">
      ${this.dropdown(
        "product",
        { label: html`${icon("M12 5.5v13M5.5 12h13")}Add product`, button: true, up: true, menu: true },
        this.catalog.map(
          (c) =>
            html`<button type="button" role="menuitem" tabindex="-1" @click=${() => this.addProduct(c)}>
              <span>${c.name}<small>${money(c.price)} · ${REPEATS.find((r) => r.id === c.repeat)!.label.toLowerCase()}</small></span>
            </button>`,
        ),
      )}
      <span class="ui-bs__spacer"></span>
      <button type="button" class="ui-bs__btn" ?disabled=${disabled || hasDiscount} @click=${() => this.addLine({ id: nextId(), kind: "discount", name: "Discount", percent: 10 })}>${icon(DISCOUNT)}Add discount</button>
      <button type="button" class="ui-bs__btn" ?disabled=${disabled || hasMinimum} @click=${() => this.addLine({ id: nextId(), kind: "minimum", name: "Minimum commitment", amount: 10000 })}>${icon(MINIMUM)}Add minimum</button>
    </div>`;

    const first = money(firstInvoice);
    const totalText = money(total);
    // First invoice and the phase total – Clean: the card's last row, Standard: the tray under the card
    const totals = clean
      ? html`<div class="ui-bs__totals" role="status">
          <span class="ui-bs__total"><span class="ui-bs__total-label">First invoice</span><b>${first}</b></span>
          <span class="ui-bs__total ui-bs__total--phase">${minimumApplies ? html`<em>Minimum applies</em>` : nothing}<span class="ui-bs__total-label">${phaseLabel}</span><b>${totalText}</b></span>
        </div>`
      : html`<div class="ui-bs__totals" role="status">
          <span>First invoice <b>${first}</b></span>
          <span>${phaseLabel} <b>${totalText}</b>${minimumApplies ? html`<em>minimum applies</em>` : nothing}</span>
        </div>`;

    return html`
      ${this.name !== undefined ? html`<input type="hidden" name=${this.name} ?disabled=${disabled} .value=${JSON.stringify({ phase, start, duration, lines })} />` : nothing}
      ${clean
        ? html`${title}${summary}${fields}${table}${actions}${totals}`
        : html`${title}
            <div class="ui-bs__card">${summary}${fields}${table}${actions}</div>
            ${totals}`}
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="bs"] {
  box-sizing: border-box;
  container-type: inline-size;
  width: 100%;
  max-width: 560px;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-sunken);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-lg);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on [data-ui="bs"] */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="bs"] {
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  position: relative;
  box-sizing: border-box;
  container-type: inline-size;
  width: 100%;
  max-width: 560px;
  border-radius: var(--tc-radius-lg);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-shadow-raised);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
[data-ui="bs"] *, [data-ui="bs"] *::before, [data-ui="bs"] *::after { box-sizing: border-box; }
/* Resets stay at element specificity, so the buttons' and fields' own type wins */
:where([data-look="standard"], [data-look="standard"] *):where([data-ui="bs"]) :where(button, select, input) { font: inherit; color: inherit; margin: 0; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="bs"] button { cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="bs"] :focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="bs"] svg:where(:not(.tc-head__icon > svg)) { width: 16px; height: 16px; flex: none; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__card {
  padding: var(--tc-space-3);
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
}
/* Summary */
:where([data-look="standard"], [data-look="standard"] *).ui-bs__summary { display: flex; align-items: center; gap: var(--tc-space-2); padding: var(--tc-space-0-5) var(--tc-space-0-5) var(--tc-space-3); font-size: var(--tc-font-size-lg); color: var(--tc-text-secondary); }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__phase {
  min-width: 0;
  padding: var(--tc-space-0-5) var(--tc-space-1);
  margin-left: -4px !important;
  border: 0;
  border-radius: var(--tc-radius-sm);
  background: none;
  font-weight: var(--tc-font-weight-medium);
  color: var(--tc-text-primary) !important;
  outline: none;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-bs__phase:hover { background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow-hover); }
.ui-bs__phase:focus { background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow-focus); }
.ui-bs__phase-field { display: inline-flex; align-items: center; gap: var(--tc-space-1); min-width: 0; }
.ui-bs__phase-field > svg { width: 13px !important; height: 13px !important; color: var(--tc-icon-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__summary svg { width: 15px; height: 15px; color: var(--tc-text-muted); }
:where([data-ui="bs"][data-look="clean"]) button,
:where([data-ui="bs"][data-look="clean"]) select,
:where([data-ui="bs"][data-look="clean"]) input { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; }
:where([data-ui="bs"][data-look="clean"]) button { cursor: pointer; -webkit-tap-highlight-color: transparent; }
/* 16px icons with thin ~1.1px lines */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="bs"] svg:where(:not(.tc-head__icon > svg)) { display: block; width: 16px; height: 16px; flex: none; fill: none; stroke: currentColor; stroke-width: 1.65; stroke-linecap: round; stroke-linejoin: round; }
/* Head: title and the phase summary */
:where([data-look="clean"], [data-look="clean"] *).ui-bs__summary { display: flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; padding: 0 var(--tc-space-3-5) var(--tc-space-3); color: var(--tc-text-secondary); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__phase {
  min-width: 0;
  max-width: 100%;
  margin-left: -4px;
  padding: 0 var(--tc-space-1);
  border-radius: var(--tc-radius-badge);
  font-weight: var(--tc-font-weight-medium);
  color: var(--tc-text-primary);
  outline: none;
  text-overflow: ellipsis;
  /* Hugs its text where supported – the size attribute is the fallback */
  field-sizing: content;
  transition: background-color var(--tc-duration-quick) var(--tc-ease-standard), box-shadow var(--tc-duration-quick) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-bs__dot { color: var(--tc-text-disabled); }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__summary svg { width: 14px; height: 14px; color: var(--tc-text-disabled); }
.ui-bs__end { animation: ui-bs-fade var(--tc-duration-moderate) var(--tc-ease-standard) both; }
/* Fields */
:where([data-look="standard"], [data-look="standard"] *).ui-bs__fields { display: grid; grid-template-columns: 1fr 1fr; gap: var(--tc-space-2-5); padding: var(--tc-space-2-5); border-radius: var(--tc-radius-xl); background: var(--tc-surface-sunken); }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__field { display: grid; gap: var(--tc-space-2); min-width: 0; font-size: var(--tc-font-size-md); color: var(--tc-text-secondary); }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__input,
:where([data-look="standard"], [data-look="standard"] *).ui-bs__select {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-2);
  width: 100%;
  height: var(--tc-field-h);
  padding: 0 var(--tc-field-px);
  border: 0;
  border-radius: var(--tc-field-radius);
  background: var(--tc-field-bg);
  box-shadow: var(--tc-field-shadow);
  font-size: var(--tc-field-font-size);
  color: var(--tc-text-primary) !important;
  text-align: left;
}
:where([data-look="standard"], [data-look="standard"] *).ui-bs__input input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: 0;
  background: none;
  outline: none;
}
/* Fields */
:where([data-look="clean"], [data-look="clean"] *).ui-bs__fields { display: grid; grid-template-columns: 1fr 1fr; gap: var(--tc-space-2-5); padding: 0 var(--tc-space-3-5) var(--tc-space-3-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__field { display: grid; gap: var(--tc-space-1-5); min-width: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__label { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__input,
:where([data-look="clean"], [data-look="clean"] *).ui-bs__select {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-2);
  width: 100%;
  height: var(--tc-field-h);
  padding: 0 calc(var(--tc-field-px) - 2px) 0 var(--tc-field-px);
  border-radius: var(--tc-field-radius);
  background: var(--tc-field-bg);
  box-shadow: var(--tc-field-shadow);
  color: var(--tc-text-primary);
  text-align: left;
  transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-bs__select:hover,
.ui-bs__input:hover { box-shadow: var(--tc-field-shadow-hover); }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__input input {
  flex: 1;
  min-width: 0;
  height: 100%;
  outline: none;
  font-variant-numeric: tabular-nums;
}
/* The native picker opens from the whole field; its own icon is hidden behind ours */
.ui-bs__input input::-webkit-calendar-picker-indicator { position: absolute; inset: 0; width: auto; height: auto; opacity: 0; cursor: pointer; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__input svg { color: var(--tc-text-secondary); pointer-events: none; }
.ui-bs__input:focus-within { box-shadow: var(--tc-field-shadow-focus); }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__select svg { color: var(--tc-text-muted); transition: transform var(--tc-duration-base) var(--tc-ease-move); }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__input svg { color: var(--tc-icon-muted); pointer-events: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__select svg { color: var(--tc-icon-muted); transition: transform var(--tc-duration-base) var(--tc-ease-move); }
.ui-bs__select[aria-expanded="true"] svg { transform: rotate(180deg); }
/* Dropdowns */
.ui-bs__dd { position: relative; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: var(--tc-z-dropdown);
  display: grid;
  gap: 1px;
  min-width: 220px;
  padding: var(--tc-menu-padding);
  border-radius: var(--tc-menu-radius);
  background: var(--tc-menu-bg);
  box-shadow: var(--tc-menu-shadow);
  animation: ui-bs-menu var(--tc-duration-base) var(--tc-ease-move) both;
  transform-origin: top;
}
:where([data-look="clean"], [data-look="clean"] *).ui-bs__menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: var(--tc-z-dropdown);
  display: grid;
  gap: 1px;
  min-width: 220px;
  padding: var(--tc-menu-padding);
  border-radius: var(--tc-menu-radius);
  background: var(--tc-menu-bg);
  box-shadow: var(--tc-menu-shadow);
  animation: ui-bs-menu var(--tc-duration-base) var(--tc-ease-move) both;
  transform-origin: top;
}
.ui-bs__menu[data-up] { top: auto; bottom: calc(100% + 6px); right: auto; transform-origin: bottom left; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__menu button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-2-5);
  min-height: var(--tc-menu-item-h);
  padding: 6px var(--tc-menu-item-px);
  border: 0;
  border-radius: var(--tc-menu-item-radius);
  background: none;
  font-size: var(--tc-menu-item-font-size);
  text-align: left;
}
.ui-bs__menu button:hover { background: var(--tc-menu-item-hover); }
/* Menu rows: the ring sits inside the row */
.ui-bs__menu button:focus-visible { outline-offset: calc(var(--tc-focus-ring-width) * -1); }
.ui-bs__menu button svg { color: var(--tc-menu-item-selected-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__menu small { display: block; margin-top: 1px; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
/* Table */
:where([data-look="standard"], [data-look="standard"] *).ui-bs__table { margin-top: var(--tc-space-1-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__row {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr) 216px;
  align-items: center;
  gap: var(--tc-space-3-5);
  min-height: 52px;
  padding: var(--tc-space-1-5) var(--tc-space-1) var(--tc-space-1-5) var(--tc-space-1-5);
  border-bottom: 1px solid var(--tc-border-default);
  font-size: var(--tc-font-size-lg);
  animation: ui-bs-row var(--tc-duration-slow) var(--tc-ease-move) both;
}
:where([data-look="standard"], [data-look="standard"] *).ui-bs__row--head { min-height: 40px; font-size: var(--tc-font-size-md); color: var(--tc-text-muted); animation: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__right { text-align: right; padding-right: 30px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__menu button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-2-5);
  min-height: var(--tc-menu-item-h);
  padding: 4px var(--tc-menu-item-px);
  border-radius: var(--tc-menu-item-radius);
  font-size: var(--tc-menu-item-font-size);
  text-align: left;
  color: var(--tc-text-primary);
  transition: background-color var(--tc-duration-instant) var(--tc-ease-decelerate);
}
:where([data-look="clean"], [data-look="clean"] *).ui-bs__menu small { display: block; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
/* Table: hairline rows from edge to edge */
:where([data-look="clean"], [data-look="clean"] *).ui-bs__table { border-top: 0.5px solid var(--tc-border-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__row {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr) 216px;
  align-items: center;
  gap: var(--tc-space-3);
  min-height: 48px;
  padding: var(--tc-space-1-5) var(--tc-space-2-5) var(--tc-space-1-5) var(--tc-space-3-5);
  border-bottom: 0.5px solid var(--tc-border-default);
  transition: background-color var(--tc-duration-quick) var(--tc-ease-standard);
  animation: ui-bs-row var(--tc-duration-slow) var(--tc-ease-move) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-bs__rows-outer .ui-bs__row:hover { background: var(--tc-fill-subtle); }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__row--head {
  min-height: 32px;
  padding-top: var(--tc-space-2);
  padding-bottom: var(--tc-space-2);
  font-size: var(--tc-font-size-2xs);
  line-height: var(--tc-line-height-tight);
  font-weight: var(--tc-font-weight-medium);
  letter-spacing: var(--tc-tracking-caps);
  text-transform: uppercase;
  color: var(--tc-text-muted);
  animation: none;
}
:where([data-look="clean"], [data-look="clean"] *).ui-bs__right { text-align: right; padding-right: 36px; }
.ui-bs__rows-outer { overflow: hidden; }
.ui-bs__rows-outer[data-smooth] { transition: height var(--tc-duration-slow) var(--tc-ease-move); }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__empty { margin: 0; padding: var(--tc-space-4) var(--tc-space-1-5); font-size: var(--tc-font-size-md); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__name { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__empty { margin: 0; padding: var(--tc-space-3-5); border-bottom: 0.5px solid var(--tc-border-default); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__name { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-bs__name-text { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__tag { display: grid; place-items: center; width: 22px; height: 22px; flex: none; border-radius: var(--tc-radius-sm); background: var(--tc-fill-default); color: var(--tc-text-secondary); }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__tag svg { width: 13px; height: 13px; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__muted { font-size: var(--tc-font-size-md); color: var(--tc-text-muted); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__repeat { position: relative; display: inline-flex; align-items: center; gap: var(--tc-space-1-5); color: var(--tc-text-secondary); }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__repeat select,
:where([data-look="standard"], [data-look="standard"] *).ui-bs__timing {
  padding: var(--tc-space-1) var(--tc-space-1);
  margin-left: -4px !important;
  border: 0;
  border-radius: var(--tc-radius-sm);
  background: none;
  appearance: none;
  cursor: pointer;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-bs__repeat select:hover,
:where([data-look="standard"], [data-look="standard"] *).ui-bs__timing:hover { background: var(--tc-fill-hover); }
/* Under the amount, right-aligned with it (the remove button's slot stays free) */
:where([data-look="standard"], [data-look="standard"] *).ui-bs__timing { min-height: 24px; margin: 0 var(--tc-space-7) 0 0 !important; padding: 1px var(--tc-space-1) !important; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted) !important; text-align: right; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__tag { display: grid; place-items: center; width: 20px; height: 20px; flex: none; border-radius: var(--tc-radius-badge); background: var(--tc-fill-default); color: var(--tc-icon-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__tag svg { width: 14px; height: 14px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__muted { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__repeat { position: relative; display: inline-flex; align-items: center; gap: var(--tc-space-1); color: var(--tc-icon-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__repeat select { color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__repeat select,
:where([data-look="clean"], [data-look="clean"] *).ui-bs__timing {
  height: 24px;
  padding: 0 var(--tc-space-1-5);
  border-radius: var(--tc-radius-sm);
  appearance: none;
  cursor: pointer;
  transition: background-color var(--tc-duration-quick) var(--tc-ease-standard), color var(--tc-duration-quick) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-bs__repeat select:hover,
:where([data-look="clean"], [data-look="clean"] *).ui-bs__timing:hover { background: var(--tc-fill-default); color: var(--tc-text-primary); }
/* Under the amount, right-aligned with it (the remove button's slot stays free) */
:where([data-look="clean"], [data-look="clean"] *).ui-bs__timing { height: 24px; margin: 0 30px 0 0; padding: 0 var(--tc-space-1); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); text-align: right; }
.ui-bs__price { display: grid; justify-items: end; min-width: 0; }
.ui-bs__price-main { display: flex; align-items: center; gap: var(--tc-space-1); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__num { display: inline-flex; align-items: center; color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__num input {
  padding: var(--tc-space-1) 1px;
  border: 0;
  border-radius: var(--tc-radius-sm);
  background: none;
  outline: none;
  text-align: right;
  font-variant-numeric: tabular-nums;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-bs__num input:hover { background: var(--tc-fill-hover); }
.ui-bs__num input:focus { background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow-focus); }
.ui-bs__num[data-invalid] input { box-shadow: var(--tc-field-shadow-invalid); }
.ui-bs__num { position: relative; }
.ui-bs__num-error { position: absolute; top: 100%; right: 0; z-index: 1; margin-top: var(--tc-space-0-5); padding: var(--tc-space-0-5) var(--tc-space-1-5); border-radius: var(--tc-radius-xs); background: var(--tc-surface-overlay); box-shadow: var(--tc-shadow-overlay); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-status-danger-fg); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__remove {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  margin-left: var(--tc-space-1) !important;
  padding: 0;
  border: 0;
  border-radius: var(--tc-radius-sm);
  background: none;
  color: var(--tc-text-muted) !important;
  opacity: 0;
  transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-bs__remove svg { width: 13px; height: 13px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__num { display: inline-flex; align-items: center; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__num input {
  height: 24px;
  padding: 0 1px;
  border-radius: var(--tc-radius-badge);
  outline: none;
  font-weight: var(--tc-font-weight-medium);
  text-align: right;
  font-variant-numeric: tabular-nums;
  field-sizing: content;
  min-width: 2ch;
  transition: background-color var(--tc-duration-quick) var(--tc-ease-standard), box-shadow var(--tc-duration-quick) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-bs__num input:hover { background: var(--tc-fill-default); }
/* Ghost icon button – shows on row hover */
:where([data-look="clean"], [data-look="clean"] *).ui-bs__remove {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  margin-left: var(--tc-space-0-5);
  border-radius: var(--tc-radius-sm);
  color: var(--tc-icon-muted);
  opacity: 0;
  transition: opacity var(--tc-duration-quick) var(--tc-ease-standard), background-color var(--tc-duration-quick) var(--tc-ease-standard), color var(--tc-duration-quick) var(--tc-ease-standard);
}
.ui-bs__row:hover .ui-bs__remove, .ui-bs__remove:focus-visible { opacity: 1; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__remove:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary) !important; }
/* Actions */
:where([data-look="standard"], [data-look="standard"] *).ui-bs__actions { display: flex; align-items: center; gap: var(--tc-space-2); margin-top: var(--tc-space-3); padding: var(--tc-space-2-5); border-radius: var(--tc-radius-xl); background: var(--tc-surface-sunken); }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__remove:hover { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
/* Actions: secondary buttons right under the lines */
:where([data-look="clean"], [data-look="clean"] *).ui-bs__actions { display: flex; align-items: center; gap: var(--tc-space-2); padding: var(--tc-space-2-5) var(--tc-space-3-5) var(--tc-space-3); }
.ui-bs__spacer { flex: 1; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__btn {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-2);
  height: var(--tc-control-h-md);
  padding: 0 var(--tc-control-px-md);
  border: 0;
  border-radius: var(--tc-control-radius-md);
  background: var(--tc-action-secondary-bg);
  box-shadow: var(--tc-action-secondary-shadow);
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  color: var(--tc-action-secondary-fg) !important;
  white-space: nowrap;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-base) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-bs__btn:hover:not(:disabled) { box-shadow: var(--tc-action-secondary-shadow-hover); }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__btn:active:not(:disabled) { transform: scale(0.98); }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__btn:disabled { opacity: 0.45; cursor: default; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__btn svg { color: var(--tc-text-secondary); }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__select-label { display: inline-flex; align-items: center; gap: var(--tc-space-2); }
/* Totals */
:where([data-look="standard"], [data-look="standard"] *).ui-bs__totals { display: flex; justify-content: space-between; gap: var(--tc-space-3); flex-wrap: wrap; padding: var(--tc-space-3) var(--tc-space-2-5) var(--tc-space-1-5); font-size: var(--tc-font-size-md); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__totals b { margin-left: var(--tc-space-1); font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__totals em { margin-left: var(--tc-space-1-5); font-style: normal; font-size: var(--tc-font-size-sm); color: var(--tc-accent-text); }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__btn {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  height: var(--tc-control-h-md);
  padding: 0 var(--tc-control-px-md) 0 calc(var(--tc-control-px-md) - 2px);
  border-radius: var(--tc-control-radius-md);
  background: var(--tc-action-secondary-bg);
  box-shadow: var(--tc-action-secondary-shadow);
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  color: var(--tc-action-secondary-fg);
  white-space: nowrap;
  transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-base) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-bs__btn:active:not(:disabled) { transform: scale(0.97); }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__btn:disabled { opacity: 0.4; cursor: default; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__btn svg { color: var(--tc-icon-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__select-label { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; }
/* Totals: the last row under a hairline */
:where([data-look="clean"], [data-look="clean"] *).ui-bs__totals { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-1-5) var(--tc-space-4); flex-wrap: wrap; padding: var(--tc-space-2-5) var(--tc-space-3-5); border-top: 0.5px solid var(--tc-border-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__total { display: inline-flex; align-items: baseline; gap: var(--tc-space-2); min-width: 0; white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__total-label { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__total b { font-size: var(--tc-font-size-lg-plus); line-height: var(--tc-line-height-loose); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-strong); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__total em {
  align-self: center;
  padding: var(--tc-space-0-5) var(--tc-space-1-5);
  border-radius: var(--tc-radius-badge);
  background: var(--tc-accent-subtle);
  font-size: var(--tc-font-size-xs);
  line-height: var(--tc-line-height-tight);
  font-style: normal;
  font-weight: var(--tc-font-weight-medium);
  color: var(--tc-accent-text);
  animation: ui-bs-fade var(--tc-duration-base) var(--tc-ease-standard) both;
}
@keyframes ui-bs-fade { from { opacity: 0; } }
@keyframes ui-bs-row { from { opacity: 0; transform: translateY(-4px); } }
@keyframes ui-bs-menu { from { opacity: 0; transform: scale(0.97) translateY(-4px); } }
@container (max-width: 500px) {
:where([data-look="standard"], [data-look="standard"] *).ui-bs__fields { grid-template-columns: 1fr; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__summary { flex-wrap: wrap; row-gap: var(--tc-space-0-5); }
  /* Each line stacks: name on top, price and timing below */
:where([data-look="standard"], [data-look="standard"] *).ui-bs__row { grid-template-columns: minmax(0, 1fr); gap: var(--tc-space-0-5); padding: var(--tc-space-2-5) var(--tc-space-1) var(--tc-space-2-5) var(--tc-space-1-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__row--head { display: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__price { justify-items: stretch; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__price-main { justify-content: flex-start; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__timing { justify-self: start; margin: 0 0 0 -4px !important; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__remove { opacity: 1; margin-left: auto !important; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__actions { flex-wrap: wrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__spacer { display: none; }
}
@media (prefers-reduced-motion: reduce) {
:where([data-look="standard"], [data-look="standard"] *).ui-bs__rows-outer[data-smooth] { transition: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__row,
:where([data-look="standard"], [data-look="standard"] *).ui-bs__menu,
:where([data-look="standard"], [data-look="standard"] *).ui-bs__end { animation: none; }
}
/* Narrow card (phones): fields stack, each line stacks, buttons wrap */
@container (max-width: 500px) {
:where([data-look="clean"], [data-look="clean"] *).ui-bs__fields { grid-template-columns: 1fr; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__summary { flex-wrap: wrap; row-gap: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__row { grid-template-columns: minmax(0, 1fr); gap: var(--tc-space-0-5); padding: var(--tc-space-2-5) var(--tc-space-2) var(--tc-space-2-5) var(--tc-space-3-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__row--head { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__price { justify-items: stretch; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__price-main { justify-content: flex-start; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__num { margin-left: -2px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__timing { justify-self: start; margin: 0 0 0 -4px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__remove { opacity: 1; margin-left: auto; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__actions { flex-wrap: wrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__spacer { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__totals { flex-direction: column; align-items: stretch; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__total { justify-content: space-between; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__total--phase .ui-bs__total-label { margin-right: auto; order: -1; }
}
/* Touch screens: bigger targets, the remove button always visible */
@media (hover: none) and (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-bs__input,
:where([data-look="clean"], [data-look="clean"] *).ui-bs__select { height: 40px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__btn { height: 36px; padding: 0 var(--tc-space-3) 0 var(--tc-space-2-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__menu button { min-height: 40px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__remove { width: 36px; height: 36px; opacity: 1; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__repeat select { height: 32px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__num input { height: 32px; }
}
@media (prefers-reduced-motion: reduce) {
:where([data-look="clean"], [data-look="clean"] *).ui-bs__rows-outer[data-smooth] { transition: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__row,
:where([data-look="clean"], [data-look="clean"] *).ui-bs__menu,
:where([data-look="clean"], [data-look="clean"] *).ui-bs__end,
:where([data-look="clean"], [data-look="clean"] *).ui-bs__total em { animation: none; }
}
/* Text fields: their own box (or their wrapper) shows focus with the field ring, so no second outline */
[data-ui="bs"] input:not([type="checkbox"]):not([type="radio"]):focus-visible,
[data-ui="bs"] textarea:focus-visible,
[data-ui="bs"] [contenteditable]:focus-visible { outline: none; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="bs"] select option { background: var(--tc-surface-raised); color: var(--tc-text-primary); }
`;
}

if (!customElements.get("tc-billing-schedule")) customElements.define("tc-billing-schedule", TcBillingSchedule);

declare global {
  interface HTMLElementTagNameMap {
    "tc-billing-schedule": TcBillingSchedule;
  }
}
