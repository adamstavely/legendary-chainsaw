import { html, nothing, svg, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { copyText, formatDate } from "./internal/util";

/*
 * <tc-query-builder> – a search query built from conditions instead of typed syntax. Conditions sit in a group joined
 * by AND or OR (a two-way switch per group), and the top group can hold one level of nested groups. Each condition
 * picks a field from the page's list, an operator that fits the field's type and a value: text, a number, a date, or
 * options from a list (one, or several as chips). Below the conditions it reads back the query twice – in words
 * ("Type is Document AND (Owner is K. Osei OR Updated after 1 Jun 2026)") and as a query string in mono, with Copy.
 *   · `value` is the tree; every edit fires one cancelable tc-value-change ({ value }) – call preventDefault() to
 *     control it. Run fires tc-submit ({ value, query }).
 *   · every control is a native select, input, radio or button with a label, so the keyboard is the browser's own
 *   · a condition without a value is left out of both read-backs until it has one
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-query-builder .fields=${[{ id: "type", label: "Type", type: "enum", options: [...] }]}></tc-query-builder>
 */

/** A field's kind of value, which decides its operators and its input */
export type QueryFieldType = "text" | "number" | "date" | "enum";
export type QueryFieldOption = { value: string; label: string };
export type QueryField = {
  id: string;
  label: string;
  type: QueryFieldType;
  /** The choices of an enum field */
  options?: QueryFieldOption[];
  /** The field's name in the query string; by default its id */
  key?: string;
};
export type QueryOperator = "is" | "is-not" | "contains" | "starts-with" | "gt" | "lt" | "between" | "before" | "after" | "any-of";
/** One condition. `value` is text for most operators, two texts for between, a list for any-of */
export type QueryCondition = { kind: "condition"; id: string; field: string; operator: QueryOperator; value: string | string[] };
export type QueryGroup = { kind: "group"; id: string; join: "and" | "or"; children: QueryNode[] };
export type QueryNode = QueryCondition | QueryGroup;

/** Details of the events */
export type QueryValueChange = { value: QueryGroup };
export type QuerySubmit = { value: QueryGroup; query: string };

/** The operators each type offers, in order, and their names */
export const queryOperators: Record<QueryFieldType, QueryOperator[]> = {
  text: ["is", "is-not", "contains", "starts-with"],
  number: ["is", "is-not", "gt", "lt", "between"],
  date: ["is", "before", "after", "between"],
  enum: ["is", "is-not", "any-of"],
};
export const defaultQueryOperatorLabels: Record<QueryOperator, string> = {
  is: "is",
  "is-not": "is not",
  contains: "contains",
  "starts-with": "starts with",
  gt: "greater than",
  lt: "less than",
  between: "between",
  before: "before",
  after: "after",
  "any-of": "is any of",
};

let uidCount = 0;
let nodeCount = 0;
const newId = (prefix: string) => `qb-${prefix}${++nodeCount}`;

/** An empty top group, the starting value */
export const emptyQuery = (): QueryGroup => ({ kind: "group", id: "root", join: "and", children: [] });

/* plus, x, copy, check, play, sliders, chevron-down: Lucide (ISC, lucide.dev) */
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const plusIcon = () => lucide(14, svg`<path d="M5 12h14"></path><path d="M12 5v14"></path>`);
const xIcon = () => lucide(14, svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`);
const copyIcon = () => lucide(14, svg`<rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>`);
const checkIcon = () => lucide(14, svg`<path d="M20 6 9 17l-5-5"></path>`);
const playIcon = () => lucide(14, svg`<polygon points="6 3 20 12 6 21 6 3"></polygon>`);
const chevronIcon = () => html`<svg class="ui-qb__chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>`;
const builderIcon = svg`<path d="M3 6h18"></path><path d="M7 12h10"></path><path d="M10 18h4"></path>`;

/** Is a condition complete enough to read back? */
function complete(c: QueryCondition) {
  if (c.operator === "between") return Array.isArray(c.value) && c.value.length === 2 && c.value.every((v) => v.trim() !== "");
  if (c.operator === "any-of") return Array.isArray(c.value) && c.value.length > 0;
  return typeof c.value === "string" && c.value.trim() !== "";
}
/** A value in the query string: quoted – with \ and " escaped – when it has spaces or the syntax's own characters, or
 *  would read as an operator (AND, OR, NOT, a leading - or +, a wildcard) */
const quote = (v: string) =>
  /[\s:()"\\*?{}[\]^~<>=!]/.test(v) || /^[-+]/.test(v) || /^(AND|OR|NOT|TO)$/i.test(v) || v === "" ? `"${v.replace(/[\\"]/g, (ch) => `\\${ch}`)}"` : v;

/**
 * A visual query builder – conditions joined by AND or OR, one level of nested groups, a field, an operator by type
 * and a value per condition, and the query read back in words and as a query string with Copy and Run.
 * @tag tc-query-builder
 * @fires tc-value-change - The query changed ({ value }: QueryValueChange); cancelable – prevented, `value` stays as it was
 * @fires tc-submit - Run was pressed ({ value, query }: QuerySubmit)
 */
export class TcQueryBuilder extends TcElement {
  static override ui = "qb";

  /** The heading, and the builder's name */
  @property() accessor heading = "Query builder";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The fields a condition can test */
  @property({ attribute: false }) accessor fields: QueryField[] = [];
  /** The query: the top group and everything in it. Changed by the user unless a tc-value-change listener calls preventDefault() */
  @property({ attribute: false }) accessor value: QueryGroup = emptyQuery();
  /** The operators' names, merged over the defaults */
  @property({ attribute: false }) accessor operatorLabels: Partial<Record<QueryOperator, string>> = {};
  /** The Run button's text; empty hides it */
  @property({ attribute: "run-label" }) accessor runLabel = "Run query";
  /** The language for dates and numbers in the read-back, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  @state() private accessor copied = false;
  @state() private accessor announce = "";

  private uid = `tc-qb-${++uidCount}`;
  private copiedTimer = 0;

  override disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.copiedTimer);
  }

  /* ---------- The model ---------- */

  private field(id: string) {
    return this.fields.find((f) => f.id === id);
  }
  private opLabel(op: QueryOperator) {
    return this.operatorLabels[op] ?? defaultQueryOperatorLabels[op];
  }
  private optionLabel(f: QueryField | undefined, v: string) {
    return f?.options?.find((o) => o.value === v)?.label ?? v;
  }
  private dateLabel(v: string) {
    const [y, m, d] = v.split("-").map(Number);
    if (!y || !m || !d) return v;
    return formatDate(new Date(y, m - 1, d), this.locale, { day: "numeric", month: "short", year: "numeric" });
  }
  private valueWords(f: QueryField | undefined, v: string) {
    if (f?.type === "enum") return this.optionLabel(f, v);
    if (f?.type === "date") return this.dateLabel(v);
    if (f?.type === "number") {
      const n = Number(v);
      return Number.isFinite(n) ? new Intl.NumberFormat(this.locale).format(n) : v;
    }
    return f?.type === "text" ? `“${v}”` : v;
  }

  /** A condition in words: "Owner is K. Osei" */
  private conditionWords(c: QueryCondition) {
    const f = this.field(c.field);
    const name = f?.label ?? c.field;
    const op = this.opLabel(c.operator);
    if (c.operator === "between" && Array.isArray(c.value)) return `${name} ${op} ${this.valueWords(f, c.value[0])} and ${this.valueWords(f, c.value[1])}`;
    if (c.operator === "any-of" && Array.isArray(c.value)) return `${name} ${op} ${c.value.map((v) => this.valueWords(f, v)).join(", ")}`;
    return `${name} ${op} ${this.valueWords(f, String(c.value))}`;
  }
  /** A condition as query syntax: owner:"K. Osei" */
  private conditionQuery(c: QueryCondition) {
    const f = this.field(c.field);
    const key = f?.key ?? c.field;
    const v = c.value;
    switch (c.operator) {
      case "is":
        return `${key}:${quote(String(v))}`;
      case "is-not":
        return `-${key}:${quote(String(v))}`;
      case "contains":
        return `${key}:*${quote(String(v))}*`;
      case "starts-with":
        return `${key}:${quote(String(v))}*`;
      case "gt":
      case "after":
        return `${key}:>${quote(String(v))}`;
      case "lt":
      case "before":
        return `${key}:<${quote(String(v))}`;
      case "between":
        return `${key}:${quote((v as string[])[0])}..${quote((v as string[])[1])}`;
      case "any-of":
        return `${key}:(${(v as string[]).map(quote).join(" OR ")})`;
    }
  }
  /** A group read back, joined by its AND or OR; nested groups in brackets. Empty when nothing in it is complete */
  private read(g: QueryGroup, as: "words" | "query", nested = false): string {
    const parts = g.children
      .map((n) => (n.kind === "group" ? this.read(n, as, true) : complete(n) ? (as === "words" ? this.conditionWords(n) : this.conditionQuery(n)) : ""))
      .filter(Boolean);
    const joined = parts.join(g.join === "and" ? " AND " : " OR ");
    return nested && parts.length > 1 ? `(${joined})` : joined;
  }
  /** The query string, as Run sends it */
  get query() {
    return this.read(this.value, "query");
  }
  /** The query in words */
  get summary() {
    return this.read(this.value, "words");
  }

  /* ---------- Changes ---------- */

  private commit(next: QueryGroup, said?: string) {
    if (!this.emit<QueryValueChange>("tc-value-change", { value: next }, { cancelable: true })) {
      // Controlled: the native controls show what they were given again
      this.requestUpdate();
      return;
    }
    this.value = next;
    if (said) this.announce = said;
  }
  /** The tree with one node replaced (or removed, with null) */
  private replace(g: QueryGroup, id: string, next: QueryNode | null): QueryGroup {
    return {
      ...g,
      children: g.children.flatMap((n) => {
        if (n.id === id) return next ? [next] : [];
        return n.kind === "group" ? [this.replace(n, id, next)] : [n];
      }),
    };
  }
  private freshCondition(): QueryCondition {
    const f = this.fields[0];
    return { kind: "condition", id: newId("c"), field: f?.id ?? "", operator: f ? queryOperators[f.type][0] : "is", value: "" };
  }
  private addCondition(group: QueryGroup) {
    const c = this.freshCondition();
    const next = group.id === this.value.id ? { ...this.value, children: [...this.value.children, c] } : this.replace(this.value, group.id, { ...group, children: [...group.children, c] });
    this.commit(next, "Condition added");
    this.focusLater(`[data-node="${c.id}"] select`);
  }
  private addGroup() {
    const g: QueryGroup = { kind: "group", id: newId("g"), join: "or", children: [this.freshCondition()] };
    this.commit({ ...this.value, children: [...this.value.children, g] }, "Group added");
    this.focusLater(`[data-node="${g.children[0].id}"] select`);
  }
  private removeNode(node: QueryNode, focusAfter: string) {
    this.commit(this.replace(this.value, node.id, null), node.kind === "group" ? "Group removed" : "Condition removed");
    this.focusLater(focusAfter);
  }
  private setJoin(group: QueryGroup, join: "and" | "or") {
    if (group.join === join) return;
    const next = { ...group, join };
    this.commit(group.id === this.value.id ? { ...this.value, join } : this.replace(this.value, group.id, next), `Match ${join === "and" ? "all" : "any"}`);
  }
  private update1(c: QueryCondition, patch: Partial<QueryCondition>) {
    let next = { ...c, ...patch };
    const f = this.field(next.field);
    // A new field resets the operator and value to fit its type; a new operator reshapes the value
    if (patch.field !== undefined && patch.field !== c.field) next = { ...next, operator: f ? queryOperators[f.type][0] : "is", value: "" };
    if (patch.operator !== undefined && patch.operator !== c.operator) {
      const wasList = Array.isArray(c.value);
      if (next.operator === "between") next.value = ["", ""];
      else if (next.operator === "any-of") next.value = [];
      else if (wasList) next.value = "";
    }
    this.commit(this.replace(this.value, c.id, next));
  }
  private focusLater(selector: string) {
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(selector)?.focus());
  }

  private async copy() {
    const q = this.query;
    if (!q) return;
    if (!(await copyText(q))) {
      this.copied = false;
      this.announce = "Couldn't copy the query";
      return;
    }
    this.copied = true;
    this.announce = "Query copied";
    clearTimeout(this.copiedTimer);
    this.copiedTimer = window.setTimeout(() => (this.copied = false), 1600);
  }

  /* ---------- Rendering ---------- */

  private renderValue(c: QueryCondition, n: number) {
    const f = this.field(c.field);
    const type = f?.type ?? "text";
    const label = `Value, condition ${n}`;
    if (type === "enum" && c.operator === "any-of") {
      const chosen = Array.isArray(c.value) ? c.value : [];
      return html`<div class="ui-qb__chips" role="group" aria-label=${label}>
        ${(f?.options ?? []).map((o) => {
          const on = chosen.includes(o.value);
          return html`<button
            type="button"
            class="ui-qb__chip"
            aria-pressed=${on ? "true" : "false"}
            @click=${() => this.update1(c, { value: on ? chosen.filter((v) => v !== o.value) : [...chosen, o.value] })}
          >${on ? checkIcon() : nothing}${o.label}</button>`;
        })}
      </div>`;
    }
    if (type === "enum") {
      return html`<span class="ui-qb__select"
        ><select class="ui-qb__input" aria-label=${label} .value=${live(String(c.value))} @change=${(e: Event) => this.update1(c, { value: (e.target as HTMLSelectElement).value })}>
          <option value="" ?selected=${c.value === ""}>Choose…</option>
          ${(f?.options ?? []).map((o) => html`<option value=${o.value} ?selected=${c.value === o.value}>${o.label}</option>`)}
        </select
        >${chevronIcon()}</span
      >`;
    }
    const inputType = type === "number" ? "number" : type === "date" ? "date" : "text";
    if (c.operator === "between") {
      const [a, b] = Array.isArray(c.value) ? c.value : ["", ""];
      return html`<span class="ui-qb__between">
        <input class="ui-qb__input" type=${inputType} aria-label=${`From, condition ${n}`} .value=${live(a ?? "")} @change=${(e: Event) => this.update1(c, { value: [(e.target as HTMLInputElement).value, b ?? ""] })} />
        <span class="ui-qb__and" aria-hidden="true">and</span>
        <input class="ui-qb__input" type=${inputType} aria-label=${`To, condition ${n}`} .value=${live(b ?? "")} @change=${(e: Event) => this.update1(c, { value: [a ?? "", (e.target as HTMLInputElement).value] })} />
      </span>`;
    }
    return html`<input
      class="ui-qb__input"
      type=${inputType}
      aria-label=${label}
      placeholder=${type === "text" ? "Value" : ""}
      .value=${live(String(c.value))}
      @change=${(e: Event) => this.update1(c, { value: (e.target as HTMLInputElement).value })}
      @keydown=${(e: KeyboardEvent) => {
        // Enter applies the value as well as Run would read it
        if (e.key === "Enter" && !e.isComposing) (e.target as HTMLInputElement).dispatchEvent(new Event("change", { bubbles: true }));
      }}
    />`;
  }

  /** The word that joins a row to the ones above it – "Where" first, then the group's AND or OR – read like a sentence */
  private conj(g: QueryGroup, i: number) {
    return html`<span class="ui-qb__conj" aria-hidden="true">${i === 0 ? "Where" : g.join}</span>`;
  }

  private renderCondition(c: QueryCondition, n: number, focusAfter: string, g: QueryGroup, i: number) {
    const f = this.field(c.field);
    const ops = queryOperators[f?.type ?? "text"];
    return html`<li class="ui-qb__cond" data-node=${c.id} ?data-incomplete=${!complete(c)}>
      ${this.conj(g, i)}
      <span class="ui-qb__select ui-qb__select--field"
        ><select class="ui-qb__input ui-qb__field" aria-label=${`Field, condition ${n}`} .value=${live(c.field)} @change=${(e: Event) => this.update1(c, { field: (e.target as HTMLSelectElement).value })}>
          ${this.fields.map((x) => html`<option value=${x.id} ?selected=${x.id === c.field}>${x.label}</option>`)}
        </select
        >${chevronIcon()}</span
      >
      <span class="ui-qb__select ui-qb__select--op"
        ><select class="ui-qb__input ui-qb__op" aria-label=${`Operator, condition ${n}`} .value=${live(c.operator)} @change=${(e: Event) => this.update1(c, { operator: (e.target as HTMLSelectElement).value as QueryOperator })}>
          ${ops.map((o) => html`<option value=${o} ?selected=${o === c.operator}>${this.opLabel(o)}</option>`)}
        </select
        >${chevronIcon()}</span
      >
      <span class="ui-qb__value">${this.renderValue(c, n)}</span>
      <button type="button" class="ui-qb__remove" aria-label=${`Remove condition ${n}`} @click=${() => this.removeNode(c, focusAfter)}>${xIcon()}</button>
    </li>`;
  }

  private renderJoin(g: QueryGroup, label: string) {
    const name = `${this.uid}-join-${g.id}`;
    return html`<fieldset class="ui-qb__join">
      <legend class="tc-sr-only">${label}</legend>
      ${(["and", "or"] as const).map(
        (j) => html`<label class="ui-qb__join-opt" ?data-on=${g.join === j}>
          <input type="radio" class="tc-sr-only" name=${name} value=${j} .checked=${live(g.join === j)} @change=${() => this.setJoin(g, j)} />
          ${j.toUpperCase()}
        </label>`,
      )}
    </fieldset>`;
  }

  private renderGroup(g: QueryGroup, nested: boolean, counter: { n: number }, gIndex = 0): TemplateResult {
    const label = nested ? `Group ${gIndex}` : "All conditions";
    const addId = `${this.uid}-add-${g.id}`;
    return html`<div class="ui-qb__group" ?data-nested=${nested} role="group" aria-label=${nested ? `${label}, joined by ${g.join.toUpperCase()}` : `Conditions, joined by ${g.join.toUpperCase()}`} data-node=${g.id}>
      <div class="ui-qb__group-head">
        <span class="ui-qb__match">${nested ? "Group" : "Match"}</span>
        ${this.renderJoin(g, nested ? `Join for ${label.toLowerCase()}` : "Join for all conditions")}
        <span class="ui-qb__join-hint">${g.join === "and" ? "all of these" : "any of these"}</span>
        ${nested
          ? html`<button type="button" class="ui-qb__remove ui-qb__remove--group" aria-label=${`Remove ${label.toLowerCase()}`} @click=${() => this.removeNode(g, `#${this.uid}-add-${this.value.id}`)}>${xIcon()}</button>`
          : nothing}
      </div>
      ${g.children.length
        ? html`<ol class="ui-qb__list">
            ${repeat(
              g.children,
              (n) => n.id,
              (node, i): TemplateResult => {
                if (node.kind === "group") {
                  const groups = this.value.children.filter((x) => x.kind === "group");
                  return html`<li class="ui-qb__sub">${this.conj(g, i)}${this.renderGroup(node, true, counter, groups.indexOf(node) + 1)}</li>`;
                }
                counter.n++;
                return this.renderCondition(node, counter.n, `#${addId}`, g, i);
              },
            )}
          </ol>`
        : html`<p class="ui-qb__empty">${nested ? "No conditions in this group." : "No conditions yet – add one to start."}</p>`}
      <div class="ui-qb__adds">
        <button type="button" id=${addId} class="ui-qb__add" ?disabled=${!this.fields.length} @click=${() => this.addCondition(g)}>${plusIcon()}Condition</button>
        ${nested ? nothing : html`<button type="button" class="ui-qb__add" ?disabled=${!this.fields.length} @click=${() => this.addGroup()}>${plusIcon()}Group</button>`}
      </div>
    </div>`;
  }

  protected override render() {
    const id = this.uid;
    const summary = this.summary;
    const query = this.query;
    const count = { n: 0 };
    return html`
      <span class="tc-sr-only" role="status">${this.announce}</span>
      ${cardHead({ icon: builderIcon, title: this.heading, subtitle: this.description, id: `${id}-title` })}
      <div class="ui-qb__card" role="group" aria-labelledby=${`${id}-title`}>
        ${this.renderGroup(this.value, false, count)}
        <div class="ui-qb__read">
          <p class="ui-qb__summary"><span class="ui-qb__read-label">Reads as</span>${summary ? html`<span class="ui-qb__summary-text">${summary}</span>` : html`<span class="ui-qb__summary-empty">Everything – no conditions yet</span>`}</p>
          <div class="ui-qb__query-row">
            <code class="ui-qb__query" aria-label="Query string">${query || "*"}</code>
            <button type="button" class="tc-btn-sm ui-qb__copy" ?disabled=${!query} @click=${() => this.copy()}>${this.copied ? checkIcon() : copyIcon()}${this.copied ? "Copied" : "Copy"}</button>
            ${this.runLabel
              ? html`<button type="button" class="ui-qb__run" @click=${() => this.emit<QuerySubmit>("tc-submit", { value: this.value, query })}>${playIcon()}${this.runLabel}</button>`
              : nothing}
          </div>
        </div>
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="qb"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  container-type: inline-size;
  --tc-qb-conj: var(--tc-space-10);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="qb"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  container-type: inline-size;
  --tc-qb-conj: var(--tc-space-10);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="qb"] *, [data-ui="qb"] *::before, [data-ui="qb"] *::after { box-sizing: border-box; }
:where([data-ui="qb"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="qb"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="qb"] ol { margin: 0; padding: 0; list-style: none; }
[data-ui="qb"] p, [data-ui="qb"] fieldset { margin: 0; }
[data-ui="qb"] svg { display: block; flex: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-qb__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* ----- A group: its AND / OR switch, its conditions, then Add ----- */
.ui-qb__group { display: grid; gap: var(--tc-space-3); padding: var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-qb__group:not([data-nested]) { padding-top: var(--tc-space-2); }
.ui-qb__group[data-nested] { gap: var(--tc-space-2-5); padding: var(--tc-space-2-5) var(--tc-space-3) var(--tc-space-2); border-radius: var(--tc-radius-lg); background: var(--tc-fill-subtle); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-qb__group-head { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); }
.ui-qb__match { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
.ui-qb__join-hint { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
/* The join: a two-way segmented switch made of radios */
.ui-qb__join { display: inline-flex; padding: var(--tc-seg-pad); border: 0; border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
.ui-qb__join-opt { position: relative; display: inline-flex; align-items: center; height: calc(var(--tc-control-h-sm) - 2 * var(--tc-seg-pad)); padding: 0 var(--tc-space-2-5); border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); letter-spacing: var(--tc-tracking-caps); color: var(--tc-text-secondary); cursor: pointer; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-qb__join-opt[data-on] { background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow); color: var(--tc-text-primary); }
.ui-qb__join-opt:has(:focus-visible) { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-qb__list { display: grid; gap: var(--tc-space-2); }
/* A row: the word that joins it ("Where", "and", "or"), then field, operator, value and remove – wrapping when narrow */
.ui-qb__cond { display: grid; grid-template-columns: var(--tc-qb-conj) minmax(0, 1fr) minmax(0, 0.85fr) minmax(0, 1.4fr) auto; align-items: start; gap: var(--tc-space-2); }
.ui-qb__sub { display: grid; grid-template-columns: var(--tc-qb-conj) minmax(0, 1fr); align-items: start; gap: var(--tc-space-2); }
.ui-qb__conj { display: flex; align-items: center; justify-content: flex-end; height: var(--tc-field-h); padding-right: var(--tc-space-1); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-qb__sub > .ui-qb__conj { height: calc(var(--tc-control-h-sm) + 2 * var(--tc-space-2-5)); }
.ui-qb__value { min-width: 0; }
/* Selects drawn as the library's fields: no native arrow, a chevron at the end */
.ui-qb__select { position: relative; display: block; min-width: 0; }
.ui-qb__select > select { padding-right: var(--tc-space-7); appearance: none; text-overflow: ellipsis; }
.ui-qb__chevron { position: absolute; top: 50%; right: var(--tc-space-2-5); width: var(--tc-space-3-5); height: var(--tc-space-3-5); fill: none; stroke: var(--tc-icon-muted); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; transform: translateY(-50%); pointer-events: none; }
.ui-qb__input { width: 100%; min-width: 0; height: var(--tc-field-h); padding: 0 var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font: inherit; font-size: var(--tc-field-font-size); color: var(--tc-text-primary); outline: none; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-qb__input:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-qb__input:focus-visible { box-shadow: var(--tc-field-shadow-focus); }
.ui-qb__input::placeholder { color: var(--tc-text-placeholder); }
select.ui-qb__input { cursor: pointer; }
/* The browser's date picker button, quieted to the chevrons' weight */
.ui-qb__input::-webkit-calendar-picker-indicator { opacity: 0.5; cursor: pointer; }
.ui-qb__input::-webkit-calendar-picker-indicator:hover { opacity: 0.8; }
.ui-qb__cond[data-incomplete] .ui-qb__value .ui-qb__input:not(:focus-visible) { box-shadow: var(--tc-field-shadow), inset 0 0 0 var(--tc-hairline) var(--tc-border-strong); }
.ui-qb__between { display: flex; align-items: center; gap: var(--tc-space-1-5); }
.ui-qb__and { flex: none; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-qb__chips { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); padding-top: var(--tc-space-1); }
.ui-qb__chip { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h-lg); padding: 0 var(--tc-space-2-5); border-radius: var(--tc-radius-full); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-control); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-qb__chip:hover { background: var(--tc-fill-subtle); }
.ui-qb__chip[aria-pressed="true"] { background: var(--tc-fill-selected); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-selected); color: var(--tc-text-primary); }
.ui-qb__remove { display: grid; place-items: center; width: var(--tc-field-h); height: var(--tc-field-h); border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-qb__remove:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-qb__remove--group { width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); margin-left: auto; }
.ui-qb__empty { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-qb__adds { display: flex; flex-wrap: wrap; gap: var(--tc-space-2); }
.ui-qb__add { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2); border-radius: var(--tc-control-radius-sm); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-qb__add:hover:not(:disabled) { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-qb__add:disabled { opacity: 0.45; cursor: not-allowed; }
/* ----- The read-back: in words, then the query string with Copy and Run ----- */
.ui-qb__read { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-qb__summary { display: grid; gap: var(--tc-space-0-5); line-height: var(--tc-line-height-snug); }
.ui-qb__read-label { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-qb__summary-text { color: var(--tc-text-primary); }
.ui-qb__summary-empty { color: var(--tc-text-muted); }
.ui-qb__query-row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); }
.ui-qb__query { flex: 1 1 16rem; min-width: 0; padding: var(--tc-space-2) var(--tc-space-2-5); border-radius: var(--tc-radius-md); background: var(--tc-surface-sunken); box-shadow: var(--tc-shadow-sunken); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); overflow-wrap: anywhere; }
.ui-qb__run { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-primary-fg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-qb__run:hover { background: var(--tc-action-primary-bg-hover); }
.ui-qb__run:active { background: var(--tc-action-primary-bg-active); }
/* Narrower: the joining words go (the group's switch still says it), then the value takes its own line */
@container (max-width: 500px) {
  .ui-qb__conj { display: none; }
  .ui-qb__cond { grid-template-columns: minmax(0, 1fr) minmax(0, 0.85fr) minmax(0, 1.4fr) auto; }
  .ui-qb__sub { grid-template-columns: minmax(0, 1fr); }
}
@container (max-width: 460px) {
  .ui-qb__cond { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto; }
  .ui-qb__value { grid-column: 1 / 3; grid-row: 2; }
  .ui-qb__group { padding: var(--tc-space-3); }
}
@media (forced-colors: active) {
  .ui-qb__chevron { stroke: ButtonText; }
}
@media (forced-colors: active) {
  .ui-qb__join-opt[data-on] { outline: 2px solid Highlight; }
  .ui-qb__chip[aria-pressed="true"] { outline: 2px solid Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="qb"] *, [data-ui="qb"] *::before, [data-ui="qb"] *::after { animation: none; transition: none; }
}
`;
}

if (!customElements.get("tc-query-builder")) customElements.define("tc-query-builder", TcQueryBuilder);

declare global {
  interface HTMLElementTagNameMap {
    "tc-query-builder": TcQueryBuilder;
  }
}
