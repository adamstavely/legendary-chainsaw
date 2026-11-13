import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController } from "./internal/controllers";
import { ModalController } from "./internal/modal";

/*
 * <tc-review-queue> – grade real outputs one at a time, from the keyboard. Each item shows the input, the output and
 * (when there is one) the reference answer; under it, a quick grade per criterion – pass or fail, or a 1–5 scale – a
 * note, and the overall verdict, suggested from the grades. Submit and the next item comes up.
 *   · keys work anywhere in the queue except while typing: P / F or 1–5 grade the current criterion (the focused one,
 *     else the first without a grade) and move on; V then P / F sets the verdict; Enter submits; J / K go to the next
 *     or previous item; S skips; U undoes the last submit; N goes to the note; ? lists the keys
 *   · progress reads "12 of 40 · 3 skipped" with a bar; when every item is done, "Review skipped" goes back to them
 *   · a submit fires a cancelable tc-grade ({ id, grades, verdict, note }); prevented, the item stays open
 * Standard: the header and progress on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-review-queue .items=${items} .criteria=${criteria} @tc-grade=${save}></tc-review-queue>
 */

export type ReviewQueueCriterion = {
  id: string;
  label: string;
  /** The question it asks, in a line */
  description?: string;
  /** Pass or fail (the default), or a number on a scale */
  kind?: "pass-fail" | "scale";
  /** For a scale: its ends, 1 and 5 by default */
  min?: number;
  max?: number;
};

export type ReviewQueueItem = {
  id: string;
  /** What the model was asked */
  input: string;
  /** What it answered */
  output: string;
  /** The answer it should have given, when known */
  reference?: string;
  /** A line about where it came from – "Live chat · 12 Nov" */
  source?: string;
};

export type ReviewQueueGradeValue = "pass" | "fail" | number;
export type ReviewQueueVerdict = "pass" | "fail";

/** What tc-grade carries */
export type ReviewQueueGrade = {
  id: string;
  /** A grade per criterion, by the criterion's id */
  grades: Record<string, ReviewQueueGradeValue>;
  verdict: ReviewQueueVerdict;
  note: string;
};

/** Where an item stands */
export type ReviewQueueResult = ({ status: "graded" } & Omit<ReviewQueueGrade, "id">) | { status: "skipped" };

export type ReviewQueueIndexChange = { index: number; item: ReviewQueueItem | undefined };
export type ReviewQueueResultsChange = { results: Record<string, ReviewQueueResult>; id: string };

export const REVIEW_CRITERIA: ReviewQueueCriterion[] = [
  { id: "correct", label: "Correct", description: "Is everything it says true?" },
  { id: "grounded", label: "Grounded", description: "Does it stick to the policy text?" },
  { id: "helpful", label: "Helpful", description: "How well does it answer what was asked?", kind: "scale", min: 1, max: 5 },
];

const SHORTCUTS: [string, string][] = [
  ["P / F", "Pass or fail the current criterion"],
  ["1 – 5", "Score the current criterion"],
  ["V, then P / F", "Set the overall verdict"],
  ["Enter", "Submit and go to the next item"],
  ["J / K", "Next or previous item"],
  ["S", "Skip this item"],
  ["U", "Undo the last submit"],
  ["N", "Write a note"],
  ["?", "Show these keys"],
];

const scaleOf = (c: ReviewQueueCriterion) => {
  const min = Math.round(c.min ?? 1);
  const max = Math.max(min + 1, Math.round(c.max ?? 5));
  return Array.from({ length: max - min + 1 }, (_, i) => min + i);
};
const isScale = (c: ReviewQueueCriterion) => c.kind === "scale";

/** The verdict the grades suggest: fail when any pass/fail criterion failed or a scale sits in its lower half */
export function suggestVerdict(criteria: ReviewQueueCriterion[], grades: Record<string, ReviewQueueGradeValue>): ReviewQueueVerdict | null {
  if (!criteria.length || criteria.some((c) => grades[c.id] === undefined)) return null;
  const failed = criteria.some((c) => {
    const g = grades[c.id];
    if (!isScale(c)) return g === "fail";
    const s = scaleOf(c);
    return typeof g === "number" && g < (s[0] + s[s.length - 1]) / 2;
  });
  return failed ? "fail" : "pass";
}

/* ---------- Icons (Lucide, ISC – lucide.dev) ---------- */
const glyph = (d: TemplateResult, cls = "ui-rvq__glyph") => html`<svg class=${cls} viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
/** A stack of cards with a tick: a queue being worked through */
const queueMark = svg`<rect x="3" y="7" width="14" height="14" rx="2"></rect><path d="M7 3h12a2 2 0 0 1 2 2v12"></path><path d="M7 14l2.5 2.5L14 12"></path>`;
const checkIcon = glyph(svg`<path d="M5 12.5l4.5 4.5L19 7.5"></path>`);
const xIcon = glyph(svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`);
const leftIcon = glyph(svg`<path d="m15 18-6-6 6-6"></path>`);
const rightIcon = glyph(svg`<path d="m9 18 6-6-6-6"></path>`);
const keyboardIcon = glyph(svg`<rect x="2" y="5" width="20" height="14" rx="2"></rect><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M7 15h10"></path>`);

let instances = 0;

/**
 * Grade real outputs one at a time from the keyboard: per-criterion grades, a note and a verdict, with progress and undo.
 * @tag tc-review-queue
 * @fires tc-grade - An item was submitted ({ id, grades, verdict, note }: ReviewQueueGrade); cancelable – prevented, it stays open
 * @fires tc-skip - An item was skipped ({ id }); cancelable
 * @fires tc-undo - The last submit was undone ({ id }); cancelable
 * @fires tc-index-change - Another item came up ({ index, item }: ReviewQueueIndexChange); cancelable
 * @fires tc-results-change - An item was graded, skipped or undone ({ results, id }: ReviewQueueResultsChange); cancelable
 */
export class TcReviewQueue extends TcElement {
  static override ui = "rvq";

  /** The heading */
  @property() accessor heading = "Review queue";
  /** The outputs to grade, in order */
  @property({ attribute: false }) accessor items: ReviewQueueItem[] = [];
  /** What each output is graded on */
  @property({ attribute: false }) accessor criteria: ReviewQueueCriterion[] = REVIEW_CRITERIA;
  /** The item showing. Changed by the user unless a tc-index-change listener prevents it */
  @property({ type: Number }) accessor index = 0;
  /** Where each item stands, by id. Changed by submits, skips and undo unless a tc-results-change listener prevents it */
  @property({ attribute: false }) accessor results: Record<string, ReviewQueueResult> = {};
  /** Turns the single-key shortcuts off (buttons still work) */
  @property({ type: Boolean, attribute: "no-shortcuts" }) accessor noShortcuts = false;

  /** @internal The grades for the item showing, not yet submitted */
  @state() accessor grades: Record<string, ReviewQueueGradeValue> = {};
  /** @internal The verdict picked by hand; null follows the suggestion */
  @state() accessor verdict: ReviewQueueVerdict | null = null;
  /** @internal */
  @state() accessor note = "";
  /** @internal Criteria without a grade when Submit was pressed */
  @state() accessor missing: string[] = [];
  /** @internal The shortcuts dialog is open */
  @state() accessor keysOpen = false;
  /** @internal V was pressed: the next P / F sets the verdict */
  @state() accessor verdictKey = false;
  /** @internal What the status region says */
  @state() accessor spoken = "";

  private readonly uid = `tc-rvq${++instances}`;
  /** Submits, newest last, for Undo */
  private history: { id: string; index: number; previous: ReviewQueueResult | undefined }[] = [];
  private loadedFor = "";

  private readonly modal = new ModalController(this, {
    dialog: () => this.querySelector<HTMLDialogElement>(".ui-rvq__dialog"),
    focus: () => this.querySelector<HTMLElement>(".ui-rvq__dialog-close"),
  });

  constructor() {
    super();
    // Submit swaps for "Review skipped" at the end; focus never drops to <body>
    new FocusRescueController(this, () => this.querySelector<HTMLElement>(".ui-rvq__submit, .ui-rvq__again, .ui-rvq__card"));
    this.addEventListener("keydown", (e) => this.onKey(e));
  }

  /** The item showing */
  get current(): ReviewQueueItem | undefined {
    return this.items[this.index];
  }

  /** How many are graded and skipped */
  get counts() {
    let graded = 0;
    let skipped = 0;
    for (const item of this.items) {
      const r = this.results[item.id];
      if (r?.status === "graded") graded++;
      else if (r?.status === "skipped") skipped++;
    }
    return { graded, skipped, total: this.items.length };
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("items") && this.items.length && this.index > this.items.length - 1) this.index = this.items.length - 1;
    // Another item came up: its saved grades, or a clean slate
    const item = this.current;
    const key = item ? `${item.id}` : "";
    // …or the page graded the item showing from outside
    const regraded = changed.has("results") && item && this.results[item.id]?.status === "graded" && this.results[item.id] !== (changed.get("results") as Record<string, ReviewQueueResult> | undefined)?.[item.id];
    if (key !== this.loadedFor || regraded) {
      this.loadedFor = key;
      const r = item ? this.results[item.id] : undefined;
      this.grades = r?.status === "graded" ? { ...r.grades } : {};
      this.verdict = r?.status === "graded" ? r.verdict : null;
      this.note = r?.status === "graded" ? r.note : "";
      this.missing = [];
      this.verdictKey = false;
    }
    if (changed.has("grades") && this.missing.length) this.missing = this.missing.filter((id) => this.grades[id] === undefined);
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    this.modal.sync(this.keysOpen);
  }

  /** @internal The verdict to submit: picked by hand, else suggested */
  private get finalVerdict(): ReviewQueueVerdict | null {
    return this.verdict ?? suggestVerdict(this.criteria, this.grades);
  }

  /** @internal Moves to another item unless a listener prevents it */
  private go(index: number, say = true) {
    if (!this.items.length) return false;
    const next = Math.max(0, Math.min(this.items.length - 1, index));
    if (next === this.index) return false;
    if (!this.emit<ReviewQueueIndexChange>("tc-index-change", { index: next, item: this.items[next] }, { cancelable: true })) return false;
    this.index = next;
    // Moving after the queue was finished shows the item again
    if (this.isFinished) this.reviewing = true;
    if (say) this.spoken = `Item ${next + 1} of ${this.items.length}`;
    return true;
  }

  /** @internal Applies a results change unless a listener prevents it */
  private setResult(id: string, result: ReviewQueueResult | undefined) {
    const results = { ...this.results };
    if (result) results[id] = result;
    else delete results[id];
    if (!this.emit<ReviewQueueResultsChange>("tc-results-change", { results, id }, { cancelable: true })) return false;
    this.results = results;
    return true;
  }

  /** @internal Every item is graded or skipped */
  private get isFinished() {
    const { graded, skipped, total } = this.counts;
    return total > 0 && graded + skipped === total;
  }

  /** @internal The next item that's neither graded nor skipped after `from`, wrapping; while going back over skipped
   *  ones, the next skipped */
  private nextOpen(from: number) {
    for (const want of this.reviewing ? [undefined, "skipped"] : [undefined]) {
      for (let k = 1; k <= this.items.length; k++) {
        const i = (from + k) % this.items.length;
        if (this.results[this.items[i].id]?.status === want && i !== from) return i;
      }
    }
    return -1;
  }

  /** @internal After a submit or skip: the next item to do, or the end */
  private advance() {
    const next = this.nextOpen(this.index);
    if (next >= 0) this.go(next, false);
    else this.reviewing = false;
  }

  /** @internal The criterion keys act on: the one focus is in, else the first without a grade */
  private activeCriterion(): ReviewQueueCriterion | undefined {
    const focused = (document.activeElement as HTMLElement | null)?.closest<HTMLElement>("[data-criterion]")?.dataset.criterion;
    return this.criteria.find((c) => c.id === focused) ?? this.criteria.find((c) => this.grades[c.id] === undefined);
  }

  /** @internal */
  private grade(c: ReviewQueueCriterion, value: ReviewQueueGradeValue, focus: "same" | "next" | "none" = "none") {
    this.grades = { ...this.grades, [c.id]: value };
    const word = typeof value === "number" ? `${value}` : value === "pass" ? "Pass" : "Fail";
    this.spoken = `${c.label}: ${word}`;
    if (focus === "none") return;
    const at = this.criteria.indexOf(c);
    const target = focus === "next" ? (this.criteria.slice(at + 1).find((x) => this.grades[x.id] === undefined) ?? this.criteria[at + 1]) : c;
    void this.updateComplete.then(() => {
      if (!target) return this.querySelector<HTMLElement>(".ui-rvq__submit")?.focus();
      const group = this.querySelector<HTMLElement>(`[data-criterion="${target.id}"]`);
      (group?.querySelector<HTMLElement>('[aria-checked="true"]') ?? group?.querySelector<HTMLElement>('[role="radio"]'))?.focus();
    });
  }

  /** @internal Submits the item showing */
  submit() {
    const item = this.current;
    if (!item) return;
    const missing = this.criteria.filter((c) => this.grades[c.id] === undefined).map((c) => c.id);
    this.missing = missing;
    if (missing.length) {
      const first = this.criteria.find((c) => c.id === missing[0])!;
      this.spoken = `Grade ${first.label} before submitting`;
      void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-criterion="${first.id}"] [role="radio"]`)?.focus());
      return;
    }
    const verdict = this.finalVerdict!;
    const detail: ReviewQueueGrade = { id: item.id, grades: { ...this.grades }, verdict, note: this.note.trim() };
    if (!this.emit<ReviewQueueGrade>("tc-grade", detail, { cancelable: true })) return;
    const previous = this.results[item.id];
    if (!this.setResult(item.id, { status: "graded", grades: detail.grades, verdict, note: detail.note })) return;
    this.history.push({ id: item.id, index: this.index, previous });
    const { graded, total } = this.counts;
    this.advance();
    this.spoken = `Submitted, ${verdict === "pass" ? "passed" : "failed"}. ${graded} of ${total} graded`;
    void this.updateComplete.then(() => this.focusStart());
  }

  /** @internal */
  skip() {
    const item = this.current;
    if (!item) return;
    if (!this.emit("tc-skip", { id: item.id }, { cancelable: true })) return;
    if (this.results[item.id]?.status !== "graded" && !this.setResult(item.id, { status: "skipped" })) return;
    this.advance();
    this.spoken = `Skipped item ${this.items.indexOf(item) + 1}`;
    void this.updateComplete.then(() => this.focusStart());
  }

  /** @internal Takes back the last submit and goes to that item */
  undo() {
    const last = this.history[this.history.length - 1];
    if (!last) {
      this.spoken = "Nothing to undo";
      return;
    }
    if (!this.emit("tc-undo", { id: last.id }, { cancelable: true })) return;
    const graded = this.results[last.id];
    if (!this.setResult(last.id, last.previous)) return;
    this.history.pop();
    const at = this.items.findIndex((i) => i.id === last.id);
    if (at >= 0) this.go(at, false);
    // The undone grades come back to edit
    if (graded?.status === "graded") {
      this.loadedFor = last.id;
      this.grades = { ...graded.grades };
      this.verdict = graded.verdict;
      this.note = graded.note;
    }
    this.spoken = `Undid the grade for item ${at + 1}`;
    void this.updateComplete.then(() => this.focusStart());
  }

  /** @internal Focus on the first criterion of the item showing, or the end screen's button */
  private focusStart() {
    const target =
      this.querySelector<HTMLElement>(`[data-criterion] [aria-checked="true"]`) ??
      this.querySelector<HTMLElement>(`[data-criterion] [role="radio"]`) ??
      this.querySelector<HTMLElement>(".ui-rvq__again") ??
      this.querySelector<HTMLElement>(".ui-rvq__card");
    target?.focus();
  }

  /** @internal The single-key shortcuts; never while typing, never with a modifier */
  private onKey(e: KeyboardEvent) {
    if (this.noShortcuts || e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
    const t = e.target as HTMLElement;
    if (t.closest("textarea, input, select, [contenteditable=''], [contenteditable='true'], dialog")) return;
    const k = e.key;
    const lower = k.length === 1 ? k.toLowerCase() : k;
    // Enter on a button presses that button; elsewhere it submits
    if (k === "Enter") {
      if (t.closest("button") && !t.closest('[role="radio"]')) return;
      e.preventDefault();
      this.submit();
      return;
    }
    if (k === "?") {
      e.preventDefault();
      this.keysOpen = true;
      return;
    }
    if (!this.current) return;
    if (this.verdictKey && (lower === "p" || lower === "f")) {
      e.preventDefault();
      this.verdictKey = false;
      this.verdict = lower === "p" ? "pass" : "fail";
      this.spoken = `Verdict: ${this.verdict === "pass" ? "Pass" : "Fail"}`;
      return;
    }
    this.verdictKey = false;
    if (lower === "v") {
      e.preventDefault();
      this.verdictKey = true;
      this.spoken = "Verdict: press P or F";
      return;
    }
    if (lower === "p" || lower === "f" || /^[0-9]$/.test(k)) {
      const c = this.activeCriterion();
      if (!c) return;
      if (isScale(c)) {
        const n = Number(k);
        if (!scaleOf(c).includes(n)) return;
        e.preventDefault();
        this.grade(c, n, t.closest("[data-criterion]") ? "next" : "none");
      } else if (lower === "p" || lower === "f") {
        e.preventDefault();
        this.grade(c, lower === "p" ? "pass" : "fail", t.closest("[data-criterion]") ? "next" : "none");
      }
      return;
    }
    const act: Record<string, () => void> = {
      j: () => this.go(this.index + 1),
      k: () => this.go(this.index - 1),
      s: () => this.skip(),
      u: () => this.undo(),
      n: () => this.querySelector<HTMLTextAreaElement>(".ui-rvq__note")?.focus(),
    };
    if (act[lower]) {
      e.preventDefault();
      act[lower]();
    }
  }

  /** @internal APG radio group keys inside one criterion: arrows move and pick, wrapping */
  private onGroupKey(e: KeyboardEvent, c: ReviewQueueCriterion, values: ReviewQueueGradeValue[]) {
    const step: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    const at = values.indexOf(this.grades[c.id]);
    let next: number;
    if (e.key in step) next = at < 0 ? (step[e.key] > 0 ? 0 : values.length - 1) : (at + step[e.key] + values.length) % values.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = values.length - 1;
    else return;
    e.preventDefault();
    e.stopPropagation();
    this.grade(c, values[next], "same");
  }

  /** @internal One criterion: its name and question, and its grades as a radio group */
  private criterion(c: ReviewQueueCriterion) {
    const id = `${this.uid}-c-${c.id}`;
    const values: ReviewQueueGradeValue[] = isScale(c) ? scaleOf(c) : ["pass", "fail"];
    const current = this.grades[c.id];
    const missing = this.missing.includes(c.id);
    const tab = current !== undefined ? current : values[0];
    const described = [c.description ? `${id}-desc` : "", missing ? `${id}-err` : ""].filter(Boolean).join(" ");
    return html`<li class="ui-rvq__crit" ?data-missing=${missing}>
      <div class="ui-rvq__crit-text">
        <span class="ui-rvq__crit-label" id=${`${id}-label`}>${c.label}</span>
        ${c.description ? html`<span class="ui-rvq__crit-desc" id=${`${id}-desc`}>${c.description}</span>` : nothing}
        ${missing ? html`<span class="ui-rvq__error" id=${`${id}-err`}>Pick a grade</span>` : nothing}
      </div>
      <div
        class="ui-rvq__scale"
        role="radiogroup"
        data-criterion=${c.id}
        data-kind=${isScale(c) ? "scale" : "pass-fail"}
        aria-labelledby=${`${id}-label`}
        aria-describedby=${ifDefined(described || undefined)}
        aria-required="true"
        aria-invalid=${ifDefined(missing ? "true" : undefined)}
        @keydown=${(e: KeyboardEvent) => this.onGroupKey(e, c, values)}
      >
        ${values.map((v) => {
          const on = v === current;
          const word = v === "pass" ? "Pass" : v === "fail" ? "Fail" : `${v}`;
          return html`<button
            type="button"
            role="radio"
            class="ui-rvq__opt"
            data-value=${v}
            aria-checked=${on ? "true" : "false"}
            tabindex=${v === tab ? 0 : -1}
            @click=${() => this.grade(c, v)}
          >${v === "pass" ? checkIcon : v === "fail" ? xIcon : nothing}${word}</button>`;
        })}
      </div>
    </li>`;
  }

  /** @internal Input, output and reference */
  private block(label: string, text: string, kind: string) {
    return html`<section class="ui-rvq__block" data-kind=${kind} aria-label=${label}>
      <h4 class="ui-rvq__label">${label}</h4>
      <p class="ui-rvq__text">${text}</p>
    </section>`;
  }

  /** @internal When every item is graded or skipped */
  private done() {
    const { graded, skipped, total } = this.counts;
    const firstSkipped = this.items.findIndex((i) => this.results[i.id]?.status === "skipped");
    return html`<div class="ui-rvq__done">
      <span class="ui-rvq__done-mark">${checkIcon}</span>
      <p class="ui-rvq__done-title">All ${total} reviewed</p>
      <p class="ui-rvq__done-sub">${graded} graded${skipped ? ` · ${skipped} skipped` : ""}</p>
      <div class="ui-rvq__done-actions">
        ${firstSkipped >= 0
          ? html`<button type="button" class="tc-btn-sm ui-rvq__again" @click=${() => {
              this.go(firstSkipped);
              this.reviewing = true;
            }}>Review skipped</button>`
          : nothing}
        ${this.history.length ? html`<button type="button" class="tc-btn-sm ui-rvq__undo" @click=${() => this.undo()}>Undo last</button>` : nothing}
      </div>
    </div>`;
  }

  /** @internal Showing an item again after the queue was finished ("Review skipped") */
  @state() private accessor reviewing = false;

  protected override render() {
    const titleId = `${this.uid}-title`;
    const { graded, skipped, total } = this.counts;
    const item = this.current;
    const finished = this.isFinished && !this.reviewing;
    const verdict = this.finalVerdict;
    const suggested = this.verdict === null && verdict !== null;
    const pct = total ? Math.round((graded / total) * 100) : 0;
    const progress = `${graded} of ${total}${skipped ? ` · ${skipped} skipped` : ""}`;
    return html`
      ${cardHead({
        icon: queueMark,
        title: this.heading,
        id: titleId,
        aside: html`<span class="ui-rvq__progress"><span class="ui-rvq__progress-text">${progress}</span>
          <span class="ui-rvq__bar" role="progressbar" aria-label="Graded" aria-valuemin="0" aria-valuemax=${total} aria-valuenow=${graded} aria-valuetext=${`${progress}`}>
            <span class="ui-rvq__bar-fill" style=${`inline-size: ${pct}%`}></span>
          </span></span>`,
      })}
      <div class="ui-rvq__card" role="group" aria-labelledby=${titleId} aria-describedby=${`${this.uid}-keys`} tabindex="-1">
        <span class="tc-sr-only" id=${`${this.uid}-keys`}>${this.noShortcuts ? "" : "Shortcuts: P or F to pass or fail, 1 to 5 to score, Enter to submit, J and K for next and previous, S to skip, U to undo, question mark for all keys."}</span>
        ${!total
          ? html`<p class="ui-rvq__empty">Nothing to review.</p>`
          : finished
            ? this.done()
            : item
              ? html`
                  <div class="ui-rvq__nav">
                    <button type="button" class="ui-rvq__icon-btn" ?disabled=${this.index === 0} @click=${() => this.go(this.index - 1)}>${leftIcon}<span class="tc-sr-only">Previous item</span></button>
                    <span class="ui-rvq__pos">Item ${this.index + 1} of ${total}${this.results[item.id]?.status === "graded" ? html` · <span class="ui-rvq__state">graded</span>` : this.results[item.id]?.status === "skipped" ? html` · <span class="ui-rvq__state">skipped</span>` : nothing}</span>
                    ${item.source ? html`<span class="ui-rvq__source">${item.source}</span>` : nothing}
                    <button type="button" class="ui-rvq__icon-btn" ?disabled=${this.index >= total - 1} @click=${() => this.go(this.index + 1)}>${rightIcon}<span class="tc-sr-only">Next item</span></button>
                  </div>
                  <div class="ui-rvq__blocks" data-ref=${item.reference ? "yes" : "no"}>
                    ${this.block("Input", item.input, "input")}
                    ${this.block("Output", item.output, "output")}
                    ${item.reference ? this.block("Reference", item.reference, "reference") : nothing}
                  </div>
                  <ol class="ui-rvq__crits" aria-label="Criteria">${this.criteria.map((c) => this.criterion(c))}</ol>
                  <div class="ui-rvq__bottom">
                    <div class="ui-rvq__note-wrap">
                      <label class="ui-rvq__label" for=${`${this.uid}-note`}>Note<span class="ui-rvq__optional"> · optional</span></label>
                      <textarea
                        class="ui-rvq__note"
                        id=${`${this.uid}-note`}
                        rows="2"
                        .value=${live(this.note)}
                        @input=${(e: InputEvent) => (this.note = (e.target as HTMLTextAreaElement).value)}
                        @keydown=${(e: KeyboardEvent) => {
                          if (e.key === "Escape") {
                            e.preventDefault();
                            this.querySelector<HTMLElement>(".ui-rvq__card")?.focus();
                          } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                            e.preventDefault();
                            this.submit();
                          }
                        }}
                      ></textarea>
                    </div>
                    <div class="ui-rvq__verdict">
                      <span class="ui-rvq__label" id=${`${this.uid}-v`}>Verdict${suggested ? html`<span class="ui-rvq__optional"> · suggested</span>` : nothing}</span>
                      <div class="ui-rvq__scale" role="radiogroup" aria-labelledby=${`${this.uid}-v`} data-verdict
                        @keydown=${(e: KeyboardEvent) => {
                          if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)) return;
                          e.preventDefault();
                          e.stopPropagation();
                          this.verdict = verdict === "pass" ? "fail" : "pass";
                          void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-verdict] [data-value="${this.verdict}"]`)?.focus());
                        }}>
                        ${(["pass", "fail"] as const).map(
                          (v) => html`<button type="button" role="radio" class="ui-rvq__opt" data-value=${v} aria-checked=${verdict === v ? "true" : "false"} tabindex=${(verdict ?? "pass") === v ? 0 : -1} @click=${() => (this.verdict = v)}>
                            ${v === "pass" ? checkIcon : xIcon}${v === "pass" ? "Pass" : "Fail"}
                          </button>`,
                        )}
                      </div>
                    </div>
                  </div>
                  <div class="ui-rvq__foot">
                    <button type="button" class="ui-rvq__link" @click=${() => (this.keysOpen = true)}>${keyboardIcon}Keys</button>
                    ${this.history.length ? html`<button type="button" class="ui-rvq__link ui-rvq__undo" @click=${() => this.undo()}>Undo last</button>` : nothing}
                    <button type="button" class="tc-btn-sm ui-rvq__skip" @click=${() => this.skip()}>Skip</button>
                    <button type="button" class="ui-rvq__submit" @click=${() => this.submit()}>Submit<kbd class="ui-rvq__kbd" aria-hidden="true">↵</kbd></button>
                  </div>
                `
              : nothing}
      </div>
      <dialog
        class="ui-rvq__dialog"
        aria-labelledby=${`${this.uid}-dlg`}
        data-look=${this.resolvedLook}
        @cancel=${(e: Event) => {
          e.preventDefault();
          this.keysOpen = false;
        }}
        @close=${() => {
          if (this.modal.ownClose()) return;
          this.keysOpen = false;
        }}
      >
        <div class="ui-rvq__dialog-head">
          <h2 class="ui-rvq__dialog-title" id=${`${this.uid}-dlg`}>Keyboard shortcuts</h2>
          <button type="button" class="ui-rvq__icon-btn ui-rvq__dialog-close" @click=${() => (this.keysOpen = false)}>${xIcon}<span class="tc-sr-only">Close</span></button>
        </div>
        <table class="ui-rvq__keys">
          <thead><tr><th scope="col">Key</th><th scope="col">What it does</th></tr></thead>
          <tbody>${SHORTCUTS.map(([k, what]) => html`<tr><td><kbd class="ui-rvq__kbd">${k}</kbd></td><td>${what}</td></tr>`)}</tbody>
        </table>
        <p class="ui-rvq__dialog-note">Keys don't work while you're typing in the note – press Escape to leave it.</p>
      </dialog>
      <span class="tc-sr-only" role="status">${this.spoken}</span>
    `;
  }

  static override css = /* css */ `
[data-ui="rvq"] {
  --tc-rvq-text-h: 180px;
  position: relative;
  box-sizing: border-box;
  display: block;
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
  container: ui-rvq / inline-size;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="rvq"] { padding: 0; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
[data-ui="rvq"] *, [data-ui="rvq"] *::before, [data-ui="rvq"] *::after, .ui-rvq__dialog * { box-sizing: border-box; }
[data-ui="rvq"] :is(ol, p, h4, h2), .ui-rvq__dialog :is(p, h2) { margin: 0; padding: 0; }
:where([data-ui="rvq"]) button, :where(.ui-rvq__dialog) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="rvq"] button:focus-visible, .ui-rvq__dialog button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-rvq__card:focus { outline: none; }
.ui-rvq__card:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="rvq"] button:disabled { cursor: default; color: var(--tc-text-disabled); }
.ui-rvq__glyph { width: 14px; height: 14px; flex: none; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *) .ui-rvq__glyph { stroke-width: 1.6; }
/* ----- The header's progress ----- */
.ui-rvq__progress { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-2); color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; }
.ui-rvq__bar { display: block; width: 72px; height: 6px; overflow: hidden; border-radius: var(--tc-radius-full); background: var(--tc-fill-default); }
.ui-rvq__bar-fill { display: block; height: 100%; background: var(--tc-accent); transition: inline-size var(--tc-duration-base) var(--tc-ease-move); }
/* ----- The card ----- */
.ui-rvq__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvq__card { border-top: var(--tc-hairline) solid var(--tc-divider); border-radius: 0 0 var(--tc-card-radius) var(--tc-card-radius); background: none; box-shadow: none; }
.ui-rvq__empty { padding: var(--tc-space-6) var(--tc-space-4); color: var(--tc-text-muted); text-align: center; }
.ui-rvq__nav { display: flex; align-items: center; gap: var(--tc-space-2); padding: var(--tc-space-2) var(--tc-space-3); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-rvq__pos { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-rvq__state { font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); }
.ui-rvq__source { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
.ui-rvq__nav .ui-rvq__icon-btn:last-child { margin-left: auto; }
.ui-rvq__icon-btn { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-text-secondary); }
[data-ui="rvq"] .ui-rvq__icon-btn:hover:not(:disabled), .ui-rvq__dialog .ui-rvq__icon-btn:hover { background: var(--tc-fill-default); color: var(--tc-text-primary); }
/* Input, output and reference: side by side when there's room */
.ui-rvq__blocks { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr); gap: var(--tc-space-3); padding: var(--tc-space-3); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-rvq__blocks[data-ref="yes"] { grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr) minmax(0, 1.2fr); }
.ui-rvq__block { display: grid; align-content: start; gap: var(--tc-space-1); min-width: 0; }
.ui-rvq__label { display: block; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvq__label { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-rvq__optional { font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); text-transform: none; letter-spacing: normal; }
.ui-rvq__text { max-height: var(--tc-rvq-text-h); overflow: auto; padding: var(--tc-space-2) var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-surface-well); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-relaxed); color: var(--tc-text-primary); white-space: pre-wrap; overflow-wrap: anywhere; }
.ui-rvq__block[data-kind="reference"] .ui-rvq__text { box-shadow: inset 2px 0 0 var(--tc-status-success-solid); }
/* ----- Criteria ----- */
.ui-rvq__crits { list-style: none; border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-rvq__crit { display: flex; align-items: center; gap: var(--tc-space-2) var(--tc-space-4); padding: var(--tc-space-2) var(--tc-space-3); }
.ui-rvq__crit + .ui-rvq__crit { border-top: var(--tc-hairline) solid var(--tc-border-subtle); }
.ui-rvq__crit-text { display: grid; flex: 1; gap: var(--tc-space-0-5); min-width: 0; }
.ui-rvq__crit-label { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-rvq__crit-desc { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-rvq__error { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-status-danger-fg); }
.ui-rvq__scale { display: inline-flex; flex: none; padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
.ui-rvq__crit[data-missing] .ui-rvq__scale { box-shadow: inset 0 0 0 1px var(--tc-status-danger-solid); }
.ui-rvq__opt { display: inline-flex; align-items: center; justify-content: center; gap: var(--tc-space-1); min-width: 36px; height: calc(var(--tc-control-h-sm) - 2 * var(--tc-seg-pad)); padding: 0 var(--tc-space-2); border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
[data-ui="rvq"] .ui-rvq__opt:hover { color: var(--tc-text-primary); }
[data-ui="rvq"] .ui-rvq__opt[aria-checked="true"] { background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow); color: var(--tc-text-primary); }
[data-ui="rvq"] .ui-rvq__opt[data-value="pass"][aria-checked="true"] { color: var(--tc-status-success-fg); }
[data-ui="rvq"] .ui-rvq__opt[data-value="fail"][aria-checked="true"] { color: var(--tc-status-danger-fg); }
/* ----- Note and verdict ----- */
.ui-rvq__bottom { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: var(--tc-space-3); align-items: start; padding: var(--tc-space-3); }
.ui-rvq__note-wrap, .ui-rvq__verdict { display: grid; gap: var(--tc-space-1-5); min-width: 0; }
.ui-rvq__note { display: block; width: 100%; min-height: 56px; padding: var(--tc-space-2) var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font: inherit; font-size: var(--tc-field-font-size); color: var(--tc-text-primary); resize: vertical; outline: none; }
.ui-rvq__note:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-rvq__note:focus { box-shadow: var(--tc-field-shadow-focus); }
/* ----- The foot ----- */
.ui-rvq__foot { display: flex; align-items: center; gap: var(--tc-space-2); padding: var(--tc-space-3); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-rvq__link { display: inline-flex; align-items: center; gap: var(--tc-space-1); min-height: var(--tc-control-h-sm); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
[data-ui="rvq"] .ui-rvq__link:hover { color: var(--tc-text-primary); }
.ui-rvq__skip { margin-left: auto; }
.ui-rvq__submit { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; }
[data-ui="rvq"] .ui-rvq__submit:hover { background: var(--tc-action-primary-bg-hover); }
.ui-rvq__kbd { display: inline-grid; place-items: center; min-width: 18px; padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-xs); box-shadow: inset 0 0 0 var(--tc-hairline) currentColor; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-xs); }
/* ----- Done ----- */
.ui-rvq__done { display: grid; justify-items: center; gap: var(--tc-space-1); padding: var(--tc-space-6) var(--tc-space-4); text-align: center; }
.ui-rvq__done-mark { display: grid; place-items: center; width: 32px; height: 32px; border-radius: var(--tc-radius-full); background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-rvq__done-title { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-rvq__done-sub { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-rvq__done-actions { display: flex; gap: var(--tc-space-2); margin-top: var(--tc-space-2); }
/* ----- The keys dialog ----- */
.ui-rvq__dialog { box-sizing: border-box; width: min(420px, calc(100vw - 2 * var(--tc-space-4))); max-width: none; margin: auto; padding: var(--tc-space-4); border: 0; border-radius: var(--tc-card-radius); background: var(--tc-surface-overlay); box-shadow: var(--tc-shadow-overlay); color: var(--tc-text-secondary); font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); text-align: left; }
.ui-rvq__dialog:not([open]) { display: none; }
.ui-rvq__dialog::backdrop { background: var(--tc-scrim); }
.ui-rvq__dialog-head { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-2); margin-bottom: var(--tc-space-3); }
.ui-rvq__dialog-title { font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-strong); color: var(--tc-text-primary); }
.ui-rvq__keys { width: 100%; border-collapse: collapse; }
.ui-rvq__keys th { padding: var(--tc-space-1) 0; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); text-align: left; }
.ui-rvq__keys td { padding: var(--tc-space-1-5) 0; border-top: var(--tc-hairline) solid var(--tc-border-subtle); color: var(--tc-text-primary); }
.ui-rvq__keys td:first-child { width: 40%; }
.ui-rvq__dialog-note { margin-top: var(--tc-space-3); color: var(--tc-text-muted); }
@container ui-rvq (max-width: 560px) {
  .ui-rvq__blocks, .ui-rvq__blocks[data-ref="yes"] { grid-template-columns: minmax(0, 1fr); }
  .ui-rvq__crit { flex-direction: column; align-items: stretch; }
  .ui-rvq__bottom { grid-template-columns: minmax(0, 1fr); }
  .ui-rvq__progress-text { display: none; }
}
@media (forced-colors: active) {
  .ui-rvq__bar-fill { background: Highlight; }
  .ui-rvq__opt[aria-checked="true"] { outline: 2px solid Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="rvq"] *, [data-ui="rvq"] *::before, [data-ui="rvq"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-review-queue")) customElements.define("tc-review-queue", TcReviewQueue);

declare global {
  interface HTMLElementTagNameMap {
    "tc-review-queue": TcReviewQueue;
  }
}
