import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { workflowKind, workflowKindIcon, type WorkflowKind, type WorkflowKindInfo } from "./workflow-canvas";

/*
 * <tc-step-inspector> – one workflow step's settings: its title, and each input with where its value comes from –
 * typed in, or mapped from an earlier step's output (`extract.amount`, shown as a chip: "Extract fields › amount").
 * A required input with nothing behind it says so in words. "Test with sample" asks the page to run the step
 * (tc-test), and the last run's input and output show as JSON.
 *   · each input is a fieldset: "Value" or "From a step" (radio buttons), then the field or the mapping button; the
 *     mapping opens a list of earlier steps' outputs – ↑ / ↓ move, Enter picks, Escape closes back to the button
 *   · the last run's Input and Output are tabs (← / →), each a scrollable, focusable block
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-step-inspector .step=${step} .upstream=${[{ id: "extract", title: "Extract fields", kind: "llm", outputs: [{ name: "amount" }] }]}
 *     @tc-step-change=${(e) => save(e.detail.step)} @tc-test=${(e) => run(e.detail.step)}></tc-step-inspector>
 */

export type StepInputSource = { kind: "value"; value: string } | { kind: "ref"; ref: string };
export type StepInput = {
  id: string;
  label: string;
  /** "text" (the default), "number", "long" (several lines) or "select" (with `options`) */
  type?: "text" | "number" | "long" | "select";
  options?: string[];
  required?: boolean;
  /** One quiet line on what it's for */
  description?: string;
  placeholder?: string;
  /** Where the value comes from; none yet when left out */
  source?: StepInputSource;
};
export type InspectorStep = { id: string; kind: WorkflowKind; title: string; inputs: StepInput[] };
export type UpstreamOutput = { name: string; type?: string; sample?: string };
export type UpstreamStep = { id: string; title: string; kind: WorkflowKind; outputs: UpstreamOutput[] };
export type StepRun = {
  status: "succeeded" | "failed";
  /** How long it took, in words: "1.2 s" */
  duration?: string;
  input?: unknown;
  output?: unknown;
  /** What went wrong, for a failed run */
  error?: string;
};

/** Details of the events */
export type StepChange = { step: InspectorStep; field: "title" | "input"; input?: string };
export type StepTest = { step: InspectorStep };

/** Whether a required input has nothing behind it: no value typed, or a mapping to an output that doesn't exist */
export function stepInputMissing(input: StepInput, upstream: UpstreamStep[]) {
  if (!input.required) return false;
  const s = input.source;
  if (!s) return true;
  if (s.kind === "value") return !String(s.value ?? "").trim();
  return !resolveRef(s.ref, upstream);
}
/** "extract.amount" → the step and output it names, or null */
export function resolveRef(ref: string, upstream: UpstreamStep[]) {
  const dot = ref.indexOf(".");
  if (dot < 1) return null;
  const step = upstream.find((s) => s.id === ref.slice(0, dot));
  const output = step?.outputs.find((o) => o.name === ref.slice(dot + 1));
  return step && output ? { step, output } : null;
}

const icon = (body: unknown) =>
  html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
/* Lucide (ISC, lucide.dev) */
const icons = {
  link: svg`<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>`,
  x: svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`,
  play: svg`<polygon points="6 3 20 12 6 21 6 3"></polygon>`,
  chevron: svg`<path d="m6 9 6 6 6-6"></path>`,
  alert: svg`<circle cx="12" cy="12" r="10"></circle><path d="M12 8v4"></path><path d="M12 16h.01"></path>`,
  check: svg`<path d="M20 6 9 17l-5-5"></path>`,
};

let uidCount = 0;

/**
 * One workflow step's settings – its inputs, each a typed value or a mapping from an earlier step's output – with a
 * test run and its input and output.
 * @tag tc-step-inspector
 * @fires tc-step-change - The title or an input changed ({ step, field, input }: StepChange); cancelable – prevented, `step` stays as it was
 * @fires tc-test - "Test with sample" was pressed ({ step }: StepTest) – the page runs it and sets `lastRun`
 */
export class TcStepInspector extends TcElement {
  static override ui = "sti";

  /** The heading, over the step's title when no step is selected */
  @property() accessor heading = "Step";
  /** The step being edited, or null for none */
  @property({ attribute: false }) accessor step: InspectorStep | null = null;
  /** The steps before this one, whose outputs its inputs can be mapped from */
  @property({ attribute: false }) accessor upstream: UpstreamStep[] = [];
  /** The last test run, if any */
  @property({ attribute: false }) accessor lastRun: StepRun | null = null;
  /** A test run is in flight */
  @property({ type: Boolean, reflect: true }) accessor testing = false;
  /** Viewing only: nothing can be changed or tested */
  @property({ type: Boolean, reflect: true }) accessor readonly = false;
  /** Labels and icons for kinds the page adds, merged over the workflow defaults */
  @property({ attribute: false }) accessor kinds: Record<string, Partial<WorkflowKindInfo>> = {};

  @state() private accessor picking: string | null = null;
  @state() private accessor pickIndex = 0;
  @state() private accessor runTab: "input" | "output" = "output";
  @state() private accessor announce = "";

  private uid = `tc-sti-${++uidCount}`;

  /* ---------- Changes ---------- */

  private change(next: InspectorStep, field: "title" | "input", input?: string) {
    if (!this.emit<StepChange>("tc-step-change", { step: next, field, input }, { cancelable: true })) {
      this.requestUpdate();
      return false;
    }
    this.step = next;
    return true;
  }
  private setTitle(title: string) {
    if (this.step) this.change({ ...this.step, title }, "title");
  }
  private setSource(input: StepInput, source: StepInputSource) {
    const s = this.step;
    if (!s) return false;
    return this.change({ ...s, inputs: s.inputs.map((i) => (i.id === input.id ? { ...i, source } : i)) }, "input", input.id);
  }

  /* ---------- The mapping list ---------- */

  private get outputs() {
    return this.upstream.flatMap((step) => step.outputs.map((output) => ({ step, output, ref: `${step.id}.${output.name}` })));
  }
  private trigger(inputId: string) {
    return this.querySelector<HTMLElement>(`[data-map="${CSS.escape(inputId)}"]`);
  }
  private openPicker(input: StepInput) {
    if (this.readonly || !this.outputs.length) return;
    const current = input.source?.kind === "ref" ? input.source.ref : null;
    this.picking = input.id;
    this.pickIndex = Math.max(0, this.outputs.findIndex((o) => o.ref === current));
    void this.updateComplete.then(() => this.querySelectorAll<HTMLElement>(".ui-sti__option")[this.pickIndex]?.focus());
  }
  private closePicker(focusBack = true) {
    const id = this.picking;
    this.picking = null;
    if (id && focusBack) void this.updateComplete.then(() => this.trigger(id)?.focus());
  }
  private choose(input: StepInput, ref: string) {
    const r = resolveRef(ref, this.upstream);
    if (this.setSource(input, { kind: "ref", ref })) this.announce = `${input.label} comes from ${r?.step.title} ${r?.output.name}`;
    this.closePicker();
  }
  private onPickKey = (e: KeyboardEvent, input: StepInput) => {
    const n = this.outputs.length;
    const to = e.key === "ArrowDown" ? this.pickIndex + 1 : e.key === "ArrowUp" ? this.pickIndex - 1 : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : null;
    if (to !== null) {
      e.preventDefault();
      this.pickIndex = (to + n) % n;
      void this.updateComplete.then(() => this.querySelectorAll<HTMLElement>(".ui-sti__option")[this.pickIndex]?.focus());
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.choose(input, this.outputs[this.pickIndex].ref);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      this.closePicker();
    } else if (e.key === "Tab") this.closePicker(false);
  };

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("step") && this.picking && !this.step?.inputs.some((i) => i.id === this.picking)) this.picking = null;
    if (changed.has("lastRun") && this.lastRun) this.runTab = this.lastRun.status === "failed" || this.lastRun.output === undefined ? (this.lastRun.input !== undefined ? "input" : "output") : "output";
  }
  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (changed.has("testing") && changed.get("testing") === true && !this.testing && this.lastRun) this.announce = this.lastRun.status === "failed" ? "Test failed" : "Test finished";
  }

  /* ---------- Rendering ---------- */

  private renderInput(input: StepInput) {
    const id = `${this.uid}-${input.id}`;
    const source = input.source ?? { kind: "value", value: "" };
    const missing = stepInputMissing(input, this.upstream);
    const canMap = this.outputs.length > 0;
    const describedBy = [input.description ? `${id}-desc` : "", missing ? `${id}-err` : ""].filter(Boolean).join(" ") || undefined;
    const value = source.kind === "value" ? source.value : "";
    const onValue = (e: Event) => this.setSource(input, { kind: "value", value: (e.target as HTMLInputElement).value });
    const ref = source.kind === "ref" ? resolveRef(source.ref, this.upstream) : null;
    return html`<fieldset class="ui-sti__input" data-input=${input.id} ?data-missing=${missing} ?disabled=${this.readonly}>
      <legend class="ui-sti__legend" id=${`${id}-label`}>
        ${input.label}${input.required ? html` <span class="ui-sti__req">Required</span>` : nothing}
      </legend>
      ${input.description ? html`<p class="ui-sti__desc" id=${`${id}-desc`}>${input.description}</p>` : nothing}
      <div class="ui-sti__source" role="radiogroup" aria-label=${`Where ${input.label} comes from`}>
        <label class="ui-sti__seg"
          ><input
            type="radio"
            name=${`${id}-src`}
            value="value"
            .checked=${live(source.kind === "value")}
            @change=${() => this.setSource(input, { kind: "value", value: "" })}
          /><span>Value</span></label
        >
        <label class="ui-sti__seg" ?data-off=${!canMap}
          ><input
            type="radio"
            name=${`${id}-src`}
            value="ref"
            ?disabled=${!canMap}
            .checked=${live(source.kind === "ref")}
            @change=${() => {
              if (this.setSource(input, { kind: "ref", ref: "" })) void this.updateComplete.then(() => this.openPicker(this.step!.inputs.find((i) => i.id === input.id)!));
            }}
          /><span>From a step</span></label
        >
      </div>
      ${source.kind === "value"
        ? input.type === "long"
          ? html`<textarea
              class="ui-sti__field"
              rows="3"
              aria-labelledby=${`${id}-label`}
              aria-describedby=${ifDefined(describedBy)}
              aria-invalid=${missing ? "true" : "false"}
              placeholder=${ifDefined(input.placeholder)}
              .value=${live(value)}
              @input=${onValue}
            ></textarea>`
          : input.type === "select"
            ? html`<select class="ui-sti__field" aria-labelledby=${`${id}-label`} aria-describedby=${ifDefined(describedBy)} aria-invalid=${missing ? "true" : "false"} @change=${onValue}>
                <option value="" ?selected=${!value}>Choose…</option>
                ${(input.options ?? []).map((o) => html`<option value=${o} ?selected=${o === value}>${o}</option>`)}
              </select>`
            : html`<input
                class="ui-sti__field"
                type=${input.type === "number" ? "number" : "text"}
                aria-labelledby=${`${id}-label`}
                aria-describedby=${ifDefined(describedBy)}
                aria-invalid=${missing ? "true" : "false"}
                placeholder=${ifDefined(input.placeholder)}
                .value=${live(value)}
                @input=${onValue}
              />`
        : html`<div class="ui-sti__map">
            <button
              type="button"
              class="ui-sti__chip"
              data-map=${input.id}
              ?data-empty=${!ref}
              aria-haspopup="listbox"
              aria-expanded=${this.picking === input.id ? "true" : "false"}
              aria-controls=${ifDefined(this.picking === input.id ? `${id}-list` : undefined)}
              aria-describedby=${ifDefined(describedBy)}
              aria-invalid=${missing ? "true" : "false"}
              @click=${() => (this.picking === input.id ? this.closePicker() : this.openPicker(input))}
            >
              ${icon(icons.link)}
              <span class="ui-sti__sr">${input.label}: </span>
              ${ref
                ? html`<span class="ui-sti__chip-step">${ref.step.title}</span> <span class="ui-sti__chip-sep" aria-hidden="true">›</span>
                    <span class="ui-sti__chip-out">${ref.output.name}</span>`
                : html`<span class="ui-sti__chip-step">Choose an output</span>`}
              ${icon(icons.chevron)}
            </button>
            ${ref ? html`<code class="ui-sti__ref">${(source as { ref: string }).ref}</code>` : nothing}
            ${this.picking === input.id ? this.renderPicker(input, `${id}-list`) : nothing}
          </div>`}
      ${missing
        ? html`<p class="ui-sti__error" id=${`${id}-err`}>${icon(icons.alert)}Missing – ${canMap ? "type a value or map it from an earlier step" : "type a value"}</p>`
        : nothing}
    </fieldset>`;
  }

  private renderPicker(input: StepInput, listId: string) {
    const current = input.source?.kind === "ref" ? input.source.ref : null;
    let i = -1;
    return html`<div class="ui-sti__list" id=${listId} role="listbox" aria-label=${`Outputs for ${input.label}`} @keydown=${(e: KeyboardEvent) => this.onPickKey(e, input)}>
      ${this.upstream
        .filter((s) => s.outputs.length)
        .map(
          (s) => html`<div class="ui-sti__group" role="group" aria-label=${s.title}>
            <div class="ui-sti__group-label" aria-hidden="true">
              <span class="ui-sti__kind" data-kind=${s.kind}>${workflowKindIcon(s.kind, this.kinds)}</span>${s.title}
            </div>
            ${s.outputs.map((o) => {
              i++;
              const ref = `${s.id}.${o.name}`;
              const n = i;
              return html`<div
                class="ui-sti__option"
                role="option"
                data-ref=${ref}
                tabindex=${n === this.pickIndex ? 0 : -1}
                aria-selected=${ref === current ? "true" : "false"}
                @click=${() => this.choose(input, ref)}
                @focus=${() => (this.pickIndex = n)}
              >
                <span class="ui-sti__opt-name">${o.name}</span>
                ${o.type ? html`<span class="ui-sti__opt-type">${o.type}</span>` : nothing}
                ${o.sample ? html`<span class="ui-sti__opt-sample">${o.sample}</span>` : nothing}
              </div>`;
            })}
          </div>`,
        )}
    </div>`;
  }

  private renderRun() {
    const run = this.lastRun;
    const id = this.uid;
    if (!run) return html`<p class="ui-sti__norun">Not tested yet.</p>`;
    const tabs = (["input", "output"] as const).filter((t) => run[t] !== undefined);
    const tab = tabs.includes(this.runTab) ? this.runTab : tabs[0];
    const show = (v: unknown) => (typeof v === "string" ? v : JSON.stringify(v, null, 2));
    return html`<div class="ui-sti__run" data-status=${run.status}>
      <p class="ui-sti__run-status">
        ${icon(run.status === "failed" ? icons.alert : icons.check)}<span>${run.status === "failed" ? "Last test failed" : "Last test succeeded"}${run.duration ? ` · ${run.duration}` : ""}</span>
      </p>
      ${run.error ? html`<p class="ui-sti__run-error">${run.error}</p>` : nothing}
      ${tabs.length
        ? html`<div
              class="ui-sti__tabs"
              role="tablist"
              aria-label="Last test"
              @keydown=${(e: KeyboardEvent) => {
                if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Home" && e.key !== "End") return;
                e.preventDefault();
                const i = tabs.indexOf(tab);
                const next = e.key === "Home" ? tabs[0] : e.key === "End" ? tabs.at(-1)! : tabs[(i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
                this.runTab = next;
                void this.updateComplete.then(() => this.querySelector<HTMLElement>(`#${id}-tab-${next}`)?.focus());
              }}
            >
              ${tabs.map(
                (t) => html`<button
                  type="button"
                  role="tab"
                  class="ui-sti__tab"
                  id=${`${id}-tab-${t}`}
                  aria-selected=${t === tab ? "true" : "false"}
                  aria-controls=${`${id}-panel`}
                  tabindex=${t === tab ? 0 : -1}
                  @click=${() => (this.runTab = t)}
                >
                  ${t === "input" ? "Input" : "Output"}
                </button>`,
              )}
            </div>
            <pre class="ui-sti__json" id=${`${id}-panel`} role="tabpanel" tabindex="0" aria-labelledby=${`${id}-tab-${tab}`}>${show(run[tab])}</pre>`
        : nothing}
    </div>`;
  }

  protected override render() {
    const id = this.uid;
    const s = this.step;
    if (!s)
      return html`${cardHead({ icon: icons.link, title: this.heading, id: `${id}-title` })}
        <div class="ui-sti__card"><p class="ui-sti__none">Select a step to see its settings.</p></div>`;
    const k = workflowKind(s.kind, this.kinds);
    const missing = s.inputs.filter((i) => stepInputMissing(i, this.upstream)).length;
    const aside = missing
      ? html`<span class="ui-sti__pill" data-tone="warning">${missing} missing</span>`
      : html`<span class="ui-sti__pill" data-tone="success">Ready</span>`;
    return html`
      <span class="ui-sti__sr" role="status">${this.announce}</span>
      ${cardHead({ icon: k.icon, title: s.title || this.heading, subtitle: `${k.label} · ${s.inputs.length} ${s.inputs.length === 1 ? "input" : "inputs"}`, id: `${id}-title`, aside })}
      <div class="ui-sti__card" data-kind=${s.kind}>
        <div class="ui-sti__section">
          <label class="ui-sti__title-label" for=${`${id}-title-field`}>Title</label>
          <input
            class="ui-sti__field"
            id=${`${id}-title-field`}
            type="text"
            ?disabled=${this.readonly}
            .value=${live(s.title)}
            @input=${(e: Event) => this.setTitle((e.target as HTMLInputElement).value)}
          />
        </div>
        <section class="ui-sti__section" aria-labelledby=${`${id}-inputs`}>
          <h4 class="ui-sti__h" id=${`${id}-inputs`}>Inputs</h4>
          ${s.inputs.length ? s.inputs.map((i) => this.renderInput(i)) : html`<p class="ui-sti__norun">This step takes no inputs.</p>`}
        </section>
        <section class="ui-sti__section" aria-labelledby=${`${id}-test`}>
          <div class="ui-sti__test-head">
            <h4 class="ui-sti__h" id=${`${id}-test`}>Test</h4>
            ${this.readonly
              ? nothing
              : html`<button
                  type="button"
                  class="ui-sti__test"
                  aria-disabled=${this.testing || missing ? "true" : "false"}
                  aria-describedby=${ifDefined(missing ? `${id}-test-why` : undefined)}
                  @click=${() => {
                    if (this.testing || missing) return;
                    this.announce = "Testing…";
                    this.emit<StepTest>("tc-test", { step: s });
                  }}
                >
                  ${icon(icons.play)}${this.testing ? "Testing…" : "Test with sample"}
                </button>`}
          </div>
          ${missing && !this.readonly ? html`<p class="ui-sti__desc" id=${`${id}-test-why`}>Fill in the missing inputs to test this step.</p>` : nothing}
          ${this.renderRun()}
        </section>
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="sti"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="sti"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="sti"] { --tc-sti-json-h: 220px; }
[data-ui="sti"] *, [data-ui="sti"] *::before, [data-ui="sti"] *::after { box-sizing: border-box; }
:where([data-ui="sti"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="sti"] :is(button, input, select, textarea, pre, [role="option"]):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="sti"] p, [data-ui="sti"] h4, [data-ui="sti"] pre { margin: 0; }
[data-ui="sti"] svg { display: block; flex: none; }
.ui-sti__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-sti__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-sti__pill { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); white-space: nowrap; }
.ui-sti__pill[data-tone="warning"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-sti__pill[data-tone="success"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-sti__section { display: grid; gap: var(--tc-space-2-5); padding: var(--tc-space-4) !important; }
.ui-sti__section + .ui-sti__section { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-sti__h { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-sti__title-label { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
/* Fields */
.ui-sti__field { width: 100%; min-height: var(--tc-field-h); padding: 0 var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font: inherit; font-size: var(--tc-field-font-size); color: var(--tc-text-primary); }
textarea.ui-sti__field { padding: var(--tc-space-2) var(--tc-field-px); resize: vertical; }
.ui-sti__field:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-sti__field:focus { outline: none; box-shadow: var(--tc-field-shadow-focus); }
.ui-sti__field[aria-invalid="true"] { box-shadow: var(--tc-field-shadow-invalid); }
.ui-sti__field:disabled { color: var(--tc-text-muted); background: var(--tc-field-bg-sunken); }
.ui-sti__field::placeholder { color: var(--tc-text-placeholder); }
/* An input: its label, where it comes from, then the field or the mapping */
.ui-sti__input { display: grid; gap: var(--tc-space-1-5); min-width: 0; margin: 0; padding: var(--tc-space-3) !important; border: 0; border-radius: var(--tc-radius-lg); background: var(--tc-surface-sunken); }
.ui-sti__input[data-missing] { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-status-warning-border); }
.ui-sti__legend { display: flex; float: left; width: 100%; align-items: center; gap: var(--tc-space-2); padding: 0; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-sti__legend + * { clear: both; }
.ui-sti__req { font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); }
.ui-sti__desc { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
.ui-sti__source { display: inline-flex; justify-self: start; gap: var(--tc-space-0-5); padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
.ui-sti__seg { position: relative; display: inline-flex; align-items: center; min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2-5); border-radius: var(--tc-control-radius-sm); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); cursor: pointer; }
.ui-sti__seg input { position: absolute; inset: 0; margin: 0; opacity: 0; cursor: inherit; }
.ui-sti__seg:has(input:checked) { background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow); color: var(--tc-text-primary); }
.ui-sti__seg:has(input:focus-visible) { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-sti__seg[data-off] { color: var(--tc-text-disabled); cursor: default; }
/* The mapping: a chip naming the step and its output */
.ui-sti__map { position: relative; display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); }
.ui-sti__chip { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); min-height: var(--tc-control-h-sm); max-width: 100%; padding: 0 var(--tc-space-2-5) !important; border-radius: var(--tc-radius-full); background: var(--tc-accent-subtle) !important; color: var(--tc-accent-text); font-size: var(--tc-font-size-sm); }
.ui-sti__chip[data-empty] { background: var(--tc-field-bg) !important; box-shadow: var(--tc-field-shadow); color: var(--tc-text-secondary); }
.ui-sti__chip[aria-invalid="true"][data-empty] { box-shadow: var(--tc-field-shadow-invalid); }
.ui-sti__chip svg { width: 14px; height: 14px; }
.ui-sti__chip-step { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-sti__chip-out { font-weight: var(--tc-font-weight-semibold); }
.ui-sti__ref { font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-sti__list { position: absolute; z-index: var(--tc-z-dropdown); top: 100%; left: 0; width: min(320px, 100%); max-height: 260px; margin-top: var(--tc-space-1); overflow: auto; padding: var(--tc-menu-padding); border-radius: var(--tc-menu-radius); background: var(--tc-menu-bg); box-shadow: var(--tc-menu-shadow); }
.ui-sti__group + .ui-sti__group { margin-top: var(--tc-space-1); }
.ui-sti__group-label { display: flex; align-items: center; gap: var(--tc-space-1-5); padding: var(--tc-space-1-5) var(--tc-space-2) var(--tc-space-1); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
.ui-sti__kind svg { width: 14px; height: 14px; }
.ui-sti__option { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0 var(--tc-space-2); min-height: var(--tc-menu-item-h); padding: var(--tc-space-1-5) var(--tc-menu-item-px) var(--tc-space-1-5) var(--tc-space-6); border-radius: var(--tc-menu-item-radius); font-size: var(--tc-menu-item-font-size); color: var(--tc-text-primary); cursor: pointer; }
.ui-sti__option:hover, .ui-sti__option:focus { background: var(--tc-menu-item-hover); }
.ui-sti__option[aria-selected="true"] { color: var(--tc-menu-item-selected-fg); font-weight: var(--tc-font-weight-medium); }
.ui-sti__opt-name { font-family: var(--tc-font-mono); }
.ui-sti__opt-type { font-size: var(--tc-font-size-2xs); color: var(--tc-text-muted); }
.ui-sti__opt-sample { flex-basis: 100%; overflow: hidden; font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); text-overflow: ellipsis; white-space: nowrap; }
.ui-sti__error { display: flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-xs); color: var(--tc-status-warning-fg); }
.ui-sti__error svg { width: 14px; height: 14px; }
/* The test */
.ui-sti__test-head { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-2); }
.ui-sti__test { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); min-height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm) !important; border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg) !important; box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-action-secondary-fg); }
.ui-sti__test svg { width: 14px; height: 14px; }
.ui-sti__test[aria-disabled="true"] { cursor: default; color: var(--tc-text-disabled); box-shadow: none; }
.ui-sti__norun, .ui-sti__none { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-sti__none { padding: var(--tc-space-8) var(--tc-space-4) !important; text-align: center; }
.ui-sti__run { display: grid; gap: var(--tc-space-2); }
.ui-sti__run-status { display: flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-status-success-fg); }
.ui-sti__run[data-status="failed"] .ui-sti__run-status { color: var(--tc-status-danger-fg); }
.ui-sti__run-status svg { width: 16px; height: 16px; }
.ui-sti__run-error { font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-sti__tabs { display: flex; gap: var(--tc-space-1); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-sti__tab { min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2-5) !important; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); box-shadow: inset 0 -2px 0 transparent; }
.ui-sti__tab[aria-selected="true"] { color: var(--tc-text-primary); box-shadow: inset 0 -2px 0 var(--tc-accent); }
.ui-sti__json { max-height: var(--tc-sti-json-h); overflow: auto; padding: var(--tc-space-3) !important; border-radius: var(--tc-radius-md); background: var(--tc-surface-sunken); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-relaxed); color: var(--tc-syntax-text); white-space: pre; }
@container (max-width: 400px) {
  .ui-sti__section { padding: var(--tc-space-3) !important; }
}
@media (forced-colors: active) {
  .ui-sti__seg:has(input:checked) { outline: 2px solid Highlight; }
  .ui-sti__chip { border: 1px solid CanvasText; }
}
`;
}

if (!customElements.get("tc-step-inspector")) customElements.define("tc-step-inspector", TcStepInspector);

declare global {
  interface HTMLElementTagNameMap {
    "tc-step-inspector": TcStepInspector;
  }
}
