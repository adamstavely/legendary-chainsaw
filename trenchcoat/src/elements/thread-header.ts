import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { TcElement } from "./internal/base";

/*
 * <tc-thread-header> – the bar at the top of a chat thread: its title, which you rename in place, the model and the
 * project as quiet chips, Share, a toggle for each side panel, and a menu of the rest (archive, export, delete).
 *   · click the title (or focus it and press F2 or Enter) to rename: Enter or leaving the field saves, Escape cancels
 *   · the panel toggles are pressed buttons; the page shows and hides the panels on tc-panels-change
 *   · narrow (under ~32rem of its own width) the chips hide, and Share and the toggles fold into the menu
 * `heading` and `panels` are the element's own unless a tc-title-change or tc-panels-change listener calls
 * preventDefault(). Share and the menu's actions are requests: tc-share and tc-action.
 * Standard: a bar on the gray tray. Clean: one white bar.
 *
 *   <tc-thread-header heading="Q3 reconciliation" model="Analyst model" project="Annual audit"
 *     .toggles=${[{ id: "sources", label: "Sources" }]}></tc-thread-header>
 */

export type ThreadHeaderToggle = {
  id: string;
  /** Its name – the button's words for screen readers and its tooltip */
  label: string;
  /** Lucide-style path data for its icon; a panel icon when left out */
  icon?: string | string[];
};
export type ThreadHeaderAction = {
  id: string;
  label: string;
  /** Drawn in the danger colour, after a separator */
  danger?: boolean;
};
export type ThreadHeaderLabels = {
  rename: string;
  titleField: string;
  share: string;
  more: string;
  model: string;
  project: string;
  panels: string;
  untitled: string;
  /** Said after a rename; {title} is filled in */
  renamed: string;
};

/** Details of the events */
/** `heading` repeats `title` under the property's own name, for frameworks that bind `heading` to its change event */
export type ThreadHeaderTitleChange = { title: string; heading: string; previous: string };
export type ThreadHeaderPanelsChange = { panels: string[]; id: string; open: boolean };
export type ThreadHeaderActionEvent = { action: string };

/** The words used when the page gives none */
export const defaultThreadHeaderLabels: ThreadHeaderLabels = {
  rename: "Rename",
  titleField: "Chat title",
  share: "Share",
  more: "More actions",
  model: "Model",
  project: "Project",
  panels: "Panels",
  untitled: "New chat",
  renamed: "Renamed to {title}",
};

/** The menu's actions when the page gives none */
export const defaultThreadHeaderActions: ThreadHeaderAction[] = [
  { id: "export", label: "Export" },
  { id: "archive", label: "Archive" },
  { id: "delete", label: "Delete", danger: true },
];

/* Icons: Lucide (ISC, lucide.dev) */
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const paths = (d: string | string[]) => (Array.isArray(d) ? d : [d]).map((p) => svg`<path d=${p}></path>`);
const panelIcon = svg`<rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M15 3v18"></path>`;
const shareIcon = svg`<path d="M12 2v13"></path><path d="m16 6-4-4-4 4"></path><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>`;
const moreIcon = svg`<circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle>`;
const modelIcon = svg`<path d="M12 8V4H8"></path><rect width="16" height="12" x="4" y="8" rx="2"></rect><path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path>`;
const folderIcon = svg`<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"></path>`;

let uidCount = 0;

/**
 * The bar at the top of a chat thread – the title renamed in place, model and project chips, Share, side-panel toggles and a menu.
 * @tag tc-thread-header
 * @fires tc-title-change - The title was renamed ({ title, heading, previous }: ThreadHeaderTitleChange); cancelable – prevented, `heading` stays as it was
 * @fires tc-panels-change - A panel toggle was pressed ({ panels, id, open }: ThreadHeaderPanelsChange); cancelable – prevented, `panels` stays as it was
 * @fires tc-share - Share was pressed (detail: {})
 * @fires tc-action - A menu action was picked ({ action }: ThreadHeaderActionEvent)
 */
export class TcThreadHeader extends TcElement {
  static override ui = "thd";

  /** The thread's title. Changed by renaming unless a tc-title-change listener calls preventDefault() */
  @property() accessor heading = "";
  /** The heading level of the title, 1–6 */
  @property({ type: Number }) accessor level = 2;
  /** The model's name, as a chip */
  @property() accessor model: string | undefined = undefined;
  /** The project the thread belongs to, as a chip */
  @property() accessor project: string | undefined = undefined;
  /** A toggle button for each side panel */
  @property({ attribute: false }) accessor toggles: ThreadHeaderToggle[] = [];
  /** The ids of the open panels. Changed by the toggles unless a tc-panels-change listener calls preventDefault() */
  @property({ attribute: false }) accessor panels: string[] = [];
  /** The menu's actions */
  @property({ attribute: false }) accessor actions: ThreadHeaderAction[] = defaultThreadHeaderActions;
  /** Hides Share */
  @property({ type: Boolean, attribute: "hide-share" }) accessor hideShare = false;
  /** Turns renaming off: the title is plain text */
  @property({ type: Boolean, attribute: "no-rename" }) accessor noRename = false;
  /** Rename any of the words, over the defaults */
  @property({ attribute: false }) accessor labels: Partial<ThreadHeaderLabels> = {};

  @state() private accessor editing = false;
  @state() private accessor menuOpen = false;
  @state() private accessor announce = "";
  private uid = `tc-thd-${++uidCount}`;
  private draft = "";

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("pointerdown", this.onOutside, true);
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (changed.has("editing") && this.editing) {
      const input = this.querySelector<HTMLInputElement>(".ui-thd__input");
      input?.focus();
      input?.select();
    }
  }

  private word<K extends keyof ThreadHeaderLabels>(key: K) {
    return this.labels[key] ?? defaultThreadHeaderLabels[key];
  }

  /* ---------- Renaming ---------- */

  private startRename() {
    if (this.noRename) return;
    this.draft = this.heading;
    this.editing = true;
  }
  private finishRename(save: boolean) {
    if (!this.editing) return;
    const title = this.draft.trim();
    const previous = this.heading;
    this.editing = false;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-thd__title-btn")?.focus());
    if (!save || !title || title === previous) return;
    if (!this.emit<ThreadHeaderTitleChange>("tc-title-change", { title, heading: title, previous }, { cancelable: true })) return;
    this.heading = title;
    this.announce = this.word("renamed").replace("{title}", () => title);
  }
  private onInputKey = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      this.finishRename(true);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      this.finishRename(false);
    }
  };

  /* ---------- Panels ---------- */

  private toggle(t: ThreadHeaderToggle) {
    const open = !this.panels.includes(t.id);
    const panels = open ? [...this.panels, t.id] : this.panels.filter((p) => p !== t.id);
    if (!this.emit<ThreadHeaderPanelsChange>("tc-panels-change", { panels, id: t.id, open }, { cancelable: true })) return;
    this.panels = panels;
  }

  /* ---------- The menu ---------- */

  private toggleMenu() {
    if (this.menuOpen) this.closeMenu(true);
    else {
      this.menuOpen = true;
      document.addEventListener("pointerdown", this.onOutside, true);
      void this.updateComplete.then(() => [...this.querySelectorAll<HTMLElement>(".ui-thd__menu-item")].find((el) => el.offsetParent !== null)?.focus());
    }
  }
  private closeMenu(refocus: boolean) {
    this.menuOpen = false;
    document.removeEventListener("pointerdown", this.onOutside, true);
    if (refocus) void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-thd__more")?.focus());
  }
  private onOutside = (e: Event) => {
    const t = e.target as Node;
    if (!this.querySelector(".ui-thd__menu")?.contains(t) && !this.querySelector(".ui-thd__more")?.contains(t)) this.closeMenu(false);
  };
  private onMenuKey = (e: KeyboardEvent) => {
    // Items hidden at this width (Share and the toggles, when they're in the bar) are skipped
    const items = [...this.querySelectorAll<HTMLElement>(".ui-thd__menu-item")].filter((el) => el.offsetParent !== null);
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
  private menuRun(fn: () => void, keepOpen = false) {
    if (!keepOpen) this.closeMenu(true);
    fn();
  }

  /* ---------- Rendering ---------- */

  private renderTitle() {
    const title = this.heading || this.word("untitled");
    const level = Math.min(6, Math.max(1, Math.round(this.level) || 2));
    const inner = this.editing
      ? html`<input
          class="ui-thd__input"
          type="text"
          aria-label=${this.word("titleField")}
          .value=${live(this.draft)}
          @input=${(e: Event) => (this.draft = (e.target as HTMLInputElement).value)}
          @keydown=${this.onInputKey}
          @blur=${() => this.finishRename(true)}
        />`
      : this.noRename
        ? html`<span class="ui-thd__title-text">${title}</span>`
        : html`<button
            type="button"
            class="ui-thd__title-btn"
            title=${title}
            @click=${() => this.startRename()}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === "F2") {
                e.preventDefault();
                this.startRename();
              }
            }}
          >
            <span class="ui-thd__title-text">${title}</span><span class="tc-sr-only">, ${this.word("rename")}</span>
          </button>`;
    return html`<div class="ui-thd__title" role="heading" aria-level=${level}>${inner}</div>`;
  }

  protected override render() {
    const menuId = `${this.uid}-menu`;
    const regular = this.actions.filter((a) => !a.danger);
    const danger = this.actions.filter((a) => a.danger);
    const toggleIcon = (t: ThreadHeaderToggle) => (t.icon ? lucide(16, svg`${paths(t.icon)}`) : lucide(16, panelIcon));
    return html`<div class="ui-thd__bar">
        ${this.renderTitle()}
        ${this.model || this.project
          ? html`<div class="ui-thd__chips">
              ${this.model ? html`<span class="ui-thd__chip" title=${`${this.word("model")}: ${this.model}`}>${lucide(12, modelIcon)}<span class="tc-sr-only">${this.word("model")}: </span>${this.model}</span>` : nothing}
              ${this.project ? html`<span class="ui-thd__chip" title=${`${this.word("project")}: ${this.project}`}>${lucide(12, folderIcon)}<span class="tc-sr-only">${this.word("project")}: </span>${this.project}</span>` : nothing}
            </div>`
          : nothing}
        <div class="ui-thd__tools">
          ${this.hideShare
            ? nothing
            : html`<button type="button" class="ui-thd__share" @click=${() => this.emit("tc-share", {})}>${lucide(14, shareIcon)}<span>${this.word("share")}</span></button>`}
          ${this.toggles.length
            ? html`<div class="ui-thd__toggles" role="group" aria-label=${this.word("panels")}>
                ${this.toggles.map(
                  (t) => html`<button type="button" class="ui-thd__toggle" data-toggle=${t.id} aria-pressed=${this.panels.includes(t.id) ? "true" : "false"} title=${t.label} @click=${() => this.toggle(t)}>
                    ${toggleIcon(t)}<span class="tc-sr-only">${t.label}</span>
                  </button>`,
                )}
              </div>`
            : nothing}
          ${this.actions.length || this.toggles.length || !this.hideShare
            ? html`<button
                type="button"
                class="ui-thd__more"
                aria-haspopup="menu"
                aria-expanded=${this.menuOpen ? "true" : "false"}
                aria-controls=${ifDefined(this.menuOpen ? menuId : undefined)}
                title=${this.word("more")}
                @click=${() => this.toggleMenu()}
              >
                ${lucide(16, moreIcon)}<span class="tc-sr-only">${this.word("more")}</span>
              </button>`
            : nothing}
        </div>
        ${this.menuOpen
          ? html`<div class="ui-thd__menu" id=${menuId} role="menu" aria-label=${this.word("more")} @keydown=${this.onMenuKey}>
              ${this.hideShare ? nothing : html`<button type="button" role="menuitem" tabindex="-1" class="ui-thd__menu-item" data-narrow @click=${() => this.menuRun(() => this.emit("tc-share", {}))}>${this.word("share")}</button>`}
              ${this.toggles.map(
                (t) => html`<button type="button" role="menuitemcheckbox" tabindex="-1" class="ui-thd__menu-item" data-narrow aria-checked=${this.panels.includes(t.id) ? "true" : "false"} @click=${() => this.menuRun(() => this.toggle(t), true)}>
                  <span>${t.label}</span><span class="ui-thd__check" aria-hidden="true">${this.panels.includes(t.id) ? "✓" : ""}</span>
                </button>`,
              )}
              ${(!this.hideShare || this.toggles.length) && this.actions.length ? html`<div class="ui-thd__sep" role="separator" data-narrow></div>` : nothing}
              ${regular.map((a) => html`<button type="button" role="menuitem" tabindex="-1" class="ui-thd__menu-item" @click=${() => this.menuRun(() => this.emit<ThreadHeaderActionEvent>("tc-action", { action: a.id }))}>${a.label}</button>`)}
              ${regular.length && danger.length ? html`<div class="ui-thd__sep" role="separator"></div>` : nothing}
              ${danger.map((a) => html`<button type="button" role="menuitem" tabindex="-1" class="ui-thd__menu-item" data-danger @click=${() => this.menuRun(() => this.emit<ThreadHeaderActionEvent>("tc-action", { action: a.id }))}>${a.label}</button>`)}
            </div>`
          : nothing}
      </div>
      <span class="tc-sr-only" role="status">${this.announce}</span>`;
  }

  static override css = /* css */ `
/* Standard: a bar on the gray tray */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="thd"] {
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-space-1-5) var(--tc-space-2);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-snug);
  color: var(--tc-text-muted);
  container-type: inline-size;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one white bar */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="thd"] {
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-space-1-5) var(--tc-space-2);
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-snug);
  color: var(--tc-text-secondary);
  container-type: inline-size;
  -webkit-font-smoothing: antialiased;
}
[data-ui="thd"] { --tc-thd-chip-max: 160px; --tc-thd-menu-w: 200px; }
[data-ui="thd"] *, [data-ui="thd"] *::before, [data-ui="thd"] *::after { box-sizing: border-box; }
:where([data-ui="thd"] button) { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="thd"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(var(--tc-focus-ring-width) * -1); }
[data-ui="thd"] svg { display: block; flex: none; }
.ui-thd__bar { position: relative; display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; }
.ui-thd__title { flex: 0 1 auto; min-width: 0; margin: 0; color: var(--tc-text-primary); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); }
.ui-thd__title-btn { display: flex; max-width: 100%; min-height: var(--tc-control-h-sm); align-items: center; padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-md); text-align: left; }
.ui-thd__title-btn:hover { background: var(--tc-fill-hover); }
.ui-thd__title-text { display: block; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-thd__title > .ui-thd__title-text { padding: 0 var(--tc-space-1-5); }
.ui-thd__input { width: 100%; min-width: 12ch; height: var(--tc-control-h-sm); padding: 0 var(--tc-space-1-5); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow-focus); color: var(--tc-text-primary); font: inherit; outline: 0; }
.ui-thd__chips { display: flex; flex: 0 1 auto; gap: var(--tc-space-1); min-width: 0; }
.ui-thd__chip { display: inline-flex; align-items: center; gap: var(--tc-space-1); max-width: var(--tc-thd-chip-max); height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2); border-radius: var(--tc-radius-full); background: var(--tc-fill-subtle); color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ui-thd__chip svg { color: var(--tc-icon-muted); }
.ui-thd__tools { display: flex; flex: none; align-items: center; gap: var(--tc-space-1); margin-left: auto; }
.ui-thd__toggles { display: flex; gap: var(--tc-space-0-5); }
.ui-thd__share { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2); border-radius: var(--tc-radius-md); color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
.ui-thd__share:hover, .ui-thd__toggle:hover, .ui-thd__more:hover, .ui-thd__more[aria-expanded="true"] { background: var(--tc-fill-hover); }
.ui-thd__toggle, .ui-thd__more { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-radius-md); color: var(--tc-icon-muted); }
.ui-thd__toggle[aria-pressed="true"] { background: var(--tc-fill-selected); color: var(--tc-accent-text); }
.ui-thd__menu { position: absolute; top: calc(100% + var(--tc-space-1)); right: 0; z-index: var(--tc-z-dropdown); display: grid; gap: var(--tc-space-0-5); width: var(--tc-thd-menu-w); padding: var(--tc-menu-padding); border-radius: var(--tc-menu-radius); background: var(--tc-menu-bg); box-shadow: var(--tc-menu-shadow); animation: ui-thd-drop var(--tc-duration-fast) var(--tc-ease-move) both; }
.ui-thd__menu-item { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3); width: 100%; height: var(--tc-menu-item-h); padding: 0 var(--tc-menu-item-px) !important; border-radius: var(--tc-menu-item-radius); font-size: var(--tc-menu-item-font-size); color: var(--tc-text-primary); text-align: left; }
.ui-thd__menu-item:hover, .ui-thd__menu-item:focus-visible { background: var(--tc-menu-item-hover); }
[data-ui="thd"] .ui-thd__menu-item:focus-visible { outline: none; }
.ui-thd__menu-item[data-danger] { color: var(--tc-status-danger-fg); }
.ui-thd__menu-item[data-danger]:hover, .ui-thd__menu-item[data-danger]:focus-visible { background: var(--tc-status-danger-bg); }
.ui-thd__check { color: var(--tc-menu-item-selected-fg); }
.ui-thd__sep { height: 1px; margin: var(--tc-space-0-5) var(--tc-space-1); background: var(--tc-divider); }
/* Wide: Share and the toggles are in the bar, so their menu copies hide */
.ui-thd__menu [data-narrow] { display: none; }
@container (max-width: 32rem) {
  .ui-thd__chips, .ui-thd__share, .ui-thd__toggles { display: none; }
  .ui-thd__menu [data-narrow] { display: flex; }
  .ui-thd__menu .ui-thd__sep[data-narrow] { display: block; }
}
@keyframes ui-thd-drop { from { opacity: 0; transform: translateY(-4px); } }
@media (prefers-reduced-motion: reduce) { .ui-thd__menu { animation: none; } }
@media (forced-colors: active) {
  .ui-thd__toggle[aria-pressed="true"] { outline: 2px solid Highlight; }
  .ui-thd__chip { border: 1px solid CanvasText; }
}
`;
}

if (!customElements.get("tc-thread-header")) customElements.define("tc-thread-header", TcThreadHeader);
declare global {
  interface HTMLElementTagNameMap {
    "tc-thread-header": TcThreadHeader;
  }
}
