import { html, nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { OnScreenController } from "./internal/controllers";

/*
 * <tc-awaiting-review> – a document with an hourglass on it, for content that's held until someone approves it. The
 * hourglass turns over a few times and rests. Drawn like the other state illustrations (something-wrong, no-access,
 * malware-blocked, content-hidden): a soft tile, one pastel mark with a darker edge and ink, and a soft glow beneath.
 * Drawn on a 320 × 240 viewBox inside a 3 : 2 frame, with its words as real text under the drawing.
 *
 *   <tc-awaiting-review caption="Awaiting review"></tc-awaiting-review>
 *
 * It says what's happened, so unlike a decorative illustration the host is an image named by `label`, or else by
 * `caption`. Set caption="" and leave `label` empty when the words beside it already say so: it's then decorative. The
 * loop runs a few cycles and rests, holds still off screen or in a hidden tab (data-paused) and stays still with reduced
 * motion. Colours follow the page theme through light-dark(). It's only a picture: it doesn't hold anything back.
 */

const css = /* css */ `
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

[data-ui="awr"] {
  --tc-awaiting-review-page: light-dark(#ffffff, #2a2a2e);
  --tc-awaiting-review-edge: light-dark(#e4e7ec, rgba(255, 255, 255, 0.1));
  --tc-awaiting-review-fold: light-dark(#eef1f5, #35373d);
  --tc-awaiting-review-line: light-dark(#e6e9ee, #44464d);
  --tc-awaiting-review-mark: light-dark(#ece4fb, #3b2d5a);
  --tc-awaiting-review-mark-edge: light-dark(#b9a1ea, #9a83d6);
  --tc-awaiting-review-ink: light-dark(#5b3aa6, #ddd0fb);
  --tc-awaiting-review-glow: light-dark(rgba(170, 140, 230, 0.24), rgba(170, 140, 230, 0.12));
  --tc-awaiting-review-soft: 12px;
  --tc-awaiting-review-beat: 3.2s;
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  font-family: var(--tc-font-sans);
}
.ui-awr-art { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
.ui-awr-page { fill: var(--tc-awaiting-review-page); stroke: var(--tc-awaiting-review-edge); }
.ui-awr-fold { fill: var(--tc-awaiting-review-fold); }
.ui-awr-line { fill: var(--tc-awaiting-review-line); }
.ui-awr-badge { fill: var(--tc-awaiting-review-mark); stroke: var(--tc-awaiting-review-mark-edge); stroke-width: 4; stroke-linejoin: round; }
.ui-awr-ink { fill: none; stroke: var(--tc-awaiting-review-ink); stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; }
.ui-awr-sand { fill: var(--tc-awaiting-review-ink); }
.ui-awr-glow { fill: var(--tc-awaiting-review-glow); filter: blur(var(--tc-awaiting-review-soft)); animation: ui-awr-breathe var(--tc-awaiting-review-beat) var(--tc-ease-standard) 3; }
.ui-awr-caption { position: absolute; right: 0; bottom: 0; left: 0; margin: 0; color: var(--tc-text-primary); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); text-align: center; }
.ui-awr-glass { transform-box: fill-box; transform-origin: center; animation: ui-awr-turn var(--tc-awaiting-review-beat) var(--tc-ease-move) 3; }
@keyframes ui-awr-turn { 0%, 60% { transform: rotate(0deg); } 85%, 100% { transform: rotate(180deg); } }
@keyframes ui-awr-breathe { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

/* Off screen or in a hidden tab: the loop holds still */
[data-ui="awr"][data-paused] :is(.ui-awr-glass, .ui-awr-glow) { animation-play-state: paused; }

@media (prefers-reduced-motion: reduce) {
  .ui-awr-glass, .ui-awr-glow { animation: none; }
}
@media (forced-colors: active) {
  .ui-awr-art { forced-color-adjust: auto; }
}
`;

/**
 * A document with an hourglass on it, for content that's held until someone approves it.
 * @tag tc-awaiting-review
 */
export class TcAwaitingReview extends TcElement {
  static override ui = "awr";
  static override looks = false;
  static override css = css;

  /** The words under the drawing; "" leaves them out */
  @property() accessor caption = "Awaiting review";
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
    return html`<svg class="ui-awr-art" viewBox="0 0 320 240" aria-hidden="true">${svg`
      <ellipse class="ui-awr-glow" cx="160" cy="168" rx="92" ry="14"></ellipse>
      <path class="ui-awr-page" d="M124 26h50l26 26v92a12 12 0 0 1-12 12h-64a12 12 0 0 1-12-12V38a12 12 0 0 1 12-12Z" stroke-width="2"></path>
      <path class="ui-awr-fold" d="M174 26v18a8 8 0 0 0 8 8h18Z"></path>
      <rect class="ui-awr-line" x="126" y="48" width="36" height="6" rx="3"></rect>
      <rect class="ui-awr-line" x="126" y="62" width="52" height="6" rx="3"></rect>
      <rect class="ui-awr-line" x="126" y="76" width="44" height="6" rx="3"></rect>
      <circle class="ui-awr-badge" cx="160" cy="126" r="30"></circle>
      <g class="ui-awr-glass">
        <path class="ui-awr-ink" d="M148 110h24M148 142h24M152 110c0 10 8 12 8 16s-8 6-8 16M168 110c0 10-8 12-8 16s8 6 8 16"></path>
        <path class="ui-awr-sand" d="M155 139c0-4 5-6 5-8 0 2 5 4 5 8Z"></path>
      </g>`}</svg>
      ${this.caption ? html`<p class="ui-awr-caption">${this.caption}</p>` : nothing}`;
  }
}

if (!customElements.get("tc-awaiting-review")) customElements.define("tc-awaiting-review", TcAwaitingReview);

declare global {
  interface HTMLElementTagNameMap {
    "tc-awaiting-review": TcAwaitingReview;
  }
}
