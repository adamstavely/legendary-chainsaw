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
 *   · `picture` puts a picture that fills the box in place of the icon – an avatar (an <img>, or initials): round
 *     for a person, square (the box's own radius) for an account or a workspace
 *   · `keepAside` keeps the aside on the title's line however narrow (a dialog's Close); the title wraps instead
 */

export type CardHead = {
  /** SVG content for a 24×24 viewBox, stroked (svg`<path …/>`), or an app's own icon element (an <svg> or <img>) */
  icon?: TemplateResult | Element;
  /** A picture that fills the box in place of the icon – an avatar (a template: an <img>, or initials) */
  picture?: unknown;
  /** The picture's box: "round" for a person, "square" (the icon box's radius) for an account (default "round") */
  pictureShape?: "round" | "square";
  title: unknown;
  subtitle?: unknown;
  /** Put on the heading, for aria-labelledby */
  id?: string;
  level?: 2 | 3;
  /** Right-aligned: a pill, a count, an action */
  aside?: unknown;
  /** Keep the aside on the title's line, and wrap the title instead (a dialog's Close button) */
  keepAside?: boolean;
};

export function cardHead({ icon, picture, pictureShape = "round", title, subtitle, id, level = 3, aside, keepAside = false }: CardHead) {
  const heading =
    level === 2
      ? html`<h2 class="tc-head__title" id=${ifDefined(id)}>${title}</h2>`
      : html`<h3 class="tc-head__title" id=${ifDefined(id)}>${title}</h3>`;
  return html`<div class="tc-head" ?data-keep-aside=${keepAside}>
    <div class="tc-head__main"><span class="tc-head__icon" aria-hidden="true" data-picture=${ifDefined(picture != null ? pictureShape : undefined)}
      >${picture != null
        ? picture
        : icon instanceof Element
          ? icon
          : html`<svg class="tc-head__glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${icon}</svg>`}</span
    >
    <div class="tc-head__text">
      ${heading}${subtitle ? html`<p class="tc-head__sub">${subtitle}</p>` : nothing}
    </div></div>
    ${aside ? html`<div class="tc-head__aside">${aside}</div>` : nothing}
  </div>`;
}

/** Adopted once for every element (internal/base.ts) */
export const cardHeadCss = /* css */ `
.tc-head { display: flex; flex-wrap: wrap; align-items: center; row-gap: var(--tc-space-2); gap: var(--tc-head-gap); min-width: 0; padding: var(--tc-head-pad); }
.tc-head__icon { flex: none; display: grid; place-items: center; width: var(--tc-head-icon-size); height: var(--tc-head-icon-size); border-radius: var(--tc-head-icon-radius); background: var(--tc-head-icon-bg); box-shadow: var(--tc-head-icon-shadow); color: var(--tc-head-icon-fg); }
.tc-head .tc-head__icon > svg.tc-head__glyph { display: block; width: var(--tc-head-glyph); height: var(--tc-head-glyph); stroke-width: var(--tc-head-glyph-stroke); }
.tc-head .tc-head__icon > :not(.tc-head__glyph) { display: block; max-width: var(--tc-head-glyph); max-height: var(--tc-head-glyph); }
/* A picture (an avatar) fills the box: round for a person, the box's radius for an account */
.tc-head .tc-head__icon[data-picture] { overflow: hidden; }
.tc-head .tc-head__icon[data-picture="round"] { border-radius: 50%; }
.tc-head .tc-head__icon[data-picture] > * { width: 100%; height: 100%; max-width: none; max-height: none; }
/* The icon and the text stay together; only the aside wraps, onto its own line when the title needs the room */
.tc-head__main { flex: 1 1 auto; display: flex; align-items: center; gap: var(--tc-head-gap); min-width: min(100%, 12rem); }
.tc-head__text { flex: 1 1 0; min-width: 0; }
.tc-head__title { margin: 0; color: var(--tc-title-color); font-family: var(--tc-font-sans); font-size: var(--tc-title-font-size); font-weight: var(--tc-title-font-weight); line-height: var(--tc-title-line-height); letter-spacing: var(--tc-title-tracking); overflow-wrap: break-word; }
.tc-head__sub { margin: 0; color: var(--tc-subtitle-color); font-size: var(--tc-subtitle-font-size); line-height: var(--tc-subtitle-line-height); overflow-wrap: anywhere; }
.tc-head[data-keep-aside] { flex-wrap: nowrap; }
.tc-head[data-keep-aside] > .tc-head__main { flex-basis: 0; min-width: 0; }
.tc-head__aside { flex: 0 1 auto; display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: var(--tc-space-2); margin-left: auto; min-width: 0; }
@media (forced-colors: active) { .tc-head__icon { border: 1px solid CanvasText; } }
`;
