import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController, RequestController } from "./internal/controllers";

/*
 * <tc-handoff-brief> – work passing from one person to another. The receiver reads three sections – a summary, the
 * unresolved items and the commitments already made – and acknowledges each one separately, so nothing is dismissed in
 * one click. A progress line leads the card ("Acknowledge each section · 1 of 3"). Accept handoff is enabled only when
 * every section is acknowledged and the receiver can open everything the work refers to.
 * When they can't (`missing` is not empty), the handoff is blocked: the card leads with what's missing and "Request
 * access" – a cancelable tc-access-request. Not prevented, it shows "Access requested"; with a `requestAccess`
 * resolver it shows "Requesting…", then "Access requested", or "Couldn't request" with Retry. The app clears `missing`
 * once access is granted.
 *
 *   <tc-handoff-brief .from=${{ name: "Ana" }} .to=${{ name: "Sam" }} summary="…" .unresolved=${[…]} .commitments=${[…]}>
 *   </tc-handoff-brief>
 *
 * Unlike tc-handoff (an agent hands a running task to a person and takes it back), this is a person handing their work
 * on for good.
 *
 * In-flight runs. Given a `run` – an agent run that's still going – the card is the sender's: it leads with the run's
 * status and current step, what the receiver takes over (pending approvals, notifications, stopping it), whether the
 * run pauses until they accept, who receives it (from `people`) and a note. The sections show what they'll read, without
 * Acknowledge. Hand off is a cancelable tc-handoff; not prevented, the card waits – "Waiting for Priya to accept" – with
 * Cancel handoff (tc-handoff-cancel). Without `run`, nothing changes.
 *
 *   <tc-handoff-brief .run=${{ id: "r1", title: "Reconcile Q3 ledger", status: "running", step: "Matching invoices" }}
 *     .people=${[{ id: "priya", name: "Priya Shah" }]} summary="…"></tc-handoff-brief>
 * Standard: the header on the gray tray, the white card, the Accept row on the tray. Clean: one white card – the header
 * its first row, the Accept row its last under a hairline.
 * Keyboard: Tab reaches each section's Acknowledge toggle (Enter or Space), Request access, and Accept.
 */

export type HandoffBriefSection = "summary" | "unresolved" | "commitments";
export type HandoffBriefPerson = {
  name: string;
  role?: string;
  /** Tells people apart in `people` and `handoffTo`; the name when left out */
  id?: string;
};
/** Where an in-flight run stands */
export type HandoffBriefRunStatus = "running" | "paused" | "waiting";
/** An agent run that's still going, handed on with the work */
export type HandoffBriefRun = {
  id: string;
  /** What the run is doing – "Reconcile Q3 ledger" */
  title: string;
  status: HandoffBriefRunStatus;
  /** The step it's on – "Matching invoices to payments" */
  step?: string;
  /** When it started, epoch ms */
  startedAt?: number;
  /** Who started it */
  owner?: string;
};
/** Where a handoff of a run stands: not sent yet, or sent and waiting for the receiver */
export type HandoffBriefHandoffState = "" | "sent";
export type HandoffBriefItem = {
  id: string;
  /** The item in a sentence */
  text: string;
  /** A quiet line under it – where it stands, who's waiting */
  detail?: string;
  /** Right-aligned and quiet: a due date, an owner – "Due Fri", "to Finance" */
  meta?: string;
};
/** Material the work refers to that the receiver can't open */
export type HandoffBriefAccess = {
  id: string;
  /** What it is – "Supplier contract (v3)" */
  label: string;
  /** Where the brief refers to it – "Open item 2" */
  where?: string;
};
/** Where an access request stands */
export type HandoffBriefRequest = "pending" | "requested" | "failed";

/** Details of the events */
export type HandoffBriefAcknowledgedChange = { acknowledged: HandoffBriefSection[]; section: HandoffBriefSection; on: boolean };
export type HandoffBriefAccessRequest = { items: HandoffBriefAccess[] };
export type HandoffBriefAccept = { acknowledged: HandoffBriefSection[] };
export type HandoffBriefHandoff = { to: HandoffBriefPerson; run: HandoffBriefRun; pauseUntilAccepted: boolean; note: string };
export type HandoffBriefHandoffCancel = { to: HandoffBriefPerson | undefined; run: HandoffBriefRun };
export type HandoffBriefHandoffToChange = { handoffTo: string; person: HandoffBriefPerson | undefined };
export type HandoffBriefPauseChange = { pauseUntilAccepted: boolean };
/** Sends an access request; resolve when sent, reject if it couldn't be. The signal aborts when the element leaves the page */
export type HandoffBriefAccessResolver = (items: HandoffBriefAccess[], signal: AbortSignal) => Promise<unknown>;

const SECTIONS: HandoffBriefSection[] = ["summary", "unresolved", "commitments"];
const DEFAULT_TITLES: Record<HandoffBriefSection, string> = { summary: "Summary", unresolved: "Unresolved items", commitments: "Commitments made" };
const RUN_STATUS: Record<HandoffBriefRunStatus, string> = { running: "Running", paused: "Paused", waiting: "Waiting for input" };
/** What the receiver of a run takes over, unless the page says otherwise */
export const defaultHandoffTakesOver = ["Its pending approvals", "Its notifications", "Stopping or pausing it"];
const personId = (p: HandoffBriefPerson) => p.id ?? p.name;

/* After Lucide (ISC, lucide.dev): clipboard-list (the header), lock, check, circle-check, loader */
const headIcon = svg`<rect width="8" height="4" x="8" y="2" rx="1" ry="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><path d="M12 11h4"></path><path d="M12 16h4"></path><path d="M8 11h.01"></path><path d="M8 16h.01"></path>`;
const icon = (body: TemplateResult) =>
  html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const lockIcon = () => icon(svg`<rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>`);
const checkIcon = () => icon(svg`<path d="M20 6 9 17l-5-5"></path>`);
const doneIcon = () => icon(svg`<circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path>`);
const spinIcon = () => icon(svg`<path class="ui-hob__spin" d="M21 12a9 9 0 1 1-6.219-8.56"></path>`);

let instances = 0;

/**
 * Work passing from one person to another: summary, open items and commitments, each acknowledged by the receiver,
 * blocked when they lack access.
 * @tag tc-handoff-brief
 * @fires tc-acknowledged-change - A section was acknowledged or un-acknowledged ({ acknowledged, section, on }: HandoffBriefAcknowledgedChange); cancelable
 * @fires tc-access-request - Request access (or Retry) was pressed ({ items }: HandoffBriefAccessRequest); cancelable – prevented, the app sets `accessRequest` itself
 * @fires tc-accept - Accept handoff was pressed ({ acknowledged }: HandoffBriefAccept); cancelable – not prevented, `accepted` becomes true
 * @fires tc-handoff-to-change - A receiver was chosen for the run ({ handoffTo, person }: HandoffBriefHandoffToChange); cancelable – prevented, the choice stays as it was
 * @fires tc-pause-until-accepted-change - Pause until accepted was switched ({ pauseUntilAccepted }: HandoffBriefPauseChange); cancelable
 * @fires tc-handoff - Hand off was pressed ({ to, run, pauseUntilAccepted, note }: HandoffBriefHandoff); cancelable – not prevented, `handoffState` becomes "sent"
 * @fires tc-handoff-cancel - Cancel handoff was pressed while waiting ({ to, run }: HandoffBriefHandoffCancel); cancelable – not prevented, `handoffState` goes back to ""
 */
export class TcHandoffBrief extends TcElement {
  static override ui = "hob";

  /** The heading, and the group's name */
  @property() accessor heading = "Handoff";
  /** Who hands the work over */
  @property({ attribute: false }) accessor from: HandoffBriefPerson = { name: "" };
  /** Who receives it – the person looking */
  @property({ attribute: false }) accessor to: HandoffBriefPerson = { name: "" };
  /** When, as the app words it – "Today 16:40" */
  @property() accessor at = "";
  /** What the work is and where it stands, in a short paragraph */
  @property() accessor summary = "";
  /** What's still open */
  @property({ attribute: false }) accessor unresolved: HandoffBriefItem[] = [];
  /** What the previous owner promised, to whom and by when */
  @property({ attribute: false }) accessor commitments: HandoffBriefItem[] = [];
  /** The sections acknowledged so far */
  @property({ attribute: false }) accessor acknowledged: HandoffBriefSection[] = [];
  /** Material the work refers to that the receiver can't open – any blocks the handoff */
  @property({ attribute: false }) accessor missing: HandoffBriefAccess[] = [];
  /** Where the access request stands, when the app owns it; the element sets it when not prevented */
  @property({ attribute: "access-request" }) accessor accessRequest: HandoffBriefRequest | "" = "";
  /** Sends the access request and settles when it's sent. Unset, a request counts as sent */
  @property({ attribute: false }) accessor requestAccess: HandoffBriefAccessResolver | undefined = undefined;
  /** The receiver accepted the work */
  @property({ type: Boolean, reflect: true }) accessor accepted = false;
  /** Names of the three sections */
  @property({ attribute: false }) accessor sectionTitles: Partial<Record<HandoffBriefSection, string>> = {};
  /** The accept button's text */
  @property({ attribute: "accept-label" }) accessor acceptLabel = "Accept handoff";
  /** An agent run that's still going, to hand on with the work – set, the card is the sender's */
  @property({ attribute: false }) accessor run: HandoffBriefRun | undefined = undefined;
  /** Who the run can be handed to */
  @property({ attribute: false }) accessor people: HandoffBriefPerson[] = [];
  /** The chosen receiver: a person's id (or name) from `people` */
  @property({ attribute: "handoff-to" }) accessor handoffTo = "";
  /** Whether the run pauses until the receiver accepts */
  @property({ type: Boolean, attribute: "pause-until-accepted" }) accessor pauseUntilAccepted = true;
  /** The note for the receiver */
  @property({ attribute: "handoff-note" }) accessor handoffNote = "";
  /** "sent" once the run is handed off and waiting for the receiver; the element sets it when tc-handoff isn't prevented */
  @property({ attribute: "handoff-state", reflect: true }) accessor handoffState: HandoffBriefHandoffState = "";
  /** What the receiver takes over with the run, one line each */
  @property({ attribute: false }) accessor takesOver: string[] = defaultHandoffTakesOver;
  /** Locale for the run's start time */
  @property() accessor locale: string | undefined = undefined;

  /** @internal The polite announcement */
  @state() private accessor announce = "";

  private readonly uid = `tc-hob${++instances}`;
  private readonly sender = new RequestController(this);

  constructor() {
    super();
    // Accept and Request access go away under the focus: it lands on the line that replaced them
    new FocusRescueController(this, () => this.querySelector(".ui-hob__state"));
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "group");
  }

  /* ---------- Data ---------- */

  /** @internal The sections that have something in them, in order */
  private get present(): HandoffBriefSection[] {
    return SECTIONS.filter((s) => (s === "summary" ? !!this.summary : s === "unresolved" ? this.unresolved.length > 0 : this.commitments.length > 0));
  }
  /** @internal */
  private get done() {
    return this.present.filter((s) => this.acknowledged.includes(s));
  }
  /** @internal */
  private get blocked() {
    return this.missing.length > 0;
  }
  /** @internal */
  private get ready() {
    return !this.blocked && this.done.length === this.present.length && this.present.length > 0;
  }
  /** @internal The card hands a run on: the sender's view */
  private get sending() {
    return !!this.run;
  }
  /** @internal The chosen receiver */
  private get receiver() {
    return this.handoffTo ? this.people.find((p) => personId(p) === this.handoffTo) : undefined;
  }
  /** @internal */
  private titleOf(s: HandoffBriefSection) {
    return this.sectionTitles[s] ?? DEFAULT_TITLES[s];
  }

  /* ---------- Changes ---------- */

  private toggle(section: HandoffBriefSection) {
    if (this.accepted) return;
    const on = !this.acknowledged.includes(section);
    const next = SECTIONS.filter((s) => (s === section ? on : this.acknowledged.includes(s)));
    if (!this.emit<HandoffBriefAcknowledgedChange>("tc-acknowledged-change", { acknowledged: next, section, on }, { cancelable: true })) {
      this.requestUpdate();
      return;
    }
    this.acknowledged = next;
    const count = this.present.filter((s) => next.includes(s)).length;
    this.announce = `${this.titleOf(section)} ${on ? "acknowledged" : "no longer acknowledged"}. ${count} of ${this.present.length}.`;
  }

  private request = async () => {
    const items = this.missing;
    if (!items.length) return;
    if (!this.emit<HandoffBriefAccessRequest>("tc-access-request", { items }, { cancelable: true })) return;
    const resolver = this.requestAccess;
    const said: Record<HandoffBriefRequest, string> = { pending: "Requesting access…", requested: "Access requested.", failed: "Couldn't request access." };
    await this.sender.run(
      resolver && ((signal) => resolver(items, signal)),
      (r) => {
        this.accessRequest = r;
        this.announce = said[r];
      },
      "access",
    );
  };

  private accept = () => {
    if (!this.ready || this.accepted) return;
    if (!this.emit<HandoffBriefAccept>("tc-accept", { acknowledged: this.done }, { cancelable: true })) return;
    this.accepted = true;
  };

  private chooseReceiver = (e: Event) => {
    const handoffTo = (e.target as HTMLSelectElement).value;
    const person = this.people.find((p) => personId(p) === handoffTo);
    if (!this.emit<HandoffBriefHandoffToChange>("tc-handoff-to-change", { handoffTo, person }, { cancelable: true })) {
      // live() puts the select back on the next render
      this.requestUpdate();
      return;
    }
    this.handoffTo = handoffTo;
  };

  private choosePause(pauseUntilAccepted: boolean) {
    if (pauseUntilAccepted === this.pauseUntilAccepted) return;
    if (!this.emit<HandoffBriefPauseChange>("tc-pause-until-accepted-change", { pauseUntilAccepted }, { cancelable: true })) {
      // Lit's live() puts the checked radio back on the next render
      this.requestUpdate();
      return;
    }
    this.pauseUntilAccepted = pauseUntilAccepted;
  }

  private handOff = () => {
    const run = this.run;
    const to = this.receiver;
    if (!run || !to || this.handoffState === "sent") return;
    if (!this.emit<HandoffBriefHandoff>("tc-handoff", { to, run, pauseUntilAccepted: this.pauseUntilAccepted, note: this.handoffNote.trim() }, { cancelable: true })) return;
    this.handoffState = "sent";
  };

  private cancelHandoff = () => {
    const run = this.run;
    if (!run || this.handoffState !== "sent") return;
    if (!this.emit<HandoffBriefHandoffCancel>("tc-handoff-cancel", { to: this.receiver, run }, { cancelable: true })) return;
    this.handoffState = "";
  };

  /* ---------- Update ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    this.dataset.state = this.sending ? (this.handoffState === "sent" ? "sent" : "sending") : this.accepted ? "accepted" : this.blocked ? "blocked" : this.ready ? "ready" : "open";
    if (this.sending && changed.has("handoffState") && changed.get("handoffState") !== undefined) {
      const name = this.receiver?.name ?? "them";
      this.announce = this.handoffState === "sent" ? `Handed off to ${name}. Waiting for ${name} to accept.` : "Handoff cancelled. The run is still yours.";
    }
    if (changed.has("accepted") && changed.get("accepted") !== undefined && this.accepted) this.announce = `Handoff accepted. The work is yours now.`;
    if (changed.has("missing") && changed.get("missing") !== undefined && (changed.get("missing") as HandoffBriefAccess[]).length && !this.missing.length) {
      this.announce = "Access granted. Nothing blocks the handoff.";
    }
  }

  protected override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (!this.hasAttribute("aria-label") && !this.hasAttribute("aria-labelledby")) this.setAttribute("aria-labelledby", `${this.uid}-title`);
  }

  /* ---------- Render ---------- */

  /** The state line the card leads with */
  private renderState() {
    const present = this.present;
    const done = this.done.length;
    if (this.accepted) {
      return html`<div class="ui-hob__state" data-state="accepted" tabindex="-1">
        <span class="ui-hob__state-icon" aria-hidden="true">${doneIcon()}</span>
        <p class="ui-hob__state-text"><b>Accepted.</b> The work is yours now.</p>
      </div>`;
    }
    if (this.blocked) {
      const r = this.accessRequest;
      return html`<div class="ui-hob__state" data-state="blocked" tabindex="-1">
        <span class="ui-hob__state-icon" aria-hidden="true">${lockIcon()}</span>
        <div class="ui-hob__state-body">
          <p class="ui-hob__state-text">
            <b>Blocked.</b> You can't open ${this.missing.length === 1 ? "1 item" : `${this.missing.length} items`} this work refers to. The handoff can't be accepted until you can.
          </p>
          <ul class="ui-hob__missing" aria-label="What you can't open">
            ${repeat(
              this.missing,
              (m) => m.id,
              (m) => html`<li class="ui-hob__miss"><span class="ui-hob__miss-label">${m.label}</span>${m.where ? html`<span class="ui-hob__miss-where">${m.where}</span>` : nothing}</li>`,
            )}
          </ul>
          <div class="ui-hob__access">
            ${r === "pending"
              ? html`<span class="ui-hob__note" data-request="pending">${spinIcon()}Requesting access…</span>`
              : r === "requested"
                ? html`<span class="ui-hob__note" data-request="requested">${checkIcon()}Access requested – the handoff unblocks when it's granted</span>`
                : r === "failed"
                  ? html`<span class="ui-hob__note" data-request="failed">Couldn't request access.</span
                      ><button type="button" class="tc-btn-sm" @click=${this.request}>Retry</button>`
                  : html`<button type="button" class="tc-btn-sm" @click=${this.request}>Request access</button>`}
          </div>
        </div>
      </div>`;
    }
    return html`<div class="ui-hob__state" data-state=${this.ready ? "ready" : "open"} tabindex="-1">
      <div class="ui-hob__progress-text">
        <p class="ui-hob__state-text">${this.ready ? html`<b>Ready to accept.</b> Every section is acknowledged.` : html`<b>Acknowledge each section</b> to take the work on.`}</p>
        <span class="ui-hob__fraction">${done} of ${present.length}</span>
      </div>
      <div class="ui-hob__steps" role="progressbar" aria-label="Sections acknowledged" aria-valuemin="0" aria-valuemax=${present.length} aria-valuenow=${done} aria-valuetext=${`${done} of ${present.length}`}>
        ${present.map((s) => html`<span class="ui-hob__step" ?data-done=${this.acknowledged.includes(s)}></span>`)}
      </div>
    </div>`;
  }

  /** The in-flight run, what goes with it, and – until it's sent – the receiver, the pause choice and a note */
  private renderRun(run: HandoffBriefRun) {
    const sent = this.handoffState === "sent";
    const started =
      run.startedAt != null ? new Intl.DateTimeFormat(this.locale, { hour: "numeric", minute: "2-digit" }).format(new Date(run.startedAt)) : "";
    const meta = [run.owner ? `Started by ${run.owner}` : "", started ? `${run.owner ? "at" : "Started"} ${started}` : ""].filter(Boolean).join(" ");
    const to = this.receiver;
    const runId = `${this.uid}-run`;
    return html`<section class="ui-hob__run" aria-labelledby=${runId}>
      <h4 class="ui-hob__run-label" id=${runId}>In-flight run</h4>
      <div class="ui-hob__run-card">
        <p class="ui-hob__run-title">
          <span class="ui-hob__run-status" data-status=${run.status}><span class="ui-hob__run-dot" aria-hidden="true"></span>${RUN_STATUS[run.status]}</span>
          <span class="ui-hob__run-name">${run.title}</span>
        </p>
        ${run.step ? html`<p class="ui-hob__run-step"><span class="ui-hob__run-key">Now:</span> ${run.step}</p>` : nothing}
        ${meta ? html`<p class="ui-hob__run-meta">${meta}</p>` : nothing}
      </div>
      ${this.takesOver.length
        ? html`<div class="ui-hob__takes">
            <p class="ui-hob__takes-label" id=${`${this.uid}-takes`}>${to ? `${to.name} takes over` : "They take over"}</p>
            <ul class="ui-hob__items" aria-labelledby=${`${this.uid}-takes`}>
              ${this.takesOver.map((t) => html`<li class="ui-hob__item"><span class="ui-hob__bullet" aria-hidden="true"></span><span class="ui-hob__item-text">${t}</span></li>`)}
            </ul>
          </div>`
        : nothing}
      ${sent
        ? html`<div class="ui-hob__state" data-state="waiting" tabindex="-1">
            <span class="ui-hob__state-icon" aria-hidden="true">${spinIcon()}</span>
            <div class="ui-hob__state-body">
              <p class="ui-hob__state-text">
                <b>Waiting for ${to?.name ?? "them"} to accept.</b>
                ${this.pauseUntilAccepted ? "The run is paused until they do." : "The run keeps going meanwhile."}
              </p>
              <div class="ui-hob__access"><button type="button" class="tc-btn-sm ui-hob__cancel" @click=${this.cancelHandoff}>Cancel handoff</button></div>
            </div>
          </div>`
        : html`<div class="ui-hob__form">
            <div class="ui-hob__field">
              <label class="ui-hob__field-label" for=${`${this.uid}-to`}>Hand to</label>
              <select id=${`${this.uid}-to`} class="ui-hob__select" .value=${live(to ? personId(to) : "")} @change=${this.chooseReceiver}>
                <option value="" ?selected=${!to}>Choose a person</option>
                ${this.people.map(
                  // ?selected picks the option in a select that's just been drawn; live() keeps it right after that
                  (p) => html`<option value=${personId(p)} ?selected=${!!to && personId(p) === personId(to)}>${p.role ? `${p.name} – ${p.role}` : p.name}</option>`,
                )}
              </select>
            </div>
            <fieldset class="ui-hob__choice">
              <legend class="ui-hob__field-label">Until they accept</legend>
              <label class="ui-hob__radio"
                ><input type="radio" name=${`${this.uid}-pause`} .checked=${live(this.pauseUntilAccepted)} @change=${() => this.choosePause(true)} />
                Pause the run</label
              >
              <label class="ui-hob__radio"
                ><input type="radio" name=${`${this.uid}-pause`} .checked=${live(!this.pauseUntilAccepted)} @change=${() => this.choosePause(false)} />
                Keep it running</label
              >
            </fieldset>
            <div class="ui-hob__field">
              <label class="ui-hob__field-label" for=${`${this.uid}-note`}>Note <span class="ui-hob__optional">(optional)</span></label>
              <textarea
                id=${`${this.uid}-note`}
                class="ui-hob__textarea"
                rows="2"
                .value=${this.handoffNote}
                @input=${(e: Event) => (this.handoffNote = (e.target as HTMLTextAreaElement).value)}
              ></textarea>
            </div>
          </div>`}
    </section>`;
  }

  private renderSection(s: HandoffBriefSection, n: number) {
    const on = this.acknowledged.includes(s);
    const titleId = `${this.uid}-${s}`;
    const count = s === "unresolved" ? this.unresolved.length : s === "commitments" ? this.commitments.length : 0;
    const items = s === "unresolved" ? this.unresolved : this.commitments;
    return html`<div class="ui-hob__section" role="group" data-section=${s} ?data-acknowledged=${on} aria-labelledby=${titleId}>
      <div class="ui-hob__section-head">
        <h4 class="ui-hob__section-title" id=${titleId}>
          <span class="ui-hob__num" aria-hidden="true">${on ? checkIcon() : n}</span>${this.titleOf(s)}${count ? html`<span class="ui-hob__count">${count}</span>` : nothing}
        </h4>
        ${this.accepted || this.sending
          ? nothing
          : html`<button
              type="button"
              class="tc-btn-sm ui-hob__ack"
              aria-pressed=${on ? "true" : "false"}
              data-focus-key=${`ack-${s}`}
              @click=${() => this.toggle(s)}
            >
              ${on ? checkIcon() : nothing}${on ? "Acknowledged" : "Acknowledge"}<span class="tc-sr-only"> ${this.titleOf(s)}</span>
            </button>`}
      </div>
      ${s === "summary"
        ? html`<p class="ui-hob__summary">${this.summary}</p>`
        : html`<ul class="ui-hob__items">
            ${repeat(
              items,
              (it) => it.id,
              (it) => html`<li class="ui-hob__item">
                <span class="ui-hob__bullet" aria-hidden="true"></span>
                <span class="ui-hob__item-text">${it.text}${it.detail ? html`<span class="ui-hob__item-detail">${it.detail}</span>` : nothing}</span>
                ${it.meta ? html`<span class="ui-hob__item-meta">${it.meta}</span>` : nothing}
              </li>`,
            )}
          </ul>`}
    </div>`;
  }

  protected override render() {
    const present = this.present;
    const blocked = this.blocked;
    const run = this.run;
    const sent = this.handoffState === "sent";
    const aside = run
      ? html`<span class="ui-hob__pill" data-tone="neutral">${sent ? "Handoff sent" : RUN_STATUS[run.status]}</span>`
      : this.accepted
      ? html`<span class="ui-hob__pill" data-tone="success">Accepted</span>`
      : blocked
        ? html`<span class="ui-hob__pill" data-tone="danger">Blocked</span>`
        : html`<span class="ui-hob__pill" data-tone=${this.ready ? "success" : "neutral"}>${this.done.length}/${present.length} acknowledged</span>`;
    const toName = run ? this.receiver?.name : this.to.name;
    const who = [this.from.name && toName ? `From ${this.from.name} to ${toName}` : this.from.name ? `From ${this.from.name}` : "", this.at]
      .filter(Boolean)
      .join(" · ");
    const head = cardHead({ icon: headIcon, title: this.heading, subtitle: who || undefined, id: `${this.uid}-title`, aside });
    const clean = this.resolvedLook === "clean";
    const remaining = present.length - this.done.length;
    const hint = blocked
      ? "Blocked until you can open everything it refers to."
      : remaining > 0
        ? `Acknowledge ${remaining === 1 ? "1 more section" : `${remaining} more sections`} to accept.`
        : "You'll own the open items and the commitments.";
    const runHint = this.receiver
      ? `${this.receiver.name} will be asked to accept.${this.pauseUntilAccepted ? " The run pauses until then." : ""}`
      : "Choose who takes the run over.";
    const foot = run
      ? sent
        ? nothing
        : html`<div class="ui-hob__foot">
            <p class="ui-hob__hint" id=${`${this.uid}-hint`}>${runHint}</p>
            <button type="button" class="ui-hob__btn ui-hob__btn--primary ui-hob__handoff" ?disabled=${!this.receiver} aria-describedby=${`${this.uid}-hint`} @click=${this.handOff}>
              Hand off
            </button>
          </div>`
      : this.accepted
      ? nothing
      : html`<div class="ui-hob__foot">
          <p class="ui-hob__hint" id=${`${this.uid}-hint`}>${hint}</p>
          <button type="button" class="ui-hob__btn ui-hob__btn--primary" ?disabled=${!this.ready} aria-describedby=${`${this.uid}-hint`} @click=${this.accept}>
            ${this.acceptLabel}
          </button>
        </div>`;
    return html`${clean ? nothing : head}
      <div class="ui-hob__card">
        ${clean ? head : nothing}
        <div class="ui-hob__body">
          ${run ? this.renderRun(run) : this.renderState()}
          ${present.length
            ? html`${run ? html`<p class="ui-hob__run-label">What they'll read</p>` : nothing}
                <div class="ui-hob__sections">${present.map((s, i) => this.renderSection(s, i + 1))}</div>`
            : run
              ? nothing
              : html`<p class="ui-hob__empty">Nothing in this handoff yet.</p>`}
        </div>
        ${clean ? foot : nothing}
      </div>
      ${clean ? nothing : foot}
      <span class="tc-sr-only" role="status">${this.announce}</span>`;
  }

  static override css = /* css */ `
[data-ui="hob"] {
  box-sizing: border-box;
  container-type: inline-size;
  position: relative;
  width: 100%;
  max-width: 520px;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-snug);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="hob"] { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
[data-ui="hob"] *, [data-ui="hob"] *::before, [data-ui="hob"] *::after { box-sizing: border-box; }
:where([data-ui="hob"]) :is(p, ul, h4) { margin: 0; padding: 0; }
:where([data-ui="hob"]) ul { list-style: none; }
[data-ui="hob"] b { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
[data-ui="hob"] svg { display: block; flex: none; }
.ui-hob__card { min-width: 0; overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-hob__card { background: var(--tc-surface-raised); }
.ui-hob__body { display: grid; gap: var(--tc-space-4); padding: var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-hob__body { padding-top: var(--tc-space-1); }
.ui-hob__pill { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-hob__pill[data-tone="neutral"] { background: var(--tc-fill-default); color: var(--tc-text-secondary); }
.ui-hob__pill[data-tone="success"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-hob__pill[data-tone="danger"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
/* The state the card leads with */
.ui-hob__state { display: flex; align-items: flex-start; gap: var(--tc-space-2-5); border-radius: var(--tc-radius-lg); color: var(--tc-text-primary); }
.ui-hob__state:focus { outline: none; }
.ui-hob__state:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-hob__state[data-state="open"], .ui-hob__state[data-state="ready"] { flex-direction: column; align-items: stretch; gap: var(--tc-space-2); }
.ui-hob__state[data-state="blocked"] { padding: var(--tc-space-3); background: var(--tc-status-danger-bg); animation: ui-hob-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-hob__state[data-state="accepted"] { padding: var(--tc-space-3); background: var(--tc-status-success-bg); animation: ui-hob-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-hob__state-icon { display: grid; flex: none; place-items: center; width: 16px; height: 16px; margin-top: var(--tc-space-0-5); }
.ui-hob__state-icon > svg { width: 16px; height: 16px; }
[data-state="blocked"] > .ui-hob__state-icon { color: var(--tc-status-danger-fg); }
[data-state="accepted"] > .ui-hob__state-icon { color: var(--tc-status-success-fg); }
.ui-hob__state-body { display: grid; gap: var(--tc-space-2-5); min-width: 0; }
.ui-hob__state-text { min-width: 0; color: var(--tc-text-secondary); }
.ui-hob__progress-text { display: flex; align-items: baseline; justify-content: space-between; gap: var(--tc-space-3); }
.ui-hob__fraction { flex: none; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-hob__steps { display: flex; gap: var(--tc-space-1); }
.ui-hob__step { flex: 1; height: var(--tc-meter-h); border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); transition: background-color var(--tc-duration-base) var(--tc-ease-standard); }
.ui-hob__step[data-done] { background: var(--tc-status-success-solid); }
/* What's missing */
.ui-hob__missing { display: grid; gap: var(--tc-space-1); }
.ui-hob__miss { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--tc-space-0-5) var(--tc-space-2); padding: var(--tc-space-1-5) var(--tc-space-2-5); border-radius: var(--tc-radius-md); background: var(--tc-surface-raised); }
.ui-hob__miss-label { min-width: 0; color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); overflow-wrap: anywhere; }
.ui-hob__miss-where { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-hob__access { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); }
.ui-hob__note { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); min-height: var(--tc-control-h-sm); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-hob__note > svg { width: 14px; height: 14px; }
.ui-hob__note[data-request="requested"] > svg { color: var(--tc-status-success-fg); }
.ui-hob__note[data-request="failed"] { color: var(--tc-status-danger-fg); }
.ui-hob__spin { transform-origin: 12px 12px; animation: ui-hob-spin var(--tc-duration-slowest) linear infinite; }
/* The sections */
.ui-hob__sections { display: grid; }
.ui-hob__section { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-3) 0; border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-hob__section:last-child { padding-bottom: 0; }
.ui-hob__section-head { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3); min-width: 0; }
.ui-hob__section-title { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-hob__num { display: grid; flex: none; place-items: center; width: 20px; height: 20px; border-radius: 50%; box-shadow: inset 0 0 0 1px var(--tc-border-strong); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-none); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; transition: background-color var(--tc-duration-base) var(--tc-ease-standard), box-shadow var(--tc-duration-base) var(--tc-ease-standard); }
.ui-hob__num > svg { width: 12px; height: 12px; }
[data-acknowledged] .ui-hob__num { background: var(--tc-status-success-solid); box-shadow: none; color: var(--tc-text-on-accent); }
.ui-hob__count { display: grid; place-items: center; min-width: 18px; height: 18px; padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-badge); background: var(--tc-fill-default); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-hob__summary, .ui-hob__items { padding-left: var(--tc-space-7); }
.ui-hob__summary { color: var(--tc-text-secondary); overflow-wrap: anywhere; }
.ui-hob__items { display: grid; gap: var(--tc-space-2); }
.ui-hob__item { display: flex; align-items: baseline; gap: var(--tc-space-2); min-width: 0; }
.ui-hob__bullet { flex: none; width: 5px; height: 5px; border-radius: 50%; background: var(--tc-icon-muted); transform: translateY(-2px); }
.ui-hob__item-text { display: grid; flex: 1; min-width: 0; color: var(--tc-text-primary); overflow-wrap: anywhere; }
.ui-hob__item-detail { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-hob__item-meta { flex: none; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
/* Acknowledge: a small toggle (.tc-btn-sm) – secondary when off, success when on */
.ui-hob__ack[aria-pressed="true"] { background: var(--tc-status-success-bg); box-shadow: none; color: var(--tc-status-success-fg); }
.ui-hob__ack > svg { width: 14px; height: 14px; }
/* The Accept row: on the tray (Standard), the card's last row (Clean) */
.ui-hob__foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: var(--tc-space-2) var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-2) var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-hob__foot { padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-hob__hint { flex: 1 1 200px; min-width: 0; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-hob__btn { display: inline-flex; align-items: center; justify-content: center; margin: 0; border: 0; font: inherit; font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; cursor: pointer; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-quick) var(--tc-ease-standard); }
.ui-hob__btn--primary { height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-hob__btn--primary:hover:not(:disabled) { background: var(--tc-action-primary-bg-hover); }
.ui-hob__btn:active:not(:disabled) { transform: scale(0.98); }
.ui-hob__btn:disabled { opacity: 0.4; cursor: not-allowed; }
[data-ui="hob"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-hob__empty { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
/* An in-flight run, handed on */
.ui-hob__run { display: grid; gap: var(--tc-space-3); }
.ui-hob__run-label { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-hob__run-card { display: grid; gap: var(--tc-space-1); padding: var(--tc-space-3); border-radius: var(--tc-radius-lg); background: var(--tc-surface-well); }
.ui-hob__run-title { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--tc-space-1) var(--tc-space-2); min-width: 0; }
.ui-hob__run-name { min-width: 0; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); overflow-wrap: anywhere; }
.ui-hob__run-status { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
.ui-hob__run-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--tc-icon-muted); }
.ui-hob__run-status[data-status="running"] { color: var(--tc-status-success-fg); }
.ui-hob__run-status[data-status="running"] .ui-hob__run-dot { background: var(--tc-status-success-solid); animation: ui-hob-pulse var(--tc-duration-shimmer) var(--tc-ease-in-out) infinite; }
.ui-hob__run-status[data-status="waiting"] { color: var(--tc-status-warning-fg); }
.ui-hob__run-status[data-status="waiting"] .ui-hob__run-dot { background: var(--tc-status-warning-solid); }
.ui-hob__run-step, .ui-hob__run-meta { font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); overflow-wrap: anywhere; }
.ui-hob__run-meta { color: var(--tc-text-muted); }
.ui-hob__run-key { color: var(--tc-text-muted); }
.ui-hob__takes { display: grid; gap: var(--tc-space-1-5); }
.ui-hob__takes-label { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-hob__takes .ui-hob__items { padding-left: 0; }
.ui-hob__form { display: grid; gap: var(--tc-space-3); }
.ui-hob__field { display: grid; gap: var(--tc-space-1); }
.ui-hob__field-label { padding: 0; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-hob__optional { font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); }
.ui-hob__select, .ui-hob__textarea { width: 100%; border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); color: var(--tc-text-primary); font: inherit; }
.ui-hob__select { height: var(--tc-field-h); padding: 0 var(--tc-space-1); }
.ui-hob__textarea { padding: var(--tc-space-1-5) var(--tc-field-px); resize: vertical; }
.ui-hob__select:focus, .ui-hob__textarea:focus { outline: 0; box-shadow: var(--tc-field-shadow-focus); }
.ui-hob__choice { display: flex; flex-wrap: wrap; gap: var(--tc-space-1) var(--tc-space-4); margin: 0; padding: 0; border: 0; min-width: 0; }
.ui-hob__choice > legend { width: 100%; margin-bottom: var(--tc-space-1); }
.ui-hob__radio { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); min-height: var(--tc-control-h-sm); color: var(--tc-text-secondary); cursor: pointer; }
.ui-hob__radio > input { margin: 0; accent-color: var(--tc-accent-solid); }
.ui-hob__radio > input:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-hob__state[data-state="waiting"] { padding: var(--tc-space-3); background: var(--tc-surface-well); animation: ui-hob-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
[data-state="waiting"] > .ui-hob__state-icon { color: var(--tc-text-muted); }
@container (max-width: 400px) {
  .ui-hob__body { padding: var(--tc-space-3-5); }
  .ui-hob__summary, .ui-hob__items { padding-left: 0; }
  .ui-hob__item { flex-wrap: wrap; }
  .ui-hob__item-meta { padding-left: var(--tc-space-3); }
}
@keyframes ui-hob-in { from { opacity: 0; transform: translateY(-2px); } }
@keyframes ui-hob-spin { to { transform: rotate(360deg); } }
@keyframes ui-hob-pulse { 50% { opacity: 0.4; } }
@media (prefers-reduced-motion: reduce) {
  [data-ui="hob"] *, [data-ui="hob"] *::before, [data-ui="hob"] *::after { animation: none !important; transition: none !important; }
}
@media (forced-colors: active) {
  .ui-hob__pill, .ui-hob__ack, .ui-hob__btn, .ui-hob__state[data-state="blocked"], .ui-hob__state[data-state="accepted"] { border: 1px solid CanvasText; }
  .ui-hob__step { border: 1px solid CanvasText; }
  .ui-hob__step[data-done] { background: Highlight; }
  .ui-hob__run-dot { background: CanvasText; }
  .ui-hob__ack[aria-pressed="true"] { outline: 2px solid Highlight; }
}
`;
}

if (!customElements.get("tc-handoff-brief")) customElements.define("tc-handoff-brief", TcHandoffBrief);

declare global {
  interface HTMLElementTagNameMap {
    "tc-handoff-brief": TcHandoffBrief;
  }
}
