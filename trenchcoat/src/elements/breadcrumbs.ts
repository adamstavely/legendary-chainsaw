import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { TcElement } from "./internal/base";
import { safeUrl } from "./internal/safe-url";
import { copyText } from "./internal/util";

/*
 * <tc-breadcrumbs> – where you are in a hierarchy, as a trail of links from the top down to the current page. The
 * current page is the last item and isn't a link. When the trail doesn't fit its width (or is longer than `max`), the
 * middle folds into "…": a button that opens a list of the folded items. The first item and as many of the last as fit
 * stay. Long labels are cut with an ellipsis and show in full on hover. Items with `href` are links; items without one
 * are buttons – every click fires a cancelable `tc-navigate` ({ item, index }), so a single-page app can route it
 * itself. `copy-path` adds a button that copies the trail as text.
 * Both looks are plain navigation, not a card: Standard draws chevrons in the secondary text colour, Clean is a
 * shade lighter and tighter, the current page in medium weight.
 *
 *   <tc-breadcrumbs .items=${[{ label: "Library", href: "/" }, { label: "Archives", href: "/archives" }, { label: "Maps" }]}></tc-breadcrumbs>
 */

export type BreadcrumbIcon = "home" | "folder" | "file";
export type BreadcrumbItem = {
  label: string;
  /** A link; without one the item is a button that fires tc-navigate */
  href?: string;
  /** Your own key for the item, handed back in tc-navigate */
  id?: string;
  /** A small icon before the label */
  icon?: BreadcrumbIcon;
};
export type BreadcrumbNavigate = { item: BreadcrumbItem; index: number };
export type BreadcrumbCopy = { text: string };

/* home, folder, file, chevron-right, copy, check: Lucide (ISC, lucide.dev) */
const paths: Record<BreadcrumbIcon | "chevron" | "copy" | "check" | "more", string> = {
  home: "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  folder: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z",
  file: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7ZM14 2v4a2 2 0 0 0 2 2h4",
  chevron: "m9 18 6-6-6-6",
  copy: "M8 8h12v12H8zM4 16V4h12",
  check: "M20 6 9 17l-5-5",
  more: "M5 12h.01M12 12h.01M19 12h.01",
};
const glyph = (d: string, cls = "") => html`<svg viewBox="0 0 24 24" class=${`ui-crumb__glyph ${cls}`.trim()} aria-hidden="true">${svg`<path d=${d}></path>`}</svg>`;

/** Which items show: the first, then "…" for `hidden`, then the rest. `tail` is how many of the last fit */
export function breadcrumbLayout(count: number, tail: number, max?: number) {
  let keep = tail;
  if (max !== undefined && max >= 2) keep = Math.min(keep, max - 1);
  if (count <= 2 || keep >= count - 1) return { hidden: [] as number[], shown: [...Array(count).keys()] };
  keep = Math.max(1, keep);
  const hidden = [...Array(count - 1 - keep).keys()].map((i) => i + 1);
  return { hidden, shown: [0, ...[...Array(keep).keys()].map((i) => count - keep + i)] };
}

let instances = 0;

/**
 * A trail of links to the current page that folds its middle into "…" when it doesn't fit.
 * @tag tc-breadcrumbs
 * @fires tc-navigate - An item was clicked ({ item, index }: BreadcrumbNavigate); cancelable – prevented, a link isn't followed
 * @fires tc-copy - Copy path was pressed ({ text }: BreadcrumbCopy); cancelable – prevented, nothing is copied
 */
export class TcBreadcrumbs extends TcElement {
  static override ui = "crumb";

  /** The trail, from the top down; the last item is the current page */
  @property({ attribute: false }) accessor items: BreadcrumbItem[] = [];
  /** Between items: a chevron or a slash */
  @property() accessor separator: "chevron" | "slash" = "chevron";
  /** Show at most this many items (the first, "…" and the last ones), even when more would fit */
  @property({ type: Number }) accessor max: number | undefined = undefined;
  /** Adds a button that copies the trail as text */
  @property({ type: Boolean, attribute: "copy-path" }) accessor copyPath = false;
  /** What the copied trail is joined with */
  @property({ attribute: "path-separator" }) accessor pathSeparator = " / ";
  /** The navigation landmark's name */
  @property() accessor label = "Breadcrumb";

  @state() private accessor tail = Infinity;
  @state() private accessor menuOpen = false;
  @state() private accessor copied = false;
  @state() private accessor announce = "";

  private readonly uid = `tc-crumb${++instances}`;
  private ro?: ResizeObserver;
  private copiedTimer = 0;
  private focusMenu = false;
  private onDocDown = (e: PointerEvent) => {
    if (!this.querySelector(".ui-crumb__more-item")?.contains(e.target as Node)) this.menuOpen = false;
  };

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener("focusout", this.onFocusOut);
  }
  override disconnectedCallback() {
    super.disconnectedCallback();
    this.ro?.disconnect();
    this.ro = undefined;
    clearTimeout(this.copiedTimer);
    document.removeEventListener("pointerdown", this.onDocDown);
    this.removeEventListener("focusout", this.onFocusOut);
  }

  private onFocusOut = (e: FocusEvent) => {
    const more = this.querySelector(".ui-crumb__more-item");
    if (this.menuOpen && more && !more.contains(e.relatedTarget as Node | null)) this.menuOpen = false;
  };

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("menuOpen")) {
      if (this.menuOpen) document.addEventListener("pointerdown", this.onDocDown);
      else document.removeEventListener("pointerdown", this.onDocDown);
    }
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    const nav = this.querySelector<HTMLElement>(".ui-crumb__nav");
    if (nav && !this.ro && typeof ResizeObserver === "function") {
      this.ro = new ResizeObserver(() => this.measure());
      this.ro.observe(nav);
    }
    if (changed.has("items") || changed.has("separator") || changed.has("copyPath") || changed.has("look")) this.measure();
    if (this.focusMenu && this.menuOpen) {
      this.focusMenu = false;
      this.querySelector<HTMLElement>(".ui-crumb__menu .ui-crumb__menu-link")?.focus();
    }
  }

  /** How many of the last items fit beside the first and "…" – read from a hidden copy of the whole trail */
  private measure() {
    const nav = this.querySelector<HTMLElement>(".ui-crumb__nav");
    const copy = this.querySelector<HTMLElement>(".ui-crumb__copy");
    const sample = this.querySelector<HTMLElement>(".ui-crumb__measure");
    if (!nav || !sample) return;
    const widths = [...sample.children].map((el) => el.getBoundingClientRect().width + (parseFloat(getComputedStyle(el).marginRight) || 0));
    const ellipsis = widths.pop() ?? 0;
    const room = nav.clientWidth - (copy ? copy.getBoundingClientRect().width : 0) - 1;
    let tail = Infinity;
    if (widths.reduce((a, b) => a + b, 0) > room && widths.length > 2) {
      let used = widths[0] + ellipsis;
      tail = 0;
      for (let i = widths.length - 1; i >= 1; i--) {
        if (tail && used + widths[i] > room) break;
        used += widths[i];
        tail++;
      }
      if (tail >= widths.length - 1) tail = Infinity;
    }
    if (tail !== this.tail) this.tail = tail;
  }

  private navigate(e: Event, index: number) {
    const item = this.items[index];
    if (!item) return;
    this.menuOpen = false;
    if (!this.emit<BreadcrumbNavigate>("tc-navigate", { item, index }, { cancelable: true })) e.preventDefault();
  }

  private async copyTrail() {
    const text = this.items.map((i) => i.label).join(this.pathSeparator);
    if (!this.emit<BreadcrumbCopy>("tc-copy", { text }, { cancelable: true })) return;
    if (!(await copyText(text))) return;
    this.copied = true;
    this.announce = "Path copied";
    clearTimeout(this.copiedTimer);
    this.copiedTimer = window.setTimeout(() => (this.copied = false), 1600);
  }

  private toggleMenu(byKey: boolean) {
    this.menuOpen = !this.menuOpen;
    this.focusMenu = this.menuOpen && byKey;
  }

  private onMenuKey = (e: KeyboardEvent) => {
    const links = [...this.querySelectorAll<HTMLElement>(".ui-crumb__menu .ui-crumb__menu-link")];
    const at = links.indexOf(document.activeElement as HTMLElement);
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      this.menuOpen = false;
      this.querySelector<HTMLElement>(".ui-crumb__more")?.focus();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      links[(at + (e.key === "ArrowDown" ? 1 : -1) + links.length) % links.length]?.focus();
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      links[e.key === "Home" ? 0 : links.length - 1]?.focus();
    }
  };

  private icon(item: BreadcrumbItem) {
    return item.icon && paths[item.icon] ? glyph(paths[item.icon], "ui-crumb__icon") : nothing;
  }

  /** One item as a link, a button or (the last) the current page */
  private link(item: BreadcrumbItem, index: number, current: boolean, cls: string): TemplateResult {
    const body = html`${this.icon(item)}<span class="ui-crumb__text" title=${item.label}>${item.label}</span>`;
    if (current) return html`<span class=${`${cls} ui-crumb__current`} aria-current="page">${body}</span>`;
    const href = item.href ? safeUrl(item.href) : undefined;
    if (href) return html`<a class=${cls} href=${href} @click=${(e: Event) => this.navigate(e, index)}>${body}</a>`;
    return html`<button type="button" class=${cls} @click=${(e: Event) => this.navigate(e, index)}>${body}</button>`;
  }

  private sep() {
    return html`<span class="ui-crumb__sep" aria-hidden="true">${this.separator === "slash" ? "/" : glyph(paths.chevron)}</span>`;
  }

  protected override render() {
    const items = this.items;
    const last = items.length - 1;
    const { hidden, shown } = breadcrumbLayout(items.length, this.tail, this.max);
    const menuId = `${this.uid}-menu`;
    return html`
      <nav class="ui-crumb__nav" aria-label=${this.label}>
        <ol class="ui-crumb__list">
          ${shown.map(
            (i, k) => html`
              ${k === 1 && hidden.length
                ? html`<li class="ui-crumb__item ui-crumb__more-item">
                    <button
                      type="button"
                      class="ui-crumb__link ui-crumb__more"
                      aria-expanded=${this.menuOpen ? "true" : "false"}
                      aria-controls=${ifDefined(this.menuOpen ? menuId : undefined)}
                      @click=${(e: MouseEvent) => this.toggleMenu(e.detail === 0)}
                      @keydown=${(e: KeyboardEvent) => {
                        if (e.key === "ArrowDown" && !this.menuOpen) {
                          e.preventDefault();
                          this.toggleMenu(true);
                        }
                      }}
                    >
                      ${glyph(paths.more)}<span class="tc-sr-only">Show ${hidden.length} more</span>
                    </button>
                    ${this.menuOpen
                      ? html`<ul class="ui-crumb__menu" id=${menuId} @keydown=${this.onMenuKey}>
                          ${hidden.map((h) => html`<li>${this.link(items[h], h, false, "ui-crumb__menu-link")}</li>`)}
                        </ul>`
                      : nothing}
                    ${this.sep()}
                  </li>`
                : nothing}
              <li class="ui-crumb__item" data-index=${i}>${this.link(items[i], i, i === last, "ui-crumb__link")}${i === last ? nothing : this.sep()}</li>
            `,
          )}
        </ol>
        ${this.copyPath && items.length
          ? html`<button type="button" class="ui-crumb__copy" @click=${() => this.copyTrail()}>
              ${glyph(this.copied ? paths.check : paths.copy)}<span class="ui-crumb__copy-label">${this.copied ? "Copied" : "Copy path"}</span>
            </button>`
          : nothing}
      </nav>
      <ol class="ui-crumb__measure" aria-hidden="true">
        ${items.map(
          (item, i) =>
            html`<li class="ui-crumb__item"><span class=${`ui-crumb__link${i === last ? " ui-crumb__current" : ""}`}>${this.icon(item)}<span class="ui-crumb__text">${item.label}</span></span>${i === last ? nothing : this.sep()}</li>`,
        )}
        <li class="ui-crumb__item"><span class="ui-crumb__link ui-crumb__more">${glyph(paths.more)}</span>${this.sep()}</li>
      </ol>
      <span class="tc-sr-only" role="status">${this.announce}</span>
    `;
  }

  static override css = /* css */ `
[data-ui="crumb"] {
  position: relative;
  display: block;
  min-width: 0;
  container-type: inline-size;
  /* The longest a label gets before it's cut */
  --tc-crumb-label-max: 220px;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-tight);
  -webkit-font-smoothing: antialiased;
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="crumb"] { --tc-crumb-gap: var(--tc-space-1); color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="crumb"] { --tc-crumb-gap: var(--tc-space-0-5); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
[data-ui="crumb"] *, [data-ui="crumb"] *::before, [data-ui="crumb"] *::after { box-sizing: border-box; }
:where([data-ui="crumb"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
:where([data-ui="crumb"]) svg { display: block; flex: none; }
.ui-crumb__glyph { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ui-crumb__nav { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; }
.ui-crumb__list { display: flex; flex: 1; align-items: center; min-width: 0; margin: 0; padding: 0; list-style: none; white-space: nowrap; }
.ui-crumb__item { position: relative; display: flex; flex: 0 1 auto; align-items: center; gap: var(--tc-crumb-gap); min-width: 0; margin-right: var(--tc-crumb-gap); }
.ui-crumb__item:first-child, .ui-crumb__item:last-child { flex-shrink: 0; }
.ui-crumb__item:last-child { flex-shrink: 1; margin-right: 0; }
/* Each link: a 24px target with a hover fill, the text cut when it's long */
.ui-crumb__link {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1);
  min-width: 0;
  min-height: 24px;
  padding: 0 var(--tc-space-1);
  border-radius: var(--tc-radius-sm);
  color: inherit;
  text-decoration: none;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
a.ui-crumb__link:hover, button.ui-crumb__link:hover { background: var(--tc-fill-default); color: var(--tc-text-primary); }
.ui-crumb__link:focus-visible, .ui-crumb__menu-link:focus-visible, .ui-crumb__copy:focus-visible { outline: var(--tc-focus-ring-width) solid var(--tc-focus-ring); outline-offset: 1px; }
.ui-crumb__text { min-width: 0; max-width: var(--tc-crumb-label-max); overflow: hidden; text-overflow: ellipsis; }
.ui-crumb__current { color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-crumb__current { font-weight: var(--tc-font-weight-medium); }
.ui-crumb__icon { color: var(--tc-icon-muted); }
.ui-crumb__sep { display: grid; place-items: center; flex: none; color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-crumb__sep { color: var(--tc-text-disabled); }
.ui-crumb__sep .ui-crumb__glyph { width: 12px; height: 12px; }
.ui-crumb__more { min-width: 24px; justify-content: center; }
.ui-crumb__more[aria-expanded="true"] { background: var(--tc-fill-default); color: var(--tc-text-primary); }
/* The folded items: a small menu card under "…" */
.ui-crumb__menu {
  position: absolute;
  z-index: var(--tc-z-dropdown);
  top: calc(100% + var(--tc-space-1));
  left: 0;
  min-width: 180px;
  max-width: 320px;
  margin: 0;
  padding: var(--tc-menu-padding);
  border-radius: var(--tc-menu-radius);
  background: var(--tc-menu-bg);
  box-shadow: var(--tc-menu-shadow);
  list-style: none;
  animation: ui-crumb-open var(--tc-duration-moderate) var(--tc-ease-move) both;
}
.ui-crumb__menu-link {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2);
  width: 100%;
  min-height: var(--tc-menu-item-h);
  padding: 0 var(--tc-menu-item-px);
  border-radius: var(--tc-menu-item-radius);
  color: var(--tc-text-primary);
  font-size: var(--tc-menu-item-font-size);
  text-align: left;
  text-decoration: none;
}
.ui-crumb__menu-link:hover { background: var(--tc-menu-item-hover); }
.ui-crumb__menu-link .ui-crumb__text { max-width: none; }
.ui-crumb__copy { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1); min-height: 24px; padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-sm); color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-crumb__copy:hover { background: var(--tc-fill-default); color: var(--tc-text-primary); }
/* A hidden copy of the whole trail, measured to decide what folds */
.ui-crumb__measure { position: absolute; top: 0; left: 0; display: flex; width: max-content; margin: 0; padding: 0; list-style: none; white-space: nowrap; visibility: hidden; pointer-events: none; }
@keyframes ui-crumb-open { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
@container (max-width: 380px) {
  .ui-crumb__copy-label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
}
@media (forced-colors: active) {
  .ui-crumb__current { text-decoration: underline; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="crumb"] *, [data-ui="crumb"] *::before, [data-ui="crumb"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-breadcrumbs")) customElements.define("tc-breadcrumbs", TcBreadcrumbs);

declare global {
  interface HTMLElementTagNameMap {
    "tc-breadcrumbs": TcBreadcrumbs;
  }
}
