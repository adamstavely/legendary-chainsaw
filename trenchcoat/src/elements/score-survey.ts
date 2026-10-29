import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController } from "./internal/controllers";

/*
 * <tc-score-survey> – the one question a person answers: how likely they are to recommend you (NPS, 0–10) or how
 * satisfied they are (CSAT, 1–5).
 *   · NPS is a row of eleven numbers, the ends labelled in words, the three bands (Detractor 0–6, Passive 7–8,
 *     Promoter 9–10) shown quietly under them; narrow, the row wraps to 0–5 and 6–10
 *   · CSAT is five faces, each with its word – never colour alone
 *   · the scale is a radio group: arrows move and pick, Home and End go to the ends, and the number keys pick
 *     directly ("1" then "0" is 10)
 *   · after a pick, an optional follow-up question (`followUp`, or one per band or score in `followUps`) with Submit
 *     and Skip; then a thank-you with "Change answer"
 * Standard is a gray tray with the header on it and the question on a white card; Clean is one white card, the
 * header its first row.
 *
 *   <tc-score-survey kind="nps" question="How likely are you to recommend Riverside Library?"></tc-score-survey>
 *
 * The answer is `score` – a pick fires a cancelable tc-score-change ({ score }); preventDefault() keeps control.
 */

export type ScoreSurveyKind = "nps" | "csat";
export type NpsBand = "detractor" | "passive" | "promoter";

export type ScoreSurveyLabels = {
  /** Under 0 on the NPS scale */
  low: string;
  /** Under 10 on the NPS scale */
  high: string;
  detractor: string;
  passive: string;
  promoter: string;
  /** The five CSAT words, from 1 to 5 */
  csat: [string, string, string, string, string];
  submit: string;
  skip: string;
  thanks: string;
  change: string;
  dismiss: string;
  /** The textarea's placeholder */
  placeholder: string;
};

/** Follow-up questions by NPS band, or by CSAT score ("1"–"5") */
export type ScoreSurveyFollowUps = Partial<Record<NpsBand | "1" | "2" | "3" | "4" | "5", string>>;

export type ScoreSurveyScoreChange = { score: number | null };
export type ScoreSurveySubmit = {
  score: number;
  /** What the person wrote in the follow-up – "" when skipped or not asked */
  comment: string;
  kind: ScoreSurveyKind;
};

export const defaultScoreSurveyLabels: ScoreSurveyLabels = {
  low: "Not at all likely",
  high: "Extremely likely",
  detractor: "Detractor",
  passive: "Passive",
  promoter: "Promoter",
  csat: ["Very dissatisfied", "Dissatisfied", "Neutral", "Satisfied", "Very satisfied"],
  submit: "Submit",
  skip: "Skip",
  thanks: "Thanks for your feedback",
  change: "Change answer",
  dismiss: "Dismiss",
  placeholder: "Optional",
};

const QUESTIONS: Record<ScoreSurveyKind, string> = {
  nps: "How likely are you to recommend us to a friend or colleague?",
  csat: "How satisfied are you with your experience?",
};

/** The NPS band a score from 0 to 10 falls in */
export const npsBand = (score: number): NpsBand => (score >= 9 ? "promoter" : score >= 7 ? "passive" : "detractor");

/* ---------- Icons (Lucide, ISC – lucide.dev) ---------- */
const glyph = (d: TemplateResult, cls = "ui-ssv__glyph") => html`<svg class=${cls} viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
/** A speech bubble with a star: feedback */
const surveyMark = svg`<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12z"></path><path d="M12 8.5l1.1 2.2 2.4.3-1.8 1.6.5 2.4-2.2-1.2-2.2 1.2.5-2.4-1.8-1.6 2.4-.3z"></path>`;
const checkIcon = glyph(svg`<path d="M5 12.5l4.5 4.5L19 7.5"></path>`);
const closeIcon = glyph(svg`<path d="M6 6l12 12M18 6L6 18"></path>`);
/** The five faces, from a deep frown to a wide smile */
const MOUTHS = ["M8 17c1.2-2 6.8-2 8 0", "M8.5 16.2c1.5-1.2 5.5-1.2 7 0", "M8.5 15.5h7", "M8.5 14.8c1.5 1.2 5.5 1.2 7 0", "M8 14c1.2 2.4 6.8 2.4 8 0"];
const face = (i: number) =>
  glyph(svg`<circle cx="12" cy="12" r="9"></circle><path d="M9 9.5v.5M15 9.5v.5"></path><path d=${MOUTHS[i]}></path>`, "ui-ssv__face");

let instances = 0;

/**
 * The NPS or CSAT question a person answers, with an optional follow-up and a thank-you.
 * @tag tc-score-survey
 * @fires tc-score-change - A score was picked ({ score }: ScoreSurveyScoreChange); cancelable – prevented, `score` stays as it was
 * @fires tc-submit - Submit or Skip was pressed (ScoreSurveySubmit); cancelable – prevent it to stay on the question
 * @fires tc-edit - "Change answer" reopened a submitted answer; detail: null
 * @fires tc-dismiss - The dismiss button was pressed; remove the survey; detail: null
 */
export class TcScoreSurvey extends TcElement {
  static override ui = "ssv";

  /** The heading */
  @property() accessor heading = "Your feedback";
  /** "nps" for 0–10 likelihood to recommend, "csat" for 1–5 satisfaction */
  @property() accessor kind: ScoreSurveyKind = "nps";
  /** The question; defaults to the standard wording for the kind */
  @property() accessor question = "";
  /** The answer. Changed by the user unless a tc-score-change listener calls preventDefault() */
  @property({ type: Number }) accessor score: number | null = null;
  /** The follow-up question asked after a pick; "" asks none */
  @property({ attribute: "follow-up" }) accessor followUp = "";
  /** Follow-up questions by NPS band or CSAT score, ahead of `followUp` */
  @property({ attribute: false }) accessor followUps: ScoreSurveyFollowUps = {};
  /** Words the page can rename, merged over `defaultScoreSurveyLabels` */
  @property({ attribute: false }) accessor labels: Partial<ScoreSurveyLabels> = {};
  /** Hides the NPS band names under the scale */
  @property({ type: Boolean, attribute: "hide-bands" }) accessor hideBands = false;
  /** Shows a dismiss button in the header, which fires tc-dismiss */
  @property({ type: Boolean }) accessor dismissible = false;
  /** The answer was submitted: the thank-you shows. Set by Submit and Skip; the app may set it too */
  @property({ type: Boolean, reflect: true }) accessor submitted = false;
  /** Shows Submit as busy while the app saves the answer */
  @property({ type: Boolean }) accessor submitting = false;

  /** @internal The follow-up answer */
  @state() accessor comment = "";
  /** @internal What the status region says */
  @state() accessor spoken = "";

  private readonly uid = `tc-ssv${++instances}`;
  /** @internal The last digit key, for "1" then "0" */
  private lastDigit: { key: string; at: number } | null = null;

  constructor() {
    super();
    // The question and the thank-you swap places; focus never drops to <body>
    new FocusRescueController(this, () => this.querySelector<HTMLElement>(".ui-ssv__change, [role='radio'][tabindex='0']"));
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("submitted") && changed.get("submitted") !== undefined) this.spoken = this.submitted ? this.l.thanks : "";
  }

  /** @internal */
  private get l(): ScoreSurveyLabels {
    return { ...defaultScoreSurveyLabels, ...this.labels };
  }

  /** The scores on the scale, lowest first */
  get values(): number[] {
    return this.kind === "csat" ? [1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  }

  /** The follow-up question for the current score, or "" */
  get followUpQuestion(): string {
    const s = this.score;
    if (s === null) return "";
    const by = this.kind === "nps" ? this.followUps[npsBand(s)] : this.followUps[String(s) as "1"];
    return by ?? this.followUp;
  }

  /** @internal The word for a score – its CSAT word, or the NPS end label */
  private word(v: number) {
    const l = this.l;
    if (this.kind === "csat") return l.csat[v - 1] ?? String(v);
    return v === 0 ? l.low : v === 10 ? l.high : "";
  }

  /** @internal */
  private pick(v: number, focus = false) {
    if (v !== this.score && this.emit<ScoreSurveyScoreChange>("tc-score-change", { score: v }, { cancelable: true })) this.score = v;
    if (focus) void this.updateComplete.then(() => this.querySelector<HTMLElement>(`#${this.uid}-scale [data-value="${this.score ?? v}"]`)?.focus());
  }

  /** @internal APG radio group plus the number keys */
  private onKey = (e: KeyboardEvent) => {
    if (e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
    const values = this.values;
    const at = this.score === null ? -1 : values.indexOf(this.score);
    const step: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (e.key in step) {
      e.preventDefault();
      const next = at < 0 ? (step[e.key] > 0 ? 0 : values.length - 1) : (at + step[e.key] + values.length) % values.length;
      this.pick(values[next], true);
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      this.pick(values[e.key === "Home" ? 0 : values.length - 1], true);
    } else if (/^[0-9]$/.test(e.key)) {
      // "1" then "0" in quick succession is 10 – read from the events' own times, not a clock
      const ten = this.kind === "nps" && e.key === "0" && this.lastDigit?.key === "1" && e.timeStamp - this.lastDigit.at < 800;
      const v = ten ? 10 : Number(e.key);
      this.lastDigit = { key: e.key, at: e.timeStamp };
      if (!values.includes(v)) return;
      e.preventDefault();
      this.pick(v, true);
    }
  };

  /** @internal */
  private submit(skip: boolean) {
    if (this.score === null || this.submitting) return;
    // Only what was asked goes out: a comment typed for an earlier score, under a question that's gone, doesn't
    const comment = skip || !this.followUpQuestion ? "" : this.comment.trim();
    if (!this.emit<ScoreSurveySubmit>("tc-submit", { score: this.score, comment, kind: this.kind }, { cancelable: true })) return;
    this.submitted = true;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-ssv__change")?.focus());
  }

  /** @internal */
  private change() {
    this.submitted = false;
    this.emit("tc-edit", null);
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`#${this.uid}-scale [tabindex="0"]`)?.focus());
  }

  /** @internal One NPS number or CSAT face */
  private option(v: number, tabStop: number) {
    const csat = this.kind === "csat";
    const word = this.word(v);
    const band = csat ? undefined : npsBand(v);
    return html`<button
      type="button"
      role="radio"
      class="ui-ssv__opt"
      data-value=${v}
      data-band=${ifDefined(band)}
      aria-checked=${v === this.score ? "true" : "false"}
      tabindex=${v === tabStop ? 0 : -1}
      @click=${() => this.pick(v)}
    >${csat
      ? html`${face(v - 1)}<span class="ui-ssv__word">${word}</span>`
      : html`<span class="ui-ssv__num">${v}</span>${word ? html`<span class="ui-ssv__sr">, ${word}</span>` : nothing}`}</button>`;
  }

  /** @internal The NPS band names, under the scale */
  private bands() {
    if (this.kind !== "nps" || this.hideBands) return nothing;
    const l = this.l;
    return html`<div class="ui-ssv__bands" aria-hidden="true">
      <span class="ui-ssv__band" data-band="detractor"><span class="ui-ssv__band-range">0–6</span> ${l.detractor}</span>
      <span class="ui-ssv__band" data-band="passive"><span class="ui-ssv__band-range">7–8</span> ${l.passive}</span>
      <span class="ui-ssv__band" data-band="promoter"><span class="ui-ssv__band-range">9–10</span> ${l.promoter}</span>
    </div>`;
  }

  /** @internal The question, the scale, then the follow-up and Submit once something is picked */
  private ask() {
    const l = this.l;
    const values = this.values;
    const tabStop = this.score !== null && values.includes(this.score) ? this.score : values[0];
    const qId = `${this.uid}-q`;
    const follow = this.followUpQuestion;
    const fId = `${this.uid}-follow`;
    return html`<div class="ui-ssv__body">
      <p class="ui-ssv__question" id=${qId}>${this.question || QUESTIONS[this.kind]}</p>
      <div class="ui-ssv__scale" data-kind=${this.kind} id=${`${this.uid}-scale`} role="radiogroup" aria-labelledby=${qId} aria-describedby=${`${this.uid}-keys`} @keydown=${this.onKey}>
        ${values.map((v) => this.option(v, tabStop))}
      </div>
      ${this.kind === "nps"
        ? html`<div class="ui-ssv__ends" aria-hidden="true"><span>${l.low}</span><span>${l.high}</span></div>${this.bands()}`
        : nothing}
      <span class="ui-ssv__sr" id=${`${this.uid}-keys`}>${this.kind === "nps" ? "Arrow keys or the number keys pick a score" : "Arrow keys pick an answer"}</span>
      ${this.score !== null
        ? html`<div class="ui-ssv__more">
            ${follow
              ? html`<label class="ui-ssv__label" for=${fId}>${follow}</label>
                  <textarea
                    class="ui-ssv__field"
                    id=${fId}
                    rows="3"
                    placeholder=${l.placeholder}
                    .value=${live(this.comment)}
                    @input=${(e: InputEvent) => (this.comment = (e.target as HTMLTextAreaElement).value)}
                  ></textarea>`
              : nothing}
            <div class="ui-ssv__actions">
              ${follow ? html`<button type="button" class="ui-ssv__skip" @click=${() => this.submit(true)}>${l.skip}</button>` : nothing}
              <button
                type="button"
                class="ui-ssv__submit"
                aria-busy=${ifDefined(this.submitting ? "true" : undefined)}
                aria-disabled=${ifDefined(this.submitting ? "true" : undefined)}
                @click=${() => this.submit(false)}
              >${this.submitting ? "Sending…" : l.submit}</button>
            </div>
          </div>`
        : nothing}
    </div>`;
  }

  /** @internal After submitting */
  private thanks() {
    const l = this.l;
    const s = this.score;
    const answer = s === null ? "" : this.kind === "csat" ? (this.word(s) ?? String(s)) : `${s} out of 10`;
    return html`<div class="ui-ssv__done">
      <span class="ui-ssv__check">${checkIcon}</span>
      <div class="ui-ssv__done-text">
        <span class="ui-ssv__thanks">${l.thanks}</span>
        ${answer ? html`<span class="ui-ssv__answer">You answered ${answer}</span>` : nothing}
      </div>
      <button type="button" class="ui-ssv__change" @click=${() => this.change()}>${l.change}</button>
    </div>`;
  }

  protected override render() {
    const titleId = `${this.uid}-title`;
    const l = this.l;
    return html`
      ${cardHead({
        icon: surveyMark,
        title: this.heading,
        id: titleId,
        keepAside: this.dismissible,
        aside: this.dismissible
          ? html`<button type="button" class="ui-ssv__dismiss" @click=${() => this.emit("tc-dismiss", null)}>${closeIcon}<span class="ui-ssv__sr">${l.dismiss}</span></button>`
          : undefined,
      })}
      <div class="ui-ssv__card" role="group" aria-labelledby=${titleId}>${this.submitted ? this.thanks() : this.ask()}</div>
      <span class="ui-ssv__sr" role="status">${this.spoken}</span>
    `;
  }

  static override css = /* css */ `
/* Colours and sizes as variables – override them on [data-ui="ssv"] */
[data-ui="ssv"] {
  --tc-ssv-opt-h: var(--tc-control-h-lg);
  --tc-ssv-band-detractor: var(--tc-status-danger-solid);
  --tc-ssv-band-passive: var(--tc-chart-neutral);
  --tc-ssv-band-promoter: var(--tc-status-success-solid);
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
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
  container: ui-ssv / inline-size;
}
/* Clean: no tray – one white card, the header its first row */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ssv"] {
  padding: 0;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
}
[data-ui="ssv"] *, [data-ui="ssv"] *::before, [data-ui="ssv"] *::after { box-sizing: border-box; }
[data-ui="ssv"] svg { display: block; flex: none; }
[data-ui="ssv"] p { margin: 0; }
:where([data-ui="ssv"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; letter-spacing: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="ssv"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-ssv__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-ssv__glyph { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *) .ui-ssv__glyph { stroke-width: 1.6; }
/* ----- The header's dismiss button ----- */
.ui-ssv__dismiss { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
[data-ui="ssv"] .ui-ssv__dismiss:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
/* ----- The card ----- */
.ui-ssv__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-ssv__card { border-top: var(--tc-hairline) solid var(--tc-divider); border-radius: 0 0 var(--tc-card-radius) var(--tc-card-radius); background: none; box-shadow: none; }
.ui-ssv__body { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-4); }
.ui-ssv__question { font-size: var(--tc-font-size-lg-plus); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-relaxed); color: var(--tc-text-primary); text-wrap: pretty; }
/* ----- The scale: eleven numbers, or five faces ----- */
.ui-ssv__scale { display: grid; grid-template-columns: repeat(11, minmax(0, 1fr)); gap: var(--tc-space-1); margin-top: var(--tc-space-1); }
.ui-ssv__scale[data-kind="csat"] { grid-template-columns: repeat(5, minmax(0, 1fr)); gap: var(--tc-space-2); }
.ui-ssv__opt { position: relative; display: grid; place-items: center; min-width: 0; height: var(--tc-ssv-opt-h); border-radius: var(--tc-control-radius-md); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
[data-ui="ssv"] .ui-ssv__opt:hover { box-shadow: var(--tc-action-secondary-shadow-hover); color: var(--tc-text-primary); }
/* Picked: the selected fill with its ring, and the number in accent – never the fill alone */
[data-ui="ssv"] .ui-ssv__opt[aria-checked="true"] { background: var(--tc-fill-selected); box-shadow: inset 0 0 0 1px var(--tc-border-selected); color: var(--tc-accent-text); font-weight: var(--tc-font-weight-semibold); }
.ui-ssv__scale[data-kind="csat"] .ui-ssv__opt { gap: var(--tc-space-1); height: auto; min-height: 76px; padding: var(--tc-space-2) var(--tc-space-1); align-content: center; }
.ui-ssv__face { width: 28px; height: 28px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.ui-ssv__word { max-width: 100%; font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); text-align: center; overflow-wrap: anywhere; }
/* The words at each end of the NPS scale */
.ui-ssv__ends { display: flex; justify-content: space-between; gap: var(--tc-space-3); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
/* The bands, quietly: a thin rule in the band's tone over its range and name, lined up with the numbers */
.ui-ssv__bands { display: grid; grid-template-columns: 7fr 2fr 2fr; gap: var(--tc-space-1); }
.ui-ssv__band { min-width: 0; overflow: hidden; padding-top: var(--tc-space-1); border-top: 2px solid var(--tc-ssv-band); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
.ui-ssv__band[data-band="detractor"] { --tc-ssv-band: var(--tc-ssv-band-detractor); }
.ui-ssv__band[data-band="passive"] { --tc-ssv-band: var(--tc-ssv-band-passive); }
.ui-ssv__band[data-band="promoter"] { --tc-ssv-band: var(--tc-ssv-band-promoter); }
.ui-ssv__band-range { font-variant-numeric: tabular-nums; color: var(--tc-text-secondary); }
/* ----- The follow-up and Submit ----- */
.ui-ssv__more { display: grid; gap: var(--tc-space-1-5); margin-top: var(--tc-space-2); padding-top: var(--tc-space-3); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-ssv__label { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-ssv__field { display: block; width: 100%; min-height: 72px; padding: var(--tc-space-2) var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font: inherit; font-size: var(--tc-field-font-size); line-height: var(--tc-line-height-relaxed); color: var(--tc-text-primary); resize: vertical; outline: none; field-sizing: content; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-ssv__field::placeholder { color: var(--tc-text-placeholder); }
.ui-ssv__field:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-ssv__field:focus { box-shadow: var(--tc-field-shadow-focus); }
.ui-ssv__actions { display: flex; justify-content: flex-end; gap: var(--tc-space-2); margin-top: var(--tc-space-1); }
.ui-ssv__submit, .ui-ssv__skip, .ui-ssv__change { display: inline-flex; align-items: center; justify-content: center; height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-ssv__submit { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
[data-ui="ssv"] .ui-ssv__submit:hover { background: var(--tc-action-primary-bg-hover); }
.ui-ssv__submit[aria-busy="true"] { cursor: progress; background: var(--tc-action-primary-bg-active); }
.ui-ssv__skip { color: var(--tc-action-ghost-fg); }
[data-ui="ssv"] .ui-ssv__skip:hover { background: var(--tc-action-ghost-bg-hover); }
.ui-ssv__change { flex: none; margin-left: auto; background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); }
[data-ui="ssv"] .ui-ssv__change:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
/* ----- The thank-you ----- */
.ui-ssv__done { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-3); padding: var(--tc-space-4); }
.ui-ssv__check { display: grid; flex: none; place-items: center; width: 32px; height: 32px; border-radius: var(--tc-radius-full); background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-ssv__done-text { display: grid; flex: 1; gap: var(--tc-space-0-5); min-width: 0; }
.ui-ssv__thanks { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-ssv__answer { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
/* Narrow: the eleven numbers wrap to 0–5 and 6–10; the bands become a line of words */
@container ui-ssv (max-width: 440px) {
  .ui-ssv__scale { grid-template-columns: repeat(6, minmax(0, 1fr)); }
  .ui-ssv__scale[data-kind="csat"] { grid-template-columns: repeat(5, minmax(0, 1fr)); gap: var(--tc-space-1); }
  .ui-ssv__scale[data-kind="csat"] .ui-ssv__opt { min-height: 68px; }
  .ui-ssv__bands { display: flex; flex-wrap: wrap; gap: var(--tc-space-1) var(--tc-space-3); }
  .ui-ssv__band { padding-top: 0; padding-left: var(--tc-space-1-5); border-top: 0; border-left: 2px solid var(--tc-ssv-band); }
}
@media (pointer: coarse) {
  .ui-ssv__opt { min-height: 44px; }
}
@media (forced-colors: active) {
  .ui-ssv__opt[aria-checked="true"] { outline: 2px solid Highlight; }
  .ui-ssv__band { border-color: CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="ssv"] *, [data-ui="ssv"] *::before, [data-ui="ssv"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-score-survey")) customElements.define("tc-score-survey", TcScoreSurvey);

declare global {
  interface HTMLElementTagNameMap {
    "tc-score-survey": TcScoreSurvey;
  }
}
