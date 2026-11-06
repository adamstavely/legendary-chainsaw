import { html, nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { OnScreenController } from "./internal/controllers";

/*
 * <tc-soup-cans> – three plain soup cans with no labels, standing in a cluster at different heights, with ridge rings
 * round each; the short one in front wobbles a couple of times and rests. Drawn like the state illustrations (awaiting-review, all-done, no-access): soft pastel
 * shapes with a darker edge and ink, and a soft glow beneath. Drawn on a 320 × 240 viewBox inside a 3 : 2 frame.
 *
 *   <tc-soup-cans></tc-soup-cans>
 *   <tc-soup-cans caption="Nothing sorted yet"></tc-soup-cans>
 *
 * It's decorative unless it's given words: a `caption` shows as real text under the drawing and names it, or `label`
 * names it without showing anything; the host is then role="img". The motion is finite, holds still off screen or in a
 * hidden tab (data-paused) and stays still with reduced motion. Colours follow the page theme through light-dark().
 */

const css = /* css */ `
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

[data-ui="sop"] {
  --tc-soup-cans-tin: light-dark(#e3e9f2, #2f3846);
  --tc-soup-cans-shade: light-dark(#cdd7e5, #262d39);
  --tc-soup-cans-lid: light-dark(#f1f4f9, #46526a);
  --tc-soup-cans-well: light-dark(#dfe6f0, #36404f);
  --tc-soup-cans-edge: light-dark(#a7b6cc, #8293ad);
  --tc-soup-cans-ink: light-dark(#4a5d7a, #d6dfec);
  --tc-soup-cans-glow: light-dark(rgba(130, 150, 190, 0.26), rgba(130, 150, 190, 0.13));
  --tc-soup-cans-soft: 12px;
  --tc-soup-cans-beat: 3.2s;
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  font-family: var(--tc-font-sans);
}
.ui-sop-art { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
.ui-sop-body { fill: var(--tc-soup-cans-tin); stroke: var(--tc-soup-cans-edge); stroke-width: 3.5; stroke-linejoin: round; }
.ui-sop-lid { fill: var(--tc-soup-cans-lid); stroke: var(--tc-soup-cans-edge); stroke-width: 3.5; }
.ui-sop-rib { fill: none; stroke: var(--tc-soup-cans-edge); stroke-width: 2.5; stroke-linecap: round; }
.ui-sop-ridge { fill: none; stroke: var(--tc-soup-cans-edge); stroke-width: 2; stroke-linecap: round; opacity: 0.75; }
.ui-sop-shine { fill: none; stroke: var(--tc-soup-cans-lid); stroke-width: 5; stroke-linecap: round; }
.ui-sop-shade { fill: var(--tc-soup-cans-shade); }
.ui-sop-well { fill: var(--tc-soup-cans-well); stroke: var(--tc-soup-cans-edge); stroke-width: 2; }
.ui-sop-ink { fill: none; stroke: var(--tc-soup-cans-ink); stroke-width: 2.5; }
.ui-sop-tab { fill: var(--tc-soup-cans-lid); stroke: var(--tc-soup-cans-ink); stroke-width: 2.5; stroke-linejoin: round; }
.ui-sop-rivet { fill: var(--tc-soup-cans-ink); }
.ui-sop-glow { fill: var(--tc-soup-cans-glow); filter: blur(var(--tc-soup-cans-soft)); animation: ui-sop-breathe var(--tc-soup-cans-beat) var(--tc-ease-standard) 2; }
.ui-sop-front { transform-box: fill-box; transform-origin: 50% 100%; animation: ui-sop-rock var(--tc-soup-cans-beat) var(--tc-ease-move) 2; }
.ui-sop-caption { position: absolute; right: 0; bottom: 0; left: 0; margin: 0; color: var(--tc-text-primary); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); text-align: center; }
@keyframes ui-sop-rock { 0%, 45%, 100% { transform: rotate(0deg); } 15% { transform: rotate(-3deg); } 30% { transform: rotate(2deg); } }
@keyframes ui-sop-breathe { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

/* Off screen or in a hidden tab: the motion holds still */
[data-ui="sop"][data-paused] :is(.ui-sop-front, .ui-sop-glow) { animation-play-state: paused; }

@media (prefers-reduced-motion: reduce) {
  .ui-sop-front, .ui-sop-glow { animation: none; }
}
@media (forced-colors: active) {
  .ui-sop-art { forced-color-adjust: auto; }
}
`;

/**
 * Three plain soup cans with no labels, standing together at different heights.
 * @tag tc-soup-cans
 */
export class TcSoupCans extends TcElement {
  static override ui = "sop";
  static override looks = false;
  static override css = css;

  /** Words under the drawing, which also name it; "" (the default) leaves them out */
  @property() accessor caption = "";
  /** Accessible name without visible words; with neither, it's decorative */
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
    return html`<svg class="ui-sop-art" viewBox="0 0 320 240" aria-hidden="true">${svg`
      <ellipse class="ui-sop-glow" cx="160" cy="182" rx="92" ry="14"></ellipse>
      <g class="ui-sop-can">
        <path class="ui-sop-body" d="M88 50V150A34 10 0 0 0 156 150V50Z"></path>
        <path class="ui-sop-shade" d="M135.6 50V159.2A34 10 0 0 0 156 150V50Z"></path>
        <path class="ui-sop-shine" d="M99 70V136"></path>
        <path class="ui-sop-ridge" d="M88 82A34 10 0 0 0 156 82M88 87A34 10 0 0 0 156 87M88 92A34 10 0 0 0 156 92M88 110A34 10 0 0 0 156 110M88 115A34 10 0 0 0 156 115M88 120A34 10 0 0 0 156 120"></path>
        <path class="ui-sop-rib" d="M88 144A34 10 0 0 0 156 144"></path>
        <ellipse class="ui-sop-lid" cx="122" cy="50" rx="36" ry="11"></ellipse>
        <ellipse class="ui-sop-well" cx="122" cy="51.5" rx="29" ry="7"></ellipse>
        
        <ellipse class="ui-sop-ink" cx="122" cy="51.5" rx="21" ry="4.5"></ellipse>
      </g>
      <g class="ui-sop-can">
        <path class="ui-sop-body" d="M162 80V150A34 10 0 0 0 230 150V80Z"></path>
        <path class="ui-sop-shade" d="M209.6 80V159.2A34 10 0 0 0 230 150V80Z"></path>
        <path class="ui-sop-shine" d="M173 100V136"></path>
        <path class="ui-sop-ridge" d="M162 111A34 10 0 0 0 230 111M162 116A34 10 0 0 0 230 116M162 121A34 10 0 0 0 230 121"></path>
        <path class="ui-sop-rib" d="M162 144A34 10 0 0 0 230 144"></path>
        <ellipse class="ui-sop-lid" cx="196" cy="80" rx="36" ry="11"></ellipse>
        <ellipse class="ui-sop-well" cx="196" cy="81.5" rx="29" ry="7"></ellipse>
        
        <ellipse class="ui-sop-ink" cx="196" cy="81.5" rx="21" ry="4.5"></ellipse>
      </g>
      <g class="ui-sop-can ui-sop-front">
        <path class="ui-sop-body" d="M122 114V178A35 10 0 0 0 192 178V114Z"></path>
        <path class="ui-sop-shade" d="M171.0 114V187.2A35 10 0 0 0 192 178V114Z"></path>
        <path class="ui-sop-shine" d="M133 134V164"></path>
        <path class="ui-sop-ridge" d="M122 142A35 10 0 0 0 192 142M122 147A35 10 0 0 0 192 147M122 152A35 10 0 0 0 192 152"></path>
        <path class="ui-sop-rib" d="M122 172A35 10 0 0 0 192 172"></path>
        <ellipse class="ui-sop-lid" cx="157" cy="114" rx="37" ry="11"></ellipse>
        <ellipse class="ui-sop-well" cx="157" cy="115.5" rx="30" ry="7"></ellipse>
        
        <ellipse class="ui-sop-tab" cx="164" cy="116" rx="9" ry="3.5"></ellipse>
        <circle class="ui-sop-rivet" cx="154" cy="116" r="2.5"></circle>
      </g>`}</svg>
      ${this.caption ? html`<p class="ui-sop-caption">${this.caption}</p>` : nothing}`;
  }
}

if (!customElements.get("tc-soup-cans")) customElements.define("tc-soup-cans", TcSoupCans);

declare global {
  interface HTMLElementTagNameMap {
    "tc-soup-cans": TcSoupCans;
  }
}
