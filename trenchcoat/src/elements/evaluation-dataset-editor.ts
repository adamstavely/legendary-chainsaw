import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController, RowWindowController } from "./internal/controllers";
import { compact } from "./internal/format";

/*
 * <tc-evaluation-dataset-editor> – the test cases an eval runs, edited as a set. Each case is an input, what a good
 * answer looks like (an expected output and/or checks – contains, equals, matches schema, rubric) and where it goes:
 * its tags and its split.
 *   · the split bar: how the cases divide between train, validation and test (or whatever splits the app names), with
 *     counts, shares and – when comparing – the change since an earlier version
 *   · the table: every case, windowed so thousands stay fast; filter by split (a radio group with counts), by text,
 *     and to the cases changed since the compared version
 *   · the open case reads as a test case: the prompt quoted beside the rules it has to pass (output contains
 *     "refund", output matches schema {refund_id, amount}, rubric: …), with its split and tags; Edit (Enter or F2)
 *     turns it into the form – input, expected output, a row per check, tags as chips, the split – and Done or
 *     Escape turns it back. A new case opens straight into its form. Problems show on the case and on its row
 *   · versions: the app supplies earlier snapshots; picking one marks new and edited rows, counts the removed cases and
 *     lets a removed case be restored
 * Nothing is run here: Import and Export fire tc-import and tc-export, and eval-scorecard shows what running the set
 * gave. The table is the WAI-ARIA grid (one tab stop, arrows, Home / End, Ctrl+Home / End, Page Up / Down, Enter opens
 * the case, Escape closes it). Standard puts the header on a gray tray above a white card; Clean is one white card with
 * hairline dividers and caption-style column heads. Wide, the open case sits beside the table; narrow, below it.
 *
 *   <tc-evaluation-dataset-editor heading="Support replies" .value=${{ cases }} .versions=${[v3]} compare="v3"></tc-evaluation-dataset-editor>
 *
 * The set is one value: every edit fires a cancelable tc-value-change ({ value }) – preventDefault() keeps control.
 * With `name` it's a form control: the form gets the set as JSON, and a set with a broken case is invalid.
 */

/** One way to check an answer: "contains", "equals", "matches schema", "rubric" – data, so an app can add its own */
export type EvaluationAssertionType = {
  id: string;
  /** In the check's type select: "Contains" */
  label: string;
  /** Placeholder for the check's value */
  placeholder?: string;
  /** A line under the check explaining what it does */
  description?: string;
  /** The value is long text – a textarea instead of a one-line field */
  multiline?: boolean;
  /** The value must be JSON (a schema, say) – text that doesn't parse is an error */
  json?: boolean;
};
/** One check on a case's answer */
export type EvaluationAssertion = { id: string; /** An EvaluationAssertionType id */ type: string; /** What it checks against */ value: string };
/** One test case */
export type EvaluationCase = {
  id: string;
  /** The prompt or input the model is given */
  input: string;
  /** What a good answer looks like, if there is one */
  expected?: string;
  /** Checks on the answer */
  assertions: EvaluationAssertion[];
  tags: string[];
  /** An EvaluationSplit id */
  split: string;
};
/** A split of the set: train, validation, test – or dev and test */
export type EvaluationSplit = { id: string; label: string };
export type EvaluationDatasetValue = { cases: EvaluationCase[] };
/** An earlier snapshot of the set, to compare against */
export type EvaluationDatasetVersion = { id: string; /** "v3" */ label: string; /** When or why: "12 Oct · before the refund policy" */ detail?: string; cases: EvaluationCase[] };
/** A problem with a case: an error makes the set invalid, a warning doesn't */
export type EvaluationIssue = { caseId: string; level: "error" | "warning"; message: string; assertionId?: string };
/** What changed between two versions of a set */
export type EvaluationComparison = { added: string[]; edited: string[]; removed: EvaluationCase[] };

export type EvaluationDatasetValueChange = { value: EvaluationDatasetValue };
export type EvaluationDatasetOpenChange = { open: string | null };
export type EvaluationDatasetCompareChange = { compare: string };
export type EvaluationDatasetExport = { value: EvaluationDatasetValue; jsonl: string };

export const EVALUATION_ASSERTION_TYPES: EvaluationAssertionType[] = [
  { id: "contains", label: "Contains", placeholder: "Text the answer must include", description: "Passes when the answer includes this text" },
  { id: "equals", label: "Equals", placeholder: "The exact answer", description: "Passes when the answer is exactly this" },
  { id: "schema", label: "Matches schema", placeholder: '{ "type": "object", "required": ["answer"] }', description: "Passes when the answer is JSON that fits this JSON Schema", multiline: true, json: true },
  { id: "rubric", label: "Rubric", placeholder: "What a good answer does, for a grader to judge", description: "A grader scores the answer against this criterion", multiline: true },
];
export const EVALUATION_SPLITS: EvaluationSplit[] = [
  { id: "train", label: "Train" },
  { id: "validation", label: "Validation" },
  { id: "test", label: "Test" },
];

const EMPTY: EvaluationDatasetValue = { cases: [] };
const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;
const TONES = ["teal", "violet", "amber", "pink", "rose"];

/** Every problem in a set, case by case in order */
export function evaluationDatasetIssues(value: EvaluationDatasetValue, o: { assertionTypes?: EvaluationAssertionType[]; splits?: EvaluationSplit[] } = {}): EvaluationIssue[] {
  const types = new Map((o.assertionTypes ?? EVALUATION_ASSERTION_TYPES).map((t) => [t.id, t]));
  const splits = new Set((o.splits ?? EVALUATION_SPLITS).map((s) => s.id));
  const seen = new Map<string, number>();
  for (const c of value.cases) seen.set(c.id, (seen.get(c.id) ?? 0) + 1);
  const out: EvaluationIssue[] = [];
  for (const c of value.cases) {
    const add = (level: EvaluationIssue["level"], message: string, assertionId?: string) => out.push({ caseId: c.id, level, message, ...(assertionId ? { assertionId } : {}) });
    if (!c.id.trim()) add("error", "The case has no id");
    else if ((seen.get(c.id) ?? 0) > 1) add("error", "Another case has the same id");
    if (!c.input.trim()) add("error", "Add an input");
    c.assertions.forEach((a, i) => {
      const t = types.get(a.type);
      if (!t) add("error", `Check ${i + 1} has a type this set doesn't know`, a.id);
      else if (!a.value.trim()) add("error", `Check ${i + 1} is empty`, a.id);
      else if (t.json) {
        try {
          JSON.parse(a.value);
        } catch {
          add("error", `Check ${i + 1} isn't valid JSON`, a.id);
        }
      }
    });
    if (!splits.has(c.split)) add("warning", "Pick a split");
    if (!c.expected?.trim() && !c.assertions.length) add("warning", "Nothing is checked – add an expected output or a check");
  }
  return out;
}

const same = (a: EvaluationCase, b: EvaluationCase) =>
  a.input === b.input &&
  (a.expected ?? "") === (b.expected ?? "") &&
  a.split === b.split &&
  a.tags.length === b.tags.length &&
  a.tags.every((t, i) => t === b.tags[i]) &&
  a.assertions.length === b.assertions.length &&
  a.assertions.every((x, i) => x.type === b.assertions[i].type && x.value === b.assertions[i].value);

/** The cases added, edited (same id, different content) and removed since `base` */
export function compareEvaluationDatasets(base: readonly EvaluationCase[], current: readonly EvaluationCase[]): EvaluationComparison {
  const before = new Map(base.map((c) => [c.id, c]));
  const now = new Set(current.map((c) => c.id));
  const added: string[] = [];
  const edited: string[] = [];
  for (const c of current) {
    const b = before.get(c.id);
    if (!b) added.push(c.id);
    else if (!same(b, c)) edited.push(c.id);
  }
  return { added, edited, removed: base.filter((c) => !now.has(c.id)) };
}

/** The set as JSON Lines – one case per line */
export function evaluationDatasetToJsonl(value: EvaluationDatasetValue): string {
  return value.cases.map((c) => JSON.stringify({ id: c.id, input: c.input, ...(c.expected !== undefined ? { expected: c.expected } : {}), assertions: c.assertions.map((a) => ({ type: a.type, value: a.value })), tags: c.tags, split: c.split })).join("\n");
}

/** Reads JSON Lines back into a set; lines that can't be read are skipped and reported with their line number */
export function evaluationDatasetFromJsonl(text: string): { value: EvaluationDatasetValue; errors: string[] } {
  const cases: EvaluationCase[] = [];
  const errors: string[] = [];
  text.split(/\r?\n/).forEach((line, i) => {
    if (!line.trim()) return;
    const n = i + 1;
    let raw: unknown;
    try {
      raw = JSON.parse(line);
    } catch {
      errors.push(`Line ${n}: not valid JSON`);
      return;
    }
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return void errors.push(`Line ${n}: not an object`);
    const o = raw as Record<string, unknown>;
    if (typeof o.input !== "string") return void errors.push(`Line ${n}: "input" must be text`);
    if (o.expected !== undefined && typeof o.expected !== "string") return void errors.push(`Line ${n}: "expected" must be text`);
    const list = Array.isArray(o.assertions) ? o.assertions : [];
    if (list.some((a) => !a || typeof (a as EvaluationAssertion).type !== "string" || typeof (a as EvaluationAssertion).value !== "string")) return void errors.push(`Line ${n}: each assertion needs a "type" and a "value"`);
    cases.push({
      id: typeof o.id === "string" && o.id ? o.id : `line-${n}`,
      input: o.input,
      ...(typeof o.expected === "string" ? { expected: o.expected } : {}),
      assertions: (list as EvaluationAssertion[]).map((a, j) => ({ id: typeof a.id === "string" && a.id ? a.id : `check-${j + 1}`, type: a.type, value: a.value })),
      tags: Array.isArray(o.tags) ? o.tags.filter((t): t is string => typeof t === "string") : [],
      split: typeof o.split === "string" ? o.split : "",
    });
  });
  return { value: { cases }, errors };
}

/* ---------- Icons (Lucide, ISC – lucide.dev) ---------- */
const glyph = (d: TemplateResult, cls = "ui-eds__glyph") => html`<svg class=${cls} viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
/* a table with a check – the set's mark */
const markIcon = svg`<rect x="3.5" y="4.5" width="17" height="15" rx="2"></rect><path d="M3.5 9.5h17M9.5 9.5v10"></path><path d="M12.5 14.5l1.75 1.75 3.25-3.5"></path>`;
const plusIcon = glyph(svg`<path d="M12 5v14M5 12h14"></path>`);
const importIcon = glyph(svg`<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5"></path><path d="M5 19.5h14"></path>`);
const exportIcon = glyph(svg`<path d="M12 15V4M7.5 8.5 12 4l4.5 4.5"></path><path d="M5 19.5h14"></path>`);
const closeIcon = glyph(svg`<path d="M7 7l10 10M17 7L7 17"></path>`);
const trashIcon = glyph(svg`<path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"></path>`);
const alertIcon = glyph(svg`<path d="M12 8v5M12 16.5h.01"></path><circle cx="12" cy="12" r="8.5"></circle>`, "ui-eds__alert");
const pencilIcon = glyph(svg`<path d="M4 20h4L19 9l-4-4L4 16v4z"></path><path d="M13.5 6.5l4 4"></path>`);
const searchIcon = glyph(svg`<circle cx="11" cy="11" r="6"></circle><path d="m19.5 19.5-4-4"></path>`, "ui-eds__search-icon");
const chevronDown = html`<svg class="ui-eds__chevron" viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M4.5 6.25 8 9.75l3.5-3.5"></path>`}</svg>`;

/** The windowed table renders rows near the scroll position above this many cases */
const VIRTUAL_FROM = 60;
const OVERSCAN = 20;
const ROW = 40;
const PAGE = 10;
const COLS = 4;
const COLUMNS = ["Case", "Checks", "Tags", "Split"];
const REMOVED_SHOWN = 20;

type Cell = { r: number; c: number };
let instances = 0;

/**
 * An evaluation set's cases – input, expected output, checks, tags and split – in a windowed table with a case editor,
 * split counts and a comparison with an earlier version.
 * @tag tc-evaluation-dataset-editor
 * @fires tc-value-change - A case was added, edited, deleted or restored ({ value }: EvaluationDatasetValueChange); cancelable – prevent it to control `value`
 * @fires tc-open-change - A case was opened or closed ({ open }: EvaluationDatasetOpenChange – the case id or null); cancelable
 * @fires tc-compare-change - A version to compare with was picked ({ compare }: EvaluationDatasetCompareChange – a version id, or "" for none); cancelable
 * @fires tc-import - Import was pressed: the app reads a file and sets `value`; detail: null
 * @fires tc-export - Export was pressed ({ value, jsonl }: EvaluationDatasetExport – the set and the same set as JSON Lines)
 */
export class TcEvaluationDatasetEditor extends TcElement {
  static override ui = "eds";
  static formAssociated = true;

  /** The set. Changed by the user unless a tc-value-change listener calls preventDefault() */
  @property({ attribute: false }) accessor value: EvaluationDatasetValue = EMPTY;
  /** The splits a case can go in, in order – train, validation and test by default */
  @property({ attribute: false }) accessor splits: EvaluationSplit[] = EVALUATION_SPLITS;
  /** The kinds of check a case can have – contains, equals, matches schema and rubric by default */
  @property({ attribute: false }) accessor assertionTypes: EvaluationAssertionType[] = EVALUATION_ASSERTION_TYPES;
  /** Earlier snapshots of the set, oldest first, offered in the Compare select */
  @property({ attribute: false }) accessor versions: EvaluationDatasetVersion[] = [];
  /** The id of the version to compare with, or "" for none. Changed by the user unless tc-compare-change is prevented */
  @property() accessor compare = "";
  /** The id of the case open in the editor, or null. Changed by the user unless tc-open-change is prevented */
  @property({ attribute: false }) accessor open: string | null = null;
  /** The heading – the set's name */
  @property() accessor heading = "Evaluation set";
  /** A quieter line beside the heading, e.g. what the set tests */
  @property() accessor description = "";
  /** The table's height before it scrolls, in px */
  @property({ type: Number, attribute: "max-height" }) accessor maxHeight = 400;
  /** Submitted with the form: the set as JSON */
  @property({ reflect: true }) accessor name = "";
  /** Turns every control off and leaves the set out of the form; a disabled fieldset does the same */
  @property({ type: Boolean, reflect: true }) accessor disabled = false;

  /** @internal The split filter: "" for all */
  @state() accessor filter = "";
  /** @internal The search text */
  @state() accessor query = "";
  /** @internal Show only cases changed since the compared version */
  @state() accessor changedOnly = false;
  /** @internal The removed cases' list is open */
  @state() accessor showRemoved = false;
  /** @internal The grid's active cell */
  @state() accessor active: Cell | null = null;
  /** @internal What the status region says */
  @state() accessor spoken = "";
  /** @internal The open case shows its form instead of its read view */
  @state() accessor editing = false;
  @state() private accessor formDisabled = false;
  /** @internal A case that opens straight into its form (a new one) */
  private editOnOpen: string | null = null;

  private readonly internals: ElementInternals;
  private readonly uid = `tc-eds${++instances}`;
  private initialValue: EvaluationDatasetValue | null = null;
  private ownName = false;
  private nextId = 0;
  /** @internal Issues by case id */
  private issues = new Map<string, EvaluationIssue[]>();
  private errorCount = 0;
  private warningCount = 0;
  /** @internal Changes since the compared version, by case id */
  private changes = new Map<string, "new" | "edited">();
  private removed: EvaluationCase[] = [];
  private base: EvaluationDatasetVersion | undefined;
  private counts = new Map<string, number>();
  private baseCounts = new Map<string, number>();
  /** @internal The cases on show, after the filters */
  private view: EvaluationCase[] = [];
  private readonly window = new RowWindowController(this, {
    count: () => this.view.length,
    body: () => this.querySelector(".ui-eds__rows"),
    rowSelector: ".ui-eds__row",
    from: VIRTUAL_FROM,
    overscan: OVERSCAN,
    rowHeight: ROW,
  });

  constructor() {
    super();
    this.internals = this.attachInternals();
    // Closing or deleting the open case never drops focus to <body>
    new FocusRescueController(this, () => this.grid);
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "group");
    this.ownName ||= (this.hasAttribute("aria-label") && this.getAttribute("aria-label") !== this.heading) || this.hasAttribute("aria-labelledby");
  }

  formResetCallback() {
    const value = this.initialValue ?? EMPTY;
    // Through tc-value-change like any edit, so a controlled wrapper hears of it and keeps the value until it agrees
    if (this.emit<EvaluationDatasetValueChange>("tc-value-change", { value }, { cancelable: true })) this.value = value;
    else this.requestUpdate();
  }
  formDisabledCallback(disabled: boolean) {
    // Also called while `disabled` is reflected during an update, where a property change would be dropped – so after it
    queueMicrotask(() => (this.formDisabled = disabled));
  }

  /** @internal */
  private get isDisabled() {
    return this.disabled || this.formDisabled;
  }
  /** @internal */
  private get grid() {
    return this.querySelector<HTMLElement>(".ui-eds__grid");
  }

  /** Every problem in the set, in case order */
  get problems(): EvaluationIssue[] {
    return [...this.issues.values()].flat();
  }
  /** What changed since the compared version; null when not comparing */
  get comparison(): EvaluationComparison | null {
    if (!this.base) return null;
    const added: string[] = [];
    const edited: string[] = [];
    for (const [id, kind] of this.changes) (kind === "new" ? added : edited).push(id);
    return { added, edited, removed: this.removed };
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // The reset baseline is what the first render shows, so props a framework sets after connecting (React does) count
    if (!this.hasUpdated) this.initialValue = this.value;
    this.toggleAttribute("data-disabled", this.isDisabled);
    if (changed.has("open")) {
      this.editing = this.open !== null && this.open === this.editOnOpen;
      this.editOnOpen = null;
    }
    if (this.isDisabled) this.editing = false;
    const cases = this.value.cases;
    if (changed.has("value") || changed.has("assertionTypes") || changed.has("splits")) {
      this.issues = new Map();
      this.errorCount = this.warningCount = 0;
      for (const i of evaluationDatasetIssues(this.value, { assertionTypes: this.assertionTypes, splits: this.splits })) {
        this.issues.set(i.caseId, [...(this.issues.get(i.caseId) ?? []), i]);
        if (i.level === "error") this.errorCount++;
        else this.warningCount++;
      }
      this.counts = new Map();
      for (const c of cases) this.counts.set(c.split, (this.counts.get(c.split) ?? 0) + 1);
    }
    if (changed.has("value") || changed.has("versions") || changed.has("compare")) {
      this.base = this.compare ? this.versions.find((v) => v.id === this.compare) : undefined;
      this.changes = new Map();
      this.removed = [];
      this.baseCounts = new Map();
      if (this.base) {
        const d = compareEvaluationDatasets(this.base.cases, cases);
        for (const id of d.added) this.changes.set(id, "new");
        for (const id of d.edited) this.changes.set(id, "edited");
        this.removed = d.removed;
        for (const c of this.base.cases) this.baseCounts.set(c.split, (this.baseCounts.get(c.split) ?? 0) + 1);
      }
    }
    const filters = ["value", "versions", "compare", "filter", "query", "changedOnly"];
    if (filters.some((k) => changed.has(k))) {
      const q = this.query.trim().toLowerCase();
      const changedOnly = this.changedOnly && !!this.base;
      this.view = cases.filter(
        (c) =>
          (!this.filter || c.split === this.filter) &&
          (!changedOnly || this.changes.has(c.id)) &&
          (!q || c.input.toLowerCase().includes(q) || (c.expected ?? "").toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.tags.some((t) => t.toLowerCase().includes(q))),
      );
      if (this.active && this.active.r >= this.view.length) this.active = this.view.length ? { r: this.view.length - 1, c: this.active.c } : null;
    }
    this.window.compute();
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (!this.ownName) this.setAttribute("aria-label", this.heading);
    this.syncForm();
    // A cell outside the rendered rows has no id to point at until the window reaches it
    if (this.active && this.window.virtual && !this.querySelector(`#${this.uid}-${this.active.r}-${this.active.c}`)) this.window.reveal(this.active.r);
  }

  /** @internal */
  private syncForm() {
    // Environments without form-associated custom elements (jsdom) skip it; every supported browser has it
    if (typeof this.internals.setFormValue !== "function") return;
    const disabled = this.isDisabled;
    this.internals.setFormValue(this.name && !disabled ? JSON.stringify(this.value) : null);
    if (!disabled && this.errorCount) this.internals.setValidity({ customError: true }, `Fix ${plural(this.errorCount, "problem")} in the cases first.`, this.grid ?? undefined);
    else this.internals.setValidity({});
  }

  /* ---------- Changes ---------- */

  /** @internal */
  private commit(cases: EvaluationCase[]) {
    if (this.isDisabled) return false;
    const next: EvaluationDatasetValue = { ...this.value, cases };
    const ok = this.emit<EvaluationDatasetValueChange>("tc-value-change", { value: next }, { cancelable: true });
    if (ok) this.value = next;
    else this.requestUpdate();
    return ok;
  }
  /** @internal */
  /** @internal Patches one case – from an object, or a function of the case as it is now (handlers can run before a re-render) */
  private patchCase(id: string, patch: Partial<EvaluationCase> | ((c: EvaluationCase) => EvaluationCase)) {
    return this.commit(this.value.cases.map((c) => (c.id !== id ? c : typeof patch === "function" ? patch(c) : { ...c, ...patch })));
  }
  /** @internal */
  private setOpen(open: string | null) {
    if (open === this.open) return true;
    const ok = this.emit<EvaluationDatasetOpenChange>("tc-open-change", { open }, { cancelable: true });
    if (ok) this.open = open;
    return ok;
  }
  /** @internal */
  private setCompare(compare: string) {
    if (compare === this.compare) return;
    if (this.emit<EvaluationDatasetCompareChange>("tc-compare-change", { compare }, { cancelable: true })) this.compare = compare;
    else this.requestUpdate();
    void this.updateComplete.then(() => {
      const c = this.comparison;
      this.spoken = c && this.base ? `Compared with ${this.base.label}: ${c.added.length} new, ${c.edited.length} edited, ${c.removed.length} removed` : "Not comparing";
    });
  }
  /** @internal */
  private freshId(prefix: string, taken: Set<string>) {
    let id = "";
    do id = `${prefix}-${++this.nextId}`;
    while (taken.has(id));
    return id;
  }

  /** @internal Adds an empty case in the shown split, opens it and puts the cursor in its input */
  private addCase() {
    const id = this.freshId("case", new Set(this.value.cases.map((c) => c.id)));
    const split = this.filter || this.splits[0]?.id || "";
    if (!this.commit([...this.value.cases, { id, input: "", assertions: [], tags: [], split }])) return;
    this.query = "";
    this.editOnOpen = id;
    if (this.open === id || !this.setOpen(id)) this.editOnOpen = null;
    void this.updateComplete.then(() => {
      const r = this.view.findIndex((c) => c.id === id);
      if (r >= 0) {
        this.active = { r, c: 0 };
        this.reveal(r);
      }
      this.spoken = "Case added";
      this.querySelector<HTMLTextAreaElement>('.ui-eds__detail [data-field="input"]')?.focus();
    });
  }
  /** @internal Switches the open case to its form and puts the cursor in its input */
  private startEditing() {
    if (this.isDisabled || this.open === null) return;
    this.editing = true;
    void this.updateComplete.then(() => this.querySelector<HTMLTextAreaElement>('.ui-eds__detail [data-field="input"]')?.focus());
  }
  /** @internal Back to the read view. The field being typed in is saved first: it's removed without a blur, so its
   *  change wouldn't fire (the tags field adds its text on blur) */
  private stopEditing() {
    const active = document.activeElement;
    if (active instanceof HTMLElement && this.contains(active)) {
      if (active.matches(".ui-eds__chip-input")) active.blur();
      else if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) active.dispatchEvent(new Event("change", { bubbles: true }));
    }
    this.editing = false;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-eds__detail .ui-eds__mode")?.focus());
  }
  /** @internal */
  private deleteCase(id: string) {
    if (!this.commit(this.value.cases.filter((c) => c.id !== id))) return;
    this.setOpen(null);
    this.spoken = "Case deleted";
    void this.updateComplete.then(() => this.grid?.focus());
  }
  /** @internal Puts a removed case back where it was in the compared version */
  private restore(c: EvaluationCase) {
    if (this.value.cases.some((x) => x.id === c.id)) return;
    if (this.commit([...this.value.cases, c])) this.spoken = "Case restored";
  }
  /** @internal */
  private doExport() {
    this.emit<EvaluationDatasetExport>("tc-export", { value: this.value, jsonl: evaluationDatasetToJsonl(this.value) });
  }

  /* ---------- Filters ---------- */

  /** @internal */
  private setFilter(filter: string, focus = false) {
    this.filter = filter;
    void this.updateComplete.then(() => {
      this.spoken = plural(this.view.length, "case");
      if (focus) this.querySelector<HTMLElement>(`.ui-eds__show [aria-checked="true"]`)?.focus();
    });
  }
  /** @internal APG radio group: arrows move and pick */
  private onShowKey = (e: KeyboardEvent) => {
    const all = ["", ...this.splits.map((s) => s.id)];
    const step: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (!(e.key in step)) return;
    e.preventDefault();
    const at = all.indexOf(this.filter);
    this.setFilter(all[(at + step[e.key] + all.length) % all.length], true);
  };

  /* ---------- Grid ---------- */

  /** @internal Scrolls the table so a row is in view, and moves the window there */
  private reveal(r: number) {
    const grid = this.grid;
    if (!grid) return;
    const head = this.querySelector<HTMLElement>(".ui-eds__head")?.offsetHeight ?? 0;
    const h = this.window.rowHeight;
    if (r * h < grid.scrollTop) grid.scrollTop = r * h;
    else if (head + (r + 1) * h > grid.scrollTop + grid.clientHeight) grid.scrollTop = head + (r + 1) * h - grid.clientHeight;
    this.window.reveal(r);
  }

  /** @internal The columns on screen – narrow, Checks and Tags give way */
  private visibleColumns() {
    const heads = [...this.querySelectorAll<HTMLElement>(".ui-eds__head [data-col]")];
    const shown = heads.filter((el) => getComputedStyle(el).display !== "none").map((el) => Number(el.dataset.col));
    return shown.length ? shown : [0];
  }

  /** @internal APG grid: arrows, Home / End, Ctrl+Home / End, Page Up / Down; Enter or Space opens; Esc closes */
  private onGridKey = (e: KeyboardEvent) => {
    if (e.target !== e.currentTarget) return;
    const rows = this.view.length;
    if (e.key === "Escape") {
      if (this.open) {
        e.preventDefault();
        this.setOpen(null);
      }
      return;
    }
    if (!rows) return;
    const cols = this.visibleColumns();
    const at = this.active ?? { r: 0, c: cols[0] };
    const ci = Math.max(0, cols.indexOf(at.c));
    const mod = e.ctrlKey || e.metaKey;
    const moves: Record<string, Cell> = {
      ArrowDown: { r: at.r + 1, c: at.c },
      ArrowUp: { r: at.r - 1, c: at.c },
      ArrowRight: { r: at.r, c: cols[Math.min(cols.length - 1, ci + 1)] },
      ArrowLeft: { r: at.r, c: cols[Math.max(0, ci - 1)] },
      Home: mod ? { r: 0, c: cols[0] } : { r: at.r, c: cols[0] },
      End: mod ? { r: rows - 1, c: cols[cols.length - 1] } : { r: at.r, c: cols[cols.length - 1] },
      PageDown: { r: at.r + PAGE, c: at.c },
      PageUp: { r: at.r - PAGE, c: at.c },
    };
    if (e.key in moves) {
      e.preventDefault();
      const to = moves[e.key];
      const next = this.active ? { r: Math.max(0, Math.min(rows - 1, to.r)), c: cols.includes(to.c) ? to.c : cols[0] } : at;
      this.active = next;
      this.reveal(next.r);
      return;
    }
    if (e.key === "Enter" || e.key === " " || e.key === "F2") {
      e.preventDefault();
      this.active = at;
      const c = this.view[at.r];
      if (!c) return;
      // F2 opens the case in its form
      if (e.key === "F2") {
        if (this.open === c.id) this.startEditing();
        else {
          this.editOnOpen = c.id;
          if (!this.setOpen(c.id)) this.editOnOpen = null;
          else void this.updateComplete.then(() => this.querySelector<HTMLTextAreaElement>('.ui-eds__detail [data-field="input"]')?.focus());
        }
      } else this.setOpen(c.id);
    }
  };

  /* ---------- Render ---------- */

  /** @internal "New" or "Edited" since the compared version – text, not colour alone */
  private changePill(id: string) {
    const kind = this.changes.get(id);
    return kind ? html`<span class="ui-eds__change" data-kind=${kind}>${kind === "new" ? "New" : "Edited"}</span>` : nothing;
  }
  /** @internal */
  private splitLabel(id: string) {
    return this.splits.find((s) => s.id === id)?.label ?? (id || "No split");
  }
  /** @internal */
  private tone(id: string) {
    const i = this.splits.findIndex((s) => s.id === id);
    return i < 0 ? "none" : TONES[i % TONES.length];
  }
  /** @internal Tags as small chips: the first two, then "+n" */
  private chips(tags: string[]) {
    return html`${tags.slice(0, 2).map((t) => html`<span class="ui-eds__tag">${t}</span>`)}${tags.length > 2 ? html`<span class="ui-eds__tag" data-more title=${tags.slice(2).join(", ")}>+${tags.length - 2}</span>` : nothing}`;
  }
  /** @internal "Expected · 2 checks", or "Nothing checked" */
  private checksText(c: EvaluationCase) {
    const parts = [c.expected?.trim() ? "Expected" : "", c.assertions.length ? plural(c.assertions.length, "check") : ""].filter(Boolean);
    return parts.length ? parts.join(" · ") : "Nothing checked";
  }

  /** @internal The split bar and its legend */
  private renderSplits() {
    const total = this.value.cases.length;
    const comparing = !!this.base;
    const known = new Set(this.splits.map((s) => s.id));
    const other = this.value.cases.length - this.splits.reduce((n, s) => n + (this.counts.get(s.id) ?? 0), 0);
    const entries = [...this.splits.map((s) => ({ id: s.id, label: s.label, n: this.counts.get(s.id) ?? 0, was: this.baseCounts.get(s.id) ?? 0 })), ...(other > 0 ? [{ id: "", label: "No split", n: other, was: [...this.baseCounts].filter(([k]) => !known.has(k)).reduce((a, [, v]) => a + v, 0) }] : [])];
    return html`<div class="ui-eds__splits">
      <div class="ui-eds__track" aria-hidden="true">
        ${total ? entries.filter((s) => s.n).map((s) => html`<span class="ui-eds__seg" data-tone=${this.tone(s.id)} style=${styleMap({ flexGrow: String(s.n) })}></span>`) : nothing}
      </div>
      <ul class="ui-eds__legend" aria-label="Cases by split">
        ${entries.map((s) => {
          const delta = s.n - s.was;
          return html`<li class="ui-eds__split">
            <span class="ui-eds__swatch" data-tone=${this.tone(s.id)} aria-hidden="true"></span>
            <span class="ui-eds__split-label">${s.label}</span>
            <span class="ui-eds__split-n">${s.n.toLocaleString("en-US")}</span>
            <span class="ui-eds__split-pct"><span class="ui-eds__sr">, </span>${total ? `${Math.round((s.n / total) * 100)}%` : "–"}</span>
            ${comparing && delta ? html`<span class="ui-eds__delta" data-tone=${delta > 0 ? "up" : "down"}><span class="ui-eds__sr">, </span>${delta > 0 ? "+" : "−"}${Math.abs(delta).toLocaleString("en-US")}<span class="ui-eds__sr"> since ${this.base!.label}</span></span>` : nothing}
          </li>`;
        })}
      </ul>
    </div>`;
  }

  /** @internal Split filter, search, changed-only and the removed cases */
  private renderFilters() {
    const all = this.value.cases.length;
    const comparing = !!this.base;
    const changedN = this.changes.size;
    const options = [{ id: "", label: "All", n: all }, ...this.splits.map((s) => ({ id: s.id, label: s.label, n: this.counts.get(s.id) ?? 0 }))];
    return html`<div class="ui-eds__filters">
      <div class="ui-eds__show" role="radiogroup" aria-label="Split" @keydown=${this.onShowKey}>
        ${options.map(
          (o) => html`<button type="button" role="radio" class="ui-eds__opt" aria-checked=${o.id === this.filter ? "true" : "false"} tabindex=${o.id === this.filter ? "0" : "-1"} @click=${() => this.setFilter(o.id)}>
            ${o.label}<span class="ui-eds__count"><span class="ui-eds__sr">, </span>${compact(o.n)}<span class="ui-eds__sr"> ${o.n === 1 ? "case" : "cases"}</span></span>
          </button>`,
        )}
      </div>
      <label class="ui-eds__search">
        ${searchIcon}
        <input
          type="search"
          class="ui-eds__search-input"
          placeholder="Search cases"
          aria-label="Search cases"
          .value=${live(this.query)}
          @input=${(e: Event) => {
            this.query = (e.target as HTMLInputElement).value;
            void this.updateComplete.then(() => (this.spoken = plural(this.view.length, "case")));
          }}
        />
      </label>
      ${comparing
        ? html`<button type="button" class="ui-eds__toggle" aria-pressed=${this.changedOnly ? "true" : "false"} @click=${() => {
              this.changedOnly = !this.changedOnly;
              void this.updateComplete.then(() => (this.spoken = plural(this.view.length, "case")));
            }}>
              Changed<span class="ui-eds__count"><span class="ui-eds__sr">, </span>${compact(changedN)}<span class="ui-eds__sr"> ${changedN === 1 ? "case" : "cases"}</span></span>
            </button>
            ${this.removed.length
              ? html`<button type="button" class="ui-eds__toggle" aria-expanded=${this.showRemoved ? "true" : "false"} aria-controls=${`${this.uid}-removed`} @click=${() => (this.showRemoved = !this.showRemoved)}>
                  ${plural(this.removed.length, "removed case", "removed cases")}
                </button>`
              : nothing}`
        : nothing}
    </div>
    ${comparing && this.removed.length && this.showRemoved
      ? html`<div class="ui-eds__removed" id=${`${this.uid}-removed`}>
          <p class="ui-eds__removed-title">In ${this.base!.label}, not in this version</p>
          <ul class="ui-eds__removed-list">
            ${this.removed.slice(0, REMOVED_SHOWN).map(
              (c) => html`<li class="ui-eds__removed-item">
                <span class="ui-eds__removed-text" title=${c.input}>${c.input || c.id}</span>
                <span class="ui-eds__pill" data-tone=${this.tone(c.split)}>${this.splitLabel(c.split)}</span>
                <button type="button" class="ui-eds__link" ?disabled=${this.isDisabled} aria-label=${`Restore “${c.input || c.id}”`} @click=${() => this.restore(c)}>Restore</button>
              </li>`,
            )}
          </ul>
          ${this.removed.length > REMOVED_SHOWN ? html`<p class="ui-eds__more">and ${plural(this.removed.length - REMOVED_SHOWN, "more")}</p>` : nothing}
        </div>`
      : nothing}`;
  }

  /** @internal One case's row */
  private row(c: EvaluationCase, r: number): TemplateResult {
    const a = this.active;
    const issues = this.issues.get(c.id) ?? [];
    const level = issues.some((i) => i.level === "error") ? "error" : issues.length ? "warning" : undefined;
    const cell = (col: number, content: unknown, cls: string) => html`<div
      class=${`ui-eds__cell ${cls}`}
      role="gridcell"
      id=${`${this.uid}-${r}-${col}`}
      data-col=${col}
      ?data-active=${a?.r === r && a.c === col}
      @click=${() => {
        this.active = { r, c: col };
        this.setOpen(c.id);
      }}
    >${content}</div>`;
    return html`<div class="ui-eds__row" role="row" aria-rowindex=${r + 2} ?data-open=${this.open === c.id} data-level=${ifDefined(level)}>
      ${cell(
        0,
        html`<span class="ui-eds__case-main">${this.changePill(c.id)}${level ? html`<span class="ui-eds__flag" data-level=${level}>${alertIcon}<span class="ui-eds__sr">${level === "error" ? "Has a problem" : "Has a warning"}, </span></span>` : nothing}<span class="ui-eds__input-text">${c.input || html`<span class="ui-eds__muted">No input</span>`}</span></span>${c.tags.length ? html`<span class="ui-eds__case-tags" aria-hidden="true">${this.chips(c.tags)}</span>` : nothing}`,
        "ui-eds__case",
      )}
      ${cell(1, html`<span class="ui-eds__checks" ?data-none=${!c.expected?.trim() && !c.assertions.length}>${this.checksText(c)}</span>`, "ui-eds__col-checks")}
      ${cell(2, html`<span class="ui-eds__chips-row">${this.chips(c.tags)}</span>`, "ui-eds__col-tags")}
      ${cell(3, html`<span class="ui-eds__pill" data-tone=${this.tone(c.split)}>${this.splitLabel(c.split)}</span>`, "ui-eds__col-split")}
    </div>`;
  }

  /** @internal A check as a rule: output contains "refund" · output matches schema {refund_id, amount} · rubric: … */
  private rule(a: EvaluationAssertion, broken: boolean) {
    const t = this.assertionTypes.find((x) => x.id === a.type);
    const verb = (t?.label ?? a.type).toLowerCase();
    if (t?.json) {
      let keys: string[] | null = null;
      try {
        const v: unknown = JSON.parse(a.value);
        const o = v && typeof v === "object" ? (v as { properties?: object; required?: string[] }) : {};
        keys = o.properties ? Object.keys(o.properties) : Array.isArray(o.required) ? o.required : [];
      } catch {
        keys = null;
      }
      return html`<span class="ui-eds__kw">output</span> <span class="ui-eds__verb">${verb}</span> ${keys === null
        ? html`<span class="ui-eds__lit" data-broken>${a.value || "…"}</span>`
        : html`<span class="ui-eds__punct">{</span><span class="ui-eds__prop">${keys.join(", ")}</span><span class="ui-eds__punct">}</span>`}`;
    }
    // A long-text check (a rubric) reads as its criterion
    if (t?.multiline) return html`<span class="ui-eds__verb">${verb}:</span> <span class="ui-eds__crit">${a.value || "…"}</span>`;
    return html`<span class="ui-eds__kw">output</span> <span class="ui-eds__verb">${verb}</span> <span class="ui-eds__lit" ?data-broken=${broken}>“${a.value}”</span>`;
  }

  /** @internal The open case as a test case: the prompt beside the rules it has to pass */
  private readView(c: EvaluationCase, titleId: string) {
    const issues = this.issues.get(c.id) ?? [];
    return html`<div class="ui-eds__read" tabindex="0" role="group" aria-labelledby=${titleId} aria-describedby=${`${titleId}-hint`}>
      <span class="ui-eds__sr" id=${`${titleId}-hint`}>Enter or F2 to edit</span>
      <div class="ui-eds__read-side">
        <span class="ui-eds__label">Input</span>
        ${c.input.trim() ? html`<blockquote class="ui-eds__prompt">${c.input}</blockquote>` : html`<p class="ui-eds__prompt" data-empty>No input yet</p>`}
        <div class="ui-eds__read-meta">
          <span class="ui-eds__pill" data-tone=${this.tone(c.split)}>${this.splitLabel(c.split)}</span>
          ${c.tags.map((t) => html`<span class="ui-eds__tag">${t}</span>`)}
        </div>
      </div>
      <div class="ui-eds__read-side">
        <span class="ui-eds__label">Passes when</span>
        ${c.assertions.length || c.expected?.trim()
          ? html`<ul class="ui-eds__rules">
              ${c.assertions.map((a) => {
                const broken = issues.some((i) => i.assertionId === a.id);
                return html`<li class="ui-eds__rule" ?data-broken=${broken}>${broken ? html`<span class="ui-eds__flag" data-level="error">${alertIcon}<span class="ui-eds__sr">Problem: </span></span>` : nothing}<code class="ui-eds__code">${this.rule(a, broken)}</code></li>`;
              })}
              ${c.expected?.trim() ? html`<li class="ui-eds__rule"><code class="ui-eds__code"><span class="ui-eds__kw">output</span> <span class="ui-eds__verb">resembles</span> <span class="ui-eds__lit">“${c.expected}”</span></code></li>` : nothing}
            </ul>`
          : html`<p class="ui-eds__muted ui-eds__small">Nothing checked yet</p>`}
      </div>
    </div>`;
  }

  /** @internal The open case: its read view, or its form while editing */
  private detail() {
    const c = this.open === null ? undefined : this.value.cases.find((x) => x.id === this.open);
    if (!c) return nothing;
    const disabled = this.isDisabled;
    const issues = this.issues.get(c.id) ?? [];
    const caseIssues = issues.filter((i) => !i.assertionId);
    const titleId = `${this.uid}-case`;
    const close = () => {
      this.setOpen(null);
      this.grid?.focus();
    };
    const types = this.assertionTypes;
    const splitKey = (e: KeyboardEvent) => {
      const step: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      if (!(e.key in step) || !this.splits.length) return;
      e.preventDefault();
      const at = Math.max(0, this.splits.findIndex((s) => s.id === c.split));
      const next = this.splits[(at + step[e.key] + this.splits.length) % this.splits.length];
      this.patchCase(c.id, { split: next.id });
      void this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-eds__radio[aria-checked="true"]`)?.focus());
    };
    const addTag = (input: HTMLInputElement) => {
      const t = input.value.trim();
      input.value = "";
      if (t) this.patchCase(c.id, (cur) => (cur.tags.includes(t) ? cur : { ...cur, tags: [...cur.tags, t] }));
    };
    return html`<section class="ui-eds__detail" aria-labelledby=${titleId} ?data-editing=${this.editing} @keydown=${(e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (this.editing) this.stopEditing();
        else close();
      } else if (!this.editing && (e.key === "F2" || (e.key === "Enter" && (e.target as Element).classList.contains("ui-eds__read")))) {
        e.preventDefault();
        this.startEditing();
      }
    }}>
      <div class="ui-eds__detail-head">
        <h4 class="ui-eds__detail-title" id=${titleId}>Case <span class="ui-eds__id">${c.id}</span></h4>
        ${this.changePill(c.id)}
        ${this.editing
          ? html`<button type="button" class="ui-eds__btn ui-eds__mode" data-primary @click=${() => this.stopEditing()}>Done</button>`
          : html`<button type="button" class="ui-eds__btn ui-eds__mode" ?disabled=${disabled} @click=${() => this.startEditing()}>${pencilIcon}<span>Edit</span></button>`}
        <button type="button" class="ui-eds__icon-btn" aria-label="Close case" title="Close" @click=${close}>${closeIcon}</button>
      </div>
      ${this.editing
        ? html`<div class="ui-eds__form">
          <label class="ui-eds__field">
            <span class="ui-eds__label">Input</span>
            <textarea class="ui-eds__input" data-field="input" rows="3" placeholder="The prompt the model is given" aria-invalid=${!c.input.trim() ? "true" : "false"} .value=${live(c.input)} ?disabled=${disabled} @change=${(e: Event) => this.patchCase(c.id, { input: (e.target as HTMLTextAreaElement).value })}></textarea>
          </label>
          <label class="ui-eds__field">
            <span class="ui-eds__label">Expected output <span class="ui-eds__opt-hint">optional</span></span>
            <textarea class="ui-eds__input" data-field="expected" rows="2" placeholder="What a good answer says" .value=${live(c.expected ?? "")} ?disabled=${disabled} @change=${(e: Event) => {
              const v = (e.target as HTMLTextAreaElement).value;
              this.patchCase(c.id, ({ expected: _drop, ...rest }) => (v ? { ...rest, expected: v } : rest));
            }}></textarea>
          </label>
          <div class="ui-eds__field" role="group" aria-labelledby=${`${titleId}-checks`}>
            <span class="ui-eds__label" id=${`${titleId}-checks`}>Checks</span>
            ${c.assertions.length ? nothing : html`<p class="ui-eds__muted ui-eds__small">No checks – the expected output is compared as it is.</p>`}
            <ol class="ui-eds__asserts">
              ${repeat(
                c.assertions,
                (x) => x.id,
                (x, i) => {
                  const t = types.find((y) => y.id === x.type);
                  const err = issues.find((y) => y.assertionId === x.id);
                  const errId = `${this.uid}-a-${x.id}-e`;
                  const patch = (p: Partial<EvaluationAssertion>) => this.patchCase(c.id, (cur) => ({ ...cur, assertions: cur.assertions.map((y) => (y.id === x.id ? { ...y, ...p } : y)) }));
                  const onValue = (e: Event) => patch({ value: (e.target as HTMLInputElement | HTMLTextAreaElement).value });
                  return html`<li class="ui-eds__assert" data-focus-key=${`check:${c.id}`}>
                    <span class="ui-eds__select">
                      <select class="ui-eds__input" aria-label=${`Check ${i + 1} type`} ?disabled=${disabled} @change=${(e: Event) => patch({ type: (e.target as HTMLSelectElement).value })}>
                        ${t ? nothing : html`<option value="" .selected=${live(true)} disabled>Pick a type</option>`}
                        ${types.map((y) => html`<option value=${y.id} .selected=${live(y.id === x.type)}>${y.label}</option>`)}
                      </select>${chevronDown}
                    </span>
                    ${t?.multiline
                      ? html`<textarea class="ui-eds__input ui-eds__value" data-mono=${ifDefined(t.json ? "" : undefined)} rows="2" aria-label=${`Check ${i + 1} value`} aria-invalid=${err ? "true" : "false"} aria-describedby=${ifDefined(err ? errId : undefined)} placeholder=${t.placeholder ?? ""} .value=${live(x.value)} ?disabled=${disabled} @change=${onValue}></textarea>`
                      : html`<input class="ui-eds__input ui-eds__value" aria-label=${`Check ${i + 1} value`} aria-invalid=${err ? "true" : "false"} aria-describedby=${ifDefined(err ? errId : undefined)} placeholder=${t?.placeholder ?? ""} .value=${live(x.value)} ?disabled=${disabled} @change=${onValue} />`}
                    <button type="button" class="ui-eds__icon-btn" aria-label=${`Remove check ${i + 1}`} title="Remove" ?disabled=${disabled} @click=${() => this.patchCase(c.id, (cur) => ({ ...cur, assertions: cur.assertions.filter((y) => y.id !== x.id) }))}>${trashIcon}</button>
                    ${err ? html`<span class="ui-eds__error" id=${errId}>${err.message}</span>` : t?.description ? html`<span class="ui-eds__hint">${t.description}</span>` : nothing}
                  </li>`;
                },
              )}
            </ol>
            <button
              type="button"
              class="ui-eds__ghost"
              data-focus-key=${`check:${c.id}`}
              ?disabled=${disabled || !types.length}
              @click=${() => {
                const id = this.freshId("check", new Set(c.assertions.map((a) => a.id)));
                if (!this.patchCase(c.id, (cur) => ({ ...cur, assertions: [...cur.assertions, { id, type: types[0].id, value: "" }] }))) return;
                void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-eds__assert:last-child .ui-eds__value")?.focus());
              }}
            >${plusIcon}Add check</button>
          </div>
          <div class="ui-eds__field">
            <span class="ui-eds__label" id=${`${titleId}-tags`}>Tags</span>
            <div class="ui-eds__chips">
              ${c.tags.map(
                (t) => html`<span class="ui-eds__chip" data-focus-key=${`tag:${c.id}`}>${t}<button type="button" class="ui-eds__chip-x" aria-label=${`Remove tag ${t}`} ?disabled=${disabled} @click=${() => this.patchCase(c.id, (cur) => ({ ...cur, tags: cur.tags.filter((x) => x !== t) }))}>${closeIcon}</button></span>`,
              )}
              <input
                class="ui-eds__chip-input"
                data-focus-key=${`tag:${c.id}`}
                aria-labelledby=${`${titleId}-tags`}
                placeholder=${c.tags.length ? "Add a tag" : "Add a tag – Enter to add"}
                ?disabled=${disabled}
                @keydown=${(e: KeyboardEvent) => {
                  const input = e.target as HTMLInputElement;
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag(input);
                  } else if (e.key === "Backspace" && !input.value && c.tags.length) this.patchCase(c.id, (cur) => ({ ...cur, tags: cur.tags.slice(0, -1) }));
                }}
                @blur=${(e: Event) => addTag(e.target as HTMLInputElement)}
              />
            </div>
          </div>
          <div class="ui-eds__field">
            <span class="ui-eds__label" id=${`${titleId}-split`}>Split</span>
            <div class="ui-eds__radios" role="radiogroup" aria-labelledby=${`${titleId}-split`} @keydown=${splitKey}>
              ${this.splits.map((s, i) => {
                const on = s.id === c.split;
                const focusable = on || (!this.splits.some((x) => x.id === c.split) && i === 0);
                return html`<button type="button" role="radio" class="ui-eds__radio" aria-checked=${on ? "true" : "false"} tabindex=${focusable ? "0" : "-1"} ?disabled=${disabled} @click=${() => this.patchCase(c.id, { split: s.id })}>
                  <span class="ui-eds__dot" data-tone=${this.tone(s.id)} aria-hidden="true"></span>${s.label}
                </button>`;
              })}
            </div>
          </div>
          <div class="ui-eds__detail-foot">
            <button type="button" class="ui-eds__danger" ?disabled=${disabled} @click=${() => this.deleteCase(c.id)}>${trashIcon}Delete case</button>
          </div>
        </div>`
        : this.readView(c, titleId)}
      ${caseIssues.length
        ? html`<ul class="ui-eds__issues">${caseIssues.map((i) => html`<li class="ui-eds__issue" data-level=${i.level}>${alertIcon}<span>${i.message}</span></li>`)}</ul>`
        : nothing}
    </section>`;
  }

  protected override render() {
    const view = this.view;
    const { start, end } = this.window;
    const h = this.window.rowHeight;
    const a = this.active;
    const activeId = a && a.r >= start && a.r < end ? `${this.uid}-${a.r}-${a.c}` : undefined;
    const titleId = `${this.uid}-title`;
    const total = this.value.cases.length;
    const disabled = this.isDisabled;
    const opened = this.open !== null && this.value.cases.some((c) => c.id === this.open);
    const filtered = view.length !== total;
    return html`
      ${cardHead({
        icon: markIcon,
        title: this.heading,
        id: titleId,
        subtitle: html`<span class="ui-eds__summary">${filtered ? `${compact(view.length)} of ${plural(total, "case")}` : plural(total, "case")}${this.description ? html` · ${this.description}` : nothing}</span>`,
        aside: html`${this.errorCount ? html`<span class="ui-eds__status" data-tone="danger">${plural(this.errorCount, "problem")}</span>` : this.warningCount ? html`<span class="ui-eds__status" data-tone="warning">${plural(this.warningCount, "warning")}</span>` : nothing}
        <div class="ui-eds__actions">
          ${this.versions.length
            ? html`<span class="ui-eds__select ui-eds__compare">
                <select class="ui-eds__input" aria-label="Compare with" ?disabled=${disabled} @change=${(e: Event) => this.setCompare((e.target as HTMLSelectElement).value)}>
                  <option value="" .selected=${live(!this.base)}>Compare with…</option>
                  ${this.versions.map((v) => html`<option value=${v.id} .selected=${live(v.id === this.base?.id)}>${v.label}${v.detail ? ` · ${v.detail}` : ""}</option>`)}
                </select>${chevronDown}
              </span>`
            : nothing}
          <button type="button" class="ui-eds__btn" ?disabled=${disabled} @click=${() => this.emit("tc-import", null)} title="Import">${importIcon}<span>Import</span></button>
          <button type="button" class="ui-eds__btn" ?disabled=${!total} @click=${() => this.doExport()} title="Export">${exportIcon}<span>Export</span></button>
          <button type="button" class="ui-eds__btn" data-primary ?disabled=${disabled} @click=${() => this.addCase()} title="Add case">${plusIcon}<span>Add case</span></button>
        </div>`,
      })}
      <div class="ui-eds__card">
        ${this.renderSplits()}
        ${this.renderFilters()}
        <div class="ui-eds__main" ?data-open=${opened}>
          <div
            class="ui-eds__grid"
            role="grid"
            aria-labelledby=${titleId}
            aria-rowcount=${view.length + 1}
            aria-colcount=${COLS}
            aria-activedescendant=${ifDefined(activeId)}
            tabindex="0"
            style=${styleMap({ "--tc-evaluation-dataset-editor-max": `${this.maxHeight}px` })}
            @keydown=${this.onGridKey}
            @focus=${() => {
              if (!this.active && view.length) this.active = { r: 0, c: 0 };
            }}
          >
            <div class="ui-eds__head" role="rowgroup">
              <div class="ui-eds__row" role="row" aria-rowindex="1">
                ${COLUMNS.map((label, i) => html`<div class=${`ui-eds__cell ${["ui-eds__case", "ui-eds__col-checks", "ui-eds__col-tags", "ui-eds__col-split"][i]}`} role="columnheader" data-col=${i}>${label}</div>`)}
              </div>
            </div>
            <div class="ui-eds__rows" role="rowgroup">
              <div class="ui-eds__spacer" aria-hidden="true" style=${styleMap({ height: `${start * h}px` })}></div>
              ${repeat(view.slice(start, end), (c) => c.id, (c, i) => this.row(c, start + i))}
              <div class="ui-eds__spacer" aria-hidden="true" style=${styleMap({ height: `${(view.length - end) * h}px` })}></div>
            </div>
            ${view.length === 0 ? html`<p class="ui-eds__empty">${total ? "No cases match these filters" : "No cases yet – add one or import a file"}</p>` : nothing}
          </div>
          ${this.detail()}
        </div>
      </div>
      <span class="ui-eds__sr" role="status">${this.spoken}</span>
    `;
  }

  static override css = /* css */ `
/* Sizes as variables – override them on [data-ui="eds"] */
[data-ui="eds"] {
  --tc-evaluation-dataset-editor-row: 40px;
  --tc-evaluation-dataset-editor-side: 380px;
  --tc-evaluation-dataset-editor-columns: minmax(0, 1fr) 148px 168px 104px;
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
  container: ui-eds / inline-size;
}
/* Clean: no tray – one white card with hairline dividers */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="eds"] {
  --tc-evaluation-dataset-editor-row: 38px;
  padding: 0;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
}
[data-ui="eds"] *, [data-ui="eds"] *::before, [data-ui="eds"] *::after { box-sizing: border-box; }
[data-ui="eds"] svg { display: block; flex: none; }
[data-ui="eds"] :is(p, h4, ol, ul) { margin: 0; padding: 0; }
[data-ui="eds"] :is(ol, ul) { list-style: none; }
:where([data-ui="eds"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="eds"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="eds"] button:disabled { cursor: not-allowed; opacity: 0.5; }
.ui-eds__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-eds__glyph { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *) .ui-eds__glyph { stroke-width: 1.4; }
.ui-eds__muted { color: var(--tc-text-muted); }
.ui-eds__input-text .ui-eds__muted { color: var(--tc-text-secondary); font-style: italic; }
.ui-eds__small { font-size: var(--tc-font-size-sm); }

/* ----- The header (cardHead): on the tray in Standard, the card's first row in Clean; problems and the set's actions at
   its right ----- */
.ui-eds__summary { font-variant-numeric: tabular-nums; }
.ui-eds__status { display: inline-flex; flex: none; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-eds__status[data-tone="danger"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-eds__status[data-tone="warning"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-eds__actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5); }
.ui-eds__btn { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm) 0 var(--tc-space-2); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard); }
[data-ui="eds"] .ui-eds__btn:hover:not(:disabled) { box-shadow: var(--tc-action-secondary-shadow-hover); }
[data-ui="eds"] .ui-eds__btn[data-primary] { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
[data-ui="eds"] .ui-eds__btn[data-primary]:hover:not(:disabled) { background: var(--tc-action-primary-bg-hover); }
.ui-eds__compare { width: 168px; }
/* Compact: the compare select sits in the header's row of small buttons */
.ui-eds__compare .ui-eds__input { height: var(--tc-control-h-sm); padding-left: var(--tc-space-2-5); border-radius: var(--tc-control-radius-sm); }

/* ----- The card ----- */
.ui-eds__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-eds__card { border-top: var(--tc-hairline) solid var(--tc-divider); border-radius: 0 0 var(--tc-card-radius) var(--tc-card-radius); background: none; box-shadow: none; }

/* ----- Splits: a stacked bar and its legend ----- */
.ui-eds__splits { display: grid; gap: var(--tc-space-2-5); padding: var(--tc-space-3-5) var(--tc-space-3-5) var(--tc-space-3); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-eds__track { display: flex; gap: var(--tc-space-0-5); height: var(--tc-meter-h); overflow: hidden; border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); }
.ui-eds__seg { flex-basis: 0; min-width: 2px; transition: flex-grow var(--tc-duration-moderate) var(--tc-ease-move); }
.ui-eds__legend { display: flex; flex-wrap: wrap; gap: var(--tc-space-1) var(--tc-space-4); }
.ui-eds__split { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-sm); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-eds__swatch, .ui-eds__dot { flex: none; width: 8px; height: 8px; border-radius: var(--tc-radius-2xs); }
:where([data-look="clean"], [data-look="clean"] *) :is(.ui-eds__swatch, .ui-eds__dot) { border-radius: 50%; }
.ui-eds__split-label { color: var(--tc-text-secondary); }
.ui-eds__split-n { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
.ui-eds__split-pct { color: var(--tc-text-muted); }
.ui-eds__delta { padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-xs); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-eds__delta[data-tone="up"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-eds__delta[data-tone="down"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
[data-tone="teal"]:is(.ui-eds__seg, .ui-eds__swatch, .ui-eds__dot) { background: var(--tc-tone-teal-solid); }
[data-tone="violet"]:is(.ui-eds__seg, .ui-eds__swatch, .ui-eds__dot) { background: var(--tc-tone-violet-solid); }
[data-tone="amber"]:is(.ui-eds__seg, .ui-eds__swatch, .ui-eds__dot) { background: var(--tc-tone-amber-solid); }
[data-tone="pink"]:is(.ui-eds__seg, .ui-eds__swatch, .ui-eds__dot) { background: var(--tc-tone-pink-solid); }
[data-tone="rose"]:is(.ui-eds__seg, .ui-eds__swatch, .ui-eds__dot) { background: var(--tc-tone-rose-solid); }
[data-tone="none"]:is(.ui-eds__seg, .ui-eds__swatch, .ui-eds__dot) { background: var(--tc-chart-neutral); }

/* ----- Filters: the split as a segmented radio group, search, changed and removed ----- */
.ui-eds__filters { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); padding: var(--tc-space-2-5) var(--tc-space-3); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-eds__show { display: flex; flex: none; max-width: 100%; overflow-x: auto; padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
.ui-eds__opt { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: calc(var(--tc-control-h-sm) - 2 * var(--tc-seg-pad)); padding: 0 var(--tc-space-2-5); border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-text-secondary); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
[data-ui="eds"] .ui-eds__opt:hover { color: var(--tc-text-primary); }
[data-ui="eds"] .ui-eds__opt[aria-checked="true"] { background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow); color: var(--tc-text-primary); }
.ui-eds__count { color: var(--tc-text-muted); font-weight: var(--tc-font-weight-regular); font-variant-numeric: tabular-nums; }
.ui-eds__search { position: relative; display: flex; flex: 1 1 160px; align-items: center; min-width: 0; }
.ui-eds__search-icon { position: absolute; left: var(--tc-space-2-5); width: 14px; height: 14px; fill: none; stroke: var(--tc-icon-muted); stroke-width: 1.8; stroke-linecap: round; pointer-events: none; }
.ui-eds__search-input { width: 100%; min-width: 0; height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2-5) 0 var(--tc-space-7); border: 0; border-radius: var(--tc-control-radius-sm); outline: 0; background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); color: var(--tc-text-primary); font: inherit; font-size: var(--tc-field-font-size); }
.ui-eds__search-input:focus-visible { box-shadow: var(--tc-field-shadow-focus); }
.ui-eds__search-input::placeholder { color: var(--tc-text-placeholder); }
.ui-eds__toggle { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-pill-h-lg); padding: 0 var(--tc-pill-px-lg); border-radius: var(--tc-pill-radius); background: var(--tc-fill-subtle); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); color: var(--tc-text-secondary); font-size: var(--tc-pill-font-size-lg); font-weight: var(--tc-pill-font-weight); white-space: nowrap; }
[data-ui="eds"] .ui-eds__toggle:hover { background: var(--tc-fill-hover); }
[data-ui="eds"] .ui-eds__toggle:is([aria-pressed="true"], [aria-expanded="true"]) { background: var(--tc-accent-subtle); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-selected); color: var(--tc-accent-text); }
.ui-eds__toggle[aria-pressed="true"] .ui-eds__count { color: inherit; }
.ui-eds__removed { display: grid; gap: var(--tc-space-1-5); padding: var(--tc-space-2-5) var(--tc-space-3-5); border-bottom: var(--tc-hairline) solid var(--tc-divider); background: var(--tc-surface-well); }
.ui-eds__removed-title, .ui-eds__more { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-eds__removed-list { display: grid; gap: var(--tc-space-1); }
.ui-eds__removed-item { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; font-size: var(--tc-font-size-sm); }
.ui-eds__removed-text { flex: 1; min-width: 0; overflow: hidden; color: var(--tc-text-secondary); text-decoration: line-through; text-decoration-color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
.ui-eds__link { flex: none; color: var(--tc-accent-text); font-weight: var(--tc-font-weight-medium); }
[data-ui="eds"] .ui-eds__link:hover { text-decoration: underline; }

/* ----- The table, and the open case beside it (below it when narrow) ----- */
.ui-eds__main { display: grid; grid-template-columns: minmax(0, 1fr); }
.ui-eds__grid { position: relative; max-height: var(--tc-evaluation-dataset-editor-max); overflow: auto; overscroll-behavior: contain; overflow-anchor: none; outline: none; }
.ui-eds__grid:focus-visible:not(:has([data-active])) { outline: var(--tc-focus-outline); outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
.ui-eds__head { position: sticky; top: 0; z-index: 1; background: var(--tc-surface-on-tray); }
:where([data-look="clean"], [data-look="clean"] *).ui-eds__head { background: var(--tc-surface-raised); }
.ui-eds__row { display: grid; grid-template-columns: var(--tc-evaluation-dataset-editor-columns); align-items: center; height: var(--tc-evaluation-dataset-editor-row); border-bottom: var(--tc-hairline) solid var(--tc-border-subtle); }
.ui-eds__head .ui-eds__row { height: 32px; border-bottom-color: var(--tc-divider); color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
:where([data-look="clean"], [data-look="clean"] *) .ui-eds__head .ui-eds__row { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-eds__rows .ui-eds__row:hover { background: var(--tc-fill-subtle); }
.ui-eds__row[data-open] { background: var(--tc-fill-selected); }
:where([data-look="clean"], [data-look="clean"] *).ui-eds__row[data-open] { background: var(--tc-accent-subtle); }
.ui-eds__cell { display: flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; height: 100%; padding: 0 var(--tc-space-2); overflow: hidden; white-space: nowrap; cursor: pointer; }
.ui-eds__cell.ui-eds__case { padding-left: var(--tc-space-3-5); }
.ui-eds__head .ui-eds__cell { cursor: default; }
.ui-eds__input-text, .ui-eds__checks { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.ui-eds__input-text { color: var(--tc-text-primary); }
.ui-eds__checks { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-eds__case-main { display: flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; max-width: 100%; }
/* Tags: small chips – a column when wide, a line under the input when narrow */
.ui-eds__chips-row, .ui-eds__case-tags { display: flex; gap: var(--tc-space-1); min-width: 0; overflow: hidden; }
.ui-eds__case-tags { display: none; }
.ui-eds__tag { flex: none; max-width: 72px; height: var(--tc-pill-h); padding: 0 var(--tc-space-1-5); overflow: hidden; border-radius: var(--tc-radius-xs); background: var(--tc-fill-subtle); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); line-height: var(--tc-pill-h); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-eds__tag { border-radius: var(--tc-pill-radius); box-shadow: none; }
.ui-eds__tag[data-more] { color: var(--tc-text-muted); }
.ui-eds__read-meta .ui-eds__tag { max-width: none; }

.ui-eds__checks[data-none] { color: var(--tc-status-warning-fg); }
.ui-eds__spacer { display: block; }
.ui-eds__empty { padding: var(--tc-space-6) var(--tc-space-4); color: var(--tc-text-muted); text-align: center; }
.ui-eds__grid:focus-visible [data-active] { border-radius: var(--tc-radius-sm); outline: var(--tc-focus-outline); outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
/* A split as a pill: a tinted tone with its name */
.ui-eds__pill, .ui-eds__change { display: inline-flex; flex: none; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); white-space: nowrap; }
.ui-eds__pill[data-tone="teal"] { background: var(--tc-tone-teal-bg); color: var(--tc-tone-teal-fg); }
.ui-eds__pill[data-tone="violet"] { background: var(--tc-tone-violet-bg); color: var(--tc-tone-violet-fg); }
.ui-eds__pill[data-tone="amber"] { background: var(--tc-tone-amber-bg); color: var(--tc-tone-amber-fg); }
.ui-eds__pill[data-tone="pink"] { background: var(--tc-tone-pink-bg); color: var(--tc-tone-pink-fg); }
.ui-eds__pill[data-tone="rose"] { background: var(--tc-tone-rose-bg); color: var(--tc-tone-rose-fg); }
.ui-eds__pill[data-tone="none"] { background: var(--tc-fill-default); color: var(--tc-text-secondary); }
.ui-eds__change[data-kind="new"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-eds__change[data-kind="edited"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-eds__flag { display: inline-grid; flex: none; place-items: center; }
.ui-eds__alert { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; }
:where([data-look="clean"], [data-look="clean"] *) .ui-eds__alert { stroke-width: 1.4; }
.ui-eds__flag[data-level="error"] { color: var(--tc-status-danger-fg); }
.ui-eds__flag[data-level="warning"] { color: var(--tc-status-warning-fg); }

/* ----- The open case ----- */
.ui-eds__detail { display: grid; align-content: start; gap: var(--tc-space-3-5); min-width: 0; padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-eds__detail-head { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; }
/* A section title inside the card: the title's colour, weight and tracking at body size */
.ui-eds__detail-title { flex: 1; min-width: 0; overflow: hidden; color: var(--tc-title-color); font-size: var(--tc-font-size-md); font-weight: var(--tc-title-font-weight); line-height: var(--tc-line-height-snug); letter-spacing: var(--tc-title-tracking); white-space: nowrap; text-overflow: ellipsis; }
.ui-eds__id { color: var(--tc-text-muted); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-regular); }
.ui-eds__icon-btn { display: grid; flex: none; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); }
[data-ui="eds"] .ui-eds__icon-btn:hover:not(:disabled) { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-eds__detail-head .ui-eds__icon-btn { margin: calc(-1 * var(--tc-space-1)) calc(-1 * var(--tc-space-1-5)) calc(-1 * var(--tc-space-1)) 0; }
.ui-eds__field { display: grid; gap: var(--tc-space-1-5); min-width: 0; }
.ui-eds__label { color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); }
:where([data-look="clean"], [data-look="clean"] *).ui-eds__label { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-eds__opt-hint { color: var(--tc-text-muted); font-weight: var(--tc-font-weight-regular); text-transform: none; letter-spacing: var(--tc-tracking-normal); }
/* The field recipe at control height */
.ui-eds__input { width: 100%; min-width: 0; height: var(--tc-field-h); margin: 0; padding: 0 var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); outline: 0; background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); color: var(--tc-text-primary); font: inherit; font-size: var(--tc-field-font-size); transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-eds__input:hover:not(:disabled) { box-shadow: var(--tc-field-shadow-hover); }
.ui-eds__input:focus-visible { box-shadow: var(--tc-field-shadow-focus); }
.ui-eds__input[aria-invalid="true"] { box-shadow: var(--tc-field-shadow-invalid); }
.ui-eds__input:disabled { cursor: not-allowed; opacity: 0.55; }
.ui-eds__input::placeholder { color: var(--tc-text-placeholder); }
textarea.ui-eds__input { height: auto; min-height: 60px; max-height: 240px; field-sizing: content; padding: var(--tc-space-2) var(--tc-field-px); line-height: var(--tc-line-height-normal); resize: vertical; }
.ui-eds__input[data-mono] { font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); }
.ui-eds__select { position: relative; display: block; min-width: 0; }
.ui-eds__select > select { padding-right: var(--tc-space-7); appearance: none; cursor: pointer; text-overflow: ellipsis; }
.ui-eds__chevron { position: absolute; top: 50%; right: var(--tc-space-2); width: 14px; height: 14px; fill: none; stroke: var(--tc-icon-muted); stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; transform: translateY(-50%); pointer-events: none; }
/* Checks: type, value, remove; the hint or error under them */
.ui-eds__asserts { display: grid; gap: var(--tc-space-2); }
.ui-eds__assert { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: start; gap: var(--tc-space-1-5); }
.ui-eds__assert .ui-eds__select { justify-self: start; width: 100%; max-width: 200px; }
.ui-eds__assert > :is(.ui-eds__value, .ui-eds__hint, .ui-eds__error) { grid-column: 1 / -1; }
.ui-eds__assert > .ui-eds__icon-btn { grid-column: 2; grid-row: 1; }
.ui-eds__hint { color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); }
.ui-eds__error { color: var(--tc-status-danger-fg); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); }
.ui-eds__ghost, .ui-eds__danger { display: inline-flex; align-items: center; justify-self: start; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm) 0 var(--tc-space-2); border-radius: var(--tc-control-radius-sm); color: var(--tc-action-ghost-fg); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); }
.ui-eds__field > .ui-eds__ghost { margin-left: calc(-1 * var(--tc-space-2)); }
[data-ui="eds"] .ui-eds__ghost:hover:not(:disabled) { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-eds__danger { color: var(--tc-status-danger-fg); margin-left: calc(-1 * var(--tc-space-2)); }
[data-ui="eds"] .ui-eds__danger:hover:not(:disabled) { background: var(--tc-status-danger-bg); }
/* Tags: chips and an input inside one field */
.ui-eds__chips { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1); min-height: var(--tc-field-h); padding: var(--tc-space-1) var(--tc-space-1-5); border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); }
.ui-eds__chips:focus-within { box-shadow: var(--tc-field-shadow-focus); }
.ui-eds__chip { display: inline-flex; align-items: center; gap: var(--tc-space-0-5); height: var(--tc-pill-h-lg); padding: 0 var(--tc-space-0-5) 0 var(--tc-space-2); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); color: var(--tc-text-primary); font-size: var(--tc-pill-font-size-lg); white-space: nowrap; }
.ui-eds__chip-x { display: grid; place-items: center; width: 18px; height: 18px; border-radius: 50%; color: var(--tc-icon-muted); }
.ui-eds__chip-x .ui-eds__glyph { width: 11px; height: 11px; }
[data-ui="eds"] .ui-eds__chip-x:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-eds__chip-input { flex: 1 1 96px; min-width: 0; height: calc(var(--tc-field-h) - 2 * var(--tc-space-1)); padding: 0 var(--tc-space-1-5); border: 0; outline: 0; background: none; color: var(--tc-text-primary); font: inherit; font-size: var(--tc-field-font-size); }
.ui-eds__chip-input::placeholder { color: var(--tc-text-placeholder); }
/* Split: radios as a row of quiet buttons */
.ui-eds__radios { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); }
.ui-eds__radio { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2-5); border-radius: var(--tc-control-radius-sm); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); color: var(--tc-text-secondary); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); }
[data-ui="eds"] .ui-eds__radio:hover:not(:disabled) { background: var(--tc-fill-hover); }
[data-ui="eds"] .ui-eds__radio[aria-checked="true"] { background: var(--tc-fill-selected); box-shadow: inset 0 0 0 1px var(--tc-border-strong); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *) .ui-eds__radio[aria-checked="true"] { background: var(--tc-accent-subtle); box-shadow: inset 0 0 0 1px var(--tc-border-selected); color: var(--tc-accent-text); }
.ui-eds__issues { display: grid; gap: var(--tc-space-1); }
.ui-eds__issue { display: flex; align-items: flex-start; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-sm); }
.ui-eds__issue .ui-eds__alert { margin-top: var(--tc-space-0-5); }
.ui-eds__issue[data-level="error"] { color: var(--tc-status-danger-fg); }
.ui-eds__issue[data-level="warning"] { color: var(--tc-status-warning-fg); }
.ui-eds__detail-foot { display: flex; padding-top: var(--tc-space-2-5); border-top: var(--tc-hairline) solid var(--tc-divider); }

/* The read view: the prompt beside the rules it has to pass */
.ui-eds__detail { container: ui-eds-case / inline-size; }
.ui-eds__mode { margin-left: auto; }
.ui-eds__detail-head .ui-eds__change + .ui-eds__mode { margin-left: 0; }
.ui-eds__read { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--tc-space-4); border-radius: var(--tc-radius-md); outline: none; }
.ui-eds__read:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-eds__read-side { display: grid; align-content: start; gap: var(--tc-space-1-5); min-width: 0; }
.ui-eds__prompt { margin: 0; padding: var(--tc-space-2-5) var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-surface-well); box-shadow: inset 2px 0 0 var(--tc-border-strong); color: var(--tc-text-primary); line-height: var(--tc-line-height-relaxed); white-space: pre-wrap; overflow-wrap: anywhere; }
:where([data-look="clean"], [data-look="clean"] *).ui-eds__prompt { box-shadow: inset 2px 0 0 var(--tc-accent); }
.ui-eds__prompt[data-empty] { color: var(--tc-text-muted); font-style: italic; }
.ui-eds__read-meta { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1); padding-top: var(--tc-space-0-5); }
.ui-eds__rules { display: grid; gap: var(--tc-space-1); }
.ui-eds__rule { display: flex; align-items: flex-start; gap: var(--tc-space-1-5); padding: var(--tc-space-1-5) var(--tc-space-2-5); border-radius: var(--tc-radius-md); background: var(--tc-surface-well); }
.ui-eds__rule[data-broken] { background: var(--tc-status-danger-bg); }
.ui-eds__rule .ui-eds__flag { margin-top: var(--tc-space-0-5); }
.ui-eds__code { min-width: 0; color: var(--tc-syntax-text); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); white-space: pre-wrap; overflow-wrap: anywhere; }
.ui-eds__kw { color: var(--tc-syntax-property); }
.ui-eds__verb { color: var(--tc-syntax-keyword); }
.ui-eds__lit { color: var(--tc-syntax-string); }
.ui-eds__lit[data-broken] { color: var(--tc-status-danger-fg); }
.ui-eds__prop { color: var(--tc-syntax-type); }
.ui-eds__punct { color: var(--tc-syntax-punctuation); }
.ui-eds__crit { color: var(--tc-text-primary); font-family: var(--tc-font-sans); }
.ui-eds__form { display: grid; gap: var(--tc-space-3-5); min-width: 0; }
@container ui-eds-case (min-width: 480px) {
  .ui-eds__read { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--tc-space-5); }
}
/* Wide: the open case beside the table */
@container ui-eds (min-width: 860px) {
  .ui-eds__main[data-open] { grid-template-columns: minmax(0, 1fr) var(--tc-evaluation-dataset-editor-side); }
  .ui-eds__main[data-open] .ui-eds__detail { border-top: 0; border-left: var(--tc-hairline) solid var(--tc-divider); }
  .ui-eds__main[data-open] .ui-eds__col-tags { display: none; }
  .ui-eds__main[data-open] .ui-eds__row { grid-template-columns: minmax(0, 1fr) 140px 96px; }
  /* The table runs as tall as the open case beside it */
  .ui-eds__main[data-open] .ui-eds__grid { max-height: none; min-height: var(--tc-evaluation-dataset-editor-max); contain: size; }
  /* … and its tags go under the input: two-line rows */
  .ui-eds__main[data-open] { --tc-evaluation-dataset-editor-row: 56px; }
  .ui-eds__main[data-open] .ui-eds__rows .ui-eds__case { flex-direction: column; align-items: flex-start; justify-content: center; gap: var(--tc-space-1); }
  .ui-eds__main[data-open] .ui-eds__case-tags { display: flex; }
}
/* Narrow: Case and Split only; the header's buttons wrap under the title */
@container ui-eds (max-width: 600px) {
  .ui-eds__col-checks, .ui-eds__col-tags { display: none; }
  .ui-eds__row { grid-template-columns: minmax(0, 1fr) 96px; }
  /* Tags under the input: two-line rows */
  .ui-eds__main { --tc-evaluation-dataset-editor-row: 56px; }
  .ui-eds__rows .ui-eds__case { flex-direction: column; align-items: flex-start; justify-content: center; gap: var(--tc-space-1); }
  .ui-eds__case-tags { display: flex; }
  .ui-eds__actions { flex: 1 1 100%; }
  .ui-eds__compare { flex: 1 1 140px; width: auto; }
  .ui-eds__show { flex: 1 1 100%; }
  .ui-eds__opt { flex: 1; justify-content: center; }
  .ui-eds__detail { padding-left: var(--tc-space-3); padding-right: var(--tc-space-3); }
}
@container ui-eds (max-width: 400px) {
  .ui-eds__btn > span { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  .ui-eds__btn { padding: 0 var(--tc-space-2); }
  .ui-eds__count { display: none; }
}
@media (pointer: coarse) {
  .ui-eds__input:not(textarea), .ui-eds__btn, .ui-eds__radio, .ui-eds__search-input { height: 40px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="eds"] *, [data-ui="eds"] *::before, [data-ui="eds"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-evaluation-dataset-editor")) customElements.define("tc-evaluation-dataset-editor", TcEvaluationDatasetEditor);

declare global {
  interface HTMLElementTagNameMap {
    "tc-evaluation-dataset-editor": TcEvaluationDatasetEditor;
  }
}
