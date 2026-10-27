import { html, nothing, svg } from "lit";
import { property, state } from "lit/decorators.js";
import { keyed } from "lit/directives/keyed.js";
import { TcElement } from "./internal/base";

/*
 * <tc-integration-beam> – the Lit port of illustrations/integration-beam.tsx: your product in the middle, three tools on
 * each side, joined by curved beams. In sync cycles, soft light pulses travel from the tools on the left into the
 * product and on out to the tools on the right; every arrival makes the target glow. Hover a tool to bring its beam
 * forward, click it to pause it. The beams are measured from the real tile positions, so the scene reflows with its
 * container – on narrow widths the tools stack above and below and the curves morph into place.
 *
 *   <tc-integration-beam .left=${[{ name: "Slack", logo: slackSvg }]} .center=${{ name: "Acme" }}></tc-integration-beam>
 *
 * The host is a group named by `label`, or by the product and the tools it connects; each tool is a toggle button and
 * a polite live region says what a click did. The pulses run a few sync cycles each time the scene comes into view and
 * then rest (WCAG 2.2.2); they run only while the scene is on screen and the tab visible, and prefers-reduced-motion
 * keeps them off.
 */

export type IntegrationBeamTool = {
  /** Shown in the tooltip and read to screen readers, e.g. "Slack" */
  name: string;
  /** Logo element (cloned), drawn into a 28 × 28 box (an <svg> fills the box) */
  logo?: Element;
};

export type IntegrationBeamCenter = {
  /** Your product's name, used in the accessible description */
  name: string;
  /** Your mark (cloned), drawn into a 36 × 36 box on the dark tile – a neutral flower when left out */
  logo?: Element;
};

/* Choreography, in ms */
const TRAVEL = 1500; // one pulse, end to end
const STAGGER = 280; // between the pulses of one wave
const REST = 1500; // quiet time between two sync cycles
const CYCLES = 4; // sync cycles per showing, then the beams rest
const MORPH = 460; // tiles and curves gliding to a new layout
const FLASH = 1400; // tooltip shown after a tap
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/** Easing of the morph – the same curve as EASE (it's easeOutQuint), so curves and tiles move together */
const easeOut = (t: number) => 1 - (1 - t) ** 5;
/** Pulses glide in and out softly instead of shooting off */
const easeInOut = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
/** Whether the user asked for reduced motion */
const reducedMotion = () => !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

type Point = { x: number; y: number };
/** A cubic curve as 8 numbers: start, two control points, end – one shape, so any two can be blended */
type Curve = number[];

let uid = 0;

/* ---------- Default tools: the brands' own marks (svgl.app, Simple Icons – CC0) ---------- */

const DEFAULT_CENTER: IntegrationBeamCenter = { name: "Acme" };
const DEFAULT_MARKS = [
  { name: "Slack", markup: "<svg x=\"2\" y=\"2\" width=\"20\" height=\"20\" viewBox=\"0 0 2447.6 2452.5\"><g clip-rule=\"evenodd\" fill-rule=\"evenodd\"><path d=\"m897.4 0c-135.3.1-244.8 109.9-244.7 245.2-.1 135.3 109.5 245.1 244.8 245.2h244.8v-245.1c.1-135.3-109.5-245.1-244.9-245.3.1 0 .1 0 0 0m0 654h-652.6c-135.3.1-244.9 109.9-244.8 245.2-.2 135.3 109.4 245.1 244.7 245.3h652.7c135.3-.1 244.9-109.9 244.8-245.2.1-135.4-109.5-245.2-244.8-245.3z\" fill=\"#36c5f0\"></path><path d=\"m2447.6 899.2c.1-135.3-109.5-245.1-244.8-245.2-135.3.1-244.9 109.9-244.8 245.2v245.3h244.8c135.3-.1 244.9-109.9 244.8-245.3zm-652.7 0v-654c.1-135.2-109.4-245-244.7-245.2-135.3.1-244.9 109.9-244.8 245.2v654c-.2 135.3 109.4 245.1 244.7 245.3 135.3-.1 244.9-109.9 244.8-245.3z\" fill=\"#2eb67d\"></path><path d=\"m1550.1 2452.5c135.3-.1 244.9-109.9 244.8-245.2.1-135.3-109.5-245.1-244.8-245.2h-244.8v245.2c-.1 135.2 109.5 245 244.8 245.2zm0-654.1h652.7c135.3-.1 244.9-109.9 244.8-245.2.2-135.3-109.4-245.1-244.7-245.3h-652.7c-135.3.1-244.9 109.9-244.8 245.2-.1 135.4 109.4 245.2 244.7 245.3z\" fill=\"#ecb22e\"></path><path d=\"m0 1553.2c-.1 135.3 109.5 245.1 244.8 245.2 135.3-.1 244.9-109.9 244.8-245.2v-245.2h-244.8c-135.3.1-244.9 109.9-244.8 245.2zm652.7 0v654c-.2 135.3 109.4 245.1 244.7 245.3 135.3-.1 244.9-109.9 244.8-245.2v-653.9c.2-135.3-109.4-245.1-244.7-245.3-135.4 0-244.9 109.8-244.8 245.1 0 0 0 .1 0 0\" fill=\"#e01e5a\"></path></g></svg>" },
  { name: "Notion", markup: "<path fill=\"currentColor\" d=\"M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z\"></path>" },
  { name: "Gmail", markup: "<svg x=\"2\" y=\"2\" width=\"20\" height=\"20\" viewBox=\"0 49.4 512 399.42\"><g fill=\"none\" fill-rule=\"evenodd\"><g fill-rule=\"nonzero\"><path fill=\"#4285f4\" d=\"M34.91 448.818h81.454V251L0 163.727V413.91c0 19.287 15.622 34.91 34.91 34.91z\"></path><path fill=\"#34a853\" d=\"M395.636 448.818h81.455c19.287 0 34.909-15.622 34.909-34.909V163.727L395.636 251z\"></path><path fill=\"#fbbc04\" d=\"M395.636 99.727V251L512 163.727v-46.545c0-43.142-49.25-67.782-83.782-41.891z\"></path></g><path fill=\"#ea4335\" d=\"M116.364 251V99.727L256 204.455 395.636 99.727V251L256 355.727z\"></path><path fill=\"#c5221f\" fill-rule=\"nonzero\" d=\"M0 117.182v46.545L116.364 251V99.727L83.782 75.291C49.25 49.4 0 74.04 0 117.18z\"></path></g></svg>" },
  { name: "HubSpot", markup: "<path fill=\"#FF7A59\" d=\"M18.164 7.93V5.084a2.198 2.198 0 001.267-1.978v-.067A2.2 2.2 0 0017.238.845h-.067a2.2 2.2 0 00-2.193 2.193v.067a2.196 2.196 0 001.252 1.973l.013.006v2.852a6.22 6.22 0 00-2.969 1.31l.012-.01-7.828-6.095A2.497 2.497 0 104.3 4.656l-.012.006 7.697 5.991a6.176 6.176 0 00-1.038 3.446c0 1.343.425 2.588 1.147 3.607l-.013-.02-2.342 2.343a1.968 1.968 0 00-.58-.095h-.002a2.033 2.033 0 102.033 2.033 1.978 1.978 0 00-.1-.595l.005.014 2.317-2.317a6.247 6.247 0 104.782-11.134l-.036-.005zm-.964 9.378a3.206 3.206 0 113.215-3.207v.002a3.206 3.206 0 01-3.207 3.207z\"></path>" },
  { name: "Linear", markup: "<path fill=\"#5E6AD2\" d=\"M2.886 4.18A11.982 11.982 0 0 1 11.99 0C18.624 0 24 5.376 24 12.009c0 3.64-1.62 6.903-4.18 9.105L2.887 4.18ZM1.817 5.626l16.556 16.556c-.524.33-1.075.62-1.65.866L.951 7.277c.247-.575.537-1.126.866-1.65ZM.322 9.163l14.515 14.515c-.71.172-1.443.282-2.195.322L0 11.358a12 12 0 0 1 .322-2.195Zm-.17 4.862 9.823 9.824a12.02 12.02 0 0 1-9.824-9.824Z\"></path>" },
  { name: "Google Drive", markup: "<svg x=\"1\" y=\"2\" width=\"22\" height=\"20\" viewBox=\"0 0 87.3 78\"> <path d=\"m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z\" fill=\"#0066da\"></path> <path d=\"m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z\" fill=\"#00ac47\"></path> <path d=\"m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z\" fill=\"#ea4335\"></path> <path d=\"m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z\" fill=\"#00832d\"></path> <path d=\"m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z\" fill=\"#2684fc\"></path> <path d=\"m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z\" fill=\"#ffba00\"></path> </svg>" },
];
let defaults: { left: IntegrationBeamTool[]; right: IntegrationBeamTool[] } | undefined;
/** The default tools, their logos parsed once on first use */
function defaultTools() {
  if (!defaults) {
    const tools = DEFAULT_MARKS.map(({ name, markup }) => {
      const t = document.createElement("template");
      t.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${markup}</svg>`;
      return { name, logo: t.content.firstElementChild! };
    });
    defaults = { left: tools.slice(0, 3), right: tools.slice(3) };
  }
  return defaults;
}

/* A neutral four-petal flower, with fainter diagonal petals */
const petal = "M24 24C17.6 19.6 16.4 9.4 24 3.5C31.6 9.4 30.4 19.6 24 24Z";
const productMark = () =>
  html`<svg viewBox="0 0 48 48" aria-hidden="true">${svg`<g opacity="0.36">${[45, 135, 225, 315].map((r) => svg`<path d=${petal} transform=${`rotate(${r} 24 24)`}></path>`)}</g>${[0, 90, 180, 270].map((r) => svg`<path d=${petal} transform=${`rotate(${r} 24 24)`}></path>`)}`}</svg>`;

/* ---------- Styles ---------- */

const css = /* css */ `
/* Theme: every colour is light-dark(), which follows color-scheme – so dark works through .dark,
   data-theme / data-tc-theme and the OS setting alike */
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

[data-ui="ib"] {
  --tc-integration-beam-faint: light-dark(#b5b5b5, #5c5c63);
  --tc-integration-beam-line: light-dark(#e2e2e2, #2e2e33);
  --tc-integration-beam-shadow: 0 0 0 1px light-dark(rgba(0, 0, 0, 0.07), #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.3)), 0 8px 18px -10px light-dark(rgba(0, 0, 0, 0.18), rgba(0, 0, 0, 0.6));
  --tc-integration-beam-line-hi: light-dark(#a9c0ff, #4b5f9e);
  --tc-integration-beam-accent: light-dark(#2f6bff, #6d8bff);
  /* Pulse: clear tail, accent body, a pale tip that reads as light */
  --tc-integration-beam-pulse: light-dark(#2f6bff, #6d8bff);
  --tc-integration-beam-tip-color: light-dark(#b9cdff, #ffffff);
  --tc-integration-beam-ring: light-dark(rgba(47, 107, 255, 0.2), rgba(109, 139, 255, 0.24));
  --tc-integration-beam-glow: light-dark(rgba(47, 107, 255, 0.26), rgba(109, 139, 255, 0.3));
  --tc-integration-beam-hub: light-dark(#171717, #26262a);
  --tc-integration-beam-hub-mark: #ffffff;
  --tc-integration-beam-hub-edge: light-dark(rgba(0, 0, 0, 0.9), rgba(255, 255, 255, 0.12));
  --tc-integration-beam-ease: ${EASE};
  /* One breath of the status dot while a cycle syncs */
  --tc-integration-beam-breathe: 1.1s;
  position: relative;
  width: 100%;
  container-type: inline-size;
  font-family: var(--tc-font-sans, "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: var(--tc-font-size-md, 13px);
  color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc));
  -webkit-tap-highlight-color: transparent;
}
[data-ui="ib"] *, [data-ui="ib"] *::before, [data-ui="ib"] *::after { box-sizing: border-box; }

/* ---------- Beams ---------- */

/* Absolute, so it paints below the (positioned) tiles */
.ui-ib__beams {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}
.ui-ib__line {
  fill: none;
  stroke: var(--tc-integration-beam-line);
  stroke-width: 1.5;
  stroke-linecap: round;
  transition: stroke var(--tc-duration-slow, 320ms) var(--tc-integration-beam-ease), opacity var(--tc-duration-slow, 320ms) var(--tc-integration-beam-ease);
}
.ui-ib__line[data-off] { stroke: var(--tc-integration-beam-faint); stroke-dasharray: 2 5; opacity: 0.75; }
[data-ui="ib"][data-focus] .ui-ib__line:not([data-focus]) { opacity: 0.35; }
.ui-ib__line[data-focus]:not([data-off]) { stroke: var(--tc-integration-beam-line-hi); }

.ui-ib__pulse { opacity: 0; transition: opacity var(--tc-duration-moderate, 260ms) var(--tc-ease-standard, ease); }
.ui-ib__pulse path { fill: none; stroke-linecap: round; transition: opacity var(--tc-duration-slow, 320ms) var(--tc-integration-beam-ease); }
.ui-ib__core { stroke-width: 2; }
.ui-ib__glow { stroke-width: 6; opacity: 0.45; }
[data-ui="ib"][data-focus] .ui-ib__pulse:not([data-focus]) path { opacity: 0.25; }
.ui-ib__pulse[data-focus] .ui-ib__glow { opacity: 0.7; }
.ui-ib__stop-tail { stop-color: var(--tc-integration-beam-pulse); stop-opacity: 0; }
.ui-ib__stop-mid { stop-color: var(--tc-integration-beam-pulse); stop-opacity: 0.9; }
.ui-ib__stop-head { stop-color: var(--tc-integration-beam-tip-color); stop-opacity: 1; }

/* ---------- Layout: side by side, stacked on narrow widths ---------- */

.ui-ib__scene {
  --tc-integration-beam-stack: 0;
  display: grid;
  grid-template-columns: auto minmax(40px, 1fr) auto minmax(40px, 1fr) auto;
  grid-template-areas: "in . hub . out";
  align-items: center;
  padding: var(--tc-space-1-5, 6px) 0;
}
.ui-ib__group { display: flex; flex-direction: column; gap: 26px; }
.ui-ib__group--in { grid-area: in; }
.ui-ib__group--out { grid-area: out; }

/* ---------- Tools ---------- */

.ui-ib__tool {
  position: relative;
  display: grid;
  place-items: center;
  width: 60px;
  height: 60px;
  padding: 0;
  border: 0;
  border-radius: 18px;
  background: var(--tc-surface-raised, light-dark(#ffffff, #19191b));
  box-shadow: var(--tc-integration-beam-shadow);
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
  font: inherit;
  cursor: pointer;
  transition: background-color var(--tc-duration-slow, 320ms) var(--tc-integration-beam-ease), box-shadow var(--tc-duration-slow, 320ms) var(--tc-integration-beam-ease);
}
.ui-ib__tool:focus-visible { outline: var(--tc-focus-outline, 2px solid light-dark(#2f68ff, #6b95ff)); outline-offset: 3px; }
.ui-ib__logo {
  display: grid;
  width: 28px;
  height: 28px;
  transition: transform var(--tc-duration-slow, 320ms) var(--tc-integration-beam-ease), filter var(--tc-duration-slow, 320ms) var(--tc-integration-beam-ease), opacity var(--tc-duration-slow, 320ms) var(--tc-integration-beam-ease);
}
.ui-ib__logo > svg { width: 100%; height: 100%; }
@media (hover: hover) {
  .ui-ib__tool:hover .ui-ib__logo { transform: scale(1.08); }
}
.ui-ib__tool[data-off] { background: var(--tc-surface-sunken, light-dark(#f0f0f0, #111113)); }
.ui-ib__tool[data-off] .ui-ib__logo { filter: grayscale(1); opacity: 0.4; }

/* Arrival glow – played with the Web Animations API */
.ui-ib__ring {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: 0 0 0 3px var(--tc-integration-beam-ring), 0 0 22px 2px var(--tc-integration-beam-glow);
  opacity: 0;
  pointer-events: none;
}

/* Tooltip: points toward the centre, so it never leaves the scene */
.ui-ib__tip {
  --tc-integration-beam-tip-from: translate(-4px, -50%);
  position: absolute;
  z-index: 3;
  top: 50%;
  left: calc(100% + 10px);
  padding: var(--tc-space-1, 4px) var(--tc-space-2, 8px);
  border-radius: var(--tc-radius-md, 8px);
  background: var(--tc-surface-inverse, light-dark(#171717, #ededed));
  color: var(--tc-text-on-inverse, light-dark(#ffffff, #111113));
  font-size: var(--tc-font-size-sm, 12px);
  font-weight: var(--tc-font-weight-medium, 500);
  line-height: var(--tc-line-height-tight, 16px);
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transform: var(--tc-integration-beam-tip-from);
  transition: opacity var(--tc-duration-base, 200ms) var(--tc-ease-standard, ease), transform var(--tc-duration-moderate, 260ms) var(--tc-integration-beam-ease);
}
.ui-ib__group--out .ui-ib__tip { --tc-integration-beam-tip-from: translate(4px, -50%); left: auto; right: calc(100% + 10px); }
.ui-ib__tip-state { opacity: 0.6; font-weight: var(--tc-font-weight-regular, 400); }
.ui-ib__tool[data-tip] .ui-ib__tip { opacity: 1; transform: translate(0, -50%); }

/* ---------- Centre ---------- */

.ui-ib__center {
  grid-area: hub;
  position: relative;
  display: grid;
  place-items: center;
  width: 80px;
  height: 80px;
  border-radius: 24px;
  background: var(--tc-integration-beam-hub);
  box-shadow: 0 0 0 1px var(--tc-integration-beam-hub-edge), inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 14px 28px -12px rgba(0, 0, 0, 0.38);
  color: var(--tc-integration-beam-hub-mark);
}
.ui-ib__mark { display: grid; width: 36px; height: 36px; fill: currentColor; }
.ui-ib__mark > svg { width: 100%; height: 100%; }
.ui-ib__ring--center { inset: -1px; }

/* Status chip under the hub – absolute, so the hub itself stays centred on the beams */
.ui-ib__chip {
  position: absolute;
  top: calc(100% + 12px);
  left: 50%;
  translate: -50% 0;
  display: block;
  height: 26px;
  overflow: hidden;
  border-radius: var(--tc-radius-full, 999px);
  background: var(--tc-surface-raised, light-dark(#ffffff, #19191b));
  box-shadow: var(--tc-shadow-raised, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
  transition: width var(--tc-duration-slow, 320ms) var(--tc-integration-beam-ease);
}
.ui-ib__chip-inner {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-2, 8px);
  width: max-content;
  height: 26px;
  padding: 0 var(--tc-space-3, 12px) 0 var(--tc-space-2-5, 10px);
  font-size: var(--tc-font-size-sm, 12px);
  font-weight: var(--tc-font-weight-medium, 500);
  color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc));
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.ui-ib__status { display: inline-block; animation: ui-ib-in var(--tc-duration-slow, 320ms) var(--tc-integration-beam-ease) both; }
.ui-ib__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--tc-integration-beam-accent);
  transition: background-color var(--tc-duration-slow, 320ms) var(--tc-ease-standard, ease);
}
.ui-ib__dot[data-idle] { background: var(--tc-integration-beam-faint); }
.ui-ib__center[data-syncing] .ui-ib__dot { animation: ui-ib-breathe var(--tc-integration-beam-breathe) var(--tc-ease-in-out, cubic-bezier(0.65, 0, 0.35, 1)) infinite; }

.ui-ib__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

@keyframes ui-ib-in { from { opacity: 0; transform: translateY(6px); filter: blur(2px); } to { opacity: 1; transform: none; filter: none; } }
@keyframes ui-ib-breathe { 50% { box-shadow: 0 0 0 3px var(--tc-integration-beam-ring); } }

/* Narrow: senders above, receivers below, vertical beams */
@container (max-width: 459px) {
  .ui-ib__scene {
    --tc-integration-beam-stack: 1;
    grid-template-columns: 1fr;
    grid-template-areas: "in" "hub" "out";
    justify-items: center;
    row-gap: 78px;
    padding: 0 0 var(--tc-space-1, 4px);
  }
  .ui-ib__group { flex-direction: row; gap: clamp(14px, 7cqw, 34px); }
  .ui-ib__tool { width: 56px; height: 56px; border-radius: var(--tc-radius-2xl, 16px); }
  .ui-ib__center { width: 76px; height: 76px; border-radius: 23px; }
  /* Tooltips sit between the rows; the outer tools align theirs to their edge */
  .ui-ib__tip,
  .ui-ib__group--out .ui-ib__tip {
    --tc-integration-beam-tip-from: translate(-50%, -4px);
    top: calc(100% + 8px);
    right: auto;
    left: 50%;
  }
  .ui-ib__group--out .ui-ib__tip { --tc-integration-beam-tip-from: translate(-50%, 4px); top: auto; bottom: calc(100% + 8px); }
  .ui-ib__tool[data-tip] .ui-ib__tip { transform: translate(-50%, 0); }
  .ui-ib__tool:first-child .ui-ib__tip { left: 0; translate: 50% 0; }
  .ui-ib__tool:last-child .ui-ib__tip { left: 100%; translate: -50% 0; }
}

/* Touch: the tiles are already 56px+; tooltips are shown after a tap instead of on hover */
@media (hover: none) and (pointer: coarse) {
  .ui-ib__tool { min-width: 44px; min-height: 44px; }
}

@media (prefers-reduced-motion: reduce) {
  .ui-ib__line, .ui-ib__tool, .ui-ib__logo, .ui-ib__tip, .ui-ib__chip, .ui-ib__dot { transition: none; }
  .ui-ib__status, .ui-ib__center[data-syncing] .ui-ib__dot { animation: none; }
}
`;

/**
 * Your product joined to the tools it connects by beams that pulse in sync cycles. Each tool toggles on click.
 * @tag tc-integration-beam
 */
export class TcIntegrationBeam extends TcElement {
  static override ui = "ib";
  static override looks = false;
  static override css = css;

  /** Tools that send data in (left, or above on narrow widths) – three look best; unset shows a default set */
  @property({ attribute: false }) accessor left: IntegrationBeamTool[] | undefined = undefined;
  /** Tools that receive data (right, or below on narrow widths) – three look best; unset shows a default set */
  @property({ attribute: false }) accessor right: IntegrationBeamTool[] | undefined = undefined;
  /** The product in the middle */
  @property({ attribute: false }) accessor center: IntegrationBeamCenter = DEFAULT_CENTER;
  /** Accessible description of the scene – defaults to the product and the tools it connects */
  @property() accessor label: string | undefined = undefined;

  /** @internal Paused tools, by index (left first, then right) */
  @state() accessor off: ReadonlySet<number> = new Set();
  /** @internal The tool whose beam is brought forward */
  @state() accessor focusTool: number | null = null;
  /** @internal The tool whose tooltip shows after a tap */
  @state() accessor flash: number | null = null;
  /** @internal A sync cycle is running */
  @state() accessor syncing = false;
  /** @internal What the live region says */
  @state() accessor announce = "";

  /** @internal */
  private readonly uid = `ui-ib${++uid}`;
  /** @internal */
  private flashTimer = 0;
  /** @internal Stops the beams' observers and loop */
  private stopBeams?: () => void;
  /** @internal The tool and centre counts the running beams were started for */
  private beamsFor = "";
  /** @internal Logo clones, kept while the same element is passed */
  private clones = new Map<string, { from: Element; node: Node }>();

  private get tools() {
    const d = this.left && this.right ? undefined : defaultTools();
    return { left: this.left ?? d!.left, right: this.right ?? d!.right };
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "group");
    if (this.hasUpdated && !this.stopBeams) this.startBeams();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.clearTimeout(this.flashTimer);
    this.stopBeams?.();
    this.stopBeams = undefined;
    this.beamsFor = "";
  }

  /** @internal */
  private get status() {
    const { left, right } = this.tools;
    const connected = left.length + right.length - this.off.size;
    return connected === 0 ? "All paused" : this.syncing ? "Syncing…" : `${connected} connected`;
  }

  protected override updated() {
    const { left, right } = this.tools;
    const all = [...left, ...right];
    this.setAttribute("aria-label", this.label ?? `${this.center.name} connected to ${all.map((t) => t.name).join(", ")}`);
    this.toggleAttribute("data-focus", this.focusTool !== null);
    // The status chip glides to the width of its new text
    const chip = this.querySelector<HTMLElement>(".ui-ib__chip");
    const inner = this.querySelector<HTMLElement>(".ui-ib__chip-inner");
    if (chip && inner) chip.style.width = `${inner.offsetWidth}px`;
    if (this.beamsFor !== `${all.length}:${left.length}`) this.startBeams();
  }

  /** @internal Pauses or reconnects a tool and says so */
  private toggle(i: number) {
    const { left, right } = this.tools;
    const all = [...left, ...right];
    const pausing = !this.off.has(i);
    const next = new Set(this.off);
    if (pausing) next.add(i);
    else next.delete(i);
    this.off = next;
    this.announce = `${all[i].name} ${pausing ? "paused" : "connected"}. ${all.length - next.size} of ${all.length} connected.`;
    // On touch there's no hover: show the tooltip for a moment so the tap says what it did
    this.flash = i;
    window.clearTimeout(this.flashTimer);
    this.flashTimer = window.setTimeout(() => (this.flash = null), FLASH);
  }

  /** @internal A clone of a logo, made again only when the logo changes */
  private clone(key: string, from: Element) {
    const had = this.clones.get(key);
    if (had?.from === from) return had.node;
    const node = from.cloneNode(true);
    this.clones.set(key, { from, node });
    return node;
  }

  /** @internal */
  private tile(t: IntegrationBeamTool, i: number) {
    const off = this.off.has(i);
    return html`<button
      type="button"
      class="ui-ib__tool"
      aria-pressed=${off ? "false" : "true"}
      aria-label=${`${t.name}, ${off ? "paused" : "connected"}`}
      ?data-off=${off}
      ?data-tip=${this.focusTool === i || this.flash === i}
      @click=${() => this.toggle(i)}
      @pointerenter=${(e: PointerEvent) => {
        if (e.pointerType === "mouse") this.focusTool = i;
      }}
      @pointerleave=${() => (this.focusTool = null)}
      @focus=${(e: FocusEvent) => {
        if ((e.currentTarget as HTMLElement).matches(":focus-visible")) this.focusTool = i;
      }}
      @blur=${() => (this.focusTool = null)}
    >
      <span class="ui-ib__ring"></span>
      <span class="ui-ib__logo" aria-hidden="true">${t.logo ? this.clone(`t${i}`, t.logo) : nothing}</span>
      <span class="ui-ib__tip" aria-hidden="true">${t.name}${off ? html`<span class="ui-ib__tip-state"> · Paused</span>` : nothing}</span>
    </button>`;
  }

  protected override render() {
    const { left, right } = this.tools;
    const n = left.length + right.length;
    const nLeft = left.length;
    const connected = n - this.off.size;
    const status = this.status;
    const id = this.uid;
    const beams = Array.from({ length: n }, (_, i) => i);
    return html`<svg class="ui-ib__beams" aria-hidden="true">
        ${svg`<defs>
          <filter id=${`${id}-blur`} filterUnits="userSpaceOnUse" x="-100" y="-100" width="10000" height="10000">
            <feGaussianBlur stdDeviation="3"></feGaussianBlur>
          </filter>
          ${beams.map(
            (i) => svg`<linearGradient id=${`${id}-g${i}`} gradientUnits="userSpaceOnUse">
              <stop offset="0" class="ui-ib__stop-tail"></stop>
              <stop offset="0.6" class="ui-ib__stop-mid"></stop>
              <stop offset="1" class="ui-ib__stop-head"></stop>
            </linearGradient>`,
          )}
        </defs>
        ${beams.map((i) => svg`<path class="ui-ib__line" ?data-off=${this.off.has(i)} ?data-focus=${this.focusTool === i}></path>`)}
        ${beams.map(
          (i) => svg`<g class="ui-ib__pulse" ?data-focus=${this.focusTool === i}>
            <path class="ui-ib__glow" stroke=${`url(#${id}-g${i})`} filter=${`url(#${id}-blur)`}></path>
            <path class="ui-ib__core" stroke=${`url(#${id}-g${i})`}></path>
          </g>`,
        )}`}
      </svg>
      <div class="ui-ib__scene">
        <div class="ui-ib__group ui-ib__group--in">${left.map((t, i) => this.tile(t, i))}</div>
        <div class="ui-ib__center" ?data-syncing=${this.syncing && connected > 0}>
          <span class="ui-ib__ring ui-ib__ring--center"></span>
          <span class="ui-ib__mark" aria-hidden="true">${this.center.logo ? this.clone("center", this.center.logo) : productMark()}</span>
          <span class="ui-ib__chip"
            ><span class="ui-ib__chip-inner"
              ><span class="ui-ib__dot" ?data-idle=${connected === 0}></span>${keyed(status, html`<span class="ui-ib__status">${status}</span>`)}</span
            ></span
          >
        </div>
        <div class="ui-ib__group ui-ib__group--out">${right.map((t, i) => this.tile(t, nLeft + i))}</div>
      </div>
      <span class="ui-ib__sr" aria-live="polite">${this.announce}</span>`;
  }

  /**
   * @internal Measures the tiles and draws a curve from each tool to the centre (morphing when the layout flips), then
   * runs the sync cycles: pulses along the beams, a ring on every arrival. Everything is written to the DOM; the
   * element updates only when the "Syncing…" state flips.
   */
  private startBeams() {
    this.stopBeams?.();
    const { left, right } = this.tools;
    const n = left.length + right.length;
    const nLeft = left.length;
    this.beamsFor = `${n}:${nLeft}`;
    const root = this as HTMLElement;
    const scene = this.querySelector<HTMLElement>(":scope > .ui-ib__scene");
    const svgEl = this.querySelector<SVGSVGElement>(":scope > .ui-ib__beams");
    const hub = scene?.querySelector<HTMLElement>(".ui-ib__center");
    if (!scene || !svgEl || !hub) return;
    // Read on use: the element may re-render these
    const toolEls = () => [...scene.querySelectorAll<HTMLElement>(".ui-ib__tool")];
    const lineEls = () => [...svgEl.querySelectorAll<SVGPathElement>(".ui-ib__line")];
    const pulseEls = () => [...svgEl.querySelectorAll<SVGGElement>(".ui-ib__pulse")];
    const gradEls = () => [...svgEl.querySelectorAll<SVGLinearGradientElement>("linearGradient")];
    const centerRing = () => hub.querySelector<HTMLElement>(".ui-ib__ring--center");
    const reduce = reducedMotion();
    const isOff = (i: number) => this.off.has(i);

    let shown: Curve[] = [];
    let from: Curve[] = [];
    let to: Curve[] = [];
    let morphStart = 0;
    let lastPos: Point[] | null = null;
    let lastStack: boolean | null = null;
    const lengths: number[] = [];

    // Tiles are positioned, the scene and groups are not – so offsets are relative to the root and ignore transforms
    const centerOf = (el: HTMLElement): Point => ({ x: el.offsetLeft + el.offsetWidth / 2, y: el.offsetTop + el.offsetHeight / 2 });

    // Horizontal tangents side by side, vertical ones when stacked: the S-curve leaves and enters each tile straight
    const curve = (a: Point, b: Point, stack: boolean): Curve => {
      if (stack) {
        const my = (a.y + b.y) / 2;
        return [a.x, a.y, a.x, my, b.x, my, b.x, b.y];
      }
      const mx = (a.x + b.x) / 2;
      return [a.x, a.y, mx, a.y, mx, b.y, b.x, b.y];
    };

    const draw = (curves: Curve[]) => {
      shown = curves;
      const lines = lineEls();
      const pulses = pulseEls();
      curves.forEach((c, i) => {
        const d = `M${c[0]} ${c[1]}C${c[2]} ${c[3]} ${c[4]} ${c[5]} ${c[6]} ${c[7]}`;
        const line = lines[i];
        if (!line) return;
        line.setAttribute("d", d);
        pulses[i]?.querySelectorAll("path").forEach((p) => p.setAttribute("d", d));
        lengths[i] = line.getTotalLength();
      });
    };

    const measure = () => {
      svgEl.setAttribute("viewBox", `0 0 ${root.clientWidth} ${root.clientHeight}`);
      const stack = getComputedStyle(scene).getPropertyValue("--tc-integration-beam-stack").trim() === "1";
      const els = [...toolEls().slice(0, n), hub];
      if (els.length < n + 1) return;
      const pos = els.map((el) => centerOf(el));
      const c = pos[n];
      // Left tools send into the centre, the centre sends out to the right – paths run in the pulse's direction
      const target = pos.slice(0, n).map((p, i) => (i < nLeft ? curve(p, c, stack) : curve(c, p, stack)));

      if (lastPos && lastStack !== null && stack !== lastStack && !reduce) {
        // The layout flipped: tiles glide from their old spots (FLIP), the curves blend along with them
        els.forEach((el, i) => {
          const dx = lastPos![i].x - pos[i].x;
          const dy = lastPos![i].y - pos[i].y;
          if (dx || dy) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: MORPH, easing: EASE });
        });
        from = shown.length === n ? shown : target;
        to = target;
        morphStart = performance.now();
        kick();
      } else if (morphStart) {
        // Resizing while a morph runs: keep gliding, just towards the new spots
        to = target;
      } else {
        draw(target);
      }
      lastPos = pos;
      lastStack = stack;
    };

    /* Pulses: one per beam at a time, started from a schedule that's rebuilt every sync cycle */
    const pulseStart: (number | null)[] = Array(n).fill(null);
    let queue: { beam: number; at: number }[] = [];
    let nextCycle = 0;
    let cycles = 0;
    let syncFrom = 0;
    let syncTo = 0;
    let wasSyncing = false;
    let visible = false;
    let raf = 0;

    const hide = (i: number) => {
      pulseStart[i] = null;
      const g = pulseEls()[i];
      if (g) g.style.opacity = "0";
    };

    const ring = (el: HTMLElement | null | undefined) =>
      el?.animate(
        [
          { opacity: 0, transform: "scale(0.96)" },
          { opacity: 1, transform: "scale(1)", offset: 0.3 },
          { opacity: 0, transform: "scale(1.14)" },
        ],
        { duration: 760, easing: "ease-out" },
      );

    const planCycle = (now: number) => {
      if (cycles >= CYCLES) {
        nextCycle = Infinity; // done for this showing
        return;
      }
      const ins = Array.from({ length: nLeft }, (_, i) => i).filter((i) => !isOff(i));
      const outs = Array.from({ length: n - nLeft }, (_, i) => nLeft + i).filter((i) => !isOff(i));
      if (!ins.length && !outs.length) {
        nextCycle = now + REST;
        return;
      }
      cycles++;
      const t0 = now;
      // The outgoing wave leaves as the first incoming pulse lands
      const tOut = ins.length ? t0 + TRAVEL : t0;
      queue = [...ins.map((beam, k) => ({ beam, at: t0 + k * STAGGER })), ...outs.map((beam, k) => ({ beam, at: tOut + k * STAGGER }))];
      const end = Math.max(...queue.map((q) => q.at)) + TRAVEL;
      syncFrom = ins.length ? tOut : t0;
      syncTo = end;
      nextCycle = end + REST;
    };

    const paint = (i: number, t: number) => {
      const line = lineEls()[i];
      const g = pulseEls()[i];
      const grad = gradEls()[i];
      if (!line || !g || !grad) return;
      const L = lengths[i] || 0;
      const seg = Math.min(84, L * 0.42);
      const head = easeInOut(t) * (L + seg);
      // One dash, `seg` long, ending at the head
      g.querySelectorAll("path").forEach((p) => {
        p.style.strokeDasharray = `${seg} ${L + seg}`;
        p.style.strokeDashoffset = `${seg - head}`;
      });
      // The gradient runs from tail (clear) to head (bright) along the dash
      const a = line.getPointAtLength(Math.max(0, Math.min(L, head - seg)));
      const b = line.getPointAtLength(Math.max(0, Math.min(L, head)));
      grad.setAttribute("x1", `${a.x}`);
      grad.setAttribute("y1", `${a.y}`);
      grad.setAttribute("x2", `${b.x + (b.x === a.x && b.y === a.y ? 0.01 : 0)}`);
      grad.setAttribute("y2", `${b.y}`);
      g.style.opacity = "1";
    };

    const setSyncing = (on: boolean) => (this.syncing = on);

    const frame = (now: number) => {
      raf = 0;
      if (morphStart) {
        const t = Math.min(1, (now - morphStart) / MORPH);
        const e = easeOut(t);
        draw(to.map((c, i) => c.map((v, k) => (from[i]?.[k] ?? v) + (v - (from[i]?.[k] ?? v)) * e)));
        if (t >= 1) morphStart = 0;
      }
      if (visible && !reduce) {
        if (now >= nextCycle) planCycle(now);
        queue = queue.filter((q) => {
          if (q.at > now) return true;
          if (!isOff(q.beam) && pulseStart[q.beam] === null) pulseStart[q.beam] = q.at;
          return false;
        });
        const rings = [...scene.querySelectorAll<HTMLElement>(".ui-ib__tool > .ui-ib__ring")];
        for (let i = 0; i < n; i++) {
          const start = pulseStart[i];
          if (start === null) continue;
          // Paused mid-flight: the pulse fades out where it is
          if (isOff(i)) {
            hide(i);
            continue;
          }
          const t = (now - start) / TRAVEL;
          if (t >= 1) {
            hide(i);
            ring(i < nLeft ? centerRing() : rings[i]);
            continue;
          }
          paint(i, t);
        }
        const isSyncing = now >= syncFrom && now < syncTo;
        if (isSyncing !== wasSyncing) {
          wasSyncing = isSyncing;
          setSyncing(isSyncing);
        }
      }
      // While pulses are planned or in flight (or a morph runs); once the cycles are done the loop stops
      const busy = nextCycle !== Infinity || queue.length > 0 || pulseStart.some((t) => t !== null);
      if (morphStart || (visible && !reduce && busy)) raf = requestAnimationFrame(frame);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);

    // Runs only while the scene is on screen and the tab visible
    let inView = false;
    const update = () => {
      const next = inView && document.visibilityState !== "hidden";
      if (next === visible) return;
      visible = next;
      if (visible) {
        nextCycle = performance.now() + 400;
        cycles = 0;
        kick();
      } else {
        queue = [];
        for (let i = 0; i < n; i++) hide(i);
        syncTo = 0;
        if (wasSyncing) setSyncing((wasSyncing = false));
      }
    };
    const io =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver((entries) => {
            inView = entries[entries.length - 1].isIntersecting;
            update();
          });
    io?.observe(root);
    document.addEventListener("visibilitychange", update);

    this.stopBeams = () => {
      ro.disconnect();
      io?.disconnect();
      document.removeEventListener("visibilitychange", update);
      cancelAnimationFrame(raf);
    };
  }
}

if (!customElements.get("tc-integration-beam")) customElements.define("tc-integration-beam", TcIntegrationBeam);

declare global {
  interface HTMLElementTagNameMap {
    "tc-integration-beam": TcIntegrationBeam;
  }
}
