import { html, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { settingsCss } from "./internal/settings";
let next = 0;
/** Native modal dialog with content, focus containment, Escape and focus restoration.
 * @tag tc-dialog
 * @fires tc-open-change - Proposed open state (detail: { open }); cancelable.
 */
export class TcDialog extends TcElement {
  static override ui = "dialog";
  static override css =
    settingsCss +
    `
[data-ui="dialog"] > dialog { max-width: min(640px, 90vw); max-height: 85vh; padding: 0; border: 0; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); color: var(--tc-text-primary); box-shadow: var(--tc-shadow-overlay); }
[data-ui="dialog"] > dialog::backdrop { background: var(--tc-scrim); }
[data-ui="dialog"] .tc-dialog-body { padding: var(--tc-space-4); }
[data-ui="dialog"] .tc-dialog-footer { display: flex; justify-content: flex-end; padding: var(--tc-space-3) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
[data-ui="dialog"] > :not(dialog) { display: none; }
`;
  /** Whether the modal is open. */
  @property({ type: Boolean, reflect: true }) accessor open = false;
  /** Visible heading and accessible name. */
  @property() accessor label = "Dialog";
  /** Plain-text content; use content for a renderable template or element. */
  @property() accessor text = "";
  /** Body template or DOM node; the element renders it inside the modal. */
  @property({ attribute: false }) accessor content: unknown = undefined;
  private readonly uid = `tc-dialog-${++next}`;
  private previous: HTMLElement | null = null;
  private setOpen(open: boolean) {
    if (this.emit("tc-open-change", { open }, { cancelable: true }))
      this.open = open;
  }
  protected override updated(_changed: PropertyValues) {
    const dialog = this.querySelector("dialog");
    if (!dialog || !this.isConnected) return;
    if (this.open && !dialog.open) {
      this.previous = document.activeElement as HTMLElement;
      dialog.showModal();
    } else if (!this.open && dialog.open) {
      dialog.close();
      this.previous?.focus();
    }
  }
  override disconnectedCallback() {
    super.disconnectedCallback();
    this.querySelector("dialog")?.close?.();
    this.previous?.focus();
  }
  protected override render() {
    return html`<dialog
      aria-labelledby=${`${this.uid}-label`}
      @cancel=${(e: Event) => {
        e.preventDefault();
        this.setOpen(false);
      }}
      @close=${() => {
        if (this.open) this.setOpen(false);
      }}
    >
      <div class="tc-settings tc-settings-card">
        <header><h3 id=${`${this.uid}-label`}>${this.label}</h3></header>
        <div class="tc-dialog-body">${this.content ?? this.text}</div>
        <div class="tc-dialog-footer">
          <button
            type="button"
            data-variant="primary"
            @click=${() => this.setOpen(false)}
          >
            Close
          </button>
        </div>
      </div>
    </dialog>`;
  }
}
if (!customElements.get("tc-dialog"))
  customElements.define("tc-dialog", TcDialog);
declare global {
  interface HTMLElementTagNameMap {
    "tc-dialog": TcDialog;
  }
}
