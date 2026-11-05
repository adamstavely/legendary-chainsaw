import { html, nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { OnScreenController } from "./internal/controllers";

/*
 * <tc-content-hidden> – a photo pixelated down to a person's outline, with a warning sign on it, for sensitive content
 * (obscene, sexual or graphic material) that's been covered. It's made to sit on an overlay, and the sign settles a few
 * times and rests. Drawn like the other state illustrations (something-wrong, no-access, malware-blocked):
 * a soft tile, one pastel mark with a darker edge and ink, and a soft glow beneath. The mosaic is only a pattern of
 * squares – it depicts nothing.
 * Drawn on a 320 × 240 viewBox inside a 3 : 2 frame, with its words as real text under the drawing.
 *
 *   <tc-content-hidden caption="Content hidden"></tc-content-hidden>
 *
 * It says what's happened, so unlike a decorative illustration the host is an image named by `label`, or else by
 * `caption`. Set caption="" and leave `label` empty when the words beside it already say so: it's then decorative. The
 * loop runs a few cycles and rests, holds still off screen or in a hidden tab (data-paused) and stays still with reduced
 * motion. Colours follow the page theme through light-dark(). It's only a picture: it doesn't hide or block anything.
 */

const css = /* css */ `
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

[data-ui="chd"] {
  --tc-content-hidden-card: light-dark(#ffffff, #2a2a2e);
  --tc-content-hidden-edge: light-dark(#e4e7ec, rgba(255, 255, 255, 0.1));
  --tc-content-hidden-tile-1: light-dark(#eef1f5, #34363c);
  --tc-content-hidden-tile-2: light-dark(#d9dfe8, #43464d);
  --tc-content-hidden-tile-3: light-dark(#b8c1ce, #5a5e67);
  --tc-content-hidden-badge: light-dark(#fbe7cf, #5a4426);
  --tc-content-hidden-badge-edge: light-dark(#e9b872, #c79a57);
  --tc-content-hidden-ink: light-dark(#8a5a17, #f3d6a6);
  --tc-content-hidden-glow: light-dark(rgba(250, 176, 130, 0.22), rgba(250, 176, 130, 0.1));
  --tc-content-hidden-soft: 12px;
  --tc-content-hidden-beat: 3.2s;
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  font-family: var(--tc-font-sans);
}
.ui-chd-art { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
.ui-chd-card { fill: var(--tc-content-hidden-card); stroke: var(--tc-content-hidden-edge); }
.ui-chd-tile[data-tone="1"] { fill: var(--tc-content-hidden-tile-1); }
.ui-chd-tile[data-tone="2"] { fill: var(--tc-content-hidden-tile-2); }
.ui-chd-tile[data-tone="3"] { fill: var(--tc-content-hidden-tile-3); }
.ui-chd-badge { fill: var(--tc-content-hidden-badge); stroke: var(--tc-content-hidden-badge-edge); stroke-width: 4; stroke-linejoin: round; }
.ui-chd-ink { fill: none; stroke: var(--tc-content-hidden-ink); stroke-width: 5; stroke-linecap: round; }
.ui-chd-glow { fill: var(--tc-content-hidden-glow); filter: blur(var(--tc-content-hidden-soft)); animation: ui-chd-breathe var(--tc-content-hidden-beat) var(--tc-ease-standard) 3; }
.ui-chd-caption { position: absolute; right: 0; bottom: 0; left: 0; margin: 0; color: var(--tc-text-primary); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); text-align: center; }
.ui-chd-mark { transform-box: fill-box; transform-origin: center; animation: ui-chd-settle var(--tc-content-hidden-beat) var(--tc-ease-standard) 3; }
@keyframes ui-chd-settle { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.04); } }
@keyframes ui-chd-breathe { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

/* Off screen or in a hidden tab: the loop holds still */
[data-ui="chd"][data-paused] :is(.ui-chd-mark, .ui-chd-glow) { animation-play-state: paused; }

@media (prefers-reduced-motion: reduce) {
  .ui-chd-mark, .ui-chd-glow { animation: none; }
}
`;

let nextId = 0;

/** The photo's squares, [x, y, tone]: darker inside a head-and-shoulders outline, so it reads as a person and shows nothing */
const MOSAIC: [number, number, 1 | 2 | 3][] = (() => {
  const out: [number, number, 1 | 2 | 3][] = [];
  // 16-px squares centred on the figure's middle (x 160), so the outline is symmetrical
  for (let y = 14; y < 158; y += 16)
    for (let x = 64; x < 256; x += 16) {
      const cx = x + 8;
      const cy = y + 8;
      const head = Math.hypot((cx - 160) / 24, (cy - 66) / 28);
      const body = Math.hypot((cx - 160) / 64, (cy - 160) / 50);
      const d = Math.min(head, body);
      out.push([x + 0.5, y + 0.5, d < 1 ? 3 : d < 1.4 ? 2 : 1]);
    }
  return out;
})();

/**
 * A photo pixelated to a person's outline, with a warning sign on it, for sensitive content that's been covered.
 * @tag tc-content-hidden
 */
export class TcContentHidden extends TcElement {
  static override ui = "chd";
  static override looks = false;
  static override css = css;

  /** The words under the drawing; "" leaves them out */
  @property() accessor caption = "Sensitive content";
  /** Accessible description, when it should say more than `caption` */
  @property() accessor label = "";

  /** @internal */
  private readonly screen = new OnScreenController(this);
  /** @internal */
  private readonly clip = `tc-content-hidden-${++nextId}`;

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
    return html`<svg class="ui-chd-art" viewBox="0 0 320 240" aria-hidden="true">${svg`
      <defs><clipPath id=${this.clip}><rect x="78" y="22" width="164" height="136" rx="14"></rect></clipPath></defs>
      <ellipse class="ui-chd-glow" cx="160" cy="184" rx="96" ry="12"></ellipse>
      <rect class="ui-chd-card" x="78" y="22" width="164" height="136" rx="14" stroke-width="2"></rect>
      <g clip-path="url(#${this.clip})">${MOSAIC.map(([x, y, tone]) => svg`<rect class="ui-chd-tile" data-tone=${tone} x=${x} y=${y} width="15" height="15" rx="2"></rect>`)}</g>
      <g class="ui-chd-mark">
        <path class="ui-chd-badge" d="M160 120 194 180H126Z"></path>
        <path class="ui-chd-ink" d="M160 141v17M160 168.5v.5"></path>
      </g>`}</svg>
      ${this.caption ? html`<p class="ui-chd-caption">${this.caption}</p>` : nothing}`;
  }
}

if (!customElements.get("tc-content-hidden")) customElements.define("tc-content-hidden", TcContentHidden);

declare global {
  interface HTMLElementTagNameMap {
    "tc-content-hidden": TcContentHidden;
  }
}
