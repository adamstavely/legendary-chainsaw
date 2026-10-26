import { html, svg } from "lit";
import { property } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { OnScreenController } from "./internal/controllers";

/*
 * <tc-outreach-branches> – the Lit port of illustrations/outreach-branches.tsx: three lines branch out from one point
 * and lead down to Gmail, Slack and Notion tiles; soft coloured pulses run down each line, split at the tile and trace
 * both of its sides. Drawn on a 320 × 240 viewBox inside a 3 : 2 frame.
 *
 *   <tc-outreach-branches label="Outreach across Gmail, Slack and Notion"></tc-outreach-branches>
 *
 * Decorative by default (aria-hidden on the host); with `label` the host is an image named by it. The pulses run
 * three rounds and rest; they hold off screen or in a hidden tab (data-paused) and reduced motion leaves them out.
 * Colours follow the page theme through light-dark().
 */

let uid = 0;

/** The three branches: straight down to the middle tile, curved out to the left and right tile */
const branches = ["M160 52 V120", "M160 52 C 160 86, 72 86, 72 130", "M160 52 C 160 86, 248 86, 248 130"];

/** Tile each branch arrives at: x, y, size, corner radius */
const tiles = [
  [128, 120, 64, 14],
  [44, 130, 56, 12],
  [220, 130, 56, 12],
] as const;

/** From the top center of a tile, around one side and down to the bottom center */
const half = ([x, y, w, r]: readonly [number, number, number, number], side: "left" | "right") => {
  const cx = x + w / 2;
  return side === "left"
    ? `H${x + r} A${r} ${r} 0 0 0 ${x} ${y + r} V${y + w - r} A${r} ${r} 0 0 0 ${x + r} ${y + w} H${cx}`
    : `H${x + w - r} A${r} ${r} 0 0 1 ${x + w} ${y + r} V${y + w - r} A${r} ${r} 0 0 1 ${x + w - r} ${y + w} H${cx}`;
};

/** Two phases per branch: a pulse runs down the line, pauses, then splits and traces both sides of its tile */
const pulses = branches.flatMap((d, i) => {
  const [x, y, w] = tiles[i];
  const top = `M${x + w / 2} ${y}`;
  return [
    { d, branch: i, phase: "line" as const },
    { d: `${top} ${half(tiles[i], "left")}`, branch: i, phase: "tile" as const },
    { d: `${top} ${half(tiles[i], "right")}`, branch: i, phase: "tile" as const },
  ];
});

/** Stacked dashes of falling length and opacity give the pulse a soft head and tail */
const LAYERS = [
  [36, 0.18],
  [25, 0.38],
  [15, 0.7],
  [7, 1],
] as const;
const LONGEST = LAYERS[0][0];

/* ---------- Logos (nested SVGs, placed in the 320 × 240 artboard) ---------- */

const gmailLogo = (id: string, x: number, y: number, width: number) => svg`
    <svg x=${x} y=${y} width=${width} height=${(width * 44.8722) / 56.4108} viewBox="0 0 56.4108 44.8722" fill="none">
      <path
        d="M44.2255 5.76727H56.4051V41.0239C56.4051 43.148 54.683 44.8701 52.5589 44.8701H46.1486C45.8961 44.8701 45.646 44.8204 45.4127 44.7237C45.1794 44.6271 44.9674 44.4854 44.7888 44.3069C44.6102 44.1283 44.4686 43.9163 44.3719 43.683C44.2753 43.4497 44.2255 43.1996 44.2255 42.947V5.76727Z"
        fill="url(#${id}-gm0)"></path>
      <path
        d="M12.1796 5.76727H0V41.0239C0 43.148 1.72213 44.8701 3.84618 44.8701H10.2565C10.509 44.8701 10.7591 44.8204 10.9924 44.7237C11.2257 44.6271 11.4377 44.4854 11.6163 44.3069C11.7949 44.1283 11.9365 43.9163 12.0332 43.683C12.1298 43.4497 12.1796 43.1996 12.1796 42.947V5.76727Z"
        fill="#FC413D"></path>
      <path
        d="M10.0085 1.42778C7.43377 -0.736342 3.5924 -0.403647 1.42828 2.17105C-0.735843 4.74543 -0.403148 8.58681 2.17155 10.7512L26.5557 31.2479C27.0178 31.6362 27.602 31.8492 28.2056 31.8492C28.8091 31.8492 29.3934 31.6362 29.8554 31.2479L54.2396 10.7509C56.814 8.58681 57.1467 4.74543 54.9825 2.17073C52.8184 -0.403648 48.977 -0.736342 46.4027 1.42778L28.2054 16.724L10.0085 1.42778Z"
        fill="url(#${id}-gm1)"></path>
      <defs>
        <linearGradient
          id="${id}-gm0"
          x1="50.3153"
          y1="5.76727"
          x2="50.3153"
          y2="44.8701"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#60D673"></stop>
          <stop offset="0.17" stop-color="#42C868"></stop>
          <stop offset="0.39" stop-color="#0EBC5F"></stop>
          <stop offset="0.62" stop-color="#00A9BB"></stop>
          <stop offset="0.86" stop-color="#3C90FF"></stop>
          <stop offset="1" stop-color="#3186FF"></stop>
        </linearGradient>
        <linearGradient
          id="${id}-gm1"
          x1="6.04194e-05"
          y1="6.45153"
          x2="56.4107"
          y2="6.45153"
          gradientUnits="userSpaceOnUse"
        >
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

const slackLogo = (x: number, y: number, size: number) => svg`
  <svg x=${x} y=${y} width=${size} height=${size} viewBox="0 0 49.883 49.877" fill="none">
    <path
      d="M18.3549 10.4784C15.4713 10.4784 13.1157 8.12279 13.1157 5.2392C13.1157 2.35561 15.4713 0 18.3549 0C21.2385 0 23.5941 2.35561 23.5941 5.2392V10.4784H18.3549Z"
      fill="#36C5F0"></path>
    <path
      d="M18.3575 13.12C21.2411 13.12 23.5967 15.4756 23.5967 18.3592C23.5967 21.2428 21.2411 23.5984 18.3575 23.5984H5.2392C2.35561 23.5984 0 21.2428 0 18.3592C0 15.4756 2.35561 13.12 5.2392 13.12H18.3575Z"
      fill="#36C5F0"></path>
    <g transform="translate(26.28 0)">
      <path
        d="M13.1244 18.3592C13.1244 15.4756 15.48 13.12 18.3636 13.12C21.2472 13.12 23.6028 15.4756 23.6028 18.3592C23.6028 21.2428 21.2472 23.5984 18.3636 23.5984H13.1244V18.3592Z"
        fill="#2EB67D"></path>
      <path
        d="M10.4785 18.3575C10.4785 21.2411 8.12286 23.5967 5.23927 23.5967C2.35568 23.5967 7.4362e-05 21.2411 7.4362e-05 18.3575V5.2392C7.4362e-05 2.35561 2.35568 0 5.23927 0C8.12286 0 10.4785 2.35561 10.4785 5.2392V18.3575Z"
        fill="#2EB67D"></path>
    </g>
    <g transform="translate(0 26.28)">
      <path
        d="M10.4784 5.2392C10.4784 8.12279 8.12279 10.4784 5.2392 10.4784C2.35561 10.4784 0 8.12279 0 5.2392C0 2.35561 2.35561 0 5.2392 0H10.4784V5.2392Z"
        fill="#E01E5A"></path>
      <path
        d="M13.1157 5.2392C13.1157 2.35561 15.4713 0 18.3549 0C21.2385 0 23.5941 2.35561 23.5941 5.2392V18.3575C23.5941 21.2411 21.2385 23.5967 18.3549 23.5967C15.4713 23.5967 13.1157 21.2411 13.1157 18.3575V5.2392Z"
        fill="#E01E5A"></path>
    </g>
    <g transform="translate(26.28 26.28)">
      <path
        d="M5.23927 13.1157C8.12286 13.1157 10.4785 15.4713 10.4785 18.3549C10.4785 21.2385 8.12286 23.5941 5.23927 23.5941C2.35568 23.5941 7.4362e-05 21.2385 7.4362e-05 18.3549V13.1157H5.23927Z"
        fill="#ECB22E"></path>
      <path
        d="M5.23927 10.4784C2.35568 10.4784 7.4362e-05 8.12279 7.4362e-05 5.2392C7.4362e-05 2.35561 2.35568 0 5.23927 0H18.3576C21.2412 0 23.5968 2.35561 23.5968 5.2392C23.5968 8.12279 21.2412 10.4784 18.3576 10.4784H5.23927Z"
        fill="#ECB22E"></path>
    </g>
  </svg>
`;

/** Notion mark, monochrome */
const notionLogo = (x: number, y: number, size: number) => svg`
  <svg x=${x} y=${y} width=${size} height=${size} viewBox="0 0 70.808 74.12" overflow="visible">
    <path
      class="ui-obr-notion-page"
      fill="#ffffff"
      d="M4.49207 3.25638L45.393 0.182895C50.3579 -0.289949 51.6582 0.0646841 54.8499 2.31069L67.9713 11.5311C70.0991 13.0679 70.8084 13.5407 70.8084 15.3139V65.7899C70.8084 68.9816 69.6263 70.873 65.6071 71.1094L18.0863 73.9465C15.0128 74.0647 13.5943 73.7101 12.0576 71.7005L2.48248 59.2883C0.709318 56.9241 5.27941e-05 55.2692 5.27941e-05 53.2596V8.33945C5.27941e-05 5.73881 1.18216 3.4928 4.49207 3.25638Z"></path>
    <path
      class="ui-obr-mark"
      fill="#171717"
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M45.393 0.182995L4.49201 3.25648C1.18211 3.4929 0 5.73891 0 8.33954V53.2597C0 55.2693 0.709265 57.0424 2.48243 59.2884L12.0575 71.8188C13.5942 73.8284 15.131 74.3012 18.0863 74.0648L65.607 71.2277C69.6262 70.9913 70.8083 69.0999 70.8083 65.9082V15.314C70.8083 13.659 70.2173 13.1862 68.2077 11.7677C68.0895 11.6494 67.9712 11.6494 67.853 11.5312L54.8498 2.429C51.7764 0.0647844 50.476 -0.171637 45.393 0.182995ZM19.1502 14.4865C15.2492 14.7229 14.4217 14.8411 12.1757 12.9498L6.61981 8.57597C6.02875 7.98491 6.26518 7.27565 7.80192 7.15744L47.1661 4.32038C50.476 4.08395 52.131 5.14785 53.4313 6.21175L60.1693 11.0584C60.524 11.1766 61.2332 12.0041 60.2875 12.0041L19.623 14.4865H19.1502ZM14.6581 65.4354V22.5248C14.6581 20.6335 15.2492 19.806 16.9042 19.6878L63.5974 16.9689C65.1342 16.8507 65.8435 17.7964 65.8435 19.6878V62.2437C65.8435 64.1351 65.4888 65.6718 63.0064 65.79L18.3227 68.3907C15.8403 68.6271 14.6581 67.6814 14.6581 65.4354ZM58.7508 24.8891C58.9872 26.1894 58.7508 27.4897 57.4505 27.6079L55.3227 28.0808V59.7613C53.4313 60.8252 51.7764 61.298 50.3578 61.298C48.1118 61.298 47.5208 60.5887 45.7476 58.461L31.5623 36.2373V57.6335L36.0543 58.6974C36.0543 58.6974 36.0543 61.298 32.508 61.298L22.5783 61.8891C22.3419 61.298 22.5783 59.8795 23.524 59.6431L26.1246 58.9338V30.5632L22.5783 30.2086C22.3419 28.9082 23.0511 27.0169 25.0607 26.8987L35.6997 26.1894L50.3578 48.6494V28.79L46.5751 28.3172C46.3387 26.7804 47.4026 25.5983 48.8211 25.4801L58.7508 24.8891Z"></path>
  </svg>
`;

/* ---------- Styles ---------- */

const css = /* css */ `
/* Theme: the colours below use light-dark(), which follows color-scheme */
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

[data-ui="obr"] {
  --tc-outreach-branches-line: light-dark(#e4e7ec, rgba(255, 255, 255, 0.14));
  --tc-outreach-branches-tile: light-dark(#ffffff, #232326);
  --tc-outreach-branches-tile-edge: light-dark(#e4e7ec, rgba(255, 255, 255, 0.08));
  --tc-outreach-branches-drop: light-dark(rgba(0, 0, 0, 0.06), rgba(0, 0, 0, 0.4));
  --tc-outreach-branches-sliver: light-dark(#eaecef, #1a1a1c);
  --tc-outreach-branches-gray: light-dark(#e4e7ec, #3a3a3f);
  --tc-outreach-branches-notion-page: light-dark(#ffffff, #191919);
  --tc-outreach-branches-mark: light-dark(#171717, #ededed);
  /* One round of the pulses; three rounds and they rest (WCAG 2.2.2) */
  --tc-outreach-branches-pulse: 4.2s;
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 2;
  overflow: hidden;
}
.ui-obr-art {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}

/* Each cycle: the pulse eases down its line (slow, fast, slow), rests a moment at the tile,
   the moment its head reaches the tile it splits and eases around both sides – no pause – thinner and fainter there */
.ui-obr-flow,
.ui-obr-wrap {
  fill: none;
  stroke-linecap: round;
  stroke-dashoffset: var(--from);
  opacity: 0;
  animation-duration: var(--tc-outreach-branches-pulse);
  animation-iteration-count: 3;
}
.ui-obr-flow {
  stroke-width: 1;
  animation-name: ui-obr-flow;
}
.ui-obr-wrap {
  stroke-width: 0.8;
  animation-name: ui-obr-wrap;
}
/* Off screen or in a hidden tab the pulses hold where they are */
[data-ui="obr"][data-paused] .ui-obr-flow,
[data-ui="obr"][data-paused] .ui-obr-wrap { animation-play-state: paused; }
@keyframes ui-obr-flow {
  0% {
    stroke-dashoffset: var(--from);
    opacity: 0.8;
    animation-timing-function: cubic-bezier(0.7, 0, 0.3, 1);
  }
  40% {
    stroke-dashoffset: var(--to);
    opacity: 0.8;
  }
  40.1%,
  100% {
    stroke-dashoffset: var(--to);
    opacity: 0;
  }
}
@keyframes ui-obr-wrap {
  0%,
  23.2% {
    stroke-dashoffset: var(--from);
    opacity: 0;
  }
  23.3% {
    stroke-dashoffset: var(--from);
    opacity: 0.45;
    animation-timing-function: cubic-bezier(0.7, 0, 0.3, 1);
  }
  61.8% {
    stroke-dashoffset: var(--to);
    opacity: 0.45;
  }
  61.9%,
  100% {
    stroke-dashoffset: var(--to);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ui-obr-flow, .ui-obr-wrap { animation: none; opacity: 0; }
}

/* Theme colours: light-dark() follows the page theme, wherever it comes from */
.ui-obr-lines { stroke: var(--tc-outreach-branches-line); }
.ui-obr-tile { fill: var(--tc-outreach-branches-tile); stroke: var(--tc-outreach-branches-tile-edge); }
.ui-obr-drop { flood-color: var(--tc-outreach-branches-drop); flood-opacity: 1; }
.ui-obr-sliver { flood-color: var(--tc-outreach-branches-sliver); }
.ui-obr-gray { stop-color: var(--tc-outreach-branches-gray); }
/* Notion mark inverts in dark: dark page, light outline */
.ui-obr-notion-page { fill: var(--tc-outreach-branches-notion-page); }
.ui-obr-mark { fill: var(--tc-outreach-branches-mark); }
`;

/**
 * Lines branching out to Gmail, Slack and Notion – an illustration for multi-channel outreach.
 * @tag tc-outreach-branches
 */
export class TcOutreachBranches extends TcElement {
  static override ui = "obr";
  static override looks = false;
  static override css = css;

  /** Describes the scene to assistive tech (role="img"); without it the illustration is decorative and hidden from them */
  @property() accessor label = "";

  /** @internal */
  private readonly screen = new OnScreenController(this);
  /** @internal Unique ids for gradients and filters, so several illustrations on one page don't clash */
  private readonly uid = `ui-obr${++uid}`;

  protected override updated() {
    toggleImage(this, this.label);
    this.toggleAttribute("data-paused", !this.screen.onScreen);
  }

  protected override render() {
    const id = this.uid;
    return html`<svg class="ui-obr-art" viewBox="0 0 320 240" aria-hidden="true">${svg`
        <defs>
          <filter id="${id}-tile" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="dropBlur"></feGaussianBlur>
            <feOffset in="dropBlur" dx="0" dy="3" result="dropOffset"></feOffset>
            <feFlood class="ui-obr-drop" flood-color="#000000" flood-opacity="0.06" result="dropColor"></feFlood>
            <feComposite in="dropColor" in2="dropOffset" operator="in" result="dropShadow"></feComposite>
            <feOffset in="SourceAlpha" dx="0" dy="-4" result="alphaUp"></feOffset>
            <feComposite in="SourceAlpha" in2="alphaUp" operator="out" result="sliver"></feComposite>
            <feFlood class="ui-obr-sliver" flood-color="#EAECEF" flood-opacity="1" result="innerColor"></feFlood>
            <feComposite in="innerColor" in2="sliver" operator="in" result="innerShadow"></feComposite>
            <feMerge>
              <feMergeNode in="dropShadow"></feMergeNode>
              <feMergeNode in="SourceGraphic"></feMergeNode>
              <feMergeNode in="innerShadow"></feMergeNode>
            </feMerge>
          </filter>
          <filter id="${id}-blur" x="-60%" y="-200%" width="220%" height="500%">
            <feGaussianBlur stdDeviation="11"></feGaussianBlur>
          </filter>
          <linearGradient id="${id}-blob" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#FFA0AB" stop-opacity="0.55"></stop>
            <stop offset="33%" stop-color="#FFB89E" stop-opacity="0.55"></stop>
            <stop offset="66%" stop-color="#C8A8E5" stop-opacity="0.55"></stop>
            <stop offset="100%" stop-color="#A8B5FF" stop-opacity="0.55"></stop>
          </linearGradient>
          <linearGradient id="${id}-edge" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop class="ui-obr-gray" offset="0%" stop-color="#E4E7EC"></stop>
            <stop offset="18%" stop-color="#FFB5BC"></stop>
            <stop offset="40%" stop-color="#FFC5AB"></stop>
            <stop offset="60%" stop-color="#D5BBEF"></stop>
            <stop offset="82%" stop-color="#B5C0FF"></stop>
            <stop class="ui-obr-gray" offset="100%" stop-color="#E4E7EC"></stop>
          </linearGradient>
          <linearGradient id="${id}-pulse" gradientUnits="userSpaceOnUse" x1="40" y1="0" x2="280" y2="0">
            <stop offset="0%" stop-color="#FF8A96"></stop>
            <stop offset="33%" stop-color="#FFA77F"></stop>
            <stop offset="66%" stop-color="#B98EE5"></stop>
            <stop offset="100%" stop-color="#8E9DFF"></stop>
          </linearGradient>
        </defs>
        <g class="ui-obr-lines" fill="none" stroke="#E4E7EC" stroke-width="1.2" stroke-linecap="round">
          ${branches.map((d) => svg`<path d=${d}></path>`)}
        </g>
        <rect
          x="44"
          y="130"
          width="56"
          height="56"
          rx="12"
          class="ui-obr-tile"
          fill="#FFFFFF"
          stroke="#E4E7EC"
          stroke-width="0.5"
          filter="url(#${id}-tile)"></rect>
        ${gmailLogo(id, 57, 146.07, 30)}
        <rect
          x="220"
          y="130"
          width="56"
          height="56"
          rx="12"
          class="ui-obr-tile"
          fill="#FFFFFF"
          stroke="#E4E7EC"
          stroke-width="0.5"
          filter="url(#${id}-tile)"></rect>
        ${notionLogo(235, 143, 30)}
        <ellipse cx="160" cy="184" rx="40" ry="13" fill="url(#${id}-blob)" filter="url(#${id}-blur)"></ellipse>
        <rect
          x="128"
          y="120"
          width="64"
          height="64"
          rx="14"
          class="ui-obr-tile"
          fill="#FFFFFF"
          stroke="#E4E7EC"
          stroke-width="0.5"
          filter="url(#${id}-tile)"></rect>
        <path
          d="M128 170 A 14 14 0 0 0 142 184 L178 184 A 14 14 0 0 0 192 170"
          fill="none"
          stroke="url(#${id}-edge)"
          stroke-width="0.5"></path>
        ${slackLogo(146, 138, 28)}
        <g class="ui-obr-pulses" stroke="url(#${id}-pulse)">
          ${pulses.map((p) =>
            LAYERS.map(
              ([length, opacity]) =>
                svg`<path
                  class=${p.phase === "line" ? "ui-obr-flow" : "ui-obr-wrap"}
                  pathLength="100"
                  d=${p.d}
                  stroke-opacity=${opacity}
                  style=${styleMap({
                    strokeDasharray: `${length} 200`,
                    // Centered on the longest layer, from just before the start to just past the end
                    "--from": `${length / 2 + LONGEST / 2}`,
                    "--to": `${length / 2 - 100 - LONGEST / 2}`,
                    animationDelay: `${p.branch * 0.6}s`,
                  })}
                ></path>`,
            ),
          )}
        </g>
`}</svg>`;
  }
}

/** A described image when there's a label, otherwise decoration that assistive tech skips */
function toggleImage(host: HTMLElement, label: string) {
  if (label) {
    host.setAttribute("role", "img");
    host.setAttribute("aria-label", label);
    host.removeAttribute("aria-hidden");
  } else {
    if (host.getAttribute("role") === "img") host.removeAttribute("role");
    host.removeAttribute("aria-label");
    host.setAttribute("aria-hidden", "true");
  }
}

if (!customElements.get("tc-outreach-branches")) customElements.define("tc-outreach-branches", TcOutreachBranches);

declare global {
  interface HTMLElementTagNameMap {
    "tc-outreach-branches": TcOutreachBranches;
  }
}
