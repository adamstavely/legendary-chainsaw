import { html, svg, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";

/*
 * <tc-gradient-floor> – the Lit port of motion/gradient-floor.tsx: a blurred colour gradient that glows up from the
 * bottom edge. Two layers: a colour layer and a white layer on top that lightens it with plus-lighter. Their peaks and
 * valleys rise and fall against each other while both layers drift sideways. The floor scales with the width of its
 * container.
 *
 *   <tc-gradient-floor><div class="hero">…</div></tc-gradient-floor>
 *
 * The content is the caller's children, and they stay where the framework put them: every child sits above the
 * floor (the React file's .ui-gf-content rule now applies to every child; the React wrapper puts its children in one
 * div, as the React component did).
 * It moves for `playFor` seconds (5 by default, WCAG 2.2.2), slows down and rests; Infinity keeps it going when your
 * page offers a way to pause it. Animations only run while the floor is on screen and its tab is visible;
 * prefers-reduced-motion keeps it still (also when the setting changes while the page is open).
 */

export type GradientFloorColors = [string, string, string];

/** Base points of both shapes (design frame 2200 wide): peaks (l, m, r) and valleys (vL, vR) move independently */
type Shape = {
  k: number;
  v1: [number, number]; c: [number, number]; l: [number, number]; bottom: number; r: [number, number];
  v4: [number, number]; v3: [number, number]; m2: [number, number]; m1: [number, number]; v2: [number, number];
};
const COLOR: Shape = {
  k: 1, v1: [926.8, 565.8], c: [302.1, 297.3], l: [291.3, 291.3], bottom: 1222.8, r: [3155.8, 361.3],
  v4: [2493.8, 565.8], v3: [2189.3, 565.8], m2: [1898.8, 428.8], m1: [1510.8, 428.8], v2: [1230.8, 565.8],
};
const LIGHT: Shape = {
  k: 0.8427, v1: [781.039, 476.815], c: [254.588, 250.543], l: [245.486, 245.486], bottom: 1030.49, r: [2659.48, 304.477],
  v4: [2101.59, 476.815], v3: [1844.98, 476.815], m2: [1600.17, 361.361], m1: [1273.19, 361.361], v2: [1037.23, 476.815],
};
const PEAK = 110;
/** One sideways drift loop, in ms (--tc-gradient-floor-drift) */
const DRIFT = 2500;
/** The morph eases to a stop over this long at the end of playFor */
const SETTLE = 1500;
const VALLEY = 80;

function shapePath(p: Shape, t: number) {
  const d = {
    l: PEAK * Math.sin(t),
    m: -PEAK * Math.sin(t + 0.5),
    r: PEAK * Math.sin(t + 1),
    vL: VALLEY * Math.sin(t + Math.PI / 2 + 0.25),
    vR: VALLEY * Math.sin(t - Math.PI / 2 + 0.75),
  };
  const y = (pt: [number, number], dy: number) => (pt[1] + dy * p.k).toFixed(1);
  return (
    `M${p.v1[0]} ${y(p.v1, d.vL)}` +
    `C${p.v1[0]} ${y(p.v1, d.vL)} ${p.c[0]} ${y(p.c, d.l)} ${p.l[0]} ${y(p.l, d.l)}` +
    `V${p.bottom}H${p.r[0]}V${y(p.r, d.r)}` +
    `L${p.v4[0]} ${y(p.v4, d.vR)}H${p.v3[0]}V${y(p.v3, d.vR)}` +
    `L${p.m2[0]} ${y(p.m2, d.m)}H${p.m1[0]}V${y(p.m1, d.m)}` +
    `L${p.v2[0]} ${y(p.v2, d.vL)}H${p.v1[0]}V${y(p.v1, d.vL)}Z`
  );
}

/**
 * Calls `onChange(active)` right away and whenever `el` comes into or leaves the viewport or its tab is hidden or shown.
 * Like Trenchcoat's useOnScreen, but it reports to a callback instead of React state, so pausing costs no render.
 */
function watchOnScreen(el: Element, onChange: (active: boolean) => void) {
  let inView = true;
  let last: boolean | undefined;
  // Reports the starting state once, then only real changes
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

/** A length in the 2200 wide design frame, scaled to the container width */
const u = (n: number) => `calc(${n} * 100cqw / 2200)`;

/** Each floor's gradient id is its own */
let next = 0;

/**
 * A blurred colour gradient glowing up from the bottom edge, behind its children.
 * @tag tc-gradient-floor
 */
export class TcGradientFloor extends TcElement {
  static override ui = "gf";
  static override looks = false;

  /** Gradient from the crest down: [top, middle, bottom] */
  @property({ attribute: false }) accessor colors: GradientFloorColors = ["#FF7700", "#FF0055", "#0073FF"];
  /** Seconds per morph loop; 0 keeps the shape still (the sideways drift keeps going) */
  @property({ type: Number }) accessor speed = 3;
  /** Seconds of motion before the floor slows down and rests (rounded to whole drift loops of 2.5 s); Infinity never
   * stops – then give users a way to pause it (WCAG 2.2.2) */
  @property({ type: Number, attribute: "play-for" }) accessor playFor = 5;

  private readonly gid = `ui-gf${next++}`;
  private stopMorph?: () => void;

  private get endless() {
    return !Number.isFinite(this.playFor);
  }
  /** Whole drift loops, so the drift ends on its resting frame; the morph stops at the same moment */
  private get passes() {
    return this.endless ? 0 : Math.max(1, Math.round(Math.max(this.playFor, 0) / (DRIFT / 1000)));
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.stopMorph?.();
    this.stopMorph = undefined;
  }

  override connectedCallback() {
    super.connectedCallback();
    // Back on the page: morph again (the first time, updated() starts it)
    if (this.hasUpdated) this.startMorph();
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    this.style.setProperty("--tc-gradient-floor-passes", this.endless ? "infinite" : String(this.passes));
  }

  protected override updated(changed: PropertyValues<this>) {
    if (!this.stopMorph || changed.has("speed") || changed.has("playFor")) this.startMorph();
  }

  /** Morphs the shapes while the floor is on screen, its tab visible and motion allowed; otherwise every loop pauses */
  private startMorph() {
    this.stopMorph?.();
    const color = this.querySelector<SVGPathElement>(".ui-gf-layer--color path");
    const light = this.querySelector<SVGPathElement>(".ui-gf-layer--light path");
    const { speed, passes, endless } = this;
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let active = true;
    let frame = 0;
    let drawn = 0;
    // Time in motion so far (it doesn't run while paused) and when the morph rests
    let elapsed = 0;
    let last = 0;
    const total = passes * DRIFT;
    const settle = Math.min(SETTLE, total / 2);
    const done = () => !endless && elapsed >= total;
    /** Motion time → morph time: the same, except over the last moments, where it slows to a stop */
    const warp = (e: number) => {
      if (endless || e < total - settle) return e;
      const d = Math.min(e, total) - (total - settle);
      return total - settle + d - (d * d) / (2 * settle);
    };
    const draw = (t: number) => {
      color?.setAttribute("d", shapePath(COLOR, t));
      light?.setAttribute("d", shapePath(LIGHT, t));
    };
    const tick = (now: number) => {
      // Frames are capped at 100 ms, so a long gap (a stalled tab) doesn't skip ahead
      if (last) elapsed += Math.min(now - last, 100);
      last = now;
      if (done()) {
        frame = 0;
        draw((warp(total) / (speed * 1000)) * Math.PI * 2);
        return;
      }
      frame = requestAnimationFrame(tick);
      // The shapes move slowly and sit under a heavy blur – 30 redraws a second look the same as 60
      if (now - drawn < 32) return;
      drawn = now;
      draw((warp(elapsed) / (speed * 1000)) * Math.PI * 2);
    };
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      this.toggleAttribute("data-paused", !active);
      const still = !!mq?.matches;
      // Reduced motion (turned on now or from the start) rests on the first shape
      if (still) draw(0);
      if (active && speed > 0 && !still && !done()) frame = requestAnimationFrame(tick);
    };
    const stop = watchOnScreen(this, (next) => {
      active = next;
      sync();
    });
    mq?.addEventListener?.("change", sync);
    this.stopMorph = () => {
      stop();
      mq?.removeEventListener?.("change", sync);
      cancelAnimationFrame(frame);
    };
  }

  protected override render() {
    const [c0, c1, c2] = this.colors;
    return html`<div class="ui-gf-layer ui-gf-layer--color" aria-hidden="true">
        <div class="ui-gf-bleed">
          <svg viewBox="0 0 3447.1 1514.1" preserveAspectRatio="none">
            ${svg`<defs>
              <linearGradient id=${`${this.gid}-fill`} x1="1723.8" y1="423.3" x2="1723.8" y2="894.3" gradientUnits="userSpaceOnUse">
                <stop stop-color=${c0}></stop>
                <stop offset="0.302885" stop-color=${c1}></stop>
                <stop offset="0.673077" stop-color=${c2}></stop>
              </linearGradient>
            </defs>
            <path d=${shapePath(COLOR, 0)} fill=${`url(#${this.gid}-fill)`}></path>`}
          </svg>
        </div>
      </div>
      <div class="ui-gf-layer ui-gf-layer--light" aria-hidden="true">
        <div class="ui-gf-bleed">
          <svg viewBox="0 0 2904.96 1275.97" preserveAspectRatio="none">
            ${svg`<path d=${shapePath(LIGHT, 0)} fill="#fff" fill-opacity="0.8"></path>`}
          </svg>
        </div>
      </div>`;
  }

  static override css = /* css */ `
/* Theme: the --tc- fallbacks use light-dark(), which follows color-scheme */
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }
[data-ui="gf"] {
  position: relative;
  container-type: inline-size;
  overflow: hidden;
  /* Its own group, so plus-lighter only lightens the floor and the background below it */
  isolation: isolate;
  --tc-gradient-floor-bg: light-dark(#fafafa, #111113);
  /* One sideways drift loop (DRIFT in the code); --tc-gradient-floor-passes comes from playFor */
  --tc-gradient-floor-drift: 2.5s;
  background: var(--tc-gradient-floor-bg);
}
.ui-gf-layer { position: absolute; pointer-events: none; }
/* Anchored to the bottom edge */
.ui-gf-layer--color { left: ${u(-290)}; bottom: ${u(-484.5)}; width: ${u(2864.5)}; height: ${u(931.5)}; }
.ui-gf-layer--light { left: ${u(-65)}; bottom: ${u(-507)}; width: ${u(2414)}; height: ${u(785)}; mix-blend-mode: plus-lighter; }
.ui-gf-bleed { position: absolute; inset: -31.27% -10.17%; transform-origin: 50% 70%; will-change: transform; }
/* The floor is so soft that it can be drawn at a quarter of its size and scaled up 4× on the GPU –
   it looks the same, but every redraw of the moving shapes costs about a sixteenth */
.ui-gf-bleed svg {
  position: absolute;
  top: 0;
  left: 0;
  display: block;
  width: 25%;
  height: 25%;
  overflow: visible;
  transform: scale(4);
  transform-origin: 0 0;
  will-change: transform;
}
.ui-gf-layer--color svg { filter: blur(calc(${u(145.65)} / 4)); }
.ui-gf-layer--light svg { filter: blur(calc(${u(122.74)} / 4)); }
/* Both layers drift on the same beat; the light one moves a little less */
.ui-gf-layer--color .ui-gf-bleed { animation: ui-gf-drift-color var(--tc-gradient-floor-drift) var(--tc-ease-in-out, cubic-bezier(0.65, 0, 0.35, 1)) var(--tc-gradient-floor-passes, infinite); }
.ui-gf-layer--light .ui-gf-bleed { animation: ui-gf-drift-light var(--tc-gradient-floor-drift) var(--tc-ease-in-out, cubic-bezier(0.65, 0, 0.35, 1)) var(--tc-gradient-floor-passes, infinite); }
@keyframes ui-gf-drift-color {
  0%, 100% { transform: translate(0, 0) scale(1, 1); }
  33% { transform: translate(${u(-120)}, ${u(-20)}) scale(1.05, 1.08); }
  66% { transform: translate(${u(100)}, ${u(12)}) scale(0.98, 0.96); }
}
@keyframes ui-gf-drift-light {
  0%, 100% { transform: translate(0, 0) scale(1, 1); }
  33% { transform: translate(${u(-100)}, ${u(-10)}) scale(1.03, 1); }
  66% { transform: translate(${u(85)}, ${u(10)}) scale(0.98, 0.94); }
}
[data-ui="gf"][data-paused] .ui-gf-bleed { animation-play-state: paused; }
/* The content (the React file's .ui-gf-content div): every child the page put in, above the floor */
[data-ui="gf"] > :not(.ui-gf-layer) { position: relative; z-index: 1; height: 100%; }

@media (prefers-reduced-motion: reduce) {
  .ui-gf-bleed { animation: none; }
}
`;
}

if (!customElements.get("tc-gradient-floor")) customElements.define("tc-gradient-floor", TcGradientFloor);

declare global {
  interface HTMLElementTagNameMap {
    "tc-gradient-floor": TcGradientFloor;
  }
}
