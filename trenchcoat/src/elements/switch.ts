import { html, nothing } from "lit";
import { property } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { TcSettingsElement, settingsCss } from "./internal/settings";

/*
 * <tc-switch> – on or off for something that applies right away. A label and an optional second line, with the switch
 * at the start (default) or, with `placement="end"`, at the far end of a full-width settings row, the words on the
 * left. The thumb stretches a little while it's pressed – not under reduced motion.
 *
 *   <tc-switch label="Email digest" description="Once a day, at 8:00" placement="end"></tc-switch>
 */

export type SwitchPlacement = "start" | "end";

/**
 * On or off for things that apply right away – label and second line, at the start or across a settings row.
 * @tag tc-switch
 * @fires tc-value-change - Proposed value (detail: { value }); cancelable to keep application control.
 */
export class TcSwitch extends TcSettingsElement<boolean> {
  static override ui = "switch";
  static override css = settingsCss + /* css */ `
[data-ui="switch"] { --tc-switch-stretch: var(--tc-space-1); }
[data-ui="switch"] .ui-switch__row { display: flex; flex-wrap: nowrap; align-items: flex-start; gap: var(--tc-space-2); min-height: var(--tc-space-6); cursor: pointer; }
[data-ui="switch"] .ui-switch__row > input { margin: calc((var(--tc-space-6) - var(--tc-switch-h)) / 2) 0 0; }
[data-ui="switch"] .ui-switch__text { display: grid; gap: var(--tc-space-0-5); min-width: 0; padding-top: var(--tc-space-0-5); }
[data-ui="switch"] .ui-switch__label { color: var(--tc-text-primary); overflow-wrap: anywhere; }
[data-ui="switch"] .ui-switch__description { color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
[data-ui="switch"][placement="end"] { display: block; width: 100%; }
[data-ui="switch"][placement="end"] .ui-switch__row { justify-content: space-between; gap: var(--tc-space-4); }
[data-ui="switch"][placement="end"] .ui-switch__row > input { order: 2; }
[data-ui="switch"] > .tc-settings input[type="checkbox"]:active::before { width: calc(var(--tc-switch-knob) + var(--tc-switch-stretch)); transition: transform var(--tc-duration-moderate) var(--tc-ease-move), width var(--tc-duration-fast) var(--tc-ease-standard); }
[data-ui="switch"] > .tc-settings input[type="checkbox"]:checked:active::before { transform: translateX(calc(var(--tc-switch-w) - var(--tc-switch-h) - var(--tc-switch-stretch))); }
@media (prefers-reduced-motion: reduce) {
  [data-ui="switch"] > .tc-settings input[type="checkbox"]:active::before { width: var(--tc-switch-knob); }
  [data-ui="switch"] > .tc-settings input[type="checkbox"]:checked:active::before { transform: translateX(calc(var(--tc-switch-w) - var(--tc-switch-h))); }
}
`;
  /** "start" (default): the switch before its label; "end": the label on the left and the switch at the row's far end */
  @property({ reflect: true }) accessor placement: SwitchPlacement = "start";

  constructor() {
    super(false);
    this.label = "Switch";
  }
  protected override render() {
    return html`<div class="tc-settings tc-settings-control">
      <label class="tc-settings-row ui-switch__row"
        ><input
          type="checkbox"
          role="switch"
          .checked=${live(this.value)}
          ?disabled=${this.blocked}
          ?required=${this.required}
          aria-labelledby=${`${this.uid}-label`}
          aria-describedby=${this.description ? `${this.uid}-description` : nothing}
          @change=${(e: Event) =>
            this.commit((e.target as HTMLInputElement).checked)}
        /><span class="ui-switch__text"
          ><span class="ui-switch__label" id=${`${this.uid}-label`}>${this.label}</span>${this.description
            ? html`<span class="ui-switch__description" id=${`${this.uid}-description`}>${this.description}</span>`
            : nothing}</span
        ></label
      >
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
