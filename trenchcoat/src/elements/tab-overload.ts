import { html, svg, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { OnScreenController } from "./internal/controllers";

/*
 * <tc-tab-overload> – the Lit port of illustrations/tab-overload.tsx: three overlapping browser windows; the front
 * one is active with coloured dots, an outline and a glow. Hover a window behind it and the highlight moves over.
 *
 *   <tc-tab-overload label="Three browser windows"></tc-tab-overload>
 *
 * The artwork is drawn on a 360 × 240 viewBox and fades out towards the right and bottom edge. The shimmer runs a few
 * cycles, pauses while it's off screen (data-paused) and stays still with reduced motion. Colours follow the page
 * theme (.dark, data-theme / data-tc-theme or the OS setting) through light-dark(). Decorative by default (the host
 * is aria-hidden); with `label` the host is an image (role="img") named by it.
 */

/** Offsets of the three windows (top-left corner of each frame) */
const windows = [
  { n: 1, x: 30, y: 68 },
  { n: 2, x: 125, y: 56 },
  { n: 3, x: 220, y: 44 },
] as const;

let seq = 0;

/**
 * Three overlapping browser windows; hovering one behind moves the highlight onto it.
 * @tag tc-tab-overload
 */
export class TcTabOverload extends TcElement {
  static override ui = "to";
  static override looks = false;

  /** Describes the scene to assistive tech (role="img"); without it the illustration is decorative and hidden */
  @property() accessor label: string | undefined = undefined;

  /** @internal Gradient and filter ids, unique per instance */
  private readonly uid = `ui-to${++seq}`;
  /** @internal */
  private readonly screen = new OnScreenController(this);

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    this.toggleAttribute("data-paused", !this.screen.onScreen);
  }

  protected override updated() {
    // A described image when there's a label, otherwise decoration that assistive tech skips
    if (this.label) {
      this.setAttribute("role", "img");
      this.setAttribute("aria-label", this.label);
      this.removeAttribute("aria-hidden");
    } else {
      if (this.getAttribute("role") === "img") this.removeAttribute("role");
      this.removeAttribute("aria-label");
      this.setAttribute("aria-hidden", "true");
    }
  }

  protected override render() {
    const id = this.uid;
    return html`<svg class="ui-to-art" viewBox="0 0 360 240" aria-hidden="true">
      ${svg`<defs>
        <linearGradient id=${`${id}-blob-h`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#FFB89E" stop-opacity="0.3"></stop>
          <stop offset="50%" stop-color="#C8A8E5" stop-opacity="0.3"></stop>
          <stop offset="100%" stop-color="#A8B5FF" stop-opacity="0.3"></stop>
        </linearGradient>
        <linearGradient id=${`${id}-blob-v`} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="#FF6B5C" stop-opacity="0.3"></stop>
          <stop offset="100%" stop-color="#FFB89E" stop-opacity="0.3"></stop>
        </linearGradient>
        <filter id=${`${id}-blur`} x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="12"></feGaussianBlur>
        </filter>
        <linearGradient id=${`${id}-stroke`} x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#B5C0FF"></stop>
          <stop offset="40%" stop-color="#D5BBEF"></stop>
          <stop offset="75%" stop-color="#FFC5AB"></stop>
          <stop offset="100%" stop-color="#FFB5BC"></stop>
        </linearGradient>
      </defs>`}
      ${windows.map(
        ({ n, x, y }) => svg`<g>
          <g class=${`ui-to-blobs ui-to-blobs-${n}`}>
            <ellipse cx=${x + 70} cy=${y + 8} rx="90" ry="14" fill=${`url(#${id}-blob-h)`} filter=${`url(#${id}-blur)`}></ellipse>
            <ellipse cx=${x + 8} cy=${y + 96} rx="14" ry="90" fill=${`url(#${id}-blob-v)`} filter=${`url(#${id}-blur)`}></ellipse>
          </g>
          <g class=${`ui-to-tab ui-to-tab-${n}`} transform=${`translate(${x} ${y})`}>
            <rect class="ui-to-frame" width="380" height="300" rx="6" stroke-width="0.7"></rect>
            <circle class="ui-to-dot" cx="14" cy="14" r="3"></circle>
            <circle class="ui-to-dot" cx="24" cy="14" r="3"></circle>
            <circle class="ui-to-dot" cx="34" cy="14" r="3"></circle>
            <rect class="ui-to-page" x="4" y="24" width="372" height="272" rx="5" stroke-width="0.7"></rect>
          </g>
          <g class=${`ui-to-content ui-to-content-${n}`} transform=${`translate(${x} ${y})`}>
            <rect class="ui-to-bar" x="12" y="36" width="30" height="30" rx="4"></rect>
            <rect class="ui-to-bar" x="52" y="38" width="100" height="6" rx="2"></rect>
            <rect class="ui-to-bar" x="52" y="46" width="100" height="6" rx="2"></rect>
            <rect class="ui-to-bar" x="52" y="54" width="35" height="6" rx="2"></rect>
            <rect class="ui-to-bar" x="12" y="72" width="140" height="6" rx="2"></rect>
            <rect class="ui-to-bar" x="12" y="80" width="140" height="6" rx="2"></rect>
            <rect class="ui-to-bar" x="12" y="88" width="55" height="6" rx="2"></rect>
          </g>
        </g>`,
      )}
      ${windows.map(
        ({ n, x, y }) => svg`<g class=${`ui-to-front ui-to-front-${n}`}>
          <circle cx=${x + 14} cy=${y + 14} r="3" fill="#FF6B5C"></circle>
          <circle cx=${x + 24} cy=${y + 14} r="3" fill="#FFB89E"></circle>
          <circle cx=${x + 34} cy=${y + 14} r="3" fill="#A8B5FF"></circle>
          <path d=${`M ${x} 240 L ${x} ${y + 6} A 6 6 0 0 1 ${x + 6} ${y} L ${n === 3 ? 360 : x + 95} ${y}`} fill="none" stroke=${`url(#${id}-stroke)`} stroke-width="0.8"></path>
        </g>`,
      )}
    </svg>`;
  }

  static override css = /* css */ `
/* Theme: the colours below use light-dark(), which follows color-scheme */
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

[data-ui="to"] {
  --tc-tab-overload-frame: light-dark(#f4f5f7, #1b1b1d);
  --tc-tab-overload-frame-edge: light-dark(#e4e7ec, rgba(255, 255, 255, 0.1));
  --tc-tab-overload-dot: light-dark(#cccccc, #3a3a3f);
  --tc-tab-overload-page: light-dark(#ffffff, #232326);
  --tc-tab-overload-page-edge: light-dark(#e4e7ec, rgba(255, 255, 255, 0.08));
  --tc-tab-overload-bar: light-dark(#eff1f4, #2e2e32);
  --tc-tab-overload-bar-peak: light-dark(#dde1e5, #3a3a3f);
  /* One shimmer cycle; it runs a few times and then rests */
  --tc-tab-overload-shimmer: 2.4s;
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  /* Fade out towards the right and bottom edge */
  -webkit-mask-image:
    linear-gradient(to right, #000 70%, transparent 100%),
    linear-gradient(to bottom, #000 70%, transparent 100%);
  -webkit-mask-composite: source-in;
  mask-image:
    linear-gradient(to right, #000 70%, transparent 100%),
    linear-gradient(to bottom, #000 70%, transparent 100%);
  mask-composite: intersect;
}
.ui-to-art {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}
.ui-to-frame { fill: var(--tc-tab-overload-frame); stroke: var(--tc-tab-overload-frame-edge); }
.ui-to-dot { fill: var(--tc-tab-overload-dot); }
.ui-to-page { fill: var(--tc-tab-overload-page); stroke: var(--tc-tab-overload-page-edge); }

/* Placeholder blocks shimmer softly for a few cycles – and hold still while the card is off screen */
.ui-to-bar {
  fill: var(--tc-tab-overload-bar);
  animation: ui-to-shimmer var(--tc-tab-overload-shimmer) var(--tc-ease-standard, ease) 3;
}
[data-ui="to"][data-paused] .ui-to-bar { animation-play-state: paused; }
@keyframes ui-to-shimmer {
  0%, 100% { fill: var(--tc-tab-overload-bar); }
  50% { fill: var(--tc-tab-overload-bar-peak); }
}

/* The highlight follows the hovered window; the front window is active by default */
.ui-to-blobs,
.ui-to-front {
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--tc-duration-slow, 320ms) var(--tc-ease-standard, ease);
}
.ui-to-content {
  opacity: 0.2;
  pointer-events: none;
  transition: opacity var(--tc-duration-slow, 320ms) var(--tc-ease-standard, ease);
}
.ui-to-blobs-3,
.ui-to-front-3,
.ui-to-content-3 { opacity: 1; }

.ui-to-art:has(.ui-to-tab-1:hover) .ui-to-blobs-1,
.ui-to-art:has(.ui-to-tab-1:hover) .ui-to-front-1,
.ui-to-art:has(.ui-to-tab-1:hover) .ui-to-content-1,
.ui-to-art:has(.ui-to-tab-2:hover) .ui-to-blobs-2,
.ui-to-art:has(.ui-to-tab-2:hover) .ui-to-front-2,
.ui-to-art:has(.ui-to-tab-2:hover) .ui-to-content-2 { opacity: 1; }

.ui-to-art:has(.ui-to-tab-1:hover, .ui-to-tab-2:hover) .ui-to-blobs-3,
.ui-to-art:has(.ui-to-tab-1:hover, .ui-to-tab-2:hover) .ui-to-front-3 { opacity: 0; }
.ui-to-art:has(.ui-to-tab-1:hover, .ui-to-tab-2:hover) .ui-to-content-3 { opacity: 0.2; }

@media (prefers-reduced-motion: reduce) {
  .ui-to-bar { animation: none; }
  .ui-to-blobs, .ui-to-front, .ui-to-content { transition: none; }
}
`;
}

if (!customElements.get("tc-tab-overload")) customElements.define("tc-tab-overload", TcTabOverload);

declare global {
  interface HTMLElementTagNameMap {
    "tc-tab-overload": TcTabOverload;
  }
}
