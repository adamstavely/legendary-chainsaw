import { html, nothing, svg } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { safeUrl } from "./internal/safe-url";
import { copyText, formatDate } from "./internal/util";

/*
 * <tc-share-link-manager> – the links that already share something: who made each, what it allows, when it expires, how
 * many times it's been opened, and whether it's active, expiring soon, expired or revoked, in words. Copy, Change expiry
 * and Revoke act on one link; revoking asks first and says how many opens it's had. A link with a password says so and
 * never shows it. A URL that isn't safe can't be opened or copied. Expiry needs `now`: the element doesn't read the clock.
 * It only shows and asks. The server decides whether a link still works.
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-share-link-manager .links=${links} .now=${now}></tc-share-link-manager>
 */

export type ShareLinkStatus = "active" | "expiring" | "expired" | "revoked";
export type ShareLink = {
  id: string;
  label?: string;
  url: string;
  createdBy: string;
  /** Epoch ms */
  createdAt: number;
  /** Epoch ms; none means it doesn't expire */
  expiresAt?: number;
  /** What it allows, in words: "Can view" */
  access: string;
  /** It has a password. The password itself never reaches this element */
  password?: boolean;
  opens?: number;
  /** Epoch ms */
  lastOpenedAt?: number;
  /** Set "revoked" when it's been revoked. Otherwise it's worked out from `expiresAt` and `now` */
  status?: "active" | "revoked";
};
export type ShareLinksChangeKind = "revoke" | "expiry";
export type ShareLinksChange = { links: ShareLink[]; change: ShareLinksChangeKind; link: ShareLink };
export type ShareLinkCopy = { link: ShareLink };

/** The manager's words, every one renameable through `labels` */
export type ShareLinkManagerLabels = {
  heading: string;
  /** {n} */
  count: string;
  active: string;
  expiring: string;
  expired: string;
  revoked: string;
  /** {name} and {date} */
  created: string;
  /** {date} */
  expires: string;
  noExpiry: string;
  password: string;
  /** {n} */
  opens: string;
  opensOne: string;
  opensNone: string;
  /** {date} */
  lastOpened: string;
  copy: string;
  copied: string;
  changeExpiry: string;
  newExpiry: string;
  save: string;
  cancel: string;
  revoke: string;
  keep: string;
  /** {n} */
  confirm: string;
  confirmOne: string;
  confirmNone: string;
  unsafe: string;
  create: string;
  empty: string;
  /** {name} */
  announceRevoked: string;
  /** {name} */
  announceExpiry: string;
  /** {name} */
  announceCopied: string;
  copyFailed: string;
};
export const defaultShareLinkManagerLabels: ShareLinkManagerLabels = {
  heading: "Share links",
  count: "{n} links",
  active: "Active",
  expiring: "Expiring soon",
  expired: "Expired",
  revoked: "Revoked",
  created: "Made by {name}, {date}",
  expires: "Expires {date}",
  noExpiry: "Doesn't expire",
  password: "Password protected",
  opens: "Opened {n} times",
  opensOne: "Opened once",
  opensNone: "Not opened yet",
  lastOpened: "Last opened {date}",
  copy: "Copy",
  copied: "Copied",
  changeExpiry: "Change expiry",
  newExpiry: "New expiry date",
  save: "Save",
  cancel: "Cancel",
  revoke: "Revoke",
  keep: "Keep",
  confirm: "It's been opened {n} times. Anyone using it will lose access.",
  confirmOne: "It's been opened once. Anyone using it will lose access.",
  confirmNone: "It hasn't been opened yet. It'll stop working.",
  unsafe: "This address isn't safe to open or copy.",
  create: "Create link",
  empty: "No share links yet.",
  announceRevoked: "Revoked {name}",
  announceExpiry: "Changed the expiry of {name}",
  announceCopied: "Copied {name}",
  copyFailed: "Couldn't copy the link.",
};

const ICON = svg`<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"></path><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"></path>`;
const DAY = 86_400_000;
let instances = 0;

/** A date input's value at the end of that day, local time, in epoch ms */
export const shareLinkExpiryFromDate = (value: string) => {
  const t = new Date(`${value}T23:59:59`).getTime();
  return Number.isFinite(t) ? t : undefined;
};

/** Where a link stands. Without `now`, only a revoked link is known not to be active */
export function shareLinkStatus(link: Pick<ShareLink, "status" | "expiresAt">, now: number | undefined, expiringDays = 7): ShareLinkStatus {
  if (link.status === "revoked") return "revoked";
  if (link.expiresAt === undefined || now === undefined) return "active";
  if (link.expiresAt <= now) return "expired";
  return link.expiresAt - now <= expiringDays * DAY ? "expiring" : "active";
}

/**
 * The links that already share something, with status in words, Copy, Change expiry and Revoke.
 * @tag tc-share-link-manager
 * @fires tc-links-change - A link was revoked or its expiry changed ({ links, change, link }: ShareLinksChange); cancelable – prevented, `links` stays as it was
 * @fires tc-copy - Copy was pressed ({ link }: ShareLinkCopy); cancelable – prevented, nothing is written to the clipboard
 * @fires tc-create - Create link was pressed (detail: null)
 */
export class TcShareLinkManager extends TcElement {
  static override ui = "slm";

  /** The heading; by default "Share links" */
  @property() accessor heading = "";
  /** A line under the heading, such as what's being shared */
  @property() accessor description: string | undefined = undefined;
  /** The links. Changed by the user unless a tc-links-change listener calls preventDefault() */
  @property({ attribute: false }) accessor links: ShareLink[] = [];
  /** "Now" for expiry, epoch ms. The element doesn't read the clock */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** How many days before expiry a link counts as expiring soon */
  @property({ type: Number, attribute: "expiring-days" }) accessor expiringDays = 7;
  /** Offer Create link */
  @property({ type: Boolean }) accessor creatable = false;
  /** The locale for dates */
  @property() accessor locale: string | undefined = undefined;
  /** Rename any of the words */
  @property({ attribute: false }) accessor labels: Partial<ShareLinkManagerLabels> = {};

  @state() private accessor confirming: string | null = null;
  @state() private accessor editing: string | null = null;
  @state() private accessor expiry = "";
  @state() private accessor copied: string | null = null;
  @state() private accessor announce = "";
  private readonly uid = `tc-slm-${++instances}`;

  private get words(): ShareLinkManagerLabels {
    return { ...defaultShareLinkManagerLabels, ...this.labels };
  }

  private name(link: ShareLink) {
    return link.label || link.url;
  }

  private date(ms: number) {
    return formatDate(ms, this.locale, { dateStyle: "medium" });
  }

  private focusIn(id: string, cls: string) {
    this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-link="${CSS.escape(id)}"] ${cls}`)?.focus());
  }

  private commit(links: ShareLink[], change: ShareLinksChangeKind, link: ShareLink, message: string) {
    if (!this.emit<ShareLinksChange>("tc-links-change", { links, change, link }, { cancelable: true })) return false;
    this.links = links;
    this.announce = message;
    return true;
  }

  private async copy(link: ShareLink) {
    const url = safeUrl(link.url);
    if (!url) return;
    if (!this.emit<ShareLinkCopy>("tc-copy", { link }, { cancelable: true })) return;
    const w = this.words;
    if (await copyText(url)) {
      this.copied = link.id;
      this.announce = w.announceCopied.replace("{name}", this.name(link));
    } else this.announce = w.copyFailed;
  }

  private revoke(link: ShareLink) {
    this.confirming = null;
    const next: ShareLink = { ...link, status: "revoked" };
    if (this.commit(this.links.map((l) => (l.id === link.id ? next : l)), "revoke", next, this.words.announceRevoked.replace("{name}", this.name(link)))) {
      this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-link="${CSS.escape(link.id)}"] .ui-slm__name`)?.focus());
    } else this.focusIn(link.id, ".ui-slm__revoke");
  }

  private startEdit(link: ShareLink) {
    this.confirming = null;
    this.editing = link.id;
    this.expiry = "";
    this.focusIn(link.id, ".ui-slm__date");
  }

  private saveExpiry(link: ShareLink) {
    const expiresAt = shareLinkExpiryFromDate(this.expiry);
    if (expiresAt === undefined) return;
    const next: ShareLink = { ...link, expiresAt };
    this.editing = null;
    this.commit(this.links.map((l) => (l.id === link.id ? next : l)), "expiry", next, this.words.announceExpiry.replace("{name}", this.name(link)));
    this.focusIn(link.id, ".ui-slm__change");
  }

  private renderRow(link: ShareLink) {
    const w = this.words;
    const status = shareLinkStatus(link, this.now, this.expiringDays);
    const url = safeUrl(link.url);
    const opens = link.opens ?? 0;
    const name = this.name(link);
    const dateId = `${this.uid}-${link.id}-date`;
    const live_ = status !== "revoked";
    return html`<li class="ui-slm__row" data-link=${link.id} data-status=${status}>
      <div class="ui-slm__top">
        <div class="ui-slm__who">
          <span class="ui-slm__name" tabindex="-1">${name}</span>
          ${url && live_ && status !== "expired"
            ? html`<a class="ui-slm__url" href=${url} target="_blank" rel="noopener noreferrer">${link.url}</a>`
            : html`<span class="ui-slm__url" data-off>${link.url}</span>`}
          ${url ? nothing : html`<span class="ui-slm__unsafe">${w.unsafe}</span>`}
        </div>
        <span class="ui-slm__status" data-status=${status}>${w[status]}</span>
      </div>
      <ul class="ui-slm__facts">
        <li>${link.access}</li>
        <li>${link.expiresAt !== undefined ? w.expires.replace("{date}", this.date(link.expiresAt)) : w.noExpiry}</li>
        ${link.password ? html`<li class="ui-slm__password">${w.password}</li>` : nothing}
        <li>${opens === 0 ? w.opensNone : opens === 1 ? w.opensOne : w.opens.replace("{n}", String(opens))}</li>
        ${link.lastOpenedAt !== undefined ? html`<li>${w.lastOpened.replace("{date}", this.date(link.lastOpenedAt))}</li>` : nothing}
        <li>${w.created.replace("{name}", link.createdBy).replace("{date}", this.date(link.createdAt))}</li>
      </ul>
      ${this.editing === link.id
        ? html`<div class="ui-slm__edit">
            <label class="ui-slm__label" for=${dateId}>${w.newExpiry}</label>
            <input id=${dateId} class="ui-slm__date" type="date" .value=${live(this.expiry)} @input=${(e: Event) => (this.expiry = (e.target as HTMLInputElement).value)} />
            <button type="button" class="tc-btn-sm ui-slm__cancel" @click=${() => {
              this.editing = null;
              this.focusIn(link.id, ".ui-slm__change");
            }}>${w.cancel}</button>
            <button type="button" class="tc-btn-sm ui-slm__save" ?disabled=${!this.expiry} @click=${() => this.saveExpiry(link)}>${w.save}<span class="tc-sr-only">, ${name}</span></button>
          </div>`
        : nothing}
      ${this.confirming === link.id
        ? html`<div class="ui-slm__confirm" role="group" aria-label=${`${w.revoke}, ${name}`}>
            <span>${opens === 0 ? w.confirmNone : opens === 1 ? w.confirmOne : w.confirm.replace("{n}", String(opens))}</span>
            <button type="button" class="tc-btn-sm ui-slm__keep" @click=${() => {
              this.confirming = null;
              this.focusIn(link.id, ".ui-slm__revoke");
            }}>${w.keep}</button>
            <button type="button" class="tc-btn-sm ui-slm__confirm-revoke" @click=${() => this.revoke(link)}>${w.revoke}<span class="tc-sr-only">, ${name}</span></button>
          </div>`
        : nothing}
      ${live_
        ? html`<div class="ui-slm__actions">
            ${status !== "expired"
              ? html`<button type="button" class="tc-btn-sm ui-slm__copy" ?disabled=${!url} @click=${() => this.copy(link)}>${this.copied === link.id ? w.copied : w.copy}<span class="tc-sr-only">, ${name}</span></button>`
              : nothing}
            <button type="button" class="tc-btn-sm ui-slm__change" @click=${() => this.startEdit(link)}>${w.changeExpiry}<span class="tc-sr-only">, ${name}</span></button>
            <button type="button" class="tc-btn-sm ui-slm__revoke" @click=${() => {
              this.editing = null;
              this.confirming = link.id;
              this.focusIn(link.id, ".ui-slm__keep");
            }}>${w.revoke}<span class="tc-sr-only">, ${name}</span></button>
          </div>`
        : nothing}
    </li>`;
  }

  protected override render() {
    const w = this.words;
    const titleId = `${this.uid}-title`;
    return html`${cardHead({
        icon: ICON,
        title: this.heading || w.heading,
        subtitle: this.description,
        id: titleId,
        aside: this.creatable ? html`<button type="button" class="tc-btn-sm ui-slm__create" @click=${() => this.emit("tc-create", null)}>${w.create}</button>` : html`<span class="ui-slm__count">${w.count.replace("{n}", String(this.links.length))}</span>`,
      })}
      <div class="ui-slm__card">
        ${this.links.length
          ? html`<ul class="ui-slm__list" aria-labelledby=${ifDefined(titleId)}>${repeat(this.links, (l) => l.id, (l) => this.renderRow(l))}</ul>`
          : html`<p class="ui-slm__empty">${w.empty}</p>`}
      </div>
      <span class="tc-sr-only" role="status">${this.announce}</span>`;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="slm"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="slm"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
[data-ui="slm"] *, [data-ui="slm"] *::before, [data-ui="slm"] *::after { box-sizing: border-box; }
[data-ui="slm"] :where(p) { margin: 0; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="slm"] .ui-slm__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-slm__count { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; }
.ui-slm__list { display: grid; margin: 0; padding: 0; list-style: none; }
.ui-slm__row { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-4); }
.ui-slm__row:not(:first-child) { box-shadow: inset 0 var(--tc-hairline) var(--tc-border-subtle); }
.ui-slm__top { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--tc-space-3); }
.ui-slm__who { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-slm__name { font-weight: var(--tc-font-weight-medium); overflow-wrap: anywhere; outline: none; }
.ui-slm__url { color: var(--tc-text-secondary); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); overflow-wrap: anywhere; }
a.ui-slm__url:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-slm__unsafe { color: var(--tc-status-danger-fg); font-size: var(--tc-font-size-xs); }
.ui-slm__status { flex: none; color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-slm__status[data-status="active"] { color: var(--tc-status-success-fg); }
.ui-slm__status[data-status="expiring"] { color: var(--tc-status-warning-fg); }
.ui-slm__status[data-status="revoked"] { color: var(--tc-status-danger-fg); }
.ui-slm__row[data-status="revoked"] .ui-slm__name, .ui-slm__row[data-status="expired"] .ui-slm__name { color: var(--tc-text-secondary); }
.ui-slm__facts { display: flex; flex-wrap: wrap; gap: var(--tc-space-0-5) var(--tc-space-3); margin: 0; padding: 0; color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); list-style: none; }
.ui-slm__edit, .ui-slm__confirm { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); padding: var(--tc-space-2) var(--tc-space-3); border-radius: var(--tc-control-radius-md); background: var(--tc-fill-hover); }
.ui-slm__confirm > span { flex: 1 1 14em; }
.ui-slm__keep { margin-inline-start: auto; }
.ui-slm__label { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-slm__date { height: var(--tc-control-h-sm); padding: 0 var(--tc-space-1); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); color: var(--tc-text-primary); font: inherit; }
.ui-slm__date:focus { outline: 0; box-shadow: var(--tc-field-shadow-focus); }
.ui-slm__actions { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); }
.ui-slm__revoke, .ui-slm__confirm-revoke { color: var(--tc-status-danger-fg); }
.ui-slm__empty { padding: var(--tc-space-6) var(--tc-space-4); color: var(--tc-text-secondary); text-align: center; }
`;
}

if (!customElements.get("tc-share-link-manager")) customElements.define("tc-share-link-manager", TcShareLinkManager);

declare global {
  interface HTMLElementTagNameMap {
    "tc-share-link-manager": TcShareLinkManager;
  }
}
