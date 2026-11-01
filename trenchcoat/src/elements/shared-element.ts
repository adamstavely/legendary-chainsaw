import { nothing, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";

/*
 * <tc-shared-element> – a piece of content grows into its detail view, so people keep their place. Mark one child
 * data-shared="summary" and one data-shared="detail"; anything marked data-shared-toggle inside either opens and closes
 * it. The detail grows out of the summary's box and shrinks back into it. Focus moves into the detail on opening and
 * back to the summary on closing, and Escape closes. With reduced motion it simply switches.
 *
 *   <tc-shared-element>
 *     <button data-shared="summary" data-shared-toggle>Trial 12</button>
 *     <div data-shared="detail"><button data-shared-toggle>Close</button> The whole report</div>
 *   </tc-shared-element>
 */

export type SharedElementOpenChange = { open: boolean };

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const FALLBACK_DURATION = 320;
const reduced = () => !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * A piece of content that grows into its detail view.
 * @tag tc-shared-element
 * @fires tc-open-change - The detail is opening or closing ({ open }: SharedElementOpenChange); cancelable – prevented, `open` stays as it was
 */
export class TcSharedElement extends TcElement {
  static override ui = "sel";
  static override looks = false;

  /** Whether the detail shows. Changed by the user unless a tc-open-change listener calls preventDefault() */
  @property({ type: Boolean, reflect: true }) accessor open = false;

  private from: DOMRect | null = null;
  private children_?: MutationObserver;

  private region(name: "summary" | "detail") {
    return this.querySelector<HTMLElement>(`:scope > [data-shared="${name}"]`);
  }

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener("click", this.onClick);
    this.addEventListener("keydown", this.onKey);
    // A framework can add the parts after the element connects
    this.children_ = new MutationObserver(() => this.sync());
    this.children_.observe(this, { childList: true });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("click", this.onClick);
    this.removeEventListener("keydown", this.onKey);
    this.children_?.disconnect();
  }

  /** Opens or closes it, as a toggle would */
  toggle(next = !this.open) {
    if (next === this.open) return;
    if (this.emit<SharedElementOpenChange>("tc-open-change", { open: next }, { cancelable: true })) this.open = next;
  }

  private onClick = (e: MouseEvent) => {
    if ((e.target as Element).closest("[data-shared-toggle]")) this.toggle();
  };

  private onKey = (e: KeyboardEvent) => {
    if (e.key !== "Escape" || !this.open || e.defaultPrevented) return;
    e.preventDefault();
    this.toggle(false);
  };

  private sync() {
    this.region("summary")?.toggleAttribute("hidden", this.open);
    this.region("detail")?.toggleAttribute("hidden", !this.open);
    for (const t of this.querySelectorAll("[data-shared-toggle]")) t.setAttribute("aria-expanded", this.open ? "true" : "false");
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // The box to grow from: whichever part is showing now
    if (this.hasUpdated && changed.has("open")) this.from = (this.open ? this.region("summary") : this.region("detail"))?.getBoundingClientRect() ?? null;
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    this.sync();
    if (!changed.has("open") || changed.get("open") === undefined) return;
    this.play();
    this.moveFocus();
  }

  private play() {
    const from = this.from;
    this.from = null;
    const shown = this.open ? this.region("detail") : this.region("summary");
    if (!from || !shown || reduced()) return;
    const to = shown.getBoundingClientRect();
    if (!to.width || !to.height) return;
    const style = getComputedStyle(this);
    const token = Number.parseFloat(style.getPropertyValue("--tc-duration-slow"));
    const x = from.left - to.left;
    const y = from.top - to.top;
    shown.animate(
      [
        { transformOrigin: "top left", transform: `translate(${x}px, ${y}px) scale(${from.width / to.width}, ${from.height / to.height})`, opacity: 0.4 },
        { transformOrigin: "top left", transform: "none", opacity: 1 },
      ],
      { duration: Number.isFinite(token) ? token : FALLBACK_DURATION, easing: style.getPropertyValue("--tc-ease-move").trim() || "ease-out" },
    );
  }

  private moveFocus() {
    const part = this.open ? this.region("detail") : this.region("summary");
    if (!part) return;
    const target = part.matches(FOCUSABLE) ? part : (part.querySelector<HTMLElement>(FOCUSABLE) ?? part);
    if (target === part && !part.matches(FOCUSABLE)) part.tabIndex = -1;
    target.focus({ preventScroll: true });
  }

  protected override render() {
    return nothing;
  }

  static override css = /* css */ `
/* Whichever side is hidden stays hidden, even if the page styles it with a display of its own */
[data-ui="sel"] [data-shared][hidden] { display: none !important; }
[data-ui="sel"] { display: block; }
[data-ui="sel"] > [hidden] { display: none; }
`;
}

if (!customElements.get("tc-shared-element")) customElements.define("tc-shared-element", TcSharedElement);

declare global {
  interface HTMLElementTagNameMap {
    "tc-shared-element": TcSharedElement;
  }
}
