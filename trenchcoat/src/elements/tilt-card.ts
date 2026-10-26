import { html, nothing, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";

/*
 * <tc-tilt-card> – the Lit port of motion/tilt-card.tsx: a card that tilts in 3D towards the pointer. A soft glare
 * follows the pointer and the card lifts a little; on leave it springs back smoothly.
 *
 *   <tc-tilt-card max-tilt="12"><div class="my-card">…</div></tc-tilt-card>
 *
 * Give it element children (text alone can't take a transform); the React wrapper puts its children in one div, as
 * the React component's card div held them.
 *
 * The card's content is the caller's children, and they stay where the framework put them: the host is the
 * untransformed wrapper the pointer is measured against (as in React), and every child – the content, the element's
 * shadow layer and its glare – is a layer in one grid cell that takes the same tilt (one transform per layer, the
 * same centre). So the CSS differs from the React file's in structure: the tilt variables and data-active live on the
 * host, and `[data-ui="tlt"] > *` carries the transform the React `.ui-tlt-card` did; content layers get the card's
 * rounded clip.
 * Pointer moves are batched with requestAnimationFrame and written to CSS variables (--tc-tilt-card-rx, -ry, -gx, -gy).
 * Touch pointers don't tilt. Keyboard focus inside the card gives a slight lift. Reduced motion: no tilt, only the
 * shadow changes (also when the setting changes while the page is open).
 */

/**
 * A card that tilts in 3D towards the pointer, with a glare that follows it. Its content is its children.
 * @tag tc-tilt-card
 */
export class TcTiltCard extends TcElement {
  static override ui = "tlt";
  static override looks = false;

  /** Maximum tilt in degrees */
  @property({ type: Number, attribute: "max-tilt" }) accessor maxTilt = 10;
  /** Show a soft glare that follows the pointer (attribute: glare="false" turns it off) */
  @property({ converter: { fromAttribute: (v: string | null) => v !== "false" } }) accessor glare = true;
  /** Scale while the pointer is over the card */
  @property({ type: Number }) accessor scale = 1.02;
  /** Perspective distance in px – smaller is more dramatic */
  @property({ type: Number }) accessor perspective = 900;

  private frame = 0;
  private point: { x: number; y: number } | null = null;
  private still = false;
  private mq?: MediaQueryList;

  private sync = () => {
    this.still = !!this.mq?.matches;
    // Turned on mid-tilt: drop the tilt that is showing
    if (this.still) this.settle();
  };

  override connectedCallback() {
    super.connectedCallback();
    this.mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    this.sync();
    this.mq?.addEventListener("change", this.sync);
    this.addEventListener("pointermove", this.onMove);
    this.addEventListener("pointerleave", this.onLeave);
    this.addEventListener("pointercancel", this.onLeave);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.mq?.removeEventListener("change", this.sync);
    this.removeEventListener("pointermove", this.onMove);
    this.removeEventListener("pointerleave", this.onLeave);
    this.removeEventListener("pointercancel", this.onLeave);
    cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  /** Back to rest: no pending frame, no tilt */
  private settle() {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.point = null;
    this.style.setProperty("--tc-tilt-card-rx", "0deg");
    this.style.setProperty("--tc-tilt-card-ry", "0deg");
  }

  // Read the pointer relative to the untransformed host, so the tilt itself never feeds back
  private apply = () => {
    this.frame = 0;
    const p = this.point;
    if (!p) return;
    const box = this.getBoundingClientRect();
    const x = Math.min(Math.max((p.x - box.left) / box.width, 0), 1);
    const y = Math.min(Math.max((p.y - box.top) / box.height, 0), 1);
    this.style.setProperty("--tc-tilt-card-rx", `${((0.5 - y) * 2 * this.maxTilt).toFixed(2)}deg`);
    this.style.setProperty("--tc-tilt-card-ry", `${((x - 0.5) * 2 * this.maxTilt).toFixed(2)}deg`);
    this.style.setProperty("--tc-tilt-card-gx", `${(x * 100).toFixed(1)}%`);
    this.style.setProperty("--tc-tilt-card-gy", `${(y * 100).toFixed(1)}%`);
  };

  private onMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    if (!this.hasAttribute("data-active")) this.setAttribute("data-active", "");
    if (this.still) return;
    this.point = { x: e.clientX, y: e.clientY };
    if (!this.frame) this.frame = requestAnimationFrame(this.apply);
  };

  private onLeave = () => {
    this.settle();
    this.removeAttribute("data-active");
  };

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (changed.has("perspective")) this.style.setProperty("--tc-tilt-card-perspective", `${this.perspective}px`);
    if (changed.has("scale")) this.style.setProperty("--tc-tilt-card-scale", String(this.scale));
  }

  protected override render() {
    // The card's shadow, behind the content, and the glare in front of it; the closing comment keeps the glare's
    // part from reaching children a framework appends later
    return html`<span class="ui-tlt-card" aria-hidden="true"></span>${this.glare ? html`<span class="ui-tlt-glare" aria-hidden="true"></span>` : nothing}<!---->`;
  }

  static override css = /* css */ `
/* Theme: the --tc- fallbacks use light-dark(), which follows color-scheme */
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

[data-ui="tlt"] {
  --tc-tilt-card-shadow: 0 1px 2px light-dark(rgba(0, 0, 0, 0.06), rgba(0, 0, 0, 0.4)), 0 8px 24px -12px light-dark(rgba(0, 0, 0, 0.18), rgba(0, 0, 0, 0.6));
  /* Lifted: a deeper, softer shadow while tilting */
  --tc-tilt-card-shadow-active: 0 2px 4px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 24px 48px -16px light-dark(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.75));
  --tc-tilt-card-glare-color: light-dark(rgba(255, 255, 255, 0.32), rgba(255, 255, 255, 0.24));
  --tc-tilt-card-rx: 0deg;
  --tc-tilt-card-ry: 0deg;
  --tc-tilt-card-gx: 50%;
  --tc-tilt-card-gy: 50%;
  --tc-tilt-card-lift: 0px;
  --tc-tilt-card-s: 1;
  /* The card: every layer (content, shadow, glare) in one cell, so they share a size and a centre */
  display: inline-grid;
  perspective: var(--tc-tilt-card-perspective);
}

/* Every layer takes the same tilt */
[data-ui="tlt"] > * {
  grid-area: 1 / 1;
  position: relative;
  transform: translateY(var(--tc-tilt-card-lift)) rotateX(var(--tc-tilt-card-rx)) rotateY(var(--tc-tilt-card-ry)) scale(var(--tc-tilt-card-s));
  /* The return: a soft spring back to rest */
  transition: transform var(--tc-duration-reveal, 700ms) var(--tc-ease-spring, cubic-bezier(0.34, 1.56, 0.64, 1)), box-shadow var(--tc-duration-slowest, 560ms) var(--tc-ease-standard, ease);
  will-change: transform;
}
/* The content: clipped to the card's corners */
[data-ui="tlt"] > :not(.ui-tlt-card, .ui-tlt-glare) {
  overflow: hidden;
  border-radius: var(--tc-radius-3xl, 20px);
}
.ui-tlt-card {
  border-radius: var(--tc-radius-3xl, 20px);
  box-shadow: var(--tc-tilt-card-shadow);
  pointer-events: none;
}

/* While the pointer is over it: follow closely, with just enough easing to smooth the steps */
[data-ui="tlt"][data-active] {
  --tc-tilt-card-s: var(--tc-tilt-card-scale);
  --tc-tilt-card-lift: -2px;
}
[data-ui="tlt"][data-active] > * {
  transition: transform var(--tc-duration-fast, 150ms) var(--tc-ease-decelerate, cubic-bezier(0, 0, 0.58, 1)), box-shadow var(--tc-duration-slow, 320ms) var(--tc-ease-standard, ease);
}
[data-ui="tlt"][data-active] > .ui-tlt-card { box-shadow: var(--tc-tilt-card-shadow-active); }

/* Keyboard focus inside the card: a slight lift */
[data-ui="tlt"]:has(:focus-visible) { --tc-tilt-card-lift: -4px; }
[data-ui="tlt"]:has(:focus-visible) > .ui-tlt-card { box-shadow: var(--tc-tilt-card-shadow-active); }

.ui-tlt-glare {
  z-index: 1;
  border-radius: var(--tc-radius-3xl, 20px);
  pointer-events: none;
  background: radial-gradient(circle at var(--tc-tilt-card-gx) var(--tc-tilt-card-gy), var(--tc-tilt-card-glare-color), transparent 55%);
  mix-blend-mode: soft-light;
  opacity: 0;
  transition: opacity var(--tc-duration-slower, 420ms) var(--tc-ease-standard, ease), transform var(--tc-duration-reveal, 700ms) var(--tc-ease-spring, cubic-bezier(0.34, 1.56, 0.64, 1));
}
[data-ui="tlt"][data-active] > .ui-tlt-glare { opacity: 1; }

@media (hover: none), (pointer: coarse) {
  [data-ui="tlt"][data-active] { --tc-tilt-card-s: 1; }
}

@media (prefers-reduced-motion: reduce) {
  [data-ui="tlt"] > *,
  [data-ui="tlt"][data-active] > *,
  [data-ui="tlt"]:has(:focus-visible) > * {
    transform: none;
    transition: box-shadow var(--tc-duration-slow, 320ms) var(--tc-ease-standard, ease);
  }
  .ui-tlt-glare { display: none; }
}
`;
}

if (!customElements.get("tc-tilt-card")) customElements.define("tc-tilt-card", TcTiltCard);

declare global {
  interface HTMLElementTagNameMap {
    "tc-tilt-card": TcTiltCard;
  }
}
