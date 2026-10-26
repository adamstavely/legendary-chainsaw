import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { FocusRescueController, SmoothHeightController, rescueFocus } from "./internal/controllers";

/*
 * <tc-email-draft> – the Lit port of src/components/email-draft.tsx: an agent-written email waiting for review.
 * The record it's about sits on the gray tray (reference, status, amount); the white card holds the email: a
 * recipient you can switch, an attachment you can remove, tone variants, inline editing, Discard and Send. Sending or
 * discarding folds the card into a one-line receipt – with Undo when it can be honoured; heights glide throughout.
 * Clean has no tray – one white card: the record heads the card, then the email, and the last row holds who wrote
 * it, its state, Discard and Send.
 *
 *   <tc-email-draft reference="INV-4471" .contacts=${contacts} .tones=${tones} .onSend=${(email) => api.send(email)}>
 *   </tc-email-draft>
 *
 * `contacts`, `tones` and `attachment` stay the source of truth: the recipient and tone are picked by email and id,
 * so when the lists change the draft follows them (falling back to the first one). A recipient or tone change fires
 * a cancelable `tc-recipient-change` ({ email, contact }) or `tc-tone-change` ({ tone }): call preventDefault() to
 * control `recipient` or `tone` yourself. `onSend` sends the email – return a promise to keep the card in its sending
 * state until it settles. Discard fires `tc-discard`; Undo fires `tc-undo` ({ action }).
 */

export type DraftContact = { name: string; email: string };

export type DraftTone = { id: string; label: string; body: (contact: DraftContact) => string };

export type DraftEmail = { to: DraftContact; body: string; attachment: string | null };
export type DraftRecipientChange = { email: string; contact: DraftContact };
export type DraftToneChange = { tone: string };
export type DraftUndo = { action: "send" | "discard" };

const defaultContacts: DraftContact[] = [
  { name: "Jonas Weber", email: "jonas@northwind.io" },
  { name: "Lena Hart", email: "lena@northwind.io" },
  { name: "Finance team", email: "billing@northwind.io" },
];

const first = (c: DraftContact) => c.name.split(" ")[0];
// Stands in when `contacts` is empty: shown as such, and nothing can be sent to it
const noRecipient: DraftContact = { name: "No recipient", email: "" };
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Warns once per page (not per instance) when sending is simulated because onSend is missing
let warnedSimulatedSend = false;
const warnSimulatedSend = () => {
  if (warnedSimulatedSend) return;
  warnedSimulatedSend = true;
  console.warn(
    "EmailDraft: no onSend handler – simulating sending. Pass `demo` to keep the simulation, or `onSend` to wire it up. The simulation will be off by default in the next major version.",
  );
};

const defaultTones: DraftTone[] = [
  {
    id: "friendly",
    label: "Friendly",
    body: (c) =>
      `Hi ${first(c)}, a heads-up that your Growth plan renews on October 9 for $8,900 a year. If you'd like to add seats or switch to monthly billing, you can review the quote here:`,
  },
  {
    id: "short",
    label: "Short",
    body: (c) => `Hi ${first(c)}, your Growth plan renews on October 9 ($8,900/year). Quote for changes:`,
  },
  {
    id: "formal",
    label: "Formal",
    body: (c) =>
      `Dear ${c.name}, this is a reminder that your Growth subscription is scheduled to renew on October 9 at $8,900 per year. Should you wish to adjust seats or billing, please review the attached quote:`,
  },
];

type Phase = "draft" | "sending" | "sent" | "discarded";

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);

const icon = (body: TemplateResult) => html`<svg viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
const optionalBool = { fromAttribute: (v: string | null) => (v === null ? undefined : v !== "false") };
let instances = 0;

/**
 * An agent-written email waiting for review: recipient, attachment, tones, inline editing, Discard and Send.
 * @tag tc-email-draft
 * @fires tc-recipient-change - Another contact is picked; detail `{ email: string, contact: DraftContact }`. Cancelable: prevent it to control `recipient`
 * @fires tc-tone-change - Another tone is picked; detail `{ tone: string }`. Cancelable: prevent it to control `tone`
 * @fires tc-discard - The draft is discarded; detail `null`
 * @fires tc-undo - A send or discard is taken back from the receipt; detail `{ action: "send" | "discard" }`
 */
export class TcEmailDraft extends TcElement {
  static override ui = "ed";

  /** Reference of the record, e.g. a subscription or invoice number */
  @property() accessor reference = "SUB-1182";
  /** Account or company under the reference */
  @property() accessor account = "Northwind Logistics";
  /** Amount shown on the right */
  @property() accessor amount = "$8,900";
  /** Status chip next to the reference */
  @property() accessor status = "Renews in 5 days";
  /** Who wrote the draft */
  @property() accessor agent = "Renewal agent";
  /** The people the email can go to – the recipient list offers them; the first is picked unless `recipient` says otherwise */
  @property({ attribute: false }) accessor contacts: DraftContact[] = defaultContacts;
  /** The email of the contact it goes to – unset is the first contact; one not in `contacts` falls back to the first */
  @property() accessor recipient: string | undefined = undefined;
  /** The file attached – removing it is remembered for that file only, so a new attachment shows again */
  @property() accessor attachment: string | null = "Renewal-quote.pdf";
  /** Text variants to switch between – the first one is shown first */
  @property({ attribute: false }) accessor tones: DraftTone[] = defaultTones;
  /** The id of the tone shown – unset is the first; one not in `tones` falls back to the first */
  @property() accessor tone: string | undefined = undefined;
  /** Label and target of the link appended to the email */
  @property({ attribute: false }) accessor link: { label: string; href: string } = { label: "Review quote", href: "#" };
  /**
   * Sends the email. Return a promise to keep the card in its sending state until it settles – a rejection brings
   * the draft back with an error. Without it sending is simulated (and warns once, unless `demo` is set)
   */
  @property({ attribute: false }) accessor onSend: ((email: DraftEmail) => void | Promise<unknown>) | undefined = undefined;
  /** The receipt offers Undo for a send (tc-undo takes it back) – unset: only when there's no `onSend` */
  @property({ attribute: "undo-send", converter: optionalBool }) accessor undoSend: boolean | undefined = undefined;
  /** The receipt offers Undo for a discard (tc-undo takes it back) – unset: yes */
  @property({ attribute: "undo-discard", converter: optionalBool }) accessor undoDiscard: boolean | undefined = undefined;
  /** Demo mode: sending without onSend is simulated silently. For galleries and prototypes */
  @property({ type: Boolean }) accessor demo = false;

  /** @internal The attachment that was removed */
  @state() private accessor removed: string | null = null;
  /** @internal Edited text wins over the generated variant until the tone or recipient changes */
  @state() private accessor edited: string | null = null;
  @state() private accessor editing = false;
  @state() private accessor menu = false;
  @state() private accessor phase: Phase = "draft";
  @state() private accessor toneKey = 0;
  @state() private accessor error = "";
  /** @internal Manual edits a tone replaced – "Restore my edits" brings them back */
  @state() private accessor replaced: string | null = null;
  /** @internal The persistent status region's text: final results only */
  @state() private accessor announce = "";
  /** @internal The highlighted option of the recipient list */
  @state() private accessor activeOption = 0;

  private readonly uid = `tc-ed${++instances}`;
  private timers: number[] = [];
  /** Bumped on disconnect, so a send that settles afterwards is ignored */
  private run = 0;
  private menuWasOpen = false;

  constructor() {
    super();
    new SmoothHeightController(this, () => this.querySelector(".ui-ed__outer"), () => this.querySelector(".ui-ed__outer > div"));
    // Focus never drops to <body>: Send ↔ Undo share a focus key; without Undo the receipt takes focus
    new FocusRescueController(this, () => {
      const q = (sel: string) => this.querySelector<HTMLElement>(sel);
      return q(".ui-ed__undo") ?? q(".ui-ed__receipt") ?? q(".ui-ed__primary:not(:disabled)") ?? q(".ui-ed__recipient");
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.run++;
    this.timers.forEach((t) => clearTimeout(t));
    this.timers = [];
    if (this.phase === "sending") this.phase = "draft";
    document.removeEventListener("pointerdown", this.onOutside);
    this.menuWasOpen = false;
  }

  /** @internal The contact it goes to */
  private get to() {
    const email = this.recipient ?? this.contacts[0]?.email ?? "";
    return this.contacts.find((c) => c.email === email) ?? this.contacts[0] ?? noRecipient;
  }
  /** @internal The tone shown */
  private get toneId() {
    const picked = this.tone ?? this.tones[0]?.id ?? "";
    return this.tones.some((t) => t.id === picked) ? picked : (this.tones[0]?.id ?? "");
  }
  /** @internal */
  private get file() {
    return this.attachment && this.attachment !== this.removed ? this.attachment : null;
  }
  /** @internal */
  private get generated() {
    const to = this.to;
    return (to.email && (this.tones.find((t) => t.id === this.toneId) ?? this.tones[0])?.body(to)) || "";
  }
  /** @internal */
  private get body() {
    return this.edited ?? this.generated;
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    // The recipient list: closes on an outside press; opening moves focus into it, onto the current recipient
    if (this.menu !== this.menuWasOpen) {
      this.menuWasOpen = this.menu;
      if (this.menu) {
        document.addEventListener("pointerdown", this.onOutside);
        this.querySelector<HTMLElement>(".ui-ed__menu")?.focus({ preventScroll: true });
      } else document.removeEventListener("pointerdown", this.onOutside);
    }
    if (this.menu) document.getElementById(`${this.uid}-o${this.activeOption}`)?.scrollIntoView?.({ block: "nearest" });
    // The edit field grows with its text
    const field = this.querySelector<HTMLTextAreaElement>(".ui-ed__edit");
    if (field && (changed.has("editing") || changed.has("edited"))) {
      field.style.height = "auto";
      field.style.height = `${field.scrollHeight}px`;
    }
  }

  private onOutside = (e: PointerEvent) => {
    if (!this.querySelector(".ui-ed__to")?.contains(e.target as Node)) this.menu = false;
  };

  /** @internal Reports a recipient and applies it unless prevented */
  private setTo(c: DraftContact) {
    const current = this.recipient ?? this.contacts[0]?.email ?? "";
    if (c.email === current) return;
    if (this.emit<DraftRecipientChange>("tc-recipient-change", { email: c.email, contact: c }, { cancelable: true })) this.recipient = c.email;
  }

  private openMenu(at?: "first" | "last") {
    const current = Math.max(
      0,
      this.contacts.findIndex((c) => c.email === this.to.email),
    );
    this.activeOption = at === "first" ? 0 : at === "last" ? Math.max(0, this.contacts.length - 1) : current;
    this.menu = true;
  }
  private closeMenu() {
    this.menu = false;
    this.querySelector<HTMLElement>(".ui-ed__recipient")?.focus({ preventScroll: true });
  }
  private pickContact(c: DraftContact) {
    const to = this.to;
    this.setTo(c);
    this.menu = false;
    // Keep manual edits, but follow the new name in the generated text. Names are matched literally – "J. (Jo)
    // Smith" is no pattern – and the full name before the first name
    if (this.edited !== null && to.email)
      this.edited = this.edited.replace(new RegExp(`${escapeRegExp(to.name)}|\\b${escapeRegExp(first(to))}\\b`, "g"), (m) => (m === to.name ? c.name : first(c)));
    this.querySelector<HTMLElement>(".ui-ed__recipient")?.focus({ preventScroll: true });
  }

  private onListKey = (e: KeyboardEvent) => {
    const contacts = this.contacts;
    const last = contacts.length - 1;
    const move = (i: number) => {
      e.preventDefault();
      this.activeOption = Math.max(0, Math.min(last, i));
    };
    if (e.key === "ArrowDown") move(this.activeOption + 1);
    else if (e.key === "ArrowUp") move(this.activeOption - 1);
    else if (e.key === "Home") move(0);
    else if (e.key === "End") move(last);
    else if ((e.key === "Enter" || e.key === " ") && contacts[this.activeOption]) {
      e.preventDefault();
      this.pickContact(contacts[this.activeOption]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      this.closeMenu();
    } else if (e.key === "Tab") this.menu = false;
  };

  private startEditing = () => {
    this.replaced = null;
    this.edited = this.body;
    this.editing = true;
    void this.updateComplete.then(() => {
      const el = this.querySelector<HTMLTextAreaElement>(".ui-ed__edit");
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    });
  };

  private pickTone(id: string) {
    const tone = this.toneId;
    if (id === tone && this.edited === null) return;
    // Manual edits aren't lost silently: they can be restored until the text is edited again
    if (this.edited !== null && this.edited !== this.generated) {
      this.replaced = this.edited;
      this.announce = `Your edits were replaced by the ${this.tones.find((t) => t.id === id)?.label ?? id} text. Restore my edits brings them back.`;
    }
    if (id !== (this.tone ?? this.tones[0]?.id ?? "") && this.emit<DraftToneChange>("tc-tone-change", { tone: id }, { cancelable: true })) this.tone = id;
    this.edited = null;
    this.editing = false;
    this.toneKey++;
  }

  private restore = () => {
    if (this.replaced === null) return;
    this.edited = this.replaced;
    this.replaced = null;
    this.announce = "Your edits are back.";
  };

  private send = async () => {
    const to = this.to;
    if (this.phase !== "draft" || !to.email) return;
    this.editing = false;
    this.error = "";
    this.phase = "sending";
    const current = this.run;
    if (!this.onSend && !this.demo) warnSimulatedSend();
    try {
      // The spinner shows for at least 900ms, and for as long as onSend's promise is pending
      await Promise.all([
        this.onSend?.({ to, body: `${this.body} ${this.link.label}: ${this.link.href}`, attachment: this.file }),
        new Promise((r) => this.timers.push(window.setTimeout(r, 900))),
      ]);
    } catch {
      if (this.run === current) {
        this.phase = "draft";
        this.error = "The email couldn't be sent. Try again.";
      }
      return;
    }
    if (this.run === current) {
      this.phase = "sent";
      this.replaced = null;
      this.announce = `Email sent to ${to.name}.`;
    }
  };

  private discard = () => {
    this.editing = false;
    this.error = "";
    this.phase = "discarded";
    this.announce = "Draft discarded.";
    this.emit("tc-discard", null);
  };

  private undo = () => {
    const sent = this.phase === "sent";
    this.emit<DraftUndo>("tc-undo", { action: sent ? "send" : "discard" });
    this.announce = sent ? "Sending undone – the draft is back." : "Discard undone – the draft is back.";
    this.phase = "draft";
  };

  /** @internal "to" and the contact it goes to – a listbox popup switches it */
  private renderRecipient(to: DraftContact, clean: boolean) {
    const { uid, contacts, menu } = this;
    const optionId = (i: number) => `${uid}-o${i}`;
    return html`<div class="ui-ed__to">
      <span class="ui-ed__label" id=${`${uid}-label`}>${clean ? "To" : "to"}</span>
      <button
        type="button"
        class="ui-ed__recipient"
        aria-haspopup="listbox"
        aria-expanded=${menu ? "true" : "false"}
        id=${`${uid}-trigger`}
        aria-labelledby=${`${uid}-label ${uid}-trigger`}
        @click=${() => (menu ? (this.menu = false) : this.openMenu())}
        @keydown=${(e: KeyboardEvent) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            this.openMenu(e.key === "ArrowUp" ? "last" : undefined);
          }
        }}
      >${clean
        ? html`<span class="ui-ed__name">${to.name}</span><span class="ui-ed__email">${to.email}</span>`
        : html`${to.name} ${to.email ? html`<span class="ui-ed__email">(${to.email})</span>` : nothing}`}<svg viewBox="0 0 24 24" aria-hidden="true">${svg`<path d=${clean ? "m8 10 4 4 4-4" : "m7 10 5 5 5-5"}></path>`}</svg></button>
      ${menu
        ? html`<ul
            class="ui-ed__menu"
            role="listbox"
            aria-label="Recipient"
            tabindex="-1"
            aria-activedescendant=${ifDefined(contacts.length ? optionId(this.activeOption) : undefined)}
            @keydown=${this.onListKey}
          >
            ${repeat(
              contacts,
              (c) => c.email,
              (c, i) => html`<li
                id=${optionId(i)}
                role="option"
                aria-selected=${c.email === to.email ? "true" : "false"}
                ?data-active=${i === this.activeOption}
                @pointermove=${() => (this.activeOption = i)}
                @click=${() => this.pickContact(c)}
              >
                <span class="ui-ed__avatar" aria-hidden="true">${initials(c.name)}</span>
                <span class="ui-ed__menu-text">${c.name}<small>${c.email}</small></span>
                ${c.email === to.email ? html`<svg class="ui-ed__tick" viewBox="0 0 24 24" aria-hidden="true">${svg`<path d="m6 12.5 4 4 8-9"></path>`}</svg>` : nothing}
              </li>`,
            )}
          </ul>`
        : nothing}
    </div>`;
  }

  /** @internal The attached file with its remove button – or, once removed, a button that attaches it again */
  private renderAttachment(clean: boolean) {
    const file = this.file;
    if (file)
      return html`<span class="ui-ed__file">${icon(svg`<path d="m15.5 7.5-6.4 6.4a1.8 1.8 0 0 0 2.5 2.5l6.7-6.7a3.5 3.5 0 0 0-5-5l-6.9 6.9a5.2 5.2 0 0 0 7.4 7.4l6-6"></path>`)}${clean
        ? html`<span class="ui-ed__file-name">${file}</span>`
        : file}<button type="button" aria-label=${`Remove ${file}`} @click=${() => (this.removed = this.attachment)}>${icon(svg`<path d="M7 7l10 10M17 7 7 17"></path>`)}</button></span>`;
    const attachment = this.attachment;
    return attachment
      ? html`<button type="button" class="ui-ed__attach" @click=${() => (this.removed = null)}>${icon(svg`<path d="M12 6v12M6 12h12"></path>`)}${clean
          ? html`<span class="ui-ed__file-name">Attach ${attachment}</span>`
          : html`Attach ${attachment}`}</button>`
      : nothing;
  }

  /** @internal The email text – click it to edit, the field grows with its text */
  private renderBody() {
    const { editing, link } = this;
    return html`<div class="ui-ed__body">
      ${editing
        ? html`<textarea
            class="ui-ed__edit"
            data-focus-key="edit"
            .value=${live(this.edited ?? "")}
            @input=${(e: Event) => (this.edited = (e.target as HTMLTextAreaElement).value)}
            @keydown=${(e: KeyboardEvent) => {
              if (e.isComposing) return;
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                void this.send();
              }
              if (e.key === "Escape") {
                // Focus goes back to the Edit button, not to <body>
                e.preventDefault();
                rescueFocus(e.currentTarget as HTMLElement, [this.querySelector(".ui-ed__edit-btn")]);
                this.editing = false;
              }
            }}
            @blur=${() => (this.editing = false)}
            aria-label="Email text"
          ></textarea>`
        : keyed(
            this.toneKey,
            html`<p class="ui-ed__text" @click=${this.startEditing} title="Click to edit">${this.body} <a href=${link.href} @click=${(e: Event) => e.stopPropagation()}>${link.label}</a></p>`,
          )}
      ${this.replaced !== null && !editing ? html`<button type="button" class="ui-ed__restore" @click=${this.restore}>Restore my edits</button>` : nothing}
    </div>`;
  }

  /** @internal The tone variants and the edit button */
  private renderTones() {
    const tone = this.toneId;
    return html`<div class="ui-ed__tones" role="group" aria-label="Tone">
      ${repeat(
        this.tones,
        (t) => t.id,
        (t) => html`<button type="button" aria-pressed=${tone === t.id && this.edited === null ? "true" : "false"} @click=${() => this.pickTone(t.id)}>${t.label}</button>`,
      )}
      <button type="button" class="ui-ed__edit-btn" data-focus-key="edit" aria-pressed=${this.editing ? "true" : "false"} aria-label="Edit text" @click=${this.startEditing}>
        ${icon(svg`<path d="M14.5 5.5 18.5 9.5M5 19l1-4L15.5 5.5l4 4L10 19l-5 0Z"></path>`)}
      </button>
    </div>`;
  }

  /** @internal The one-line receipt the card folds into – with Undo when it can be honoured */
  private renderReceipt(to: DraftContact) {
    const sent = this.phase === "sent";
    const file = this.file;
    // Undo only where it can be honoured: the action never reached the app, or the app takes it back on tc-undo
    const canUndo = sent ? (this.undoSend ?? !this.onSend) : (this.undoDiscard ?? true);
    return html`<div class="ui-ed__receipt" tabindex="-1">
      <span class="ui-ed__receipt-icon" data-tone=${sent ? "ok" : "muted"} aria-hidden="true">${icon(sent ? svg`<path d="m6 12.5 4 4 8-9"></path>` : svg`<path d="M7 7l10 10M17 7 7 17"></path>`)}</span>
      <span class="ui-ed__receipt-text">${sent ? html`Sent to <b>${to.name}</b>${file ? ` with ${file}` : ""}` : "Draft discarded"}</span>
      ${canUndo ? html`<button type="button" class="ui-ed__undo" data-focus-key="action" @click=${this.undo}>Undo</button>` : nothing}
    </div>`;
  }

  protected override render() {
    const clean = this.resolvedLook === "clean";
    const phase = this.phase;
    const to = this.to;
    const open = phase === "draft" || phase === "sending";
    const badge = phase === "sent" ? { text: "Sent", tone: "ok" } : phase === "discarded" ? { text: "Discarded", tone: "muted" } : { text: "Ready for review", tone: "ok" };
    // Discard and Send – Standard: in the card, next to the tones; Clean: in the card's last row. While sending, the
    // buttons stay focusable (aria-disabled), so focus stays on Send as it turns into "Sending"
    const sending = phase === "sending";
    const buttons = html`<div class="ui-ed__buttons">
      <button type="button" class="ui-ed__secondary" data-focus-key="discard" @click=${() => !sending && this.discard()} aria-disabled=${ifDefined(sending ? "true" : undefined)}>Discard</button>
      <button type="button" class="ui-ed__primary" data-focus-key="action" @click=${this.send} aria-disabled=${ifDefined(sending ? "true" : undefined)} ?disabled=${!to.email}>${sending
        ? html`<span class="ui-ed__spinner" aria-hidden="true"></span>Sending`
        : "Send email"}</button>
    </div>`;
    const hint = html`<span class="ui-ed__hint">⌘ Enter to send</span>`;

    return html`
      <div class="ui-ed__record">
        <div class="ui-ed__ref">
          <span class="ui-ed__id">${this.reference}</span>
          <span class="ui-ed__status">${this.status}</span>
          <span class="ui-ed__amount">${this.amount}</span>
        </div>
        <span class="ui-ed__account">${this.account}</span>
      </div>

      <div class="ui-ed__outer" ?data-menu=${this.menu}>
        <div>
          ${open
            ? html`<div class=${clean ? "ui-ed__draft" : "ui-ed__card"} ?data-sending=${sending}>
                <div class="ui-ed__meta">${this.renderRecipient(to, clean)}${this.renderAttachment(clean)}</div>
                ${this.renderBody()}
                ${this.error ? html`<p class="ui-ed__error" role="alert">${this.error}</p>` : nothing}
                <div class=${clean ? "ui-ed__tune" : "ui-ed__actions"}>${this.renderTones()}${clean ? hint : buttons}</div>
              </div>`
            : this.renderReceipt(to)}
        </div>
      </div>

      <div class="ui-ed__foot">
        <span class="ui-ed__agent">${this.agent}</span>
        ${keyed(badge.text, html`<span class="ui-ed__badge" data-tone=${badge.tone}>${badge.text}</span>`)}
        ${open ? (clean ? buttons : hint) : nothing}
      </div>
      <span class="ui-ed__sr" role="status">${this.announce}</span>
    `;
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    this.dataset.phase = this.phase;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="ed"] {
  /* The record and footer sit on a tray (tray pattern); the email card sits on it */
  box-sizing: border-box;
  container-type: inline-size;
  width: 100%;
  max-width: 520px;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on [data-ui="ed"] */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ed"] {
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  position: relative;
  box-sizing: border-box;
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 480px;
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
[data-ui="ed"] *, [data-ui="ed"] *::before, [data-ui="ed"] *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="ed"] button { font: inherit; color: inherit; margin: 0; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="ed"] button:focus-visible,
[data-ui="ed"] a:focus-visible,
.ui-ed__receipt:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="ed"] svg { width: 15px; height: 15px; flex: none; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
/* ---------- Record on the tray ---------- */
:where([data-look="standard"], [data-look="standard"] *).ui-ed__record { display: grid; gap: var(--tc-space-0-5); padding: var(--tc-space-2) var(--tc-space-2-5) var(--tc-space-2-5); }
:where([data-look="clean"], [data-look="clean"] *):where([data-ui="ed"]) button {
  appearance: none;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  color: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
:where([data-look="clean"], [data-look="clean"] *):where([data-ui="ed"]) svg {
  display: block;
  width: 16px;
  height: 16px;
  flex: none;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
/* ---------- The record, heading the card ---------- */
:where([data-look="clean"], [data-look="clean"] *).ui-ed__record { display: grid; padding: var(--tc-space-3) var(--tc-space-4); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-ed__ref { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__id { font-size: var(--tc-font-size-lg-plus); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-relaxed); letter-spacing: -0.01em; }
/* Status and badge: the pill pattern */
.ui-ed__status,
.ui-ed__badge {
  display: inline-flex;
  align-items: center;
  flex: none;
  height: var(--tc-pill-h);
  max-width: 100%;
  padding: 0 var(--tc-pill-px);
  overflow: hidden;
  border-radius: var(--tc-pill-radius);
  font-size: var(--tc-pill-font-size);
  font-weight: var(--tc-pill-font-weight);
  line-height: var(--tc-line-height-tight);
  white-space: nowrap;
  text-overflow: ellipsis;
}
.ui-ed__status { flex: 0 1 auto; min-width: 0; background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__amount { flex: none; margin-left: auto; font-size: var(--tc-font-size-lg-plus); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-relaxed); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__account { font-size: var(--tc-font-size-md); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__outer { position: relative; }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__id { flex: none; font-size: var(--tc-font-size-lg-plus); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-loose); color: var(--tc-text-strong); }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__amount {
  flex: none;
  margin-left: auto;
  font-size: var(--tc-font-size-lg-plus);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-loose);
  font-variant-numeric: tabular-nums;
  color: var(--tc-text-strong);
}
:where([data-look="clean"], [data-look="clean"] *).ui-ed__account { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); }
/* ---------- The email: only this part changes height ---------- */
:where([data-look="clean"], [data-look="clean"] *).ui-ed__outer { position: relative; overflow: hidden; overflow: clip; }
/* The recipient menu may reach out of the card while it's open – the height doesn't move then */
:where([data-look="clean"], [data-look="clean"] *).ui-ed__outer[data-menu] { overflow: visible; z-index: 2; }
.ui-ed__outer[data-smooth] { transition: height var(--tc-duration-slow) var(--tc-ease-move); }
/* ---------- Email card ---------- */
:where([data-look="standard"], [data-look="standard"] *).ui-ed__card {
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-on-tray);
  box-shadow: var(--tc-card-shadow);
  animation: ui-ed-in var(--tc-duration-slow) var(--tc-ease-move) both;
  transition: opacity var(--tc-duration-base) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-ed__card[data-sending] { opacity: 0.7; pointer-events: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__meta {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-3);
  margin: 0 var(--tc-space-3-5);
  padding: var(--tc-space-3) 0 var(--tc-space-3);
  border-bottom: var(--tc-hairline) solid var(--tc-divider);
}
:where([data-look="standard"], [data-look="standard"] *).ui-ed__to { position: relative; display: flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__label { font-size: var(--tc-font-size-md); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__recipient {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1);
  min-width: 0;
  height: 26px;
  padding: 0 var(--tc-space-1-5) 0 var(--tc-space-2);
  border: 0;
  border-radius: var(--tc-radius-md);
  background: var(--tc-fill-default);
  box-shadow: inset 0 0 0 1px var(--tc-border-default);
  font-size: var(--tc-font-size-md);
  white-space: nowrap;
  overflow: hidden;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-ed__recipient:hover { background: color-mix(in srgb, var(--tc-fill-default) 80%, var(--tc-text-primary) 6%); }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__email { overflow: hidden; text-overflow: ellipsis; color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__recipient svg { width: 14px; height: 14px; color: var(--tc-text-muted); transition: transform var(--tc-duration-base) var(--tc-ease-move); }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__draft { animation: ui-ed-in-clean var(--tc-duration-slow) var(--tc-ease-move) both; transition: opacity var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__draft[data-sending] { opacity: 0.6; pointer-events: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__meta {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-3);
  padding: var(--tc-space-2-5) var(--tc-space-3) var(--tc-space-2-5) var(--tc-space-4);
  border-bottom: var(--tc-hairline) solid var(--tc-divider);
}
:where([data-look="clean"], [data-look="clean"] *).ui-ed__to { position: relative; display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__label { flex: none; font-size: var(--tc-font-size-md); color: var(--tc-text-muted); }
/* Recipient: the button-switch look – a hairline, the address in gray */
:where([data-look="clean"], [data-look="clean"] *).ui-ed__recipient {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  min-width: 0;
  height: 28px;
  padding: 0 var(--tc-space-1-5) 0 var(--tc-space-2-5);
  border-radius: var(--tc-radius-sm);
  box-shadow: inset 0 0 0 0.5px var(--tc-border-default);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-medium);
  white-space: nowrap;
  color: var(--tc-text-primary);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-ed__recipient:hover,
:where([data-look="clean"], [data-look="clean"] *).ui-ed__recipient[aria-expanded="true"] { background: var(--tc-fill-subtle); }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__name { flex: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__email { min-width: 0; overflow: hidden; text-overflow: ellipsis; font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__recipient svg { color: var(--tc-icon-muted); transition: transform var(--tc-duration-base) var(--tc-ease-move); }
.ui-ed__recipient[aria-expanded="true"] svg { transform: rotate(180deg); }
/* Recipient listbox: the menu pattern */
.ui-ed__menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 18px;
  z-index: var(--tc-z-dropdown);
  display: grid;
  gap: var(--tc-space-0-5);
  width: 260px;
  max-width: calc(100cqw - 40px);
  margin: 0;
  padding: var(--tc-menu-padding);
  list-style: none;
  border-radius: var(--tc-menu-radius);
  background: var(--tc-menu-bg);
  box-shadow: var(--tc-menu-shadow);
  animation: ui-ed-menu var(--tc-duration-base) var(--tc-ease-move) both;
  transform-origin: top left;
}
:where([data-look="clean"], [data-look="clean"] *).ui-ed__menu { left: 26px; }
/* Focus is on the list; the active option carries the ring */
.ui-ed__menu[aria-activedescendant]:focus-visible { outline: none; }
.ui-ed__menu:focus-visible [data-active] { box-shadow: inset 0 0 0 var(--tc-focus-ring-width) var(--tc-focus-ring); }
.ui-ed__menu [role="option"] {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2-5);
  min-height: var(--tc-menu-item-h);
  padding: 6px var(--tc-menu-item-px);
  border-radius: var(--tc-menu-item-radius);
  font-size: var(--tc-menu-item-font-size);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  cursor: pointer;
}
.ui-ed__menu [data-active] { background: var(--tc-menu-item-hover); }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__avatar {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  flex: none;
  border-radius: 50%;
  background: var(--tc-fill-default);
  box-shadow: inset 0 0 0 1px var(--tc-border-default);
  font-size: 10.5px;
  font-weight: var(--tc-font-weight-semibold);
  color: var(--tc-text-secondary);
}
/* Recipient menu: a white popover */
:where([data-look="clean"], [data-look="clean"] *).ui-ed__avatar {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  flex: none;
  border-radius: var(--tc-radius-sm);
  background: var(--tc-fill-default);
  font-size: var(--tc-font-size-2xs);
  font-weight: var(--tc-font-weight-medium);
  letter-spacing: 0.5px;
  color: var(--tc-text-secondary);
}
.ui-ed__menu-text { display: grid; flex: 1; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__menu-text small { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); overflow: hidden; text-overflow: ellipsis; }
.ui-ed__tick { color: var(--tc-menu-item-selected-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__file {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: var(--tc-font-size-md);
  color: var(--tc-text-muted);
  white-space: nowrap;
}
:where([data-look="standard"], [data-look="standard"] *).ui-ed__file button,
:where([data-look="standard"], [data-look="standard"] *).ui-ed__attach {
  display: grid;
  place-items: center;
  border: 0;
  background: none;
  color: var(--tc-text-muted) !important;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-ed__file button { width: 20px; height: 20px; padding: 0; border-radius: var(--tc-radius-sm); }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__file button svg { width: 13px; height: 13px; }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__file button:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary) !important; }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__attach { display: inline-flex; gap: var(--tc-space-1); padding: var(--tc-space-1) var(--tc-space-1-5); border-radius: var(--tc-radius-md); font-size: var(--tc-font-size-md); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__attach:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary) !important; }
/* Body */
:where([data-look="standard"], [data-look="standard"] *).ui-ed__body { padding: var(--tc-space-3) var(--tc-space-3-5) var(--tc-space-1); }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__text {
  margin: -4px -6px;
  padding: var(--tc-space-1) var(--tc-space-1-5);
  border-radius: var(--tc-radius-md);
  font-size: var(--tc-font-size-lg-plus);
  line-height: var(--tc-line-height-loose);
  color: var(--tc-text-secondary);
  cursor: text;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
  animation: ui-ed-fade var(--tc-duration-moderate) var(--tc-ease-standard) both;
}
:where([data-look="standard"], [data-look="standard"] *).ui-ed__text:hover { background: var(--tc-fill-hover); }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__text a {
  color: var(--tc-text-secondary);
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, var(--tc-text-secondary) 35%, transparent);
  text-decoration-thickness: var(--tc-hairline);
  text-underline-offset: 4px;
}
:where([data-look="clean"], [data-look="clean"] *).ui-ed__menu-text small { overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); white-space: nowrap; text-overflow: ellipsis; color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__tick { stroke-width: 1.8; }
/* Attachment */
:where([data-look="clean"], [data-look="clean"] *).ui-ed__file {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  min-width: 0;
  font-size: var(--tc-font-size-md);
  white-space: nowrap;
  color: var(--tc-text-secondary);
}
:where([data-look="clean"], [data-look="clean"] *).ui-ed__file > svg { color: var(--tc-icon-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__file-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__file button {
  display: grid;
  place-items: center;
  flex: none;
  width: 24px;
  height: 24px;
  margin-left: -2px;
  border-radius: var(--tc-radius-sm);
  color: var(--tc-icon-muted);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-ed__file button svg { width: 14px; height: 14px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__file button:hover { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__attach {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  min-width: 0;
  height: 28px;
  padding: 0 var(--tc-space-2) 0 var(--tc-space-1-5);
  border-radius: var(--tc-radius-sm);
  font-size: var(--tc-font-size-md);
  white-space: nowrap;
  color: var(--tc-text-secondary);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
  animation: ui-ed-fade var(--tc-duration-base) var(--tc-ease-standard) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-ed__attach svg { color: var(--tc-icon-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__attach:hover { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
/* Body */
:where([data-look="clean"], [data-look="clean"] *).ui-ed__body { padding: var(--tc-space-3-5) var(--tc-space-4) var(--tc-space-0-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__error { margin: var(--tc-space-2) var(--tc-space-4) 0; font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); color: var(--tc-status-danger-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__text {
  margin: -4px -6px;
  padding: var(--tc-space-1) var(--tc-space-1-5);
  border-radius: var(--tc-radius-sm);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  cursor: text;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
  animation: ui-ed-fade var(--tc-duration-moderate) var(--tc-ease-standard) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-ed__text:hover { background: var(--tc-fill-subtle); }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__text a {
  color: var(--tc-text-strong);
  font-weight: var(--tc-font-weight-medium);
  text-decoration: underline;
  text-decoration-color: var(--tc-text-disabled);
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
  transition: text-decoration-color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-ed__text a:hover { text-decoration-color: currentColor; }
/* Editing: the text becomes a field – field ring, focus ring + halo while focused */
.ui-ed__edit {
  display: block;
  width: calc(100% + 12px);
  margin: -4px -6px;
  padding: var(--tc-space-1) var(--tc-space-1-5);
  border: 0;
  border-radius: var(--tc-radius-sm);
  background: var(--tc-field-bg);
  box-shadow: var(--tc-field-shadow);
  resize: none;
  overflow: hidden;
  font: inherit;
  color: var(--tc-text-strong);
  caret-color: var(--tc-accent);
  transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-ed__edit:focus { outline: none; box-shadow: var(--tc-field-shadow-focus); }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__edit { border-radius: var(--tc-radius-md); font-size: var(--tc-font-size-lg-plus); line-height: var(--tc-line-height-loose); }
/* Actions */
:where([data-look="standard"], [data-look="standard"] *).ui-ed__error { margin: var(--tc-space-2) var(--tc-space-3-5) 0; font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-snug); color: var(--tc-status-danger-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-2-5);
  flex-wrap: wrap;
  padding: var(--tc-space-2-5) var(--tc-space-2-5) var(--tc-space-2-5) var(--tc-space-3-5);
}
:where([data-look="standard"], [data-look="standard"] *).ui-ed__tones { display: flex; align-items: center; gap: var(--tc-space-0-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__tones button {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 var(--tc-space-2);
  border: 0;
  border-radius: var(--tc-radius-md);
  background: none;
  font-size: var(--tc-font-size-sm);
  color: var(--tc-text-muted) !important;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-ed__tones button:hover { color: var(--tc-text-primary) !important; }
/* Pressed tone: fill plus a ≥3:1 ring, not the fill alone */
.ui-ed__tones button[aria-pressed="true"] { background: var(--tc-fill-selected); color: var(--tc-text-primary) !important; box-shadow: inset 0 0 0 1px var(--tc-border-selected); }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__tones .ui-ed__edit-btn { width: 28px; padding: 0; justify-content: center; margin-left: var(--tc-space-1); }
.ui-ed__buttons { display: flex; flex: none; gap: var(--tc-space-2); margin-left: auto; }
/* Discard and Send look exactly like Button secondary / primary (control + action pattern tokens) */
.ui-ed__secondary,
.ui-ed__primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--tc-space-1-5);
  height: var(--tc-control-h-md);
  padding: 0 var(--tc-control-px-md);
  border: 0;
  border-radius: var(--tc-control-radius-md);
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  line-height: var(--tc-line-height-normal);
  white-space: nowrap;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move);
}
.ui-ed__secondary { background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg) !important; }
.ui-ed__secondary:hover:not(:disabled):not([aria-disabled="true"]) { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-ed__primary { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg) !important; }
.ui-ed__primary:hover:not(:disabled):not([aria-disabled="true"]) { background: var(--tc-action-primary-bg-hover); }
.ui-ed__primary:active:not(:disabled):not([aria-disabled="true"]) { background: var(--tc-action-primary-bg-active); }
.ui-ed__secondary:active:not(:disabled):not([aria-disabled="true"]),
.ui-ed__primary:active:not(:disabled):not([aria-disabled="true"]) { transform: scale(0.97); }
.ui-ed__secondary:is(:disabled, [aria-disabled="true"]),
.ui-ed__primary:is(:disabled, [aria-disabled="true"]) { cursor: default; }
.ui-ed__primary:disabled { opacity: 0.4; }
.ui-ed__spinner {
  width: 12px;
  height: 12px;
  border: 2px solid color-mix(in srgb, var(--tc-action-primary-fg) 30%, transparent);
  border-top-color: var(--tc-action-primary-fg);
  border-radius: 50%;
  animation: ui-ed-spin var(--tc-duration-reveal) linear infinite;
}
/* ---------- Receipt after send / discard ---------- */
:where([data-look="standard"], [data-look="standard"] *).ui-ed__receipt {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2-5);
  padding: var(--tc-space-3) var(--tc-space-2-5) var(--tc-space-3) var(--tc-space-3);
  border: 1px solid var(--tc-border-default);
  border-radius: var(--tc-radius-2xl);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-shadow-control);
  font-size: var(--tc-font-size-lg);
  color: var(--tc-text-secondary);
  animation: ui-ed-in var(--tc-duration-slow) var(--tc-ease-move) both;
}
:where([data-look="standard"], [data-look="standard"] *).ui-ed__receipt b { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__receipt-icon {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  flex: none;
  border-radius: 50%;
  background: var(--tc-fill-default);
  color: var(--tc-text-muted);
}
:where([data-look="clean"], [data-look="clean"] *).ui-ed__edit { font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); }
/* Tones and the pencil */
:where([data-look="clean"], [data-look="clean"] *).ui-ed__tune {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-3);
  padding: var(--tc-space-3-5) var(--tc-space-3) var(--tc-space-3-5) var(--tc-space-4);
}
:where([data-look="clean"], [data-look="clean"] *).ui-ed__tones { display: flex; align-items: center; gap: var(--tc-space-1); min-width: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__tones button {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: var(--tc-space-1) var(--tc-space-2-5);
  border-radius: var(--tc-radius-sm);
  box-shadow: inset 0 0 0 0.5px var(--tc-border-default);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-normal);
  white-space: nowrap;
  color: var(--tc-text-secondary);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-ed__tones button:hover { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
/* Edit: a ghost icon button */
:where([data-look="clean"], [data-look="clean"] *).ui-ed__tones .ui-ed__edit-btn {
  justify-content: center;
  width: 28px;
  margin-left: var(--tc-space-1);
  padding: 0;
  box-shadow: none;
  color: var(--tc-icon-muted);
}
:where([data-look="clean"], [data-look="clean"] *).ui-ed__tones .ui-ed__edit-btn:hover { color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__hint { flex: none; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); white-space: nowrap; color: var(--tc-text-muted); }
/* ---------- Receipt after send / discard ---------- */
:where([data-look="clean"], [data-look="clean"] *).ui-ed__receipt {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2-5);
  padding: var(--tc-space-3) var(--tc-space-3) var(--tc-space-3) var(--tc-space-4);
  font-size: var(--tc-font-size-md);
  color: var(--tc-text-secondary);
  animation: ui-ed-in-clean var(--tc-duration-slow) var(--tc-ease-move) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-ed__receipt b { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-strong); }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__receipt-icon {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  flex: none;
  border-radius: var(--tc-radius-sm);
  background: var(--tc-fill-default);
  color: var(--tc-icon-muted);
}
.ui-ed__receipt-icon[data-tone="ok"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__receipt-icon svg { width: 14px; height: 14px; stroke-width: 2.2; }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__receipt-icon svg { width: 14px; height: 14px; stroke-width: 2; }
.ui-ed__receipt-text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* Undo: a ghost action */
.ui-ed__undo {
  flex: none;
  height: var(--tc-control-h-sm);
  padding: 0 var(--tc-control-px-sm);
  border: 0;
  border-radius: var(--tc-control-radius-sm);
  background: none;
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  color: var(--tc-text-primary) !important;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-ed__undo:hover { background: var(--tc-action-ghost-bg-hover); }
/* ---------- Footer on the tray ---------- */
:where([data-look="standard"], [data-look="standard"] *).ui-ed__foot { display: flex; align-items: center; gap: var(--tc-space-2); padding: var(--tc-space-2-5) var(--tc-space-2-5) var(--tc-space-1-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__agent { font-size: var(--tc-font-size-lg); color: var(--tc-text-primary); }
.ui-ed__badge { animation: ui-ed-fade var(--tc-duration-moderate) var(--tc-ease-standard) both; }
/* ---------- The last row ---------- */
:where([data-look="clean"], [data-look="clean"] *).ui-ed__foot {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2);
  min-height: 48px;
  padding: var(--tc-space-2-5) var(--tc-space-2-5) var(--tc-space-2-5) var(--tc-space-4);
  border-top: var(--tc-hairline) solid var(--tc-divider);
}
:where([data-look="clean"], [data-look="clean"] *).ui-ed__agent { min-width: 0; overflow: hidden; font-size: var(--tc-font-size-md); white-space: nowrap; text-overflow: ellipsis; color: var(--tc-text-primary); }
.ui-ed__badge[data-tone="ok"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__hint { margin-left: auto; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
@keyframes ui-ed-in { from { opacity: 0; transform: translateY(4px) scale(0.99); } }
.ui-ed__badge[data-tone="muted"] { background: var(--tc-fill-default); color: var(--tc-text-secondary); }
@keyframes ui-ed-in-clean { from { opacity: 0; transform: translateY(4px); } }
@keyframes ui-ed-fade { from { opacity: 0; } }
@keyframes ui-ed-menu { from { opacity: 0; transform: scale(0.96) translateY(-4px); } }
@keyframes ui-ed-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
:where([data-look="standard"], [data-look="standard"] *).ui-ed__outer[data-smooth] { transition: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__card,
:where([data-look="standard"], [data-look="standard"] *).ui-ed__receipt,
:where([data-look="standard"], [data-look="standard"] *).ui-ed__text,
:where([data-look="standard"], [data-look="standard"] *).ui-ed__badge,
:where([data-look="standard"], [data-look="standard"] *).ui-ed__menu { animation: none; }
}
/* Narrow containers (phones): the address, hint and author step back */
@container (max-width: 440px) {
.ui-ed__email,
.ui-ed__hint { display: none; }
}
/* Standard below 380 px: the tones and the buttons wrap onto two rows instead of overflowing */
@container (max-width: 380px) {
:where([data-look="standard"], [data-look="standard"] *).ui-ed__meta { margin: 0 var(--tc-space-3); }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__body { padding-left: var(--tc-space-3); padding-right: var(--tc-space-3); }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__actions { padding-left: var(--tc-space-3); }
:where([data-look="standard"], [data-look="standard"] *).ui-ed__tones button { padding: 0 var(--tc-space-2); }
}
@container (max-width: 380px) {
:where([data-look="clean"], [data-look="clean"] *).ui-ed__record { padding: var(--tc-space-3) var(--tc-space-3-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__meta,
:where([data-look="clean"], [data-look="clean"] *).ui-ed__tune,
:where([data-look="clean"], [data-look="clean"] *).ui-ed__receipt,
:where([data-look="clean"], [data-look="clean"] *).ui-ed__foot { padding-left: var(--tc-space-3-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__body { padding-left: var(--tc-space-3-5); padding-right: var(--tc-space-3-5); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ed"][data-phase="draft"] .ui-ed__agent,
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ed"][data-phase="sending"] .ui-ed__agent { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__tones { gap: var(--tc-space-0-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__tones button { padding: var(--tc-space-1) var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__tones .ui-ed__edit-btn { margin-left: var(--tc-space-0-5); }
}
/* Touch screens: taller hit targets */
@media (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-ed__recipient,
:where([data-look="clean"], [data-look="clean"] *).ui-ed__tones button,
:where([data-look="clean"], [data-look="clean"] *).ui-ed__secondary,
:where([data-look="clean"], [data-look="clean"] *).ui-ed__primary,
:where([data-look="clean"], [data-look="clean"] *).ui-ed__undo,
:where([data-look="clean"], [data-look="clean"] *).ui-ed__attach { height: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__tones .ui-ed__edit-btn { width: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__file button { width: 30px; height: 30px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__menu [role="option"] { padding-top: var(--tc-space-2); padding-bottom: var(--tc-space-2); }
}
@media (prefers-reduced-motion: reduce) {
:where([data-look="clean"], [data-look="clean"] *).ui-ed__outer[data-smooth] { transition: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-ed__draft,
:where([data-look="clean"], [data-look="clean"] *).ui-ed__receipt,
:where([data-look="clean"], [data-look="clean"] *).ui-ed__text,
:where([data-look="clean"], [data-look="clean"] *).ui-ed__badge,
:where([data-look="clean"], [data-look="clean"] *).ui-ed__menu,
:where([data-look="clean"], [data-look="clean"] *).ui-ed__attach { animation: none; }
}
/* "Restore my edits": a quiet text action under the email */
.ui-ed__restore {
  display: inline-flex;
  align-items: center;
  height: var(--tc-control-h-sm);
  margin: var(--tc-space-1) -6px 0;
  padding: 0 var(--tc-space-1-5);
  border: 0;
  border-radius: var(--tc-control-radius-sm);
  background: none;
  font-size: var(--tc-font-size-sm);
  color: var(--tc-accent-text) !important;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.ui-ed__restore:hover { background: var(--tc-action-ghost-bg-hover); }
/* Announcements for screen readers only */
.ui-ed__sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
`;
}

if (!customElements.get("tc-email-draft")) customElements.define("tc-email-draft", TcEmailDraft);

declare global {
  interface HTMLElementTagNameMap {
    "tc-email-draft": TcEmailDraft;
  }
}
