import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-document-list> – the identity and record documents on file for a person or an account: each one's type, issuing
 * country, number, reference and expiry, a status pill – Active, Verified, Expired, Flagged, Fraudulent, or the page's
 * own – and View. Numbers are masked to their last four characters until revealed, one row at a time; a reveal
 * fires a cancelable tc-revealed-change, so a page can ask for a reason or log it first. The header counts the
 * documents in each status.
 *   · the rows' buttons are one tab stop: ↑ / ↓ move between rows, ← / → between a row's buttons (Show number, View),
 *     Home / End to the first and last row
 *   · statuses carry a word and a mark as well as a tint, so colour is never the only cue
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-document-list .documents=${[{ id: "d1", type: "Passport", country: "France", number: "19FR4471K",
 *     status: "verified" }]}></tc-document-list>
 */

/** A file with lines: Lucide (ISC, lucide.dev) */
const docsIcon = svg`<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path>`;

/** The tone a status is drawn in */
export type DocumentTone = "success" | "info" | "warning" | "danger" | "neutral";
export type DocumentRecord = {
  id: string;
  /** What it is: "Passport", "National ID", "Driving licence" */
  type: string;
  /** Who issued it: "France" */
  country?: string;
  /** The document's number; masked to its last four characters unless `masked` is off or it's revealed */
  number?: string;
  /** Your own reference for the record, e.g. an evidence or file id */
  reference?: string;
  /** When it expires, as epoch ms */
  expires?: number;
  /** A key of `statusLabels`: active, verified, expired, flagged, fraudulent, or one of the page's own */
  status: string;
  /** One quiet line: "Expiry date doesn't match the issuing record" */
  note?: string;
};

/** Details of the events */
export type DocumentOpen = { document: DocumentRecord };
export type DocumentRevealedChange = { revealed: string[]; id: string; shown: boolean };

/** The statuses' names and tones used when the page gives none */
export const defaultDocumentStatuses: Record<string, { label: string; tone: DocumentTone }> = {
  verified: { label: "Verified", tone: "success" },
  active: { label: "Active", tone: "info" },
  expired: { label: "Expired", tone: "neutral" },
  flagged: { label: "Flagged", tone: "warning" },
  fraudulent: { label: "Fraudulent", tone: "danger" },
};

let uidCount = 0;

/* Status marks, eye, eye-off and arrow: Lucide (ISC, lucide.dev) */
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const MARK: Record<DocumentTone, () => ReturnType<typeof lucide>> = {
  success: () => lucide(11, svg`<path d="M20 6 9 17l-5-5"></path>`),
  info: () => lucide(11, svg`<circle cx="12" cy="12" r="4" fill="currentColor"></circle>`),
  warning: () => lucide(11, svg`<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><path d="M4 22v-7"></path>`),
  danger: () => lucide(11, svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`),
  neutral: () => lucide(11, svg`<circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path>`),
};
const eyeIcon = () => lucide(15, svg`<path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"></path><circle cx="12" cy="12" r="3"></circle>`);
const eyeOffIcon = () =>
  lucide(15, svg`<path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><path d="M14.08 14.16a3 3 0 0 1-4.16-4.16"></path><path d="m2 2 20 20"></path>`);
const arrowIcon = () => lucide(14, svg`<path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path>`);
const cardIcon = () => lucide(16, svg`<rect width="18" height="14" x="3" y="5" rx="2"></rect><circle cx="9" cy="11" r="2"></circle><path d="M6 16c.6-1.2 1.7-2 3-2s2.4.8 3 2"></path><path d="M15 10h3"></path><path d="M15 13h3"></path>`);

/** "19FR4471K" → "•••• 471K" */
const mask = (n: string) => (n.length <= 4 ? "••••" : `•••• ${n.slice(-4)}`);

/**
 * Identity and record documents with masked numbers, expiry and a status each – Active, Verified, Expired, Flagged,
 * Fraudulent or your own – counted in the header, with View per row.
 * @tag tc-document-list
 * @fires tc-open - View was pressed on a row ({ document }: DocumentOpen)
 * @fires tc-revealed-change - A number was shown or masked again ({ revealed, id, shown }: DocumentRevealedChange); cancelable – prevented, the number stays as it was
 */
export class TcDocumentList extends TcElement {
  static override ui = "dlst";

  /** The heading */
  @property() accessor heading = "Documents";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The documents, in order */
  @property({ attribute: false }) accessor documents: DocumentRecord[] = [];
  /** Statuses' names and tones, merged over the defaults (verified, active, expired, flagged, fraudulent) */
  @property({ attribute: false }) accessor statuses: Record<string, { label: string; tone: DocumentTone }> = {};
  /** Masks numbers to their last four characters until revealed; set false to show them in full */
  @property({ type: Boolean }) accessor masked = true;
  /** The ids whose numbers are shown. Changed by the user unless a tc-revealed-change listener calls preventDefault() */
  @property({ attribute: false }) accessor revealed: string[] = [];
  /** The language for expiry dates, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  /** The tab stop: a row and a button in it (0 Show number, 1 View) */
  @state() private accessor active = { r: 0, c: 1 };
  @state() private accessor announce = "";

  private uid = `tc-dlst-${++uidCount}`;

  private statusOf(key: string) {
    const known = this.statuses[key] ?? defaultDocumentStatuses[key];
    return known ?? { label: key ? key[0].toUpperCase() + key.slice(1) : "Unknown", tone: "neutral" as DocumentTone };
  }
  private canReveal(d: DocumentRecord) {
    return this.masked && !!d.number && d.number.length > 4;
  }

  private setRevealed(d: DocumentRecord, shown: boolean) {
    const next = shown ? [...this.revealed.filter((x) => x !== d.id), d.id] : this.revealed.filter((x) => x !== d.id);
    if (!this.emit<DocumentRevealedChange>("tc-revealed-change", { revealed: next, id: d.id, shown }, { cancelable: true })) return;
    this.revealed = next;
    this.announce = `${d.type} number ${shown ? "shown" : "hidden"}`;
  }

  /* ---------- Keyboard: one tab stop for the rows' buttons ---------- */

  private cols(r: number) {
    const d = this.documents[r];
    return d && this.canReveal(d) ? [0, 1] : [1];
  }
  private focusAt(r: number, c: number) {
    if (!this.documents.length) return;
    r = Math.max(0, Math.min(this.documents.length - 1, r));
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
      End: [this.documents.length - 1, c],
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    this.focusAt(move[0], move[1]);
  };

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // The tab stop stays on a row and a button that exist
    const n = this.documents.length;
    if (n && (this.active.r >= n || !this.cols(this.active.r).includes(this.active.c))) {
      const r = Math.min(this.active.r, n - 1);
      this.active = { r, c: this.cols(r).includes(this.active.c) ? this.active.c : 1 };
    }
  }

  /* ---------- Rendering ---------- */

  private renderRow(d: DocumentRecord, r: number) {
    const st = this.statusOf(d.status);
    const shown = !this.canReveal(d) || this.revealed.includes(d.id);
    const date = d.expires !== undefined ? new Intl.DateTimeFormat(this.locale, { day: "numeric", month: "short", year: "numeric" }).format(d.expires) : null;
    const name = `${d.type}${d.country ? `, ${d.country}` : ""}`;
    const tab = (c: number) => (this.active.r === r && this.active.c === c ? 0 : -1);
    return html`<li class="ui-dlst__row" data-id=${d.id} data-tone=${st.tone}>
      <span class="ui-dlst__icon" aria-hidden="true">${cardIcon()}</span>
      <div class="ui-dlst__main">
        <span class="ui-dlst__title"><span class="ui-dlst__type">${d.type}</span>${d.country ? html`<span class="ui-dlst__country"> · ${d.country}</span>` : nothing}</span>
        <span class="ui-dlst__meta">
          ${d.number
            ? html`<span class="ui-dlst__number" ?data-masked=${!shown}><span class="ui-dlst__sr">Number </span>${shown ? d.number : html`<span aria-hidden="true">${mask(d.number)}</span><span class="ui-dlst__sr">ending ${d.number.slice(-4)}, hidden</span>`}</span>`
            : nothing}
          ${d.reference ? html`<span class="ui-dlst__ref"><span class="ui-dlst__sr">Reference </span>${d.reference}</span>` : nothing}
          ${date ? html`<span class="ui-dlst__expiry">${d.status === "expired" ? "Expired" : "Expires"} ${date}</span>` : nothing}
        </span>
        ${d.note ? html`<span class="ui-dlst__note">${d.note}</span>` : nothing}
      </div>
      <span class="ui-dlst__pill" data-tone=${st.tone}>${MARK[st.tone]()}${st.label}</span>
      <span class="ui-dlst__actions">
        ${this.canReveal(d)
          ? html`<button
              type="button"
              class="ui-dlst__reveal"
              data-at=${`${r}:0`}
              tabindex=${tab(0)}
              aria-pressed=${shown ? "true" : "false"}
              aria-label=${`Show number, ${name}`}
              title=${shown ? "Hide number" : "Show number"}
              @focus=${() => (this.active = { r, c: 0 })}
              @click=${() => this.setRevealed(d, !shown)}
            >${shown ? eyeOffIcon() : eyeIcon()}</button>`
          : nothing}
        <button
          type="button"
          class="ui-dlst__view"
          data-at=${`${r}:1`}
          tabindex=${tab(1)}
          aria-label=${`View ${name}`}
          @focus=${() => (this.active = { r, c: 1 })}
          @click=${() => this.emit<DocumentOpen>("tc-open", { document: d })}
        ><span aria-hidden="true">View</span>${arrowIcon()}</button>
      </span>
    </li>`;
  }

  protected override render() {
    const id = this.uid;
    const counts = new Map<string, number>();
    for (const d of this.documents) counts.set(d.status, (counts.get(d.status) ?? 0) + 1);
    const empty = !this.documents.length;
    return html`
      <span class="ui-dlst__sr" role="status">${this.announce}</span>
      <span class="ui-dlst__sr" id=${`${id}-keys`}>Up and down arrows move between documents, left and right between a document's buttons</span>
      ${cardHead({
        icon: docsIcon,
        title: this.heading,
        subtitle: this.description,
        id: `${id}-title`,
        aside: empty
          ? nothing
          : html`<ul class="ui-dlst__counts" aria-label="Documents by status">
              ${[...counts].map(([k, n]) => {
                const st = this.statusOf(k);
                return html`<li class="ui-dlst__count" data-tone=${st.tone}><span class="ui-dlst__count-n">${n}</span> ${st.label}</li>`;
              })}
            </ul>`,
      })}
      <div class="ui-dlst__card">
        ${empty
          ? html`<p class="ui-dlst__empty">No documents on file.</p>`
          : html`<ul class="ui-dlst__list" aria-labelledby=${`${id}-title`} aria-describedby=${`${id}-keys`} @keydown=${this.onKey}>
              ${repeat(this.documents, (d) => d.id, (d, r) => this.renderRow(d, r))}
            </ul>`}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="dlst"] {
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="dlst"] {
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
[data-ui="dlst"] *, [data-ui="dlst"] *::before, [data-ui="dlst"] *::after { box-sizing: border-box; }
:where([data-ui="dlst"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="dlst"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="dlst"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="dlst"] p { margin: 0; }
[data-ui="dlst"] svg { display: block; flex: none; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="dlst"] svg[stroke-width] { stroke-width: 1.6; }
.ui-dlst__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-dlst__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* ----- The header's counts by status ----- */
.ui-dlst__counts { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--tc-space-1); max-width: 60%; }
.ui-dlst__count { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); background: var(--tc-fill-default); color: var(--tc-text-secondary); white-space: nowrap; }
.ui-dlst__count-n { font-variant-numeric: tabular-nums; color: var(--tc-text-primary); }
/* ----- A document ----- */
.ui-dlst__row { display: grid; grid-template-columns: auto minmax(0, 1fr) auto auto; align-items: center; gap: var(--tc-space-1) var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-4); }
.ui-dlst__row + .ui-dlst__row { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-dlst__icon { display: grid; place-items: center; width: 32px; height: 32px; border-radius: var(--tc-radius-md); background: var(--tc-fill-subtle); color: var(--tc-icon-muted); }
.ui-dlst__main { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-dlst__title { overflow: hidden; color: var(--tc-text-primary); line-height: var(--tc-line-height-snug); text-overflow: ellipsis; white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-dlst__type { font-weight: var(--tc-font-weight-medium); }
.ui-dlst__country { color: var(--tc-text-secondary); }
.ui-dlst__meta { display: flex; flex-wrap: wrap; gap: var(--tc-space-0-5) var(--tc-space-3); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
.ui-dlst__number, .ui-dlst__ref { font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); color: var(--tc-text-secondary); }
.ui-dlst__number[data-masked] { letter-spacing: var(--tc-tracking-caps); }
.ui-dlst__note { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); }
.ui-dlst__row[data-tone="danger"] .ui-dlst__note { color: var(--tc-status-danger-fg); }
.ui-dlst__row[data-tone="warning"] .ui-dlst__note { color: var(--tc-status-warning-fg); }
/* The status pill: a tint, a mark and a word */
.ui-dlst__pill { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; }
.ui-dlst__pill[data-tone="success"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-dlst__pill[data-tone="info"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-dlst__pill[data-tone="warning"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-dlst__pill[data-tone="danger"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-dlst__pill[data-tone="neutral"] { background: var(--tc-fill-default); color: var(--tc-text-muted); }
.ui-dlst__actions { display: inline-flex; align-items: center; gap: var(--tc-space-1); }
.ui-dlst__reveal { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-dlst__reveal:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-dlst__reveal[aria-pressed="true"] { color: var(--tc-text-primary); }
.ui-dlst__view { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm) !important; border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-font-size-sm); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-dlst__view:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-dlst__empty { padding: var(--tc-space-6) var(--tc-space-4) !important; color: var(--tc-text-muted); text-align: center; }
@container (max-width: 520px) {
  .ui-dlst__row { grid-template-columns: auto minmax(0, 1fr) auto; }
  .ui-dlst__pill { grid-column: 2; grid-row: 2; justify-self: start; }
  .ui-dlst__actions { grid-column: 3; grid-row: 1 / span 2; }
  .ui-dlst__counts { max-width: none; justify-content: flex-start; }
}
@media (forced-colors: active) { .ui-dlst__pill { border: 1px solid CanvasText; } }
@media (prefers-reduced-motion: reduce) {
  [data-ui="dlst"] *, [data-ui="dlst"] *::before, [data-ui="dlst"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-document-list")) customElements.define("tc-document-list", TcDocumentList);

declare global {
  interface HTMLElementTagNameMap {
    "tc-document-list": TcDocumentList;
  }
}
