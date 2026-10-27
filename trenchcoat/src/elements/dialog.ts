import { html, nothing, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { settingsCss } from "./internal/settings";
let next = 0;
/** How the built-in Close button shows: "auto" is primary on its own and secondary beside app actions. */
export type DialogCloseButton = "auto" | "primary" | "secondary" | "hidden";
/** Native modal dialog with content, focus containment, Escape and focus restoration.
 * The body and the actions are the app's: the dialog's own control styles don't reach into them, so a hosted
 * tc-button or progress tracker renders as it does anywhere else.
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
[data-ui="dialog"] .tc-dialog-body > :first-child { margin-top: 0; }
[data-ui="dialog"] .tc-dialog-body > :last-child { margin-bottom: 0; }
[data-ui="dialog"] .tc-dialog-footer { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
[data-ui="dialog"] .tc-dialog-actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: var(--tc-space-2); }
[data-ui="dialog"] .tc-dialog-actions:empty { display: none; }
[data-ui="dialog"] .tc-dialog-footer:has(> .tc-dialog-actions:only-child:empty) { display: none; }
[data-ui="dialog"] > :not(dialog) { display: none; }
`;
  /** Whether the modal is open. */
  @property({ type: Boolean, reflect: true }) accessor open = false;
  /** Visible heading and accessible name. */
  @property() accessor label = "Dialog";
  /** Plain-text content; use content for a renderable template or element. */
  @property() accessor text = "";
  /** A line under the heading that says what the dialog is for; it becomes the dialog's accessible description. */
  @property() accessor description = "";
  /** Body template or DOM node; the element renders it inside the modal. */
  @property({ attribute: false }) accessor content: unknown = undefined;
  /** The app's actions for the footer (a template or DOM node, e.g. tc-buttons); they sit after the Close button. */
  @property({ attribute: false }) accessor actions: unknown = undefined;
  /** The built-in Close button: "auto" (primary alone, secondary beside actions), "primary", "secondary" or "hidden". Escape still closes when hidden. */
  @property({ attribute: "close-button" }) accessor closeButton: DialogCloseButton = "auto";
  /** The built-in button's text, e.g. "Cancel" beside a primary action. */
  @property({ attribute: "close-label" }) accessor closeLabel = "Close";
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
    const hasActions = this.actions != null && this.actions !== "";
    const close =
      this.closeButton === "auto"
        ? hasActions
          ? "secondary"
          : "primary"
        : this.closeButton;
    return html`<dialog
      aria-labelledby=${`${this.uid}-label`}
      aria-describedby=${this.description ? `${this.uid}-desc` : nothing}
      @cancel=${(e: Event) => {
        e.preventDefault();
        this.setOpen(false);
      }}
      @close=${() => {
        if (this.open) this.setOpen(false);
      }}
    >
      <div class="tc-settings tc-settings-card">
        <header>
          <h3 id=${`${this.uid}-label`}>${this.label}</h3>
          ${this.description
            ? html`<p id=${`${this.uid}-desc`}>${this.description}</p>`
            : nothing}
        </header>
        <div class="tc-dialog-body tc-settings-host">
          ${this.content ?? this.text}
        </div>
        <div class="tc-dialog-footer">
          ${close === "hidden"
            ? nothing
            : html`<button
                type="button"
                data-variant=${close}
                @click=${() => this.setOpen(false)}
              >
                ${this.closeLabel}
              </button>`}<div class="tc-dialog-actions tc-settings-host">${hasActions ? this.actions : nothing}</div>
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
