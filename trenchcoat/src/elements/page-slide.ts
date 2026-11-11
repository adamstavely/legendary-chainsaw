import { nothing, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";

/*
 * <tc-page-slide> – moves between views by sliding them side by side: change `view` and the old view slides out
 * (a little slower, fading – a touch of parallax) as the new one slides in from the side you're heading, while the
 * box's height glides to the new view's. Forward slides in from the end, back from the start; the direction comes
 * from `direction`, else from where the two views sit in `order` (or in the element, for data-view children).
 *
 * Two ways to give it views:
 *   · every view as a child marked data-view="<key>" – the element shows the one named by `view` and hides the rest
 *   · only the current view, swapped by the page (React and other frameworks) – put the new child in, then set `view`;
 *     the element shows a copy of the one that left (inert, hidden from assistive tech) while it slides out
 *
 *   <tc-page-slide view="details" focus-heading>
 *     <section data-view="scope"><h3>Scope</h3>…</section>
 *     <section data-view="details"><h3>Details</h3>…</section>
 *   </tc-page-slide>
 *
 * Focus: when focus was inside the old view, it moves to the new view's heading (with `focus-heading`) or its first
 * control, so it never drops to the page; with `focus-heading` the heading also takes focus after a change made from
 * outside, so screen-reader users land on the new step. With reduced motion the views switch at once.
 *
 * Why not the View Transitions API: document.startViewTransition() snapshots the whole page and runs one transition
 * at a time, so a component using it would freeze the page around it and cancel any other transition in progress.
 * The slide runs on the Web Animations API instead, scoped to the element.
 */

export type PageSlideDirection = "auto" | "forward" | "back";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const HEADING = "h1, h2, h3, h4, h5, h6, [role='heading']";
const FALLBACK_DURATION = 360;
const reduced = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Moves between views by sliding them side by side as `view` changes, the height gliding along.
 * @tag tc-page-slide
 */
export class TcPageSlide extends TcElement {
  static override ui = "pgsl";
  static override looks = false;

  /** The key of the view on show – change it to slide to another view */
  @property({ reflect: true }) accessor view = "";
  /** Which way to slide: "forward" brings the new view in from the end, "back" from the start; "auto" works it out from `order` */
  @property({ reflect: true }) accessor direction: PageSlideDirection = "auto";
  /** The views' keys in order, for "auto" (an attribute takes a comma-separated list); default: the data-view children's order */
  @property({ converter: { fromAttribute: (v: string | null) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean) : []) } }) accessor order: string[] = [];
  /** Move focus to the new view's heading after each change */
  @property({ type: Boolean, attribute: "focus-heading" }) accessor focusHeading = false;
  /** Length of the slide in ms; default the --tc-duration-slow token */
  @property({ type: Number }) accessor duration: number | undefined = undefined;

  /** The view on show, kept for the moment it has to leave */
  private current: HTMLElement | null = null;
  /** Focus was inside the view on show the last time we looked */
  private lastFocus: HTMLElement | null = null;
  private fromHeight = 0;
  /** The height at rest, kept by a ResizeObserver – a framework has already swapped the views by the time `view` changes */
  private restHeight = 0;
  private ro?: ResizeObserver;
  private running: Animation[] = [];
  private leaving: HTMLElement | null = null;
  private leavingIsCopy = false;

  private onFocusIn = (e: FocusEvent) => {
    this.lastFocus = e.target instanceof HTMLElement ? e.target : null;
  };

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener("focusin", this.onFocusIn);
    if (typeof ResizeObserver !== "undefined") {
      this.ro = new ResizeObserver(() => {
        if (!this.hasAttribute("data-busy")) this.restHeight = this.getBoundingClientRect().height;
      });
      this.ro.observe(this);
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("focusin", this.onFocusIn);
    this.ro?.disconnect();
    this.ro = undefined;
    this.settle();
  }

  /** The views that are the page's own (never the copy that's leaving) */
  private views(): HTMLElement[] {
    return [...this.children].filter((c): c is HTMLElement => c instanceof HTMLElement && !c.classList.contains("ui-pgsl__copy"));
  }

  /** The view named `key`, else the last of the page's children (a framework that swaps them) */
  private find(key: string): HTMLElement | null {
    const views = this.views();
    return views.find((v) => v.dataset.view === key) ?? (views.some((v) => v.dataset.view !== undefined && v.dataset.view !== key) ? null : (views[views.length - 1] ?? null));
  }

  private sync() {
    for (const v of this.views()) if (v.dataset.view !== undefined && !v.classList.contains("ui-pgsl__out")) v.toggleAttribute("hidden", v.dataset.view !== this.view);
  }

  /** forward or back, for a change from `from` to `to` */
  private way(from: string, to: string): "forward" | "back" {
    if (this.direction !== "auto") return this.direction;
    const order = this.order.length ? this.order : this.views().flatMap((v) => (v.dataset.view !== undefined ? [v.dataset.view] : []));
    const a = order.indexOf(from);
    const b = order.indexOf(to);
    return a >= 0 && b >= 0 && b < a ? "back" : "forward";
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (this.hasUpdated && changed.has("view")) this.fromHeight = this.hasAttribute("data-busy") || !this.restHeight ? this.getBoundingClientRect().height : this.restHeight;
  }

  protected override firstUpdated() {
    this.sync();
    this.current = this.find(this.view);
  }

  protected override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (!changed.has("view") || changed.get("view") === undefined) return;
    const from = changed.get("view") as string;
    if (from === this.view) return;
    this.swap(from);
  }

  private swap(from: string) {
    // A slide still running ends where it was going before the next one starts
    this.settle();
    const old = this.current;
    // Read before the old view is hidden, which blurs whatever had focus in it
    const active = document.activeElement;
    const focusWasInside = (!!old && !!active && old.contains(active)) || ((!active || active === document.body) && !!this.lastFocus && !this.lastFocus.isConnected);
    this.sync();
    const next = this.find(this.view);
    this.current = next;
    if (!next || next === old) return;

    const duration = this.duration ?? (Number.parseFloat(getComputedStyle(this).getPropertyValue("--tc-duration-slow")) || FALLBACK_DURATION);

    if (!reduced() && duration > 0 && old) {
      // The view that leaves: the page's own, held on screen, or a copy of the one the framework took out
      let leaving: HTMLElement | null = null;
      if (old.isConnected) {
        leaving = old;
        this.leavingIsCopy = false;
        old.removeAttribute("hidden");
      } else {
        leaving = old.cloneNode(true) as HTMLElement;
        leaving.classList.add("ui-pgsl__copy");
        leaving.removeAttribute("id");
        this.leavingIsCopy = true;
        this.prepend(leaving);
      }
      leaving.classList.add("ui-pgsl__out");
      leaving.setAttribute("aria-hidden", "true");
      leaving.setAttribute("inert", "");
      this.leaving = leaving;
      this.setAttribute("data-busy", "");

      const sign = this.way(from, this.view) === "forward" ? 1 : -1;
      const rtl = getComputedStyle(this).direction === "rtl" ? -1 : 1;
      const s = sign * rtl;
      const style = getComputedStyle(this);
      const easing = style.getPropertyValue("--tc-ease-move").trim() || "ease-out";
      const to = next.getBoundingClientRect().height;
      const opts = { duration, easing };
      this.running = [
        next.animate([{ transform: `translateX(${s * 100}%)`, opacity: 0.6 }, { transform: "none", opacity: 1 }], opts),
        leaving.animate([{ transform: "none", opacity: 1 }, { transform: `translateX(${-s * 30}%)`, opacity: 0 }], opts),
      ];
      if (this.fromHeight && Math.abs(this.fromHeight - to) > 0.5) this.running.push(this.animate([{ height: `${this.fromHeight}px` }, { height: `${to}px` }], opts));
      void this.running[0].finished.then(() => this.settle(), () => undefined);
    }

    if (this.focusHeading || focusWasInside) this.moveFocus(next);
  }

  /** Ends any slide in progress: the leaving view is hidden again (or its copy removed) and the box rests */
  private settle() {
    const running = this.running;
    this.running = [];
    for (const a of running) a.cancel();
    const leaving = this.leaving;
    this.leaving = null;
    if (leaving) {
      if (this.leavingIsCopy) leaving.remove();
      else {
        leaving.classList.remove("ui-pgsl__out");
        leaving.removeAttribute("aria-hidden");
        leaving.removeAttribute("inert");
      }
    }
    this.removeAttribute("data-busy");
    this.sync();
  }

  private moveFocus(view: HTMLElement) {
    const heading = this.focusHeading ? view.querySelector<HTMLElement>(HEADING) : null;
    let target = heading ?? (view.matches(FOCUSABLE) ? view : view.querySelector<HTMLElement>(FOCUSABLE)) ?? view;
    if (target === heading || (target === view && !view.matches(FOCUSABLE))) {
      if (!target.hasAttribute("tabindex")) target.tabIndex = -1;
    }
    if (!target.isConnected) target = view;
    target.focus({ preventScroll: true });
  }

  protected override render() {
    return nothing;
  }

  static override css = /* css */ `
[data-ui="pgsl"] {
  position: relative;
  display: block;
}
/* Clip only while sliding, so shadows and focus rings show the rest of the time */
[data-ui="pgsl"][data-busy] { overflow: hidden; }
[data-ui="pgsl"] > [data-view][hidden] { display: none !important; }
[data-ui="pgsl"] > .ui-pgsl__out {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  pointer-events: none;
}
[data-ui="pgsl"] > [tabindex="-1"]:focus-visible,
[data-ui="pgsl"] :is(h1, h2, h3, h4, h5, h6, [role="heading"])[tabindex="-1"]:focus-visible {
  outline: var(--tc-focus-ring-width) solid var(--tc-focus-ring);
  outline-offset: var(--tc-focus-ring-offset);
}
[data-ui="pgsl"] :is(h1, h2, h3, h4, h5, h6, [role="heading"])[tabindex="-1"]:focus:not(:focus-visible) { outline: none; }
`;
}

if (!customElements.get("tc-page-slide")) customElements.define("tc-page-slide", TcPageSlide);

declare global {
  interface HTMLElementTagNameMap {
    "tc-page-slide": TcPageSlide;
  }
}
