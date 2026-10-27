import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { RequestController, type RequestState } from "./internal/controllers";
import type { Look } from "./internal/look";
import { ModalController } from "./internal/modal";

/*
 * <tc-terms-dialog> – a modal for agreeing to terms: terms of service, a privacy policy, an AI acceptable-use policy.
 * It opens on the text, not on a form: the version and the date it takes effect in the header, a jump list beside
 * the text (a Contents button above it when narrow), the sections with their headings, and the consents and Accept
 * at the foot. When the reader agreed to an earlier version (`previousVersion`, `changes`), a short "What's changed"
 * comes first, its items linked to their sections, and the changed sections are marked Updated.
 *   · the modal is tc-dialog's (internal/modal.ts): showModal() puts it in the top layer and makes the page inert, so
 *     Tab stays inside; the page behind doesn't scroll; focus starts on the text, so arrows and PageDown read on, and
 *     goes back to what opened it
 *   · Accept is held until every required consent is checked and, with `requireScroll`, the text has been read to the
 *     end. It stays focusable (aria-disabled) and is described by the reason, which also shows beside it; pressing it
 *     then moves focus to what's missing – the first unchecked box, or the text
 *   · Escape and the close button ask to close (tc-open-change) unless `blocking`; Decline (`canDecline`) is a
 *     cancelable tc-decline
 *   · the app owns the text and the record: tc-accept (cancelable) carries `{ version, consents }`; the app records it
 *     through `recordAcceptance` (Accept shows Saving…, a failure shows the error and Try again) or drives `pending`
 *     and `error` itself. The element never stores or sends anything. Print and Download are events
 * Standard: the header and the consents on the gray tray, the text on a white card between them. Clean: one white
 * surface divided by hairlines, the jump list marked with a thin rule, quieter text and thinner icons.
 *
 *   <tc-terms-dialog open heading="Terms of Service" version="4.0" .sections=${sections} .consents=${consents}></tc-terms-dialog>
 */

/** One section of the terms: a heading and its text */
export type TermsSection = {
  /** Stable id – the jump list links to it and a change can point at it */
  id: string;
  heading: string;
  /** Plain text (a blank line starts a paragraph, lines starting "- " make a list), or a template or DOM node for rich text */
  body?: unknown;
  /** Changed since the version the reader last agreed to: marked Updated here and in the jump list */
  changed?: boolean;
};
/** One change since the reader last agreed, in a sentence; `section` links it to the section that says more */
export type TermsChange = string | { text: string; section?: string };
/** A box to check: "I agree to the Terms" (required) or "Send me product updates" (optional) */
export type TermsConsent = {
  id: string;
  label: string;
  /** Accept waits until it's checked */
  required?: boolean;
  /** A quieter line under the label */
  description?: string;
};
/** Every consent by id, checked or not */
export type TermsConsents = Record<string, boolean>;
export type TermsAcceptDetail = { version: string; consents: TermsConsents };
export type TermsDeclineDetail = { version: string };
export type TermsConsentChangeDetail = { id: string; checked: boolean; consents: TermsConsents };
export type TermsFileDetail = { version: string };
/** Records an acceptance; the signal aborts when the dialog leaves the page. A rejection shows the error and Try again */
export type TermsRecorder = (detail: TermsAcceptDetail, signal: AbortSignal) => Promise<unknown>;
/** What's still missing before Accept, for `describeBlocked` */
export type TermsBlocked = { unread: boolean; missing: TermsConsent[] };

/* After Lucide: scroll-text – the header's icon */
const headIcon = svg`<path d="M15 12h-5"></path><path d="M15 8h-5"></path><path d="M19 17V5a2 2 0 0 0-2-2H4"></path><path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"></path>`;
const printIcon = svg`<path d="M4.5 5.75V2.5h7v3.25"></path><path d="M4.5 11.5H3.25a1.25 1.25 0 0 1-1.25-1.25v-3.25a1.25 1.25 0 0 1 1.25-1.25h9.5a1.25 1.25 0 0 1 1.25 1.25v3.25a1.25 1.25 0 0 1-1.25 1.25H11.5"></path><path d="M4.5 9.25h7v4.25h-7z"></path>`;
const downloadIcon = svg`<path d="M8 2.5v8"></path><path d="M4.75 7.5 8 10.75l3.25-3.25"></path><path d="M2.75 13.25h10.5"></path>`;
const closeIcon = svg`<path d="m4.25 4.25 7.5 7.5M11.75 4.25l-7.5 7.5"></path>`;
const checkIcon = svg`<path d="m3.5 8.25 3 3 6-6.5"></path>`;
const lockIcon = svg`<rect x="3.25" y="7" width="9.5" height="6.5" rx="1.5"></rect><path d="M5.25 7V5a2.75 2.75 0 0 1 5.5 0v2"></path>`;
const alertIcon = svg`<circle cx="8" cy="8" r="5.75"></circle><path d="M8 5v3.5M8 10.8v.05"></path>`;
const chevronIcon = svg`<path d="m4.5 6.25 3.5 3.5 3.5-3.5"></path>`;
const arrowIcon = svg`<path d="M3.5 8h9M9 4.5 12.5 8 9 11.5"></path>`;

/** How close to the bottom, in px, counts as read to the end */
const END_SLACK = 4;
/** How far below the text's top edge a heading counts as the section being read */
const READ_LINE = 40;
let instances = 0;

const icon = (look: Look, d: TemplateResult, size = 16) =>
  html`<svg viewBox="0 0 16 16" width=${size} height=${size} class="ui-tdlg__icon" stroke-width=${look === "clean" ? 1.2 : 1.5} aria-hidden="true">${d}</svg>`;

/** Plain text as paragraphs and lists: a blank line starts a paragraph, lines starting "- " or "• " are list items */
function prose(text: string) {
  return text
    .trim()
    .split(/\n\s*\n/)
    .flatMap((block) => {
      const runs: { list: boolean; lines: string[] }[] = [];
      for (const line of block.split("\n")) {
        const list = /^\s*[-•]\s+/.test(line);
        const last = runs[runs.length - 1];
        if (last && last.list === list) last.lines.push(line);
        else runs.push({ list, lines: [line] });
      }
      return runs.map((r) =>
        r.list ? html`<ul>${r.lines.map((l) => html`<li>${l.replace(/^\s*[-•]\s+/, "")}</li>`)}</ul>` : html`<p>${r.lines.join(" ").trim()}</p>`,
      );
    });
}
const body = (b: unknown) => (typeof b === "string" ? prose(b) : (b ?? nothing));
const changeOf = (c: TermsChange) => (typeof c === "string" ? { text: c, section: undefined } : c);

/** The default reason Accept is held, in a sentence */
export function describeBlocked({ unread, missing }: TermsBlocked): string {
  const boxes = missing.length === 1 ? `check “${missing[0].label}”` : `check the ${missing.length} required boxes`;
  if (unread && missing.length) return `Read to the end and ${boxes} to accept.`;
  if (unread) return "Read to the end to accept.";
  if (missing.length) return `${boxes[0].toUpperCase()}${boxes.slice(1)} to accept.`;
  return "";
}

/**
 * A modal for agreeing to terms – the text in sections with a jump list, what changed since the reader last agreed,
 * required and optional consents, and Accept held until they're met.
 * @tag tc-terms-dialog
 * @fires tc-open-change - Asks to open or close; detail `{ open }`. Cancelable – prevented, `open` stays.
 * @fires tc-accept - Accept was pressed with every requirement met; detail `{ version, consents }` (TermsAcceptDetail). Cancelable – prevented, the dialog stays open and nothing is recorded.
 * @fires tc-decline - Decline was pressed; detail `{ version }` (TermsDeclineDetail). Cancelable – not prevented, the dialog closes.
 * @fires tc-consent-change - A consent was checked or unchecked; detail `{ id, checked, consents }` (TermsConsentChangeDetail). Cancelable – prevented, `checked` stays.
 * @fires tc-print - Print was pressed; detail `{ version }`. The app prints.
 * @fires tc-download - Download was pressed; detail `{ version }`. The app provides the file.
 */
export class TcTermsDialog extends TcElement {
  static override ui = "tdlg";

  /** Whether the modal is open */
  @property({ type: Boolean, reflect: true }) accessor open = false;
  /** The title, and the dialog's accessible name */
  @property() accessor heading = "Terms of Service";
  /** The version being agreed to, e.g. "4.0"; it travels on tc-accept */
  @property() accessor version = "";
  /** When this version takes effect or was last updated, shown as given: "1 November 2026" */
  @property({ attribute: "effective-date" }) accessor effectiveDate = "";
  /** The word before the date – "Effective", or "Last updated" */
  @property({ attribute: "date-label" }) accessor dateLabel = "Effective";
  /** The version the reader agreed to before; set, the dialog asks them to agree again and says what changed */
  @property({ attribute: "previous-version" }) accessor previousVersion = "";
  /** When the reader agreed to `previousVersion`, shown as given */
  @property({ attribute: "previous-date" }) accessor previousDate = "";
  /** What changed since `previousVersion`, a sentence each, shown above the text */
  @property({ attribute: false }) accessor changes: TermsChange[] = [];
  /** The text, as sections with headings; the jump list is made from them */
  @property({ attribute: false }) accessor sections: TermsSection[] = [];
  /** The text as one template or DOM node, when it isn't in `sections`; its h2 and h3 headings make the jump list */
  @property({ attribute: false }) accessor content: unknown = undefined;
  /** The boxes to check – each required or optional */
  @property({ attribute: false }) accessor consents: TermsConsent[] = [];
  /** Which consents are checked, by id */
  @property({ attribute: false }) accessor checked: TermsConsents = {};
  /** Accept also waits until the text has been scrolled to the end */
  @property({ type: Boolean, attribute: "require-scroll" }) accessor requireScroll = false;
  /** A must-accept flow: no close button, and Escape doesn't close */
  @property({ type: Boolean, reflect: true }) accessor blocking = false;
  /** Decline is offered (default true) */
  @property({ type: Boolean, attribute: "can-decline" }) accessor canDecline = true;
  /** Shows Print, which fires tc-print */
  @property({ type: Boolean }) accessor printable = false;
  /** Shows Download, which fires tc-download */
  @property({ type: Boolean }) accessor downloadable = false;
  /** The app is recording the acceptance: Accept shows `pendingLabel` and nothing else can be pressed */
  @property({ type: Boolean, reflect: true }) accessor pending = false;
  /** The app couldn't record the acceptance: this message shows with Try again */
  @property() accessor error = "";
  /** Records the acceptance after tc-accept; while it runs Accept shows Saving…, it closes the dialog when it resolves */
  @property({ attribute: false }) accessor recordAcceptance: TermsRecorder | undefined = undefined;
  /** Says why Accept is held, in place of the built-in sentences */
  @property({ attribute: false }) accessor describeBlocked: ((blocked: TermsBlocked) => string) | undefined = undefined;
  /** The accept button */
  @property({ attribute: "accept-label" }) accessor acceptLabel = "Accept";
  /** The decline button – "Not now", or "Decline" */
  @property({ attribute: "decline-label" }) accessor declineLabel = "Not now";
  /** Accept while the acceptance is recorded */
  @property({ attribute: "pending-label" }) accessor pendingLabel = "Saving…";
  /** The error when `recordAcceptance` fails */
  @property({ attribute: "error-label" }) accessor errorLabel = "Couldn't record your acceptance. Your choices are kept.";
  /** The retry button */
  @property({ attribute: "retry-label" }) accessor retryLabel = "Try again";
  /** The jump list's name */
  @property({ attribute: "contents-label" }) accessor contentsLabel = "Contents";
  /** The heading over what changed */
  @property({ attribute: "changes-label" }) accessor changesLabel = "What's changed";
  /** The close button's name */
  @property({ attribute: "close-label" }) accessor closeLabel = "Close";

  /** @internal The text has been scrolled to the end (or fits without scrolling) */
  @state() accessor reachedEnd = false;
  /** @internal The jump-list entry being read */
  @state() accessor active = 0;
  /** @internal The narrow jump list is open */
  @state() accessor tocOpen = false;
  /** @internal Where recordAcceptance stands */
  @state() accessor recording: RequestState | null = null;
  /** @internal Accept was pressed while held: the reason is drawn as a warning */
  @state() accessor nudged = false;
  /** @internal Headings found in `content` */
  @state() accessor found: { id: string; text: string }[] = [];
  /** @internal The polite status line */
  @state() accessor said = "";

  private readonly uid = `tc-tdlg-${++instances}`;
  private readonly modal = new ModalController(this, {
    dialog: () => this.querySelector<HTMLDialogElement>(".ui-tdlg__dialog"),
    focus: () => this.docEl,
    lockScroll: true,
  });
  private readonly requests = new RequestController(this);
  private frame = 0;
  private resize: ResizeObserver | null = null;
  private mutations: MutationObserver | null = null;

  private get docEl() {
    return this.querySelector<HTMLElement>(".ui-tdlg__doc");
  }
  private get contentEl() {
    return this.querySelector<HTMLElement>(".ui-tdlg__content");
  }

  /** The changes block when there is one */
  private get changeList() {
    return this.changes.map(changeOf);
  }
  private get reaccept() {
    return !!this.previousVersion || this.changes.length > 0;
  }
  /** The jump list: What's changed, then the sections (or the content's headings) */
  private get entries() {
    const list: { id: string; text: string; n?: number; changed?: boolean }[] = [];
    if (this.changes.length) list.push({ id: `${this.uid}-changes`, text: this.changesLabel });
    if (this.sections.length) this.sections.forEach((s, i) => list.push({ id: this.sectionId(s.id), text: s.heading, n: i + 1, changed: s.changed }));
    else list.push(...this.found);
    return list;
  }
  private sectionId(id: string) {
    return `${this.uid}-s-${id}`;
  }
  private get missing() {
    return this.consents.filter((c) => c.required && !this.checked[c.id]);
  }
  private get unread() {
    return this.requireScroll && !this.reachedEnd;
  }
  private get held() {
    return this.unread || this.missing.length > 0;
  }
  private get busy() {
    return this.pending || this.recording === "pending";
  }
  private get failure() {
    return this.error || (this.recording === "failed" ? this.errorLabel : "");
  }
  private get reason() {
    const blocked = { unread: this.unread, missing: this.missing };
    return (this.describeBlocked ?? describeBlocked)(blocked);
  }
  private consentMap(): TermsConsents {
    return Object.fromEntries(this.consents.map((c) => [c.id, !!this.checked[c.id]]));
  }

  /* ---------- Open and close ---------- */

  private setOpen(open: boolean) {
    if (!this.emit("tc-open-change", { open }, { cancelable: true })) return false;
    this.open = open;
    return true;
  }

  /** Escape, the close button, the browser's own cancel: closes unless blocking or recording */
  private dismiss() {
    if (!this.open || this.blocking || this.busy) return;
    this.setOpen(false);
  }

  private onKey = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    e.preventDefault();
    if (this.tocOpen) {
      e.stopPropagation();
      this.tocOpen = false;
      this.querySelector<HTMLElement>(".ui-tdlg__toc-toggle")?.focus();
      return;
    }
    this.dismiss();
  };

  /** The browser closed the dialog on its own (a repeated Escape): ask, and show it again if it must stay */
  private onNativeClose = () => {
    if (this.modal.ownClose() || !this.open) return;
    if (!this.blocking && !this.busy && this.setOpen(false)) return;
    // A controlled host may close it in its own next render; reopen only if it's still meant to be open then
    requestAnimationFrame(() => {
      if (this.open) this.modal.reopen();
    });
  };

  /* ---------- Reading ---------- */

  private onScroll = () => {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.measure();
    });
  };

  /** Reading progress, the end, and which entry is being read */
  private measure() {
    const doc = this.docEl;
    if (!doc || !this.open) return;
    const max = doc.scrollHeight - doc.clientHeight;
    const atEnd = max - doc.scrollTop <= END_SLACK;
    const bar = this.querySelector<HTMLElement>(".ui-tdlg__progress-fill");
    if (bar) bar.style.transform = `scaleX(${max <= END_SLACK ? 1 : Math.min(1, doc.scrollTop / max)})`;
    if (atEnd && !this.reachedEnd) {
      this.reachedEnd = true;
      if (this.requireScroll && !this.missing.length) this.said = "You've reached the end. You can accept now.";
    }
    const entries = this.entries;
    const line = doc.getBoundingClientRect().top + READ_LINE;
    let at = 0;
    entries.forEach((entry, i) => {
      const el = this.querySelector(`[id="${entry.id}"]`);
      if (el && el.getBoundingClientRect().top <= line) at = i;
    });
    if (atEnd && max > END_SLACK) at = entries.length - 1;
    if (at !== this.active) this.active = Math.max(0, at);
  }

  /** The content's h2 and h3 headings, for the jump list; ones without an id get one */
  private scan() {
    const box = this.contentEl;
    if (!box || this.sections.length) {
      if (this.found.length) this.found = [];
      return;
    }
    const next = [...box.querySelectorAll<HTMLElement>("h2, h3")].map((h, i) => {
      if (!h.id) h.id = `${this.uid}-h-${i}`;
      return { id: h.id, text: h.textContent?.trim() ?? "" };
    });
    if (next.length !== this.found.length || next.some((x, i) => x.id !== this.found[i].id || x.text !== this.found[i].text)) this.found = next;
  }

  private jump(e: Event, id: string) {
    e.preventDefault();
    const target = this.querySelector<HTMLElement>(`[id="${id}"]`);
    this.tocOpen = false;
    if (!target) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  }

  /* ---------- Consents and actions ---------- */

  private toggle(c: TermsConsent, checked: boolean) {
    const consents = { ...this.consentMap(), [c.id]: checked };
    const wasHeld = this.held;
    if (this.emit<TermsConsentChangeDetail>("tc-consent-change", { id: c.id, checked, consents }, { cancelable: true })) {
      this.checked = { ...this.checked, [c.id]: checked };
      if (wasHeld && !this.held) {
        this.nudged = false;
        this.said = "You can accept now.";
      }
    } else this.requestUpdate();
  }

  /** Accept pressed while held: say why, and take focus to what's missing */
  private nudge() {
    this.nudged = true;
    this.said = this.reason;
    const box = this.missing[0];
    const target = box ? this.querySelector<HTMLElement>(`[id="${this.uid}-c-${box.id}"]`) : this.docEl;
    target?.focus();
  }

  private accept() {
    if (this.busy) return;
    if (this.held) return this.nudge();
    const detail: TermsAcceptDetail = { version: this.version, consents: this.consentMap() };
    if (this.recording === "failed") this.recording = null;
    if (!this.emit<TermsAcceptDetail>("tc-accept", detail, { cancelable: true })) return;
    // The app set `pending` in its handler: it records the acceptance and closes the dialog itself
    if (this.pending) {
      this.said = this.pendingLabel;
      return;
    }
    const record = this.recordAcceptance;
    if (!record) {
      this.setOpen(false);
      return;
    }
    void this.requests.run(
      (signal) => record(detail, signal),
      (s) => {
        this.recording = s === "requested" ? null : s;
        if (s === "pending") this.said = this.pendingLabel;
        else if (s === "failed") this.focusAfterError();
        else this.setOpen(false);
      },
    );
  }

  /** Focus left on the Accept button while it was busy; after a failure, Try again is the next thing to press */
  private focusAfterError() {
    void this.updateComplete.then(() => {
      if (this.querySelector(".ui-tdlg__accept") === document.activeElement || !this.querySelector(".ui-tdlg__dialog")?.contains(document.activeElement))
        this.querySelector<HTMLElement>(".ui-tdlg__retry")?.focus();
    });
  }

  private decline() {
    if (this.busy) return;
    if (this.emit<TermsDeclineDetail>("tc-decline", { version: this.version }, { cancelable: true })) this.setOpen(false);
  }

  /* ---------- Lifecycle ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    // A fresh reading each time it opens, and for each version
    if ((changed.has("open") && this.open) || (changed.has("version") && changed.get("version") !== undefined)) {
      this.reachedEnd = false;
      this.active = 0;
      this.tocOpen = false;
      this.nudged = false;
      if (this.recording === "failed") this.recording = null;
    }
  }

  protected override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    const opening = changed.has("open") && this.open;
    this.modal.sync(this.open);
    // Each opening starts at the top (set once it's shown – a hidden box keeps its old position)
    if (opening) {
      const doc = this.docEl;
      if (doc) doc.scrollTop = 0;
    }
    if (this.open) {
      this.observe();
      if (opening || changed.has("sections") || changed.has("content") || changed.has("changes")) {
        this.scan();
        this.measure();
      }
    } else this.unobserve();
    if (changed.has("error") && this.error) this.focusAfterError();
  }

  /** While open: the text's size (content arriving, the window resizing) and, for `content`, its headings */
  private observe() {
    const doc = this.docEl;
    if (doc && !this.resize && typeof ResizeObserver !== "undefined") {
      this.resize = new ResizeObserver(() => this.measure());
      this.resize.observe(doc);
      const inner = this.querySelector(".ui-tdlg__flow");
      if (inner) this.resize.observe(inner);
    }
    const box = this.contentEl;
    if (box && !this.mutations) {
      this.mutations = new MutationObserver(() => {
        this.scan();
        this.measure();
      });
      this.mutations.observe(box, { childList: true, subtree: true, characterData: true });
    }
  }

  private unobserve() {
    this.resize?.disconnect();
    this.resize = null;
    this.mutations?.disconnect();
    this.mutations = null;
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.unobserve();
  }

  /* ---------- Rendering ---------- */

  private tool(look: Look, cls: string, label: string, d: TemplateResult, run: () => void, disabled = false) {
    return html`<button type="button" class="ui-tdlg__tool ${cls}" aria-label=${label} title=${label} aria-disabled=${ifDefined(disabled ? "true" : undefined)} @click=${() => !disabled && run()}>${icon(look, d)}</button>`;
  }

  private head(look: Look) {
    const meta = [this.version && `Version ${this.version}`, this.effectiveDate && `${this.dateLabel} ${this.effectiveDate}`].filter(Boolean).join(" · ");
    const tools = [
      this.printable ? this.tool(look, "ui-tdlg__print", "Print", printIcon, () => this.emit<TermsFileDetail>("tc-print", { version: this.version })) : null,
      this.downloadable ? this.tool(look, "ui-tdlg__download", "Download", downloadIcon, () => this.emit<TermsFileDetail>("tc-download", { version: this.version })) : null,
    ].filter(Boolean);
    const aside = html`${this.reaccept ? html`<span class="ui-tdlg__pill">Updated</span>` : nothing}${tools.length || !this.blocking
      ? html`<span class="ui-tdlg__tools">${tools}${this.blocking ? nothing : this.tool(look, "ui-tdlg__close", this.closeLabel, closeIcon, () => this.dismiss(), this.busy)}</span>`
      : nothing}`;
    return cardHead({ icon: headIcon, title: this.heading, subtitle: meta, id: `${this.uid}-title`, level: 2, aside });
  }

  private toc(look: Look) {
    const entries = this.entries;
    if (entries.length < 2) return nothing;
    const current = entries[Math.min(this.active, entries.length - 1)];
    return html`<nav class="ui-tdlg__toc" aria-label=${this.contentsLabel} ?data-open=${this.tocOpen}>
      <button
        type="button"
        class="ui-tdlg__toc-toggle"
        aria-expanded=${this.tocOpen ? "true" : "false"}
        aria-controls=${`${this.uid}-toc`}
        @click=${() => (this.tocOpen = !this.tocOpen)}
      >
        <span class="ui-tdlg__toc-key">${this.contentsLabel}</span>
        <span class="ui-tdlg__toc-now">${current.n ? html`<span class="ui-tdlg__num">${current.n}</span> ` : nothing}${current.text}</span>
        ${icon(look, chevronIcon, 14)}
      </button>
      <p class="ui-tdlg__toc-title" aria-hidden="true">${this.contentsLabel}</p>
      <ol class="ui-tdlg__toc-list" id=${`${this.uid}-toc`}>
        ${repeat(
          entries,
          (e) => e.id,
          (e, i) => html`<li>
            <a
              class="ui-tdlg__toc-link"
              href=${`#${e.id}`}
              aria-current=${ifDefined(i === this.active ? "location" : undefined)}
              @click=${(ev: Event) => this.jump(ev, e.id)}
              >${e.n ? html`<span class="ui-tdlg__num">${e.n}</span> ` : html`<span class="ui-tdlg__num" aria-hidden="true">•</span>`}<span class="ui-tdlg__toc-text">${e.text}</span>${e.changed
                ? html`<span class="ui-tdlg__dot" title="Updated"></span><span class="ui-tdlg__sr"> (updated)</span>`
                : nothing}</a
            >
          </li>`,
        )}
      </ol>
    </nav>`;
  }

  private changesBlock(look: Look) {
    const list = this.changeList;
    if (!list.length) return nothing;
    const since = this.previousVersion
      ? `Since you agreed to version ${this.previousVersion}${this.previousDate ? ` on ${this.previousDate}` : ""}`
      : "";
    const heading = (id?: string) => this.sections.find((s) => s.id === id);
    return html`<section class="ui-tdlg__changes" aria-labelledby=${`${this.uid}-changes`}>
      <h3 class="ui-tdlg__changes-title" id=${`${this.uid}-changes`} tabindex="-1">${this.changesLabel}</h3>
      ${since ? html`<p class="ui-tdlg__since">${since}</p>` : nothing}
      <ul class="ui-tdlg__change-list">
        ${list.map((c) => {
          const s = heading(c.section);
          const n = s ? this.sections.indexOf(s) + 1 : 0;
          return html`<li class="ui-tdlg__change">
            <span class="ui-tdlg__change-text">${c.text}</span>
            ${s
              ? html`<a class="ui-tdlg__change-link" href=${`#${this.sectionId(s.id)}`} @click=${(e: Event) => this.jump(e, this.sectionId(s.id))}
                  ><span class="ui-tdlg__sr">Read section </span>${n}. ${s.heading}${icon(look, arrowIcon, 12)}</a
                >`
              : nothing}
          </li>`;
        })}
      </ul>
    </section>`;
  }

  private text() {
    if (!this.sections.length) return html`<div class="ui-tdlg__content ui-tdlg__prose">${this.content ?? nothing}</div>`;
    return repeat(
      this.sections,
      (s) => s.id,
      (s, i) => html`<section class="ui-tdlg__section" aria-labelledby=${this.sectionId(s.id)} ?data-changed=${!!s.changed}>
        <h3 class="ui-tdlg__section-title" id=${this.sectionId(s.id)} tabindex="-1">
          <span class="ui-tdlg__section-num">${i + 1}.</span> <span>${s.heading}</span>${s.changed ? html` <span class="ui-tdlg__updated">Updated</span>` : nothing}
        </h3>
        <div class="ui-tdlg__prose ui-tdlg__section-body" data-section=${s.id}>${body(s.body)}</div>
      </section>`,
    );
  }

  private consentRows(look: Look) {
    if (!this.consents.length) return nothing;
    return html`<fieldset class="ui-tdlg__consents">
      <legend class="ui-tdlg__sr">Your agreement</legend>
      ${repeat(
        this.consents,
        (c) => c.id,
        (c) => {
          const id = `${this.uid}-c-${c.id}`;
          const missing = this.nudged && c.required && !this.checked[c.id];
          return html`<div class="ui-tdlg__consent" ?data-missing=${missing}>
            <span class="ui-tdlg__box">
              <input
                type="checkbox"
                id=${id}
                .checked=${live(!!this.checked[c.id])}
                ?required=${!!c.required}
                aria-invalid=${ifDefined(missing ? "true" : undefined)}
                aria-describedby=${c.description ? `${id}-d` : nothing}
                ?disabled=${this.busy}
                @change=${(e: Event) => this.toggle(c, (e.target as HTMLInputElement).checked)}
              />${icon(look, checkIcon, 16)}
            </span>
            <label class="ui-tdlg__consent-label" for=${id}>${c.label}${c.required ? html`<span class="ui-tdlg__req" aria-hidden="true">Required</span>` : nothing}</label>
            ${c.description ? html`<p class="ui-tdlg__consent-desc" id=${`${id}-d`}>${c.description}</p>` : nothing}
          </div>`;
        },
      )}
    </fieldset>`;
  }

  private foot(look: Look) {
    const held = this.held;
    const busy = this.busy;
    const failure = this.failure;
    const why = held ? this.reason : "";
    return html`<div class="ui-tdlg__foot">
      ${this.consentRows(look)}
      ${failure
        ? html`<div class="ui-tdlg__error" role="alert">
            ${icon(look, alertIcon, 14)}<span class="ui-tdlg__error-text">${failure}</span>
            <button type="button" class="ui-tdlg__retry" @click=${() => this.accept()}>${this.retryLabel}</button>
          </div>`
        : nothing}
      <div class="ui-tdlg__bar">
        <p class="ui-tdlg__why" id=${`${this.uid}-why`} ?data-nudged=${this.nudged && held} ?hidden=${!why}>${icon(look, lockIcon, 14)}<span>${why}</span></p>
        <div class="ui-tdlg__acts">
          ${this.canDecline
            ? html`<button type="button" class="ui-tdlg__btn ui-tdlg__decline" aria-disabled=${ifDefined(busy ? "true" : undefined)} @click=${() => this.decline()}>${this.declineLabel}</button>`
            : nothing}
          <button
            type="button"
            class="ui-tdlg__btn ui-tdlg__btn--primary ui-tdlg__accept"
            aria-disabled=${ifDefined(held || busy ? "true" : undefined)}
            aria-describedby=${why ? `${this.uid}-why` : nothing}
            ?data-held=${held}
            ?data-busy=${busy}
            @click=${() => this.accept()}
          >
            ${busy ? html`<span class="ui-tdlg__spinner" aria-hidden="true"></span>${this.pendingLabel}` : this.acceptLabel}
          </button>
        </div>
      </div>
    </div>`;
  }

  protected override render() {
    const look = this.resolvedLook;
    const hasToc = this.entries.length >= 2;
    return html`<dialog
      class="ui-tdlg__dialog"
      aria-labelledby=${`${this.uid}-title`}
      aria-busy=${ifDefined(this.busy ? "true" : undefined)}
      @keydown=${this.onKey}
      @cancel=${(e: Event) => {
        e.preventDefault();
        this.dismiss();
      }}
      @close=${this.onNativeClose}
    >
      <div class="ui-tdlg__panel">
        ${this.head(look)}
        <div class="ui-tdlg__card">
          <div class="ui-tdlg__progress" aria-hidden="true"><span class="ui-tdlg__progress-fill"></span></div>
          <div class="ui-tdlg__body" ?data-toc=${hasToc}>
            ${this.toc(look)}
            <div class="ui-tdlg__doc" tabindex="0" role="region" aria-label=${`${this.heading} text`} @scroll=${this.onScroll}>
              <div class="ui-tdlg__flow">${this.changesBlock(look)}${this.text()}</div>
            </div>
          </div>
        </div>
        ${this.foot(look)}
      </div>
      <span class="ui-tdlg__sr" role="status">${this.said}</span>
    </dialog>`;
  }

  static override css = /* css */ `
[data-ui="tdlg"] { display: contents; }
[data-ui="tdlg"] > :not(dialog) { display: none; }
.ui-tdlg__dialog { box-sizing: border-box; width: min(860px, calc(100vw - 2 * var(--tc-space-4))); height: min(760px, calc(100dvh - 2 * var(--tc-space-4))); max-width: none; max-height: none; margin: auto; padding: 0; overflow: hidden; border: 0; color: var(--tc-text-primary); font-family: var(--tc-font-sans); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); text-align: left; -webkit-font-smoothing: antialiased; }
.ui-tdlg__dialog:not([open]) { display: none; }
.ui-tdlg__dialog::backdrop { background: var(--tc-scrim); }
.ui-tdlg__dialog[open] { animation: ui-tdlg-pop var(--tc-duration-moderate) var(--tc-ease-move) both; }
@keyframes ui-tdlg-pop { from { opacity: 0; transform: translateY(8px) scale(0.985); } }
:where([data-look="standard"], [data-look="standard"] *) .ui-tdlg__dialog { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); box-shadow: var(--tc-shadow-overlay); }
:where([data-look="clean"], [data-look="clean"] *) .ui-tdlg__dialog { border-radius: var(--tc-card-radius); background: var(--tc-surface-overlay); box-shadow: var(--tc-shadow-overlay); font-weight: var(--tc-font-weight-regular); }
.ui-tdlg__dialog *, .ui-tdlg__dialog *::before, .ui-tdlg__dialog *::after { box-sizing: border-box; }
:where(.ui-tdlg__dialog) :is(h2, h3, p, ul, ol, fieldset) { margin: 0; padding: 0; }
:where(.ui-tdlg__dialog) fieldset { min-width: 0; border: 0; }
:where(.ui-tdlg__dialog) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.ui-tdlg__dialog :is(button, a, input, [tabindex]):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-tdlg__dialog svg { display: block; flex: none; }
.ui-tdlg__icon { fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; }
.ui-tdlg__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

/* The panel: header, the text card (it takes the room), the foot */
.ui-tdlg__panel { display: flex; flex-direction: column; height: 100%; min-height: 0; container-type: inline-size; }
.ui-tdlg__pill { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); white-space: nowrap; }
.ui-tdlg__tools { display: inline-flex; align-items: center; gap: var(--tc-space-0-5); }
.ui-tdlg__tool { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-action-ghost-fg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-tdlg__tool:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-tdlg__tool[aria-disabled="true"] { color: var(--tc-text-disabled); cursor: not-allowed; }
.ui-tdlg__close { margin-left: var(--tc-space-1); }

.ui-tdlg__card { position: relative; display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; overflow: hidden; }
:where([data-look="standard"], [data-look="standard"] *) .ui-tdlg__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *) .ui-tdlg__card { border-top: var(--tc-hairline) solid var(--tc-divider); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
/* How far through the text: a hairline that fills */
.ui-tdlg__progress { position: absolute; top: 0; left: 0; right: 0; z-index: 2; height: 2px; overflow: hidden; pointer-events: none; }
.ui-tdlg__progress-fill { display: block; width: 100%; height: 100%; background: var(--tc-accent); transform: scaleX(0); transform-origin: left; transition: transform var(--tc-duration-fast) linear; }
:where([data-look="clean"], [data-look="clean"] *) .ui-tdlg__progress-fill { opacity: 0.7; }

.ui-tdlg__body { position: relative; display: grid; flex: 1 1 auto; min-height: 0; grid-template-rows: minmax(0, 1fr); }
.ui-tdlg__body[data-toc] { grid-template-columns: 216px minmax(0, 1fr); }

/* The jump list: a column beside the text; a Contents button above it when narrow */
.ui-tdlg__toc { position: relative; min-height: 0; overflow-y: auto; padding: var(--tc-space-4) var(--tc-space-2) var(--tc-space-4) var(--tc-space-3); border-right: var(--tc-hairline) solid var(--tc-divider); scrollbar-width: thin; scrollbar-color: var(--tc-fill-strong) transparent; }
:where([data-look="standard"], [data-look="standard"] *) .ui-tdlg__toc { background: var(--tc-surface-well); }
.ui-tdlg__toc-toggle { display: none; }
.ui-tdlg__toc-title { padding: 0 var(--tc-space-2) var(--tc-space-2); color: var(--tc-caption-color); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); }
.ui-tdlg__toc-list { display: grid; gap: var(--tc-space-0-5); list-style: none; }
.ui-tdlg__toc-link { position: relative; display: flex; align-items: baseline; gap: var(--tc-space-2); padding: var(--tc-space-1-5) var(--tc-space-2); border-radius: var(--tc-radius-md); color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); text-decoration: none; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-tdlg__toc-link:hover { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
.ui-tdlg__toc-link[aria-current] { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
:where([data-look="standard"], [data-look="standard"] *) .ui-tdlg__toc-link[aria-current] { background: var(--tc-surface-on-tray); box-shadow: var(--tc-shadow-control); }
:where([data-look="clean"], [data-look="clean"] *) .ui-tdlg__toc-link { border-radius: 0 var(--tc-radius-sm) var(--tc-radius-sm) 0; }
:where([data-look="clean"], [data-look="clean"] *) .ui-tdlg__toc-link[aria-current] { background: var(--tc-accent-subtle); box-shadow: inset 2px 0 0 var(--tc-accent); }
.ui-tdlg__num { flex: none; min-width: 1.4em; color: var(--tc-text-muted); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; }
.ui-tdlg__toc-link[aria-current] .ui-tdlg__num { color: var(--tc-accent-text); }
.ui-tdlg__toc-text { flex: 1; min-width: 0; overflow-wrap: anywhere; }
.ui-tdlg__dot { flex: none; align-self: center; width: 6px; height: 6px; border-radius: 50%; background: var(--tc-status-info-solid); }

/* The text: a readable measure, sections with numbered headings */
.ui-tdlg__doc { min-height: 0; overflow-y: auto; overscroll-behavior: contain; scroll-padding-top: var(--tc-space-4); scrollbar-width: thin; scrollbar-color: var(--tc-fill-strong) transparent; }
.ui-tdlg__doc:focus-visible { outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
.ui-tdlg__flow { display: grid; gap: var(--tc-space-6); max-width: 68ch; padding: var(--tc-space-5) var(--tc-space-6) var(--tc-space-8); }
.ui-tdlg__section { display: grid; gap: var(--tc-space-2); }
.ui-tdlg__section-title { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--tc-space-1) var(--tc-space-2); color: var(--tc-text-primary); font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-normal); letter-spacing: var(--tc-tracking-snug); scroll-margin-top: var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *) .ui-tdlg__section-title { font-weight: var(--tc-font-weight-medium); }
.ui-tdlg__section-title:focus { outline: none; }
.ui-tdlg__section-title:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); border-radius: var(--tc-radius-xs); }
.ui-tdlg__section-num { min-width: 1.25em; color: var(--tc-text-muted); font-weight: var(--tc-font-weight-medium); font-variant-numeric: tabular-nums; }
.ui-tdlg__updated { align-self: center; display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); letter-spacing: var(--tc-tracking-normal); }
.ui-tdlg__prose { display: grid; gap: var(--tc-space-2-5); color: var(--tc-text-secondary); font-size: var(--tc-font-size-lg); line-height: var(--tc-line-height-relaxed); overflow-wrap: break-word; }
.ui-tdlg__prose :is(h2, h3, h4) { margin: var(--tc-space-3) 0 0; color: var(--tc-text-primary); font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-normal); scroll-margin-top: var(--tc-space-4); }
.ui-tdlg__prose > :first-child { margin-top: 0; }
.ui-tdlg__prose :is(p, ul, ol) { margin: 0; }
.ui-tdlg__prose :is(ul, ol) { display: grid; gap: var(--tc-space-1); padding-left: var(--tc-space-5); }
.ui-tdlg__prose li::marker { color: var(--tc-text-muted); }
.ui-tdlg__prose a { color: var(--tc-accent-text); text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 2px; }
.ui-tdlg__prose :is(strong, b) { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-semibold); }

/* What's changed: first, above the text, each change linked to its section */
.ui-tdlg__changes { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-4); border-radius: var(--tc-radius-lg); background: var(--tc-status-info-bg); }
:where([data-look="clean"], [data-look="clean"] *) .ui-tdlg__changes { padding: var(--tc-space-1) 0 var(--tc-space-1) var(--tc-space-4); border-radius: 0; background: none; box-shadow: inset 2px 0 0 var(--tc-status-info-solid); }
.ui-tdlg__changes-title { color: var(--tc-text-primary); font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-normal); scroll-margin-top: var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *) .ui-tdlg__changes-title { font-weight: var(--tc-font-weight-medium); }
.ui-tdlg__changes-title:focus { outline: none; }
.ui-tdlg__since { margin-top: calc(-1 * var(--tc-space-1-5)); color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); }
.ui-tdlg__change-list { display: grid; gap: var(--tc-space-2); margin-top: var(--tc-space-1); list-style: none; }
.ui-tdlg__change { position: relative; display: grid; gap: var(--tc-space-0-5); padding-left: var(--tc-space-4); color: var(--tc-text-primary); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); }
.ui-tdlg__change::before { content: ""; position: absolute; left: var(--tc-space-0-5); top: 7px; width: 6px; height: 6px; border-radius: 50%; background: var(--tc-status-info-solid); }
.ui-tdlg__change-link { display: inline-flex; align-items: center; gap: var(--tc-space-1); justify-self: start; color: var(--tc-accent-text); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); text-decoration: none; }
.ui-tdlg__change-link:hover { text-decoration: underline; text-underline-offset: 2px; }

/* The foot: the consents, then the reason Accept is held and the actions */
.ui-tdlg__foot { display: grid; gap: var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-3) var(--tc-space-2-5); }
:where([data-look="clean"], [data-look="clean"] *) .ui-tdlg__foot { padding: var(--tc-space-4); }
.ui-tdlg__consents { display: grid; gap: var(--tc-space-2-5); }
.ui-tdlg__consent { display: grid; grid-template-columns: auto minmax(0, 1fr); column-gap: var(--tc-space-2-5); row-gap: var(--tc-space-0-5); align-items: start; }
.ui-tdlg__box { position: relative; top: 1px; display: grid; width: 18px; height: 18px; }
.ui-tdlg__box input { appearance: none; -webkit-appearance: none; width: 18px; height: 18px; margin: 0; border-radius: var(--tc-radius-xs); background: var(--tc-surface-control); box-shadow: inset 0 0 0 1px var(--tc-border-control); cursor: pointer; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-tdlg__box input:hover { box-shadow: inset 0 0 0 1px var(--tc-border-control-hover); }
.ui-tdlg__box input:checked { background: var(--tc-accent-solid); box-shadow: inset 0 0 0 1px var(--tc-accent-solid); }
.ui-tdlg__box input:disabled { cursor: not-allowed; opacity: 0.6; }
.ui-tdlg__consent[data-missing] .ui-tdlg__box input:not(:checked) { box-shadow: inset 0 0 0 1.5px var(--tc-status-warning-solid), 0 0 0 3px var(--tc-status-warning-bg); }
.ui-tdlg__box svg { position: absolute; inset: 1px; width: 16px; height: 16px; stroke: var(--tc-text-on-accent); stroke-width: 1.8; opacity: 0; transform: scale(0.6); transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-moderate) var(--tc-ease-move); pointer-events: none; }
.ui-tdlg__box input:checked + svg { opacity: 1; transform: none; }
.ui-tdlg__consent-label { min-width: 0; color: var(--tc-text-primary); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); cursor: pointer; overflow-wrap: anywhere; }
:where([data-look="standard"], [data-look="standard"] *) .ui-tdlg__consent-label { font-weight: var(--tc-font-weight-medium); }
.ui-tdlg__req { display: inline-block; margin-left: var(--tc-space-2); color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-regular); }
.ui-tdlg__consent-desc { grid-column: 2; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }

.ui-tdlg__error { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5) var(--tc-space-2); padding: var(--tc-space-2) var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
.ui-tdlg__error-text { flex: 1 1 12rem; min-width: 0; }
.ui-tdlg__retry { color: inherit; font-weight: var(--tc-font-weight-medium); text-decoration: underline; text-underline-offset: 2px; }

.ui-tdlg__bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: var(--tc-space-2) var(--tc-space-3); }
.ui-tdlg__why { display: flex; flex: 1 1 14rem; align-items: flex-start; gap: var(--tc-space-1-5); min-width: 0; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
.ui-tdlg__why[hidden] { display: none; }
.ui-tdlg__why > svg { position: relative; top: 1px; }
.ui-tdlg__why[data-nudged] { color: var(--tc-status-warning-fg); }
.ui-tdlg__acts { display: flex; flex-wrap: wrap; gap: var(--tc-space-2); margin-left: auto; }
.ui-tdlg__btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-tdlg__btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-tdlg__btn--primary { min-width: 96px; background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow, none); color: var(--tc-action-primary-fg); }
.ui-tdlg__btn--primary:hover { background: var(--tc-action-primary-bg-hover, var(--tc-action-primary-bg)); box-shadow: var(--tc-action-primary-shadow, none); }
/* Held: still focusable and pressable (it says why); drawn as unavailable */
.ui-tdlg__btn[aria-disabled="true"] { background: var(--tc-fill-default); box-shadow: none; color: var(--tc-text-muted); cursor: not-allowed; }
.ui-tdlg__btn--primary[data-busy] { background: var(--tc-action-primary-bg); color: var(--tc-action-primary-fg); cursor: progress; }
.ui-tdlg__spinner { width: 12px; height: 12px; border-radius: 50%; border: 1.5px solid currentColor; border-right-color: transparent; animation: ui-tdlg-spin var(--tc-duration-shimmer) linear infinite; }
@keyframes ui-tdlg-spin { to { transform: rotate(1turn); } }

/* Narrow: the jump list folds into a Contents button over the text; the actions take the full width */
@container (max-width: 639px) {
  .ui-tdlg__body[data-toc] { grid-template-columns: minmax(0, 1fr); grid-template-rows: auto minmax(0, 1fr); }
  .ui-tdlg__toc { overflow: visible; padding: 0; border-right: 0; border-bottom: var(--tc-hairline) solid var(--tc-divider); background: none; }
  :where([data-look="standard"], [data-look="standard"] *) .ui-tdlg__toc { background: none; }
  .ui-tdlg__toc-title { display: none; }
  .ui-tdlg__toc-toggle { display: flex; align-items: center; gap: var(--tc-space-2); width: 100%; min-height: 44px; padding: var(--tc-space-2) var(--tc-space-4); color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); }
  .ui-tdlg__toc-toggle > svg { margin-left: auto; color: var(--tc-text-muted); transition: transform var(--tc-duration-fast) var(--tc-ease-standard); }
  .ui-tdlg__toc-toggle[aria-expanded="true"] > svg { transform: rotate(180deg); }
  .ui-tdlg__toc-toggle:focus-visible { outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
  .ui-tdlg__toc-key { flex: none; color: var(--tc-text-muted); }
  .ui-tdlg__toc-now { display: flex; align-items: baseline; gap: var(--tc-space-1-5); min-width: 0; overflow: hidden; font-weight: var(--tc-font-weight-medium); white-space: nowrap; text-overflow: ellipsis; }
  .ui-tdlg__toc-list { position: absolute; top: 100%; left: var(--tc-space-2); right: var(--tc-space-2); z-index: 3; display: none; max-height: min(60vh, 320px); overflow-y: auto; padding: var(--tc-space-1-5); border-radius: var(--tc-radius-lg); background: var(--tc-surface-overlay); box-shadow: var(--tc-shadow-overlay); }
  .ui-tdlg__toc[data-open] .ui-tdlg__toc-list { display: grid; }
  .ui-tdlg__flow { padding: var(--tc-space-4) var(--tc-space-4) var(--tc-space-6); gap: var(--tc-space-5); }
  .ui-tdlg__pill { display: none; }
}
@container (max-width: 419px) {
  .ui-tdlg__acts { flex: 1 1 100%; flex-direction: column-reverse; }
  .ui-tdlg__acts > .ui-tdlg__btn { width: 100%; height: var(--tc-control-h-lg); }
}
@media (max-width: 480px) {
  .ui-tdlg__dialog { width: calc(100vw - 2 * var(--tc-space-2)); height: calc(100dvh - 2 * var(--tc-space-2)); }
}
@media (pointer: coarse) {
  .ui-tdlg__tool { width: 40px; height: 40px; }
  .ui-tdlg__btn { height: var(--tc-control-h-lg); }
}
@media (forced-colors: active) {
  .ui-tdlg__box input { border: 1px solid CanvasText; }
  .ui-tdlg__box input:checked { background: Highlight; }
  .ui-tdlg__progress-fill { background: Highlight; }
  .ui-tdlg__toc-link[aria-current] { outline: 1px solid CanvasText; }
  .ui-tdlg__btn, .ui-tdlg__pill, .ui-tdlg__updated, .ui-tdlg__changes { border: 1px solid CanvasText; }
  .ui-tdlg__btn[aria-disabled="true"] { color: GrayText; border-color: GrayText; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-tdlg__dialog, .ui-tdlg__dialog *, .ui-tdlg__dialog *::before, .ui-tdlg__dialog *::after { animation: none !important; transition: none !important; }
  .ui-tdlg__spinner { animation: ui-tdlg-spin var(--tc-duration-shimmer) linear infinite !important; }
}
`;
}

if (!customElements.get("tc-terms-dialog")) customElements.define("tc-terms-dialog", TcTermsDialog);

declare global {
  interface HTMLElementTagNameMap {
    "tc-terms-dialog": TcTermsDialog;
  }
}
