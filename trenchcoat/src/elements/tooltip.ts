import { html } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { settingsCss } from "./internal/settings";
let next = 0;
/** Text help available by pointer, focus and touch.
 * @tag tc-tooltip
 */
export class TcTooltip extends TcElement {
  static override ui = "tooltip";
  static override css =
    settingsCss +
    `
[data-ui="tooltip"] { display: inline-block; }
[data-ui="tooltip"] > .tc-settings > button { width: var(--tc-control-h-md); padding: 0; }
[data-ui="tooltip"] > .tc-settings { position: relative; display: inline-flex; }
[data-ui="tooltip"] [role="tooltip"] { position: absolute; z-index: var(--tc-z-dropdown); bottom: calc(100% + var(--tc-space-2)); left: 0; width: max-content; max-width: min(280px, 80vw); padding: var(--tc-tooltip-py) var(--tc-tooltip-px); border-radius: var(--tc-tooltip-radius); background: var(--tc-tooltip-bg); color: var(--tc-tooltip-fg); box-shadow: var(--tc-shadow-overlay); font-size: var(--tc-tooltip-font-size); }
`;
  /** Accessible name of the help trigger. */
  @property() accessor label = "More information";
  /** Plain-text help content. */
  @property() accessor text = "";
  @state() private accessor open = false;
  private readonly tipId = `tc-tip-${++next}`;
  protected override render() {
    return html`<span
      class="tc-settings tc-settings-control"
      @pointerenter=${() => (this.open = true)}
      @pointerleave=${() => {
        if (!this.contains(document.activeElement)) this.open = false;
      }}
      @focusout=${(e: FocusEvent) => {
        if (!this.contains(e.relatedTarget as Node | null)) this.open = false;
      }}
      @keydown=${(e: KeyboardEvent) => {
        if (e.key === "Escape") this.open = false;
      }}
      ><button
        type="button"
        data-variant="ghost"
        aria-label=${this.label}
        aria-describedby=${this.tipId}
        @focus=${() => (this.open = true)}
        @click=${() => (this.open = true)}
      >
        ?</button
      ><span id=${this.tipId} role="tooltip" ?hidden=${!this.open}
        >${this.text}</span
      ></span
    >`;
  }
}
if (!customElements.get("tc-tooltip"))
  customElements.define("tc-tooltip", TcTooltip);
declare global {
  interface HTMLElementTagNameMap {
    "tc-tooltip": TcTooltip;
  }
}
