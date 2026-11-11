import { html, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";

/*
 * <tc-sliding-indicator> – a highlight that slides to whichever item is selected in the row (or column) of buttons or
 * links inside it: tabs, segmented options, a nav. It reads the page's own state – aria-selected="true",
 * aria-current, aria-checked="true" or data-selected – and follows it as it changes, and as the items resize or wrap.
 * It adds no semantics of its own: the page's tablist, radiogroup or nav keeps its roles and keys, and the highlight
 * is decoration (aria-hidden). `variant="underline"` draws a bar under the item (beside it when vertical);
 * `variant="pill"` fills the item's box behind its text. `hover-preview` adds a faint ghost that follows the pointer.
 * With reduced motion the highlight moves without sliding.
 *
 *   <tc-sliding-indicator variant="pill">
 *     <div role="tablist" aria-label="Finding">
 *       <button role="tab" aria-selected="true">Overview</button>
 *       <button role="tab" aria-selected="false">Evidence</button>
 *     </div>
 *   </tc-sliding-indicator>
 *
 * The positions are written straight to the highlight's style, so following the selection never re-renders the element.
 */

export type SlidingIndicatorVariant = "underline" | "pill";
export type SlidingIndicatorOrientation = "horizontal" | "vertical";

/** The page's items, when `items` isn't given */
export const defaultSlidingIndicatorItems = '[role="tab"], [role="option"], [role="radio"], [role="menuitemradio"], a[href], button';
const SELECTED = '[aria-selected="true"], [aria-current]:not([aria-current="false"]), [aria-checked="true"], [data-selected]:not([data-selected="false"])';
const WATCHED = ["aria-selected", "aria-current", "aria-checked", "data-selected", "hidden", "class", "style"];

type Box = { x: number; y: number; w: number; h: number };

/**
 * A highlight that slides to the selected item of the buttons or links inside it.
 * @tag tc-sliding-indicator
 */
export class TcSlidingIndicator extends TcElement {
  static override ui = "sind";
  static override looks = false;

  /** "underline" draws a bar under the selected item (beside it when vertical); "pill" fills its box behind the text */
  @property({ reflect: true }) accessor variant: SlidingIndicatorVariant = "underline";
  /** Which way the items run – a vertical underline sits at the items' start edge */
  @property({ reflect: true }) accessor orientation: SlidingIndicatorOrientation = "horizontal";
  /** A faint ghost follows the pointer over the items, sliding the same way */
  @property({ type: Boolean, attribute: "hover-preview", reflect: true }) accessor hoverPreview = false;
  /** A CSS selector for the items inside it; the default takes tabs, options, radios, links and buttons */
  @property() accessor items = defaultSlidingIndicatorItems;

  private mo?: MutationObserver;
  private ro?: ResizeObserver;
  private frame = 0;
  private hovered: HTMLElement | null = null;
  /** The items the ResizeObserver watches – re-observing them all would report each again and loop */
  private observed = new Set<Element>();
  /** The highlight has been placed once – it slides from then on, rather than flying in from the corner */
  private placed = false;

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener("pointerover", this.onOver);
    this.addEventListener("pointerleave", this.onLeave);
    // Its own highlight's style changes aren't the page's
    this.mo = new MutationObserver((records) => {
      if (records.some((r) => !(r.target as Element).closest?.(".ui-sind__layer") || r.type === "childList")) this.schedule();
    });
    this.mo.observe(this, { subtree: true, childList: true, attributes: true, attributeFilter: WATCHED });
    if (typeof ResizeObserver !== "undefined") this.ro = new ResizeObserver(this.schedule);
    this.ro?.observe(this);
    window.addEventListener("resize", this.schedule);
    void document.fonts?.ready.then(this.schedule);
    this.schedule();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("pointerover", this.onOver);
    this.removeEventListener("pointerleave", this.onLeave);
    window.removeEventListener("resize", this.schedule);
    this.mo?.disconnect();
    this.ro?.disconnect();
    this.mo = this.ro = undefined;
    this.observed.clear();
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.placed = false;
    this.removeAttribute("data-ready");
  }

  protected override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    this.schedule();
  }

  /** The page's items, in order (never the highlight itself) */
  private list(): HTMLElement[] {
    let found: HTMLElement[] = [];
    try {
      found = [...this.querySelectorAll<HTMLElement>(this.items || defaultSlidingIndicatorItems)];
    } catch {
      found = [...this.querySelectorAll<HTMLElement>(defaultSlidingIndicatorItems)];
    }
    return found.filter((el) => !el.closest(".ui-sind__layer") && el.getClientRects().length > 0);
  }

  /** The item that's selected now, if any */
  selectedItem(): HTMLElement | null {
    return this.list().find((el) => el.matches(SELECTED)) ?? null;
  }

  private onOver = (e: PointerEvent) => {
    if (!this.hoverPreview || e.pointerType === "touch") return;
    const item = this.list().find((el) => el.contains(e.target as Node)) ?? null;
    if (item === this.hovered) return;
    this.hovered = item;
    this.schedule();
  };

  private onLeave = () => {
    if (!this.hovered) return;
    this.hovered = null;
    this.schedule();
  };

  private schedule = () => {
    if (!this.frame && this.isConnected) this.frame = requestAnimationFrame(this.place);
  };

  /** Where an item sits in the element's own pixels */
  private box(item: HTMLElement): Box {
    const host = this.getBoundingClientRect();
    const r = item.getBoundingClientRect();
    return { x: r.left - host.left - this.clientLeft + this.scrollLeft, y: r.top - host.top - this.clientTop + this.scrollTop, w: r.width, h: r.height };
  }

  private put(el: HTMLElement | null, box: Box | null) {
    if (!el) return;
    el.toggleAttribute("data-shown", !!box);
    if (!box) return;
    el.style.transform = `translate(${box.x}px, ${box.y}px)`;
    el.style.width = `${box.w}px`;
    el.style.height = `${box.h}px`;
  }

  /** Places the highlight on the selected item and the ghost on the hovered one */
  place = () => {
    this.frame = 0;
    if (!this.isConnected) return;
    const selected = this.selectedItem();
    const bar = this.querySelector<HTMLElement>(":scope > .ui-sind__layer > .ui-sind__bar");
    const ghost = this.querySelector<HTMLElement>(":scope > .ui-sind__layer > .ui-sind__ghost");
    this.put(bar, selected ? this.box(selected) : null);
    const hovered = this.hovered?.isConnected && this.hoverPreview && this.hovered !== selected ? this.box(this.hovered) : null;
    this.put(ghost, hovered);
    if (this.ro) {
      const items = new Set<Element>(this.list());
      for (const el of this.observed) if (!items.has(el)) this.ro.unobserve(el);
      for (const el of items) if (!this.observed.has(el)) this.ro.observe(el);
      this.observed = items;
    }
    // The first placement jumps into position; later ones slide
    if (selected && !this.placed) {
      this.placed = true;
      requestAnimationFrame(() => this.toggleAttribute("data-ready", this.placed));
    }
  };

  protected override render() {
    return html`<span class="ui-sind__layer" aria-hidden="true"><span class="ui-sind__ghost"></span><span class="ui-sind__bar"></span></span>`;
  }

  static override css = /* css */ `
[data-ui="sind"] {
  --tc-sind-thickness: 2px;
  --tc-sind-underline: var(--tc-accent);
  --tc-sind-pill-bg: var(--tc-seg-thumb-bg);
  --tc-sind-pill-shadow: var(--tc-seg-thumb-shadow);
  --tc-sind-pill-radius: var(--tc-control-radius-sm);
  --tc-sind-ghost-bg: var(--tc-fill-subtle);
  --tc-sind-duration: var(--tc-duration-base);
  position: relative;
  display: block;
  isolation: isolate;
}
/* Behind the page's items, in the element's own stacking context */
[data-ui="sind"] > .ui-sind__layer {
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
}
[data-ui="sind"] .ui-sind__bar,
[data-ui="sind"] .ui-sind__ghost {
  position: absolute;
  top: 0;
  left: 0;
  box-sizing: border-box;
  opacity: 0;
  transform-origin: 0 0;
}
[data-ui="sind"] .ui-sind__bar[data-shown],
[data-ui="sind"] .ui-sind__ghost[data-shown] { opacity: 1; }
[data-ui="sind"][data-ready] .ui-sind__bar,
[data-ui="sind"][data-ready] .ui-sind__ghost {
  transition:
    transform var(--tc-sind-duration) var(--tc-ease-move),
    width var(--tc-sind-duration) var(--tc-ease-move),
    height var(--tc-sind-duration) var(--tc-ease-move),
    opacity var(--tc-duration-fast) var(--tc-ease-standard);
}
/* Underline: a bar along the item's bottom edge, or its start edge when the items run down the page */
[data-ui="sind"][variant="underline"] .ui-sind__bar { background: transparent; }
[data-ui="sind"][variant="underline"] .ui-sind__bar::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: var(--tc-sind-thickness);
  border-radius: var(--tc-sind-thickness);
  background: var(--tc-sind-underline);
}
[data-ui="sind"][variant="underline"][orientation="vertical"] .ui-sind__bar::after {
  top: 0;
  right: auto;
  width: var(--tc-sind-thickness);
  height: auto;
}
[data-ui="sind"][variant="pill"] .ui-sind__bar {
  border-radius: var(--tc-sind-pill-radius);
  background: var(--tc-sind-pill-bg);
  box-shadow: var(--tc-sind-pill-shadow);
}
[data-ui="sind"] .ui-sind__ghost {
  border-radius: var(--tc-sind-pill-radius);
  background: var(--tc-sind-ghost-bg);
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="sind"][data-ready] .ui-sind__bar,
  [data-ui="sind"][data-ready] .ui-sind__ghost { transition: opacity var(--tc-duration-fast) var(--tc-ease-standard); }
}
@media (forced-colors: active) {
  [data-ui="sind"][variant="underline"] .ui-sind__bar::after { background: Highlight; }
  [data-ui="sind"][variant="pill"] .ui-sind__bar { outline: 2px solid Highlight; outline-offset: -2px; }
  [data-ui="sind"] .ui-sind__ghost { outline: 1px dashed CanvasText; outline-offset: -1px; }
}
`;
}

if (!customElements.get("tc-sliding-indicator")) customElements.define("tc-sliding-indicator", TcSlidingIndicator);

declare global {
  interface HTMLElementTagNameMap {
    "tc-sliding-indicator": TcSlidingIndicator;
  }
}
