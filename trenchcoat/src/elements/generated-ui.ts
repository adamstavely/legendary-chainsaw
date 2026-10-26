import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { TcElement } from "./internal/base";
import type { Look } from "./internal/look";
import "./data-table";
import type { DataColumn, DataRow } from "./data-table";
import "./kpi-chart";
import type { KpiSeries } from "./kpi-chart";
import "./stepper-form";
import type { StepperChoice, TcStepperField } from "./stepper-form";
import { structuredOutputParse } from "./structured-output";

/*
 * <tc-generated-ui> – a model's answer drawn as the library's own components. The model writes a small JSON spec
 * (documented below and on the docs page); the element checks every block and draws it with tc-data-table,
 * tc-kpi-chart, metric tiles in change-summary's style, a form of tc-stepper-form fields, callouts and plain text.
 * Anything it doesn't know, or that breaks the format, falls back to its text – an answer never fails as a whole.
 * Nothing in the spec is ever rendered as HTML: every string is text.
 *
 *   <tc-generated-ui .spec=${{ blocks: [{ type: "metric", label: "Revenue", value: "$412K", change: "Up 6%", tone: "good" }] }}></tc-generated-ui>
 *
 * The spec may also be the model's raw text while it streams (`streaming`): it is parsed tolerantly, each top-level
 * block shows once it has closed, and the one still arriving is a placeholder. Form submits and action buttons come
 * back as one event, tc-action.
 *
 * The format – a spec is { blocks: Block[] }, a Block[], or one Block:
 *   text     { type: "text", text, style?: "body" | "heading" | "muted" }          blank lines split paragraphs
 *   metric   { type: "metric", label, value, change?, tone?: "good" | "bad" | "neutral", direction?: "up" | "down" }
 *   table    { type: "table", title?, columns: [{ key, label, type?: "text" | "number" | "tag" | "link" }], rows: [{ … }] }
 *   chart    { type: "chart", title, value?, delta?, labels: string[], series: [{ label, values: number[] }], footer? }
 *   form     { type: "form", id, title?, submitLabel?, fields: [{ name, label, kind?, required?, placeholder?, hint?,
 *              value?, options?: [{ value, label, description? }], min?, max? }] }
 *            kind: "text" (default) | "email" | "number" | "url" | "date" | "textarea" | "select" | "choice"
 *   callout  { type: "callout", tone?: "info" | "success" | "warning" | "danger", title?, text?, children?, actions? }
 *   group    { type: "group", title?, layout?: "column" | "row" | "grid", children, actions? }
 *   actions  [{ id, label, primary? }] on a callout or a group – buttons that fire tc-action
 * Blocks nest inside callouts and groups, up to 6 levels.
 */

/* ---------- The format ---------- */

/** A button the model offers; pressing it fires tc-action with its id */
export type GeneratedUiAction = { id: string; label: string; primary?: boolean };
export type GeneratedUiText = { type: "text"; text: string; style?: "body" | "heading" | "muted" };
export type GeneratedUiMetric = { type: "metric"; label: string; value: string | number; change?: string; tone?: "good" | "bad" | "neutral"; direction?: "up" | "down" };
export type GeneratedUiColumn = { key: string; label: string; type?: "text" | "number" | "tag" | "link" };
export type GeneratedUiTable = { type: "table"; title?: string; columns: GeneratedUiColumn[]; rows: Record<string, string | number | boolean | null>[] };
export type GeneratedUiChart = { type: "chart"; title: string; value?: string; delta?: number; labels: string[]; series: { label: string; values: number[] }[]; footer?: string };
export type GeneratedUiFieldKind = "text" | "email" | "number" | "url" | "date" | "textarea" | "select" | "choice";
export type GeneratedUiOption = { value: string; label: string; description?: string };
export type GeneratedUiField = {
  name: string;
  label: string;
  kind?: GeneratedUiFieldKind;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  value?: string | number;
  options?: GeneratedUiOption[];
  min?: number;
  max?: number;
};
export type GeneratedUiForm = { type: "form"; id: string; title?: string; submitLabel?: string; fields: GeneratedUiField[] };
export type GeneratedUiTone = "info" | "success" | "warning" | "danger";
export type GeneratedUiCallout = { type: "callout"; tone?: GeneratedUiTone; title?: string; text?: string; children?: GeneratedUiBlock[]; actions?: GeneratedUiAction[] };
export type GeneratedUiGroup = { type: "group"; title?: string; layout?: "column" | "row" | "grid"; children: GeneratedUiBlock[]; actions?: GeneratedUiAction[] };
/** One block of a spec */
export type GeneratedUiBlock = GeneratedUiText | GeneratedUiMetric | GeneratedUiTable | GeneratedUiChart | GeneratedUiForm | GeneratedUiCallout | GeneratedUiGroup;
/** A whole answer: { blocks }, a list of blocks, or one block */
export type GeneratedUiSpec = { blocks: GeneratedUiBlock[] } | GeneratedUiBlock[] | GeneratedUiBlock;

/** A block that was drawn as text instead, and why ("/blocks/2/children/0": "unknown type “map”") */
export type GeneratedUiIssue = { path: string; message: string };
/** A form value as submitted: text fields as strings, number fields as numbers (empty ones left out) */
export type GeneratedUiValue = string | number;
/** tc-action */
export type GeneratedUiActionDetail = {
  /** "submit" for a form, "action" for a button */
  kind: "submit" | "action";
  /** The form's id or the button's id */
  action: string;
  /** Where the block sits in the spec, as a JSON Pointer path */
  block: string;
  /** A form's values by field name */
  values?: Record<string, GeneratedUiValue>;
};
/** tc-spec-check */
export type GeneratedUiSpecCheck = { issues: GeneratedUiIssue[] };

/* ---------- Checking ---------- */

type Ok =
  | { type: "text"; path: string; text: string; style: "body" | "heading" | "muted" }
  | { type: "metric"; path: string; label: string; value: string; change: string; tone: "good" | "bad" | "neutral"; direction: "up" | "down" }
  | { type: "table"; path: string; title: string; columns: DataColumn[]; rows: DataRow[] }
  | { type: "chart"; path: string; title: string; value: string; delta: number | undefined; labels: string[]; series: KpiSeries[]; footer: string }
  | { type: "form"; path: string; id: string; title: string; submitLabel: string; fields: FieldOk[] }
  | { type: "callout"; path: string; tone: GeneratedUiTone; title: string; text: string; children: Checked[]; actions: GeneratedUiAction[] }
  | { type: "group"; path: string; title: string; layout: "column" | "row" | "grid"; children: Checked[]; actions: GeneratedUiAction[] };
type FieldOk = { name: string; label: string; kind: GeneratedUiFieldKind; required: boolean; placeholder: string; hint: string; value: string; options: GeneratedUiOption[]; min?: number; max?: number };
type Fallback = { type: "fallback"; path: string; text: string; reason: string };
type Pending = { type: "pending"; path: string };
type Checked = Ok | Fallback | Pending;

const MAX_DEPTH = 6;
const KINDS: GeneratedUiFieldKind[] = ["text", "email", "number", "url", "date", "textarea", "select", "choice"];
const COLUMN_TYPES = ["text", "number", "tag", "link"];
const TONES: GeneratedUiTone[] = ["info", "success", "warning", "danger"];
const CHART_COLOURS = 6;

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown) => (typeof v === "string" ? v : typeof v === "number" && Number.isFinite(v) ? String(v) : undefined);
const optStr = (v: unknown) => (v === undefined || v === null ? "" : str(v));

/** Every piece of text in a block that couldn't be drawn, in order, for the fallback */
function textOf(v: unknown, depth = 0): string[] {
  if (depth > 8) return [];
  if (typeof v === "string") return v.trim() ? [v.trim()] : [];
  if (typeof v === "number" && Number.isFinite(v)) return [String(v)];
  if (Array.isArray(v)) return v.flatMap((x) => textOf(x, depth + 1));
  if (isObj(v))
    return Object.entries(v)
      .filter(([k]) => !["type", "id", "key", "kind", "tone", "style", "layout", "direction", "name", "primary", "required"].includes(k))
      .flatMap(([, x]) => textOf(x, depth + 1));
  return [];
}

class Checker {
  issues: GeneratedUiIssue[] = [];

  fallback(raw: unknown, path: string, reason: string): Fallback {
    this.issues.push({ path, message: reason });
    const words = textOf(raw);
    return { type: "fallback", path, text: words.join(" · ").slice(0, 2000), reason };
  }

  actions(raw: unknown, path: string): GeneratedUiAction[] {
    if (raw === undefined) return [];
    if (!Array.isArray(raw)) {
      this.issues.push({ path: `${path}/actions`, message: "actions should be a list – left out" });
      return [];
    }
    return raw.flatMap((a, i) => {
      if (isObj(a) && str(a.id) && str(a.label)) return [{ id: str(a.id)!, label: str(a.label)!, primary: a.primary === true }];
      this.issues.push({ path: `${path}/actions/${i}`, message: "an action needs an id and a label – left out" });
      return [];
    });
  }

  children(raw: unknown, path: string, depth: number): Checked[] | string {
    if (raw === undefined) return [];
    if (!Array.isArray(raw)) return "children should be a list of blocks";
    return raw.map((c, i) => this.block(c, `${path}/children/${i}`, depth + 1));
  }

  block(raw: unknown, path: string, depth: number): Checked {
    if (!isObj(raw)) return this.fallback(raw, path, typeof raw === "string" ? "a block should be an object – shown as text" : "a block should be an object");
    if (depth > MAX_DEPTH) return this.fallback(raw, path, `nested deeper than ${MAX_DEPTH} levels`);
    const t = raw.type;
    switch (t) {
      case "text": {
        const text = str(raw.text);
        if (text === undefined) return this.fallback(raw, path, "a text block needs text");
        const style = raw.style === "heading" || raw.style === "muted" ? raw.style : "body";
        return { type: "text", path, text, style };
      }
      case "metric": {
        const label = str(raw.label);
        const value = str(raw.value);
        if (!label || value === undefined) return this.fallback(raw, path, "a metric needs a label and a value");
        const tone = raw.tone === "good" || raw.tone === "bad" ? raw.tone : "neutral";
        const direction = raw.direction === "up" || raw.direction === "down" ? raw.direction : tone === "bad" ? "down" : "up";
        return { type: "metric", path, label, value, change: optStr(raw.change) ?? "", tone, direction };
      }
      case "table": {
        if (!Array.isArray(raw.columns) || !raw.columns.length) return this.fallback(raw, path, "a table needs columns");
        if (!Array.isArray(raw.rows)) return this.fallback(raw, path, "a table needs rows");
        const columns: DataColumn[] = [];
        for (const c of raw.columns) {
          if (!isObj(c) || !str(c.key) || !str(c.label)) return this.fallback(raw, path, "every column needs a key and a label");
          const type = typeof c.type === "string" && COLUMN_TYPES.includes(c.type) ? (c.type as DataColumn["type"]) : "text";
          columns.push({ key: str(c.key)!, label: str(c.label)!, type, editable: false });
        }
        const rows: DataRow[] = [];
        for (const [i, r] of raw.rows.entries()) {
          if (!isObj(r)) return this.fallback(raw, path, `row ${i + 1} isn't an object`);
          const row: DataRow = { id: `r${i}` };
          for (const c of columns) {
            const v = r[c.key];
            if (v === undefined || v === null) continue;
            if (typeof v === "boolean") row[c.key] = v ? "Yes" : "No";
            else if (str(v) !== undefined) row[c.key] = typeof v === "number" ? v : String(v);
            else return this.fallback(raw, path, `row ${i + 1}, “${c.key}” isn't text or a number`);
          }
          rows.push(row);
        }
        return { type: "table", path, title: optStr(raw.title) ?? "", columns, rows };
      }
      case "chart": {
        const title = str(raw.title);
        if (!title) return this.fallback(raw, path, "a chart needs a title");
        const labels = Array.isArray(raw.labels) ? raw.labels.map(str) : null;
        if (!labels || !labels.length || labels.some((l) => l === undefined)) return this.fallback(raw, path, "a chart needs labels – a list of text");
        if (!Array.isArray(raw.series) || !raw.series.length) return this.fallback(raw, path, "a chart needs at least one series");
        const series: KpiSeries[] = [];
        for (const [k, s] of raw.series.entries()) {
          if (!isObj(s) || !str(s.label) || !Array.isArray(s.values)) return this.fallback(raw, path, `series ${k + 1} needs a label and values`);
          if (s.values.length !== labels.length || s.values.some((v) => typeof v !== "number" || !Number.isFinite(v)))
            return this.fallback(raw, path, `series ${k + 1} needs one number per label (${labels.length})`);
          series.push({ label: str(s.label)!, color: `var(--tc-chart-${(k % CHART_COLOURS) + 1})`, values: s.values as number[] });
        }
        const delta = typeof raw.delta === "number" && Number.isFinite(raw.delta) ? raw.delta : undefined;
        return { type: "chart", path, title, value: optStr(raw.value) ?? "", delta, labels: labels as string[], series, footer: optStr(raw.footer) ?? "" };
      }
      case "form": {
        const id = str(raw.id);
        if (!id) return this.fallback(raw, path, "a form needs an id");
        if (!Array.isArray(raw.fields) || !raw.fields.length) return this.fallback(raw, path, "a form needs fields");
        const fields: FieldOk[] = [];
        const names = new Set<string>();
        for (const [i, f] of raw.fields.entries()) {
          if (!isObj(f) || !str(f.name) || !str(f.label)) return this.fallback(raw, path, `field ${i + 1} needs a name and a label`);
          const name = str(f.name)!;
          if (names.has(name)) return this.fallback(raw, path, `two fields are named “${name}”`);
          names.add(name);
          const kind = f.kind === undefined ? "text" : (f.kind as GeneratedUiFieldKind);
          if (!KINDS.includes(kind)) return this.fallback(raw, path, `field “${name}” has an unknown kind “${String(f.kind)}”`);
          const options: GeneratedUiOption[] = [];
          if (kind === "select" || kind === "choice") {
            if (!Array.isArray(f.options) || !f.options.length) return this.fallback(raw, path, `field “${name}” needs options`);
            for (const o of f.options) {
              if (!isObj(o) || str(o.value) === undefined || !str(o.label)) return this.fallback(raw, path, `every option of “${name}” needs a value and a label`);
              options.push({ value: str(o.value)!, label: str(o.label)!, description: optStr(o.description) || undefined });
            }
          }
          const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
          fields.push({
            name,
            label: str(f.label)!,
            kind,
            required: f.required === true,
            placeholder: optStr(f.placeholder) ?? "",
            hint: optStr(f.hint) ?? "",
            value: optStr(f.value) ?? "",
            options,
            min: num(f.min),
            max: num(f.max),
          });
        }
        return { type: "form", path, id, title: optStr(raw.title) ?? "", submitLabel: optStr(raw.submitLabel) || "Submit", fields };
      }
      case "callout": {
        const children = this.children(raw.children, path, depth);
        if (typeof children === "string") return this.fallback(raw, path, children);
        const title = optStr(raw.title) ?? "";
        const text = optStr(raw.text) ?? "";
        if (!title && !text && !children.length) return this.fallback(raw, path, "a callout needs a title, text or children");
        const tone = TONES.includes(raw.tone as GeneratedUiTone) ? (raw.tone as GeneratedUiTone) : "info";
        return { type: "callout", path, tone, title, text, children, actions: this.actions(raw.actions, path) };
      }
      case "group": {
        const children = this.children(raw.children, path, depth);
        if (typeof children === "string") return this.fallback(raw, path, children);
        const layout = raw.layout === "row" || raw.layout === "grid" ? raw.layout : "column";
        return { type: "group", path, title: optStr(raw.title) ?? "", layout, children, actions: this.actions(raw.actions, path) };
      }
      default:
        return this.fallback(raw, path, t === undefined ? "a block needs a type" : `unknown type “${String(t)}”`);
    }
  }
}

/** The top-level blocks of a spec, and the path each sits at */
function topLevel(spec: unknown): { raw: unknown; path: string }[] {
  if (Array.isArray(spec)) return spec.map((raw, i) => ({ raw, path: `/${i}` }));
  if (isObj(spec) && Array.isArray(spec.blocks)) return spec.blocks.map((raw, i) => ({ raw, path: `/blocks/${i}` }));
  if (spec === undefined || spec === null) return [];
  return [{ raw: spec, path: "" }];
}

/* ---------- Icons ---------- */

/* info, circle-check, triangle-alert, octagon-x after Lucide (ISC, lucide.dev) */
const TONE_ICONS: Record<GeneratedUiTone, TemplateResult> = {
  info: svg`<circle cx="8" cy="8" r="6.25"></circle><path d="M8 7.25v3.5"></path><path d="M8 5.25h.01"></path>`,
  success: svg`<circle cx="8" cy="8" r="6.25"></circle><path d="m5.5 8.25 1.75 1.75 3.25-3.5"></path>`,
  warning: svg`<path d="M14.5 12.5 9.1 3.1a1.25 1.25 0 0 0-2.2 0L1.5 12.5a1.25 1.25 0 0 0 1.1 1.9h10.8a1.25 1.25 0 0 0 1.1-1.9Z"></path><path d="M8 6.25v3"></path><path d="M8 11.75h.01"></path>`,
  danger: svg`<path d="M5.4 1.75h5.2l3.65 3.65v5.2l-3.65 3.65H5.4L1.75 10.6V5.4Z"></path><path d="m10 6-4 4M6 6l4 4"></path>`,
};
const toneIcon = (tone: GeneratedUiTone, look: Look) =>
  html`<svg class="ui-gui__callout-icon" viewBox="0 0 16 16" aria-hidden="true" stroke-width=${look === "clean" ? 1.2 : 1.5}>${TONE_ICONS[tone]}</svg>`;
const arrowIcon = (look: Look, down: boolean) =>
  html`<svg viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" stroke-width=${look === "clean" ? 1.25 : 1.6} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${down ? svg`<path d="M6 2.5v7M3 6.5l3 3 3-3"></path>` : svg`<path d="M6 9.5v-7M3 5.5l3-3 3 3"></path>`}</svg>`;
const dashIcon = (look: Look) =>
  html`<svg viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" stroke-width=${look === "clean" ? 1.25 : 1.6} stroke-linecap="round" aria-hidden="true">${svg`<path d="M3 6h6"></path>`}</svg>`;

const TONE_SAID: Record<GeneratedUiTone, string> = { info: "Note", success: "Success", warning: "Warning", danger: "Problem" };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const URL_RE = /^(https?:\/\/)?[^\s.]+\.[^\s]{2,}$/i;

let instances = 0;

/**
 * Renders a model's UI spec – tables, charts, metrics, forms, callouts, text – as the library's own elements, with
 * text for anything it can't draw.
 * @tag tc-generated-ui
 * @fires tc-action - A form was submitted or an action pressed ({ kind: "submit" | "action", action, block, values? })
 * @fires tc-spec-check - The spec settled (not streaming) and what fell back to text changed ({ issues })
 */
export class TcGeneratedUi extends TcElement {
  static override ui = "gui";

  /** The spec: { blocks }, a list of blocks or one block – or the model's JSON text, which may still be arriving */
  @property({ attribute: false }) accessor spec: GeneratedUiSpec | string | null | undefined = undefined;
  /** The spec text is still arriving: blocks show as they close, the one being written is a placeholder */
  @property({ type: Boolean, reflect: true }) accessor streaming = false;
  /** Show why a block fell back to text, under it – for development and evaluation, not for end users */
  @property({ type: Boolean, attribute: "show-issues" }) accessor showIssues = false;
  /** The heading level of text headings, group and form titles (2–6); the tables' own titles stay h3 */
  @property({ type: Number, attribute: "heading-level" }) accessor headingLevel = 3;

  /** @internal Form values by form path, then field name */
  @state() accessor formValues: Record<string, Record<string, string>> = {};
  /** @internal What's said in the status region */
  @state() accessor message = "";

  private readonly uid = `tc-gui${++instances}`;
  private blocks: Checked[] = [];
  private found: GeneratedUiIssue[] = [];
  private lastReport = "";

  /** What fell back to text, and why, by JSON Pointer path */
  get issues(): GeneratedUiIssue[] {
    return this.found;
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (!changed.has("spec") && !changed.has("streaming")) return;
    const checker = new Checker();
    let spec: unknown = this.spec;
    let closed: Set<string> | null = null;
    if (typeof spec === "string") {
      const parsed = structuredOutputParse(spec, !this.streaming);
      spec = parsed.value;
      closed = this.streaming ? parsed.closed : null;
      if (parsed.error && spec !== undefined) checker.issues.push({ path: "", message: `the spec stops being JSON at line ${parsed.error.line} – the rest is left out` });
      if (parsed.error && spec === undefined) {
        // Not JSON at all: the model answered in prose – show it as it is
        const raw = this.spec as string;
        this.blocks = raw.trim() ? [{ type: "text", path: "", text: raw, style: "body" }] : [];
        this.found = parsed.error ? [{ path: "", message: `not a spec – ${parsed.error.message.toLowerCase()}; shown as text` }] : [];
        return;
      }
    }
    const top = topLevel(spec);
    this.blocks = top.map(({ raw, path }) => (closed && !closed.has(path) ? ({ type: "pending", path } as Pending) : checker.block(raw, path, 1)));
    // A spec still arriving shows at least one placeholder
    if (this.streaming && !this.blocks.some((b) => b.type === "pending")) this.blocks.push({ type: "pending", path: "~next" });
    this.found = checker.issues;
    // Forms start with their fields' values; what people typed survives a new spec with the same form
    const values = { ...this.formValues };
    let changedValues = false;
    const seed = (list: Checked[]) => {
      for (const b of list) {
        if (b.type === "form") {
          const key = `${b.path}#${b.id}`;
          const mine = values[key] ?? {};
          const next = { ...mine };
          for (const f of b.fields) if (!(f.name in next)) next[f.name] = f.kind === "choice" && !f.value && f.required ? "" : f.value;
          if (Object.keys(next).length !== Object.keys(mine).length) {
            values[key] = next;
            changedValues = true;
          }
        } else if (b.type === "callout" || b.type === "group") seed(b.children);
      }
    };
    seed(this.blocks);
    if (changedValues) this.formValues = values;
  }

  protected override updated(changed: PropertyValues) {
    // Fields other than plain inputs get their label, message and hint wiring from their tc-stepper-field
    this.querySelectorAll<HTMLElement>(".ui-gui__wired").forEach((control) => {
      const field = control.closest<TcStepperField>("tc-stepper-field");
      const w = field?.wiring;
      if (!w) return;
      control.id = w.id;
      if (w.invalid) control.setAttribute("aria-invalid", "true");
      else control.removeAttribute("aria-invalid");
      if (w.describedBy) control.setAttribute("aria-describedby", w.describedBy);
      else control.removeAttribute("aria-describedby");
    });
    if ((changed.has("spec") || changed.has("streaming")) && !this.streaming) {
      const key = JSON.stringify(this.found);
      if (key !== this.lastReport) {
        this.lastReport = key;
        this.emit<GeneratedUiSpecCheck>("tc-spec-check", { issues: this.found });
      }
    }
  }

  /* ---------- Forms ---------- */

  private setValue(key: string, name: string, value: string, field?: Element | null) {
    this.formValues = { ...this.formValues, [key]: { ...this.formValues[key], [name]: value } };
    // A message clears as soon as the value changes
    const f = field?.closest<TcStepperField>("tc-stepper-field");
    if (f?.wiring.invalid) {
      f.flag(null);
      void f.updateComplete.then(() => this.requestUpdate());
    }
  }

  private problem(f: FieldOk, value: string): string | null {
    const v = value.trim();
    if (!v) return f.required ? (f.kind === "select" || f.kind === "choice" ? "Choose one" : "Fill this in") : null;
    if (f.kind === "email" && !EMAIL.test(v)) return "That doesn't look like an email address";
    if (f.kind === "url" && !URL_RE.test(v)) return "That doesn't look like a web address";
    if (f.kind === "number") {
      const n = Number(v);
      if (!Number.isFinite(n)) return "Enter a number";
      if (f.min !== undefined && n < f.min) return `Must be ${f.min} or more`;
      if (f.max !== undefined && n > f.max) return `Must be ${f.max} or less`;
    }
    return null;
  }

  private async submit(e: SubmitEvent, b: Extract<Ok, { type: "form" }>) {
    e.preventDefault();
    const key = `${b.path}#${b.id}`;
    const vals = this.formValues[key] ?? {};
    const form = e.currentTarget as HTMLFormElement;
    let first: HTMLElement | null = null;
    let bad = 0;
    for (const f of b.fields) {
      const msg = this.problem(f, vals[f.name] ?? "");
      const field = form.querySelector<TcStepperField>(`tc-stepper-field[data-name="${CSS.escape(f.name)}"]`);
      field?.flag(msg);
      if (msg) {
        bad++;
        first ??= field?.querySelector<HTMLElement>("input, textarea, select, [role='radio'][tabindex='0'], [role='radio']") ?? null;
      }
    }
    await Promise.all([...form.querySelectorAll<TcStepperField>("tc-stepper-field")].map((f) => f.updateComplete));
    this.requestUpdate();
    await this.updateComplete;
    if (bad) {
      this.message = `${bad} ${bad === 1 ? "field needs" : "fields need"} attention`;
      first?.focus();
      return;
    }
    const values: Record<string, GeneratedUiValue> = {};
    for (const f of b.fields) {
      const v = (vals[f.name] ?? "").trim();
      if (!v) continue;
      values[f.name] = f.kind === "number" ? Number(v) : v;
    }
    this.message = "";
    this.emit<GeneratedUiActionDetail>("tc-action", { kind: "submit", action: b.id, block: b.path, values });
  }

  /* ---------- Render ---------- */

  private heading(text: string, cls: string) {
    const level = Math.min(6, Math.max(2, Math.round(this.headingLevel) || 3));
    return html`<p class=${cls} role="heading" aria-level=${level}>${text}</p>`;
  }

  private actions(list: GeneratedUiAction[], path: string) {
    if (!list.length) return nothing;
    return html`<div class="ui-gui__actions">${list.map(
      (a) => html`<button type="button" class="ui-gui__btn" ?data-primary=${a.primary} @click=${() => this.emit<GeneratedUiActionDetail>("tc-action", { kind: "action", action: a.id, block: path })}>${a.label}</button>`,
    )}</div>`;
  }

  private paragraphs(text: string, cls: string, muted = false) {
    return text
      .split(/\n\s*\n/)
      .filter((p) => p.trim())
      .map((p) => html`<p class=${cls} ?data-muted=${muted}>${p.trim()}</p>`);
  }

  private field(f: FieldOk, key: string, anyRequired: boolean) {
    const value = this.formValues[key]?.[f.name] ?? "";
    const set = (e: Event) => this.setValue(key, f.name, (e.target as HTMLInputElement).value, e.target as Element);
    let control: TemplateResult;
    if (f.kind === "textarea")
      control = html`<textarea class="ui-gui__control ui-gui__textarea ui-gui__wired" name=${f.name} rows="3" placeholder=${ifDefined(f.placeholder || undefined)} ?required=${f.required} .value=${live(value)} @input=${set}></textarea>`;
    else if (f.kind === "select")
      control = html`<span class="ui-gui__select-wrap"><select class="ui-gui__control ui-gui__select ui-gui__wired" name=${f.name} ?required=${f.required} .value=${live(value)} @change=${set}>
        <option value="" ?selected=${value === ""}>${f.placeholder || "Choose…"}</option>
        ${f.options.map((o) => html`<option value=${o.value} ?selected=${o.value === value}>${o.label}</option>`)}
      </select></span>`;
    else if (f.kind === "choice")
      control = html`<tc-stepper-choices
        class="ui-gui__wired"
        name=${f.name}
        label=${f.label}
        ?required=${f.required}
        .options=${f.options.map((o): StepperChoice => ({ value: o.value, title: o.label, description: o.description }))}
        .value=${value}
        @tc-value-change=${(e: CustomEvent<{ value: string }>) => {
          e.stopPropagation();
          this.setValue(key, f.name, e.detail.value, e.target as Element);
        }}
      ></tc-stepper-choices>`;
    else {
      const type = f.kind === "number" ? "text" : f.kind === "text" ? "text" : f.kind;
      control = html`<tc-stepper-input><input
        name=${f.name}
        type=${type}
        inputmode=${ifDefined(f.kind === "number" ? "decimal" : undefined)}
        autocomplete=${f.kind === "email" ? "email" : "off"}
        placeholder=${ifDefined(f.placeholder || undefined)}
        ?required=${f.required}
        .value=${live(value)}
        @input=${set}
      /></tc-stepper-input>`;
    }
    return html`<tc-stepper-field data-name=${f.name} name=${f.name} label=${f.label} hint=${ifDefined(f.hint || undefined)} ?optional=${anyRequired && !f.required}>${control}</tc-stepper-field>`;
  }

  private block(b: Checked, look: Look): TemplateResult | typeof nothing {
    switch (b.type) {
      case "pending":
        return html`<div class="ui-gui__pending" data-path=${b.path} aria-hidden="true"><span></span><span></span><span></span></div>`;
      case "fallback":
        return html`<div class="ui-gui__fallback" data-path=${b.path}>
          ${b.text ? this.paragraphs(b.text, "ui-gui__text") : nothing}
          ${this.showIssues ? html`<p class="ui-gui__reason">Shown as text: ${b.reason}</p>` : nothing}
        </div>`;
      case "text":
        if (b.style === "heading") return this.heading(b.text, "ui-gui__heading");
        return html`<div class="ui-gui__prose" data-path=${b.path}>${this.paragraphs(b.text, "ui-gui__text", b.style === "muted")}</div>`;
      case "metric":
        return html`<div class="ui-gui__metric" data-path=${b.path}>
          <span class="ui-gui__metric-label">${b.label}</span>
          <span class="ui-gui__metric-value">${b.value}</span>
          ${b.change
            ? html`<span class="ui-gui__metric-change">
                <span class="ui-gui__trend" data-tone=${b.tone} aria-hidden="true">${b.tone === "neutral" ? dashIcon(look) : arrowIcon(look, b.direction === "down")}</span>
                ${b.tone !== "neutral" ? html`<span class="ui-gui__sr">${b.tone === "good" ? "Good change: " : "Bad change: "}</span>` : nothing}<span>${b.change}</span>
              </span>`
            : nothing}
        </div>`;
      case "table":
        return html`<tc-data-table class="ui-gui__table" data-path=${b.path} readonly heading=${b.title || "Table"} .columns=${b.columns} .rows=${b.rows}></tc-data-table>`;
      case "chart":
        return html`<tc-kpi-chart class="ui-gui__chart" data-path=${b.path} heading=${b.title} value=${b.value} .delta=${b.delta} .labels=${b.labels} .series=${b.series} footer=${b.footer}></tc-kpi-chart>`;
      case "form": {
        const key = `${b.path}#${b.id}`;
        const anyRequired = b.fields.some((f) => f.required);
        const titleId = `${this.uid}-f${b.path.replace(/\W/g, "-")}`;
        return html`<form class="ui-gui__form" data-path=${b.path} novalidate aria-labelledby=${ifDefined(b.title ? titleId : undefined)} aria-label=${ifDefined(b.title ? undefined : "Form")} @submit=${(e: SubmitEvent) => void this.submit(e, b)}>
          ${b.title ? html`<p class="ui-gui__form-title" id=${titleId} role="heading" aria-level=${Math.min(6, Math.max(2, Math.round(this.headingLevel) || 3))}>${b.title}</p>` : nothing}
          <div class="ui-gui__form-card">
            <div class="ui-gui__fields">${b.fields.map((f) => this.field(f, key, anyRequired))}</div>
            <div class="ui-gui__form-foot"><button type="submit" class="ui-gui__btn" data-primary>${b.submitLabel}</button></div>
          </div>
        </form>`;
      }
      case "callout":
        return html`<div class="ui-gui__callout" data-path=${b.path} data-tone=${b.tone}>
          ${toneIcon(b.tone, look)}
          <div class="ui-gui__callout-body">
            <span class="ui-gui__sr">${TONE_SAID[b.tone]}: </span>
            ${b.title ? html`<p class="ui-gui__callout-title">${b.title}</p>` : nothing}
            ${b.text ? this.paragraphs(b.text, "ui-gui__text") : nothing}
            ${b.children.length ? html`<div class="ui-gui__stack">${b.children.map((c) => this.block(c, look))}</div>` : nothing}
            ${this.actions(b.actions, b.path)}
          </div>
        </div>`;
      case "group":
        return html`<section class="ui-gui__group" data-path=${b.path} aria-label=${ifDefined(b.title || undefined)}>
          ${b.title ? this.heading(b.title, "ui-gui__group-title") : nothing}
          <div class="ui-gui__stack" data-layout=${b.layout}>${b.children.map((c) => this.block(c, look))}</div>
          ${this.actions(b.actions, b.path)}
        </section>`;
    }
  }

  protected override render() {
    const look = this.resolvedLook;
    return html`<div
        class="ui-gui__blocks"
        aria-busy=${ifDefined(this.streaming ? "true" : undefined)}
        @tc-rows-change=${(e: Event) => e.stopPropagation()}
        @tc-selection-change=${(e: Event) => e.stopPropagation()}
        @tc-sort-change=${(e: Event) => e.stopPropagation()}
        @tc-index-change=${(e: Event) => e.stopPropagation()}
      >${this.blocks.map((b) => this.block(b, look))}</div>
      <span class="ui-gui__sr" role="status">${this.message}</span>`;
  }

  static override css = /* css */ `
[data-ui="gui"] {
  box-sizing: border-box;
  container-type: inline-size;
  width: 100%;
  min-width: 0;
  color: var(--tc-text-primary);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="gui"] *, [data-ui="gui"] *::before, [data-ui="gui"] *::after { box-sizing: border-box; }
.ui-gui__blocks, .ui-gui__stack { display: grid; gap: var(--tc-space-3); min-width: 0; }
.ui-gui__blocks > *, .ui-gui__stack > * { min-width: 0; }
/* The library's own components keep their size limits but fill a narrow column */
[data-ui="gui"] [data-ui="kpi"], [data-ui="gui"] [data-ui="dt"] { max-width: 100%; }
/* kpi-chart draws its lines with a stroke attribute, where var() doesn't resolve – the spec's colours are tokens */
${Array.from({ length: CHART_COLOURS }, (_, i) => `[data-ui="gui"] polyline[stroke="var(--tc-chart-${i + 1})"] { stroke: var(--tc-chart-${i + 1}); }`).join("\n")}
.ui-gui__stack[data-layout="row"] { grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); }
.ui-gui__stack[data-layout="grid"] { grid-template-columns: repeat(auto-fill, minmax(min(100%, 180px), 1fr)); }
/* Text: the answer's own voice, never HTML */
.ui-gui__prose { display: grid; gap: var(--tc-space-2); }
.ui-gui__text { margin: 0; color: var(--tc-text-primary); text-wrap: pretty; white-space: pre-line; overflow-wrap: anywhere; }
.ui-gui__text[data-muted] { color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-gui__text:not([data-muted]) { color: var(--tc-text-secondary); }
.ui-gui__heading, .ui-gui__group-title, .ui-gui__form-title { margin: 0; color: var(--tc-text-primary); font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-snug); }
:where([data-look="clean"], [data-look="clean"] *).ui-gui__heading,
:where([data-look="clean"], [data-look="clean"] *).ui-gui__group-title,
:where([data-look="clean"], [data-look="clean"] *).ui-gui__form-title { color: var(--tc-text-strong); font-weight: var(--tc-font-weight-medium); }
.ui-gui__group { display: grid; gap: var(--tc-space-2-5); min-width: 0; }
.ui-gui__heading + *, .ui-gui__group-title + * { margin-top: calc(var(--tc-space-1) * -1); }
/* Metric tiles: change-summary's trend marks on a tile – the tray in Standard, a hairline card in Clean */
.ui-gui__metric { display: grid; gap: var(--tc-space-0-5); align-content: start; min-width: 0; padding: var(--tc-space-3) var(--tc-space-3-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-gui__metric { border-radius: var(--tc-card-radius); background: var(--tc-surface-tray); }
:where([data-look="clean"], [data-look="clean"] *).ui-gui__metric { border-radius: var(--tc-radius-lg); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
.ui-gui__metric-label { overflow: hidden; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); white-space: nowrap; text-overflow: ellipsis; }
.ui-gui__metric-value { color: var(--tc-text-strong); font-size: var(--tc-font-size-2xl); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-tight); font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
:where([data-look="clean"], [data-look="clean"] *).ui-gui__metric-value { font-weight: var(--tc-font-weight-medium); }
.ui-gui__metric-change { display: flex; align-items: center; gap: var(--tc-space-1-5); margin-top: var(--tc-space-1); color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); }
.ui-gui__trend { display: grid; flex: none; place-items: center; width: 18px; height: 18px; border-radius: var(--tc-radius-sm); }
.ui-gui__trend svg { display: block; }
.ui-gui__trend[data-tone="good"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-gui__trend[data-tone="bad"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); box-shadow: inset 0 0 0 1px currentColor; }
.ui-gui__trend[data-tone="neutral"] { background: var(--tc-fill-default); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-gui__trend { border-radius: var(--tc-radius-badge); }
/* Callouts: a tinted box with the tone's icon; blocks may nest inside */
.ui-gui__callout { display: flex; gap: var(--tc-space-2-5); min-width: 0; padding: var(--tc-space-3) var(--tc-space-3-5); border-radius: var(--tc-card-radius); }
:where([data-look="clean"], [data-look="clean"] *).ui-gui__callout { border-radius: var(--tc-radius-lg); box-shadow: inset 0 0 0 0.5px var(--tc-border-default); }
.ui-gui__callout[data-tone="info"] { background: var(--tc-status-info-bg); --tc-generated-ui-tone: var(--tc-status-info-fg); }
.ui-gui__callout[data-tone="success"] { background: var(--tc-status-success-bg); --tc-generated-ui-tone: var(--tc-status-success-fg); }
.ui-gui__callout[data-tone="warning"] { background: var(--tc-status-warning-bg); --tc-generated-ui-tone: var(--tc-status-warning-fg); }
.ui-gui__callout[data-tone="danger"] { background: var(--tc-status-danger-bg); --tc-generated-ui-tone: var(--tc-status-danger-fg); }
.ui-gui__callout-icon { flex: none; width: 16px; height: 16px; margin-top: var(--tc-space-0-5); fill: none; stroke: var(--tc-generated-ui-tone); stroke-linecap: round; stroke-linejoin: round; }
.ui-gui__callout-body { display: grid; flex: 1; gap: var(--tc-space-1-5); min-width: 0; }
.ui-gui__callout-title { margin: 0; color: var(--tc-generated-ui-tone); font-weight: var(--tc-font-weight-medium); }
.ui-gui__callout .ui-gui__stack { margin-top: var(--tc-space-1-5); }
/* Forms: stepper-form's fields on its tray and card */
.ui-gui__form { display: grid; min-width: 0; margin: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-gui__form { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
:where([data-look="standard"], [data-look="standard"] *).ui-gui__form-title { padding: var(--tc-space-2) var(--tc-space-3) var(--tc-space-2-5); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); }
:where([data-look="standard"], [data-look="standard"] *).ui-gui__form-card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-gui__form { overflow: hidden; border-radius: var(--tc-radius-lg); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
:where([data-look="clean"], [data-look="clean"] *).ui-gui__form-title { padding: var(--tc-space-3) var(--tc-space-4); border-bottom: var(--tc-hairline) solid var(--tc-divider); font-size: var(--tc-font-size-md); }
.ui-gui__fields { display: grid; gap: var(--tc-space-3-5); padding: var(--tc-space-4); }
.ui-gui__form-foot { display: flex; justify-content: flex-end; padding: 0 var(--tc-space-4) var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-gui__form-foot { padding: var(--tc-space-2-5) var(--tc-space-3); border-top: var(--tc-hairline) solid var(--tc-divider); }
/* stepper-form's messages use the solid danger colour, under 4.5:1 on white at this size – the text colour here */
[data-ui="gui"] .ui-sf__msg { color: var(--tc-status-danger-fg); }
/* Textareas and selects take the field pattern, like tc-stepper-input */
.ui-gui__control {
  width: 100%;
  min-width: 0;
  margin: 0;
  border: 0;
  border-radius: var(--tc-field-radius);
  background: var(--tc-field-bg);
  box-shadow: var(--tc-field-shadow);
  color: var(--tc-text-primary);
  font: inherit;
  font-size: var(--tc-field-font-size);
  outline: none;
  transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-gui__control:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-gui__control:focus-visible { box-shadow: var(--tc-field-shadow-focus); }
.ui-gui__control[aria-invalid="true"] { box-shadow: var(--tc-field-shadow-invalid); }
.ui-gui__textarea { display: block; min-height: 84px; padding: var(--tc-space-2-5) var(--tc-field-px); resize: vertical; line-height: var(--tc-line-height-normal); }
.ui-gui__textarea::placeholder { color: var(--tc-text-placeholder); }
.ui-gui__select-wrap { position: relative; display: block; }
.ui-gui__select-wrap::after { content: ""; position: absolute; top: 50%; right: var(--tc-field-px); width: 6px; height: 6px; border-right: 1.5px solid var(--tc-icon-muted); border-bottom: 1.5px solid var(--tc-icon-muted); transform: translateY(-75%) rotate(45deg); pointer-events: none; }
.ui-gui__select { height: var(--tc-field-h); padding: 0 calc(var(--tc-field-px) * 2 + 6px) 0 var(--tc-field-px); appearance: none; cursor: pointer; }
/* Buttons: Button's secondary and primary recipes */
.ui-gui__actions { display: flex; flex-wrap: wrap; gap: var(--tc-space-2); }
.ui-gui__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: var(--tc-control-h-md);
  margin: 0;
  padding: 0 var(--tc-control-px-md);
  border: 0;
  border-radius: var(--tc-control-radius-md);
  background: var(--tc-action-secondary-bg);
  box-shadow: var(--tc-action-secondary-shadow);
  color: var(--tc-action-secondary-fg);
  font: inherit;
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  white-space: nowrap;
  cursor: pointer;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-gui__btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-gui__btn[data-primary] { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-gui__btn[data-primary]:hover { background: var(--tc-action-primary-bg-hover); }
.ui-gui__btn:active { transform: scale(0.97); }
.ui-gui__btn:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
/* What couldn't be drawn: its text, plainly */
.ui-gui__fallback { display: grid; gap: var(--tc-space-1-5); min-width: 0; }
.ui-gui__reason { margin: 0; padding: var(--tc-space-1) var(--tc-space-2); border-radius: var(--tc-radius-sm); background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); }
/* The block still arriving */
.ui-gui__pending { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-1) 0; }
.ui-gui__pending > span { height: 10px; border-radius: var(--tc-radius-full); background: var(--tc-fill-default); animation: ui-gui-pulse var(--tc-duration-shimmer) var(--tc-ease-in-out) infinite; }
.ui-gui__pending > span:nth-child(2) { width: 82%; animation-delay: var(--tc-duration-slow); }
.ui-gui__pending > span:nth-child(3) { width: 56%; animation-delay: var(--tc-duration-slower); }
.ui-gui__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@keyframes ui-gui-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
/* Narrow: tiles in a row wrap into a grid */
@container (max-width: 480px) {
  .ui-gui__stack[data-layout="row"] { grid-auto-flow: row; grid-template-columns: repeat(auto-fill, minmax(min(100%, 140px), 1fr)); }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="gui"] .ui-gui__pending > span, [data-ui="gui"] .ui-gui__btn, [data-ui="gui"] .ui-gui__control { animation: none; transition: none; }
}
`;
}

if (!customElements.get("tc-generated-ui")) customElements.define("tc-generated-ui", TcGeneratedUi);

declare global {
  interface HTMLElementTagNameMap {
    "tc-generated-ui": TcGeneratedUi;
  }
}
