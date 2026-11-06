/* Ported from ztd-charts (MIT, © 2026 Junhan2 – https://github.com/Junhan2/ztd-charts), src/core/series.ts. */
/** Long or wide tables as a series matrix, and thinning it */
import { DEFAULT_LOCALE, isYear, toDate } from "./format";
import { lazyArray } from "./lazy";
import { getter, toNumber, uniq } from "./accessor";
import type { Accessor } from "./types";

export type XType = "number" | "date" | "band";

export interface SeriesModel<T> {
  type: XType;
  /** Unique keys, sorted by x */
  keys: string[];
  /** Each key's numeric position (index for band, ms for date) */
  xnum: number[];
  /** Display labels */
  labels: string[];
  series: string[];
  /** values[s][k]; NaN where there's no value */
  values: number[][];
  rows: (T | null)[][];
}

const DATE_RE = /^\d{4}-\d{1,2}(-\d{1,2})?([T ][\d:.]+(Z|[+-]\d{2}:?\d{2})?)?$/;

export function detectXType(raw: readonly unknown[]): XType {
  const vals = raw.filter((v) => v !== null && v !== undefined && v !== "");
  if (!vals.length) return "band";
  if (vals.every((v) => v instanceof Date)) return "date";
  if (vals.every((v) => typeof v === "string" && DATE_RE.test(v.trim()))) return "date";
  if (vals.every((v) => typeof v === "number" || (typeof v === "string" && /^-?\d+(\.\d+)?$/.test(v.trim())))) {
    return "number";
  }
  return "band";
}

export interface PrepOptions {
  xType?: XType;
  locale?: string;
  dateFormat?: Intl.DateTimeFormatOptions;
  /** Sums repeats of the same x and series. Default true */
  sum?: boolean;
}

/**
  * A long table (x, y, series) or a wide one (x plus several value columns) as a series matrix.
  * An array for y makes those columns the series.
 */
export function prepSeries<T>(data: readonly T[], x: Accessor<T, unknown> | undefined, y: Accessor<T, unknown> | readonly string[] | undefined, series: Accessor<T, unknown> | undefined, opts: PrepOptions = {}): SeriesModel<T> {
  const getX = getter(x, "x");
  const wide = Array.isArray(y);
  const yKeys = wide ? (y as readonly string[]) : null;
  const getY = wide ? null : getter(y as Accessor<T, unknown> | undefined, "y");
  const getS = !wide && series !== undefined ? getter(series, "series") : null;
  const rawX = data.map((d, i) => getX(d, i));
  const type = opts.xType ?? detectXType(rawX);
  const locale = opts.locale ?? DEFAULT_LOCALE;
  // x is read once (parsing dates twice over 10,000 rows is noticeably slow)
  let keys: string[];
  let xnum: number[];
  let rowKey: Int32Array;
  if (type === "band") {
    const strs = rawX.map((v) => String(v ?? ""));
    keys = uniq(strs);
    const kIndex = new Map(keys.map((k, i) => [k, i]));
    xnum = keys.map((_, i) => i);
    rowKey = Int32Array.from(strs, (k) => kIndex.get(k) ?? -1);
  } else {
    const nums = rawX.map((v) => (type === "date" ? toDate(v)?.getTime() ?? NaN : toNumber(v)));
    const uniqNums = Array.from(new Set(nums.filter((n) => Number.isFinite(n)))).sort((a, b) => a - b);
    const kIndex = new Map(uniqNums.map((n, i) => [n, i]));
    xnum = uniqNums;
    keys = uniqNums.map(String);
    rowKey = Int32Array.from(nums, (n) => kIndex.get(n) ?? -1);
  }
  let dfmt = opts.dateFormat;
  if (type === "date" && !dfmt) {
    const span = xnum.length > 1 ? xnum[xnum.length - 1] - xnum[0] : 0;
    const monthly = rawX.length < 5000 && rawX.every((v) => typeof v === "string" && /^\d{4}-\d{1,2}$/.test(v.trim()));
    dfmt = monthly || span > 86400000 * 120 ? { month: "short" } : span < 86400000 * 2 ? { month: "numeric", day: "numeric", hour: "numeric", minute: "2-digit" } : { month: "numeric", day: "numeric" };
    if (span > 86400000 * 800) dfmt = { year: "numeric", month: "short" };
  }
  let labels: string[];
  if (type === "band") labels = keys;
  else {
    // Numeric x to 6 decimals (so 0.001 and 0.002 don't both become "0"); four-digit integers only are years, without grouping ("2019", not "2,019")
    const year = xnum.every(isYear);
    const fmt = type === "date" ? new Intl.DateTimeFormat(locale, dfmt) : new Intl.NumberFormat(locale, year ? { useGrouping: false } : { maximumFractionDigits: 6 });
    labels = xnum.length > 1000 ? lazyArray(xnum.length, (i) => fmt.format(xnum[i])) : xnum.map((n) => fmt.format(n));
  }
  const seriesNames = yKeys ? [...yKeys] : getS ? uniq(data.map((d, i) => String(getS(d, i) ?? ""))) : [""];
  const sIndex = new Map(seriesNames.map((s, i) => [s, i]));
  const values = seriesNames.map(() => new Array<number>(keys.length).fill(NaN));
  const rows = seriesNames.map(() => new Array<T | null>(keys.length).fill(null));
  const add = (s: number, k: number, v: number, d: T) => {
    const prev = values[s][k];
    values[s][k] = Number.isFinite(prev) && opts.sum !== false ? prev + (Number.isFinite(v) ? v : 0) : v;
    rows[s][k] = d;
  };
  for (let i = 0; i < data.length; i++) {
    const k = rowKey[i];
    if (k < 0) continue;
    const d = data[i];
    if (yKeys) {
      for (let s = 0; s < yKeys.length; s++) add(s, k, toNumber((d as Record<string, unknown>)[yKeys[s]]), d);
    } else {
      const s = getS ? sIndex.get(String(getS(d, i) ?? "")) ?? 0 : 0;
      add(s, k, toNumber(getY!(d, i)), d);
    }
  }
  return { type, keys, xnum, labels, series: seriesNames, values, rows };
}

/**
  * Thins x to bucket averages. Every series shares the same x, so stacked charts (area, stream) keep their layers aligned.
  * Each bucket's key and label are its middle one's.
 */
export function bucketSeries<T>(m: SeriesModel<T>, maxPoints: number): SeriesModel<T> {
  const n = m.keys.length;
  if (n <= maxPoints || maxPoints < 2) return m;
  const size = n / maxPoints;
  const pick: number[] = [];
  const ranges: [number, number][] = [];
  for (let b = 0; b < maxPoints; b++) {
    const a = Math.floor(b * size);
    const e = Math.min(n, Math.floor((b + 1) * size));
    if (e <= a) continue;
    ranges.push([a, e]);
    pick.push(b === 0 ? 0 : b === maxPoints - 1 ? n - 1 : Math.floor((a + e - 1) / 2));
  }
  const values = m.values.map((row) =>
    ranges.map(([a, e]) => {
      let s = 0;
      let c = 0;
      for (let k = a; k < e; k++)
        if (Number.isFinite(row[k])) {
          s += row[k];
          c++;
        }
      return c ? s / c : NaN;
    }),
  );
  return {
    type: m.type,
    keys: pick.map((k) => m.keys[k]),
    xnum: m.type === "band" ? pick.map((_, i) => i) : pick.map((k) => m.xnum[k]),
    labels: lazyArray(pick.length, (i) => m.labels[pick[i]]),
    series: m.series,
    values,
    rows: m.rows.map((r) => pick.map((k) => r[k])),
  };
}
