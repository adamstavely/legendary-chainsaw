import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";

/*
 * <tc-icon-rail> – a row of icon buttons at the top of a panel, one of them chosen, with a tooltip for each and an
 * optional More menu at the end. One tab stop: arrows, Home and End move along it. It wraps when narrow, and the buttons
 * keep their size.
 * Standard: a white card on a gray tray. Clean: one white card.
 *
 *   <tc-icon-rail label="Panel views" .items=${[{ id: "notes", label: "Notes", icon: "M4 6h16M4 12h16" }]} selected="notes"></tc-icon-rail>
 */

export type IconRailItem = {
  id: string;
  /** Names the button, and is its tooltip */
  label: string;
  /** SVG path data for a 24×24 stroked icon, or several paths */
  icon: string | string[];
  disabled?: boolean;
};
export type IconRailMoreItem = { id: string; label: string };
export type IconRailSelectedChange = { selected: string | null; item?: IconRailItem };
export type IconRailAction = { id: string };

const glyph = (paths: string | string[]) =>
  html`<svg class="ui-irl__glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${(Array.isArray(paths) ? paths : [paths]).map((d) => svg`<path d=${d}/>`)}</svg>`;
// Lucide ellipsis (ISC licence)
const MORE = ["M12 12h.01", "M19 12h.01", "M5 12h.01"];

/**
 * A row of icon buttons for a panel: one chosen, each with a tooltip, and an optional More menu.
 * @tag tc-icon-rail
 * @fires tc-selected-change - A button was chosen or let go ({ selected, item }: IconRailSelectedChange); cancelable – prevented, `selected` stays as it was
 * @fires tc-action - A More menu item was chosen ({ id }: IconRailAction)
 */
export class TcIconRail extends TcElement {
  static override ui = "irl";

  /** Names the toolbar */
  @property() accessor label = "";
  /** The buttons */
  @property({ attribute: false }) accessor items: IconRailItem[] = [];
  /** The chosen button's id, or null for none */
  @property() accessor selected: string | null = null;
  /** The items of a final More menu; without them there's no More button */
  @property({ attribute: false }) accessor moreItems: IconRailMoreItem[] = [];
  /** Names the More button */
  @property({ attribute: "more-label" }) accessor moreLabel = "More";
  /** Drops the tray and shadow, for a rail that sits in something else's surface */
  @property({ type: Boolean, reflect: true }) accessor bare = false;

  @state() private accessor menuOpen = false;
  @state() private accessor active: string | null = null;

  private outside = (e: Event) => {
    if (!e.composedPath().includes(this)) this.menuOpen = false;
  };

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("pointerdown", this.outside);
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (changed.has("menuOpen")) {
      document.removeEventListener("pointerdown", this.outside);
      if (this.menuOpen) document.addEventListener("pointerdown", this.outside);
    }
  }

  private get stops() {
    const ids = this.items.filter((i) => !i.disabled).map((i) => i.id);
    return this.moreItems.length ? [...ids, MORE_ID] : ids;
  }

  /** The one button in the tab order: the last one used, else the chosen one, else the first */
  private get current() {
    const stops = this.stops;
    if (this.active !== null && stops.includes(this.active)) return this.active;
    if (this.selected !== null && stops.includes(this.selected)) return this.selected;
    return stops[0];
  }

  private button(id: string) {
    return [...this.querySelectorAll<HTMLButtonElement>(".ui-irl__button")].find((b) => b.dataset.id === id);
  }

  private choose(item: IconRailItem) {
    this.active = item.id;
    const selected = this.selected === item.id ? null : item.id;
    const detail: IconRailSelectedChange = selected === null ? { selected } : { selected, item };
    if (this.emit<IconRailSelectedChange>("tc-selected-change", detail, { cancelable: true })) this.selected = selected;
  }

  private onRailKey(e: KeyboardEvent) {
    if ((e.target as Element).closest(".ui-irl__menu")) return;
    const stops = this.stops;
    const at = stops.indexOf(this.current);
    const rtl = getComputedStyle(this).direction === "rtl";
    const step = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }[e.key];
    let next: string | undefined;
    if (step) next = stops[(at + step + stops.length) % stops.length];
    else if (e.key === "Home") next = stops[0];
    else if (e.key === "End") next = stops[stops.length - 1];
    if (next === undefined) return;
    e.preventDefault();
    this.menuOpen = false;
    this.active = next;
    void this.updateComplete.then(() => this.button(next)?.focus());
  }

  private menuItems() {
    return [...this.querySelectorAll<HTMLButtonElement>(".ui-irl__item")];
  }

  private toggleMenu(open = !this.menuOpen, focus: "first" | "last" | null = null) {
    this.active = MORE_ID;
    this.menuOpen = open;
    if (open && focus) void this.updateComplete.then(() => this.menuItems().at(focus === "first" ? 0 : -1)?.focus());
  }

  private onMoreKey(e: KeyboardEvent) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    this.toggleMenu(true, e.key === "ArrowDown" ? "first" : "last");
  }

  private closeToButton() {
    this.menuOpen = false;
    void this.updateComplete.then(() => this.button(MORE_ID)?.focus());
  }

  private onMenuKey(e: KeyboardEvent) {
    const items = this.menuItems();
    const at = items.indexOf(e.target as HTMLButtonElement);
    let next: number | undefined;
    if (e.key === "ArrowDown") next = (at + 1) % items.length;
    else if (e.key === "ArrowUp") next = (at - 1 + items.length) % items.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    else if (e.key === "Escape" || e.key === "Tab") {
      if (e.key === "Escape") e.preventDefault();
      e.stopPropagation();
      this.closeToButton();
      return;
    } else return;
    e.preventDefault();
    e.stopPropagation();
    items[next]?.focus();
  }

  private pick(item: IconRailMoreItem) {
    this.closeToButton();
    this.emit<IconRailAction>("tc-action", { id: item.id });
  }

  protected override render() {
    const current = this.current;
    return html`<div class="ui-irl__rail" role="toolbar" aria-label=${this.label || nothing} @keydown=${this.onRailKey}>
      ${this.items.map(
        (item) => html`<span class="ui-irl__slot">
          <button
            type="button"
            class="ui-irl__button"
            data-id=${item.id}
            aria-label=${item.label}
            aria-pressed=${this.selected === item.id ? "true" : "false"}
            tabindex=${item.id === current ? 0 : -1}
            ?disabled=${!!item.disabled}
            @click=${() => this.choose(item)}
          >${glyph(item.icon)}</button>
          <span class="ui-irl__tip" aria-hidden="true">${item.label}</span>
        </span>`,
      )}
      ${this.moreItems.length
        ? html`<span class="ui-irl__slot">
            <button
              type="button"
              class="ui-irl__button"
              data-id=${MORE_ID}
              aria-label=${this.moreLabel}
              aria-haspopup="menu"
              aria-expanded=${this.menuOpen ? "true" : "false"}
              tabindex=${current === MORE_ID ? 0 : -1}
              @click=${() => this.toggleMenu()}
              @keydown=${this.onMoreKey}
            >${glyph(MORE)}</button>
            ${this.menuOpen
              ? html`<div class="ui-irl__menu" role="menu" aria-label=${this.moreLabel} @keydown=${this.onMenuKey}>
                  ${this.moreItems.map((item) => html`<button type="button" class="ui-irl__item" role="menuitem" tabindex="-1" @click=${() => this.pick(item)}>${item.label}</button>`)}
                </div>`
              : html`<span class="ui-irl__tip" aria-hidden="true">${this.moreLabel}</span>`}
          </span>`
        : nothing}
    </div>`;
  }

  static override css = /* css */ `
[data-ui="irl"] {
  --tc-irl-size: var(--tc-control-h-sm);
  --tc-irl-glyph: var(--tc-space-4);
  --tc-irl-menu: var(--tc-space-16);
  box-sizing: border-box;
  width: 100%;
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="irl"] { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="irl"] .ui-irl__rail { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="irl"] .ui-irl__rail { border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
[data-ui="irl"][bare] { padding: 0; border-radius: 0; background: none; }
[data-ui="irl"][bare] .ui-irl__rail { padding: 0; background: none; box-shadow: none; }

.ui-irl__rail { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); padding: var(--tc-space-1); }
.ui-irl__slot { position: relative; display: inline-flex; }
.ui-irl__button {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: var(--tc-irl-size);
  height: var(--tc-irl-size);
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: var(--tc-control-radius-sm);
  background: none;
  color: var(--tc-text-muted);
  cursor: pointer;
}
.ui-irl__button:hover:not(:disabled) { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-irl__button[aria-pressed="true"], .ui-irl__button[aria-expanded="true"] { background: var(--tc-surface-well); color: var(--tc-text-primary); box-shadow: inset 0 0 0 1px var(--tc-border-default); }
.ui-irl__button:disabled { color: var(--tc-text-disabled); cursor: not-allowed; }
.ui-irl__button:focus-visible, .ui-irl__item:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(var(--tc-focus-ring-width) * -1); }
.ui-irl__glyph { width: var(--tc-irl-glyph); height: var(--tc-irl-glyph); }

.ui-irl__tip {
  position: absolute;
  z-index: var(--tc-z-dropdown);
  top: calc(100% + var(--tc-space-1));
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
.ui-irl__button:hover + .ui-irl__tip, .ui-irl__button:focus-visible + .ui-irl__tip { visibility: visible; }

.ui-irl__menu {
  position: absolute;
  z-index: var(--tc-z-dropdown);
  top: calc(100% + var(--tc-space-1));
  inset-inline-end: 0;
  display: grid;
  min-width: var(--tc-irl-menu);
  padding: var(--tc-space-1);
  border-radius: var(--tc-radius-md);
  background: var(--tc-surface-overlay);
  box-shadow: var(--tc-shadow-overlay);
}
.ui-irl__item { min-height: var(--tc-control-h-sm); margin: 0; padding: 0 var(--tc-space-2); border: 0; border-radius: var(--tc-control-radius-sm); background: none; font: inherit; color: inherit; text-align: start; white-space: nowrap; cursor: pointer; }
.ui-irl__item:hover { background: var(--tc-action-ghost-bg-hover); }

@media (forced-colors: active) {
  .ui-irl__button[aria-pressed="true"] { outline: 2px solid Highlight; }
  .ui-irl__menu, .ui-irl__tip { outline: 1px solid CanvasText; }
}
`;
}

const MORE_ID = "\u0000more";

if (!customElements.get("tc-icon-rail")) customElements.define("tc-icon-rail", TcIconRail);

declare global {
  interface HTMLElementTagNameMap {
    "tc-icon-rail": TcIconRail;
  }
}
