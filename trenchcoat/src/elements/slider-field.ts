import { html } from "lit";
import { property } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { TcSettingsElement, settingsCss } from "./internal/settings";

/**
 * Slider field for AI product settings.
 * @tag tc-slider-field
 * @fires tc-value-change - Proposed value (detail: { value }); cancelable to keep application control.
 */
export class TcSliderField extends TcSettingsElement<number | null> {
  static override ui = "slider-field";
  static override css = settingsCss;
  constructor() {
    super(0);
    this.label = "Slider Field";
  }
  /** Smallest accepted number. */
  @property({ type: Number }) accessor min = 0;
  /** Largest accepted number. */
  @property({ type: Number }) accessor max = 100;
  /** Increment used by the native controls. */
  @property({ type: Number }) accessor step = 1;
  protected override validate() {
    // Empty is only an error when required, which the base class reports.
    if (this.value === null) return "";
    if (
      !Number.isFinite(this.value) ||
      this.value < this.min ||
      this.value > this.max
    )
      return `Enter a number from ${this.min} to ${this.max}.`;
    const steps = (this.value - this.min) / this.step;
    return this.step > 0 && Math.abs(steps - Math.round(steps)) > 0.000001
      ? `Use increments of ${this.step}.`
      : "";
  }
  private input(e: Event) {
    const input = e.target as HTMLInputElement;
    // A cleared box empties the value rather than keeping the last number; a half-typed one ("-", "1e") is badInput.
    if (input.value === "" && !input.validity.badInput) this.commit(null);
    else if (input.validity.valid && Number.isFinite(input.valueAsNumber))
      this.commit(input.valueAsNumber);
  }
  protected override render() {
    return html`<div class="tc-settings tc-settings-control">
      <fieldset ?disabled=${this.blocked}>
        <label class="tc-settings-field"
          ><span>${this.label}</span
          ><input
            type="number"
            .value=${live(this.value === null ? "" : String(this.value))}
            min=${this.min}
            max=${this.max}
            step=${this.step}
            ?required=${this.required}
            @input=${this.input}
            aria-describedby=${`${this.uid}-description`}
        /></label>
        <input
          type="range"
          aria-label=${this.label}
          .value=${live(this.value === null ? "" : String(this.value))}
          min=${this.min}
          max=${this.max}
          step=${this.step}
          @input=${this.input}
        />
        <p ?hidden=${!this.description} id=${`${this.uid}-description`}>
          ${this.description}
        </p>
      </fieldset>
    </div>`;
  }
}
if (!customElements.get("tc-slider-field"))
  customElements.define("tc-slider-field", TcSliderField);
declare global {
  interface HTMLElementTagNameMap {
    "tc-slider-field": TcSliderField;
  }
}
