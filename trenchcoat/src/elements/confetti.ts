import { html, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { subscribeTick } from "./internal/chart/motion";

/*
 * <tc-confetti> – a celebration for a finished milestone: all checks passed, a review closed. Wrap what it celebrates
 * (a button, a card) and call fire(), change `fire-key`, or set trigger="click": paper bursts up out of the content,
 * flutters and falls, and is gone. Bare, it rains from the top of the viewport. It never fires when first shown.
 *
 *   <tc-confetti trigger="click" announce="Review closed"><button>Close review</button></tc-confetti>
 *
 * The paper is drawn on one canvas over the page – in the top layer where the Popover API exists – that only exists
 * while something is falling, on the loop the charts share; several bursts share it. Its colours are the chart tokens,
 * read when it fires, so they follow the theme. It's decorative: `announce` says what happened, once per burst. With
 * reduced motion there's no paper – the content holds a brief success tint, and the words are still said.
 */

/** Where a burst starts: the wrapped content, the top of the viewport, or a point in viewport pixels */
export type ConfettiOrigin = "self" | "viewport-top" | { x: number; y: number };

export type ConfettiOptions = {
  /** Pieces in this burst (capped at 300) */
  count?: number;
  /** Width of the cone, in degrees */
  spread?: number;
  origin?: ConfettiOrigin;
  /** CSS colours – var(--token) works */
  colors?: string[];
  /** Seed for the burst's pattern; the same seed falls the same way */
  seed?: number;
};

/** detail of tc-confetti-done – how many bursts this was for */
export type ConfettiDone = { bursts: number };

type Piece = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
  wobble: number;
  wobbleSpeed: number;
  shape: 0 | 1 | 2;
  size: number;
  color: string;
  age: number;
};

const MAX_COUNT = 300;
/** No piece lives longer than this (s); the last quarter fades */
const LIFE = 2.5;
const GRAVITY = 980;
/** Air drag, per second */
const DRAG = 1.6;

const DEFAULT_COLORS = ["var(--tc-chart-1)", "var(--tc-chart-2)", "var(--tc-chart-3)", "var(--tc-chart-4)", "var(--tc-chart-5)", "var(--tc-chart-6)", "var(--tc-status-success-fg)"];

/** A small seeded generator (mulberry32), so a seed always falls the same way */
function random(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const parseOrigin = (v: string | null): ConfettiOrigin => {
  if (v === "viewport-top") return v;
  const m = v?.match(/^\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*$/);
  return m ? { x: Number(m[1]), y: Number(m[2]) } : "self";
};

const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * A celebration burst of confetti for a finished milestone.
 * @tag tc-confetti
 * @fires tc-confetti-done - The last piece has settled and the canvas is gone ({ bursts }: ConfettiDone)
 */
export class TcConfetti extends TcElement {
  static override ui = "cft";
  static override looks = false;

  /** Change this to fire once; never fires on first render */
  @property({ attribute: "fire-key" }) accessor fireKey: string | number | undefined = undefined;
  /** "click" fires when the wrapped content is clicked */
  @property() accessor trigger: "none" | "click" = "none";
  /** Pieces per burst (capped at 300) */
  @property({ type: Number }) accessor count = 80;
  /** Width of the cone the pieces leave in, in degrees */
  @property({ type: Number }) accessor spread = 70;
  /** Where a burst starts: "self" (the wrapped content; the viewport's top when bare), "viewport-top", or "x,y" in viewport pixels */
  @property({ converter: { fromAttribute: parseOrigin } }) accessor origin: ConfettiOrigin = "self";
  /** CSS colours for the pieces; by default the chart tokens and the success colour */
  @property({ attribute: false }) accessor colors: string[] = DEFAULT_COLORS;
  /** Seed for the pattern; each burst uses the next one */
  @property({ type: Number }) accessor seed = 1;
  /** Said politely once per burst, e.g. "Review closed" */
  @property() accessor announce = "";

  @state() private accessor said = "";

  private pieces: Piece[] = [];
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private stop: (() => void) | null = null;
  private last = 0;
  private bursts = 0;
  private fired = 0;

  /** Pieces in the air now */
  get active() {
    return this.pieces.length;
  }

  /** Fires a burst – options override the attributes for this one */
  fire(options: ConfettiOptions = {}) {
    this.fired++;
    this.say();
    if (reducedMotion()) {
      this.tint();
      this.emit<ConfettiDone>("tc-confetti-done", { bursts: 1 });
      return;
    }
    const count = Math.max(0, Math.min(MAX_COUNT, Math.round(options.count ?? this.count)));
    if (!count) return;
    const colors = this.resolve(options.colors ?? this.colors);
    const rand = random((options.seed ?? this.seed) + this.fired - 1);
    const spread = ((options.spread ?? this.spread) * Math.PI) / 180;
    const from = this.start(options.origin ?? this.origin);
    const width = window.innerWidth;
    for (let i = 0; i < count; i++) {
      const shape = (i % 3) as Piece["shape"];
      let x: number, y: number, vx: number, vy: number;
      if (from === "rain") {
        // From above the viewport, across its width, drifting down
        x = rand() * width;
        y = -20 - rand() * 120;
        vx = (rand() - 0.5) * 160;
        vy = 80 + rand() * 220;
      } else {
        const angle = -Math.PI / 2 + (rand() - 0.5) * spread;
        const speed = 520 + rand() * 520;
        x = from.x;
        y = from.y;
        vx = Math.cos(angle) * speed;
        vy = Math.sin(angle) * speed;
      }
      this.pieces.push({
        x,
        y,
        vx,
        vy,
        angle: rand() * Math.PI * 2,
        spin: (rand() - 0.5) * 12,
        wobble: rand() * Math.PI * 2,
        wobbleSpeed: 6 + rand() * 6,
        shape,
        size: 0.8 + rand() * 0.5,
        color: colors[i % colors.length] ?? "currentColor",
        age: 0,
      });
    }
    this.bursts++;
    this.open();
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (changed.has("fireKey") && changed.get("fireKey") !== undefined && this.fireKey !== undefined) this.fire();
  }

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener("click", this.onClick);
    this.addEventListener("animationend", this.onTintEnd);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("click", this.onClick);
    this.removeEventListener("animationend", this.onTintEnd);
    this.pieces = [];
    this.close(false);
  }

  private onClick = (e: MouseEvent) => {
    if (this.trigger !== "click" || e.target === this) return;
    this.fire();
  };

  private onTintEnd = (e: AnimationEvent) => {
    if (e.target === this) this.removeAttribute("data-celebrating");
  };

  /** The page's own content: what a burst starts from */
  private content() {
    return [...this.children].find((c) => !c.matches(".ui-cft__canvas, .ui-cft__status")) ?? null;
  }

  private start(origin: ConfettiOrigin): { x: number; y: number } | "rain" {
    if (typeof origin === "object") return origin;
    const content = origin === "self" ? this.content() : null;
    if (!content) return "rain";
    const r = content.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  /** CSS colours as the canvas needs them – tokens resolved in this element's theme */
  private resolve(colors: string[]) {
    const probe = document.createElement("span");
    probe.hidden = true;
    this.append(probe);
    const out = colors.map((c) => {
      probe.style.color = "";
      probe.style.color = c;
      return getComputedStyle(probe).color;
    });
    probe.remove();
    return out;
  }

  private say() {
    if (!this.announce) return;
    // Cleared first, so the same words are said again for the next burst
    this.said = "";
    void this.updateComplete.then(() => (this.said = this.announce));
  }

  private tint() {
    if (!this.content()) return;
    this.removeAttribute("data-celebrating");
    // Reading a size restarts the animation when it's asked for again mid-way
    void this.offsetWidth;
    this.setAttribute("data-celebrating", "");
  }

  private open() {
    if (!this.canvas) {
      const canvas = document.createElement("canvas");
      canvas.className = "ui-cft__canvas";
      canvas.setAttribute("aria-hidden", "true");
      this.append(canvas);
      if (typeof canvas.showPopover === "function") {
        canvas.setAttribute("popover", "manual");
        try {
          canvas.showPopover();
        } catch {
          canvas.removeAttribute("popover");
        }
      }
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.size();
      window.addEventListener("resize", this.size);
    }
    if (!this.stop) {
      this.last = 0;
      this.stop = subscribeTick(this.tick);
    }
  }

  private size = () => {
    const canvas = this.canvas;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  private tick = (now: number) => {
    // A hidden tab gets no frames; on return the pieces carry on rather than jumping
    const dt = this.last ? Math.min((now - this.last) / 1000, 1 / 30) : 1 / 60;
    this.last = now;
    const h = window.innerHeight;
    const keep: Piece[] = [];
    const drag = Math.exp(-DRAG * dt);
    for (const p of this.pieces) {
      p.age += dt;
      p.vx *= drag;
      p.vy = p.vy * drag + GRAVITY * dt;
      p.wobble += p.wobbleSpeed * dt;
      p.angle += p.spin * dt;
      p.x += (p.vx + Math.sin(p.wobble) * 30) * dt;
      p.y += p.vy * dt;
      if (p.age < LIFE && p.y < h + 40) keep.push(p);
    }
    this.pieces = keep;
    this.draw();
    if (!keep.length) {
      this.stop = null;
      this.close(true);
      return false;
    }
    return true;
  };

  private draw() {
    const ctx = this.ctx;
    if (!ctx) return;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (const p of this.pieces) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, (LIFE - p.age) / (LIFE / 4));
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      // Turning over: the piece narrows and widens as it flutters
      const flip = Math.cos(p.wobble);
      if (p.shape === 1) {
        ctx.beginPath();
        ctx.ellipse(0, 0, 3.5 * p.size, 3.5 * p.size * Math.max(0.2, Math.abs(flip)), 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const [w, len] = p.shape === 0 ? [9, 6] : [3, 12];
        ctx.scale(1, flip);
        ctx.fillRect((-w * p.size) / 2, (-len * p.size) / 2, w * p.size, len * p.size);
      }
      ctx.restore();
    }
  }

  private close(done: boolean) {
    this.stop?.();
    this.stop = null;
    window.removeEventListener("resize", this.size);
    const canvas = this.canvas;
    if (canvas) {
      if (canvas.hasAttribute("popover") && canvas.matches(":popover-open")) canvas.hidePopover();
      canvas.remove();
    }
    this.canvas = null;
    this.ctx = null;
    if (done && this.bursts) {
      const bursts = this.bursts;
      this.bursts = 0;
      this.emit<ConfettiDone>("tc-confetti-done", { bursts });
    }
  }

  protected override render() {
    return html`<span class="ui-cft__status tc-sr-only" role="status" aria-live="polite">${this.said}</span>`;
  }

  static override css = /* css */ `
[data-ui="cft"] {
  --tc-confetti-tint: var(--tc-status-success-bg);
  --tc-confetti-ring: var(--tc-status-success-fg);
  --tc-confetti-radius: var(--tc-control-radius-md);
  display: block;
  border-radius: var(--tc-confetti-radius);
}
.ui-cft__canvas {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  max-width: none;
  max-height: none;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  overflow: visible;
  pointer-events: none;
  z-index: var(--tc-z-drag);
}
[data-ui="cft"][data-celebrating] { animation: ui-cft-tint var(--tc-duration-reveal-slow) steps(1) 1; }
@keyframes ui-cft-tint {
  from { background: var(--tc-confetti-tint); box-shadow: 0 0 0 2px var(--tc-confetti-ring); }
  to { background: transparent; box-shadow: none; }
}
@media (forced-colors: active) {
  [data-ui="cft"][data-celebrating] { outline: 2px solid Highlight; }
}
`;
}

if (!customElements.get("tc-confetti")) customElements.define("tc-confetti", TcConfetti);

declare global {
  interface HTMLElementTagNameMap {
    "tc-confetti": TcConfetti;
  }
}
