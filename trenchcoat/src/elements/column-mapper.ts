import { html, nothing, svg, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-column-mapper> – a model matches a file's columns to your fields, and a person checks it. One row per column in
 * the file: its name and a few sample values on the left, and on the right a select of your fields (or "Don't
 * import"), prefilled from the model's suggestion. A suggestion in use is marked "Suggested" with how sure the model
 * was in a word (High, Medium, Low); one that's been changed away from stays visible with "Use suggestion". Under the
 * rows: required fields nothing goes to, and two columns going to the same field, both in words. "Accept all
 * suggestions" puts every suggestion back in one go, and Continue is held until the mapping is complete.
 *
 *   <tc-column-mapper .columns=${columns} .fields=${fields} .suggestions=${suggestions}></tc-column-mapper>
 *
 * `mapping` is the value – column id to field id, null for "Don't import". A column it leaves out falls back to its
 * suggestion. Every change fires a cancelable tc-mapping-change ({ mapping, column, field }) with every column in the
 * mapping. Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 */

/** Columns with an arrow between them: one thing to another (Lucide arrow-right-left, ISC) */
const mapIcon = svg`<path d="m16 3 4 4-4 4"></path><path d="M20 7H4"></path><path d="m8 21-4-4 4-4"></path><path d="M4 17h16"></path>`;

/** A column of the file */
export type ColumnMapperColumn = {
  id: string;
  /** The header as written in the file */
  name: string;
  /** A few values from the column, to recognise it by */
  samples?: string[];
};

/** A field the rows will be imported into */
export type ColumnMapperField = {
  id: string;
  label: string;
  /** What the field holds, shown beside its name: "text", "number", "date", "email" … */
  type?: string;
  /** Rows can't be imported unless a column goes to it */
  required?: boolean;
};

/** The model's suggestion for one column */
export type ColumnMapperSuggestion = {
  column: string;
  /** The field it goes to, or null for "Don't import" */
  field: string | null;
  /** How sure the model is, 0 to 1 */
  confidence: number;
};

/** Column id → field id, or null for "Don't import" */
export type ColumnMapping = Record<string, string | null>;

/** Detail of tc-mapping-change: the whole mapping with the change, the column that changed (null for all at once) and its field */
export type ColumnMappingChange = { mapping: ColumnMapping; column: string | null; field: string | null };
/** Detail of tc-continue */
export type ColumnMapperContinue = { mapping: ColumnMapping };

export const defaultColumnMapperLabels = {
  skip: "Don't import",
  required: "required",
  suggested: "Suggested",
  useSuggestion: "Use suggestion",
  acceptAll: "Accept all suggestions",
  allInUse: "Every suggestion is in use",
  continue: "Continue",
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
  noColumns: "No columns to match",
};
export type ColumnMapperLabels = typeof defaultColumnMapperLabels;

/** High at 0.85 and above, Medium at 0.6 and above, Low below */
export const confidenceLevel = (c: number): "high" | "medium" | "low" => (c >= 0.85 ? "high" : c >= 0.6 ? "medium" : "low");

/** Every column's field: the mapping's, else its suggestion's, else null */
export function resolveMapping(columns: ColumnMapperColumn[], mapping: ColumnMapping, suggestions: ColumnMapperSuggestion[]): ColumnMapping {
  const suggested = new Map(suggestions.map((s) => [s.column, s.field]));
  return Object.fromEntries(columns.map((c) => [c.id, c.id in mapping ? mapping[c.id] : (suggested.get(c.id) ?? null)]));
}

/** What's wrong with a mapping: required fields nothing goes to, and fields more than one column goes to */
export function mappingProblems(columns: ColumnMapperColumn[], fields: ColumnMapperField[], mapping: ColumnMapping) {
  const used = new Map<string, string[]>();
  for (const c of columns) {
    const f = mapping[c.id];
    if (f) used.set(f, [...(used.get(f) ?? []), c.id]);
  }
  const missing = fields.filter((f) => f.required && !used.has(f.id)).map((f) => f.id);
  const duplicates = [...used].filter(([, cols]) => cols.length > 1).map(([field, cols]) => ({ field, columns: cols }));
  return { missing, duplicates };
}

/* ---------- Icons: 24px line glyphs (Lucide, ISC) ---------- */

const glyph = (d: string) => html`<svg viewBox="0 0 24 24" class="ui-cmap__glyph" aria-hidden="true">${svg`<path d=${d}></path>`}</svg>`;
const icons = {
  arrow: "M5 12h14M13 6l6 6-6 6",
  chevron: "m6 9 6 6 6-6",
  sparkle: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z",
  alert: "M12 8v5M12 16.5h.01M10.3 3.9 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
};

let instances = 0;

/**
 * Match a file's columns to your fields: a model's suggestion per column with its confidence in words, a select of
 * fields (or Don't import) per column, required fields left out and duplicates in words, and Accept all suggestions.
 * @tag tc-column-mapper
 * @fires tc-mapping-change - A column's field was changed, or every suggestion accepted ({ mapping, column, field }: ColumnMappingChange); cancelable – prevented, `mapping` stays as it was
 * @fires tc-continue - Continue was pressed with every required field matched and no field matched twice ({ mapping }: ColumnMapperContinue)
 */
export class TcColumnMapper extends TcElement {
  static override ui = "cmap";

  /** The heading */
  @property() accessor heading = "Match columns";
  /** A quiet line under the heading – the file, or what the rows become */
  @property() accessor description = "";
  /** The file's columns, in order */
  @property({ attribute: false }) accessor columns: ColumnMapperColumn[] = [];
  /** The fields the rows are imported into */
  @property({ attribute: false }) accessor fields: ColumnMapperField[] = [];
  /** The model's suggestion per column, with how sure it is */
  @property({ attribute: false }) accessor suggestions: ColumnMapperSuggestion[] = [];
  /** The value: column id → field id, null for "Don't import". Columns left out use their suggestion. Changed unless a tc-mapping-change listener calls preventDefault() */
  @property({ attribute: false }) accessor mapping: ColumnMapping = {};
  /** Hides Continue, for a page with its own next step */
  @property({ type: Boolean, attribute: "hide-continue" }) accessor hideContinue = false;
  /** Words the page can rename, merged over defaultColumnMapperLabels */
  @property({ attribute: false }) accessor labels: Partial<ColumnMapperLabels> = {};

  /** @internal What the status region says */
  @state() accessor said = "";

  private readonly uid = `tc-cmap${++instances}`;

  private get w(): ColumnMapperLabels {
    return { ...defaultColumnMapperLabels, ...this.labels };
  }

  /** Every column's field, suggestions filled in */
  get resolved(): ColumnMapping {
    return resolveMapping(this.columns, this.mapping, this.suggestions);
  }

  private fieldLabel(id: string | null) {
    return id === null ? this.w.skip : (this.fields.find((f) => f.id === id)?.label ?? id);
  }
  private columnName(id: string) {
    return this.columns.find((c) => c.id === id)?.name ?? id;
  }

  private change(mapping: ColumnMapping, column: string | null, field: string | null) {
    if (!this.emit<ColumnMappingChange>("tc-mapping-change", { mapping, column, field }, { cancelable: true })) {
      this.requestUpdate();
      return false;
    }
    this.mapping = mapping;
    return true;
  }

  private setColumn(column: string, field: string | null) {
    const next = { ...this.resolved, [column]: field };
    if (this.change(next, column, field)) this.said = `${this.columnName(column)} goes to ${this.fieldLabel(field)}`;
  }

  private acceptAll() {
    const now = this.resolved;
    const pending = this.suggestions.filter((s) => this.columns.some((c) => c.id === s.column) && now[s.column] !== s.field);
    if (!pending.length) {
      this.said = this.w.allInUse;
      return;
    }
    const next = { ...now };
    for (const s of pending) next[s.column] = s.field;
    if (this.change(next, null, null)) this.said = `${pending.length === 1 ? "1 suggestion" : `${pending.length} suggestions`} accepted`;
  }

  private continue() {
    const mapping = this.resolved;
    const { missing, duplicates } = mappingProblems(this.columns, this.fields, mapping);
    if (missing.length || duplicates.length || !this.columns.length) {
      this.said = this.blockers(missing, duplicates).join(". ");
      return;
    }
    this.emit<ColumnMapperContinue>("tc-continue", { mapping });
  }

  private blockers(missing: string[], duplicates: { field: string; columns: string[] }[]) {
    const out: string[] = [];
    if (missing.length) out.push(`Required ${missing.length === 1 ? "field" : "fields"} not matched: ${missing.map((f) => this.fieldLabel(f)).join(", ")}`);
    for (const d of duplicates) out.push(`${d.columns.length === 2 ? "Two" : d.columns.length} columns go to ${this.fieldLabel(d.field)}: ${d.columns.map((c) => `“${this.columnName(c)}”`).join(" and ")}`);
    return out;
  }

  /* ---------- Rendering ---------- */

  private renderRow(col: ColumnMapperColumn, index: number, mapping: ColumnMapping, duplicated: Set<string>): TemplateResult {
    const w = this.w;
    // Ids from the position: a column id can hold anything, spaces included
    const id = `${this.uid}-c${index}`;
    const current = mapping[col.id] ?? null;
    const s = this.suggestions.find((x) => x.column === col.id);
    const inUse = !!s && s.field === current;
    const level = s ? confidenceLevel(s.confidence) : null;
    const dup = current !== null && duplicated.has(current);
    const samples = (col.samples ?? []).filter(Boolean).slice(0, 3);
    const note = s
      ? inUse
        ? html`<span class="ui-cmap__note" data-level=${level!}>${glyph(icons.sparkle)}<span>${w.suggested} · ${w[level!]}</span></span>`
        : html`<span class="ui-cmap__note" data-off>
            ${glyph(icons.sparkle)}<span>${w.suggested}: ${this.fieldLabel(s.field)} · ${w[level!]}</span>
            <button type="button" class="ui-cmap__use" @click=${() => this.setColumn(col.id, s.field)}>${w.useSuggestion}<span class="tc-sr-only"> for ${col.name}</span></button>
          </span>`
      : nothing;
    return html`<li class="ui-cmap__row" ?data-skip=${current === null} ?data-dup=${dup}>
      <div class="ui-cmap__source">
        <label class="ui-cmap__name" for=${id}>${col.name}</label>
        ${samples.length ? html`<span class="ui-cmap__samples"><span class="tc-sr-only">Sample values: </span>${samples.join(", ")}</span>` : nothing}
      </div>
      <span class="ui-cmap__arrow" aria-hidden="true">${glyph(icons.arrow)}</span>
      <div class="ui-cmap__target">
        <span class="ui-cmap__select">
          <select
            id=${id}
            class="ui-cmap__field"
            .value=${live(current ?? "")}
            aria-invalid=${ifDefined(dup ? "true" : undefined)}
            aria-describedby=${ifDefined(dup ? `${id}-dup` : s ? `${id}-note` : undefined)}
            @change=${(e: Event) => this.setColumn(col.id, (e.target as HTMLSelectElement).value || null)}
          >
            <option value="" ?selected=${current === null}>${w.skip}</option>
            ${this.fields.map((f) => html`<option value=${f.id} ?selected=${f.id === current}>${f.label}${f.required ? ` (${w.required})` : ""}</option>`)}
          </select>
          ${glyph(icons.chevron)}
        </span>
        <span id=${`${id}-note`} class="ui-cmap__note-wrap">${note}</span>
        ${dup ? html`<span class="ui-cmap__dup" id=${`${id}-dup`}>${glyph(icons.alert)}<span>Another column also goes to ${this.fieldLabel(current)}</span></span>` : nothing}
      </div>
    </li>`;
  }

  protected override render() {
    const w = this.w;
    const clean = this.resolvedLook === "clean";
    const mapping = this.resolved;
    const { missing, duplicates } = mappingProblems(this.columns, this.fields, mapping);
    const duplicated = new Set(duplicates.map((d) => d.field));
    const matched = this.columns.filter((c) => mapping[c.id] !== null).length;
    const skipped = this.columns.length - matched;
    const pending = this.suggestions.filter((s) => this.columns.some((c) => c.id === s.column) && mapping[s.column] !== s.field).length;
    const problems = this.blockers(missing, duplicates);
    const ready = !problems.length && this.columns.length > 0;
    const head = cardHead({
      icon: mapIcon,
      title: this.heading,
      subtitle: this.description || undefined,
      id: `${this.uid}-title`,
      aside: this.suggestions.length
        ? html`<button type="button" class="tc-btn-sm ui-cmap__accept" aria-disabled=${ifDefined(pending ? undefined : "true")} aria-describedby=${ifDefined(pending ? undefined : `${this.uid}-inuse`)} @click=${this.acceptAll}
              >${glyph(icons.sparkle)}${w.acceptAll}</button
            >${pending ? nothing : html`<span class="tc-sr-only" id=${`${this.uid}-inuse`}>${w.allInUse}</span>`}`
        : nothing,
    });
    const body = html`<div class="ui-cmap__body">
      ${this.columns.length
        ? html`<ul class="ui-cmap__rows" aria-labelledby=${`${this.uid}-title`}>
            ${repeat(
              this.columns,
              (c) => c.id,
              (c, i) => this.renderRow(c, i, mapping, duplicated),
            )}
          </ul>`
        : html`<p class="ui-cmap__empty">${w.noColumns}</p>`}
      ${problems.length
        ? html`<ul class="ui-cmap__problems" aria-label=${problems.length === 1 ? "1 problem" : `${problems.length} problems`}>
            ${problems.map((p) => html`<li>${glyph(icons.alert)}<span>${p}</span></li>`)}
          </ul>`
        : nothing}
    </div>`;
    const foot = html`<div class="ui-cmap__foot">
      <span class="ui-cmap__summary">${matched} of ${this.columns.length} ${this.columns.length === 1 ? "column" : "columns"} matched${skipped ? ` · ${skipped} not imported` : ""}</span>
      ${this.hideContinue
        ? nothing
        : html`<button type="button" class="ui-cmap__continue" aria-disabled=${ifDefined(ready ? undefined : "true")} aria-describedby=${ifDefined(ready ? undefined : `${this.uid}-why`)} @click=${this.continue}>${w.continue}</button>
            ${ready ? nothing : html`<span class="tc-sr-only" id=${`${this.uid}-why`}>${problems.join(". ") || w.noColumns}</span>`}`}
    </div>`;
    return html`
      ${clean ? html`<div class="ui-cmap__card">${head}${body}${foot}</div>` : html`${head}<div class="ui-cmap__card">${body}</div>${foot}`}
      <span class="tc-sr-only" role="status">${this.said}</span>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card; the summary and Continue sit on the tray below it */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="cmap"] {
  --tc-column-mapper-source: minmax(0, 1fr);
  --tc-column-mapper-target: minmax(0, 1.1fr);
  box-sizing: border-box;
  container-type: inline-size;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  width: 100%;
  max-width: 720px;
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
/* Clean: one white card, its last row the summary */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="cmap"] {
  --tc-column-mapper-source: minmax(0, 1fr);
  --tc-column-mapper-target: minmax(0, 1.1fr);
  box-sizing: border-box;
  container-type: inline-size;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  width: 100%;
  max-width: 700px;
  min-width: 0;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="cmap"] *, [data-ui="cmap"] *::before, [data-ui="cmap"] *::after { box-sizing: border-box; }
:where([data-ui="cmap"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-ui="cmap"]) svg { display: block; flex: none; }
[data-ui="cmap"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-look="standard"], [data-look="standard"] *).ui-cmap__glyph { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-cmap__glyph { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="standard"], [data-look="standard"] *).ui-cmap__card { min-width: 0; overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-cmap__card { min-width: 0; overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
:where([data-look="clean"], [data-look="clean"] *).ui-cmap__card > .tc-head + .ui-cmap__body { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-cmap__accept[aria-disabled="true"] { color: var(--tc-text-muted); cursor: default; }
.ui-cmap__accept .ui-cmap__glyph { width: 14px; height: 14px; }
.ui-cmap__body { display: grid; gap: var(--tc-space-3); min-width: 0; padding: var(--tc-space-2) var(--tc-space-4) var(--tc-space-4); }
.ui-cmap__rows { display: grid; margin: 0; padding: 0; list-style: none; }
.ui-cmap__row { display: grid; grid-template-columns: var(--tc-column-mapper-source) auto var(--tc-column-mapper-target); align-items: start; gap: var(--tc-space-3); padding: var(--tc-space-3) 0; border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-cmap__row:last-child { border-bottom: 0; }
.ui-cmap__source { display: grid; gap: var(--tc-space-0-5); min-width: 0; padding-top: var(--tc-space-1-5); }
.ui-cmap__name { overflow: hidden; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
.ui-cmap__row[data-skip] .ui-cmap__name { color: var(--tc-text-muted); }
.ui-cmap__samples { overflow: hidden; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
.ui-cmap__arrow { padding-top: var(--tc-space-2); color: var(--tc-icon-muted); }
.ui-cmap__row[data-skip] .ui-cmap__arrow { opacity: 0.4; }
.ui-cmap__target { display: grid; gap: var(--tc-space-1); min-width: 0; }
/* The select drawn as a field: no native arrow, a chevron at the end */
.ui-cmap__select { position: relative; display: block; min-width: 0; }
.ui-cmap__field { width: 100%; min-width: 0; height: var(--tc-field-h); margin: 0; padding: 0 var(--tc-space-8) 0 var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font: inherit; font-size: var(--tc-field-font-size); color: var(--tc-text-primary); text-overflow: ellipsis; appearance: none; outline: none; cursor: pointer; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-cmap__field:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-cmap__field:focus-visible { box-shadow: var(--tc-field-shadow-focus); }
.ui-cmap__field[aria-invalid="true"]:not(:focus-visible) { box-shadow: var(--tc-field-shadow-invalid); }
.ui-cmap__row[data-skip] .ui-cmap__field { color: var(--tc-text-muted); }
.ui-cmap__select > .ui-cmap__glyph { position: absolute; top: 50%; right: var(--tc-space-3); color: var(--tc-icon-muted); transform: translateY(-50%); pointer-events: none; }
.ui-cmap__note-wrap:empty { display: none; }
.ui-cmap__note { display: inline-flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1); font-size: var(--tc-font-size-xs); color: var(--tc-accent-text); }
.ui-cmap__note .ui-cmap__glyph { width: 12px; height: 12px; }
.ui-cmap__note[data-level="low"] { color: var(--tc-status-warning-fg); }
.ui-cmap__note[data-off] { color: var(--tc-text-muted); }
.ui-cmap__use { color: var(--tc-accent-text); text-decoration: underline; text-underline-offset: 2px; }
.ui-cmap__dup { display: inline-flex; align-items: center; gap: var(--tc-space-1); font-size: var(--tc-font-size-xs); color: var(--tc-status-danger-fg); }
.ui-cmap__dup .ui-cmap__glyph { width: 12px; height: 12px; }
.ui-cmap__empty { margin: 0; padding: var(--tc-space-8) 0; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); text-align: center; }
.ui-cmap__problems { display: grid; gap: var(--tc-space-1); margin: 0; padding: var(--tc-space-2) var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-status-warning-bg); list-style: none; }
.ui-cmap__problems li { display: flex; align-items: start; gap: var(--tc-space-2); font-size: var(--tc-font-size-sm); color: var(--tc-status-warning-fg); }
.ui-cmap__problems .ui-cmap__glyph { width: 14px; height: 14px; margin-top: var(--tc-space-0-5); }
/* The tray below the card (Standard) / the card's last row (Clean) */
.ui-cmap__foot { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3); min-height: 44px; padding: var(--tc-space-1) var(--tc-space-1) var(--tc-space-1) var(--tc-space-3); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-cmap__foot { min-height: 48px; padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-2) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-cmap__continue { flex: none; height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-primary-fg); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-cmap__continue:hover { background: var(--tc-action-primary-bg-hover); }
.ui-cmap__continue[aria-disabled="true"] { background: var(--tc-fill-strong); box-shadow: none; color: var(--tc-text-muted); cursor: default; }
/* Narrow: the column above its field */
@container (max-width: 520px) {
  .ui-cmap__row { grid-template-columns: minmax(0, 1fr); gap: var(--tc-space-1-5); }
  .ui-cmap__arrow { display: none; }
  .ui-cmap__source { padding-top: 0; }
  .ui-cmap__body { padding: var(--tc-space-2) var(--tc-space-3) var(--tc-space-3); }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="cmap"] *, [data-ui="cmap"] *::before, [data-ui="cmap"] *::after { transition: none !important; }
}
@media (forced-colors: active) {
  .ui-cmap__field { border: 1px solid ButtonText; }
  .ui-cmap__problems { border: 1px solid CanvasText; }
}
`;
}

if (!customElements.get("tc-column-mapper")) customElements.define("tc-column-mapper", TcColumnMapper);

declare global {
  interface HTMLElementTagNameMap {
    "tc-column-mapper": TcColumnMapper;
  }
}
