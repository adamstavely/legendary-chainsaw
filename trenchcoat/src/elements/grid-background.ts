import { html, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";

/*
 * <tc-grid-background> – the Lit port of motion/grid-background.tsx: a fine line grid behind your content. The grid
 * drifts slowly by one cell per loop and fades out towards the edges through a radial mask. On first view it can be
 * uncovered by a circle that grows from the centre.
 *
 *   <tc-grid-background size="40"><div class="hero">…</div></tc-grid-background>
 *
 * The content is the caller's children, and they stay where the framework put them: each child sits above the grid
 * (the React file's .ui-gb-content rule now applies to every child; give it element children – the React wrapper
 * puts its children in one div, as the React component did).
 * The drift runs for `playFor` seconds (5 by default, WCAG 2.2.2) and then rests; it pauses while the grid is off
 * screen or its tab is hidden. Reduced motion: the grid stays still and appears without the reveal.
 */

export type GridDirection = "up" | "down" | "left" | "right" | "diagonal";

const offsets: Record<GridDirection, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
  diagonal: [-1, 1],
};

/**
 * Calls `onChange(active)` right away and whenever `el` comes into or leaves the viewport or its tab is hidden or
 * shown – the React file's watchOnScreen, reporting to a callback so pausing costs no render.
 */
function watchOnScreen(el: Element, onChange: (active: boolean) => void) {
  let inView = true;
  let last: boolean | undefined;
  const update = () => {
    const next = inView && document.visibilityState !== "hidden";
    if (next !== last) onChange((last = next));
  };
  const io =
    typeof IntersectionObserver === "function"
      ? new IntersectionObserver((entries) => {
          inView = entries[entries.length - 1].isIntersecting;
          update();
        })
      : null;
  io?.observe(el);
  document.addEventListener("visibilitychange", update);
  update();
  return () => {
    io?.disconnect();
    document.removeEventListener("visibilitychange", update);
  };
}

/**
 * A fine, slowly drifting line grid behind its children, fading out towards the edges.
 * @tag tc-grid-background
 */
export class TcGridBackground extends TcElement {
  static override ui = "gb";
  static override looks = false;

  /** Cell size in px */
  @property({ type: Number }) accessor size = 48;
  /** Line colour – defaults to a faint black, or a faint white in dark mode */
  @property() accessor color: string | undefined = undefined;
  /** Seconds per cell; 0 keeps the grid still */
  @property({ type: Number }) accessor speed = 3;
  /** Seconds the grid drifts before it rests; Infinity never stops – then give users a way to pause it (WCAG 2.2.2) */
  @property({ type: Number, attribute: "play-for" }) accessor playFor = 5;
  /** Drift direction; "diagonal" runs from top right to bottom left */
  @property() accessor direction: GridDirection = "diagonal";
  /** Uncover the grid with a growing circle when it first comes into view (attribute: reveal="false" turns it off) */
  @property({ converter: { fromAttribute: (v: string | null) => v !== "false" } }) accessor reveal = true;
  /** Radius of the edge fade, in % of the distance to the corners */
  @property({ type: Number }) accessor fade = 70;

  /** @internal The reveal has started */
  @state() accessor shown = false;

  private io?: IntersectionObserver;
  private stopWatch?: () => void;

  override connectedCallback() {
    super.connectedCallback();
    // The drift is an endless CSS animation: hold it while nobody can see it (an attribute, so no render)
    this.stopWatch = watchOnScreen(this, (active) => this.toggleAttribute("data-paused", !active));
    this.watchReveal();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.stopWatch?.();
    this.io?.disconnect();
    this.io = undefined;
  }

  /** Reveal once the grid scrolls into view (right away with reduced motion or without IntersectionObserver) */
  private watchReveal() {
    this.io?.disconnect();
    this.io = undefined;
    if (!this.reveal || this.shown) {
      this.shown = true;
      return;
    }
    if (typeof IntersectionObserver === "undefined" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      this.shown = true;
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          this.shown = true;
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    this.io = io;
    io.observe(this);
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (changed.has("reveal") && changed.get("reveal") !== undefined && this.isConnected) this.watchReveal();
    const [dx, dy] = offsets[this.direction] ?? offsets.diagonal;
    const size = this.size;
    const set = (name: string, value: string) => this.style.setProperty(name, value);
    set("--tc-grid-background-size", `${size}px`);
    set("--tc-grid-background-dx", `${dx * size}px`);
    set("--tc-grid-background-dy", `${dy * size}px`);
    set("--tc-grid-background-speed", `${Math.max(this.speed, 0)}s`);
    set("--tc-grid-background-passes", Number.isFinite(this.playFor) && this.speed > 0 ? String(Math.max(this.playFor, 0) / this.speed) : "infinite");
    set("--tc-grid-background-fade", `${this.fade}%`);
    if (this.color) set("--tc-grid-background-line", this.color);
    else this.style.removeProperty("--tc-grid-background-line");
    this.toggleAttribute("data-reveal", this.reveal);
    this.toggleAttribute("data-shown", this.shown || !this.reveal);
    this.toggleAttribute("data-static", !(this.speed > 0));
  }

  protected override render() {
    return html`<div class="ui-gb-grid" aria-hidden="true"><div class="ui-gb-reveal"><div class="ui-gb-lines"></div></div></div>`;
  }

  static override css = /* css */ `
/* Theme: the --tc- fallbacks use light-dark(), which follows color-scheme */
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

@property --tc-grid-background-r {
  syntax: "<percentage>";
  inherits: false;
  initial-value: 0%;
}

[data-ui="gb"] {
  /* The reveal's length; --tc-grid-background-passes (drift loops before it rests) comes from playFor */
  --tc-grid-background-reveal: 1.6s;
  position: relative;
  isolation: isolate;
  overflow: hidden;
}

/* Edge fade: a still radial mask, so the drifting lines dissolve towards the sides */
.ui-gb-grid {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  -webkit-mask-image: radial-gradient(ellipse at center, #000 20%, transparent var(--tc-grid-background-fade));
  mask-image: radial-gradient(ellipse at center, #000 20%, transparent var(--tc-grid-background-fade));
}

/* Reveal: a circle from the center grows until it reaches the corners */
.ui-gb-reveal {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
[data-ui="gb"][data-reveal] .ui-gb-reveal {
  --tc-grid-background-r: 0%;
  -webkit-mask-image: radial-gradient(circle farthest-corner at center, #000 var(--tc-grid-background-r), transparent calc(var(--tc-grid-background-r) + 12%));
  mask-image: radial-gradient(circle farthest-corner at center, #000 var(--tc-grid-background-r), transparent calc(var(--tc-grid-background-r) + 12%));
}
[data-ui="gb"][data-reveal][data-shown] .ui-gb-reveal {
  animation: ui-gb-reveal var(--tc-grid-background-reveal) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)) forwards;
}

/* The lines: one cell larger on every side, so a shift by one cell loops seamlessly */
.ui-gb-lines {
  position: absolute;
  inset: calc(var(--tc-grid-background-size) * -1);
  background-image:
    linear-gradient(to right, var(--tc-grid-background-line, var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07)))) 1px, transparent 1px),
    linear-gradient(to bottom, var(--tc-grid-background-line, var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07)))) 1px, transparent 1px);
  background-size: var(--tc-grid-background-size) var(--tc-grid-background-size);
  animation: ui-gb-drift var(--tc-grid-background-speed) linear var(--tc-grid-background-passes, infinite) forwards;
}
[data-ui="gb"][data-static] .ui-gb-lines {
  animation: none;
}
[data-ui="gb"][data-paused] .ui-gb-lines,
[data-ui="gb"][data-paused] .ui-gb-reveal {
  animation-play-state: paused;
}

/* The content (the React file's .ui-gb-content div): every child the page put in, above the grid */
[data-ui="gb"] > :not(.ui-gb-grid) {
  position: relative;
  z-index: 1;
  height: 100%;
}

@keyframes ui-gb-drift {
  from { transform: translate3d(0, 0, 0); }
  to { transform: translate3d(var(--tc-grid-background-dx), var(--tc-grid-background-dy), 0); }
}
@keyframes ui-gb-reveal {
  from { --tc-grid-background-r: 0%; }
  to { --tc-grid-background-r: 100%; }
}

@media (prefers-reduced-motion: reduce) {
  .ui-gb-lines { animation: none; }
  [data-ui="gb"][data-reveal] .ui-gb-reveal { -webkit-mask-image: none; mask-image: none; animation: none; }
}

`;
}

if (!customElements.get("tc-grid-background")) customElements.define("tc-grid-background", TcGridBackground);

declare global {
  interface HTMLElementTagNameMap {
    "tc-grid-background": TcGridBackground;
  }
}
