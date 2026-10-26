import { html, svg, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";

/*
 * <tc-side-folder> – the Lit port of illustrations/side-folder.tsx: a glassy folder turned on its side. Three
 * documents peek out to the right from behind a frosted front pocket with a tab on its edge. Hover the folder: the
 * pocket swings forward and every document slides out on its own.
 *
 *   <tc-side-folder label="Shared documents"></tc-side-folder>
 *
 * The artwork scales with its container and keeps a 3 : 2 frame. On a dark page the paper dims a little
 * (light-dark(), follows the page theme). Decorative by default (aria-hidden on the host); with `label` the host is
 * an image named by it.
 */

/* Front pocket on a 380 × 520 grid: a narrow top part and a wider tab towards the bottom */
const FRONT =
  "M40 0H290Q330 0 330 40V318Q330 338 344 348L364 362Q380 372 380 396V480Q380 520 340 520H40Q0 520 0 480V40Q0 0 40 0Z";
const LINES = [78, 180, 140, 175, 126, 168, 110];
/* A mask (unlike clip-path: url()) also cuts the frosted blur to the pocket shape, and scales with the box */
const MASK = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 380 520' preserveAspectRatio='none'><path d='${FRONT}'/></svg>`,
)}") 0 0 / 100% 100% no-repeat`;

/** Each folder's SVG ids are its own */
let uid = 0;

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

/**
 * A glassy folder on its side with documents that slide out on hover.
 * @tag tc-side-folder
 */
export class TcSideFolder extends TcElement {
  static override ui = "sfo";
  static override looks = false;

  /** Describes the scene to assistive tech (role="img"); without it the illustration is decorative and hidden */
  @property() accessor label = "";

  private readonly uid = `ui-sfo${++uid}`;

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (changed.has("label")) toggleImage(this, this.label);
  }

  protected override render() {
    const id = this.uid;
    return html`<div class="ui-sfo-icon" aria-hidden="true">
      <svg class="ui-sfo-layer ui-sfo-back" viewBox="0 0 440 520">
        ${svg`<defs>
          <filter id=${`${id}-hl`} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur"></feGaussianBlur>
            <feOffset in="blur" dy="3" result="offset"></feOffset>
            <feComposite in="blur" in2="offset" operator="arithmetic" k2="1" k3="-1" result="diff"></feComposite>
            <feFlood flood-color="#fff" flood-opacity="0.65"></feFlood>
            <feComposite in2="diff" operator="in" result="light"></feComposite>
            <feComposite in="light" in2="SourceAlpha" operator="in"></feComposite>
          </filter>
        </defs>
        <rect x="0" y="18" width="440" height="486" rx="36" fill="#5bb7ea"></rect>
        <rect x="0" y="18" width="440" height="486" rx="36" fill="#000" filter=${`url(#${id}-hl)`}></rect>`}
      </svg>
      <svg class="ui-sfo-layer" viewBox="0 0 440 520">
        ${svg`<defs>
          <linearGradient id=${`${id}-paper`} x1="0" y1="0" x2="0" y2="1">
            <stop class="ui-sfo-paper-top" offset="0%"></stop>
            <stop class="ui-sfo-paper-end" offset="100%"></stop>
          </linearGradient>
          <symbol id=${`${id}-doc`} overflow="visible">
            <rect x="0.6" y="0.6" width="278.8" height="348.8" rx="19.4" fill=${`url(#${id}-paper)`} stroke="rgba(0,0,0,0.12)" stroke-width="1.2"></rect>
            ${LINES.map((w, i) => svg`<rect x="30" y=${87 + i * 28} width=${w} height="9" rx="4.5" fill="rgba(0,0,0,0.12)"></rect>`)}
          </symbol>
        </defs>
        <g transform="scale(1.15)">
          <use class="ui-sfo-doc ui-sfo-doc--top" href=${`#${id}-doc`}></use>
          <use class="ui-sfo-doc ui-sfo-doc--bottom" href=${`#${id}-doc`}></use>
          <use class="ui-sfo-doc ui-sfo-doc--middle" href=${`#${id}-doc`}></use>
        </g>`}
      </svg>
      <div class="ui-sfo-front">
        <svg viewBox="0 0 380 520">${svg`<path d=${FRONT} fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="4"></path>`}</svg>
      </div>
    </div>`;
  }

  static override css = /* css */ `
/* Theme: the --tc- fallbacks use light-dark(), which follows color-scheme */
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

[data-ui="sfo"] {
  --tc-side-folder-paper: light-dark(#ffffff, #dfe5ea);
  --tc-side-folder-paper-end: light-dark(#eaf2f8, #c3cfd9);
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  container-type: inline-size;
}

/* The folder is drawn on a 440 × 520 grid; cqw keeps every detail in proportion */
.ui-sfo-icon {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 37%;
  aspect-ratio: 440 / 520;
  container-type: inline-size;
  perspective: 260cqw;
  perspective-origin: 40% 50%;
  transform: translate(-50%, -50%);
  transition: transform var(--tc-duration-slowest, 560ms) var(--tc-ease-emphasized, cubic-bezier(0.32, 0.72, 0.24, 1));
}
.ui-sfo-icon:hover { transform: translate(-50%, -50%) scale(1.03); }

.ui-sfo-paper-top { stop-color: var(--tc-side-folder-paper); }
.ui-sfo-paper-end { stop-color: var(--tc-side-folder-paper-end); }
.ui-sfo-layer { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.ui-sfo-back {
  filter:
    drop-shadow(0 5.4cqw 6.4cqw rgba(60, 130, 180, 0.28))
    drop-shadow(0 1.8cqw 2.7cqw rgba(60, 130, 180, 0.16))
    drop-shadow(0 0.45cqw 0.9cqw rgba(60, 130, 180, 0.1));
}

/* Documents, in the 1.15 scaled space of the stack */
.ui-sfo-doc {
  transform-box: fill-box;
  transform-origin: center;
  filter: drop-shadow(0 3px 4px rgba(0, 30, 60, 0.18));
  transition: transform var(--tc-duration-slowest, 560ms) var(--tc-ease-emphasized, cubic-bezier(0.32, 0.72, 0.24, 1));
}
.ui-sfo-doc--top    { transform: translate(83px, 43px) rotate(3deg); }
.ui-sfo-doc--bottom { transform: translate(78px, 68px) rotate(4deg); }
.ui-sfo-doc--middle { transform: translate(73px, 56px) rotate(-2deg); }
.ui-sfo-icon:hover .ui-sfo-doc--top    { transform: translate(100px, 35px) rotate(6deg); }
.ui-sfo-icon:hover .ui-sfo-doc--bottom { transform: translate(93px, 75px) rotate(7deg); }
.ui-sfo-icon:hover .ui-sfo-doc--middle { transform: translate(95px, 54px) rotate(0deg); }

/* Pocket: hinged on its left edge, it swings its right edge towards you on hover */
.ui-sfo-front {
  position: absolute;
  left: 0;
  top: 0;
  width: 86.3636%;
  height: 100%;
  -webkit-mask: ${MASK};
  mask: ${MASK};
  background:
    linear-gradient(180deg, rgba(0, 40, 75, 0) 76%, rgba(0, 40, 75, 0.26) 100%),
    linear-gradient(160deg, rgba(132, 214, 248, 0.45) 0%, rgba(69, 170, 220, 0.45) 100%);
  -webkit-backdrop-filter: blur(4.5cqw) saturate(1.1);
  backdrop-filter: blur(4.5cqw) saturate(1.1);
  transform-origin: 0 50%;
  transition: transform var(--tc-duration-slowest, 560ms) var(--tc-ease-emphasized, cubic-bezier(0.32, 0.72, 0.24, 1));
}
.ui-sfo-front svg { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.ui-sfo-icon:hover .ui-sfo-front { transform: translateZ(3cqw) rotateY(-12deg); }

@media (prefers-reduced-motion: reduce) {
  .ui-sfo-icon, .ui-sfo-doc, .ui-sfo-front { transition: none; }
}
`;
}

if (!customElements.get("tc-side-folder")) customElements.define("tc-side-folder", TcSideFolder);

declare global {
  interface HTMLElementTagNameMap {
    "tc-side-folder": TcSideFolder;
  }
}
