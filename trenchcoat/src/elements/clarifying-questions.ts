import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { FocusRescueController } from "./internal/controllers";

/*
 * <tc-clarifying-questions> – the agent asks before it starts. Two or three structured questions – one choice, several
 * choices or a short answer, each with "You decide" – answered in place and sent back as one reply. Enter moves to
 * the next question; on the last one it sends. "Skip, you decide" hands every question to the agent. Once sent the
 * card folds into the answers, as the reply reads in the thread.
 * Standard: a white card on the gray tray, the progress and Send on the tray below it. Clean: one quiet white card
 * whose last row holds them.
 *
 *   <tc-clarifying-questions .questions=${questions} @tc-send=${(e) => reply(e.detail.value)}></tc-clarifying-questions>
 *
 * The answers are the value: { [questionId]: { values?, text?, decide? } }. Every change fires a cancelable
 * tc-value-change ({ value }); Send fires a cancelable tc-send ({ value }) – unless prevented the card shows as sent.
 *
 * Keyboard: Tab moves between questions; in a choice question the arrow keys move between the answers (one choice
 * picks as it moves, several choices toggle with Space); Enter goes to the next question and sends from the last.
 */

export type ClarifyingKind = "single" | "multiple" | "text";

export type ClarifyingOption = {
  value: string;
  label: string;
  /** A second line under the label – questions with descriptions show their answers as cards */
  description?: string;
};

export type ClarifyingQuestion = {
  id: string;
  /** The question, as the agent asks it */
  prompt: string;
  /** "single" – one choice, "multiple" – several, "text" – a short answer */
  kind: ClarifyingKind;
  /** The choices for single and multiple */
  options?: ClarifyingOption[];
  /** Why the agent asks, in a line under the question */
  hint?: string;
  /** Placeholder of a text question */
  placeholder?: string;
  /** Offers "You decide" – on by default */
  decide?: boolean;
  /** Can be left unanswered – shows "Optional" */
  optional?: boolean;
};

/** One question's answer: the picked values, the text, or "you decide" */
export type ClarifyingAnswer = { values?: string[]; text?: string; decide?: boolean };
/** Every answer, by question id */
export type ClarifyingAnswers = Record<string, ClarifyingAnswer>;

/** Detail of tc-value-change and tc-send */
export type ClarifyingAnswersChange = { value: ClarifyingAnswers };

/** The radio and checkbox value that stands for "You decide" */
const DECIDE = "\u0000decide";

const answered = (q: ClarifyingQuestion, a: ClarifyingAnswer | undefined) => !!a && (!!a.decide || (q.kind === "text" ? !!a.text?.trim() : !!a.values?.length));

/* Icons: 24px line glyphs – thinner in Clean */
const glyph = (d: string, className = "") =>
  html`<svg viewBox="0 0 24 24" class=${["ui-clq__glyph", className].filter(Boolean).join(" ")} aria-hidden="true">${svg`<path d=${d}></path>`}</svg>`;
const icons = {
  ask: "M12 21a9 9 0 1 0-8.1-5.06L3 21l5.06-.9A9 9 0 0 0 12 21zM9.5 9.5a2.5 2.5 0 1 1 3.4 2.33c-.53.2-.9.7-.9 1.27v.4M12 16.5h.01",
  check: "M5.5 12.5l4 4L18.5 8",
  sent: "M20 6 9 17l-5-5",
  spark: "M12 3.5l1.9 5.1a1 1 0 0 0 .6.6l5 1.8-5 1.8a1 1 0 0 0-.6.6L12 18.5l-1.9-5.1a1 1 0 0 0-.6-.6l-5-1.8 5-1.8a1 1 0 0 0 .6-.6z",
};

let instances = 0;

/**
 * The agent asks before it starts: two or three questions – choices, a short answer, "You decide" – sent back as one reply.
 * @tag tc-clarifying-questions
 * @fires tc-value-change - An answer changed. Cancelable. Detail: ClarifyingAnswersChange ({ value })
 * @fires tc-send - Send, Enter on the last question, or Skip – every answer in one reply. Cancelable: unless prevented the card shows as sent. Detail: ClarifyingAnswersChange ({ value })
 */
export class TcClarifyingQuestions extends TcElement {
  static override ui = "clq";

  /** The questions, in the order they're asked */
  @property({ attribute: false }) accessor questions: ClarifyingQuestion[] = [];
  /** The answers so far, by question id – the value */
  @property({ attribute: false }) accessor value: ClarifyingAnswers = {};
  /** Names the questions, as the agent says it */
  @property() accessor heading = "A few questions before I start";
  /** What the agent will do once it knows, in a sentence under the heading */
  @property() accessor intro: string | undefined = undefined;
  /** The answers have been sent: the card shows them as the reply */
  @property({ type: Boolean, reflect: true }) accessor sent = false;
  /** The send button's label */
  @property({ attribute: "send-label" }) accessor sendLabel = "Send answers";
  /** The label of the answer that leaves a question to the agent */
  @property({ attribute: "decide-label" }) accessor decideLabel = "You decide";
  /** The label of the button that leaves every question to the agent */
  @property({ attribute: "skip-label" }) accessor skipLabel = "Skip, you decide";
  /** Offers the skip button; set it to false when the agent can't go on without answers */
  @property({ type: Boolean }) accessor skippable = true;

  /** @internal The question that last had focus */
  @state() accessor current = 0;
  /** @internal Questions that need an answer before sending, flagged after a send was tried */
  @state() accessor missing: string[] = [];
  /** @internal Which answer holds a several-choices question's tab stop */
  @state() accessor roving: Record<string, number> = {};
  /** @internal What the status region says */
  @state() accessor said = "";

  private readonly uid = `tc-clq${++instances}`;
  private focusNext: string | null = null;

  constructor() {
    super();
    // Sending replaces the questions with the reply: focus goes to the reply rather than the page
    new FocusRescueController(this, () => this.querySelector<HTMLElement>(".ui-clq__card"));
  }

  private answerOf(q: ClarifyingQuestion) {
    return this.value[q.id];
  }
  private offersDecide(q: ClarifyingQuestion) {
    return q.decide !== false;
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    this.current = Math.min(Math.max(0, this.current), Math.max(0, this.questions.length - 1));
    // An answer clears its question's flag
    if (this.missing.length) this.missing = this.missing.filter((id) => {
      const q = this.questions.find((x) => x.id === id);
      return q && !answered(q, this.answerOf(q));
    });
  }

  protected override updated() {
    if (this.focusNext) {
      const sel = this.focusNext;
      this.focusNext = null;
      this.querySelector<HTMLElement>(sel)?.focus();
    }
  }

  /* ---------- Answers ---------- */

  private setAnswer(q: ClarifyingQuestion, answer: ClarifyingAnswer) {
    const value = { ...this.value, [q.id]: answer };
    if (this.emit<ClarifyingAnswersChange>("tc-value-change", { value }, { cancelable: true })) this.value = value;
  }

  private pick(q: ClarifyingQuestion, v: string) {
    if (q.kind === "single") {
      this.setAnswer(q, v === DECIDE ? { decide: true } : { values: [v] });
      return;
    }
    const a = this.answerOf(q);
    if (v === DECIDE) {
      this.setAnswer(q, a?.decide ? {} : { decide: true });
      return;
    }
    const was = a?.values ?? [];
    const values = was.includes(v) ? was.filter((x) => x !== v) : [...was, v];
    // Keep the options' order
    const order = (q.options ?? []).map((o) => o.value);
    this.setAnswer(q, { values: values.sort((x, y) => order.indexOf(x) - order.indexOf(y)) });
  }

  private type(q: ClarifyingQuestion, text: string) {
    this.setAnswer(q, { text });
  }

  /** The first control of question i: its picked answer or first answer, or its field */
  private controlSelector(i: number) {
    const q = this.questions[i];
    if (!q) return null;
    if (q.kind === "text") return `#${this.uid}-q${i}-input`;
    return `[data-q="${i}"] [data-choice][tabindex="0"]`;
  }

  private next(i: number) {
    if (i >= this.questions.length - 1) {
      this.send();
      return;
    }
    this.current = i + 1;
    const sel = this.controlSelector(i + 1);
    if (sel) this.querySelector<HTMLElement>(sel)?.focus();
  }

  private send(skip = false) {
    const qs = this.questions;
    const value: ClarifyingAnswers = skip
      ? Object.fromEntries(qs.map((q) => [q.id, { decide: true }]))
      : Object.fromEntries(qs.filter((q) => answered(q, this.answerOf(q))).map((q) => [q.id, this.answerOf(q)!]));
    if (!skip) {
      const missing = qs.filter((q) => !q.optional && !answered(q, this.answerOf(q)));
      if (missing.length) {
        this.missing = missing.map((q) => q.id);
        const i = qs.indexOf(missing[0]);
        this.current = i;
        this.said = `Answer question ${i + 1}${this.offersDecide(missing[0]) ? `, or choose ${this.decideLabel}` : ""}`;
        const sel = this.controlSelector(i);
        if (sel) this.querySelector<HTMLElement>(sel)?.focus();
        return;
      }
    }
    if (!this.emit<ClarifyingAnswersChange>("tc-send", { value }, { cancelable: true })) return;
    this.value = value;
    this.sent = true;
    this.said = "Answers sent";
    this.focusNext = ".ui-clq__card";
  }

  /* ---------- Keyboard ---------- */

  private onChoiceKey(e: KeyboardEvent, q: ClarifyingQuestion, i: number) {
    if (e.isComposing || e.altKey || e.ctrlKey || e.metaKey) return;
    const chips = [...(e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>("[data-choice]")];
    const at = chips.indexOf(e.target as HTMLElement);
    if (at < 0) return;
    if (e.key === "Enter") {
      e.preventDefault();
      this.next(i);
      return;
    }
    const n = chips.length;
    const to =
      e.key === "ArrowRight" || e.key === "ArrowDown" ? (at + 1) % n
      : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (at - 1 + n) % n
      : e.key === "Home" ? 0
      : e.key === "End" ? n - 1
      : -1;
    if (to < 0) return;
    e.preventDefault();
    const chip = chips[to];
    if (q.kind === "single") this.pick(q, chip.dataset.choice!);
    else this.roving = { ...this.roving, [q.id]: to };
    chip.focus();
  }

  private onTextKey(e: KeyboardEvent, i: number) {
    if (e.key !== "Enter" || e.isComposing) return;
    e.preventDefault();
    this.next(i);
  }

  /* ---------- Rendering ---------- */

  private renderChoices(q: ClarifyingQuestion, i: number): TemplateResult {
    const a = this.answerOf(q);
    const single = q.kind === "single";
    const options = [...(q.options ?? []).map((o) => ({ ...o, decide: false })), ...(this.offersDecide(q) ? [{ value: DECIDE, label: this.decideLabel, description: undefined, decide: true }] : [])];
    const on = (v: string) => (v === DECIDE ? !!a?.decide : !a?.decide && !!a?.values?.includes(v));
    // The tab stop: the picked answer (one choice) or the last one used (several), else the first
    const picked = options.findIndex((o) => on(o.value));
    const stop = single ? Math.max(0, picked) : Math.min(this.roving[q.id] ?? 0, options.length - 1);
    const cards = options.some((o) => o.description);
    return html`<div
      class="ui-clq__choices"
      role=${single ? "radiogroup" : "group"}
      aria-labelledby=${`${this.uid}-q${i}-prompt`}
      aria-describedby=${ifDefined(this.missing.includes(q.id) ? `${this.uid}-q${i}-error` : undefined)}
      aria-required=${ifDefined(single && !q.optional ? "true" : undefined)}
      ?data-cards=${cards}
      @keydown=${(e: KeyboardEvent) => this.onChoiceKey(e, q, i)}
      @focusin=${(e: FocusEvent) => {
        const k = [...(e.currentTarget as HTMLElement).querySelectorAll("[data-choice]")].indexOf(e.target as Element);
        if (!single && k >= 0 && k !== this.roving[q.id]) this.roving = { ...this.roving, [q.id]: k };
      }}
    >
      ${repeat(
        options,
        (o) => o.value,
        (o, k) => html`<button
          type="button"
          class="ui-clq__choice"
          role=${single ? "radio" : "checkbox"}
          aria-checked=${on(o.value) ? "true" : "false"}
          tabindex=${k === stop ? 0 : -1}
          data-choice=${o.value}
          ?data-decide=${o.decide}
          @click=${() => this.pick(q, o.value)}
        >
          <span class="ui-clq__choice-top"
            >${single ? html`<span class="ui-clq__radio" aria-hidden="true"></span>` : html`<span class="ui-clq__box" aria-hidden="true">${glyph(icons.check)}</span>`}${o.decide
              ? glyph(icons.spark, "ui-clq__spark")
              : nothing}<span class="ui-clq__choice-label">${o.label}</span></span
          >${o.description ? html`<span class="ui-clq__choice-desc"><span class="ui-clq__sr">, </span>${o.description}</span>` : nothing}
        </button>`,
      )}
    </div>`;
  }

  private renderText(q: ClarifyingQuestion, i: number): TemplateResult {
    const a = this.answerOf(q);
    const decided = !!a?.decide;
    return html`<div class="ui-clq__text">
      <input
        id=${`${this.uid}-q${i}-input`}
        class="ui-clq__input"
        type="text"
        .value=${live(decided ? "" : (a?.text ?? ""))}
        placeholder=${decided ? `${this.decideLabel} – left to the agent` : (q.placeholder ?? "Type a short answer")}
        aria-labelledby=${`${this.uid}-q${i}-prompt`}
        aria-describedby=${ifDefined(this.missing.includes(q.id) ? `${this.uid}-q${i}-error` : undefined)}
        aria-invalid=${this.missing.includes(q.id) ? "true" : "false"}
        aria-required=${q.optional ? "false" : "true"}
        @input=${(e: Event) => this.type(q, (e.target as HTMLInputElement).value)}
        @keydown=${(e: KeyboardEvent) => this.onTextKey(e, i)}
      />
      ${this.offersDecide(q)
        ? html`<button
            type="button"
            class="ui-clq__choice ui-clq__decide-btn"
            data-decide
            aria-pressed=${decided ? "true" : "false"}
            @click=${() => this.setAnswer(q, decided ? {} : { decide: true })}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === "Enter") {
                e.preventDefault();
                this.next(i);
              }
            }}
          ><span class="ui-clq__choice-top">${glyph(icons.spark, "ui-clq__spark")}<span class="ui-clq__choice-label">${this.decideLabel}</span></span></button>`
        : nothing}
    </div>`;
  }

  private renderQuestion(q: ClarifyingQuestion, i: number) {
    const missing = this.missing.includes(q.id);
    const done = answered(q, this.answerOf(q));
    return html`<div
      class="ui-clq__q"
      role="group"
      aria-labelledby=${`${this.uid}-q${i}-prompt`}
      data-q=${i}
      ?data-current=${i === this.current}
      ?data-missing=${missing}
      @focusin=${() => i !== this.current && (this.current = i)}
    >
      <div class="ui-clq__q-head">
        <span class="ui-clq__num" ?data-done=${done} aria-hidden="true">${done ? glyph(icons.check) : i + 1}</span>
        <span class="ui-clq__prompt" id=${`${this.uid}-q${i}-prompt`}>${q.prompt}</span>
        ${q.optional ? html`<span class="ui-clq__optional">Optional</span>` : nothing}
      </div>
      ${q.hint ? html`<p class="ui-clq__hint">${q.hint}</p>` : nothing}
      ${q.kind === "text" ? this.renderText(q, i) : this.renderChoices(q, i)}
      ${missing ? html`<p class="ui-clq__error" id=${`${this.uid}-q${i}-error`}>Answer this${this.offersDecide(q) ? `, or choose ${this.decideLabel}` : ""}</p>` : nothing}
    </div>`;
  }

  /** How an answer reads in the sent reply */
  private answerText(q: ClarifyingQuestion): string {
    const a = this.answerOf(q);
    if (!a || !answered(q, a)) return "No answer";
    if (a.decide) return this.decideLabel;
    if (q.kind === "text") return a.text!.trim();
    const label = (v: string) => q.options?.find((o) => o.value === v)?.label ?? v;
    return a.values!.map(label).join(", ");
  }

  private renderSent() {
    return html`<div class="ui-clq__card" tabindex="-1" aria-labelledby=${`${this.uid}-sent`} role="group">
      <div class="ui-clq__head">
        <span class="ui-clq__icon ui-clq__icon--sent">${glyph(icons.sent)}</span>
        <div class="ui-clq__titles"><span class="ui-clq__title" id=${`${this.uid}-sent`}>Answers sent</span></div>
      </div>
      <dl class="ui-clq__answers">
        ${this.questions.map((q) => {
          const a = this.answerOf(q);
          return html`<div class="ui-clq__answer"><dt>${q.prompt}</dt><dd ?data-decide=${!!a?.decide} ?data-empty=${!answered(q, a)}>${this.answerText(q)}</dd></div>`;
        })}
      </dl>
    </div>`;
  }

  private renderFoot() {
    const qs = this.questions;
    const done = qs.filter((q) => answered(q, this.answerOf(q))).length;
    return html`<div class="ui-clq__foot">
      <span class="ui-clq__progress">${qs.length ? `${done} of ${qs.length} answered` : "No questions"}</span>
      <span class="ui-clq__buttons">
        ${this.skippable && qs.length ? html`<button type="button" class="ui-clq__btn ui-clq__btn--ghost" @click=${() => this.send(true)}>${this.skipLabel}</button>` : nothing}
        <button type="button" class="ui-clq__btn ui-clq__btn--primary" aria-keyshortcuts="Enter" @click=${() => this.send()}>${this.sendLabel}<kbd class="ui-clq__kbd" aria-hidden="true">↵</kbd></button>
      </span>
    </div>`;
  }

  protected override render() {
    const status = html`<span class="ui-clq__sr" role="status">${this.said}</span>`;
    if (this.sent) return html`${this.renderSent()}${status}`;
    const clean = this.resolvedLook === "clean";
    const card = html`<div class="ui-clq__head">
        <span class="ui-clq__icon">${glyph(icons.ask)}</span>
        <div class="ui-clq__titles">
          <span class="ui-clq__title" id=${`${this.uid}-title`}>${this.heading}</span>
          ${this.intro ? html`<p class="ui-clq__intro">${this.intro}</p>` : nothing}
        </div>
      </div>
      <div class="ui-clq__list">${this.questions.map((q, i) => this.renderQuestion(q, i))}</div>`;
    return html`<div class="ui-clq__form" role="form" aria-labelledby=${`${this.uid}-title`}>
        ${clean ? html`<div class="ui-clq__card">${card}${this.renderFoot()}</div>` : html`<div class="ui-clq__card">${card}</div>${this.renderFoot()}`}
      </div>
      ${status}`;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card; the progress and Send sit on the tray below it */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="clq"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  /* The question number's size (the answers line up after it) and the heading icon's */
  --tc-clarifying-questions-num: 20px;
  --tc-clarifying-questions-icon: 28px;
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
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="clq"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  --tc-clarifying-questions-num: 20px;
  --tc-clarifying-questions-icon: 24px;
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
[data-ui="clq"] *, [data-ui="clq"] *::before, [data-ui="clq"] *::after { box-sizing: border-box; }
:where([data-ui="clq"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="clq"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="clq"] p, [data-ui="clq"] dl, [data-ui="clq"] dd { margin: 0; }
.ui-clq__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-clq__glyph { display: block; flex: none; width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-clq__glyph { display: block; flex: none; width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
/* ----- The card ----- */
.ui-clq__card { min-width: 0; outline: none; animation: ui-clq-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-clq__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-clq__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
.ui-clq__card:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-clq__head { display: flex; align-items: flex-start; gap: var(--tc-space-2-5); padding: var(--tc-space-3-5) var(--tc-space-4) 0; }
.ui-clq__icon { display: grid; flex: none; place-items: center; width: var(--tc-clarifying-questions-icon); height: var(--tc-clarifying-questions-icon); border-radius: var(--tc-radius-md); background: var(--tc-accent-subtle); color: var(--tc-accent-text); }
:where([data-look="clean"], [data-look="clean"] *).ui-clq__icon { border-radius: var(--tc-radius-sm); background: none; }
.ui-clq__icon--sent { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-clq__titles { display: grid; gap: var(--tc-space-0-5); min-width: 0; padding-top: var(--tc-space-0-5); }
.ui-clq__title { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-clq__title { font-weight: var(--tc-font-weight-strong); }
:where([data-look="clean"], [data-look="clean"] *).ui-clq__title { color: var(--tc-text-strong); }
.ui-clq__intro { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); text-wrap: pretty; }
/* ----- The questions ----- */
.ui-clq__list { display: grid; padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-2); }
.ui-clq__q { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-2) var(--tc-space-3-5); border-radius: var(--tc-radius-lg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-clq__q { border-radius: var(--tc-radius-md); }
.ui-clq__q + .ui-clq__q { box-shadow: 0 calc(var(--tc-hairline) * -1) 0 var(--tc-divider); }
.ui-clq__q[data-current] { background: var(--tc-fill-subtle); box-shadow: none; }
.ui-clq__q[data-current] + .ui-clq__q { box-shadow: none; }
.ui-clq__q-head { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; }
/* The number: a small count badge that turns into a check once answered */
.ui-clq__num { display: grid; flex: none; place-items: center; width: var(--tc-clarifying-questions-num); height: var(--tc-clarifying-questions-num); border-radius: var(--tc-radius-full); background: var(--tc-fill-default); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-none); font-variant-numeric: tabular-nums; color: var(--tc-text-muted); transition: background-color var(--tc-duration-base) var(--tc-ease-standard), color var(--tc-duration-base) var(--tc-ease-standard); }
.ui-clq__num[data-done] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-clq__num .ui-clq__glyph { width: 12px; height: 12px; stroke-width: 2.4; }
.ui-clq__prompt { flex: 1; min-width: 0; color: var(--tc-text-primary); text-wrap: pretty; }
:where([data-look="standard"], [data-look="standard"] *).ui-clq__prompt { font-weight: var(--tc-font-weight-medium); }
:where([data-look="clean"], [data-look="clean"] *).ui-clq__prompt { color: var(--tc-text-strong); }
.ui-clq__optional { flex: none; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-pill-h); color: var(--tc-text-muted); }
.ui-clq__hint { margin-top: calc(var(--tc-space-1) * -1) !important; padding-left: calc(var(--tc-clarifying-questions-num) + var(--tc-space-2)); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
.ui-clq__choices, .ui-clq__text, .ui-clq__error { margin-left: calc(var(--tc-clarifying-questions-num) + var(--tc-space-2)); }
.ui-clq__error { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-status-danger-fg); }
/* ----- Answers: chips (Button's secondary recipe), the picked one tinted with a ring; cards with descriptions ----- */
.ui-clq__choices { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); }
.ui-clq__choices[data-cards] { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); }
.ui-clq__choice { display: inline-grid; align-content: center; gap: var(--tc-space-0-5); min-width: 0; font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-text-secondary); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-clq__choice { min-height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-clq__choice:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
:where([data-look="clean"], [data-look="clean"] *).ui-clq__choice { min-height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-fill-default); font-weight: var(--tc-font-weight-regular); }
:where([data-look="clean"], [data-look="clean"] *).ui-clq__choice:hover { background: var(--tc-fill-strong); color: var(--tc-text-primary); }
.ui-clq__choice[aria-checked="true"], .ui-clq__choice[aria-pressed="true"] { background: var(--tc-accent-subtle) !important; box-shadow: inset 0 0 0 1px var(--tc-border-selected) !important; color: var(--tc-accent-text) !important; }
.ui-clq__choices[data-cards] .ui-clq__choice { align-content: start; padding-top: var(--tc-space-2); padding-bottom: var(--tc-space-2); }
.ui-clq__choice-top { display: flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; }
.ui-clq__choice-label { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ui-clq__choices[data-cards] .ui-clq__choice-label { white-space: normal; }
.ui-clq__choice-desc { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-regular); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); text-wrap: pretty; }
:where([data-look="clean"], [data-look="clean"] *).ui-clq__choice-desc { color: var(--tc-text-secondary); }
/* The radio dot and the check box, as stepper-form draws them */
.ui-clq__radio { position: relative; flex: none; width: 14px; height: 14px; border-radius: var(--tc-radius-full); box-shadow: inset 0 0 0 1.5px var(--tc-border-control); transition: box-shadow var(--tc-duration-base) var(--tc-ease-standard); }
.ui-clq__radio::after { content: ""; position: absolute; inset: 3.5px; border-radius: var(--tc-radius-full); background: var(--tc-accent); transform: scale(0); transition: transform var(--tc-duration-moderate) var(--tc-ease-spring); }
[aria-checked="true"] > .ui-clq__choice-top > .ui-clq__radio { box-shadow: inset 0 0 0 1.5px var(--tc-accent); }
[aria-checked="true"] > .ui-clq__choice-top > .ui-clq__radio::after { transform: scale(1); }
.ui-clq__box { display: grid; flex: none; place-items: center; width: 14px; height: 14px; border-radius: var(--tc-radius-2xs); box-shadow: inset 0 0 0 1.5px var(--tc-border-control); color: var(--tc-text-on-accent); transition: background-color var(--tc-duration-base) var(--tc-ease-standard), box-shadow var(--tc-duration-base) var(--tc-ease-standard); }
.ui-clq__box .ui-clq__glyph { width: 10px; height: 10px; stroke-width: 3; opacity: 0; transform: scale(0.6); transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-base) var(--tc-ease-spring); }
[aria-checked="true"] > .ui-clq__choice-top > .ui-clq__box { background: var(--tc-accent-solid); box-shadow: none; }
[aria-checked="true"] > .ui-clq__choice-top > .ui-clq__box .ui-clq__glyph { opacity: 1; transform: none; }
:where([data-look="clean"], [data-look="clean"] *) .ui-clq__radio, :where([data-look="clean"], [data-look="clean"] *) .ui-clq__box { box-shadow: inset 0 0 0 1px var(--tc-border-control); }
/* You decide: dashed, with a spark – it hands the question to the agent */
.ui-clq__choice[data-decide] { background: none !important; box-shadow: none; outline: 1px dashed var(--tc-border-strong); outline-offset: -1px; color: var(--tc-text-muted); }
.ui-clq__choice[data-decide]:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-clq__choice[data-decide][aria-checked="true"], .ui-clq__choice[data-decide][aria-pressed="true"] { outline-color: transparent; }
.ui-clq__choice[data-decide] > .ui-clq__choice-top > .ui-clq__radio, .ui-clq__choice[data-decide] > .ui-clq__choice-top > .ui-clq__box { display: none; }
.ui-clq__spark { width: 14px !important; height: 14px !important; }
/* A short answer: the field, with You decide beside it */
.ui-clq__text { display: flex; gap: var(--tc-space-1-5); min-width: 0; }
.ui-clq__input { flex: 1; min-width: 0; height: var(--tc-control-h-md); margin: 0; padding: 0 var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font: inherit; font-size: var(--tc-field-font-size); color: var(--tc-text-primary); caret-color: var(--tc-accent); outline: none; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-clq__input { height: var(--tc-control-h-sm); }
.ui-clq__input:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-clq__input:focus { box-shadow: var(--tc-field-shadow-focus); }
.ui-clq__input[aria-invalid="true"] { box-shadow: var(--tc-field-shadow-invalid); }
.ui-clq__input::placeholder { color: var(--tc-text-placeholder); }
.ui-clq__decide-btn { flex: none; }
/* ----- The tray below the card (Standard) / the card's last row (Clean) ----- */
.ui-clq__foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-2); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-clq__foot { min-height: 48px; padding: var(--tc-space-1-5) var(--tc-space-1) var(--tc-space-1) var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-clq__foot { padding: var(--tc-space-2-5) var(--tc-space-3) var(--tc-space-3) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); line-height: var(--tc-line-height-tight); }
.ui-clq__buttons { display: flex; flex: none; gap: var(--tc-space-1); margin-left: auto; }
.ui-clq__btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--tc-space-2); height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-quick) var(--tc-ease-standard); }
.ui-clq__btn:active { transform: scale(0.98); }
.ui-clq__btn--ghost { color: var(--tc-action-ghost-fg); }
.ui-clq__btn--ghost:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-clq__btn--primary { padding-right: var(--tc-space-1-5); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-clq__btn--primary:hover { background: var(--tc-action-primary-bg-hover); }
.ui-clq__btn--primary:active { background: var(--tc-action-primary-bg-active); }
.ui-clq__kbd { display: grid; place-items: center; min-width: var(--tc-kbd-h); height: var(--tc-kbd-h); padding: 0 var(--tc-kbd-px); border-radius: var(--tc-kbd-radius); background: var(--tc-kbd-on-inverse-bg); font-family: inherit; font-size: var(--tc-kbd-font-size); font-weight: var(--tc-kbd-font-weight); line-height: var(--tc-line-height-none); color: inherit; }
/* ----- Sent: the answers as the reply ----- */
.ui-clq__answers { display: grid; padding: var(--tc-space-2) var(--tc-space-4) var(--tc-space-3-5) calc(var(--tc-space-4) + var(--tc-clarifying-questions-icon) + var(--tc-space-2-5)); }
.ui-clq__answer { display: grid; gap: var(--tc-space-0-5); padding: var(--tc-space-2) 0; }
.ui-clq__answer + .ui-clq__answer { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-clq__answer dt { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
.ui-clq__answer dd { color: var(--tc-text-primary); overflow-wrap: anywhere; }
.ui-clq__answer dd[data-decide] { color: var(--tc-accent-text); }
.ui-clq__answer dd[data-empty] { font-style: italic; color: var(--tc-text-muted); }
@keyframes ui-clq-in { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: none; } }
/* Narrow: the answers lose their indent; the buttons share the row */
@container (max-width: 400px) {
  .ui-clq__choices, .ui-clq__text, .ui-clq__error, .ui-clq__hint { margin-left: 0; padding-left: 0; }
  .ui-clq__text { flex-wrap: wrap; }
  .ui-clq__input { flex-basis: 100%; }
  .ui-clq__answers { padding-left: var(--tc-space-4) !important; }
  .ui-clq__buttons { flex: 1 1 100%; }
  .ui-clq__btn--primary { flex: 1; }
}
@media (hover: none) {
  .ui-clq__kbd { display: none; }
}
@media (pointer: coarse) {
  .ui-clq__choice { min-height: 40px !important; }
  .ui-clq__btn, .ui-clq__input { height: 40px !important; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="clq"] *, [data-ui="clq"] *::before, [data-ui="clq"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-clarifying-questions")) customElements.define("tc-clarifying-questions", TcClarifyingQuestions);

declare global {
  interface HTMLElementTagNameMap {
    "tc-clarifying-questions": TcClarifyingQuestions;
  }
}
