import { html } from "lit";
import { property } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { TcSettingsElement, settingsCss } from "./internal/settings";

export type SettingsRadioOption = {
  value: string;
  label: string;
  disabled?: boolean;
};
/**
 * Radio group for AI product settings.
 * @tag tc-radio-group
 * @fires tc-value-change - Proposed value (detail: { value }); cancelable to keep application control.
 */
export class TcRadioGroup extends TcSettingsElement<string> {
  static override ui = "radio-group";
  static override css = settingsCss;
  constructor() {
    super("");
    this.label = "Radio Group";
  }
  /** Choices with stable values and visible labels. */
  @property({ attribute: false }) accessor options: SettingsRadioOption[] = [];
  protected override validate() {
    return (this.required || this.value) &&
      !this.options.some((o) => o.value === this.value && !o.disabled)
      ? "Choose an available option."
      : "";
  }
  protected override render() {
    return html`<div class="tc-settings tc-settings-control">
      <fieldset ?disabled=${this.blocked}>
        <legend>${this.label}</legend>
        ${this.options.map(
          (o) =>
            html`<label class="tc-settings-row"
              ><input
                type="radio"
                form=${`${this.uid}-native`}
                name=${this.uid}
                value=${o.value}
                .checked=${live(this.value === o.value)}
                ?disabled=${!!o.disabled}
                ?required=${this.required}
                @change=${() => this.commit(o.value)}
              />${o.label}</label
            >`,
        )}
        <p>${this.description}</p>
      </fieldset>
    </div>`;
  }
}
if (!customElements.get("tc-radio-group"))
  customElements.define("tc-radio-group", TcRadioGroup);
declare global {
  interface HTMLElementTagNameMap {
    "tc-radio-group": TcRadioGroup;
  }
}
