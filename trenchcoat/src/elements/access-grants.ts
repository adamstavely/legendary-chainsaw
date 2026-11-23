import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController } from "./internal/controllers";
import { safeMediaUrl } from "./internal/safe-media";
import { formatDate } from "./internal/util";

/*
 * <tc-access-grants> – the standing access an assistant or agent has been given, in one list to review and revoke:
 * where it reaches (a source, with the app's own icon), what it may do there, in words ("Read cases in Team North"),
 * who granted it and when, when it was last used and when it runs out. A summary line counts what needs a look, and
 * tabs narrow the list to grants that changed since someone agreed to them, or that expire soon.
 *   · grants are grouped by source; within a source, changed ones first, then the soonest to expire
 *   · a grant that changed since it was agreed ("Now also reads attachments") says so, with Review: accept the change
 *     or revoke the grant (a cancelable tc-drift-review)
 *   · Revoke asks inline first, then fires a cancelable tc-revoke – unless prevented, the grant leaves the list
 *   · a grant expiring within `expiring-days` reads "Expires in 3 days" and offers Renew (tc-renew); an expired one
 *     reads as expired
 *   · one tab stop for the rows' buttons: ↑ ↓ move between rows, ← → between a row's buttons
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-access-grants .grants=${[{ id: "g1", source: "Case files", scope: "Read cases in Team North", level: "read",
 *     grantedBy: "Priya Shah", grantedAt: …, expiresAt: … }]}></tc-access-grants>
 */

export type AccessGrantLevel = "read" | "write" | "act";
export type AccessGrantsFilter = "all" | "changed" | "expiring";

/** One standing grant */
export type AccessGrant = {
  id: string;
  /** Where the access reaches – an app, a data source or a tool, by the name people know */
  source: string;
  /** The source's own icon or logo (a URL); without it, the source's first letter */
  icon?: string;
  /** What it may do there, in words: "Read cases in Team North" */
  scope: string;
  /** read, write ("Can edit") or act ("Can act" – send, run, buy) */
  level: AccessGrantLevel;
  /** Who agreed to it */
  grantedBy?: string;
  /** When, epoch ms */
  grantedAt?: number;
  /** When it runs out, epoch ms; leave it out (or null) for "Until revoked" */
  expiresAt?: number | null;
  /** When the agent last used it, epoch ms */
  lastUsedAt?: number;
  /** What changed since someone agreed to it, and when – the drift notice */
  changed?: { since: number; what: string };
};

/** Details of the events */
export type AccessGrantsFilterChange = { filter: AccessGrantsFilter };
export type AccessGrantRevoke = { grant: AccessGrant };
export type AccessGrantRenew = { grant: AccessGrant };
export type AccessGrantDriftReview = { grant: AccessGrant; accepted: boolean };

/** The words it uses; the page can rename any of them */
export type AccessGrantsLabels = {
  all: string;
  changed: string;
  expiring: string;
  levelRead: string;
  levelWrite: string;
  levelAct: string;
  grants: string;
  grant: string;
  changedCount: string;
  expiringCount: string;
  expiredCount: string;
  grantedBy: string;
  granted: string;
  lastUsed: string;
  neverUsed: string;
  untilRevoked: string;
  expiresToday: string;
  expiresIn: string;
  expiresInOne: string;
  expiresOn: string;
  expired: string;
  driftTitle: string;
  review: string;
  accept: string;
  revoke: string;
  renew: string;
  cancel: string;
  revokeConfirm: string;
  revokeBody: string;
  revokeButton: string;
  revoked: string;
  accepted: string;
  empty: string;
  emptyChanged: string;
  emptyExpiring: string;
};
export const defaultAccessGrantsLabels: AccessGrantsLabels = {
  all: "All",
  changed: "Changed",
  expiring: "Expiring",
  levelRead: "Can read",
  levelWrite: "Can edit",
  levelAct: "Can act",
  grants: "{count} grants",
  grant: "1 grant",
  changedCount: "{count} changed since you agreed",
  expiringCount: "{count} expire this week",
  expiredCount: "{count} expired",
  grantedBy: "Granted by {name}",
  granted: "Granted",
  lastUsed: "Last used {when}",
  neverUsed: "Not used yet",
  untilRevoked: "Until revoked",
  expiresToday: "Expires today",
  expiresIn: "Expires in {count} days",
  expiresInOne: "Expires tomorrow",
  expiresOn: "Expires {date}",
  expired: "Expired {date}",
  driftTitle: "Changed since you agreed",
  review: "Review",
  accept: "Accept change",
  revoke: "Revoke",
  renew: "Renew",
  cancel: "Cancel",
  revokeConfirm: "Revoke this access?",
  revokeBody: "{source} loses “{scope}” at once. You can grant it again later.",
  revokeButton: "Revoke access",
  revoked: "Revoked {scope}.",
  accepted: "Change accepted for {scope}.",
  empty: "No access has been granted.",
  emptyChanged: "Nothing has changed since it was agreed.",
  emptyExpiring: "Nothing expires soon.",
};

const DAY = 24 * 60 * 60 * 1000;
const FILTERS: AccessGrantsFilter[] = ["all", "changed", "expiring"];

/* Icons: Lucide (ISC, lucide.dev) – key-round, eye, pencil, zap, triangle-alert, clock, rotate-cw */
const keyIcon = svg`<path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"></path><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"></circle>`;
const glyph = (body: ReturnType<typeof svg>) =>
  html`<svg class="ui-acg__glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const LEVEL_ICON: Record<AccessGrantLevel, () => ReturnType<typeof glyph>> = {
  read: () => glyph(svg`<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path><circle cx="12" cy="12" r="3"></circle>`),
  write: () => glyph(svg`<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"></path>`),
  act: () => glyph(svg`<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path>`),
};
const alertIcon = () => glyph(svg`<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path>`);
const clockIcon = () => glyph(svg`<circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path>`);

let instances = 0;

/**
 * The standing access an assistant or agent has – by source, with scope, level, who granted it, last use and expiry –
 * with a "changed since you agreed" notice, Review, Renew and Revoke.
 * @tag tc-access-grants
 * @fires tc-filter-change - A tab was chosen ({ filter }: AccessGrantsFilterChange); cancelable – prevented, the tab stays as it was
 * @fires tc-revoke - Revoke was confirmed ({ grant }: AccessGrantRevoke); cancelable – unless prevented, the grant leaves `grants`
 * @fires tc-renew - Renew was pressed on a grant that expires soon or has expired ({ grant }: AccessGrantRenew); set its new `expiresAt` in answer
 * @fires tc-drift-review - A changed grant was reviewed ({ grant, accepted }: AccessGrantDriftReview); cancelable – unless prevented, accepting clears `changed` and refusing removes the grant
 */
export class TcAccessGrants extends TcElement {
  static override ui = "acg";

  /** The heading */
  @property() accessor heading = "Access";
  /** One line under the heading – whose access this is */
  @property() accessor description = "";
  /** The grants. Revoking one, or refusing a change, removes it unless the event is prevented */
  @property({ attribute: false }) accessor grants: AccessGrant[] = [];
  /** Which grants show: all, changed since agreed, or expiring soon (and expired) */
  @property({ reflect: true }) accessor filter: AccessGrantsFilter = "all";
  /** How many days ahead counts as expiring soon */
  @property({ type: Number, attribute: "expiring-days" }) accessor expiringDays = 7;
  /** The time to measure against, epoch ms; by default the element's own clock */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** The language for dates, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;
  /** The words it uses, merged over defaultAccessGrantsLabels */
  @property({ attribute: false }) accessor labels: Partial<AccessGrantsLabels> = {};

  /** @internal The clock when `now` isn't given */
  @state() accessor clock = 0;
  /** @internal The row and button that hold the tab stop */
  @state() accessor active = { r: 0, c: 0 };
  /** @internal The grant with a panel open under it, and which */
  @state() accessor panel: { id: string; kind: "revoke" | "review" } | null = null;
  /** @internal The polite status message */
  @state() accessor said = "";

  private readonly uid = `tc-acg${++instances}`;

  constructor() {
    super();
    // A revoked row leaves: focus goes to the row now in its place, else the tabs
    new FocusRescueController(this, () => this.querySelector<HTMLElement>(".ui-acg__actions [tabindex='0']") ?? this.querySelector<HTMLElement>(".ui-acg__tab[aria-selected='true']"));
  }

  override connectedCallback() {
    super.connectedCallback();
    if (this.now === undefined) this.clock = Date.now();
  }

  private get time() {
    return this.now ?? this.clock;
  }
  private get words(): AccessGrantsLabels {
    return { ...defaultAccessGrantsLabels, ...this.labels };
  }
  private fill(text: string, vars: Record<string, string | number>) {
    return text.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));
  }

  private isExpired(g: AccessGrant) {
    return g.expiresAt != null && g.expiresAt <= this.time;
  }
  private isExpiring(g: AccessGrant) {
    return g.expiresAt != null && g.expiresAt > this.time && g.expiresAt - this.time <= this.expiringDays * DAY;
  }
  private inFilter(g: AccessGrant, filter: AccessGrantsFilter) {
    if (filter === "changed") return !!g.changed;
    if (filter === "expiring") return this.isExpiring(g) || this.isExpired(g);
    return true;
  }

  /** The shown grants, grouped by source in the order sources first appear; changed first, then soonest to expire */
  private get groups(): { source: string; icon?: string; grants: AccessGrant[] }[] {
    const order: string[] = [];
    const by = new Map<string, AccessGrant[]>();
    for (const g of this.grants) {
      if (!this.inFilter(g, this.filter)) continue;
      if (!by.has(g.source)) {
        by.set(g.source, []);
        order.push(g.source);
      }
      by.get(g.source)!.push(g);
    }
    const rank = (g: AccessGrant) => (g.changed ? 0 : 1);
    const ends = (g: AccessGrant) => g.expiresAt ?? Infinity;
    return order.map((source) => {
      const list = [...by.get(source)!].sort((a, b) => rank(a) - rank(b) || ends(a) - ends(b));
      return { source, icon: list.find((g) => g.icon)?.icon, grants: list };
    });
  }
  private get rows(): AccessGrant[] {
    return this.groups.flatMap((g) => g.grants);
  }

  /** The buttons in a row, in order */
  private buttons(g: AccessGrant): ("review" | "renew" | "revoke")[] {
    const out: ("review" | "renew" | "revoke")[] = [];
    if (g.changed) out.push("review");
    if (this.isExpiring(g) || this.isExpired(g)) out.push("renew");
    out.push("revoke");
    return out;
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    // Keep the tab stop on a row that exists
    const rows = this.rows;
    if (!rows.length) return;
    const r = Math.min(this.active.r, rows.length - 1);
    const c = Math.min(this.active.c, this.buttons(rows[r]).length - 1);
    if (r !== this.active.r || c !== this.active.c) this.active = { r, c };
    if (this.panel && !rows.some((g) => g.id === this.panel!.id)) this.panel = null;
  }

  /* ---------- Formatting ---------- */

  private date(ms: number) {
    const sameYear = new Date(ms).getFullYear() === new Date(this.time).getFullYear();
    return formatDate(ms, this.locale, sameYear ? { day: "numeric", month: "short" } : { day: "numeric", month: "short", year: "numeric" });
  }
  private ago(ms: number) {
    const diff = Math.max(0, this.time - ms);
    const rtf = new Intl.RelativeTimeFormat(this.locale, { numeric: "auto" });
    if (diff < 60 * 60 * 1000) return rtf.format(-Math.max(1, Math.floor(diff / 60000)), "minute");
    if (diff < DAY) return rtf.format(-Math.floor(diff / (60 * 60 * 1000)), "hour");
    if (diff < 30 * DAY) return rtf.format(-Math.floor(diff / DAY), "day");
    return this.date(ms);
  }
  /** The expiry in words, and its state */
  private expiry(g: AccessGrant): { text: string; state: "none" | "later" | "soon" | "expired" } {
    const w = this.words;
    if (g.expiresAt == null) return { text: w.untilRevoked, state: "none" };
    if (this.isExpired(g)) return { text: this.fill(w.expired, { date: this.date(g.expiresAt) }), state: "expired" };
    const days = Math.floor((g.expiresAt - this.time) / DAY);
    if (this.isExpiring(g)) {
      const text = days < 1 ? w.expiresToday : days === 1 ? w.expiresInOne : this.fill(w.expiresIn, { count: days });
      return { text, state: "soon" };
    }
    return { text: this.fill(w.expiresOn, { date: this.date(g.expiresAt) }), state: "later" };
  }

  /* ---------- Actions ---------- */

  private pickFilter(filter: AccessGrantsFilter, focus = false) {
    if (filter !== this.filter) {
      if (!this.emit<AccessGrantsFilterChange>("tc-filter-change", { filter }, { cancelable: true })) return;
      this.filter = filter;
      this.panel = null;
      this.active = { r: 0, c: 0 };
    }
    if (focus) void this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-acg__tab[data-filter="${filter}"]`)?.focus());
  }
  private onTabKey = (e: KeyboardEvent) => {
    const at = FILTERS.indexOf(this.filter);
    const n = FILTERS.length;
    const to = e.key === "ArrowRight" ? (at + 1) % n : e.key === "ArrowLeft" ? (at - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    this.pickFilter(FILTERS[to], true);
  };

  private focusAt(r: number, c: number) {
    const rows = this.rows;
    if (!rows.length) return;
    r = Math.max(0, Math.min(rows.length - 1, r));
    c = Math.max(0, Math.min(this.buttons(rows[r]).length - 1, c));
    this.active = { r, c };
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-at="${r}:${c}"]`)?.focus());
  }
  private onRowKey = (e: KeyboardEvent) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-at]");
    if (!btn || e.altKey || e.metaKey || e.ctrlKey) return;
    const [r, c] = btn.dataset.at!.split(":").map(Number);
    const moves: Record<string, [number, number]> = {
      ArrowUp: [r - 1, c],
      ArrowDown: [r + 1, c],
      ArrowLeft: [r, c - 1],
      ArrowRight: [r, c + 1],
      Home: [0, c],
      End: [this.rows.length - 1, c],
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    this.focusAt(move[0], move[1]);
  };

  private press(g: AccessGrant, kind: "review" | "renew" | "revoke", r: number, c: number) {
    this.active = { r, c };
    if (kind === "renew") {
      this.emit<AccessGrantRenew>("tc-renew", { grant: g });
      return;
    }
    const open = this.panel?.id === g.id && this.panel.kind === kind;
    this.panel = open ? null : { id: g.id, kind };
    if (!open) void this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-acg__panel[data-for="${CSS.escape(g.id)}"] button`)?.focus());
  }
  private closePanel() {
    this.panel = null;
    const { r, c } = this.active;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-at="${r}:${c}"]`)?.focus());
  }
  private onPanelKey = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    e.preventDefault();
    e.stopPropagation();
    this.closePanel();
  };
  private drop(g: AccessGrant) {
    this.grants = this.grants.filter((x) => x.id !== g.id);
    this.panel = null;
    this.said = this.fill(this.words.revoked, { scope: g.scope });
  }
  private revoke(g: AccessGrant) {
    if (!this.emit<AccessGrantRevoke>("tc-revoke", { grant: g }, { cancelable: true })) return;
    this.drop(g);
  }
  private review(g: AccessGrant, accepted: boolean) {
    if (!this.emit<AccessGrantDriftReview>("tc-drift-review", { grant: g, accepted }, { cancelable: true })) return;
    if (!accepted) {
      this.drop(g);
      return;
    }
    this.grants = this.grants.map((x) => {
      if (x.id !== g.id) return x;
      const next = { ...x };
      delete next.changed;
      return next;
    });
    this.said = this.fill(this.words.accepted, { scope: g.scope });
    this.closePanel();
  }

  /* ---------- Rendering ---------- */

  private renderSourceMark(source: string, icon: string | undefined) {
    const src = safeMediaUrl(icon);
    return html`<span class="ui-acg__logo" aria-hidden="true">${src ? html`<img src=${src} alt="" loading="lazy" decoding="async" />` : source.trim().charAt(0).toUpperCase()}</span>`;
  }

  private renderPanel(g: AccessGrant) {
    if (this.panel?.id !== g.id) return nothing;
    const w = this.words;
    const id = `${this.uid}-panel-${g.id}`;
    if (this.panel.kind === "revoke")
      return html`<div class="ui-acg__panel" data-kind="revoke" data-for=${g.id} id=${id} role="group" aria-labelledby=${`${id}-t`} @keydown=${this.onPanelKey}>
        <p class="ui-acg__panel-title" id=${`${id}-t`}>${w.revokeConfirm}</p>
        <p class="ui-acg__panel-body">${this.fill(w.revokeBody, { source: g.source, scope: g.scope })}</p>
        <div class="ui-acg__panel-actions">
          <button type="button" class="tc-btn-sm" @click=${() => this.closePanel()}>${w.cancel}</button>
          <button type="button" class="tc-btn-sm ui-acg__danger" @click=${() => this.revoke(g)}>${w.revokeButton}</button>
        </div>
      </div>`;
    return html`<div class="ui-acg__panel" data-kind="review" data-for=${g.id} id=${id} role="group" aria-labelledby=${`${id}-t`} @keydown=${this.onPanelKey}>
      <p class="ui-acg__panel-title" id=${`${id}-t`}>${w.driftTitle}</p>
      <p class="ui-acg__panel-body">${g.changed?.what}</p>
      <div class="ui-acg__panel-actions">
        <button type="button" class="tc-btn-sm" @click=${() => this.review(g, true)}>${w.accept}</button>
        <button type="button" class="tc-btn-sm ui-acg__danger" @click=${() => this.review(g, false)}>${w.revoke}</button>
      </div>
    </div>`;
  }

  private renderRow(g: AccessGrant, r: number) {
    const w = this.words;
    const exp = this.expiry(g);
    const level = { read: w.levelRead, write: w.levelWrite, act: w.levelAct }[g.level] ?? w.levelRead;
    const scopeId = `${this.uid}-scope-${g.id}`;
    const meta = [
      g.grantedBy ? this.fill(w.grantedBy, { name: g.grantedBy }) + (g.grantedAt !== undefined ? ` · ${this.date(g.grantedAt)}` : "") : g.grantedAt !== undefined ? `${w.granted} ${this.date(g.grantedAt)}` : "",
      g.lastUsedAt !== undefined ? this.fill(w.lastUsed, { when: this.ago(g.lastUsedAt) }) : w.neverUsed,
    ].filter(Boolean);
    const kinds = this.buttons(g);
    const label = { review: w.review, renew: w.renew, revoke: w.revoke };
    return html`<li class="ui-acg__row" data-level=${g.level} data-expiry=${exp.state} ?data-changed=${!!g.changed}>
      <div class="ui-acg__main">
        <span class="ui-acg__level" data-level=${g.level}>${(LEVEL_ICON[g.level] ?? LEVEL_ICON.read)()}<span>${level}</span></span>
        <span class="ui-acg__scope" id=${scopeId}>${g.scope}</span>
        <span class="ui-acg__meta">
          ${meta.map((m) => html`<span>${m}</span>`)}
          <span class="ui-acg__expiry" data-state=${exp.state}>${exp.state === "soon" || exp.state === "expired" ? clockIcon() : nothing}${exp.text}</span>
        </span>
        ${g.changed
          ? html`<span class="ui-acg__drift">${alertIcon()}<span><strong>${w.driftTitle}:</strong> ${g.changed.what} · ${this.date(g.changed.since)}</span></span>`
          : nothing}
      </div>
      <div class="ui-acg__actions" @keydown=${this.onRowKey}>
        ${kinds.map((k, c) => {
          const at = this.active.r === r && this.active.c === c;
          const expanded = k === "renew" ? undefined : this.panel?.id === g.id && this.panel.kind === k ? "true" : "false";
          return html`<button
            type="button"
            class="tc-btn-sm ui-acg__btn"
            data-kind=${k}
            data-at=${`${r}:${c}`}
            data-focus-key=${`${g.id}:${k}`}
            tabindex=${at ? 0 : -1}
            aria-describedby=${scopeId}
            aria-expanded=${ifDefined(expanded)}
            aria-controls=${ifDefined(expanded === "true" ? `${this.uid}-panel-${g.id}` : undefined)}
            @click=${() => this.press(g, k, r, c)}
          >
            ${label[k]}
          </button>`;
        })}
      </div>
      ${this.renderPanel(g)}
    </li>`;
  }

  private renderSummary() {
    const w = this.words;
    const all = this.grants;
    const changed = all.filter((g) => g.changed).length;
    const expiring = all.filter((g) => this.isExpiring(g)).length;
    const expired = all.filter((g) => this.isExpired(g)).length;
    const parts = [
      all.length === 1 ? w.grant : this.fill(w.grants, { count: all.length }),
      changed ? this.fill(w.changedCount, { count: changed }) : "",
      expiring ? this.fill(w.expiringCount, { count: expiring }) : "",
      expired ? this.fill(w.expiredCount, { count: expired }) : "",
    ].filter(Boolean);
    return html`<p class="ui-acg__summary">${parts.map((p, i) => html`${i ? html`<span class="ui-acg__dot" aria-hidden="true">·</span>` : nothing}<span>${p}</span>`)}</p>`;
  }

  private renderTabs() {
    const w = this.words;
    const count = (f: AccessGrantsFilter) => this.grants.filter((g) => this.inFilter(g, f)).length;
    return html`<div class="ui-acg__tabs" role="tablist" aria-labelledby=${`${this.uid}-title`} @keydown=${this.onTabKey}>
      ${FILTERS.map((f) => {
        const on = this.filter === f;
        return html`<button
          type="button"
          role="tab"
          class="ui-acg__tab"
          data-filter=${f}
          id=${`${this.uid}-tab-${f}`}
          aria-selected=${on ? "true" : "false"}
          aria-controls=${`${this.uid}-list`}
          tabindex=${on ? 0 : -1}
          @click=${() => this.pickFilter(f)}
        >
          ${w[f]} <span class="ui-acg__count">${count(f)}</span>
        </button>`;
      })}
    </div>`;
  }

  protected override render() {
    const w = this.words;
    const groups = this.groups;
    let r = 0;
    const empty = this.filter === "changed" ? w.emptyChanged : this.filter === "expiring" ? w.emptyExpiring : w.empty;
    return html`${cardHead({ icon: keyIcon, title: this.heading, subtitle: this.description || undefined, id: `${this.uid}-title` })}
      <div class="ui-acg__card">
        ${this.renderSummary()} ${this.renderTabs()}
        <div class="ui-acg__body" role="tabpanel" id=${`${this.uid}-list`} aria-labelledby=${`${this.uid}-tab-${this.filter}`}>
          ${groups.length
            ? groups.map((grp) => {
                const gid = `${this.uid}-src-${grp.source.replace(/[^\w-]/g, "_")}`;
                return html`<section class="ui-acg__group">
                  <h4 class="ui-acg__source" id=${gid}>${this.renderSourceMark(grp.source, grp.icon)}<span class="ui-acg__source-name">${grp.source}</span><span class="ui-acg__source-count">${grp.grants.length}</span></h4>
                  <ul class="ui-acg__list" aria-labelledby=${gid}>
                    ${grp.grants.map((g) => this.renderRow(g, r++))}
                  </ul>
                </section>`;
              })
            : html`<p class="ui-acg__empty">${empty}</p>`}
        </div>
      </div>
      <span class="tc-sr-only" role="status">${this.said}</span>`;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="acg"] {
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
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="acg"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
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
[data-ui="acg"] { --tc-acg-logo: 20px; --tc-acg-indicator: 2px; }
[data-ui="acg"] *, [data-ui="acg"] *::before, [data-ui="acg"] *::after { box-sizing: border-box; }
[data-ui="acg"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="acg"] p, [data-ui="acg"] h4 { margin: 0; }
:where([data-ui="acg"]) button { font: inherit; -webkit-tap-highlight-color: transparent; }
.ui-acg__glyph { display: block; flex: none; width: 14px; height: 14px; }
:where([data-look="clean"], [data-look="clean"] *).ui-acg__glyph { stroke-width: 1.6; }
:where([data-look="standard"], [data-look="standard"] *).ui-acg__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-acg__card { display: grid; min-width: 0; }
/* The summary line and the tabs */
.ui-acg__summary { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5); padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-1); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-acg__dot { color: var(--tc-text-muted); }
.ui-acg__tabs { display: flex; gap: var(--tc-space-1); padding: var(--tc-space-1) var(--tc-space-3) 0; overflow-x: auto; border-bottom: var(--tc-hairline) solid var(--tc-divider); scrollbar-width: thin; }
.ui-acg__tab { position: relative; flex: none; display: inline-flex; align-items: center; gap: var(--tc-space-1-5); min-height: var(--tc-control-h-sm); margin: 0; padding: var(--tc-space-1-5) var(--tc-space-2-5); border: 0; border-radius: var(--tc-radius-md) var(--tc-radius-md) 0 0; background: none; color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); white-space: nowrap; cursor: pointer; }
.ui-acg__tab:hover { background: var(--tc-fill-hover); }
.ui-acg__tab:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(var(--tc-focus-ring-width) * -1); }
.ui-acg__tab[aria-selected="true"] { color: var(--tc-text-primary); }
.ui-acg__tab[aria-selected="true"]::after { content: ""; position: absolute; left: var(--tc-space-2); right: var(--tc-space-2); bottom: calc(var(--tc-hairline) * -1); border-bottom: var(--tc-acg-indicator) solid currentColor; }
.ui-acg__count { min-width: var(--tc-space-5); padding: 0 var(--tc-space-1-5); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; text-align: center; color: var(--tc-text-secondary); }
/* Grouped by source */
.ui-acg__body { display: grid; padding: var(--tc-space-1) var(--tc-space-4) var(--tc-space-2); }
.ui-acg__group + .ui-acg__group { margin-top: var(--tc-space-2); }
.ui-acg__source { display: flex; align-items: center; gap: var(--tc-space-2); padding: var(--tc-space-2-5) 0 var(--tc-space-1); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); letter-spacing: var(--tc-tracking-caps); text-transform: uppercase; color: var(--tc-text-muted); }
.ui-acg__source-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-acg__source-count { font-variant-numeric: tabular-nums; }
.ui-acg__logo { display: grid; flex: none; place-items: center; width: var(--tc-acg-logo); height: var(--tc-acg-logo); overflow: hidden; border-radius: var(--tc-radius-sm); background: var(--tc-fill-default); font-size: var(--tc-font-size-2xs); letter-spacing: 0; color: var(--tc-text-secondary); }
.ui-acg__logo img { display: block; width: 100%; height: 100%; object-fit: cover; }
/* A grant */
.ui-acg__row { display: grid; grid-template-columns: minmax(0, 1fr) auto; column-gap: var(--tc-space-3); row-gap: var(--tc-space-2); align-items: start; padding: var(--tc-space-3) 0; border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-acg__group:last-child .ui-acg__row:last-child { border-bottom: 0; }
.ui-acg__main { display: grid; gap: var(--tc-space-1); min-width: 0; }
.ui-acg__level { display: inline-flex; align-items: center; justify-self: start; gap: var(--tc-space-1); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); color: var(--tc-text-secondary); white-space: nowrap; }
.ui-acg__level .ui-acg__glyph { width: 12px; height: 12px; }
.ui-acg__level[data-level="write"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-acg__level[data-level="act"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-acg__scope { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); overflow-wrap: anywhere; }
.ui-acg__meta { display: flex; flex-wrap: wrap; column-gap: var(--tc-space-3); row-gap: var(--tc-space-0-5); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-acg__expiry { display: inline-flex; align-items: center; gap: var(--tc-space-1); }
.ui-acg__expiry .ui-acg__glyph { width: 12px; height: 12px; }
.ui-acg__expiry[data-state="soon"] { font-weight: var(--tc-font-weight-medium); color: var(--tc-status-warning-fg); }
.ui-acg__expiry[data-state="expired"] { font-weight: var(--tc-font-weight-medium); color: var(--tc-status-danger-fg); }
.ui-acg__row[data-expiry="expired"] .ui-acg__scope { color: var(--tc-text-secondary); text-decoration: line-through; text-decoration-color: var(--tc-border-strong); }
.ui-acg__drift { display: flex; align-items: flex-start; gap: var(--tc-space-1-5); margin-top: var(--tc-space-1); padding: var(--tc-space-1-5) var(--tc-space-2-5); border-radius: var(--tc-radius-md); background: var(--tc-status-warning-bg); font-size: var(--tc-font-size-sm); color: var(--tc-status-warning-fg); }
.ui-acg__drift .ui-acg__glyph { margin-top: var(--tc-space-0-5); }
.ui-acg__drift strong { font-weight: var(--tc-font-weight-medium); }
.ui-acg__actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--tc-space-1-5); }
.ui-acg__btn[data-kind="revoke"] { color: var(--tc-status-danger-fg); }
.ui-acg__btn[data-kind="review"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); box-shadow: none; }
.ui-acg__btn[aria-expanded="true"] { background: var(--tc-fill-selected); box-shadow: none; }
/* The panel under a row: confirm a revoke, or review a change */
.ui-acg__panel { grid-column: 1 / -1; display: grid; gap: var(--tc-space-1-5); padding: var(--tc-space-3); border-radius: var(--tc-radius-lg); background: var(--tc-surface-well); animation: ui-acg-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-acg__panel { border-radius: var(--tc-radius-md); background: var(--tc-fill-subtle); }
.ui-acg__panel-title { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-acg__panel-body { font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-acg__panel-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--tc-space-2); margin-top: var(--tc-space-1); }
.ui-acg__danger.tc-btn-sm { background: var(--tc-action-danger-bg); color: var(--tc-action-danger-fg); box-shadow: none; }
.ui-acg__danger.tc-btn-sm:hover { background: var(--tc-action-danger-bg-hover); }
.ui-acg__empty { padding: var(--tc-space-6) 0; font-size: var(--tc-font-size-sm); text-align: center; color: var(--tc-text-muted); }
@keyframes ui-acg-in { from { opacity: 0; transform: translateY(-3px); } to { opacity: 1; transform: none; } }
/* Narrow: a row's buttons go under it */
@container (max-width: 440px) {
  .ui-acg__row { grid-template-columns: minmax(0, 1fr); }
  .ui-acg__actions { justify-content: flex-start; }
  .ui-acg__body { padding-left: var(--tc-space-3); padding-right: var(--tc-space-3); }
}
@media (pointer: coarse) {
  .ui-acg__btn, .ui-acg__tab { min-height: 36px; }
}
@media (forced-colors: active) {
  .ui-acg__level, .ui-acg__drift, .ui-acg__panel { border: 1px solid CanvasText; }
  .ui-acg__tab[aria-selected="true"]::after { border-color: Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="acg"] *, [data-ui="acg"] *::before, [data-ui="acg"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-access-grants")) customElements.define("tc-access-grants", TcAccessGrants);

declare global {
  interface HTMLElementTagNameMap {
    "tc-access-grants": TcAccessGrants;
  }
}
