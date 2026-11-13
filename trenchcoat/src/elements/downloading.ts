import { html, nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { OnScreenController } from "./internal/controllers";

/*
 * <tc-downloading> – a document with a round badge showing an arrow dropping into a tray, for a file or an export on
 * its way to the person. The arrow drops into the tray a few times, then it rests.
 * Drawn like the workflow stages beside awaiting-review – in-translation, in-quality-control, in-coordination,
 * pending-release and released: a soft page tile, one pastel badge with a darker edge and ink, and a soft glow
 * beneath. Drawn on a 320 × 240 viewBox inside a 3 : 2 frame, with its words as real text under it.
 *
 *   <tc-downloading caption="Downloading"></tc-downloading>
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

[data-ui="dnl"] {
  --tc-downloading-page: light-dark(#ffffff, #2a2a2e);
  --tc-downloading-edge: light-dark(#e4e7ec, rgba(255, 255, 255, 0.1));
  --tc-downloading-fold: light-dark(#eef1f5, #35373d);
  --tc-downloading-line: light-dark(#e6e9ee, #44464d);
  --tc-downloading-mark: light-dark(#d6eef8, #1c3f52);
  --tc-downloading-mark-edge: light-dark(#7cc1e0, #5aaed4);
  --tc-downloading-ink: light-dark(#1b6a8c, #cdeaf7);
  --tc-downloading-glow: light-dark(rgba(90, 170, 215, 0.24), rgba(90, 170, 215, 0.12));
  --tc-downloading-soft: 12px;
  --tc-downloading-beat: 3.2s;
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  font-family: var(--tc-font-sans);
}
.ui-dnl-art { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
.ui-dnl-page { fill: var(--tc-downloading-page); stroke: var(--tc-downloading-edge); }
.ui-dnl-fold { fill: var(--tc-downloading-fold); }
.ui-dnl-line { fill: var(--tc-downloading-line); }
.ui-dnl-badge { fill: var(--tc-downloading-mark); stroke: var(--tc-downloading-mark-edge); stroke-width: 4; stroke-linejoin: round; }
.ui-dnl-ink { fill: none; stroke: var(--tc-downloading-ink); stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; }
.ui-dnl-glow { fill: var(--tc-downloading-glow); filter: blur(var(--tc-downloading-soft)); animation: ui-dnl-breathe var(--tc-downloading-beat) var(--tc-ease-standard) 3; }
.ui-dnl-caption { position: absolute; right: 0; bottom: 0; left: 0; margin: 0; color: var(--tc-text-primary); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); text-align: center; }
.ui-dnl-arrow { transform-box: view-box; animation: ui-dnl-drop var(--tc-downloading-beat) var(--tc-ease-standard) 3; }
@keyframes ui-dnl-drop { 0%, 100% { transform: translateY(0); } 15% { transform: translateY(-6px); } 45% { transform: translateY(3px); } 65% { transform: translateY(0); } }
@keyframes ui-dnl-breathe { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

/* Off screen or in a hidden tab: the motion holds still */
[data-ui="dnl"][data-paused] :is(.ui-dnl-arrow, .ui-dnl-glow) { animation-play-state: paused; }

@media (prefers-reduced-motion: reduce) {
  .ui-dnl-arrow, .ui-dnl-glow { animation: none; }
}
@media (forced-colors: active) {
  .ui-dnl-art { forced-color-adjust: auto; }
}
`;

/**
 * A document with a badge showing an arrow dropping into a tray, for a file or an export on its way to the person.
 * @tag tc-downloading
 */
export class TcDownloading extends TcElement {
  static override ui = "dnl";
  static override looks = false;
  static override css = css;

  /** The words under the drawing; "" leaves them out */
  @property() accessor caption = "Downloading";
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
    return html`<svg class="ui-dnl-art" viewBox="0 0 320 240" aria-hidden="true">${svg`
      <ellipse class="ui-dnl-glow" cx="160" cy="168" rx="92" ry="14"></ellipse>
      <path class="ui-dnl-page" d="M124 26h50l26 26v92a12 12 0 0 1-12 12h-64a12 12 0 0 1-12-12V38a12 12 0 0 1 12-12Z" stroke-width="2"></path>
      <path class="ui-dnl-fold" d="M174 26v18a8 8 0 0 0 8 8h18Z"></path>
      <rect class="ui-dnl-line" x="126" y="48" width="36" height="6" rx="3"></rect>
      <rect class="ui-dnl-line" x="126" y="62" width="52" height="6" rx="3"></rect>
      <rect class="ui-dnl-line" x="126" y="76" width="44" height="6" rx="3"></rect>
      <circle class="ui-dnl-badge" cx="160" cy="126" r="30"></circle>
      <path class="ui-dnl-ink" d="M143 132v5a6 6 0 0 0 6 6h22a6 6 0 0 0 6-6v-5"></path>
      <path class="ui-dnl-ink ui-dnl-arrow" d="M160 106v24M149 119l11 11 11-11"></path>`}</svg>
      ${this.caption ? html`<p class="ui-dnl-caption">${this.caption}</p>` : nothing}`;
  }
}

if (!customElements.get("tc-downloading")) customElements.define("tc-downloading", TcDownloading);

declare global {
  interface HTMLElementTagNameMap {
    "tc-downloading": TcDownloading;
  }
}
