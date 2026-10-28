import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { pick } from "./internal/util";

/*
 * <tc-account-list> – the financial accounts linked to a person or a company: each one's institution and where it
 * sits, what kind of account it is, its identifier (IBAN-style, masked to the last four characters until revealed,
 * one row at a time), an optional amount – a balance or the volume flagged on it – and a status pill: Monitored,
 * Flagged, Under review, Closed, or the page's own. A strip of the page's own stats sits above the list ("€428K
 * flagged volume · 90 days", "3 shell entities"). A reveal fires a cancelable tc-revealed-change, so a page can ask for
 * a reason or log it first; View fires tc-open.
 *   · the rows' buttons are one tab stop: ↑ / ↓ move between rows, ← / → between a row's buttons (Show identifier,
 *     View), Home / End to the first and last row
 *   · statuses carry a word and a mark as well as a tint, so colour is never the only cue
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-account-list .accounts=${[{ id: "a1", institution: "Banque Rhône", country: "France", type: "Business operating",
 *     number: "FR7630006000011234567890189", status: "flagged" }]}></tc-account-list>
 */

/** A landmark bank building: Lucide (ISC, lucide.dev) */
const bankIcon = svg`<path d="M3 22h18"></path><path d="M6 18v-7"></path><path d="M10 18v-7"></path><path d="M14 18v-7"></path><path d="M18 18v-7"></path><path d="M12 2 20 7H4z"></path>`;

/** The tone a status is drawn in */
export type AccountTone = "success" | "info" | "warning" | "danger" | "neutral";
export type AccountRecord = {
  id: string;
  /** Who holds the account: "Banque Rhône" */
  institution: string;
  /** Where it sits: a branch or a city, "Lyon" */
  branch?: string;
  /** The country it sits in: "France" */
  country?: string;
  /** What kind of account it is: "Personal current", "Business operating", "Offshore-linked" */
  type?: string;
  /** The identifier, IBAN-style; masked to its last four characters unless `masked` is off or it's revealed */
  number?: string;
  /** A key of `statuses`: monitored, flagged, review, closed, or one of the page's own */
  status: string;
  /** An amount to show on the row, with what it is: { value: 240000, label: "Flagged · 90 days" } */
  amount?: { value: number; label?: string; currency?: string };
  /** One quiet line: "Opened three weeks before the first transfer" */
  note?: string;
};
/** A stat in the strip above the list */
export type AccountStat = { id: string; label: string; value: string; detail?: string };

/** Details of the events */
export type AccountOpen = { account: AccountRecord };
export type AccountRevealedChange = { revealed: string[]; id: string; shown: boolean };

/** The statuses' names and tones used when the page gives none */
export const defaultAccountStatuses: Record<string, { label: string; tone: AccountTone }> = {
  monitored: { label: "Monitored", tone: "info" },
  flagged: { label: "Flagged", tone: "danger" },
  review: { label: "Under review", tone: "warning" },
  closed: { label: "Closed", tone: "neutral" },
  cleared: { label: "Cleared", tone: "success" },
};

let uidCount = 0;

/* Status marks, eye, eye-off and arrow: Lucide (ISC, lucide.dev) */
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const MARK: Record<AccountTone, () => ReturnType<typeof lucide>> = {
  success: () => lucide(11, svg`<path d="M20 6 9 17l-5-5"></path>`),
  info: () => lucide(11, svg`<path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"></path><circle cx="12" cy="12" r="3"></circle>`),
  warning: () => lucide(11, svg`<circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path>`),
  danger: () => lucide(11, svg`<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><path d="M4 22v-7"></path>`),
  neutral: () => lucide(11, svg`<rect width="18" height="11" x="3" y="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>`),
};
const eyeIcon = () => lucide(15, svg`<path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"></path><circle cx="12" cy="12" r="3"></circle>`);
const eyeOffIcon = () =>
  lucide(15, svg`<path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><path d="M14.08 14.16a3 3 0 0 1-4.16-4.16"></path><path d="m2 2 20 20"></path>`);
const arrowIcon = () => lucide(14, svg`<path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path>`);
const rowIcon = () => lucide(16, svg`<rect width="20" height="14" x="2" y="5" rx="2"></rect><path d="M2 10h20"></path>`);

/** "FR7630006000011234567890189" → "FR76 •••• 0189": the country and check digits stay, as an IBAN reads */
const mask = (n: string) => {
  const s = n.replace(/\s+/g, "");
  if (s.length <= 4) return "••••";
  return /^[A-Z]{2}\d{2}/.test(s) && s.length > 8 ? `${s.slice(0, 4)} •••• ${s.slice(-4)}` : `•••• ${s.slice(-4)}`;
};
/** An identifier in groups of four, as it's printed */
const grouped = (n: string) => n.replace(/\s+/g, "").replace(/(.{4})(?=.)/g, "$1 ");

/**
 * The financial accounts linked to a person or a company – institution, type, a masked identifier shown one at a time,
 * an amount and a status each (Monitored, Flagged, Under review, Closed or your own), with the page's stats above.
 * @tag tc-account-list
 * @fires tc-open - View was pressed on a row ({ account }: AccountOpen)
 * @fires tc-revealed-change - An identifier was shown or masked again ({ revealed, id, shown }: AccountRevealedChange); cancelable – prevented, the identifier stays as it was
 */
export class TcAccountList extends TcElement {
  static override ui = "acl";

  /** The heading */
  @property() accessor heading = "Linked accounts";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The accounts, in order */
  @property({ attribute: false }) accessor accounts: AccountRecord[] = [];
  /** Stats shown in a strip above the list: { id, label, value, detail? } */
  @property({ attribute: false }) accessor stats: AccountStat[] = [];
  /** Statuses' names and tones, merged over the defaults (monitored, flagged, review, closed, cleared) */
  @property({ attribute: false }) accessor statuses: Record<string, { label: string; tone: AccountTone }> = {};
  /** Masks identifiers to their last four characters until revealed; set false to show them in full */
  @property({ type: Boolean }) accessor masked = true;
  /** The ids whose identifiers are shown. Changed by the user unless a tc-revealed-change listener calls preventDefault() */
  @property({ attribute: false }) accessor revealed: string[] = [];
  /** The currency for amounts that don't name their own, e.g. "EUR" */
  @property() accessor currency = "EUR";
  /** The language for amounts, e.g. "fr-FR"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  /** The tab stop: a row and a button in it (0 Show identifier, 1 View) */
  @state() private accessor active = { r: 0, c: 1 };
  @state() private accessor announce = "";

  private uid = `tc-acl-${++uidCount}`;

  private statusOf(key: string) {
    const known = this.statuses[key] ?? defaultAccountStatuses[key];
    return known ?? { label: key ? key[0].toUpperCase() + key.slice(1) : "Unknown", tone: "neutral" as AccountTone };
  }
  private canReveal(a: AccountRecord) {
    return this.masked && !!a.number && a.number.replace(/\s+/g, "").length > 4;
  }
  private money(a: NonNullable<AccountRecord["amount"]>) {
    try {
      return new Intl.NumberFormat(this.locale, { style: "currency", currency: a.currency ?? this.currency, maximumFractionDigits: 0 }).format(a.value);
    } catch {
      return new Intl.NumberFormat(this.locale).format(a.value);
    }
  }

  private setRevealed(a: AccountRecord, shown: boolean) {
    const next = shown ? [...this.revealed.filter((x) => x !== a.id), a.id] : this.revealed.filter((x) => x !== a.id);
    if (!this.emit<AccountRevealedChange>("tc-revealed-change", { revealed: next, id: a.id, shown }, { cancelable: true })) return;
    this.revealed = next;
    this.announce = `${a.institution} identifier ${shown ? "shown" : "hidden"}`;
  }

  /* ---------- Keyboard: one tab stop for the rows' buttons ---------- */

  private cols(r: number) {
    const a = this.accounts[r];
    return a && this.canReveal(a) ? [0, 1] : [1];
  }
  private focusAt(r: number, c: number) {
    if (!this.accounts.length) return;
    r = Math.max(0, Math.min(this.accounts.length - 1, r));
    const cols = this.cols(r);
    if (!cols.includes(c)) c = cols[cols.length - 1];
    this.active = { r, c };
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-at="${r}:${c}"]`)?.focus());
  }
  private onKey = (e: KeyboardEvent) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-at]");
    if (!btn || e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
    const [r, c] = btn.dataset.at!.split(":").map(Number);
    const cols = this.cols(r);
    const i = cols.indexOf(c);
    const moves: Record<string, [number, number]> = {
      ArrowUp: [r - 1, c],
      ArrowDown: [r + 1, c],
      ArrowLeft: [r, cols[Math.max(0, i - 1)]],
      ArrowRight: [r, cols[Math.min(cols.length - 1, i + 1)]],
      Home: [0, c],
      End: [this.accounts.length - 1, c],
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    this.focusAt(move[0], move[1]);
  };

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // The tab stop stays on a row and a button that exist
    const n = this.accounts.length;
    if (n && (this.active.r >= n || !this.cols(this.active.r).includes(this.active.c))) {
      const r = Math.min(this.active.r, n - 1);
      this.active = { r, c: this.cols(r).includes(this.active.c) ? this.active.c : 1 };
    }
  }

  /* ---------- Rendering ---------- */

  private renderRow(a: AccountRecord, r: number) {
    const st = this.statusOf(a.status);
    const shown = !this.canReveal(a) || this.revealed.includes(a.id);
    const where = [a.branch, a.country].filter(Boolean).join(", ");
    const name = `${a.institution}${a.type ? `, ${a.type}` : ""}`;
    const tab = (c: number) => (this.active.r === r && this.active.c === c ? 0 : -1);
    const tail = a.number ? a.number.replace(/\s+/g, "").slice(-4) : "";
    return html`<li class="ui-acl__row" data-id=${a.id} data-tone=${st.tone}>
      <span class="ui-acl__icon" aria-hidden="true">${rowIcon()}</span>
      <div class="ui-acl__main">
        <span class="ui-acl__title"><span class="ui-acl__inst">${a.institution}</span>${where ? html`<span class="ui-acl__where"> · ${where}</span>` : nothing}</span>
        <span class="ui-acl__meta">
          ${a.type ? html`<span class="ui-acl__type">${a.type}</span>` : nothing}
          ${a.number
            ? html`<span class="ui-acl__number" ?data-masked=${!shown}><span class="ui-acl__sr">Identifier </span>${shown
                ? grouped(a.number)
                : html`<span aria-hidden="true">${mask(a.number)}</span><span class="ui-acl__sr">ending ${tail}, hidden</span>`}</span>`
            : nothing}
        </span>
        ${a.note ? html`<span class="ui-acl__note">${a.note}</span>` : nothing}
      </div>
      ${a.amount
        ? html`<span class="ui-acl__amount"><span class="ui-acl__amount-value">${this.money(a.amount)}</span>${a.amount.label ? html`<span class="ui-acl__amount-label">${a.amount.label}</span>` : nothing}</span>`
        : html`<span class="ui-acl__amount" aria-hidden="true"></span>`}
      <span class="ui-acl__pill" data-tone=${st.tone}>${pick(MARK, st.tone, "neutral")()}${st.label}</span>
      <span class="ui-acl__actions">
        ${this.canReveal(a)
          ? html`<button
              type="button"
              class="ui-acl__reveal"
              data-at=${`${r}:0`}
              tabindex=${tab(0)}
              aria-pressed=${shown ? "true" : "false"}
              aria-label=${`Show identifier, ${name}`}
              title=${shown ? "Hide identifier" : "Show identifier"}
              @focus=${() => (this.active = { r, c: 0 })}
              @click=${() => this.setRevealed(a, !shown)}
            >${shown ? eyeOffIcon() : eyeIcon()}</button>`
          : nothing}
        <button
          type="button"
          class="ui-acl__view"
          data-at=${`${r}:1`}
          tabindex=${tab(1)}
          aria-label=${`View ${name}`}
          @focus=${() => (this.active = { r, c: 1 })}
          @click=${() => this.emit<AccountOpen>("tc-open", { account: a })}
        ><span aria-hidden="true">View</span>${arrowIcon()}</button>
      </span>
    </li>`;
  }

  protected override render() {
    const id = this.uid;
    const empty = !this.accounts.length;
    const n = this.accounts.length;
    return html`
      <span class="ui-acl__sr" role="status">${this.announce}</span>
      <span class="ui-acl__sr" id=${`${id}-keys`}>Up and down arrows move between accounts, left and right between an account's buttons</span>
      ${cardHead({
        icon: bankIcon,
        title: this.heading,
        subtitle: this.description,
        id: `${id}-title`,
        aside: empty ? nothing : html`<span class="ui-acl__count"><span class="ui-acl__count-n">${n}</span> ${n === 1 ? "account" : "accounts"}</span>`,
      })}
      <div class="ui-acl__card">
        ${this.stats.length
          ? html`<dl class="ui-acl__stats">
              ${this.stats.map(
                (s) => html`<div class="ui-acl__stat" data-id=${s.id}>
                  <dt class="ui-acl__stat-label">${s.label}</dt>
                  <dd class="ui-acl__stat-value">${s.value}</dd>
                  ${s.detail ? html`<dd class="ui-acl__stat-detail">${s.detail}</dd>` : nothing}
                </div>`,
              )}
            </dl>`
          : nothing}
        ${empty
          ? html`<p class="ui-acl__empty">No linked accounts.</p>`
          : html`<ul class="ui-acl__list" aria-labelledby=${`${id}-title`} aria-describedby=${`${id}-keys`} @keydown=${this.onKey}>
              ${repeat(this.accounts, (a) => a.id, (a, r) => this.renderRow(a, r))}
            </ul>`}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="acl"] {
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="acl"] {
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
[data-ui="acl"] *, [data-ui="acl"] *::before, [data-ui="acl"] *::after { box-sizing: border-box; }
:where([data-ui="acl"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="acl"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="acl"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="acl"] p, [data-ui="acl"] dl, [data-ui="acl"] dd { margin: 0; }
[data-ui="acl"] svg { display: block; flex: none; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="acl"] svg[stroke-width] { stroke-width: 1.6; }
.ui-acl__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-acl__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* ----- The header's count and the stats strip ----- */
.ui-acl__count { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); background: var(--tc-fill-default); color: var(--tc-text-secondary); white-space: nowrap; }
.ui-acl__count-n { font-variant-numeric: tabular-nums; color: var(--tc-text-primary); }
.ui-acl__stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-4); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-acl__stat { display: grid; align-content: start; gap: var(--tc-space-0-5); min-width: 0; }
.ui-acl__stat-label { order: 2; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-acl__stat-value { order: 1; font-size: var(--tc-font-size-xl); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-tight); letter-spacing: var(--tc-tracking-tight); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-acl__stat-detail { order: 3; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
/* ----- An account ----- */
.ui-acl__row { display: grid; grid-template-columns: auto minmax(0, 1fr) auto auto auto; align-items: center; gap: var(--tc-space-1) var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-4); }
.ui-acl__row + .ui-acl__row { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-acl__icon { display: grid; place-items: center; width: 32px; height: 32px; border-radius: var(--tc-radius-md); background: var(--tc-fill-subtle); color: var(--tc-icon-muted); }
.ui-acl__main { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-acl__title { overflow: hidden; color: var(--tc-text-primary); line-height: var(--tc-line-height-snug); text-overflow: ellipsis; white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-acl__inst { font-weight: var(--tc-font-weight-medium); }
.ui-acl__where { color: var(--tc-text-secondary); }
.ui-acl__meta { display: flex; flex-wrap: wrap; gap: var(--tc-space-0-5) var(--tc-space-3); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
.ui-acl__number { font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); color: var(--tc-text-secondary); }
.ui-acl__note { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); }
.ui-acl__row[data-tone="danger"] .ui-acl__note { color: var(--tc-status-danger-fg); }
.ui-acl__row[data-tone="warning"] .ui-acl__note { color: var(--tc-status-warning-fg); }
.ui-acl__amount { display: grid; justify-items: end; min-width: 0; }
.ui-acl__amount-value { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-acl__amount-label { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; }
/* The status pill: a tint, a mark and a word */
.ui-acl__pill { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; }
.ui-acl__pill[data-tone="success"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-acl__pill[data-tone="info"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-acl__pill[data-tone="warning"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-acl__pill[data-tone="danger"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-acl__pill[data-tone="neutral"] { background: var(--tc-fill-default); color: var(--tc-text-muted); }
.ui-acl__actions { display: inline-flex; align-items: center; gap: var(--tc-space-1); }
.ui-acl__reveal { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-acl__reveal:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-acl__reveal[aria-pressed="true"] { color: var(--tc-text-primary); }
.ui-acl__view { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm) !important; border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-font-size-sm); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-acl__view:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-acl__empty { padding: var(--tc-space-6) var(--tc-space-4) !important; color: var(--tc-text-muted); text-align: center; }
@container (max-width: 600px) {
  .ui-acl__row { grid-template-columns: auto minmax(0, 1fr) auto; }
  .ui-acl__amount { grid-column: 2; grid-row: 2; justify-items: start; }
  .ui-acl__pill { grid-column: 2; grid-row: 3; justify-self: start; }
  .ui-acl__actions { grid-column: 3; grid-row: 1 / span 3; }
}
@media (forced-colors: active) { .ui-acl__pill { border: 1px solid CanvasText; } }
@media (prefers-reduced-motion: reduce) {
  [data-ui="acl"] *, [data-ui="acl"] *::before, [data-ui="acl"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-account-list")) customElements.define("tc-account-list", TcAccountList);

declare global {
  interface HTMLElementTagNameMap {
    "tc-account-list": TcAccountList;
  }
}
