import { nothing, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";

/*
 * <tc-staggered-reveal> – children arrive one after another, once, the first time they're seen. The waits are capped so
 * a long list doesn't keep anyone waiting. Children are only hidden by the animation itself, so without JavaScript, or
 * with reduced motion, they're simply there. A new `play-key` plays it again.
 *
 *   <tc-staggered-reveal><div>One</div><div>Two</div></tc-staggered-reveal>
 */

const FALLBACK_DURATION = 320;
const reduced = () => !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Children arrive one after another, once, the first time they're seen.
 * @tag tc-staggered-reveal
 */
export class TcStaggeredReveal extends TcElement {
  static override ui = "srv";
  static override looks = false;

  /** The wait between one child and the next, in ms */
  @property({ type: Number }) accessor delay = 60;
  /** The longest any child waits, in ms, however long the list is */
  @property({ type: Number, attribute: "max-delay" }) accessor maxDelay = 480;
  /** Change this to play it again */
  @property({ attribute: "play-key" }) accessor playKey: string | number | undefined = undefined;

  private played = false;
  private running: Animation[] = [];
  private watcher?: IntersectionObserver;

  private clear() {
    this.watcher?.disconnect();
    this.watcher = undefined;
    for (const a of this.running) a.cancel();
    this.running = [];
  }

  private prepare() {
    this.clear();
    if (this.played || reduced() || typeof IntersectionObserver === "undefined") return;
    const style = getComputedStyle(this);
    const token = Number.parseFloat(style.getPropertyValue("--tc-duration-slow"));
    const duration = Number.isFinite(token) ? token : FALLBACK_DURATION;
    const easing = style.getPropertyValue("--tc-ease-move").trim() || "ease-out";
    this.running = [...this.children].map((child, i) => {
      const a = child.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration, easing, delay: Math.min(i * this.delay, this.maxDelay), fill: "backwards" });
      a.pause();
      return a;
    });
    this.watcher = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      this.played = true;
      this.watcher?.disconnect();
      this.watcher = undefined;
      for (const a of this.running) a.play();
    });
    this.watcher.observe(this);
  }

  override connectedCallback() {
    super.connectedCallback();
    if (this.hasUpdated) this.prepare();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.clear();
  }

  protected override firstUpdated() {
    this.prepare();
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (changed.has("playKey") && changed.get("playKey") !== undefined) {
      this.played = false;
      this.prepare();
    }
  }

  protected override render() {
    return nothing;
  }

  static override css = /* css */ `
[data-ui="srv"] { display: block; }
`;
}

if (!customElements.get("tc-staggered-reveal")) customElements.define("tc-staggered-reveal", TcStaggeredReveal);

declare global {
  interface HTMLElementTagNameMap {
    "tc-staggered-reveal": TcStaggeredReveal;
  }
}
