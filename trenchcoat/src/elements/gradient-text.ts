import { html, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";

/*
 * <tc-gradient-text> – the Lit port of motion/gradient-text.tsx. The letters are a mask over a liquid gradient: a few
 * soft colour blobs drift over a two-colour base, so the word keeps flowing while the glyphs stay crisp. On first view
 * the colour can sweep across the word from left to right before it settles into the flow. Font, size and weight
 * come from the parent.
 *
 *   <tc-gradient-text as="h1" text="Ship faster"></tc-gradient-text>
 *
 * The flow runs for `playFor` seconds (5 by default, WCAG 2.2.2) and comes to rest; it pauses while the text is off
 * screen or its tab is hidden (data-paused, no render); reduced motion shows the finished gradient. The default
 * colours keep 3:1 for large display text – for body-size text pass colours with 4.5:1 against your background.
 * The React version rendered `as` as its root tag; here the host is the root and h1/h2 give it role="heading" with
 * the level (the CSS already resets the tag's margins and font, so the layout is the same).
 */

export type GradientTextTag = "span" | "h1" | "h2" | "p";

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
 * Text filled with a slowly flowing liquid gradient, swept in from the left when it is first seen.
 * @tag tc-gradient-text
 */
export class TcGradientText extends TcElement {
  static override ui = "gt";
  static override looks = false;

  /** The text */
  @property() accessor text = "";
  /** Rich content instead of `text`: an element that's cloned for the text and for its gradient copy */
  @property({ attribute: false }) accessor content: Element | undefined = undefined;
  /** Gradient start, end and up to two blob colours: [start, end, blob, blob] */
  @property({ attribute: false }) accessor colors: string[] | undefined = undefined;
  /** Seconds per flow cycle */
  @property({ type: Number }) accessor speed = 8;
  /** Seconds the flow runs before it rests (on the nearest quarter cycle below); Infinity never stops – then give
   * users a way to pause it (WCAG 2.2.2) */
  @property({ type: Number, attribute: "play-for" }) accessor playFor = 5;
  /** Sweep the colour in from left to right when the text scrolls into view (attribute: sweep="false" turns it off) */
  @property({ converter: { fromAttribute: (v: string | null) => v !== "false" } }) accessor sweep = true;
  /** What the text is: inline text, a paragraph or a heading (h1, h2: the host becomes a heading of that level) */
  @property({ reflect: true }) accessor as: GradientTextTag = "span";

  /** @internal "idle" – plain text, waiting to be seen; "in" – the colour sweeps (or simply is) in */
  @state() accessor phase: "idle" | "in" = "idle";

  private io?: IntersectionObserver;
  private stopWatch?: () => void;

  override connectedCallback() {
    super.connectedCallback();
    // The flow is an endless CSS animation: hold it while nobody can see it (an attribute, so no render)
    this.stopWatch = watchOnScreen(this, (active) => this.toggleAttribute("data-paused", !active));
    this.watchSweep();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.stopWatch?.();
    this.io?.disconnect();
    this.io = undefined;
  }

  /** Waits for the text to be seen before the colour sweeps in */
  private watchSweep() {
    this.io?.disconnect();
    this.io = undefined;
    if (!this.sweep || typeof IntersectionObserver === "undefined") {
      this.phase = "in";
      return;
    }
    if (this.phase === "in") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          this.phase = "in";
          io.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    this.io = io;
    io.observe(this);
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (changed.has("sweep") && changed.get("sweep") !== undefined && this.isConnected) this.watchSweep();
    this.dataset.state = this.sweep ? this.phase : "in";
    this.toggleAttribute("data-sweep", this.sweep);
    // Whole quarter cycles: every keyframe of the flow is a resting point, so it never stops mid-move
    const passes = Number.isFinite(this.playFor)
      ? String(Math.max(0.25, Math.floor((Math.max(this.playFor, 0) / Math.max(this.speed, 0.1)) * 4) / 4))
      : "infinite";
    this.style.setProperty("--tc-gradient-text-speed", `${this.speed}s`);
    this.style.setProperty("--tc-gradient-text-passes", passes);
    if (changed.has("colors")) {
      const names = ["--tc-gradient-text-c1", "--tc-gradient-text-c2", "--tc-gradient-text-c3", "--tc-gradient-text-c4"];
      if (this.colors?.length) {
        const [a, b = a, c = a, d = b] = this.colors;
        [a, b, c, d].forEach((v, i) => this.style.setProperty(names[i], v));
      } else names.forEach((n) => this.style.removeProperty(n));
    }
    const level = /^h([12])$/.exec(this.as)?.[1];
    if (level) {
      this.setAttribute("role", "heading");
      this.setAttribute("aria-level", level);
    } else if (this.getAttribute("role") === "heading") {
      this.removeAttribute("role");
      this.removeAttribute("aria-level");
    }
  }

  private label() {
    return this.content ? this.content.cloneNode(true) : this.text;
  }

  protected override render() {
    // The real text: sets the size, carries selection and screen readers, shows until the colour arrives; then the
    // same text again, filled with the flowing gradient
    return html`<span class="ui-gt__base">${this.label()}</span><span class="ui-gt__fill" aria-hidden="true">${this.label()}</span>`;
  }

  static override css = /* css */ `
/* Theme: the --tc- fallbacks use light-dark(), which follows color-scheme */
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

[data-ui="gt"] {
  --tc-gradient-text-c1: light-dark(#dd0674, #f472b6);
  --tc-gradient-text-c2: light-dark(#5e3ee0, #a78bfa);
  --tc-gradient-text-c3: light-dark(#ec4899, #f9a8d4);
  --tc-gradient-text-c4: light-dark(#7c5cff, #c4b5fd);
  --tc-gradient-text-sweep: 1100ms;
  position: relative;
  display: inline-block;
  margin: 0;
  font: inherit;
  letter-spacing: inherit;
}
.ui-gt__base {
  color: inherit;
  transition: color var(--tc-duration-moderate, 260ms) var(--tc-ease-standard, ease);
}
.ui-gt__fill {
  position: absolute;
  inset: 0;
  pointer-events: none;
  user-select: none;
  color: transparent;
  -webkit-text-fill-color: transparent;
  background-image:
    radial-gradient(closest-side, var(--tc-gradient-text-c3), transparent),
    radial-gradient(closest-side, var(--tc-gradient-text-c4), transparent),
    radial-gradient(closest-side, var(--tc-gradient-text-c1), transparent),
    linear-gradient(100deg, var(--tc-gradient-text-c1) 10%, var(--tc-gradient-text-c2) 90%);
  background-size: 70% 170%, 80% 190%, 60% 160%, 100% 100%;
  background-repeat: no-repeat;
  background-position: -20% 30%, 120% 70%, 50% -40%, 0 0;
  -webkit-background-clip: text;
  background-clip: text;
  /* A little room around the box, so overhanging glyphs are not cut by the sweep */
  clip-path: inset(-0.25em -0.25em -0.25em -0.25em);
  animation: ui-gt-flow var(--tc-gradient-text-speed) var(--tc-ease-in-out, cubic-bezier(0.65, 0, 0.35, 1)) var(--tc-gradient-text-passes, infinite) forwards;
}

/* Sweep: the fill is hidden until the text is seen, then wipes in from the left */
[data-ui="gt"][data-sweep][data-state="idle"] .ui-gt__fill {
  clip-path: inset(-0.25em 100% -0.25em -0.25em);
}
[data-ui="gt"][data-sweep] .ui-gt__fill {
  transition: clip-path var(--tc-gradient-text-sweep) var(--tc-ease-in-out, cubic-bezier(0.65, 0, 0.35, 1));
}
[data-ui="gt"][data-state="in"] .ui-gt__base {
  color: transparent;
}
[data-ui="gt"][data-sweep][data-state="in"] .ui-gt__base {
  transition-delay: calc(var(--tc-gradient-text-sweep) - var(--tc-duration-base, 200ms));
}

[data-ui="gt"][data-paused] .ui-gt__fill { animation-play-state: paused; }

/* The blobs drift on their own paths; the base gradient stays put */
@keyframes ui-gt-flow {
  0%, 100% { background-position: -20% 30%, 120% 70%, 50% -40%, 0 0; }
  25% { background-position: 40% 110%, 60% -10%, 110% 60%, 0 0; }
  50% { background-position: 120% 40%, -20% 40%, 40% 140%, 0 0; }
  75% { background-position: 60% -30%, 30% 120%, -10% 30%, 0 0; }
}

/* Reduced motion: the finished gradient, standing still */
@media (prefers-reduced-motion: reduce) {
  [data-ui="gt"] .ui-gt__fill,
  [data-ui="gt"][data-sweep][data-state="idle"] .ui-gt__fill {
    animation: none;
    transition: none;
    clip-path: inset(-0.25em -0.25em -0.25em -0.25em);
  }
  [data-ui="gt"] .ui-gt__base,
  [data-ui="gt"][data-sweep] .ui-gt__base {
    color: transparent;
    transition: none;
  }
}
`;
}

if (!customElements.get("tc-gradient-text")) customElements.define("tc-gradient-text", TcGradientText);

declare global {
  interface HTMLElementTagNameMap {
    "tc-gradient-text": TcGradientText;
  }
}
