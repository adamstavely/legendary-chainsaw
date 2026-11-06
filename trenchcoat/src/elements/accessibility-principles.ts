import { html, nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { OnScreenController } from "./internal/controllers";

/*
 * <tc-accessibility-principles> – the four kinds of need accessibility serves (visual, hearing, motor, cognitive), each a
 * pastel badge on a soft tile, above the four principles that serve them (perceivable, operable, understandable,
 * robust), with a connector from each principle up to the needs it meets. For an accessibility statement, a design
 * guide or onboarding. The connectors draw in one after another and the gear in the head turns a few times, then rests.
 * Drawn like the other illustrations (all-done, something-wrong): soft tiles, one pastel mark with a darker edge and
 * ink, and a soft glow beneath – on a 320 × 240 viewBox in a 4 : 3 frame, taller than the 3 : 2 states so the words fit.
 *
 *   <tc-accessibility-principles></tc-accessibility-principles>
 *
 * The words are drawn in, from `labels`, so the host is an image named by `label`, or else by a sentence built from
 * `labels` that says which principle serves which need. `caption` adds words under the drawing. The loop runs a few
 * cycles and rests, holds still off screen or in a hidden tab (data-paused) and stays still with reduced motion.
 * Colours follow the page theme through light-dark().
 */

const css = /* css */ `
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

[data-ui="acp"] {
  --tc-accessibility-principles-tile: light-dark(#ffffff, #2a2a2e);
  --tc-accessibility-principles-edge: light-dark(#e4e7ec, rgba(255, 255, 255, 0.1));
  --tc-accessibility-principles-mark: light-dark(#e0eef5, #1f3542);
  --tc-accessibility-principles-mark-edge: light-dark(#9cc6da, #5d93ad);
  --tc-accessibility-principles-ink: light-dark(#245a73, #cfe7f2);
  --tc-accessibility-principles-glow: light-dark(rgba(120, 175, 205, 0.26), rgba(120, 175, 205, 0.12));
  --tc-accessibility-principles-soft: 12px;
  --tc-accessibility-principles-beat: 3s;
  display: block;
  width: 100%;
  font-family: var(--tc-font-sans);
}
.ui-acp-art { display: block; width: 100%; height: auto; aspect-ratio: 4 / 3; overflow: hidden; }
.ui-acp-tile { fill: var(--tc-accessibility-principles-tile); stroke: var(--tc-accessibility-principles-edge); }
.ui-acp-badge { fill: var(--tc-accessibility-principles-mark); stroke: var(--tc-accessibility-principles-mark-edge); stroke-width: 3; }
.ui-acp-ink { fill: none; stroke: var(--tc-accessibility-principles-ink); stroke-width: 3.6; stroke-linecap: round; stroke-linejoin: round; }
.ui-acp-dot { fill: var(--tc-accessibility-principles-ink); }
.ui-acp-teeth { fill: none; stroke: var(--tc-accessibility-principles-ink); stroke-width: 4; stroke-dasharray: 3.2 2.69; }
.ui-acp-hub { fill: var(--tc-accessibility-principles-tile); stroke: var(--tc-accessibility-principles-ink); stroke-width: 2.5; }
.ui-acp-gear { transform-box: fill-box; transform-origin: center; animation: ui-acp-turn var(--tc-accessibility-principles-beat) var(--tc-ease-standard) 3; }
.ui-acp-need { fill: var(--tc-text-primary); font-weight: var(--tc-font-weight-semibold); text-anchor: middle; }
.ui-acp-pill { fill: var(--tc-accessibility-principles-tile); stroke: var(--tc-accessibility-principles-edge); }
.ui-acp-principle { fill: var(--tc-text-secondary); font-weight: var(--tc-font-weight-medium); text-anchor: middle; }
.ui-acp-initial { fill: var(--tc-accessibility-principles-ink); font-weight: var(--tc-font-weight-bold); }
.ui-acp-link { fill: none; stroke: var(--tc-accessibility-principles-mark-edge); stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 100; stroke-dashoffset: 0; animation: ui-acp-draw calc(var(--tc-accessibility-principles-beat) / 5) var(--tc-ease-move) calc(var(--tc-duration-fast) + var(--i) * var(--tc-accessibility-principles-beat) / 10) 1 backwards; }
.ui-acp-head { fill: none; stroke: var(--tc-accessibility-principles-mark-edge); stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; animation: ui-acp-show var(--tc-duration-fast) var(--tc-ease-standard) calc(var(--tc-duration-fast) + var(--i) * var(--tc-accessibility-principles-beat) / 10 + var(--tc-accessibility-principles-beat) / 5) 1 backwards; }
.ui-acp-glow { fill: var(--tc-accessibility-principles-glow); filter: blur(var(--tc-accessibility-principles-soft)); animation: ui-acp-breathe var(--tc-accessibility-principles-beat) var(--tc-ease-standard) 3; }
.ui-acp-caption { margin: var(--tc-space-8) 0 0; color: var(--tc-text-primary); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); text-align: center; }
@keyframes ui-acp-draw { from { stroke-dashoffset: 100; } to { stroke-dashoffset: 0; } }
@keyframes ui-acp-show { from { opacity: 0; } to { opacity: 1; } }
@keyframes ui-acp-turn { from { transform: rotate(0); } to { transform: rotate(90deg); } }
@keyframes ui-acp-breathe { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

/* Off screen or in a hidden tab: the loops hold still */
[data-ui="acp"][data-paused] :is(.ui-acp-link, .ui-acp-head, .ui-acp-gear, .ui-acp-glow) { animation-play-state: paused; }

@media (prefers-reduced-motion: reduce) {
  .ui-acp-link, .ui-acp-head, .ui-acp-gear, .ui-acp-glow { animation: none; }
}
@media (forced-colors: active) {
  .ui-acp-art { forced-color-adjust: auto; }
}
`;

export interface AccessibilityPrinciplesLabels {
  visual: string;
  hearing: string;
  motor: string;
  cognitive: string;
  perceivable: string;
  operable: string;
  understandable: string;
  robust: string;
}

export const defaultAccessibilityPrinciplesLabels: AccessibilityPrinciplesLabels = {
  visual: "Visual",
  hearing: "Hearing",
  motor: "Motor",
  cognitive: "Cognitive",
  perceivable: "Perceivable",
  operable: "Operable",
  understandable: "Understandable",
  robust: "Robust",
};

/* Each icon is drawn round its badge's centre, within about 20 units of it */
const EYE = svg`
  <path class="ui-acp-ink" d="M-19 0C-13-9-7-12 0-12S13-9 19 0C13 9 7 12 0 12S-13 9-19 0Z"></path>
  <circle class="ui-acp-ink" r="6"></circle>
  <circle class="ui-acp-dot" r="2.4"></circle>`;
const EAR = svg`
  <path class="ui-acp-ink" d="M-12 13C-14 9-14 4-14-4A13 13 0 0 1 12-4C12 2 9 5 6 8 3 11 3 19-4 19-8 19-10 17-12 13Z"></path>
  <path class="ui-acp-ink" d="M-6 1V-4A5 5 0 0 1 4-4C4-1 2 1-1 2"></path>`;
const HAND = svg`
  <path class="ui-acp-ink" d="M-5 6V-14a4 4 0 0 1 8 0V0M3 0V-3a4 4 0 0 1 8 0V1M11 1a4 4 0 0 1 7 2v6c0 7-5 11-11 11H1c-4 0-6-2-8-4L-14 9a3.5 3.5 0 0 1 5-5L-5 7"></path>`;
const HEAD = svg`
  <path class="ui-acp-ink" d="M-11 20V10C-16 6-18 1-18-5-18-14-10-20-1-20 8-20 15-13 15-5L19 3 15 5V10C15 13 13 14 10 14H5V20"></path>
  <g class="ui-acp-gear">
    <circle class="ui-acp-teeth" cx="-2" cy="-5" r="7.5"></circle>
    <circle class="ui-acp-hub" cx="-2" cy="-5" r="4"></circle>
  </g>`;

type Key = keyof AccessibilityPrinciplesLabels;
const NEEDS: { key: Key; x: number; icon: unknown }[] = [
  { key: "visual", x: 42, icon: EYE },
  { key: "hearing", x: 120, icon: EAR },
  { key: "motor", x: 200, icon: HAND },
  { key: "cognitive", x: 278, icon: HEAD },
];
const PRINCIPLES: { key: Key; x: number }[] = [
  { key: "perceivable", x: 42 },
  { key: "operable", x: 120 },
  { key: "understandable", x: 200 },
  { key: "robust", x: 278 },
];
/* Which principle serves which need: from a point on the principle's pill up to one under the need's name */
const LINKS: { from: Key; to: Key; sx: number; ex: number }[] = [
  { from: "perceivable", to: "visual", sx: 36, ex: 42 },
  { from: "perceivable", to: "hearing", sx: 48, ex: 120 },
  { from: "operable", to: "motor", sx: 120, ex: 194 },
  { from: "understandable", to: "cognitive", sx: 200, ex: 272 },
  { from: "robust", to: "motor", sx: 272, ex: 206 },
  { from: "robust", to: "cognitive", sx: 284, ex: 284 },
];
const NEED_Y = 44;
const LINK_TOP = 102;
const LINK_BOTTOM = 186;
const PILL_Y = 200;

/**
 * The four kinds of need accessibility serves, above the four principles that serve them, joined by connectors.
 * @tag tc-accessibility-principles
 */
export class TcAccessibilityPrinciples extends TcElement {
  static override ui = "acp";
  static override looks = false;
  static override css = css;

  /** The words drawn in: the four needs and the four principles */
  @property({ attribute: false }) accessor labels: AccessibilityPrinciplesLabels = defaultAccessibilityPrinciplesLabels;
  /** Words under the drawing; "" (the default) leaves them out */
  @property() accessor caption = "";
  /** Accessible description; by default a sentence saying which principle serves which need */
  @property() accessor label = "";
  /** Leave the drawing out of the accessibility tree, for when the text beside it says the same */
  @property({ type: Boolean }) accessor decorative = false;

  /** @internal */
  private readonly screen = new OnScreenController(this);

  /** The sentence the host is named by when `label` is empty */
  describe(): string {
    const l = { ...defaultAccessibilityPrinciplesLabels, ...this.labels };
    const served = (from: Key) =>
      LINKS.filter((k) => k.from === from)
        .map((k) => l[k.to].toLowerCase())
        .join(" and ");
    return `${PRINCIPLES.map((p) => `${l[p.key]} serves ${served(p.key)}`).join("; ")}.`;
  }

  protected override updated() {
    if (this.decorative) {
      if (this.getAttribute("role") === "img") this.removeAttribute("role");
      this.removeAttribute("aria-label");
      this.setAttribute("aria-hidden", "true");
    } else {
      this.setAttribute("role", "img");
      this.setAttribute("aria-label", this.label || this.describe());
      this.removeAttribute("aria-hidden");
    }
    this.toggleAttribute("data-paused", !this.screen.onScreen);
  }

  protected override render() {
    const l = { ...defaultAccessibilityPrinciplesLabels, ...this.labels };
    return html`<svg class="ui-acp-art" viewBox="0 0 320 240" aria-hidden="true">${svg`
      <ellipse class="ui-acp-glow" cx="160" cy="${PILL_Y + 16}" rx="140" ry="12"></ellipse>
      ${LINKS.map((k, i) => {
        const d = `M${k.sx} ${LINK_BOTTOM}C${k.sx} ${LINK_BOTTOM - 42} ${k.ex} ${LINK_TOP + 42} ${k.ex} ${LINK_TOP}`;
        return svg`<g style=${`--i: ${i}`}>
          <path class="ui-acp-link" d=${d} pathLength="100"></path>
          <path class="ui-acp-head" d=${`M${k.ex - 4.5} ${LINK_TOP + 6}L${k.ex} ${LINK_TOP}L${k.ex + 4.5} ${LINK_TOP + 6}`}></path>
        </g>`;
      })}
      ${NEEDS.map(
        (n) => svg`<g transform=${`translate(${n.x} ${NEED_Y})`}>
          <rect class="ui-acp-tile" x="-30" y="-30" width="60" height="60" rx="14" stroke-width="2"></rect>
          <circle class="ui-acp-badge" r="21"></circle>
          <g transform="scale(0.72)">${n.icon}</g>
        </g>
        <text class="ui-acp-need" font-size="10.5" x=${n.x} y=${NEED_Y + 47}>${l[n.key]}</text>`,
      )}
      ${PRINCIPLES.map(
        (p) => svg`<rect class="ui-acp-pill" x=${p.x - 38} y=${PILL_Y - 12} width="76" height="24" rx="12" stroke-width="2"></rect>
        <text class="ui-acp-principle" font-size="9" x=${p.x} y=${PILL_Y + 3}><tspan class="ui-acp-initial">${l[p.key].slice(0, 1)}</tspan>${l[p.key].slice(1)}</text>`,
      )}`}</svg>
      ${this.caption ? html`<p class="ui-acp-caption">${this.caption}</p>` : nothing}`;
  }
}

if (!customElements.get("tc-accessibility-principles")) customElements.define("tc-accessibility-principles", TcAccessibilityPrinciples);

declare global {
  interface HTMLElementTagNameMap {
    "tc-accessibility-principles": TcAccessibilityPrinciples;
  }
}
