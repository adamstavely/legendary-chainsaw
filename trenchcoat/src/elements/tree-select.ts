import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";

/*
 * <tc-tree-select> – pick one option, or many (`multiple`), from a nested hierarchy: subject categories, folders,
 * org units, regions. The field shows the picked option's path ("Sciences › Physics › Optics") or, with `multiple`,
 * chips with "+N more". It opens a tree below: typing filters it, keeping the parents of every match and marking what
 * matched; ← → fold and unfold, ↑ ↓ move, Home / End jump, * unfolds a branch's siblings, Enter or Space picks. With
 * `multiple`, every row has a checkbox; checking a parent checks everything enabled beneath it (`cascade`, on by
 * default) and a parent with some of its children checked shows a dash. × clears.
 * Standard: the field in the gray tray, the tree on a tray card. Clean: a white field and one white popover.
 *
 *   <tc-tree-select label="Subject" name="subject" .options=${subjects} value="optics"></tc-tree-select>
 *
 * A form-associated element: the value (one id, or one entry per id with `multiple`) is submitted under `name`,
 * `required` is checked by the browser, and a form reset brings back the first value. Every pick fires a cancelable
 * `tc-value-change` ({ value, options }); preventDefault() keeps `value` under the page's control.
 */

export type TreeOption = {
  /** Unique across the whole tree */
  id: string;
  label: string;
  /** Options beneath this one */
  children?: TreeOption[];
  /** Shown but can't be picked */
  disabled?: boolean;
  /** Lighter text after the label */
  description?: string;
};
/** One id, the ids picked with `multiple`, or null for nothing */
export type TreeSelectValue = string | string[] | null;
export type TreeSelectValueChange = { value: TreeSelectValue; options: TreeOption[] };
export type TreeSelectOpenChange = { open: boolean };

type TreeNode = { option: TreeOption; parent: TreeNode | null; level: number; children: TreeNode[] };
type Row = { node: TreeNode; open: boolean; hit: boolean };
type Check = "true" | "false" | "mixed";

const glyphs = {
  chevron: "M8 10l4 4 4-4",
  twisty: "M10 8l4 4-4 4",
  check: "M5.5 12.5l4 4L18.5 8",
  dash: "M7 12h10",
  close: "M7 7l10 10M17 7 7 17",
};
const glyph = (d: string, cls = "") => html`<svg viewBox="0 0 24 24" class=${`ui-tsel__glyph ${cls}`.trim()} aria-hidden="true">${svg`<path d=${d}></path>`}</svg>`;

/** The typed text, marked where it matches */
function highlight(text: string, query: string): TemplateResult {
  const i = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (i < 0) return html`${text}`;
  return html`${text.slice(0, i)}<mark>${text.slice(i, i + query.length)}</mark>${text.slice(i + query.length)}`;
}

/** Every option as a node with its parent and depth, in tree order */
export function flattenTree(options: TreeOption[]): TreeNode[] {
  const out: TreeNode[] = [];
  const seen = new Set<string>();
  const walk = (list: TreeOption[], parent: TreeNode | null, level: number): TreeNode[] =>
    list.flatMap((option) => {
      // An id listed twice is drawn once
      if (seen.has(option.id)) return [];
      seen.add(option.id);
      const node: TreeNode = { option, parent, level, children: [] };
      out.push(node);
      node.children = walk(option.children ?? [], node, level + 1);
      return [node];
    });
  walk(options, null, 1);
  return out;
}

/** The labels from the root down to `id`, or [] when it isn't in the tree */
export function treePath(options: TreeOption[], id: string): string[] {
  const node = flattenTree(options).find((n) => n.option.id === id);
  const path: string[] = [];
  for (let n = node ?? null; n; n = n.parent) path.unshift(n.option.label);
  return path;
}

const asList = (v: TreeSelectValue): string[] => (v === null ? [] : Array.isArray(v) ? v : [v]);
const keepFocus = (e: Event) => e.preventDefault();
let instances = 0;

/**
 * Pick one or many options from a nested hierarchy, with type-to-filter and parent checkboxes.
 * @tag tc-tree-select
 * @fires tc-value-change - An option was picked, checked or cleared ({ value, options }: TreeSelectValueChange); cancelable – prevented, `value` stays as it was
 * @fires tc-open-change - The tree opens or closes ({ open }: TreeSelectOpenChange); cancelable – prevented, it stays as it is
 */
export class TcTreeSelect extends TcElement {
  static override ui = "tsel";
  static formAssociated = true;

  /** The hierarchy */
  @property({ attribute: false }) accessor options: TreeOption[] = [];
  /** The picked id (or ids, with `multiple`); null for nothing. Changed by the user unless a tc-value-change listener calls preventDefault() */
  @property({ attribute: false }) accessor value: TreeSelectValue = null;
  /** Pick many: every row gets a checkbox */
  @property({ type: Boolean, reflect: true }) accessor multiple = false;
  /** With `multiple`, checking a parent checks everything enabled beneath it; set cascade="false" to check rows on their own */
  @property({ converter: { fromAttribute: (v: string | null) => v !== "false" } }) accessor cascade = true;
  /** Whether the tree is open. Changed by the user unless a tc-open-change listener calls preventDefault() */
  @property({ type: Boolean, reflect: true }) accessor open = false;
  /** Visible label above the field (or use a page <label for>) */
  @property() accessor label = "";
  /** Shown in the empty field */
  @property() accessor placeholder = "Choose…";
  /** The filter box's placeholder */
  @property({ attribute: "filter-placeholder" }) accessor filterPlaceholder = "Filter…";
  /** Shown when nothing matches the filter */
  @property({ attribute: "empty-text" }) accessor emptyText = "No matches";
  /** With `multiple`, show at most this many chips in the field, the rest as "+N more" */
  @property({ type: Number, attribute: "max-chips" }) accessor maxChips = 3;
  /** Submitted with the form: the id, or one entry per id with `multiple` */
  @property({ reflect: true }) accessor name = "";
  /** Can't be changed or focused; also disabled inside a disabled <fieldset> */
  @property({ type: Boolean, reflect: true }) accessor disabled = false;
  /** Something must be picked before the form submits */
  @property({ type: Boolean, reflect: true }) accessor required = false;
  /** Shows the field as invalid */
  @property({ type: Boolean, reflect: true }) accessor invalid = false;

  @state() private accessor query = "";
  @state() private accessor expanded = new Set<string>();
  @state() private accessor active: string | null = null;
  @state() private accessor announce = "";
  @state() private accessor formDisabled = false;

  private readonly internals: ElementInternals;
  private readonly uid = `tc-tsel${++instances}`;
  private initialValue: TreeSelectValue | undefined = undefined;
  /** The rows drawn in the last render, in order – what the arrow keys walk */
  private rows: Row[] = [];
  private moveFocus = false;
  private onDocDown = (e: PointerEvent) => {
    if (!this.contains(e.target as Node)) this.setOpen(false);
  };

  constructor() {
    super();
    this.internals = this.attachInternals();
    // A page <label for> clicks the element: the field takes the focus
    this.addEventListener("click", (e) => {
      if (e.target === this) this.field?.focus();
    });
    this.addEventListener("focusout", (e) => {
      if (!this.contains(e.relatedTarget as Node | null)) this.setOpen(false);
    });
  }

  private get field() {
    return this.querySelector<HTMLElement>(".ui-tsel__field");
  }
  private get isDisabled() {
    return this.disabled || this.formDisabled;
  }
  override focus(options?: FocusOptions) {
    this.field?.focus(options);
  }

  /* ---------- Derived ---------- */

  private nodes: TreeNode[] = [];
  private byId = new Map<string, TreeNode>();
  private index = new Map<string, number>();
  private picked = new Set<string>();

  private ancestors(node: TreeNode) {
    const out: TreeNode[] = [];
    for (let n = node.parent; n; n = n.parent) out.push(n);
    return out;
  }
  private descendants(node: TreeNode): TreeNode[] {
    return node.children.flatMap((c) => [c, ...this.descendants(c)]);
  }

  /** A row's checkbox: a parent with cascade follows its enabled descendants */
  private checkOf(node: TreeNode): Check {
    if (!this.cascade || !node.children.length) return this.picked.has(node.option.id) ? "true" : "false";
    const leaves = this.descendants(node).filter((d) => !d.children.length && !d.option.disabled);
    if (!leaves.length) return this.picked.has(node.option.id) ? "true" : "false";
    const on = leaves.filter((d) => this.picked.has(d.option.id)).length;
    return on === leaves.length ? "true" : on ? "mixed" : "false";
  }

  /** The rows to draw: unfolded branches, or with a filter every match plus its parents (unfolded) */
  private visibleRows(needle: string): Row[] {
    const rows: Row[] = [];
    if (needle) {
      const hits = new Set<string>();
      const keep = new Set<string>();
      for (const n of this.nodes)
        if (`${n.option.label} ${n.option.description ?? ""}`.toLowerCase().includes(needle)) {
          hits.add(n.option.id);
          keep.add(n.option.id);
          for (const a of this.ancestors(n)) keep.add(a.option.id);
        }
      for (const n of this.nodes)
        if (keep.has(n.option.id)) rows.push({ node: n, hit: hits.has(n.option.id), open: n.children.some((c) => keep.has(c.option.id)) });
      return rows;
    }
    const walk = (list: TreeNode[]) => {
      for (const n of list) {
        const open = this.expanded.has(n.option.id) && n.children.length > 0;
        rows.push({ node: n, hit: false, open });
        if (open) walk(n.children);
      }
    };
    walk(this.nodes.filter((n) => !n.parent));
    return rows;
  }

  /* ---------- Changes ---------- */

  private setOpen(next: boolean) {
    if (next === this.open || (next && this.isDisabled)) return;
    if (!this.emit<TreeSelectOpenChange>("tc-open-change", { open: next }, { cancelable: true })) return;
    this.open = next;
  }

  private commit(next: TreeSelectValue) {
    if (this.isDisabled) return false;
    const options = asList(next).map((id) => this.byId.get(id)?.option ?? { id, label: id });
    if (!this.emit<TreeSelectValueChange>("tc-value-change", { value: next, options }, { cancelable: true })) return false;
    this.value = next;
    return true;
  }

  private pick(node: TreeNode) {
    const o = node.option;
    if (o.disabled) return;
    if (!this.multiple) {
      if (this.commit(o.id)) this.announce = `${treePath(this.options, o.id).join(", ")} selected`;
      this.setOpen(false);
      this.field?.focus();
      return;
    }
    const set = new Set(this.picked);
    const turnOn = this.checkOf(node) !== "true";
    const affected = this.cascade ? [node, ...this.descendants(node).filter((d) => !d.option.disabled)] : [node];
    for (const d of affected) {
      if (turnOn) set.add(d.option.id);
      else set.delete(d.option.id);
    }
    if (this.cascade) {
      // A parent counts as picked exactly when everything enabled beneath it is
      for (const n of [...this.nodes].reverse()) {
        const kids = n.children.filter((c) => !c.option.disabled);
        if (!kids.length) continue;
        if (kids.every((c) => set.has(c.option.id))) set.add(n.option.id);
        else set.delete(n.option.id);
      }
    }
    // Ids the tree doesn't know (yet) stay picked, after the known ones
    const next = [...this.nodes.map((n) => n.option.id).filter((id) => set.has(id)), ...asList(this.value).filter((id) => !this.byId.has(id) && set.has(id))];
    if (this.commit(next)) this.announce = `${o.label} ${turnOn ? "checked" : "unchecked"}. ${next.length} selected`;
  }

  private clear() {
    if (!asList(this.value).length) return;
    if (this.commit(this.multiple ? [] : null)) this.announce = "Selection cleared";
    this.field?.focus();
  }

  private toggleBranch(node: TreeNode, open: boolean) {
    if (!node.children.length || this.query) return;
    const next = new Set(this.expanded);
    if (open) next.add(node.option.id);
    else next.delete(node.option.id);
    this.expanded = next;
  }

  /* ---------- Lifecycle ---------- */

  override connectedCallback() {
    super.connectedCallback();
    if (this.open) document.addEventListener("pointerdown", this.onDocDown);
  }
  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("pointerdown", this.onDocDown);
  }

  formResetCallback() {
    this.value = this.initialValue === undefined ? null : Array.isArray(this.initialValue) ? [...this.initialValue] : this.initialValue;
    this.query = "";
  }
  formDisabledCallback(disabled: boolean) {
    // Also called while `disabled` is reflected during an update, where a property change would be dropped – so after it
    queueMicrotask(() => (this.formDisabled = disabled));
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // The first value, after a framework has set its props – what a form reset brings back
    if (!this.hasUpdated) this.initialValue = Array.isArray(this.value) ? [...this.value] : this.value;
    if (changed.has("options")) {
      this.nodes = flattenTree(this.options);
      this.byId = new Map(this.nodes.map((n) => [n.option.id, n]));
      this.index = new Map(this.nodes.map((n, i) => [n.option.id, i]));
    }
    if (changed.has("value") || changed.has("options")) this.picked = new Set(asList(this.value));
    if (changed.has("open")) {
      if (this.open) {
        document.addEventListener("pointerdown", this.onDocDown);
        // Opening shows where the picked options are, and starts on the first of them
        const next = new Set(this.expanded);
        for (const id of this.picked) for (const a of this.byId.get(id) ? this.ancestors(this.byId.get(id)!) : []) next.add(a.option.id);
        this.expanded = next;
        this.query = "";
        this.active = this.nodes.find((n) => this.picked.has(n.option.id))?.option.id ?? null;
        this.moveFocus = this.hasUpdated;
      } else document.removeEventListener("pointerdown", this.onDocDown);
    }
    this.toggleAttribute("data-disabled", this.isDisabled);
    this.toggleAttribute("data-invalid", this.invalid);
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    this.syncForm();
    this.labelField();
    if (this.moveFocus && this.open) {
      this.moveFocus = false;
      this.focusActive();
    }
  }

  private syncForm() {
    // Environments without form-associated custom elements (jsdom) skip it; every supported browser has it
    if (typeof this.internals.setFormValue !== "function") return;
    const ids = asList(this.value);
    const disabled = this.isDisabled;
    if (this.name && !disabled && ids.length) {
      const data = new FormData();
      for (const id of ids) data.append(this.name, id);
      this.internals.setFormValue(data);
    } else this.internals.setFormValue(null);
    if (this.required && !disabled && !ids.length) this.internals.setValidity({ valueMissing: true }, "Choose an option.", this.field ?? undefined);
    else this.internals.setValidity({});
  }

  /** A page <label for> names the field (light DOM, so the ids connect) */
  private labelField() {
    const field = this.field;
    if (!field || this.label) return;
    const labels = [...((this.internals.labels as NodeListOf<HTMLLabelElement> | undefined) ?? [])];
    if (!labels.length) return;
    labels.forEach((l, i) => (l.id ||= `${this.uid}-for${i}`));
    field.setAttribute("aria-labelledby", [...labels.map((l) => l.id), `${this.uid}-value`].join(" "));
    field.removeAttribute("aria-label");
  }

  private itemId(id: string) {
    return `${this.uid}-i${this.index.get(id) ?? -1}`;
  }
  private focusActive() {
    const id = this.active ?? this.rows[0]?.node.option.id;
    if (!id) {
      this.querySelector<HTMLInputElement>(".ui-tsel__filter")?.focus();
      return;
    }
    this.active = id;
    void this.updateComplete.then(() => document.getElementById(this.itemId(id))?.focus());
  }

  /* ---------- Keyboard ---------- */

  private onFieldKey = (e: KeyboardEvent) => {
    if (this.isDisabled) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (this.open) this.focusActive();
      else this.setOpen(true);
    } else if (e.key === "Escape" && this.open) {
      e.preventDefault();
      this.setOpen(false);
    } else if ((e.key === "Delete" || e.key === "Backspace") && !this.open) {
      e.preventDefault();
      this.clear();
    }
  };

  private onFilterKey = (e: KeyboardEvent) => {
    if (e.isComposing) return;
    if (e.key === "ArrowDown" || (e.key === "Enter" && this.rows.length)) {
      e.preventDefault();
      // Enter in the filter goes to the first match
      this.active = (e.key === "Enter" ? this.rows.find((r) => r.hit) : undefined)?.node.option.id ?? this.rows[0]?.node.option.id ?? null;
      this.focusActive();
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      if (this.query) this.query = "";
      else this.closeToField();
    }
  };

  private closeToField() {
    this.setOpen(false);
    this.field?.focus();
  }

  private onTreeKey = (e: KeyboardEvent) => {
    const item = (e.target as HTMLElement).closest<HTMLElement>("[role=treeitem]");
    if (!item || e.isComposing) return;
    const rows = this.rows;
    const at = rows.findIndex((r) => r.node.option.id === item.dataset.id);
    const row = rows[at];
    if (!row) return;
    const go = (i: number) => {
      const r = rows[Math.max(0, Math.min(rows.length - 1, i))];
      if (!r) return;
      this.active = r.node.option.id;
      this.focusActive();
    };
    const node = row.node;
    switch (e.key) {
      case "ArrowDown":
        go(at + 1);
        break;
      case "ArrowUp":
        if (at === 0) this.querySelector<HTMLInputElement>(".ui-tsel__filter")?.focus();
        else go(at - 1);
        break;
      case "Home":
        go(0);
        break;
      case "End":
        go(rows.length - 1);
        break;
      case "ArrowRight":
        if (!node.children.length) break;
        if (!row.open) this.toggleBranch(node, true);
        else go(at + 1);
        break;
      case "ArrowLeft":
        if (row.open && !this.query) this.toggleBranch(node, false);
        else if (node.parent) {
          this.active = node.parent.option.id;
          this.focusActive();
        }
        break;
      case "*": {
        const siblings = node.parent ? node.parent.children : this.nodes.filter((n) => !n.parent);
        if (!this.query) this.expanded = new Set([...this.expanded, ...siblings.filter((s) => s.children.length).map((s) => s.option.id)]);
        break;
      }
      case "Enter":
      case " ":
        this.pick(node);
        break;
      case "Escape":
        this.closeToField();
        break;
      case "Tab":
        this.setOpen(false);
        return;
      default:
        // Typing in the tree types into the filter
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          this.query += e.key;
          this.active = null;
          this.querySelector<HTMLInputElement>(".ui-tsel__filter")?.focus();
          break;
        }
        return;
    }
    e.preventDefault();
    e.stopPropagation();
  };

  /* ---------- Render ---------- */

  protected override render() {
    const ids = asList(this.value);
    const disabled = this.isDisabled;
    const named = (id: string) => this.byId.get(id)?.option.label ?? id;
    let summary: TemplateResult;
    if (!ids.length) summary = html`<span class="ui-tsel__placeholder">${this.placeholder}</span>`;
    else if (!this.multiple) {
      const path = treePath(this.options, ids[0]);
      const parts = path.length ? path : [ids[0]];
      summary = html`<span class="ui-tsel__path"
        >${parts.map(
          (p, i) =>
            html`${i ? html`<span class="ui-tsel__sep" aria-hidden="true">›</span><span class="tc-sr-only">, </span>` : nothing}<span class=${i === parts.length - 1 ? "ui-tsel__leaf" : "ui-tsel__crumb"}>${p}</span>`,
        )}</span
      >`;
    } else {
      const shown = ids.slice(0, Math.max(0, this.maxChips));
      const more = ids.length - shown.length;
      summary = html`<span class="ui-tsel__chips"
        >${shown.map((id) => html`<span class="ui-tsel__chip">${named(id)}</span>`)}${more > 0
          ? html`<span class="ui-tsel__chip ui-tsel__more">+${more} more</span>`
          : nothing}<span class="tc-sr-only">, ${ids.length} selected</span></span
      >`;
    }
    const labelled = this.label ? `${this.uid}-label ${this.uid}-value` : undefined;
    return html`
      ${this.label ? html`<label class="ui-tsel__label" id=${`${this.uid}-label`} @click=${() => this.field?.focus()}>${this.label}</label>` : nothing}
      <div class="ui-tsel__box">
        <div
          class="ui-tsel__field"
          role="combobox"
          tabindex=${disabled ? "-1" : "0"}
          aria-haspopup="tree"
          aria-expanded=${this.open ? "true" : "false"}
          aria-controls=${ifDefined(this.open ? `${this.uid}-tree` : undefined)}
          aria-labelledby=${ifDefined(labelled)}
          aria-label=${ifDefined(labelled ? undefined : this.placeholder)}
          aria-disabled=${ifDefined(disabled ? "true" : undefined)}
          aria-required=${ifDefined(this.required ? "true" : undefined)}
          aria-invalid=${ifDefined(this.invalid ? "true" : undefined)}
          @click=${() => (this.open ? this.setOpen(false) : this.setOpen(true))}
          @keydown=${this.onFieldKey}
        >
          <span class="ui-tsel__value" id=${`${this.uid}-value`}>${summary}</span>
          ${glyph(glyphs.chevron, "ui-tsel__caret")}
        </div>
        ${ids.length && !disabled
          ? html`<button type="button" class="ui-tsel__clear" aria-label="Clear selection" @mousedown=${keepFocus} @click=${() => this.clear()}>${glyph(glyphs.close)}</button>`
          : nothing}
      </div>
      ${this.open && !disabled ? this.renderPop() : nothing}
      <span class="tc-sr-only" role="status">${this.announce}</span>
    `;
  }

  private renderPop() {
    const q = this.query.trim();
    const rows = this.visibleRows(q.toLowerCase());
    this.rows = rows;
    const active = rows.some((r) => r.node.option.id === this.active) ? this.active : (rows[0]?.node.option.id ?? null);
    const clean = this.resolvedLook === "clean";
    const count = asList(this.value).length;
    const body = html`
      <div class="ui-tsel__search">
        <input
          class="ui-tsel__filter"
          type="search"
          .value=${live(this.query)}
          placeholder=${this.filterPlaceholder}
          aria-label=${this.label ? `Filter ${this.label}` : "Filter"}
          aria-controls=${ifDefined(this.open ? `${this.uid}-tree` : undefined)}
          autocomplete="off"
          spellcheck="false"
          @input=${(e: Event) => {
            this.query = (e.target as HTMLInputElement).value;
            this.active = null;
          }}
          @keydown=${this.onFilterKey}
        />
      </div>
      <ul
        class="ui-tsel__tree"
        id=${`${this.uid}-tree`}
        role="tree"
        aria-label=${this.label || this.placeholder}
        aria-multiselectable=${ifDefined(this.multiple ? "true" : undefined)}
        @keydown=${this.onTreeKey}
      >
        ${repeat(
          rows,
          (r) => r.node.option.id,
          (r) => this.renderRow(r, rows, active, q),
        )}
      </ul>
      ${rows.length ? nothing : html`<p class="ui-tsel__empty">${this.emptyText}${q ? html` for “${q}”` : nothing}</p>`}
      ${this.multiple
        ? html`<div class="ui-tsel__foot">
            <span class="ui-tsel__count">${count} selected</span>
            <button type="button" class="ui-tsel__text-btn" ?disabled=${!count} @click=${() => this.clear()}>Clear</button>
          </div>`
        : nothing}
    `;
    return html`<div class="ui-tsel__pop" @mousedown=${(e: MouseEvent) => !(e.target as HTMLElement).closest("input") && keepFocus(e)}>
      ${clean ? body : html`<div class="ui-tsel__card">${body}</div>`}
    </div>`;
  }

  private renderRow(r: Row, rows: Row[], active: string | null, q: string) {
    const { node, open } = r;
    const o = node.option;
    const siblings = rows.filter((x) => x.node.parent === node.parent);
    const check = this.multiple ? this.checkOf(node) : undefined;
    const selected = !this.multiple && this.picked.has(o.id);
    const branch = node.children.length > 0;
    return html`<li
      class="ui-tsel__item"
      role="treeitem"
      id=${this.itemId(o.id)}
      data-id=${o.id}
      tabindex=${active === o.id ? "0" : "-1"}
      aria-level=${node.level}
      aria-setsize=${siblings.length}
      aria-posinset=${siblings.indexOf(r) + 1}
      aria-expanded=${ifDefined(branch ? (open ? "true" : "false") : undefined)}
      aria-selected=${ifDefined(this.multiple ? undefined : selected ? "true" : "false")}
      aria-checked=${ifDefined(check)}
      aria-disabled=${ifDefined(o.disabled ? "true" : undefined)}
      aria-labelledby=${`${this.itemId(o.id)}-l`}
      ?data-hit=${r.hit}
      style=${styleMap({ "--d": String(node.level - 1) })}
      @focus=${() => (this.active = o.id)}
    >
      <div class="ui-tsel__row" @click=${() => this.pick(node)}>
        ${branch
          ? html`<span
              class="ui-tsel__twisty"
              ?data-open=${open}
              aria-hidden="true"
              @click=${(e: Event) => {
                e.stopPropagation();
                this.active = o.id;
                this.toggleBranch(node, !open);
              }}
              >${glyph(glyphs.twisty)}</span
            >`
          : html`<span class="ui-tsel__twisty" aria-hidden="true"></span>`}
        ${check
          ? html`<span class="ui-tsel__box-check" data-state=${check} aria-hidden="true">${check === "true" ? glyph(glyphs.check) : check === "mixed" ? glyph(glyphs.dash) : nothing}</span>`
          : nothing}
        <span class="ui-tsel__text" id=${`${this.itemId(o.id)}-l`}
          ><span class="ui-tsel__name">${highlight(o.label, q)}</span>${o.description ? html`<span class="ui-tsel__desc">${highlight(o.description, q)}</span>` : nothing}</span
        >
        ${selected ? glyph(glyphs.check, "ui-tsel__tick") : nothing}
      </div>
    </li>`;
  }

  static override css = /* css */ `
[data-ui="tsel"] {
  position: relative;
  display: block;
  width: 100%;
  max-width: 440px;
  container-type: inline-size;
  /* Indent per level of the tree */
  --tc-tsel-indent: var(--tc-space-5);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
[data-ui="tsel"] *, [data-ui="tsel"] *::before, [data-ui="tsel"] *::after { box-sizing: border-box; }
:where([data-ui="tsel"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
:where([data-ui="tsel"]) svg { display: block; flex: none; }
.ui-tsel__glyph { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.ui-tsel__label { display: block; font-weight: var(--tc-font-weight-medium); }
:where([data-look="standard"], [data-look="standard"] *).ui-tsel__label { margin: 0 0 var(--tc-space-2) var(--tc-space-0-5); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-tsel__label { margin: 0 0 var(--tc-space-1-5) var(--tc-space-0-5); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); }
.ui-tsel__box { position: relative; }
/* The field: a select-only combobox, the reference text field's edge and focus */
.ui-tsel__field {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2);
  min-height: var(--tc-field-h);
  padding: var(--tc-space-1) calc(var(--tc-field-h) + var(--tc-space-4)) var(--tc-space-1) var(--tc-field-px);
  border-radius: var(--tc-field-radius);
  background: var(--tc-field-bg);
  box-shadow: var(--tc-field-shadow);
  font-size: var(--tc-field-font-size);
  cursor: pointer;
  outline: none;
  transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-tsel__field:hover { box-shadow: var(--tc-field-shadow-hover); }
[data-ui="tsel"][data-invalid] .ui-tsel__field { box-shadow: var(--tc-field-shadow-invalid); }
.ui-tsel__field:focus-visible, [data-ui="tsel"][open] .ui-tsel__field { box-shadow: var(--tc-field-shadow-focus); }
.ui-tsel__value { flex: 1; min-width: 0; overflow: hidden; }
.ui-tsel__placeholder { color: var(--tc-text-placeholder); }
.ui-tsel__path { display: flex; align-items: center; gap: var(--tc-space-1); min-width: 0; white-space: nowrap; }
.ui-tsel__crumb { flex: 0 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; color: var(--tc-text-muted); }
.ui-tsel__leaf { flex: 0 0 auto; max-width: 100%; overflow: hidden; text-overflow: ellipsis; color: var(--tc-text-primary); }
.ui-tsel__sep { flex: none; color: var(--tc-text-muted); }
.ui-tsel__chips { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); }
.ui-tsel__chip {
  display: inline-flex;
  align-items: center;
  max-width: 168px;
  height: calc(var(--tc-field-h) - var(--tc-space-2));
  padding: 0 var(--tc-space-2);
  overflow: hidden;
  border-radius: var(--tc-control-radius-sm);
  background: var(--tc-fill-default);
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: var(--tc-font-size-sm);
}
:where([data-look="standard"], [data-look="standard"] *).ui-tsel__chip { box-shadow: inset 0 0 0 1px var(--tc-border-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-tsel__chip { font-weight: var(--tc-font-weight-medium); }
.ui-tsel__more { color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
.ui-tsel__caret { position: absolute; top: 50%; right: var(--tc-space-2-5); color: var(--tc-icon-muted); transform: translateY(-50%); transition: transform var(--tc-duration-moderate) var(--tc-ease-move); pointer-events: none; }
[data-ui="tsel"][open] .ui-tsel__caret { transform: translateY(-50%) rotate(180deg); }
/* × beside the caret: drawn small, a 24 × 24 target */
.ui-tsel__clear { position: absolute; top: 50%; right: calc(var(--tc-space-2-5) + 20px); display: grid; place-items: center; width: 24px; height: 24px; border-radius: var(--tc-radius-sm); color: var(--tc-icon-muted); transform: translateY(-50%); }
.ui-tsel__clear:hover { background: var(--tc-fill-default); color: var(--tc-text-primary); }
.ui-tsel__clear:focus-visible { outline: var(--tc-focus-ring-width) solid var(--tc-focus-ring); outline-offset: 1px; }
.ui-tsel__clear .ui-tsel__glyph { width: 14px; height: 14px; }
/* The tree: a menu popover the width of the field. Standard puts the card on a tray */
.ui-tsel__pop { position: absolute; z-index: var(--tc-z-dropdown); top: calc(100% + var(--tc-space-1-5)); left: 0; right: 0; box-shadow: var(--tc-menu-shadow); animation: ui-tsel-open var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-tsel__pop { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
:where([data-look="standard"], [data-look="standard"] *).ui-tsel__card { overflow: hidden; border-radius: calc(var(--tc-tray-radius) - var(--tc-tray-inset)); background: var(--tc-menu-bg); box-shadow: 0 0 0 var(--tc-hairline) var(--tc-border-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-tsel__pop { overflow: hidden; border-radius: var(--tc-menu-radius); background: var(--tc-menu-bg); }
.ui-tsel__search { padding: var(--tc-menu-padding); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-tsel__filter {
  width: 100%;
  height: var(--tc-field-h-sm);
  margin: 0;
  padding: 0 var(--tc-space-2);
  border: 0;
  border-radius: var(--tc-control-radius-sm);
  background: var(--tc-field-bg-sunken);
  font: inherit;
  font-size: var(--tc-field-font-size);
  color: var(--tc-text-primary);
  outline: none;
}
.ui-tsel__filter::placeholder { color: var(--tc-text-placeholder); }
.ui-tsel__filter:focus-visible { box-shadow: inset 0 0 0 var(--tc-focus-ring-width) var(--tc-focus-ring); }
.ui-tsel__tree { max-height: 300px; margin: 0; padding: var(--tc-menu-padding); overflow-y: auto; overscroll-behavior: contain; list-style: none; scrollbar-width: thin; }
.ui-tsel__item { outline: none; }
.ui-tsel__row {
  display: flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  min-height: var(--tc-menu-item-h);
  padding: 0 var(--tc-menu-item-px) 0 calc(var(--tc-space-1) + var(--d, 0) * var(--tc-tsel-indent));
  border-radius: var(--tc-menu-item-radius);
  font-size: var(--tc-menu-item-font-size);
  cursor: pointer;
  user-select: none;
}
.ui-tsel__row:hover { background: var(--tc-menu-item-hover); }
.ui-tsel__item:focus-visible > .ui-tsel__row { background: var(--tc-menu-item-hover); box-shadow: inset 0 0 0 var(--tc-focus-ring-width) var(--tc-focus-ring); }
.ui-tsel__item[aria-disabled="true"] > .ui-tsel__row { color: var(--tc-text-disabled); cursor: not-allowed; }
.ui-tsel__item[aria-selected="true"] > .ui-tsel__row { color: var(--tc-menu-item-selected-fg); }
.ui-tsel__twisty { display: grid; place-items: center; flex: none; width: 20px; height: 20px; border-radius: var(--tc-radius-xs); color: var(--tc-icon-muted); }
.ui-tsel__twisty:not(:empty):hover { background: var(--tc-fill-default); }
.ui-tsel__twisty .ui-tsel__glyph { width: 14px; height: 14px; transition: transform var(--tc-duration-fast) var(--tc-ease-move); }
.ui-tsel__twisty[data-open] .ui-tsel__glyph { transform: rotate(90deg); }
.ui-tsel__box-check { display: grid; place-items: center; flex: none; width: 16px; height: 16px; border-radius: var(--tc-radius-xs); background: var(--tc-field-bg); box-shadow: inset 0 0 0 1px var(--tc-border-control); color: var(--tc-text-on-accent); }
.ui-tsel__box-check[data-state="true"], .ui-tsel__box-check[data-state="mixed"] { background: var(--tc-accent-solid); box-shadow: none; }
.ui-tsel__box-check .ui-tsel__glyph { width: 12px; height: 12px; stroke-width: 2.4; }
.ui-tsel__item[aria-disabled="true"] .ui-tsel__box-check { background: var(--tc-fill-default); box-shadow: none; }
.ui-tsel__text { display: flex; flex: 1; align-items: baseline; gap: var(--tc-space-2); min-width: 0; }
.ui-tsel__name { flex: 0 1 auto; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ui-tsel__desc { flex: 0 100 auto; min-width: 0; overflow: hidden; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); white-space: nowrap; text-overflow: ellipsis; }
.ui-tsel__tick { flex: none; margin-left: auto; color: var(--tc-menu-item-selected-fg); }
[data-ui="tsel"] mark { border-radius: var(--tc-radius-2xs); background: var(--tc-accent-highlight); color: inherit; }
.ui-tsel__empty { margin: 0; padding: var(--tc-space-3) var(--tc-space-2) var(--tc-space-4); text-align: center; color: var(--tc-text-muted); }
.ui-tsel__foot { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3); min-height: 32px; padding: 0 var(--tc-space-3); border-top: var(--tc-hairline) solid var(--tc-divider); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-tsel__count { font-variant-numeric: tabular-nums; }
.ui-tsel__text-btn { min-height: 24px; padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-sm); color: var(--tc-accent-text); font-weight: var(--tc-font-weight-medium); }
.ui-tsel__text-btn:hover:not(:disabled) { background: var(--tc-fill-default); }
.ui-tsel__text-btn:disabled { color: var(--tc-text-disabled); cursor: default; }
.ui-tsel__text-btn:focus-visible { outline: var(--tc-focus-ring-width) solid var(--tc-focus-ring); }
[data-ui="tsel"][data-disabled] .ui-tsel__field { background: var(--tc-fill-subtle); color: var(--tc-text-disabled); cursor: not-allowed; }
@keyframes ui-tsel-open { from { opacity: 0; transform: translateY(-4px) scale(0.98); } to { opacity: 1; transform: none; } }
@container (max-width: 380px) {
  [data-ui="tsel"] { --tc-tsel-indent: var(--tc-space-3); }
  .ui-tsel__desc { display: none; }
}
@media (hover: none) and (pointer: coarse) {
  .ui-tsel__row { min-height: 44px; }
  .ui-tsel__filter { font-size: var(--tc-font-size-xl); }
}
@media (forced-colors: active) {
  .ui-tsel__box-check { border: 1px solid CanvasText; }
  .ui-tsel__item:focus-visible > .ui-tsel__row { outline: 2px solid Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="tsel"] *, [data-ui="tsel"] *::before, [data-ui="tsel"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-tree-select")) customElements.define("tc-tree-select", TcTreeSelect);

declare global {
  interface HTMLElementTagNameMap {
    "tc-tree-select": TcTreeSelect;
  }
}
