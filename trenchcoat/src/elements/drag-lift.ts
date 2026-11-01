import { nothing } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";

/*
 * <tc-drag-lift> – picks its child up while it's dragged: it lifts, follows the pointer and leaves a gap where it was.
 * Escape cancels, and letting go glides it home unless the page took it (preventDefault() on tc-drag-end). It's only the
 * lift: where things land is the page's call, so it needs a keyboard way to do the same move. Touch drags only from a
 * [data-drag-handle] when there is one, so a finger elsewhere still scrolls; a mouse drags from anywhere but a control.
 *
 *   <tc-drag-lift><div><span data-drag-handle>⠿</span> A card</div></tc-drag-lift>
 */

/** How far the child has moved from where it started, in px */
export type DragLiftMove = { x: number; y: number };

const START_AFTER = 4;
const CONTROLS = "a[href], button, input, select, textarea, label, [contenteditable]";
const FALLBACK_DURATION = 320;
const reduced = () => !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Lifts its child while it's dragged, following the pointer and leaving a gap.
 * @tag tc-drag-lift
 * @fires tc-drag-start - The drag began ({ x, y }: DragLiftMove); cancelable – prevented, nothing lifts
 * @fires tc-drag-end - The child was let go ({ x, y }: DragLiftMove); cancelable – prevented, the page has placed it and it doesn't glide home
 * @fires tc-drag-cancel - Escape cancelled the drag ({ x, y }: DragLiftMove)
 */
export class TcDragLift extends TcElement {
  static override ui = "dlf";
  static override looks = false;

  /** Turn dragging off */
  @property({ type: Boolean, reflect: true }) accessor disabled = false;

  private start: { x: number; y: number; id: number } | null = null;
  private lifted = false;
  private refused = false;
  private moved: DragLiftMove = { x: 0, y: 0 };

  private get child() {
    return this.firstElementChild as HTMLElement | null;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener("pointerdown", this.onDown);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("pointerdown", this.onDown);
    this.stop();
    this.settle(false);
  }

  private onDown = (e: PointerEvent) => {
    if (this.disabled || this.start || e.button !== 0 || !this.child) return;
    const from = e.target as Element;
    const handle = from.closest("[data-drag-handle]");
    if (e.pointerType === "touch" && !handle && this.querySelector("[data-drag-handle]")) return;
    if (!handle && from.closest(CONTROLS)) return;
    this.start = { x: e.clientX, y: e.clientY, id: e.pointerId };
    this.refused = false;
    this.moved = { x: 0, y: 0 };
    window.addEventListener("pointermove", this.onMove);
    window.addEventListener("pointerup", this.onUp);
    window.addEventListener("pointercancel", this.onLost);
    window.addEventListener("keydown", this.onKey);
    window.addEventListener("selectstart", this.onSelect);
  };

  /** A drag mustn't select the text it passes over */
  private onSelect = (e: Event) => e.preventDefault();

  private onMove = (e: PointerEvent) => {
    if (!this.start || e.pointerId !== this.start.id || this.refused) return;
    const x = e.clientX - this.start.x;
    const y = e.clientY - this.start.y;
    if (!this.lifted) {
      if (Math.hypot(x, y) < START_AFTER) return;
      if (!this.emit<DragLiftMove>("tc-drag-start", { x: 0, y: 0 }, { cancelable: true })) {
        this.refused = true;
        return;
      }
      this.lifted = true;
      this.setAttribute("data-lifted", "");
    }
    this.moved = { x, y };
    this.child?.style.setProperty("--tc-dlf-x", `${x}px`);
    this.child?.style.setProperty("--tc-dlf-y", `${y}px`);
  };

  private onUp = (e: PointerEvent) => {
    if (!this.start || e.pointerId !== this.start.id) return;
    const wasLifted = this.lifted;
    const moved = this.moved;
    this.stop();
    if (!wasLifted) return;
    this.settle(this.emit<DragLiftMove>("tc-drag-end", moved, { cancelable: true }));
  };

  private onLost = () => this.cancel();

  private onKey = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    e.preventDefault();
    this.cancel();
  };

  private cancel() {
    const wasLifted = this.lifted;
    const moved = this.moved;
    this.stop();
    if (!wasLifted) return;
    this.emit<DragLiftMove>("tc-drag-cancel", moved);
    this.settle(true);
  }

  private stop() {
    this.start = null;
    window.removeEventListener("pointermove", this.onMove);
    window.removeEventListener("pointerup", this.onUp);
    window.removeEventListener("pointercancel", this.onLost);
    window.removeEventListener("keydown", this.onKey);
    window.removeEventListener("selectstart", this.onSelect);
  }

  /** Puts the child back, gliding from where it was let go if asked */
  private settle(glide: boolean) {
    const child = this.child;
    const { x, y } = this.moved;
    this.lifted = false;
    this.removeAttribute("data-lifted");
    child?.style.removeProperty("--tc-dlf-x");
    child?.style.removeProperty("--tc-dlf-y");
    if (!child || !glide || reduced() || (!x && !y)) return;
    const style = getComputedStyle(this);
    const token = Number.parseFloat(style.getPropertyValue("--tc-duration-slow"));
    child.animate([{ transform: `translate(${x}px, ${y}px)` }, { transform: "none" }], { duration: Number.isFinite(token) ? token : FALLBACK_DURATION, easing: style.getPropertyValue("--tc-ease-move").trim() || "ease-out" });
  }

  protected override render() {
    return nothing;
  }

  static override css = /* css */ `
[data-ui="dlf"] {
  --tc-drag-lift-scale: 1.02;
  --tc-drag-lift-shadow: var(--tc-menu-shadow);
  --tc-drag-lift-gap: var(--tc-border-strong);
  --tc-drag-lift-radius: var(--tc-control-radius-md);
  position: relative;
  display: block;
  cursor: grab;
}
[data-ui="dlf"][disabled] { cursor: auto; }
[data-ui="dlf"]:not(:has([data-drag-handle])):not([disabled]) { touch-action: none; }
[data-ui="dlf"] [data-drag-handle] { touch-action: none; }
[data-ui="dlf"][data-lifted] { cursor: grabbing; }
[data-ui="dlf"][data-lifted]::before { content: ""; position: absolute; inset: 0; border: 1px dashed var(--tc-drag-lift-gap); border-radius: var(--tc-drag-lift-radius); }
[data-ui="dlf"][data-lifted] > :first-child { position: relative; z-index: var(--tc-z-popover); border-radius: var(--tc-drag-lift-radius); box-shadow: var(--tc-drag-lift-shadow); transform: translate(var(--tc-dlf-x, 0), var(--tc-dlf-y, 0)) scale(var(--tc-drag-lift-scale)); }
@media (prefers-reduced-motion: reduce) {
  [data-ui="dlf"][data-lifted] > :first-child { transform: translate(var(--tc-dlf-x, 0), var(--tc-dlf-y, 0)); }
}
`;
}

if (!customElements.get("tc-drag-lift")) customElements.define("tc-drag-lift", TcDragLift);

declare global {
  interface HTMLElementTagNameMap {
    "tc-drag-lift": TcDragLift;
  }
}
