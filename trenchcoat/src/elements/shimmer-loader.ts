import { html, nothing, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";

/*
 * <tc-skeleton> and <tc-shimmer-text> – the Lit port of motion/shimmer-loader.tsx: loading states with a soft light
 * sweep. Skeleton draws a placeholder block with a band of light that moves across it; every skeleton starts together
 * and runs on the same beat. ShimmerText runs a brighter band through the letters of a label, like an AI "Thinking…"
 * state – the label itself stays readable the whole time.
 *
 *   <tc-skeleton circle width="40"></tc-skeleton>
 *   <tc-shimmer-text text="Thinking…"></tc-shimmer-text>
 *
 * The bands move on transform only, run a few passes and then rest (WCAG 2.2.2; set --tc-shimmer-loader-passes to
 * change that), and hold while the element is off screen (data-off). Reduced motion (live, via the media query) shows
 * plain blocks and plain text. The React file had two components, so this module has two elements, sharing one
 * stylesheet.
 */

const len = (v: number | string | undefined) => (typeof v === "number" ? `${v}px` : v);
/** Attributes are strings: "40" is a number of px, as the React prop's 40 was */
const lengthConverter = { fromAttribute: (v: string | null) => (v == null ? undefined : /^\d+(\.\d+)?$/.test(v) ? Number(v) : v) };

/* One observer for every shimmer on the page: off screen, an element gets data-off and its sweep holds */
let observer: IntersectionObserver | null = null;
function watch(el: Element) {
  if (typeof IntersectionObserver !== "function") return () => {};
  observer ??= new IntersectionObserver((entries) => {
    for (const e of entries) e.target.toggleAttribute("data-off", !e.isIntersecting);
  });
  observer.observe(el);
  return () => observer?.unobserve(el);
}

/**
 * A placeholder block with a soft band of light sweeping over it. Hidden from assistive tech unless the page sets
 * aria-hidden itself.
 * @tag tc-skeleton
 */
export class TcSkeleton extends TcElement {
  static override ui = "shm";
  static override looks = false;

  /** Width – a number is px, a string any CSS length; defaults to 100% */
  @property({ converter: lengthConverter }) accessor width: number | string | undefined = undefined;
  /** Height – a number is px, a string any CSS length; defaults to 12px */
  @property({ converter: lengthConverter }) accessor height: number | string | undefined = undefined;
  /** Corner radius; defaults to 6px */
  @property({ converter: lengthConverter }) accessor radius: number | string | undefined = undefined;
  /** Round shape, e.g. for avatars – uses width for both sides */
  @property({ type: Boolean }) accessor circle = false;

  private stop?: () => void;

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("aria-hidden")) this.setAttribute("aria-hidden", "true");
    this.stop = watch(this);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.stop?.();
    this.stop = undefined;
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (!changed.has("width") && !changed.has("height") && !changed.has("radius") && !changed.has("circle")) return;
    const w = len(this.width);
    const set = (name: string, value: string | undefined) => (value === undefined ? this.style.removeProperty(name) : this.style.setProperty(name, value));
    set("width", w);
    set("height", this.circle ? (w ?? len(this.height)) : len(this.height));
    set("border-radius", this.circle ? "50%" : len(this.radius));
  }

  protected override render() {
    return nothing;
  }

  static override css = /* css */ `
/* Theme: the --tc- fallbacks use light-dark(), which follows color-scheme */
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

[data-ui="shm"],
[data-ui="shm-text"] {
  /* Opaque placeholder blocks, so they read on any card; a soft band of light sweeps over them */
  --tc-shimmer-loader-base: light-dark(#ececec, #2f2f33);
  --tc-shimmer-loader-glow: var(--tc-shimmer, light-dark(rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.28)));
  /* The band in the label: the strong text colour, so the label never drops below 4.5:1 */
  --tc-shimmer-loader-text-glow: var(--tc-text-strong, light-dark(#171717, #f5f5f5));
  --tc-shimmer-loader-dur: var(--tc-duration-shimmer, 1600ms);
  /* Passes before the sweep rests (2.2.2: a few seconds); \`infinite\` only with a pause of your own */
  --tc-shimmer-loader-passes: 3;
}

/* Skeleton: the band is a pseudo-element moved on transform, clipped by the block */
[data-ui="shm"] {
  position: relative;
  display: block;
  flex: none;
  width: 100%;
  height: 12px;
  max-width: 100%;
  overflow: hidden;
  border-radius: var(--tc-radius-sm, 6px);
  background-color: var(--tc-shimmer-loader-base);
}
[data-ui="shm"]::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(100deg, transparent 20%, var(--tc-shimmer-loader-glow) 50%, transparent 80%);
  transform: translateX(-100%);
  animation: ui-shm-sweep var(--tc-shimmer-loader-dur) linear var(--tc-shimmer-loader-passes) both;
}
@keyframes ui-shm-sweep {
  from { transform: translateX(-100%); }
  to { transform: translateX(100%); }
}

/* Text: the label in a readable muted colour; the band window (40% wide) slides right while the copy inside it
   slides left by the same distance, so the brighter letters line up with the real ones */
[data-ui="shm-text"] {
  position: relative;
  display: inline-block;
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
}
.ui-shm-text__clip {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}
.ui-shm-text__band {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 40%;
  overflow: hidden;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 50%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 50%, transparent);
  transform: translateX(-100%);
  animation: ui-shm-band var(--tc-shimmer-loader-text-dur, 1.6s) linear var(--tc-shimmer-loader-passes) both;
}
.ui-shm-text__copy {
  position: absolute;
  top: 0;
  left: 0;
  width: 250%;
  color: var(--tc-shimmer-loader-text-glow);
  -webkit-text-fill-color: currentColor;
  transform: translateX(40%);
  animation: ui-shm-copy var(--tc-shimmer-loader-text-dur, 1.6s) linear var(--tc-shimmer-loader-passes) both;
}
@keyframes ui-shm-band {
  from { transform: translateX(-100%); }
  to { transform: translateX(250%); }
}
@keyframes ui-shm-copy {
  from { transform: translateX(40%); }
  to { transform: translateX(-100%); }
}

/* Off screen: hold the sweep */
[data-ui="shm"][data-off]::after,
[data-ui="shm-text"][data-off] .ui-shm-text__band,
[data-ui="shm-text"][data-off] .ui-shm-text__copy {
  animation-play-state: paused;
}

@media (prefers-reduced-motion: reduce) {
  [data-ui="shm"]::after,
  .ui-shm-text__clip { display: none; }
}
`;
}

/**
 * A label with a brighter band running through its letters, like an AI "Thinking…" state. The label stays readable;
 * the brighter copy in the band is hidden from assistive tech.
 * @tag tc-shimmer-text
 */
export class TcShimmerText extends TcElement {
  static override ui = "shm-text";
  static override looks = false;
  static override css = TcSkeleton.css;

  /** The label */
  @property() accessor text = "";
  /** Rich content instead of `text`: an element that's cloned for the label and for the band's copy */
  @property({ attribute: false }) accessor content: Element | undefined = undefined;
  /** Seconds for one pass of the highlight */
  @property({ type: Number }) accessor duration = 1.6;

  private stop?: () => void;

  override connectedCallback() {
    super.connectedCallback();
    this.stop = watch(this);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.stop?.();
    this.stop = undefined;
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (changed.has("duration")) this.style.setProperty("--tc-shimmer-loader-text-dur", `${this.duration}s`);
  }

  private label() {
    return this.content ? this.content.cloneNode(true) : this.text;
  }

  protected override render() {
    // The band: a window that slides across, showing a brighter copy of the label that stays in place
    return html`${this.label()}<span class="ui-shm-text__clip" aria-hidden="true"><span class="ui-shm-text__band"><span class="ui-shm-text__copy">${this.label()}</span></span></span>`;
  }
}

if (!customElements.get("tc-skeleton")) customElements.define("tc-skeleton", TcSkeleton);
if (!customElements.get("tc-shimmer-text")) customElements.define("tc-shimmer-text", TcShimmerText);

declare global {
  interface HTMLElementTagNameMap {
    "tc-skeleton": TcSkeleton;
    "tc-shimmer-text": TcShimmerText;
  }
}
