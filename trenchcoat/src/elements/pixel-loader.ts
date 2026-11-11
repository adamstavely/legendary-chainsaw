import { html, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { OffScreenController } from "./internal/controllers";

/*
 * <tc-pixel-loader> – a small "working on it" row: a 5 × 5 grid of dots lit in a pattern, a label with a light
 * sweeping over it, and the time since the work started (0.2s, 12s, 1m 4s). Four patterns: a diagonal wave, a lit
 * dot driving a snake path, a seeded twinkle and an orbit round the edge. When the work ends the dots settle into a
 * check (done) or a cross (error) and the clock stops.
 *   · nothing to operate; a hidden status line announces the label, then how it ended – never the ticking time
 *   · the clock keeps its own time unless `now` is given, and writes the time straight into its text: no re-render
 *     per tick
 *   · reduced motion: the grid holds still and the sweep is off; the time still counts
 * Standard: a capsule with a hairline border. Clean: a white chip with a hairline shadow and accent dots.
 *
 *   <tc-pixel-loader label="Reading the audit log" pattern="orbit"></tc-pixel-loader>
 */

export type PixelLoaderPattern = "wave" | "drive" | "dots" | "orbit";
export type PixelLoaderState = "working" | "done" | "error";
export type PixelLoaderLabels = { done: string; error: string };

/** The words used when the page gives none */
export const defaultPixelLoaderLabels: PixelLoaderLabels = { done: "Done", error: "Failed" };

const N = 5;
const CELLS = Array.from({ length: N * N }, (_, i) => [Math.floor(i / N), i % N] as const);
/** The dots that stay lit when the work ends */
const SHAPES: Record<"done" | "error", Set<string>> = {
  done: new Set(["2:0", "3:1", "2:2", "1:3", "0:4"]),
  error: new Set(["0:0", "1:1", "2:2", "3:3", "4:4", "0:4", "1:3", "3:1", "4:0"]),
};
/** The edge, clockwise from the top-left corner */
const RING = [...[0, 1, 2, 3, 4].map((c) => `0:${c}`), ...[1, 2, 3, 4].map((r) => `${r}:4`), ...[3, 2, 1, 0].map((c) => `4:${c}`), ...[3, 2, 1].map((r) => `${r}:0`)];
/** Rows left to right, then right to left */
const SNAKE = CELLS.map(([r, c]) => `${r}:${r % 2 ? N - 1 - c : c}`);

/** A small seeded generator (mulberry32), so the twinkle is the same on every load */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const TWINKLE = (() => {
  const rand = seeded(7);
  return CELLS.map(() => rand());
})();

/** Each dot's place in the pattern's cycle (0–1), or null for a dot the pattern leaves resting */
function phaseOf(pattern: PixelLoaderPattern, r: number, c: number, i: number): number | null {
  const key = `${r}:${c}`;
  if (pattern === "drive") return SNAKE.indexOf(key) / SNAKE.length;
  if (pattern === "orbit") {
    const at = RING.indexOf(key);
    return at < 0 ? null : at / RING.length;
  }
  if (pattern === "dots") return TWINKLE[i];
  return (r + c) / (2 * (N - 1) + 2);
}

/** 0.2s under ten seconds, then whole seconds, then minutes and seconds */
export function formatElapsed(ms: number) {
  const s = Math.max(0, ms) / 1000;
  if (s < 10) return `${(Math.floor(s * 10) / 10).toFixed(1)}s`;
  if (s < 60) return `${Math.floor(s)}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${Math.floor(s % 60)}s`;
}

/**
 * A pixel-grid working indicator: dots lit in a pattern, a shimmering label and the time since the work started; a check or a cross when it ends.
 * @tag tc-pixel-loader
 */
export class TcPixelLoader extends TcElement {
  static override ui = "pxl";

  /** What the work is, in a few words */
  @property() accessor label = "Working";
  /** How the dots move: a diagonal "wave", a lit dot that "drive"s a snake path, a seeded "dots" twinkle, or an "orbit" round the edge */
  @property({ reflect: true }) accessor pattern: PixelLoaderPattern = "wave";
  /** "working" animates and counts; "done" settles into a check and stops the clock; "error" into a cross */
  @property({ reflect: true }) accessor state: PixelLoaderState = "working";
  /** When the work started, in epoch ms; by default when the loader connected (or went back to working) */
  @property({ type: Number }) accessor started: number | undefined = undefined;
  /** The current time, in epoch ms – given, the loader keeps no clock of its own and shows the time up to it */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** Hides the elapsed time */
  @property({ type: Boolean, attribute: "hide-time" }) accessor hideTime = false;
  /** "md" is the default; "sm" fits inside a chat bubble or a row */
  @property({ reflect: true }) accessor size: "sm" | "md" = "md";
  /** Rename the words for how it ended, over the defaults */
  @property({ attribute: false }) accessor labels: Partial<PixelLoaderLabels> = {};

  /** When this loader started counting, if `started` isn't given */
  private since = 0;
  /** When the work ended, frozen for done and error */
  private ended: number | null = null;
  private timer = 0;

  constructor() {
    super();
    // The dots and the sweep pause while the loader is scrolled away
    new OffScreenController(this, () => this.isConnected && this.state === "working");
  }

  /** The loader's one clock read */
  private clock() {
    return this.now ?? Date.now();
  }

  override connectedCallback() {
    super.connectedCallback();
    this.since = this.clock();
    if (this.state !== "working") this.ended = this.since;
    this.syncTimer();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.clearInterval(this.timer);
    this.timer = 0;
  }

  private word(key: keyof PixelLoaderLabels) {
    return this.labels[key] ?? defaultPixelLoaderLabels[key];
  }

  private get elapsed() {
    const end = this.state === "working" ? this.clock() : (this.ended ?? this.clock());
    return end - (this.started ?? this.since);
  }

  /** Writes the time into its text directly – the tick changes nothing else, so it needn't re-render */
  private paintTime = () => {
    const t = this.querySelector<HTMLElement>(".ui-pxl__time");
    if (t) t.textContent = formatElapsed(this.elapsed);
  };

  /** Ticks while working on its own clock; a page that passes `now` drives the time itself */
  private syncTimer() {
    const on = this.isConnected && this.state === "working" && this.now === undefined && !this.hideTime;
    if (on === !!this.timer) return;
    window.clearInterval(this.timer);
    this.timer = on ? window.setInterval(this.paintTime, 100) : 0;
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (changed.has("state") && changed.get("state") !== undefined) {
      if (this.state === "working") {
        this.since = this.clock();
        this.ended = null;
      } else if (changed.get("state") === "working") this.ended = this.clock();
    }
  }

  protected override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    this.syncTimer();
    this.paintTime();
  }

  protected override render() {
    const ending = this.state === "working" ? null : SHAPES[this.state];
    const status = this.state === "working" ? this.label : `${this.word(this.state)}: ${this.label}`;
    return html`
      <span class="ui-pxl__grid" aria-hidden="true">
        ${CELLS.map(([r, c], i) => {
          const phase = phaseOf(this.pattern, r, c, i);
          const lit = ending?.has(`${r}:${c}`);
          return html`<span
            class="ui-pxl__dot"
            ?data-lit=${!!lit}
            ?data-rest=${phase === null}
            style=${phase === null ? "" : `--tc-pxl-phase: ${phase.toFixed(3)}`}
          ></span>`;
        })}
      </span>
      <span class="ui-pxl__sr" role="status">${status}</span>
      <span class="ui-pxl__text" aria-hidden="true">
        <span class="ui-pxl__label">${this.label}</span>
        ${this.state === "working" ? html`<span class="ui-pxl__shine"><span>${this.label}</span></span>` : ""}
      </span>
      ${this.hideTime ? "" : html`<span class="ui-pxl__time" aria-hidden="true"></span>`}
    `;
  }

  static override css = /* css */ `
[data-ui="pxl"] {
  /* a dot, the gap between dots, and one turn of the pattern */
  --tc-pixel-loader-dot: 3px;
  --tc-pixel-loader-gap: 2px;
  --tc-pixel-loader-cycle: 1400ms;
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-2);
  box-sizing: border-box;
  max-width: 100%;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-snug);
  vertical-align: middle;
  -webkit-font-smoothing: antialiased;
}
[data-ui="pxl"][size="sm"] {
  --tc-pixel-loader-dot: 2px;
  --tc-pixel-loader-gap: 1.5px;
  gap: var(--tc-space-1-5);
  font-size: var(--tc-font-size-sm);
}
[data-ui="pxl"][pattern="drive"] { --tc-pixel-loader-cycle: 2200ms; }
[data-ui="pxl"][pattern="orbit"] { --tc-pixel-loader-cycle: 1600ms; }
[data-ui="pxl"][pattern="dots"] { --tc-pixel-loader-cycle: 1800ms; }
/* Standard: a capsule with a hairline border */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="pxl"] {
  --tc-pixel-loader-ink: var(--tc-text-primary);
  /* brighter than --tc-shimmer, so it reads on gray text in dark mode too */
  --tc-pixel-loader-shine: light-dark(rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.95));
  min-height: var(--tc-control-h-sm);
  padding: var(--tc-space-1) var(--tc-space-3);
  border-radius: var(--tc-radius-full);
  background: var(--tc-surface-raised);
  box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default), var(--tc-shadow-control);
  color: var(--tc-text-muted);
}
/* Clean: a white chip, accent dots */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="pxl"] {
  --tc-pixel-loader-ink: var(--tc-accent);
  --tc-pixel-loader-shine: light-dark(rgba(255, 255, 255, 0.85), #ffffff);
  min-height: var(--tc-control-h-sm);
  padding: var(--tc-space-1) var(--tc-space-2-5);
  border-radius: var(--tc-radius-md);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-shadow-raised);
  color: var(--tc-text-secondary);
  font-weight: var(--tc-font-weight-medium);
}
[data-ui="pxl"][size="sm"] { min-height: 0; }
.ui-pxl__grid {
  display: grid;
  flex: none;
  grid-template-columns: repeat(5, var(--tc-pixel-loader-dot));
  grid-auto-rows: var(--tc-pixel-loader-dot);
  gap: var(--tc-pixel-loader-gap);
}
.ui-pxl__dot {
  border-radius: var(--tc-radius-xs);
  background: var(--tc-pixel-loader-ink);
  opacity: 0.16;
  transition: opacity var(--tc-duration-moderate) var(--tc-ease-standard), background-color var(--tc-duration-moderate) var(--tc-ease-standard);
}
[data-ui="pxl"][state="working"] .ui-pxl__dot:not([data-rest]) {
  animation: ui-pxl-glow var(--tc-pixel-loader-cycle) linear infinite;
  animation-delay: calc(var(--tc-pxl-phase) * var(--tc-pixel-loader-cycle) * -1);
}
[data-ui="pxl"][state="working"][pattern="drive"] .ui-pxl__dot,
[data-ui="pxl"][state="working"][pattern="orbit"] .ui-pxl__dot:not([data-rest]) { animation-name: ui-pxl-blip; }
[data-ui="pxl"][state="working"][pattern="dots"] .ui-pxl__dot { animation-name: ui-pxl-twinkle; }
/* Done and error: the shape's dots light up, the rest fade further */
[data-ui="pxl"]:not([state="working"]) .ui-pxl__dot { opacity: 0.1; }
[data-ui="pxl"]:not([state="working"]) .ui-pxl__dot[data-lit] { opacity: 1; }
[data-ui="pxl"][state="done"] .ui-pxl__dot[data-lit] { background: var(--tc-status-success-solid); }
[data-ui="pxl"][state="error"] .ui-pxl__dot[data-lit] { background: var(--tc-status-danger-solid); }
[data-ui="pxl"]:not([state="working"]) .ui-pxl__label { color: var(--tc-text-primary); }
.ui-pxl__text {
  position: relative;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.ui-pxl__label { white-space: nowrap; }
/* A light sweeps over the label a few times, then rests (WCAG 2.2.2); only transform animates */
.ui-pxl__shine {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  -webkit-mask-image: linear-gradient(90deg, transparent, black 50%, transparent);
  mask-image: linear-gradient(90deg, transparent, black 50%, transparent);
  animation: ui-pxl-sweep var(--tc-duration-shimmer) linear var(--tc-duration-slower) 3 both;
}
.ui-pxl__shine > span {
  display: block;
  white-space: nowrap;
  color: var(--tc-pixel-loader-shine);
  animation: ui-pxl-sweep-text var(--tc-duration-shimmer) linear var(--tc-duration-slower) 3 both;
}
.ui-pxl__time {
  flex: none;
  color: var(--tc-text-muted);
  font-variant-numeric: tabular-nums;
  font-weight: var(--tc-font-weight-regular);
}
.ui-pxl__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
[data-ui="pxl"][data-offscreen] :is(.ui-pxl__dot, .ui-pxl__shine, .ui-pxl__shine > span) { animation-play-state: paused; }
@keyframes ui-pxl-glow {
  0%, 100% { opacity: 0.16; }
  30% { opacity: 1; }
  60% { opacity: 0.16; }
}
@keyframes ui-pxl-blip {
  0% { opacity: 1; }
  12% { opacity: 0.55; }
  30%, 100% { opacity: 0.16; }
}
@keyframes ui-pxl-twinkle {
  0%, 40%, 100% { opacity: 0.16; }
  50% { opacity: 1; }
  70% { opacity: 0.3; }
}
@keyframes ui-pxl-sweep {
  from { transform: translateX(-100%); }
  to { transform: translateX(100%); }
}
@keyframes ui-pxl-sweep-text {
  from { transform: translateX(100%); }
  to { transform: translateX(-100%); }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="pxl"] .ui-pxl__dot { animation: none !important; transition: none; }
  [data-ui="pxl"][state="working"] .ui-pxl__dot:not([data-rest]) { opacity: calc(0.2 + var(--tc-pxl-phase) * 0.6); }
  .ui-pxl__shine { display: none; }
}
@media (forced-colors: active) {
  .ui-pxl__dot { background: CanvasText; }
  [data-ui="pxl"]:not([state="working"]) .ui-pxl__dot[data-lit] { background: Highlight; }
}
`;
}

if (!customElements.get("tc-pixel-loader")) customElements.define("tc-pixel-loader", TcPixelLoader);

declare global {
  interface HTMLElementTagNameMap {
    "tc-pixel-loader": TcPixelLoader;
  }
}
