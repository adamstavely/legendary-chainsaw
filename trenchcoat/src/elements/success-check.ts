import { html, svg, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";

/*
 * <tc-success-check> – a small tick that draws itself once, for "shared" or "saved". It draws when it first appears and
 * whenever `play-key` changes, then rests; it never loops. With reduced motion the tick is simply there.
 *
 *   <tc-success-check label="Saved"></tc-success-check>
 *
 * Decorative by default: put the words beside it. With `label`, it's an image named by the label. It sizes to the
 * surrounding text, or to `--tc-success-check-size`, and takes its colour from `--tc-success-check-color`.
 */

/**
 * A small tick that draws itself once.
 * @tag tc-success-check
 */
export class TcSuccessCheck extends TcElement {
  static override ui = "sck";
  static override looks = false;

  /** Accessible description – when set, it's announced as an image; otherwise it's decorative */
  @property() accessor label = "";
  /** Change this to draw it again */
  @property({ attribute: "play-key" }) accessor playKey: string | number | undefined = undefined;

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
    if (changed.has("playKey") && changed.get("playKey") !== undefined) {
      for (const animation of this.getAnimations({ subtree: true })) {
        animation.cancel();
        animation.play();
      }
    }
  }

  protected override render() {
    return html`<svg class="ui-sck-art" viewBox="0 0 24 24" aria-hidden="true">${svg`
      <circle class="ui-sck-ring" cx="12" cy="12" r="10" pathLength="1"></circle>
      <path class="ui-sck-tick" d="m7.5 12.5 3 3 6-6.5" pathLength="1"></path>`}</svg>`;
  }

  static override css = /* css */ `
[data-ui="sck"] {
  --tc-success-check-size: 1.25em;
  --tc-success-check-color: var(--tc-status-success-fg);
  display: inline-block;
  flex: none;
  width: var(--tc-success-check-size);
  height: var(--tc-success-check-size);
  vertical-align: -0.25em;
  color: var(--tc-success-check-color);
}
.ui-sck-art { display: block; width: 100%; height: 100%; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ui-sck-ring, .ui-sck-tick { stroke-dasharray: 1; stroke-dashoffset: 0; animation: ui-sck-draw var(--tc-duration-slow) var(--tc-ease-move) both; }
.ui-sck-tick { animation-delay: var(--tc-duration-moderate); }
@keyframes ui-sck-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@media (prefers-reduced-motion: reduce) {
  .ui-sck-ring, .ui-sck-tick { animation: none; }
}
@media (forced-colors: active) {
  .ui-sck-art { stroke: CanvasText; }
}
`;
}

if (!customElements.get("tc-success-check")) customElements.define("tc-success-check", TcSuccessCheck);

declare global {
  interface HTMLElementTagNameMap {
    "tc-success-check": TcSuccessCheck;
  }
}
