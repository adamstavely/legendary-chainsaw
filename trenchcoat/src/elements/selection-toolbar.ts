import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { ToolbarController } from "./internal/controllers";
import { PopoverController, type PopoverCloseReason, type PopoverRect } from "./internal/popover";

/*
 * <tc-selection-toolbar> – the formatting bar that floats over selected text in an editor: quick actions, toggles
 * such as bold and italic that show whether they're on, menus for text style, colour and list type, and a link
 * button. It doesn't edit anything itself: every press fires tc-command for the page's editor to apply, and the page
 * tells the bar what's on (`pressed`) and which option each menu shows (`values`).
 *
 * Give it an `anchor` – the selection's rectangle (`selectionRect()`), or an element – and it floats above it (below
 * when there's no room), stays in view and follows scrolling; without one it sits in the page's flow. A mouse-down on
 * the bar doesn't take focus from the editor, so the selection stays. One tab stop: ← → Home End move along it; a
 * menu opens with Enter, Space or ↓ and closes with Escape back to its button. Escape on the bar closes it and puts
 * focus back in `editor`; so does a click outside the bar and the editor.
 * Standard: a white bar with a hairline, toggles pressed in gray. Clean: a softer bar, toggles pressed in the accent.
 *
 *   <tc-selection-toolbar open .anchor=${selectionRect()} .editor=${editorEl} .pressed=${["bold"]}></tc-selection-toolbar>
 */

export type SelectionToolbarOption = {
  value: string;
  label: string;
  /** SVG path data for a 24×24 stroked icon; the menu's button shows the chosen option's icon */
  icon?: string | string[];
  /** A CSS colour for a swatch, for a colour menu */
  color?: string;
};
type Base = {
  id: string;
  /** Names the control, and is its tooltip */
  label: string;
  /** SVG path data for a 24×24 stroked icon, or several paths */
  icon: string | string[];
  /** For aria-keyshortcuts, e.g. "Control+B Meta+B" – the editor handles the keys */
  keys?: string;
  /** A shortcut shown in the tooltip, e.g. "⌘B" */
  shortcut?: string;
  disabled?: boolean;
};
/** A button that acts once (comment, link); one that stays on or off (bold); a menu of options (colour); or a divider */
export type SelectionToolbarItem =
  | (Base & { type: "button" })
  | (Base & { type: "toggle" })
  | (Base & { type: "menu"; options: SelectionToolbarOption[] })
  | { type: "separator" };

/** Details of the events */
export type SelectionToolbarCommand = { id: string; value?: string | boolean };
export type SelectionToolbarPressedChange = { pressed: string[]; id: string };
export type SelectionToolbarValuesChange = { values: Record<string, string>; id: string; value: string };
export type SelectionToolbarClose = { reason: PopoverCloseReason };
export type SelectionToolbarLabels = { toolbar: string };

export const defaultSelectionToolbarLabels: SelectionToolbarLabels = { toolbar: "Format" };

/* Icons: Lucide (ISC, lucide.dev) */
const I = {
  ask: ["M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z", "M20 3v4", "M22 5h-4"],
  comment: "M7.9 20A9 9 0 1 0 4 16.1L2 22Z",
  emoji: ["M22 11v1a10 10 0 1 1-9-10", "M8 14s1.5 2 4 2 4-2 4-2", "M9 9h.01", "M15 9h.01", "M16 5h6", "M19 2v6"],
  style: ["M21 14h-5", "M16 16v-3.5a2.5 2.5 0 0 1 5 0V16", "M4.5 13h6", "m3 16 4.5-9 4.5 9"],
  bold: "M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8",
  italic: ["M19 4h-9", "M14 20H5", "M15 4 9 20"],
  underline: ["M6 4v6a6 6 0 0 0 12 0V4", "M4 20h16"],
  strike: ["M16 4H9a3 3 0 0 0-2.83 4", "M14 12a4 4 0 0 1 0 8H6", "M4 12h16"],
  code: ["M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1", "M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"],
  color: ["M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z", "M13.5 6.5h.01", "M17.5 10.5h.01", "M8.5 7.5h.01", "M6.5 12.5h.01"],
  bullets: ["M3 12h.01", "M3 18h.01", "M3 6h.01", "M8 12h13", "M8 18h13", "M8 6h13"],
  numbers: ["M10 12h11", "M10 18h11", "M10 6h11", "M4 10h2", "M4 6h1v4", "M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"],
  checks: ["m3 17 2 2 4-4", "m3 7 2 2 4-4", "M13 6h8", "M13 12h8", "M13 18h8"],
  link: ["M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71", "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"],
};
const CHEVRON = "m6 9 6 6 6-6";

/** The bar in the reference layout: ask, comment and react; text style; bold to code; colour; list type; link */
export const defaultSelectionToolbarItems: SelectionToolbarItem[] = [
  { type: "button", id: "ask", label: "Ask about this", icon: I.ask },
  { type: "button", id: "comment", label: "Comment", icon: I.comment, keys: "Control+Alt+M Meta+Alt+M" },
  { type: "button", id: "react", label: "Add a reaction", icon: I.emoji },
  { type: "separator" },
  {
    type: "menu",
    id: "style",
    label: "Text style",
    icon: I.style,
    options: [
      { value: "p", label: "Text" },
      { value: "h1", label: "Heading 1" },
      { value: "h2", label: "Heading 2" },
      { value: "h3", label: "Heading 3" },
      { value: "small", label: "Small" },
    ],
  },
  { type: "separator" },
  { type: "toggle", id: "bold", label: "Bold", icon: I.bold, keys: "Control+B Meta+B" },
  { type: "toggle", id: "italic", label: "Italic", icon: I.italic, keys: "Control+I Meta+I" },
  { type: "toggle", id: "underline", label: "Underline", icon: I.underline, keys: "Control+U Meta+U" },
  { type: "toggle", id: "strike", label: "Strikethrough", icon: I.strike, keys: "Control+Shift+X Meta+Shift+X" },
  { type: "toggle", id: "code", label: "Code", icon: I.code, keys: "Control+E Meta+E" },
  {
    type: "menu",
    id: "color",
    label: "Text colour",
    icon: I.color,
    options: [
      { value: "default", label: "Default", color: "var(--tc-text-primary)" },
      { value: "gray", label: "Gray", color: "var(--tc-text-muted)" },
      { value: "red", label: "Red", color: "var(--tc-status-danger-fg)" },
      { value: "orange", label: "Orange", color: "var(--tc-status-warning-fg)" },
      { value: "green", label: "Green", color: "var(--tc-status-success-fg)" },
      { value: "blue", label: "Blue", color: "var(--tc-accent-text)" },
      { value: "purple", label: "Purple", color: "var(--tc-chart-2)" },
    ],
  },
  { type: "separator" },
  {
    type: "menu",
    id: "list",
    label: "List",
    icon: I.bullets,
    options: [
      { value: "none", label: "No list", icon: ["M4 6h16", "M4 12h16", "M4 18h10"] },
      { value: "bullets", label: "Bulleted list", icon: I.bullets },
      { value: "numbers", label: "Numbered list", icon: I.numbers },
      { value: "checks", label: "Checklist", icon: I.checks },
    ],
  },
  { type: "separator" },
  { type: "button", id: "link", label: "Link", icon: I.link, keys: "Control+K Meta+K" },
];

/** The current selection's box in viewport pixels – an `anchor` for the bar – or null when nothing is selected */
export function selectionRect(doc: Document = document): PopoverRect | null {
  const s = doc.getSelection();
  if (!s || s.isCollapsed || !s.rangeCount) return null;
  const r = s.getRangeAt(0).getBoundingClientRect();
  return r.width || r.height ? { left: r.left, top: r.top, width: r.width, height: r.height } : null;
}

const glyph = (paths: string | string[], cls = "ui-stb__glyph") =>
  html`<svg class=${cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${(Array.isArray(paths) ? paths : [paths]).map((d) => svg`<path d=${d}/>`)}</svg>`;

let nextId = 0;

type Control = Exclude<SelectionToolbarItem, { type: "separator" }>;
type Menu = Extract<SelectionToolbarItem, { type: "menu" }>;

/**
 * A formatting bar that floats over selected text: actions, toggles that show their state, and option menus. It fires commands; the page's editor applies them.
 * @tag tc-selection-toolbar
 * @fires tc-command - A control was used: a button ({ id }), a toggle ({ id, value: on }) or a menu option ({ id, value }) (SelectionToolbarCommand)
 * @fires tc-pressed-change - A toggle was pressed ({ pressed, id }: SelectionToolbarPressedChange); cancelable – prevented, `pressed` stays as it was
 * @fires tc-values-change - A menu option was chosen ({ values, id, value }: SelectionToolbarValuesChange); cancelable – prevented, `values` stays as it was
 * @fires tc-close - The floating bar closed itself – Escape, or a click outside it and the editor ({ reason }: SelectionToolbarClose)
 */
export class TcSelectionToolbar extends TcElement {
  static override ui = "stb";
  private readonly uid = `tc-selection-toolbar-${++nextId}`;

  /** The controls, in order; `{ type: "separator" }` draws a divider */
  @property({ attribute: false }) accessor items: SelectionToolbarItem[] = defaultSelectionToolbarItems;
  /** The ids of the toggles that are on, for the text that's selected */
  @property({ attribute: false }) accessor pressed: string[] = [];
  /** Each menu's chosen option, by the menu's id; a menu without one shows its own icon */
  @property({ attribute: false }) accessor values: Record<string, string> = {};
  /** What it floats over: a rectangle in viewport pixels (`selectionRect()`) or an element. Without one it sits in the page's flow */
  @property({ attribute: false }) accessor anchor: PopoverRect | Element | null = null;
  /** Whether the floating bar shows; it sets itself false when it closes itself. No effect without an `anchor` */
  @property({ type: Boolean, reflect: true }) accessor open = false;
  /** The editor it formats: a click there doesn't close the bar, and Escape puts focus back in it */
  @property({ attribute: false }) accessor editor: HTMLElement | null = null;
  /** Words the page can change */
  @property({ attribute: false }) accessor labels: Partial<SelectionToolbarLabels> = {};

  /** The menu that's open, by id */
  @state() private accessor menu: string | null = null;

  private readonly pop = new PopoverController(this, {
    popover: () => (this.anchor ? this.querySelector<HTMLElement>(".ui-stb__bar") : null),
    anchor: () => this.anchor,
    kind: "toolbar",
    trigger: () => this.editor,
    returnFocus: () => this.editor,
    inside: () => [this.editor],
    onClose: (reason) => {
      this.menu = null;
      if (reason === "api") return;
      this.open = false;
      this.emit<SelectionToolbarClose>("tc-close", { reason });
    },
  });

  private readonly tools = new ToolbarController(this, { items: () => [...this.querySelectorAll<HTMLElement>(".ui-stb__bar > .ui-stb__slot > .ui-stb__tool")] });

  private get floating() {
    return this.anchor !== null;
  }

  private word<K extends keyof SelectionToolbarLabels>(key: K) {
    return this.labels[key] ?? defaultSelectionToolbarLabels[key];
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // A menu whose item is gone can't stay open
    if (this.menu !== null && !this.items.some((i) => i.type === "menu" && i.id === this.menu)) this.menu = null;
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (changed.has("menu")) {
      document.removeEventListener("pointerdown", this.outside, true);
      if (this.menu !== null) document.addEventListener("pointerdown", this.outside, true);
    }
    const want = this.floating && this.open;
    if (want && (!this.pop.open || changed.has("anchor"))) this.pop.show();
    else if (!want && this.pop.open) this.pop.close("api");
  }

  /** Moves focus to the bar's current control – for the editor's "go to toolbar" key (Alt + F10 is usual) */
  focusToolbar() {
    const items = [...this.querySelectorAll<HTMLElement>(".ui-stb__bar > .ui-stb__slot > .ui-stb__tool")];
    (items.find((el) => el.tabIndex === 0) ?? items[0])?.focus();
  }

  /* ---------- Acting ---------- */

  private command(id: string, value?: string | boolean) {
    this.emit<SelectionToolbarCommand>("tc-command", value === undefined ? { id } : { id, value });
  }

  private toggle(item: Control) {
    const on = !this.pressed.includes(item.id);
    const pressed = on ? [...this.pressed, item.id] : this.pressed.filter((id) => id !== item.id);
    if (this.emit<SelectionToolbarPressedChange>("tc-pressed-change", { pressed, id: item.id }, { cancelable: true })) this.pressed = pressed;
    this.command(item.id, on);
  }

  private choose(item: Menu, option: SelectionToolbarOption) {
    this.closeMenu(item.id);
    if (Object.hasOwn(this.values, item.id) && this.values[item.id] === option.value) return;
    const values = { ...this.values, [item.id]: option.value };
    if (this.emit<SelectionToolbarValuesChange>("tc-values-change", { values, id: item.id, value: option.value }, { cancelable: true })) this.values = values;
    this.command(item.id, option.value);
  }

  /* ---------- Menus ---------- */

  private trigger(id: string) {
    return this.querySelector<HTMLButtonElement>(`.ui-stb__tool[data-menu="${CSS.escape(id)}"]`);
  }

  private options() {
    return [...this.querySelectorAll<HTMLButtonElement>(".ui-stb__option")];
  }

  private openMenu(item: Menu, focus: "chosen" | "first" | "last" | null) {
    this.menu = item.id;
    if (!focus) return;
    void this.updateComplete.then(() => {
      const options = this.options();
      const chosen = options.find((o) => o.getAttribute("aria-checked") === "true");
      (focus === "chosen" ? (chosen ?? options[0]) : focus === "first" ? options[0] : options.at(-1))?.focus();
    });
  }

  private closeMenu(id: string, refocus = true) {
    const inside = !!document.activeElement?.closest(".ui-stb__menu");
    this.menu = null;
    if (refocus && inside) void this.updateComplete.then(() => this.trigger(id)?.focus());
  }

  private onTriggerKey(e: KeyboardEvent, item: Menu) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      this.openMenu(item, e.key === "ArrowDown" ? "chosen" : "last");
    }
  }

  private onMenuKey(e: KeyboardEvent, item: Menu) {
    const options = this.options();
    const at = options.indexOf(e.target as HTMLButtonElement);
    let next: number | undefined;
    if (e.key === "ArrowDown") next = (at + 1) % options.length;
    else if (e.key === "ArrowUp") next = (at - 1 + options.length) % options.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = options.length - 1;
    else if (e.key === "Escape") {
      // Closes the menu, not the bar: the popover leaves a prevented Escape alone
      e.preventDefault();
      e.stopPropagation();
      this.closeMenu(item.id);
      return;
    } else if (e.key === "Tab") {
      this.menu = null;
      return;
    } else return;
    e.preventDefault();
    e.stopPropagation();
    options[next]?.focus();
  }

  private onSlotFocusOut(e: FocusEvent, id: string) {
    const to = e.relatedTarget as Node | null;
    if (this.menu === id && to && !(e.currentTarget as Element).contains(to)) this.menu = null;
  }

  private outside = (e: Event) => {
    const slot = this.querySelector(".ui-stb__slot[data-open]");
    if (!slot || !e.composedPath().includes(slot)) this.menu = null;
  };

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("pointerdown", this.outside, true);
  }

  /* ---------- Rendering ---------- */

  private tip(item: Control) {
    return html`<span class="ui-stb__tip" aria-hidden="true">${item.label}${item.shortcut ? html` <span class="ui-stb__keys">${item.shortcut}</span>` : nothing}</span>`;
  }

  private control(item: Control) {
    if (item.type === "menu") return this.menuControl(item);
    const on = item.type === "toggle" && this.pressed.includes(item.id);
    return html`<span class="ui-stb__slot">
      <button
        type="button"
        class="ui-stb__tool"
        data-id=${item.id}
        data-type=${item.type}
        aria-label=${item.label}
        aria-pressed=${ifDefined(item.type === "toggle" ? (on ? "true" : "false") : undefined)}
        aria-keyshortcuts=${item.keys || nothing}
        ?disabled=${!!item.disabled}
        @click=${() => (item.type === "toggle" ? this.toggle(item) : this.command(item.id))}
      >${glyph(item.icon)}</button>
      ${this.tip(item)}
    </span>`;
  }

  private menuControl(item: Menu) {
    const open = this.menu === item.id;
    const value = Object.hasOwn(this.values, item.id) ? this.values[item.id] : undefined;
    const chosen = item.options.find((o) => o.value === value);
    const menuId = `${this.uid}-menu`;
    return html`<span class="ui-stb__slot" ?data-open=${open} @focusout=${(e: FocusEvent) => this.onSlotFocusOut(e, item.id)}>
      <button
        type="button"
        class="ui-stb__tool ui-stb__tool--menu"
        data-id=${item.id}
        data-menu=${item.id}
        data-type="menu"
        aria-label=${chosen ? `${item.label}: ${chosen.label}` : item.label}
        aria-haspopup="menu"
        aria-expanded=${open ? "true" : "false"}
        aria-controls=${open ? menuId : nothing}
        aria-keyshortcuts=${item.keys || nothing}
        ?disabled=${!!item.disabled}
        @click=${(e: MouseEvent) => (open ? this.closeMenu(item.id) : this.openMenu(item, e.detail === 0 ? "chosen" : null))}
        @keydown=${(e: KeyboardEvent) => this.onTriggerKey(e, item)}
      >
        ${chosen?.color
          ? html`<span class="ui-stb__swatch" style=${styleMap({ background: chosen.color })} aria-hidden="true"></span>`
          : glyph(chosen?.icon ?? item.icon)}
        ${glyph(CHEVRON, "ui-stb__chevron")}
      </button>
      ${open
        ? html`<div class="ui-stb__menu" id=${menuId} role="menu" aria-label=${item.label} @keydown=${(e: KeyboardEvent) => this.onMenuKey(e, item)}>
            ${item.options.map(
              (o) => html`<button
                type="button"
                class="ui-stb__option"
                role="menuitemradio"
                tabindex="-1"
                aria-checked=${o.value === value ? "true" : "false"}
                data-value=${o.value}
                @click=${() => this.choose(item, o)}
              >
                ${o.color ? html`<span class="ui-stb__swatch" style=${styleMap({ background: o.color })} aria-hidden="true"></span>` : o.icon ? glyph(o.icon) : nothing}
                <span class="ui-stb__option-label">${o.label}</span>
                ${o.value === value ? glyph("M20 6 9 17l-5-5", "ui-stb__check") : nothing}
              </button>`,
            )}
          </div>`
        : this.tip(item)}
    </span>`;
  }

  protected override render() {
    if (this.floating && !this.pop.open) return nothing;
    return html`<div
      class=${this.floating ? "tc-pop ui-stb__bar" : "ui-stb__bar"}
      role="toolbar"
      aria-label=${this.word("toolbar")}
      @mousedown=${(e: MouseEvent) => e.preventDefault()}
      @keydown=${(e: KeyboardEvent) => (e.target as Element).closest(".ui-stb__menu") ? undefined : this.tools.onKeyDown(e)}
      @focusin=${this.tools.onFocusIn}
    >
      ${this.items.map((item) => (item.type === "separator" ? html`<span class="ui-stb__sep" role="separator" aria-orientation="vertical"></span>` : this.control(item)))}
    </div>`;
  }

  static override css = /* css */ `
[data-ui="stb"] {
  --tc-stb-size: var(--tc-control-h-sm);
  --tc-stb-glyph: var(--tc-space-4);
  --tc-stb-swatch: var(--tc-space-3-5);
  --tc-stb-menu: calc(var(--tc-space-16) * 2.5);
  display: inline-block;
  max-width: 100%;
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
}

.ui-stb__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--tc-space-0-5);
  box-sizing: border-box;
  max-width: calc(100vw - var(--tc-space-4));
  padding: var(--tc-space-1);
  border-radius: var(--tc-menu-radius);
  background: var(--tc-menu-bg);
  box-shadow: var(--tc-menu-shadow);
  color: var(--tc-text-primary);
  font-family: var(--tc-font-sans);
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="stb"] .ui-stb__bar { box-shadow: var(--tc-menu-shadow), inset 0 0 0 1px var(--tc-border-subtle); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="stb"] .ui-stb__bar { padding: var(--tc-space-1-5); border-radius: var(--tc-radius-lg); }

.ui-stb__slot { position: relative; display: inline-flex; }
.ui-stb__tool {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  gap: var(--tc-space-0-5);
  min-width: var(--tc-stb-size);
  height: var(--tc-stb-size);
  margin: 0;
  padding: 0 var(--tc-space-1);
  border: 0;
  border-radius: var(--tc-control-radius-sm);
  background: none;
  color: var(--tc-text-secondary);
  font: inherit;
  cursor: pointer;
}
.ui-stb__tool:hover:not(:disabled) { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-stb__tool:disabled { color: var(--tc-text-disabled); cursor: not-allowed; }
.ui-stb__tool:focus-visible, .ui-stb__option:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(var(--tc-focus-ring-width) * -1); }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="stb"] .ui-stb__tool:is([aria-pressed="true"], [aria-expanded="true"]) { background: var(--tc-surface-well); color: var(--tc-text-primary); box-shadow: inset 0 0 0 1px var(--tc-border-default); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="stb"] .ui-stb__tool:is([aria-pressed="true"], [aria-expanded="true"]) { background: var(--tc-accent-subtle); color: var(--tc-accent-text); }
.ui-stb__glyph { width: var(--tc-stb-glyph); height: var(--tc-stb-glyph); flex: none; }
.ui-stb__chevron { width: var(--tc-space-3); height: var(--tc-space-3); flex: none; color: var(--tc-text-muted); }
.ui-stb__swatch { display: inline-block; flex: none; width: var(--tc-stb-swatch); height: var(--tc-stb-swatch); border-radius: var(--tc-radius-full); box-shadow: inset 0 0 0 1px var(--tc-border-default); }
.ui-stb__sep { align-self: stretch; width: 1px; margin: var(--tc-space-1) var(--tc-space-0-5); background: var(--tc-border-subtle); }

.ui-stb__tip {
  position: absolute;
  z-index: var(--tc-z-dropdown);
  bottom: calc(100% + var(--tc-space-1-5));
  left: 50%;
  translate: -50% 0;
  padding: var(--tc-space-0-5) var(--tc-space-1-5);
  border-radius: var(--tc-radius-sm);
  background: var(--tc-surface-inverse);
  color: var(--tc-text-on-inverse);
  font-size: var(--tc-font-size-xs);
  white-space: nowrap;
  pointer-events: none;
  visibility: hidden;
}
.tc-pop[data-side="bottom"] .ui-stb__tip { top: calc(100% + var(--tc-space-1-5)); bottom: auto; }
.ui-stb__tool:hover + .ui-stb__tip, .ui-stb__tool:focus-visible + .ui-stb__tip { visibility: visible; }

.ui-stb__menu {
  position: absolute;
  z-index: var(--tc-z-dropdown);
  top: calc(100% + var(--tc-space-1-5));
  inset-inline-start: 0;
  display: grid;
  min-width: var(--tc-stb-menu);
  padding: var(--tc-menu-padding);
  border-radius: var(--tc-menu-radius);
  background: var(--tc-menu-bg);
  box-shadow: var(--tc-menu-shadow);
}
.tc-pop[data-side="bottom"] .ui-stb__menu { top: calc(100% + var(--tc-space-1-5)); }
.ui-stb__option {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2);
  min-height: var(--tc-menu-item-h);
  margin: 0;
  padding: 0 var(--tc-menu-item-px);
  border: 0;
  border-radius: var(--tc-menu-item-radius);
  background: none;
  color: inherit;
  font: inherit;
  font-size: var(--tc-menu-item-font-size);
  text-align: start;
  white-space: nowrap;
  cursor: pointer;
}
.ui-stb__option:hover { background: var(--tc-menu-item-hover); }
.ui-stb__option[aria-checked="true"] { color: var(--tc-menu-item-selected-fg); }
.ui-stb__option-label { flex: 1; }
.ui-stb__check { width: var(--tc-space-4); height: var(--tc-space-4); flex: none; }

@media (forced-colors: active) {
  .ui-stb__tool[aria-pressed="true"] { outline: 2px solid Highlight; }
  .ui-stb__bar, .ui-stb__menu, .ui-stb__tip { outline: 1px solid CanvasText; }
  .ui-stb__swatch { forced-color-adjust: none; }
}
`;
}

if (!customElements.get("tc-selection-toolbar")) customElements.define("tc-selection-toolbar", TcSelectionToolbar);

declare global {
  interface HTMLElementTagNameMap {
    "tc-selection-toolbar": TcSelectionToolbar;
  }
}
