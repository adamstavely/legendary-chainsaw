import { html, nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { OnScreenController } from "./internal/controllers";

/*
 * <tc-in-coordination> – a document with three linked points on it, for work being agreed between teams before it goes ahead. On the badge, three linked nodes that light up in turn, then it rests.
 * One of the workflow stages beside awaiting-review – in-translation, in-quality-control, in-coordination,
 * pending-release and released – drawn the same way: a soft page tile, one pastel badge with a darker edge and ink,
 * and a soft glow beneath. Drawn on a 320 × 240 viewBox inside a 3 : 2 frame, with its words as real text under it.
 *
 *   <tc-in-coordination caption="In coordination"></tc-in-coordination>
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

[data-ui="icn"] {
  --tc-in-coordination-page: light-dark(#ffffff, #2a2a2e);
  --tc-in-coordination-edge: light-dark(#e4e7ec, rgba(255, 255, 255, 0.1));
  --tc-in-coordination-fold: light-dark(#eef1f5, #35373d);
  --tc-in-coordination-line: light-dark(#e6e9ee, #44464d);
  --tc-in-coordination-mark: light-dark(#fbecd6, #4a3518);
  --tc-in-coordination-mark-edge: light-dark(#e8b878, #d9a35c);
  --tc-in-coordination-ink: light-dark(#94560f, #f8e1bf);
  --tc-in-coordination-glow: light-dark(rgba(230, 170, 90, 0.24), rgba(230, 170, 90, 0.12));
  --tc-in-coordination-soft: 12px;
  --tc-in-coordination-beat: 3.2s;
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  font-family: var(--tc-font-sans);
}
.ui-icn-art { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
.ui-icn-page { fill: var(--tc-in-coordination-page); stroke: var(--tc-in-coordination-edge); }
.ui-icn-fold { fill: var(--tc-in-coordination-fold); }
.ui-icn-line { fill: var(--tc-in-coordination-line); }
.ui-icn-badge { fill: var(--tc-in-coordination-mark); stroke: var(--tc-in-coordination-mark-edge); stroke-width: 4; stroke-linejoin: round; }
.ui-icn-ink { fill: none; stroke: var(--tc-in-coordination-ink); stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; }
.ui-icn-glow { fill: var(--tc-in-coordination-glow); filter: blur(var(--tc-in-coordination-soft)); animation: ui-icn-breathe var(--tc-in-coordination-beat) var(--tc-ease-standard) 3; }
.ui-icn-caption { position: absolute; right: 0; bottom: 0; left: 0; margin: 0; color: var(--tc-text-primary); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); text-align: center; }
.ui-icn-node { fill: var(--tc-in-coordination-page); stroke: var(--tc-in-coordination-ink); stroke-width: 4; transform-box: fill-box; transform-origin: center; animation: ui-icn-ping var(--tc-in-coordination-beat) var(--tc-ease-standard) 3; }
.ui-icn-node:nth-of-type(3) { animation-delay: calc(var(--tc-in-coordination-beat) / 6); }
.ui-icn-node:nth-of-type(4) { animation-delay: calc(var(--tc-in-coordination-beat) / 3); }
@keyframes ui-icn-ping { 0%, 40%, 100% { transform: scale(1); fill: var(--tc-in-coordination-page); } 20% { transform: scale(1.25); fill: var(--tc-in-coordination-ink); } }
@keyframes ui-icn-breathe { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

/* Off screen or in a hidden tab: the motion holds still */
[data-ui="icn"][data-paused] :is(.ui-icn-node, .ui-icn-glow) { animation-play-state: paused; }

@media (prefers-reduced-motion: reduce) {
  .ui-icn-node, .ui-icn-glow { animation: none; }
}
@media (forced-colors: active) {
  .ui-icn-art { forced-color-adjust: auto; }
}
`;

/**
 * A document with three linked points on it, for work being agreed between teams before it goes ahead.
 * @tag tc-in-coordination
 */
export class TcInCoordination extends TcElement {
  static override ui = "icn";
  static override looks = false;
  static override css = css;

  /** The words under the drawing; "" leaves them out */
  @property() accessor caption = "In coordination";
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
    return html`<svg class="ui-icn-art" viewBox="0 0 320 240" aria-hidden="true">${svg`
      <ellipse class="ui-icn-glow" cx="160" cy="168" rx="92" ry="14"></ellipse>
      <path class="ui-icn-page" d="M124 26h50l26 26v92a12 12 0 0 1-12 12h-64a12 12 0 0 1-12-12V38a12 12 0 0 1 12-12Z" stroke-width="2"></path>
      <path class="ui-icn-fold" d="M174 26v18a8 8 0 0 0 8 8h18Z"></path>
      <rect class="ui-icn-line" x="126" y="48" width="36" height="6" rx="3"></rect>
      <rect class="ui-icn-line" x="126" y="62" width="52" height="6" rx="3"></rect>
      <rect class="ui-icn-line" x="126" y="76" width="44" height="6" rx="3"></rect>
      <circle class="ui-icn-badge" cx="160" cy="126" r="30"></circle>
      <path class="ui-icn-ink" d="M160 110L145 138H175Z"></path>
      <circle class="ui-icn-node" cx="160" cy="110" r="7"></circle>
      <circle class="ui-icn-node" cx="145" cy="138" r="7"></circle>
      <circle class="ui-icn-node" cx="175" cy="138" r="7"></circle>`}</svg>
      ${this.caption ? html`<p class="ui-icn-caption">${this.caption}</p>` : nothing}`;
  }
}

if (!customElements.get("tc-in-coordination")) customElements.define("tc-in-coordination", TcInCoordination);

declare global {
  interface HTMLElementTagNameMap {
    "tc-in-coordination": TcInCoordination;
  }
}
