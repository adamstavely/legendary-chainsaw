import { html, nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { OnScreenController } from "./internal/controllers";

/*
 * <tc-in-quality-control> – a document with a magnifying glass over a check on it, for content being checked before it moves on. On the badge, a magnifying glass over a check mark, sweeping across a few times, then it rests.
 * One of the workflow stages beside awaiting-review – in-translation, in-quality-control, in-coordination,
 * pending-release and released – drawn the same way: a soft page tile, one pastel badge with a darker edge and ink,
 * and a soft glow beneath. Drawn on a 320 × 240 viewBox inside a 3 : 2 frame, with its words as real text under it.
 *
 *   <tc-in-quality-control caption="In quality control"></tc-in-quality-control>
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

[data-ui="iqc"] {
  --tc-in-quality-control-page: light-dark(#ffffff, #2a2a2e);
  --tc-in-quality-control-edge: light-dark(#e4e7ec, rgba(255, 255, 255, 0.1));
  --tc-in-quality-control-fold: light-dark(#eef1f5, #35373d);
  --tc-in-quality-control-line: light-dark(#e6e9ee, #44464d);
  --tc-in-quality-control-mark: light-dark(#dce8fb, #263a5c);
  --tc-in-quality-control-mark-edge: light-dark(#8fb0e8, #6f93d1);
  --tc-in-quality-control-ink: light-dark(#2f5ea8, #cfdffb);
  --tc-in-quality-control-glow: light-dark(rgba(120, 160, 230, 0.24), rgba(120, 160, 230, 0.12));
  --tc-in-quality-control-soft: 12px;
  --tc-in-quality-control-beat: 3.2s;
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  font-family: var(--tc-font-sans);
}
.ui-iqc-art { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
.ui-iqc-page { fill: var(--tc-in-quality-control-page); stroke: var(--tc-in-quality-control-edge); }
.ui-iqc-fold { fill: var(--tc-in-quality-control-fold); }
.ui-iqc-line { fill: var(--tc-in-quality-control-line); }
.ui-iqc-badge { fill: var(--tc-in-quality-control-mark); stroke: var(--tc-in-quality-control-mark-edge); stroke-width: 4; stroke-linejoin: round; }
.ui-iqc-ink { fill: none; stroke: var(--tc-in-quality-control-ink); stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; }
.ui-iqc-glow { fill: var(--tc-in-quality-control-glow); filter: blur(var(--tc-in-quality-control-soft)); animation: ui-iqc-breathe var(--tc-in-quality-control-beat) var(--tc-ease-standard) 3; }
.ui-iqc-caption { position: absolute; right: 0; bottom: 0; left: 0; margin: 0; color: var(--tc-text-primary); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); text-align: center; }
.ui-iqc-lens { fill: var(--tc-in-quality-control-page); stroke: var(--tc-in-quality-control-ink); stroke-width: 4; }
.ui-iqc-motif { animation: ui-iqc-sweep var(--tc-in-quality-control-beat) var(--tc-ease-move) 3; }
@keyframes ui-iqc-sweep { 0%, 100% { transform: translateX(0); } 30% { transform: translateX(-5px); } 65% { transform: translateX(5px); } }
@keyframes ui-iqc-breathe { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

/* Off screen or in a hidden tab: the motion holds still */
[data-ui="iqc"][data-paused] :is(.ui-iqc-motif, .ui-iqc-motif, .ui-iqc-glow) { animation-play-state: paused; }

@media (prefers-reduced-motion: reduce) {
  .ui-iqc-motif, .ui-iqc-motif, .ui-iqc-glow { animation: none; }
}
@media (forced-colors: active) {
  .ui-iqc-art { forced-color-adjust: auto; }
}
`;

/**
 * A document with a magnifying glass over a check on it, for content being checked before it moves on.
 * @tag tc-in-quality-control
 */
export class TcInQualityControl extends TcElement {
  static override ui = "iqc";
  static override looks = false;
  static override css = css;

  /** The words under the drawing; "" leaves them out */
  @property() accessor caption = "In quality control";
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
    return html`<svg class="ui-iqc-art" viewBox="0 0 320 240" aria-hidden="true">${svg`
      <ellipse class="ui-iqc-glow" cx="160" cy="168" rx="92" ry="14"></ellipse>
      <path class="ui-iqc-page" d="M124 26h50l26 26v92a12 12 0 0 1-12 12h-64a12 12 0 0 1-12-12V38a12 12 0 0 1 12-12Z" stroke-width="2"></path>
      <path class="ui-iqc-fold" d="M174 26v18a8 8 0 0 0 8 8h18Z"></path>
      <rect class="ui-iqc-line" x="126" y="48" width="36" height="6" rx="3"></rect>
      <rect class="ui-iqc-line" x="126" y="62" width="52" height="6" rx="3"></rect>
      <rect class="ui-iqc-line" x="126" y="76" width="44" height="6" rx="3"></rect>
      <circle class="ui-iqc-badge" cx="160" cy="126" r="30"></circle>
      <g class="ui-iqc-motif">
        <circle class="ui-iqc-lens" cx="156" cy="121" r="12"></circle>
        <path class="ui-iqc-ink" d="M150 121l4 4 8-8M165 130l10 10"></path>
      </g>`}</svg>
      ${this.caption ? html`<p class="ui-iqc-caption">${this.caption}</p>` : nothing}`;
  }
}

if (!customElements.get("tc-in-quality-control")) customElements.define("tc-in-quality-control", TcInQualityControl);

declare global {
  interface HTMLElementTagNameMap {
    "tc-in-quality-control": TcInQualityControl;
  }
}
