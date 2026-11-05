import { html, nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { OnScreenController } from "./internal/controllers";

/*
 * <tc-preview-unavailable> – a file whose contents have faded to a dashed outline, with a question mark on it, for a file type the
 * viewer can't show. It isn't unsafe (malware-blocked) or forbidden (no-access): there's just no preview. The mark
 * settles a few times and rests.
 * Drawn like the other state illustrations (something-wrong, no-access, malware-blocked): a soft tile, one pastel mark
 * with a darker edge and ink, chunky rounded strokes, and a soft glow beneath.
 * Drawn on a 320 × 240 viewBox inside a 3 : 2 frame, with its words as real text under the drawing.
 *
 *   <tc-preview-unavailable caption="Preview not available"></tc-preview-unavailable>
 *
 * It says what's happened, so unlike a decorative illustration the host is an image named by `label`, or else by
 * `caption`. Set caption="" and leave `label` empty when the words beside it already say so: it's then decorative. The
 * loop runs a few cycles and rests, holds still off screen or in a hidden tab (data-paused) and stays still with reduced
 * motion. Colours follow the page theme through light-dark().
 */

const css = /* css */ `
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

[data-ui="pvu"] {
  --tc-preview-unavailable-page: light-dark(#ffffff, #2a2a2e);
  --tc-preview-unavailable-edge: light-dark(#e4e7ec, rgba(255, 255, 255, 0.1));
  --tc-preview-unavailable-fold: light-dark(#eef1f5, #35373d);
  --tc-preview-unavailable-line: light-dark(#e6e9ee, #44464d);
  --tc-preview-unavailable-mark: light-dark(#e6eaf0, #3a3f48);
  --tc-preview-unavailable-mark-edge: light-dark(#b5bfcc, #7d8796);
  --tc-preview-unavailable-ink: light-dark(#4d5866, #dfe4ec);
  --tc-preview-unavailable-glow: light-dark(rgba(140, 155, 175, 0.24), rgba(140, 155, 175, 0.12));
  --tc-preview-unavailable-soft: 12px;
  --tc-preview-unavailable-beat: 3s;
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  font-family: var(--tc-font-sans);
}
.ui-pvu-art { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
.ui-pvu-page { fill: var(--tc-preview-unavailable-page); stroke: var(--tc-preview-unavailable-edge); }
.ui-pvu-fold { fill: var(--tc-preview-unavailable-fold); }
.ui-pvu-line { fill: var(--tc-preview-unavailable-line); }
.ui-pvu-ghost { fill: none; stroke: var(--tc-preview-unavailable-line); stroke-width: 3; stroke-dasharray: 6 6; stroke-linecap: round; }
.ui-pvu-badge { fill: var(--tc-preview-unavailable-mark); stroke: var(--tc-preview-unavailable-mark-edge); stroke-width: 4; }
.ui-pvu-ink { fill: none; stroke: var(--tc-preview-unavailable-ink); stroke-width: 4.5; stroke-linecap: round; stroke-linejoin: round; }
.ui-pvu-glow { fill: var(--tc-preview-unavailable-glow); filter: blur(var(--tc-preview-unavailable-soft)); animation: ui-pvu-breathe var(--tc-preview-unavailable-beat) var(--tc-ease-standard) 3; }
.ui-pvu-mark { transform-box: fill-box; transform-origin: center; animation: ui-pvu-settle var(--tc-preview-unavailable-beat) var(--tc-ease-standard) 3; }
@keyframes ui-pvu-settle { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
@keyframes ui-pvu-breathe { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
.ui-pvu-caption { position: absolute; right: 0; bottom: 0; left: 0; margin: 0; color: var(--tc-text-primary); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); text-align: center; }

/* Off screen or in a hidden tab: the loop holds still */
[data-ui="pvu"][data-paused] :is(.ui-pvu-mark, .ui-pvu-glow) { animation-play-state: paused; }

@media (prefers-reduced-motion: reduce) {
  .ui-pvu-mark, .ui-pvu-glow { animation: none; }
}
@media (forced-colors: active) {
  .ui-pvu-art { forced-color-adjust: auto; }
}
`;

/**
 * A file whose contents have faded to a dashed outline, with a question mark, for a file type the viewer can't show.
 * @tag tc-preview-unavailable
 */
export class TcPreviewUnavailable extends TcElement {
  static override ui = "pvu";
  static override looks = false;
  static override css = css;

  /** The words under the drawing; "" leaves them out */
  @property() accessor caption = "Preview not available";
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
    return html`<svg class="ui-pvu-art" viewBox="0 0 320 240" aria-hidden="true">${svg`
      <ellipse class="ui-pvu-glow" cx="160" cy="166" rx="92" ry="14"></ellipse>
      <path class="ui-pvu-page" d="M124 26h50l26 26v92a12 12 0 0 1-12 12h-64a12 12 0 0 1-12-12V38a12 12 0 0 1 12-12Z" stroke-width="2"></path>
      <path class="ui-pvu-fold" d="M174 26v18a8 8 0 0 0 8 8h18Z"></path>
      <rect class="ui-pvu-line" x="126" y="44" width="36" height="6" rx="3"></rect>
      <rect class="ui-pvu-ghost" x="126" y="62" width="62" height="34" rx="6"></rect>
      <g class="ui-pvu-mark">
        <circle class="ui-pvu-badge" cx="160" cy="128" r="24"></circle>
        <path class="ui-pvu-ink" d="M152 121a8 8 0 1 1 11 7.4c-2 .9-3 2.4-3 4.6M160 140v.5"></path>
      </g>`}</svg>
      ${this.caption ? html`<p class="ui-pvu-caption">${this.caption}</p>` : nothing}`;
  }
}

if (!customElements.get("tc-preview-unavailable")) customElements.define("tc-preview-unavailable", TcPreviewUnavailable);

declare global {
  interface HTMLElementTagNameMap {
    "tc-preview-unavailable": TcPreviewUnavailable;
  }
}
