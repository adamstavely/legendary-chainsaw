import { html, svg, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { OnScreenController } from "./internal/controllers";

/*
 * <tc-enrichment-orbit> – the Lit port of illustrations/enrichment-orbit.tsx: a Grok tile inside two rings; coloured
 * comets run around the rings in opposite directions and three small data nodes orbit the outer ring, staying upright
 * as they travel. The artwork is drawn on a 320 × 240 viewBox inside a 3 : 2 frame.
 *
 *   <tc-enrichment-orbit label="Enriching your leads"></tc-enrichment-orbit>
 *
 * Decorative by default (aria-hidden on the host); with `label` the host is an image named by it. The comets and
 * nodes make a few rounds and then rest, hold still off screen or in a hidden tab (data-paused) and stay still with
 * reduced motion. Colours follow the page theme through light-dark().
 */

/** Start offsets of the three orbiting nodes on the 22 s orbit (120° apart), in seconds */
const ORBIT = 22;
const nodeOffsets = [0, 7.33, 14.66];
const ICON = "M278 88C278 115.614 300.386 138 328 138H366C393.614 138 416 160.386 416 188V228C416 255.614 393.614 278 366 278H328C300.386 278 278 300.386 278 328V366C278 393.614 255.614 416 228 416H188C160.386 416 138 393.614 138 366V328C138 300.386 115.614 278 88 278H50C22.3858 278 0 255.614 0 228V188C0 160.386 22.3858 138 50 138H88C115.614 138 138 115.614 138 88V50C138 22.3858 160.386 0 188 0H228C255.614 0 278 22.3858 278 50V88ZM140 226C140 253.614 162.386 276 190 276H226C253.614 276 276 253.614 276 226V190C276 162.386 253.614 140 226 140H190C162.386 140 140 162.386 140 190V226Z";
const MARKS = ["M12.8734 20.5407L23.9549 12.3506C24.4982 11.9491 25.2747 12.1057 25.5336 12.7294C26.896 16.0185 26.2873 19.9712 23.5766 22.6851C20.866 25.3989 17.0944 25.9941 13.6471 24.6386L9.88123 26.3843C15.2826 30.0806 21.8416 29.1665 25.9403 25.0601C29.1914 21.8051 30.1983 17.3683 29.2568 13.3673L29.2653 13.3758C27.9 7.49809 29.601 5.14871 33.0853 0.344576C33.1677 0.230667 33.2502 0.116757 33.3327 0L28.7476 4.59055V4.57631L12.8706 20.5436", "M10.5867 22.5312C6.70979 18.8234 7.37821 13.0852 10.6862 9.77618C13.1323 7.3271 17.14 6.32755 20.6385 7.79698L24.3959 6.05986C23.719 5.57005 22.8514 5.04322 21.8559 4.67301C17.3562 2.81914 11.969 3.7418 8.31115 7.40114C4.79271 10.9238 3.68626 16.3402 5.58628 20.9621C7.0056 24.4164 4.67893 26.8597 2.3352 29.3259C1.50465 30.2001 0.67126 31.0744 0 31.9999L10.5838 22.534"];

/** Each scene's SVG ids are its own */
let uid = 0;

/** A described image when there's a label, otherwise decoration that assistive tech skips (label="" too) */
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

/** The inner shadow filter shared by the tile and the nodes */
const shadowFilter = (id: string, blur: number, dy: number, up: number, extra: string) => svg`
  <filter id=${id} x=${extra === "" ? "-30%" : "-60%"} y=${extra === "" ? "-30%" : "-60%"} width=${extra === "" ? "160%" : "220%"} height=${extra === "" ? "160%" : "220%"}>
    <feGaussianBlur in="SourceAlpha" stdDeviation=${blur} result="dropBlur"></feGaussianBlur>
    <feOffset in="dropBlur" dx="0" dy=${dy} result="dropOffset"></feOffset>
    <feFlood class=${`ui-eo-drop${extra}`} result="dropColor"></feFlood>
    <feComposite in="dropColor" in2="dropOffset" operator="in" result="dropShadow"></feComposite>
    <feOffset in="SourceAlpha" dx="0" dy=${-up} result="alphaUp"></feOffset>
    <feComposite in="SourceAlpha" in2="alphaUp" operator="out" result="sliver"></feComposite>
    <feFlood class="ui-eo-sliver" result="innerColor"></feFlood>
    <feComposite in="innerColor" in2="sliver" operator="in" result="innerShadow"></feComposite>
    <feMerge>
      <feMergeNode in="dropShadow"></feMergeNode>
      <feMergeNode in="SourceGraphic"></feMergeNode>
      <feMergeNode in="innerShadow"></feMergeNode>
    </feMerge>
  </filter>`;

/**
 * A tile inside two rings with comets and orbiting data nodes.
 * @tag tc-enrichment-orbit
 */
export class TcEnrichmentOrbit extends TcElement {
  static override ui = "eo";
  static override looks = false;

  /** Accessible description – when set, the scene is announced as an image; otherwise it is decorative */
  @property() accessor label = "";

  private readonly uid = `ui-eo${++uid}`;
  private screen = new OnScreenController(this);

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (changed.has("label")) toggleImage(this, this.label);
    this.toggleAttribute("data-paused", !this.screen.onScreen);
  }

  protected override render() {
    const id = this.uid;
    return html`<svg class="ui-eo-art" viewBox="0 0 320 240" aria-hidden="true">
      ${svg`<defs>
        ${shadowFilter(`${id}-tile`, 4, 3, 4, "")}
        ${shadowFilter(`${id}-node`, 2.5, 2, 3, " ui-eo-drop--node")}
        <linearGradient id=${`${id}-comet`}>
          <stop offset="0%" stop-color="#FF6B5C" stop-opacity="0"></stop>
          <stop offset="22%" stop-color="#FFB89E" stop-opacity="0.9"></stop>
          <stop offset="50%" stop-color="#C8A8E5" stop-opacity="0.9"></stop>
          <stop offset="78%" stop-color="#A8B5FF" stop-opacity="0.9"></stop>
          <stop offset="100%" stop-color="#A8B5FF" stop-opacity="0"></stop>
        </linearGradient>
      </defs>
      <g class="ui-eo-rings" fill="none" stroke-width="1.2">
        <circle cx="160" cy="120" r="56" stroke-opacity="0.45"></circle>
        <circle cx="160" cy="120" r="80"></circle>
      </g>
      <g class="ui-eo-spin">
        <path fill="none" stroke=${`url(#${id}-comet)`} stroke-width="1.6" stroke-linecap="round" d="M114.1 54.5 A80 80 0 0 1 205.9 54.5"></path>
      </g>
      <g class="ui-eo-spin ui-eo-reverse">
        <path fill="none" stroke=${`url(#${id}-comet)`} stroke-width="1.6" stroke-linecap="round" d="M120.4 80.4 A56 56 0 0 1 199.6 80.4"></path>
      </g>
      <rect class="ui-eo-tile" x="134" y="94" width="52" height="52" rx="12" stroke-width="0.5" filter=${`url(#${id}-tile)`}></rect>
      <svg x="147" y="107" width="26" height="26" viewBox="0 0 33.4 32" overflow="visible">
        ${MARKS.map((d) => svg`<path class="ui-eo-mark" d=${d}></path>`)}
      </svg>
      ${nodeOffsets.map((offset) => {
        // Each node starts its offset into the orbit and runs one full round, so it comes to rest where it started
        const timing = styleMap({ animationDelay: `${-offset}s`, animationIterationCount: String(1 + offset / ORBIT) });
        return svg`<g class="ui-eo-orbit" style=${timing}>
          <g class="ui-eo-upright" style=${timing}>
            <circle class="ui-eo-tile" cx="160" cy="40" r="17" stroke-width="0.5" filter=${`url(#${id}-node)`}></circle>
            <g transform="translate(154 34) scale(0.0288)" class="ui-eo-icon" fill-opacity="0.55"><path d=${ICON}></path></g>
          </g>
        </g>`;
      })}`}
    </svg>`;
  }

  static override css = /* css */ `
/* Theme: every colour is light-dark(), which follows color-scheme – so dark works through .dark,
   data-theme / data-tc-theme and the OS setting alike */
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

[data-ui="eo"] {
  /* One round of the comets and of the nodes (ORBIT in the component); the comets make three, the nodes one */
  --tc-enrichment-orbit-comet: 7s;
  --tc-enrichment-orbit-node: 22s;
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 2;
  overflow: hidden;
}
.ui-eo-art {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}

/* Colours */
.ui-eo-rings { stroke: light-dark(#e4e7ec, rgba(255, 255, 255, 0.14)); }
.ui-eo-tile { fill: light-dark(#ffffff, #232326); stroke: light-dark(#e4e7ec, rgba(255, 255, 255, 0.08)); }
.ui-eo-drop { flood-color: light-dark(rgba(0, 0, 0, 0.06), rgba(0, 0, 0, 0.4)); }
.ui-eo-drop--node { flood-color: light-dark(rgba(0, 0, 0, 0.07), rgba(0, 0, 0, 0.4)); }
.ui-eo-sliver { flood-color: light-dark(#eaecef, #1a1a1c); }
.ui-eo-icon { fill: light-dark(#6b6f76, #c4c4c4); }
.ui-eo-mark { fill: light-dark(#171717, #ededed); }

/* Comets: one full turn around the center every 7 s, three times */
.ui-eo-spin {
  transform-origin: 160px 120px;
  animation: ui-eo-turn var(--tc-enrichment-orbit-comet) linear 3;
}
.ui-eo-reverse { animation-direction: reverse; }

/* Nodes: one orbit in 22 s, turned back around their own center to stay upright; each ends where it started
   (the component staggers them with a delay and a matching iteration count) */
.ui-eo-orbit {
  transform-origin: 160px 120px;
  animation: ui-eo-turn var(--tc-enrichment-orbit-node) linear 1 both;
}
.ui-eo-upright {
  transform-box: fill-box;
  transform-origin: center;
  animation: ui-eo-turn var(--tc-enrichment-orbit-node) linear 1 reverse both;
}
@keyframes ui-eo-turn {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Reduced motion: everything stays put, the nodes keep their staggered spots on the ring */
/* Off screen or in a hidden tab: the orbits hold still */
[data-ui="eo"][data-paused] :is(.ui-eo-spin, .ui-eo-orbit, .ui-eo-upright) { animation-play-state: paused; }

@media (prefers-reduced-motion: reduce) {
  .ui-eo-spin, .ui-eo-orbit, .ui-eo-upright { animation-play-state: paused; }
}
`;
}

if (!customElements.get("tc-enrichment-orbit")) customElements.define("tc-enrichment-orbit", TcEnrichmentOrbit);

declare global {
  interface HTMLElementTagNameMap {
    "tc-enrichment-orbit": TcEnrichmentOrbit;
  }
}
