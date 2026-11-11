import { html, nothing, svg, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";

/*
 * <tc-error-shake> – wraps a field or a form and shakes it once when it turns invalid: its content does a short,
 * damped shake from side to side, the wrapped control's outline pulses in the error colour and stays, and the message
 * slides in below it and is announced (the message is the only alert). Change `shake-key` (or call `shake()`) to shake
 * again, for a second wrong submit. It never shakes on first render – a field that loads invalid just shows the
 * outline and the message. With reduced motion nothing moves: the outline and the message still appear.
 *
 *   <tc-error-shake ?invalid=${bad} message="Enter a case number, like FR-2041">
 *     <label>Case number <input name="case" /></label>
 *   </tc-error-shake>
 *
 * While invalid, native inputs, textareas and selects inside get aria-invalid and point at the message with
 * aria-describedby; both are taken back when it's valid again. Other controls can opt in to the outline with
 * `data-error-shake-field`.
 */

let uid = 0;
const FIELDS = "input:not([type='hidden']), textarea, select";

/**
 * Wraps a field and shakes it once, with an error outline and message, when it turns invalid.
 * @tag tc-error-shake
 */
export class TcErrorShake extends TcElement {
  static override ui = "esk";
  static override looks = false;

  /** Shows the error: the outline and the message; turning it on shakes the content once */
  @property({ type: Boolean, reflect: true }) accessor invalid = false;
  /** The error message under the content, announced when it appears */
  @property() accessor message = "";
  /** Change this while invalid to shake again */
  @property({ attribute: "shake-key" }) accessor shakeKey: string | number | undefined = undefined;

  private readonly messageId = `tc-esk-${++uid}`;
  /** Fields this element marked, with the describedby it found, to put back */
  private marked = new Map<Element, string | null>();

  /** Shakes the content once (and pulses the outline when invalid) */
  shake() {
    this.removeAttribute("data-shaking");
    // Reading a size restarts the shake when it's asked for again mid-way
    void this.offsetWidth;
    this.setAttribute("data-shaking", "");
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (changed.has("invalid") && changed.get("invalid") === false && this.invalid) this.shake();
    else if (changed.has("shakeKey") && changed.get("shakeKey") !== undefined && this.invalid) this.shake();
    // A message that comes or goes changes what the fields point at
    if (changed.has("message")) this.unmark();
    this.mark();
  }

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener("animationend", this.onEnd);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("animationend", this.onEnd);
    this.unmark();
  }

  private onEnd = (e: AnimationEvent) => {
    if (e.animationName === "ui-esk-shake") this.removeAttribute("data-shaking");
  };

  /** aria-invalid and the message's id on the fields inside, while invalid */
  private mark() {
    if (!this.invalid) return this.unmark();
    const showing = !!this.message;
    for (const field of this.querySelectorAll(FIELDS)) {
      if (this.marked.has(field)) continue;
      const before = field.getAttribute("aria-describedby");
      this.marked.set(field, before);
      field.setAttribute("aria-invalid", "true");
      if (showing) field.setAttribute("aria-describedby", before ? `${before} ${this.messageId}` : this.messageId);
    }
  }

  private unmark() {
    for (const [field, before] of this.marked) {
      field.removeAttribute("aria-invalid");
      if (before === null) field.removeAttribute("aria-describedby");
      else field.setAttribute("aria-describedby", before);
    }
    this.marked.clear();
  }

  protected override render() {
    if (!this.invalid || !this.message) return nothing;
    // Lucide circle-alert (ISC)
    return html`<p class="ui-esk__message" id=${this.messageId} role="alert">
      <svg class="ui-esk__icon" viewBox="0 0 24 24" aria-hidden="true">${svg`<circle cx="12" cy="12" r="10"></circle><path d="M12 8v4M12 16h.01"></path>`}</svg>
      <span>${this.message}</span>
    </p>`;
  }

  static override css = /* css */ `
[data-ui="esk"] {
  --tc-error-shake-color: var(--tc-status-danger-solid);
  --tc-error-shake-text: var(--tc-status-danger-fg);
  --tc-error-shake-distance: 6px;
  --tc-error-shake-ring: 3px;
  display: block;
}
[data-ui="esk"][invalid] :is(${FIELDS}, [data-error-shake-field]) {
  border-color: var(--tc-error-shake-color);
  box-shadow: 0 0 0 1px var(--tc-error-shake-color);
}
[data-ui="esk"][invalid][data-shaking] :is(${FIELDS}, [data-error-shake-field]) {
  animation: ui-esk-ring var(--tc-duration-reveal) var(--tc-ease-out) 1;
}
[data-ui="esk"][data-shaking] > :not(.ui-esk__message) {
  animation: ui-esk-shake var(--tc-duration-slowest) linear 1;
}
@keyframes ui-esk-shake {
  0%, 100% { translate: 0; }
  12% { translate: calc(var(--tc-error-shake-distance) * -1); }
  28% { translate: var(--tc-error-shake-distance); }
  44% { translate: calc(var(--tc-error-shake-distance) * -0.6); }
  60% { translate: calc(var(--tc-error-shake-distance) * 0.4); }
  76% { translate: calc(var(--tc-error-shake-distance) * -0.2); }
}
@keyframes ui-esk-ring {
  from { box-shadow: 0 0 0 1px var(--tc-error-shake-color), 0 0 0 var(--tc-error-shake-ring) var(--tc-status-danger-bg); }
  to { box-shadow: 0 0 0 1px var(--tc-error-shake-color), 0 0 0 0 var(--tc-status-danger-bg); }
}
.ui-esk__message {
  display: flex;
  align-items: flex-start;
  gap: var(--tc-space-1-5);
  margin: var(--tc-space-1-5) 0 0;
  color: var(--tc-error-shake-text);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-normal);
  animation: ui-esk-in var(--tc-duration-moderate) var(--tc-ease-out) 1;
}
.ui-esk__icon { flex: none; width: 1.1em; height: 1.1em; margin-block-start: 0.15em; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
@keyframes ui-esk-in { from { opacity: 0; translate: 0 calc(var(--tc-space-1) * -1); } }
@media (prefers-reduced-motion: reduce) {
  [data-ui="esk"][data-shaking] > :not(.ui-esk__message),
  [data-ui="esk"][invalid][data-shaking] :is(${FIELDS}, [data-error-shake-field]),
  .ui-esk__message { animation: none; }
}
@media (forced-colors: active) {
  [data-ui="esk"][invalid] :is(${FIELDS}, [data-error-shake-field]) { outline: 2px solid Mark; }
  .ui-esk__icon { stroke: CanvasText; }
}
`;
}

if (!customElements.get("tc-error-shake")) customElements.define("tc-error-shake", TcErrorShake);

declare global {
  interface HTMLElementTagNameMap {
    "tc-error-shake": TcErrorShake;
  }
}
