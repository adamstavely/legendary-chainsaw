import { html, nothing, svg, type SVGTemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { OnScreenController } from "./internal/controllers";

/*
 * <tc-folder-status> – a folder scene that says where a folder stands, in the soft style of the state illustrations: a
 * pastel folder (its back with the tab and its front flap), one pastel badge with a darker edge and ink, a soft glow
 * beneath, and its words as real text under the drawing, on a 320 × 240 viewBox inside a 3 : 2 frame. `status` picks it:
 *   · "empty" (slate) – an open folder with nothing in it; the front flap eases open a few times. "Empty folder"
 *   · "shared" (blue) – two small people on the badge; the badge settles a few times. "Shared folder"
 *   · "archived" (slate) – a box with an arrow going into it on the badge; the arrow drops a few times. "Archived"
 *   · "locked" (amber) – a small padlock badge on the folder's corner; the lock settles a few times. "Locked folder"
 *   · "syncing" (blue) – circular arrows on the badge that turn a few times. "Syncing"
 *   · "restricted" (red) – a shield on the badge: a classification, not a lock. "Restricted folder"
 * Its words follow the status unless `caption` sets its own.
 *
 *   <tc-folder-status status="shared"></tc-folder-status>
 *
 * It says where the folder stands, so the host is an image named by `label`, or else by its words. Set caption="" and
 * leave `label` empty when the words beside it already say so: it's then decorative. The motion runs a few cycles and
 * rests, holds still off screen or in a hidden tab (data-paused) and stays still with reduced motion. Colours follow the
 * page theme through light-dark().
 */

export type FolderStatusKind = "empty" | "shared" | "archived" | "locked" | "syncing" | "restricted";

/** The words for each status, when `caption` isn't set */
export const folderStatusWords: Record<FolderStatusKind, string> = {
  empty: "Empty folder",
  shared: "Shared folder",
  archived: "Archived",
  locked: "Locked folder",
  syncing: "Syncing",
  restricted: "Restricted folder",
};

type Pair = [string, string];
type Scene = {
  palette: { mark: Pair; markEdge: Pair; ink: Pair; glow: Pair };
  /** The classes that animate, in the order the reduced-motion rule lists them */
  moving: string[];
  /** Its motion rules; `p` is the class prefix (ui-x), `v(k)` a custom property */
  motion: (p: string, v: (k: string) => string) => string;
  draw: (p: string) => SVGTemplateResult;
};

const SLATE = {
  mark: ["#e9edf2", "#2f343b"] as Pair,
  markEdge: ["#b7c0cc", "#6b7480"] as Pair,
  ink: ["#475467", "#d5dbe3"] as Pair,
  glow: ["rgba(140, 155, 175, 0.22)", "rgba(140, 155, 175, 0.1)"] as Pair,
};

/** The folder's back – the part with the tab – and its closed front flap */
const back = (p: string) => svg`<path class=${`${p}-back`} d="M96 62a10 10 0 0 1 10-10h32a8 8 0 0 1 6 3l7 8h63a10 10 0 0 1 10 10v74a10 10 0 0 1-10 10H106a10 10 0 0 1-10-10Z" stroke-width="2"></path>`;
const front = (p: string) => svg`<path class=${`${p}-front`} d="M92 86a10 10 0 0 1 10-10h116a10 10 0 0 1 10 10v58a10 10 0 0 1-10 10H102a10 10 0 0 1-10-10Z" stroke-width="2"></path>`;
const glow = (p: string) => svg`<ellipse class=${`${p}-glow`} cx="160" cy="168" rx="92" ry="13"></ellipse>`;

const SCENES: Record<FolderStatusKind, Scene> = {
  empty: {
    palette: SLATE,
    moving: ["flap", "glow"],
    motion: (p, v) => /* css */ `
.${p}-flap { transform-box: fill-box; transform-origin: bottom center; animation: ${p}-open var(${v("beat")}) var(--tc-ease-standard) 3; }`,
    draw: (p) => svg`
      ${glow(p)}
      ${back(p)}
      <path class=${`${p}-inside`} d="M106 70h108v12H106Z"></path>
      <path class=${`${p}-front ${p}-flap`} d="M86 96a10 10 0 0 1 10-8h128a10 10 0 0 1 10 9l-8 48a10 10 0 0 1-10 9H104a10 10 0 0 1-10-9Z" stroke-width="2"></path>`,
  },
  shared: {
    palette: {
      mark: ["#d6eef8", "#1c3f52"],
      markEdge: ["#7cc1e0", "#5aaed4"],
      ink: ["#1b6a8c", "#cdeaf7"],
      glow: ["rgba(90, 170, 215, 0.24)", "rgba(90, 170, 215, 0.12)"],
    },
    moving: ["mark", "glow"],
    motion: (p, v) => /* css */ `
.${p}-mark { transform-box: fill-box; transform-origin: center; animation: ${p}-settle var(${v("beat")}) var(--tc-ease-standard) 3; }`,
    draw: (p) => svg`
      ${glow(p)}
      ${back(p)}
      ${front(p)}
      <g class=${`${p}-mark`}>
        <circle class=${`${p}-badge`} cx="160" cy="116" r="26"></circle>
        <circle class=${`${p}-ink`} cx="152" cy="110" r="5"></circle>
        <path class=${`${p}-ink`} d="M141 128a11 11 0 0 1 22 0"></path>
        <circle class=${`${p}-ink`} cx="170" cy="108" r="4"></circle>
        <path class=${`${p}-ink`} d="M166 118a9 9 0 0 1 13 8"></path>
      </g>`,
  },
  archived: {
    palette: SLATE,
    moving: ["arrow", "glow"],
    motion: (p, v) => /* css */ `
.${p}-arrow { animation: ${p}-drop var(${v("beat")}) var(--tc-ease-standard) 3; }`,
    draw: (p) => svg`
      ${glow(p)}
      ${back(p)}
      ${front(p)}
      <circle class=${`${p}-badge`} cx="160" cy="116" r="26"></circle>
      <path class=${`${p}-ink`} d="M146 116v10a3 3 0 0 0 3 3h22a3 3 0 0 0 3-3v-10M143 110h34"></path>
      <path class=${`${p}-ink ${p}-arrow`} d="M160 98v14M154 106l6 6 6-6"></path>`,
  },
  locked: {
    palette: {
      mark: ["#fdf0d5", "#4a3a14"],
      markEdge: ["#ecc06a", "#c9a24a"],
      ink: ["#7f5300", "#f7e2b5"],
      glow: ["rgba(230, 170, 70, 0.24)", "rgba(230, 170, 70, 0.12)"],
    },
    moving: ["mark", "glow"],
    motion: (p, v) => /* css */ `
.${p}-mark { transform-box: fill-box; transform-origin: center; animation: ${p}-settle var(${v("beat")}) var(--tc-ease-standard) 3; }`,
    draw: (p) => svg`
      ${glow(p)}
      ${back(p)}
      ${front(p)}
      <g class=${`${p}-mark`}>
        <circle class=${`${p}-badge`} cx="218" cy="146" r="22"></circle>
        <path class=${`${p}-ink`} d="M211 143v-5a7 7 0 0 1 14 0v5"></path>
        <rect class=${`${p}-ink`} x="207" y="143" width="22" height="15" rx="3"></rect>
      </g>`,
  },
  syncing: {
    palette: {
      mark: ["#d6eef8", "#1c3f52"],
      markEdge: ["#7cc1e0", "#5aaed4"],
      ink: ["#1b6a8c", "#cdeaf7"],
      glow: ["rgba(90, 170, 215, 0.24)", "rgba(90, 170, 215, 0.12)"],
    },
    moving: ["spin", "glow"],
    motion: (p, v) => /* css */ `
.${p}-spin { transform-box: fill-box; transform-origin: center; animation: ${p}-turn var(${v("beat")}) var(--tc-ease-standard) 3; }`,
    draw: (p) => svg`
      ${glow(p)}
      ${back(p)}
      ${front(p)}
      <circle class=${`${p}-badge`} cx="160" cy="116" r="26"></circle>
      <g class=${`${p}-spin`}>
        <path class=${`${p}-ink`} d="M146 112a15 15 0 0 1 26-8M174 120a15 15 0 0 1-26 8"></path>
        <path class=${`${p}-ink`} d="M172 96v8h-8M148 136v-8h8"></path>
      </g>`,
  },
  restricted: {
    palette: {
      mark: ["#fde2df", "#5a2724"],
      markEdge: ["#f0a197", "#c96a60"],
      ink: ["#a8231a", "#fbd2cd"],
      glow: ["rgba(240, 112, 102, 0.2)", "rgba(240, 112, 102, 0.1)"],
    },
    moving: ["mark", "glow"],
    motion: (p, v) => /* css */ `
.${p}-mark { transform-box: fill-box; transform-origin: center; animation: ${p}-settle var(${v("beat")}) var(--tc-ease-standard) 3; }`,
    draw: (p) => svg`
      ${glow(p)}
      ${back(p)}
      ${front(p)}
      <g class=${`${p}-mark`}>
        <circle class=${`${p}-badge`} cx="160" cy="116" r="26"></circle>
        <path class=${`${p}-ink`} d="M160 101l12 4v9c0 8-5 14-12 17-7-3-12-9-12-17v-9Z"></path>
        <path class=${`${p}-ink`} d="M160 110v8M160 123v0.5"></path>
      </g>`,
  },
};

/**
 * The CSS for a folder element: `statuses` lists the scenes it can draw. With several, each status's colours and motion
 * apply under its own [status]. `name` names the custom properties (`--tc-<name>-mark` …); `ui` is the class prefix.
 */
export function folderCss(o: { ui: string; name: string; statuses: FolderStatusKind[] }) {
  const { ui, name, statuses } = o;
  const p = `ui-${ui}`;
  const v = (k: string) => `--tc-${name}-${k}`;
  const one = statuses.length === 1;
  const colours = (s: FolderStatusKind) => {
    const c = SCENES[s].palette;
    return `${v("mark")}: light-dark(${c.mark[0]}, ${c.mark[1]});
  ${v("mark-edge")}: light-dark(${c.markEdge[0]}, ${c.markEdge[1]});
  ${v("ink")}: light-dark(${c.ink[0]}, ${c.ink[1]});
  ${v("glow")}: light-dark(${c.glow[0]}, ${c.glow[1]});`;
  };
  const scope = (s: FolderStatusKind, rules: string) => (one ? rules : rules.replace(/^\.(?=ui-)/gm, `[data-ui="${ui}"][status="${s}"] .`));
  const moving = [...new Set(statuses.flatMap((s) => SCENES[s].moving))].map((c) => `.${p}-${c}`).join(", ");
  return /* css */ `
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

[data-ui="${ui}"] {
  ${v("front")}: light-dark(#ffffff, #2a2a2e);
  ${v("back")}: light-dark(#eef1f5, #35373d);
  ${v("inside")}: light-dark(#e6e9ee, #44464d);
  ${v("edge")}: light-dark(#e4e7ec, rgba(255, 255, 255, 0.1));
  ${colours(statuses[0])}
  ${v("soft")}: 12px;
  ${v("beat")}: 3s;
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  font-family: var(--tc-font-sans);
}
${one ? "" : statuses.slice(1).map((s) => `[data-ui="${ui}"][status="${s}"] {\n  ${colours(s)}\n}`).join("\n")}
.${p}-art { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
.${p}-back { fill: var(${v("back")}); stroke: var(${v("edge")}); }
.${p}-front { fill: var(${v("front")}); stroke: var(${v("edge")}); }
.${p}-inside { fill: var(${v("inside")}); }
.${p}-badge { fill: var(${v("mark")}); stroke: var(${v("mark-edge")}); stroke-width: 4; }
.${p}-ink { fill: none; stroke: var(${v("ink")}); stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; }
.${p}-glow { fill: var(${v("glow")}); filter: blur(var(${v("soft")})); animation: ${p}-breathe var(${v("beat")}) var(--tc-ease-standard) 3; }
.${p}-caption { position: absolute; right: 0; bottom: 0; left: 0; margin: 0; color: var(--tc-text-primary); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); text-align: center; }
${statuses.map((s) => scope(s, SCENES[s].motion(p, v).trim())).join("\n")}
@keyframes ${p}-open { 0%, 100% { transform: skewX(0) scaleY(1); } 45% { transform: skewX(-4deg) scaleY(0.94); } }
@keyframes ${p}-settle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
@keyframes ${p}-drop { 0%, 100% { transform: translateY(0); } 40% { transform: translateY(4px); } }
@keyframes ${p}-turn { from { transform: rotate(0); } to { transform: rotate(360deg); } }
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
 * A folder scene that says where a folder stands – empty, shared, archived or locked.
 * @tag tc-folder-status
 */
export class TcFolderStatus extends TcElement {
  static override ui = "fds";
  static override looks = false;
  static override css = folderCss({ ui: "fds", name: "folder-status", statuses: ["empty", "shared", "archived", "locked", "syncing", "restricted"] });

  /** Where the folder stands: "empty", "shared", "syncing", "archived", "locked" or "restricted" */
  @property({ reflect: true }) accessor status: FolderStatusKind = "empty";
  /** The words under the drawing; unset, the status's own words; "" leaves them out */
  @property() accessor caption: string | undefined = undefined;
  /** Accessible description, when it should say more than the words */
  @property() accessor label = "";

  /** @internal */
  private readonly screen = new OnScreenController(this);

  /** The scene drawn: `status`, or empty for one it doesn't know */
  protected get current(): FolderStatusKind {
    return SCENES[this.status] ? this.status : "empty";
  }

  /** The words shown and used as the name */
  protected get words(): string {
    return this.caption ?? folderStatusWords[this.current];
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
    return html`<svg class=${`${p}-art`} viewBox="0 0 320 240" aria-hidden="true">${SCENES[this.current].draw(p)}</svg>
      ${this.words ? html`<p class=${`${p}-caption`}>${this.words}</p>` : nothing}`;
  }
}

if (!customElements.get("tc-folder-status")) customElements.define("tc-folder-status", TcFolderStatus);

declare global {
  interface HTMLElementTagNameMap {
    "tc-folder-status": TcFolderStatus;
  }
}
