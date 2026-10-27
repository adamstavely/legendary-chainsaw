import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { TcElement } from "./internal/base";
import { sourceSwatch } from "./internal/source-line";
import { FocusRescueController, rescueFocus } from "./internal/controllers";
import type { Look } from "./internal/look";
import "./validity-badge";
import type { ValidityInfo } from "./validity-badge";

/*
 * <tc-claim-answer> – an answer you can check claim by claim. The answer is a list of claims (and the plain text
 * between them); each claim says where it came from – a retrieved source, the model's own knowledge, or an inference
 * – how sure the model is, and, when it applies, why it can't be sure: the world hasn't decided, the evidence is thin,
 * or the question is beyond what the model can know. Below the answer waits the strongest case against it.
 *   · each source type has its own underline – solid for sourced, dashed for model knowledge, dotted for inferred –
 *     in its own colour; the key in the head names them and, pressed, picks out one type
 *   · a claim opens in place: its source type, its confidence, its uncertainty, the passages it rests on (with their
 *     freshness, tc-validity-badge) and "Send to verification"
 *   · the line under the answer always says what you are pointing at
 *   · beyond the three text types: media types (transcript, video, audio, image, OCR – each with how well the medium
 *     was read) and memory types (earlier session, team knowledge, agent finding); the app can cap the confidence
 *     shown for any type (`confidenceCeilings`), and tag the question the answer replies to (`questionType`)
 *
 *   <tc-claim-answer .claims=${claims} .sources=${sources} counter="The survey was small…"></tc-claim-answer>
 *
 * The open claim is `open` (cancelable `tc-open-change`). "Send to verification" adds the claim's id to `queued`
 * (cancelable `tc-queued-change`) and fires `tc-verify` with the claim and its sources – the app puts it in its
 * tc-verification-queue. Labels are properties, so a product can use its own words for the source types.
 */

/** Read from a medium rather than a text: a machine transcript, a video, a recording, an image, or text read off a scan (OCR) */
export type ClaimMediaType = "transcript" | "video" | "audio" | "image" | "ocr";
/** Remembered rather than retrieved now: an earlier session, the team's shared knowledge, or another agent's finding */
export type ClaimMemoryType = "session" | "team" | "agent";
/** Where a claim came from: a retrieved source, the model's own knowledge, an inference from other claims – or a
 *  medium, or memory */
export type ClaimSourceType = "grounded" | "model" | "inferred" | ClaimMediaType | ClaimMemoryType;
/** What kind of question the answer replies to: a fact to look up, an interpretation, a forecast, or a view */
export type ClaimQuestionType = "factual" | "analytical" | "predictive" | "opinion";
/** Why a claim can't be certain: the world hasn't decided · the evidence is thin · it's beyond what the model can know */
export type ClaimUncertainty = "unsettled" | "evidence" | "beyond";

/** A passage a claim rests on */
export type ClaimSource = {
  id: string;
  /** Headline of the page or document */
  title: string;
  /** Short name, e.g. "Field survey" */
  site?: string;
  url?: string;
  /** Ready-to-show date, e.g. "Sep 12, 2026" */
  date?: string;
  /** The passage the claim relies on */
  quote?: string;
  /** How fresh the source is – shown as a tc-validity-badge */
  validity?: ValidityInfo;
};

/** One claim of the answer – or, without `source`, plain text between claims */
export type AnswerClaim = {
  id: string;
  /** The claim's words. Spaces at the start or end are kept outside the mark */
  text: string;
  /** Where it came from; leave it out for connecting text that claims nothing */
  source?: ClaimSourceType;
  /** How sure the model is, 0–1 – shown no higher than the type's ceiling and the `recognition` */
  confidence?: number;
  /** Media types: how well the medium was read, 0–1 – OCR or speech-recognition confidence, shown beside the type
   *  ("OCR 87%"); the claim's confidence is shown no higher */
  recognition?: number;
  /** Why it can't be certain, when that applies */
  uncertainty?: ClaimUncertainty;
  /** A sentence on the uncertainty or the inference, e.g. "Only two studies, both small" */
  note?: string;
  /** Ids of the sources it rests on */
  sources?: string[];
  /** Starts a new paragraph */
  paragraph?: boolean;
};

export type ClaimOpenChange = { open: string | null };
export type ClaimQueuedChange = { queued: string[]; claim: AnswerClaim };
export type ClaimVerifyDetail = { claim: AnswerClaim; sources: ClaimSource[] };

const TYPES: ClaimSourceType[] = ["grounded", "model", "inferred", "transcript", "video", "audio", "image", "ocr", "session", "team", "agent"];
const DEFAULT_SOURCE_LABELS: Record<ClaimSourceType, string> = {
  grounded: "Sourced",
  model: "Model knowledge",
  inferred: "Inferred",
  transcript: "Transcript",
  video: "Video",
  audio: "Audio",
  image: "Image",
  ocr: "OCR",
  session: "Earlier session",
  team: "Team knowledge",
  agent: "Agent finding",
};
const DEFAULT_SOURCE_NOTES: Record<ClaimSourceType, string> = {
  grounded: "Rests on a source the model retrieved.",
  model: "From the model's training, not from a source it retrieved.",
  inferred: "Worked out from other claims – no source states it.",
  transcript: "From a machine transcript of a recording – the transcript can mishear, so check the recording.",
  video: "From the model's reading of a video – check the clip.",
  audio: "From the model's reading of a recording – listen to the passage.",
  image: "From the model's reading of an image – look at the image.",
  ocr: "From text read off a scan – the reading can be wrong, so check the original.",
  session: "Remembered from an earlier session, not retrieved now – it may be out of date.",
  team: "From your team's shared knowledge, not retrieved now.",
  agent: "Found by another agent – check how it got there.",
};
const DEFAULT_QUESTION_LABELS: Record<ClaimQuestionType, string> = { factual: "Factual", analytical: "Analytical", predictive: "Predictive", opinion: "Opinion" };
const DEFAULT_QUESTION_NOTES: Record<ClaimQuestionType, string> = {
  factual: "Asks for a fact that can be looked up.",
  analytical: "Asks for an interpretation – expect judgement as well as facts.",
  predictive: "Asks about the future – expect more uncertainty than a fact carries.",
  opinion: "Asks for a view – weigh it as one view among others.",
};
const DEFAULT_UNCERTAINTY_LABELS: Record<ClaimUncertainty, string> = { unsettled: "Not settled", evidence: "Thin evidence", beyond: "Beyond the model" };
const DEFAULT_UNCERTAINTY_NOTES: Record<ClaimUncertainty, string> = {
  unsettled: "The world hasn't decided this yet – people who know disagree, or it hasn't happened.",
  evidence: "There isn't enough evidence to be sure either way.",
  beyond: "This is beyond what the model can know – ask someone who can check it.",
};
type Confidence = "high" | "medium" | "low";
const DEFAULT_CONFIDENCE_LABELS: Record<Confidence, string> = { high: "High", medium: "Medium", low: "Low" };

/* ---------- Icons – Standard: 12px with 1.4px lines; Clean: 16px, thin 1.1px lines with round caps ---------- */

const stroke = (d: string, w = 1.4) => svg`<path d=${d} stroke="currentColor" stroke-width=${w} stroke-linecap="round" stroke-linejoin="round"></path>`;
const standardIcons = {
  close: html`<svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">${stroke("m2.5 2.5 5 5m0-5-5 5")}</svg>`,
  queue: html`<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">${stroke("M2 3h8M2 6h5M2 9h4M8.5 7.5l1.5 1.5L12 6.5")}</svg>`,
  done: html`<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">${stroke("m2.6 6.3 2.2 2.2 4.6-5", 1.6)}</svg>`,
  chevron: html`<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">${stroke("m4.5 3 3 3-3 3")}</svg>`,
  scale: html`<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">${stroke("M6 2v8M3.5 10h5M2 4h8M2 4 1 7h2L2 4ZM10 4 9 7h2l-1-3Z")}</svg>`,
};
const cleanIcons = {
  close: "M4.75 4.75l6.5 6.5m0-6.5-6.5 6.5",
  queue: "M3 4.5h10M3 8h6M3 11.5h4.5M10 10.5l1.6 1.6L14 9.25",
  done: "M3.75 8.4 6.6 11.2 12.25 5",
  chevron: "m6.25 4.5 3.5 3.5-3.5 3.5",
  scale: "M8 3v10M5 13h6M3 5h10M3 5l-1.5 4h3L3 5ZM13 5l-1.5 4h3L13 5Z",
};
const icon = (name: keyof typeof cleanIcons, look: Look) =>
  look === "clean" ? html`<svg viewBox="0 0 16 16" class="ui-cla__icon" aria-hidden="true">${svg`<path d=${cleanIcons[name]}></path>`}</svg>` : standardIcons[name];

const MEDIA = new Set<ClaimSourceType>(["transcript", "video", "audio", "image", "ocr"]);

let uidCount = 0;

/**
 * An AI answer marked up claim by claim: source type, confidence, uncertainty, the passages behind each claim and a
 * counter-position; claims can be sent to verification.
 * @tag tc-claim-answer
 * @fires tc-open-change - The open claim changes; detail `{ open: string | null }` (ClaimOpenChange). Cancelable.
 * @fires tc-queued-change - "Send to verification" was pressed; detail `{ queued, claim }` (ClaimQueuedChange) – the ids in the queue after it. Cancelable.
 * @fires tc-verify - A claim was sent to verification (after tc-queued-change, whether or not that was prevented); detail `{ claim, sources }` (ClaimVerifyDetail)
 */
export class TcClaimAnswer extends TcElement {
  static override ui = "cla";

  /** The answer as claims, in order – each with its source type, confidence and sources; items without `source` are plain text */
  @property({ attribute: false }) accessor claims: AnswerClaim[] = [];
  /** The passages the claims rest on, looked up by id */
  @property({ attribute: false }) accessor sources: ClaimSource[] = [];
  /** The strongest case against the answer – shown folded under it; empty hides it */
  @property() accessor counter = "";
  /** Id of the claim whose detail is open (null: none) */
  @property({ attribute: false }) accessor open: string | null = null;
  /** Ids of the claims already sent to verification – their button says so */
  @property({ attribute: false }) accessor queued: string[] = [];
  /** The moment source freshness is counted to (epoch ms), passed to every validity badge; unset, each badge uses when it connected */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** Confidence at or above `high` reads High, at or above `medium` Medium, else Low */
  @property({ attribute: false }) accessor confidenceBands: { high: number; medium: number } = { high: 0.8, medium: 0.5 };
  /** The names of the source types – your own vocabulary in place of Sourced, Model knowledge and Inferred */
  @property({ attribute: false }) accessor sourceLabels: Partial<Record<ClaimSourceType, string>> = {};
  /** What each source type means, in the open claim */
  @property({ attribute: false }) accessor sourceNotes: Partial<Record<ClaimSourceType, string>> = {};
  /** The names of the uncertainty kinds – in place of Not settled, Thin evidence and Beyond the model */
  @property({ attribute: false }) accessor uncertaintyLabels: Partial<Record<ClaimUncertainty, string>> = {};
  /** What each uncertainty kind means, in the open claim (a claim's own `note` follows it) */
  @property({ attribute: false }) accessor uncertaintyNotes: Partial<Record<ClaimUncertainty, string>> = {};
  /** The words for the confidence levels – in place of High, Medium and Low */
  @property({ attribute: false }) accessor confidenceLabels: Partial<Record<Confidence, string>> = {};
  /** The highest confidence shown for each source type, 0–1 – a transcript claim might go no higher than 0.7, whatever
   *  the model says. Unset types aren't capped */
  @property({ attribute: false }) accessor confidenceCeilings: Partial<Record<ClaimSourceType, number>> = {};
  /** The kind of question the answer replies to, shown as a tag in the head; unset shows none */
  @property({ attribute: "question-type" }) accessor questionType: ClaimQuestionType | undefined = undefined;
  /** The names of the question types – in place of Factual, Analytical, Predictive and Opinion */
  @property({ attribute: false }) accessor questionTypeLabels: Partial<Record<ClaimQuestionType, string>> = {};
  /** What each question type means for the answer, in the tag's tooltip and for screen readers */
  @property({ attribute: false }) accessor questionTypeNotes: Partial<Record<ClaimQuestionType, string>> = {};
  /** The counter-position's toggle */
  @property({ attribute: "counter-label" }) accessor counterLabel = "Strongest case against";
  /** The button that sends a claim to verification */
  @property({ attribute: "verify-label" }) accessor verifyLabel = "Send to verification";
  /** What that button says once the claim is queued */
  @property({ attribute: "queued-label" }) accessor queuedLabel = "In verification queue";

  /** @internal The claim the pointer or focus is on */
  @state() accessor hot: string | null = null;
  /** @internal The source type picked out from the key (others step back) */
  @state() accessor only: ClaimSourceType | null = null;
  /** @internal The counter-position is unfolded */
  @state() accessor counterOpen = false;
  /** @internal While the detail folds away it keeps showing the last claim */
  @state() accessor lastOpen: string | null = null;
  /** @internal The claim with the roving tab stop */
  @state() accessor active: string | null = null;
  /** @internal A polite message for screen readers */
  @state() accessor said = "";

  private uid = `tc-cla-${++uidCount}`;
  private ownName = false;

  constructor() {
    super();
    // Safety net: a detail closed from outside while focus was in it goes back to its claim
    new FocusRescueController(this, () => this.claimEl(this.lastOpen ?? this.active));
  }

  /** The claims that are claims (they have a source type) */
  private get marked() {
    return this.claims.filter((c) => c.source && c.text.trim());
  }

  /** @internal The open claim: `open` when it is one of the marked claims */
  get openClaim() {
    const id = this.open;
    return id ? (this.marked.find((c) => c.id === id) ?? null) : null;
  }

  private claimEl(id: string | null | undefined) {
    return id ? this.querySelector<HTMLElement>(`.ui-cla__claim[data-id="${CSS.escape(id)}"]`) : null;
  }

  private sourceLabel(t: ClaimSourceType) {
    return this.sourceLabels[t] ?? DEFAULT_SOURCE_LABELS[t];
  }

  private confidenceOf(c: number): Confidence {
    const b = this.confidenceBands;
    return c >= b.high ? "high" : c >= b.medium ? "medium" : "low";
  }

  private confidenceWords(c: number) {
    const level = this.confidenceOf(c);
    return { level, pct: `${Math.round(c * 100)}%`, label: this.confidenceLabels[level] ?? DEFAULT_CONFIDENCE_LABELS[level] };
  }

  /** @internal The confidence a claim is shown with: the model's, no higher than its type's ceiling or its recognition */
  shownConfidence(claim: AnswerClaim): { value: number; capped: "type" | "recognition" | null } | null {
    if (claim.confidence === undefined) return null;
    const type = claim.source ? this.confidenceCeilings[claim.source] : undefined;
    const ceiling = Math.min(type ?? 1, claim.recognition ?? 1);
    if (claim.confidence <= ceiling) return { value: claim.confidence, capped: null };
    return { value: ceiling, capped: claim.recognition !== undefined && claim.recognition <= (type ?? 1) ? "recognition" : "type" };
  }

  private pctOf(n: number) {
    return `${Math.round(Math.max(0, Math.min(1, n)) * 100)}%`;
  }

  private uncertaintyLabel(u: ClaimUncertainty) {
    return this.uncertaintyLabels[u] ?? DEFAULT_UNCERTAINTY_LABELS[u];
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "group");
    this.ownName ||= this.hasAttribute("aria-label") || this.hasAttribute("aria-labelledby");
    if (!this.ownName) this.setAttribute("aria-label", "Answer, claim by claim");
    this.addEventListener("keydown", this.onKeyDown);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("keydown", this.onKeyDown);
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const open = this.openClaim;
    if (open && open.id !== this.lastOpen) this.lastOpen = open.id;
    const marked = this.marked;
    if (!this.active || !marked.some((c) => c.id === this.active)) this.active = open?.id ?? marked[0]?.id ?? null;
    if (this.only) this.dataset.only = this.only;
    else delete this.dataset.only;
  }

  /* ---------- Opening, closing, sending ---------- */

  private setOpen(next: string | null) {
    if (this.emit<ClaimOpenChange>("tc-open-change", { open: next }, { cancelable: true })) this.open = next;
  }

  private toggle(id: string) {
    this.active = id;
    this.setOpen(this.openClaim?.id === id ? null : id);
  }

  private close() {
    const was = this.openClaim?.id;
    if (!was) return;
    this.setOpen(null);
    rescueFocus(this, [this.claimEl(was)]);
  }

  private send(claim: AnswerClaim) {
    if (this.queued.includes(claim.id)) return;
    const next = [...this.queued, claim.id];
    // Prevented: the app owns `queued` and passes it back – the claim is still sent
    if (this.emit<ClaimQueuedChange>("tc-queued-change", { queued: next, claim }, { cancelable: true })) this.queued = next;
    this.said = `Sent to verification: ${claim.text.trim()}`;
    this.emit<ClaimVerifyDetail>("tc-verify", { claim, sources: this.sourcesOf(claim) });
  }

  private sourcesOf(claim: AnswerClaim) {
    const byId = new Map(this.sources.map((s) => [s.id, s]));
    return (claim.sources ?? []).map((id) => byId.get(id)).filter((s): s is ClaimSource => !!s);
  }

  /* ---------- Keyboard ---------- */

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.defaultPrevented) return;
    if (e.key === "Escape" && this.openClaim) {
      e.stopPropagation();
      this.close();
    }
  };

  /** The claims share one tab stop: arrows move along them, Home and End jump, Enter and Space open */
  private onClaimKey = (e: KeyboardEvent, claim: AnswerClaim) => {
    const list = this.marked;
    const i = list.findIndex((c) => c.id === claim.id);
    const last = list.length - 1;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.toggle(claim.id);
      return;
    }
    const to =
      e.key === "ArrowRight" || e.key === "ArrowDown" ? Math.min(last, i + 1)
      : e.key === "ArrowLeft" || e.key === "ArrowUp" ? Math.max(0, i - 1)
      : e.key === "Home" ? 0
      : e.key === "End" ? last
      : null;
    if (to === null || i < 0) return;
    e.preventDefault();
    const next = list[to];
    this.active = next.id;
    void this.updateComplete.then(() => this.claimEl(next.id)?.focus());
  };

  /* ---------- Parts ---------- */

  private head() {
    const marked = this.marked;
    const count = (t: ClaimSourceType) => marked.filter((c) => c.source === t).length;
    const q = this.questionType && DEFAULT_QUESTION_LABELS[this.questionType] ? this.questionType : null;
    const qNote = q ? (this.questionTypeNotes[q] ?? DEFAULT_QUESTION_NOTES[q]) : "";
    return html`<div class="ui-cla__head">
      ${q
        ? html`<span class="ui-cla__qtype" data-qtype=${q} title=${qNote}
            ><span class="tc-sr-only">Question type: </span>${this.questionTypeLabels[q] ?? DEFAULT_QUESTION_LABELS[q]}${qNote ? html`<span class="tc-sr-only">. ${qNote}</span>` : nothing}</span
          >`
        : nothing}
      <span class="ui-cla__count">${marked.length} ${marked.length === 1 ? "claim" : "claims"}</span>
      <span class="ui-cla__keys" role="group" aria-label="Source types">${TYPES.filter((t) => count(t)).map(
        (t) => html`<button
          type="button"
          class="ui-cla__key"
          data-source=${t}
          aria-pressed=${this.only === t ? "true" : "false"}
          @click=${() => {
            this.only = this.only === t ? null : t;
            this.said = this.only ? `Showing ${this.sourceLabel(t).toLowerCase()} claims` : "Showing all claims";
          }}
        >${sourceSwatch(t, "ui-cla__swatch")}${this.sourceLabel(t)}<span class="ui-cla__key-n">${count(t)}</span></button>`,
      )}</span>
    </div>`;
  }

  private answerText(detailId: string) {
    const paragraphs: AnswerClaim[][] = [];
    this.claims.forEach((c) => {
      if (c.paragraph || paragraphs.length === 0) paragraphs.push([]);
      paragraphs[paragraphs.length - 1].push(c);
    });
    const open = this.openClaim?.id ?? null;
    return html`<div class="ui-cla__text" @pointerleave=${() => (this.hot = null)}>${paragraphs.map(
      (para) => html`<p class="ui-cla__p">${para.map((c) => {
        const [, lead, body, trail] = c.text.match(/^(\s*)([\s\S]*?)(\s*)$/) ?? ["", "", c.text, ""];
        if (!c.source || !body) return c.text;
        const shown = this.shownConfidence(c);
        const conf = shown ? this.confidenceWords(shown.value) : null;
        const sr = [
          this.sourceLabel(c.source) + (c.recognition !== undefined ? ` ${this.pctOf(c.recognition)}` : ""),
          conf ? `${conf.pct} confidence${shown?.capped ? " (capped)" : ""}` : "",
          c.uncertainty ? this.uncertaintyLabel(c.uncertainty) : "",
        ]
          .filter(Boolean)
          .join(", ");
        return html`${lead}<span
          role="button"
          class="ui-cla__claim"
          data-id=${c.id}
          data-source=${c.source}
          ?data-hl=${this.hot === c.id || open === c.id}
          ?data-dim=${!!this.only && this.only !== c.source}
          ?data-queued=${this.queued.includes(c.id)}
          tabindex=${this.active === c.id ? 0 : -1}
          aria-expanded=${open === c.id ? "true" : "false"}
          aria-controls=${detailId}
          @pointerenter=${(e: PointerEvent) => e.pointerType === "mouse" && (this.hot = c.id)}
          @focus=${() => {
            this.hot = c.id;
            this.active = c.id;
          }}
          @blur=${() => this.hot === c.id && (this.hot = null)}
          @keydown=${(e: KeyboardEvent) => this.onClaimKey(e, c)}
          @click=${() => this.toggle(c.id)}
        >${c.uncertainty ? this.withMark(body) : body}<span class="tc-sr-only">, ${sr}</span></span>${trail}`;
      })}</p>`,
    )}</div>`;
  }

  /** The last word travels with the "?" mark, so the mark never starts a line on its own */
  private withMark(body: string) {
    const cut = Math.max(0, body.search(/\S+$/));
    return html`${body.slice(0, cut)}<span class="ui-cla__keep">${body.slice(cut)}<span class="ui-cla__unc" aria-hidden="true">?</span></span>`;
  }

  private meter(confidence: number, capped: boolean) {
    const w = this.confidenceWords(confidence);
    const pct = Math.round(Math.max(0, Math.min(1, confidence)) * 100);
    return html`<span class="ui-cla__conf" data-level=${w.level} ?data-capped=${capped}>
      <span class="ui-cla__conf-label">Confidence</span>
      <span class="ui-cla__meter" .role=${"meter"} aria-label="Confidence" aria-valuemin="0" aria-valuemax="100" aria-valuenow=${pct} aria-valuetext=${`${w.pct}, ${w.label.toLowerCase()}${capped ? ", capped" : ""}`}><span class="ui-cla__meter-fill" style=${`inline-size: ${pct}%`}></span></span>
      <span class="ui-cla__conf-value">${w.pct}<span class="ui-cla__dot"> · </span>${w.label}</span>
    </span>`;
  }

  /** The sentence under a capped confidence: what the model said and why it shows lower */
  private capNote(claim: AnswerClaim, shown: { value: number; capped: "type" | "recognition" | null }) {
    if (!shown.capped || claim.confidence === undefined) return nothing;
    const said = this.pctOf(claim.confidence);
    const at = this.pctOf(shown.value);
    const why =
      shown.capped === "recognition"
        ? `the source itself was only read at ${this.pctOf(claim.recognition ?? 1)}`
        : `${this.sourceLabel(claim.source!).toLowerCase()} claims are shown no higher`;
    return html`<p class="ui-cla__dt-note ui-cla__cap"><b>Capped at ${at}</b> – the model said ${said}, but ${why}.</p>`;
  }

  private detail(claim: AnswerClaim, look: Look) {
    const type = claim.source!;
    const sources = this.sourcesOf(claim);
    const queued = this.queued.includes(claim.id);
    const note = this.sourceNotes[type] ?? DEFAULT_SOURCE_NOTES[type];
    const shown = this.shownConfidence(claim);
    return html`<div class="ui-cla__detail" data-source=${type}>
      <div class="ui-cla__dt-head">
        <span class="ui-cla__type" data-source=${type}>${sourceSwatch(type, "ui-cla__swatch")}${this.sourceLabel(type)}${claim.recognition !== undefined ? html`<span class="ui-cla__recog">${this.pctOf(claim.recognition)}</span>` : nothing}</span>
        ${shown ? this.meter(shown.value, !!shown.capped) : html`<span class="ui-cla__spacer"></span>`}
        <button type="button" class="ui-cla__close" aria-label="Close claim" @click=${() => this.close()}>${icon("close", look)}</button>
      </div>
      <p class="ui-cla__dt-note">${note}</p>
      ${shown ? this.capNote(claim, shown) : nothing}
      ${claim.uncertainty
        ? html`<div class="ui-cla__uncertain">
            <span class="ui-cla__unc ui-cla__unc--lg" aria-hidden="true">?</span>
            <span><b>${this.uncertaintyLabel(claim.uncertainty)}</b> – ${this.uncertaintyNotes[claim.uncertainty] ?? DEFAULT_UNCERTAINTY_NOTES[claim.uncertainty]}${claim.note ? html` ${claim.note}` : nothing}</span>
          </div>`
        : claim.note
          ? html`<p class="ui-cla__dt-note">${claim.note}</p>`
          : nothing}
      ${sources.length
        ? html`<ul class="ui-cla__sources" aria-label="Sources">${sources.map(
            (s) => html`<li class="ui-cla__source">
              <div class="ui-cla__src-head">
                <span class="ui-cla__glyph" aria-hidden="true">${(s.site ?? s.title).trim().charAt(0).toUpperCase()}</span>
                <span class="ui-cla__src-name">${s.url ? html`<a href=${s.url} target="_blank" rel="noreferrer noopener">${s.site ?? s.title}</a>` : (s.site ?? s.title)}${s.date ? html`<span class="ui-cla__src-date"><span class="ui-cla__dot"> · </span>${s.date}</span>` : nothing}</span>
                ${s.validity
                  ? html`<tc-validity-badge
                      class="ui-cla__validity"
                      hide-age
                      .look=${look}
                      .observed=${s.validity.observed}
                      .profile=${s.validity.profile ?? "standard"}
                      .band=${s.validity.band}
                      .contested=${!!s.validity.contested}
                      .superseded=${!!s.validity.superseded}
                      .changed=${!!s.validity.changed}
                      .now=${this.now}
                      subject-label="source"
                    ></tc-validity-badge>`
                  : nothing}
              </div>
              ${s.site ? html`<div class="ui-cla__src-title">${s.title}</div>` : nothing}
              ${s.quote ? html`<blockquote class="ui-cla__quote">${s.quote}</blockquote>` : nothing}
            </li>`,
          )}</ul>`
        : nothing}
      <div class="ui-cla__dt-actions">
        <button type="button" class="ui-cla__btn" ?data-done=${queued} aria-disabled=${ifDefined(queued ? "true" : undefined)} @click=${() => this.send(claim)}>
          ${keyed(queued ? "done" : "idle", html`<span class="ui-cla__btn-icon">${icon(queued ? "done" : "queue", look)}</span>`)}${queued ? this.queuedLabel : this.verifyLabel}
        </button>
      </div>
    </div>`;
  }

  private counterPart(look: Look) {
    if (!this.counter) return nothing;
    const id = `${this.uid}-counter`;
    return html`<div class="ui-cla__counter" ?data-open=${this.counterOpen}>
      <button type="button" class="ui-cla__counter-toggle" aria-expanded=${this.counterOpen ? "true" : "false"} aria-controls=${id} @click=${() => (this.counterOpen = !this.counterOpen)}>
        <span class="ui-cla__counter-icon">${icon("scale", look)}</span>
        <span class="ui-cla__counter-label">${this.counterLabel}</span>
        <span class="ui-cla__chev">${icon("chevron", look)}</span>
      </button>
      <div id=${id} class="ui-cla__fold" ?data-open=${this.counterOpen} .inert=${!this.counterOpen}>
        <div class="ui-cla__clip"><p class="ui-cla__counter-text">${this.counter}</p></div>
      </div>
    </div>`;
  }

  private caption(): TemplateResult | string {
    const marked = this.marked;
    const hot = this.hot ? marked.find((c) => c.id === this.hot) : null;
    if (hot?.source) {
      const shown = this.shownConfidence(hot);
      const conf = shown ? this.confidenceWords(shown.value) : null;
      return html`<b>${this.sourceLabel(hot.source)}</b>${conf ? html`<span class="ui-cla__dot"> · </span>${conf.pct} confidence` : nothing}${hot.uncertainty ? html`<span class="ui-cla__dot"> · </span>${this.uncertaintyLabel(hot.uncertainty)}` : nothing}`;
    }
    // Backed by a source: retrieved text, or a medium – a recording, an image, a scan
    const grounded = marked.filter((c) => c.source === "grounded" || MEDIA.has(c.source!)).length;
    const sent = this.queued.filter((id) => marked.some((c) => c.id === id)).length;
    return html`<b>${grounded}</b> of ${marked.length} ${marked.length === 1 ? "claim" : "claims"} backed by a source${sent ? html`<span class="ui-cla__dot"> · </span>${sent} sent to verification` : nothing}`;
  }

  protected override render() {
    const look = this.resolvedLook;
    const clean = look === "clean";
    const detailId = `${this.uid}-detail`;
    const open = this.openClaim;
    const shown = open ?? this.marked.find((c) => c.id === this.lastOpen) ?? null;
    return html`
      <div class=${clean ? "ui-cla__body" : "ui-cla__card"}>
        ${this.head()}
        ${this.answerText(detailId)}
        <div id=${detailId} class="ui-cla__fold" ?data-open=${!!open} .inert=${!open} role="region" aria-label=${shown ? `Claim: ${shown.text.trim()}` : "Claim"}>
          <div class="ui-cla__clip">${shown ? keyed(shown.id, this.detail(shown, look)) : nothing}</div>
        </div>
        ${this.counterPart(look)}
      </div>
      <div class="ui-cla__foot">
        <span class="tc-sr-only" role="status">${this.said}</span>
        <span class="ui-cla__caption">${this.caption()}</span>
      </div>
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="cla"] {
  box-sizing: border-box;
  width: 100%;
  max-width: 520px;
  min-width: 0;
  container-type: inline-size;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="cla"] {
  box-sizing: border-box;
  width: 100%;
  max-width: 520px;
  min-width: 0;
  container-type: inline-size;
  border-radius: var(--tc-radius-lg);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-shadow-raised);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="cla"] *, [data-ui="cla"] *::before, [data-ui="cla"] *::after { box-sizing: border-box; }
:where([data-ui="cla"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="cla"] :is(button, a, [role="button"]):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="cla"] svg { display: block; flex: none; }
[data-ui="cla"] b { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-cla__icon { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.1; stroke-linecap: round; stroke-linejoin: round; }
.ui-cla__dot { color: var(--tc-text-disabled); }
/* The source-type colours, and the underline that tells them apart without colour: solid, dashed, dotted */
[data-ui="cla"] [data-source="grounded"] { --tc-claim-answer-fg: var(--tc-source-grounded-fg); --tc-claim-answer-bg: var(--tc-source-grounded-bg); --tc-claim-answer-line: solid; }
[data-ui="cla"] [data-source="model"] { --tc-claim-answer-fg: var(--tc-source-model-fg); --tc-claim-answer-bg: var(--tc-source-model-bg); --tc-claim-answer-line: dashed; }
[data-ui="cla"] [data-source="inferred"] { --tc-claim-answer-fg: var(--tc-source-inferred-fg); --tc-claim-answer-bg: var(--tc-source-inferred-bg); --tc-claim-answer-line: dotted; }
/* Media types share teal and a double line; memory types share blue and a wavy line – the label names each one */
[data-ui="cla"] :is([data-source="transcript"], [data-source="video"], [data-source="audio"], [data-source="image"], [data-source="ocr"]) { --tc-claim-answer-fg: var(--tc-source-media-fg); --tc-claim-answer-bg: var(--tc-source-media-bg); --tc-claim-answer-line: double; }
[data-ui="cla"] :is([data-source="session"], [data-source="team"], [data-source="agent"]) { --tc-claim-answer-fg: var(--tc-source-memory-fg); --tc-claim-answer-bg: var(--tc-source-memory-bg); --tc-claim-answer-line: wavy; }

:where([data-look="standard"], [data-look="standard"] *).ui-cla__card { padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-3-5); border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-cla__body { padding: var(--tc-space-4) var(--tc-space-5); }

/* ----- Head: the count and the key ----- */
.ui-cla__head { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-2); min-height: 24px; }
.ui-cla__count { margin-right: auto; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-cla__keys { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); }
.ui-cla__key { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: 24px; padding: 0 var(--tc-space-2); border-radius: var(--tc-radius-sm); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-cla__key:hover { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
.ui-cla__key[aria-pressed="true"] { background: var(--tc-claim-answer-bg); box-shadow: inset 0 0 0 1px var(--tc-border-selected); color: var(--tc-text-primary); }
.ui-cla__qtype { display: inline-flex; flex: none; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); white-space: nowrap; cursor: help; }
.ui-cla__key-n { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
/* The swatch: a short stretch of the claim's underline */
.ui-cla__swatch { flex: none; width: 14px; height: 6px; overflow: visible; fill: none; stroke: var(--tc-claim-answer-fg); stroke-width: 2; stroke-linecap: butt; }
.ui-cla__swatch [data-line="dotted"] { stroke-linecap: round; }
.ui-cla__swatch [data-line="double"] { stroke-width: 1.2; }
.ui-cla__swatch [data-line="wavy"] { stroke-width: 1.5; stroke-linecap: round; }

:where([data-look="clean"], [data-look="clean"] *).ui-cla__key { height: 22px; padding: 0 var(--tc-space-1-5); }

/* ----- Answer ----- */
.ui-cla__text { margin-top: var(--tc-space-2); }
:where([data-look="standard"], [data-look="standard"] *).ui-cla__text { color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-cla__text { margin-top: var(--tc-space-3); color: var(--tc-text-primary); }
.ui-cla__p { margin: 0; font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-loose); }
.ui-cla__p + .ui-cla__p { margin-top: var(--tc-space-2-5); }
.ui-cla__claim {
  margin: 0 calc(var(--tc-space-0-5) * -1);
  padding: var(--tc-space-0-5) var(--tc-space-0-5);
  border-radius: var(--tc-radius-xs);
  text-decoration-line: underline;
  text-decoration-style: var(--tc-claim-answer-line);
  text-decoration-color: var(--tc-claim-answer-fg);
  text-decoration-thickness: 1.5px;
  text-underline-offset: 4px;
  cursor: pointer;
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
  transition: background-color var(--tc-duration-base) var(--tc-ease-standard), color var(--tc-duration-base) var(--tc-ease-standard);
}
.ui-cla__claim[data-hl], .ui-cla__claim[aria-expanded="true"] { background: var(--tc-claim-answer-bg); color: var(--tc-text-primary); }
/* The key picks out one type: the rest step back – muted, still readable, underline faded */
.ui-cla__claim[data-dim] { color: var(--tc-text-muted); text-decoration-color: var(--tc-border-default); }
.ui-cla__keep { white-space: nowrap; }
/* The uncertainty mark: a small "?" after the claim */
.ui-cla__unc { display: inline-grid; place-items: center; width: 14px; height: 14px; margin-left: var(--tc-space-0-5); border-radius: var(--tc-radius-full); background: var(--tc-fill-default); box-shadow: inset 0 0 0 1px var(--tc-border-default); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-none); color: var(--tc-text-secondary); text-decoration: none; vertical-align: 1px; }
.ui-cla__unc--lg { flex: none; width: 18px; height: 18px; margin: var(--tc-space-0-5) 0 0; font-size: var(--tc-font-size-xs); }

/* ----- The open claim: unfolds in place ----- */
.ui-cla__fold { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows var(--tc-duration-slower) var(--tc-ease-move), opacity var(--tc-duration-base) var(--tc-ease-standard); }
.ui-cla__fold[data-open] { grid-template-rows: 1fr; opacity: 1; transition: grid-template-rows var(--tc-duration-slower) var(--tc-ease-move), opacity var(--tc-duration-slow) var(--tc-ease-standard) var(--tc-duration-instant); }
.ui-cla__clip { min-height: 0; overflow: hidden; }
:where([data-look="clean"], [data-look="clean"] *).ui-cla__clip { margin: 0 calc(var(--tc-space-1) * -1) calc(var(--tc-space-1) * -1); padding: 0 var(--tc-space-1) var(--tc-space-1); }
.ui-cla__detail { margin-top: var(--tc-space-3); padding: var(--tc-space-2-5) var(--tc-space-3) var(--tc-space-3); animation: ui-cla-in var(--tc-duration-slow) var(--tc-ease-standard) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-cla__detail { border-radius: var(--tc-radius-xl); background: var(--tc-surface-well); }
:where([data-look="clean"], [data-look="clean"] *).ui-cla__detail { border-radius: var(--tc-radius-md); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
.ui-cla__dt-head { display: flex; align-items: center; gap: var(--tc-space-2); min-height: 24px; }
.ui-cla__type { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-pill-h-lg); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-claim-answer-bg); font-size: var(--tc-pill-font-size-lg); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-claim-answer-fg); white-space: nowrap; }
.ui-cla__type .ui-cla__swatch { width: 11px; height: 5px; }
.ui-cla__recog { margin-left: calc(var(--tc-space-0-5) * -1); font-variant-numeric: tabular-nums; }
.ui-cla__spacer { flex: 1; }
.ui-cla__conf { display: flex; flex: 1; align-items: center; gap: var(--tc-space-2); min-width: 0; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-cla__conf-label { flex: none; }
.ui-cla__meter { position: relative; flex: 1; max-width: 96px; height: 4px; overflow: hidden; border-radius: var(--tc-radius-full); background: var(--tc-fill-default); }
.ui-cla__meter-fill { position: absolute; inset: 0 auto 0 0; border-radius: inherit; background: var(--tc-text-secondary); }
.ui-cla__conf[data-level="low"] .ui-cla__meter-fill { background: var(--tc-status-warning-fg); }
.ui-cla__conf-value { flex: none; color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-cla__close { display: grid; flex: none; place-items: center; width: 24px; height: 24px; margin-left: auto; margin-right: calc(var(--tc-space-1-5) * -1); border-radius: var(--tc-radius-sm); color: var(--tc-text-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-cla__close:hover { background: var(--tc-fill-default); color: var(--tc-text-primary); }
.ui-cla__dt-note { margin: var(--tc-space-2) 0 0; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-secondary); }
.ui-cla__cap { margin-top: var(--tc-space-1); }
.ui-cla__uncertain { display: flex; gap: var(--tc-space-2); margin-top: var(--tc-space-2); padding: var(--tc-space-2) var(--tc-space-2-5); border-radius: var(--tc-radius-md); background: var(--tc-fill-subtle); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-secondary); }
.ui-cla__sources { display: grid; gap: var(--tc-space-2-5); margin: var(--tc-space-3) 0 0; padding: 0; list-style: none; }
.ui-cla__source { min-width: 0; }
.ui-cla__src-head { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-2); min-width: 0; }
.ui-cla__glyph { display: grid; flex: none; place-items: center; width: 16px; height: 16px; border-radius: var(--tc-radius-xs); background: var(--tc-fill-default); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-none); color: var(--tc-text-secondary); }
.ui-cla__src-name { flex: 1 1 120px; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
.ui-cla__src-name a { color: inherit; text-decoration: underline; text-decoration-color: var(--tc-border-default); text-underline-offset: 2px; }
.ui-cla__src-name a:hover { text-decoration-color: currentColor; }
.ui-cla__src-date { font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); }
.ui-cla__validity { flex: none; }
.ui-cla__src-title { margin-top: var(--tc-space-1); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-cla__quote { margin: var(--tc-space-1-5) 0 0; padding: 0 0 0 var(--tc-space-2-5); border-left: 2px solid var(--tc-border-default); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-secondary); }
.ui-cla__dt-actions { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); margin-top: var(--tc-space-3); }
/* Send to verification: the library's secondary button */
.ui-cla__btn { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2-5) 0 var(--tc-space-2); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); white-space: nowrap; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-cla__btn { height: var(--tc-control-h-md); border-radius: var(--tc-control-radius-md); }
.ui-cla__btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-cla__btn[data-done] { box-shadow: none; background: var(--tc-fill-subtle); color: var(--tc-status-success-fg); cursor: default; }
.ui-cla__btn-icon { display: grid; place-items: center; animation: ui-cla-in var(--tc-duration-moderate) var(--tc-ease-standard) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-cla__btn .ui-cla__icon { color: var(--tc-icon-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-cla__btn[data-done] .ui-cla__icon { color: inherit; }

/* ----- Counter-position: folded under the answer ----- */
.ui-cla__counter { margin-top: var(--tc-space-3); padding-top: var(--tc-space-2); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-cla__counter-toggle { display: flex; align-items: center; gap: var(--tc-space-2); width: 100%; min-height: 28px; border-radius: var(--tc-radius-sm); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
.ui-cla__counter-toggle:hover { color: var(--tc-text-primary); }
.ui-cla__counter-icon { display: grid; place-items: center; color: var(--tc-text-muted); }
.ui-cla__counter-label { flex: 1; }
.ui-cla__chev { display: grid; place-items: center; color: var(--tc-text-muted); transition: transform var(--tc-duration-base) var(--tc-ease-move); }
.ui-cla__counter[data-open] .ui-cla__chev { transform: rotate(90deg); }
.ui-cla__counter-text { margin: var(--tc-space-1) 0 var(--tc-space-1); padding-left: var(--tc-space-6); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-secondary); }

/* ----- The line under the answer ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-cla__foot { display: flex; align-items: center; gap: var(--tc-space-2); min-height: 36px; padding: var(--tc-space-0-5) var(--tc-space-1) 0 var(--tc-space-2-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-cla__foot { display: flex; align-items: center; gap: var(--tc-space-3); height: 44px; padding: 0 var(--tc-space-5); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-cla__caption { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
@keyframes ui-cla-in { from { opacity: 0; filter: blur(2px); } }
@container (max-width: 400px) {
:where([data-look="standard"], [data-look="standard"] *).ui-cla__card { padding: var(--tc-space-3) var(--tc-space-3-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-cla__body { padding: var(--tc-space-3-5) var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-cla__foot { padding: 0 var(--tc-space-4); }
  .ui-cla__conf-label { display: none; }
  .ui-cla__keys { flex-basis: 100%; }
}
@media (pointer: coarse) {
  .ui-cla__key { height: 32px; }
  .ui-cla__close { width: 32px; height: 32px; margin-right: calc(var(--tc-space-2) * -1); }
  .ui-cla__btn { height: 34px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="cla"] *, [data-ui="cla"] *::before, [data-ui="cla"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-claim-answer")) customElements.define("tc-claim-answer", TcClaimAnswer);

declare global {
  interface HTMLElementTagNameMap {
    "tc-claim-answer": TcClaimAnswer;
  }
}
