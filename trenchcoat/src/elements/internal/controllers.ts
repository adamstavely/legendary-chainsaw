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
