import { html, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";

/*
 * <tc-text-reveal> – the Lit port of motion/text-reveal.tsx. When the text scrolls into view it arrives piece by
 * piece – word by word or letter by letter – each piece fading in out of a soft blur while it rises a little.
 *
 *   <tc-text-reveal as="h2" by="char" text="Meet your new teammate."></tc-text-reveal>
 *
 * Screen readers get the whole sentence at once; the moving pieces are hidden from them. Font, size and colour come
 * from the parent. The pieces are CSS animations started by one attribute (data-shown); reduced motion (live, via
 * the media query) shows the text at once.
 *
 * The React version rendered `as` (p, h1–h3, span) as its root tag. Here the host is the root: h1–h3 give it
 * role="heading" with the level, and the host takes the tag's default browser styles (size, weight, margins) at zero
 * specificity, so it lays out as the tag did; span makes it inline.
 */

export type TextRevealBy = "word" | "char";
export type TextRevealTag = "p" | "h1" | "h2" | "h3" | "span";

/**
 * Text that arrives piece by piece out of a soft blur when it scrolls into view.
 * @tag tc-text-reveal
 */
export class TcTextReveal extends TcElement {
  static override ui = "trv";
  static override looks = false;

  /** The text to reveal */
  @property() accessor text = "";
  /** Reveal word by word or letter by letter */
  @property() accessor by: TextRevealBy = "word";
  /** Time between two pieces, in ms */
  @property({ type: Number }) accessor stagger = 40;
  /** Wait before the first piece, in ms */
  @property({ type: Number }) accessor delay = 0;
  /** Time each piece takes to arrive, in ms */
  @property({ type: Number }) accessor duration = 700;
  /** What the text is: a paragraph, a heading (h1–h3, the host becomes a heading of that level) or inline text */
  @property({ reflect: true }) accessor as: TextRevealTag = "p";
  /** Reveal only the first time; false plays it again each time it enters the view (attribute: once="false") */
  @property({ converter: { fromAttribute: (v: string | null) => v !== "false" } }) accessor once = true;

  /** @internal In view: the pieces animate */
  @state() accessor shown = false;

  private io?: IntersectionObserver;

  override connectedCallback() {
    super.connectedCallback();
    this.observe();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.io?.disconnect();
    this.io = undefined;
  }

  private observe() {
    this.io?.disconnect();
    this.io = undefined;
    if (typeof IntersectionObserver === "undefined") {
      this.shown = true;
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            this.shown = true;
            if (this.once) io.disconnect();
          } else if (!this.once) {
            this.shown = false;
          }
        }
      },
      { threshold: 0.3 },
    );
    this.io = io;
    io.observe(this);
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    // once turned off after the first reveal: watch again
    if (changed.has("once") && changed.get("once") !== undefined && this.isConnected) this.observe();
    this.toggleAttribute("data-shown", this.shown);
    this.style.setProperty("--tc-text-reveal-stagger", `${this.stagger}ms`);
    this.style.setProperty("--tc-text-reveal-delay", `${this.delay}ms`);
    this.style.setProperty("--tc-text-reveal-duration", `${this.duration}ms`);
    const level = /^h([1-3])$/.exec(this.as)?.[1];
    if (level) {
      this.setAttribute("role", "heading");
      this.setAttribute("aria-level", level);
    } else if (this.getAttribute("role") === "heading") {
      this.removeAttribute("role");
      this.removeAttribute("aria-level");
    }
  }

  protected override render() {
    return html`<span class="ui-trv__sr">${this.text}</span><span aria-hidden="true">${this.pieces()}</span>`;
  }

  /** The moving pieces, each numbered for its stagger; whitespace stays plain text so lines wrap normally */
  private pieces() {
    let i = 0;
    return this.text.split(/(\s+)/).map((part) => {
      if (part === "") return "";
      if (/^\s+$/.test(part)) return part;
      if (this.by === "word") return html`<span class="ui-trv__p" style=${styleMap({ "--tc-text-reveal-i": String(i++) })}>${part}</span>`;
      // Letter by letter: the letters of a word sit in one unbreakable group
      return html`<span class="ui-trv__w">${Array.from(part).map(
        (ch) => html`<span class="ui-trv__p" style=${styleMap({ "--tc-text-reveal-i": String(i++) })}>${ch}</span>`,
      )}</span>`;
    });
  }

  static override css = /* css */ `
/* Theme: the --tc- fallbacks use light-dark(), which follows color-scheme */
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

/* The host lays out as the tag the React version rendered (the browser's defaults for p, h1–h3 and span) */
[data-ui="trv"] { --tc-text-reveal-heading-weight: bold; }
:where([data-ui="trv"][as="p"]) { display: block; margin-block: 1em; }
:where([data-ui="trv"][as="h1"]) { display: block; font-size: 2em; font-weight: var(--tc-text-reveal-heading-weight); margin-block: 0.67em; }
:where([data-ui="trv"][as="h2"]) { display: block; font-size: 1.5em; font-weight: var(--tc-text-reveal-heading-weight); margin-block: 0.83em; }
:where([data-ui="trv"][as="h3"]) { display: block; font-size: 1.17em; font-weight: var(--tc-text-reveal-heading-weight); margin-block: 1em; }
:where([data-ui="trv"][as="span"]) { display: inline; }

[data-ui="trv"] {
  --tc-text-reveal-blur: 8px;
  --tc-text-reveal-rise: 0.35em;
}
.ui-trv__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
.ui-trv__w {
  display: inline-block;
  white-space: nowrap;
}
.ui-trv__p {
  display: inline-block;
  opacity: 0;
  filter: blur(var(--tc-text-reveal-blur));
  transform: translateY(var(--tc-text-reveal-rise));
}
[data-ui="trv"][data-shown] .ui-trv__p {
  animation: ui-trv-in var(--tc-text-reveal-duration) var(--tc-ease-emphasized, cubic-bezier(0.32, 0.72, 0.24, 1)) both;
  animation-delay: calc(var(--tc-text-reveal-delay) + var(--tc-text-reveal-i) * var(--tc-text-reveal-stagger));
}
@keyframes ui-trv-in {
  from {
    opacity: 0;
    filter: blur(var(--tc-text-reveal-blur));
    transform: translateY(var(--tc-text-reveal-rise));
  }
  to {
    opacity: 1;
    filter: blur(0);
    transform: none;
  }
}

/* Reduced motion: the text is simply there */
@media (prefers-reduced-motion: reduce) {
  [data-ui="trv"] .ui-trv__p,
  [data-ui="trv"][data-shown] .ui-trv__p {
    opacity: 1;
    filter: none;
    transform: none;
    animation: none;
  }
}
`;
}

if (!customElements.get("tc-text-reveal")) customElements.define("tc-text-reveal", TcTextReveal);

declare global {
  interface HTMLElementTagNameMap {
    "tc-text-reveal": TcTextReveal;
  }
}
