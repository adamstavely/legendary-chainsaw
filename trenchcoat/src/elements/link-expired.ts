import { html, nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { OnScreenController } from "./internal/controllers";

/*
 * <tc-link-expired> – two chain links on a tile, parted, with a round clock badge, for a share link or invitation past
 * its date. The clock's hand ticks a few quarter turns and rests.
 * Drawn like the other state illustrations (something-wrong, no-access, malware-blocked): a soft tile, one pastel mark
 * with a darker edge and ink, chunky rounded strokes, and a soft glow beneath. On a 320 × 240 viewBox inside a 3 : 2
 * frame, with its words as real text under the drawing.
 *
 *   <tc-link-expired caption="This link has expired"></tc-link-expired>
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

[data-ui="lex"] {
  --tc-link-expired-tile: light-dark(#ffffff, #2a2a2e);
  --tc-link-expired-edge: light-dark(#e4e7ec, rgba(255, 255, 255, 0.1));
  --tc-link-expired-wire: light-dark(#c3cad4, #5c6068);
  --tc-link-expired-mark: light-dark(#fbe7cf, #5a4426);
  --tc-link-expired-mark-edge: light-dark(#e9b872, #c79a57);
  --tc-link-expired-ink: light-dark(#8a5a17, #f3d6a6);
  --tc-link-expired-glow: light-dark(rgba(250, 176, 130, 0.22), rgba(250, 176, 130, 0.1));
  --tc-link-expired-soft: 12px;
  --tc-link-expired-beat: 3s;
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  font-family: var(--tc-font-sans);
}
.ui-lex-art { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
.ui-lex-tile { fill: var(--tc-link-expired-tile); stroke: var(--tc-link-expired-edge); }
.ui-lex-chain { fill: none; stroke: var(--tc-link-expired-wire); stroke-width: 9; }
.ui-lex-badge { fill: var(--tc-link-expired-mark); stroke: var(--tc-link-expired-mark-edge); stroke-width: 4; }
.ui-lex-ink { fill: none; stroke: var(--tc-link-expired-ink); stroke-width: 4; stroke-linecap: round; }
.ui-lex-glow { fill: var(--tc-link-expired-glow); filter: blur(var(--tc-link-expired-soft)); animation: ui-lex-breathe var(--tc-link-expired-beat) var(--tc-ease-standard) 3; }
.ui-lex-caption { position: absolute; right: 0; bottom: 0; left: 0; margin: 0; color: var(--tc-text-primary); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); text-align: center; }
.ui-lex-hand { transform-box: view-box; transform-origin: 206px 60px; animation: ui-lex-tick var(--tc-link-expired-beat) var(--tc-ease-standard) 3; }
@keyframes ui-lex-tick { 0%, 30% { transform: rotate(0deg); } 45%, 100% { transform: rotate(90deg); } }
@keyframes ui-lex-breathe { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

/* Off screen or in a hidden tab: the loop holds still */
[data-ui="lex"][data-paused] :is(.ui-lex-hand, .ui-lex-glow) { animation-play-state: paused; }

@media (prefers-reduced-motion: reduce) {
  .ui-lex-hand, .ui-lex-glow { animation: none; }
}
@media (forced-colors: active) {
  .ui-lex-art { forced-color-adjust: auto; }
}
`;

/**
 * Two chain links on a tile, parted, with a clock badge, for a share link or invitation past its date.
 * @tag tc-link-expired
 */
export class TcLinkExpired extends TcElement {
  static override ui = "lex";
  static override looks = false;
  static override css = css;

  /** The words under the drawing; "" leaves them out */
  @property() accessor caption = "This link has expired";
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
    return html`<svg class="ui-lex-art" viewBox="0 0 320 240" aria-hidden="true">${svg`
      <ellipse class="ui-lex-glow" cx="160" cy="176" rx="96" ry="12"></ellipse>
      <rect class="ui-lex-tile" x="80" y="44" width="160" height="116" rx="16" stroke-width="2"></rect>
      <rect class="ui-lex-chain" x="96" y="98" width="56" height="28" rx="14" transform="rotate(-30 124 112)"></rect>
      <rect class="ui-lex-chain" x="166" y="82" width="56" height="28" rx="14" transform="rotate(-30 194 96)"></rect>
      <circle class="ui-lex-badge" cx="206" cy="60" r="24"></circle>
      <path class="ui-lex-ink" d="M206 60h9"></path>
      <path class="ui-lex-ink ui-lex-hand" d="M206 60V47"></path>`}</svg>
      ${this.caption ? html`<p class="ui-lex-caption">${this.caption}</p>` : nothing}`;
  }
}

if (!customElements.get("tc-link-expired")) customElements.define("tc-link-expired", TcLinkExpired);

declare global {
  interface HTMLElementTagNameMap {
    "tc-link-expired": TcLinkExpired;
  }
}
