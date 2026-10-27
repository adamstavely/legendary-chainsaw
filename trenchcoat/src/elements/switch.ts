import { html } from "lit";

import { live } from "lit/directives/live.js";
import { TcSettingsElement, settingsCss } from "./internal/settings";

/**
 * Switch for AI product settings.
 * @tag tc-switch
 * @fires tc-value-change - Proposed value (detail: { value }); cancelable to keep application control.
 */
export class TcSwitch extends TcSettingsElement<boolean> {
  static override ui = "switch";
  static override css = settingsCss;
  constructor() {
    super(false);
    this.label = "Switch";
  }
  protected override render() {
    return html`<div class="tc-settings tc-settings-control">
      <label class="tc-settings-row"
        ><input
          type="checkbox"
          role="switch"
          .checked=${live(this.value)}
          ?disabled=${this.blocked}
          ?required=${this.required}
          aria-describedby=${`${this.uid}-description`}
          @change=${(e: Event) =>
            this.commit((e.target as HTMLInputElement).checked)}
        /><span>${this.label}</span></label
      >
      <p ?hidden=${!this.description} id=${`${this.uid}-description`}>
        ${this.description}
      </p>
    </div>`;
  }
}
if (!customElements.get("tc-switch"))
  customElements.define("tc-switch", TcSwitch);
declare global {
  interface HTMLElementTagNameMap {
    "tc-switch": TcSwitch;
  }
}
