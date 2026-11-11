import { html, nothing, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";

/*
 * <tc-stack-spread> – an overlapping row that fans apart: the reviewers on a case as initials, a pile of file chips,
 * a few tags. Put the items inside it; they overlap, the first on top. Hovering, or moving focus in, spreads them so
 * each can be seen, and each lifts a little as the pointer passes. Past `max` the rest become a "+N" count, which the
 * spread shows as a count only. With reduced motion nothing fans: the items sit apart with a small gap.
 *
 *   <tc-stack-spread label="Reviewers" max="4">
 *     <span title="Ama Owusu" role="img" aria-label="Ama Owusu">AO</span> …
 *   </tc-stack-spread>
 *
 * The items keep their own names and look; the element only places them. The row is a labelled group. When no item
 * takes focus, the group takes one tab stop so keyboard users can spread it too; Escape gathers it again. Spreading
 * moves the items towards the end of the line without moving anything around it, so leave room after it.
 */

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * An overlapping stack – avatars, file chips, tags – that fans apart on hover or focus, with "+N" past `max`.
 * @tag tc-stack-spread
 */
export class TcStackSpread extends TcElement {
  static override ui = "sspr";
  static override looks = false;

  /** How many items show; the rest become a "+N" count */
  @property({ type: Number }) accessor max = 5;
  /** The group's name, such as "Reviewers" */
  @property() accessor label = "Items";
  /** Keep it spread, whatever the pointer and focus do */
  @property({ type: Boolean, reflect: true }) accessor spread = false;

  /** How many items are past `max` */
  @state() private accessor over = 0;
  /** Spread by hover or focus */
  @state() private accessor active = false;

  private mutations?: MutationObserver;
  private hovered = false;
  private held = false;
  /** The tab stop is ours, set because no item takes focus */
  private ownStop = false;

  /** The items: every child but the element's own count */
  get items(): HTMLElement[] {
    return [...this.children].filter((c): c is HTMLElement => c instanceof HTMLElement && !c.classList.contains("ui-sspr__more"));
  }

  private onEnter = () => {
    this.hovered = true;
    if (!this.held) this.active = true;
  };
  private onLeave = () => {
    this.hovered = false;
    this.held = false;
    if (!this.contains(document.activeElement)) this.active = false;
  };
  private onFocusIn = () => {
    if (!this.held) this.active = true;
  };
  private onFocusOut = (e: FocusEvent) => {
    if (e.relatedTarget instanceof Node && this.contains(e.relatedTarget)) return;
    this.held = false;
    if (!this.hovered) this.active = false;
  };
  private onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Escape" || !this.active) return;
    this.held = true;
    this.active = false;
  };

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener("pointerenter", this.onEnter);
    this.addEventListener("pointerleave", this.onLeave);
    this.addEventListener("focusin", this.onFocusIn);
    this.addEventListener("focusout", this.onFocusOut);
    this.addEventListener("keydown", this.onKeyDown);
    this.mutations = new MutationObserver(() => this.place());
    this.mutations.observe(this, { childList: true });
    this.place();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("pointerenter", this.onEnter);
    this.removeEventListener("pointerleave", this.onLeave);
    this.removeEventListener("focusin", this.onFocusIn);
    this.removeEventListener("focusout", this.onFocusOut);
    this.removeEventListener("keydown", this.onKeyDown);
    this.mutations?.disconnect();
  }

  protected override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    this.setAttribute("role", "group");
    if (changed.has("label")) this.setAttribute("aria-label", this.label);
    this.toggleAttribute("data-active", this.active);
    if (changed.has("max")) this.place();
  }

  /** Numbers each item for the CSS, hides the ones past max, and gives the group a tab stop when nothing else has one */
  private place() {
    const items = this.items;
    const max = Math.max(0, Math.floor(this.max));
    items.forEach((item, i) => {
      item.setAttribute("data-sspr-item", "");
      item.style.setProperty("--tc-sspr-i", String(Math.min(i, max)));
      item.toggleAttribute("data-sspr-over", i >= max);
      // The count can sit before the items in the DOM, so the first item is marked rather than found with ~
      item.toggleAttribute("data-sspr-first", i === 0);
    });
    const shown = Math.min(items.length, max);
    this.style.setProperty("--tc-sspr-n", String(shown + 1));
    this.over = Math.max(0, items.length - max);
    const focusable = items.slice(0, max).some((c) => c.matches(FOCUSABLE) || !!c.querySelector(FOCUSABLE));
    if (!focusable && (this.ownStop || !this.hasAttribute("tabindex"))) {
      this.setAttribute("tabindex", "0");
      this.ownStop = true;
    } else if (focusable && this.ownStop) {
      this.removeAttribute("tabindex");
      this.ownStop = false;
    }
  }

  protected override render() {
    if (!this.over) return nothing;
    return html`<span class="ui-sspr__more" style="--tc-sspr-i: ${Math.max(0, Math.floor(this.max))}">+${this.over}<span class="tc-sr-only"> more</span></span>`;
  }

  static override css = /* css */ `
[data-ui="sspr"] {
  --tc-sspr-overlap: var(--tc-space-2-5);
  --tc-sspr-gap: var(--tc-space-1);
  --tc-sspr-lift: var(--tc-space-0-5);
  --tc-sspr-dir: 1;
  --tc-sspr-n: 1;
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
  border-radius: var(--tc-radius-full);
}
[data-ui="sspr"]:dir(rtl) { --tc-sspr-dir: -1; }
[data-ui="sspr"]:focus-visible {
  outline: var(--tc-focus-ring-width) solid var(--tc-focus-ring);
  outline-offset: var(--tc-focus-ring-offset);
}
[data-ui="sspr"] > [data-sspr-item], [data-ui="sspr"] > .ui-sspr__more {
  --tc-sspr-ly: 0px;
  position: relative;
  flex: none;
  z-index: calc(var(--tc-sspr-n) - var(--tc-sspr-i));
  translate: 0 var(--tc-sspr-ly);
  transition: translate var(--tc-duration-moderate) var(--tc-ease-move);
}
[data-ui="sspr"] > :is([data-sspr-item]:not([data-sspr-first]), .ui-sspr__more) {
  margin-inline-start: calc(var(--tc-sspr-overlap) * -1);
}
/* An item's own inline display mustn't bring one past max back */
[data-ui="sspr"] > [data-sspr-over] { display: none !important; }
/* Gathered, the overlapping items aren't targets of their own: the pointer reaches the group, which fans them first */
[data-ui="sspr"]:not([spread], [data-active]) > [data-sspr-item] { pointer-events: none; }
/* Spread: each moves along by what it overlapped plus a gap, so they sit side by side */
[data-ui="sspr"]:is([spread], [data-active]) > :is([data-sspr-item], .ui-sspr__more) {
  translate: calc(var(--tc-sspr-i) * (var(--tc-sspr-overlap) + var(--tc-sspr-gap)) * var(--tc-sspr-dir)) var(--tc-sspr-ly);
}
[data-ui="sspr"]:is([spread], [data-active]) > [data-sspr-item]:is(:hover, :focus-within) {
  --tc-sspr-ly: calc(var(--tc-sspr-lift) * -1);
  z-index: var(--tc-sspr-n);
}
.ui-sspr__more {
  order: 1;
  display: inline-grid;
  place-items: center;
  min-width: var(--tc-control-h-sm);
  height: var(--tc-control-h-sm);
  padding: 0 var(--tc-space-1-5);
  box-sizing: border-box;
  border-radius: var(--tc-radius-full);
  background: var(--tc-surface-well);
  box-shadow: 0 0 0 var(--tc-space-0-5) var(--tc-surface-raised);
  color: var(--tc-text-secondary);
  font: var(--tc-font-weight-medium) var(--tc-font-size-xs) / 1 var(--tc-font-sans);
}
/* Reduced motion: nothing fans – the items sit apart with a small gap */
@media (prefers-reduced-motion: reduce) {
  [data-ui="sspr"] > :is([data-sspr-item], .ui-sspr__more),
  [data-ui="sspr"]:is([spread], [data-active]) > :is([data-sspr-item], .ui-sspr__more) { translate: none; transition: none; }
  [data-ui="sspr"] > :is([data-sspr-item]:not([data-sspr-first]), .ui-sspr__more) {
    margin-inline-start: var(--tc-sspr-gap);
  }
}
@media (forced-colors: active) {
  .ui-sspr__more { border: 1px solid CanvasText; }
}
`;
}

if (!customElements.get("tc-stack-spread")) customElements.define("tc-stack-spread", TcStackSpread);

declare global {
  interface HTMLElementTagNameMap {
    "tc-stack-spread": TcStackSpread;
  }
}
