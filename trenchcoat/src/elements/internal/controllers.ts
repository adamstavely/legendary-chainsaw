import type { ReactiveController, ReactiveControllerHost } from "lit";

type Host = ReactiveControllerHost & HTMLElement;

/**
 * Sets data-offscreen on the host while it's scrolled out of view and `active()` is true, so its CSS can pause
 * animations (`[data-offscreen] … { animation-play-state: paused }`). No re-render.
 */
export class OffScreenController implements ReactiveController {
  private io?: IntersectionObserver;

  constructor(
    private host: Host,
    private active: () => boolean = () => true,
  ) {
    host.addController(this);
  }

  hostUpdated() {
    const on = this.active();
    if (on && !this.io && typeof IntersectionObserver === "function") {
      this.io = new IntersectionObserver((entries) => this.host.toggleAttribute("data-offscreen", !entries[entries.length - 1].isIntersecting));
      this.io.observe(this.host);
    } else if (!on && this.io) this.hostDisconnected();
  }

  hostDisconnected() {
    this.io?.disconnect();
    this.io = undefined;
    this.host.removeAttribute("data-offscreen");
  }
}

/**
 * Moves ARIA attributes from the host to the control inside it. The host is a generic element, where aria-label and
 * friends aren't allowed; the inner control is what assistive technology reaches. Attributes set later (a framework
 * re-rendering) are moved too.
 */
export class AriaForwardController implements ReactiveController {
  static readonly ATTRS = ["aria-label", "aria-labelledby", "aria-describedby", "aria-description", "aria-controls", "aria-expanded", "aria-haspopup", "aria-pressed", "aria-current", "aria-keyshortcuts"];
  private mo?: MutationObserver;

  constructor(
    private host: Host,
    private target: () => HTMLElement | null,
  ) {
    host.addController(this);
  }

  private move = () => {
    const to = this.target();
    if (!to) return;
    for (const name of AriaForwardController.ATTRS) {
      const value = this.host.getAttribute(name);
      if (value === null) continue;
      to.setAttribute(name, value);
      this.host.removeAttribute(name);
    }
  };

  hostConnected() {
    this.mo = new MutationObserver(this.move);
    this.mo.observe(this.host, { attributes: true, attributeFilter: AriaForwardController.ATTRS });
  }

  hostUpdated() {
    this.move();
  }

  hostDisconnected() {
    this.mo?.disconnect();
  }
}

/**
 * Long lists render only the rows near the viewport (decision L11, the port of data-table's useRowWindow): above
 * `from` rows, `start`–`end` covers the rows on screen plus `overscan` on each side, moving in steps of `overscan` so
 * scrolling re-renders rarely. The page or any scroller may move the list, so it follows every scroll (read once a
 * frame). Rows outside the window become one spacer above and one below, `rowHeight` tall each.
 */
export class RowWindowController implements ReactiveController {
  start = 0;
  end = 0;
  rowHeight: number;
  private frame = 0;
  private win = { start: 0, end: 0 };

  constructor(
    private host: Host,
    private options: {
      count: () => number;
      /** The element the rows are in; its top edge and the first measured row give the geometry */
      body: () => HTMLElement | null;
      rowSelector: string;
      from: number;
      overscan: number;
      rowHeight: number;
    },
  ) {
    this.rowHeight = options.rowHeight;
    this.win = { start: 0, end: 3 * options.overscan };
    host.addController(this);
  }

  get virtual() {
    return this.options.count() > this.options.from;
  }

  /** The rows to render this update */
  compute() {
    const count = this.options.count();
    if (!this.virtual) {
      this.start = 0;
      this.end = count;
    } else {
      this.start = Math.min(this.win.start, Math.max(0, count - 1));
      this.end = Math.min(count, Math.max(this.win.end, this.start + 1));
    }
    return { start: this.start, end: this.end };
  }

  private place(first: number, last: number) {
    const { overscan } = this.options;
    const count = this.options.count();
    const start = Math.max(0, Math.floor(first / overscan) * overscan - overscan);
    const end = Math.min(count, Math.ceil(last / overscan) * overscan + overscan);
    if (start === this.win.start && end === this.win.end) return;
    this.win = { start, end };
    this.host.requestUpdate();
  }

  /** Centre the window on a row that is out of it, e.g. one the keyboard jumped to */
  reveal(r: number) {
    this.place(r - this.options.overscan, r + this.options.overscan);
  }

  private measure = () => {
    this.frame = 0;
    if (!this.virtual) return;
    const body = this.options.body();
    if (!body) return;
    const row = body.querySelector<HTMLElement>(this.options.rowSelector);
    const top = body.getBoundingClientRect().top;
    const h = row?.offsetHeight || this.rowHeight;
    this.rowHeight = h;
    this.place(Math.max(0, Math.floor(-top / h)), Math.max(0, Math.ceil((window.innerHeight - top) / h)));
  };
  private schedule = () => {
    if (!this.frame) this.frame = requestAnimationFrame(this.measure);
  };

  hostConnected() {
    window.addEventListener("scroll", this.schedule, { capture: true, passive: true });
    window.addEventListener("resize", this.schedule);
  }
  hostUpdated() {
    if (this.virtual) this.schedule();
  }
  hostDisconnected() {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    window.removeEventListener("scroll", this.schedule, { capture: true });
    window.removeEventListener("resize", this.schedule);
  }
}

/** Connected, not inside something inert or hidden, not disabled */
const focusable = (el: Element | null | undefined): boolean =>
  !!el && el.isConnected && el instanceof HTMLElement && !el.closest("[inert],[hidden]") && !(el as HTMLButtonElement).disabled;

/**
 * Focus never drops to <body> when the focused control inside the element goes away (WCAG 2.4.3) – the port of
 * useFocusRescue: it moves to a control with the same `data-focus-key`, else `fallback(key)`, else the host.
 */
export class FocusRescueController implements ReactiveController {
  private last: HTMLElement | null = null;
  private mo?: MutationObserver;
  private onFocusIn = (e: FocusEvent) => {
    this.last = e.target instanceof HTMLElement ? e.target : null;
  };

  constructor(
    private host: Host,
    private fallback: (key: string | null) => Element | null | undefined = () => null,
  ) {
    host.addController(this);
  }

  private check = () => {
    const prev = this.last;
    const el = this.host;
    if (!prev || !el.isConnected) return;
    const active = document.activeElement;
    const lost = !active || active === document.body || active === prev;
    if (!lost || focusable(prev)) return;
    const key = prev.getAttribute("data-focus-key");
    const same = key ? [...el.querySelectorAll(`[data-focus-key="${CSS.escape(key)}"]`)].find((c) => c !== prev && focusable(c)) : null;
    const target = [same, this.fallback(key)].find(focusable) as HTMLElement | undefined;
    this.last = null;
    if (target) target.focus({ preventScroll: true });
    else {
      if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
      el.focus({ preventScroll: true });
    }
  };

  hostConnected() {
    this.mo = new MutationObserver(this.check);
    this.mo.observe(this.host, { subtree: true, childList: true, attributes: true, attributeFilter: ["disabled", "inert", "hidden"] });
    this.host.addEventListener("focusin", this.onFocusIn);
  }
  hostDisconnected() {
    this.mo?.disconnect();
    this.host.removeEventListener("focusin", this.onFocusIn);
  }
}

/** Moves focus to the first usable target, but only if focus is inside `from` now (call it before removing `from`) */
export function rescueFocus(from: Element | null | undefined, targets: Array<Element | null | undefined>) {
  const active = document.activeElement;
  if (!from || !active || !from.contains(active)) return false;
  const el = targets.find((t) => t !== active && focusable(t)) as HTMLElement | undefined;
  el?.focus({ preventScroll: true });
  return !!el;
}

/** An outer box that follows an inner box's height, with a transition after the first frame (useSmoothHeight) */
export class SmoothHeightController implements ReactiveController {
  private ro?: ResizeObserver;
  private frame = 0;
  constructor(
    private host: Host,
    private outer: () => HTMLElement | null,
    private inner: () => HTMLElement | null,
  ) {
    host.addController(this);
  }
  hostUpdated() {
    if (this.ro) return;
    const o = this.outer();
    const i = this.inner();
    if (!o || !i || typeof ResizeObserver !== "function") return;
    const sync = () => (o.style.height = `${i.offsetHeight}px`);
    sync();
    this.ro = new ResizeObserver(sync);
    this.ro.observe(i);
    this.frame = requestAnimationFrame(() => o.setAttribute("data-smooth", ""));
  }
  hostDisconnected() {
    this.ro?.disconnect();
    this.ro = undefined;
    cancelAnimationFrame(this.frame);
  }
}
