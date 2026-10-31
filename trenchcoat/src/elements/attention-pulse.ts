import { nothing, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";

/*
 * <tc-attention-pulse> – draws the eye once. Wrap what's new, such as a notice, and change `pulse-key`: a soft ring
 * passes around it a single time and is gone. It never loops, and it never fires when first shown, so nothing pulses
 * just because a page loaded. With reduced motion the ring holds briefly instead of moving. It's only a visual cue, so
 * announce anything important in words.
 *
 *   <tc-attention-pulse pulse-key=${notice.id}><p>1 person isn't authorized.</p></tc-attention-pulse>
 */

/**
 * Draws the eye once, with a soft ring that passes around the content.
 * @tag tc-attention-pulse
 */
export class TcAttentionPulse extends TcElement {
  static override ui = "atp";
  static override looks = false;

  /** Change this to pulse once */
  @property({ attribute: "pulse-key" }) accessor pulseKey: string | number | undefined = undefined;

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (changed.has("pulseKey") && changed.get("pulseKey") !== undefined && this.pulseKey !== undefined) {
      this.removeAttribute("data-pulsing");
      // Reading a size restarts the animation when it's asked for again mid-way
      void this.offsetWidth;
      this.setAttribute("data-pulsing", "");
    }
  }

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener("animationend", this.onEnd);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("animationend", this.onEnd);
  }

  private onEnd = (e: AnimationEvent) => {
    if (e.target === this) this.removeAttribute("data-pulsing");
  };

  protected override render() {
    return nothing;
  }

  static override css = /* css */ `
[data-ui="atp"] {
  --tc-attention-pulse-color: var(--tc-focus-ring);
  --tc-attention-pulse-radius: var(--tc-control-radius-md);
  --tc-attention-pulse-reach: var(--tc-space-2);
  display: block;
  border-radius: var(--tc-attention-pulse-radius);
}
[data-ui="atp"][data-pulsing] { animation: ui-atp-ring var(--tc-duration-reveal) var(--tc-ease-move) 1; }
@keyframes ui-atp-ring {
  from { box-shadow: 0 0 0 0 var(--tc-attention-pulse-color); }
  to { box-shadow: 0 0 0 var(--tc-attention-pulse-reach) transparent; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="atp"][data-pulsing] { animation: ui-atp-hold var(--tc-duration-reveal) steps(1) 1; }
}
@keyframes ui-atp-hold {
  from { box-shadow: 0 0 0 2px var(--tc-attention-pulse-color); }
  to { box-shadow: none; }
}
@media (forced-colors: active) {
  [data-ui="atp"][data-pulsing] { outline: 2px solid Highlight; }
}
`;
}

if (!customElements.get("tc-attention-pulse")) customElements.define("tc-attention-pulse", TcAttentionPulse);

declare global {
  interface HTMLElementTagNameMap {
    "tc-attention-pulse": TcAttentionPulse;
  }
}
