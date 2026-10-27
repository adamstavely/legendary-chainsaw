import { html, nothing, type TemplateResult } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";

/*
 * The card header every component shares: a boxed 28 px icon, the title and the quiet line under it, and anything
 * that belongs at the right (a status pill, a count, an action). One pattern so cards read alike.
 *
 *   ${cardHead({ icon: svg`<path d="…"/>`, title: this.heading, subtitle: this.description, id: `${this.uid}-title`,
 *                aside: html`<span class="ui-x__pill">2 problems</span>` })}
 *
 * Where it sits is the look's: in Standard the header is on the gray tray, above the white card that holds the
 * content (put it before the card, inside the tray); in Clean it's the card's first row. The look tokens
 * (--tc-head-*) size the box and pad the row, so a component only places it.
 *   · the icon is decorative (aria-hidden); the title is a real heading – `level` 2 or 3 (default 3)
 *   · pass `id` when something names itself after the title (aria-labelledby)
 *   · the box takes a 24×24 viewBox stroke icon, drawn at --tc-head-glyph, or an app's own element (sized to fit)
 *   · when there isn't room, the aside drops to its own line under the title rather than squeezing it
 *   · the glyph rule outranks a component's own `[data-ui=x] svg` sizing, so a component needn't exclude it
 */

export type CardHead = {
  /** SVG content for a 24×24 viewBox, stroked (svg`<path …/>`), or an app's own icon element (an <svg> or <img>) */
  icon: TemplateResult | Element;
  title: unknown;
  subtitle?: unknown;
  /** Put on the heading, for aria-labelledby */
  id?: string;
  level?: 2 | 3;
  /** Right-aligned: a pill, a count, an action */
  aside?: unknown;
};

export function cardHead({ icon, title, subtitle, id, level = 3, aside }: CardHead) {
  const heading =
    level === 2
      ? html`<h2 class="tc-head__title" id=${ifDefined(id)}>${title}</h2>`
      : html`<h3 class="tc-head__title" id=${ifDefined(id)}>${title}</h3>`;
  return html`<div class="tc-head">
    <span class="tc-head__icon" aria-hidden="true"
      >${icon instanceof Element
        ? icon
        : html`<svg class="tc-head__glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${icon}</svg>`}</span
    >
    <div class="tc-head__text">
      ${heading}${subtitle ? html`<p class="tc-head__sub">${subtitle}</p>` : nothing}
    </div>
    ${aside ? html`<div class="tc-head__aside">${aside}</div>` : nothing}
  </div>`;
}

/** Adopted once for every element (internal/base.ts) */
export const cardHeadCss = /* css */ `
.tc-head { display: flex; flex-wrap: wrap; align-items: center; row-gap: var(--tc-space-2); gap: var(--tc-head-gap); min-width: 0; padding: var(--tc-head-pad); }
.tc-head__icon { flex: none; display: grid; place-items: center; width: var(--tc-head-icon-size); height: var(--tc-head-icon-size); border-radius: var(--tc-head-icon-radius); background: var(--tc-head-icon-bg); box-shadow: var(--tc-head-icon-shadow); color: var(--tc-head-icon-fg); }
.tc-head .tc-head__icon > svg.tc-head__glyph { display: block; width: var(--tc-head-glyph); height: var(--tc-head-glyph); stroke-width: var(--tc-head-glyph-stroke); }
.tc-head .tc-head__icon > :not(.tc-head__glyph) { display: block; max-width: var(--tc-head-glyph); max-height: var(--tc-head-glyph); }
.tc-head__text { flex: 1 1 auto; min-width: 0; }
.tc-head__title { margin: 0; color: var(--tc-title-color); font-family: var(--tc-font-sans); font-size: var(--tc-title-font-size); font-weight: var(--tc-title-font-weight); line-height: var(--tc-title-line-height); letter-spacing: var(--tc-title-tracking); overflow-wrap: break-word; }
.tc-head__sub { margin: 0; color: var(--tc-subtitle-color); font-size: var(--tc-subtitle-font-size); line-height: var(--tc-subtitle-line-height); overflow-wrap: anywhere; }
.tc-head__aside { flex: 0 1 auto; display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: var(--tc-space-2); margin-left: auto; min-width: 0; }
@media (forced-colors: active) { .tc-head__icon { border: 1px solid CanvasText; } }
`;
