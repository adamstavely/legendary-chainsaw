import { html, nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { OnScreenController } from "./internal/controllers";

/*
 * <tc-limit-reached> – a gauge at the end of its range with a clock beside it, for work that's stopped until a quota or rate
 * limit resets. The needle nudges against the end a few times and settles.
 * Drawn like the other state illustrations (something-wrong, no-access, malware-blocked): a soft tile, one pastel mark
 * with a darker edge and ink, chunky rounded strokes, and a soft glow beneath.
 * Drawn on a 320 × 240 viewBox inside a 3 : 2 frame, with its words as real text under the drawing.
 *
 *   <tc-limit-reached caption="Usage limit reached"></tc-limit-reached>
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

[data-ui="ulm"] {
  --tc-limit-reached-tile: light-dark(#ffffff, #2a2a2e);
  --tc-limit-reached-edge: light-dark(#e4e7ec, rgba(255, 255, 255, 0.1));
  --tc-limit-reached-bar: light-dark(#e6e9ee, #44464d);
  --tc-limit-reached-mark: light-dark(#fbe7cf, #5a4426);
  --tc-limit-reached-mark-edge: light-dark(#e9b872, #c79a57);
  --tc-limit-reached-ink: light-dark(#8a5a17, #f3d6a6);
  --tc-limit-reached-glow: light-dark(rgba(250, 176, 130, 0.22), rgba(250, 176, 130, 0.1));
  --tc-limit-reached-soft: 12px;
  --tc-limit-reached-beat: 3s;
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  font-family: var(--tc-font-sans);
}
.ui-ulm-art { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
.ui-ulm-tile { fill: var(--tc-limit-reached-tile); stroke: var(--tc-limit-reached-edge); }
.ui-ulm-track { fill: none; stroke: var(--tc-limit-reached-bar); stroke-width: 12; stroke-linecap: round; }
.ui-ulm-arc { fill: none; stroke: var(--tc-limit-reached-mark-edge); stroke-width: 12; stroke-linecap: round; }
.ui-ulm-needle { fill: none; stroke: var(--tc-limit-reached-ink); stroke-width: 5; stroke-linecap: round; }
.ui-ulm-hub { fill: var(--tc-limit-reached-ink); }
.ui-ulm-clock { fill: var(--tc-limit-reached-mark); stroke: var(--tc-limit-reached-mark-edge); stroke-width: 4; }
.ui-ulm-hands { fill: none; stroke: var(--tc-limit-reached-ink); stroke-width: 3.5; stroke-linecap: round; stroke-linejoin: round; }
.ui-ulm-glow { fill: var(--tc-limit-reached-glow); filter: blur(var(--tc-limit-reached-soft)); animation: ui-ulm-breathe var(--tc-limit-reached-beat) var(--tc-ease-standard) 3; }
.ui-ulm-swing { transform-box: view-box; transform-origin: 160px 128px; animation: ui-ulm-nudge var(--tc-limit-reached-beat) var(--tc-ease-standard) 3; }
@keyframes ui-ulm-nudge { 0%, 100% { transform: rotate(0deg); } 30% { transform: rotate(-9deg); } 55% { transform: rotate(3deg); } 75% { transform: rotate(-1deg); } }
@keyframes ui-ulm-breathe { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
.ui-ulm-caption { position: absolute; right: 0; bottom: 0; left: 0; margin: 0; color: var(--tc-text-primary); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); text-align: center; }

/* Off screen or in a hidden tab: the loop holds still */
[data-ui="ulm"][data-paused] :is(.ui-ulm-swing, .ui-ulm-glow) { animation-play-state: paused; }

@media (prefers-reduced-motion: reduce) {
  .ui-ulm-swing, .ui-ulm-glow { animation: none; }
}
@media (forced-colors: active) {
  .ui-ulm-art { forced-color-adjust: auto; }
}
`;

/**
 * A gauge at the end of its range with a clock beside it, for work that's stopped until a quota or rate limit resets.
 * @tag tc-limit-reached
 */
export class TcLimitReached extends TcElement {
  static override ui = "ulm";
  static override looks = false;
  static override css = css;

  /** The words under the drawing; "" leaves them out */
  @property() accessor caption = "Usage limit reached";
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
    return html`<svg class="ui-ulm-art" viewBox="0 0 320 240" aria-hidden="true">${svg`
      <ellipse class="ui-ulm-glow" cx="160" cy="166" rx="96" ry="12"></ellipse>
      <rect class="ui-ulm-tile" x="96" y="56" width="128" height="100" rx="16" stroke-width="2"></rect>
      <path class="ui-ulm-track" d="M122 128a38 38 0 0 1 76 0"></path>
      <path class="ui-ulm-arc" d="M122 128a38 38 0 0 1 76 0"></path>
      <g class="ui-ulm-swing"><path class="ui-ulm-needle" d="M160 128 192 125"></path></g>
      <circle class="ui-ulm-hub" cx="160" cy="128" r="6"></circle>
      <circle class="ui-ulm-clock" cx="220" cy="62" r="20"></circle>
      <path class="ui-ulm-hands" d="M220 52v10l7 4"></path>`}</svg>
      ${this.caption ? html`<p class="ui-ulm-caption">${this.caption}</p>` : nothing}`;
  }
}

if (!customElements.get("tc-limit-reached")) customElements.define("tc-limit-reached", TcLimitReached);

declare global {
  interface HTMLElementTagNameMap {
    "tc-limit-reached": TcLimitReached;
  }
}
