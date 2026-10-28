import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { safeUrl } from "./internal/safe-url";
import type { SegmentOption, SegmentValueChange } from "./segmented-control";
import "./button";
import "./segmented-control";

/*
 * <tc-invoice-credit> – an invoice and its credit note stacked like sheets of paper: switch between them, or press
 * "Credit invoice" to bring the credit note forward. Pick which lines to credit, adjust the amounts, and the subtotal,
 * tax and adjustment update as you type; then issue it. The Lit port of blocks/invoice-credit.tsx – one look for both
 * looks, as the block had: a gray tray whose cards are the two sheets.
 * Keyboard: the switch is a tab list (arrows); when a sheet goes behind the other because of a control on it (Credit
 * invoice, the related invoice link), focus moves to the sheet that came forward. Enter in an amount commits it.
 *
 *   <tc-invoice-credit .lines=${[…]} currency="€" .onIssue=${(credits, total) => api.credit(credits)}></tc-invoice-credit>
 */

export type DocParty = { name: string; lines: string[] };
export type InvoiceLine = { id: string; name: string; qty: number; rate: number; tax: number; group?: string };
export type InvoiceView = "invoice" | "credit";

/** Detail of tc-view-change */
export type InvoiceViewChange = { view: InvoiceView };
/** Detail of tc-issue: the credited amount per picked line (before tax) and the total with tax */
export type InvoiceIssue = { credits: Record<string, number>; total: number };
/** Issues the credit note – may return a promise: Issuing… until it settles, and a rejection keeps the note editable */
export type InvoiceIssueHandler = (credits: Record<string, number>, total: number) => void | Promise<unknown>;

const round = (n: number) => Math.round(n * 100) / 100;
const sumOf = (l: InvoiceLine) => round((Number(l.qty) || 0) * (Number(l.rate) || 0));
let uid = 0;

/**
 * An invoice and its credit note stacked like paper – switch between them, pick lines to credit, adjust amounts and issue.
 * @tag tc-invoice-credit
 * @fires tc-view-change - The other sheet was brought forward (`{ view }`: InvoiceViewChange); cancelable – prevented, `view` stays as it was
 * @fires tc-issue - The credit note was issued (`{ credits, total }`: InvoiceIssue) – after `onIssue`'s promise resolves, when it returns one
 * @fires tc-pdf - The PDF button was pressed; detail: null
 * @fires tc-pay - "Pay online" was pressed (detail: null); cancelable – prevented, the link doesn't open
 */
export class TcInvoiceCredit extends TcElement {
  static override ui = "iv";

  /** Who sends the invoice */
  @property({ attribute: false }) accessor seller: DocParty = { name: "Lumen Labs, Inc.", lines: ["48 Harbour Street", "Bristol", "BS1 4RN", "United Kingdom"] };
  /** Who pays it */
  @property({ attribute: false }) accessor buyer: DocParty = { name: "Northwind Logistics GmbH", lines: ["Speicherstraße 12", "Hamburg", "20457", "Germany"] };
  /** The invoice's number */
  @property({ attribute: "invoice-no" }) accessor invoiceNo = "INV-2041";
  /** The credit note's number */
  @property({ attribute: "credit-no" }) accessor creditNo = "CN-0117";
  /** The date of the invoice (and of issue for the credit note), as written */
  @property({ attribute: "invoice-date" }) accessor invoiceDate = "1 Oct 2026";
  /** When the invoice is due, as written */
  @property({ attribute: "due-date" }) accessor dueDate = "31 Oct 2026";
  /** The billing period, as written */
  @property() accessor period = "1 Sep – 30 Sep 2026";
  /** The invoice's lines – lines with a `group` are listed under it */
  @property({ attribute: false }) accessor lines: InvoiceLine[] = defaultInvoiceLines;
  /** The currency sign before amounts */
  @property() accessor currency = "$";
  /** The currency code after the amount applied to the invoice */
  @property({ attribute: "currency-code" }) accessor currencyCode = "USD";
  /** Where "Pay online" goes; unset, the link only fires tc-pay */
  @property({ attribute: "pay-href" }) accessor payHref = "";
  /** The sheet in front */
  @property() accessor view: InvoiceView = "invoice";
  /** Issues the credit note, with the credited amount per line (before tax). Return a promise to show Issuing… until it
   *  settles; a rejection keeps the note editable and shows its message so it can be issued again */
  @property({ attribute: false }) accessor onIssue: InvoiceIssueHandler | undefined = undefined;

  /** Only what was changed is kept, per line id: every line – including lines passed later – starts picked, in full */
  @state() private accessor picked: Record<string, boolean> = {};
  @state() private accessor credit: Record<string, number> = {};
  /** What is being typed in an amount, while it has focus */
  @state() private accessor drafts: Record<string, string> = {};
  @state() private accessor issued = false;
  @state() private accessor issuing = false;
  @state() private accessor error: string | null = null;

  readonly #id = `tc-iv-${++uid}`;
  /** A control on the sheet that goes behind hands focus to the other sheet */
  #focusSheet: InvoiceView | null = null;

  override disconnectedCallback() {
    super.disconnectedCallback();
    // An answer that comes back after removal changes nothing
    this.issuing = false;
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("view")) this.dataset.view = this.view;
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    const target = this.#focusSheet;
    if (target && target === this.view) {
      this.#focusSheet = null;
      this.querySelector<HTMLElement>(`.ui-iv__sheet[data-doc="${target}"]`)?.focus({ preventScroll: true });
    }
  }

  #money(n: number, sign = false) {
    return `${sign && n > 0 ? "-" : ""}${this.currency}${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  #show(next: InvoiceView, moveFocus: boolean) {
    if (next === this.view) return;
    if (!this.emit<InvoiceViewChange>("tc-view-change", { view: next }, { cancelable: true })) return;
    if (moveFocus) this.#focusSheet = next;
    this.view = next;
  }

  #isPicked(l: InvoiceLine) {
    return this.picked[l.id] ?? true;
  }
  #creditOf(l: InvoiceLine) {
    return Math.min(this.credit[l.id] ?? Infinity, sumOf(l));
  }

  #issue() {
    if (this.issuing) return;
    this.error = null;
    const lines = this.lines;
    const credits = Object.fromEntries(lines.filter((l) => this.#isPicked(l)).map((l) => [l.id, this.#creditOf(l)]));
    const total = round(lines.reduce((s, l) => s + (this.#isPicked(l) ? this.#creditOf(l) * (1 + (Number(l.tax) || 0)) : 0), 0));
    let result: unknown;
    try {
      result = this.onIssue?.(credits, total);
    } catch (e) {
      result = Promise.reject(e);
    }
    const done = () => {
      this.issued = true;
      this.emit<InvoiceIssue>("tc-issue", { credits, total });
    };
    if (!(result instanceof Promise)) return done();
    this.issuing = true;
    result.then(
      () => {
        if (!this.isConnected || !this.issuing) return;
        this.issuing = false;
        done();
      },
      (e: unknown) => {
        if (!this.isConnected || !this.issuing) return;
        this.issuing = false;
        this.error = e instanceof Error && e.message ? e.message : "Couldn't issue the credit note.";
      },
    );
  }

  #commit(l: InvoiceLine, input: HTMLInputElement) {
    const draft = this.drafts[l.id] ?? input.value;
    const { [l.id]: _, ...rest } = this.drafts;
    this.drafts = rest;
    this.credit = { ...this.credit, [l.id]: Math.max(0, Math.min(sumOf(l), round(parseFloat(draft) || 0))) };
  }

  #onPay = (e: MouseEvent) => {
    if (!this.emit("tc-pay", null, { cancelable: true }) || !safeUrl(this.payHref)) e.preventDefault();
  };

  protected override render() {
    const lines = this.lines ?? [];
    const view = this.view === "credit" ? "credit" : "invoice";
    const money = (n: number, sign = false) => this.#money(n, sign);
    // Invoice totals
    const subtotal = lines.reduce((s, l) => s + sumOf(l), 0);
    const tax = lines.reduce((s, l) => s + sumOf(l) * (Number(l.tax) || 0), 0);
    const total = subtotal + tax;
    // Credit totals – only picked lines count
    const cSub = lines.reduce((s, l) => s + (this.#isPicked(l) ? this.#creditOf(l) : 0), 0);
    const cTax = lines.reduce((s, l) => s + (this.#isPicked(l) ? this.#creditOf(l) * (Number(l.tax) || 0) : 0), 0);
    const cTotal = cSub + cTax;
    const groups = [...new Set(lines.map((l) => l.group ?? ""))];
    const seller = this.seller ?? { name: "", lines: [] };
    const buyer = this.buyer ?? { name: "", lines: [] };
    const options: SegmentOption[] = [
      { value: "invoice", label: "Invoice", controls: `${this.#id}-invoice` },
      { value: "credit", label: "Credit note", controls: `${this.#id}-credit` },
    ];
    const locked = this.issued || this.issuing;

    return html`
      <div class="ui-iv__bar">
        <tc-segmented-control
          kind="tabs"
          aria-label="Document"
          .options=${options}
          .value=${view}
          @tc-value-change=${(e: CustomEvent<SegmentValueChange>) => {
            // The switch shows what this element decides: a prevented change keeps the old sheet
            e.preventDefault();
            this.#show(e.detail.value as InvoiceView, false);
          }}
        ></tc-segmented-control>
        <div class="ui-iv__actions">
          <tc-button variant="secondary" label="PDF" @click=${() => this.emit("tc-pdf", null)}>${icon("M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19.5h14")}</tc-button>
          ${view === "invoice"
            ? html`<tc-button variant="secondary" class="ui-iv__credit" label="Credit invoice" @click=${() => this.#show("credit", true)}
                >${icon("M9 14 4.5 9.5 9 5M4.5 9.5h10a5 5 0 0 1 0 10H12")}</tc-button
              >`
            : nothing}
        </div>
      </div>

      <div class="ui-iv__stack">
        ${this.#sheet(
          "invoice",
          "Invoice",
          view,
          html`<header class="ui-iv__head">
              <div>
                <p class="ui-iv__big">${money(total)}</p>
                <p class="ui-iv__due">Due ${this.dueDate}<a href=${safeUrl(this.payHref) ?? "#pay"} @click=${this.#onPay}>Pay online</a></p>
              </div>
              ${brand(seller.name)}
            </header>
            <div class="ui-iv__parties">${party("From", seller)}${party("To", buyer)}</div>
            ${terms([
              ["Invoice no", html`<span class="ui-iv__ref">${this.invoiceNo}</span>`],
              ["Invoice date", this.invoiceDate],
              ["Due date", this.dueDate],
              ["Billing period", this.period],
            ])}
            <table class="ui-iv__table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Qty</th>
                  <th class="ui-iv__num">Rate</th>
                  <th class="ui-iv__num">Tax</th>
                  <th class="ui-iv__num">Price</th>
                </tr>
              </thead>
              <tbody>
                ${groups.map(
                  (g) =>
                    html`${g ? html`<tr class="ui-iv__group"><td colspan="5">${g}</td></tr>` : nothing}${repeat(
                      lines.filter((l) => (l.group ?? "") === g),
                      (l) => l.id,
                      (l) => html`<tr ?data-indent=${!!g}>
                        <td>${l.name}</td>
                        <td>${(Number(l.qty) || 0).toLocaleString("en-US")}</td>
                        <td class="ui-iv__num">${money(Number(l.rate) || 0)}</td>
                        <td class="ui-iv__num">${Math.round((Number(l.tax) || 0) * 100)}%</td>
                        <td class="ui-iv__num">${money(sumOf(l))}</td>
                      </tr>`,
                    )}`,
                )}
              </tbody>
            </table>
            ${totals(
              [
                ["Subtotal", money(subtotal)],
                ["Tax", money(tax)],
              ],
              ["Total", money(total)],
            )}`,
        )}
        ${this.#sheet(
          "credit",
          "Credit note",
          view,
          html`<header class="ui-iv__head">
              <div>
                <p class="ui-iv__big">Credit note</p>
                <p class="ui-iv__due">
                  ${money(cTotal)} credited on ${this.invoiceDate}
                  <span class="ui-iv__live" role="status">${this.issued ? html`<span class="ui-iv__badge">Issued</span>` : nothing}</span>
                </p>
              </div>
              ${brand(seller.name)}
            </header>
            ${terms([
              ["Credit note no", html`<span class="ui-iv__ref">${this.creditNo}</span>`],
              ["Related invoice", html`<button type="button" class="ui-iv__ref" @click=${() => this.#show("invoice", true)}>${this.invoiceNo}</button>`],
              ["Billing period", this.period],
              ["Date of issue", this.invoiceDate],
            ])}
            <div class="ui-iv__tray">
              <p class="ui-iv__tray-title">Lines to credit</p>
              <div class="ui-iv__card">
                <div class="ui-iv__crow ui-iv__crow--head">
                  <span></span>
                  <span>Name</span>
                  <span class="ui-iv__num">Total</span>
                  <span class="ui-iv__num">Credit amount</span>
                </div>
                ${repeat(
                  lines,
                  (l) => l.id,
                  (l) => {
                    const max = sumOf(l);
                    const on = this.#isPicked(l);
                    const value = this.#creditOf(l);
                    const draft = this.drafts[l.id];
                    const disabled = !on || locked;
                    return html`<div class="ui-iv__crow" ?data-off=${!on}>
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked=${on ? "true" : "false"}
                        aria-label=${`Credit ${l.name}`}
                        class="ui-iv__check"
                        ?disabled=${locked}
                        @click=${() => (this.picked = { ...this.picked, [l.id]: !on })}
                      >
                        ${svg`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 12.5 4 4 8-9" /></svg>`}
                      </button>
                      <span class="ui-iv__cname">${l.name}</span>
                      <span class="ui-iv__num">${money(max)}</span>
                      <span class="ui-iv__num">
                        <label class="ui-iv__amount" ?data-disabled=${disabled}>
                          <span>${this.currency}</span>
                          <input
                            inputmode="decimal"
                            aria-label=${`Credit amount for ${l.name}`}
                            ?disabled=${disabled}
                            .value=${live(draft ?? value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}
                            @focus=${() => (this.drafts = { ...this.drafts, [l.id]: String(value) })}
                            @input=${(e: Event) => {
                              const input = e.target as HTMLInputElement;
                              const clean = input.value.replace(/[^\d.]/g, "");
                              if (clean !== input.value) input.value = clean;
                              this.drafts = { ...this.drafts, [l.id]: clean };
                            }}
                            @blur=${(e: FocusEvent) => this.#commit(l, e.target as HTMLInputElement)}
                            @keydown=${(e: KeyboardEvent) => e.key === "Enter" && !e.isComposing && (e.target as HTMLInputElement).blur()}
                          />
                        </label>
                      </span>
                    </div>`;
                  },
                )}
              </div>
            </div>
            ${totals(
              [
                ["Subtotal", money(cSub)],
                ["Tax", money(cTax)],
              ],
              ["Adjustment total", money(cTotal, true)],
              ["Applied to invoice", `${money(cTotal, true)} ${this.currencyCode}`],
            )}
            <div class="ui-iv__issue">
              ${this.error ? html`<p class="ui-iv__error" role="alert">${this.error}</p>` : nothing}
              <!-- One button for both states, so focus stays on it when the note is issued or reopened -->
              <tc-button
                class="ui-iv__issue-btn"
                size="lg"
                variant=${this.issued ? "secondary" : "primary"}
                ?disabled=${!this.issued && cTotal <= 0}
                ?loading=${this.issuing}
                label=${this.issued ? "Edit credit note" : this.issuing ? "Issuing…" : this.error ? "Try again" : "Issue credit note"}
                @click=${() => (this.issued ? (this.issued = false) : this.#issue())}
              ></tc-button>
            </div>`,
        )}
      </div>
    `;
  }

  #sheet(doc: InvoiceView, label: string, view: InvoiceView, content: TemplateResult) {
    const behind = view !== doc;
    return html`<div
      id=${`${this.#id}-${doc}`}
      role="tabpanel"
      aria-label=${label}
      tabindex="-1"
      class="ui-iv__sheet"
      data-doc=${doc}
      ?data-behind=${behind}
      aria-hidden=${ifDefined(behind ? "true" : undefined)}
      .inert=${behind}
    >
      ${content}
    </div>`;
  }

  static override css = /* css */ `
/* The block is a tray: the sheets are the cards on it */
[data-ui="iv"] {
  /* The amount is a display figure, larger than the type scale on purpose */
  --tc-iv-figure-size: 2.5rem;
  --tc-iv-figure-size-narrow: 1.875rem;
  --tc-iv-space-44px: 44px;
  --tc-iv-space-36px: 36px;
  --tc-iv-space-9px: 9px;
  --tc-iv-space-7px: 7px;
  --tc-iv-space-22px: 22px;
  --tc-iv-track--0_035em: -0.035em;
  container-type: inline-size;
  width: 100%;
  max-width: 760px;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: var(--tc-font-sans);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
[data-ui="iv"] *, [data-ui="iv"] *::before, [data-ui="iv"] *::after { box-sizing: border-box; }
[data-ui="iv"] :where(button[class^="ui-iv__"], input) { font: inherit; color: inherit; margin: 0; }
[data-ui="iv"] button[class^="ui-iv__"] { cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="iv"] :focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
/* A sheet takes focus when it comes forward – its content is the target, no ring around the whole page */
.ui-iv__sheet:focus { outline: none; }
[data-ui="iv"] svg { width: 15px; height: 15px; flex: none; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
[data-ui="iv"] p { margin: 0; }

/* ---------- Toolbar ---------- */

.ui-iv__bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-2-5); padding: var(--tc-space-2) var(--tc-space-1-5) var(--tc-space-3) var(--tc-space-2); }
.ui-iv__actions { display: flex; gap: var(--tc-space-1-5); }
.ui-iv__credit { animation: ui-iv-fade var(--tc-duration-moderate) var(--tc-ease-standard) both; }

/* ---------- Stacked sheets ---------- */

.ui-iv__stack { position: relative; isolation: isolate; display: grid; padding-top: var(--tc-space-3-5); }
.ui-iv__sheet {
  grid-area: 1 / 1;
  min-width: 0;
  padding: var(--tc-iv-space-44px) var(--tc-space-12) var(--tc-iv-space-36px);
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-on-tray);
  box-shadow: var(--tc-card-shadow);
  transition: transform var(--tc-duration-slowest) var(--tc-ease-in-out), opacity var(--tc-duration-slower) var(--tc-ease-standard);
}
/* The sheet behind: a little higher and narrower, only its top edge shows */
.ui-iv__sheet[data-behind] {
  z-index: 0;
  transform: translateY(-14px) scale(0.96);
  transform-origin: top center;
  pointer-events: none;
}
.ui-iv__sheet[data-behind] > * { opacity: 0; transition: opacity var(--tc-duration-base) var(--tc-ease-standard); }
.ui-iv__sheet:not([data-behind]) { z-index: 1; }
.ui-iv__sheet:not([data-behind]) > * { opacity: 1; transition: opacity var(--tc-duration-slow) var(--tc-ease-standard) var(--tc-duration-base); }

.ui-iv__head { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--tc-space-4); margin-bottom: var(--tc-space-10); }
/* The amount is a display figure, larger than the type scale on purpose */
.ui-iv__big { font-size: var(--tc-iv-figure-size); font-weight: var(--tc-font-weight-medium); letter-spacing: var(--tc-iv-track--0_035em); line-height: var(--tc-line-height-none); font-variant-numeric: tabular-nums; }
[data-ui="iv"] .ui-iv__due { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2) var(--tc-space-7); margin-top: var(--tc-space-3); font-size: var(--tc-font-size-lg); color: var(--tc-text-secondary); }
.ui-iv__due a { color: var(--tc-accent-text); text-decoration: none; }
.ui-iv__due a:hover { text-decoration: underline; }
/* Empty until the note is issued – out of the flow, but in the accessibility tree from the start */
.ui-iv__live:empty { position: absolute; }
.ui-iv__live { margin-left: calc(var(--tc-space-4) * -1); }
.ui-iv__badge {
  display: inline-flex;
  align-items: center;
  height: var(--tc-pill-h);
  padding: 0 var(--tc-pill-px);
  border-radius: var(--tc-pill-radius);
  background: var(--tc-status-success-bg);
  font-size: var(--tc-pill-font-size);
  font-weight: var(--tc-pill-font-weight);
  color: var(--tc-status-success-fg);
}
.ui-iv__brand { display: inline-flex; align-items: center; gap: var(--tc-iv-space-9px); padding-top: var(--tc-space-2); font-size: var(--tc-font-size-lg-plus); color: var(--tc-text-secondary); white-space: nowrap; }
.ui-iv__logo {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: conic-gradient(from 210deg, var(--tc-accent), color-mix(in srgb, var(--tc-accent) 50%, #ffffff), var(--tc-accent));
  -webkit-mask: radial-gradient(circle, transparent 4px, #000 4.5px);
  mask: radial-gradient(circle, transparent 4px, #000 4.5px);
}

[data-ui="iv"] .ui-iv__label { margin-bottom: var(--tc-space-2); font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-iv__parties { display: grid; grid-template-columns: 1fr 1fr; gap: var(--tc-space-6); margin-bottom: var(--tc-iv-space-36px); }
.ui-iv__party p:not(.ui-iv__label) { font-size: var(--tc-font-size-lg); line-height: var(--tc-line-height-relaxed); color: var(--tc-text-secondary); }
.ui-iv__terms { margin-bottom: var(--tc-iv-space-36px); }
.ui-iv__terms dl { display: grid; gap: var(--tc-iv-space-7px); margin: 0; }
.ui-iv__terms dl > div { display: grid; grid-template-columns: 140px 1fr; font-size: var(--tc-font-size-lg); }
.ui-iv__terms dt { color: var(--tc-text-muted); }
.ui-iv__terms dd { margin: 0; color: var(--tc-text-secondary); }
[data-ui="iv"] .ui-iv__ref { padding: 0; border: 0; background: none; color: var(--tc-accent-text); font-variant-numeric: tabular-nums; }
button.ui-iv__ref:hover { text-decoration: underline; }

/* Invoice table */
.ui-iv__table { width: 100%; border-collapse: collapse; font-size: var(--tc-font-size-lg); }
.ui-iv__table th { padding: 0 0 var(--tc-space-3); border-bottom: var(--tc-hairline) solid var(--tc-divider); text-align: left; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-iv__table td { padding: var(--tc-space-3-5) 0; border-bottom: var(--tc-hairline) solid var(--tc-divider); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
.ui-iv__table tr[data-indent] td:first-child { padding-left: var(--tc-space-6); }
.ui-iv__group td { color: var(--tc-text-primary); }
[data-ui="iv"] .ui-iv__num { text-align: right; }

/* Totals */
.ui-iv__totals { display: grid; gap: var(--tc-space-3); width: min(100%, 300px); margin: var(--tc-iv-space-22px) 0 0 auto; font-size: var(--tc-font-size-lg); }
.ui-iv__totals > div { display: flex; justify-content: space-between; gap: var(--tc-space-4); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-iv__totals > div span:last-child { color: var(--tc-text-secondary); }
.ui-iv__total { margin-top: var(--tc-space-1); padding-top: var(--tc-space-3-5); border-top: var(--tc-hairline) solid var(--tc-text-secondary); }
.ui-iv__totals > .ui-iv__total span { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
.ui-iv__total b { font-size: var(--tc-font-size-xl); font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-primary); }
.ui-iv__note { margin-top: calc(var(--tc-space-1) * -1); }

/* Credit lines: a tray with a card on it, like the rest of the library */
.ui-iv__tray { padding: 0 var(--tc-tray-inset) var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
.ui-iv__tray-title { padding: var(--tc-space-3-5) var(--tc-space-3) var(--tc-space-3); font-size: var(--tc-font-size-lg-plus); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
.ui-iv__card { padding: var(--tc-space-1) var(--tc-space-3-5); border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-iv__crow {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr) auto minmax(150px, 0.8fr);
  align-items: center;
  gap: var(--tc-space-3-5);
  min-height: 60px;
  border-bottom: var(--tc-hairline) solid var(--tc-divider);
  font-size: var(--tc-font-size-lg);
  transition: color var(--tc-duration-base) var(--tc-ease-standard);
}
.ui-iv__crow:last-child { border-bottom: 0; }
.ui-iv__crow--head { min-height: 46px; font-size: var(--tc-font-size-md); color: var(--tc-text-muted); }
.ui-iv__crow > .ui-iv__num { font-variant-numeric: tabular-nums; color: var(--tc-text-primary); }
/* A line that isn't credited: muted text (still readable), the empty checkbox is the cue */
.ui-iv__crow[data-off] .ui-iv__cname, .ui-iv__crow[data-off] > .ui-iv__num:nth-child(3) { color: var(--tc-text-muted); }
/* Checkbox: the control border (3:1) when empty, the accent fill with a check when picked */
[data-ui="iv"] .ui-iv__check {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: 0;
  border-radius: var(--tc-radius-sm);
  background: var(--tc-surface-control);
  box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-control);
  color: var(--tc-text-on-accent);
  transition: background-color var(--tc-duration-base) var(--tc-ease-standard), box-shadow var(--tc-duration-base) var(--tc-ease-standard);
}
.ui-iv__check svg { width: 13px; height: 13px; stroke-width: 2.4; stroke-dasharray: 20; stroke-dashoffset: 20; transition: stroke-dashoffset var(--tc-duration-moderate) var(--tc-ease-standard); }
[data-ui="iv"] .ui-iv__check[aria-checked="true"] { background: var(--tc-accent); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-accent); }
.ui-iv__check[aria-checked="true"] svg { stroke-dashoffset: 0; }
.ui-iv__check:disabled { cursor: default; opacity: 0.55; }
/* Amount: the field pattern */
.ui-iv__amount {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2);
  width: 100%;
  max-width: 220px;
  margin-left: auto;
  height: var(--tc-field-h);
  padding: 0 var(--tc-field-px);
  border-radius: var(--tc-field-radius);
  background: var(--tc-field-bg);
  box-shadow: var(--tc-field-shadow);
  transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-base) var(--tc-ease-standard);
}
.ui-iv__amount:hover:not([data-disabled]) { box-shadow: var(--tc-field-shadow-hover); }
.ui-iv__amount:focus-within { box-shadow: var(--tc-field-shadow-focus); }
.ui-iv__amount span { color: var(--tc-text-muted); }
.ui-iv__amount input { flex: 1; min-width: 0; border: 0; background: none; outline: none; text-align: right; font-size: var(--tc-field-font-size); font-variant-numeric: tabular-nums; color: var(--tc-text-primary); }
.ui-iv__amount[data-disabled] { opacity: 0.5; }

.ui-iv__issue { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: var(--tc-space-3); margin-top: var(--tc-space-6); }
.ui-iv__error { margin: 0; font-size: var(--tc-font-size-md); color: var(--tc-status-danger-fg); }

@keyframes ui-iv-fade { from { opacity: 0; } }

/* ---------- Narrow ---------- */

@container (max-width: 560px) {
  .ui-iv__sheet { padding: var(--tc-space-7) var(--tc-space-5) var(--tc-space-6); }
  .ui-iv__big { font-size: var(--tc-iv-figure-size-narrow); }
  .ui-iv__head { flex-direction: column-reverse; margin-bottom: var(--tc-space-7); }
  .ui-iv__parties { grid-template-columns: 1fr; }
  .ui-iv__terms dl > div { grid-template-columns: 120px 1fr; }
  .ui-iv__table th:nth-child(4), .ui-iv__table td:nth-child(4), .ui-iv__table th:nth-child(3), .ui-iv__table td:nth-child(3) { display: none; }
  .ui-iv__table th + th, .ui-iv__table td + td { padding-left: var(--tc-space-3); }
  .ui-iv__crow { grid-template-columns: 22px minmax(0, 1fr) minmax(110px, 0.9fr); }
  .ui-iv__crow > :nth-child(3) { display: none; }
}
/* Phone width: tighter insets, so credit amounts keep enough room to show in full */
@container (max-width: 400px) {
  .ui-iv__sheet { padding: var(--tc-space-6) var(--tc-space-4) var(--tc-space-5); }
  .ui-iv__card { padding: var(--tc-space-1) var(--tc-space-2-5); }
  .ui-iv__crow { gap: var(--tc-space-2-5); }
  .ui-iv__amount { gap: var(--tc-space-1); padding: 0 var(--tc-space-2-5); }
  .ui-iv__terms dl > div { grid-template-columns: 112px 1fr; }
}

@media (prefers-reduced-motion: reduce) {
  [data-ui="iv"] .ui-iv__stack .ui-iv__sheet, [data-ui="iv"] .ui-iv__stack .ui-iv__sheet > *, .ui-iv__check svg { transition: none; }
  .ui-iv__credit { animation: none; }
}

/* The amount field shows its focus with the field ring (above), not a second outline – also against global
   :focus-visible rules of the host page */
[data-ui="iv"] .ui-iv__amount input:focus-visible { outline: none; }
`;
}

/* ---------- Pieces ---------- */

const icon = (d: string) => svg`<svg slot="icon" viewBox="0 0 24 24" aria-hidden="true"><path d=${d} /></svg>`;

/** A neutral brand mark in the accent blue, with the company name */
const brand = (name: string) => html`<span class="ui-iv__brand"><span class="ui-iv__logo" aria-hidden="true"></span>${name}</span>`;

const party = (title: string, p: DocParty) =>
  html`<div class="ui-iv__party">
    <p class="ui-iv__label">${title}</p>
    <p>${p.name}</p>
    ${(p.lines ?? []).map((l) => html`<p>${l}</p>`)}
  </div>`;

const terms = (rows: [string, unknown][]) =>
  html`<div class="ui-iv__terms">
    <p class="ui-iv__label">Terms</p>
    <dl>
      ${rows.map(([k, v]) => html`<div><dt>${k}</dt><dd>${v}</dd></div>`)}
    </dl>
  </div>`;

const totals = (rows: [string, string][], total: [string, string], note?: [string, string]) =>
  html`<div class="ui-iv__totals">
    ${rows.map(([k, v]) => html`<div><span>${k}</span><span>${v}</span></div>`)}
    <div class="ui-iv__total"><span>${total[0]}</span><b>${total[1]}</b></div>
    ${note ? html`<div class="ui-iv__note"><span>${note[0]}</span><span>${note[1]}</span></div>` : nothing}
  </div>`;

/** The default lines: a plan, seats and metered API calls */
export const defaultInvoiceLines: InvoiceLine[] = [
  { id: "plan", name: "Growth plan", qty: 1, rate: 1250, tax: 0.2 },
  { id: "seats", name: "Extra seats", qty: 12, rate: 40, tax: 0.2 },
  { id: "api", name: "API calls (per 1k)", qty: 18420, rate: 0.42, tax: 0.2, group: "Metered usage" },
];

if (!customElements.get("tc-invoice-credit")) customElements.define("tc-invoice-credit", TcInvoiceCredit);
declare global {
  interface HTMLElementTagNameMap {
    "tc-invoice-credit": TcInvoiceCredit;
  }
}
