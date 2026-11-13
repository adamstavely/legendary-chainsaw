import { html, nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { OnScreenController } from "./internal/controllers";

/*
 * <tc-uploading> – a document with a round badge showing an arrow rising out of a tray, for a file on its way up. The
 * arrow rises out of the tray a few times, then it rests. It's the in-progress sibling of upload-failed: the same
 * upward arrow, here making it, there stopping short.
 * Drawn like the workflow stages beside awaiting-review – in-translation, in-quality-control, in-coordination,
 * pending-release and released: a soft page tile, one pastel badge with a darker edge and ink, and a soft glow
 * beneath. Drawn on a 320 × 240 viewBox inside a 3 : 2 frame, with its words as real text under it.
 *
 *   <tc-uploading caption="Uploading"></tc-uploading>
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

[data-ui="upl"] {
  --tc-uploading-page: light-dark(#ffffff, #2a2a2e);
  --tc-uploading-edge: light-dark(#e4e7ec, rgba(255, 255, 255, 0.1));
  --tc-uploading-fold: light-dark(#eef1f5, #35373d);
  --tc-uploading-line: light-dark(#e6e9ee, #44464d);
  --tc-uploading-mark: light-dark(#eaf3d2, #34421a);
  --tc-uploading-mark-edge: light-dark(#b2cd6a, #9fbf52);
  --tc-uploading-ink: light-dark(#4e6a10, #e3f1c4);
  --tc-uploading-glow: light-dark(rgba(160, 200, 80, 0.24), rgba(160, 200, 80, 0.12));
  --tc-uploading-soft: 12px;
  --tc-uploading-beat: 3.2s;
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  font-family: var(--tc-font-sans);
}
.ui-upl-art { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
.ui-upl-page { fill: var(--tc-uploading-page); stroke: var(--tc-uploading-edge); }
.ui-upl-fold { fill: var(--tc-uploading-fold); }
.ui-upl-line { fill: var(--tc-uploading-line); }
.ui-upl-badge { fill: var(--tc-uploading-mark); stroke: var(--tc-uploading-mark-edge); stroke-width: 4; stroke-linejoin: round; }
.ui-upl-ink { fill: none; stroke: var(--tc-uploading-ink); stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; }
.ui-upl-glow { fill: var(--tc-uploading-glow); filter: blur(var(--tc-uploading-soft)); animation: ui-upl-breathe var(--tc-uploading-beat) var(--tc-ease-standard) 3; }
.ui-upl-caption { position: absolute; right: 0; bottom: 0; left: 0; margin: 0; color: var(--tc-text-primary); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); text-align: center; }
.ui-upl-arrow { transform-box: view-box; animation: ui-upl-rise var(--tc-uploading-beat) var(--tc-ease-standard) 3; }
@keyframes ui-upl-rise { 0%, 100% { transform: translateY(0); } 15% { transform: translateY(6px); } 45% { transform: translateY(-4px); } 65% { transform: translateY(0); } }
@keyframes ui-upl-breathe { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

/* Off screen or in a hidden tab: the motion holds still */
[data-ui="upl"][data-paused] :is(.ui-upl-arrow, .ui-upl-glow) { animation-play-state: paused; }

@media (prefers-reduced-motion: reduce) {
  .ui-upl-arrow, .ui-upl-glow { animation: none; }
}
@media (forced-colors: active) {
  .ui-upl-art { forced-color-adjust: auto; }
}
`;

/**
 * A document with a badge showing an arrow rising out of a tray, for a file on its way up.
 * @tag tc-uploading
 */
export class TcUploading extends TcElement {
  static override ui = "upl";
  static override looks = false;
  static override css = css;

  /** The words under the drawing; "" leaves them out */
  @property() accessor caption = "Uploading";
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
    return html`<svg class="ui-upl-art" viewBox="0 0 320 240" aria-hidden="true">${svg`
      <ellipse class="ui-upl-glow" cx="160" cy="168" rx="92" ry="14"></ellipse>
      <path class="ui-upl-page" d="M124 26h50l26 26v92a12 12 0 0 1-12 12h-64a12 12 0 0 1-12-12V38a12 12 0 0 1 12-12Z" stroke-width="2"></path>
      <path class="ui-upl-fold" d="M174 26v18a8 8 0 0 0 8 8h18Z"></path>
      <rect class="ui-upl-line" x="126" y="48" width="36" height="6" rx="3"></rect>
      <rect class="ui-upl-line" x="126" y="62" width="52" height="6" rx="3"></rect>
      <rect class="ui-upl-line" x="126" y="76" width="44" height="6" rx="3"></rect>
      <circle class="ui-upl-badge" cx="160" cy="126" r="30"></circle>
      <path class="ui-upl-ink" d="M143 132v5a6 6 0 0 0 6 6h22a6 6 0 0 0 6-6v-5"></path>
      <path class="ui-upl-ink ui-upl-arrow" d="M160 130v-24M149 117l11-11 11 11"></path>`}</svg>
      ${this.caption ? html`<p class="ui-upl-caption">${this.caption}</p>` : nothing}`;
  }
}

if (!customElements.get("tc-uploading")) customElements.define("tc-uploading", TcUploading);

declare global {
  interface HTMLElementTagNameMap {
    "tc-uploading": TcUploading;
  }
}
