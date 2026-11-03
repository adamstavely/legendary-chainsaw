import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { formatDate } from "./internal/util";
import type { CheckCounts } from "./check-status";
import "./switch";

/*
 * <tc-pull-request> – one pull request at a glance, for a session's side panel: its title and number, which branch goes
 * into which, who wrote it and when, lines changed, the review, the checks as a small bar with words, and whether it can
 * merge. The button at the foot follows the state: Mark ready on a draft, Merge on an open one (with a reason when it
 * can't), nothing once it's merged or closed. Behind its base it offers Update branch; with conflicts, Resolve.
 *   · nothing here talks to a server: every button is an event, and the page changes the data when it's done
 *   · times are relative to `now`, or to the element's own clock, refreshed every minute
 *   · with no `number` and no `prTitle` it says there's no pull request and offers Create pull request
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-pull-request number="128" pr-title="Add the booking calendar" state="open" head="feature/booking-calendar" base="main"
 *     mergeable="clean" .checks=${{ passing: 6, failing: 0, pending: 1, skipped: 0 }}></tc-pull-request>
 */

export type PullRequestState = "draft" | "open" | "merged" | "closed";
export type PullRequestReview = "none" | "requested" | "approved" | "changes" | "commented";
export type PullRequestReviewer = { name: string; state: Exclude<PullRequestReview, "none"> };
export type PullRequestMergeable = "clean" | "conflicts" | "blocked" | "behind" | "unknown";
export type PullRequestMergeMethod = "merge" | "squash" | "rebase";
export type PullRequestActionItem = { id: string; label: string; icon: string | string[] };
export type PullRequestLabels = Record<PullRequestState, string> & {
  merge: string;
  squash: string;
  rebase: string;
  mergeButton: string;
  ready: string;
  updateBranch: string;
  resolve: string;
  autoMerge: string;
  method: string;
  checks: string;
  noChecks: string;
  empty: string;
  create: string;
  clean: string;
  conflicts: string;
  blocked: string;
  behind: string;
  unknown: string;
  failingReason: string;
  reviewNone: string;
  reviewRequested: string;
  reviewApproved: string;
  reviewChanges: string;
  reviewCommented: string;
};

/** Details of the events */
export type PullRequestDetail = { number?: number };
export type PullRequestMerge = { number?: number; method: PullRequestMergeMethod };
export type PullRequestAutoMergeChange = { autoMerge: boolean; method: PullRequestMergeMethod };
export type PullRequestMergeMethodChange = { mergeMethod: PullRequestMergeMethod };
export type PullRequestOpen = { number?: number; url?: string };
export type PullRequestAction = { id: string };

/** The words used when the page gives none */
export const defaultPullRequestLabels: PullRequestLabels = {
  draft: "Draft",
  open: "Open",
  merged: "Merged",
  closed: "Closed",
  merge: "Merge commit",
  squash: "Squash and merge",
  rebase: "Rebase and merge",
  mergeButton: "Merge",
  ready: "Mark ready",
  updateBranch: "Update branch",
  resolve: "Resolve",
  autoMerge: "Merge when ready",
  method: "Merge method",
  checks: "Checks",
  noChecks: "No checks",
  empty: "No pull request for this branch",
  create: "Create pull request",
  clean: "No conflicts with the base branch",
  conflicts: "Conflicts with the base branch",
  blocked: "Blocked by the branch's rules",
  behind: "Behind the base branch",
  unknown: "Checking whether it can merge",
  failingReason: "Fix the failing checks to merge",
  reviewNone: "No reviews",
  reviewRequested: "Review requested",
  reviewApproved: "Approved",
  reviewChanges: "Changes requested",
  reviewCommented: "Commented",
};

/* Marks and the header's icon: Lucide (ISC, lucide.dev) */
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const MARK: Record<PullRequestState, ReturnType<typeof svg>> = {
  open: svg`<circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><path d="M13 6h3a2 2 0 0 1 2 2v7"></path><path d="M6 9v12"></path>`,
  draft: svg`<circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><path d="M18 6V5"></path><path d="M18 11v-1"></path><path d="M6 9v12"></path>`,
  merged: svg`<circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><path d="M6 21V9a9 9 0 0 0 9 9"></path>`,
  closed: svg`<circle cx="6" cy="6" r="3"></circle><path d="M6 9v12"></path><path d="m21 3-6 6"></path><path d="m21 9-6-6"></path><path d="M18 11.5V15"></path><circle cx="18" cy="18" r="3"></circle>`,
};
const REVIEW_MARK: Record<PullRequestReview, ReturnType<typeof svg>> = {
  none: svg`<circle cx="12" cy="12" r="10"></circle>`,
  requested: svg`<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path><circle cx="12" cy="12" r="3"></circle>`,
  approved: svg`<path d="M20 6 9 17l-5-5"></path>`,
  changes: svg`<path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"></path>`,
  commented: svg`<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path>`,
};
const MERGE_MARK: Record<PullRequestMergeable, ReturnType<typeof svg>> = {
  clean: svg`<path d="M20 6 9 17l-5-5"></path>`,
  conflicts: svg`<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path>`,
  blocked: svg`<rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>`,
  behind: svg`<path d="M12 5v14"></path><path d="m19 12-7 7-7-7"></path>`,
  unknown: svg`<circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path>`,
};
const createIcon = svg`<path d="M5 12h14"></path><path d="M12 5v14"></path>`;
const glyph = (paths: string | string[]) =>
  html`<svg class="ui-prq__action-glyph" viewBox="0 0 24 24" aria-hidden="true">${(Array.isArray(paths) ? paths : [paths]).map((d) => svg`<path d=${d}></path>`)}</svg>`;

const MIN = 60_000;
const METHODS: PullRequestMergeMethod[] = ["merge", "squash", "rebase"];
const REVIEW_WORD: Record<PullRequestReview, keyof PullRequestLabels> = {
  none: "reviewNone",
  requested: "reviewRequested",
  approved: "reviewApproved",
  changes: "reviewChanges",
  commented: "reviewCommented",
};
let uidCount = 0;

/** Epoch ms from epoch ms or an ISO string; undefined when it can't be read */
const toMs = (v: number | string | undefined) => {
  if (v === undefined || v === "") return undefined;
  const ms = typeof v === "number" ? v : Date.parse(v);
  return Number.isFinite(ms) ? ms : undefined;
};

/**
 * One pull request at a glance: branches, author, lines changed, review, checks and whether it can merge, with the button its state calls for.
 * @tag tc-pull-request
 * @fires tc-open - The title was pressed ({ number, url }: PullRequestOpen); cancelable – prevented, a link isn't followed
 * @fires tc-merge - Merge was pressed ({ number, method }: PullRequestMerge); cancelable
 * @fires tc-ready - Mark ready was pressed ({ number }: PullRequestDetail); cancelable
 * @fires tc-update-branch - Update branch was pressed ({ number }: PullRequestDetail); cancelable
 * @fires tc-resolve - Resolve was pressed on conflicts ({ number }: PullRequestDetail); cancelable
 * @fires tc-checks - The checks were pressed ({ number }: PullRequestDetail)
 * @fires tc-create - Create pull request was pressed in the empty state ({ number }: PullRequestDetail)
 * @fires tc-action - A header button was pressed ({ id }: PullRequestAction)
 * @fires tc-auto-merge-change - The auto-merge switch changed ({ autoMerge, method }: PullRequestAutoMergeChange); cancelable – prevented, the switch stays as it was
 * @fires tc-merge-method-change - A merge method was picked ({ mergeMethod }: PullRequestMergeMethodChange); cancelable – prevented, the method stays as it was
 */
export class TcPullRequest extends TcElement {
  static override ui = "prq";

  /** The heading; empty draws no header */
  @property() accessor heading = "Pull request";
  /** Its number; with neither this nor `prTitle` the empty state shows */
  @property({ type: Number }) accessor number: number | undefined = undefined;
  /** Its title */
  @property({ attribute: "pr-title" }) accessor prTitle = "";
  /** Where it lives; the title becomes a link to it */
  @property() accessor url: string | undefined = undefined;
  /** Draft, open, merged or closed */
  @property({ reflect: true }) accessor state: PullRequestState = "open";
  /** The branch with the changes */
  @property() accessor head = "";
  /** The branch it goes into */
  @property() accessor base = "";
  /** Who opened it */
  @property() accessor author: string | undefined = undefined;
  /** When it last changed: epoch ms or an ISO string */
  @property({ attribute: false }) accessor updatedAt: number | string | undefined = undefined;
  /** Lines added */
  @property({ type: Number }) accessor additions: number | undefined = undefined;
  /** Lines removed */
  @property({ type: Number }) accessor deletions: number | undefined = undefined;
  /** Files changed */
  @property({ type: Number }) accessor files: number | undefined = undefined;
  /** The review as a whole */
  @property() accessor review: PullRequestReview = "none";
  /** Who reviewed it, or was asked to */
  @property({ attribute: false }) accessor reviewers: PullRequestReviewer[] = [];
  /** How its checks went; unset draws no checks row */
  @property({ attribute: false }) accessor checks: CheckCounts | undefined = undefined;
  /** Whether it can merge into its base */
  @property() accessor mergeable: PullRequestMergeable = "unknown";
  /** Merge on its own once the checks pass. Changed by the switch unless a tc-auto-merge-change listener calls preventDefault() */
  @property({ type: Boolean, attribute: "auto-merge" }) accessor autoMerge = false;
  /** How Merge merges. Changed by the picker unless a tc-merge-method-change listener calls preventDefault() */
  @property({ attribute: "merge-method" }) accessor mergeMethod: PullRequestMergeMethod = "merge";
  /** The methods offered; with one, there's no picker */
  @property({ attribute: false }) accessor mergeMethods: PullRequestMergeMethod[] = METHODS;
  /** Something is under way: the buttons wait */
  @property({ type: Boolean, reflect: true }) accessor busy = false;
  /** Small buttons in the header */
  @property({ attribute: false }) accessor actions: PullRequestActionItem[] = [];
  /** Rename any of the words, over the defaults */
  @property({ attribute: false }) accessor labels: Partial<PullRequestLabels> = {};
  /** The time now, epoch ms; by default the element's own clock */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** The language for times and numbers, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;
  /** Drops the tray and card */
  @property({ type: Boolean, reflect: true }) accessor bare = false;

  @state() private accessor clock = 0;
  @state() private accessor announce = "";
  private timer = 0;
  private uid = `tc-prq-${++uidCount}`;

  override connectedCallback() {
    super.connectedCallback();
    this.tick();
  }
  override disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this.timer);
    this.timer = 0;
  }
  private tick() {
    clearInterval(this.timer);
    this.timer = 0;
    if (this.now !== undefined) return;
    this.readClock();
    this.timer = window.setInterval(this.readClock, MIN);
  }
  private readClock = () => (this.clock = Date.now());
  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("now") && this.isConnected) this.tick();
  }

  private word<K extends keyof PullRequestLabels>(key: K) {
    return this.labels[key] ?? defaultPullRequestLabels[key];
  }
  private num(n: number) {
    return n.toLocaleString(this.locale);
  }
  private ago(ms: number) {
    const time = this.now ?? this.clock;
    const diff = Math.max(0, time - ms);
    const rtf = new Intl.RelativeTimeFormat(this.locale, { numeric: "auto", style: "short" });
    if (diff < MIN) return "just now";
    if (diff < 60 * MIN) return rtf.format(-Math.floor(diff / MIN), "minute");
    if (diff < 24 * 60 * MIN) return rtf.format(-Math.floor(diff / (60 * MIN)), "hour");
    if (diff < 7 * 24 * 60 * MIN) return rtf.format(-Math.floor(diff / (24 * 60 * MIN)), "day");
    return formatDate(ms, this.locale, { month: "short", day: "numeric" });
  }
  private get empty() {
    return this.number === undefined && !this.prTitle;
  }
  private get methods() {
    const list = this.mergeMethods.filter((m) => METHODS.includes(m));
    return list.length ? list : METHODS;
  }
  private get method() {
    return this.methods.includes(this.mergeMethod) ? this.mergeMethod : this.methods[0];
  }

  /** Why Merge can't be pressed, or null when it can */
  private blockedReason(): string | null {
    if (this.mergeable === "conflicts") return this.word("conflicts");
    if (this.mergeable === "blocked") return this.word("blocked");
    if (this.mergeable === "unknown") return this.word("unknown");
    if (this.checks?.failing) return this.word("failingReason");
    return null;
  }

  /** "5 of 7 passed, 1 failed, 1 pending" */
  private checkWords(c: CheckCounts) {
    const total = c.passing + c.failing + c.pending;
    if (!total) return c.skipped ? `${c.skipped} skipped` : this.word("noChecks");
    const parts = [`${c.passing} of ${total} passed`];
    if (c.failing) parts.push(`${c.failing} failed`);
    if (c.pending) parts.push(`${c.pending} pending`);
    return parts.join(", ");
  }

  private reviewWords() {
    const w = this.word(REVIEW_WORD[this.review]);
    const names = this.reviewers.filter((r) => (this.review === "requested" ? r.state === "requested" : r.state === this.review)).map((r) => r.name);
    if (!names.length) return w;
    const by = this.review === "requested" ? "from" : "by";
    return `${w} ${by} ${new Intl.ListFormat(this.locale, { type: "conjunction" }).format(names)}`;
  }

  private fire(name: "tc-merge" | "tc-ready" | "tc-update-branch" | "tc-resolve", note: string) {
    const detail = name === "tc-merge" ? { number: this.number, method: this.method } : { number: this.number };
    if (this.emit(name, detail, { cancelable: true })) this.announce = note;
  }

  private onOpen(e: MouseEvent) {
    const go = this.emit<PullRequestOpen>("tc-open", { number: this.number, url: this.url }, { cancelable: true });
    if (!go || !this.url) e.preventDefault();
  }

  private onAutoMerge(e: CustomEvent<{ value: boolean }>) {
    e.stopPropagation();
    const autoMerge = e.detail.value;
    if (!this.emit<PullRequestAutoMergeChange>("tc-auto-merge-change", { autoMerge, method: this.method }, { cancelable: true })) {
      e.preventDefault();
      return;
    }
    this.autoMerge = autoMerge;
  }

  private onMethod(e: Event) {
    const select = e.target as HTMLSelectElement;
    const mergeMethod = select.value as PullRequestMergeMethod;
    if (!this.emit<PullRequestMergeMethodChange>("tc-merge-method-change", { mergeMethod }, { cancelable: true })) {
      select.value = this.method;
      return;
    }
    this.mergeMethod = mergeMethod;
  }

  private renderChecks(c: CheckCounts) {
    const words = this.checkWords(c);
    const parts = (["failing", "pending", "passing", "skipped"] as const).filter((k) => c[k] > 0);
    return html`<button type="button" class="ui-prq__row ui-prq__checks" @click=${() => this.emit<PullRequestDetail>("tc-checks", { number: this.number })}>
      <span class="ui-prq__label">${this.word("checks")}</span>
      <span class="ui-prq__bar" aria-hidden="true">${parts.map((k) => html`<span class="ui-prq__seg" data-state=${k} style=${`flex-grow: ${c[k]}`}></span>`)}</span>
      <span class="ui-prq__value">${words}</span>
    </button>`;
  }

  private renderMergeable() {
    const m = this.mergeable;
    const extra =
      m === "behind"
        ? html`<button type="button" class="tc-btn-sm ui-prq__update" ?disabled=${this.busy} @click=${() => this.fire("tc-update-branch", "Updating the branch")}>${this.word("updateBranch")}</button>`
        : m === "conflicts"
          ? html`<button type="button" class="tc-btn-sm ui-prq__resolve" ?disabled=${this.busy} @click=${() => this.fire("tc-resolve", "Resolving conflicts")}>${this.word("resolve")}</button>`
          : nothing;
    return html`<div class="ui-prq__row ui-prq__mergeable" data-mergeable=${m}>
      <span class="ui-prq__mark" aria-hidden="true">${lucide(14, MERGE_MARK[m])}</span>
      <span class="ui-prq__value">${this.word(m)}</span>
      ${extra}
    </div>`;
  }

  private renderFoot() {
    if (this.state === "draft")
      return html`<div class="ui-prq__foot">
        <button type="button" class="ui-prq__primary" ?disabled=${this.busy} @click=${() => this.fire("tc-ready", "Marking ready for review")}>${this.word("ready")}</button>
      </div>`;
    if (this.state !== "open") return nothing;
    const reason = this.blockedReason();
    const reasonId = `${this.uid}-reason`;
    const methods = this.methods;
    return html`<div class="ui-prq__foot">
      <tc-switch class="ui-prq__auto" .label=${this.word("autoMerge")} .value=${this.autoMerge} ?disabled=${this.busy} @tc-value-change=${(e: CustomEvent<{ value: boolean }>) => this.onAutoMerge(e)}></tc-switch>
      <div class="ui-prq__merge">
        ${methods.length > 1
          ? html`<select class="ui-prq__method" aria-label=${this.word("method")} ?disabled=${this.busy} @change=${(e: Event) => this.onMethod(e)}>
              ${methods.map((m) => html`<option value=${m} .selected=${live(m === this.method)}>${this.word(m)}</option>`)}
            </select>`
          : nothing}
        <button
          type="button"
          class="ui-prq__primary"
          ?disabled=${this.busy || !!reason}
          aria-describedby=${ifDefined(reason ? reasonId : undefined)}
          @click=${() => this.fire("tc-merge", "Merging")}
        >${this.word("mergeButton")}</button>
      </div>
      ${reason ? html`<p class="ui-prq__reason" id=${reasonId}>${reason}</p>` : nothing}
    </div>`;
  }

  private renderBody() {
    if (this.empty)
      return html`<div class="ui-prq__empty">
        <p class="ui-prq__empty-text">${this.word("empty")}</p>
        <button type="button" class="tc-btn-sm ui-prq__create" ?disabled=${this.busy} @click=${() => this.emit<PullRequestDetail>("tc-create", { number: undefined })}>${lucide(14, createIcon)}${this.word("create")}</button>
      </div>`;
    const updated = toMs(this.updatedAt);
    const by = [this.author, updated !== undefined ? this.ago(updated) : undefined].filter(Boolean).join(" · ");
    const lines = this.additions !== undefined || this.deletions !== undefined || this.files !== undefined;
    const ongoing = this.state === "open" || this.state === "draft";
    const titleText = html`<span class="ui-prq__title-text">${this.prTitle || `#${this.number}`}</span>${this.number !== undefined && this.prTitle ? html` <span class="ui-prq__number">#${this.number}</span>` : nothing}`;
    return html`<div class="ui-prq__summary">
        <div class="ui-prq__top">
          <span class="ui-prq__state" data-state=${this.state}>${lucide(14, MARK[this.state])}${this.word(this.state)}</span>
          ${by ? html`<span class="ui-prq__by">${by}</span>` : nothing}
        </div>
        ${this.url
          ? html`<a class="ui-prq__title" href=${this.url} target="_blank" rel="noopener noreferrer" @click=${(e: MouseEvent) => this.onOpen(e)}>${titleText}</a>`
          : html`<button type="button" class="ui-prq__title" @click=${(e: MouseEvent) => this.onOpen(e)}>${titleText}</button>`}
        ${this.head || this.base
          ? html`<p class="ui-prq__branches">
              <span class="ui-prq__branch" title=${this.head}>${this.head}</span><span aria-hidden="true">→</span><span class="tc-sr-only"> into </span
              ><span class="ui-prq__branch" title=${this.base}>${this.base}</span>
            </p>`
          : nothing}
        ${lines
          ? html`<p class="ui-prq__lines">
              ${this.additions !== undefined ? html`<span class="ui-prq__add"><span aria-hidden="true">+${this.num(this.additions)}</span><span class="tc-sr-only">${this.num(this.additions)} lines added</span></span>` : nothing}
              ${this.deletions !== undefined ? html`<span class="ui-prq__del"><span aria-hidden="true">−${this.num(this.deletions)}</span><span class="tc-sr-only">${this.num(this.deletions)} lines removed</span></span>` : nothing}
              ${this.files !== undefined ? html`<span class="ui-prq__files">${this.num(this.files)} ${this.files === 1 ? "file" : "files"}</span>` : nothing}
            </p>`
          : nothing}
      </div>
      <div class="ui-prq__rows">
        <div class="ui-prq__row ui-prq__review" data-review=${this.review}>
          <span class="ui-prq__mark" aria-hidden="true">${lucide(14, REVIEW_MARK[this.review])}</span>
          <span class="ui-prq__value">${this.reviewWords()}</span>
        </div>
        ${this.checks ? this.renderChecks(this.checks) : nothing}
        ${ongoing ? this.renderMergeable() : nothing}
      </div>
      ${this.renderFoot()}`;
  }

  protected override render() {
    const actions = this.actions.length
      ? html`<div class="ui-prq__actions">${this.actions.map(
          (a) => html`<button type="button" class="ui-prq__action" title=${a.label} aria-label=${a.label} @click=${() => this.emit<PullRequestAction>("tc-action", { id: a.id })}>${glyph(a.icon)}</button>`,
        )}</div>`
      : undefined;
    return html`${this.heading ? cardHead({ icon: MARK.open, title: this.heading, aside: actions }) : nothing}
      <div class="ui-prq__card" aria-busy=${this.busy ? "true" : "false"}>${this.renderBody()}</div>
      <span class="tc-sr-only" role="status">${this.announce}</span>`;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="prq"] {
  position: relative;
  display: block;
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="prq"] {
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="prq"][bare] { padding: 0; overflow: visible; border-radius: 0; background: none; box-shadow: none; }
[data-ui="prq"] *, [data-ui="prq"] *::before, [data-ui="prq"] *::after { box-sizing: border-box; }
:where([data-ui="prq"] button:not(.tc-btn-sm)) { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="prq"] :is(button, a, select):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="prq"] svg { display: block; flex: none; }
[data-ui="prq"] p { margin: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-prq__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
[data-ui="prq"][bare] .ui-prq__card { border-radius: 0; background: none; box-shadow: none; }
.ui-prq__actions { display: flex; gap: var(--tc-space-0-5); }
.ui-prq__action { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-radius-md); color: var(--tc-icon-muted); }
.ui-prq__action:hover { background: var(--tc-fill-hover); }
.ui-prq__action-glyph { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ui-prq__summary { display: grid; gap: var(--tc-space-1-5); padding: var(--tc-space-3) var(--tc-space-4); }
.ui-prq__top { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-2); }
.ui-prq__state { display: inline-flex; align-items: center; gap: var(--tc-space-1); padding: 0 var(--tc-space-2); border-radius: var(--tc-radius-full); background: var(--tc-fill-subtle); color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); padding-block: var(--tc-space-0-5); line-height: var(--tc-line-height-snug); }
.ui-prq__state[data-state="open"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-prq__state[data-state="merged"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-prq__state[data-state="closed"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-prq__by { min-width: 0; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-prq__title { display: block; color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); text-align: left; text-decoration: none; overflow-wrap: anywhere; }
.ui-prq__title:hover .ui-prq__title-text { text-decoration: underline; }
.ui-prq__number { color: var(--tc-text-muted); font-weight: var(--tc-font-weight-regular); }
.ui-prq__branches { display: flex; align-items: center; gap: var(--tc-space-1); min-width: 0; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-prq__branch { min-width: 0; overflow: hidden; padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-sm); background: var(--tc-fill-subtle); color: var(--tc-text-secondary); font-family: var(--tc-font-mono); text-overflow: ellipsis; white-space: nowrap; }
.ui-prq__lines { display: flex; flex-wrap: wrap; gap: var(--tc-space-2); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; }
.ui-prq__add { color: var(--tc-status-success-fg); }
.ui-prq__del { color: var(--tc-status-danger-fg); }
.ui-prq__files { color: var(--tc-text-muted); }
.ui-prq__rows { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-prq__row { display: flex; align-items: center; gap: var(--tc-space-2); width: 100%; min-height: var(--tc-control-h-sm); padding: var(--tc-space-1-5) var(--tc-space-4); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); text-align: left; }
.ui-prq__row + .ui-prq__row { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-prq__checks:hover { background: var(--tc-fill-hover); }
.ui-prq__label { flex: none; color: var(--tc-text-secondary); }
.ui-prq__value { flex: 1 1 0; min-width: 0; color: var(--tc-text-secondary); overflow-wrap: anywhere; }
.ui-prq__checks .ui-prq__value { flex: 0 1 auto; }
.ui-prq__bar { flex: 1 1 0; display: flex; gap: var(--tc-hairline); min-width: var(--tc-space-6); height: var(--tc-space-1-5); overflow: hidden; border-radius: var(--tc-radius-full); background: var(--tc-fill-subtle); }
.ui-prq__seg { flex-basis: 0; background: var(--tc-text-muted); }
.ui-prq__seg[data-state="passing"] { background: var(--tc-status-success-fg); }
.ui-prq__seg[data-state="failing"] { background: var(--tc-status-danger-fg); }
.ui-prq__seg[data-state="pending"] { background: var(--tc-status-info-fg); }
.ui-prq__mark { flex: none; color: var(--tc-icon-muted); }
[data-review="approved"] > .ui-prq__mark, [data-mergeable="clean"] > .ui-prq__mark { color: var(--tc-status-success-fg); }
[data-review="changes"] > .ui-prq__mark, [data-mergeable="conflicts"] > .ui-prq__mark { color: var(--tc-status-danger-fg); }
[data-mergeable="blocked"] > .ui-prq__mark, [data-mergeable="behind"] > .ui-prq__mark, [data-review="requested"] > .ui-prq__mark { color: var(--tc-status-warning-fg); }
.ui-prq__foot { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-prq__auto { width: auto; }
.ui-prq__merge { display: flex; gap: var(--tc-space-2); }
.ui-prq__method { flex: 1 1 0; min-width: 0; height: var(--tc-control-h-sm); padding: 0 var(--tc-space-1); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); color: var(--tc-text-primary); font: inherit; font-size: var(--tc-font-size-sm); }
.ui-prq__primary { flex: 1 1 0; height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; }
.ui-prq__primary:disabled { opacity: 0.4; cursor: not-allowed; }
.ui-prq__reason { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-prq__empty { display: grid; justify-items: center; gap: var(--tc-space-3); padding: var(--tc-space-5) var(--tc-space-4); text-align: center; }
.ui-prq__empty-text { color: var(--tc-text-muted); }
@container (max-width: 18rem) {
  .ui-prq__merge { flex-direction: column; }
}
@media (forced-colors: active) { .ui-prq__mark { color: CanvasText; } .ui-prq__seg { background: CanvasText; } }
`;
}

if (!customElements.get("tc-pull-request")) customElements.define("tc-pull-request", TcPullRequest);
declare global {
  interface HTMLElementTagNameMap {
    "tc-pull-request": TcPullRequest;
  }
}
