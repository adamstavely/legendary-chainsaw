import { nothing, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";

/*
 * <tc-collapse> – content that glides open and shut. It animates to the content's real height with no measuring, so it
 * keeps up when the content changes, and closed content can't be reached by keyboard or screen readers. With reduced
 * motion it opens and shuts at once. It's only the motion: the button that controls it
 * belongs to the page, with aria-expanded and aria-controls.
 *
 *   <tc-collapse open><p>The rest of it.</p></tc-collapse>
 */

/**
 * Content that glides open and shut, to its real height.
 * @tag tc-collapse
 */
export class TcCollapse extends TcElement {
  static override ui = "cps";
  static override looks = false;

  /** Whether the content shows */
  @property({ type: Boolean, reflect: true }) accessor open = false;

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    // inert keeps shut content out of tab order and the accessibility tree
    this.toggleAttribute("inert", !this.open);
  }

  protected override render() {
    return nothing;
  }

  static override css = /* css */ `
[data-ui="cps"] {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--tc-duration-slow) var(--tc-ease-move), visibility var(--tc-duration-slow);
  visibility: hidden;
}
[data-ui="cps"][open] { grid-template-rows: 1fr; visibility: visible; }
[data-ui="cps"] > * { min-height: 0; overflow: hidden; }
@media (prefers-reduced-motion: reduce) {
  [data-ui="cps"] { transition: none; }
}
`;
}

if (!customElements.get("tc-collapse")) customElements.define("tc-collapse", TcCollapse);

declare global {
  interface HTMLElementTagNameMap {
    "tc-collapse": TcCollapse;
  }
}
