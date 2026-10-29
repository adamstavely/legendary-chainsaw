import type { ReactiveController, ReactiveControllerHost } from "lit";
import { adoptStyles } from "./styles";

/*
 * A floating toolbar or card anchored to a rectangle or an element (remediation 6.0) – the selection toolbar, the
 * translation card, the ISBN hover card, the background-tasks panel. internal/selection-toolbar.ts builds the
 * selection toolbar on it.
 *
 *   pop = new PopoverController(this, {
 *     popover: () => this.querySelector(".ui-x__pop"),
 *     anchor: () => this.sel.rect(),              // a rect (viewport pixels) or an element; read on every placement
 *     kind: "toolbar",                            // sets the role if the element has none: toolbar / dialog / tooltip
 *     onClose: (reason) => this.requestUpdate(),  // "escape" | "outside" | "api" | "anchor-gone"
 *   });
 *   pop.show();  …  ${pop.open ? html`<div class="tc-pop ui-x__pop" aria-label="Selection">…</div>` : nothing}
 *
 * The host renders the floating element while `open` (give it the `tc-pop` class for the shared surface, or style
 * your own), or keeps it rendered and `hidden` while closed; the controller does the rest:
 *   · the top layer – where the Popover API exists the element becomes `popover="manual"` and is shown with
 *     showPopover(), so no `overflow` or transformed ancestor clips it (`topLayer: false` opts out). Elsewhere it's
 *     `position: fixed` at `--tc-z-popover`
 *   · placement – above the anchor by default (`side`), centred (`align`), flipped to the other side when it doesn't
 *     fit, shifted to stay `margin` px inside the viewport, followed on scroll, resize and size changes. Outside the
 *     top layer it corrects for a transformed or zoomed ancestor (which would make `fixed` relative to it). The element
 *     gets data-side ("top" / "bottom") and data-placed once it's in place (the base CSS keeps it invisible until
 *     then, so it never flashes at 0, 0), and `--tc-pop-arrow-x`, the anchor's centre in the popover's own pixels
 *   · Escape closes the topmost open popover anywhere on the page (WCAG 1.4.13) and, if focus was inside it, sends
 *     focus back to where it was when `show()` ran (or `returnFocus()`); a key handler that calls preventDefault()
 *     first keeps it open
 *   · a pointer-down outside the popover and the anchor (and `trigger()`, `inside()`) closes it, without moving focus;
 *     with `closeOnFocusOut`, so does focus moving from either to somewhere else
 *   · `close()` from an action inside it also returns focus when focus was inside (it never drops to <body>)
 *   · semantics: a toolbar is role="toolbar" with a label (it doesn't take focus – Tab reaches it, or `focusFirst()`);
 *     a card that holds controls is role="dialog" (non-modal, labelled – pass `focus: true` to move focus into it);
 *     a hover card that's only text is role="tooltip", and the anchor's aria-describedby points at it
 *   · `hover` – hover intent for a hover card: `hoverEnter(e, open)` from the trigger's pointerenter opens it after
 *     `delay` (at once when it's already open, moving between triggers); `hoverLeave(e)` closes it after `grace` ms,
 *     unless the pointer reached the popover (its own pointer events are wired for you), focus is in it or on the
 *     trigger, or it's `pinned` (a click, or Tab into it). Touch pointers are ignored
 *   · `tabBridge` – Tab from the trigger moves into the open popover (when it has controls, or is a dialog); Shift + Tab
 *     from its first control goes back to the trigger; Tab from its last moves on to the trigger's next tabbable on
 *     the page. Its buttons get tabindex="0", as WebKit on macOS skips buttons on Tab otherwise
 *   · reduced motion: the entry animation is off
 *
 *   hover card:  new PopoverController(this, { popover, anchor: () => this.markAt(this.openAt), kind: "dialog",
 *                  hover: { delay: () => this.hoverDelay }, tabBridge: true, closeOnFocusOut: true, … })
 *                <button @pointerenter=${(e) => pop.hoverEnter(e, () => this.open(i))} @pointerleave=${pop.hoverLeave}>
 *
 * `placePopover()` is the pure placement maths, and `nextTabbable()` / `tabbables()` the focus order the Tab bridge
 * uses, exported for anything that positions or focuses its own way.
 */

export type PopoverSide = "top" | "bottom";
export type PopoverAlign = "start" | "center" | "end";
export type PopoverKind = "toolbar" | "dialog" | "tooltip";
export type PopoverCloseReason = "escape" | "outside" | "api" | "anchor-gone";
/** A box in viewport pixels – a DOMRect will do */
export type PopoverRect = { left: number; top: number; width: number; height: number };

export type PlaceOptions = {
  /** Preferred side of the anchor (default "top") */
  side?: PopoverSide;
  /** Horizontal alignment with the anchor (default "center") */
  align?: PopoverAlign;
  /** Space between the anchor and the popover, px (default 8) */
  gap?: number;
  /** Space kept clear at the viewport's edges, px (default 8) */
  margin?: number;
};

export type Placement = {
  left: number;
  top: number;
  /** The side it ended up on */
  side: PopoverSide;
  /** It moved to the other side because the preferred one had no room */
  flipped: boolean;
  /** How far it was shifted sideways to stay inside the viewport (px, signed) */
  shift: number;
  /** The anchor's centre in the popover's coordinates, clamped inside it – for an arrow */
  arrowX: number;
  /** The anchor is entirely out of the viewport (scrolled away) */
  offscreen: boolean;
};

/**
 * Where a `size` popover goes next to `anchor` inside `viewport` (all in the same pixels): the preferred side if it
 * fits, else the other side if that fits, else whichever has more room (then kept inside the viewport, even if it
 * covers the anchor). Sideways it's aligned, then shifted to stay `margin` inside; wider than the viewport, it starts
 * at the margin.
 */
export function placePopover(anchor: PopoverRect, size: { width: number; height: number }, viewport: { width: number; height: number }, options: PlaceOptions = {}): Placement {
  const { side = "top", align = "center", gap = 8, margin = 8 } = options;
  const { width: w, height: h } = size;
  const right = anchor.left + anchor.width;
  const bottom = anchor.top + anchor.height;
  const room = { top: anchor.top - gap - margin, bottom: viewport.height - bottom - gap - margin };
  const other: PopoverSide = side === "top" ? "bottom" : "top";
  const final: PopoverSide = room[side] >= h ? side : room[other] >= h ? other : room[other] > room[side] ? other : side;
  let top = final === "top" ? anchor.top - gap - h : bottom + gap;
  top = Math.max(margin, Math.min(top, viewport.height - margin - h));
  if (h > viewport.height - 2 * margin) top = margin;
  const ideal = align === "start" ? anchor.left : align === "end" ? right - w : anchor.left + anchor.width / 2 - w / 2;
  const left = w > viewport.width - 2 * margin ? margin : Math.max(margin, Math.min(ideal, viewport.width - margin - w));
  const centre = anchor.left + anchor.width / 2 - left;
  return {
    left,
    top,
    side: final,
    flipped: final !== side,
    shift: left - ideal,
    arrowX: Math.max(0, Math.min(w, centre)),
    offscreen: bottom < 0 || anchor.top > viewport.height || right < 0 || anchor.left > viewport.width,
  };
}

export type PopoverHoverOptions = {
  /** How long the pointer rests on a trigger before it opens, ms (default 300) */
  delay?: number | (() => number);
  /** How long it stays open after the pointer leaves the trigger or the popover, ms – time to cross the gap (default 200) */
  grace?: number;
};

export type PopoverOptions = PlaceOptions & {
  /** The floating element, rendered by the host while `open` (or kept rendered and hidden while closed) */
  popover: () => HTMLElement | null;
  /** What it's anchored to: a rect in viewport pixels or an element; null closes it ("anchor-gone") */
  anchor: () => PopoverRect | Element | null;
  /** The element it belongs to – where Tab comes from and goes back to, whose focus keeps a hover card open, and
   *  where a pointer-down isn't "outside". Default: the anchor, when it's an element */
  trigger?: () => HTMLElement | null;
  /** Sets the element's role when it has none */
  kind?: PopoverKind;
  /** Called after it closed, with why */
  onClose?: (reason: PopoverCloseReason) => void;
  /** Where focus goes when it closes from inside; default: what had focus when show() ran */
  returnFocus?: () => HTMLElement | null;
  /** Where `focusFirst()` (and `show({ focus: true })`) puts focus; default: the popover's first control */
  initialFocus?: () => HTMLElement | null;
  /** A pointer-down in these doesn't count as outside (the popover and an element anchor never do) */
  inside?: () => Array<Element | null | undefined>;
  /** Hide it while its anchor is scrolled out of view (default true) */
  hideOffscreen?: boolean;
  /** Show it in the top layer where the Popover API exists (default true) */
  topLayer?: boolean;
  /** Hover intent: an open delay, a grace period to reach the popover, open while hovered (see the file header) */
  hover?: PopoverHoverOptions;
  /** Tab between the trigger and the popover (see the file header); default false. A function is asked each time – off for a menu, say */
  tabBridge?: boolean | (() => boolean);
  /** Close ("outside") when focus moves from the popover or the trigger to anywhere else; default false */
  closeOnFocusOut?: boolean;
};

type Host = ReactiveControllerHost & HTMLElement;

/** Open popovers, newest last – Escape closes the newest */
const stack: PopoverController[] = [];

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const TABBABLE = 'a[href], area[href], button, input:not([type="hidden"]), select, textarea, summary, iframe, [contenteditable=""], [contenteditable="true"], [tabindex]';

const canTab = (el: HTMLElement) => el.tabIndex >= 0 && !(el as HTMLButtonElement).disabled && !el.closest("[inert]") && el.getClientRects().length > 0;

/** The elements Tab reaches inside `root`, in order (positive tabindex aside) */
export function tabbables(root: ParentNode): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(TABBABLE)].filter(canTab);
}

/** The first element after `from` (and its contents) that Tab reaches, skipping anything inside `skip`; null at the end */
export function nextTabbable(from: Element, skip: Array<Element | null | undefined> = []): HTMLElement | null {
  const doc = from.ownerDocument;
  for (const el of doc.body.querySelectorAll<HTMLElement>(TABBABLE)) {
    if (!(from.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) || from.contains(el)) continue;
    if (skip.some((s) => s && s.contains(el)) || !canTab(el)) continue;
    return el;
  }
  return null;
}

/** The shared surface: --tc-menu-* in both looks, at --tc-z-popover (or in the top layer). Adopted once per document */
export const popoverCss = /* css */ `
.tc-pop { position: fixed; inset: auto; top: 0; left: 0; z-index: var(--tc-z-popover); box-sizing: border-box; max-width: calc(100vw - var(--tc-space-4)); margin: 0; border: 0; overflow: visible; padding: var(--tc-menu-padding); border-radius: var(--tc-menu-radius); background: var(--tc-menu-bg); box-shadow: var(--tc-menu-shadow); color: var(--tc-text-primary); font-family: var(--tc-font-sans); }
.tc-pop:not([data-placed]) { visibility: hidden; }
.tc-pop[data-placed] { animation: tc-pop-in var(--tc-duration-fast) var(--tc-ease-move) both; }
.tc-pop[data-side="bottom"] { --tc-pop-from: translateY(-4px); }
.tc-pop[data-offscreen] { visibility: hidden; }
@keyframes tc-pop-in { from { opacity: 0; transform: var(--tc-pop-from, translateY(4px)) scale(0.98); } }
@media (prefers-reduced-motion: reduce) { .tc-pop[data-placed] { animation: none; } }
@media (forced-colors: active) { .tc-pop { border: 1px solid CanvasText; } }
`;

/** A popover's open state, placement, top layer, Escape, outside clicks, focus return, hover intent and the Tab bridge. See the file header */
export class PopoverController implements ReactiveController {
  /** Whether the host should render the popover */
  open = false;
  /** The last placement (null until placed) */
  placement: Placement | null = null;
  /** Stays open when the pointer leaves (a click, or Tab into it); reset when it closes */
  pinned = false;

  private returnTo: HTMLElement | null = null;
  private focusOnOpen = false;
  private frame = 0;
  private ro?: ResizeObserver;
  private observed: HTMLElement | null = null;
  private openTimer = 0;
  private closeTimer = 0;
  private wired: HTMLElement | null = null;

  constructor(
    private host: Host,
    private options: PopoverOptions,
  ) {
    host.addController(this);
  }

  /** Opens it (or re-places it if open). `focus: true` moves focus into it once it's rendered; `pin: true` keeps a hover card open */
  show({ focus = false, pin = false }: { focus?: boolean; pin?: boolean } = {}) {
    this.clearTimers();
    const active = this.host.ownerDocument.activeElement;
    const pop = this.options.popover();
    // Re-opening from inside keeps the original return target
    if (!this.open || !(pop && active && pop.contains(active))) this.returnTo = active instanceof HTMLElement && active !== this.host.ownerDocument.body ? active : null;
    this.focusOnOpen = focus;
    if (pin) this.pinned = true;
    if (!this.open) {
      this.open = true;
      stack.push(this);
      this.listen(true);
    }
    this.host.requestUpdate();
  }

  /** Closes it; focus inside it goes back to where it came from */
  close(reason: PopoverCloseReason = "api") {
    this.clearTimers();
    if (!this.open) return;
    const doc = this.host.ownerDocument;
    const pop = this.options.popover();
    const focusInside = !!pop && pop.contains(doc.activeElement);
    this.open = false;
    this.pinned = false;
    this.placement = null;
    // Not in the stack when its host left the page while it was open: splicing at -1 would drop the newest popover
    const at = stack.indexOf(this);
    if (at >= 0) stack.splice(at, 1);
    this.listen(false);
    this.unobserve();
    if (pop) this.hide(pop);
    if (focusInside || (reason === "escape" && doc.activeElement === doc.body)) {
      const to = this.options.returnFocus?.() ?? this.returnTo;
      if (to?.isConnected) to.focus({ preventScroll: true });
      else (pop?.closest("[tabindex]") as HTMLElement | null)?.focus({ preventScroll: true });
    }
    this.returnTo = null;
    this.host.requestUpdate();
    this.options.onClose?.(reason);
  }

  /** Moves focus to `initialFocus()`, else the popover's first control, else the popover itself */
  focusFirst() {
    const pop = this.options.popover();
    if (!pop) return;
    const first = this.options.initialFocus?.() ?? pop.querySelector<HTMLElement>(FOCUSABLE);
    if (first) first.focus();
    else {
      if (!pop.hasAttribute("tabindex")) pop.tabIndex = -1;
      pop.focus();
    }
  }

  /* ---------- Hover intent ---------- */

  /** The pointer entered a trigger: `open` runs after the delay – at once when a card is already open (moving between
   *  triggers), and a pending close is called off */
  hoverEnter(e: PointerEvent | null, open: () => void) {
    if (e?.pointerType === "touch") return;
    this.clearTimers();
    if (this.open) {
      open();
      return;
    }
    const d = this.options.hover?.delay;
    const delay = typeof d === "function" ? d() : (d ?? 300);
    this.openTimer = window.setTimeout(open, Math.max(0, delay));
  }

  /** The pointer left a trigger or the popover: it closes after the grace period, unless it's pinned, the pointer comes
   *  back, or focus is in it or on its trigger */
  hoverLeave = (e?: PointerEvent | null) => {
    if (e?.pointerType === "touch") return;
    this.clearTimers();
    if (!this.open || this.pinned) return;
    this.closeTimer = window.setTimeout(() => {
      if (!this.open || this.pinned || this.focusIn()) return;
      this.close();
    }, this.options.hover?.grace ?? 200);
  };

  private clearTimers() {
    clearTimeout(this.openTimer);
    clearTimeout(this.closeTimer);
    this.openTimer = this.closeTimer = 0;
  }

  private onPopEnter = (e: PointerEvent) => {
    if (e.pointerType !== "touch") clearTimeout(this.closeTimer);
  };

  /** Focus is in the popover or on (in) its trigger */
  private focusIn() {
    const a = this.host.ownerDocument.activeElement;
    const trigger = this.trigger();
    return !!a && (!!this.options.popover()?.contains(a) || !!trigger?.contains(a));
  }

  private bridged() {
    const b = this.options.tabBridge;
    return typeof b === "function" ? b() : !!b;
  }

  private trigger(): HTMLElement | null {
    if (this.options.trigger) return this.options.trigger();
    const a = this.options.anchor();
    return a instanceof HTMLElement ? a : null;
  }

  /* ---------- Placement ---------- */

  /** In the top layer (where the Popover API exists) */
  private lift(pop: HTMLElement) {
    if (this.options.topLayer === false || typeof pop.showPopover !== "function") return false;
    if (!pop.hasAttribute("popover")) pop.setAttribute("popover", "manual");
    if (!pop.matches(":popover-open")) {
      try {
        pop.showPopover();
      } catch {
        return false;
      }
    }
    return true;
  }

  private hide(pop: HTMLElement) {
    pop.removeAttribute("data-placed");
    if (pop.hasAttribute("popover") && pop.matches(":popover-open")) pop.hidePopover();
  }

  /** Places it now (it also follows scrolling, resizing and its own size changes) */
  reposition = () => {
    this.frame = 0;
    if (!this.open) return;
    const pop = this.options.popover();
    const target = this.options.anchor();
    if (!pop) return;
    const anchor = target instanceof Element ? (target.isConnected ? target.getBoundingClientRect() : null) : target;
    if (!anchor) {
      this.close("anchor-gone");
      return;
    }
    const doc = this.host.ownerDocument;
    const kind = this.options.kind;
    if (kind && !pop.hasAttribute("role")) pop.setAttribute("role", kind);
    this.wire(pop);
    let origin = { left: 0, top: 0 };
    let scale = 1;
    if (!this.lift(pop)) {
      // Where does (0, 0) land? A transformed or zoomed ancestor makes `fixed` relative to itself. A probe beside the
      // popover measures it – the popover's own box can be mid entry animation (moved and scaled)
      const probe = doc.createElement("span");
      probe.style.cssText = "position:fixed;left:0;top:0;width:100px;height:0;visibility:hidden;pointer-events:none";
      pop.after(probe);
      const box = probe.getBoundingClientRect();
      probe.remove();
      origin = box;
      scale = box.width ? 100 / box.width : 1;
    }
    const size = { width: pop.offsetWidth / scale, height: pop.offsetHeight / scale };
    const viewport = { width: doc.documentElement.clientWidth, height: doc.documentElement.clientHeight };
    const p = placePopover(anchor, size, viewport, this.options);
    this.placement = p;
    pop.style.left = `${(p.left - origin.left) * scale}px`;
    pop.style.top = `${(p.top - origin.top) * scale}px`;
    pop.style.setProperty("--tc-pop-arrow-x", `${p.arrowX * scale}px`);
    pop.dataset.side = p.side;
    pop.toggleAttribute("data-offscreen", p.offscreen && this.options.hideOffscreen !== false);
    pop.toggleAttribute("data-placed", true);
    this.observe(pop);
  };

  /** The popover's own pointer events (hover) and its buttons' tabindex (Tab bridge), once per element */
  private wire(pop: HTMLElement) {
    if (this.bridged()) for (const b of pop.querySelectorAll("button:not([tabindex])")) b.setAttribute("tabindex", "0");
    if (this.wired === pop || !this.options.hover) return;
    this.unwire();
    this.wired = pop;
    pop.addEventListener("pointerenter", this.onPopEnter);
    pop.addEventListener("pointerleave", this.hoverLeave);
  }
  private unwire() {
    this.wired?.removeEventListener("pointerenter", this.onPopEnter);
    this.wired?.removeEventListener("pointerleave", this.hoverLeave);
    this.wired = null;
  }

  private schedule = () => {
    if (!this.frame) this.frame = requestAnimationFrame(this.reposition);
  };

  /* ---------- Keys, pointer and focus ---------- */

  private onKey = (e: KeyboardEvent) => {
    if (e.key === "Tab") this.onTab(e);
    if (e.key !== "Escape" || e.defaultPrevented || stack[stack.length - 1] !== this) return;
    e.preventDefault();
    this.close("escape");
  };

  /** The Tab bridge: trigger → popover → the trigger's next tabbable, and Shift + Tab back */
  private onTab(e: KeyboardEvent) {
    if (!this.bridged() || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    const pop = this.options.popover();
    const trigger = this.trigger();
    const from = e.composedPath()[0];
    if (!pop || !trigger || !(from instanceof Node)) return;
    const items = tabbables(pop);
    if (from === trigger) {
      if (e.shiftKey || (!items.length && pop.getAttribute("role") !== "dialog")) return;
      e.preventDefault();
      this.pinned = true;
      this.focusFirst();
      return;
    }
    if (!pop.contains(from)) return;
    const at = items.indexOf(this.host.ownerDocument.activeElement as HTMLElement);
    if (e.shiftKey && at <= 0) {
      e.preventDefault();
      trigger.focus();
    } else if (!e.shiftKey && at === items.length - 1) {
      const next = nextTabbable(trigger, [pop]);
      if (next) {
        e.preventDefault();
        next.focus();
      }
    }
  }

  private isInside(path: EventTarget[] | Node) {
    const target = this.options.anchor();
    const inside = [this.options.popover(), target instanceof Element ? target : null, this.trigger(), ...(this.options.inside?.() ?? [])];
    return inside.some((el) => el && (Array.isArray(path) ? path.includes(el) : el.contains(path)));
  }

  private onPointerDown = (e: PointerEvent) => {
    if (!this.isInside(e.composedPath())) this.close("outside");
  };

  private onFocusOut = (e: FocusEvent) => {
    const to = e.relatedTarget;
    const from = e.target;
    if (!(to instanceof Node) || !(from instanceof Node)) return;
    const pop = this.options.popover();
    if (!pop?.contains(from) && !this.trigger()?.contains(from)) return;
    if (!this.isInside(to)) this.close("outside");
  };

  private listen(on: boolean) {
    const doc = this.host.ownerDocument;
    const view = doc.defaultView ?? window;
    const m = on ? "addEventListener" : "removeEventListener";
    doc[m]("keydown", this.onKey as EventListener);
    doc[m]("pointerdown", this.onPointerDown as EventListener, true);
    if (this.options.closeOnFocusOut) doc[m]("focusout", this.onFocusOut as EventListener, true);
    view[m]("scroll", this.schedule, true);
    view[m]("resize", this.schedule);
    if (!on) {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
    }
  }

  private observe(pop: HTMLElement) {
    if (this.observed === pop || typeof ResizeObserver !== "function") return;
    this.unobserve();
    this.observed = pop;
    this.ro = new ResizeObserver(this.schedule);
    this.ro.observe(pop);
  }
  private unobserve() {
    this.ro?.disconnect();
    this.ro = undefined;
    this.observed = null;
  }

  hostConnected() {
    adoptStyles("tc-pop", popoverCss, this.host.ownerDocument);
    if (this.open) {
      stack.push(this);
      this.listen(true);
    }
  }

  hostUpdated() {
    if (!this.open) {
      // A popover kept rendered while closed leaves the top layer
      const pop = this.options.popover();
      if (pop) this.hide(pop);
      return;
    }
    this.reposition();
    if (this.focusOnOpen) {
      this.focusOnOpen = false;
      this.focusFirst();
    }
  }

  hostDisconnected() {
    this.clearTimers();
    if (this.open) {
      const at = stack.indexOf(this);
      if (at >= 0) stack.splice(at, 1);
      this.listen(false);
    }
    this.unobserve();
    this.unwire();
  }
}
