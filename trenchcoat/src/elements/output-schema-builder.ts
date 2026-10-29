import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController, ToolbarController } from "./internal/controllers";
import "./code-block";
import "./segmented-control";
import type { SegmentOption, SegmentValueChange } from "./segmented-control";

/*
 * <tc-output-schema-builder> – the shape a model's answer must take: a tree of fields on one side and, beside it, what
 * the model will return. Each tree row is a field – a type glyph (abc, 1.0, 123, y/n, { }, [ ]), its name, whether
 * it's required, its allowed values and its description; objects and lists of objects open into their own fields,
 * drawn with nesting guides. The preview renders a sample answer as a structured card – each key with its value and
 * its type – and pointing at (or selecting) a field in either lights it in the other. Raw JSON and the JSON Schema
 * are the preview's other two tabs. Problems – a field without a name, two fields with the same name, an empty list
 * of allowed values – are a marker and a short note on their row, and counted in the head.
 *
 *   <tc-output-schema-builder heading="Ticket triage" .value=${[{ name: "priority", type: "string", required: true, enum: ["low", "high"] }]}></tc-output-schema-builder>
 *
 * The tree is the WAI-ARIA tree view: one tab stop, ↑ ↓ move, → ← open, close and step in or out, Home / End;
 * Enter or F2 opens the field's editor, docked under the tree (Esc closes it and returns to the row), Alt+↑ / Alt+↓ move the
 * field among its siblings, Delete removes it. A toolbar above the tree adds a field after the selected one or inside
 * it, moves it and removes it. Forms only appear for editing: the main view is the tree and the preview.
 *
 * The fields are the value: every change fires a cancelable `tc-value-change` ({ value }) – call preventDefault() to
 * control `value` yourself. With `name` it's a form control that submits the generated JSON Schema, invalid while a
 * field has a problem. 640 px and wider the tree and the preview sit side by side; narrower, the preview goes below.
 * Standard puts the head on the gray tray above one white card, the preview on a sunken well; Clean is one white card,
 * a hairline between the tree and the preview, round glyphs and thinner icons. `flat` drops the frame, for use inside
 * another card. The schema is the JSON Schema subset structured-output checks: type, properties, required, items,
 * enum, description, additionalProperties: false.
 */

/** A JSON Schema type a field can have */
export type OutputFieldType = "string" | "number" | "integer" | "boolean" | "object" | "array";
export type OutputSchemaField = {
  /** The key in the output object */
  name: string;
  type: OutputFieldType;
  /** The model must always include it */
  required: boolean;
  /** What the field means – sent to the model as the schema's description */
  description?: string;
  /** Strings (or a list's string items): the only values allowed; undefined allows any text, [] is a problem */
  enum?: string[];
  /** An object's fields, or the fields of each item of a list of objects */
  fields?: OutputSchemaField[];
  /** A list's item type; "string" when unset */
  itemType?: Exclude<OutputFieldType, "array">;
};
/** The JSON Schema the fields generate */
export type OutputJsonSchema = {
  type: OutputFieldType;
  description?: string;
  properties?: Record<string, OutputJsonSchema>;
  required?: string[];
  additionalProperties?: boolean;
  enum?: string[];
  items?: OutputJsonSchema;
};
/** A problem with one field: "error" makes the schema invalid, "warning" is advice. `short` is the note on its row */
export type OutputSchemaIssue = { path: number[]; field: string; level: "error" | "warning"; message: string; short: string };
export type OutputSchemaValueChange = { value: OutputSchemaField[] };
/** What the preview shows: the rendered answer ("output"), its raw JSON ("sample") or the JSON Schema ("schema") */
export type OutputSchemaPreview = "output" | "sample" | "schema";

const TYPES: OutputFieldType[] = ["string", "number", "integer", "boolean", "object", "array"];
const GLYPH: Record<OutputFieldType, string> = { string: "abc", number: "1.0", integer: "123", boolean: "y/n", object: "{ }", array: "[ ]" };
const isContainer = (f: OutputSchemaField) => f.type === "object" || (f.type === "array" && f.itemType === "object");
const takesEnum = (f: OutputSchemaField) => f.type === "string" || (f.type === "array" && (f.itemType ?? "string") === "string");
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** Every problem in the tree, depth first: missing or repeated names, empty or repeated allowed values, empty objects */
export function schemaIssues(fields: OutputSchemaField[], parent: number[] = []): OutputSchemaIssue[] {
  const out: OutputSchemaIssue[] = [];
  const seen = new Set<string>();
  fields.forEach((f, i) => {
    const path = [...parent, i];
    const name = f.name.trim();
    if (!name) out.push({ path, field: f.name, level: "error", message: "Give the field a name", short: "No name" });
    else if (seen.has(name)) out.push({ path, field: f.name, level: "error", message: `Another field here is already called “${name}”`, short: "Name used twice" });
    seen.add(name);
    if (takesEnum(f) && f.enum) {
      if (!f.enum.length) out.push({ path, field: f.name, level: "error", message: "List at least one allowed value, or allow any text", short: "No allowed values" });
      const dup = f.enum.find((v, j) => f.enum!.indexOf(v) !== j);
      if (dup !== undefined) out.push({ path, field: f.name, level: "error", message: `“${dup}” is listed twice`, short: `“${dup}” twice` });
    }
    if (isContainer(f)) {
      if (!f.fields?.length) out.push({ path, field: f.name, level: "warning", message: f.type === "object" ? "An empty object can't hold anything – add a field" : "Each item is an empty object – add a field", short: "Empty" });
      else out.push(...schemaIssues(f.fields, path));
    }
  });
  return out;
}

/** The first error's message, or "" when the fields make a valid schema */
export function schemaFieldError(fields: OutputSchemaField[]): string {
  return schemaIssues(fields).find((i) => i.level === "error")?.message ?? "";
}

const leafSchema = (type: Exclude<OutputFieldType, "array" | "object">, f: OutputSchemaField): OutputJsonSchema => ({ type, ...(type === "string" && f.enum?.length ? { enum: f.enum } : {}) });

/** The JSON Schema for an object with these fields: every object closed (additionalProperties: false) */
export function schemaFromFields(fields: OutputSchemaField[]): OutputJsonSchema {
  const one = (f: OutputSchemaField): OutputJsonSchema => {
    const desc = f.description?.trim() ? { description: f.description.trim() } : {};
    if (f.type === "object") return { ...schemaFromFields(f.fields ?? []), ...desc };
    if (f.type === "array") {
      const item = f.itemType ?? "string";
      return { type: "array", ...desc, items: item === "object" ? schemaFromFields(f.fields ?? []) : leafSchema(item, f) };
    }
    return { ...leafSchema(f.type, f), ...desc };
  };
  return {
    type: "object",
    properties: Object.fromEntries(fields.map((f) => [f.name, one(f)])),
    required: fields.filter((f) => f.required).map((f) => f.name),
    additionalProperties: false,
  };
}

/** A sample object of this shape: the first allowed value, "text", 1.5, 1, true; one item per list */
export function sampleFromFields(fields: OutputSchemaField[]): Record<string, unknown> {
  const leaf = (type: OutputFieldType, f: OutputSchemaField): unknown =>
    type === "string" ? (f.enum?.[0] ?? "text") : type === "number" ? 1.5 : type === "integer" ? 1 : type === "boolean" ? true : type === "object" ? sampleFromFields(f.fields ?? []) : [];
  return Object.fromEntries(fields.map((f) => [f.name, f.type === "array" ? [leaf(f.itemType ?? "string", f)] : leaf(f.type, f)]));
}

/** Checks a value against a schema from schemaFromFields; one message per problem, "$.path: …" */
export function validateOutputSample(value: unknown, schema: OutputJsonSchema, path = "$", depth = 0): string[] {
  if (depth > 50) return [`${path}: maximum nesting exceeded.`];
  if (schema.type === "object") {
    if (!value || typeof value !== "object" || Array.isArray(value)) return [`${path}: expected object.`];
    const object = value as Record<string, unknown>;
    return [
      ...(schema.required ?? []).filter((key) => !Object.hasOwn(object, key)).map((key) => `${path}.${key}: required.`),
      ...Object.entries(object).flatMap(([key, item]) =>
        schema.properties && Object.hasOwn(schema.properties, key) ? validateOutputSample(item, schema.properties[key], `${path}.${key}`, depth + 1) : [`${path}.${key}: unexpected field.`],
      ),
    ];
  }
  if (schema.type === "array") return Array.isArray(value) ? value.flatMap((item, i) => validateOutputSample(item, schema.items ?? { type: "string" }, `${path}[${i}]`, depth + 1)) : [`${path}: expected array.`];
  const valid = schema.type === "integer" ? typeof value === "number" && Number.isInteger(value) : schema.type === "number" ? typeof value === "number" && Number.isFinite(value) : typeof value === schema.type;
  return !valid ? [`${path}: expected ${schema.type}.`] : schema.enum && !schema.enum.includes(String(value)) ? [`${path}: value is not in the allowed list.`] : [];
}

/* ---------- Icons (Lucide, ISC – lucide.dev) ---------- */
const glyph = (d: TemplateResult, cls = "ui-osb__icon") => html`<svg class=${cls} viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
/* list-tree: the head's icon */
const TREE = svg`<path d="M21 12h-8"></path><path d="M21 6H8"></path><path d="M21 18h-8"></path><path d="M3 6v4c0 1.1.9 2 2 2h3"></path><path d="M3 10v6c0 1.1.9 2 2 2h3"></path>`;
const ICON = {
  plus: glyph(svg`<path d="M12 5v14M5 12h14"></path>`),
  inside: glyph(svg`<path d="M4 4v7a4 4 0 0 0 4 4h12"></path><path d="m15 10 5 5-5 5"></path>`),
  up: glyph(svg`<path d="m18 15-6-6-6 6"></path>`),
  down: glyph(svg`<path d="m6 9 6 6 6-6"></path>`),
  remove: glyph(svg`<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"></path>`),
  chevron: glyph(svg`<path d="m9 6 6 6-6 6"></path>`, "ui-osb__chev-icon"),
  alert: glyph(svg`<circle cx="12" cy="12" r="9"></circle><path d="M12 8v4.5M12 16h.01"></path>`, "ui-osb__alert"),
  close: glyph(svg`<path d="M7 7l10 10M17 7 7 17"></path>`),
};

type Row = { id: string; field: OutputSchemaField; path: number[]; depth: number; parent: string | null; pos: number; size: number; issues: OutputSchemaIssue[] };

const PREVIEWS: SegmentOption[] = [
  { value: "output", label: "Output" },
  { value: "sample", label: "JSON" },
  { value: "schema", label: "Schema" },
];

let instances = 0;

/**
 * The shape of a model's structured answer, built as a tree of fields beside a rendered preview of the answer, its
 * raw JSON and the JSON Schema it makes.
 * @tag tc-output-schema-builder
 * @fires tc-value-change - The fields changed ({ value: OutputSchemaField[] }); cancelable – prevent it to control `value`
 * @fires tc-preview-change - Output, JSON or Schema was picked ({ preview: "output" | "sample" | "schema" }); cancelable
 */
export class TcOutputSchemaBuilder extends TcElement {
  static override ui = "osb";
  static formAssociated = true;

  /** The output object's fields, in order. Changed by the user unless a tc-value-change listener calls preventDefault() */
  @property({ attribute: false }) accessor value: OutputSchemaField[] = [];
  /** The heading – what the output is for */
  @property() accessor heading = "Output schema";
  /** A quieter line under the heading */
  @property() accessor description = "";
  /** What the preview shows: the rendered answer ("output"), its raw JSON ("sample") or the JSON Schema ("schema") */
  @property({ reflect: true }) accessor preview: OutputSchemaPreview = "output";
  /** Drops the tray and the card, for a builder inside another card */
  @property({ type: Boolean, reflect: true }) accessor flat = false;
  /** Submitted with the form: the generated JSON Schema, as JSON */
  @property({ reflect: true }) accessor name = "";
  /** Turns editing off and leaves the schema out of the form; a disabled fieldset does the same */
  @property({ type: Boolean, reflect: true }) accessor disabled = false;

  /** @internal The selected row */
  @state() accessor active = "";
  /** @internal The row whose editor is open */
  @state() accessor editing = "";
  /** @internal Folded rows */
  @state() accessor folded: ReadonlySet<string> = new Set();
  /** @internal The status region's text */
  @state() accessor spoken = "";
  /** @internal The field under the pointer, in the tree or the preview */
  @state() accessor pointed = "";
  @state() private accessor formDisabled = false;

  private readonly internals: ElementInternals;
  private readonly uid = `tc-osb${++instances}`;
  private readonly ids = new WeakMap<OutputSchemaField, string>();
  private nextId = 0;
  private rows: Row[] = [];
  private problems: OutputSchemaIssue[] = [];
  private byPath = new Map<string, OutputSchemaIssue[]>();
  private initialValue: OutputSchemaField[] | null = null;
  private readonly tools = new ToolbarController(this, { items: () => [...this.querySelectorAll<HTMLElement>(".ui-osb__tool")] });

  constructor() {
    super();
    this.internals = this.attachInternals();
    // A removed field or a closed editor never drops focus to <body>
    new FocusRescueController(this, () => this.querySelector<HTMLElement>('.ui-osb__row[tabindex="0"]') ?? this.querySelector<HTMLElement>(".ui-osb__tool"));
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "group");
  }

  formResetCallback() {
    const value = this.initialValue ?? [];
    // Through tc-value-change like any edit, so a controlled wrapper hears of it and keeps the value until it agrees
    if (this.emit<OutputSchemaValueChange>("tc-value-change", { value }, { cancelable: true })) this.value = value;
    else this.requestUpdate();
    this.editing = "";
  }
  formDisabledCallback(disabled: boolean) {
    // Also called while `disabled` is reflected during an update, where a property change would be dropped – so after it
    queueMicrotask(() => (this.formDisabled = disabled));
  }

  private get isDisabled() {
    return this.disabled || this.formDisabled;
  }
  /** The JSON Schema the fields generate */
  get schema(): OutputJsonSchema {
    return schemaFromFields(this.value);
  }
  /** A sample object of the schema's shape */
  get sample(): Record<string, unknown> {
    return sampleFromFields(this.value);
  }
  /** Every problem with the fields, errors and warnings */
  get issues(): OutputSchemaIssue[] {
    return schemaIssues(this.value);
  }
  /** Whether the fields make a valid schema (no errors; warnings are fine) */
  checkValidity() {
    return this.isDisabled || !schemaFieldError(this.value);
  }

  /* ---------- The tree's rows ---------- */

  private idOf(f: OutputSchemaField) {
    let id = this.ids.get(f);
    if (!id) this.ids.set(f, (id = `f${++this.nextId}`));
    return id;
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // The reset baseline is what the first render shows, so props a framework sets after connecting (React does) count
    if (!this.hasUpdated) this.initialValue = this.value;
    this.toggleAttribute("data-disabled", this.isDisabled);
    if (changed.has("value") || changed.has("folded") || !this.rows.length) {
      this.problems = schemaIssues(this.value);
      const byPath = new Map<string, OutputSchemaIssue[]>();
      for (const p of this.problems) byPath.set(p.path.join("/"), [...(byPath.get(p.path.join("/")) ?? []), p]);
      this.byPath = byPath;
      const rows: Row[] = [];
      const walk = (fields: OutputSchemaField[], path: number[], parent: string | null) =>
        fields.forEach((f, i) => {
          const id = this.idOf(f);
          const at = [...path, i];
          rows.push({ id, field: f, path: at, depth: path.length, parent, pos: i + 1, size: fields.length, issues: byPath.get(at.join("/")) ?? [] });
          if (isContainer(f) && f.fields?.length && !this.folded.has(id)) walk(f.fields, at, id);
        });
      walk(this.value, [], null);
      this.rows = rows;
    }
    if (!this.rows.some((r) => r.id === this.active)) this.active = this.rows[0]?.id ?? "";
    if (this.editing && !this.rows.some((r) => r.id === this.editing)) this.editing = "";
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (!this.hasAttribute("aria-labelledby")) this.setAttribute("aria-labelledby", `${this.uid}-title`);
    if (typeof this.internals.setFormValue !== "function") return;
    const disabled = this.isDisabled;
    this.internals.setFormValue(this.name && !disabled ? JSON.stringify(this.schema) : null);
    const error = disabled ? "" : schemaFieldError(this.value);
    if (error) this.internals.setValidity({ customError: true }, error, this.querySelector<HTMLElement>('.ui-osb__row[data-state="error"]') ?? undefined);
    else this.internals.setValidity({});
  }

  /* ---------- Changes ---------- */

  private commit(next: OutputSchemaField[], said = "") {
    if (this.isDisabled) return false;
    const ok = this.emit<OutputSchemaValueChange>("tc-value-change", { value: next }, { cancelable: true });
    if (ok) this.value = next;
    else this.requestUpdate();
    if (said) this.spoken = said;
    return ok;
  }

  /** A copy of `fields` where the list at `parent` (an index path; [] is the root) is replaced by `fn(list)` */
  private withList(fields: OutputSchemaField[], parent: number[], fn: (list: OutputSchemaField[]) => OutputSchemaField[]): OutputSchemaField[] {
    if (!parent.length) return fn(fields);
    const [i, ...rest] = parent;
    return fields.map((f, at) => (at === i ? this.carry(f, { ...f, fields: this.withList(f.fields ?? [], rest, fn) }) : f));
  }
  /** Keeps a field's identity (its selection, fold and editor) across an edit */
  private carry(from: OutputSchemaField, to: OutputSchemaField) {
    this.ids.set(to, this.idOf(from));
    return to;
  }
  private rowOf(id: string) {
    return this.rows.find((r) => r.id === id);
  }
  private freshName(list: OutputSchemaField[]) {
    const names = new Set(list.map((f) => f.name));
    let n = list.length + 1;
    while (names.has(`field_${n}`)) n++;
    return `field_${n}`;
  }

  private patch(id: string, p: Partial<OutputSchemaField>) {
    const r = this.rowOf(id);
    if (!r) return;
    const f = r.field;
    let next: OutputSchemaField = { ...f, ...p };
    if (p.type && p.type !== f.type) {
      if (p.type !== "object" && p.type !== "array") delete next.fields;
      if (p.type === "object") next.fields = f.fields ?? [];
      if (p.type === "array") next.itemType = f.type === "object" ? "object" : (f.itemType ?? "string");
      else delete next.itemType;
    }
    if (p.itemType && p.itemType !== "object") delete next.fields;
    if (p.itemType === "object") next.fields = f.fields ?? [];
    if (!takesEnum(next)) delete next.enum;
    next = this.carry(f, next);
    this.commit(this.withList(this.value, r.path.slice(0, -1), (list) => list.map((x, i) => (i === r.path[r.path.length - 1] ? next : x))));
  }

  private add(inside: boolean) {
    const r = this.rowOf(this.active);
    const into = inside && r && isContainer(r.field);
    const parent = !r ? [] : into ? r.path : r.path.slice(0, -1);
    const at = !r ? this.value.length : into ? (r.field.fields?.length ?? 0) : r.path[r.path.length - 1] + 1;
    let field: OutputSchemaField | null = null;
    const next = this.withList(this.value, parent, (list) => {
      field = { name: this.freshName(list), type: "string", required: true };
      return [...list.slice(0, at), field, ...list.slice(at)];
    });
    if (into && r) this.folded = new Set([...this.folded].filter((x) => x !== r.id));
    if (!this.commit(next, `Added ${field!.name}`)) return;
    this.active = this.idOf(field!);
    this.openEditor(this.active, true);
  }

  private move(id: string, by: -1 | 1) {
    const r = this.rowOf(id);
    if (!r) return;
    const i = r.path[r.path.length - 1];
    const to = i + by;
    if (to < 0 || to >= r.size) return;
    const next = this.withList(this.value, r.path.slice(0, -1), (list) => {
      const copy = [...list];
      [copy[i], copy[to]] = [copy[to], copy[i]];
      return copy;
    });
    if (this.commit(next, `Moved ${r.field.name || "the field"} ${by < 0 ? "up" : "down"}, ${to + 1} of ${r.size}`)) this.focusRow(id);
  }

  private removeField(id: string) {
    const r = this.rowOf(id);
    if (!r) return;
    const i = r.path[r.path.length - 1];
    const siblings = this.rows.filter((x) => x.parent === r.parent);
    const after = siblings[siblings.indexOf(r) + 1] ?? siblings[siblings.indexOf(r) - 1];
    const next = this.withList(this.value, r.path.slice(0, -1), (list) => list.filter((_, at) => at !== i));
    const inTree = !!this.querySelector(".ui-osb__tree")?.contains(document.activeElement);
    if (!this.commit(next, `Removed ${r.field.name || "the field"}`)) return;
    this.active = after?.id ?? r.parent ?? "";
    if (inTree || this.editing === id) this.focusRow(this.active);
  }

  private toggleFold(id: string, open?: boolean) {
    const isOpen = !this.folded.has(id);
    const want = open ?? !isOpen;
    if (want === isOpen) return;
    const next = new Set(this.folded);
    if (want) next.delete(id);
    else next.add(id);
    this.folded = next;
  }

  private setPreview(preview: OutputSchemaPreview) {
    if (preview === this.preview) return;
    if (this.emit("tc-preview-change", { preview }, { cancelable: true })) this.preview = preview;
    else this.requestUpdate();
  }

  /* ---------- Focus and keyboard ---------- */

  private focusRow(id: string | undefined) {
    if (!id) return;
    this.active = id;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-osb__row[data-id="${id}"]`)?.focus());
  }

  /** Selects a field from the preview: unfolds what holds it, then focuses its row */
  private reveal(path: number[]) {
    let list = this.value;
    const open = new Set(this.folded);
    let id = "";
    path.forEach((i, n) => {
      const f = list[i];
      id = this.idOf(f);
      if (n < path.length - 1) {
        open.delete(id);
        list = f.fields ?? [];
      }
    });
    if (open.size !== this.folded.size) this.folded = open;
    this.focusRow(id);
  }

  private openEditor(id: string, selectName = false) {
    if (this.isDisabled) return;
    this.active = id;
    this.editing = id;
    void this.updateComplete.then(() => {
      const input = this.querySelector<HTMLInputElement>(".ui-osb__editor .ui-osb__name-input");
      input?.focus();
      if (selectName) input?.select();
    });
  }

  private closeEditor() {
    const id = this.editing;
    this.editing = "";
    this.focusRow(id);
  }

  private onRowKey(e: KeyboardEvent, r: Row) {
    if (e.target !== e.currentTarget || e.ctrlKey || e.metaKey) return;
    const rows = this.rows;
    const i = rows.indexOf(r);
    const parent = isContainer(r.field) && !!r.field.fields?.length;
    const open = parent && !this.folded.has(r.id);
    const edit = !this.isDisabled;
    const keys: Record<string, () => void> = e.altKey
      ? { ArrowUp: () => edit && this.move(r.id, -1), ArrowDown: () => edit && this.move(r.id, 1) }
      : {
          ArrowDown: () => this.focusRow(rows[i + 1]?.id),
          ArrowUp: () => this.focusRow(rows[i - 1]?.id),
          Home: () => this.focusRow(rows[0]?.id),
          End: () => this.focusRow(rows[rows.length - 1]?.id),
          ArrowRight: () => (parent && !open ? this.toggleFold(r.id, true) : open ? this.focusRow(rows[i + 1]?.id) : undefined),
          ArrowLeft: () => (open ? this.toggleFold(r.id, false) : r.parent ? this.focusRow(r.parent) : undefined),
          Enter: () => this.openEditor(r.id),
          F2: () => this.openEditor(r.id),
          Delete: () => edit && this.removeField(r.id),
          Backspace: () => edit && this.removeField(r.id),
        };
    if (!keys[e.key]) return;
    e.preventDefault();
    keys[e.key]();
  }

  /* ---------- Render: the tree ---------- */

  /** The field lit in both panes: the one under the pointer, else the selected one */
  private get lit() {
    return this.pointed || this.active;
  }

  private row(r: Row) {
    const f = r.field;
    const parent = isContainer(f) && !!f.fields?.length;
    const open = parent && !this.folded.has(r.id);
    const error = r.issues.some((i) => i.level === "error");
    const type = f.type === "array" ? `${f.itemType ?? "string"}[]` : f.type;
    const glyphType = f.type === "array" ? "array" : f.type;
    const values = takesEnum(f) && f.enum?.length ? f.enum : null;
    const first = r.issues[0];
    return html`<div
      class="ui-osb__row"
      role="treeitem"
      data-id=${r.id}
      data-focus-key=${`row:${r.id}`}
      data-state=${ifDefined(error ? "error" : r.issues.length ? "warning" : undefined)}
      aria-level=${r.depth + 1}
      aria-posinset=${r.pos}
      aria-setsize=${r.size}
      aria-selected=${r.id === this.active ? "true" : "false"}
      aria-expanded=${ifDefined(parent ? (open ? "true" : "false") : undefined)}
      ?data-editing=${this.editing === r.id}
      ?data-lit=${r.id === this.lit}
      tabindex=${r.id === this.active ? "0" : "-1"}
      style=${styleMap({ "--d": String(r.depth) })}
      @click=${(e: MouseEvent) => {
        this.active = r.id;
        if (parent && (e.target as Element).closest(".ui-osb__chev")) this.toggleFold(r.id);
      }}
      @dblclick=${() => this.openEditor(r.id)}
      @focus=${(e: FocusEvent) => {
        if (e.target === e.currentTarget) this.active = r.id;
      }}
      @pointerenter=${() => (this.pointed = r.id)}
      @pointerleave=${() => this.pointed === r.id && (this.pointed = "")}
      @keydown=${(e: KeyboardEvent) => this.onRowKey(e, r)}
    >
      ${r.depth ? html`<span class="ui-osb__guides" aria-hidden="true"></span>` : nothing}
      <span class="ui-osb__chev" ?data-open=${open} aria-hidden="true">${parent ? ICON.chevron : nothing}</span>
      <span class="ui-osb__glyph" data-type=${glyphType} aria-hidden="true">${GLYPH[glyphType]}</span>
      <span class="ui-osb__key" ?data-empty=${!f.name.trim()}>${f.name.trim() || "unnamed"}</span>
      ${f.required ? html`<span class="ui-osb__req" title="Required"><span aria-hidden="true">*</span><span class="ui-osb__sr">, required</span></span>` : html`<span class="ui-osb__sr">, optional</span>`}
      <span class="ui-osb__type">${type}</span>
      ${values ? html`<span class="ui-osb__enum" title=${values.join(" · ")}><span class="ui-osb__sr">, allowed: </span>${values.slice(0, 3).join(" · ") + (values.length > 3 ? ` +${values.length - 3}` : "")}</span>` : nothing}
      ${f.description?.trim() ? html`<span class="ui-osb__desc"><span class="ui-osb__sr">, </span>${f.description.trim()}</span>` : nothing}
      ${first
        ? html`<span class="ui-osb__issue" data-level=${first.level} title=${r.issues.map((i) => i.message).join(". ")}
            >${ICON.alert}<span aria-hidden="true">${first.short}${r.issues.length > 1 ? ` +${r.issues.length - 1}` : ""}</span
            ><span class="ui-osb__sr">${r.issues.map((i) => `, ${i.level === "error" ? "problem" : "note"}: ${i.message}`).join("")}</span></span
          >`
        : nothing}
    </div>`;
  }

  private editor(r: Row) {
    const f = r.field;
    const id = `${this.uid}-e`;
    const values = takesEnum(f) ? f.enum : undefined;
    const addValue = (input: HTMLInputElement) => {
      const v = input.value.trim();
      if (!v) return;
      input.value = "";
      this.patch(r.id, { enum: [...(f.enum ?? []), v] });
    };
    return html`<div
      class="ui-osb__editor"
      role="group"
      aria-label=${`Edit ${f.name || "field"}`}
      @keydown=${(e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          this.closeEditor();
        }
      }}
    >
      <p class="ui-osb__edit-title" aria-hidden="true">Editing <span class="ui-osb__edit-key">${f.name || "unnamed"}</span></p>
      <div class="ui-osb__edit-grid">
        <label class="ui-osb__field"><span class="ui-osb__label">Name</span>
          <input class="ui-osb__input ui-osb__name-input" spellcheck="false" .value=${live(f.name)} @change=${(e: Event) => this.patch(r.id, { name: (e.target as HTMLInputElement).value.trim() })} @keydown=${(e: KeyboardEvent) => {
            if (e.key === "Enter") {
              e.preventDefault();
              this.patch(r.id, { name: (e.target as HTMLInputElement).value.trim() });
              this.closeEditor();
            }
          }} />
        </label>
        <label class="ui-osb__field"><span class="ui-osb__label">Type</span>
          <select class="ui-osb__input" @change=${(e: Event) => this.patch(r.id, { type: (e.target as HTMLSelectElement).value as OutputFieldType })}>
            ${TYPES.map((t) => html`<option value=${t} .selected=${live(t === f.type)}>${t === "array" ? "list (array)" : t}</option>`)}
          </select>
        </label>
        ${f.type === "array"
          ? html`<label class="ui-osb__field"><span class="ui-osb__label">Each item</span>
              <select class="ui-osb__input" @change=${(e: Event) => this.patch(r.id, { itemType: (e.target as HTMLSelectElement).value as Exclude<OutputFieldType, "array"> })}>
                ${TYPES.filter((t) => t !== "array").map((t) => html`<option value=${t} .selected=${live(t === (f.itemType ?? "string"))}>${t}</option>`)}
              </select>
            </label>`
          : nothing}
        <label class="ui-osb__field ui-osb__field--wide"><span class="ui-osb__label">Description</span>
          <input class="ui-osb__input" placeholder="What the model should put here" .value=${live(f.description ?? "")} @change=${(e: Event) => this.patch(r.id, { description: (e.target as HTMLInputElement).value })} />
        </label>
      </div>
      <div class="ui-osb__edit-row">
        <span class="ui-osb__check-wrap">
          <button type="button" role="switch" class="ui-osb__switch" id=${`${id}-req`} aria-checked=${f.required ? "true" : "false"} @click=${() => this.patch(r.id, { required: !f.required })}><span></span></button>
          <label for=${`${id}-req`} class="ui-osb__switch-label">Required</label>
        </span>
        ${takesEnum(f)
          ? html`<span class="ui-osb__check-wrap">
              <button type="button" role="switch" class="ui-osb__switch" id=${`${id}-only`} aria-checked=${values ? "true" : "false"} @click=${() => this.patch(r.id, { enum: values ? undefined : [] })}><span></span></button>
              <label for=${`${id}-only`} class="ui-osb__switch-label">Only allowed values</label>
            </span>`
          : nothing}
        <button type="button" class="ui-osb__done" @click=${() => this.closeEditor()}>Done</button>
      </div>
      ${values
        ? html`<div class="ui-osb__values" role="group" aria-label="Allowed values">
            ${values.map(
              (v, i) => html`<span class="ui-osb__chip">${v}<button type="button" class="ui-osb__chip-x" aria-label=${`Remove ${v}`} @click=${() => {
                this.patch(r.id, { enum: values.filter((_, at) => at !== i) });
                void this.updateComplete.then(() => this.querySelector<HTMLInputElement>(".ui-osb__value-input")?.focus());
              }}>${ICON.close}</button></span>`,
            )}
            <input class="ui-osb__input ui-osb__value-input" aria-label="Add an allowed value" placeholder=${values.length ? "Add a value" : "Type a value, then Enter"} @keydown=${(e: KeyboardEvent) => {
              const input = e.target as HTMLInputElement;
              if (e.key === "Enter") {
                e.preventDefault();
                addValue(input);
              } else if (e.key === "Backspace" && !input.value && values.length) this.patch(r.id, { enum: values.slice(0, -1) });
            }} @change=${(e: Event) => addValue(e.target as HTMLInputElement)} />
          </div>`
        : nothing}
    </div>`;
  }

  /* ---------- Render: the preview ---------- */

  /** A leaf's value as the answer would carry it */
  private leafValue(type: OutputFieldType, f: OutputSchemaField): TemplateResult {
    if (type === "string") {
      if (f.enum && !f.enum.length) return html`<span class="ui-osb__v-none">no allowed values</span>`;
      if (f.enum?.length)
        return html`<span class="ui-osb__v-enum">${f.enum[0]}</span>${f.enum.length > 1 ? html`<span class="ui-osb__v-more" title=${f.enum.slice(1).join(", ")}>or ${plural(f.enum.length - 1, "other")}</span>` : nothing}`;
      return f.description?.trim() ? html`<span class="ui-osb__v-text">${f.description.trim()}</span>` : html`<span class="ui-osb__v-text" data-empty title="Any text">…</span>`;
    }
    if (type === "number") return html`<span class="ui-osb__v-num">1.5</span>`;
    if (type === "integer") return html`<span class="ui-osb__v-num">1</span>`;
    if (type === "boolean") return html`<span class="ui-osb__v-bool"><span class="ui-osb__v-tick" aria-hidden="true"></span>true</span>`;
    return html``;
  }

  private props(fields: OutputSchemaField[], parent: number[]): TemplateResult {
    return html`<ul class="ui-osb__obj">
      ${fields.map((f, i) => {
        const path = [...parent, i];
        const id = this.idOf(f);
        const issues = this.byPath.get(path.join("/")) ?? [];
        const error = issues.some((x) => x.level === "error");
        const item = f.type === "array" ? (f.itemType ?? "string") : null;
        const type = f.type === "array" ? `${item === "object" ? "object" : item}[]` : f.type === "string" && f.enum ? "enum" : f.type;
        const nested = f.type === "object" || item === "object";
        return html`<li class="ui-osb__prop" data-id=${id} ?data-lit=${id === this.lit} data-state=${ifDefined(error ? "error" : issues.length ? "warning" : undefined)} @pointerenter=${(e: PointerEvent) => {
          e.stopPropagation();
          this.pointed = id;
        }} @pointerleave=${() => this.pointed === id && (this.pointed = "")}>
          <div class="ui-osb__pline" @click=${() => this.reveal(path)}>
            <span class="ui-osb__pkey" ?data-empty=${!f.name.trim()}>${f.name.trim() || "unnamed"}${f.required ? nothing : html`<span class="ui-osb__popt" title="Optional">?</span>`}</span>
            <span class="ui-osb__pval">${nested ? html`<span class="ui-osb__v-punct">${f.type === "object" ? "{ }" : "[ { } ]"}</span>` : item ? html`<span class="ui-osb__v-punct">[</span>${this.leafValue(item, f)}<span class="ui-osb__v-punct">]</span>` : this.leafValue(f.type, f)}</span>
            <span class="ui-osb__ptype">${type}</span>
          </div>
          ${nested ? (f.fields?.length ? this.props(f.fields, path) : html`<p class="ui-osb__pempty">No fields yet</p>`) : nothing}
        </li>`;
      })}
    </ul>`;
  }

  private previewPane(look: "standard" | "clean") {
    const view = this.preview;
    const panel = `${this.uid}-panel`;
    return html`<div class="ui-osb__preview">
      <div class="ui-osb__preview-head">
        <span class="ui-osb__pane-title" id=${`${this.uid}-pv`}>Preview</span>
        <tc-segmented-control
          look=${look}
          size="sm"
          aria-labelledby=${`${this.uid}-pv`}
          .options=${PREVIEWS}
          .value=${view}
          @tc-value-change=${(e: CustomEvent<SegmentValueChange>) => {
            // The inner control's event stops here: the page hears this element's events only
            e.stopPropagation();
            e.preventDefault();
            this.setPreview(e.detail.value as OutputSchemaPreview);
          }}
        ></tc-segmented-control>
      </div>
      <div class="ui-osb__panel" id=${panel}>
        ${view === "output"
          ? this.value.length
            ? html`<div class="ui-osb__out" role="group" aria-label="What the model returns, with each value's type">${this.props(this.value, [])}</div>`
            : html`<p class="ui-osb__empty">The answer appears here as you add fields.</p>`
          : html`<tc-code-block
              bare
              look=${look}
              class="ui-osb__code"
              language="json"
              filename=${view === "sample" ? "sample.json" : "schema.json"}
              .code=${JSON.stringify(view === "sample" ? this.sample : this.schema, null, 2)}
              .lineNumbers=${false}
              @tc-view-change=${(e: Event) => e.stopPropagation()}
            ></tc-code-block>`}
      </div>
    </div>`;
  }

  protected override render() {
    const look = this.resolvedLook;
    const errors = this.problems.filter((p) => p.level === "error").length;
    const count = this.rows.length ? countFields(this.value) : 0;
    const disabled = this.isDisabled;
    const active = this.rowOf(this.active);
    const canInside = !!active && isContainer(active.field);
    const editing = this.editing ? this.rowOf(this.editing) : undefined;
    const tool = (cls: string, label: string, icon: TemplateResult, onClick: () => void, off: boolean, text = false) =>
      html`<button type="button" class=${`ui-osb__tool ${cls}`} aria-label=${ifDefined(text ? undefined : label)} title=${label} ?disabled=${disabled || off} @click=${onClick}>${icon}${text ? html`<span>${label}</span>` : nothing}</button>`;
    const head = cardHead({
      icon: TREE,
      title: this.heading,
      subtitle: this.description,
      id: `${this.uid}-title`,
      aside: html`<span class="ui-osb__pill" data-state=${errors ? "error" : "ok"}>${errors ? html`${ICON.alert}${plural(errors, "problem")}` : plural(count, "field")}</span>`,
    });
    const tree = html`<div class="ui-osb__fields">
      <div class="ui-osb__toolbar" role="toolbar" aria-label="Fields" @keydown=${this.tools.onKeyDown} @focusin=${this.tools.onFocusIn}>
        ${tool("ui-osb__tool--text", "Add field", ICON.plus, () => this.add(false), false, true)}
        ${tool("", "Add a field inside", ICON.inside, () => this.add(true), !canInside)}
        <span class="ui-osb__tool-gap" aria-hidden="true"></span>
        ${tool("", "Move up", ICON.up, () => active && this.move(active.id, -1), !active || active.pos === 1)}
        ${tool("", "Move down", ICON.down, () => active && this.move(active.id, 1), !active || active.pos === active.size)}
        ${tool("ui-osb__tool--danger", "Remove field", ICON.remove, () => active && this.removeField(active.id), !active)}
      </div>
      ${this.rows.length
        ? html`<div class="ui-osb__tree" role="tree" aria-labelledby=${`${this.uid}-title`} aria-describedby=${`${this.uid}-keys`}>
            ${repeat(this.rows, (r) => r.id, (r) => this.row(r))}
          </div>`
        : html`<p class="ui-osb__empty">No fields yet – add the first one.</p>`}
      ${editing ? this.editor(editing) : nothing}
      <p class="ui-osb__keys" id=${`${this.uid}-keys`}>Enter edits · Alt+↑↓ moves · Delete removes</p>
    </div>`;
    const panes = html`<div class="ui-osb__panes">${tree}${this.previewPane(look)}</div>`;
    return html`${head}${look === "clean" || this.flat ? panes : html`<div class="ui-osb__card">${panes}</div>`}<span class="ui-osb__sr" role="status">${this.spoken}</span>`;
  }

  static override css = /* css */ `
/* Syntax colours from the shared tokens – override them on [data-ui="osb"] */
[data-ui="osb"] {
  --tc-output-schema-builder-key: var(--tc-syntax-property);
  --tc-output-schema-builder-indent: var(--tc-space-5);
  --tc-output-schema-builder-guide: var(--tc-border-default);
  display: flow-root;
  box-sizing: border-box;
  container: ui-osb / inline-size;
  width: 100%;
  min-width: 0;
  color: var(--tc-text-primary);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="osb"] *, [data-ui="osb"] *::before, [data-ui="osb"] *::after { box-sizing: border-box; }
[data-ui="osb"] svg { display: block; flex: none; }
:where([data-ui="osb"]) :is(p, ul) { margin: 0; padding: 0; }
:where([data-ui="osb"]) ul { list-style: none; }
:where([data-ui="osb"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="osb"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="osb"] button:disabled { cursor: default; opacity: 0.4; }
/* Standard: the head on the gray tray, the tree and the preview on one white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="osb"]:not([flat]) { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
.ui-osb__card { min-width: 0; overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* Clean: one white card, the head its first row, a hairline under it and between the panes */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="osb"]:not([flat]) { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *) .ui-osb__panes { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-osb__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-osb__icon { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *) .ui-osb__icon { stroke-width: 1.4; }

/* ---------- Head: the count, or the problems ---------- */
.ui-osb__pill { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); color: var(--tc-text-secondary); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-osb__pill[data-state="error"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }

/* ---------- Two panes: the tree and the preview, side by side when wide ---------- */
.ui-osb__panes { display: grid; grid-template-columns: minmax(0, 1fr); }
.ui-osb__fields { display: flex; flex-direction: column; min-width: 0; }
.ui-osb__toolbar { display: flex; align-items: center; gap: var(--tc-space-0-5); padding: var(--tc-space-1-5) var(--tc-space-2); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-osb__tool { display: inline-flex; flex: none; align-items: center; justify-content: center; gap: var(--tc-space-1-5); min-width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-action-ghost-fg); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-osb__tool--text { padding: 0 var(--tc-control-px-sm) 0 var(--tc-space-2); }
[data-ui="osb"] .ui-osb__tool:hover:not(:disabled) { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
[data-ui="osb"] .ui-osb__tool--danger:hover:not(:disabled) { color: var(--tc-status-danger-fg); }
.ui-osb__tool-gap { flex: 1; }

/* The tree: mono, a row per field, indented by depth with guide lines */
.ui-osb__tree { flex: 1; padding: var(--tc-space-1-5) 0; font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); }
.ui-osb__row { display: flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; min-height: 30px; padding: 0 var(--tc-space-2-5); cursor: default; outline: none; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-osb__row:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(var(--tc-focus-ring-width) * -1); }
.ui-osb__row[data-lit] { background: var(--tc-fill-subtle); }
:where([data-look="standard"], [data-look="standard"] *) .ui-osb__row[aria-selected="true"] { background: var(--tc-fill-selected); }
:where([data-look="clean"], [data-look="clean"] *) .ui-osb__row[aria-selected="true"] { background: var(--tc-accent-subtle); }
.ui-osb__guides {
  flex: none;
  align-self: stretch;
  width: calc(var(--d) * var(--tc-output-schema-builder-indent));
  background: repeating-linear-gradient(90deg, transparent 0 9.5px, var(--tc-output-schema-builder-guide) 9.5px 10.5px, transparent 10.5px var(--tc-output-schema-builder-indent));
}
.ui-osb__chev { display: inline-grid; flex: none; place-items: center; width: 14px; margin-right: calc(var(--tc-space-1) * -1); color: var(--tc-icon-muted); cursor: pointer; }
.ui-osb__chev-icon { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; transition: transform var(--tc-duration-fast) var(--tc-ease-move); }
:where([data-look="clean"], [data-look="clean"] *) .ui-osb__chev-icon { stroke-width: 1.5; }
.ui-osb__chev[data-open] .ui-osb__chev-icon { transform: rotate(90deg); }
/* The type glyph: a small mono badge in the type's syntax colour */
.ui-osb__glyph { display: inline-grid; flex: none; place-items: center; min-width: 30px; height: 18px; padding: 0 var(--tc-space-1); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-syntax-punctuation); background: var(--tc-fill-subtle); }
:where([data-look="standard"], [data-look="standard"] *) .ui-osb__glyph { border-radius: var(--tc-radius-xs); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
:where([data-look="clean"], [data-look="clean"] *) .ui-osb__glyph { border-radius: var(--tc-radius-full); background: none; box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-subtle); }
.ui-osb__glyph[data-type="string"] { color: var(--tc-syntax-string); }
.ui-osb__glyph[data-type="number"], .ui-osb__glyph[data-type="integer"] { color: var(--tc-syntax-number); }
.ui-osb__glyph[data-type="boolean"] { color: var(--tc-syntax-keyword); }
.ui-osb__glyph[data-type="object"], .ui-osb__glyph[data-type="array"] { color: var(--tc-syntax-type); }
.ui-osb__key { flex: none; max-width: 45%; overflow: hidden; color: var(--tc-output-schema-builder-key); font-weight: var(--tc-font-weight-medium); white-space: nowrap; text-overflow: ellipsis; }
.ui-osb__key[data-empty] { color: var(--tc-text-muted); font-style: italic; font-weight: var(--tc-font-weight-regular); }
.ui-osb__type { flex: none; color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); }
.ui-osb__req { flex: none; margin-left: calc(var(--tc-space-1-5) * -1); color: var(--tc-status-danger-fg); font-weight: var(--tc-font-weight-semibold); }
.ui-osb__enum { flex: 0 1 auto; min-width: 0; overflow: hidden; padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-xs); background: var(--tc-fill-subtle); color: var(--tc-syntax-string); font-size: var(--tc-font-size-xs); white-space: nowrap; text-overflow: ellipsis; }
.ui-osb__desc { flex: 1 1 0; min-width: 0; overflow: hidden; color: var(--tc-text-muted); font-family: var(--tc-font-sans); font-size: var(--tc-font-size-xs); white-space: nowrap; text-overflow: ellipsis; }
/* A field with a problem: a marker and a short note at the end of its row – the full reason in its title and to screen readers */
.ui-osb__issue { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1); max-width: 45%; margin-left: auto; overflow: hidden; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); white-space: nowrap; text-overflow: ellipsis; }
.ui-osb__issue[data-level="error"] { color: var(--tc-status-danger-fg); }
.ui-osb__issue[data-level="warning"] { color: var(--tc-status-warning-fg); }
.ui-osb__desc + .ui-osb__issue { margin-left: 0; }
.ui-osb__row[data-state="error"] .ui-osb__key { text-decoration: underline wavy; text-decoration-color: var(--tc-status-danger-fg); text-decoration-thickness: 1px; text-underline-offset: 3px; }
.ui-osb__alert { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; }
.ui-osb__empty { padding: var(--tc-space-6) var(--tc-space-4); color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); text-align: center; }
.ui-osb__keys { margin-top: auto !important; padding: var(--tc-space-2) var(--tc-space-3); border-top: var(--tc-hairline) solid var(--tc-divider); color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); }

/* The editor docks under the tree while a field is being edited */
.ui-osb__editor { display: grid; gap: var(--tc-space-2-5); margin: 0 var(--tc-space-2) var(--tc-space-2); padding: var(--tc-space-3); border-radius: var(--tc-radius-lg); background: var(--tc-surface-well); font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); }
:where([data-look="clean"], [data-look="clean"] *) .ui-osb__editor { border-radius: var(--tc-radius-md); background: var(--tc-surface-raised); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-osb__edit-title { color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); }
.ui-osb__edit-key { color: var(--tc-output-schema-builder-key); font-family: var(--tc-font-mono); }
.ui-osb__row[data-editing] { box-shadow: inset 2px 0 0 var(--tc-accent); }
.ui-osb__edit-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(128px, 1fr)); gap: var(--tc-space-2); }
.ui-osb__field { display: grid; gap: var(--tc-space-1); min-width: 0; }
.ui-osb__field--wide { grid-column: 1 / -1; }
.ui-osb__label { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-osb__input { width: 100%; min-width: 0; height: var(--tc-field-h); margin: 0; padding: 0 var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); outline: 0; background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); color: var(--tc-text-primary); font: inherit; font-size: var(--tc-field-font-size); transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-osb__input:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-osb__input:focus-visible { box-shadow: var(--tc-field-shadow-focus); }
.ui-osb__input::placeholder { color: var(--tc-text-placeholder); }
.ui-osb__name-input { font-family: var(--tc-font-mono); }
.ui-osb__edit-row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2) var(--tc-space-4); }
.ui-osb__check-wrap { display: inline-flex; align-items: center; gap: var(--tc-space-2); }
.ui-osb__switch-label { color: var(--tc-text-primary); cursor: pointer; }
.ui-osb__switch { position: relative; flex: none; width: var(--tc-switch-w); height: var(--tc-switch-h); border-radius: var(--tc-switch-radius); background: var(--tc-switch-off) !important; transition: background-color var(--tc-duration-base) var(--tc-ease-standard); }
.ui-osb__switch[aria-checked="true"] { background: var(--tc-switch-on) !important; }
.ui-osb__switch span { position: absolute; top: var(--tc-space-0-5); left: var(--tc-space-0-5); width: var(--tc-switch-knob); height: var(--tc-switch-knob); border-radius: calc(var(--tc-switch-radius) - var(--tc-space-0-5)); background: var(--tc-switch-knob-bg); box-shadow: var(--tc-shadow-control); transition: transform var(--tc-duration-moderate) var(--tc-ease-move); }
.ui-osb__switch[aria-checked="true"] span { transform: translateX(calc(var(--tc-switch-w) - var(--tc-switch-h))); }
.ui-osb__switch::after { content: ""; position: absolute; inset: -8px -6px; }
.ui-osb__done { height: var(--tc-control-h-sm); margin-left: auto; padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); }
.ui-osb__values { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5); }
.ui-osb__chip { display: inline-flex; align-items: center; gap: var(--tc-space-0-5); height: var(--tc-pill-h-lg); padding: 0 var(--tc-space-0-5) 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-surface-raised); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); color: var(--tc-syntax-string); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); }
.ui-osb__chip-x { display: grid; place-items: center; width: 18px; height: 18px; border-radius: var(--tc-radius-full); color: var(--tc-icon-muted); }
.ui-osb__chip-x .ui-osb__icon { width: 11px; height: 11px; }
[data-ui="osb"] .ui-osb__chip-x:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-osb__value-input { flex: 1 1 120px; width: auto; font-family: var(--tc-font-mono); }

/* ---------- The preview: what the model returns ---------- */
.ui-osb__preview { display: flex; flex-direction: column; min-width: 0; border-top: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="standard"], [data-look="standard"] *) .ui-osb__preview { background: var(--tc-surface-well); }
.ui-osb__preview-head { display: flex; align-items: center; gap: var(--tc-space-2); min-height: 41px; padding: var(--tc-space-1-5) var(--tc-space-2) var(--tc-space-1-5) var(--tc-space-3); }
.ui-osb__pane-title { flex: 1; color: var(--tc-caption-color); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); }
.ui-osb__panel { flex: 1; min-width: 0; padding: 0 var(--tc-space-2) var(--tc-space-2); }
.ui-osb__code { display: block; min-width: 0; overflow: hidden; border-radius: var(--tc-radius-lg); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *) .ui-osb__code { border-radius: var(--tc-radius-md); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
/* The answer as a card: keys, values and their types, objects nested on a rule */
.ui-osb__out { padding: var(--tc-space-2) 0; border-radius: var(--tc-radius-lg); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); font-size: var(--tc-font-size-sm); }
:where([data-look="clean"], [data-look="clean"] *) .ui-osb__out { border-radius: var(--tc-radius-md); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-osb__obj .ui-osb__obj { margin: var(--tc-space-0-5) 0 var(--tc-space-1) calc(var(--tc-space-3) + var(--tc-space-1)) !important; border-left: var(--tc-hairline) solid var(--tc-output-schema-builder-guide); }
.ui-osb__pline { display: flex; align-items: baseline; gap: var(--tc-space-2); min-width: 0; padding: var(--tc-space-1) var(--tc-space-3); cursor: pointer; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-osb__prop[data-lit] > .ui-osb__pline { background: var(--tc-fill-selected); box-shadow: inset 2px 0 0 var(--tc-accent); }
.ui-osb__prop[data-lit] > .ui-osb__pline :is(.ui-osb__ptype, .ui-osb__v-more, .ui-osb__popt, .ui-osb__v-text[data-empty]) { color: var(--tc-text-secondary); }
.ui-osb__pkey { flex: none; max-width: 42%; overflow: hidden; color: var(--tc-text-secondary); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); white-space: nowrap; text-overflow: ellipsis; }
.ui-osb__pkey[data-empty] { color: var(--tc-text-muted); font-style: italic; }
.ui-osb__prop[data-state="error"] > .ui-osb__pline .ui-osb__pkey { color: var(--tc-status-danger-fg); }
.ui-osb__popt { color: var(--tc-text-muted); }
.ui-osb__pval { display: flex; flex: 1; flex-wrap: wrap; align-items: baseline; gap: var(--tc-space-1); min-width: 0; color: var(--tc-text-primary); overflow-wrap: anywhere; }
.ui-osb__ptype { flex: none; color: var(--tc-text-muted); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-2xs); }
.ui-osb__v-text { color: var(--tc-text-secondary); }
.ui-osb__v-text[data-empty] { color: var(--tc-text-muted); }
.ui-osb__v-text::before { content: "“"; color: var(--tc-text-muted); }
.ui-osb__v-text::after { content: "”"; color: var(--tc-text-muted); }
.ui-osb__v-enum { padding: 0 var(--tc-space-1-5); border-radius: var(--tc-pill-radius); background: var(--tc-accent-subtle); color: var(--tc-accent-text); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-pill-h); }
.ui-osb__v-more { color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); }
.ui-osb__v-num { color: var(--tc-syntax-number); font-family: var(--tc-font-mono); font-variant-numeric: tabular-nums; }
.ui-osb__v-bool { display: inline-flex; align-items: center; gap: var(--tc-space-1); color: var(--tc-syntax-keyword); font-family: var(--tc-font-mono); }
.ui-osb__v-tick { width: 8px; height: 8px; border-radius: var(--tc-radius-full); background: currentColor; }
.ui-osb__v-none { color: var(--tc-status-danger-fg); font-style: italic; }
.ui-osb__v-punct { color: var(--tc-syntax-punctuation); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); }
.ui-osb__pempty { padding: var(--tc-space-1) var(--tc-space-3); color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); font-style: italic; }

/* Wide: the tree and the preview side by side */
@container ui-osb (min-width: 640px) {
  .ui-osb__panes { grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); }
  .ui-osb__preview { border-top: 0; border-left: var(--tc-hairline) solid var(--tc-divider); }
}
/* Narrow: descriptions, the key hint and the tree's type names give way – the glyph and the preview carry the type */
@container ui-osb (max-width: 420px) {
  .ui-osb__desc, .ui-osb__keys, .ui-osb__type { display: none; }
  .ui-osb__key { max-width: 50%; }
}
@media (pointer: coarse) {
  .ui-osb__row { min-height: 40px; }
  .ui-osb__tool { height: 40px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="osb"] *, [data-ui="osb"] *::before, [data-ui="osb"] *::after { transition: none !important; }
}
[data-ui="osb"][data-disabled] .ui-osb__tree { opacity: 0.7; }
`;
}

/** How many fields there are, nested ones included */
function countFields(fields: OutputSchemaField[]): number {
  return fields.reduce((n, f) => n + 1 + (isContainer(f) ? countFields(f.fields ?? []) : 0), 0);
}

if (!customElements.get("tc-output-schema-builder")) customElements.define("tc-output-schema-builder", TcOutputSchemaBuilder);

declare global {
  interface HTMLElementTagNameMap {
    "tc-output-schema-builder": TcOutputSchemaBuilder;
  }
}
