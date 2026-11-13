import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { safeUrl } from "./internal/safe-url";
import { formatDate, pick } from "./internal/util";

/*
 * <tc-trust-center> – what a vendor shows a customer's security reviewer, on one card: the certifications and
 * frameworks it holds or is working towards (each with its status in words – Certified, In progress, Planned – and the
 * period and auditor), the security documents (public ones to view, the rest behind Request access, with NDA required
 * said in words), the Data Processing Agreement with Review and sign or when it was signed, and common questions as
 * disclosures. Names are text: no third-party logos, though the page may give a certification its own image.
 *   · the documents' actions are one tab stop, and so are the questions: ↑ / ↓ move, Home / End go to the ends
 *   · Request access fires a cancelable tc-request; unless prevented, the document says Requested from then on
 *   · the open questions are a property the page may own, changed through a cancelable tc-open-change
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-trust-center .certifications=${[{ id: "iso", name: "ISO 27001", status: "certified", period: "2026–2029" }]}
 *     .documents=${[{ id: "pen", title: "Penetration test summary", access: "request", nda: true }]}
 *     .dpa=${{ status: "not-signed" }}></tc-trust-center>
 */

/* Shield-check, file-text, lock, pen-line, chevron-down, arrow-right, check, clock, circle-dashed: Lucide (ISC, lucide.dev) */
const shieldIcon = svg`<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path><path d="m9 12 2 2 4-4"></path>`;
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const fileIcon = () => lucide(16, svg`<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M16 13H8"></path><path d="M16 17H8"></path>`);
const lockIcon = () => lucide(12, svg`<rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>`);
const penIcon = () => lucide(16, svg`<path d="M12 20h9"></path><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"></path>`);
const chevronIcon = () => lucide(16, svg`<path d="m6 9 6 6 6-6"></path>`);
const arrowIcon = () => lucide(14, svg`<path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path>`);
const certIcon = () => lucide(16, shieldIcon);

/** Where a certification stands */
export type TrustCertificationStatus = "certified" | "in-progress" | "planned";
export type TrustCertification = {
  id: string;
  /** Its name as text: "ISO 27001", "SOC 2 Type II" */
  name: string;
  status: TrustCertificationStatus;
  /** The period it covers, or when it's expected: "May 2026 – May 2029", "Expected Q2 2027" */
  period?: string;
  /** Who audited or issued it */
  auditor?: string;
  /** The page's own image for it (a URL); drawn beside the name, which stays as text */
  image?: string;
};
/** Who can read a document: anyone, on request, requested already, or granted to this reader */
export type TrustDocumentAccess = "public" | "request" | "requested" | "granted";
export type TrustDocument = {
  id: string;
  title: string;
  /** One line on what's in it */
  description?: string;
  access: TrustDocumentAccess;
  /** Reading it needs a signed NDA */
  nda?: boolean;
  /** Where to read it, for public and granted documents */
  href?: string;
  /** When it was last updated, as epoch ms */
  updated?: number;
};
export type TrustDpa = {
  status: "not-signed" | "signed";
  /** When it was signed, as epoch ms */
  signedAt?: number;
  /** Who signed it */
  signedBy?: string;
  /** Its version: "v3.1" */
  version?: string;
  /** Where to read it, or the signed copy */
  href?: string;
};
export type TrustFaq = { id: string; question: string; answer: string };

/** Details of the events */
export type TrustRequest = { id: string; document: TrustDocument };
export type TrustDocumentOpen = { id: string; href: string | undefined; document: TrustDocument };
export type TrustDpaSign = { dpa: TrustDpa };
export type TrustOpenChange = { open: string[]; id: string; expanded: boolean };

/** The words the element uses; any can be renamed through `labels` */
export const defaultTrustCenterLabels = {
  certifications: "Certifications and frameworks",
  documents: "Security documents",
  dpa: "Data Processing Agreement",
  faq: "Common questions",
  certified: "Certified",
  inProgress: "In progress",
  planned: "Planned",
  auditor: "Auditor",
  view: "View",
  requestAccess: "Request access",
  requested: "Requested",
  nda: "NDA required",
  public: "Public",
  updated: "Updated",
  notSigned: "Not signed",
  signed: "Signed",
  signedOn: "Signed on",
  by: "by",
  reviewAndSign: "Review and sign",
  viewSigned: "View signed copy",
  dpaNote: "The terms for how we process your data on your behalf.",
  keys: "Up and down arrows move between items",
  requestSent: "Access requested",
};
export type TrustCenterLabels = typeof defaultTrustCenterLabels;

const TONE: Record<TrustCertificationStatus, "success" | "info" | "neutral"> = { certified: "success", "in-progress": "info", planned: "neutral" };
const MARK = {
  success: () => lucide(11, svg`<path d="M20 6 9 17l-5-5"></path>`),
  info: () => lucide(11, svg`<circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path>`),
  neutral: () =>
    lucide(
      11,
      svg`<path d="M10.1 2.182a10 10 0 0 1 3.8 0"></path><path d="M13.9 21.818a10 10 0 0 1-3.8 0"></path><path d="M17.609 3.721a10 10 0 0 1 2.69 2.7"></path><path d="M2.182 13.9a10 10 0 0 1 0-3.8"></path><path d="M20.279 17.609a10 10 0 0 1-2.7 2.69"></path><path d="M21.818 10.1a10 10 0 0 1 0 3.8"></path><path d="M3.721 6.391a10 10 0 0 1 2.7-2.69"></path><path d="M6.391 20.279a10 10 0 0 1-2.69-2.7"></path>`,
    ),
};

let uidCount = 0;

/**
 * A vendor's trust center on one card – certifications with their status in words, security documents to view or
 * request (NDA noted), the Data Processing Agreement to review and sign, and common questions.
 * @tag tc-trust-center
 * @fires tc-request - Request access was pressed on a document ({ id, document }: TrustRequest); cancelable – prevented, the document isn't marked Requested
 * @fires tc-document-open - A public or granted document's View was pressed ({ id, href, document }: TrustDocumentOpen); cancelable – prevented, a link isn't followed
 * @fires tc-dpa-sign - Review and sign was pressed on the DPA ({ dpa }: TrustDpaSign)
 * @fires tc-open-change - A question was opened or closed ({ open, id, expanded }: TrustOpenChange); cancelable – prevented, `open` stays as it was
 */
export class TcTrustCenter extends TcElement {
  static override ui = "tcn";

  /** The heading */
  @property() accessor heading = "Trust center";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** Certifications and frameworks, in order */
  @property({ attribute: false }) accessor certifications: TrustCertification[] = [];
  /** Security documents, in order */
  @property({ attribute: false }) accessor documents: TrustDocument[] = [];
  /** The Data Processing Agreement; null leaves its card out */
  @property({ attribute: false }) accessor dpa: TrustDpa | null = null;
  /** Common questions and their answers */
  @property({ attribute: false }) accessor faqs: TrustFaq[] = [];
  /** The ids of the open questions. Changed by the user unless a tc-open-change listener calls preventDefault() */
  @property({ attribute: false }) accessor open: string[] = [];
  /** When the trust center was last updated, as epoch ms – shown in the header */
  @property({ type: Number, attribute: "last-updated" }) accessor lastUpdated: number | undefined = undefined;
  /** The language for dates, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;
  /** The words used, merged over defaultTrustCenterLabels */
  @property({ attribute: false }) accessor labels: Partial<TrustCenterLabels> = {};

  /** The documents requested here, marked Requested until the page's own data says otherwise */
  @state() private accessor requested: string[] = [];
  /** The tab stop in the documents' actions, by document id */
  @state() private accessor docStop = "";
  /** The tab stop in the questions, by question id */
  @state() private accessor faqStop = "";
  /** A polite announcement */
  @state() private accessor announce = "";

  private uid = `tc-tcn-${++uidCount}`;

  private get w(): TrustCenterLabels {
    return { ...defaultTrustCenterLabels, ...this.labels };
  }
  private date(ms: number) {
    return formatDate(ms, this.locale, { day: "numeric", month: "short", year: "numeric" });
  }
  private accessOf(d: TrustDocument): TrustDocumentAccess {
    return d.access === "request" && this.requested.includes(d.id) ? "requested" : d.access;
  }
  /** The documents that have an action: View, or Request access */
  private get actionable() {
    return this.documents.filter((d) => this.accessOf(d) !== "requested");
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // The tab stops stay on things that exist
    const acts = this.actionable;
    if (!acts.some((d) => d.id === this.docStop)) this.docStop = acts[0]?.id ?? "";
    if (!this.faqs.some((f) => f.id === this.faqStop)) this.faqStop = this.faqs[0]?.id ?? "";
  }

  /* ---------- Actions ---------- */

  private request(d: TrustDocument) {
    if (!this.emit<TrustRequest>("tc-request", { id: d.id, document: d }, { cancelable: true })) return;
    this.requested = [...this.requested.filter((x) => x !== d.id), d.id];
    this.announce = `${this.w.requestSent}: ${d.title}`;
    // The row loses its action: move the tab stop on, and focus with it
    const next = this.actionable[0];
    this.docStop = next?.id ?? "";
    if (next) void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-doc="${next.id}"]`)?.focus());
  }
  private openDocument(d: TrustDocument, e: Event) {
    const href = safeUrl(d.href);
    if (!this.emit<TrustDocumentOpen>("tc-document-open", { id: d.id, href, document: d }, { cancelable: true })) e.preventDefault();
  }
  private toggle(f: TrustFaq) {
    const expanded = !this.open.includes(f.id);
    const next = expanded ? [...this.open, f.id] : this.open.filter((x) => x !== f.id);
    if (!this.emit<TrustOpenChange>("tc-open-change", { open: next, id: f.id, expanded }, { cancelable: true })) return;
    this.open = next;
  }

  /* ---------- Keyboard: one tab stop per collection ---------- */

  private rove(e: KeyboardEvent, ids: string[], attr: string, set: (id: string) => void) {
    const at = (e.target as HTMLElement).closest<HTMLElement>(`[${attr}]`);
    if (!at || e.altKey || e.metaKey || e.ctrlKey) return;
    const i = ids.indexOf(at.getAttribute(attr)!);
    const to = { ArrowUp: i - 1, ArrowDown: i + 1, Home: 0, End: ids.length - 1 }[e.key];
    if (to === undefined || i < 0) return;
    e.preventDefault();
    const id = ids[Math.max(0, Math.min(ids.length - 1, to))];
    set(id);
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[${attr}="${id}"]`)?.focus());
  }
  private onDocKey = (e: KeyboardEvent) =>
    this.rove(
      e,
      this.actionable.map((d) => d.id),
      "data-doc",
      (id) => (this.docStop = id),
    );
  private onFaqKey = (e: KeyboardEvent) =>
    this.rove(
      e,
      this.faqs.map((f) => f.id),
      "data-faq",
      (id) => (this.faqStop = id),
    );

  /* ---------- Rendering ---------- */

  private statusWord(s: TrustCertificationStatus) {
    const w = this.w;
    return s === "certified" ? w.certified : s === "in-progress" ? w.inProgress : w.planned;
  }

  private renderCert(c: TrustCertification) {
    const tone = pick(TONE, c.status, "planned");
    const img = safeUrl(c.image);
    return html`<li class="ui-tcn__cert" data-id=${c.id} data-status=${c.status}>
      <span class="ui-tcn__cert-badge" aria-hidden="true">${img ? html`<img class="ui-tcn__cert-img" src=${img} alt="" />` : certIcon()}</span>
      <span class="ui-tcn__cert-main">
        <span class="ui-tcn__cert-name">${c.name}</span>
        ${c.period || c.auditor
          ? html`<span class="ui-tcn__cert-meta">${c.period ?? nothing}${c.period && c.auditor ? " · " : nothing}${c.auditor ? html`<span class="tc-sr-only">${this.w.auditor} </span>${c.auditor}` : nothing}</span>`
          : nothing}
      </span>
      <span class="ui-tcn__pill" data-tone=${tone}>${MARK[tone]()}${this.statusWord(c.status)}</span>
    </li>`;
  }

  private renderDoc(d: TrustDocument) {
    const w = this.w;
    const access = this.accessOf(d);
    const tab = this.docStop === d.id ? 0 : -1;
    const href = safeUrl(d.href);
    const name = html`<span class="tc-sr-only"> ${d.title}</span>`;
    let action;
    if (access === "requested") action = html`<span class="ui-tcn__requested">${MARK.info()}${w.requested}</span>`;
    else if (access === "request")
      action = html`<button type="button" class="tc-btn-sm ui-tcn__request" data-doc=${d.id} tabindex=${tab} @focus=${() => (this.docStop = d.id)} @click=${() => this.request(d)}>
        ${lockIcon()}${w.requestAccess}${name}
      </button>`;
    else if (href)
      action = html`<a class="tc-btn-sm ui-tcn__view" data-doc=${d.id} tabindex=${tab} href=${href} target="_blank" rel="noopener noreferrer" @focus=${() => (this.docStop = d.id)} @click=${(e: Event) => this.openDocument(d, e)}
        >${w.view}${name}${arrowIcon()}</a
      >`;
    else
      action = html`<button type="button" class="tc-btn-sm ui-tcn__view" data-doc=${d.id} tabindex=${tab} @focus=${() => (this.docStop = d.id)} @click=${(e: Event) => this.openDocument(d, e)}>
        ${w.view}${name}${arrowIcon()}
      </button>`;
    return html`<li class="ui-tcn__doc" data-id=${d.id} data-access=${access}>
      <span class="ui-tcn__doc-icon" aria-hidden="true">${fileIcon()}</span>
      <span class="ui-tcn__doc-main">
        <span class="ui-tcn__doc-title">${d.title}</span>
        ${d.description ? html`<span class="ui-tcn__doc-desc">${d.description}</span>` : nothing}
        <span class="ui-tcn__doc-meta">
          ${access === "public" ? html`<span>${w.public}</span>` : nothing}
          ${d.nda ? html`<span class="ui-tcn__nda">${lockIcon()}${w.nda}</span>` : nothing}
          ${d.updated !== undefined ? html`<span>${w.updated} ${this.date(d.updated)}</span>` : nothing}
        </span>
      </span>
      <span class="ui-tcn__doc-action">${action}</span>
    </li>`;
  }

  private renderDpa(dpa: TrustDpa) {
    const w = this.w;
    const signed = dpa.status === "signed";
    const href = safeUrl(dpa.href);
    return html`<div class="ui-tcn__dpa" data-status=${dpa.status}>
      <span class="ui-tcn__doc-icon" aria-hidden="true">${penIcon()}</span>
      <span class="ui-tcn__doc-main">
        <span class="ui-tcn__dpa-status">
          <span class="ui-tcn__pill" data-tone=${signed ? "success" : "neutral"}>${signed ? MARK.success() : MARK.neutral()}${signed ? w.signed : w.notSigned}</span>
          ${dpa.version ? html`<span class="ui-tcn__doc-meta">${dpa.version}</span>` : nothing}
        </span>
        <span class="ui-tcn__doc-desc">
          ${signed && dpa.signedAt !== undefined ? html`${w.signedOn} ${this.date(dpa.signedAt)}${dpa.signedBy ? ` ${w.by} ${dpa.signedBy}` : nothing}` : w.dpaNote}
        </span>
      </span>
      <span class="ui-tcn__doc-action">
        ${signed
          ? href
            ? html`<a class="tc-btn-sm ui-tcn__dpa-view" href=${href} target="_blank" rel="noopener noreferrer">${w.viewSigned}${arrowIcon()}</a>`
            : nothing
          : html`<button type="button" class="ui-tcn__sign" @click=${() => this.emit<TrustDpaSign>("tc-dpa-sign", { dpa })}>${w.reviewAndSign}${arrowIcon()}</button>`}
      </span>
    </div>`;
  }

  private renderFaq(f: TrustFaq) {
    const expanded = this.open.includes(f.id);
    const panel = `${this.uid}-faq-${f.id}`;
    return html`<li class="ui-tcn__faq" data-id=${f.id}>
      <h5 class="ui-tcn__faq-h">
        <button
          type="button"
          class="ui-tcn__faq-q"
          data-faq=${f.id}
          tabindex=${this.faqStop === f.id ? 0 : -1}
          aria-expanded=${expanded ? "true" : "false"}
          aria-controls=${panel}
          @focus=${() => (this.faqStop = f.id)}
          @click=${() => this.toggle(f)}
        >
          <span>${f.question}</span>${chevronIcon()}
        </button>
      </h5>
      <div class="ui-tcn__faq-a" id=${panel} ?hidden=${!expanded}>${f.answer}</div>
    </li>`;
  }

  protected override render() {
    const w = this.w;
    const id = this.uid;
    const section = (key: string, title: string, body: unknown) =>
      html`<section class="ui-tcn__section" aria-labelledby=${`${id}-${key}`}>
        <h4 class="ui-tcn__section-title" id=${`${id}-${key}`}>${title}</h4>
        ${body}
      </section>`;
    return html`
      <span class="tc-sr-only" role="status">${this.announce}</span>
      <span class="tc-sr-only" id=${`${id}-keys`}>${w.keys}</span>
      ${cardHead({
        icon: shieldIcon,
        title: this.heading,
        subtitle: this.description,
        id: `${id}-title`,
        aside: this.lastUpdated !== undefined ? html`<span class="ui-tcn__updated">${w.updated} ${this.date(this.lastUpdated)}</span>` : nothing,
      })}
      <div class="ui-tcn__card">
        ${this.certifications.length
          ? section("certs", w.certifications, html`<ul class="ui-tcn__certs">${repeat(this.certifications, (c) => c.id, (c) => this.renderCert(c))}</ul>`)
          : nothing}
        ${this.documents.length
          ? section(
              "docs",
              w.documents,
              html`<ul class="ui-tcn__docs" aria-describedby=${`${id}-keys`} @keydown=${this.onDocKey}>${repeat(this.documents, (d) => d.id, (d) => this.renderDoc(d))}</ul>`,
            )
          : nothing}
        ${this.dpa ? section("dpa", w.dpa, this.renderDpa(this.dpa)) : nothing}
        ${this.faqs.length
          ? section("faq", w.faq, html`<ul class="ui-tcn__faqs" aria-describedby=${`${id}-keys`} @keydown=${this.onFaqKey}>${repeat(this.faqs, (f) => f.id, (f) => this.renderFaq(f))}</ul>`)
          : nothing}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="tcn"] {
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="tcn"] {
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
[data-ui="tcn"] *, [data-ui="tcn"] *::before, [data-ui="tcn"] *::after { box-sizing: border-box; }
:where([data-ui="tcn"] button) { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="tcn"] button:focus-visible, [data-ui="tcn"] a:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="tcn"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="tcn"] h4, [data-ui="tcn"] h5 { margin: 0; font: inherit; }
[data-ui="tcn"] a { text-decoration: none; }
[data-ui="tcn"] svg { display: block; flex: none; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="tcn"] svg[stroke-width] { stroke-width: 1.6; }
:where([data-look="standard"], [data-look="standard"] *).ui-tcn__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-tcn__updated { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; }
/* ----- Sections ----- */
.ui-tcn__section { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-4); }
.ui-tcn__section + .ui-tcn__section { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-tcn__section-title { font-size: var(--tc-font-size-sm) !important; font-weight: var(--tc-font-weight-medium) !important; color: var(--tc-text-primary); }
/* ----- Certifications: a grid of badges ----- */
.ui-tcn__certs { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: var(--tc-space-2); }
.ui-tcn__cert { display: grid; grid-template-columns: auto minmax(0, 1fr); grid-template-rows: auto auto; align-items: center; gap: var(--tc-space-1) var(--tc-space-2); padding: var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-fill-subtle); }
.ui-tcn__cert-badge { display: grid; grid-row: 1; place-items: center; width: 32px; height: 32px; overflow: hidden; border-radius: var(--tc-radius-md); background: var(--tc-surface-raised); color: var(--tc-icon-muted); }
.ui-tcn__cert-img { display: block; width: 100%; height: 100%; object-fit: contain; }
.ui-tcn__cert-main { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-tcn__cert-name { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); }
.ui-tcn__cert-meta { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
.ui-tcn__cert .ui-tcn__pill { grid-column: 1 / -1; justify-self: start; }
/* The status pill: a tint, a mark and a word */
.ui-tcn__pill { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; }
.ui-tcn__pill[data-tone="success"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-tcn__pill[data-tone="info"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-tcn__pill[data-tone="neutral"] { background: var(--tc-fill-default); color: var(--tc-text-secondary); }
/* ----- Documents and the DPA ----- */
.ui-tcn__docs { display: grid; }
.ui-tcn__doc, .ui-tcn__dpa { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: var(--tc-space-1) var(--tc-space-3); padding: var(--tc-space-2-5) 0; }
.ui-tcn__doc + .ui-tcn__doc { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-tcn__doc-icon { display: grid; place-items: center; width: 32px; height: 32px; border-radius: var(--tc-radius-md); background: var(--tc-fill-subtle); color: var(--tc-icon-muted); }
.ui-tcn__doc-main { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-tcn__doc-title { color: var(--tc-text-primary); line-height: var(--tc-line-height-snug); }
.ui-tcn__doc-desc { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); }
.ui-tcn__doc-meta { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-0-5) var(--tc-space-3); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
.ui-tcn__nda { display: inline-flex; align-items: center; gap: var(--tc-space-1); color: var(--tc-status-warning-fg); }
.ui-tcn__doc-action { display: inline-flex; align-items: center; }
.ui-tcn__view, .ui-tcn__request, .ui-tcn__dpa-view { color: var(--tc-action-secondary-fg); }
.ui-tcn__requested { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-control-h-sm); font-size: var(--tc-font-size-sm); color: var(--tc-status-info-fg); white-space: nowrap; }
.ui-tcn__dpa { padding: 0; }
.ui-tcn__dpa-status { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); }
.ui-tcn__sign { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm) !important; border-radius: var(--tc-control-radius-sm); background: var(--tc-action-primary-bg) !important; box-shadow: var(--tc-action-primary-shadow); font-size: var(--tc-control-font-size) !important; font-weight: var(--tc-control-font-weight) !important; color: var(--tc-action-primary-fg) !important; white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-tcn__sign:hover { background: var(--tc-action-primary-bg-hover) !important; }
/* ----- Questions ----- */
.ui-tcn__faqs { display: grid; }
.ui-tcn__faq + .ui-tcn__faq { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-tcn__faq-q { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3); width: 100%; min-height: var(--tc-control-h-md); padding: var(--tc-space-2) 0 !important; color: var(--tc-text-primary); text-align: left; line-height: var(--tc-line-height-snug); }
.ui-tcn__faq-q svg { color: var(--tc-icon-muted); transition: transform var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-tcn__faq-q[aria-expanded="true"] svg { transform: rotate(180deg); }
.ui-tcn__faq-a { padding: 0 0 var(--tc-space-3); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-secondary); }
.ui-tcn__faq-a[hidden] { display: none; }
@container (max-width: 520px) {
  .ui-tcn__doc, .ui-tcn__dpa { grid-template-columns: auto minmax(0, 1fr); }
  .ui-tcn__doc-action { grid-column: 2; justify-self: start; }
  .ui-tcn__certs { grid-template-columns: minmax(0, 1fr); }
}
@media (forced-colors: active) { .ui-tcn__pill, .ui-tcn__sign { border: 1px solid CanvasText; } }
@media (prefers-reduced-motion: reduce) {
  [data-ui="tcn"] *, [data-ui="tcn"] *::before, [data-ui="tcn"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-trust-center")) customElements.define("tc-trust-center", TcTrustCenter);

declare global {
  interface HTMLElementTagNameMap {
    "tc-trust-center": TcTrustCenter;
  }
}
