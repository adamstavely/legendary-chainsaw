import { html, nothing, svg, type PropertyValues, type SVGTemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { copyText, formatDate } from "./internal/util";
import { hushTip, unhushTip } from "./internal/trigger-tip";

/*
 * <tc-api-keys> – the API keys of a workspace or an account: each key's name, its masked value ("tc_live_…a91f"), what
 * it may do, who made it and when, when it was last used, and where it stands – Active, Expires in 5 days, Expired or
 * Revoked – in words as well as colour.
 *   · Create key opens a form in place: a name, the permissions (`scopes`) and how long it lasts (`expiryOptions`).
 *     Creating fires tc-key-create; the page makes the key and sets `revealed` to `{ id, secret }`, and the secret shows
 *     once, in a panel with Copy and "You won't be able to see this key again". Done fires tc-reveal-dismiss and hides it
 *   · Revoke asks in place – "Apps using it stop working at once" – then fires tc-key-revoke with the keys as they'd be
 *   · revoked and expired keys fold away under "Inactive keys (n)"
 *   · times are epoch ms; the element reads the clock when it updates unless `now` is given
 * It only shows and asks: the server makes, stores and checks keys. The full secret is never kept after Done.
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-api-keys .keys=${keys} .scopes=${scopes}></tc-api-keys>
 */


/* Lucide (ISC, lucide.dev): eye, eye-off, copy, check */
const EYE = svg`<path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"></path><circle cx="12" cy="12" r="3"></circle>`;
const EYE_OFF = svg`<path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c4.7 0 8.7 3 9.94 6.65a1 1 0 0 1 0 .7 10.75 10.75 0 0 1-1.44 2.49"></path><path d="M14.08 14.16a3 3 0 0 1-4.24-4.24"></path><path d="M17.48 17.5A10.75 10.75 0 0 1 2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 4.45-5.14"></path><path d="m2 2 20 20"></path>`;
const COPY = svg`<rect width="14" height="14" x="8" y="8" rx="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>`;
const CHECK = svg`<path d="M20 6 9 17l-5-5"></path>`;
export type ApiKey = {
  id: string;
  name: string;
  /** The start of the key that's safe to show, e.g. "tc_live_" */
  prefix: string;
  /** Its last four characters, shown after the prefix */
  last4?: string;
  /** Epoch ms */
  createdAt: number;
  createdBy?: string;
  /** Epoch ms; none means it's never been used */
  lastUsedAt?: number;
  /** Epoch ms; none means it doesn't expire */
  expiresAt?: number;
  /** The ids of the scopes it has */
  scopes?: string[];
  /** Epoch ms, once revoked */
  revokedAt?: number;
};
export type ApiKeyScope = { id: string; label: string; description?: string };
/** How long a new key lasts: days, or null for never */
export type ApiKeyExpiryOption = { days: number | null; label: string };
export type ApiKeyStatus = "active" | "expiring" | "expired" | "revoked";
/** A new key's secret, shown once */
export type ApiKeyReveal = { id: string; secret: string };
export type ApiKeyCreate = { name: string; scopes: string[]; expiresIn: number | null };
export type ApiKeyRevoke = { id: string; keys: ApiKey[] };
export type ApiKeyRevealDismiss = { id: string };
export type ApiKeyCopy = { id: string };

/** The element's words, every one renameable through `labels` */
export type ApiKeysLabels = {
  heading: string;
  create: string;
  /** {n} */
  count: string;
  active: string;
  /** {n} */
  expiresIn: string;
  expiresToday: string;
  expiresTomorrow: string;
  expired: string;
  revoked: string;
  /** {date} */
  expiresOn: string;
  noExpiry: string;
  /** {name} and {date} */
  created: string;
  /** {date} */
  createdOn: string;
  /** {when} */
  lastUsed: string;
  neverUsed: string;
  revoke: string;
  keep: string;
  confirmRevoke: string;
  /** {n} */
  inactive: string;
  name: string;
  namePlaceholder: string;
  nameRequired: string;
  permissions: string;
  noPermissions: string;
  expires: string;
  submit: string;
  cancel: string;
  newKey: string;
  revealNote: string;
  copy: string;
  copied: string;
  copyFailed: string;
  show: string;
  hide: string;
  copyKey: string;
  /** {last4} */
  maskedKey: string;
  loading: string;
  loadFailed: string;
  done: string;
  empty: string;
  emptyHint: string;
  /** {name} */
  announceRevoked: string;
  announceCopied: string;
};
export const defaultApiKeysLabels: ApiKeysLabels = {
  heading: "API keys",
  create: "Create key",
  count: "{n} active",
  active: "Active",
  expiresIn: "Expires in {n} days",
  expiresToday: "Expires today",
  expiresTomorrow: "Expires tomorrow",
  expired: "Expired",
  revoked: "Revoked",
  expiresOn: "Expires {date}",
  noExpiry: "Doesn't expire",
  created: "Made by {name}, {date}",
  createdOn: "Made {date}",
  lastUsed: "Last used {when}",
  neverUsed: "Never used",
  revoke: "Revoke",
  keep: "Keep",
  confirmRevoke: "Apps using it stop working at once.",
  inactive: "Inactive keys ({n})",
  name: "Name",
  namePlaceholder: "What uses this key",
  nameRequired: "Give the key a name.",
  permissions: "Permissions",
  noPermissions: "No permissions",
  expires: "Expires",
  submit: "Create key",
  cancel: "Cancel",
  newKey: "Your new key",
  revealNote: "Copy it now – you won't be able to see this key again.",
  copy: "Copy",
  copied: "Copied",
  copyFailed: "Couldn't copy the key. Select it and copy it yourself.",
  show: "Show key",
  hide: "Hide key",
  copyKey: "Copy key",
  maskedKey: "Key hidden, ends in {last4}",
  loading: "Loading…",
  loadFailed: "Couldn't load the key. Try again.",
  done: "Done",
  empty: "No API keys yet.",
  emptyHint: "Create one to connect another app.",
  announceRevoked: "Revoked {name}",
  announceCopied: "Copied the key",
};
export const defaultApiKeyExpiryOptions: ApiKeyExpiryOption[] = [
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
  { days: 365, label: "1 year" },
  { days: null, label: "Never" },
];

/** A key: Lucide (ISC, lucide.dev) */
const ICON = svg`<path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"></path><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"></circle>`;
const CHEVRON = svg`<path d="m9 18 6-6-6-6"></path>`;
const DAY = 86_400_000;
let instances = 0;

/** Where a key stands at `now`, and – when it's expiring – in how many days */
export function apiKeyStatus(key: Pick<ApiKey, "revokedAt" | "expiresAt">, now: number, warnDays = 14): { status: ApiKeyStatus; days?: number } {
  if (key.revokedAt !== undefined) return { status: "revoked" };
  if (key.expiresAt === undefined) return { status: "active" };
  if (key.expiresAt <= now) return { status: "expired" };
  const days = Math.floor((key.expiresAt - now) / DAY);
  return days < warnDays ? { status: "expiring", days } : { status: "active" };
}

/** "3 days ago", "in 2 hours", "just now" */
export function apiKeyRelative(ms: number, now: number, locale?: string) {
  const d = ms - now;
  const a = Math.abs(d);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (a < 60_000) return rtf.format(0, "second");
  if (a < 3_600_000) return rtf.format(Math.round(d / 60_000), "minute");
  if (a < DAY) return rtf.format(Math.round(d / 3_600_000), "hour");
  if (a < 30 * DAY) return rtf.format(Math.round(d / DAY), "day");
  if (a < 365 * DAY) return rtf.format(Math.round(d / (30 * DAY)), "month");
  return rtf.format(Math.round(d / (365 * DAY)), "year");
}

/**
 * A workspace's API keys: masked values, permissions, last use and status in words, with Create key (the secret shown
 * once) and Revoke.
 * @tag tc-api-keys
 * @fires tc-key-create - Create key was submitted ({ name, scopes, expiresIn }: ApiKeyCreate); cancelable – prevented, the form stays open. The page makes the key and sets `revealed`
 * @fires tc-key-revoke - Revoke was confirmed ({ id, keys }: ApiKeyRevoke) with the keys as they'd be; cancelable – prevented, `keys` stays as it was
 * @fires tc-reveal-dismiss - Done was pressed on the new key's secret ({ id }: ApiKeyRevealDismiss); cancelable – prevented, the secret stays showing
 * @fires tc-copy - Copy was pressed on a key's secret – the new key's, or a key's own with `loadSecret` ({ id }: ApiKeyCopy); cancelable – prevented, nothing is written to the clipboard
 */
export class TcApiKeys extends TcElement {
  static override ui = "akm";

  /** The heading; by default "API keys" */
  @property() accessor heading = "";
  /** A line under the heading, such as what the keys reach */
  @property() accessor description: string | undefined = undefined;
  /** The keys. A revoke changes it unless a tc-key-revoke listener calls preventDefault() */
  @property({ attribute: false }) accessor keys: ApiKey[] = [];
  /** The permissions a key can have, offered as checkboxes when creating one */
  @property({ attribute: false }) accessor scopes: ApiKeyScope[] = [];
  /** How long a new key can last; by default 30 days, 90 days, 1 year and Never */
  @property({ attribute: false }) accessor expiryOptions: ApiKeyExpiryOption[] = defaultApiKeyExpiryOptions;
  /** The expiry picked when the form opens, in days or null; by default 90 */
  @property({ attribute: false }) accessor defaultExpiry: number | null = 90;
  /** A new key's secret to show once, set by the page after tc-key-create; cleared by Done unless a tc-reveal-dismiss listener calls preventDefault() */
  @property({ attribute: false }) accessor revealed: ApiKeyReveal | null = null;
  /** How many days before expiry a key says "Expires in n days" in warning colours */
  @property({ type: Number, attribute: "warn-days" }) accessor warnDays = 14;
  /** Hides Create key, for people who may only look */
  @property({ type: Boolean, attribute: "read-only" }) accessor readOnly = false;
  /** "Now" in epoch ms; unset, the clock's */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** The locale for dates and relative times */
  @property() accessor locale: string | undefined = undefined;
  /** Rename any of the words */
  @property({ attribute: false }) accessor labels: Partial<ApiKeysLabels> = {};
  /**
   * Fetches a key's full secret, for a service that can show keys again (publishable or test keys, or behind a
   * password check). Given, each active key gets Show / Hide and Copy, and the secret is fetched only when asked for.
   * Unset, keys stay masked – the secret shows once, when it's made
   */
  @property({ attribute: false }) accessor loadSecret: ((id: string) => Promise<string> | string) | undefined = undefined;
  /** Seconds a shown secret stays before it's masked again; 0 keeps it until Hide (default 30) */
  @property({ type: Number, attribute: "hide-after" }) accessor hideAfter = 30;

  @state() private accessor creating = false;
  @state() private accessor draftName = "";
  @state() private accessor draftScopes: string[] = [];
  @state() private accessor draftExpiry: number | null = 90;
  @state() private accessor nameError = false;
  @state() private accessor confirming: string | null = null;
  @state() private accessor showInactive = false;
  @state() private accessor copied = false;
  /** Secrets fetched with loadSecret, by key id – kept only while shown, or for one Copy */
  @state() private accessor shown = new Map<string, string>();
  @state() private accessor loadingId: string | null = null;
  @state() private accessor copiedId: string | null = null;
  private hideTimers = new Map<string, ReturnType<typeof setTimeout>>();
  @state() private accessor announce = "";
  private clock = 0;
  private readonly uid = `tc-akm-${++instances}`;

  private get words(): ApiKeysLabels {
    return { ...defaultApiKeysLabels, ...this.labels };
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    this.clock = this.now ?? Date.now();
    if (changed.has("revealed")) this.copied = false;
  }

  private date(ms: number) {
    return formatDate(ms, this.locale, { dateStyle: "medium" });
  }

  private focusOn(selector: string) {
    this.updateComplete.then(() => this.querySelector<HTMLElement>(selector)?.focus());
  }

  private openForm() {
    this.creating = true;
    this.draftName = "";
    this.draftScopes = [];
    this.draftExpiry = this.expiryOptions.some((o) => o.days === this.defaultExpiry) ? this.defaultExpiry : (this.expiryOptions[0]?.days ?? null);
    this.nameError = false;
    this.focusOn(".ui-akm__name-input");
  }

  private closeForm() {
    this.creating = false;
    this.focusOn(".ui-akm__create");
  }

  private submit(e: Event) {
    e.preventDefault();
    const name = this.draftName.trim();
    if (!name) {
      this.nameError = true;
      this.focusOn(".ui-akm__name-input");
      return;
    }
    if (!this.emit<ApiKeyCreate>("tc-key-create", { name, scopes: [...this.draftScopes], expiresIn: this.draftExpiry }, { cancelable: true })) return;
    this.creating = false;
    this.focusOn(".ui-akm__create");
  }

  private revoke(key: ApiKey) {
    this.confirming = null;
    const keys = this.keys.map((k) => (k.id === key.id ? { ...k, revokedAt: this.clock } : k));
    if (!this.emit<ApiKeyRevoke>("tc-key-revoke", { id: key.id, keys }, { cancelable: true })) {
      this.focusOn(`[data-key="${CSS.escape(key.id)}"] .ui-akm__revoke`);
      return;
    }
    this.keys = keys;
    this.announce = this.words.announceRevoked.replace("{name}", key.name);
    this.focusOn(".ui-akm__create, .ui-akm__inactive-toggle");
  }

  private async copySecret() {
    const r = this.revealed;
    if (!r) return;
    if (!this.emit<ApiKeyCopy>("tc-copy", { id: r.id }, { cancelable: true })) return;
    const w = this.words;
    if (await copyText(r.secret)) {
      this.copied = true;
      this.announce = w.announceCopied;
    } else this.announce = w.copyFailed;
  }

  /** A key's secret through loadSecret; null when it couldn't be loaded */
  private async fetchSecret(id: string): Promise<string | null> {
    const have = this.shown.get(id);
    if (have !== undefined) return have;
    if (!this.loadSecret) return null;
    this.loadingId = id;
    try {
      const secret = await this.loadSecret(id);
      return typeof secret === "string" && secret ? secret : null;
    } catch {
      return null;
    } finally {
      if (this.loadingId === id) this.loadingId = null;
    }
  }

  private hideSecret(id: string) {
    clearTimeout(this.hideTimers.get(id));
    this.hideTimers.delete(id);
    if (!this.shown.has(id)) return;
    const next = new Map(this.shown);
    next.delete(id);
    this.shown = next;
  }

  private async toggleSecret(key: ApiKey) {
    if (this.shown.has(key.id)) {
      this.hideSecret(key.id);
      return;
    }
    const secret = await this.fetchSecret(key.id);
    if (secret === null) {
      this.announce = this.words.loadFailed;
      return;
    }
    this.shown = new Map(this.shown).set(key.id, secret);
    if (this.hideAfter > 0) this.hideTimers.set(key.id, setTimeout(() => this.hideSecret(key.id), this.hideAfter * 1000));
  }

  private async copyKey(key: ApiKey) {
    const w = this.words;
    const secret = await this.fetchSecret(key.id);
    if (secret === null) {
      this.announce = w.loadFailed;
      return;
    }
    if (!this.emit<ApiKeyCopy>("tc-copy", { id: key.id }, { cancelable: true })) return;
    if (await copyText(secret)) {
      this.copiedId = key.id;
      this.announce = w.announceCopied;
    } else this.announce = w.copyFailed;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    for (const t of this.hideTimers.values()) clearTimeout(t);
    this.hideTimers.clear();
    this.shown = new Map();
  }

  /** An icon-only button named by its words and the key's name, with those words as a small tooltip */
  private iconButton(cls: string, words: string, name: string, icon: SVGTemplateResult, click: () => void, busy = false, done = false) {
    return html`<button type="button" class=${`ui-akm__key-btn ${cls}`} aria-label=${`${words}, ${name}`} aria-busy=${busy ? "true" : "false"} ?disabled=${busy} ?data-done=${done}
      @click=${click} @keydown=${hushTip} @pointerenter=${unhushTip} @focus=${unhushTip}>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${icon}</svg><span class="ui-akm__tip" aria-hidden="true">${words}</span>
    </button>`;
  }

  private dismiss() {
    const r = this.revealed;
    if (!r) return;
    if (!this.emit<ApiKeyRevealDismiss>("tc-reveal-dismiss", { id: r.id }, { cancelable: true })) return;
    this.revealed = null;
    this.focusOn(".ui-akm__create");
  }

  private statusText(key: ApiKey) {
    const w = this.words;
    const s = apiKeyStatus(key, this.clock, this.warnDays);
    if (s.status === "expiring") return { ...s, text: s.days === 0 ? w.expiresToday : s.days === 1 ? w.expiresTomorrow : w.expiresIn.replace("{n}", String(s.days)) };
    return { ...s, text: w[s.status] };
  }

  private renderForm() {
    const w = this.words;
    const nameId = `${this.uid}-name`;
    const errId = `${this.uid}-name-error`;
    return html`<form class="ui-akm__form" aria-label=${w.create} novalidate @submit=${(e: Event) => this.submit(e)} @keydown=${(e: KeyboardEvent) => e.key === "Escape" && this.closeForm()}>
      <div class="ui-akm__field">
        <label class="ui-akm__label" for=${nameId}>${w.name}</label>
        <input
          id=${nameId}
          class="ui-akm__input ui-akm__name-input"
          type="text"
          autocomplete="off"
          required
          placeholder=${w.namePlaceholder}
          aria-invalid=${this.nameError ? "true" : "false"}
          aria-describedby=${this.nameError ? errId : nothing}
          .value=${live(this.draftName)}
          @input=${(e: Event) => {
            this.draftName = (e.target as HTMLInputElement).value;
            if (this.draftName.trim()) this.nameError = false;
          }}
        />
        ${this.nameError ? html`<p class="ui-akm__error" id=${errId}>${w.nameRequired}</p>` : nothing}
      </div>
      ${this.scopes.length
        ? html`<fieldset class="ui-akm__group">
            <legend class="ui-akm__label">${w.permissions}</legend>
            ${this.scopes.map(
              (s) => html`<label class="ui-akm__check">
                <input
                  type="checkbox"
                  .checked=${live(this.draftScopes.includes(s.id))}
                  @change=${(e: Event) => {
                    const on = (e.target as HTMLInputElement).checked;
                    this.draftScopes = on ? [...this.draftScopes, s.id] : this.draftScopes.filter((x) => x !== s.id);
                  }}
                />
                <span class="ui-akm__check-text"><span class="ui-akm__scope-id">${s.label}</span>${s.description ? html`<span class="ui-akm__hint">${s.description}</span>` : nothing}</span>
              </label>`,
            )}
          </fieldset>`
        : nothing}
      <fieldset class="ui-akm__group">
        <legend class="ui-akm__label">${w.expires}</legend>
        <div class="ui-akm__expiry">
          ${this.expiryOptions.map(
            (o) => html`<label class="ui-akm__radio">
              <input type="radio" name=${`${this.uid}-expiry`} .checked=${live(this.draftExpiry === o.days)} @change=${() => (this.draftExpiry = o.days)} />
              <span>${o.label}</span>
            </label>`,
          )}
        </div>
      </fieldset>
      <div class="ui-akm__form-actions">
        <button type="button" class="tc-btn-sm ui-akm__cancel" @click=${() => this.closeForm()}>${w.cancel}</button>
        <button type="submit" class="tc-btn-sm ui-akm__submit">${w.submit}</button>
      </div>
    </form>`;
  }

  private renderReveal(r: ApiKeyReveal) {
    const w = this.words;
    const key = this.keys.find((k) => k.id === r.id);
    const titleId = `${this.uid}-reveal`;
    return html`<section class="ui-akm__reveal" aria-labelledby=${titleId}>
      <p class="ui-akm__reveal-title" id=${titleId}>${w.newKey}${key ? html` · <span class="ui-akm__reveal-name">${key.name}</span>` : nothing}</p>
      <code class="ui-akm__secret">${r.secret}</code>
      <p class="ui-akm__reveal-note">${w.revealNote}</p>
      <div class="ui-akm__reveal-actions">
        <button type="button" class="tc-btn-sm ui-akm__copy" @click=${() => this.copySecret()}>${this.copied ? w.copied : w.copy}<span class="tc-sr-only">, ${w.newKey}</span></button>
        <button type="button" class="tc-btn-sm ui-akm__done" @click=${() => this.dismiss()}>${w.done}</button>
      </div>
    </section>`;
  }

  private renderRow(key: ApiKey) {
    const w = this.words;
    const s = this.statusText(key);
    const live_ = s.status === "active" || s.status === "expiring";
    const scopes = (key.scopes ?? []).map((id) => this.scopes.find((x) => x.id === id)?.label ?? id);
    return html`<li class="ui-akm__row" data-key=${key.id} data-status=${s.status}>
      <div class="ui-akm__top">
        <div class="ui-akm__who">
          <span class="ui-akm__name">${key.name}</span>
          <div class="ui-akm__keybox" ?data-shown=${this.shown.has(key.id)}>
            ${this.shown.has(key.id)
              ? html`<code class="ui-akm__plain">${this.shown.get(key.id)}</code>`
              : html`<code class="ui-akm__masked"><span aria-hidden="true">${"•".repeat(24)}</span><span class="tc-sr-only">${w.maskedKey.replace("{last4}", key.last4 ?? "")}</span></code>`}
          ${this.loadSecret && live_
            ? html`<span class="ui-akm__key-actions">
                ${this.iconButton("ui-akm__show", this.loadingId === key.id ? w.loading : this.shown.has(key.id) ? w.hide : w.show, key.name, this.shown.has(key.id) ? EYE_OFF : EYE, () => this.toggleSecret(key), this.loadingId === key.id)}
                ${this.iconButton("ui-akm__copy-key", this.copiedId === key.id ? w.copied : w.copyKey, key.name, this.copiedId === key.id ? CHECK : COPY, () => this.copyKey(key), false, this.copiedId === key.id)}
              </span>`
            : nothing}
          </div>
        </div>
        <span class="ui-akm__status" data-status=${s.status}><span class="ui-akm__dot" aria-hidden="true"></span>${s.text}</span>
      </div>
      <ul class="ui-akm__scopes" aria-label=${w.permissions}>
        ${scopes.length ? scopes.map((sc) => html`<li class="ui-akm__chip">${sc}</li>`) : html`<li class="ui-akm__chip" data-none>${w.noPermissions}</li>`}
      </ul>
      <ul class="ui-akm__facts">
        <li>${key.createdBy ? w.created.replace("{name}", key.createdBy).replace("{date}", this.date(key.createdAt)) : w.createdOn.replace("{date}", this.date(key.createdAt))}</li>
        <li>${key.lastUsedAt !== undefined ? w.lastUsed.replace("{when}", apiKeyRelative(key.lastUsedAt, this.clock, this.locale)) : w.neverUsed}</li>
        ${live_ && s.status !== "expiring" ? html`<li>${key.expiresAt !== undefined ? w.expiresOn.replace("{date}", this.date(key.expiresAt)) : w.noExpiry}</li>` : nothing}
      </ul>
      ${this.confirming === key.id
        ? html`<div class="ui-akm__confirm" role="group" aria-label=${`${w.revoke}, ${key.name}`}>
            <span>${w.confirmRevoke}</span>
            <button type="button" class="tc-btn-sm ui-akm__keep" @click=${() => {
              this.confirming = null;
              this.focusOn(`[data-key="${CSS.escape(key.id)}"] .ui-akm__revoke`);
            }}>${w.keep}</button>
            <button type="button" class="tc-btn-sm ui-akm__confirm-revoke" @click=${() => this.revoke(key)}>${w.revoke}<span class="tc-sr-only">, ${key.name}</span></button>
          </div>`
        : live_ && !this.readOnly
          ? html`<div class="ui-akm__actions">
              <button type="button" class="tc-btn-sm ui-akm__revoke" @click=${() => {
                this.confirming = key.id;
                this.focusOn(`[data-key="${CSS.escape(key.id)}"] .ui-akm__keep`);
              }}>${w.revoke}<span class="tc-sr-only">, ${key.name}</span></button>
            </div>`
          : nothing}
    </li>`;
  }

  protected override render() {
    const w = this.words;
    const titleId = `${this.uid}-title`;
    const listId = `${this.uid}-inactive`;
    const active = this.keys.filter((k) => {
      const s = apiKeyStatus(k, this.clock, this.warnDays).status;
      return s === "active" || s === "expiring";
    });
    const inactive = this.keys.filter((k) => !active.includes(k));
    const r = this.revealed;
    return html`${cardHead({
        icon: ICON,
        title: this.heading || w.heading,
        subtitle: this.description,
        id: titleId,
        aside: this.readOnly
          ? html`<span class="ui-akm__count">${w.count.replace("{n}", String(active.length))}</span>`
          : html`<button type="button" class="tc-btn-sm ui-akm__create" aria-expanded=${this.creating ? "true" : "false"} @click=${() => (this.creating ? this.closeForm() : this.openForm())}>${w.create}</button>`,
      })}
      <div class="ui-akm__card">
        ${r ? this.renderReveal(r) : nothing}
        ${this.creating ? this.renderForm() : nothing}
        ${active.length
          ? html`<ul class="ui-akm__list" aria-labelledby=${titleId}>${repeat(active, (k) => k.id, (k) => this.renderRow(k))}</ul>`
          : !this.creating && !inactive.length
            ? html`<div class="ui-akm__empty">
                <p>${w.empty}</p>
                ${this.readOnly ? nothing : html`<p class="ui-akm__hint">${w.emptyHint}</p>`}
              </div>`
            : nothing}
        ${inactive.length
          ? html`<div class="ui-akm__inactive">
              <button type="button" class="ui-akm__inactive-toggle" aria-expanded=${this.showInactive ? "true" : "false"} aria-controls=${listId} @click=${() => (this.showInactive = !this.showInactive)}>
                <svg class="ui-akm__chevron" viewBox="0 0 24 24" aria-hidden="true">${CHEVRON}</svg>${w.inactive.replace("{n}", String(inactive.length))}
              </button>
              <ul class="ui-akm__list" id=${listId} ?hidden=${!this.showInactive}>${repeat(inactive, (k) => k.id, (k) => this.renderRow(k))}</ul>
            </div>`
          : nothing}
      </div>
      <span class="tc-sr-only" role="status">${this.announce}</span>`;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="akm"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="akm"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
[data-ui="akm"] *, [data-ui="akm"] *::before, [data-ui="akm"] *::after { box-sizing: border-box; }
[data-ui="akm"] :where(p, ul, fieldset) { margin: 0; }
[data-ui="akm"] :where(ul) { padding: 0; list-style: none; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="akm"] .ui-akm__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); overflow: hidden; }
.ui-akm__count { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; }
.ui-akm__list { display: grid; }
.ui-akm__list[hidden] { display: none; }
.ui-akm__row { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-4); }
.ui-akm__list > .ui-akm__row:not(:first-child), .ui-akm__form + .ui-akm__list > .ui-akm__row:first-child, .ui-akm__reveal + .ui-akm__list > .ui-akm__row:first-child { box-shadow: inset 0 var(--tc-hairline) var(--tc-border-subtle); }
.ui-akm__top { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--tc-space-3); }
.ui-akm__who { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-akm__name { font-weight: var(--tc-font-weight-medium); overflow-wrap: anywhere; }
.ui-akm__plain { color: var(--tc-text-primary); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); overflow-wrap: anywhere; }
.ui-akm__key-actions { display: inline-flex; flex: none; gap: var(--tc-space-0-5); }
/* The key in a box, like a password field: dots while hidden, the secret when shown, its buttons inside on the right */
.ui-akm__keybox { display: flex; align-items: center; gap: var(--tc-space-2); max-width: calc(var(--tc-space-16) * 6); min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-0-5) 0 var(--tc-space-2-5); border: var(--tc-hairline) solid var(--tc-border-default); border-radius: var(--tc-control-radius-sm); background: var(--tc-field-bg-sunken); }
.ui-akm__keybox > code { flex: 1 1 auto; min-width: 0; padding: var(--tc-space-1) 0; }
.ui-akm__keybox .ui-akm__masked span[aria-hidden] { letter-spacing: var(--tc-space-0-5); color: var(--tc-text-secondary); white-space: nowrap; overflow: hidden; display: block; }
.ui-akm__key-btn { position: relative; display: inline-grid; place-items: center; width: var(--tc-space-6); height: var(--tc-space-6); margin: 0; padding: 0; border: 0; border-radius: var(--tc-control-radius-sm); background: transparent; color: var(--tc-text-secondary); cursor: pointer; }
.ui-akm__key-btn svg { width: var(--tc-space-3-5); height: var(--tc-space-3-5); fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ui-akm__key-btn:hover { background: var(--tc-surface-tray); color: var(--tc-text-primary); }
.ui-akm__key-btn[data-done] { color: var(--tc-status-success-fg); }
.ui-akm__tip { position: absolute; top: calc(100% + var(--tc-space-1)); left: 50%; z-index: var(--tc-z-dropdown); width: max-content; padding: var(--tc-tooltip-py) var(--tc-tooltip-px); border-radius: var(--tc-tooltip-radius); background: var(--tc-tooltip-bg); color: var(--tc-tooltip-fg); font-family: var(--tc-font-sans); font-size: var(--tc-tooltip-font-size); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); white-space: nowrap; pointer-events: none; visibility: hidden; opacity: 0; transform: translate(-50%, -2px); transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-base) var(--tc-ease-move), visibility 0s linear var(--tc-duration-base); }
.ui-akm__key-btn:focus-visible:not([data-hush]) .ui-akm__tip { visibility: visible; opacity: 1; transform: translateX(-50%); transition-delay: 0ms; }
@media (hover: hover) {
  .ui-akm__key-btn:hover:not([data-hush]) .ui-akm__tip { visibility: visible; opacity: 1; transform: translateX(-50%); transition-delay: var(--tc-duration-slower); }
}
.ui-akm__key-btn:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-akm__key-btn:disabled { color: var(--tc-text-secondary); cursor: progress; }
.ui-akm__masked { color: var(--tc-text-secondary); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); overflow-wrap: anywhere; }
.ui-akm__status { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1-5); color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-akm__dot { width: var(--tc-space-1-5); height: var(--tc-space-1-5); border-radius: var(--tc-radius-full); background: currentColor; }
.ui-akm__status[data-status="active"] { color: var(--tc-status-success-fg); }
.ui-akm__status[data-status="expiring"] { color: var(--tc-status-warning-fg); }
.ui-akm__status[data-status="revoked"] { color: var(--tc-status-danger-fg); }
.ui-akm__row[data-status="revoked"] .ui-akm__name, .ui-akm__row[data-status="expired"] .ui-akm__name { color: var(--tc-text-secondary); }
.ui-akm__scopes { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); }
.ui-akm__chip { padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-sm); background: var(--tc-fill-hover); color: var(--tc-text-primary); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-relaxed); }
.ui-akm__chip[data-none] { font-family: var(--tc-font-sans); color: var(--tc-text-secondary); }
.ui-akm__facts { display: flex; flex-wrap: wrap; gap: var(--tc-space-0-5) var(--tc-space-3); color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); }
.ui-akm__actions, .ui-akm__reveal-actions, .ui-akm__form-actions { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); }
.ui-akm__form-actions { justify-content: flex-end; }
.ui-akm__revoke, .ui-akm__confirm-revoke { color: var(--tc-status-danger-fg); }
.ui-akm__confirm { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); padding: var(--tc-space-2) var(--tc-space-3); border-radius: var(--tc-control-radius-md); background: var(--tc-fill-hover); }
.ui-akm__confirm > span { flex: 1 1 14em; }
.ui-akm__form { display: grid; gap: var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-4); background: var(--tc-fill-hover); }
.ui-akm__field, .ui-akm__group { display: grid; gap: var(--tc-space-1-5); min-width: 0; padding: 0; border: 0; }
.ui-akm__label { padding: 0; color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-akm__input { height: var(--tc-field-h-sm); padding: 0 var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); color: var(--tc-text-primary); font: inherit; }
.ui-akm__input:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-akm__input:focus { outline: 0; box-shadow: var(--tc-field-shadow-focus); }
.ui-akm__input[aria-invalid="true"] { box-shadow: var(--tc-field-shadow-invalid); }
.ui-akm__error { color: var(--tc-status-danger-fg); font-size: var(--tc-font-size-xs); }
.ui-akm__check, .ui-akm__radio { display: flex; align-items: flex-start; gap: var(--tc-space-2); min-height: var(--tc-control-h-sm); cursor: pointer; }
.ui-akm__check input, .ui-akm__radio input { flex: none; margin: var(--tc-space-1) 0 0; accent-color: var(--tc-action-primary-bg); }
.ui-akm__check-text { display: grid; gap: var(--tc-space-0-5); padding-top: var(--tc-space-0-5); }
.ui-akm__scope-id { font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); }
.ui-akm__hint { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); }
.ui-akm__expiry { display: flex; flex-wrap: wrap; gap: 0 var(--tc-space-4); }
.ui-akm__radio { align-items: center; }
.ui-akm__radio input { margin: 0; }
.ui-akm__submit, .ui-akm__done { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-akm__submit:hover, .ui-akm__done:hover { background: var(--tc-action-primary-bg-hover); box-shadow: var(--tc-action-primary-shadow); }
.ui-akm__reveal { display: grid; gap: var(--tc-space-2); margin: var(--tc-space-3) var(--tc-space-4); padding: var(--tc-space-3); border-radius: var(--tc-control-radius-md); background: var(--tc-status-warning-bg); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-status-warning-border); }
.ui-akm__reveal-title { font-weight: var(--tc-font-weight-medium); }
.ui-akm__reveal-name { font-weight: var(--tc-font-weight-regular); }
.ui-akm__secret { display: block; padding: var(--tc-space-2) var(--tc-space-2-5); border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); overflow-wrap: anywhere; user-select: all; }
.ui-akm__reveal-note { color: var(--tc-status-warning-fg); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-akm__inactive { padding: var(--tc-space-1) 0; box-shadow: inset 0 var(--tc-hairline) var(--tc-border-subtle); }
.ui-akm__list:first-child + .ui-akm__inactive, .ui-akm__card > .ui-akm__inactive:first-child { box-shadow: none; }
.ui-akm__inactive-toggle { display: inline-flex; align-items: center; gap: var(--tc-space-1); min-height: var(--tc-control-h-sm); margin: 0 var(--tc-space-2); padding: 0 var(--tc-space-2); border: 0; border-radius: var(--tc-control-radius-sm); background: transparent; color: var(--tc-text-secondary); font: inherit; font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); cursor: pointer; }
.ui-akm__inactive-toggle:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-akm__chevron { width: var(--tc-space-3-5); height: var(--tc-space-3-5); fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; transition: transform var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-akm__inactive-toggle[aria-expanded="true"] .ui-akm__chevron { transform: rotate(90deg); }
.ui-akm__inactive .ui-akm__row { box-shadow: inset 0 var(--tc-hairline) var(--tc-border-subtle); }
.ui-akm__empty { display: grid; gap: var(--tc-space-1); padding: var(--tc-space-6) var(--tc-space-4); color: var(--tc-text-secondary); text-align: center; }
[data-ui="akm"] :is(button, input):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
@container (max-width: 420px) {
  .ui-akm__top { flex-direction: column; gap: var(--tc-space-1); }
}
@media (prefers-reduced-motion: reduce) { .ui-akm__chevron { transition: none; } }
@media (forced-colors: active) { .ui-akm__dot { forced-color-adjust: none; background: CanvasText; } }
`;
}

if (!customElements.get("tc-api-keys")) customElements.define("tc-api-keys", TcApiKeys);

declare global {
  interface HTMLElementTagNameMap {
    "tc-api-keys": TcApiKeys;
  }
}
