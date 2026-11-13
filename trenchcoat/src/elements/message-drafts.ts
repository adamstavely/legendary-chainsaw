import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-message-drafts> – a short text message an assistant drafted, in two to four variants (Friendly, Brief,
 * Formal…), ready to send. One tab per variant; each is edited in place, with its length in characters and in SMS
 * messages (160 per message in the GSM alphabet, 70 once it needs Unicode – an emoji, a curly quote), then Copy,
 * Send and, optionally, Open in Messages (an sms: link with the text filled in).
 *   · the tabs follow the WAI-ARIA tabs pattern – ← / → / Home / End move and pick a variant
 *   · editing fires a cancelable tc-variants-change with the variants as they will be ({ variants, id })
 *   · Send fires a cancelable tc-send ({ variant, text, to }); not prevented, the card folds into a receipt with
 *     Write another
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-message-drafts recipient="Sam Okafor" to="+1 555 0142" .variants=${[{ id: "a", tone: "Friendly", text: "…" }]}>
 *   </tc-message-drafts>
 */

export type MessageVariant = { id: string; /** Its tone, shown on its tab: Friendly, Brief, Formal */ tone: string; text: string };
/** Details of the events */
export type MessageSelectedChange = { selected: string };
export type MessageVariantsChange = { variants: MessageVariant[]; id: string };
export type MessageSend = { variant: string; text: string; to: string | undefined };
export type MessageCopy = { variant: string; text: string };

export type MessageDraftsLabels = {
  heading: string;
  to: string;
  message: string;
  copy: string;
  copied: string;
  copyFailed: string;
  send: string;
  open: string;
  sent: string;
  another: string;
  characters: string;
  unicode: string;
  empty: string;
};
export const defaultMessageDraftsLabels: MessageDraftsLabels = {
  heading: "Text message",
  to: "To",
  message: "message",
  copy: "Copy",
  copied: "Copied",
  copyFailed: "Couldn't copy",
  send: "Send",
  open: "Open in Messages",
  sent: "Sent",
  another: "Write another",
  characters: "characters",
  unicode: "Unicode",
  empty: "Write a message to send.",
};

/* ---------- SMS length ---------- */

const GSM = new Set(
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà",
);
/** In the GSM alphabet's extension table: each takes two of a message's 160 places */
const GSM_EXTENDED = new Set("^{}\\[~]|€\f");

export type SmsLength = { characters: number; segments: number; unicode: boolean; perSegment: number };

/** How long a text message is: characters, how many SMS messages it takes, and whether it needs Unicode */
export function smsLength(text: string): SmsLength {
  const chars = [...text];
  let units = 0;
  let unicode = false;
  for (const c of chars) {
    if (GSM.has(c)) units += 1;
    else if (GSM_EXTENDED.has(c)) units += 2;
    else {
      unicode = true;
      break;
    }
  }
  if (unicode) {
    // UCS-2 counts UTF-16 code units: an emoji takes two
    const n = text.length;
    return { characters: chars.length, unicode, segments: n === 0 ? 0 : n <= 70 ? 1 : Math.ceil(n / 67), perSegment: n <= 70 ? 70 : 67 };
  }
  return { characters: chars.length, unicode, segments: units === 0 ? 0 : units <= 160 ? 1 : Math.ceil(units / 153), perSegment: units <= 160 ? 160 : 153 };
}

/** An sms: link for `to` with the text filled in */
export function smsHref(to: string | undefined, text: string) {
  const number = (to ?? "").replace(/[^\d+]/g, "");
  return `sms:${number}?body=${encodeURIComponent(text)}`;
}

let uidCount = 0;

/* message-square-text, copy, check, send, external-link: Lucide (ISC, lucide.dev) */
const messageIcon = svg`<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path><path d="M13 8H7"></path><path d="M17 12H7"></path>`;
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const copyIcon = () => lucide(15, svg`<rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>`);
const checkIcon = () => lucide(15, svg`<path d="M20 6 9 17l-5-5"></path>`);
const sendIcon = () =>
  lucide(15, svg`<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"></path><path d="m21.854 2.147-10.94 10.939"></path>`);
const openIcon = () => lucide(15, svg`<path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>`);

/**
 * Text-message drafts in two to four variants – edit in place with the SMS length, then Copy, Send or Open in
 * Messages.
 * @tag tc-message-drafts
 * @fires tc-selected-change - Another variant was picked ({ selected }: MessageSelectedChange); cancelable – prevented, `selected` stays as it was
 * @fires tc-variants-change - A variant's text was edited ({ variants, id }: MessageVariantsChange); cancelable – prevented, `variants` stays as it was
 * @fires tc-send - Send was pressed ({ variant, text, to }: MessageSend); cancelable – prevented, the draft stays open
 * @fires tc-copy-text - Copy was pressed ({ variant, text }: MessageCopy); cancelable – prevented, nothing is copied here
 */
export class TcMessageDrafts extends TcElement {
  static override ui = "mdr";

  /** The heading */
  @property() accessor heading = defaultMessageDraftsLabels.heading;
  /** Who it's for, by name */
  @property() accessor recipient: string | undefined = undefined;
  /** Their number – used in Send's event and the sms: link */
  @property() accessor to: string | undefined = undefined;
  /** The drafts, two to four; more are left out */
  @property({ attribute: false }) accessor variants: MessageVariant[] = [];
  /** The variant shown, by id. Changed by the user unless tc-selected-change is prevented */
  @property() accessor selected: string | undefined = undefined;
  /** Shows Open in Messages, an sms: link with the text filled in */
  @property({ type: Boolean, attribute: "open-link" }) accessor openLink = false;
  /** Draft or sent – Send moves it to sent; set it back to "draft" to write again */
  @property({ reflect: true }) accessor status: "draft" | "sent" = "draft";
  /** Words to use instead of the defaults */
  @property({ attribute: false }) accessor labels: Partial<MessageDraftsLabels> = {};

  @state() private accessor copied: "" | "ok" | "failed" = "";
  @state() private accessor sentText = "";
  @state() private accessor announce = "";

  private uid = `tc-mdr-${++uidCount}`;
  private copyTimer: ReturnType<typeof setTimeout> | undefined;

  private get l(): MessageDraftsLabels {
    return { ...defaultMessageDraftsLabels, ...this.labels };
  }
  private get shown() {
    return this.variants.slice(0, 4);
  }
  private get current(): MessageVariant | undefined {
    const shown = this.shown;
    return shown.find((v) => v.id === this.selected) ?? shown[0];
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("selected") || changed.has("variants")) this.copied = "";
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.copyTimer);
  }

  /* ---------- Actions ---------- */

  private pick(id: string, focus = false) {
    if (id !== this.current?.id) {
      if (!this.emit<MessageSelectedChange>("tc-selected-change", { selected: id }, { cancelable: true })) return;
      this.selected = id;
    }
    if (focus) void this.updateComplete.then(() => this.querySelector<HTMLElement>(`#${this.uid}-tab-${this.shown.findIndex((v) => v.id === this.current?.id)}`)?.focus());
  }

  private edit(text: string) {
    const v = this.current;
    if (!v) return;
    const variants = this.variants.map((x) => (x.id === v.id ? { ...x, text } : x));
    if (!this.emit<MessageVariantsChange>("tc-variants-change", { variants, id: v.id }, { cancelable: true })) {
      this.requestUpdate();
      return;
    }
    this.variants = variants;
  }

  private async copy() {
    const v = this.current;
    if (!v) return;
    if (!this.emit<MessageCopy>("tc-copy-text", { variant: v.id, text: v.text }, { cancelable: true })) return;
    let ok = false;
    try {
      await navigator.clipboard.writeText(v.text);
      ok = true;
    } catch {
      ok = false;
    }
    this.copied = ok ? "ok" : "failed";
    this.announce = ok ? `${this.l.copied}: ${v.tone}` : this.l.copyFailed;
    clearTimeout(this.copyTimer);
    this.copyTimer = setTimeout(() => (this.copied = ""), 2000);
  }

  private send() {
    const v = this.current;
    if (!v || !v.text.trim()) return;
    if (!this.emit<MessageSend>("tc-send", { variant: v.id, text: v.text, to: this.to }, { cancelable: true })) return;
    this.sentText = v.text;
    this.status = "sent";
    this.announce = `${this.l.sent}${this.recipient ? ` to ${this.recipient}` : ""}`;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-mdr__another")?.focus());
  }

  private another() {
    this.status = "draft";
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-mdr__text")?.focus());
  }

  /* ---------- Rendering ---------- */

  private renderTabs(current: MessageVariant) {
    const shown = this.shown;
    return html`<div class="ui-mdr__tabs" role="tablist" aria-label=${`${this.heading} variants`}>
      ${shown.map(
        (v, i) => html`<button
          type="button"
          role="tab"
          class="ui-mdr__tab"
          id=${`${this.uid}-tab-${i}`}
          aria-selected=${v.id === current.id ? "true" : "false"}
          aria-controls=${`${this.uid}-panel`}
          tabindex=${v.id === current.id ? 0 : -1}
          @click=${() => this.pick(v.id)}
          @keydown=${(e: KeyboardEvent) => {
            const n = shown.length;
            const to = e.key === "ArrowRight" ? (i + 1) % n : e.key === "ArrowLeft" ? (i + n - 1) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
            if (to < 0) return;
            e.preventDefault();
            this.pick(shown[to].id, true);
          }}
        >
          ${v.tone}
        </button>`,
      )}
    </div>`;
  }

  private renderMeta(text: string) {
    const l = this.l;
    const s = smsLength(text);
    const words = `${s.characters} ${l.characters} · ${s.segments} ${s.segments === 1 ? l.message : `${l.message}s`}${s.unicode ? ` (${l.unicode})` : ""}`;
    return html`<span class="ui-mdr__meta" id=${`${this.uid}-meta`} ?data-long=${s.segments > 1}>${words}</span>`;
  }

  private renderDraft(current: MessageVariant) {
    const l = this.l;
    const empty = !current.text.trim();
    const copyLabel = this.copied === "ok" ? l.copied : this.copied === "failed" ? l.copyFailed : l.copy;
    return html`
      ${this.shown.length > 1 ? this.renderTabs(current) : nothing}
      <div class="ui-mdr__panel" id=${`${this.uid}-panel`} role=${this.shown.length > 1 ? "tabpanel" : "group"} aria-labelledby=${this.shown.length > 1 ? `${this.uid}-tab-${this.shown.indexOf(current)}` : `${this.uid}-title`}>
        <label class="tc-sr-only" for=${`${this.uid}-text`}>${current.tone} ${l.message}</label>
        <textarea
          id=${`${this.uid}-text`}
          class="ui-mdr__text"
          rows="4"
          placeholder=${l.empty}
          aria-describedby=${`${this.uid}-meta`}
          .value=${live(current.text)}
          @input=${(e: Event) => this.edit((e.target as HTMLTextAreaElement).value)}
        ></textarea>
        <div class="ui-mdr__foot">
          ${this.renderMeta(current.text)}
          <span class="ui-mdr__actions">
            <button type="button" class="ui-mdr__btn" ?disabled=${empty} data-copied=${ifDefined(this.copied || undefined)} @click=${() => void this.copy()}>
              ${this.copied === "ok" ? checkIcon() : copyIcon()}${copyLabel}
            </button>
            ${this.openLink && !empty ? html`<a class="ui-mdr__btn" href=${smsHref(this.to, current.text)}>${openIcon()}${l.open}</a>` : nothing}
            <button type="button" class="ui-mdr__btn ui-mdr__btn--primary" ?disabled=${empty} @click=${() => this.send()}>${sendIcon()}${l.send}</button>
          </span>
        </div>
      </div>
    `;
  }

  private renderSent() {
    const l = this.l;
    return html`<div class="ui-mdr__sent">
      <p class="ui-mdr__sent-head">${checkIcon()}<span>${l.sent}${this.recipient ? ` to ${this.recipient}` : ""}</span></p>
      <p class="ui-mdr__bubble">${this.sentText || this.current?.text}</p>
      <button type="button" class="ui-mdr__btn ui-mdr__another" @click=${() => this.another()}>${l.another}</button>
    </div>`;
  }

  protected override render() {
    const l = this.l;
    const current = this.current;
    const who = [this.recipient, this.to].filter(Boolean).join(" · ");
    return html`
      <span class="tc-sr-only" role="status">${this.announce}</span>
      ${cardHead({ icon: messageIcon, title: this.heading, subtitle: who ? `${l.to} ${who}` : undefined, id: `${this.uid}-title` })}
      <div class="ui-mdr__card">${this.status === "sent" ? this.renderSent() : current ? this.renderDraft(current) : html`<p class="ui-mdr__none">${l.empty}</p>`}</div>
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="clean"], [data-look="standard"] *, [data-look="clean"] *)[data-ui="mdr"] {
  position: relative;
  box-sizing: border-box;
  display: block;
  width: 100%;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="mdr"] { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdr__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="mdr"] { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-mdr__card { border-top: var(--tc-hairline) solid var(--tc-divider); }
[data-ui="mdr"] *, [data-ui="mdr"] *::before, [data-ui="mdr"] *::after { box-sizing: border-box; }
:where([data-ui="mdr"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="mdr"] :is(button, a, textarea):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-ui="mdr"]) p { margin: 0; }
[data-ui="mdr"] svg { display: block; flex: none; }
/* ----- Tabs ----- */
.ui-mdr__tabs { display: flex; gap: var(--tc-space-1); overflow-x: auto; margin: var(--tc-space-3) var(--tc-space-3) 0; padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); scrollbar-width: none; }
.ui-mdr__tab { flex: 1 0 auto; height: calc(var(--tc-control-h-sm) - 2 * var(--tc-seg-pad)); padding: 0 var(--tc-space-3); border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-mdr__tab[aria-selected="true"] { background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdr__tab[aria-selected="true"] { font-weight: var(--tc-font-weight-strong); }
/* ----- The draft ----- */
.ui-mdr__panel { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-3); }
.ui-mdr__text { display: block; width: 100%; min-height: calc(4 * var(--tc-line-height-normal) * 1em); padding: var(--tc-space-2-5) var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font: inherit; color: var(--tc-text-primary); resize: vertical; outline: none; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-mdr__text:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-mdr__text:focus-visible { box-shadow: var(--tc-field-shadow-focus); outline: none; }
.ui-mdr__text::placeholder { color: var(--tc-text-placeholder); }
.ui-mdr__foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-2); }
.ui-mdr__meta { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-mdr__meta[data-long] { color: var(--tc-status-warning-fg); }
.ui-mdr__actions { display: flex; flex-wrap: wrap; gap: var(--tc-space-2); margin-left: auto; }
.ui-mdr__btn { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-font-size-sm); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); text-decoration: none; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-mdr__btn:hover:not(:disabled) { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-mdr__btn[data-copied="ok"] { color: var(--tc-status-success-fg); }
.ui-mdr__btn--primary { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-mdr__btn--primary:hover:not(:disabled) { background: var(--tc-action-primary-bg-hover); box-shadow: var(--tc-action-primary-shadow); }
.ui-mdr__btn:disabled { background: var(--tc-fill-default); box-shadow: none; color: var(--tc-text-disabled); cursor: not-allowed; }
/* ----- Sent ----- */
.ui-mdr__sent { display: grid; justify-items: start; gap: var(--tc-space-2-5); padding: var(--tc-space-3) var(--tc-space-4); animation: ui-mdr-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-mdr__sent-head { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-status-success-fg); }
.ui-mdr__bubble { max-width: 100%; padding: var(--tc-space-2) var(--tc-space-3); border-radius: var(--tc-radius-xl); background: var(--tc-accent-subtle); color: var(--tc-text-primary); white-space: pre-wrap; overflow-wrap: anywhere; }
.ui-mdr__none { padding: var(--tc-space-6) var(--tc-space-4); color: var(--tc-text-muted); text-align: center; }
@container (max-width: 360px) {
  .ui-mdr__actions { width: 100%; }
  .ui-mdr__actions .ui-mdr__btn { flex: 1; justify-content: center; }
}
@keyframes ui-mdr-in { from { opacity: 0; transform: translateY(-2px); } }
@media (forced-colors: active) {
  .ui-mdr__tab[aria-selected="true"] { outline: 2px solid Highlight; }
  .ui-mdr__bubble { border: 1px solid CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="mdr"] *, [data-ui="mdr"] *::before, [data-ui="mdr"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-message-drafts")) customElements.define("tc-message-drafts", TcMessageDrafts);

declare global {
  interface HTMLElementTagNameMap {
    "tc-message-drafts": TcMessageDrafts;
  }
}
