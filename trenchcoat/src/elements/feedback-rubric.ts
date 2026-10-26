import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { TcElement } from "./internal/base";
import { FocusRescueController } from "./internal/controllers";
import { diffWords } from "./inline-diff";

/*
 * <tc-feedback-rubric> – rate an answer the useful way: a score per rubric criterion, what kind of failure it was,
 * and the answer it should have been – structured data for training and evals, not a thumb.
 *   · each criterion is a radio group on a segmented scale (1–5 by default, with a word for each level)
 *   · the failure types are toggles – hallucination, missing context, wrong tone… – a property, so an app can use
 *     its own list
 *   · "Write the ideal answer" opens a correction editor seeded with the answer; the change count follows the edit
 *     (Inline Diff's diffWords)
 *   · "What gets sent" shows the payload as JSON; Send fires tc-submit with all of it, after checking every
 *     required criterion has a score
 * Standard is a gray tray with the rubric on a white card; Clean is one white card with hairline dividers.
 *
 *   <tc-feedback-rubric .answer=${text} .meta=${{ messageId: "msg_81" }}></tc-feedback-rubric>
 *
 * The rating is `value` – every edit fires a cancelable tc-value-change ({ value }); preventDefault() keeps control.
 */

export type RubricLevel = {
  value: number;
  /** A word for the level – "Good"; read after the number */
  label: string;
};

export type RubricCriterion = {
  id: string;
  label: string;
  /** The question the criterion asks, in a line */
  description?: string;
  /** Its scale – defaults to the rubric's `levels` */
  levels?: RubricLevel[];
  /** Can be sent without a score */
  optional?: boolean;
};

export type FeedbackFailureType = {
  value: string;
  label: string;
  /** What it means, in a line – shown as the toggle's tooltip */
  description?: string;
};

/** The rating as the person leaves it */
export type FeedbackRating = {
  /** A score per criterion, by the criterion's id */
  scores: Record<string, number>;
  /** The failure types picked, by value */
  failures: string[];
  /** The answer it should have been, or null when none was written */
  correction: string | null;
};

export type FeedbackRubricValueChange = { value: FeedbackRating };
/** What tc-submit carries – and what "What gets sent" shows */
export type FeedbackRubricSubmit = FeedbackRating & {
  /** The answer that was rated */
  answer: string;
  /** Whatever the app set in `meta` – the message id, the model, the prompt version */
  meta?: Record<string, unknown>;
};

export const FEEDBACK_LEVELS: RubricLevel[] = [
  { value: 1, label: "Poor" },
  { value: 2, label: "Weak" },
  { value: 3, label: "Fair" },
  { value: 4, label: "Good" },
  { value: 5, label: "Excellent" },
];

export const FEEDBACK_CRITERIA: RubricCriterion[] = [
  { id: "accuracy", label: "Accuracy", description: "Is everything it says true?" },
  { id: "completeness", label: "Completeness", description: "Does it cover what was asked?" },
  { id: "tone", label: "Tone", description: "Does it sound right for the reader?" },
];

export const FEEDBACK_FAILURES: FeedbackFailureType[] = [
  { value: "hallucination", label: "Hallucination", description: "States something that isn't true or isn't in the sources" },
  { value: "missing-context", label: "Missing context", description: "Didn't use something it was given or should have known" },
  { value: "wrong-tone", label: "Wrong tone", description: "Too formal, too casual, or wrong for the reader" },
  { value: "incomplete", label: "Incomplete", description: "Left part of the question unanswered" },
  { value: "outdated", label: "Out of date", description: "Relies on something that is no longer true" },
  { value: "formatting", label: "Formatting", description: "Hard to read: structure, length or layout" },
  { value: "unsafe", label: "Unsafe", description: "Breaks a policy or could cause harm" },
];

const EMPTY: FeedbackRating = { scores: {}, failures: [], correction: null };
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/* ---------- Icons (Lucide, ISC – lucide.dev) ---------- */
const glyph = (d: TemplateResult, cls = "ui-fbr__glyph") => html`<svg class=${cls} viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const rubricMark = glyph(svg`<path d="M4 6h10M4 12h7M4 18h10"></path><path d="M16.5 10.5l2 2 3.5-4"></path>`, "ui-fbr__mark-svg");
const checkIcon = glyph(svg`<path d="M5 12.5l4.5 4.5L19 7.5"></path>`);
const chevron = glyph(svg`<path d="M9 6l6 6-6 6"></path>`, "ui-fbr__chev");
const pencil = glyph(svg`<path d="M4 20h4L19 9l-4-4L4 16v4z"></path><path d="M13.5 6.5l4 4"></path>`);

let instances = 0;

/**
 * Structured rating of an answer: rubric scores, the failure type and the ideal answer, sent as one payload.
 * @tag tc-feedback-rubric
 * @fires tc-value-change - A score, a failure type or the correction changed ({ value }: FeedbackRubricValueChange); cancelable
 * @fires tc-submit - Send was pressed with every required criterion scored (FeedbackRubricSubmit); cancelable – prevent it to stay editable
 * @fires tc-edit - "Edit rating" unlocked a sent rating; no detail
 */
export class TcFeedbackRubric extends TcElement {
  static override ui = "fbr";

  /** The heading */
  @property() accessor heading = "Rate this answer";
  /** The answer being rated – quoted at the top, and where the correction starts from */
  @property() accessor answer = "";
  /** The criteria, each scored on its own scale */
  @property({ attribute: false }) accessor criteria: RubricCriterion[] = FEEDBACK_CRITERIA;
  /** The default scale for criteria without their own `levels` */
  @property({ attribute: false }) accessor levels: RubricLevel[] = FEEDBACK_LEVELS;
  /** The kinds of failure a person can pick, any number of them */
  @property({ attribute: false }) accessor failureTypes: FeedbackFailureType[] = FEEDBACK_FAILURES;
  /** The rating. Changed by the user unless a tc-value-change listener calls preventDefault() */
  @property({ attribute: false }) accessor value: FeedbackRating = EMPTY;
  /** Sent along with the rating in tc-submit – ids and versions that tie it to the answer */
  @property({ attribute: false }) accessor meta: Record<string, unknown> | undefined = undefined;
  /** The rating was sent: the controls lock and "Edit rating" unlocks them. Set by Send; the app may set it too */
  @property({ type: Boolean, reflect: true }) accessor sent = false;
  /** Shows Send as busy while the app saves the rating */
  @property({ type: Boolean }) accessor sending = false;
  /** The label on the send button */
  @property({ attribute: "submit-label" }) accessor submitLabel = "Send rating";

  /** @internal Criteria that were missing a score when Send was pressed */
  @state() accessor missing: string[] = [];
  /** @internal The answer shown in full */
  @state() accessor expanded = false;
  /** @internal The answer is longer than its three folded lines */
  @state() accessor folds = false;
  /** @internal The payload preview is open */
  @state() accessor preview = false;
  /** @internal What the status region says */
  @state() accessor spoken = "";

  private readonly uid = `tc-fbr${++instances}`;
  private changeKey = "";
  private changes = 0;
  private ro?: ResizeObserver;

  constructor() {
    super();
    // Send and Edit swap places; focus never drops to <body>
    new FocusRescueController(this, () => this.querySelector<HTMLElement>(".ui-fbr__send, .ui-fbr__edit"));
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.ro?.disconnect();
    this.ro = undefined;
  }

  protected override updated() {
    // "Show all" only when the answer is longer than its folded lines – measured, so it follows the width
    const text = this.querySelector<HTMLElement>(".ui-fbr__quote-text");
    if (!text) {
      this.ro?.disconnect();
      this.ro = undefined;
      return;
    }
    const measure = () => {
      if (this.expanded) return;
      const folds = text.scrollHeight > text.clientHeight + 1;
      if (folds !== this.folds) this.folds = folds;
    };
    if (!this.ro && typeof ResizeObserver === "function") {
      this.ro = new ResizeObserver(measure);
      this.ro.observe(text);
    }
    measure();
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("answer")) this.expanded = false;
    // Sent by Send or by the app: the status region says so
    if (changed.has("sent") && changed.get("sent") !== undefined) this.spoken = this.sent ? "Rating sent" : "";
    if (changed.has("value") && this.missing.length) this.missing = this.missing.filter((id) => this.value.scores[id] === undefined);
  }

  /** The payload Send fires with tc-submit – the rating, the answer and `meta` */
  get payload(): FeedbackRubricSubmit {
    const v = this.value;
    return { scores: { ...v.scores }, failures: [...v.failures], correction: v.correction, answer: this.answer, ...(this.meta ? { meta: this.meta } : {}) };
  }

  /** @internal Applies an edit unless a listener prevents it */
  private change(patch: Partial<FeedbackRating>) {
    const value = { ...this.value, ...patch };
    if (this.emit<FeedbackRubricValueChange>("tc-value-change", { value }, { cancelable: true })) this.value = value;
  }

  /** @internal */
  private levelsOf(c: RubricCriterion) {
    return c.levels?.length ? c.levels : this.levels;
  }

  /** @internal */
  private score(c: RubricCriterion, value: number, focus = false) {
    if (this.value.scores[c.id] !== value) this.change({ scores: { ...this.value.scores, [c.id]: value } });
    if (focus) void this.updateComplete.then(() => this.querySelector<HTMLElement>(`#${this.uid}-${c.id} [data-value="${value}"]`)?.focus());
  }

  /** @internal APG radio group: arrows move and pick, wrapping; Home and End go to the ends */
  private onScaleKey(e: KeyboardEvent, c: RubricCriterion) {
    const levels = this.levelsOf(c);
    const current = this.value.scores[c.id];
    const at = levels.findIndex((l) => l.value === current);
    const step: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    let next: number;
    if (e.key in step) next = at < 0 ? (step[e.key] > 0 ? 0 : levels.length - 1) : (at + step[e.key] + levels.length) % levels.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = levels.length - 1;
    else return;
    e.preventDefault();
    this.score(c, levels[next].value, true);
  }

  /** @internal */
  private toggleFailure(value: string) {
    const failures = this.value.failures.includes(value) ? this.value.failures.filter((f) => f !== value) : [...this.value.failures, value];
    this.change({ failures });
  }

  /** @internal Checks the required criteria, then sends */
  private submit() {
    const missing = this.criteria.filter((c) => !c.optional && this.value.scores[c.id] === undefined).map((c) => c.id);
    this.missing = missing;
    if (missing.length) {
      this.spoken = `Score ${plural(missing.length, "more criterion", "more criteria")} before sending`;
      void this.updateComplete.then(() => this.querySelector<HTMLElement>(`#${this.uid}-${missing[0]} [role="radio"]`)?.focus());
      return;
    }
    if (!this.emit<FeedbackRubricSubmit>("tc-submit", this.payload, { cancelable: true })) return;
    this.sent = true;
    this.preview = false;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-fbr__edit")?.focus());
  }

  /** @internal */
  private edit() {
    this.sent = false;
    this.emit("tc-edit", null);
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-fbr__send")?.focus());
  }

  /** @internal One criterion: its name and question, then its scale */
  private criterion(c: RubricCriterion) {
    const levels = this.levelsOf(c);
    const current = this.value.scores[c.id];
    const picked = levels.find((l) => l.value === current);
    const id = `${this.uid}-${c.id}`;
    const missing = this.missing.includes(c.id);
    const tabStop = picked ? picked.value : levels[0]?.value;
    const described = [c.description ? `${id}-desc` : "", missing ? `${id}-err` : ""].filter(Boolean).join(" ");
    return html`<li class="ui-fbr__crit" ?data-missing=${missing}>
      <div class="ui-fbr__crit-text">
        <span class="ui-fbr__crit-label" id=${`${id}-label`}>${c.label}${c.optional ? html`<span class="ui-fbr__optional"> · optional</span>` : nothing}</span>
        ${c.description ? html`<span class="ui-fbr__crit-desc" id=${`${id}-desc`}>${c.description}</span>` : nothing}
        ${missing ? html`<span class="ui-fbr__error" id=${`${id}-err`}>Pick a score</span>` : nothing}
      </div>
      <div class="ui-fbr__crit-scale">
        <div
          class="ui-fbr__scale"
          id=${id}
          role="radiogroup"
          aria-labelledby=${`${id}-label`}
          aria-describedby=${ifDefined(described || undefined)}
          aria-required=${c.optional ? "false" : "true"}
          aria-invalid=${ifDefined(missing ? "true" : undefined)}
          @keydown=${(e: KeyboardEvent) => this.onScaleKey(e, c)}
        >
          ${levels.map(
            (l) => html`<button
              type="button"
              role="radio"
              class="ui-fbr__level"
              data-value=${l.value}
              aria-checked=${l.value === current ? "true" : "false"}
              tabindex=${l.value === tabStop ? 0 : -1}
              title=${l.label}
              @click=${() => this.score(c, l.value)}
            >${l.value}<span class="ui-fbr__sr">, ${l.label}</span></button>`,
          )}
        </div>
        <span class="ui-fbr__level-word" aria-hidden="true">${picked ? picked.label : "–"}</span>
      </div>
    </li>`;
  }

  /** @internal The correction: a button to start one, or the editor */
  private correction() {
    const c = this.value.correction;
    const id = `${this.uid}-fix`;
    if (c === null)
      return html`<div class="ui-fbr__section ui-fbr__fix">
        <span class="ui-fbr__label">The ideal answer</span>
        <button type="button" class="ui-fbr__start" @click=${() => {
          this.change({ correction: this.answer });
          void this.updateComplete.then(() => this.querySelector<HTMLTextAreaElement>(".ui-fbr__field")?.focus());
        }}>${pencil}Write the answer it should have been</button>
      </div>`;
    const key = `${this.answer}\u0000${c}`;
    if (key !== this.changeKey) {
      this.changeKey = key;
      this.changes = diffWords(this.answer, c).filter((s) => s.type === "change").length;
    }
    return html`<div class="ui-fbr__section ui-fbr__fix">
      <label class="ui-fbr__label" for=${id}>The ideal answer</label>
      <textarea
        class="ui-fbr__field"
        id=${id}
        rows="5"
        aria-describedby=${`${id}-note`}
        .value=${live(c)}
        @input=${(e: InputEvent) => this.change({ correction: (e.target as HTMLTextAreaElement).value })}
      ></textarea>
      <div class="ui-fbr__fix-foot">
        <span class="ui-fbr__note" id=${`${id}-note`}>${this.changes ? `${plural(this.changes, "change")} to the answer` : "Edit the answer into the one it should have been"}</span>
        ${this.answer && c !== this.answer ? html`<button type="button" class="ui-fbr__link" @click=${() => this.change({ correction: this.answer })}>Start over</button>` : nothing}
        <button
          type="button"
          class="ui-fbr__link"
          @click=${() => {
            this.change({ correction: null });
            void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-fbr__start")?.focus());
          }}
        >Remove</button>
      </div>
    </div>`;
  }

  protected override render() {
    const v = this.value;
    const titleId = `${this.uid}-title`;
    const failId = `${this.uid}-fail`;
    const scored = this.criteria.filter((c) => v.scores[c.id] !== undefined).length;
    const sent = this.sent;
    return html`
      <div class="ui-fbr__bar">
        <span class="ui-fbr__mark">${rubricMark}</span>
        <span class="ui-fbr__title" id=${titleId}>${this.heading}</span>
        <span class="ui-fbr__progress">${scored} of ${this.criteria.length} scored</span>
      </div>
      <div class="ui-fbr__card" role="group" aria-labelledby=${titleId}>
        ${this.answer
          ? html`<figure class="ui-fbr__answer" ?data-expanded=${this.expanded}>
              <figcaption class="ui-fbr__label">The answer</figcaption>
              <blockquote class="ui-fbr__quote" id=${`${this.uid}-answer`}><span class="ui-fbr__quote-text">${this.answer}</span></blockquote>
              ${this.folds || this.expanded
                ? html`<button type="button" class="ui-fbr__link" aria-expanded=${this.expanded ? "true" : "false"} aria-controls=${`${this.uid}-answer`} @click=${() => (this.expanded = !this.expanded)}>
                    ${this.expanded ? "Show less" : "Show all"}
                  </button>`
                : nothing}
            </figure>`
          : nothing}
        <fieldset class="ui-fbr__body" ?disabled=${sent}>
          <ol class="ui-fbr__crits" aria-label="Criteria">${this.criteria.map((c) => this.criterion(c))}</ol>
          ${this.failureTypes.length
            ? html`<div class="ui-fbr__section">
                <span class="ui-fbr__label" id=${failId}>What went wrong<span class="ui-fbr__optional"> · optional</span></span>
                <div class="ui-fbr__chips" role="group" aria-labelledby=${failId}>
                  ${this.failureTypes.map(
                    (f) => html`<button type="button" class="ui-fbr__chip" aria-pressed=${v.failures.includes(f.value) ? "true" : "false"} title=${ifDefined(f.description)} @click=${() => this.toggleFailure(f.value)}>
                      ${f.label}
                    </button>`,
                  )}
                </div>
              </div>`
            : nothing}
          ${this.correction()}
        </fieldset>
        <div class="ui-fbr__foot">
          ${sent
            ? html`<span class="ui-fbr__sent">${checkIcon}Rating sent</span>
                <button type="button" class="ui-fbr__edit" @click=${() => this.edit()}>Edit rating</button>`
            : html`<button type="button" class="ui-fbr__toggle" aria-expanded=${this.preview ? "true" : "false"} aria-controls=${`${this.uid}-json`} @click=${() => (this.preview = !this.preview)}>
                  ${chevron}What gets sent
                </button>
                <button type="button" class="ui-fbr__send" aria-busy=${ifDefined(this.sending ? "true" : undefined)} aria-disabled=${ifDefined(this.sending ? "true" : undefined)} @click=${() => !this.sending && this.submit()}>
                  ${this.sending ? "Sending…" : this.submitLabel}
                </button>`}
        </div>
        ${this.preview && !sent ? html`<pre class="ui-fbr__json" id=${`${this.uid}-json`} tabindex="0" aria-label="What gets sent, as JSON">${JSON.stringify(this.payload, null, 2)}</pre>` : nothing}
      </div>
      <span class="ui-fbr__sr" role="status">${this.spoken}</span>
    `;
  }

  static override css = /* css */ `
/* Colours and sizes as variables – override them on [data-ui="fbr"] */
[data-ui="fbr"] {
  --tc-feedback-rubric-scale-w: 196px;
  position: relative;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  letter-spacing: -0.006em;
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
  container: ui-fbr / inline-size;
}
/* Clean: no tray – one white card with hairline dividers */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="fbr"] {
  padding: 0;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  letter-spacing: normal;
}
[data-ui="fbr"] *, [data-ui="fbr"] *::before, [data-ui="fbr"] *::after { box-sizing: border-box; }
[data-ui="fbr"] svg { display: block; flex: none; }
[data-ui="fbr"] :is(p, ol, figure, blockquote, pre) { margin: 0; }
:where([data-ui="fbr"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; letter-spacing: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="fbr"] :is(button, pre):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="fbr"] button:disabled { cursor: default; }
.ui-fbr__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-fbr__glyph { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *) .ui-fbr__glyph { stroke-width: 1.6; }
/* ----- The header on the tray ----- */
.ui-fbr__bar { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; padding: var(--tc-space-1-5) var(--tc-space-1) var(--tc-space-2) var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-fbr__bar { padding: var(--tc-space-3) var(--tc-space-3-5) var(--tc-space-3) var(--tc-space-4); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-fbr__mark { display: grid; flex: none; place-items: center; width: 16px; color: var(--tc-accent-text); }
.ui-fbr__mark-svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-fbr__mark-svg { stroke-width: 1.4; }
.ui-fbr__title { flex: 1; min-width: 0; overflow: hidden; font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-strong); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-fbr__title { font-weight: var(--tc-font-weight-medium); }
.ui-fbr__progress { flex: none; color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
/* ----- The card ----- */
.ui-fbr__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-fbr__card { border-radius: 0 0 var(--tc-card-radius) var(--tc-card-radius); background: none; box-shadow: none; }
.ui-fbr__label { display: block; margin-bottom: var(--tc-space-1-5); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-fbr__label { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-fbr__optional { font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); text-transform: none; letter-spacing: normal; }
/* The answer, quoted in a well; long ones fold to three lines */
.ui-fbr__answer { padding: var(--tc-space-3) var(--tc-space-4); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-fbr__quote { padding: var(--tc-space-2) var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-surface-well); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-relaxed); color: var(--tc-text-secondary); white-space: pre-line; overflow-wrap: anywhere; }
.ui-fbr__quote-text { display: -webkit-box; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 3; }
.ui-fbr__answer[data-expanded] .ui-fbr__quote-text { display: block; }
.ui-fbr__answer .ui-fbr__link { margin-top: var(--tc-space-1-5); }
.ui-fbr__body { min-width: 0; margin: 0; padding: 0; border: 0; }
/* ----- Criteria: the name and question on the left, the scale on the right ----- */
.ui-fbr__crits { padding: var(--tc-space-1) 0; list-style: none; border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-fbr__crit { display: flex; align-items: center; gap: var(--tc-space-2) var(--tc-space-4); padding: var(--tc-space-2-5) var(--tc-space-4); }
.ui-fbr__crit + .ui-fbr__crit { border-top: var(--tc-hairline) solid var(--tc-border-subtle); }
.ui-fbr__crit-text { display: grid; flex: 1; gap: var(--tc-space-0-5); min-width: 0; }
.ui-fbr__crit-label { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-fbr__crit-desc { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
.ui-fbr__error { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-status-danger-fg); }
.ui-fbr__crit-scale { display: flex; flex: none; align-items: center; gap: var(--tc-space-2); }
/* The scale: the segmented track, each level a radio; the picked one is the raised thumb */
.ui-fbr__scale { display: grid; grid-auto-columns: minmax(0, 1fr); grid-auto-flow: column; width: var(--tc-feedback-rubric-scale-w); padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
.ui-fbr__crit[data-missing] .ui-fbr__scale { box-shadow: inset 0 0 0 1px var(--tc-status-danger-solid); }
.ui-fbr__level { display: grid; place-items: center; height: calc(var(--tc-control-h-sm) - 2 * var(--tc-seg-pad)); border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
[data-ui="fbr"] .ui-fbr__level:hover:not(:disabled) { color: var(--tc-text-primary); }
[data-ui="fbr"] .ui-fbr__level[aria-checked="true"] { background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow); color: var(--tc-text-primary); }
.ui-fbr__level-word { width: 64px; overflow: hidden; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
/* ----- Failure types and the correction ----- */
.ui-fbr__section { padding: var(--tc-space-3) var(--tc-space-4); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-fbr__chips { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); }
/* The reasons look of Message Actions: gray chips; a picked one tinted, with a ring */
.ui-fbr__chip { height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-fill-default); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-fbr__chip { background: none; box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); font-weight: var(--tc-font-weight-medium); }
[data-ui="fbr"] .ui-fbr__chip:hover:not(:disabled) { background: var(--tc-fill-strong); color: var(--tc-text-primary); }
[data-ui="fbr"] .ui-fbr__chip[aria-pressed="true"] { background: var(--tc-fill-selected); box-shadow: inset 0 0 0 1px var(--tc-border-selected); color: var(--tc-accent-text); }
.ui-fbr__start { display: inline-flex; align-items: center; gap: var(--tc-space-2); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
[data-ui="fbr"] .ui-fbr__start:hover:not(:disabled) { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-fbr__field { display: block; width: 100%; min-height: 96px; padding: var(--tc-space-2) var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font: inherit; font-size: var(--tc-field-font-size); line-height: var(--tc-line-height-relaxed); color: var(--tc-text-primary); resize: vertical; outline: none; field-sizing: content; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-fbr__field:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-fbr__field:focus { box-shadow: var(--tc-field-shadow-focus); }
.ui-fbr__field:disabled { color: var(--tc-text-secondary); box-shadow: var(--tc-field-shadow); }
.ui-fbr__fix-foot { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-3); margin-top: var(--tc-space-1-5); }
.ui-fbr__note { flex: 1; min-width: 0; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-fbr__link { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-accent-text); }
[data-ui="fbr"] .ui-fbr__link:hover:not(:disabled) { text-decoration: underline; text-underline-offset: 2px; }
/* ----- The foot: what gets sent, and Send ----- */
.ui-fbr__foot { display: flex; align-items: center; gap: var(--tc-space-2); min-height: calc(var(--tc-control-h-md) + 2 * var(--tc-space-3)); padding: var(--tc-space-3) var(--tc-space-4); }
.ui-fbr__toggle { display: inline-flex; align-items: center; gap: var(--tc-space-1); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
[data-ui="fbr"] .ui-fbr__toggle:hover { color: var(--tc-text-primary); }
.ui-fbr__chev { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; transition: transform var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-fbr__toggle[aria-expanded="true"] .ui-fbr__chev { transform: rotate(90deg); }
.ui-fbr__send, .ui-fbr__edit { display: inline-flex; align-items: center; justify-content: center; height: var(--tc-control-h-md); margin-left: auto; padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-fbr__send { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
[data-ui="fbr"] .ui-fbr__send:hover { background: var(--tc-action-primary-bg-hover); }
.ui-fbr__send[aria-busy="true"] { cursor: progress; background: var(--tc-action-primary-bg-active); }
.ui-fbr__edit { background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); }
[data-ui="fbr"] .ui-fbr__edit:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-fbr__sent { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); font-weight: var(--tc-font-weight-medium); color: var(--tc-status-success-fg); }
.ui-fbr__json { max-height: 220px; overflow: auto; padding: var(--tc-space-3) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); background: var(--tc-surface-well); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-relaxed); color: var(--tc-text-secondary); white-space: pre-wrap; overflow-wrap: anywhere; }
/* Sent: the rating locks – what wasn't picked steps back, and the correction's actions go */
.ui-fbr__body:disabled :is(.ui-fbr__level:not([aria-checked="true"]), .ui-fbr__chip:not([aria-pressed="true"])) { opacity: 0.45; }
.ui-fbr__body:disabled .ui-fbr__link { display: none; }
/* Narrow: the scale goes under its criterion, full width */
@container ui-fbr (max-width: 480px) {
  .ui-fbr__crit { flex-direction: column; align-items: stretch; }
  .ui-fbr__crit-scale { width: 100%; }
  .ui-fbr__scale { flex: 1; width: auto; }
  .ui-fbr__progress { display: none; }
}
@media (pointer: coarse) {
  .ui-fbr__level { height: 32px; }
  .ui-fbr__chip { height: 36px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="fbr"] *, [data-ui="fbr"] *::before, [data-ui="fbr"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-feedback-rubric")) customElements.define("tc-feedback-rubric", TcFeedbackRubric);

declare global {
  interface HTMLElementTagNameMap {
    "tc-feedback-rubric": TcFeedbackRubric;
  }
}
