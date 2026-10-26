import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { OnScreenController } from "./internal/controllers";

/*
 * <tc-lead-sourcing> – the Lit port of illustrations/lead-sourcing.tsx: a ChatGPT tile in the middle, connected to
 * Gmail on the left and Grok on the right, with four empty tiles fading out around it. A coloured shine runs along
 * the connecting line three times and rests; it pauses off screen (the SVG's own clock) and reduced motion leaves it
 * out. Colours follow the page theme through light-dark(). Decorative unless given a `label`.
 *
 *   <tc-lead-sourcing label="Leads sourced from Gmail and Grok"></tc-lead-sourcing>
 */

/** Diagonal tiles: corner, x, y and the inner corner they fade out from */
const TILES = [
  ["tl", 67, 27, 117, 77],
  ["tr", 203, 27, 203, 77],
  ["bl", 67, 163, 117, 163],
  ["br", 203, 163, 203, 163],
] as const;

let serial = 0;
const reduceQuery = () => (typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : undefined);

/**
 * A small card illustration: three connected app tiles with a shine running along the line.
 * @tag tc-lead-sourcing
 */
export class TcLeadSourcing extends TcElement {
  static override ui = "ls";
  static override looks = false;

  /** Describes the scene to assistive tech (role="img"); without it the illustration is decorative and hidden */
  @property() accessor label: string | undefined = undefined;

  /** @internal The visitor asked for reduced motion (SVG <animate> ignores CSS media queries) */
  @state() accessor reducedMotion = false;

  /** @internal Unique prefix for gradient, filter and mask ids */
  private readonly svgId = `ui-ls${++serial}`;
  private readonly screen = new OnScreenController(this);
  private media?: MediaQueryList;
  private clock: boolean | undefined;
  private onMedia = () => (this.reducedMotion = !!this.media?.matches);

  override connectedCallback() {
    super.connectedCallback();
    this.media = reduceQuery();
    this.media?.addEventListener("change", this.onMedia);
    this.onMedia();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.media?.removeEventListener("change", this.onMedia);
    this.clock = undefined;
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (this.hasUpdated && !changed.has("label")) return;
    // A described image when there's a label, otherwise decoration that assistive tech skips
    if (this.label) {
      this.setAttribute("role", "img");
      this.setAttribute("aria-label", this.label);
      this.removeAttribute("aria-hidden");
    } else {
      if (changed.get("label")) {
        this.removeAttribute("role");
        this.removeAttribute("aria-label");
      }
      this.setAttribute("aria-hidden", "true");
    }
  }

  protected override updated() {
    // The shine is SMIL (<animate>), which CSS can't pause – the SVG's own clock stops instead
    const on = this.screen.onScreen;
    if (on === this.clock) return;
    this.clock = on;
    const art = this.querySelector<SVGSVGElement>(":scope > .ui-ls-art");
    if (on) art?.unpauseAnimations?.();
    else art?.pauseAnimations?.();
  }

  private tile(x: number, y: number, size = 50, rx = 10) {
    return svg`<rect x=${x} y=${y} width=${size} height=${size} rx=${rx} class="ui-ls-tile" fill="#FFFFFF" stroke="#E4E7EC" stroke-width="0.5" filter=${`url(#${this.svgId}-tile)`}></rect>`;
  }

  protected override render() {
    const id = this.svgId;
    return html`<svg class="ui-ls-art" viewBox="0 0 320 240" aria-hidden="true">
      ${svg`<defs>
        <filter id=${`${id}-tile`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="dropBlur"></feGaussianBlur>
          <feOffset in="dropBlur" dx="0" dy="3" result="dropOffset"></feOffset>
          <feFlood class="ui-ls-drop" flood-color="#000000" flood-opacity="0.06" result="dropColor"></feFlood>
          <feComposite in="dropColor" in2="dropOffset" operator="in" result="dropShadow"></feComposite>
          <feOffset in="SourceAlpha" dx="0" dy="-4" result="alphaUp"></feOffset>
          <feComposite in="SourceAlpha" in2="alphaUp" operator="out" result="bottomSliver"></feComposite>
          <feFlood class="ui-ls-sliver" flood-color="#EAECEF" flood-opacity="1" result="innerColor"></feFlood>
          <feComposite in="innerColor" in2="bottomSliver" operator="in" result="innerShadow"></feComposite>
          <feMerge>
            <feMergeNode in="dropShadow"></feMergeNode>
            <feMergeNode in="SourceGraphic"></feMergeNode>
            <feMergeNode in="innerShadow"></feMergeNode>
          </feMerge>
        </filter>
        <filter id=${`${id}-blur`} x="-100%" y="-300%" width="300%" height="700%">
          <feGaussianBlur stdDeviation="10"></feGaussianBlur>
        </filter>
        <linearGradient id=${`${id}-blob`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#FFA0AB" stop-opacity="0.6"></stop>
          <stop offset="33%" stop-color="#FFB89E" stop-opacity="0.6"></stop>
          <stop offset="66%" stop-color="#C8A8E5" stop-opacity="0.6"></stop>
          <stop offset="100%" stop-color="#A8B5FF" stop-opacity="0.6"></stop>
        </linearGradient>
        <linearGradient id=${`${id}-edge`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop class="ui-ls-gray" offset="0%" stop-color="#E4E7EC"></stop>
          <stop offset="18%" stop-color="#FFB5BC"></stop>
          <stop offset="40%" stop-color="#FFC5AB"></stop>
          <stop offset="60%" stop-color="#D5BBEF"></stop>
          <stop offset="82%" stop-color="#B5C0FF"></stop>
          <stop class="ui-ls-gray" offset="100%" stop-color="#E4E7EC"></stop>
        </linearGradient>
        <linearGradient id=${`${id}-shine`} gradientUnits="userSpaceOnUse" x1="-195" y1="120" x2="195" y2="120">
          <stop class="ui-ls-gray" offset="0%" stop-color="#E4E7EC"></stop>
          <stop class="ui-ls-gray" offset="43%" stop-color="#E4E7EC"></stop>
          <stop offset="46%" stop-color="#FF6B5C"></stop>
          <stop offset="48%" stop-color="#FFB89E"></stop>
          <stop offset="50%" stop-color="#C8A8E5"></stop>
          <stop offset="52%" stop-color="#A8B5FF"></stop>
          <stop class="ui-ls-gray" offset="56%" stop-color="#E4E7EC"></stop>
          <stop class="ui-ls-gray" offset="100%" stop-color="#E4E7EC"></stop>
          ${this.reducedMotion
            ? nothing
            : svg`<animate attributeName="x1" values="-195;125;125" keyTimes="0;0.3;1" dur="3.6s" repeatCount="3" fill="freeze"></animate>
                <animate attributeName="x2" values="195;515;515" keyTimes="0;0.3;1" dur="3.6s" repeatCount="3" fill="freeze"></animate>`}
        </linearGradient>
        ${TILES.map(
          ([corner, x, y, ix, iy]) => svg`<g>
            <radialGradient id=${`${id}-fade-${corner}`} gradientUnits="userSpaceOnUse" cx=${ix} cy=${iy} r="78">
              <stop offset="0%" stop-color="#FFFFFF"></stop>
              <stop offset="38%" stop-color="#FFFFFF"></stop>
              <stop offset="100%" stop-color="#000000"></stop>
            </radialGradient>
            <mask id=${`${id}-mask-${corner}`} maskUnits="userSpaceOnUse" x=${x - 16} y=${y - 16} width="82" height="88">
              <rect x=${x - 16} y=${y - 16} width="82" height="88" fill=${`url(#${id}-fade-${corner})`}></rect>
            </mask>
          </g>`,
        )}
        <linearGradient id=${`${id}-ends`} gradientUnits="userSpaceOnUse" x1="25" y1="120" x2="295" y2="120">
          <stop offset="0%" stop-color="#000000"></stop>
          <stop offset="22%" stop-color="#FFFFFF"></stop>
          <stop offset="78%" stop-color="#FFFFFF"></stop>
          <stop offset="100%" stop-color="#000000"></stop>
        </linearGradient>
        <mask id=${`${id}-ends-mask`} maskUnits="userSpaceOnUse" x="20" y="115" width="280" height="10">
          <rect x="20" y="115" width="280" height="10" fill=${`url(#${id}-ends)`}></rect>
        </mask>
      </defs>

      <ellipse cx="160" cy="152" rx="22" ry="8" fill=${`url(#${id}-blob)`} filter=${`url(#${id}-blur)`}></ellipse>

      <line x1="25" y1="120" x2="295" y2="120" stroke=${`url(#${id}-shine)`} stroke-width="1.5" mask=${`url(#${id}-ends-mask)`}></line>

      ${this.tile(45, 95)}
      ${gmailLogo(`${id}-gm`, 58, 110.45, 24)}

      ${this.tile(225, 95)}
      ${grokLogo(238, 107, 26)}

      ${TILES.map(([corner, x, y]) => svg`<g mask=${`url(#${id}-mask-${corner})`}>${this.tile(x, y)}</g>`)}

      ${this.tile(128, 88, 64, 14)}
      <path d="M128 138 A 14 14 0 0 0 142 152 L178 152 A 14 14 0 0 0 192 138" fill="none" stroke=${`url(#${id}-edge)`} stroke-width="0.5"></path>
      ${chatGptLogo(146, 106, 28)}`}
    </svg>`;
  }

  static override css = /* css */ `
/* Theme: the colours below use light-dark(), which follows color-scheme */
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

[data-ui="ls"] {
  --tc-lead-sourcing-tile: light-dark(#ffffff, #232326);
  --tc-lead-sourcing-tile-edge: light-dark(#e4e7ec, rgba(255, 255, 255, 0.08));
  --tc-lead-sourcing-drop: light-dark(rgba(0, 0, 0, 0.06), rgba(0, 0, 0, 0.4));
  --tc-lead-sourcing-sliver: light-dark(#eaecef, #1a1a1c);
  --tc-lead-sourcing-line: light-dark(#e4e7ec, #3a3a3f);
  --tc-lead-sourcing-mark: light-dark(#171717, #ededed);
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 2;
  overflow: hidden;
}
.ui-ls-art {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}

/* Theme colours: light-dark() follows the page theme, wherever it comes from */
.ui-ls-tile { fill: var(--tc-lead-sourcing-tile); stroke: var(--tc-lead-sourcing-tile-edge); }
.ui-ls-drop { flood-color: var(--tc-lead-sourcing-drop); flood-opacity: 1; }
.ui-ls-sliver { flood-color: var(--tc-lead-sourcing-sliver); }
.ui-ls-gray { stop-color: var(--tc-lead-sourcing-line); }
.ui-ls-mark { fill: var(--tc-lead-sourcing-mark); }
`;
}

/* ---------- Logos (nested SVGs, placed in the 320 × 240 artboard) ---------- */

const gmailLogo = (id: string, x: number, y: number, width: number) => svg`<svg x=${x} y=${y} width=${width} height=${(width * 44.8722) / 56.4108} viewBox="0 0 56.4108 44.8722" fill="none">
  <path d="M44.2255 5.76727H56.4051V41.0239C56.4051 43.148 54.683 44.8701 52.5589 44.8701H46.1486C45.8961 44.8701 45.646 44.8204 45.4127 44.7237C45.1794 44.6271 44.9674 44.4854 44.7888 44.3069C44.6102 44.1283 44.4686 43.9163 44.3719 43.683C44.2753 43.4497 44.2255 43.1996 44.2255 42.947V5.76727Z" fill=${`url(#${id}-0)`}></path>
  <path d="M12.1796 5.76727H0V41.0239C0 43.148 1.72213 44.8701 3.84618 44.8701H10.2565C10.509 44.8701 10.7591 44.8204 10.9924 44.7237C11.2257 44.6271 11.4377 44.4854 11.6163 44.3069C11.7949 44.1283 11.9365 43.9163 12.0332 43.683C12.1298 43.4497 12.1796 43.1996 12.1796 42.947V5.76727Z" fill="#FC413D"></path>
  <path d="M10.0085 1.42778C7.43377 -0.736342 3.5924 -0.403647 1.42828 2.17105C-0.735843 4.74543 -0.403148 8.58681 2.17155 10.7512L26.5557 31.2479C27.0178 31.6362 27.602 31.8492 28.2056 31.8492C28.8091 31.8492 29.3934 31.6362 29.8554 31.2479L54.2396 10.7509C56.814 8.58681 57.1467 4.74543 54.9825 2.17073C52.8184 -0.403648 48.977 -0.736342 46.4027 1.42778L28.2054 16.724L10.0085 1.42778Z" fill=${`url(#${id}-1)`}></path>
  <defs>
    <linearGradient id=${`${id}-0`} x1="50.3153" y1="5.76727" x2="50.3153" y2="44.8701" gradientUnits="userSpaceOnUse">
      <stop stop-color="#60D673"></stop>
      <stop offset="0.17" stop-color="#42C868"></stop>
      <stop offset="0.39" stop-color="#0EBC5F"></stop>
      <stop offset="0.62" stop-color="#00A9BB"></stop>
      <stop offset="0.86" stop-color="#3C90FF"></stop>
      <stop offset="1" stop-color="#3186FF"></stop>
    </linearGradient>
    <linearGradient id=${`${id}-1`} x1="6.04194e-05" y1="6.45153" x2="56.4107" y2="6.45153" gradientUnits="userSpaceOnUse">
      <stop offset="0.08" stop-color="#FF63A0"></stop>
      <stop offset="0.3" stop-color="#FC413D"></stop>
      <stop offset="0.5" stop-color="#FC413D"></stop>
      <stop offset="0.65" stop-color="#FC413D"></stop>
      <stop offset="0.72" stop-color="#FC5C30"></stop>
      <stop offset="0.86" stop-color="#FEB10C"></stop>
      <stop offset="0.91" stop-color="#FEC700"></stop>
      <stop offset="0.96" stop-color="#FFDB0F"></stop>
    </linearGradient>
  </defs>
</svg>`;

/** ChatGPT mark, monochrome */
const chatGptLogo = (x: number, y: number, size: number) => svg`<svg x=${x} y=${y} width=${size} height=${size} viewBox="0 0 68.614 68.002" overflow="visible">
  <path class="ui-ls-mark" fill="#171717" d="M26.3166 24.7525V18.2923C26.3166 17.7482 26.5208 17.3401 26.9966 17.0684L39.9853 9.5882C41.7533 8.56821 43.8615 8.09244 46.0372 8.09244C54.1973 8.09244 59.3658 14.4167 59.3658 21.1486C59.3658 21.6245 59.3658 22.1686 59.2976 22.7127L45.8331 14.8243C45.0172 14.3486 44.2009 14.3486 43.385 14.8243L26.3166 24.7525ZM56.6454 49.9134V34.4766C56.6454 33.5244 56.2371 32.8444 55.4213 32.3685L38.3529 22.4403L43.9291 19.244C44.405 18.9723 44.8131 18.9723 45.289 19.244L58.2776 26.7242C62.018 28.9005 64.5338 33.5244 64.5338 38.0122C64.5338 43.1802 61.4739 47.9406 56.6454 49.9128V49.9134ZM22.3045 36.3131L16.7284 33.0492C16.2526 32.7775 16.0484 32.3692 16.0484 31.8251V16.8649C16.0484 9.58891 21.6245 4.08038 29.1729 4.08038C32.0293 4.08038 34.6809 5.03262 36.9255 6.7326L23.5292 14.485C22.7134 14.9608 22.3052 15.6408 22.3052 16.5932V36.3137L22.3045 36.3131ZM34.307 43.2491L26.3166 38.7611V29.2412L34.307 24.7532L42.2968 29.2412V38.7611L34.307 43.2491ZM39.4411 63.9219C36.5848 63.9219 33.9333 62.9697 31.6886 61.2699L45.0848 53.5173C45.9007 53.0415 46.3089 52.3615 46.3089 51.4091V31.6886L51.9533 34.9525C52.4291 35.2242 52.6333 35.6324 52.6333 36.1766V51.1369C52.6333 58.4128 46.9889 63.9214 39.4411 63.9214V63.9219ZM23.3245 48.7576L10.3358 41.2775C6.59541 39.1011 4.07967 34.4773 4.07967 29.9894C4.07967 24.7532 7.2078 20.0612 12.0356 18.0889V33.5933C12.0356 34.5455 12.4439 35.2255 13.2597 35.7014L30.2605 45.5613L24.6844 48.7576C24.2086 49.0293 23.8003 49.0293 23.3245 48.7576ZM22.5769 59.9099C14.8926 59.9099 9.24834 54.1297 9.24834 46.9895C9.24834 46.4454 9.31651 45.9013 9.38411 45.3572L22.7804 53.1097C23.5962 53.5856 24.4127 53.5856 25.2284 53.1097L42.2968 43.2498V49.71C42.2968 50.2541 42.0927 50.6622 41.6168 50.9339L28.6283 58.4141C26.8601 59.4341 24.752 59.9099 22.5762 59.9099H22.5769ZM39.4411 68.0017C47.6694 68.0017 54.5372 62.1538 56.1019 54.4013C63.718 52.4291 68.6141 45.2889 68.6141 38.0129C68.6141 33.2526 66.5743 28.6288 62.9021 25.2966C63.2421 23.8685 63.4462 22.4403 63.4462 21.0129C63.4462 11.2887 55.5578 4.01207 46.4454 4.01207C44.6098 4.01207 42.8416 4.28375 41.0735 4.89614C38.0129 1.90392 33.7968 0 29.1729 0C20.9447 0 14.0769 5.84782 12.5122 13.6003C4.89614 15.5725 0 22.7127 0 29.9887C0 34.749 2.03983 39.3728 5.71204 42.705C5.37205 44.1331 5.16797 45.5613 5.16797 46.9889C5.16797 56.713 13.0563 63.9895 22.1686 63.9895C24.0044 63.9895 25.7725 63.7179 27.5407 63.1055C30.6005 66.0977 34.8166 68.0017 39.4411 68.0017Z"></path>
</svg>`;

/** Grok mark, monochrome */
const grokLogo = (x: number, y: number, size: number) => svg`<svg x=${x} y=${y} width=${size} height=${size} viewBox="0 0 33.4 32" overflow="visible">
  <path class="ui-ls-mark" fill="#171717" d="M12.8734 20.5407L23.9549 12.3506C24.4982 11.9491 25.2747 12.1057 25.5336 12.7294C26.896 16.0185 26.2873 19.9712 23.5766 22.6851C20.866 25.3989 17.0944 25.9941 13.6471 24.6386L9.88123 26.3843C15.2826 30.0806 21.8416 29.1665 25.9403 25.0601C29.1914 21.8051 30.1983 17.3683 29.2568 13.3673L29.2653 13.3758C27.9 7.49809 29.601 5.14871 33.0853 0.344576C33.1677 0.230667 33.2502 0.116757 33.3327 0L28.7476 4.59055V4.57631L12.8706 20.5436"></path>
  <path class="ui-ls-mark" fill="#171717" d="M10.5867 22.5312C6.70979 18.8234 7.37821 13.0852 10.6862 9.77618C13.1323 7.3271 17.14 6.32755 20.6385 7.79698L24.3959 6.05986C23.719 5.57005 22.8514 5.04322 21.8559 4.67301C17.3562 2.81914 11.969 3.7418 8.31115 7.40114C4.79271 10.9238 3.68626 16.3402 5.58628 20.9621C7.0056 24.4164 4.67893 26.8597 2.3352 29.3259C1.50465 30.2001 0.67126 31.0744 0 31.9999L10.5838 22.534"></path>
</svg>`;

if (!customElements.get("tc-lead-sourcing")) customElements.define("tc-lead-sourcing", TcLeadSourcing);

declare global {
  interface HTMLElementTagNameMap {
    "tc-lead-sourcing": TcLeadSourcing;
  }
}
