import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-agent-create> – describe an agent in a sentence or two, get a working draft. A field ("What should this agent
 * do?") with example chips that fill it; Generate fires tc-generate, and the page streams the draft back through
 * `draft` while `streaming` is set. The draft is editable in sections – its name, instructions, tools as switches,
 * model and triggers – with the model's open questions to answer. Create fires tc-create with the draft; Start over
 * clears everything.
 *   · every edit fires tc-draft-change with the whole draft, so the page can own it
 *   · while the draft streams in, its sections are aria-busy and Create waits, saying why
 *   · "Writing the draft…" and "Draft ready" are announced once each
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-agent-create .examples=${["Match invoices to purchase orders"]}></tc-agent-create>
 */

export type AgentDraftTool = { id: string; label: string; description?: string; enabled: boolean };
export type AgentDraftTrigger = { id: string; label: string };
export type AgentDraftQuestion = { id: string; question: string; answer?: string };
export type AgentDraft = {
  name: string;
  instructions: string;
  tools: AgentDraftTool[];
  model: string;
  triggers: AgentDraftTrigger[];
  questions: AgentDraftQuestion[];
};
export type AgentCreateModel = { id: string; label: string };
export type AgentDraftField = "name" | "instructions" | "tools" | "model" | "triggers" | "questions";
export type AgentCreatePromptChange = { prompt: string };
export type AgentCreateGenerate = { description: string };
export type AgentCreateDraftChange = { draft: AgentDraft | null; field: AgentDraftField | "reset" };
export type AgentCreateCreate = { draft: AgentDraft };

/** The element's words, every one renameable through `labels` */
export type AgentCreateLabels = {
  prompt: string;
  placeholder: string;
  examples: string;
  generate: string;
  regenerate: string;
  needPrompt: string;
  draft: string;
  name: string;
  needName: string;
  instructions: string;
  tools: string;
  noTools: string;
  model: string;
  triggers: string;
  noTriggers: string;
  addTrigger: string;
  add: string;
  remove: string;
  questions: string;
  answer: string;
  create: string;
  startOver: string;
  writing: string;
  ready: string;
  waitDraft: string;
};
export const defaultAgentCreateLabels: AgentCreateLabels = {
  prompt: "What should this agent do?",
  placeholder: "Describe the job, what it reads, and what it should hand back.",
  examples: "Examples",
  generate: "Generate draft",
  regenerate: "Generate again",
  needPrompt: "Describe the agent first.",
  draft: "Draft",
  name: "Name",
  needName: "Give the agent a name.",
  instructions: "Instructions",
  tools: "Tools",
  noTools: "No tools suggested.",
  model: "Model",
  triggers: "Starts when",
  noTriggers: "No triggers yet – it runs only when started by hand.",
  addTrigger: "Add a trigger",
  add: "Add",
  remove: "Remove",
  questions: "Questions from the model",
  answer: "Your answer",
  create: "Create agent",
  startOver: "Start over",
  writing: "Writing the draft…",
  ready: "Draft ready. Check each section before you create the agent.",
  waitDraft: "Wait for the draft to finish.",
};

/* sparkles: Lucide (ISC, lucide.dev) */
const ICON = svg`<path d="M9.94 14.06 4 20"></path><path d="m14 2 1.2 3.5L19 7l-3.8 1.5L14 12l-1.2-3.5L9 7l3.8-1.5z"></path><path d="m5 3 .7 2L8 6l-2.3 1L5 9l-.7-2L2 6l2.3-1z"></path>`;
let instances = 0;
let triggerIds = 0;

/**
 * Describe an agent and get a working draft to edit: name, instructions, tools, model, triggers and open questions.
 * @tag tc-agent-create
 * @fires tc-prompt-change - The description changed ({ prompt }: AgentCreatePromptChange); cancelable – prevented, `prompt` stays as it was
 * @fires tc-generate - Generate was pressed ({ description }: AgentCreateGenerate); cancelable – prevented, `streaming` isn't set
 * @fires tc-draft-change - The draft was edited or cleared ({ draft, field }: AgentCreateDraftChange); cancelable – prevented, `draft` stays as it was
 * @fires tc-create - Create was pressed with a named, finished draft ({ draft }: AgentCreateCreate); cancelable
 * @fires tc-reset - Start over was pressed (detail: {}); cancelable – prevented, nothing is cleared
 */
export class TcAgentCreate extends TcElement {
  static override ui = "agcr";

  /** The heading */
  @property() accessor heading = "New agent";
  /** A line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** What the agent should do, in the person's words. Changed by the user unless a tc-prompt-change listener calls preventDefault() */
  @property() accessor prompt = "";
  /** Example descriptions, as chips that fill the field */
  @property({ attribute: false }) accessor examples: string[] = [];
  /** The draft the page streams back; null before Generate. Changed by edits unless a tc-draft-change listener calls preventDefault() */
  @property({ attribute: false }) accessor draft: AgentDraft | null = null;
  /** The draft is still streaming in. Set by Generate; the page clears it when the draft is done */
  @property({ type: Boolean, reflect: true }) accessor streaming = false;
  /** The models to choose from; the draft's own model is offered too */
  @property({ attribute: false }) accessor models: AgentCreateModel[] = [];
  /** Rename any of the words */
  @property({ attribute: false }) accessor labels: Partial<AgentCreateLabels> = {};

  @state() private accessor said = "";
  @state() private accessor problem: "prompt" | "name" | null = null;
  @state() private accessor newTrigger = "";
  private readonly uid = `tc-agcr-${++instances}`;

  private get words(): AgentCreateLabels {
    return { ...defaultAgentCreateLabels, ...this.labels };
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("streaming") && changed.get("streaming") !== undefined) {
      if (this.streaming) this.said = this.words.writing;
      else if (this.draft) this.said = this.words.ready;
    }
    if (changed.has("prompt") && this.prompt.trim() && this.problem === "prompt") this.problem = null;
    if (changed.has("draft") && this.draft?.name.trim() && this.problem === "name") this.problem = null;
  }

  private setPrompt(prompt: string, field?: HTMLTextAreaElement) {
    if (this.emit<AgentCreatePromptChange>("tc-prompt-change", { prompt }, { cancelable: true })) this.prompt = prompt;
    else if (field) field.value = this.prompt;
  }

  private useExample(text: string) {
    this.setPrompt(text);
    this.updateComplete.then(() => this.querySelector<HTMLTextAreaElement>(".ui-agcr__prompt")?.focus());
  }

  private generate() {
    if (this.streaming) return;
    const description = this.prompt.trim();
    if (!description) {
      this.problem = "prompt";
      this.querySelector<HTMLTextAreaElement>(".ui-agcr__prompt")?.focus();
      return;
    }
    if (this.emit<AgentCreateGenerate>("tc-generate", { description }, { cancelable: true })) this.streaming = true;
  }

  private edit(field: AgentDraftField, patch: Partial<AgentDraft>) {
    if (!this.draft) return;
    const draft = { ...this.draft, ...patch };
    if (this.emit<AgentCreateDraftChange>("tc-draft-change", { draft, field }, { cancelable: true })) this.draft = draft;
    else this.requestUpdate();
  }

  private toggleTool(id: string) {
    if (!this.draft) return;
    this.edit("tools", { tools: this.draft.tools.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t)) });
  }

  private addTrigger() {
    const label = this.newTrigger.trim();
    if (!this.draft || !label) return;
    this.edit("triggers", { triggers: [...this.draft.triggers, { id: `${this.uid}-trigger-${++triggerIds}`, label }] });
    this.newTrigger = "";
  }

  private removeTrigger(id: string) {
    if (!this.draft) return;
    const at = this.draft.triggers.findIndex((t) => t.id === id);
    this.edit("triggers", { triggers: this.draft.triggers.filter((t) => t.id !== id) });
    this.updateComplete.then(() => {
      const rest = this.querySelectorAll<HTMLElement>(".ui-agcr__trigger-remove");
      (rest[Math.min(at, rest.length - 1)] ?? this.querySelector<HTMLElement>(".ui-agcr__trigger-input"))?.focus();
    });
  }

  private answer(id: string, answer: string) {
    if (!this.draft) return;
    this.edit("questions", { questions: this.draft.questions.map((q) => (q.id === id ? { ...q, answer } : q)) });
  }

  private create() {
    if (!this.draft || this.streaming) return;
    if (!this.draft.name.trim()) {
      this.problem = "name";
      this.querySelector<HTMLInputElement>(".ui-agcr__name")?.focus();
      return;
    }
    this.emit<AgentCreateCreate>("tc-create", { draft: this.draft }, { cancelable: true });
  }

  private startOver() {
    if (!this.emit("tc-reset", {}, { cancelable: true })) return;
    if (this.draft && this.emit<AgentCreateDraftChange>("tc-draft-change", { draft: null, field: "reset" }, { cancelable: true })) this.draft = null;
    this.setPrompt("");
    this.streaming = false;
    this.problem = null;
    this.said = "";
    this.updateComplete.then(() => this.querySelector<HTMLTextAreaElement>(".ui-agcr__prompt")?.focus());
  }

  private renderDraft(d: AgentDraft) {
    const w = this.words;
    const id = this.uid;
    const models = this.models.some((m) => m.id === d.model) || !d.model ? this.models : [...this.models, { id: d.model, label: d.model }];
    const waiting = this.streaming;
    const createReason = waiting ? w.waitDraft : !d.name.trim() ? w.needName : "";
    return html`<section class="ui-agcr__draft" aria-labelledby=${`${id}-draft`} aria-busy=${waiting ? "true" : "false"}>
      <h4 class="ui-agcr__section-title" id=${`${id}-draft`}>${w.draft}</h4>
      <div class="ui-agcr__field">
        <label class="ui-agcr__label" for=${`${id}-name`}>${w.name}</label>
        <input
          class="ui-agcr__input ui-agcr__name"
          id=${`${id}-name`}
          .value=${d.name}
          aria-invalid=${this.problem === "name" ? "true" : "false"}
          aria-describedby=${this.problem === "name" ? `${id}-name-error` : nothing}
          @input=${(e: InputEvent) => this.edit("name", { name: (e.target as HTMLInputElement).value })}
        />
        ${this.problem === "name" ? html`<span class="ui-agcr__error" id=${`${id}-name-error`}>${w.needName}</span>` : nothing}
      </div>
      <div class="ui-agcr__field">
        <label class="ui-agcr__label" for=${`${id}-instructions`}>${w.instructions}</label>
        <textarea class="ui-agcr__input ui-agcr__instructions" id=${`${id}-instructions`} rows="6" .value=${d.instructions} @input=${(e: InputEvent) => this.edit("instructions", { instructions: (e.target as HTMLTextAreaElement).value })}></textarea>
      </div>
      <div class="ui-agcr__field">
        <span class="ui-agcr__label" id=${`${id}-tools`}>${w.tools}</span>
        ${d.tools.length
          ? html`<ul class="ui-agcr__tools" aria-labelledby=${`${id}-tools`}>
              ${d.tools.map(
                (t) => html`<li class="ui-agcr__tool">
                  <button type="button" role="switch" class="ui-agcr__switch" data-tool=${t.id} aria-checked=${t.enabled ? "true" : "false"} aria-describedby=${t.description ? `${id}-tool-${t.id}` : nothing} @click=${() => this.toggleTool(t.id)}>
                    <span class="ui-agcr__track" aria-hidden="true"><span class="ui-agcr__thumb"></span></span>
                    <span class="ui-agcr__tool-name">${t.label}</span>
                  </button>
                  ${t.description ? html`<span class="ui-agcr__hint" id=${`${id}-tool-${t.id}`}>${t.description}</span>` : nothing}
                </li>`,
              )}
            </ul>`
          : html`<p class="ui-agcr__none">${w.noTools}</p>`}
      </div>
      <div class="ui-agcr__field">
        <label class="ui-agcr__label" for=${`${id}-model`}>${w.model}</label>
        <select class="ui-agcr__input ui-agcr__model" id=${`${id}-model`} @change=${(e: Event) => this.edit("model", { model: (e.target as HTMLSelectElement).value })}>
          ${models.map((m) => html`<option value=${m.id} ?selected=${m.id === d.model}>${m.label}</option>`)}
        </select>
      </div>
      <div class="ui-agcr__field">
        <span class="ui-agcr__label" id=${`${id}-triggers`}>${w.triggers}</span>
        ${d.triggers.length
          ? html`<ul class="ui-agcr__triggers" aria-labelledby=${`${id}-triggers`}>
              ${d.triggers.map(
                (t) => html`<li class="ui-agcr__trigger" data-trigger=${t.id}>
                  <span class="ui-agcr__trigger-label">${t.label}</span>
                  <button type="button" class="tc-btn-sm ui-agcr__trigger-remove" @click=${() => this.removeTrigger(t.id)}>${w.remove}<span class="tc-sr-only">: ${t.label}</span></button>
                </li>`,
              )}
            </ul>`
          : html`<p class="ui-agcr__none">${w.noTriggers}</p>`}
        <div class="ui-agcr__add">
          <input
            class="ui-agcr__input ui-agcr__trigger-input"
            aria-label=${w.addTrigger}
            placeholder=${w.addTrigger}
            .value=${this.newTrigger}
            @input=${(e: InputEvent) => (this.newTrigger = (e.target as HTMLInputElement).value)}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === "Enter" && !e.isComposing) {
                e.preventDefault();
                this.addTrigger();
              }
            }}
          />
          <button type="button" class="tc-btn-sm ui-agcr__trigger-add" @click=${this.addTrigger}>${w.add}</button>
        </div>
      </div>
      ${d.questions.length
        ? html`<div class="ui-agcr__field ui-agcr__questions">
            <span class="ui-agcr__label">${w.questions}</span>
            ${d.questions.map(
              (q) => html`<div class="ui-agcr__question" data-question=${q.id}>
                <label class="ui-agcr__question-text" for=${`${id}-q-${q.id}`}>${q.question}</label>
                <input class="ui-agcr__input ui-agcr__answer" id=${`${id}-q-${q.id}`} placeholder=${w.answer} .value=${q.answer ?? ""} @input=${(e: InputEvent) => this.answer(q.id, (e.target as HTMLInputElement).value)} />
              </div>`,
            )}
          </div>`
        : nothing}
      <div class="ui-agcr__actions">
        <button type="button" class="tc-btn-sm ui-agcr__start-over" @click=${this.startOver}>${w.startOver}</button>
        <button type="button" class="ui-agcr__btn ui-agcr__btn--primary ui-agcr__create" aria-disabled=${createReason ? "true" : "false"} aria-describedby=${createReason ? `${id}-create-why` : nothing} @click=${this.create}>${w.create}</button>
        ${createReason ? html`<span class="tc-sr-only" id=${`${id}-create-why`}>${createReason}</span>` : nothing}
      </div>
    </section>`;
  }

  protected override render() {
    const w = this.words;
    const id = this.uid;
    const empty = !this.prompt.trim();
    return html`${cardHead({ icon: ICON, title: this.heading, subtitle: this.description, id: `${id}-title` })}
      <div class="ui-agcr__card">
        <div class="ui-agcr__describe">
          <div class="ui-agcr__field">
            <label class="ui-agcr__label" for=${`${id}-prompt`}>${w.prompt}</label>
            <textarea
              class="ui-agcr__input ui-agcr__prompt"
              id=${`${id}-prompt`}
              rows="3"
              placeholder=${w.placeholder}
              .value=${this.prompt}
              aria-invalid=${this.problem === "prompt" ? "true" : "false"}
              aria-describedby=${this.problem === "prompt" ? `${id}-prompt-error` : nothing}
              @input=${(e: InputEvent) => this.setPrompt((e.target as HTMLTextAreaElement).value, e.target as HTMLTextAreaElement)}
              @keydown=${(e: KeyboardEvent) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !e.isComposing) {
                  e.preventDefault();
                  this.generate();
                }
              }}
            ></textarea>
            ${this.problem === "prompt" ? html`<span class="ui-agcr__error" id=${`${id}-prompt-error`}>${w.needPrompt}</span>` : nothing}
          </div>
          ${this.examples.length
            ? html`<div class="ui-agcr__examples" role="group" aria-label=${w.examples}>
                ${this.examples.map((x) => html`<button type="button" class="ui-agcr__chip" @click=${() => this.useExample(x)}>${x}</button>`)}
              </div>`
            : nothing}
          <div class="ui-agcr__generate-row">
            <button
              type="button"
              class="ui-agcr__btn ${this.draft ? "" : "ui-agcr__btn--primary"} ui-agcr__generate"
              aria-disabled=${empty || this.streaming ? "true" : "false"}
              aria-describedby=${empty ? `${id}-generate-why` : nothing}
              @click=${this.generate}
            >${this.draft ? w.regenerate : w.generate}</button>
            ${empty ? html`<span class="tc-sr-only" id=${`${id}-generate-why`}>${w.needPrompt}</span>` : nothing}
            ${this.streaming ? html`<span class="ui-agcr__busy" aria-hidden="true">${w.writing}</span>` : nothing}
          </div>
        </div>
        ${this.draft ? this.renderDraft(this.draft) : nothing}
        <span class="tc-sr-only" role="status">${this.said}</span>
      </div>`;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="agcr"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="agcr"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
/* The switch's size – override it on the element */
[data-ui="agcr"] { --tc-agcr-track-w: var(--tc-space-7); --tc-agcr-track-h: var(--tc-space-4); }
[data-ui="agcr"] *, [data-ui="agcr"] *::before, [data-ui="agcr"] *::after { box-sizing: border-box; }
[data-ui="agcr"] :where(p, h4, ul) { margin: 0; }
[data-ui="agcr"] :where(ul) { padding: 0; list-style: none; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="agcr"] .ui-agcr__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-agcr__card { display: grid; gap: var(--tc-space-5); padding: var(--tc-space-4); }
.ui-agcr__describe, .ui-agcr__draft { display: grid; gap: var(--tc-space-3); }
.ui-agcr__draft { padding-top: var(--tc-space-4); border-top: 1px solid var(--tc-border-subtle); }
.ui-agcr__draft[aria-busy="true"] .ui-agcr__input { background: var(--tc-field-bg-sunken); }
.ui-agcr__section-title { font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); }
.ui-agcr__field { display: grid; gap: var(--tc-space-1-5); min-width: 0; }
.ui-agcr__label { font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); }
.ui-agcr__input { display: block; width: 100%; min-height: var(--tc-field-h); margin: 0; padding: 0 var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); outline: none; background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font: inherit; font-size: var(--tc-field-font-size); color: var(--tc-text-primary); }
textarea.ui-agcr__input { padding: var(--tc-space-2) var(--tc-field-px); resize: vertical; line-height: var(--tc-line-height-normal); }
.ui-agcr__input::placeholder { color: var(--tc-text-placeholder); }
.ui-agcr__input:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-agcr__input:focus { box-shadow: var(--tc-field-shadow-focus); }
.ui-agcr__input[aria-invalid="true"] { box-shadow: var(--tc-field-shadow-invalid); }
.ui-agcr__error { color: var(--tc-status-danger-fg); font-size: var(--tc-font-size-xs); }
.ui-agcr__examples { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); }
.ui-agcr__chip { min-height: var(--tc-control-h-sm); margin: 0; padding: var(--tc-space-1) var(--tc-space-2-5); border: 0; border-radius: var(--tc-control-radius-sm); background: var(--tc-fill-default); font: inherit; font-size: var(--tc-font-size-xs); color: var(--tc-text-secondary); text-align: left; cursor: pointer; }
.ui-agcr__chip:hover { background: var(--tc-fill-strong); color: var(--tc-text-primary); }
.ui-agcr__generate-row, .ui-agcr__actions, .ui-agcr__add { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); }
.ui-agcr__actions { justify-content: flex-end; }
.ui-agcr__add .ui-agcr__input { flex: 1 1 12em; width: auto; min-height: var(--tc-field-h-sm); }
.ui-agcr__busy { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); }
.ui-agcr__btn { display: inline-flex; flex: none; align-items: center; justify-content: center; height: var(--tc-control-h-md); margin: 0; padding: 0 var(--tc-control-px-md); border: 0; border-radius: var(--tc-control-radius-md); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font: inherit; font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); white-space: nowrap; cursor: pointer; }
.ui-agcr__btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-agcr__btn--primary { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-agcr__btn--primary:hover { background: var(--tc-action-primary-bg-hover); box-shadow: var(--tc-action-primary-shadow); }
.ui-agcr__btn[aria-disabled="true"] { background: var(--tc-fill-default); box-shadow: none; color: var(--tc-text-secondary); cursor: not-allowed; }
.ui-agcr__btn:focus-visible, .ui-agcr__chip:focus-visible, .ui-agcr__switch:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-agcr__tools { display: grid; gap: var(--tc-space-1-5); }
.ui-agcr__tool { display: grid; gap: var(--tc-space-0-5); }
.ui-agcr__switch { display: inline-flex; align-items: center; gap: var(--tc-space-2); min-height: var(--tc-control-h-sm); margin: 0; padding: 0; border: 0; background: none; font: inherit; color: var(--tc-text-primary); text-align: left; cursor: pointer; }
.ui-agcr__track { position: relative; flex: none; width: var(--tc-agcr-track-w); height: var(--tc-agcr-track-h); border-radius: var(--tc-radius-full); background: var(--tc-fill-strong); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-agcr__thumb { position: absolute; top: var(--tc-space-0-5); left: var(--tc-space-0-5); width: calc(var(--tc-agcr-track-h) - var(--tc-space-1)); height: calc(var(--tc-agcr-track-h) - var(--tc-space-1)); border-radius: var(--tc-radius-full); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-control); transition: transform var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-agcr__switch[aria-checked="true"] .ui-agcr__track { background: var(--tc-action-primary-bg); }
.ui-agcr__switch[aria-checked="true"] .ui-agcr__thumb { transform: translateX(calc(var(--tc-agcr-track-w) - var(--tc-agcr-track-h))); }
.ui-agcr__hint { padding-left: calc(var(--tc-agcr-track-w) + var(--tc-space-2)); color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); }
.ui-agcr__triggers { display: grid; gap: var(--tc-space-1); }
.ui-agcr__trigger { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-2); padding: var(--tc-space-1) var(--tc-space-1) var(--tc-space-1) var(--tc-space-2-5); border-radius: var(--tc-control-radius-md); background: var(--tc-fill-subtle); }
.ui-agcr__trigger-label { min-width: 0; overflow-wrap: anywhere; }
.ui-agcr__questions { gap: var(--tc-space-2); padding: var(--tc-space-3); border-radius: var(--tc-control-radius-md); background: var(--tc-status-info-bg); }
.ui-agcr__question { display: grid; gap: var(--tc-space-1); }
.ui-agcr__question-text { color: var(--tc-text-primary); }
.ui-agcr__none { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); }
@media (prefers-reduced-motion: reduce) { .ui-agcr__track, .ui-agcr__thumb { transition: none; } }
@media (forced-colors: active) {
  .ui-agcr__track { border: 1px solid CanvasText; }
  .ui-agcr__switch[aria-checked="true"] .ui-agcr__track { background: Highlight; forced-color-adjust: none; }
  .ui-agcr__btn[aria-disabled="true"] { color: GrayText; }
}
`;
}

if (!customElements.get("tc-agent-create")) customElements.define("tc-agent-create", TcAgentCreate);

declare global {
  interface HTMLElementTagNameMap {
    "tc-agent-create": TcAgentCreate;
  }
}
