import { html, svg } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { OnScreenController } from "./internal/controllers";

/*
 * <tc-no-access> – a folder held shut by a padlock, for when someone isn't entitled to see what they opened. The lock settles a few times and rests.
 * Drawn on a 320 × 240 viewBox inside a 3 : 2 frame.
 *
 *   <tc-no-access label="You don't have access"></tc-no-access>
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

[data-ui="nac"] {
  --tc-no-access-back: light-dark(#dfe5ee, #33363d);
  --tc-no-access-front: light-dark(#eef2f7, #26282d);
  --tc-no-access-edge: light-dark(#d3dae4, rgba(255, 255, 255, 0.1));
  --tc-no-access-page: light-dark(#ffffff, #3c3f46);
  --tc-no-access-line: light-dark(#e3e7ed, #50545c);
  --tc-no-access-lock: light-dark(#5b6472, #c9ced6);
  --tc-no-access-key: light-dark(#ffffff, #26282d);
  --tc-no-access-glow: light-dark(rgba(200, 168, 229, 0.28), rgba(200, 168, 229, 0.14));
  --tc-no-access-soft: 12px;
  --tc-no-access-beat: 3.2s;
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 3 / 2;
  overflow: hidden;
}
.ui-nac-art { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
.ui-nac-back { fill: var(--tc-no-access-back); }
.ui-nac-front { fill: var(--tc-no-access-front); stroke: var(--tc-no-access-edge); }
.ui-nac-page { fill: var(--tc-no-access-page); stroke: var(--tc-no-access-edge); }
.ui-nac-line { fill: var(--tc-no-access-line); }
.ui-nac-shackle { stroke: var(--tc-no-access-lock); }
.ui-nac-body { fill: var(--tc-no-access-lock); }
.ui-nac-key { fill: var(--tc-no-access-key); }
.ui-nac-lock { transform-box: fill-box; transform-origin: 50% 0%; animation: ui-nac-settle var(--tc-no-access-beat) var(--tc-ease-standard) 3; }
.ui-nac-glow { animation: ui-nac-breathe var(--tc-no-access-beat) var(--tc-ease-standard) 3; }
.ui-nac-glow { filter: blur(var(--tc-no-access-soft)); }
@keyframes ui-nac-settle { 0%, 100% { transform: rotate(0deg); } 30% { transform: rotate(-4deg); } 60% { transform: rotate(3deg); } }
@keyframes ui-nac-breathe { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

/* Off screen or in a hidden tab: the loops hold still */
[data-ui="nac"][data-paused] :is(.ui-nac-lock, .ui-nac-glow) { animation-play-state: paused; }

@media (prefers-reduced-motion: reduce) {
  .ui-nac-lock, .ui-nac-glow { animation: none; }
}
@media (forced-colors: active) {
  .ui-nac-art { forced-color-adjust: auto; }
}
`;

/**
 * A folder held shut by a padlock, for when someone isn't entitled to see what they opened.
 * @tag tc-no-access
 */
export class TcNoAccess extends TcElement {
  static override ui = "nac";
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
    return html`<svg class="ui-nac-art" viewBox="0 0 320 240" aria-hidden="true">${svg`
      <ellipse class="ui-nac-glow" cx="160" cy="190" rx="96" ry="18" fill="var(--tc-no-access-glow)"></ellipse>
      <path class="ui-nac-back" d="M72 72a10 10 0 0 1 10-10h46l16 16h94a10 10 0 0 1 10 10v92a10 10 0 0 1-10 10H82a10 10 0 0 1-10-10Z"></path>
      <rect class="ui-nac-page" x="96" y="56" width="128" height="84" rx="6" transform="rotate(-2 160 98)"></rect>
      <rect class="ui-nac-line" x="110" y="72" width="84" height="6" rx="3" transform="rotate(-2 160 98)"></rect>
      <rect class="ui-nac-line" x="110" y="86" width="100" height="6" rx="3" transform="rotate(-2 160 98)"></rect>
      <path class="ui-nac-front" d="M66 112a10 10 0 0 1 10-10h168a10 10 0 0 1 10 10v70a10 10 0 0 1-10 10H76a10 10 0 0 1-10-10Z"></path>
      <g class="ui-nac-lock">
        <path class="ui-nac-shackle" d="M144 134v-14a16 16 0 0 1 32 0v14" fill="none" stroke-width="7" stroke-linecap="round"></path>
        <rect class="ui-nac-body" x="132" y="132" width="56" height="44" rx="9"></rect>
        <circle class="ui-nac-key" cx="160" cy="150" r="5.5"></circle>
        <rect class="ui-nac-key" x="157.5" y="152" width="5" height="12" rx="2.5"></rect>
      </g>`}</svg>`;
  }
}

if (!customElements.get("tc-no-access")) customElements.define("tc-no-access", TcNoAccess);

declare global {
  interface HTMLElementTagNameMap {
    "tc-no-access": TcNoAccess;
  }
}
