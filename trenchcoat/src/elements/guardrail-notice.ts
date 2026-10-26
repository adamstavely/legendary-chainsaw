import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { FocusRescueController } from "./internal/controllers";

/*
 * <tc-guardrail-notice> – content a policy blocked, redacted or rewrote, said plainly where it happened: which policy,
 * why, and what changed – the original and what went out instead, side by side, with personal data masked (the app
 * masks it; the element shows what it's given) – and a way to ask a person to look at it again ("Request review").
 *   · layout="inline" sits in a thread where the content would have been: a card, the changes folded away
 *   · layout="banner" runs across the top of a view: one tinted row, the changes opening under it
 * Standard: a white card on the gray tray, the buttons on the tray below it (inline); a toned band (banner). Clean:
 * one quiet white card with the tone as a thin rule.
 *
 *   <tc-guardrail-notice action="redacted" policy="Personal data" reason="The reply quoted a customer's card number."></tc-guardrail-notice>
 *
 * The original and the revised content are text, or segments marking what was removed, added or masked:
 *   notice.revised = [{ text: "Card ending " }, { text: "•••• 4821", mark: "masked" }];
 */

export type GuardrailAction = "blocked" | "redacted" | "rewritten";
export type GuardrailLayout = "inline" | "banner";
/** A run of text in the before / after: plain, or marked as removed, added or masked */
export type GuardrailSegment = { text: string; mark?: "removed" | "added" | "masked" };
export type GuardrailText = string | GuardrailSegment[];

/** Detail of tc-open-change */
export type GuardrailOpenChange = { open: boolean };
/** Detail of tc-review-request: what the notice is about */
export type GuardrailReviewRequest = { action: GuardrailAction; policy: string };

const HEADING: Record<GuardrailAction, string> = { blocked: "Blocked by policy", redacted: "Redacted by policy", rewritten: "Rewritten by policy" };
const REVISED: Record<GuardrailAction, string> = { blocked: "Shown instead", redacted: "After redaction", rewritten: "Rewritten" };
const MARK_SR: Record<NonNullable<GuardrailSegment["mark"]>, string> = { removed: "Removed: ", added: "Added: ", masked: "Masked: " };
/** A boolean attribute that defaults to true: "false" turns it off */
const onByDefault = { fromAttribute: (v: string | null) => v !== "false" };

/* Icons: Lucide (ISC, lucide.dev) – octagon-x, eye-off, pencil-line, shield, chevron-down, check, x */
const glyph = (body: ReturnType<typeof svg>, className = "") => html`<svg viewBox="0 0 24 24" class=${["ui-grn__glyph", className].filter(Boolean).join(" ")} aria-hidden="true">${body}</svg>`;
const icons = {
  blocked: () => glyph(svg`<path d="M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86z"></path><path d="m15 9-6 6M9 9l6 6"></path>`),
  redacted: () =>
    glyph(svg`<path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><path d="M14.08 14.16a3 3 0 0 1-4.24-4.24"></path><path d="m2 2 20 20"></path>`),
  rewritten: () => glyph(svg`<path d="M13 21h8"></path><path d="M21.17 6.81a2.83 2.83 0 0 0-4-4L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z"></path>`),
  shield: () => glyph(svg`<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>`, "ui-grn__small"),
  chevron: () => glyph(svg`<path d="m6 9 6 6 6-6"></path>`, "ui-grn__chev"),
  check: () => glyph(svg`<path d="M20 6 9 17l-5-5"></path>`, "ui-grn__small"),
  close: () => glyph(svg`<path d="M18 6 6 18M6 6l12 12"></path>`),
};

let instances = 0;

/**
 * Content a policy blocked, redacted or rewrote: which policy, why, what changed – personal data masked – and Request review.
 * @tag tc-guardrail-notice
 * @fires tc-open-change - "Show what changed" opened or closed the before / after. Cancelable. Detail: GuardrailOpenChange ({ open })
 * @fires tc-review-request - Request review was pressed. Cancelable: unless prevented, the button turns into "Review requested". Detail: GuardrailReviewRequest ({ action, policy })
 * @fires tc-dismiss - The close button of a dismissible notice was pressed; remove the notice in answer
 */
export class TcGuardrailNotice extends TcElement {
  static override ui = "grn";

  /** What the policy did: blocked the content, redacted parts of it or rewrote it – sets the icon, tone and wording */
  @property({ reflect: true }) accessor action: GuardrailAction = "blocked";
  /** Where it sits: "inline" in a thread, where the content would have been, or "banner" across the top of a view */
  @property({ reflect: true }) accessor layout: GuardrailLayout = "inline";
  /** The heading – "Blocked by policy", "Redacted by policy" or "Rewritten by policy" by default */
  @property() accessor heading: string | undefined = undefined;
  /** The policy that acted, by the name people know it by, e.g. "Personal data" */
  @property() accessor policy = "";
  /** A link to the policy itself; the policy name becomes the link */
  @property({ attribute: "policy-href" }) accessor policyHref: string | undefined = undefined;
  /** Why the policy acted, in a sentence */
  @property() accessor reason: string | undefined = undefined;
  /** The content as it was, with personal data already masked by the app – text, or segments */
  @property({ attribute: false }) accessor original: GuardrailText | undefined = undefined;
  /** The content as it went out – text, or segments; leave it out when nothing went out */
  @property({ attribute: false }) accessor revised: GuardrailText | undefined = undefined;
  /** The label over the original */
  @property({ attribute: "original-label" }) accessor originalLabel = "Original";
  /** The label over what went out – "Shown instead", "After redaction" or "Rewritten" by default */
  @property({ attribute: "revised-label" }) accessor revisedLabel: string | undefined = undefined;
  /** Whether the before / after is showing */
  @property({ type: Boolean, reflect: true }) accessor open = false;
  /** Offers Request review; set it to false where there is no one to review */
  @property({ converter: onByDefault }) accessor reviewable = true;
  /** A review has been requested: the button shows "Review requested" and is off */
  @property({ type: Boolean, reflect: true }) accessor requested = false;
  /** The label of the review button */
  @property({ attribute: "review-label" }) accessor reviewLabel = "Request review";
  /** What the button says once a review is requested */
  @property({ attribute: "requested-label" }) accessor requestedLabel = "Review requested";
  /** Shows a close button that fires tc-dismiss */
  @property({ type: Boolean }) accessor dismissible = false;

  /** @internal What the status region says */
  @state() accessor said = "";

  private readonly uid = `tc-grn${++instances}`;

  constructor() {
    super();
    // The review button turns into "Review requested": focus stays on it, else on the toggle
    new FocusRescueController(this, () => this.querySelector<HTMLElement>(".ui-grn__review, .ui-grn__toggle"));
  }

  private get hasChanges() {
    const filled = (t: GuardrailText | undefined) => (typeof t === "string" ? !!t.trim() : !!t?.length);
    return filled(this.original) || filled(this.revised);
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    // The host is the notice: a group in a thread, a region across a view, named by the heading
    this.setAttribute("role", this.layout === "banner" ? "region" : "group");
    this.setAttribute("aria-labelledby", `${this.uid}-title`);
  }

  private toggle() {
    const open = !this.open;
    if (this.emit<GuardrailOpenChange>("tc-open-change", { open }, { cancelable: true })) this.open = open;
  }

  private requestReview() {
    if (this.requested) return;
    if (!this.emit<GuardrailReviewRequest>("tc-review-request", { action: this.action, policy: this.policy }, { cancelable: true })) return;
    this.requested = true;
    this.said = `${this.requestedLabel}. ${this.policy ? `The ${this.policy} decision` : "The decision"} will be looked at again.`;
  }

  private dismiss() {
    this.emit("tc-dismiss", null);
  }

  /* ---------- Rendering ---------- */

  private renderText(t: GuardrailText | undefined): TemplateResult {
    if (t === undefined || (typeof t === "string" && !t.trim()) || (Array.isArray(t) && !t.length)) return html`<span class="ui-grn__none">Nothing</span>`;
    if (typeof t === "string") return html`${t}`;
    return html`${t.map((s) =>
      s.mark === "removed"
        ? html`<del class="ui-grn__mark" data-mark="removed"><span class="ui-grn__sr">${MARK_SR.removed}</span>${s.text}</del>`
        : s.mark === "added"
          ? html`<ins class="ui-grn__mark" data-mark="added"><span class="ui-grn__sr">${MARK_SR.added}</span>${s.text}</ins>`
          : s.mark === "masked"
            ? html`<span class="ui-grn__mark" data-mark="masked"><span class="ui-grn__sr">${MARK_SR.masked}</span>${s.text}</span>`
            : s.text,
    )}`;
  }

  private renderChanges() {
    if (!this.hasChanges) return nothing;
    const revisedLabel = this.revisedLabel ?? REVISED[this.action];
    return html`<div class="ui-grn__changes" id=${`${this.uid}-changes`} ?hidden=${!this.open}>
      <div class="ui-grn__side" data-side="original">
        <span class="ui-grn__side-label">${this.originalLabel}</span>
        <p class="ui-grn__text">${this.renderText(this.original)}</p>
      </div>
      <div class="ui-grn__side" data-side="revised">
        <span class="ui-grn__side-label">${revisedLabel}</span>
        <p class="ui-grn__text">${this.renderText(this.revised)}</p>
      </div>
    </div>`;
  }

  private renderPolicy() {
    if (!this.policy) return nothing;
    const name = this.policyHref ? html`<a class="ui-grn__policy-link" href=${this.policyHref}>${this.policy}</a>` : this.policy;
    return html`<span class="ui-grn__policy">${icons.shield()}<span class="ui-grn__sr">Policy: </span>${name}</span>`;
  }

  private renderActions() {
    const toggle = this.hasChanges
      ? html`<button type="button" class="ui-grn__toggle" aria-expanded=${this.open ? "true" : "false"} aria-controls=${`${this.uid}-changes`} @click=${this.toggle}>
          ${this.open ? "Hide what changed" : "Show what changed"}${icons.chevron()}
        </button>`
      : nothing;
    const review = !this.reviewable
      ? nothing
      : this.requested
        ? html`<span class="ui-grn__requested" tabindex="-1" data-focus-key="review">${icons.check()}${this.requestedLabel}</span>`
        : html`<button type="button" class="ui-grn__review" data-focus-key="review" @click=${this.requestReview}>${this.reviewLabel}</button>`;
    if (toggle === nothing && review === nothing) return nothing;
    return html`<div class="ui-grn__actions">${toggle}<span class="ui-grn__spacer"></span>${review}</div>`;
  }

  protected override render() {
    const action = this.action;
    const heading = this.heading ?? HEADING[action] ?? HEADING.blocked;
    const close = this.dismissible ? html`<button type="button" class="ui-grn__close" aria-label="Dismiss" title="Dismiss" @click=${this.dismiss}>${icons.close()}</button>` : nothing;
    const reason = this.reason ? html`<p class="ui-grn__reason">${this.reason}</p>` : nothing;
    const status = html`<span class="ui-grn__sr" role="status">${this.said}</span>`;
    if (this.layout === "banner") {
      return html`<div class="ui-grn__card">
          <div class="ui-grn__row">
            <span class="ui-grn__icon">${(icons[action] ?? icons.blocked)()}</span>
            <div class="ui-grn__main">
              <div class="ui-grn__titles"><span class="ui-grn__title" id=${`${this.uid}-title`}>${heading}</span>${this.renderPolicy()}</div>
              ${reason}
            </div>
            ${this.renderActions()}${close}
          </div>
          ${this.renderChanges()}
        </div>
        ${status}`;
    }
    const head = html`<div class="ui-grn__head">
      <span class="ui-grn__icon">${(icons[action] ?? icons.blocked)()}</span>
      <div class="ui-grn__titles">
        <span class="ui-grn__title" id=${`${this.uid}-title`}>${heading}</span>${this.renderPolicy()}
      </div>
      ${close}
    </div>`;
    const clean = this.resolvedLook === "clean";
    const card = html`${head}${reason}${this.renderChanges()}`;
    return html`${clean ? html`<div class="ui-grn__card">${card}${this.renderActions()}</div>` : html`<div class="ui-grn__card">${card}</div>${this.renderActions()}`}${status}`;
  }

  static override css = /* css */ `
/* The tone follows the action: blocked is danger, redacted a warning, rewritten information */
[data-ui="grn"] { --tc-guardrail-notice-icon: 28px; --tc-guardrail-notice-fg: var(--tc-status-danger-fg); --tc-guardrail-notice-bg: var(--tc-status-danger-bg); --tc-guardrail-notice-border: var(--tc-status-danger-border); }
[data-ui="grn"][action="redacted"] { --tc-guardrail-notice-fg: var(--tc-status-warning-fg); --tc-guardrail-notice-bg: var(--tc-status-warning-bg); --tc-guardrail-notice-border: var(--tc-status-warning-border); }
[data-ui="grn"][action="rewritten"] { --tc-guardrail-notice-fg: var(--tc-status-info-fg); --tc-guardrail-notice-bg: var(--tc-status-info-bg); --tc-guardrail-notice-border: var(--tc-status-info-border); }
/* Standard, inline: a gray tray holding a white card; the buttons sit on the tray below it */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="grn"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 520px;
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
/* Clean, inline: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="grn"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 500px;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* A banner runs the width of its container */
[data-ui="grn"][layout="banner"] { max-width: none; padding: 0; border-radius: 0; background: none; }
[data-ui="grn"] *, [data-ui="grn"] *::before, [data-ui="grn"] *::after { box-sizing: border-box; }
:where([data-ui="grn"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="grn"] button:focus-visible, .ui-grn__policy-link:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="grn"] p { margin: 0; }
[data-ui="grn"] [hidden] { display: none !important; }
.ui-grn__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-grn__glyph { display: block; flex: none; width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-grn__glyph { display: block; flex: none; width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.ui-grn__glyph.ui-grn__small { width: 12px; height: 12px; }
/* ----- The card ----- */
.ui-grn__card { min-width: 0; animation: ui-grn-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-grn__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-grn__card { position: relative; overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
/* Clean: the tone as a thin rule down the left edge */
:where([data-look="clean"], [data-look="clean"] *).ui-grn__card::before { content: ""; position: absolute; top: 0; bottom: 0; left: 0; width: 3px; background: var(--tc-guardrail-notice-fg); opacity: 0.8; }
.ui-grn__head { display: flex; align-items: flex-start; gap: var(--tc-space-2-5); min-width: 0; padding: var(--tc-space-3) var(--tc-space-3) 0 var(--tc-space-3-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-grn__head { padding-left: var(--tc-space-4); }
.ui-grn__icon { display: grid; flex: none; place-items: center; width: var(--tc-guardrail-notice-icon); height: var(--tc-guardrail-notice-icon); border-radius: var(--tc-radius-md); background: var(--tc-guardrail-notice-bg); color: var(--tc-guardrail-notice-fg); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="grn"] { --tc-guardrail-notice-icon: 24px; }
:where([data-look="clean"], [data-look="clean"] *).ui-grn__icon { border-radius: var(--tc-radius-sm); background: none; }
.ui-grn__titles { display: flex; flex: 1; flex-wrap: wrap; align-items: center; column-gap: var(--tc-space-2); row-gap: var(--tc-space-0-5); min-width: 0; min-height: var(--tc-guardrail-notice-icon); }
.ui-grn__title { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-grn__title { font-weight: var(--tc-font-weight-strong); }
:where([data-look="clean"], [data-look="clean"] *).ui-grn__title { color: var(--tc-text-strong); }
/* The policy: a quiet pill with a shield */
.ui-grn__policy { display: inline-flex; align-items: center; gap: var(--tc-space-1); min-width: 0; max-width: 100%; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); white-space: nowrap; }
.ui-grn__policy-link { overflow: hidden; color: inherit; text-decoration: underline; text-decoration-color: var(--tc-border-strong); text-underline-offset: 2px; text-overflow: ellipsis; }
.ui-grn__policy-link:hover { color: var(--tc-text-primary); text-decoration-color: currentColor; }
.ui-grn__close { display: grid; flex: none; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); margin: calc(var(--tc-space-0-5) * -1) calc(var(--tc-space-1) * -1) 0 0; border-radius: var(--tc-control-radius-sm); color: var(--tc-action-ghost-fg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-grn__close:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-grn__reason { padding: var(--tc-space-1-5) var(--tc-space-4) 0 calc(var(--tc-space-3-5) + var(--tc-guardrail-notice-icon) + var(--tc-space-2-5)); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); text-wrap: pretty; }
:where([data-look="clean"], [data-look="clean"] *).ui-grn__reason { padding-left: calc(var(--tc-space-4) + var(--tc-guardrail-notice-icon) + var(--tc-space-2-5)); color: var(--tc-text-secondary); }
:where([data-look="standard"], [data-look="standard"] *)[layout="inline"] .ui-grn__card:not(:has(> .ui-grn__changes:not([hidden]))) { padding-bottom: var(--tc-space-3); }
/* ----- What changed: the original and what went out, side by side ----- */
.ui-grn__changes { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--tc-space-2); margin-top: var(--tc-space-3); padding: var(--tc-space-3); border-top: var(--tc-hairline) solid var(--tc-divider); animation: ui-grn-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-grn__side { display: grid; align-content: start; gap: var(--tc-space-1); min-width: 0; padding: var(--tc-space-2-5) var(--tc-space-3); border-radius: var(--tc-radius-lg); background: var(--tc-surface-well); }
:where([data-look="clean"], [data-look="clean"] *).ui-grn__side { border-radius: var(--tc-radius-md); background: var(--tc-fill-subtle); }
.ui-grn__side-label { font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); letter-spacing: var(--tc-tracking-caps); text-transform: uppercase; color: var(--tc-text-muted); }
.ui-grn__text { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-relaxed); color: var(--tc-text-primary); overflow-wrap: anywhere; white-space: pre-wrap; }
.ui-grn__none { font-style: italic; color: var(--tc-text-muted); }
.ui-grn__mark { padding: 0 var(--tc-space-0-5); border-radius: var(--tc-radius-2xs); text-decoration: none; -webkit-box-decoration-break: clone; box-decoration-break: clone; }
.ui-grn__mark[data-mark="removed"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); text-decoration: line-through; text-decoration-color: color-mix(in srgb, currentColor 60%, transparent); }
.ui-grn__mark[data-mark="added"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
/* Masked personal data: a dark pill, monospaced, so it reads as withheld rather than as text */
.ui-grn__mark[data-mark="masked"] { background: var(--tc-surface-inverse); white-space: nowrap; font-family: var(--tc-font-mono); font-size: 0.92em; letter-spacing: var(--tc-tracking-snug); color: var(--tc-text-on-inverse); }
/* ----- The buttons: on the tray (Standard), the card's last row (Clean) ----- */
.ui-grn__actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1); min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-grn__actions { min-height: 40px; padding: var(--tc-space-1) var(--tc-space-0-5) 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-grn__actions { padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-2) var(--tc-space-2-5); margin-top: var(--tc-space-3); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-grn__changes:not([hidden]) + .ui-grn__actions { margin-top: 0 !important; }
.ui-grn__spacer { flex: 1; }
.ui-grn__toggle { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-ghost-fg); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-grn__toggle:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-grn__chev { width: 14px; height: 14px; transition: transform var(--tc-duration-base) var(--tc-ease-move); }
.ui-grn__toggle[aria-expanded="true"] .ui-grn__chev { transform: rotate(180deg); }
/* Request review: Button's secondary recipe */
.ui-grn__review { display: inline-flex; align-items: center; height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); white-space: nowrap; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-grn__review:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-grn__requested { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-status-success-fg); white-space: nowrap; outline: none; animation: ui-grn-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
/* ----- Banner: one row across the view ----- */
[layout="banner"] .ui-grn__card { width: 100%; }
:where([data-look="standard"], [data-look="standard"] *)[layout="banner"] .ui-grn__card { border-radius: var(--tc-radius-xl); background: var(--tc-guardrail-notice-bg); box-shadow: inset 0 0 0 1px var(--tc-guardrail-notice-border); }
.ui-grn__row { display: grid; grid-template-columns: auto minmax(0, 1fr) auto auto; align-items: center; column-gap: var(--tc-space-2-5); row-gap: var(--tc-space-1); min-width: 0; padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-2) var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-grn__row { padding-left: var(--tc-space-4); }
.ui-grn__row > .ui-grn__icon { align-self: start; }
.ui-grn__main { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-grn__main > .ui-grn__titles { min-height: var(--tc-guardrail-notice-icon); }
.ui-grn__main > .ui-grn__reason { padding: 0; }
.ui-grn__row > .ui-grn__actions { flex-wrap: nowrap; min-height: 0; margin: 0; padding: 0; border: 0; }
.ui-grn__row > .ui-grn__actions > .ui-grn__spacer { display: none; }
.ui-grn__row > .ui-grn__close { grid-column: 4; grid-row: 1; margin: 0; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="grn"][layout="banner"] { --tc-guardrail-notice-icon: 24px; }
:where([data-look="standard"], [data-look="standard"] *)[layout="banner"] .ui-grn__icon { background: none; }
:where([data-look="standard"], [data-look="standard"] *)[layout="banner"] .ui-grn__reason { color: var(--tc-text-secondary); }
:where([data-look="standard"], [data-look="standard"] *)[layout="banner"] .ui-grn__policy { background: color-mix(in srgb, var(--tc-surface-raised) 70%, transparent); }
:where([data-look="standard"], [data-look="standard"] *)[layout="banner"] .ui-grn__toggle { color: var(--tc-text-secondary); }
[layout="banner"] .ui-grn__changes { margin-top: 0; }
:where([data-look="standard"], [data-look="standard"] *)[layout="banner"] .ui-grn__changes { border-top-color: var(--tc-guardrail-notice-border); }
:where([data-look="standard"], [data-look="standard"] *)[layout="banner"] .ui-grn__side { background: var(--tc-surface-raised); }
@keyframes ui-grn-in { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: none; } }
/* Narrow: the before and after stack; the reason loses its indent */
@container (max-width: 440px) {
  .ui-grn__changes { grid-template-columns: minmax(0, 1fr); }
  .ui-grn__reason { padding-left: var(--tc-space-3-5); }
  :where([data-look="clean"], [data-look="clean"] *).ui-grn__reason { padding-left: var(--tc-space-4); }
}
/* A narrow banner: the buttons go under the text */
@container (max-width: 600px) {
  .ui-grn__row { grid-template-columns: auto minmax(0, 1fr) auto; }
  .ui-grn__row > .ui-grn__actions { flex-wrap: wrap; grid-column: 2 / -1; grid-row: 2; margin-left: calc(var(--tc-space-2) * -1); }
  .ui-grn__row > .ui-grn__close { grid-column: 3; }
}
@media (pointer: coarse) {
  .ui-grn__toggle, .ui-grn__review, .ui-grn__close { height: 36px; }
  .ui-grn__close { width: 36px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="grn"] *, [data-ui="grn"] *::before, [data-ui="grn"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-guardrail-notice")) customElements.define("tc-guardrail-notice", TcGuardrailNotice);

declare global {
  interface HTMLElementTagNameMap {
    "tc-guardrail-notice": TcGuardrailNotice;
  }
}
