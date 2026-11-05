import { html, nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { OnScreenController } from "./internal/controllers";

/*
 * <tc-processing> – a document with a progress ring on it, for a long job that's still running – an export, a scan, an
 * import, an agent's background task – so people know it's under way and can leave. The ring turns a few times and rests
 * part-way round. Drawn like the other state illustrations (something-wrong, no-access,
 * malware-blocked, content-hidden): a soft tile, one pastel mark with a darker edge and ink, and a soft glow beneath.
 * Drawn on a 320 × 240 viewBox inside a 3 : 2 frame, with its words as real text under the drawing.
 *
 *   <tc-processing caption="Processing"></tc-processing>
 *
 * It says what's happened, so unlike a decorative illustration the host is an image named by `label`, or else by
 * `caption`. Set caption="" and leave `label` empty when the words beside it already say so: it's then decorative. The
 * loop runs a few cycles and rests, holds still off screen or in a hidden tab (data-paused) and stays still with reduced
 * motion. Colours follow the page theme through light-dark(). It's only a picture: it doesn't track any progress – pair
 * it with a progress bar or a time estimate when there is one.
 */

const css = /* css */ `
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

[data-ui="pcs"] {
  --tc-processing-page: light-dark(#ffffff, #2a2a2e);
  --tc-processing-edge: light-dark(#e4e7ec, rgba(255, 255, 255, 0.1));
  --tc-processing-fold: light-dark(#eef1f5, #35373d);
  --tc-processing-line: light-dark(#e6e9ee, #44464d);
  --tc-processing-mark: light-dark(#d9f2f2, #1d3c3d);
  --tc-processing-mark-edge: light-dark(#a6dcdc, #3f7f80);
  --tc-processing-ink: light-dark(#1d6b6b, #c4ecec);
  --tc-processing-glow: light-dark(rgba(110, 200, 200, 0.26), rgba(110, 200, 200, 0.12));
  --tc-processing-soft: 12px;
  --tc-processing-beat: 3.2s;
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  font-family: var(--tc-font-sans);
}
.ui-pcs-art { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
.ui-pcs-page { fill: var(--tc-processing-page); stroke: var(--tc-processing-edge); }
.ui-pcs-fold { fill: var(--tc-processing-fold); }
.ui-pcs-line { fill: var(--tc-processing-line); }
.ui-pcs-badge { fill: var(--tc-processing-mark); stroke: var(--tc-processing-mark-edge); stroke-width: 4; stroke-linejoin: round; }
.ui-pcs-track { fill: none; stroke: var(--tc-processing-mark-edge); stroke-width: 5; }
.ui-pcs-ink { fill: none; stroke: var(--tc-processing-ink); stroke-width: 5; stroke-linecap: round; }
.ui-pcs-glow { fill: var(--tc-processing-glow); filter: blur(var(--tc-processing-soft)); animation: ui-pcs-breathe var(--tc-processing-beat) var(--tc-ease-standard) 3; }
.ui-pcs-caption { position: absolute; right: 0; bottom: 0; left: 0; margin: 0; color: var(--tc-text-primary); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); text-align: center; }
.ui-pcs-ring { transform-origin: 160px 126px; animation: ui-pcs-turn var(--tc-processing-beat) var(--tc-ease-standard) 3; }
@keyframes ui-pcs-turn { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes ui-pcs-breathe { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

/* Off screen or in a hidden tab: the loop holds still */
[data-ui="pcs"][data-paused] :is(.ui-pcs-ring, .ui-pcs-glow) { animation-play-state: paused; }

@media (prefers-reduced-motion: reduce) {
  .ui-pcs-ring, .ui-pcs-glow { animation: none; }
}
@media (forced-colors: active) {
  .ui-pcs-art { forced-color-adjust: auto; }
}
`;

/**
 * A document with a progress ring on it, for a long job that's still running.
 * @tag tc-processing
 */
export class TcProcessing extends TcElement {
  static override ui = "pcs";
  static override looks = false;
  static override css = css;

  /** The words under the drawing; "" leaves them out */
  @property() accessor caption = "Processing";
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
    return html`<svg class="ui-pcs-art" viewBox="0 0 320 240" aria-hidden="true">${svg`
      <ellipse class="ui-pcs-glow" cx="160" cy="168" rx="92" ry="14"></ellipse>
      <path class="ui-pcs-page" d="M124 26h50l26 26v92a12 12 0 0 1-12 12h-64a12 12 0 0 1-12-12V38a12 12 0 0 1 12-12Z" stroke-width="2"></path>
      <path class="ui-pcs-fold" d="M174 26v18a8 8 0 0 0 8 8h18Z"></path>
      <rect class="ui-pcs-line" x="126" y="48" width="36" height="6" rx="3"></rect>
      <rect class="ui-pcs-line" x="126" y="62" width="52" height="6" rx="3"></rect>
      <rect class="ui-pcs-line" x="126" y="76" width="44" height="6" rx="3"></rect>
      <circle class="ui-pcs-badge" cx="160" cy="126" r="30"></circle>
      <circle class="ui-pcs-track" cx="160" cy="126" r="15"></circle>
      <path class="ui-pcs-ring ui-pcs-ink" d="M160 111a15 15 0 1 1-15 15"></path>`}</svg>
      ${this.caption ? html`<p class="ui-pcs-caption">${this.caption}</p>` : nothing}`;
  }
}

if (!customElements.get("tc-processing")) customElements.define("tc-processing", TcProcessing);

declare global {
  interface HTMLElementTagNameMap {
    "tc-processing": TcProcessing;
  }
}
