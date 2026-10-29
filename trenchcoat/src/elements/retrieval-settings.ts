import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { compact, dollars, duration } from "./internal/format";

/*
 * <tc-retrieval-settings> – how a retrieval pipeline finds what the model answers with, edited on a picture of the
 * pipeline. Five stages read left to right – Query → Retrieve k → Filter → Rerank → n into context – each with a live
 * summary of its settings ("Retrieve 40 · 70% vector", "Score ≥ 0.35 · 2 rules") and the latency the app reports.
 * Pick a stage and its settings open under the pipeline:
 *   · Retrieve – top-k, the keyword ↔ vector balance (one native range), and chunking: size and overlap in tokens,
 *     drawn as three staggered chunks, with a note when they differ from what the sources are indexed with
 *   · Filter – the score threshold (a native range) and metadata rules as structured rows: field, operator, value
 *   · Rerank – a switch and the reranking model
 *   · Context – how many chunks go into the prompt, drawn as the k retrieved with the first n lit
 * The foot shows the per-query cost and latency the app supplies through `estimate`. The element estimates nothing
 * and runs nothing – the app reads the value and does the work.
 * Keyboard: the stages are tabs with manual activation – ← → (↑ ↓) Home End move, Enter or Space opens a stage – and
 * Tab goes on into its settings; the ranges take ← → Home End Page Up / Down; the switch takes Space and Enter.
 * Removing a filter moves focus to the next filter's field, else the one before, else Add filter. A stage with a
 * problem carries a red dot.
 * Standard is a white card on a gray tray, the pipeline on a gray well with raised stages; Clean is one white card, an
 * accent-tinted pipeline with hairline stages and quieter labels.
 *
 *   <tc-retrieval-settings .value=${settings} .filterFields=${fields} .rerankModels=${models}></tc-retrieval-settings>
 *
 * The whole config is one value: every change fires a cancelable `tc-value-change` ({ value }) – preventDefault() to
 * control `value`. With `name` it's a form control: the form gets the config as JSON, and an overlap that isn't
 * smaller than the chunk, more chunks into context than are retrieved, or an unfinished filter make it invalid.
 */

export type RetrievalFilterOperator = "is" | "is-not" | "contains" | "before" | "after" | "at-least" | "at-most";
/** A metadata field a filter can test */
export type RetrievalFilterField = {
  id: string;
  /** "Language", "Updated" */
  label: string;
  /** Picks the operators and the value control; "text" by default */
  type?: "text" | "number" | "date" | "choice";
  /** The values a "choice" field offers */
  options?: string[];
};
/** One metadata rule: `field` `operator` `value` – "Language is English" */
export type RetrievalFilter = { id: string; field: string; operator: RetrievalFilterOperator; value: string };
export type RetrievalSettingsValue = {
  /** Tokens per chunk */
  chunkSize: number;
  /** Tokens each chunk shares with the next */
  chunkOverlap: number;
  /** How many chunks retrieval returns */
  topK: number;
  /** The lowest score a chunk may have and still be kept, 0–1 */
  threshold: number;
  /** The balance between keyword and vector search: 0 is keyword only, 1 vector only */
  hybrid: number;
  /** Whether a reranker reorders the kept chunks */
  rerank: boolean;
  /** The reranking model's id */
  rerankModel: string;
  /** How many chunks go into the prompt */
  topN: number;
  /** Metadata rules every chunk has to pass */
  filters: RetrievalFilter[];
};
export type RetrievalRerankModel = { id: string; label: string };
export type RetrievalStage = "retrieve" | "filter" | "rerank" | "context";
/** What the app says one query costs with these settings – the element shows it, never works it out */
export type RetrievalEstimate = {
  /** End to end, in ms */
  latencyMs?: number;
  /** Per query, in dollars */
  cost?: number;
  /** Tokens the kept chunks add to the prompt */
  contextTokens?: number;
  /** A line of the app's own, e.g. "Reranking adds about 90ms at this k" */
  note?: string;
  /** Per stage: latency in ms */
  stages?: Partial<Record<RetrievalStage, number>>;
};
export type RetrievalSettingsChange = { value: RetrievalSettingsValue };
export type RetrievalStageChange = { stage: RetrievalStage };

export const RETRIEVAL_SETTINGS_DEFAULT: RetrievalSettingsValue = { chunkSize: 512, chunkOverlap: 64, topK: 40, threshold: 0.3, hybrid: 0.7, rerank: true, rerankModel: "", topN: 8, filters: [] };

const OPERATORS: Record<NonNullable<RetrievalFilterField["type"]>, RetrievalFilterOperator[]> = {
  text: ["is", "is-not", "contains"],
  choice: ["is", "is-not"],
  number: ["is", "at-least", "at-most"],
  date: ["after", "before", "is"],
};
const OPERATOR_LABEL: Record<RetrievalFilterOperator, string> = { is: "is", "is-not": "is not", contains: "contains", before: "before", after: "after", "at-least": "at least", "at-most": "at most" };
const LIMITS = { chunkSize: [32, 8192], chunkOverlap: [0, 4096], topK: [1, 500], topN: [1, 500] } as const;
type NumberKey = keyof typeof LIMITS;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const percent = (n: number) => `${Math.round(n * 100)}%`;
/** "70% vector", "Keyword only", "Even" */
const balance = (hybrid: number) => {
  const v = Math.round(hybrid * 100);
  if (v <= 0) return "Keyword only";
  if (v >= 100) return "Vector only";
  if (v === 50) return "Even keyword and vector";
  return v > 50 ? `${v}% vector` : `${100 - v}% keyword`;
};
const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;

/** The first problem with a config, if any: [message, the part it's about] */
export function retrievalSettingsProblem(v: RetrievalSettingsValue): [string, "overlap" | "context" | "filters"] | null {
  if (v.chunkOverlap >= v.chunkSize) return ["Overlap has to be smaller than the chunk.", "overlap"];
  if (v.topN > v.topK) return ["Context can't take more chunks than retrieval returns.", "context"];
  if (v.filters.some((f) => !f.field.trim() || !f.value.trim())) return ["Finish or remove the unfinished filter.", "filters"];
  return null;
}

/* ---------- Icons (Lucide, ISC – lucide.dev) ---------- */
const glyph = (body: TemplateResult, cls = "ui-rset__glyph") => html`<svg class=${cls} viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
/* layers with a magnifier: what retrieval looks through */
/* The header's icon: stacked layers under a magnifier */
const mark = svg`<path d="m12 3 8 4-8 4-8-4z"></path><path d="m4 12 8 4 4-2"></path><circle cx="18" cy="17" r="2.5"></circle><path d="m20 19 1.5 1.5"></path>`;
const chevron = () => glyph(svg`<path d="m9 6 6 6-6 6"></path>`, "ui-rset__arrow");
const chevronDown = () => html`<svg class="ui-rset__chevron" viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M4.5 6.25 8 9.75l3.5-3.5"></path>`}</svg>`;
const plus = () => glyph(svg`<path d="M12 5v14M5 12h14"></path>`);
const cross = () => glyph(svg`<path d="M7 7l10 10M17 7 7 17"></path>`);
const clock = () => glyph(svg`<circle cx="12" cy="12" r="8.5"></circle><path d="M12 7.5V12l3 2"></path>`);
const coin = () => glyph(svg`<circle cx="12" cy="12" r="8.5"></circle><path d="M14.5 9.5c-.4-.9-1.4-1.5-2.5-1.5-1.5 0-2.5.8-2.5 2s1 1.6 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1.1 0-2.1-.6-2.5-1.5M12 6.5V8M12 16v1.5"></path>`);
const tokensIcon = () => glyph(svg`<path d="M4 7h16M4 12h10M4 17h13"></path>`);

let instances = 0;

/**
 * Chunking, top-k, a score threshold, keyword ↔ vector balance, reranking, metadata filters and how many chunks go
 * into context – with the pipeline they make and the cost and latency the app reports.
 * @tag tc-retrieval-settings
 * @fires tc-value-change - The config changed ({ value: RetrievalSettingsValue }); cancelable – prevent it to control `value`
 * @fires tc-stage-change - A stage of the pipeline was opened for editing ({ stage }: RetrievalStageChange); cancelable
 */
export class TcRetrievalSettings extends TcElement {
  static override ui = "rset";
  static formAssociated = true;

  /** The config. Changed by the user unless a tc-value-change listener calls preventDefault() */
  @property({ attribute: false }) accessor value: RetrievalSettingsValue = RETRIEVAL_SETTINGS_DEFAULT;
  /** The metadata fields filters can test; without any, a filter's field is typed in */
  @property({ attribute: false }) accessor filterFields: RetrievalFilterField[] = [];
  /** The reranking models to offer; without any, Rerank is a switch only */
  @property({ attribute: false }) accessor rerankModels: RetrievalRerankModel[] = [];
  /** The chunking the sources are indexed with now – a different size or overlap says the sources will be re-indexed */
  @property({ attribute: false }) accessor indexed: { chunkSize: number; chunkOverlap: number } | undefined = undefined;
  /** Per-query cost and latency from the app, shown on the pipeline and at the foot; unset shows none */
  @property({ attribute: false }) accessor estimate: RetrievalEstimate | undefined = undefined;
  /** The stage whose settings show under the pipeline: "retrieve", "filter", "rerank" or "context" */
  @property() accessor stage: RetrievalStage = "retrieve";
  /** The heading; also names the group */
  @property() accessor heading = "Retrieval";
  /** A quieter line under the heading, e.g. which index this is */
  @property() accessor description = "";
  /** Drops the tray and the card, for settings inside another card */
  @property({ type: Boolean, reflect: true }) accessor flat = false;
  /** Submitted with the form: the config as JSON */
  @property({ reflect: true }) accessor name = "";
  /** Turns every control off and leaves the config out of the form; a disabled fieldset does the same */
  @property({ type: Boolean, reflect: true }) accessor disabled = false;

  @state() private accessor formDisabled = false;

  private readonly internals: ElementInternals;
  private readonly uid = `tc-rset${++instances}`;
  private initialValue: RetrievalSettingsValue | null = null;
  private ownName = false;
  private filterCount = 0;

  constructor() {
    super();
    this.internals = this.attachInternals();
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "group");
    this.ownName ||= (this.hasAttribute("aria-label") && this.getAttribute("aria-label") !== this.heading) || this.hasAttribute("aria-labelledby");
  }

  formResetCallback() {
    const value = this.initialValue ?? RETRIEVAL_SETTINGS_DEFAULT;
    // Through tc-value-change like any edit, so a controlled wrapper hears of it and keeps the value until it agrees
    if (this.emit<RetrievalSettingsChange>("tc-value-change", { value }, { cancelable: true })) this.value = value;
    else this.requestUpdate();
  }
  formDisabledCallback(disabled: boolean) {
    // Also called while `disabled` is reflected during an update, where a property change would be dropped – so after it
    queueMicrotask(() => (this.formDisabled = disabled));
  }

  private get isDisabled() {
    return this.disabled || this.formDisabled;
  }

  private commit(patch: Partial<RetrievalSettingsValue>) {
    const next: RetrievalSettingsValue = { ...this.value, ...patch };
    const applied = this.emit<RetrievalSettingsChange>("tc-value-change", { value: next }, { cancelable: true });
    if (applied) this.value = next;
    else this.requestUpdate();
    return applied;
  }

  private setNumber(key: NumberKey, input: HTMLInputElement) {
    const [lo, hi] = LIMITS[key];
    const n = Math.round(input.valueAsNumber);
    if (!Number.isFinite(n)) {
      input.value = String(this.value[key]);
      return;
    }
    this.commit({ [key]: clamp(n, lo, hi) });
  }

  /* ---------- Filters ---------- */

  private field(id: string) {
    return this.filterFields.find((f) => f.id === id);
  }
  private operatorsFor(id: string) {
    return OPERATORS[this.field(id)?.type ?? "text"];
  }
  private addFilter() {
    const first = this.filterFields[0];
    const filter: RetrievalFilter = { id: `${this.uid}-f${++this.filterCount}`, field: first?.id ?? "", operator: this.operatorsFor(first?.id ?? "")[0], value: "" };
    if (!this.commit({ filters: [...this.value.filters, filter] })) return;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-filter="${CSS.escape(filter.id)}"] .ui-rset__f-field`)?.focus());
  }
  private patchFilter(id: string, patch: Partial<RetrievalFilter>) {
    this.commit({ filters: this.value.filters.map((f) => (f.id === id ? { ...f, ...patch } : f)) });
  }
  private removeFilter(id: string) {
    const list = this.value.filters;
    const i = list.findIndex((f) => f.id === id);
    const next = list[i + 1] ?? list[i - 1];
    if (!this.commit({ filters: list.filter((f) => f.id !== id) })) return;
    void this.updateComplete.then(() =>
      (next ? this.querySelector<HTMLElement>(`[data-filter="${CSS.escape(next.id)}"] .ui-rset__f-field`) : this.querySelector<HTMLElement>(".ui-rset__add"))?.focus(),
    );
  }

  /* ---------- Updates ---------- */

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // The reset baseline is what the first render shows, so props a framework sets after connecting (React does) count
    if (!this.hasUpdated) this.initialValue = this.value;
    this.toggleAttribute("data-disabled", this.isDisabled);
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (!this.ownName) this.setAttribute("aria-label", this.heading);
    this.syncForm();
  }

  private syncForm() {
    // Environments without form-associated custom elements (jsdom) skip it; every supported browser has it
    if (typeof this.internals.setFormValue !== "function") return;
    const disabled = this.isDisabled;
    this.internals.setFormValue(this.name && !disabled ? JSON.stringify(this.value) : null);
    const problem = disabled ? null : retrievalSettingsProblem(this.value);
    if (!problem) {
      this.internals.setValidity({});
      return;
    }
    const anchor = { overlap: ".ui-rset__in[data-key='chunkOverlap']", context: ".ui-rset__in[data-key='topN']", filters: ".ui-rset__filter [aria-invalid='true']" }[problem[1]];
    // The field when its stage is open, else the stage itself
    const at = this.querySelector<HTMLElement>(anchor) ?? this.querySelector<HTMLElement>(`.ui-rset__stage[data-stage="${this.stageOf(problem[1])}"]`);
    this.internals.setValidity({ customError: true }, problem[0], at ?? undefined);
  }

  /* ---------- Rendering ---------- */

  /** A labelled field: the label above its control */
  private labelled(id: string, label: string, control: unknown, wide = false) {
    return html`<div class="ui-rset__field" data-field=${id} ?data-wide=${wide}><span class="ui-rset__label" id=${`${this.uid}-${id}`}>${label}</span><div class="ui-rset__control">${control}</div></div>`;
  }

  /** A number with its unit inside the field */
  private number(key: NumberKey, label: string, unit: string, invalid = false, describedBy?: string) {
    const [lo, hi] = LIMITS[key];
    return html`<span class="ui-rset__num" ?data-invalid=${invalid}>
      <input
        class="ui-rset__in"
        type="number"
        inputmode="numeric"
        data-key=${key}
        min=${lo}
        max=${hi}
        step="1"
        aria-label=${label}
        aria-invalid=${invalid ? "true" : "false"}
        aria-describedby=${ifDefined(describedBy)}
        .value=${live(String(this.value[key]))}
        ?disabled=${this.isDisabled}
        @change=${(e: Event) => this.setNumber(key, e.target as HTMLInputElement)}
      /><span class="ui-rset__unit" aria-hidden="true">${unit}</span>
    </span>`;
  }

  /** A native range with the house track: `fill` is the share left of the thumb */
  private range(o: { cls: string; label?: string; labelledBy?: string; min: number; max: number; step: number; value: number; text: string; fill: number; set: (n: number) => void }) {
    return html`<input
      class=${`ui-rset__range ${o.cls}`}
      type="range"
      min=${o.min}
      max=${o.max}
      step=${o.step}
      aria-label=${ifDefined(o.label)}
      aria-labelledby=${ifDefined(o.labelledBy)}
      aria-valuetext=${o.text}
      style=${styleMap({ "--fill": `${clamp(o.fill, 0, 1) * 100}%` })}
      .value=${live(String(o.value))}
      ?disabled=${this.isDisabled}
      @input=${(e: Event) => o.set((e.target as HTMLInputElement).valueAsNumber)}
    />`;
  }

  /** @internal The stage a problem is in */
  private stageOf(part: "overlap" | "context" | "filters"): RetrievalStage {
    return part === "overlap" ? "retrieve" : part === "filters" ? "filter" : "context";
  }

  /** @internal Picks a stage to edit */
  private pick(stage: RetrievalStage, focus = false) {
    if (stage !== this.stage && this.emit<RetrievalStageChange>("tc-stage-change", { stage }, { cancelable: true })) this.stage = stage;
    if (focus) void this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-rset__stage[data-stage="${stage}"]`)?.focus());
  }

  /** @internal APG tabs, manual activation: ← → (↑ ↓ when the pipeline runs down) Home End move; Enter or Space edits */
  private onTabsKey = (e: KeyboardEvent) => {
    const tabs = [...this.querySelectorAll<HTMLElement>(".ui-rset__stage[role='tab']")];
    const at = tabs.indexOf(e.target as HTMLElement);
    if (at < 0) return;
    const last = tabs.length - 1;
    const to =
      e.key === "ArrowRight" || e.key === "ArrowDown" ? (at === last ? 0 : at + 1)
      : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (at === 0 ? last : at - 1)
      : e.key === "Home" ? 0
      : e.key === "End" ? last
      : -1;
    if (to < 0) return;
    e.preventDefault();
    for (const t of tabs) t.tabIndex = t === tabs[to] ? 0 : -1;
    tabs[to].focus();
  };

  private renderFlow(problem: RetrievalStage | null) {
    const v = this.value;
    const st = this.estimate?.stages ?? {};
    const model = this.rerankModels.find((m) => m.id === v.rerankModel);
    const rules = v.filters.length;
    const tokens = this.estimate?.contextTokens;
    const inner = (title: string, sub: string, ms?: number) => html`<span class="ui-rset__stage-title">${title}</span>
      <span class="ui-rset__stage-sub"><span class="ui-rset__sr">, </span>${sub}</span>
      ${ms !== undefined ? html`<span class="ui-rset__stage-ms"><span class="ui-rset__sr">, </span>${duration(ms)}</span>` : nothing}`;
    const tab = (key: RetrievalStage, title: string, sub: string, off = false) => {
      const on = key === this.stage;
      const bad = problem === key;
      return html`<button
        type="button"
        role="tab"
        class="ui-rset__stage"
        id=${`${this.uid}-tab-${key}`}
        data-stage=${key}
        aria-selected=${on ? "true" : "false"}
        aria-controls=${`${this.uid}-panel`}
        tabindex=${on ? 0 : -1}
        ?data-off=${off}
        ?data-invalid=${bad}
        @click=${() => this.pick(key)}
      >${inner(title, sub, st[key])}${bad ? html`<span class="ui-rset__stage-alert" aria-hidden="true"></span><span class="ui-rset__sr">, needs a fix</span>` : nothing}</button>`;
    };
    return html`<div class="ui-rset__flow">
      <div class="ui-rset__stage" data-stage="query">${inner("Query", "As asked")}</div>${chevron()}
      <div class="ui-rset__tabs" role="tablist" aria-label="Pipeline" @keydown=${this.onTabsKey}>
        ${tab("retrieve", `Retrieve ${v.topK}`, balance(v.hybrid))}${chevron()}
        ${tab("filter", "Filter", `Score ≥ ${v.threshold.toFixed(2)}${rules ? ` · ${plural(rules, "rule")}` : ""}`)}${chevron()}
        ${tab("rerank", "Rerank", v.rerank ? (model?.label ?? "On") : "Off", !v.rerank)}${chevron()}
        ${tab("context", `${v.topN} into context`, tokens !== undefined ? `≈ ${compact(tokens)} tokens` : plural(v.topN, "chunk"))}
      </div>
    </div>`;
  }

  /** @internal The open stage's settings */
  private renderPanel(at: (part: string) => string | null) {
    const stage = this.stage;
    const body =
      stage === "retrieve"
        ? html`${this.labelled("topk", "Chunks to retrieve", this.number("topK", "Chunks to retrieve", "chunks"))}
            ${this.labelled("mix", "Keyword ↔ vector", this.renderMix())}
            ${this.labelled("chunks", "Chunking", this.renderChunks(at("overlap")), true)}`
        : stage === "filter"
          ? html`${this.labelled("keep", "Keep if the score is at least", this.renderThreshold(), true)}
              ${this.labelled("filters", "Metadata filters", this.renderFilters(at("filters")), true)}`
          : stage === "rerank"
            ? this.labelled("rerank", "Reranking", this.renderRerank(), true)
            : this.labelled("context", "Into the prompt", this.renderContext(at("context")), true);
    return html`<div class="ui-rset__panel" role="tabpanel" id=${`${this.uid}-panel`} aria-labelledby=${`${this.uid}-tab-${stage}`} data-stage=${stage}>${body}</div>`;
  }

  private renderChunks(problem: string | null) {
    const v = this.value;
    const size = Math.max(1, v.chunkSize);
    const overlap = clamp(v.chunkOverlap, 0, size);
    // Three chunks laid end to end, each sharing `overlap` with the next
    const span = 3 * size - 2 * overlap;
    const chunk = (i: number) => html`<span class="ui-rset__chunk" style=${styleMap({ left: `${((i * (size - overlap)) / span) * 100}%`, width: `${(size / span) * 100}%` })}></span>`;
    const reindex = this.indexed && (this.indexed.chunkSize !== v.chunkSize || this.indexed.chunkOverlap !== v.chunkOverlap);
    const errId = `${this.uid}-chunks-e`;
    return html`<div class="ui-rset__pair">
        ${this.number("chunkSize", "Chunk size", "tokens")}
        ${this.number("chunkOverlap", "Overlap", "overlap", !!problem, problem ? errId : undefined)}
      </div>
      <span class="ui-rset__chunks" aria-hidden="true">${chunk(0)}${chunk(1)}${chunk(2)}</span>
      ${problem
        ? html`<span class="ui-rset__error" id=${errId}>${problem}</span>`
        : html`<span class="ui-rset__hint">Each chunk shares ${percent(overlap / size)} with the next.</span>`}
      ${reindex ? html`<span class="ui-rset__note" data-tone="warning">Sources are indexed at ${this.indexed!.chunkSize} / ${this.indexed!.chunkOverlap} – saving re-indexes them.</span>` : nothing}`;
  }

  private renderMix() {
    const v = this.value;
    return html`<div class="ui-rset__mix">
      <span class="ui-rset__mix-head"><span class="ui-rset__readout" aria-hidden="true">${balance(v.hybrid)}</span></span>
      ${this.range({ cls: "ui-rset__hybrid", labelledBy: `${this.uid}-mix`, min: 0, max: 100, step: 5, value: Math.round(v.hybrid * 100), text: balance(v.hybrid), fill: v.hybrid, set: (n) => this.commit({ hybrid: n / 100 }) })}
      <span class="ui-rset__ends" aria-hidden="true"><span>Keyword</span><span>Vector</span></span>
    </div>`;
  }

  private renderThreshold() {
    const v = this.value;
    return html`<div class="ui-rset__mix">
      <span class="ui-rset__mix-head"><span class="ui-rset__readout" aria-hidden="true">${v.threshold.toFixed(2)}</span></span>
      ${this.range({ cls: "ui-rset__threshold", labelledBy: `${this.uid}-keep`, min: 0, max: 1, step: 0.05, value: v.threshold, text: `Score at least ${v.threshold.toFixed(2)}`, fill: v.threshold, set: (n) => this.commit({ threshold: Math.round(n * 100) / 100 }) })}
    </div>`;
  }

  private renderFilter(f: RetrievalFilter, n: number) {
    const known = this.field(f.field);
    const type = known?.type ?? "text";
    const ops = this.operatorsFor(f.field);
    const disabled = this.isDisabled;
    const missing = !f.field.trim() || !f.value.trim();
    const fieldLabel = `Filter ${n}: field`;
    const field = this.filterFields.length
      ? html`<span class="ui-rset__select"><select
            class="ui-rset__f-field ui-rset__input"
            aria-label=${fieldLabel}
            ?disabled=${disabled}
            @change=${(e: Event) => {
              const id = (e.target as HTMLSelectElement).value;
              const opsNext = this.operatorsFor(id);
              this.patchFilter(f.id, { field: id, operator: opsNext.includes(f.operator) ? f.operator : opsNext[0], value: "" });
            }}
          >
            ${known ? nothing : html`<option value="" .selected=${live(true)} disabled>Field</option>`}
            ${this.filterFields.map((x) => html`<option value=${x.id} .selected=${live(x.id === f.field)}>${x.label}</option>`)}
          </select>${chevronDown()}</span>`
      : html`<input class="ui-rset__f-field ui-rset__input" type="text" placeholder="Field" aria-label=${fieldLabel} .value=${live(f.field)} ?disabled=${disabled} @change=${(e: Event) => this.patchFilter(f.id, { field: (e.target as HTMLInputElement).value })} />`;
    const valueLabel = `Filter ${n}: value`;
    const valueInvalid = missing && !!f.field.trim();
    const value =
      type === "choice"
        ? html`<span class="ui-rset__select"><select
              class="ui-rset__f-value ui-rset__input"
              aria-label=${valueLabel}
              aria-invalid=${valueInvalid ? "true" : "false"}
              ?disabled=${disabled}
              @change=${(e: Event) => this.patchFilter(f.id, { value: (e.target as HTMLSelectElement).value })}
            >
              ${f.value ? nothing : html`<option value="" .selected=${live(true)} disabled>Value</option>`}
              ${(known?.options ?? []).map((o) => html`<option value=${o} .selected=${live(o === f.value)}>${o}</option>`)}
            </select>${chevronDown()}</span>`
        : html`<input
            class="ui-rset__f-value ui-rset__input"
            type=${type === "number" ? "number" : type === "date" ? "date" : "text"}
            placeholder="Value"
            aria-label=${valueLabel}
            aria-invalid=${valueInvalid ? "true" : "false"}
            .value=${live(f.value)}
            ?disabled=${disabled}
            @change=${(e: Event) => this.patchFilter(f.id, { value: (e.target as HTMLInputElement).value })}
          />`;
    return html`<li class="ui-rset__filter" data-filter=${f.id}>
      ${field}
      <span class="ui-rset__select ui-rset__op"><select
          class="ui-rset__f-op ui-rset__input"
          aria-label=${`Filter ${n}: operator`}
          ?disabled=${disabled}
          @change=${(e: Event) => this.patchFilter(f.id, { operator: (e.target as HTMLSelectElement).value as RetrievalFilterOperator })}
        >
          ${ops.map((o) => html`<option value=${o} .selected=${live(o === f.operator)}>${OPERATOR_LABEL[o]}</option>`)}
        </select>${chevronDown()}</span>
      ${value}
      <button type="button" class="ui-rset__icon-btn ui-rset__remove" aria-label=${`Remove filter ${n}`} title="Remove" ?disabled=${disabled} @click=${() => this.removeFilter(f.id)}>${cross()}</button>
    </li>`;
  }

  private renderFilters(problem: string | null) {
    const filters = this.value.filters;
    const errId = `${this.uid}-filters-e`;
    return html`${filters.length
        ? html`<ol class="ui-rset__filters" aria-labelledby=${`${this.uid}-filters`} aria-describedby=${ifDefined(problem ? errId : undefined)}>
            ${repeat(filters, (f) => f.id, (f, i) => this.renderFilter(f, i + 1))}
          </ol>`
        : html`<span class="ui-rset__hint">Every chunk is eligible – add a filter to narrow by metadata.</span>`}
      ${problem ? html`<span class="ui-rset__error" id=${errId}>${problem}</span>` : nothing}
      <button type="button" class="ui-rset__add" ?disabled=${this.isDisabled} @click=${() => this.addFilter()}>${plus()}Add filter</button>`;
  }

  private renderRerank() {
    const v = this.value;
    const switchId = `${this.uid}-rr`;
    const known = this.rerankModels.some((m) => m.id === v.rerankModel);
    return html`<div class="ui-rset__rerank">
      <span class="ui-rset__toggle">
        <button
          type="button"
          role="switch"
          id=${switchId}
          class="ui-rset__switch"
          aria-checked=${v.rerank ? "true" : "false"}
          aria-labelledby=${`${switchId}-l`}
          ?disabled=${this.isDisabled}
          @click=${() => this.commit({ rerank: !v.rerank, ...(!v.rerank && !known && this.rerankModels[0] ? { rerankModel: this.rerankModels[0].id } : {}) })}
        ><span></span></button>
        <label class="ui-rset__toggle-label" id=${`${switchId}-l`} for=${switchId}>Rerank the kept chunks</label>
      </span>
      ${this.rerankModels.length
        ? html`<span class="ui-rset__select ui-rset__model"><select
              class="ui-rset__input"
              aria-label="Reranking model"
              ?disabled=${this.isDisabled || !v.rerank}
              @change=${(e: Event) => this.commit({ rerankModel: (e.target as HTMLSelectElement).value })}
            >
              ${known ? nothing : html`<option value="" .selected=${live(true)} disabled>Pick a model</option>`}
              ${this.rerankModels.map((m) => html`<option value=${m.id} .selected=${live(m.id === v.rerankModel)}>${m.label}</option>`)}
            </select>${chevronDown()}</span>`
        : nothing}
    </div>`;
  }

  private renderContext(problem: string | null) {
    const errId = `${this.uid}-ctx-e`;
    const v = this.value;
    // One cell per retrieved chunk (up to 60); the first n go into the prompt
    const cells = Math.min(60, v.topK);
    const kept = Math.min(v.topN, cells);
    return html`${this.number("topN", "Chunks into context", "chunks", !!problem, problem ? errId : undefined)}
      <span class="ui-rset__cells" aria-hidden="true">${Array.from({ length: cells }, (_, i) => html`<span ?data-on=${i < kept}></span>`)}${v.topK > cells ? html`<span class="ui-rset__more">+${v.topK - cells}</span>` : nothing}</span>
      ${problem
        ? html`<span class="ui-rset__error" id=${errId}>${problem}</span>`
        : html`<span class="ui-rset__hint">${this.value.rerank ? "The best after reranking" : "The highest scores"} go into the prompt – ${Math.min(v.topN, v.topK)} of the ${v.topK} retrieved.</span>`}`;
  }

  private renderEstimate() {
    const e = this.estimate;
    if (!e) return nothing;
    const facts: TemplateResult[] = [];
    if (e.latencyMs !== undefined) facts.push(html`<span class="ui-rset__fact">${clock()}<span>≈ ${duration(e.latencyMs)} a query</span></span>`);
    if (e.cost !== undefined) facts.push(html`<span class="ui-rset__fact">${coin()}<span>${dollars(e.cost)} a query</span></span>`);
    if (e.contextTokens !== undefined) facts.push(html`<span class="ui-rset__fact">${tokensIcon()}<span>≈ ${compact(e.contextTokens)} tokens of context</span></span>`);
    if (!facts.length && !e.note) return nothing;
    return html`<div class="ui-rset__estimate">
      ${facts.length ? html`<div class="ui-rset__facts">${facts}</div>` : nothing}
      ${e.note ? html`<p class="ui-rset__estimate-note">${e.note}</p>` : nothing}
    </div>`;
  }

  protected override render() {
    const clean = this.resolvedLook === "clean";
    const problem = this.isDisabled ? null : retrievalSettingsProblem(this.value);
    const at = (part: string) => (problem && problem[1] === part ? problem[0] : null);
    // The header (.tc-head): on the tray in Standard, the card's first row in Clean; none when flat
    const head = this.flat ? nothing : cardHead({ icon: mark, title: this.heading, subtitle: this.description || undefined });
    const body = html`
      ${this.renderFlow(problem ? this.stageOf(problem[1]) : null)}
      ${this.renderPanel(at)}
      ${this.renderEstimate()}
    `;
    return clean || this.flat ? html`${head}${body}` : html`${head}<div class="ui-rset__card">${body}</div>`;
  }

  static override css = /* css */ `
[data-ui="rset"] {
  display: flow-root;
  box-sizing: border-box;
  container-type: inline-size;
  width: 100%;
  max-width: 600px;
  min-width: 0;
  color: var(--tc-text-primary);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="rset"] *, [data-ui="rset"] *::before, [data-ui="rset"] *::after { box-sizing: border-box; }
:where([data-ui="rset"]) :is(p, ol) { margin: 0; padding: 0; }
:where([data-ui="rset"]) ol { list-style: none; }
[data-ui="rset"] svg { display: block; flex: none; }
/* Standard: a gray tray around a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="rset"]:not([flat]) { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
.ui-rset__card { display: flow-root; padding-top: var(--tc-space-4); border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* Clean: one white card with hairline shadows */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="rset"]:not([flat]) { border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
[data-ui="rset"][flat] { max-width: none; }
.ui-rset__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-rset__glyph { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *) .ui-rset__glyph { stroke-width: 1.6; }
.ui-rset__icon-btn, .ui-rset__add, .ui-rset__switch { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="rset"] :is(button, input[type="range"]):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="rset"] :is(button, input, select):disabled { cursor: not-allowed; opacity: 0.55; }


/* ---------- The pipeline: five stages and the arrows between them ---------- */
.ui-rset__flow { display: flex; align-items: stretch; gap: var(--tc-space-1); margin: 0 var(--tc-space-4); padding: var(--tc-space-2); border-radius: var(--tc-radius-lg); background: var(--tc-surface-well); }
:where([data-look="clean"], [data-look="clean"] *).ui-rset__flow { border-radius: var(--tc-radius-md); background: var(--tc-accent-subtle); }
[data-ui="rset"][flat] .ui-rset__flow { margin: 0; }
.ui-rset__stage { display: grid; flex: 1 1 0; align-content: start; gap: var(--tc-space-0-5); min-width: 0; padding: var(--tc-space-1-5) var(--tc-space-2); border-radius: var(--tc-radius-md); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); transition: opacity var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-rset__stage { border-radius: var(--tc-radius-sm); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-rset__stage[data-stage="query"] { flex: 0.8 1 0; }
.ui-rset__stage[data-off] { background: none; box-shadow: inset 0 0 0 1px var(--tc-border-default); }
.ui-rset__stage[data-off] :is(.ui-rset__stage-title, .ui-rset__stage-sub) { color: var(--tc-text-muted); }
.ui-rset__stage-title { overflow: hidden; color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
.ui-rset__stage[data-stage="context"] .ui-rset__stage-title { color: var(--tc-accent-text); }
.ui-rset__stage-sub { color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); overflow-wrap: anywhere; font-variant-numeric: tabular-nums; }
.ui-rset__stage-ms { justify-self: start; margin-top: var(--tc-space-0-5); padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-xs); background: var(--tc-fill-default); color: var(--tc-text-secondary); font-size: var(--tc-font-size-2xs); line-height: var(--tc-line-height-normal); font-variant-numeric: tabular-nums; }
.ui-rset__arrow { align-self: center; width: 12px; height: 12px; fill: none; stroke: var(--tc-icon-muted); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

/* The stages: Query is a plain card; the four after it are tabs */
.ui-rset__tabs { display: flex; flex: 4 1 0; align-items: stretch; gap: var(--tc-space-1); min-width: 0; }
button.ui-rset__stage { position: relative; margin: 0; border: 0; font: inherit; text-align: left; cursor: pointer; -webkit-tap-highlight-color: transparent; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard); }
button.ui-rset__stage:hover { box-shadow: var(--tc-shadow-raised-hover); }
button.ui-rset__stage[aria-selected="true"] { box-shadow: inset 0 0 0 1.5px var(--tc-text-primary), var(--tc-shadow-raised); }
:where([data-look="clean"], [data-look="clean"] *) button.ui-rset__stage:hover { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-strong); }
:where([data-look="clean"], [data-look="clean"] *) button.ui-rset__stage[aria-selected="true"] { box-shadow: inset 0 0 0 1.5px var(--tc-accent); }
.ui-rset__stage-alert { position: absolute; top: var(--tc-space-1-5); right: var(--tc-space-1-5); width: 6px; height: 6px; border-radius: 50%; background: var(--tc-status-danger-solid); }

/* ---------- The open stage's settings ---------- */
.ui-rset__panel { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--tc-space-4); padding: var(--tc-space-4); animation: ui-rset-in var(--tc-duration-moderate) var(--tc-ease-standard); }
[data-ui="rset"][flat] .ui-rset__panel { padding: var(--tc-space-3) 0; }
.ui-rset__field { display: grid; align-content: start; gap: var(--tc-space-1-5); min-width: 0; }
.ui-rset__field[data-wide] { grid-column: 1 / -1; }
.ui-rset__label { color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); }
:where([data-look="clean"], [data-look="clean"] *).ui-rset__label { color: var(--tc-text-muted); }
.ui-rset__control { display: grid; justify-items: start; gap: var(--tc-space-2); min-width: 0; }
/* Context: the k retrieved, the first n lit */
.ui-rset__cells { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-0-5); max-width: 100%; }
.ui-rset__cells > span:not(.ui-rset__more) { width: 8px; height: 12px; border-radius: var(--tc-radius-2xs); background: var(--tc-fill-strong); }
.ui-rset__cells > span[data-on] { background: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *) .ui-rset__cells > span[data-on] { background: var(--tc-accent); }
.ui-rset__more { margin-left: var(--tc-space-1); color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); }
@keyframes ui-rset-in { from { opacity: 0; transform: translateY(-2px); } }
.ui-rset__hint { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-rset__error { color: var(--tc-status-danger-fg); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-rset__note { padding: var(--tc-space-1) var(--tc-space-2); border-radius: var(--tc-radius-md); background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }

/* Fields: the field recipe at control height */
.ui-rset__input, .ui-rset__num { height: var(--tc-field-h); border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); color: var(--tc-text-primary); font: inherit; font-size: var(--tc-field-font-size); transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-rset__input { width: 100%; min-width: 0; margin: 0; padding: 0 var(--tc-field-px); border: 0; outline: 0; }
.ui-rset__input:hover:not(:disabled), .ui-rset__num:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-rset__input:focus-visible, .ui-rset__num:focus-within { box-shadow: var(--tc-field-shadow-focus); }
.ui-rset__input[aria-invalid="true"], .ui-rset__num[data-invalid] { box-shadow: var(--tc-field-shadow-invalid); }
.ui-rset__input::placeholder { color: var(--tc-text-placeholder); }
.ui-rset__num { display: inline-flex; align-items: center; width: 148px; padding-right: var(--tc-field-px); }
.ui-rset__in { flex: 1; width: 0; min-width: 0; height: 100%; margin: 0; padding: 0 var(--tc-space-1) 0 var(--tc-field-px); border: 0; outline: 0; background: none; color: inherit; font: inherit; font-variant-numeric: tabular-nums; }
.ui-rset__unit { flex: none; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-rset__select { position: relative; display: block; min-width: 0; }
.ui-rset__select > select { padding-right: var(--tc-space-7); appearance: none; cursor: pointer; text-overflow: ellipsis; }
.ui-rset__chevron { position: absolute; top: 50%; right: var(--tc-space-2); width: 14px; height: 14px; fill: none; stroke: var(--tc-icon-muted); stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; transform: translateY(-50%); pointer-events: none; }
.ui-rset__pair { display: flex; flex-wrap: wrap; gap: var(--tc-space-2); }

/* Chunks: three chunks, staggered, so the stretch each shares with the next lines up */
.ui-rset__chunks { position: relative; display: block; width: min(100%, 304px); height: 18px; }
.ui-rset__chunk { position: absolute; top: 0; height: 8px; border-radius: var(--tc-radius-xs); background: var(--tc-fill-strong); box-shadow: inset 0 0 0 1px var(--tc-border-strong); }
:where([data-look="clean"], [data-look="clean"] *) .ui-rset__chunk { background: var(--tc-accent-subtle); box-shadow: inset 0 0 0 1px var(--tc-accent); }
.ui-rset__chunk:nth-child(2) { top: 10px; }

/* The balance and the threshold: native ranges on the meter track */
.ui-rset__mix { display: grid; gap: var(--tc-space-1); width: min(100%, 304px); }
.ui-rset__mix-head { display: flex; align-items: baseline; justify-content: space-between; gap: var(--tc-space-2); color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); }
.ui-rset__readout { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); font-variant-numeric: tabular-nums; }
.ui-rset__ends { display: flex; justify-content: space-between; color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); }
.ui-rset__range { --track: var(--tc-fill-strong); --on: var(--tc-text-secondary); width: 100%; height: 20px; margin: 0; background: none; cursor: pointer; appearance: none; -webkit-appearance: none; }
:where([data-look="clean"], [data-look="clean"] *) .ui-rset__range { --on: var(--tc-accent); }
/* Hybrid has no "more": both ends are a choice, so the track is one tone */
.ui-rset__hybrid { --on: var(--tc-fill-strong); }
.ui-rset__range::-webkit-slider-runnable-track { height: 4px; border-radius: var(--tc-radius-full); background: linear-gradient(to right, var(--on) var(--fill), var(--track) var(--fill)); }
.ui-rset__range::-moz-range-track { height: 4px; border-radius: var(--tc-radius-full); background: linear-gradient(to right, var(--on) var(--fill), var(--track) var(--fill)); }
.ui-rset__range::-webkit-slider-thumb { width: 16px; height: 16px; margin-top: calc(-1 * var(--tc-space-1-5)); border: 0; border-radius: 50%; background: var(--tc-switch-knob-bg); box-shadow: var(--tc-shadow-control), inset 0 0 0 1px var(--tc-border-control); appearance: none; -webkit-appearance: none; }
.ui-rset__range::-moz-range-thumb { width: 16px; height: 16px; border: 0; border-radius: 50%; background: var(--tc-switch-knob-bg); box-shadow: var(--tc-shadow-control), inset 0 0 0 1px var(--tc-border-control); }

/* Filters: field · operator · value · remove */
.ui-rset__filters { display: grid; gap: var(--tc-space-2); width: 100%; }
.ui-rset__filter { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.8fr) minmax(0, 1.2fr) auto; align-items: center; gap: var(--tc-space-1-5); }
.ui-rset__icon-btn { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-action-ghost-fg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-rset__icon-btn:hover:not(:disabled) { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-rset__add { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-rset__add:hover:not(:disabled) { box-shadow: var(--tc-action-secondary-shadow-hover); }

/* Rerank: the switch pattern, and the model */
.ui-rset__rerank { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2) var(--tc-space-4); width: 100%; }
.ui-rset__toggle { display: inline-flex; align-items: center; gap: var(--tc-space-2-5); min-height: var(--tc-control-h-sm); }
.ui-rset__toggle-label { color: var(--tc-text-primary); cursor: pointer; }
.ui-rset__model { flex: 1 1 180px; max-width: 260px; }
.ui-rset__switch { position: relative; flex: none; width: var(--tc-switch-w); height: var(--tc-switch-h); border-radius: var(--tc-switch-radius); background: var(--tc-switch-off) !important; transition: background-color var(--tc-duration-base) var(--tc-ease-standard); }
.ui-rset__switch[aria-checked="true"] { background: var(--tc-switch-on) !important; }
.ui-rset__switch span { position: absolute; top: var(--tc-space-0-5); left: var(--tc-space-0-5); width: var(--tc-switch-knob); height: var(--tc-switch-knob); border-radius: calc(var(--tc-switch-radius) - var(--tc-space-0-5)); background: var(--tc-switch-knob-bg); box-shadow: var(--tc-shadow-control); transition: transform var(--tc-duration-moderate) var(--tc-ease-move); }
.ui-rset__switch[aria-checked="true"] span { transform: translateX(calc(var(--tc-switch-w) - var(--tc-switch-h))); }
.ui-rset__switch::after { content: ""; position: absolute; inset: -8px -6px; }

/* ---------- What a query costs, from the app ---------- */
.ui-rset__estimate { display: grid; gap: var(--tc-space-1-5); margin: 0 var(--tc-space-4) var(--tc-space-4); padding: var(--tc-space-2-5) var(--tc-space-3); border-radius: var(--tc-radius-lg); background: var(--tc-fill-subtle); }
:where([data-look="clean"], [data-look="clean"] *).ui-rset__estimate { margin: 0; padding: var(--tc-space-3) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); border-radius: 0 0 var(--tc-card-radius) var(--tc-card-radius); background: none; }
[data-ui="rset"][flat] .ui-rset__estimate { margin: 0; }
.ui-rset__facts { display: flex; flex-wrap: wrap; gap: var(--tc-space-1) var(--tc-space-4); }
.ui-rset__fact { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; }
.ui-rset__fact > svg { color: var(--tc-icon-muted); }
.ui-rset__estimate-note { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }

/* Narrow: labels above their controls; the pipeline runs down */
@container (max-width: 480px) {
  .ui-rset__panel { grid-template-columns: minmax(0, 1fr); }
  .ui-rset__field { grid-column: 1 / -1; }
  .ui-rset__panel { padding-left: var(--tc-space-3); padding-right: var(--tc-space-3); }
  .ui-rset__flow, .ui-rset__tabs { flex-direction: column; }
  .ui-rset__flow { margin: 0 var(--tc-space-3); }
    .ui-rset__stage { grid-template-columns: auto minmax(0, 1fr) auto; align-items: baseline; column-gap: var(--tc-space-2); }
  .ui-rset__stage-sub { text-align: right; }
  .ui-rset__stage-ms { margin-top: 0; }
  .ui-rset__arrow { align-self: center; transform: rotate(90deg); }
  .ui-rset__filter { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto; }
  .ui-rset__filter > :nth-child(3) { grid-column: 1 / 3; grid-row: 2; }
  .ui-rset__filter > .ui-rset__remove { grid-column: 3; grid-row: 1; }
  .ui-rset__estimate { margin-left: var(--tc-space-3); margin-right: var(--tc-space-3); }
}
@media (pointer: coarse) {
  .ui-rset__input, .ui-rset__num { height: max(40px, var(--tc-field-h)); }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="rset"] *, [data-ui="rset"] *::before, [data-ui="rset"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-retrieval-settings")) customElements.define("tc-retrieval-settings", TcRetrievalSettings);

declare global {
  interface HTMLElementTagNameMap {
    "tc-retrieval-settings": TcRetrievalSettings;
  }
}
