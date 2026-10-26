import { createContext, provide } from "@lit/context";
import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";

/** The two looks every component ships in */
export type Look = "standard" | "clean";

/** The app-wide default look, set with <tc-look-provider look="clean"> (decision L6); an element's own `look` wins */
export const lookContext = createContext<Look | undefined>(Symbol("tc-look"));

/**
 * Sets the default look for every Trenchcoat element inside it. Renders nothing of its own (display: contents).
 *   <tc-look-provider look="clean"> … </tc-look-provider>
 * @tag tc-look-provider
 */
export class TcLookProvider extends LitElement {
  /** The look every Trenchcoat element inside takes unless it sets its own: "standard" or "clean" */
  @provide({ context: lookContext })
  @property({ reflect: true })
  accessor look: Look | undefined = undefined;

  protected override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.style.display = "contents";
  }

  protected override render() {
    return html``;
  }
}

if (!customElements.get("tc-look-provider")) customElements.define("tc-look-provider", TcLookProvider);

declare global {
  interface HTMLElementTagNameMap {
    "tc-look-provider": TcLookProvider;
  }
}
