import { html, nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { OnScreenController } from "./internal/controllers";

/*
 * <tc-pending-release> – a document with an arrow ready to go up on it, for content approved and waiting for its release. On the badge, an upward arrow above a dashed launch line, lifting a little a few times, then it rests.
 * One of the workflow stages beside awaiting-review – in-translation, in-quality-control, in-coordination,
 * pending-release and released – drawn the same way: a soft page tile, one pastel badge with a darker edge and ink,
 * and a soft glow beneath. Drawn on a 320 × 240 viewBox inside a 3 : 2 frame, with its words as real text under it.
 *
 *   <tc-pending-release caption="Pending release"></tc-pending-release>
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

[data-ui="pnr"] {
  --tc-pending-release-page: light-dark(#ffffff, #2a2a2e);
  --tc-pending-release-edge: light-dark(#e4e7ec, rgba(255, 255, 255, 0.1));
  --tc-pending-release-fold: light-dark(#eef1f5, #35373d);
  --tc-pending-release-line: light-dark(#e6e9ee, #44464d);
  --tc-pending-release-mark: light-dark(#fbe3ee, #4f2238);
  --tc-pending-release-mark-edge: light-dark(#e7a1c2, #d983ab);
  --tc-pending-release-ink: light-dark(#9c2f63, #f9d3e4);
  --tc-pending-release-glow: light-dark(rgba(225, 130, 175, 0.24), rgba(225, 130, 175, 0.12));
  --tc-pending-release-soft: 12px;
  --tc-pending-release-beat: 3.2s;
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  font-family: var(--tc-font-sans);
}
.ui-pnr-art { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
.ui-pnr-page { fill: var(--tc-pending-release-page); stroke: var(--tc-pending-release-edge); }
.ui-pnr-fold { fill: var(--tc-pending-release-fold); }
.ui-pnr-line { fill: var(--tc-pending-release-line); }
.ui-pnr-badge { fill: var(--tc-pending-release-mark); stroke: var(--tc-pending-release-mark-edge); stroke-width: 4; stroke-linejoin: round; }
.ui-pnr-ink { fill: none; stroke: var(--tc-pending-release-ink); stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; }
.ui-pnr-glow { fill: var(--tc-pending-release-glow); filter: blur(var(--tc-pending-release-soft)); animation: ui-pnr-breathe var(--tc-pending-release-beat) var(--tc-ease-standard) 3; }
.ui-pnr-caption { position: absolute; right: 0; bottom: 0; left: 0; margin: 0; color: var(--tc-text-primary); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); text-align: center; }
.ui-pnr-dash { stroke-dasharray: 2 6; }
.ui-pnr-motif { animation: ui-pnr-lift var(--tc-pending-release-beat) var(--tc-ease-move) 3; }
@keyframes ui-pnr-lift { 0%, 50%, 100% { transform: translateY(0); } 25% { transform: translateY(-5px); } }
@keyframes ui-pnr-breathe { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

/* Off screen or in a hidden tab: the motion holds still */
[data-ui="pnr"][data-paused] :is(.ui-pnr-motif, .ui-pnr-motif, .ui-pnr-glow) { animation-play-state: paused; }

@media (prefers-reduced-motion: reduce) {
  .ui-pnr-motif, .ui-pnr-motif, .ui-pnr-glow { animation: none; }
}
@media (forced-colors: active) {
  .ui-pnr-art { forced-color-adjust: auto; }
}
`;

/**
 * A document with an arrow ready to go up on it, for content approved and waiting for its release.
 * @tag tc-pending-release
 */
export class TcPendingRelease extends TcElement {
  static override ui = "pnr";
  static override looks = false;
  static override css = css;

  /** The words under the drawing; "" leaves them out */
  @property() accessor caption = "Pending release";
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
    return html`<svg class="ui-pnr-art" viewBox="0 0 320 240" aria-hidden="true">${svg`
      <ellipse class="ui-pnr-glow" cx="160" cy="168" rx="92" ry="14"></ellipse>
      <path class="ui-pnr-page" d="M124 26h50l26 26v92a12 12 0 0 1-12 12h-64a12 12 0 0 1-12-12V38a12 12 0 0 1 12-12Z" stroke-width="2"></path>
      <path class="ui-pnr-fold" d="M174 26v18a8 8 0 0 0 8 8h18Z"></path>
      <rect class="ui-pnr-line" x="126" y="48" width="36" height="6" rx="3"></rect>
      <rect class="ui-pnr-line" x="126" y="62" width="52" height="6" rx="3"></rect>
      <rect class="ui-pnr-line" x="126" y="76" width="44" height="6" rx="3"></rect>
      <circle class="ui-pnr-badge" cx="160" cy="126" r="30"></circle>
      <path class="ui-pnr-ink ui-pnr-dash" d="M146 146h28"></path>
      <path class="ui-pnr-ink ui-pnr-motif" d="M160 138v-30M148 120l12-12 12 12"></path>`}</svg>
      ${this.caption ? html`<p class="ui-pnr-caption">${this.caption}</p>` : nothing}`;
  }
}

if (!customElements.get("tc-pending-release")) customElements.define("tc-pending-release", TcPendingRelease);

declare global {
  interface HTMLElementTagNameMap {
    "tc-pending-release": TcPendingRelease;
  }
}
