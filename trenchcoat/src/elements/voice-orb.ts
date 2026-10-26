import { html, nothing, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { TcElement } from "./internal/base";
import { AriaForwardController } from "./internal/controllers";

/*
 * <tc-voice-orb> – the Lit port of illustrations/voice-orb.tsx: the face of a voice assistant, a sphere of dots drawn
 * on a canvas that shows what the AI is doing.
 *   · idle       the sphere turns slowly and breathes
 *   · listening  dots jump outward with the input level
 *   · thinking   the sphere collapses into a fast spinning ring with a light running around it
 *   · speaking   waves travel from pole to pole with the output level
 * States melt into each other; the dots give way to the pointer. `level` (0–1) drives it from real audio.
 * The canvas draws only while on screen and the tab is visible; reduced motion draws one still frame per state. Idle,
 * it breathes for a few seconds and then rests (WCAG 2.2.2). Colours are read again whenever the theme changes.
 *
 *   <tc-voice-orb state="listening"></tc-voice-orb>
 *   <tc-voice-orb pressable></tc-voice-orb>     a native button inside; fires tc-press
 *
 * Not pressable, the host is an image named "Voice assistant: <state>" (unless the page names it). Pressable, a native
 * <button> inside holds the orb and the label; ARIA attributes set on the host move to it.
 */

export type VoiceOrbState = "idle" | "listening" | "thinking" | "speaking";

const LABELS: Record<VoiceOrbState, string> = {
  idle: "Tap to speak",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
};
const STATES: VoiceOrbState[] = ["idle", "listening", "thinking", "speaking"];
/** Turning speed per state, in radians per second */
const SPIN: Record<VoiceOrbState, number> = { idle: 0.16, listening: 0.3, thinking: 1.9, speaking: 0.42 };

const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
/** Idle breathing settles into a still frame after this long, in ms */
const IDLE_REST = 8000;
/** Attributes that switch the theme on an ancestor */
const THEME_ATTRS = ["class", "style", "data-theme", "data-tc-theme"];

/** "rgb(…)" / "#rrggbb" → [r, g, b], read through the browser so every CSS color works */
function toRgb(color: string, probe: HTMLElement): [number, number, number] {
  probe.style.color = color;
  const m = getComputedStyle(probe).color.match(/[\d.]+/g);
  return m ? [Number(m[0]), Number(m[1]), Number(m[2])] : [23, 23, 23];
}

type Live = { state: VoiceOrbState; level?: number; interactive: boolean };

/**
 * A voice assistant's dot sphere that shows whether it's idle, listening, thinking or speaking.
 * @tag tc-voice-orb
 * @fires tc-press - The orb was pressed (only when `pressable`); detail: undefined
 */
export class TcVoiceOrb extends TcElement {
  static override ui = "vo";
  static override looks = false;

  /** idle · listening · thinking · speaking */
  @property() accessor state: VoiceOrbState = "idle";
  /** Input or output loudness from 0 to 1 – unset, the orb fakes a natural level */
  @property({ type: Number }) accessor level: number | undefined = undefined;
  /** Edge length in px */
  @property({ type: Number }) accessor size = 220;
  /** Number of dots – more is denser and costs a little more */
  @property({ type: Number }) accessor dots = 520;
  /** Colour the moving dots take on – any CSS colour. The resting dots use the text colour */
  @property() accessor accent: string | undefined = undefined;
  /** The line under the orb; false hides it, an object replaces single texts */
  @property({ attribute: false }) accessor label: boolean | Partial<Record<VoiceOrbState, string>> = true;
  /** Dots give way to the pointer */
  @property({ attribute: false }) accessor interactive = true;
  /** Makes the orb a button (a native one inside) that fires tc-press */
  @property({ type: Boolean, reflect: true }) accessor pressable = false;

  /** The page named the host itself */
  private ownName = false;
  /** The name this element last gave the host */
  private givenName: string | null = null;
  private loop?: { canvas: HTMLCanvasElement; size: number; dots: number; redraw: () => void; stop: () => void };

  constructor() {
    super();
    new AriaForwardController(this, () => this.querySelector<HTMLElement>(":scope > .ui-vo__hit"));
  }

  override connectedCallback() {
    super.connectedCallback();
    const name = this.getAttribute("aria-label");
    this.ownName ||= (name !== null && name !== this.givenName) || this.hasAttribute("aria-labelledby");
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.loop?.stop();
    this.loop = undefined;
  }

  private get text() {
    return this.label === false ? null : { ...LABELS, ...(typeof this.label === "object" ? this.label : {}) }[this.state];
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    this.dataset.state = this.state;
    this.style.setProperty("--tc-voice-orb-size", `${this.size}px`);
    if (this.accent) this.style.setProperty("--tc-voice-orb-accent", this.accent);
    else if (changed.get("accent")) this.style.removeProperty("--tc-voice-orb-accent");
    if (this.ownName) return;
    if (this.pressable) {
      if (this.givenName !== null) {
        this.removeAttribute("role");
        this.removeAttribute("aria-label");
        this.givenName = null;
      }
    } else {
      this.givenName = `Voice assistant: ${this.text ?? LABELS[this.state]}`;
      if (this.getAttribute("role") !== "img") this.setAttribute("role", "img");
      this.setAttribute("aria-label", this.givenName);
    }
  }

  protected override updated(changed: PropertyValues<this>) {
    const canvas = this.querySelector<HTMLCanvasElement>(".ui-vo__canvas");
    if (canvas && (!this.loop || this.loop.canvas !== canvas || this.loop.size !== this.size || this.loop.dots !== this.dots)) {
      this.loop?.stop();
      this.loop = this.startLoop(canvas, this.size, this.dots);
    } else if (changed.has("state") || changed.has("level")) this.loop?.redraw();
  }

  private press = () => {
    this.emit("tc-press", undefined);
  };

  protected override render() {
    const text = this.text;
    const body = html`<canvas class="ui-vo__canvas" aria-hidden="true"></canvas>${text !== null
        ? html`<span class="ui-vo__label" aria-live="polite">${keyed(
            this.state,
            html`<span>${text}${this.state !== "idle" ? html`<span class="ui-vo__dots" aria-hidden="true"><i></i><i></i><i></i></span>` : nothing}</span>`,
          )}</span>`
        : nothing}`;
    return this.pressable
      ? html`<button type="button" class="ui-vo__hit" aria-label=${ifDefined(text ? undefined : `Voice assistant: ${LABELS[this.state]}`)} @click=${this.press}>${body}</button>`
      : body;
  }

  /** The drawing loop: a dot sphere on the canvas, reading the element's props every frame */
  private startLoop(canvas: HTMLCanvasElement, size: number, dots: number) {
    const live = (): Live => ({ state: this.state, level: this.level, interactive: this.interactive });
    const ctx = canvas.getContext("2d");
    const loop = { canvas, size, dots, redraw: () => {}, stop: () => {} };
    if (!ctx) return loop;

    // Points spread evenly over a sphere (Fibonacci lattice)
    const count = Math.max(60, Math.round(dots));
    const points = new Float32Array(count * 3);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      points[i * 3] = Math.cos(golden * i) * r;
      points[i * 3 + 1] = y;
      points[i * 3 + 2] = Math.sin(golden * i) * r;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);

    // Colors come from CSS, so themes and the accent just work
    const probe = document.createElement("span");
    probe.style.display = "none";
    canvas.parentElement?.appendChild(probe);
    let ink: [number, number, number] = [23, 23, 23];
    let tint: [number, number, number] = [47, 107, 255];
    /** Reads the ink and accent; true when they changed */
    const readColors = () => {
      const cs = getComputedStyle(canvas);
      const nextInk = toRgb(cs.color, probe);
      const nextTint = toRgb(cs.getPropertyValue("--tc-voice-orb-accent").trim() || "#2f6bff", probe);
      const changed = nextInk.join() !== ink.join() || nextTint.join() !== tint.join();
      ink = nextInk;
      tint = nextTint;
      return changed;
    };
    readColors();

    const weight: Record<VoiceOrbState, number> = { idle: 0, listening: 0, thinking: 0, speaking: 0 };
    weight[live().state] = 1;
    let angle = 0;
    let shownLevel = 0;
    const pointer = { x: 0, y: 0, on: false, strength: 0 };
    let last = performance.now();
    let frame = 0;
    let frames = 0;
    let inView = true;
    let visible = !document.hidden;
    const still = reduced();
    // Idle and untouched for IDLE_REST: the loop stops on a still frame until something moves it again
    // -1: not measured yet – the next frame starts the count
    let calmSince = -1;
    let resting = false;

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;
      const cur = live();
      if (++frames % 30 === 0) readColors();

      // States melt into each other
      let spin = 0;
      for (const s of STATES) {
        weight[s] += ((s === cur.state ? 1 : 0) - weight[s]) * Math.min(1, dt * 5);
        spin += weight[s] * SPIN[s];
      }
      angle += spin * dt;

      // Loudness: the real one, or a made-up one that feels like speech
      const fake =
        cur.state === "listening"
          ? clamp(0.35 + 0.35 * Math.sin(t * 2.1) * Math.sin(t * 5.3) + 0.3 * Math.sin(t * 9.7 + 1) * Math.sin(t * 0.9))
          : clamp(0.3 + 0.7 * Math.abs(Math.sin(t * 4.1)) * (0.5 + 0.5 * Math.sin(t * 1.3 + 2)));
      const target = cur.level !== undefined ? clamp(cur.level) : fake;
      shownLevel += (target - shownLevel) * Math.min(1, dt * 12);
      pointer.strength += ((pointer.on && cur.interactive ? 1 : 0) - pointer.strength) * Math.min(1, dt * 8);

      const w = size;
      const c = w / 2;
      const R = w * 0.32;
      const tilt = 0.32 + weight.thinking * 0.55;
      const sinT = Math.sin(tilt);
      const cosT = Math.cos(tilt);
      const sinA = Math.sin(angle);
      const cosA = Math.cos(angle);
      const reach = w * 0.2;
      const base = Math.max(0.9, w / 190);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, w);

      // A soft glow behind the orb that follows the level
      const glow = (weight.listening + weight.speaking) * shownLevel * 0.16 + weight.thinking * 0.05;
      if (glow > 0.004) {
        const g = ctx.createRadialGradient(c, c, R * 0.2, c, c, R * 1.55);
        g.addColorStop(0, `rgba(${tint[0]}, ${tint[1]}, ${tint[2]}, ${glow})`);
        g.addColorStop(1, `rgba(${tint[0]}, ${tint[1]}, ${tint[2]}, 0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, w);
      }

      for (let i = 0; i < count; i++) {
        const bx = points[i * 3];
        const by = points[i * 3 + 1];
        const bz = points[i * 3 + 2];

        // How far this dot leaves the surface
        const noise = (Math.sin(bx * 3.1 + t * 2.3) + Math.sin(by * 4.3 - t * 1.7) + Math.sin(bz * 5.2 + t * 2.9)) / 3;
        const breathe = weight.idle * 0.022 * Math.sin(t * 1.3 + by * 2);
        const hear = weight.listening * shownLevel * 0.3 * Math.max(0, noise) ** 1.4;
        const speak = weight.speaking * shownLevel * 0.13 * Math.sin(by * 7.5 - t * 7);
        const out = breathe + hear + speak;
        let x = bx * (1 + out);
        let y = by * (1 + out);
        let z = bz * (1 + out);

        // Thinking: the sphere collapses into a ring
        let scan = 0;
        // Dots near the poles have no place on the ring – they fade out while it forms
        let keep = 1;
        if (weight.thinking > 0.001) {
          const len = Math.hypot(bx, bz) || 1;
          const wobble = 1 + 0.035 * Math.sin(t * 3 + i * 0.7);
          const k = weight.thinking;
          x += ((bx / len) * wobble - x) * k;
          y += (by * 0.2 - y) * k;
          keep = 1 - k * (1 - clamp((Math.hypot(bx, bz) - 0.25) * 2.2));
          z += ((bz / len) * wobble - z) * k;
          // A light runs around the ring
          const a = Math.atan2(bz, bx) + angle;
          scan = k * Math.max(0, Math.cos(a - t * 2.2)) ** 6;
        }

        // Turn around the vertical axis, then tip the whole thing towards the viewer
        const rx = x * cosA + z * sinA;
        const rz = -x * sinA + z * cosA;
        const ry = y * cosT - rz * sinT;
        const depth = y * sinT + rz * cosT;

        const persp = 3.4 / (3.4 - depth);
        let sx = c + rx * R * persp;
        let sy = c + ry * R * persp;

        // Dots give way to the pointer
        if (pointer.strength > 0.01) {
          const dx = sx - pointer.x;
          const dy = sy - pointer.y;
          const d = Math.hypot(dx, dy) || 1;
          if (d < reach) {
            const push = (1 - d / reach) ** 2 * w * 0.07 * pointer.strength;
            sx += (dx / d) * push;
            sy += (dy / d) * push;
          }
        }

        const front = (depth + 1.3) / 2.6;
        const active = clamp(Math.abs(hear + speak) * 9 + scan);
        const radius = base * (0.55 + 0.75 * front) * persp * (1 + active * 0.5);
        const alpha = clamp(0.12 + 0.88 * front ** 1.6 + active * 0.3) * keep;
        if (alpha < 0.01) continue;
        const r = Math.round(ink[0] + (tint[0] - ink[0]) * active);
        const g = Math.round(ink[1] + (tint[1] - ink[1]) * active);
        const b = Math.round(ink[2] + (tint[2] - ink[2]) * active);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      const calm = cur.state === "idle" && cur.level === undefined && weight.idle > 0.995 && pointer.strength < 0.01;
      if (!calm || calmSince < 0) calmSince = now;
      resting = calm && now - calmSince > IDLE_REST;
      if (!still && visible && !resting) frame = requestAnimationFrame(draw);
    };

    // Reduced motion: no loop – one still frame per state, with the state fully applied
    // A resting loop wakes up on a new state or level
    loop.redraw = () => {
      if (!still) {
        if (resting) wake();
        return;
      }
      for (const s of STATES) weight[s] = s === live().state ? 1 : 0;
      shownLevel = live().level ?? 0.6;
      last = performance.now();
      draw(last);
    };

    // Only run while the orb is on screen and the tab is in front
    const start = () => {
      cancelAnimationFrame(frame);
      readColors();
      last = performance.now();
      frame = requestAnimationFrame(draw);
    };
    const wake = () => {
      resting = false;
      calmSince = -1;
      if (!still && visible) start();
    };

    // The theme changed (a class or attribute on an ancestor, or the OS setting): read the colours again and
    // redraw – a resting or reduced-motion orb has no loop that would pick them up
    const onTheme = () => {
      if (!readColors()) return;
      if (still) loop.redraw();
      // Same moment as the frame it rests on, in the new colours
      else if (resting && visible) draw(last);
    };
    const themeObserver =
      typeof MutationObserver === "function"
        ? new MutationObserver((records) => {
            if (records.some((r) => r.target instanceof Node && r.target.contains(canvas))) onTheme();
          })
        : null;
    themeObserver?.observe(document.documentElement, { attributes: true, attributeFilter: THEME_ATTRS, subtree: true });
    const scheme = window.matchMedia?.("(prefers-color-scheme: dark)");
    scheme?.addEventListener?.("change", onTheme);
    // Both count: a tab coming back to the front doesn't restart an orb that is scrolled away
    const onVisibility = () => {
      visible = inView && !document.hidden;
      // The label's blinking dots (CSS) hold too
      this.toggleAttribute("data-paused", !visible);
      if (visible) start();
    };
    const io =
      "IntersectionObserver" in window
        ? new IntersectionObserver((entries) => {
            inView = entries[entries.length - 1].isIntersecting;
            onVisibility();
          })
        : null;
    io?.observe(canvas);
    document.addEventListener("visibilitychange", onVisibility);
    start();

    const move = (e: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      // The box may be scaled by a zoom or transform on a parent
      const k = size / (box.width || size);
      pointer.x = (e.clientX - box.left) * k;
      pointer.y = (e.clientY - box.top) * k;
      pointer.on = e.pointerType === "mouse";
      if (resting && pointer.on && live().interactive) wake();
    };
    const leave = () => (pointer.on = false);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerleave", leave);

    loop.stop = () => {
      cancelAnimationFrame(frame);
      io?.disconnect();
      themeObserver?.disconnect();
      scheme?.removeEventListener?.("change", onTheme);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerleave", leave);
      probe.remove();
      this.removeAttribute("data-paused");
    };
    return loop;
  }

  static override css = /* css */ `
/* Theme: the --tc- fallbacks use light-dark(), which follows color-scheme */
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

[data-ui="vo"] {
  --tc-voice-orb-accent: light-dark(#2f6bff, #6f9bff);
  /* One blink of the label's dots; they blink four times (under 5 s) per state and then stay lit (WCAG 2.2.2) */
  --tc-voice-orb-blink: 1.2s;
  display: inline-grid;
  justify-items: center;
  gap: var(--tc-space-0-5, 2px);
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
  -webkit-font-smoothing: antialiased;
  -webkit-tap-highlight-color: transparent;
}
/* Pressable: a native button inside holds the orb and the label, laid out like the host */
[data-ui="vo"] > .ui-vo__hit { display: inline-grid; justify-items: center; gap: inherit; margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; -webkit-tap-highlight-color: transparent; }
[data-ui="vo"] > .ui-vo__hit { border-radius: 24px; cursor: pointer; }
[data-ui="vo"] > .ui-vo__hit:focus-visible { outline: var(--tc-focus-ring-width, 2px) solid var(--tc-focus-ring, light-dark(#2f68ff, #6b95ff)); outline-offset: calc(2 * var(--tc-focus-ring-offset, 2px)); }
.ui-vo__canvas { display: block; width: var(--tc-voice-orb-size); height: var(--tc-voice-orb-size); color: var(--tc-text-primary, light-dark(#171717, #ededed)); transition: transform var(--tc-duration-slowest, 560ms) var(--tc-ease-emphasized, cubic-bezier(0.32, 0.72, 0.24, 1)); }
[data-ui="vo"] > .ui-vo__hit:active .ui-vo__canvas { transform: scale(0.97); }

.ui-vo__label { height: 20px; overflow: hidden; font-size: var(--tc-font-size-md, 13px); font-weight: var(--tc-font-weight-medium, 500); line-height: var(--tc-line-height-normal, 20px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); white-space: nowrap; }
.ui-vo__label > span { display: inline-flex; align-items: baseline; gap: 1px; animation: ui-vo-in var(--tc-duration-slow, 320ms) var(--tc-ease-emphasized, cubic-bezier(0.32, 0.72, 0.24, 1)) both; }
[data-ui="vo"][data-state="listening"] .ui-vo__label, [data-ui="vo"][data-state="speaking"] .ui-vo__label { color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-vo__dots { display: inline-flex; gap: var(--tc-space-0-5, 2px); margin-left: var(--tc-space-0-5, 2px); }
.ui-vo__dots i { width: 2.5px; height: 2.5px; border-radius: 50%; background: currentColor; animation: ui-vo-blink var(--tc-voice-orb-blink) var(--tc-ease-standard, ease) 4; }
.ui-vo__dots i:nth-child(2) { animation-delay: var(--tc-duration-fast, 150ms); }
.ui-vo__dots i:nth-child(3) { animation-delay: var(--tc-duration-slow, 320ms); }
[data-ui="vo"][data-paused] .ui-vo__dots i { animation-play-state: paused; }

@keyframes ui-vo-in { from { opacity: 0; transform: translateY(5px); filter: blur(3px); } }
@keyframes ui-vo-blink { 0%, 100% { opacity: 0.25; } 40% { opacity: 1; } }

@media (prefers-reduced-motion: reduce) {
  .ui-vo__label > span, [data-ui="vo"] .ui-vo__dots i { animation: none; }
  .ui-vo__canvas { transition: none; }
}
`;
}

if (!customElements.get("tc-voice-orb")) customElements.define("tc-voice-orb", TcVoiceOrb);

declare global {
  interface HTMLElementTagNameMap {
    "tc-voice-orb": TcVoiceOrb;
  }
}
