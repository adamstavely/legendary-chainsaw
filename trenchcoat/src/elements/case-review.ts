import { html, nothing, svg } from "lit";
import { property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { TcElement } from "./internal/base";
import "./agent-face";
import "./entity-timeline";
import "./fact-sheet";
import type { FactSection } from "./fact-sheet";
import type { TimelineCategory, TimelineEvent } from "./entity-timeline";

/*
 * <tc-case-review> – one case, ready for a person to decide: the evidence, what happened in order, the assistant's read,
 * and the decision. The assistant only suggests: its suggestion is labelled, nothing is chosen for you, and deciding needs
 * a written reason, which goes in the record. The block composes tc-fact-sheet and tc-entity-timeline, and tc-agent-face
 * with `assistant-face`. The decision sits beside the evidence on a wide page and below it on a narrow one.
 *
 *   <tc-case-review heading="Case 4812" .read=${{ summary: "…", suggestion: "escalate" }} .facts=${sections}></tc-case-review>
 */

export type CaseSeverity = "low" | "medium" | "high" | "critical";
export type CaseOption = { id: string; label: string; description?: string };
export type CaseRead = {
  summary: string;
  /** The key points behind it */
  points?: string[];
  /** The id of the option it would choose */
  suggestion?: string;
  /** How sure it is, in words: "Moderately confident" */
  confidence?: string;
};
export type CaseDecision = { option: string; note: string };
export type CaseDecisionChange = { decision: CaseDecision; option: CaseOption; followedSuggestion: boolean | null };

/** The block's words, every one renameable through `labels` */
export type CaseReviewLabels = {
  severity: Record<CaseSeverity, string>;
  /** {name} */
  readHeading: string;
  advisory: string;
  suggests: string;
  suggested: string;
  decision: string;
  note: string;
  notePlaceholder: string;
  submit: string;
  needsChoice: string;
  needsNote: string;
  decided: string;
  change: string;
};
export const defaultCaseReviewLabels: CaseReviewLabels = {
  severity: { low: "Low severity", medium: "Medium severity", high: "High severity", critical: "Critical severity" },
  readHeading: "{name}'s read",
  advisory: "A suggestion to weigh. The decision is yours.",
  suggests: "Suggests:",
  suggested: "Suggested",
  decision: "Your decision",
  note: "Reason",
  notePlaceholder: "This goes in the case record",
  submit: "Record decision",
  needsChoice: "Choose an outcome.",
  needsNote: "Add your reason.",
  decided: "Decided:",
  change: "Change",
};

/** The outcomes when `options` isn't set */
export const defaultCaseOptions: CaseOption[] = [
  { id: "approve", label: "Approve", description: "Nothing further is needed" },
  { id: "decline", label: "Decline", description: "Stop this and record why" },
  { id: "escalate", label: "Escalate", description: "Send it to a senior reviewer" },
];

const SPARK = svg`<path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2"></path>`;
const CHECK = svg`<path d="M20 6 9 17l-5-5"></path>`;
const icon = (shape: unknown) => html`<svg class="ui-csr__icon" viewBox="0 0 24 24" aria-hidden="true">${shape}</svg>`;
let instances = 0;

/**
 * One case ready for a person to decide: the evidence, the timeline, the assistant's suggestion and the decision.
 * @tag tc-case-review
 * @fires tc-decision-change - A decision was recorded ({ decision, option, followedSuggestion }: CaseDecisionChange); cancelable – prevented, `decision` stays as it was
 */
export class TcCaseReview extends TcElement {
  static override ui = "csr";

  /** The case's title */
  @property() accessor heading = "Case";
  /** Who or what it's about */
  @property() accessor subject: string | undefined = undefined;
  /** How serious it is, always shown in words */
  @property({ reflect: true }) accessor severity: CaseSeverity | undefined = undefined;
  /** The assistant's read of the case */
  @property({ attribute: false }) accessor read: CaseRead | undefined = undefined;
  /** The assistant's name */
  @property({ attribute: "assistant-name" }) accessor assistantName = "Assistant";
  /** Show the assistant's animated face */
  @property({ type: Boolean, attribute: "assistant-face" }) accessor assistantFace = false;
  /** The evidence */
  @property({ attribute: false }) accessor facts: FactSection[] = [];
  /** What happened */
  @property({ attribute: false }) accessor events: TimelineEvent[] = [];
  /** The timeline's categories */
  @property({ attribute: false }) accessor categories: TimelineCategory[] = [];
  /** The outcomes to choose from */
  @property({ attribute: false }) accessor options: CaseOption[] = defaultCaseOptions;
  /** The decision on record. Changed by the user unless a tc-decision-change listener calls preventDefault() */
  @property({ attribute: false }) accessor decision: CaseDecision | null = null;
  /** The locale for dates */
  @property() accessor locale: string | undefined = undefined;
  /** Rename any of the words */
  @property({ attribute: false }) accessor labels: Partial<CaseReviewLabels> = {};

  @state() private accessor choice = "";
  @state() private accessor note = "";
  @state() private accessor editing = false;
  @state() private accessor tried = false;
  @state() private accessor announce = "";
  private readonly uid = `tc-csr-${++instances}`;

  private get words(): CaseReviewLabels {
    return { ...defaultCaseReviewLabels, ...this.labels };
  }

  private optionName(id: string) {
    return this.options.find((o) => o.id === id)?.label ?? id;
  }

  private record() {
    const note = this.note.trim();
    const option = this.options.find((o) => o.id === this.choice);
    if (!option || !note) {
      this.tried = true;
      this.updateComplete.then(() => (this.querySelector<HTMLElement>(option ? ".ui-csr__note" : ".ui-csr__option input"))?.focus());
      return;
    }
    const decision = { option: option.id, note };
    const suggestion = this.read?.suggestion;
    if (!this.emit<CaseDecisionChange>("tc-decision-change", { decision, option, followedSuggestion: suggestion ? suggestion === option.id : null }, { cancelable: true })) return;
    this.decision = decision;
    this.editing = false;
    this.tried = false;
    this.announce = `${this.words.decided} ${option.label}`;
    this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-csr__change")?.focus());
  }

  private change() {
    this.choice = this.decision?.option ?? "";
    this.note = this.decision?.note ?? "";
    this.editing = true;
    this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-csr__option input:checked")?.focus());
  }

  private renderDecision() {
    const w = this.words;
    const { decision } = this;
    if (decision && !this.editing) {
      return html`<section class="ui-csr__panel ui-csr__done" aria-labelledby=${`${this.uid}-d`}>
        <h3 class="ui-csr__title" id=${`${this.uid}-d`}>${w.decision}</h3>
        <p class="ui-csr__outcome">${icon(CHECK)}<span>${w.decided} <b>${this.optionName(decision.option)}</b></span></p>
        <p class="ui-csr__reason">${decision.note}</p>
        <button type="button" class="tc-btn-sm ui-csr__change" @click=${this.change}>${w.change}</button>
      </section>`;
    }
    const missingChoice = this.tried && !this.choice;
    const missingNote = this.tried && !this.note.trim();
    const noteId = `${this.uid}-note`;
    return html`<section class="ui-csr__panel" aria-labelledby=${`${this.uid}-d`}>
      <h3 class="ui-csr__title" id=${`${this.uid}-d`}>${w.decision}</h3>
      <div class="ui-csr__options" role="radiogroup" aria-labelledby=${`${this.uid}-d`} aria-invalid=${missingChoice ? "true" : "false"}>
        ${this.options.map(
          (o) => html`<label class="ui-csr__option" ?data-on=${this.choice === o.id}>
            <input type="radio" name=${`${this.uid}-option`} value=${o.id} .checked=${live(this.choice === o.id)} @change=${() => (this.choice = o.id)} />
            <span class="ui-csr__option-text"
              ><span class="ui-csr__option-name">${o.label}${this.read?.suggestion === o.id ? html`<span class="ui-csr__tag">${w.suggested}</span>` : nothing}</span>${o.description ? html`<span class="ui-csr__option-about">${o.description}</span>` : nothing}</span
            >
          </label>`,
        )}
      </div>
      ${missingChoice ? html`<p class="ui-csr__error">${w.needsChoice}</p>` : nothing}
      <label class="ui-csr__label" for=${noteId}>${w.note}</label>
      <textarea
        id=${noteId}
        class="ui-csr__note"
        rows="3"
        placeholder=${w.notePlaceholder}
        aria-required="true"
        aria-invalid=${missingNote ? "true" : "false"}
        aria-describedby=${missingNote ? `${noteId}-error` : nothing}
        .value=${live(this.note)}
        @input=${(e: Event) => (this.note = (e.target as HTMLTextAreaElement).value)}
      ></textarea>
      ${missingNote ? html`<p class="ui-csr__error" id=${`${noteId}-error`}>${w.needsNote}</p>` : nothing}
      <button type="button" class="ui-csr__record" @click=${this.record}>${w.submit}</button>
    </section>`;
  }

  private renderRead() {
    const { read } = this;
    if (!read) return nothing;
    const w = this.words;
    const id = `${this.uid}-r`;
    return html`<section class="ui-csr__panel ui-csr__read" aria-labelledby=${id}>
      <div class="ui-csr__read-head">
        ${this.assistantFace ? html`<tc-agent-face size="40" state="idle" name=${this.assistantName}></tc-agent-face>` : html`<span class="ui-csr__spark">${icon(SPARK)}</span>`}
        <div>
          <h3 class="ui-csr__title" id=${id}>${w.readHeading.replace("{name}", this.assistantName)}</h3>
          <p class="ui-csr__advisory">${w.advisory}</p>
        </div>
      </div>
      <p class="ui-csr__summary">${read.summary}</p>
      ${read.points?.length ? html`<ul class="ui-csr__points">${read.points.map((p) => html`<li>${p}</li>`)}</ul>` : nothing}
      ${read.suggestion ? html`<p class="ui-csr__suggests">${w.suggests} <b>${this.optionName(read.suggestion)}</b>${read.confidence ? html` · ${read.confidence}` : nothing}</p>` : nothing}
    </section>`;
  }

  protected override render() {
    const w = this.words;
    return html`<header class="ui-csr__head">
        <div class="ui-csr__heading">
          <h2 class="ui-csr__name">${this.heading}</h2>
          ${this.subject ? html`<p class="ui-csr__subject">${this.subject}</p>` : nothing}
        </div>
        ${this.severity ? html`<span class="ui-csr__severity" data-severity=${this.severity}>${w.severity[this.severity]}</span>` : nothing}
      </header>
      <div class="ui-csr__grid">
        <div class="ui-csr__main">
          ${this.facts.length ? html`<tc-fact-sheet heading="Evidence" .sections=${this.facts}></tc-fact-sheet>` : nothing}
          ${this.events.length ? html`<tc-entity-timeline .events=${this.events} .categories=${this.categories} .locale=${this.locale}></tc-entity-timeline>` : nothing}
        </div>
        <div class="ui-csr__side">${this.renderRead()}${this.renderDecision()}</div>
      </div>
      <span class="tc-sr-only" role="status">${this.announce}</span>`;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="csr"],
:where([data-look="clean"], [data-look="clean"] *)[data-ui="csr"] {
  display: block; box-sizing: border-box; width: 100%; container-type: inline-size;
  font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
[data-ui="csr"] *, [data-ui="csr"] *::before, [data-ui="csr"] *::after { box-sizing: border-box; }
[data-ui="csr"] :where(p, h2, h3, ul) { margin: 0; }
.ui-csr__head { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: var(--tc-space-2) var(--tc-space-4); margin-bottom: var(--tc-space-4); }
.ui-csr__name { font-size: var(--tc-font-size-xl); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); overflow-wrap: anywhere; }
.ui-csr__subject { color: var(--tc-text-secondary); }
.ui-csr__severity { flex: none; padding: var(--tc-space-0-5) var(--tc-space-2); border-radius: var(--tc-radius-full); background: var(--tc-fill-hover); color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-csr__severity[data-severity="high"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-csr__severity[data-severity="critical"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-csr__grid { display: grid; grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); gap: var(--tc-space-4); align-items: start; }
.ui-csr__main, .ui-csr__side { display: grid; gap: var(--tc-space-4); min-width: 0; }
.ui-csr__panel { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-4); border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
.ui-csr__title { font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); }
.ui-csr__read-head { display: flex; align-items: center; gap: var(--tc-space-3); }
.ui-csr__spark { display: inline-flex; color: var(--tc-text-secondary); }
.ui-csr__icon { flex: none; width: var(--tc-icon-size-md, 16px); height: var(--tc-icon-size-md, 16px); fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ui-csr__advisory { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); }
.ui-csr__points { display: grid; gap: var(--tc-space-1); padding-inline-start: var(--tc-space-4); color: var(--tc-text-secondary); }
.ui-csr__suggests { padding-top: var(--tc-space-2); box-shadow: inset 0 var(--tc-hairline) var(--tc-border-subtle); color: var(--tc-text-secondary); }
.ui-csr__suggests b, .ui-csr__outcome b { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
.ui-csr__options { display: grid; gap: var(--tc-space-1); }
.ui-csr__option { display: flex; align-items: flex-start; gap: var(--tc-space-2); padding: var(--tc-space-2); border-radius: var(--tc-control-radius-md); cursor: pointer; }
.ui-csr__option:hover { background: var(--tc-fill-hover); }
.ui-csr__option[data-on] { background: var(--tc-fill-selected); }
.ui-csr__option input { flex: none; margin: var(--tc-space-0-5) 0 0; accent-color: var(--tc-action-primary-bg); }
.ui-csr__option input:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-csr__option-text { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-csr__option-name { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5); font-weight: var(--tc-font-weight-medium); }
.ui-csr__option-about { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); }
.ui-csr__tag { padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-full); background: var(--tc-fill-hover); color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-regular); }
.ui-csr__label { margin-top: var(--tc-space-1); color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-csr__note { width: 100%; padding: var(--tc-space-1-5) var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); color: var(--tc-text-primary); font: inherit; resize: vertical; }
.ui-csr__note:focus { outline: 0; box-shadow: var(--tc-field-shadow-focus); }
.ui-csr__note[aria-invalid="true"] { box-shadow: var(--tc-field-shadow-invalid); }
.ui-csr__note::placeholder { color: var(--tc-text-muted); }
.ui-csr__error { color: var(--tc-status-danger-fg); font-size: var(--tc-font-size-xs); }
.ui-csr__record { justify-self: end; height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border: 0; border-radius: var(--tc-control-radius-md); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); font: inherit; font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); cursor: pointer; }
.ui-csr__record:hover { background: var(--tc-action-primary-bg-hover); }
.ui-csr__record:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-csr__outcome { display: flex; align-items: center; gap: var(--tc-space-1-5); color: var(--tc-text-secondary); }
.ui-csr__outcome .ui-csr__icon { color: var(--tc-status-success-fg); }
.ui-csr__reason { color: var(--tc-text-secondary); overflow-wrap: anywhere; white-space: pre-wrap; }
.ui-csr__change { justify-self: start; }
@container (max-width: 720px) {
  .ui-csr__grid { grid-template-columns: minmax(0, 1fr); }
  .ui-csr__side { order: -1; }
}
`;
}

if (!customElements.get("tc-case-review")) customElements.define("tc-case-review", TcCaseReview);

declare global {
  interface HTMLElementTagNameMap {
    "tc-case-review": TcCaseReview;
  }
}
