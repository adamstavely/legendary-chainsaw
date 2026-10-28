import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { safeMediaUrl } from "./internal/safe-media";
import "./button";

/*
 * <tc-task-board> – the Lit build of blocks/task-board.tsx: a kanban board for a sprint. Drag cards between columns
 * and reorder them, add cards per column, open a card to change its status, priority, labels, assignee and title,
 * search, filter by label and switch to a compact view.
 * Standard: a white panel with a hairline border; gray lanes with white cards. Clean: the same panel lifted by the
 * card shadow, quieter lanes.
 *
 *   <tc-task-board .statuses=${statuses} .labels=${labels} .people=${people} .tasks=${tasks}></tc-task-board>
 *
 * Keyboard: every card opens with Enter or Space; the detail panel changes status (the alternative to dragging), Esc
 * closes it and focus returns to the card. The label menu follows the menu pattern (arrows, Home / End, Esc).
 * Every change to the tasks fires a cancelable `tc-tasks-change` ({ tasks, task, change }): prevent it to keep
 * control of `tasks` yourself.
 */

export type TaskStatus = {
  id: string;
  label: string;
  /** A small icon – an element (cloned), e.g. a 14 px SVG ring */
  icon?: Element;
};
export type TaskLabel = { id: string; label: string; color: string };
export type TaskPerson = { id: string; name: string; avatar?: string };

export type Task = {
  id: string;
  /** Short reference, e.g. "NW-214" */
  key: string;
  title: string;
  status: string;
  /** 0 none · 1 low · 2 medium · 3 high · 4 urgent */
  priority: 0 | 1 | 2 | 3 | 4;
  estimate?: "XS" | "S" | "M" | "L" | "XL";
  labels: string[];
  assignee?: string;
  /** Days until due – negative when overdue */
  dueIn?: number;
  subtasks?: [done: number, total: number];
  pullRequest?: number;
  created: string;
};

export type TaskChangeKind = "add" | "update" | "move" | "delete";
export type TaskBoardTasksChange = { tasks: Task[]; task: Task; change: TaskChangeKind };

const DEFAULT_PATH = ["Northwind", "Launch", "Sprint 12"];

export const taskPriorityNames = ["No priority", "Low", "Medium", "High", "Urgent"];

const icon = (d: string, size = 16) =>
  html`<svg viewBox="0 0 16 16" width=${size} height=${size} fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<path d=${d}></path>`}</svg>`;

/** Three rising bars – filled up to the level; urgent is a small alert square */
const priorityIcon = (level: number) =>
  level === 4
    ? html`<svg class="ui-tb__prio" viewBox="0 0 14 14" width="14" height="14" aria-hidden="true">${svg`<rect x="1" y="1" width="12" height="12" rx="3" class="ui-tb__prio-urgent"></rect><path d="M7 3.8v4M7 9.9v.3" class="ui-tb__prio-mark" stroke-width="1.6" stroke-linecap="round"></path>`}</svg>`
    : html`<svg class="ui-tb__prio" viewBox="0 0 14 14" width="14" height="14" aria-hidden="true">${[0, 1, 2].map(
        (i) => svg`<rect x=${2 + i * 4} y=${9 - i * 3} width="2.4" height=${3 + i * 3} rx="0.8" class=${level > i ? "ui-tb__prio-on" : "ui-tb__prio-off"}></rect>`,
      )}</svg>`;

const ring = (done: number, total: number) => {
  const c = 2 * Math.PI * 5;
  return html`<svg viewBox="0 0 14 14" width="12" height="12" aria-hidden="true">${svg`<circle class="ui-tb__ring-track" cx="7" cy="7" r="5" fill="none" stroke-width="2"></circle><circle cx="7" cy="7" r="5" fill="none" class="ui-tb__ring-fill" stroke-width="2" stroke-dasharray="${(done / Math.max(1, total)) * c} ${c}" transform="rotate(-90 7 7)"></circle>`}</svg>`;
};

const star = (filled: boolean) =>
  html`<svg slot="icon" viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">${svg`<path d="m8 1.8 1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.6l-3.8 2 .7-4.3-3.1-3 4.3-.6Z" class=${ifDefined(filled ? "ui-tb__star-on" : undefined)} fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"></path>`}</svg>`;

const slotIcon = (d: string, size = 16) =>
  html`<svg slot="icon" viewBox="0 0 16 16" width=${size} height=${size} fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<path d=${d}></path>`}</svg>`;

/**
 * A kanban board: columns per status, cards to drag, a detail panel to edit a card, search, a label filter and a
 * compact view.
 * @tag tc-task-board
 * @fires tc-tasks-change - A card was added, edited, moved or deleted ({ tasks, task, change }: TaskBoardTasksChange); cancelable – prevented, `tasks` stays
 */
export class TcTaskBoard extends TcElement {
  static override ui = "tb";

  /** The cards */
  @property({ attribute: false }) accessor tasks: Task[] = [];
  /** The columns, in order */
  @property({ attribute: false }) accessor statuses: TaskStatus[] = [];
  /** The labels a card can carry, with their colours */
  @property({ attribute: false }) accessor labels: TaskLabel[] = [];
  /** The people a card can be assigned to */
  @property({ attribute: false }) accessor people: TaskPerson[] = [];
  /** Breadcrumb above the board; its steps also name the board */
  @property({ attribute: false }) accessor path: string[] = DEFAULT_PATH;
  /** Shows cards without their properties and dates */
  @property({ type: Boolean, reflect: true }) accessor compact = false;
  /** The day new cards are created, as epoch ms – today by default */
  @property({ type: Number }) accessor now: number | undefined = undefined;

  /** @internal */
  @state() private accessor query = "";
  /** @internal */
  @state() private accessor labelFilter: ReadonlySet<string> = new Set();
  /** @internal */
  @state() private accessor menuOpen = false;
  /** @internal */
  @state() private accessor starred = false;
  /** @internal */
  @state() private accessor openId: string | null = null;
  /** @internal */
  @state() private accessor adding: string | null = null;
  /** @internal */
  @state() private accessor drag: { id: string; over?: string; index?: number } | null = null;

  private draft = "";
  private counter = 0;
  /** Where focus goes after the next update – a selector inside the board */
  private focusNext: string | null = null;
  /** Which end of the label menu takes focus when it opens */
  private moveIn: "first" | "last" | null = null;

  private onWindowKey = (e: KeyboardEvent) => {
    if (e.key === "Escape" && !e.defaultPrevented && this.openId) this.closeDetails();
  };
  private onWindowPointer = (e: PointerEvent) => {
    if (this.menuOpen && !this.querySelector(".ui-tb__menu-wrap")?.contains(e.target as Node)) this.menuOpen = false;
  };

  override connectedCallback() {
    super.connectedCallback();
    window.addEventListener("keydown", this.onWindowKey);
    window.addEventListener("pointerdown", this.onWindowPointer);
  }
  override disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("keydown", this.onWindowKey);
    window.removeEventListener("pointerdown", this.onWindowPointer);
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // A framework clearing a prop sets it to undefined: back to the defaults
    if (!Array.isArray(this.tasks)) this.tasks = [];
    if (!Array.isArray(this.statuses)) this.statuses = [];
    if (!Array.isArray(this.labels)) this.labels = [];
    if (!Array.isArray(this.people)) this.people = [];
    if (!Array.isArray(this.path)) this.path = DEFAULT_PATH;
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (this.focusNext) {
      const selector = this.focusNext;
      this.focusNext = null;
      this.focusIn(selector);
    }
    if (changed.has("menuOpen") && this.menuOpen && this.moveIn) {
      const list = this.menuItems();
      (this.moveIn === "last" ? list[list.length - 1] : list[0])?.focus();
      this.moveIn = null;
    }
  }

  /** Focuses a selector's element – a tc-button's inner button */
  private focusIn(selector: string) {
    const el = this.querySelector<HTMLElement>(selector);
    const target = el?.matches("tc-button") ? el.querySelector<HTMLElement>("button") : el;
    if (target) target.focus({ preventScroll: true });
    else if (el) void (el as HTMLElement & { updateComplete?: Promise<unknown> }).updateComplete?.then(() => el.querySelector<HTMLElement>("button")?.focus({ preventScroll: true }));
  }

  /* ---------- Changes ---------- */

  private commit(tasks: Task[], task: Task, change: TaskChangeKind) {
    if (!this.emit<TaskBoardTasksChange>("tc-tasks-change", { tasks, task, change }, { cancelable: true })) return false;
    this.tasks = tasks;
    return true;
  }
  private patchTask(id: string, patch: Partial<Task>) {
    const current = this.tasks.find((t) => t.id === id);
    if (!current) return;
    const next = { ...current, ...patch };
    this.commit(
      this.tasks.map((t) => (t.id === id ? next : t)),
      next,
      "status" in patch && patch.status !== current.status ? "move" : "update",
    );
  }

  private get visible() {
    const q = this.query.trim().toLowerCase();
    return this.tasks.filter(
      (t) => (!q || `${t.key} ${t.title}`.toLowerCase().includes(q)) && (this.labelFilter.size === 0 || t.labels.some((l) => this.labelFilter.has(l))),
    );
  }

  private openDetails(id: string) {
    this.focusNext = ".ui-tb__panel [data-autofocus]";
    this.openId = id;
  }
  /** Close the detail panel; focus goes back to the card it was opened from */
  private closeDetails() {
    if (this.openId) this.focusNext = `[data-card="${CSS.escape(this.openId)}"]`;
    this.openId = null;
  }

  private deleteOpen(open: Task) {
    // Focus goes to the next card in the column (or the one before, or the column's + button)
    const column = this.visible.filter((t) => t.status === open.status);
    const at = column.findIndex((t) => t.id === open.id);
    const neighbour = column[at + 1] ?? column[at - 1];
    if (!this.commit(this.tasks.filter((t) => t.id !== open.id), open, "delete")) return;
    this.focusNext = neighbour ? `[data-card="${CSS.escape(neighbour.id)}"]` : `[data-add="${CSS.escape(open.status)}"]`;
    this.openId = null;
  }

  /** Adds the drafted card; `keyboard` when Enter submitted it, so focus moves to the new card (or back to +) */
  private add(status: string, keyboard = false) {
    const title = this.draft.trim();
    this.adding = null;
    this.draft = "";
    if (!title) {
      if (keyboard) this.focusNext = `[data-add="${CSS.escape(status)}"]`;
      return;
    }
    this.counter = Math.max(this.counter, this.tasks.length + 300) + 1;
    const id = `t-${this.counter}`;
    // The one clock read: the day a card is created, unless `now` is given
    const created = new Date(this.now ?? Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const task: Task = { id, key: `NW-${this.counter}`, title, status, priority: 0, labels: [], created };
    if (this.commit([task, ...this.tasks], task, "add") && keyboard) this.focusNext = `[data-card="${CSS.escape(id)}"]`;
  }

  /* ---------- Drag and drop ---------- */

  private onDragOver(e: DragEvent, status: string) {
    const drag = this.drag;
    if (!drag) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    // Insert position: before the first card whose middle is below the pointer
    const cards = [...(e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>("[data-card]")].filter((c) => c.dataset.card !== drag.id);
    let index = cards.length;
    for (let i = 0; i < cards.length; i++) {
      const box = cards[i].getBoundingClientRect();
      if (e.clientY < box.top + box.height / 2) {
        index = i;
        break;
      }
    }
    if (drag.over !== status || drag.index !== index) this.drag = { ...drag, over: status, index };
  }
  private onDrop(status: string) {
    const drag = this.drag;
    this.drag = null;
    if (!drag) return;
    const moving = this.tasks.find((t) => t.id === drag.id);
    if (!moving) return;
    const visible = this.visible;
    const others = this.tasks.filter((t) => t.id !== drag.id);
    const column = others.filter((t) => t.status === status && visible.some((v) => v.id === t.id));
    const before = column[drag.index ?? column.length];
    const moved = { ...moving, status };
    const at = before ? others.indexOf(before) : others.length;
    this.commit([...others.slice(0, at), moved, ...others.slice(at)], moved, "move");
  }

  /* ---------- Label menu ---------- */

  private menuItems() {
    return [...this.querySelectorAll<HTMLElement>(".ui-tb__menu [role^='menuitem']")];
  }
  private closeMenu(refocus: boolean) {
    this.menuOpen = false;
    if (refocus) this.focusIn(".ui-tb__filter");
  }
  private onMenuKey(e: KeyboardEvent) {
    const list = this.menuItems();
    const at = list.indexOf(document.activeElement as HTMLElement);
    const go = (i: number) => {
      e.preventDefault();
      list[(i + list.length) % list.length]?.focus();
    };
    if (e.key === "ArrowDown") go(at + 1);
    else if (e.key === "ArrowUp") go(at - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(list.length - 1);
    else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      this.closeMenu(true);
    } else if (e.key === "Tab") this.closeMenu(false);
  }
  private onFilterKey(e: KeyboardEvent) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    this.moveIn = e.key === "ArrowUp" ? "last" : "first";
    if (this.menuOpen) {
      const list = this.menuItems();
      (this.moveIn === "last" ? list[list.length - 1] : list[0])?.focus();
      this.moveIn = null;
    } else this.menuOpen = true;
  }
  private toggleLabel(id: string) {
    const next = new Set(this.labelFilter);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.labelFilter = next;
  }

  /* ---------- Render ---------- */

  private avatar(person: TaskPerson, size: number) {
    const src = safeMediaUrl(person.avatar);
    return src
      ? html`<img class="ui-tb__avatar" src=${src} alt=${person.name} title=${person.name} width=${size} height=${size} loading="lazy" />`
      : html`<span class="ui-tb__avatar ui-tb__avatar--initials" style=${styleMap({ width: `${size}px`, height: `${size}px` })} title=${person.name} role="img" aria-label=${person.name}
          >${person.name[0] ?? "?"}</span
        >`;
  }

  private statusIcon(status: TaskStatus | undefined) {
    return html`<span class="ui-tb__status" aria-hidden="true">${status?.icon ? status.icon.cloneNode(true) : html`<i class="ui-tb__status-dot"></i>`}</span>`;
  }

  private card(t: Task, status: TaskStatus) {
    const who = this.people.find((p) => p.id === t.assignee);
    const due = t.dueIn;
    return html`<article
      class="ui-tb__card"
      data-card=${t.id}
      data-dragging=${ifDefined(this.drag?.id === t.id ? "" : undefined)}
      draggable="true"
      tabindex="0"
      aria-label="${t.key} ${t.title}"
      @dragstart=${(e: DragEvent) => {
        e.dataTransfer?.setData("text/plain", t.id);
        if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
        this.drag = { id: t.id };
      }}
      @dragend=${() => (this.drag = null)}
      @click=${() => this.openDetails(t.id)}
      @keydown=${(e: KeyboardEvent) => {
        if (e.target !== e.currentTarget || (e.key !== "Enter" && e.key !== " ")) return;
        e.preventDefault();
        this.openDetails(t.id);
      }}
    >
      <div class="ui-tb__card-top"><span class="ui-tb__key">${t.key}</span>${who ? this.avatar(who, 18) : nothing}</div>
      <p class="ui-tb__card-title">${this.statusIcon(status)}<span>${t.title}</span></p>
      <div class="ui-tb__props">
        <span class="ui-tb__prop" title=${taskPriorityNames[t.priority] ?? taskPriorityNames[0]}>${priorityIcon(t.priority)}<span class="ui-tb__sr">${taskPriorityNames[t.priority] ?? taskPriorityNames[0]}</span></span>
        ${t.estimate ? html`<span class="ui-tb__prop" title="Estimate">${icon("M8 2.5 13.5 12h-11Z", 12)}${t.estimate}</span>` : nothing}
        ${due !== undefined && Number.isFinite(due)
          ? html`<span class="ui-tb__prop" data-tone=${ifDefined(due < 0 ? "late" : due <= 2 ? "soon" : undefined)}
              >${icon("M8 14.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11ZM8 6v3l2 1.2M6.5 1.5h3", 12)}${due < 0 ? `${-due}d late` : due === 0 ? "Today" : `${due}d`}</span
            >`
          : nothing}
        ${t.subtasks ? html`<span class="ui-tb__prop">${ring(t.subtasks[0], t.subtasks[1])}${t.subtasks[0]}/${t.subtasks[1]}</span>` : nothing}
        ${t.pullRequest
          ? html`<span class="ui-tb__prop"
              >${icon("M4.5 4v8M4.5 4a1.5 1.5 0 1 0 0-.01M11.5 12a1.5 1.5 0 1 0 0 .01M11.5 10.5V6.5a2 2 0 0 0-2-2H7.5M8.5 3.5l-1 1 1 1", 12)}#${t.pullRequest}</span
            >`
          : nothing}
        ${t.labels.map((id) => {
          const l = this.labels.find((x) => x.id === id);
          return l ? html`<span class="ui-tb__prop"><span class="ui-tb__swatch ui-tb__swatch--dot" style=${styleMap({ background: l.color })}></span>${l.label}</span>` : nothing;
        })}
      </div>
      <p class="ui-tb__created">Created ${t.created}</p>
    </article>`;
  }

  private details(task: Task) {
    const look = this.resolvedLook;
    return html`<div class="ui-tb__panel-head">
        <span class="ui-tb__key">${task.key}</span>
        <tc-button look=${look} variant="ghost" size="sm" class="ui-tb__icon" label="Close details" hide-label data-autofocus @click=${() => this.closeDetails()}
          >${slotIcon("m4 4 8 8M12 4l-8 8")}</tc-button
        >
      </div>
      <textarea
        class="ui-tb__title-input"
        .value=${task.title}
        rows="2"
        aria-label="Title"
        @input=${(e: Event) => this.patchTask(task.id, { title: (e.target as HTMLTextAreaElement).value })}
      ></textarea>
      <dl class="ui-tb__fields">
        <dt>Status</dt>
        <dd class="ui-tb__choices">
          ${this.statuses.map(
            (s) =>
              html`<button type="button" class="ui-tb__choice" aria-pressed=${task.status === s.id ? "true" : "false"} @click=${() => this.patchTask(task.id, { status: s.id })}>
                ${this.statusIcon(s)}${s.label}
              </button>`,
          )}
        </dd>
        <dt>Priority</dt>
        <dd class="ui-tb__choices">
          ${([4, 3, 2, 1, 0] as const).map(
            (p) =>
              html`<button type="button" class="ui-tb__choice" aria-pressed=${task.priority === p ? "true" : "false"} @click=${() => this.patchTask(task.id, { priority: p })}>
                ${priorityIcon(p)}${taskPriorityNames[p]}
              </button>`,
          )}
        </dd>
        <dt>Labels</dt>
        <dd class="ui-tb__choices">
          ${this.labels.map((l) => {
            const on = task.labels.includes(l.id);
            return html`<button
              type="button"
              class="ui-tb__choice"
              aria-pressed=${on ? "true" : "false"}
              @click=${() => this.patchTask(task.id, { labels: on ? task.labels.filter((x) => x !== l.id) : [...task.labels, l.id] })}
            >
              <span class="ui-tb__swatch ui-tb__swatch--dot" style=${styleMap({ background: l.color })}></span>${l.label}
            </button>`;
          })}
        </dd>
        <dt>Assignee</dt>
        <dd class="ui-tb__choices">
          ${this.people.map(
            (p) =>
              html`<button
                type="button"
                class="ui-tb__choice"
                aria-pressed=${task.assignee === p.id ? "true" : "false"}
                @click=${() => this.patchTask(task.id, { assignee: task.assignee === p.id ? undefined : p.id })}
              >
                ${this.avatar(p, 16)}${p.name.split(" ")[0]}
              </button>`,
          )}
        </dd>
      </dl>
      <div class="ui-tb__panel-foot">
        <span>Created ${task.created}</span>
        <tc-button look=${look} variant="destructive" size="sm" label="Delete task" @click=${() => this.deleteOpen(task)}></tc-button>
      </div>`;
  }

  override render() {
    const look = this.resolvedLook;
    const visible = this.visible;
    const total = this.tasks.length;
    const open = this.tasks.find((t) => t.id === this.openId) ?? null;
    const filterCount = this.labelFilter.size;
    const drag = this.drag;

    return html`<section class="ui-tb__frame" aria-label=${this.path.join(" / ") || "Task board"}>
      <header class="ui-tb__top">
        <nav class="ui-tb__crumbs" aria-label="Breadcrumb">
          <span class="ui-tb__logo" aria-hidden="true"><i></i><i></i><i></i></span>
          ${this.path.map(
            (p, i) =>
              html`<span class="ui-tb__crumb" aria-current=${ifDefined(i === this.path.length - 1 ? "page" : undefined)}>${i > 0 ? icon("m6 4 4 4-4 4", 12) : nothing}${p}</span>`,
          )}
          <tc-button
            look=${look}
            variant="ghost"
            size="sm"
            class="ui-tb__icon"
            label="Favorite"
            hide-label
            aria-pressed=${this.starred ? "true" : "false"}
            @click=${() => (this.starred = !this.starred)}
            >${star(this.starred)}</tc-button
          >
        </nav>
      </header>

      <div class="ui-tb__bar">
        <span class="ui-tb__count" role="status"
          >${visible.length} ${visible.length === 1 ? "task" : "tasks"}${visible.length !== total ? html`<span> of ${total}</span>` : nothing}</span
        >
        <div class="ui-tb__tools">
          <label class="ui-tb__search">
            ${icon("M7 12.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11ZM11 11l3.5 3.5", 14)}
            <input type="search" .value=${this.query} placeholder="Search" aria-label="Search tasks" @input=${(e: Event) => (this.query = (e.target as HTMLInputElement).value)} />
          </label>
          <div class="ui-tb__menu-wrap">
            <tc-button
              look=${look}
              variant="ghost"
              size="sm"
              class="ui-tb__icon ui-tb__filter"
              label=${filterCount > 0 ? `Filter by label, ${filterCount} selected` : "Filter by label"}
              hide-label
              aria-haspopup="menu"
              aria-expanded=${this.menuOpen ? "true" : "false"}
              data-active=${ifDefined(filterCount > 0 ? "" : undefined)}
              @click=${() => {
                this.moveIn = "first";
                this.menuOpen = !this.menuOpen;
              }}
              @keydown=${this.onFilterKey}
              >${slotIcon("M2.5 4.5h11M4.5 8h7M6.5 11.5h3")}</tc-button
            >
            ${filterCount > 0 ? html`<span class="ui-tb__dot" aria-hidden="true"></span>` : nothing}
            ${this.menuOpen
              ? html`<div class="ui-tb__menu" role="menu" aria-label="Labels" @keydown=${this.onMenuKey}>
                  <p class="ui-tb__menu-title" aria-hidden="true">Labels</p>
                  ${this.labels.map(
                    (l) =>
                      html`<button
                        type="button"
                        role="menuitemcheckbox"
                        tabindex="-1"
                        aria-checked=${this.labelFilter.has(l.id) ? "true" : "false"}
                        class="ui-tb__menu-item"
                        @click=${() => this.toggleLabel(l.id)}
                      >
                        <span class="ui-tb__swatch" style=${styleMap({ background: l.color })}></span>${l.label}${this.labelFilter.has(l.id) ? icon("m3.5 8.5 3 3 6-7", 14) : nothing}
                      </button>`,
                  )}
                  ${filterCount > 0
                    ? html`<button
                        type="button"
                        role="menuitem"
                        tabindex="-1"
                        class="ui-tb__menu-item ui-tb__menu-clear"
                        @click=${() => {
                          this.labelFilter = new Set();
                          // This item goes away with the filter – focus moves to the first label
                          this.menuItems()[0]?.focus();
                        }}
                      >
                        Clear filter
                      </button>`
                    : nothing}
                </div>`
              : nothing}
          </div>
          <tc-button
            look=${look}
            variant="ghost"
            size="sm"
            class="ui-tb__icon ui-tb__compact"
            label="Compact cards"
            hide-label
            title="Compact cards"
            aria-pressed=${this.compact ? "true" : "false"}
            @click=${() => (this.compact = !this.compact)}
            >${slotIcon("M2.5 3.5h11v3h-11zM2.5 9.5h11v3h-11z")}</tc-button
          >
        </div>
      </div>

      <div class="ui-tb__columns">
        ${repeat(
          this.statuses,
          (s) => s.id,
          (status) => {
            const cards = visible.filter((t) => t.status === status.id);
            const isOver = drag?.over === status.id;
            return html`<div
              class="ui-tb__column"
              data-status=${status.id}
              data-over=${ifDefined(isOver ? "" : undefined)}
              @dragover=${(e: DragEvent) => this.onDragOver(e, status.id)}
              @dragleave=${(e: DragEvent) => {
                if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node) && this.drag) this.drag = { id: this.drag.id };
              }}
              @drop=${(e: DragEvent) => {
                e.preventDefault();
                this.onDrop(status.id);
              }}
            >
              <div class="ui-tb__col-head">
                ${this.statusIcon(status)}
                <span class="ui-tb__col-title">${status.label}</span>
                <span class="ui-tb__col-count">${cards.length}</span>
                <tc-button
                  look=${look}
                  variant="ghost"
                  size="sm"
                  class="ui-tb__icon ui-tb__add"
                  data-add=${status.id}
                  label="Add task to ${status.label}"
                  hide-label
                  @click=${() => {
                    this.draft = "";
                    this.adding = status.id;
                    this.focusNext = `[data-new="${CSS.escape(status.id)}"]`;
                  }}
                  >${slotIcon("M8 3v10M3 8h10", 14)}</tc-button
                >
              </div>
              <div class="ui-tb__cards">
                ${this.adding === status.id
                  ? html`<form
                      class="ui-tb__new"
                      @submit=${(e: Event) => {
                        e.preventDefault();
                        this.add(status.id, true);
                      }}
                    >
                      <input
                        data-new=${status.id}
                        .value=${this.draft}
                        placeholder="Task title, then Enter"
                        aria-label="New task in ${status.label}"
                        @input=${(e: Event) => (this.draft = (e.target as HTMLInputElement).value)}
                        @blur=${() => {
                          if (this.adding === status.id) this.add(status.id);
                        }}
                        @keydown=${(e: KeyboardEvent) => {
                          if (e.key !== "Escape") return;
                          e.preventDefault();
                          e.stopPropagation();
                          this.focusNext = `[data-add="${CSS.escape(status.id)}"]`;
                          this.draft = "";
                          this.adding = null;
                        }}
                      />
                    </form>`
                  : nothing}
                ${repeat(
                  cards,
                  (t) => t.id,
                  (t, i) => html`<div class="ui-tb__slot">${isOver && drag?.index === i ? html`<span class="ui-tb__drop"></span>` : nothing}${this.card(t, status)}</div>`,
                )}
                ${isOver && drag?.index === cards.length ? html`<span class="ui-tb__drop"></span>` : nothing}
                ${cards.length === 0 && this.adding !== status.id ? html`<p class="ui-tb__empty">Drop tasks here</p>` : nothing}
              </div>
            </div>`;
          },
        )}
      </div>

      <div class="ui-tb__scrim" data-open=${ifDefined(open ? "" : undefined)} @click=${() => this.closeDetails()} aria-hidden="true"></div>
      <aside class="ui-tb__panel" data-open=${ifDefined(open ? "" : undefined)} aria-label="Task details" .inert=${!open}>${open ? this.details(open) : nothing}</aside>
    </section>`;
  }

  static override css = /* css */ `
[data-ui="tb"] {
  /* The detail panel's backdrop: a light wash, not a modal dimmer */
  --tc-tb-scrim: light-dark(rgba(23, 23, 23, 0.08), rgba(0, 0, 0, 0.4));
  position: relative;
  isolation: isolate;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  container-type: inline-size;
  background: var(--tc-surface-raised);
  border-radius: var(--tc-radius-3xl);
  font-family: var(--tc-font-sans);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
/* Standard: a hairline border; Clean: the card's shadow */
[data-ui="tb"][data-look="standard"] { border: var(--tc-hairline) solid var(--tc-border-default); }
[data-ui="tb"][data-look="clean"] { border-radius: var(--tc-card-radius); box-shadow: var(--tc-card-shadow); }
[data-ui="tb"] *, [data-ui="tb"] *::before, [data-ui="tb"] *::after { box-sizing: border-box; }
[data-ui="tb"] :where(button:not([class*="ui-button"])) { margin: 0; font: inherit; color: inherit; cursor: pointer; }
[data-ui="tb"] button:focus-visible, [data-ui="tb"] [tabindex]:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-tb__sr { position: absolute; width: 1px; height: 1px; margin: 0; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-tb__frame { display: block; }

.ui-tb__top { display: flex; align-items: center; min-height: 48px; padding: 0 var(--tc-space-3-5) 0 var(--tc-space-4-5); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-tb__crumbs { display: flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; font-size: var(--tc-font-size-lg); }
.ui-tb__logo { display: inline-flex; align-items: flex-end; gap: var(--tc-space-0-5); height: 14px; margin-right: var(--tc-space-1); }
.ui-tb__logo i { width: 3px; border-radius: var(--tc-radius-2xs); background: var(--tc-accent); }
.ui-tb__logo i:nth-child(1) { height: 6px; opacity: 0.45; }
.ui-tb__logo i:nth-child(2) { height: 10px; opacity: 0.7; }
.ui-tb__logo i:nth-child(3) { height: 14px; }
.ui-tb__crumb { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); white-space: nowrap; color: var(--tc-text-muted); }
/* Phone width: only the last two steps of the path, so the breadcrumb stays on one line */
@container (max-width: 420px) {
  .ui-tb__crumb:not(:nth-last-of-type(-n + 2)) { display: none; }
}
.ui-tb__crumb svg { color: var(--tc-icon-muted); }
.ui-tb__crumb[aria-current] { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }

/* Icon buttons are the library's ghost Button; pressed / active adds the selected tint and ring */
[data-ui="tb"] .ui-tb__icon:is([aria-pressed="true"], [data-active]) {
  --tc-button-fg: var(--tc-accent-text);
  background: var(--tc-accent-subtle);
  box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-selected);
}
.ui-tb__star-on { fill: var(--tc-status-warning-solid); stroke: var(--tc-status-warning-solid); }
.ui-tb__dot { position: absolute; top: 4px; right: 4px; width: 6px; height: 6px; border-radius: 50%; background: var(--tc-accent); pointer-events: none; }

.ui-tb__bar { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3); min-height: 46px; padding: 0 var(--tc-space-3) 0 var(--tc-space-4-5); }
.ui-tb__count { font-size: var(--tc-font-size-md); font-variant-numeric: tabular-nums; white-space: nowrap; color: var(--tc-text-secondary); }
.ui-tb__count span { color: var(--tc-text-muted); }
.ui-tb__tools { display: flex; align-items: center; gap: var(--tc-space-1); }
/* Toolbar search: the field pattern on the sunken fill, at the toolbar's control height */
.ui-tb__search {
  display: flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  width: clamp(110px, 30vw, 170px);
  height: var(--tc-control-h-sm);
  margin-right: var(--tc-space-1);
  padding: 0 var(--tc-space-2-5);
  border-radius: var(--tc-field-radius);
  background: var(--tc-field-bg-sunken);
  box-shadow: var(--tc-field-shadow);
  color: var(--tc-text-muted);
  transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-tb__search:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-tb__search:focus-within { background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow-focus); }
.ui-tb__search input { flex: 1; min-width: 0; border: 0; outline: none; background: transparent; font: inherit; font-size: var(--tc-field-font-size); color: var(--tc-text-primary); }
.ui-tb__search input::placeholder { color: var(--tc-text-placeholder); }
.ui-tb__search input::-webkit-search-cancel-button { display: none; }
.ui-tb__menu-wrap { position: relative; }
.ui-tb__menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: var(--tc-z-dropdown);
  display: grid;
  gap: var(--tc-space-0-5);
  min-width: 180px;
  padding: var(--tc-menu-padding);
  border-radius: var(--tc-menu-radius);
  background: var(--tc-menu-bg);
  box-shadow: var(--tc-menu-shadow);
  animation: ui-tb-drop var(--tc-duration-base) var(--tc-ease-move);
}
.ui-tb__menu-title { margin: 0; padding: var(--tc-space-1-5) var(--tc-menu-item-px) var(--tc-space-0-5); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); color: var(--tc-caption-color); }
.ui-tb__menu-item { display: flex; align-items: center; gap: var(--tc-space-2); height: var(--tc-menu-item-h); padding: 0 var(--tc-menu-item-px); border: 0; border-radius: var(--tc-menu-item-radius); background: transparent; font-size: var(--tc-menu-item-font-size); text-align: left; }
.ui-tb__menu-item svg { margin-left: auto; color: var(--tc-menu-item-selected-fg); }
.ui-tb__menu-item:hover, .ui-tb__menu-item:focus-visible { background: var(--tc-menu-item-hover); }
.ui-tb__menu-item[aria-checked="true"] { color: var(--tc-menu-item-selected-fg); }
[data-ui="tb"] .ui-tb__menu-item:focus-visible { outline-offset: calc(var(--tc-focus-ring-width) * -1); }
[data-ui="tb"] .ui-tb__menu-clear { color: var(--tc-text-muted); }
.ui-tb__swatch { flex: none; width: 8px; height: 8px; border-radius: var(--tc-radius-2xs); }
.ui-tb__swatch--dot { border-radius: 50%; }
.ui-tb__prio-on { fill: var(--tc-text-secondary); }
.ui-tb__prio-off { fill: var(--tc-border-strong); }
.ui-tb__prio-urgent { fill: var(--tc-tone-pink-solid); }
.ui-tb__prio-mark { stroke: var(--tc-text-on-accent); }
.ui-tb__ring-track { stroke: var(--tc-border-default); }
.ui-tb__ring-fill { stroke: var(--tc-accent); }

/* Columns: gray lanes like the trays, white cards on top */
.ui-tb__columns {
  display: grid;
  grid-auto-columns: minmax(224px, 1fr);
  grid-auto-flow: column;
  gap: var(--tc-space-2-5);
  padding: 0 var(--tc-space-3) var(--tc-space-3);
  overflow-x: auto;
  scrollbar-width: thin;
}
.ui-tb__column {
  display: flex;
  flex-direction: column;
  min-height: 300px;
  padding: var(--tc-space-1) var(--tc-space-1-5) var(--tc-space-1-5);
  border-radius: var(--tc-radius-2xl);
  background: var(--tc-surface-sunken);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-tb__column[data-over] { background: var(--tc-accent-subtle); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-selected); }
.ui-tb__col-head { display: flex; align-items: center; gap: var(--tc-space-2); height: 38px; padding: 0 var(--tc-space-1) 0 var(--tc-space-2); }
.ui-tb__col-title { font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); }
.ui-tb__col-count { font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; color: var(--tc-text-muted); }
.ui-tb__add { margin-left: auto; }
.ui-tb__status { display: grid; place-items: center; flex: none; width: 15px; height: 15px; }
.ui-tb__status svg { width: 15px; height: 15px; }
.ui-tb__status-dot { width: 9px; height: 9px; border-radius: 50%; box-shadow: inset 0 0 0 1.5px var(--tc-icon-muted); }
.ui-tb__cards { display: grid; align-content: start; gap: var(--tc-space-1-5); flex: 1; }
.ui-tb__slot { display: grid; gap: var(--tc-space-1-5); }

.ui-tb__card {
  padding: var(--tc-space-2-5) var(--tc-space-3) var(--tc-space-3);
  border-radius: var(--tc-radius-xl);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  cursor: grab;
  animation: ui-tb-in var(--tc-duration-slow) var(--tc-ease-move) both;
  transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-base) var(--tc-ease-move);
}
.ui-tb__card:hover { box-shadow: var(--tc-card-shadow-hover); }
.ui-tb__card:active { cursor: grabbing; }
.ui-tb__card[data-dragging] { opacity: 0.35; transform: scale(0.98); }
.ui-tb__card-top { display: flex; align-items: center; justify-content: space-between; min-height: 18px; }
.ui-tb__key { font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; color: var(--tc-text-muted); }
.ui-tb__avatar { flex: none; border-radius: 50%; object-fit: cover; box-shadow: 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-tb__avatar--initials { display: grid; place-items: center; background: var(--tc-accent-subtle); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-semibold); color: var(--tc-accent-text); }
.ui-tb__card-title { display: flex; gap: var(--tc-space-2); margin: var(--tc-space-1) 0 0; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-regular); line-height: var(--tc-line-height-normal); }
.ui-tb__card-title .ui-tb__status { margin-top: var(--tc-space-0-5); }
.ui-tb__props { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); margin-top: var(--tc-space-2); }
/* Properties: the pill pattern (outlined) */
.ui-tb__prop {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1);
  height: var(--tc-pill-h-lg);
  padding: 0 var(--tc-pill-px);
  border-radius: var(--tc-pill-radius);
  box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default);
  font-size: var(--tc-font-size-xs);
  font-weight: var(--tc-font-weight-regular);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: var(--tc-text-secondary);
}
.ui-tb__prop svg { flex: none; color: var(--tc-text-muted); }
.ui-tb__prop[data-tone="soon"] { color: var(--tc-status-warning-fg); }
.ui-tb__prop[data-tone="soon"] svg { color: var(--tc-status-warning-solid); }
.ui-tb__prop[data-tone="late"] { color: var(--tc-tone-pink-fg); background: var(--tc-tone-pink-bg); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-tone-pink-border); }
.ui-tb__prop[data-tone="late"] svg { color: var(--tc-tone-pink-solid); }
.ui-tb__created { margin: var(--tc-space-2) 0 0; font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
[data-ui="tb"][compact] .ui-tb__props, [data-ui="tb"][compact] .ui-tb__created { display: none; }

.ui-tb__drop { display: block; height: 3px; margin: 0 var(--tc-space-1); border-radius: var(--tc-radius-2xs); background: var(--tc-accent); animation: ui-tb-grow var(--tc-duration-fast) var(--tc-ease-move); }
.ui-tb__empty { display: grid; place-items: center; min-height: 80px; margin: 0; border: var(--tc-hairline) dashed var(--tc-border-strong); border-radius: var(--tc-radius-xl); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-tb__new input {
  width: 100%;
  height: var(--tc-field-h);
  padding: 0 var(--tc-field-px);
  border: 0;
  border-radius: var(--tc-radius-xl);
  outline: none;
  background: var(--tc-field-bg);
  box-shadow: var(--tc-field-shadow-focus);
  font: inherit;
  font-size: var(--tc-field-font-size);
  color: var(--tc-text-primary);
}
.ui-tb__new input::placeholder { color: var(--tc-text-placeholder); }

/* Detail panel */
.ui-tb__scrim {
  position: absolute;
  inset: 0;
  z-index: var(--tc-z-drawer-scrim);
  background: var(--tc-tb-scrim);
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--tc-duration-moderate) var(--tc-ease-standard);
}
.ui-tb__scrim[data-open] { opacity: 1; pointer-events: auto; }
.ui-tb__panel {
  position: absolute;
  top: 8px;
  right: 8px;
  bottom: 8px;
  z-index: var(--tc-z-drawer);
  display: flex;
  flex-direction: column;
  width: min(360px, calc(100% - 16px));
  padding: var(--tc-space-3-5) var(--tc-space-4);
  overflow-y: auto;
  border-radius: var(--tc-radius-2xl);
  background: var(--tc-surface-overlay);
  box-shadow: var(--tc-shadow-overlay);
  transform: translateX(calc(100% + 24px));
  transition: transform var(--tc-duration-slower) var(--tc-ease-move);
}
.ui-tb__panel[data-open] { transform: none; }
.ui-tb__panel-head { display: flex; align-items: center; justify-content: space-between; }
.ui-tb__title-input {
  margin: var(--tc-space-2) calc(var(--tc-space-1-5) * -1) 0;
  padding: var(--tc-space-1) var(--tc-space-1-5);
  border: 0;
  border-radius: var(--tc-radius-md);
  outline: none;
  resize: none;
  background: transparent;
  font: inherit;
  font-size: var(--tc-font-size-xl);
  font-weight: var(--tc-font-weight-semibold);
  line-height: var(--tc-line-height-loose);
  color: var(--tc-text-primary);
  transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-tb__title-input:hover { background: var(--tc-fill-hover); }
.ui-tb__title-input:focus { background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow-focus); }
.ui-tb__fields { display: grid; gap: var(--tc-space-1-5); margin: var(--tc-space-3-5) 0 0; }
.ui-tb__fields dt { margin-top: var(--tc-space-2); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); color: var(--tc-caption-color); }
.ui-tb__fields dd { margin: 0; }
.ui-tb__choices { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); }
/* Choices: the secondary button's surface; the chosen one gets the selected fill, a ring and the strong weight */
[data-ui="tb"] .ui-tb__choice {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  height: var(--tc-control-h-sm);
  padding: 0 var(--tc-space-2);
  border: 0;
  border-radius: var(--tc-control-radius-sm);
  background: var(--tc-action-secondary-bg);
  box-shadow: var(--tc-action-secondary-shadow);
  font-size: var(--tc-font-size-sm);
  color: var(--tc-text-secondary);
  transition: background-color var(--tc-duration-quick) var(--tc-ease-standard), box-shadow var(--tc-duration-quick) var(--tc-ease-standard);
}
[data-ui="tb"] .ui-tb__choice:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
[data-ui="tb"] .ui-tb__choice[aria-pressed="true"] { background: var(--tc-fill-selected); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-selected); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-tb__panel-foot { display: flex; align-items: center; justify-content: space-between; margin-top: auto; padding-top: var(--tc-space-4); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }

/* Clean: quieter lanes and hairline cards */
[data-look="clean"] .ui-tb__column { border-radius: var(--tc-radius-xl); }
[data-look="clean"] .ui-tb__card { border-radius: var(--tc-radius-lg); }

@keyframes ui-tb-in { from { opacity: 0; transform: translateY(3px); } }
@keyframes ui-tb-drop { from { opacity: 0; transform: translateY(-4px) scale(0.98); } }
@keyframes ui-tb-grow { from { transform: scaleX(0.6); opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  .ui-tb__card, .ui-tb__menu, .ui-tb__drop { animation: none; }
  .ui-tb__panel, .ui-tb__scrim, .ui-tb__card { transition: none; }
}
@media (forced-colors: active) {
  .ui-tb__card, .ui-tb__panel { border: 1px solid CanvasText; }
  .ui-tb__column[data-over] { outline: 2px solid Highlight; }
  .ui-tb__swatch { forced-color-adjust: none; }
}

/* Text fields show their focus with the field ring (above), not a second outline */
[data-ui="tb"] input:not([type="checkbox"]):not([type="radio"]):focus-visible,
[data-ui="tb"] textarea:focus-visible { outline: none; }
`;
}

if (!customElements.get("tc-task-board")) customElements.define("tc-task-board", TcTaskBoard);
declare global {
  interface HTMLElementTagNameMap {
    "tc-task-board": TcTaskBoard;
  }
}
