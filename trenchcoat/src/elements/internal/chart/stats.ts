/* Ported from ztd-charts (MIT, © 2026 Junhan2 – https://github.com/Junhan2/ztd-charts), src/layout/stats.ts. */
/** Statistics: box-plot summaries, kernel density, beeswarm layout, ranks; and trend lines (least squares, LOESS) */
import { quantileSorted } from "./geometry";

export interface BoxStats {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  /** Whisker ends (1.5 IQR) */
  lo: number;
  hi: number;
  mean: number;
  outliers: number[];
  n: number;
}

export function boxStats(values: readonly number[]): BoxStats {
  const s = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  const n = s.length;
  if (!n) return { min: NaN, q1: NaN, median: NaN, q3: NaN, max: NaN, lo: NaN, hi: NaN, mean: NaN, outliers: [], n: 0 };
  const q1 = quantileSorted(s, 0.25);
  const median = quantileSorted(s, 0.5);
  const q3 = quantileSorted(s, 0.75);
  const iqr = q3 - q1;
  const loF = q1 - 1.5 * iqr;
  const hiF = q3 + 1.5 * iqr;
  let lo = s[0];
  let hi = s[n - 1];
  for (const v of s)
    if (v >= loF) {
      lo = v;
      break;
    }
  for (let i = n - 1; i >= 0; i--)
    if (s[i] <= hiF) {
      hi = s[i];
      break;
    }
  let total = 0;
  for (const v of s) total += v;
  return { min: s[0], q1, median, q3, max: s[n - 1], lo, hi, mean: total / n, outliers: s.filter((v) => v < loF || v > hiF), n };
}

/** Gaussian kernel density estimate (Silverman bandwidth) */
export function kde(values: readonly number[], xs: readonly number[], bandwidth?: number): number[] {
  const v = values.filter((x) => Number.isFinite(x));
  const n = v.length;
  if (!n) return xs.map(() => 0);
  const mean = v.reduce((a, b) => a + b, 0) / n;
  // All values equal gives a standard deviation of 0. Use 1/40 of the drawn range (xs) rather than a fixed 1, so other groups' curves aren't flattened
  const range = xs.length > 1 ? Math.abs(xs[xs.length - 1] - xs[0]) : 0;
  const fallback = range > 0 ? range / 40 : Math.abs(mean) * 0.05 || 1;
  const sd = Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / n) || fallback;
  const s = [...v].sort((a, b) => a - b);
  const iqr = quantileSorted(s, 0.75) - quantileSorted(s, 0.25);
  const spread = Math.min(sd, iqr > 0 ? iqr / 1.34 : sd) || sd;
  const bw = bandwidth ?? Math.max(1e-9, 0.9 * spread * Math.pow(n, -0.2));
  const k = 1 / (Math.sqrt(2 * Math.PI) * bw * n);
  // Many values: approximated with binning
  if (n > 2000) {
    const bins = 512;
    const lo = s[0];
    const hi = s[n - 1];
    const step = (hi - lo) / bins || 1;
    const counts = new Array<number>(bins + 1).fill(0);
    for (const x of v) counts[Math.min(bins, Math.floor((x - lo) / step))]++;
    return xs.map((x) => {
      let acc = 0;
      for (let b = 0; b <= bins; b++) {
        if (!counts[b]) continue;
        const u = (x - (lo + b * step)) / bw;
        if (u > 6 || u < -6) continue;
        acc += counts[b] * Math.exp(-0.5 * u * u);
      }
      return acc * k;
    });
  }
  return xs.map((x) => {
    let acc = 0;
    for (const t of v) {
      const u = (x - t) / bw;
      if (u > 6 || u < -6) continue;
      acc += Math.exp(-0.5 * u * u);
    }
    return acc * k;
  });
}

/**
  * Beeswarm layout: x is fixed and y is pushed up or down so circles don't overlap.
  * Placed in x order: the y intervals blocked by circles within 2r in x (the window) are gathered and merged,
  * then a circle sits at 0 if no interval covers 0, else at the nearer end of that interval.
  * Starts and ends are sorted separately (a plain numeric sort) and merged by counting overlaps.
 */
export function beeswarm(xs: readonly number[], radius: number, opts: { maxSpread?: number; padding?: number } = {}): number[] {
  const r = radius + (opts.padding ?? 0.6);
  const d = 2 * r;
  const d2 = d * d;
  const n = xs.length;
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => xs[a] - xs[b]);
  const px = new Float64Array(n);
  const py = new Float64Array(n);
  const ys = new Array<number>(n).fill(0);
  const limit = opts.maxSpread ?? Infinity;
  let starts = new Float64Array(64);
  let ends = new Float64Array(64);
  let head = 0;
  // Circles that found a place (overflowing points don't count as obstacles)
  let count = 0;
  let overflow = 0;
  for (const i of order) {
    const x = xs[i];
    while (head < count && px[head] < x - d) head++;
    if (count - head > starts.length) {
      starts = new Float64Array(2 * (count - head));
      ends = new Float64Array(starts.length);
    }
    // Inside a neighbour's open interval (py - h, py + h) overlaps; just touching is fine.
    // A spot touching two neighbours at once gets a little slack, so rounding doesn't close the gap
    let w = 0;
    for (let j = head; j < count; j++) {
      const dx = x - px[j];
      const h2 = d2 - 1e-6 - dx * dx;
      if (h2 <= 0) continue;
      const h = Math.sqrt(h2);
      starts[w] = py[j] - h;
      ends[w] = py[j] + h;
      w++;
    }
    let y = 0;
    if (w > 0) {
      const S = starts.subarray(0, w).sort();
      const E = ends.subarray(0, w).sort();
      let si = 0;
      let depth = 0;
      let open = 0;
      for (let ei = 0; ei < w; ) {
        // Ends first on a tie: between two intervals that only touch is a free spot
        if (si < w && S[si] < E[ei]) {
          if (depth === 0) {
            open = S[si];
            if (open >= 0) break;
          }
          depth++;
          si++;
        } else {
          depth--;
          if (depth === 0 && E[ei] > 0) {
            const near = -open < E[ei] - 1e-6 ? open : E[ei];
            const far = near === open ? E[ei] : open;
            y = Math.abs(near) <= limit ? near : Math.abs(far) <= limit ? far : NaN;
            break;
          }
          ei++;
        }
      }
    }
    if (Number.isNaN(y)) {
      // A full band spreads points evenly inside it (golden-ratio sequence): overlap allowed, never stacked in a line at the limit
      ys[i] = (((overflow++ * 0.6180339887498949) % 1) * 2 - 1) * limit;
      continue;
    }
    ys[i] = y;
    px[count] = x;
    py[count] = y;
    count++;
  }
  return ys;
}

/** Ranks (1 is the largest); equal values share a rank */
export function ranks(values: readonly number[], desc = true): number[] {
  const idx = values.map((v, i) => ({ v, i })).sort((a, b) => (desc ? b.v - a.v : a.v - b.v));
  const out = new Array<number>(values.length);
  let rank = 0;
  let prev: number | null = null;
  idx.forEach((d, k) => {
    if (prev === null || d.v !== prev) rank = k + 1;
    out[d.i] = rank;
    prev = d.v;
  });
  return out;
}

/* Trend lines (not from ztd-charts) */

/** A least-squares line through points: its slope, intercept and r², and the 95% confidence band's half-width at x */
export interface LinearFit {
  slope: number;
  intercept: number;
  r2: number;
  n: number;
  at(x: number): number;
  /** Half the 95% confidence band of the fitted mean at x */
  half(x: number): number;
}

/** Student's t at 97.5% for df degrees of freedom: the table for 1–2, a Cornish–Fisher expansion above */
function t975(df: number): number {
  if (df <= 1) return 12.706;
  if (df === 2) return 4.303;
  const z = 1.959964;
  return z + (z ** 3 + z) / (4 * df) + (5 * z ** 5 + 16 * z ** 3 + 3 * z) / (96 * df * df);
}

/** The least-squares line through the finite pairs; null with fewer than 3 or when every x is the same */
export function linearFit(xs: readonly number[], ys: readonly number[]): LinearFit | null {
  const px: number[] = [];
  const py: number[] = [];
  for (let i = 0; i < Math.min(xs.length, ys.length); i++)
    if (Number.isFinite(xs[i]) && Number.isFinite(ys[i])) {
      px.push(xs[i]);
      py.push(ys[i]);
    }
  const n = px.length;
  if (n < 3) return null;
  const mx = px.reduce((a, b) => a + b, 0) / n;
  const my = py.reduce((a, b) => a + b, 0) / n;
  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    sxx += (px[i] - mx) ** 2;
    sxy += (px[i] - mx) * (py[i] - my);
    syy += (py[i] - my) ** 2;
  }
  if (sxx <= 0) return null;
  const slope = sxy / sxx;
  const intercept = my - slope * mx;
  let sse = 0;
  for (let i = 0; i < n; i++) sse += (py[i] - (intercept + slope * px[i])) ** 2;
  const r2 = syy > 0 ? Math.max(0, 1 - sse / syy) : 1;
  const se = Math.sqrt(sse / (n - 2));
  const t = t975(n - 2);
  return { slope, intercept, r2, n, at: (x) => intercept + slope * x, half: (x) => t * se * Math.sqrt(1 / n + (x - mx) ** 2 / sxx) };
}

/** A LOESS curve: at each of `at`, a line fitted to the nearest `span` share of the points, weighted by distance (tricube) */
export function loess(xs: readonly number[], ys: readonly number[], at: readonly number[], span = 0.75): number[] {
  const pts: [number, number][] = [];
  for (let i = 0; i < Math.min(xs.length, ys.length); i++) if (Number.isFinite(xs[i]) && Number.isFinite(ys[i])) pts.push([xs[i], ys[i]]);
  const n = pts.length;
  if (n < 3) return at.map(() => NaN);
  const q = Math.min(n, Math.max(3, Math.ceil(span * n)));
  return at.map((x0) => {
    const d = pts.map(([x]) => Math.abs(x - x0)).sort((a, b) => a - b);
    const h = d[q - 1] || 1e-9;
    let sw = 0;
    let swx = 0;
    let swy = 0;
    let swxx = 0;
    let swxy = 0;
    for (const [x, y] of pts) {
      const u = Math.abs(x - x0) / h;
      if (u >= 1) continue;
      const w = (1 - u ** 3) ** 3;
      sw += w;
      swx += w * x;
      swy += w * y;
      swxx += w * x * x;
      swxy += w * x * y;
    }
    if (sw <= 0) return NaN;
    const den = sw * swxx - swx * swx;
    // Every nearby point at one x: their weighted mean
    if (Math.abs(den) < 1e-12 * Math.max(1, sw * swxx)) return swy / sw;
    const b = (sw * swxy - swx * swy) / den;
    return (swy - b * swx) / sw + b * x0;
  });
}
