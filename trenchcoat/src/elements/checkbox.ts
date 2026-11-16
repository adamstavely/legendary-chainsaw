import { html, nothing, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { TcSettingsElement, settingsCss } from "./internal/settings";

/*
 * <tc-checkbox> – a yes / no choice saved with a form. A label and an optional second line; `indeterminate` shows a
 * dash for a Select all over a list that's only partly picked (clicking it checks it); `variant="card"` turns it into
 * a bordered row you can click anywhere on; `error-message` (or a failed required check) shows an error under it. The
 * check draws itself when it's ticked – not under reduced motion.
 *
 *   <tc-checkbox label="Select all" description="12 of 30 picked" indeterminate></tc-checkbox>
 */

export type CheckboxVariant = "default" | "card";

/**
 * A yes / no choice saved with a form – label and second line, a partly-checked state, a card row and an error line.
 * @tag tc-checkbox
 * @fires tc-value-change - Proposed value (detail: { value }); cancelable to keep application control.
 */
export class TcCheckbox extends TcSettingsElement<boolean> {
  static override ui = "checkbox";
  static override css = settingsCss + /* css */ `
[data-ui="checkbox"] { --tc-checkbox-tick: 12px; }
[data-ui="checkbox"] .ui-checkbox__row { display: flex; flex-wrap: nowrap; align-items: flex-start; gap: var(--tc-space-2); min-height: var(--tc-space-6); cursor: pointer; }
[data-ui="checkbox"] .ui-checkbox__box { position: relative; display: inline-grid; flex: none; place-items: center; }
[data-ui="checkbox"] .ui-checkbox__box > input { margin: var(--tc-space-1) 0; }
[data-ui="checkbox"] .ui-checkbox__box > input::before { content: none !important; }
[data-ui="checkbox"] .ui-checkbox__box > input:indeterminate { background: var(--tc-surface-inverse); border-color: var(--tc-surface-inverse); }
[data-look="clean"] > .tc-settings .ui-checkbox__box > input:indeterminate { background: var(--tc-accent); border-color: var(--tc-accent); }
[data-ui="checkbox"] .ui-checkbox__tick { position: absolute; inset: 0; width: var(--tc-checkbox-tick); height: var(--tc-checkbox-tick); margin: auto; fill: none; stroke: var(--tc-text-on-inverse); stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; pointer-events: none; }
[data-look="clean"] > .tc-settings .ui-checkbox__tick { stroke: var(--tc-text-on-accent); }
[data-ui="checkbox"] .ui-checkbox__check { stroke-dasharray: 1; stroke-dashoffset: 1; }
[data-ui="checkbox"] .ui-checkbox__dash { opacity: 0; }
[data-ui="checkbox"] input:checked:not(:indeterminate) ~ .ui-checkbox__tick .ui-checkbox__check { stroke-dashoffset: 0; transition: stroke-dashoffset var(--tc-duration-moderate) var(--tc-ease-move); }
[data-ui="checkbox"] input:indeterminate ~ .ui-checkbox__tick .ui-checkbox__dash { opacity: 1; }
[data-ui="checkbox"] .ui-checkbox__text { display: grid; gap: var(--tc-space-0-5); min-width: 0; padding-top: var(--tc-space-0-5); }
[data-ui="checkbox"] .ui-checkbox__label { color: var(--tc-text-primary); overflow-wrap: anywhere; }
[data-ui="checkbox"] .ui-checkbox__description { color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
[data-ui="checkbox"] .ui-checkbox__error { color: var(--tc-status-danger-fg); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
[data-ui="checkbox"][variant="card"] .ui-checkbox__row { padding: var(--tc-space-3); border-radius: var(--tc-radius-lg); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); background: var(--tc-surface-raised); transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard); }
[data-ui="checkbox"][variant="card"] .ui-checkbox__row:hover { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-strong); }
[data-ui="checkbox"][variant="card"] .ui-checkbox__row:has(input:checked), [data-ui="checkbox"][variant="card"] .ui-checkbox__row:has(input:indeterminate) { background: var(--tc-accent-subtle); box-shadow: inset 0 0 0 1px var(--tc-border-selected); }
[data-ui="checkbox"][variant="card"] .ui-checkbox__row:has(input:focus-visible) { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="checkbox"][variant="card"] .ui-checkbox__row input:focus-visible { outline: none; }
[data-ui="checkbox"][data-invalid] .ui-checkbox__box > input { border-color: var(--tc-status-danger-solid); }
[data-ui="checkbox"][data-invalid][variant="card"] .ui-checkbox__row { box-shadow: inset 0 0 0 1px var(--tc-status-danger-solid); }
@media (prefers-reduced-motion: reduce) { [data-ui="checkbox"] .ui-checkbox__check, [data-ui="checkbox"] .ui-checkbox__row { transition: none !important; } }
@media (forced-colors: active) { [data-ui="checkbox"] .ui-checkbox__tick { stroke: CanvasText; } }
`;
  /** Partly checked: a dash for a Select all over a list that's only partly picked; clicking it checks it */
  @property({ type: Boolean, reflect: true }) accessor indeterminate = false;
  /** "default" (a box and its label) or "card" (a bordered row, clickable anywhere) */
  @property({ reflect: true }) accessor variant: CheckboxVariant = "default";
  /** An error shown under the checkbox, e.g. "Accept the terms to go on"; empty shows none */
  @property({ attribute: "error-message" }) accessor errorMessage = "";

  constructor() {
    super(false);
    this.label = "Checkbox";
  }

  private onChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const was = this.indeterminate;
    // Clicking a partly checked box checks it
    const accepted = this.commit(was ? true : input.checked);
    if (accepted) this.indeterminate = false;
    else input.indeterminate = was;
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    this.toggleAttribute("data-invalid", !!(this.errorMessage || this.message));
  }

  protected override render() {
    const error = this.errorMessage || this.message;
    const described = [this.description ? `${this.uid}-description` : "", error ? `${this.uid}-error` : ""].filter(Boolean).join(" ");
    return html`<div class="tc-settings tc-settings-control">
      <label class="tc-settings-row ui-checkbox__row"
        ><span class="ui-checkbox__box"
          ><input
            type="checkbox"
            .checked=${live(this.value)}
            .indeterminate=${live(this.indeterminate)}
            ?disabled=${this.blocked}
            ?required=${this.required}
            aria-invalid=${error ? "true" : "false"}
            aria-labelledby=${`${this.uid}-label`}
            aria-describedby=${described || nothing}
            @change=${this.onChange}
          /><svg class="ui-checkbox__tick" viewBox="0 0 12 12" aria-hidden="true"
            ><path class="ui-checkbox__check" pathLength="1" d="M2.5 6.2 5 8.6l4.6-5"></path
            ><path class="ui-checkbox__dash" d="M3 6h6"></path></svg></span
        ><span class="ui-checkbox__text"
          ><span class="ui-checkbox__label" id=${`${this.uid}-label`}>${this.label}</span>${this.description
            ? html`<span class="ui-checkbox__description" id=${`${this.uid}-description`}>${this.description}</span>`
            : nothing}</span
        ></label
      >
      ${error ? html`<p class="ui-checkbox__error" id=${`${this.uid}-error`}>${error}</p>` : nothing}
    </div>`;
  }
}
if (!customElements.get("tc-checkbox"))
  customElements.define("tc-checkbox", TcCheckbox);
declare global {
  interface HTMLElementTagNameMap {
    "tc-checkbox": TcCheckbox;
  }
}
