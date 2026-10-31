import { html, nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { OnScreenController } from "./internal/controllers";

/*
 * <tc-content-hidden> – a blurred picture behind a crossed-out eye, for objectionable content that's been covered. It's made to sit on an overlay, and settles a few times and rests.
 * Drawn on a 320 × 240 viewBox inside a 3 : 2 frame, with its words as real text under the drawing.
 *
 *   <tc-content-hidden caption="Content hidden"></tc-content-hidden>
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

[data-ui="chd"] {
  --tc-content-hidden-card: light-dark(#ffffff, #2a2a2e);
  --tc-content-hidden-edge: light-dark(#d9dee6, rgba(255, 255, 255, 0.14));
  --tc-content-hidden-shape: light-dark(#dfe4eb, #44464d);
  --tc-content-hidden-badge: light-dark(#40464f, #e4e6ea);
  --tc-content-hidden-ink: light-dark(#ffffff, #26282d);
  --tc-content-hidden-soft: 7px;
  --tc-content-hidden-beat: 3.2s;
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  font-family: var(--tc-font-sans);
}
.ui-chd-art { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
.ui-chd-card { fill: var(--tc-content-hidden-card); stroke: var(--tc-content-hidden-edge); }
.ui-chd-shape { fill: var(--tc-content-hidden-shape); filter: blur(var(--tc-content-hidden-soft)); }
.ui-chd-badge { fill: var(--tc-content-hidden-badge); }
.ui-chd-eye { fill: none; stroke: var(--tc-content-hidden-ink); stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
.ui-chd-caption { position: absolute; right: 0; bottom: 0; left: 0; margin: 0; color: var(--tc-text-primary); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); text-align: center; }
.ui-chd-mark { transform-box: fill-box; transform-origin: center; animation: ui-chd-settle var(--tc-content-hidden-beat) var(--tc-ease-standard) 3; }
@keyframes ui-chd-settle { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }

/* Off screen or in a hidden tab: the loop holds still */
[data-ui="chd"][data-paused] .ui-chd-mark { animation-play-state: paused; }

@media (prefers-reduced-motion: reduce) {
  .ui-chd-mark { animation: none; }
}
`;

/**
 * A blurred picture behind a crossed-out eye, for objectionable content that's been covered.
 * @tag tc-content-hidden
 */
export class TcContentHidden extends TcElement {
  static override ui = "chd";
  static override looks = false;
  static override css = css;

  /** The words under the drawing; "" leaves them out */
  @property() accessor caption = "Content hidden";
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
    return html`<svg class="ui-chd-art" viewBox="0 0 320 240" aria-hidden="true">${svg`
      <rect class="ui-chd-card" x="70" y="24" width="180" height="130" rx="12"></rect>
      <circle class="ui-chd-shape" cx="112" cy="62" r="20"></circle>
      <path class="ui-chd-shape" d="M92 136l40-36 30 24 24-18 36 30Z"></path>
      <g class="ui-chd-mark">
        <circle class="ui-chd-badge" cx="160" cy="89" r="28"></circle>
        <g class="ui-chd-eye" transform="translate(142 71) scale(1.5)"><path d="M10.7 5.1A11 11 0 0 1 22 12a11 11 0 0 1-2.3 3.2M6.6 6.6A11 11 0 0 0 2 12a11 11 0 0 0 14.8 5.3"></path><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"></path><path d="m2 2 20 20"></path></g>
      </g>`}</svg>
      ${this.caption ? html`<p class="ui-chd-caption">${this.caption}</p>` : nothing}`;
  }
}

if (!customElements.get("tc-content-hidden")) customElements.define("tc-content-hidden", TcContentHidden);

declare global {
  interface HTMLElementTagNameMap {
    "tc-content-hidden": TcContentHidden;
  }
}
