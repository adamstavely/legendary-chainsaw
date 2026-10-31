import { html, svg } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { OnScreenController } from "./internal/controllers";

/*
 * <tc-nothing-found> – a magnifying glass passing over a list of blank results, for a search or filter with no matches. It looks across a few times and rests.
 * Drawn on a 320 × 240 viewBox inside a 3 : 2 frame.
 *
 *   <tc-nothing-found label="Nothing found"></tc-nothing-found>
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

[data-ui="nfd"] {
  --tc-nothing-found-card: light-dark(#ffffff, #232326);
  --tc-nothing-found-edge: light-dark(#e4e7ec, rgba(255, 255, 255, 0.08));
  --tc-nothing-found-bar: light-dark(#eff1f4, #2f2f33);
  --tc-nothing-found-lens: light-dark(rgba(168, 181, 255, 0.16), rgba(168, 181, 255, 0.12));
  --tc-nothing-found-rim: light-dark(#5b6472, #c9ced6);
  --tc-nothing-found-beat: 3.6s;
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 3 / 2;
  overflow: hidden;
}
.ui-nfd-art { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
.ui-nfd-card { fill: var(--tc-nothing-found-card); stroke: var(--tc-nothing-found-edge); }
.ui-nfd-bar, .ui-nfd-dot { fill: var(--tc-nothing-found-bar); }
.ui-nfd-lens { fill: var(--tc-nothing-found-lens); stroke: var(--tc-nothing-found-rim); }
.ui-nfd-handle { stroke: var(--tc-nothing-found-rim); }
.ui-nfd-glass { animation: ui-nfd-look var(--tc-nothing-found-beat) var(--tc-ease-standard) 3; }
.ui-nfd-row { animation: ui-nfd-fade var(--tc-nothing-found-beat) var(--tc-ease-standard) 3; }
@keyframes ui-nfd-look { 0%, 100% { transform: translate(0, 0); } 35% { transform: translate(-46px, -26px); } 70% { transform: translate(-16px, 16px); } }
@keyframes ui-nfd-fade { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }

/* Off screen or in a hidden tab: the loops hold still */
[data-ui="nfd"][data-paused] :is(.ui-nfd-glass, .ui-nfd-row) { animation-play-state: paused; }

@media (prefers-reduced-motion: reduce) {
  .ui-nfd-glass, .ui-nfd-row { animation: none; }
}
@media (forced-colors: active) {
  .ui-nfd-art { forced-color-adjust: auto; }
}
`;

/**
 * A magnifying glass passing over a list of blank results, for a search or filter with no matches.
 * @tag tc-nothing-found
 */
export class TcNothingFound extends TcElement {
  static override ui = "nfd";
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
    return html`<svg class="ui-nfd-art" viewBox="0 0 320 240" aria-hidden="true">${svg`
      <rect class="ui-nfd-card" x="70" y="42" width="180" height="156" rx="12"></rect>
      <g class="ui-nfd-row"><circle class="ui-nfd-dot" cx="94" cy="72" r="8"></circle><rect class="ui-nfd-bar" x="112" y="64" width="112" height="7" rx="3.5"></rect><rect class="ui-nfd-bar" x="112" y="76" width="72" height="5" rx="2.5"></rect></g>
      <g class="ui-nfd-row"><circle class="ui-nfd-dot" cx="94" cy="120" r="8"></circle><rect class="ui-nfd-bar" x="112" y="112" width="112" height="7" rx="3.5"></rect><rect class="ui-nfd-bar" x="112" y="124" width="72" height="5" rx="2.5"></rect></g>
      <g class="ui-nfd-row"><circle class="ui-nfd-dot" cx="94" cy="168" r="8"></circle><rect class="ui-nfd-bar" x="112" y="160" width="112" height="7" rx="3.5"></rect><rect class="ui-nfd-bar" x="112" y="172" width="72" height="5" rx="2.5"></rect></g>
      <g class="ui-nfd-glass">
        <circle class="ui-nfd-lens" cx="196" cy="128" r="32" stroke-width="7"></circle>
        <path class="ui-nfd-handle" d="m220 152 24 24" fill="none" stroke-width="9" stroke-linecap="round"></path>
      </g>`}</svg>`;
  }
}

if (!customElements.get("tc-nothing-found")) customElements.define("tc-nothing-found", TcNothingFound);

declare global {
  interface HTMLElementTagNameMap {
    "tc-nothing-found": TcNothingFound;
  }
}
