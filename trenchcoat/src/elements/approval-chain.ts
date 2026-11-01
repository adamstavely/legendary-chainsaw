import { html, nothing, svg, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { formatDate, initials } from "./internal/util";

/*
 * <tc-approval-chain> – several people signing off in order. It says who's next and who's overdue, in words. When
 * `actor` is the person the current step is waiting on (or the person it was delegated to), that step offers Approve,
 * Decline, which needs a note, and Delegate, from `delegates`. Approving moves the chain on; after a decline, the rest
 * show as not reached. Overdue needs `now`: the element doesn't read the clock.
 * It only records what people chose. The page checks who may decide, and keeps the record.
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-approval-chain actor="Noor Haddad" .steps=${steps} .now=${now}></tc-approval-chain>
 */

export type ApprovalStepStatus = "waiting" | "current" | "approved" | "declined" | "skipped";
export type ApprovalStep = {
  id: string;
  name: string;
  /** What they sign off as: "Finance lead" */
  role?: string;
  status: ApprovalStepStatus;
  /** When they decided, epoch ms */
  decidedAt?: number;
  /** What they said; required for a decline */
  note?: string;
  /** When it's due, epoch ms */
  dueAt?: number;
  /** Who it was handed to */
  delegatedTo?: string;
};
export type ApprovalChange = "approve" | "decline" | "delegate";
export type ApprovalStepsChange = { steps: ApprovalStep[]; change: ApprovalChange; step: ApprovalStep };

/** The chain's words, every one renameable through `labels` */
export type ApprovalChainLabels = {
  waiting: string;
  current: string;
  approved: string;
  declined: string;
  skipped: string;
  notReached: string;
  /** {name} */
  next: string;
  complete: string;
  /** {name} */
  stopped: string;
  overdue: string;
  /** {date} */
  due: string;
  /** {date} */
  decidedOn: string;
  /** {name} */
  delegatedTo: string;
  approve: string;
  decline: string;
  delegate: string;
  note: string;
  notePlaceholder: string;
  needsNote: string;
  confirmDecline: string;
  delegateTo: string;
  confirmDelegate: string;
  cancel: string;
  /** {name} */
  announceApproved: string;
  announceDeclined: string;
  /** {name} */
  announceDelegated: string;
};
export const defaultApprovalChainLabels: ApprovalChainLabels = {
  waiting: "Waiting",
  current: "Up next",
  approved: "Approved",
  declined: "Declined",
  skipped: "Skipped",
  notReached: "Not reached",
  next: "Next: {name}",
  complete: "All signed off",
  stopped: "Declined by {name}",
  overdue: "Overdue",
  due: "Due {date}",
  decidedOn: "{date}",
  delegatedTo: "Delegated to {name}",
  approve: "Approve",
  decline: "Decline",
  delegate: "Delegate",
  note: "Why are you declining?",
  notePlaceholder: "This goes in the record",
  needsNote: "Add your reason.",
  confirmDecline: "Decline",
  delegateTo: "Delegate to",
  confirmDelegate: "Delegate",
  cancel: "Cancel",
  announceApproved: "Approved. Next: {name}",
  announceDeclined: "Declined",
  announceDelegated: "Delegated to {name}",
};

/* check, x: Lucide (ISC) */
const CHAIN_ICON = svg`<path d="M9 17H7A5 5 0 0 1 7 7h2"></path><path d="M15 7h2a5 5 0 1 1 0 10h-2"></path><path d="M8 12h8"></path>`;
const MARK: Partial<Record<ApprovalStepStatus, ReturnType<typeof svg>>> = {
  approved: svg`<path d="M20 6 9 17l-5-5"></path>`,
  declined: svg`<path d="M18 6 6 18M6 6l12 12"></path>`,
  skipped: svg`<path d="M5 12h14"></path>`,
};
let instances = 0;

/**
 * Several people signing off in order, with who's next, who's overdue, and Approve, Decline and Delegate for the person it's waiting on.
 * @tag tc-approval-chain
 * @fires tc-steps-change - Someone approved, declined or delegated ({ steps, change, step }: ApprovalStepsChange); cancelable – prevented, `steps` stays as it was
 */
export class TcApprovalChain extends TcElement {
  static override ui = "apc";

  /** The heading */
  @property() accessor heading = "Approvals";
  /** A line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The sign-offs, in order. Changed by the user unless a tc-steps-change listener calls preventDefault() */
  @property({ attribute: false }) accessor steps: ApprovalStep[] = [];
  /** Who's looking. They can decide when the current step is waiting on this name */
  @property() accessor actor: string | undefined = undefined;
  /** Who a step can be handed to */
  @property({ attribute: false }) accessor delegates: string[] = [];
  /** "Now" for overdue and for when a decision was made, epoch ms. The element doesn't read the clock */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** The locale for dates */
  @property() accessor locale: string | undefined = undefined;
  /** Rename any of the words */
  @property({ attribute: false }) accessor labels: Partial<ApprovalChainLabels> = {};

  @state() private accessor mode: "decline" | "delegate" | null = null;
  @state() private accessor note = "";
  @state() private accessor delegate = "";
  @state() private accessor tried = false;
  @state() private accessor announce = "";
  private readonly uid = `tc-apc-${++instances}`;

  private get words(): ApprovalChainLabels {
    return { ...defaultApprovalChainLabels, ...this.labels };
  }

  private canAct(step: ApprovalStep) {
    return step.status === "current" && !!this.actor && (step.delegatedTo ? step.delegatedTo === this.actor : step.name === this.actor);
  }

  private get stoppedAt() {
    return this.steps.findIndex((s) => s.status === "declined");
  }

  private commit(steps: ApprovalStep[], change: ApprovalChange, step: ApprovalStep, message: string) {
    if (!this.emit<ApprovalStepsChange>("tc-steps-change", { steps, change, step }, { cancelable: true })) return false;
    this.steps = steps;
    this.reset();
    this.announce = message;
    const id = step.id;
    this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-step="${CSS.escape(id)}"] .ui-apc__name`)?.focus());
    return true;
  }

  private reset() {
    this.mode = null;
    this.note = "";
    this.delegate = "";
    this.tried = false;
  }

  private stamp() {
    return this.now !== undefined ? { decidedAt: this.now } : {};
  }

  private approve(step: ApprovalStep) {
    const at = this.steps.findIndex((s) => s.id === step.id);
    const nextAt = this.steps.findIndex((s, i) => i > at && s.status === "waiting");
    const done: ApprovalStep = { ...step, status: "approved", ...this.stamp() };
    const steps = this.steps.map((s, i) => (i === at ? done : i === nextAt ? { ...s, status: "current" as const } : s));
    const w = this.words;
    this.commit(steps, "approve", done, nextAt >= 0 ? w.announceApproved.replace("{name}", this.steps[nextAt]!.name) : w.complete);
  }

  private decline(step: ApprovalStep) {
    const note = this.note.trim();
    if (!note) {
      this.tried = true;
      this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-apc__note")?.focus());
      return;
    }
    const done: ApprovalStep = { ...step, status: "declined", note, ...this.stamp() };
    this.commit(this.steps.map((s) => (s.id === step.id ? done : s)), "decline", done, this.words.announceDeclined);
  }

  private delegateTo(step: ApprovalStep) {
    const to = this.delegate || this.delegates.find((d) => d !== this.actor);
    if (!to) return;
    const done: ApprovalStep = { ...step, delegatedTo: to };
    this.commit(this.steps.map((s) => (s.id === step.id ? done : s)), "delegate", done, this.words.announceDelegated.replace("{name}", to));
  }

  private open(mode: "decline" | "delegate") {
    this.reset();
    this.mode = mode;
    this.updateComplete.then(() => this.querySelector<HTMLElement>(mode === "decline" ? ".ui-apc__note" : ".ui-apc__delegate")?.focus());
  }

  private cancel() {
    this.reset();
    this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-apc__approve")?.focus());
  }

  private summary() {
    const w = this.words;
    const stopped = this.stoppedAt;
    if (stopped >= 0) return { text: w.stopped.replace("{name}", this.steps[stopped]!.name), tone: "danger" };
    const current = this.steps.find((s) => s.status === "current");
    if (current) return { text: w.next.replace("{name}", current.delegatedTo ?? current.name), tone: this.isOverdue(current) ? "warning" : "" };
    if (this.steps.length && this.steps.every((s) => s.status === "approved" || s.status === "skipped")) return { text: w.complete, tone: "success" };
    return null;
  }

  private isOverdue(s: ApprovalStep) {
    return (s.status === "current" || s.status === "waiting") && this.stoppedAt < 0 && s.dueAt !== undefined && this.now !== undefined && s.dueAt < this.now;
  }

  private renderActions(step: ApprovalStep): TemplateResult {
    const w = this.words;
    const noteId = `${this.uid}-note`;
    const missing = this.tried && !this.note.trim();
    if (this.mode === "decline") {
      return html`<div class="ui-apc__form">
        <label class="ui-apc__label" for=${noteId}>${w.note}</label>
        <textarea
          id=${noteId}
          class="ui-apc__note"
          rows="2"
          placeholder=${w.notePlaceholder}
          aria-required="true"
          aria-invalid=${missing ? "true" : "false"}
          aria-describedby=${missing ? `${noteId}-error` : nothing}
          .value=${live(this.note)}
          @input=${(e: Event) => (this.note = (e.target as HTMLTextAreaElement).value)}
        ></textarea>
        ${missing ? html`<p class="ui-apc__error" id=${`${noteId}-error`}>${w.needsNote}</p>` : nothing}
        <div class="ui-apc__buttons">
          <button type="button" class="tc-btn-sm ui-apc__cancel" @click=${this.cancel}>${w.cancel}</button>
          <button type="button" class="tc-btn-sm ui-apc__confirm-decline" @click=${() => this.decline(step)}>${w.confirmDecline}</button>
        </div>
      </div>`;
    }
    if (this.mode === "delegate") {
      const others = this.delegates.filter((d) => d !== this.actor);
      return html`<div class="ui-apc__form">
        <label class="ui-apc__label" for=${`${this.uid}-to`}>${w.delegateTo}</label>
        <select id=${`${this.uid}-to`} class="ui-apc__delegate" @change=${(e: Event) => (this.delegate = (e.target as HTMLSelectElement).value)}>
          ${others.map((d) => html`<option value=${d} .selected=${live(d === (this.delegate || others[0]))}>${d}</option>`)}
        </select>
        <div class="ui-apc__buttons">
          <button type="button" class="tc-btn-sm ui-apc__cancel" @click=${this.cancel}>${w.cancel}</button>
          <button type="button" class="tc-btn-sm ui-apc__confirm-delegate" @click=${() => this.delegateTo(step)}>${w.confirmDelegate}</button>
        </div>
      </div>`;
    }
    const canDelegate = this.delegates.some((d) => d !== this.actor);
    return html`<div class="ui-apc__buttons ui-apc__actions">
      <button type="button" class="ui-apc__approve" @click=${() => this.approve(step)}>${w.approve}</button>
      <button type="button" class="tc-btn-sm ui-apc__decline" @click=${() => this.open("decline")}>${w.decline}</button>
      ${canDelegate ? html`<button type="button" class="tc-btn-sm ui-apc__delegate-open" @click=${() => this.open("delegate")}>${w.delegate}</button>` : nothing}
    </div>`;
  }

  private renderStep(step: ApprovalStep, index: number) {
    const w = this.words;
    const stopped = this.stoppedAt;
    const unreached = stopped >= 0 && index > stopped && step.status !== "skipped" && step.status !== "approved";
    const shown = unreached ? "unreached" : step.status;
    const word = unreached ? w.notReached : w[step.status];
    const overdue = !unreached && this.isOverdue(step);
    const mark = MARK[step.status];
    const decided = step.decidedAt !== undefined ? w.decidedOn.replace("{date}", formatDate(step.decidedAt, this.locale, { dateStyle: "medium" })) : "";
    return html`<li class="ui-apc__step" data-step=${step.id} data-status=${shown} aria-current=${ifDefined(step.status === "current" && !unreached ? "step" : undefined)}>
      <span class="ui-apc__mark" aria-hidden="true">${mark ? html`<svg class="ui-apc__icon" viewBox="0 0 24 24">${mark}</svg>` : initials(step.name)}</span>
      <div class="ui-apc__body">
        <div class="ui-apc__line">
          <span class="ui-apc__name" tabindex="-1">${step.name}</span>
          <span class="ui-apc__word" data-status=${shown}>${word}</span>
          ${overdue ? html`<span class="ui-apc__overdue">${w.overdue}</span>` : nothing}
        </div>
        ${step.role ? html`<span class="ui-apc__meta">${step.role}</span>` : nothing}
        ${step.delegatedTo ? html`<span class="ui-apc__meta ui-apc__delegated">${w.delegatedTo.replace("{name}", step.delegatedTo)}</span>` : nothing}
        ${decided ? html`<span class="ui-apc__meta">${decided}</span>` : step.dueAt !== undefined && !unreached ? html`<span class="ui-apc__meta">${w.due.replace("{date}", formatDate(step.dueAt, this.locale, { dateStyle: "medium" }))}</span>` : nothing}
        ${step.note ? html`<p class="ui-apc__said">${step.note}</p>` : nothing}
        ${this.canAct(step) ? this.renderActions(step) : nothing}
      </div>
    </li>`;
  }

  protected override render() {
    const s = this.summary();
    const titleId = `${this.uid}-title`;
    return html`${cardHead({ icon: CHAIN_ICON, title: this.heading, subtitle: this.description, id: titleId, aside: s ? html`<span class="ui-apc__summary" data-tone=${s.tone}>${s.text}</span>` : nothing })}
      <div class="ui-apc__card">
        <ol class="ui-apc__list" aria-labelledby=${titleId}>${this.steps.map((step, i) => this.renderStep(step, i))}</ol>
      </div>
      <span class="tc-sr-only" role="status">${this.announce}</span>`;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="apc"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="apc"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
[data-ui="apc"] { --tc-apc-mark: 28px; }
[data-ui="apc"] *, [data-ui="apc"] *::before, [data-ui="apc"] *::after { box-sizing: border-box; }
[data-ui="apc"] :where(p) { margin: 0; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="apc"] .ui-apc__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-apc__summary { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-apc__summary[data-tone="danger"] { color: var(--tc-status-danger-fg); }
.ui-apc__summary[data-tone="warning"] { color: var(--tc-status-warning-fg); }
.ui-apc__summary[data-tone="success"] { color: var(--tc-status-success-fg); }
.ui-apc__list { display: grid; margin: 0; padding: var(--tc-space-2) var(--tc-space-4); list-style: none; }
.ui-apc__step { position: relative; display: flex; gap: var(--tc-space-3); padding: var(--tc-space-2) 0; }
.ui-apc__step:not(:last-child)::before { content: ""; position: absolute; top: calc(var(--tc-space-2) + var(--tc-apc-mark)); bottom: calc(-1 * var(--tc-space-2)); inset-inline-start: calc(var(--tc-apc-mark) / 2); border-inline-start: var(--tc-hairline) solid var(--tc-border-strong); }
.ui-apc__mark { position: relative; display: inline-flex; flex: none; align-items: center; justify-content: center; width: var(--tc-apc-mark); height: var(--tc-apc-mark); border-radius: var(--tc-radius-full); background: var(--tc-fill-hover); color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-apc__step[data-status="current"] .ui-apc__mark { box-shadow: 0 0 0 2px var(--tc-text-primary); color: var(--tc-text-primary); }
.ui-apc__step[data-status="approved"] .ui-apc__mark { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-apc__step[data-status="declined"] .ui-apc__mark { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-apc__icon { width: var(--tc-icon-size-md, 16px); height: var(--tc-icon-size-md, 16px); fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ui-apc__body { display: grid; flex: 1; gap: var(--tc-space-0-5); min-width: 0; }
.ui-apc__line { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--tc-space-1) var(--tc-space-2); }
.ui-apc__name { font-weight: var(--tc-font-weight-medium); overflow-wrap: anywhere; outline: none; }
.ui-apc__word, .ui-apc__meta { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); }
.ui-apc__word[data-status="approved"] { color: var(--tc-status-success-fg); }
.ui-apc__word[data-status="declined"] { color: var(--tc-status-danger-fg); }
.ui-apc__word[data-status="current"] { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
.ui-apc__overdue { color: var(--tc-status-warning-fg); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-apc__said { color: var(--tc-text-secondary); overflow-wrap: anywhere; white-space: pre-wrap; }
.ui-apc__form { display: grid; gap: var(--tc-space-1); margin-top: var(--tc-space-2); }
.ui-apc__label { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-apc__note, .ui-apc__delegate { width: 100%; border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); color: var(--tc-text-primary); font: inherit; }
.ui-apc__note { padding: var(--tc-space-1-5) var(--tc-field-px); resize: vertical; }
.ui-apc__delegate { height: var(--tc-field-h); padding: 0 var(--tc-space-1); }
.ui-apc__note:focus, .ui-apc__delegate:focus { outline: 0; box-shadow: var(--tc-field-shadow-focus); }
.ui-apc__note[aria-invalid="true"] { box-shadow: var(--tc-field-shadow-invalid); }
.ui-apc__note::placeholder { color: var(--tc-text-muted); }
.ui-apc__error { color: var(--tc-status-danger-fg); font-size: var(--tc-font-size-xs); }
.ui-apc__buttons { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); margin-top: var(--tc-space-1); }
.ui-apc__actions { margin-top: var(--tc-space-2); }
.ui-apc__approve { height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-md); border: 0; border-radius: var(--tc-control-radius-sm); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); font: inherit; font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); cursor: pointer; }
.ui-apc__approve:hover { background: var(--tc-action-primary-bg-hover); }
.ui-apc__approve:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
@media (forced-colors: active) {
  .ui-apc__mark { border: 1px solid CanvasText; }
}
`;
}

if (!customElements.get("tc-approval-chain")) customElements.define("tc-approval-chain", TcApprovalChain);

declare global {
  interface HTMLElementTagNameMap {
    "tc-approval-chain": TcApprovalChain;
  }
}
