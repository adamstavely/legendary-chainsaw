import { html, nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { OnScreenController } from "./internal/controllers";

/*
 * <tc-all-done> – an empty tray with a check above it, for an inbox or queue with nothing waiting. The check draws
 * itself in and the badge settles a few times, then rests. Drawn like the other state illustrations (something-wrong,
 * no-access, malware-blocked, content-hidden): a soft tile, one pastel mark with a darker edge and ink, and a soft glow
 * beneath. Drawn on a 320 × 240 viewBox inside a 3 : 2 frame, with its words as real text under the drawing.
 *
 *   <tc-all-done caption="You're all caught up"></tc-all-done>
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

[data-ui="ald"] {
  --tc-all-done-tray: light-dark(#ffffff, #2a2a2e);
  --tc-all-done-edge: light-dark(#e4e7ec, rgba(255, 255, 255, 0.1));
  --tc-all-done-rim: light-dark(#e6e9ee, #44464d);
  --tc-all-done-mark: light-dark(#dcf3e4, #1f3d2b);
  --tc-all-done-mark-edge: light-dark(#8fd1a8, #5fae7d);
  --tc-all-done-ink: light-dark(#1f6b3d, #c8efd6);
  --tc-all-done-glow: light-dark(rgba(110, 200, 145, 0.24), rgba(110, 200, 145, 0.12));
  --tc-all-done-soft: 12px;
  --tc-all-done-beat: 3s;
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  font-family: var(--tc-font-sans);
}
.ui-ald-art { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
.ui-ald-tray { fill: var(--tc-all-done-tray); stroke: var(--tc-all-done-edge); }
.ui-ald-rim { fill: none; stroke: var(--tc-all-done-rim); stroke-width: 5; stroke-linecap: round; stroke-linejoin: round; }
.ui-ald-badge { fill: var(--tc-all-done-mark); stroke: var(--tc-all-done-mark-edge); stroke-width: 4; }
.ui-ald-check { fill: none; stroke: var(--tc-all-done-ink); stroke-width: 5; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 36; stroke-dashoffset: 0; animation: ui-ald-draw calc(var(--tc-all-done-beat) / 4) var(--tc-ease-move) var(--tc-duration-fast) 1 backwards; }
.ui-ald-glow { fill: var(--tc-all-done-glow); filter: blur(var(--tc-all-done-soft)); animation: ui-ald-breathe var(--tc-all-done-beat) var(--tc-ease-standard) 3; }
.ui-ald-caption { position: absolute; right: 0; bottom: 0; left: 0; margin: 0; color: var(--tc-text-primary); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); text-align: center; }
.ui-ald-mark { transform-box: fill-box; transform-origin: center; animation: ui-ald-settle var(--tc-all-done-beat) var(--tc-ease-standard) 3; }
@keyframes ui-ald-draw { from { stroke-dashoffset: 36; } to { stroke-dashoffset: 0; } }
@keyframes ui-ald-settle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
@keyframes ui-ald-breathe { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

/* Off screen or in a hidden tab: the loops hold still */
[data-ui="ald"][data-paused] :is(.ui-ald-mark, .ui-ald-check, .ui-ald-glow) { animation-play-state: paused; }

@media (prefers-reduced-motion: reduce) {
  .ui-ald-mark, .ui-ald-check, .ui-ald-glow { animation: none; }
}
@media (forced-colors: active) {
  .ui-ald-art { forced-color-adjust: auto; }
}
`;

/**
 * An empty tray with a check above it, for an inbox or queue with nothing waiting.
 * @tag tc-all-done
 */
export class TcAllDone extends TcElement {
  static override ui = "ald";
  static override looks = false;
  static override css = css;

  /** The words under the drawing; "" leaves them out */
  @property() accessor caption = "You're all caught up";
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
    return html`<svg class="ui-ald-art" viewBox="0 0 320 240" aria-hidden="true">${svg`
      <ellipse class="ui-ald-glow" cx="160" cy="166" rx="96" ry="14"></ellipse>
      <rect class="ui-ald-tray" x="86" y="92" width="148" height="64" rx="14" stroke-width="2"></rect>
      <path class="ui-ald-rim" d="M104 116h24l8 12h48l8-12h24"></path>
      <g class="ui-ald-mark">
        <circle class="ui-ald-badge" cx="160" cy="70" r="28"></circle>
        <path class="ui-ald-check" d="M148 70l8 8 16-16"></path>
      </g>`}</svg>
      ${this.caption ? html`<p class="ui-ald-caption">${this.caption}</p>` : nothing}`;
  }
}

if (!customElements.get("tc-all-done")) customElements.define("tc-all-done", TcAllDone);

declare global {
  interface HTMLElementTagNameMap {
    "tc-all-done": TcAllDone;
  }
}
