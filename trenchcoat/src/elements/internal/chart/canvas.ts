/*
 * A canvas under a chart's SVG, for more marks than SVG draws smoothly (ported from ztd-charts' CanvasLayer, MIT,
 * © 2026 Junhan2 – https://github.com/Junhan2/ztd-charts). The chart returns canvasUnderlay() from underlay() and
 * paints in paintUnderlay() with paintCanvas(); axes, labels and the active mark stay in the SVG on top.
 *
 * Colours come from the chart's tokens resolved to real colours: a custom property can hold light-dark() or another
 * var(), which a canvas can't read, so each is resolved once per paint through a hidden probe's computed colour.
 */
import { html } from "lit";

/** The canvas element to return from underlay() */
export const canvasUnderlay = () => html`<canvas class="tc-chart__canvas" aria-hidden="true"></canvas>`;

/** Reads a CSS colour (a token like "var(--tc-plot-accent)", or any colour) as the canvas can use it */
export type CanvasColor = (css: string) => string;

/**
 * Sizes the plot's canvas to `width` × `height` at the screen's pixel density (at most 2×), clears it, and calls `draw`
 * with plot px coordinates and a colour reader
 */
export function paintCanvas(plot: HTMLElement, width: number, height: number, draw: (ctx: CanvasRenderingContext2D, color: CanvasColor) => void) {
  const cv = plot.querySelector<HTMLCanvasElement>(".tc-chart__canvas");
  if (!cv) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = Math.max(1, Math.round(width * dpr));
  const H = Math.max(1, Math.round(height * dpr));
  if (cv.width !== W) cv.width = W;
  if (cv.height !== H) cv.height = H;
  const ctx = cv.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  const probe = document.createElement("span");
  probe.style.display = "none";
  plot.append(probe);
  const cache = new Map<string, string>();
  const color: CanvasColor = (css) => {
    let c = cache.get(css);
    if (c === undefined) {
      probe.style.color = "";
      probe.style.color = css;
      c = getComputedStyle(probe).color || "currentcolor";
      cache.set(css, c);
    }
    return c;
  };
  try {
    draw(ctx, color);
  } finally {
    probe.remove();
  }
}
