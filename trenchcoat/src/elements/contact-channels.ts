import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-contact-channels> – the ways to reach a person or an account, grouped as Email, Phone, Messaging and Address:
 * each with its role (Primary, Work, Backup …), when it was last used and how far it's verified – Verified,
 * Unverified, Bounced, Dormant, Flagged, or the page's own. Values are masked until revealed, one row at a time; a
 * reveal fires a cancelable tc-revealed-change, so a page can ask for a reason or log it first. A shown value can be
 * copied (tc-copy, cancelable), and the page can add its own actions to every row (tc-action).
 *   · the rows' buttons are one tab stop: ↑ / ↓ move between rows (across groups), ← / → between a row's buttons,
 *     Home / End to the first and last row
 *   · states carry a word and a mark as well as a tint, so colour is never the only cue
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-contact-channels .channels=${[{ id: "e1", kind: "email", value: "elena.ruiz@example.com", role: "Primary",
 *     state: "verified" }]}></tc-contact-channels>
 */

/** An address book: Lucide (ISC, lucide.dev) */
const bookIcon = svg`<path d="M16 2v2"></path><path d="M7 22v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"></path><path d="M8 2v2"></path><circle cx="12" cy="11" r="3"></circle><rect x="3" y="4" width="18" height="18" rx="2"></rect>`;

export type ContactKind = "email" | "phone" | "messaging" | "address";
/** The tone a verification state is drawn in */
export type ContactTone = "success" | "info" | "warning" | "danger" | "neutral";
export type ContactChannel = {
  id: string;
  kind: ContactKind;
  /** The address, number, handle or postal address */
  value: string;
  /** What it's for: "Primary", "Work", "Backup", "Linked to alias" */
  role?: string;
  /** For messaging: the service, e.g. "Signal", "WhatsApp" */
  service?: string;
  /** When it was last used, as epoch ms */
  lastUsed?: number;
  /** A key of `states`: verified, unverified, bounced, dormant, flagged, or one of the page's own */
  state: string;
  /** One quiet line: "Bounced twice in May" */
  note?: string;
};
/** An action the page adds to every row */
export type ContactAction = { id: string; label: string };

/** Details of the events */
export type ContactRevealedChange = { revealed: string[]; id: string; shown: boolean };
export type ContactCopy = { channel: ContactChannel; text: string };
export type ContactActionEvent = { action: string; channel: ContactChannel };

/** The verification states' names and tones used when the page gives none */
export const defaultContactStates: Record<string, { label: string; tone: ContactTone }> = {
  verified: { label: "Verified", tone: "success" },
  unverified: { label: "Unverified", tone: "neutral" },
  bounced: { label: "Bounced", tone: "danger" },
  dormant: { label: "Dormant", tone: "info" },
  flagged: { label: "Flagged", tone: "warning" },
};
/** The groups' names used when the page gives none */
export const defaultContactKindLabels: Record<ContactKind, string> = { email: "Email", phone: "Phone", messaging: "Messaging", address: "Address" };
const KINDS: ContactKind[] = ["email", "phone", "messaging", "address"];

let uidCount = 0;

/* Kinds, state marks, eye, eye-off and copy: Lucide (ISC, lucide.dev) */
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const KIND: Record<ContactKind, () => ReturnType<typeof lucide>> = {
  email: () => lucide(16, svg`<rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>`),
  phone: () => lucide(16, svg`<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>`),
  messaging: () => lucide(16, svg`<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path>`),
  address: () => lucide(16, svg`<path d="M20 10c0 4.99-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 14.99 4 10a8 8 0 0 1 16 0"></path><circle cx="12" cy="10" r="3"></circle>`),
};
const MARK: Record<ContactTone, () => ReturnType<typeof lucide>> = {
  success: () => lucide(11, svg`<path d="M20 6 9 17l-5-5"></path>`),
  info: () => lucide(11, svg`<circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path>`),
  warning: () => lucide(11, svg`<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><path d="M4 22v-7"></path>`),
  danger: () => lucide(11, svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`),
  neutral: () => lucide(11, svg`<circle cx="12" cy="12" r="10"></circle><path d="M12 16v.01"></path><path d="M12 8v4"></path>`),
};
const eyeIcon = () => lucide(15, svg`<path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"></path><circle cx="12" cy="12" r="3"></circle>`);
const eyeOffIcon = () =>
  lucide(15, svg`<path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><path d="M14.08 14.16a3 3 0 0 1-4.16-4.16"></path><path d="m2 2 20 20"></path>`);
const copyIcon = () => lucide(15, svg`<rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>`);
const checkIcon = () => lucide(15, svg`<path d="M20 6 9 17l-5-5"></path>`);

/**
 * A value masked by kind: an email keeps its first letter and domain, a phone number its last two digits, an address
 * its last part (the town), a handle its first letter
 */
export function maskContact(kind: ContactKind, value: string) {
  if (kind === "email") {
    const at = value.lastIndexOf("@");
    return at > 0 ? `${value[0]}••••${value.slice(at)}` : "••••";
  }
  if (kind === "phone") {
    const digits = value.replace(/\D/g, "");
    return digits.length > 2 ? `•••• •• ${digits.slice(-2)}` : "••••";
  }
  if (kind === "address") {
    const parts = value.split(",").map((p) => p.trim()).filter(Boolean);
    return parts.length > 1 ? `••••, ${parts[parts.length - 1]}` : "••••";
  }
  return value ? `${value[0]}••••` : "••••";
}
/** What a screen reader hears for a masked value */
const hiddenWords = (kind: ContactKind, value: string) => {
  if (kind === "email" && value.includes("@")) return `at ${value.slice(value.lastIndexOf("@") + 1)}, hidden`;
  if (kind === "phone") return `ending ${value.replace(/\D/g, "").slice(-2)}, hidden`;
  if (kind === "address" && value.includes(",")) return `in ${value.split(",").pop()!.trim()}, hidden`;
  return "hidden";
};

/**
 * The ways to reach a person or an account – email, phone, messaging and address – each masked until revealed, with
 * its role, when it was last used and whether it's verified, Copy and the page's own actions.
 * @tag tc-contact-channels
 * @fires tc-revealed-change - A value was shown or masked again ({ revealed, id, shown }: ContactRevealedChange); cancelable – prevented, it stays as it was
 * @fires tc-copy - Copy was pressed ({ channel, text }: ContactCopy); cancelable – prevented, nothing is copied
 * @fires tc-action - One of the page's actions was pressed ({ action, channel }: ContactActionEvent)
 */
export class TcContactChannels extends TcElement {
  static override ui = "cch";

  /** The heading */
  @property() accessor heading = "Contact";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The contact points, in order; they're grouped by kind */
  @property({ attribute: false }) accessor channels: ContactChannel[] = [];
  /** Verification states' names and tones, merged over the defaults (verified, unverified, bounced, dormant, flagged) */
  @property({ attribute: false }) accessor states: Record<string, { label: string; tone: ContactTone }> = {};
  /** The groups' names, merged over the defaults (Email, Phone, Messaging, Address) */
  @property({ attribute: false }) accessor kindLabels: Partial<Record<ContactKind, string>> = {};
  /** Actions added to every row after Copy, e.g. [{ id: "message", label: "Message" }] */
  @property({ attribute: false }) accessor actions: ContactAction[] = [];
  /** Masks values until revealed; set false to show them in full */
  @property({ type: Boolean }) accessor masked = true;
  /** The ids whose values are shown. Changed by the user unless a tc-revealed-change listener calls preventDefault() */
  @property({ attribute: false }) accessor revealed: string[] = [];
  /** The language for dates, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  /** The tab stop: a row (across groups) and a button in it, by its key */
  @state() private accessor active: { r: number; k: string } = { r: 0, k: "" };
  @state() private accessor copied: string | null = null;
  @state() private accessor announce = "";

  private uid = `tc-cch-${++uidCount}`;
  private copiedTimer: ReturnType<typeof setTimeout> | undefined;

  override disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.copiedTimer);
  }

  /** Every channel in group order */
  private get rows() {
    return KINDS.flatMap((k) => this.channels.filter((c) => c.kind === k));
  }
  private kindLabel(k: ContactKind) {
    return this.kindLabels[k] ?? defaultContactKindLabels[k];
  }
  private stateOf(key: string) {
    const known = this.states[key] ?? defaultContactStates[key];
    return known ?? { label: key ? key[0].toUpperCase() + key.slice(1) : "Unknown", tone: "neutral" as ContactTone };
  }
  private isShown(c: ContactChannel) {
    return !this.masked || this.revealed.includes(c.id);
  }
  /** A row's buttons, in order: reveal (when masked), copy (when shown), then the page's actions */
  private keys(c: ContactChannel) {
    return [...(this.masked ? ["reveal"] : []), ...(this.isShown(c) ? ["copy"] : []), ...this.actions.map((a) => `a:${a.id}`)];
  }

  private setRevealed(c: ContactChannel, shown: boolean) {
    const next = shown ? [...this.revealed.filter((x) => x !== c.id), c.id] : this.revealed.filter((x) => x !== c.id);
    if (!this.emit<ContactRevealedChange>("tc-revealed-change", { revealed: next, id: c.id, shown }, { cancelable: true })) return;
    this.revealed = next;
    this.announce = `${this.kindLabel(c.kind)}${c.role ? ` (${c.role})` : ""} ${shown ? "shown" : "hidden"}`;
  }

  private async copy(c: ContactChannel) {
    if (!this.emit<ContactCopy>("tc-copy", { channel: c, text: c.value }, { cancelable: true })) return;
    try {
      await navigator.clipboard.writeText(c.value);
    } catch {
      // Clipboard access can be refused (permissions, an insecure page); the event already told the page
    }
    this.copied = c.id;
    this.announce = "Copied";
    clearTimeout(this.copiedTimer);
    this.copiedTimer = setTimeout(() => (this.copied = null), 1600);
  }

  /* ---------- Keyboard: one tab stop for the rows' buttons ---------- */

  private focusAt(r: number, k: string) {
    const rows = this.rows;
    if (!rows.length) return;
    r = Math.max(0, Math.min(rows.length - 1, r));
    const keys = this.keys(rows[r]);
    if (!keys.length) return;
    if (!keys.includes(k)) k = keys[0];
    this.active = { r, k };
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-at="${r}:${CSS.escape(k)}"]`)?.focus());
  }
  private onKey = (e: KeyboardEvent) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-at]");
    if (!btn || e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
    const at = btn.dataset.at!;
    const r = Number(at.slice(0, at.indexOf(":")));
    const k = at.slice(at.indexOf(":") + 1);
    const keys = this.keys(this.rows[r]);
    const i = keys.indexOf(k);
    const moves: Record<string, [number, string]> = {
      ArrowUp: [r - 1, k],
      ArrowDown: [r + 1, k],
      ArrowLeft: [r, keys[Math.max(0, i - 1)]],
      ArrowRight: [r, keys[Math.min(keys.length - 1, i + 1)]],
      Home: [0, k],
      End: [this.rows.length - 1, k],
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    this.focusAt(move[0], move[1]);
  };

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // The tab stop stays on a row and a button that exist
    const rows = this.rows;
    if (!rows.length) return;
    const r = Math.min(this.active.r, rows.length - 1);
    const keys = this.keys(rows[r]);
    if (r !== this.active.r || !keys.includes(this.active.k)) this.active = { r, k: keys.includes(this.active.k) ? this.active.k : (keys[0] ?? "") };
  }

  /* ---------- Rendering ---------- */

  private renderRow(c: ContactChannel, r: number) {
    const st = this.stateOf(c.state);
    const shown = this.isShown(c);
    const what = `${this.kindLabel(c.kind)}${c.role ? `, ${c.role}` : ""}`;
    const tab = (k: string) => (this.active.r === r && this.active.k === k ? 0 : -1);
    const date = c.lastUsed !== undefined ? new Intl.DateTimeFormat(this.locale, { day: "numeric", month: "short", year: "numeric" }).format(c.lastUsed) : null;
    const button = (k: string, cls: string, label: string, body: unknown, onClick: () => void, extra: { pressed?: boolean; title?: string } = {}) =>
      html`<button
        type="button"
        class=${cls}
        data-at=${`${r}:${k}`}
        tabindex=${tab(k)}
        aria-label=${label}
        aria-pressed=${ifDefined(extra.pressed === undefined ? undefined : extra.pressed ? "true" : "false")}
        title=${ifDefined(extra.title)}
        @focus=${() => (this.active = { r, k })}
        @click=${onClick}
      >${body}</button>`;
    return html`<li class="ui-cch__row" data-id=${c.id} data-tone=${st.tone}>
      <div class="ui-cch__main">
        <span class="ui-cch__value" ?data-masked=${!shown}
          >${shown ? c.value : html`<span aria-hidden="true">${maskContact(c.kind, c.value)}</span><span class="ui-cch__sr">${hiddenWords(c.kind, c.value)}</span>`}</span
        >
        <span class="ui-cch__meta">
          ${c.role ? html`<span class="ui-cch__role">${c.role}</span>` : nothing}
          ${c.service ? html`<span class="ui-cch__service">${c.service}</span>` : nothing}
          ${date ? html`<span class="ui-cch__used">Last used ${date}</span>` : nothing}
        </span>
        ${c.note ? html`<span class="ui-cch__note">${c.note}</span>` : nothing}
      </div>
      <span class="ui-cch__pill" data-tone=${st.tone}>${MARK[st.tone]()}${st.label}</span>
      <span class="ui-cch__actions">
        ${this.masked
          ? button("reveal", "ui-cch__icon-btn ui-cch__reveal", `Show ${what}`, shown ? eyeOffIcon() : eyeIcon(), () => this.setRevealed(c, !shown), { pressed: shown, title: shown ? "Hide" : "Show" })
          : nothing}
        ${shown
          ? button("copy", "ui-cch__icon-btn ui-cch__copy", this.copied === c.id ? `Copied ${what}` : `Copy ${what}`, this.copied === c.id ? checkIcon() : copyIcon(), () => void this.copy(c), {
              title: this.copied === c.id ? "Copied" : "Copy",
            })
          : nothing}
        ${this.actions.map((a) =>
          button(`a:${a.id}`, "ui-cch__action", `${a.label}, ${what}`, html`<span aria-hidden="true">${a.label}</span>`, () => this.emit<ContactActionEvent>("tc-action", { action: a.id, channel: c })),
        )}
      </span>
    </li>`;
  }

  protected override render() {
    const id = this.uid;
    const groups = KINDS.map((k) => ({ k, items: this.channels.filter((c) => c.kind === k) })).filter((g) => g.items.length);
    const verified = this.channels.filter((c) => this.stateOf(c.state).tone === "success").length;
    let r = 0;
    return html`
      <span class="ui-cch__sr" role="status">${this.announce}</span>
      <span class="ui-cch__sr" id=${`${id}-keys`}>Up and down arrows move between contact points, left and right between a contact point's buttons</span>
      ${cardHead({
        icon: bookIcon,
        title: this.heading,
        subtitle: this.description,
        id: `${id}-title`,
        aside: this.channels.length
          ? html`<span class="ui-cch__total"><span class="ui-cch__total-n">${verified}</span> of ${this.channels.length} verified</span>`
          : nothing,
      })}
      <div class="ui-cch__card" @keydown=${this.onKey}>
        ${!groups.length
          ? html`<p class="ui-cch__empty">No contact points on record.</p>`
          : groups.map((g) => {
              const start = r;
              r += g.items.length;
              const gid = `${id}-g-${g.k}`;
              return html`<section class="ui-cch__group" data-kind=${g.k} aria-labelledby=${gid}>
                <h4 class="ui-cch__group-head" id=${gid}><span class="ui-cch__kind" aria-hidden="true">${KIND[g.k]()}</span>${this.kindLabel(g.k)}</h4>
                <ul class="ui-cch__list" aria-labelledby=${gid} aria-describedby=${`${id}-keys`}>
                  ${repeat(g.items, (c) => c.id, (c, i) => this.renderRow(c, start + i))}
                </ul>
              </section>`;
            })}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="cch"] {
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="cch"] {
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
[data-ui="cch"] *, [data-ui="cch"] *::before, [data-ui="cch"] *::after { box-sizing: border-box; }
:where([data-ui="cch"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="cch"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="cch"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="cch"] p, [data-ui="cch"] h4 { margin: 0; }
[data-ui="cch"] svg { display: block; flex: none; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="cch"] svg[stroke-width] { stroke-width: 1.6; }
.ui-cch__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-cch__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-cch__total { flex: none; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; }
.ui-cch__total-n { font-weight: var(--tc-font-weight-strong); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
/* ----- A group: its kind, then its rows ----- */
.ui-cch__group + .ui-cch__group { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-cch__group-head { display: flex; align-items: center; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-1); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-cch__kind { color: var(--tc-icon-muted); }
.ui-cch__kind > svg { width: 14px; height: 14px; }
/* ----- A contact point ----- */
.ui-cch__row { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; align-items: center; gap: var(--tc-space-1) var(--tc-space-3); padding: var(--tc-space-2-5) var(--tc-space-4); }
.ui-cch__row + .ui-cch__row { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-cch__main { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-cch__value { overflow: hidden; font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); text-overflow: ellipsis; white-space: nowrap; }
.ui-cch__group[data-kind="address"] .ui-cch__value { font-family: var(--tc-font-sans); }
.ui-cch__value[data-masked] { color: var(--tc-text-secondary); }
.ui-cch__meta { display: flex; flex-wrap: wrap; gap: var(--tc-space-0-5) var(--tc-space-3); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
.ui-cch__role { color: var(--tc-text-secondary); }
:where([data-look="standard"], [data-look="standard"] *).ui-cch__role { font-weight: var(--tc-font-weight-medium); }
.ui-cch__note { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); }
.ui-cch__row[data-tone="danger"] .ui-cch__note { color: var(--tc-status-danger-fg); }
.ui-cch__row[data-tone="warning"] .ui-cch__note { color: var(--tc-status-warning-fg); }
/* The verification pill: a tint, a mark and a word */
.ui-cch__pill { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; }
.ui-cch__pill[data-tone="success"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-cch__pill[data-tone="info"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-cch__pill[data-tone="warning"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-cch__pill[data-tone="danger"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-cch__pill[data-tone="neutral"] { background: var(--tc-fill-default); color: var(--tc-text-muted); }
.ui-cch__actions { display: inline-flex; align-items: center; gap: var(--tc-space-1); }
.ui-cch__icon-btn { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-cch__icon-btn:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-cch__reveal[aria-pressed="true"] { color: var(--tc-text-primary); }
.ui-cch__action { display: inline-flex; align-items: center; height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm) !important; border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-font-size-sm); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-cch__action:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-cch__empty { padding: var(--tc-space-6) var(--tc-space-4) !important; color: var(--tc-text-muted); text-align: center; }
@container (max-width: 520px) {
  .ui-cch__row { grid-template-columns: minmax(0, 1fr) auto; }
  .ui-cch__pill { grid-column: 1; grid-row: 2; justify-self: start; }
  .ui-cch__actions { grid-column: 2; grid-row: 1 / span 2; }
}
@media (forced-colors: active) { .ui-cch__pill { border: 1px solid CanvasText; } }
@media (prefers-reduced-motion: reduce) {
  [data-ui="cch"] *, [data-ui="cch"] *::before, [data-ui="cch"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-contact-channels")) customElements.define("tc-contact-channels", TcContactChannels);

declare global {
  interface HTMLElementTagNameMap {
    "tc-contact-channels": TcContactChannels;
  }
}
