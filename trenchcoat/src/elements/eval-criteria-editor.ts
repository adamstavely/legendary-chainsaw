import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController } from "./internal/controllers";
import { copyText } from "./internal/util";

/*
 * <tc-eval-criteria-editor> – define what an LLM judge asks about each answer. A list of criteria, each a question
 * with its kind of answer – pass or fail, a number on a scale with words at its ends, or one of a few labels – a
 * weight whose share of the total shows as a percentage, and worked examples the judge can learn from.
 *   · each criterion folds to a row: its number, name, kind and share; open it to edit in place
 *   · reorder with Move up / Move down, or Alt+↑ / Alt+↓ on a row; Add criterion opens a new one with its name focused
 *   · problems are checked as you type and said in words beside the field: an empty name or question, two criteria
 *     with one name, a scale whose ends are the wrong way round, a label kind with fewer than two labels
 *   · "Judge prompt" shows the prompt the criteria assemble into (judgePrompt), read-only, with Copy
 *   · "Try on sample" fires tc-try ({ criteria }) once nothing is wrong; otherwise it goes to the first problem
 * The list is `criteria` – every edit fires a cancelable tc-criteria-change ({ criteria }); preventDefault() keeps
 * control. Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-eval-criteria-editor .criteria=${criteria} @tc-try=${run}></tc-eval-criteria-editor>
 */

export type JudgeCriterionType = "pass-fail" | "scale" | "label";

export type JudgeExample = {
  /** An answer to judge */
  output: string;
  /** The verdict it should get – "FAIL", "4", "formal" */
  verdict: string;
  /** Why, in a line */
  why?: string;
};

export type JudgeCriterion = {
  id: string;
  name: string;
  /** The question the judge answers about each answer */
  question: string;
  type: JudgeCriterionType;
  /** For a scale: its ends and, optionally, a word for any point */
  scale?: { min: number; max: number; anchors?: Record<number, string> };
  /** For a label: the labels it picks from */
  labels?: string[];
  /** Its weight in the overall score – a share of the total */
  weight: number;
  examples?: JudgeExample[];
};

export type EvalCriteriaChange = { criteria: JudgeCriterion[] };
export type EvalCriteriaTry = { criteria: JudgeCriterion[]; prompt: string };
export type EvalCriteriaProblem = { id: string; field: "name" | "question" | "scale" | "labels" | "weight"; message: string };

const TYPE_WORDS: Record<JudgeCriterionType, string> = { "pass-fail": "Pass or fail", scale: "Scale", label: "Label" };
const DEFAULT_SCALE = { min: 1, max: 5, anchors: { 1: "Poor", 5: "Excellent" } as Record<number, string> };

/** Every problem in a set of criteria, in order, as words */
export function criteriaProblems(criteria: JudgeCriterion[]): EvalCriteriaProblem[] {
  const out: EvalCriteriaProblem[] = [];
  const names = new Map<string, number>();
  for (const c of criteria) {
    const n = c.name.trim().toLowerCase();
    if (n) names.set(n, (names.get(n) ?? 0) + 1);
  }
  for (const c of criteria) {
    if (!c.name.trim()) out.push({ id: c.id, field: "name", message: "Give it a name" });
    else if ((names.get(c.name.trim().toLowerCase()) ?? 0) > 1) out.push({ id: c.id, field: "name", message: "Another criterion has this name" });
    if (!c.question.trim()) out.push({ id: c.id, field: "question", message: "Write the question the judge answers" });
    if (c.type === "scale") {
      const s = c.scale ?? DEFAULT_SCALE;
      if (!Number.isFinite(s.min) || !Number.isFinite(s.max) || s.max <= s.min) out.push({ id: c.id, field: "scale", message: "The top of the scale must be above the bottom" });
    }
    if (c.type === "label" && (c.labels ?? []).filter((l) => l.trim()).length < 2) out.push({ id: c.id, field: "labels", message: "Add at least two labels" });
    if (!(c.weight > 0)) out.push({ id: c.id, field: "weight", message: "Give it a weight above 0" });
  }
  return out;
}

/** Each criterion's share of the total weight, 0–100, rounded */
export function weightShares(criteria: JudgeCriterion[]): Record<string, number> {
  const total = criteria.reduce((sum, c) => sum + Math.max(0, c.weight || 0), 0);
  return Object.fromEntries(criteria.map((c) => [c.id, total ? Math.round((Math.max(0, c.weight || 0) / total) * 100) : 0]));
}

const key = (name: string, i: number) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "") || `criterion_${i + 1}`;

/** The prompt the criteria assemble into – what the judge reads before each answer */
export function judgePrompt(criteria: JudgeCriterion[]): string {
  const shares = weightShares(criteria);
  const lines = ["You are grading an AI assistant's answer. Read the question it was asked and its answer, then judge the answer on each criterion below.", ""];
  const shape: string[] = [];
  criteria.forEach((c, i) => {
    const k = key(c.name, i);
    let answer: string;
    if (c.type === "pass-fail") {
      answer = "Answer PASS or FAIL.";
      shape.push(`"${k}": "PASS" | "FAIL"`);
    } else if (c.type === "scale") {
      const s = c.scale ?? DEFAULT_SCALE;
      const anchors = Object.entries(s.anchors ?? {})
        .filter(([, w]) => w.trim())
        .map(([n, w]) => `${n} = ${w}`);
      answer = `Answer with a whole number from ${s.min} to ${s.max}${anchors.length ? ` (${anchors.join(", ")})` : ""}.`;
      shape.push(`"${k}": ${s.min}–${s.max}`);
    } else {
      const labels = (c.labels ?? []).map((l) => l.trim()).filter(Boolean);
      answer = `Answer with one of: ${labels.join(", ")}.`;
      shape.push(`"${k}": ${labels.map((l) => `"${l}"`).join(" | ")}`);
    }
    lines.push(`${i + 1}. ${c.name.trim() || "Untitled"} (weight ${shares[c.id]}%) – ${c.question.trim()} ${answer}`);
    for (const ex of c.examples ?? []) {
      if (!ex.output.trim()) continue;
      lines.push(`   Example: "${ex.output.trim()}" → ${ex.verdict.trim() || "?"}${ex.why?.trim() ? `, because ${ex.why.trim()}` : ""}`);
    }
  });
  lines.push("", "Reply with JSON only, a short reason for each criterion included:", `{ ${shape.map((s) => `${s}`).join(", ")}, "reasons": { … } }`);
  return lines.join("\n");
}

/* ---------- Icons (Lucide, ISC – lucide.dev) ---------- */
const glyph = (d: TemplateResult, cls = "ui-ece__glyph") => html`<svg class=${cls} viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
/** Scales: weighing answers */
const scaleMark = svg`<path d="M12 3v18"></path><path d="M7 21h10"></path><path d="M4 7h16"></path><path d="M6 7l-3 7a3 3 0 0 0 6 0L6 7"></path><path d="M18 7l-3 7a3 3 0 0 0 6 0l-3-7"></path>`;
const chevron = glyph(svg`<path d="M9 6l6 6-6 6"></path>`, "ui-ece__chev");
const upIcon = glyph(svg`<path d="m18 15-6-6-6 6"></path>`);
const downIcon = glyph(svg`<path d="m6 9 6 6 6-6"></path>`);
const trashIcon = glyph(svg`<path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path>`);
const plusIcon = glyph(svg`<path d="M12 5v14"></path><path d="M5 12h14"></path>`);
const copyIcon = glyph(svg`<rect x="9" y="9" width="12" height="12" rx="2"></rect><path d="M5 15V5a2 2 0 0 1 2-2h10"></path>`);
const playIcon = glyph(svg`<path d="M7 4v16l13-8z"></path>`);
const alertIcon = glyph(svg`<circle cx="12" cy="12" r="9"></circle><path d="M12 8v5"></path><path d="M12 16h.01"></path>`);

let instances = 0;
let made = 0;

/**
 * Define an LLM judge's criteria: questions, answer kinds, weights as shares and examples, with the assembled prompt.
 * @tag tc-eval-criteria-editor
 * @fires tc-criteria-change - A criterion was added, edited, moved or removed ({ criteria }: EvalCriteriaChange); cancelable
 * @fires tc-try - "Try on sample" with nothing wrong ({ criteria, prompt }: EvalCriteriaTry)
 * @fires tc-prompt-copy - The judge prompt was copied ({ prompt }); cancelable – prevented, nothing is copied
 */
export class TcEvalCriteriaEditor extends TcElement {
  static override ui = "ece";

  /** The heading */
  @property() accessor heading = "Judge criteria";
  /** The criteria, in the order the judge asks them. Changed by the user unless a tc-criteria-change listener prevents it */
  @property({ attribute: false }) accessor criteria: JudgeCriterion[] = [];
  /** Ids of the criteria shown open; unset, the first is open */
  @property({ attribute: false }) accessor open: string[] | undefined = undefined;
  /** Hides "Try on sample" */
  @property({ type: Boolean, attribute: "hide-try" }) accessor hideTry = false;
  /** Shows Try as busy while the page runs the judge */
  @property({ type: Boolean }) accessor trying = false;

  /** @internal Which criteria are open, once the person opens or closes one */
  @state() accessor opened: string[] | null = null;
  /** @internal The prompt preview is open */
  @state() accessor preview = false;
  /** @internal Problems are shown everywhere – after Try found some */
  @state() accessor showAll = false;
  /** @internal Fields the person has left, by `${id}:${field}` – their problems show from then on */
  @state() accessor touched: string[] = [];
  /** @internal */
  @state() accessor copied = false;
  /** @internal What the status region says */
  @state() accessor spoken = "";

  private readonly uid = `tc-ece${++instances}`;
  private copiedTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    super();
    // Remove and Move swap focus targets; focus never drops to <body>
    new FocusRescueController(this, () => this.querySelector<HTMLElement>(".ui-ece__add"));
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.copiedTimer);
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("open")) this.opened = null;
  }

  /** @internal The open criteria */
  private get openIds(): string[] {
    return this.opened ?? this.open ?? (this.criteria[0] ? [this.criteria[0].id] : []);
  }

  /** @internal Applies a change unless a listener prevents it */
  private change(criteria: JudgeCriterion[]) {
    if (!this.emit<EvalCriteriaChange>("tc-criteria-change", { criteria }, { cancelable: true })) return false;
    this.criteria = criteria;
    return true;
  }

  /** @internal */
  private patch(id: string, p: Partial<JudgeCriterion>) {
    this.change(this.criteria.map((c) => (c.id === id ? { ...c, ...p } : c)));
  }

  /** @internal */
  private toggle(id: string) {
    const ids = this.openIds;
    this.opened = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
  }

  /** @internal */
  private add() {
    const c: JudgeCriterion = { id: `${this.uid}-new-${++made}`, name: "", question: "", type: "pass-fail", weight: 1 };
    if (!this.change([...this.criteria, c])) return;
    this.opened = [...this.openIds, c.id];
    this.spoken = `Criterion ${this.criteria.length} added`;
    void this.updateComplete.then(() => this.querySelector<HTMLInputElement>(`#${this.uid}-${c.id}-name`)?.focus());
  }

  /** @internal */
  private move(id: string, by: -1 | 1) {
    const at = this.criteria.findIndex((c) => c.id === id);
    const to = at + by;
    if (at < 0 || to < 0 || to >= this.criteria.length) return;
    const next = [...this.criteria];
    const [c] = next.splice(at, 1);
    next.splice(to, 0, c);
    if (!this.change(next)) return;
    this.spoken = `Moved ${c.name.trim() || "the criterion"} to position ${to + 1} of ${next.length}`;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`#${this.uid}-${id}-row`)?.focus());
  }

  /** @internal */
  private removeCriterion(id: string) {
    const at = this.criteria.findIndex((c) => c.id === id);
    const c = this.criteria[at];
    if (!c || !this.change(this.criteria.filter((x) => x.id !== id))) return;
    this.spoken = `Removed ${c.name.trim() || "the criterion"}`;
    void this.updateComplete.then(() => {
      const next = this.criteria[Math.min(at, this.criteria.length - 1)];
      (next ? this.querySelector<HTMLElement>(`#${this.uid}-${next.id}-row`) : this.querySelector<HTMLElement>(".ui-ece__add"))?.focus();
    });
  }

  /** @internal Alt+↑ / Alt+↓ on a row move it */
  private onRowKey(e: KeyboardEvent, id: string) {
    if (!e.altKey || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
    e.preventDefault();
    this.move(id, e.key === "ArrowUp" ? -1 : 1);
  }

  /** @internal */
  private touch(id: string, field: string) {
    const k = `${id}:${field}`;
    if (!this.touched.includes(k)) this.touched = [...this.touched, k];
  }

  /** @internal */
  private async copyPrompt() {
    const prompt = judgePrompt(this.criteria);
    if (!this.emit("tc-prompt-copy", { prompt }, { cancelable: true })) return;
    await copyText(prompt);
    this.copied = true;
    this.spoken = "Judge prompt copied";
    clearTimeout(this.copiedTimer);
    this.copiedTimer = setTimeout(() => (this.copied = false), 1600);
  }

  /** @internal */
  private tryIt() {
    if (this.trying) return;
    const problems = criteriaProblems(this.criteria);
    if (!this.criteria.length) {
      this.spoken = "Add a criterion first";
      this.querySelector<HTMLElement>(".ui-ece__add")?.focus();
      return;
    }
    if (problems.length) {
      this.showAll = true;
      const first = problems[0];
      this.opened = [...new Set([...this.openIds, ...problems.map((p) => p.id)])];
      this.spoken = `${problems.length} ${problems.length === 1 ? "problem" : "problems"} to fix before trying`;
      void this.updateComplete.then(() => this.querySelector<HTMLElement>(`#${this.uid}-${first.id}-${first.field}`)?.focus());
      return;
    }
    this.emit<EvalCriteriaTry>("tc-try", { criteria: this.criteria, prompt: judgePrompt(this.criteria) });
  }

  /** @internal A field's problem, once it's been left or Try asked */
  private problemFor(problems: EvalCriteriaProblem[], id: string, field: EvalCriteriaProblem["field"]) {
    if (!this.showAll && !this.touched.includes(`${id}:${field}`)) return undefined;
    return problems.find((p) => p.id === id && p.field === field);
  }

  /** @internal A labelled text field with its problem */
  private field(c: JudgeCriterion, field: "name" | "question", label: string, problems: EvalCriteriaProblem[], multiline = false) {
    const id = `${this.uid}-${c.id}-${field}`;
    const problem = this.problemFor(problems, c.id, field);
    const input = (e: Event) => this.patch(c.id, { [field]: (e.target as HTMLInputElement).value });
    return html`<div class="ui-ece__field" data-field=${field}>
      <label class="ui-ece__label" for=${id}>${label}</label>
      ${multiline
        ? html`<textarea class="ui-ece__input ui-ece__area" id=${id} rows="2" .value=${live(c[field])} aria-invalid=${ifDefined(problem ? "true" : undefined)} aria-describedby=${ifDefined(problem ? `${id}-err` : undefined)} @input=${input} @blur=${() => this.touch(c.id, field)}></textarea>`
        : html`<input class="ui-ece__input" id=${id} autocomplete="off" .value=${live(c[field])} aria-invalid=${ifDefined(problem ? "true" : undefined)} aria-describedby=${ifDefined(problem ? `${id}-err` : undefined)} @input=${input} @blur=${() => this.touch(c.id, field)} />`}
      ${problem ? html`<span class="ui-ece__error" id=${`${id}-err`}>${alertIcon}${problem.message}</span>` : nothing}
    </div>`;
  }

  /** @internal The kind-specific part: the scale's ends and words, or the labels */
  private kindFields(c: JudgeCriterion, problems: EvalCriteriaProblem[]) {
    if (c.type === "scale") {
      const s = c.scale ?? DEFAULT_SCALE;
      const id = `${this.uid}-${c.id}-scale`;
      // A scale the wrong way round is said at once – the ends are numbers, there's nothing half typed
      const problem = problems.find((p) => p.id === c.id && p.field === "scale");
      const setScale = (p: Partial<typeof s>) => this.patch(c.id, { scale: { ...s, ...p } });
      const anchor = (n: number) => s.anchors?.[n] ?? "";
      return html`<fieldset class="ui-ece__group" aria-describedby=${ifDefined(problem ? `${id}-err` : undefined)}>
        <legend class="ui-ece__label">Scale</legend>
        <div class="ui-ece__scale">
          <label class="ui-ece__mini" for=${id}>From</label>
          <input class="ui-ece__input ui-ece__num" id=${id} type="number" step="1" .value=${live(String(s.min))} aria-invalid=${ifDefined(problem ? "true" : undefined)} @input=${(e: Event) => setScale({ min: Number((e.target as HTMLInputElement).value) })} />
          <label class="tc-sr-only" for=${`${id}-minw`}>Word for ${s.min}</label>
          <input class="ui-ece__input" id=${`${id}-minw`} placeholder="Word for the bottom" .value=${live(anchor(s.min))} @input=${(e: Event) => setScale({ anchors: { ...s.anchors, [s.min]: (e.target as HTMLInputElement).value } })} />
          <label class="ui-ece__mini" for=${`${id}-max`}>to</label>
          <input class="ui-ece__input ui-ece__num" id=${`${id}-max`} type="number" step="1" .value=${live(String(s.max))} aria-invalid=${ifDefined(problem ? "true" : undefined)} @input=${(e: Event) => setScale({ max: Number((e.target as HTMLInputElement).value) })} />
          <label class="tc-sr-only" for=${`${id}-maxw`}>Word for ${s.max}</label>
          <input class="ui-ece__input" id=${`${id}-maxw`} placeholder="Word for the top" .value=${live(anchor(s.max))} @input=${(e: Event) => setScale({ anchors: { ...s.anchors, [s.max]: (e.target as HTMLInputElement).value } })} />
        </div>
        ${problem ? html`<span class="ui-ece__error" id=${`${id}-err`}>${alertIcon}${problem.message}</span>` : nothing}
      </fieldset>`;
    }
    if (c.type === "label") {
      const id = `${this.uid}-${c.id}-labels`;
      const problem = this.problemFor(problems, c.id, "labels");
      return html`<div class="ui-ece__field">
        <label class="ui-ece__label" for=${id}>Labels</label>
        <input
          class="ui-ece__input"
          id=${id}
          autocomplete="off"
          .value=${live((c.labels ?? []).join(", "))}
          aria-invalid=${ifDefined(problem ? "true" : undefined)}
          aria-describedby=${`${id}-hint${problem ? ` ${id}-err` : ""}`}
          @change=${(e: Event) =>
            this.patch(c.id, {
              labels: (e.target as HTMLInputElement).value
                .split(",")
                .map((l) => l.trim())
                .filter(Boolean),
            })}
          @blur=${() => this.touch(c.id, "labels")}
        />
        <span class="ui-ece__hint" id=${`${id}-hint`}>Separate them with commas</span>
        ${problem ? html`<span class="ui-ece__error" id=${`${id}-err`}>${alertIcon}${problem.message}</span>` : nothing}
      </div>`;
    }
    return nothing;
  }

  /** @internal Worked examples for one criterion */
  private examples(c: JudgeCriterion) {
    const list = c.examples ?? [];
    const set = (examples: JudgeExample[]) => this.patch(c.id, { examples });
    const base = `${this.uid}-${c.id}-ex`;
    return html`<div class="ui-ece__examples">
      <span class="ui-ece__label">Examples<span class="ui-ece__optional"> · optional</span></span>
      ${list.length
        ? html`<ol class="ui-ece__ex-list">
            ${list.map(
              (ex, i) => html`<li class="ui-ece__ex">
                <label class="tc-sr-only" for=${`${base}-${i}-out`}>Example ${i + 1} answer</label>
                <textarea class="ui-ece__input ui-ece__area" id=${`${base}-${i}-out`} rows="2" placeholder="An answer to judge" .value=${live(ex.output)} @input=${(e: Event) => set(list.map((x, j) => (j === i ? { ...x, output: (e.target as HTMLTextAreaElement).value } : x)))}></textarea>
                <div class="ui-ece__ex-row">
                  <label class="tc-sr-only" for=${`${base}-${i}-v`}>Example ${i + 1} verdict</label>
                  <input class="ui-ece__input ui-ece__verdict" id=${`${base}-${i}-v`} placeholder="Verdict" .value=${live(ex.verdict)} @input=${(e: Event) => set(list.map((x, j) => (j === i ? { ...x, verdict: (e.target as HTMLInputElement).value } : x)))} />
                  <label class="tc-sr-only" for=${`${base}-${i}-why`}>Example ${i + 1} reason</label>
                  <input class="ui-ece__input" id=${`${base}-${i}-why`} placeholder="Why" .value=${live(ex.why ?? "")} @input=${(e: Event) => set(list.map((x, j) => (j === i ? { ...x, why: (e.target as HTMLInputElement).value } : x)))} />
                  <button type="button" class="ui-ece__icon-btn" @click=${() => {
                    set(list.filter((_, j) => j !== i));
                    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`#${base}-add`)?.focus());
                  }}>${trashIcon}<span class="tc-sr-only">Remove example ${i + 1}</span></button>
                </div>
              </li>`,
            )}
          </ol>`
        : nothing}
      <button type="button" class="ui-ece__link" id=${`${base}-add`} @click=${() => {
        set([...list, { output: "", verdict: "", why: "" }]);
        void this.updateComplete.then(() => this.querySelector<HTMLElement>(`#${base}-${list.length}-out`)?.focus());
      }}>${plusIcon}Add example</button>
    </div>`;
  }

  /** @internal One criterion: its row, and its fields when open */
  private criterion(c: JudgeCriterion, i: number, shares: Record<string, number>, problems: EvalCriteriaProblem[]) {
    const open = this.openIds.includes(c.id);
    const id = `${this.uid}-${c.id}`;
    const count = problems.filter((p) => p.id === c.id).length;
    const n = this.criteria.length;
    const typeId = `${id}-type`;
    return html`<li class="ui-ece__crit" ?data-open=${open} ?data-problem=${count > 0 && this.showAll}>
      <div class="ui-ece__row">
        <button
          type="button"
          class="ui-ece__summary"
          id=${`${id}-row`}
          aria-expanded=${open ? "true" : "false"}
          aria-controls=${`${id}-body`}
          aria-describedby=${`${this.uid}-move`}
          @click=${() => this.toggle(c.id)}
          @keydown=${(e: KeyboardEvent) => this.onRowKey(e, c.id)}
        >
          ${chevron}
          <span class="ui-ece__num-badge" aria-hidden="true">${i + 1}</span>
          <span class="ui-ece__name">${c.name.trim() || "Untitled criterion"}</span>
          <span class="ui-ece__type">${TYPE_WORDS[c.type]}</span>
          ${count && this.showAll ? html`<span class="ui-ece__flag">${alertIcon}${count} to fix</span>` : nothing}
        </button>
        <span class="ui-ece__share" title="Share of the overall score">
          <span class="ui-ece__share-bar" aria-hidden="true"><span style=${`inline-size: ${shares[c.id]}%`}></span></span>
          <span class="ui-ece__share-num">${shares[c.id]}%<span class="tc-sr-only"> of the score</span></span>
        </span>
        <span class="ui-ece__tools">
          <button type="button" class="ui-ece__icon-btn" ?disabled=${i === 0} @click=${() => this.move(c.id, -1)}>${upIcon}<span class="tc-sr-only">Move ${c.name.trim() || `criterion ${i + 1}`} up</span></button>
          <button type="button" class="ui-ece__icon-btn" ?disabled=${i === n - 1} @click=${() => this.move(c.id, 1)}>${downIcon}<span class="tc-sr-only">Move ${c.name.trim() || `criterion ${i + 1}`} down</span></button>
          <button type="button" class="ui-ece__icon-btn ui-ece__remove" @click=${() => this.removeCriterion(c.id)}>${trashIcon}<span class="tc-sr-only">Remove ${c.name.trim() || `criterion ${i + 1}`}</span></button>
        </span>
      </div>
      <div class="ui-ece__body" id=${`${id}-body`} role="group" aria-labelledby=${`${id}-row`} ?hidden=${!open}>
        <div class="ui-ece__grid">
          ${this.field(c, "name", "Name", problems)}
          <div class="ui-ece__field ui-ece__weight-field">
            <label class="ui-ece__label" for=${`${id}-weight`}>Weight</label>
            <input
              class="ui-ece__input ui-ece__num"
              id=${`${id}-weight`}
              type="number"
              min="0"
              step="1"
              .value=${live(String(c.weight))}
              aria-describedby=${`${id}-weight-hint`}
              aria-invalid=${ifDefined(this.problemFor(problems, c.id, "weight") ? "true" : undefined)}
              @input=${(e: Event) => this.patch(c.id, { weight: Number((e.target as HTMLInputElement).value) })}
              @blur=${() => this.touch(c.id, "weight")}
            />
            <span class="ui-ece__hint" id=${`${id}-weight-hint`}>${shares[c.id]}% of the score</span>
          </div>
        </div>
        ${this.field(c, "question", "Question for the judge", problems, true)}
        <fieldset class="ui-ece__group">
          <legend class="ui-ece__label" id=${typeId}>Answer</legend>
          <div class="ui-ece__types">
            ${(Object.keys(TYPE_WORDS) as JudgeCriterionType[]).map(
              (t) => html`<label class="ui-ece__type-opt">
                <input
                  type="radio"
                  name=${`${id}-type`}
                  .checked=${live(c.type === t)}
                  @change=${() => this.patch(c.id, { type: t, ...(t === "scale" && !c.scale ? { scale: { ...DEFAULT_SCALE, anchors: { ...DEFAULT_SCALE.anchors } } } : {}), ...(t === "label" && !c.labels ? { labels: [] } : {}) })}
                />${TYPE_WORDS[t]}
              </label>`,
            )}
          </div>
        </fieldset>
        ${this.kindFields(c, problems)}
        ${this.examples(c)}
      </div>
    </li>`;
  }

  protected override render() {
    const titleId = `${this.uid}-title`;
    const shares = weightShares(this.criteria);
    const problems = criteriaProblems(this.criteria);
    const shown = this.showAll ? problems.length : 0;
    const promptId = `${this.uid}-prompt`;
    return html`
      ${cardHead({
        icon: scaleMark,
        title: this.heading,
        id: titleId,
        aside: html`<span class="ui-ece__count">${this.criteria.length} ${this.criteria.length === 1 ? "criterion" : "criteria"}${shown ? html` · <span class="ui-ece__count-bad">${shown} to fix</span>` : nothing}</span>`,
      })}
      <div class="ui-ece__card" role="group" aria-labelledby=${titleId}>
        <span class="tc-sr-only" id=${`${this.uid}-move`}>Alt plus up or down arrow moves it</span>
        ${this.criteria.length
          ? html`<ol class="ui-ece__list" aria-label="Criteria">${repeat(this.criteria, (c) => c.id, (c, i) => this.criterion(c, i, shares, problems))}</ol>`
          : html`<p class="ui-ece__empty">No criteria yet. Add one for each thing the judge should check.</p>`}
        <div class="ui-ece__bar">
          <button type="button" class="tc-btn-sm ui-ece__add" @click=${() => this.add()}>${plusIcon}Add criterion</button>
          <button type="button" class="ui-ece__toggle" aria-expanded=${this.preview ? "true" : "false"} aria-controls=${promptId} @click=${() => (this.preview = !this.preview)}>${chevron}Judge prompt</button>
          ${this.hideTry
            ? nothing
            : html`<button type="button" class="ui-ece__try" aria-busy=${ifDefined(this.trying ? "true" : undefined)} aria-disabled=${ifDefined(this.trying ? "true" : undefined)} @click=${() => this.tryIt()}>
                ${playIcon}${this.trying ? "Trying…" : "Try on sample"}
              </button>`}
        </div>
        <div class="ui-ece__prompt" id=${promptId} ?hidden=${!this.preview}>
          <div class="ui-ece__prompt-head">
            <span class="ui-ece__label" id=${`${promptId}-label`}>What the judge reads</span>
            <button type="button" class="ui-ece__link" @click=${() => this.copyPrompt()}>${copyIcon}${this.copied ? "Copied" : "Copy"}<span class="tc-sr-only"> the judge prompt</span></button>
          </div>
          <pre class="ui-ece__pre" tabindex="0" aria-labelledby=${`${promptId}-label`}>${judgePrompt(this.criteria)}</pre>
        </div>
      </div>
      <span class="tc-sr-only" role="status">${this.spoken}</span>
    `;
  }

  static override css = /* css */ `
[data-ui="ece"] {
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
  container: ui-ece / inline-size;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ece"] { padding: 0; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
[data-ui="ece"] *, [data-ui="ece"] *::before, [data-ui="ece"] *::after { box-sizing: border-box; }
[data-ui="ece"] :is(ol, p, pre, fieldset) { margin: 0; padding: 0; }
[data-ui="ece"] fieldset { min-width: 0; border: 0; }
[data-ui="ece"] legend { padding: 0; }
:where([data-ui="ece"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="ece"] :is(button, pre):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="ece"] button:disabled { cursor: default; color: var(--tc-text-disabled); }
.ui-ece__glyph { width: 14px; height: 14px; flex: none; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *) .ui-ece__glyph { stroke-width: 1.6; }
.ui-ece__count { flex: none; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; }
.ui-ece__count-bad { color: var(--tc-status-danger-fg); font-weight: var(--tc-font-weight-medium); }
.ui-ece__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-ece__card { border-top: var(--tc-hairline) solid var(--tc-divider); border-radius: 0 0 var(--tc-card-radius) var(--tc-card-radius); background: none; box-shadow: none; }
.ui-ece__empty { padding: var(--tc-space-5) var(--tc-space-4); color: var(--tc-text-muted); text-align: center; }
/* ----- The list ----- */
.ui-ece__list { list-style: none; }
.ui-ece__crit { border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-ece__crit[data-problem] { box-shadow: inset 2px 0 0 var(--tc-status-danger-solid); }
.ui-ece__row { display: flex; align-items: center; gap: var(--tc-space-2); padding: var(--tc-space-1) var(--tc-space-3) var(--tc-space-1) var(--tc-space-2); }
.ui-ece__summary { display: flex; flex: 1; align-items: center; gap: var(--tc-space-2); min-width: 0; min-height: var(--tc-control-h-md); padding: 0 var(--tc-space-1); border-radius: var(--tc-control-radius-sm); }
[data-ui="ece"] .ui-ece__summary:hover { background: var(--tc-fill-subtle); }
.ui-ece__chev { width: 14px; height: 14px; flex: none; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; color: var(--tc-text-muted); transition: transform var(--tc-duration-fast) var(--tc-ease-standard); }
[aria-expanded="true"] > .ui-ece__chev { transform: rotate(90deg); }
.ui-ece__num-badge { display: grid; flex: none; place-items: center; width: 20px; height: 20px; border-radius: var(--tc-radius-full); background: var(--tc-fill-default); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
.ui-ece__name { min-width: 0; overflow: hidden; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
.ui-ece__type { flex: none; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-ece__flag { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1); font-size: var(--tc-font-size-sm); color: var(--tc-status-danger-fg); }
.ui-ece__share { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1-5); }
.ui-ece__share-bar { display: block; width: 48px; height: 6px; overflow: hidden; border-radius: var(--tc-radius-full); background: var(--tc-fill-default); }
.ui-ece__share-bar > span { display: block; height: 100%; background: var(--tc-accent); }
.ui-ece__share-num { min-width: 3ch; font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; text-align: right; }
.ui-ece__tools { display: inline-flex; flex: none; }
.ui-ece__icon-btn { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-text-secondary); }
[data-ui="ece"] .ui-ece__icon-btn:hover:not(:disabled) { background: var(--tc-fill-default); color: var(--tc-text-primary); }
[data-ui="ece"] .ui-ece__remove:hover { color: var(--tc-status-danger-fg); }
/* ----- An open criterion ----- */
.ui-ece__body { display: grid; gap: var(--tc-space-3); padding: var(--tc-space-1) var(--tc-space-4) var(--tc-space-4) var(--tc-space-8); }
.ui-ece__body[hidden] { display: none; }
.ui-ece__grid { display: grid; grid-template-columns: minmax(0, 1fr) 120px; gap: var(--tc-space-3); }
.ui-ece__field, .ui-ece__group { display: grid; align-content: start; gap: var(--tc-space-1); min-width: 0; }
.ui-ece__label { display: block; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-ece__label { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-ece__group > .ui-ece__label { margin-bottom: var(--tc-space-1); }
.ui-ece__optional { font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); text-transform: none; letter-spacing: normal; }
.ui-ece__mini { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-ece__input { width: 100%; min-width: 0; height: var(--tc-control-h-sm); padding: 0 var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font: inherit; font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); outline: none; }
.ui-ece__input:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-ece__input:focus { box-shadow: var(--tc-field-shadow-focus); }
.ui-ece__input[aria-invalid="true"] { box-shadow: inset 0 0 0 1px var(--tc-status-danger-solid); }
.ui-ece__input::placeholder { color: var(--tc-text-placeholder); }
.ui-ece__area { height: auto; min-height: 52px; padding-top: var(--tc-space-1-5); padding-bottom: var(--tc-space-1-5); line-height: var(--tc-line-height-normal); resize: vertical; field-sizing: content; }
.ui-ece__num { font-variant-numeric: tabular-nums; }
.ui-ece__hint { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-ece__error { display: inline-flex; align-items: center; gap: var(--tc-space-1); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-status-danger-fg); }
.ui-ece__types { display: flex; flex-wrap: wrap; gap: var(--tc-space-1) var(--tc-space-4); }
.ui-ece__type-opt { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); min-height: var(--tc-control-h-sm); font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); cursor: pointer; }
.ui-ece__type-opt input { width: 16px; height: 16px; margin: 0; accent-color: var(--tc-accent); }
.ui-ece__scale { display: grid; grid-template-columns: auto 72px minmax(0, 1fr) auto 72px minmax(0, 1fr); gap: var(--tc-space-2); align-items: center; }
.ui-ece__examples { display: grid; gap: var(--tc-space-1-5); }
.ui-ece__ex-list { display: grid; gap: var(--tc-space-2); list-style: none; }
.ui-ece__ex { display: grid; gap: var(--tc-space-1-5); padding: var(--tc-space-2); border-radius: var(--tc-radius-md); background: var(--tc-surface-well); }
.ui-ece__ex-row { display: grid; grid-template-columns: 96px minmax(0, 1fr) auto; gap: var(--tc-space-1-5); align-items: center; }
.ui-ece__link { display: inline-flex; align-items: center; gap: var(--tc-space-1); justify-self: start; min-height: var(--tc-control-h-sm); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-accent-text); }
[data-ui="ece"] .ui-ece__link:hover { text-decoration: underline; text-underline-offset: 2px; }
/* ----- The bar ----- */
.ui-ece__bar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2) var(--tc-space-3); padding: var(--tc-space-3); }
.ui-ece__toggle { display: inline-flex; align-items: center; gap: var(--tc-space-1); min-height: var(--tc-control-h-sm); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
[data-ui="ece"] .ui-ece__toggle:hover { color: var(--tc-text-primary); }
.ui-ece__try { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); margin-left: auto; padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; }
[data-ui="ece"] .ui-ece__try:hover { background: var(--tc-action-primary-bg-hover); }
.ui-ece__try[aria-busy="true"] { cursor: progress; }
.ui-ece__prompt { display: grid; gap: var(--tc-space-1-5); padding: var(--tc-space-3); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-ece__prompt[hidden] { display: none; }
.ui-ece__prompt-head { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-2); }
.ui-ece__pre { max-height: 260px; overflow: auto; padding: var(--tc-space-2) var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-surface-well); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-relaxed); color: var(--tc-text-secondary); white-space: pre-wrap; overflow-wrap: anywhere; }
@container ui-ece (max-width: 520px) {
  .ui-ece__type, .ui-ece__share-bar { display: none; }
  .ui-ece__body { padding-left: var(--tc-space-4); }
  .ui-ece__grid { grid-template-columns: minmax(0, 1fr); }
  .ui-ece__scale { grid-template-columns: auto 64px minmax(0, 1fr); }
  .ui-ece__ex-row { grid-template-columns: minmax(0, 1fr) auto; }
  .ui-ece__ex-row .ui-ece__verdict { grid-column: 1 / -1; }
}
@media (forced-colors: active) {
  .ui-ece__share-bar > span { background: Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="ece"] *, [data-ui="ece"] *::before, [data-ui="ece"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-eval-criteria-editor")) customElements.define("tc-eval-criteria-editor", TcEvalCriteriaEditor);

declare global {
  interface HTMLElementTagNameMap {
    "tc-eval-criteria-editor": TcEvalCriteriaEditor;
  }
}
