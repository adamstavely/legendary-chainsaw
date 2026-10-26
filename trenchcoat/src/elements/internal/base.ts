import { consume } from "@lit/context";
import { LitElement, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { lookContext, type Look } from "./look";
import { adoptStyles } from "./styles";

/*
 * The base of every Trenchcoat element (audit/lit-port-plan.md, decisions L4 and L6):
 *   · light DOM – the element renders into itself, so ARIA id links reach the page and the existing ui-* CSS applies;
 *   · the host is the component's root: it carries data-ui="<name>" (what its CSS is keyed on – a framework rewriting
 *     `class` can't remove it) and data-look, the resolved look;
 *   · `look` comes from the attribute, else the nearest <tc-look-provider>, else "standard";
 *   · the element type's CSS is adopted into the document once.
 * Children a framework renders into the element stay where the framework put them – an element never moves them
 * (React and Vue remove children from the parent they inserted them into). It renders its own parts alongside them
 * and positions everything with CSS.
 */
export abstract class TcElement extends LitElement {
  /** The name after ui-: data-ui="button" for the button's root */
  static ui = "";
  /** The element type's CSS, keyed on [data-ui="<name>"] */
  static css = "";

  /** Visual style: "standard" or "clean"; unset follows <tc-look-provider>, else "standard" */
  @property({ reflect: true })
  accessor look: Look | undefined = undefined;

  @consume({ context: lookContext, subscribe: true })
  accessor contextLook: Look | undefined = undefined;

  get resolvedLook(): Look {
    return this.look ?? this.contextLook ?? "standard";
  }

  protected override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    const type = this.constructor as typeof TcElement;
    adoptStyles(`ui-${type.ui}`, type.css, this.ownerDocument);
    this.dataset.ui = type.ui;
    super.connectedCallback();
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (this.dataset.look !== this.resolvedLook) this.dataset.look = this.resolvedLook;
  }

  /** Dispatches a bubbling, composed event; returns false when a listener called preventDefault() */
  protected emit<T>(name: string, detail: T, options: { cancelable?: boolean } = {}) {
    return this.dispatchEvent(new CustomEvent<T>(name, { detail, bubbles: true, composed: true, cancelable: options.cancelable ?? false }));
  }
}
