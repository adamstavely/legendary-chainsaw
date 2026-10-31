import { html, svg } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { OnScreenController } from "./internal/controllers";

/*
 * <tc-something-wrong> – two connected tiles with the line between them broken, for a page or request that failed. The gap pulses a few times and rests, and nothing flashes.
 * Drawn on a 320 × 240 viewBox inside a 3 : 2 frame.
 *
 *   <tc-something-wrong label="Something went wrong"></tc-something-wrong>
 *
 * Decorative by default (aria-hidden on the host); with `label` the host is an image named by it. The loops run a few
 * cycles and rest, hold still off screen or in a hidden tab (data-paused) and stay still with reduced motion. Colours
 * follow the page theme through light-dark().
 */

const css = /* css */ `
/* Theme: every colour is light-dark(), which follows color-scheme – so dark works through .dark,
   data-theme / data-tc-theme and the OS setting alike */
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

[data-ui="swr"] {
  --tc-something-wrong-tile: light-dark(#ffffff, #2a2a2e);
  --tc-something-wrong-edge: light-dark(#e4e7ec, rgba(255, 255, 255, 0.1));
  --tc-something-wrong-bar: light-dark(#e6e9ee, #44464d);
  --tc-something-wrong-wire: light-dark(#c3cad4, #5c6068);
  --tc-something-wrong-mark: light-dark(#fbe7cf, #5a4426);
  --tc-something-wrong-mark-edge: light-dark(#e9b872, #c79a57);
  --tc-something-wrong-ink: light-dark(#8a5a17, #f3d6a6);
  --tc-something-wrong-glow: light-dark(rgba(250, 176, 130, 0.2), rgba(250, 176, 130, 0.1));
  --tc-something-wrong-soft: 12px;
  --tc-something-wrong-beat: 3s;
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 3 / 2;
  overflow: hidden;
}
.ui-swr-art { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
.ui-swr-tile { fill: var(--tc-something-wrong-tile); stroke: var(--tc-something-wrong-edge); }
.ui-swr-bar { fill: var(--tc-something-wrong-bar); }
.ui-swr-wire, .ui-swr-gap { stroke: var(--tc-something-wrong-wire); }
.ui-swr-mark { fill: var(--tc-something-wrong-mark); stroke: var(--tc-something-wrong-mark-edge); }
.ui-swr-ink { stroke: var(--tc-something-wrong-ink); }
.ui-swr-glow { fill: var(--tc-something-wrong-glow); }
.ui-swr-spark { animation: ui-swr-pulse var(--tc-something-wrong-beat) var(--tc-ease-standard) 3; }
.ui-swr-left { animation: ui-swr-left var(--tc-something-wrong-beat) var(--tc-ease-standard) 3; }
.ui-swr-right { animation: ui-swr-right var(--tc-something-wrong-beat) var(--tc-ease-standard) 3; }
.ui-swr-glow { filter: blur(var(--tc-something-wrong-soft)); }
@keyframes ui-swr-pulse { 0%, 100% { opacity: 0.45; } 50% { opacity: 1; } }
@keyframes ui-swr-left { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(-4px); } }
@keyframes ui-swr-right { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(4px); } }

/* Off screen or in a hidden tab: the loops hold still */
[data-ui="swr"][data-paused] :is(.ui-swr-spark, .ui-swr-left, .ui-swr-right) { animation-play-state: paused; }

@media (prefers-reduced-motion: reduce) {
  .ui-swr-spark, .ui-swr-left, .ui-swr-right { animation: none; }
}
@media (forced-colors: active) {
  .ui-swr-art { forced-color-adjust: auto; }
}
`;

/**
 * Two connected tiles with the line between them broken, for a page or request that failed.
 * @tag tc-something-wrong
 */
export class TcSomethingWrong extends TcElement {
  static override ui = "swr";
  static override looks = false;
  static override css = css;

  /** Accessible description – when set, the scene is announced as an image; otherwise it is decorative */
  @property() accessor label = "";

  /** @internal */
  private readonly screen = new OnScreenController(this);

  protected override updated() {
    if (this.label) {
      this.setAttribute("role", "img");
      this.setAttribute("aria-label", this.label);
      this.removeAttribute("aria-hidden");
    } else {
      if (this.getAttribute("role") === "img") this.removeAttribute("role");
      this.removeAttribute("aria-label");
      this.setAttribute("aria-hidden", "true");
    }
    this.toggleAttribute("data-paused", !this.screen.onScreen);
  }

  protected override render() {
    return html`<svg class="ui-swr-art" viewBox="0 0 320 240" aria-hidden="true">${svg`
      <ellipse class="ui-swr-glow" cx="160" cy="176" rx="104" ry="16"></ellipse>
      <g class="ui-swr-left">
        <path class="ui-swr-wire" d="M116 120h28" fill="none" stroke-width="5" stroke-linecap="round"></path>
        <rect class="ui-swr-tile" x="52" y="88" width="64" height="64" rx="14"></rect>
        <rect class="ui-swr-bar" x="68" y="108" width="32" height="6" rx="3"></rect>
        <rect class="ui-swr-bar" x="68" y="122" width="22" height="6" rx="3"></rect>
      </g>
      <g class="ui-swr-right">
        <path class="ui-swr-wire" d="M176 120h28" fill="none" stroke-width="5" stroke-linecap="round"></path>
        <rect class="ui-swr-tile" x="204" y="88" width="64" height="64" rx="14"></rect>
        <rect class="ui-swr-bar" x="220" y="108" width="32" height="6" rx="3"></rect>
        <rect class="ui-swr-bar" x="220" y="122" width="22" height="6" rx="3"></rect>
      </g>
      <g class="ui-swr-spark">
        <path class="ui-swr-mark" d="m160 60 26 46H134Z" stroke-width="4" stroke-linejoin="round"></path>
        <path class="ui-swr-ink" d="M160 76v14M160 97v.5" fill="none" stroke-width="4" stroke-linecap="round"></path>
        <path class="ui-swr-gap" d="m152 112 8 8-8 8M168 112l-8 8 8 8" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>
      </g>`}</svg>`;
  }
}

if (!customElements.get("tc-something-wrong")) customElements.define("tc-something-wrong", TcSomethingWrong);

declare global {
  interface HTMLElementTagNameMap {
    "tc-something-wrong": TcSomethingWrong;
  }
}
