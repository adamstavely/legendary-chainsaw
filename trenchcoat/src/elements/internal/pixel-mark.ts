import { html } from "lit";

/*
 * The 5 × 5 pixel mark that Thinking Loader (mark="pixels") and Pixel Loader draw: dots lit in a pattern while the work
 * runs – a diagonal wave, a lit dot driving a snake path, a seeded twinkle or an orbit round the edge – that settle
 * into a check (done) or a cross (error). The element passes its own class names, so each keeps its prefix, and puts
 * pixelMarkCss() after its own CSS.
 *
 *   ${pixelGrid({ grid: "ui-x__grid", dot: "ui-x__dot" }, "orbit", null)}
 *   static css = `…` + pixelMarkCss("x", { grid: "ui-x__grid", dot: "ui-x__dot" });
 */

export type PixelPattern = "wave" | "drive" | "dots" | "orbit";
export type PixelEnding = "done" | "error" | null;
export type PixelParts = { grid: string; dot: string };

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
function phaseOf(pattern: PixelPattern, r: number, c: number, i: number): number | null {
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

/** The grid: 25 dots with their phase in the pattern, or the end shape lit */
export function pixelGrid(parts: PixelParts, pattern: PixelPattern, ending: PixelEnding) {
  const shape = ending ? SHAPES[ending] : null;
  return html`<span class=${parts.grid} aria-hidden="true">
    ${CELLS.map(([r, c], i) => {
      const phase = phaseOf(pattern, r, c, i);
      return html`<span
        class=${parts.dot}
        ?data-lit=${!!shape?.has(`${r}:${c}`)}
        ?data-rest=${phase === null}
        style=${phase === null ? "" : `--tc-pxl-phase: ${phase.toFixed(3)}`}
      ></span>`;
    })}
  </span>`;
}

/**
 * The grid's CSS for the element whose root is [data-ui="<ui>"]: the dots, how each pattern moves them, the end shapes
 * and reduced motion. The host carries `pattern` and `data-status` (working, done or error); the look sets
 * --tc-pixel-loader-ink, and the size --tc-pixel-loader-dot and --tc-pixel-loader-gap.
 */
export function pixelMarkCss(ui: string, parts: PixelParts) {
  const host = `[data-ui="${ui}"]`;
  const grid = `.${parts.grid}`;
  const dot = `.${parts.dot}`;
  const k = `ui-${ui}`;
  return /* css */ `
${host} { --tc-pixel-loader-cycle: 1400ms; }
${host}[pattern="drive"] { --tc-pixel-loader-cycle: 2200ms; }
${host}[pattern="orbit"] { --tc-pixel-loader-cycle: 1600ms; }
${host}[pattern="dots"] { --tc-pixel-loader-cycle: 1800ms; }
${grid} {
  display: grid;
  flex: none;
  grid-template-columns: repeat(5, var(--tc-pixel-loader-dot));
  grid-auto-rows: var(--tc-pixel-loader-dot);
  gap: var(--tc-pixel-loader-gap);
}
${dot} {
  border-radius: var(--tc-radius-xs);
  background: var(--tc-pixel-loader-ink);
  opacity: 0.16;
  transition: opacity var(--tc-duration-moderate) var(--tc-ease-standard), background-color var(--tc-duration-moderate) var(--tc-ease-standard);
}
${host}[data-status="working"] ${dot}:not([data-rest]) {
  animation: ${k}-glow var(--tc-pixel-loader-cycle) linear infinite;
  animation-delay: calc(var(--tc-pxl-phase) * var(--tc-pixel-loader-cycle) * -1);
}
${host}[data-status="working"][pattern="drive"] ${dot},
${host}[data-status="working"][pattern="orbit"] ${dot}:not([data-rest]) { animation-name: ${k}-blip; }
${host}[data-status="working"][pattern="dots"] ${dot} { animation-name: ${k}-twinkle; }
/* Done and error: the shape's dots light up, the rest fade further */
${host}:not([data-status="working"]) ${dot} { opacity: 0.1; }
${host}:not([data-status="working"]) ${dot}[data-lit] { opacity: 1; }
${host}[data-status="done"] ${dot}[data-lit] { background: var(--tc-status-success-solid); }
${host}[data-status="error"] ${dot}[data-lit] { background: var(--tc-status-danger-solid); }
${host}[data-offscreen] ${dot} { animation-play-state: paused; }
@keyframes ${k}-glow {
  0%, 100% { opacity: 0.16; }
  30% { opacity: 1; }
  60% { opacity: 0.16; }
}
@keyframes ${k}-blip {
  0% { opacity: 1; }
  12% { opacity: 0.55; }
  30%, 100% { opacity: 0.16; }
}
@keyframes ${k}-twinkle {
  0%, 40%, 100% { opacity: 0.16; }
  50% { opacity: 1; }
  70% { opacity: 0.3; }
}
@media (prefers-reduced-motion: reduce) {
  ${host} ${dot} { animation: none !important; transition: none; }
  ${host}[data-status="working"] ${dot}:not([data-rest]) { opacity: calc(0.2 + var(--tc-pxl-phase) * 0.6); }
}
@media (forced-colors: active) {
  ${dot} { background: CanvasText; }
  ${host}:not([data-status="working"]) ${dot}[data-lit] { background: Highlight; }
}
`;
}
