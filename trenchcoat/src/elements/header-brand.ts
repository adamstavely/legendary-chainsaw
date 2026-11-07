import { html, nothing } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { safeUrl } from "./internal/safe-url";

/*
 * <tc-header-brand> – the product's logo and name at the start of a full-width app header. With `href` it's a link
 * home: a click fires a cancelable `tc-navigate` ({ href }) – prevent it and the link isn't followed, so an app's
 * router can take it (clicks with a modifier key, or not the main button, are left to the browser). Without `href`
 * it's plain text. The name is never cut short: it keeps its whole width, and its line height follows its own size,
 * so a large name isn't clipped.
 *
 *   <tc-header-brand name="Intellect" href="/" .icon=${logoSvg}></tc-header-brand>
 *
 * Sized from the page: --tc-hb-name-size, --tc-hb-logo-size, --tc-hb-weight and --tc-hb-gap. `inverse` is for a
 * dark header bar in either theme – the brand takes the dark theme's colours, as tc-header-nav's `inverse` does.
 * Standard and Clean differ only in their tokens' values.
 */

export type HeaderBrandNavigate = { href: string };
export type HeaderBrandNavigateEvent = CustomEvent<HeaderBrandNavigate>;

/**
 * The product's logo and name in an app header, as a link home or plain text.
 * @tag tc-header-brand
 * @fires tc-navigate - The linked brand was clicked ({ href }: HeaderBrandNavigate); cancelable – prevented, the link isn't followed
 */
export class TcHeaderBrand extends TcElement {
  static override ui = "hb";

  /** The product's name */
  @property() accessor name = "";
  /** Where the brand links to; without it (or when it isn't a safe link) the brand is plain text */
  @property() accessor href: string | undefined = undefined;
  /** The logo – an SVG or img element, cloned before the name */
  @property({ attribute: false }) accessor icon: Element | undefined = undefined;
  /** On a dark header bar: draw the brand in the dark theme's colours whatever the page's theme */
  @property({ type: Boolean, reflect: true }) accessor inverse = false;

  private navigate(e: MouseEvent, href: string) {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (!this.emit<HeaderBrandNavigate>("tc-navigate", { href }, { cancelable: true })) e.preventDefault();
  }

  protected override render() {
    if (!this.name && !this.icon) return nothing;
    const body = html`${this.icon ? html`<span class="ui-hb__logo" aria-hidden="true">${this.icon.cloneNode(true)}</span>` : nothing}<span class="ui-hb__name">${this.name}</span>`;
    const href = this.href ? safeUrl(this.href) : undefined;
    return href
      ? html`<a class="ui-hb__brand" href=${href} @click=${(e: MouseEvent) => this.navigate(e, href)}>${body}</a>`
      : html`<span class="ui-hb__brand">${body}</span>`;
  }

  static override css = /* css */ `

[data-ui="hb"] {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  font-family: var(--tc-font-sans);
  vertical-align: middle;
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
/* On a dark bar: every colour token is light-dark(), so the brand resolves its dark values */
[data-ui="hb"][inverse] { color-scheme: dark; }
[data-ui="hb"] *, [data-ui="hb"] *::before, [data-ui="hb"] *::after { box-sizing: border-box; }
.ui-hb__brand {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-hb-gap, var(--tc-space-2));
  border-radius: var(--tc-radius-md);
  font-weight: var(--tc-hb-weight, var(--tc-font-weight-semibold));
  color: var(--tc-text-primary);
  text-decoration: none;
  white-space: nowrap;
}
:where([data-look="standard"], [data-look="standard"] *).ui-hb__brand { letter-spacing: var(--tc-tracking-snug); }
a.ui-hb__brand { cursor: pointer; -webkit-tap-highlight-color: transparent; }
a.ui-hb__brand:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
/* The name keeps its whole width, and a line height relative to its own size, so a large name is never clipped */
.ui-hb__name { flex: none; font-size: var(--tc-hb-name-size, var(--tc-font-size-lg)); line-height: var(--tc-hb-line-height, 1.1); }
.ui-hb__logo { display: grid; flex: none; place-items: center; width: var(--tc-hb-logo-size, 24px); aspect-ratio: 1; }
.ui-hb__logo > :is(svg, img) { display: block; width: 100%; height: 100%; }
@media (forced-colors: active) {
  .ui-hb__brand { color: LinkText; }
  span.ui-hb__brand { color: CanvasText; }
}
`;
}

if (!customElements.get("tc-header-brand")) customElements.define("tc-header-brand", TcHeaderBrand);

declare global {
  interface HTMLElementTagNameMap {
    "tc-header-brand": TcHeaderBrand;
  }
}
