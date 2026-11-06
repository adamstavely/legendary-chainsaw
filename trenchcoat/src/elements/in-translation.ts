import { html, nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { OnScreenController } from "./internal/controllers";

/*
 * <tc-in-translation> – a document with two speech bubbles on it, for content being translated into other languages. On the badge, two speech bubbles, one in each language, that nod in turn, then it rests.
 * One of the workflow stages beside awaiting-review – in-translation, in-quality-control, in-coordination,
 * pending-release and released – drawn the same way: a soft page tile, one pastel badge with a darker edge and ink,
 * and a soft glow beneath. Drawn on a 320 × 240 viewBox inside a 3 : 2 frame, with its words as real text under it.
 *
 *   <tc-in-translation caption="In translation"></tc-in-translation>
 *
 * It says where something stands, so the host is an image named by `label`, or else by `caption`. Set caption="" and
 * leave `label` empty when the words beside it already say so: it's then decorative. The motion is finite, holds still
 * off screen or in a hidden tab (data-paused) and stays still with reduced motion. Colours follow the page theme
 * through light-dark().
 */

const css = /* css */ `
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

[data-ui="itn"] {
  --tc-in-translation-page: light-dark(#ffffff, #2a2a2e);
  --tc-in-translation-edge: light-dark(#e4e7ec, rgba(255, 255, 255, 0.1));
  --tc-in-translation-fold: light-dark(#eef1f5, #35373d);
  --tc-in-translation-line: light-dark(#e6e9ee, #44464d);
  --tc-in-translation-mark: light-dark(#d9f3ef, #1e4842);
  --tc-in-translation-mark-edge: light-dark(#7fcfc2, #5fbfb1);
  --tc-in-translation-ink: light-dark(#1f7a6d, #c8f1ea);
  --tc-in-translation-glow: light-dark(rgba(80, 190, 170, 0.24), rgba(80, 190, 170, 0.12));
  --tc-in-translation-soft: 12px;
  --tc-in-translation-beat: 3.2s;
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  font-family: var(--tc-font-sans);
}
.ui-itn-art { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
.ui-itn-page { fill: var(--tc-in-translation-page); stroke: var(--tc-in-translation-edge); }
.ui-itn-fold { fill: var(--tc-in-translation-fold); }
.ui-itn-line { fill: var(--tc-in-translation-line); }
.ui-itn-badge { fill: var(--tc-in-translation-mark); stroke: var(--tc-in-translation-mark-edge); stroke-width: 4; stroke-linejoin: round; }
.ui-itn-ink { fill: none; stroke: var(--tc-in-translation-ink); stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; }
.ui-itn-glow { fill: var(--tc-in-translation-glow); filter: blur(var(--tc-in-translation-soft)); animation: ui-itn-breathe var(--tc-in-translation-beat) var(--tc-ease-standard) 3; }
.ui-itn-caption { position: absolute; right: 0; bottom: 0; left: 0; margin: 0; color: var(--tc-text-primary); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); text-align: center; }
.ui-itn-bubble { fill: var(--tc-in-translation-page); stroke: var(--tc-in-translation-ink); stroke-width: 3.5; stroke-linejoin: round; }
.ui-itn-motif { transform-box: fill-box; transform-origin: center bottom; animation: ui-itn-nod var(--tc-in-translation-beat) var(--tc-ease-move) 3; }
.ui-itn-second { animation-delay: calc(var(--tc-in-translation-beat) / 2); }
@keyframes ui-itn-nod { 0%, 30%, 100% { transform: translateY(0); } 15% { transform: translateY(-4px); } }
@keyframes ui-itn-breathe { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

/* Off screen or in a hidden tab: the motion holds still */
[data-ui="itn"][data-paused] :is(.ui-itn-motif, .ui-itn-motif, .ui-itn-glow) { animation-play-state: paused; }

@media (prefers-reduced-motion: reduce) {
  .ui-itn-motif, .ui-itn-motif, .ui-itn-glow { animation: none; }
}
@media (forced-colors: active) {
  .ui-itn-art { forced-color-adjust: auto; }
}
`;

/**
 * A document with two speech bubbles on it, for content being translated into other languages.
 * @tag tc-in-translation
 */
export class TcInTranslation extends TcElement {
  static override ui = "itn";
  static override looks = false;
  static override css = css;

  /** The words under the drawing; "" leaves them out */
  @property() accessor caption = "In translation";
  /** Accessible description, when it should say more than `caption` */
  @property() accessor label = "";

  /** @internal */
  private readonly screen = new OnScreenController(this);

  protected override updated() {
    const name = this.label || this.caption;
    if (name) {
      this.setAttribute("role", "img");
      this.setAttribute("aria-label", name);
      this.removeAttribute("aria-hidden");
    } else {
      if (this.getAttribute("role") === "img") this.removeAttribute("role");
      this.removeAttribute("aria-label");
      this.setAttribute("aria-hidden", "true");
    }
    this.toggleAttribute("data-paused", !this.screen.onScreen);
  }

  protected override render() {
    return html`<svg class="ui-itn-art" viewBox="0 0 320 240" aria-hidden="true">${svg`
      <ellipse class="ui-itn-glow" cx="160" cy="168" rx="92" ry="14"></ellipse>
      <path class="ui-itn-page" d="M124 26h50l26 26v92a12 12 0 0 1-12 12h-64a12 12 0 0 1-12-12V38a12 12 0 0 1 12-12Z" stroke-width="2"></path>
      <path class="ui-itn-fold" d="M174 26v18a8 8 0 0 0 8 8h18Z"></path>
      <rect class="ui-itn-line" x="126" y="48" width="36" height="6" rx="3"></rect>
      <rect class="ui-itn-line" x="126" y="62" width="52" height="6" rx="3"></rect>
      <rect class="ui-itn-line" x="126" y="76" width="44" height="6" rx="3"></rect>
      <circle class="ui-itn-badge" cx="160" cy="126" r="30"></circle>
      <g class="ui-itn-motif">
        <path class="ui-itn-bubble" d="M140 104h22a5 5 0 0 1 5 5v13a5 5 0 0 1-5 5h-12l-7 6v-6h-3a5 5 0 0 1-5-5v-13a5 5 0 0 1 5-5Z"></path>
        <path class="ui-itn-ink" d="M145 122l6-13 6 13M147.5 117h7"></path>
      </g>
      <g class="ui-itn-motif ui-itn-second">
        <path class="ui-itn-bubble" d="M159 121h22a5 5 0 0 1 5 5v13a5 5 0 0 1-5 5h-3v6l-7-6h-12a5 5 0 0 1-5-5v-13a5 5 0 0 1 5-5Z"></path>
        <path class="ui-itn-ink" d="M165 128h10M170 128v3M166 133c3 4 7 5 10 5M175 133c-2 3-5 5-8 6"></path>
      </g>`}</svg>
      ${this.caption ? html`<p class="ui-itn-caption">${this.caption}</p>` : nothing}`;
  }
}

if (!customElements.get("tc-in-translation")) customElements.define("tc-in-translation", TcInTranslation);

declare global {
  interface HTMLElementTagNameMap {
    "tc-in-translation": TcInTranslation;
  }
}
