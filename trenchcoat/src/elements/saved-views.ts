import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { PopoverController } from "./internal/popover";

/*
 * <tc-saved-views> – the tabs above a list or table, each a saved set of filters, sort and columns: "My open cases",
 * "High risk this week". Each tab shows its count, a mark when it's shared with the team and one for the default view.
 *   · one tab stop: ← / → move between views, Home / End to the ends, Enter or Space opens the focused one
 *   · View options (beside the tabs, or the chevron on a tab) – Rename in place, Duplicate, Share with team or Stop
 *     sharing, Set as default, and Delete, which asks to confirm in place
 *   · `dirty` – the page sets it when the filters on screen differ from the open view: the tab says Edited, and a bar
 *     offers Save changes, Save as new view (a name, in place) and Reset
 *   · "+ New view" asks for a name in place
 *   · when the tabs don't fit they scroll sideways, the open one kept in view, and "More views" lists the ones out of view
 *   · the menus float in the top layer under their tab or button (flipped above when there's no room), so a scrolling
 *     card never clips them; Escape or a press outside closes them and focus goes back to the button
 * The page owns the views: every action is a request (tc-view-save, tc-view-create, tc-view-reset, tc-view-rename,
 * tc-view-duplicate, tc-view-share, tc-view-default, tc-view-delete) and the page changes `views`. `active` is the
 * element's own unless a tc-active-change listener calls preventDefault().
 * Standard: the strip sits on the gray tray, the open view a white card on it. Clean: one white bar, the open view
 * filled with an underline.
 *
 *   <tc-saved-views active="mine" .views=${[{ id: "mine", name: "My open cases", count: 14, isDefault: true }]}></tc-saved-views>
 */

export type SavedView = {
  id: string;
  name: string;
  /** How many items it holds – shown on the tab */
  count?: number;
  /** Shared with the team */
  shared?: boolean;
  /** Whose view it is, when it isn't the reader's – read with the tab */
  owner?: string;
  /** The view that opens first */
  isDefault?: boolean;
};

export type SavedViewsLabels = {
  /** The tab list's name */
  views: string;
  options: string;
  /** "Options for {name}" – the options button's name */
  optionsFor: string;
  rename: string;
  duplicate: string;
  share: string;
  unshare: string;
  makeDefault: string;
  delete: string;
  /** "Delete “{name}”?" */
  confirmDelete: string;
  confirmNote: string;
  cancel: string;
  shared: string;
  isDefault: string;
  /** "by {owner}" */
  by: string;
  edited: string;
  editedNote: string;
  save: string;
  saveAsNew: string;
  reset: string;
  create: string;
  name: string;
  namePlaceholder: string;
  add: string;
  more: string;
  keys: string;
  /** Announced after a request: "Renamed to {name}" */
  renamed: string;
};

export const defaultSavedViewsLabels: SavedViewsLabels = {
  views: "Saved views",
  options: "View options",
  optionsFor: "Options for {name}",
  rename: "Rename",
  duplicate: "Duplicate",
  share: "Share with team",
  unshare: "Stop sharing",
  makeDefault: "Set as default",
  delete: "Delete",
  confirmDelete: "Delete “{name}”?",
  confirmNote: "It goes for everyone it's shared with.",
  cancel: "Cancel",
  shared: "shared with the team",
  isDefault: "default view",
  by: "by {owner}",
  edited: "edited",
  editedNote: "This view has unsaved changes",
  save: "Save changes",
  saveAsNew: "Save as new view",
  reset: "Reset",
  create: "New view",
  name: "View name",
  namePlaceholder: "Name the view",
  add: "Save",
  more: "More views",
  keys: "Arrow keys move between views, Enter opens one",
  renamed: "Renamed to {name}",
};

/** Details of the events */
export type SavedViewsActiveChange = { active: string | null; view?: SavedView };
export type SavedViewId = { id: string };
export type SavedViewCreate = { name: string; basis: "current" | "blank" };
export type SavedViewRename = { id: string; name: string };
export type SavedViewShare = { id: string; shared: boolean };

const fill = (label: string, values: Record<string, string | number>) => label.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? String(values[k]) : m));

/* Icons: Lucide (ISC, lucide.dev) */
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const usersIcon = svg`<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>`;
const pinIcon = svg`<path d="M12 17v5"></path><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"></path>`;
const chevronIcon = svg`<path d="m6 9 6 6 6-6"></path>`;
const plusIcon = svg`<path d="M5 12h14"></path><path d="M12 5v14"></path>`;
const dotsIcon = svg`<circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle>`;

let uidCount = 0;

/**
 * Saved views as tabs above a list or table – counts, shared and default marks, rename, duplicate, share, set as default and delete, and Save changes when the view on screen has been edited.
 * @tag tc-saved-views
 * @fires tc-active-change - A view was opened ({ active, view }: SavedViewsActiveChange); cancelable – prevented, `active` stays as it was
 * @fires tc-view-save - Save changes was pressed for the open view ({ id }: SavedViewId); cancelable
 * @fires tc-view-create - A name was given for a new view, from the filters on screen or blank ({ name, basis }: SavedViewCreate); cancelable – prevented, the name field stays
 * @fires tc-view-reset - Reset was pressed: go back to the open view as saved ({ id }: SavedViewId); cancelable
 * @fires tc-view-rename - A view was renamed in place ({ id, name }: SavedViewRename); cancelable – prevented, the name field stays
 * @fires tc-view-duplicate - Duplicate was picked ({ id }: SavedViewId); cancelable
 * @fires tc-view-share - Share with team or Stop sharing was picked ({ id, shared }: SavedViewShare); cancelable
 * @fires tc-view-default - Set as default was picked ({ id }: SavedViewId); cancelable
 * @fires tc-view-delete - Delete was confirmed ({ id }: SavedViewId); cancelable
 */
export class TcSavedViews extends TcElement {
  static override ui = "svw";

  /** The saved views, in the order shown */
  @property({ attribute: false }) accessor views: SavedView[] = [];
  /** The open view's id. Changed by the user unless a tc-active-change listener calls preventDefault() */
  @property() accessor active: string | null = null;
  /** The filters on screen differ from the open view – shows Edited and the Save changes bar */
  @property({ type: Boolean, reflect: true }) accessor dirty = false;
  /** The id of the list or table the views filter, for aria-controls */
  @property() accessor controls: string | undefined = undefined;
  /** Hides "+ New view" */
  @property({ type: Boolean, attribute: "hide-create" }) accessor hideCreate = false;
  /** Rename any of the words, over the defaults */
  @property({ attribute: false }) accessor labels: Partial<SavedViewsLabels> = {};

  /** The tab with the tab stop */
  @state() private accessor focusId = "";
  @state() private accessor announce = "";
  /** Tabs scrolled out of view, for More views */
  @state() private accessor outOfView: string[] = [];
  @state() private accessor fade = { start: false, end: false };
  /** The open menu: the options of a view, its delete confirmation, or More views */
  @state() private accessor menu: { kind: "options" | "confirm"; id: string } | { kind: "more" } | null = null;
  /** The view being renamed in place */
  @state() private accessor renaming = "";
  /** A name being given to a new view: from the filters on screen (the bar) or blank (+ New view) */
  @state() private accessor naming: "current" | "blank" | null = null;

  private uid = `tc-svw-${++uidCount}`;
  private ro?: ResizeObserver;
  /** The buttons that open the menus: a press on them toggles a menu rather than counting as outside it */
  private menuButtons = () => [...this.querySelectorAll(".ui-svw__options, .ui-svw__more, .ui-svw__chevron")];
  /** View options and its delete confirmation, under the view's tab */
  private readonly optionsPop = new PopoverController(this, {
    popover: () => this.querySelector<HTMLElement>(".ui-svw__menu[data-for='options']"),
    anchor: () => {
      const m = this.menu;
      return m && m.kind !== "more" ? this.querySelector<HTMLElement>(`[data-view="${CSS.escape(m.id)}"]`) : null;
    },
    side: "bottom",
    align: "start",
    gap: 4,
    kind: "dialog",
    inside: this.menuButtons,
    returnFocus: () => this.querySelector<HTMLElement>(".ui-svw__options"),
    onClose: () => {
      if (this.menu?.kind !== "more") this.menu = null;
    },
  });
  /** More views, under its button */
  private readonly morePop = new PopoverController(this, {
    popover: () => this.querySelector<HTMLElement>(".ui-svw__menu[data-for='more']"),
    anchor: () => this.querySelector<HTMLElement>(".ui-svw__more"),
    side: "bottom",
    align: "end",
    gap: 4,
    kind: "dialog",
    inside: this.menuButtons,
    returnFocus: () => this.querySelector<HTMLElement>(".ui-svw__more"),
    onClose: () => {
      if (this.menu?.kind === "more") this.menu = null;
    },
  });

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
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const views = this.views;
    if (!views.some((v) => v.id === this.focusId)) this.focusId = views.find((v) => v.id === this.active)?.id ?? views[0]?.id ?? "";
    if (changed.has("active") && this.active && views.some((v) => v.id === this.active) && !this.matches(":focus-within")) this.focusId = this.active;
    // A view that went away takes its menu and its rename with it
    const menu = this.menu;
    if (menu && menu.kind !== "more" && !views.some((v) => v.id === menu.id)) this.closeMenu(false);
    if (this.renaming && !views.some((v) => v.id === this.renaming)) this.renaming = "";
    if (changed.has("dirty") && !this.dirty && this.naming === "current") this.naming = null;
  }

  protected override firstUpdated() {
    const scroller = this.scroller;
    if (scroller) this.ro?.observe(scroller);
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (changed.has("views")) this.measure();
    if (changed.has("active") && this.active) this.querySelector<HTMLElement>(`[data-view="${CSS.escape(this.active)}"]`)?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }

  /* ---------- The model ---------- */

  private word<K extends keyof SavedViewsLabels>(key: K) {
    return this.labels[key] ?? defaultSavedViewsLabels[key];
  }
  private get scroller() {
    return this.querySelector<HTMLElement>(".ui-svw__scroll");
  }
  private view(id: string) {
    return this.views.find((v) => v.id === id);
  }

  /** Which tabs are out of view, and whether each edge fades – read after layout, never in render */
  private measure = () => {
    const scroller = this.scroller;
    if (!scroller) return;
    const box = scroller.getBoundingClientRect();
    const hidden = [...scroller.querySelectorAll<HTMLElement>("[data-view]")]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.left < box.left - 1 || r.right > box.right + 1;
      })
      .map((el) => el.dataset.view!);
    const start = scroller.scrollLeft > 1;
    const end = scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 1;
    if (hidden.join() !== this.outOfView.join()) this.outOfView = hidden;
    if (start !== this.fade.start || end !== this.fade.end) this.fade = { start, end };
    if (!hidden.length && this.menu?.kind === "more") this.closeMenu(false);
  };

  /* ---------- Acting ---------- */

  private open(view: SavedView) {
    this.focusId = view.id;
    if (view.id === this.active) return;
    if (!this.emit<SavedViewsActiveChange>("tc-active-change", { active: view.id, view }, { cancelable: true })) return;
    this.active = view.id;
  }

  private focusTab(id: string) {
    this.focusId = id;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-view="${CSS.escape(id)}"] [role="tab"]`)?.focus());
  }

  private onKey = (e: KeyboardEvent) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[role="tab"]');
    const id = btn?.closest<HTMLElement>("[data-view]")?.dataset.view;
    if (!btn || !id || e.altKey || e.ctrlKey || e.metaKey) return;
    const views = this.views;
    const i = views.findIndex((v) => v.id === id);
    const to: Record<string, number> = { ArrowLeft: i - 1, ArrowRight: i + 1, Home: 0, End: views.length - 1 };
    if (e.key in to) {
      e.preventDefault();
      const next = views[(to[e.key] + views.length) % views.length];
      if (next) this.focusTab(next.id);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.open(views[i]);
    }
  };

  /** A one-off request; the page acts on it. Returns whether it wasn't prevented */
  private request<T>(name: string, detail: T) {
    return this.emit<T>(name, detail, { cancelable: true });
  }

  /* ---------- Menus ---------- */

  private openMenu(menu: NonNullable<TcSavedViews["menu"]>) {
    const pop = menu.kind === "more" ? this.morePop : this.optionsPop;
    const other = menu.kind === "more" ? this.optionsPop : this.morePop;
    if (other.open) other.close("api");
    this.menu = menu;
    // Shown – or, from the options to the delete confirmation, placed again for its new size
    pop.show();
    void this.updateComplete.then(() => {
      pop.reposition();
      const first = menu.kind === "confirm" ? this.querySelector<HTMLElement>(".ui-svw__confirm-cancel") : this.querySelector<HTMLElement>(".ui-svw__menu [role='menuitem']");
      first?.focus();
    });
  }
  private closeMenu(refocus: boolean) {
    const menu = this.menu;
    this.menu = null;
    if (this.optionsPop.open) this.optionsPop.close("api");
    if (this.morePop.open) this.morePop.close("api");
    if (!refocus || !menu) return;
    void this.updateComplete.then(() => {
      const to = menu.kind === "more" ? ".ui-svw__more" : ".ui-svw__options";
      this.querySelector<HTMLElement>(to)?.focus();
    });
  }
  private toggleOptions(id: string) {
    if (this.menu && this.menu.kind !== "more" && this.menu.id === id) this.closeMenu(true);
    else this.openMenu({ kind: "options", id });
  }
  private onMenuKey = (e: KeyboardEvent) => {
    const items = [...this.querySelectorAll<HTMLElement>(".ui-svw__menu [role='menuitem'], .ui-svw__menu .ui-svw__confirm button")];
    const at = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      items[(at + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      items[e.key === "Home" ? 0 : items.length - 1]?.focus();
    } else if (e.key === "Escape" || (e.key === "Tab" && this.menu?.kind !== "confirm")) {
      e.preventDefault();
      e.stopPropagation();
      this.closeMenu(true);
    }
  };

  private pick(action: "rename" | "duplicate" | "share" | "default" | "delete", view: SavedView) {
    if (action === "rename") {
      this.closeMenu(false);
      this.renaming = view.id;
      void this.updateComplete.then(() => {
        const input = this.querySelector<HTMLInputElement>(".ui-svw__rename");
        input?.focus();
        input?.select();
      });
    } else if (action === "delete") {
      this.openMenu({ kind: "confirm", id: view.id });
    } else {
      this.closeMenu(true);
      if (action === "duplicate") this.request<SavedViewId>("tc-view-duplicate", { id: view.id });
      else if (action === "share") this.request<SavedViewShare>("tc-view-share", { id: view.id, shared: !view.shared });
      else this.request<SavedViewId>("tc-view-default", { id: view.id });
    }
  }

  private confirmDelete(view: SavedView) {
    this.closeMenu(false);
    if (this.request<SavedViewId>("tc-view-delete", { id: view.id })) this.announce = `${fill(this.word("confirmDelete"), { name: view.name }).replace(/\?$/, "")}`;
    // Focus goes to the tab that takes its place, or the open one
    const next = this.views.find((v) => v.id !== view.id && v.id === this.active) ?? this.views.find((v) => v.id !== view.id);
    if (next) this.focusTab(next.id);
  }

  /* ---------- Naming in place ---------- */

  private commitRename(input: HTMLInputElement, view: SavedView) {
    const name = input.value.trim();
    if (!name || name === view.name) {
      this.endRename(view.id);
      return;
    }
    if (!this.request<SavedViewRename>("tc-view-rename", { id: view.id, name })) return;
    this.announce = fill(this.word("renamed"), { name });
    this.endRename(view.id);
  }
  private endRename(id: string) {
    this.renaming = "";
    this.focusTab(id);
  }
  private onRenameKey(e: KeyboardEvent, view: SavedView) {
    if (e.key === "Enter") {
      e.preventDefault();
      this.commitRename(e.target as HTMLInputElement, view);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      this.endRename(view.id);
    }
  }

  private startNaming(basis: "current" | "blank") {
    this.naming = basis;
    void this.updateComplete.then(() => this.querySelector<HTMLInputElement>(".ui-svw__name-input")?.focus());
  }
  private commitName(form: HTMLFormElement) {
    const input = form.querySelector<HTMLInputElement>("input")!;
    const name = input.value.trim();
    if (!name) {
      input.focus();
      return;
    }
    const basis = this.naming ?? "blank";
    if (!this.request<SavedViewCreate>("tc-view-create", { name, basis })) return;
    this.naming = null;
  }
  private cancelNaming() {
    const basis = this.naming;
    this.naming = null;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(basis === "blank" ? ".ui-svw__new" : ".ui-svw__save")?.focus());
  }

  /* ---------- Rendering ---------- */

  private renderTab(view: SavedView) {
    const selected = view.id === this.active;
    const edited = selected && this.dirty;
    if (this.renaming === view.id)
      return html`<div class="ui-svw__tab" role="presentation" data-view=${view.id} ?data-selected=${selected} data-renaming>
        <input
          class="ui-svw__rename"
          aria-label=${this.word("name")}
          .value=${view.name}
          @keydown=${(e: KeyboardEvent) => this.onRenameKey(e, view)}
          @blur=${(e: FocusEvent) => this.renaming === view.id && this.commitRename(e.target as HTMLInputElement, view)}
        />
      </div>`;
    const words = [
      view.count != null ? String(view.count) : "",
      view.owner ? fill(this.word("by"), { owner: view.owner }) : "",
      view.shared ? this.word("shared") : "",
      view.isDefault ? this.word("isDefault") : "",
      edited ? this.word("edited") : "",
    ].filter(Boolean);
    return html`<div class="ui-svw__tab" role="presentation" data-view=${view.id} ?data-selected=${selected}>
      <button
        type="button"
        role="tab"
        class="ui-svw__open"
        id=${`${this.uid}-${view.id}`}
        tabindex=${view.id === this.focusId ? 0 : -1}
        aria-selected=${selected ? "true" : "false"}
        aria-controls=${ifDefined(this.controls)}
        aria-describedby=${`${this.uid}-keys`}
        @click=${() => this.open(view)}
      >
        ${view.isDefault ? html`<span class="ui-svw__mark" data-kind="default">${lucide(12, pinIcon)}</span>` : nothing}
        <span class="ui-svw__name">${view.name}</span>
        ${view.shared ? html`<span class="ui-svw__mark" data-kind="shared">${lucide(12, usersIcon)}</span>` : nothing}
        ${view.count != null ? html`<span class="ui-svw__count" aria-hidden="true">${view.count}</span>` : nothing}
        ${edited ? html`<span class="ui-svw__edited" aria-hidden="true"></span>` : nothing}
        ${words.length ? html`<span class="tc-sr-only">, ${words.join(", ")}</span>` : nothing}
      </button>
      <button
        type="button"
        class="ui-svw__chevron"
        tabindex="-1"
        aria-hidden="true"
        title=${fill(this.word("optionsFor"), { name: view.name })}
        @click=${() => this.toggleOptions(view.id)}
      >
        ${lucide(12, chevronIcon)}
      </button>
    </div>`;
  }

  private renderMenu() {
    const menu = this.menu;
    if (!menu) return nothing;
    const menuId = `${this.uid}-menu`;
    if (menu.kind === "more") {
      const hidden = this.views.filter((v) => this.outOfView.includes(v.id));
      if (!this.morePop.open) return nothing;
      return html`<div class="tc-pop ui-svw__menu" data-for="more" id=${menuId} role="menu" aria-label=${this.word("more")} @keydown=${this.onMenuKey}>
        ${hidden.map(
          (v) => html`<button
            type="button"
            role="menuitem"
            tabindex="-1"
            class="ui-svw__item"
            ?data-selected=${v.id === this.active}
            @click=${() => {
              this.closeMenu(false);
              this.open(v);
              this.focusTab(v.id);
            }}
          >
            <span class="ui-svw__item-name">${v.name}</span>${v.count != null ? html`<span class="ui-svw__item-meta">${v.count}</span>` : nothing}
          </button>`,
        )}
      </div>`;
    }
    const view = this.view(menu.id);
    if (!view || !this.optionsPop.open) return nothing;
    if (menu.kind === "confirm")
      return html`<div class="tc-pop ui-svw__menu" data-for="options" id=${menuId} role="dialog" aria-labelledby=${`${this.uid}-confirm`} @keydown=${this.onMenuKey}>
        <div class="ui-svw__confirm">
          <p class="ui-svw__confirm-title" id=${`${this.uid}-confirm`}>${fill(this.word("confirmDelete"), { name: view.name })}</p>
          ${view.shared ? html`<p class="ui-svw__confirm-note">${this.word("confirmNote")}</p>` : nothing}
          <div class="ui-svw__confirm-actions">
            <button type="button" class="tc-btn-sm ui-svw__confirm-cancel" @click=${() => this.closeMenu(true)}>${this.word("cancel")}</button>
            <button type="button" class="tc-btn-sm ui-svw__confirm-delete" @click=${() => this.confirmDelete(view)}>${this.word("delete")}</button>
          </div>
        </div>
      </div>`;
    const item = (action: Parameters<TcSavedViews["pick"]>[0], text: string, danger = false) =>
      html`<button type="button" role="menuitem" tabindex="-1" class="ui-svw__item" ?data-danger=${danger} @click=${() => this.pick(action, view)}>${text}</button>`;
    return html`<div class="tc-pop ui-svw__menu" data-for="options" id=${menuId} role="menu" aria-label=${fill(this.word("optionsFor"), { name: view.name })} @keydown=${this.onMenuKey}>
      ${item("rename", this.word("rename"))} ${item("duplicate", this.word("duplicate"))} ${item("share", view.shared ? this.word("unshare") : this.word("share"))}
      ${view.isDefault ? nothing : item("default", this.word("makeDefault"))}
      <div class="ui-svw__sep" role="separator"></div>
      ${item("delete", `${this.word("delete")}…`, true)}
    </div>`;
  }

  private renderNaming() {
    if (!this.naming) return nothing;
    const id = `${this.uid}-name`;
    return html`<form
      class="ui-svw__naming"
      @submit=${(e: SubmitEvent) => {
        e.preventDefault();
        this.commitName(e.currentTarget as HTMLFormElement);
      }}
      @keydown=${(e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          this.cancelNaming();
        }
      }}
    >
      <label class="tc-sr-only" for=${id}>${this.word("name")}</label>
      <input class="ui-svw__name-input" id=${id} placeholder=${this.word("namePlaceholder")} autocomplete="off" />
      <button type="submit" class="tc-btn-sm ui-svw__primary">${this.word("add")}</button>
      <button type="button" class="tc-btn-sm" @click=${() => this.cancelNaming()}>${this.word("cancel")}</button>
    </form>`;
  }

  protected override render() {
    const views = this.views;
    const hidden = views.filter((v) => this.outOfView.includes(v.id));
    const active = this.active ? this.view(this.active) : undefined;
    const menuOpen = this.menu;
    const optionsOpen = menuOpen && menuOpen.kind !== "more" && active && menuOpen.id === active.id;
    return html`<div class="ui-svw__bar" ?data-fade-start=${this.fade.start} ?data-fade-end=${this.fade.end}>
        <div class="ui-svw__scroll" @scroll=${this.measure}>
          <div class="ui-svw__list" role="tablist" aria-label=${this.word("views")} @keydown=${this.onKey}>
            ${repeat(
              views,
              (v) => v.id,
              (v) => this.renderTab(v),
            )}
          </div>
        </div>
        <div class="ui-svw__tools">
          ${active
            ? html`<button
                type="button"
                class="ui-svw__tool ui-svw__options"
                aria-haspopup="menu"
                aria-expanded=${optionsOpen ? "true" : "false"}
                aria-controls=${ifDefined(optionsOpen ? `${this.uid}-menu` : undefined)}
                title=${this.word("options")}
                @click=${() => this.toggleOptions(active.id)}
              >
                ${lucide(14, dotsIcon)}<span class="tc-sr-only">${fill(this.word("optionsFor"), { name: active.name })}</span>
              </button>`
            : nothing}
          ${hidden.length
            ? html`<button
                type="button"
                class="ui-svw__tool ui-svw__more"
                aria-haspopup="menu"
                aria-expanded=${menuOpen?.kind === "more" ? "true" : "false"}
                aria-controls=${ifDefined(menuOpen?.kind === "more" ? `${this.uid}-menu` : undefined)}
                title=${this.word("more")}
                @click=${() => (menuOpen?.kind === "more" ? this.closeMenu(true) : this.openMenu({ kind: "more" }))}
              >
                <span class="ui-svw__more-count" aria-hidden="true">${hidden.length}</span>${lucide(14, chevronIcon)}<span class="tc-sr-only">${this.word("more")} (${hidden.length})</span>
              </button>`
            : nothing}
          ${this.hideCreate
            ? nothing
            : html`<button type="button" class="ui-svw__tool ui-svw__new" ?hidden=${this.naming === "blank"} @click=${() => this.startNaming("blank")}>
                ${lucide(14, plusIcon)}<span class="ui-svw__new-text">${this.word("create")}</span>
              </button>`}
        </div>
        ${this.renderMenu()}
      </div>
      ${this.dirty && active
        ? html`<div class="ui-svw__dirty" role="group" aria-label=${this.word("editedNote")}>
            <span class="ui-svw__dirty-note"><span class="ui-svw__edited" aria-hidden="true"></span>${this.word("editedNote")}</span>
            ${this.naming === "current"
              ? this.renderNaming()
              : html`<span class="ui-svw__dirty-actions">
                  <button type="button" class="tc-btn-sm" @click=${() => this.request<SavedViewId>("tc-view-reset", { id: active.id })}>${this.word("reset")}</button>
                  <button type="button" class="tc-btn-sm" @click=${() => this.startNaming("current")}>${this.word("saveAsNew")}</button>
                  <button type="button" class="tc-btn-sm ui-svw__primary ui-svw__save" @click=${() => this.request<SavedViewId>("tc-view-save", { id: active.id })}>${this.word("save")}</button>
                </span>`}
          </div>`
        : nothing}
      ${this.naming === "blank" ? html`<div class="ui-svw__dirty" data-new>${this.renderNaming()}</div>` : nothing}
      <span class="tc-sr-only" id=${`${this.uid}-keys`}>${this.word("keys")}</span>
      <span class="tc-sr-only" role="status">${this.announce}</span>`;
  }

  static override css = /* css */ `
/* Standard: the strip on the gray tray, the open view a white card on it */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="svw"] {
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
  color: var(--tc-text-secondary);
  -webkit-font-smoothing: antialiased;
}
/* Clean: one white bar; the open view filled, with an underline */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="svw"] {
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
[data-ui="svw"] { --tc-svw-min: 88px; --tc-svw-max: 240px; --tc-svw-fade: 24px; --tc-svw-dot: 6px; --tc-svw-menu-w: 220px; container-type: inline-size; }
[data-ui="svw"] *, [data-ui="svw"] *::before, [data-ui="svw"] *::after { box-sizing: border-box; }
:where([data-ui="svw"] button:not(.tc-btn-sm)) { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="svw"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(var(--tc-focus-ring-width) * -1); }
[data-ui="svw"] svg { display: block; flex: none; }
[data-ui="svw"] p { margin: 0; }
.ui-svw__bar { position: relative; display: flex; align-items: center; gap: var(--tc-space-1); min-width: 0; }
.ui-svw__scroll { flex: 1 1 0; min-width: 0; overflow-x: auto; overflow-y: hidden; scrollbar-width: none; }
.ui-svw__scroll::-webkit-scrollbar { display: none; }
.ui-svw__bar[data-fade-start] .ui-svw__scroll { mask-image: linear-gradient(to right, transparent, black var(--tc-svw-fade)); }
.ui-svw__bar[data-fade-end] .ui-svw__scroll { mask-image: linear-gradient(to left, transparent, black var(--tc-svw-fade)); }
.ui-svw__bar[data-fade-start][data-fade-end] .ui-svw__scroll { mask-image: linear-gradient(to right, transparent, black var(--tc-svw-fade), black calc(100% - var(--tc-svw-fade)), transparent); }
.ui-svw__list { display: flex; gap: var(--tc-space-0-5); width: max-content; min-width: 100%; }
.ui-svw__tab { position: relative; display: flex; align-items: center; flex: none; max-width: var(--tc-svw-max); min-width: var(--tc-svw-min); border-radius: var(--tc-radius-md); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-svw__tab:hover { background: var(--tc-fill-hover); }
:where([data-look="standard"], [data-look="standard"] *) .ui-svw__tab[data-selected] { background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *) .ui-svw__tab[data-selected] { background: var(--tc-fill-selected); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *) .ui-svw__tab[data-selected]::after { content: ""; position: absolute; left: var(--tc-space-2); right: var(--tc-space-2); bottom: 0; height: 2px; border-radius: var(--tc-radius-full); background: var(--tc-accent); }
.ui-svw__open { flex: 1 1 auto; display: flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; height: var(--tc-control-h-sm); padding: 0 var(--tc-space-1) 0 var(--tc-space-2) !important; border-radius: var(--tc-radius-md); text-align: left; }
.ui-svw__name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-svw__tab[data-selected] .ui-svw__name { font-weight: var(--tc-font-weight-medium); }
.ui-svw__mark { flex: none; color: var(--tc-icon-muted); }
.ui-svw__count { flex: none; padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-full); background: var(--tc-fill-hover); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; color: var(--tc-text-secondary); }
.ui-svw__edited { flex: none; display: inline-block; width: var(--tc-svw-dot); height: var(--tc-svw-dot); border-radius: var(--tc-radius-full); background: var(--tc-status-warning-fg); }
.ui-svw__chevron { flex: none; display: grid; place-items: center; width: var(--tc-space-5); height: var(--tc-control-h-sm); margin-right: var(--tc-space-0-5) !important; border-radius: var(--tc-radius-sm); color: var(--tc-icon-muted); opacity: 0; transition: opacity var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-svw__tab:hover .ui-svw__chevron, .ui-svw__tab[data-selected] .ui-svw__chevron { opacity: 1; }
.ui-svw__chevron:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-svw__rename { width: var(--tc-svw-max); max-width: 100%; height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow-focus); font: inherit; color: var(--tc-text-primary); }
.ui-svw__rename:focus { outline: none; }
.ui-svw__tools { display: flex; flex: none; align-items: center; gap: var(--tc-space-0-5); }
.ui-svw__tool { display: inline-flex; align-items: center; justify-content: center; gap: var(--tc-space-1); min-width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); padding: 0 var(--tc-space-1-5) !important; border-radius: var(--tc-radius-md); color: var(--tc-text-secondary); }
.ui-svw__tool:hover, .ui-svw__tool[aria-expanded="true"] { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-svw__tool[hidden] { display: none; }
.ui-svw__more-count { font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; }
/* The menus: the shared popover surface (.tc-pop) in the top layer */
[data-ui="svw"] .ui-svw__menu { display: grid; gap: var(--tc-space-0-5); width: var(--tc-svw-menu-w); max-height: min(calc(var(--tc-space-16) * 5), calc(100vh - var(--tc-space-4))); overflow-y: auto; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-svw__item { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3); width: 100%; min-height: var(--tc-menu-item-h); padding: 0 var(--tc-menu-item-px) !important; border-radius: var(--tc-menu-item-radius); font-size: var(--tc-menu-item-font-size); color: var(--tc-text-primary); text-align: left; }
.ui-svw__item:hover, .ui-svw__item:focus-visible { background: var(--tc-menu-item-hover); }
[data-ui="svw"] .ui-svw__item:focus-visible { outline: none; }
.ui-svw__item[data-selected] { color: var(--tc-menu-item-selected-fg); }
.ui-svw__item[data-danger] { color: var(--tc-status-danger-fg); }
.ui-svw__item-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-svw__item-meta { flex: none; font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-svw__sep { height: 1px; margin: var(--tc-space-0-5) 0; background: var(--tc-border-default); }
.ui-svw__confirm { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-2); }
.ui-svw__confirm-title { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); overflow-wrap: anywhere; }
.ui-svw__confirm-note { font-size: var(--tc-font-size-xs); color: var(--tc-text-secondary); }
.ui-svw__confirm-actions { display: flex; justify-content: flex-end; gap: var(--tc-space-1-5); }
[data-ui="svw"] .ui-svw__confirm-delete { background: var(--tc-action-danger-bg); color: var(--tc-action-danger-fg); box-shadow: none; }
[data-ui="svw"] .ui-svw__confirm-delete:hover { background: var(--tc-action-danger-bg-hover); }
[data-ui="svw"] .ui-svw__primary { background: var(--tc-action-primary-bg); color: var(--tc-action-primary-fg); box-shadow: var(--tc-action-primary-shadow); }
[data-ui="svw"] .ui-svw__primary:hover { background: var(--tc-action-primary-bg-hover); }
.ui-svw__dirty { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-2); margin-top: var(--tc-space-1); padding: var(--tc-space-1-5) var(--tc-space-2); border-radius: var(--tc-radius-md); background: var(--tc-surface-raised); color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *) .ui-svw__dirty { background: var(--tc-surface-tray); }
.ui-svw__dirty-note { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-xs); }
.ui-svw__dirty-actions { display: inline-flex; flex-wrap: wrap; gap: var(--tc-space-1-5); }
.ui-svw__naming { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5); flex: 1 1 calc(var(--tc-space-16) * 4); justify-content: flex-end; }
.ui-svw__dirty[data-new] .ui-svw__naming { justify-content: flex-start; }
.ui-svw__name-input { flex: 1 1 calc(var(--tc-space-16) * 2); min-width: 0; max-width: calc(var(--tc-space-16) * 4); height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font: inherit; color: var(--tc-text-primary); }
.ui-svw__name-input:focus { outline: none; box-shadow: var(--tc-field-shadow-focus); }
@container (max-width: 480px) {
  .ui-svw__new-text { display: none; }
}
@media (hover: none) { .ui-svw__chevron { opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  .ui-svw__tab, .ui-svw__chevron { transition: none; }
}
@media (forced-colors: active) {
  .ui-svw__tab[data-selected] { outline: 2px solid Highlight; }
  .ui-svw__edited { background: CanvasText; }
  .ui-svw__count { border: 1px solid CanvasText; }
}
`;
}

if (!customElements.get("tc-saved-views")) customElements.define("tc-saved-views", TcSavedViews);
declare global {
  interface HTMLElementTagNameMap {
    "tc-saved-views": TcSavedViews;
  }
}
