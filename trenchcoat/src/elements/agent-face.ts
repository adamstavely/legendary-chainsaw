import { html } from "lit";
import { property } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import "../vendor/agent-face/element";
import type { FaceGesture, FaceMotion, FaceState } from "../vendor/agent-face/engine";
import { TcElement } from "./internal/base";

/*
 * <tc-agent-face> – Donovan's face, showing what the agent is doing: idle, listening, thinking, speaking, happy,
 * confused, sleeping, error or surprised. Expressions blend on springs, and each state holds for a moment, so quick
 * changes don't flicker. A thin wrapper around <agent-face>. The engine and drawing live in ../agent-face and are copied to src/vendor by
 * scripts/sync-agent-face.mjs.
 * It stops drawing off screen and in hidden tabs, and rests when it isn't busy. Reduced motion cuts between still poses.
 *
 *   <tc-agent-face state="thinking" size="26"></tc-agent-face>
 *
 * The canvas inside is an image named for the state ("Donovan is thinking"). `announce` also tells screen readers when
 * the state changes.
 */

export type AgentFaceState = FaceState;
export type AgentFaceGesture = FaceGesture;
export type AgentFaceMotion = FaceMotion;

/**
 * Donovan's animated face, which shows what the agent is doing.
 * @tag tc-agent-face
 */
export class TcAgentFace extends TcElement {
  static override ui = "afc";
  static override looks = false;

  /** idle · listening · thinking · speaking · happy · confused · sleeping · error · surprised */
  @property() accessor state: AgentFaceState = "idle";
  /** Width and height in px, 16 to 256 */
  @property({ type: Number }) accessor size = 64;
  /** Who the screen-reader label names */
  @property() accessor name = "Donovan";
  /** Replaces the screen-reader label in every state */
  @property() accessor label: string | undefined = undefined;
  /** Screen-reader labels per state, for translation */
  @property({ attribute: false }) accessor labels: Partial<Record<AgentFaceState, string>> = {};
  /** Also tells screen readers when the state changes */
  @property({ type: Boolean }) accessor announce = false;
  /** full or reduced; unset, it follows the system setting */
  @property() accessor motion: AgentFaceMotion | undefined = undefined;
  /** How long, in ms, before the small movements fade out when Donovan isn't busy */
  @property({ type: Number, attribute: "rest-after" }) accessor restAfter: number | undefined = undefined;
  /** Makes the small movements repeatable */
  @property({ type: Number }) accessor seed: number | undefined = undefined;
  /** How loud the agent is, 0 to 1, to drive the mouth while speaking; unset, it makes up speech */
  @property({ type: Number }) accessor amplitude: number | null = null;

  static override css = /* css */ `
    [data-ui="afc"] { display: inline-flex; vertical-align: middle; }
  `;

  /** Plays wave, nod, hop or spin once. Returns false when reduced motion rules it out */
  playGesture(gesture: AgentFaceGesture): boolean {
    return this.querySelector("agent-face")?.playGesture(gesture) ?? false;
  }

  override render() {
    return html`<agent-face
      class="ui-afc__face"
      state=${this.state}
      size=${this.size}
      name=${this.name}
      label=${ifDefined(this.label)}
      motion=${ifDefined(this.motion)}
      rest-after=${ifDefined(this.restAfter)}
      seed=${ifDefined(this.seed)}
      ?announce=${this.announce}
      .labels=${this.labels}
      .amplitude=${this.amplitude}
    ></agent-face>`;
  }
}

if (!customElements.get("tc-agent-face")) customElements.define("tc-agent-face", TcAgentFace);
declare global {
  interface HTMLElementTagNameMap {
    "tc-agent-face": TcAgentFace;
  }
}
