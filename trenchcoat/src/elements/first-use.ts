import { html, nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { OnScreenController } from "./internal/controllers";

/*
 * <tc-first-use> – an empty workspace with one highlighted spot to start from, for a new team or project with nothing in it yet. The spot glows a few times and rests.
 * Drawn on a 320 × 240 viewBox inside a 3 : 2 frame, with its words as real text under the drawing.
 *
 *   <tc-first-use caption="Nothing here yet"></tc-first-use>
 *
 * It says what's happened, so unlike a decorative illustration the host is an image named by `label`, or else by
 * `caption`. Set caption="" and leave `label` empty when the words beside it already say so: it's then decorative. The
 * loop runs a few cycles and rests, holds still off screen or in a hidden tab (data-paused) and stays still with reduced
 * motion. Colours follow the page theme through light-dark(). It's only a picture: it doesn't hide or block anything.
 */

const css = /* css */ `
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

[data-ui="fus"] {
  --tc-first-use-frame: light-dark(#ffffff, #232326);
  --tc-first-use-edge: light-dark(#d9dee6, rgba(255, 255, 255, 0.14));
  --tc-first-use-slot: light-dark(#c3cad4, #5c6068);
  --tc-first-use-spot: light-dark(#2563eb, #8fb0ff);
  --tc-first-use-ink: light-dark(#ffffff, #1a1c20);
  --tc-first-use-glow: light-dark(rgba(37, 99, 235, 0.18), rgba(143, 176, 255, 0.2));
  --tc-first-use-beat: 3.2s;
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  font-family: var(--tc-font-sans);
}
.ui-fus-art { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
.ui-fus-frame { fill: var(--tc-first-use-frame); stroke: var(--tc-first-use-edge); }
.ui-fus-slot { fill: none; stroke: var(--tc-first-use-slot); stroke-width: 1.5; stroke-dasharray: 5 5; }
.ui-fus-glow { fill: var(--tc-first-use-glow); }
.ui-fus-tile { fill: var(--tc-first-use-spot); }
.ui-fus-plus { fill: none; stroke: var(--tc-first-use-ink); stroke-width: 3; stroke-linecap: round; }
.ui-fus-caption { position: absolute; right: 0; bottom: 0; left: 0; margin: 0; color: var(--tc-text-primary); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); text-align: center; }
.ui-fus-glow { transform-box: fill-box; transform-origin: center; animation: ui-fus-glow var(--tc-first-use-beat) var(--tc-ease-standard) 3; }
@keyframes ui-fus-glow { 0%, 100% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.12); opacity: 1; } }

/* Off screen or in a hidden tab: the loop holds still */
[data-ui="fus"][data-paused] .ui-fus-glow { animation-play-state: paused; }

@media (prefers-reduced-motion: reduce) {
  .ui-fus-glow { animation: none; }
}
`;

/**
 * An empty workspace with one highlighted spot to start from, for a new team or project with nothing in it yet.
 * @tag tc-first-use
 */
export class TcFirstUse extends TcElement {
  static override ui = "fus";
  static override looks = false;
  static override css = css;

  /** The words under the drawing; "" leaves them out */
  @property() accessor caption = "Nothing here yet";
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
    return html`<svg class="ui-fus-art" viewBox="0 0 320 240" aria-hidden="true">${svg`
      <rect class="ui-fus-frame" x="50" y="22" width="220" height="136" rx="12"></rect>
      <rect class="ui-fus-slot" x="66" y="38" width="56" height="48" rx="8"></rect>
      <rect class="ui-fus-glow" x="124" y="30" width="72" height="64" rx="14"></rect>
      <rect class="ui-fus-tile" x="132" y="38" width="56" height="48" rx="8"></rect>
      <path class="ui-fus-plus" d="M160 52v20M150 62h20"></path>
      <rect class="ui-fus-slot" x="198" y="38" width="56" height="48" rx="8"></rect>
      <rect class="ui-fus-slot" x="66" y="96" width="56" height="48" rx="8"></rect>
      <rect class="ui-fus-slot" x="132" y="96" width="56" height="48" rx="8"></rect>
      <rect class="ui-fus-slot" x="198" y="96" width="56" height="48" rx="8"></rect>`}</svg>
      ${this.caption ? html`<p class="ui-fus-caption">${this.caption}</p>` : nothing}`;
  }
}

if (!customElements.get("tc-first-use")) customElements.define("tc-first-use", TcFirstUse);

declare global {
  interface HTMLElementTagNameMap {
    "tc-first-use": TcFirstUse;
  }
}
