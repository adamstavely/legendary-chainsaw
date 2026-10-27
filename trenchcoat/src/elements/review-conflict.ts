import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController } from "./internal/controllers";
import { initials } from "./internal/util";

/*
 * <tc-review-conflict> – two reviewers gave opposing verdicts on the same item. It leads with the conflict: the two
 * verdicts side by side, each with who gave it, when and why, and the difference stated in a line under them. A third
 * person resolves it: they uphold one verdict or override both with their own, give a reason (required), and confirm
 * – a cancelable tc-resolve. Not prevented, the card shows the outcome: the upheld verdict marked, the other set back,
 * and the resolution with its reason.
 *
 *   <tc-review-conflict item="The supplier's 2025 revenue was €41m." .reviews=${[a, b]}></tc-review-conflict>
 *
 * Blind mode (`blind`) is the reviewers' own view: neither sees who else reviewed or what they decided, only that "A
 * conflict exists". With `viewer` set to a review's id, that reviewer sees their own verdict and a sealed card for the
 * other. Seeing the other verdict first would anchor their reasoning.
 *
 * Standard: the header on the gray tray, the white card, the confirm row on the tray. Clean: one white card – the header
 * its first row, the confirm row its last under a hairline. Under 400 px the verdicts stack.
 * Keyboard: the verdicts and Override are one radio group (Tab in, arrows between); Tab on to the verdict field, the
 * reason and Confirm. Ctrl/⌘ + Enter in the reason confirms.
 */

export type ReviewTone = "positive" | "negative" | "neutral";

export type ReviewVerdict = {
  id: string;
  /** Who gave it */
  reviewer: { name: string; role?: string };
  /** The verdict in a word or two – "Supported", "Not supported" */
  verdict: string;
  /** The verdict's colour: positive (green), negative (red) or neutral (gray). Default neutral */
  tone?: ReviewTone;
  /** When, as the app words it – "Today 09:14" */
  at?: string;
  /** Their reason, in their words */
  reason: string;
};

/** The outcome: the upheld review's id, or "override" with the resolver's own verdict */
export type ReviewResolution = {
  choice: string;
  verdict: string;
  reason: string;
  /** Who resolved it */
  by?: string;
  /** When, as the app words it */
  at?: string;
};

/** Detail of tc-resolve */
export type ReviewResolveDetail = { choice: string; verdict: string; reason: string };

/* After Lucide (ISC, lucide.dev): scale (the header), not-equal, lock, check, arrow-right */
const headIcon = svg`<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"></path><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"></path><path d="M7 21h10"></path><path d="M12 3v18"></path><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"></path>`;
const icon = (body: TemplateResult) =>
  html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const notEqual = () => icon(svg`<path d="M5 9h14"></path><path d="M5 15h14"></path><path d="M16 4 8 20"></path>`);
const lockIcon = () => icon(svg`<rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>`);
const checkIcon = () => icon(svg`<path d="M20 6 9 17l-5-5"></path>`);
const diffIcon = () => icon(svg`<path d="M8 3 4 7l4 4"></path><path d="M4 7h16"></path><path d="m16 21 4-4-4-4"></path><path d="M20 17H4"></path>`);

let instances = 0;

/**
 * Two reviewers disagree: both verdicts with who gave them, resolved by a third person with a reason, or kept blind.
 * @tag tc-review-conflict
 * @fires tc-resolve - The resolver confirmed ({ choice, verdict, reason }: ReviewResolveDetail) – choice is the upheld review's id or "override"; cancelable – not prevented, `resolution` is set
 */
export class TcReviewConflict extends TcElement {
  static override ui = "rcf";

  /** The heading, and the group's name */
  @property() accessor heading = "Review conflict";
  /** A quiet line under the heading, e.g. the document or queue the item is from */
  @property() accessor scope = "";
  /** What was reviewed, quoted at the top – a claim, a finding, a row */
  @property() accessor item = "";
  /** The two reviews, in the order to show them */
  @property({ attribute: false }) accessor reviews: ReviewVerdict[] = [];
  /** The difference in one sentence; unset, it's written from the verdicts */
  @property() accessor difference = "";
  /** The reviewers' view: identities and verdicts are hidden, only that a conflict exists is shown */
  @property({ type: Boolean, reflect: true }) accessor blind = false;
  /** In blind mode, the id of the review that belongs to the person looking – they see their own verdict */
  @property() accessor viewer: string | undefined = undefined;
  /** The person looking may resolve it. Default true; false shows the conflict read-only */
  @property({ converter: { fromAttribute: (v: string | null) => v !== "false" } }) accessor resolvable = true;
  /** The outcome, once resolved */
  @property({ attribute: false }) accessor resolution: ReviewResolution | null = null;
  /** The resolver's name, recorded with the resolution when the element sets it */
  @property() accessor resolver = "";
  /** The confirm button's text */
  @property({ attribute: "confirm-label" }) accessor confirmLabel = "Confirm resolution";

  /** @internal The pick: a review's id or "override" */
  @state() private accessor choice = "";
  /** @internal The override verdict being typed */
  @state() private accessor ownVerdict = "";
  /** @internal The reason being typed */
  @state() private accessor reason = "";
  /** @internal The polite announcement */
  @state() private accessor announce = "";

  private readonly uid = `tc-rcf${++instances}`;

  constructor() {
    super();
    // Confirm goes away once resolved: focus moves to the outcome
    new FocusRescueController(this, () => this.querySelector(".ui-rcf__outcome"));
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "group");
  }

  /* ---------- Data ---------- */

  /** @internal The two reviews shown (more are ignored) */
  private get pair() {
    return this.reviews.slice(0, 2);
  }
  /** @internal */
  private get phase(): "blind" | "resolved" | "open" {
    if (this.resolution) return "resolved";
    if (this.blind) return "blind";
    return "open";
  }
  /** @internal What's missing before Confirm can be pressed, or "" */
  private get missing() {
    if (!this.choice) return "Pick a verdict to uphold, or override.";
    if (this.choice === "override" && !this.ownVerdict.trim()) return "Give your verdict.";
    if (!this.reason.trim()) return "Give a reason – it's kept with the resolution.";
    return "";
  }
  /** @internal */
  private differenceText() {
    if (this.difference) return this.difference;
    const [a, b] = this.pair;
    if (!a || !b) return "";
    return `${a.reviewer.name} says “${a.verdict}”; ${b.reviewer.name} says “${b.verdict}”.`;
  }

  /* ---------- Changes ---------- */

  private confirm = () => {
    if (this.missing || this.phase !== "open") return;
    const picked = this.pair.find((r) => r.id === this.choice);
    const verdict = picked ? picked.verdict : this.ownVerdict.trim();
    const detail: ReviewResolveDetail = { choice: this.choice, verdict, reason: this.reason.trim() };
    if (!this.emit<ReviewResolveDetail>("tc-resolve", detail, { cancelable: true })) return;
    this.resolution = { ...detail, by: this.resolver || undefined };
  };

  private onReasonKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !e.isComposing) {
      e.preventDefault();
      this.confirm();
    }
  };

  /* ---------- Update ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    this.dataset.state = this.phase;
    if (changed.has("reviews") && this.choice && this.choice !== "override" && !this.pair.some((r) => r.id === this.choice)) this.choice = "";
    if (changed.has("resolution") && changed.get("resolution") !== undefined) {
      this.announce = this.resolution ? `Conflict resolved: ${this.resolution.verdict}.` : "";
    }
  }

  protected override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (!this.hasAttribute("aria-label") && !this.hasAttribute("aria-labelledby")) this.setAttribute("aria-labelledby", `${this.uid}-title`);
  }

  /* ---------- Render ---------- */

  private renderVerdict(r: ReviewVerdict) {
    const st = this.phase;
    const sealed = st === "blind" && r.id !== this.viewer;
    const res = this.resolution;
    const outcome = res ? (res.choice === r.id ? "upheld" : "overruled") : undefined;
    const pickable = st === "open" && this.resolvable;
    const own = st === "blind" && r.id === this.viewer;
    if (sealed) {
      return html`<div class="ui-rcf__verdict" data-sealed>
        <span class="ui-rcf__who"><span class="ui-rcf__avatar" aria-hidden="true">${lockIcon()}</span><span class="ui-rcf__name">Another reviewer</span></span>
        <span class="ui-rcf__badge" data-tone="sealed">Verdict hidden</span>
        <p class="ui-rcf__reason">You'll see the outcome once it's resolved.</p>
      </div>`;
    }
    const body = html`<span class="ui-rcf__top">
        <span class="ui-rcf__who">
          <span class="ui-rcf__avatar" aria-hidden="true">${initials(r.reviewer.name)}</span>
          <span class="ui-rcf__id">
            <span class="ui-rcf__name">${own ? "You" : r.reviewer.name}</span>
            ${r.reviewer.role || r.at
              ? html`<span class="ui-rcf__meta">${[own ? "" : r.reviewer.role, r.at]
                  .filter(Boolean)
                  .map((m, i) => html`${i ? " · " : ""}<span class="ui-rcf__meta-part">${m}</span>`)}</span>`
              : nothing}
          </span>
        </span>
        ${pickable ? html`<span class="ui-rcf__radio" aria-hidden="true"></span>` : nothing}
      </span>
      <span class="ui-rcf__verdict-line">
        <span class="ui-rcf__badge" data-tone=${r.tone ?? "neutral"}>${r.verdict}</span>
        ${outcome ? html`<span class="ui-rcf__outcome-tag" data-outcome=${outcome}>${outcome === "upheld" ? html`${checkIcon()}Upheld` : "Overruled"}</span>` : nothing}
      </span>
      <span class="ui-rcf__reason">${r.reason}</span>`;
    if (pickable) {
      return html`<label class="ui-rcf__verdict" data-pickable ?data-picked=${this.choice === r.id}>
        <input
          class="ui-rcf__input"
          type="radio"
          name=${`${this.uid}-pick`}
          value=${r.id}
          .checked=${live(this.choice === r.id)}
          aria-label=${`Uphold ${r.reviewer.name}: ${r.verdict}`}
          @change=${() => (this.choice = r.id)}
        />${body}
      </label>`;
    }
    return html`<div class="ui-rcf__verdict" data-outcome=${ifDefined(outcome)}>${body}</div>`;
  }

  private renderResolve() {
    const overriding = this.choice === "override";
    return html`<div class="ui-rcf__resolve">
      <label class="ui-rcf__override" ?data-picked=${overriding}>
        <input
          class="ui-rcf__input"
          type="radio"
          name=${`${this.uid}-pick`}
          value="override"
          .checked=${live(overriding)}
          @change=${() => (this.choice = "override")}
        /><span class="ui-rcf__radio" aria-hidden="true"></span>
        <span>Override both with your own verdict</span>
      </label>
      ${overriding
        ? html`<label class="ui-rcf__field-wrap">
            <span class="ui-rcf__field-label">Your verdict</span>
            <input class="ui-rcf__field" type="text" required .value=${live(this.ownVerdict)} @input=${(e: Event) => (this.ownVerdict = (e.target as HTMLInputElement).value)} />
          </label>`
        : nothing}
      <label class="ui-rcf__field-wrap">
        <span class="ui-rcf__field-label">Reason <span class="ui-rcf__req">required</span></span>
        <textarea
          class="ui-rcf__field ui-rcf__field--area"
          rows="2"
          required
          aria-describedby=${`${this.uid}-hint`}
          placeholder="Why this verdict stands"
          .value=${live(this.reason)}
          @input=${(e: Event) => (this.reason = (e.target as HTMLTextAreaElement).value)}
          @keydown=${this.onReasonKey}
        ></textarea>
      </label>
    </div>`;
  }

  private renderOutcome() {
    const res = this.resolution!;
    const picked = this.pair.find((r) => r.id === res.choice);
    const what = picked ? (this.blind ? `Upheld “${res.verdict}”` : `Upheld ${picked.reviewer.name}'s verdict`) : `Overridden: “${res.verdict}”`;
    const who = [res.by && !this.blind ? `by ${res.by}` : "", res.at].filter(Boolean).join(" · ");
    return html`<div class="ui-rcf__outcome" tabindex="-1">
      <span class="ui-rcf__outcome-icon" aria-hidden="true">${checkIcon()}</span>
      <div class="ui-rcf__outcome-text">
        <p class="ui-rcf__outcome-what">${what}${who ? html` <span class="ui-rcf__meta">${who}</span>` : nothing}</p>
        ${res.reason ? html`<p class="ui-rcf__outcome-why">${res.reason}</p>` : nothing}
      </div>
    </div>`;
  }

  protected override render() {
    const st = this.phase;
    const pair = this.pair;
    const pill =
      st === "resolved"
        ? html`<span class="ui-rcf__pill" data-tone="success">Resolved</span>`
        : html`<span class="ui-rcf__pill" data-tone="warning">${st === "blind" ? "Conflict" : "Unresolved"}</span>`;
    const head = cardHead({ icon: headIcon, title: this.heading, subtitle: this.scope || undefined, id: `${this.uid}-title`, aside: pill });
    const clean = this.resolvedLook === "clean";
    const pickable = st === "open" && this.resolvable;
    const diff = st === "blind" ? "" : this.differenceText();
    const verdicts = html`<div class="ui-rcf__pair" data-count=${pair.length}>
      ${pair.map((r) => this.renderVerdict(r))}
      ${pair.length === 2 ? html`<span class="ui-rcf__vs" aria-hidden="true">${notEqual()}</span>` : nothing}
    </div>`;
    const diffLine = diff && st !== "resolved" ? html`<p class="ui-rcf__diff"><span class="ui-rcf__diff-icon" aria-hidden="true">${diffIcon()}</span><span><b>The difference:</b> ${diff}</span></p>` : nothing;
    const missing = this.missing;
    const foot =
      pickable && pair.length
        ? html`<div class="ui-rcf__foot">
            <p class="ui-rcf__hint" id=${`${this.uid}-hint`}>${missing || "Your reason is kept with the resolution."}</p>
            <button type="button" class="ui-rcf__btn" ?disabled=${!!missing} @click=${this.confirm}>${this.confirmLabel}</button>
          </div>`
        : nothing;
    return html`${clean ? nothing : head}
      <div class="ui-rcf__card">
        ${clean ? head : nothing}
        <div class="ui-rcf__body">
          ${st === "blind"
            ? html`<p class="ui-rcf__blind" role="note">
                <span class="ui-rcf__blind-icon" aria-hidden="true">${lockIcon()}</span>
                <span><b>A conflict exists.</b> ${this.viewer && pair.some((r) => r.id === this.viewer)
                    ? "Another reviewer reached a different verdict. Who they are and what they decided stay hidden until it's resolved."
                    : "Two reviewers reached different verdicts. Who they are and what they decided stay hidden until it's resolved."}</span>
              </p>`
            : nothing}
          ${this.item ? html`<blockquote class="ui-rcf__item">${this.item}</blockquote>` : nothing}
          ${pickable
            ? html`<fieldset class="ui-rcf__group"><legend class="ui-rcf__legend">Uphold a verdict</legend>${verdicts}${diffLine}${this.renderResolve()}</fieldset>`
            : html`${verdicts}${diffLine}`}
          ${st === "resolved" ? this.renderOutcome() : nothing}
          ${st === "open" && !this.resolvable ? html`<p class="ui-rcf__hint ui-rcf__waiting">Waiting for someone to resolve it.</p>` : nothing}
        </div>
        ${clean ? foot : nothing}
      </div>
      ${clean ? nothing : foot}
      <span class="tc-sr-only" role="status">${this.announce}</span>`;
  }

  static override css = /* css */ `
[data-ui="rcf"] {
  box-sizing: border-box;
  container-type: inline-size;
  position: relative;
  width: 100%;
  max-width: 600px;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-snug);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="rcf"] { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
[data-ui="rcf"] *, [data-ui="rcf"] *::before, [data-ui="rcf"] *::after { box-sizing: border-box; }
:where([data-ui="rcf"]) :is(p, blockquote, fieldset) { margin: 0; padding: 0; border: 0; min-width: 0; }
[data-ui="rcf"] b { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
[data-ui="rcf"] svg { display: block; flex: none; }
.ui-rcf__legend { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; padding: 0; }
.ui-rcf__card { min-width: 0; overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-rcf__card { background: var(--tc-surface-raised); }
.ui-rcf__body { display: grid; gap: var(--tc-space-3); padding: var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-rcf__body { padding-top: var(--tc-space-1); }
.ui-rcf__pill { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; }
.ui-rcf__pill[data-tone="warning"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-rcf__pill[data-tone="success"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
/* What was reviewed */
.ui-rcf__item { padding-left: var(--tc-space-3) !important; border-left: 2px solid var(--tc-border-default) !important; color: var(--tc-text-primary); overflow-wrap: anywhere; }
/* The two verdicts, side by side, with ≠ between them */
.ui-rcf__group { display: grid; gap: var(--tc-space-3); }
.ui-rcf__pair { position: relative; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--tc-space-3); }
.ui-rcf__pair[data-count="1"] { grid-template-columns: minmax(0, 1fr); }
.ui-rcf__vs { position: absolute; top: 50%; left: 50%; display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); color: var(--tc-status-warning-fg); transform: translate(-50%, -50%); pointer-events: none; }
.ui-rcf__vs > svg { width: 14px; height: 14px; }
.ui-rcf__verdict { position: relative; display: flex; flex-direction: column; align-items: flex-start; gap: var(--tc-space-2); min-width: 0; padding: var(--tc-space-3); border-radius: var(--tc-radius-lg); background: var(--tc-surface-well); box-shadow: inset 0 0 0 1px var(--tc-border-subtle); transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-base) var(--tc-ease-standard); }
.ui-rcf__verdict[data-pickable] { cursor: pointer; }
.ui-rcf__verdict[data-pickable]:hover { box-shadow: inset 0 0 0 1px var(--tc-border-strong); }
.ui-rcf__verdict[data-picked] { background: var(--tc-surface-raised); box-shadow: inset 0 0 0 2px var(--tc-border-selected); }
.ui-rcf__verdict:has(.ui-rcf__input:focus-visible), .ui-rcf__override:has(.ui-rcf__input:focus-visible) { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
/* Overruled steps back without fading below contrast: no fill, a dashed edge, the verdict struck through */
.ui-rcf__verdict[data-outcome="overruled"] { background: none; box-shadow: none; outline: 1px dashed var(--tc-border-strong); outline-offset: -1px; }
.ui-rcf__verdict[data-outcome="overruled"] .ui-rcf__badge { text-decoration: line-through; }
.ui-rcf__verdict[data-outcome="upheld"] { background: var(--tc-surface-raised); box-shadow: inset 0 0 0 2px var(--tc-status-success-border); }
.ui-rcf__verdict[data-sealed] { justify-content: flex-start; background: repeating-linear-gradient(135deg, var(--tc-surface-well) 0 6px, var(--tc-fill-subtle) 6px 12px); }
.ui-rcf__input { position: absolute; width: 1px; height: 1px; margin: 0; opacity: 0; pointer-events: none; }
.ui-rcf__top { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--tc-space-2); width: 100%; min-width: 0; }
.ui-rcf__who { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; }
.ui-rcf__avatar { display: grid; flex: none; place-items: center; width: 28px; height: 28px; border-radius: 50%; background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); font-size: var(--tc-font-size-xs); font-weight: var(--tc-avatar-font-weight); color: var(--tc-text-secondary); }
.ui-rcf__avatar > svg { width: 14px; height: 14px; color: var(--tc-icon-muted); }
.ui-rcf__id { display: grid; min-width: 0; }
.ui-rcf__name { min-width: 0; color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); overflow-wrap: anywhere; }
.ui-rcf__meta-part { white-space: nowrap; }
.ui-rcf__verdict-line { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-1-5) var(--tc-space-2); width: 100%; }
.ui-rcf__meta { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); }
.ui-rcf__badge { display: inline-flex; align-items: center; max-width: 100%; min-height: var(--tc-pill-h-lg); padding: 0 var(--tc-pill-px-lg); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size-lg); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); overflow-wrap: anywhere; }
.ui-rcf__badge[data-tone="positive"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-rcf__badge[data-tone="negative"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-rcf__badge[data-tone="neutral"] { background: var(--tc-fill-default); color: var(--tc-text-primary); }
.ui-rcf__badge[data-tone="sealed"] { background: var(--tc-fill-default); color: var(--tc-text-muted); }
.ui-rcf__reason { color: var(--tc-text-secondary); overflow-wrap: anywhere; }
/* The radio: drawn, the real input is visually hidden but keeps the arrows and the name */
.ui-rcf__radio { position: relative; flex: none; width: 16px; height: 16px; margin-top: var(--tc-space-0-5); border-radius: 50%; background: var(--tc-surface-control); box-shadow: inset 0 0 0 1px var(--tc-border-control); transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
[data-picked] .ui-rcf__radio { box-shadow: inset 0 0 0 5px var(--tc-action-primary-bg); }
.ui-rcf__outcome-tag { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); }
.ui-rcf__outcome-tag[data-outcome="upheld"] { color: var(--tc-status-success-fg); }
.ui-rcf__outcome-tag > svg { width: 14px; height: 14px; }
/* The resolver's controls */
.ui-rcf__resolve { display: grid; gap: var(--tc-space-3); }
.ui-rcf__override { position: relative; display: flex; align-items: center; gap: var(--tc-space-2); min-height: var(--tc-control-h-md); padding: 0 var(--tc-space-3); border-radius: var(--tc-radius-lg); box-shadow: inset 0 0 0 1px var(--tc-border-subtle); color: var(--tc-text-primary); cursor: pointer; }
.ui-rcf__override:hover { box-shadow: inset 0 0 0 1px var(--tc-border-strong); }
.ui-rcf__override[data-picked] { box-shadow: inset 0 0 0 2px var(--tc-border-selected); }
.ui-rcf__override > .ui-rcf__radio { margin-top: 0; }
.ui-rcf__field-wrap { display: grid; gap: var(--tc-space-1-5); }
.ui-rcf__field-label { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
.ui-rcf__req { font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); }
.ui-rcf__field { display: block; width: 100%; height: var(--tc-field-h); margin: 0; padding: 0 var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font: inherit; font-size: var(--tc-field-font-size); color: var(--tc-text-primary); transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-rcf__field--area { height: auto; min-height: 64px; padding: var(--tc-space-2) var(--tc-field-px); line-height: var(--tc-line-height-snug); resize: vertical; }
.ui-rcf__field::placeholder { color: var(--tc-text-placeholder); }
.ui-rcf__field:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-rcf__field:focus { outline: none; box-shadow: var(--tc-field-shadow-focus); }
.ui-rcf__field:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
/* The difference, stated */
.ui-rcf__diff, .ui-rcf__blind { display: flex; align-items: flex-start; gap: var(--tc-space-2); }
.ui-rcf__diff-icon, .ui-rcf__blind-icon { display: grid; flex: none; place-items: center; width: 16px; height: 16px; margin-top: var(--tc-space-0-5); color: var(--tc-status-warning-fg); }
.ui-rcf__diff-icon > svg, .ui-rcf__blind-icon > svg { width: 16px; height: 16px; }
.ui-rcf__blind { padding: var(--tc-space-3); border-radius: var(--tc-radius-lg); background: var(--tc-status-warning-bg); color: var(--tc-text-primary); }
/* The outcome */
.ui-rcf__outcome { display: flex; align-items: flex-start; gap: var(--tc-space-2-5); padding: var(--tc-space-3); border-radius: var(--tc-radius-lg); background: var(--tc-status-success-bg); color: var(--tc-text-primary); animation: ui-rcf-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-rcf__outcome:focus { outline: none; }
.ui-rcf__outcome:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-rcf__outcome-icon { display: grid; flex: none; place-items: center; width: 16px; height: 16px; margin-top: var(--tc-space-0-5); color: var(--tc-status-success-fg); }
.ui-rcf__outcome-icon > svg { width: 16px; height: 16px; }
.ui-rcf__outcome-text { display: grid; gap: var(--tc-space-1); min-width: 0; }
.ui-rcf__outcome-what { font-weight: var(--tc-font-weight-medium); }
.ui-rcf__outcome-why { color: var(--tc-text-secondary); overflow-wrap: anywhere; }
/* The confirm row: on the tray (Standard), the card's last row (Clean) */
.ui-rcf__foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: var(--tc-space-2) var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-2) var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-rcf__foot { padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-rcf__hint { flex: 1 1 200px; min-width: 0; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-rcf__btn { display: inline-flex; align-items: center; justify-content: center; height: var(--tc-control-h-md); margin: 0; padding: 0 var(--tc-control-px-md); border: 0; border-radius: var(--tc-control-radius-md); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); font: inherit; font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; cursor: pointer; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-quick) var(--tc-ease-standard); }
.ui-rcf__btn:hover:not(:disabled) { background: var(--tc-action-primary-bg-hover); }
.ui-rcf__btn:active:not(:disabled) { transform: scale(0.98); }
.ui-rcf__btn:disabled { opacity: 0.4; cursor: not-allowed; }
.ui-rcf__btn:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
@container (max-width: 399px) {
  .ui-rcf__pair { grid-template-columns: minmax(0, 1fr); }
  .ui-rcf__vs { display: none; }
  .ui-rcf__body { padding: var(--tc-space-3-5); }
}
@keyframes ui-rcf-in { from { opacity: 0; transform: translateY(-2px); } }
@media (prefers-reduced-motion: reduce) {
  [data-ui="rcf"] *, [data-ui="rcf"] *::before, [data-ui="rcf"] *::after { animation: none !important; transition: none !important; }
}
@media (forced-colors: active) {
  .ui-rcf__verdict, .ui-rcf__override, .ui-rcf__badge, .ui-rcf__btn { border: 1px solid CanvasText; }
  [data-picked] { outline: 2px solid Highlight; }
  [data-picked] .ui-rcf__radio { background: Highlight; }
}
`;
}

if (!customElements.get("tc-review-conflict")) customElements.define("tc-review-conflict", TcReviewConflict);

declare global {
  interface HTMLElementTagNameMap {
    "tc-review-conflict": TcReviewConflict;
  }
}
