import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController } from "./internal/controllers";

/*
 * <tc-correction-propagation> – a correction's reach. A claim was corrected; these are the other artifacts and the
 * released packages that cite it. Each one waits for a person: Review it, Mark it superseded, or Dismiss it when it
 * doesn't rely on the claim after all. Nothing is rewritten automatically – the element only records the decision
 * and tells the app, which does the work.
 *
 *   <tc-correction-propagation claim="Credits are capped at 15%" correction="Credits are capped at 10%"
 *     .candidates=${[{ id: "a", title: "Risk memo", detail: "§2 cites it" }]}></tc-correction-propagation>
 *
 * The card shows the correction (the old wording struck through, the new one, the reason), how many items are
 * handled, then the released packages and the artifacts, each with its state: pending, reviewed, superseded or
 * dismissed. `states` is a value with a cancelable `tc-states-change`; the three actions also fire `tc-review`,
 * `tc-supersede` and `tc-dismiss`, so the app can open the item, issue a superseding notice, or log the dismissal.
 * Undo puts an item back to pending.
 */

/** Waves going out: a correction's reach */
const reachIcon = svg`<path d="M16.247 7.761a6 6 0 0 1 0 8.478"></path><path d="M19.075 4.933a10 10 0 0 1 0 14.134"></path><path d="M4.925 19.067a10 10 0 0 1 0-14.134"></path><path d="M7.753 16.239a6 6 0 0 1 0-8.478"></path><circle cx="12" cy="12" r="2"></circle>`;

export type CorrectionState = "pending" | "reviewed" | "superseded" | "dismissed";
export type CorrectionCandidateKind = "artifact" | "package";

export type CorrectionCandidate = {
  id: string;
  /** What it is – e.g. "Board summary, slide 3" */
  title: string;
  /** "package" for something already released to others (it can't be changed, only superseded); "artifact" (default)
   *  for a working document */
  kind?: CorrectionCandidateKind;
  /** One quieter line – where it cites the claim, who owns it */
  detail?: string;
  /** The passage that cites the corrected claim */
  quote?: string;
  /** The released version – e.g. "v2.1" */
  version?: string;
  /** Its icon, an element that's cloned; unset shows a document or a package */
  icon?: Element;
  /** The state it starts in, when `states` doesn't name it */
  state?: CorrectionState;
};

/** Details of the events */
export type CorrectionStatesChange = { states: Record<string, CorrectionState>; id: string; state: CorrectionState; candidate: CorrectionCandidate };
export type CorrectionAction = { id: string; candidate: CorrectionCandidate };

const STATE_TEXT: Record<CorrectionState, string> = { pending: "Pending", reviewed: "Reviewed", superseded: "Superseded", dismissed: "Dismissed" };
const DONE_TEXT: Record<Exclude<CorrectionState, "pending">, string> = { reviewed: "Marked reviewed", superseded: "Marked superseded", dismissed: "Dismissed" };

/* ---------- Icons ---------- */

/** Ripples out from a point – the title mark (drawn for Trenchcoat) */
/* radio, file-text, package, check, undo-2, x: Lucide (ISC, lucide.dev) */
const docIcon = html`<svg class="ui-cpr__glyph" viewBox="0 0 24 24" aria-hidden="true">${svg`<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 13H8M16 17H8"></path>`}</svg>`;
const packageIcon = html`<svg class="ui-cpr__glyph" viewBox="0 0 24 24" aria-hidden="true">${svg`<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"></path><path d="M12 22V12"></path><path d="m3.3 7 8.7 5 8.7-5"></path>`}</svg>`;
const checkIcon = html`<svg class="ui-cpr__glyph" viewBox="0 0 24 24" aria-hidden="true">${svg`<path d="M20 6 9 17l-5-5"></path>`}</svg>`;
const undoIcon = html`<svg class="ui-cpr__glyph" viewBox="0 0 24 24" aria-hidden="true">${svg`<path d="M9 14 4 9l5-5"></path><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11"></path>`}</svg>`;
const xIcon = html`<svg class="ui-cpr__glyph" viewBox="0 0 24 24" aria-hidden="true">${svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`}</svg>`;
/** A struck-through tag – superseded */
const supersedeIcon = html`<svg class="ui-cpr__glyph" viewBox="0 0 24 24" aria-hidden="true">${svg`<rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="M3 19 21 5"></path>`}</svg>`;

let instances = 0;

/**
 * How far a correction reaches: every artifact and released package that cites the corrected claim, each sent for
 * review – nothing rewritten automatically.
 * @tag tc-correction-propagation
 * @fires tc-states-change - An item's state changed ({ states, id, state, candidate }: CorrectionStatesChange – states is the whole new map); cancelable – prevent it to keep `states` as it is (controlled use)
 * @fires tc-review - Review was pressed on an item ({ id, candidate }: CorrectionAction) – open it for a person to check
 * @fires tc-supersede - Mark superseded was pressed on an item ({ id, candidate }: CorrectionAction)
 * @fires tc-dismiss - Dismiss was pressed on an item – it doesn't rely on the claim ({ id, candidate }: CorrectionAction)
 */
export class TcCorrectionPropagation extends TcElement {
  static override ui = "cpr";

  /** The heading, and the component's name */
  @property() accessor heading = "Correction reach";
  /** The claim as it was, before the correction */
  @property() accessor claim = "";
  /** The claim as corrected */
  @property() accessor correction = "";
  /** Why it was corrected */
  @property() accessor reason = "";
  /** Who corrected it and when, as one line – e.g. "Dana Okafor · today, 10:42" */
  @property() accessor meta = "";
  /** The artifacts and released packages that cite the corrected claim */
  @property({ attribute: false }) accessor candidates: CorrectionCandidate[] = [];
  /** Each item's state by id; an item not named here uses its own `state`, else "pending". Changed by the user unless a
   *  tc-states-change listener calls preventDefault() */
  @property({ attribute: false }) accessor states: Record<string, CorrectionState> = {};
  /** The line under the list – what the component won't do */
  @property() accessor note = "Nothing is changed automatically – each item waits for a person.";
  /** Shown when nothing cites the claim */
  @property({ attribute: "empty-text" }) accessor emptyText = "Nothing else cites this claim.";

  /** @internal What the last action did, for screen readers */
  @state() accessor said = "";

  private readonly uid = `tc-cpr${++instances}`;
  /** After an action, focus moves to the row's next control – the old one is gone */
  private focusRow: string | null = null;

  constructor() {
    super();
    new FocusRescueController(this, () => this.querySelector<HTMLElement>(".ui-cpr__btn"));
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
  }

  /* ---------- State ---------- */

  /** @internal An item's state: from `states`, else its own, else pending */
  stateOf(c: CorrectionCandidate): CorrectionState {
    return this.states[c.id] ?? c.state ?? "pending";
  }

  private setState(c: CorrectionCandidate, next: CorrectionState) {
    const states = { ...this.states, [c.id]: next };
    if (!this.emit<CorrectionStatesChange>("tc-states-change", { states, id: c.id, state: next, candidate: c }, { cancelable: true })) return false;
    this.states = states;
    return true;
  }

  private act(c: CorrectionCandidate, next: Exclude<CorrectionState, "pending">) {
    this.emit<CorrectionAction>(next === "reviewed" ? "tc-review" : next === "superseded" ? "tc-supersede" : "tc-dismiss", { id: c.id, candidate: c });
    if (!this.setState(c, next)) return;
    this.focusRow = this.contains(document.activeElement) ? c.id : null;
    const left = this.candidates.filter((x) => (x.id === c.id ? next : this.stateOf(x)) === "pending").length;
    this.say(`${DONE_TEXT[next]}: ${c.title}. ${left ? `${left} still pending` : "Every item is handled"}.`);
  }

  private undo(c: CorrectionCandidate) {
    if (!this.setState(c, "pending")) return;
    this.focusRow = this.contains(document.activeElement) ? c.id : null;
    this.say(`Back to pending: ${c.title}.`);
  }

  /** A trailing space makes a repeated message count as new for screen readers */
  private say(text: string) {
    this.said = this.said === text ? `${text} ` : text;
  }

  protected override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (!this.hasAttribute("aria-label") && !this.hasAttribute("aria-labelledby")) this.setAttribute("aria-labelledby", `${this.uid}-title`);
    if (this.focusRow) {
      const row = this.querySelector(`.ui-cpr__row[data-id="${CSS.escape(this.focusRow)}"]`);
      this.focusRow = null;
      row?.querySelector<HTMLElement>(".ui-cpr__btn")?.focus();
    }
  }

  /* ---------- Render ---------- */

  private renderRow(c: CorrectionCandidate) {
    const st = this.stateOf(c);
    const pkg = c.kind === "package";
    const titleId = `${this.uid}-${c.id}`;
    return html`<li class="ui-cpr__row" data-id=${c.id} data-state=${st} data-kind=${pkg ? "package" : "artifact"}>
      <span class="ui-cpr__icon" aria-hidden="true">${c.icon ? c.icon.cloneNode(true) : pkg ? packageIcon : docIcon}</span>
      <div class="ui-cpr__main">
        <span class="ui-cpr__name">
          <span class="ui-cpr__item-title" id=${titleId}>${c.title}</span>
          ${pkg ? html`<span class="ui-cpr__tag">Released${c.version ? ` ${c.version}` : ""}</span>` : nothing}
        </span>
        ${c.detail ? html`<span class="ui-cpr__detail">${c.detail}</span>` : nothing}
        ${c.quote ? html`<q class="ui-cpr__quote">${c.quote}</q>` : nothing}
      </div>
      <div class="ui-cpr__end">
        ${st === "pending"
          ? html`<button type="button" class="ui-cpr__btn" data-kind="review" aria-describedby=${titleId} @click=${() => this.act(c, "reviewed")}>${checkIcon}<span>Review</span></button>
              <button type="button" class="ui-cpr__btn" data-kind="supersede" aria-describedby=${titleId} @click=${() => this.act(c, "superseded")}>${supersedeIcon}<span>Mark superseded</span></button>
`
          : html`<span class="ui-cpr__state" data-state=${st}>${st === "reviewed" ? checkIcon : st === "superseded" ? supersedeIcon : xIcon}${STATE_TEXT[st]}</span>
              <button type="button" class="ui-cpr__btn" data-kind="undo" aria-label=${`Undo: ${STATE_TEXT[st].toLowerCase()} – ${c.title}`} @click=${() => this.undo(c)}>${undoIcon}<span>Undo</span></button>`}
      </div>
      ${st === "pending"
        ? html`<button type="button" class="ui-cpr__btn" data-kind="dismiss" aria-label=${`Dismiss: ${c.title} – it doesn't rely on the claim`} title="Dismiss – it doesn't rely on the claim" @click=${() => this.act(c, "dismissed")}>${xIcon}</button>`
        : nothing}
    </li>`;
  }

  private renderGroup(kind: CorrectionCandidateKind, list: CorrectionCandidate[]) {
    if (!list.length) return nothing;
    const id = `${this.uid}-${kind}`;
    return html`<section class="ui-cpr__group" aria-labelledby=${id}>
      <h4 class="ui-cpr__caption" id=${id}>${kind === "package" ? "Released packages" : "Artifacts"} · ${list.length}</h4>
      <ul class="ui-cpr__list">${repeat(list, (c) => c.id, (c) => this.renderRow(c))}</ul>
    </section>`;
  }

  protected override render() {
    const list = this.candidates;
    const counts: Record<CorrectionState, number> = { pending: 0, reviewed: 0, superseded: 0, dismissed: 0 };
    for (const c of list) counts[this.stateOf(c)]++;
    const total = list.length;
    const handled = total - counts.pending;
    const packages = list.filter((c) => c.kind === "package");
    const artifacts = list.filter((c) => c.kind !== "package");
    const titleId = `${this.uid}-title`;
    const share = (n: number) => `${total ? (n / total) * 100 : 0}%`;
    const clean = this.resolvedLook === "clean";
    const head = cardHead({
      icon: reachIcon,
      title: this.heading,
      id: titleId,
      aside: html`<span class="ui-cpr__sum">
        <span><b>${total}</b> ${total === 1 ? "cites it" : "cite it"}</span>
        ${packages.length ? html`<span><b>${packages.length}</b> released</span>` : nothing}
      </span>`,
    });
    // Standard: the header on the tray above the card; Clean: the card's first row
    return html`
      ${clean ? nothing : head}
      <div class="ui-cpr__card">
        ${clean ? head : nothing}
        ${this.claim || this.correction
          ? html`<div class="ui-cpr__fix">
              <h4 class="ui-cpr__caption">Corrected claim</h4>
              ${this.claim ? html`<p class="ui-cpr__before"><span class="ui-cpr__sr">Was: </span><del>${this.claim}</del></p>` : nothing}
              ${this.correction ? html`<p class="ui-cpr__after"><span class="ui-cpr__sr">Now: </span>${this.correction}</p>` : nothing}
              ${this.reason || this.meta
                ? html`<p class="ui-cpr__why">${this.reason}${this.reason && this.meta ? html`<span class="ui-cpr__dot" aria-hidden="true">·</span>` : nothing}${this.meta ? html`<span class="ui-cpr__meta">${this.meta}</span>` : nothing}</p>`
                : nothing}
            </div>`
          : nothing}
        ${total
          ? html`<div class="ui-cpr__progress">
                <div class="ui-cpr__progress-text"><span><b>${handled}</b> of ${total} handled</span>${counts.pending ? html`<span class="ui-cpr__pending">${counts.pending} pending</span>` : html`<span class="ui-cpr__all">All handled</span>`}</div>
                <div class="ui-cpr__meter" role="progressbar" aria-label="Handled" aria-valuemin="0" aria-valuemax=${total} aria-valuenow=${handled} aria-valuetext=${`${handled} of ${total} handled`}>
                  ${(["reviewed", "superseded", "dismissed"] as const).map((s) => (counts[s] ? html`<span class="ui-cpr__seg" data-state=${s} style=${styleMap({ width: share(counts[s]) })}></span>` : nothing))}
                </div>
              </div>
              ${this.renderGroup("package", packages)}${this.renderGroup("artifact", artifacts)}`
          : html`<p class="ui-cpr__empty">${this.emptyText}</p>`}
        ${this.note ? html`<p class="ui-cpr__note">${this.note}</p>` : nothing}
      </div>
      <span class="ui-cpr__sr" role="status">${this.said}</span>
    `;
  }

  static override css = /* css */ `
/* Colours and sizes as variables – override them on [data-ui="cpr"] */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="cpr"] {
  --tc-correction-propagation-tray-bg: var(--tc-surface-tray);
  --tc-correction-propagation-panel-bg: var(--tc-surface-on-tray);
  --tc-correction-propagation-tile-bg: var(--tc-surface-control);
  position: relative;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-correction-propagation-tray-bg);
  container: ui-cpr / inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-lg);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="cpr"] {
  --tc-correction-propagation-panel-bg: var(--tc-surface-raised);
  --tc-correction-propagation-tile-bg: var(--tc-surface-control);
  position: relative;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  container: ui-cpr / inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="cpr"] *, [data-ui="cpr"] *::before, [data-ui="cpr"] *::after { box-sizing: border-box; }
:where([data-ui="cpr"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; letter-spacing: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-ui="cpr"]) :is(h4, p, ul) { margin: 0; padding: 0; }
:where([data-ui="cpr"]) ul { list-style: none; }
[data-ui="cpr"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="cpr"] svg { display: block; flex: none; }
.ui-cpr__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-cpr__glyph { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="standard"], [data-look="standard"] *).ui-cpr__glyph { stroke-width: 1.8; }
:where([data-look="clean"], [data-look="clean"] *).ui-cpr__glyph { stroke-width: 1.4; }
/* ----- The header (cardHead): how many cite the claim at its right ----- */
.ui-cpr__sum { display: flex; align-items: center; gap: var(--tc-space-3-5); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-cpr__sum { font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-snug); }
:where([data-look="clean"], [data-look="clean"] *).ui-cpr__sum { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
.ui-cpr__sum b { color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-cpr__sum b { font-weight: var(--tc-font-weight-semibold); }
:where([data-look="clean"], [data-look="clean"] *).ui-cpr__sum b { font-weight: var(--tc-font-weight-medium); }
/* ----- The white card ----- */
.ui-cpr__card { display: grid; overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-correction-propagation-panel-bg); box-shadow: var(--tc-card-shadow); }
.ui-cpr__caption { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
/* The correction: the old wording struck through, the new one, why */
.ui-cpr__fix { display: grid; gap: var(--tc-space-1); padding: var(--tc-space-4) var(--tc-space-4) var(--tc-space-3-5); }
.ui-cpr__fix .ui-cpr__caption { margin-bottom: var(--tc-space-0-5); }
/* Clean: right under the header row */
:where([data-look="clean"], [data-look="clean"] *).ui-cpr__card > .tc-head + .ui-cpr__fix { padding-top: var(--tc-space-1); }
.ui-cpr__before { color: var(--tc-text-muted); overflow-wrap: anywhere; }
.ui-cpr__before del { text-decoration-color: var(--tc-status-danger-solid); text-decoration-thickness: 1px; }
.ui-cpr__after { color: var(--tc-text-strong); overflow-wrap: anywhere; }
:where([data-look="standard"], [data-look="standard"] *).ui-cpr__after { font-weight: var(--tc-font-weight-medium); }
:where([data-look="clean"], [data-look="clean"] *).ui-cpr__after { font-weight: var(--tc-font-weight-medium); }
.ui-cpr__after::before { content: ""; display: inline-block; width: 6px; height: 6px; margin-right: var(--tc-space-2); border-radius: 50%; background: var(--tc-status-success-solid); vertical-align: 2px; }
.ui-cpr__why { margin-top: var(--tc-space-1); color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-cpr__dot { margin: 0 var(--tc-space-1-5); color: var(--tc-text-disabled); }
.ui-cpr__meta { white-space: nowrap; }
/* How many are handled: a meter split by state */
.ui-cpr__progress { display: grid; gap: var(--tc-space-1-5); padding: var(--tc-space-3) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-cpr__progress-text { display: flex; justify-content: space-between; gap: var(--tc-space-3); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); font-variant-numeric: tabular-nums; }
.ui-cpr__progress-text b { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-semibold); }
.ui-cpr__pending { color: var(--tc-status-warning-fg); }
.ui-cpr__all { color: var(--tc-status-success-fg); }
.ui-cpr__meter { display: flex; height: var(--tc-meter-h); overflow: hidden; border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); }
.ui-cpr__seg { height: 100%; transition: width var(--tc-duration-slow) var(--tc-ease-move); }
.ui-cpr__seg[data-state="reviewed"] { background: var(--tc-status-success-solid); }
.ui-cpr__seg[data-state="superseded"] { background: var(--tc-status-warning-solid); }
.ui-cpr__seg[data-state="dismissed"] { background: var(--tc-text-disabled); }
.ui-cpr__seg + .ui-cpr__seg { box-shadow: inset 1px 0 0 var(--tc-correction-propagation-panel-bg); }
/* ----- The items, grouped ----- */
.ui-cpr__group { display: grid; gap: var(--tc-space-1); padding: var(--tc-space-3) var(--tc-space-1-5) var(--tc-space-1-5); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-cpr__group > .ui-cpr__caption { padding: 0 var(--tc-space-2-5); }
.ui-cpr__list { display: grid; }
.ui-cpr__row { position: relative; display: grid; grid-template-columns: 32px minmax(0, 1fr) auto auto; grid-template-areas: "icon main end dismiss"; align-items: center; column-gap: var(--tc-space-3); padding: var(--tc-space-2-5); transition: background-color var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-cpr__row { border-radius: var(--tc-radius-lg); }
:where([data-look="clean"], [data-look="clean"] *).ui-cpr__row { grid-template-columns: 28px minmax(0, 1fr) auto auto; border-radius: var(--tc-radius-sm); }
.ui-cpr__row:hover { background: var(--tc-fill-subtle); }
.ui-cpr__row + .ui-cpr__row::before { content: ""; position: absolute; top: 0; right: var(--tc-space-3); left: var(--tc-space-14); height: var(--tc-hairline); background: var(--tc-divider); }
.ui-cpr__icon { grid-area: icon; display: grid; align-self: start; place-items: center; background: var(--tc-correction-propagation-tile-bg); box-shadow: var(--tc-shadow-raised); color: var(--tc-text-muted); transition: opacity var(--tc-duration-slow) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-cpr__icon { width: 32px; height: 32px; border-radius: var(--tc-radius-md); }
:where([data-look="clean"], [data-look="clean"] *).ui-cpr__icon { width: 28px; height: 28px; border-radius: var(--tc-radius-sm); }
.ui-cpr__icon > svg { width: 16px; height: 16px; }
.ui-cpr__row[data-kind="package"] .ui-cpr__icon { color: var(--tc-tone-violet-fg); }
.ui-cpr__main { grid-area: main; display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-cpr__name { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-2); min-width: 0; }
.ui-cpr__item-title { min-width: 0; color: var(--tc-text-primary); overflow-wrap: anywhere; transition: color var(--tc-duration-slow) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-cpr__item-title { font-weight: var(--tc-font-weight-semibold); }
:where([data-look="clean"], [data-look="clean"] *).ui-cpr__item-title { font-weight: var(--tc-font-weight-medium); }
.ui-cpr__tag { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-tone-violet-bg); color: var(--tc-tone-violet-fg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; }
.ui-cpr__detail { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); overflow-wrap: anywhere; }
.ui-cpr__quote { display: -webkit-box; margin-top: var(--tc-space-1); padding-left: var(--tc-space-2-5); overflow: hidden; border-left: 2px solid var(--tc-border-strong); color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
/* Handled: the row steps back, its state takes the place of the actions */
.ui-cpr__row:not([data-state="pending"]) :is(.ui-cpr__item-title) { color: var(--tc-text-secondary); }
.ui-cpr__row:not([data-state="pending"]) .ui-cpr__icon { opacity: 0.6; }
.ui-cpr__row[data-state="superseded"] .ui-cpr__item-title { text-decoration: line-through; text-decoration-color: var(--tc-text-disabled); }
.ui-cpr__end { grid-area: end; display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: var(--tc-space-1-5); }
/* Actions: Button's secondary recipe, small (Standard); ghost (Clean) */
.ui-cpr__btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); animation: ui-cpr-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-cpr__btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-cpr__btn[data-kind="dismiss"] { grid-area: dismiss; width: var(--tc-control-h-sm); margin-left: var(--tc-space-1-5); padding: 0; color: var(--tc-icon-muted); }
.ui-cpr__btn[data-kind="dismiss"] { background: none; box-shadow: none; }
.ui-cpr__btn[data-kind="dismiss"]:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-cpr__btn[data-kind="undo"] { color: var(--tc-text-secondary); }
.ui-cpr__btn[data-kind="undo"] { background: none; box-shadow: none; }
.ui-cpr__btn[data-kind="undo"]:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-cpr__btn .ui-cpr__glyph { width: 13px; height: 13px; }
.ui-cpr__state { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h-lg); padding: 0 var(--tc-pill-px-lg); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size-lg); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; animation: ui-cpr-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-cpr__state .ui-cpr__glyph { width: 12px; height: 12px; }
.ui-cpr__state[data-state="reviewed"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-cpr__state[data-state="superseded"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-cpr__state[data-state="dismissed"] { background: var(--tc-fill-default); color: var(--tc-text-secondary); }
.ui-cpr__empty { padding: var(--tc-space-6) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); text-align: center; }
.ui-cpr__note { padding: var(--tc-space-3) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
@keyframes ui-cpr-in { from { opacity: 0; transform: translateY(2px); } }
@media (forced-colors: active) {
  .ui-cpr__btn, .ui-cpr__state { border: 1px solid ButtonText; }
  .ui-cpr__meter { border: 1px solid CanvasText; }
  .ui-cpr__seg { background: Highlight; }
}
/* Touch screens: bigger targets */
@media (pointer: coarse) {
  .ui-cpr__btn { height: var(--tc-control-h-md); }
  .ui-cpr__btn[data-kind="dismiss"] { width: var(--tc-control-h-md); }
}
/* Narrow: the actions move under the text */
@container ui-cpr (max-width: 520px) {
  .ui-cpr__row { grid-template-columns: 28px minmax(0, 1fr) auto; grid-template-areas: "icon main dismiss" ". end end"; row-gap: var(--tc-space-2); column-gap: var(--tc-space-2-5); padding: var(--tc-space-2-5) var(--tc-space-2); }
  :where([data-look="clean"], [data-look="clean"] *).ui-cpr__row { grid-template-columns: 28px minmax(0, 1fr) auto; }
  .ui-cpr__end { justify-content: flex-start; }
  .ui-cpr__btn[data-kind="dismiss"] { align-self: start; margin-left: 0; }
  :where([data-look="standard"], [data-look="standard"] *).ui-cpr__icon { width: 28px; height: 28px; }
  .ui-cpr__row + .ui-cpr__row::before { left: var(--tc-space-12); }
  .ui-cpr__fix, .ui-cpr__progress, .ui-cpr__note { padding-inline: var(--tc-space-3-5); }
  .ui-cpr__sum { flex-basis: 100%; margin-left: 0; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="cpr"] *, [data-ui="cpr"] *::before, [data-ui="cpr"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-correction-propagation")) customElements.define("tc-correction-propagation", TcCorrectionPropagation);

declare global {
  interface HTMLElementTagNameMap {
    "tc-correction-propagation": TcCorrectionPropagation;
  }
}
