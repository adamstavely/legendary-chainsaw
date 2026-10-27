import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { TcElement } from "./internal/base";
import { FocusRescueController } from "./internal/controllers";

/*
 * <tc-reflection-gate> – a short pause that makes a person think before relying on an AI answer. Four modes:
 *   · intent – the task, the decision it supports and the cost of being wrong, said before asking
 *   · prior – what you expect and what would change your mind, noted while the answer is still hidden; the answer
 *     shows once the prior is in
 *   · reformulate – restate the answer in your own words, then compare: the answer's key terms missing from your
 *     version are marked, and you say how close yours is
 *   · checkpoint – name one claim you'll verify (from `claims`, or typed), and how
 * The fields are stepper-form's: a label, the control and a message that appears after a Submit that didn't pass.
 * Standard is a gray tray with the prompt on a white card; Clean is one white card with a hairline above the buttons.
 * `brief` is the short version for deadline situations: each mode asks one combined question in one field, says
 * plainly that it's the short version, and still records the answer (tc-submit carries `brief: true`).
 *
 *   <tc-reflection-gate mode="prior" .answer=${text}></tc-reflection-gate>
 *
 * What the person writes is `value`; every edit fires a cancelable `tc-value-change`. Submit fires a cancelable
 * `tc-submit` with the mode's fields – unless prevented, the gate shows what was noted. Skip shows only with
 * `allow-skip`, and fires a cancelable `tc-skip`. `phase` says where the gate is; set it to restore one.
 */

export type ReflectionMode = "intent" | "prior" | "reformulate" | "checkpoint";
/** open: being filled in · compare: reformulate's second step · done: submitted · skipped */
export type ReflectionPhase = "open" | "compare" | "done" | "skipped";
/** The fields across the four modes */
export type ReflectionField = "task" | "decision" | "stakes" | "belief" | "confidence" | "changeMind" | "restatement" | "match" | "claim" | "method" | "brief";
/** What the person wrote or picked, by field – choices hold their key ("high", "partly", a claim's id…) */
export type ReflectionGateValue = Partial<Record<ReflectionField, string>>;
/** A claim to pick in checkpoint mode */
export type ReflectionClaim = { id: string; text: string };
export type ReflectionGateValueChange = { value: ReflectionGateValue };
/** The detail of tc-submit: the mode, and only that mode's fields */
export type ReflectionGateSubmission = { mode: ReflectionMode; value: ReflectionGateValue; /** The short version was used */ brief?: boolean };
export type ReflectionGateSkip = { mode: ReflectionMode };
export type ReflectionGatePhaseChange = { phase: ReflectionPhase };

/** Every text the gate shows – pass any of them in `labels` to change it */
export type ReflectionGateLabels = {
  intentHeading: string;
  intentDescription: string;
  priorHeading: string;
  priorDescription: string;
  reformulateHeading: string;
  reformulateDescription: string;
  checkpointHeading: string;
  checkpointDescription: string;
  task: string;
  taskPlaceholder: string;
  decision: string;
  decisionPlaceholder: string;
  stakes: string;
  stakesLow: string;
  stakesLowHint: string;
  stakesMedium: string;
  stakesMediumHint: string;
  stakesHigh: string;
  stakesHighHint: string;
  belief: string;
  beliefPlaceholder: string;
  confidence: string;
  confidenceUnsure: string;
  confidenceLeaning: string;
  confidenceSure: string;
  changeMind: string;
  changeMindPlaceholder: string;
  answer: string;
  hiddenAnswer: string;
  restatement: string;
  restatementPlaceholder: string;
  yours: string;
  match: string;
  matchYes: string;
  matchYesHint: string;
  matchPartly: string;
  matchPartlyHint: string;
  matchNo: string;
  matchNoHint: string;
  claim: string;
  claimPlaceholder: string;
  method: string;
  methodPlaceholder: string;
  optional: string;
  submit: string;
  compare: string;
  back: string;
  skip: string;
  edit: string;
  reflectNow: string;
  noted: string;
  skipped: string;
  required: string;
  requiredChoice: string;
  tooShort: string;
  /** The short version's tag, its line under the heading, and its result */
  briefTag: string;
  briefDescription: string;
  notedBrief: string;
  /** The one question per mode in the short version, and its placeholder */
  briefIntent: string;
  briefIntentPlaceholder: string;
  briefPrior: string;
  briefPriorPlaceholder: string;
  briefReformulate: string;
  briefReformulatePlaceholder: string;
  briefCheckpoint: string;
  briefCheckpointPlaceholder: string;
};

const DEFAULT_LABELS: ReflectionGateLabels = {
  intentHeading: "Before you ask",
  intentDescription: "Say what this is for – it decides how closely the answer needs checking.",
  priorHeading: "Before you see the answer",
  priorDescription: "Note what you expect first, so you can tell whether the answer moved you.",
  reformulateHeading: "Put it in your own words",
  reformulateDescription: "Restate the answer, then compare – the gaps show what to read again.",
  checkpointHeading: "Pick one thing to verify",
  checkpointDescription: "Name a claim you'll check before you rely on this answer.",
  task: "What are you trying to do?",
  taskPlaceholder: "e.g. Draft the reply to a refund request",
  decision: "What decision will it support?",
  decisionPlaceholder: "e.g. Whether to offer a full refund",
  stakes: "If the answer is wrong",
  stakesLow: "Minor",
  stakesLowHint: "Easy to notice and undo",
  stakesMedium: "Costly",
  stakesMediumHint: "Takes real work to fix",
  stakesHigh: "Serious",
  stakesHighHint: "Hard or impossible to undo",
  belief: "What do you expect the answer to be?",
  beliefPlaceholder: "Your best guess, in a sentence or two",
  confidence: "How sure are you?",
  confidenceUnsure: "Unsure",
  confidenceLeaning: "Leaning",
  confidenceSure: "Confident",
  changeMind: "What would change your mind?",
  changeMindPlaceholder: "The evidence that would make you think otherwise",
  answer: "The answer",
  hiddenAnswer: "The answer stays hidden until you've noted what you expect.",
  restatement: "In your own words",
  restatementPlaceholder: "What does the answer say, and what follows from it?",
  yours: "Yours",
  match: "How close is yours?",
  matchYes: "Matches",
  matchYesHint: "Says the same thing",
  matchPartly: "Partly",
  matchPartlyHint: "Missed or changed a detail",
  matchNo: "Misses the point",
  matchNoHint: "Read the answer again",
  claim: "Which claim will you verify?",
  claimPlaceholder: "The claim, as the answer puts it",
  method: "How will you check it?",
  methodPlaceholder: "e.g. Against the signed contract",
  optional: "Optional",
  submit: "Continue",
  compare: "Compare",
  back: "Edit mine",
  skip: "Skip",
  edit: "Edit",
  reflectNow: "Reflect now",
  noted: "Noted",
  skipped: "Skipped – nothing noted",
  required: "Fill this in to continue",
  requiredChoice: "Pick one to continue",
  tooShort: "Write at least {n} words",
  briefTag: "Short version",
  briefDescription: "The short version, for when time is tight. One line – it's still kept with the answer.",
  notedBrief: "Noted – short version",
  briefIntent: "What's this for, and what if it's wrong?",
  briefIntentPlaceholder: "e.g. Refund reply going out today – a wrong amount costs us",
  briefPrior: "What do you expect, and how sure are you?",
  briefPriorPlaceholder: "Your guess in a line",
  briefReformulate: "The answer in one line of your own",
  briefReformulatePlaceholder: "What it says, in your words",
  briefCheckpoint: "One thing you'll check, and how",
  briefCheckpointPlaceholder: "e.g. The 30-day notice, against the contract",
};

type Kind = "text" | "area" | "cards" | "seg" | "claims";
type FieldSpec = { key: ReflectionField; kind: Kind; required: boolean };

/** The fields each mode asks for, in order (reformulate's `match` is on its compare step) */
const MODES: Record<ReflectionMode, FieldSpec[]> = {
  intent: [
    { key: "task", kind: "text", required: true },
    { key: "decision", kind: "text", required: true },
    { key: "stakes", kind: "cards", required: true },
  ],
  prior: [
    { key: "belief", kind: "area", required: true },
    { key: "confidence", kind: "seg", required: false },
    { key: "changeMind", kind: "area", required: true },
  ],
  reformulate: [{ key: "restatement", kind: "area", required: true }],
  checkpoint: [
    { key: "claim", kind: "claims", required: true },
    { key: "method", kind: "text", required: false },
  ],
};
const MATCH: FieldSpec = { key: "match", kind: "cards", required: true };
/** The short version: one combined field, whatever the mode */
const BRIEF: FieldSpec = { key: "brief", kind: "text", required: true };
const BRIEF_LABEL: Record<ReflectionMode, keyof ReflectionGateLabels> = { intent: "briefIntent", prior: "briefPrior", reformulate: "briefReformulate", checkpoint: "briefCheckpoint" };

/** Choices by field: key → [label key, hint key] */
const CHOICES: Partial<Record<ReflectionField, [string, keyof ReflectionGateLabels, keyof ReflectionGateLabels | null][]>> = {
  stakes: [
    ["low", "stakesLow", "stakesLowHint"],
    ["medium", "stakesMedium", "stakesMediumHint"],
    ["high", "stakesHigh", "stakesHighHint"],
  ],
  confidence: [
    ["unsure", "confidenceUnsure", null],
    ["leaning", "confidenceLeaning", null],
    ["sure", "confidenceSure", null],
  ],
  match: [
    ["yes", "matchYes", "matchYesHint"],
    ["partly", "matchPartly", "matchPartlyHint"],
    ["no", "matchNo", "matchNoHint"],
  ],
};

const STOP = new Set(
  "about above after again against because before being below between both could does doing during each having other should their theirs there these those through under until while which would yours".split(" "),
);
const norm = (w: string) => w.toLowerCase().replace(/^[^\p{L}\p{N}$€£]+|[^\p{L}\p{N}%]+$/gu, "");
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean);

/**
 * The answer's key terms that a restatement doesn't mention: numbers, amounts and dates, and longer words that
 * aren't filler – lower-cased, once each, in the answer's order.
 */
export function missingTerms(answer: string, restatement: string): string[] {
  const have = new Set(words(restatement).map(norm));
  const out: string[] = [];
  for (const w of words(answer).map(norm)) {
    if (!w || out.includes(w) || have.has(w)) continue;
    if (/\d/.test(w) || (w.length >= 7 && !STOP.has(w))) out.push(w);
  }
  return out;
}

/* ---------- Icons (Lucide, ISC – lucide.dev) ---------- */
const bulb = html`<svg class="ui-rg__mark-svg" viewBox="0 0 24 24" aria-hidden="true">${svg`<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path><path d="M9 18h6M10 22h4"></path>`}</svg>`;
const check = html`<svg class="ui-rg__glyph" viewBox="0 0 24 24" aria-hidden="true">${svg`<path d="M5.5 12.5l4 4L18.5 8"></path>`}</svg>`;
const skipIcon = html`<svg class="ui-rg__glyph" viewBox="0 0 24 24" aria-hidden="true">${svg`<path d="M5 12h12M13 7l5 5-5 5"></path>`}</svg>`;
const eyeOff = html`<svg class="ui-rg__glyph" viewBox="0 0 24 24" aria-hidden="true">${svg`<path d="M10.7 5.1A10 10 0 0 1 12 5c4.5 0 8.3 3 9.5 7a10 10 0 0 1-1.9 3.4M6.6 6.6A10 10 0 0 0 2.5 12c1.2 4 5 7 9.5 7a10 10 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18"></path>`}</svg>`;

let instances = 0;

/**
 * A pause before relying on an answer: intent, prior, reformulate or checkpoint prompts, submitted through a
 * cancelable event.
 * @tag tc-reflection-gate
 * @fires tc-value-change - The person edited a field; detail `{ value }`: ReflectionGateValueChange. Cancelable.
 * @fires tc-submit - The mode's fields passed their checks; detail `{ mode, value }`: ReflectionGateSubmission. Cancelable: preventDefault() keeps the gate open.
 * @fires tc-skip - Skip was pressed (only with `allow-skip`); detail `{ mode }`: ReflectionGateSkip. Cancelable.
 * @fires tc-phase-change - The gate moves on – to compare, done, skipped, or back to open; detail `{ phase }`: ReflectionGatePhaseChange. Cancelable.
 */
export class TcReflectionGate extends TcElement {
  static override ui = "rg";

  /** Which prompt to show: intent, prior, reformulate or checkpoint */
  @property({ reflect: true }) accessor mode: ReflectionMode = "intent";
  /** Where the gate is: open, compare (reformulate's second step), done or skipped – set it to restore one */
  @property({ reflect: true }) accessor phase: ReflectionPhase = "open";
  /** What the person wrote or picked, by field */
  @property({ attribute: false }) accessor value: ReflectionGateValue = {};
  /** The answer – hidden in prior mode until the prior is in, shown to restate in reformulate mode */
  @property() accessor answer = "";
  /** The claims to pick from in checkpoint mode; without them the person types the claim */
  @property({ attribute: false }) accessor claims: ReflectionClaim[] = [];
  /** Shows Skip – only where your product lets people go on without reflecting */
  @property({ type: Boolean, attribute: "allow-skip" }) accessor allowSkip = false;
  /** The fewest words a restatement may have */
  @property({ type: Number, attribute: "min-words" }) accessor minWords = 5;
  /** The heading – defaults to the mode's */
  @property() accessor heading = "";
  /** The line under the heading – defaults to the mode's */
  @property() accessor description = "";
  /** The short version for deadline situations: one combined field per mode, marked as the short version, still recorded */
  @property({ type: Boolean, reflect: true }) accessor brief = false;
  /** Any of the gate's texts, to change the wording or the language */
  @property({ attribute: false }) accessor labels: Partial<ReflectionGateLabels> = {};

  /** @internal A Submit didn't pass: messages show */
  @state() accessor attempted = false;
  /** @internal What the status region says */
  @state() accessor announce = "";

  private readonly uid = `tc-rg${++instances}`;
  /** The newest value, also between a change and the update that shows it */
  private latest: ReflectionGateValue = {};
  /** Focus goes to the first problem after the next update */
  private focusInvalid = false;
  /** The person moved the gate on: focus follows once `phase` changes (controlled, that's when the app passes it back) */
  private focusOnPhase = false;

  constructor() {
    super();
    // Edit, Back or Reflect now goes away with its phase – focus lands on the gate's first control
    new FocusRescueController(this, () => this.querySelector<HTMLElement>(".ui-rg__card :is(input, textarea, button)"));
  }

  private get t(): ReflectionGateLabels {
    return { ...DEFAULT_LABELS, ...this.labels };
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (changed.has("value")) this.latest = this.value;
    if ((changed.has("mode") && changed.get("mode") !== undefined) || (changed.has("brief") && changed.get("brief") !== undefined)) this.attempted = false;
  }

  protected override updated(changed: PropertyValues<this>) {
    if (this.focusInvalid) {
      this.focusInvalid = false;
      this.querySelector<HTMLElement>('.ui-rg__field[data-invalid] :is(input, textarea, [role="radio"][tabindex="0"])')?.focus();
    }
    if (changed.has("phase") && this.focusOnPhase) {
      this.focusOnPhase = false;
      if (this.phase === "done" || this.phase === "skipped") this.querySelector<HTMLElement>(".ui-rg__result")?.focus({ preventScroll: true });
      else this.querySelector<HTMLElement>(".ui-rg__card :is(input, textarea, [role='radio'][tabindex='0'])")?.focus();
    }
  }

  /* ---------- Values ---------- */

  private set(key: ReflectionField, v: string) {
    const next = { ...this.latest, [key]: v };
    this.latest = next;
    if (this.emit<ReflectionGateValueChange>("tc-value-change", { value: next }, { cancelable: true })) this.value = next;
    // Prevented: render again, so the field goes back to the value the app holds
    else this.requestUpdate();
  }

  private setPhase(next: ReflectionPhase) {
    if (next === this.phase) return true;
    this.focusOnPhase = true;
    if (!this.emit<ReflectionGatePhaseChange>("tc-phase-change", { phase: next }, { cancelable: true })) return false;
    this.phase = next;
    return true;
  }

  /** The fields the current step checks */
  private get specs(): FieldSpec[] {
    if (this.brief) return [BRIEF];
    return this.phase === "compare" ? [MATCH] : MODES[this.mode] ?? MODES.intent;
  }

  /** A field's message, or "" when it passes */
  private problem(spec: FieldSpec, value = this.latest): string {
    const v = (value[spec.key] ?? "").trim();
    if (spec.key === "restatement" && v && words(v).length < this.minWords) return this.t.tooShort.replace("{n}", String(this.minWords));
    const choice = spec.kind === "cards" || spec.kind === "seg" || (spec.kind === "claims" && this.claims.length > 0);
    if (spec.required && !v) return choice ? this.t.requiredChoice : this.t.required;
    if (spec.kind === "claims" && this.claims.length && v && !this.claims.some((c) => c.id === v)) return this.t.requiredChoice;
    return "";
  }

  /** The submitted fields: this mode's, plus `match` for reformulate */
  private picked(): ReflectionGateValue {
    if (this.brief) return this.latest.brief?.trim() ? { brief: this.latest.brief.trim() } : {};
    const keys = [...MODES[this.mode].map((s) => s.key), ...(this.mode === "reformulate" ? (["match"] as const) : [])];
    return Object.fromEntries(keys.filter((k) => this.latest[k] !== undefined && this.latest[k] !== "").map((k) => [k, this.latest[k]!.trim()]));
  }

  private onSubmit(e: Event) {
    e.preventDefault();
    const failing = this.specs.map((s) => [s, this.problem(s)] as const).filter(([, m]) => m);
    if (failing.length) {
      this.attempted = true;
      this.announce = failing[0][1];
      this.focusInvalid = true;
      this.requestUpdate();
      return;
    }
    this.attempted = false;
    if (this.mode === "reformulate" && this.phase !== "compare" && !this.brief) {
      this.setPhase("compare");
      const missing = missingTerms(this.answer, this.latest.restatement ?? "").length;
      this.announce = missing ? `${missing} ${missing === 1 ? "term" : "terms"} from the answer ${missing === 1 ? "isn't" : "aren't"} in yours` : "Yours covers the answer's key terms";
      return;
    }
    const submission: ReflectionGateSubmission = { mode: this.mode, value: this.picked() };
    if (this.brief) submission.brief = true;
    if (!this.emit<ReflectionGateSubmission>("tc-submit", submission, { cancelable: true })) return;
    this.setPhase("done");
    const noted = this.brief ? this.t.notedBrief : this.t.noted;
    this.announce = this.mode === "prior" && this.answer ? `${noted}. The answer is shown.` : noted;
  }

  private skip() {
    if (!this.emit<ReflectionGateSkip>("tc-skip", { mode: this.mode }, { cancelable: true })) return;
    this.setPhase("skipped");
    this.attempted = false;
    this.announce = this.t.skipped;
  }

  private reopen(phase: ReflectionPhase = "open") {
    this.setPhase(phase);
    this.announce = "";
  }

  /* ---------- Parts ---------- */

  private label(key: ReflectionField) {
    if (key === "brief") return this.t[BRIEF_LABEL[this.mode] ?? "briefIntent"];
    return this.t[key as keyof ReflectionGateLabels] ?? key;
  }

  /** A text field or a growing text area, stepper-form's recipe */
  private textField(spec: FieldSpec, message: string) {
    const id = `${this.uid}-${spec.key}`;
    const msgId = `${id}-msg`;
    const placeholder = spec.key === "brief" ? this.t[`${BRIEF_LABEL[this.mode] ?? "briefIntent"}Placeholder` as keyof ReflectionGateLabels] : this.t[`${spec.key}Placeholder` as keyof ReflectionGateLabels];
    const onInput = (e: Event) => this.set(spec.key, (e.target as HTMLInputElement).value);
    const onKey = (e: KeyboardEvent) => {
      // ⌘/Ctrl + Enter sends from a text area; Enter alone makes a new line
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !e.isComposing) {
        e.preventDefault();
        this.querySelector<HTMLFormElement>("form.ui-rg__card")?.requestSubmit();
      }
    };
    return html`<div class="ui-rg__field" data-field=${spec.key} ?data-invalid=${!!message}>
      <label class="ui-rg__label" for=${id}>${this.label(spec.key)}${spec.required ? nothing : html`<span class="ui-rg__optional">${this.t.optional}</span>`}</label>
      <div class="ui-rg__input" ?data-invalid=${!!message} data-kind=${spec.kind}>
        ${spec.kind === "area"
          ? html`<textarea
              id=${id}
              rows="2"
              placeholder=${ifDefined(placeholder)}
              aria-invalid=${message ? "true" : "false"}
              aria-required=${spec.required ? "true" : "false"}
              aria-describedby=${ifDefined(message ? msgId : undefined)}
              .value=${live(this.value[spec.key] ?? "")}
              @input=${onInput}
              @keydown=${onKey}
            ></textarea>`
          : html`<input
              id=${id}
              type="text"
              autocomplete="off"
              placeholder=${ifDefined(placeholder)}
              aria-invalid=${message ? "true" : "false"}
              aria-required=${spec.required ? "true" : "false"}
              aria-describedby=${ifDefined(message ? msgId : undefined)}
              .value=${live(this.value[spec.key] ?? "")}
              @input=${onInput}
            />`}
      </div>
      ${message ? html`<p class="ui-rg__msg" id=${msgId}>${message}</p>` : nothing}
    </div>`;
  }

  /** A radio group – cards with a hint, a segmented row, or the claims; arrows move and pick (APG radio) */
  private radios(spec: FieldSpec, message: string, options: { key: string; title: string; hint?: string }[]) {
    const id = `${this.uid}-${spec.key}`;
    const msgId = `${id}-msg`;
    const current = this.value[spec.key] ?? "";
    const at = options.findIndex((o) => o.key === current);
    const onKey = (e: KeyboardEvent) => {
      const i = options.findIndex((o) => o.key === (this.latest[spec.key] ?? ""));
      const n = options.length;
      const to =
        e.key === "ArrowRight" || e.key === "ArrowDown" ? (i + 1 + n) % n
        : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (i <= 0 ? n - 1 : i - 1)
        : e.key === "Home" ? 0
        : e.key === "End" ? n - 1
        : e.key === " " && i < 0 ? 0
        : -1;
      if (to < 0) return;
      e.preventDefault();
      this.set(spec.key, options[to].key);
      void this.updateComplete.then(() => this.querySelectorAll<HTMLElement>(`#${id} [role="radio"]`)[to]?.focus());
    };
    return html`<div class="ui-rg__field" data-field=${spec.key} ?data-invalid=${!!message}>
      <span class="ui-rg__label" id=${`${id}-label`}>${this.label(spec.key)}${spec.required ? nothing : html`<span class="ui-rg__optional">${this.t.optional}</span>`}</span>
      <div
        class=${`ui-rg__choices ui-rg__choices--${spec.kind}`}
        id=${id}
        role="radiogroup"
        aria-labelledby=${`${id}-label`}
        aria-required=${spec.required ? "true" : "false"}
        aria-invalid=${message ? "true" : "false"}
        aria-describedby=${ifDefined(message ? msgId : undefined)}
        @keydown=${onKey}
      >
        ${options.map(
          (o, i) => html`<button
            type="button"
            role="radio"
            class="ui-rg__choice"
            aria-checked=${o.key === current ? "true" : "false"}
            tabindex=${i === (at < 0 ? 0 : at) ? 0 : -1}
            @click=${() => this.set(spec.key, o.key)}
          >
            <span class="ui-rg__choice-top"><span class="ui-rg__choice-title">${o.title}</span>${spec.kind === "seg" ? nothing : html`<span class="ui-rg__radio" aria-hidden="true"></span>`}</span>
            ${o.hint ? html`<span class="ui-rg__choice-hint">${o.hint}</span>` : nothing}
          </button>`,
        )}
      </div>
      ${message ? html`<p class="ui-rg__msg" id=${msgId}>${message}</p>` : nothing}
    </div>`;
  }

  private field(spec: FieldSpec) {
    const message = this.attempted ? this.problem(spec, this.value) : "";
    if (spec.kind === "text" || spec.kind === "area") return this.textField(spec, message);
    if (spec.kind === "claims") {
      if (!this.claims.length) return this.textField({ ...spec, kind: "area" }, message);
      return this.radios(spec, message, this.claims.map((c) => ({ key: c.id, title: c.text })));
    }
    const t = this.t;
    return this.radios(spec, message, (CHOICES[spec.key] ?? []).map(([key, title, hint]) => ({ key, title: t[title as keyof ReflectionGateLabels], hint: hint ? t[hint] : undefined })));
  }

  /** The answer as a quote; in compare, its key terms missing from the restatement are marked */
  private answerBlock(mark: string[] = []) {
    if (!this.answer) return nothing;
    const missing = new Set(mark);
    const text = mark.length
      ? this.answer.split(/(\s+)/).map((w) => {
          if (!missing.has(norm(w))) return w;
          // The word is marked, its punctuation isn't
          const [, lead, core, trail] = w.match(/^([^\p{L}\p{N}$€£]*)(.*?)([^\p{L}\p{N}%]*)$/u)!;
          return html`${lead}<mark class="ui-rg__miss">${core}</mark>${trail}`;
        })
      : this.answer;
    return html`<figure class="ui-rg__answer">
      <figcaption class="ui-rg__caption">${this.t.answer}</figcaption>
      <p class="ui-rg__quote">${text}</p>
    </figure>`;
  }

  /** The answer, still hidden: a veil of placeholder lines */
  private veil() {
    return html`<div class="ui-rg__veil">
      <span class="ui-rg__bars" aria-hidden="true"><span></span><span></span><span></span></span>
      <p class="ui-rg__veil-text">${eyeOff}<span>${this.t.hiddenAnswer}</span></p>
    </div>`;
  }

  /** What was noted, as a description list */
  private summary() {
    const v = this.value;
    const show = (key: ReflectionField) => {
      const raw = v[key];
      if (!raw) return null;
      if (key === "claim" && this.claims.length) return this.claims.find((c) => c.id === raw)?.text ?? raw;
      const choice = CHOICES[key]?.find(([k]) => k === raw);
      return choice ? this.t[choice[1]] : raw;
    };
    const keys: ReflectionField[] = this.brief ? ["brief"] : [...MODES[this.mode].map((s) => s.key), ...(this.mode === "reformulate" ? (["match"] as const) : [])];
    const rows = keys.map((k) => [k, show(k)] as const).filter(([, s]) => s);
    return html`<dl class="ui-rg__noted">
      ${rows.map(([k, s]) => html`<div class="ui-rg__row"><dt>${this.label(k)}</dt><dd>${s}</dd></div>`)}
    </dl>`;
  }

  private body(): TemplateResult {
    const t = this.t;
    const phase = this.phase;
    if (phase === "done" || phase === "skipped") {
      const done = phase === "done";
      return html`<div class="ui-rg__card ui-rg__card--result">
        <div class="ui-rg__result" tabindex="-1" data-phase=${phase}>
          <span class="ui-rg__badge" data-phase=${phase}>${done ? check : skipIcon}</span>
          <span class="ui-rg__result-text">${done ? (this.brief ? t.notedBrief : t.noted) : t.skipped}</span>
          <button type="button" class="ui-rg__text-btn" @click=${() => this.reopen(this.mode === "reformulate" && done && !this.brief ? "compare" : "open")}>${done ? t.edit : t.reflectNow}</button>
        </div>
        ${done ? this.summary() : nothing}
        ${this.mode === "prior" || (this.mode === "reformulate" && !done) || this.mode === "checkpoint" ? this.answerBlock() : nothing}
      </div>`;
    }
    const compare = phase === "compare" && this.mode === "reformulate" && !this.brief;
    const missing = compare ? missingTerms(this.answer, this.value.restatement ?? "") : [];
    return html`<form class="ui-rg__card" novalidate aria-labelledby=${`${this.uid}-title`} aria-describedby=${`${this.uid}-desc`} @submit=${this.onSubmit}>
      <div class="ui-rg__body">
        ${this.mode === "prior" ? this.veil() : nothing}
        ${this.mode === "reformulate" && !compare ? this.answerBlock() : nothing}
        ${this.mode === "checkpoint" && this.answer ? this.answerBlock() : nothing}
        ${compare
          ? html`<div class="ui-rg__pair">
                ${this.answerBlock(missing)}
                <figure class="ui-rg__answer" data-side="yours">
                  <figcaption class="ui-rg__caption">${t.yours}</figcaption>
                  <p class="ui-rg__quote">${this.value.restatement}</p>
                </figure>
              </div>
              <p class="ui-rg__gaps">${missing.length
                ? html`<span class="ui-rg__gaps-n">${missing.length}</span> ${missing.length === 1 ? "term" : "terms"} from the answer ${missing.length === 1 ? "isn't" : "aren't"} in yours – marked above.`
                : "Yours covers the answer's key terms."}</p>`
          : nothing}
        ${this.specs.map((s) => this.field(s))}
      </div>
      <div class="ui-rg__foot">
        ${compare
          ? html`<button type="button" class="ui-rg__btn ui-rg__btn--ghost" @click=${() => this.reopen("open")}>${t.back}</button>`
          : this.allowSkip
            ? html`<button type="button" class="ui-rg__btn ui-rg__btn--ghost" @click=${() => this.skip()}>${t.skip}</button>`
            : nothing}
        <button type="submit" class="ui-rg__btn ui-rg__btn--primary">${this.mode === "reformulate" && !compare && !this.brief ? t.compare : t.submit}</button>
      </div>
    </form>`;
  }

  protected override render() {
    const t = this.t;
    const mode = MODES[this.mode] ? this.mode : "intent";
    const heading = this.heading || t[`${mode}Heading` as keyof ReflectionGateLabels];
    const description = this.brief ? t.briefDescription : this.description || t[`${mode}Description` as keyof ReflectionGateLabels];
    return html`
      <div class="ui-rg__bar">
        <span class="ui-rg__mark">${bulb}</span>
        <span class="ui-rg__head">
          <span class="ui-rg__title" id=${`${this.uid}-title`}>${heading}${this.brief ? html` <span class="ui-rg__tag">${t.briefTag}</span>` : nothing}</span>
          <span class="ui-rg__desc" id=${`${this.uid}-desc`}>${description}</span>
        </span>
      </div>
      ${this.body()}
      <span class="ui-rg__sr" role="status">${this.announce}</span>
    `;
  }

  static override css = /* css */ `
[data-ui="rg"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 560px;
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
  container: ui-rg / inline-size;
}
/* Clean: no tray – one white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="rg"] {
  padding: 0;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  letter-spacing: normal;
}
[data-ui="rg"] *, [data-ui="rg"] *::before, [data-ui="rg"] *::after { box-sizing: border-box; }
[data-ui="rg"] svg { display: block; flex: none; }
:where([data-ui="rg"]) :is(p, dl, dd, figure) { margin: 0; }
:where([data-ui="rg"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; letter-spacing: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="rg"] button:focus-visible, .ui-rg__result:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-rg__result:focus { outline: none; }
.ui-rg__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* ----- The header on the tray: the mark, the heading and what it's for ----- */
.ui-rg__bar { display: flex; align-items: flex-start; gap: var(--tc-space-2); min-width: 0; padding: var(--tc-space-2) var(--tc-space-3) var(--tc-space-2-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-rg__bar { padding: var(--tc-space-4) var(--tc-space-5) 0; }
.ui-rg__mark { display: grid; flex: none; place-items: center; width: 16px; height: calc(var(--tc-font-size-md) * var(--tc-line-height-normal)); color: var(--tc-accent-text); }
.ui-rg__mark-svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-rg__mark-svg { stroke-width: 1.5; }
.ui-rg__head { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-rg__title { font-size: var(--tc-title-font-size); font-weight: var(--tc-title-font-weight); line-height: var(--tc-title-line-height); letter-spacing: var(--tc-title-tracking); color: var(--tc-title-color); }
.ui-rg__tag { display: inline-flex; align-items: center; height: var(--tc-pill-h); margin-left: var(--tc-space-1); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); letter-spacing: normal; vertical-align: 1px; white-space: nowrap; }
.ui-rg__desc { font-size: var(--tc-subtitle-font-size); line-height: var(--tc-subtitle-line-height); color: var(--tc-subtitle-color); text-wrap: pretty; }
/* ----- The card ----- */
.ui-rg__card { display: grid; min-width: 0; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-rg__card { border-radius: 0 0 var(--tc-card-radius) var(--tc-card-radius); background: none; box-shadow: none; }
.ui-rg__body { display: grid; gap: var(--tc-space-4); min-width: 0; padding: var(--tc-space-4) var(--tc-space-4) var(--tc-space-1); }
:where([data-look="clean"], [data-look="clean"] *).ui-rg__body { padding: var(--tc-space-4) var(--tc-space-5) var(--tc-space-4); }
/* ----- Fields: stepper-form's recipe ----- */
.ui-rg__field { display: grid; min-width: 0; }
.ui-rg__label { display: flex; align-items: baseline; justify-content: space-between; gap: var(--tc-space-2); margin-bottom: var(--tc-space-1-5); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-rg__label { margin-left: var(--tc-space-0-5); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); }
.ui-rg__optional { font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); }
.ui-rg__input { display: flex; min-width: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); transition: box-shadow var(--tc-duration-quick) var(--tc-ease-standard); cursor: text; }
.ui-rg__input:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-rg__input:focus-within { box-shadow: var(--tc-field-shadow-focus); }
.ui-rg__input[data-invalid] { box-shadow: var(--tc-field-shadow-invalid); }
.ui-rg__input[data-invalid]:focus-within { box-shadow: var(--tc-field-shadow-invalid), 0 0 0 var(--tc-focus-ring-width) var(--tc-focus-ring); }
.ui-rg__input :is(input, textarea) { flex: 1; min-width: 0; margin: 0; padding: 0 var(--tc-field-px); border: 0; outline: none; background: none; font: inherit; font-size: var(--tc-field-font-size); color: var(--tc-text-primary); }
.ui-rg__input input { height: var(--tc-field-h); }
.ui-rg__input textarea { min-height: calc(var(--tc-field-h) * 1.75); padding-top: var(--tc-space-2); padding-bottom: var(--tc-space-2); line-height: var(--tc-line-height-normal); resize: vertical; field-sizing: content; }
.ui-rg__input :is(input, textarea)::placeholder { color: var(--tc-text-placeholder); }
.ui-rg__msg { padding-top: var(--tc-space-1-5); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-status-danger-fg); text-wrap: pretty; animation: ui-rg-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
/* Choice cards: stepper-form's selectable cards */
.ui-rg__choices { display: grid; grid-auto-columns: minmax(0, 1fr); grid-auto-flow: column; gap: var(--tc-space-2); min-width: 0; border-radius: var(--tc-radius-xl); }
.ui-rg__choices--claims { grid-auto-flow: row; }
.ui-rg__choice { position: relative; display: grid; align-content: start; gap: var(--tc-space-0-5); min-width: 0; padding: var(--tc-space-2-5) var(--tc-space-3); border-radius: var(--tc-radius-xl); background: var(--tc-surface-raised); box-shadow: inset 0 0 0 1px var(--tc-border-default); transition: background-color var(--tc-duration-base) var(--tc-ease-standard), box-shadow var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-rg__choice { border-radius: var(--tc-radius-md); box-shadow: var(--tc-shadow-raised); transition: background-color var(--tc-duration-instant) var(--tc-ease-standard); }
/* Hover: a darker ring (Standard), a light fill (Clean); picked: the accent tint and ring */
:where([data-look="standard"], [data-look="standard"] *).ui-rg__choice:hover { box-shadow: inset 0 0 0 1px var(--tc-border-control-hover); }
:where([data-look="clean"], [data-look="clean"] *).ui-rg__choice:hover { background: var(--tc-fill-subtle); }
.ui-rg__choice[aria-checked="true"] { background: var(--tc-accent-subtle); box-shadow: inset 0 0 0 1.5px var(--tc-accent); }
:where([data-look="clean"], [data-look="clean"] *).ui-rg__choice[aria-checked="true"] { box-shadow: inset 0 0 0 1px var(--tc-accent); }
.ui-rg__field[data-invalid] .ui-rg__choice:not([aria-checked="true"]) { box-shadow: inset 0 0 0 1px var(--tc-status-danger-border); }
.ui-rg__choice:focus-visible { outline-offset: 2px; }
.ui-rg__choice-top { display: flex; align-items: flex-start; gap: var(--tc-space-2); min-width: 0; }
.ui-rg__choice-title { flex: 1; min-width: 0; font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-primary); overflow-wrap: anywhere; }
:where([data-look="clean"], [data-look="clean"] *).ui-rg__choice-title { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-strong); }
.ui-rg__choices--claims .ui-rg__choice-title { font-weight: var(--tc-font-weight-regular); }
.ui-rg__choice-hint { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); text-wrap: pretty; }
.ui-rg__radio { position: relative; flex: none; width: 16px; height: 16px; margin-top: var(--tc-space-0-5); border-radius: var(--tc-radius-full); box-shadow: inset 0 0 0 1.5px var(--tc-border-control); transition: box-shadow var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-rg__radio { width: 14px; height: 14px; transform: translateY(1px); box-shadow: inset 0 0 0 1px var(--tc-border-control); }
.ui-rg__radio::after { content: ""; position: absolute; inset: 4px; border-radius: var(--tc-radius-full); background: var(--tc-accent); transform: scale(0); transition: transform var(--tc-duration-slow) var(--tc-ease-spring); }
:where([data-look="clean"], [data-look="clean"] *).ui-rg__radio::after { inset: 3.5px; }
.ui-rg__choice[aria-checked="true"] .ui-rg__radio { box-shadow: inset 0 0 0 1.5px var(--tc-accent); }
.ui-rg__choice[aria-checked="true"] .ui-rg__radio::after { transform: scale(1); }
/* A segmented row (how sure): the seg pattern – a track with a raised thumb */
[data-ui="rg"] .ui-rg__choices--seg { justify-self: start; gap: 0; padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
[data-ui="rg"] .ui-rg__choices--seg .ui-rg__choice { place-items: center; height: calc(var(--tc-control-h-md) - 2 * var(--tc-seg-pad)); padding: 0 var(--tc-space-3); border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); background: none; box-shadow: none; font-size: var(--tc-control-font-size); }
[data-ui="rg"] .ui-rg__choices--seg .ui-rg__choice-title { font-weight: var(--tc-control-font-weight); color: var(--tc-text-secondary); white-space: nowrap; }
[data-ui="rg"] .ui-rg__choices--seg .ui-rg__choice[aria-checked="true"] { background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow); }
[data-ui="rg"] .ui-rg__choices--seg .ui-rg__choice:is(:hover, [aria-checked="true"]) .ui-rg__choice-title { color: var(--tc-text-primary); }
/* ----- The answer: a quote on a well; hidden, a veil of placeholder lines ----- */
.ui-rg__answer { display: grid; gap: var(--tc-space-1); min-width: 0; padding: var(--tc-space-2-5) var(--tc-space-3); border-radius: var(--tc-radius-lg); background: var(--tc-surface-well); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-subtle); }
.ui-rg__caption { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-rg__quote { color: var(--tc-text-primary); line-height: var(--tc-line-height-relaxed); white-space: pre-line; overflow-wrap: anywhere; }
.ui-rg__miss { padding: 0 var(--tc-space-0-5); border-radius: var(--tc-radius-xs); background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); text-decoration: underline dotted; text-underline-offset: 3px; -webkit-box-decoration-break: clone; box-decoration-break: clone; }
.ui-rg__veil { display: grid; gap: var(--tc-space-2-5); padding: var(--tc-space-3); border-radius: var(--tc-radius-lg); background: var(--tc-surface-well); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-subtle); }
.ui-rg__bars { display: grid; gap: var(--tc-space-1-5); }
.ui-rg__bars > span { height: 8px; border-radius: var(--tc-radius-full); background: var(--tc-fill-strong); }
.ui-rg__bars > span:nth-child(2) { width: 86%; }
.ui-rg__bars > span:nth-child(3) { width: 52%; }
.ui-rg__veil-text { display: flex; align-items: flex-start; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
.ui-rg__veil-text .ui-rg__glyph { transform: translateY(1px); }
/* Compare: the answer and yours side by side; narrow, stacked */
.ui-rg__pair { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--tc-space-2); }
.ui-rg__answer[data-side="yours"] { background: none; box-shadow: inset 0 0 0 1px var(--tc-border-default); }
.ui-rg__gaps { margin-top: calc(-1 * var(--tc-space-2)); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-rg__gaps-n { font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
/* ----- The buttons: Button's ghost and primary recipes ----- */
.ui-rg__foot { display: flex; align-items: center; justify-content: flex-end; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-rg__foot { padding: var(--tc-space-2-5) var(--tc-space-3); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-rg__btn { display: inline-flex; flex: none; align-items: center; justify-content: center; height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-rg__btn--ghost { margin-right: auto; color: var(--tc-action-ghost-fg); }
[data-ui="rg"] .ui-rg__btn--ghost:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-rg__btn--ghost { background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); }
[data-ui="rg"]:where([data-look="clean"]) .ui-rg__btn--ghost:hover { background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-rg__btn--primary { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
[data-ui="rg"] .ui-rg__btn--primary:hover { background: var(--tc-action-primary-bg-hover); }
[data-ui="rg"] .ui-rg__btn--primary:active { background: var(--tc-action-primary-bg-active); }
.ui-rg__btn:active { transform: scale(0.97); }
/* ----- Done or skipped: one line, what was noted, the answer ----- */
.ui-rg__card--result { gap: var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-rg__card--result { padding: var(--tc-space-3) var(--tc-space-5) var(--tc-space-4); }
.ui-rg__result { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; border-radius: var(--tc-radius-sm); animation: ui-rg-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-rg__badge { display: grid; flex: none; place-items: center; width: 22px; height: 22px; border-radius: var(--tc-radius-full); background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-rg__badge[data-phase="skipped"] { background: var(--tc-fill-default); color: var(--tc-text-secondary); }
.ui-rg__glyph { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-rg__glyph { stroke-width: 1.7; }
.ui-rg__result-text { flex: 1; min-width: 0; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-rg__text-btn { flex: none; height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-ghost-fg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
[data-ui="rg"] .ui-rg__text-btn:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-rg__noted { display: grid; border-radius: var(--tc-radius-xl); box-shadow: inset 0 0 0 1px var(--tc-border-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-rg__noted { border-radius: var(--tc-radius-md); box-shadow: var(--tc-shadow-raised); }
.ui-rg__row { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 3fr); gap: var(--tc-space-3); padding: var(--tc-space-2-5) var(--tc-space-3); }
.ui-rg__row + .ui-rg__row { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-rg__row dt { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-rg__row dd { min-width: 0; color: var(--tc-text-primary); overflow-wrap: anywhere; }
.ui-rg__card--result .ui-rg__answer { animation: ui-rg-in var(--tc-duration-slow) var(--tc-ease-move) var(--tc-duration-base) both; }
@keyframes ui-rg-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
/* Narrow: cards and the comparison stack; rows put the label over the value */
@container ui-rg (max-width: 460px) {
  .ui-rg__choices--cards { grid-auto-flow: row; }
  .ui-rg__pair { grid-template-columns: minmax(0, 1fr); }
  .ui-rg__row { grid-template-columns: minmax(0, 1fr); gap: var(--tc-space-0-5); }
  .ui-rg__body { padding-right: var(--tc-space-3-5); padding-left: var(--tc-space-3-5); }
  :where([data-look="clean"], [data-look="clean"] *).ui-rg__body, :where([data-look="clean"], [data-look="clean"] *).ui-rg__bar { padding-right: var(--tc-space-4); padding-left: var(--tc-space-4); }
}
@media (pointer: coarse) {
  .ui-rg__btn { height: var(--tc-control-h-lg); }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="rg"] *, [data-ui="rg"] *::before, [data-ui="rg"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-reflection-gate")) customElements.define("tc-reflection-gate", TcReflectionGate);

declare global {
  interface HTMLElementTagNameMap {
    "tc-reflection-gate": TcReflectionGate;
  }
}
