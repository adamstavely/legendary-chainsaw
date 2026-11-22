import { html, nothing, svg, type SVGTemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { OnScreenController } from "./internal/controllers";

/*
 * <tc-page-state> – the full-page and empty states, as one illustration with a `status`: a small scene in the soft
 * style of the state illustrations (a tile, one pastel mark with a darker edge and ink, a soft glow beneath) and its
 * words as real text under it, on a 320 × 240 viewBox inside a 3 : 2 frame.
 *   · nothing-found – a magnifying glass passing over blank results; no matches for a search or filter
 *   · offline – a cloud and a device with the dashed link between them broken; "You're offline"
 *   · something-wrong – two connected tiles with the line between them broken; a page or request that failed
 *   · link-expired – two parted chain links with a clock badge; "This link has expired"
 *   · no-access – a folder held shut by a padlock; someone isn't entitled to see what they opened
 *   · limit-reached – a gauge at the end of its range with a clock; "Usage limit reached"
 *   · first-use – an empty workspace with one highlighted spot to start from; "Nothing here yet"
 *   · not-found – a torn page with a question mark; "Page not found"
 *   · maintenance – a wrench on a tile; "Down for maintenance"
 *   · session-expired – a clock with a key; "Session expired"
 *   · access-requested – an envelope with an hourglass; "Access requested"
 *   · coming-soon – a wrapped box; "Coming soon"
 *   · region-unavailable – a globe with a slash through it; "Not available in your region"
 *   · ai-unavailable – the assistant's mark, a chat bubble with a sparkle, with a pause badge; "AI is unavailable"
 * Words follow the status unless `caption` sets its own; nothing-found, something-wrong and no-access fill the frame
 * and have no words of their own, so they're decorative unless given `caption` or `label`.
 *
 *   <tc-page-state status="offline"></tc-page-state>
 *
 * The host is an image named by `label`, or else by its words; with neither it's decorative (aria-hidden). The motion is
 * finite, holds still off screen or in a hidden tab (data-paused) and stays still with reduced motion. Colours follow
 * the page theme through light-dark().
 */

export type PageStateKind =
  | "nothing-found"
  | "offline"
  | "something-wrong"
  | "link-expired"
  | "no-access"
  | "limit-reached"
  | "first-use"
  | "not-found"
  | "maintenance"
  | "session-expired"
  | "access-requested"
  | "coming-soon"
  | "region-unavailable"
  | "ai-unavailable";

/** The words for each status, when `caption` isn't set; "" – the scene fills the frame and has none of its own */
export const pageStateWords: Record<PageStateKind, string> = {
  "nothing-found": "",
  offline: "You're offline",
  "something-wrong": "",
  "link-expired": "This link has expired",
  "no-access": "",
  "limit-reached": "Usage limit reached",
  "first-use": "Nothing here yet",
  "not-found": "Page not found",
  maintenance: "Down for maintenance",
  "session-expired": "Session expired",
  "access-requested": "Access requested",
  "coming-soon": "Coming soon",
  "region-unavailable": "Not available in your region",
  "ai-unavailable": "AI is unavailable",
};

const v = (k: string) => `--tc-page-state-${k}`;
type Pair = [string, string];
/** A status's custom properties, over the defaults on the host */
const tone = (status: PageStateKind, vars: Record<string, Pair | string>) =>
  `[data-ui="pgs"][status="${status}"] {\n${Object.entries(vars)
    .map(([k, val]) => `  ${v(k)}: ${typeof val === "string" ? val : `light-dark(${val[0]}, ${val[1]})`};`)
    .join("\n")}\n}`;

const AMBER = { mark: ["#fbe7cf", "#5a4426"] as Pair, "mark-edge": ["#e9b872", "#c79a57"] as Pair, ink: ["#8a5a17", "#f3d6a6"] as Pair };
const SLATE = { mark: ["#e8ebf0", "#2c3038"] as Pair, "mark-edge": ["#b4bcc8", "#6b7380"] as Pair, ink: ["#4a5361", "#d5dbe4"] as Pair, glow: ["rgba(120, 135, 155, 0.22)", "rgba(120, 135, 155, 0.1)"] as Pair };
const BLUE = { mark: ["#dce8fb", "#263a5c"] as Pair, "mark-edge": ["#8fb0e8", "#6f93d1"] as Pair, ink: ["#2f5ea8", "#cfdffb"] as Pair, glow: ["rgba(120, 160, 230, 0.22)", "rgba(120, 160, 230, 0.1)"] as Pair };
const PURPLE = { mark: ["#ece4fb", "#3b2d5a"] as Pair, "mark-edge": ["#b9a1ea", "#9a83d6"] as Pair, ink: ["#5b3aa6", "#ddd0fb"] as Pair, glow: ["rgba(170, 140, 230, 0.24)", "rgba(170, 140, 230, 0.12)"] as Pair };

/** The classes that move, so they pause off screen and stay still with reduced motion */
const MOVING = [
  "breathe", "glass", "row", "link", "spark", "left", "right", "hand", "lock", "swing", "spot", "settle", "turn", "flip", "bounce", "strike", "dim",
].map((c) => `.ui-pgs-${c}`);

const css = /* css */ `
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

[data-ui="pgs"] {
  ${v("tile")}: light-dark(#ffffff, #2a2a2e);
  ${v("edge")}: light-dark(#e4e7ec, rgba(255, 255, 255, 0.1));
  ${v("bar")}: light-dark(#e6e9ee, #44464d);
  ${v("wire")}: light-dark(#c3cad4, #5c6068);
  ${v("mark")}: light-dark(#e8ebf0, #2c3038);
  ${v("mark-edge")}: light-dark(#b4bcc8, #6b7380);
  ${v("ink")}: light-dark(#4a5361, #d5dbe4);
  ${v("glow")}: light-dark(rgba(120, 135, 155, 0.22), rgba(120, 135, 155, 0.1));
  ${v("soft")}: 12px;
  ${v("beat")}: 3.2s;
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  font-family: var(--tc-font-sans);
}
${tone("nothing-found", { tile: ["#ffffff", "#232326"], edge: ["#e4e7ec", "rgba(255, 255, 255, 0.08)"], bar: ["#eff1f4", "#2f2f33"], mark: ["rgba(168, 181, 255, 0.16)", "rgba(168, 181, 255, 0.12)"], ink: ["#5b6472", "#c9ced6"], beat: "3.6s" })}
${tone("offline", BLUE)}
${tone("something-wrong", { ...AMBER, glow: ["rgba(250, 176, 130, 0.2)", "rgba(250, 176, 130, 0.1)"], beat: "3s" })}
${tone("link-expired", { ...AMBER, glow: ["rgba(250, 176, 130, 0.22)", "rgba(250, 176, 130, 0.1)"], beat: "3s" })}
${tone("no-access", { back: ["#dfe5ee", "#33363d"], front: ["#eef2f7", "#26282d"], edge: ["#d3dae4", "rgba(255, 255, 255, 0.1)"], page: ["#ffffff", "#3c3f46"], line: ["#e3e7ed", "#50545c"], ink: ["#5b6472", "#c9ced6"], key: ["#ffffff", "#26282d"], glow: ["rgba(200, 168, 229, 0.28)", "rgba(200, 168, 229, 0.14)"] })}
${tone("limit-reached", { ...AMBER, glow: ["rgba(250, 176, 130, 0.22)", "rgba(250, 176, 130, 0.1)"], beat: "3s" })}
${tone("first-use", { tile: ["#ffffff", "#232326"], edge: ["#d9dee6", "rgba(255, 255, 255, 0.14)"], wire: ["#c3cad4", "#5c6068"], mark: ["#2563eb", "#8fb0ff"], ink: ["#ffffff", "#1a1c20"], glow: ["rgba(37, 99, 235, 0.18)", "rgba(143, 176, 255, 0.2)"] })}
${tone("not-found", SLATE)}
${tone("maintenance", { ...AMBER, glow: ["rgba(250, 176, 130, 0.22)", "rgba(250, 176, 130, 0.1)"] })}
${tone("session-expired", { ...AMBER, glow: ["rgba(250, 176, 130, 0.22)", "rgba(250, 176, 130, 0.1)"] })}
${tone("access-requested", PURPLE)}
${tone("coming-soon", BLUE)}
${tone("region-unavailable", SLATE)}
${tone("ai-unavailable", PURPLE)}

.ui-pgs-art { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
.ui-pgs-caption { position: absolute; right: 0; bottom: 0; left: 0; margin: 0; color: var(--tc-text-primary); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); text-align: center; }

/* Shared pieces */
.ui-pgs-tile { fill: var(${v("tile")}); stroke: var(${v("edge")}); }
.ui-pgs-bar { fill: var(${v("bar")}); }
.ui-pgs-glow { fill: var(${v("glow")}); filter: blur(var(${v("soft")})); }
.ui-pgs-badge { fill: var(${v("mark")}); stroke: var(${v("mark-edge")}); stroke-width: 4; stroke-linejoin: round; }
.ui-pgs-ink { fill: none; stroke: var(${v("ink")}); stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; }
.ui-pgs-wire { stroke: var(${v("wire")}); }
.ui-pgs-breathe { animation: ui-pgs-breathe var(${v("beat")}) var(--tc-ease-standard) 3; }
@keyframes ui-pgs-breathe { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

/* nothing-found */
.ui-pgs-dot { fill: var(${v("bar")}); }
.ui-pgs-lens { fill: var(${v("mark")}); stroke: var(${v("ink")}); }
.ui-pgs-handle { stroke: var(${v("ink")}); }
.ui-pgs-glass { animation: ui-pgs-look var(${v("beat")}) var(--tc-ease-standard) 3; }
.ui-pgs-row { animation: ui-pgs-fade var(${v("beat")}) var(--tc-ease-standard) 3; }
@keyframes ui-pgs-look { 0%, 100% { transform: translate(0, 0); } 35% { transform: translate(-46px, -26px); } 70% { transform: translate(-16px, 16px); } }
@keyframes ui-pgs-fade { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }

/* offline */
.ui-pgs-cloud { fill: var(${v("mark")}); stroke: var(${v("mark-edge")}); stroke-width: 4; stroke-linejoin: round; }
.ui-pgs-link { fill: none; stroke: var(${v("ink")}); stroke-width: 4; stroke-linecap: round; stroke-dasharray: 5 7; animation: ui-pgs-drift var(${v("beat")}) linear 3; }
.ui-pgs-slash { fill: none; stroke: var(${v("ink")}); stroke-width: 3.5; stroke-linecap: round; }
@keyframes ui-pgs-drift { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -24; } }

/* something-wrong */
.ui-pgs-warn { fill: var(${v("mark")}); stroke: var(${v("mark-edge")}); }
.ui-pgs-warn-ink { stroke: var(${v("ink")}); }
.ui-pgs-spark { animation: ui-pgs-pulse var(${v("beat")}) var(--tc-ease-standard) 3; }
.ui-pgs-left { animation: ui-pgs-left var(${v("beat")}) var(--tc-ease-standard) 3; }
.ui-pgs-right { animation: ui-pgs-right var(${v("beat")}) var(--tc-ease-standard) 3; }
@keyframes ui-pgs-pulse { 0%, 100% { opacity: 0.45; } 50% { opacity: 1; } }
@keyframes ui-pgs-left { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(-4px); } }
@keyframes ui-pgs-right { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(4px); } }

/* link-expired */
.ui-pgs-chain { fill: none; stroke: var(${v("wire")}); stroke-width: 9; }
.ui-pgs-hand { transform-box: view-box; transform-origin: 206px 60px; animation: ui-pgs-tick var(${v("beat")}) var(--tc-ease-standard) 3; }
@keyframes ui-pgs-tick { 0%, 30% { transform: rotate(0deg); } 45%, 100% { transform: rotate(90deg); } }

/* no-access */
.ui-pgs-back { fill: var(${v("back")}); }
.ui-pgs-front { fill: var(${v("front")}); stroke: var(${v("edge")}); }
.ui-pgs-page { fill: var(${v("page")}); stroke: var(${v("edge")}); }
.ui-pgs-line { fill: var(${v("line")}); }
.ui-pgs-shackle { stroke: var(${v("ink")}); }
.ui-pgs-body { fill: var(${v("ink")}); }
.ui-pgs-key { fill: var(${v("key")}); }
.ui-pgs-lock { transform-box: fill-box; transform-origin: 50% 0%; animation: ui-pgs-settle-lock var(${v("beat")}) var(--tc-ease-standard) 3; }
@keyframes ui-pgs-settle-lock { 0%, 100% { transform: rotate(0deg); } 30% { transform: rotate(-4deg); } 60% { transform: rotate(3deg); } }

/* limit-reached */
.ui-pgs-track { fill: none; stroke: var(${v("bar")}); stroke-width: 12; stroke-linecap: round; }
.ui-pgs-arc { fill: none; stroke: var(${v("mark-edge")}); stroke-width: 12; stroke-linecap: round; }
.ui-pgs-needle { fill: none; stroke: var(${v("ink")}); stroke-width: 5; stroke-linecap: round; }
.ui-pgs-hub { fill: var(${v("ink")}); }
.ui-pgs-hands { fill: none; stroke: var(${v("ink")}); stroke-width: 3.5; stroke-linecap: round; stroke-linejoin: round; }
.ui-pgs-swing { transform-box: view-box; transform-origin: 160px 128px; animation: ui-pgs-nudge var(${v("beat")}) var(--tc-ease-standard) 3; }
@keyframes ui-pgs-nudge { 0%, 100% { transform: rotate(0deg); } 30% { transform: rotate(-9deg); } 55% { transform: rotate(3deg); } 75% { transform: rotate(-1deg); } }

/* first-use */
.ui-pgs-slot { fill: none; stroke: var(${v("wire")}); stroke-width: 1.5; stroke-dasharray: 5 5; }
.ui-pgs-spot { fill: var(${v("glow")}); transform-box: fill-box; transform-origin: center; animation: ui-pgs-spot var(${v("beat")}) var(--tc-ease-standard) 3; }
.ui-pgs-spot-tile { fill: var(${v("mark")}); }
.ui-pgs-plus { fill: none; stroke: var(${v("ink")}); stroke-width: 3; stroke-linecap: round; }
@keyframes ui-pgs-spot { 0%, 100% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.12); opacity: 1; } }

/* The new scenes' motion: a mark that settles, a hand that turns, an hourglass that flips, a box that hops, a slash that draws */
.ui-pgs-settle { transform-box: fill-box; transform-origin: center; animation: ui-pgs-settle var(${v("beat")}) var(--tc-ease-standard) 3; }
.ui-pgs-turn { transform-box: fill-box; transform-origin: 30% 70%; animation: ui-pgs-turn var(${v("beat")}) var(--tc-ease-standard) 3; }
.ui-pgs-flip { transform-box: fill-box; transform-origin: center; animation: ui-pgs-flip var(${v("beat")}) var(--tc-ease-standard) 2; }
.ui-pgs-bounce { animation: ui-pgs-bounce var(${v("beat")}) var(--tc-ease-standard) 3; }
.ui-pgs-dim { animation: ui-pgs-dim var(${v("beat")}) var(--tc-ease-standard) 1; }
.ui-pgs-sparkle { fill: var(${v("ink")}); }
.ui-pgs-strike { stroke-dasharray: 90; animation: ui-pgs-strike calc(var(${v("beat")}) * 0.35) var(--tc-ease-move) calc(var(${v("beat")}) / 8) backwards; }
@keyframes ui-pgs-settle { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }
@keyframes ui-pgs-turn { 0%, 100% { transform: rotate(0deg); } 35% { transform: rotate(-14deg); } 65% { transform: rotate(6deg); } }
@keyframes ui-pgs-flip { 0%, 60% { transform: rotate(0deg); } 100% { transform: rotate(180deg); } }
@keyframes ui-pgs-bounce { 0%, 100% { transform: translateY(0); } 30% { transform: translateY(-8px); } 55% { transform: translateY(0); } 70% { transform: translateY(-3px); } }
@keyframes ui-pgs-dim { 0%, 100% { opacity: 1; } 45% { opacity: 0.3; } }
@keyframes ui-pgs-strike { from { stroke-dashoffset: 90; } to { stroke-dashoffset: 0; } }

/* Off screen or in a hidden tab: the motion holds still */
[data-ui="pgs"][data-paused] :is(${MOVING.join(", ")}) { animation-play-state: paused; }

@media (prefers-reduced-motion: reduce) {
  ${MOVING.join(", ")} { animation: none; }
}
@media (forced-colors: active) {
  .ui-pgs-art { forced-color-adjust: auto; }
}
`;

/** Each status's scene, on the 320 × 240 viewBox */
const SCENES: Record<PageStateKind, () => SVGTemplateResult> = {
  "nothing-found": () => svg`
      <rect class="ui-pgs-tile" x="70" y="42" width="180" height="156" rx="12"></rect>
      <g class="ui-pgs-row"><circle class="ui-pgs-dot" cx="94" cy="72" r="8"></circle><rect class="ui-pgs-bar" x="112" y="64" width="112" height="7" rx="3.5"></rect><rect class="ui-pgs-bar" x="112" y="76" width="72" height="5" rx="2.5"></rect></g>
      <g class="ui-pgs-row"><circle class="ui-pgs-dot" cx="94" cy="120" r="8"></circle><rect class="ui-pgs-bar" x="112" y="112" width="112" height="7" rx="3.5"></rect><rect class="ui-pgs-bar" x="112" y="124" width="72" height="5" rx="2.5"></rect></g>
      <g class="ui-pgs-row"><circle class="ui-pgs-dot" cx="94" cy="168" r="8"></circle><rect class="ui-pgs-bar" x="112" y="160" width="112" height="7" rx="3.5"></rect><rect class="ui-pgs-bar" x="112" y="172" width="72" height="5" rx="2.5"></rect></g>
      <g class="ui-pgs-glass">
        <circle class="ui-pgs-lens" cx="196" cy="128" r="32" stroke-width="7"></circle>
        <path class="ui-pgs-handle" d="m220 152 24 24" fill="none" stroke-width="9" stroke-linecap="round"></path>
      </g>`,
  offline: () => svg`
      <ellipse class="ui-pgs-glow ui-pgs-breathe" cx="160" cy="166" rx="100" ry="12"></ellipse>
      <path class="ui-pgs-cloud" d="M80 132h52a20 20 0 0 0 2-40 28 28 0 0 0-54-4 22 22 0 0 0 0 44Z"></path>
      <path class="ui-pgs-link" d="M142 112h17M175 112h13"></path>
      <path class="ui-pgs-slash" d="m161 100 12 24"></path>
      <rect class="ui-pgs-tile" x="192" y="78" width="68" height="64" rx="14" stroke-width="2"></rect>
      <rect class="ui-pgs-bar" x="206" y="96" width="40" height="6" rx="3"></rect>
      <rect class="ui-pgs-bar" x="206" y="110" width="26" height="6" rx="3"></rect>
      <rect class="ui-pgs-bar" x="206" y="124" width="34" height="6" rx="3"></rect>`,
  "something-wrong": () => svg`
      <ellipse class="ui-pgs-glow" cx="160" cy="176" rx="104" ry="16"></ellipse>
      <g class="ui-pgs-left">
        <path class="ui-pgs-wire" d="M116 120h28" fill="none" stroke-width="5" stroke-linecap="round"></path>
        <rect class="ui-pgs-tile" x="52" y="88" width="64" height="64" rx="14"></rect>
        <rect class="ui-pgs-bar" x="68" y="108" width="32" height="6" rx="3"></rect>
        <rect class="ui-pgs-bar" x="68" y="122" width="22" height="6" rx="3"></rect>
      </g>
      <g class="ui-pgs-right">
        <path class="ui-pgs-wire" d="M176 120h28" fill="none" stroke-width="5" stroke-linecap="round"></path>
        <rect class="ui-pgs-tile" x="204" y="88" width="64" height="64" rx="14"></rect>
        <rect class="ui-pgs-bar" x="220" y="108" width="32" height="6" rx="3"></rect>
        <rect class="ui-pgs-bar" x="220" y="122" width="22" height="6" rx="3"></rect>
      </g>
      <g class="ui-pgs-spark">
        <path class="ui-pgs-warn" d="m160 60 26 46H134Z" stroke-width="4" stroke-linejoin="round"></path>
        <path class="ui-pgs-warn-ink" d="M160 76v14M160 97v.5" fill="none" stroke-width="4" stroke-linecap="round"></path>
        <path class="ui-pgs-wire" d="m152 112 8 8-8 8M168 112l-8 8 8 8" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>
      </g>`,
  "link-expired": () => svg`
      <ellipse class="ui-pgs-glow ui-pgs-breathe" cx="160" cy="176" rx="96" ry="12"></ellipse>
      <rect class="ui-pgs-tile" x="80" y="44" width="160" height="116" rx="16" stroke-width="2"></rect>
      <rect class="ui-pgs-chain" x="96" y="98" width="56" height="28" rx="14" transform="rotate(-30 124 112)"></rect>
      <rect class="ui-pgs-chain" x="166" y="82" width="56" height="28" rx="14" transform="rotate(-30 194 96)"></rect>
      <circle class="ui-pgs-badge" cx="206" cy="60" r="24"></circle>
      <path class="ui-pgs-ink" d="M206 60h9"></path>
      <path class="ui-pgs-ink ui-pgs-hand" d="M206 60V47"></path>`,
  "no-access": () => svg`
      <ellipse class="ui-pgs-glow ui-pgs-breathe" cx="160" cy="190" rx="96" ry="18"></ellipse>
      <path class="ui-pgs-back" d="M72 72a10 10 0 0 1 10-10h46l16 16h94a10 10 0 0 1 10 10v92a10 10 0 0 1-10 10H82a10 10 0 0 1-10-10Z"></path>
      <rect class="ui-pgs-page" x="96" y="56" width="128" height="84" rx="6" transform="rotate(-2 160 98)"></rect>
      <rect class="ui-pgs-line" x="110" y="72" width="84" height="6" rx="3" transform="rotate(-2 160 98)"></rect>
      <rect class="ui-pgs-line" x="110" y="86" width="100" height="6" rx="3" transform="rotate(-2 160 98)"></rect>
      <path class="ui-pgs-front" d="M66 112a10 10 0 0 1 10-10h168a10 10 0 0 1 10 10v70a10 10 0 0 1-10 10H76a10 10 0 0 1-10-10Z"></path>
      <g class="ui-pgs-lock">
        <path class="ui-pgs-shackle" d="M144 134v-14a16 16 0 0 1 32 0v14" fill="none" stroke-width="7" stroke-linecap="round"></path>
        <rect class="ui-pgs-body" x="132" y="132" width="56" height="44" rx="9"></rect>
        <circle class="ui-pgs-key" cx="160" cy="150" r="5.5"></circle>
        <rect class="ui-pgs-key" x="157.5" y="152" width="5" height="12" rx="2.5"></rect>
      </g>`,
  "limit-reached": () => svg`
      <ellipse class="ui-pgs-glow ui-pgs-breathe" cx="160" cy="166" rx="96" ry="12"></ellipse>
      <rect class="ui-pgs-tile" x="96" y="56" width="128" height="100" rx="16" stroke-width="2"></rect>
      <path class="ui-pgs-track" d="M122 128a38 38 0 0 1 76 0"></path>
      <path class="ui-pgs-arc" d="M122 128a38 38 0 0 1 76 0"></path>
      <g class="ui-pgs-swing"><path class="ui-pgs-needle" d="M160 128 192 125"></path></g>
      <circle class="ui-pgs-hub" cx="160" cy="128" r="6"></circle>
      <circle class="ui-pgs-badge" cx="220" cy="62" r="20"></circle>
      <path class="ui-pgs-hands" d="M220 52v10l7 4"></path>`,
  "first-use": () => svg`
      <rect class="ui-pgs-tile" x="50" y="22" width="220" height="136" rx="12"></rect>
      <rect class="ui-pgs-slot" x="66" y="38" width="56" height="48" rx="8"></rect>
      <rect class="ui-pgs-spot" x="124" y="30" width="72" height="64" rx="14"></rect>
      <rect class="ui-pgs-spot-tile" x="132" y="38" width="56" height="48" rx="8"></rect>
      <path class="ui-pgs-plus" d="M160 52v20M150 62h20"></path>
      <rect class="ui-pgs-slot" x="198" y="38" width="56" height="48" rx="8"></rect>
      <rect class="ui-pgs-slot" x="66" y="96" width="56" height="48" rx="8"></rect>
      <rect class="ui-pgs-slot" x="132" y="96" width="56" height="48" rx="8"></rect>
      <rect class="ui-pgs-slot" x="198" y="96" width="56" height="48" rx="8"></rect>`,
  "not-found": () => svg`
      <ellipse class="ui-pgs-glow ui-pgs-breathe" cx="160" cy="166" rx="92" ry="12"></ellipse>
      <path class="ui-pgs-tile" d="M118 40h58l24 24v66l-9-6-9 7-9-7-9 7-9-7-9 7-9-7-9 7-9-7-9 6V50a10 10 0 0 1 10-10Z" stroke-width="2"></path>
      <rect class="ui-pgs-bar" x="122" y="62" width="44" height="6" rx="3"></rect>
      <rect class="ui-pgs-bar" x="122" y="76" width="60" height="6" rx="3"></rect>
      <rect class="ui-pgs-bar" x="122" y="90" width="38" height="6" rx="3"></rect>
      <g class="ui-pgs-settle">
        <circle class="ui-pgs-badge" cx="206" cy="122" r="24"></circle>
        <path class="ui-pgs-ink" d="M199 116a7 7 0 1 1 9 7c-2 1-2 2-2 4M206 133v.5"></path>
      </g>`,
  maintenance: () => svg`
      <ellipse class="ui-pgs-glow ui-pgs-breathe" cx="160" cy="166" rx="92" ry="12"></ellipse>
      <rect class="ui-pgs-tile" x="96" y="50" width="128" height="104" rx="16" stroke-width="2"></rect>
      <rect class="ui-pgs-bar" x="112" y="66" width="44" height="6" rx="3"></rect>
      <rect class="ui-pgs-bar" x="112" y="80" width="30" height="6" rx="3"></rect>
      <circle class="ui-pgs-badge" cx="160" cy="114" r="30"></circle>
      <path class="ui-pgs-ink ui-pgs-turn" d="M172 100a11 11 0 0 0-14 14l-13 13a4 4 0 0 0 6 6l13-13a11 11 0 0 0 14-14l-6 6-6-1-1-6Z"></path>`,
  "session-expired": () => svg`
      <ellipse class="ui-pgs-glow ui-pgs-breathe" cx="160" cy="166" rx="92" ry="12"></ellipse>
      <rect class="ui-pgs-tile" x="96" y="50" width="128" height="104" rx="16" stroke-width="2"></rect>
      <circle class="ui-pgs-badge" cx="152" cy="102" r="30"></circle>
      <path class="ui-pgs-ink" d="M152 102h11"></path>
      <path class="ui-pgs-ink ui-pgs-hand" d="M152 102V86" style="transform-origin: 152px 102px"></path>
      <g class="ui-pgs-settle">
        <circle class="ui-pgs-ink" cx="194" cy="128" r="8"></circle>
        <path class="ui-pgs-ink" d="M200 134l14 14M208 142l5-5M212 146l4-4"></path>
      </g>`,
  "access-requested": () => svg`
      <ellipse class="ui-pgs-glow ui-pgs-breathe" cx="160" cy="166" rx="92" ry="12"></ellipse>
      <rect class="ui-pgs-tile" x="100" y="72" width="120" height="78" rx="12" stroke-width="2"></rect>
      <path class="ui-pgs-wire" d="M104 80l56 38 56-38" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>
      <g class="ui-pgs-flip">
        <circle class="ui-pgs-badge" cx="214" cy="70" r="22"></circle>
        <path class="ui-pgs-ink" d="M205 59h18M205 81h18M208 59c0 7 6 8 6 11s-6 4-6 11M220 59c0 7-6 8-6 11s6 4 6 11"></path>
      </g>`,
  "coming-soon": () => svg`
      <ellipse class="ui-pgs-glow ui-pgs-breathe" cx="160" cy="166" rx="92" ry="12"></ellipse>
      <g class="ui-pgs-bounce">
        <rect class="ui-pgs-badge" x="116" y="88" width="88" height="64" rx="8"></rect>
        <rect class="ui-pgs-badge" x="108" y="72" width="104" height="20" rx="6"></rect>
        <path class="ui-pgs-ink" d="M160 72v80"></path>
        <path class="ui-pgs-ink" d="M160 72c-6-14-26-16-24-4 1 6 14 5 24 4ZM160 72c6-14 26-16 24-4-1 6-14 5-24 4Z"></path>
      </g>`,
  "region-unavailable": () => svg`
      <ellipse class="ui-pgs-glow ui-pgs-breathe" cx="160" cy="166" rx="92" ry="12"></ellipse>
      <circle class="ui-pgs-badge" cx="160" cy="102" r="40"></circle>
      <path class="ui-pgs-ink" d="M120 102h80M160 62c-14 12-14 68 0 80M160 62c14 12 14 68 0 80M126 82h68M126 122h68"></path>
      <path class="ui-pgs-ink ui-pgs-strike" d="M128 70l64 64" stroke-width="6"></path>`,
  "ai-unavailable": () => svg`
      <ellipse class="ui-pgs-glow ui-pgs-breathe" cx="160" cy="166" rx="92" ry="12"></ellipse>
      <rect class="ui-pgs-tile" x="96" y="50" width="128" height="104" rx="16" stroke-width="2"></rect>
      <path class="ui-pgs-badge" d="M126 76h56a12 12 0 0 1 12 12v30a12 12 0 0 1-12 12h-30l-14 12v-12h-12a12 12 0 0 1-12-12V88a12 12 0 0 1 12-12Z"></path>
      <path class="ui-pgs-sparkle ui-pgs-dim" d="M154 86c2 10 5 13 15 15-10 2-13 5-15 15-2-10-5-13-15-15 10-2 13-5 15-15Z"></path>
      <g class="ui-pgs-settle">
        <circle class="ui-pgs-badge" cx="206" cy="134" r="20"></circle>
        <path class="ui-pgs-ink" d="M200 126v16M212 126v16"></path>
      </g>`,
};

/**
 * The full-page and empty states – nothing found, offline, something wrong, link expired, no access, limit reached, first use, page not found, maintenance, session expired, access requested, coming soon, not available in your region and AI unavailable – as one illustration.
 * @tag tc-page-state
 */
export class TcPageState extends TcElement {
  static override ui = "pgs";
  static override looks = false;
  static override css = css;

  /** Which state: "nothing-found", "offline", "something-wrong", "link-expired", "no-access", "limit-reached", "first-use", "not-found", "maintenance", "session-expired", "access-requested", "coming-soon", "region-unavailable" or "ai-unavailable" */
  @property({ reflect: true }) accessor status: PageStateKind = "nothing-found";
  /** The words under the drawing; unset, the status's own; "" leaves them out */
  @property() accessor caption: string | undefined = undefined;
  /** Accessible description, when it should say more than the words */
  @property() accessor label = "";

  /** @internal */
  private readonly screen = new OnScreenController(this);

  /** The words shown and used as the name: `caption`, or the status's own */
  get words(): string {
    return this.caption ?? pageStateWords[this.status] ?? "";
  }

  protected override updated() {
    const name = this.label || this.words;
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
    const scene = SCENES[this.status] ?? SCENES["nothing-found"];
    const words = this.words;
    return html`<svg class="ui-pgs-art" viewBox="0 0 320 240" aria-hidden="true">${scene()}</svg>
      ${words ? html`<p class="ui-pgs-caption">${words}</p>` : nothing}`;
  }
}

if (!customElements.get("tc-page-state")) customElements.define("tc-page-state", TcPageState);

declare global {
  interface HTMLElementTagNameMap {
    "tc-page-state": TcPageState;
  }
}
