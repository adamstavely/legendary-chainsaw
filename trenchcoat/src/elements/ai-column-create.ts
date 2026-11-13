import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-ai-column-create> – one prompt, filled in for every row of a table. Name the column, choose what it holds (text,
 * a number, yes or no, one of a few choices, a link or JSON), write the prompt with the table's columns as {{column}}
 * variables – the chips under the field insert them at the caret, and a variable the table doesn't have is called
 * out – then pick the model and whether it may search the web. "Try on 3 rows" asks the page for a preview and shows
 * the three answers; Create column hands the column back, beside the page's estimate of what the run will take
 * ("2,000 rows · about 3 min · about $1.40").
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-ai-column-create .columns=${[{ id: "vendor", label: "Vendor" }]} .models=${models} estimate="2,000 rows · about 3 min"></tc-ai-column-create>
 *
 * `value` is the column being written; every edit fires a cancelable tc-value-change ({ value, field }) – prevent it
 * and pass the value back to own it. Try fires a cancelable tc-preview ({ column }) and waits for `preview`; Create
 * fires a cancelable tc-create ({ column }). Both check the column first and say what's missing in words.
 */

/* Icons: Lucide (ISC, lucide.dev) – sparkles, flask-conical, plus, triangle-alert */
const sparkIcon = svg`<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path><path d="M20 3v4"></path><path d="M22 5h-4"></path>`;
const icons = {
  flask: svg`<path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"></path><path d="M8.5 2h7"></path><path d="M7 16h10"></path>`,
  plus: svg`<path d="M5 12h14"></path><path d="M12 5v14"></path>`,
  warn: svg`<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path>`,
};
const glyph = (body: TemplateResult) =>
  html`<svg class="ui-aic__glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export type AiColumnType = "text" | "number" | "boolean" | "choice" | "url" | "json";

/** The column being written */
export type AiColumnValue = {
  name: string;
  type: AiColumnType;
  /** The choices, for type "choice" */
  options: string[];
  /** The prompt, with the table's columns as {{column}} variables */
  prompt: string;
  /** The model's id */
  model: string;
  /** Whether the model may search the web */
  web: boolean;
};

/** A table column the prompt can use */
export type AiColumnSource = { id: string; label: string };
/** A model to pick */
export type AiColumnModel = { id: string; label: string; description?: string };
/** One row of the preview */
export type AiColumnPreviewRow = { id: string; label: string; state?: "running" | "done" | "failed"; value?: string; error?: string };

export type AiColumnField = keyof AiColumnValue;
/** Detail of tc-value-change */
export type AiColumnValueChange = { value: AiColumnValue; field: AiColumnField };
/** Detail of tc-preview and tc-create */
export type AiColumnRequest = { column: AiColumnValue };

export const defaultAiColumnValue: AiColumnValue = { name: "", type: "text", options: [], prompt: "", model: "", web: false };

const TYPES: { id: AiColumnType; label: string }[] = [
  { id: "text", label: "Text" },
  { id: "number", label: "Number" },
  { id: "boolean", label: "Yes / no" },
  { id: "choice", label: "One of a few choices" },
  { id: "url", label: "Link" },
  { id: "json", label: "JSON" },
];

/** The {{variables}} a prompt uses, in order, each once */
export function promptVariables(prompt: string): string[] {
  const out: string[] = [];
  for (const m of prompt.matchAll(/\{\{\s*([\w.-]+)\s*\}\}/g)) if (!out.includes(m[1])) out.push(m[1]);
  return out;
}

/** What's wrong with the column, by field, in words – empty when it can run */
export function aiColumnProblems(value: AiColumnValue, columns: readonly AiColumnSource[]): Partial<Record<AiColumnField, string>> {
  const p: Partial<Record<AiColumnField, string>> = {};
  if (!value.name.trim()) p.name = "Name the column";
  if (!value.prompt.trim()) p.prompt = "Write the prompt";
  else {
    const known = new Set(columns.map((c) => c.id));
    const unknown = promptVariables(value.prompt).filter((v) => !known.has(v));
    if (unknown.length) p.prompt = `The table has no column ${unknown.map((u) => `{{${u}}}`).join(", ")}`;
  }
  if (value.type === "choice" && value.options.filter((o) => o.trim()).length < 2) p.options = "Give at least two choices";
  return p;
}

let instances = 0;

/**
 * One prompt filled in for every row of a table: name, type, a prompt with column variables, model and web access,
 * a three-row preview and Create column.
 * @tag tc-ai-column-create
 * @fires tc-value-change - A field was edited ({ value, field }: AiColumnValueChange); cancelable – prevented, `value` stays as it was
 * @fires tc-preview - Try on 3 rows was pressed with a column that can run ({ column }: AiColumnRequest); cancelable – prevented, `previewing` stays off
 * @fires tc-create - Create column was pressed with a column that can run ({ column }: AiColumnRequest); cancelable – prevented, nothing is announced
 */
export class TcAiColumnCreate extends TcElement {
  static override ui = "aic";

  /** The heading */
  @property() accessor heading = "New AI column";
  /** A line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The column being written. Changed by editing unless a tc-value-change listener calls preventDefault() */
  @property({ attribute: false }) accessor value: AiColumnValue = { ...defaultAiColumnValue };
  /** The table's columns – the prompt's variables */
  @property({ attribute: false }) accessor columns: AiColumnSource[] = [];
  /** The models to pick from; the first is the default */
  @property({ attribute: false }) accessor models: AiColumnModel[] = [];
  /** The preview's rows, from the page after tc-preview (null: none yet) */
  @property({ attribute: false }) accessor preview: AiColumnPreviewRow[] | null = null;
  /** A preview is running – set by Try unless prevented; clear it when `preview` is in */
  @property({ type: Boolean, reflect: true }) accessor previewing = false;
  /** What running the column will take, in words – "2,000 rows · about 3 min · about $1.40" */
  @property() accessor estimate: string | undefined = undefined;
  /** The label of the button that creates the column */
  @property({ attribute: "create-label" }) accessor createLabel = "Create column";

  /** @internal Fields whose problem shows – after leaving them, or after Try or Create */
  @state() accessor shown = new Set<AiColumnField>();
  /** @internal What the status region says */
  @state() accessor said = "";

  private readonly uid = `tc-aic${++instances}`;
  private caret: number | null = null;

  private get model() {
    return this.value.model || this.models[0]?.id || "";
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (changed.has("preview") && this.preview && changed.get("preview") !== undefined) {
      if (this.preview.every((r) => r.state !== "running")) this.previewing = false;
      if (!this.previewing) this.said = `Preview ready – ${this.preview.length === 1 ? "1 row" : `${this.preview.length} rows`}`;
    }
  }

  /* ---------- Changes ---------- */

  private set<K extends AiColumnField>(field: K, v: AiColumnValue[K]) {
    if (this.value[field] === v) return;
    const value = { ...this.value, model: this.model, [field]: v };
    if (this.emit<AiColumnValueChange>("tc-value-change", { value, field }, { cancelable: true })) this.value = value;
  }

  private insertVariable(id: string) {
    const area = this.querySelector<HTMLTextAreaElement>(".ui-aic__prompt");
    const text = this.value.prompt;
    const at = this.caret ?? area?.selectionStart ?? text.length;
    const end = area && area.selectionStart === at ? area.selectionEnd : at;
    const token = `{{${id}}}`;
    const next = text.slice(0, at) + token + text.slice(end);
    this.set("prompt", next);
    const caret = at + token.length;
    this.caret = caret;
    void this.updateComplete.then(() => {
      if (!area) return;
      area.focus();
      area.setSelectionRange(caret, caret);
    });
    this.said = `Inserted ${token}`;
  }

  /** Shows every problem and focuses the first; true when the column can run */
  private check(): boolean {
    const problems = aiColumnProblems(this.value, this.columns);
    const fields = Object.keys(problems) as AiColumnField[];
    if (!fields.length) return true;
    this.shown = new Set([...this.shown, ...fields]);
    this.said = problems[fields[0]]!;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-field="${fields[0]}"]`)?.focus());
    return false;
  }

  private tryPreview() {
    if (this.previewing || !this.check()) return;
    if (!this.emit<AiColumnRequest>("tc-preview", { column: { ...this.value, model: this.model } }, { cancelable: true })) return;
    this.previewing = true;
    this.said = "Trying the prompt on 3 rows";
  }

  private create() {
    if (!this.check()) return;
    if (this.emit<AiColumnRequest>("tc-create", { column: { ...this.value, model: this.model } }, { cancelable: true }))
      this.said = `Creating ${this.value.name.trim()}`;
  }

  private touch(field: AiColumnField) {
    if (!this.shown.has(field)) this.shown = new Set([...this.shown, field]);
  }

  /* ---------- Render ---------- */

  private problem(field: AiColumnField, problems: Partial<Record<AiColumnField, string>>) {
    const text = this.shown.has(field) ? problems[field] : undefined;
    return text ? html`<p class="ui-aic__problem" id=${`${this.uid}-${field}-problem`}>${glyph(icons.warn)}${text}</p>` : nothing;
  }

  private renderVariables() {
    const used = promptVariables(this.value.prompt);
    const known = new Set(this.columns.map((c) => c.id));
    const unknown = used.filter((u) => !known.has(u));
    return html`<div class="ui-aic__vars">
      <span class="ui-aic__vars-label" id=${`${this.uid}-vars`}>Insert a column</span>
      <div class="ui-aic__chips" role="group" aria-labelledby=${`${this.uid}-vars`}>
        ${this.columns.map(
          (c) => html`<button
            type="button"
            class="ui-aic__chip"
            ?data-used=${used.includes(c.id)}
            @mousedown=${() => (this.caret = this.querySelector<HTMLTextAreaElement>(".ui-aic__prompt")?.selectionStart ?? null)}
            @click=${() => this.insertVariable(c.id)}
          >${glyph(icons.plus)}${c.label}<span class="ui-aic__sr"> {{${c.id}}}${used.includes(c.id) ? ", used" : ""}</span></button>`,
        )}
        ${unknown.map((u) => html`<span class="ui-aic__chip" data-unknown>{{${u}}}<span class="ui-aic__sr"> – not a column</span></span>`)}
      </div>
    </div>`;
  }

  private renderPreview() {
    const rows = this.preview;
    if (!rows && !this.previewing) return nothing;
    return html`<section class="ui-aic__preview" aria-labelledby=${`${this.uid}-preview`} aria-busy=${this.previewing ? "true" : "false"}>
      <h4 class="ui-aic__preview-title" id=${`${this.uid}-preview`}>Preview</h4>
      ${rows?.length
        ? html`<ul class="ui-aic__rows">
            ${rows.map(
              (r) => html`<li class="ui-aic__prow" data-state=${r.state ?? "done"}>
                <span class="ui-aic__plabel">${r.label}</span>
                ${r.state === "running"
                  ? html`<span class="ui-aic__shim" aria-hidden="true"></span><span class="ui-aic__sr">Working</span>`
                  : r.state === "failed"
                    ? html`<span class="ui-aic__pfail">${glyph(icons.warn)}${r.error ?? "Failed"}</span>`
                    : html`<span class="ui-aic__pvalue">${r.value ?? ""}</span>`}
              </li>`,
            )}
          </ul>`
        : html`<p class="ui-aic__wait">Trying the prompt on 3 rows…</p>`}
    </section>`;
  }

  protected override render() {
    const clean = this.resolvedLook === "clean";
    const v = this.value;
    const problems = aiColumnProblems(v, this.columns);
    const can = !Object.keys(problems).length;
    const id = (f: string) => `${this.uid}-${f}`;
    const desc = (f: AiColumnField) => (this.shown.has(f) && problems[f] ? `${this.uid}-${f}-problem` : undefined);
    const head = cardHead({ icon: sparkIcon, title: this.heading, subtitle: this.description, id: `${this.uid}-title` });
    const body = html`<div class="ui-aic__body">
      <div class="ui-aic__row2">
        <div class="ui-aic__field">
          <label class="ui-aic__label" for=${id("name")}>Column name</label>
          <input
            id=${id("name")}
            class="ui-aic__input"
            data-field="name"
            .value=${live(v.name)}
            placeholder="Industry"
            aria-invalid=${desc("name") ? "true" : "false"}
            aria-describedby=${ifDefined(desc("name"))}
            @input=${(e: Event) => this.set("name", (e.target as HTMLInputElement).value)}
            @blur=${() => this.touch("name")}
          />
          ${this.problem("name", problems)}
        </div>
        <div class="ui-aic__field">
          <label class="ui-aic__label" for=${id("type")}>Holds</label>
          <select id=${id("type")} class="ui-aic__input" data-field="type" .value=${live(v.type)} @change=${(e: Event) => this.set("type", (e.target as HTMLSelectElement).value as AiColumnType)}>
            ${TYPES.map((t) => html`<option value=${t.id} ?selected=${t.id === v.type}>${t.label}</option>`)}
          </select>
        </div>
      </div>
      ${v.type === "choice"
        ? html`<div class="ui-aic__field">
            <label class="ui-aic__label" for=${id("options")}>Choices, separated by commas</label>
            <input
              id=${id("options")}
              class="ui-aic__input"
              data-field="options"
              .value=${live(v.options.join(", "))}
              placeholder="Software, Hardware, Services"
              aria-invalid=${desc("options") ? "true" : "false"}
              aria-describedby=${ifDefined(desc("options"))}
              @change=${(e: Event) =>
                this.set(
                  "options",
                  (e.target as HTMLInputElement).value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                )}
              @blur=${() => this.touch("options")}
            />
            ${this.problem("options", problems)}
          </div>`
        : nothing}
      <div class="ui-aic__field">
        <label class="ui-aic__label" for=${id("prompt")}>Prompt</label>
        <textarea
          id=${id("prompt")}
          class="ui-aic__input ui-aic__prompt"
          data-field="prompt"
          rows="4"
          .value=${live(v.prompt)}
          placeholder="What industry is {{vendor}} in? Answer with one or two words."
          aria-invalid=${desc("prompt") ? "true" : "false"}
          aria-describedby=${[id("prompt-help"), desc("prompt")].filter(Boolean).join(" ")}
          @input=${(e: Event) => {
            const area = e.target as HTMLTextAreaElement;
            this.caret = area.selectionStart;
            this.set("prompt", area.value);
          }}
          @blur=${() => this.touch("prompt")}
        ></textarea>
        <span class="ui-aic__help" id=${id("prompt-help")}>Write {{column}} where a row's value goes – the same prompt runs on every row.</span>
        ${this.problem("prompt", problems)}
        ${this.columns.length ? this.renderVariables() : nothing}
      </div>
      <div class="ui-aic__row2">
        <div class="ui-aic__field">
          <label class="ui-aic__label" for=${id("model")}>Model</label>
          <select id=${id("model")} class="ui-aic__input" data-field="model" .value=${live(this.model)} @change=${(e: Event) => this.set("model", (e.target as HTMLSelectElement).value)}>
            ${this.models.map((m) => html`<option value=${m.id} ?selected=${m.id === this.model}>${m.label}${m.description ? ` – ${m.description}` : ""}</option>`)}
          </select>
        </div>
        <label class="ui-aic__switch">
          <input type="checkbox" role="switch" data-field="web" .checked=${live(v.web)} @change=${(e: Event) => this.set("web", (e.target as HTMLInputElement).checked)} />
          <span class="ui-aic__track" aria-hidden="true"></span>
          <span>Search the web</span>
        </label>
      </div>
      ${this.renderPreview()}
    </div>`;
    const reason = can ? undefined : `${this.uid}-blocked`;
    const foot = html`<div class="ui-aic__foot">
      ${this.estimate ? html`<p class="ui-aic__estimate">${this.estimate}</p>` : html`<span></span>`}
      <div class="ui-aic__actions">
        <button
          type="button"
          class="ui-aic__btn ui-aic__try"
          aria-disabled=${ifDefined(!can || this.previewing ? "true" : undefined)}
          aria-describedby=${ifDefined(reason)}
          @click=${this.tryPreview}
        >${glyph(icons.flask)}Try on 3 rows</button>
        <button type="button" class="ui-aic__btn ui-aic__create" aria-disabled=${ifDefined(!can ? "true" : undefined)} aria-describedby=${ifDefined(reason)} @click=${this.create}>
          ${this.createLabel}
        </button>
        ${reason ? html`<span class="ui-aic__sr" id=${reason}>${Object.values(problems).join(". ")}</span>` : nothing}
      </div>
    </div>`;
    return html`${clean ? html`<div class="ui-aic__card">${head}${body}${foot}</div>` : html`${head}<div class="ui-aic__card">${body}</div>${foot}`}
      <span class="ui-aic__sr" role="status">${this.said}</span>`;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card; the estimate and actions on the tray below */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="aic"] {
  --tc-aic-track-w: 32px;
  --tc-aic-track-h: 18px;
  --tc-aic-knob: 14px;
  box-sizing: border-box;
  container-type: inline-size;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  width: 100%;
  max-width: 620px;
  min-width: 0;
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
/* Clean: one white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="aic"] {
  --tc-aic-track-w: 32px;
  --tc-aic-track-h: 18px;
  --tc-aic-knob: 14px;
  box-sizing: border-box;
  container-type: inline-size;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  width: 100%;
  max-width: 600px;
  min-width: 0;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="aic"] *, [data-ui="aic"] *::before, [data-ui="aic"] *::after { box-sizing: border-box; }
:where([data-ui="aic"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="aic"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-aic__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-aic__glyph { display: block; flex: none; width: 14px; height: 14px; }
:where([data-look="standard"], [data-look="standard"] *).ui-aic__card { min-width: 0; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-aic__card { min-width: 0; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-aic__card > .tc-head + * { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-aic__body { display: grid; gap: var(--tc-space-4); padding: var(--tc-space-4); }
.ui-aic__row2 { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); align-items: end; gap: var(--tc-space-3); }
.ui-aic__field { display: grid; gap: var(--tc-space-1-5); min-width: 0; }
.ui-aic__label { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-aic__input { width: 100%; min-width: 0; min-height: var(--tc-control-h-md); margin: 0; padding: 0 var(--tc-space-2-5); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font: inherit; color: var(--tc-text-primary); outline: none; }
.ui-aic__input:focus-visible { box-shadow: var(--tc-field-shadow-focus); }
.ui-aic__input[aria-invalid="true"] { box-shadow: var(--tc-field-shadow-invalid); }
.ui-aic__input::placeholder { color: var(--tc-text-placeholder); }
.ui-aic__prompt { padding: var(--tc-space-2) var(--tc-space-2-5); resize: vertical; font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); }
.ui-aic__help { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
.ui-aic__problem { display: flex; align-items: center; gap: var(--tc-space-1); margin: 0; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-status-danger-fg); }
/* Variables: chips that insert {{column}} at the caret */
.ui-aic__vars { display: grid; gap: var(--tc-space-1); }
.ui-aic__vars-label { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-aic__chips { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); }
.ui-aic__chip { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2); border-radius: var(--tc-pill-radius); background: var(--tc-fill-subtle); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-subtle); font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); }
.ui-aic__chip .ui-aic__glyph { width: 12px; height: 12px; color: var(--tc-text-muted); }
.ui-aic__chip:hover { background: var(--tc-fill-default); }
.ui-aic__chip[data-used] { background: var(--tc-accent-subtle); color: var(--tc-accent-text); box-shadow: none; }
.ui-aic__chip[data-unknown] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); box-shadow: none; font-family: var(--tc-font-mono); }
/* The web switch: a native checkbox drawn as a track */
.ui-aic__switch { position: relative; display: inline-flex; align-items: center; gap: var(--tc-space-2); min-height: var(--tc-control-h-md); font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); cursor: pointer; }
.ui-aic__switch input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; }
.ui-aic__track { position: relative; flex: none; width: var(--tc-aic-track-w); height: var(--tc-aic-track-h); border-radius: var(--tc-radius-full); background: var(--tc-fill-strong); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-aic__track::after { content: ""; position: absolute; top: calc((var(--tc-aic-track-h) - var(--tc-aic-knob)) / 2); left: calc((var(--tc-aic-track-h) - var(--tc-aic-knob)) / 2); width: var(--tc-aic-knob); height: var(--tc-aic-knob); border-radius: var(--tc-radius-full); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-control); transition: transform var(--tc-duration-fast) var(--tc-ease-move); }
.ui-aic__switch input:checked + .ui-aic__track { background: var(--tc-accent); }
.ui-aic__switch input:checked + .ui-aic__track::after { transform: translateX(calc(var(--tc-aic-track-w) - var(--tc-aic-track-h))); }
.ui-aic__switch input:focus-visible + .ui-aic__track { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
/* The preview: three rows and their answers */
.ui-aic__preview { display: grid; gap: var(--tc-space-1-5); padding: var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-surface-sunken); }
.ui-aic__preview-title { margin: 0; font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-aic__rows { display: grid; gap: var(--tc-space-1); margin: 0; padding: 0; list-style: none; }
.ui-aic__prow { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 3fr); align-items: center; gap: var(--tc-space-2); min-height: var(--tc-control-h-sm); font-size: var(--tc-font-size-sm); }
.ui-aic__plabel { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--tc-text-muted); }
.ui-aic__pvalue { min-width: 0; color: var(--tc-text-primary); overflow-wrap: anywhere; }
.ui-aic__pfail { display: inline-flex; align-items: center; gap: var(--tc-space-1); color: var(--tc-status-danger-fg); }
.ui-aic__wait { margin: 0; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-aic__shim { position: relative; height: var(--tc-space-2); overflow: hidden; border-radius: var(--tc-radius-xs); background: var(--tc-fill-default); }
.ui-aic__shim::after { content: ""; position: absolute; inset: 0; background: var(--tc-shimmer); transform: translateX(-100%); animation: ui-aic-shimmer var(--tc-duration-shimmer) linear infinite; }
/* The estimate and actions: on the tray (Standard), the card's last row (Clean) */
.ui-aic__foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-2) var(--tc-space-1); }
:where([data-look="clean"], [data-look="clean"] *).ui-aic__foot { padding: var(--tc-space-3) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-aic__estimate { margin: 0; font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; color: var(--tc-text-muted); }
.ui-aic__actions { display: flex; gap: var(--tc-space-2); margin-left: auto; }
.ui-aic__btn { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-aic__try { background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); }
.ui-aic__try:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-aic__create { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-aic__create:hover { background: var(--tc-action-primary-bg-hover); }
.ui-aic__btn[aria-disabled="true"] { background: var(--tc-fill-strong); box-shadow: none; color: var(--tc-text-muted); cursor: default; }
@keyframes ui-aic-shimmer { to { transform: translateX(100%); } }
@container (max-width: 460px) {
  .ui-aic__row2 { grid-template-columns: minmax(0, 1fr); }
  .ui-aic__prow { grid-template-columns: minmax(0, 1fr); gap: 0; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="aic"] *, [data-ui="aic"] *::before, [data-ui="aic"] *::after { animation: none !important; transition: none !important; }
}
@media (forced-colors: active) {
  .ui-aic__track { border: 1px solid CanvasText; }
  .ui-aic__switch input:checked + .ui-aic__track { background: Highlight; }
}
`;
}

if (!customElements.get("tc-ai-column-create")) customElements.define("tc-ai-column-create", TcAiColumnCreate);

declare global {
  interface HTMLElementTagNameMap {
    "tc-ai-column-create": TcAiColumnCreate;
  }
}
