import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";

/*
 * <tc-session-tabs> – open chats as a row of tabs above a chat thread. Each tab has the chat's title (cut off with an
 * ellipsis, the whole title in its tooltip), a mark for its status – running, needs you or failed, each with a word for
 * screen readers – an unread dot, and a close button. A "+" opens a new chat.
 *   · one tab stop: ← / → move between tabs, Home / End to the ends, Enter or Space opens the focused one; Delete closes it
 *   · drag a tab to move it, or Alt+Shift+← / → on the keyboard; the move is announced
 *   · when the tabs don't fit they shrink to a minimum, then scroll sideways with soft edges, and a "more" button lists
 *     the ones out of view
 * The page owns the tabs: tc-close and tc-new are requests, so it removes a tab or adds one. `active` and `order` are
 * the element's own unless a tc-active-change or tc-order-change listener calls preventDefault().
 * Standard: the strip sits on the gray tray, the open tab a white card on it. Clean: one white bar, the open tab filled
 * with an underline.
 *
 *   <tc-session-tabs active="q3" .tabs=${[{ id: "q3", title: "Q3 reconciliation" }, { id: "vr", title: "Vendor risk summary", status: "running" }]}>
 *   </tc-session-tabs>
 */

export type SessionTabStatus = "idle" | "running" | "waiting" | "failed";
export type SessionTab = {
  id: string;
  title: string;
  /** What the chat is doing; idle (the default) shows no mark */
  status?: SessionTabStatus;
  /** Something new since it was last open */
  unread?: boolean;
  /** false hides its close button and Delete does nothing */
  closable?: boolean;
  /** The id of the panel the tab shows, for aria-controls */
  controls?: string;
};
export type SessionTabsLabels = Record<Exclude<SessionTabStatus, "idle">, string> & {
  /** The tab list's name */
  tabs: string;
  unread: string;
  close: string;
  create: string;
  more: string;
  /** How the keys work, read with each tab */
  keys: string;
  /** Said after a move; {title}, {position} and {count} are filled in */
  moved: string;
  /** Said after a close; {title} is filled in */
  closed: string;
};

/** Details of the events */
export type SessionTabsActiveChange = { active: string | null; tab?: SessionTab };
export type SessionTabsOrderChange = { order: string[]; id: string };
export type SessionTabsClose = { id: string; tab: SessionTab };

/** The words used when the page gives none */
export const defaultSessionTabsLabels: SessionTabsLabels = {
  running: "Running",
  waiting: "Needs you",
  failed: "Failed",
  tabs: "Open chats",
  unread: "unread",
  close: "Close",
  create: "New chat",
  more: "More chats",
  keys: "Arrow keys move between chats, Enter opens one, Delete closes it, Alt+Shift+arrows move it",
  moved: "Moved {title} to position {position} of {count}",
  closed: "Closed {title}",
};

const fill = (label: string, values: Record<string, string | number>) => label.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? String(values[k]) : m));

/* Icons: Lucide (ISC, lucide.dev) */
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const STATUS_MARK: Record<Exclude<SessionTabStatus, "idle">, ReturnType<typeof svg>> = {
  running: svg`<path d="M21 12a9 9 0 1 1-6.219-8.56"></path>`,
  waiting: svg`<circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="12"></line><line x1="12" x2="12.01" y1="16" y2="16"></line>`,
  failed: svg`<circle cx="12" cy="12" r="10"></circle><path d="m15 9-6 6"></path><path d="m9 9 6 6"></path>`,
};
const xIcon = svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`;
const plusIcon = svg`<path d="M5 12h14"></path><path d="M12 5v14"></path>`;
const moreIcon = svg`<path d="m6 9 6 6 6-6"></path>`;

/** How far the pointer travels before a press becomes a drag, px */
const DRAG_START = 5;
let uidCount = 0;

/**
 * Open chats as a row of tabs above a chat thread – status, unread, close, reorder by drag or keys, and a menu of the tabs out of view.
 * @tag tc-session-tabs
 * @fires tc-active-change - A tab was opened ({ active, tab }: SessionTabsActiveChange); cancelable – prevented, `active` stays as it was
 * @fires tc-order-change - A tab was moved ({ order, id }: SessionTabsOrderChange); cancelable – prevented, `order` stays as it was
 * @fires tc-close - A tab's close button or Delete was pressed ({ id, tab }: SessionTabsClose); cancelable – the page removes the tab
 * @fires tc-new - The "+" button was pressed (detail: {})
 */
export class TcSessionTabs extends TcElement {
  static override ui = "stab";

  /** The open chats */
  @property({ attribute: false }) accessor tabs: SessionTab[] = [];
  /** The open tab's id. Changed by the user unless a tc-active-change listener calls preventDefault() */
  @property() accessor active: string | null = null;
  /** The tabs' ids in the order shown; empty follows `tabs`. Changed by moving a tab unless a tc-order-change listener calls preventDefault() */
  @property({ attribute: false }) accessor order: string[] = [];
  /** Hides the "+" button */
  @property({ type: Boolean, attribute: "hide-create" }) accessor hideCreate = false;
  /** Rename any of the words, over the defaults */
  @property({ attribute: false }) accessor labels: Partial<SessionTabsLabels> = {};

  /** The tab with the tab stop */
  @state() private accessor focusId = "";
  @state() private accessor announce = "";
  /** Tabs scrolled out of view, for the more menu */
  @state() private accessor outOfView: string[] = [];
  @state() private accessor fade = { start: false, end: false };
  @state() private accessor menuOpen = false;
  /** The drag in progress: the tab and the slot it would drop into */
  @state() private accessor drag: { id: string; to: number } | null = null;

  private press: { id: string; x: number; pointer: number } | null = null;
  private uid = `tc-stab-${++uidCount}`;
  private ro?: ResizeObserver;

  override connectedCallback() {
    super.connectedCallback();
    this.ro = new ResizeObserver(() => this.measure());
    const scroller = this.hasUpdated ? this.scroller : null;
    if (scroller) this.ro.observe(scroller);
  }
  override disconnectedCallback() {
    super.disconnectedCallback();
    this.ro?.disconnect();
    this.ro = undefined;
    document.removeEventListener("pointerdown", this.onOutside, true);
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const shown = this.shown;
    if (!shown.some((t) => t.id === this.focusId)) this.focusId = shown.find((t) => t.id === this.active)?.id ?? shown[0]?.id ?? "";
    if (changed.has("active") && this.active && shown.some((t) => t.id === this.active) && !this.matches(":focus-within")) this.focusId = this.active;
  }

  protected override firstUpdated() {
    const scroller = this.scroller;
    if (scroller) this.ro?.observe(scroller);
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (changed.has("tabs") || changed.has("order")) this.measure();
    if (changed.has("active") && this.active) this.querySelector<HTMLElement>(`[data-tab="${CSS.escape(this.active)}"]`)?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }

  /* ---------- The model ---------- */

  private word<K extends keyof SessionTabsLabels>(key: K) {
    return this.labels[key] ?? defaultSessionTabsLabels[key];
  }
  /** The tabs in the order shown: `order` first (ids it knows), then any tab it doesn't list */
  private get shown(): SessionTab[] {
    const byId = new Map(this.tabs.map((t) => [t.id, t]));
    const listed = this.order.map((id) => byId.get(id)).filter((t): t is SessionTab => !!t);
    const seen = new Set(listed.map((t) => t.id));
    return [...listed, ...this.tabs.filter((t) => !seen.has(t.id))];
  }
  private get scroller() {
    return this.querySelector<HTMLElement>(".ui-stab__scroll");
  }

  /** Which tabs are out of view, and whether each edge should fade – read after layout, never in render */
  private measure = () => {
    const scroller = this.scroller;
    if (!scroller) return;
    const box = scroller.getBoundingClientRect();
    const hidden = [...scroller.querySelectorAll<HTMLElement>("[data-tab]")]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.left < box.left - 1 || r.right > box.right + 1;
      })
      .map((el) => el.dataset.tab!);
    const start = scroller.scrollLeft > 1;
    const end = scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 1;
    if (hidden.join() !== this.outOfView.join()) this.outOfView = hidden;
    if (start !== this.fade.start || end !== this.fade.end) this.fade = { start, end };
    if (!hidden.length && this.menuOpen) this.closeMenu(false);
  };

  /* ---------- Acting ---------- */

  private open(tab: SessionTab) {
    this.focusId = tab.id;
    if (tab.id === this.active) return;
    if (!this.emit<SessionTabsActiveChange>("tc-active-change", { active: tab.id, tab }, { cancelable: true })) return;
    this.active = tab.id;
  }

  private close(tab: SessionTab) {
    if (tab.closable === false) return;
    const shown = this.shown;
    const i = shown.findIndex((t) => t.id === tab.id);
    const hadFocus = this.contains(document.activeElement);
    if (!this.emit<SessionTabsClose>("tc-close", { id: tab.id, tab }, { cancelable: true })) return;
    this.announce = fill(this.word("closed"), { title: tab.title });
    const next = shown[i + 1] ?? shown[i - 1];
    if (!next) return;
    // The open tab closing opens its neighbour, as a browser does
    if (tab.id === this.active) this.open(next);
    this.focusId = next.id;
    if (hadFocus) this.focusTab(next.id);
  }

  /** Moves a tab to a slot in the shown order */
  private move(id: string, to: number) {
    const ids = this.shown.map((t) => t.id);
    const from = ids.indexOf(id);
    to = Math.max(0, Math.min(ids.length - 1, to));
    if (from < 0 || from === to) return false;
    ids.splice(from, 1);
    ids.splice(to, 0, id);
    if (!this.emit<SessionTabsOrderChange>("tc-order-change", { order: ids, id }, { cancelable: true })) return false;
    this.order = ids;
    const tab = this.tabs.find((t) => t.id === id);
    this.announce = fill(this.word("moved"), { title: tab?.title ?? id, position: to + 1, count: ids.length });
    return true;
  }

  private focusTab(id: string) {
    this.focusId = id;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-tab="${CSS.escape(id)}"] [role="tab"]`)?.focus());
  }

  private onKey = (e: KeyboardEvent) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[role="tab"]');
    const id = btn?.closest<HTMLElement>("[data-tab]")?.dataset.tab;
    if (!btn || !id) return;
    const shown = this.shown;
    const i = shown.findIndex((t) => t.id === id);
    const tab = shown[i];
    if (e.altKey && e.shiftKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      e.preventDefault();
      if (this.move(id, i + (e.key === "ArrowLeft" ? -1 : 1))) this.focusTab(id);
      return;
    }
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const to: Record<string, number> = { ArrowLeft: i - 1, ArrowRight: i + 1, Home: 0, End: shown.length - 1 };
    if (e.key in to) {
      e.preventDefault();
      const next = shown[(to[e.key] + shown.length) % shown.length];
      if (next) this.focusTab(next.id);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.open(tab);
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      this.close(tab);
    }
  };

  /* ---------- Dragging ---------- */

  private onPointerDown(e: PointerEvent, id: string) {
    if (e.button !== 0 || (e.target as HTMLElement).closest(".ui-stab__close")) return;
    this.press = { id, x: e.clientX, pointer: e.pointerId };
  }
  private onPointerMove = (e: PointerEvent) => {
    const press = this.press;
    if (!press || press.pointer !== e.pointerId) return;
    if (!this.drag) {
      if (Math.abs(e.clientX - press.x) < DRAG_START) return;
      // Capture keeps the moves coming when the pointer leaves the element; a synthetic pointer can't be captured
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        /* not capturable */
      }
    }
    // The slot is the number of other tabs whose middle the pointer has passed
    const others = [...this.querySelectorAll<HTMLElement>("[data-tab]")].filter((el) => el.dataset.tab !== press.id);
    const to = others.filter((el) => {
      const r = el.getBoundingClientRect();
      return e.clientX > r.left + r.width / 2;
    }).length;
    this.drag = { id: press.id, to };
  };
  private onPointerUp = (e: PointerEvent) => {
    const press = this.press;
    if (!press || press.pointer !== e.pointerId) return;
    const drag = this.drag;
    this.press = null;
    this.drag = null;
    if (drag) {
      // A drag isn't a click
      const swallow = (c: Event) => c.stopPropagation();
      this.addEventListener("click", swallow, { capture: true, once: true });
      setTimeout(() => this.removeEventListener("click", swallow, { capture: true }));
      this.move(drag.id, drag.to);
    }
  };

  /* ---------- The more menu ---------- */

  private toggleMenu() {
    if (this.menuOpen) this.closeMenu(true);
    else {
      this.menuOpen = true;
      document.addEventListener("pointerdown", this.onOutside, true);
      void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-stab__menu-item")?.focus());
    }
  }
  private closeMenu(refocus: boolean) {
    this.menuOpen = false;
    document.removeEventListener("pointerdown", this.onOutside, true);
    if (refocus) void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-stab__more")?.focus());
  }
  private onOutside = (e: Event) => {
    const t = e.target as Node;
    if (!this.querySelector(".ui-stab__menu")?.contains(t) && !this.querySelector(".ui-stab__more")?.contains(t)) this.closeMenu(false);
  };
  private onMenuKey = (e: KeyboardEvent) => {
    const items = [...this.querySelectorAll<HTMLElement>(".ui-stab__menu-item")];
    const at = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      items[(at + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      items[e.key === "Home" ? 0 : items.length - 1]?.focus();
    } else if (e.key === "Escape" || e.key === "Tab") {
      e.preventDefault();
      e.stopPropagation();
      this.closeMenu(true);
    }
  };
  private pickFromMenu(tab: SessionTab) {
    this.closeMenu(false);
    this.open(tab);
    this.focusTab(tab.id);
  }

  /* ---------- Rendering ---------- */

  private renderTab(tab: SessionTab, index: number) {
    const status = tab.status && tab.status !== "idle" ? tab.status : undefined;
    const selected = tab.id === this.active;
    const dragging = this.drag?.id === tab.id;
    const words = [status ? this.word(status) : "", tab.unread ? this.word("unread") : ""].filter(Boolean).join(", ");
    return html`<div
      class="ui-stab__tab"
      role="presentation"
      data-tab=${tab.id}
      data-status=${ifDefined(status)}
      ?data-selected=${selected}
      ?data-dragging=${dragging}
      ?data-drop-before=${this.drag && !dragging && this.dropIndex === index}
      @pointerdown=${(e: PointerEvent) => this.onPointerDown(e, tab.id)}
      @pointermove=${this.onPointerMove}
      @pointerup=${this.onPointerUp}
      @pointercancel=${this.onPointerUp}
    >
      <button
        type="button"
        role="tab"
        class="ui-stab__open"
        id=${`${this.uid}-${tab.id}`}
        tabindex=${tab.id === this.focusId ? 0 : -1}
        aria-selected=${selected ? "true" : "false"}
        aria-controls=${ifDefined(tab.controls)}
        aria-describedby=${`${this.uid}-keys`}
        title=${tab.title}
        @click=${() => this.open(tab)}
      >
        ${status ? html`<span class="ui-stab__mark">${lucide(12, STATUS_MARK[status])}</span>` : nothing}
        <span class="ui-stab__title">${tab.title}</span>
        ${tab.unread ? html`<span class="ui-stab__unread" aria-hidden="true"></span>` : nothing}
        ${words ? html`<span class="tc-sr-only">, ${words}</span>` : nothing}
      </button>
      ${tab.closable === false
        ? nothing
        : html`<button type="button" class="ui-stab__close" tabindex="-1" aria-hidden="true" title=${`${this.word("close")} ${tab.title}`} @click=${() => this.close(tab)}>
            ${lucide(12, xIcon)}
          </button>`}
    </div>`;
  }

  /** Where a dragged tab would land, as an index into the shown tabs (the drop marker goes before that tab) */
  private get dropIndex() {
    const drag = this.drag;
    if (!drag) return -1;
    const shown = this.shown;
    const others = shown.filter((t) => t.id !== drag.id);
    const before = others[drag.to];
    return before ? shown.indexOf(before) : shown.length;
  }

  protected override render() {
    const shown = this.shown;
    const hidden = shown.filter((t) => this.outOfView.includes(t.id));
    const menuId = `${this.uid}-menu`;
    return html`<div class="ui-stab__bar" ?data-fade-start=${this.fade.start} ?data-fade-end=${this.fade.end} ?data-drop-end=${this.drag && this.dropIndex === shown.length}>
        <div class="ui-stab__scroll" @scroll=${this.measure}>
          <div class="ui-stab__list" role="tablist" aria-label=${this.word("tabs")} @keydown=${this.onKey}>
            ${repeat(
              shown,
              (t) => t.id,
              (t, i) => this.renderTab(t, i),
            )}
          </div>
        </div>
        <div class="ui-stab__tools">
          ${hidden.length
            ? html`<button
                type="button"
                class="ui-stab__tool ui-stab__more"
                aria-haspopup="menu"
                aria-expanded=${this.menuOpen ? "true" : "false"}
                aria-controls=${ifDefined(this.menuOpen ? menuId : undefined)}
                title=${this.word("more")}
                @click=${() => this.toggleMenu()}
              >
                <span class="ui-stab__count" aria-hidden="true">${hidden.length}</span>${lucide(14, moreIcon)}<span class="tc-sr-only">${this.word("more")} (${hidden.length})</span>
              </button>`
            : nothing}
          ${this.hideCreate
            ? nothing
            : html`<button type="button" class="ui-stab__tool ui-stab__new" title=${this.word("create")} @click=${() => this.emit("tc-new", {})}>
                ${lucide(14, plusIcon)}<span class="tc-sr-only">${this.word("create")}</span>
              </button>`}
        </div>
        ${this.menuOpen && hidden.length
          ? html`<div class="ui-stab__menu" id=${menuId} role="menu" aria-label=${this.word("more")} @keydown=${this.onMenuKey}>
              ${hidden.map(
                (t) => html`<button type="button" role="menuitem" tabindex="-1" class="ui-stab__menu-item" ?data-selected=${t.id === this.active} @click=${() => this.pickFromMenu(t)}>
                  <span class="ui-stab__menu-title">${t.title}</span>
                  ${t.status && t.status !== "idle" ? html`<span class="ui-stab__menu-status">${this.word(t.status)}</span>` : nothing}
                </button>`,
              )}
            </div>`
          : nothing}
      </div>
      <span class="tc-sr-only" id=${`${this.uid}-keys`}>${this.word("keys")}</span>
      <span class="tc-sr-only" role="status">${this.announce}</span>`;
  }

  static override css = /* css */ `
/* Standard: the strip on the gray tray, the open tab a white card on it */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="stab"] {
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-space-1);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-snug);
  color: var(--tc-text-muted);
  -webkit-font-smoothing: antialiased;
}
/* Clean: one white bar; the open tab filled, with an underline */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="stab"] {
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-space-1);
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-snug);
  color: var(--tc-text-secondary);
  -webkit-font-smoothing: antialiased;
}
[data-ui="stab"] { --tc-stab-min: 96px; --tc-stab-max: 220px; --tc-stab-fade: 24px; --tc-stab-dot: 6px; --tc-stab-menu-w: 240px; }
[data-ui="stab"] *, [data-ui="stab"] *::before, [data-ui="stab"] *::after { box-sizing: border-box; }
:where([data-ui="stab"] button) { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="stab"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(var(--tc-focus-ring-width) * -1); }
[data-ui="stab"] svg { display: block; flex: none; }
.ui-stab__bar { position: relative; display: flex; align-items: center; gap: var(--tc-space-1); min-width: 0; }
.ui-stab__scroll { flex: 1 1 0; min-width: 0; overflow-x: auto; overflow-y: hidden; scrollbar-width: none; }
.ui-stab__scroll::-webkit-scrollbar { display: none; }
.ui-stab__bar[data-fade-start] .ui-stab__scroll { mask-image: linear-gradient(to right, transparent, black var(--tc-stab-fade)); }
.ui-stab__bar[data-fade-end] .ui-stab__scroll { mask-image: linear-gradient(to left, transparent, black var(--tc-stab-fade)); }
.ui-stab__bar[data-fade-start][data-fade-end] .ui-stab__scroll { mask-image: linear-gradient(to right, transparent, black var(--tc-stab-fade), black calc(100% - var(--tc-stab-fade)), transparent); }
.ui-stab__list { display: flex; gap: var(--tc-space-0-5); width: max-content; min-width: 100%; }
.ui-stab__tab {
  position: relative;
  display: flex;
  align-items: center;
  flex: 0 1 var(--tc-stab-max);
  min-width: var(--tc-stab-min);
  max-width: var(--tc-stab-max);
  border-radius: var(--tc-radius-md);
  touch-action: pan-y;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-stab__tab:hover { background: var(--tc-fill-hover); }
:where([data-look="standard"], [data-look="standard"] *) .ui-stab__tab[data-selected] { background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *) .ui-stab__tab[data-selected] { background: var(--tc-fill-selected); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *) .ui-stab__tab[data-selected]::after { content: ""; position: absolute; left: var(--tc-space-2); right: var(--tc-space-2); bottom: 0; height: 2px; border-radius: var(--tc-radius-full); background: var(--tc-accent); }
.ui-stab__tab[data-dragging] { z-index: var(--tc-z-drag); opacity: 0.6; cursor: grabbing; }
.ui-stab__tab[data-drop-before]::before, .ui-stab__bar[data-drop-end] .ui-stab__tab:last-child::before { content: ""; position: absolute; top: var(--tc-space-1); bottom: var(--tc-space-1); left: calc(var(--tc-space-0-5) * -1); width: 2px; border-radius: var(--tc-radius-full); background: var(--tc-accent); }
.ui-stab__bar[data-drop-end] .ui-stab__tab:last-child::before { left: auto; right: calc(var(--tc-space-0-5) * -1); }
.ui-stab__open { flex: 1 1 0; display: flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; height: var(--tc-control-h-sm); padding: 0 var(--tc-space-1) 0 var(--tc-space-2); border-radius: var(--tc-radius-md); text-align: left; }
.ui-stab__title { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-stab__tab[data-selected] .ui-stab__title, .ui-stab__open:has(.ui-stab__unread) .ui-stab__title { font-weight: var(--tc-font-weight-medium); }
.ui-stab__mark { flex: none; color: var(--tc-icon-muted); }
[data-status="waiting"] .ui-stab__mark { color: var(--tc-accent-text); }
[data-status="running"] .ui-stab__mark { color: var(--tc-status-info-fg); }
[data-status="running"] .ui-stab__mark svg { animation: ui-stab-spin var(--tc-duration-reveal-slow) linear infinite; }
[data-status="failed"] .ui-stab__mark { color: var(--tc-status-danger-fg); }
@keyframes ui-stab-spin { to { transform: rotate(360deg); } }
.ui-stab__unread { flex: none; width: var(--tc-stab-dot); height: var(--tc-stab-dot); border-radius: var(--tc-radius-full); background: var(--tc-accent); }
.ui-stab__close { flex: none; display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-radius-md); color: var(--tc-icon-muted); opacity: 0; transition: opacity var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-stab__tab:hover .ui-stab__close, .ui-stab__tab:focus-within .ui-stab__close, .ui-stab__tab[data-selected] .ui-stab__close { opacity: 1; }
.ui-stab__close:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-stab__tools { display: flex; flex: none; align-items: center; gap: var(--tc-space-0-5); }
.ui-stab__tool { display: inline-flex; align-items: center; justify-content: center; gap: var(--tc-space-0-5); min-width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-md); color: var(--tc-icon-muted); }
.ui-stab__tool:hover, .ui-stab__tool[aria-expanded="true"] { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-stab__count { font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; color: var(--tc-text-secondary); }
.ui-stab__menu { position: absolute; top: calc(100% + var(--tc-space-1)); right: 0; z-index: var(--tc-z-dropdown); display: grid; gap: var(--tc-space-0-5); width: var(--tc-stab-menu-w); max-width: 100%; max-height: 320px; overflow-y: auto; padding: var(--tc-menu-padding); border-radius: var(--tc-menu-radius); background: var(--tc-menu-bg); box-shadow: var(--tc-menu-shadow); animation: ui-stab-drop var(--tc-duration-fast) var(--tc-ease-move) both; }
.ui-stab__menu-item { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3); width: 100%; min-height: var(--tc-menu-item-h); padding: 0 var(--tc-menu-item-px) !important; border-radius: var(--tc-menu-item-radius); font-size: var(--tc-menu-item-font-size); color: var(--tc-text-primary); text-align: left; }
.ui-stab__menu-item:hover, .ui-stab__menu-item:focus-visible { background: var(--tc-menu-item-hover); }
[data-ui="stab"] .ui-stab__menu-item:focus-visible { outline: none; }
.ui-stab__menu-item[data-selected] { color: var(--tc-menu-item-selected-fg); }
.ui-stab__menu-title { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-stab__menu-status { flex: none; font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
@keyframes ui-stab-drop { from { opacity: 0; transform: translateY(-4px); } }
@media (hover: none) { .ui-stab__close { opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  [data-status="running"] .ui-stab__mark svg, .ui-stab__menu { animation: none; }
  .ui-stab__tab, .ui-stab__close { transition: none; }
}
@media (forced-colors: active) {
  .ui-stab__mark { color: CanvasText; }
  .ui-stab__unread { background: CanvasText; }
  .ui-stab__tab[data-selected] { outline: 2px solid Highlight; }
  .ui-stab__tab[data-drop-before]::before, .ui-stab__bar[data-drop-end] .ui-stab__tab:last-child::before { background: Highlight; }
}
`;
}

if (!customElements.get("tc-session-tabs")) customElements.define("tc-session-tabs", TcSessionTabs);
declare global {
  interface HTMLElementTagNameMap {
    "tc-session-tabs": TcSessionTabs;
  }
}
