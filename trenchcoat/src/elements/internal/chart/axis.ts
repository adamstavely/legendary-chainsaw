/* Ported from ztd-charts (MIT, © 2026 Junhan2 – https://github.com/Junhan2/ztd-charts), src/core/axis.tsx. */
/* The charts' axes: grid lines with their values, band labels thinned so they never overlap, and the text helper */
import { nothing, svg } from "lit";
import { AXIS_FONT } from "./element";
import { formatNumber, type ValueFormatter } from "./format";
import { textWidth } from "./text";

const r1 = (v: number) => Math.round(v * 10) / 10;

/** Drawn text, in plot px; `strong` makes it the primary ink and weight */
export function txt(x: number, y: number, text: unknown, opts: { anchor?: "start" | "middle" | "end"; cls?: "tick" | "value"; strong?: boolean; opacity?: number; baseline?: "central" | "hanging" | "auto" } = {}) {
  const b = opts.baseline ?? "central";
  const op = opts.opacity === undefined || opts.opacity >= 1 ? nothing : Math.max(0, opts.opacity);
  return svg`<text class=${`tc-chart__${opts.cls ?? "tick"}`} ?data-strong=${!!opts.strong} x=${r1(x)} y=${r1(y)}
    dy=${b === "central" ? "0.35em" : b === "hanging" ? "0.75em" : nothing} text-anchor=${opts.anchor ?? "start"} opacity=${op}>${text}</text>`;
}

/** Tick labels; when shortened ones repeat (10K, 10K, 10K) the axis writes them in full */
export function tickLabels(ticks: readonly number[], fmt: ValueFormatter, locale?: string): string[] {
  const out = ticks.map(fmt);
  if (new Set(out).size === out.length) return out;
  return ticks.map((t) => formatNumber(t, { locale, maximumFractionDigits: 2 }));
}

/** How wide the value axis must be for its labels */
export function yAxisWidth(ticks: number[], fmt: ValueFormatter, locale?: string): number {
  let w = 18;
  for (const l of tickLabels(ticks, fmt, locale)) w = Math.max(w, textWidth(l, AXIS_FONT));
  return Math.ceil(w + 8);
}

/** Horizontal grid lines at the ticks, with their values at the left (or right) */
export function gridY(o: { ticks: number[]; y: (v: number) => number; x0: number; x1: number; fmt: ValueFormatter; labels?: boolean; side?: "left" | "right"; locale?: string }) {
  const right = o.side === "right";
  const labels = o.labels === false ? null : tickLabels(o.ticks, o.fmt, o.locale);
  return svg`<g>${o.ticks.map((t, i) => {
    const yy = Math.round(o.y(t)) + 0.5;
    return svg`<line class="tc-chart__grid" ?data-zero=${t === 0} x1=${o.x0} x2=${o.x1} y1=${yy} y2=${yy}></line>
      ${labels ? txt(right ? o.x1 + 6 : o.x0 - 6, yy, labels[i], { anchor: right ? "start" : "end" }) : nothing}`;
  })}</g>`;
}

/** Vertical grid lines at the ticks, with their values below */
export function gridX(o: { ticks: number[]; x: (v: number) => number; y0: number; y1: number; fmt: ValueFormatter; locale?: string }) {
  const labels = tickLabels(o.ticks, o.fmt, o.locale);
  return svg`<g>${o.ticks.map((t, i) => {
    const xx = Math.round(o.x(t)) + 0.5;
    return svg`<line class="tc-chart__grid" ?data-zero=${t === 0} x1=${xx} x2=${xx} y1=${o.y0} y2=${o.y1}></line>${txt(o.x(t), o.y1 + 11, labels[i], { anchor: "middle" })}`;
  })}</g>`;
}

/** Centred x labels that sit within 8px of the one before, or outside [lo, hi], are left out */
export function fitTickLabels<T extends { x: number; label: string }>(ticks: readonly T[], lo: number, hi: number): T[] {
  const keep: T[] = [];
  let lastR = -Infinity;
  for (const t of ticks) {
    const w = textWidth(t.label, AXIS_FONT);
    const l = Math.max(t.x - w / 2, 0);
    if (l < lastR + 8 || t.x - w / 2 < lo || t.x + w / 2 > hi) continue;
    keep.push(t);
    lastR = l + w;
  }
  return keep;
}

/**
 * Which band labels to show so none overlap. `keep` (a waterfall's totals, the highlighted ones) always stays, and the
 * rest are thinned round it
 */
export function thinLabels(centers: number[], labels: string[], size = AXIS_FONT, gap = 8, weight = 400, keep?: ReadonlySet<number>): number[] {
  const n = labels.length;
  if (n <= 1) return labels.map((_, i) => i);
  const widths = labels.map((l) => textWidth(l, size, weight));
  const near = (a: number, b: number) => Math.abs(centers[b] - centers[a]) < (widths[a] + widths[b]) / 2 + gap;
  // Kept labels that overlap each other: only the first stays, or no spacing would ever work and all would go
  const must: number[] = [];
  for (const k of keep ?? []) if (!must.some((m) => near(m, k))) must.push(k);
  const free = (i: number) => !must.some((m) => near(m, i));
  for (let step = 1; step <= n; step++) {
    const idx = must.slice();
    for (let i = 0; i < n; i += step) if (free(i)) idx.push(i);
    if (step > 1 && (n - 1) % step > step / 2 && free(n - 1)) idx.push(n - 1);
    idx.sort((a, b) => a - b);
    if (idx.every((b, k) => !k || !near(idx[k - 1], b))) return idx;
  }
  return [0, n - 1];
}

/** The category labels under bands, thinned; the `strong` ones in the primary ink */
export function axisXBand(o: { labels: string[]; centers: number[]; y: number; strong?: ReadonlySet<number> }) {
  const show = thinLabels(o.centers, o.labels, AXIS_FONT, 6, 600, o.strong);
  return svg`<g>${show.map((i) => txt(o.centers[i], o.y, o.labels[i], { anchor: "middle", strong: o.strong?.has(i) }))}</g>`;
}
