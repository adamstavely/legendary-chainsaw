import { html, svg, nothing, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import "./agent-face";
import type { AgentFaceState } from "./agent-face";

/*
 * <tc-agent-scene> – the assistant in a small scene, for the states a page rests in. "all-clear": happy above an empty
 * tray, and it waves once. "working": thinking beside a stack of pages. "offline": asleep, with a sign that says so. The
 * face is tc-agent-face, so it follows reduced motion and rests when nothing's happening.
 *
 *   <tc-agent-scene scene="all-clear"></tc-agent-scene>
 *
 * Decorative by default: put the words beside it. With `label`, it's an image named by the label.
 */

export type AgentScene = "all-clear" | "working" | "offline";

const FACE: Record<AgentScene, AgentFaceState> = { "all-clear": "happy", working: "thinking", offline: "sleeping" };
const TRAY = svg`<path class="ui-ags-line" d="M92 168h40l10 16h36l10-16h40v28a8 8 0 0 1-8 8H100a8 8 0 0 1-8-8Z"></path>`;
const PAGES = svg`<rect class="ui-ags-page" x="216" y="96" width="60" height="78" rx="6" transform="rotate(6 246 135)"></rect><rect class="ui-ags-page" x="212" y="100" width="60" height="78" rx="6"></rect><rect class="ui-ags-bar" x="222" y="114" width="40" height="5" rx="2.5"></rect><rect class="ui-ags-bar" x="222" y="126" width="30" height="5" rx="2.5"></rect>`;
const SIGN = svg`<path class="ui-ags-line" d="M238 150v38"></path><rect class="ui-ags-page" x="208" y="118" width="60" height="32" rx="6"></rect><path class="ui-ags-line" d="m228 128 20 12m0-12-20 12"></path>`;

/**
 * The assistant in a small scene, for all clear, working and offline.
 * @tag tc-agent-scene
 */
export class TcAgentScene extends TcElement {
  static override ui = "ags";
  static override looks = false;

  /** Which scene: "all-clear", "working" or "offline" */
  @property({ reflect: true }) accessor scene: AgentScene = "all-clear";
  /** The assistant's name */
  @property() accessor name = "Donovan";
  /** Accessible description – when set, the scene is announced as an image; otherwise it is decorative */
  @property() accessor label = "";
  /** The face's size in pixels */
  @property({ type: Number }) accessor size = 96;

  private waveTimer = 0;

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.clearTimeout(this.waveTimer);
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (this.label) {
      this.setAttribute("role", "img");
      this.setAttribute("aria-label", this.label);
      this.removeAttribute("aria-hidden");
    } else {
      if (this.getAttribute("role") === "img") this.removeAttribute("role");
      this.removeAttribute("aria-label");
      this.setAttribute("aria-hidden", "true");
    }
    if (changed.has("scene") && this.scene === "all-clear") {
      window.clearTimeout(this.waveTimer);
      // After the face has settled into its happy state
      this.waveTimer = window.setTimeout(() => this.querySelector("tc-agent-face")?.playGesture("wave"), 500);
    }
  }

  protected override render() {
    const scene = FACE[this.scene] ? this.scene : "all-clear";
    return html`<svg class="ui-ags-art" viewBox="0 0 320 240" aria-hidden="true">${scene === "all-clear" ? TRAY : scene === "working" ? PAGES : scene === "offline" ? SIGN : nothing}</svg>
      <tc-agent-face class="ui-ags-face" .state=${FACE[scene]} .size=${this.size} .name=${this.name}></tc-agent-face>`;
  }

  static override css = /* css */ `
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }
[data-ui="ags"] {
  --tc-agent-scene-line: light-dark(#c3cad4, #5c6068);
  --tc-agent-scene-page: light-dark(#ffffff, #2a2a2e);
  --tc-agent-scene-bar: light-dark(#e6e9ee, #44464d);
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 3 / 2;
  overflow: hidden;
}
.ui-ags-art { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
.ui-ags-line { fill: none; stroke: var(--tc-agent-scene-line); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
.ui-ags-page { fill: var(--tc-agent-scene-page); stroke: var(--tc-agent-scene-line); stroke-width: 1.5; }
.ui-ags-bar { fill: var(--tc-agent-scene-bar); }
.ui-ags-face { position: absolute; top: 46%; left: 50%; transform: translate(-50%, -50%); }
[data-ui="ags"][scene="working"] .ui-ags-face, [data-ui="ags"][scene="offline"] .ui-ags-face { left: 40%; }
`;
}

if (!customElements.get("tc-agent-scene")) customElements.define("tc-agent-scene", TcAgentScene);

declare global {
  interface HTMLElementTagNameMap {
    "tc-agent-scene": TcAgentScene;
  }
}
