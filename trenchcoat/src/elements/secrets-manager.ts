import { html, nothing, svg } from "lit";
import { property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { formatDate } from "./internal/util";
import "./secret-field";

/*
 * <tc-secrets-manager> – the secrets agents use: API keys, tokens and passwords, by name and scope. Secrets an agent
 * needs that aren't set yet come first, under Missing, with the agents that need them; then the rest, expired and
 * expiring first. Values are write-only: Set or Replace opens a password field, Save hands the value to the page in a
 * cancelable `tc-secret-set` and the element forgets it at once – it never shows a value and never holds one after.
 * Delete asks first and names the agents that will stop working. Add secret takes a new name in UPPER_SNAKE_CASE.
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-secrets-manager .secrets=${secrets} .scopes=${["Workspace", "Invoice matcher"]}></tc-secrets-manager>
 */

export type SecretStatus = "set" | "missing" | "expiring" | "expired";
export type Secret = {
  /** UPPER_SNAKE_CASE, e.g. VENDOR_API_KEY */
  name: string;
  /** "Workspace", or the agent it belongs to */
  scope: string;
  status: SecretStatus;
  /** Epoch ms */
  updatedAt?: number;
  updatedBy?: string;
  /** Epoch ms, for expiring and expired secrets */
  expiresAt?: number;
  /** The agents that use it – or, when it's missing, need it */
  usedBy?: string[];
};
export type SecretSet = { name: string; scope: string; value: string; isNew: boolean };
export type SecretDelete = { name: string; secret: Secret };
export type SecretsChange = { secrets: Secret[]; change: "set" | "add" | "delete"; name: string };

/** The manager's words, every one renameable through `labels` */
export type SecretsManagerLabels = {
  heading: string;
  /** {n} */
  count: string;
  missingGroup: string;
  savedGroup: string;
  set: string;
  missing: string;
  expiring: string;
  expired: string;
  workspace: string;
  /** {date} and {name} */
  updated: string;
  /** {date} */
  updatedOn: string;
  /** {date} */
  expires: string;
  /** {date} */
  expiredOn: string;
  /** {list} */
  usedBy: string;
  /** {list} */
  neededBy: string;
  notUsed: string;
  setNow: string;
  justSet: string;
  setValue: string;
  replace: string;
  delete: string;
  /** {name} */
  valueOf: string;
  save: string;
  cancel: string;
  keep: string;
  /** {name} and {list} */
  confirm: string;
  /** {name} */
  confirmUnused: string;
  add: string;
  addTitle: string;
  name: string;
  nameHint: string;
  nameInvalid: string;
  nameTaken: string;
  scope: string;
  empty: string;
  /** {name} */
  announceSet: string;
  /** {name} */
  announceAdded: string;
  /** {name} */
  announceDeleted: string;
};
export const defaultSecretsManagerLabels: SecretsManagerLabels = {
  heading: "Secrets",
  count: "{n} secrets",
  missingGroup: "Missing",
  savedGroup: "Saved",
  set: "Set",
  missing: "Missing",
  expiring: "Expiring soon",
  expired: "Expired",
  workspace: "Workspace",
  updated: "Updated {date} by {name}",
  updatedOn: "Updated {date}",
  expires: "Expires {date}",
  expiredOn: "Expired {date}",
  usedBy: "Used by {list}",
  neededBy: "Needed by {list}",
  notUsed: "Not used by any agent",
  setNow: "Set",
  justSet: "Updated just now",
  setValue: "Set value",
  replace: "Replace",
  delete: "Delete",
  valueOf: "Value of {name}",
  save: "Save",
  cancel: "Cancel",
  keep: "Keep",
  confirm: "Delete {name}? {list} will stop working until it's set again.",
  confirmUnused: "Delete {name}? No agent uses it.",
  add: "Add secret",
  addTitle: "New secret",
  name: "Name",
  nameHint: "Capital letters, digits and underscores – like VENDOR_API_KEY",
  nameInvalid: "Use capital letters, digits and underscores, starting with a letter.",
  nameTaken: "There's already a secret with this name.",
  scope: "Scope",
  empty: "No secrets yet.",
  announceSet: "Saved {name}",
  announceAdded: "Added {name}",
  announceDeleted: "Deleted {name}",
};

/* After Lucide: key-round */
const ICON = svg`<path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"></path><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"></circle>`;
const NAME = /^[A-Z][A-Z0-9_]*$/;
const ORDER: Record<SecretStatus, number> = { expired: 0, expiring: 1, set: 2, missing: 3 };
let instances = 0;

/** Whether a name is UPPER_SNAKE_CASE */
export const isSecretName = (name: string) => NAME.test(name);

/** "A, B and C" */
const listOf = (items: string[]) => (items.length < 2 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`);

/**
 * Write-only secrets for agents – missing ones first with the agents that need them, set and replace without ever
 * showing a value, delete that names what will break, and new secrets by UPPER_SNAKE name.
 * @tag tc-secrets-manager
 * @fires tc-secret-set - Save or Add was pressed with a value ({ name, scope, value, isNew }: SecretSet); cancelable – prevented, the secret stays as it was. The element forgets the value right after
 * @fires tc-secret-delete - Delete was confirmed ({ name, secret }: SecretDelete); cancelable – prevented, the secret stays
 * @fires tc-secrets-change - The list changed after a set, an add or a delete ({ secrets, change, name }: SecretsChange); cancelable – prevented, `secrets` stays as it was
 */
export class TcSecretsManager extends TcElement {
  static override ui = "sec";

  /** The heading; by default "Secrets" */
  @property() accessor heading = "";
  /** A line under the heading, such as whose secrets these are */
  @property() accessor description: string | undefined = undefined;
  /** The secrets – names, scopes and status, never values. Changed by the user unless tc-secrets-change is prevented */
  @property({ attribute: false }) accessor secrets: Secret[] = [];
  /** The scopes a new secret can have; the first is the default */
  @property({ attribute: false }) accessor scopes: string[] = [];
  /** Offer Add secret */
  @property({ type: Boolean }) accessor creatable = false;
  /** "Now" for an update's date, epoch ms; without it a fresh update says "Updated just now". The element doesn't read the clock */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** Who's making changes – recorded as `updatedBy` */
  @property({ attribute: "current-user" }) accessor currentUser: string | undefined = undefined;
  /** The locale for dates */
  @property() accessor locale: string | undefined = undefined;
  /** Rename any of the words */
  @property({ attribute: false }) accessor labels: Partial<SecretsManagerLabels> = {};

  /** The secret whose value field is open */
  @state() private accessor editing: string | null = null;
  @state() private accessor confirming: string | null = null;
  @state() private accessor adding = false;
  @state() private accessor draft = "";
  @state() private accessor newName = "";
  @state() private accessor newScope = "";
  @state() private accessor nameTouched = false;
  @state() private accessor fresh: ReadonlySet<string> = new Set();
  @state() private accessor announce = "";
  private readonly uid = `tc-sec-${++instances}`;

  private get words(): SecretsManagerLabels {
    return { ...defaultSecretsManagerLabels, ...this.labels };
  }

  private date(ms: number) {
    return formatDate(ms, this.locale, { dateStyle: "medium" });
  }

  private focus_(selector: string) {
    this.updateComplete.then(() => this.querySelector<HTMLElement>(selector)?.focus());
  }

  private rowSel(name: string, cls: string) {
    return `[data-secret="${CSS.escape(name)}"] ${cls}`;
  }

  /** The value the field reports – kept only until Save or Cancel */
  private onValue = (e: CustomEvent<{ value: string }>) => {
    e.stopPropagation();
    this.draft = e.detail.value;
  };

  private commit(secrets: Secret[], change: SecretsChange["change"], name: string, message: string) {
    if (!this.emit<SecretsChange>("tc-secrets-change", { secrets, change, name }, { cancelable: true })) return false;
    this.secrets = secrets;
    this.announce = message;
    return true;
  }

  private stamp(s: Secret): Secret {
    const next: Secret = { ...s, status: "set", expiresAt: undefined };
    if (this.now !== undefined) next.updatedAt = this.now;
    else delete next.updatedAt;
    if (this.currentUser) next.updatedBy = this.currentUser;
    return next;
  }

  private save(secret: Secret) {
    const value = this.draft;
    // Forget it whatever happens next
    this.draft = "";
    this.editing = null;
    if (!value) return this.focus_(this.rowSel(secret.name, ".ui-sec__edit"));
    const set = this.emit<SecretSet>("tc-secret-set", { name: secret.name, scope: secret.scope, value, isNew: false }, { cancelable: true });
    if (set) {
      this.fresh = new Set([...this.fresh, secret.name]);
      const next = this.stamp(secret);
      this.commit(this.secrets.map((s) => (s.name === secret.name ? next : s)), "set", secret.name, this.words.announceSet.replace("{name}", secret.name));
    }
    this.focus_(this.rowSel(secret.name, ".ui-sec__edit"));
  }

  private deleteSecret(secret: Secret) {
    this.confirming = null;
    if (!this.emit<SecretDelete>("tc-secret-delete", { name: secret.name, secret }, { cancelable: true })) return this.focus_(this.rowSel(secret.name, ".ui-sec__delete"));
    const at = this.ordered().findIndex((s) => s.name === secret.name);
    if (this.commit(this.secrets.filter((s) => s.name !== secret.name), "delete", secret.name, this.words.announceDeleted.replace("{name}", secret.name))) {
      const rest = this.ordered();
      const next = rest[Math.min(at, rest.length - 1)];
      this.focus_(next ? this.rowSel(next.name, ".ui-sec__name") : ".ui-sec__add");
    } else this.focus_(this.rowSel(secret.name, ".ui-sec__delete"));
  }

  private nameError() {
    const w = this.words;
    const n = this.newName.trim();
    if (!NAME.test(n)) return w.nameInvalid;
    if (this.secrets.some((s) => s.name === n && s.status !== "missing")) return w.nameTaken;
    return "";
  }

  private openAdd() {
    this.adding = true;
    this.newName = "";
    this.newScope = this.scopes[0] ?? this.words.workspace;
    this.nameTouched = false;
    this.draft = "";
    this.editing = null;
    this.confirming = null;
    this.focus_(".ui-sec__new-name");
  }

  private closeAdd() {
    this.adding = false;
    this.draft = "";
    this.focus_(".ui-sec__add");
  }

  private add() {
    this.nameTouched = true;
    const name = this.newName.trim();
    if (this.nameError()) return this.focus_(".ui-sec__new-name");
    const value = this.draft;
    if (!value) return this.focus_(".ui-sec__new-value input");
    this.draft = "";
    const scope = this.newScope || this.scopes[0] || this.words.workspace;
    if (!this.emit<SecretSet>("tc-secret-set", { name, scope, value, isNew: true }, { cancelable: true })) return this.focus_(".ui-sec__new-name");
    const existing = this.secrets.find((s) => s.name === name);
    const next = this.stamp(existing ? { ...existing, scope } : { name, scope, status: "set", usedBy: [] });
    const secrets = existing ? this.secrets.map((s) => (s.name === name ? next : s)) : [...this.secrets, next];
    this.adding = false;
    this.fresh = new Set([...this.fresh, name]);
    if (this.commit(secrets, "add", name, this.words.announceAdded.replace("{name}", name))) {
      this.focus_(this.rowSel(name, ".ui-sec__name"));
    } else this.focus_(".ui-sec__add");
  }

  /** Missing first, then expired, expiring and set; by name within each */
  private ordered() {
    return [...this.secrets].sort((a, b) => (a.status === "missing" ? -1 : 0) - (b.status === "missing" ? -1 : 0) || ORDER[a.status] - ORDER[b.status] || a.name.localeCompare(b.name));
  }

  private renderRow(s: Secret) {
    const w = this.words;
    const used = s.usedBy ?? [];
    const missing = s.status === "missing";
    const scope = s.scope === "workspace" ? w.workspace : s.scope;
    const facts: string[] = [];
    if (this.fresh.has(s.name) && s.updatedAt === undefined) facts.push(w.justSet);
    else if (s.updatedAt !== undefined) facts.push(s.updatedBy ? w.updated.replace("{date}", this.date(s.updatedAt)).replace("{name}", s.updatedBy) : w.updatedOn.replace("{date}", this.date(s.updatedAt)));
    if (s.expiresAt !== undefined && (s.status === "expiring" || s.status === "expired")) facts.push((s.status === "expired" ? w.expiredOn : w.expires).replace("{date}", this.date(s.expiresAt)));
    const fieldId = `${this.uid}-${s.name}-value`;
    return html`<li class="ui-sec__row" data-secret=${s.name} data-status=${s.status}>
      <div class="ui-sec__top">
        <div class="ui-sec__who">
          <span class="ui-sec__name" tabindex="-1">${s.name}</span>
          <span class="ui-sec__scope">${scope}</span>
        </div>
        <span class="ui-sec__status" data-status=${s.status}><span class="ui-sec__mark" aria-hidden="true"></span>${w[s.status]}</span>
      </div>
      <ul class="ui-sec__facts">
        ${facts.map((f) => html`<li>${f}</li>`)}
        <li class=${missing ? "ui-sec__needed" : ""}>${used.length ? (missing ? w.neededBy : w.usedBy).replace("{list}", listOf(used)) : w.notUsed}</li>
      </ul>
      ${this.editing === s.name
        ? html`<div class="ui-sec__form" role="group" aria-label=${`${missing ? w.setValue : w.replace}, ${s.name}`}>
            <tc-secret-field
              id=${fieldId}
              class="ui-sec__value"
              look=${this.resolvedLook}
              .label=${w.valueOf.replace("{name}", s.name)}
              .value=${live(this.draft)}
              @tc-value-change=${this.onValue}
              @keydown=${(e: KeyboardEvent) => {
                if (e.key === "Enter" && (e.target as HTMLElement).localName === "input") {
                  e.preventDefault();
                  this.save(s);
                } else if (e.key === "Escape") {
                  e.stopPropagation();
                  this.draft = "";
                  this.editing = null;
                  this.focus_(this.rowSel(s.name, ".ui-sec__edit"));
                }
              }}
            ></tc-secret-field>
            <div class="ui-sec__form-actions">
              <button type="button" class="tc-btn-sm ui-sec__cancel" @click=${() => {
                this.draft = "";
                this.editing = null;
                this.focus_(this.rowSel(s.name, ".ui-sec__edit"));
              }}>${w.cancel}</button>
              <button type="button" class="tc-btn-sm ui-sec__save" data-primary ?disabled=${!this.draft} @click=${() => this.save(s)}>${w.save}<span class="tc-sr-only">, ${s.name}</span></button>
            </div>
          </div>`
        : nothing}
      ${this.confirming === s.name
        ? html`<div class="ui-sec__confirm" role="group" aria-label=${`${w.delete}, ${s.name}`}>
            <span>${used.length ? w.confirm.replace("{name}", s.name).replace("{list}", listOf(used)) : w.confirmUnused.replace("{name}", s.name)}</span>
            <button type="button" class="tc-btn-sm ui-sec__keep" @click=${() => {
              this.confirming = null;
              this.focus_(this.rowSel(s.name, ".ui-sec__delete"));
            }}>${w.keep}</button>
            <button type="button" class="tc-btn-sm ui-sec__confirm-delete" @click=${() => this.deleteSecret(s)}>${w.delete}<span class="tc-sr-only">, ${s.name}</span></button>
          </div>`
        : nothing}
      <div class="ui-sec__actions">
        <button
          type="button"
          class="tc-btn-sm ui-sec__edit"
          ?data-primary=${missing}
          aria-expanded=${this.editing === s.name ? "true" : "false"}
          @click=${() => {
            this.confirming = null;
            this.adding = false;
            this.draft = "";
            this.editing = this.editing === s.name ? null : s.name;
            if (this.editing) this.focus_(`#${CSS.escape(fieldId)} input`);
          }}
        >${missing ? w.setValue : w.replace}<span class="tc-sr-only">, ${s.name}</span></button>
        ${missing
          ? nothing
          : html`<button type="button" class="tc-btn-sm ui-sec__delete" @click=${() => {
              this.editing = null;
              this.draft = "";
              this.confirming = s.name;
              this.focus_(this.rowSel(s.name, ".ui-sec__keep"));
            }}>${w.delete}<span class="tc-sr-only">, ${s.name}</span></button>`}
      </div>
    </li>`;
  }

  private renderAdd() {
    const w = this.words;
    const err = this.nameTouched ? this.nameError() : "";
    const nameId = `${this.uid}-new-name`;
    const hintId = `${this.uid}-new-hint`;
    const errId = `${this.uid}-new-error`;
    const scopes = this.scopes.length ? this.scopes : [w.workspace];
    return html`<form
      class="ui-sec__new"
      aria-label=${w.addTitle}
      novalidate
      @submit=${(e: Event) => {
        e.preventDefault();
        this.add();
      }}
      @keydown=${(e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          this.closeAdd();
        }
      }}
    >
      <p class="ui-sec__new-title">${w.addTitle}</p>
      <div class="ui-sec__new-fields">
        <div class="ui-sec__field">
          <label class="ui-sec__label" for=${nameId}>${w.name}</label>
          <input
            id=${nameId}
            class="ui-sec__input ui-sec__new-name"
            autocomplete="off"
            spellcheck="false"
            autocapitalize="characters"
            aria-invalid=${err ? "true" : "false"}
            aria-describedby=${err ? `${hintId} ${errId}` : hintId}
            .value=${live(this.newName)}
            @input=${(e: Event) => (this.newName = (e.target as HTMLInputElement).value)}
            @blur=${() => (this.nameTouched = this.newName !== "" || this.nameTouched)}
          />
          <span class="ui-sec__hint" id=${hintId}>${w.nameHint}</span>
          ${err ? html`<span class="ui-sec__error" id=${errId}>${err}</span>` : nothing}
        </div>
        ${scopes.length > 1
          ? html`<div class="ui-sec__field">
              <label class="ui-sec__label" for=${`${this.uid}-new-scope`}>${w.scope}</label>
              <select id=${`${this.uid}-new-scope`} class="ui-sec__input ui-sec__new-scope" @change=${(e: Event) => (this.newScope = (e.target as HTMLSelectElement).value)}>
                ${scopes.map((sc) => html`<option value=${sc} ?selected=${sc === this.newScope}>${sc}</option>`)}
              </select>
            </div>`
          : nothing}
        <tc-secret-field class="ui-sec__value ui-sec__new-value" look=${this.resolvedLook} .label=${w.valueOf.replace("{name}", this.newName.trim() || w.name.toLowerCase())} .value=${live(this.draft)} @tc-value-change=${this.onValue}></tc-secret-field>
      </div>
      <div class="ui-sec__form-actions">
        <button type="button" class="tc-btn-sm ui-sec__new-cancel" @click=${() => this.closeAdd()}>${w.cancel}</button>
        <button type="submit" class="tc-btn-sm ui-sec__new-save" data-primary>${w.add}</button>
      </div>
    </form>`;
  }

  protected override render() {
    const w = this.words;
    const titleId = `${this.uid}-title`;
    const all = this.ordered();
    const missing = all.filter((s) => s.status === "missing");
    const saved = all.filter((s) => s.status !== "missing");
    const group = (id: string, title: string, items: Secret[]) =>
      items.length
        ? html`<section class="ui-sec__group" data-group=${id}>
            <h3 class="ui-sec__group-title" id=${`${this.uid}-${id}`}>${title} <span class="ui-sec__group-count">${items.length}</span></h3>
            <ul class="ui-sec__list" aria-labelledby=${`${this.uid}-${id}`}>${repeat(items, (s) => s.name, (s) => this.renderRow(s))}</ul>
          </section>`
        : nothing;
    return html`${cardHead({
        icon: ICON,
        title: this.heading || w.heading,
        subtitle: this.description,
        id: titleId,
        aside: this.creatable
          ? html`<button type="button" class="tc-btn-sm ui-sec__add" aria-expanded=${this.adding ? "true" : "false"} @click=${() => (this.adding ? this.closeAdd() : this.openAdd())}>${w.add}</button>`
          : html`<span class="ui-sec__count">${w.count.replace("{n}", String(this.secrets.length))}</span>`,
      })}
      <div class="ui-sec__card">
        ${this.adding ? this.renderAdd() : nothing}
        ${all.length ? html`${group("missing", w.missingGroup, missing)}${group("saved", w.savedGroup, saved)}` : html`<p class="ui-sec__empty">${w.empty}</p>`}
      </div>
      <span class="tc-sr-only" role="status">${this.announce}</span>`;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="sec"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="sec"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
[data-ui="sec"] { --tc-sec-ring: 1.5px; }
[data-ui="sec"] .tc-btn-sm[data-primary] { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
[data-ui="sec"] .tc-btn-sm[data-primary]:hover:not(:disabled) { background: var(--tc-action-primary-bg-hover); }
[data-ui="sec"] *, [data-ui="sec"] *::before, [data-ui="sec"] *::after { box-sizing: border-box; }
[data-ui="sec"] :where(p, h3) { margin: 0; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="sec"] .ui-sec__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-sec__count { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; }
.ui-sec__group + .ui-sec__group { box-shadow: inset 0 var(--tc-hairline) var(--tc-border-subtle); }
.ui-sec__group-title { display: flex; align-items: center; gap: var(--tc-space-1-5); padding: var(--tc-space-3) var(--tc-space-4) 0; color: var(--tc-caption-color); font-size: var(--tc-caption-font-size); line-height: var(--tc-caption-line-height); font-weight: var(--tc-caption-font-weight); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); }
.ui-sec__group-count { color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-sec__list { display: grid; margin: 0; padding: 0; list-style: none; }
.ui-sec__row { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-4); }
.ui-sec__row:not(:first-child) { box-shadow: inset 0 var(--tc-hairline) var(--tc-border-subtle); }
.ui-sec__top { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--tc-space-3); }
.ui-sec__who { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--tc-space-1) var(--tc-space-2); min-width: 0; }
.ui-sec__name { font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); overflow-wrap: anywhere; outline: none; }
.ui-sec__name:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-sec__scope { padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-full); background: var(--tc-fill-subtle); color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); }
.ui-sec__status { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1-5); color: var(--tc-status-success-fg); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-sec__mark { width: var(--tc-space-2); height: var(--tc-space-2); border-radius: var(--tc-radius-full); background: currentColor; }
.ui-sec__status[data-status="missing"] { color: var(--tc-status-danger-fg); }
.ui-sec__status[data-status="missing"] .ui-sec__mark { background: none; box-shadow: inset 0 0 0 var(--tc-sec-ring) currentColor; }
.ui-sec__status[data-status="expiring"] { color: var(--tc-status-warning-fg); }
.ui-sec__status[data-status="expiring"] .ui-sec__mark { background: linear-gradient(currentColor 50%, transparent 50%); box-shadow: inset 0 0 0 var(--tc-sec-ring) currentColor; }
.ui-sec__status[data-status="expired"] { color: var(--tc-status-danger-fg); }
.ui-sec__status[data-status="expired"] .ui-sec__mark { border-radius: 0; }
.ui-sec__facts { display: flex; flex-wrap: wrap; gap: var(--tc-space-0-5) var(--tc-space-3); margin: 0; padding: 0; color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); list-style: none; }
.ui-sec__needed { color: var(--tc-text-primary); }
.ui-sec__actions, .ui-sec__form-actions { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); }
.ui-sec__form-actions { justify-content: flex-end; }
.ui-sec__delete, .ui-sec__confirm-delete { color: var(--tc-status-danger-fg); }
.ui-sec__form, .ui-sec__confirm { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-2) var(--tc-space-3); border-radius: var(--tc-control-radius-md); background: var(--tc-fill-hover); }
.ui-sec__confirm { display: flex; flex-wrap: wrap; align-items: center; }
.ui-sec__confirm > span { flex: 1 1 14em; }
.ui-sec__new { display: grid; gap: var(--tc-space-3); margin: var(--tc-space-3) var(--tc-space-4) 0; padding: var(--tc-space-3); border-radius: var(--tc-control-radius-md); background: var(--tc-fill-hover); }
.ui-sec__new-title { font-weight: var(--tc-font-weight-medium); }
.ui-sec__new-fields { display: grid; gap: var(--tc-space-3); }
.ui-sec__field { display: grid; gap: var(--tc-space-1); }
.ui-sec__label { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-sec__input { height: var(--tc-control-h-sm); min-width: 0; padding: 0 var(--tc-space-2); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); color: var(--tc-text-primary); font: inherit; }
.ui-sec__new-name { font-family: var(--tc-font-mono); }
.ui-sec__input:focus { outline: 0; box-shadow: var(--tc-field-shadow-focus); }
.ui-sec__input[aria-invalid="true"] { box-shadow: var(--tc-field-shadow-invalid); }
.ui-sec__hint { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); }
.ui-sec__error { color: var(--tc-status-danger-fg); font-size: var(--tc-font-size-xs); }
.ui-sec__empty { padding: var(--tc-space-6) var(--tc-space-4); color: var(--tc-text-secondary); text-align: center; }
@container (min-width: 520px) {
  .ui-sec__new-fields { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
  .ui-sec__new-value { grid-column: 1 / -1; }
}
@media (forced-colors: active) {
  .ui-sec__mark { background: CanvasText; }
}
`;
}

if (!customElements.get("tc-secrets-manager")) customElements.define("tc-secrets-manager", TcSecretsManager);

declare global {
  interface HTMLElementTagNameMap {
    "tc-secrets-manager": TcSecretsManager;
  }
}
