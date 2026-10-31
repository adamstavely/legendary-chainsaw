import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import "./combobox";
import type { ComboboxValueChange } from "./combobox";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { settingsCss } from "./internal/settings";

/*
 * <tc-hal-form> – a form the server describes: give it a HAL-FORMS document (`resource`, or a URL in `src`) and it
 * draws the template's properties as controls, checks them, and sends the request the template asks for. Nothing about
 * the form lives in the page, so the API can change a field, add a rule or move an endpoint without a release.
 *   · every `type` in the spec: text, textarea, search, tel, url, email, password, date, month, week, time,
 *     datetime-local, number, range, color, checkbox, radio, hidden; anything else is a text box, as the spec says
 *   · `options`, inline or fetched from `options.link` (JSON or CSV, with `promptField` / `valueField`): radios or
 *     checkboxes when the type says so, otherwise a searchable list; `minItems` / `maxItems` are checked
 *   · `required`, `regex`, `minLength`, `maxLength`, `min`, `max`, `step`, `readOnly`, `placeholder`, `prompt`, `value`
 *     and `templated`; messages appear when a field is left and on submit, and focus goes to the first problem
 *   · sends to `_htarget`, else `target`, else the `self` link, else `src`: a query string for GET, HEAD and DELETE,
 *     otherwise JSON (the default) or form encoding. A single choice is one value and several are an array or repeated
 *     names; numbers and a lone checkbox go as JSON numbers and booleans. tc-submit is cancelable, for an app that sends
 *     the request itself; `fetcher` replaces fetch, for one that only needs to add its auth
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-hal-form src="/rels/create-task"></tc-hal-form>
 */

/** A form: Lucide (ISC, lucide.dev) */
const formIcon = svg`<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 13H8"></path><path d="M16 13h-3"></path><path d="M10 17H8"></path><path d="M16 17h-3"></path>`;

export type HalFormsOptions = {
  /** The choices: plain values, or objects read with `promptField` and `valueField`. Wins over `link` */
  inline?: unknown[];
  /** Where to fetch the choices from */
  link?: { href?: string; templated?: boolean | string; type?: string };
  /** What's chosen to begin with */
  selectedValues?: unknown[];
  minItems?: number;
  maxItems?: number;
  /** The field holding a choice's words; "prompt" by default */
  promptField?: string;
  /** The field holding a choice's value; "value" by default */
  valueField?: string;
};
export type HalFormsProperty = {
  name?: string;
  prompt?: string;
  readOnly?: boolean;
  regex?: string;
  required?: boolean;
  templated?: boolean | string;
  value?: unknown;
  type?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  step?: number;
  cols?: number;
  rows?: number;
  options?: HalFormsOptions;
};
export type HalFormsTemplate = {
  title?: string;
  method?: string;
  contentType?: string;
  target?: string;
  properties?: HalFormsProperty[];
};
export type HalFormsDocument = {
  _links?: Record<string, { href?: string } | undefined>;
  _templates?: Record<string, HalFormsTemplate>;
};
/** A control's value: words, whether a lone checkbox is ticked, or the values chosen */
export type HalFormValue = string | boolean | string[];
export type HalFormValues = Record<string, HalFormValue>;
/** A value as it's sent */
export type HalFormWireValue = string | number | boolean | null | string[];

export type HalRequest = { method: string; url: string; headers: Record<string, string>; body?: string };
export type HalFormFetcher = (url: string, init: RequestInit) => Promise<Response>;

/** Details of the events */
export type HalFormValuesChange = {
  /** Every field's value after the change */
  values: HalFormValues;
  name: string;
  value: HalFormValue;
};
export type HalFormSubmit = HalRequest & {
  /** The values as they're sent */
  values: Record<string, HalFormWireValue>;
  /** The template's key */
  templateKey: string;
};
export type HalFormResponse = { ok: boolean; status: number; response: Response; values: Record<string, HalFormWireValue> };
export type HalFormError = {
  /** What failed: fetching the form, a field's options, or sending */
  phase: "form" | "options" | "submit";
  error: unknown;
  /** The field, for "options" */
  name?: string;
};

export type HalFormLabels = {
  submit: string;
  sending: string;
  sent: string;
  /** The request came back refused; `detail` is the server's own words, when it gave any */
  refused: (status: number, detail: string) => string;
  /** The request never arrived */
  unreachable: string;
  loading: string;
  loadFailed: string;
  retry: string;
  invalid: string;
  noTarget: string;
  optionsLoading: string;
  optionsFailed: string;
  required: string;
  complete: string;
  format: string;
  tooShort: (n: number) => string;
  tooLong: (n: number) => string;
  below: (n: number) => string;
  above: (n: number) => string;
  step: (n: number) => string;
  tooFew: (n: number) => string;
  tooMany: (n: number) => string;
  problems: (n: number) => string;
  noResults: string;
};
export const defaultHalFormLabels: HalFormLabels = {
  submit: "Submit",
  sending: "Sending…",
  sent: "Sent.",
  refused: (status, detail) => (detail ? `The server refused this (${status}): ${detail}` : `The server refused this (${status}).`),
  unreachable: "This couldn't be sent. Check your connection and try again.",
  loading: "Loading the form…",
  loadFailed: "The form couldn't be loaded.",
  retry: "Try again",
  invalid: "This isn't a form this page can show.",
  noTarget: "This form doesn't say where to send it.",
  optionsLoading: "Loading choices…",
  optionsFailed: "The choices couldn't be loaded.",
  required: "Required",
  complete: "Complete this field.",
  format: "Use the format asked for.",
  tooShort: (n) => `Use at least ${n} character${n === 1 ? "" : "s"}.`,
  tooLong: (n) => `Use at most ${n} character${n === 1 ? "" : "s"}.`,
  below: (n) => `Enter ${n} or more.`,
  above: (n) => `Enter ${n} or less.`,
  step: (n) => `Use steps of ${n}.`,
  tooFew: (n) => `Choose at least ${n}.`,
  tooMany: (n) => `Choose at most ${n}.`,
  problems: (n) => (n === 1 ? "One field needs attention." : `${n} fields need attention.`),
  noResults: "No matches",
};

const MEDIA_TYPE = "application/prs.hal-forms+json";
const INPUT_TYPES = new Set(["text", "search", "tel", "url", "email", "password", "date", "month", "week", "time", "datetime-local", "color"]);
const WITHOUT_BODY = new Set(["GET", "HEAD", "DELETE"]);

let uidCount = 0;

/* ---------- The spec's rules, with no UI ---------- */

const yes = (v: unknown) => v === true || v === "true";
const num = (v: unknown) => {
  const n = typeof v === "string" && v.trim() !== "" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : undefined;
};

/** The template to use: the key asked for, else "default", else the first */
export function pickHalTemplate(doc: HalFormsDocument | null | undefined, key?: string): { key: string; template: HalFormsTemplate } | null {
  const all = doc?._templates;
  if (!all || typeof all !== "object") return null;
  const keys = Object.keys(all);
  const chosen = key && all[key] ? key : all.default ? "default" : keys[0];
  return chosen ? { key: chosen, template: all[chosen] } : null;
}

/** Expands the common URI templates (RFC 6570): {var}, {+var}, {?a,b} and {&a,b}; a variable without a value drops out */
export function expandHalUri(template: string, variables: Record<string, unknown> = {}): string {
  return template.replace(/\{([+?&]?)([^}]*)\}/g, (_all, op: string, names: string) => {
    const present = names
      .split(",")
      .map((n) => n.trim())
      .filter((n) => variables[n] !== undefined && variables[n] !== null);
    if (op === "?" || op === "&") {
      const pairs = present.map((n) => `${encodeURIComponent(n)}=${encodeURIComponent(String(variables[n]))}`);
      return pairs.length ? op + pairs.join("&") : "";
    }
    return present.map((n) => (op === "+" ? encodeURI(String(variables[n])) : encodeURIComponent(String(variables[n])))).join(",");
  });
}

/** Choices from an array of plain values or objects; anything that isn't an array gives none */
export function parseHalChoices(raw: unknown, options: Pick<HalFormsOptions, "promptField" | "valueField"> = {}): { value: string; label: string }[] | null {
  if (!Array.isArray(raw)) return null;
  const valueField = options.valueField || "value";
  const promptField = options.promptField || "prompt";
  return raw.flatMap((item) => {
    if (item && typeof item === "object") {
      const o = item as Record<string, unknown>;
      const value = o[valueField];
      if (value === undefined || value === null) return [];
      return [{ value: String(value), label: String(o[promptField] ?? value) }];
    }
    return item === undefined || item === null ? [] : [{ value: String(item), label: String(item) }];
  });
}

/** Choices from CSV, a line each: "value", or "prompt,value" */
export function parseHalCsv(text: string): { value: string; label: string }[] {
  const unquote = (s: string) => s.trim().replace(/^"(.*)"$/, "$1").replace(/""/g, '"');
  return text.split(/\r?\n/).flatMap((line) => {
    if (!line.trim()) return [];
    const cut = line.lastIndexOf(",");
    if (cut < 0) return [{ value: unquote(line), label: unquote(line) }];
    return [{ value: unquote(line.slice(cut + 1)), label: unquote(line.slice(0, cut)) }];
  });
}

/** The request a template describes, for values as they're sent */
export function buildHalRequest(template: HalFormsTemplate, url: string, values: Record<string, HalFormWireValue>): HalRequest {
  const asked = (template.method ?? "").trim().toUpperCase();
  // Empty or not a method: a GET, as the spec says
  const method = /^[A-Z]+$/.test(asked) ? asked : "GET";
  const form = new URLSearchParams();
  for (const [name, value] of Object.entries(values)) {
    if (Array.isArray(value)) value.forEach((v) => form.append(name, v));
    else form.append(name, value === null ? "" : String(value));
  }
  const headers: Record<string, string> = { Accept: "application/hal+json, application/json" };
  if (WITHOUT_BODY.has(method)) {
    const out = new URL(url);
    // As an HTML form does: the values are the query
    out.search = form.toString();
    return { method, url: out.toString(), headers };
  }
  if ((template.contentType ?? "").split(";")[0].trim().toLowerCase() === "application/x-www-form-urlencoded") {
    return { method, url, headers: { ...headers, "Content-Type": "application/x-www-form-urlencoded" }, body: form.toString() };
  }
  return { method, url, headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(values) };
}

/* ---------- The fields a template makes ---------- */

type FieldKind = "hidden" | "input" | "textarea" | "number" | "range" | "check" | "radios" | "checks" | "list";
type Field = { prop: HalFormsProperty; name: string; label: string; kind: FieldKind; inputType: string; multiple: boolean; choicesFrom: "none" | "inline" | "link" };
type Choices = { status: "loading" | "ready" | "failed"; choices: { value: string; label: string }[] };

function makeField(prop: HalFormsProperty): Field {
  const name = String(prop.name);
  const type = String(prop.type ?? "text").toLowerCase();
  const o = prop.options;
  const choicesFrom = Array.isArray(o?.inline) ? "inline" : o?.link?.href ? "link" : "none";
  const base = { prop, name, label: prop.prompt || name, inputType: "text", multiple: false, choicesFrom } as Field;
  if (choicesFrom !== "none") {
    const max = num(o?.maxItems);
    // Without a type or maxItems the spec's own example is a single choice
    const multiple = type === "radio" ? false : max !== 1 && (type === "checkbox" || (max !== undefined && max > 1));
    const kind: FieldKind = type === "radio" ? "radios" : type === "checkbox" ? (multiple ? "checks" : "radios") : "list";
    return type === "hidden" ? { ...base, kind: "hidden", multiple } : { ...base, kind, multiple };
  }
  if (type === "hidden") return { ...base, kind: "hidden" };
  if (type === "textarea") return { ...base, kind: "textarea" };
  if (type === "number") return { ...base, kind: "number", inputType: "number" };
  if (type === "range") return { ...base, kind: "range", inputType: "range" };
  if (type === "checkbox") return { ...base, kind: "check" };
  return { ...base, kind: "input", inputType: INPUT_TYPES.has(type) ? type : "text" };
}

/**
 * A form the server describes: a HAL-FORMS document drawn as controls, checked by its rules, and sent as its template
 * asks – every type, inline and linked options, and JSON, form-encoded or query-string requests.
 * @tag tc-hal-form
 * @fires tc-values-change - A field changed ({ values, name, value }: HalFormValuesChange); cancelable – prevented, the field keeps its value
 * @fires tc-submit - The form is valid and about to send ({ method, url, headers, body, values, templateKey }: HalFormSubmit); cancelable – prevented, nothing is sent and the request is yours
 * @fires tc-response - The server answered ({ ok, status, response, values }: HalFormResponse)
 * @fires tc-error - Fetching the form, a field's options or the request failed ({ phase, error, name }: HalFormError)
 */
export class TcHalForm extends TcElement {
  static override ui = "hal";

  /** The heading; by default the template's title */
  @property() accessor heading = "";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The HAL-FORMS document, when the page already has it; wins over `src` */
  @property({ attribute: false }) accessor resource: HalFormsDocument | null = null;
  /** Where to fetch the HAL-FORMS document. Also the base for relative URLs, and the target of last resort */
  @property() accessor src: string | undefined = undefined;
  /** Which template to use; by default "default", else the first */
  @property({ attribute: "template-key" }) accessor templateKey: string | undefined = undefined;
  /** The fields' values over what the template starts with. Changed by the user unless a tc-values-change listener calls preventDefault() */
  @property({ attribute: false }) accessor values: HalFormValues = {};
  /** Messages for fields, by name, e.g. from the server's answer; a message goes when its field is edited */
  @property({ attribute: false }) accessor errors: Record<string, string> = {};
  /** Values for templated `value`s and `options.link.href`s */
  @property({ attribute: false }) accessor variables: Record<string, unknown> = {};
  /** Replaces fetch for every request it makes, e.g. to add auth */
  @property({ attribute: false }) accessor fetcher: HalFormFetcher | undefined = undefined;
  /** Replaces any of the words: "Submit", the messages… */
  @property({ attribute: false }) accessor labels: Partial<HalFormLabels> = {};

  @state() private accessor loaded: HalFormsDocument | null = null;
  @state() private accessor phase: "idle" | "loading" | "failed" = "idle";
  @state() private accessor choices: Record<string, Choices> = {};
  @state() private accessor problems: Record<string, string> = {};
  @state() private accessor cleared: ReadonlySet<string> = new Set<string>();
  @state() private accessor sending = false;
  @state() private accessor outcome: { kind: "sent" | "failed" | "problems"; text: string } | null = null;

  private uid = `tc-hal-${++uidCount}`;
  private fields: Field[] = [];
  private starts: HalFormValues = {};
  private chosen: { key: string; template: HalFormsTemplate } | null = null;
  private target: string | null = null;
  private wantForm = false;
  private wantOptions = false;
  private loads = new AbortController();

  /* ---------- Loading ---------- */

  private get words(): HalFormLabels {
    return { ...defaultHalFormLabels, ...this.labels };
  }
  private get doc() {
    return this.resource ?? this.loaded;
  }
  private send(url: string, init: RequestInit) {
    return this.fetcher ? this.fetcher(url, init) : fetch(url, init);
  }
  /** A URL made absolute against `src`, else the page; null unless it's http(s) */
  private resolve(raw: unknown): string | null {
    if (typeof raw !== "string" || !raw.trim()) return null;
    try {
      const base = this.src ? new URL(this.src, this.ownerDocument.baseURI) : this.ownerDocument.baseURI;
      const url = new URL(raw, base);
      return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
    } catch {
      return null;
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.loads.abort();
    // Back in the page, whatever was in flight starts again
    if (!this.resource && this.src && !this.loaded) this.wantForm = true;
    if (Object.values(this.choices).some((c) => c.status === "loading")) this.wantOptions = true;
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("errors")) this.cleared = new Set();
    if ((changed.has("src") || changed.has("resource")) && !this.resource) {
      this.loaded = null;
      this.phase = this.src ? "loading" : "idle";
      this.wantForm = !!this.src;
    }
    if (changed.has("resource") || changed.has("loaded") || changed.has("templateKey") || changed.has("variables") || changed.has("src")) this.build();
  }

  protected override updated() {
    if (this.wantForm) {
      this.wantForm = false;
      void this.fetchForm();
    }
    if (this.wantOptions) {
      this.wantOptions = false;
      for (const field of this.fields) if (field.choicesFrom === "link" && this.choices[field.name]?.status === "loading") void this.fetchChoices(field);
    }
  }

  /** The fields, their starting values and the target, from the template */
  private build() {
    const chosen = pickHalTemplate(this.doc, this.templateKey);
    const seen = new Set<string>();
    const fields: Field[] = [];
    for (const prop of Array.isArray(chosen?.template.properties) ? chosen.template.properties : []) {
      // No name, no property (the spec); the first of a repeated name wins
      if (!prop || !prop.name || seen.has(String(prop.name))) continue;
      seen.add(String(prop.name));
      fields.push(makeField(prop));
    }
    const starts: HalFormValues = {};
    const choices: Record<string, Choices> = {};
    for (const field of fields) {
      starts[field.name] = this.startOf(field);
      if (field.choicesFrom === "inline") {
        choices[field.name] = { status: "ready", choices: parseHalChoices(field.prop.options?.inline, field.prop.options) ?? [] };
      } else if (field.choicesFrom === "link") {
        choices[field.name] = { status: "loading", choices: [] };
        this.wantOptions = true;
      }
    }
    this.chosen = chosen;
    this.fields = fields;
    this.starts = starts;
    this.choices = choices;
    this.problems = {};
    this.outcome = null;
    let override: string | null = null;
    try {
      if (this.src) override = this.resolve(new URL(this.src, this.ownerDocument.baseURI).searchParams.get("_htarget"));
    } catch {
      override = null;
    }
    this.target = override ?? this.resolve(chosen?.template.target) ?? this.resolve(this.doc?._links?.self?.href) ?? this.resolve(this.src);
  }

  private startOf(field: Field): HalFormValue {
    const { prop, kind, multiple } = field;
    const raw = yes(prop.templated) && typeof prop.value === "string" ? expandHalUri(prop.value, this.variables) : prop.value;
    if (field.choicesFrom !== "none") {
      const selected = Array.isArray(prop.options?.selectedValues) ? prop.options.selectedValues.map(String) : raw !== undefined && raw !== null && raw !== "" ? [String(raw)] : [];
      return multiple ? selected : (selected[0] ?? "");
    }
    if (kind === "check") return yes(raw);
    return raw === undefined || raw === null ? "" : String(raw);
  }

  private async fetchForm() {
    this.loads.abort();
    this.loads = new AbortController();
    const { signal } = this.loads;
    const url = this.resolve(this.src);
    try {
      if (!url) throw new Error(`Not an http(s) URL: ${this.src}`);
      const response = await this.send(url, { method: "GET", headers: { Accept: MEDIA_TYPE }, signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const doc = (await response.json()) as HalFormsDocument;
      if (signal.aborted) return;
      this.loaded = doc;
      this.phase = "idle";
    } catch (error) {
      if (signal.aborted) return;
      this.phase = "failed";
      this.emit<HalFormError>("tc-error", { phase: "form", error });
    }
  }

  private async fetchChoices(field: Field) {
    const { signal } = this.loads;
    const { link } = field.prop.options ?? {};
    const href = yes(link?.templated) ? expandHalUri(String(link?.href), this.variables) : link?.href;
    const url = this.resolve(href);
    const type = link?.type || "application/json";
    const set = (next: Choices) => (this.choices = { ...this.choices, [field.name]: next });
    try {
      if (!url) throw new Error(`Not an http(s) URL: ${href}`);
      const response = await this.send(url, { method: "GET", headers: { Accept: type }, signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const csv = type.toLowerCase().includes("csv");
      const parsed = csv ? parseHalCsv(await response.text()) : parseHalChoices(await response.json(), field.prop.options);
      if (signal.aborted || !this.fields.includes(field)) return;
      if (!parsed) throw new Error("The choices aren't a list");
      set({ status: "ready", choices: parsed });
    } catch (error) {
      if (signal.aborted || !this.fields.includes(field)) return;
      set({ status: "failed", choices: [] });
      this.emit<HalFormError>("tc-error", { phase: "options", error, name: field.name });
    }
  }

  private retryForm = () => {
    this.phase = "loading";
    void this.fetchForm();
  };
  private retryChoices(field: Field) {
    this.choices = { ...this.choices, [field.name]: { status: "loading", choices: [] } };
    void this.fetchChoices(field);
  }

  /* ---------- Values ---------- */

  private valueOf(field: Field): HalFormValue {
    return this.values[field.name] ?? this.starts[field.name];
  }
  /** Every field's current value */
  private get current(): HalFormValues {
    return Object.fromEntries(this.fields.map((f) => [f.name, this.valueOf(f)]));
  }
  private change(field: Field, value: HalFormValue) {
    const values = { ...this.current, [field.name]: value };
    if (!this.emit<HalFormValuesChange>("tc-values-change", { values, name: field.name, value }, { cancelable: true })) {
      this.requestUpdate();
      return false;
    }
    this.values = values;
    if (this.errors[field.name]) this.cleared = new Set([...this.cleared, field.name]);
    // A shown message is checked again as it's fixed; a field not yet complained about waits until it's left
    if (this.problems[field.name]) this.check(field, value);
    if (this.outcome) this.outcome = null;
    return true;
  }
  private wire(field: Field, value: HalFormValue): HalFormWireValue {
    if (field.kind === "number" || field.kind === "range") return value === "" ? null : Number(value);
    return value;
  }
  private get wireValues() {
    return Object.fromEntries(this.fields.map((f) => [f.name, this.wire(f, this.valueOf(f))]));
  }

  /* ---------- Checking ---------- */

  /** The field's own element, for what only the browser can tell (a malformed email, a half-typed number) */
  private controlOf(field: Field) {
    return [...this.querySelectorAll<HTMLElement>("[data-field]")].find((el) => el.dataset.field === field.name);
  }

  private problemWith(field: Field, value: HalFormValue): string {
    const { prop, kind } = field;
    const w = this.words;
    if (kind === "hidden") return "";
    if (field.choicesFrom !== "none") {
      const count = Array.isArray(value) ? value.length : value ? 1 : 0;
      const min = num(prop.options?.minItems);
      const max = num(prop.options?.maxItems);
      if (prop.required && !count) return w.complete;
      if (min !== undefined && count < min) return w.tooFew(min);
      if (max !== undefined && field.multiple && count > max) return w.tooMany(max);
      return "";
    }
    if (kind === "check") return prop.required && !value ? w.complete : "";
    const input = this.controlOf(field)?.querySelector<HTMLInputElement>("input,textarea");
    if (input?.validity?.badInput) return w.format;
    const text = String(value ?? "");
    if (!text) return prop.required ? w.complete : "";
    if (input?.validity?.typeMismatch) return w.format;
    if (prop.regex) {
      let rx: RegExp | null = null;
      for (const flags of ["v", "u"]) {
        try {
          rx = new RegExp(`^(?:${prop.regex})$`, flags);
          break;
        } catch {
          // Not valid with these flags: an unusable pattern is ignored, as the spec says
        }
      }
      if (rx && !rx.test(text)) return w.format;
    }
    const minLength = num(prop.minLength);
    const maxLength = num(prop.maxLength);
    if (minLength !== undefined && text.length < minLength) return w.tooShort(minLength);
    if (maxLength !== undefined && text.length > maxLength) return w.tooLong(maxLength);
    if (kind === "number" || kind === "range") {
      const n = Number(text);
      const min = num(prop.min);
      const max = num(prop.max);
      const step = num(prop.step);
      if (min !== undefined && n < min) return w.below(min);
      if (max !== undefined && n > max) return w.above(max);
      if (step !== undefined && step > 0) {
        const steps = (n - (min ?? 0)) / step;
        if (Math.abs(steps - Math.round(steps)) > 1e-6) return w.step(step);
      }
    }
    return "";
  }

  private check(field: Field, value = this.valueOf(field)) {
    const problem = this.problemWith(field, value);
    if ((this.problems[field.name] ?? "") === problem) return;
    const { [field.name]: _gone, ...rest } = this.problems;
    this.problems = problem ? { ...rest, [field.name]: problem } : rest;
  }

  private onLeave = (e: FocusEvent) => {
    const el = (e.target as Element).closest<HTMLElement>("[data-field]");
    if (!el || el.contains(e.relatedTarget as Node | null)) return;
    const field = this.fields.find((f) => f.name === el.dataset.field);
    if (field) this.check(field);
  };

  /* ---------- Sending ---------- */

  private onSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    if (this.sending || !this.chosen || !this.target) return;
    const problems: Record<string, string> = {};
    for (const field of this.fields) {
      const problem = this.problemWith(field, this.valueOf(field));
      if (problem) problems[field.name] = problem;
    }
    this.problems = problems;
    const names = Object.keys(problems);
    if (names.length) {
      this.outcome = { kind: "problems", text: this.words.problems(names.length) };
      const first = this.fields.find((f) => problems[f.name]);
      await this.updateComplete;
      if (first) this.controlOf(first)?.querySelector<HTMLElement>("input,textarea,button")?.focus();
      return;
    }
    const values = this.wireValues;
    const request = buildHalRequest(this.chosen.template, this.target, values);
    if (!this.emit<HalFormSubmit>("tc-submit", { ...request, values, templateKey: this.chosen.key }, { cancelable: true })) return;
    this.sending = true;
    this.outcome = null;
    const w = this.words;
    try {
      const response = await this.send(request.url, { method: request.method, headers: request.headers, body: request.body });
      this.outcome = response.ok ? { kind: "sent", text: w.sent } : { kind: "failed", text: w.refused(response.status, await this.detailOf(response)) };
      this.emit<HalFormResponse>("tc-response", { ok: response.ok, status: response.status, response, values });
    } catch (error) {
      this.outcome = { kind: "failed", text: w.unreachable };
      this.emit<HalFormError>("tc-error", { phase: "submit", error });
    } finally {
      this.sending = false;
    }
  };

  /** The server's own words for a refusal (a problem document's `detail` or `title`, or a `message`), leaving the body unread for the page */
  private async detailOf(response: Response) {
    try {
      const body = (await response.clone().json()) as Record<string, unknown>;
      const said = body.detail ?? body.message ?? body.title;
      return typeof said === "string" ? said : "";
    } catch {
      return "";
    }
  }

  /* ---------- Rendering ---------- */

  private shownProblem(field: Field) {
    return this.problems[field.name] || (this.cleared.has(field.name) ? "" : (this.errors[field.name] ?? ""));
  }

  private renderLabel(field: Field) {
    return html`${field.label}${field.prop.required ? html` <span class="ui-hal__req">${this.words.required}</span>` : nothing}`;
  }

  private renderInput(field: Field, i: number, problem: string) {
    const { prop, kind } = field;
    const value = String(this.valueOf(field) ?? "");
    const errorId = problem ? `${this.uid}-${i}-error` : undefined;
    const onInput = (e: Event) => this.change(field, (e.target as HTMLInputElement).value);
    if (kind === "textarea") {
      return html`<textarea
        name=${field.name}
        .value=${live(value)}
        rows=${num(prop.rows) ?? 5}
        cols=${num(prop.cols) ?? 40}
        placeholder=${ifDefined(prop.placeholder)}
        minlength=${ifDefined(num(prop.minLength))}
        maxlength=${ifDefined(num(prop.maxLength))}
        ?required=${!!prop.required}
        ?readonly=${!!prop.readOnly}
        aria-invalid=${problem ? "true" : "false"}
        aria-describedby=${ifDefined(errorId)}
        @input=${onInput}
      ></textarea>`;
    }
    const numeric = kind === "number" || kind === "range";
    const input = html`<input
      type=${field.inputType as "text"}
      name=${field.name}
      .value=${live(value)}
      placeholder=${ifDefined(prop.placeholder)}
      pattern=${ifDefined(prop.regex || undefined)}
      minlength=${ifDefined(num(prop.minLength))}
      maxlength=${ifDefined(num(prop.maxLength))}
      min=${ifDefined(numeric ? num(prop.min) : undefined)}
      max=${ifDefined(numeric ? num(prop.max) : undefined)}
      step=${ifDefined(numeric ? num(prop.step) : undefined)}
      ?required=${!!prop.required}
      ?readonly=${!!prop.readOnly && kind !== "range"}
      ?disabled=${!!prop.readOnly && kind === "range"}
      aria-invalid=${problem ? "true" : "false"}
      aria-describedby=${ifDefined(errorId)}
      @input=${onInput}
    />`;
    return kind === "range" ? html`<span class="ui-hal__range">${input}<output class="ui-hal__range-value">${value}</output></span>` : input;
  }

  private renderChoices(field: Field, i: number, problem: string) {
    const { prop, kind, multiple } = field;
    const state = this.choices[field.name];
    const w = this.words;
    const errorId = problem ? `${this.uid}-${i}-error` : undefined;
    if (!state || state.status === "loading") {
      return html`<div class="ui-hal__group"><span class="ui-hal__label">${this.renderLabel(field)}</span><p class="ui-hal__note">${w.optionsLoading}</p></div>`;
    }
    if (state.status === "failed") {
      return html`<div class="ui-hal__group">
        <span class="ui-hal__label">${this.renderLabel(field)}</span>
        <p class="ui-hal__note" data-tone="danger">${w.optionsFailed}</p>
        <button type="button" class="ui-hal__retry" @click=${() => this.retryChoices(field)}>${w.retry}<span class="tc-sr-only">: ${field.label}</span></button>
      </div>`;
    }
    const value = this.valueOf(field);
    const picked = Array.isArray(value) ? value : value ? [String(value)] : [];
    if (kind === "list") {
      // tc-settings-host keeps the shared field styles out of the list's own input; a real <label> names the list
      return html`<div class="ui-hal__group tc-settings-host">
        <label class="ui-hal__label" id=${`${this.uid}-${i}-label`} for=${`${this.uid}-${i}`}>${this.renderLabel(field)}</label>
        <tc-combobox
          id=${`${this.uid}-${i}`}
          empty-text=${w.noResults}
          placeholder=${prop.placeholder ?? "Search…"}
          ?single=${!multiple}
          ?required=${!!prop.required}
          ?disabled=${!!prop.readOnly}
          ?invalid=${!!problem}
          .options=${state.choices}
          .value=${picked}
          @tc-value-change=${(e: CustomEvent<ComboboxValueChange>) => {
            e.stopPropagation();
            if (!this.change(field, multiple ? e.detail.value : (e.detail.value[0] ?? ""))) e.preventDefault();
          }}
        ></tc-combobox>
      </div>`;
    }
    return html`<fieldset class="ui-hal__group" aria-describedby=${ifDefined(errorId)}>
      <legend class="ui-hal__label">${this.renderLabel(field)}</legend>
      ${state.choices.map(
        (c) => html`<label class="tc-settings-row"
          ><input
            type=${kind === "checks" ? "checkbox" : "radio"}
            name=${`${this.uid}-${i}`}
            value=${c.value}
            .checked=${live(picked.includes(c.value))}
            ?disabled=${!!prop.readOnly}
            @change=${(e: Event) => {
              const on = (e.target as HTMLInputElement).checked;
              // The list as it is now: two quick clicks can land before a render
              const now = this.valueOf(field);
              const list = Array.isArray(now) ? now : [];
              if (kind === "checks") this.change(field, on ? [...list, c.value] : list.filter((v) => v !== c.value));
              else this.change(field, multiple ? [c.value] : c.value);
            }}
          /><span>${c.label}</span></label
        >`,
      )}
    </fieldset>`;
  }

  private renderField(field: Field, i: number) {
    if (field.kind === "hidden") return nothing;
    const problem = this.shownProblem(field);
    const { prop } = field;
    let body: unknown;
    if (field.choicesFrom !== "none") body = this.renderChoices(field, i, problem);
    else if (field.kind === "check") {
      body = html`<label class="tc-settings-row"
        ><input
          type="checkbox"
          name=${field.name}
          .checked=${live(!!this.valueOf(field))}
          ?required=${!!prop.required}
          ?disabled=${!!prop.readOnly}
          aria-invalid=${problem ? "true" : "false"}
          aria-describedby=${ifDefined(problem ? `${this.uid}-${i}-error` : undefined)}
          @change=${(e: Event) => this.change(field, (e.target as HTMLInputElement).checked)}
        /><span>${this.renderLabel(field)}</span></label
      >`;
    } else {
      body = html`<label class="tc-settings-field"><span>${this.renderLabel(field)}</span>${this.renderInput(field, i, problem)}</label>`;
    }
    return html`<div class="ui-hal__field" data-field=${field.name} data-kind=${field.kind}>
      ${body} ${problem ? html`<p class="ui-hal__error" id=${`${this.uid}-${i}-error`}><span class="ui-hal__mark" aria-hidden="true">!</span>${problem}</p>` : nothing}
    </div>`;
  }

  private renderMessage(text: string, retry = false) {
    return html`<div class="ui-hal__message" role=${retry ? "alert" : "status"}>
      <p>${text}</p>
      ${retry ? html`<button type="button" class="ui-hal__retry" @click=${this.retryForm}>${this.words.retry}</button>` : nothing}
    </div>`;
  }

  protected override render() {
    const id = this.uid;
    const w = this.words;
    const title = this.heading || this.chosen?.template.title || "Form";
    const head = cardHead({ icon: formIcon, title, subtitle: this.description, id: `${id}-title` });
    if (!this.resource && this.phase === "loading") return html`${head}<div class="ui-hal__card tc-settings">${this.renderMessage(w.loading)}</div>`;
    if (!this.resource && this.phase === "failed") return html`${head}<div class="ui-hal__card tc-settings">${this.renderMessage(w.loadFailed, true)}</div>`;
    if (!this.chosen) return html`${head}<div class="ui-hal__card tc-settings">${this.renderMessage(w.invalid)}</div>`;
    if (!this.target) return html`${head}<div class="ui-hal__card tc-settings">${this.renderMessage(w.noTarget)}</div>`;
    const outcome = this.outcome;
    return html`${head}
      <form class="ui-hal__card tc-settings" novalidate aria-labelledby=${`${id}-title`} aria-busy=${this.sending ? "true" : "false"} @submit=${this.onSubmit} @focusout=${this.onLeave}>
        <fieldset class="ui-hal__fields" ?disabled=${this.sending}>${this.fields.map((f, i) => this.renderField(f, i))}</fieldset>
        <div class="ui-hal__foot">
          <button type="submit" data-variant="primary" ?disabled=${this.sending}>${this.sending ? w.sending : w.submit}</button>
          <p class="ui-hal__outcome" role="status" data-kind=${ifDefined(outcome?.kind)}>
            ${outcome ? html`<span class="ui-hal__mark" aria-hidden="true">${outcome.kind === "sent" ? "✓" : "!"}</span>${outcome.text}` : nothing}
          </p>
        </div>
      </form>`;
  }

  static override css =
    settingsCss +
    /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="hal"] {
  position: relative;
  display: block;
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="hal"] {
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 100%;
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
/* A colour swatch's width – override it on the element */
[data-ui="hal"] { --tc-hal-swatch: 64px; }
[data-ui="hal"] *, [data-ui="hal"] *::before, [data-ui="hal"] *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *).ui-hal__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-hal__fields.ui-hal__fields { padding: var(--tc-space-4); gap: var(--tc-space-4); }
.ui-hal__field { display: grid; gap: var(--tc-space-1-5); min-width: 0; }
.ui-hal__group.ui-hal__group { display: grid; gap: var(--tc-space-1-5); min-width: 0; }
.ui-hal__label { padding: 0; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
.ui-hal__req { margin-left: var(--tc-space-1); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); }
.ui-hal__note.ui-hal__note { color: var(--tc-text-muted); }
.ui-hal__note[data-tone="danger"].ui-hal__note[data-tone="danger"] { color: var(--tc-status-danger-fg); }
.ui-hal__error.ui-hal__error { display: flex; align-items: baseline; gap: var(--tc-space-1); color: var(--tc-status-danger-fg); }
.ui-hal__mark { flex: none; font-weight: var(--tc-font-weight-strong); }
.ui-hal__range { display: flex; align-items: center; gap: var(--tc-space-3); min-width: 0; }
.ui-hal__range-value { flex: none; min-width: var(--tc-space-8); font-weight: var(--tc-font-weight-regular); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; text-align: right; }
[data-ui="hal"] .tc-settings input[type="color"] { width: var(--tc-hal-swatch); padding: var(--tc-space-1); cursor: pointer; }
/* ----- The foot: Submit, and how it went ----- */
.ui-hal__foot { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2) var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-hal__outcome.ui-hal__outcome { display: flex; flex: 1 1 0; align-items: baseline; gap: var(--tc-space-1); min-width: 0; color: var(--tc-text-secondary); }
.ui-hal__outcome[data-kind="sent"].ui-hal__outcome { color: var(--tc-status-success-fg); }
.ui-hal__outcome[data-kind="failed"].ui-hal__outcome, .ui-hal__outcome[data-kind="problems"].ui-hal__outcome { color: var(--tc-status-danger-fg); }
.ui-hal__message { display: grid; justify-items: start; gap: var(--tc-space-2); padding: var(--tc-space-6) var(--tc-space-4); }
@media (forced-colors: active) {
  .ui-hal__error.ui-hal__error, .ui-hal__outcome.ui-hal__outcome { color: CanvasText; }
}
`;
}

if (!customElements.get("tc-hal-form")) customElements.define("tc-hal-form", TcHalForm);

declare global {
  interface HTMLElementTagNameMap {
    "tc-hal-form": TcHalForm;
  }
}
