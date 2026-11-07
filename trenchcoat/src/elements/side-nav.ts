import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { TcElement } from "./internal/base";
import { safeUrl } from "./internal/safe-url";

/*
 * <tc-side-nav> – an app's main navigation down the side of the page: the product's brand at the top, then the
 * places in the app, one of them the current page, and room at the bottom for a card of the page's own (a reminder,
 * an upgrade, a setup guide). Items with `href` are real links – a middle-click or ⌘/Ctrl-click opens a new tab as
 * the browser would – and every plain click fires a cancelable `tc-navigate` ({ id, href, item }), so a single-page
 * app's router can take it instead. Unless it's prevented, the clicked item becomes `current`. A linked brand
 * (`brand-href`) fires it too, with { id: "brand", brand: true }, and leaves `current` alone. Items can carry an
 * icon, a badge or count, and a section caption; disabled ones stay in place, dimmed.
 * `collapsible` adds a button that folds the bar into an icon-only rail (`collapsed`, changed through the cancelable
 * tc-collapsed-change); in the rail each label is still the item's name, shown as a tooltip.
 * The element renders its own parts first, so reading and Tab order is brand, items, then the page's children, which
 * sit at the bottom. Arrow keys also move between items; Home and End go to the first and last.
 * Standard: a gray bar like the page behind a white panel, the current item on a white pill. Clean: a white bar with
 * a hairline edge, the current item tinted.
 *
 *   <tc-side-nav brand="Intellect" current="portfolio" .items=${[{ id: "portfolio", label: "Portfolio", href: "/portfolio" }]}>
 *     <div class="promo">Portfolio review in 6 days <tc-button>Prep brief</tc-button></div>
 *   </tc-side-nav>
 */

export type SideNavItem = {
  /** Your key for the item: `current` names it, tc-navigate hands it back */
  id: string;
  /** Its name, shown beside the icon */
  label: string;
  /** An icon of your own (an SVG element), cloned before the label */
  icon?: Element;
  /** A link; without one the item is a button that only fires tc-navigate */
  href?: string;
  /** A count or short word after the label: 12, "New" */
  badge?: string | number;
  /** Shown dimmed; it can't be chosen */
  disabled?: boolean;
  /** A caption over a group of items; consecutive items with the same section share it */
  section?: string;
};
/** The id tc-navigate carries for a click on the brand */
export const SIDE_NAV_BRAND_ID = "brand";
export type SideNavNavigate = {
  /** The item's id, or SIDE_NAV_BRAND_ID ("brand") for the brand */
  id: string;
  href?: string;
  /** The item; for the brand, one made from it ({ id: "brand", label: brand, href }) */
  item: SideNavItem;
  /** True when the brand was clicked rather than an item */
  brand?: boolean;
};
export type SideNavCollapsedChange = { collapsed: boolean };

export type SideNavLabels = { collapse: string; expand: string };
export const defaultSideNavLabels: SideNavLabels = { collapse: "Collapse navigation", expand: "Expand navigation" };

/* panel-left: Lucide (ISC, lucide.dev) */
const PANEL = ["M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M9 3v18"];

/** Items in groups: a new group starts wherever the section changes */
export function sideNavGroups(items: SideNavItem[]) {
  const groups: { section?: string; items: { item: SideNavItem; index: number }[] }[] = [];
  items.forEach((item, index) => {
    const last = groups[groups.length - 1];
    if (last && last.section === item.section) last.items.push({ item, index });
    else groups.push({ section: item.section, items: [{ item, index }] });
  });
  return groups;
}

let instances = 0;

/**
 * An app's main navigation down the side: brand, places with icons and badges, the current page, a footer of your own.
 * @tag tc-side-nav
 * @fires tc-navigate - An item or the linked brand was clicked ({ id, href, item, brand }: SideNavNavigate); cancelable – prevented, a link isn't followed and `current` stays
 * @fires tc-collapsed-change - The collapse button was pressed ({ collapsed }: SideNavCollapsedChange); cancelable – prevented, `collapsed` stays
 */
export class TcSideNav extends TcElement {
  static override ui = "snav";

  /** The places, top to bottom */
  @property({ attribute: false }) accessor items: SideNavItem[] = [];
  /** The id of the current page's item – it gets aria-current="page" */
  @property() accessor current: string | null = null;
  /** The product's name at the top */
  @property() accessor brand = "";
  /** Where the brand links to; without it the brand is plain text */
  @property({ attribute: "brand-href" }) accessor brandHref: string | undefined = undefined;
  /** The product's logo (an SVG or img element), cloned before its name */
  @property({ attribute: false }) accessor brandIcon: Element | undefined = undefined;
  /** The navigation landmark's name */
  @property() accessor label = "Main";
  /** Folded into an icon-only rail */
  @property({ type: Boolean, reflect: true }) accessor collapsed = false;
  /** Adds the button that folds the bar into a rail and back */
  @property({ type: Boolean }) accessor collapsible = false;
  /** The collapse button's words, merged over defaultSideNavLabels */
  @property({ attribute: false }) accessor labels: Partial<SideNavLabels> = {};

  @state() private accessor announce = "";

  private readonly uid = `tc-snav${++instances}`;

  protected override createRenderRoot() {
    // The element's parts go before the page's children (TcElement puts them after): brand and items come first in
    // reading and Tab order, the children – the footer card – last. The children stay where the framework put them
    if (!this.renderOptions.renderBefore) {
      const start = document.createComment("tc-start");
      this.prepend(start);
      this.renderOptions.renderBefore = start;
    }
    return super.createRenderRoot();
  }

  protected override update(changed: PropertyValues) {
    // The marker was removed from outside: a new one at the start, so Lit renders into a new part
    if (this.hasUpdated && this.renderOptions.renderBefore && this.renderOptions.renderBefore.parentNode !== this) {
      const start = document.createComment("tc-start");
      this.prepend(start);
      this.renderOptions.renderBefore = start;
    }
    super.update(changed);
  }

  private get words(): SideNavLabels {
    return { ...defaultSideNavLabels, ...this.labels };
  }

  private navigate(e: MouseEvent, item: SideNavItem) {
    if (item.disabled) return;
    // A new tab or window is the browser's business: no event, the link opens as usual
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const href = item.href ? safeUrl(item.href) : undefined;
    if (!this.emit<SideNavNavigate>("tc-navigate", { id: item.id, href, item }, { cancelable: true })) {
      e.preventDefault();
      return;
    }
    this.current = item.id;
  }

  private navigateBrand(e: MouseEvent, href: string) {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const item: SideNavItem = { id: SIDE_NAV_BRAND_ID, label: this.brand, href };
    if (!this.emit<SideNavNavigate>("tc-navigate", { id: SIDE_NAV_BRAND_ID, href, item, brand: true }, { cancelable: true })) e.preventDefault();
  }

  private toggle() {
    const collapsed = !this.collapsed;
    if (!this.emit<SideNavCollapsedChange>("tc-collapsed-change", { collapsed }, { cancelable: true })) return;
    this.collapsed = collapsed;
    this.announce = collapsed ? "Navigation collapsed" : "Navigation expanded";
  }

  private onKey = (e: KeyboardEvent) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    const links = [...this.querySelectorAll<HTMLElement>(".ui-snav__link:not([aria-disabled='true'])")];
    const at = links.indexOf(document.activeElement as HTMLElement);
    if (at < 0 || !links.length) return;
    e.preventDefault();
    const next = e.key === "Home" ? 0 : e.key === "End" ? links.length - 1 : (at + (e.key === "ArrowDown" ? 1 : -1) + links.length) % links.length;
    links[next].focus();
  };

  private icon(el: Element | undefined, cls: string) {
    return el ? html`<span class=${cls} aria-hidden="true">${el.cloneNode(true)}</span>` : nothing;
  }

  private link(item: SideNavItem): TemplateResult {
    const isCurrent = item.id === this.current;
    const href = item.href ? safeUrl(item.href) : undefined;
    const badge = item.badge !== undefined && item.badge !== "" ? String(item.badge) : undefined;
    const tip = this.collapsed ? (badge ? `${item.label} (${badge})` : item.label) : undefined;
    const body = html`
      ${item.icon ? this.icon(item.icon, "ui-snav__icon") : html`<span class="ui-snav__icon ui-snav__initial" aria-hidden="true">${item.label.slice(0, 1)}</span>`}
      <span class="ui-snav__label">${item.label}</span>
      ${badge ? html`<span class="ui-snav__badge">${badge}</span><span class="ui-snav__dot" aria-hidden="true"></span>` : nothing}
    `;
    const cls = `ui-snav__link${isCurrent ? " ui-snav__link--current" : ""}`;
    if (item.disabled) return html`<a class=${cls} role="link" aria-disabled="true" title=${ifDefined(tip)}>${body}</a>`;
    if (href)
      return html`<a class=${cls} href=${href} aria-current=${ifDefined(isCurrent ? "page" : undefined)} title=${ifDefined(tip)} @click=${(e: MouseEvent) => this.navigate(e, item)}>${body}</a>`;
    return html`<button type="button" class=${cls} aria-current=${ifDefined(isCurrent ? "page" : undefined)} title=${ifDefined(tip)} @click=${(e: MouseEvent) => this.navigate(e, item)}>${body}</button>`;
  }

  private brandPart() {
    if (!this.brand && !this.brandIcon) return nothing;
    const body = html`${this.icon(this.brandIcon, "ui-snav__logo")}<span class="ui-snav__brand-name">${this.brand}</span>`;
    const href = this.brandHref ? safeUrl(this.brandHref) : undefined;
    return href
      ? html`<a class="ui-snav__brand" href=${href} title=${ifDefined(this.collapsed ? this.brand : undefined)} @click=${(e: MouseEvent) => this.navigateBrand(e, href)}>${body}</a>`
      : html`<div class="ui-snav__brand">${body}</div>`;
  }

  protected override render() {
    const words = this.words;
    return html`
      <div class="ui-snav__head">
        ${this.brandPart()}
        ${this.collapsible
          ? html`<button type="button" class="ui-snav__toggle" aria-expanded=${this.collapsed ? "false" : "true"} aria-controls=${`${this.uid}-nav`} title=${this.collapsed ? words.expand : words.collapse} @click=${() => this.toggle()}>
              <svg viewBox="0 0 24 24" aria-hidden="true">${PANEL.map((d) => svg`<path d=${d}></path>`)}</svg>
              <span class="tc-sr-only">${this.collapsed ? words.expand : words.collapse}</span>
            </button>`
          : nothing}
      </div>
      <nav class="ui-snav__nav" id=${`${this.uid}-nav`} aria-label=${this.label} @keydown=${this.onKey}>
        ${sideNavGroups(this.items).map((group, g) => {
          const captionId = `${this.uid}-s${g}`;
          return html`<div class="ui-snav__group">
            ${group.section ? html`<div class="ui-snav__section" id=${captionId}>${group.section}</div>` : nothing}
            <ul class="ui-snav__list" aria-labelledby=${ifDefined(group.section ? captionId : undefined)}>
              ${group.items.map(({ item, index }) => html`<li class="ui-snav__item" data-index=${index}>${this.link(item)}</li>`)}
            </ul>
          </div>`;
        })}
      </nav>
      <span class="tc-sr-only" role="status">${this.announce}</span>
    `;
  }

  static override css = /* css */ `
[data-ui="snav"] {
  /* The bar's width open, and as an icon-only rail */
  --tc-snav-width: 248px;
  --tc-snav-rail: 60px;
  --tc-snav-icon: 18px;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--tc-space-2);
  box-sizing: border-box;
  width: var(--tc-snav-width);
  height: 100%;
  min-height: 0;
  padding: var(--tc-space-3) var(--tc-space-2);
  overflow-x: hidden;
  overflow-y: auto;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-tight);
  color: var(--tc-text-secondary);
  -webkit-font-smoothing: antialiased;
  transition: width var(--tc-duration-moderate) var(--tc-ease-move);
}
[data-ui="snav"][collapsed] { width: var(--tc-snav-rail); }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="snav"] { background: var(--tc-surface-tray); --tc-snav-current: var(--tc-surface-raised); --tc-snav-current-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="snav"] { background: var(--tc-surface-raised); border-right: 1px solid var(--tc-border-subtle); --tc-snav-current: var(--tc-fill-default); --tc-snav-current-shadow: none; }
[data-ui="snav"] *, [data-ui="snav"] *::before, [data-ui="snav"] *::after { box-sizing: border-box; }
:where([data-ui="snav"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
/* The page's own children (and a slot="brand" child) go at the bottom of the bar, after the items */
[data-ui="snav"] > :not(.ui-snav__head, .ui-snav__nav, .tc-sr-only) { flex: none; }
[data-ui="snav"] > [slot="brand"] { order: -1; }
[data-ui="snav"][collapsed] > :not(.ui-snav__head, .ui-snav__nav, .tc-sr-only, [slot="brand"]) { display: none; }

.ui-snav__head { display: flex; align-items: center; gap: var(--tc-space-1); min-height: var(--tc-control-h-md); padding: 0 var(--tc-space-1); }
[data-ui="snav"][collapsed] .ui-snav__head { flex-direction: column; padding: 0; }
.ui-snav__brand { display: flex; flex: 1; align-items: center; gap: var(--tc-space-2); min-width: 0; color: var(--tc-text-primary); font-weight: var(--tc-font-weight-semibold); text-decoration: none; border-radius: var(--tc-radius-md); }
.ui-snav__brand-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-snav__logo { display: grid; flex: none; place-items: center; width: 28px; height: 28px; }
.ui-snav__logo > * { max-width: 100%; max-height: 100%; }
.ui-snav__toggle { display: grid; flex: none; place-items: center; width: var(--tc-control-h-md); height: var(--tc-control-h-md); border-radius: var(--tc-radius-md); color: var(--tc-icon-muted); }
.ui-snav__toggle:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-snav__toggle svg { width: var(--tc-snav-icon); height: var(--tc-snav-icon); fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

.ui-snav__nav { display: flex; flex: 1 0 auto; flex-direction: column; gap: var(--tc-space-3); }
.ui-snav__section { margin: 0 0 var(--tc-space-1); padding: 0 var(--tc-space-2); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ui-snav__list { display: flex; flex-direction: column; gap: var(--tc-space-0-5); margin: 0; padding: 0; list-style: none; }

.ui-snav__link {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--tc-space-2);
  width: 100%;
  min-height: var(--tc-control-h-md);
  padding: 0 var(--tc-space-2);
  border-radius: var(--tc-radius-md);
  color: inherit;
  text-align: left;
  text-decoration: none;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-snav__link:not([aria-disabled="true"]):hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-snav__link--current, .ui-snav__link--current:not([aria-disabled="true"]):hover { background: var(--tc-snav-current); box-shadow: var(--tc-snav-current-shadow); color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
:where([data-look="clean"], [data-look="clean"] *) .ui-snav__link--current { color: var(--tc-accent-text); }
.ui-snav__link[aria-disabled="true"] { color: var(--tc-text-disabled); cursor: not-allowed; }
.ui-snav__link:focus-visible, .ui-snav__brand:focus-visible, .ui-snav__toggle:focus-visible { outline: var(--tc-focus-ring-width) solid var(--tc-focus-ring); outline-offset: -2px; }
.ui-snav__icon { display: grid; flex: none; place-items: center; width: var(--tc-snav-icon); height: var(--tc-snav-icon); color: var(--tc-icon-muted); }
.ui-snav__link--current .ui-snav__icon { color: currentColor; }
.ui-snav__link[aria-disabled="true"] .ui-snav__icon { color: inherit; }
.ui-snav__icon > svg { width: 100%; height: 100%; }
.ui-snav__initial { border-radius: var(--tc-radius-sm); background: var(--tc-fill-default); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-semibold); }
.ui-snav__label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-snav__badge { display: inline-grid; flex: none; place-items: center; min-width: var(--tc-pill-h); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); color: var(--tc-text-secondary); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-none); font-variant-numeric: tabular-nums; }
.ui-snav__dot { display: none; }

/* The rail: icons only, centred; the label stays the item's name for screen readers */
[data-ui="snav"][collapsed] .ui-snav__link { justify-content: center; padding: 0; }
[data-ui="snav"][collapsed] :is(.ui-snav__label, .ui-snav__badge, .ui-snav__brand-name, .ui-snav__section) { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
[data-ui="snav"][collapsed] .ui-snav__brand { flex: none; justify-content: center; }
[data-ui="snav"][collapsed] .ui-snav__dot { position: absolute; top: 6px; right: 10px; display: block; width: 6px; height: 6px; border-radius: var(--tc-radius-full); background: var(--tc-accent-solid); }

@media (forced-colors: active) {
  .ui-snav__link--current { outline: 2px solid CanvasText; }
  .ui-snav__dot { background: CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="snav"], [data-ui="snav"] * { transition: none !important; }
}
`;
}

if (!customElements.get("tc-side-nav")) customElements.define("tc-side-nav", TcSideNav);

declare global {
  interface HTMLElementTagNameMap {
    "tc-side-nav": TcSideNav;
  }
}
