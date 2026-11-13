import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { safeUrl } from "./internal/safe-url";
import { copyText } from "./internal/util";

/*
 * <tc-schema-fields> – the fields of an API's request or response, for a reference page: each field's name, its type
 * in words ("string · email", "array of Tag", "One of: public, internal"), whether it's required, optional or
 * deprecated, its default, its limits ("1–200 characters", "Pattern: ^REC-\d+$") and what it means, with `code`,
 * **bold** and [links](…) in the description.
 *
 * Give it a JSON Schema (`schema`: properties, required, type, format, enum, default, deprecated, the min/max/pattern
 * keywords, items, and local $refs into $defs or definitions), or the fields themselves (`fields`, which wins).
 *   · nested objects, and arrays of objects, fold under their field: the toggle shows them indented; Expand all opens
 *     every level. `expanded` holds the open fields' paths (tc-expanded-change)
 *   · every field has an anchor (`<id-prefix>-owner.email`) and Copy link, which copies the page's address with that
 *     anchor (tc-anchor-copy, cancelable – prevented, nothing is copied)
 *   · a filter box appears once there are `search-threshold` fields (8): it keeps the fields whose name or
 *     description matches, with the fields above them, opened (tc-query-change)
 *   · the fields' buttons are one tab stop: ↑ / ↓ move between fields, → opens a field's children or moves to Copy
 *     link, ← closes or goes to the parent field
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-schema-fields heading="Record" .schema=${recordSchema}></tc-schema-fields>
 */

/** A value an enum or a default can hold */
export type SchemaFieldValue = string | number | boolean | null;
/** One field, as the element draws it */
export type SchemaField = {
  name: string;
  /** "string", "integer", "object", "array"…; several joined with " or " */
  type?: string;
  /** A format the type carries: "email", "date-time", "uri" */
  format?: string;
  /** For arrays: what the items are ("Tag", "string") */
  items?: string;
  /** The only values allowed */
  enum?: SchemaFieldValue[];
  required?: boolean;
  deprecated?: boolean;
  /** Used when the field is left out; undefined for none */
  default?: unknown;
  /** What it means; `code`, **bold** and [links](https://…) are drawn */
  description?: string;
  /** Limits in words: "1–200 characters", "Pattern: ^REC-\d+$" */
  constraints?: string[];
  /** The fields of a nested object, or of an array's objects */
  fields?: SchemaField[];
};
/** The JSON Schema keywords the element reads; anything else is ignored */
export type JsonSchema = {
  type?: string | string[];
  title?: string;
  description?: string;
  format?: string;
  enum?: SchemaFieldValue[];
  const?: SchemaFieldValue;
  default?: unknown;
  deprecated?: boolean;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  $ref?: string;
  $defs?: Record<string, JsonSchema>;
  definitions?: Record<string, JsonSchema>;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  pattern?: string;
  multipleOf?: number;
  uniqueItems?: boolean;
  [keyword: string]: unknown;
};
export type SchemaFieldsLabels = {
  required: string;
  optional: string;
  deprecated: string;
  defaultValue: string;
  oneOf: string;
  filter: string;
  expandAll: string;
  collapseAll: string;
  copyLink: string;
  copied: string;
  noMatch: string;
  empty: string;
};

/** Details of the events */
export type SchemaFieldsExpandedChange = { expanded: string[]; path: string | null; open: boolean };
export type SchemaFieldsQueryChange = { query: string };
export type SchemaFieldsAnchorCopy = { id: string; path: string; url: string };

/** The words used when the page gives none */
export const defaultSchemaFieldsLabels: SchemaFieldsLabels = {
  required: "Required",
  optional: "Optional",
  deprecated: "Deprecated",
  defaultValue: "Default",
  oneOf: "One of",
  filter: "Filter fields",
  expandAll: "Expand all",
  collapseAll: "Collapse all",
  copyLink: "Copy link to",
  copied: "Link copied",
  noMatch: "No fields match",
  empty: "No fields",
};

/* ---------- From JSON Schema ---------- */

const MAX_DEPTH = 8;
const refName = (ref: string) => decodeURIComponent(ref.split("/").pop() ?? ref).replace(/~1/g, "/").replace(/~0/g, "~");

function resolve(node: JsonSchema | undefined, root: JsonSchema): { node: JsonSchema; name?: string } {
  let name: string | undefined;
  let cur = node ?? {};
  for (let i = 0; i < MAX_DEPTH && typeof cur.$ref === "string"; i++) {
    const ref = cur.$ref;
    const m = /^#\/(\$defs|definitions)\/(.+)$/.exec(ref);
    const target = m ? (root[m[1] as "$defs" | "definitions"] as Record<string, JsonSchema> | undefined)?.[m[2].replace(/~1/g, "/").replace(/~0/g, "~")] : undefined;
    name ??= refName(ref);
    if (!target) return { node: { ...cur, $ref: undefined }, name };
    cur = { ...target, ...Object.fromEntries(Object.entries(cur).filter(([k]) => k !== "$ref")) };
  }
  return { node: cur, name: name ?? cur.title };
}

const typeWords = (t: string | string[] | undefined) => (Array.isArray(t) ? t.join(" or ") : t);

/** The limits of a schema node, in words */
export function schemaConstraints(s: JsonSchema): string[] {
  const out: string[] = [];
  const range = (lo: number | undefined, hi: number | undefined, unit: string) => {
    if (lo !== undefined && hi !== undefined) out.push(lo === hi ? `Exactly ${lo} ${unit}` : `${lo}–${hi} ${unit}`);
    else if (lo !== undefined) out.push(`At least ${lo} ${unit}`);
    else if (hi !== undefined) out.push(`At most ${hi} ${unit}`);
  };
  range(s.minLength, s.maxLength, "characters");
  range(s.minItems, s.maxItems, "items");
  if (s.minimum !== undefined) out.push(`Minimum ${s.minimum}`);
  if (s.exclusiveMinimum !== undefined) out.push(`More than ${s.exclusiveMinimum}`);
  if (s.maximum !== undefined) out.push(`Maximum ${s.maximum}`);
  if (s.exclusiveMaximum !== undefined) out.push(`Less than ${s.exclusiveMaximum}`);
  if (s.multipleOf !== undefined) out.push(`Multiple of ${s.multipleOf}`);
  if (s.uniqueItems) out.push("No repeats");
  if (s.pattern) out.push(`Pattern: ${s.pattern}`);
  return out;
}

/** A JSON Schema's properties as fields – nested objects and arrays of objects as `fields` */
export function schemaToFields(schema: JsonSchema | undefined, root: JsonSchema | undefined = schema, depth = 0): SchemaField[] {
  if (!schema || !root || depth > MAX_DEPTH) return [];
  const { node } = resolve(schema, root);
  const required = new Set(node.required ?? []);
  return Object.entries(node.properties ?? {}).map(([name, raw]) => {
    const { node: s, name: refTitle } = resolve(raw, root);
    const field: SchemaField = { name };
    const type = typeWords(s.type) ?? (s.properties ? "object" : s.items ? "array" : s.enum ? typeof s.enum[0] : undefined);
    if (type) field.type = type;
    if (s.format) field.format = s.format;
    if (s.enum) field.enum = s.enum;
    else if (s.const !== undefined) field.enum = [s.const];
    if (required.has(name)) field.required = true;
    if (s.deprecated) field.deprecated = true;
    if (s.default !== undefined) field.default = s.default;
    if (s.description ?? raw.description) field.description = raw.description ?? s.description;
    const limits = schemaConstraints(s);
    if (limits.length) field.constraints = limits;
    if (s.items) {
      const { node: item, name: itemName } = resolve(s.items, root);
      field.items = itemName ?? typeWords(item.type) ?? (item.properties ? "object" : undefined);
      if (item.format && !itemName) field.items = `${field.items} · ${item.format}`;
      if (item.properties) field.fields = schemaToFields(item, root, depth + 1);
    } else if (s.properties) {
      field.fields = schemaToFields(s, root, depth + 1);
      if (refTitle && field.type === "object") field.type = refTitle;
    }
    return field;
  });
}

/** A field's type in words: "string · email", "array of Tag", "string or null" */
export function fieldTypeWords(f: SchemaField) {
  if (f.type === "array" || f.items) return `array of ${f.items ?? "values"}`;
  const t = f.type ?? (f.fields?.length ? "object" : "");
  return [t, f.format].filter(Boolean).join(" · ");
}

const valueText = (v: unknown) => (typeof v === "string" ? v : JSON.stringify(v));

/* ---------- Inline Markdown: `code`, **bold**, [text](url) ---------- */

function inline(text: string): (string | TemplateResult)[] {
  const out: (string | TemplateResult)[] = [];
  const re = /`([^`]+)`|\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let at = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (m.index > at) out.push(text.slice(at, m.index));
    if (m[1] !== undefined) out.push(html`<code class="ui-scf__code">${m[1]}</code>`);
    else if (m[2] !== undefined) out.push(html`<strong>${m[2]}</strong>`);
    else {
      const href = safeUrl(m[4]);
      out.push(href ? html`<a class="ui-scf__link" href=${href}>${m[3]}</a>` : m[3]);
    }
    at = m.index + m[0].length;
  }
  if (at < text.length) out.push(text.slice(at));
  return out;
}

/* list-tree, chevron-right, link, search: Lucide (ISC, lucide.dev) */
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const headIcon = svg`<path d="M21 12h-8"></path><path d="M21 6H8"></path><path d="M21 18h-8"></path><path d="M3 6v4c0 1.1.9 2 2 2h3"></path><path d="M3 10v6c0 1.1.9 2 2 2h3"></path>`;
const chevron = () => lucide(14, svg`<path d="m9 18 6-6-6-6"></path>`);
const linkIcon = () => lucide(14, svg`<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>`);
const searchIcon = () => lucide(14, svg`<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path>`);

type Row = { field: SchemaField; path: string; depth: number; parent: string | null; nested: boolean; open: boolean };

let uidCount = 0;

/**
 * An API's fields from a JSON Schema: name, type in words, required, default, limits and meaning, with nested objects folding under their field.
 * @tag tc-schema-fields
 * @fires tc-expanded-change - A field's children opened or closed, or Expand all / Collapse all was pressed ({ expanded, path, open }: SchemaFieldsExpandedChange); cancelable – prevented, `expanded` stays as it was
 * @fires tc-query-change - The filter changed ({ query }: SchemaFieldsQueryChange); cancelable – prevented, `query` stays as it was
 * @fires tc-anchor-copy - Copy link was pressed ({ id, path, url }: SchemaFieldsAnchorCopy); cancelable – prevented, nothing is copied
 */
export class TcSchemaFields extends TcElement {
  static override ui = "scf";

  /** The heading */
  @property() accessor heading = "Fields";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** A JSON Schema for an object; its properties become the fields */
  @property({ attribute: false }) accessor schema: JsonSchema | undefined = undefined;
  /** The fields themselves; wins over `schema` */
  @property({ attribute: false }) accessor fields: SchemaField[] | undefined = undefined;
  /** The paths of fields whose children are showing ("owner", "owner.address"). Changed by the toggles unless a tc-expanded-change listener calls preventDefault() */
  @property({ attribute: false }) accessor expanded: string[] = [];
  /** The filter text. Changed by typing unless a tc-query-change listener calls preventDefault() */
  @property() accessor query = "";
  /** How many fields bring up the filter box; 0 always shows it */
  @property({ type: Number, attribute: "search-threshold" }) accessor searchThreshold = 8;
  /** What anchors start with: `<id-prefix>-owner.email` */
  @property({ attribute: "id-prefix" }) accessor idPrefix = "field";
  /** The address Copy link puts before the anchor; the page's own address when empty */
  @property({ attribute: "anchor-base" }) accessor anchorBase = "";
  /** Rename any of the words, over the defaults */
  @property({ attribute: false }) accessor labels: Partial<SchemaFieldsLabels> = {};

  /** The tab stop: a field's path and a button in its row (0 the first, 1 Copy link) */
  @state() private accessor active = { path: "", c: 0 };
  @state() private accessor announce = "";

  private uid = `tc-scf-${++uidCount}`;

  private word<K extends keyof SchemaFieldsLabels>(key: K) {
    return this.labels[key] ?? defaultSchemaFieldsLabels[key];
  }

  /** The fields drawn: `fields`, else the schema's */
  get resolvedFields(): SchemaField[] {
    return this.fields ?? schemaToFields(this.schema);
  }

  private countAll(fields: SchemaField[]): number {
    return fields.reduce((n, f) => n + 1 + this.countAll(f.fields ?? []), 0);
  }

  /** Paths whose field, or a field below it, matches the filter; null when there's no filter */
  private hitsFor(fields: SchemaField[]): Set<string> | null {
    const q = this.query.trim().toLowerCase();
    if (!q) return null;
    const hit = new Set<string>();
    const walk = (list: SchemaField[], parent: string): boolean => {
      let any = false;
      for (const f of list) {
        const path = parent ? `${parent}.${f.name}` : f.name;
        const own = f.name.toLowerCase().includes(q) || (f.description ?? "").toLowerCase().includes(q);
        const below = walk(f.fields ?? [], path);
        if (own || below) {
          hit.add(path);
          any = true;
        }
      }
      return any;
    };
    walk(fields, "");
    return hit;
  }

  /** The rows showing, in order */
  private rows(fields: SchemaField[], hits: Set<string> | null): Row[] {
    const open = new Set(this.expanded);
    const out: Row[] = [];
    const walk = (list: SchemaField[], parent: string | null, depth: number) => {
      for (const field of list) {
        const path = parent ? `${parent}.${field.name}` : field.name;
        if (hits && !hits.has(path)) continue;
        const nested = !!field.fields?.length;
        // While filtering, a field with matches below it shows them
        const isOpen = nested && (open.has(path) || (!!hits && (field.fields ?? []).some((c) => hits.has(`${path}.${c.name}`))));
        out.push({ field, path, depth, parent, nested, open: isOpen });
        if (isOpen) walk(field.fields!, path, depth + 1);
      }
    };
    walk(fields, null, 0);
    return out;
  }

  private allNested(fields: SchemaField[], parent = ""): string[] {
    return fields.flatMap((f) => {
      const path = parent ? `${parent}.${f.name}` : f.name;
      return f.fields?.length ? [path, ...this.allNested(f.fields, path)] : [];
    });
  }

  private setExpanded(next: string[], path: string | null, open: boolean) {
    if (!this.emit<SchemaFieldsExpandedChange>("tc-expanded-change", { expanded: next, path, open }, { cancelable: true })) return;
    this.expanded = next;
  }
  private toggle(row: Row) {
    const open = !row.open;
    const next = open ? [...this.expanded.filter((p) => p !== row.path), row.path] : this.expanded.filter((p) => p !== row.path && !p.startsWith(`${row.path}.`));
    this.setExpanded(next, row.path, open);
  }

  private anchorId(path: string) {
    return `${this.idPrefix}-${path}`;
  }
  private async copyLink(row: Row) {
    const id = this.anchorId(row.path);
    const base = this.anchorBase || (typeof location !== "undefined" ? location.href.split("#")[0] : "");
    const url = `${base}#${id}`;
    this.active = { path: row.path, c: row.nested ? 1 : 0 };
    if (!this.emit<SchemaFieldsAnchorCopy>("tc-anchor-copy", { id, path: row.path, url }, { cancelable: true })) return;
    if (await copyText(url)) this.announce = `${this.word("copied")}: ${row.path}`;
  }

  private onInput = (e: Event) => {
    const field = e.target as HTMLInputElement;
    const query = field.value;
    if (!this.emit<SchemaFieldsQueryChange>("tc-query-change", { query }, { cancelable: true })) {
      field.value = this.query;
      return;
    }
    this.query = query;
  };

  private focusAt(rows: Row[], r: number, c: number) {
    if (!rows.length) return;
    r = Math.max(0, Math.min(rows.length - 1, r));
    if (c === 1 && !rows[r].nested) c = 0;
    this.active = { path: rows[r].path, c };
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-at="${r}:${c}"]`)?.focus());
  }

  private onKey(e: KeyboardEvent, rows: Row[]) {
    const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-at]");
    if (!btn || e.altKey || e.metaKey || e.ctrlKey) return;
    const [r, c] = btn.dataset.at!.split(":").map(Number);
    const row = rows[r];
    let handled = true;
    if (e.key === "ArrowDown") this.focusAt(rows, r + 1, 0);
    else if (e.key === "ArrowUp") this.focusAt(rows, r - 1, 0);
    else if (e.key === "Home") this.focusAt(rows, 0, 0);
    else if (e.key === "End") this.focusAt(rows, rows.length - 1, 0);
    else if (e.key === "ArrowRight") {
      if (c === 0 && row.nested && !row.open) this.toggle(row);
      else if (c === 0 && row.nested) this.focusAt(rows, r, 1);
    } else if (e.key === "ArrowLeft") {
      if (c === 1) this.focusAt(rows, r, 0);
      else if (row.nested && row.open) this.toggle(row);
      else if (row.parent !== null) this.focusAt(rows, rows.findIndex((x) => x.path === row.parent), 0);
    } else handled = false;
    if (handled) e.preventDefault();
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("query")) {
      const fields = this.resolvedFields;
      const hits = this.hitsFor(fields);
      if (hits) this.announce = hits.size ? `${hits.size} ${hits.size === 1 ? "field matches" : "fields match"}` : this.word("noMatch");
      else if (changed.get("query")) this.announce = "";
    }
  }

  private renderRows(rows: Row[], parent: string | null): TemplateResult[] {
    const out: TemplateResult[] = [];
    rows.forEach((row, r) => {
      if (row.parent === parent) out.push(this.renderRow(row, r, rows));
    });
    return out;
  }

  private renderRow(row: Row, r: number, rows: Row[]): TemplateResult {
    const f = row.field;
    const active = this.active.path === row.path || (r === 0 && !rows.some((x) => x.path === this.active.path));
    // A field without children has one button, Copy link, at 0
    const copyAt = row.nested ? 1 : 0;
    const tab = (c: number) => (active && (this.active.c === c || (!row.nested && c === 0)) ? 0 : -1);
    const childId = `${this.uid}-g-${r}`;
    const reqState = f.deprecated ? "deprecated" : f.required ? "required" : "optional";
    const typeText = fieldTypeWords(f);
    const count = f.fields?.length ?? 0;
    const name = html`<code class="ui-scf__name">${f.name}</code>`;
    return html`<li class="ui-scf__row" id=${this.anchorId(row.path)} data-path=${row.path} data-depth=${row.depth}>
      <div class="ui-scf__body" style=${`--tc-scf-depth: ${row.depth}`}>
        <div class="ui-scf__line">
          ${row.nested
            ? html`<button type="button" class="ui-scf__toggle" data-at=${`${r}:0`} tabindex=${tab(0)} aria-expanded=${row.open ? "true" : "false"} aria-controls=${ifDefined(row.open ? childId : undefined)} @click=${() => {
                  this.active = { path: row.path, c: 0 };
                  this.toggle(row);
                }}>
                <span class="ui-scf__chev" aria-hidden="true">${chevron()}</span>${name}<span class="tc-sr-only">, ${count} ${count === 1 ? "field" : "fields"}</span>
              </button>`
            : html`<span class="ui-scf__leaf">${name}</span>`}
          ${typeText ? html`<span class="ui-scf__type">${typeText}</span>` : nothing}
          <span class="ui-scf__req" data-req=${reqState}>${this.word(reqState === "required" ? "required" : reqState === "deprecated" ? "deprecated" : "optional")}</span>
          <button type="button" class="ui-scf__copy" data-at=${`${r}:${copyAt}`} tabindex=${tab(copyAt)} @click=${() => this.copyLink(row)}>
            ${linkIcon()}<span class="tc-sr-only">${this.word("copyLink")} ${row.path}</span>
          </button>
        </div>
        ${f.description ? html`<p class="ui-scf__desc">${inline(f.description)}</p>` : nothing}
        ${f.enum?.length
          ? html`<div class="ui-scf__enum"><span class="ui-scf__meta-label">${this.word("oneOf")}:</span>
              <ul class="ui-scf__chips" role="list">${f.enum.map((v) => html`<li class="ui-scf__chip"><code>${valueText(v)}</code></li>`)}</ul></div>`
          : nothing}
        ${f.default !== undefined || f.constraints?.length
          ? html`<p class="ui-scf__meta">
              ${f.default !== undefined ? html`<span>${this.word("defaultValue")}: <code class="ui-scf__code">${valueText(f.default)}</code></span>` : nothing}
              ${(f.constraints ?? []).map((c) => html`<span>${c}</span>`)}
            </p>`
          : nothing}
      </div>
      ${row.nested && row.open ? html`<ul class="ui-scf__group" id=${childId} role="list" aria-label=${`${f.name} fields`}>${this.renderRows(rows, row.path)}</ul>` : nothing}
    </li>`;
  }

  protected override render() {
    const fields = this.resolvedFields;
    const total = this.countAll(fields);
    const hits = this.hitsFor(fields);
    const rows = this.rows(fields, hits);
    const nested = this.allNested(fields);
    const allOpen = nested.length > 0 && nested.every((p) => this.expanded.includes(p));
    const showSearch = this.searchThreshold === 0 || total >= this.searchThreshold;
    const title = `${this.uid}-title`;
    const listId = `${this.uid}-list`;
    const countText = `${total} ${total === 1 ? "field" : "fields"}`;
    return html`${this.heading ? cardHead({ icon: headIcon, title: this.heading, subtitle: this.description, id: title, aside: html`<span class="ui-scf__total">${countText}</span>` }) : nothing}
      <div class="ui-scf__card">
        ${showSearch || nested.length
          ? html`<div class="ui-scf__tools">
              ${showSearch
                ? html`<label class="ui-scf__search">
                    ${searchIcon()}<span class="tc-sr-only">${this.word("filter")}</span>
                    <input type="search" class="ui-scf__input" placeholder=${`${this.word("filter")}…`} .value=${live(this.query)} @input=${this.onInput} />
                  </label>`
                : nothing}
              ${nested.length
                ? html`<button type="button" class="tc-btn-sm ui-scf__all" aria-controls=${listId} @click=${() => this.setExpanded(allOpen ? [] : nested, null, !allOpen)}>
                    ${allOpen ? this.word("collapseAll") : this.word("expandAll")}
                  </button>`
                : nothing}
            </div>`
          : nothing}
        ${rows.length
          ? html`<ul class="ui-scf__list" id=${listId} aria-labelledby=${ifDefined(this.heading ? title : undefined)} aria-label=${ifDefined(this.heading ? undefined : "Fields")} @keydown=${(e: KeyboardEvent) => this.onKey(e, rows)}>
              ${this.renderRows(rows, null)}
            </ul>`
          : html`<p class="ui-scf__empty">${hits ? this.word("noMatch") : this.word("empty")}</p>`}
      </div>
      <span class="tc-sr-only" role="status">${this.announce}</span>`;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="scf"] {
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="scf"] {
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="scf"] {
  --tc-scf-indent: var(--tc-space-5);
  container-type: inline-size;
}
[data-ui="scf"] *, [data-ui="scf"] *::before, [data-ui="scf"] *::after { box-sizing: border-box; }
:where([data-ui="scf"]) button:not(.tc-btn-sm) { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="scf"] button:not(.tc-btn-sm):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); border-radius: var(--tc-radius-sm); }
[data-ui="scf"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="scf"] svg { display: block; flex: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-scf__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-scf__total { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; }
.ui-scf__tools { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-4); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-scf__search { flex: 1 1 12rem; display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2); border: var(--tc-hairline) solid var(--tc-border-default); border-radius: var(--tc-control-radius-sm); background: var(--tc-surface-raised); color: var(--tc-text-muted); }
.ui-scf__search:focus-within { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-scf__input { flex: 1 1 0; min-width: 0; height: 100%; margin: 0; padding: 0; border: 0; background: none; font: inherit; font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); outline: none; }
.ui-scf__input::placeholder { color: var(--tc-text-muted); }
.ui-scf__row { border-top: var(--tc-hairline) solid var(--tc-divider); scroll-margin-top: var(--tc-space-6); }
.ui-scf__list > .ui-scf__row:first-child { border-top: 0; }
.ui-scf__body { position: relative; display: grid; gap: var(--tc-space-1); padding: var(--tc-space-2-5) var(--tc-space-4) var(--tc-space-2-5) calc(var(--tc-space-4) + var(--tc-scf-depth, 0) * var(--tc-scf-indent)); }
.ui-scf__row:not([data-depth="0"]) > .ui-scf__body::before { content: ""; position: absolute; top: 0; bottom: 0; left: calc(var(--tc-space-4) + (var(--tc-scf-depth) - 1) * var(--tc-scf-indent) + var(--tc-space-1-5)); border-left: var(--tc-hairline) solid var(--tc-border-default); }
.ui-scf__row:target > .ui-scf__body { background: var(--tc-fill-hover); }
.ui-scf__line { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-2); min-height: var(--tc-control-h-sm); }
.ui-scf__toggle { display: inline-flex; align-items: center; gap: var(--tc-space-1); min-height: var(--tc-control-h-sm); margin-left: calc(var(--tc-space-1) * -1); padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-sm); }
.ui-scf__toggle:hover { background: var(--tc-fill-hover); }
.ui-scf__chev { color: var(--tc-text-muted); transition: transform var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-scf__toggle[aria-expanded="true"] .ui-scf__chev { transform: rotate(90deg); }
.ui-scf__leaf { display: inline-flex; align-items: center; padding-left: var(--tc-space-1); }
.ui-scf__name { font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-primary); overflow-wrap: anywhere; }
.ui-scf__type { font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); color: var(--tc-text-secondary); overflow-wrap: anywhere; }
.ui-scf__req { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-scf__req[data-req="required"] { color: var(--tc-status-danger-fg); font-weight: var(--tc-font-weight-medium); }
.ui-scf__req[data-req="deprecated"] { color: var(--tc-status-warning-fg); font-weight: var(--tc-font-weight-medium); }
.ui-scf__copy { display: inline-flex; align-items: center; justify-content: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); margin-left: auto; border-radius: var(--tc-radius-sm); color: var(--tc-text-muted); opacity: 0; }
.ui-scf__row:hover .ui-scf__copy, .ui-scf__copy:focus-visible { opacity: 1; }
.ui-scf__copy:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
@media (hover: none) { .ui-scf__copy { opacity: 1; } }
.ui-scf__desc, .ui-scf__meta { margin: 0; padding-left: var(--tc-space-1); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-secondary); overflow-wrap: anywhere; }
.ui-scf__meta { display: flex; flex-wrap: wrap; gap: var(--tc-space-1) var(--tc-space-3); color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); }
.ui-scf__code { padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-sm); background: var(--tc-fill-subtle); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); color: var(--tc-text-primary); }
.ui-scf__link { color: var(--tc-accent-text); text-decoration: underline; }
.ui-scf__link:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); border-radius: var(--tc-radius-sm); }
.ui-scf__enum { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1); padding-left: var(--tc-space-1); }
.ui-scf__meta-label { color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); }
.ui-scf__chips { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); }
.ui-scf__chip { padding: 0 var(--tc-space-1-5); border: var(--tc-hairline) solid var(--tc-border-default); border-radius: var(--tc-radius-full); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); color: var(--tc-text-primary); }
.ui-scf__chip code { font: inherit; }
.ui-scf__empty { margin: 0; padding: var(--tc-space-4); color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
@container (max-width: 420px) {
  [data-ui="scf"] { --tc-scf-indent: var(--tc-space-3); }
  .ui-scf__copy { opacity: 1; }
}
@media (prefers-reduced-motion: reduce) { .ui-scf__chev { transition: none; } }
@media (forced-colors: active) { .ui-scf__copy { opacity: 1; } .ui-scf__chip { border-color: CanvasText; } }
`;
}

if (!customElements.get("tc-schema-fields")) customElements.define("tc-schema-fields", TcSchemaFields);
declare global {
  interface HTMLElementTagNameMap {
    "tc-schema-fields": TcSchemaFields;
  }
}
