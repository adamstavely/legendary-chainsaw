import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { PopoverController } from "./internal/popover";
import { initials } from "./internal/util";

/*
 * <tc-share-panel> – shares something with people and groups, at a level of access for each, after checking that each
 * one is entitled to see it. Find a person or group, and `checkEntitlement` is asked about them at that level; it's
 * asked again when the level changes, and about everyone who already has access when the panel opens.
 *   · not authorized: the row says so and why, a notice at the top tells the person sharing, and they're left out of the
 *     share. Someone who already has access but is no longer entitled is pointed out, and can be removed
 *   · a group where only some members are entitled: the group can be shared with, and the row says how many won't see it
 *   · a check that fails, or returns something unrecognised, counts as not authorized until Try again succeeds. With no
 *     `checkEntitlement` at all, nobody can be added: it fails closed
 *   · Share waits until every check has finished, and sends only what passed
 * This tells the person sharing what will happen. It isn't the access control: the server still has to enforce it.
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-share-panel resource-name="Trial 12 results" .directory=${people} .access=${access} .checkEntitlement=${check}></tc-share-panel>
 *
 * In the search box ↑ ↓ move through the results, Enter adds one and Escape closes the list.
 */

export type ShareRecipient = {
  id: string;
  kind: "person" | "group";
  name: string;
  /** An email, a team or "24 members" */
  detail?: string;
};
export type ShareLevel = { id: string; label: string };
export type ShareGrant = { recipient: ShareRecipient; level: string };
/** What the check found. `partial` is for a group: `allowed` of its `total` members are entitled */
export type ShareEntitlement =
  | { status: "allowed" }
  | { status: "denied"; reason?: string }
  | { status: "partial"; allowed: number; total: number; reason?: string };
/** Asks whether a recipient may see the data at this level. The signal aborts when the answer is no longer wanted */
export type ShareEntitlementCheck = (recipient: ShareRecipient, level: string, signal: AbortSignal) => ShareEntitlement | Promise<ShareEntitlement>;
/** Looks people and groups up on the server, instead of filtering `directory` */
export type ShareSearch = (query: string, signal: AbortSignal) => ShareRecipient[] | Promise<ShareRecipient[]>;

/** Someone left out of a share, and why: not authorized, or the check couldn't answer */
export type ShareExclusion = ShareGrant & { status: "denied" | "error"; reason: string };
/** A group shared with, whose members aren't all entitled */
export type SharePartial = ShareGrant & { allowed: number; total: number; reason: string };
export type ShareSubmit = {
  /** Who has access once this is done */
  access: ShareGrant[];
  add: ShareGrant[];
  change: ShareGrant[];
  remove: ShareRecipient[];
  /** Left out because they aren't entitled, or couldn't be checked */
  excluded: ShareExclusion[];
  /** Shared with, but some members won't see it */
  partial: SharePartial[];
};
export type ShareDenied = ShareGrant & { entitlement: ShareEntitlement };

/** The panel's words, every one renameable through `labels` */
export type SharePanelLabels = {
  heading: string;
  /** {name} is the resource's name */
  headingNamed: string;
  search: string;
  searchPlaceholder: string;
  noResults: string;
  person: string;
  group: string;
  level: string;
  checking: string;
  notAuthorized: string;
  noLongerAuthorized: string;
  checkFailed: string;
  /** {allowed} of {total} */
  partial: string;
  /** When the check gives no reason */
  noReason: string;
  retry: string;
  remove: string;
  undo: string;
  removing: string;
  empty: string;
  share: string;
  /** {n} */
  shareWith: string;
  saveChanges: string;
  waiting: string;
  /** The notice; {n} is how many */
  noticeDenied: string;
  noticeDeniedOne: string;
  noticeError: string;
  noticeErrorOne: string;
  noticePartial: string;
  noticePartialOne: string;
  noticeExisting: string;
  noticeExistingOne: string;
  noticeUnverified: string;
  noticeUnverifiedOne: string;
  alreadyAdded: string;
  /** After sharing */
  done: string;
  doneExcluded: string;
};
export const defaultSharePanelLabels: SharePanelLabels = {
  heading: "Share",
  headingNamed: "Share {name}",
  search: "Add people or groups",
  searchPlaceholder: "Search by name or email",
  noResults: "No people or groups found",
  person: "Person",
  group: "Group",
  level: "Access",
  checking: "Checking access…",
  notAuthorized: "Not authorized",
  noLongerAuthorized: "No longer authorized",
  checkFailed: "Couldn't check access",
  partial: "{allowed} of {total} members can see this",
  noReason: "They aren't entitled to see this data.",
  retry: "Try again",
  remove: "Remove",
  undo: "Undo",
  removing: "Access will be removed",
  empty: "Not shared with anyone yet.",
  share: "Share",
  shareWith: "Share with {n}",
  saveChanges: "Save changes",
  waiting: "Waiting for access checks to finish.",
  noticeDenied: "{n} people or groups aren't authorized to see this and won't be included.",
  noticeDeniedOne: "1 person or group isn't authorized to see this and won't be included.",
  noticeError: "{n} couldn't be checked and won't be included unless a new check succeeds.",
  noticeErrorOne: "1 couldn't be checked and won't be included unless a new check succeeds.",
  noticePartial: "{n} groups include members who aren't authorized. Those members won't see this.",
  noticePartialOne: "1 group includes members who aren't authorized. Those members won't see this.",
  noticeExisting: "{n} with access are no longer authorized. Review whether to remove them.",
  noticeExistingOne: "1 with access is no longer authorized. Review whether to remove them.",
  noticeUnverified: "{n} with access couldn't be checked. Their access hasn't changed.",
  noticeUnverifiedOne: "1 with access couldn't be checked. Their access hasn't changed.",
  alreadyAdded: "Already added",
  done: "Sharing updated.",
  doneExcluded: "Sharing updated. {n} not included because of access checks.",
};

/** The levels when `levels` isn't set, least access first */
export const defaultShareLevels: ShareLevel[] = [
  { id: "view", label: "Can view" },
  { id: "comment", label: "Can comment" },
  { id: "edit", label: "Can edit" },
];

type RowStatus = "checking" | "allowed" | "denied" | "partial" | "error";
type Row = {
  recipient: ShareRecipient;
  level: string;
  /** The level they already have, or null for someone being added */
  saved: string | null;
  removing: boolean;
  status: RowStatus;
  reason: string;
  allowed: number;
  total: number;
};

const SHARE_ICON = svg`<circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"></path>`;
const GROUP_ICON = svg`<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path>`;
const ALERT_ICON = svg`<circle cx="12" cy="12" r="10"></circle><path d="m4.9 4.9 14.2 14.2"></path>`;
const WARN_ICON = svg`<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z"></path><path d="M12 9v4M12 17h.01"></path>`;
const icon = (shape: unknown) => html`<svg class="ui-shr__icon" viewBox="0 0 24 24" aria-hidden="true">${shape}</svg>`;
const SEARCH_DELAY = 200;
let instances = 0;

/** Only a shape we recognise counts: anything else fails closed */
function readEntitlement(e: unknown): ShareEntitlement | null {
  const r = e as { status?: unknown; allowed?: unknown; total?: unknown; reason?: unknown } | null | undefined;
  if (r?.status === "allowed") return { status: "allowed" };
  const reason = typeof r?.reason === "string" ? r.reason : undefined;
  if (r?.status === "denied") return { status: "denied", reason };
  if (r?.status === "partial" && Number.isFinite(r.allowed) && Number.isFinite(r.total)) {
    const total = Math.max(0, r.total as number);
    const allowed = Math.min(total, Math.max(0, r.allowed as number));
    // Nobody in the group can see it, so it's a refusal; everybody can, so it's a yes
    if (allowed === 0) return { status: "denied", reason };
    if (allowed === total) return { status: "allowed" };
    return { status: "partial", allowed, total, reason };
  }
  return null;
}

/**
 * Shares something with people and groups, at a level for each, after checking each is entitled to see it.
 * @tag tc-share-panel
 * @fires tc-share - Share was pressed ({ access, add, change, remove, excluded, partial }: ShareSubmit); cancelable – prevented, `access` stays as it was and the rows stay pending
 * @fires tc-share-denied - A check found someone isn't entitled ({ recipient, level, entitlement }: ShareDenied)
 */
export class TcSharePanel extends TcElement {
  static override ui = "shr";

  /** The heading; by default "Share", or "Share {resource-name}" */
  @property() accessor heading = "";
  /** A line under the heading, such as the data's classification */
  @property() accessor description: string | undefined = undefined;
  /** What's being shared */
  @property({ attribute: "resource-name" }) accessor resourceName = "";
  /** The people and groups to choose from, filtered as you type. Ignored when `search` is set */
  @property({ attribute: false }) accessor directory: ShareRecipient[] = [];
  /** Looks people and groups up on the server */
  @property({ attribute: false }) accessor search: ShareSearch | undefined = undefined;
  /** Who has access now. Updated on Share unless a tc-share listener calls preventDefault() */
  @property({ attribute: false }) accessor access: ShareGrant[] = [];
  /** The levels of access, least first */
  @property({ attribute: false }) accessor levels: ShareLevel[] = defaultShareLevels;
  /** The level someone starts at; by default the first */
  @property({ attribute: "default-level" }) accessor defaultLevel = "";
  /** Asks whether a recipient may see the data at a level. Without it nobody can be added */
  @property({ attribute: false }) accessor checkEntitlement: ShareEntitlementCheck | undefined = undefined;
  /** The page is sending the share: controls are locked */
  @property({ type: Boolean, reflect: true }) accessor sending = false;
  /** Rename any of the words */
  @property({ attribute: false }) accessor labels: Partial<SharePanelLabels> = {};

  @state() private accessor rows: Row[] = [];
  @state() private accessor query = "";
  @state() private accessor results: ShareRecipient[] = [];
  @state() private accessor activeResult = 0;
  @state() private accessor announce = "";
  private readonly uid = `tc-shr-${++instances}`;
  private readonly checks = new Map<string, AbortController>();
  private searchAbort: AbortController | undefined;
  private searchTimer = 0;
  private queued: string[] = [];

  private readonly pop = new PopoverController(this, {
    popover: () => this.querySelector<HTMLElement>(".ui-shr__results"),
    anchor: () => this.querySelector<HTMLElement>(".ui-shr__search"),
    side: "bottom",
    align: "start",
    kind: "dialog",
    closeOnFocusOut: true,
    onClose: () => this.requestUpdate(),
  });

  private get words(): SharePanelLabels {
    return { ...defaultSharePanelLabels, ...this.labels };
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    for (const c of this.checks.values()) c.abort();
    this.checks.clear();
    this.searchAbort?.abort();
    window.clearTimeout(this.searchTimer);
  }

  override connectedCallback() {
    super.connectedCallback();
    // Checks stopped on the way out start again on the way back
    this.queued = this.rows.filter((r) => r.status === "checking").map((r) => r.recipient.id);
    if (this.queued.length) this.requestUpdate();
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("access")) this.syncAccess();
    // A different check means earlier answers no longer count
    if (changed.has("checkEntitlement")) this.queued = this.rows.map((r) => r.recipient.id);
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    const queued = this.queued;
    this.queued = [];
    for (const id of queued) this.runCheck(id);
  }

  /** `access` is what's saved; rows being added stay, and answers still true are kept */
  private syncAccess() {
    const had = new Map(this.rows.map((r) => [r.recipient.id, r]));
    const saved = this.access.map(({ recipient, level }): Row => {
      const old = had.get(recipient.id);
      if (old && old.level === level) return { ...old, recipient, saved: level, removing: false };
      this.queued.push(recipient.id);
      return { recipient, level, saved: level, removing: false, status: "checking", reason: "", allowed: 0, total: 0 };
    });
    const known = new Set(this.access.map((g) => g.recipient.id));
    const drafts = this.rows.filter((r) => r.saved === null && !known.has(r.recipient.id));
    for (const r of this.rows) if (r.saved !== null && !known.has(r.recipient.id)) this.cancelCheck(r.recipient.id);
    this.rows = [...saved, ...drafts];
  }

  private cancelCheck(id: string) {
    this.checks.get(id)?.abort();
    this.checks.delete(id);
  }

  private patchRow(id: string, patch: Partial<Row>) {
    this.rows = this.rows.map((r) => (r.recipient.id === id ? { ...r, ...patch } : r));
  }

  private async runCheck(id: string) {
    const row = this.rows.find((r) => r.recipient.id === id);
    if (!row) return;
    this.cancelCheck(id);
    const fn = this.checkEntitlement;
    if (!fn) {
      this.patchRow(id, { status: "error", reason: "" });
      return;
    }
    const controller = new AbortController();
    this.checks.set(id, controller);
    this.patchRow(id, { status: "checking", reason: "" });
    let answer: ShareEntitlement | null = null;
    try {
      answer = readEntitlement(await fn(row.recipient, row.level, controller.signal));
    } catch {
      answer = null;
    }
    // A newer check, a removal or leaving the page has taken over: this answer no longer applies
    if (controller.signal.aborted || this.checks.get(id) !== controller) return;
    this.checks.delete(id);
    const current = this.rows.find((r) => r.recipient.id === id);
    if (!current) return;
    if (!answer) {
      this.patchRow(id, { status: "error", reason: "" });
    } else if (answer.status === "allowed") {
      this.patchRow(id, { status: "allowed", reason: "" });
    } else if (answer.status === "denied") {
      this.patchRow(id, { status: "denied", reason: answer.reason ?? "" });
      this.emit<ShareDenied>("tc-share-denied", { recipient: current.recipient, level: current.level, entitlement: answer });
    } else {
      this.patchRow(id, { status: "partial", reason: answer.reason ?? "", allowed: answer.allowed, total: answer.total });
      this.emit<ShareDenied>("tc-share-denied", { recipient: current.recipient, level: current.level, entitlement: answer });
    }
  }

  private levelName(id: string) {
    return this.levels.find((l) => l.id === id)?.label ?? id;
  }

  private addRecipient(recipient: ShareRecipient) {
    this.query = "";
    this.results = [];
    this.pop.close();
    if (!this.rows.some((r) => r.recipient.id === recipient.id)) {
      const level = this.levels.some((l) => l.id === this.defaultLevel) ? this.defaultLevel : (this.levels[0]?.id ?? "");
      this.rows = [...this.rows, { recipient, level, saved: null, removing: false, status: "checking", reason: "", allowed: 0, total: 0 }];
      this.queued.push(recipient.id);
    }
    this.updateComplete.then(() => this.querySelector<HTMLInputElement>(".ui-shr__search")?.focus());
  }

  private setLevel(row: Row, level: string) {
    this.patchRow(row.recipient.id, { level, status: "checking", reason: "" });
    this.queued.push(row.recipient.id);
  }

  private removeRow(row: Row) {
    if (row.saved === null) {
      this.cancelCheck(row.recipient.id);
      this.rows = this.rows.filter((r) => r !== row);
      this.updateComplete.then(() => this.querySelector<HTMLInputElement>(".ui-shr__search")?.focus());
      return;
    }
    this.patchRow(row.recipient.id, { removing: !row.removing });
    const id = row.recipient.id;
    this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-recipient="${CSS.escape(id)}"] .ui-shr__remove`)?.focus());
  }

  // Search

  private onInput(e: Event) {
    this.query = (e.target as HTMLInputElement).value;
    this.activeResult = 0;
    this.searchAbort?.abort();
    window.clearTimeout(this.searchTimer);
    const q = this.query.trim();
    if (!q) {
      this.results = [];
      this.pop.close();
      return;
    }
    if (this.search) {
      this.searchTimer = window.setTimeout(() => void this.runSearch(q), SEARCH_DELAY);
      return;
    }
    const low = q.toLowerCase();
    this.results = this.directory.filter((r) => r.name.toLowerCase().includes(low) || r.detail?.toLowerCase().includes(low));
    this.openResults();
  }

  private async runSearch(q: string) {
    const controller = new AbortController();
    this.searchAbort = controller;
    let found: ShareRecipient[] = [];
    try {
      found = (await this.search!(q, controller.signal)) ?? [];
    } catch {
      found = [];
    }
    if (controller.signal.aborted) return;
    this.results = found;
    this.openResults();
  }

  private openResults() {
    if (!this.pop.open) this.pop.show();
    this.requestUpdate();
  }

  private onSearchKey(e: KeyboardEvent) {
    if (!this.pop.open) return;
    const n = this.results.length;
    if (e.key === "ArrowDown" && n) this.activeResult = (this.activeResult + 1) % n;
    else if (e.key === "ArrowUp" && n) this.activeResult = (this.activeResult - 1 + n) % n;
    else if (e.key === "Enter") {
      const r = this.results[this.activeResult];
      if (r) this.addRecipient(r);
    } else return;
    e.preventDefault();
  }

  // Sharing

  private get pendingChecks() {
    return this.rows.some((r) => r.status === "checking" && !r.removing && (r.saved === null || r.level !== r.saved));
  }
  private get plan(): Omit<ShareSubmit, "access"> {
    const passed = (r: Row) => r.status === "allowed" || r.status === "partial";
    const live_ = this.rows.filter((r) => !r.removing);
    const moved = live_.filter((r) => r.saved === null || r.level !== r.saved);
    const words = this.words;
    return {
      add: moved.filter((r) => r.saved === null && passed(r)).map(({ recipient, level }) => ({ recipient, level })),
      change: moved.filter((r) => r.saved !== null && passed(r)).map(({ recipient, level }) => ({ recipient, level })),
      remove: this.rows.filter((r) => r.removing).map((r) => r.recipient),
      excluded: moved
        .filter((r) => r.status === "denied" || r.status === "error")
        .map((r) => ({ recipient: r.recipient, level: r.level, status: r.status as "denied" | "error", reason: r.status === "error" ? words.checkFailed : r.reason || words.noReason })),
      partial: moved
        .filter((r) => r.status === "partial")
        .map((r) => ({ recipient: r.recipient, level: r.level, allowed: r.allowed, total: r.total, reason: r.reason })),
    };
  }

  private submit() {
    const plan = this.plan;
    if (this.pendingChecks || this.sending || !(plan.add.length + plan.change.length + plan.remove.length)) return;
    const gone = new Set(plan.remove.map((r) => r.id));
    const changed = new Map(plan.change.map((g) => [g.recipient.id, g.level]));
    const access = [
      ...this.access.filter((g) => !gone.has(g.recipient.id)).map((g) => ({ ...g, level: changed.get(g.recipient.id) ?? g.level })),
      ...plan.add,
    ];
    if (!this.emit<ShareSubmit>("tc-share", { access, ...plan }, { cancelable: true })) return;
    // Someone left out at a new level goes back to the level they really have
    const excluded = new Set(plan.excluded.map((e) => e.recipient.id));
    this.rows = this.rows.filter((r) => !(r.removing && r.saved !== null)).map((r) => {
      if (r.saved !== null && excluded.has(r.recipient.id)) {
        this.queued.push(r.recipient.id);
        return { ...r, level: r.saved, status: "checking" as const, reason: "" };
      }
      return r;
    });
    this.access = access;
    this.announce = plan.excluded.length ? this.words.doneExcluded.replace("{n}", String(plan.excluded.length)) : this.words.done;
  }

  private count(one: string, many: string, n: number) {
    return n === 1 ? one : many.replace("{n}", String(n));
  }

  private renderNotice() {
    const w = this.words;
    const live_ = this.rows.filter((r) => !r.removing);
    const isNew = (r: Row) => r.saved === null || r.level !== r.saved;
    const denied = live_.filter((r) => isNew(r) && r.status === "denied").length;
    const failed = live_.filter((r) => isNew(r) && r.status === "error").length;
    const partial = live_.filter((r) => r.status === "partial").length;
    const stale = live_.filter((r) => !isNew(r) && r.status === "denied").length;
    const unverified = live_.filter((r) => !isNew(r) && r.status === "error").length;
    const lines = [
      denied ? { tone: "danger", text: this.count(w.noticeDeniedOne, w.noticeDenied, denied) } : null,
      failed ? { tone: "danger", text: this.count(w.noticeErrorOne, w.noticeError, failed) } : null,
      partial ? { tone: "warning", text: this.count(w.noticePartialOne, w.noticePartial, partial) } : null,
      stale ? { tone: "warning", text: this.count(w.noticeExistingOne, w.noticeExisting, stale) } : null,
      unverified ? { tone: "warning", text: this.count(w.noticeUnverifiedOne, w.noticeUnverified, unverified) } : null,
    ].filter((l) => l !== null);
    return lines.map((l) => html`<p class="ui-shr__notice" data-tone=${l.tone}>${icon(l.tone === "danger" ? ALERT_ICON : WARN_ICON)}<span>${l.text}</span></p>`);
  }

  private renderStatus(row: Row) {
    const w = this.words;
    const isNew = row.saved === null || row.level !== row.saved;
    if (row.removing) return html`<p class="ui-shr__status" data-tone="muted">${w.removing}</p>`;
    if (row.status === "checking") return html`<p class="ui-shr__status" data-tone="muted"><span class="ui-shr__spinner" aria-hidden="true"></span>${w.checking}</p>`;
    if (row.status === "denied")
      return html`<p class="ui-shr__status" data-tone="danger">${icon(ALERT_ICON)}<span><b>${isNew ? w.notAuthorized : w.noLongerAuthorized}.</b> ${row.reason || w.noReason}</span></p>`;
    if (row.status === "partial")
      return html`<p class="ui-shr__status" data-tone="warning">${icon(WARN_ICON)}<span><b>${w.partial.replace("{allowed}", String(row.allowed)).replace("{total}", String(row.total))}.</b>${row.reason ? ` ${row.reason}` : nothing}</span></p>`;
    if (row.status === "error")
      return html`<p class="ui-shr__status" data-tone="danger">${icon(ALERT_ICON)}<span><b>${w.checkFailed}.</b></span>
        <button type="button" class="ui-shr__action ui-shr__retry" ?disabled=${this.sending} @click=${() => this.runCheck(row.recipient.id)}>${w.retry}<span class="tc-sr-only">, ${row.recipient.name}</span></button></p>`;
    return nothing;
  }

  private renderRow(row: Row) {
    const w = this.words;
    const { recipient } = row;
    const statusId = `${this.uid}-${recipient.id}-status`;
    return html`<li class="ui-shr__row" data-recipient=${recipient.id} data-status=${row.status} ?data-removing=${row.removing}>
      <span class="ui-shr__avatar" data-kind=${recipient.kind} aria-hidden="true">${recipient.kind === "group" ? icon(GROUP_ICON) : initials(recipient.name)}</span>
      <div class="ui-shr__who">
        <span class="ui-shr__name">${recipient.name}</span>
        <span class="ui-shr__detail"><span class="ui-shr__kind">${recipient.kind === "group" ? w.group : w.person}</span>${recipient.detail ? ` · ${recipient.detail}` : nothing}</span>
        <div id=${statusId}>${this.renderStatus(row)}</div>
      </div>
      <div class="ui-shr__controls">
        <select
          class="ui-shr__level"
          aria-label=${`${w.level}, ${recipient.name}`}
          aria-describedby=${statusId}
          ?disabled=${this.sending || row.removing}
          @change=${(e: Event) => this.setLevel(row, (e.target as HTMLSelectElement).value)}
        >
          ${this.levels.map((l) => html`<option value=${l.id} .selected=${live(l.id === row.level)}>${l.label}</option>`)}
          ${this.levels.some((l) => l.id === row.level) ? nothing : html`<option value=${row.level} selected>${this.levelName(row.level)}</option>`}
        </select>
        <button type="button" class="ui-shr__action ui-shr__remove" ?disabled=${this.sending} @click=${() => this.removeRow(row)}>${row.removing ? w.undo : w.remove}<span class="tc-sr-only">, ${recipient.name}</span></button>
      </div>
    </li>`;
  }

  private renderResults() {
    const w = this.words;
    return html`<div
      class="tc-pop ui-shr__results"
      id=${`${this.uid}-results`}
      role="listbox"
      aria-label=${w.search}
      @pointerdown=${(e: Event) => e.preventDefault()}
    >
      ${this.results.length
        ? this.results.map((r, i) => {
            const added = this.rows.some((row) => row.recipient.id === r.id);
            return html`<div
              class="ui-shr__result"
              id=${`${this.uid}-result-${i}`}
              role="option"
              aria-selected=${i === this.activeResult ? "true" : "false"}
              @click=${() => this.addRecipient(r)}
            >
              <span class="ui-shr__avatar" data-kind=${r.kind} aria-hidden="true">${r.kind === "group" ? icon(GROUP_ICON) : initials(r.name)}</span>
              <span class="ui-shr__who"><span class="ui-shr__name">${r.name}</span><span class="ui-shr__detail">${r.kind === "group" ? w.group : w.person}${r.detail ? ` · ${r.detail}` : nothing}${added ? ` · ${w.alreadyAdded}` : nothing}</span></span>
            </div>`;
          })
        : html`<div class="ui-shr__none" role="option" aria-selected="false" aria-disabled="true">${w.noResults}</div>`}
    </div>`;
  }

  protected override render() {
    const w = this.words;
    const plan = this.plan;
    const waiting = this.pendingChecks;
    const ready = plan.add.length + plan.change.length + plan.remove.length > 0;
    const label = plan.add.length ? w.shareWith.replace("{n}", String(plan.add.length)) : plan.change.length || plan.remove.length ? w.saveChanges : w.share;
    const heading = this.heading || (this.resourceName ? w.headingNamed.replace("{name}", this.resourceName) : w.heading);
    const open = this.pop.open;
    const titleId = `${this.uid}-title`;
    return html`${cardHead({ icon: SHARE_ICON, title: heading, subtitle: this.description, id: titleId })}
      <div class="ui-shr__card">
        <div class="ui-shr__add">
          <label class="ui-shr__label" for=${`${this.uid}-search`}>${w.search}</label>
          <span class="ui-shr__search-wrap">
            <input
              id=${`${this.uid}-search`}
              class="ui-shr__search"
              role="combobox"
              autocomplete="off"
              placeholder=${w.searchPlaceholder}
              aria-expanded=${open ? "true" : "false"}
              aria-autocomplete="list"
              aria-controls=${`${this.uid}-results`}
              aria-activedescendant=${ifDefined(open && this.results.length ? `${this.uid}-result-${this.activeResult}` : undefined)}
              .value=${live(this.query)}
              ?disabled=${this.sending}
              @input=${this.onInput}
              @keydown=${this.onSearchKey}
            />
          </span>
          ${open ? this.renderResults() : nothing}
        </div>
        ${this.renderNotice()}
        ${this.rows.length
          ? html`<ul class="ui-shr__list" aria-labelledby=${titleId}>${repeat(this.rows, (r) => r.recipient.id, (r) => this.renderRow(r))}</ul>`
          : html`<p class="ui-shr__empty">${w.empty}</p>`}
        <div class="ui-shr__foot">
          ${waiting ? html`<span class="ui-shr__waiting">${w.waiting}</span>` : nothing}
          <button type="button" class="ui-shr__share" ?disabled=${!ready || waiting || this.sending} @click=${this.submit}>${label}</button>
        </div>
      </div>
      <span class="tc-sr-only" role="status">${this.announce}</span>
      <span class="tc-sr-only" role="status" data-live="checks">${this.rows.filter((r) => r.status === "denied" && !r.removing).map((r) => `${r.recipient.name}: ${r.saved === null || r.level !== r.saved ? w.notAuthorized : w.noLongerAuthorized}. `)}</span>`;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="shr"] {
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="shr"] {
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 100%;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* The avatar's size – override it on the element */
[data-ui="shr"] { --tc-shr-avatar: 32px; }
[data-ui="shr"] *, [data-ui="shr"] *::before, [data-ui="shr"] *::after { box-sizing: border-box; }
[data-ui="shr"] :where(p) { margin: 0; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="shr"] .ui-shr__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-shr__add { display: grid; gap: var(--tc-space-1); padding: var(--tc-space-4) var(--tc-space-4) var(--tc-space-3); }
.ui-shr__label { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-shr__search-wrap { display: flex; align-items: center; height: var(--tc-field-h); padding: 0 var(--tc-field-px); border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); }
.ui-shr__search-wrap:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-shr__search-wrap:focus-within { box-shadow: var(--tc-field-shadow-focus); }
.ui-shr__search { flex: 1; width: 100%; min-width: 0; padding: 0; border: 0; outline: 0; background: none; color: var(--tc-text-primary); font: inherit; font-size: var(--tc-field-font-size); }
.ui-shr__search::placeholder { color: var(--tc-text-muted); }
.ui-shr__results { width: min(420px, calc(100vw - var(--tc-space-4))); max-height: 280px; overflow-y: auto; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
.ui-shr__result { display: flex; align-items: center; gap: var(--tc-space-2); min-height: var(--tc-control-h-md); padding: var(--tc-space-1-5) var(--tc-space-2); border-radius: var(--tc-control-radius-sm); cursor: pointer; }
.ui-shr__result:hover, .ui-shr__result[aria-selected="true"] { background: var(--tc-fill-hover); }
.ui-shr__none { padding: var(--tc-space-2); color: var(--tc-text-secondary); }
.ui-shr__notice { display: flex; align-items: flex-start; gap: var(--tc-space-2); margin-inline: var(--tc-space-4); margin-block-end: var(--tc-space-2); padding: var(--tc-space-2) var(--tc-space-3); border-radius: var(--tc-control-radius-md); }
.ui-shr__notice[data-tone="danger"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-shr__notice[data-tone="warning"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-shr__icon { flex: none; width: var(--tc-icon-size-md, 16px); height: var(--tc-icon-size-md, 16px); fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ui-shr__notice .ui-shr__icon, .ui-shr__status .ui-shr__icon { margin-top: var(--tc-space-0-5); }
.ui-shr__list { display: grid; margin: 0; padding: 0; list-style: none; }
.ui-shr__row { display: flex; align-items: flex-start; gap: var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-4); box-shadow: inset 0 var(--tc-hairline) var(--tc-border-subtle); }
.ui-shr__avatar { display: inline-flex; flex: none; align-items: center; justify-content: center; width: var(--tc-shr-avatar); height: var(--tc-shr-avatar); border-radius: var(--tc-radius-full); background: var(--tc-fill-hover); color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-shr__avatar[data-kind="group"] { border-radius: var(--tc-control-radius-md); }
.ui-shr__who { display: grid; flex: 1; gap: var(--tc-space-0-5); min-width: 0; }
.ui-shr__name { font-weight: var(--tc-font-weight-medium); overflow-wrap: anywhere; }
.ui-shr__row[data-removing] .ui-shr__name { text-decoration: line-through; color: var(--tc-text-secondary); }
.ui-shr__detail { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); overflow-wrap: anywhere; }
.ui-shr__status { display: flex; flex-wrap: wrap; align-items: flex-start; gap: var(--tc-space-1-5); margin-block-start: var(--tc-space-1); font-size: var(--tc-font-size-xs); }
.ui-shr__status > span:not(.ui-shr__spinner) { flex: 1 1 10em; min-width: 0; }
.ui-shr__status b { font-weight: var(--tc-font-weight-medium); }
.ui-shr__status[data-tone="muted"] { align-items: center; color: var(--tc-text-secondary); }
.ui-shr__status[data-tone="danger"] { color: var(--tc-status-danger-fg); }
.ui-shr__status[data-tone="warning"] { color: var(--tc-status-warning-fg); }
.ui-shr__spinner { flex: none; width: 12px; height: 12px; border: 2px solid var(--tc-border-subtle); border-top-color: var(--tc-text-secondary); border-radius: var(--tc-radius-full); animation: ui-shr-spin var(--tc-duration-reveal) linear infinite; }
@keyframes ui-shr-spin { to { transform: rotate(360deg); } }
.ui-shr__controls { display: flex; flex: none; align-items: center; gap: var(--tc-space-1); }
.ui-shr__level { height: var(--tc-control-h-sm); padding: 0 var(--tc-space-1); border: 0; border-radius: var(--tc-control-radius-sm); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); color: var(--tc-text-primary); font: inherit; font-size: var(--tc-font-size-xs); }
.ui-shr__level:focus-visible, .ui-shr__action:focus-visible, .ui-shr__share:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-shr__level:disabled { color: var(--tc-text-secondary); }
.ui-shr__action { height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border: 0; border-radius: var(--tc-control-radius-sm); background: none; color: var(--tc-text-secondary); font: inherit; font-size: var(--tc-font-size-xs); font-weight: var(--tc-control-font-weight); cursor: pointer; }
.ui-shr__action:hover:not(:disabled) { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-shr__retry { height: auto; padding: 0; color: inherit; text-decoration: underline; }
.ui-shr__retry:hover:not(:disabled) { background: none; color: inherit; }
.ui-shr__empty { padding: var(--tc-space-4); box-shadow: inset 0 var(--tc-hairline) var(--tc-border-subtle); color: var(--tc-text-secondary); text-align: center; }
.ui-shr__foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-4); box-shadow: inset 0 var(--tc-hairline) var(--tc-border-subtle); }
.ui-shr__waiting { flex: 1 1 12em; color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); }
.ui-shr__share { height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border: 0; border-radius: var(--tc-control-radius-md); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); font: inherit; font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); cursor: pointer; }
.ui-shr__share:hover:not(:disabled) { background: var(--tc-action-primary-bg-hover); }
.ui-shr__share:disabled { background: var(--tc-fill-hover); box-shadow: none; color: var(--tc-text-secondary); cursor: not-allowed; }
@container (max-width: 480px) {
  .ui-shr__row { flex-wrap: wrap; }
  .ui-shr__who { flex-basis: calc(100% - var(--tc-shr-avatar) - var(--tc-space-3)); }
  .ui-shr__controls { width: 100%; justify-content: flex-end; }
}
@media (forced-colors: active) {
  .ui-shr__notice { border: 1px solid CanvasText; }
  .ui-shr__result[aria-selected="true"] { background: Highlight; color: HighlightText; forced-color-adjust: none; }
  .ui-shr__share:disabled { color: GrayText; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-shr__spinner { animation: none; }
}
`;
}

if (!customElements.get("tc-share-panel")) customElements.define("tc-share-panel", TcSharePanel);

declare global {
  interface HTMLElementTagNameMap {
    "tc-share-panel": TcSharePanel;
  }
}
