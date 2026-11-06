import { html, nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { OnScreenController } from "./internal/controllers";

/*
 * <tc-released> – a document with a check on it and a few sparks around, for content that's out and live. On the badge, a check mark that draws itself once, with sparks that twinkle twice, then it rests.
 * One of the workflow stages beside awaiting-review – in-translation, in-quality-control, in-coordination,
 * pending-release and released – drawn the same way: a soft page tile, one pastel badge with a darker edge and ink,
 * and a soft glow beneath. Drawn on a 320 × 240 viewBox inside a 3 : 2 frame, with its words as real text under it.
 *
 *   <tc-released caption="Released"></tc-released>
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

[data-ui="rld"] {
  --tc-released-page: light-dark(#ffffff, #2a2a2e);
  --tc-released-edge: light-dark(#e4e7ec, rgba(255, 255, 255, 0.1));
  --tc-released-fold: light-dark(#eef1f5, #35373d);
  --tc-released-line: light-dark(#e6e9ee, #44464d);
  --tc-released-mark: light-dark(#dcf3e2, #1f4a2c);
  --tc-released-mark-edge: light-dark(#86cf9c, #64bf80);
  --tc-released-ink: light-dark(#22743b, #c9f0d4);
  --tc-released-glow: light-dark(rgba(90, 190, 120, 0.24), rgba(90, 190, 120, 0.12));
  --tc-released-soft: 12px;
  --tc-released-beat: 3.2s;
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  font-family: var(--tc-font-sans);
}
.ui-rld-art { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
.ui-rld-page { fill: var(--tc-released-page); stroke: var(--tc-released-edge); }
.ui-rld-fold { fill: var(--tc-released-fold); }
.ui-rld-line { fill: var(--tc-released-line); }
.ui-rld-badge { fill: var(--tc-released-mark); stroke: var(--tc-released-mark-edge); stroke-width: 4; stroke-linejoin: round; }
.ui-rld-ink { fill: none; stroke: var(--tc-released-ink); stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; }
.ui-rld-glow { fill: var(--tc-released-glow); filter: blur(var(--tc-released-soft)); animation: ui-rld-breathe var(--tc-released-beat) var(--tc-ease-standard) 3; }
.ui-rld-caption { position: absolute; right: 0; bottom: 0; left: 0; margin: 0; color: var(--tc-text-primary); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); text-align: center; }
.ui-rld-motif { stroke-dasharray: 40; animation: ui-rld-draw calc(var(--tc-released-beat) * 0.3) var(--tc-ease-move) calc(var(--tc-released-beat) / 16) backwards; }
.ui-rld-spark { animation: ui-rld-twinkle calc(var(--tc-released-beat) / 2) var(--tc-ease-standard) calc(var(--tc-released-beat) * 0.3) 2 both; }
@keyframes ui-rld-draw { from { stroke-dashoffset: 40; } to { stroke-dashoffset: 0; } }
@keyframes ui-rld-twinkle { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
@keyframes ui-rld-breathe { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

/* Off screen or in a hidden tab: the motion holds still */
[data-ui="rld"][data-paused] :is(.ui-rld-spark, .ui-rld-motif, .ui-rld-glow) { animation-play-state: paused; }

@media (prefers-reduced-motion: reduce) {
  .ui-rld-spark, .ui-rld-motif, .ui-rld-glow { animation: none; }
}
@media (forced-colors: active) {
  .ui-rld-art { forced-color-adjust: auto; }
}
`;

/**
 * A document with a check on it and a few sparks around, for content that's out and live.
 * @tag tc-released
 */
export class TcReleased extends TcElement {
  static override ui = "rld";
  static override looks = false;
  static override css = css;

  /** The words under the drawing; "" leaves them out */
  @property() accessor caption = "Released";
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
    return html`<svg class="ui-rld-art" viewBox="0 0 320 240" aria-hidden="true">${svg`
      <ellipse class="ui-rld-glow" cx="160" cy="168" rx="92" ry="14"></ellipse>
      <path class="ui-rld-page" d="M124 26h50l26 26v92a12 12 0 0 1-12 12h-64a12 12 0 0 1-12-12V38a12 12 0 0 1 12-12Z" stroke-width="2"></path>
      <path class="ui-rld-fold" d="M174 26v18a8 8 0 0 0 8 8h18Z"></path>
      <rect class="ui-rld-line" x="126" y="48" width="36" height="6" rx="3"></rect>
      <rect class="ui-rld-line" x="126" y="62" width="52" height="6" rx="3"></rect>
      <rect class="ui-rld-line" x="126" y="76" width="44" height="6" rx="3"></rect>
      <circle class="ui-rld-badge" cx="160" cy="126" r="30"></circle>
      <path class="ui-rld-ink ui-rld-motif" d="M146 127l9 9 19-19"></path>
      <path class="ui-rld-ink ui-rld-spark" d="M196 92l5-5M204 106h7M190 84v-7"></path>`}</svg>
      ${this.caption ? html`<p class="ui-rld-caption">${this.caption}</p>` : nothing}`;
  }
}

if (!customElements.get("tc-released")) customElements.define("tc-released", TcReleased);

declare global {
  interface HTMLElementTagNameMap {
    "tc-released": TcReleased;
  }
}
