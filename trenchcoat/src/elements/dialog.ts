import { html, nothing, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { ModalController } from "./internal/modal";
import { settingsCss } from "./internal/settings";
let next = 0;
/** How the built-in Close button shows: "auto" is primary on its own and secondary beside app actions. */
export type DialogCloseButton = "auto" | "primary" | "secondary" | "hidden";
/** How wide the panel may grow: sm 480px, md 640px (the default), lg 880px, xl 1120px – never past 90% of the window */
export type DialogSize = "sm" | "md" | "lg" | "xl";
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
/* The panel's widest, per size – a page can override these on tc-dialog */
[data-ui="dialog"] { --tc-dialog-w-sm: 480px; --tc-dialog-w-md: 640px; --tc-dialog-w-lg: 880px; --tc-dialog-w-xl: 1120px; --tc-dialog-w: var(--tc-dialog-w-md); }
[data-ui="dialog"][size="sm"] { --tc-dialog-w: var(--tc-dialog-w-sm); }
[data-ui="dialog"][size="lg"] { --tc-dialog-w: var(--tc-dialog-w-lg); }
[data-ui="dialog"][size="xl"] { --tc-dialog-w: var(--tc-dialog-w-xl); }
/* sm and md fit their content up to the size; lg and xl take the whole width, for reports and tables */
[data-ui="dialog"] > dialog { max-width: min(var(--tc-dialog-w), 90vw); max-height: 85vh; padding: 0; border: 0; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); color: var(--tc-text-primary); box-shadow: var(--tc-shadow-overlay); }
[data-ui="dialog"]:is([size="lg"], [size="xl"]) > dialog { width: min(var(--tc-dialog-w), 90vw); }
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
  /** How wide the panel may grow: "sm" (480px), "md" (640px, the default), "lg" (880px) or "xl" (1120px), within 90% of the window. lg and xl always take that width. */
  @property({ reflect: true }) accessor size: DialogSize = "md";
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
  // Top layer, inert page, focus return and closing on disconnect (shared with tc-terms-dialog)
  private readonly modal = new ModalController(this, {
    dialog: () => this.querySelector("dialog"),
  });
  private setOpen(open: boolean) {
    if (this.emit("tc-open-change", { open }, { cancelable: true }))
      this.open = open;
  }
  protected override updated(_changed: PropertyValues) {
    this.modal.sync(this.open);
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
        if (!this.modal.ownClose() && this.open) this.setOpen(false);
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
