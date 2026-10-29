import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-todo-list> – a to-do list people keep themselves: add a to-do in the box at the top (Enter), tick it off, change
 * its words, put it in order, and remove it – with Undo. Tabs show All, To do and Done with their counts; the foot
 * says how many are done, with a bar, and Clear done.
 *   · click a to-do's words (or press Enter on them) to edit in place: Enter keeps it, Escape puts it back, and
 *     emptying it removes the to-do
 *   · Alt + ↑ / ↓ on a to-do moves it up or down
 *   · every change fires a cancelable tc-items-change with the list as it will be ({ items, change }) – prevent it
 *     and update `items` yourself to keep the list in your own store
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-todo-list heading="This week" .items=${[{ id: "a", text: "Book the venue", done: true }]}></tc-todo-list>
 */

export type TodoItem = { id: string; text: string; done?: boolean };
export type TodoFilter = "all" | "active" | "done";
export type TodoChange =
  | { type: "add"; id: string }
  | { type: "toggle"; id: string; done: boolean }
  | { type: "edit"; id: string; text: string }
  | { type: "remove"; id: string }
  | { type: "restore"; id: string }
  | { type: "move"; id: string; index: number }
  | { type: "clear"; ids: string[] };

/** Details of the events */
export type TodoItemsChange = { items: TodoItem[]; change: TodoChange };
export type TodoFilterChange = { filter: TodoFilter };

/** The words the list uses; give any of them in `labels` to change them */
export type TodoLabels = {
  add: string;
  placeholder: string;
  all: string;
  active: string;
  done: string;
  clearDone: string;
  emptyAll: string;
  emptyActive: string;
  emptyDone: string;
  removed: string;
  undo: string;
};
export const defaultTodoLabels: TodoLabels = {
  add: "Add",
  placeholder: "Add a to-do",
  all: "All",
  active: "To do",
  done: "Done",
  clearDone: "Clear done",
  emptyAll: "Nothing to do yet – add the first one above.",
  emptyActive: "All done. Nice work.",
  emptyDone: "Nothing ticked off yet.",
  removed: "Removed",
  undo: "Undo",
};

let uidCount = 0;
let idCount = 0;
/** A new to-do's id – random, so ids stay unique in a list the page saved and loaded again */
const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `todo-${(++idCount).toString(36)}-${Math.random().toString(36).slice(2, 10)}`);

/* list-checks, plus, x: Lucide (ISC, lucide.dev) */
const listIcon = svg`<path d="m3 17 2 2 4-4"></path><path d="m3 7 2 2 4-4"></path><path d="M13 6h8"></path><path d="M13 12h8"></path><path d="M13 18h8"></path>`;
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const plusIcon = () => lucide(16, svg`<path d="M5 12h14"></path><path d="M12 5v14"></path>`);
const xIcon = () => lucide(14, svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`);
const tick = () => html`<svg class="ui-todo__tick" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>`;

/**
 * A to-do list – add, tick off, edit, reorder and remove (with Undo), All / To do / Done tabs with counts, progress
 * and Clear done.
 * @tag tc-todo-list
 * @fires tc-items-change - The list changed ({ items, change }: TodoItemsChange) – added, ticked, edited, moved, removed, restored or cleared; cancelable – prevented, `items` stays as it was
 * @fires tc-filter-change - The tab changed ({ filter }: TodoFilterChange); cancelable – prevented, `filter` stays as it was
 */
export class TcTodoList extends TcElement {
  static override ui = "todo";

  /** The heading, and the list's name */
  @property() accessor heading = "To-do";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The to-dos, in order. Changed by the user unless tc-items-change is prevented */
  @property({ attribute: false }) accessor items: TodoItem[] = [];
  /** The tab shown. Changed by the user unless tc-filter-change is prevented */
  @property({ reflect: true }) accessor filter: TodoFilter = "all";
  /** Where new to-dos go */
  @property({ attribute: "add-to" }) accessor addTo: "end" | "start" = "end";
  /** The longest a to-do may be */
  @property({ type: Number, attribute: "max-length" }) accessor maxLength = 200;
  /** Read only: no adding, ticking, editing or removing */
  @property({ type: Boolean, reflect: true }) accessor readonly = false;
  /** Words to use instead of the defaults */
  @property({ attribute: false }) accessor labels: Partial<TodoLabels> = {};

  @state() private accessor draft = "";
  @state() private accessor editing: string | null = null;
  @state() private accessor editText = "";
  @state() private accessor removed: { item: TodoItem; index: number } | null = null;
  @state() private accessor announce = "";

  private uid = `tc-todo-${++uidCount}`;

  private get l(): TodoLabels {
    return { ...defaultTodoLabels, ...this.labels };
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // A removal the page has put back can't be undone again
    if (changed.has("items") && this.removed && this.items.some((i) => i.id === this.removed!.item.id)) this.removed = null;
    if (this.editing && !this.items.some((i) => i.id === this.editing)) this.editing = null;
  }

  /* ---------- The model ---------- */

  private get shown() {
    return this.items.filter((i) => (this.filter === "active" ? !i.done : this.filter === "done" ? !!i.done : true));
  }
  private get doneCount() {
    return this.items.filter((i) => i.done).length;
  }

  /** Asks to change the list; true when it changed here (not prevented) */
  private commit(items: TodoItem[], change: TodoChange, said: string) {
    if (!this.emit<TodoItemsChange>("tc-items-change", { items, change }, { cancelable: true })) return false;
    this.items = items;
    this.announce = said;
    return true;
  }

  /* ---------- Actions ---------- */

  private add() {
    const text = this.draft.trim().slice(0, this.maxLength);
    if (!text || this.readonly) return;
    const item: TodoItem = { id: newId(), text, done: false };
    const items = this.addTo === "start" ? [item, ...this.items] : [...this.items, item];
    this.commit(items, { type: "add", id: item.id }, `Added “${text}”`);
    this.draft = "";
    // A new to-do shows: the To do and All tabs have it, Done doesn't
    if (this.filter === "done") this.setFilter("all");
  }

  private toggle(item: TodoItem) {
    if (this.readonly) return;
    const done = !item.done;
    const items = this.items.map((i) => (i.id === item.id ? { ...i, done } : i));
    if (!this.commit(items, { type: "toggle", id: item.id, done }, done ? `Done: “${item.text}”` : `To do: “${item.text}”`)) this.requestUpdate();
  }

  private removeItem(item: TodoItem) {
    if (this.readonly) return;
    const index = this.items.findIndex((i) => i.id === item.id);
    const rowIndex = this.shown.findIndex((i) => i.id === item.id);
    const items = this.items.filter((i) => i.id !== item.id);
    if (!this.commit(items, { type: "remove", id: item.id }, `Removed “${item.text}”. Undo is above the list`)) return;
    this.removed = { item, index };
    // Focus goes to Undo, or failing that the next to-do's box
    void this.updateComplete.then(() => {
      const undo = this.querySelector<HTMLElement>(".ui-todo__undo");
      const next = this.shown[Math.min(rowIndex, this.shown.length - 1)];
      (undo ?? (next ? this.querySelector<HTMLElement>(`#${this.uid}-c-${next.id}`) : this.querySelector<HTMLElement>(".ui-todo__input")))?.focus();
    });
  }

  private undo() {
    const r = this.removed;
    if (!r) return;
    const items = [...this.items];
    items.splice(Math.min(r.index, items.length), 0, r.item);
    if (!this.commit(items, { type: "restore", id: r.item.id }, `Restored “${r.item.text}”`)) return;
    this.removed = null;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`#${this.uid}-c-${r.item.id}`)?.focus());
  }

  private clearDone() {
    const done = this.items.filter((i) => i.done);
    if (!done.length || this.readonly) return;
    this.commit(
      this.items.filter((i) => !i.done),
      { type: "clear", ids: done.map((i) => i.id) },
      `Cleared ${done.length} done ${done.length === 1 ? "to-do" : "to-dos"}`,
    );
    this.removed = null;
  }

  private move(item: TodoItem, step: -1 | 1) {
    // Moves past its neighbour in the tab shown, so it always visibly moves
    const shown = this.shown;
    const at = shown.findIndex((i) => i.id === item.id);
    const neighbour = shown[at + step];
    if (!neighbour || this.readonly) return;
    const items = this.items.filter((i) => i.id !== item.id);
    const n = items.findIndex((i) => i.id === neighbour.id);
    const index = step < 0 ? n : n + 1;
    items.splice(index, 0, item);
    if (!this.commit(items, { type: "move", id: item.id, index }, `Moved “${item.text}” to ${at + step + 1} of ${shown.length}`)) return;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`#${this.uid}-c-${item.id}`)?.focus());
  }

  private startEdit(item: TodoItem) {
    if (this.readonly) return;
    this.editing = item.id;
    this.editText = item.text;
    void this.updateComplete.then(() => {
      const f = this.querySelector<HTMLInputElement>(".ui-todo__edit");
      f?.focus();
      f?.select();
    });
  }
  private finishEdit(keep: boolean) {
    const id = this.editing;
    if (!id) return;
    const item = this.items.find((i) => i.id === id);
    this.editing = null;
    if (!item) return;
    const text = this.editText.trim().slice(0, this.maxLength);
    if (keep && !text) {
      this.removeItem(item);
      return;
    }
    if (keep && text !== item.text) this.commit(this.items.map((i) => (i.id === id ? { ...i, text } : i)), { type: "edit", id, text }, `Changed to “${text}”`);
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`#${this.uid}-t-${id}`)?.focus());
  }

  private setFilter(filter: TodoFilter) {
    if (filter === this.filter) return;
    if (!this.emit<TodoFilterChange>("tc-filter-change", { filter }, { cancelable: true })) return;
    this.filter = filter;
  }

  /* ---------- Rendering ---------- */

  private renderTabs() {
    const l = this.l;
    const done = this.doneCount;
    const tabs: [TodoFilter, string, number][] = [
      ["all", l.all, this.items.length],
      ["active", l.active, this.items.length - done],
      ["done", l.done, done],
    ];
    return html`<div class="ui-todo__tabs" role="tablist" aria-label=${`${this.heading} filter`}>
      ${tabs.map(
        ([id, label, n], i) => html`<button
          type="button"
          role="tab"
          class="ui-todo__tab"
          id=${`${this.uid}-tab-${id}`}
          aria-selected=${this.filter === id ? "true" : "false"}
          aria-controls=${`${this.uid}-panel`}
          tabindex=${this.filter === id ? 0 : -1}
          @click=${() => this.setFilter(id)}
          @keydown=${(e: KeyboardEvent) => {
            const to = e.key === "ArrowRight" ? (i + 1) % 3 : e.key === "ArrowLeft" ? (i + 2) % 3 : e.key === "Home" ? 0 : e.key === "End" ? 2 : -1;
            if (to < 0) return;
            e.preventDefault();
            this.setFilter(tabs[to][0]);
            void this.updateComplete.then(() => this.querySelector<HTMLElement>(`#${this.uid}-tab-${this.filter}`)?.focus());
          }}
        >${label} <span class="ui-todo__count">${n}</span></button>`,
      )}
    </div>`;
  }

  private renderItem(item: TodoItem) {
    const id = this.uid;
    const editing = this.editing === item.id;
    return html`<li class="ui-todo__item" data-id=${item.id} ?data-done=${!!item.done}>
      <span class="ui-todo__box">
        <input
          type="checkbox"
          id=${`${id}-c-${item.id}`}
          .checked=${live(!!item.done)}
          ?disabled=${this.readonly}
          aria-label=${item.text}
          aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"
          @change=${() => this.toggle(item)}
          @keydown=${(e: KeyboardEvent) => {
            if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
              e.preventDefault();
              this.move(item, e.key === "ArrowUp" ? -1 : 1);
            }
          }}
        />
        ${tick()}
      </span>
      ${editing
        ? html`<input
            class="ui-todo__edit"
            type="text"
            aria-label=${`Edit “${item.text}”`}
            maxlength=${this.maxLength}
            .value=${live(this.editText)}
            @input=${(e: Event) => (this.editText = (e.target as HTMLInputElement).value)}
            @keydown=${(e: KeyboardEvent) => {
              if (e.isComposing) return;
              if (e.key === "Enter") {
                e.preventDefault();
                this.finishEdit(true);
              } else if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                this.finishEdit(false);
              }
            }}
            @blur=${() => this.finishEdit(true)}
          />`
        : this.readonly
          ? html`<span class="ui-todo__text" id=${`${id}-t-${item.id}`}>${item.text}</span>`
          : html`<button type="button" class="ui-todo__text" id=${`${id}-t-${item.id}`} @click=${() => this.startEdit(item)}
              >${item.text}<span class="tc-sr-only">, edit</span></button
            >`}
      ${this.readonly || editing
        ? nothing
        : html`<button type="button" class="ui-todo__remove" title="Remove" @click=${() => this.removeItem(item)}>${xIcon()}<span class="tc-sr-only">Remove “${item.text}”</span></button>`}
    </li>`;
  }

  protected override render() {
    const l = this.l;
    const id = this.uid;
    const shown = this.shown;
    const done = this.doneCount;
    const total = this.items.length;
    const empty = this.filter === "active" && total ? l.emptyActive : this.filter === "done" && total ? l.emptyDone : l.emptyAll;
    return html`
      <span class="tc-sr-only" role="status">${this.announce}</span>
      ${cardHead({ icon: listIcon, title: this.heading, subtitle: this.description, id: `${id}-title`, aside: total ? this.renderTabs() : nothing })}
      <div class="ui-todo__card">
        ${this.readonly
          ? nothing
          : html`<form
              class="ui-todo__add"
              @submit=${(e: Event) => {
                e.preventDefault();
                this.add();
              }}
            >
              <label class="tc-sr-only" for=${`${id}-new`}>${l.placeholder}</label>
              <input
                id=${`${id}-new`}
                class="ui-todo__input"
                type="text"
                autocomplete="off"
                .enterKeyHint=${"done"}
                maxlength=${this.maxLength}
                placeholder=${l.placeholder}
                .value=${live(this.draft)}
                @input=${(e: Event) => (this.draft = (e.target as HTMLInputElement).value)}
              />
              <button type="submit" class="ui-todo__add-btn" ?disabled=${!this.draft.trim()}>${plusIcon()}${l.add}</button>
            </form>`}
        ${this.removed
          ? html`<p class="ui-todo__removed">${l.removed} “${this.removed.item.text}” · <button type="button" class="ui-todo__undo" @click=${() => this.undo()}>${l.undo}</button></p>`
          : nothing}
        <div class="ui-todo__panel" id=${`${id}-panel`} role=${total ? "tabpanel" : "presentation"} aria-labelledby=${total ? `${id}-tab-${this.filter}` : `${id}-title`}>
          ${shown.length
            ? html`<ul class="ui-todo__list" aria-labelledby=${`${id}-title`}>
                ${repeat(
                  shown,
                  (i) => i.id,
                  (i) => this.renderItem(i),
                )}
              </ul>`
            : html`<p class="ui-todo__empty">${empty}</p>`}
        </div>
        ${total
          ? html`<div class="ui-todo__foot">
              <span class="ui-todo__progress">
                <span class="ui-todo__meter" role="progressbar" aria-label="Done" aria-valuemin="0" aria-valuemax=${total} aria-valuenow=${done} aria-valuetext=${`${done} of ${total} done`}
                  ><span class="ui-todo__meter-fill" style=${`width:${(done / total) * 100}%`}></span
                ></span>
                <span class="ui-todo__progress-text">${done} of ${total} done</span>
              </span>
              ${done && !this.readonly ? html`<button type="button" class="ui-todo__clear" @click=${() => this.clearDone()}>${l.clearDone}</button>` : nothing}
            </div>`
          : nothing}
      </div>
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="clean"], [data-look="standard"] *, [data-look="clean"] *)[data-ui="todo"] {
  position: relative;
  box-sizing: border-box;
  display: block;
  width: 100%;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Standard: a gray tray holding a white card. Clean: one white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="todo"] { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
:where([data-look="standard"], [data-look="standard"] *).ui-todo__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="todo"] { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-todo__card { border-top: var(--tc-hairline) solid var(--tc-divider); }
[data-ui="todo"] *, [data-ui="todo"] *::before, [data-ui="todo"] *::after { box-sizing: border-box; }
:where([data-ui="todo"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="todo"] :is(button, input):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-ui="todo"]) :is(p, ul, form) { margin: 0; padding: 0; }
[data-ui="todo"] ul { list-style: none; }
[data-ui="todo"] svg { display: block; flex: none; }
/* ----- Tabs ----- */
.ui-todo__tabs { display: inline-flex; flex: none; padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
.ui-todo__tab { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: calc(var(--tc-control-h-sm) - 2 * var(--tc-seg-pad)); padding: 0 var(--tc-space-2-5); border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-todo__tab[aria-selected="true"] { background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-todo__tab[aria-selected="true"] { font-weight: var(--tc-font-weight-strong); }
.ui-todo__count { font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
/* ----- Adding ----- */
.ui-todo__add { display: flex; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-3) var(--tc-space-1); }
.ui-todo__input { flex: 1; min-width: 0; height: var(--tc-field-h); padding: 0 var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font: inherit; font-size: var(--tc-field-font-size); color: var(--tc-text-primary); outline: none; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-todo__input:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-todo__input:focus-visible { box-shadow: var(--tc-field-shadow-focus); outline: none; }
.ui-todo__input::placeholder { color: var(--tc-text-placeholder); }
.ui-todo__add-btn { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-field-h); padding: 0 var(--tc-control-px-md) 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-md); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-primary-fg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-todo__add-btn:hover:not(:disabled) { background: var(--tc-action-primary-bg-hover); }
.ui-todo__add-btn:disabled { background: var(--tc-fill-default); box-shadow: none; color: var(--tc-text-disabled); cursor: not-allowed; }
.ui-todo__removed { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1); margin: var(--tc-space-2) var(--tc-space-3) 0; padding: var(--tc-space-2) var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-fill-subtle); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); animation: ui-todo-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-todo__undo { font-weight: var(--tc-font-weight-medium); color: var(--tc-accent-text); text-decoration: underline; text-underline-offset: var(--tc-space-0-5); }
/* ----- The list ----- */
.ui-todo__panel { padding: var(--tc-space-1) var(--tc-space-2) var(--tc-space-2); }
.ui-todo__item { display: flex; align-items: center; gap: var(--tc-space-2-5); min-height: var(--tc-menu-item-h); padding: var(--tc-space-1) var(--tc-space-1) var(--tc-space-1) var(--tc-space-2); border-radius: var(--tc-menu-item-radius); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); animation: ui-todo-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-todo__item:hover { background: var(--tc-menu-item-hover); }
.ui-todo__text { flex: 1; min-width: 0; padding: var(--tc-space-1) 0; color: var(--tc-text-primary); text-align: left; overflow-wrap: anywhere; cursor: text; transition: color var(--tc-duration-base) var(--tc-ease-standard); }
.ui-todo__item[data-done] .ui-todo__text { color: var(--tc-text-muted); text-decoration: line-through; text-decoration-color: var(--tc-text-muted); }
.ui-todo__edit { flex: 1; min-width: 0; height: var(--tc-control-h-sm); margin: 0 calc(-1 * var(--tc-space-2)); padding: 0 var(--tc-space-2); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow-focus); font: inherit; color: var(--tc-text-primary); outline: none; }
.ui-todo__remove { display: grid; flex: none; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-todo__remove:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
@media (hover: hover) and (pointer: fine) {
  .ui-todo__item:not(:hover, :focus-within) .ui-todo__remove { opacity: 0; }
}
/* The box: the real checkbox, drawn with tokens, the tick laid over it */
.ui-todo__box { display: grid; flex: none; }
.ui-todo__box > * { grid-area: 1 / 1; }
.ui-todo__box input { width: var(--tc-space-5); height: var(--tc-space-5); margin: 0; border-radius: var(--tc-radius-full); background: var(--tc-surface-control); box-shadow: inset 0 0 0 1.5px var(--tc-border-control); appearance: none; cursor: pointer; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-todo__box input:hover:not(:disabled) { box-shadow: inset 0 0 0 1.5px var(--tc-border-control-hover); }
.ui-todo__box input:checked { background: var(--tc-status-success-solid); box-shadow: inset 0 0 0 1.5px var(--tc-status-success-solid); }
.ui-todo__box input:disabled { cursor: default; }
.ui-todo__tick { place-self: center; width: var(--tc-space-3); height: var(--tc-space-3); fill: none; stroke: var(--tc-text-on-accent); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 24; stroke-dashoffset: 24; pointer-events: none; transition: stroke-dashoffset var(--tc-duration-moderate) var(--tc-ease-move); }
.ui-todo__box input:checked + .ui-todo__tick { stroke-dashoffset: 0; }
.ui-todo__empty { padding: var(--tc-space-6) var(--tc-space-4); color: var(--tc-text-muted); text-align: center; }
/* ----- Foot: progress and Clear done ----- */
.ui-todo__foot { display: flex; align-items: center; gap: var(--tc-space-3); padding: var(--tc-space-2-5) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); font-size: var(--tc-font-size-sm); }
.ui-todo__progress { display: flex; flex: 1; align-items: center; gap: var(--tc-space-2-5); min-width: 0; }
.ui-todo__meter { position: relative; flex: 0 1 8rem; height: var(--tc-meter-h); overflow: hidden; border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); }
.ui-todo__meter-fill { position: absolute; inset: 0 auto 0 0; border-radius: inherit; background: var(--tc-status-success-solid); transition: width var(--tc-duration-slow) var(--tc-ease-move); }
.ui-todo__progress-text { color: var(--tc-text-muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-todo__clear { flex: none; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
.ui-todo__clear:hover { color: var(--tc-text-primary); text-decoration: underline; text-underline-offset: var(--tc-space-0-5); }
@keyframes ui-todo-in { from { opacity: 0; transform: translateY(-2px); } }
@media (forced-colors: active) {
  .ui-todo__tab[aria-selected="true"] { outline: 2px solid Highlight; }
  .ui-todo__box input { border: 1px solid ButtonText; }
  .ui-todo__box input:checked { background: Highlight; }
  .ui-todo__tick { stroke: HighlightText; }
  .ui-todo__meter-fill { background: Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="todo"] *, [data-ui="todo"] *::before, [data-ui="todo"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-todo-list")) customElements.define("tc-todo-list", TcTodoList);

declare global {
  interface HTMLElementTagNameMap {
    "tc-todo-list": TcTodoList;
  }
}
