import { html, nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { OnScreenController } from "./internal/controllers";

/*
 * <tc-upload-failed> – a file lifted above an open tray, its upload arrow stopping short, with a round badge and a cross,
 * for an upload that didn't finish: too large, the wrong type, or the connection dropped. The file rises a little and
 * drops back a few times, then rests.
 * Drawn like the other state illustrations (something-wrong, no-access, malware-blocked): soft tiles, one pastel mark
 * with a darker edge and ink, chunky rounded strokes, and a soft glow beneath. On a 320 × 240 viewBox inside a 3 : 2
 * frame, with its words as real text under the drawing.
 *
 *   <tc-upload-failed caption="Upload failed"></tc-upload-failed>
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

[data-ui="upf"] {
  --tc-upload-failed-tile: light-dark(#ffffff, #2a2a2e);
  --tc-upload-failed-edge: light-dark(#e4e7ec, rgba(255, 255, 255, 0.1));
  --tc-upload-failed-slot: light-dark(#eef1f5, #35373d);
  --tc-upload-failed-line: light-dark(#e6e9ee, #44464d);
  --tc-upload-failed-wire: light-dark(#c3cad4, #5c6068);
  --tc-upload-failed-mark: light-dark(#fde2df, #5a2724);
  --tc-upload-failed-mark-edge: light-dark(#f0a197, #c96a60);
  --tc-upload-failed-ink: light-dark(#a8231a, #fbd2cd);
  --tc-upload-failed-glow: light-dark(rgba(240, 112, 102, 0.2), rgba(240, 112, 102, 0.1));
  --tc-upload-failed-soft: 12px;
  --tc-upload-failed-beat: 3s;
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  font-family: var(--tc-font-sans);
}
.ui-upf-art { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
.ui-upf-tile { fill: var(--tc-upload-failed-tile); stroke: var(--tc-upload-failed-edge); }
.ui-upf-slot { fill: var(--tc-upload-failed-slot); }
.ui-upf-line { fill: var(--tc-upload-failed-line); }
.ui-upf-arrow { fill: none; stroke: var(--tc-upload-failed-wire); stroke-width: 5; stroke-linecap: round; stroke-linejoin: round; }
.ui-upf-badge { fill: var(--tc-upload-failed-mark); stroke: var(--tc-upload-failed-mark-edge); stroke-width: 4; }
.ui-upf-ink { fill: none; stroke: var(--tc-upload-failed-ink); stroke-width: 4; stroke-linecap: round; }
.ui-upf-glow { fill: var(--tc-upload-failed-glow); filter: blur(var(--tc-upload-failed-soft)); animation: ui-upf-breathe var(--tc-upload-failed-beat) var(--tc-ease-standard) 3; }
.ui-upf-caption { position: absolute; right: 0; bottom: 0; left: 0; margin: 0; color: var(--tc-text-primary); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); text-align: center; }
.ui-upf-file { animation: ui-upf-lift var(--tc-upload-failed-beat) var(--tc-ease-standard) 3; }
@keyframes ui-upf-lift { 0%, 100% { transform: translateY(0); } 40% { transform: translateY(-7px); } 70% { transform: translateY(1px); } }
@keyframes ui-upf-breathe { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

/* Off screen or in a hidden tab: the loop holds still */
[data-ui="upf"][data-paused] :is(.ui-upf-file, .ui-upf-glow) { animation-play-state: paused; }

@media (prefers-reduced-motion: reduce) {
  .ui-upf-file, .ui-upf-glow { animation: none; }
}
@media (forced-colors: active) {
  .ui-upf-art { forced-color-adjust: auto; }
}
`;

/**
 * A file lifted above an open tray, its upload arrow stopping short, with a cross badge, for an upload that didn't finish.
 * @tag tc-upload-failed
 */
export class TcUploadFailed extends TcElement {
  static override ui = "upf";
  static override looks = false;
  static override css = css;

  /** The words under the drawing; "" leaves them out */
  @property() accessor caption = "Upload failed";
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
    return html`<svg class="ui-upf-art" viewBox="0 0 320 240" aria-hidden="true">${svg`
      <ellipse class="ui-upf-glow" cx="160" cy="180" rx="96" ry="12"></ellipse>
      <rect class="ui-upf-tile" x="88" y="126" width="144" height="44" rx="14" stroke-width="2"></rect>
      <rect class="ui-upf-slot" x="104" y="136" width="112" height="9" rx="4.5"></rect>
      <g class="ui-upf-file">
        <rect class="ui-upf-tile" x="124" y="24" width="72" height="88" rx="12" stroke-width="2"></rect>
        <rect class="ui-upf-line" x="136" y="38" width="32" height="6" rx="3"></rect>
        <rect class="ui-upf-line" x="136" y="50" width="22" height="6" rx="3"></rect>
        <path class="ui-upf-arrow" d="M160 100V72M149 82l11-11 11 11"></path>
        <circle class="ui-upf-badge" cx="196" cy="30" r="19"></circle>
        <path class="ui-upf-ink" d="m189 23 14 14M203 23l-14 14"></path>
      </g>`}</svg>
      ${this.caption ? html`<p class="ui-upf-caption">${this.caption}</p>` : nothing}`;
  }
}

if (!customElements.get("tc-upload-failed")) customElements.define("tc-upload-failed", TcUploadFailed);

declare global {
  interface HTMLElementTagNameMap {
    "tc-upload-failed": TcUploadFailed;
  }
}
