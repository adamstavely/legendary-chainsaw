import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController, rescueFocus } from "./internal/controllers";

/*
 * <tc-approval-card> – the Lit port of src/components/approval-card.tsx: an AI agent asks before it does something
 * consequential. A header with the action, a risk badge and a preview (recipients, key-value details), then "Always
 * allow this action" in a white card; Approve / Deny (⌘↵ / Esc) sit on the gray tray below it. An optional countdown
 * ("Expires in 0:42") sits quietly in the tray and pauses while you hover or focus the card (or the tab is hidden);
 * "Stop" turns it off. After a decision the tray footer folds away into a compact row.
 *
 *   <tc-approval-card heading="Send campaign email" risk="high" expires-in="45"></tc-approval-card>
 *
 * The host is the group (role="group"), named by the heading (by the resolved row once decided). Clean is one white
 * card: a risk tag, the preview as plain rows under a hairline, and – by default (actions="card") – a last row holding
 * "Always allow this action" and Deny / Approve; with actions="tray" the buttons sit on a gray tray below the card.
 *
 * Optional decision detail (all off unless set, so the card is unchanged without them): `why` – "Why you're seeing
 * this", one line; `consequences` – "If you approve / If you deny"; `editableDetails` – an "Edit arguments" mode that
 * turns the text details into fields (each change fires a cancelable tc-details-change); `evidence` – chips that open
 * the sources the request rests on.
 */

// The header icon: a shield with a check – a request to approve
const shieldIcon = svg`<path d="M12 3 5 5.8v5.4c0 4.3 2.9 8.2 7 9.8 4.1-1.6 7-5.5 7-9.8V5.8L12 3Z"></path><path d="m9.2 12.2 2 2 3.8-4"></path>`;

export type ApprovalStatus = "pending" | "approved" | "denied";
export type ApprovalRisk = "low" | "medium" | "high";
/** A key-value row of the preview: the value is text or an element (cloned) */
export type ApprovalDetail = {
  label: string;
  value: string | Element;
  /** With `editableDetails`: false keeps this row read-only. Element values are always read-only */
  editable?: boolean;
};
export type DenyReason = "user" | "timeout";
/** What happens either way, one sentence each */
export type ApprovalConsequences = { approve?: string; deny?: string };
/** A source the request rests on, shown as a chip: a link with `href`, else a button that fires tc-evidence-select */
export type ApprovalEvidence = {
  label: string;
  /** A quiet second part, e.g. "p. 4" or "2 h ago" */
  detail?: string;
  /** Opens in a new tab */
  href?: string;
};

/** Details of the events */
export type ApprovalStatusChange = { status: ApprovalStatus };
export type ApprovalDeny = { reason: DenyReason };
export type ApprovalDetailsChange = { details: ApprovalDetail[]; index: number; label: string; value: string };
export type ApprovalEvidenceSelect = { evidence: ApprovalEvidence; index: number };

const RISK_LABEL: Record<ApprovalRisk, string> = { low: "Low", medium: "Medium", high: "High" };
/** The countdown announces itself once, this long before it runs out */
const WARN_AT = 20_000;

/** Escape belongs to the content it was pressed in (a field or menu inside the preview), not to Deny */
const ownsEscape = (el: Element | null) => !!el?.closest?.(".ui-ap__custom, .ui-ap__details, textarea, select, [contenteditable=''], [contenteditable='true'], input:not([type='checkbox'])");
const timerText = (s: number) => `Expires in ${s} seconds unless approved. The timer pauses while the card is hovered or focused.`;
/** 0:42, 2:05 */
const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
/** just now, 4 min ago, 2 h ago */
function ago(t: number, now: number) {
  const s = Math.floor((now - t) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  return `${Math.floor(s / 3600)} h ago`;
}
/** Text as it is, an element cloned */
const content = (v: string | Element | undefined) => (v === undefined ? nothing : typeof v === "string" ? v : v.cloneNode(true));
/** A boolean attribute that defaults to true: "false" turns it off */
const onByDefault = { fromAttribute: (v: string | null) => v !== "false" };

const clockIcon = (hidden: boolean) =>
  html`<svg viewBox="0 0 16 16" aria-hidden=${ifDefined(hidden ? "true" : undefined)}>${svg`<circle cx="8" cy="8" r="6"></circle><path d="M8 5v3.2l2 1.3"></path>`}</svg>`;

/* Pencil, check, x, info and file-text: Lucide (ISC, lucide.dev) */
const smallIcon = (body: ReturnType<typeof svg>) =>
  html`<svg class="ui-ap__mini" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
const pencilIcon = smallIcon(svg`<path d="M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z"></path><path d="m15 5 4 4"></path>`);
const checkIcon = smallIcon(svg`<path d="M20 6 9 17l-5-5"></path>`);
const crossIcon = smallIcon(svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`);
const infoIcon = smallIcon(svg`<circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path>`);
const fileIcon = smallIcon(svg`<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 13H8"></path><path d="M16 17H8"></path>`);

let uid = 0;

/**
 * An agent's request for approval, with Approve / Deny, an optional countdown, and a compact row once decided.
 * @tag tc-approval-card
 * @fires tc-status-change - The card was approved, denied or expired; detail `{ status }`. Cancelable: preventDefault() keeps the status (controlled use)
 * @fires tc-deny - Denied by the user or by the countdown; detail `{ reason: "user" | "timeout" }`
 * @fires tc-expire - The countdown ran out (tc-deny fires too)
 * @fires tc-edit - Edit was pressed (shown with `editable`)
 * @fires tc-details-change - An argument was edited in "Edit arguments" mode; detail `{ details, index, label, value }`. Cancelable: preventDefault() keeps the rows (controlled use)
 * @fires tc-evidence-select - An evidence chip without `href` was pressed; detail `{ evidence, index }`
 */
export class TcApprovalCard extends TcElement {
  static override ui = "ap";

  /** The action, e.g. "Send campaign email" – the group's name */
  @property() accessor heading = "";
  /** One line of context below the heading: text, or an element (cloned) */
  @property({ attribute: false }) accessor description: string | Element | undefined = undefined;
  /** Tinted badge in the header; leave out to hide it */
  @property() accessor risk: ApprovalRisk | undefined = undefined;
  /** Icon element in the header tile (cloned) – defaults to a small shield */
  @property({ attribute: false }) accessor icon: Element | undefined = undefined;
  /** Key-value rows in the preview, e.g. To, Subject, Scheduled */
  @property({ attribute: false }) accessor details: ApprovalDetail[] | undefined = undefined;
  /** Anything to show above the details, e.g. a recipient list: text, or an element (cloned) */
  @property({ attribute: false }) accessor preview: string | Element | undefined = undefined;
  /** The status */
  @property() accessor status: ApprovalStatus = "pending";
  /**
   * Called on Approve with the "Always allow" choice. Return a promise to show a spinner and lock the card until it
   * settles; a rejection keeps it pending and shows `errorLabel`, and Approve can be pressed again to retry
   */
  @property({ attribute: false }) accessor onApprove: ((decision: { always: boolean }) => void | Promise<unknown>) | undefined = undefined;
  /** Shown under the buttons when an onApprove promise rejects */
  @property({ attribute: "error-label" }) accessor errorLabel = "Couldn't approve. Try again.";
  /** Shows an "Edit" button (it fires tc-edit) */
  @property({ type: Boolean }) accessor editable = false;
  /** Seconds until the request expires and is denied with reason "timeout" */
  @property({ type: Number, attribute: "expires-in" }) accessor expiresIn: number | undefined = undefined;
  /** Show a "Stop" button next to the countdown that turns the time limit off (WCAG 2.2.1). Default true */
  @property({ attribute: "allow-stop-timer", converter: onByDefault }) accessor allowStopTimer = true;
  /** Its label – the countdown ("Expires in 42 seconds…") describes it */
  @property({ attribute: "stop-timer-label" }) accessor stopTimerLabel = "Stop";
  /** Show the "Always allow this action" checkbox. Default true */
  @property({ attribute: "allow-always", converter: onByDefault }) accessor allowAlways = true;
  /** The "Always allow" checkbox's label */
  @property({ attribute: "always-label" }) accessor alwaysLabel = "Always allow this action";
  /** The Approve button's label */
  @property({ attribute: "approve-label" }) accessor approveLabel = "Approve";
  /** The Deny button's label */
  @property({ attribute: "deny-label" }) accessor denyLabel = "Deny";
  /** The Edit button's label (shown with `editable`) */
  @property({ attribute: "edit-label" }) accessor editLabel = "Edit";
  /** Show ⌘↵ / Esc hints on the buttons (the shortcuts work either way). Default true */
  @property({ converter: onByDefault }) accessor shortcuts = true;
  /** Small label on the gray tray above the card, e.g. "Step 4 · gmail.send": text, or an element (cloned) */
  @property({ attribute: false }) accessor label: string | Element | undefined = undefined;
  /** Where the buttons sit: on the gray tray below the card or inside the white card. Default: "tray" in the Standard look, "card" in the Clean look */
  @property() accessor actions: "tray" | "card" | undefined = undefined;
  /** "Why you're seeing this": one line on what made the agent ask, e.g. the rule or threshold it met */
  @property() accessor why: string | undefined = undefined;
  /** The heading of the `why` line */
  @property({ attribute: "why-label" }) accessor whyLabel = "Why you're seeing this";
  /** What happens if the person approves, and if they deny – one sentence each */
  @property({ attribute: false }) accessor consequences: ApprovalConsequences | undefined = undefined;
  /** The heading of the approve consequence */
  @property({ attribute: "if-approve-label" }) accessor ifApproveLabel = "If you approve";
  /** The heading of the deny consequence */
  @property({ attribute: "if-deny-label" }) accessor ifDenyLabel = "If you deny";
  /** Shows "Edit arguments", which turns the text details into fields; each change fires tc-details-change */
  @property({ type: Boolean, attribute: "editable-details" }) accessor editableDetails = false;
  /** The "Edit arguments" button's label */
  @property({ attribute: "edit-details-label" }) accessor editDetailsLabel = "Edit arguments";
  /** The button's label while editing */
  @property({ attribute: "done-details-label" }) accessor doneDetailsLabel = "Done";
  /** Sources the request rests on, shown as chips */
  @property({ attribute: false }) accessor evidence: ApprovalEvidence[] | undefined = undefined;
  /** The heading of the evidence chips */
  @property({ attribute: "evidence-label" }) accessor evidenceLabel = "Evidence";

  /** @internal */ @state() accessor always = false;
  /** @internal */ @state() accessor busy = false;
  /** @internal */ @state() accessor failed = false;
  /** @internal */ @state() accessor reason: DenyReason = "user";
  /** @internal When the card was decided – read from the clock after an update, never during render */
  @state() accessor decidedAt: number | null = null;
  /** @internal */ @state() accessor now = 0;
  /** @internal */ @state() accessor announce = "";
  /** @internal */ @state() accessor hover = false;
  /** @internal */ @state() accessor focusIn = false;
  /** @internal */ @state() accessor tabHidden = false;
  /** @internal */ @state() accessor timerOff = false;
  /** @internal */ @state() accessor mod = "⌘";
  /** @internal */ @state() accessor leaving = false;
  /** @internal */ @state() accessor entering = false;
  /** @internal Milliseconds left on the countdown */
  @state() accessor left = 0;
  /** @internal The countdown's one warning */
  @state() accessor warn = "";
  /** @internal "Edit arguments" mode */
  @state() accessor editingDetails = false;
  /** @internal The detail values when editing first opened for this request – edited rows are marked against them */
  @state() accessor detailsBefore: (string | Element)[] | null = null;

  private readonly uid = `tc-ap-${++uid}`;
  private prevStatus: ApprovalStatus | undefined = undefined;
  private alive = false;
  private expired = false;
  private timer = 0;
  private running = "";
  private stampedFor = "";
  private ticker = 0;
  private rowFocused = false;
  private lastH = 0;
  private animating = false;
  private morphTimer = 0;
  private wasResolved: boolean | undefined = undefined;
  private ro?: ResizeObserver;
  private ownDescribedBy: string | null = null;

  constructor() {
    super();
    // Safety net: focus never drops to <body> when a focused control inside the card goes away
    new FocusRescueController(this, () => (this.resolved ? this.rowEl : this.approveBtn));
  }

  /** @internal */
  get resolved() {
    return this.status !== "pending";
  }
  private get total() {
    return this.expiresIn && this.expiresIn > 0 ? this.expiresIn * 1000 : 0;
  }
  private get paused() {
    return this.hover || this.focusIn || this.busy || this.tabHidden;
  }
  private get approveBtn() {
    return this.querySelector<HTMLElement>(".ui-ap__approve");
  }
  private get rowEl() {
    return this.querySelector<HTMLElement>(".ui-ap__resolved");
  }

  override connectedCallback() {
    super.connectedCallback();
    this.alive = true;
    if (!this.hasAttribute("role")) this.setAttribute("role", "group");
    if (this.ownDescribedBy === null) this.ownDescribedBy = this.getAttribute("aria-describedby") ?? "";
    // ⌘ on Apple devices, Ctrl elsewhere
    const p = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform;
    if (!/mac|iphone|ipad|ipod/i.test(p || navigator.userAgent)) this.mod = "Ctrl";
    document.addEventListener("visibilitychange", this.syncHidden);
    this.addEventListener("keydown", this.onKeyDown);
    this.addEventListener("pointerenter", this.onEnter);
    this.addEventListener("pointerleave", this.onLeave);
    this.addEventListener("focusin", this.onFocusIn);
    this.addEventListener("focusout", this.onFocusOut);
    if (typeof ResizeObserver !== "undefined") {
      // Remember the settled height, so a status change knows where to animate from
      this.ro = new ResizeObserver(() => {
        if (!this.animating) this.lastH = this.offsetHeight;
      });
      this.ro.observe(this);
    }
    this.running = "";
    this.stampedFor = "";
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    // An onApprove promise that settles after the card is gone sets nothing
    this.alive = false;
    document.removeEventListener("visibilitychange", this.syncHidden);
    this.removeEventListener("keydown", this.onKeyDown);
    this.removeEventListener("pointerenter", this.onEnter);
    this.removeEventListener("pointerleave", this.onLeave);
    this.removeEventListener("focusin", this.onFocusIn);
    this.removeEventListener("focusout", this.onFocusOut);
    this.ro?.disconnect();
    this.ro = undefined;
    clearTimeout(this.timer);
    clearInterval(this.ticker);
    clearTimeout(this.morphTimer);
    this.animating = false;
    this.style.height = "";
  }

  // A hidden tab doesn't eat the time
  private syncHidden = () => {
    this.tabHidden = document.visibilityState === "hidden";
  };
  private onEnter = () => (this.hover = true);
  private onLeave = () => (this.hover = false);
  private onFocusIn = () => (this.focusIn = true);
  private onFocusOut = (e: FocusEvent) => {
    if (!this.contains(e.relatedTarget as Node | null)) this.focusIn = false;
  };
  private onKeyDown = (e: KeyboardEvent) => {
    if (this.resolved || this.busy || e.defaultPrevented || e.isComposing) return;
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void this.approve();
    } else if (e.key === "Escape" && !ownsEscape(e.target as Element)) {
      e.preventDefault();
      this.deny("user");
    }
  };

  private setStatus(next: ApprovalStatus) {
    if (this.emit<ApprovalStatusChange>("tc-status-change", { status: next }, { cancelable: true })) this.status = next;
  }

  private async approve() {
    if (this.resolved || this.busy) return;
    this.failed = false;
    let result: void | Promise<unknown>;
    try {
      result = this.onApprove?.({ always: this.always });
    } catch {
      this.failed = true;
      return;
    }
    if (result && typeof (result as Promise<unknown>).then === "function") {
      this.busy = true;
      try {
        await result;
      } catch {
        // Stays pending and says so; Approve can be pressed again
        if (this.alive) {
          this.busy = false;
          this.failed = true;
        }
        return;
      }
      if (!this.alive) return;
      this.busy = false;
    }
    this.setStatus("approved");
  }

  private deny(why: DenyReason = "user") {
    if (this.resolved || (this.busy && why === "user")) return;
    this.reason = why;
    this.failed = false;
    if (why === "timeout") this.emit("tc-expire", null);
    this.emit<ApprovalDeny>("tc-deny", { reason: why });
    this.setStatus("denied");
  }

  /** A detail row that "Edit arguments" turns into a field */
  private canEdit(d: ApprovalDetail) {
    return typeof d.value === "string" && d.editable !== false;
  }

  private toggleDetails() {
    if (this.busy) return;
    if (!this.editingDetails && !this.detailsBefore) this.detailsBefore = (this.details ?? []).map((d) => d.value);
    this.editingDetails = !this.editingDetails;
    if (this.editingDetails) void this.updateComplete.then(() => this.querySelector<HTMLInputElement>(".ui-ap__arg")?.focus());
  }

  private editDetail(index: number, field: HTMLInputElement) {
    const rows = this.details ?? [];
    const row = rows[index];
    if (!row) return;
    const value = field.value;
    const details = rows.map((d, i) => (i === index ? { ...d, value } : d));
    if (!this.emit<ApprovalDetailsChange>("tc-details-change", { details, index, label: row.label, value }, { cancelable: true })) {
      // Controlled: the field shows the row's value until the app passes the new rows back
      field.value = typeof row.value === "string" ? row.value : "";
      return;
    }
    this.details = details;
  }

  private stopTimer() {
    // The button goes away with the countdown – focus moves on to Approve first
    rescueFocus(this.querySelector(".ui-ap__stop"), [this.approveBtn]);
    this.timerOff = true;
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const status = this.status;
    if (this.prevStatus === undefined) {
      this.left = this.total;
    } else if (this.prevStatus !== status) {
      if (status === "pending") {
        this.editingDetails = false;
        this.detailsBefore = null;
        this.leaving = false;
        this.entering = true;
        this.always = false;
        this.busy = false;
        this.failed = false;
        this.reason = "user";
        this.decidedAt = null;
        this.announce = "";
        this.timerOff = false;
      } else {
        this.leaving = this.prevStatus === "pending";
        this.entering = false;
        this.failed = false;
        this.decidedAt = null;
        this.announce = `${status === "approved" ? "Approved" : this.reason === "timeout" ? "Expired" : "Denied"}: ${this.heading}`;
      }
    }
    // A fresh request gets the full time again
    if (status === "pending" && (this.prevStatus !== status || changed.has("expiresIn"))) {
      this.left = this.total;
      this.expired = false;
      this.warn = "";
    }
    this.prevStatus = status;

    const actions = this.actions ?? (this.resolvedLook === "clean" ? "card" : "tray");
    const total = this.total;
    const describedBy = [this.ownDescribedBy, this.description ? `${this.uid}-desc` : null, this.why && !this.resolved ? `${this.uid}-why` : null, total && !this.resolved && !this.timerOff ? `${this.uid}-timer` : null].filter(Boolean).join(" ");
    this.setAttribute("aria-labelledby", this.resolved ? `${this.uid}-row` : `${this.uid}-title`);
    if (describedBy) this.setAttribute("aria-describedby", describedBy);
    else this.removeAttribute("aria-describedby");
    if (this.busy) this.setAttribute("aria-busy", "true");
    else this.removeAttribute("aria-busy");
    this.dataset.status = status;
    this.toggleAttribute("data-busy", this.busy);
    this.toggleAttribute("data-label", !!this.label);
    this.dataset.actions = actions;
  }

  /**
   * The countdown: one timeout per whole second (no animation frames), paused while hovered, focused, busy or the tab
   * is hidden, off for good with Stop. Time runs out once per request: a card whose page leaves it pending doesn't
   * expire again each time hover or focus restarts the countdown
   */
  private syncTimer() {
    const run = !!this.total && !this.resolved && !this.paused && !this.timerOff && !this.expired;
    const key = run ? `run:${this.total}` : "";
    if (key === this.running) return;
    this.running = key;
    clearTimeout(this.timer);
    if (!run) return;
    const next = () => {
      const wait = this.left % 1000 || 1000;
      this.timer = window.setTimeout(() => {
        const before = this.left;
        this.left -= wait;
        if (before > WARN_AT && this.left <= WARN_AT && this.left > 0) this.warn = `20 seconds left to decide: ${this.heading}. Stop the timer to keep it open.`;
        if (this.left <= 0) {
          this.expired = true;
          this.running = "";
          this.deny("timeout");
          return;
        }
        next();
      }, wait);
    };
    next();
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    this.syncTimer();

    // The decision time is stamped after the update; "just now" turns into "2 min ago" over time
    const stamp = this.resolved ? `${this.status}` : "";
    if (stamp !== this.stampedFor) {
      this.stampedFor = stamp;
      clearInterval(this.ticker);
      if (stamp) {
        const at = Date.now();
        this.decidedAt = at;
        this.now = at;
        this.ticker = window.setInterval(() => (this.now += 30000), 30000);
      }
    }

    // The card morphs between its pending and resolved heights; the focus stays in the card
    const resolved = this.resolved;
    if (this.wasResolved === undefined) {
      this.wasResolved = resolved;
      this.lastH = this.offsetHeight;
    } else if (this.wasResolved !== resolved) {
      this.wasResolved = resolved;
      // Keep focus in the card: on the resolved row, or back on Approve for a new request
      const active = document.activeElement;
      if (resolved && active && this.contains(active)) this.rowEl?.focus({ preventScroll: true });
      if (!resolved && this.rowFocused) this.approveBtn?.focus({ preventScroll: true });
      this.rowFocused = false;
      clearTimeout(this.morphTimer);
      const from = this.lastH;
      this.style.height = "";
      const to = this.offsetHeight;
      if (from && from !== to) {
        this.animating = true;
        this.style.height = `${from}px`;
        void this.offsetHeight;
        this.style.height = `${to}px`;
        this.morphTimer = window.setTimeout(() => {
          this.style.height = "";
          this.animating = false;
          this.lastH = this.offsetHeight;
        }, 560);
      } else this.animating = false;
    }
  }

  private renderFoot(alwaysBox: unknown) {
    const total = this.total;
    const secondsLeft = Math.max(0, Math.ceil(this.left / 1000));
    const busy = this.busy;
    const timerOff = this.timerOff;
    return html`<div class="ui-ap__foot">
      ${this.failed ? html`<p class="ui-ap__error" role="alert">${this.errorLabel}</p>` : nothing}
      ${alwaysBox}
      ${total > 0
        ? html`<span class="ui-ap__timer">
            ${timerOff
              ? html`<span class="ui-ap__expires" data-off="">${clockIcon(true)}No time limit</span>`
              : html`<span class="ui-ap__expires" data-paused=${ifDefined(this.paused ? "" : undefined)} data-low=${ifDefined(secondsLeft <= 10 ? "" : undefined)} aria-hidden="true">${clockIcon(false)}Expires in ${clock(secondsLeft)}</span>`}
            ${!timerOff && this.allowStopTimer
              ? html`<button type="button" class="ui-ap__btn ui-ap__btn--ghost ui-ap__stop" aria-describedby="${this.uid}-timer" @click=${() => this.stopTimer()}>${this.stopTimerLabel}</button>`
              : nothing}
          </span>`
        : nothing}
      <div class="ui-ap__actions">
        ${this.editable
          ? html`<button
              type="button"
              class="ui-ap__btn ui-ap__btn--ghost"
              aria-disabled=${ifDefined(busy ? "true" : undefined)}
              @click=${() => {
                if (!this.busy) this.emit("tc-edit", null);
              }}
            >${this.editLabel}</button>`
          : nothing}
        <button type="button" class="ui-ap__btn ui-ap__btn--quiet ui-ap__deny" aria-keyshortcuts="Escape" aria-disabled=${ifDefined(busy ? "true" : undefined)} @click=${() => this.deny("user")}>
          ${this.denyLabel}${this.shortcuts ? html`<kbd class="ui-ap__kbd" aria-hidden="true">Esc</kbd>` : nothing}
        </button>
        <button
          type="button"
          class="ui-ap__btn ui-ap__btn--primary ui-ap__approve"
          aria-keyshortcuts="Meta+Enter Control+Enter"
          aria-disabled=${ifDefined(busy ? "true" : undefined)}
          @click=${() => void this.approve()}
        >
          ${this.approveLabel}${busy
            ? html`<svg class="ui-ap__spinner" viewBox="0 0 16 16" aria-hidden="true">${svg`<circle cx="8" cy="8" r="6"></circle>`}</svg>`
            : this.shortcuts
              ? html`<kbd class="ui-ap__kbd" aria-hidden="true">${this.mod === "⌘" ? "⌘↵" : "Ctrl ↵"}</kbd>`
              : nothing}
        </button>
      </div>
    </div>`;
  }

  private renderPending(alwaysBox: unknown, foot: unknown, actions: "tray" | "card") {
    const leaving = this.leaving;
    const id = this.uid;
    const total = this.total;
    const details = this.details;
    const body = this.preview;
    const risk = this.risk;
    const clean = this.resolvedLook === "clean";
    const head = cardHead({
      icon: this.icon ? svg`${this.icon.cloneNode(true)}` : shieldIcon,
      title: this.heading,
      id: leaving ? undefined : `${id}-title`,
      subtitle: this.description ? html`<span id=${ifDefined(leaving ? undefined : `${id}-desc`)}>${content(this.description)}</span>` : nothing,
      aside: risk
        ? html`<span class="ui-ap__risk" data-risk=${risk}><span class="ui-ap__risk-dot" aria-hidden="true"></span>${RISK_LABEL[risk]}<span class="ui-ap__risk-word"> risk</span></span>`
        : nothing,
    });
    const why = this.why
      ? html`<div class="ui-ap__why">
          <span class="ui-ap__why-label">${infoIcon}${this.whyLabel}</span>
          <p class="ui-ap__why-text" id=${ifDefined(leaving ? undefined : `${id}-why`)}>${this.why}</p>
        </div>`
      : nothing;
    const preview =
      body || details?.length
        ? html`<div class="ui-ap__preview">
            ${body ? html`<div class="ui-ap__custom">${content(body)}</div>` : nothing}
            ${details?.length ? this.renderDetails(details, leaving) : nothing}
          </div>`
        : nothing;
    const outcomes = this.renderConsequences();
    const evidence = this.renderEvidence();
    // The white card holds the request's content; with none (no preview, no checkbox, buttons on the tray) it's left out
    const hasBody = [why, preview, outcomes, evidence, alwaysBox].some((part) => part !== nothing) || actions === "card";
    return html`<div
      class="ui-ap__pending"
      data-leaving=${ifDefined(leaving ? "" : undefined)}
      data-entering=${ifDefined(this.entering ? "" : undefined)}
      .inert=${leaving}
      aria-hidden=${ifDefined(leaving ? "true" : undefined)}
      @animationend=${(e: AnimationEvent) => {
        if (e.target !== e.currentTarget) return;
        if (this.leaving) this.leaving = false;
        if (this.entering) this.entering = false;
      }}
    >
      ${clean ? nothing : head}
      ${clean || hasBody
        ? html`<div class="ui-ap__card">
            ${clean ? head : nothing}
            ${hasBody
              ? html`<div class="ui-ap__body">
                  ${why}
                  ${preview}
                  ${outcomes}
                  ${evidence}
                  ${alwaysBox}
                  ${actions === "card" ? foot : nothing}
                </div>`
              : nothing}
          </div>`
        : nothing}

      ${actions === "tray" ? foot : nothing}

      ${total > 0 && !this.timerOff
        ? html`<span class="ui-ap__sr" id=${ifDefined(leaving ? undefined : `${id}-timer`)}>${timerText(Math.max(0, Math.ceil(this.left / 1000)))}</span>`
        : nothing}
    </div>`;
  }

  private renderDetails(details: ApprovalDetail[], leaving: boolean) {
    const editable = this.editableDetails && details.some((d) => this.canEdit(d));
    const editing = editable && this.editingDetails;
    const before = this.detailsBefore;
    const toggle = editable
      ? html`<button
          type="button"
          class="ui-ap__btn ui-ap__btn--ghost ui-ap__args-toggle"
          aria-disabled=${ifDefined(this.busy ? "true" : undefined)}
          aria-controls=${ifDefined(leaving ? undefined : `${this.uid}-args`)}
          @click=${() => this.toggleDetails()}
        >${editing ? checkIcon : pencilIcon}${editing ? this.doneDetailsLabel : this.editDetailsLabel}</button>`
      : nothing;
    return html`<dl class="ui-ap__details" id=${ifDefined(editable && !leaving ? `${this.uid}-args` : undefined)} ?data-editing=${editing}>
        ${details.map((d, i) => {
          const edited = !!before && i < before.length && before[i] !== d.value;
          return html`<div class="ui-ap__detail" ?data-edited=${edited}><dt>${d.label}</dt><dd>${editing && this.canEdit(d)
              ? html`<input
                  class="ui-ap__arg"
                  type="text"
                  spellcheck="false"
                  autocomplete="off"
                  aria-label=${d.label}
                  .value=${live(d.value as string)}
                  ?disabled=${this.busy}
                  @input=${(e: Event) => this.editDetail(i, e.target as HTMLInputElement)}
                  @keydown=${(e: KeyboardEvent) => {
                    if (e.key !== "Escape" || e.isComposing) return;
                    // Escape leaves the mode, keeping the edits – it never denies from inside a field
                    e.preventDefault();
                    this.editingDetails = false;
                    void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-ap__args-toggle")?.focus());
                  }}
                />`
              : content(d.value)}${edited ? html`<span class="ui-ap__edited">Edited</span>` : nothing}</dd></div>`;
        })}
      </dl>
      ${toggle}`;
  }

  private renderConsequences() {
    const c = this.consequences;
    if (!c?.approve && !c?.deny) return nothing;
    return html`<div class="ui-ap__outcomes">
      ${c.approve
        ? html`<div class="ui-ap__outcome" data-kind="approve"><span class="ui-ap__outcome-label">${checkIcon}${this.ifApproveLabel}</span><p class="ui-ap__outcome-text">${c.approve}</p></div>`
        : nothing}
      ${c.deny
        ? html`<div class="ui-ap__outcome" data-kind="deny"><span class="ui-ap__outcome-label">${crossIcon}${this.ifDenyLabel}</span><p class="ui-ap__outcome-text">${c.deny}</p></div>`
        : nothing}
    </div>`;
  }

  private renderEvidence() {
    const items = this.evidence;
    if (!items?.length) return nothing;
    const id = `${this.uid}-evidence`;
    return html`<div class="ui-ap__evidence">
      <span class="ui-ap__evidence-label" id=${id}>${this.evidenceLabel}</span>
      <ul class="ui-ap__chips" aria-labelledby=${id}>
        ${items.map((ev, index) => {
          const inner = html`${fileIcon}<span class="ui-ap__chip-label">${ev.label}</span>${ev.detail ? html`<span class="ui-ap__chip-detail">${ev.detail}</span>` : nothing}`;
          return html`<li>${ev.href
            ? html`<a class="ui-ap__chip" href=${ev.href} target="_blank" rel="noopener noreferrer">${inner}</a>`
            : html`<button type="button" class="ui-ap__chip" @click=${() => this.emit<ApprovalEvidenceSelect>("tc-evidence-select", { evidence: ev, index })}>${inner}</button>`}</li>`;
        })}
      </ul>
    </div>`;
  }

  private renderResolved() {
    const status = this.status;
    const resolvedLabel = status === "approved" ? "Approved" : this.reason === "timeout" ? "Expired" : "Denied";
    return html`<div
      class="ui-ap__card ui-ap__resolved"
      tabindex="-1"
      data-status=${status}
      @focus=${() => (this.rowFocused = true)}
      @blur=${(e: FocusEvent) => {
        // A blur from being removed (the card resets) keeps the flag, so focus can return to Approve
        if (e.relatedTarget || (e.currentTarget as HTMLElement).isConnected) this.rowFocused = false;
      }}
    >
      <span class="ui-ap__mark" aria-hidden="true">
        <svg viewBox="0 0 16 16">${status === "approved" ? svg`<path d="M4.2 8.4 6.9 11 11.8 5.6" pathLength="1"></path>` : svg`<path d="M5.2 5.2 10.8 10.8M10.8 5.2 5.2 10.8" pathLength="1"></path>`}</svg>
      </span>
      <span class="ui-ap__row-title" id="${this.uid}-row">${this.heading}</span>
      <span class="ui-ap__row-status">${resolvedLabel}${status === "approved" && this.always ? html`<span class="ui-ap__row-extra"> · Always</span>` : nothing}${this.decidedAt !== null
        ? html`<span class="ui-ap__row-time"> · ${ago(this.decidedAt, this.now)}</span>`
        : nothing}</span>
    </div>`;
  }

  protected override render() {
    const actions = this.actions ?? (this.resolvedLook === "clean" ? "card" : "tray");
    // Clean puts the checkbox in the bottom row with the buttons when they sit inside the card
    const alwaysInFoot = this.resolvedLook === "clean" && actions === "card";
    const alwaysBox = this.allowAlways
      ? html`<label class="ui-ap__always">
          <span class="ui-ap__box">
            <input type="checkbox" .checked=${this.always} ?disabled=${this.busy} @change=${(e: Event) => (this.always = (e.target as HTMLInputElement).checked)} />
            <svg viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M4 8.3 6.8 11 12 5.2"></path>`}</svg>
          </span>
          <span class="ui-ap__always-label">${this.alwaysLabel}</span>
        </label>`
      : nothing;
    const foot = this.renderFoot(alwaysInFoot ? alwaysBox : nothing);
    return html`
      ${this.label ? html`<div class="ui-ap__label">${content(this.label)}</div>` : nothing}
      ${!this.resolved || this.leaving ? this.renderPending(alwaysInFoot ? nothing : alwaysBox, foot, actions) : nothing}
      ${this.resolved ? this.renderResolved() : nothing}
      <span class="ui-ap__sr" role="status" aria-live="polite">${this.announce}</span>
      <span class="ui-ap__sr" role="status" aria-live="polite">${this.warn}</span>
    `;
  }

  static override css = /* css */ `
/* Colors and motion as variables – override them on [data-ui="ap"]. The card sits on the gray tray (Standard, and Clean
   with actions="tray"); Clean's default actions="card" drops the tray. */
[data-ui="ap"] {
  /* The shortcut chip's text inside the ink primary button */
  --tc-approval-card-primary-kbd-fg: light-dark(rgba(255, 255, 255, 0.72), rgba(25, 25, 27, 0.6));
  --tc-approval-card-spin: 800ms;
  position: relative;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  container-type: inline-size;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  color: var(--tc-text-muted);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-snug);
  letter-spacing: var(--tc-tracking-normal);
  text-align: left;
  -webkit-font-smoothing: antialiased;
  transition: height var(--tc-duration-slowest) var(--tc-ease-move);
}
[data-ui="ap"] *,
[data-ui="ap"] *::before,
[data-ui="ap"] *::after {
  box-sizing: border-box;
}
/* The white card – the pending request and the resolved row both live in one */
.ui-ap__card {
  position: relative;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-on-tray);
  box-shadow: var(--tc-card-shadow);
}
/* ---------- Pending ---------- */
.ui-ap__body {
  padding: var(--tc-space-4);
}
.ui-ap__body > :first-child {
  margin-top: 0;
}
/* Clean: the header is the card's first row, so the content starts right under it */
:where([data-look="clean"], [data-look="clean"] *).ui-ap__card > .ui-ap__body {
  padding-top: 0;
}
.ui-ap__pending[data-leaving] {
  position: absolute;
  top: var(--tc-tray-inset);
  left: var(--tc-tray-inset);
  right: var(--tc-tray-inset);
  pointer-events: none;
  animation: ui-ap-out var(--tc-duration-moderate) var(--tc-ease-move) both;
}
.ui-ap__pending[data-entering] {
  animation: ui-ap-in var(--tc-duration-slower) var(--tc-ease-move) var(--tc-duration-instant) both;
}
[data-ui="ap"][data-busy] .ui-ap__pending {
  pointer-events: none;
}
/* The risk badge: a status pill with its dot in both looks */
.ui-ap__risk {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  height: var(--tc-pill-h-lg);
  padding: 0 var(--tc-pill-px-lg);
  border-radius: var(--tc-pill-radius);
  background: var(--tc-fill-default);
  color: var(--tc-text-muted);
  font-size: var(--tc-pill-font-size-lg);
  font-weight: var(--tc-pill-font-weight);
  line-height: var(--tc-line-height-none);
  white-space: nowrap;
}
.ui-ap__risk-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.ui-ap__risk-word {
  white-space: pre;
}
.ui-ap__risk[data-risk="medium"] {
  background: var(--tc-status-warning-bg);
  color: var(--tc-status-warning-fg);
}
.ui-ap__risk[data-risk="high"] {
  background: var(--tc-status-danger-bg);
  color: var(--tc-status-danger-fg);
}
/* Preview: custom content and key-value rows in one soft panel */
:where([data-look="standard"], [data-look="standard"] *).ui-ap__preview {
  display: grid;
  gap: var(--tc-space-3);
  margin-top: var(--tc-space-3-5);
  padding: var(--tc-space-3);
  border-radius: var(--tc-radius-lg);
  background: var(--tc-fill-subtle);
  box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default);
}
/* Preview: custom content and key-value rows, plain on the card under one hairline – no second gray panel */
:where([data-look="clean"], [data-look="clean"] *).ui-ap__preview {
  display: grid;
  gap: var(--tc-space-3);
  margin-top: var(--tc-space-3-5);
  padding-top: var(--tc-space-3-5);
  border-top: var(--tc-hairline) solid var(--tc-divider);
}
.ui-ap__custom {
  min-width: 0;
}
:where([data-look="standard"], [data-look="standard"] *).ui-ap__custom + .ui-ap__details {
  padding-top: var(--tc-space-3);
  border-top: var(--tc-hairline) solid var(--tc-divider);
}
:where([data-look="clean"], [data-look="clean"] *).ui-ap__custom + .ui-ap__details {
  padding-top: var(--tc-space-0-5);
}
.ui-ap__details {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: var(--tc-space-1-5) var(--tc-space-4);
  margin: 0;
}
.ui-ap__detail {
  display: contents;
}
.ui-ap__detail dt {
  color: var(--tc-text-muted);
}
.ui-ap__detail dd {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: var(--tc-text-primary);
  white-space: nowrap;
  text-overflow: ellipsis;
}
/* "Always allow" closes the card */
.ui-ap__always {
  display: flex;
  width: fit-content;
  max-width: 100%;
  margin-top: var(--tc-space-3-5);
  align-items: center;
  gap: var(--tc-space-2);
  min-width: 0;
  cursor: pointer;
  user-select: none;
}
.ui-ap__always-label {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.ui-ap__box {
  position: relative;
  display: grid;
  flex: none;
  width: 16px;
  height: 16px;
}
/* The checkbox's edge is its only cue: --tc-border-control (≥ 3:1) */
.ui-ap__box input {
  appearance: none;
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  margin: 0;
  border-radius: var(--tc-radius-xs);
  background: var(--tc-surface-control);
  box-shadow: inset 0 0 0 1px var(--tc-border-control);
  cursor: pointer;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-ap__box input:hover {
  box-shadow: inset 0 0 0 1px var(--tc-border-control-hover);
}
.ui-ap__box input:checked {
  background: var(--tc-surface-inverse);
  box-shadow: inset 0 0 0 1px var(--tc-surface-inverse);
}
.ui-ap__box input:focus-visible {
  outline: var(--tc-focus-outline);
  outline-offset: var(--tc-focus-ring-offset);
}
.ui-ap__box svg {
  position: absolute;
  inset: 0;
  width: 16px;
  height: 16px;
  fill: none;
  stroke: var(--tc-text-on-inverse);
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0;
  transform: scale(0.6);
  transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-moderate) var(--tc-ease-move);
  pointer-events: none;
}
.ui-ap__box input:checked + svg {
  opacity: 1;
  transform: none;
}
/* Optional label on the gray tray above the card */
.ui-ap__label {
  overflow: hidden;
  padding: var(--tc-space-1-5) var(--tc-space-2) var(--tc-space-1);
  color: var(--tc-text-muted);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
  white-space: nowrap;
  text-overflow: ellipsis;
}
/* The leaving request is laid over the resolved row – below the label when there is one */
[data-ui="ap"][data-label] .ui-ap__pending[data-leaving] { top: 30px; }
/* actions="card": the buttons close the white card instead of sitting on the tray */
:where([data-look="standard"], [data-look="standard"] *).ui-ap__body > .ui-ap__foot { min-height: 0; margin-top: var(--tc-space-3-5); padding: 0; }
/* actions="card" (the default): one clean white card – no gray tray around it, the decision is its last row */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ap"][data-actions="card"] { padding: 0; border-radius: var(--tc-card-radius); background: transparent; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ap"][data-actions="card"] .ui-ap__card { background: var(--tc-surface-raised); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ap"][data-actions="card"] .ui-ap__pending[data-leaving] { top: 0; left: 0; right: 0; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ap"][data-actions="card"][data-label] .ui-ap__pending[data-leaving] { top: 26px; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ap"][data-actions="card"] .ui-ap__label { padding-left: var(--tc-space-0-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-ap__body > .ui-ap__foot { min-height: 0; margin-top: var(--tc-space-4); padding: var(--tc-space-3-5) 0 0; border-top: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="clean"], [data-look="clean"] *).ui-ap__body > .ui-ap__foot .ui-ap__always { margin-top: 0; }
/* The tray below the card: countdown on the left, buttons on the right */
.ui-ap__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--tc-space-1-5) var(--tc-space-3);
  min-height: 44px;
  padding: var(--tc-space-1-5) var(--tc-space-0-5) var(--tc-space-0-5) var(--tc-space-2-5);
}
.ui-ap__timer {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1);
  min-width: 0;
}
.ui-ap__expires {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  min-width: 0;
  color: var(--tc-text-muted);
  font-size: var(--tc-font-size-sm);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  transition: color var(--tc-duration-slow) var(--tc-ease-standard);
}
.ui-ap__expires svg {
  width: 14px;
  height: 14px;
  flex: none;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.ui-ap__expires[data-low] {
  color: var(--tc-status-warning-fg);
}
.ui-ap__error {
  flex: 1 1 100%;
  order: 1;
  margin: 0;
  color: var(--tc-status-danger-fg);
  font-size: var(--tc-font-size-sm);
}
.ui-ap__actions {
  display: flex;
  flex: 0 0 auto;
  gap: var(--tc-space-1);
  margin-left: auto;
}
/* Buttons: the control pattern, primary/secondary/ghost exactly like Button */
.ui-ap__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--tc-space-2);
  height: var(--tc-control-h-md);
  padding: 0 var(--tc-control-px-md);
  border: 0;
  border-radius: var(--tc-control-radius-md);
  font: inherit;
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  line-height: var(--tc-line-height-none);
  white-space: nowrap;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move), opacity var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-ap__btn:active {
  transform: scale(0.97);
}
.ui-ap__btn:focus-visible {
  outline: var(--tc-focus-outline);
  outline-offset: var(--tc-focus-ring-offset);
}
.ui-ap__btn--primary {
  padding-right: var(--tc-space-2);
  background: var(--tc-action-primary-bg);
  color: var(--tc-action-primary-fg);
  box-shadow: var(--tc-action-primary-shadow);
}
.ui-ap__btn--primary:hover {
  background: var(--tc-action-primary-bg-hover);
}
.ui-ap__btn--primary:active {
  background: var(--tc-action-primary-bg-active);
}
/* Deny – Standard: quiet on the tray, a soft fill on hover; Clean: the secondary button */
.ui-ap__btn--quiet {
  padding-right: var(--tc-space-2);
  background: transparent;
  color: var(--tc-text-primary);
}
.ui-ap__btn--quiet:hover {
  background: var(--tc-action-ghost-bg-hover);
}
:where([data-look="clean"], [data-look="clean"] *).ui-ap__btn--quiet {
  background: var(--tc-action-secondary-bg);
  color: var(--tc-action-secondary-fg);
  box-shadow: var(--tc-action-secondary-shadow);
}
:where([data-look="clean"], [data-look="clean"] *).ui-ap__btn--quiet:hover {
  background: var(--tc-action-secondary-bg);
  box-shadow: var(--tc-action-secondary-shadow-hover);
}
.ui-ap__btn--ghost {
  background: transparent;
  color: var(--tc-action-ghost-fg);
}
.ui-ap__btn--ghost:hover {
  background: var(--tc-action-ghost-bg-hover);
  color: var(--tc-text-primary);
}
/* "Stop": a small ghost button next to the countdown */
.ui-ap__stop {
  height: var(--tc-control-h-sm);
  padding: 0 var(--tc-space-1-5);
  border-radius: var(--tc-control-radius-sm);
  font-size: var(--tc-font-size-sm);
}
[data-ui="ap"][data-busy] .ui-ap__btn:not(.ui-ap__approve),
[data-ui="ap"][data-busy] .ui-ap__always {
  opacity: 0.5;
}
[data-ui="ap"][data-busy] .ui-ap__approve {
  cursor: progress;
}
.ui-ap__kbd {
  display: inline-grid;
  place-items: center;
  min-width: var(--tc-kbd-h);
  height: var(--tc-kbd-h);
  padding: 0 var(--tc-kbd-px);
  border-radius: var(--tc-kbd-radius);
  background: var(--tc-kbd-bg);
  box-shadow: var(--tc-kbd-shadow);
  color: var(--tc-kbd-fg);
  font: inherit;
  font-size: var(--tc-kbd-font-size);
  font-weight: var(--tc-kbd-font-weight);
  line-height: var(--tc-line-height-none);
}
.ui-ap__btn--primary .ui-ap__kbd {
  background: var(--tc-kbd-on-inverse-bg);
  box-shadow: none;
  color: var(--tc-approval-card-primary-kbd-fg);
}
.ui-ap__spinner {
  width: 20px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-dasharray: 26 38;
  transform-origin: 50% 50%;
  animation: ui-ap-spin var(--tc-approval-card-spin) linear infinite;
}
/* ---------- Resolved row ---------- */
.ui-ap__resolved {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2-5);
  min-height: 48px;
  padding: var(--tc-space-3) var(--tc-space-3-5);
  animation: ui-ap-in var(--tc-duration-slower) var(--tc-ease-move) var(--tc-duration-quick) both;
}
.ui-ap__resolved:focus-visible {
  outline: var(--tc-focus-outline);
  outline-offset: calc(-1 * var(--tc-focus-ring-width));
}
.ui-ap__mark {
  display: grid;
  flex: none;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--tc-status-success-bg);
  color: var(--tc-status-success-fg);
  animation: ui-ap-pop var(--tc-duration-slower) var(--tc-ease-move) var(--tc-duration-fast) both;
}
.ui-ap__resolved[data-status="denied"] .ui-ap__mark {
  background: var(--tc-fill-default);
  color: var(--tc-text-muted);
}
.ui-ap__mark svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.ui-ap__mark path {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: ui-ap-draw var(--tc-duration-slower) var(--tc-ease-move) var(--tc-duration-slow) forwards;
}
.ui-ap__row-title {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  color: var(--tc-text-primary);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-medium);
  white-space: nowrap;
  text-overflow: ellipsis;
}
.ui-ap__row-status {
  flex: none;
  color: var(--tc-text-muted);
  white-space: nowrap;
}
.ui-ap__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
/* ---------- Decision detail (optional): why, consequences, editable arguments, evidence ---------- */
.ui-ap__mini {
  width: 14px;
  height: 14px;
  flex: none;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}
:where([data-look="clean"], [data-look="clean"] *).ui-ap__mini { stroke-width: 1.5; }
.ui-ap__why,
.ui-ap__evidence {
  display: grid;
  gap: var(--tc-space-1-5);
  margin-top: var(--tc-space-3-5);
}
.ui-ap__why-label,
.ui-ap__evidence-label,
.ui-ap__outcome-label {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  color: var(--tc-text-muted);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
}
:where([data-look="standard"], [data-look="standard"] *):is(.ui-ap__why-label, .ui-ap__evidence-label, .ui-ap__outcome-label) { font-weight: var(--tc-font-weight-medium); }
.ui-ap__why-label > svg { color: var(--tc-icon-muted); }
.ui-ap__why-text {
  margin: 0;
  color: var(--tc-text-primary);
  line-height: var(--tc-line-height-snug);
}
/* If you approve / If you deny: two quiet panels side by side */
.ui-ap__outcomes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
  gap: var(--tc-space-2);
  margin-top: var(--tc-space-3-5);
}
.ui-ap__outcome {
  display: grid;
  align-content: start;
  gap: var(--tc-space-1);
  min-width: 0;
  padding: var(--tc-space-2-5) var(--tc-space-3);
  border-radius: var(--tc-radius-lg);
  box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default);
}
:where([data-look="standard"], [data-look="standard"] *).ui-ap__outcome { background: var(--tc-fill-subtle); }
.ui-ap__outcome[data-kind="approve"] .ui-ap__outcome-label > svg { color: var(--tc-status-success-fg); }
.ui-ap__outcome[data-kind="deny"] .ui-ap__outcome-label > svg { color: var(--tc-status-danger-fg); }
.ui-ap__outcome-text {
  margin: 0;
  color: var(--tc-text-primary);
  line-height: var(--tc-line-height-snug);
}
/* Edit arguments: the text details become fields */
.ui-ap__args-toggle {
  justify-self: start;
  height: var(--tc-control-h-sm);
  margin-left: calc(-1 * var(--tc-space-2));
  padding: 0 var(--tc-space-2);
  border-radius: var(--tc-control-radius-sm);
  font-size: var(--tc-font-size-sm);
  gap: var(--tc-space-1-5);
}
.ui-ap__details[data-editing] { align-items: center; }
.ui-ap__details[data-editing] dd { overflow: visible; }
.ui-ap__arg {
  width: 100%;
  min-width: 0;
  height: var(--tc-control-h-sm);
  margin: 0;
  padding: 0 var(--tc-space-2);
  border: 0;
  border-radius: var(--tc-control-radius-sm);
  outline: 0;
  background: var(--tc-field-bg);
  box-shadow: var(--tc-field-shadow);
  color: var(--tc-text-primary);
  font: inherit;
  transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-ap__arg:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-ap__arg:focus { box-shadow: var(--tc-field-shadow-focus); }
.ui-ap__detail[data-edited] dd {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2);
}
.ui-ap__edited {
  display: inline-flex;
  flex: none;
  align-items: center;
  height: var(--tc-pill-h);
  padding: 0 var(--tc-pill-px);
  border-radius: var(--tc-pill-radius);
  background: var(--tc-accent-subtle);
  color: var(--tc-accent-text);
  font-size: var(--tc-pill-font-size);
  font-weight: var(--tc-pill-font-weight);
  line-height: var(--tc-line-height-tight);
}
/* Evidence: chips that open the sources */
.ui-ap__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--tc-space-1-5);
  margin: 0;
  padding: 0;
  list-style: none;
}
.ui-ap__chips > li { display: flex; min-width: 0; max-width: 100%; }
.ui-ap__chip {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  min-width: 0;
  max-width: 100%;
  height: var(--tc-control-h-sm);
  padding: 0 var(--tc-space-2-5) 0 var(--tc-space-2);
  border: 0;
  border-radius: var(--tc-control-radius-sm);
  background: var(--tc-fill-default);
  color: var(--tc-text-secondary);
  font: inherit;
  font-size: var(--tc-font-size-sm);
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-ap__chip:hover { background: var(--tc-fill-strong); color: var(--tc-text-primary); }
.ui-ap__chip:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-ap__chip > svg { color: var(--tc-icon-muted); }
.ui-ap__chip-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.ui-ap__chip-detail { flex: none; color: var(--tc-text-muted); }
/* Narrow: an edited row is marked with a dot, so its field keeps the width (the word stays for screen readers) */
@container (max-width: 400px) {
  .ui-ap__edited { width: 6px; height: 6px; padding: 0; overflow: hidden; border-radius: 50%; background: var(--tc-accent); color: transparent; font-size: 0; }
}
/* Narrow cards: buttons share the full width, the hints go */
@container (max-width: 400px) {
  .ui-ap__actions {
    flex: 1 1 100%;
    margin-left: 0;
  }
  .ui-ap__foot {
    padding-left: var(--tc-space-0-5);
  }
  .ui-ap__timer {
    padding-left: var(--tc-space-2);
  }
  .ui-ap__actions .ui-ap__btn {
    flex: 1 1 0;
    min-width: 0;
    padding: 0 var(--tc-space-2-5);
  }
  .ui-ap__kbd {
    display: none;
  }
}
@container (max-width: 340px) {
  .ui-ap__body { padding: var(--tc-space-3-5); }
  .ui-ap__risk-word { display: none; }
  .ui-ap__row-time { display: none; }
  .ui-ap__details { column-gap: var(--tc-space-3); }
}
/* Touch screens have no shortcuts */
@media (hover: none) {
  .ui-ap__kbd { display: none; }
}
@keyframes ui-ap-out {
  to { opacity: 0; transform: translateY(-6px) scale(0.985); filter: blur(2px); }
}
@keyframes ui-ap-in {
  from { opacity: 0; transform: translateY(4px); filter: blur(2px); }
  to { opacity: 1; transform: none; filter: none; }
}
@keyframes ui-ap-pop {
  from { opacity: 0; transform: scale(0.5); }
  to { opacity: 1; transform: none; }
}
@keyframes ui-ap-draw {
  to { stroke-dashoffset: 0; }
}
@keyframes ui-ap-spin {
  to { transform: rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="ap"],
  [data-ui="ap"] *,
  [data-ui="ap"] *::before,
  [data-ui="ap"] *::after {
    animation-duration: 1ms !important;
    animation-delay: 0ms !important;
    transition-duration: 1ms !important;
  }
  .ui-ap__spinner { animation: ui-ap-spin var(--tc-duration-shimmer) linear infinite !important; }
  .ui-ap__mark path { stroke-dashoffset: 0; }
}
`;
}

if (!customElements.get("tc-approval-card")) customElements.define("tc-approval-card", TcApprovalCard);

declare global {
  interface HTMLElementTagNameMap {
    "tc-approval-card": TcApprovalCard;
  }
}
