import { html } from "lit";
import { state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { TcSettingsElement, settingsCss } from "./internal/settings";

/**
 * Secret field for AI product settings.
 * @tag tc-secret-field
 * @fires tc-value-change - Proposed value (detail: { value }); cancelable to keep application control.
 */
export class TcSecretField extends TcSettingsElement<string> {
  static override ui = "secret-field";
  static override css = settingsCss;
  constructor() {
    super("");
    this.label = "Secret Field";
  }
  @state() private accessor revealed = false;
  protected override render() {
    return html`<div class="tc-settings tc-settings-control">
      <fieldset ?disabled=${this.blocked}>
        <label class="tc-settings-field"
          ><span>${this.label}</span
          ><span class="tc-settings-secret"
            ><input
              type=${this.revealed ? "text" : "password"}
              autocomplete="off"
              .value=${live(this.value)}
              ?required=${this.required}
              aria-describedby=${`${this.uid}-description`}
              @input=${(e: Event) =>
                this.commit((e.target as HTMLInputElement).value)}
            /><button
              type="button"
              data-variant="ghost"
              aria-pressed=${this.revealed ? "true" : "false"}
              @click=${() => (this.revealed = !this.revealed)}
            >
              ${this.revealed ? "Hide" : "Show"} ${this.label || "secret"}
            </button></span
          ></label
        >
        <p ?hidden=${!this.description} id=${`${this.uid}-description`}>
          ${this.description}
        </p>
      </fieldset>
    </div>`;
  }
  override disconnectedCallback() {
    super.disconnectedCallback();
    this.revealed = false;
  }
}
if (!customElements.get("tc-secret-field"))
  customElements.define("tc-secret-field", TcSecretField);
declare global {
  interface HTMLElementTagNameMap {
    "tc-secret-field": TcSecretField;
  }
}
