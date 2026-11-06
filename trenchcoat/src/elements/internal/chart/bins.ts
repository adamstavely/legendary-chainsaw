/** Binning for histograms: round bin edges, a count in each, and how many values fell outside a fixed domain */
import { quantileSorted } from "./geometry";
import { niceStep } from "./scale";

export type BinOptions = {
  /** How many bins to aim for; the edges are rounded, so the count can differ by one or two */
  bins?: number;
  /** The width of each bin; wins over `bins` */
  binWidth?: number;
  /** Only values in [lo, hi] are counted; by default the values' own range */
  domain?: [number, number];
};

export type Bins = {
  /** n + 1 edges for n bins; bin k is [edges[k], edges[k + 1]), the last one closed */
  edges: number[];
  counts: number[];
  /** The values counted */
  n: number;
  /** Values outside `domain`, left out */
  outside: number;
};

/** The fewest and most bins the automatic choice gives */
const MIN_BINS = 5;
const MAX_BINS = 40;
const tidy = (v: number) => Number(v.toPrecision(12));

/** The automatic bin count: Freedman–Diaconis, or Sturges when the middle half has no spread, kept to 5–40 */
export function autoBinCount(sorted: readonly number[], lo: number, hi: number): number {
  const n = sorted.length;
  if (n < 2 || !(hi > lo)) return MIN_BINS;
  const iqr = quantileSorted(sorted, 0.75) - quantileSorted(sorted, 0.25);
  const fd = iqr > 0 ? Math.ceil((hi - lo) / (2 * iqr * Math.pow(n, -1 / 3))) : NaN;
  const k = Number.isFinite(fd) && fd > 0 ? fd : Math.ceil(Math.log2(n)) + 1;
  return Math.max(MIN_BINS, Math.min(MAX_BINS, k));
}

/** Bins the finite values on round edges */
export function binValues(values: readonly number[], opts: BinOptions = {}): Bins {
  const all = values.filter((v) => Number.isFinite(v));
  const dom = opts.domain && Number.isFinite(opts.domain[0]) && Number.isFinite(opts.domain[1]) && opts.domain[1] > opts.domain[0] ? opts.domain : null;
  const v = (dom ? all.filter((x) => x >= dom[0] && x <= dom[1]) : all).sort((a, b) => a - b);
  const outside = all.length - v.length;
  if (!v.length && !dom) return { edges: [], counts: [], n: 0, outside };
  let lo = dom ? dom[0] : v[0];
  let hi = dom ? dom[1] : v[v.length - 1];
  // Every value the same: one unit either side, or a tenth of the value
  if (hi === lo) {
    const d = Math.abs(lo) * 0.1 || 0.5;
    lo -= d;
    hi += d;
  }
  let step = opts.binWidth && opts.binWidth > 0 ? opts.binWidth : niceStep(hi - lo, opts.bins && opts.bins > 0 ? opts.bins : autoBinCount(v, lo, hi));
  // A width that would make an absurd number of bins is widened
  if ((hi - lo) / step > 1000) step = niceStep(hi - lo, MAX_BINS);
  // A fixed domain keeps its own ends; otherwise the ends are rounded out to the step
  const start = dom ? lo : tidy(Math.floor(lo / step + 1e-9) * step);
  let count = Math.max(1, Math.ceil((hi - start) / step - 1e-9));
  if (!dom && tidy(start + count * step) < hi) count++;
  const edges = Array.from({ length: count + 1 }, (_, k) => (dom && k === count ? hi : tidy(start + k * step)));
  const counts = new Array<number>(count).fill(0);
  // A value exactly on an inner edge belongs to the bin it opens; one on the last edge, to the last bin
  for (const x of v) counts[Math.max(0, Math.min(count - 1, Math.floor((x - start) / step + 1e-9)))]++;
  return { edges, counts, n: v.length, outside };
}
