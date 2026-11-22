import { pixelMarkCss } from "./internal/pixel-mark";
import { TcThinkingLoader, type LoaderParts, type ThinkingLoaderLabels, type ThinkingLoaderMark, type ThinkingLoaderPattern, type ThinkingLoaderState } from "./thinking-loader";

/*
 * <tc-pixel-loader> – a small "working on it" row: a 5 × 5 grid of dots lit in a pattern, a label with a light
 * sweeping over it, and the time since the work started (0.2s, 12s, 1m 4s). Four patterns: a diagonal wave, a lit
 * dot driving a snake path, a seeded twinkle and an orbit round the edge. When the work ends the dots settle into a
 * check (done) or a cross (error) and the clock stops.
 *
 * Superseded by <tc-thinking-loader mark="pixels">, which does all of this – this element is that one with Pixel
 * Loader's own look (a capsule with larger dots, the status on a hidden line rather than the host) and the same
 * properties: `label`, `pattern`, `state`, `started`, `now`, `hide-time`, `size` and `labels`.
 *   · nothing to operate; a hidden status line announces the label, then how it ended – never the ticking time
 *   · the clock keeps its own time unless `now` is given, and writes the time straight into its text: no re-render
 *     per tick
 *   · reduced motion: the grid holds still and the sweep is off; the time still counts
 * Standard: a capsule with a hairline border. Clean: a white chip with a hairline shadow and accent dots.
 *
 *   <tc-pixel-loader label="Reading the audit log" pattern="orbit"></tc-pixel-loader>
 */

export type PixelLoaderPattern = ThinkingLoaderPattern;
export type PixelLoaderState = ThinkingLoaderState;
export type PixelLoaderLabels = ThinkingLoaderLabels;
export { defaultThinkingLoaderLabels as defaultPixelLoaderLabels } from "./thinking-loader";
export { formatElapsed } from "./internal/pixel-mark";

const PARTS: LoaderParts = {
  icon: "ui-pxl__icon",
  spinner: "ui-pxl__spinner",
  check: "ui-pxl__check",
  cross: "ui-pxl__cross",
  grid: "ui-pxl__grid",
  dot: "ui-pxl__dot",
  sr: "ui-pxl__sr",
  text: "ui-pxl__text",
  label: "ui-pxl__label",
  labelIn: "ui-pxl__label--in",
  labelOut: "ui-pxl__label--out",
  shine: "ui-pxl__shine",
  time: "ui-pxl__time",
};

/**
 * A pixel-grid working indicator: dots lit in a pattern, a shimmering label and the time since the work started; a check or a cross when it ends. Superseded by tc-thinking-loader with mark="pixels".
 * @tag tc-pixel-loader
 */
export class TcPixelLoader extends TcThinkingLoader {
  static override ui = "pxl";
  protected static override parts: LoaderParts = PARTS;
  protected static override statusOnHost = false;

  constructor() {
    super();
    this.label = "Working";
  }

  /** Always the pixel grid */
  protected override get markShown(): ThinkingLoaderMark {
    return "pixels";
  }

  static override css = /* css */ `
[data-ui="pxl"] {
  /* a dot and the gap between dots */
  --tc-pixel-loader-dot: 3px;
  --tc-pixel-loader-gap: 2px;
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
[data-ui="pxl"]:not([data-status="working"]) .ui-pxl__label { color: var(--tc-text-primary); }
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
/* A label that's replaced isn't rolled out here: it just goes */
.ui-pxl__label--out { display: none; }
[data-ui="pxl"][data-offscreen] :is(.ui-pxl__shine, .ui-pxl__shine > span) { animation-play-state: paused; }
.ui-pxl__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@keyframes ui-pxl-sweep {
  from { transform: translateX(-100%); }
  to { transform: translateX(100%); }
}
@keyframes ui-pxl-sweep-text {
  from { transform: translateX(100%); }
  to { transform: translateX(-100%); }
}
@media (prefers-reduced-motion: reduce) {
  .ui-pxl__shine { display: none; }
}
` + pixelMarkCss("pxl", PARTS);
}

if (!customElements.get("tc-pixel-loader")) customElements.define("tc-pixel-loader", TcPixelLoader);

declare global {
  interface HTMLElementTagNameMap {
    "tc-pixel-loader": TcPixelLoader;
  }
}
