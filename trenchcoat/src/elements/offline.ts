import { html, nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { OnScreenController } from "./internal/controllers";

/*
 * <tc-offline> – a cloud and a device with the dashed link between them broken, for a page that can't reach the server right
 * now. Calmer than something-wrong: the connection will come back. The dashes drift a few times and rest.
 * Drawn like the other state illustrations (something-wrong, no-access, malware-blocked): a soft tile, one pastel mark
 * with a darker edge and ink, chunky rounded strokes, and a soft glow beneath.
 * Drawn on a 320 × 240 viewBox inside a 3 : 2 frame, with its words as real text under the drawing.
 *
 *   <tc-offline caption="You're offline"></tc-offline>
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

[data-ui="ofl"] {
  --tc-offline-tile: light-dark(#ffffff, #2a2a2e);
  --tc-offline-edge: light-dark(#e4e7ec, rgba(255, 255, 255, 0.1));
  --tc-offline-bar: light-dark(#e6e9ee, #44464d);
  --tc-offline-mark: light-dark(#dce8fb, #263a5c);
  --tc-offline-mark-edge: light-dark(#8fb0e8, #6f93d1);
  --tc-offline-ink: light-dark(#2f5ea8, #cfdffb);
  --tc-offline-glow: light-dark(rgba(120, 160, 230, 0.22), rgba(120, 160, 230, 0.1));
  --tc-offline-soft: 12px;
  --tc-offline-beat: 3.2s;
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  font-family: var(--tc-font-sans);
}
.ui-ofl-art { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
.ui-ofl-tile { fill: var(--tc-offline-tile); stroke: var(--tc-offline-edge); }
.ui-ofl-bar { fill: var(--tc-offline-bar); }
.ui-ofl-cloud { fill: var(--tc-offline-mark); stroke: var(--tc-offline-mark-edge); stroke-width: 4; stroke-linejoin: round; }
.ui-ofl-link { fill: none; stroke: var(--tc-offline-ink); stroke-width: 4; stroke-linecap: round; stroke-dasharray: 5 7; }
.ui-ofl-slash { fill: none; stroke: var(--tc-offline-ink); stroke-width: 3.5; stroke-linecap: round; }
.ui-ofl-glow { fill: var(--tc-offline-glow); filter: blur(var(--tc-offline-soft)); animation: ui-ofl-breathe var(--tc-offline-beat) var(--tc-ease-standard) 3; }
.ui-ofl-link { animation: ui-ofl-drift var(--tc-offline-beat) linear 3; }
@keyframes ui-ofl-drift { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -24; } }
@keyframes ui-ofl-breathe { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
.ui-ofl-caption { position: absolute; right: 0; bottom: 0; left: 0; margin: 0; color: var(--tc-text-primary); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); text-align: center; }

/* Off screen or in a hidden tab: the loop holds still */
[data-ui="ofl"][data-paused] :is(.ui-ofl-link, .ui-ofl-glow) { animation-play-state: paused; }

@media (prefers-reduced-motion: reduce) {
  .ui-ofl-link, .ui-ofl-glow { animation: none; }
}
@media (forced-colors: active) {
  .ui-ofl-art { forced-color-adjust: auto; }
}
`;

/**
 * A cloud and a device with the dashed link between them broken, for a page that can't reach the server right now.
 * @tag tc-offline
 */
export class TcOffline extends TcElement {
  static override ui = "ofl";
  static override looks = false;
  static override css = css;

  /** The words under the drawing; "" leaves them out */
  @property() accessor caption = "You're offline";
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
    return html`<svg class="ui-ofl-art" viewBox="0 0 320 240" aria-hidden="true">${svg`
      <ellipse class="ui-ofl-glow" cx="160" cy="166" rx="100" ry="12"></ellipse>
      <path class="ui-ofl-cloud" d="M80 132h52a20 20 0 0 0 2-40 28 28 0 0 0-54-4 22 22 0 0 0 0 44Z"></path>
      <path class="ui-ofl-link" d="M142 112h17M175 112h13"></path>
      <path class="ui-ofl-slash" d="m161 100 12 24"></path>
      <rect class="ui-ofl-tile" x="192" y="78" width="68" height="64" rx="14" stroke-width="2"></rect>
      <rect class="ui-ofl-bar" x="206" y="96" width="40" height="6" rx="3"></rect>
      <rect class="ui-ofl-bar" x="206" y="110" width="26" height="6" rx="3"></rect>
      <rect class="ui-ofl-bar" x="206" y="124" width="34" height="6" rx="3"></rect>`}</svg>
      ${this.caption ? html`<p class="ui-ofl-caption">${this.caption}</p>` : nothing}`;
  }
}

if (!customElements.get("tc-offline")) customElements.define("tc-offline", TcOffline);

declare global {
  interface HTMLElementTagNameMap {
    "tc-offline": TcOffline;
  }
}
