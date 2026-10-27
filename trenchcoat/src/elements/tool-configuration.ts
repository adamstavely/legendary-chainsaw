import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import "./code-block";

/*
 * <tc-tool-configuration> – a tool an agent can call, as its API reference entry. The tool's name is the title and
 * the approval a call needs is a compact picker beside it; the lead block is the signature and the description the
 * model reads; the parameters are a doc table – name, type, required, what goes in it and the values allowed – each
 * row edited in place; and an Example call shows the arguments the model would send, as JSON. 640 px and wider the
 * example sits beside the reference. The JSON Schema the parameters produce opens on request, and a strip at the
 * foot lists what's wrong (problems make the form invalid) and what would make it better.
 *   · keyboard: the table is a table – Tab reaches each row's Edit button; Enter opens the row's cells as fields and
 *     focuses its name, Escape or Done closes them and returns to Edit. Alt+↑ / Alt+↓ anywhere in a row moves it.
 *     Add parameter appends a row and opens it; Remove focuses the next row's Edit (or Add parameter)
 *   · allowed values are chips: Enter or a comma adds what's typed, Backspace in the empty field takes the last off
 *   · each problem in the strip is a button that opens and focuses the field it's about
 *   · approval says what the tool itself needs. Who may call it belongs in tool-permissions, and review rules in
 *     gate-config
 * Standard puts the head on the gray tray above a white card: a tinted column-header band and a sunken example well.
 * Clean is one white card – the head as its first row, hairlines between rows and beside the example, thinner icons.
 *
 *   <tc-tool-configuration .value=${{ name: "search_orders", description: "…", parameters: [...], approval: "auto" }}></tc-tool-configuration>
 *
 * The definition is one value: every change fires a cancelable `tc-value-change` ({ value }) – call preventDefault() to
 * control `value` yourself. With `name` it's a form control: the form gets the definition as JSON, and it's invalid
 * while the strip lists a problem. toolInputSchema(), toolExampleCall() and validateTool() are exported for the app.
 */

export type ToolParameterType = "string" | "number" | "integer" | "boolean" | "array" | "object";
export type ToolParameter = {
  name: string;
  type: ToolParameterType;
  required: boolean;
  /** What the model should put in it */
  description: string;
  /** The values allowed, for string, number and integer parameters */
  enum?: string[];
};
export type ToolConfigurationValue = {
  /** The name the model calls it by */
  name: string;
  /** What it does and when to use it – the model reads this */
  description: string;
  parameters: ToolParameter[];
  /** The id of the approval it needs */
  approval: string;
};
/** What a call needs before it runs */
export type ToolApprovalOption = { id: string; label: string; description?: string };
/** A problem (makes the definition invalid) or a suggestion */
export type ToolIssue = {
  level: "error" | "warning";
  /** "name", "description", or "param:<index>:<name|description|enum>" */
  field: string;
  message: string;
};
export type ToolConfigurationValueChange = { value: ToolConfigurationValue };

export const TOOL_PARAMETER_TYPES: { id: ToolParameterType; label: string }[] = [
  { id: "string", label: "Text" },
  { id: "number", label: "Number" },
  { id: "integer", label: "Integer" },
  { id: "boolean", label: "Yes / no" },
  { id: "array", label: "List" },
  { id: "object", label: "Object" },
];
export const TOOL_APPROVALS: ToolApprovalOption[] = [
  { id: "inherit", label: "Follows tool permissions", description: "Each agent's access is set where tool permissions are managed" },
  { id: "ask", label: "Ask every time", description: "A person approves each call before it runs" },
  { id: "auto", label: "Runs on its own", description: "For tools that only read – lookups and searches" },
];
const DEFAULT_VALUE: ToolConfigurationValue = { name: "", description: "", parameters: [], approval: "inherit" };
const NAME = /^[A-Za-z_][A-Za-z0-9_-]*$/;
const ENUM_TYPES = new Set<ToolParameterType>(["string", "number", "integer"]);
const isNumeric = (t: ToolParameterType) => t === "number" || t === "integer";

/** The JSON Schema for a tool's input: an object with one property per parameter */
export function toolInputSchema(value: ToolConfigurationValue): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  for (const p of value.parameters) {
    if (!p.name.trim()) continue;
    const values = ENUM_TYPES.has(p.type) && p.enum?.length ? (isNumeric(p.type) ? p.enum.map(Number).filter((n) => Number.isFinite(n)) : p.enum) : undefined;
    properties[p.name.trim()] = { type: p.type, ...(p.description.trim() ? { description: p.description.trim() } : {}), ...(values?.length ? { enum: values } : {}) };
  }
  const required = value.parameters.filter((p) => p.required && p.name.trim()).map((p) => p.name.trim());
  return { type: "object", properties, ...(required.length ? { required } : {}), additionalProperties: false };
}

/** Arguments a call could carry: the first allowed value, else a placeholder of the right type ("<name>", 1, 1.5, true, [], {}) */
export function toolExampleCall(value: ToolConfigurationValue): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const p of value.parameters) {
    const n = p.name.trim();
    if (!n || Object.hasOwn(out, n)) continue;
    const first = ENUM_TYPES.has(p.type) ? p.enum?.[0] : undefined;
    if (first !== undefined) out[n] = isNumeric(p.type) && Number.isFinite(Number(first)) ? Number(first) : first;
    else out[n] = p.type === "string" ? `<${n}>` : p.type === "integer" ? 1 : p.type === "number" ? 1.5 : p.type === "boolean" ? true : p.type === "array" ? [] : {};
  }
  return out;
}

/** What's wrong with a definition (errors) and what would make it better (warnings) */
export function validateTool(value: ToolConfigurationValue): ToolIssue[] {
  const issues: ToolIssue[] = [];
  const name = value.name.trim();
  if (!name) issues.push({ level: "error", field: "name", message: "Name the tool." });
  else if (!NAME.test(name)) issues.push({ level: "error", field: "name", message: "Use only letters, digits, _ and - in the name, starting with a letter." });
  else if (name.length > 64) issues.push({ level: "error", field: "name", message: "Keep the name to 64 characters." });
  if (!value.description.trim()) issues.push({ level: "warning", field: "description", message: "Describe what it does – the model reads this to decide when to call it." });
  const seen = new Map<string, number>();
  value.parameters.forEach((p, i) => {
    const n = p.name.trim();
    const label = n || `Parameter ${i + 1}`;
    if (!n) issues.push({ level: "error", field: `param:${i}:name`, message: `Parameter ${i + 1} has no name.` });
    else if (!NAME.test(n)) issues.push({ level: "error", field: `param:${i}:name`, message: `“${n}”: use only letters, digits, _ and -.` });
    else if (seen.has(n)) issues.push({ level: "error", field: `param:${i}:name`, message: `Two parameters are called “${n}”.` });
    if (n) seen.set(n, i);
    if (isNumeric(p.type) && p.enum?.length) {
      const bad = p.enum.find((x) => !Number.isFinite(Number(x)) || (p.type === "integer" && !Number.isInteger(Number(x))));
      if (bad !== undefined) issues.push({ level: "error", field: `param:${i}:enum`, message: `${label}: “${bad}” isn't ${p.type === "integer" ? "a whole number" : "a number"}.` });
    }
    if (n && !p.description.trim()) issues.push({ level: "warning", field: `param:${i}:description`, message: `Describe ${n} so the model fills it in well.` });
  });
  return issues;
}

let instances = 0;

/* Wrench, plus, x, arrow-up, arrow-down, trash-2, circle-check, circle-alert, pencil, chevron-right, shield, check: Lucide (ISC, lucide.dev) */
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const WRENCH = svg`<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>`;
const plusIcon = () => lucide(14, svg`<path d="M5 12h14"></path><path d="M12 5v14"></path>`);
const xIcon = () => lucide(12, svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`);
const upIcon = () => lucide(14, svg`<path d="m5 12 7-7 7 7"></path><path d="M12 19V5"></path>`);
const downIcon = () => lucide(14, svg`<path d="M12 5v14"></path><path d="m19 12-7 7-7-7"></path>`);
const trashIcon = () => lucide(14, svg`<path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>`);
const okIcon = () => lucide(14, svg`<circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path>`);
const alertIcon = () => lucide(14, svg`<circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="12"></line><line x1="12" x2="12.01" y1="16" y2="16"></line>`);
const pencilIcon = () => lucide(14, svg`<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"></path><path d="m15 5 4 4"></path>`);
const chevronRight = () => lucide(14, svg`<path d="m9 18 6-6-6-6"></path>`);
const shieldIcon = () => lucide(14, svg`<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>`);
const chevronDown = html`<svg class="ui-tdef__chevron" viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M4.5 6.25 8 9.75l3.5-3.5"></path>`}</svg>`;

/** One line of the example call: a key and its value, as JSON tokens */
const jsonValue = (v: unknown) =>
  typeof v === "string"
    ? html`<span class="ui-tdef__j-str">${JSON.stringify(v)}</span>`
    : typeof v === "number"
      ? html`<span class="ui-tdef__j-num">${v}</span>`
      : typeof v === "boolean" || v === null
        ? html`<span class="ui-tdef__j-kw">${String(v)}</span>`
        : html`<span class="ui-tdef__j-punct">${JSON.stringify(v)}</span>`;

/**
 * A tool as its API reference entry: the name as the title, the signature and description, a doc table of the
 * parameters edited in place, an example call, the JSON Schema on request, a validation strip and the approval a
 * call needs.
 * @tag tc-tool-configuration
 * @fires tc-value-change - The definition changed ({ value: ToolConfigurationValue }); cancelable – prevent it to control `value`
 */
export class TcToolConfiguration extends TcElement {
  static override ui = "tdef";
  static formAssociated = true;

  /** The definition. Changed by the user unless a tc-value-change listener calls preventDefault() */
  @property({ attribute: false }) accessor value: ToolConfigurationValue = DEFAULT_VALUE;
  /** The approvals offered in the head's picker; empty hides it */
  @property({ attribute: false }) accessor approvals: ToolApprovalOption[] = TOOL_APPROVALS;
  /** The parameter types offered, with their labels */
  @property({ attribute: false }) accessor types: { id: ToolParameterType; label: string }[] = TOOL_PARAMETER_TYPES;
  /** The arguments Example call shows; unset, they're made from the parameters (toolExampleCall) */
  @property({ attribute: false }) accessor example: Record<string, unknown> | undefined = undefined;
  /** The title while the tool has no name; the tool's name replaces it */
  @property() accessor heading = "New tool";
  /** A quieter line under the title */
  @property() accessor description = "";
  /** Shows the JSON Schema disclosure */
  @property({ type: Boolean, attribute: "show-schema" }) accessor showSchema = true;
  /** Shows the Example call panel */
  @property({ type: Boolean, attribute: "show-example" }) accessor showExample = true;
  /** Submitted with the form: the definition as JSON */
  @property({ reflect: true }) accessor name = "";
  /** Turns every control off and leaves the definition out of the form; a disabled fieldset does the same */
  @property({ type: Boolean, reflect: true }) accessor disabled = false;

  @state() private accessor formDisabled = false;
  @state() private accessor announcement = "";
  /** Text typed into each row's allowed-values field, not yet a chip */
  @state() private accessor typing = new Map<number, string>();
  /** What is open for editing: a parameter's index, "head" for the name and description, or nothing */
  @state() private accessor editing: number | "head" | null = null;
  @state() private accessor schemaOpen = false;
  /** The parameter under the pointer or focus, lit in the example */
  @state() private accessor hot = -1;

  private readonly internals: ElementInternals;
  private readonly uid = `tc-tdef${++instances}`;
  private initialValue: ToolConfigurationValue | null = null;

  constructor() {
    super();
    this.internals = this.attachInternals();
  }

  override connectedCallback() {
    super.connectedCallback();
    this.initialValue ??= this.value;
    if (!this.hasAttribute("role")) this.setAttribute("role", "group");
  }

  formResetCallback() {
    this.typing = new Map();
    this.value = this.initialValue ?? DEFAULT_VALUE;
  }
  formDisabledCallback(disabled: boolean) {
    queueMicrotask(() => (this.formDisabled = disabled));
  }

  private get isDisabled() {
    return this.disabled || this.formDisabled;
  }
  /** What's wrong or missing, as the strip lists it */
  get issues(): ToolIssue[] {
    return validateTool(this.value);
  }
  /** The JSON Schema the parameters produce */
  get schema(): Record<string, unknown> {
    return toolInputSchema(this.value);
  }
  /** The arguments Example call shows: `example`, or ones made from the parameters */
  get exampleCall(): Record<string, unknown> {
    return this.example ?? toolExampleCall(this.value);
  }

  private commit(patch: Partial<ToolConfigurationValue>) {
    const next: ToolConfigurationValue = { ...this.value, ...patch };
    if (this.emit<ToolConfigurationValueChange>("tc-value-change", { value: next }, { cancelable: true })) {
      this.value = next;
      return true;
    }
    this.requestUpdate();
    return false;
  }
  private patchParam(i: number, patch: Partial<ToolParameter>) {
    return this.commit({ parameters: this.value.parameters.map((p, j) => (j === i ? { ...p, ...patch } : p)) });
  }
  private focusLater(selector: string) {
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(selector)?.focus());
  }

  private addParam() {
    const i = this.value.parameters.length;
    if (this.commit({ parameters: [...this.value.parameters, { name: "", type: "string", required: false, description: "" }] })) {
      this.editing = i;
      this.announcement = `Parameter ${i + 1} added.`;
      this.focusLater(`[data-field="param:${i}:name"]`);
    }
  }
  private removeParam(i: number) {
    const p = this.value.parameters[i];
    if (!this.commit({ parameters: this.value.parameters.filter((_, j) => j !== i) })) return;
    this.typing = new Map([...this.typing].filter(([k]) => k !== i).map(([k, v]) => [k > i ? k - 1 : k, v]));
    this.announcement = `${p.name.trim() || `Parameter ${i + 1}`} removed.`;
    const left = this.value.parameters.length;
    if (this.editing === i) this.editing = null;
    else if (typeof this.editing === "number" && this.editing > i) this.editing--;
    this.hot = -1;
    this.focusLater(left ? `[data-edit="${Math.min(i, left - 1)}"]` : ".ui-tdef__add");
  }
  private moveParam(i: number, by: -1 | 1, focus: string) {
    const j = i + by;
    const list = [...this.value.parameters];
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    if (!this.commit({ parameters: list })) return;
    const typing = new Map(this.typing);
    const a = typing.get(i);
    const b = typing.get(j);
    typing.delete(i);
    typing.delete(j);
    if (a !== undefined) typing.set(j, a);
    if (b !== undefined) typing.set(i, b);
    if (this.editing === i) this.editing = j;
    else if (this.editing === j) this.editing = i;
    this.typing = typing;
    this.hot = j;
    this.announcement = `${list[j].name.trim() || "Parameter"} moved to position ${j + 1} of ${list.length}.`;
    // Focus follows the row; a move button that can't go further hands focus to its twin
    void this.updateComplete.then(() => {
      const row = this.querySelectorAll<HTMLElement>(".ui-tdef__param")[j];
      const target = row?.querySelector<HTMLElement>(focus);
      (target && !(target as HTMLButtonElement).disabled ? target : row?.querySelector<HTMLElement>(".ui-tdef__move:not(:disabled)"))?.focus();
    });
  }
  private onRowKey(e: KeyboardEvent, i: number) {
    if (!e.altKey || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
    e.preventDefault();
    const el = e.target as HTMLElement;
    const field = el.dataset.field?.split(":")[2];
    this.moveParam(i, e.key === "ArrowUp" ? -1 : 1, field ? `[data-field$=":${field}"]` : el.classList.contains("ui-tdef__move") ? `.ui-tdef__move[data-dir="${el.dataset.dir}"]` : `.${[...el.classList].find((c) => c.startsWith("ui-tdef__")) ?? "ui-tdef__move"}`);
  }

  /* ---------- Allowed values ---------- */

  private addValues(i: number, raw: string) {
    const p = this.value.parameters[i];
    if (!p) return;
    const add = raw
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s && !(p.enum ?? []).includes(s));
    const typing = new Map(this.typing);
    typing.delete(i);
    this.typing = typing;
    if (!add.length) return;
    if (this.patchParam(i, { enum: [...new Set([...(p.enum ?? []), ...add])] })) this.announcement = `Allowed: ${add.join(", ")}.`;
  }
  private removeValue(i: number, v: string, refocus: boolean) {
    const p = this.value.parameters[i];
    if (!this.patchParam(i, { enum: (p.enum ?? []).filter((x) => x !== v) })) return;
    this.announcement = `${v} removed.`;
    if (refocus) this.focusLater(`[data-field="param:${i}:enum"]`);
  }
  private onValuesKey(e: KeyboardEvent, i: number) {
    const input = e.target as HTMLInputElement;
    if ((e.key === "Enter" || e.key === ",") && !e.isComposing) {
      e.preventDefault();
      this.addValues(i, input.value);
    } else if (e.key === "Backspace" && !input.value) {
      const last = this.value.parameters[i].enum?.at(-1);
      if (last !== undefined) {
        e.preventDefault();
        this.removeValue(i, last, false);
      }
    }
  }

  /* ---------- Updates ---------- */

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    this.toggleAttribute("data-disabled", this.isDisabled);
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (!this.hasAttribute("aria-label") && !this.hasAttribute("aria-labelledby")) this.setAttribute("aria-labelledby", `${this.uid}-title`);
    if (typeof this.internals.setFormValue !== "function") return;
    const disabled = this.isDisabled;
    this.internals.setFormValue(this.name && !disabled ? JSON.stringify(this.value) : null);
    const error = disabled ? undefined : this.issues.find((x) => x.level === "error");
    if (error) this.internals.setValidity({ customError: true }, error.message, this.querySelector<HTMLElement>(`[data-field="${error.field}"]`) ?? this.querySelector<HTMLElement>(".ui-tdef__issue") ?? undefined);
    else this.internals.setValidity({});
  }

  /* ---------- Editing in place ---------- */

  /** Opens a parameter (or "head": the name and description) for editing and focuses a field in it */
  private edit(what: number | "head", field?: string) {
    if (this.isDisabled) return;
    this.editing = what;
    this.focusLater(field ? `[data-field="${field}"]` : what === "head" ? '[data-field="name"]' : `[data-field="param:${what}:name"]`);
  }
  private doneEditing() {
    const was = this.editing;
    this.editing = null;
    this.focusLater(was === "head" ? ".ui-tdef__edit-head" : `[data-edit="${was}"]`);
  }
  private get headOpen() {
    return this.editing === "head" || !this.value.name.trim();
  }
  /** Goes to the field an issue is about, opening what holds it */
  private goTo(field: string) {
    const m = /^param:(\d+):/.exec(field);
    this.edit(m ? Number(m[1]) : "head", field);
  }
  private onEditorKey = (e: KeyboardEvent) => {
    if (e.key !== "Escape" || e.defaultPrevented || this.editing === null) return;
    if (this.editing === "head" && !this.value.name.trim()) return;
    e.preventDefault();
    this.doneEditing();
  };

  /* ---------- Rendering ---------- */

  /** The type as the full signature reads it: the allowed values when there are some */
  private typeText(p: ToolParameter) {
    if (ENUM_TYPES.has(p.type) && p.enum?.length) return p.enum.map((v) => (p.type === "string" ? `"${v}"` : v)).join(" | ");
    return p.type;
  }
  /** The tool as the model sees it: name(param: type, optional?: type) */
  get signature(): string {
    const v = this.value;
    return `${v.name.trim() || "unnamed"}(${v.parameters.map((p) => `${p.name.trim() || "unnamed"}${p.required ? "" : "?"}: ${this.typeText(p)}`).join(", ")})`;
  }

  private renderApproval() {
    if (!this.approvals.length) return nothing;
    const v = this.value;
    const current = this.approvals.find((a) => a.id === v.approval);
    return html`<span class="ui-tdef__approval" ?data-off=${this.isDisabled} title=${current?.description ?? ""}>
      ${shieldIcon()}
      <select class="ui-tdef__approval-select" aria-label="Before it runs" aria-describedby=${`${this.uid}-appr`} ?disabled=${this.isDisabled} @change=${(e: Event) => this.commit({ approval: (e.target as HTMLSelectElement).value })}>
        ${current ? nothing : html`<option value=${v.approval} .selected=${live(true)} disabled>Choose…</option>`}
        ${this.approvals.map((a) => html`<option value=${a.id} .selected=${live(a.id === v.approval)}>${a.label}</option>`)}
      </select>${chevronDown}
      <span class="ui-tdef__sr" id=${`${this.uid}-appr`}>${current?.description ?? ""}</span>
    </span>`;
  }

  private renderLead(errors: Map<string, string>) {
    const v = this.value;
    const id = this.uid;
    const off = this.isDisabled;
    const params = v.parameters;
    const open = this.headOpen;
    const nameError = errors.get("name");
    return html`<div class="ui-tdef__lead" ?data-editing=${open}>
      <div class="ui-tdef__sig-top">
        <p class="ui-tdef__code">
          <span class="ui-tdef__sr">Signature: ${this.signature}</span>
          <span aria-hidden="true"
            ><span class="ui-tdef__tok-fn" ?data-empty=${!v.name.trim()} @click=${() => this.edit("head")}>${v.name.trim() || "unnamed"}</span
            ><span class="ui-tdef__tok-punct">(</span
            >${params.map(
              (p, i) =>
                html`<span class="ui-tdef__tok-param" ?data-error=${[...errors.keys()].some((k) => k.startsWith(`param:${i}:`))} ?data-hot=${this.hot === i} @click=${() => this.edit(i)}
                  ><span class="ui-tdef__tok-name">${p.name.trim() || "unnamed"}</span
                  ><span class="ui-tdef__tok-punct">${p.required ? "" : "?"}: </span
                  ><span class="ui-tdef__tok-type">${p.type}</span></span
                >${i < params.length - 1 ? html`<span class="ui-tdef__tok-punct">, </span>` : nothing}`,
            )}<span class="ui-tdef__tok-punct">)</span></span
          >
        </p>
        <button type="button" class="ui-tdef__btn ui-tdef__btn--ghost ui-tdef__edit-head" aria-expanded=${open ? "true" : "false"} aria-controls=${`${id}-head`} ?disabled=${off} @click=${() => (this.editing === "head" ? this.doneEditing() : this.edit("head"))}>
          ${this.editing === "head" ? "Done" : html`${pencilIcon()}Edit<span class="ui-tdef__sr"> name and description</span>`}
        </button>
      </div>
      ${v.description.trim() ? html`<p class="ui-tdef__sig-desc">${v.description}</p>` : html`<p class="ui-tdef__sig-desc" data-empty>No description yet – the model won't know when to call it.</p>`}
      ${nameError && !open ? html`<p class="ui-tdef__read-error">${alertIcon()}${nameError}</p>` : nothing}
      <div class="ui-tdef__head-edit" id=${`${id}-head`} ?hidden=${!open} @keydown=${this.onEditorKey}>
        ${open
          ? html`<div class="ui-tdef__row">
                <label class="ui-tdef__label" for=${`${id}-name`}>Name</label>
                <input id=${`${id}-name`} class="ui-tdef__input ui-tdef__mono" data-field="name" placeholder="search_orders" spellcheck="false" autocomplete="off" .value=${live(v.name)} aria-invalid=${nameError ? "true" : "false"} aria-describedby=${`${id}-name-err`} ?disabled=${off} @input=${(e: Event) => {
                  this.editing = "head";
                  this.commit({ name: (e.target as HTMLInputElement).value });
                }} />
                <span class="ui-tdef__field-error" id=${`${id}-name-err`}>${nameError ?? ""}</span>
              </div>
              <div class="ui-tdef__row">
                <label class="ui-tdef__label" for=${`${id}-desc`}>Description</label>
                <textarea id=${`${id}-desc`} class="ui-tdef__input ui-tdef__note" data-field="description" rows="2" placeholder="What it does, and when the model should use it" .value=${live(v.description)} ?disabled=${off} @input=${(e: Event) => {
                  this.editing = "head";
                  this.commit({ description: (e.target as HTMLTextAreaElement).value });
                }}></textarea>
              </div>`
          : nothing}
      </div>
    </div>`;
  }

  private rowEvents(i: number) {
    return {
      enter: () => (this.hot = i),
      leave: () => this.hot === i && (this.hot = -1),
    };
  }

  private renderParamRead(p: ToolParameter, i: number, count: number, errors: Map<string, string>) {
    const label = p.name.trim() || `Parameter ${i + 1}`;
    const problems = [...errors].filter(([k]) => k.startsWith(`param:${i}:`)).map(([, m]) => m);
    const typeLabel = this.types.find((t) => t.id === p.type)?.label ?? p.type;
    const values = ENUM_TYPES.has(p.type) && p.enum?.length ? p.enum : null;
    const ev = this.rowEvents(i);
    return html`<div class="ui-tdef__param" role="row" data-mode="read" ?data-error=${problems.length > 0} ?data-hot=${this.hot === i} aria-label=${`Parameter ${i + 1} of ${count}: ${label}`} @keydown=${(e: KeyboardEvent) => this.onRowKey(e, i)} @pointerenter=${ev.enter} @pointerleave=${ev.leave} @focusin=${ev.enter} @focusout=${ev.leave}>
      <div class="ui-tdef__cell ui-tdef__c-name" role="cell" @click=${() => this.edit(i)}>
        <code class="ui-tdef__read-name" ?data-empty=${!p.name.trim()}>${p.name.trim() || "unnamed"}</code>
        ${p.required ? html`<span class="ui-tdef__read-req">required</span>` : html`<span class="ui-tdef__sr">optional</span>`}
      </div>
      <div class="ui-tdef__cell ui-tdef__c-type" role="cell" @click=${() => this.edit(i)}><span class="ui-tdef__read-type" title=${typeLabel}>${p.type}</span>${values ? html`<span class="ui-tdef__read-enum">enum</span>` : nothing}</div>
      <div class="ui-tdef__cell ui-tdef__c-desc" role="cell" @click=${() => this.edit(i)}>
        ${p.description.trim() ? html`<span class="ui-tdef__read-desc">${p.description}</span>` : html`<span class="ui-tdef__read-desc" data-empty>No description</span>`}
        ${values ? html`<span class="ui-tdef__read-values"><span class="ui-tdef__values-lead">One of</span>${values.map((x) => html`<code class="ui-tdef__val">${p.type === "string" ? `"${x}"` : x}</code>`)}</span>` : nothing}
        ${problems.map((m) => html`<span class="ui-tdef__read-error">${alertIcon()}${m}</span>`)}
      </div>
      <div class="ui-tdef__cell ui-tdef__c-act" role="cell">
        <button type="button" class="ui-tdef__icon-btn ui-tdef__edit-row" data-edit=${i} aria-label=${`Edit ${label}`} aria-expanded="false" ?disabled=${this.isDisabled} @click=${() => this.edit(i)}>${pencilIcon()}</button>
      </div>
    </div>`;
  }

  private renderParam(p: ToolParameter, i: number, count: number, errors: Map<string, string>) {
    if (this.editing !== i) return this.renderParamRead(p, i, count, errors);
    const id = `${this.uid}-p${i}`;
    const off = this.isDisabled;
    const label = p.name.trim() || `Parameter ${i + 1}`;
    const err = (key: string) => errors.get(`param:${i}:${key}`);
    const problems = [...errors].filter(([k]) => k.startsWith(`param:${i}:`)).map(([, m]) => m);
    const enumOk = ENUM_TYPES.has(p.type);
    const typed = this.typing.get(i) ?? "";
    const ev = this.rowEvents(i);
    return html`<div class="ui-tdef__param" role="row" data-mode="edit" ?data-error=${problems.length > 0} aria-label=${`Parameter ${i + 1} of ${count}: ${label}`} @pointerenter=${ev.enter} @pointerleave=${ev.leave} @focusin=${ev.enter} @keydown=${(e: KeyboardEvent) => {
      this.onRowKey(e, i);
      this.onEditorKey(e);
    }}>
      <div class="ui-tdef__cell ui-tdef__c-name" role="cell">
        <input class="ui-tdef__input ui-tdef__input--sm ui-tdef__mono" data-field=${`param:${i}:name`} aria-label="Name" placeholder="name" spellcheck="false" autocomplete="off" .value=${live(p.name)} aria-invalid=${err("name") ? "true" : "false"} ?disabled=${off} @input=${(e: Event) => this.patchParam(i, { name: (e.target as HTMLInputElement).value })} />
        <label class="ui-tdef__req">
          <input type="checkbox" class="ui-tdef__check" data-field=${`param:${i}:required`} .checked=${live(p.required)} ?disabled=${off} @change=${(e: Event) => this.patchParam(i, { required: (e.target as HTMLInputElement).checked })} />
          <span>Required</span>
        </label>
      </div>
      <div class="ui-tdef__cell ui-tdef__c-type" role="cell">
        <span class="ui-tdef__select">
          <select class="ui-tdef__input ui-tdef__input--sm" data-field=${`param:${i}:type`} aria-label="Type" ?disabled=${off} @change=${(e: Event) => this.patchParam(i, { type: (e.target as HTMLSelectElement).value as ToolParameterType })}>
            ${this.types.map((t) => html`<option value=${t.id} .selected=${live(t.id === p.type)}>${t.label}</option>`)}
          </select>${chevronDown}
        </span>
      </div>
      <div class="ui-tdef__cell ui-tdef__c-desc" role="cell">
        <input class="ui-tdef__input ui-tdef__input--sm" data-field=${`param:${i}:description`} aria-label=${`What ${label} is for`} placeholder="What the model should put here" .value=${live(p.description)} ?disabled=${off} @input=${(e: Event) => this.patchParam(i, { description: (e.target as HTMLInputElement).value })} />
        ${enumOk
          ? html`<div class="ui-tdef__values" ?data-invalid=${!!err("enum")}>
              <span class="ui-tdef__values-lead" id=${`${id}-vl`}>Allowed</span>
              ${(p.enum ?? []).map(
                (v) => html`<span class="ui-tdef__chip"><span class="ui-tdef__chip-text">${v}</span><button type="button" class="ui-tdef__chip-x" aria-label=${`Remove ${v}`} ?disabled=${off} @click=${() => this.removeValue(i, v, true)}>${xIcon()}</button></span>`,
              )}
              <input
                class="ui-tdef__values-input"
                data-field=${`param:${i}:enum`}
                aria-labelledby=${`${id}-vl`}
                aria-describedby=${`${id}-vh`}
                aria-invalid=${err("enum") ? "true" : "false"}
                placeholder=${p.enum?.length ? "Add a value" : "Any value"}
                spellcheck="false"
                autocomplete="off"
                .value=${live(typed)}
                ?disabled=${off}
                @input=${(e: Event) => (this.typing = new Map(this.typing).set(i, (e.target as HTMLInputElement).value))}
                @keydown=${(e: KeyboardEvent) => this.onValuesKey(e, i)}
                @blur=${(e: Event) => this.addValues(i, (e.target as HTMLInputElement).value)}
              />
              <span class="ui-tdef__sr" id=${`${id}-vh`}>Enter or a comma adds a value; Backspace in an empty field removes the last.</span>
            </div>`
          : nothing}
        ${problems.map((m) => html`<span class="ui-tdef__read-error">${alertIcon()}${m}</span>`)}
        <div class="ui-tdef__param-foot">
          <button type="button" class="ui-tdef__icon-btn ui-tdef__move" data-dir="up" aria-label=${`Move ${label} up`} ?disabled=${off || i === 0} @click=${() => this.moveParam(i, -1, '.ui-tdef__move[data-dir="up"]')}>${upIcon()}</button>
          <button type="button" class="ui-tdef__icon-btn ui-tdef__move" data-dir="down" aria-label=${`Move ${label} down`} ?disabled=${off || i === count - 1} @click=${() => this.moveParam(i, 1, '.ui-tdef__move[data-dir="down"]')}>${downIcon()}</button>
          <button type="button" class="ui-tdef__btn ui-tdef__btn--ghost ui-tdef__remove" aria-label=${`Remove ${label}`} ?disabled=${off} @click=${() => this.removeParam(i)}>${trashIcon()}Remove</button>
        </div>
      </div>
      <div class="ui-tdef__cell ui-tdef__c-act" role="cell">
        <button type="button" class="ui-tdef__btn ui-tdef__btn--secondary ui-tdef__done" ?disabled=${off} @click=${() => this.doneEditing()}>Done</button>
      </div>
    </div>`;
  }

  private renderParams(errors: Map<string, string>) {
    const id = this.uid;
    const params = this.value.parameters;
    return html`<section class="ui-tdef__section" aria-labelledby=${`${id}-params`}>
      <div class="ui-tdef__section-top">
        <h4 class="ui-tdef__section-head" id=${`${id}-params`}>Parameters<span class="ui-tdef__count">${params.length}</span></h4>
        <button type="button" class="ui-tdef__btn ui-tdef__btn--ghost ui-tdef__add" ?disabled=${this.isDisabled} @click=${() => this.addParam()}>${plusIcon()}Add parameter</button>
      </div>
      ${params.length
        ? html`<div class="ui-tdef__table" role="table" aria-labelledby=${`${id}-params`}>
            <div class="ui-tdef__thead" role="rowgroup">
              <div class="ui-tdef__tr-head" role="row">
                <span class="ui-tdef__th" role="columnheader">Name</span><span class="ui-tdef__th" role="columnheader">Type</span><span class="ui-tdef__th" role="columnheader">Description</span><span class="ui-tdef__th" role="columnheader"><span class="ui-tdef__sr">Edit</span></span>
              </div>
            </div>
            <div class="ui-tdef__params" role="rowgroup">
              ${repeat(
                params,
                (_, i) => i,
                (p, i) => this.renderParam(p, i, params.length, errors),
              )}
            </div>
          </div>`
        : html`<p class="ui-tdef__empty">No parameters – the tool is called with nothing.</p>`}
    </section>`;
  }

  private renderSide(look: "standard" | "clean") {
    if (!this.showExample && !this.showSchema) return nothing;
    const id = this.uid;
    const args = this.exampleCall;
    const keys = Object.keys(args);
    const index = new Map(this.value.parameters.map((p, i) => [p.name.trim(), i]));
    const hotKey = this.value.parameters[this.hot]?.name.trim();
    return html`<div class="ui-tdef__side">
      ${this.showExample
        ? html`<section class="ui-tdef__example" aria-labelledby=${`${id}-ex`}>
            <h4 class="ui-tdef__side-head" id=${`${id}-ex`}>Example call</h4>
            <pre class="ui-tdef__json"><span class="ui-tdef__sr">${JSON.stringify(args)}</span><code aria-hidden="true"><span class="ui-tdef__j-punct">{</span>${keys.length ? nothing : html`<span class="ui-tdef__j-punct">}</span>`}
${keys.map(
              (k, n) =>
                html`<span class="ui-tdef__j-line" ?data-hot=${!!hotKey && k === hotKey} @pointerenter=${() => (this.hot = index.get(k) ?? -1)} @pointerleave=${() => (this.hot = -1)}>  <span class="ui-tdef__j-key">${JSON.stringify(k)}</span><span class="ui-tdef__j-punct">: </span>${jsonValue(args[k])}${n < keys.length - 1 ? html`<span class="ui-tdef__j-punct">,</span>` : nothing}</span>
`,
            )}${keys.length ? html`<span class="ui-tdef__j-punct">}</span>` : nothing}</code></pre>
          </section>`
        : nothing}
      ${this.showSchema
        ? html`<div class="ui-tdef__schema">
            <button type="button" class="ui-tdef__schema-toggle" aria-expanded=${this.schemaOpen ? "true" : "false"} aria-controls=${`${id}-schema`} @click=${() => (this.schemaOpen = !this.schemaOpen)}>${chevronRight()}JSON Schema<span class="ui-tdef__schema-note">what the model receives</span></button>
            <div id=${`${id}-schema`} class="ui-tdef__schema-body" ?hidden=${!this.schemaOpen}>
              ${this.schemaOpen ? html`<tc-code-block look=${look} bare language="json" filename="Input schema" .code=${JSON.stringify(this.schema, null, 2)} .lineNumbers=${false} max-height="280"></tc-code-block>` : nothing}
            </div>
          </div>`
        : nothing}
    </div>`;
  }

  private renderSummary(issues: ToolIssue[]) {
    const errors = issues.filter((x) => x.level === "error");
    const warnings = issues.filter((x) => x.level === "warning");
    const id = `${this.uid}-checks`;
    const head = errors.length
      ? `${errors.length === 1 ? "1 problem" : `${errors.length} problems`} to fix${warnings.length ? ` · ${warnings.length === 1 ? "1 suggestion" : `${warnings.length} suggestions`}` : ""}`
      : warnings.length
        ? `Valid · ${warnings.length === 1 ? "1 suggestion" : `${warnings.length} suggestions`}`
        : "Valid – the schema is ready to use";
    return html`<section class="ui-tdef__summary" data-state=${errors.length ? "error" : warnings.length ? "warning" : "ok"} aria-labelledby=${id}>
      <h4 class="ui-tdef__summary-head" id=${id}><span class="ui-tdef__summary-icon">${errors.length || warnings.length ? alertIcon() : okIcon()}</span>${head}</h4>
      ${issues.length
        ? html`<ul class="ui-tdef__issues">
            ${issues.map(
              (x) => html`<li><button type="button" class="ui-tdef__issue" data-level=${x.level} data-target=${x.field} @click=${() => this.goTo(x.field)}><span class="ui-tdef__sr">${x.level === "error" ? "Problem: " : "Suggestion: "}</span>${x.message}</button></li>`,
            )}
          </ul>`
        : nothing}
    </section>`;
  }

  protected override render() {
    const look = this.resolvedLook;
    const v = this.value;
    const issues = this.issues;
    const errors = new Map(issues.filter((x) => x.level === "error").map((x) => [x.field, x.message]));
    const name = v.name.trim();
    const head = cardHead({
      icon: WRENCH,
      title: name ? html`<span class="ui-tdef__title-name">${name}</span>` : this.heading,
      subtitle: this.description,
      id: `${this.uid}-title`,
      aside: this.renderApproval(),
    });
    const content = html`<div class="ui-tdef__body" ?data-side=${this.showExample || this.showSchema}>
        <div class="ui-tdef__ref">${this.renderLead(errors)}${this.renderParams(errors)}</div>
        ${this.renderSide(look)}
      </div>
      ${this.renderSummary(issues)}`;
    return html`<span class="ui-tdef__sr" role="status">${this.announcement}</span>${head}${look === "clean" ? content : html`<div class="ui-tdef__card">${content}</div>`}`;
  }

  static override css = /* css */ `
[data-ui="tdef"] {
  display: flow-root;
  box-sizing: border-box;
  container: ui-tdef / inline-size;
  width: 100%;
  max-width: 960px;
  min-width: 0;
  color: var(--tc-text-primary);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="tdef"] *, [data-ui="tdef"] *::before, [data-ui="tdef"] *::after { box-sizing: border-box; }
:where([data-ui="tdef"]) :is(p, ul, h4, pre) { margin: 0; padding: 0; }
:where([data-ui="tdef"]) ul { list-style: none; }
[data-ui="tdef"] svg { display: block; flex: none; }
/* Standard: the head on the gray tray, the reference on a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="tdef"] { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
.ui-tdef__card { display: flow-root; overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* Clean: one white card, the head its first row; thinner icons */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="tdef"] { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="tdef"] svg[stroke-width] { stroke-width: 1.5; }
:where([data-look="clean"], [data-look="clean"] *) .ui-tdef__body { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-tdef__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

/* ---------- Head: the tool's name is the title; the approval picker sits at the right ---------- */
.ui-tdef__title-name { font-family: var(--tc-font-mono); font-size: var(--tc-font-size-md); letter-spacing: var(--tc-tracking-normal); }
.ui-tdef__approval { position: relative; display: inline-flex; align-items: center; max-width: 13rem; height: var(--tc-control-h-sm); padding-left: var(--tc-space-2); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-icon-muted); transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-tdef__approval:hover:not([data-off]) { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-tdef__approval:focus-within { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-tdef__approval-select { min-width: 0; height: 100%; margin: 0; padding: 0 var(--tc-space-6) 0 var(--tc-space-1-5); border: 0; outline: 0; background: none; color: var(--tc-action-secondary-fg); font: inherit; font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); text-overflow: ellipsis; field-sizing: content; appearance: none; cursor: pointer; }
.ui-tdef__approval-select:disabled { cursor: not-allowed; opacity: 0.55; }
:where([data-look="clean"], [data-look="clean"] *).ui-tdef__approval { background: none; box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }

/* ---------- Body: the reference, and the example beside it when there's room ---------- */
.ui-tdef__body { display: grid; grid-template-columns: minmax(0, 1fr); }
.ui-tdef__ref { container: ui-tdef-ref / inline-size; display: grid; align-content: start; min-width: 0; }

/* The lead block: the signature and the description */
.ui-tdef__lead { display: grid; gap: var(--tc-space-1-5); padding: var(--tc-space-4) var(--tc-space-4) var(--tc-space-3); }
.ui-tdef__sig-top { display: flex; align-items: flex-start; gap: var(--tc-space-3); }
.ui-tdef__code { flex: 1; min-width: 0; padding-top: var(--tc-space-1); color: var(--tc-syntax-text); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-relaxed); overflow-wrap: anywhere; }
.ui-tdef__tok-fn { color: var(--tc-syntax-function); font-weight: var(--tc-font-weight-medium); cursor: pointer; }
.ui-tdef__tok-fn[data-empty], .ui-tdef__read-name[data-empty] { color: var(--tc-text-placeholder); font-style: italic; }
.ui-tdef__tok-punct { color: var(--tc-syntax-punctuation); }
.ui-tdef__tok-param { border-radius: var(--tc-radius-xs); cursor: pointer; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-tdef__tok-param:hover, .ui-tdef__tok-fn:hover, .ui-tdef__tok-param[data-hot] { background: var(--tc-accent-highlight); }
.ui-tdef__tok-param[data-error] .ui-tdef__tok-name { text-decoration: underline wavy; text-decoration-color: var(--tc-status-danger-fg); text-underline-offset: 3px; }
.ui-tdef__tok-name { color: var(--tc-syntax-property); }
.ui-tdef__tok-type { color: var(--tc-syntax-type); }
.ui-tdef__sig-desc { color: var(--tc-text-secondary); line-height: var(--tc-line-height-snug); overflow-wrap: anywhere; white-space: pre-line; }
.ui-tdef__sig-desc[data-empty] { color: var(--tc-text-muted); font-style: italic; }
.ui-tdef__head-edit { display: grid; gap: var(--tc-space-3); padding-top: var(--tc-space-2); animation: ui-tdef-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-tdef__head-edit[hidden] { display: none; }
.ui-tdef__lead[data-editing] .ui-tdef__sig-desc { display: none; }
.ui-tdef__row { display: grid; grid-template-columns: 6rem minmax(0, 1fr); align-items: start; gap: var(--tc-space-1) var(--tc-space-3); }
.ui-tdef__label { display: flex; align-items: center; min-height: var(--tc-field-h); color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); }
:where([data-look="clean"], [data-look="clean"] *).ui-tdef__label { color: var(--tc-text-muted); }
.ui-tdef__field-error { grid-column: 2; color: var(--tc-status-danger-fg); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); }
.ui-tdef__field-error:empty { display: none; }

/* Fields */
.ui-tdef__input {
  width: 100%;
  min-width: 0;
  height: var(--tc-field-h);
  margin: 0;
  padding: 0 var(--tc-field-px);
  border: 0;
  border-radius: var(--tc-field-radius);
  outline: 0;
  background: var(--tc-field-bg);
  box-shadow: var(--tc-field-shadow);
  color: var(--tc-text-primary);
  font: inherit;
  font-size: var(--tc-field-font-size);
  transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-tdef__input--sm { height: var(--tc-field-h-sm); font-size: var(--tc-font-size-sm); }
.ui-tdef__input:hover:not(:disabled) { box-shadow: var(--tc-field-shadow-hover); }
.ui-tdef__input:focus-visible { box-shadow: var(--tc-field-shadow-focus); }
.ui-tdef__input[aria-invalid="true"] { box-shadow: var(--tc-field-shadow-invalid); }
.ui-tdef__input::placeholder { color: var(--tc-text-placeholder); }
.ui-tdef__input:disabled { cursor: not-allowed; opacity: 0.55; }
.ui-tdef__mono { font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); }
.ui-tdef__note { height: auto; min-height: 60px; max-height: 200px; field-sizing: content; padding: var(--tc-space-2) var(--tc-space-2-5); line-height: var(--tc-line-height-normal); resize: vertical; }
.ui-tdef__select { position: relative; display: block; }
.ui-tdef__select > select { padding-right: var(--tc-space-6); appearance: none; cursor: pointer; text-overflow: ellipsis; }
.ui-tdef__chevron { position: absolute; top: 50%; right: var(--tc-space-2); width: 14px; height: 14px; fill: none; stroke: var(--tc-icon-muted); stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; transform: translateY(-50%); pointer-events: none; }

/* ---------- Parameters: a doc table ---------- */
.ui-tdef__section { display: grid; padding: 0 0 var(--tc-space-2); }
.ui-tdef__section-top { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-2); padding: var(--tc-space-1) var(--tc-space-2) var(--tc-space-1-5) var(--tc-space-4); }
.ui-tdef__section-head { display: flex; align-items: center; gap: var(--tc-space-1-5); color: var(--tc-caption-color); font-size: var(--tc-caption-font-size); line-height: var(--tc-caption-line-height); font-weight: var(--tc-caption-font-weight); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); }
.ui-tdef__count { display: grid; place-items: center; min-width: 18px; height: 18px; padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-badge); background: var(--tc-fill-default); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; letter-spacing: var(--tc-tracking-normal); }
.ui-tdef__empty { margin: 0 var(--tc-space-4) var(--tc-space-2); padding: var(--tc-space-4); border-radius: var(--tc-radius-md); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); text-align: center; }
.ui-tdef__table { display: grid; }
/* Narrow: name, type and Edit on one line, the description under them */
.ui-tdef__tr-head, .ui-tdef__param { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; grid-template-areas: "name type act" "desc desc desc"; column-gap: var(--tc-space-2-5); padding: var(--tc-space-2-5) var(--tc-space-2) var(--tc-space-2-5) var(--tc-space-4); }
.ui-tdef__tr-head { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); padding: 0; }
.ui-tdef__th { color: var(--tc-caption-color); font-size: var(--tc-caption-font-size); line-height: var(--tc-caption-line-height); font-weight: var(--tc-caption-font-weight); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); }
.ui-tdef__param { align-items: baseline; border-top: var(--tc-hairline) solid var(--tc-divider); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-tdef__param[data-mode="read"]:hover, .ui-tdef__param[data-hot][data-mode="read"] { background: var(--tc-fill-subtle); }
.ui-tdef__param[data-error] { box-shadow: inset 2px 0 0 var(--tc-status-danger-solid); }
.ui-tdef__cell { min-width: 0; }
.ui-tdef__c-name { grid-area: name; display: flex; flex-wrap: wrap; align-items: baseline; gap: 0 var(--tc-space-2); cursor: pointer; }
.ui-tdef__c-type { grid-area: type; cursor: pointer; }
.ui-tdef__c-desc { grid-area: desc; display: grid; gap: var(--tc-space-1); padding-top: var(--tc-space-0-5); cursor: pointer; }
.ui-tdef__c-act { grid-area: act; align-self: start; display: flex; justify-content: flex-end; margin: calc(-1 * var(--tc-space-1)) 0; }
.ui-tdef__read-name { color: var(--tc-text-primary); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-semibold); overflow-wrap: anywhere; }
.ui-tdef__read-req { color: var(--tc-status-warning-fg); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-tdef__read-type { color: var(--tc-syntax-type); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); }
.ui-tdef__read-enum { margin-left: var(--tc-space-1-5); color: var(--tc-text-muted); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); }
.ui-tdef__read-desc { color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); overflow-wrap: anywhere; }
.ui-tdef__read-desc[data-empty] { color: var(--tc-text-muted); font-style: italic; }
.ui-tdef__read-values { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1); }
.ui-tdef__values-lead { margin-right: var(--tc-space-0-5); color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); }
.ui-tdef__val { padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-sm); background: var(--tc-fill-default); color: var(--tc-syntax-string); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); line-height: var(--tc-pill-h); }
.ui-tdef__read-error { display: flex; align-items: center; gap: var(--tc-space-1); color: var(--tc-status-danger-fg); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); }
.ui-tdef__read-error > svg { width: 12px; height: 12px; }
/* A row being edited: its cells become fields, in place */
.ui-tdef__param[data-mode="edit"] { grid-template-columns: minmax(0, 1fr) minmax(0, 7.5rem) auto; grid-template-areas: "name type act" "desc desc desc"; align-items: start; row-gap: var(--tc-space-2); background: var(--tc-fill-subtle); box-shadow: inset 2px 0 0 var(--tc-accent); }
.ui-tdef__param[data-mode="edit"] .ui-tdef__c-name { flex-direction: column; flex-wrap: nowrap; align-items: stretch; gap: var(--tc-space-1-5); cursor: auto; }
.ui-tdef__param[data-mode="edit"] .ui-tdef__c-desc { padding-top: 0; cursor: auto; }
.ui-tdef__param[data-mode="edit"] .ui-tdef__c-act { margin: 0; }
:where([data-look="standard"], [data-look="standard"] *) .ui-tdef__param[data-mode="edit"] .ui-tdef__input { background: var(--tc-surface-on-tray); }
.ui-tdef__req { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); white-space: nowrap; cursor: pointer; }
.ui-tdef__check { width: 15px; height: 15px; margin: 0; accent-color: var(--tc-accent); cursor: pointer; }
.ui-tdef__check:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-tdef__param-foot { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-0-5); margin-left: calc(-1 * var(--tc-space-1-5)); }
.ui-tdef__icon-btn { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); margin: 0; padding: 0; border: 0; border-radius: var(--tc-control-radius-sm); background: none; color: var(--tc-icon-muted); cursor: pointer; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-tdef__icon-btn:hover:not(:disabled) { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-tdef__icon-btn:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-tdef__icon-btn:disabled { cursor: default; opacity: 0.35; }
/* Allowed values: chips and a field, on one line that wraps */
.ui-tdef__values { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1); min-height: var(--tc-control-h-sm); }
.ui-tdef__chip { display: inline-flex; align-items: center; gap: var(--tc-space-0-5); height: var(--tc-pill-h-lg); padding: 0 var(--tc-space-0-5) 0 var(--tc-space-2); border-radius: var(--tc-pill-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-control); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); color: var(--tc-syntax-string); }
:where([data-look="clean"], [data-look="clean"] *) .ui-tdef__chip { background: var(--tc-fill-default); box-shadow: none; }
.ui-tdef__values[data-invalid] .ui-tdef__chip { box-shadow: inset 0 0 0 1px var(--tc-status-danger-border); }
.ui-tdef__chip-x { display: grid; place-items: center; width: 18px; height: 18px; margin: 0; padding: 0; border: 0; border-radius: 50%; background: none; color: var(--tc-icon-muted); cursor: pointer; }
.ui-tdef__chip-x:hover:not(:disabled) { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-tdef__chip-x:focus-visible { outline: var(--tc-focus-outline); outline-offset: 0; }
.ui-tdef__values-input { flex: 1 1 8rem; min-width: 6rem; height: var(--tc-pill-h-lg); margin: 0; padding: 0 var(--tc-space-1); border: 0; border-radius: var(--tc-radius-sm); outline: 0; background: none; color: var(--tc-text-primary); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); }
.ui-tdef__values-input::placeholder { color: var(--tc-text-placeholder); font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); }
.ui-tdef__values-input:focus-visible { box-shadow: var(--tc-field-shadow-focus); }
.ui-tdef__values-input[aria-invalid="true"] { box-shadow: var(--tc-field-shadow-invalid); }

/* Buttons */
.ui-tdef__btn { display: inline-flex; align-items: center; justify-self: start; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); margin: 0; padding: 0 var(--tc-control-px-sm); border: 0; border-radius: var(--tc-control-radius-sm); background: none; color: inherit; font: inherit; font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; cursor: pointer; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-quick) var(--tc-ease-standard); }
.ui-tdef__btn--secondary { background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); }
.ui-tdef__btn--secondary:hover:not(:disabled) { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-tdef__btn--ghost { color: var(--tc-action-ghost-fg); }
.ui-tdef__btn--ghost:hover:not(:disabled) { background: var(--tc-action-ghost-bg-hover); }
.ui-tdef__edit-head { flex: none; margin: calc(-1 * var(--tc-space-0-5)) calc(-1 * var(--tc-space-2)) 0 0; }
.ui-tdef__remove { color: var(--tc-status-danger-fg); }
.ui-tdef__remove:hover:not(:disabled) { background: var(--tc-status-danger-bg); }
.ui-tdef__btn:active:not(:disabled) { transform: scale(0.98); }
.ui-tdef__btn:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-tdef__btn:disabled { cursor: not-allowed; opacity: 0.55; }

/* ---------- Example call and the schema ---------- */
.ui-tdef__side { display: grid; align-content: start; gap: var(--tc-space-2); min-width: 0; margin: 0 var(--tc-space-4) var(--tc-space-4); }
.ui-tdef__example { display: grid; min-width: 0; padding: var(--tc-space-3) var(--tc-space-3-5); border-radius: var(--tc-radius-lg); background: var(--tc-surface-well); }
:where([data-look="clean"], [data-look="clean"] *) .ui-tdef__example { border-radius: var(--tc-radius-md); background: none; box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-tdef__side-head { margin-bottom: var(--tc-space-1-5) !important; color: var(--tc-caption-color); font-size: var(--tc-caption-font-size); line-height: var(--tc-caption-line-height); font-weight: var(--tc-caption-font-weight); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); }
.ui-tdef__json { min-width: 0; margin: 0 calc(-1 * var(--tc-space-1)) !important; padding: 0 var(--tc-space-1) !important; color: var(--tc-syntax-text); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-relaxed); white-space: pre-wrap; overflow-wrap: anywhere; }
.ui-tdef__j-line { display: inline-block; min-width: 100%; border-radius: var(--tc-radius-xs); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-tdef__j-line[data-hot] { background: var(--tc-fill-subtle); box-shadow: inset 2px 0 0 var(--tc-accent); }
:where([data-look="standard"], [data-look="standard"] *) .ui-tdef__j-line[data-hot] { background: var(--tc-surface-on-tray); box-shadow: var(--tc-shadow-control); }
.ui-tdef__j-key { color: var(--tc-syntax-property); }
.ui-tdef__j-str { color: var(--tc-syntax-string); }
.ui-tdef__j-num { color: var(--tc-syntax-number); }
.ui-tdef__j-kw { color: var(--tc-syntax-keyword); }
.ui-tdef__j-punct { color: var(--tc-syntax-punctuation); }
.ui-tdef__schema-toggle { display: flex; align-items: center; gap: var(--tc-space-1-5); width: 100%; min-height: var(--tc-control-h-sm); margin: 0; padding: 0 var(--tc-space-1); border: 0; border-radius: var(--tc-control-radius-sm); background: none; color: var(--tc-text-secondary); font: inherit; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); text-align: left; cursor: pointer; }
.ui-tdef__schema-toggle:hover { color: var(--tc-text-primary); }
.ui-tdef__schema-toggle:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-tdef__schema-toggle > svg { color: var(--tc-icon-muted); transition: transform var(--tc-duration-base) var(--tc-ease-standard); }
.ui-tdef__schema-toggle[aria-expanded="true"] > svg { transform: rotate(90deg); }
.ui-tdef__schema-note { overflow: hidden; color: var(--tc-text-muted); font-weight: var(--tc-font-weight-regular); white-space: nowrap; text-overflow: ellipsis; }
.ui-tdef__schema-body { padding-top: var(--tc-space-1); }
.ui-tdef__schema-body[hidden] { display: none; }

/* ---------- The validation strip ---------- */
.ui-tdef__summary { display: grid; gap: var(--tc-space-1); padding: var(--tc-space-2-5) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-tdef__summary-head { display: flex; align-items: center; gap: var(--tc-space-1-5); color: var(--tc-status-success-fg); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); font-weight: var(--tc-font-weight-medium); }
.ui-tdef__summary[data-state="warning"] .ui-tdef__summary-head { color: var(--tc-text-secondary); }
.ui-tdef__summary[data-state="error"] .ui-tdef__summary-head { color: var(--tc-status-danger-fg); }
.ui-tdef__summary-icon { display: grid; }
.ui-tdef__summary[data-state="warning"] .ui-tdef__summary-icon { color: var(--tc-status-warning-fg); }
.ui-tdef__issues { display: grid; padding-left: var(--tc-space-5) !important; }
.ui-tdef__issue { display: block; width: 100%; min-height: 24px; margin: 0; padding: var(--tc-space-0-5) 0; border: 0; background: none; color: var(--tc-text-secondary); font: inherit; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); text-align: left; text-decoration: underline; text-decoration-color: var(--tc-border-strong); text-underline-offset: 2px; cursor: pointer; }
.ui-tdef__issue[data-level="error"] { color: var(--tc-text-primary); text-decoration-color: var(--tc-status-danger-fg); }
.ui-tdef__issue:hover { text-decoration-color: currentColor; }
.ui-tdef__issue:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); border-radius: var(--tc-radius-xs); }
@keyframes ui-tdef-in { from { opacity: 0; transform: translateY(-3px); } }

/* Wide reference: a real table – Name · Type · Description · Edit, with a column-header band */
@container ui-tdef-ref (min-width: 500px) {
  .ui-tdef__tr-head, .ui-tdef__param { grid-template-columns: minmax(7rem, 0.8fr) minmax(4.5rem, 0.5fr) minmax(0, 2fr) var(--tc-control-h-sm); grid-template-areas: "name type desc act"; }
  .ui-tdef__param[data-mode="edit"] { grid-template-columns: minmax(7rem, 0.8fr) minmax(6.5rem, 0.5fr) minmax(0, 2fr) auto; grid-template-areas: "name type desc act"; }
  .ui-tdef__tr-head { position: static; width: auto; height: auto; overflow: visible; clip-path: none; padding: var(--tc-space-1-5) var(--tc-space-2) var(--tc-space-1-5) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
  .ui-tdef__c-name { flex-direction: column; flex-wrap: nowrap; align-items: flex-start; gap: 0; }
  .ui-tdef__read-enum { display: block; margin-left: 0; }
  .ui-tdef__c-desc { padding-top: 0; }
}
:where([data-look="standard"], [data-look="standard"] *) .ui-tdef__tr-head { background: var(--tc-fill-subtle); }
/* Wide component: the example beside the reference */
@container ui-tdef (min-width: 640px) {
  .ui-tdef__body[data-side] { grid-template-columns: minmax(0, 1fr) minmax(13rem, 0.55fr); }
  .ui-tdef__side { margin: var(--tc-space-4) var(--tc-space-4) var(--tc-space-4) 0; }
  :where([data-look="clean"], [data-look="clean"] *) .ui-tdef__side { margin: 0; padding: var(--tc-space-4); border-left: var(--tc-hairline) solid var(--tc-divider); }
  :where([data-look="clean"], [data-look="clean"] *) .ui-tdef__example { padding: 0; box-shadow: none; }
}
/* Narrow: tighter gutters, labels over their fields, a shorter approval picker */
@container ui-tdef (max-width: 420px) {
  .ui-tdef__lead, .ui-tdef__summary { padding-left: var(--tc-space-3); padding-right: var(--tc-space-3); }
  .ui-tdef__section-top, .ui-tdef__param { padding-left: var(--tc-space-3); }
  .ui-tdef__side { margin-left: var(--tc-space-3); margin-right: var(--tc-space-3); }
  .ui-tdef__row { grid-template-columns: minmax(0, 1fr); }
  .ui-tdef__label { min-height: 0; }
  .ui-tdef__field-error { grid-column: 1; }
  .ui-tdef__param[data-mode="edit"] { grid-template-columns: minmax(0, 1fr) minmax(0, 6.5rem) auto; }
}
@container ui-tdef (max-width: 360px) {
  .ui-tdef__approval { max-width: 8.5rem; }
}
@media (pointer: coarse) {
  .ui-tdef__input:not(textarea), .ui-tdef__btn, .ui-tdef__approval { height: 40px; }
  .ui-tdef__icon-btn { width: 40px; height: 40px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="tdef"] *, [data-ui="tdef"] *::before, [data-ui="tdef"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-tool-configuration")) customElements.define("tc-tool-configuration", TcToolConfiguration);

declare global {
  interface HTMLElementTagNameMap {
    "tc-tool-configuration": TcToolConfiguration;
  }
}
