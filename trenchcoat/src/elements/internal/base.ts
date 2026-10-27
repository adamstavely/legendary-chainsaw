import { consume } from "@lit/context";
import { LitElement, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { lookContext, type Look } from "./look";
import { cardHeadCss } from "./card-head";
import { kitCss } from "./kit";
import { adoptStyles } from "./styles";
import { clearForwardedAria } from "./controllers";

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
  /** Single-look pieces (illustrations, motion) set this false: no data-look on the host, so the page's tokens reach
   *  the caller's content as they did around the React versions */
  static looks = true;

  /** Visual style: "standard" or "clean"; unset follows <tc-look-provider>, else "standard" */
  @property({ reflect: true })
  accessor look: Look | undefined = undefined;

  /** @internal The look from the nearest <tc-look-provider> */
  @consume({ context: lookContext, subscribe: true })
  accessor contextLook: Look | undefined = undefined;

  /** @internal The look in use: `look`, else the provider's, else "standard" */
  get resolvedLook(): Look {
    return this.look ?? this.contextLook ?? "standard";
  }

  protected override createRenderRoot() {
    // Lit's range otherwise runs to the end of the host, and a template that changes shape clears the children a
    // framework appended after the first render. An end marker keeps them outside it: Lit renders up to the marker,
    // later children go after it.
    if (!this.renderOptions.renderBefore) {
      const end = document.createComment("tc-end");
      this.append(end);
      this.renderOptions.renderBefore = end;
    }
    return this;
  }

  override connectedCallback() {
    const type = this.constructor as typeof TcElement;
    // Custom elements are inline by default; the React roots were block elements (div, section) – an element's own
    // CSS overrides this zero-specificity default (Button is inline-flex)
    adoptStyles("tc-base", ":where([data-ui]) { display: block; }", this.ownerDocument);
    adoptStyles("tc-head", cardHeadCss, this.ownerDocument);
    adoptStyles("tc-kit", kitCss, this.ownerDocument);
    adoptStyles(`ui-${type.ui}`, type.css, this.ownerDocument);
    this.dataset.ui = type.ui;
    super.connectedCallback();
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (!(this.constructor as typeof TcElement).looks) delete this.dataset.look;
    else if (this.dataset.look !== this.resolvedLook) this.dataset.look = this.resolvedLook;
  }

  override removeAttribute(name: string) {
    clearForwardedAria(this, name);
    super.removeAttribute(name);
  }

  override removeAttributeNS(namespace: string | null, name: string) {
    if (namespace === null || namespace === "") clearForwardedAria(this, name);
    super.removeAttributeNS(namespace, name);
  }

  override toggleAttribute(name: string, force?: boolean) {
    if (force === false) clearForwardedAria(this, name);
    return super.toggleAttribute(name, force);
  }

  /** Dispatches a bubbling, composed event; returns false when a listener called preventDefault() */
  protected emit<T>(name: string, detail: T, options: { cancelable?: boolean } = {}) {
    return this.dispatchEvent(new CustomEvent<T>(name, { detail, bubbles: true, composed: true, cancelable: options.cancelable ?? false }));
  }
}
