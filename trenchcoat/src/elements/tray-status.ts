import { html, nothing, svg, type SVGTemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { OnScreenController } from "./internal/controllers";

/*
 * <tc-tray-status> – a tray scene that says where something stands, in the soft style of the state illustrations: a
 * rounded tray with its rim, one pastel badge with a darker edge and ink, a soft glow beneath, and its words as real
 * text under the drawing, on a 320 × 240 viewBox inside a 3 : 2 frame. `status` picks the scene:
 *   · "all-done" (green) – an empty tray with a check above it, for an inbox or queue with nothing waiting. The check
 *     draws itself in and the badge settles a few times, then rests. "You're all caught up"
 *   · "upload-failed" (red) – a file lifted above an open tray, its upload arrow stopping short, with a cross badge, for
 *     an upload that didn't finish. The file rises a little and drops back a few times, then rests. "Upload failed"
 *   · "empty" (slate) – an empty tray and no check, for a first visit with nothing here yet. "Nothing here yet"
 *   · "import-complete" (green) – pages settled in the tray with a check. "Import complete"
 *   · "export-ready" (blue) – a page rising out of the tray with a download mark. "Export ready"
 *   · "storage-full" (amber) – pages overflowing the rim with a "!". "Storage full"
 *   · "drop-to-upload" (blue) – an open tray with a dashed page hovering above it and an up arrow. "Drop files to upload"
 *   · "new-items" (blue) – a tray with `count` on its badge ("99+" past 99). "3 new"
 *   · "paused" (slate) – a tray with a pause mark. "Paused"
 *   · "sync-complete" (green) – a tray with circular arrows that turn once and a check. "Sync complete"
 * Its words follow the status unless `caption` sets its own.
 *
 *   <tc-tray-status status="upload-failed"></tc-tray-status>
 *
 * It says what's happened, so the host is an image named by `label`, or else by its words. Set caption="" and leave
 * `label` empty when the words beside it already say so: it's then decorative. The motion runs a few cycles and rests,
 * holds still off screen or in a hidden tab (data-paused) and stays still with reduced motion. Colours follow the page
 * theme through light-dark(). It replaces <tc-all-done> and <tc-upload-failed>: status="all-done" and
 * status="upload-failed" draw their scenes exactly as they were.
 */

export type TrayStatusKind = "all-done" | "upload-failed" | "empty" | "import-complete" | "export-ready" | "storage-full" | "drop-to-upload" | "new-items" | "paused" | "sync-complete";

/** The words for each status, when `caption` isn't set */
export const trayStatusWords: Record<TrayStatusKind, string> = {
  "all-done": "You're all caught up",
  "upload-failed": "Upload failed",
  empty: "Nothing here yet",
  "import-complete": "Import complete",
  "export-ready": "Export ready",
  "storage-full": "Storage full",
  "drop-to-upload": "Drop files to upload",
  "new-items": "{n} new",
  paused: "Paused",
  "sync-complete": "Sync complete",
};

/** A count as the badge shows it: 1 to 99, then "99+" */
export const trayCount = (n: number) => (n > 99 ? "99+" : String(Math.max(0, Math.round(n))));

type Pair = [string, string];
/** What one status needs: its colours and beat, the drawing, which classes move, and the rules that move them */
type Scene = {
  palette: { mark: Pair; markEdge: Pair; ink: Pair; glow: Pair };
  beat: string;
  /** The classes that animate, in the order the reduced-motion rule lists them */
  moving: string[];
  /** Its motion rules; `p` is the class prefix (ui-x), `v(k)` a custom property */
  motion: (p: string, v: (k: string) => string) => string;
  draw: (p: string, count: number) => SVGTemplateResult;
};

const SCENES: Record<TrayStatusKind, Scene> = {
  "all-done": {
    palette: {
      mark: ["#dcf3e4", "#1f3d2b"],
      markEdge: ["#8fd1a8", "#5fae7d"],
      ink: ["#1f6b3d", "#c8efd6"],
      glow: ["rgba(110, 200, 145, 0.24)", "rgba(110, 200, 145, 0.12)"],
    },
    beat: "3s",
    moving: ["mark", "check", "glow"],
    motion: (p, v) => /* css */ `
.${p}-check { animation: ${p}-draw calc(var(${v("beat")}) / 4) var(--tc-ease-move) var(--tc-duration-fast) 1 backwards; }
.${p}-mark { transform-box: fill-box; transform-origin: center; animation: ${p}-settle var(${v("beat")}) var(--tc-ease-standard) 3; }`,
    draw: (p) => svg`
      <ellipse class=${`${p}-glow`} cx="160" cy="166" rx="96" ry="14"></ellipse>
      <rect class=${`${p}-tray`} x="86" y="92" width="148" height="64" rx="14" stroke-width="2"></rect>
      <path class=${`${p}-rim`} d="M104 116h24l8 12h48l8-12h24"></path>
      <g class=${`${p}-mark`}>
        <circle class=${`${p}-badge`} cx="160" cy="70" r="28"></circle>
        <path class=${`${p}-check`} d="M148 70l8 8 16-16"></path>
      </g>`,
  },
  "upload-failed": {
    palette: {
      mark: ["#fde2df", "#5a2724"],
      markEdge: ["#f0a197", "#c96a60"],
      ink: ["#a8231a", "#fbd2cd"],
      glow: ["rgba(240, 112, 102, 0.2)", "rgba(240, 112, 102, 0.1)"],
    },
    beat: "3s",
    moving: ["file", "glow"],
    motion: (p, v) => /* css */ `
.${p}-file { animation: ${p}-lift var(${v("beat")}) var(--tc-ease-standard) 3; }`,
    draw: (p) => svg`
      <ellipse class=${`${p}-glow`} cx="160" cy="180" rx="96" ry="12"></ellipse>
      <rect class=${`${p}-tile`} x="88" y="126" width="144" height="44" rx="14" stroke-width="2"></rect>
      <rect class=${`${p}-slot`} x="104" y="136" width="112" height="9" rx="4.5"></rect>
      <g class=${`${p}-file`}>
        <rect class=${`${p}-tile`} x="124" y="24" width="72" height="88" rx="12" stroke-width="2"></rect>
        <rect class=${`${p}-line`} x="136" y="38" width="32" height="6" rx="3"></rect>
        <rect class=${`${p}-line`} x="136" y="50" width="22" height="6" rx="3"></rect>
        <path class=${`${p}-wire`} d="M160 100V72M149 82l11-11 11 11"></path>
        <circle class=${`${p}-badge`} cx="196" cy="30" r="19"></circle>
        <path class=${`${p}-ink`} d="m189 23 14 14M203 23l-14 14"></path>
      </g>`,
  },
  empty: {
    palette: {
      mark: ["#e9edf2", "#2f343b"],
      markEdge: ["#b7c0cc", "#6b7480"],
      ink: ["#475467", "#d5dbe3"],
      glow: ["rgba(140, 155, 175, 0.22)", "rgba(140, 155, 175, 0.1)"],
    },
    beat: "3s",
    moving: ["mark", "glow"],
    motion: (p, v) => /* css */ `
.${p}-mark { transform-box: fill-box; transform-origin: center; animation: ${p}-settle var(${v("beat")}) var(--tc-ease-standard) 3; }`,
    draw: (p) => svg`
      <ellipse class=${`${p}-glow`} cx="160" cy="166" rx="96" ry="14"></ellipse>
      <g class=${`${p}-mark`}>
        <rect class=${`${p}-tray`} x="86" y="92" width="148" height="64" rx="14" stroke-width="2"></rect>
        <path class=${`${p}-rim`} d="M104 116h24l8 12h48l8-12h24"></path>
      </g>
      <path class=${`${p}-dash`} d="M128 70h64"></path>`,
  },
  "import-complete": {
    palette: {
      mark: ["#dcf3e4", "#1f3d2b"],
      markEdge: ["#8fd1a8", "#5fae7d"],
      ink: ["#1f6b3d", "#c8efd6"],
      glow: ["rgba(110, 200, 145, 0.24)", "rgba(110, 200, 145, 0.12)"],
    },
    beat: "3s",
    moving: ["pages", "check", "glow"],
    motion: (p, v) => /* css */ `
.${p}-pages { animation: ${p}-drop-in calc(var(${v("beat")}) / 3) var(--tc-ease-move) 1 backwards; }
.${p}-check { animation: ${p}-draw calc(var(${v("beat")}) / 4) var(--tc-ease-move) calc(var(${v("beat")}) / 4) 1 backwards; }`,
    draw: (p) => svg`
      <ellipse class=${`${p}-glow`} cx="160" cy="166" rx="96" ry="14"></ellipse>
      <g class=${`${p}-pages`}>
        <rect class=${`${p}-tile`} x="108" y="72" width="64" height="52" rx="8" stroke-width="2" transform="rotate(-6 140 98)"></rect>
        <rect class=${`${p}-tile`} x="124" y="66" width="64" height="56" rx="8" stroke-width="2"></rect>
        <rect class=${`${p}-line`} x="134" y="78" width="30" height="5" rx="2.5"></rect>
        <rect class=${`${p}-line`} x="134" y="89" width="40" height="5" rx="2.5"></rect>
      </g>
      <rect class=${`${p}-tray`} x="86" y="104" width="148" height="52" rx="14" stroke-width="2"></rect>
      <path class=${`${p}-rim`} d="M104 124h24l8 10h48l8-10h24"></path>
      <circle class=${`${p}-badge`} cx="200" cy="62" r="20"></circle>
      <path class=${`${p}-check`} d="M191 62l6 6 12-12"></path>`,
  },
  "export-ready": {
    palette: {
      mark: ["#d6eef8", "#1c3f52"],
      markEdge: ["#7cc1e0", "#5aaed4"],
      ink: ["#1b6a8c", "#cdeaf7"],
      glow: ["rgba(90, 170, 215, 0.24)", "rgba(90, 170, 215, 0.12)"],
    },
    beat: "3s",
    moving: ["file", "glow"],
    motion: (p, v) => /* css */ `
.${p}-file { animation: ${p}-lift var(${v("beat")}) var(--tc-ease-standard) 3; }`,
    draw: (p) => svg`
      <ellipse class=${`${p}-glow`} cx="160" cy="180" rx="96" ry="12"></ellipse>
      <rect class=${`${p}-tile`} x="88" y="126" width="144" height="44" rx="14" stroke-width="2"></rect>
      <rect class=${`${p}-slot`} x="104" y="136" width="112" height="9" rx="4.5"></rect>
      <g class=${`${p}-file`}>
        <rect class=${`${p}-tile`} x="124" y="24" width="72" height="88" rx="12" stroke-width="2"></rect>
        <rect class=${`${p}-line`} x="136" y="38" width="32" height="6" rx="3"></rect>
        <rect class=${`${p}-line`} x="136" y="50" width="22" height="6" rx="3"></rect>
        <rect class=${`${p}-line`} x="136" y="62" width="40" height="6" rx="3"></rect>
        <circle class=${`${p}-badge`} cx="196" cy="30" r="19"></circle>
        <path class=${`${p}-ink`} d="M196 21v16M189 31l7 7 7-7"></path>
      </g>`,
  },
  "storage-full": {
    palette: {
      mark: ["#fdf0d5", "#4a3a14"],
      markEdge: ["#ecc06a", "#c9a24a"],
      ink: ["#7f5300", "#f7e2b5"],
      glow: ["rgba(230, 170, 70, 0.24)", "rgba(230, 170, 70, 0.12)"],
    },
    beat: "3s",
    moving: ["spill", "glow"],
    motion: (p, v) => /* css */ `
.${p}-spill { transform-box: fill-box; transform-origin: bottom center; animation: ${p}-wobble var(${v("beat")}) var(--tc-ease-standard) 3; }`,
    draw: (p) => svg`
      <ellipse class=${`${p}-glow`} cx="160" cy="166" rx="96" ry="14"></ellipse>
      <rect class=${`${p}-tile`} x="100" y="60" width="60" height="48" rx="8" stroke-width="2" transform="rotate(-10 130 84)"></rect>
      <rect class=${`${p}-tile`} x="150" y="62" width="60" height="46" rx="8" stroke-width="2" transform="rotate(8 180 85)"></rect>
      <g class=${`${p}-spill`}>
        <rect class=${`${p}-tile`} x="124" y="40" width="64" height="50" rx="8" stroke-width="2" transform="rotate(-4 156 65)"></rect>
        <rect class=${`${p}-line`} x="134" y="52" width="30" height="5" rx="2.5" transform="rotate(-4 156 65)"></rect>
      </g>
      <rect class=${`${p}-tray`} x="86" y="96" width="148" height="60" rx="14" stroke-width="2"></rect>
      <path class=${`${p}-rim`} d="M104 118h24l8 11h48l8-11h24"></path>
      <circle class=${`${p}-badge`} cx="214" cy="40" r="19"></circle>
      <path class=${`${p}-ink`} d="M214 31v11M214 49v0.5"></path>`,
  },
  "drop-to-upload": {
    palette: {
      mark: ["#d6eef8", "#1c3f52"],
      markEdge: ["#7cc1e0", "#5aaed4"],
      ink: ["#1b6a8c", "#cdeaf7"],
      glow: ["rgba(90, 170, 215, 0.24)", "rgba(90, 170, 215, 0.12)"],
    },
    beat: "3s",
    moving: ["hover", "glow"],
    motion: (p, v) => /* css */ `
.${p}-hover { animation: ${p}-hover var(${v("beat")}) var(--tc-ease-standard) 3; }`,
    draw: (p) => svg`
      <ellipse class=${`${p}-glow`} cx="160" cy="180" rx="96" ry="12"></ellipse>
      <rect class=${`${p}-tile`} x="88" y="126" width="144" height="44" rx="14" stroke-width="2"></rect>
      <rect class=${`${p}-slot`} x="104" y="136" width="112" height="9" rx="4.5"></rect>
      <g class=${`${p}-hover`}>
        <rect class=${`${p}-outline`} x="126" y="22" width="68" height="84" rx="12"></rect>
        <circle class=${`${p}-badge`} cx="160" cy="64" r="20"></circle>
        <path class=${`${p}-ink`} d="M160 74V54M151 62l9-9 9 9"></path>
      </g>`,
  },
  "new-items": {
    palette: {
      mark: ["#d6eef8", "#1c3f52"],
      markEdge: ["#7cc1e0", "#5aaed4"],
      ink: ["#1b6a8c", "#cdeaf7"],
      glow: ["rgba(90, 170, 215, 0.24)", "rgba(90, 170, 215, 0.12)"],
    },
    beat: "3s",
    moving: ["mark", "glow"],
    motion: (p, v) => /* css */ `
.${p}-mark { transform-box: fill-box; transform-origin: center; animation: ${p}-settle var(${v("beat")}) var(--tc-ease-standard) 3; }`,
    draw: (p, count) => svg`
      <ellipse class=${`${p}-glow`} cx="160" cy="166" rx="96" ry="14"></ellipse>
      <rect class=${`${p}-tray`} x="86" y="92" width="148" height="64" rx="14" stroke-width="2"></rect>
      <path class=${`${p}-rim`} d="M104 116h24l8 12h48l8-12h24"></path>
      <g class=${`${p}-mark`}>
        <circle class=${`${p}-badge`} cx="160" cy="70" r="28"></circle>
        <text class=${`${p}-count`} x="160" y="71" text-anchor="middle" dominant-baseline="central" font-size=${trayCount(count).length > 2 ? 18 : 24} font-weight="700">${trayCount(count)}</text>
      </g>`,
  },
  paused: {
    palette: {
      mark: ["#e9edf2", "#2f343b"],
      markEdge: ["#b7c0cc", "#6b7480"],
      ink: ["#475467", "#d5dbe3"],
      glow: ["rgba(140, 155, 175, 0.22)", "rgba(140, 155, 175, 0.1)"],
    },
    beat: "3s",
    moving: ["mark", "glow"],
    motion: (p, v) => /* css */ `
.${p}-mark { transform-box: fill-box; transform-origin: center; animation: ${p}-settle var(${v("beat")}) var(--tc-ease-standard) 2; }`,
    draw: (p) => svg`
      <ellipse class=${`${p}-glow`} cx="160" cy="166" rx="96" ry="14"></ellipse>
      <rect class=${`${p}-tray`} x="86" y="92" width="148" height="64" rx="14" stroke-width="2"></rect>
      <path class=${`${p}-rim`} d="M104 116h24l8 12h48l8-12h24"></path>
      <g class=${`${p}-mark`}>
        <circle class=${`${p}-badge`} cx="160" cy="70" r="28"></circle>
        <path class=${`${p}-bars`} d="M152 60v20M168 60v20"></path>
      </g>`,
  },
  "sync-complete": {
    palette: {
      mark: ["#dcf3e4", "#1f3d2b"],
      markEdge: ["#8fd1a8", "#5fae7d"],
      ink: ["#1f6b3d", "#c8efd6"],
      glow: ["rgba(110, 200, 145, 0.24)", "rgba(110, 200, 145, 0.12)"],
    },
    beat: "3s",
    moving: ["spin", "check", "glow"],
    motion: (p, v) => /* css */ `
.${p}-spin { transform-box: fill-box; transform-origin: center; animation: ${p}-turn calc(var(${v("beat")}) / 3) var(--tc-ease-move) 1; }
.${p}-check { animation: ${p}-draw calc(var(${v("beat")}) / 4) var(--tc-ease-move) calc(var(${v("beat")}) / 3) 1 backwards; }`,
    draw: (p) => svg`
      <ellipse class=${`${p}-glow`} cx="160" cy="166" rx="96" ry="14"></ellipse>
      <rect class=${`${p}-tray`} x="86" y="92" width="148" height="64" rx="14" stroke-width="2"></rect>
      <path class=${`${p}-rim`} d="M104 116h24l8 12h48l8-12h24"></path>
      <circle class=${`${p}-badge`} cx="160" cy="70" r="28"></circle>
      <g class=${`${p}-spin`}>
        <path class=${`${p}-ink`} d="M144 64a17 17 0 0 1 29-8M176 76a17 17 0 0 1-29 8"></path>
        <path class=${`${p}-ink`} d="M173 48v8h-8M147 92v-8h8"></path>
      </g>
      <path class=${`${p}-check`} d="M152 70l6 6 10-10"></path>`,
  },
};

/**
 * The CSS for a tray element: `statuses` lists the scenes it can draw. With one, its colours and motion apply outright;
 * with several, each status's colours and motion apply under its own [status].
 * `name` names the custom properties (`--tc-<name>-mark` …); `ui` is the class prefix.
 */
export function trayCss(o: { ui: string; name: string; statuses: TrayStatusKind[] }) {
  const { ui, name, statuses } = o;
  const p = `ui-${ui}`;
  const v = (k: string) => `--tc-${name}-${k}`;
  const one = statuses.length === 1;
  const colours = (s: TrayStatusKind) => {
    const c = SCENES[s].palette;
    return `${v("mark")}: light-dark(${c.mark[0]}, ${c.mark[1]});
  ${v("mark-edge")}: light-dark(${c.markEdge[0]}, ${c.markEdge[1]});
  ${v("ink")}: light-dark(${c.ink[0]}, ${c.ink[1]});
  ${v("glow")}: light-dark(${c.glow[0]}, ${c.glow[1]});
  ${v("beat")}: ${SCENES[s].beat};`;
  };
  const scope = (s: TrayStatusKind, rules: string) => (one ? rules : rules.replace(/^\.(?=ui-)/gm, `[data-ui="${ui}"][status="${s}"] .`));
  const moving = [...new Set(statuses.flatMap((s) => SCENES[s].moving))].map((c) => `.${p}-${c}`).join(", ");
  return /* css */ `
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

[data-ui="${ui}"] {
  ${v("tray")}: light-dark(#ffffff, #2a2a2e);
  ${v("edge")}: light-dark(#e4e7ec, rgba(255, 255, 255, 0.1));
  ${v("rim")}: light-dark(#e6e9ee, #44464d);
  ${v("slot")}: light-dark(#eef1f5, #35373d);
  ${v("line")}: light-dark(#e6e9ee, #44464d);
  ${v("wire")}: light-dark(#c3cad4, #5c6068);
  ${colours(statuses[0])}
  ${v("soft")}: 12px;
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  font-family: var(--tc-font-sans);
}
${one ? "" : statuses.slice(1).map((s) => `[data-ui="${ui}"][status="${s}"] {\n  ${colours(s)}\n}`).join("\n")}
.${p}-art { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
.${p}-tray, .${p}-tile { fill: var(${v("tray")}); stroke: var(${v("edge")}); }
.${p}-rim { fill: none; stroke: var(${v("rim")}); stroke-width: 5; stroke-linecap: round; stroke-linejoin: round; }
.${p}-slot { fill: var(${v("slot")}); }
.${p}-line { fill: var(${v("line")}); }
.${p}-wire { fill: none; stroke: var(${v("wire")}); stroke-width: 5; stroke-linecap: round; stroke-linejoin: round; }
.${p}-badge { fill: var(${v("mark")}); stroke: var(${v("mark-edge")}); stroke-width: 4; }
.${p}-ink { fill: none; stroke: var(${v("ink")}); stroke-width: 4; stroke-linecap: round; }
.${p}-outline { fill: none; stroke: var(${v("mark-edge")}); stroke-width: 3; stroke-dasharray: 8 7; stroke-linecap: round; }
.${p}-bars { fill: none; stroke: var(${v("ink")}); stroke-width: 6; stroke-linecap: round; }
.${p}-count { fill: var(${v("ink")}); font-family: var(--tc-font-sans); font-variant-numeric: tabular-nums; }
.${p}-dash { fill: none; stroke: var(${v("rim")}); stroke-width: 4; stroke-linecap: round; stroke-dasharray: 2 12; }
.${p}-check { fill: none; stroke: var(${v("ink")}); stroke-width: 5; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 36; stroke-dashoffset: 0; }
.${p}-glow { fill: var(${v("glow")}); filter: blur(var(${v("soft")})); animation: ${p}-breathe var(${v("beat")}) var(--tc-ease-standard) 3; }
.${p}-caption { position: absolute; right: 0; bottom: 0; left: 0; margin: 0; color: var(--tc-text-primary); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); text-align: center; }
${statuses.map((s) => scope(s, SCENES[s].motion(p, v).trim())).join("\n")}
@keyframes ${p}-draw { from { stroke-dashoffset: 36; } to { stroke-dashoffset: 0; } }
@keyframes ${p}-settle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
@keyframes ${p}-lift { 0%, 100% { transform: translateY(0); } 40% { transform: translateY(-7px); } 70% { transform: translateY(1px); } }
@keyframes ${p}-drop-in { from { opacity: 0; transform: translateY(-14px); } to { opacity: 1; transform: translateY(0); } }
@keyframes ${p}-wobble { 0%, 100% { transform: rotate(0); } 30% { transform: rotate(-3deg); } 60% { transform: rotate(2deg); } }
@keyframes ${p}-hover { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
@keyframes ${p}-turn { from { transform: rotate(-180deg); } to { transform: rotate(0); } }
@keyframes ${p}-breathe { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

/* Off screen or in a hidden tab: the motion holds still */
[data-ui="${ui}"][data-paused] :is(${moving}) { animation-play-state: paused; }

@media (prefers-reduced-motion: reduce) {
  ${moving} { animation: none; }
}
@media (forced-colors: active) {
  .${p}-art { forced-color-adjust: auto; }
}
`;
}

/**
 * A tray scene that says where something stands – all done, empty, an upload that failed, an import complete, an export ready, storage full, or a place to drop files.
 * @tag tc-tray-status
 */
export class TcTrayStatus extends TcElement {
  static override ui = "trs";
  static override looks = false;
  static override css = trayCss({ ui: "trs", name: "tray-status", statuses: ["all-done", "upload-failed", "empty", "import-complete", "export-ready", "storage-full", "drop-to-upload", "new-items", "paused", "sync-complete"] });

  /** The scene: "all-done", "empty", "drop-to-upload", "new-items", "import-complete", "export-ready", "sync-complete", "paused", "upload-failed" or "storage-full" */
  @property({ reflect: true }) accessor status: TrayStatusKind = "all-done";
  /** How many new items "new-items" shows, in its badge and its words (default 3) */
  @property({ type: Number }) accessor count = 3;
  /** The words under the drawing; unset, the status's own words; "" leaves them out */
  @property() accessor caption: string | undefined = undefined;
  /** Accessible description, when it should say more than the words */
  @property() accessor label = "";

  /** @internal */
  private readonly screen = new OnScreenController(this);

  /** The scene drawn: `status`, or all-done for one it doesn't know */
  protected get current(): TrayStatusKind {
    return SCENES[this.status] ? this.status : "all-done";
  }

  /** The words shown and used as the name */
  protected get words(): string {
    return this.caption ?? trayStatusWords[this.current].replace("{n}", trayCount(this.count));
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
    const p = `ui-${(this.constructor as typeof TcElement).ui}`;
    const scene = SCENES[this.current];
    return html`<svg class=${`${p}-art`} viewBox="0 0 320 240" aria-hidden="true">${scene.draw(p, this.count)}</svg>
      ${this.words ? html`<p class=${`${p}-caption`}>${this.words}</p>` : nothing}`;
  }
}

if (!customElements.get("tc-tray-status")) customElements.define("tc-tray-status", TcTrayStatus);

declare global {
  interface HTMLElementTagNameMap {
    "tc-tray-status": TcTrayStatus;
  }
}
